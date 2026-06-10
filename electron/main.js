'use strict';

/**
 * electron/main.js — Absenku Net (Electron wrapper)
 *
 * Main window = launcher dashboard (electron/launcher.html)
 * User starts tunnels on-demand; Cloudflare URL appears when ready.
 */

const {
  app, BrowserWindow, Tray, Menu, nativeImage,
  ipcMain, Notification, shell, clipboard,
} = require('electron');
const path    = require('path');
const fs      = require('fs');
const os      = require('os');
const QRCode  = require('qrcode');

// ── Paths ─────────────────────────────────────────────────────────────────────
const ROOT      = path.join(__dirname, '..');
const CFG_FILE  = path.join(app.getPath('userData'), 'absenkurc.json');
const ICON_FILE = path.join(__dirname, 'icon.png');

// ── Default config ────────────────────────────────────────────────────────────
// routes: flat array { tunnelId, tunnelName, hostname, port }
const DEFAULT_CFG = { pass: '', autoStart: [], labels: {}, domains: {}, routes: [] };

// ── Runtime state ─────────────────────────────────────────────────────────────
let _cfg         = DEFAULT_CFG;
let _inspPort    = 0;
let _tray        = null;
let _launcherWin = null;
let _settingsWin = null;
let _isQuitting  = false;

/**
 * Per-tunnel tracking (keyed by localPort number):
 * { localPort, tunnelPort, clientPort, tunnelSrv, clientSrv, client, cfProc,
 *   status: 'starting'|'live'|'stopped', url: string|null }
 */
const _tunnelMap = new Map();

// ── Load absenku modules ──────────────────────────────────────────────────────
const state      = require(path.join(ROOT, 'lib/state'));
const { findFreePort }       = require(path.join(ROOT, 'lib/utils'));
const { createTunnelServer, attachWebSocketProxy } = require(path.join(ROOT, 'lib/tunnel-server'));
const { createClientServer } = require(path.join(ROOT, 'lib/client-server'));
const inspectorServer        = require(path.join(ROOT, 'lib/inspector-server'));
const { createClient }       = require(path.join(ROOT, 'lib/tunnel-client'));
const cloudflared            = require(path.join(ROOT, 'lib/cloudflared'));
const persist                = require(path.join(ROOT, 'lib/persist'));

// ── Config helpers ────────────────────────────────────────────────────────────
function loadConfig() {
  try {
    if (fs.existsSync(CFG_FILE)) {
      return { ...DEFAULT_CFG, ...JSON.parse(fs.readFileSync(CFG_FILE, 'utf8')) };
    }
  } catch (e) { console.warn('Config parse error:', e.message); }
  return { ...DEFAULT_CFG };
}

function saveConfig(cfg) {
  try {
    fs.mkdirSync(path.dirname(CFG_FILE), { recursive: true });
    fs.writeFileSync(CFG_FILE, JSON.stringify(cfg, null, 2));
    return true;
  } catch (e) { console.error('Config save error:', e.message); return false; }
}

// ── Push tunnel state to launcher window ─────────────────────────────────────
function pushUpdate() {
  if (!_launcherWin || _launcherWin.isDestroyed()) return;
  _launcherWin.webContents.send('tunnel-update', _snapshotTunnels());
  refreshTray();
}

function _snapshotTunnels() {
  const labels    = _cfg.labels    || {};
  const autoStart = _cfg.autoStart || [];
  return [..._tunnelMap.values()].map(t => ({
    localPort : t.localPort,
    status    : t.status,
    url       : t.url,
    inspUrl   : `http://localhost:${_inspPort}`,
    startedAt      : t.startedAt || null,
    label          : labels[t.localPort] || null,
    autoStart      : autoStart.includes(t.localPort),
    reconnectCount : t.reconnectCount || 0,
    urlHistory     : t.urlHistory || [],
    customDomain   : t.customDomain || null,
    tunnelId       : t.tunnelId || null,
  }));
}

// ── Dynamic tunnel: start ─────────────────────────────────────────────────────
async function startTunnel(localPort, opts = {}) {
  if (_tunnelMap.has(localPort)) {
    const t = _tunnelMap.get(localPort);
    if (t.status !== 'stopped') return { ok: false, error: `Port ${localPort} sudah berjalan` };
    // stopped → restart (preserve opts from existing entry if not overridden)
    if (!opts.customDomain && t.customDomain) {
      opts = { customDomain: t.customDomain, tunnelId: t.tunnelId };
    }
    _tunnelMap.delete(localPort);
    state.tunnels.delete(localPort);
  }

  const tunnelPort = await findFreePort(3000);
  const clientPort = await findFreePort(4040);

  const entry = {
    localPort, tunnelPort, clientPort,
    tunnelSrv: null, clientSrv: null, client: null, cfProc: null,
    status: 'starting', url: null,
    startedAt: Date.now(),
    reconnectCount: 0,
    urlHistory: [],
    customDomain : opts.customDomain || null,
    tunnelId     : opts.tunnelId     || null,
  };
  _tunnelMap.set(localPort, entry);
  state.tunnels.set(localPort, { clientSSE: null, pending: new Map(), tunnelPort, publicUrl: null });

  // Persist domain config
  if (opts.customDomain && opts.tunnelId) {
    if (!_cfg.domains) _cfg.domains = {};
    _cfg.domains[localPort] = { customDomain: opts.customDomain, tunnelId: opts.tunnelId };
    saveConfig(_cfg);
  }

  // Start servers
  entry.tunnelSrv = createTunnelServer(localPort);
  attachWebSocketProxy(entry.tunnelSrv, localPort);
  entry.clientSrv = createClientServer(localPort);

  await new Promise(r =>
    entry.tunnelSrv.listen(tunnelPort, () => entry.clientSrv.listen(clientPort, r))
  );

  // Connect tunnel client
  entry.client = createClient();
  entry.client.connect({ localPort, serverHost: 'localhost', clientPort });

  // Spawn cloudflared
  _attachCloudflared(localPort, tunnelPort, opts);

  pushUpdate();
  return { ok: true };
}

/**
 * Spawn (or re-spawn) cloudflared for a tunnel entry.
 * Handles crash detection and auto-restart with exponential backoff.
 * opts: { customDomain?, tunnelId? } — if set, uses named tunnel instead of Quick Tunnel.
 */
function _attachCloudflared(localPort, tunnelPort, opts = {}, retryDelay = 3000) {
  const t = _tunnelMap.get(localPort);
  if (!t || t.status === 'stopped') return;

  const onURL = url => {
    const entry = _tunnelMap.get(localPort);
    if (!entry || entry.status === 'stopped') return;

    entry.status = 'live';
    entry.url    = url;
    if (!entry.urlHistory.includes(url)) entry.urlHistory.push(url);
    state.tunnels.get(localPort).publicUrl = url;

    if (!_cfg.autoStart.includes(localPort)) {
      _cfg.autoStart.push(localPort);
      saveConfig(_cfg);
    }

    pushUpdate();
    console.log(`✅ :${localPort} → ${url}`);

    if (Notification.isSupported()) {
      new Notification({
        title: 'Absenku Net — Tunnel Ready',
        body : `:${localPort} → ${url}`,
        icon : ICON_FILE,
      }).show();
    }
  };

  const cfProc = (opts.customDomain && opts.tunnelId)
    ? cloudflared.startNamedTunnel(opts.tunnelId, tunnelPort, opts.customDomain, onURL, _cfEnv())
    : cloudflared.startTunnel(tunnelPort, onURL);

  t.cfProc = cfProc;

  // Log all cloudflared stderr for debugging
  cfProc.stderr?.on('data', chunk => {
    const text = chunk.toString();
    // Filter out the URL line (already handled) — log everything else
    if (!text.includes('trycloudflare.com') && !text.includes(opts.customDomain)) {
      process.stdout.write(`[cf:${localPort}] ${text}`);
    }
  });

  // Auto-restart when cloudflared exits unexpectedly
  cfProc.on('close', (code, signal) => {
    const entry = _tunnelMap.get(localPort);
    if (!entry || entry.status === 'stopped') return; // intentional stop — ignore

    entry.reconnectCount++;
    console.warn(`⚠  :${localPort} cloudflared exited (code=${code} signal=${signal}) — retry in ${retryDelay / 1000}s [reconnect #${entry.reconnectCount}]`);
    entry.status = 'reconnecting';
    entry.url    = null;
    pushUpdate();

    const next = Math.min(retryDelay * 2, 30_000);
    setTimeout(() => _attachCloudflared(localPort, tunnelPort, opts, next), retryDelay);
  });
}

// ── Dynamic tunnel: stop ──────────────────────────────────────────────────────
function stopTunnel(localPort) {
  const t = _tunnelMap.get(localPort);
  if (!t) return { ok: false, error: 'Tunnel tidak ditemukan' };

  // Set stopped FIRST so the close handler doesn't trigger auto-restart
  t.status = 'stopped';
  t.url    = null;
  state.tunnels.delete(localPort);

  try { t.cfProc?.kill(); }       catch {}
  try { t.client?.disconnect(); } catch {}
  try { t.clientSrv?.close(); }   catch {}
  try { t.tunnelSrv?.close(); }   catch {}

  // Remove from autoStart
  _cfg.autoStart = (_cfg.autoStart || []).filter(p => p !== localPort);
  saveConfig(_cfg);

  pushUpdate();
  return { ok: true };
}

// ── Launcher (main) window ────────────────────────────────────────────────────

/**
 * Show the launcher window safely.
 * On macOS, hiding + re-showing a BrowserWindow can leave the renderer
 * suspended (black screen). Fix: call webContents.invalidate() after show
 * so the GPU compositing pipeline repaints the frame.
 */
function _showLauncherWin() {
  if (!_launcherWin || _launcherWin.isDestroyed()) {
    createLauncherWindow();
    return;
  }
  if (_launcherWin.isMinimized()) _launcherWin.restore();
  _launcherWin.show();
  _launcherWin.focus();
  // Force repaint — fixes macOS black window after hide/show
  if (process.platform === 'darwin') {
    setTimeout(() => {
      if (_launcherWin && !_launcherWin.isDestroyed()) {
        _launcherWin.webContents.invalidate();
      }
    }, 50);
  }
}

function createLauncherWindow() {
  _launcherWin = new BrowserWindow({
    width          : 760,
    height         : 560,
    minWidth       : 600,
    minHeight      : 420,
    fullscreen     : true,
    title          : 'Absenku Net',
    icon           : ICON_FILE,
    backgroundColor: '#0a0b14',
    webPreferences : {
      nodeIntegration : false,
      contextIsolation: true,
      preload         : path.join(__dirname, 'launcher-preload.js'),
    },
    show: false,
  });

  _launcherWin.setMenuBarVisibility(false);
  _launcherWin.once('ready-to-show', () => _launcherWin.show());
  _launcherWin.on('close', e => {
    if (!_isQuitting) {
      e.preventDefault();
      _launcherWin.hide();
      // Remove from Dock while hidden (tray-only mode)
      if (process.platform === 'darwin') app.dock?.hide();
    }
  });

  _launcherWin.loadFile(path.join(__dirname, 'launcher.html'));
}

// ── Settings window ───────────────────────────────────────────────────────────
function openSettings() {
  if (_settingsWin && !_settingsWin.isDestroyed()) { _settingsWin.focus(); return; }
  _settingsWin = new BrowserWindow({
    width : 440, height: 320,
    title : 'Absenku Net Settings',
    icon  : ICON_FILE,
    resizable      : false,
    backgroundColor: '#0a0b14',
    parent  : _launcherWin || undefined,
    modal   : false,
    webPreferences: {
      nodeIntegration : false,
      contextIsolation: true,
      preload         : path.join(__dirname, 'preload.js'),
    },
  });
  _settingsWin.setMenuBarVisibility(false);
  _settingsWin.loadFile(path.join(__dirname, 'settings.html'));
  _settingsWin.on('closed', () => { _settingsWin = null; });
}

// ── Tray ──────────────────────────────────────────────────────────────────────
function buildTrayMenu() {
  const tunnelItems = [..._tunnelMap.values()]
    .filter(t => t.status === 'live')
    .map(t => ({
      label  : `:${t.localPort}  →  ${t.url}`,
      click  : () => { if (t.url) shell.openExternal(t.url); },
    }));

  return Menu.buildFromTemplate([
    { label: '⚡ Absenku Net', enabled: false },
    { type: 'separator' },
    {
      label: 'Buka Dashboard',
      click: () => _showLauncherWin(),
    },
    ...(tunnelItems.length ? [{ type: 'separator' }, ...tunnelItems] : []),
    { type: 'separator' },
    { label: 'Settings…', click: openSettings },
    { type: 'separator' },
    { label: 'Keluar', click: () => { _isQuitting = true; app.quit(); } },
  ]);
}

function createTray() {
  const trayIcon = nativeImage.createFromPath(ICON_FILE).resize({ width: 16, height: 16 });
  trayIcon.setTemplateImage(true); // macOS: ikuti warna menu bar (light/dark)
  _tray = new Tray(trayIcon);
  _tray.setToolTip('Absenku Net');
  _tray.setContextMenu(buildTrayMenu());
  _tray.on('click', () => _showLauncherWin());
}

function refreshTray() {
  if (_tray && !_tray.isDestroyed()) _tray.setContextMenu(buildTrayMenu());
}

// ── Inspector server init ─────────────────────────────────────────────────────
async function startInspector() {
  await cloudflared.ensureCloudflared();
  _inspPort       = await findFreePort(4040);
  state.INSP_PORT = _inspPort;
  if (_cfg.pass) process.env.INSPECTOR_PASS = _cfg.pass;

  await new Promise(r => inspectorServer.listen(_inspPort, r));
  persist.load();
  console.log(`▶  Inspector → http://localhost:${_inspPort}`);
}

// ── Graceful shutdown ─────────────────────────────────────────────────────────
function cleanup() {
  persist.saveSync();
  for (const t of _tunnelMap.values()) {
    try { t.cfProc?.kill(); }       catch {}
    try { t.client?.disconnect(); } catch {}
    try { t.clientSrv?.close(); }   catch {}
    try { t.tunnelSrv?.close(); }   catch {}
  }
  try { inspectorServer.close(); } catch {}
}

// ── IPC handlers ──────────────────────────────────────────────────────────────
ipcMain.handle('start-tunnel',  (_e, port, opts) => startTunnel(Number(port), opts || {}));
ipcMain.handle('stop-tunnel',   (_e, port) => stopTunnel(Number(port)));
ipcMain.handle('delete-tunnel', (_e, port) => {
  const lp = Number(port);
  stopTunnel(lp);                   // stop first (sets status='stopped', kills procs)
  _tunnelMap.delete(lp);            // remove from list entirely
  _cfg.autoStart = (_cfg.autoStart || []).filter(p => p !== lp);
  saveConfig(_cfg);
  pushUpdate();
  return { ok: true };
});
ipcMain.handle('delete-all-tunnels', () => {
  for (const lp of [..._tunnelMap.keys()]) stopTunnel(lp);
  _tunnelMap.clear();
  _cfg.autoStart = [];
  saveConfig(_cfg);
  pushUpdate();
  return { ok: true };
});
ipcMain.handle('list-tunnels',  ()          => _snapshotTunnels());
ipcMain.handle('get-insp-port', ()          => _inspPort);
ipcMain.handle('open-inspector',()          => _showLauncherWin());
ipcMain.handle('open-external', (_e, url)  => shell.openExternal(url));
ipcMain.handle('open-settings', ()          => openSettings());
ipcMain.handle('copy-text',     (_e, text) => { clipboard.writeText(text); return true; });
ipcMain.handle('generate-qr', async (_e, url) => {
  try {
    return await QRCode.toDataURL(url, { width: 256, margin: 2,
      color: { dark: '#000000', light: '#ffffff' } });
  } catch { return null; }
});
ipcMain.handle('set-label', (_e, port, label) => {
  if (!_cfg.labels) _cfg.labels = {};
  const lp = Number(port);
  if (label && label.trim()) _cfg.labels[lp] = label.trim();
  else delete _cfg.labels[lp];
  saveConfig(_cfg);
  pushUpdate();
  return { ok: true };
});
ipcMain.handle('toggle-autostart', (_e, port) => {
  const lp  = Number(port);
  const arr = _cfg.autoStart || [];
  _cfg.autoStart = arr.includes(lp) ? arr.filter(p => p !== lp) : [...arr, lp];
  saveConfig(_cfg);
  pushUpdate();
  return { ok: true, enabled: _cfg.autoStart.includes(lp) };
});
// ── Cloudflare Login IPC ──────────────────────────────────────────────────────

/** Env vars untuk cloudflared saat mode API Token */
function _cfEnv() {
  if (_cfg.cfApiToken && _cfg.cfAccountId) {
    return {
      ...process.env,
      CLOUDFLARE_API_TOKEN : _cfg.cfApiToken,
      CLOUDFLARE_ACCOUNT_ID: _cfg.cfAccountId,
    };
  }
  return process.env;
}

ipcMain.handle('cf:login-status', () => ({
  loggedIn: cloudflared.checkLoginStatus() || !!(_cfg.cfApiToken && _cfg.cfAccountId),
  mode: _cfg.cfLoginMode || 'sso',
}));

ipcMain.handle('cf:logout', () => {
  const certPath = path.join(os.homedir(), '.cloudflared', 'cert.pem');
  try {
    if (fs.existsSync(certPath)) fs.unlinkSync(certPath);
    // Hapus login mode, tapi cfApiToken & cfZoneId tetap tersimpan
    _cfg.cfLoginMode  = null;
    _cfg.cfAccountId  = null;
    saveConfig(_cfg);
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
});

// Login via API Token — tanpa cert.pem, gunakan CLOUDFLARE_API_TOKEN env var
ipcMain.handle('cf:login-api-token', async (_e, { token, accountId }) => {
  if (!token || !accountId) return { ok: false, error: 'Token dan Account ID wajib diisi' };
  // Verifikasi token ke CF API
  try {
    const res = await _cfApiRequest(token, '/user/tokens/verify');
    if (!res.success) return { ok: false, error: res.errors?.[0]?.message || 'Token tidak valid' };
  } catch (e) { return { ok: false, error: e.message }; }

  _cfg.cfApiToken   = token;
  _cfg.cfAccountId  = accountId;
  _cfg.cfLoginMode  = 'api-token';
  saveConfig(_cfg);
  return { ok: true };
});

let _loginProc = null;
let _loginAuthWin = null;

ipcMain.handle('cf:login-cancel', () => {
  if (_loginProc)    { try { _loginProc.kill(); }       catch {} _loginProc    = null; }
  if (_loginAuthWin) { try { _loginAuthWin.destroy(); } catch {} _loginAuthWin = null; }
  // Clear ephemeral session agar next login selalu fresh
  try {
    const { session } = require('electron');
    session.fromPartition('cf-login-tmp').clearStorageData().catch(() => {});
  } catch {}
  return { ok: true };
});

ipcMain.handle('cf:login', () => new Promise((resolve) => {
  const certPath = path.join(os.homedir(), '.cloudflared', 'cert.pem');
  if (fs.existsSync(certPath)) { resolve({ ok: true }); return; }

  const { spawn: _spawn } = require('child_process');

  // Buat fake browser opener agar cloudflared tidak buka browser sendiri.
  // cloudflared memanggil `open` (macOS) / `xdg-open` (Linux) dari PATH.
  // Kita buat skrip kosong di tmpdir dan inject ke depan PATH.
  let fakeBinDir = null;
  try {
    fakeBinDir = fs.mkdtempSync(path.join(os.tmpdir(), 'absenku-login-'));
    const names = process.platform === 'linux' ? ['xdg-open', 'x-www-browser', 'sensible-browser'] : ['open'];
    for (const name of names) {
      const p = path.join(fakeBinDir, name);
      fs.writeFileSync(p, '#!/bin/sh\nexit 0\n', 'utf8');
      fs.chmodSync(p, 0o755);
    }
  } catch {}

  const injectedPath = fakeBinDir
    ? `${fakeBinDir}:${process.env.PATH || ''}`
    : process.env.PATH;

  const proc = _spawn(cloudflared.BIN_PATH, ['tunnel', 'login'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PATH: injectedPath },
  });
  _loginProc = proc;

  // Cleanup fake bin dir saat proses selesai
  proc.on('close', () => {
    if (fakeBinDir) try { fs.rmSync(fakeBinDir, { recursive: true, force: true }); } catch {}
  });

  let resolved  = false;
  let pollTimer = null;

  const done = (ok, error) => {
    if (resolved) return;
    resolved = true;
    clearInterval(pollTimer);
    clearTimeout(loginTimeout);
    try { proc.kill(); } catch {}
    _loginProc = null;
    if (_loginAuthWin && !_loginAuthWin.isDestroyed()) {
      _loginAuthWin.destroy();
      _loginAuthWin = null;
    }
    if (ok) {
      _cfg.cfLoginMode = 'sso';
      saveConfig(_cfg);
    }
    resolve(ok ? { ok: true } : { ok: false, error });
  };

  // Poll cert.pem setiap 500ms — cloudflared tulis file ini setelah user authorize
  pollTimer = setInterval(() => {
    if (fs.existsSync(certPath)) done(true);
  }, 500);

  // Timeout 5 menit
  const loginTimeout = setTimeout(() => done(false, 'Timeout: login tidak selesai dalam 5 menit'), 5 * 60 * 1000);

  // Buka URL di embedded BrowserWindow (bukan browser external)
  const onData = text => {
    if (_loginAuthWin) return; // sudah dibuka
    const m = text.match(/https:\/\/dash\.cloudflare\.com\/argotunnel[^\s]*/);
    if (!m) return;

    const authURL = m[0];

    // Tampilkan loading window dengan instruksi sebelum buka CF
    _loginAuthWin = new BrowserWindow({
      width          : 560,
      height         : 720,
      title          : 'Authorize Cloudflare Tunnel',
      parent         : _launcherWin,
      modal          : true,
      resizable      : false,
      minimizable    : false,
      maximizable    : false,
      autoHideMenuBar: true,
      backgroundColor: '#ffffff',
      webPreferences : {
        nodeIntegration  : false,
        contextIsolation : true,
        // Pakai ephemeral session (tanpa persist) agar flow authorize selalu fresh
        partition        : 'cf-login-tmp',
      },
    });

    _loginAuthWin.setMenuBarVisibility(false);

    // Tampilkan halaman instruksi dulu, lalu navigate ke CF
    _loginAuthWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
      <!DOCTYPE html><html><head><meta charset="UTF-8">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: system-ui, sans-serif; background: #f9fafb;
               display: flex; flex-direction: column; align-items: center;
               justify-content: center; height: 100vh; gap: 16px; padding: 32px; text-align: center; }
        .icon { font-size: 48px; }
        h2 { font-size: 18px; font-weight: 700; color: #111; }
        p  { font-size: 13px; color: #555; line-height: 1.6; max-width: 380px; }
        .step { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px;
                padding: 12px 16px; font-size: 12px; color: #333; text-align: left;
                width: 100%; max-width: 400px; }
        .step b { color: #f6821f; }
        .loader { width: 32px; height: 32px; border: 3px solid #e5e7eb;
                  border-top-color: #f6821f; border-radius: 50%;
                  animation: spin 0.8s linear infinite; margin-top: 8px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      </style></head><body>
        <div class="icon">🔐</div>
        <h2>Authorize Cloudflare Tunnel</h2>
        <p>Sedang memuat halaman Cloudflare...<br>Pilih domain yang ingin digunakan untuk tunnel.</p>
        <div class="step">
          1. Login ke akun Cloudflare kamu<br>
          2. <b>Klik domain</b> yang ingin dipakai (contoh: setiyawan.online)<br>
          3. Window ini akan otomatis tertutup setelah authorize
        </div>
        <div class="loader"></div>
      </body></html>
    `));

    // Setelah 1.5 detik tampilkan loading, langsung navigate ke CF authorize URL
    setTimeout(() => {
      if (_loginAuthWin && !_loginAuthWin.isDestroyed()) {
        _loginAuthWin.loadURL(authURL);
      }
    }, 1500);

    // Pantau navigasi — kalau landing di dashboard home setelah OAuth,
    // redirect balik ke argotunnel URL agar zone selector tampil
    let _autoRedirects = 0;
    _loginAuthWin.webContents.on('did-navigate', (_, url) => {
      if (resolved || _autoRedirects >= 3) return;
      try {
        const u = new URL(url);
        const isDashHome = u.hostname === 'dash.cloudflare.com' &&
          !u.pathname.includes('argotunnel') &&
          !u.pathname.includes('login') &&
          (u.pathname === '/' || u.pathname === '' || /^\/[a-f0-9]{32}\/?$/.test(u.pathname));
        if (isDashHome) {
          _autoRedirects++;
          setTimeout(() => {
            if (_loginAuthWin && !_loginAuthWin.isDestroyed()) {
              _loginAuthWin.loadURL(authURL);
            }
          }, 600);
        }
      } catch {}
    });

    // User tutup window = cancel
    _loginAuthWin.on('closed', () => {
      _loginAuthWin = null;
      if (!resolved) done(false, 'Login dibatalkan');
    });
  };

  proc.stdout.on('data', d => onData(d.toString()));
  proc.stderr.on('data', d => onData(d.toString()));
  proc.on('close', () => {
    if (fs.existsSync(certPath)) done(true);
    else done(false, 'Login gagal atau dibatalkan');
  });
  proc.on('error', err => done(false, err.message));
}));

ipcMain.handle('cf:tunnel-list', async () => {
  try {
    // Jika API token mode: gunakan CF REST API langsung (lebih reliable, tidak butuh cert.pem)
    if (_cfg.cfApiToken && _cfg.cfAccountId) {
      const res = await _cfApiRequest(
        _cfg.cfApiToken,
        `/accounts/${_cfg.cfAccountId}/cfd_tunnel?is_deleted=false&per_page=100`
      );
      const tunnels = (res.result || []).map(t => ({
        id: t.id, name: t.name, createdAt: t.created_at,
        status: t.status, connections: t.connections,
      }));
      return { ok: true, tunnels };
    }
    // Fallback: cloudflared CLI (SSO mode, cert.pem)
    const tunnels = await cloudflared.listTunnels(_cfEnv());
    return { ok: true, tunnels };
  } catch (e) {
    return { ok: false, tunnels: [], error: e.message };
  }
});

ipcMain.handle('cf:create-tunnel', async (_e, name) => {
  // API token mode: gunakan REST API agar tidak butuh cert.pem
  if (_cfg.cfApiToken && _cfg.cfAccountId) {
    try {
      // Generate 32-byte random tunnel secret
      const secret = require('crypto').randomBytes(32).toString('base64');
      const res = await _cfApiRequest(
        _cfg.cfApiToken,
        `/accounts/${_cfg.cfAccountId}/cfd_tunnel`,
        'POST',
        { name, tunnel_secret: secret }
      );
      if (!res.success) {
        console.error('[cf:create-tunnel] CF API error:', JSON.stringify(res.errors));
        console.error('[cf:create-tunnel] accountId:', _cfg.cfAccountId?.slice(0,8) + '…');
        console.error('[cf:create-tunnel] token prefix:', _cfg.cfApiToken?.slice(0,10) + '…');
        console.error('[cf:create-tunnel] cfLoginMode:', _cfg.cfLoginMode);
        const msg = res.errors?.[0]?.message || JSON.stringify(res.errors);
        return { ok: false, error: msg };
      }
      const t = res.result;
      // Tulis credentials file agar cloudflared bisa run tunnel ini
      const cfDir = path.join(os.homedir(), '.cloudflared');
      if (!fs.existsSync(cfDir)) fs.mkdirSync(cfDir, { recursive: true });
      const credFile = path.join(cfDir, `${t.id}.json`);
      fs.writeFileSync(credFile, JSON.stringify({
        AccountTag  : _cfg.cfAccountId,
        TunnelSecret: secret,
        TunnelID    : t.id,
      }), 'utf8');
      return { ok: true, id: t.id, name: t.name };
    } catch (e) { return { ok: false, error: e.message }; }
  }
  // SSO fallback: pakai cloudflared CLI (butuh cert.pem)
  try { return await cloudflared.createTunnel(name, _cfEnv()); }
  catch (e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('cf:add-dns-route', async (_e, tunnelName, hostname) => {
  try { return await cloudflared.addDNSRoute(tunnelName, hostname, _cfEnv()); }
  catch (e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('cf:delete-domain', (_e, port) => {
  const lp = Number(port);
  if (_cfg.domains) delete _cfg.domains[lp];
  const t = _tunnelMap.get(lp);
  if (t) { t.customDomain = null; t.tunnelId = null; }
  saveConfig(_cfg);
  pushUpdate();
  return { ok: true };
});

// ── Route management ──────────────────────────────────────────────────────────
ipcMain.handle('cf:get-routes', () => _cfg.routes || []);

ipcMain.handle('cf:add-route', async (_e, { tunnelId, tunnelName, hostname, port }) => {
  // Add DNS CNAME via cloudflared
  const dns = await cloudflared.addDNSRoute(tunnelName, hostname, _cfEnv());
  if (!dns.ok && !dns.output?.includes('already exists')) {
    return { ok: false, error: dns.output || dns.error || 'Gagal tambah DNS' };
  }
  // Store in config (upsert by hostname)
  if (!_cfg.routes) _cfg.routes = [];
  _cfg.routes = _cfg.routes.filter(r => r.hostname !== hostname);
  _cfg.routes.push({ tunnelId, tunnelName, hostname, port: Number(port) });
  saveConfig(_cfg);
  return { ok: true };
});

ipcMain.handle('cf:remove-route', (_e, hostname) => {
  if (_cfg.routes) _cfg.routes = _cfg.routes.filter(r => r.hostname !== hostname);
  saveConfig(_cfg);
  // Note: DNS record remains in Cloudflare — user should delete from CF Dashboard
  return { ok: true };
});

ipcMain.handle('cf:delete-tunnel-named', async (_e, name) => {
  try {
    // API token mode: REST API (tidak butuh cert.pem)
    if (_cfg.cfApiToken && _cfg.cfAccountId) {
      // Cari tunnel ID dari nama
      const listRes = await _cfApiRequest(
        _cfg.cfApiToken,
        `/accounts/${_cfg.cfAccountId}/cfd_tunnel?name=${encodeURIComponent(name)}&per_page=10`
      );
      const tunnel = (listRes.result || []).find(t => t.name === name);
      if (!tunnel) return { ok: false, error: `Tunnel "${name}" tidak ditemukan` };

      // Delete via REST API
      const delRes = await _cfApiRequest(
        _cfg.cfApiToken,
        `/accounts/${_cfg.cfAccountId}/cfd_tunnel/${tunnel.id}`,
        'DELETE'
      );
      if (!delRes.success) {
        return { ok: false, error: delRes.errors?.[0]?.message || 'Gagal hapus tunnel' };
      }
      // Hapus credentials file lokal
      const credFile = path.join(os.homedir(), '.cloudflared', `${tunnel.id}.json`);
      try { if (fs.existsSync(credFile)) fs.unlinkSync(credFile); } catch {}
    } else {
      // SSO fallback
      const res = await cloudflared.deleteTunnel(name, _cfEnv());
      if (!res.ok) return res;
    }
    if (_cfg.routes) _cfg.routes = _cfg.routes.filter(r => r.tunnelName !== name);
    saveConfig(_cfg);
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
});

// ── Cloudflare API helpers ────────────────────────────────────────────────────
const https = require('https');

function _cfApiRequest(token, reqPath, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.cloudflare.com',
      path: `/client/v4${reqPath}`,
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = https.request(options, res => {
      let out = '';
      res.on('data', d => { out += d; });
      res.on('end', () => {
        try { resolve(JSON.parse(out)); }
        catch { resolve({ success: false, errors: [{ message: 'Invalid JSON' }] }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

ipcMain.handle('cf:get-api-config', () => ({
  token:     _cfg.cfApiToken   || '',
  zoneId:    _cfg.cfZoneId     || '',
  accountId: _cfg.cfAccountId  || '',
}));

ipcMain.handle('cf:save-api-config', (_e, { token, zoneId, accountId }) => {
  _cfg.cfApiToken  = token;
  _cfg.cfZoneId    = zoneId;
  if (accountId) {
    _cfg.cfAccountId  = accountId;
    _cfg.cfLoginMode  = 'api-token';
  }
  saveConfig(_cfg);
  return { ok: true };
});

ipcMain.handle('cf:list-dns-records', async () => {
  const { cfApiToken, cfZoneId } = _cfg;
  if (!cfApiToken || !cfZoneId) return { ok: false, needsSetup: true };
  try {
    const res = await _cfApiRequest(cfApiToken, `/zones/${cfZoneId}/dns_records?type=CNAME&per_page=200`);
    if (!res.success) return { ok: false, error: res.errors?.[0]?.message || 'API error' };
    return { ok: true, records: res.result };
  } catch (e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('cf:add-cname', async (_e, { name, tunnelId, port }) => {
  const { cfApiToken, cfZoneId } = _cfg;
  if (!cfApiToken || !cfZoneId) return { ok: false, needsSetup: true };
  try {
    const content = `${tunnelId}.cfargotunnel.com`;
    const res = await _cfApiRequest(cfApiToken, `/zones/${cfZoneId}/dns_records`, 'POST', {
      type: 'CNAME', name, content, proxied: true, ttl: 1,
      comment: 'Added by Absenku Net',
    });
    if (!res.success) return { ok: false, error: res.errors?.[0]?.message || 'Failed' };
    // Also save to local routes
    if (port && res.result) {
      if (!_cfg.routes) _cfg.routes = [];
      const tunnelInfo = (await cloudflared.listTunnels()).find(t => t.id === tunnelId);
      const tunnelName = tunnelInfo?.name || tunnelId;
      _cfg.routes = _cfg.routes.filter(r => r.hostname !== name);
      _cfg.routes.push({ tunnelId, tunnelName, hostname: name, port: Number(port) });
      saveConfig(_cfg);
    }
    return { ok: true, record: res.result };
  } catch (e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('cf:delete-cname', async (_e, { recordId, hostname }) => {
  const { cfApiToken, cfZoneId } = _cfg;
  if (!cfApiToken || !cfZoneId) return { ok: false, needsSetup: true };
  try {
    const res = await _cfApiRequest(cfApiToken, `/zones/${cfZoneId}/dns_records/${recordId}`, 'DELETE');
    if (!res.success) return { ok: false, error: res.errors?.[0]?.message || 'Failed' };
    // Remove from local routes too
    if (hostname && _cfg.routes) {
      _cfg.routes = _cfg.routes.filter(r => r.hostname !== hostname);
      saveConfig(_cfg);
    }
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('get-config',    ()          => ({ ..._cfg }));
ipcMain.handle('save-config',   (_e, cfg)  => {
  _cfg = { ...DEFAULT_CFG, ...cfg };
  if (_cfg.pass !== undefined) process.env.INSPECTOR_PASS = _cfg.pass;
  return { ok: saveConfig(_cfg) };
});

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  _cfg = loadConfig();

  try { await startInspector(); }
  catch (err) { console.error('Inspector start failed:', err.message); }

  createTray();
  createLauncherWindow();

  // Auto-start saved tunnels
  const autoStart = Array.isArray(_cfg.autoStart) ? _cfg.autoStart : [];
  for (const port of autoStart) {
    // Prefer new routes config, fall back to legacy domains config
    const route    = (_cfg.routes || []).find(r => r.port === Number(port));
    const legacy   = (_cfg.domains || {})[port];
    const domainOpts = route
      ? { customDomain: route.hostname, tunnelId: route.tunnelId }
      : (legacy || {});
    try { await startTunnel(Number(port), domainOpts); }
    catch (err) { console.error(`Auto-start :${port} failed:`, err.message); }
  }
});

app.on('window-all-closed', e => e.preventDefault()); // keep running in tray
app.on('activate', () => {
  // Dock icon clicked — re-show window and restore dock visibility
  if (process.platform === 'darwin') app.dock?.show();
  _showLauncherWin();
});
app.on('before-quit', () => { _isQuitting = true; cleanup(); });

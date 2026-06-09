'use strict';

/**
 * electron/main.js — Absenku Inspector Request (Electron wrapper)
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
const QRCode  = require('qrcode');

// ── Paths ─────────────────────────────────────────────────────────────────────
const ROOT      = path.join(__dirname, '..');
const CFG_FILE  = path.join(app.getPath('userData'), 'absenkurc.json');
const ICON_FILE = path.join(__dirname, 'icon.png');

// ── Default config ────────────────────────────────────────────────────────────
const DEFAULT_CFG = { pass: '', autoStart: [], labels: {} };

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
  }));
}

// ── Dynamic tunnel: start ─────────────────────────────────────────────────────
async function startTunnel(localPort) {
  if (_tunnelMap.has(localPort)) {
    const t = _tunnelMap.get(localPort);
    if (t.status !== 'stopped') return { ok: false, error: `Port ${localPort} sudah berjalan` };
    // stopped → restart
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
  };
  _tunnelMap.set(localPort, entry);
  state.tunnels.set(localPort, { clientSSE: null, pending: new Map(), tunnelPort, publicUrl: null });

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
  _attachCloudflared(localPort, tunnelPort);

  pushUpdate();
  return { ok: true };
}

/**
 * Spawn (or re-spawn) cloudflared for a tunnel entry.
 * Handles crash detection and auto-restart with exponential backoff.
 */
function _attachCloudflared(localPort, tunnelPort, retryDelay = 3000) {
  const t = _tunnelMap.get(localPort);
  if (!t || t.status === 'stopped') return;

  const cfProc = cloudflared.startTunnel(tunnelPort, url => {
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
        title: 'Absenku — Tunnel Ready',
        body : `:${localPort} → ${url}`,
        icon : ICON_FILE,
      }).show();
    }
  });

  t.cfProc = cfProc;

  // Log all cloudflared stderr for debugging
  cfProc.stderr.on('data', chunk => {
    const text = chunk.toString();
    // Filter out the URL line (already handled) — log everything else
    if (!text.includes('trycloudflare.com')) {
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
    setTimeout(() => _attachCloudflared(localPort, tunnelPort, next), retryDelay);
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
    title          : 'Absenku Inspector',
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
    title : 'Absenku Settings',
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
    { label: '⚡ Absenku Inspector', enabled: false },
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
  _tray = new Tray(nativeImage.createFromPath(ICON_FILE));
  _tray.setToolTip('Absenku Inspector');
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
ipcMain.handle('start-tunnel',  (_e, port) => startTunnel(Number(port)));
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
    try { await startTunnel(Number(port)); }
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

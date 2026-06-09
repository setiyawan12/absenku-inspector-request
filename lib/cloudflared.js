'use strict';

/**
 * cloudflared helper — download binary if missing, start Quick Tunnel.
 */

const { spawn }  = require('child_process');
const path       = require('path');
const fs         = require('fs');
const https      = require('https');

const BIN_NAME = process.platform === 'win32' ? 'cloudflared.exe' : 'cloudflared';

// In a packaged Electron app, extra resources are in process.resourcesPath.
// In dev (electron .) or CLI, app.isPackaged is false/undefined — use project root.
function _binDir() {
  if (typeof process.resourcesPath === 'string') {
    try {
      const { app } = require('electron');
      if (app && app.isPackaged) return process.resourcesPath;
    } catch {}
  }
  return path.join(__dirname, '..');
}
const BIN_DIR  = _binDir();
const BIN_PATH = path.join(BIN_DIR, BIN_NAME);

/** Return the correct GitHub release download URL for this OS/arch. */
function _downloadURL() {
  const { platform, arch } = process;
  if (platform === 'darwin') {
    return arch === 'arm64'
      ? 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-arm64.tgz'
      : 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-amd64.tgz';
  }
  if (platform === 'linux') {
    return (arch === 'arm64' || arch === 'aarch64')
      ? 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64'
      : 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64';
  }
  if (platform === 'win32') {
    return 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe';
  }
  throw new Error(`Unsupported platform: ${platform}`);
}

/** Download a file via HTTPS, following redirects. */
function _downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const follow = u => {
      https.get(u, res => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          follow(res.headers.location); return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${u}`)); return;
        }
        const f = fs.createWriteStream(dest);
        res.pipe(f);
        f.on('finish', () => f.close(resolve));
        f.on('error',  reject);
      }).on('error', reject);
    };
    follow(url);
  });
}

/**
 * Ensure the cloudflared binary exists.
 * Downloads and extracts it if not present.
 */
async function ensureCloudflared() {
  if (fs.existsSync(BIN_PATH)) return;

  process.stdout.write('📥 Downloading cloudflared (sekali saja)… ');
  const url = _downloadURL();

  if (url.endsWith('.tgz')) {
    const tgzPath = BIN_PATH + '.tgz';
    await _downloadFile(url, tgzPath);
    // Extract using system tar (available on macOS & Linux)
    await new Promise((resolve, reject) => {
      const tar = spawn('tar', ['xz', '-C', BIN_DIR, '-f', tgzPath]);
      tar.on('close', code => {
        try { fs.unlinkSync(tgzPath); } catch {}
        code === 0 ? resolve() : reject(new Error('tar extraction failed'));
      });
      tar.on('error', reject);
    });
  } else {
    await _downloadFile(url, BIN_PATH);
  }

  fs.chmodSync(BIN_PATH, 0o755);
  console.log('✓');
}

/**
 * Spawn cloudflared Quick Tunnel.
 * Calls onURL(url) when the public URL is ready.
 * Returns the child process.
 */
function startTunnel(tunnelPort, onURL) {
  const cf = spawn(BIN_PATH, [
    'tunnel', '--url', `http://localhost:${tunnelPort}`, '--no-autoupdate',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });

  cf.stderr.on('data', data => {
    const text  = data.toString();
    const match = text.match(/https:\/\/[a-zA-Z0-9._-]+\.trycloudflare\.com/);
    if (match) onURL(match[0]);
  });

  cf.on('error', err => console.error('\n cloudflared error:', err.message));
  return cf;
}

module.exports = { ensureCloudflared, startTunnel, BIN_PATH };

'use strict';

/**
 * afterSign.js — Ad-hoc code signing untuk macOS tanpa Apple Developer certificate.
 * Ini mencegah error "app is damaged" saat pertama kali dibuka.
 * Catatan: ini BUKAN notarization. User tetap perlu klik "Open Anyway" sekali
 * jika Gatekeeper ketat, tapi tidak akan muncul "damaged" lagi.
 */
const { execSync } = require('child_process');
const path = require('path');

exports.default = async function afterSign(context) {
  const { electronPlatformName, appOutDir, packager } = context;

  if (electronPlatformName !== 'darwin') return;

  const appName   = packager.appInfo.productFilename;
  const appPath   = path.join(appOutDir, `${appName}.app`);

  console.log(`[afterSign] Ad-hoc signing: ${appPath}`);
  try {
    execSync(`codesign --force --deep --sign - "${appPath}"`, { stdio: 'inherit' });
    console.log('[afterSign] Signing complete.');
  } catch (e) {
    console.warn('[afterSign] Signing failed (non-fatal):', e.message);
  }
};

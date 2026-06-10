'use strict';

/**
 * notarize.js — Submit app ke Apple Notary Service setelah signing.
 * Hanya jalan di macOS CI dengan env vars APPLE_ID, APPLE_APP_PASSWORD, APPLE_TEAM_ID.
 */
const { notarize } = require('@electron/notarize');
const path = require('path');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir, packager } = context;

  if (electronPlatformName !== 'darwin') return;

  // Skip jika env vars tidak ada (dev lokal)
  if (!process.env.APPLE_ID || !process.env.APPLE_APP_PASSWORD || !process.env.APPLE_TEAM_ID) {
    console.log('[notarize] Skipping — APPLE_ID/APPLE_APP_PASSWORD/APPLE_TEAM_ID not set');
    return;
  }

  const appName = packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);

  console.log(`[notarize] Submitting to Apple Notary Service: ${appPath}`);
  console.log('[notarize] This may take 2-10 minutes...');

  await notarize({
    tool      : 'notarytool',
    appPath,
    appleId      : process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_PASSWORD,
    teamId       : process.env.APPLE_TEAM_ID,
  });

  console.log('[notarize] Done!');
};

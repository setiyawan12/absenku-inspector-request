'use strict';

/**
 * Log persistence — save/load requestLog to absenku-log.json in CWD.
 * Writes are debounced (2 s) so heavy traffic doesn't thrash disk.
 */

const fs    = require('fs');
const path  = require('path');
const state = require('./state');
const { MAX_LOG } = require('./config');

const LOG_FILE = path.join(process.cwd(), 'absenku-log.json');
let _timer = null;

/** Load persisted log from disk into state.requestLog. Call once at startup. */
function load() {
  try {
    if (!fs.existsSync(LOG_FILE)) return;
    const data = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
    if (Array.isArray(data) && data.length) {
      state.requestLog.push(...data.slice(0, MAX_LOG));
      console.log(`📂 Loaded ${state.requestLog.length} saved request(s) from absenku-log.json`);
    }
  } catch (e) {
    console.warn(`⚠  Could not load absenku-log.json: ${e.message}`);
  }
}

/** Schedule a debounced write. Call after every new request entry. */
function scheduleSave() {
  clearTimeout(_timer);
  _timer = setTimeout(_write, 2000);
}

/** Flush immediately (call on SIGINT/SIGTERM). */
function saveSync() {
  clearTimeout(_timer);
  _write();
}

/** Clear the persisted log file. */
function clear() {
  clearTimeout(_timer);
  try { fs.writeFileSync(LOG_FILE, '[]'); } catch {}
}

function _write() {
  try {
    const entries = state.requestLog.slice(0, MAX_LOG);
    fs.writeFileSync(LOG_FILE, JSON.stringify(entries));
  } catch (e) {
    console.warn(`⚠  Could not save absenku-log.json: ${e.message}`);
  }
}

module.exports = { load, scheduleSave, saveSync, clear };

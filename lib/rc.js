'use strict';

/**
 * .absenkurc config file reader/writer.
 * File location: CWD/.absenkurc (JSON format)
 *
 * Supported fields:
 *   pass    {string}   Inspector password
 *   ports   {number[]} Default local ports (overridden by CLI args)
 *
 * Example .absenkurc:
 *   {
 *     "pass": "mypassword",
 *     "ports": [8000, 8001]
 *   }
 */

const fs   = require('fs');
const path = require('path');

const RC_FILE = path.join(process.cwd(), '.absenkurc');

/** Load and parse .absenkurc. Returns {} if not found or invalid. */
function load() {
  try {
    if (!fs.existsSync(RC_FILE)) return {};
    const cfg = JSON.parse(fs.readFileSync(RC_FILE, 'utf8'));
    console.log(`📋 Config loaded from .absenkurc`);
    return cfg;
  } catch (e) {
    console.warn(`⚠  Could not parse .absenkurc: ${e.message}`);
    return {};
  }
}

/** Write config to .absenkurc */
function save(cfg) {
  fs.writeFileSync(RC_FILE, JSON.stringify(cfg, null, 2) + '\n');
}

module.exports = { load, save, RC_FILE };

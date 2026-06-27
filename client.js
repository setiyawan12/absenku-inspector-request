'use strict';
/**
 * WAN NET — standalone client
 * (Dipakai oleh start.sh. Untuk CLI gunakan: wan-net http <port>)
 *
 * Usage: node client.js <localPort> [serverHost] [serverClientPort]
 */

const { createClient } = require('./lib/tunnel-client');

const LOCAL_PORT  = parseInt(process.argv[2], 10);
const SERVER_HOST = process.argv[3] || 'localhost';
const CLIENT_PORT = parseInt(process.argv[4] || '4040', 10);

if (!LOCAL_PORT || isNaN(LOCAL_PORT)) {
  console.error('Usage: node client.js <localPort> [serverHost] [serverClientPort]');
  console.error('Contoh: node client.js 8000');
  process.exit(1);
}

console.log(`\nWAN NET client → forwarding localhost:${LOCAL_PORT}`);
console.log(`Connecting to ${SERVER_HOST}:${CLIENT_PORT}…\n`);

const client = createClient();
client.connect({
  localPort  : LOCAL_PORT,
  serverHost : SERVER_HOST,
  clientPort : CLIENT_PORT,
  onConnected: data => {
    console.log('\n' + '═'.repeat(52));
    console.log('  ✓ Tunnel aktif!');
    console.log(`  Forwarding → http://localhost:${LOCAL_PORT}`);
    console.log(`  Inspector  → ${data.inspectorUrl}`);
    console.log('═'.repeat(52) + '\n');
  },
});

process.on('SIGINT', () => { client.disconnect(); process.exit(0); });

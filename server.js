'use strict';
/**
 * absenku Inspector request — standalone entry point (single port)
 * For CLI multi-port usage, use: absenku http <port> [port2...]
 *
 * Usage: LOCAL_PORT=8000 node server.js
 */

const state                  = require('./lib/state');
const { findFreePort }       = require('./lib/utils');
const { TUNNEL_PORT, CLIENT_PORT, INSP_PASS } = require('./lib/config');
const { createTunnelServer } = require('./lib/tunnel-server');
const { createClientServer } = require('./lib/client-server');
const inspectorServer        = require('./lib/inspector-server');

const LOCAL_PORT = parseInt(process.env.LOCAL_PORT || '8000', 10);

// Register tunnel state for the single local port
state.tunnels.set(LOCAL_PORT, {
  clientSSE : null,
  pending   : new Map(),
  tunnelPort: TUNNEL_PORT,
  publicUrl : null,
});

const tunnelServer = createTunnelServer(LOCAL_PORT);
const clientServer = createClientServer(LOCAL_PORT);

// Inspector must start first so INSP_PORT is known before clients connect
findFreePort(8080).then(port => {
  state.INSP_PORT = port;

  inspectorServer.listen(state.INSP_PORT, () => {
    tunnelServer.listen(TUNNEL_PORT);
    clientServer.listen(CLIENT_PORT);

    console.log('\n🚀 absenku Inspector request ready');
    console.log(`   Local app : http://localhost:${LOCAL_PORT}`);
    console.log(`   Tunnel    : http://localhost:${TUNNEL_PORT}  ← Cloudflare forward ke sini`);
    console.log(`   Client    : port ${CLIENT_PORT}`);
    console.log(`   Inspector : http://localhost:${state.INSP_PORT}  ← buka di browser`);
    if (INSP_PASS) console.log(`   Auth      : admin / ${INSP_PASS}`);
    console.log('\nWaiting for tunnel client…\n');
  });
});

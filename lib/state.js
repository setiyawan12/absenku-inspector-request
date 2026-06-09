'use strict';

/**
 * Shared mutable runtime state.
 * All servers import this object and mutate it directly.
 */
const state = {
  INSP_PORT  : 0,
  startedAt  : Date.now(),
  // Per-tunnel state keyed by localPort
  // Map<localPort, { clientSSE, pending: Map, tunnelPort, publicUrl }>
  tunnels    : new Map(),
  // Shared
  requestLog : [],
  inspStreams : new Set(),
  mocks      : new Map(),
  // Header injection rules: Map<localPort|'*', { headerName: value }>
  headerInjections: new Map(),
};

module.exports = state;

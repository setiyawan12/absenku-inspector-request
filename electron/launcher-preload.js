'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('absenku', {
  startTunnel     : (port)        => ipcRenderer.invoke('start-tunnel', port),
  stopTunnel      : (port)        => ipcRenderer.invoke('stop-tunnel', port),
  deleteTunnel    : (port)        => ipcRenderer.invoke('delete-tunnel', port),
  deleteAllTunnels: ()            => ipcRenderer.invoke('delete-all-tunnels'),
  listTunnels     : ()            => ipcRenderer.invoke('list-tunnels'),
  getInspPort     : ()            => ipcRenderer.invoke('get-insp-port'),
  openInspector   : ()            => ipcRenderer.invoke('open-inspector'),
  openExternal    : (url)         => ipcRenderer.invoke('open-external', url),
  openSettings    : ()            => ipcRenderer.invoke('open-settings'),
  copyText        : (text)        => ipcRenderer.invoke('copy-text', text),
  generateQR      : (url)         => ipcRenderer.invoke('generate-qr', url),
  setLabel        : (port, label) => ipcRenderer.invoke('set-label', port, label),
  toggleAutoStart : (port)        => ipcRenderer.invoke('toggle-autostart', port),

  onTunnelUpdate: (cb) => {
    ipcRenderer.on('tunnel-update', (_evt, tunnels) => cb(tunnels));
  },
});

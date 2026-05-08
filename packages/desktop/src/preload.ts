import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('casino', {
  platform: process.platform,
});

contextBridge.exposeInMainWorld('electronAPI', {
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
});

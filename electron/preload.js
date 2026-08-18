const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('clipforge', {
  selectMediaFiles: () => ipcRenderer.invoke('select-media-files'),
  selectExportPath: () => ipcRenderer.invoke('select-export-path'),
  exportVideo: (project) => ipcRenderer.invoke('export-video', project),
  onExportProgress: (callback) => {
    const listener = (_event, progress) => callback(progress);
    ipcRenderer.on('export-progress', listener);
    return () => ipcRenderer.removeListener('export-progress', listener);
  },
  saveProject: (json) => ipcRenderer.invoke('save-project', json),
  loadProject: () => ipcRenderer.invoke('load-project')
});

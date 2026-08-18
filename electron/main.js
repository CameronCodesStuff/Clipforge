const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { runExport } = require('./ffmpegExport');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    backgroundColor: '#111318',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// --- IPC: import media files ---
ipcMain.handle('select-media-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Media', extensions: ['mp4', 'mov', 'mkv', 'webm', 'avi', 'mp3', 'wav', 'aac', 'm4a', 'png', 'jpg', 'jpeg'] }
    ]
  });
  if (result.canceled) return [];
  return result.filePaths;
});

// --- IPC: choose export destination ---
ipcMain.handle('select-export-path', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: 'export.mp4',
    filters: [{ name: 'MP4 Video', extensions: ['mp4'] }]
  });
  if (result.canceled) return null;
  return result.filePath;
});

// --- IPC: run the ffmpeg export ---
ipcMain.handle('export-video', async (event, project) => {
  try {
    const outputPath = await runExport(project, (progress) => {
      event.sender.send('export-progress', progress);
    });
    return { ok: true, outputPath };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// --- IPC: save / load project JSON ---
ipcMain.handle('save-project', async (event, projectJson) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: 'project.clipforge.json',
    filters: [{ name: 'ClipForge Project', extensions: ['json'] }]
  });
  if (result.canceled) return null;
  require('fs').writeFileSync(result.filePath, projectJson);
  return result.filePath;
});

ipcMain.handle('load-project', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'ClipForge Project', extensions: ['json'] }]
  });
  if (result.canceled) return null;
  return require('fs').readFileSync(result.filePaths[0], 'utf-8');
});

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { spawn, exec } = require('child_process');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 450,
    height: 450,
    resizable: true,
    fullscreenable: false,
    webPreferences: { 
      nodeIntegration: true, 
      contextIsolation: false 
    }
  });

  mainWindow.loadFile('Source/Pages/index.html');
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

// File selection
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'WebM Videos', extensions: ['webm'] }]
  });
  return result;
});

// Get total video duration with ffprobe
function getVideoDuration(inputPath) {
  return new Promise((resolve, reject) => {
    exec(`ffprobe -i "${inputPath}" -show_entries format=duration -v quiet -of csv="p=0"`, (err, stdout) => {
      if (err) reject(err);
      else resolve(parseFloat(stdout));
    });
  });
}

// Conversion
ipcMain.handle('convert-video', async (event, inputPath, outputPath) => {
  const totalDuration = await getVideoDuration(inputPath);

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', ['-i', inputPath, '-y', outputPath]);

    ffmpeg.stderr.on('data', (data) => {
      const message = data.toString();
      const match = message.match(/time=(\d+):(\d+):(\d+\.\d+)/);
      if (match) {
        const hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const seconds = parseFloat(match[3]);
        const currentTime = hours * 3600 + minutes * 60 + seconds;
        const percent = Math.min(100, ((currentTime / totalDuration) * 100).toFixed(1));
        mainWindow.webContents.send('conversion-progress', percent);
      }
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) resolve(outputPath);
      else reject(`Error with code ${code}`);
    });
  });
});
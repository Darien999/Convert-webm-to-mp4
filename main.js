const os = require("os");
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { spawn, exec } = require('child_process');

let mainWindow;

let FFMPEG_PATH = "ffmpeg";
let FFPROBE_PATH = "ffprobe";

if (os.platform() === "darwin") {
  // macOS
  FFMPEG_PATH = "/opt/homebrew/bin/ffmpeg";
  FFPROBE_PATH = "/opt/homebrew/bin/ffprobe";
} else if (os.platform() === "win32") {
  // Windows -> si está en PATH
  FFMPEG_PATH = "ffmpeg.exe";
  FFPROBE_PATH = "ffprobe.exe";
} // Sin problemas linux


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

  

  if (checkDependencies()) {
    mainWindow.loadFile('Source/Pages/index.html');
  } else {
    mainWindow.loadFile('Source/Pages/missing.html');
  }
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
    exec(`${FFPROBE_PATH} -i "${inputPath}" -show_entries format=duration -v quiet -of csv="p=0"`, (err, stdout) => {
      if (err) reject(err);
      else resolve(parseFloat(stdout));
    });
  });
}

// Conversion
ipcMain.handle('convert-video', async (event, inputPath, outputPath) => {
  const totalDuration = await getVideoDuration(inputPath);

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(FFMPEG_PATH, ['-i', inputPath, '-y', outputPath]);

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

//Validar dependencias
const fs = require('fs');

function checkDependencies() {
  return fs.existsSync(FFMPEG_PATH) && fs.existsSync(FFPROBE_PATH);
}
const os = require("os");
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { spawn, exec } = require('child_process');
const path = require("path");
const fs = require("fs");

let mainWindow;

let FFMPEG_PATH = "ffmpeg";
let FFPROBE_PATH = "ffprobe";

function findExecutable(possiblePaths) {
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

if (os.platform() === "darwin") {
  // macOS
  FFMPEG_PATH = "/opt/homebrew/bin/ffmpeg";
  FFPROBE_PATH = "/opt/homebrew/bin/ffprobe";
} else if (os.platform() === "win32") {
  // Windows - probar varias rutas comunes
  const ffmpegCandidates = [
    "ffmpeg.exe", // si está en PATH
    "C:\\ffmpeg\\bin\\ffmpeg.exe",
    "C:\\ProgramData\\chocolatey\\bin\\ffmpeg.exe",
    path.join(process.env.USERPROFILE || "", "scoop\\apps\\ffmpeg\\current\\bin\\ffmpeg.exe")
  ];

  const ffprobeCandidates = [
    "ffprobe.exe",
    "C:\\ffmpeg\\bin\\ffprobe.exe",
    "C:\\ProgramData\\chocolatey\\bin\\ffprobe.exe",
    path.join(process.env.USERPROFILE || "", "scoop\\apps\\ffmpeg\\current\\bin\\ffprobe.exe")
  ];

  FFMPEG_PATH = findExecutable(ffmpegCandidates);
  FFPROBE_PATH = findExecutable(ffprobeCandidates); 
} else { 
  // Linux - asumir que está en PATH
  FFMPEG_PATH = "ffmpeg";
  FFPROBE_PATH = "ffprobe";
} 

// Validación
if (!FFMPEG_PATH || !FFPROBE_PATH) {
  console.error("No se encontró FFmpeg/FFprobe en el sistema.");
} else {
  console.log("FFmpeg en:", FFMPEG_PATH);
  console.log("FFprobe en:", FFPROBE_PATH);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 450,
    height: 450,
    resizable: true,
    fullscreenable: false,
    autoHideMenuBar: true,
    webPreferences: { 
      nodeIntegration: true, 
      contextIsolation: false 
    }
  });

  mainWindow.setMenu(null);

  if (checkDependencies()) {
    mainWindow.loadFile('Source/Pages/index.html');
  } else {
    mainWindow.loadFile('Source/Pages/missing.html');
  }
  //mainWindow.webContents.openDevTools();
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


function checkDependencies() {
  return fs.existsSync(FFMPEG_PATH) && fs.existsSync(FFPROBE_PATH);
}
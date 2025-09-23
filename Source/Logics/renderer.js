const { ipcRenderer } = require('electron');
const selectBtn = document.getElementById('selectBtn');
const convertBtn = document.getElementById('convertBtn');
const status = document.getElementById('status');
const progressBar = document.getElementById('progressBar');

let selectedFile = null;

// Select file button
selectBtn.addEventListener('click', async () => {
  const { canceled, filePaths } = await ipcRenderer.invoke('open-file-dialog');
  if (canceled || filePaths.length === 0) return;
  selectedFile = filePaths[0];
  status.textContent = `Selected file: ${selectedFile}`;
  progressBar.style.width = '0%';
  progressBar.textContent = '';
});

// Convert button
convertBtn.addEventListener('click', async () => {
  if (!selectedFile) return alert('Please select a file first');

  const outputPath = selectedFile.replace(/\.webm$/i, '.mp4');
  status.textContent = '⏳ Converting... 0%';
  progressBar.style.width = '0%';
  progressBar.textContent = '0%';

  try {
    await ipcRenderer.invoke('convert-video', selectedFile, outputPath);
    status.textContent = `✅ Converted: ${outputPath}`;
    progressBar.style.width = '100%';
    progressBar.textContent = '100%';
  } catch (err) {
    status.textContent = `❌ Error: ${err}`;
    progressBar.style.width = '0%';
    progressBar.textContent = '';
  }
});

// Listen to conversion progress (%)
ipcRenderer.on('conversion-progress', (event, percent) => {
  status.textContent = `⏳ Converting... ${percent}%`;
  progressBar.style.width = `${percent}%`;
  progressBar.textContent = `${percent}%`;
});

// Modal

const infoLink = document.getElementById('infoLink');
const infoModal = document.getElementById('infoModal');
const closeModal = document.querySelector('.modal .close');

infoLink.addEventListener('click', (e) => {
  e.preventDefault();
  infoModal.style.display = 'block';
});

closeModal.addEventListener('click', () => {
  infoModal.style.display = 'none';
});

// Close modal if click outside content
window.addEventListener('click', (e) => {
  if (e.target === infoModal) {
    infoModal.style.display = 'none';
  }
});
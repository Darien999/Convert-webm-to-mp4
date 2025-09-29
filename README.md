# Electron Video Converter

Convert WebM → MP4 using Electron. Works on macOS, Windows, and Linux.

---

## Features

- Select a WebM video and convert it to MP4.
- Displays conversion progress with a progress bar.
- Cross-platform support (macOS, Windows, Linux).

---

## Requirements

- Node.js (for running from source)
- FFmpeg installed on your system
  - On **macOS**: install via Homebrew → `brew install ffmpeg`
  - On **Windows**: download FFmpeg from https://ffmpeg.org/download.html and add it to your PATH
  - On **Linux**: install via package manager → e.g., `sudo apt install ffmpeg`

---

## Installation

### macOS / Windows / Linux

1. Download the release for your operating system from the [Releases](../../releases) section.
2. Unzip the archive.
3. Run the application.

---

## Notes for macOS Users

When opening the application for the first time, you may see a message such as:

> “AppName can’t be opened because it is from an unidentified developer.”

This happens because the app is not signed with an Apple Developer ID.  
The software is safe to use, but macOS blocks it by default.

To open it:

1. Right-click the application and select **Open**.
2. Confirm in the dialog that appears.
3. (Optional) You can also allow the app permanently via **System Settings > Privacy & Security**.

This step is only required the first time you run the application.

---

## Notes for Windows Users

- If Windows Defender SmartScreen shows a warning, click **More info** → **Run anyway**.
- This happens because the app is not signed with a paid Microsoft certificate.
- The application is safe to use.

---

## Notes for Linux Users

- Make sure FFmpeg is installed and available in your PATH.
- You may need to grant execute permissions to the AppImage or binary:

---

## Security Notice

The application is **not code-signed** (Apple / Microsoft certificates require paid developer accounts).  
For this reason, operating systems may display a warning the first time you open it.  

You can choose to trust the application manually as explained above.



# vinyl-tab-extension
A lo-fi Chrome new tab dashboard built with vanilla JavaScript and Manifest V3. Features an animated vinyl audio player, custom wallpapers via IndexedDB blob storage, and a minimal clock.

# 🎵 Vinyl Tab — Custom Chrome New Tab Extension

A clean, aesthetic, lo-fi new tab dashboard for Google Chrome featuring an animated vinyl audio player, minimal clock, and customizable local wallpapers.

Built with **vanilla HTML, CSS, and JavaScript** using **Manifest V3**. Everything runs 100% locally on your machine with zero external cloud dependencies.

---

## ✨ Features

- **Vinyl Music Player:**
  - Realistic animated vinyl record that spins during playback.
  - Interactive tone-arm that pivots smoothly onto the record when playing.
  - Integrated seek bar, volume control, track parsing, and playlist drawer.
  - Native **MediaSession API** integration for keyboard multimedia controls (Play/Pause, Next, Previous).

- **100% Local-First Storage:**
  - Uses browser **IndexedDB** to store uploaded wallpapers and audio tracks as binary blobs directly on your device.
  - No accounts, no external tracking, no backend servers.

- **Dynamic Backgrounds:**
  - Upload multiple custom wallpaper images.
  - Smooth 1.2s cross-fade transition between images.
  - Auto-rotation intervals or shuffle button.
  - Configurable background dimming slider to ensure text remains readable.

- **Minimal Tabular Clock:**
  - Clean display with 12-hour or 24-hour mode toggle.
  - Formatted date display.

---

## 📸 Preview

![Vinyl Tab Preview](screenshot.png)
<img width="1920" height="1080" alt="screenshot png" src="https://github.com/user-attachments/assets/7e4b774b-f9cc-4f50-8bbe-9a8a2617a6f0" />


> *(Place your screenshot or demo GIF in the repository root and name it `screenshot.png`)*

---

## 🚀 How to Install Locally

Because this extension runs locally as an unpacked developer extension, you can install it in under 30 seconds:

1. **Clone or Download the Repository:**
   ```bash
   git clone [https://github.com/YOUR_USERNAME/vinyl-tab-extension.git](https://github.com/YOUR_USERNAME/vinyl-tab-extension.git)

   Open Chrome Extension Settings:

In Google Chrome (or Brave / Edge), navigate to:

Plaintext
chrome://extensions
Enable Developer Mode:

Toggle on the Developer mode switch located in the top-right corner.

Load the Extension:

Click the Load unpacked button in the top-left corner.

Select the folder containing manifest.json, newtab.html, newtab.css, and newtab.js.

Open a New Tab:

Press Ctrl + T (or Cmd + T on macOS).

Click the Gear icon (⚙️) in the bottom right corner to upload your favorite tracks and wallpapers!

🛠️ Tech Stack & Architecture
Chrome Extension Architecture: Manifest V3 (chrome_url_overrides for newtab)

Frontend: Pure HTML5, CSS3, JavaScript (ES6+)

Storage: Browser IndexedDB (for binary blobs) & localStorage (for settings)

Audio & Media: HTML5 Audio API & MediaSession API

Styling: CSS Custom Properties, backdrop blur filters, and CSS keyframe animations

# 📺 Hardware & Android Kiosk Setup Guide (v2.6.0)

## 📱 Recommended Devices & Display Profiles
* **Android Kiosks & Media Boxes:** 10.1" to 21.5" Android touchscreens or commercial displays powered by Android TV / Kiosk boxes (Android 7.1.2+, including legacy SoCs like `Rockchip rk3368`).
* **Smart Resolution Scaling (Tab 2 in Admin):**
  * `auto`: Responsive fluid scaling based on device viewport.
  * `1080p`: Locked Full HD (`1920x1080`) typography and card proportions.
  * `720p`: Optimized larger typography and touch targets for compact tablets (`1280x800`).
* **Hardware Lite Mode (`body.lite-mode`):** Recommended for Android 7–9 devices. Disables GPU-heavy `backdrop-filter: blur()`, Ken-Burns background scaling, and `box-shadow` pulse animations while keeping a fixed dark wallpaper and crisp solid cards.

---

## 🏆 Recommended Kiosk Apps

### 🥇 1. [Webview Kiosk](https://webviewkiosk.nktnet.uk) (100% Free & Open Source)
* Lightweight FOSS wrapper ideal for Android 7+ hardware with minimal RAM overhead.
* Supports Lock Task Mode (Screen Pinning) and password-protected settings.

### 🥈 2. [Fully Kiosk Browser](https://www.fully-kiosk.com/) (Commercial Standard)
1. **Web Browsing:** Start URL set to `https://<your-domain>/`, Enable Hardware Acceleration `ON`, Clear Cache on Start `OFF`.
2. **Device Management:** Keep Screen On `ON`, Run as Launcher `ON`, Auto-Start on Boot `ON`.
3. **Audio Settings:** Autoplay Audio `Enabled`.

---

## 🛡️ Built-In 24/7 Watchdogs & Blackbox Diagnostics
* **45-Second Modal Auto-Close:** Any touch modal (`#interactive-modal`) left open by a resident automatically closes after 45 seconds so it never blocks the main slideshow or night reloads.
* **Nightly Memory Watchdog:** Performs a clean reload at `23:05` (after radio shutoff) and `04:00 AM` to clear WebView heap accumulation.
* **Blackbox Flight Recorder (Tab 5 in Admin):** Logs clean reloads, remote force reloads, JS errors, and unexpected hardware restarts (`unclean_crash_restart`) to Firestore `smart_lobby/device_logs`.

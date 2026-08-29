# 📺 Hardware & Android Kiosk Setup Guide

## 📱 Recommended Devices
* **Android Tablets:** 10.1" to 15.6" Android tablets (Android 7.0 and up). Samsung Galaxy Tab A series, Lenovo Tab series, or dedicated commercial touch screens.
* **Smart TVs / Touch Monitors:** Any wall-mounted Android TV or display with landscape 16:9 resolution (1080p Full HD or 720p).
* **Power Supply:** Permanent wall-recessed 5V/2A or 9V USB-C power supply.

---

## 🏆 Recommended App: Fully Kiosk Browser
We officially recommend **[Fully Kiosk Browser & Launcher](https://www.fully-kiosk.com/)** for all permanent lobby installations.

### ⚙️ Step-by-Step Configuration:
1. **Web Browsing:**
   * **Start URL:** Set to your building's live URL (e.g. `https://<your-domain>/`).
   * **Enable WebGL:** `ON` (ensures GPU-accelerated 60fps transitions).
   * **Enable Hardware Acceleration:** `ON`.
   * **Clear Cache on Start:** `OFF` (preserves offline loading).
2. **Device Management:**
   * **Keep Screen On:** `ON` (while power connected).
   * **Run as Launcher (Kiosk Mode):** `ON` (prevents exiting to Android desktop).
   * **Auto-Start on Boot:** `ON` (recovers automatically after power outages).
3. **Audio Settings:**
   * **Autoplay Audio:** `Enabled` (allows background radio streaming without manual touch interaction).

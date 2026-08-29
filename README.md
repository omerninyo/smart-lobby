# 🏢 Smart Building Digital Signage (לוח שילוט דיגיטלי חכם לבניין)
> A modern, autonomous, touchscreen-enabled Digital Signage Kiosk & Committee Management System for residential buildings.

[![License: MIT](https://img.shields.io/badge/License-MIT%20with%20Attribution-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Android%207%2B%20Kiosk-brightgreen.svg)]()
[![Production Live](https://img.shields.io/badge/Production-lobby.ninyo.co-success.svg)](https://lobby.ninyo.co)
[![Author](https://img.shields.io/badge/Author-Omer%20Ninyo-orange.svg)](https://github.com/omerninyo)
[![UI: TailwindCSS](https://img.shields.io/badge/UI-TailwindCSS%20%2B%20Crystal%20Glassmorphism-38bdf8.svg)]()

---

## 🌐 Live Production Links
* 🖥️ **Live Lobby Kiosk Display:** [https://lobby.ninyo.co](https://lobby.ninyo.co)
* 📱 **Mobile & Desktop Admin Panel:** [https://lobby.ninyo.co/admin.html](https://lobby.ninyo.co/admin.html)
  * 🔑 **Master Admin PIN:** `1234` (Full access to all 6 tabs & system settings)
  * 👤 **Committee Member PIN:** `1111` (Simplified view: Notices & Radio only)

---

## 📸 Comprehensive Visual Showcase

### 🖥️ 1. Main Lobby Touchscreen Kiosk Display (1080p Interactive Stage)

| 🐕 Notice: Pets & Lawn Care (Vertical 3:4 Layout) | 🌿 Notice: Pruning & Waste Schedule (Hadera) |
| :---: | :---: |
| ![Pets Notice](docs/screenshots/01_kiosk_notice_pets.png) | ![Pruning Notice](docs/screenshots/02_kiosk_notice_pruning.png) |

| 🧹 Notice: Corridor & Elevator Care | ✨ Notice: Daily Welcome & Building Greeting |
| :---: | :---: |
| ![Hallway Notice](docs/screenshots/03_kiosk_notice_hallway.png) | ![Welcome Notice](docs/screenshots/04_kiosk_notice_lobby.png) |

| 🕯️ Grand Hero Slide: Shabbat & Candle Lighting | 📞 Building Service & Emergency Contacts Directory |
| :---: | :---: |
| ![Shabbat Grand Hero](docs/screenshots/05_kiosk_shabbat_hero.png) | ![Emergency Contacts Directory](docs/screenshots/06_kiosk_contacts_directory.png) |

---

### 📱 2. Mobile & Tablet Committee Administration Panel (iOS / Android)

| 🔐 1. Dual-PIN Access Keypad | 📢 2. Notice Management Tab |
| :---: | :---: |
| ![PIN Login](docs/screenshots/07_admin_mobile_pin_login.png) | ![Notices Tab](docs/screenshots/08_admin_mobile_notices_tab.png) |

| 🎨 3. Display & Opacity Calibration | 📻 4. Background Radio & 103FM Player |
| :---: | :---: |
| ![Display Tab](docs/screenshots/09_admin_mobile_display_tab.png) | ![Radio Tab](docs/screenshots/10_admin_mobile_radio_tab.png) |

| 💡 5. Touch Gestures & Hardware Map | 🖼️ 6. Curated AI Image Gallery Picker |
| :---: | :---: |
| ![Touch Guide](docs/screenshots/11_admin_mobile_touch_guide.png) | ![Gallery Picker](docs/screenshots/04_admin_gallery_picker.png) |

---

## 📖 Overview
**Smart Building Digital Signage** is a lightweight, zero-bloat digital signage dashboard engineered specifically for residential lobby touchscreens (such as wall-mounted Android tablets or commercial smart screens). It replaces antiquated static slides with an interactive, rich, autonomous media board and an iPhone/Mobile-friendly administration panel for building committees (ועד בית).

Designed and developed by **[Omer Ninyo](https://github.com/omerninyo)**.

---

## ✨ Key Features & Capabilities

### 🔐 1. Role-Based Dual PIN System (מערכת הרשאות כפולה)
* **👤 Simplified Committee Member Mode (PIN: `1111`):**
  * Specially designed for non-technical or senior committee members.
  * Displays **ONLY 2 Tabs**: 📢 **הודעות ומודעות** (Notice Board) and 📻 **מוזיקה ורדיו** (Radio Controls).
  * Automatically **hides and locks** all complex system settings (Display, Opacity, Backlight Burn, Emergency Contacts, Security, Touch Guide) to prevent accidental alterations.
* **🔑 Master Admin Mode (PIN: `1234`):**
  * Full access to all 6 tabs, hardware calibration, background opacity sliders, theme management, and security PIN updates.

### 🖼️ 2. Dynamic Image & Wallpaper Gallery Picker (גלריית תמונות אינטראקטיבית)
* **Modal Picker in Notice Form:** Directly browse and pick ANY image from the system's curated asset library with 1 click.
* **Categorized Collections:**
  * 📢 **הודעות ועד:** Maintenance & Renovations (תחזוקה ושיפוץ), Cleaning & Gardening (ניקיון וגינון).
  * 🕯️ **שבת ומועדים:** Shabbat, Rosh Hashanah, Sukkot, Hanukkah, Pesach, Shavuot.
  * 🌿 **נופי ישראל ואבסטרקט:** Jerusalem Sunset, Galilee Olive Groves, Fluid Gold Luxury.
* **Custom Mobile Uploads:** Upload flyers/photos directly from iPhone or Android camera/gallery.

### 📢 3. Interactive Notice Board & Permanent Deletion (לוח הודעות ועד)
* **Urgent & Standard Notices:** Automatic priority styling (urgent alerts highlighted with glowing red badges).
* **Split-Screen & Image-Rich Layout:** 50% image flyer + 50% typography text for optimal viewing distance.
* **Permanent Local Deletion:** Deleted notices are tracked persistently across reloads via `smart_lobby_deleted_notices`.
* **Auto-Expiration:** Notices can be scheduled to automatically expire and disappear on a specific date.

### 📻 4. Background Radio & 103FM Streaming Suite (רדיו ומוזיקת רקע)
* **Top Israeli Radio Stations:**
  * 📻 **103FM (רדיו ללא הפסקה)**
  * 📻 **גלגלצ (Galgalatz)**
  * 📻 **גלי צה"ל (GLZ)**
  * 🎵 **כאן 88 (Kan 88)**
  * 🇮🇱 **כאן גימל (Kan Gimmel)**
  * 🎻 **קול המוסיקה (Kol HaMusica)**
  * 🌿 **Eco 99 FM**
  * 📻 **רדיוס 100FM**
  * ☕ **Chillout & Lofi Lounge (24/7)**
  * 🕺 **I Love Dance & Hits**
* **Admin Live Test Player:** Listen and verify radio streams directly inside the admin panel before deploying to the lobby.
* **Daily Auto-Play Scheduler:** Define daily broadcast hours (e.g. `08:00`–`21:00`).
* **Secret Mute Gesture:** Long-press the clock (1.2s) or double-tap the logo to instantly mute/unmute audio.

### ⚡ 6. Real-Time Global Cloud Sync (Google Firebase Firestore)
* **Instant Multi-Device Sync:** Any notice or setting updated from an iPhone/Android or laptop is synced instantly via Firebase Firestore () and pushed to the lobby screen in real-time without page reloads.
* **Offline Resilience:** Seamless fallback to LocalStorage and local JSON files if internet connection drops temporarily.
* **Fork-Safe & Domain Protected:** Secured via Google Cloud authorized domain filters.

### 🕯️ 5. Autonomous Jewish Calendar & Israeli Special Events (שבת ומועדי ישראל)
* **Dynamic Hebcal GPS Engine:** Automatic calculation of candle lighting, Havdalah times, and Parashat HaShavua for Hadera (`32.434°N, 34.9197°E`).
* **Automated Festive Themes:** Auto-activates matching photographic wallpapers for Shabbat, Rosh Hashanah, Yom Kippur, Sukkot, Hanukkah, Tu BiShvat, Purim, Pesach, Memorial Days, Independence Day, Shavuot, and Tu B'Av.
* **National Dates:** Special themes for 1st of September (שלום כיתה א'), New Year's, Family Day, and Elections.

### 🎨 6. Crystal Glassmorphism & Screen Calibration
* **Crystal Glassmorphism:** Ultra-sharp 12px blur with dynamic card opacity calculations (`--card-bg-opacity`).
* **Background Dimming & Opacity Sliders:** 0–100% real-time opacity adjustment with auto-dimming contrast layers.
* **Hardware Backlight Burn Compensation:** Built-in luminance compensation gradient and high-contrast pearl cards for older LCD panels.

### 🌦️ 7. Live Weather & Environmental Metrics (מזג אוויר וסביבה)
* Real-time temperature, condition descriptions in Hebrew, humidity, sunrise, and sunset times via Open-Meteo API.
* Interactive 4-day forecast modal and auto-rotating forecast slide.

### 📰 8. Live Breaking News Ticker (פס מבזקי חדשות רץ)
* Real-time RSS streaming headlines from **Ynet**, **Kan News**, or **Walla!**.
* Integrated custom ticker announcement from the building committee.
* Speed control (*Slow, Normal, Fast*) for comfortable reading.

---

## 🏗️ Architecture & Technology Stack

```mermaid
graph TD
    A[Lobby Touchscreen / Android Kiosk] -->|HTTP / WebSocket / Polling| B[Frontend Client - Vanilla JS & CSS3]
    B -->|Live Weather| C[Open-Meteo API]
    B -->|Shabbat & Holidays| D[Hebcal API]
    B -->|News RSS Feeds| E[Ynet / Kan / Walla]
    B -->|Radio Audio Streams| F[CDN Radio Streams - 103FM, Galgalatz, GLZ...]
    
    G[Committee Smartphone / iPhone] -->|Dual-PIN Protected| H[Admin Management Panel]
    H -->|PIN 1111| H1[Simplified Mode: Notices & Radio]
    H -->|PIN 1234| H2[Master Admin: Full System Control]
    H -->|CRUD & Settings| I[Storage Layer / LocalStorage / Cloud DB]
    I -->|Sync State| B
```

* **Frontend:** Vanilla JavaScript (ES6+), GPU-accelerated CSS transforms (`translate3d`), Fluid Typography (`clamp()`), Tailwind CSS.
* **Hosting:** GitHub Pages with Custom Domain (`lobby.ninyo.co`) and automated Actions CI/CD.
* **Zero External Dependencies:** Built specifically to guarantee 60fps smoothness even on legacy Android 7 hardware.

---

## 📱 Admin Panel Tabs & Access Levels

| לשונית | תיאור | גישת מנהל ראשי (`1234`) | גישת חבר ועד (`1111`) |
| :--- | :--- | :---: | :---: |
| 📢 **הודעות ומודעות** | יצירה, עריכה, מחיקה ובחירת תמונות מהגלריה | ✅ | ✅ |
| 📻 **מוזיקה ורדיו** | הפעלה/השתקה, בחירת תחנה, ווליום ובדיקת סאונד | ✅ | ✅ |
| 🎨 **תצוגה, רקע וחגים** | שקיפות רקעים, ערכות נושא, פיצוי צריבה, חגים | ✅ | ❌ *(מוסתר)* |
| 📞 **אנשי קשר וחירום** | מספרי טלפון למעלית, מוקד עירייה וחירום | ✅ | ❌ *(מוסתר)* |
| ⚙️ **הגדרות ואבטחה** | פרטי בניין, מקור חדשות, שינוי קודי PIN | ✅ | ❌ *(מוסתר)* |
| 💡 **עזרה ומפת מגע** | מדריך מחוות מגע במסך ונקודות אינטראקציה | ✅ | ❌ *(מוסתר)* |

---

## 🚀 Deployment Pathways & Hosting Options

### 1️⃣ Option A: GitHub Pages (Current Production Setup)
* **Custom Domain:** `lobby.ninyo.co`
* **Automated CI/CD:** Powered by `.github/workflows/deploy.yml`.
* **API Handling:** Fetches live weather directly from Open-Meteo, Jewish calendar from Hebcal, and news feeds via RSS.

### 2️⃣ Option B: Self-Hosted Node.js / Docker
* Standalone Node.js Express server (`server.js`) with local JSON storage (`data/`) and image uploads (`public/uploads/`).
* Run locally:
  ```bash
  npm install
  npm start
  ```

---

## 📺 Recommended Hardware & Android Kiosk Setup Guide

For permanent residential lobby installations (wall-mounted Android tablets, smart TVs, or commercial signage touchscreens), we **strongly recommend using [Fully Kiosk Browser](https://www.fully-kiosk.com/)** (Tested, Verified, and Approved in Production).

### 🏆 Why Fully Kiosk Browser is the Gold Standard:
* ⚡ **Legacy Hardware Compatibility:** Seamless 60fps hardware-accelerated rendering even on older Android 7+ devices and budget tablets.
* 🔒 **Locked Kiosk Mode:** Prevents residents or children from exiting the signage app, accessing Android settings, or opening unauthorized apps.
* 🔌 **Auto-Start & Power-Loss Recovery:** Automatically launches the lobby dashboard immediately upon device boot or power restoration.
* 💡 **Display & Screen Management:** Keeps the screen on 24/7 or configures automated sleep/wake schedules and screen saver dimming.
* 🔄 **Remote Management & Reload:** Allows remote reloads, cache clearing, and URL updates directly from the network or web portal.

### ⚙️ Recommended Fully Kiosk Browser Configuration:
1. **Web Browsing Settings:**
   * **Start URL:** `https://lobby.ninyo.co` (or your building's custom GitHub Pages domain).
   * **Enable WebGL / Hardware Acceleration:** `ON`
   * **Clear Cache on Start:** `OFF` (preserves instant offline loading).
2. **Device Management Settings:**
   * **Keep Screen On:** `ON` (when connected to AC power).
   * **Run as Launcher / Kiosk Mode:** `ON` (locks device to signage).
3. **Audio & Media Settings:**
   * **Autoplay Audio:** `Enabled` (for smooth background radio playback).

---

## 🌍 How to Deploy for Your Own Building (Open Source Guide)
Anyone is welcome to fork this repository and launch a smart lobby board for their own residential building in 3 minutes:

1. **Fork this repository** to your own GitHub account.
2. **Customize your building settings** in `data/settings.json` (Building name, city, and GPS coordinates for accurate Shabbat and weather times).
3. **Enable GitHub Pages:**
   * Go to **Settings** ➡️ **Pages** in your repository.
   * Under **Build and deployment**, select **Deploy from a branch** ➡️ choose `main` / `root` (or GitHub Actions).
   * Your building dashboard is immediately live!
4. *(Optional)* **Enable Real-Time Cloud Sync:**
   * Create a free project at [Firebase Console](https://console.firebase.google.com).
   * Copy `js/config.example.js` to `js/config.js` and paste your project credentials.

---

## 📜 License & Attribution

Copyright (c) 2026 **Omer Ninyo**.  
This project is licensed under the terms of the MIT License with mandatory attribution. Anyone is welcome to inspect, fork, and adapt this project for their own building, provided that **explicit credit to Omer Ninyo** is retained.

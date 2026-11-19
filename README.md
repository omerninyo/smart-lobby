<p align="center">
  <b><a href="README.md">🇬🇧 English</a></b> | 
  <b><a href="README.he.md">🇮🇱 עברית (Hebrew)</a></b> | 
  <b><a href="CHANGELOG.md">📋 Full Changelog</a></b>
</p>

# 🏢 Smart Building Digital Signage (לוח שילוט דיגיטלי חכם לבניין) — v2.6.0
> A modern, autonomous, touchscreen-enabled `1920×1080` Digital Signage Kiosk & Dual-Mode Building Committee Management Platform (Simplified Committee Mode + Full Master Admin) for iPhone, Android, and Desktop.

[![Version](https://img.shields.io/badge/Version-2.6.0-2563eb.svg)](CHANGELOG.md)
[![License: MIT](https://img.shields.io/badge/License-MIT%20with%20Attribution-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Android%207%2B%20Kiosk-brightgreen.svg)]()
[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-brightgreen.svg)](https://omerninyo.github.io/smart-lobby)
[![Author](https://img.shields.io/badge/Author-Omer%20Ninyo-orange.svg)](https://github.com/omerninyo)
[![Auth: SHA-256](https://img.shields.io/badge/Auth-Dual--PIN%20SHA--256-10b981.svg)](docs/wiki/Admin-Panel-&-Dual-PIN-Security.md)

---

## 🌐 Quick Access & Deployment
* 🖥️ **Lobby Kiosk Display (`1920×1080`):** `https://<your-domain>/` (or your GitHub Pages root)
* 📱 **Dual-Mode Mobile & Desktop Admin Panel:** `https://<your-domain>/admin.html`
  * 👤 **Committee Member PIN (Simplified Single-Page Mode — Template Default):** `1111` *(Automatically hashed with `SHA-256` once customized)*
  * 🔑 **Master Admin PIN (Full 6-Tab Control — Template Default):** `1234` *(Automatically hashed with `SHA-256` once customized)*

---

## 🔄 Before vs. After — System Evolution to v2.6.0

| Subsystem | ⬅️ Before (`v1.0–v2.3`) | ➡️ Now (`v2.6.0 / v272`) |
| :--- | :--- | :--- |
| **📱 Dual-Mode Admin UX: Simplified Committee Mode vs. Full Master Admin** | Dense single-flow admin layout with horizontally clipped mobile tabs requiring deep scrolling; confusing for older or non-technical committee members. | **Two Tailored Experiences in One App:** 1) **Simplified Committee Mode (`simple-committee-mode`):** Zero-scroll iPhone home screen with Hero **`➕ Publish Notice`**, **Home Quick Music Card & 4 Instant-Save Volume Buttons**, Active-only notice list, and collapsible Cleaning & Emergency drawers. 2) **Full Master Admin:** Visible **`3×2` Mobile Tab Grid**, **`👤 Committee View` live preview toggle**, all 6 tabs, **`SHA-256` Hashed PINs**, and **Partial-Patch Cloud Merge** preventing multi-device overwrites. |
| **📢 Notice Scheduling, Permanent Cleaning Days & Storage Hygiene** | Immediate manual publishing only with basic expiration; unbounded Base64 image accumulation in Firestore. | **1-Tap Duration Pills (`Unlimited` / `Tomorrow Eve` / `3 Days` / `1 Week` / `1 Month`)**, future scheduling (`startsAt`), weekly recurring days (`recurringDays`), **Permanent Cleaning Schedule Configurator (`#cleaning-schedule-panel`)** auto-highlighting **previous-evening** hallway item clearing (rugs, strollers, bikes, shoes, bags), **Active vs. Archived Notices Drawer**, and **Automated Base64 Image Pruning (`Auto-Prune`)**. |
| **✨ Smart Notice Composer & Enriched 14-Image Catalog** | Manual text entry from scratch; limited 6-image gallery repeating the same dog and lobby photo. | **Smart Committee Notice Assistant (`✨ Auto-Polish`)** across 11 topics + **7 1-Click Quick Templates** + optional Gemini API + Canvas compression (`720px`) + **14 lightweight vertical (`3:4`) notice images** (4 dog breeds, 4 buildings/lobbies, modern elevator, underground parking) with dynamic rotation (`resolveNoticeImageUrl`). |
| **🌤️ Full-Stage 1080p Weather, Air Quality & Marine Station** | Small 4-day forecast cards leaving dead vertical space on `1920×1080` displays. | **Full-Stage `1920×1080` Environmental & Marine Dashboard (Open-Meteo + all 28 WMO codes):** Enlarged 4-day forecast + spacious `2×2` grid for `AQI`, `UV`, coastal wave height & sea temperature, and a **Dynamic Condition & Day-Aware Resident Tip (`dailyTip`)**. |
| **🚆 Full-Stage 1080p "Leaving the Building" Transit Slide** | Not available. | **Scaled `1920×1080` Transit & Commute Slide (`transit_commute`):** Israel Railways departures (automatically aware of **Weekdays, Fridays, Shabbat, Erev Chag & Yom Tov**), non-truncated bus route badges, and peak-hour highway commute estimations. |
| **🧠 "Elevator Moment of Interest" + Live Hebrew Wikipedia** | Slideshow rotated only building notices, weather, and Shabbat cards. | **Contextual `1920×1080` Infotainment Slide (`daily_interest`):** **50+ science, space & local nature sets** blended with **Live Daily Hebrew Wikipedia "On This Day" (`תבנית:היום בהיסטוריה`)**, **14 dedicated Holiday & Shabbat pools**, and dignified **Memorial Day heritage mode**. |
| **🕯️ Complete Year-Round Calendar & Special Days** | Weekend candle-lighting only; Gregorian-only date under the clock. | **10-Day Rolling Full Israel Calendar (`hebcal?v=1&i=on`) + Auto DST:** Live Hebrew date under clock, weekday & weekend holidays, fasts, Rosh Chodesh, Sefirat HaOmer, Sigd, Hebrew Language Day, Family Day, Mimouna, automatic **`Asia/Jerusalem` Daylight Saving Time (`שעון קיץ / חורף`)** alerts, and 30+ national/global special days. |
| **📰 Modular 14-Channel News Builder & Anti-Clickbait** | Single RSS feed dropdown. | **Modular Multi-Channel Matrix (`#modular-news-matrix`):** Toggle any combination of **14 live channels** across News (`Ynet`, `N12/Mako` direct CORS XML, `Walla`, `Maariv`), Economy (`Globes`, `Ynet Econ`), Science/Tech (`Hayadan`, `Geektime`, `Ynet Tech`), and Local Building/Weather/Calendar/Trivia channels, with source badges and anti-clickbait filtering. |
| **📻 Morning Radio Auto-Resume & 24/7 `rk3368` Stability** | Nightly hard reloads wiped browser gesture unlock, muting morning radio; native WebView memory leaks. | **Gesture-Preserving Nightly Maintenance (`performNightSoftMaintenanceSweep`):** In-memory overnight sweeps preserve Chromium `navigator.userActivation` so morning radio starts automatically without screen-touch prompts; 10 verified live streams (`200 OK`); capped GPU ticker width (`<8192px`), `preload="none"` night teardown, and **Blackbox Flight Recorder (`device_logs` & `device_health`)**. |

---

## 📸 Comprehensive Live Visual Showcase (`v2.6.0 / v272`)

### 📱 1. Dual-Mode Admin Panel: Simplified Committee Mode vs. Full Master Admin (iPhone & Desktop)

| 👤 Simplified Committee Mode on iPhone (`simple-committee-mode`) — Everything on One Clean Screen: Hero Publish, Quick Music + 4 Instant Volume Presets & Active Notices | 🔑 Full Master Admin on iPhone — Live `👤 Committee View` Switcher & Visible `3×2` Mobile Tab Grid (Zero Horizontal Scrolling) |
| :---: | :---: |
| ![Simplified Committee Mode on iPhone](docs/screenshots/21_admin_iphone_simple_committee_v272.png) | ![Full Master Admin Grid on iPhone](docs/screenshots/22_admin_iphone_full_master_grid_v272.png) |

| ✍️ Smart Notice Composer: 7 Quick Templates, `✨ Auto-Polish` & 1-Tap Duration Pills (`Unlimited` / `Tomorrow Eve` / `3 Days` / `1 Week` / `1 Month`) | 🧼 Permanent Cleaning Schedule Configurator (Auto Previous-Evening Reminder), Archived Notices Drawer & Collapsible Emergency Panel |
| :---: | :---: |
| ![Smart Notice Composer & Duration Pills](docs/screenshots/16_admin_emergency_and_ai_assistant_v260.png) | ![Cleaning Configurator Archive & Emergency](docs/screenshots/23_admin_cleaning_and_archive_v272.png) |

| 🧩 Tab 2 (Display & News): `Lite Mode`, Resolution Selector & 14-Channel Modular News Builder (`#modular-news-matrix`) | 🛡️ Tab 5 (System & Security): Live Device Health (`device_health`), Blackbox Flight Recorder (`device_logs`) & `SHA-256` Hashed PINs |
| :---: | :---: |
| ![14-Channel Modular News Builder & Display](docs/screenshots/18_admin_display_slides_and_news_v260.png) | ![Device Health Blackbox & SHA-256 PINs](docs/screenshots/24_admin_health_blackbox_sha256_v272.png) |

| 🖼️ Enriched 14-Image Notice Gallery Modal (4 Dog Breeds, 4 Buildings/Lobbies, Modern Elevator & Parking) | 🔐 Mobile PIN Login Keypad (with Show/Hide PIN Toggle & `SHA-256` Verification) |
| :---: | :---: |
| ![Enriched 14-Image Notice Gallery](docs/screenshots/17_admin_gallery_enriched_v260.png) | ![Mobile PIN Login](docs/screenshots/07_admin_mobile_pin_login.png) |

| 📻 Mobile Radio Schedule & 10 Verified Stations Tab | 💡 Mobile Physical Touchscreen Gestures Guide |
| :---: | :---: |
| ![Mobile Radio Tab](docs/screenshots/10_admin_mobile_radio_tab.png) | ![Mobile Touch Gestures Guide](docs/screenshots/11_admin_mobile_touch_guide.png) |

---

### 🖥️ 2. `1920×1080` Full HD Lobby Kiosk Display — Full-Stage Scaled Panels, Calendar & Live Wikipedia

| 🌤️ Full-Stage `1080p` 4-Day Forecast + Spacious `2×2` Air Quality (`AQI`), `UV`, Marine & Resident Tip Grid + Live Hebrew Date & Source-Tagged Ticker | 🚆 Full-Stage `1080p` "Leaving the Building" — Israel Railways (Shabbat/Holiday-Aware), Local Buses & Live Highway Commute |
| :---: | :---: |
| ![Weather Air & Sea 1080p](docs/screenshots/12_kiosk_weather_air_sea_v260.png) | ![Transit & Commute 1080p](docs/screenshots/13_kiosk_transit_commute_v260.png) |

| 🧠 Full-Stage `1080p` "Elevator Moment of Interest" — Contextual Holiday/Shabbat/Memorial Pools + Live Daily Hebrew Wikipedia "On This Day" | 🧹 Permanent Cleaning Schedule Notice in Rotation — Highlighting Previous-Evening Clearing of Rugs, Strollers, Bikes, Shoes & Bags |
| :---: | :---: |
| ![Daily Interest Trivia & Wikipedia 1080p](docs/screenshots/14_kiosk_daily_interest_trivia_v260.png) | ![Permanent Cleaning Schedule Notice](docs/screenshots/25_kiosk_cleaning_schedule_notice_v272.png) |

| 🕯️ Interactive Hebrew Calendar, Shabbat & Upcoming Holidays Touch Modal | 🚨 Full-Screen Emergency / Pikud HaOref Shelter Override (with Immediate Radio Mute) |
| :---: | :---: |
| ![Interactive Israel Calendar Modal](docs/screenshots/26_kiosk_israel_calendar_modal_v272.png) | ![Emergency Mode Override](docs/screenshots/15_kiosk_emergency_oref_v260.png) |

| 🐶 Dynamic Dog Notice Pool Rotation (French Bulldog in Lobby / Toy Poodle / Border Collie / Golden Retriever) | 🏢 Dynamic Building & Lobby Pool Rotation (Modern Israeli Exterior / Boutique Lobby / Evening Courtyard) |
| :---: | :---: |
| ![Enriched Dog Notice Pool](docs/screenshots/19_kiosk_notice_new_dogs_v260.png) | ![Enriched Building Notice Pool](docs/screenshots/20_kiosk_notice_new_building_v260.png) |

| 🕯️ Festive Grand Hero Slide: Shabbat Shalom & Parashat HaShavua | 📞 Building Service & Emergency Contacts Directory |
| :---: | :---: |
| ![Shabbat Grand Hero](docs/screenshots/05_kiosk_shabbat_hero.png) | ![Emergency Contacts Directory](docs/screenshots/06_kiosk_contacts_directory.png) |

| 🐕 Pets & Cleanliness Notice (Zero Clipping `46fr/54fr` Split Grid) | 🌿 Municipal Pruning & Waste Schedule Notice |
| :---: | :---: |
| ![Pets Notice](docs/screenshots/01_kiosk_notice_pets.png) | ![Pruning Notice](docs/screenshots/02_kiosk_notice_pruning.png) |

---

## ✨ Key Features & Capabilities (`v2.6.0 / v272`)

### 📱 1. Dual-Mode Mobile Admin UX: Simplified Committee Mode vs. Full Master Admin
* **Simplified Committee Mode (`simple-committee-mode` — Built for iPhone & Non-Technical Committee Members):**
  * Presents a single, distraction-free Home screen (`55%` shorter vertical scroll height) hiding advanced technical tabs.
  * **Above the Fold on iPhone:** Full-width **`➕ Publish New Notice`** hero button, followed immediately by the **`📻 Lobby Music & Radio`** Quick Card featuring 1-tap On/Off, **4 instant-save volume presets (`🔇 Mute` / `🔉 Low` / `🔊 Normal` / `📢 Loud`)**, and quick station selector.
  * **Active vs. Archived Notice Separation:** Only currently active lobby notices appear in the main list; expired or hidden notices are tucked into **`📁 Old / Hidden Notices`** with 1-tap **`🧹 Purge Expired Notices`**.
  * **Collapsible Bottom Drawers:** Clean `<details>` drawers for **`🧼 Permanent Cleaning Days`** and **`🚨 Emergency Broadcast`** (which stays collapsed in routine and jumps automatically to `order: -10` at the top of the screen when active).
* **Full Master Admin Mode:**
  * **Visible `3×2` Mobile Tab Grid:** All 6 tabs visible simultaneously on iPhone without horizontal scrolling, with iOS Safe-Area support, `46px` touch targets, and `16px` zoom-free inputs.
  * **Live `👤 Committee View` Preview Switcher:** Lets the Master Admin preview and test the exact simplified Committee experience in 1 tap.
  * **Race-Protected Partial-Patch Cloud Sync:** `saveSettingsToServer()` sends surgical field-level patches (`{ merge: true }`) rather than overwriting the full settings document from backgrounded mobile tabs, paired with `getFreshNoticesForMutation()` before notice edits.

### 📢 2. Smart Notice Board, Permanent Cleaning Schedule & AI/Heuristic Assistant
* **Permanent Cleaning Schedule & Previous-Evening Reminder (`notice-cleaning-schedule`):** 1-click weekly cleaning day selector (e.g., Sunday & Thursday `[0, 4]`) that automatically computes the **previous-evening** clearing schedule (`Motzaei Shabbat & Wednesday evening`) reminding residents to clear rugs, strollers, bicycles, shoes, and bags from hallways and the lobby before early-morning washing.
* **1-Tap Duration Pills & Scheduling:** Quick expiration buttons (`Unlimited`, `Tomorrow Eve`, `3 Days`, `1 Week`, `1 Month`), future start timestamps (`startsAt`), and weekly recurring days (`recurringDays`).
* **Smart Committee Notice Assistant (`✨ Auto-Polish`) & 14-Image Catalog:** Zero-key offline Hebrew composer across 11 topics + optional Gemini API, 7 quick templates, HTML5 Canvas upload compression (`720px`), 24h `Auto-Prune`, and 14 lightweight `3:4` notice images dynamically rotated via `resolveNoticeImageUrl()`.

### 🕯️ 3. Complete Year-Round Israel Calendar, Auto DST & Live Hebrew Wikipedia
* **10-Day Rolling Full Israel Calendar (`hebcal?v=1&i=on`):** Covers mid-week and weekend Jewish holidays, fast days, Rosh Chodesh, Sefirat HaOmer (with exact Lag BaOmer disambiguation), Sigd, Hebrew Language Day, Family Day, Mimouna, evening transitions (`Erev Yom HaZikaron` → `Yom HaAtzmaut`), and a 7-day upcoming events list inside the interactive touch modal.
* **Automatic Israel DST (`detectIsraelDstTransition`) & 30+ Special Days:** Automatically detects `Asia/Jerusalem` summer/winter clock transitions alongside school-year milestones, solstices/equinoxes, and national/international observances.
* **Live Daily Hebrew Wikipedia "On This Day" (`תבנית:היום בהיסטוריה`):** Fetches verified historical events for today's date from Hebrew Wikipedia (cached once per 24h in `localStorage` with family-friendly filtering), paired with 14 dedicated Holiday, Shabbat, and dignified Memorial Day content pools.

### 🌤️ 4. Full-Stage `1920×1080` Info Panels (Weather/Marine, Transit & Trivia)
* **Weather, Air Quality & Marine (`weather_forecast`):** All 28 WMO weather codes, enlarged 4-day forecast, and spacious `2×2` grid for European `AQI`, `UV` index, wave height & sea temperature, plus a dynamic weather- and day-aware resident tip.
* **Transit & Highway Commute (`transit_commute`):** Upcoming Israel Railways departures (aware of weekdays, Fridays, Shabbat, Erev Chag, and Yom Tov), non-truncated bus route badges, and peak-hour highway drive times.
* **Daily Interest & Trivia (`daily_interest`):** Distance-readable `1080p` typography (`~31px–35px`) rotating tens of thousands of science, history, and trivia combinations.

### 📰 5. Modular 14-Channel News Matrix & Anti-Clickbait Engine
* **Granular Multi-Channel Selector (`#modular-news-matrix`):** Choose quick presets (`smart_mix`, `science_tech`, `economy`, `building_only`) or toggle individual checkboxes across **14 live channels**: News (`Ynet`, `Ynet Flash`, `N12/Mako` direct CORS XML, `Walla`, `Maariv`), Economy (`Globes`, `Ynet Econ`), Science/Tech (`Hayadan`, `Geektime`, `Ynet Tech`), and Local Building/Weather/Calendar/Trivia updates, with color-coded source tags and anti-clickbait filtering.

### 📻 6. Verified Israeli Radio Suite & Overnight Gesture-Preserving Auto-Resume
* **10 Verified Live Streams (`200 OK`):** `Galgalatz`, `103FM`, `GLZ`, `Kan 88`, `Kan Gimmel`, `Kol HaMusica`, `Eco 99 FM`, `Radios 100FM`, `Chillout Lounge`, and `Dance & Hits` (with automatic runtime upgrade of legacy cached URLs).
* **Automatic Morning Resume Without Touch Prompts:** Nightly maintenance at `23:05` and `04:00 AM` runs non-destructive in-memory sweeps (`performNightSoftMaintenanceSweep`) rather than hard page reloads, preserving Chromium Sticky User Activation (`navigator.userActivation.hasBeenActive`) overnight while tearing down native audio decoders (`preload="none"`) during quiet hours and auto-recovering stalled streams within 30s.

### 🔐 7. `SHA-256` PIN Security, Fork Isolation & 24/7 `rk3368` Hardware Resilience
* **Salted `SHA-256` PIN Hashing & Backend Hardening:** Plaintext PINs are never stored in Git or Firestore (`adminPinHash` / `editorPinHash`), template default PINs (`1234`/`1111`) are strictly disabled once custom PINs are set, and `server.js` enforces atomic `.tmp` + `rename` writes, SSRF protection, and authenticated uploads.
* **Automatic Fork Isolation:** Any third-party fork or template copy automatically runs in standalone local mode (`data/*.json`) until configured via `.gitignore`d `js/config.js` or the `FIREBASE_CONFIG_JS` GitHub Secret.
* **Battle-Tested on Legacy Kiosks (`Android 7.1.2 / rk3368`):** `Lite Mode`, GPU-safe `<8192px` ticker batching, live `device_health` heartbeats, and `device_logs` Blackbox Flight Recorder.

---

## 🏗️ Architecture & Data Flow

```mermaid
graph TD
    A["Lobby Screen Kiosk (index.html • 1080p)"] <-->|Realtime WebSocket| B("Firebase Cloud Firestore")
    C["Open-Meteo Weather + AQI + Marine"] -->|Forecast, Air & Sea| A
    D["Hebcal Israel (i=on) + Auto DST"] -->|Holidays, Shabbat & Rolling Calendar| A
    W["Hebrew Wikipedia API"] -->|Live Daily On-This-Day| A
    E["10 Verified Israeli Radio Streams"] -->|Overnight-Unlocked Stall-Safe Audio| A
    F["14-Channel Modular News Matrix"] -->|Anti-Clickbait Source-Tagged Ticker| A
    O["Pikud HaOref Poller (Local Server)"] -->|Auto Shelter Override| A
    G["Dual-Mode Admin Panel (admin.html)"] -->|Partial-Patch Cloud Merge| B
    H["SHA-256 Hashed Dual-PIN Auth"] -->|Committee PIN| H1["Simplified 1-Page Committee Home (Notices + Music)"]
    H -->|Master Admin PIN| H2["Full Master Admin (3x2 Mobile Grid, 6 Tabs & Blackbox)"]
```

---

## 📱 Admin Panel Tabs & Access Levels (`SHA-256` Dual-PIN)

| Tab | Description | Master Admin (`1234` template) | Committee Member (`1111` template) |
| :--- | :--- | :---: | :---: |
| 📢 **1. Home: Notices, Quick Music & Emergency** | Hero Publish Notice (1-tap duration pills & AI composer), **Home Quick Music Card & 4 Instant Volume Buttons**, Active vs. Archived notices drawer, collapsible Cleaning Days & auto-jumping Emergency drawers | ✅ *(+ `👤 Committee View` toggle)* | ✅ *(Unified Zero-Scroll Home)* |
| 🎨 **2. Display, Slides & Modular News** | `Lite Mode`, Resolution Selector (`1080p`/`720p`), Transit & Daily Interest toggles, **14-Channel Modular News Matrix**, opacity & burn-in compensation | ✅ | ❌ *(Hidden)* |
| 📞 **3. Contacts & Elevator** | Building service numbers (elevator, municipality, committee, emergency) | ✅ | ❌ *(Hidden)* |
| 📻 **4. Radio Schedule & Test Player** | Daily auto-play start/end schedule (`06:30–23:00`), fine volume slider, live mobile test player across 10 verified stations | ✅ | ❌ *(Quick Music Card on Home)* |
| ⚙️ **5. System, Health & Security** | Building GPS settings, live Device Health (`device_health`), Blackbox Flight Recorder (`device_logs`), **`SHA-256` Hashed PIN management** | ✅ | ❌ *(Hidden)* |
| 💡 **6. Help & Touch Map** | Interactive lobby touchscreen gestures guide | ✅ | ❌ *(Hidden)* |

---

## 📦 Release History

| Version | Date | Highlights |
| :--- | :---: | :--- |
| **`v2.6.0` (`v272`)** | `2026-11-19` | **Dual-Mode Mobile Admin (Simplified Committee + Full Master), Complete Year-Round Israel Calendar, Live Wikipedia On-This-Day, Full-Stage 1080p Scaling, `rk3368` Stability & `SHA-256` Security:** Redesigned mobile Admin for non-technical committee members (zero-scroll Home with Quick Music & 4 instant volume buttons, 1-tap notice duration pills, Active/Archived separation, `3×2` admin tab grid, partial-merge cloud sync); permanent Cleaning Schedule configurator with previous-evening alerts; full rolling Israel Hebcal (`i=on`) + automatic Israel DST + 30+ special days + **live daily Hebrew Wikipedia "On This Day"** + 14 contextual holiday/memorial/Shabbat pools; full-stage `1920×1080` panel scaling & `46fr/54fr` split-notice clipping fix; overnight audio-gesture preservation & 10 verified streams; **`SHA-256` hashed PINs**, fork isolation, and refreshed visual showcase. |
| **`v2.5.0`** | `2026-10-18` | **Smart Admin Innovations:** Notice start scheduling (`startsAt`) & weekly recurring days (`recurringDays`); **Full-Screen Emergency Alert Mode** with 1-click presets and automatic radio mute; **Smart Committee Notice Assistant (`✨ Auto-Polish`)**; and automatic Base64 image pruning (`Auto-Prune`). |
| **`v2.4.6`** | `2026-10-18` | **24/7 Network & Kiosk Resilience:** Automatic Wi-Fi reconnect & dynamic Firebase SDK recovery; lazy subscriptions for `device_health` and `device_logs`; 30s live radio stall recovery; 45s modal auto-close watchdog; zombie notice prevention. |
| **`v2.4.3–2.4.5`** | `2026-10-13` | **Blackbox Flight Recorder, Resolution Selector & GPU Optimization:** Cloud crash/event diagnostics (`smart_lobby/device_logs`), screen resolution scaling (`auto` / `1080p` / `720p`), HTML5 Canvas upload compression (`720px`), and `Lite Mode` GPU optimizations. |
| **`v2.1.0–2.4.2`** | `2026-09-16` | **Firebase Cloud Sync, Dual-PIN Security, 15 Holiday Themes & Lite Mode:** Real-time Firestore synchronization, `device_health` telemetry, 15 Jewish holiday photographic themes, and hardware `Lite Mode`. |

*(See [`CHANGELOG.md`](CHANGELOG.md) for the complete technical changelog).*

---

## 🌍 How to Deploy for Your Own Building (3-Minute Open Source Guide)
1. **Click `Use this template` or `Fork`** on this repository.
2. **Customize your building settings** in `data/settings.json` (Building name, city, and GPS coordinates). *(Runs immediately out-of-the-box in standalone mode with zero Firebase setup required!).*
3. **Enable GitHub Pages** under **Settings ➡️ Pages** (via **GitHub Actions** or `main` branch).
4. *(Optional — for real-time smartphone sync)* **Connect Firebase Firestore:**
   * Create a free project at [Firebase Console](https://console.firebase.google.com), provision **Firestore Database**, and publish [`firestore.rules`](firestore.rules).
   * Copy `js/config.example.js` to a local `js/config.js` (or set the `FIREBASE_CONFIG_JS` GitHub Actions Secret) with your Firebase Web app credentials.

---

## 📜 License & Attribution

Copyright (c) 2026 **Omer Ninyo**.  
This project is licensed under the terms of the MIT License with mandatory attribution. Anyone is welcome to inspect, fork, and adapt this project for their own building, provided that **explicit credit to Omer Ninyo** is retained.

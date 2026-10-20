# Master Design Specification (Smart Lobby — v2.6.0)

## 1. Architectural Philosophy
Smart Lobby enforces a strict two-tier visual and operational standard separating mobile/desktop administrative controls (`admin.html`) from the 24/7 autonomous public lobby display (`index.html`).

---

## 2. Tier 1: Admin Panel Specification (`admin.html`)
* **Visual Restraint:** Monochromatic, dark palette based on Tailwind slate/gray tones (`#090d16`, `#161e31`, `#1e293b`). High-contrast crimson accents are reserved strictly for the **Emergency Alert Broadcast Panel**.
* **Role-Based Dual-PIN Access:**
  * **Master Admin:** Full access to all 6 tabs (Notices & Emergency, Display & Slides, Contacts, Radio, Settings/Health/Blackbox, Touch Guide).
  * **Committee Editor:** Scoped access to Tab 1 (Notices & Emergency Alert Mode) and Tab 4 (Music & Radio), hiding hardware calibration and security settings.
* **Smart Authoring & Media Pipeline:**
  * **Smart Committee Notice Assistant (`#ai-polish-notice-btn`):** Built-in 11-topic Hebrew heuristic composer + optional Gemini 1.5 Flash API integration + 7 1-click quick templates (`SMART_DRAFTS`).
  * **Scheduled & Recurring Notices:** Supports `startsAt`, `expiresAt`, and weekly `recurringDays` (`[0..6]`).
  * **Client-Side Compression & Auto-Prune:** Automatic HTML5 Canvas compression (`720px`, `0.78` quality) on mobile photo uploads, paired with automated pruning (`pruneExpiredNoticeImages`) of heavy Base64 images from notices expired >24 hours.
* **Responsive Density:** High-density desktop grid with responsive vertical stacking on mobile devices. Touch targets satisfy minimum 44px height.

---

## 3. Tier 2: Public Lobby Screen Specification (`index.html`)
* **Form Factor & Distance:** 16:9 Landscape aspect ratio with selectable resolution scaling (`auto`, `1080p` Full HD, `720p` HD Ready / Tablet), optimized for readability at 3 to 5 meters.
* **Typography:** Fluid sizing using CSS `clamp()` anchored to viewport dimensions.
* **Multi-Zone Spatial Layout:**
  1. **Top Header Bar:** Live digital clock with combined Gregorian + Hebrew letter date (`#clock-date-greg`), dynamic Shabbat/Holiday/Omer/Hanukkah/Rosh Chodesh center widget (`#header-center-widget`), and current weather summary.
  2. **Main Interactive Stage (Slideshow Deck):**
     * **Committee Notice Slides (`notice`):** 3:4 vertical visual split or text-focused layout with urgent badge prioritization.
     * **Emergency Override Slide (`emergency_alert`):** High-contrast crimson full-stage alert triggered manually from Admin or automatically via the **Pikud HaOref Alert Poller (`startOrefAlertPoller`)**, immediately muting background audio.
     * **Weather, Air Quality & Marine Forecast (`weather_forecast`):** 4-day forecast + Open-Meteo `AQI`, `UV` index, coastal wave height/water temperature, and automated daily resident tip (`dailyTip`).
     * **Transit, Train & Commute Slide (`transit_commute`):** Israel Railways departures (South/North with Shabbat awareness), local bus routes, and live peak-hour highway drive times.
     * **Daily Interest & Trivia Slide (`daily_interest`):** Captivate-style infotainment rotation (20 daily sets of History/Science fact, Trivia puzzle with answer, and Home/Community tip).
     * **Shabbat & Holiday Grand Hero (`shabbat_holiday`)** and **Building Contacts Directory (`contacts`)**.
  3. **Right Side Feed:** Persistent summary list of active committee notices.
  4. **Bottom Footer Bar:** **Smart Mix (`smart_mix`) Anti-Clickbait News Ticker** (`filterClickbaitAndFormatHeadline`) with `rss2json` (10-min interval) + `AllOrigins` XML `DOMParser` fallback, paired with the live radio status indicator.
* **Lite Mode & 24/7 Hardware Safeguards:**
  * Instant fallback to solid `rgba(15, 23, 42, 0.95)` backgrounds (`body.lite-mode`) for low-spec Android WebView kiosks (`Rockchip rk3368`), bypassing GPU-heavy `backdrop-filter: blur()`, `box-shadow` animations, and Ken-Burns scaling.
  * 45-second inactivity auto-close timer on touch modals (`#interactive-modal`), 30-second live radio stall recovery, automatic Wi-Fi reconnect listener, and cloud-synced **Blackbox Flight Recorder (`smart_lobby/device_logs`)**.

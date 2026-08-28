# 🧠 AGENT_CONTEXT_HANDBOOK.md
## Technical Reference, Data Contracts & Continuity Handbook
**Project:** Building Digital Signage (שילוט דיגיטלי - הירדן 5 חדרה)  
**Target Environment:** Android 7 Kiosk (Chrome/WebKit), Landscape 16:9 (1920x1080 & 1280x720) with Touchscreen.  
**Admin Environment:** Mobile Safari (iOS iPhone), Android Chrome, Desktop browsers.

---

## 🧭 1. Executive Context & Core Principles
1. **Zero External Heavy Dependencies on Frontend:**  
   The kiosk device in the building lobby runs an older Android 7 OS with limited RAM and CPU. The frontend strictly uses Vanilla JavaScript and optimized CSS3 (with GPU-accelerated `translate3d` and `will-change`). Do NOT introduce heavy frontend frameworks (React, Vue, Angular, etc.) on the display client.
2. **Kiosk Layout Constraints:**  
   The viewport MUST never show scrollbars (`overflow: hidden` on `#kiosk-container`). Layout dimensions must scale fluidly via clamp() and CSS Grid.
3. **Hardware Backlight Compensation:**  
   The physical screen in the lobby has burnt-out/degraded LEDs on the left side. The system includes an adjustable CSS brightness booster (`--left-boost`), high-contrast white card rendering, and layout flipping.
4. **שפת מענה וכיווניות (RTL):**  
   כל התשובות וההודעות למשתמש בשיחה חייבות להיכתב בעברית ולהיות עטופות ב-`<div dir="rtl">` כדי להבטיח יישור פיזי מוחלט לימין בממשק השיחה.

---

## 🗄️ 2. State & Data Schema Contracts

### `data/settings.json` Schema:
```json
{
  "building": {
    "name": "הירדן 5",
    "city": "חדרה",
    "subtitle": "לוח מודעות דיגיטלי",
    "lat": 32.4340,
    "lon": 34.9197
  },
  "display": {
    "resolution": "auto",           // "auto" | "1080p" | "720p"
    "orientation": "landscape",
    "slideDurationSeconds": 12,
    "tickerSpeed": "slow",          // "slow" | "normal" | "fast"
    "theme": "auto",                // "auto" | "manual"
    "customTheme": "modern-dark",   // theme key for manual mode
    "showWeather": true,
    "showShabbat": true,
    "showNewsTicker": true,
    "showSideWidgets": true,
    "showElevatorBar": true,
    "showContactsSlide": true,
    "leftBurnCompensation": 45,     // 0 - 100 (percentage)
    "highContrastSideCards": true,  // boolean (white high-contrast cards on left)
    "layoutSide": "left",           // "left" (default) | "right" (flipped layout)
    "newsSource": "ynet",           // "ynet" | "kan" | "walla"
    "customTickerText": "ועד הבית מאחל יום נעים ובטוח לכל הדיירים והאורחים!"
  },
  "contacts": [
    {
      "id": "c-1",
      "name": "שירות ותקלות מעלית",
      "phone": "*5555 / 03-5555555",
      "icon": "🛗",
      "desc": "חברת מעליות שינדלר/אלקטרה",
      "isPrimaryElevator": true,
      "enabled": true
    }
  ],
  "radio": {
    "enabled": false,
    "autoPlaySchedule": true,
    "startHour": "08:00",
    "endHour": "21:00",
    "currentStation": "galgalatz",
    "volume": 0.4,
    "stations": [ ... ]
  },
  "security": {
    "adminPin": "1234"
  }
}
```

### `data/notices.json` Schema:
```json
[
  {
    "id": "notice-123456789",
    "title": "כותרת ההודעה",
    "content": "תוכן ההודעה המלא...",
    "author": "ועד הבית",
    "isUrgent": false,
    "imageUrl": "/uploads/flyer-example.jpg", // optional (null or url string)
    "createdAt": "2026-08-28T12:00:00.000Z",
    "expiresAt": null                         // ISO Date string or null
  }
]
```

---

## 🌐 3. REST API Endpoint Directory

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/settings` | None | Returns public display settings & contact info |
| `POST` | `/api/settings` | PIN in body | Updates settings (`{ pin, newSettings }`) |
| `GET` | `/api/notices` | None | Returns list of active, unexpired notices |
| `POST` | `/api/notices` | PIN in body | Creates/updates notice (`{ pin, notice }`) |
| `DELETE` | `/api/notices/:id` | Header `x-admin-pin` | Deletes notice by ID |
| `GET` | `/api/photos` | None | Returns list of uploaded flyers/photos |
| `POST` | `/api/photos/upload` | Header `x-admin-pin` | Multi-part form upload (`photo` field) |
| `DELETE` | `/api/photos/:filename` | Header `x-admin-pin` | Deletes uploaded photo |
| `GET` | `/api/weather` | None | Returns cached Open-Meteo weather for Hadera |
| `GET` | `/api/shabbat` | None | Returns Shabbat times & Jewish holiday from Hebcal |
| `GET` | `/api/news` | None | Returns parsed RSS news items from selected source |

---

## 🛠️ 4. Known Bugs Solved & Architectural Guardrails (DO NOT REVERT)

### 🔴 1. iOS Safari WebKit Double-Click File Picker Bug
* **Symptom:** On iPhone / iOS Safari, tapping the upload button fails to open the Photo Library.
* **Root Cause:** If `<input type="file" id="...">` is placed *inside* `<label for="...">`, iOS WebKit fires two consecutive synthetic click events, which WebKit's security sandbox interprets as user cancellation.
* **Mandatory Pattern:** Always keep `<input type="file" accept="image/*">` as a direct, standalone native HTML element without wrapping `<label>` overlay hacks.

### 🔴 2. Slide Superimposition Bug (Overlapping Text)
* **Symptom:** During slide rotations, multiple slide cards appear superimposed on top of each other.
* **Root Cause:** CSS opacity-only transitions with relative positioning allowed multiple active cards to stack transparently. Furthermore, asynchronous data refreshes reset DOM card classes while the timer index was advancing.
* **Mandatory Pattern:**
  1. In CSS: `.slide-card` has `display: none !important;` by default. Only `.slide-card.active` has `display: flex !important;`.
  2. In `goToSlide(index)`: Always iterate over all cards and strip `.active` from every card before applying it strictly to the current index.
  3. In `renderSlideCards()`: Always bind `.active` strictly to `this.currentSlideIndex` instead of hardcoded `idx === 0`.

### 🔴 3. Body Class Overwriting in Theme Refresh
* **Symptom:** Changing themes or loading Shabbat data inadvertently cleared `high-contrast-side` or `layout-flipped` classes.
* **Mandatory Pattern:** Never do `document.body.className = "..."`. Always use `document.body.classList.add/remove` or targeted `theme-*` class replacements.

### 🔴 4. Audio Autoplay Unlocking
* **Symptom:** Browsers block audio playback unless initiated by user interaction.
* **Solution:** A subtle audio unlock prompt is displayed on initial boot. In addition, double-tapping the building logo (`#brand-secret-mute`) acts as a secret toggle to mute/unmute and unlock the audio stream.

### 🔴 5. Kiosk Hidden Gestures
* **Secret Kiosk Admin:** 5 rapid taps on the header clock opens a PIN prompt on-screen.
* **Secret Mute:** 2 rapid taps on the building logo toggles background music.
* **Touch Modals:** Tapping on weather, environmental stats, or RSS ticker opens rich interactive modal views.

---

## 🔄 5. Future Development Checklist
- [ ] Support for Telegram/WhatsApp bot webhook for direct notice posting.
- [ ] Emergency alert override banner (Pikud HaOref API integration).
- [ ] Cloud sync / remote backup for multiple screens.

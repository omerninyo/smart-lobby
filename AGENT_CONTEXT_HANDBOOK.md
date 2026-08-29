# 🧠 AGENT_CONTEXT_HANDBOOK.md
## Technical Reference, Data Contracts & Continuity Handbook
**Project:** Building Digital Signage (שילוט דיגיטלי - הירדן 5 חדרה)  
**Production URL:** [https://lobby.ninyo.co](https://lobby.ninyo.co)  
**Admin Panel:** [https://lobby.ninyo.co/admin.html](https://lobby.ninyo.co/admin.html)  
**Target Environment:** Android 7 Kiosk (Chrome/WebKit), Landscape 16:9 (1920x1080 & 1280x720) with Touchscreen.  
**Admin Environment:** Mobile Safari (iOS iPhone), Android Chrome, Desktop browsers.

---

## 🧭 1. Executive Context & Core Principles
0. **Firebase Real-Time Global Cloud Sync:**
   The entire system is powered by Google Firebase Cloud Firestore (`smart-lobby-yarden` via `js/firebase-sync.js`). Any changes made in Admin from any mobile/desktop device anywhere in the world are synced to Firestore in <100ms and pushed via live websockets (`onSnapshot`) directly to the physical lobby screen in real-time without page reloads.

1. **Zero External Heavy Dependencies on Frontend:**  
   The kiosk device in the building lobby runs an older Android 7 OS with limited RAM and CPU. The frontend strictly uses Vanilla JavaScript and optimized CSS3 (with GPU-accelerated `translate3d` and `will-change`). Do NOT introduce heavy frontend frameworks (React, Vue, Angular, etc.) on the display client.
2. **Kiosk Layout Constraints:**  
   The viewport MUST never show scrollbars (`overflow: hidden` on `#kiosk-container`). Layout dimensions must scale fluidly via clamp() and CSS Grid.
3. **Hardware Backlight Compensation:**  
   The physical screen in the lobby has burnt-out/degraded LEDs on the left side. The system includes an adjustable CSS brightness booster (`--left-boost`), high-contrast pearl card rendering, and layout flipping.
4. **Crystal Glassmorphism & Contrast:**  
   Dynamic card opacity (`--card-bg-opacity`) with crisp 12px blur ensures maximum readability over complex photographic wallpapers without washing out the text.
5. **Strict Photo Quality & Judaica Authenticity:**  
   NO humans/people in any background imagery. Authentic Jewish ceremonial objects (candles, kiddush cup, challah, etrog, menorah, seder plate) and pristine Israeli scenery (Jerusalem, Galilee).
6. **שפת מענה וכיווניות (RTL):**  
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
    "bgOpacity": 85,                 // 0 - 100 (percentage)
    "leftBurnCompensation": 0,       // 0 - 100 (percentage)
    "highContrastSideCards": false,  // boolean
    "layoutSide": "left",           // "left" (default) | "right" (flipped layout)
    "headerClockPosition": "left",  // "left" | "right" | "center"
    "headerBrandPosition": "right", // "left" | "right" | "center"
    "headerShabbatPosition": "center",
    "sideColumnWidth": "normal",    // "compact" | "normal" | "wide"
    "showStageArrows": true,
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
    "enabled": true,
    "autoPlaySchedule": true,
    "startHour": "08:00",
    "endHour": "21:00",
    "currentStation": "galgalatz",
    "volume": 0.4,
    "stations": [
      { "id": "galgalatz", "name": "גלגלצ (Galgalatz)", "url": "https://glzwizzlv.bynetcdn.com/glglz_mp3" },
      { "id": "103fm", "name": "103FM (רדיו ללא הפסקה)", "url": "https://cdn.cybercdn.live/103FM/Live/icecast.audio" },
      { "id": "glz", "name": "גלי צה"ל (GLZ)", "url": "https://glzwizzlv.bynetcdn.com/glz_mp3" },
      { "id": "kan_88", "name": "כאן 88 (Kan 88)", "url": "https://kanliveicy.media.kan.org.il/icy/kan88_mp3" },
      { "id": "kan_gimmel", "name": "כאן גימל", "url": "https://kanliveicy.media.kan.org.il/icy/kangimmel_mp3" },
      { "id": "kan_kol_hamusica", "name": "קול המוסיקה", "url": "https://kanliveicy.media.kan.org.il/icy/kankolhamusica_mp3" },
      { "id": "eco99", "name": "Eco 99 FM", "url": "https://eco01.livecdn.biz/ecolive/99fm_aac/icecast.audio" },
      { "id": "radios100fm", "name": "רדיוס 100FM", "url": "https://radios100fm.livecdn.biz/radios100fm" },
      { "id": "chillhop", "name": "Chillout / Lofi Lounge", "url": "https://streams.ilovemusic.de/iloveradio17.mp3" },
      { "id": "dance", "name": "I Love Dance & Hits", "url": "https://streams.ilovemusic.de/iloveradio2.mp3" }
    ]
  },
  "security": {
    "adminPin": "1234",    // Master Admin PIN (all 6 tabs)
    "editorPin": "1111"     // Simplified Committee Member PIN (Notices + Radio only)
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
    "imageUrl": "images/notices/maintenance.jpg", // optional (null or url string)
    "createdAt": "2026-08-28T12:00:00.000Z",
    "expiresAt": null                         // ISO Date string or null
  }
]
```

### `data/wallpapers.json` Schema (Curated AI Assets Catalog):
```json
{
  "shabbat": [ ... ],
  "rosh-hashanah": [ ... ],
  "sukkot": [ ... ],
  "hanukkah": [ ... ],
  "pesach": [ ... ],
  "shavuot": [ ... ],
  "default": [ ... ],
  "notice_topics": [ ... ]
}
```

---

## 🔐 3. Authentication & Dual-PIN Access Rules

| Role | PIN | Access Permissions |
| :--- | :---: | :--- |
| **Master Admin** | `1234` | Full access to all 6 tabs (Notices, Display & Themes, Contacts, Radio, Settings & Security, Help & Touch Map). |
| **Committee Member** | `1111` | Simplified Senior-friendly interface: Access restricted to **Notices Board** and **Radio Controls** only. All display, opacity, hardware calibration, contacts, and security tabs are completely hidden. |

---

## 🌐 4. REST API Endpoint Directory

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/settings` | None | Returns public display settings & contact info |
| `POST` | `/api/settings` | `adminPin` or `editorPin` (Radio only) | Updates settings and saves changes |
| `GET` | `/api/notices` | None | Retrieves list of active notices |
| `POST` | `/api/notices` | `adminPin` / `editorPin` | Creates or edits a notice |
| `DELETE` | `/api/notices/:id` | `adminPin` / `editorPin` | Deletes a notice |
| `GET` | `/api/weather` | None | Live Open-Meteo weather & 4-day forecast |
| `GET` | `/api/shabbat` | None | Live Hebcal candle lighting & holiday theme |
| `GET` | `/api/news` | None | Real-time RSS news headlines |

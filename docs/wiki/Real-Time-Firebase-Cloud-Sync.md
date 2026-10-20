# ⚡ Real-Time Firebase Cloud Sync & Blackbox Telemetry (v2.6.0)

The platform features instant, two-way cloud synchronization and remote hardware telemetry powered by **Google Firebase Firestore**.

---

## 🔄 How Cloud Sync & Network Resilience Work

1. **Admin Cloud-First Edits:** When a committee member adds a notice, activates Emergency Mode, changes radio stations, or adjusts display settings on their smartphone, changes are saved directly to Cloud Firestore (automatically bypassing local `/api/...` routes when hosted on GitHub Pages via `isLocalServer()`).
2. **Real-Time Push (<100ms):** Active lobby screens listen via Firestore `onSnapshot()` WebSocket streams and apply updates dynamically without refreshing the page.
3. **Lazy Telemetry Listeners:** `device_health` and `device_logs` snapshots are subscribed lazily only when opened in the Admin Panel, preventing the lobby kiosk from wasting bandwidth listening to its own telemetry writes.
4. **Automatic Wi-Fi Reconnect & Cold-Boot Recovery:** If the building's internet is down when the kiosk boots or drops mid-day, `FirebaseSync` resets `initPromise` and dynamically loads missing SDK scripts as soon as `window.addEventListener('online')` fires, automatically re-syncing state, weather, news, and radio.
5. **Automated Base64 Storage Pruning (`Auto-Prune`):** To guarantee the `smart_lobby/notices` document stays well below Firestore's 1MB limit, `pruneExpiredNoticeImages()` automatically strips heavy Base64 `imageUrl` payloads from notices expired for over 24 hours while preserving their text history.

---

## 📦 Firestore Data Schema (`smart_lobby` Collection)

| Document Path | Description | Key Fields |
| :--- | :--- | :--- |
| `smart_lobby/settings` | Global building, display, slide, emergency & audio config | `building`, `display` (`liteMode`, `screenResolution`, `showTransitSlide`, `showInterestSlide`, `emergencyAlert`), `radio`, `contacts`, `security`, `system` |
| `smart_lobby/notices` | Array of committee notices (active, scheduled, recurring) | `items: [ { id, title, content, author, isUrgent, imageUrl, startsAt, expiresAt, recurringDays, hidden, imagePrunedAt } ]` |
| `smart_lobby/device_health` | Live heartbeat telemetry from physical lobby kiosk | `uptime`, `memory`, `screenResolution`, `liteMode`, `radioPlaying`, `lastSeen`, `userAgent` |
| `smart_lobby/device_logs` | Blackbox Flight Recorder crash & event diagnostics | `items: [ { id, timestamp, type, reason, message, uptimeSec, memoryMb, url } ]` (protected by 60s cooldown & 10-error session circuit breaker) |

---

## 🛠️ Step-by-Step Setup Guide (For New Buildings / Forks)

1. Create a free project at [Google Firebase Console](https://console.firebase.google.com).
2. Go to **Build ➡️ Firestore Database ➡️ Create database** (e.g. `me-west1` Tel Aviv or `eur3` Europe-West).
3. In the **Rules** tab, replace the default 30-day expiring test rule with [`firestore.rules`](../../firestore.rules) and click **Publish**:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /smart_lobby/{docId} {
         allow read, write: if true;
       }
     }
   }
   ```
4. Copy `js/config.example.js` to `js/config.js` and paste your Firebase Web app configuration.

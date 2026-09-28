# ⚡ Real-Time Firebase Cloud Sync

The platform features instant, two-way cloud synchronization powered by **Google Firebase Firestore**.

---

## 🔄 How Cloud Sync Works

1. **Admin Edits:** When a committee member adds a notice, changes radio stations, or adjusts display settings on their mobile phone, changes are instantly saved to Cloud Firestore.
2. **Real-Time Push (<100ms):** Active lobby screens listen via Firestore `onSnapshot()` WebSocket streams and apply updates dynamically without refreshing the page.
3. **Remote Force Reload:**
   * Clicking **'🔄 רענון מסך'** in Admin writes a timestamp to `smart_lobby/system.forceReloadAt`.
   * The physical lobby screen detects the signal and triggers an immediate `window.location.reload(true)` to clear cache and refresh assets remotely.
4. **Offline Resilience:** If the building internet drops, the system falls back to `localStorage` and `data/` JSON defaults seamlessly, continuing operation without interruption.

---

## 📦 Firestore Data Schema

All signage data lives inside a single collection named `smart_lobby`:

| Document Path | Description | Key Fields |
| :--- | :--- | :--- |
| `smart_lobby/settings` | Global building and screen configuration | `building`, `display`, `radio`, `contacts`, `security`, `system` |
| `smart_lobby/notices` | Array of all active committee notices | `items: [ { id, title, content, author, isUrgent, imageUrl, expiresAt, hidden } ]` |
| `smart_lobby/device_health` | Live telemetry from physical lobby tablet | `uptime`, `memory`, `lastSeen`, `battery` |

---

## 🛠️ Step-by-Step Setup Guide (For New Buildings / Forks)

When cloning or forking this project for your own building, follow these steps to configure Firebase Cloud Firestore:

### Step 1: Create a Firebase Project
1. Go to the [Google Firebase Console](https://console.firebase.google.com).
2. Click **Add project** (e.g. `smart-lobby-<building-name>`).
3. Google Analytics can be enabled (free) or disabled according to preference.

### Step 2: Provision Cloud Firestore
1. In the left navigation menu, go to **Build** ➡️ **Firestore Database**.
2. Click **Create database**.
3. Choose a geographic location closest to your building (e.g., `me-west1` Tel Aviv or `eur3` Europe-West).
4. When asked about secure rules, you can select Test mode initially.

### Step 3: CRITICAL - Configure Permanent Security Rules
> [!WARNING]
> **The 30-Day Expiration Pitfall:**
> If you start in Firebase "Test Mode", Google automatically sets an expiration date:
> `allow read, write: if request.time < timestamp.date(YYYY, M, D);` (30 days from creation).
> Once those 30 days elapse, all requests are denied and the lobby screen stops syncing!

To prevent your database from expiring, apply the permanent security rules:
1. In Firebase Console, go to **Firestore Database** ➡️ **Rules** tab.
2. Replace all content with the project's [`firestore.rules`](../../firestore.rules):
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Smart Lobby digital signage collections (settings, notices, device_health)
       match /smart_lobby/{docId} {
         allow read, write: if true;
       }
     }
   }
   ```
3. Click the blue **Publish** button.

Alternatively, if you use the Firebase CLI, deploy directly from the repository root:
```bash
firebase deploy --only firestore:rules
```

### Step 4: Connect the Web App
1. Go to **Project Settings** (gear icon) ➡️ **General** tab.
2. Under **Your apps**, click the Web icon (`</>`) to register a web app.
3. Copy your configuration credentials.
4. In your repository, copy `js/config.example.js` to `js/config.js` and paste your keys:
   ```javascript
   window.FIREBASE_CONFIG = {
     apiKey: "AIzaSy...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project",
     storageBucket: "your-project.firebasestorage.app",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
5. Commit and push `js/config.js` (or keep it in your deployment build).
6. Open your Admin panel (`admin.html`) — all settings will be automatically seeded to your new cloud Firestore!


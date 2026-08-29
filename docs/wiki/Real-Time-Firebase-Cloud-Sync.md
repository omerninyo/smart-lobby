# ⚡ Real-Time Firebase Cloud Sync

The platform features instant, two-way cloud synchronization powered by **Google Firebase Firestore**.

---

## 🔄 How Cloud Sync Works
1. **Admin Edits:** When a committee member adds a notice, changes volume, or adjusts display settings on their mobile phone, the changes are saved to Cloud Firestore.
2. **Real-Time Push (<100ms):** Active lobby screens listen via Firestore `onSnapshot()` WebSocket streams and apply updates dynamically without refreshing the page.
3. **Remote Force Reload:**
   * Clicking **'🔄 רענון מסך'** in Admin writes a timestamp to `smart_lobby/system`.
   * The physical lobby screen detects the signal and triggers an immediate `window.location.reload()` to clear cache and refresh assets remotely.

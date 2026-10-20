# 🔐 Admin Panel, Smart AI Composer & Emergency Mode (v2.6.0)

The admin dashboard (`admin.html`) is mobile-optimized and features role-based access control, smart notice authoring, scheduling, and instant emergency broadcasting.

---

## 👥 Access Roles & PIN Codes

| Role | Default Template PIN | Visible Tabs | Description |
| :--- | :---: | :---: | :--- |
| **👤 Committee Member** | `1111` | 📢 Tab 1 (Notices & Emergency), 📻 Tab 4 (Radio) | Simplified mode for non-technical committee members. Hides complex display calibration and security settings while allowing full notice management and emergency alerts. |
| **🔑 Master Admin** | `1234` | All 6 Tabs | Full control over display calibration, `Lite Mode`, resolution scaling, slide toggles, contacts, Blackbox Flight Recorder logs, and security PINs. |

---

## 🚨 Full-Screen Emergency Alert Mode & Auto Pikud HaOref
Located at the top of **Tab 1**, accessible to both Master Admin and Committee Editors:
* **1-Click Emergency Presets:** Instant activation buttons for:
  * `🚀 הנחיות פיקוד העורף (מרחב מוגן - 90 שניות)`
  * `🛗 השבתת מעלית דחופה / חילוץ`
  * `💧 הפסקת מים דחופה בבניין`
  * `⚡ תקלת חשמל בבניין`
* **Automatic Pikud HaOref Integration (`#emergency-auto-oref`):** When enabled (default `true`), the lobby screen silently polls Home Front Command alerts every 15 seconds. Upon detecting an active alert for the building's city, it immediately displays high-contrast crimson shelter instructions, mutes background radio (`stopRadioImmediate()`), and automatically restores routine operation 10 minutes after the alert ends.

---

## ✨ Smart Committee Notice Assistant (`#ai-polish-notice-btn`)
Inside the Notice creation/editing form (`#notice-form-container`):
* **One-Click Polish (`✨ שפר ונסח אוטומטית`):** Transforms brief keywords or rough notes (e.g., `"מחר הפסקת מים בין 9 ל-12"`) into a polite, formal Hebrew building notice across 11 supported topics (water, elevator, electricity, cleaning, pest control, parking, pruning, tenant meeting, committee dues, holiday greetings, renovation noise). Automatically selects a matching curated image if none was picked, flags urgent notices, and calculates recommended expiration dates for `"היום"` / `"מחר"`.
* **Optional Google Gemini 1.5 Flash API:** Works 100% offline with zero configuration via its built-in Hebrew heuristic composer, or connects to Gemini 1.5 Flash if an API key is stored in `localStorage.getItem('smart_lobby_gemini_key')`.
* **7 Quick Templates (`SMART_DRAFTS`):** Instant 1-click full drafts for the most common committee announcements.

---

## ⏳ Scheduled, Recurring & Auto-Pruned Notices
* **Scheduled Publication (`#notice-starts` / `startsAt`):** Schedule notices in advance to appear automatically at a future date and time.
* **Weekly Recurring Days (`recurringDays: [0..6]`):** Select specific days of the week (`א'–ש'`) so recurring reminders (e.g., pruning or hallway cleaning) appear only on relevant days.
* **Client-Side Image Compression & Auto-Prune:** Mobile camera uploads are compressed automatically via HTML5 Canvas (`720px`, quality `0.78`). Heavy Base64 images attached to notices that expired >24 hours ago are automatically pruned (`pruneExpiredNoticeImages`) on load and save, with storage savings badges displayed in Tab 1 and Tab 5.

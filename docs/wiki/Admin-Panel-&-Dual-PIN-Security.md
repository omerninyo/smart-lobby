# 🔐 Dual-Mode Admin Panel, Smart Composer, Cleaning Days & SHA-256 Security (v2.7.0)

The admin dashboard (`admin.html`) provides two tailored interfaces in one app — a **Simplified Single-Page Committee Mode** built for non-technical/elderly committee members on iPhone, and a **Full 6-Tab Master Admin** with a `3×2` mobile grid, `SHA-256` PIN security, and partial-merge cloud sync.

---

## 👥 Dual-Mode Roles & `SHA-256` PIN Security

| Role | Default Template PIN | Active Experience | Capabilities |
| :--- | :---: | :---: | :--- |
| **👤 Committee Member** | `1111` *(Salted `SHA-256` once customized)* | **Simplified Single-Screen Home (`simple-committee-mode`)** | Zero-scroll iPhone Home screen (`55%` shorter vertical height): Hero **`➕ Publish Notice`** button, **Home Quick Music Card & 4 instant-save volume buttons (`🔇 / 🔉 / 🔊 / 📢`)**, Active-only notice list, archived notices drawer (`📁 Old / Hidden`), and collapsible **`🧼 Cleaning Days`** & **`🚨 Emergency`** drawers. |
| **🔑 Master Admin** | `1234` *(Salted `SHA-256` once customized)* | **All 6 Tabs (`3×2` Mobile Grid) + `👤 Committee View` Switcher** | Full control over display calibration, `Lite Mode`, `1080p`/`720p` scaling, **14-channel modular news matrix**, contacts, **Device Health & Blackbox Flight Recorder**, and **`SHA-256` hashed PINs**, plus a 1-tap `👤 תצוגת ועד` toggle to preview the Committee view live. |

* **Salted `SHA-256` Hashing & Backdoor Closure (`v270–v271`):** Custom PINs are hashed via Web Crypto (`SHA-256` + pure-JS fallback) and stored as `security.adminPinHash` / `security.editorPinHash` (automatically deleting legacy plaintext fields via `FieldValue.delete()`). Template defaults (`1234` / `1111`) are strictly rejected once custom PINs exist.
* **Race-Safe Partial-Patch Cloud Merge (`v268`):** `saveSettingsToServer()` sends surgical field-level patches (`{ merge: true }`) rather than overwriting the full `settings` document, paired with `getFreshNoticesForMutation()` before notice mutations.

---

## 🧼 Permanent Cleaning Schedule & Previous-Evening Reminder (`#cleaning-schedule-panel`)
* Select weekly cleaning days in 1 tap (e.g., Sunday & Thursday `[0, 4]`).
* Automatically generates and updates `notice-cleaning-schedule`, computing the **previous-evening** clearing schedule (`במוצאי שבת וביום רביעי בערב`) reminding residents to clear rugs, strollers, bicycles, shoes, and bags from hallways and the lobby before early-morning washing, and highlights the notice on preparation evenings.

---

## 🚨 Collapsible Emergency Alert Mode & Auto Pikud HaOref
* Stays tucked inside a clean `<details>` drawer at the bottom during routine, and **automatically jumps to the top of the screen (`order: -10`) and opens** whenever an alert is active.
* **4 Instant Emergency Presets:** `🚀 הנחיות פיקוד העורף (90 שניות)`, `🛗 תקלה/חילוץ מעלית`, `💧 פיצוץ צנרת / הפסקת מים`, `⚡ הפסקת חשמל`.
* **Automated Pikud HaOref Polling (`startOrefAlertPoller`):** Polls `/api/oref` on local Node deployments every 15s (automatically bypassed on static GitHub Pages to prevent geo-blocked proxy socket exhaustion on `rk3368` kiosks), mutes live radio immediately upon alert, and restores routine 10 minutes after alert end.

---

## ✨ Smart Committee Notice Assistant & 1-Tap Duration Pills
* **1-Tap Duration Pills:** `ללא הגבלה` (Unlimited), `עד מחר בערב` (Tomorrow Eve), `3 ימים`, `שבוע`, `חודש`, plus collapsible `startsAt` & `recurringDays` scheduling.
* **One-Click Polish (`✨ שפר ניסוח אוטומטית`):** Offline zero-key Hebrew heuristic composer across 11 building topics + optional Gemini 1.5 Flash API + **7 Quick Drafts (`SMART_DRAFTS`)** + **14 lightweight `3:4` notice images** + HTML5 Canvas compression (`720px`) & 24h `Auto-Prune`.

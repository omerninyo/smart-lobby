# 📻 Radio & Background Audio Suite (v2.6.0)

An integrated Israeli radio streaming engine engineered for 24/7 residential lobby operation.

---

## 📻 Included Stations
* **103FM (רדיו ללא הפסקה)**
* **גלגלצ (Galgalatz)**
* **גלי צה"ל (GLZ)**
* **כאן 88 (Kan 88)**
* **כאן גימל (Kan Gimmel)**
* **קול המוסיקה (Kol HaMusica)**
* **Eco 99 FM**
* **רדיוס 100FM**
* **Chillout / Lofi Lounge (24/7)**
* **I Love Dance & Hits**

---

## 🛡️ 24/7 Stream Reliability & Smart Controls
* **Daily Auto-Scheduler:** Set active broadcast hours (e.g. `06:30` – `23:00`). Integer minute arithmetic guarantees sharp cutoff at the end of the schedule.
* **30-Second Stall Detection & Buffer Recycling (`CRITICAL-02`):** The 15-second watchdog (`checkRadioSchedule()`) monitors `audioPlayer.currentTime`. If an active stream freezes for 2 consecutive checks (30 seconds) due to Icecast/HLS buffering or brief Wi-Fi drops, `recycleAudioBuffer(true)` automatically resets and reconnects the stream, alongside periodic 30-minute buffer recycling to prevent WebView memory bloat.
* **Automatic Emergency & Yom Kippur Silence:** Immediately mutes audio (`stopRadioImmediate()`) during Yom Kippur or when an Admin/Pikud HaOref Emergency Alert is active, and automatically resumes schedule upon return to routine.
* **Secret Mute Gesture:** Long-press the clock on the touchscreen (1.2s) or double-tap the logo badge to instantly mute or unmute audio without opening Admin.

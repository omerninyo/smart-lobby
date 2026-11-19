# 📻 Radio & Background Audio Suite (v2.7.0)

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
* **Daily Auto-Scheduler & Overnight Gesture Preservation (`v267`):** Set active broadcast hours (e.g. `06:30` – `23:00`). Integer minute arithmetic guarantees sharp cutoff at the end of the schedule, while overnight maintenance preserves Chromium user-gesture activation (`navigator.userActivation`) + priming silent WebAudio unlock so morning broadcasts resume automatically without a touch prompt.
* **Verified CDN Streams & Runtime Auto-Upgrade (`v269`):** All 10 stations use verified live HTTPS endpoints (`playerservices.streamtheworld.com` for Kan 88 / Kan Gimmel / Kol HaMusica, `cdn.cybercdn.live` for 103FM & Radios 100FM, `glzwizzlv.bynetcdn.com` for GLZ & Galgalatz, `eco01.livecdn.biz` for Eco99, `streams.ilovemusic.de` for Chillout & Dance), automatically upgrading legacy cached URLs in `localStorage`/Firestore at runtime.
* **30-Second Stall Detection & Buffer Recycling (`CRITICAL-02`):** The 15-second watchdog (`checkRadioSchedule()`) monitors `audioPlayer.currentTime`. If an active stream freezes for 2 consecutive checks (30 seconds) due to Icecast/HLS buffering or brief Wi-Fi drops, `recycleAudioBuffer(true)` automatically resets and reconnects the stream, alongside periodic 30-minute buffer recycling to prevent WebView memory bloat.
* **Automatic Emergency & Yom Kippur Silence:** Immediately mutes audio (`stopRadioImmediate()`) during Yom Kippur or when an Admin/Pikud HaOref Emergency Alert is active, and automatically resumes schedule upon return to routine.
* **Secret Mute Gesture & Quick Admin Card (`v268`):** Long-press the clock on the touchscreen (1.2s) to mute/unmute locally, or use the top Quick Music Card (`🎵 שליטה מהירה במוזיקה בלובי`) on Tab 1 of the mobile Admin panel for 1-tap mute/resume and volume presets (`20%`, `40%`, `60%`).

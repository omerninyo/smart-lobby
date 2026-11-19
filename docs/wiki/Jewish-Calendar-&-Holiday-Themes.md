# 🕯️ Live Jewish Calendar, Weather/Marine & Smart Slides (v2.6.0)

The lobby display (`index.html`) combines an autonomous Jewish calendar engine with environmental telemetry, public transit schedules, daily infotainment, and an anti-clickbait news engine.

---

## 🕯️ Complete Year-Round Hebrew, Israeli & Civic Calendar
* **Live Hebrew Date Header (`#clock-date-greg`):** Displays the exact Hebrew date in traditional Hebrew letter numerics alongside the Gregorian date beneath the main clock (e.g., `יום רביעי, 21 באוקטובר • י' בחשוון תשפ"ז`).
* **10-Day Rolling Full Israel Calendar (`hebcal?v=1&i=on`):** Covers both weekday and weekend holidays, fast days, Rosh Chodesh, Sefirat HaOmer, Sigd, Hebrew Language Day, Family Day, Mimouna, accurate Memorial Day → Independence Day evening transitions, and upcoming 7-day calendar events inside the interactive modal.
* **Automatic Israel DST (`detectIsraelDstTransition`) & 30+ Special Days:** Detects `Asia/Jerusalem` summer/winter clock changes automatically alongside school-year milestones, solstices/equinoxes, and national/international special days.

---

## 🌤️ Environmental, Air Quality & Marine Forecast
In addition to the 4-day weather forecast, `fetchWeather()` queries Open-Meteo **Air Quality** and **Marine** APIs (no API key required) in parallel:
* **🌬️ Air Quality Index (`AQI`):** European AQI with color-coded Hebrew status (`אוויר נקי`, `איכות אוויר בינונית`, `אובך / זיהום אוויר גבוה`).
* **☀️ UV Radiation Index (`uvIndex`):** Real-time UV level and severity classification.
* **🌊 Coastal Marine Conditions:** Wave height (`seaWaveHeightCm`) and sea surface temperature (`seaTemp`).
* **💡 Smart Daily Resident Tip (`dailyTip`):** Contextual recommendation (e.g., rain/laundry warning, haze/window closure, extreme heat hydration, or pleasant outdoor weather).

---

## 🚆 "Leaving the Building" — Transit, Train & Commute Slide (`transit_commute`)
Controlled via `#setting-show-transit-slide` in Tab 2 of Admin:
* **🚆 Israel Railways Departures:** Calculates upcoming train departures South (Tel Aviv) and North (Haifa) adjusted dynamically for weekdays, Fridays, Shabbat pause, and Motzaei Shabbat.
* **🚌 Local & Intercity Bus Lines:** Displays key neighborhood bus routes (e.g., lines 7, 15, 22, 704) with active service indicators.
* **🚗 Highway Commute Estimations:** Dynamic peak-hour drive times and congestion color badges (Green / Orange / Red) for Road 2 (Tel Aviv / Haifa), Netanya/Sharon, and Caesarea Industrial Park / Road 4.

---

## 🧠 "Elevator Moment of Interest" Slide (`daily_interest`)
Controlled via `#setting-show-interest-slide` in Tab 2 of Admin:
* Blends **50+ curated Hebrew science, space & local nature sets** with **live daily Hebrew Wikipedia "On This Day" (`תבנית:היום בהיסטוריה`)** events (cached once per 24h in `localStorage` with family-friendly filtering), **14 dedicated Holiday & Shabbat pools**, and a dignified **Memorial Day heritage mode**.

---

## 📰 Smart Mix RSS News & Anti-Clickbait Engine (`smart_mix`)
Configured via `#setting-rss-source` in Tab 2 of Admin:
* **Composite & Thematic Channels:** `smart_mix` (interleaved News, Science, Economy & Tech), `science_tech` (`הידען` / `גיקטיים`), `economy` (`גלובס` / `כלכליסט`), `kan_globes`, plus `ynet`, `kan`, `mako`, and `walla`.
* **Anti-Clickbait Filter (`filterClickbaitAndFormatHeadline`):** Removes clickbait phrases (`לא תאמינו`, `צפו:`, `הלם`, `בשיתוף`, `תוכן שיווקי`) and prefixes clean category tags (`[מדע]`, `[כלכלה]`, `[טכנולוגיה]`, `[חדשות]`).
* **High-Availability Fetching:** Polls every 10 minutes via `rss2json` with automatic fallback to `AllOrigins` XML `DOMParser`.

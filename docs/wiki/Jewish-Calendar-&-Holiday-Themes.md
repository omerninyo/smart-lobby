# 🕯️ Live Jewish Calendar, Weather/Marine & Smart Slides (v2.6.0)

The lobby display (`index.html`) combines an autonomous Jewish calendar engine with environmental telemetry, public transit schedules, daily infotainment, and an anti-clickbait news engine.

---

## 🕯️ Live Hebrew Calendar & Holiday Themes
* **Live Hebrew Date Header (`#clock-date-greg`):** Displays the exact Hebrew date in traditional Hebrew letter numerics alongside the Gregorian date beneath the main clock (e.g., `יום רביעי, 21 באוקטובר • י' בחשוון תשפ"ז`).
* **Contextual Tradition Badges:** Automatically displays header and modal badges for **🕯️ Hanukkah Candles (נרות חנוכה)**, **🌾 Sefirat HaOmer (ספירת העומר)**, and **🌙 Rosh Chodesh (ראש חודש)**, while prioritizing major holidays over minor calendar entries.
* **GPS Shabbat & Automated Holiday Themes:** Calculates exact candle lighting, Havdalah, and Parashat HaShavua via Hebcal GPS API, and switches backgrounds across 15 Jewish holidays and national Israeli dates.

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
* Rotates 20 curated Hebrew infotainment sets daily (`dayOfYear % 20`), presenting 3 cards:
  1. **📅 היום בהיסטוריה / הידעת?:** Science, history, space, and nature facts.
  2. **🧠 חידת הטריוויה היומית לדיירים:** Engaging question with a highlighted answer box at the bottom.
  3. **💡 טיפ היום לבית ולקהילה:** Practical energy-saving, maintenance, and good-neighbor tips.

---

## 📰 Smart Mix RSS News & Anti-Clickbait Engine (`smart_mix`)
Configured via `#setting-rss-source` in Tab 2 of Admin:
* **Composite & Thematic Channels:** `smart_mix` (interleaved News, Science, Economy & Tech), `science_tech` (`הידען` / `גיקטיים`), `economy` (`גלובס` / `כלכליסט`), `kan_globes`, plus `ynet`, `kan`, `mako`, and `walla`.
* **Anti-Clickbait Filter (`filterClickbaitAndFormatHeadline`):** Removes clickbait phrases (`לא תאמינו`, `צפו:`, `הלם`, `בשיתוף`, `תוכן שיווקי`) and prefixes clean category tags (`[מדע]`, `[כלכלה]`, `[טכנולוגיה]`, `[חדשות]`).
* **High-Availability Fetching:** Polls every 10 minutes via `rss2json` with automatic fallback to `AllOrigins` XML `DOMParser`.

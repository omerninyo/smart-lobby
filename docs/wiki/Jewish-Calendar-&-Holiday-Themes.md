# 🕯️ Year-Round Israel Calendar, Live Wikipedia, 1080p Panels & Modular News (v2.6.0)

The lobby display (`index.html`) combines a full year-round Israeli & Hebrew calendar engine with live Hebrew Wikipedia history, `1920×1080` full-stage scaled environmental/transit/trivia panels, and a 14-channel modular news ticker.

---

## 🕯️ Complete Year-Round Hebrew, Israeli & Civic Calendar (`v269`)
* **Live Hebrew Date Header (`#clock-date-greg`):** Displays the exact Hebrew date in traditional Hebrew letter numerics alongside the Gregorian date beneath the main clock.
* **10-Day Rolling Full Israel Calendar (`hebcal?v=1&i=on`):** Covers both weekday and weekend Jewish holidays, fast days, Rosh Chodesh, Sefirat HaOmer (with exact Lag BaOmer disambiguation), Sigd, Hebrew Language Day, Family Day, Mimouna, accurate evening transitions (`Erev Yom HaZikaron` → `Yom HaAtzmaut`), and a 7-day upcoming events view inside the interactive touch modal.
* **Automatic Israel DST (`detectIsraelDstTransition`) & 30+ Special Days:** Automatically detects `Asia/Jerusalem` summer/winter clock transitions alongside school-year milestones, solstices/equinoxes, and national/international special days.

---

## 🌤️ Full-Stage `1920×1080` Weather, Air Quality & Marine Station (`weather_forecast`)
* **Full 28 WMO Weather Codes + Open-Meteo Forecast, Air Quality & Marine APIs** (no API key required, cached in `localStorage` for offline resilience).
* **Spacious `2×2` Environmental Grid:** European `AQI` (`אוויר נקי` / `בינונית` / `אובך`), `UV` radiation index, coastal wave height & water temperature, and a **Dynamic Weather- & Day-Aware Resident Tip (`dailyTip`)** (storm warnings, rain probability, hot-asphalt pet warning in summer, weekend beach conditions).

---

## 🚆 Full-Stage `1920×1080` Transit & Commute Slide (`transit_commute`)
* **Israel Railways Departures:** Upcoming departures South (Tel Aviv) and North (Haifa) dynamically aware of **Weekdays, Fridays, Shabbat, Erev Chag, and Yom Tov**.
* **Local & Intercity Bus Lines:** Enlarged non-truncated route cards (`7`, `15`, `22`, `704`).
* **Highway Commute Estimations:** Peak-hour drive times and congestion badges (Green / Orange / Red) for Road 2, Sharon, and Caesarea / Road 4.

---

## 🧠 Full-Stage `1920×1080` "Elevator Moment of Interest" + Live Wikipedia (`daily_interest`)
* Blends **50+ curated Hebrew science, space & local nature sets** with **live daily Hebrew Wikipedia "On This Day" (`תבנית:היום בהיסטוריה`)** events (cached once per 24h in `localStorage` with family-friendly filtering), **14 dedicated Holiday & Shabbat pools**, and a dignified **Memorial Day heritage mode**, rendered in distance-readable `1080p` typography (`~31px–35px`).

---

## 📰 14-Channel Modular News Builder & Anti-Clickbait Engine (`#modular-news-matrix`)
* **Quick Presets or Individual Channel Checkboxes:** Mix and match across **14 live channels**:
  * **News:** `Ynet`, `Ynet מבזקים`, `N12 / Mako` (direct CORS XML fast-path), `Walla`, `Maariv`
  * **Economy:** `Globes`, `Ynet כלכלה`
  * **Science & Tech:** `Hayadan`, `Geektime` (direct WP-JSON), `Ynet דיגיטל`
  * **Local Building & Community:** `מודעות הוועד`, `מזג אוויר מקומי`, `זמני שבת ולוח עברי`, `הידעת? / טריוויה`
* **Anti-Clickbait Filter (`filterClickbait`) & Source Tags:** Strips clickbait/sponsored headlines, displays color-coded `.ticker-source-tag` badges, and caps ticker batch width below `8192px` in `Lite Mode` for `rk3368` GPU safety.

# Changelog

All notable changes to the Smart Lobby open-source template will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.6.0] - 2026-10-21
### Added
- **Environmental & Marine Data for Hadera (Air Quality & Marine API):** Integrated Open-Meteo Air Quality and Marine APIs (no API key required) in both `server.js` and `screen.js`. Enriched weather model with European Air Quality Index (`aqi` + color-coded status), UV radiation index (`uvIndex` + severity level), sea wave height and water temperature for Hadera coast (Olga beach), and smart automated daily tips for tenants (`dailyTip`). Rendered as a compact 4-card environmental grid on the weather forecast slide and in the interactive weather modal.
- **Transit & Commute Slide (`transit_commute`):** Added dynamic public transit and traffic dashboard for residents leaving the building. Features real-time timetable estimations for Israel Railways Hadera West station (South/Tel Aviv and North/Haifa with Shabbat awareness), key municipal and intercity bus routes (lines 7, 15, 22, 704), and live highway commute drive times (Road 2 coastal highway, Road 4, Sharon, and Caesarea Industrial Park) with dynamic peak-hour congestion color badges. Controlled via admin toggle `#setting-show-transit-slide`.
- **Live Hebrew Calendar Header & Badges:** Integrated accurate Hebrew date rendering under the digital clock (`#clock-date-greg`) using `Intl.DateTimeFormat` with traditional Hebrew letter numerics (e.g. `יום רביעי, 21 באוקטובר • י' בחשוון תשפ"ז`). Added special contextual calendar badges in the header center and Shabbat modal for Sefirat HaOmer, Hanukkah candles, and Rosh Chodesh.
- **Daily Interest & Trivia Slide (`daily_interest`):** Implemented a 20-set rich infotainment rotation cycling daily based on day of year (`dayOfYear % 20`). Each slide features: "This Day in History / Did You Know?" (science, history, nature, space), an engaging tenant trivia puzzle with highlighted answer box, and a practical home/community maintenance tip. Controlled via admin toggle `#setting-show-interest-slide`.
- **Automatic Pikud HaOref Emergency Alerts:** Added automated silent background poller (`startOrefAlertPoller`, checking every 15 seconds) verifying active Home Front Command alerts for Hadera via `/api/oref` (with allorigins CORS proxy fallback on static hosting). Automatically triggers high-contrast emergency shelter instructions, immediately mutes background radio stream (`stopRadioImmediate()`), and automatically schedules a 10-minute return to routine operation following the end of an alert. Configurable in admin emergency panel via `#emergency-auto-oref`.
- **Smart Mix RSS News & Anti-Clickbait Engine:** Added curated anti-clickbait headline filter (`filterClickbaitAndFormatHeadline`) filtering sensationalism, sponsored content, and noisy broadcast prefixes while prefixing clean category tags (`[מדע]`, `[כלכלה]`, `[טכנולוגיה]`, `[חדשות]`). Added support for new active feeds (`globes`, `calcalist`, `hayadan`, `geektime`) and composite feeds (`smart_mix`, `science_tech`, `economy`, `kan_globes`) with interleaved round-robin scheduling and robust fallback.

### Changed
- **Cachebuster Bump:** Updated cachebuster across `index.html` and `admin.html` to `v=20261021_widgets_v260`.
- **1:1 Binary Synchronization:** Completely synchronized all frontend assets, configuration, and scripts between root and `public/` directory.

## [2.5.0] - 2026-10-18
### Added
- **Scheduled Starts & Recurring Days for Notices (Innovation #2):** Added `#notice-starts` alongside `#notice-expires`, and weekly recurring day selectors (`recurringDays: [0..6]`) in the Admin notice form `#notice-form-container`. Updated `isNoticeActive(notice, now)` across `screen.js`, `admin.js`, and `server.js` to strictly enforce `startsAt`, `expiresAt`, `recurringDays`, and `hidden` with strict numerical type casting (`map(Number)`). Enhanced `screen.js` 60-second periodic checker to track active notice IDs and day-of-week transitions starting immediately from initial load, ensuring scheduled notices publish and expire in real-time without requiring manual kiosk reloads. Added real-time scheduling badges (`⏳ מתוזמן`, `🔄 כל יום`, `⛔ פג תוקף`) in the Admin notice list and exported standalone `renderNoticesList(notices)`. Added `smart_lobby_notices` cross-tab synchronization to `storage` listener in `screen.js`.
- **Full-Screen Emergency Alert Mode (Innovation #4):** Implemented an instant emergency broadcast system accessible to both Master Admin and Committee Editors. Pinned at the top of Tab 1 in `admin.html` with 1-click presets (`oref` - Pikud HaOref shelter guidelines, `elevator` - urgent elevator outage, `utility` - immediate water/power shutdown). On activation, renders a high-contrast pulsating crimson card on the central stage, overrides normal slide rotation, silences live radio audio immediately, triggers instant slide rebuild upon status toggle in `applySettings()`, and automatically restores routine broadcast and audio when deactivated.
- **Smart Committee Notice Assistant (Innovation #5):** Added a smart drafting toolbar to the notice form featuring 7 1-click presets for common committee scenarios (water outage, elevator maintenance, parking cleaning, pest control, tenant meeting, pruning/garden disposal, dues collection) with verified repository images (`images/notices/maintenance.jpg`, `clean_hallway_care.jpg`, etc.), recommended expiration intervals, and automated urgency flags. Added "✨ שפר ונסח אוטומטית" (`#ai-polish-notice-btn`) powered by an offline, zero-key Hebrew heuristic composer recognizing all 11 catalog topics (water, elevator, electricity, cleaning, pest, parking, pruning, meeting, dues, holiday greetings, renovation noise), automatically attaching verified topic images if none selected, marking urgent for faults/outages, and intelligently calculating expiration dates for "היום" and "מחר", plus optional Google Gemini 1.5 Flash API key integration.
- **Auto-Pruning Base64 Images & Storage Savings Badges:** Implemented automated background pruning of heavy Base64 image payloads from expired notices running both on notice save AND on admin load (`loadNotices`), updating Firestore quietly and displaying real-time storage savings badges in Tab 1 (`#prune-savings-badge`) and Tab 5 (`#prune-savings-badge-tab5`).
- **Production PIN Support & Editor Scoped Server Authorization:** Maintained 100% backward and forward compatibility for Master Admin PIN `9681` (and `1234`) and Committee Editor PIN `9090` (and `1111`) across client auth, Firestore security rules, and Node.js server endpoints. Fixed `/api/settings` permission checking in `server.js` and payload filtering in `admin.js` to ensure Committee Editors can freely update radio and emergency alert settings without encountering 403 Forbidden errors.

### Changed
- **Cachebuster Bump:** Updated script and stylesheet cachebusters across `index.html` and `admin.html` to `v=20261018_innovations_v250`.
- **1:1 Binary Synchronization:** Completely synchronized all frontend and script files between root and `public/` directory.

## [2.4.6] - 2026-10-18
### Fixed
- **Wi-Fi Reconnect & Firebase Re-Initialization (`CRITICAL-01`):** Reset `this.initPromise = null` on initialization failure or missing SDK in `FirebaseSyncManager` (`js/firebase-sync.js`), allowing automatic recovery when network returns. Added native `window.addEventListener('online')` handler in `js/screen.js` to re-establish cloud sync, refresh weather/news/holidays, and assert radio schedule. Added dynamic script loader for cold boot offline recovery. Added `startRealtimeListeners()` alias and idempotent callback registration.
- **Lazy Cloud Telemetry Subscriptions (`MEDIUM-02`):** Converted `device_health` and `device_logs` Firestore `onSnapshot` listeners to lazy subscriptions initialized only when listeners are explicitly registered in Admin (`onDeviceHealthChanged` / `onDeviceLogsChanged`), preventing lobby display kiosks from listening to their own telemetry writes.
- **Live Radio Stall & Buffer Freezing Protection (`CRITICAL-02`):** Added `error` recovery listener with 3-second retry delay on `#radio-audio` and 30-second `currentTime` freeze detection in `checkRadioSchedule()` (`js/screen.js`) that forcefully recycles the stream buffer via `recycleAudioBuffer(true)` when stalled. Added `isRecyclingAudio` recursion guard and debounced retry timer to eliminate the infinite 3-second stream interrupt loop on browser `removeAttribute('src')`. Ensured `isSecretMuted` and radio schedule automatically resume when exiting Yom Kippur mode.
- **Admin Cloud-First Sync & GitHub Pages Optimization (`CRITICAL-03` + `HIGH-04`):** Added `isLocalServer()` helper in `js/admin.js` to bypass local `/api/...` calls on static hosting (GitHub Pages), eliminating 404 network errors. Added return-value verification for `saveNotices`, `saveSettings`, and `triggerRemoteReload` with user-facing network status notifications. Added native support for existing production PINs `9681` (Master Admin) and `9090` (Editor).
- **Firestore Document Quota Protection (Auto-Pruning Base64 Images):** Implemented `pruneExpiredNoticeImages()` in `js/admin.js` and `js/firebase-sync.js` to automatically clear heavy Base64 image strings (`imageUrl: null`) from notices expired for over 24 hours while preserving text metadata, guaranteeing document size remains well below Firestore's 1MB limit.
- **Slideshow Assertive Activation & Dynamic Updates (`CRITICAL-04`):** Added automatic `startSlideshow()` invocation at the conclusion of `buildSlides()` when multiple slides exist, timer cleanup for 1-slide decks, and ensured dynamic slide interval updates when changing `slideDurationSeconds` or exiting Yom Kippur mode in `applySettings()`.
- **Interactive Modal Auto-Close Watchdog (`HIGH-01`):** Added 45-second inactivity auto-close timer (`modalAutoCloseTimer`) in `openModal()` (`js/screen.js`), preventing abandoned touch popups from indefinitely obstructing the kiosk display or scheduled night watchdog reloads. Restored instant slideshow resumption upon manual modal closing.
- **Zombie Notice Resurrection Prevention (`HIGH-03`):** Prioritized `smart_lobby_notices` from `localStorage` in `fetchNotices()` (`js/screen.js`) and `loadNotices()` (`js/admin.js`) to prevent default `data/notices.json` entries from resurrecting when an admin deliberately clears all notices. Persisted deleted notice IDs into `smart_lobby_deleted_notices` and filtered them across both screen and admin interfaces.
- **Flight Recorder Error Rate Limiting & Circuit Breaker (`HIGH-02`):** Added 60-second cooldown rate limiting and 10-error session circuit breaker to uncaught exception and unhandled rejection listeners in `setupFlightRecorder()` (`js/screen.js`), protecting Firestore write quotas from runaway loops.
- **XSS Sanitization & RSS Quota Resilience (`HIGH-05` + `MEDIUM-01..05`):** Wrapped news titles in `escapeHtml()` within `openNewsModal()` and `renderNewsTicker()`. Extended news refresh interval from 5 to 10 minutes (saving 50% `rss2json` quota) and added `allorigins` + `DOMParser` fallback for RSS parsing with empty result validation. Removed redundant duplicate `change` event listener on Lite Mode in `populateSettingsUI()` and eliminated the 2.5s `localStorage` poll loop in `setupForceReloadListener()`. Improved Jewish holiday detection in `fetchShabbatAndHolidays()` by searching across all Hebcal items rather than just `holidays[0]`.

### Changed
- **Deployment Workflow Static Site Mirroring:** Updated `.github/workflows/deploy.yml` to copy `public/*` first and overlay root files (`index.html`, `admin.html`, `css/`, `js/`, `data/`) into `_site/`, ensuring 1:1 binary synchronization between root and `public/`.
- **Cachebuster Bump:** Updated script and stylesheet cachebusters across `index.html` and `admin.html` to `v=20261018_stability_v246`.

## [2.4.5] - 2026-10-13
### Fixed
- **Shabbat & Holiday Header Rendering Crash:** Fixed `TypeError: this.applyDisplaySettings is not a function` in `fetchShabbatAndHolidays()` (`js/screen.js`) by invoking `this.applySettings()`, restoring live Shabbat candle-lighting, Havdalah, and Parasha display in the top header.
- **Client-Side Image Compression for Mobile Uploads:** Added automatic HTML5 Canvas image compression (`compressImageToDataUrl`, max width 720px, WebP/JPEG quality 0.78) in `js/admin.js` to prevent raw multi-megabyte smartphone photos from exceeding Firestore's 1MB document limit on static GitHub Pages deployments.
- **Unified Radio Mute State & Listener Deduplication:** Removed conflicting duplicate `click` listener on `#radio-indicator` in `setupAudio()` and unified `toggleSecretMute()` to properly update `isSecretMuted`, preventing the 15-second radio watchdog from unmuting manually muted audio.
- **Night Watchdog Modal Detection:** Fixed modal element ID lookup in `setupWatchdog()` (`#interactive-modal` instead of `#content-modal`).
- **Tab 5 Settings Overwrite Prevention:** Removed redundant `display.newsSource` write from `setupGeneralSettings()` in `js/admin.js`.
- **Midnight Schedule Parsing & Dynamic Hebrew Year:** Removed `00:xx` minute-to-hour swap in `isRadioInSchedule()` and replaced hardcoded Hebrew year strings with dynamic `Intl.DateTimeFormat('he-IL-u-ca-hebrew')` calculation.
- **HTML Sanitization:** Added `escapeHtml()` wrapping for `customTickerText` and contact directory modal fields in `js/screen.js`.

### Changed
- **Android WebView GPU & Memory Optimizations:** Fixed `.header-bar` and `.footer-bar` selectors in `body.lite-mode` (`css/style.css`), disabled full-screen Ken-Burns `transform: scale(1.06)` and non-composited `box-shadow` pulse animations in Lite Mode, hid `#left-burn-compensator` (`mix-blend-mode: screen`) when `leftBurnCompensation` is `0%`, added `decoding="async"` to slide images, and cached DOM references in `startClock()`.

## [2.4.4] - 2026-09-28
### Added
- **Screen Resolution & Font Scaling Selector:** Added dedicated "רזולוציית מסך והתאמת גופנים" control card in Tab 2 (Display) of `admin.html`, enabling real-time switching between Responsive Auto (`auto`), Full HD 1080p (`1080p`), and HD Ready 720p / Tablet (`720p`).
- **Live Screen Resolution Metric in Device Health:** Added `#health-resolution` indicator to the device health telemetry grid in Tab 5 (Settings). Instrumented `startHeartbeat()` in `screen.js` to continuously transmit active screen viewport dimensions to Firestore `smart_lobby/device_health`.

## [2.4.3] - 2026-09-28
### Added
- **Blackbox Flight Recorder & Crash Diagnostics:** Implemented cloud-synced flight recorder (`smart_lobby/device_logs` in Firestore) with persistent state tracking in `localStorage` across reloads. Distinguishes clean watchdog reloads, admin remote reloads, manual reloads, and sudden unclean kiosk crashes (`unclean_crash_restart`).
- **Global Error & Promise Rejection Trapping:** Added global `window.onerror` and `window.onunhandledrejection` crash traps in `screen.js` to immediately stream client-side exceptions and stack traces to cloud telemetry.
- **Admin Crash & Event Log Viewer:** Added live-updating "יומן אירועים וקריסות (Blackbox Flight Recorder)" UI in Tab 5 (Settings) of `admin.html` with color-coded status badges, timestamps, heap usage metrics, manual refresh, and log clearing.
- **Exit Reason Marking:** Instrumented `setupWatchdog()`, `setupForceReloadListener()`, and user navigation to mark exit intent before reloading to prevent false-positive crash flags.

## [2.4.2] - 2026-09-28
### Fixed
- **Duplicate ID Elimination:** Removed redundant secondary Lite Mode card in Tab 2 (`admin.html` and `public/admin.html`), guaranteeing unique `#setting-lite-mode` ID across the DOM.
- **Notice Gallery Title Fallback:** Fixed `setupGalleryPicker` in `admin.js` to map `item.name || item.title || 'הודעת ועד'`, eliminating `undefined` image labels in the notice media picker modal. Expanded holiday suite mapping to include all 15 Jewish holidays and seasonal themes.
- **Role Permission Boundary (Editor Mode):** Fixed header Lite Mode quick toggle button (`#header-litemode-btn`) leak in Editor mode caused by class reset in `updateLiteModeUI()`. Ensured button stays strictly hidden for the committee member editor role.

### Changed
- **Logical Admin Grouping:** Re-located RSS News Source dropdown (`#setting-rss-source`) to Tab 2 (Display & Ticker Controls) alongside the ticker toggle and custom ticker message. Focused Tab 5 exclusively on Building Details and PIN Security.

## [2.4.1] - 2026-09-16
### Fixed
- **Notice Expiration Filtering:** Added strict expiration verification (`isNoticeActive`) in `screen.js` and `admin.js`. Notices whose `expiresAt` timestamp has passed are automatically excluded from the side feed and main stage slides, and clearly flagged as expired in Admin.
- **Radio Schedule Precision:** Transitioned `isRadioInSchedule` to integer minute arithmetic (`< endMinutes`), guaranteeing sharp immediate audio shutdown at 23:00:00.
- **Continuous Radio Watchdog:** Added 15-second high-frequency schedule check and forceful 06:30 morning stream activation.
- **Dynamic News Ticker:** Dynamic client-side RSS fetching honoring `newsSource` settings across Ynet, Walla, N12 (Mako), and Kan with seamless automatic fallback for Cloudflare WAF challenges.
- **Admin News Source Selection:** Added N12 (Mako) to Admin panel news dropdown options.

### Changed
- **Kiosk Memory Watchdog:** Added scheduled clean page reload at 23:05 (5 minutes after radio shutoff) to eliminate 24h Webview audio buffer accumulation without triggering autoplay prompts.

## [2.4.0] - 2026-09-16
### Added
- Master Design Specification (`docs/design_spec.md`) detailing Admin SaaS vs. Lobby Display standards.
- Operating Rules & Public Template Hygiene governance.
- Cloud device health telemetry monitoring in Admin settings.

### Changed
- Watchdog hard reload moved exclusively to 04:00 AM deep night to prevent browser Autoplay audio blocks during daytime.
- Daytime memory management transitioned to in-memory soft sweeps.

## [2.3.0] - 2026-09-04
### Added
- Lite Mode toggle for low-spec hardware and crash prevention on legacy Android kiosks.
- Quick Lite Mode toggle button in Admin header.

## [2.2.0] - 2026-08-31
### Added
- Curated AI photorealistic holiday suite for 15 Hebrew calendar occasions.
- Webview Kiosk (FOSS) official documentation and recommendations.

## [2.1.0] - 2026-08-29
### Added
- Real-time Firebase Cloud Firestore synchronization.
- Role-based PIN security (Master Admin vs. Committee Editor).

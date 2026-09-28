# Changelog

All notable changes to the Smart Lobby open-source template will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

# Changelog

All notable changes to the Smart Lobby open-source template will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

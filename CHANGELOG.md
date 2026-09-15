# Changelog

All notable changes to the Smart Lobby open-source template will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

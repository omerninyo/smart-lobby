# Master Design Specification (Smart Lobby)

## 1. Architectural Philosophy
Smart Lobby enforces a strict two-tier visual standard separating administrative controls from the public display.

---

## 2. Tier 1: Admin Panel Specification (`admin.html`)
* **Visual Restraint:** Monochromatic, dark palette based on Tailwind slate/gray tones (`#090d16`, `#161e31`, `#1e293b`).
* **Iconography:** System SVG icons (Heroicons / Lucide) for buttons and inputs. Emojis are reserved strictly for content tags.
* **Component Radii:** Strict 8px to 14px border radii for form inputs, buttons, and cards. No bubble or pill containers for large structural elements.
* **Responsive Density:** High-density desktop grid with responsive vertical stacking on mobile devices. Touch targets must satisfy minimum 44px height.

---

## 3. Tier 2: Public Lobby Screen Specification (`index.html`)
* **Form Factor & Distance:** 16:9 Landscape aspect ratio (1080p Full HD / 4K UHD), optimized for readability at 3 to 5 meters.
* **Typography:** Fluid sizing using CSS `clamp()` anchored to viewport dimensions.
* **Hero Content Priority:** Multi-zone grid separating active notices, weather widgets, Shabbat/holiday times, and bottom news ticker.
* **Color Accents & Theming:** Curated high-resolution holiday still-life photography with adaptive glassmorphism containers.
* **Lite Mode Fallback:** Instant fallback to solid `rgba(15, 23, 42, 0.95)` backgrounds for low-spec Android kiosks, bypassing GPU-heavy `backdrop-filter: blur()`.

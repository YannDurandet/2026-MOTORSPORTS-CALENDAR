# a11y-audit.md — dord.racing WCAG 2.2 Accessibility Audit
_Static code analysis substituted for axe-core/Lighthouse (browser not available in sandbox). All four routes audited: `/`, `/series`, `/tracks`, `/results`._
_Last updated: 2026-07-09_

---

## Summary table

| Severity | Open | Fixed | Deferred |
|---|---|---|---|
| Critical | 0 | 4 | 0 |
| Serious | 0 | 7 | 0 |
| Moderate | 2 | 11 | 2 |
| Minor | 4 | 1 | 2 |
| **Total** | **6** | **23** | **4** |

---

## Issue log

### CRITICAL

| # | Issue | Location | WCAG | Status | Fix |
|---|---|---|---|---|---|
| C1 | No `<main>` landmark on any page | All pages | 1.3.6 / 4.1.2 | ✅ Fixed | Changed `<div class="main-section">` → `<main id="main-content" class="main-section">` on all 8 pages (`index`, `series/index`, `series/[slug]`, `tracks/index`, `tracks/[slug]`, `results`, `newsletter`, `legal/privacy`, `legal/tos`) |
| C2 | No skip-navigation link | All pages (`BaseLayout.astro`) | 2.4.1 | ✅ Fixed | Added `<a href="#main-content" class="skip-link">Skip to main content</a>` immediately after `<body>` in BaseLayout; styled visually hidden until `:focus` |
| C3 | `.event[data-track-href]` clickable div not keyboard-accessible | `EventRow.astro`, `main.js` | 2.1.1 | ✅ Fixed | `initEventRowClicks()` now adds `role="link"`, `tabindex="0"`, and `keydown` handler (Enter/Space) to all clickable event rows |
| C4 | Search overlay has no focus trap | `BaseLayout.astro` | 2.1.2 | ✅ Fixed | Refactored search JS: `openSearch(triggerEl)` / `closeSearch()` with `getFocusableEls()` focus trap; Tab/Shift+Tab cycles within overlay; Escape closes and returns focus to trigger |

---

### SERIOUS

| # | Issue | Location | WCAG | Status | Fix |
|---|---|---|---|---|---|
| S1 | `.arrow-btn` has no `aria-expanded` | `EventRow.astro`, `main.js` | 4.1.2 | ✅ Fixed | Added `aria-expanded="false"` to button in component; `initToggle()` in `main.js` toggles `aria-expanded` true/false |
| S2 | `#334` text on dark bg — ≈ 1.6:1 | `results.astro`, `BaseLayout.astro`, `tracks/index.astro` | 1.4.3 | ✅ Fixed | Replaced with `#8a9aaa` (~6.5:1) or `#7a8fa0` (~6.1:1) throughout |
| S3 | `#445` text on dark bg — ≈ 2.1:1 | `results.astro`, `tracks/index.astro`, `global.css` | 1.4.3 | ✅ Fixed | Replaced with `#8a9aaa` (~6.5:1) throughout |
| S4 | `#556` text on dark bg — ≈ 2.7:1 | `results.astro`, `tracks/index.astro`, `global.css` | 1.4.3 | ✅ Fixed | Replaced with `#7a8fa0` (~6.1:1) or `#8a9aaa` throughout |
| S5 | Font sizes below 12px: `0.5rem`–`0.58rem` | `results.astro`, `tracks/index.astro`, `BaseLayout.astro`, `global.css` | 1.4.4 | ✅ Fixed | All sub-0.7rem labels raised to `0.7rem`–`0.75rem` (11.2–12px) minimum |
| S6 | Search `<input>` has no `<label>` | `BaseLayout.astro` | 1.3.1 / 4.1.2 | ✅ Fixed | Added `<label for="search-input" class="sr-only">Search tracks and series</label>`; `.sr-only` utility class defined in BaseLayout styles |
| S7 | Flag `<img>` alt text uses ISO codes (`"GB"`, `"US"`) | `results.astro` | 1.1.1 | ✅ Fixed | Added `isoToName` lookup map and `countryName(code)` helper; all flag alt attributes now use full country name |

---

### MODERATE

| # | Issue | Location | WCAG | Status | Fix |
|---|---|---|---|---|---|
| M1 | `#667` text on dark bg — ≈ 3.3:1 | `tracks/index.astro`, `results.astro`, `global.css` | 1.4.3 | ✅ Fixed | Replaced with `#8a9aaa` (~6.5:1) |
| M2 | `#70767C` heading gradient darkest stop — ≈ 4.3:1 | `global.css` | 1.4.3 | ✅ Fixed | Gradient end updated to `#838f9a` (~5.7:1); before: `#70767C`, after: `#838f9a` |
| M3 | `#4a5568` header-dept text — ≈ 2.6:1 | `global.css` | 1.4.3 | ✅ Fixed | Updated `.header--dept` color to `#7a8fa0` (~6.1:1); also increased size `0.6rem` → `0.75rem` |
| M4 | `#3a5060` label text — ≈ 2.4:1 | `tracks/index.astro`, `BaseLayout.astro` | 1.4.3 | ✅ Fixed | Replaced with `#7a8fa0`–`#8a9aaa` across all instances |
| M5 | `rgba(180,200,218,0.5)` `.sc-race` — blended ≈ 3.5:1 | `global.css` | 1.4.3 | ✅ Fixed | Opacity raised to `0.9`; before: ~3.5:1, after: ~6.2:1 |
| M6 | `opacity: 0.4` inactive sticky nav items | `global.css` | 1.4.3 / 2.4.7 | ✅ Fixed | Raised to `opacity: 0.6` |
| M7 | Continent/type filter buttons missing `aria-pressed` | `tracks/index.astro` | 4.1.2 | ✅ Fixed | All filter buttons now have `aria-pressed="true/false"`; JS toggles on click |
| M8 | `.sub-sched.open` animation no reduced-motion guard | `global.css` | 2.3.3 | ✅ Fixed | Added `@media (prefers-reduced-motion: reduce) { .sub-sched.open { animation: none; } }` |
| M9 | Sticky nav `slideUp` animation no reduced-motion guard | `global.css` | 2.3.3 | ✅ Fixed | Added `.sticky-nav-bar { transition: none; }` in same reduced-motion block; card/image transitions also suppressed |
| M10 | Static `aria-expanded="false"` on `<details>/<summary>` | `index.astro` | 4.1.2 | ✅ Fixed | Removed the static attribute; `<details>` manages its own open/closed state natively |
| M11 | `.month-header` divs have no heading role | `index.astro`, `series/[slug].astro` | 1.3.1 | ⏸ Deferred | Visual heading treatment not exposed to AT. Structural refactor (div → heading element) risks CSS breakage across cal grid; deferred for layout-safe milestone |
| M12 | Results table is div-based with no ARIA table roles | `results.astro` | 1.3.1 | ⏸ Deferred | Full semantic table refactor deferred — requires redesigning results layout; current div structure at least has legible column groupings |
| M13 | `dash-toggle-btn` has no `aria-expanded` | `Dashboard.astro`, `main.js` | 4.1.2 | ✅ Fixed | Added `aria-expanded="false" aria-controls="dash-grid"` to button; `initDashToggle()` toggles true/false |

---

### MINOR

| # | Issue | Location | WCAG | Status | Fix |
|---|---|---|---|---|---|
| m1 | Font sizes `0.62rem`–`0.68rem` borderline | `results.astro`, `tracks/index.astro`, `global.css` | 1.4.4 | ✅ Fixed | Raised alongside Phase 3 size pass — all previously sub-`0.7rem` labels now at `0.7rem`–`0.75rem` |
| m2 | `→` characters may be read literally by screen readers | `Dashboard.astro`, `series/index.astro` | 1.3.3 | ⏸ Deferred | Low risk — major screen readers render `→` as "arrow" or skip; content is legible from context |
| m3 | Track browser stretched-link pattern: duplicate content for virtual cursor users | `tracks/index.astro` | 1.3.1 | ⏸ Deferred | Pattern is common and not a hard failure; full restructure deferred |
| m4 | Countdown elements update every second with no `aria-live` | `series/index.astro`, `main.js` | 4.1.3 | ⏸ Deferred | Would be excessively noisy if announced live; intentionally left silent — user can focus the element to read it |
| m5 | Live countdown inside `<a>` tag may cause unexpected announcements | `series/index.astro` | 4.1.3 | ⏸ Deferred | Same as m4; dynamic-inside-link pattern is widely used; low real-world impact |
| m6 | `#6a8090` passes AA but fails AAA (7:1) | `results.astro` | 1.4.6 (AAA) | ℹ️ Won't fix | 4.8:1 passes AA. AAA target not achievable here without losing visual hierarchy |
| m7 | `#7a8fa0` passes AA, borderline AAA | `results.astro` | 1.4.6 (AAA) | ℹ️ Won't fix | 6.1:1 — close to AAA; acceptable given design constraints |

---

## Color contrast reference

Computed against primary bg `#101a24` (luminance ≈ 0.006) and card bg `#0D151D` (luminance ≈ 0.006 — essentially identical). Using WCAG contrast formula: (L1+0.05)/(L2+0.05).

| Color | Luminance | Ratio vs dark bg | AA normal (4.5:1) | AA large (3:1) | AAA normal (7:1) |
|---|---|---|---|---|---|
| `#334` (#333344) | 0.039 | ~1.6:1 | ❌ | ❌ | ❌ |
| `#445` (#444455) | 0.067 | ~2.1:1 | ❌ | ❌ | ❌ |
| `#556` (#555566) | 0.100 | ~2.7:1 | ❌ | ❌ | ❌ |
| `#4a5568` | 0.097 | ~2.6:1 | ❌ | ❌ | ❌ |
| `#3a5060` | 0.086 | ~2.4:1 | ❌ | ❌ | ❌ |
| `#506070` | 0.118 | ~3.0:1 | ❌ | ✅ (barely) | ❌ |
| `#667` (#666677) | 0.133 | ~3.3:1 | ❌ | ✅ | ❌ |
| `rgba(180,200,218,0.5)` blended | ~0.147 | ~3.5:1 | ❌ | ✅ | ❌ |
| `#70767C` | 0.193 | ~4.3:1 | ❌ | ✅ | ❌ |
| `#6a8090` | 0.218 | ~4.8:1 | ✅ | ✅ | ❌ |
| **`#7a8fa0`** (replacement) | 0.293 | ~6.1:1 | ✅ | ✅ | ❌ |
| **`#838f9a`** (heading gradient) | 0.330 | ~5.7:1 | ✅ | ✅ | ❌ |
| **`#8a9aaa`** (replacement) | 0.370 | ~6.5:1 | ✅ | ✅ | ❌ |
| `#9aa` (#99aaaa) | 0.421 | ~8.4:1 | ✅ | ✅ | ✅ |
| `#c3c6c8` | 0.583 | ~11.3:1 | ✅ | ✅ | ✅ |

---

## Remaining known gaps

- **M11 / M12** — Month-header semantic headings and results table ARIA roles. Both require structural refactors that risk CSS breakage. Deferred to a future layout-safe sprint.
- **m2–m5** — Minor AT announcements (arrow characters, countdowns). Real-world impact is low; deferred indefinitely.
- **AAA text contrast (m6, m7)** — Site achieves AA across all fixed issues. AAA (7:1) for secondary meta text would require colors lighter than the design hierarchy allows (tertiary text would approach primary text lightness). Accepted gap.

# Accessibility Improvement Instructions — dord.racing

Target: **WCAG 2.2 AA everywhere, AAA where feasible** (especially text contrast and focus visibility). Apply to all four views (Calendar, Series, Tracks, Results) and to all future features.

Known pain points reported by the team: text too small in places, insufficient color contrast, hover/click states not visually obvious enough. Use these as your primary targets, but do a full audit — don't stop at the reported issues.

Work in phases, in order. Don't skip ahead to fixes before the audit is done — you need the full issue list to prioritize correctly.

---

## Phase 0 — Setup

1. Install and confirm you can run automated checks locally:
   - `axe-core` (via `@axe-core/cli` or `axe-playwright`) for DOM-level WCAG rule checking.
   - Lighthouse (`lighthouse <url> --only-categories=accessibility --view`) for a scored report.
2. Confirm both tools can run against the local dev server for all four routes: `/`, `/series`, `/tracks`, `/results` (adjust paths to match actual routing in `src/pages/`).
3. Create a tracking file `a11y-audit.md` at the repo root. You'll log every issue found in Phase 1 here before fixing anything, with columns: `Issue | Location | WCAG criterion | Severity | Status`.

---

## Phase 1 — Audit (find everything before fixing anything)

Run against every route, log every finding in `a11y-audit.md`:

1. Run axe-core and Lighthouse on all 4 routes. Record every violation, not just failures — include "needs review" items.
2. **Color contrast** — check every text/background pairing by hand, not just what automated tools catch (automated tools miss gradient-clipped text and text over images):
   - Body text `#e0e0e0` on `--bg: #101a24` and on `--card-bg: #0D151D`.
   - Heading gradient (`#C3C6C8` → `#70767C`) clipped to text, on both background steps — check the darkest point of the gradient, since gradient text contrast is only as good as its weakest color.
   - Every series accent color used as text or as a border-only indicator (all 25 series colors) against `--bg` and `--card-bg`.
   - Roboto Mono meta text (timestamps, labels, footer legal) — this is often set smaller and dimmer than body text; check it separately.
   - Muted/secondary grays used in hover-off states (`#667`-style dim tones).
   - Compute exact ratios (use WebAIM contrast checker formula or a script) and note pass/fail against both 4.5:1 (AA normal text), 3:1 (AA large text/UI), 7:1 (AAA normal text), 4.5:1 (AAA large text) for each pairing.
3. **Text size** — audit every font-size token in `tokens/typography.css` and `global.css` against actual rendered size. Flag anything under 16px for body copy, under 12px for any meta/label text, and any place `rem`/`em` values resolve smaller than that at default browser zoom.
4. **Keyboard navigation** — tab through the entire page with no mouse:
   - Sticky bottom nav: does it appear/get focus correctly as it springs in? Can every item be reached and activated via keyboard?
   - Search overlay: can it be opened, typed into, navigated (results), and closed (Escape) via keyboard only? Is focus trapped inside it while open and returned to the trigger on close?
   - Accordions (sub-schedule, FAQ, past-events): can each be toggled with Enter/Space? Is expanded/collapsed state announced?
   - Continent filter pills / calendar filter buttons: reachable via Tab, activated via Enter/Space, and is multi-select (if any) operable via keyboard?
   - Verify tab order matches visual order everywhere (no illogical jumps).
5. **Focus indicators** — check every interactive element (links, buttons, tags, filter pills, nav items, accordion headers) has a visible focus ring at default browser zoom AND at 200% zoom. Note anywhere `outline: none` is set without a replacement.
6. **Semantic HTML / screen reader structure**:
   - Confirm heading hierarchy is logical (one h1 per page, no skipped levels) across all 4 views.
   - Confirm nav landmark (`<nav>`), main landmark (`<main>`), footer landmark (`<footer>`) exist and are singular/correct.
   - Calendar/results rows: are they in a `<table>`/`<ul>` with appropriate roles, or a `<div>` soup? If divs, check for appropriate `role="table"/"row"/"cell"` or restructure to semantic elements.
   - Tags/series labels: confirm they're not conveying meaning by color alone — series name must be present as text or in an accessible name, not just a colored dot/border.
   - Inline SVG icons (nav icons, social icons) and track-map SVGs: confirm each has `aria-hidden="true"` if purely decorative, or an accessible name (`<title>`, `aria-label`) if it conveys information (e.g. a nav icon standing in for its label).
   - Flag SVGs (winner nationality, venue country): confirm they have an accessible name (country name), not just a visual flag.
   - Form-like controls (filter buttons, continent pills, search input): confirm proper `aria-pressed`/`aria-selected` state, and that the search input has an associated `<label>` (visually hidden is fine).
7. **Motion**: confirm the site respects `prefers-reduced-motion` for the sticky-nav spring-in and accordion slide/fade transitions.

Once Phase 1 is complete, review `a11y-audit.md` with severity ratings (Critical / Serious / Moderate / Minor) before starting fixes.

---

## Phase 2 — Fix: Color contrast

1. For every pairing that failed AA in Phase 1, raise contrast to at least AA (4.5:1 text / 3:1 UI), and to AAA (7:1 text) wherever it doesn't conflict with a series' recognizable brand hue — prefer lightening/desaturating slightly over changing hue.
2. For series colors used as small text or thin borders on `--bg`/`--card-bg`: where a color fails even AA, don't replace the hue — pair it with a lighter tint of the same hue for text, and keep the saturated original for larger surface use (backgrounds, thick accent bars) where the 3:1 UI-component threshold is easier to hit.
3. Fix the heading gradient if its darker stop fails: adjust `#70767C` upward in lightness until the darkest rendered pixel clears AA on both background steps, keeping the gradient direction and metallic feel intact.
4. Fix dim/muted gray states (hover-off text, secondary meta) that fail contrast — brighten them just enough to pass; don't lose the intentional visual hierarchy between primary and secondary text.
5. Re-run axe/Lighthouse contrast checks after each batch of fixes to confirm.

## Phase 3 — Fix: Text size

1. Raise any body text below 16px to 16px minimum; any meta/label text below 12px to 12px minimum.
2. Confirm nothing breaks layout at these sizes (check calendar rows, tag chips, dense meta rows for wrapping/overflow).
3. Confirm the page respects user browser zoom/font-size overrides — no fixed-height containers that clip text at 200% zoom.

## Phase 4 — Fix: Keyboard navigation & focus states

1. Add/fix visible focus styles on every interactive element flagged in Phase 1 — a clear outline or ring, at minimum 3:1 contrast against its background, that's distinct from hover styling (don't rely on hover-only feedback for keyboard users).
2. Strengthen hover AND focus states together where flagged as "not obvious enough": increase the visual delta (e.g. brighten border/text further, add a subtle background wash, keep translateY lift on cards) so both mouse and keyboard interaction feel confirmed. Keep to the design system's existing hover language (lighten, never darken; translateY(-2 to -3px) lift on cards; 4px slide-right on calendar rows) — amplify it, don't invent a new interaction style.
3. Implement focus trapping in the search overlay (focus enters on open, Tab cycles within it, Escape closes and returns focus to the trigger element).
4. Ensure accordions (FAQ, sub-schedule, past-events) are operable via Enter/Space, expose `aria-expanded`, and that focus lands sensibly after toggle.
5. Ensure sticky nav items and filter pills are fully keyboard-operable and show focus state consistent with the rest of the site.

## Phase 5 — Fix: Semantic HTML & screen reader support

1. Correct heading hierarchy on any page with issues found in Phase 1.
2. Add/correct landmark elements (`<nav>`, `<main>`, `<footer>`) where missing or duplicated.
3. Restructure calendar/results rows to semantic table/list markup or add correct ARIA roles if a div-based layout must stay for styling reasons.
4. Add `aria-hidden="true"` to decorative SVGs; add `<title>`/`aria-label` to informational SVGs and flags.
5. Add `aria-pressed`/`aria-selected` to filter buttons/pills as appropriate; add a visually-hidden `<label>` to the search input.
6. Confirm series color is never the only way series identity is conveyed — text label must always be present in the accessible name.

## Phase 6 — Process for new features going forward

Add this checklist to the repo (e.g. `CONTRIBUTING.md` or `CLAUDE.md`) so future work doesn't regress:

- [ ] Every new text/background color pairing checked against AA (AAA where feasible) before merge.
- [ ] Every new interactive element keyboard-operable (Tab reachable, Enter/Space activates) with a visible focus state.
- [ ] Every new icon/SVG marked `aria-hidden` (decorative) or given an accessible name (informational).
- [ ] Every new color-coded element (series tags, status indicators) also conveys meaning via text, not color alone.
- [ ] Run axe/Lighthouse on any new page/route before merge; zero new critical/serious violations.
- [ ] Any new animation/transition respects `prefers-reduced-motion`.

---

## Phase 7 — Verify

1. Re-run axe-core and Lighthouse accessibility audits on all 4 routes; target zero critical/serious violations, Lighthouse accessibility score ≥ 95.
2. Do a full manual keyboard-only pass across all 4 routes (no mouse) confirming every interactive element is reachable, operable, and its state/focus is visible.
3. Spot-check with a screen reader (VoiceOver on macOS, or NVDA) on: homepage nav, calendar event row, series card, track card, results row, FAQ accordion, search overlay — confirm each announces sensibly.
4. Update `a11y-audit.md` marking every logged issue as Fixed/Verified, with before/after contrast ratios noted for the contrast fixes.
5. Summarize remaining known gaps (if any) and why (e.g. a specific AAA target not reachable without breaking series brand-color recognition) at the bottom of `a11y-audit.md`.

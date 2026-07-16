# DORD — Affiliate Links Integration
## Instructions for Coding Claude

---

## CONTEXT

DORD is enrolled (pending approval) in the Motorsport Tickets affiliate program via AWIN (Merchant ID 21865). Once approved, links should use the AWIN deeplink format:

```
https://www.awin1.com/cread.php?awinmid=21865&awinaffid=YOUR_PUBLISHER_ID&clickref=&ued=ENCODED_TARGET_URL
```

Replace `YOUR_PUBLISHER_ID` with the AWIN publisher ID from DRNDT STUDIO's account.
Replace `ENCODED_TARGET_URL` with `encodeURIComponent("https://www.motorsporttickets.com/...")`.

**Until AWIN is approved:** render the CTA using the direct Motorsport Tickets URL with no affiliate tracking, so the feature is live and functional. Swap to affiliate links once approved — only the `href` changes.

---

## WHERE TO ADD CTAs

### 1. Series pages `/series/[id]`
- Add a "Get Tickets" button in the page header alongside the series name
- This links to Motorsport Tickets' search results for that series:
  `https://www.motorsporttickets.com/search?q=[series+name]`
- Show only for series that Motorsport Tickets actually sells — don't show for purely broadcast-only series (e.g., IndyCar may have limited ticket inventory)
- Priority series to enable first: F1, MotoGP, WEC, WorldSBK, DTM, Formula E, GT World Challenge

### 2. Race event entries in the calendar `/`
- Add a small "🎟 Tickets" link/pill next to each event row where tickets are likely available
- Link to: `https://www.motorsporttickets.com/search?q=[circuit+name]+[year]`
- Don't show for: street circuits where tickets aren't sold (e.g., some Formula E venues), circuits with no known Motorsport Tickets inventory

### 3. Track pages `/tracks/[id]`
- Add a "Get tickets for events at [Circuit Name]" CTA in the page sidebar or below the circuit stats
- Link to: `https://www.motorsporttickets.com/search?q=[circuit+name]`

---

## AFFILIATE DISCLOSURE (REQUIRED)

French and EU law (and standard affiliate practice) requires disclosure. Add this near every affiliate CTA:

```html
<span class="affiliate-notice">
  Affiliate link — DORD may earn a commission at no cost to you.
</span>
```

CSS: small, muted text (10-11px), `color: var(--text-muted)`, displayed inline or below the button. Not intrusive, just visible.

Do NOT bury the disclosure in a footer or a separate page — it must be near the link itself.

---

## IMPLEMENTATION

### Component: `<TicketsButton />`

Create a reusable component:

```tsx
// components/TicketsButton.astro (or .tsx)
interface Props {
  query: string;          // search term to pass to Motorsport Tickets
  label?: string;         // default: "Get Tickets"
  size?: "sm" | "md";
}

const AWIN_MID = "21865";
const AWIN_AFF = import.meta.env.AWIN_PUBLISHER_ID ?? "";  // env var

const { query, label = "Get Tickets", size = "md" } = Astro.props;

const target = `https://www.motorsporttickets.com/search?q=${encodeURIComponent(query)}`;

// If AWIN publisher ID is set, use affiliate link; otherwise use direct link
const href = AWIN_AFF
  ? `https://www.awin1.com/cread.php?awinmid=${AWIN_MID}&awinaffid=${AWIN_AFF}&ued=${encodeURIComponent(target)}`
  : target;
```

Add `AWIN_PUBLISHER_ID` to `.env` and `.env.example`. Set it to empty string for now; fill in when AWIN approves.

### Data flag: `hasTickets`

Add a boolean `hasTickets: true/false` to each series data object to control whether the button renders. Start with these as `true`:
- f1, motogp, wec, worldsbk, dtm, gt-world-challenge, formula-e, imsa

Everything else defaults to `false` until confirmed.

---

## WHAT NOT TO DO

- Don't add affiliate links to content/editorial posts — only to calendar/track/series pages where the intent is clearly "I want to go to this event"
- Don't auto-generate deep links to specific event pages yet — Motorsport Tickets' URL structure may not be stable; use search links for now
- Don't add a "Book Hotels" or "Book Flights" CTA yet — those programs aren't set up

---

## FUTURE: RALLY.TV STREAMING LINKS

If Rally.TV approves the affiliate application, add a "Watch Live" CTA to:
- `/series/wrc`, `/series/erc`, `/series/euro-rx`
- Event entries for those series in the calendar

Same pattern: `<WatchButton />` component, env var for affiliate ID, disclosure label.

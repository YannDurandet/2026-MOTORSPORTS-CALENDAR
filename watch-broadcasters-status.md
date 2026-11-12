# Where-to-watch data — status

_Last researched: 2026-11-08. Data lives in `howToWatch` per series in `data/seriesContent.json`._

How a visitor's list is chosen: `src/scripts/country.js` (their saved country → that country's list → the series' `global` list). The country comes from the popup on `/watch`, never from the browser language. Declining or never answering shows the **US** list; a series with no US entry shows its `global` option.

## Rules for editing

- A country entry is only added when an **official series page or a dated 2026 announcement** names it. Anything unconfirmed is left out, so the visitor falls back to the series' `global` option rather than a wrong channel.
- `type` is `"free"` | `"pay"` | `"streaming"`, and is omitted when it isn't certain (no badge shows). Don't guess a `free` badge.
- `url`: use the broadcaster's own page. When an official list names a broadcaster without a URL, the entry links to that official list instead (so the pill is never a guessed domain).
- Countries are ISO 3166-1 alpha-2 (`GB`, not `UK`). The popup's dropdown is built from whichever codes appear here, so a new country needs no other change.
- Rights change every season. Re-check each series' source page before the season opens.

## Coverage

Target: EU27 + UK, NO, CH, IS + US, CA, AU, NZ, JP (36 countries). Cells = countries with a local entry; the rest fall back to `global`.

| Series | Local cells | Official source |
|---|---|---|
| F1 | 36 / 36 | formula1.com/en/information/f1-broadcast-information |
| Formula E | 36 / 36 | fiaformulae.com/en/ways-to-watch/broadcasters (Season 12 list; see below) |
| WorldSBK | 33 / 36 | worldsbk.com 2026 "where to watch" article (19 Feb 2026) |
| WRC | 30 / 36 | wrc.com/en/misc/broadcast-guide |
| MotoGP | 28 / 36 | motogp.com/en/broadcasters |
| F1 Academy | 26 / 36 | f1academy.com where-to-watch page |
| NASCAR | 24 / 36 | nascar.com/international/how-to-watch |
| IndyCar | 22 / 36 | indycar.com/how-to-follow/international (+ 19 Feb 2026 release) |
| Supercars | 19 / 36 | supercars.com/watch-supercars-international |
| WEC | 8 / 36 | fiawec.com "où regarder" (by region only) + wecengine.com (per country, fan site) |
| DTM, BTCC | 3 / 36 | unchanged: already matched dtm.com / btcc.net |
| GTWCE, NLS | 2 / 36 | Ziggo (NL), Sky (GB) 2026 listings; GT World YouTube |
| IMSA | US + global | imsa.com no longer publishes an international page; it points to YouTube |
| ERC, EuroRX, ELMS, GTWCA, IGTC, BGT, TCR, Super Formula | global (+ a few) | series sites / 2026 announcements |

## Known gaps and things to re-check

- **No listing at all:** `h24eu` (24H Series), `psc` (Porsche Supercup, rides on F1 weekends), `asian-le-mans` (its 2026/27 calendar is out: Paul Ricard, Jerez, Portimão).
- **Formula E:** the FIA page covers **Season 12 (2025/26)**. Season 13 starts 16 Jan 2027 in Mexico City (Jeddah moved from 18 Dec to April) and the page says its partners "will be updated when confirmed". Local entries are marked `2025/26 season`. Disney+ is the announced global streaming home from Season 13. UK (ITV, TNT) is confirmed to 2027. Refresh when the S13 list appears.
- **WEC:** the official page is regional, not per country. Per-country entries come from the WEC Engine fan site, which says it was checked against the official list. Italy also had Rai Sport / Rai 2 for the Monza finale only. truTV (US) comes from TNT's announcement; the official regional list omits it.
- **MotoGP:** the official page shows a country with no channel for DK, SE, NO, NL, LU, NZ (not listed → global). HR points at a Serbian site, so it's left out. Italy: Sky Sport until 2027 inclusive. Spain: DAZN to 2030, Portugal to 2031.
- **WorldSBK:** Spain is DAZN on the official page; one third-party guide adds Eurosport, left out. The page is dated Feb 2026.
- **WRC:** UK live moves from TNT Sports to the BBC in 2027. Spain's only listed partner is Catalan TV3 (`Catalonia only`). Rally.TV on DAZN is excluded in EE, FI, FR, LV, LT, PL, SE.
- **IMSA:** the old per-country page (Viaplay, VodafoneZiggo, Motorvision…) is gone and unverified for 2026, so those countries are not listed.
- **Older entries kept untouched** where the new sources don't speak to them (for example F1 Brazil, whose Bandeirantes link currently has an expired TLS certificate on their side).
- **Type badges** come from general knowledge of the broadcaster (public broadcasters → free, Sky/Canal+/TNT → pay, Viaplay/DAZN → streaming), not from the official pages, which don't classify them. Entries where that wasn't obvious carry no badge, and so does a broadcaster that bundles free-to-air with pay-TV channels (NASCAR's FOX / FS1 and NBC / USA Network).
- Links were all fetched on 2026-11-08; 14 hosts block scripted requests (nascar.com, racer.com, go3, nova.cz, network4.hu…) and could not be auto-verified.

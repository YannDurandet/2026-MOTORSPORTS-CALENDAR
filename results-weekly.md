# Weekly Race Results — Past 7 Days

Search the web for all motorsport race results from the past 7 days across the series listed below. Return a JSON block only — no prose, no explanation.

---

## SERIES TO CHECK

| Series slug | Series name | Result type |
|---|---|---|
| `f1` | Formula 1 | A |
| `f1a` | F1 Academy | A |
| `fe` | Formula E | A |
| `sf` | Super Formula | A |
| `indycar` | IndyCar | A |
| `nascar` | NASCAR Cup Series | A |
| `motogp` | MotoGP (main class only) | A |
| `wsbk` | World Superbike | A |
| `dtm` | DTM | A |
| `btcc` | BTCC | A |
| `supercars` | Supercars Championship | A |
| `tcr` | TCR World Tour | A |
| `psc` | Porsche Supercup | A |
| `bgt` | British GT (overall winner) | A |
| `eurx` | Euro RX | A |
| `gtwce` | GT World Challenge Europe (overall winner) | A |
| `gtwca` | GT World Challenge America (overall winner) | A |
| `wrc` | WRC | B |
| `erc` | ERC | B |
| `wec` | WEC (overall winner) | C |
| `imsa` | IMSA (overall winner) | C |
| `elms` | ELMS (overall winner) | C |
| `nls` | NLS — Nürburgring Langstrecken-Serie (overall) | C |
| `h24eu` | 24H Series Europe (overall winner) | C |
| `igtc` | Intercontinental GT Challenge (overall winner) | C |

---

## OUTPUT TO FILL IN

Replace `???` with real values found via web search. Remove any entry you cannot verify.

```json
{
  "YYYY-WW": {
    "series_slug": [
      {
        "round": 0,
        "event": "???",
        "venue": "???",
        "date": "YYYY-MM-DD",
        "winner": "???",
        "team": "???",
        "country": "??"
      }
    ]
  }
}
```

Replace `YYYY-WW` with the ISO year and week number of the races (e.g. `"2026-28"` for week 28 of 2026).

---

## SCHEMAS

**A — single winner**
```json
{ "round": 1, "race_label": "Race 1", "event": "...", "venue": "...", "date": "YYYY-MM-DD", "winner": "Full Name", "team": "Team", "country": "XX" }
```
Omit `race_label` for single-race weekends. Use it for:
- MotoGP: `"Sprint"` + `"Race"`
- F1 sprint weekends: `"Sprint"` + `"Race"`
- WSBK: `"Race 1"` + `"Superpole Race"` + `"Race 2"`
- BTCC: `"Race 1"` + `"Race 2"` + `"Race 3"`
- DTM / Supercars / GTWCA / GTWCE sprint: `"Race 1"` + `"Race 2"`
- FE double-headers: `"Race 1"` + `"Race 2"`

**B — rally overall winner**
```json
{ "round": 1, "event": "...", "venue": "...", "date": "YYYY-MM-DD", "winner": "Driver", "co_driver": "Co-driver", "manufacturer": "Toyota", "country": "XX" }
```

**C — endurance overall winner**
```json
{ "round": 1, "event": "...", "venue": "...", "date": "YYYY-MM-DD", "winners": ["Driver1", "Driver2"], "team": "Team", "car_number": "7", "country": "XX" }
```
`country` for C = manufacturer nationality: Toyota→JP · Ferrari/Lamborghini→IT · Porsche/BMW/Mercedes/Audi→DE · Cadillac/Chevrolet→US · Acura→JP · McLaren/Aston Martin→GB

---

## RULES

- `date` = race finish day in `YYYY-MM-DD`
- `country` = 2-letter ISO code (driver nationality for A/B; manufacturer for C)
- Only include series that had races in the past 7 days
- If a result is unverifiable, omit that entry — do not guess
- Venue slug = circuit name in lowercase-hyphenated form (e.g. `silverstone`, `le-mans`, `monte-carlo-wrc`)

**ISO reference:** AU AT BE BR CA CN FI FR DE GB HU IT JP MC MX NL NZ NO PT ZA KR ES SE TH US

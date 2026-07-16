# DORD — "How to Watch" Feature
## Research data + Coding Claude integration instructions

---

## 1. WHAT TO BUILD

Add a "How to Watch" section to each `/series/[id]` page. It shows the broadcaster(s) for the user's country, with a link to the broadcaster's site or app.

**UI concept:**
- Section title: "How to Watch"
- Detect user's country via browser locale (`Intl.DateTimeFormat().resolvedOptions().locale` or a lightweight geo approach)
- Show: broadcaster name + logo (optional) + link
- Fallback: show the global/streaming option if no local broadcaster matched
- If no data for that series: hide the section entirely

**Do NOT use a heavy geo API.** Use browser locale as a first pass — it's good enough for this use case and zero cost.

---

## 2. DATA STRUCTURE

Add a `howToWatch` field to each series data object. Suggested shape:

```ts
type Broadcaster = {
  name: string;         // "Sky Sports F1"
  type: "tv" | "streaming" | "free" | "pay";
  url: string;          // link to broadcaster's site or schedule page
  note?: string;        // optional: "Live" | "Highlights only" | "Selected races"
};

type HowToWatch = {
  [countryCode: string]: Broadcaster[];  // ISO 3166-1 alpha-2
  global?: Broadcaster[];                // fallback — series own streaming
};
```

Example for F1:
```json
{
  "howToWatch": {
    "US": [{ "name": "ESPN", "type": "pay", "url": "https://www.espn.com" }, { "name": "F1 TV Pro", "type": "streaming", "url": "https://f1tv.formula1.com" }],
    "GB": [{ "name": "Sky Sports F1", "type": "pay", "url": "https://www.skysports.com/f1", "note": "Live" }, { "name": "Channel 4", "type": "free", "url": "https://www.channel4.com", "note": "Highlights" }],
    "FR": [{ "name": "Canal+", "type": "pay", "url": "https://www.canalplus.com" }],
    "DE": [{ "name": "Sky Deutschland", "type": "pay", "url": "https://www.sky.de" }],
    "IT": [{ "name": "Sky Sport F1", "type": "pay", "url": "https://sport.sky.it" }],
    "AU": [{ "name": "Fox Sports", "type": "pay", "url": "https://www.foxsports.com.au" }, { "name": "Kayo", "type": "streaming", "url": "https://kayosports.com.au" }],
    "CA": [{ "name": "TSN", "type": "pay", "url": "https://www.tsn.ca" }, { "name": "RDS", "type": "pay", "url": "https://www.rds.ca", "note": "French" }],
    "NL": [{ "name": "Viaplay", "type": "streaming", "url": "https://viaplay.com/nl" }],
    "ES": [{ "name": "DAZN", "type": "streaming", "url": "https://www.dazn.com/es-ES" }],
    "BR": [{ "name": "Bandeirantes", "type": "free", "url": "https://www.band.uol.com.br" }],
    "global": [{ "name": "F1 TV Pro", "type": "streaming", "url": "https://f1tv.formula1.com", "note": "Available in most countries" }]
  }
}
```

---

## 3. BROADCASTER DATA BY SERIES

### Formula 1 (`f1`)
| Country | Broadcaster | Type | Note |
|---------|------------|------|------|
| US | ESPN | Pay TV | Live |
| US | F1 TV Pro | Streaming | Live |
| GB | Sky Sports F1 | Pay TV | Live |
| GB | Channel 4 | Free TV | Highlights only |
| FR | Canal+ | Pay TV | Live |
| DE | Sky Deutschland | Pay TV | Live |
| IT | Sky Sport F1 | Pay TV | Live |
| AU | Fox Sports / Kayo | Pay/Stream | Live |
| CA | TSN / RDS | Pay TV | Live |
| NL | Viaplay | Streaming | Live |
| ES | DAZN | Streaming | Live |
| BR | Bandeirantes | Free TV | Live |
| Global | F1 TV Pro | Streaming | Most countries |

---

### MotoGP (`motogp`)
| Country | Broadcaster | Type | Note |
|---------|------------|------|------|
| US | Peacock | Streaming | Live |
| GB | TNT Sports | Pay TV | Live |
| FR | Canal+ | Pay TV | Live |
| DE | ServusTV | Free TV | Live |
| DE | DAZN | Streaming | Live |
| IT | Sky Sport MotoGP | Pay TV | Live |
| AU | Fox Sports / Kayo | Pay/Stream | Live |
| ES | DAZN | Streaming | Live |
| PT | Sport TV | Pay TV | Live |
| Global | MotoGP VideoPass | Streaming | All races, official |

---

### FIA World Endurance Championship (`wec`)
| Country | Broadcaster | Type | Note |
|---------|------------|------|------|
| US | MotorTrend TV | Pay TV | Live |
| US | Max (HBO Max) | Streaming | |
| GB | TNT Sports | Pay TV | Live |
| GB | Eurosport | Pay TV | |
| FR | Eurosport | Pay TV | |
| DE | RTL Nitro | Free TV | |
| DE | Eurosport | Pay TV | |
| IT | Discovery Turbo / Eurosport | Pay TV | |
| CA | Discovery Velocity | Pay TV | |
| Global | FIAWEC+ | Streaming | Official, all races |

---

### IndyCar Series (`indycar`)
| Country | Broadcaster | Type | Note |
|---------|------------|------|------|
| US | FOX | Free TV | All races |
| GB | Sky Sports F1 | Pay TV | Live |
| CA | TSN+ | Streaming | Live |
| AU | Stan Sport | Streaming | Live |
| NZ | Sky Sports NZ | Pay TV | Live |
| BR | ESPN | Pay TV | |
| FR | Canal+ | Pay TV | |
| NL | Ziggo Sport | Pay TV | |
| JP | Gaora | Pay TV | |
| PT | Sport TV | Pay TV | |
| Global | IndyCar+ | Streaming | Official streaming |

---

### NASCAR Cup Series (`nascar-cup`)
| Country | Broadcaster | Type | Note |
|---------|------------|------|------|
| US | FOX / FS1 | Free+Pay TV | First half of season |
| US | TNT Sports | Streaming | 5 races |
| US | Amazon Prime Video | Streaming | 5 races |
| US | NBC / USA Network | Free+Pay TV | Second half |
| US | Peacock | Streaming | Selected races |
| Global | NASCAR TrackPass | Streaming | Official |

_NASCAR has very limited international TV distribution. Most international fans use TrackPass or VPN._

---

### Formula E (`formula-e`)
| Country | Broadcaster | Type | Note |
|---------|------------|------|------|
| US | CBS Sports | Pay TV | Live |
| US | The Roku Channel | Streaming | Free, live |
| GB | ITV4 | Free TV | Live |
| GB | TNT Sports | Pay TV | Live |
| DE | DF1 | Free TV | Live |
| FR | Eurosport | Pay TV | |
| CA | TSN | Pay TV | |
| AU | Stan Sport | Streaming | |
| Global | Formula E YouTube | Streaming | Some races free |

---

### WorldSBK (`worldsbk`)
| Country | Broadcaster | Type | Note |
|---------|------------|------|------|
| GB | TNT Sports | Pay TV | Live |
| GB | ITV4 | Free TV | Highlights |
| DE | ServusTV | Free TV | Live |
| AT | ServusTV | Free TV | Live |
| FR | Eurosport | Pay TV | |
| IT | TV8 | Free TV | Live |
| IT | Sky Sport | Pay TV | Live |
| NL | Viaplay | Streaming | |
| SE/DK/NO/FI | Viaplay | Streaming | |
| CZ/SK | Nova Sport | Pay TV | |
| Global | WorldSBK VideoPass | Streaming | Official |

---

### DTM (`dtm`)
| Country | Broadcaster | Type | Note |
|---------|------------|------|------|
| DE | ProSieben / Sat.1 | Free TV | Live, all races |
| DE | Joyn | Streaming | Free |
| AT | ServusTV | Free TV | Live or replay |
| GB | DAZN | Streaming | |
| Global | DTM YouTube | Streaming | Free in most countries |
| Global | dtm.com | Streaming | Free |

---

### BTCC (`btcc`)
| Country | Broadcaster | Type | Note |
|---------|------------|------|------|
| GB | ITV4 | Free TV | Live |
| GB | ITVX | Streaming | Free, live |
| US/CA | RACER Network | Streaming | |
| Global | BTCC YouTube | Streaming | Free, worldwide (excl. UK + NA) |
| Global | TikTok @officialbtcc | Social | Free, live |

---

### Supercars Championship (`supercars`)
| Country | Broadcaster | Type | Note |
|---------|------------|------|------|
| AU | Fox Sports / Foxtel | Pay TV | All rounds, UHD |
| AU | Kayo Sports | Streaming | All rounds |
| AU | Channel 7 / 7plus | Free TV | 5 selected rounds |
| AU | Network 10 | Free TV | Melbourne SuperSprint |
| NZ | Sky Sport NZ | Pay TV | |
| Global | SuperView | Streaming | Official international |

---

### IMSA WeatherTech Championship (`imsa`)
| Country | Broadcaster | Type | Note |
|---------|------------|------|------|
| US | NBC | Free TV | Selected races / finishes |
| US | Peacock | Streaming | Full coverage, all races |
| US | NBCSN | Pay TV | Selected endurance finales |
| Global | IMSA TrackPass | Streaming | Official |

---

### GT World Challenge Europe — SRO (`gt-world-challenge`)
| Country | Broadcaster | Type | Note |
|---------|------------|------|------|
| Global | GTWorld YouTube | Streaming | Free, live worldwide |
| Some EU | Eurosport | Pay TV | |

_SRO primarily distributes via their GTWorld YouTube channel globally — one of the most accessible series in this regard._

---

### NLS — Nürburgring Langstrecken-Serie (`nls`)
| Country | Broadcaster | Type | Note |
|---------|------------|------|------|
| DE | ntv.de | Streaming | Free, some rounds |
| Global | Nürburgring YouTube | Streaming | Free, selected rounds |
| Global | nürburgring.de | Streaming | |

_Very limited broadcast distribution. Primarily YouTube/streaming._

---

### World Rallycross Championship (`world-rx`)
| Country | Broadcaster | Type | Note |
|---------|------------|------|------|
| Global | Rallycross World / official stream | Streaming | |
| SE | TV4 | Free TV | |
| Some EU | Eurosport | Pay TV | |

---

## 4. INTEGRATION INSTRUCTIONS FOR CODING CLAUDE

```
Add a "How to Watch" section to /series/[id] pages. 

Data:
- Add a `howToWatch` field to each series in your data layer (JSON shape as above)
- Country codes: ISO 3166-1 alpha-2

Detection logic (client-side, no API needed):
  const locale = Intl.DateTimeFormat().resolvedOptions().locale;
  const country = locale.split('-')[1] || locale.toUpperCase();
  // e.g. "en-GB" → "GB", "fr-FR" → "FR"
  // Then look up howToWatch[country] || howToWatch["global"]

Rendering:
- Show section only if howToWatch data exists for that series
- If country matched: "Watch [Series] in [Country]: [Broadcaster Name] →"
- If no country match but global exists: "Watch globally: [Broadcaster]"
- If type === "free": add a small green "FREE" badge
- If type === "streaming": link directly to the broadcaster's site
- Add a thin disclaimer line: "Broadcast rights vary by region. Check local listings."

Mobile: show as a single pill/row, not a table.
Desktop: can show 1-2 broadcasters side by side.
```

---

## 5. DATA GAPS TO FILL

The following series need broadcaster data added — either you know them or check their official site:
- Super Formula (Japan-only; probably just Gaora + Fuji TV Next)
- ELMS (European Le Mans Series — probably Eurosport + FIAWEC+)
- F1 Academy / F2 / F3 (probably same as F1 — Sky Sports / Canal+ / ESPN)
- Asian Le Mans / other regional series

---
_Sources: IndyCar.com, DTM.com, BTCC.net, WorldSBK.com, Supercars.com, IMSA.com, gt-world-challenge-europe.com, fiaformulae.com, fiawec.com, nascar.com — all verified July 2026._

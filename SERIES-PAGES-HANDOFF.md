# Series Pages — Content & Architecture Handoff

> This document covers everything needed to build individual series pages for the 2026 Motorsport Master Calendar. It includes the information architecture decisions, navigation wiring, and the complete copy/content for all 22 series.

---

## 1. Information Architecture Decisions

### What each series page contains

Every series page has the same base structure:

1. **Hero header** — series name, color accent, category + region badges
2. **Short description** — 2–3 sentences, present tense, accessible to newcomers
3. **History** — 3–5 sentences on origins, key milestones, format evolution
4. **Teams & Drivers** — *only for Tier 1 series* (see below)
5. **2026 Calendar** — the existing calendar component, pre-filtered to this series only (pass `?series=f1` or equivalent, or route-level filter)
6. **Back link** — "← Full Master Calendar"

### Content depth tiers

| Tier | Series | Teams & Drivers section |
|------|--------|------------------------|
| **1 — Full** | F1, F1 Academy, MotoGP, Formula E, WEC, WRC | Yes — full grid |
| **2 — Featured** | IndyCar, NASCAR, WSBK, IMSA, Supercars, Super Formula | Top teams mentioned in History text, no structured grid table |
| **3 — Standard** | DTM, BTCC, ELMS, GTWCE, GTWCA, NLS, IGTC, TCR, ERC, 24H EU | Description + history + calendar only |

**Rationale for Tier 1 picks:** Compact, well-defined, stable grids — and in F1 Academy's case, an F1-marketed product with significant brand visibility that warrants the same treatment as its parent series.

**Why NASCAR isn't Tier 1:** The Cup Series runs 35+ cars across loosely structured organisations; a table would be stale and misleading. Mention top teams in prose instead.

---

## 2. URL Structure

```
/series/f1
/series/f1a
/series/fe
/series/sf
/series/wec
/series/imsa
/series/wrc
/series/indycar
/series/nascar
/series/motogp
/series/wsbk
/series/dtm
/series/btcc
/series/supercars
/series/elms
/series/gtwce
/series/gtwca
/series/nls
/series/igtc
/series/tcr
/series/erc
/series/h24eu
```

Plus a series index page at `/series` (grid of all 22).

Astro implementation: `src/pages/series/[slug].astro` with a static slug list. The series data (description, history, teams) can live in a new `data/seriesContent.json` or directly in the Astro page as a lookup object.

---

## 3. Navigation Wiring — Where to Add Links on the Main Page

Three entry points, ordered by implementation effort (easiest first):

### 3a. Series tag pills in EventRow (lowest effort, highest visibility)
Each `.tag` pill in `EventRow.astro` (e.g. "FORMULA 1", "WEC") becomes an `<a href="/series/f1">` link. Already styled, just wrap in anchor. ← **Do this first.**

### 3b. Dashboard series cards
Each `.dash-card` in `Dashboard.astro` gets a small "About →" link at the bottom, pointing to `/series/[slug]`.

### 3c. Nav item + Series index page
Add "SERIES" to the `Nav.astro` navigation alongside "CALENDAR" and "RESULTS". It points to `/series`, which shows the full grid of 22 series cards with a one-line description and the series color. This is the most work but rounds out the site as a proper reference.

---

## 4. Series Index Page (`/series`)

**Page title:** "2026 Racing Series Guide"

**Intro copy:**
> Every championship on the master calendar, from the pinnacle of open-wheel racing to the legendary Nordschleife. Click any series for its history, format, and full 2026 calendar.

Layout: same card grid style as the main calendar. Group cards by category (Open Wheel, Endurance, Rally, Touring, Bike, GT/Sports Car) with a category label, matching the existing filter categories. Each card shows: series color bar, name, one-line description, and a "View Series →" link.

---

## 5. Series Content (All 22)

The slug keys below match `seriesMetadata` in `main.js`.

---

### `f1` — Formula 1

**Category:** Open Wheel · Worldwide

**Short description:**
The FIA Formula One World Championship is the pinnacle of single-seater motor racing, contested across 22 Grands Prix on five continents. Eleven teams, each running two cars, compete simultaneously for the Drivers' and Constructors' championships under a set of regulations that changes with every generation.

**History:**
Formula 1 was formally constituted in 1950 with the inaugural World Drivers' Championship, won by Giuseppe Farina at the wheel of an Alfa Romeo. Through the following decades it evolved from front-engined roadsters to the ground-effect, turbo, and hybrid eras that define the sport today. The commercial era brought global television audiences in the hundreds of millions and Grands Prix on every inhabited continent. 2026 marks a watershed moment: an entirely new power unit formula — still over 1,000 bhp but with roughly equal contributions from internal combustion and an electric motor — paired with new active aerodynamics. Two new constructors, Audi (via the former Sauber entry) and Cadillac, expand the grid to eleven teams for the first time since 2016.

**Teams & Drivers (2026)**

| # | Team | Driver 1 | Driver 2 |
|---|------|----------|----------|
| 1 | Red Bull Racing | Max Verstappen | Isack Hadjar |
| 2 | Ferrari | Lewis Hamilton | Charles Leclerc |
| 3 | Mercedes-AMG | Kimi Antonelli | George Russell |
| 4 | McLaren | Lando Norris | Oscar Piastri |
| 5 | Aston Martin | Fernando Alonso | Lance Stroll |
| 6 | Alpine | Pierre Gasly | Franco Colapinto |
| 7 | Racing Bulls | Liam Lawson | Arvid Lindblad |
| 8 | Haas | Esteban Ocon | Oliver Bearman |
| 9 | Williams | Alexander Albon | Carlos Sainz |
| 10 | Audi | Nico Hülkenberg | Gabriel Bortoleto |
| 11 | Cadillac | Sergio Pérez | Valtteri Bottas |

**2026 Season notes:**
Lando Norris is the reigning Drivers' Champion; McLaren hold the Constructors' title. After 7 rounds, Kimi Antonelli (Mercedes) leads the championship.

---

### `f1a` — F1 Academy

**Category:** Open Wheel · Worldwide

**Short description:**
F1 Academy is an all-female, Formula 4-level single-seater championship founded by Formula One Management in 2023. Racing at selected Formula 1 weekends, it provides professional infrastructure and global visibility to the next generation of female racing drivers.

**History:**
Launched in 2023 with backing from all ten F1 teams — each sponsoring two cars — F1 Academy filled a gap left by the W Series, which folded in 2022. The series uses a spec Tatuus T-421 chassis with a 1.4-litre turbocharged engine. Its debut season attracted 15 drivers and was won by Marta García. A two-season participation limit keeps the field refreshed, and a Discover Your Drive kart programme now feeds talent directly onto the grid. The 2026 season is the fourth edition, featuring six teams and 18 drivers across 7 event weekends co-located with F1.

**Teams & Drivers (2026)**

| Team | Driver 1 | Driver 2 | Driver 3 |
|------|----------|----------|----------|
| Prema Racing *(defending champions)* | Mathilda Paatz | Payton Westcott | Natalia Granada |
| Campos Racing | Megan Bruce | Rafaela Ferreira | Alisha Palmowski |
| MP Motorsport | Nina Gademan | Alba Hurup Larsen | Esmee Kosterman |
| Rodin Motorsport | Ella Lloyd | Ella Stevens | Emma Felbermayr |
| ART Grand Prix | Jade Jacquet | Lisa Billard | Kaylee Countryman |
| Hitech | Rachel Robertson | Ava Dobson | Wild Card |

> *11 rookies on the 2026 grid. Each team's third car may carry a wild card entry at select rounds.*

---

### `fe` — Formula E

**Category:** Open Wheel · Worldwide

**Short description:**
The ABB FIA Formula E World Championship is the premier single-seater electric racing series, racing on temporary street circuits in city centres around the globe. It serves as both a technological proving ground for EV powertrain development and a uniquely urban motorsport spectacle.

**History:**
Formula E was conceived in 2011 by the FIA and launched its first season in September 2014 in Beijing, with the novel quirk that drivers swapped cars mid-race due to battery limitations. As technology improved, in-race car swaps were phased out by Season 5 (2018–19). Gen2, Gen3, and Gen3 Evo regulations successively lifted performance and efficiency; the Gen4 era begins in 2027. The 2025–26 season (Season 12) is notable for the entry of Citroën as a manufacturer, the longest calendar in series history (18 races across 12 weekends), and the championship defending by Oliver Rowland (Nissan). Former champions Pascal Wehrlein (Porsche), Jean-Éric Vergne (Citroën), António Félix da Costa (Jaguar), and Lucas Di Grassi (Lola Yamaha ABT) are all in the field.

**Teams & Drivers (Season 12 · 2025–26)**

| Team | Driver 1 | Driver 2 |
|------|----------|----------|
| Nissan Formula E | Oliver Rowland *(reigning champion)* | Norman Nato |
| Porsche Formula E | Pascal Wehrlein | Nico Müller |
| Jaguar TCS Racing | Mitch Evans | António Félix da Costa |
| Citroën Racing | Jean-Éric Vergne | Nick Cassidy |
| DS Penske | Maximilian Günther | Taylor Barnard |
| CUPRA KIRO | Dan Ticktum | Pepe Martí |
| Lola Yamaha ABT | Lucas di Grassi | Zane Maloney |
| Andretti Formula E | Jake Dennis | Felipe Drugovich |
| Envision Racing | Sébastien Buemi | Joel Eriksson |
| Mahindra Racing | Nyck de Vries | Edoardo Mortara |

---

### `sf` — Super Formula

**Category:** Open Wheel · Asia & Oceania

**Short description:**
The Japanese Super Formula Championship is Japan's premier single-seater series and one of the fastest formula racing championships in the world outside of Formula 1. All cars use an identical Dallara SF23 chassis, making it a pure driver skill contest between Honda and Toyota-powered entries.

**History:**
Japanese Formula racing traces back to 1973. Rebranded as "Super Formula" in 2013 to signal ambition beyond Japan's borders, the series has attracted international talent including Heikki Kovalainen, Loïc Duval, and Jenson Button in its earlier years, and more recently stars like Romain Grosjean and Stoffel Vandoorne. Identical aerodynamic specifications and a single tyre supplier (Yokohama) ensure extremely close racing. The 2026 season is the 54th edition, with Ayumu Iwasa (Team Mugen) as defending champion and a strong Toyota–Honda manufacturer battle at the heart of it.

---

### `wec` — FIA World Endurance Championship

**Category:** Endurance · Worldwide

**Short description:**
The FIA World Endurance Championship is the world's premier long-distance racing series, headlined by the 24 Hours of Le Mans. Races last between 6 and 24 hours, demanding extraordinary teamwork, strategy, and engineering across the Hypercar and LMGT3 classes.

**History:**
The current World Endurance Championship was established in 1981 and revived in its modern form in 2012 following the demise of the American Le Mans Series. After the original LMP1 Hybrid era defined by Audi, Porsche, and Toyota, a major reset introduced the more accessible Hypercar regulations from 2021. These proved transformative: by 2026, 14 manufacturers contest the Hypercar class — the largest manufacturer count in the history of the championship. Ferrari are the reigning champions, having dethroned Toyota in 2023. For 2026, Genesis joins the field while Porsche refocuses to IMSA and Formula E, maintaining a dynamic manufacturer landscape.

**Teams & Drivers — Hypercar class (2026)**

| Car # | Team | Manufacturer | Drivers |
|-------|------|-------------|---------|
| 7 | Toyota Gazoo Racing | Toyota | Mike Conway / Kamui Kobayashi / Nyck de Vries |
| 8 | Toyota Gazoo Racing | Toyota | Sébastien Buemi / Brendon Hartley / TBC |
| 15 | BMW M Team WRT | BMW | Kevin Magnussen / Raffaele Marciello / Dries Vanthoor |
| 17 | Genesis Magma Racing | Genesis | André Lotterer / Pipo Derani / Mathys Jaubert |
| 19 | Genesis Magma Racing | Genesis | Mathieu Jaminet / Paul-Loup Chatin / Daniel Juncadella |
| 20 | BMW M Team WRT | BMW | Robin Frijns / René Rast / Sheldon van der Linde |
| 35 | Alpine Endurance Team | Alpine | António Félix da Costa / TBC / TBC |
| 36 | Alpine Endurance Team | Alpine | Frédéric Makowiecki / TBC / TBC |
| 50 | Ferrari AF Corse | Ferrari | Antonio Fuoco / Miguel Molina / Nicklas Nielsen |
| 51 | Ferrari AF Corse | Ferrari | Alessandro Pier Guidi / James Calado / Antonio Giovinazzi |
| 83 | AF Corse (private) | Ferrari | Yifei Ye / TBC / TBC |
| 93 | Peugeot TotalEnergies | Peugeot | Paul di Resta / TBC / TBC |
| 94 | Peugeot TotalEnergies | Peugeot | Loïc Duval / TBC / TBC |
| 007 | Aston Martin THOR Team | Aston Martin | Harry Tincknell / Tom Gamble / Ross Gunn |
| 009 | Aston Martin THOR Team | Aston Martin | Alex Riberas / Marco Sørensen / Roman de Angelis |
| TBC | Cadillac Hertz Team Jota | Cadillac | Earl Bamber / Jack Aitken / Sébastien Bourdais |

> *Alpine and Peugeot driver trios not fully confirmed at time of writing — verify against the official FIA WEC entry list at fiawec.com before publishing. Porsche withdrew from Hypercar for 2026 (refocused on IMSA & Formula E).*

---

### `imsa` — IMSA WeatherTech SportsCar Championship

**Category:** Endurance · USA

**Short description:**
The IMSA WeatherTech SportsCar Championship is North America's premier sports car racing series, tracing its lineage to the 1971 IMSA GT Championship. The modern format blends sprint and endurance racing across 11 rounds, anchored by the Rolex 24 at Daytona.

**History:**
IMSA's roots lie in the International Motor Sports Association founded by John Bishop in 1969, running everything from tube-framed sportscars to stock cars on road courses. The modern WeatherTech era began in 2014 with the merger of the American Le Mans Series and Rolex Sports Car Series. The GTP class (Grand Touring Prototype), introduced in 2023, brought factory-backed Hypercar-derived prototypes from Acura, BMW, Cadillac, Porsche, and Aston Martin to American soil for the first time in decades. The 2026 season is the 56th IMSA-sanctioned championship, featuring 45 full-season entries across GTP, LMP2, LMP3, and GTD Pro/GTD classes.

---

### `wrc` — FIA World Rally Championship

**Category:** Rally · Worldwide

**Short description:**
The FIA World Rally Championship is the world's leading off-road racing series, contested over gravel, tarmac, snow, and ice across five continents. Competitors navigate closed public roads against the clock in specially built Rally1 cars, supported by co-drivers reading pace notes.

**History:**
The WRC was established in 1973 and has since produced legendary battles across Finland's forest stages, Kenya's rocky safari terrain, Monte Carlo's Alpine hairpins, and the Welsh valleys. The series has been won by icons including Walter Röhrl, Stig Blomqvist, Carlos Sainz, Tommi Mäkinen, Sébastien Loeb (9 titles), and Sébastien Ogier (9 titles). Hybrid Rally1 regulations introduced in 2022 brought a major technical reset, with Hyundai, Toyota, and M-Sport Ford as the three competing manufacturers. The 2026 season is the 54th edition and the final year of Rally1 regs before a further overhaul in 2027. Toyota hold a dominant lead in the Manufacturers' Championship with 14 rounds across Europe, Africa, South America, and Asia.

**Teams & Drivers (2026)**

| Team | Driver | Co-driver | Entry |
|------|--------|-----------|-------|
| **Toyota Gazoo Racing WRT** | Elfyn Evans | Scott Martin | Full season |
| Toyota Gazoo Racing WRT | Takamoto Katsuta | Aaron Johnston | Full season |
| Toyota Gazoo Racing WRT | Sami Pajari | Marko Salminen | Full season |
| Toyota Gazoo Racing WRT | Oliver Solberg | Elliott Edmondson | Full season |
| Toyota Gazoo Racing WRT | Sébastien Ogier | Vincent Landais | Partial (10 rounds) |
| **Hyundai Shell Mobis WRT** | Thierry Neuville | Martijn Wydaeghe | Full season |
| Hyundai Shell Mobis WRT | Adrien Fourmaux | Alexandre Coria | Full season |
| Hyundai Shell Mobis WRT | Dani Sordo | Cándido Carrera | Third car (shared) |
| Hyundai Shell Mobis WRT | Esapekka Lappi | Enni Mälkönen | Third car (shared) |
| Hyundai Shell Mobis WRT | Hayden Paddon | John Kennard | Third car (shared) |
| **M-Sport Ford WRT** | Josh McErlean | Eoin Treacy | Full season |
| M-Sport Ford WRT | Jon Armstrong | Shane Byrne | Full season |

---

### `indycar` — IndyCar Series

**Category:** Open Wheel · USA

**Short description:**
The NTT IndyCar Series is the premier open-wheel racing championship in North America, combining oval tracks, permanent road courses, and temporary street circuits in a single season. Its centrepiece, the Indianapolis 500, is among the oldest and most-watched single-day sporting events in the world.

**History:**
American open-wheel racing traces its roots to the inaugural Indianapolis 500 in 1911. The modern IndyCar era was shaped by the split between CART and the IRL in 1996, reunified as IndyCar in 2008. Today's spec Dallara DW12 chassis (and its successor) is powered by Honda or Chevrolet engines, with multiple manufacturer-supported efforts from Team Penske, Chip Ganassi Racing, Arrow McLaren, and Andretti Global among others. Álex Palou enters 2026 as a four-time champion (including a three-peat) and defending Indy 500 winner. The 2026 season is the 115th official championship and sees the return of Romain Grosjean and rookies Mick Schumacher, Caio Collet, and Dennis Hauger.

---

### `nascar` — NASCAR Cup Series

**Category:** Touring · USA

**Short description:**
The NASCAR Cup Series is the highest level of American stock car racing, run by the National Association for Stock Car Auto Racing. Over 36 races per season, teams representing Chevrolet, Ford, and Toyota battle across superspeedways, intermediate ovals, short tracks, and road courses — culminating in a playoff elimination format.

**History:**
NASCAR was founded by Bill France Sr. in 1948. Its cultural and commercial heartland is the American South, where Daytona Beach, Talladega, and Darlington became mythic venues. The sport grew into a national phenomenon through the 1990s and 2000s, with manufacturers Chevrolet, Ford, and Toyota dividing loyalties. The current Next Gen car debuted in 2022, homogenising platforms for closer on-track competition. Kyle Larson (Hendrick Motorsports) is the reigning champion heading into 2026. The season introduced a new playoff format reverting to the Chase bracket system, and added a street race at Naval Base Coronado (San Diego). Kyle Busch, a two-time champion, passed away in May during the 2026 season — the first active full-time driver to die mid-season since Dale Earnhardt in 2001.

---

### `motogp` — MotoGP World Championship

**Category:** Bike · Worldwide

**Short description:**
The FIM MotoGP World Championship is the premier class of Grand Prix motorcycle racing, contested on 1000cc prototype machines capable of speeds exceeding 350 km/h. Five manufacturers — Ducati, Aprilia, Honda, KTM, and Yamaha — field factory and satellite teams across 21 rounds on circuits worldwide.

**History:**
The FIM Road Racing World Championship was established in 1949, making it one of the longest-running motorsport series in existence. The 500cc two-stroke era produced legends like Giacomo Agostini (15 titles), Valentino Rossi (9 titles), and Mick Doohan before the switch to four-stroke MotoGP machinery in 2002. The 2026 season is the final one under 1000cc / Michelin regulations before switching to 850cc engines and Pirelli tyres in 2027. Ducati's dominance has been a defining storyline of the recent era; in 2026, Marc Marquez (nine world titles) joins Francesco Bagnaia at the factory Ducati team. A new "Harley-Davidson Bagger World Cup" support class debuts at selected European and North American rounds.

**Teams & Riders (2026)**

| Team | Manufacturer | Rider 1 | Rider 2 |
|------|-------------|---------|---------|
| Ducati Lenovo Team | Ducati | Marc Marquez | Francesco Bagnaia |
| Prima Pramac Yamaha | Yamaha | Toprak Razgatlıoğlu | Jack Miller |
| Gresini Racing | Ducati | Alex Márquez | Fermin Aldeguer |
| VR46 Racing Team | Ducati | Franco Morbidelli | Fabio Di Giannantonio |
| Aprilia Racing | Aprilia | Jorge Martín | Marco Bezzecchi |
| Trackhouse Racing | Aprilia | Raúl Fernández | Ai Ogura |
| Red Bull KTM Factory | KTM | Pedro Acosta | Brad Binder |
| Tech3 KTM | KTM | Maverick Viñales | Enea Bastianini |
| Monster Energy Yamaha | Yamaha | Fabio Quartararo | Alex Rins |
| Honda HRC | Honda | Luca Marini | Joan Mir |
| Castrol Honda LCR | Honda | Johann Zarco | Diogo Moreira |

> *Marco Bezzecchi leads the 2026 championship after early rounds. Grid uses 1000cc / Michelin regs for the final time — 850cc + Pirelli from 2027.*

---

### `wsbk` — Superbike World Championship (WorldSBK)

**Category:** Bike · Worldwide

**Short description:**
The Superbike World Championship (WorldSBK) is the world's premier production-based motorcycle racing series, using street-legal derived superbikes from five manufacturers rather than purpose-built prototypes. Three races per round — one long race on Saturday and two on Sunday — make for the most action-packed weekends in motorcycle racing.

**History:**
The Superbike World Championship was founded in 1988 and has been dominated at various eras by Kawasaki, Ducati, Honda, Aprilia, and BMW. Jonathan Rea (Kawasaki) held the record for most championships with six titles, before retiring ahead of 2026. Toprak Razgatlıoğlu, four-time champion and Rea's great rival of the early 2020s, has crossed to MotoGP with Prima Pramac Yamaha, leaving the field open. The 2026 season is the 39th edition, with 22 riders across 14 teams and manufacturers Ducati, BMW, Honda, Kawasaki, and Yamaha competing. Notable 2026 arrivals include Miguel Oliveira and Somkiat Chantra.

---

### `dtm` — Deutsche Tourenwagen Masters (DTM)

**Category:** GT / Sports Car · Europe

**Short description:**
The DTM is Germany's prestige GT racing series and one of Europe's most storied touring car championships, now contested entirely with GT3-specification cars. Eight different manufacturers are represented on a 21-car grid across eight weekend rounds at iconic German circuits.

**History:**
The original DTM ran from 1984 to 1996 as a genuine touring car championship with silhouette cars from Mercedes, Opel, and Alfa Romeo. It returned in 2000 as a manufacturer-spec series and became one of Europe's most-watched championships through the 2000s and 2010s. A second restructuring in 2021 transitioned the series to GT3 regulations under ADAC promotion, opening the door to a wide variety of manufacturers. The 2026 season is the 40th edition of the DTM, with entries from Mercedes-AMG, BMW, Porsche, Ferrari, Lamborghini, Aston Martin, Ford, and Audi.

---

### `btcc` — British Touring Car Championship (BTCC)

**Category:** Touring · Europe

**Short description:**
The Kwik Fit British Touring Car Championship is the UK's premier motorsport series, famous for close, contact-heavy racing across three-race weekends at circuits around England and Scotland. Running in its 69th season in 2026, it remains one of the world's longest-running domestic motorsport championships.

**History:**
The BTCC was established in 1958 and has been home to legends of British motorsport including Jim Clark, Andy Rouse, Touring Car icons like John Cleland and Rickard Rydell, and modern champions Matt Neal, Gordon Shedden, Colin Turkington, and Ash Sutton. The current Next Generation Touring Car (NGTC) technical specification, introduced in 2011, uses a standardised steel spaceframe with production-car body panels and a spec 2.0-litre turbocharged engine. 2026 introduces qualifying races on Saturdays and the removal of the hybrid boost system, replaced with turbo boost. Reigning champion Tom Ingram (Hyundai) heads the 21-car entry list.

---

### `supercars` — Supercars Championship

**Category:** Touring · Asia & Oceania

**Short description:**
The Repco Supercars Championship is Australia's premier motorsport series, featuring high-powered V8 touring cars racing at circuits across Australia and New Zealand. Its crown jewel, the Bathurst 1000, is one of the most celebrated endurance races in the world.

**History:**
The Australian Touring Car Championship began in 1960 and evolved through various technical formats before settling into the iconic "V8 Supercars" identity in the 1990s. The series has been shaped by intense rivalries between Ford and Holden/Chevrolet loyalists — a battle with deep cultural roots in Australia. The arrival of Toyota's GR Supra in 2026 marks a historic shift in the manufacturer landscape. Gen3 regulations (introduced in 2023) brought the current Ford Mustang and Chevrolet Camaro platforms. Chaz Mostert is the defending Drivers' Champion; 2026 sees a record 14 rounds and 37 races, from Auckland to Adelaide.

---

### `elms` — European Le Mans Series (ELMS)

**Category:** Endurance · Europe

**Short description:**
The European Le Mans Series is the official regional feeder championship to the FIA World Endurance Championship in Europe, contested over six 4-hour races at iconic European circuits. Competing in LMP2, LMP3, and LMGT3 classes, it is the most direct route to a 24 Hours of Le Mans invitation.

**History:**
The ELMS was founded in 2004 as the Le Mans Series and relaunched in its current form in 2013 under joint ACO and WEC Promoter management. It has served as a springboard for drivers who went on to race the 24 Hours of Le Mans, including many who later competed in the Hypercar class. The 2026 season features a record-breaking grid of 47 cars — the largest in ELMS history — across 11 LMP2, 12 LMP2 Pro/Am, 10 LMP3, and 14 LMGT3 entries.

---

### `gtwce` — GT World Challenge Europe (GTWCE)

**Category:** GT / Sports Car · Europe

**Short description:**
The GT World Challenge Europe Powered by AWS is Europe's premier GT3 racing series, combining a Sprint Cup (shorter races) and an Endurance Cup (longer races including the prestigious 24 Hours of Spa) into an overall championship. Organised by SRO Motorsports Group, it fields GT3 cars from up to ten manufacturers.

**History:**
The series traces its roots to the Blancpain GT Series (2011) and the older FIA GT Championship. SRO Motorsports Group restructured and rebranded it to the GT World Challenge brand in 2019, tying together European, American, Asian, and Australian championship legs. The 24 Hours of Spa-Francorchamps, which also counts for the IGTC, is the series' flagship event. Valentino Rossi, nine-time MotoGP world champion, has competed in GTWCE in recent seasons and returns for 2026. The 2026 season is the 13th edition of the GT World Challenge Europe, with ten manufacturers on a new split-session qualifying format.

---

### `gtwca` — GT World Challenge America (GTWCA)

**Category:** GT / Sports Car · USA

**Short description:**
The GT World Challenge America Powered by AWS is the leading GT3 series in North America, part of SRO Motorsports Group's global GT World Challenge network. In 2026, the format expanded to three-hour races at seven venues, blending sprint-race heritage with endurance-racing strategy.

**History:**
SRO brought its GT World Challenge brand to North America and built on over 35 years of continuous GT racing heritage in America. The series provides a professional pathway for GT3 teams and drivers looking to compete globally, with the Indianapolis 8 Hour also counting for the Intercontinental GT Challenge. The 2026 format change to three-hour races aligns the series more closely with European and global endurance traditions while retaining its identity as a driver-development and gentleman-driver platform.

---

### `nls` — Nürburgring Langstrecken-Serie (NLS)

**Category:** Endurance · Europe

**Short description:**
The ADAC RAVENOL Nürburgring Langstrecken-Serie is a long-distance endurance series held entirely on the legendary Nürburgring Nordschleife — the 20.8 km "Green Hell" — one of the world's most dangerous and revered racing circuits. With grids exceeding 130 cars, it is one of the most participatory motorsport series anywhere.

**History:**
The series, originally known as the VLN (Veranstaltergemeinschaft Langstreckenpokal Nürburgring), began in 1977 and celebrates its 50th season in 2026. For decades it has been the standard-bearer for grassroots endurance racing, open to everyone from factory GT3 squads to club-prepared road cars. The 24 Hours Nürburgring, the world's largest motorsport event by spectator attendance, sits outside the NLS series proper but uses the same circuit. International stars — including Max Verstappen, who competed in the 2026 NLS2 in the gap between the Chinese and Japanese GPs — regularly use NLS rounds as preparation for the 24-hour race.

---

### `igtc` — Intercontinental GT Challenge (IGTC)

**Category:** GT / Sports Car · Worldwide

**Short description:**
The Intercontinental GT Challenge is the world's only global GT3 racing series, linking five prestige endurance events on four continents — Australia, Europe, Asia, and North America — into a single manufacturers' championship. Only factory-supported GT3 cars from officially affiliated manufacturers are eligible for manufacturers' points.

**History:**
The IGTC was founded by SRO Motorsports Group in 2016, growing from the Blancpain GT Series Intercontinental Cup concept. The 2026 season is the 11th edition, featuring six manufacturers: BMW, Ferrari, Mercedes-AMG, Porsche, Chevrolet, and Ford (the latter two making their IGTC debuts). The five rounds in 2026 are: Bathurst 12 Hour (February), 24 Hours Nürburgring (May), 24 Hours Spa (June), Suzuka 1000km (September), and Indianapolis 8 Hour (October). The 24 Hours of Spa, which also counts for the GT World Challenge Europe, is the series' centrepiece.

---

### `tcr` — TCR World Tour

**Category:** Touring · Worldwide

**Short description:**
The FIA TCR World Tour is the global touring car series for TCR-specification front-wheel-drive touring cars, successor to the WTCR. Races take place at eight selected events worldwide, combining rounds from multiple regional TCR championships into a single international championship.

**History:**
The TCR concept was developed by Marcello Lotti and launched as the TCR International Series in 2015, providing a cost-effective alternative to the expensive DTM and WTCC. The concept spread rapidly to create regional series on every continent. The FIA's WTCR (World Touring Car Cup) adopted TCR regulations in 2018, and the TCR World Tour effectively replaced it from 2023 with FIA status added for 2024. The 2026 season is the fourth TCR World Tour edition, featuring manufacturers including Hyundai (BRC Racing), Honda (GOAT Racing / ALM Motorsport), Geely (Cyan Racing), Audi, and CUPRA.

---

### `erc` — European Rally Championship (ERC)

**Category:** Rally · Europe

**Short description:**
The FIA European Rally Championship is the oldest active motorsport championship in the world, in its 74th season in 2026. Contested over seven rounds on asphalt and gravel across Europe, it is the principal continental rally series for Rally2 (WRC2-equivalent) cars and a training ground for future WRC talent.

**History:**
The ERC was first held in 1953, predating even the World Rally Championship. For most of its history it ran as a loosely structured series awarding titles based on the best results from a calendar of national and international events. The modern era, following the merger with the Intercontinental Rally Challenge in 2013, brought a structured championship with live broadcasting and stronger commercial promotion. The 2026 season marks the series' 74th edition, featuring seven rounds in six countries. The Rally di Roma Capitale joins the WRC in 2027 after its 2026 ERC appearance.

---

### `h24eu` — 24H European Series

**Category:** Endurance · Europe

**Short description:**
The Michelin 24H Series European Series, organised by Creventic, is a grassroots endurance championship running 12-hour and 24-hour races at prestigious Grand Prix circuits across Europe. Open to GT cars, touring cars, and 24H-Spec prototypes, it bridges professional and gentleman driver racing in a single field.

**History:**
The 24H Series was founded by Creventic as an accessible alternative to the more exclusive ACO and SRO endurance championships, positioning itself as the entry point for teams and drivers aspiring to longer-format racing. The European series typically runs five rounds between March and September, with the 24 Hours of Barcelona serving as the traditional finale. The 2026 calendar adds the Nürburgring for the first time since 2022. The series is a unique democratising force in endurance racing — a 24-hour race at Paul Ricard or Spa is genuinely open to club-level outfits, not just factory teams.

---

## 6. Track SVG Map Status

50 SVGs present · **98 missing** (exact diff run against `calendar.json` vs `public/assets/track-maps/`). `tbc.svg` and `tbd.svg` are intentional placeholders and can be ignored.

### Priority 1 — F1 + multi-series (highest visibility)
| File | Used by |
|------|---------|
| `spa.svg` | WEC, ELMS, GTWCE, IGTC, h24eu — most-referenced missing track |
| `silverstone.svg` | F1, MotoGP, BTCC, ELMS |
| `monza.svg` | F1, GTWCE |
| `zandvoort.svg` | F1, F1A, DTM, GTWCE |
| `interlagos.svg` | F1, WEC |
| `red-bull-ring.svg` | F1, DTM |
| `baku.svg` | F1 |
| `singapore.svg` | F1 |
| `lusail.svg` | F1 Qatar |
| `yas-marina.svg` | F1 Abu Dhabi |
| `montreal.svg` | F1, F1A |
| `hungaroring.svg` | F1 |
| `le-mans.svg` | WEC, MotoGP |
| `fuji.svg` | WEC, SF |
| `bahrain.svg` | WEC |
| `misano.svg` | MotoGP, WSBK, GTWCE |
| `aragon.svg` | MotoGP, WSBK |
| `jerez.svg` | MotoGP, WSBK |

### Priority 2 — Series with 4+ missing tracks

**MotoGP:** `brno.svg` · `sachsenring.svg` · `mandalika.svg` · `sepang.svg` · `balaton.svg` · `valencia.svg` · `magny-cours.svg` · `estoril.svg`

**NASCAR:** `kansas.svg` · `bristol.svg` · `charlotte.svg` · `michigan.svg` · `nashville.svg` · `pocono.svg` · `iowa.svg` · `richmond.svg` · `newhampshire.svg` · `chicagoland.svg` · `northwilkesboro.svg` · `sandiego.svg` · `dover.svg`

**IndyCar / IMSA:** `indianapolis.svg` · `indianapolis-oval.svg` · `road-america.svg` · `road-atlanta.svg` · `watkins-glen.svg` · `detroit.svg` · `mosport.svg` · `laguna-seca.svg` · `gateway.svg` · `midohio.svg` · `milwaukee.svg` · `portland.svg` · `markham.svg` · `vir.svg`

**BTCC:** `brands-hatch.svg` · `snetterton.svg` · `oulton-park.svg` · `croft.svg` · `thruxton.svg` · `knockhill.svg`

**Supercars:** `perth.svg` · `darwin.svg` · `townsville.svg` · `ipswich.svg` · `tasmania.svg` · `sandown.svg` · `adelaide.svg` · `gold-coast.svg` · `the-bend.svg`

**DTM:** `lausitzring.svg` · `norisring.svg` · `oschersleben.svg` · `hockenheim.svg` · `nurburgring.svg` *(GP circuit — distinct from `nordschleife.svg`)*

### Priority 3 — Single-series / lower traffic

**Formula E:** `berlin.svg` · `sanya.svg` · `tokyo.svg` · `london.svg`

**Super Formula:** `autopolis.svg` · `sugo.svg`

**WSBK:** `cremona.svg` · `most.svg`

**WRC / ERC:** `canarias.svg` · `sardegna.svg` · `karlstad.svg` · `katowice.svg` · `fafe.svg` · `cordoba.svg` · `aberystwyth.svg` · `roma.svg` · `zlin.svg`

**GT series:** `road-atlanta.svg` *(GTWCA)* · `magny-cours.svg` *(GTWCE)*

**TCR:** `macau.svg` · `inje.svg` · `zhuzhou.svg` · `chengdu.svg` · `vila-real.svg`

**Other:** `mexico.svg` *(NASCAR — note: F1 uses `mexico-city.svg` which already exists)* · `singapore.svg` · `brno.svg` · `sugo.svg`

---

## 7. Implementation Checklist

- [ ] Create `src/pages/series/[slug].astro` with static paths for all 22 series
- [ ] Create `data/seriesContent.json` with descriptions, history, teams (or embed in the Astro page)
- [ ] Make EventRow `.tag` pills into links to `/series/[slug]`
- [ ] Add "SERIES" to `Nav.astro`
- [ ] Create `src/pages/series/index.astro` (series grid page)
- [ ] Add "About →" link to each Dashboard card
- [ ] Update `sitemap.xml` with new series URLs
- [ ] Pre-filter the calendar on series pages (pass `seriesFilter` prop or use URL param)
- [ ] Verify all team/driver data before publishing (especially F1, WEC, MotoGP — lineups still in flux mid-season)
- [ ] Cross-reference track SVG map list against calendar and prioritise missing ones

---

*Last updated: June 2026. Series content based on 2026 season research; verify team/driver details before publishing as lineups evolve mid-season.*

// =============================================
// SERIES DATA (for countdown timers)
// =============================================
const seriesData = {
    f1: [
        { name: "AUSTRALIA", date: "2026-03-08T05:00:00+01:00" },
        { name: "CHINA", date: "2026-03-15T08:00:00+01:00" },
        { name: "JAPAN", date: "2026-03-29T07:00:00+02:00" },
        { name: "BAHRAIN", date: "2026-04-12T17:00:00+02:00" },
        { name: "SAUDI ARABIA", date: "2026-04-19T19:00:00+02:00" },
        { name: "MIAMI", date: "2026-05-03T22:00:00+02:00" },
        { name: "CANADA", date: "2026-05-24T22:00:00+02:00" },
        { name: "MONACO", date: "2026-06-07T15:00:00+02:00" },
        { name: "SPAIN (BARCELONA)", date: "2026-06-14T15:00:00+02:00" },
        { name: "AUSTRIA", date: "2026-06-28T15:00:00+02:00" },
        { name: "BRITISH", date: "2026-07-05T16:00:00+02:00" },
        { name: "BELGIUM", date: "2026-07-19T15:00:00+02:00" },
        { name: "HUNGARY", date: "2026-07-26T15:00:00+02:00" },
        { name: "DUTCH", date: "2026-08-23T15:00:00+02:00" },
        { name: "ITALY", date: "2026-09-06T15:00:00+02:00" },
        { name: "SPAIN (MADRID)", date: "2026-09-13T15:00:00+02:00" },
        { name: "AZERBAIJAN", date: "2026-09-27T13:00:00+02:00" },
        { name: "SINGAPORE", date: "2026-10-11T14:00:00+02:00" },
        { name: "USA (AUSTIN)", date: "2026-10-25T21:00:00+01:00" },
        { name: "MEXICO CITY", date: "2026-11-01T21:00:00+01:00" },
        { name: "BRAZIL", date: "2026-11-08T18:00:00+01:00" },
        { name: "LAS VEGAS", date: "2026-11-22T05:00:00+01:00" },
        { name: "QATAR", date: "2026-11-29T17:00:00+01:00" },
        { name: "ABU DHABI", date: "2026-12-06T14:00:00+01:00" }
    ],
    f1a: [
        { name: "CHINA", date: "2026-03-15T08:00:00+01:00" },
        { name: "JEDDAH", date: "2026-04-19T19:00:00+02:00" },
        { name: "MIAMI", date: "2026-05-03T22:00:00+02:00" },
        { name: "CANADA", date: "2026-05-24T22:00:00+02:00" },
        { name: "ZANDVOORT", date: "2026-08-23T15:00:00+02:00" },
        { name: "USA (AUSTIN)", date: "2026-10-25T21:00:00+01:00" },
        { name: "LAS VEGAS", date: "2026-11-22T05:00:00+01:00" }
    ],
    fe: [
        { name: "MIAMI", date: "2026-01-31T20:00:00+01:00" },
        { name: "JEDDAH", date: "2026-02-14T18:00:00+01:00" },
        { name: "MADRID", date: "2026-03-21T15:00:00+01:00" },
        { name: "BERLIN", date: "2026-05-03T15:00:00+02:00" },
        { name: "MONACO", date: "2026-05-17T15:00:00+02:00" },
        { name: "SANYA", date: "2026-06-20T09:00:00+02:00" },
        { name: "SHANGHAI", date: "2026-07-05T09:00:00+02:00" },
        { name: "TOKYO", date: "2026-07-26T07:00:00+02:00" },
        { name: "LONDON", date: "2026-08-16T18:00:00+02:00" }
    ],
    sf: [
        { name: "MOTEGI", date: "2026-04-05T07:00:00+02:00" },
        { name: "AUTOPOLIS", date: "2026-04-26T07:00:00+02:00" },
        { name: "SUZUKA", date: "2026-05-24T07:00:00+02:00" },
        { name: "FUJI", date: "2026-07-19T07:00:00+02:00" },
        { name: "SUGO", date: "2026-08-09T07:00:00+02:00" },
        { name: "FUJI FINALE", date: "2026-10-11T07:00:00+02:00" },
        { name: "SUZUKA FINALE", date: "2026-11-22T06:00:00+01:00" }
    ],
    wec: [
        { name: "IMOLA 6H", date: "2026-04-19T13:00:00+02:00" },
        { name: "SPA 6H", date: "2026-05-09T13:00:00+02:00" },
        { name: "LE MANS 24H", date: "2026-06-14T16:00:00+02:00" },
        { name: "SAO PAULO 6H", date: "2026-07-12T17:00:00+02:00" },
        { name: "LONE STAR (COTA)", date: "2026-09-06T20:00:00+02:00" },
        { name: "FUJI 6H", date: "2026-09-27T04:00:00+02:00" },
        { name: "BAHRAIN 8H", date: "2026-11-07T12:00:00+01:00" }
    ],
    imsa: [
        { name: "ROLEX 24", date: "2026-01-25T19:40:00+01:00" },
        { name: "SEBRING 12H", date: "2026-03-21T15:40:00+01:00" },
        { name: "LONG BEACH", date: "2026-04-18T22:30:00+02:00" },
        { name: "LAGUNA SECA", date: "2026-05-03T21:10:00+02:00" },
        { name: "DETROIT", date: "2026-05-30T21:00:00+02:00" },
        { name: "WATKINS GLEN 6H", date: "2026-06-28T16:40:00+02:00" },
        { name: "MOSPORT", date: "2026-07-12T18:00:00+02:00" },
        { name: "ROAD AMERICA", date: "2026-08-02T17:00:00+02:00" },
        { name: "VIR", date: "2026-08-23T18:00:00+02:00" },
        { name: "INDIANAPOLIS", date: "2026-09-20T18:00:00+02:00" },
        { name: "PETIT LE MANS", date: "2026-10-03T17:40:00+02:00" }
    ],
    wrc: [
        { name: "MONTE-CARLO", date: "2026-01-25T14:00:00+01:00" },
        { name: "SWEDEN", date: "2026-02-15T14:00:00+01:00" },
        { name: "KENYA", date: "2026-03-15T14:00:00+01:00" },
        { name: "CROATIA", date: "2026-04-12T14:00:00+02:00" },
        { name: "CANARIAS", date: "2026-04-26T14:00:00+02:00" },
        { name: "PORTUGAL", date: "2026-05-10T14:00:00+02:00" },
        { name: "JAPAN", date: "2026-05-31T14:00:00+02:00" },
        { name: "GREECE", date: "2026-06-28T14:00:00+02:00" },
        { name: "ESTONIA", date: "2026-07-19T14:00:00+02:00" },
        { name: "FINLAND", date: "2026-08-02T14:00:00+02:00" },
        { name: "PARAGUAY", date: "2026-08-30T14:00:00+02:00" },
        { name: "CHILE", date: "2026-09-13T14:00:00+02:00" },
        { name: "SARDINIA", date: "2026-10-04T14:00:00+02:00" },
        { name: "SAUDI ARABIA", date: "2026-11-14T14:00:00+01:00" }
    ],
    indycar: [
        { name: "ST. PETERSBURG", date: "2026-03-01T18:00:00+01:00" },
        { name: "PHOENIX", date: "2026-03-07T21:00:00+01:00" },
        { name: "ARLINGTON", date: "2026-03-15T17:30:00+01:00" },
        { name: "BARBER", date: "2026-03-29T19:00:00+02:00" },
        { name: "LONG BEACH", date: "2026-04-19T23:30:00+02:00" },
        { name: "IMS ROAD COURSE", date: "2026-05-09T21:00:00+02:00" },
        { name: "INDIANAPOLIS 500", date: "2026-05-24T18:45:00+02:00" },
        { name: "DETROIT", date: "2026-05-31T18:30:00+02:00" },
        { name: "WWT RACEWAY", date: "2026-06-07T21:00:00+02:00" },
        { name: "ROAD AMERICA", date: "2026-06-20T20:00:00+02:00" },
        { name: "MID-OHIO", date: "2026-07-04T20:00:00+02:00" },
        { name: "NASHVILLE", date: "2026-07-19T22:00:00+02:00" },
        { name: "PORTLAND", date: "2026-08-09T22:00:00+02:00" },
        { name: "MARKHAM", date: "2026-08-16T18:00:00+02:00" },
        { name: "MILWAUKEE", date: "2026-08-29T20:30:00+02:00" },
        { name: "LAGUNA SECA", date: "2026-09-06T20:30:00+02:00" }
    ],
    nascar: [
        { name: "DAYTONA 500", date: "2026-02-15T20:30:00+01:00" },
        { name: "ATLANTA", date: "2026-02-22T21:00:00+01:00" },
        { name: "COTA", date: "2026-03-01T21:30:00+01:00" },
        { name: "PHOENIX", date: "2026-03-07T21:30:00+01:00" },
        { name: "LAS VEGAS", date: "2026-03-15T21:00:00+01:00" },
        { name: "HOMESTEAD", date: "2026-03-22T20:00:00+01:00" },
        { name: "BRISTOL (DIRT)", date: "2026-03-29T21:30:00+02:00" },
        { name: "MARTINSVILLE", date: "2026-04-12T21:00:00+02:00" },
        { name: "TALLADEGA", date: "2026-04-19T21:00:00+02:00" },
        { name: "DOVER", date: "2026-04-26T21:00:00+02:00" },
        { name: "KANSAS", date: "2026-05-03T21:00:00+02:00" },
        { name: "DARLINGTON", date: "2026-05-10T21:00:00+02:00" },
        { name: "COCA-COLA 600", date: "2026-05-25T00:00:00+02:00" },
        { name: "NASHVILLE", date: "2026-06-01T01:00:00+02:00" },
        { name: "MICHIGAN", date: "2026-06-07T21:00:00+02:00" },
        { name: "POCONO", date: "2026-06-14T21:00:00+02:00" },
        { name: "SAN DIEGO", date: "2026-06-21T22:00:00+02:00" },
        { name: "SONOMA", date: "2026-06-28T21:30:00+02:00" },
        { name: "CHICAGOLAND", date: "2026-07-06T00:00:00+02:00" },
        { name: "ATLANTA II", date: "2026-07-13T01:00:00+02:00" },
        { name: "N. WILKESBORO", date: "2026-07-20T01:00:00+02:00" },
        { name: "INDIANAPOLIS", date: "2026-07-26T20:00:00+02:00" },
        { name: "IOWA", date: "2026-08-09T21:30:00+02:00" },
        { name: "RICHMOND", date: "2026-08-16T01:00:00+02:00" },
        { name: "NEW HAMPSHIRE", date: "2026-08-23T21:00:00+02:00" },
        { name: "DAYTONA II", date: "2026-08-30T01:30:00+02:00" },
        { name: "DARLINGTON (PLAYOFF)", date: "2026-09-06T23:00:00+02:00" },
        { name: "BRISTOL (PLAYOFF)", date: "2026-09-14T01:30:00+02:00" },
        { name: "PLAYOFF R3", date: "2026-09-20T21:00:00+02:00" },
        { name: "PLAYOFF R4", date: "2026-09-27T21:00:00+02:00" },
        { name: "PLAYOFF R5", date: "2026-10-04T21:00:00+02:00" },
        { name: "PLAYOFF R6", date: "2026-10-11T21:00:00+02:00" },
        { name: "CHAMPIONSHIP", date: "2026-11-08T21:00:00+01:00" }
    ]
};

// Pre-cache timestamps for countdown performance
for (const list of Object.values(seriesData)) {
    for (const race of list) {
        race._ts = new Date(race.date).getTime();
    }
}

// =============================================
// CALENDAR DATA (all events by month/week)
// =============================================
const calendarData = [
    {
        month: "JANUARY", weeks: [
            {
                label: "WEEK 04 \u2022 JAN 22-25", events: [
                    { series: "wrc", tag: "WRC", title: "Rallye Monte-Carlo", time: "THU > SUN", track: "montecarlo-wrc.svg" },
                    { series: "imsa", tag: "IMSA", title: "Rolex 24 at Daytona", time: 'SAT <span class="hl">19:40</span> > SUN <span class="hl">19:40</span>', track: "daytona_imsa.svg" }
                ]
            },
            {
                label: "WEEK 05 \u2022 JAN 31", events: [
                    { series: "fe", tag: "FORMULA E", title: "Miami E-Prix", time: 'RACE: <span class="hl">TBC</span>', track: "miami-fe.svg" }
                ]
            }
        ]
    },
    {
        month: "FEBRUARY", weeks: [
            {
                label: "WEEK 07 \u2022 FEB 12-15", events: [
                    { series: "wrc", tag: "WRC", title: "Rally Sweden", time: "THU > SUN", track: "sweden-wrc.svg" },
                    { series: "fe", tag: "FORMULA E", title: "Jeddah E-Prix", time: 'R1 & R2: <span class="hl">TBC</span>', track: "jeddah-fe.svg" },
                    { series: "nascar", tag: "NASCAR", title: "Daytona 500", time: 'RACE: <span class="hl">20:30</span>', track: "daytona-nascar.svg" }
                ]
            },
            {
                label: "WEEK 08 \u2022 FEB 22", events: [
                    { series: "nascar", tag: "NASCAR", title: "Atlanta Motor Speedway", time: 'RACE: <span class="hl">21:00</span>', track: "atlanta-nascar.svg" }
                ]
            }
        ]
    },
    {
        month: "MARCH", weeks: [
            {
                label: "WEEK 09 \u2022 MAR 01", events: [
                    { series: "indycar", tag: "INDYCAR", title: "Streets of St. Petersburg", time: 'RACE: <span class="hl">TBC</span>', track: "stpetersburg-indycar.svg" },
                    { series: "nascar", tag: "NASCAR", title: "EchoPark GP (COTA)", time: 'RACE: <span class="hl">TBC</span>', track: "cota-nascar.svg" }
                ]
            },
            {
                label: "WEEK 10 \u2022 MAR 06-08", events: [
                    {
                        series: "f1", tag: "FORMULA 1", title: "Australian GP",
                        time: 'QUALI: <span class="hl">06:00</span> \u2022 RACE: <span class="hl">05:00</span>',
                        track: "australia-f1.svg",
                        sub: [{ badge: "f2", label: "F2", detail: "RACES: TBC" }, { badge: "f3", label: "F3", detail: "RACES: TBC" }]
                    },
                    { series: "indycar", tag: "INDYCAR", title: "Phoenix Grand Prix", time: 'RACE: <span class="hl">TBC</span>', track: "phoenix-indycar.svg" },
                    { series: "nascar", tag: "NASCAR", title: "Phoenix Raceway", time: 'RACE: <span class="hl">TBC</span>', track: "phoenix-nascar.svg" }
                ]
            },
            {
                label: "WEEK 11 \u2022 MAR 12-15", events: [
                    { series: "wrc", tag: "WRC", title: "Safari Rally Kenya", time: "THU > SUN", track: "kenya-wrc.svg" },
                    {
                        series: "f1", tag: "FORMULA 1", title: "Chinese GP", sprint: true,
                        time: 'SPRINT: <span class="hl">04:00</span> \u2022 QUALI: <span class="hl">08:00</span> \u2022 RACE: <span class="hl">08:00</span>',
                        track: "china-f1.svg"
                    },
                    { series: "f1a", tag: "F1 ACADEMY", title: "Rd 1: China", time: 'RACES: <span class="hl">TBC</span>', track: "china-f1.svg" },
                    { series: "indycar", tag: "INDYCAR", title: "Streets of Arlington", time: 'RACE: <span class="hl">TBC</span>', track: "arlington-indycar.svg" },
                    { series: "nascar", tag: "NASCAR", title: "Pennzoil 400 (Las Vegas)", time: 'RACE: <span class="hl">TBC</span>', track: "lasvegas-nascar.svg" }
                ]
            },
            {
                label: "WEEK 12 \u2022 MAR 21-22", events: [
                    { series: "fe", tag: "FORMULA E", title: "Madrid E-Prix", time: 'RACE: <span class="hl">TBC</span>', track: "madrid-fe.svg" },
                    { series: "imsa", tag: "IMSA", title: "12 Hours of Sebring", time: 'RACE: <span class="hl">15:40</span>', track: "sebring-imsa.svg" },
                    { series: "nascar", tag: "NASCAR", title: "Dixie Vodka 400 (Homestead)", time: 'RACE: <span class="hl">TBC</span>', track: "homestead-nascar.svg" }
                ]
            },
            {
                label: "WEEK 13 \u2022 MAR 27-29", events: [
                    {
                        series: "f1", tag: "FORMULA 1", title: "Japanese GP",
                        time: 'QUALI: <span class="hl">07:00</span> \u2022 RACE: <span class="hl">07:00</span>',
                        track: "suzuka-f1.svg"
                    },
                    { series: "indycar", tag: "INDYCAR", title: "Honda Indy GP of Alabama", time: 'RACE: <span class="hl">TBC</span>', track: "barber-indycar.svg" },
                    { series: "nascar", tag: "NASCAR", title: "Food City Dirt Race (Bristol)", time: 'RACE: <span class="hl">TBC</span>', track: "bristol-nascar.svg" }
                ]
            }
        ]
    },
    {
        month: "APRIL", weeks: [
            {
                label: "WEEK 14 \u2022 APR 04-05", events: [
                    { series: "sf", tag: "S. FORMULA", title: "Motegi", time: 'RACE: <span class="hl">TBC</span>', track: "motegi-sf.svg" }
                ]
            },
            {
                label: "WEEK 15 \u2022 APR 09-12", events: [
                    { series: "wrc", tag: "WRC", title: "Croatia Rally", time: "THU > SUN", track: "croatia-wrc.svg" },
                    {
                        series: "f1", tag: "FORMULA 1", title: "Bahrain GP",
                        time: 'QUALI: <span class="hl">17:00</span> \u2022 RACE: <span class="hl">17:00</span>',
                        track: "bahrain-f1.svg",
                        sub: [{ badge: "f2", label: "F2", detail: "RACES: TBC" }, { badge: "f3", label: "F3", detail: "RACES: TBC" }]
                    },
                    { series: "nascar", tag: "NASCAR", title: "Cook Out 400 (Martinsville)", time: 'RACE: <span class="hl">TBC</span>', track: "martinsville-nascar.svg" }
                ]
            },
            {
                label: "WEEK 16 \u2022 APR 17-19", events: [
                    {
                        series: "f1", tag: "FORMULA 1", title: "Saudi Arabian GP",
                        time: 'QUALI: <span class="hl">19:00</span> \u2022 RACE: <span class="hl">19:00</span>',
                        track: "jeddah-f1.svg",
                        sub: [{ badge: "f2", label: "F2", detail: "RACES: TBC" }, { badge: "f1a", label: "F1A", detail: "RACES: TBC" }]
                    },
                    { series: "indycar", tag: "INDYCAR", title: "Acura GP of Long Beach", time: 'RACE: <span class="hl">TBC</span>', track: "longbeach-indycar.svg" },
                    { series: "imsa", tag: "IMSA", title: "Grand Prix of Long Beach", time: 'RACE: <span class="hl">TBC</span>', track: "longbeach-imsa.svg" },
                    { series: "wec", tag: "WEC", title: "6 Hours of Imola", time: 'RACE: <span class="hl">TBC</span>', track: "imola-wec.svg" },
                    { series: "nascar", tag: "NASCAR", title: "GEICO 500 (Talladega)", time: 'RACE: <span class="hl">TBC</span>', track: "talladega-nascar.svg" }
                ]
            },
            {
                label: "WEEK 17 \u2022 APR 23-26", events: [
                    { series: "wrc", tag: "WRC", title: "Rally Islas Canarias", time: "THU > SUN", track: "canarias-wrc.svg" },
                    { series: "sf", tag: "S. FORMULA", title: "Autopolis", time: 'RACE: <span class="hl">TBC</span>', track: "autopolis-sf.svg" },
                    { series: "nascar", tag: "NASCAR", title: "W\u00fcrth 400 (Dover)", time: 'RACE: <span class="hl">TBC</span>', track: "dover-nascar.svg" }
                ]
            }
        ]
    },
    {
        month: "MAY", weeks: [
            {
                label: "WEEK 18 \u2022 MAY 01-03", events: [
                    {
                        series: "f1", tag: "FORMULA 1", title: "Miami GP", sprint: true,
                        time: 'SPRINT: <span class="hl">18:00</span> \u2022 QUALI: <span class="hl">22:00</span> \u2022 RACE: <span class="hl">22:00</span>',
                        track: "miami-f1.svg"
                    },
                    { series: "fe", tag: "FORMULA E", title: "Berlin E-Prix", time: 'R1 & R2: <span class="hl">TBC</span>', track: "berlin-fe.svg" },
                    { series: "imsa", tag: "IMSA", title: "Monterey Sportscar Champ.", time: 'RACE: <span class="hl">TBC</span>', track: "lagunaseca-imsa.svg" },
                    { series: "nascar", tag: "NASCAR", title: "AdventHealth 400 (Kansas)", time: 'RACE: <span class="hl">TBC</span>', track: "kansas-nascar.svg" }
                ]
            },
            {
                label: "WEEK 19 \u2022 MAY 07-10", events: [
                    { series: "wrc", tag: "WRC", title: "Rally de Portugal", time: "THU > SUN", track: "portugal-wrc.svg" },
                    { series: "wec", tag: "WEC", title: "6 Hours of Spa", time: 'RACE: <span class="hl">TBC</span>', track: "spa-wec.svg" },
                    { series: "indycar", tag: "INDYCAR", title: "GMR Grand Prix (IMS Road)", time: 'RACE: <span class="hl">TBC</span>', track: "indianapolis-indycar.svg" },
                    { series: "nascar", tag: "NASCAR", title: "Goodyear 400 (Darlington)", time: 'RACE: <span class="hl">TBC</span>', track: "darlington-nascar.svg" }
                ]
            },
            {
                label: "WEEK 20 \u2022 MAY 16-17", events: [
                    { series: "fe", tag: "FORMULA E", title: "Monaco E-Prix", time: 'R1 & R2: <span class="hl">TBC</span>', track: "monaco-fe.svg" }
                ]
            },
            {
                label: "WEEK 21 \u2022 MAY 22-24", events: [
                    {
                        series: "f1", tag: "FORMULA 1", title: "Canadian GP", sprint: true,
                        time: 'SPRINT: <span class="hl">18:00</span> \u2022 QUALI: <span class="hl">22:00</span> \u2022 RACE: <span class="hl">22:00</span>',
                        track: "canada-f1.svg"
                    },
                    { series: "f1a", tag: "F1 ACADEMY", title: "Rd 3: Canada", time: 'RACES: <span class="hl">TBC</span>', track: "canada-f1.svg" },
                    { series: "indycar", tag: "INDYCAR", title: "Indianapolis 500", time: 'RACE: <span class="hl">18:45</span>', track: "indy500-indycar.svg" },
                    { series: "sf", tag: "S. FORMULA", title: "Suzuka", time: 'RACE: <span class="hl">TBC</span>', track: "suzuka-sf.svg" },
                    { series: "nascar", tag: "NASCAR", title: "Coca-Cola 600 (Charlotte)", time: 'RACE: <span class="hl">00:00</span>', track: "charlotte-nascar.svg" }
                ]
            },
            {
                label: "WEEK 22 \u2022 MAY 28-31", events: [
                    { series: "wrc", tag: "WRC", title: "Rally Japan", time: "THU > SUN", track: "japan-wrc.svg" },
                    { series: "indycar", tag: "INDYCAR", title: "Chevrolet Detroit GP", time: 'RACE: <span class="hl">TBC</span>', track: "detroit-indycar.svg" },
                    { series: "imsa", tag: "IMSA", title: "Detroit Sports Car Classic", time: 'RACE: <span class="hl">TBC</span>', track: "detroit-imsa.svg" },
                    { series: "nascar", tag: "NASCAR", title: "Nashville Superspeedway", time: 'RACE: <span class="hl">TBC</span>', track: "nashville-nascar.svg" }
                ]
            }
        ]
    },
    {
        month: "JUNE", weeks: [
            {
                label: "WEEK 23 \u2022 JUN 05-07", events: [
                    {
                        series: "f1", tag: "FORMULA 1", title: "Monaco GP",
                        time: 'QUALI: <span class="hl">15:00</span> \u2022 RACE: <span class="hl">15:00</span>',
                        track: "monaco-f1.svg",
                        sub: [{ badge: "f2", label: "F2", detail: "RACES: TBC" }, { badge: "f3", label: "F3", detail: "RACES: TBC" }]
                    },
                    { series: "indycar", tag: "INDYCAR", title: "Bommarito 500 (WWT Raceway)", time: 'RACE: <span class="hl">TBC</span>', track: "gateway-indycar.svg" },
                    { series: "nascar", tag: "NASCAR", title: "FireKeepers Casino 400 (Michigan)", time: 'RACE: <span class="hl">TBC</span>', track: "michigan-nascar.svg" }
                ]
            },
            {
                label: "WEEK 24 \u2022 JUN 12-14", events: [
                    {
                        series: "f1", tag: "FORMULA 1", title: "Spanish GP (Barcelona)",
                        time: 'QUALI: <span class="hl">15:00</span> \u2022 RACE: <span class="hl">15:00</span>',
                        track: "barcelona-f1.svg",
                        sub: [{ badge: "f2", label: "F2", detail: "RACES: TBC" }, { badge: "f3", label: "F3", detail: "RACES: TBC" }]
                    },
                    { series: "wec", tag: "WEC", title: "24 Hours of Le Mans", time: 'SAT <span class="hl">16:00</span> > SUN <span class="hl">16:00</span>', track: "lemans-wec.svg" },
                    { series: "nascar", tag: "NASCAR", title: "HighPoint.com 400 (Pocono)", time: 'RACE: <span class="hl">TBC</span>', track: "pocono-nascar.svg" }
                ]
            },
            {
                label: "WEEK 25 \u2022 JUN 20-21", events: [
                    { series: "fe", tag: "FORMULA E", title: "Sanya E-Prix", time: 'RACE: <span class="hl">TBC</span>', track: "sanya-fe.svg" },
                    { series: "indycar", tag: "INDYCAR", title: "Road America (R1 & R2)", time: 'SAT + SUN: <span class="hl">TBC</span>', track: "roadamerica-indycar.svg" },
                    { series: "nascar", tag: "NASCAR", title: "San Diego Street Race", time: 'RACE: <span class="hl">TBC</span>', track: "sandiego-nascar.svg" }
                ]
            },
            {
                label: "WEEK 26 \u2022 JUN 25-28", events: [
                    { series: "wrc", tag: "WRC", title: "Acropolis Rally Greece", time: "THU > SUN", track: "greece-wrc.svg" },
                    {
                        series: "f1", tag: "FORMULA 1", title: "Austrian GP",
                        time: 'QUALI: <span class="hl">15:00</span> \u2022 RACE: <span class="hl">15:00</span>',
                        track: "austria-f1.svg",
                        sub: [{ badge: "f2", label: "F2", detail: "RACES: TBC" }, { badge: "f3", label: "F3", detail: "RACES: TBC" }]
                    },
                    { series: "imsa", tag: "IMSA", title: "6 Hours of Watkins Glen", time: 'RACE: <span class="hl">TBC</span>', track: "watkinsglen-imsa.svg" },
                    { series: "nascar", tag: "NASCAR", title: "Toyota/Save Mart 350 (Sonoma)", time: 'RACE: <span class="hl">TBC</span>', track: "sonoma-nascar.svg" }
                ]
            }
        ]
    },
    {
        month: "JULY", weeks: [
            {
                label: "WEEK 27 \u2022 JUL 03-05", events: [
                    {
                        series: "f1", tag: "FORMULA 1", title: "British GP", sprint: true,
                        time: 'SPRINT: <span class="hl">13:00</span> \u2022 QUALI: <span class="hl">16:00</span> \u2022 RACE: <span class="hl">16:00</span>',
                        track: "silverstone-f1.svg",
                        sub: [{ badge: "f2", label: "F2", detail: "RACES: TBC" }, { badge: "f3", label: "F3", detail: "RACES: TBC" }, { badge: "f1a", label: "F1A", detail: "RACES: TBC" }]
                    },
                    { series: "fe", tag: "FORMULA E", title: "Shanghai E-Prix", time: 'R1 & R2: <span class="hl">TBC</span>', track: "shanghai-fe.svg" },
                    { series: "indycar", tag: "INDYCAR", title: "Mid-Ohio (R1 & R2)", time: 'SAT + SUN: <span class="hl">TBC</span>', track: "midohio-indycar.svg" },
                    { series: "nascar", tag: "NASCAR", title: "Chicagoland Speedway", time: 'RACE: <span class="hl">TBC</span>', track: "chicagoland-nascar.svg" }
                ]
            },
            {
                label: "WEEK 28 \u2022 JUL 12", events: [
                    { series: "wec", tag: "WEC", title: "6 Hours of S\u00e3o Paulo", time: 'RACE: <span class="hl">TBC</span>', track: "interlagos-wec.svg" },
                    { series: "imsa", tag: "IMSA", title: "Chevrolet Grand Prix (Mosport)", time: 'RACE: <span class="hl">TBC</span>', track: "mosport-imsa.svg" },
                    { series: "nascar", tag: "NASCAR", title: "EchoPark 400 (Atlanta)", time: 'RACE: <span class="hl">TBC</span>', track: "atlanta-nascar.svg" }
                ]
            },
            {
                label: "WEEK 29 \u2022 JUL 16-19", events: [
                    { series: "wrc", tag: "WRC", title: "Rally Estonia", time: "THU > SUN", track: "estonia-wrc.svg" },
                    {
                        series: "f1", tag: "FORMULA 1", title: "Belgian GP",
                        time: 'QUALI: <span class="hl">15:00</span> \u2022 RACE: <span class="hl">15:00</span>',
                        track: "spa-f1.svg",
                        sub: [{ badge: "f2", label: "F2", detail: "RACES: TBC" }, { badge: "f3", label: "F3", detail: "RACES: TBC" }]
                    },
                    { series: "sf", tag: "S. FORMULA", title: "Fuji", time: 'RACE: <span class="hl">TBC</span>', track: "fuji-sf.svg" },
                    { series: "indycar", tag: "INDYCAR", title: "Music City GP (Nashville)", time: 'RACE: <span class="hl">TBC</span>', track: "nashville-indycar.svg" },
                    { series: "nascar", tag: "NASCAR", title: "North Wilkesboro Speedway", time: 'RACE: <span class="hl">TBC</span>', track: "northwilkesboro-nascar.svg" }
                ]
            },
            {
                label: "WEEK 30 \u2022 JUL 24-26", events: [
                    {
                        series: "f1", tag: "FORMULA 1", title: "Hungarian GP",
                        time: 'QUALI: <span class="hl">15:00</span> \u2022 RACE: <span class="hl">15:00</span>',
                        track: "hungary-f1.svg",
                        sub: [{ badge: "f2", label: "F2", detail: "RACES: TBC" }, { badge: "f3", label: "F3", detail: "RACES: TBC" }]
                    },
                    { series: "fe", tag: "FORMULA E", title: "Tokyo E-Prix", time: 'R1 & R2: <span class="hl">TBC</span>', track: "tokyo-fe.svg" },
                    { series: "nascar", tag: "NASCAR", title: "Brickyard 400 (Indianapolis)", time: 'RACE: <span class="hl">TBC</span>', track: "indianapolis-nascar.svg" }
                ]
            },
            {
                label: "WEEK 31 \u2022 JUL 30 - AUG 02", events: [
                    { series: "wrc", tag: "WRC", title: "Rally Finland", time: "THU > SUN", track: "finland-wrc.svg" },
                    { series: "imsa", tag: "IMSA", title: "6 Hours of Road America", time: 'RACE: <span class="hl">TBC</span>', track: "roadamerica-imsa.svg" }
                ]
            }
        ]
    },
    {
        month: "AUGUST", weeks: [
            {
                label: "WEEK 32 \u2022 AUG 08-09", events: [
                    { series: "sf", tag: "S. FORMULA", title: "Sugo", time: 'RACE: <span class="hl">TBC</span>', track: "sugo-sf.svg" },
                    { series: "indycar", tag: "INDYCAR", title: "GP of Portland", time: 'RACE: <span class="hl">TBC</span>', track: "portland-indycar.svg" },
                    { series: "nascar", tag: "NASCAR", title: "Iowa Speedway", time: 'RACE: <span class="hl">TBC</span>', track: "iowa-nascar.svg" }
                ]
            },
            {
                label: "WEEK 33 \u2022 AUG 15-16", events: [
                    { series: "fe", tag: "FORMULA E", title: "London E-Prix", time: 'R1 & R2: <span class="hl">TBC</span>', track: "london-fe.svg" },
                    { series: "indycar", tag: "INDYCAR", title: "Streets of Markham", time: 'RACE: <span class="hl">TBC</span>', track: "markham-indycar.svg" },
                    { series: "nascar", tag: "NASCAR", title: "Cook Out 400 (Richmond)", time: 'RACE: <span class="hl">TBC</span>', track: "richmond-nascar.svg" }
                ]
            },
            {
                label: "WEEK 34 \u2022 AUG 21-23", events: [
                    {
                        series: "f1", tag: "FORMULA 1", title: "Dutch GP", sprint: true,
                        time: 'SPRINT: <span class="hl">12:00</span> \u2022 QUALI: <span class="hl">15:00</span> \u2022 RACE: <span class="hl">15:00</span>',
                        track: "zandvoort-f1.svg"
                    },
                    { series: "f1a", tag: "F1 ACADEMY", title: "Rd 5: Zandvoort", time: 'RACES: <span class="hl">TBC</span>', track: "zandvoort-f1.svg" },
                    { series: "imsa", tag: "IMSA", title: "VIR GT Challenge", time: 'RACE: <span class="hl">TBC</span>', track: "vir-imsa.svg" },
                    { series: "nascar", tag: "NASCAR", title: "Foxwoods 301 (New Hampshire)", time: 'RACE: <span class="hl">TBC</span>', track: "newhampshire-nascar.svg" }
                ]
            },
            {
                label: "WEEK 35 \u2022 AUG 27-30", events: [
                    { series: "wrc", tag: "WRC", title: "Rally del Paraguay", time: "THU > SUN", track: "paraguay-wrc.svg" },
                    { series: "indycar", tag: "INDYCAR", title: "Milwaukee Mile (R1 & R2)", time: 'SAT + SUN: <span class="hl">TBC</span>', track: "milwaukee-indycar.svg" },
                    { series: "nascar", tag: "NASCAR", title: "Coke Zero 400 (Daytona)", time: 'RACE: <span class="hl">TBC</span>', track: "daytona-nascar.svg" }
                ]
            }
        ]
    },
    {
        month: "SEPTEMBER", weeks: [
            {
                label: "WEEK 36 \u2022 SEP 04-06", events: [
                    {
                        series: "f1", tag: "FORMULA 1", title: "Italian GP",
                        time: 'QUALI: <span class="hl">15:00</span> \u2022 RACE: <span class="hl">15:00</span>',
                        track: "monza-f1.svg",
                        sub: [{ badge: "f2", label: "F2", detail: "RACES: TBC" }, { badge: "f3", label: "F3", detail: "RACES: TBC" }]
                    },
                    { series: "wec", tag: "WEC", title: "Lone Star Le Mans (COTA)", time: 'RACE: <span class="hl">TBC</span>', track: "cota-wec.svg" },
                    { series: "indycar", tag: "INDYCAR", title: "GP of Monterey (Laguna Seca)", time: 'RACE: <span class="hl">TBC</span>', track: "lagunaseca-indycar.svg" },
                    { series: "nascar", tag: "NASCAR", title: "Southern 500 (Darlington) \u2014 Playoff", time: 'RACE: <span class="hl">TBC</span>', track: "darlington-nascar.svg" }
                ]
            },
            {
                label: "WEEK 37 \u2022 SEP 10-13", events: [
                    { series: "wrc", tag: "WRC", title: "Rally Chile", time: "THU > SUN", track: "chile-wrc.svg" },
                    {
                        series: "f1", tag: "FORMULA 1", title: "Spanish GP (Madrid)",
                        time: 'QUALI: <span class="hl">15:00</span> \u2022 RACE: <span class="hl">15:00</span>',
                        track: "madrid-f1.svg",
                        sub: [{ badge: "f2", label: "F2", detail: "RACES: TBC" }, { badge: "f3", label: "F3", detail: "FINALE: TBC" }]
                    },
                    { series: "nascar", tag: "NASCAR", title: "Bass Pro Shops Night Race (Bristol) \u2014 Playoff", time: 'RACE: <span class="hl">TBC</span>', track: "bristol-nascar.svg" }
                ]
            },
            {
                label: "WEEK 38 \u2022 SEP 20", events: [
                    { series: "imsa", tag: "IMSA", title: "Battle on the Bricks (Indy)", time: 'RACE: <span class="hl">TBC</span>', track: "indy-imsa.svg" },
                    { series: "nascar", tag: "NASCAR", title: "Playoff Round 1 Race 3 (TBD)", time: 'RACE: <span class="hl">TBC</span>', track: "tbd-nascar.svg" }
                ]
            },
            {
                label: "WEEK 39 \u2022 SEP 24-27", events: [
                    {
                        series: "f1", tag: "FORMULA 1", title: "Azerbaijan GP",
                        time: 'QUALI: <span class="hl">13:00</span> \u2022 RACE: <span class="hl">13:00</span>',
                        track: "baku-f1.svg",
                        sub: [{ badge: "f2", label: "F2", detail: "RACES: TBC" }]
                    },
                    { series: "wec", tag: "WEC", title: "6 Hours of Fuji", time: 'RACE: <span class="hl">TBC</span>', track: "fuji-wec.svg" },
                    { series: "nascar", tag: "NASCAR", title: "Playoff Round 2 Race 1 (TBD)", time: 'RACE: <span class="hl">TBC</span>', track: "tbd-nascar.svg" }
                ]
            }
        ]
    },
    {
        month: "OCTOBER", weeks: [
            {
                label: "WEEK 40 \u2022 OCT 01-04", events: [
                    { series: "wrc", tag: "WRC", title: "Rally Italia Sardegna", time: "THU > SUN", track: "sardegna-wrc.svg" },
                    { series: "imsa", tag: "IMSA", title: "Petit Le Mans", time: 'RACE: <span class="hl">TBC</span>', track: "roadatlanta-imsa.svg" },
                    { series: "nascar", tag: "NASCAR", title: "Playoff Round 2 Race 2 (TBD)", time: 'RACE: <span class="hl">TBC</span>', track: "tbd-nascar.svg" }
                ]
            },
            {
                label: "WEEK 41 \u2022 OCT 09-11", events: [
                    {
                        series: "f1", tag: "FORMULA 1", title: "Singapore GP", sprint: true,
                        time: 'SPRINT: <span class="hl">11:00</span> \u2022 QUALI: <span class="hl">14:00</span> \u2022 RACE: <span class="hl">14:00</span>',
                        track: "singapore-f1.svg"
                    },
                    { series: "sf", tag: "S. FORMULA", title: "Fuji II", time: 'RACE: <span class="hl">TBC</span>', track: "fuji-sf.svg" },
                    { series: "nascar", tag: "NASCAR", title: "Playoff Round 2 Race 3 (TBD)", time: 'RACE: <span class="hl">TBC</span>', track: "tbd-nascar.svg" }
                ]
            },
            {
                label: "WEEK 43 \u2022 OCT 23-25", events: [
                    {
                        series: "f1", tag: "FORMULA 1", title: "United States GP (Austin)",
                        time: 'QUALI: <span class="hl">22:00</span> \u2022 RACE: <span class="hl">21:00</span>',
                        track: "cota-f1.svg"
                    },
                    { series: "f1a", tag: "F1 ACADEMY", title: "Rd 6: COTA", time: 'RACES: <span class="hl">TBC</span>', track: "cota-f1.svg" }
                ]
            },
            {
                label: "WEEK 44 \u2022 OCT 30 - NOV 01", events: [
                    {
                        series: "f1", tag: "FORMULA 1", title: "Mexico City GP",
                        time: 'QUALI: <span class="hl">21:00</span> \u2022 RACE: <span class="hl">21:00</span>',
                        track: "mexico-f1.svg"
                    }
                ]
            }
        ]
    },
    {
        month: "NOVEMBER", weeks: [
            {
                label: "WEEK 45 \u2022 NOV 06-08", events: [
                    {
                        series: "f1", tag: "FORMULA 1", title: "Brazilian GP",
                        time: 'QUALI: <span class="hl">18:00</span> \u2022 RACE: <span class="hl">18:00</span>',
                        track: "interlagos-f1.svg"
                    },
                    { series: "wec", tag: "WEC", title: "8 Hours of Bahrain", time: 'RACE: <span class="hl">TBC</span>', track: "bahrain-wec.svg" },
                    { series: "nascar", tag: "NASCAR", title: "Championship Race (Homestead)", time: 'RACE: <span class="hl">TBC</span>', track: "homestead-nascar.svg" }
                ]
            },
            {
                label: "WEEK 46 \u2022 NOV 11-14", events: [
                    { series: "wrc", tag: "WRC", title: "Rally Saudi Arabia", time: "THU > SUN", track: "saudi-wrc.svg" }
                ]
            },
            {
                label: "WEEK 47 \u2022 NOV 19-22", events: [
                    {
                        series: "f1", tag: "FORMULA 1", title: "Las Vegas GP",
                        time: 'QUALI: <span class="hl">07:00</span> \u2022 RACE: <span class="hl">05:00</span>',
                        track: "lasvegas-f1.svg"
                    },
                    { series: "f1a", tag: "F1 ACADEMY", title: "Rd 7: Las Vegas (Finale)", time: 'RACES: <span class="hl">TBC</span>', track: "lasvegas-f1.svg" },
                    { series: "sf", tag: "S. FORMULA", title: "Suzuka II", time: 'RACE: <span class="hl">TBC</span>', track: "suzuka-sf.svg" }
                ]
            },
            {
                label: "WEEK 48 \u2022 NOV 27-29", events: [
                    {
                        series: "f1", tag: "FORMULA 1", title: "Qatar GP",
                        time: 'QUALI: <span class="hl">17:00</span> \u2022 RACE: <span class="hl">17:00</span>',
                        track: "lusail-f1.svg",
                        sub: [{ badge: "f2", label: "F2", detail: "RACES: TBC" }]
                    }
                ]
            }
        ]
    },
    {
        month: "DECEMBER", weeks: [
            {
                label: "WEEK 49 \u2022 DEC 04-06", events: [
                    {
                        series: "f1", tag: "FORMULA 1", title: "Abu Dhabi GP",
                        time: 'QUALI: <span class="hl">14:00</span> \u2022 RACE: <span class="hl">14:00</span>',
                        track: "yasmarina-f1.svg",
                        sub: [{ badge: "f2", label: "F2", detail: "FINALE: TBC" }]
                    }
                ]
            }
        ]
    }
];

// =============================================
// SERIES FILTER STATE
// =============================================
const allSeries = ['f1', 'f1a', 'fe', 'sf', 'wec', 'imsa', 'wrc', 'indycar', 'nascar'];
const hiddenSeries = new Set();

// =============================================
// RENDER CALENDAR
// =============================================
function renderEvent(ev) {
    const hasSub = ev.sub && ev.sub.length > 0;
    const sprintBadge = ev.sprint ? ' <span class="sprint-badge">SPRINT</span>' : '';

    let detailsInner = '';
    if (hasSub) {
        // F1 with sub-schedule toggle
        detailsInner += '<div class="toggle-row"><div>';
        detailsInner += `<span class="tag t-${ev.series}">${ev.tag}${sprintBadge}</span>`;
        detailsInner += `<span class="title">${ev.title}</span>`;
        detailsInner += `<span class="meta-time">${ev.time}</span>`;
        detailsInner += '</div>';
        detailsInner += '<button class="arrow-btn" aria-label="Toggle support races" onclick="toggle(this)">\u25BC</button>';
        detailsInner += '</div>';
        detailsInner += '<div class="sub-sched">';
        for (const s of ev.sub) {
            detailsInner += `<div class="sub-row"><span class="badge b-${s.badge}">${s.label}</span><span class="sub-det">${s.detail}</span></div>`;
        }
        detailsInner += '</div>';
    } else {
        detailsInner += `<span class="tag t-${ev.series}">${ev.tag}${sprintBadge}</span>`;
        detailsInner += `<span class="title">${ev.title}</span>`;
        detailsInner += `<span class="meta-time">${ev.time}</span>`;
    }

    return `<div class="event ev-${ev.series}" data-series="${ev.series}">` +
        `<div class="ev-details">${detailsInner}</div>` +
        `<div class="track-map"><img src="assets/track-maps/${ev.track}" alt="${ev.title} track layout" loading="lazy" width="60" height="60"></div>` +
        '</div>';
}

function renderCalendar() {
    const container = document.getElementById('calendar-container');
    let html = '';

    for (const month of calendarData) {
        html += `<div class="month-header">${month.month}</div>`;
        html += '<div class="cal-grid">';
        for (const week of month.weeks) {
            html += '<div class="card">';
            html += `<div class="c-head">${week.label}</div>`;
            html += '<div class="c-body">';
            for (const ev of week.events) {
                html += renderEvent(ev);
            }
            html += '</div></div>';
        }
        html += '</div>';
    }

    container.innerHTML = html;
}

// =============================================
// SERIES FILTER
// =============================================
function initFilters() {
    const filterBar = document.getElementById('filter-bar');
    if (!filterBar) return;

    const seriesLabels = {
        f1: 'F1', f1a: 'F1A', fe: 'FE', sf: 'SF', wec: 'WEC', imsa: 'IMSA', wrc: 'WRC',
        indycar: 'INDYCAR', nascar: 'NASCAR'
    };

    for (const s of allSeries) {
        const btn = document.createElement('button');
        btn.className = `filter-btn filter-${s} active`;
        btn.textContent = seriesLabels[s];
        btn.dataset.series = s;
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            if (hiddenSeries.has(s)) {
                hiddenSeries.delete(s);
            } else {
                hiddenSeries.add(s);
            }
            applyFilters();
        });
        filterBar.appendChild(btn);
    }
}

function applyFilters() {
    const events = document.querySelectorAll('.event[data-series]');
    for (const ev of events) {
        ev.style.display = hiddenSeries.has(ev.dataset.series) ? 'none' : '';
    }
    // Hide week cards that have no visible events
    const cards = document.querySelectorAll('.card');
    for (const card of cards) {
        const visibleEvents = card.querySelectorAll('.event[data-series]');
        const allHidden = Array.from(visibleEvents).every(ev => ev.style.display === 'none');
        card.style.display = allHidden ? 'none' : '';
    }
}

// =============================================
// AUTO-SCROLL TO CURRENT WEEK
// =============================================
function scrollToCurrentWeek() {
    const now = Date.now();
    // Find the first week card that has a future event
    const allEvents = document.querySelectorAll('.event[data-series]');
    for (const ev of allEvents) {
        const series = ev.dataset.series;
        const title = ev.querySelector('.title')?.textContent;
        // Find matching seriesData entry
        const list = seriesData[series];
        if (!list) continue;
        const match = list.find(r => r._ts > now);
        if (match) {
            // Scroll to the parent card
            const card = ev.closest('.card');
            if (card) {
                // Scroll to the month header above this card
                const monthHeader = card.closest('.cal-grid')?.previousElementSibling;
                if (monthHeader) {
                    monthHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                return;
            }
        }
    }
}

// =============================================
// PAST EVENTS DIMMING
// =============================================
function dimPastEvents() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed
    const currentDate = now.getDate();

    const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
        "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];

    // Dim entire past months
    const monthHeaders = document.querySelectorAll('.month-header');
    for (const header of monthHeaders) {
        const monthIdx = monthNames.indexOf(header.textContent);
        if (monthIdx < currentMonth) {
            header.classList.add('past');
            const grid = header.nextElementSibling;
            if (grid) grid.classList.add('past');
        }
    }

    // Dim past week cards in current month
    const cards = document.querySelectorAll('.card');
    for (const card of cards) {
        const headText = card.querySelector('.c-head')?.textContent || '';
        // Extract the last date number from the week label
        const dateMatches = headText.match(/\d{2}/g);
        if (!dateMatches) continue;
        const lastDate = parseInt(dateMatches[dateMatches.length - 1]);
        // Check the month from the label
        const monthMatch = headText.match(/JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC/);
        if (!monthMatch) continue;
        const shortMonths = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const cardMonth = shortMonths.indexOf(monthMatch[0]);
        if (cardMonth < currentMonth || (cardMonth === currentMonth && lastDate < currentDate)) {
            card.classList.add('past');
        }
    }
}

// =============================================
// COUNTDOWN TIMER
// =============================================
const els = Object.keys(seriesData).reduce((acc, k) => {
    acc[k] = { t: document.getElementById(`t-${k}`), n: document.querySelector(`.dc-${k} .dc-next`) };
    return acc;
}, {});

// Track next race index per series to avoid scanning from 0 each tick
const nextIdx = {};
for (const k of Object.keys(seriesData)) {
    nextIdx[k] = 0;
}

function update() {
    const now = Date.now();
    for (const [k, list] of Object.entries(seriesData)) {
        const el = els[k];
        if (!el.t) continue;

        // Advance index past expired races
        while (nextIdx[k] < list.length && list[nextIdx[k]]._ts <= now) {
            nextIdx[k]++;
        }

        if (nextIdx[k] < list.length) {
            const next = list[nextIdx[k]];
            if (el.n) el.n.textContent = next.name;
            const dff = next._ts - now;
            const d = Math.floor(dff / 864e5), h = Math.floor((dff % 864e5) / 36e5), m = Math.floor((dff % 36e5) / 6e4), s = Math.floor((dff % 6e4) / 1000);
            el.t.textContent = `${d}d ${h}h ${m}m ${s}s`;
            el.t.style.color = "#ccc";
        } else {
            if (el.n) el.n.textContent = "SEASON END";
            el.t.textContent = "OFF SEASON";
            el.t.style.color = "#444";
        }
    }
}

// Pause timer when tab is hidden to save battery
let timerInterval = setInterval(update, 1000);
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        clearInterval(timerInterval);
    } else {
        update();
        timerInterval = setInterval(update, 1000);
    }
});

const toggle = btn => {
    btn.classList.toggle('active');
    btn.parentElement.nextElementSibling.classList.toggle('open');
};

// =============================================
// INIT
// =============================================
renderCalendar();
initFilters();
dimPastEvents();
update();

// Delay scroll slightly so layout is settled
setTimeout(scrollToCurrentWeek, 100);

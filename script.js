// =============================================
// SERIES METADATA (categories & regions)
// =============================================
const seriesMetadata = {
    f1: { name: "Formula 1", category: "Open Wheel", region: "Worldwide" },
    f1a: { name: "F1 Academy", category: "Open Wheel", region: "Worldwide" },
    fe: { name: "Formula E", category: "Open Wheel", region: "Worldwide" },
    sf: { name: "Super Formula", category: "Open Wheel", region: "Asia & Oceania" },
    wec: { name: "WEC", category: "Endurance", region: "Worldwide" },
    imsa: { name: "IMSA", category: "Endurance", region: "USA" },
    wrc: { name: "WRC", category: "Rally", region: "Worldwide" },
    indycar: { name: "IndyCar", category: "Open Wheel", region: "USA" },
    nascar: { name: "NASCAR", category: "Touring", region: "USA" },
    motogp: { name: "MotoGP", category: "Bike", region: "Worldwide" },
    wsbk: { name: "WSBK", category: "Bike", region: "Worldwide" },
    dtm: { name: "DTM", category: "GT / Sports Car", region: "Europe" },
    btcc: { name: "BTCC", category: "Touring", region: "Europe" },
    supercars: { name: "Supercars", category: "Touring", region: "Asia & Oceania" },
    elms: { name: "ELMS", category: "Endurance", region: "Europe" },
    gtwce: { name: "GTWCE", category: "GT / Sports Car", region: "Europe" },
    gtwca: { name: "GTWCA", category: "GT / Sports Car", region: "USA" },
    nls: { name: "NLS", category: "Endurance", region: "Europe" },
    igtc: { name: "IGTC", category: "GT / Sports Car", region: "Worldwide" },
    tcr: { name: "TCR", category: "Touring", region: "Worldwide" },
    erc: { name: "ERC", category: "Rally", region: "Europe" }
};

// =============================================
// FILTER CONSTANTS (must be before loadFilterState)
// =============================================
const allSeries = ['f1', 'f1a', 'fe', 'sf', 'wec', 'imsa', 'wrc', 'indycar', 'nascar', 'motogp', 'wsbk', 'dtm', 'btcc', 'supercars', 'elms', 'gtwce', 'gtwca', 'nls', 'igtc', 'tcr', 'erc'];
const ALL_REGIONS = ['Worldwide', 'Europe', 'USA', 'Asia & Oceania'];
const ALL_CATEGORIES = ['Open Wheel', 'Endurance', 'Rally', 'Touring', 'Bike', 'GT / Sports Car'];

// =============================================
// FILTER STATE
// =============================================
const defaultFilterState = { regions: [], categories: [], hiddenSpecificSeries: [] };

function loadFilterStateFromURL() {
    const params = new URLSearchParams(window.location.search);
    const regionParam = params.get('region');
    const categoryParam = params.get('category');
    const hiddenParam = params.get('hidden');
    if (!regionParam && !categoryParam && !hiddenParam) return null;

    const state = JSON.parse(JSON.stringify(defaultFilterState));
    if (regionParam) {
        state.regions = regionParam.split(',').filter(r => ALL_REGIONS.includes(r));
    }
    if (categoryParam) {
        state.categories = categoryParam.split(',').filter(c => ALL_CATEGORIES.includes(c));
    }
    if (hiddenParam) {
        state.hiddenSpecificSeries = hiddenParam.split(',').filter(s => allSeries.includes(s));
    }
    return state;
}

function filterStateToURL() {
    const params = new URLSearchParams();
    if (filterState.regions.length) params.set('region', filterState.regions.join(','));
    if (filterState.categories.length) params.set('category', filterState.categories.join(','));
    if (filterState.hiddenSpecificSeries.length) params.set('hidden', filterState.hiddenSpecificSeries.join(','));
    const qs = params.toString();
    const url = window.location.pathname + (qs ? '?' + qs : '');
    window.history.replaceState(null, '', url);
}

function loadFilterState() {
    const fromURL = loadFilterStateFromURL();
    if (fromURL) {
        // URL params take priority; sync to localStorage
        try { localStorage.setItem('motorsportFilters', JSON.stringify(fromURL)); } catch (e) { /* ignore */ }
        return fromURL;
    }
    try {
        const saved = localStorage.getItem('motorsportFilters');
        if (saved) return JSON.parse(saved);
    } catch (e) { /* ignore */ }
    return JSON.parse(JSON.stringify(defaultFilterState));
}

function saveFilterState() {
    try { localStorage.setItem('motorsportFilters', JSON.stringify(filterState)); } catch (e) { /* ignore */ }
}

const filterState = loadFilterState();

// =============================================
// SERIES DATA (for countdown timers)
// =============================================
const seriesData = {
    f1: [
        { name: "AUSTRALIA", date: "2026-03-08T05:00:00+01:00" },
        { name: "CHINA", date: "2026-03-15T08:00:00+01:00" },
        { name: "JAPAN", date: "2026-03-29T07:00:00+02:00" },
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
    ],
    motogp: [
        { name: "THAILAND", date: "2026-03-01T08:00:00+01:00" },
        { name: "BRAZIL", date: "2026-03-22T18:00:00+01:00" },
        { name: "AMERICAS (COTA)", date: "2026-03-29T21:00:00+02:00" },
        { name: "SPAIN (JEREZ)", date: "2026-04-26T14:00:00+02:00" },
        { name: "FRANCE (LE MANS)", date: "2026-05-10T14:00:00+02:00" },
        { name: "CATALONIA", date: "2026-05-17T14:00:00+02:00" },
        { name: "ITALY (MUGELLO)", date: "2026-05-31T14:00:00+02:00" },
        { name: "HUNGARY", date: "2026-06-07T14:00:00+02:00" },
        { name: "CZECH REPUBLIC", date: "2026-06-21T14:00:00+02:00" },
        { name: "NETHERLANDS (ASSEN)", date: "2026-06-28T14:00:00+02:00" },
        { name: "GERMANY", date: "2026-07-12T14:00:00+02:00" },
        { name: "GREAT BRITAIN", date: "2026-08-09T15:00:00+02:00" },
        { name: "ARAGON", date: "2026-08-30T14:00:00+02:00" },
        { name: "SAN MARINO (MISANO)", date: "2026-09-13T14:00:00+02:00" },
        { name: "AUSTRIA", date: "2026-09-20T14:00:00+02:00" },
        { name: "JAPAN (MOTEGI)", date: "2026-10-04T07:00:00+02:00" },
        { name: "INDONESIA", date: "2026-10-11T08:00:00+02:00" },
        { name: "AUSTRALIA", date: "2026-10-19T05:00:00+02:00" },
        { name: "MALAYSIA", date: "2026-10-26T08:00:00+01:00" },
        { name: "PORTUGAL", date: "2026-11-01T14:00:00+01:00" },
        { name: "VALENCIA", date: "2026-11-22T14:00:00+01:00" }
    ],
    wsbk: [
        { name: "PHILLIP ISLAND", date: "2026-02-22T05:00:00+01:00" },
        { name: "PORTIMÃO", date: "2026-03-29T14:00:00+01:00" },
        { name: "ASSEN", date: "2026-04-19T14:00:00+02:00" },
        { name: "BALATON PARK", date: "2026-05-03T14:00:00+02:00" },
        { name: "MOST", date: "2026-05-17T14:00:00+02:00" },
        { name: "ARAGON", date: "2026-05-31T14:00:00+02:00" },
        { name: "MISANO", date: "2026-06-14T14:00:00+02:00" },
        { name: "DONINGTON PARK", date: "2026-07-12T15:00:00+02:00" },
        { name: "MAGNY-COURS", date: "2026-09-06T14:00:00+02:00" },
        { name: "CREMONA", date: "2026-09-27T14:00:00+02:00" },
        { name: "ESTORIL", date: "2026-10-11T14:00:00+02:00" },
        { name: "JEREZ", date: "2026-10-18T14:00:00+02:00" }
    ],
    dtm: [
        { name: "RED BULL RING", date: "2026-04-26T14:00:00+02:00" },
        { name: "ZANDVOORT", date: "2026-05-24T14:00:00+02:00" },
        { name: "LAUSITZRING", date: "2026-06-21T14:00:00+02:00" },
        { name: "NORISRING", date: "2026-07-05T14:00:00+02:00" },
        { name: "OSCHERSLEBEN", date: "2026-07-26T14:00:00+02:00" },
        { name: "NÜRBURGRING", date: "2026-08-16T14:00:00+02:00" },
        { name: "SACHSENRING", date: "2026-09-13T14:00:00+02:00" },
        { name: "HOCKENHEIM", date: "2026-10-11T14:00:00+02:00" }
    ],
    btcc: [
        { name: "DONINGTON PARK", date: "2026-04-19T14:00:00+02:00" },
        { name: "BRANDS HATCH", date: "2026-05-10T14:00:00+02:00" },
        { name: "SNETTERTON", date: "2026-05-24T14:00:00+02:00" },
        { name: "OULTON PARK", date: "2026-06-07T14:00:00+02:00" },
        { name: "THRUXTON", date: "2026-07-26T14:00:00+02:00" },
        { name: "KNOCKHILL", date: "2026-08-09T14:00:00+02:00" },
        { name: "DONINGTON GP", date: "2026-08-23T14:00:00+02:00" },
        { name: "CROFT", date: "2026-09-06T14:00:00+02:00" },
        { name: "SILVERSTONE", date: "2026-09-27T14:00:00+02:00" },
        { name: "BRANDS HATCH GP", date: "2026-10-11T14:00:00+02:00" }
    ],
    supercars: [
        { name: "SYDNEY 500", date: "2026-02-22T04:00:00+01:00" },
        { name: "MELBOURNE", date: "2026-03-08T04:00:00+01:00" },
        { name: "TAUPŌ", date: "2026-04-12T04:00:00+02:00" },
        { name: "CHRISTCHURCH", date: "2026-04-19T04:00:00+02:00" },
        { name: "TASMANIA", date: "2026-05-24T04:00:00+02:00" },
        { name: "DARWIN", date: "2026-06-21T06:30:00+02:00" },
        { name: "TOWNSVILLE", date: "2026-07-12T04:00:00+02:00" },
        { name: "PERTH", date: "2026-08-02T06:00:00+02:00" },
        { name: "IPSWICH", date: "2026-08-23T04:00:00+02:00" },
        { name: "THE BEND", date: "2026-09-13T04:30:00+02:00" },
        { name: "BATHURST 1000", date: "2026-10-11T01:00:00+02:00" },
        { name: "GOLD COAST 500", date: "2026-10-25T03:00:00+01:00" },
        { name: "SANDOWN 500", date: "2026-11-15T03:00:00+01:00" },
        { name: "ADELAIDE", date: "2026-12-06T03:30:00+01:00" }
    ],
    elms: [
        { name: "BARCELONA 4H", date: "2026-04-12T12:00:00+02:00" },
        { name: "LE CASTELLET 4H", date: "2026-05-03T11:00:00+02:00" },
        { name: "IMOLA 4H", date: "2026-07-05T12:00:00+02:00" },
        { name: "SPA 4H", date: "2026-08-23T11:00:00+02:00" },
        { name: "SILVERSTONE 4H", date: "2026-09-13T12:00:00+02:00" },
        { name: "PORTIMÃO 4H", date: "2026-10-10T12:00:00+02:00" }
    ],
    gtwce: [
        { name: "PAUL RICARD 6H", date: "2026-04-12T13:00:00+02:00" },
        { name: "BRANDS HATCH", date: "2026-05-03T14:00:00+02:00" },
        { name: "MONZA 3H", date: "2026-05-31T14:00:00+02:00" },
        { name: "24H SPA", date: "2026-06-27T16:30:00+02:00" },
        { name: "MISANO", date: "2026-07-19T14:00:00+02:00" },
        { name: "MAGNY-COURS", date: "2026-08-02T14:00:00+02:00" },
        { name: "NÜRBURGRING", date: "2026-08-30T14:00:00+02:00" },
        { name: "ZANDVOORT", date: "2026-09-20T14:00:00+02:00" },
        { name: "BARCELONA 3H", date: "2026-10-04T13:00:00+02:00" },
        { name: "PORTIMÃO 3H", date: "2026-10-18T13:00:00+02:00" }
    ],
    gtwca: [
        { name: "SONOMA", date: "2026-03-29T21:00:00+02:00" },
        { name: "COTA", date: "2026-04-26T21:00:00+02:00" },
        { name: "SEBRING", date: "2026-05-10T19:00:00+02:00" },
        { name: "ROAD ATLANTA", date: "2026-06-14T19:00:00+02:00" },
        { name: "ROAD AMERICA", date: "2026-08-30T19:00:00+02:00" },
        { name: "BARBER", date: "2026-09-27T19:00:00+02:00" },
        { name: "INDIANAPOLIS 8H", date: "2026-10-10T17:00:00+02:00" }
    ],
    nls: [
        { name: "WESTFALENFAHRT", date: "2026-03-14T09:00:00+01:00" },
        { name: "BARBAROSSAPREIS", date: "2026-03-21T09:00:00+01:00" },
        { name: "ADENAUER TROPHY", date: "2026-04-11T10:00:00+02:00" },
        { name: "24H QUALIFIERS", date: "2026-04-19T10:00:00+02:00" },
        { name: "EIFEL TROPHY", date: "2026-06-20T10:00:00+02:00" },
        { name: "RUHR-POKAL 6H", date: "2026-08-01T10:00:00+02:00" },
        { name: "REINOLDUS", date: "2026-09-12T10:00:00+02:00" },
        { name: "BARBAROSSAPREIS II", date: "2026-09-13T10:00:00+02:00" },
        { name: "SPORTWARTE TROPHY", date: "2026-10-10T10:00:00+02:00" }
    ],
    igtc: [
        { name: "BATHURST 12H", date: "2026-02-15T00:00:00+01:00" },
        { name: "24H NÜRBURGRING", date: "2026-05-16T14:00:00+02:00" },
        { name: "24H SPA", date: "2026-06-27T16:30:00+02:00" },
        { name: "SUZUKA 1000KM", date: "2026-09-13T03:00:00+02:00" },
        { name: "INDIANAPOLIS 8H", date: "2026-10-10T17:00:00+02:00" }
    ],
    tcr: [
        { name: "TBC (ITALY)", date: "2026-05-03T14:00:00+02:00" },
        { name: "VALENCIA", date: "2026-06-14T14:00:00+02:00" },
        { name: "LE CASTELLET", date: "2026-07-05T14:00:00+02:00" },
        { name: "VILA REAL", date: "2026-07-12T14:00:00+02:00" },
        { name: "SOUTH KOREA", date: "2026-10-04T07:00:00+02:00" },
        { name: "CHENGDU", date: "2026-10-18T08:00:00+02:00" },
        { name: "ZHUZHOU", date: "2026-10-25T08:00:00+01:00" },
        { name: "MACAU", date: "2026-11-22T08:00:00+01:00" }
    ],
    erc: [
        { name: "ANDALUSIA", date: "2026-04-19T14:00:00+02:00" },
        { name: "SCANDINAVIA", date: "2026-05-24T14:00:00+02:00" },
        { name: "ROMA CAPITALE", date: "2026-07-05T14:00:00+02:00" },
        { name: "POLAND", date: "2026-07-26T14:00:00+02:00" },
        { name: "CZECH (ZLÍN)", date: "2026-08-16T14:00:00+02:00" },
        { name: "CEREDIGION", date: "2026-09-06T14:00:00+02:00" },
        { name: "FAFE", date: "2026-10-25T14:00:00+01:00" }
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
                    { series: "wrc", tag: "WRC", title: "Rallye Monte-Carlo", time: "THU > SUN", track: "montecarlo-wrc.svg", sub: [{ badge: "wrc2", label: "WRC2", detail: "ALL STAGES" }] },
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
                    { series: "wrc", tag: "WRC", title: "Rally Sweden", time: "THU > SUN", track: "sweden-wrc.svg", sub: [{ badge: "wrc2", label: "WRC2", detail: "ALL STAGES" }] },
                    { series: "fe", tag: "FORMULA E", title: "Jeddah E-Prix", time: 'R1 & R2: <span class="hl">TBC</span>', track: "jeddah-fe.svg" },
                    { series: "igtc", tag: "IGTC", title: "Bathurst 12 Hour", time: 'FRI > SUN', track: "bathurst-igtc.svg" },
                    { series: "nascar", tag: "NASCAR", title: "Daytona 500", time: 'RACE: <span class="hl">20:30</span>', track: "daytona-nascar.svg" }
                ]
            },
            {
                label: "WEEK 08 \u2022 FEB 20-22", events: [
                    { series: "wsbk", tag: "WSBK", title: "Phillip Island Round", time: 'FRI > SUN', track: "phillipisland-wsbk.svg" },
                    { series: "supercars", tag: "SUPERCARS", title: "Sydney 500", time: 'FRI > SUN', track: "sydney-supercars.svg" },
                    { series: "nascar", tag: "NASCAR", title: "Atlanta Motor Speedway", time: 'RACE: <span class="hl">21:00</span>', track: "atlanta-nascar.svg" }
                ]
            },
            {
                label: "WEEK 09 \u2022 FEB 27 - MAR 01", events: [
                    { series: "motogp", tag: "MOTOGP", title: "Thai Grand Prix", time: 'RACE: <span class="hl">08:00</span>', track: "buriram-motogp.svg" }
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
                label: "WEEK 10 \u2022 MAR 05-08", events: [
                    {
                        series: "f1", tag: "FORMULA 1", title: "Australian GP",
                        time: 'QUALI: <span class="hl">06:00</span> \u2022 RACE: <span class="hl">05:00</span>',
                        track: "australia-f1.svg",
                        sub: [{ badge: "f2", label: "F2", detail: "RACES: TBC" }, { badge: "f3", label: "F3", detail: "RACES: TBC" }]
                    },
                    { series: "supercars", tag: "SUPERCARS", title: "Melbourne SuperSprint", time: 'THU > SUN', track: "melbourne-supercars.svg" },
                    { series: "indycar", tag: "INDYCAR", title: "Phoenix Grand Prix", time: 'RACE: <span class="hl">TBC</span>', track: "phoenix-indycar.svg" },
                    { series: "nascar", tag: "NASCAR", title: "Phoenix Raceway", time: 'RACE: <span class="hl">TBC</span>', track: "phoenix-nascar.svg" }
                ]
            },
            {
                label: "WEEK 11 \u2022 MAR 12-15", events: [
                    { series: "wrc", tag: "WRC", title: "Safari Rally Kenya", time: "THU > SUN", track: "kenya-wrc.svg", sub: [{ badge: "wrc2", label: "WRC2", detail: "ALL STAGES" }] },
                    {
                        series: "f1", tag: "FORMULA 1", title: "Chinese GP", sprint: true,
                        time: 'SPRINT: <span class="hl">04:00</span> \u2022 QUALI: <span class="hl">08:00</span> \u2022 RACE: <span class="hl">08:00</span>',
                        track: "china-f1.svg"
                    },
                    { series: "f1a", tag: "F1 ACADEMY", title: "Rd 1: China", time: 'RACES: <span class="hl">TBC</span>', track: "china-f1.svg" },
                    { series: "nls", tag: "NLS", title: "71. ADAC Westfalenfahrt (4h)", time: 'SAT: <span class="hl">09:00</span>', track: "nordschleife-nls.svg" },
                    { series: "indycar", tag: "INDYCAR", title: "Streets of Arlington", time: 'RACE: <span class="hl">TBC</span>', track: "arlington-indycar.svg" },
                    { series: "nascar", tag: "NASCAR", title: "Pennzoil 400 (Las Vegas)", time: 'RACE: <span class="hl">TBC</span>', track: "lasvegas-nascar.svg" }
                ]
            },
            {
                label: "WEEK 12 \u2022 MAR 20-22", events: [
                    { series: "motogp", tag: "MOTOGP", title: "Brazilian Grand Prix", time: 'RACE: <span class="hl">18:00</span>', track: "goiania-motogp.svg" },
                    { series: "fe", tag: "FORMULA E", title: "Madrid E-Prix", time: 'RACE: <span class="hl">15:05</span>', track: "madrid-fe.svg" },
                    { series: "imsa", tag: "IMSA", title: "12 Hours of Sebring", time: 'RACE: <span class="hl">15:40</span>', track: "sebring-imsa.svg" },
                    { series: "nls", tag: "NLS", title: "58. ADAC Barbarossapreis (4h)", time: 'SAT: <span class="hl">09:00</span>', track: "nordschleife-nls.svg" },
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
                    { series: "motogp", tag: "MOTOGP", title: "Americas Grand Prix", time: 'RACE: <span class="hl">21:00</span>', track: "cota-motogp.svg" },
                    { series: "wsbk", tag: "WSBK", title: "Portimão Round", time: 'FRI > SUN', track: "portimao-wsbk.svg" },
                    { series: "gtwca", tag: "GTWCA", title: "Sonoma Round", time: 'FRI > SUN', track: "sonoma-gtwca.svg" },
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
                    { series: "wrc", tag: "WRC", title: "Croatia Rally", time: "THU > SUN", track: "croatia-wrc.svg", sub: [{ badge: "wrc2", label: "WRC2", detail: "ALL STAGES" }] },
                    { series: "supercars", tag: "SUPERCARS", title: "ITM Taupō Super440", time: 'FRI > SUN', track: "taupo-supercars.svg" },
                    { series: "nls", tag: "NLS", title: "Adenauer ADAC Trophy (4h)", time: 'SAT: <span class="hl">10:00</span>', track: "nordschleife-nls.svg" },
                    { series: "elms", tag: "ELMS", title: "4 Hours of Barcelona", time: 'SUN: <span class="hl">12:00</span>', track: "barcelona-elms.svg" },
                    { series: "gtwce", tag: "GTWCE", title: "6 Hours of Paul Ricard", time: 'SAT > SUN', track: "paulricard-gtwce.svg" },
                    { series: "nascar", tag: "NASCAR", title: "Cook Out 400 (Martinsville)", time: 'RACE: <span class="hl">TBC</span>', track: "martinsville-nascar.svg" }
                ]
            },
            {
                label: "WEEK 16 \u2022 APR 17-19", events: [
                    { series: "wsbk", tag: "WSBK", title: "Assen Round", time: 'FRI > SUN', track: "assen-wsbk.svg" },
                    { series: "btcc", tag: "BTCC", title: "Donington Park (Races 1-3)", time: 'SAT > SUN', track: "donington-btcc.svg" },
                    { series: "supercars", tag: "SUPERCARS", title: "Christchurch Super440", time: 'FRI > SUN', track: "christchurch-supercars.svg" },
                    { series: "erc", tag: "ERC", title: "Andalusia Rally", time: 'FRI > SUN', track: "cordoba-erc.svg" },
                    { series: "nls", tag: "NLS", title: "ADAC 24h Qualifiers (2×4h)", time: 'SAT + SUN', track: "nordschleife-nls.svg" },
                    { series: "indycar", tag: "INDYCAR", title: "Acura GP of Long Beach", time: 'RACE: <span class="hl">TBC</span>', track: "longbeach-indycar.svg" },
                    { series: "imsa", tag: "IMSA", title: "Grand Prix of Long Beach", time: 'RACE: <span class="hl">TBC</span>', track: "longbeach-imsa.svg" },
                    { series: "wec", tag: "WEC", title: "6 Hours of Imola", time: 'RACE: <span class="hl">TBC</span>', track: "imola-wec.svg" },
                    { series: "nascar", tag: "NASCAR", title: "GEICO 500 (Talladega)", time: 'RACE: <span class="hl">TBC</span>', track: "talladega-nascar.svg" }
                ]
            },
            {
                label: "WEEK 17 \u2022 APR 23-26", events: [
                    { series: "wrc", tag: "WRC", title: "Rally Islas Canarias", time: "THU > SUN", track: "canarias-wrc.svg", sub: [{ badge: "wrc2", label: "WRC2", detail: "ALL STAGES" }] },
                    { series: "motogp", tag: "MOTOGP", title: "Spanish Grand Prix (Jerez)", time: 'RACE: <span class="hl">14:00</span>', track: "jerez-motogp.svg" },
                    { series: "sf", tag: "S. FORMULA", title: "Autopolis", time: 'RACE: <span class="hl">TBC</span>', track: "autopolis-sf.svg" },
                    { series: "dtm", tag: "DTM", title: "Red Bull Ring (Season Opener)", time: 'SAT + SUN', track: "redbullring-dtm.svg" },
                    { series: "gtwca", tag: "GTWCA", title: "COTA Round", time: 'FRI > SUN', track: "cota-gtwca.svg" },
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
                    { series: "wsbk", tag: "WSBK", title: "Balaton Park Round", time: 'FRI > SUN', track: "balaton-wsbk.svg" },
                    { series: "fe", tag: "FORMULA E", title: "Berlin E-Prix", time: 'R1 & R2: <span class="hl">TBC</span>', track: "berlin-fe.svg" },
                    { series: "imsa", tag: "IMSA", title: "Monterey Sportscar Champ.", time: 'RACE: <span class="hl">TBC</span>', track: "lagunaseca-imsa.svg" },
                    { series: "elms", tag: "ELMS", title: "4 Hours of Le Castellet", time: 'SUN: <span class="hl">11:00</span>', track: "paulricard-elms.svg" },
                    { series: "gtwce", tag: "GTWCE", title: "Brands Hatch Sprint", time: 'SAT + SUN', track: "brandshatch-gtwce.svg" },
                    { series: "tcr", tag: "TCR", title: "Round 1 (Venue TBC)", time: 'FRI > SUN', track: "tbc-tcr.svg" },
                    { series: "nascar", tag: "NASCAR", title: "AdventHealth 400 (Kansas)", time: 'RACE: <span class="hl">TBC</span>', track: "kansas-nascar.svg" }
                ]
            },
            {
                label: "WEEK 19 \u2022 MAY 07-10", events: [
                    { series: "wrc", tag: "WRC", title: "Rally de Portugal", time: "THU > SUN", track: "portugal-wrc.svg", sub: [{ badge: "wrc2", label: "WRC2", detail: "ALL STAGES" }] },
                    { series: "motogp", tag: "MOTOGP", title: "French Grand Prix (Le Mans)", time: 'RACE: <span class="hl">14:00</span>', track: "lemans-motogp.svg" },
                    { series: "wec", tag: "WEC", title: "6 Hours of Spa", time: 'RACE: <span class="hl">TBC</span>', track: "spa-wec.svg" },
                    { series: "btcc", tag: "BTCC", title: "Brands Hatch Indy (Races 4-6)", time: 'SAT + SUN', track: "brandshatch-btcc.svg" },
                    { series: "gtwca", tag: "GTWCA", title: "Sebring Round", time: 'FRI > SUN', track: "sebring-gtwca.svg" },
                    { series: "indycar", tag: "INDYCAR", title: "GMR Grand Prix (IMS Road)", time: 'RACE: <span class="hl">TBC</span>', track: "indianapolis-indycar.svg" },
                    { series: "nascar", tag: "NASCAR", title: "Goodyear 400 (Darlington)", time: 'RACE: <span class="hl">TBC</span>', track: "darlington-nascar.svg" }
                ]
            },
            {
                label: "WEEK 20 \u2022 MAY 14-17", events: [
                    { series: "motogp", tag: "MOTOGP", title: "Catalan Grand Prix", time: 'RACE: <span class="hl">14:00</span>', track: "barcelona-motogp.svg" },
                    { series: "wsbk", tag: "WSBK", title: "Most Round", time: 'FRI > SUN', track: "most-wsbk.svg" },
                    { series: "fe", tag: "FORMULA E", title: "Monaco E-Prix", time: 'R1 & R2: <span class="hl">TBC</span>', track: "monaco-fe.svg" },
                    { series: "igtc", tag: "IGTC", title: "ADAC 24h Nürburgring", time: 'THU > SUN', track: "nordschleife-igtc.svg" }
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
                    { series: "dtm", tag: "DTM", title: "Zandvoort Round", time: 'SAT + SUN', track: "zandvoort-dtm.svg" },
                    { series: "btcc", tag: "BTCC", title: "Snetterton 300 (Races 7-9)", time: 'SAT + SUN', track: "snetterton-btcc.svg" },
                    { series: "supercars", tag: "SUPERCARS", title: "Tasmania Super440", time: 'FRI > SUN', track: "tasmania-supercars.svg" },
                    { series: "erc", tag: "ERC", title: "Royal Rally of Scandinavia", time: 'FRI > SUN', track: "karlstad-erc.svg" },
                    { series: "indycar", tag: "INDYCAR", title: "Indianapolis 500", time: 'RACE: <span class="hl">18:45</span>', track: "indy500-indycar.svg" },
                    { series: "sf", tag: "S. FORMULA", title: "Suzuka", time: 'RACE: <span class="hl">TBC</span>', track: "suzuka-sf.svg" },
                    { series: "nascar", tag: "NASCAR", title: "Coca-Cola 600 (Charlotte)", time: 'RACE: <span class="hl">00:00</span>', track: "charlotte-nascar.svg" }
                ]
            },
            {
                label: "WEEK 22 \u2022 MAY 28-31", events: [
                    { series: "wrc", tag: "WRC", title: "Rally Japan", time: "THU > SUN", track: "japan-wrc.svg", sub: [{ badge: "wrc2", label: "WRC2", detail: "ALL STAGES" }] },
                    { series: "motogp", tag: "MOTOGP", title: "Italian Grand Prix (Mugello)", time: 'RACE: <span class="hl">14:00</span>', track: "mugello-motogp.svg" },
                    { series: "wsbk", tag: "WSBK", title: "Aragon Round", time: 'FRI > SUN', track: "aragon-wsbk.svg" },
                    { series: "gtwce", tag: "GTWCE", title: "3 Hours of Monza", time: 'FRI > SUN', track: "monza-gtwce.svg" },
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
                    { series: "motogp", tag: "MOTOGP", title: "Hungarian Grand Prix", time: 'RACE: <span class="hl">14:00</span>', track: "balaton-motogp.svg" },
                    { series: "btcc", tag: "BTCC", title: "Oulton Park (Races 10-12)", time: 'SAT + SUN', track: "oultonpark-btcc.svg" },
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
                    { series: "wsbk", tag: "WSBK", title: "Misano Round", time: 'FRI > SUN', track: "misano-wsbk.svg" },
                    { series: "wec", tag: "WEC", title: "24 Hours of Le Mans", time: 'SAT <span class="hl">16:00</span> > SUN <span class="hl">16:00</span>', track: "lemans-wec.svg" },
                    { series: "tcr", tag: "TCR", title: "Valencia Round", time: 'FRI > SUN', track: "valencia-tcr.svg" },
                    { series: "gtwca", tag: "GTWCA", title: "Road Atlanta Round", time: 'FRI > SUN', track: "roadatlanta-gtwca.svg" },
                    { series: "nascar", tag: "NASCAR", title: "HighPoint.com 400 (Pocono)", time: 'RACE: <span class="hl">TBC</span>', track: "pocono-nascar.svg" }
                ]
            },
            {
                label: "WEEK 25 \u2022 JUN 19-21", events: [
                    { series: "motogp", tag: "MOTOGP", title: "Czech Grand Prix (Brno)", time: 'RACE: <span class="hl">14:00</span>', track: "brno-motogp.svg" },
                    { series: "dtm", tag: "DTM", title: "Lausitzring Round", time: 'SAT + SUN', track: "lausitzring-dtm.svg" },
                    { series: "supercars", tag: "SUPERCARS", title: "Betr Darwin Triple Crown", time: 'FRI > SUN', track: "darwin-supercars.svg" },
                    { series: "fe", tag: "FORMULA E", title: "Sanya E-Prix", time: 'RACE: <span class="hl">TBC</span>', track: "sanya-fe.svg" },
                    { series: "nls", tag: "NLS", title: "1. ADAC Eifel Trophy (4h)", time: 'SAT: <span class="hl">10:00</span>', track: "nordschleife-nls.svg" },
                    { series: "indycar", tag: "INDYCAR", title: "Road America (R1 & R2)", time: 'SAT + SUN: <span class="hl">TBC</span>', track: "roadamerica-indycar.svg" },
                    { series: "nascar", tag: "NASCAR", title: "San Diego Street Race", time: 'RACE: <span class="hl">TBC</span>', track: "sandiego-nascar.svg" }
                ]
            },
            {
                label: "WEEK 26 \u2022 JUN 24-28", events: [
                    { series: "wrc", tag: "WRC", title: "Acropolis Rally Greece", time: "THU > SUN", track: "greece-wrc.svg", sub: [{ badge: "wrc2", label: "WRC2", detail: "ALL STAGES" }] },
                    {
                        series: "f1", tag: "FORMULA 1", title: "Austrian GP",
                        time: 'QUALI: <span class="hl">15:00</span> \u2022 RACE: <span class="hl">15:00</span>',
                        track: "austria-f1.svg",
                        sub: [{ badge: "f2", label: "F2", detail: "RACES: TBC" }, { badge: "f3", label: "F3", detail: "RACES: TBC" }]
                    },
                    { series: "motogp", tag: "MOTOGP", title: "Dutch TT (Assen)", time: 'RACE: <span class="hl">14:00</span>', track: "assen-motogp.svg" },
                    { series: "gtwce", tag: "GTWCE", title: "24 Hours of Spa", time: 'WED > SUN', track: "spa-gtwce.svg" },
                    { series: "igtc", tag: "IGTC", title: "CrowdStrike 24 Hours of Spa", time: 'THU > SUN', track: "spa-igtc.svg" },
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
                    { series: "dtm", tag: "DTM", title: "Norisring Round", time: 'SAT + SUN', track: "norisring-dtm.svg" },
                    { series: "erc", tag: "ERC", title: "Rally di Roma Capitale", time: 'FRI > SUN', track: "roma-erc.svg" },
                    { series: "elms", tag: "ELMS", title: "4 Hours of Imola", time: 'SAT > SUN', track: "imola-elms.svg" },
                    { series: "tcr", tag: "TCR", title: "Le Castellet Round", time: 'SAT + SUN', track: "paulricard-tcr.svg" },
                    { series: "indycar", tag: "INDYCAR", title: "Mid-Ohio (R1 & R2)", time: 'SAT + SUN: <span class="hl">TBC</span>', track: "midohio-indycar.svg" },
                    { series: "nascar", tag: "NASCAR", title: "Chicagoland Speedway", time: 'RACE: <span class="hl">TBC</span>', track: "chicagoland-nascar.svg" }
                ]
            },
            {
                label: "WEEK 28 \u2022 JUL 10-12", events: [
                    { series: "motogp", tag: "MOTOGP", title: "German Grand Prix (Sachsenring)", time: 'RACE: <span class="hl">14:00</span>', track: "sachsenring-motogp.svg" },
                    { series: "wsbk", tag: "WSBK", title: "Donington Park Round", time: 'FRI > SUN', track: "donington-wsbk.svg" },
                    { series: "supercars", tag: "SUPERCARS", title: "NTI Townsville 500", time: 'FRI > SUN', track: "townsville-supercars.svg" },
                    { series: "tcr", tag: "TCR", title: "Vila Real Round", time: 'SAT + SUN', track: "vilareal-tcr.svg" },
                    { series: "wec", tag: "WEC", title: "6 Hours of S\u00e3o Paulo", time: 'RACE: <span class="hl">TBC</span>', track: "interlagos-wec.svg" },
                    { series: "imsa", tag: "IMSA", title: "Chevrolet Grand Prix (Mosport)", time: 'RACE: <span class="hl">TBC</span>', track: "mosport-imsa.svg" },
                    { series: "nascar", tag: "NASCAR", title: "EchoPark 400 (Atlanta)", time: 'RACE: <span class="hl">TBC</span>', track: "atlanta-nascar.svg" }
                ]
            },
            {
                label: "WEEK 29 \u2022 JUL 16-19", events: [
                    { series: "wrc", tag: "WRC", title: "Rally Estonia", time: "THU > SUN", track: "estonia-wrc.svg", sub: [{ badge: "wrc2", label: "WRC2", detail: "ALL STAGES" }] },
                    {
                        series: "f1", tag: "FORMULA 1", title: "Belgian GP",
                        time: 'QUALI: <span class="hl">15:00</span> \u2022 RACE: <span class="hl">15:00</span>',
                        track: "spa-f1.svg",
                        sub: [{ badge: "f2", label: "F2", detail: "RACES: TBC" }, { badge: "f3", label: "F3", detail: "RACES: TBC" }]
                    },
                    { series: "gtwce", tag: "GTWCE", title: "Misano Sprint", time: 'FRI > SUN', track: "misano-gtwce.svg" },
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
                    { series: "dtm", tag: "DTM", title: "Oschersleben Round", time: 'SAT + SUN', track: "oschersleben-dtm.svg" },
                    { series: "btcc", tag: "BTCC", title: "Thruxton (Races 13-15)", time: 'SAT + SUN', track: "thruxton-btcc.svg" },
                    { series: "erc", tag: "ERC", title: "82nd Rally Poland", time: 'FRI > SUN', track: "katowice-erc.svg" },
                    { series: "nascar", tag: "NASCAR", title: "Brickyard 400 (Indianapolis)", time: 'RACE: <span class="hl">TBC</span>', track: "indianapolis-nascar.svg" }
                ]
            },
            {
                label: "WEEK 31 \u2022 JUL 30 - AUG 02", events: [
                    { series: "wrc", tag: "WRC", title: "Rally Finland", time: "THU > SUN", track: "finland-wrc.svg", sub: [{ badge: "wrc2", label: "WRC2", detail: "ALL STAGES" }] },
                    { series: "supercars", tag: "SUPERCARS", title: "Perth Super440", time: 'FRI > SUN', track: "perth-supercars.svg" },
                    { series: "gtwce", tag: "GTWCE", title: "Magny-Cours Sprint", time: 'SAT + SUN', track: "magnycours-gtwce.svg" },
                    { series: "nls", tag: "NLS", title: "KW 6h ADAC Ruhr-Pokal (6h)", time: 'SAT: <span class="hl">10:00</span>', track: "nordschleife-nls.svg" },
                    { series: "imsa", tag: "IMSA", title: "6 Hours of Road America", time: 'RACE: <span class="hl">TBC</span>', track: "roadamerica-imsa.svg" }
                ]
            }
        ]
    },
    {
        month: "AUGUST", weeks: [
            {
                label: "WEEK 32 \u2022 AUG 07-09", events: [
                    { series: "motogp", tag: "MOTOGP", title: "British Grand Prix", time: 'RACE: <span class="hl">15:00</span>', track: "silverstone-motogp.svg" },
                    { series: "btcc", tag: "BTCC", title: "Knockhill (Races 16-18)", time: 'SAT + SUN', track: "knockhill-btcc.svg" },
                    { series: "sf", tag: "S. FORMULA", title: "Sugo", time: 'RACE: <span class="hl">TBC</span>', track: "sugo-sf.svg" },
                    { series: "indycar", tag: "INDYCAR", title: "GP of Portland", time: 'RACE: <span class="hl">TBC</span>', track: "portland-indycar.svg" },
                    { series: "nascar", tag: "NASCAR", title: "Iowa Speedway", time: 'RACE: <span class="hl">TBC</span>', track: "iowa-nascar.svg" }
                ]
            },
            {
                label: "WEEK 33 \u2022 AUG 14-16", events: [
                    { series: "dtm", tag: "DTM", title: "Nürburgring Round", time: 'SAT + SUN', track: "nurburgring-dtm.svg" },
                    { series: "erc", tag: "ERC", title: "Barum Czech Rally Zlín", time: 'FRI > SUN', track: "zlin-erc.svg" },
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
                    { series: "btcc", tag: "BTCC", title: "Donington Park GP (Races 19-21)", time: 'SAT + SUN', track: "donington-btcc.svg" },
                    { series: "supercars", tag: "SUPERCARS", title: "Century Batteries Ipswich Super440", time: 'FRI > SUN', track: "ipswich-supercars.svg" },
                    { series: "imsa", tag: "IMSA", title: "VIR GT Challenge", time: 'RACE: <span class="hl">TBC</span>', track: "vir-imsa.svg" },
                    { series: "elms", tag: "ELMS", title: "4 Hours of Spa-Francorchamps", time: 'SUN: <span class="hl">11:00</span>', track: "spa-elms.svg" },
                    { series: "nascar", tag: "NASCAR", title: "Foxwoods 301 (New Hampshire)", time: 'RACE: <span class="hl">TBC</span>', track: "newhampshire-nascar.svg" }
                ]
            },
            {
                label: "WEEK 35 \u2022 AUG 27-30", events: [
                    { series: "wrc", tag: "WRC", title: "Rally del Paraguay", time: "THU > SUN", track: "paraguay-wrc.svg", sub: [{ badge: "wrc2", label: "WRC2", detail: "ALL STAGES" }] },
                    { series: "motogp", tag: "MOTOGP", title: "Aragon Grand Prix", time: 'RACE: <span class="hl">14:00</span>', track: "aragon-motogp.svg" },
                    { series: "gtwce", tag: "GTWCE", title: "Nürburgring Sprint", time: 'SAT + SUN', track: "nurburgring-gtwce.svg" },
                    { series: "gtwca", tag: "GTWCA", title: "Road America Round", time: 'FRI > SUN', track: "roadamerica-gtwca.svg" },
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
                    { series: "wsbk", tag: "WSBK", title: "Magny-Cours Round", time: 'FRI > SUN', track: "magnycours-wsbk.svg" },
                    { series: "btcc", tag: "BTCC", title: "Croft (Races 22-24)", time: 'SAT + SUN', track: "croft-btcc.svg" },
                    { series: "erc", tag: "ERC", title: "Rali Ceredigion", time: 'FRI > SUN', track: "aberystwyth-erc.svg" },
                    { series: "wec", tag: "WEC", title: "Lone Star Le Mans (COTA)", time: 'RACE: <span class="hl">TBC</span>', track: "cota-wec.svg" },
                    { series: "indycar", tag: "INDYCAR", title: "GP of Monterey (Laguna Seca)", time: 'RACE: <span class="hl">TBC</span>', track: "lagunaseca-indycar.svg" },
                    { series: "nascar", tag: "NASCAR", title: "Southern 500 (Darlington) \u2014 Playoff", time: 'RACE: <span class="hl">TBC</span>', track: "darlington-nascar.svg" }
                ]
            },
            {
                label: "WEEK 37 \u2022 SEP 10-13", events: [
                    { series: "wrc", tag: "WRC", title: "Rally Chile", time: "THU > SUN", track: "chile-wrc.svg", sub: [{ badge: "wrc2", label: "WRC2", detail: "ALL STAGES" }] },
                    {
                        series: "f1", tag: "FORMULA 1", title: "Spanish GP (Madrid)",
                        time: 'QUALI: <span class="hl">15:00</span> \u2022 RACE: <span class="hl">15:00</span>',
                        track: "madrid-f1.svg",
                        sub: [{ badge: "f2", label: "F2", detail: "RACES: TBC" }, { badge: "f3", label: "F3", detail: "FINALE: TBC" }]
                    },
                    { series: "motogp", tag: "MOTOGP", title: "San Marino Grand Prix (Misano)", time: 'RACE: <span class="hl">14:00</span>', track: "misano-motogp.svg" },
                    { series: "dtm", tag: "DTM", title: "Sachsenring Round", time: 'SAT + SUN', track: "sachsenring-dtm.svg" },
                    { series: "supercars", tag: "SUPERCARS", title: "AirTouch 500 at The Bend", time: 'FRI > SUN', track: "thebend-supercars.svg" },
                    { series: "igtc", tag: "IGTC", title: "Suzuka 1000km", time: 'FRI > SUN', track: "suzuka-igtc.svg" },
                    { series: "elms", tag: "ELMS", title: "4 Hours of Silverstone", time: 'SUN: <span class="hl">12:00</span>', track: "silverstone-elms.svg" },
                    { series: "nls", tag: "NLS", title: "Reinoldus + Barbarossapreis II (4h×2)", time: 'SAT + SUN', track: "nordschleife-nls.svg" },
                    { series: "nascar", tag: "NASCAR", title: "Bass Pro Shops Night Race (Bristol) \u2014 Playoff", time: 'RACE: <span class="hl">TBC</span>', track: "bristol-nascar.svg" }
                ]
            },
            {
                label: "WEEK 38 \u2022 SEP 18-20", events: [
                    { series: "motogp", tag: "MOTOGP", title: "Austrian Grand Prix", time: 'RACE: <span class="hl">14:00</span>', track: "redbullring-motogp.svg" },
                    { series: "gtwce", tag: "GTWCE", title: "Zandvoort Sprint", time: 'FRI > SUN', track: "zandvoort-gtwce.svg" },
                    { series: "imsa", tag: "IMSA", title: "Battle on the Bricks (Indy)", time: 'RACE: <span class="hl">TBC</span>', track: "indy-imsa.svg" },
                    { series: "nascar", tag: "NASCAR", title: "Playoff Round 1 Race 3 (TBD)", time: 'RACE: <span class="hl">TBC</span>', track: "tbd-nascar.svg" }
                ]
            },
            {
                label: "WEEK 39 \u2022 SEP 25-27", events: [
                    {
                        series: "f1", tag: "FORMULA 1", title: "Azerbaijan GP",
                        time: 'QUALI: <span class="hl">13:00</span> \u2022 RACE: <span class="hl">13:00</span>',
                        track: "baku-f1.svg",
                        sub: [{ badge: "f2", label: "F2", detail: "RACES: TBC" }]
                    },
                    { series: "wsbk", tag: "WSBK", title: "Cremona Round", time: 'FRI > SUN', track: "cremona-wsbk.svg" },
                    { series: "btcc", tag: "BTCC", title: "Silverstone (Races 25-27)", time: 'SAT + SUN', track: "silverstone-btcc.svg" },
                    { series: "gtwca", tag: "GTWCA", title: "Barber Round", time: 'FRI > SUN', track: "barber-gtwca.svg" },
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
                    { series: "wrc", tag: "WRC", title: "Rally Italy", time: "THU > SUN", track: "sardegna-wrc.svg", sub: [{ badge: "wrc2", label: "WRC2", detail: "ALL STAGES" }] },
                    { series: "motogp", tag: "MOTOGP", title: "Japanese Grand Prix (Motegi)", time: 'RACE: <span class="hl">07:00</span>', track: "motegi-motogp.svg" },
                    { series: "gtwce", tag: "GTWCE", title: "3 Hours of Barcelona", time: 'FRI > SUN', track: "barcelona-gtwce.svg" },
                    { series: "tcr", tag: "TCR", title: "South Korea Round", time: 'FRI > SUN', track: "inje-tcr.svg" },
                    { series: "imsa", tag: "IMSA", title: "Petit Le Mans", time: 'RACE: <span class="hl">TBC</span>', track: "roadatlanta-imsa.svg" },
                    { series: "nascar", tag: "NASCAR", title: "Playoff Round 2 Race 2 (TBD)", time: 'RACE: <span class="hl">TBC</span>', track: "tbd-nascar.svg" }
                ]
            },
            {
                label: "WEEK 41 \u2022 OCT 08-11", events: [
                    {
                        series: "f1", tag: "FORMULA 1", title: "Singapore GP", sprint: true,
                        time: 'SPRINT: <span class="hl">11:00</span> \u2022 QUALI: <span class="hl">14:00</span> \u2022 RACE: <span class="hl">14:00</span>',
                        track: "singapore-f1.svg"
                    },
                    { series: "motogp", tag: "MOTOGP", title: "Indonesian Grand Prix", time: 'RACE: <span class="hl">08:00</span>', track: "mandalika-motogp.svg" },
                    { series: "wsbk", tag: "WSBK", title: "Estoril Round", time: 'FRI > SUN', track: "estoril-wsbk.svg" },
                    { series: "dtm", tag: "DTM", title: "Hockenheimring (Season Finale)", time: 'SAT + SUN', track: "hockenheim-dtm.svg" },
                    { series: "btcc", tag: "BTCC", title: "Brands Hatch GP (Races 28-30, Finale)", time: 'SAT + SUN', track: "brandshatch-btcc.svg" },
                    { series: "supercars", tag: "SUPERCARS", title: "Repco Bathurst 1000", time: 'THU > SUN', track: "bathurst-supercars.svg" },
                    { series: "elms", tag: "ELMS", title: "4 Hours of Portimão (Finale)", time: 'SAT: <span class="hl">12:00</span>', track: "portimao-elms.svg" },
                    { series: "nls", tag: "NLS", title: "NLS Sportwarte-Trophy (4h)", time: 'SAT: <span class="hl">10:00</span>', track: "nordschleife-nls.svg" },
                    { series: "gtwca", tag: "GTWCA", title: "Indianapolis 8 Hour (Finale)", time: 'THU > SUN', track: "indianapolis-gtwca.svg" },
                    { series: "igtc", tag: "IGTC", title: "Indianapolis 8 Hour (Finale)", time: 'THU > SAT', track: "indianapolis-igtc.svg" },
                    { series: "sf", tag: "S. FORMULA", title: "Fuji II", time: 'RACE: <span class="hl">TBC</span>', track: "fuji-sf.svg" },
                    { series: "nascar", tag: "NASCAR", title: "Playoff Round 2 Race 3 (TBD)", time: 'RACE: <span class="hl">TBC</span>', track: "tbd-nascar.svg" }
                ]
            },
            {
                label: "WEEK 42 \u2022 OCT 16-19", events: [
                    { series: "motogp", tag: "MOTOGP", title: "Australian Grand Prix (Phillip Island)", time: 'RACE: <span class="hl">05:00</span>', track: "phillipisland-motogp.svg" },
                    { series: "wsbk", tag: "WSBK", title: "Jerez Round (Season Finale)", time: 'FRI > SUN', track: "jerez-wsbk.svg" },
                    { series: "gtwce", tag: "GTWCE", title: "3 Hours of Portimão", time: 'FRI > SUN', track: "portimao-gtwce.svg" },
                    { series: "tcr", tag: "TCR", title: "Chengdu Round", time: 'FRI > SUN', track: "chengdu-tcr.svg" }
                ]
            },
            {
                label: "WEEK 43 \u2022 OCT 23-26", events: [
                    {
                        series: "f1", tag: "FORMULA 1", title: "United States GP (Austin)",
                        time: 'QUALI: <span class="hl">22:00</span> \u2022 RACE: <span class="hl">21:00</span>',
                        track: "cota-f1.svg"
                    },
                    { series: "f1a", tag: "F1 ACADEMY", title: "Rd 6: COTA", time: 'RACES: <span class="hl">TBC</span>', track: "cota-f1.svg" },
                    { series: "motogp", tag: "MOTOGP", title: "Malaysian Grand Prix (Sepang)", time: 'RACE: <span class="hl">08:00</span>', track: "sepang-motogp.svg" },
                    { series: "supercars", tag: "SUPERCARS", title: "Boost Mobile Gold Coast 500", time: 'FRI > SUN', track: "goldcoast-supercars.svg" },
                    { series: "tcr", tag: "TCR", title: "Zhuzhou Round", time: 'FRI > SUN', track: "zhuzhou-tcr.svg" },
                    { series: "erc", tag: "ERC", title: "Rally Five Cities (Fafe, Finale)", time: 'FRI > SUN', track: "fafe-erc.svg" }
                ]
            },
            {
                label: "WEEK 44 \u2022 OCT 30 - NOV 01", events: [
                    {
                        series: "f1", tag: "FORMULA 1", title: "Mexico City GP",
                        time: 'QUALI: <span class="hl">21:00</span> \u2022 RACE: <span class="hl">21:00</span>',
                        track: "mexico-f1.svg"
                    },
                    { series: "motogp", tag: "MOTOGP", title: "Portuguese Grand Prix", time: 'RACE: <span class="hl">14:00</span>', track: "portimao-motogp.svg" }
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
                label: "WEEK 46 \u2022 NOV 11-15", events: [
                    { series: "wrc", tag: "WRC", title: "Rally Saudi Arabia", time: "THU > SUN", track: "saudi-wrc.svg", sub: [{ badge: "wrc2", label: "WRC2", detail: "ALL STAGES" }] },
                    { series: "supercars", tag: "SUPERCARS", title: "Penrite Oil Sandown 500", time: 'FRI > SUN', track: "sandown-supercars.svg" }
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
                    { series: "motogp", tag: "MOTOGP", title: "Valencian Community GP (Finale)", time: 'RACE: <span class="hl">14:00</span>', track: "valencia-motogp.svg" },
                    { series: "sf", tag: "S. FORMULA", title: "Suzuka II", time: 'RACE: <span class="hl">TBC</span>', track: "suzuka-sf.svg" },
                    { series: "tcr", tag: "TCR", title: "Macau (Season Finale)", time: 'THU > SUN', track: "macau-tcr.svg" }
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
                label: "WEEK 49 \u2022 DEC 03-06", events: [
                    {
                        series: "f1", tag: "FORMULA 1", title: "Abu Dhabi GP",
                        time: 'QUALI: <span class="hl">14:00</span> \u2022 RACE: <span class="hl">14:00</span>',
                        track: "yasmarina-f1.svg",
                        sub: [{ badge: "f2", label: "F2", detail: "FINALE: TBC" }]
                    },
                    { series: "supercars", tag: "SUPERCARS", title: "bp Adelaide Grand Final", time: 'THU > SUN', track: "adelaide-supercars.svg" }
                ]
            }
        ]
    }
];

// =============================================
// SERIES FILTER STATE
// =============================================

// =============================================
// RENDER CALENDAR
// =============================================
function renderEvent(ev) {
    const hasSub = ev.sub && ev.sub.length > 0;
    const sprintBadge = ev.sprint ? ' <span class="sprint-badge">SPRINT</span>' : '';

    let detailsInner = '';
    if (hasSub) {
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
        `<div class="track-map"><img src="assets/track-maps/${ev.track}" alt="2026 ${ev.tag} ${ev.title} track map layout" loading="lazy" width="60" height="60"></div>` +
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
// SERIES FILTER (Region + Category + Advanced)
// =============================================
const seriesLabels = {
    f1: 'F1', f1a: 'F1A', fe: 'FE', sf: 'SF', wec: 'WEC', imsa: 'IMSA', wrc: 'WRC',
    indycar: 'INDYCAR', nascar: 'NASCAR', motogp: 'MOTOGP', wsbk: 'WSBK', dtm: 'DTM',
    btcc: 'BTCC', supercars: 'SUPERCARS', elms: 'ELMS', gtwce: 'GTWCE', gtwca: 'GTWCA',
    nls: 'NLS', igtc: 'IGTC', tcr: 'TCR', erc: 'ERC'
};

// =============================================
// DASHBOARD TOGGLE
// =============================================
function initDashToggle() {
    const dashGrid = document.getElementById('dash-grid');
    const toggleBtn = document.getElementById('dash-toggle-btn');

    if (!dashGrid || !toggleBtn) return;

    toggleBtn.addEventListener('click', () => {
        const isCollapsed = dashGrid.classList.contains('collapsed');

        if (isCollapsed) {
            dashGrid.classList.remove('collapsed');
            toggleBtn.classList.add('expanded');
            toggleBtn.querySelector('span').textContent = 'SHOW LESS';
        } else {
            dashGrid.classList.add('collapsed');
            toggleBtn.classList.remove('expanded');
            toggleBtn.querySelector('span').textContent = 'SEE ALL SERIES';
        }
    });
}

// Don't forget to call it in your INIT section at the bottom!
// 

function initFilters() {
    // --- Region pills ---
    const regionContainer = document.getElementById('region-filters');
    if (!regionContainer) return;

    for (const region of ALL_REGIONS) {
        const btn = document.createElement('button');
        btn.className = 'filter-btn filter-region';
        btn.textContent = region;
        btn.setAttribute('aria-pressed', filterState.regions.includes(region) ? 'true' : 'false');
        if (filterState.regions.includes(region)) btn.classList.add('active');
        btn.addEventListener('click', () => {
            const idx = filterState.regions.indexOf(region);
            if (idx >= 0) {
                filterState.regions.splice(idx, 1);
                btn.classList.remove('active');
                btn.setAttribute('aria-pressed', 'false');
            } else {
                filterState.regions.push(region);
                btn.classList.add('active');
                btn.setAttribute('aria-pressed', 'true');
            }
            saveFilterState();
            applyFilters();
        });
        regionContainer.appendChild(btn);
    }

    // --- Category chips ---
    const catContainer = document.getElementById('category-filters');
    if (!catContainer) return;
    for (const cat of ALL_CATEGORIES) {
        const btn = document.createElement('button');
        btn.className = 'filter-btn filter-category';
        btn.textContent = cat;
        btn.setAttribute('aria-pressed', filterState.categories.includes(cat) ? 'true' : 'false');
        if (filterState.categories.includes(cat)) btn.classList.add('active');
        btn.addEventListener('click', () => {
            const idx = filterState.categories.indexOf(cat);
            if (idx >= 0) {
                filterState.categories.splice(idx, 1);
                btn.classList.remove('active');
                btn.setAttribute('aria-pressed', 'false');
            } else {
                filterState.categories.push(cat);
                btn.classList.add('active');
                btn.setAttribute('aria-pressed', 'true');
            }
            saveFilterState();
            applyFilters();
        });
        catContainer.appendChild(btn);
    }

    // --- Advanced: individual series toggles ---
    const seriesToggles = document.getElementById('series-toggles');
    for (const s of allSeries) {
        const btn = document.createElement('button');
        const isHidden = filterState.hiddenSpecificSeries.includes(s);
        btn.className = `filter-btn filter-${s}${isHidden ? '' : ' active'}`;
        btn.textContent = seriesLabels[s];
        btn.dataset.series = s;
        btn.setAttribute('aria-pressed', isHidden ? 'false' : 'true');
        btn.addEventListener('click', () => {
            const idx = filterState.hiddenSpecificSeries.indexOf(s);
            if (idx >= 0) {
                filterState.hiddenSpecificSeries.splice(idx, 1);
                btn.classList.add('active');
                btn.setAttribute('aria-pressed', 'true');
            } else {
                filterState.hiddenSpecificSeries.push(s);
                btn.classList.remove('active');
                btn.setAttribute('aria-pressed', 'false');
            }
            saveFilterState();
            applyFilters();
        });
        seriesToggles.appendChild(btn);
    }

    // --- Clear Filters button ---
    const clearBtn = document.getElementById('clear-filters-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            filterState.regions = [];
            filterState.categories = [];
            filterState.hiddenSpecificSeries = [];
            saveFilterState();
            // Reset all button states
            document.querySelectorAll('.filter-region, .filter-category').forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            document.querySelectorAll('#series-toggles .filter-btn').forEach(b => {
                b.classList.add('active');
                b.setAttribute('aria-pressed', 'true');
            });
            applyFilters();
        });
    }
}

// Determine if a series is visible given the current filter state
function isSeriesVisible(seriesKey) {
    const meta = seriesMetadata[seriesKey];
    if (!meta) return true;

    // Explicitly hidden in advanced overrides
    if (filterState.hiddenSpecificSeries.includes(seriesKey)) return false;

    // Region filter: if any regions selected, series must match one (OR within regions)
    if (filterState.regions.length > 0) {
        if (!filterState.regions.includes(meta.region)) return false;
    }

    // Category filter: if any categories selected, series must match one (OR within categories)
    if (filterState.categories.length > 0) {
        if (!filterState.categories.includes(meta.category)) return false;
    }

    return true;
}

function applyFilters() {
    // Calendar events
    const events = document.querySelectorAll('.event[data-series]');
    for (const ev of events) {
        ev.style.display = isSeriesVisible(ev.dataset.series) ? '' : 'none';
    }

    // Hide week cards with no visible events
    const cards = document.querySelectorAll('.card');
    for (const card of cards) {
        const visibleEvents = card.querySelectorAll('.event[data-series]');
        const allHidden = Array.from(visibleEvents).every(ev => ev.style.display === 'none');
        card.style.display = allHidden ? 'none' : '';
    }

    // Dashboard sync: hide/show countdown cards
    const dashCards = document.querySelectorAll('.dash-card[data-series]');
    for (const dc of dashCards) {
        dc.style.display = isSeriesVisible(dc.dataset.series) ? '' : 'none';
    }

    // Empty state
    const calContainer = document.getElementById('calendar-container');
    const emptyState = document.getElementById('empty-state');
    if (calContainer && emptyState) {
        const anyVisible = calContainer.querySelector('.card:not([style*="display: none"])');
        emptyState.hidden = !!anyVisible;
    }

    // Sync filter state to URL params
    filterStateToURL();
}

// =============================================
// AUTO-SCROLL TO CURRENT WEEK
// =============================================
function scrollToCurrentWeek() {
    const now = Date.now();
    const allEvents = document.querySelectorAll('.event[data-series]');
    for (const ev of allEvents) {
        const series = ev.dataset.series;
        const list = seriesData[series];
        if (!list) continue;
        const match = list.find(r => r._ts > now);
        if (match) {
            const card = ev.closest('.card');
            if (card) {
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
// PAST EVENTS — collapsible accordion
// =============================================
function dimPastEvents() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentDate = now.getDate();

    const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
        "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
    const shortMonths = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

    const pastContainer = document.getElementById('past-events-container');
    const pastSummary = document.getElementById('past-events-summary');
    const calContainer = document.getElementById('calendar-container');
    if (!pastContainer || !calContainer) return;

    // Collect past month sections and move them into the accordion
    let pastMonthCount = 0;
    const monthHeaders = Array.from(calContainer.querySelectorAll('.month-header'));

    for (const header of monthHeaders) {
        const monthIdx = monthNames.indexOf(header.textContent);
        if (monthIdx >= 0 && monthIdx < currentMonth) {
            const grid = header.nextElementSibling;
            pastContainer.appendChild(header);
            if (grid && grid.classList.contains('cal-grid')) {
                pastContainer.appendChild(grid);
            }
            pastMonthCount++;
        }
    }

    // Dim past week cards in the current month (still in main calendar)
    const cards = calContainer.querySelectorAll('.card');
    for (const card of cards) {
        const headText = card.querySelector('.c-head')?.textContent || '';
        const dateMatches = headText.match(/\d{2}/g);
        if (!dateMatches) continue;
        const lastDate = parseInt(dateMatches[dateMatches.length - 1]);
        const monthMatch = headText.match(/JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC/);
        if (!monthMatch) continue;
        const cardMonth = shortMonths.indexOf(monthMatch[0]);
        if (cardMonth < currentMonth || (cardMonth === currentMonth && lastDate < currentDate)) {
            card.classList.add('past');
        }
    }

    // Update summary text
    if (pastMonthCount > 0 && pastSummary) {
        pastSummary.textContent = `View Past Events (${pastMonthCount} Month${pastMonthCount > 1 ? 's' : ''})`;
        pastContainer.addEventListener('toggle', () => {
            pastSummary.setAttribute('aria-expanded', pastContainer.open ? 'true' : 'false');
        });
    } else {
        pastContainer.hidden = true;
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
    const sibling = btn.parentElement?.nextElementSibling;
    if (sibling) sibling.classList.toggle('open');
};

// =============================================
// SEO: INJECT JSON-LD EVENT SCHEMA
// =============================================
function injectSchema() {
    const now = Date.now();
    let upcomingEvents = [];

    // Grab the next upcoming race from each series
    for (const [series, list] of Object.entries(seriesData)) {
        const nextRace = list.find(r => r._ts > now);
        if (nextRace) {
            upcomingEvents.push({
                "@type": "Event",
                "name": `${seriesMetadata[series].name} - ${nextRace.name}`,
                "startDate": nextRace.date,
                "eventStatus": "https://schema.org/EventScheduled",
                "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
                "location": {
                    "@type": "Place",
                    "name": "TBC - See Website for Track Details"
                }
            });
        }
    }

    if (upcomingEvents.length > 0) {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.text = JSON.stringify({
            "@context": "https://schema.org",
            "@graph": upcomingEvents
        });
        document.head.appendChild(script);
    }
}
// Add injectSchema(); to the bottom of your script file!

// =============================================
// INIT
// =============================================
renderCalendar();
initDashToggle();
initFilters();
applyFilters();
dimPastEvents();
update();
injectSchema()
// Delay scroll slightly so layout is settled
setTimeout(scrollToCurrentWeek, 100);

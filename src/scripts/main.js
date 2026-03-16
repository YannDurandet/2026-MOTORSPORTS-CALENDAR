// =============================================
// TIMEZONE CONVERSION
// =============================================
const SOURCE_TIMEZONE = "Europe/Paris";
const USER_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
const NEEDS_TZ_CONVERSION = SOURCE_TIMEZONE !== USER_TIMEZONE;

const MONTH_MAP = { JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11 };

function parseWeekDate(weekLabel) {
    const m = weekLabel.match(/\u2022\s*([A-Z]{3})\s+(\d{1,2})(?:\s*-\s*(\d{1,2}))?/);
    if (!m) return null;
    const mo = MONTH_MAP[m[1]];
    if (mo === undefined) return null;
    const day = m[3] ? parseInt(m[3]) : parseInt(m[2]);
    return new Date(2026, mo, day);
}

function convertHHMM(hhmm, refDate) {
    const [h, mm] = hhmm.split(':').map(Number);
    const fakeUtc = new Date(Date.UTC(2026, refDate.getMonth(), refDate.getDate(), h, mm, 0));
    const utcParsed = new Date(fakeUtc.toLocaleString('en-US', { timeZone: 'UTC' }));
    const srcParsed = new Date(fakeUtc.toLocaleString('en-US', { timeZone: SOURCE_TIMEZONE }));
    const realUtc = new Date(fakeUtc.getTime() + (utcParsed - srcParsed));

    const converted = realUtc.toLocaleTimeString('en-GB', {
        timeZone: USER_TIMEZONE, hour: '2-digit', minute: '2-digit', hour12: false
    });

    const srcDay = refDate.getDate();
    const tgtDay = parseInt(new Intl.DateTimeFormat('en-GB', {
        timeZone: USER_TIMEZONE, day: 'numeric'
    }).format(realUtc));

    if (tgtDay !== srcDay) {
        let diff = tgtDay - srcDay;
        const daysInMonth = new Date(2026, refDate.getMonth() + 1, 0).getDate();
        if (diff > 15) diff -= daysInMonth;
        if (diff < -15) diff += daysInMonth;
        return `${converted}<sup class="tz-day">${diff > 0 ? '+' : ''}${diff}</sup>`;
    }
    return converted;
}

function convertTimeStr(timeHtml, weekLabel) {
    if (!NEEDS_TZ_CONVERSION) return timeHtml;
    const refDate = parseWeekDate(weekLabel);
    if (!refDate) return timeHtml;
    return timeHtml.replace(/<span class="hl">(\d{2}:\d{2})<\/span>/g, (_, hhmm) => {
        return `<span class="hl">${convertHHMM(hhmm, refDate)}</span>`;
    });
}

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
    erc: { name: "ERC", category: "Rally", region: "Europe" },
    h24eu: { name: "24H European Series", category: "Endurance", region: "Europe" }
};

// =============================================
// FILTER CONSTANTS
// =============================================
const allSeries = ['f1', 'f1a', 'fe', 'sf', 'wec', 'imsa', 'wrc', 'indycar', 'nascar', 'motogp', 'wsbk', 'dtm', 'btcc', 'supercars', 'elms', 'gtwce', 'gtwca', 'nls', 'igtc', 'tcr', 'erc', 'h24eu'];
const ALL_REGIONS = ['Worldwide', 'Europe', 'USA', 'Asia & Oceania'];
const ALL_CATEGORIES = ['Open Wheel', 'Endurance', 'Rally', 'Touring', 'Bike', 'GT / Sports Car'];

const seriesLabels = {
    f1: 'F1', f1a: 'F1A', fe: 'FE', sf: 'SF', wec: 'WEC', imsa: 'IMSA', wrc: 'WRC',
    indycar: 'INDYCAR', nascar: 'NASCAR', motogp: 'MOTOGP', wsbk: 'WSBK', dtm: 'DTM',
    btcc: 'BTCC', supercars: 'SUPERCARS', elms: 'ELMS', gtwce: 'GTWCE', gtwca: 'GTWCA',
    nls: 'NLS', igtc: 'IGTC', tcr: 'TCR', erc: 'ERC', h24eu: '24H EU'
};

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
    if (regionParam) state.regions = regionParam.split(',').filter(r => ALL_REGIONS.includes(r));
    if (categoryParam) state.categories = categoryParam.split(',').filter(c => ALL_CATEGORIES.includes(c));
    if (hiddenParam) state.hiddenSpecificSeries = hiddenParam.split(',').filter(s => allSeries.includes(s));
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

// Data loaded from JSON via fetch
let seriesData = {};

// =============================================
// ICS EXPORT
// =============================================
function findSeriesDate(seriesKey, weekLabel) {
    const list = seriesData[seriesKey];
    if (!list) return null;
    const refDate = parseWeekDate(weekLabel);
    if (!refDate) return null;
    const m = weekLabel.match(/\u2022\s*([A-Z]{3})\s+(\d{1,2})/);
    if (!m) return null;
    const startDay = parseInt(m[2]);
    const weekStart = new Date(2026, MONTH_MAP[m[1]], startDay);
    const weekEnd = new Date(refDate.getTime() + 86400000);
    return list.find(r => {
        const d = new Date(r.date);
        return d >= weekStart && d <= weekEnd;
    }) || null;
}

function generateICS(seriesName, eventTitle, isoDateStr) {
    const d = new Date(isoDateStr);
    const fmt = dt => dt.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const end = new Date(d.getTime() + 7200000);
    const uid = `${eventTitle.replace(/\s+/g, '-')}-${fmt(d)}@motorsport-calendar`;
    return [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MotorsportCalendar//EN',
        'BEGIN:VEVENT', `DTSTART:${fmt(d)}`, `DTEND:${fmt(end)}`,
        `SUMMARY:${seriesName} — ${eventTitle}`, `UID:${uid}`,
        'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
}

function downloadICS(icsContent, filename) {
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// =============================================
// "THIS WEEKEND" SECTION
// =============================================
function getWeekRaces() {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    let races = findRacesInWindow(monday.getTime(), sunday.getTime());
    if (races.length === 0) {
        const nextMon = monday.getTime() + 7 * 86400000;
        const nextSun = sunday.getTime() + 7 * 86400000;
        races = findRacesInWindow(nextMon, nextSun);
    }
    return races;
}

function findRacesInWindow(startTs, endTs) {
    const now = Date.now();
    const races = [];
    for (const [key, list] of Object.entries(seriesData)) {
        if (!isSeriesVisible(key)) continue;
        for (const r of list) {
            if (r._ts >= startTs && r._ts <= endTs) {
                races.push({ seriesKey: key, name: r.name, date: r.date, _ts: r._ts, finished: r._ts < now });
            }
        }
    }
    return races.sort((a, b) => {
        if (a.finished !== b.finished) return a.finished ? 1 : -1;
        return a._ts - b._ts;
    });
}

function formatRaceTime(isoDate) {
    const d = new Date(isoDate);
    const day = d.toLocaleDateString('en-GB', { timeZone: USER_TIMEZONE, weekday: 'short' }).toUpperCase();
    const time = d.toLocaleTimeString('en-GB', { timeZone: USER_TIMEZONE, hour: '2-digit', minute: '2-digit', hour12: false });
    return `${day} ${time}`;
}

function renderThisWeekend() {
    const section = document.getElementById('this-weekend');
    const grid = document.getElementById('this-weekend-grid');
    if (!section || !grid) return;

    const races = getWeekRaces();
    if (races.length === 0) { section.hidden = true; return; }
    section.hidden = false;

    let html = '';
    for (const r of races) {
        const finishedClass = r.finished ? ' tw-card-finished' : '';
        html += `<div class="tw-card ev-${r.seriesKey}${finishedClass}">`;
        html += `<span class="tag t-${r.seriesKey}">${seriesLabels[r.seriesKey] || r.seriesKey.toUpperCase()}</span>`;
        html += `<div class="tw-name">${r.name}</div>`;
        html += `<div class="tw-time">${formatRaceTime(r.date)}</div>`;
        if (r.finished) {
            html += `<div class="tw-finished">FINISHED</div>`;
        } else {
            html += `<div class="tw-countdown" data-ts="${r._ts}">--</div>`;
        }
        html += '</div>';
    }
    grid.innerHTML = html;
    updateThisWeekendCountdowns();
}

function updateThisWeekendCountdowns() {
    const now = Date.now();
    document.querySelectorAll('.tw-countdown[data-ts]').forEach(el => {
        const ts = parseInt(el.dataset.ts);
        const diff = ts - now;
        if (diff <= 0) {
            const card = el.closest('.tw-card');
            if (card) card.classList.add('tw-card-finished');
            const fin = document.createElement('div');
            fin.className = 'tw-finished';
            fin.textContent = 'FINISHED';
            el.replaceWith(fin);
        } else {
            const d = Math.floor(diff / 864e5), h = Math.floor((diff % 864e5) / 36e5),
                  m = Math.floor((diff % 36e5) / 6e4), s = Math.floor((diff % 6e4) / 1000);
            el.textContent = d > 0 ? `${d}d ${h}h ${m}m ${s}s` : `${h}h ${m}m ${s}s`;
        }
    });
}

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

// =============================================
// FILTERS
// =============================================
function initFilters() {
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
            if (idx >= 0) { filterState.regions.splice(idx, 1); btn.classList.remove('active'); btn.setAttribute('aria-pressed', 'false'); }
            else { filterState.regions.push(region); btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true'); }
            saveFilterState(); applyFilters();
        });
        regionContainer.appendChild(btn);
    }

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
            if (idx >= 0) { filterState.categories.splice(idx, 1); btn.classList.remove('active'); btn.setAttribute('aria-pressed', 'false'); }
            else { filterState.categories.push(cat); btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true'); }
            saveFilterState(); applyFilters();
        });
        catContainer.appendChild(btn);
    }

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
            if (idx >= 0) { filterState.hiddenSpecificSeries.splice(idx, 1); btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true'); }
            else { filterState.hiddenSpecificSeries.push(s); btn.classList.remove('active'); btn.setAttribute('aria-pressed', 'false'); }
            saveFilterState(); applyFilters();
        });
        seriesToggles.appendChild(btn);
    }

    const clearBtn = document.getElementById('clear-filters-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            filterState.regions = []; filterState.categories = []; filterState.hiddenSpecificSeries = [];
            saveFilterState();
            document.querySelectorAll('.filter-region, .filter-category').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
            document.querySelectorAll('#series-toggles .filter-btn').forEach(b => { b.classList.add('active'); b.setAttribute('aria-pressed', 'true'); });
            applyFilters();
        });
    }
}

function isSeriesVisible(seriesKey) {
    const meta = seriesMetadata[seriesKey];
    if (!meta) return true;
    if (filterState.hiddenSpecificSeries.includes(seriesKey)) return false;
    if (filterState.regions.length > 0 && !filterState.regions.includes(meta.region)) return false;
    if (filterState.categories.length > 0 && !filterState.categories.includes(meta.category)) return false;
    return true;
}

function applyFilters() {
    const events = document.querySelectorAll('.event[data-series]');
    for (const ev of events) {
        ev.style.display = isSeriesVisible(ev.dataset.series) ? '' : 'none';
    }
    const cards = document.querySelectorAll('.card');
    for (const card of cards) {
        const visibleEvents = card.querySelectorAll('.event[data-series]');
        const allHidden = Array.from(visibleEvents).every(ev => ev.style.display === 'none');
        card.style.display = allHidden ? 'none' : '';
    }
    const dashCards = document.querySelectorAll('.dash-card[data-series]');
    for (const dc of dashCards) {
        dc.style.display = isSeriesVisible(dc.dataset.series) ? '' : 'none';
    }
    const calContainer = document.getElementById('calendar-container');
    const emptyState = document.getElementById('empty-state');
    if (calContainer && emptyState) {
        const anyVisible = calContainer.querySelector('.card:not([style*="display: none"])');
        emptyState.hidden = !!anyVisible;
    }
    filterStateToURL();
    renderThisWeekend();
}

// =============================================
// AUTO-SCROLL
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
                if (monthHeader) monthHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
                else card.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }
        }
    }
}

// =============================================
// PAST EVENTS
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

    let pastMonthCount = 0;
    const monthHeaders = Array.from(calContainer.querySelectorAll('.month-header'));

    for (const header of monthHeaders) {
        const monthIdx = monthNames.indexOf(header.textContent);
        if (monthIdx >= 0 && monthIdx < currentMonth) {
            const grid = header.nextElementSibling;
            pastContainer.appendChild(header);
            if (grid && grid.classList.contains('cal-grid')) pastContainer.appendChild(grid);
            pastMonthCount++;
        }
    }

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
let els = {};
let nextIdx = {};

function initCountdown() {
    els = Object.keys(seriesData).reduce((acc, k) => {
        acc[k] = { t: document.getElementById(`t-${k}`), n: document.querySelector(`.dc-${k} .dc-next`) };
        return acc;
    }, {});
    nextIdx = {};
    for (const k of Object.keys(seriesData)) nextIdx[k] = 0;
}

function update() {
    const now = Date.now();
    for (const [k, list] of Object.entries(seriesData)) {
        const el = els[k];
        if (!el || !el.t) continue;
        while (nextIdx[k] < list.length && list[nextIdx[k]]._ts <= now) nextIdx[k]++;

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
    updateThisWeekendCountdowns();
}

let timerInterval = setInterval(update, 1000);
document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearInterval(timerInterval);
    else { update(); timerInterval = setInterval(update, 1000); }
});

// =============================================
// TIMEZONE CONVERSION ON PRE-RENDERED HTML
// =============================================
function convertPreRenderedTimes() {
    if (!NEEDS_TZ_CONVERSION) return;
    // Find all meta-time spans and convert their hl times
    document.querySelectorAll('.card').forEach(card => {
        const headEl = card.querySelector('.c-head');
        if (!headEl) return;
        const weekLabel = headEl.textContent;
        card.querySelectorAll('.meta-time').forEach(metaTime => {
            metaTime.innerHTML = convertTimeStr(metaTime.innerHTML, weekLabel);
        });
    });
}

// =============================================
// SEO: INJECT JSON-LD EVENT SCHEMA
// =============================================
function injectSchema() {
    const now = Date.now();
    let upcomingEvents = [];
    for (const [series, list] of Object.entries(seriesData)) {
        const nextRace = list.find(r => r._ts > now);
        if (nextRace) {
            upcomingEvents.push({
                "@type": "Event",
                "name": `${seriesMetadata[series].name} - ${nextRace.name}`,
                "startDate": nextRace.date,
                "eventStatus": "https://schema.org/EventScheduled",
                "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
                "location": { "@type": "Place", "name": "TBC - See Website for Track Details" }
            });
        }
    }
    if (upcomingEvents.length > 0) {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.text = JSON.stringify({ "@context": "https://schema.org", "@graph": upcomingEvents });
        document.head.appendChild(script);
    }
}

// =============================================
// SUPPORT RACE TOGGLE (arrow buttons)
// =============================================
function initToggle() {
    document.querySelectorAll('.arrow-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            const sibling = btn.parentElement?.nextElementSibling;
            if (sibling) sibling.classList.toggle('open');
        });
    });
}

// =============================================
// ICS HANDLER
// =============================================
function initICSHandler() {
    const container = document.getElementById('calendar-container');
    if (!container) return;
    container.addEventListener('click', e => {
        const btn = e.target.closest('.ics-btn');
        if (!btn) return;
        e.stopPropagation();
        const { series, title, week } = btn.dataset;
        const match = findSeriesDate(series, week);
        if (!match) return;
        const meta = seriesMetadata[series];
        const seriesName = meta ? meta.name : series.toUpperCase();
        const ics = generateICS(seriesName, title, match.date);
        downloadICS(ics, `${series}-${title.replace(/\s+/g, '-').toLowerCase()}.ics`);
    });
}

// =============================================
// INIT
// =============================================
(async function init() {
    // Only need series.json for countdowns/ICS — calendar HTML is pre-rendered
    const base = document.querySelector('meta[name="astro-base"]')?.getAttribute('content') || '';
    const seriesRes = await fetch(`${base}/data/series.json`);
    seriesData = await seriesRes.json();

    // Pre-cache timestamps
    for (const list of Object.values(seriesData)) {
        for (const race of list) {
            race._ts = new Date(race.date).getTime();
        }
    }

    // Convert times for non-Paris timezones
    convertPreRenderedTimes();

    // Initialize interactive features
    initToggle();
    initICSHandler();
    initDashToggle();
    initFilters();
    applyFilters();
    renderThisWeekend();
    dimPastEvents();
    initCountdown();
    update();
    injectSchema();

    // Update timezone notice
    const tzNotice = document.querySelector('.meta');
    if (tzNotice) {
        const friendlyTz = USER_TIMEZONE.replace(/_/g, ' ');
        if (NEEDS_TZ_CONVERSION) {
            tzNotice.textContent = `ALL TIMES IN YOUR TIMEZONE: ${friendlyTz.toUpperCase()}`;
        } else {
            tzNotice.textContent = `SYSTEM TIMEZONE: PARIS (CET/CEST)`;
        }
    }

    setTimeout(scrollToCurrentWeek, 100);
})();

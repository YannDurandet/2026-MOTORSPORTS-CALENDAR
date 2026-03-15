// =============================================
// TIMEZONE CONVERSION
// =============================================
const SOURCE_TIMEZONE = "Europe/Paris";
const USER_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
const NEEDS_TZ_CONVERSION = SOURCE_TIMEZONE !== USER_TIMEZONE;

const MONTH_MAP = { JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11 };

// Parse week label like "WEEK 10 • MAR 05-08" → Date(2026, 2, 8) (last day = race day)
function parseWeekDate(weekLabel) {
    const m = weekLabel.match(/\u2022\s*([A-Z]{3})\s+(\d{1,2})(?:\s*-\s*(\d{1,2}))?/);
    if (!m) return null;
    const mo = MONTH_MAP[m[1]];
    if (mo === undefined) return null;
    const day = m[3] ? parseInt(m[3]) : parseInt(m[2]);
    return new Date(2026, mo, day);
}

// Convert "HH:MM" from Europe/Paris to user's timezone on a given date
// Uses the double-parse trick: browser local TZ cancels out in the subtraction
function convertHHMM(hhmm, refDate) {
    const [h, mm] = hhmm.split(':').map(Number);
    const fakeUtc = new Date(Date.UTC(2026, refDate.getMonth(), refDate.getDate(), h, mm, 0));
    const utcParsed = new Date(fakeUtc.toLocaleString('en-US', { timeZone: 'UTC' }));
    const srcParsed = new Date(fakeUtc.toLocaleString('en-US', { timeZone: SOURCE_TIMEZONE }));
    const realUtc = new Date(fakeUtc.getTime() + (utcParsed - srcParsed));

    const converted = realUtc.toLocaleTimeString('en-GB', {
        timeZone: USER_TIMEZONE, hour: '2-digit', minute: '2-digit', hour12: false
    });

    // Detect day change
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

// Replace all <span class="hl">HH:MM</span> in a time HTML string with converted times
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

// Data loaded from JSON files via fetch() in init()
let seriesData = {};
let calendarData = [];
let resultsData = {};
let resultsLookup = {}; // key: "series|EVENT" → array of result objects

// =============================================
// ICS EXPORT (Add to Calendar)
// =============================================
const ICS_ICON = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="12" height="11" rx="1.5"/><path d="M5 1v3M11 1v3M2 7h12"/></svg>';

function findSeriesDate(seriesKey, weekLabel) {
    const list = seriesData[seriesKey];
    if (!list) return null;
    const refDate = parseWeekDate(weekLabel);
    if (!refDate) return null;
    // Get week start from label
    const m = weekLabel.match(/\u2022\s*([A-Z]{3})\s+(\d{1,2})/);
    if (!m) return null;
    const startDay = parseInt(m[2]);
    const weekStart = new Date(2026, MONTH_MAP[m[1]], startDay);
    const weekEnd = new Date(refDate.getTime() + 86400000); // end of last day
    return list.find(r => {
        const d = new Date(r.date);
        return d >= weekStart && d <= weekEnd;
    }) || null;
}

function generateICS(seriesName, eventTitle, isoDateStr) {
    const d = new Date(isoDateStr);
    const fmt = dt => dt.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const end = new Date(d.getTime() + 7200000); // +2h
    const uid = `${eventTitle.replace(/\s+/g, '-')}-${fmt(d)}@motorsport-calendar`;
    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//MotorsportCalendar//EN',
        'BEGIN:VEVENT',
        `DTSTART:${fmt(d)}`,
        `DTEND:${fmt(end)}`,
        `SUMMARY:${seriesName} — ${eventTitle}`,
        `UID:${uid}`,
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');
}

function downloadICS(icsContent, filename) {
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// =============================================
// "WHAT'S ON THIS WEEKEND" SECTION
// =============================================
function getWeekRaces() {
    const now = new Date();
    // Monday 00:00 of current week (local time)
    const monday = new Date(now);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    // Sunday 23:59:59
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    let races = findRacesInWindow(monday.getTime(), sunday.getTime());
    // If nothing this week, look ahead to next week
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
    // Upcoming first (sorted by time), then finished at the bottom
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
    if (races.length === 0) {
        section.hidden = true;
        return;
    }
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
            // Race has started — replace countdown with FINISHED label
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
// RESULTS HELPERS
// =============================================
function shortenDriver(name) {
    if (!name) return '';
    // Handle multi-driver (e.g. "Felipe Nasr / Julien Andlauer / Laurin Heinrich")
    const drivers = name.split('/').map(d => d.trim());
    const first = drivers[0].split(' ');
    const short = first.length > 1 ? first[0][0] + '. ' + first.slice(1).join(' ') : first[0];
    return drivers.length > 1 ? short + ' +' + (drivers.length - 1) : short;
}

function findResultsForEvent(seriesKey, weekLabel) {
    // Match calendar event to series.json entry via week date range, then look up results
    const match = findSeriesDate(seriesKey, weekLabel);
    if (!match) return null;
    return resultsLookup[seriesKey + '|' + match.name];
}

function renderResultBadge(ev, weekLabel) {
    const results = findResultsForEvent(ev.series, weekLabel);
    if (!results || !results.length) return '';
    let html = '';
    for (const r of results) {
        if (r.driver === null) {
            html += `<div class="result-line result-cancelled">Cancelled</div>`;
        } else {
            const note = r.note ? ` <span class="result-note">(${r.note})</span>` : '';
            html += `<div class="result-line"><span class="result-icon">\u2605</span><span class="result-driver">${shortenDriver(r.driver)}</span><span class="result-team">${r.team}${note}</span></div>`;
        }
    }
    return html;
}

// =============================================
// RENDER CALENDAR
// =============================================
function renderEvent(ev, weekLabel) {
    const hasSub = ev.sub && ev.sub.length > 0;
    const sprintBadge = ev.sprint ? ' <span class="sprint-badge">SPRINT</span>' : '';
    const displayTime = convertTimeStr(ev.time, weekLabel);
    const hasTimes = /\d{2}:\d{2}/.test(ev.time) && !/TBC/.test(ev.time);
    const icsBtn = hasTimes ? `<button class="ics-btn" aria-label="Add to calendar" data-series="${ev.series}" data-title="${ev.title}" data-week="${weekLabel}">${ICS_ICON}</button>` : '';
    const resultHtml = renderResultBadge(ev, weekLabel);

    let detailsInner = '';
    if (hasSub) {
        detailsInner += '<div class="toggle-row"><div>';
        detailsInner += `<span class="tag t-${ev.series}">${ev.tag}${sprintBadge}</span>`;
        detailsInner += `<span class="title">${ev.title}</span>`;
        detailsInner += `<span class="meta-time">${displayTime}${icsBtn}</span>`;
        detailsInner += resultHtml;
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
        detailsInner += `<span class="meta-time">${displayTime}${icsBtn}</span>`;
        detailsInner += resultHtml;
    }

    return `<div class="event ev-${ev.series}" data-series="${ev.series}">` +
        `<div class="ev-details">${detailsInner}</div>` +
        `<div class="track-map"><img src="assets/track-maps/${ev.track}" alt="2026 ${ev.tag} ${ev.title} track map layout" loading="lazy" width="60" height="60"></div>` +
        '</div>';
}

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
                html += renderEvent(ev, week.label);
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

    // Update "This Weekend" section
    renderThisWeekend();
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
let els = {};
let nextIdx = {};

function initCountdown() {
    els = Object.keys(seriesData).reduce((acc, k) => {
        acc[k] = { t: document.getElementById(`t-${k}`), n: document.querySelector(`.dc-${k} .dc-next`) };
        return acc;
    }, {});
    nextIdx = {};
    for (const k of Object.keys(seriesData)) {
        nextIdx[k] = 0;
    }
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
    updateThisWeekendCountdowns();
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
(async function init() {
    // Fetch data files in parallel
    const [seriesRes, calendarRes, resultsRes] = await Promise.all([
        fetch('data/series.json'),
        fetch('data/calendar.json'),
        fetch('data/results.json')
    ]);
    seriesData = await seriesRes.json();
    calendarData = await calendarRes.json();
    resultsData = await resultsRes.json();

    // Build results lookup: "series|EVENT" → [result, ...]
    for (const [series, races] of Object.entries(resultsData)) {
        for (const r of races) {
            const key = series + '|' + r.event;
            if (!resultsLookup[key]) resultsLookup[key] = [];
            resultsLookup[key].push(r);
        }
    }

    // Pre-cache timestamps for countdown performance
    for (const list of Object.values(seriesData)) {
        for (const race of list) {
            race._ts = new Date(race.date).getTime();
        }
    }

    renderCalendar();
    initICSHandler();
    initDashToggle();
    initFilters();
    applyFilters();
    renderThisWeekend();
    dimPastEvents();
    initCountdown();
    update();
    injectSchema();

    // Update timezone notice in header
    const tzNotice = document.querySelector('.meta');
    if (tzNotice) {
        const friendlyTz = USER_TIMEZONE.replace(/_/g, ' ');
        if (NEEDS_TZ_CONVERSION) {
            tzNotice.textContent = `ALL TIMES IN YOUR TIMEZONE: ${friendlyTz.toUpperCase()}`;
        } else {
            tzNotice.textContent = `SYSTEM TIMEZONE: PARIS (CET/CEST)`;
        }
    }

    // Delay scroll slightly so layout is settled
    setTimeout(scrollToCurrentWeek, 100);
})();

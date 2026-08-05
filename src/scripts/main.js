// =============================================
// TIMEZONE CONVERSION \u2014 imported from shared tz.js
// =============================================
import {
    SOURCE_TIMEZONE, DETECTED_TIMEZONE, USER_TIMEZONE, TZ_IS_OVERRIDE,
    NEEDS_TZ_CONVERSION, MONTH_MAP, DAY_MAP,
    parseWeekDate, convertHHMM, convertTimeStr
} from './tz.js';

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
    h24eu: { name: "24H European Series", category: "Endurance", region: "Europe" },
    psc: { name: "Porsche Supercup", category: "GT / Sports Car", region: "Europe" },
    bgt: { name: "British GT", category: "GT / Sports Car", region: "Europe" },
    eurx: { name: "Euro RX", category: "Rally", region: "Europe" },
    'asian-le-mans': { name: "Asian Le Mans Series", category: "Endurance", region: "Worldwide" }
};

// =============================================
// FILTER CONSTANTS
// =============================================
const allSeries = ['f1', 'f1a', 'fe', 'sf', 'wec', 'imsa', 'wrc', 'indycar', 'nascar', 'motogp', 'wsbk', 'dtm', 'btcc', 'supercars', 'elms', 'gtwce', 'gtwca', 'nls', 'igtc', 'tcr', 'erc', 'h24eu', 'psc', 'bgt', 'eurx', 'asian-le-mans'];
const ALL_REGIONS = ['Worldwide', 'Europe', 'USA', 'Asia & Oceania'];
const ALL_CATEGORIES = ['Open Wheel', 'Endurance', 'Rally', 'Touring', 'Bike', 'GT / Sports Car'];

const seriesLabels = {
    f1: 'F1', f1a: 'F1A', fe: 'FE', sf: 'SF', wec: 'WEC', imsa: 'IMSA', wrc: 'WRC',
    indycar: 'INDYCAR', nascar: 'NASCAR', motogp: 'MOTOGP', wsbk: 'WSBK', dtm: 'DTM',
    btcc: 'BTCC', supercars: 'SUPERCARS', elms: 'ELMS', gtwce: 'GTWCE', gtwca: 'GTWCA',
    nls: 'NLS', igtc: 'IGTC', tcr: 'TCR', erc: 'ERC', h24eu: '24H EU',
    psc: 'PORSCHE SC', bgt: 'BRITISH GT', eurx: 'EURO RX', 'asian-le-mans': 'ASIAN LMS'
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
    // Extend 12h past Sunday midnight to catch races that start at midnight
    // in CET (e.g. 18:00 EDT Sunday = 00:00 CEST Monday)
    const weekEnd = sunday.getTime() + 12 * 3600000;

    let races = findRacesInWindow(monday.getTime(), weekEnd);
    if (races.length === 0) {
        const nextMon = monday.getTime() + 7 * 86400000;
        const nextEnd = weekEnd + 7 * 86400000;
        races = findRacesInWindow(nextMon, nextEnd);
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

    const allRaces = getWeekRaces();
    // Only show upcoming races; hide finished ones so a midnight race doesn't
    // linger as "FINISHED" in the next morning's widget.
    const races = allRaces.filter(r => !r.finished);
    if (races.length === 0) { section.hidden = true; return; }
    section.hidden = false;

    let html = '';
    for (const r of races) {
        html += `<div class="tw-card ev-${r.seriesKey}">`;
        html += `<span class="tag t-${r.seriesKey}">${seriesLabels[r.seriesKey] || r.seriesKey.toUpperCase()}</span>`;
        html += `<div class="tw-name">${r.name}</div>`;
        html += `<div class="tw-time">${formatRaceTime(r.date)}</div>`;
        html += `<div class="tw-countdown" data-ts="${r._ts}">--</div>`;
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

    // Select All / Deselect All utility buttons
    const selectAllBtn = document.createElement('button');
    selectAllBtn.className = 'filter-btn filter-util';
    selectAllBtn.textContent = 'SELECT ALL';
    selectAllBtn.setAttribute('aria-label', 'Select all series');
    selectAllBtn.addEventListener('click', () => {
        filterState.hiddenSpecificSeries = [];
        saveFilterState();
        seriesToggles.querySelectorAll('.filter-btn[data-series]').forEach(b => { b.classList.add('active'); b.setAttribute('aria-pressed', 'true'); });
        applyFilters();
    });
    seriesToggles.appendChild(selectAllBtn);

    const deselectAllBtn = document.createElement('button');
    deselectAllBtn.className = 'filter-btn filter-util';
    deselectAllBtn.textContent = 'DESELECT ALL';
    deselectAllBtn.setAttribute('aria-label', 'Deselect all series');
    deselectAllBtn.addEventListener('click', () => {
        filterState.hiddenSpecificSeries = [...allSeries];
        saveFilterState();
        seriesToggles.querySelectorAll('.filter-btn[data-series]').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
        applyFilters();
    });
    seriesToggles.appendChild(deselectAllBtn);

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

    const clearAllBtn = document.getElementById('clear-all-filters');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            filterState.regions = []; filterState.categories = []; filterState.hiddenSpecificSeries = [];
            saveFilterState();
            document.querySelectorAll('.filter-region, .filter-category').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
            document.querySelectorAll('#series-toggles .filter-btn[data-series]').forEach(b => { b.classList.add('active'); b.setAttribute('aria-pressed', 'true'); });
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
    const calContainer = document.getElementById('calendar-container');
    const emptyState = document.getElementById('empty-state');
    if (calContainer && emptyState) {
        const anyVisible = calContainer.querySelector('.card:not([style*="display: none"])');
        emptyState.hidden = !!anyVisible;
    }
    // Grey-out / activate the clear-all indicator
    const activeBar = document.getElementById('filter-active-bar');
    if (activeBar) {
        const hasFilters = filterState.regions.length > 0 || filterState.categories.length > 0 || filterState.hiddenSpecificSeries.length > 0;
        activeBar.classList.toggle('has-filters', hasFilters);
    }

    filterStateToURL();
    renderThisWeekend();
}

// =============================================
// HASH / WEEK PERMALINK NAVIGATION
// =============================================
function revealHashTarget() {
    const hash = location.hash.slice(1); // strip '#'
    if (!hash) return false;

    const el = document.getElementById(hash);
    if (!el || !el.classList.contains('card')) return false;

    const behavior = document.visibilityState === 'hidden'
        || window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto' : 'smooth';

    // If card is inside the past-events accordion, open it first
    const pastContainer = el.closest('#past-events-container');
    if (pastContainer) pastContainer.open = true;

    // If card is inside a 2027 preview section, expand it first
    if (el.closest('[data-year="2027"]')) {
        const btn = document.querySelector('.preview-2027-btn');
        if (btn && btn.getAttribute('aria-expanded') === 'false') btn.click();
    }

    // If card is hidden by filters (display:none), skip scroll but still return true
    // so scrollToCurrentWeek is suppressed
    requestAnimationFrame(() => {
        el.scrollIntoView({ behavior, block: 'start' });
    });

    return true;
}

// =============================================
// AUTO-SCROLL
// =============================================
function scrollToCurrentWeek() {
    // dimPastEvents has already moved past months out of #calendar-container
    // and tagged past weeks of the current month with .past, so the first
    // remaining visible card is the current/next race week.
    // Smooth scrolling is skipped by browsers in hidden/background tabs and
    // unwanted under prefers-reduced-motion — fall back to instant.
    const behavior = document.visibilityState === 'hidden'
        || window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto' : 'smooth';
    const cards = document.querySelectorAll('#calendar-container .card');
    for (const card of cards) {
        if (card.classList.contains('past')) continue;
        if (card.style.display === 'none') continue;       // hidden by filters
        if (card.closest('[data-year="2027"]')) continue;  // collapsed 2027 preview
        const monthHeader = card.closest('.cal-grid')?.previousElementSibling;
        if (monthHeader && monthHeader.classList.contains('month-header')) {
            monthHeader.scrollIntoView({ behavior, block: 'start' });
        } else {
            card.scrollIntoView({ behavior, block: 'start' });
        }
        return;
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
        if (header.dataset.year === '2027') continue; // handled by 2027 toggle
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
        if (card.closest('[data-year="2027"]')) continue; // handled by 2027 toggle
        const headText = card.querySelector('.c-head')?.textContent || '';
        // "WEEK 32 • AUG 3-9" / "WEEK 31 • JUL 27 - AUG 2" → month + day the week ends on.
        // Anchored to the end of the label so "WEEK 32" is never mistaken for a day.
        const m = headText.match(/([A-Z]{3})\s+(\d{1,2})(?:\s*-\s*(?:([A-Z]{3})\s+)?(\d{1,2}))?\s*$/);
        if (!m) continue;
        const cardMonth = shortMonths.indexOf(m[3] || m[1]);
        const lastDate = parseInt(m[4] || m[2]);
        if (cardMonth < 0) continue;
        if (cardMonth < currentMonth || (cardMonth === currentMonth && lastDate + 1 < currentDate)) {
            card.classList.add('past');
        }
    }

    if (pastMonthCount > 0 && pastSummary) {
        pastSummary.textContent = `View Past Events (${pastMonthCount} Month${pastMonthCount > 1 ? 's' : ''})`;
        // Note: <details>/<summary> manage open/closed state natively — no aria-expanded needed
    } else {
        pastContainer.hidden = true;
    }
}

// =============================================
// TIMEZONE PICKER
// =============================================
// The pre-rendered HTML timezone conversion is one-shot (convertPreRenderedTimes mutates
// the DOM and cannot run twice), so a timezone change must reload the page. This is the
// honest, bug-free approach — no stale time strings can linger.
function setupTzPicker() {
    const select = document.getElementById('tz-select');
    if (!select) return;

    // Build options: Auto first, then IANA zones grouped by region prefix
    const FALLBACK_ZONES = [
        'America/New_York','America/Chicago','America/Denver','America/Los_Angeles',
        'America/Sao_Paulo','America/Toronto','America/Vancouver',
        'Europe/London','Europe/Paris','Europe/Berlin','Europe/Madrid',
        'Europe/Rome','Europe/Amsterdam','Europe/Moscow',
        'Asia/Tokyo','Asia/Shanghai','Asia/Seoul','Asia/Singapore',
        'Asia/Dubai','Asia/Kolkata','Asia/Bangkok','Asia/Jakarta',
        'Africa/Cairo','Africa/Johannesburg','Africa/Lagos',
        'Australia/Sydney','Australia/Melbourne','Australia/Perth',
        'Pacific/Auckland','Pacific/Honolulu','UTC',
    ];

    const zones = (typeof Intl.supportedValuesOf === 'function')
        ? Intl.supportedValuesOf('timeZone')
        : FALLBACK_ZONES;

    // Group by prefix
    const groups = {};
    for (const z of zones) {
        const prefix = z.includes('/') ? z.split('/')[0] : 'Other';
        (groups[prefix] ??= []).push(z);
    }

    // Auto option
    const autoOpt = document.createElement('option');
    autoOpt.value = '';
    autoOpt.textContent = `Auto — ${DETECTED_TIMEZONE.replace(/_/g, ' ')}`;
    select.appendChild(autoOpt);

    // Grouped options
    for (const [prefix, tzList] of Object.entries(groups)) {
        const grp = document.createElement('optgroup');
        grp.label = prefix;
        for (const tz of tzList) {
            const opt = document.createElement('option');
            opt.value = tz;
            opt.textContent = tz.replace(/_/g, ' ');
            if (tz === USER_TIMEZONE) opt.selected = true;
            grp.appendChild(opt);
        }
        select.appendChild(grp);
    }

    // If override is active but zones list didn't include it, ensure it's selected
    if (TZ_IS_OVERRIDE && !select.value) {
        const opt = document.createElement('option');
        opt.value = USER_TIMEZONE;
        opt.textContent = USER_TIMEZONE.replace(/_/g, ' ');
        opt.selected = true;
        select.appendChild(opt);
    }

    select.addEventListener('change', () => {
        const val = select.value;
        if (val) {
            localStorage.setItem('tzOverride', val);
        } else {
            localStorage.removeItem('tzOverride');
        }
        // Reload so the one-shot convertPreRenderedTimes() runs fresh with new timezone
        location.reload();
    });
}

// =============================================
// PERSONAL ICAL SUBSCRIBE MODAL
// =============================================
function setupIcalModal() {
    const btn = document.getElementById('cal-subscribe-btn');
    const modal = document.getElementById('ical-modal');
    if (!btn || !modal) return;

    const closeBtn = document.getElementById('ical-modal-close');
    const backdrop = document.getElementById('ical-modal-backdrop');
    const linkInput = document.getElementById('ical-link-input');
    const copyBtn = document.getElementById('ical-copy-btn');
    const gcalLink = document.getElementById('ical-gcal-link');

    function buildCalUrl() {
        // Build sorted slug list from current visible series
        const visible = allSeries.filter(isSeriesVisible).sort();
        const allVisible = visible.length === allSeries.length;
        const base = 'webcal://dord.racing/api/ical';
        return allVisible ? base : base + '?series=' + visible.join(',');
    }

    function openModal() {
        const url = buildCalUrl();
        if (linkInput) linkInput.value = url;
        if (gcalLink) gcalLink.href = 'https://calendar.google.com/calendar/render?cid=' + encodeURIComponent(url);
        modal.hidden = false;
        requestAnimationFrame(() => { if (closeBtn) closeBtn.focus(); });
    }

    function closeModal() {
        modal.hidden = true;
        btn.focus();
        if (copyBtn) { copyBtn.textContent = 'Copy'; copyBtn.removeAttribute('aria-label'); }
    }

    btn.addEventListener('click', openModal);

    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    if (backdrop) backdrop.addEventListener('click', closeModal);

    modal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { e.preventDefault(); closeModal(); }
        // Trap focus within modal
        if (e.key === 'Tab') {
            const focusable = Array.from(modal.querySelectorAll('a[href], button:not([disabled]), input'));
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
    });

    if (copyBtn && linkInput) {
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(linkInput.value).then(() => {
                copyBtn.textContent = 'Copied!';
                setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
            }).catch(() => {
                linkInput.select();
                document.execCommand('copy');
                copyBtn.textContent = 'Copied!';
                setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
            });
        });
    }
}

// =============================================
// 2027 PREVIEW TOGGLE
// =============================================
function setup2027Toggle() {
    const calContainer = document.getElementById('calendar-container');
    if (!calContainer) return;

    const els2027 = Array.from(calContainer.querySelectorAll('[data-year="2027"]'));
    if (!els2027.length) return;

    // Use style.display instead of the `hidden` attribute — CSS `display: grid`
    // on .cal-grid can override the UA `[hidden] { display: none }` rule.
    els2027.forEach(el => { el.style.display = 'none'; });

    // Build toggle wrapper and insert it immediately before the first 2027 element
    // (guarantees it lands between December and January regardless of grid layout).
    const wrapper = document.createElement('div');
    wrapper.className = 'preview-2027-wrap';
    wrapper.innerHTML = `
      <button class="preview-2027-btn" aria-expanded="false" aria-controls="preview-2027-content">
        Preview 2027 season →
      </button>
      <div class="preview-2027-note">Some 2027 calendars may be incomplete</div>
    `;
    els2027[0].before(wrapper);

    // Year separator sits between the button and the first 2027 month header
    const separator = document.createElement('div');
    separator.className = 'year-separator';
    separator.id = 'preview-2027-content';
    separator.textContent = '— 2027 —';
    separator.style.display = 'none';
    wrapper.after(separator);

    const btn = wrapper.querySelector('.preview-2027-btn');
    btn.addEventListener('click', () => {
        const isOpen = btn.getAttribute('aria-expanded') === 'true';
        const next = !isOpen;
        btn.setAttribute('aria-expanded', String(next));
        const display = next ? '' : 'none';
        separator.style.display = display;
        els2027.forEach(el => { el.style.display = display; });
        btn.textContent = next ? 'Hide 2027 preview ←' : 'Preview 2027 season →';
    });
}

// =============================================
// COUNTDOWN TICK (This Weekend cards)
// =============================================
let timerInterval = setInterval(updateThisWeekendCountdowns, 1000);
document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearInterval(timerInterval);
    else { updateThisWeekendCountdowns(); timerInterval = setInterval(updateThisWeekendCountdowns, 1000); }
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
        const year = parseInt(card.closest('[data-year]')?.dataset.year) || 2026;
        card.querySelectorAll('.meta-time').forEach(metaTime => {
            metaTime.innerHTML = convertTimeStr(metaTime.innerHTML, weekLabel, year);
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
        const meta = seriesMetadata[series];
        if (!meta) continue; // series.json can carry keys the UI doesn't know yet
        const nextRace = list.find(r => r._ts > now);
        if (nextRace) {
            upcomingEvents.push({
                "@type": "Event",
                "name": `${meta.name} - ${nextRace.name}`,
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
// EVENT ROW → TRACK PAGE CLICK
// =============================================
function initEventRowClicks() {
    document.querySelectorAll('.event[data-track-href]').forEach(row => {
        // Make the row keyboard-focusable and activatable (link semantics)
        row.setAttribute('role', 'link');
        row.setAttribute('tabindex', '0');

        row.addEventListener('click', e => {
            if (e.target.closest('a') || e.target.closest('button')) return;
            window.location.href = row.dataset.trackHref;
        });

        row.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                if (e.target.closest('a') || e.target.closest('button')) return;
                e.preventDefault();
                window.location.href = row.dataset.trackHref;
            }
        });
    });
}

// =============================================
// SUPPORT RACE TOGGLE (arrow buttons)
// =============================================
function initToggle() {
    document.querySelectorAll('.arrow-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const isNowActive = !btn.classList.contains('active');
            btn.classList.toggle('active');
            btn.setAttribute('aria-expanded', isNowActive ? 'true' : 'false');
            const sibling = btn.parentElement?.nextElementSibling;
            if (sibling) sibling.classList.toggle('open');
        });
    });
}


// =============================================
// INIT
// =============================================
(async function init() {
    // Fetch series data for countdowns — calendar HTML is pre-rendered.
    // A failed fetch must not kill the rest of init: filters, toggles and
    // row clicks work fine without countdown data.
    const base = document.querySelector('meta[name="astro-base"]')?.getAttribute('content') || '';
    try {
        const seriesRes = await fetch(`${base}/data/series.json`);
        seriesData = await seriesRes.json();
    } catch (e) {
        console.error('Failed to load series data — countdowns disabled', e);
        seriesData = {};
    }

    // Pre-cache timestamps
    for (const list of Object.values(seriesData)) {
        for (const race of list) {
            race._ts = new Date(race.date).getTime();
        }
    }

    // Convert times for non-Paris timezones
    convertPreRenderedTimes();

    // Initialize interactive features
    initEventRowClicks();
    initToggle();
    initFilters();
    applyFilters(); // also renders the This Weekend section
    dimPastEvents();
    setup2027Toggle();
    setupIcalModal();
    injectSchema();

    // Update timezone notice
    const tzNotice = document.querySelector('.meta');
    if (tzNotice) {
        const friendlyTz = USER_TIMEZONE.replace(/_/g, ' ').toUpperCase();
        if (TZ_IS_OVERRIDE) {
            tzNotice.textContent = `TIMES SHOWN IN: ${friendlyTz} (MANUAL)`;
        } else if (NEEDS_TZ_CONVERSION) {
            tzNotice.textContent = `TIMES CONVERTED TO YOUR TIMEZONE: ${friendlyTz}`;
        } else {
            tzNotice.textContent = `SYSTEM TIMEZONE: PARIS (CET/CEST)`;
        }
    }

    setupTzPicker();

    // Hash permalink: if a valid week hash is present, reveal & scroll to it;
    // otherwise fall back to auto-scrolling to the current week.
    const hasHashTarget = revealHashTarget();
    if (!hasHashTarget) setTimeout(scrollToCurrentWeek, 100);

    // React to hash changes (back/forward, clicking week anchors)
    window.addEventListener('hashchange', revealHashTarget);
})();

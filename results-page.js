// Lightweight script for results.html — no dependency on script.js
const SERIES_META = {
    f1: { name: 'F1', tag: 'F1' },
    f1a: { name: 'F1 Academy', tag: 'F1A' },
    fe: { name: 'Formula E', tag: 'FE' },
    sf: { name: 'Super Formula', tag: 'SF' },
    wec: { name: 'WEC', tag: 'WEC' },
    imsa: { name: 'IMSA', tag: 'IMSA' },
    wrc: { name: 'WRC', tag: 'WRC' },
    indycar: { name: 'IndyCar', tag: 'INDY' },
    nascar: { name: 'NASCAR', tag: 'NASCAR' },
    motogp: { name: 'MotoGP', tag: 'MOTOGP' },
    wsbk: { name: 'WSBK', tag: 'WSBK' },
    dtm: { name: 'DTM', tag: 'DTM' },
    btcc: { name: 'BTCC', tag: 'BTCC' },
    supercars: { name: 'Supercars', tag: 'SC' },
    elms: { name: 'ELMS', tag: 'ELMS' },
    gtwce: { name: 'GTWCE', tag: 'GTWCE' },
    gtwca: { name: 'GTWCA', tag: 'GTWCA' },
    nls: { name: 'NLS', tag: 'NLS' },
    igtc: { name: 'IGTC', tag: 'IGTC' },
    tcr: { name: 'TCR', tag: 'TCR' },
    erc: { name: 'ERC', tag: 'ERC' }
};

const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

(async function init() {
    const [resultsRes, seriesRes] = await Promise.all([
        fetch('data/results.json'),
        fetch('data/series.json')
    ]);
    const resultsData = await resultsRes.json();
    const seriesData = await seriesRes.json();

    // Flatten results with dates from seriesData
    const allResults = [];
    for (const [seriesKey, races] of Object.entries(resultsData)) {
        const seriesDates = seriesData[seriesKey] || [];
        for (const r of races) {
            const match = seriesDates.find(s => s.name === r.event);
            const date = match ? new Date(match.date) : null;
            allResults.push({ ...r, seriesKey, date });
        }
    }

    // Sort chronologically
    allResults.sort((a, b) => (a.date || 0) - (b.date || 0));

    // Get unique series that have results
    const seriesWithResults = [...new Set(allResults.map(r => r.seriesKey))];
    const activeFilters = new Set(seriesWithResults);

    // Render filters
    const filtersEl = document.getElementById('results-filters');
    for (const sk of seriesWithResults) {
        const meta = SERIES_META[sk] || { tag: sk.toUpperCase() };
        const btn = document.createElement('button');
        btn.className = 'results-filter-btn active';
        btn.textContent = meta.tag;
        btn.dataset.series = sk;
        btn.addEventListener('click', () => {
            if (activeFilters.has(sk)) {
                activeFilters.delete(sk);
                btn.classList.remove('active');
            } else {
                activeFilters.add(sk);
                btn.classList.add('active');
            }
            renderResults();
        });
        filtersEl.appendChild(btn);
    }

    const gridEl = document.getElementById('results-grid');

    function formatDate(d) {
        if (!d) return '';
        return MONTH_NAMES[d.getMonth()] + ' ' + String(d.getDate()).padStart(2, '0');
    }

    function renderResults() {
        let html = '';
        for (const r of allResults) {
            if (!activeFilters.has(r.seriesKey)) continue;
            const meta = SERIES_META[r.seriesKey] || { tag: r.seriesKey.toUpperCase() };
            const isCancelled = r.driver === null;

            html += `<div class="result-card${isCancelled ? ' cancelled' : ''}" data-series="${r.seriesKey}" style="border-left-color: var(--${r.seriesKey})">`;
            html += `<div class="result-card-header">`;
            html += `<span class="tag t-${r.seriesKey}">${meta.tag}</span>`;
            html += `<span class="result-event">${r.event}</span>`;
            html += `<span class="result-date">${formatDate(r.date)}</span>`;
            html += `</div>`;

            if (isCancelled) {
                html += `<div class="result-card-body"><span class="result-cancelled">Cancelled</span></div>`;
            } else {
                const note = r.note ? ` <span class="result-note">(${r.note})</span>` : '';
                html += `<div class="result-card-body">`;
                html += `<div class="result-winner"><span class="result-icon">\u2605</span><span class="result-driver">${r.driver}</span></div>`;
                html += `<span class="result-team">${r.team}${note}</span>`;
                html += `</div>`;
                if (r.codriver) {
                    html += `<div class="result-codriver">with ${r.codriver}</div>`;
                }
            }

            html += `</div>`;
        }
        gridEl.innerHTML = html;
    }

    renderResults();
})();

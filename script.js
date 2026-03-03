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
    ]
};

const els = Object.keys(seriesData).reduce((acc, k) => {
    acc[k] = { t: document.getElementById(`t-${k}`), n: document.querySelector(`.dc-${k} .dc-next`) };
    return acc;
}, {});

function update() {
    const now = Date.now();
    for (const [k, list] of Object.entries(seriesData)) {
        const el = els[k];
        if (!el.t) continue;
        const next = list.find(r => new Date(r.date).getTime() > now);
        if (next) {
            if (el.n) el.n.textContent = next.name;
            const dff = new Date(next.date) - now;
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

const toggle = btn => {
    btn.classList.toggle('active');
    btn.parentElement.nextElementSibling.classList.toggle('open');
};

setInterval(update, 1000);
update();
const seriesData = {
    f1: [
        { name: "AUSTRALIA", date: "2026-03-08T06:00:00+01:00" },
        { name: "CHINA", date: "2026-03-22T09:00:00+01:00" },
        { name: "JAPAN", date: "2026-04-05T07:00:00+02:00" },
        { name: "BAHRAIN", date: "2026-04-19T17:00:00+02:00" },
        { name: "SAUDI ARABIA", date: "2026-04-26T18:00:00+02:00" },
        { name: "MIAMI", date: "2026-05-03T21:30:00+02:00" },
        { name: "EMILIA ROMAGNA", date: "2026-05-17T15:00:00+02:00" },
        { name: "MONACO", date: "2026-05-24T15:00:00+02:00" },
        { name: "MADRID", date: "2026-06-07T15:00:00+02:00" },
        { name: "CANADA", date: "2026-06-21T20:00:00+02:00" },
        { name: "AUSTRIA", date: "2026-07-05T15:00:00+02:00" },
        { name: "BRITISH", date: "2026-07-19T16:00:00+02:00" },
        { name: "BELGIUM", date: "2026-08-02T15:00:00+02:00" },
        { name: "HUNGARY", date: "2026-08-30T15:00:00+02:00" },
        { name: "DUTCH", date: "2026-09-06T15:00:00+02:00" },
        { name: "ITALY", date: "2026-09-20T15:00:00+02:00" },
        { name: "AZERBAIJAN", date: "2026-10-04T13:00:00+02:00" },
        { name: "SINGAPORE", date: "2026-10-18T14:00:00+02:00" },
        { name: "USA (AUSTIN)", date: "2026-10-25T21:00:00+01:00" },
        { name: "MEXICO CITY", date: "2026-11-08T21:00:00+01:00" },
        { name: "SAO PAULO", date: "2026-11-22T18:00:00+01:00" },
        { name: "LAS VEGAS", date: "2026-12-06T07:00:00+01:00" },
        { name: "QATAR", date: "2026-12-13T18:00:00+01:00" },
        { name: "ABU DHABI", date: "2026-12-21T14:00:00+01:00" }
    ],
    f1a: [
        { name: "CHINA", date: "2026-03-21T07:30:00+01:00" },
        { name: "JEDDAH", date: "2026-04-24T13:00:00+02:00" },
        { name: "MIAMI", date: "2026-05-02T19:00:00+02:00" },
        { name: "CANADA", date: "2026-06-20T18:00:00+02:00" },
        { name: "ZANDVOORT", date: "2026-09-05T17:00:00+02:00" },
        { name: "SINGAPORE", date: "2026-10-17T09:00:00+02:00" },
        { name: "LAS VEGAS", date: "2026-12-05T04:00:00+01:00" }
    ],
    fe: [
        { name: "MEXICO CITY", date: "2026-01-10T21:00:00+01:00" },
        { name: "DIRIYAH", date: "2026-01-23T18:00:00+01:00" },
        { name: "MIAMI", date: "2026-02-14T21:00:00+01:00" },
        { name: "MONACO", date: "2026-03-14T15:00:00+01:00" },
        { name: "TOKYO", date: "2026-03-29T07:00:00+02:00" },
        { name: "MISANO", date: "2026-04-11T15:00:00+02:00" },
        { name: "SHANGHAI", date: "2026-05-02T09:00:00+02:00" },
        { name: "BERLIN", date: "2026-05-23T15:00:00+02:00" },
        { name: "PORTLAND", date: "2026-06-27T22:00:00+02:00" },
        { name: "LONDON", date: "2026-07-25T18:00:00+02:00" }
    ],
    sf: [
        { name: "SUZUKA R1", date: "2026-03-08T06:00:00+01:00" },
        { name: "AUTOPOLIS", date: "2026-04-12T07:00:00+02:00" },
        { name: "SUGO", date: "2026-05-17T07:00:00+02:00" },
        { name: "FUJI", date: "2026-07-19T07:00:00+02:00" },
        { name: "MOTEGI", date: "2026-08-23T07:00:00+02:00" },
        { name: "FUJI FINALE", date: "2026-10-10T07:00:00+02:00" },
        { name: "SUZUKA FINALE", date: "2026-11-21T06:00:00+01:00" }
    ],
    wec: [
        { name: "QATAR 1812", date: "2026-02-28T09:00:00+01:00" },
        { name: "IMOLA 6H", date: "2026-04-19T13:00:00+02:00" },
        { name: "SPA 6H", date: "2026-05-09T13:00:00+02:00" },
        { name: "LE MANS 24H", date: "2026-06-13T16:00:00+02:00" },
        { name: "SAO PAULO 6H", date: "2026-07-12T17:00:00+02:00" },
        { name: "LONE STAR (COTA)", date: "2026-09-06T20:00:00+02:00" },
        { name: "FUJI 6H", date: "2026-09-27T04:00:00+02:00" },
        { name: "BAHRAIN 8H", date: "2026-11-07T12:00:00+01:00" }
    ],
    imsa: [
        { name: "ROLEX 24", date: "2026-01-24T19:40:00+01:00" },
        { name: "SEBRING 12H", date: "2026-03-21T15:10:00+01:00" },
        { name: "LONG BEACH", date: "2026-04-11T22:30:00+02:00" },
        { name: "LAGUNA SECA", date: "2026-05-10T21:10:00+02:00" },
        { name: "DETROIT", date: "2026-05-30T21:00:00+02:00" },
        { name: "WATKINS GLEN", date: "2026-06-28T16:40:00+02:00" },
        { name: "MOSPORT", date: "2026-07-12T18:00:00+02:00" },
        { name: "ROAD AMERICA", date: "2026-08-02T17:00:00+02:00" },
        { name: "VIR", date: "2026-08-23T18:00:00+02:00" },
        { name: "INDIANAPOLIS", date: "2026-09-20T18:00:00+02:00" },
        { name: "PETIT LE MANS", date: "2026-10-10T17:40:00+02:00" }
    ],
    wrc: [
        { name: "MONTE-CARLO", date: "2026-01-22T09:00:00+01:00" },
        { name: "SWEDEN", date: "2026-02-12T09:00:00+01:00" },
        { name: "KENYA", date: "2026-03-12T09:00:00+01:00" },
        { name: "CROATIA", date: "2026-04-09T09:00:00+02:00" },
        { name: "CANARIAS", date: "2026-04-23T09:00:00+02:00" },
        { name: "PORTUGAL", date: "2026-05-07T09:00:00+02:00" },
        { name: "JAPAN", date: "2026-05-28T09:00:00+02:00" },
        { name: "GREECE", date: "2026-06-25T09:00:00+02:00" },
        { name: "ESTONIA", date: "2026-07-16T09:00:00+02:00" },
        { name: "FINLAND", date: "2026-07-30T09:00:00+02:00" },
        { name: "PARAGUAY", date: "2026-08-27T09:00:00+02:00" },
        { name: "CHILE", date: "2026-09-10T09:00:00+02:00" },
        { name: "SARDINIA", date: "2026-10-01T09:00:00+02:00" },
        { name: "SAUDI ARABIA", date: "2026-11-11T09:00:00+01:00" }
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
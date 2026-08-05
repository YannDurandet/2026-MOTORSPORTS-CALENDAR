/**
 * tz.js — Shared timezone conversion helpers.
 * Imported by main.js (homepage) and watch.astro (watch page).
 * Do NOT import main.js into other pages — it's homepage-specific.
 */

export const SOURCE_TIMEZONE = "Europe/Paris";

// Read manual override from localStorage; validate it; fall back to detection
export const DETECTED_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

function resolveUserTimezone() {
    const stored = localStorage.getItem('tzOverride');
    if (!stored) return DETECTED_TIMEZONE;
    try { new Intl.DateTimeFormat('en', { timeZone: stored }); return stored; } catch { return DETECTED_TIMEZONE; }
}

export const USER_TIMEZONE = resolveUserTimezone();
export const TZ_IS_OVERRIDE = USER_TIMEZONE !== DETECTED_TIMEZONE;
export const NEEDS_TZ_CONVERSION = SOURCE_TIMEZONE !== USER_TIMEZONE;

export const MONTH_MAP = { JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11 };
export const DAY_MAP = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 };

export function parseWeekDate(weekLabel, year = 2026) {
    // "WEEK 43 • OCT 22-25" / "WEEK 31 • JUL 27 - AUG 2" → Date of the week's last day
    const m = weekLabel.match(/([A-Z]{3})\s+(\d{1,2})(?:\s*-\s*(?:([A-Z]{3})\s+)?(\d{1,2}))?\s*$/);
    if (!m) return null;
    const mo = MONTH_MAP[m[3] || m[1]];
    if (mo === undefined) return null;
    const day = parseInt(m[4] || m[2]);
    return new Date(year, mo, day);
}

export function convertHHMM(hhmm, refDate) {
    const [h, mm] = hhmm.split(':').map(Number);
    const fakeUtc = new Date(Date.UTC(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), h, mm, 0));
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
        const daysInMonth = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0).getDate();
        if (diff > 15) diff -= daysInMonth;
        if (diff < -15) diff += daysInMonth;
        return `${converted}<sup class="tz-day">${diff > 0 ? '+' : ''}${diff}</sup>`;
    }
    return converted;
}

export function convertTimeStr(timeHtml, weekLabel, year = 2026) {
    if (!NEEDS_TZ_CONVERSION) return timeHtml;
    const endDate = parseWeekDate(weekLabel, year);
    if (!endDate) return timeHtml;
    const endDow = endDate.getDay();
    return timeHtml.replace(/<span class="hl">(\d{2}:\d{2})<\/span>/g, (_, hhmm, offset) => {
        // Sessions can fall on different days of a DST-transition weekend
        // (e.g. OCT 24-25 2026: Saturday is CEST, Sunday is CET). When a day
        // token precedes the time ("FRI R: 05:00", "R1 SAT: 17:00"), pin the
        // session to that actual date so the correct UTC offset applies.
        // Without a token, fall back to the week's last day as before.
        let refDate = endDate;
        const days = timeHtml.slice(0, offset).match(/\b(MON|TUE|WED|THU|FRI|SAT|SUN)\b/g);
        if (days) {
            const delta = (endDow - DAY_MAP[days[days.length - 1]] + 7) % 7;
            refDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - delta);
        }
        return `<span class="hl">${convertHHMM(hhmm, refDate)}</span>`;
    });
}

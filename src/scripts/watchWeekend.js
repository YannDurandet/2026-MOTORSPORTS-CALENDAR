/**
 * Which weekend /watch shows, and how it groups its events.
 *
 * Shared by the page script (run on every visit) and the page's build-time
 * markup (AUDIT F-063), so a crawler or a visitor without JavaScript gets the
 * same weekend the script would show on the day of the build. Paris-day
 * semantics throughout; no browser APIs, so it also runs at build time.
 *
 * Events are { ts, date, timeHtml, ... } with `ts` the epoch ms of `date`.
 */

const SOURCE_TIMEZONE = 'Europe/Paris';

const PARIS_DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: SOURCE_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
});
const PARIS_WEEKDAY = new Intl.DateTimeFormat('en-US', { timeZone: SOURCE_TIMEZONE, weekday: 'long' });
const DAY_NUM = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };

/** "YYYY-MM-DD" of an instant, in Paris. */
export function parisDateStr(ts) {
  return PARIS_DATE.format(new Date(ts));
}

/** The Friday–Sunday (Paris dates) of the weekend `offsetWeeks` after the one `now` is in or follows. */
export function weekendOf(now, offsetWeeks = 0) {
  const parisDate = new Date(parisDateStr(now.getTime()) + 'T12:00:00Z');
  const dayNum = DAY_NUM[PARIS_WEEKDAY.format(now).toLowerCase()] ?? 0;
  // How many days back to reach the most recent Friday
  const daysSinceFri = (dayNum - 5 + 7) % 7;
  const fri = new Date(parisDate);
  fri.setUTCDate(parisDate.getUTCDate() - daysSinceFri + offsetWeeks * 7);
  const sun = new Date(fri);
  sun.setUTCDate(fri.getUTCDate() + 2);
  return { friStr: parisDateStr(fri.getTime()), sunStr: parisDateStr(sun.getTime()), daysSinceFri };
}

/**
 * Mon–Thu: between weekends, look at the coming Fri–Sun. Fri–Sun: the current
 * one. If that weekend has nothing, try the one after.
 */
export function activeWeekend(events, now) {
  const { daysSinceFri } = weekendOf(now, 0);
  // daysSinceFri: Fri=0, Sat=1, Sun=2, Mon=3, Tue=4, Wed=5, Thu=6
  const startOffset = daysSinceFri > 2 ? 1 : 0;
  for (let w = startOffset; w <= startOffset + 1; w++) {
    const { friStr, sunStr } = weekendOf(now, w);
    const matching = events.filter(ev => {
      if (ev.ts === null || Number.isNaN(ev.ts)) return false;
      const d = parisDateStr(ev.ts);
      return d >= friStr && d <= sunStr;
    });
    if (matching.length > 0) return { events: matching, friStr, sunStr, isEmpty: false };
  }
  return { events: [], friStr: null, sunStr: null, isEmpty: true };
}

/**
 * Events that span several days (rallies, endurance) go in "All Weekend" only;
 * point-in-time events go under their own day.
 */
export function isMultiDay(timeHtml) {
  const plain = timeHtml.replace(/<[^>]+>/g, '');
  if (plain.includes(' > ')) return true;
  const days = [...plain.matchAll(/\b(MON|TUE|WED|THU|FRI|SAT|SUN)\b/gi)];
  return new Set(days.map(m => m[0].toUpperCase())).size >= 2;
}

/** "Saturday 15 November" for a "YYYY-MM-DD". */
export function dayLabel(dateStr) {
  return new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-GB', {
    timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long',
  });
}

/** [{ heading, events }]: "All Weekend" first, then one section per Paris day. */
export function weekendSections(events) {
  const sections = [];
  const multi = events.filter(ev => isMultiDay(ev.timeHtml));
  if (multi.length) sections.push({ heading: 'All Weekend', events: multi });
  const byDay = new Map();
  for (const ev of events.filter(ev => !isMultiDay(ev.timeHtml))) {
    const d = parisDateStr(ev.ts);
    if (!byDay.has(d)) byDay.set(d, []);
    byDay.get(d).push(ev);
  }
  for (const d of [...byDay.keys()].sort()) sections.push({ heading: dayLabel(d), events: byDay.get(d) });
  return sections;
}

#!/usr/bin/env node
/**
 * tz.mjs: convert a local wall-clock time at a circuit into Paris time, with the
 * Paris weekday, for session patches. Handles DST on both ends.
 *
 *   node scripts/tz.mjs "2026-11-21 20:00" America/Los_Angeles   ->  SUN 05:00
 *   node scripts/tz.mjs "2026-11-22 04:00" UTC
 *
 * A session after midnight Paris belongs to the NEXT day: use the weekday this prints.
 */

const [input, zone] = process.argv.slice(2);
const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/.exec(input ?? '');
if (!m || !zone) {
  console.error('Usage: node scripts/tz.mjs "YYYY-MM-DD HH:MM" <IANA zone, e.g. Asia/Qatar>');
  process.exit(1);
}
const [y, mo, d, h, mi] = m.slice(1).map(Number);

function partsIn(ms, tz) {
  const f = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, hourCycle: 'h23', weekday: 'short',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
  return Object.fromEntries(f.formatToParts(new Date(ms)).map((p) => [p.type, p.value]));
}
function offsetMs(ms, tz) {
  const o = partsIn(ms, tz);
  return Date.UTC(+o.year, +o.month - 1, +o.day, +o.hour, +o.minute) - Math.floor(ms / 60000) * 60000;
}

try {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  let utc = guess - offsetMs(guess, zone);
  utc = guess - offsetMs(utc, zone); // second pass settles DST boundaries
  const back = partsIn(utc, zone);
  if (+back.hour !== h || +back.minute !== mi) {
    console.error(`"${input}" does not exist in ${zone} (DST gap). Check the source time.`);
    process.exit(1);
  }
  const p = partsIn(utc, 'Europe/Paris');
  console.log(`${p.weekday.toUpperCase()} ${p.hour}:${p.minute}   (Paris, ${p.year}-${p.month}-${p.day}; UTC ${new Date(utc).toISOString().slice(0, 16).replace('T', ' ')})`);
} catch (err) {
  console.error(`Could not convert: ${err.message}`);
  process.exit(1);
}

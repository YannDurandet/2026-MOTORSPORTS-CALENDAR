import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cal = JSON.parse(readFileSync(path.join(__dirname, '../data/calendar.json'), 'utf8'));

const PAST_MONTHS = new Set(['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE']);

const gaps = [];
for (const month of cal) {
  if (!PAST_MONTHS.has(month.month.toUpperCase())) continue;
  for (const week of month.weeks) {
    for (const ev of week.events) {
      if (!ev.results || ev.results.length === 0) {
        gaps.push(`[${month.month.slice(0,3)}] [${ev.series.toUpperCase().padEnd(8)}] ${ev.title}`);
      }
    }
  }
}
console.log(`${gaps.length} events missing results:\n`);
gaps.forEach(g => console.log(g));

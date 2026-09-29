/**
 * Splits a calendar `time` string into sessions for display.
 *   'QUALI: <span class="hl">11:00</span> • RACE: <span class="hl">09:00</span>'
 *   → [{ label: 'QUALI', time: '11:00' }, { label: 'RACE', time: '09:00' }]
 * Segments that aren't "LABEL: HH:MM" ("THU > SUN", "RACE: TBC") come back
 * with `time: null` and the text as the label.
 */
export type Session = { label: string; time: string | null };

export function parseSessions(time: string): Session[] {
  const plain = time.replace(/<[^>]*>/g, '').replace(/&rsaquo;/g, '›').replace(/\s+/g, ' ').trim();
  return plain.split('•').map(s => s.trim()).filter(Boolean).map(seg => {
    const m = seg.match(/^(.*?)[:\s]\s*(\d{1,2}:\d{2})$/);
    return m ? { label: m[1].replace(/:$/, '').trim(), time: m[2] } : { label: seg, time: null };
  });
}

/** The single race start this event's `date` refers to, if the string names one. */
export function mainRaceTime(sessions: Session[]): string | null {
  const races = sessions.filter(s => /^RACE$/i.test(s.label) && s.time);
  return races.length === 1 ? races[0].time : null;
}

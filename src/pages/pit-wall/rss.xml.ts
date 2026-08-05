import pitwall from '../../../data/pitwall.json';

interface PitWallEvent {
  series: string;
  tag: string;
  title: string;
  circuit: string;
  country: string;
  day: string | null;
  sessions: Array<{ label: string; time: string }>;
}

interface PitWallIssue {
  week: number;
  dateRange: string;
  subject: string;
  generatedAt: string;
  events: PitWallEvent[];
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&apos;');
}

function buildDescription(issue: PitWallIssue): string {
  const lines = issue.events.map(ev => {
    const day = ev.day === 'fri' ? 'FRI'
              : ev.day === 'sat' ? 'SAT'
              : ev.day === 'sun' ? 'SUN'
              : ev.day === 'multi' ? 'ALL WEEKEND'
              : '';
    const times = ev.sessions.map(s => `${s.label} ${s.time}`).join(' · ');
    return `${day ? day + '  ' : ''}[${ev.tag}] ${ev.title} — ${ev.circuit}${times ? `  (${times})` : ''}`;
  });
  return lines.join('\n');
}

function issueToRssDate(generatedAt: string): string {
  // generatedAt is "YYYY-MM-DD" — treat as Monday 08:00 UTC (newsletter send time)
  const d = new Date(`${generatedAt}T08:00:00Z`);
  return d.toUTCString();
}

export function GET(): Response {
  const BASE = 'https://dord.racing';
  const issues = pitwall as PitWallIssue[];

  const items = issues.map(issue => `
    <item>
      <title>${escapeXml(issue.subject)}</title>
      <link>${BASE}/pit-wall/${issue.week}</link>
      <guid isPermaLink="true">${BASE}/pit-wall/${issue.week}</guid>
      <pubDate>${issueToRssDate(issue.generatedAt)}</pubDate>
      <description>${escapeXml(buildDescription(issue))}</description>
    </item>`).join('');

  const lastBuild = issues.length > 0 ? issueToRssDate(issues[0].generatedAt) : new Date().toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>From The Pit Wall — dord.racing</title>
    <link>${BASE}/pit-wall</link>
    <description>Weekly motorsport weekend briefings across all 25 championships. Published every Monday by dord.racing.</description>
    <language>en</language>
    <atom:link href="${BASE}/pit-wall/rss.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <ttl>10080</ttl>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

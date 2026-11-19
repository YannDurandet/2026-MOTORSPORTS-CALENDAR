# Code Audit Status

_Last updated: 2026-11-19_

What is still open after the November 2026 code audit. The audit found 95
issues (F-001 … F-095); 84 are fixed, in the same merge as this file. The full
evidence for every finding is in `agent-tasks/out/AUDIT.md` and the run log in
`agent-tasks/code-queue.md` (both outside git: `agent-tasks/` is ignored).

Tick items here as they are done, and delete the file once every box is ticked.

## 1. Finish the rollout (one time, after the merge)

- [x] **Redeploy the newsletter worker.** F-074, F-075, F-076 and F-077 change
      `workers/`, which the site deploy doesn't ship. From the repo root:
      `cd workers`, then `npx wrangler deploy --config wrangler.toml`.
- [x] **Sign up once with your own address** on the live site. Since F-045 a
      sign-up gets a confirmation email first (it needs `UNSUB_SECRET`, now set).
- [x] **Open one embedded calendar** on a page that frames it (or a test page).
      F-055 added `X-Frame-Options` everywhere except `/embed/*`; it was only
      tested locally with `wrangler dev`. Checked on the live site: `/embed/f1`
      sends no `X-Frame-Options`, `/` and `/series/wsbk/2027` send `SAMEORIGIN`.
- [x] **Watch the first daily build** (Actions → Deploy, 05:00 UTC). F-069 added
      the schedule; GitHub only runs it from `main`. Run #97 was the first
      scheduled run and passed; GitHub started it at 13:32 UTC, not 05:00.
- [x] **In the next newsletter, click your own unsubscribe link** and check the
      page says you're unsubscribed (F-077 moved the worker to the site's token code;
      it was checked to produce identical tokens). Confirmed working 2026-11-19.

## 2. Decisions only Yann can make

- [x] **One newsletter form (second half of F-068).** Decided: merge. The work
      is listed in section 4 and happens when the sign-up goes onto event and
      season pages.
- [x] **Affiliate instructions (F-085, item 7).** Decided: references dropped
      from CLAUDE.md and `.env.example` (the file no longer exists and described
      Awin, which refused every programme).
- [x] **Deleted design tokens (F-072).** Decided: they stay deleted.
- [x] **Countdown font (F-070).** Decided: the `/series` countdowns keep the mono font.

## 3. Data job (`data/*.json`)

Code was not allowed to touch the data, so these wait for a data pass. Each one
names the exact events in `agent-tasks/out/AUDIT.md`; `agent-tasks/out/audit-data.mjs`
lists them.

- [ ] **F-057 (high)** `time` and `date` disagree for 190 of the 313 events that
      show a clock time (31 still to run). `date` is what countdowns, feeds and the
      newsletter use, so fix `date` first.
- [ ] **F-058** 45 `date` values carry a UTC offset Paris doesn't have on that day.
- [ ] **F-059** Rolex 24 (2026, 2027) and Le Mans 2026: `date` is the finish, not
      the start. Until fixed, the Le Mans 2026 feed entry runs Sunday to Monday.
- [ ] **F-090 (data half)** about 152 TBC events in 2027 carry an invented clock
      time in `date`. The code now treats TBC events as all-day; the data still
      needs `npm run times:apply` (or the real times) as they're announced.
- [ ] **F-021** five rally rounds show another rally's name and town: give them a
      researched `venue` field.
- [x] **F-088 (data half)** two NASCAR events carry the result of a later race at
      the same track, so `/results` lists two races twice. Fixed 2026-11-19: the wrong
      rows were removed from 2026 "Atlanta Motor Speedway" (wk 08) and "Goodyear 400
      (Darlington)" (wk 12); the later events keep their own correct copies. The two
      events now show up in `npm run results:gaps` and need their real results.
- [ ] **F-089** 24 raced events have a different number of results than the races
      their row announces.
- [ ] **F-091** 18 result rows are incomplete or the wrong shape for their series.
- [ ] **F-092** 31 winner names are written two ways (initials, accents, spelling).
- [ ] **F-060** standings totals disagree with the calendar for six series, and two
      series have tables at different rounds.
- [ ] Le Mans 2027: `time` says FRI › SAT but `date` is the Saturday start.
- [x] WRC's blurb in `seriesContent.json` said "five continents"; the 2026 rallies
      span four (Europe, Africa, Asia, South America). Fixed 2026-11-19 (tagline +
      description now say four).

## 4. Small code items

- [x] **One newsletter form (F-068):** `src/components/NewsletterForm.astro` now holds
      the one form (markup, styles, submit script — the double-opt-in-aware variant).
      Used by `newsletter.astro` and `NewsletterBanner.astro`. Still open: place it on
      event and season pages, and test one real sign-up per surface.
- [x] **Search:** a query typed before the search index had loaded showed nothing
      until the next keystroke. `BaseLayout.astro` now shares one in-flight fetch
      (`searchIndexPromise`), warms the index when the overlay opens, and
      `renderResults()` re-renders from the live input once the index lands.
- [x] **Type check:** `npm run typecheck` is at 0 errors (was 6). `npx wrangler types`
      generated `worker-configuration.d.ts` at the repo root — **commit it**, CI needs
      it now that `npm run check` ends with `npm run typecheck`. Also fixed: the
      broadcaster list typing via JSDoc on `pickBroadcasters` (`src/client/country.js`)
      and `res.json()` casts in the newsletter form + `api/subscribe.ts`.
- [x] **São Paulo E-Prix email image** was the TBC placeholder. Regenerated just
      `public/assets/tracks/email/sao-paulo-fe.png` (delete the file and re-run
      `npm run gen:track-pngs` — do NOT use `--force`, it rewrites all 153 PNGs with
      different bytes under the current sharp).
- [x] **Rolex 24 feed length:** `raceLengthHours()` in `src/lib/ics.ts` now also reads
      the "N at" pattern ("Rolex 24 at Daytona" → 24h), so the feed entry is 24h.
- [x] **Newsletter series table:** `workers/newsletter.ts` no longer hand-keeps series
      names — `SERIES_INFO` is built from `data/seriesContent.json` (same file the site
      uses); only the badge look (abbr/colours) stays in the worker. TCR now reads
      "TCR World Tour" like the site.

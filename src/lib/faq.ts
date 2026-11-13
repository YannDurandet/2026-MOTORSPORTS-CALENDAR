/**
 * Home-page FAQ: the single source for the visible accordion
 * (`components/FAQ.astro`) and the `FAQPage` JSON-LD in `pages/index.astro`.
 * Google wants the structured data to match what is on the page, so keep
 * both fed from this list.
 *
 * Evergreen by design: nothing here changes from one round to the next. That
 * matters because these strings are published as structured data, where a
 * stale "who leads" or "races left" answer can be shown by Google long after
 * it stopped being true. So:
 *   - Points tables, "who leads" and "what's left" belong on the series pages
 *     (`/series/{slug}`), not here. Point readers to them instead.
 *   - What may stay is final (a clinched title, a finished season) or a fixed
 *     calendar fact (season length, finale, 2027 opener). If a calendar fact
 *     moves (round added, moved or cancelled), update it here too.
 * Answers are plain text: `FAQ.astro` escapes them and the JSON-LD reuses
 * them, so name pages in words rather than writing links.
 *
 * The answers are prose about one season, named by FAQ_SEASON. When the site
 * rolls over (DEFAULT_CALENDAR_YEAR in lib/season.ts) the page and its JSON-LD
 * read CURRENT_FAQS, which is empty until this list is rewritten for the new
 * season and FAQ_SEASON is bumped: no FAQ is better than last year's answers
 * under this year's title. `npm run check` prints a reminder while it is hidden.
 */
import { DEFAULT_CALENDAR_YEAR } from './season';

export interface Faq {
  question: string;
  answer: string;
}

/** The season the answers below were written for. */
export const FAQ_SEASON = 2026;

export const FAQS: Faq[] = [
  {
    question: "Who is the 2026 Formula 1 world champion?",
    answer:
      "Kimi Antonelli of Mercedes clinched the 2026 Drivers' Championship at the Mexico City Grand Prix on November 1, becoming the youngest world champion in F1 history. The current Drivers' and Constructors' tables are on the Formula 1 series page.",
  },
  {
    question: "How many Formula 1 races are there in 2026, and when does the season end?",
    answer:
      "The 2026 season has 23 rounds and ends with the Abu Dhabi Grand Prix on December 6. The calendar on this page lists every round with its start time in your time zone, and the Series page counts down to the next race of each championship.",
  },
  {
    question: "What's new in Formula 1 for 2026?",
    answer:
      "2026 brought the biggest technical reset of F1's modern era: new power units with a 50/50 split between combustion and electrical power, and redesigned cars with active front and rear wings. Audi (taking over Sauber) and the GM/Cadillac works team joined the grid, making 11 teams. The new rules reshuffled the order: Mercedes have won 11 of the first 19 rounds, Red Bull and McLaren three each and Ferrari two. Madrid's Madring street circuit hosted its first Grand Prix on September 13, won by Antonelli.",
  },
  {
    question: "Why was there no Bahrain or Saudi Arabian Grand Prix in April, and what was the Bahrain GP at Sepang?",
    answer:
      "Formula 1 and the FIA cancelled the April Bahrain and Saudi Arabian Grands Prix in March because of the conflict in the Middle East, which cut the calendar from 24 rounds to 22. Bahrain was later reinstated at the Sepang International Circuit in Malaysia, run on October 4 as the Bahrain Grand Prix in Malaysia and counting toward the World Championship (Max Verstappen won it), which brought the season back to 23 rounds. Saudi Arabia got no replacement. Both return to their usual venues in 2027: Bahrain opens the season at Sakhir on March 12–14 and Jeddah follows on March 19–21.",
  },
  {
    question: "Where can I follow the 2026 MotoGP championship?",
    answer:
      "The MotoGP series page has the calendar, the results and the current standings. The 2026 season has 22 rounds and finishes with the Valencian Community Grand Prix on November 29.",
  },
  {
    question: "How does the 2026 NASCAR Cup Series season end?",
    answer:
      "NASCAR replaced its elimination playoffs with the Chase in 2026. The top 16 drivers after the regular season race the final 10 events with no eliminations, and the Chase driver with the most points after the last race is champion. The finale is the Cup Series Championship at Homestead-Miami Speedway on November 8, 2026, with a 3 p.m. ET start.",
  },
  {
    question: "Who won the 2026 IndyCar championship?",
    answer:
      "Álex Palou (Chip Ganassi Racing) won the 2026 NTT IndyCar Series title with 631 points, 86 ahead of Kyle Kirkwood (Andretti Global). The season ran over 16 race weekends and ended with the Grand Prix of Monterey at Laguna Seca on September 6, won by Scott McLaughlin. Felix Rosenqvist won the 110th Running of the Indianapolis 500 on May 24. The 2027 season opens in St. Petersburg on March 7.",
  },
  {
    question: "Who won Le Mans in 2026, and how does the WEC season end?",
    answer:
      "Toyota won the 24 Hours of Le Mans on June 14, with Mike Conway, Kamui Kobayashi and Nyck de Vries sharing the car. The World Endurance Championship's 2026 season finishes with the 6 Hours of Monza on November 8, round 8 of 8. Monza and the 6 Hours of Barcelona (October 18) replaced the Qatar 1812km and the 8 Hours of Bahrain, which were dropped from the 2026 calendar because of the conflict in the Middle East; Bahrain returns as the 2027 finale on November 6. The current Hypercar standings are on the WEC series page.",
  },
  {
    question: "What is the difference between WEC and IMSA?",
    answer:
      "The FIA World Endurance Championship (WEC) is the global endurance series, peaking with the 24 Hours of Le Mans and racing across Europe, Asia, and the Americas. IMSA (the WeatherTech SportsCar Championship) is the premier North American endurance series, built around tracks like Daytona, Sebring, and Watkins Glen. Both share the same GTP Hypercar class and often feature identical manufacturer programmes, making them complementary rather than competing series.",
  },
  {
    question: "What is Formula E, and who won the 2025–26 title?",
    answer:
      "Formula E is the FIA's fully electric single-seater world championship, racing on temporary street circuits in major cities, with identical battery hardware for every team so the competition comes down to chassis and software. Pascal Wehrlein (Porsche) won his second drivers' title at the London finale in August, on 169 points to Jake Dennis's 164 and Mitch Evans's 160. Jaguar TCS Racing took the teams' title and Porsche the manufacturers' title. Season 13 opens with the Mexico City E-Prix on January 16, 2027 and runs through the Tokyo E-Prix on July 24, 2027.",
  },
  {
    question: "Where can I find the 2027 calendar?",
    answer:
      "Every 2027 round a series has published sits on the main calendar, after December 2026, and the series page of each of those championships has its own 2027 season page. Some rounds are provisional, with session times still to be confirmed, and a series that has not published its 2027 rounds yet is added once it does. Formula 1 has 24 rounds, from Bahrain (March 12–14) to Abu Dhabi (December 10–12), and MotoGP has 22.",
  },
  {
    question: "Which series are tracked in this calendar?",
    answer:
      "We track 26 major global and regional championships: Formula 1, F1 Academy, Formula E, Super Formula, WEC, IMSA, WRC, ERC, IndyCar, NASCAR, MotoGP, WorldSBK, DTM, BTCC, Australian Supercars, ELMS, Asian Le Mans Series, GT World Challenge Europe, GT World Challenge America, NLS (Nürburgring), IGTC, TCR World, 24H European Series, Porsche Mobil 1 Supercup, British GT, and FIA European Rallycross. WRC2, Indy NXT, F2, and F3 appear as support events within their parent series.",
  },
  {
    question: "What time zone are race times shown in?",
    answer:
      "The calendar is built using Paris time (CET in winter, CEST in summer). Each event shows the local start time in that reference timezone. All dashboard countdowns are calculated from your browser's local system time, so they are accurate wherever you are in the world.",
  },
  {
    question: "How do the series filters work?",
    answer:
      "Use the category and region buttons at the top of the calendar to show only the series you care about — open wheel, endurance, bikes, touring cars, rally, or GT. You can also toggle individual championships on and off in the advanced filter panel. Your filter preferences are saved in your browser and persist between visits.",
  },
];

/** What the site shows: the list above while it matches the current season, otherwise nothing. */
export const CURRENT_FAQS: Faq[] = FAQ_SEASON === DEFAULT_CALENDAR_YEAR ? FAQS : [];

/**
 * country.js — which country's broadcasters to show.
 * Imported by watch.astro and series/[slug].astro.
 *
 * The country comes from the visitor, never from a guess. It used to be read
 * from the browser's language (en-US → "US"), which put American broadcasters
 * in front of English-speaking visitors in Europe. Now:
 *
 *   - the visitor answers the popup in CountryDialog.astro ("Use my location" or
 *     a dropdown), and the answer is remembered on this device only;
 *   - declining, or never answering, shows the US options (DEFAULT_COUNTRY).
 *
 * localStorage['dord-country'] holds one of:
 *   (nothing)  not asked yet   → US options
 *   'default'  said "no thanks" → US options
 *   'global'   "other country" → each series' worldwide option
 *   'FR' …     an ISO 3166-1 alpha-2 code
 */

const KEY = 'dord-country';

export const DEFAULT_COUNTRY = 'US';
/** Fired on window whenever the stored choice changes (this tab or another). */
export const CHANGE_EVENT = 'dord:country-change';

// Storage can throw (private windows, blocked site data). Keep the answer in
// memory too, so the page still reacts for the rest of this visit.
let memory = null;

function read() {
  try { return localStorage.getItem(KEY); } catch { return null; }
}
function write(value) {
  try { localStorage.setItem(KEY, value); } catch { /* memory still holds it */ }
}
function announce() {
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

/**
 * @returns {{ code: string, state: 'undecided' | 'declined' | 'chosen' }}
 *   `code` is what to look up in howToWatch: a country code, or 'global'.
 */
export function getChoice() {
  const v = memory ?? read();
  if (v === 'default') return { code: DEFAULT_COUNTRY, state: 'declined' };
  if (v === 'global') return { code: 'global', state: 'chosen' };
  if (v && /^[A-Z]{2}$/.test(v)) return { code: v, state: 'chosen' };
  return { code: DEFAULT_COUNTRY, state: 'undecided' };
}

/** @param {string} code A country code, or 'global' for the worldwide options. */
export function chooseCountry(code) {
  memory = code;
  write(code);
  announce();
}

export function declineLocation() {
  memory = 'default';
  write('default');
  announce();
}

// Another tab changed the answer.
window.addEventListener('storage', e => {
  if (e.key !== KEY) return;
  memory = null;
  announce();
});

/**
 * Broadcasters for the current choice.
 * A country with no entry falls back to the series' own worldwide option.
 *
 * @param {Record<string, Array<{name: string, type?: string, url: string, note?: string}>> | null} howToWatch
 * @returns {{ list: Array<object>, scope: 'country' | 'worldwide' | 'none', code: string }}
 */
export function pickBroadcasters(howToWatch, choice = getChoice()) {
  const code = choice.code;
  if (!howToWatch) return { list: [], scope: 'none', code };
  const local = code === 'global' ? null : howToWatch[code];
  if (local?.length) return { list: local, scope: 'country', code };
  const worldwide = howToWatch.global;
  if (worldwide?.length) return { list: worldwide, scope: 'worldwide', code };
  return { list: [], scope: 'none', code };
}

let regionNames = null;
/** "FR" → "France"; 'global' → "Worldwide". */
export function regionLabel(code) {
  if (code === 'global') return 'Worldwide';
  try {
    regionNames ??= new Intl.DisplayNames(['en'], { type: 'region' });
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

/**
 * Ask our own endpoint which country the connection is in (Cloudflare's IP
 * lookup, no GPS). Resolves to a country code, or null if it can't say.
 */
export async function detectCountry() {
  const base = document.querySelector('meta[name="astro-base"]')?.content ?? '';
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(`${base}/api/country`, {
      cache: 'no-store',
      credentials: 'omit',
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const { country } = await res.json();
    return typeof country === 'string' && /^[A-Z]{2}$/.test(country) ? country : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ── Popup ─────────────────────────────────────────────────────────────────────
// Markup lives in src/components/CountryDialog.astro.

export function openCountryDialog() {
  const dlg = document.getElementById('country-dialog');
  if (!dlg || dlg.open) return;
  initCountryDialog();
  const status = dlg.querySelector('#country-status');
  const select = dlg.querySelector('#country-select');
  if (status) status.textContent = '';
  if (select) {
    const { code, state } = getChoice();
    select.value = state === 'chosen' ? code : '';
    // A saved country with no option (e.g. detected in a country we list no
    // broadcasters for) leaves nothing selected; show the placeholder instead.
    if (select.selectedIndex === -1) select.value = '';
  }
  dlg.showModal();
}

export function initCountryDialog() {
  const dlg = document.getElementById('country-dialog');
  if (!dlg || dlg.dataset.ready) return;
  dlg.dataset.ready = '1';

  const status = dlg.querySelector('#country-status');
  const detectBtn = dlg.querySelector('#country-detect');
  const declineBtn = dlg.querySelector('#country-decline');
  const select = dlg.querySelector('#country-select');
  const applyBtn = dlg.querySelector('#country-apply');
  const say = msg => { if (status) status.textContent = msg; };

  detectBtn?.addEventListener('click', async () => {
    const label = detectBtn.textContent;
    detectBtn.disabled = true;
    detectBtn.textContent = 'Locating…';
    say('');
    const code = await detectCountry();
    detectBtn.disabled = false;
    detectBtn.textContent = label;
    if (!code) {
      say("We couldn't work out your country. Please pick it below.");
      select?.focus();
      return;
    }
    chooseCountry(code);
    dlg.close();
  });

  declineBtn?.addEventListener('click', () => {
    declineLocation();
    dlg.close();
  });

  applyBtn?.addEventListener('click', () => {
    if (!select?.value) {
      say('Choose a country first.');
      select?.focus();
      return;
    }
    chooseCountry(select.value);
    dlg.close();
  });

  // The dialog has no padding of its own, so a click that lands on the dialog
  // element itself is a click on the backdrop. Closing this way (and with Esc)
  // is "not now", not "no": nothing is saved, so we ask again next visit.
  // Both the press and the release must be on the backdrop: selecting text
  // inside the dialog and letting go outside it fires a click on the dialog
  // element too, and must not close it.
  let pressedOnBackdrop = false;
  dlg.addEventListener('pointerdown', e => { pressedOnBackdrop = e.target === dlg; });
  dlg.addEventListener('click', e => {
    const closeIt = pressedOnBackdrop && e.target === dlg;
    pressedOnBackdrop = false;
    if (closeIt) dlg.close();
  });
}

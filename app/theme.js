// theme.js — the reader's light/dark preference, and the only thing in the app that ever SETS it.
//
// THE CSS SIDE HAS EXISTED SINCE THE 2026-08-16 BRAND PASS and never had a way to be set: index.html
// defines :root (light), @media (prefers-color-scheme:dark), and the two :root[data-theme] override
// blocks, which outrank both by specificity. This module writes that one attribute.
//
// THREE STATES, NOT TWO. Following the OS is the current behaviour and the default. A two-state toggle
// would have to pick a starting side and would make "let the OS decide" UNREACHABLE — a regression for
// every user currently well served by doing nothing. So "system" is a first-class state, it is the
// initial state, and the cycle always returns to it.
//
// "system" REMOVES the attribute rather than writing data-theme="system". There is no palette block for
// that value and there must not be one (test/brand.test.js counts exactly four) — following the OS IS the
// absence of an override, so deleting the attribute is what lets the media query resume.
//
// NEVER THROWS. Safari private browsing throws on localStorage access, and this runs on the path that
// reveals the app. A cosmetic preference must never be able to stop a clinician getting into the tool —
// the same requirement usage.js carries for the beacon.
//
// NOT PART OF THE CASE. The case URL is shared between people and carries claims about the patient; the
// theme is a property of the reader's eyes. It is deliberately absent from S, encodeCase and syncURL, so
// a sender on dark mode does not impose dark mode on the recipient. Do not "fix" that asymmetry.
//
// Pure apart from the one `root` it is handed, which is why the whole resolve matrix is testable in node.

export const THEME_STORAGE_KEY = "nl_theme_v1"; // the nl_*_v1 convention: GATE_STORAGE_KEY, usage.js

// Cycle order. "system" is first because it is the default and the state the cycle returns to.
export const THEMES = ["system", "light", "dark"];

const isTheme = v => THEMES.includes(v);

// NOT a default parameter. `store = globalThis.localStorage` would be evaluated BEFORE the function body,
// so it would sit outside the try/catch — and Safari throws a SecurityError on the *property access* when
// cookies are blocked, not merely on setItem. That is precisely the case these functions promise to
// survive, so the lookup has to happen inside a guard.
function defaultStore() {
  try { return globalThis.localStorage || null; } catch { return null; }
}

/** The stored choice, or "system" for missing, unrecognised or unusable storage. */
export function readTheme(store) {
  try {
    const s = store === undefined ? defaultStore() : store;
    const v = s && s.getItem(THEME_STORAGE_KEY);
    return isTheme(v) ? v : "system";
  } catch { return "system"; }
}

/** Persist the literal choice, "system" included. Returns what it stored. */
export function writeTheme(value, store) {
  const v = isTheme(value) ? value : "system";
  try {
    const s = store === undefined ? defaultStore() : store;
    if (s) s.setItem(THEME_STORAGE_KEY, v);
  } catch {}
  return v;
}

/** system -> light -> dark -> system. An unrecognised current value enters the cycle at "light". */
export function nextTheme(current) {
  const i = Math.max(0, THEMES.indexOf(current));
  return THEMES[(i + 1) % THEMES.length];
}

/**
 * What the page will ACTUALLY look like. `prefersDark` is passed in rather than read from matchMedia so
 * the whole matrix is testable in node with no DOM. An explicit choice ignores the OS — that is the
 * entire point of an override.
 */
export function resolveTheme(choice, prefersDark = false) {
  if (choice === "light" || choice === "dark") return choice;
  return prefersDark ? "dark" : "light";
}

/** Write the attribute the CSS reads. "system" deletes it, handing control back to the media query. */
export function applyTheme(choice, root = globalThis.document?.documentElement) {
  const v = isTheme(choice) ? choice : "system";
  if (root && root.dataset) {
    if (v === "system") delete root.dataset.theme;
    else root.dataset.theme = v;
  }
  return v;
}

const GLYPH = { system: "\u{1F5A5}", light: "☀", dark: "\u{1F319}" };
const NOUN  = { system: "follow system", light: "light", dark: "dark" };

/** The glyph shows the state you are IN, never the one the next click gives you. */
export function themeGlyph(choice) { return GLYPH[isTheme(choice) ? choice : "system"]; }

/**
 * title + aria-label. The glyph alone is ambiguous — "light" on a light OS and "system" on a light OS look
 * identical on screen — so the words carry both the current state and what the next click does.
 */
export function themeLabel(choice) {
  const v = isTheme(choice) ? choice : "system";
  return `Theme: ${NOUN[v]} — click for ${NOUN[nextTheme(v)]}`;
}

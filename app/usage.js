// usage.js — counts how many times the app is actually OPENED, and nothing else.
//
// WHY THIS EXISTS: the app has been live for testers since 2026-07-27 with no way to tell whether anyone
// opened it. GitHub Pages is a static host with no accessible logs, and the repository traffic API covers
// the repo page rather than the Pages site, so there was no number to read anywhere.
//
// ── THE CONSTRAINT THAT SHAPES ALL OF THIS ──────────────────────────────────────────────────────────
// `case-url.js` deliberately carries the case in the URL **hash** rather than a query string, "so it never
// reaches a server log". The hash holds the findings entered (`f=`), the sensory level, the selected
// pathology. A drop-in analytics script would UNDO that design in one line, because the usual ones record
// `location.href` — which would ship clinical findings to a third party.
//
// So this module never touches `location`, never reads the DOM, and never accepts a free-text field. The
// payload is built from an EXPLICIT ALLOWLIST of primitives passed in as arguments, and
// `test/usage.test.js` asserts that a realistic case hash cannot appear in the serialized body. That test
// is the point of the file: it is what stops a well-meaning future edit from adding `url: location.href`.
//
// NOT a user identity. `install` and `session` are opaque random ids generated in the browser and stored
// locally. They are not derived from anything about the person, they say nothing about who they are, and
// clearing site data resets them. They exist only to separate "twelve opens by one tester" from "twelve
// testers", which is the whole question being asked.
//
// ── LIVE SINCE 2026-08-22 ───────────────────────────────────────────────────────────────────────────
// It shipped inert on 2026-08-22 and was switched on the same day once the owner had deployed the sink.
// Apps Script is used rather than an analytics vendor because the data lands in the owner's own Sheet,
// adds no third party to a clinical tool, and the payload is one you construct by hand rather than one a
// library collects for you. Setup, limits and the sink's source are in
// docs/superpowers/specs/2026-08-22-usage-counter-design.md.
//
// To turn it OFF again, set mode to "off" — the endpoint may stay, since mode is checked first.

import { VERSION } from "./brand.js";

export const USAGE_INSTALL_KEY = "nl_usage_install_v1"; // localStorage   — this browser, across visits
export const USAGE_SESSION_KEY = "nl_usage_session_v1"; // sessionStorage — this tab, this visit

// SWITCHED ON 2026-08-22. The endpoint is a Google Apps Script web app owned by the project owner, which
// appends one row per open to a private Sheet.
//
// THE URL IS PUBLIC AND THAT IS ACCEPTED, NOT OVERLOOKED: this repository is public, so anyone can read
// this line and POST to the endpoint. What that buys an attacker is junk ROWS — the script only ever
// appends, it returns no data, and the Sheet itself stays private. There is nothing to read back and
// nothing to leak. If the rows are ever polluted, the fix is to create a new deployment (which mints a new
// /exec URL) and replace this one; the old URL then 404s.
export const USAGE = {
  mode: "endpoint",  // "off" | "endpoint"
  endpoint: "https://script.google.com/macros/s/AKfycbw122YiQuUdnVlfM_iJJR7QympcD2DKyysE7sZtU4TdA97GFfW_nTL3yBGmcQ4DPZCz/exec",
};

// The ONLY fields that ever leave the browser. Adding one is a deliberate act with a test to update — do
// not spread an options object in here, because that is exactly how `url` or `findings` would arrive.
export const PAYLOAD_KEYS = ["app", "v", "event", "install", "session", "first", "ts"];

/**
 * Build the beacon body. Pure: every value is passed in, so there is nothing ambient to leak.
 * `first` distinguishes a first-ever unlock on this browser from a returning open — the gate stores an
 * "ok" flag in localStorage and short-circuits the passphrase afterwards, so without this flag the count
 * would silently be "first unlocks" rather than "opens", which is a different and much less useful number.
 */
export function usagePayload({ event = "open", install = "", session = "", first = false, now = Date.now(), version = VERSION } = {}) {
  return {
    app: "neurolocaliser",
    v: String(version),
    event: String(event),
    install: String(install),
    session: String(session),
    first: !!first,
    ts: new Date(now).toISOString(),
  };
}

// An opaque random id. Not a fingerprint: nothing about the browser or the person is hashed into it.
export function newId(rand = Math.random) {
  return `${Math.floor(rand() * 2 ** 32).toString(36)}${Math.floor(rand() * 2 ** 32).toString(36)}`.slice(0, 16);
}

/** Read-or-create an id in a Storage. Storage can throw (private mode, disabled cookies) — never propagate. */
export function stableId(storage, key, rand = Math.random) {
  try {
    const existing = storage && storage.getItem(key);
    if (existing) return existing;
    const made = newId(rand);
    storage.setItem(key, made);
    return made;
  } catch { return newId(rand); }
}

/**
 * Record one app open. Returns the payload that was sent, or null when nothing was sent.
 *
 * NEVER THROWS AND NEVER AWAITS THE NETWORK. This runs on the path that reveals the app, so a blocked
 * beacon, an offline browser or a misconfigured endpoint must be invisible to the user — a counter that
 * can stop a clinician getting into the tool would be a bad trade for a number.
 */
export function recordOpen({
  first = false,
  cfg = USAGE,
  localStore = globalThis.localStorage,
  sessionStore = globalThis.sessionStorage,
  fetchImpl = globalThis.fetch,
  now = Date.now(),
  rand = Math.random,
} = {}) {
  try {
    if (!cfg || cfg.mode !== "endpoint" || !cfg.endpoint) return null;
    const payload = usagePayload({
      event: "open",
      install: stableId(localStore, USAGE_INSTALL_KEY, rand),
      session: stableId(sessionStore, USAGE_SESSION_KEY, rand),
      first, now,
    });
    if (typeof fetchImpl === "function") {
      // text/plain avoids a CORS preflight, which Apps Script does not answer; no-cors means the response
      // is opaque, which is fine because there is nothing to read back. keepalive lets it survive the
      // navigation that follows an unlock.
      const p = fetchImpl(cfg.endpoint, {
        method: "POST", mode: "no-cors", keepalive: true,
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
      if (p && typeof p.catch === "function") p.catch(() => {});
    }
    return payload;
  } catch { return null; }
}

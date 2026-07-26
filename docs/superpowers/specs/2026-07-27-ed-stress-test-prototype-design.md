# ED stress-test prototype — deploy, gate, feedback, robustness, aesthetic

**Status:** design approved 2026-07-27; not yet implemented.

**Depends on:** nothing new in the engine. This is an `app/`-layer + deploy-layer increment plus one
aesthetic refresh of `app/index.html` CSS. Zero engine/model changes. Branch off `main`.

## Problem

The engine + teaching app are complete and green (48 suites / 1664 assertions), but the app only runs
on the owner's Mac at `http://localhost:8137/app/` via `app/serve.mjs`. To get real signal we need it
in front of **emergency-department doctors to stress-test**, and the goal spans four dimensions the
owner cares about equally: **clinical accuracy**, **usability under time pressure**, **general
reception/value**, and **robustness**. Accuracy is the one dimension we cannot validate ourselves — it
is exactly what the doctors' feedback is for — so "ready for accuracy testing" means "reachable + a
reliable way to capture *which case* looked wrong." The current build also has only a single-line
disclaimer and no way for a tester to report anything.

## Goal

Ship a **deployed, safety-framed, robust, feedback-capturing** prototype at a **password-gated URL**,
with the visual design elevated to feel like a **premium clinical instrument** — without breaking the
project's zero-build, zero-backend, client-only ethos. Nothing leaves the browser except the findings
a tester explicitly submits with feedback. All 48 existing suites stay green.

## Non-goals (YAGNI)

- Usage analytics / telemetry (reception is captured qualitatively via the feedback form).
- Any backend, serverless endpoint, or real enforced authentication.
- The parked engine work (pathology layer, multifocal DDx synthesis, further tracts).
- A speculative new "quick-entry" input mode — usability is *verified* first, built only if the
  stress test shows the existing exam tree + search is too slow.

## Decisions (locked in brainstorming 2026-07-27)

| Decision | Choice | Rationale |
|---|---|---|
| Deploy model | **GitHub Pages**, serving the repo static files as-is (no build step) | Simplest; app already runs unmodified in the browser. **Requires the repo to be public** (free Pages) and **pushing the 26 local commits** — both explicitly acknowledged; the push needs a separate go-ahead at deploy time. |
| Access gate | **Client-side passphrase** | Host-agnostic, zero login friction, fastest to ship. Honest framing: a speed-bump, not real security — there is *no patient data behind it*. |
| Feedback | **External form** (Google Form / Tally), pre-filled | Zero backend, structured responses the owner can analyze, low bedside friction. |
| Case sharing | **Shareable case URLs** (state ↔ URL hash) | Cheap primitive that makes feedback reproducible and lets doctors bookmark/share cases. |
| Aesthetic | **Refined clinical** | Reads as trustworthy first, beautiful second — the safest bet for doctor buy-in in an emergency setting. |

## Design

### 1. Entry gate — passphrase + safety acknowledgment (combined)

A single full-screen entry view rendered *before* the app, in one place so a tester passes one gate:

- **Passphrase field.** The correct passphrase is stored only as a **SHA-256 hex digest** constant in
  the app code (computed via `crypto.subtle.digest`), never in plaintext. On submit, hash the input and
  compare. A strong passphrase is required precisely because the hash is publicly visible once the repo
  is public.
- **Safety acknowledgment.** Copy states: *teaching prototype; not a medical device; not for clinical
  decisions; do not enter patient identifiers; findings stay in your browser.* An explicit "I
  understand" is required to proceed.
- **Persistence.** On success, set a flag in `localStorage` (e.g. `nl_gate_v1`) so testers are not
  re-gated every load. A version suffix lets us force re-acknowledgment if the copy changes.
- The gate is a **speed-bump, documented as such** in a code comment; changing the passphrase = replace
  the one digest constant (documented one-liner).

### 2. Shareable case URLs (state ↔ URL hash)

- **Serialize** the app state that defines a case — the set of `finding@side` tokens, `onset`, the
  active `mode`, and the selected site id — into a compact URL **hash** (not query string, so it never
  hits a server log). Format kept short and human-inspectable (e.g. `#f=weak_arm@left,weak_leg@left&o=acute&m=localise&s=<siteid>`).
- **Restore on load:** parse the hash, validate every token against the known finding vocabulary and
  site ids, silently **drop anything unknown** (hand-edited or stale links must never crash), and
  rebuild state.
- **Keep live:** update the hash whenever state changes, so the address bar is always a shareable
  snapshot and the back button works.
- This is a **pure serialize/deserialize module** (`app/case-url.js`) so it is unit-testable
  independently of the DOM.

### 3. Feedback button → external form

- A **"Report a problem"** control in the results header (visible whenever there is a result).
- Clicking opens the owner's external form in a **new tab**, pre-filled via query params with: the
  **current case URL** (the full shareable link), the **top result** (site name + id), and the
  **findings list**. For Google Forms this is `?usp=pp_url&entry.<id>=<value>...`.
- The form URL + field-id mapping live in one **config constant** (`app/feedback.js`) with a documented
  placeholder until the owner supplies the real form. The **URL builder is a pure function** →
  unit-testable.
- Privacy: only teaching-vocabulary findings leave, only on an explicit click, and the copy on the
  button reminds not to include identifiers.

### 4. Persistent safety bar

Replace the single faint disclaimer line with an **always-visible slim bar** (top or footer) carrying
the core framing, so the safety context is present on every screen, not just at the gate.

### 5. Error boundary

- Wrap the top-level render in `try/catch`. On any thrown error, render a **friendly failure panel**:
  a short apology, the **current case link**, and the **"Report a problem"** button — never a blank or
  broken page.
- The URL-hash parser is independently defensive (see §2) so a bad link degrades to an empty session
  rather than a crash.

### 6. Aesthetic elevation — "refined clinical"

An evolution of the existing navy / terracotta / cream system (kept, not replaced), toward a premium
medical-instrument feel. Presentation-only; no markup restructure beyond what the gate/bar/error panel
add. Levers:

- **Typography & hierarchy:** a more deliberate type scale, tighter heading treatment, more consistent
  use of the mono face for anatomical/technical tokens vs. the sans for prose.
- **Spacing & rhythm:** more generous, consistent whitespace and card padding; a calmer vertical rhythm.
- **Cards & depth:** refined borders/shadows/radius so the Where/Why/What cards feel crisp and layered
  rather than boxy.
- **The results moment:** make the primary localisation result feel like the deliberate focal point
  (stronger but restrained emphasis on the best site).
- **Restrained motion:** subtle, tasteful transitions (result appearing, card disclosure) — nothing
  that reads as gimmicky or slows a time-pressured user.
- **Light + dark** both remain first-class (the app already supports `prefers-color-scheme` + a manual
  toggle); both are tuned.
- The **entry gate** carries the identity/first-impression moment (this is the three-second judgment).

## Testing

Per the project's TDD norm (standalone scripts, `ok()` helper, `process.exit`), the **pure-logic**
additions each get a suite; DOM/visual pieces are verified in the browser preview.

- `test/case-url.test.js` — round-trip serialize→deserialize for representative cases; malformed /
  unknown-token / empty-hash inputs degrade safely; laterality and onset preserved.
- `test/gate.test.js` — the passphrase hash-and-compare returns true for the known passphrase, false
  otherwise (test against a fixed digest).
- `test/feedback-url.test.js` — the URL builder produces correctly encoded prefill params from a given
  case + result; empty/partial state handled.
- Add all three to the `test` script in `package.json` and the README/`npm test` chain.
- **Browser-preview verification** (per the harness verification workflow): the gate flow, the
  persistent bar, the error boundary (force a throw), the feedback button opening a pre-filled form
  (against the placeholder), shareable-URL restore, and the **mobile ergonomics pass** (tap targets,
  L/R/M side buttons, chip removal, results readability at phone width) + the aesthetic refresh in both
  light and dark.
- **Regression:** all 48 existing suites stay green.

## Deploy (separate, gated on explicit go-ahead)

1. Confirm the public-repo tradeoff (or fall back to Cloudflare/Netlify drag-deploy to keep it private).
2. Push local `main` to `origin` — **requires explicit go-ahead** (main has been held local, 26 commits
   ahead).
3. Enable GitHub Pages on the repo root; verify the app loads at the Pages URL and that `app/`'s
   `../src/` module imports resolve under the `/<repo>/` path prefix.
4. Hand the owner: the passphrase, and confirm the feedback form is wired.

## Handoffs the owner provides at implementation time

- The **passphrase** to give testers (only its SHA-256 digest is committed).
- The **feedback form** URL + field ids (built against a documented placeholder until then).

## Files

- New: `app/case-url.js`, `app/feedback.js`, `app/gate.js` (or gate logic inline in `app.js` — decided
  in the plan), `test/case-url.test.js`, `test/gate.test.js`, `test/feedback-url.test.js`.
- Changed: `app/app.js` (wire gate, URL sync, feedback button, error boundary), `app/index.html` (gate
  markup + safety bar + aesthetic CSS), `package.json` + `README.md` (test chain), `CLAUDE.md` +
  `CONTRIBUTING.md` (status).

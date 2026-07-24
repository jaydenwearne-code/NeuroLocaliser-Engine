# NeuroLocaliser web-app prototype — design spec

**Date:** 2026-07-20
**Increment:** the prototype UI (sub-project B) — a zero-dependency static web app over the finished engine +
causes layer. Answers **where** (site), **why** (reasoning + emergent syndrome), **what** (tempo-aware causes).
**Status:** approved design (brainstormed with the user), ready for implementation planning
**Depends on:** the engine (`src/engine/inverse.js` `solve`, `forward.js` `expectedFindings`), `syndromes.js`
`nameForSite`, and the causes layer `src/data/causes.js` `causesFor` (sub-project A, done).

## Architecture & stack

A **zero-dependency static web app** that imports the *real* engine ES modules directly — single source of
truth, no build step, no framework, matching the project. New `app/` dir:

- `app/index.html` — shell + inline `<style>` (reuses the artefact design system: cream/navy/terra palette,
  the IPSI/CONTRA/BILAT/MIDLINE/NONE badge colours, light + dark via `prefers-color-scheme` + `data-theme`).
  Loads `app/app.js` as `<script type="module">`.
- `app/app.js` — all UI logic. Imports: `solve` (inverse), `expectedFindings` (forward), `FINDINGS`,
  `CROSSES`, `NON_LATERALISED` (findings), `LOCALISING` (score), `nameForSite` (syndromes), `SITES` + the
  compose\* functions (sites), `causesFor`, `CATEGORIES`, `TEMPO` (causes).
- `app/exam-map.js` — the hand-authored **exam-flow curation**: an ordered list of exam steps, each a label
  + a list of finding ids (the full ~200 findings mapped; unmapped findings fall through to a "More" group so
  nothing is lost). Pure data.
- `app/serve.mjs` — a ~20-line zero-dependency Node static server (`node:http` + `node:fs`) so
  `node app/serve.mjs` serves the repo root at `http://localhost:8137` (ES-module imports need http, not
  file://). Serves `/app/` and `/src/` with correct `text/javascript` MIME.

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node app/serve.mjs`.

## Two modes (header toggle)

### Localise (primary) — the reasoning tool
Selected findings → `Set` of `finding@side` tokens → `solve(set, { dominantSide, sensoryLevel, distalReach })`.
Render three panels:

- **WHERE** — a **ranked list of localisation hypotheses**. The winner (`result.best.site`) shown prominently
  (site name from territory, level·part, side); below it, an expandable "other hypotheses considered" list
  from the scored candidates (re-run scoring over `candidateSites` or reuse `result`'s ranked data), each
  with a relative score bar. Multifocal: if `result.multi` covers >1 site (best single leaves localising
  findings unexplained), show "needs ≥2 lesions" with the cover.
- **WHY** — the emergent **syndrome name** (`nameForSite(best.site)`), then the observed findings split into
  **✓ explained** (in `best.exp`), **✗ unexplained** (observed − exp), **⚠ predicted-but-absent** (exp −
  observed, localising ones highlighted). Plus the orthogonal annotations when present: `result.level`
  (sensory level), `result.length` (reach/glove), dominant side.
- **WHAT** — `causesFor(best.site, { onset })` rendered by category (coloured by `CATEGORIES[].tint`), each
  cause with tempo + likelihood dots; **red-flag** causes flagged (+ the phonebook `red` string). An **onset
  filter** (All / hyperacute / acute / subacute / chronic) narrows the list live. A "derived" note when only
  the fallback applied.

### Atlas (flip-side) — exploration
Browse the neuraxis (the region-grouped level list, same grouping as the anatomy artefact) → pick a **site**
→ show `expectedFindings(site)` (its produced findings, badged by side), its `nameForSite` syndrome, and its
`causesFor`. The forward inverse — for learning where a lesion *presents*.

## Input model (exam-flow + search + grouped)

- **Exam-flow accordion (primary):** steps from `exam-map.js` in exam order — Higher function / cognition ·
  Speech · Cranial nerve I (smell) · II & visual fields · III/IV/VI eye movements · Pupils · V (face) · VII
  (facial) · VIII & vestibular · IX/X/XII bulbar · Motor (power) · Tone · Reflexes · Coordination · Sensation
  · Gait · Movement disorders · Autonomic / sphincter. Each lists its findings as checkboxes.
- **Search box:** filters/reveals findings by `desc`/id across all groups; Enter adds the top match.
- **"By data group" toggle:** the raw ~20 `FINDINGS` groups as an alternative view (nothing hidden).
- **Side handling:** precompute, at load, the set of sides each finding is ever emitted on (run
  `expectedFindings` over all candidate sites once). A finding offers exactly those sides — `NON_LATERALISED`
  → auto `@none` (no control); lateralised → L / R; midline-capable (saddle/sphincter) → adds "midline".
- **Selected chips:** removable, showing `finding@side`; a "clear all" + a couple of worked-example presets
  (e.g. "Wallenberg", "Bell's palsy") that populate findings, to demo the engine.
- **Advanced (collapsible):** dominant hemisphere (default left), sensory level (segment picker for cord),
  distal reach (for polyneuropathy) — the `solve()` options.

## Data flow (no engine changes)

Everything is client-side and read-only against the engine. `app.js` builds the token set from the chips,
calls `solve`, and renders. Atlas uses `expectedFindings` + `nameForSite` + `causesFor`. The engine, findings,
sites, syndromes and causes modules are imported unchanged — the app is a pure consumer.

## Files & responsibilities

| File | Responsibility |
|---|---|
| `app/index.html` | shell, styles, mounts app.js |
| `app/app.js` | state, input rendering, solve call, Where/Why/What + Atlas rendering |
| `app/exam-map.js` | exam-step → finding-id curation (data) |
| `app/serve.mjs` | zero-dep static server for local run |

Keep `app.js` sectioned (state · input UI · localise render · atlas render · helpers) so it stays legible;
if it grows past ~500 lines, split the render helpers into `app/render.js`.

## Testing / verification

No DOM test framework (zero-dep). Verify by **running it** (the `verify`/`run` skills):
1. `node app/serve.mjs`; open `http://localhost:8137/app/` in the Browser pane.
2. Drive worked cases and confirm the panels: **Wallenberg** preset → WHERE left lateral medulla, WHY names
   Wallenberg with the explained set, WHAT vascular PICA/dissection under an acute onset filter. **Bell's** →
   stylomastoid VII, WHAT Bell's/Ramsay-Hunt. A **pure-motor** capsular set → internal capsule, causes lacune.
3. Toggle onset filter (causes list changes); toggle Atlas mode (pick lateral medulla → its findings + causes).
4. Check dark mode + a narrow viewport (responsive; panels stack).
A tiny headless smoke test (`test/app-smoke.test.js`) asserts `exam-map.js` references only real finding ids
and covers a high fraction of `FINDINGS` — so the curation can't silently drift from the model. Registered in
`package.json`; keeps the "no stale data" guarantee even though the UI itself is verified by running.

## Out of scope (prototype)

- Persistence / accounts / sharing; printing; mobile-native; i18n.
- Editing the model from the UI (read-only consumer).
- Investigations / management guidance beyond the causes list (a later layer).

## Verification note

Not a medical device; not for clinical use — a teaching prototype. The banner states this.

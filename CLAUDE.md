# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Runtime — read this first

This machine has **no system Node** (no node/bun/deno, no Homebrew). A local Node v24 lives at
`~/.local/node-v24.18.0-darwin-arm64/` but is **not on PATH**. Prefix every command:

```
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test
```

`npm` fails without this (its shebang is `#!/usr/bin/env node`). Don't re-diagnose "node not found" —
the runtime exists, it's just off PATH.

This is a **zero-dependency ES-module** project (`"type": "module"`, no `node_modules`, no build step,
no linter). There is nothing to install.

> The Node-off-PATH note above is specific to the original Mac. In a fresh clone on another machine or the
> cloud, `node`/`npm` are normally already on PATH — just run `npm test` and `node app/serve.mjs` directly.

## Project state & how to resume (cold start)

**What this is:** an anatomy-driven neurological *localisation* engine (findings → **where**), with a
tempo-aware causes layer (**why**) and an educational next-steps layer (**what next**), plus a zero-build
teaching web app in `app/`.

**Status (current):** the full neuraxis engine is complete and the app has been reworked into a
clinician-grade teaching tool (localise → *where · why · what*), and packaged for ED stress-testing.
**51 test suites / 1737 assertions green** — always run `npm test` first to confirm before building on it. Milestones, newest last, with the design/plan
docs (in `docs/superpowers/`) that record every decision:

- **Raw-observations refactor (done)** — every finding is a *raw bedside observation*; syndromes emerge from
  co-occurring primitives. `syndromes.js` `BY_SITE` keyed by **site id**. Plan: `plans/2026-07-21-raw-observations-refactor.md`.
- **App UX-goals alignment (done)** — exam-flow input, UMN/LMN synthesis, drop-1 near-fit, functional (FND)
  flag (suppressed by any objective sign), educational next-steps. Plan: `plans/2026-07-21-app-ux-goals-alignment.md`.
- **Unify the two localiser engines (done)** — `solve()` is the single source of truth. The app's old
  count/superset `differential()` moved into `src/engine/inverse.js`; `solve()` now returns
  `differential`/`explainAll`/`display`/`defaultSite` alongside the scored `single`/`best`/`nearFit`/`multi`.
  `candidateSites()` is reflection-based (auto-includes every `compose*`) and exported. Plan: `plans/2026-07-24-unify-localiser-engines.md`.
- **Ranking realism (done)** — (1) **known-negative exclusion**: the un-entered opposite side of a lateralised
  finding is treated as confirmed-normal, so bilateral lesions (locked-in, transverse/anterior cord) drop out
  of unilateral pictures; excluded near-misses surface as a `ruledOut` teaching footnote. (2) **prevalence
  tiebreak** (`src/model/prevalence.js`): a coarse per-site tier orders tied sites by how common a lesion there
  is (cortical/subcortical + roots/nerves common; thalamic/brainstem/cord uncommon; bilateral/composite rare).
  Plan: `plans/2026-07-24-ranking-realism.md`. **Also:** cord `anterior/posterior/central` are now
  `buildingBlock` sites (composite-only; excluded from `candidateSites()`), fixing the spurious unilateral
  anterior-cord candidate.
- **Why-synthesis + neuraxis diagram (done)** — a long-tract taxonomy (`src/model/tracts.js`: corticospinal,
  spinothalamic, dorsal-column, corticobulbar; findings + course + decussation + per-waypoint detail/supply +
  direction), `src/engine/tracts.js` derivations (`tractsFor`, `tractNarrative`, `whyNotOthers`), and a
  derived clickable SVG (`app/neuraxis-diagram.js`). Plans: `plans/2026-07-24-why-synthesis-neuraxis-diagram.md`,
  `plans/2026-07-26-richer-why.md`. The Why panel now teaches: a composed **Course** narrative (anatomy +
  blood supply), a **Why-this-site** parsimony line, and a derived **Why-not-elsewhere** (per neuraxis-level
  bucket, the discriminating signs each alternative would add — "examine to exclude").
- **Causes breadth (done)** — `causesFor()` returns a derived `completion` (region-tuned generics for the
  surgical-sieve categories a site's curated causes don't cover), shown behind a "complete the surgical sieve"
  toggle. `regionOf`/`sieveGenerics` in `src/data/causes.js`. Plan: `plans/2026-07-25-causes-breadth.md`.
- **UI restructure (done)** — the flat exam accordion became a nested `EXAM_TREE` (higher-function→lobe→finding;
  cranial-nerves→nerve→finding; motor→pattern; sensation→pattern→modality; Tone/Reflexes/Wasting are their own
  top-level leaves), rendered recursively with generalised search; **presets removed**. `app/exam-map.js`
  (`EXAM_TREE` + `flattenFindings`). Plan: `plans/2026-07-25-ui-restructure.md`.
- **Output cards (done)** — the results pane is a compact header + three labelled cards (**Where / Why /
  What**) with progressive disclosure (ruled-out, sieve, per-site "why" collapsed). Plan: `plans/2026-07-26-output-cards.md`.
- **ED stress-test prototype (done)** — the app is now deployable for clinician stress-testing: a client-side
  passphrase gate + safety acknowledgment (`app/gate.js`), a persistent safety bar, shareable/restorable
  **case URLs** (`app/case-url.js`, state ↔ URL hash), a "Report a problem" button pre-filling an external
  form with the exact case (`app/feedback.js`), a friendly error boundary, a refined-clinical aesthetic pass,
  and a mobile ergonomics pass. Pure `app/`-layer + CSS; zero engine changes. Spec/plan:
  `docs/superpowers/{specs,plans}/2026-07-27-ed-stress-test-prototype*.md`. **Deploy is intentionally NOT done**
  — GitHub Pages needs the repo public + the local commits pushed (owner go-ahead required); swap the
  placeholder passphrase digest (`app/gate.js`) and feedback form config (`app/feedback.js`) before handing out the URL.

**Where the detail lives:** dated design specs in `docs/superpowers/specs/` and executable plans in
`docs/superpowers/plans/` (each plan's top line says whether it's implemented). `CONTRIBUTING.md` has the
long-form roadmap + "Next". *On the original Mac only,* there is a persistent `~/.claude` memory
(`neurolocaliser-engine-state` et al.) that does **not** travel with the repo — this file + the plan docs are
the source of truth on any other machine.

**Run the app:** `node app/serve.mjs` → http://localhost:8137/app/ (local static server). **DEPLOYED
(2026-07-27):** live on GitHub Pages at **https://jaydenwearne-code.github.io/NeuroLocaliser-Engine/app/**
(client-side passphrase `NeuroLocaliser`; gate is a speed-bump, no data behind it). Repo is **public**;
`origin/main` holds the full history and **auto-redeploys on every push to `main`**. The one pre-live handoff
still open: the **feedback form** in `app/feedback.js` is a placeholder (owner to supply a Google Form/Tally
URL + entry ids). See spec/plan `docs/superpowers/{specs,plans}/2026-07-27-ed-stress-test-prototype*`.

**Parked follow-ups (not yet done):**
1. **Multi-location DDx synthesis** — causes / next-steps / why are shown for the *one* selected lesion only;
   a genuinely multifocal picture has no combined cross-site view.
2. **Further pathways** — modelled so far: the 4 core tracts (corticospinal, spinothalamic, dorsal-column,
   corticobulbar) **plus 3 non-classical pathways** (oculosympathetic/Horner, MLF/INO, visual) added 2026-07-28,
   so non-tract findings get the rich Why (Course + why-not + diagram). Still fast-follows: spinocerebellar,
   central tegmental (palatal tremor), trigeminothalamic (face sensation).
3. **Pathology layer (optional)** — `umnLmnPattern()` already flags mixed UMN+LMN → MND; a fuller declarative
   cross-site pathology layer (ALS/MND, SCD, etc.) was scoped in `CONTRIBUTING.md` but is not built.

## Commands

- **All tests:** `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
  (runs every suite in sequence; exits non-zero on any failure).
- **A single suite:** run its file directly, e.g.
  `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cord.test.js`
- Each test file is a **standalone script** — no test runner/framework. It builds inputs, calls
  `solve()`, asserts with a tiny local `ok(label, cond)` helper, prints `PASS`/`FAIL` lines, and
  `process.exit(fail === 0 ? 0 : 1)`. When you add a suite, also add it to the `test` script in
  `package.json` and to the README/`npm test` chain.

## Architecture — derive, don't store

The engine **derives** neurological syndromes from anatomy rather than storing a hand-authored list.
Named syndromes (Weber, Wallenberg, Brown-Séquard…) are never encoded as rules — they *emerge* from
which anatomical structures share a lesion site, and are only *named* afterward by a lookup.

**The golden rule (see `CONTRIBUTING.md`):** never write `if (hasX && hasY) return "someSyndrome"`.
That belongs as structures sharing a site, not as logic. `src/data/syndromes.js` is a phonebook, not a
brain — remove it and the engine still localises, it just returns anatomy instead of an eponym.

### Layers (data flows model → engine → data)

```
src/model/     the declarative anatomy tables (edit these to add coverage)
  findings.js    vocabulary of examinable findings; CROSSES map (ipsi/contra default per finding)
  structures.js  each structure produces exactly ONE finding at a (level, part); optional per-
                 structure `crosses` override when a pathway crosses differently here
  sites.js       SITES derived from structures by (level, part, side); plus composers (hemi,
                 bilateral cord, cauda/conus midline). `buildingBlock` flags composite-only parts
                 (cord anterior/posterior/central) so they feed composers but aren't standalone candidates
  levels.js      ordered dermatome coordinate C2..S5 — an axis ORTHOGONAL to localisation
  prevalence.js  prevalenceOf(site) -> 2|1|0 (common/uncommon/rare) coarse per-site prior; TIEBREAK only
  tracts.js      the long tracts (corticospinal/spinothalamic/dorsal-column/corticobulbar): findings,
                 rostro-caudal course (level + detail + supply), decussation, direction; + NEURAXIS ordering
src/engine/    generic solver code (rarely changes when adding a region)
  forward.js     site -> expected signed findings; emits `${finding}@${side}` tokens
  score.js       scoreSite(): reward matches (LOCALISING findings weigh 3x), penalise unexplained
                 + over-prediction. Exports LOCALISING
  inverse.js     THE single localiser. candidateSites() (reflection over compose*, drops buildingBlock);
                 differential() = the broad count/superset narrowing list (known-negative exclusion +
                 prevalence tiebreak); solve() returns {differential,explainAll,display,defaultSite,ruledOut}
                 AND the scored single/best/nearFit/multi/level/length; knownNegatives(); ruledOutSites()
  tracts.js      tractsFor() (which tracts a finding-set implicates + candidate sites along each);
                 tractNarrative() (composed Course prose); whyNotOthers() (derived per-level discrimination)
  patterns.js    cross-cutting SYNTHESIS (NOT localisation): umnLmnPattern() and functionalFlag()
src/data/
  syndromes.js   thin descriptive phonebook keyed by emergent site id -> eponym + ddx + red flags
  causes.js      tempo-aware surgical-sieve DDx: causesFor(site,{onset}) -> {byCategory, completion, …}
                 (curated → phonebook → derived; `completion` = region-tuned sieve gap-fill). regionOf/sieveGenerics
  nextSteps.js   educational nextStepsFor(site) -> investigations + urgency + referral (teaching, not advice)
app/             zero-build teaching web app (pure consumer of the engine; no model changes)
  index.html     markup + all CSS
  app.js         renders the nested exam tree + the where/why/what output cards; pure consumer of solve()/
                 tractsFor()/causesFor()/nextStepsFor()
  exam-map.js    EXAM_TREE (nested category→subcategory→finding) + flattenFindings() (no presets)
  neuraxis-diagram.js  neuraxisSVG(): derived, clickable neuraxis SVG from the tract taxonomy + candidates
  serve.mjs      static server, port 8137
```

### Concepts that require reading several files together

- **Signed findings.** Everything is a `finding@side` token. `side` is a body side (`left`/`right`),
  or `bilateral`/`midline` for central/root lesions. The forward model produces them; the inverse
  solver compares against them. Laterality is the crux — most localisation bugs are crossing bugs.
- **Crossing is layered.** `findings.CROSSES` is the default (e.g. corticospinal crosses → contra in
  the brainstem). A structure may override with its own `crosses` field because the *same* pathway
  crosses differently by location (the corticospinal tract is contralateral in the brainstem but
  **ipsilateral** in the cord, below its decussation). `forward.bodySideFor()` resolves this.
- **Sites are derived, never hand-listed.** A site pulls its structures from those sharing a
  `(level, part)`; `part` is the vascular/anatomical zone. That co-occurrence (structures sharing a
  blood supply or canal) is *why* a syndrome's features cluster — model the territory, get the
  syndrome free. Larger lesions come from **composers** (`composeHemiLevelSites`,
  `composeBilateralCordSites`, `composeCaudaConusSites`) that union parts into composite candidate
  sites; `inverse.candidateSites()` concatenates them all.
- **Orthogonal axes.** The cross-sectional pattern says *which* syndrome; the sensory level
  (`levels.js` + `describeLevel`) says *where along the cord* — it annotates the winner, never changes
  it. New per-region mechanisms follow this shape: add a small, well-contained axis rather than
  branching the solver.

### Extending coverage (the recipe)

Regions are added the same way every time, editing mostly the `src/model/` tables:
findings (+ `CROSSES`, + `LOCALISING` in `score.js` if it pins location) → structures (one structure =
one finding) → sites (extend `LEVELS`/`PARTS`/`TERRITORY`, or add a composer) → optional phonebook
entry → **tests first** (TDD: write the emergence test red, add anatomy until green, keep all prior
suites green). `CONTRIBUTING.md` has the full roadmap and modelling notes.

### Design docs & history

Per-region designs and implementation plans live under `docs/superpowers/specs/` and
`docs/superpowers/plans/` (dated, one per region increment). Read the relevant spec before changing a
region's mechanism. This is not a git repository, so history lives in those docs and the test suites
rather than in commits.

Two published Claude Artifacts (a flow diagram and the anatomy review sheet) visualise the engine;
their HTML source and the update workflow (edit here, republish to the same URL) are in
`docs/artifacts/`. Keep them in sync after each region increment.

Not a medical device; not for clinical use. The anatomy tables still need neuroanatomist review.

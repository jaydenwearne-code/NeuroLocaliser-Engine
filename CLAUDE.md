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

**Status (current):** the full neuraxis engine is essentially complete and the app is aligned to its UX
goals. **44 test suites / 1570 assertions green** — always run `npm test` first to confirm before building on
it. Milestones, newest last, with the design/plan docs that record every decision:

- **Raw-observations refactor (done)** — every finding is now a *raw bedside observation*; clusters (CN III/IV/VI
  palsies, bulbar, facial UMN/LMN, Horner, parkinsonism, Gerstmann, Balint, and `hemiparesis`→`weak_arm`+
  `weak_leg`) were retired and now *emerge* from co-occurring primitives. `syndromes.js` `BY_SITE` is keyed by
  **site id**, so decomposition never broke the phonebook. Plan: `docs/superpowers/plans/2026-07-21-raw-observations-refactor.md`.
- **App UX-goals alignment (done)** — 4 workstreams: input grouped by lobe + a Brainstem step + a Fatiguability
  step with clinician-friendly labels (`app/exam-map.js`, `app/app.js`); a **UMN/LMN** synthesis readout; a
  **drop-1 (non-localising) near-fit** relaxation + a **functional (FND)** flag that is *suppressed whenever any
  un-fakeable objective finding is present* (safety: never mask a serious sign as functional); and an
  **educational next-steps** panel. Plan: `docs/superpowers/plans/2026-07-21-app-ux-goals-alignment.md`.

**Where the detail lives:** dated design specs in `docs/superpowers/specs/` and executable plans in
`docs/superpowers/plans/` (each plan's top line says whether it's implemented). `CONTRIBUTING.md` has the
long-form roadmap + "Next". *On the original Mac only,* there is also a persistent `~/.claude` memory
(`app-ux-goals-alignment-done`, `raw-observations-refactor-done`, `neurolocaliser-engine-state`) — that does
**not** travel with the repo, so this file + the plan docs are the source of truth on any other machine.

**Run the app:** `node app/serve.mjs` → http://localhost:8137/app/ (local static server; nothing is hosted
externally). **Git:** tracked on GitHub (`origin/main`).

**Parked follow-ups (not yet done):**
1. **Multi-location DDx synthesis** — causes / next-steps are shown for the *one* selected lesion only; when
   the picture is genuinely multifocal there is no combined view across the plausible sites.
2. **Unify the two localiser engines** — the app's differential list uses strict superset (`app.js`
   `differential()`) while the multifocal / near-fit path uses the scored `solve()` (`inverse.js`); they
   coexist and express "confidence" slightly differently.

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
                 bilateral cord, cauda/conus midline) for lesions spanning parts
  levels.js      ordered dermatome coordinate C2..S5 — an axis ORTHOGONAL to localisation
src/engine/    generic solver code (rarely changes when adding a region)
  forward.js     site -> expected signed findings; emits `${finding}@${side}` tokens
  score.js       scoreSite(): reward matches (LOCALISING findings weigh 3x), penalise unexplained
                 + over-prediction
  inverse.js     solve(): rank single sites, else minimal-set cover (the multifocal hypothesis);
                 nearFit() = drop-1 (non-localising) relaxation; describeLevel() attaches the sensory level
  patterns.js    cross-cutting SYNTHESIS over the finding set (NOT localisation): umnLmnPattern() (UMN /
                 LMN / mixed→MND) and functionalFlag() (positive FND signs; suppressed by any objective sign)
src/data/
  syndromes.js   thin descriptive phonebook keyed by emergent site id -> eponym + ddx + red flags
  causes.js      tempo-aware surgical-sieve DDx: causesFor(site,{onset}) (curated → phonebook → derived)
  nextSteps.js   educational nextStepsFor(site) -> investigations + urgency + referral (teaching, not advice)
app/             zero-build teaching web app (pure consumer of the engine; no model changes)
  index.html · app.js · exam-map.js (exam-flow finding groups + presets) · serve.mjs (static server, port 8137)
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

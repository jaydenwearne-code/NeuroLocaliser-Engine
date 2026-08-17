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
**59 test suites / 3432 assertions green** — always run `npm test` first to confirm before building on it. Milestones, newest last, with the design/plan
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
- **Code-stroke mode (done)** — a third mode alongside localise/atlas: a single-scrolling clinician's
  **cognitive-aid worksheet** (intake · live clock vs decision windows · NIHSS · likely syndrome/LVO reusing
  `solve()` · thrombolysis & thrombectomy eligibility checklists · acute-mgmt reference · stroke-mimic prompt ·
  handover summary). Educational only — **never a treat/don't-treat verdict**; shows met/not-met/need-info +
  per-item citations + a persistent safety banner. Clinical criteria from the **2026 AHA/ASA guideline**
  (DOI 10.1161/STR.0000000000000513), owner-reviewed; glucose in mmol/L; contraindications reframed relative
  per 2026 (confirm full Table-8 list + local protocol). New files: `app/stroke-data.js` (cited data),
  `app/stroke-logic.js` (pure logic), `app/code-stroke.js` (worksheet DOM). Spec/plan:
  `docs/superpowers/{specs,plans}/2026-07-28-code-stroke-mode*.md`. Built via subagent-driven development.
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
`origin/main` holds the full history and **auto-redeploys on every push to `main`**. **Feedback is live** via
`app/feedback.js` `feedbackHref()` in **mailto mode** → the filterable alias `jayden.wearne+neurolocaliser@gmail.com`,
pre-filling the case link + top result + findings + a curated question set; the `mode:"form"` Google-Form path
stays wired for a later swap. See spec/plan `docs/superpowers/{specs,plans}/2026-07-27-ed-stress-test-prototype*`.

**CODE-STROKE MODE: MERGED to `main` and DEPLOYED live (2026-08-07).** The thrombolysis contraindication table
is **owner-approved** — the full standard AHA/ASA set (7 absolute + 7 relative) in `app/stroke-data.js`
`THROMBOLYSIS_CRITERIA`, with a standing "verify against local protocol" line (no outstanding Table-8 item).
Branch `feat/code-stroke-mode` is merged (safe to delete). Everything — code-stroke + the full pathologies/workup
layer — is on `main`, so the "expand pathologies + workup" work below branches off `main`.

**Parked follow-ups (not yet done):**
1. **Further pathways** — **10 pathways now modelled** (all in `src/model/tracts.js`, same declarative shape):
   the 4 core tracts (corticospinal, spinothalamic, dorsal-column, corticobulbar) + 3 non-classical
   (oculosympathetic/Horner, MLF/INO, visual) + 3 fast-follows added 2026-07-28 (cerebellar/spinocerebellar,
   central tegmental/palatal tremor, trigeminothalamic/face sensation). Non-tract findings get the rich Why
   (Course + why-not + diagram). No major pathway gaps remain.
2. **Pathology layer (optional)** — `umnLmnPattern()` already flags mixed UMN+LMN → MND; a fuller declarative
   cross-site pathology layer (ALS/MND, SCD, etc.) was scoped in `CONTRIBUTING.md` but is not built. **Partly
   superseded:** the multi-location DDx layer below now names MND (and 12 other cross-site entities) when a
   picture spans sites, so the motivating case for this item is covered — what remains is anything that would
   fire on a SINGLE site's UMN+LMN co-occurrence alone, which is out of scope for a cross-site layer.

## Pathologies + workup expansion (DONE 2026-08-10) — ⚠ AWAITING CLINICAL REVIEW

**Merged to `main`.** Curated coverage went from ~37 sites to **ALL 201**: every site now has BOTH a
hand-curated `CAUSES` entry and a curated four-tier `NEXT` workup. **900 cause entries** — 858 with a
discriminating `feature`, 332 red-flagged, 30 inline `pathognomonic` plus the central keyword table.
Built region by region (A cortex → B cord/lacunar → C brainstem/cerebellum → D skull-base/CN-course →
E named nerves/motor unit → F roots/plexus → G remaining cortex → H closing sweep), TDD throughout.

- **New `mimic` category** (owner-approved): a 9th bucket for non-lesional differentials of the
  *presentation* (Todd's paresis, migraine aura, hypoglycaemia, delirium). Listed LAST, labelled "Mimic
  (not a lesion at this site)", with its own `--mimic` CSS token. It sits **outside the surgical sieve**,
  so the `completion` gap-fill must never fabricate a generic mimic (asserted across all sites).
- **Two GLOBAL invariants** in `test/next-steps.test.js`: (1) no curated cause list may sit beside a
  generic derived workup; (2) every curated workup fills all four tiers. Both at zero gaps.
- **`rootNS` builder** in `nextSteps.js` keeps the shared radiculopathy red flags consistent across all
  17 roots by construction. Reuse that pattern for any future near-identical family.
- **Testing trap worth knowing:** several older tests used a REAL site as their stand-in for
  "uncurated"/"phonebook-sourced" and broke as curation advanced. They now use a synthetic part
  (`zz_never_curated`) or, for the phonebook path, delete-probe-restore. Don't reintroduce hard-coded
  site ids as proxies for curation status.

> **✅ REVIEWED AND SIGNED OFF (2026-08-11).** Authored to the agreed norms (discriminating features, red
> flags, bedside-only pathognomonic signs, no doses) and subsequently deepened by the 2026-08-11 sweep
> below; the owner's clinical sign-off covers all eight regions. The review gate is closed.

**Where & how (for extending it further):**
- **Pathologies:** add/extend a curated `CAUSES["<site.id or level_part>"]` entry — a list of
  `c(name, category, tempo[], likelihood, red?, feature?, pathognomonic?)`. `category` ∈ the surgical-sieve
  `CATEGORIES`; `tempo` ∈ `TEMPO` (hyperacute/acute/subacute/chronic); `feature` = a discriminating clue;
  `pathognomonic` = a genuine bedside "Confirm on exam" sign (or add the pathology to the central
  `PATHOGNOMONIC` keyword table so it flags wherever named). Curated entries take precedence over the
  phonebook/derived fallback; the app shows the full sieve inline (`causesFor(site,{onset})`).
- **Workup:** add/extend a curated `NEXT["<site>"]` entry — `ns(investigations, urgency, referral, {immediate?,
  confirmatory?, monitoring?})`. Uncurated sites already get tiers derived from urgency + region, so curate
  where the specifics matter.
- **TDD:** assert emergence/coverage in `test/causes.test.js` and `test/next-steps.test.js` first, then add
  content until green; keep all suites green. Run: `PATH=… npm test`.
- **Clinical accuracy (hard norm):** cause lists, red flags, and `pathognomonic` signs must be clinically
  sound; keep `pathognomonic` to genuine bedside signs (not investigations — those are workup). Flag anything
  uncertain for the owner's (clinician) review before relying on it — as was done for the code-stroke content.
- **Base branch:** everything is on `main` — branch off it. The `feat/expand-pathologies-workup` branch that
  built this layer is merged and safe to delete.

## Differential-depth sweep + fundoscopy findings (DONE 2026-08-11) — ⚠ STILL AWAITING CLINICAL REVIEW

**The generic sieve gap-fill is GONE.** `SIEVE_GENERICS` / `sieveGenerics()` / the `completion` key are
deleted; `causesFor()` returns `{byCategory, all, onset, derived, source}`. A sieve category with no
plausible cause at a site simply does not appear. **The sieve is an authoring checklist, not an output
format — it must never manufacture content to fill itself.** (349 of 375 sites used to fire the filler.)

**All 201 keys swept to a depth bar**, enforced by `test/causes-depth.test.js` over `CAUSES` directly:
≥6 causes per site, every cause carries a discriminating `feature`, every site names ≥1 red must-not-miss,
no two sites emit an identical cause list, `pathognomonic` may not name an investigation, and no feature
repeats a word at a builder join. **900 → 1286 cause entries.**

**Three family builders** live above `export const CAUSES` in `causes.js` — `sbSpine()` (skull-base
corridors), `nvSpine()` (named nerves), `rtSpine()` (roots). Each interpolates the site's own SHORT deficit
phrase into shared text, so common red flags stay phrased identically by construction while no two sites
emit the same list. Two phrasing rules are written into their comments: join with an em-dash clause, never
a relative pronoun; keep the deficit short enough to sit mid-sentence. A site PICKS only the spine items
that genuinely reach it — never to pad a list to length. Plexus elements and cord cross-sections are
deliberately NOT families.

**Fundoscopy + acuity findings** (`test/fundus.test.js`): `papilloedema`, `optic_atrophy`, `retinal_pallor`,
`va_reduced_no_pinhole`, `va_reduced_pinhole_corrects`, plus a new `visual_pathway|retina` site (CRAO).
Two of them are produced by NO structure, by design:
- **`papilloedema` is an ORTHOGONAL COMPARTMENT AXIS**, not a site finding — `raisedPressureAxis()` +
  `INTRACRANIAL_LEVELS` in `inverse.js`, the same shape as the sensory level. It says *inside the skull*,
  not where. Modelling it per-site claims it as part of every cortical syndrome and penalises every
  intracranial site for over-prediction when it is absent (tried it; five suites correctly rejected it).
  **The token must be stripped in `solve()` as well as `differential()`**, or every scored path counts it
  as permanently unexplained.
- **`va_reduced_pinhole_corrects`** raises `refractiveFlag()` in `patterns.js`, modelled on `functionalFlag`
  including the safety suppression: any organic visual sign suppresses it, because a pinhole improvement
  never excludes disease behind it.

**Fundal photography + OCT** are appended to the workup by `ophthalmicImaging()` in `nextSteps.js`, DERIVED
from either a visual-field/optic finding in the site's `expectedFindings` or a papilloedema/raised-ICP cause.
Normal-pressure hydrocephalus is excluded by name — the pressure is normal, so there is no disc swelling.

> **✅ CLINICALLY SIGNED OFF (2026-08-11) by the owner (a clinician), covering all eight regions — all
> 1286 cause entries, the fundoscopy/acuity findings and the new retina site.** The review gate that had
> been open since 2026-08-10 is now closed. Content added from here should be held to the same bar and
> flagged for review if uncertain. Spec + outcome table:
> `docs/superpowers/specs/2026-08-11-differential-depth-design.md`.

## Multi-location DDx layer (DONE 2026-08-14) — ✅ CLINICALLY SIGNED OFF

**What it answers:** when a picture genuinely needs more than one lesion, *what single disease hits both
of these places?* Previously causes/next-steps/why were shown for the one selected site only; a multifocal
picture had no combined cross-site view at all.

**Four new files keep content and logic apart**, the same split the rest of the engine uses:
- `src/model/compartments.js` — a level→compartment axis (`COMPARTMENTS`, `LEVEL_COMPARTMENT`,
  `compartmentOf(site)`). Finer than `regionOf()` in `causes.js` (which lumps brain and cord together as
  `parenchyma`) — the roster needs brain and cord apart, because "disseminated in space" for MS means
  brain **and** cord. `INTRACRANIAL_LEVELS` in `inverse.js` now **derives** from this table
  (`INTRACRANIAL_COMPARTMENTS`) instead of being a second, hand-listed set that could drift from it.
- `src/model/course.js` — the `COURSES` vocabulary (single/simultaneous/stepwise/relapsing/progressive):
  *how the illness unfolded*, orthogonal to onset tempo and much the stronger discriminator for the
  cross-site roster (vasculitis is stepwise, MS relapsing, MND progressive, an embolic shower simultaneous
  — without it, MS/mets/MND all present as "two CNS sites, subacute").
- `src/data/multifocal.js` — **content only, no logic**, so it can be clinically reviewed on its own: the
  13-entity `MULTIFOCAL` roster (see below) plus `FINDING_CLASSES` (named finding classes, e.g. `sensory`,
  for entities that `forbid` a class rather than an individual finding id).
- `src/engine/multifocal.js` — **logic only, no content**: `unifyingDiagnoses(sites, observed, {onset,
  course})` matches the roster against a site set, and `forcingFindings(observed, opts)` — the parsimony
  guard (below). Plus `combinedCauses()` in `causes.js` (cross-site cause intersection) and
  `combinedNextSteps()` in `nextSteps.js` (unioned workup, urgency = the MOST urgent site, never an
  average), and `app/combined-sites.js` (resolves what the Together/What/Next cards show: the user's
  pinned pair if still valid, else the engine's own minimal cover — pure/DOM-free, directly testable).

**Hard anatomical constraints FILTER; tempo and course only DEMOTE** into a labelled, collapsed band — an
owner ruling. A tempo or course mismatch is informative, not disqualifying: a stepwise course argues
against MS without erasing it from the list. This ruling **extends to `causesFor()` itself**, which
*previously hard-filtered by tempo* — a cause whose tempo didn't match the entered onset used to vanish
entirely. It now moves to a `demoted` bucket (same shape as the roster's discordant band) instead of being
dropped, so the single-site What card and the cross-site Together card demote consistently.

**The parsimony rule:** multifocality is a claim that must be earned, so the Together card's first job is
to try to talk you out of it. Order matters and is fixed: (1) the **forcing-finding guard** — for each
`LOCALISING` finding in the observed set, does removing it collapse the picture to one site? Each forcing
finding is named together with the site the picture collapses to *if* that finding is dropped (different
forcing findings can collapse to different sites, e.g. two mirrored lesions each pinned by the other side's
vertigo token — reporting under one shared field would misname the rest); (2) **which sites** are being
compared (the user's pinned pair, if two-plus pins are still present in the current differential, else the
engine's own minimal-set cover — `app/combined-sites.js`); (3) **the disease list** — concordant entities
open, tempo/course-discordant ones collapsed behind a "less likely given…" disclosure. A guard, then sites,
then diseases — never diseases first.

**The `LOCALISING` audit** (`src/engine/score.js`): **12 findings promoted** into `LOCALISING` (raising
their match weight 1→3 and letting them force a second lesion) — the fundoscopy pair
(`retinal_pallor`/`optic_atrophy`) that arrived with the 2026-08-11 sweep and was missed, plus
`cortical_sensory_{arm,leg,hand}`, `weak_hand`, `weak_scapular_stabilisation`, `lid_retraction`,
`verbal_memory_impairment`, `nonverbal_memory_impairment`, `disinhibition`, `executive_dysfunction`.
**9 findings excused** with a stated reason in the new `NOT_LOCALISING_BY_DESIGN` map (e.g.
`lmn_weakness`, `naming_impaired`, `proximal_weakness`, `hallucinations`) — a new invariant
(`test/localising-audit.test.js`) asserts every finding the forward model produces at exactly one level is
either in `LOCALISING` or in `NOT_LOCALISING_BY_DESIGN`, so nothing can fall through silently again. **The
owner rejected three proposed promotions from the batch:** `fasciculations` (occurs at any LMN level; a
single producer in this model is a modelling limit, not a clinical fact — same reasoning as
`lmn_weakness`), `palmomental` (a non-specific frontal release sign) and `rigidity` (rigidity sits on the
tone axis with spasticity/hypotonia — it can be UMN or extrapyramidal, so it does not itself pin a place).
**A producer-count rule alone is the wrong test either way:** `limb_ataxia` spans 7 levels / 24 sites and
is nonetheless correctly `LOCALISING`, because it pins a **system** (the cerebellar/proprioceptive
pathway), not a level — the audit is a judgement about what a sign means clinically, not a count threshold.

**Canonicalisation.** Naive verbatim cause-name intersection across sites does not work — measured before
building `combinedCauses()`: **856 distinct cause names, only 147 repeat verbatim**, and MS alone appears
under 8-plus spellings ("Demyelination", "Demyelination (MS)", "Multiple sclerosis", …). So
`combinedCauses()` canonicalises through the roster's own `matches` regex first (`canonicalKey()` in
`causes.js`) — one table doing double duty, naming the cross-site entity and supplying the intersection
key, so there is no second alias map to drift — and falls back to the verbatim name (which already works
for the family-builder sites) when no regex matches. **A name matching TWO OR MORE roster regexes is left
uncanonicalised rather than guessed**, exactly like a name matching zero: a hedged differential ("small
metastasis or demyelinating plaque") names two different diseases, and collapsing it onto whichever
regex happens to sit earlier in the roster array would silently misrepresent it and make roster order
load-bearing.

**Pinning + course control (app-layer only, no model changes):** a 📌 button on each differential row lets
the user pin exactly two sites to compare a specific pair instead of the engine's own minimal cover; a
course `<select>` feeds `S.course` into `unifyingDiagnoses()`; both round-trip through the case-URL (`p=`
pinned-ids, `c=` course). A scope toggle ("This site" / "All N sites") switches the What/Next cards between
the single-site view and the merged cross-site view — **every call site of `combinedSites()` must pass the
pinned Set explicitly**, or the Together card and the What/Next cards can silently describe different sites
on the same screen (this shipped once; `test/combined-sites.test.js` guards the call sites, comment-aware).

> **✅ CLINICALLY SIGNED OFF (2026-08-14/15).** The 13-entity roster was reviewed entity by entity and
> produced five owner rulings, all applied: keep the fundoscopy/slit-lamp `confirm` fields; give MS a red
> flag for a first presentation disseminated in space; fix the optic misfiling so NMOSD can fire on its own
> archetype; restrict MS to the CNS; and constrain every entity to where its disease TYPICALLY presents
> rather than everywhere it could reach. **The `LOCALISING` 12-promoted / 9-excused split was walked in
> full and approved on 2026-08-15** — the whole list, with the model footprint of each finding, after the
> owner had already ruled out three proposed promotions (`fasciculations`, `palmomental`, `rigidity`) and
> declined three further challenges I raised against `disinhibition`, `executive_dysfunction` and
> `optic_atrophy`. **There is no open review item on this layer.** New suites: `test/compartments.test.js`,
> `test/localising-audit.test.js`, `test/multifocal.test.js`, `test/combined-sites.test.js`. Spec/plan:
> `docs/superpowers/specs/2026-08-14-multi-location-ddx-design.md`,
> `docs/superpowers/plans/2026-08-14-multi-location-ddx.md`.


## Multifocal SUBSTRATE axis (DONE 2026-08-15) — ✅ CLINICALLY SIGNED OFF

**What it fixes.** The cross-site roster fired on a COUNT (`spread: {minSites: 2}`), so nine of thirteen
entities appeared together. The owner reported it from the live app: right arm + left leg weakness offered
leptomeningeal disease and paraneoplastic syndrome (clinically a stretch) while multiple sclerosis — which
would genuinely explain it — was blocked by its own `distinctCompartments`, because two hemispheres are
both the `brain` compartment.

**Two authored tables, both keyed `${level}|${part}` (NEVER by `part` alone — `lateral`, `hemi`, `medial`
and `anterior` are each reused across levels, so a bare-name key would give lateral medulla (PICA) and
lateral midbrain one shared row; 94 part names but 104 keys):**
- **`src/model/vascular.js`** — `vessel`, `segment` (M1–M4 / A1–A5 / P1–P4), `branch`, `zone` across 104
  CNS keys. Authored, not parsed: `site.territory` is prose and **0 of 211 strings carry a vessel segment**.
  49 keys have a real segment; 55 are deliberately null, each with a reason in `SEGMENT_NULL_REASON`, and
  the suite asserts the null set and the reason set match exactly in both directions.
- **`src/model/topography.js`** — `lobe`, `surface` (CSF-bathed vs deep parenchyma), `system` (the
  selectively vulnerable systems), across all 202 keys. `surface` is decided by COMPARTMENT exhaustively,
  and the suite asserts the RULE rather than the values, so a new site cannot land undetermined.

**`src/engine/space.js`** derives `separatedInSpace(sites, axis)` over five axes — `segment → vessel →
lobe → hemisphere → level`. A site that cannot speak on an axis (null segment, or a nerve with no vascular
row) DISQUALIFIES that axis rather than comparing equal: two nulls must never read as "the same place".

**`src/model/substrate.js` — THE KEY IDEA.** A disease attacks a SUBSTRATE, and that substrate has its own
distribution through the body. **Vasculitis crosses the CNS/PNS boundary because vessels are on both sides
of it; metastases do not, because parenchyma is not.** Substrates (`vessel`, `parenchyma`, `leptomeninges`,
`myelin_cns`, `schwann`, `neuron_population`, `motor_neuron`) are DERIVED from the two tables above, so a
new site inherits them automatically. Entities declare `substrate` plus an optional `distribution`
(`segment` for embolic lodging, `any` for MS, `nerveTrunk` for vasa nervorum).

**An intermediate "lesion pattern" axis was built, measured and REJECTED — the history matters.** Seven
patterns each phrased "every site is X". Measured: silent pairs rose **7.8% → 38.0%**, **74% of them mixed
CNS+PNS**, and `cord + L5 root` returned an empty card — because a mixed picture satisfied no single
pattern, so the two diseases whose defining feature is hitting BOTH sides were exactly the two that could
never fire. The first proposed fix (give vasculitis a `mass` pattern) was **rejected by the owner as a
workaround**: it attributes a non-vascular attribute to a vascular disease to make the mechanics work.
The substrate axis is the structural answer, and it returned the silent rate to **7.8%** — the pre-pattern
baseline — while leptomeningeal fell 54%→8% and paraneoplastic 47%→6%.

**Two invariants worth keeping:**
- **A `compartments` allow-list must be strictly NARROWER than its substrate's footprint, or it is
  deleted.** It fired immediately and removed two (MS, paraneoplastic) that merely restated their
  substrate. Substrate answers *is the target tissue here*; the allow-list answers *does this disease
  actually turn up here* — the four that survive (embolic-not-cord, lymphoma-not-cord, sarcoid-not-cauda,
  vasculitis-not-NMJ/pupil/sympathetic/cauda) are typicality judgements substrate cannot express.
- **Vasculitis deliberately has NO distribution rule** and fires on ~92% of pairs. All four candidates were
  measured: separated-`any` 97.3% and distinct-vascular-unit 96.9% (no narrower), separated-`vessel` 21.5%
  and separated-`segment` 5.0% (both narrow only by disqualifying nerve sites, re-breaking `cord + L5
  root`). Spatial separation cannot discriminate vasculitis because that is what vasculitis always HAS; its
  real discriminator is temporal (stepwise), which lives in `course` and DEMOTES. **Owner's decision: accept
  the breadth.**

**The fire-rate measurement caught a bug no unit test did:** NF2 at 0.0%, because `schwann` omitted
`skull_base` — and a vestibular schwannoma at the IAM is a Schwann-cell tumour. Fixed (NF2 → 12.6%), with a
test that also pins the optic nerve as NOT Schwann (it is oligodendrocyte-myelinated).

> **✅ CLINICALLY SIGNED OFF (2026-08-15) by the owner (a clinician): the 104-key vascular table, the
> 202-key topography table and the substrate assignments.** The review gate is closed — do not re-flag
> this content as unreviewed. Content added from here is held to the same bar and flagged if uncertain.
> New suites: `test/vascular.test.js`,
> `test/topography.test.js`, `test/space.test.js`. Spec/plan:
> `docs/superpowers/specs/2026-08-15-multifocal-pattern-axis-design.md`,
> `docs/superpowers/plans/2026-08-15-multifocal-pattern-axis.md`.

## App UI clarity pass (2026-08-16) — ⚠ WORKSTREAM 1 HELD AT A REVIEW GATE

**Branch `feat/app-ui-clarity`, not yet merged.** The owner reported the UI had become messy after seven
content increments landed into the same three surfaces without anyone re-ranking what the reader sees.
Measured before: a two-finding case rendered a **3051px** results column, five cards all expanded with no
navigation, **16** distinct font sizes (10 between 8px and 13px), five global controls above the fold of
which **three** were inert until a finding existed, and **three** separate affordances answering "which
site am I reasoning about".

**Trainee-primary, ED-usable** (owner's ruling): the reasoning chain stays in ONE scroll in a fixed order —
a tabbed UI would let a trainee skip Why, which is the teaching payload. ED speed comes from a sticky
section nav plus an urgency pill in the header, not from reordering. **Putting Next Steps first was
considered and rejected** on those grounds.

**`app/labels.js` is a new display-naming layer** — pure, DOM-free, unit-tested by `test/app-naming.test.js`
(39 assertions). `plainSiteName()` returns the eponym when the phonebook has one and a plain anatomical
phrase otherwise (`nameForSite()` falls back to `` `${side} ${level} (${part})` `` for 52 of 377 sites —
18% of COMMON sites, including the whole cortical motor strip). **`PART_LABEL` is keyed `${level}|${part}`,
never by part alone** — `lateral` spans five levels, `hemi` four; the same trap `vascular.js` and
`topography.js` document.

> ⚠ **The naming is BUILT BUT NOT WIRED to the UI (plan Task 4).** `PART_LABEL` is 114 hand-authored
> anatomical labels and a wrong one mislabels a lesion on the result headline, so it is held until the owner
> signs it off. Three review passes are already applied — see below. **Do not wire Task 4 without the
> sign-off.**

**Three lessons from those review passes, each generalised into an invariant rather than patched:**
- **A LEVEL is not its contents.** The `cortex` level also holds a white-matter tract (the arcuate
  fasciculus), two watershed border zones, two aphasia composites and five vascular territories, so
  appending the level word produced "arcuate cortex" and "ACA cortex". `cortex` now cannot take an appended
  level word at all and **all 33 cortex keys are authored explicitly**, asserted by a test.
- **A PORTION is not the WHOLE.** Every hypothalamic and thalamic key is a nucleus or named area within its
  structure, so none may read "<x> hypothalamus" / "<x> thalamus". Asserted for both levels.
- **A mechanical invariant is a FLOOR, not a ceiling.** The clean-label test (no underscores, no stray
  abbreviations) passed on an *empty* override table — it cannot see whether a label is anatomically true.
  That judgement is the owner's, which is why the gate exists; targeted assertions now pin each ruling.

**Controls live in the card they act on** (onset → What, course → Together, level inputs → findings pane
behind a cord finding, dominant hemisphere → header), so a control can be unmounted while its state is set.
`S` stays the single source of truth and `test/app-smoke.test.js` pins the case-URL round trip.

**Two bugs found by driving the app, not by tests:** (1) `weak_arm`/`weak_leg` in the level-input trigger
set put those inputs on screen for nearly every case — the exact noise the pass removes; (2) **the URL hash
IS the shareable case**, so letting the browser follow the nav's `href="#sec-next"` natively overwrote the
whole case — anyone using the nav before copying the link would have shared a case with no findings. Jump
links now `preventDefault` and scroll manually.

**Workstream 6 (What-card density) was overstated in the spec and the code says so:** after the 2026-08-11
depth sweep the mean site carries 6.4 causes across the sieve categories, so only 73 of 377 sites (19%)
collapse anything and the mean first read falls 6.4 → 6.1. Kept (it earns its place at 8 → 5 on the dense
sites) but the real density was the all-sites view and the demoted bands.

Spec/plan: `docs/superpowers/specs/2026-08-16-app-ui-clarity-design.md`,
`docs/superpowers/plans/2026-08-16-app-ui-clarity.md`.

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
  compartments.js  level -> COMPARTMENT axis (brain/brainstem/cerebellum/cord/cauda/optic/skull_base/
                 root/plexus/nerve/motor_unit); compartmentOf(site). Finer than regionOf() in causes.js —
                 keeps brain and cord apart, which the multifocal roster needs. INTRACRANIAL_LEVELS in
                 inverse.js DERIVES from this table (single source of truth for "inside the skull")
  course.js      COURSES vocabulary (single/simultaneous/stepwise/relapsing/progressive) — HOW an illness
                 unfolded, orthogonal to onset tempo. Annotates/demotes only, like the sensory level
src/engine/    generic solver code (rarely changes when adding a region)
  forward.js     site -> expected signed findings; emits `${finding}@${side}` tokens
  score.js       scoreSite(): reward matches (LOCALISING findings weigh 3x), penalise unexplained
                 + over-prediction. Exports LOCALISING and NOT_LOCALISING_BY_DESIGN (finding id -> reason
                 it's deliberately excused; test/localising-audit.test.js asserts every single-level
                 finding is one or the other)
  inverse.js     THE single localiser. candidateSites() (reflection over compose*, drops buildingBlock);
                 differential() = the broad count/superset narrowing list (known-negative exclusion +
                 prevalence tiebreak); solve() returns {differential,explainAll,display,defaultSite,ruledOut}
                 AND the scored single/best/nearFit/multi/level/length; knownNegatives(); ruledOutSites()
  tracts.js      tractsFor() (which tracts a finding-set implicates + candidate sites along each);
                 tractNarrative() (composed Course prose); whyNotOthers() (derived per-level discrimination)
  patterns.js    cross-cutting SYNTHESIS (NOT localisation): umnLmnPattern() and functionalFlag()
  multifocal.js  LOGIC ONLY (content lives in data/multifocal.js). unifyingDiagnoses(sites,observed,
                 {onset,course}) matches the MULTIFOCAL roster against a site set (hard constraints filter,
                 tempo/course only demote); forcingFindings(observed,opts) is the parsimony guard — for
                 each LOCALISING finding, does removing it collapse the picture to one site?
src/data/
  syndromes.js   thin descriptive phonebook keyed by emergent site id -> eponym + ddx + red flags
  causes.js      THE PATHOLOGY LAYER. tempo-aware surgical-sieve DDx: causesFor(site,{onset}) ->
                 {byCategory, demoted, all, source}. Precedence: curated CAUSES[site] → phonebook ddx
                 (categorised live) → attribute-derived fallback. Each cause via `c(name,cat,tempo,
                 likelihood,red,feature,pathognomonic)`: `feature` = a "what points to it" clue; `pathognomonic`
                 = a bedside "🔎 Confirm on exam" sign. A central `PATHOGNOMONIC` keyword→sign table enriches
                 causes from ALL sources by name (Ramsay Hunt vesicles, Argyll Robertson, KF rings, …).
                 A cause whose tempo misses the entered onset moves to `demoted`, it is never dropped.
                 combinedCauses(sites,{onset}) + canonicalKey(name) merge causes across sites for the
                 Together/What-all-sites views — canonicalised through the MULTIFOCAL roster's own `matches`
                 regex (a name matching 2+ regexes is left uncanonicalised rather than guessed).
  nextSteps.js   THE WORKUP LAYER (educational). nextStepsFor(site) -> {immediate, investigations,
                 confirmatory, monitoring, urgency, referral, curated}. Curated NEXT[site] carries specifics;
                 tiers derive from urgency + region (bulbar/cord/arousal/nmu/optic/vestibular) otherwise.
                 combinedNextSteps(sites) unions per-site plans for the cross-site view; urgency = the
                 MOST urgent site, never an average.
  multifocal.js  CONTENT ONLY (matching logic lives in engine/multifocal.js), reviewable on its own: the
                 13-entity MULTIFOCAL roster (ALS/MS/mets/vasculitis/sarcoid/mononeuritis multiplex/
                 leptomeningeal disease/NMOSD/CNS lymphoma/NF2/paraneoplastic/neurosyphilis-HIV/embolic
                 shower) + FINDING_CLASSES (named finding classes an entity can `forbid`). Predicates are
                 over anatomical ATTRIBUTES (compartment/level/region), never site ids.
app/             zero-build teaching web app (pure consumer of the engine; no model changes)
  index.html     markup + all CSS
  app.js         renders the nested exam tree + the where/why/what output cards; pure consumer of solve()/
                 tractsFor()/causesFor()/nextStepsFor()/unifyingDiagnoses()/forcingFindings()
  exam-map.js    EXAM_TREE (nested category→subcategory→finding) + flattenFindings() (no presets)
  neuraxis-diagram.js  neuraxisSVG(): derived, clickable neuraxis SVG from the tract taxonomy + candidates
  combined-sites.js  combinedSites(r,list,pinned) -> {sites,source}: the user's pinned pair if still valid,
                 else the engine's minimal cover. Pure/DOM-free; every app.js call site must pass `pinned`
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

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
**69 test suites / 5212 assertions green** — always run `npm test` first to confirm before building on it. Milestones, newest last, with the design/plan
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
rather than hand-listed. **THE TRIGGER RESPECTS THE CHIASM (fixed 2026-08-18)** — these are ANTERIOR-pathway
tests, measuring the disc and the retinal ganglion cell axons, so exactly three routes fire it:
(a) an ANTERIOR visual finding in the site's `expectedFindings`; (b) the site sitting AT or ANTERIOR to the
lateral geniculate (`visual_pathway|optic_tract`, `|lgn` — band atrophy is real and gradeable there);
(c) a papilloedema/raised-ICP cause. Normal-pressure hydrocephalus is excluded by name — the pressure is
normal, so there is no disc swelling.

**The original list ignored the chiasm and that was a live bug:** `homonymous_hemianopia` and the
quadrantanopias were trigger tokens, so **22 sites fired on a retro-chiasmal token alone, 16 of them
POST-geniculate** — where the discs are normal and OCT adds nothing (retrograde trans-synaptic degeneration
is a research finding, not a work-up step). Reported symptom: **entering LEG WEAKNESS surfaced fundal
photography**, because MCA and anterior choroidal are candidates for `weak_leg` and both merely PREDICT a
field defect the patient was never reported to have. Fixed: 4 firing sites → 2, and the 2 that remain are
the parasagittal pair firing correctly on sinus thrombosis. **`homonymous_hemianopia` cannot be a trigger
token** — the optic tract and the occipital cortex both produce it and only one of them wants OCT, so the
SITE has to decide, which is why rule (b) exists. The anterior choroidal artery is deliberately NOT
pre-geniculate despite supplying the tract: its lesion is a stroke and takes a stroke work-up.

`test/next-steps.test.js` now asserts the invariant in BOTH directions — every justified site fires, and no
site fires without one of the three routes. The reverse direction immediately caught a latent test bug:
`/OCT/i` unanchored matches the "oct" inside **noct**urnal, so carpal-tunnel and phrenic workups counted as
ophthalmic. It is `\bOCT\b` now.

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

## App UI clarity pass (DONE 2026-08-16) — ✅ NAMING CLINICALLY SIGNED OFF

**Branch `feat/app-ui-clarity`, not yet merged. 64 suites / 3658 assertions green.** The owner reported the UI had become messy after seven
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

> **✅ CLINICALLY SIGNED OFF (2026-08-16) by the owner (a clinician): all 202 site labels.** The gate is
> CLOSED — do not re-flag this content as unreviewed. It took three review passes, each of which is now an
> INVARIANT rather than a patch (below). Labels added from here are held to the same bar and flagged if
> uncertain.

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

## Brand + Beta pass (DONE 2026-08-16)

**Wearne's NeuroLocaliser, v0.9.0 Beta.** Branch `feat/brand-beta`. `app/brand.js` owns `VERSION`,
`PRODUCT_NAME`, `markSVG()` and `faviconDataURI()` — one geometry drawn twice (full mark + a thicker 16px
favicon), so there is no second copy of the logo to drift. `test/brand.test.js` asserts `VERSION` equals
`package.json`, so a bug report always names a real build. The app had **no favicon at all** before this.

**The mark is a pyramidal decussation** — two tracts cross, one node filled and one hollow. That asymmetry
is the engine's premise. A bare X was rejected: at small size it reads as close/delete, colliding with the
red ✗ already meaning "contradicted by a normal finding".

**THE COLOUR RULE — `--terra` means the product's identity, or THE answer. Nothing else.** It was on **32
declarations** (nav pills, subtitles, mono tokens, selected rows, hovers, headings), which left it meaning
nothing while sitting next to the red-flag colour it resembles. Now **7**, on an allowlist
`test/brand.test.js` enforces (`.wordmark .l`, `.lockup-mark`, `.out-head`, the two selected-node rules,
and — added 2026-08-18 with the per-pathology layer — `.cause.sel` and `.px-chip`, the selected pathology
and the chip naming it). It cannot creep back without someone justifying the addition: the guard caught a
terracotta `:focus-visible` ring on the day it was written and that rule was deleted rather than
allowlisted, since a focus ring is neither identity nor the answer.

**Three defects this found, all of which were live:**
1. In dark mode `--terra`, `--contra` and `--red` were **all `#e79075`** — the brand accent,
   "contralateral" and "must-not-miss" were one colour with three meanings.
2. The filled danger chip took its text from `--paper` — near-white in light but **dark navy in dark**, so
   the dark chip would have been unreadable. Hence a dedicated **`--on-danger`** (white in both themes).
3. Dark `--red` gave only **4.40:1** against white, under the 4.5 a small bold chip needs. It landed at
   `#c94429` (4.84:1). A contrast invariant now computes the ratio in all four palette blocks and fails
   below 4.5:1.

**The must-not-miss is distinguished by FORM, not hue** — `RED` and an `EMERGENCY` urgency are filled chips
with a ⚑ glyph, so a tired reader never has to tell `#d36d52` from `#b32b1c` at 10px. URGENT and routine
stay outlined, or the fill stops meaning anything.

**Palette otherwise:** `--terra` is UNCHANGED (the owner preferred terracotta/navy over three alternative
palettes that were designed and reviewed). Paper warms to parchment and navy deepens — a printed clinical
text rather than a web app. Five dead rule sets deleted (`.presets`, `.bar`, `.narrow`, `.disc`, `.alt` —
11 rules, zero uses).

**The safety bar wording did NOT change** — "Beta" describes the build, not the risk. Nor did the gate
acknowledgment copy. The gate and every feedback email now carry `v0.9.0`.

Spec/plan: `docs/superpowers/specs/2026-08-16-brand-and-beta-design.md`,
`docs/superpowers/plans/2026-08-16-brand-and-beta.md`.

## Worked examples (DONE 2026-08-16)

Four one-click cases in the Localise empty state, in `app/examples.js` (pure data). They **replace stale
copy** that had promised examples ever since presets were removed in the 2026-07-25 UI restructure.

Chosen so **each demonstrates a different output card**, not to be the four commonest presentations:
Wallenberg → *Where*; **Foot drop → the narrowing**; Cauda equina → *Next steps*; Two lesions → *Together*.

**Foot drop is the important one:** it loads ONLY the findings L5 and peroneal share, so three candidates
appear and none wins — adding weak hip abduction pins the root, adding deep peroneal sensory pins the
nerve. Verified in the browser: **3 candidates → 1 on one click.** The interaction model shown rather than
described.

**`test/examples.test.js` asserts BEHAVIOUR, not just that tokens parse** — candidate counts, urgency,
cover size, and that adding a discriminator actually narrows. Hand-typed tokens were wrong first time
(Wallenberg resolved to Marie-Foix explaining 2 of 5), and the anatomy tables are actively edited, so a
worked example could silently start teaching the wrong thing. Tokens are derived from each site's
`expectedFindings`, then trimmed to a realistic bedside subset — Wallenberg ships as 6 of its 13 findings,
because nobody records 13 at the bedside.

**Trap worth knowing:** `test/brand.test.js` scans the stylesheet as TEXT, comments included, so writing
`var(--terra)` in a CSS *comment* fails the allowlist. Name the colour in prose instead.

Spec/plan: `docs/superpowers/specs/2026-08-16-worked-examples-design.md`,
`docs/superpowers/plans/2026-08-16-worked-examples.md`.

## Per-pathology next steps (DONE 2026-08-18) — ✅ CLINICALLY SIGNED OFF

**What it fixes.** The Next steps card was keyed by SITE, so it unioned every pathology that could produce
a lesion there — useful while the cause is unknown, wrong once it is known, which is usually straight after
the immediate steps. Found from a real defect the owner spotted: **entering leg weakness surfaced fundal
photography**, because `ophthalmicImaging()` fires on the SITE (its predicted findings, its causes'
raised-pressure mentions) rather than on anything the user entered.

**Selecting a cause in the What card now narrows the lower half of the Next card to that disease.**

**The tier split is the clinical idea:** the tiers divide by WHEN YOU KNOW THE CAUSE. Immediate/bedside and
first-line investigations stay **site-level** — they are performed before the cause is known and are what
IDENTIFY it. Confirmatory, monitoring, urgency and referral become **pathology-level**. With nothing
selected the card is byte-identical to before (asserted at all 377 sites).

**`src/data/pathologyNextSteps.js`** is content-only (imports nothing from the UI, nothing from
`nextSteps.js`) so a clinician reviews one file. Keyed by pathology NAME with per-site interpolation via a
`dz()` spine — the fifth use of the `sbSpine`/`nvSpine`/`rtSpine`/`rootNS` idiom, applied to diseases
instead of corridors.

**DELIBERATELY NOT keyed by `canonicalKey()`.** That collapses 93 names onto 10 very coarse entities — the
`Metastases` entity alone swallows 40 names, from "Orbital tumour or metastasis" to "Metastasis to the
pituitary stalk" to "Vertebral metastasis or myeloma", which share almost no workup. Keying by it would
recreate the exact blandness this layer removes. `PATHOLOGY_ALIAS` handles true synonyms narrowly, and
holds **one** entry: `Demyelination (MS)` → `Demyelination`, two spellings of one disease at DISJOINT site
sets (31 keys vs 6), which is how the duplicate survived the causes sweep unnoticed.

**URGENCY GAINED A RED-DERIVED FLOOR, and it was overdue: 377 sites carry a red must-not-miss and 76 of
them badged "routine".** The sharpest was BPPV — `peripheral_vestibular_posterior_canal` read *routine*
while its own cause list named *Posterior circulation stroke* as the must-not-miss. Resolution order is
curated pathology urgency → site urgency → the `red` floor beneath both. **An authored plan MAY sit below
the site's badge** (owner ruling): specificity is the point, and a tool that only escalates cries wolf. But
descent is only ever authored — the floor is mechanical and nothing red can render as routine.

**The honest fallback:** every cause stays selectable; where no plan is authored the lower tiers fall back
to the site plan under an explicit label ("General plan for this site — not specific to X"). It never
derives generic pathology content — the same ruling that deleted `sieveGenerics` engine-wide on 2026-08-11.

**Content: the first tranche is COMPLETE — 24 plans + 1 alias, 267 of 1286 rows (21%)**, authored in three
reviewed rounds. Authoring order is by REUSE (one plan for *Demyelination* lights up 31 sites), except
that **Posterior circulation stroke was promoted on clinical grounds** despite only 2 host sites, and *Head
trauma* dropped in exchange (a mechanism, not a disease; its workup is the CT already in every site plan).

**Two invariants earn their keep, both of which caught live bugs:**
- **No two sites may emit an identical plan for a shared pathology** — forces `bySite` to exist, or the
  layer says no more than the site card it replaced.
- **Every `bySite` key must be REACHABLE** — naming a real site is not enough, the pathology must be a
  cause AT that site, or the entry can never be reached (you can only select what the What card lists).
  Caught `Radiation plexopathy` → `plexus_upper_trunk` on the day it was written.

**The `--terra` guard did its job too:** it rejected three new declarations. Two were justified and
allowlisted (`.cause.sel`, `.px-chip` — the selected pathology IS the answer, exactly as the selected
neuraxis node is); the third, a terracotta `:focus-visible` ring, was DELETED rather than allowlisted —
a focus ring is neither identity nor the answer, and the app uses the browser default everywhere else.

**Site-level tiers are tagged `— site`, NOT dimmed** — opacity reads as *disabled* rather than
*unaffected*, and those tiers are live and correct. Selection round-trips through the case URL as `px=`,
and is deliberately unavailable in the combined/all-sites view: "whose pathology?" has no honest answer
across a multifocal set.

> **✅ CLINICALLY SIGNED OFF (2026-08-18) by the owner (a clinician), all three rounds** — the review
> status is recorded in the `pathologyNextSteps.js` header. Content added from here is held to the same bar.

**STILL OPEN, deliberately out of scope:**
1. ~~**The remaining 831 pathologies**~~ — **PARTLY CLOSED by tranche 2**, which authored all 353 red
   (must-not-miss) causes and retired the ratchet into a hard gate. What remains is the **494 non-red**
   names, deliberately parked: 709 of the leftover names appear at exactly ONE site, so finishing the
   coverage is ~35x the authoring of tranche 1, and the labelled site fallback they keep is honest and
   already correct. Much of it would be REDISTRIBUTION rather than new writing: curated site
   `investigations` prose is often already pathology-specific and merely lives in the wrong bucket.
2. ~~**The fundal-photography defect is only HALF fixed.**~~ — **CLOSED 2026-08-18.** The chiasm half was
   fixed on `fix/ophthalmic-imaging-chiasm` (merged): `VISUAL_FINDING` no longer contains
   `homonymous_hemianopia` or the quadrantanopias, and the three-route trigger in `nextSteps.js` now
   respects the chiasm — 22 firing sites → 4 → 2, and the 2 that remain are the parasagittal pair firing
   correctly on sinus thrombosis. See the ophthalmic-imaging section above for the full account and the
   both-directions invariant in `test/next-steps.test.js`. **What remains is benign but real:**
   ~~`hasFieldDefect()` keys on PREDICTED rather than OBSERVED findings~~ — **CLOSED 2026-08-21, by
   measurement rather than by code.** All 11 sites firing via the predicted-token route are ANTERIOR visual
   pathway sites (optic nerve AION/neuritis/canal, orbital apex, retina, chiasm), where the lesion CONTAINS
   the retinal ganglion cell axons — so the disc and RNFL are the right things to measure because of WHERE
   THE LESION IS, not because a symptom was recorded. Ordering the test is how you confirm or refute that
   candidate localisation. Threading observed findings through `nextStepsFor()` was rejected: a widely-called
   signature change and a broken byte-identical guarantee for no clinical gain. A new invariant in
   `test/next-steps.test.js` fails the moment a POSTERIOR site starts predicting an anterior visual token,
   which is the only way the hole could reopen.
3. ~~**`combinedNextSteps` / the Together card**~~ — **CLOSED 2026-08-21.** See the cross-site workup
   section below.

Spec/plan: `docs/superpowers/specs/2026-08-18-per-pathology-next-steps-design.md`,
`docs/superpowers/plans/2026-08-18-per-pathology-next-steps.md`.

## Pathology tranche 2 — DONE (2026-08-18) — ✅ CLINICALLY SIGNED OFF

**Branch `feat/pathology-tranche-2`, not merged.** Tranche 1 shipped 24 plans keyed by pathology; this is
the content programme that fills them in, plus two mechanism changes it needed.

**THE DECISION THAT SHAPES IT: author by DANGER, not by coverage.** Reuse is exhausted — of the 831
remaining names, **709 appear at exactly ONE site**, so "finish the coverage" is ~35x the authoring of
tranche 1 for 4x the rows. Tranche 2 instead targets the **337 causes flagged `red`** and stops there. The
other 494 keep the labelled site fallback, which is honest and already correct.

**Two mechanism changes:**
- **Content split into `src/data/pathology/`, one file per sieve category** (+ `builders.js`). At ~37
  lines per plan a single file would reach ~13,000 lines. A review round now opens exactly one file. The
  move was proven lossless against a captured baseline: 9048 renders, 0 differing, and every test passed
  **untouched**, which is the real proof.
- **`family(label, spine, members)`** — `dz()` handles ONE name across many sites; `family()` handles
  SEVERAL NAMES sharing a workup, which is what the red set is full of. A member diverges at one of three
  levels: `slots` (same workup, different anatomy), `*Extra` (same plus something), or a full override.
  The third exists because meningioma and metastasis share a head noun and diverge on the investigations.

**THE RED RATCHET.** `RED_WITHOUT_PLAN_CEILING` in `test/pathology-next-steps.test.js` starts at 337, falls
with every round, and may NEVER rise. It is a ceiling rather than an end-state assertion because a plain
"all red causes have a plan" would fail for every authoring round; at 0 it retires into a hard gate. Its
durable value is that it stops a future red cause being added with no workup behind it.

**AMENDMENT — A FAMILY IS AUTHORED WHOLE.** The "337 and stop" target did not survive contact: Chiari
without the syringomyelia it causes is a mechanism with its consequence removed. Where a family's coherence
needs non-red members they are in scope — the unit of authoring is the MECHANISM, not the row. The suite
REPORTS the split every run (`plans N = X red + Y non-red for family coherence`) so this cannot become an
excuse; if the non-red share ever looks like a second unplanned tranche, that is the signal to re-scope.

**A FAMILY IS A CLINICAL CLAIM, NOT A STRING MATCH** — the rule that did the most work. Round 2's 31
"haemorrhage|haematoma" names split into FOUR families with four different first moves (intraparenchymal,
compressive extra-axial, retroperitoneal, aneurysm/SAH) plus a singleton. `tumour` was rejected as a family
outright. The neoplastic set was estimated at 24 names and turned out to be 74 across seven families.

**COMPLETE. Ratchet 337 → 0 across nine rounds: EVERY ONE OF THE 353 MUST-NOT-MISS CAUSES NOW HAS AN
AUTHORED WORKUP.** 369 plans, 42 families, 722/1294 rows (56%). Nine sieve categories closed —
vascular, neoplastic, infective, metabolic, inflammatory, traumatic, congenital, degenerative,
iatrogenic and mimic.

**THE RATCHET HAS RETIRED INTO A HARD GATE.** `test/pathology-next-steps.test.js` now asserts outright
that no red cause lacks a plan. Its durable value starts here: a future red cause added to `causes.js`
with no workup behind it fails the suite immediately, which is the hole tranche 1 left open.

**`causes.js` HAS CHANGED — ten edits, in a file whose review gate closed 2026-08-11**, each on the
owner's explicit instruction: the cerebellar infarct/haemorrhage split; the vein-of-Labbé venous pattern at
two temporal sites (the one classic CVST location absent from the model); the deep-venous name
normalisation; **the app's first arteriovenous malformation** at three sites; cranial dural AVF at two; the
AVM recategorised vascular; the 3cm evacuation threshold removed; and THREE MISCATEGORISATIONS fixed
(non-convulsive status epilepticus was `vascular` at one site while `mimic` at its three others, and both
visceral-mimic entries were `vascular`). The AVM addition closed a real contradiction — the haemorrhage
workup instructs the reader to look for one, and none existed.

> **✅ CLINICALLY SIGNED OFF (2026-08-18) by the owner (a clinician): ALL tranche-2 content, reviewed
> round by round as it was authored rather than in one batch at the end.** Each category file carries its
> own review-status header. The gate is CLOSED — do not re-flag this content as unreviewed.

**Two content rules the owner set, now load-bearing:**
- **THE LOCATION IS THE AETIOLOGY** — deep says hypertensive, lobar in an older patient says amyloid
  angiopathy, any location in a young or normotensive patient says image the vessels. Carried as a spine
  line plus an `{aetiology}` slot so all 20 intraparenchymal members apply it to their own location.
- **NO SPECIFIC FIGURES** — thresholds and intervals date. One deliberate exception survives and is
  documented at the line: the erect/supine spirometry fall, because it tells the reader how to INTERPRET a
  measurement rather than setting a threshold for an action.

**Traps that recurred and are worth knowing:**
- Writing a `dz()` singleton by hand is where the `{level}`/`{flavour}` placeholders get forgotten, leaving
  `bySite` nothing to interpolate so every site renders identically. Caught three times by the
  differentiation invariant — which itself had to be corrected to compare distinct PLACES (`level_part`)
  rather than sided sites, since left and right are the same place for a workup.
- `family()` originally PRE-FILLED the spine with each member's slots at build time, consuming the
  placeholders. Slots now apply at RENDER time: `DEFAULTS < plan slots < bySite`.

Spec/plan: `docs/superpowers/specs/2026-08-18-pathology-tranche-2-design.md`,
`docs/superpowers/plans/2026-08-18-pathology-tranche-2.md`.

## Pathology tranche 3 — COMPLETE (2026-08-21) — ⚠ AWAITING CLINICAL REVIEW

**Branch `feat/pathology-tranche-3`, NOT merged.** Tranche 2 authored by DANGER and stopped when the red
set closed, leaving 485 non-red names on the labelled site fallback. Tranche 3 finishes the coverage.

**EVERY CAUSE IN THE APP NOW HAS AN AUTHORED WORKUP — 857 names, 816 plans, 41 aliases, 71 families,
1294 of 1294 cause rows (100%, up from 56%).** Twelve sieve categories closed one at a time, on the
owner's ruling that the work proceed **by sieve category, all 485, bucket by bucket**.

**REUSE WAS EXHAUSTED BEFORE THIS TRANCHE STARTED, and that is what made it different in kind:** 88% of
the remaining names appeared at exactly ONE site. Tranche 1 bought 11 rows per plan, tranche 2 bought 2,
tranche 3 bought **1.18** — so the ratchet fell roughly one per plan authored, with no families to
accelerate it. It ran **485 → 226 → 179 → 131 → 74 → 0** and has now **RETIRED INTO A HARD GATE**: a
cause added to `causes.js` with no workup behind it fails the suite immediately, rather than quietly
falling back to the site plan where nobody would notice.

**THE HONEST FALLBACK STAYS IN THE CODE.** `pathologyCurated: false` and the "General plan for this site —
not specific to X" label are what make a future unplanned cause render truthfully instead of pretending.
Nothing in the shipped content reaches it any more — which is precisely why the test that exercises it now
uses a **SYNTHETIC** name. That test used to pick the first real cause at its host site with no plan, a
fixture that IS the gap tranche 3 was closing, and it broke the moment the last cause there was authored.
**Same trap CLAUDE.md already records from the 2026-08-10 layer: the content was right and the test was
wrong.** Never use an incidental content gap as a test fixture.

**"A FAMILY IS A CLINICAL CLAIM, NOT A STRING MATCH" did the most work again, and three splits are worth
knowing because each was a decision NOT to reuse a spine that superficially fitted:**
- **A lacune is not a small stroke, it is a DIFFERENT stroke** — the aetiology work-up is the small-vessel
  risk profile, not an embolic source hunt. `lacunar-infarct` is separate from `perforator-disease`, which
  is a claim about a STUTTERING course; most lacunes do not stutter.
- **Root compression and canal compression cannot share a spine.** A root is a pain problem with a good
  natural history; the cord or the cauda is a progressive disability where surgery PREVENTS rather than
  restores. Hence `degenerative-radiculopathy` (21) and `degenerative-canal-stenosis` (3).
- **A benign skull-base tumour is not skull-base malignancy.** `SKULL_BASE_SPINE` works up staging, tissue
  and the primary; a vestibular schwannoma is slow and often best LEFT ALONE, because the treatment can
  cost more function than the tumour has. `benign-skull-base-tumour` (22) says watching is an active plan.

**Also new:** `post-stroke-sequela` (the stroke already happened — confirm the responsible OLD lesion and
hand the symptom to someone who will treat it), `microvascular-cn-palsy` (deliberately NOT aliased onto
the diabetic-neuropathy plan, which works up DIABETES; this one answers "benign ischaemia or compression?"
and RECOVERY IS THE TEST), `cortical-dementia` (11), `parkinsonian-degeneration` (6), `progressive-ataxia`
(3 — acquired and treatable first, genetic LAST and with counselling), `bppv-canal` (3 — the nystagmus
names the canal and the canal names the manoeuvre), `peripheral-nerve-mass` (5 — these imitate the
ordinary entrapment at the same site, and ultrasound is the under-used first test), plus the round-12
iatrogenic four.

**URGENCY DESCENDS WHERE IT SHOULD.** The chronic spondylosis members badge ROUTINE while the acute
prolapses badge URGENT — the tranche-1 ruling working as intended (*an authored plan MAY sit below the
site's badge; a tool that only escalates cries wolf*). What keeps it safe is unchanged: immediate and
first-line stay the SITE's, and the red floor is mechanical. None of the 485 names in this tranche was red.

**Aliases went from 4 to 41**, and the recurring class is worth naming: the same disease written a second
way — an abbreviation expanded (`ACA infarct` / `Anterior cerebral artery infarct`), a word added
(`PCA territory infarct`), a name written back to front (`Post-DBS or post-surgical injury`), or **the same
word with and without its accents (`Meniere's` / `Ménière's`), which is how a duplicate survives every
review because the two look identical in prose**. Where a name adds a real clinical claim rather than a
spelling — a splenial extension, a Heidenhain variant — it got its own plan instead.

> **⚠ NOT YET REVIEWED. Rounds 12-15 (iatrogenic, vascular, degenerative, neoplastic) are unread by the
> owner.** Each category file carries its own `⚠ TRANCHE 3 … NOT YET REVIEWED` header naming what is new
> in it. **Merging to `main` auto-deploys to the live app**, so this branch must not be merged until the
> owner has read it — **one round at a time**, which is the rhythm that caught errors a batch review
> would have missed.

6425 assertions green.

## Together card — the cross-site workup (DONE 2026-08-21)

**What it fixes.** The Together card named the disease spanning the sites and the Next card below it still
showed the union of two site workups — so a multifocal MS picture never surfaced the lumbar puncture that
settles it. Tranche 1 had switched per-pathology selection off in the combined view because *"whose
pathology?" has no honest answer across a multifocal set*; the multi-location DDx layer since made that
answerable, and this closes the gap.

**`src/data/multifocalNextSteps.js` is content-only** — imports nothing from the UI, nothing from
`nextSteps.js` — keyed by entity name, **13 of 13 entities authored** across three rounds.
**SITE-INDEPENDENT BY CONSTRUCTION: no `slots`, no `bySite`.** That is why these plans are NOT in
`src/data/pathology/`, whose plans key on a per-site cause name and interpolate per-site anatomy — and why
`PATHOLOGY_NEXT` keeps ONE kind of key, which the RED GATE test walks.

**THE TIER SPLIT DIFFERS FROM TRANCHE 1's, deliberately.** Immediate stays the site union. **First-line is
ADDITIVE, not frozen** — `investigations` is untouched and the entity's own tests ride alongside in
`entityFirstLine`, rendered as a second labelled group. Freezing it (strict tranche-1 parity) would mean the
MS plan could never order the LP and the vasculitis plan never ESR/CRP, because those live in first-line;
replacing it would lose the site union's safety floor. Confirmatory, monitoring and referral become the
entity's.

**URGENCY FOLLOWS THE SELECTION — the site union is NOT a floor.** The layer was built with a floor and the
owner reversed it on seeing round 1 running: *MS is not imminently life-threatening, and if the user has
selected MS the ruling should be based on the selection.* That restores consistency rather than breaking it
— tranche 1 already ruled the same way per-site (*"an authored plan MAY sit below the site's badge:
specificity is the point, and a tool that only escalates cries wolf"*), and the floor had the two layers
contradicting each other. **WHAT KEEPS IT SAFE IS THE TIER SPLIT, NOT THE BADGE:** immediate and site
first-line remain the union, so a quieter badge never removes a bedside step — asserted directly, not
assumed. The only mechanical floor left is the entity's own `red` flag: a must-not-miss cannot read routine.
MS on an emergency-badged pair now reads *urgent*; NMOSD reads *emergency* on its own merit.

**A PLAN MAY EXPLAIN ITS OWN BADGE (`because`, owner ruling 2026-08-21).** Optional, rendered directly
under the urgency band as "Why this urgency:". It exists because urgency now follows the selection, so a
card that asserts a badge should be able to justify it — and for three diseases the badge is earned by what
they CAN CAUSE, not by themselves: metastases (cord compression, raised pressure), leptomeningeal disease
(hydrocephalus), primary CNS lymphoma (a timing reason — every day before biopsy is a day someone may give
steroids and dissolve the diagnosis). **It is deliberately NOT part of `referral`:** "who to refer to" is
not "why this badge", and merging them is the LEVEL-is-not-its-contents error in another costume. Omitted
where the disease IS the emergency — an embolic shower is time-critical on its own account.

**NO CROSS-SITE FALLBACK STATE EXISTS.** There is no equivalent of `pathologyCurated: false` and no
"General plan — not specific to X" label, because the hard gate guarantees every entity has a plan. Do not
add one as a convenience: it is the seam through which "some rows behave differently from others" returns.

**The Together card is the ONLY entry point** (chosen from mockups against two alternatives). The What
card's shared-cause and remainder rows stay inert in the all-sites view. Putting the click on a shared-cause
row was rejected because clicking *"Demyelination (MS)"* would light up *"Multiple sclerosis"* one card
above — the row you click is not the label you get — and because whether a shared row clicked at all would
depend on something invisible (does its name canonicalise?).

**`S.selectedEntity` IS A SEPARATE FIELD FROM `S.selectedPathology`, and this is forced, not stylistic:
four entity names are ALSO verbatim per-site cause names** — *Motor neurone disease (ALS)*, *Multiple
sclerosis*, *Neurosarcoidosis*, *Neurofibromatosis type 2*. One string field cannot say whether
`"Neurosarcoidosis"` means the disease at this site or the disease across these sites.

**ONE VALIDITY GATE, not four scattered clears.** `pruneSelectedEntity()` drops the selection the moment the
Together card stops offering the entity — subsuming fewer-than-two-sites, a findings edit that stops it
firing, and a re-pin onto a pair it does not fit. A findings edit that leaves the entity STILL FIRING keeps
the selection deliberately. **`syncURL()` had to move BELOW the `togetherCard()` call**, because the hash is
the shareable case and the gate lives inside that call.

**Case URL `ux=`**, validated against the roster exactly as `px=` is validated against `CAUSES`. **`ux`
implies scope `all`** — the parameter has no meaning in any other scope — and degrades safely when the
restored case has under two sites. **`sc=all` (2026-08-21) round-trips the scope on its own**, closing a
pre-existing gap: sharing an all-sites view with NO entity selected used to land the recipient in "This
site", so the link showed a different card than the sender was reading. Only the non-default value is
written. `sc` is read BEFORE `ux` so the two can only agree, and `ux` still implies the scope on its own
for links written before `sc` existed.

**THE HARD GATE.** `test/multifocal-next-steps.test.js` asserts every `MULTIFOCAL` entity has a plan. The
ratchet ran 13 → 8 → 3 → 0 across the three authoring rounds and retired into the gate, the same shape as
tranche 2's red ratchet. A future roster entity added with no workup behind it fails the suite immediately,
and that is what keeps every row in the card behaving alike.

**No new CSS.** The selected row reuses `.cause.sel` and the chip reuses `.px-chip`, both already on the
`--terra` allowlist — the selected cross-site diagnosis IS the answer the Next card is about.

**Testing trap worth knowing:** in a browser, navigating to a URL that differs only in the HASH does not
re-run boot, so the app keeps its old ES modules and its old state. Three apparent bugs during this work
were all that trap. Reload explicitly when verifying a case URL.

**13 CROSS-SITE ARCHETYPES** in `app/examples.js` (`CROSS_SITE_EXAMPLES`) — one canonical picture per
entity, behind a disclosure so the four worked examples stay the on-ramp. They exist because the first
review round was run against pictures found MECHANICALLY (smallest firing two-site case), which produced
bilateral labyrinths for neurosarcoidosis and bilateral phrenic nerves for mononeuritis multiplex —
mechanically valid, clinically absurd. **Sites chosen clinically, tokens DERIVED from them** and trimmed to
a bedside subset, never hand-typed (the 2026-08-16 worked-examples lesson). Loading one arrives with its
claim made: pinned pair, all-sites scope, entity selected.

**THE COURSE IS THE TEACHING PAYLOAD, and one pair proves it: metastases and embolic shower are the SAME
picture** — left face/arm weakness with a right homonymous hemianopia — separating only on how the illness
unfolded. On `progressive`, six diseases are concordant; on `simultaneous`, **one** is, and the other five
move to the set-aside band. Asserted, so the two cards cannot silently become duplicates.

**All 13 PIN their pair.** Twelve also resolve on the engine's free cover; embolic shower does not — its
`distribution: "segment"` needs distinct arterial segments and an unpinned cover picks the optic radiation,
the same territory as the motor cortex.

**`test/multifocal-archetypes.test.js` is a FIRE-RATE CANARY, not just an example guard.** The 2026-08-15
substrate work found NF2 firing at 0.0% (because `schwann` omitted `skull_base`) only by measuring fire
rates by hand. An archetype per entity turns that into a standing assertion: if a roster predicate,
substrate table or compartment allow-list drifts so an entity can no longer fire on its own defining
picture, the suite fails immediately. It asserts CONCORDANT, never rank-first — forcing an archetype to win
would mean choosing the picture to satisfy the test rather than the clinic.

> **✅ CLINICALLY SIGNED OFF (2026-08-21) by the owner (a clinician): all 13 cross-site plans**, across
> three rounds (inflammatory/demyelinating; neoplastic/degenerative/congenital; infective/vascular/
> paraneoplastic), reviewed round by round rather than batched. Round 1's read produced the urgency ruling
> above; rounds 2 and 3 were read against the archetype cases. The gate is CLOSED — do not re-flag this
> content as unreviewed.

69 suites / 5212 assertions green. Spec/plan:
`docs/superpowers/specs/2026-08-21-together-card-cross-site-workup-design.md`,
`docs/superpowers/plans/2026-08-21-together-card-cross-site-workup.md`.

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
region's mechanism. The repo IS under git (public, `origin/main` auto-deploys to Pages on push), so
history lives in the commits as well as in those docs.

Two published Claude Artifacts (a flow diagram and the anatomy review sheet) visualise the engine;
their HTML source and the update workflow (edit here, republish to the same URL) are in
`docs/artifacts/`. Keep them in sync after each region increment.

Not a medical device; not for clinical use. The anatomy tables still need neuroanatomist review.

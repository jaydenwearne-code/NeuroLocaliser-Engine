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
**90 test suites / 7669 assertions: 7667 pass, 2 fail** (integration branch `integrate/all-open-fixes`: two `pressure-follows` pins, the row-21 snapshot and the row-1 ratchet, move because the composite sites bring three new places into play; they await the owner's ruling, see "Integration of the open fixes") — always run `npm test` first to confirm before building on it. Milestones, newest last, with the design/plan
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
- **Why-synthesis (done; the neuraxis DIAGRAM was later removed — see the 2026-08-25 entry)** — a long-tract taxonomy (`src/model/tracts.js`: corticospinal,
  spinothalamic, dorsal-column, corticobulbar; findings + course + decussation + per-waypoint detail/supply +
  direction), `src/engine/tracts.js` derivations (`tractsFor`, `tractNarrative`, `whyNotOthers`), and a
  derived clickable SVG (removed 2026-08-25). Plans: `plans/2026-07-24-why-synthesis-neuraxis-diagram.md`,
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

## Pathologies + workup expansion (DONE 2026-08-10) — ✅ CLINICALLY SIGNED OFF (2026-08-11)

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

## Differential-depth sweep + fundoscopy findings (DONE 2026-08-11) — ✅ CLINICALLY SIGNED OFF

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

**Foot drop is the important one:** it loads ONLY the findings L5 and peroneal share, so several candidates
appear and none wins — adding weak hip abduction puts the root first, adding deep peroneal sensory pins the
nerve. Verified in the browser: **3 candidates → 1 on one click.** The interaction model shown rather than
described. (Since the plexus round, 2026-11-06, there are FOUR candidates: the whole lumbosacral plexus joined; first
web-space numbness still narrows to the nerve alone.)

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
1. ~~**The remaining 831 pathologies**~~ — **FULLY CLOSED.** Tranche 2 authored all 353 red
   (must-not-miss) causes; **tranche 3 (2026-08-21) authored the remaining 485 non-red names, so all
   1294 cause rows now carry an authored workup** and the coverage ratchet has retired into a hard gate.
   See the tranche-3 section below. Nothing in the shipped content reaches the site fallback any more.
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

## Pathology tranche 3 — COMPLETE (2026-08-21) — ✅ CLINICALLY SIGNED OFF

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

> **✅ CLINICALLY SIGNED OFF (2026-08-21) by the owner (a clinician): ALL tranche-3 content**, across
> rounds 4-15 — the twelve sieve categories, 485 names, 592 plans. Each category file records its own
> tranche-3 sign-off. **The review gate on the pathology workup layer is now CLOSED at every tranche —
> do not re-flag this content as unreviewed.** Content added from here is held to the same bar and
> flagged if uncertain.

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

## Usage counter (DONE 2026-08-22) — LIVE

**The app had been live for testers since 2026-07-27 with no way to tell whether anyone had opened it** —
Pages is a static host with no accessible logs, and the repository traffic API covers the repo page rather
than the Pages site (it reads `0`). As of 2026-08-21 there were also **zero feedback emails** in four
weeks, a number that is uninterpretable without a denominator.

**THE CONSTRAINT IS `case-url.js`:** the case lives in the URL **hash** so it "never reaches a server log",
and the hash holds the findings entered. **A conventional analytics script would undo that in one line**,
because the usual ones record `location.href` — shipping clinical findings to a third party. So the beacon
posts to a Google Apps Script the owner controls, `app/usage.js` never touches `location` or the DOM, and
`PAYLOAD_KEYS` is an explicit allowlist. **`test/usage.test.js` §3 builds a realistic case with
`encodeCase()` and asserts none of it can reach the wire — that test IS the point of the module**, and it
is what fails when someone adds `url: location.href` later.

**COUNTED AT `reveal()`, NOT AT THE PASSPHRASE.** The gate writes `nl_gate_v1=ok` and skips the passphrase
on every later visit, so instrumenting the submit would count FIRST UNLOCKS rather than opens. `reveal({
first })` fires on both paths, so one row per open with new-vs-returning separated. Two opaque local random
ids — `install` (localStorage) separates twelve opens by one tester from twelve testers; `session`
(sessionStorage) separates visits. Neither is a fingerprint.

**IT CAN NEVER BREAK THE GATE.** `recordOpen()` never throws, never awaits the network, swallows a rejected
fetch, and survives storage that throws, a missing `fetch` and an unset endpoint — asserted in §5. A
counter that could stop a clinician getting into the tool would be a bad trade for a number.

**A LOCAL RUN IS NOT A TESTER (fixed 2026-10-12).** Until then, unlocking the app on `node app/serve.mjs`
posted a real row, indistinguishable from a tester's open, so every local browser check inflated the
denominator. `reveal()` now passes `location.hostname` and `recordOpen` sends nothing (and writes no id) when
`isLocalHost()` says loopback, `*.localhost` or a private LAN address (`serve.mjs` listens on every interface,
so a phone on the same Wi-Fi counts as local too). The module still never reads `location` itself, and the host
never enters the payload. Rows from before the fix may include the owner's own local opens.

**SHIPPED INERT AND SWITCHED ON THE SAME DAY**, once the owner deployed the Apps Script sink. One row per
open lands in the owner's private Sheet. **The /exec URL is in a PUBLIC repo and that is accepted, not
overlooked:** the script only ever appends, returns no data, and the Sheet stays private — the worst a
stranger gets is junk rows, and the fix is a new deployment (which mints a new URL). Limits are in the spec
(no retrospective data; a shared passphrase cannot say WHO; client-side counting undercounts; `install` is
per BROWSER, so one tester on a phone and a desktop counts twice).

**VERIFYING AN APPS SCRIPT ENDPOINT FROM A TERMINAL IS MISLEADING — a `curl -L` POST reports HTTP 405 even
when everything is correct**, because curl re-POSTs to the redirect target and Apps Script rejects that; a
browser follows the same redirect as a GET. The 302 to `script.googleusercontent.com/macros/echo` IS the
success path. The diagnostic probe is a plain **GET**: `Script function not found: doGet` with HTTP 200
proves the deployment is reachable, public and executing. I called the endpoint broken on that 405 before
checking — it was my probe, not the deployment.

## Theme toggle (DONE 2026-08-22)

**MERGED to `main` and DEPLOYED 2026-08-22.** The CSS had been three-state theme-aware since the 2026-08-16
brand pass — `:root`, `@media (prefers-color-scheme:dark)`, and the two `:root[data-theme]` override blocks
— and **nothing had ever been able to set it**. `app/theme.js` is that missing half: key, cycle, resolve
rule, attribute write, button strings, all pure and testable in node.

**THREE STATES, NOT TWO.** Following the OS is the default, so a two-state toggle would make it
UNREACHABLE. `system` is first-class, is the initial state, and the cycle returns to it. **`system` DELETES
`data-theme`** rather than writing a third value — there is no palette block for it and there must not be
one (`test/brand.test.js` counts exactly four).

**APPLIED BY A BLOCKING `<script>` IN `<head>`, above `<style>`.** `app.js` is a deferred module importing
the whole engine graph, so applying the theme there repaints after first paint — a visible flash on a cold
Pages load for anyone who has overridden the OS. The cost is the storage key living in two files;
`test/theme.test.js` §8 asserts they agree, the same shape as `brand.test.js` scanning the stylesheet as
text.

**THE STORE IS RESOLVED INSIDE A GUARD, NOT AS A DEFAULT PARAMETER.** `store = globalThis.localStorage`
evaluates BEFORE the function body, so it sits outside the `try/catch` — and Safari throws a SecurityError
on the *property access* when cookies are blocked, which is the exact case the module promises to survive.
Caught in review, before it shipped; node would never have caught it, because `globalThis.localStorage` is
simply `undefined` there.

**THE SAME BUG HAD SHIPPED TWICE ELSEWHERE (fixed 2026-10-18).** `startGate()` read the unlock flag with a
bare `localStorage.getItem` before the gate was shown — `#gate` and `#app-shell` are both `display:none`
until a class is added, so with cookies blocked the page stayed BLANK. And `recordOpen()` took both stores
as default parameters, so it threw from `reveal()` even after a correct passphrase. Now `isUnlocked()` /
`rememberUnlock()` in `gate.js` and `recordOpen()` resolve the store inside the try. **Node CAN test it**:
define `globalThis.localStorage` with a getter that throws (`test/usage.test.js` §5, `test/gate.test.js`),
and `gate.test.js` asserts `app.js` never names `localStorage.`/`sessionStorage.` directly.

**`paintFavicon()` split out of `paintBrand()`** — the favicon is the only brand surface that must be
repainted on toggle, because a data URI cannot inherit `currentColor` so the accent is baked in. A
`matchMedia` listener does the same while following the OS. Known and accepted: the tab strip is browser
chrome and follows the OS, so a light-page-on-dark-OS user gets the darker terracotta on a dark tab bar.

**THE GLYPHS ARE TEXT, NOT EMOJI, AND THAT IS LOAD-BEARING.** The obvious set (🖥 ☀ 🌙) renders in FULL
COLOUR on macOS, ignoring the button's muted colour and putting accent colour back into the one control the
design deliberately made neutral, inches from the red danger chip. **A variation selector does not fix it**
— VS15 was measured and still rendered colour. The set is `◐ ☀ ☾`, three plain text glyphs that inherit
`currentColor`. Found by driving the app, not by a test.

**THE THEME IS NOT PART OF THE CASE.** It never enters `S`, `encodeCase` or `syncURL()`. A case URL is
shared between people and carries claims about the patient; the theme belongs to the reader's eyes. Do not
"fix" that asymmetry — `sc=all` exists precisely because a link that showed the recipient something
different from the sender was a real bug.

**The toggle is NOT terracotta**, and that is the guard working as designed: a viewing preference is
neither the product's identity nor the answer, so it takes the neutral header treatment — the same
judgement that saw a terracotta focus ring deleted rather than allowlisted.

**THE CONTRAST DEBT THIS EXPOSED IS NOW FIXED** — see the section below. Worth recording how it was
found and how the first measurement was WRONG: an initial live-DOM audit reported "84 dark / 98 light",
and both figures were artifacts (a `color(srgb …)` parser bug, and frozen CSS transitions in a throttled
automation pane). The corrected figures were 76 and 82. **Explicit-dark was byte-identical to the OS-dark
path that had existed since the brand pass**, so the toggle exposed the debt rather than causing it.

70 suites / 6527 assertions green. Spec/plan: `docs/superpowers/specs/2026-08-22-theme-toggle-design.md`,
`docs/superpowers/plans/2026-08-22-theme-toggle.md`.
## Contrast: the palette is AA in both themes (DONE 2026-08-22)

**MERGED to `main` and DEPLOYED 2026-08-22.** Found while measuring dark mode during the theme-toggle
work. **Pre-existing since the 2026-08-16 brand pass** — 76 failing text nodes in dark, 82 in
light. Now **0 and 0**, across all three modes with every disclosure expanded.

**THE SEVERE BUG WAS IN THREE PLACES AND IS A NAMED CLASS: a FOREGROUND token used as a BACKGROUND.**
`.sides button.on`, `.site-btn.on` and `.sc.on` all set `background:var(--navy)` (or `--navy-2`) with a
literal `color:#fff`. `--navy` INVERTS between themes (`#16283f` light -> `#dbe4f1` dark), so in dark those
chips were white on pale blue — **1.28:1**, invisible — including the control that sets **laterality**.
It is the exact inverse of the bug the brand pass fixed by inventing `--on-danger` (*"the filled danger chip
took its text from `--paper`"*), and it survived because nothing checked the PAIR. Now `--sel-bg` + `--ink`.

**THE INVARIANT IS THE PAIR, NOT THE TOKEN.** A first attempt asserted *"never use a foreground token as a
background"* and wrongly flagged `.gate-go`, which pairs `background:var(--navy)` with `color:var(--paper)`
— **both invert together**, so it reverses and stays at ~11:1. `test/contrast.test.js` instead extracts
every rule that sets BOTH a background and a colour and checks that pair in all four palette blocks.

**THE RAMP IS RE-SPACED, NOT JUST RAISED.** Lifting `--faint` alone to 4.5:1 lands it within **0.03** of
`--muted` in light — it satisfies contrast by DELETING a tier of the ink/muted/faint hierarchy the
2026-08-16 clarity pass built. So both neutrals move, and the suite asserts **separation** as well as
contrast, so no future fix can take that shortcut. Three tiers survive: light 14.68/7.25/5.35, dark
13.50/7.48/5.63.

**`--terra`, `--red`, `--ink`, `--navy` and the four-block structure are UNCHANGED** — `test/brand.test.js`
pins them. Two consequences worth knowing: `--red` **cannot** clear 4.5:1 as text, because it must stay
saturated for the filled chip that suite guards against white, so `.gate-err` moved to `--contra` and
`--red` is DECLARED not-text; and **terracotta is a 3:1 large-text colour** — correct on the 18-22px
wordmark and as a border, wrong at 13px.

**AN INLINE STYLE IN JS BYPASSED THE `--terra` ALLOWLIST.** `app.js` emitted
`<span style="color:…accent…">` for the site name; `brand.test.js` scans only the stylesheet, slicing
`<style>`->`</style>`, so it never saw it. It was also 3.40:1. The span now uses `--ink`, and a guard
fails on any `app/*.js` painting text with the accent inline.

**TWO DEAD TOKENS: `--mimic` and `--iatro`** are defined in all four palette blocks and referenced
**nowhere** in CSS or JS. This file's claim that the mimic category has *"its own `--mimic` CSS token"* is
stale — the token exists, nothing uses it. Declared not-text; wiring them up or deleting them is separate
work.

**THE HONEST LIMIT OF A TOKEN-LEVEL TEST: it cannot see a UA default.** `.report-btn` declared no
`background`; as an `<a>` in the results header that is fine, but as a `<button>` in code-stroke it kept
Chrome's `buttonface`, light even in dark mode — **1.84:1** on the Copy button. Found by the browser sweep,
not the suite. The background is now explicit and the reason is at the rule.

**WHY THE SUITE READS TOKENS AND NOT THE DOM.** A live-DOM audit was run first and was wrong three ways:
a `color(srgb 0.94 0.92 0.88 / .92)` backdrop parsed as 0-255 invented a near-black background;
`getComputedStyle` right after flipping `data-theme` returns MID-TRANSITION values, and in a throttled tab
the transition FREEZES so stale colours read as stable truth for over a second; and colour emoji report a
`color` that says nothing about what is painted. **A browser measures the renderer's transient state; the
design is in the tokens.** Both are still worth running — they catch different things, as the UA-default
bug above proves.

**`.cs-lvo.pos` (the code-stroke LVO badge) changed appearance** — it was white on `--contra`, 2.13:1 in
dark, and `--contra` inverts so it cannot carry a filled chip. Now `--red`/`--on-danger`, which keeps the
FORM rule (filled = time-critical). Presentation, not clinical content, but **flagged for the owner**.

70 suites / 6519 assertions green. Spec: `docs/superpowers/specs/2026-08-22-contrast-ramp-design.md`.

## Accuracy round 1 (DONE 2026-09-26) — ✅ CLINICALLY SIGNED OFF (rulings in the spec §3)

**Branch `feat/accuracy-round-1`, not merged.** The engine was interrogated against the bedside — every
site's own picture, 84 textbook/ED vignettes, every finding alone on every side, phonebook-vs-model,
crossing along every tract. **No site was unreachable and no new crossing error existed**, but the COMMON
pictures failed in three classes, all now pinned by `test/clinical-vignettes.test.js` (142 assertions — the
only suite that checks the model against the textbook rather than against itself; 112/30 on `main` before):

1. **False two-lesion claims** — a site missing one of its OWN cardinal features (its phonebook note named
   it) made the complete picture fail "explains all", so `minimalSet()` invented a second lesion: cord
   compression + retention, MCA + hemianopia, BPPV, labyrinthitis, aphasia + anomia, ACA + incontinence,
   Percheron + amnesia, neuropathy/cauda/SCD + absent ankle jerks.
2. **Dead sides** — eleven findings produced only by bilateral systemic sites returned ZERO candidates on
   one side (and suggested non-organic). Fixed two ways: motor-unit sites and the cauda are `asymmetric`
   (the known-negative filter skips them), and `app/sides.js` offers a single "Both" button for a finding
   only symmetric sites produce. `test/side-offers.test.js` asserts no offered option returns nothing.
3. **Wrong first answers** — Bell's palsy → cortex (new `forehead_involved`, the LMN mirror of
   `forehead_spared`); pure sensory stroke → midbrain (thalamus gains VPM face; lateral midbrain RARE);
   AICA → medulla (the lateral pons gains facial nucleus, cochlear, spinal V, Horner); GBS → Friedreich's
   (new `polyradiculoneuropathy_acute` site, symmetric, motor-predominant, curated causes/workup/plans).

**Mechanisms, each small:** a structure `emit: "midline" | "bilateral"` override (`forward.js`); the
`asymmetric` site flag; a LINEAR ranking key `over − 3 × prevalence` after coverage (`PREVALENCE_ALLOWANCE`,
`rankKey` — the pairwise "gap ≥ 3" rule was measured first and is NOT transitive); polyneuropathy COMMON
(the bilateral→RARE rule had shadowed it); BPPV posterior canal COMMON / anterior RARE;
`nextStepsFor(site, { onset })` badges a CNS site EMERGENCY at hyperacute onset when its leading cause is
vascular, and keeps it when a hyperacute-compatible vascular cause is selected. With no onset every call is
unchanged. Lacunar and hand-knob infarcts are now tagged hyperacute (they were demoted at hyperacute onset).

**Vocabulary stays STRICT** (owner): `weak_leg`/`weak_arm` mean PYRAMIDAL weakness to the engine; an LMN
picture is entered with LMN/myotome/reflex findings. The label should say so — parked for the UI round.

**Traps worth knowing:** the Wallenberg worked example needs a BULBAR sign (it now carries `dysphagia`) —
without one the lateral medulla and the AICA lateral pons genuinely tie, and the compare panel's job is to
name dysphagia vs facial palsy/deafness. A hand-listed composite (thalamic aphasia) must be updated when its
source site gains a row, or the stale copy out-ranks the real site. The whole change set was PROTOTYPED in a
scratch copy against the full suite before the plan was written — that is how the Wallenberg tie, the
anterior-canal tie-break and the thalamic-aphasia copy were found before they shipped.

**Follow-ups closed the same day:** myasthenia predicts `ptosis` (its commonest presenting sign); the
lateral pons carries all four central-Horner rows (anhidrosis added) and the lateral medulla is COMMON so a
bare central Horner still shows Wallenberg first (owner ruling) — two assertions moved from the scored `best`
(no prior) to the displayed first answer; `tl_midbrain` got its anatomy-sheet row, so every model id now
has a row and vice versa; and removing the LAST finding now clears the case from the URL (`renderResults()`
used to return before `syncURL()`). **Deliberately unchanged:** an isolated Babinski ranks the cortical hand
knob first — `ctx_hand_bab` is a signed-off design choice, and an extensor plantar genuinely does not
localise along the tract; the integrated Why (sub-project 2) is what should say so.

Spec/plan: `docs/superpowers/specs/2026-09-25-accuracy-round-1-design.md`,
`docs/superpowers/plans/2026-09-26-accuracy-round-1.md`.

## Integrated Why (DONE 2026-09-26) — ✅ owner-approved tables

**Branch `feat/integrated-why` (stacked on `feat/accuracy-round-1`).** The Why card used to lead with a
per-tract Course narrative — the same textbook journey for every site on the tract — and never showed what
decided the answer. It now leads with a DERIVED reasoning chain (`src/engine/why.js` `whyChain`): for each
entered finding, the structure that carries it at the chosen site (its note's own words), why it is on that
side, and every station where it could arise on its own; then where they all meet — one place, several
(→ the compare panel), or none (→ Together). An isolated sign that does not localise says so ("an extensor
plantar alone does not localise: cortex → cord").

**`meet` is the differential's explain-all set mapped to (station, side)**, not a raw intersection: it
applies the known-negative rule, so the Why and the Where cannot disagree (asserted over all 364 sites' own
pictures). **Stations** (`src/model/stations.js`) project levels onto a readable neuraxis, keyed
`${level}|${part}` for overrides; **side reasons** (`src/data/sideReasons.js`) are content only. The crossing
phrase is direction-free on purpose — *"that crossing lies (or does not lie) between this level and the side
it serves"* — because a descending tract in the cord has crossed above and an ascending tract in the medulla
has not crossed yet, and both are "same side". The cerebellar outflow crosses TWICE, so its same side has its
own sentence rather than "does not cross".

**Trap found by driving the app:** a SHARED finding that sits on no tract (ptosis: CN III or sympathetic)
read as "cranial nerves serve their own side" in Wallenberg. It now takes its pathway from a SIBLING — a
structure at the same site with the same carrier — so a sympathetic ptosis rides with the sympathetic miosis
while a CN III ptosis stays a cranial nerve (both asserted).

`whyNotOthers()` is deleted (the compare panel answers "why not elsewhere" for the candidates actually in
play); the Course narratives live on behind "Pathway anatomy".

Spec/plan: `docs/superpowers/specs/2026-09-26-integrated-why-design.md`,
`docs/superpowers/plans/2026-09-26-integrated-why.md`.

## ED first glance (DONE 2026-09-29) — ✅ owner-reviewed content (three rounds)

Sub-project 3 of the 2026-09-25 request. **Testers said the app was "too advanced and going over their heads"**
(owner, 2026-09-25); asked which part, the owner named the AMOUNT OF OUTPUT. v0.10.0.

**The results open on ONE ANSWER CARD** — Where / Why / What / Next + the site's red-flag sentence — every line
DERIVED by `app/answer.js` (`answerFor`), never authored per site. The Next line is the REFERRAL VERBATIM (first steps
run to ~190 chars and cannot be cut safely); the badge follows the RESOLVED plan (`resolveNext`, shared with the Next
card). The four detail cards are `<details>`, CLOSED below in the same order — the 2026-08-16 no-tabs ruling holds,
because Why's gist is on the card. Open sections live in `VIEW`, never in the case URL. Phones get a strip pinned to
the bottom while the answer lines are off screen — scroll-measured, because an IntersectionObserver never fired in a
throttled tab, and keyed on the LINES because the card's border alone peeked out behind the safety bar.

**The Why line is `whyClues()`** (`src/engine/why.js`): the fewest entered findings that, ON THEIR OWN, narrow the
DIFFERENTIAL to the answer's place — chosen against the differential, not station overlap (which stalled on 12/249
sites: a plexus cord). A both-sides finding is one clue with no side relation; ties go to the other side, then entry
order; one-sided clues get the crossed half appended. 365/365 site pictures and all vignettes reach their place.

**The input stays the examination tree** (owner reversed a complaint-first design the same day) but reads in plain
words: `app/plain-labels.js` — every finding's `label` + proper name in brackets (`term`, `displayLabel()`), a row-only
`note` for the strict vocabulary, and `less` for the "Less common (n)" block; `app/follow-ups.js` — TRUE REFINEMENTS
ONLY appear under a ticked finding, on its side, keeping their own rows (RAPD without monocular loss = optic tract);
`app/synonyms.js` — `searchFindings()` is the whole search. Onset and "Symptoms on" sit above the tree
(`tokensForRow` maps a row tap through the same offers as the buttons).

**REVIEW ROUND 1 CHANGED THE MODEL, not just labels** (`test/vocab-rulings.test.js` pins each ruling):
- **Brisk reflexes (`hyperreflexia`) replaced `umn_signs`** — which was produced ONLY at the conus, so a stroke with
  brisk reflexes pointed at the conus. Now tract-wide (wherever an up-going plantar or Hoffmann is), NOT in Friedreich's
  or SCD (reflexes lost, plantars up); the conus and the basis pontis predict both UMN signs.
- **`plantar_flexor` is the engine's first EXPLICIT NORMAL** (`EXPLICIT_NORMAL`, `normalNegatives()`). It DEMOTES —
  the `against` key sorts it below undemoted fits of the same coverage, and Where says "less likely — would give …".
  Built first as an exclusion: leg weakness + a down-going plantar left ONE candidate, and a flexor plantar is common
  early in stroke. It is stripped before matching; a normal alone localises nothing.
- **Central post-stroke pain removed** — not an examination finding. **The autonomic features are five findings**
  (dry mouth, constipation, erectile dysfunction, labile BP, arrhythmia), each predicted by LEMS AND acute GBS.
- **The hand-listed composite trap struck again**: the striatocapsular composite needed `ic_hyper` (as the thalamic one
  needed `thal_face`). Several scored-path assertions moved to the DISPLAYED answer where the tie is broken by the
  prevalence prior or the known-negative rule — the accuracy round's precedent.

**Closed 2026-09-29 (v0.10.1):** the chronic-onset tumour-plus-stroke-plan pairing was a clinical-safety defect,
not an oddity — see "Onset follows the cause" below.

Spec/plan: `docs/superpowers/specs/2026-09-27-ed-first-glance-design.md`, `docs/superpowers/plans/2026-09-27-ed-first-glance.md`.

## Onset follows the cause (DONE 2026-09-29, v0.10.1) — ✅ owner-approved rule + review-round rulings

**The defect.** At a chronic onset the What line named a glioma while the Next line read "Hyperacute stroke pathway
— assess for thrombolysis / thrombectomy within the window", EMERGENCY. The causes layer already set the infarct
aside; the Next steps layer never asked — its only onset rule was the hyperacute ESCALATION, and nothing
de-escalated. 42 stroke-site kinds at chronic onset, 40 at subacute.

**The rule** (`onsetFollows()` in `src/data/nextSteps.js`, the mirror of `hyperacuteVascular()`): a stroke-window
site whose leading cause is vascular, at an onset that sets THAT cause aside, FOLLOWS the cause the What line
names. Confirmatory, monitoring, referral and urgency become that cause's authored plan (urgency resolved as a
selection would be, the must-not-miss floor included); immediate and first-line stay the site's — THE TIER
SPLIT is unchanged. It only chooses between signed-off plans and writes no clinical text. **Owner rulings:**
follow the most likely cause (not a warning, not 43 authored slow-onset referrals); trigger on the INFARCT being
set aside, not every vascular cause (a cavernoma or a dural fistula is vascular and fits a slow onset, and kept
the stroke plan beside a tumour).

**Review-round rulings (on the 83-row before/after table):** (4) **a MIMIC is not the default card — unless the onset
is CHRONIC** — below chronic, where the What line names a mimic the site's own plan stands, because it is the plan
that warns against that mimic; decided on a fluent aphasia at subacute onset with delirium in the lead ("keep as
potentially missed stroke, hence why presenting subacutely" — its plan says "do not dismiss as delirium"). Revised
the same day: "it can be mimics if the chronicity is specified as chronic" — at chronic onset the hand knob
follows ulnar/median neuropathy, the vestibular nuclei vestibular migraine. (5) **central post-stroke pain is a SEQUEL**,
tagged `after: "stroke"` on its two cause entries (thalamus VPL, VPM): `leadingCause` skips a sequel, so it never
leads the What line or the Next steps, and the What line names it in its own clause — "After a previous stroke here:
…" — while it stays listed and selectable. (6) the optic nerve (AION) follow at hyperacute onset is kept. (7) at
every CHRONIC follow the What line adds "Could represent an old stroke." (a deficit present for months is often a
residual old stroke; `whatLine({ oldStroke })`, chronic only). Net reach: **37 site kinds at subacute, 42 at chronic,
1 at hyperacute, 0 at acute.**

**Mechanics worth knowing:** `nextStepsFor` = `sitePlan` (the old body) + the follow, with NO added key where the
rule does not fire — so no onset / acute onset is byte-identical. A SELECTION builds on `sitePlan`, never on the
followed plan, and `resolveUrgency` must read `sitePlan` (reading `nextStepsFor` recurses forever). The What line
and the rule share `rankCauses`/`leadingCause` (`causes.js`). The Next card says why in one derived line
("Following the most likely cause, X. A chronic onset rules out Y, which this site's usual plan is written for.").
The Together card follows automatically (it unions per-site `nextStepsFor`). The What line's sequel clause also
shows with NO onset (post-stroke pain fits then too).

**Known and left:** the retina — its leading cause is GCA, so the rule does not apply and "acute stroke pathway"
stands at every onset; the rule for NON-stroke sites (up to 99 site kinds) is its own decision; at subacute onset
the optic nerve (AION) has NO cause fitting the onset, so nothing is followed.

Spec/plan: `docs/superpowers/specs/2026-09-29-onset-follows-cause-design.md`, `docs/superpowers/plans/2026-09-29-onset-follows-cause.md`.

## Conus and cauda signs on both sides (DONE 2026-09-29, v0.10.2) — ✅ owner-approved model change

**The defect** (found behind the ED first-glance open item "the cauda Why line leads with sciatica-type root pain").
The conus and cauda emitted their LIMB signs @midline, while a clinician enters limb signs with L, R or "Both" (L+R).
Saddle numbness + sphincter dysfunction with any of the following said **"needs more than one lesion"** — the
accuracy round's most serious class of error:
- sciatica on both sides, or on one;
- both plantars up + brisk reflexes (the conus);
- both legs flaccid-weak + wasting, or one leg flaccid-weak + floppy (the cauda).

Only the easily missed "M" button fitted. The Why line then dropped the midline qualifier, so it read "Sciatica-type
root pain → only the cauda equina".

**Owner rulings:**
- **Seven structures emit `bilateral`**: `ls_roots_pain`, `ls_roots_motor`, `cauda_hypotonia`, `cauda_wasting`,
  `conus_bab`, `conus_cst`, `conus_spast`. This follows the `cauda_ankle_reflex` precedent (accuracy round B7).
- Saddle numbness and anal wink stay midline. The cauda stays `asymmetric`; the conus stays symmetric (ruling
  2026-09-25), so saddle + sphincter + ONE up-going plantar still says two lesions, by design.
- **The pudendal nerve's sphincter dysfunction is midline too** (`pud_sphincter` `emit: "midline"`). The browser
  check found that a row tap with "Symptoms on" set to Both or Left entered sphincter dysfunction on a side, because
  the pudendal nerve emitted it one-sidedly. The cauda picture then became "cauda + pudendal nerves". This had been
  live since v0.10.0's row taps, and the engine tests could not see it because they enter tokens, not taps.
- Now **no finding is offered on both midline and a side**.

**Mechanics:**
- The side offers follow automatically. The seven rows offer L / R; sphincter offers M only.
- `currentTokens()` (`app/sides.js`, applied in `restoreFromURL`) converts saved links: midline → L+R where both are
  offered, a side → midline where only midline is offered, and drops anything else unoffered.
- The both-sides → midline rule in `normalNegatives` is gone. It was dead once the conus stopped emitting @midline.
- Three notes read "both legs" instead of "midline".
- The cauda worked example enters bilateral sciatica. Its Why line now reads *"Bilateral sciatica-type root pain
  (radicular pain) → only the cauda equina."*, and the site's red flag already names bilateral sciatica.
- For left sciatica alone, the cauda is now a candidate (23rd of 24).

**Traps:**
- `cauda-conus.test.js`'s conus picture still used `umn_signs`, removed in v0.10.0. It passed without the conus
  explaining anything, and has been replaced.
- `app-smoke`'s "multifocal case" was itself the cauda + pudendal trap.
- A test of what the engine says is not a test of what a TAP enters. Browser-drive the row taps.

Spec/plan: `docs/superpowers/specs/2026-09-29-conus-cauda-bilateral-design.md`, `docs/superpowers/plans/2026-09-29-conus-cauda-bilateral.md`.

## Spinal cord fix (DONE 2026-10-22, round 1) — ✅ owner-approved rulings (all 13 rows)

The first fix from the 2026-10-18 clinical audit. **The defect:** one generic cord predicted arm signs for every cord
lesion and had no segment, the conus outranked it, and spinal shock did not exist. So a thoracic paraparesis read as
"conus", whose plan images T12–L1, while the cord plans image the whole spine.

**Mechanics:**
- `cordVariants` derives the readings of the bilateral anterior, the transverse and the hemicords:
  - arms-spared;
  - at-level spans from the root rows, per side;
  - spinal shock, with six `cord|shock` rows, Babinski kept, and only with a stated level.
- `solverSites(opts)` scores them and `firstPerId` keeps each id once.
- `candidateSites()` is unchanged.
- The bilateral cord takes the cord's own tier; the conus is RARE.
- An UMN release sign on a side excuses that side's missing corticospinal signs. Weakness never excuses.
- The transverse cord takes the saddle (`cord_saddle`).
- The central cord adds `cst_cord_arm` + `ah_wasting`.
- A stated level:
  - demotes non-cord sites (`levelAgainst`);
  - restricts variants (`top`);
  - is described from the DISPLAYED answer.
- `app/level-axis.js` holds when the field shows and what the level line says. The field shows for a cord FIRST
  answer, not anywhere in the list (owner refinement of row 10, so a single weak limb keeps the field hidden).

**Rulings that are traps:**
- New site ids FAIL the audit's exact-id regexes (measured: cord 4/16), so variants keep the id.
- Spinal shock without the level gate steals GBS's picture.
- Saddle loss on the anterior cord beats the conus for the classic conus picture.
- The segment constraint without the demotion puts the conus first for spastic legs + C4.

**Content round 1 (RULED 2026-10-22, all 22 rows, spec §10).** Capturing the real card showed every anterior-cord
reading leading its What line with "Anterior spinal artery infarct", even a spastic paraparesis. Now:
- **Compression first.** `cord_anterior` lists "Compressive myelopathy (disc / mass / abscess)" first, with an acute
  tempo too. The ASA infarct still leads at a hyperacute onset. So the anterior cord leaves the onset-follows rule:
  re-pinned 36/41, and no more "Could represent an old stroke" for a cord.
- **New causes.** Cervical spondylotic myelopathy joins the anterior and transverse lists; it reuses its workup and
  does not lead. The transverse compressive cause is chronic too.
- **A4.** The anterior cord's red flag reads "compression until whole-spine MRI says otherwise" first.
- **A1–A2.** The answer's Where line names the reading in brackets (`readingLabel`, app/labels.js); the "also fit"
  places stay plain.
- **B3.** The typed-level note no longer says "at or just above": a compression can sit several segments higher, so the
  level does not replace whole-spine imaging.
- **C1.** The contradiction sentence leads with the place.

The seven new structure notes and anatomy rows were approved as written. The central cord's "generalised" wasting
wording is fixed with the syrinx.

**Deferred:** the syrinx's leg signs and the basilar coma picture go to the composite-sites round. The syrinx's leg
signs conflict with R1 #12 until a bilateral parasagittal site exists.

Spec/plan: `docs/superpowers/specs/2026-10-22-spinal-cord-fix-design.md`, `docs/superpowers/plans/2026-10-22-spinal-cord-fix.md`.

## False-multifocal fix (DONE 2026-10-22, round 1) — ✅ owner-approved rulings (all 20 rows)

The second fix from the 2026-10-18 clinical audit. **The defect:** the engine claimed two lesions, and named a disease
to join them, when one place explained the picture. It held 269 of the 302 failing audit checks. A Wallenberg entered
with past-pointing read "lateral medulla + cerebellar hemisphere — Together: Multiple sclerosis", and the app's own
follow-ups list offers past-pointing as the refinement of limb ataxia.

**Mechanics:**
- **Word families** (`src/model/families.js` content, `src/engine/families.js` matching). The solver matches every
  entered word through its family and NEVER rewrites it:
  - the cerebellar limb signs are one finding;
  - hand weakness is arm weakness only with leg or facial weakness on that side;
  - a place giving scanning speech explains "slurred speech".
- **The same-family near-fit** (in `solveOne`) is the one exception to "a LOCALISING sign is never relaxed away"
  (owner-approved overturn, row 5). A word entered INSTEAD of a family word that a place predicts on that side, and that
  was not entered, makes that place a near-fit: it leads, `r.nearFit.instead` names the word, and `multi` is null.
  - Only the facial sensory words and plain → scanning speech qualify, not hand weakness outside a hemiparesis.
  - "As well as" is not "instead of": with both words entered, the claim stands.
- **Background (Hickam).** `backgroundAside` wraps `solve`. Absent ankle jerks, or glove-and-stocking numbness, on BOTH
  sides are set aside when they are what stops one place explaining the rest.
  - They are kept when a place in the answer predicts both sides, so GBS keeps its absent ankle jerks.
  - They go as a pair, never one side.
  - They never join a multifocal cover.
  - `r.background.tokens` carries them, and the card names them.
- **The cover counts a family once**, or one cerebellar sign on each side wins the greedy first pick.
- **The card** (`app/answer.js`) names both words for a near-fit and adds the set-aside sentence, plus a B12 line for a
  cord answer. The Why line leaves out what was set aside, and `app.js` counts the rows without it.
- **The roster is unchanged.**

**Traps worth knowing:**
- Equivalence must be MATCHING-level. Teaching every limb-ataxia structure to also produce the other three words would
  make the audit's swap loop skip them, silently removing 54 counted checks.
- Relaxing ANY one localising sign was measured and rejected. It hides 3,934 of 9,226 sampled genuine two-lesion claims,
  including x-mets/x-embolic, x-paraneo and x-syphilis. The archetype suite pins both places, so it cannot see this.
- The first background prototype set aside GBS's OWN absent ankle jerks, because it checked what was entered rather than
  what the place predicts. Only reading the real card showed it.

**Measured:**
- Audit 79 → 86/108 probes, with 3 probes added by row 19. Counted checks 679/302 → 960/30. Swaps 223/224, background
  292/292, mirror 270/270.
- `npm test`: 85 suites, 7289 assertions, no re-pins.
- Of 9,226 sampled genuine two-lesion claims, 15 become one lesion, all read clinically as one lesion: crossed brainstem
  syndromes, a hemiparesis with the hand in it, and a cord lesion with background ankle jerks. None are added.
- Past-pointing alone now fits 10 places along the cerebellar limb pathway (it was 2).

Spec/plan: `docs/superpowers/specs/2026-10-22-false-multifocal-design.md`, `docs/superpowers/plans/2026-10-22-false-multifocal.md`.

## Content-gap fix (DONE 2026-11-01, round 1) — ✅ owner-approved rulings (every row)

The third fix from the 2026-10-18 clinical audit. **The defect:** 16 counted checks failed because a place was missing
one of its own signs, a word had no pyramidal reading, or a setting acted as a hard gate. Two of them sent the reader the
wrong way: a C6 radiculopathy read as an obstetric upper-trunk injury (urgent nerve-transfer surgery), and a thalamic
lacune with hemiataxia read as a top-of-the-basilar occlusion.

**Mechanics:**
- **Nine one-finding rows:** the claw at the ulnar elbow (the paradox is about degree), the C6 biceps jerk, the L4
  adductors, the tongue in the anterior horn's bulbar neurones, XII in the carotid space, AICA's inner ear (abnormal head
  impulse + peripheral nystagmus on the lateral pons), the PPRF's resting deviation away from the lesion (wrong-way eyes,
  `crosses: true`), and the thalamogeniculate hemiataxia (`thal_ataxia`, `crosses: true`).
- **Composites:** the upper trunk reuses `axil_sens` (`composePlexusSites` `nerves`); the fusiform is PCA territory
  (`DIVISION`), so the dominant PCA gives alexia without agraphia and the non-dominant prosopagnosia; the hand-listed
  thalamic-aphasia composite carries `thal_ataxia`.
- **The `pyramidal` family relation** (`leg_foot`): a place that gives pyramidal leg weakness explains a foot drop entered
  with an UMN sign or other pyramidal weakness on that side. It reads the PLACE's word (`predictedToken`), never the
  entered one, so a root or nerve keeps the foot drop (option A2).
- **Dominance is a prior** (`solveOne`): only when NO place explains the picture with the dominance set, the places that
  do with the other dominance lead, no second lesion is claimed, and `r.dominance = { assumed, set }`. The card reads the
  place, Why line and red flag with the assumed dominance and adds the row-14 sentence; `app.js` reads it through
  `domView()` (reset on every render). The red flag now follows the dominance setting at all — it ignored it before.

**Rulings that are traps:**
- The thalamic-aphasia composite is hand-listed: without `thal_ataxia` the stale copy out-ranks the thalamus (the B11
  trap, a third time).
- `subcortex.test` allows exactly one crossing override, `thal_ataxia`.
- Option A (re-reading the entered foot drop, row-20 style) takes it away from the L5 root whenever a Babinski is on that
  side; A2 does not.
- Accepted cost: AICA is an "also fits" for every peripheral-HINTS picture, with or without hearing loss (the model
  cannot condition on it). A recorded normal hearing would remove it — not built.
- The dominance fallback turns crossed pictures (one hemisphere's signs with the other's language or neglect signs) into
  one lesion; the card names the assumption.
- Isolated ptosis now leads with the orbital III superior division; it used to tie with the carotid space and win on
  alphabetical order.

**Deferred:** the upper trunk's musculocutaneous row (row 5) goes to the plexus round, with "a trunk takes every row of
its roots" (spec O1). The cover's larger-place tie-break (O3) is its own design (`fix/cover-tiebreak`).

**Measured:** audit 86/108 → 101/111 probes (3 probes added by row 19); counted checks 960/30 → 1034/13, the 13 being
exactly the composite-sites and raised-pressure rounds; swaps 272/272 (48 new cerebellar swaps), background 292/292,
mirror 273/273. The 1,037 checks shared with the prototype are identical. `npm test`: 86 suites, 7355 assertions; new
suite `test/content-gaps.test.js`; the re-pins are exactly spec row 18. Browser-checked on port 8140.

Spec/plan: `docs/superpowers/specs/2026-11-01-content-gaps-design.md`, `docs/superpowers/plans/2026-11-01-content-gaps.md`.

## Composite sites (DONE 2026-11-05, round 1) — ✅ owner-approved rulings (all 16 rows)

The fourth fix from the 2026-10-18 clinical audit. **The defect:** one lesion spanned places the model held only
separately, so it claimed two lesions and named a disease to join them. Three cards sent the reader the wrong way:
- a basilar coma got the cord's plan (*"Spinal surgery — cord compression is time-critical"*);
- so did a parasagittal meningioma, the very mimic its own cause list warns about;
- a comatose pontine haemorrhage showed the locked-in red flag, *"the patient is fully aware"*.

**The principle (spec §3.1):** the same lesion grown larger is a READING of its site (same id, content and links, the
cord fix's idiom); a different place is a NEW SITE. Either way it is DERIVED from its source rows, never hand-listed.

**Mechanics:**
- **Locked-in re-derived** (`composeConsciousnessSites`): both sides of the basis pontis + the paramedian pons's
  horizontal-gaze rows (`PONS_GAZE`) + preserved vertical gaze.
- **Two readings:**
  - the ARAS's `basis` reading: bilateral, `station: "pons"`; coma with quadriparesis, both Babinski signs and gaze palsies;
  - the central cord's `syrinx` reading: the leg corticospinal rows, `needs: ["suspended_sensory"]`.
  `variantOf` carries a reading's `side` and `station`. `solverSites(opts, entered)` offers a `needs` reading only when its
  finding is entered.
- **Three new sites:** `bilateral_pons_mlf` (content from the medial pons); `bilateral_paracentral` (content from
  `cortex_paracentral`); `top_of_basilar` (Percheron's rows + both PCA cortical territories, its own content key
  `thalamus_arousal|basilar_apex`).
- **The Why line:** a place spanning two stations (`carrierStations`, the top of the basilar) sits where the rows carrying
  the entered findings are (`stationsAt` in why.js). So Anton's alone still reads "only the cerebral cortex".

**Rulings that are traps:**
- **The locked-in hand list went stale** — the B11 trap a fourth time. It had no Babinski, face, speech or gaze.
- **The pontine haemorrhage probe passed by accident.** Its cover needed four places, one over the limit. Re-deriving
  locked-in alone makes it a two-place claim; the basilar reading makes it one place. Ship them together.
- **R1 #12's top 3 passed only because exactly two cord sites outranked the one-sided ACA.** Any new place explaining
  "both legs + Babinski" pushes it out. The audit's PARASAG regex now admits `bilateral_paracentral` (owner's ruling on
  the yardstick, row 7).
- **The syrinx reading ungated** takes "spastic legs + a cervical level" from the anterior cord. Its gate is the cape.
- **A new id for the basilar reading** fails the audit's PONS regex (measured −2), so it stays a reading of
  `brainstem_aras`.
- **The raised-pressure round** (`fix/raised-pressure`) gates its uncal reading the same way. Whichever lands second
  reuses the first's gate.

**Measured:**
- Audit 101 → 112/115 probes (4 added by row 15). Counted checks 1034/13 → 1055/4; the 4 are the raised-pressure round.
- Swaps 272/272, background 292/292, mirror 277/277.
- `npm test`: 87 suites, 7420 assertions, no re-pins. The new suite is `test/composite-sites.test.js`.
- Frozen-input safety sample: 2 two-lesion claims become one place (both basis pontis → locked-in; both fusiform gyri +
  coma → the top of the basilar), 0 new, 21 covers move (the cover's larger-place tie-break), and no site picture
  changes its first answer.

Spec/plan: `docs/superpowers/specs/2026-11-05-composite-sites-design.md`, `docs/superpowers/plans/2026-11-05-composite-sites.md`.

## Plexus round (DONE 2026-11-06: round 1 + content round 2) — ✅ owner-approved rulings (every row)

Content-gap observation O1 found that `composePlexusSites` built every trunk and plexus as a plain union of its root rows.
**The defect this round fixes:** a plexopathy entered in the nerve-territory words a clinician tests read as two lesions:
- Erb + lateral-forearm numbness read "upper trunk + musculocutaneous — Vasculitis";
- a lumbar plexopathy with front- and inner-thigh numbness read "femoral + obturator — Mononeuritis multiplex", EMERGENCY;
- sciatic numbness + a weak gluteus medius read "sciatic + sacral plexus";
- little-finger + T1 numbness read "T1 root + medial cord".

**Mechanics (one composer change).** Each element carries the cutaneous row of every MIXED nerve that arises wholly from
it. The rows are reused through the `nerves` lists, the content-gap row-4 idiom:
- upper trunk: `axil_sens`, `mcut_sens` (`mcut_sens` is content-gap row 5);
- lower trunk: `uln_el_sens`;
- lumbar plexus: `fem_sens`, `obt_sens`;
- sacral plexus: `sci_sens`.

No new structure, finding, site id or solver step.

**Rulings that are traps:**
- **Branch and pure-sensory rows stay out** (deep and superficial peroneal, tibial, sural, saphenous, LFCN, dorsal ulnar).
  The broad version breaks the foot-drop worked example: first web-space numbness stops pinning the peroneal nerve
  (3 checks). Meralgia, sural and saphenous numbness would each list a plexus.
- **Radicular pain stays shared with the plexus (row 2: NOT root-only).** Measured, root-only adds 9 sampled two-lesion
  claims and grows 381 covers to three places. A painful plexopathy entered with root pain reads "root + plexus —
  Vasculitis". It needs 4 re-pins, and it makes the middle trunk a strict subset of the C7 root.
- **L4 divides, and a whole lumbosacral plexus place exists (rows 1, 8–9; built 2026-11-06 with content round 2).**
  The eight L4 rows name the plexus they travel in (`plexus` on the structure): quadriceps, knee jerk, adductors and
  medial shin → lumbar; tibialis anterior and posterior → sacral; wasting and root pain → both. `composePlexusSites`
  reads the tag, and a `whole` group (`lumbosacral_plexus`, L2–S1 + femoral, obturator, sciatic) takes every row.
  - Never build the split alone. It adds 9 sampled two-lesion claims, and knee + ankle jerk lost on one side reads
    "femoral + tibial — Mononeuritis multiplex", EMERGENCY.
  - **Accepted cost (C12):** any two lumbosacral roots read as one lumbosacral plexopathy. "L2 numbness + S1 numbness →
    only the left plexus". The cause list's mimic, "Several lumbosacral roots (multilevel spondylosis or canal
    stenosis)", names the alternative. A whole place WITHOUT dermatome rows was measured and rejected: 100 pictures
    lose their claim and 9 new claims appear.
  - The whole place is an "also fits" for every lumbar root and plexus picture. The foot-drop worked example now shows
    four places (two re-pins, C13).
  - **No whole brachial plexus place (row 10 / C14).** It made 14 sampled two-lesion claims one place, including a C8
    root with a posterior interosseous palsy, and broke the pinned "C5 + C7 numbness = two roots". The flail arm
    stays three places, an open observation.
- **Read sample growth with care when a row takes a sign away from a place.** Frozen pictures still carry the old sign,
  so the growth is definitional. The spec explains it.

**Measured:**
- Audit 101/111 → 105/115 probes (4 probes added by row 15, each failing on `4d781bd`); counted checks 1034/13 → 1047/13
  (the new place's own mirror check passes).
- Swaps 272/272, background 292/292, mirror 278/278.
- `npm test`: 87 suites, 7440 assertions. New suite `test/plexus-round.test.js` (74).
- Re-pins: the content-gap suite's "row 5 deferred", and C13's foot-drop pins (`discriminators` four candidates;
  `answer` Where line; the example's comment).
- Safety sample:
  - rows 3–7: 11 claims become one plexus, none added; 41 covers swap a nerve for its plexus element (the tie-break,
    O3); no first answer changes;
  - rows 8–9: 7 more become the lumbosacral plexus, none added; 291 covers move to it (O3).
- The real cards equal the prototype's on every captured picture (119 for rows 3–7; 132 for rows 8–9). The 9,490-pair
  sample is identical to the prototype's.
- Browser-checked on port 8141 (launch entry "NeuroLocaliser plexus worktree"). Six left-sided row taps (front- and
  inner-thigh numbness, weak hip flexion, knee extension and hip adduction, absent knee jerk) read "Left lumbar plexus."
  with no Together line, and the console has no errors. Rows 8–9: knee + ankle jerk lost on the left by two row taps reads
  "Left lumbosacral plexus." with the approved What, Next and red-flag lines.

Spec/plans: `docs/superpowers/specs/2026-11-04-plexus-round-design.md`, `docs/superpowers/plans/2026-11-05-plexus-round.md`,
`docs/superpowers/plans/2026-11-06-plexus-round-rows-8-9.md`.

## Raised-pressure round (DONE 2026-11-09, round 1) — ✅ owner-approved rulings (every row)

The fourth fix from the 2026-10-18 clinical audit. **The defect:** a false-localising or herniation sign read as two
lesions (R1 #7, #8, #13), and three cards were unsafe beyond those checks: coma + a blown pupil read as Adie's pupil
("outpatient reassurance, routine"), papilloedema alone as a large MCA infarct (stroke pathway), and a VI palsy with
papilloedema as a pontine infarct.

**Mechanics:**
- **Both VI nerves** are one bilateral site, `bilateral_skull_base_vi_cisternal` (`composeBilateralAbducensSites`), from the
  existing `vi_cisternal` row, so it keeps every table keyed by the place.
- **`PRESSURE_REACHES`** (`compartments.js`): under papilloedema the compartment filter also keeps the VI's cisternal course and
  the VI at the petrous apex, the nerve courses the pressure itself injures. The IV's cisternal course was deferred (its card
  would badge routine) and joined in the pressure-follows round (2026-11-10), once its card followed the pressure.
  `test/raised-pressure.test.js` checks the set against the causes.
- **The false-localising set-aside** (`falseLocalisingAside`, run before the background step) is the second narrow overturn of
  "a LOCALISING sign is never relaxed away". With papilloedema, a VI palsy (`FALSE_LOCALISING_SIGNS`) is set aside when:
  (a) papilloedema is entered; (b) no place explains every finding; (c) one place explains the rest, or nothing is left;
  (d) that place is the rest's own answer without the papilloedema. It never joins a cover; `r.pressure.falseLocalising.tokens`
  carries it and the card names it.
- **The pressure-only card** (`PRESSURE_ONLY`, `app/answer.js`): papilloedema with nothing else localised names no place, and
  `app.js` draws only the answer card, the banner and the Where list.
- **READINGS of a primitive site** (`sites.js`): the uncal reading of the compressive III, a variant with the same id, adds the
  ARAS, extensor posturing and the midbrain peduncle (contralateral arm, leg, Babinski). `solverSites(opts, observed)` gates
  it: reduced consciousness entered AND one of the III's own signs. It leads with uncal herniation (`leads` → `lead: true`,
  read as common within the reading) and carries its own red flag.

**Traps worth knowing:**
- An ungated reading takes the awake Weber picture (7 assertions). The consciousness gate alone lets coma + a weak arm read a
  compressed III, and lets the reading take the coma in 23 covers of the safety sample.
- A herniation site with its own id fails the approved top-3 check: a place that explains every finding is shown alone.
- The What card's "Most likely:" line lists only common causes. A lead flag alone left it naming the aneurysm under an answer
  card naming herniation (found in the plan's dry run).
- `minimalSet` is solved without the papilloedema, so the cover can use places the list excludes (spec O2). That is how R1
  #7's card mixed two places.
- `why.js`'s station index calls `solverSites(opts)` without findings, so it never sees a gated reading.

**Measured:** audit 101/111 → 108/115 probes (4 probes added by row 13); counted checks 1034/13 → 1050/9, the 9 being the
composite-sites round; swaps 272/272, background 292/292, mirror 277/277. `npm test`: 87 suites, 7413 assertions; new suite
`test/raised-pressure.test.js`; the one re-pin is `fundus.test` (row 12). Safety sample: 3 claims fewer, 0 new. Pressure
sample (papilloedema added): 84 claims fewer, 0 new. Browser-checked on port 8143.

Spec/plan: `docs/superpowers/specs/2026-11-05-raised-pressure-design.md`, `docs/superpowers/plans/2026-11-05-raised-pressure.md`.

## Pressure follows the cause (DONE 2026-11-10, round 1) — ✅ owner-approved rulings (every row)

Observation O1 of the raised-pressure round. **The defect:** papilloedema narrowed the PLACES but not their CAUSES. The What
line, the Next plan and the badge still followed each place's usual cause, most often an infarct that cannot raise the
pressure. With papilloedema and no onset, 316 of 434 cards led with such a cause; 202 of them badged emergency, mostly on a
hyperacute stroke pathway, and 11 routine. Papilloedema + a right hemiparesis read *"Lacunar infarct"* with the hyperacute
stroke pathway; coma + papilloedema read *"Metabolic or toxic encephalopathy"*.

**Mechanics:**
- **A second demotion axis** in `causesFor(site, { onset, pressure })`, beside the tempo: with papilloedema a cause that cannot
  raise the intracranial pressure is DEMOTED, never dropped (`demotion: { axis: "pressure", entered: "papilloedema" }`). A
  cause both axes demote keeps the tempo axis and adds `pressure: true`. `combinedCauses` passes it. The result gains
  `pressure: true` only when the pressure acted, so every output without papilloedema is byte-identical (asserted).
- **`CAN_RAISE_PRESSURE`** (`causes.js`) is ONE table: category defaults (neoplastic, infective and traumatic can; the rest
  cannot) plus named `can` / `cannot` patterns, `cannot` read first. An infarct can only when it is named space-occupying
  (malignant MCA) or sits in the posterior fossa and takes the cerebellum (PICA, SCA, cerebellar) — not a large MCA or
  carotid-T, not AICA. Hypoxic-ischaemic injury cannot. Appendix A of the spec is the clinical content;
  `test/pressure-follows.test.js` snapshots it.
- **`pressureDemotesAt(site)`**: only where the compartment filter keeps the place (intracranial, or `PRESSURE_REACHES`). The
  retina is exempt, so giant cell arteritis keeps its lead (row 7).
- **`pressureFollows`** (`nextSteps.js`, the mirror of `onsetFollows`): the plan follows the cause the What line names when the
  pressure sets the site's usual cause aside, or when the approved onset rule fires — never elsewhere. `followed.by` records
  which axis did it, and the Next card's note says so (rows 17–18).
- **`pressureFloor`**: nothing is routine with papilloedema — in `nextStepsFor`, `pathologyNextStepsFor` and the entity path of
  `combinedNextSteps`. **The hyperacute escalation is untouched**: it still reads only the onset.
- **The pressure leads** (`resolveNext`, `pressureLeads` in `app/answer.js`): where no cause at the place can raise it, the
  What and Next lines are `PRESSURE_ONLY`'s, the badge is at least urgent, and the banner is the red line. Never on a
  two-place card, a selection or the all-sites view.
- With papilloedema the What line drops *"Could represent an old stroke."* (row 14).
- **The IV's cisternal course joins `PRESSURE_REACHES`**: its card now leads *"Tumour or raised intracranial pressure"*
  [emergency], not the trochlear nucleus's demyelination (row 15; three re-pins in `raised-pressure.test.js`).
- **The cards:** the What card's *"Set aside — less likely with papilloedema"* band is selectable, because the papilloedema may
  be unrelated: the lacune can still be chosen, and its plan is floored at urgent. The all-sites view splits demoted shared
  causes the same way. The tempo band is unchanged.

**Traps worth knowing:**
- Letting the hyperacute escalation read the pressure drops 19 hyperacute cards from emergency. Keep it on the onset.
- Following whenever EITHER axis sets the usual cause aside silently extends the onset rule to non-stroke places (the pretectum
  at acute onset followed hydrocephalus). The approved onset rule is the GATE; the plan always follows the What line's cause.
- A What-line probe must read the "Most likely" clause only: on the base, the IV probe passed by matching the must-not-miss.
- The retina never follows the pressure, even when an onset alone empties its list (plan decision 1), so at chronic onset the
  pressure leads on 71 cards, not the spec's 83.
- The `RAISES_PRESSURE` regex (the ophthalmic prompt) is not the attribute: it names 24 of 641 rows, and as the attribute 351
  of 436 cards named no cause at all.

**Measured:** with no onset, 385 of 436 papilloedema cards change. The plan follows on 292 and the pressure leads on 24; none
badge routine, and What and Next agree on every card. 59 leave emergency, 40 rise to it and 21 rise from routine. At hyperacute
onset no card loses emergency. Without papilloedema 0 of 3,765 cards differ. The build equals the plan's dry run on all 7,530
sample cards, all 1,226 pairs and the 46 + 41 captured cards. `npm test`: 88 suites, 7495 assertions; new suite
`test/pressure-follows.test.js`; the re-pins are exactly row 19's three. Audit: the existing checks do not move (1050/9); with
row 20's four probes and the new `lead` check, 1063/9 (probes 112/119); swaps 272/272, background 292/292, mirror 281/281.
Browser-checked on port 8144.

**Not fixed (spec §7, for later):** the place ranking and the Together card's disease still ignore the pressure (O1, O2), and
the cover still ignores the compartment filter (O4). Two wording points from the browser check await a ruling (spec status).

Spec/plan: `docs/superpowers/specs/2026-11-09-pressure-follows-cause-design.md`, `docs/superpowers/plans/2026-11-09-pressure-follows-cause.md`.

## Integration of the open fixes (2026-11-10) — LOCAL branch `integrate/all-open-fixes`, NOT pushed, NOT merged

Every open engine fix in one tree, measured before they land as one release. It starts at PR #25's tip (`bda1113`, which
already holds #18 → #20 → #21 → #19 → #24) and merges #23 composite sites (`a24453e`), #22 plexus round (`39b4957`) and
#17 storage-accessor guard (`72a5c52`), in that order, one merge commit each, each measured. No fix branch was changed.
`fix/cover-tiebreak` (O3) is a design awaiting its ruling, not a fix, so it is not in.

**One reading gate.** The composite-sites and raised-pressure rounds each added a `needs` gate to `solverSites`. Git merged
them into TWO gates with two parameter names (one would have thrown) and two shapes: the syrinx's `needs` is a list
(`["suspended_sensory"]`), the uncal reading's a string (`"reduced_consciousness"`, plus `needsOwn`). Now one gate reads
both, `[v.needs].flat().includes(t.split("@")[0])`. It equals each branch's own test on every real token, because every token
carries a side (`@none` for a midline finding). Neither branch's site declarations changed. `variantOf` carries both rounds'
fields (`side` and `station`; `leads` and `red`).

**Measured** (`npm test`, `npm run test:audit`, and every suite one by one):
- `npm test`: 90 suites, 7669 assertions, 7667 pass and 2 fail.
- Audit: probes 127/127; counted checks 1097 passed, 0 failed, 0 pending; swaps 272/272, comorbidity 292/292, mirror
  290/290. Composite's 4 failures and raised pressure's 9 are each fixed by the other round.
- Every count is the exact union of the branches' own, each measured on its own tip.

**The 2 failures are a clinical question for the owner, NOT fixed by re-pinning.** Both are `pressure-follows` pins that pass
on their own branch. They move only because the composite sites bring three places into play under papilloedema.
- **Row 21's snapshot** pins 99 lists, 647 rows, 438 names and 266 rows that can. Now: 100 lists, 655 rows, 438 names, 268
  can. The top of the basilar's 8 causes join the in-play lists. `CAN_RAISE_PRESSURE` reads deep cerebral venous
  thrombosis and PRES as able to raise the pressure there, and the other six as not: the embolism, basilar occlusion,
  vertebral dissection, cardiac arrest, Heidenhain CJD and NCSE. The 160 names that can are unchanged.
- **Row 1's ratchet** pins 112 kinds, `80/7 52/44 66/20 37/15 23/17`. Now: 115 kinds, `82/7 54/45 69/20 38/15 23/18`.
  - Both MLFs and both paracentral lobules repeat their content source's rows exactly (the medial pons, the paracentral
    lobule).
  - The top of the basilar is the only new content. With papilloedema it leads with PRES at no onset and at acute onset.
    The paramedian thalami lead with deep cerebral venous thrombosis; the list order decides between the two uncommon
    causes.
  - At hyperacute and chronic onset nothing there can raise the pressure, so the card follows the pressure itself.

**Superseded, not failing:** an assertion one branch re-pinned under its own ruling runs in its new form:
- plexus: four foot-drop candidates, the upper trunk's musculocutaneous row;
- raised pressure: the fundus row 12;
- composite: the PARASAG widening (row 7) is the audit's yardstick.

The storage guard's code applied cleanly; only the status counter line conflicted.

## Commands

- **All tests:** `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
  (runs every suite in sequence; exits non-zero on any failure).
- **A single suite:** run its file directly, e.g.
  `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cord.test.js`
- Each test file is a **standalone script** — no test runner/framework. It builds inputs, calls
  `solve()`, asserts with a tiny local `ok(label, cond)` helper, prints `PASS`/`FAIL` lines, and
  `process.exit(fail === 0 ? 0 : 1)`. When you add a suite, also add it to the `test` script in
  `package.json` and to the README/`npm test` chain.
- **Clinical audit (SEPARATE, EXPECTED TO FAIL):** `PATH=… npm run test:audit` runs `test/clinical-audit.test.js`
  — the 2026-10-18 audit's 101 bedside probes (+ 4 added by the spinal cord fix and 3 by the false-multifocal fix, 2026-10-22, and 3 by the content-gap fix, 2026-11-01, and 4 by the composite-sites round, 2026-11-05, and 4 by the plexus round, 2026-11-05, and 4 by the raised-pressure round, 2026-11-09, and 4 with a new `lead` check by the pressure-follows round, 2026-11-10) + three metamorphic properties (synonym swap, background
  comorbidity, mirror). It is the EXTERNAL accuracy baseline the engine fixes are measured against, so it is
  deliberately NOT in `npm test`: never wire it in, and never loosen an assertion to make it pass. Expectations
  are `T(...)` (textbook or owner-approved, counted) or `R(...)` (awaiting the owner's ruling — prints `PEND`, not
  counted); the owner approves rulings one round at a time. **Round 1 was RULED 2026-10-18** — all 17 proposed
  answers approved (each marked `owner-approved` in the file; do not re-flag them as unreviewed) and the synonym
  groups settled, including row 20 (`weak_hand` = `weak_arm` INSIDE A HEMIPARESIS; weak hand alone still means the
  hand knob; weak arm entered for an isolated weak hand is a DIFFERENT finding). Nothing is pending.
  Baseline: 66/101 probes correct (66/105 with the cord fix's four). After the cord and false-multifocal fixes: 86/108; after the content-gap fix: 101/111; after the composite-sites round: 112/115 (on its own branch); after the plexus round: 105/115 (on its own branch); after the raised-pressure round: 108/115; after the pressure-follows round: 112/119 (on the raised-pressure branch); with every open fix integrated (`integrate/all-open-fixes`, 2026-11-10): 127/127, every counted check passing. Baseline + rulings: `docs/superpowers/specs/2026-10-18-clinical-audit-suite.md`.

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
                 (cord anterior/posterior/central) so they feed composers but aren't standalone candidates;
                 READINGS of a primitive site (the uncal reading of the compressive III, gated — 2026-11-09)
  levels.js      ordered dermatome coordinate C2..S5 (+ spanName) — WHERE along the cord; a stated level is evidence
                 since 2026-10-22 (it demotes, constrains and gates — see "Orthogonal axes")
  prevalence.js  prevalenceOf(site) -> 2|1|0 (common/uncommon/rare) coarse per-site prior; TIEBREAK only
  families.js    WORD FAMILIES (bedside words for one examination, each citing its ruling; incl. the `pyramidal`
                 foot-drop relation, 2026-11-01) + BACKGROUND_FINDINGS
                 (Hickam: set aside on both sides) — content only (false-multifocal fix, 2026-10-22)
  tracts.js      the long tracts (corticospinal/spinothalamic/dorsal-column/corticobulbar): findings,
                 rostro-caudal course (level + detail + supply), decussation, direction; + NEURAXIS ordering
  compartments.js  level -> COMPARTMENT axis (brain/brainstem/cerebellum/cord/cauda/optic/skull_base/
                 root/plexus/nerve/motor_unit); compartmentOf(site). Finer than regionOf() in causes.js —
                 keeps brain and cord apart, which the multifocal roster needs. INTRACRANIAL_LEVELS in
                 inverse.js DERIVES from this table (single source of truth for "inside the skull"); plus
                 PRESSURE_REACHES and FALSE_LOCALISING_SIGNS (the raised-pressure round, 2026-11-09; the IV's cisternal
                 course joined PRESSURE_REACHES in the pressure-follows round, 2026-11-10)
  course.js      COURSES vocabulary (single/simultaneous/stepwise/relapsing/progressive) — HOW an illness
                 unfolded, orthogonal to onset tempo. Annotates/demotes only, like the sensory level
src/engine/    generic solver code (rarely changes when adding a region)
  forward.js     site -> expected signed findings; emits `${finding}@${side}` tokens
  score.js       scoreSite(): reward matches (LOCALISING findings weigh 3x), penalise unexplained
                 + over-prediction. Exports LOCALISING and NOT_LOCALISING_BY_DESIGN (finding id -> reason
                 it's deliberately excused; test/localising-audit.test.js asserts every single-level
                 finding is one or the other)
  inverse.js     THE single localiser. candidateSites() (reflection over compose*, drops buildingBlock);
                 solverSites() = candidates + their cord VARIANTS, each id kept once by the rankings;
                 differential() = the broad count/superset narrowing list (known-negative exclusion +
                 prevalence tiebreak); solve() returns {differential,explainAll,display,defaultSite,ruledOut}
                 AND the scored single/best/nearFit/multi/level/length + `dominance` (the dominance fallback,
                 2026-11-01); knownNegatives(); ruledOutSites()
  tracts.js      tractsFor() (which tracts a finding-set implicates + candidate sites along each);
                 tractNarrative() (composed Course prose); whyNotOthers() (derived per-level discrimination)
  patterns.js    cross-cutting SYNTHESIS (NOT localisation): umnLmnPattern() and functionalFlag()
  families.js    matching through the word families: an entered word is READ through its family, never rewritten
                 (enteredToken / predictedToken / sameFamilyInstead) — used by inverse, score, why and the app
  multifocal.js  LOGIC ONLY (content lives in data/multifocal.js). unifyingDiagnoses(sites,observed,
                 {onset,course}) matches the MULTIFOCAL roster against a site set (hard constraints filter,
                 tempo/course only demote); forcingFindings(observed,opts) is the parsimony guard — for
                 each LOCALISING finding, does removing it collapse the picture to one site?
src/data/
  syndromes.js   thin descriptive phonebook keyed by emergent site id -> eponym + ddx + red flags
  causes.js      THE PATHOLOGY LAYER. tempo-aware surgical-sieve DDx: causesFor(site,{onset,pressure}) ->
                 {byCategory, demoted, all, source}. Precedence: curated CAUSES[site] → phonebook ddx
                 (categorised live) → attribute-derived fallback. Each cause via `c(name,cat,tempo,
                 likelihood,red,feature,pathognomonic)`: `feature` = a "what points to it" clue; `pathognomonic`
                 = a bedside "🔎 Confirm on exam" sign. A central `PATHOGNOMONIC` keyword→sign table enriches
                 causes from ALL sources by name (Ramsay Hunt vesicles, Argyll Robertson, KF rings, …).
                 A cause whose tempo misses the entered onset moves to `demoted`, it is never dropped. With
                 papilloedema (`pressure`), so does a cause that cannot raise the ICP (`CAN_RAISE_PRESSURE`: category
                 defaults + named exceptions), where `pressureDemotesAt` (the retina exempt) — the second axis, 2026-11-10.
                 combinedCauses(sites,{onset}) + canonicalKey(name) merge causes across sites for the
                 Together/What-all-sites views — canonicalised through the MULTIFOCAL roster's own `matches`
                 regex (a name matching 2+ regexes is left uncanonicalised rather than guessed).
  nextSteps.js   THE WORKUP LAYER (educational). nextStepsFor(site) -> {immediate, investigations,
                 confirmatory, monitoring, urgency, referral, curated}. Curated NEXT[site] carries specifics;
                 tiers derive from urgency + region (bulbar/cord/arousal/nmu/optic/vestibular) otherwise.
                 combinedNextSteps(sites) unions per-site plans for the cross-site view; urgency = the
                 MOST urgent site, never an average. With papilloedema, pressureFollows() (the mirror of
                 onsetFollows) has the plan follow the cause the What line names, and pressureFloor() keeps every
                 plan off routine (2026-11-10).
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
  discriminators.js  discriminators(candidates, observed) -> what would SPLIT the candidate list, most
                 informative first; explainedBy(). Pure/DOM-free. The reader ticks which locations they are
                 choosing between and the Why card says what to examine and what each result proves
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
- **Orthogonal axes.** The cross-sectional pattern says *which* syndrome; the sensory level says *where along the
  neuraxis* — and since the spinal cord fix (2026-10-22, owner-approved, overturning "annotates, never changes") it is
  EVIDENCE: a stated level demotes (never excludes) every site that cannot produce it, restricts the cord's readings
  to those at or above it, and gates spinal shock. It never adds or removes a candidate or a multifocal claim.
  The cord's own WHERE is carried by VARIANTS of the same cord sites (`sites.js` `cordVariants`, `inverse.js`
  `solverSites`): arms-spared, at-level spans (C5–6 … C8–T1, per side) and spinal shock. New per-region mechanisms
  still follow this shape: a small, well-contained axis rather than a branch in the solver.

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

Not a medical device; not for clinical use.

**✅ THE ANATOMY MODEL HAS BEEN REVIEWED (2026-08-21).** The owner (a clinician) read the rebuilt review
sheet — all 528 structures across 16 regions, in one pass — and signed it off. That was the last standing
correctness gate on the engine, and it had been open since the project began. It already paid for itself
before the read even finished: authoring the sheet exposed a live crossing bug (`scp_midbrain` emitted
ataxia ipsilaterally; the superior cerebellar peduncle decussates in the caudal midbrain, so it is
CONTRALATERAL — fixed in PR #9). **Do not re-flag the anatomy tables as unreviewed.** Structures added
from here are held to the same bar: add the row to `docs/artifacts/anatomy-model.html`, verify every id
against `src/model/structures.js`, and flag anything uncertain for the owner.


## The neuraxis diagram REMOVED, replaced by the compare panel (2026-08-25)

**The diagram was rebuilt three times in one working period** — a hand-drawn anatomical figure, a traced
public-domain plate, then an orthogonal schematic — and each rewrite improved the drawing without asking
whether a single combined picture was the right vehicle. The owner stopped it: *"this is really just
getting out of hand."*

**THE REFRAME: a picture of the neuraxis is in every textbook; the REASONING is not.** The engine's
distinctive asset is that it derives which findings force which site and what would separate the
survivors, and no version of the drawing ever showed that.

**The measurement that settled it: EVERY SURVIVING CANDIDATE EXPLAINS EVERY ENTERED FINDING** — that is
what makes it a candidate. Wallenberg's two both explain 6 of 6; foot drop's three all explain 3 of 3. So
a grid of "what does each candidate explain" is solid ticks and says nothing. The information is entirely
in what a candidate PREDICTS THAT HAS NOT BEEN LOOKED FOR, which is exactly the next examination.

**`app/discriminators.js`** (pure, DOM-free) computes it; the Why card renders it. The reader **ticks which
locations they are choosing between** — the owner's refinement, and the thing that makes it work at any
size. The right examination depends on which two you pick:

| comparing | examine |
|---|---|
| peroneal nerve + L5 root | first dorsal web-space sensory loss |
| L5 root + sacral plexus | **absent ankle jerk** |

Comparing the whole list buries the second. A subset's discriminators are always a SUBSET of the whole
list's — anything that fails to split the whole list fails to split any part of it — so the value is in
the REORDERING, not in new findings appearing.

**TWO CONTROLS, TWO CLAIMS, deliberately not merged.** The 📌 pin says "both of these are real lesions"
(the Together card); the compare checkbox says "only one is real, help me choose". Opposite claims, so
they cannot share a control — the same reason `selectedEntity` and `selectedPathology` are separate
fields. `cmp=` round-trips separately from `p=`, and an EMPTY `cmp` is meaningful (the reader cleared the
comparison) so it encodes as empty rather than reverting to the default pair.

**DELETED:** `app/neuraxis-diagram.js`, `app/neuraxis-figure.js`, their two suites, `app/plates.js`, the
four validated public-domain plates and `tools/trace` — about 1500 lines, in git history if the regional
views are ever revisited.

**A STANDING GAP CLOSED: `app.js` IS DOM-BOUND, SO NO SUITE IMPORTS IT AND A SYNTAX ERROR SHIPPED
SILENTLY.** It happened twice in one change (a duplicate `const sideTag`, an orphaned brace left by a
deletion) with the full suite green through both. `test/app-smoke.test.js` now parse-checks every
`app/*.js`, verified by deliberately breaking a file. Two further bugs the browser caught and no test
could: a `<label>` wrapping an `<input>` makes a delegated CLICK handler fire twice, so each toggle
cancelled itself out (handled on `change`); and the event wiring is a different scope from `list`, so the
handler threw `ReferenceError` silently on every toggle (`compareSet` now takes ids, not candidates).

72 suites / 6631 assertions green.

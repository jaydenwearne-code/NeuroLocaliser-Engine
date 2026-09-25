# Accuracy round 1 — design (2026-09-25)

**Status: APPROVED (owner, 2026-09-25) — §4B rulings recorded inline. Ready for the implementation plan.**
Branch: `feat/accuracy-round-1` (off `main` at `c184fdc`).

This is sub-project 1 of 3 from the 2026-09-25 request ("interrogate the engine for accuracy with all
possible finding combinations"). Sub-project 2 (the integrated Why) follows this one with its own spec.
Sub-project 3 (ED-friendly UI) is **parked** by the owner pending a wider look at options.

---

## 1. How the engine was interrogated

Measurement only, all in a scratch directory, no code changed:

| Sweep | What it asks | Result |
|---|---|---|
| Self-localisation | Enter a site's COMPLETE predicted picture — does `solve()` return that site? | 364/364 non-empty sites are in `explainAll`. **No site is unreachable.** 38 are not ranked first; most are genuine ties (left/right mirrors of non-lateralised findings, indistinguishable pairs like middle trunk = C7 root) |
| Clinical vignettes | 84 textbook + ED presentations, entered as a clinician would, against the answer a clinician expects | **70/84 correct first.** The 14 failures are §2 |
| Single findings | Every one of the 233 findings entered alone, on every side the UI offers | **11 findings return ZERO candidates** on one side, and the app then says the picture "may be non-organic" |
| Phonebook vs model | Does the site's own description name a feature the model does not predict? | 39 site kinds flagged; after removing negations and correct omissions, ~15 genuine gaps — the same ones the vignettes found |
| Crossing | For every tract, does each structure's crossing agree with where the tract decussates? | **Clean.** Two flags, both artefacts of the coarse checker (the facial corticobulbar decussation is at the facial nucleus; the MLF is ipsilateral to the INO at every level) |
| Advice | Urgency + top causes for 25 emergency sites | Clinically sound, with three exceptions (§2.5) |

## 2. What is wrong

### 2.1 Classic single-lesion pictures produce a false TWO-LESION claim

The site omits one of its own cardinal features, so the complete textbook picture fails "explains all" and
`minimalSet()` assembles a second lesion. **This is the most serious class**: the app tells a clinician a
patient with one lesion has two.

| Entered | Engine says | Missing from the site |
|---|---|---|
| Cord compression with urinary retention | "Likely multifocal — cord + conus" | No bilateral cord site predicts sphincter dysfunction (its own phonebook note says it should) |
| Complete MCA stroke with hemianopia (either hemisphere) | "Likely multifocal — MCA + anterior choroidal" | MCA predicts both quadrantanopias, never `homonymous_hemianopia` |
| Posterior-canal BPPV: vertigo + positive Dix-Hallpike | "Multifocal — canal + labyrinth" | The three canal sites do not predict vertigo |
| Labyrinthitis: vertigo + hearing loss + peripheral HINTS | "Labyrinth + CPA" | The labyrinth does not predict hearing loss |
| Length-dependent neuropathy with absent ankle jerks | No single lesion | No reflex loss, though its note says "distal areflexia" |
| Broca / Wernicke with anomia | No single lesion | Aphasia sites do not predict `naming_impaired`, though `score.js` says it is "in every aphasia" |
| ACA stroke with incontinence | No single lesion | The paracentral lobule is not in the ACA composite |
| Percheron: drowsy + vertical gaze palsy + amnesia | No single lesion | Amnesia (its note names "memory") |
| Cauda equina with absent ankle jerks | Cauda does not explain the reflexes | No reflex loss, though its note says "areflexic" |
| B12 SCD with absent ankle jerks | Friedreich's ataxia ranked first | SCD does not predict ankle-jerk loss (its note says "may be lost") |

### 2.2 Findings that dead-end on one side (and falsely suggest non-organic)

Entered on one side, these return **no candidates**: `fasciculations`, `lmn_weakness`, `hypotonia`,
`proximal_weakness`, `fatigable_weakness`, `fatigable_ocular`, `facilitating_weakness`,
`autonomic_features`, `distal_sensory_loss`, `distal_motor_weakness`, `suspended_sensory`.

Cause: only BILATERAL systemic sites produce them, and `knownNegatives()` treats the un-entered side as
examined-and-normal, which excludes every producer. The empty state then reads *"…or this may be
non-organic"*. Consequence in practice: **unilateral fatigable ptosis (ocular myasthenia) puts carotid
dissection first and excludes myasthenia**.

### 2.3 Common ED pictures that rank wrong

| Entered | Ranks first | Why |
|---|---|---|
| Isolated facial weakness (Bell's) | Contralateral motor cortex | No way to record "forehead also weak"; cortex wins on prevalence |
| Pure sensory stroke — face, arm and leg | Lateral midbrain; thalamus is not even a full match | `subcortex|thalamus` lacks face sensation, though its note says "face, arm and leg" |
| AICA stroke — vertigo, deafness, facial palsy, facial + crossed body pain loss | Lateral medulla | The lateral pons lacks facial palsy, deafness and facial pain loss (its note flags deafness) |
| Guillain–Barré — symmetric LMN weakness + areflexia | Friedreich's ataxia | No acute polyradiculoneuropathy site exists |
| Hemisensory loss, or thalamic pain | "Sensorimotor stroke" | Prevalence outranks tightness: a common site predicting 7 unreported findings beats an exact fit |

### 2.4 The ranking rule

`differential()` sorts `n` (coverage) → **prevalence** → over-prediction. So a common site that
predicts many findings the patient does not have beats an uncommon site that predicts exactly what was
entered. Measured alternative ("tightness overrides prevalence only when the gap is ≥ 3 unreported
predictions"): **fixes 2 of the 84 vignettes and 8 complete-site pictures, and breaks none.**

### 2.5 Advice layer

1. **The commonest stroke subtype is demoted at hyperacute onset.** `Small-vessel lacunar infarct` is
   tagged `["acute"]` at the internal capsule (`causes.js:2585`) while the same cause is
   `["hyperacute","acute"]` at two other sites (`:532`, `:2600`). Entering hyperacute onset moves it to
   the demoted band. Same for `Small precentral (hand-knob) infarct` (`:2681`) and the capsular
   hypertensive haemorrhage.
2. **Stroke sites badge "urgent" at hyperacute onset** (thrombolysis window) — nextStepsFor() takes no
   onset at all.
3. **Prevalence contradicts itself for polyneuropathy**: `COMMON_LEVELS` lists it, but the earlier
   `side === "bilateral" → RARE` rule fires first, so the commonest neurological condition ranks RARE.
   The listing is dead code.

Noted and deliberately NOT changed: 40 site kinds badge *routine* while listing a red cause (mostly
"vasculitic mononeuritis multiplex" under every nerve). A blanket red floor would badge carpal tunnel
urgent — the cry-wolf outcome the 2026-08-18 ruling exists to prevent.

---

## 3. Owner rulings already made (2026-09-25)

1. **Sequence**: accuracy (this spec) → integrated Why → UI later, after more options.
2. **Vocabulary stays STRICT.** No implication table: generic words (`weak_leg`) do not match specific
   predictions (myotomes). "C8/ulnar are reachable by putting in the correct findings." Consequence
   carried into this spec: MCA is fixed by predicting `homonymous_hemianopia` itself; GBS vignettes use
   LMN tokens. *Parked for the UI round:* `weak_leg`/`weak_arm` mean pyramidal weakness to the engine
   and the label should say so.
3. **Asymmetry**: the motor-unit sites (MG, LEMS, anterior horn, myopathy) accept one-sided
   presentations. Polyneuropathy, SCD and Friedreich stay symmetric-by-definition, and the panel offers
   only "both sides" for findings only symmetric sites produce.
4. **Cauda equina**: predicts absent ankle jerks on both sides AND tolerates asymmetry.
5. **In scope**: a "forehead also weak" finding; a Guillain–Barré site; tighter-fit ranking; stroke
   urgency at hyperacute onset.
6. **§4B open items (ruled the same day):** B1 central cord gets no sphincter — agreed. B2 — the owner
   asked "why not?" of excluding the MCA inferior division, and there is no good reason: the inferior
   division already predicts BOTH quadrantanopias on one side, and Wernicke + hemianopia (its classic
   picture) currently yields a false two-lesion claim. **Included.** B7 ankle jerks only. B10 SMA joins
   the ACA composite. B12 Horner's joins the AICA picture. B14 GBS predicts no sensory loss. B16 the
   hyperacute escalation applies even when a vascular cause is selected.

---

## 4. Changes

### 4A. Mechanisms (engine / app — no clinical claim beyond the rulings above)

**A1. Asymmetry-tolerant sites.** A site flag `asymmetric: true`, set by `composeMotorUnitSites()` (all
four) and `composeCaudaConusSites()` (cauda only — conus is symmetric by its own description).
`differential()` and `ruledOutSites()` skip the known-negative exclusion for such sites. Nothing else
changes: an asymmetric site still predicts both sides, so the un-entered side counts as an ordinary
over-prediction (a ranking cost, not an exclusion).

**A2. Structure emission override.** An optional `emit: "midline" | "bilateral"` on a structure, honoured
by `forward.expectedFindings()` and `forward.explain()`:
- `"midline"` — emit `@midline` whatever the site's side. For sphincter dysfunction at the bilateral
  cord sites, so it matches the same token cauda/conus already emit.
- `"bilateral"` — emit `@left` and `@right` from a midline site. For the cauda reflexes, so they match
  what a clinician enters ("absent ankle jerk, right").

**A3. Tighter-fit ranking.** The `differential()` comparator becomes: coverage `n` → **if the two
sites' over-prediction differs by ≥ `TIGHT_FIT_BAND` (3), the tighter one** → prevalence → over-prediction
→ id. `minimalSet()` and `display` inherit it. The band is a named constant with the measurement in its
comment.

**A4. Onset-aware stroke urgency.** `nextStepsFor(site, { onset })`: when `onset === "hyperacute"`, the
site's compartment is CNS (`brain`, `brainstem`, `cerebellum`, `cord`, `optic`), and the first
concordant non-mimic cause at that onset is `vascular` → urgency `emergency`. Otherwise unchanged, and
with no `onset` the return value is byte-identical to today (the existing guarantee). The app passes
`S.onset` to the header pill and the Next card. Measured reach: 21 site kinds escalate
(internal capsule, thalamic VL, striatum, subthalamic, optic tract, LGN, chiasm/apoplexy, flocculonodular
cerebellum, ACA/MCA branch cortex, corpus callosum, cord lateral, lateral hypothalamus, pons trigeminal…).
Excluded by the CNS rule: peripheral vestibular (a peripheral HINTS pattern is the reassuring one), the
IAM, microvascular CN III, lumbar plexus. When a cause is selected, an authored pathology urgency still wins **unless** the selected cause is
vascular and onset is hyperacute (B16).

**A5. The panel never offers a dead side.** A new pure module `app/sides.js` owns the side-offer logic
now inlined in `app.js`: `offeredSides(findingId)` returns the buttons to show. For a finding whose every
producer is a symmetric bilateral site it returns a single **Both** option, which adds `@left` and
`@right` together. `app.js` consumes it; nothing else in the panel changes.

**A6. Prevalence ordering.** Explicit per-level rules run before the bilateral→RARE default, so
`polyneuropathy` is COMMON as `COMMON_LEVELS` already intends. (The new GBS level is listed RARE.)

### 4B. Clinical content — ⚠ FOR OWNER REVIEW

Each row is a clinical claim. Model rows follow the recipe (structure → site); every new structure gets a
row in `docs/artifacts/anatomy-model.html`. **All rulings recorded (2026-09-25).**

| # | Site(s) | Change | Audit case it fixes |
|---|---|---|---|
| B1 | Bilateral cord — anterior (ASA) and transverse | New structure: sphincter dysfunction, `emit:"midline"`, on a composite-only `cord|autonomic` part pulled in by `composeBilateralCordSites()` for anterior + transverse only. Hemicord and posterior cord do not get it. **Central cord: NO** (owner, agreed — sphincter involvement is late and inconsistent) | Cord compression + retention → "multifocal" |
| B2 | Complete MCA (`cortex_mca`) and MCA inferior division (`cortex_mca_inferior`) | Add the deep `optic_radiation` part to the composite's `deepParts` (as `internal_capsule` already is) → predicts homonymous hemianopia. **MCA inferior division: YES** (owner) — it already predicts both quadrantanopias; Wernicke + hemianopia is its classic picture and currently reads as two lesions. Superior division: no | Complete MCA + hemianopia → "multifocal" |
| B3 | Posterior, horizontal and anterior canal (BPPV) | Add vertigo (`cn8_vertigo`, ipsilateral) to each canal | BPPV → "multifocal" |
| B4 | Labyrinth | Add hearing loss (ipsilateral). Vestibular neuritis still matches (hearing becomes an unreported prediction, below the ranking band) | Labyrinthitis → "labyrinth + CPA" |
| B5 | Length-dependent polyneuropathy | Add absent ankle jerks (bilateral) | Neuropathy + areflexia → "no single lesion" |
| B6 | SCD | Add absent ankle jerks (bilateral). With A3, SCD then beats Friedreich's on tightness | SCD → Friedreich's first |
| B7 | Cauda equina | Add absent ankle jerks, `emit:"bilateral"`, asymmetric (ruling 4). **Knee jerks: NO** (owner — ankle only) | Cauda + absent ankle jerk |
| B8 | Percheron (bilateral paramedian thalamus) | Add amnesia (bilateral-only structure) | Percheron triad → "no single lesion" |
| B9 | Every aphasia site | Add a dominant-hemisphere `naming_impaired` structure to operculum (Broca), temporoparietal (Wernicke), arcuate (conduction), anterior + posterior watershed (transcortical), and the hand-listed global / mixed-transcortical / striatocapsular composites. Isolated anomia still ranks the angular gyrus first (tightest) | Broca/Wernicke + anomia → "no single lesion" |
| B10 | ACA composite | Add `paracentral` to the ACA `DIVISION` → urinary incontinence + gait apraxia. **SMA: YES** (owner) — also add `sma` to the ACA `DIVISION` → alien limb | ACA + incontinence → "no single lesion" |
| B11 | Thalamus — VPL (`subcortex|thalamus`) | Add contralateral facial sensory loss (VPM sits beside VPL; the pure-sensory lacune is face-arm-leg, as the site's own note says) | Pure sensory stroke → midbrain first |
| B12 | Lateral pons (AICA) | Add, all ipsilateral: LMN facial weakness (facial nucleus) + forehead also weak (B13); hearing loss (cochlear nuclei / labyrinthine artery); facial pain-temperature loss (spinal trigeminal nucleus, caudal pons). **Horner's: YES** (owner) — ipsilateral miosis + ptosis (descending sympathetic, lateral tegmentum). Inherited by the lateral-pons + trigeminal composite and the hemipons | AICA → lateral medulla first |
| B13 | New finding `forehead_involved` | "Forehead also weak — cannot raise the eyebrow or wrinkle the forehead". Ipsilateral, **LOCALISING** (the mirror of `forehead_spared`, which is). Produced by the facial fascicle (medial pons), the new facial nucleus (B12), IAM, CPA, geniculate, tympanic, mastoid, stylomastoid, and GBS (bilateral). Not the parotid (a single branch). Placed in the exam tree's VII group | Isolated facial weakness → cortex first |
| B14 | **New site: acute polyradiculoneuropathy (Guillain–Barré)** | `polyradiculoneuropathy_acute`, bilateral, **symmetric**, compartment `root`, RARE. Predicts: LMN weakness, proximal + distal weakness, absent biceps/brachioradialis/triceps/knee/ankle jerks, bilateral LMN facial weakness + forehead involved, dysphagia, weak diaphragm, autonomic features. **Sensory: NO** (owner) — no distal sensory loss predicted (GBS is motor-predominant). Full content to the existing gates: phonebook entry, ≥6 curated causes with features and a red must-not-miss (GBS/AIDP, AMAN, CIDP of acute onset, botulism, tick paralysis, hypokalaemic periodic paralysis, acute porphyria, infective polyradiculitis — CMV/HIV/Lyme, cord compression as mimic), a four-tier workup (serial FVC, bulbar and autonomic monitoring, NCS, LP, ICU referral threshold), pathology plans or aliases for every cause name, labels, compartment/topography/substrate rows | GBS picture → Friedreich's first |
| B15 | Cause tempo | Add `hyperacute` to: `Small-vessel lacunar infarct` at the internal capsule; `Small precentral (hand-knob) infarct`; the capsular `Hypertensive haemorrhage`. Brings them in line with the same causes at other sites | Lacunar stroke demoted at hyperacute onset |
| B16 | Pathology urgency | With hyperacute onset and a **vascular** cause selected, A4's escalation still applies (owner: YES) — the authored plan urgency no longer quietens a hyperacute stroke badge. A non-vascular selection keeps its authored urgency | Selecting the lacune could quieten a hyperacute badge |

### 4C. Tests (TDD — each written red first)

- **`test/clinical-vignettes.test.js`** — the 84-case battery as a permanent suite, with the cases
  corrected where the audit's own vignette was wrong (ulnar claw is a *wrist* sign — the ulnar paradox;
  AIN does not weaken thumb abduction; bitemporal hemianopia is entered as midline; Gerstmann is the
  `parietal` site; GBS uses LMN tokens under ruling 2). Each case asserts the expected site is **first**,
  or in the top k where the case is genuinely ambiguous (stated per case). Every single-lesion textbook
  case additionally asserts **no multifocal claim**.
- **`test/side-offers.test.js`** — for every finding and every option `offeredSides()` returns, `solve()`
  yields ≥ 1 candidate. This is the invariant that makes §2.2 impossible to reintroduce.
- **Self-localisation** — every non-empty site's full picture is in `explainAll` (true today; now pinned).
- Engine suites for A1–A4 and A6; existing suites stay green. Where an existing assertion encoded a
  now-fixed defect (e.g. an ordering that relied on prevalence beating tightness), the change is called
  out in the commit that makes it, not silently edited.

---

## 5. Out of scope, recorded

- **UI**: the parked sub-project 3 (first-glance simplicity, plain labels, `weak_leg` = pyramidal).
  A5 is the only panel change here, and it is a safety fix, not a redesign.
- **Usage counter** posts a row on every `localhost` open, so dev use counts as tester use. A one-line
  hostname guard would fix it — offered, not done.
- **13 candidate sites predict nothing** (non-dominant mirrors of dominant-only cortex, `cord|lateral`
  without a sensory level). Correct under the gating; harmless.
- **Isolated Babinski ranks the cortical hand knob first** — noted for the owner; not changed.

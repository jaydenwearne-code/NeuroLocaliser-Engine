# Trigeminal complex & trochlear nucleus — design spec

**Date:** 2026-07-18
**Region increment:** two brainstem coverage-audit gaps, one increment. (1) The **pontine trigeminal
complex** — the main (principal) sensory nucleus (facial *touch*) and the motor nucleus (V3 / jaw) — as a
dedicated site that also **unions into the lateral pontine (Marie-Foix / AICA) syndrome**. (2) The
**trochlear (CN IV) nucleus** in the dorsal midbrain, whose full decussation makes a *nuclear* lesion give a
**contralateral** superior oblique palsy, distinguished from a peripheral (ipsilateral) one. No new solver
mechanism — new findings, a union composer (skull-base nesting pattern), and a per-structure `crosses`
override (cord pattern).
**Status:** approved design, ready for implementation planning

## Context

Two gaps flagged in the coverage audit:

- **Trigeminal:** only the *spinal* trigeminal nucleus is modelled (`spinal_trig`, medulla·lateral →
  `face_pain_loss`, ipsilateral pain/temp — it rides Wallenberg). The **pontine** trigeminal nuclei are
  absent: the main/principal sensory nucleus (discriminative facial *touch*) and the motor nucleus (muscles
  of mastication — V3). Adding them yields the facial analogue of the cord's dorsal-column-vs-spinothalamic
  dissociation: facial **touch** → pons (main sensory nucleus); facial **pain/temp** → medulla (spinal
  nucleus).
- **Trochlear:** `cn4_palsy` exists but is produced only peripherally (`sof_cn4`, superior orbital fissure,
  ipsilateral, bundled with III/VI/V1). The **midbrain trochlear nucleus** is absent. CN IV is unique — it
  exits dorsally and **fully decussates**, so a *nuclear/fascicular* lesion produces a **contralateral**
  superior oblique palsy, a peripheral one an ipsilateral palsy. That is the whole teaching point and falls
  out of a per-structure `crosses: true` override (the mechanism the cord already uses for the CST/dorsal
  columns).

## Design decisions (settled during brainstorming)

1. **Trigeminal complex is its own site AND unions into the lateral pons.** A dedicated `pons_trigeminal`
   primitive site (isolated trigeminal syndrome), plus a **union composite** `pons_lateral ∪ pons_trigeminal`
   → the lateral pontine (Marie-Foix/AICA) syndrome *with* trigeminal involvement. Mirrors the skull-base
   `cavernous_sinus = SOF ∪ V2` nesting. (The nuclei genuinely sit in the dorsolateral pons / AICA
   territory.)
2. **Trochlear: nucleus (contralateral) + a lean peripheral nerve (ipsilateral).** So an *isolated* CN4
   palsy localises to the peripheral trochlear nerve (clinically correct — the commonest isolated SO palsy
   is traumatic/microvascular), while a **contralateral** SO palsy with dorsal-midbrain company localises to
   the nucleus. The nucleus site is a dorsal-midbrain-tegmentum lesion carrying a co-located **midbrain MLF**
   → ipsilateral **INO** (the MLF sits immediately adjacent to the trochlear fascicle), giving the clean
   lateralised discriminator *contralateral CN4 + ipsilateral INO*. The companion serves double duty (same
   pattern as the ARAS increment's `extensor_posturing`): on an isolated CN4 the nucleus over-predicts INO
   so the peripheral nerve wins **strictly** (not a fragile build-order tie), and the nucleus becomes
   reachable as a single winner when INO is present. Consequence (accepted): an **isolated INO** now has a
   lean home at this dorsal-midbrain site (there is no lean *pontine* INO site — `mlf_pons` is bundled in the
   medial-pons cluster and over-predicts), and the rostral MLF is genuinely midbrain, so the site is named
   for the dorsal-midbrain tegmentum, not narrowly "trochlear".
3. **One increment, two test suites** (`trigeminal.test.js`, `trochlear.test.js`).

## The findings (`findings.js`)

Three new findings, all LOCALISING:

| Finding | Meaning | Crossing |
|---------|---------|----------|
| `face_touch_loss` | discriminative facial *touch* loss — principal/main sensory nucleus (pons) | ipsilateral (`crosses:false`) |
| `jaw_weakness` | jaw weakness / deviation *toward* the weak side + masseter wasting — motor nucleus V (V3, LMN) | ipsilateral (`crosses:false`) |

(`cn4_palsy` already exists — it gets a new *contralateral* producer via a structure-level override; no new
finding. Corneal reflex stays folded into `v1_sensory` — no new finding, YAGNI.)

Edits: add the two to `FINDINGS` (group "Cranial nerve" / "Long tract" for the sensory one — match the
existing trigeminal findings), to `CROSSES` (both `false`), and to `LOCALISING` in `score.js`.

## Anatomical homes (`structures.js`, `sites.js`)

### Trigeminal (pons)

**Structures** (new pons part `trigeminal`, **added to `PARTS`** so `buildSites` makes the site):
- `trig_main_sensory` — level `pons`, part `trigeminal`, produces `face_touch_loss`
  (note: principal/main sensory nucleus — discriminative facial touch; ipsilateral).
- `trig_motor` — level `pons`, part `trigeminal`, produces `jaw_weakness`
  (note: motor nucleus V — muscles of mastication; jaw deviates to the weak side; ipsilateral).

**Sites:**
- `left/right_pons_trigeminal` — via `buildSites` (part `trigeminal` in `PARTS`) — the **dedicated
  trigeminal complex** site. `TERRITORY["pons|trigeminal"]` added.
- `left/right_pons_lateral_trigeminal` — via a new composer **`composeLateralPontineTrigeminalSites()`**:
  per side, `structures = (pons·lateral) ∪ (pons·trigeminal)`, `composite: true`. The lateral pontine
  (Marie-Foix) syndrome *with* trigeminal involvement. Registered in `inverse.candidateSites()`.
  `TERRITORY["pons|lateral_trigeminal"]` (or reuse the lateral pons territory string) added.

Note: `pons` is a `HEMI_LEVEL`, so the existing `composeHemiLevelSites` now also unions the `trigeminal`
part into the pons-hemi composite (a whole-hemipons lesion includes the trigeminal nuclei) — benign, and
existing brainstem tests assert the *winner*, not the hemi composite's exact finding set.

### Trochlear (midbrain nucleus + peripheral nerve)

**Structures:**
- `cn4_nucleus` — level `midbrain`, part `trochlear` (**composer-only** — `trochlear` NOT added to `PARTS`,
  so `buildSites` does not build it and it is NOT pulled into the midbrain-hemi composite), produces
  `cn4_palsy`, **`crosses: true`** (contralateral — CN IV decussates).
- `mlf_midbrain` — level `midbrain`, part `trochlear`, produces `ino`, `crosses: false` (ipsilateral — the
  rostral MLF immediately adjacent to the trochlear fascicle; the co-located companion).
- `cn4_nerve` — level `skull_base`, part `trochlear_cisternal` (**added to `PARTS`**), produces `cn4_palsy`
  (default `crosses:false` → ipsilateral). The long cisternal course (trauma/microvascular).

**Sites:**
- `left/right_midbrain_trochlear` — via a new composer **`composeTrochlearNucleusSites()`** (lateralised,
  side left/right; the composer-only part means it is not a `buildSites` site and stays out of the
  midbrain-hemi composite). Emits `cn4_palsy@contra` + `ino@ipsi`. `TERRITORY["midbrain|trochlear"]`.
  Registered in `inverse.candidateSites()`.
- `left/right_skull_base_trochlear_cisternal` — via `buildSites` (part in `PARTS`) — the lean peripheral
  trochlear nerve. `TERRITORY["skull_base|trochlear_cisternal"]`.

**Why the peripheral nerve wins an isolated CN4 (strictly, not by tie-break):** an isolated `cn4_palsy@right`
is explained by the ipsilateral peripheral site (`right` cisternal, lean → score 3, zero over-prediction)
and by the contralateral nucleus (`left` nucleus → matches `cn4_palsy@right` but **over-predicts** its
`ino@left` companion → score 2.5). So the peripheral site wins **strictly** — no reliance on build order.
The nucleus wins only when its `ino` companion is also present (which the peripheral site cannot explain).

## Scoring (`score.js`)

`LOCALISING`: **add** `face_touch_loss` and `jaw_weakness`. (`cn4_palsy` and `horner` are already LOCALISING.)

## Emergent behaviour (what the tests assert)

**Trigeminal:**
1. **Forward dissociation:** `left_pons_trigeminal` → `face_touch_loss@left` + `jaw_weakness@left`, and does
   NOT emit `face_pain_loss` (that stays the medullary spinal nucleus). The medulla `spinal_trig` still →
   `face_pain_loss` — touch=pons, pain/temp=medulla.
2. **Isolated trigeminal:** `{face_touch_loss@left, jaw_weakness@left}` → `left_pons_trigeminal`.
3. **Union:** a left lateral-pontine + trigeminal picture
   `{spinothalamic@right, limb_ataxia@left, cn8_vertigo@left, face_touch_loss@left, jaw_weakness@left}` →
   `left_pons_lateral_trigeminal` (the union explains all; bare `pons_lateral` misses the trigeminal
   findings, bare `pons_trigeminal` misses the lateral findings).

**Trochlear:**
4. **Forward crossing (the teaching point):** `left_midbrain_trochlear` → `cn4_palsy@right` (contralateral)
   + `ino@left` (ipsilateral); the peripheral `right_skull_base_trochlear_cisternal` → `cn4_palsy@right`
   (ipsilateral).
5. **Isolated CN4 → peripheral:** `{cn4_palsy@right}` → `right_skull_base_trochlear_cisternal`
   (the clinically-common isolated SO palsy; the nucleus over-predicts `ino`, so the peripheral site wins
   strictly).
6. **Nuclear emergence:** `{cn4_palsy@right, ino@left}` → `left_midbrain_trochlear` (contralateral SO
   palsy + ipsilateral INO = dorsal-midbrain nuclear/fascicular; the single site explains both).

## Emergent naming (`syndromes.js` — phonebook)

All four sites are named via the `level_part` key (`nameForSite` falls back to `${level}_${part}` — the
`buildSites` sites are side-prefixed ids, and the two composites are given side-prefixed ids with a
side-agnostic `level`/`part`, so both resolve through `level_part`; the eponyms are side-agnostic).

| `level_part` key | site `level`/`part` | Named | note / ddx |
|------------------|---------------------|-------|-----------|
| `pons_trigeminal` | `pons`/`trigeminal` | Trigeminal complex (pontine) — main sensory + motor V | isolated facial touch loss + jaw weakness; ddx trigeminal schwannoma, focal pontine lesion, MS |
| `pons_lateral_trigeminal` | `pons`/`lateral_trigeminal` | Lateral pontine syndrome (Marie-Foix) with trigeminal (V) involvement | AICA territory reaching the trigeminal nuclei |
| `skull_base_trochlear_cisternal` | `skull_base`/`trochlear_cisternal` | Trochlear (CN IV) nerve palsy — ipsilateral superior oblique | isolated SO palsy: trauma (long cisternal course), microvascular, congenital |
| `midbrain_trochlear` | `midbrain`/`trochlear` | Dorsal-midbrain (trochlear / MLF) syndrome — contralateral superior oblique palsy ± ipsilateral INO | dorsal-midbrain lesion (infarct, demyelination, tumour); the crossed SO palsy (and/or INO) is the localiser |

## Tests

Two new suites, TDD red-first, added to `npm test` (`package.json`) + the README list:
- **`test/trigeminal.test.js`** — vocabulary; forward dissociation (touch=pons, pain/temp=medulla);
  isolated trigeminal → `pons_trigeminal`; union → `pons_lateral_trigeminal`; names.
- **`test/trochlear.test.js`** — vocabulary (cn4 has a contralateral producer); forward crossing (nucleus
  contra CN4 + ipsi INO, peripheral ipsi CN4); isolated CN4 → peripheral; nuclear (cn4 contra + ino ipsi) →
  nucleus; isolated INO → the dorsal-midbrain site (documented); names.

**Regression watch (explicit):** all prior suites green. In particular:
- **INO-bearing tests (engine/cranial-nerves/nystagmus)** — the trochlear nucleus adds a new `ino` producer
  at the midbrain. Verify the pontine INO syndromes (one-and-a-half, Foville) are unchanged: their inputs
  carry `ino` *with* gaze/other pontine signs, so the pontine site explains more and the midbrain nucleus
  (which over-predicts `cn4_palsy` and misses the gaze signs) loses. The only new behaviour is that an
  *isolated* `ino` now localises to the dorsal-midbrain site (previously no lean INO site existed) — confirm
  no existing test asserted a different isolated-INO result.
- **Cranial-nerves suite** — the SOF `cn4` cluster is unchanged (the SOF composite explains its whole
  ipsilateral orbital cluster; the lean cisternal site explains only `cn4` and loses).
- **Engine/brainstem suite** — the pons-hemi and midbrain-hemi composites: pons-hemi now also carries the
  trigeminal findings (winner-only assertions unaffected); the trochlear nucleus is composer-only so the
  midbrain-hemi composite is untouched.
If any assertion shifts, surface it — don't silently patch.

## What this increment does NOT do (YAGNI / deferred)

- **No trigeminal onion-skin (Dejerine) somatotopy** — the rostro-caudal perioral-vs-peripheral gradient of
  the spinal nucleus is not modelled.
- **No separate corneal-reflex finding** — corneal afferent stays folded into `v1_sensory`.
- **No trigeminal neuralgia / autonomic (SUNCT) phenomena** — these are pathologies, not localisers.
- **No superior-oblique-specific diplopia geometry** (Parks-Bielschowsky head tilt) — `cn4_palsy` is the
  finding; the 3-step test is bedside disambiguation, not localisation.
- **No trochlear fascicle as a separate site** — the nucleus structure (contralateral) covers the
  pre-decussation nuclear/fascicular case; the cisternal nerve covers post-decussation/peripheral.

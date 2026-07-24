# Pupillary efferent (parasympathetic) — design spec

**Date:** 2026-07-13
**Region increment:** the parasympathetic light-reflex efferent limb — the pupil-involving-vs-sparing CN
III distinction (compressive/aneurysm vs ischaemic), the Adie tonic pupil (ciliary ganglion), and
Argyll Robertson light-near dissociation (pretectum).
**Status:** approved design, ready for implementation planning
**Sub-project 2 of 3** (visual pathway → **pupillary efferent** → sympathetic/Horner axis).

## Context

CN III is currently one lumped `cn3_palsy` finding ("± pupil") at the midbrain fascicle (Weber) and the
SOF/cavernous sinus. The pupil is not modelled. Because the parasympathetic light-reflex fibres run on
the **surface** of CN III, the pupil is the localiser: a **compressive** lesion (PCOM aneurysm, uncal
herniation) squeezes the surface first → **pupil-involving** (surgical emergency); an **ischaemic**
microvascular lesion spares the surface → **pupil-sparing** (medical). This increment models the pupil so
that distinction — plus Adie and Argyll Robertson — **emerges** from which findings a site produces (the
nerve-segment sparing pattern). **No new solver mechanism**; an all-new `pupil` level, so **no changes to
existing structures** and (expected) **zero existing-test changes**.

## Decisions (settled with the user)

1. **Model compressive vs ischaemic CN III as two sites**, distinguished by `fixed_dilated_pupil`.
2. **Include Argyll Robertson** (pretectum, bilateral) this increment.
3. **Pain is NOT a discriminator** — diabetic (ischaemic) CN III is often painful too, so pain doesn't
   separate aneurysm from microvascular; the pupil does. No pain finding added.
4. **No generic miosis/mydriasis findings** — `fixed_dilated_pupil` carries the efferent-defect dilation;
   Horner's miosis is sub-project 3.
5. **No new solver mechanism** — new `pupil` level (`cn3_compressive`/`cn3_ischaemic`/`ciliary_ganglion`
   via `buildSites`; `pretectum` bilateral via a small composer), findings/structures/`LOCALISING`,
   phonebook. Existing CN III structures (midbrain fascicle, SOF) untouched — the pupil-involving-vs-
   sparing distinction is modelled on the subarachnoid trunk, the classic exam locus.

## Findings vocabulary (`src/model/findings.js`) — 2 new

| Finding | CROSSES | LOCALISING | Role |
|---|---|---|---|
| `fixed_dilated_pupil` | false (ipsi — the affected eye) | **yes** | efferent parasympathetic defect ("blown" pupil) |
| `light_near_dissociation` | false | **yes** | reacts to near, not light — Adie + Argyll Robertson |

Neither is `NON_LATERALISED`. Reuse `cn3_palsy` (exists).

## Sites & structures — a new `pupil` level

| site | side | structures (`produces`) |
|---|---|---|
| `pupil / cn3_compressive` (PCOM aneurysm, uncal) | L/R | `cmp_cn3` (`cn3_palsy`) + `cmp_pupil` (`fixed_dilated_pupil`) |
| `pupil / cn3_ischaemic` (microvascular/diabetic) | L/R | `isch_cn3` (`cn3_palsy`) — **pupil-sparing** |
| `pupil / ciliary_ganglion` (Adie) | L/R | `cg_pupil` (`fixed_dilated_pupil`) + `cg_lnd` (`light_near_dissociation`) — **no** `cn3_palsy` |
| `pupil / pretectum` (Argyll Robertson) | **bilateral** (composer) | `ar_lnd` (`light_near_dissociation`) — **no** fixed dilated |

Registration (`sites.js`): `LEVELS += "pupil"`; `PARTS += "cn3_compressive", "cn3_ischaemic",
"ciliary_ganglion"` (NOT `pretectum` — built only by the composer, like `chiasm`/cord `central`);
`TERRITORY += ` the four labels; `composePupilPretectumSites()` (a single `side:"bilateral"` site, like
`composePolyneuropathySites`) added to `inverse.candidateSites()`.

## Scoring (`src/engine/score.js`)

Add `fixed_dilated_pupil`, `light_near_dissociation` to `LOCALISING`. No scoring-code change.

## Emergent discrimination (what the tests prove)

| Findings | Localises to |
|---|---|
| `cn3_palsy` + `fixed_dilated_pupil` | **compressive** CN III (PCOM aneurysm — emergency) |
| `cn3_palsy` alone (pupil-sparing) | **ischaemic** CN III (microvascular) |
| `fixed_dilated_pupil` + `light_near_dissociation`, unilateral, no CN III palsy | **Adie** (ciliary ganglion) |
| `light_near_dissociation`, **bilateral**, no fixed dilated | **Argyll Robertson** (pretectum) |

(All emerge from the scorer: the pupil-sparing site emits only `cn3_palsy`, so a bare CN III palsy fits it
exactly while the compressive site over-predicts the pupil; a bilateral light-near dissociation fits the
pretectum while Adie leaves the other side unexplained; etc.) Weber and the SOF/cavernous/orbital-apex
pictures are unaffected — they carry accompanying findings the bare pupil sites cannot explain.

## Phonebook (`src/data/syndromes.js`)

- `pupil_cn3_compressive` → "Compressive (pupil-involving) CN III palsy — PCOM aneurysm / uncal
  herniation" (red flag: a fixed dilated pupil with a CN III palsy is a **surgical emergency** — image the
  vessels).
- `pupil_cn3_ischaemic` → "Ischaemic (pupil-sparing) CN III palsy — microvascular (diabetes/hypertension)"
  (red flag: pupil-sparing is reassuring, but new-onset needs vascular risk review; recheck the pupil).
- `pupil_ciliary_ganglion` → "Adie (tonic) pupil — ciliary ganglion (dilated, light-near dissociation,
  ± absent reflexes = Holmes-Adie)".
- `pupil_pretectum` → "Argyll Robertson pupils — small, bilateral, light-near dissociation (neurosyphilis /
  dorsal midbrain)".

## Testing — new `test/pupil-efferent.test.js`

1. **Vocabulary** — the 2 findings exist; `CROSSES:false`; both in `LOCALISING`; neither `NON_LATERALISED`.
2. **Sites/structures** — `left/right_pupil_cn3_compressive`, `_cn3_ischaemic`, `_ciliary_ganglion` exist;
   the pretectum bilateral site exists via the composer (`side:"bilateral"`); structure-set spot-checks
   (compressive has the pupil, ischaemic does NOT, Adie has no `cn3_palsy`, pretectum has no fixed dilated).
3. **Forward** — cn3_compressive → `cn3_palsy@left` + `fixed_dilated_pupil@left`; cn3_ischaemic →
   `cn3_palsy@left` and **NOT** `fixed_dilated_pupil`; ciliary_ganglion → `fixed_dilated_pupil@left` +
   `light_near_dissociation@left`; pretectum → `light_near_dissociation@left` **and** `@right` (bilateral).
4. **Discriminators** (via `solve`) — compressive; ischaemic (pupil-sparing); Adie; Argyll Robertson;
   plus a guard that a Weber picture (`cn3_palsy` + `hemiparesis`) still localises to the midbrain (the
   bare pupil sites don't steal it).
5. **Phonebook** — compressive names aneurysm/emergency/compressive; ischaemic names microvascular; Adie
   names Adie/tonic; pretectum names Argyll Robertson.
6. **Regression** — all 15 prior suites green (expected: no existing-test changes, since this is an
   all-new level with all-new findings).

## Out of scope (deferred)

- Sympathetic / **Horner** 3-order localisation + anhidrosis — sub-project 3.
- Pupil-involving detail at the midbrain fascicle / cavernous CN III (kept simple; the subarachnoid trunk
  carries the exam distinction).
- RAPD interplay (afferent, done in sub-project 1); the swinging-flashlight mechanics; pharmacological
  testing (cocaine/apraclonidine/pilocarpine); relative pupil size grading.

## Verification

`PATH=… npm test` — new `pupil-efferent.test.js` green and all 15 prior suites green (expected untouched).
Artifact sync stays deferred. Not a medical device; anatomy tables still need neuroanatomist review.

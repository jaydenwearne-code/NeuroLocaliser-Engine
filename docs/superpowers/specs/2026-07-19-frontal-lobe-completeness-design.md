# Frontal lobe completeness — premotor / SMA / paracentral / gait — design spec

**Date:** 2026-07-19
**Region increment:** fill the frontal-lobe map so every functional region is present by gyrus/area. The
prefrontal trio (DLPFC → executive dysfunction, medial PFC / ACC → abulia, orbitofrontal → disinhibition),
primary motor, Broca, and the frontal eye field already exist. This adds the four gaps: **premotor cortex**
(limb apraxia), **supplementary motor area** (SMA syndrome / alien limb), the **paracentral / superomedial
frontal** micturition centre (cortical urinary incontinence), and **frontal gait apraxia**. Pure
anatomy-table extension; no new solver mechanism.
**Status:** approved (scope confirmed — all four), ready for implementation

## Context — the frontal map before/after

| Region (gyrus/area) | Sign | Status |
|---|---|---|
| Primary motor (precentral, M1) | contralateral weakness | ✓ `motor_facearm`/`motor_leg` |
| Broca's area (post. IFG / operculum) | aphasia features | ✓ |
| Frontal eye field | `gaze_deviation` | ✓ |
| DLPFC | `executive_dysfunction` | ✓ |
| Medial PFC / anterior cingulate | `abulia` (+ grasp) | ✓ |
| Orbitofrontal | `disinhibition` (+ palmomental) | ✓ |
| **Premotor cortex** | **limb apraxia** | **NEW** |
| **Supplementary motor area (SMA)** | **SMA syndrome (alien limb)** | **NEW** |
| **Paracentral / superomedial frontal** | **cortical urinary incontinence** | **NEW** |
| **Frontal / parasagittal** | **gait apraxia** | **NEW** |

## Design decisions

1. **Standalone frontal-region sites** — the four new subregions are added to `PARTS` but kept **out of the
   `DIVISION` map** (like the aphasia language parts), so they localise on their own and do not churn the
   MCA/ACA vascular composites (and their exact-set tests). `TERRITORY` strings still record the vascular
   home (premotor = MCA superior; SMA / paracentral = ACA) informationally.
2. **Urinary incontinence and gait apraxia co-locate at the paracentral / superomedial frontal site** — they
   co-occur in the parasagittal / NPH picture; a lesion there emits both.
3. All four findings are **NON_LATERALISED** (`@none`) — apraxia, alien limb, incontinence and gait are not
   left/right body-side deficits — **LOCALISING**, and **not** hemisphere-gated (these are not dominant-only
   language functions).

## The findings (`findings.js`)

Four new, all `@none` (NON_LATERALISED), `CROSSES:false`, LOCALISING:

| Finding | Meaning |
|---------|---------|
| `limb_apraxia` | impaired skilled / learned movement not explained by weakness (premotor / motor-planning) |
| `alien_limb` | alien-hand phenomenon — involuntary grasping / groping, feeling of non-ownership (SMA / medial frontal) |
| `urinary_incontinence` | cortical (upper-motor) urinary incontinence — loss of cortical bladder inhibition (superomedial frontal / paracentral) |
| `gait_apraxia` | frontal (magnetic / ignition-failure) gait — cannot organise the gait sequence despite normal power |

(Distinct from the existing `sphincter_dysfunction`, which is the **LMN** cauda/conus bladder finding.)

## Anatomical homes (`structures.js`, `sites.js`)

**New `PARTS`:** `premotor`, `sma`, `paracentral` (added to the `PARTS` list; **not** to `DIVISION`).
`TERRITORY` entries: `cortex|premotor` (MCA superior), `cortex|sma` (ACA), `cortex|paracentral` (ACA).

**Structures (cortex, not hemisphere-gated):**
- `ctx_premotor` — part `premotor` → `limb_apraxia`.
- `ctx_sma` — part `sma` → `alien_limb`.
- `ctx_micturition` — part `paracentral` → `urinary_incontinence`.
- `ctx_gait` — part `paracentral` → `gait_apraxia`.

These form ordinary `buildSites` sites (`left/right_cortex_premotor`, `_sma`, `_paracentral`); the `@none`
findings emit `@none` on either side.

## Scoring (`score.js`)

`LOCALISING`: add `limb_apraxia`, `alien_limb`, `urinary_incontinence`, `gait_apraxia`.

## Emergent behaviour (tests — `test/frontal.test.js`)

1. `{limb_apraxia@none}` → `cortex_premotor` (premotor apraxia).
2. `{alien_limb@none}` → `cortex_sma` (SMA syndrome).
3. `{urinary_incontinence@none}` → `cortex_paracentral`.
4. `{gait_apraxia@none}` → `cortex_paracentral`.
5. `{urinary_incontinence@none, gait_apraxia@none}` → `cortex_paracentral` (the parasagittal / NPH-ish picture).
6. Vocabulary + forward: each site emits its finding(s) `@none`; the four findings are NON_LATERALISED +
   LOCALISING; and the pre-existing prefrontal signs still resolve (`executive_dysfunction` → DLPFC,
   `abulia` → medial PFC, `disinhibition` → orbitofrontal) — a regression check that the additions did not
   disturb them.

## Emergent naming (`syndromes.js` — phonebook, by `level_part`)

| key | Named | note |
|-----|-------|------|
| `cortex_premotor` | Premotor cortex — limb (motor) apraxia | impaired skilled movement / motor sequencing, power intact; MCA superior |
| `cortex_sma` | Supplementary motor area (SMA) syndrome | alien limb, akinesia / reduced spontaneous movement, transient reduced speech initiation (dominant); ACA / parasagittal |
| `cortex_paracentral` | Paracentral / superomedial frontal (bladder + gait) | cortical urinary incontinence ± frontal gait apraxia; the parasagittal / ACA picture (falx meningioma, ACA stroke, NPH) |

*(Also add — if not already present — `cortex_dlpfc` → dysexecutive syndrome, `cortex_medial_pfc` → abulia /
akinetic mutism, `cortex_orbitofrontal` → orbitofrontal disinhibition syndrome, so the whole prefrontal
convexity is named, not just newly added.)*

## Regression watch

Purely additive (four new findings with dedicated new sites; out of `DIVISION`), so no existing site or
composite changes. Confirm the DLPFC / medial-PFC / orbitofrontal single-finding resolutions are unchanged,
and the MCA/ACA vascular composites are byte-for-byte unchanged (the new parts are not in `DIVISION`). If any
assertion shifts, surface it.

## What this does NOT do (YAGNI / deferred)

- **No perseveration / utilisation behaviour / imitation behaviour as separate findings** — folded into
  `executive_dysfunction` (DLPFC).
- **No frontopolar (BA10) region** — abstract-reasoning / multitasking folded into DLPFC.
- **No anosmia / Foster-Kennedy** — an olfactory-groove / subfrontal skull-base picture, deferred.
- **No apraxia subtype axis** (ideomotor vs ideational vs limb-kinetic) or parietal apraxia — one
  `limb_apraxia` at the premotor region.
- **No `alien_limb` subtyping** (frontal vs callosal vs posterior) — one finding at the SMA / medial frontal.

# Parietal / temporal / occipital completeness — design spec (as-built)

**Date:** 2026-07-19
**Region increment:** the audit-and-fill applied to the remaining lobes (after the frontal one). Adds the
missing functional regions of the parietal, temporal and occipital lobes. Purely additive + one relocation;
no new solver mechanism (reuses `bilateralOnly` and hemisphere gating). All 28 suites green (1119 assertions).
**Status:** implemented.

## Gaps filled (by lobe)

**Parietal** (added to the existing `parietal` part, hemisphere-gated):
- `ideomotor_apraxia` (dominant supramarginal) — impaired gesture / tool pantomime.
- `dressing_apraxia` (non-dominant).

**Temporal** (new parts, `bilateralOnly` — the Anton/Balint pattern → `composeBilateralCortexSites`):
- `cortical_deafness` at new part `auditory` (bilateral primary auditory / Heschl) → `bilateral_auditory`.
- `kluver_bucy` at new part `anterior_temporal` (bilateral amygdala / anterior temporal) → `bilateral_anterior_temporal`.

**Ventral occipitotemporal — new `fusiform` part (the visual "what" stream):**
- `visual_agnosia` (`bilateralOnly`) and `achromatopsia` (`bilateralOnly`) → `bilateral_fusiform`.
- `alexia_without_agraphia` (**dominant** — the visual word form area + splenial disconnection; placed at
  the fusiform, not the occipital hemianopia site, so it is anatomically correct AND does not churn the
  occipital exact-set test).
- **Relocated `prosopagnosia`** from its old (simplified) `parietal` home to the fusiform (non-dominant) —
  the anatomically-correct fusiform face area.

## Findings

7 new, all `@none` (NON_LATERALISED), `CROSSES:false`, LOCALISING: `ideomotor_apraxia`, `dressing_apraxia`,
`cortical_deafness`, `kluver_bucy`, `visual_agnosia`, `achromatopsia`, `alexia_without_agraphia`.

## Sites & naming

- New parts `auditory`, `anterior_temporal`, `fusiform` added to `PARTS` (kept OUT of `DIVISION`, like the
  frontal/aphasia parts → no vascular-composite churn). TERRITORY strings added.
- The bilateral syndromes emerge via `composeBilateralCortexSites()` (id `bilateral_${part}`), keyed in the
  phonebook by exact id: `bilateral_auditory`, `bilateral_anterior_temporal`, `bilateral_fusiform`.
- The unilateral fusiform is a `{dominant, nondominant}` phonebook variant (cortex_fusiform): dominant =
  alexia without agraphia (VWFA), non-dominant = prosopagnosia — the same variant pattern `cortex_parietal`
  uses. Updated the `cortex_parietal` notes (dominant += ideomotor apraxia; non-dominant: prosopagnosia →
  dressing apraxia).

## Emergence (tests — `test/lobes.test.js`, 45 assertions)

`ideomotor_apraxia` → dominant parietal; `dressing_apraxia` → non-dominant parietal; `cortical_deafness` →
`bilateral_auditory`; `kluver_bucy` → `bilateral_anterior_temporal`; `visual_agnosia` / `achromatopsia` →
`bilateral_fusiform`; `alexia_without_agraphia` → dominant fusiform; `prosopagnosia` → non-dominant fusiform.
Regressions: `gerstmann` → dominant parietal, `neglect@left` → non-dominant parietal still hold.

## Notes / deferred

- `neglect` is a **lateralised** finding (`neglect@left` for a right lesion) — not `@none`; the other new
  cognitive findings are `@none`.
- Deferred: apraxia subtypes (ideational vs limb-kinetic), pure word deafness as a separate finding,
  palinopsia / akinetopsia, simultanagnosia as a standalone (folded in Balint), the auditory `where` stream.
- The pre-existing `cortex_operculum` phonebook entry is still a plain "Broca" entry (a non-dominant
  operculum names as Broca) — a minor pre-existing imperfection, not addressed here.

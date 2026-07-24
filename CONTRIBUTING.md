# Contributing & roadmap

This document explains **how to extend the engine** from the brainstem proof-of-concept to
the full neuraxis, without breaking the derive-don't-store architecture. Read `README.md`
first for the layer overview.

## The golden rule

**Never encode a syndrome as a rule.** Syndromes are recognised in `src/data/syndromes.js`
(a thin descriptive layer keyed by emergent location). Everything in `src/model/` and
`src/engine/` speaks only in structures, sites, findings and scores. If you find yourself
writing `if (hasX && hasY) return "someSyndrome"`, stop — that belongs as structures sharing a
site, not as a rule.

## How to add anything

The whole model is three declarative tables plus generic engine code. To extend coverage you
almost always edit only the tables:

1. **Add findings** to `src/model/findings.js` if the region needs new examinable outputs.
   Set the crossing status in `CROSSES` (does this finding appear ipsi- or contralateral to
   the lesion?). Mark it in `LOCALISING` (in `score.js`) if it strongly pins location.
2. **Add structures** to `src/model/structures.js`: each maps to exactly one finding, and is
   placed by level + part. One structure = one function = one finding.
3. **Add sites** — usually automatic. `sites.js` composes sites from structures by
   (level, part, side). For a new region you extend the `LEVELS`/`PARTS`/`TERRITORY` maps.
4. **Add eponyms** (optional) to `src/data/syndromes.js`, keyed by the emergent site.
5. **Add tests** to `test/` FIRST (see TDD note below): state observed findings, assert the
   site. A syndrome is "done" when its test passes with no rule written for it.

## Test-driven, always

Write the emergence test before the anatomy. Red (syndrome doesn't localise) → add the
structures/sites → green (it emerges). The existing `test/engine.test.js` is the template.
The test suite is the regression guard: every region you add must keep all prior tests green.

## Modelling notes that matter

- **Laterality is the crux.** Most localisation errors are crossing errors. For each finding,
  be explicit: has its pathway crossed *at or below* this level? Corticospinal crosses at the
  medullary pyramids, so a lesion above the decussation gives contralateral weakness; the
  spinal trigeminal tract is uncrossed, so ipsilateral facial signs. Get `CROSSES` right and
  most syndromes fall out for free.
- **Shared territory, not shared list.** Sites derive their contents from structures that
  happen to occupy the same level+part. The reason Wallenberg's six features co-occur is that
  those structures share the lateral-medullary (PICA) territory — model the territory, and the
  co-occurrence is automatic.
- **Partial lesions.** Real lesions are partial. The current POC treats a site as all-or-none.
  The planned extension (see below) is to let the solver match *subsets* of a site's structures,
  scoring partial fits — this is how you get "incomplete Wallenberg."

## Roadmap by region

Each region is the same skeleton: findings → structures → sites → eponyms → tests. Rough order,
easiest mechanism-fit first. Per-region designs + plans live in `docs/superpowers/specs|plans/`.

### Done (all suites green)
- **Brainstem** (the original POC) — 3 levels × 2 territories × 2 sides.
- **Spinal cord core four** — Brown-Séquard, anterior cord/ASA, posterior column/SCD, transverse
  myelopathy. Introduced two mechanisms: **per-structure `crosses` override** (corticospinal +
  dorsal columns are *ipsilateral* in the cord, opposite the brainstem) and **bilateral/midline
  sites** (a central lesion emits each finding on both body sides).
- **Sensory level** — the orthogonal dermatome axis (`model/levels.js` + `inverse.describeLevel`):
  it annotates *where along the cord* without changing which cross-sectional pattern wins.
- **Central cord / syringomyelia** — the suspended (cape-like) dissociated loss, from a commissural
  spinothalamic structure in a `central` cord part.
- **Cauda equina / conus medullaris** — the first region below the cord and first with new finding
  *types* (LMN/UMN/saddle/sphincter/radicular). Introduced **midline emission** (`side: "midline"`
  → `finding@midline`); CES vs conus split on a UMN-vs-LMN discriminator.
- **Cortex** (`docs/superpowers/specs/2026-07-12-cortex-mapping-design.md`) — the full lobar map
  (motor/sensory somatotopy, the dominant↔non-dominant mirror, frontal/temporal behavioural signs,
  visual-field defects, Anton/Balint). Introduced **somatotopy**, the **hemisphere gate**
  (`dominant`/`nondominant`, resolved by `solve({dominantSide})`, default left), **sideless `@none`
  emission**, and **bilateral-only** structures. `part` = cortical **subregion**; vascular territory
  is a *separate annotation* and ACA/MCA/PCA syndromes emerge as **composites**.
- **Subcortex** (`docs/superpowers/specs/2026-07-12-subcortex-mapping-design.md`) — internal capsule,
  VPL thalamus, subthalamic nucleus, deep optic radiation. The **cortical-vs-subcortical distinction**
  (dense hemiparesis with no cortical signs → capsule) **emerges from parsimony** with **no new
  mechanism** — the first pure anatomy-table region (new `subcortex` level + structures + a
  `composeDeepVascularSites` composer for the sensorimotor-lacune and anterior-choroidal triad). The
  capsule reuses the somatotopic `weak_arm`/`weak_leg`/`facial_weak_umn` findings; two new deep-grey
  findings (`thalamic_pain`, `hemiballismus`). Documented emergent ddx: a pain-free pure *body*
  sensory loss is shared by the VPL thalamus and the lateral midbrain tegmentum (ML+STT convergence);
  `thalamic_pain` is the discriminator (Déjerine–Roussy).

- **Cranial nerves & skull base** (`docs/superpowers/specs/2026-07-12-cranial-nerves-skull-base-design.md`)
  — the extra-axial cranial nerves at the skull base. Organising concept: **foramina-as-sites**, the
  peripheral analogue of shared vascular territory (nerves threading one bony canal fail together).
  **Third zero-new-mechanism region in a row** — all ipsilateral, reuses `CROSSES:false`; new
  `skull_base` level + `composeSkullBaseSites`. Nested syndromes derive by UNION (cavernous = SOF ∪
  rotundum, discriminator V2; orbital apex = SOF ∪ optic canal, discriminator optic) and the
  Vernet→Collet-Sicard→Villaret staircase; CPA = VII/VIII/V. Five new findings (`optic_neuropathy`,
  `v1_sensory`, `v2_sensory`, `cn11_weakness`, `hearing_loss`); `cn4_palsy` finally gets a producer.
  Emergent nuclear-vs-peripheral ddx (same CN sign localises by the company it keeps). Proptosis/chemosis
  deferred to the pathology layer; the visual pathway deferred to its own region (below).
- **Motor unit — anterior horn / NMJ / muscle** (`docs/superpowers/specs/2026-07-12-motor-unit-nmj-muscle-design.md`)
  — the pure-motor endings. **Fourth zero-new-mechanism region in a row** — "fatigability" is a *finding*
  (`fatigable_weakness`/`facilitating_weakness`), not solver machinery; each part is a **bilateral** site
  (composer-built, like cauda/conus). Two anatomical calls made with the user: the **anterior horn is
  pure LMN** (no `umn_signs`) — ALS is a *pathology* (UMN+LMN co-occurrence), not a site (see the
  pathology layer below); and **`fasciculations` is a general, non-localising LMN sign** (any LMN level).
  Myopathy emerges by parsimony (bare proximal weakness beats MG/LEMS). MG = fatigable + ocular; LEMS =
  facilitating + autonomic.

- **PNS — radiculopathy & length-dependent polyneuropathy** (`docs/superpowers/specs/2026-07-12-pns-root-polyneuropathy-design.md`)
  — the two ends of the sensory-bearing PNS. **Roots are finding-driven SITES** (C5–T1 / L2–S1, the
  segment emerges from dermatome + myotome + reflex — a mismatch surfaces as multifocal), NOT an axis;
  the cord sensory level is an axis only because its tracts are identical at every segment. **Length-
  dependence IS the axis** — a new `model/nerveLength.js` (twin of `levels.js`) with an axon-length RANK
  coordinate where `fingertips == knees`, so **stocking-glove emerges** (the glove appears when the reach
  hits the knees), attached by `inverse.describeLength`. Did the flagged **`lmn_weakness` demotion** to
  non-localising (cauda/conus keep saddle+sphincter; a mixed UMN+LMN ALS picture now resolves to *no*
  single site → pathology layer). Also fixed a latent bug: `composeHemiLevelSites` was restricted to the
  brainstem+cord (`HEMI_LEVELS`) — it must not fabricate an "all-parts" hemi composite for many-part
  levels (cortex/subcortex/skull_base/root), which would spuriously absorb any finding combination.

- **PNS — plexus & named nerves, movement-based** (`docs/superpowers/specs/2026-07-12-pns-plexus-nerves-design.md`)
  — the focal PNS. **Approach A: the weakness vocabulary is now MOVEMENT-based** (`weak_ankle_dorsiflexion`,
  `weak_foot_inversion`, `weak_thumb_abduction`, …), shared by roots AND nerves — the lumped `weak_c5…s1`
  were removed and the roots re-pointed. **Discriminators emerge** because the movement is a shared finding
  and the sensory territory pins it: L5-vs-peroneal (peroneal spares inversion + hip abduction),
  C8/T1-vs-ulnar (ulnar spares thumb abduction/APB), C6-vs-carpal-tunnel, axillary-vs-C5. **Plexus = plain
  root composites** (`composePlexusSites`: `upper_trunk`=C5∪C6=Erb, `lower_trunk`=C8∪T1=Klumpke, lumbar,
  sacral) — a two-adjacent-root pattern beats two root sites by parsimony. **14 named nerves** (axillary,
  musculocutaneous, suprascapular, long thoracic, radial, median, ulnar; femoral, obturator, lateral
  femoral cutaneous, superior gluteal, sciatic, common peroneal, tibial); sensory territories LOCALISE,
  movements are non-localising (pure-motor nerves — long thoracic/superior gluteal — localise by
  parsimony). No new solver mechanism.

- **Non-muscle reflexes** (`docs/superpowers/specs/2026-07-12-reflexes-release-signs-design.md`) —
  reflexes that aren't muscle-stretch reflexes, all as ANATOMY-layer findings (no new mechanism):
  **UMN release** `babinski`/`hoffmann` attached across the WHOLE corticospinal tract (brainstem, cord
  [ipsi, `crosses:false`], capsule, cortex) — **non-localising** (they run the length of the tract; they
  confirm UMN and seed the ALS pathology layer); **sacral superficial** `anal_wink_loss`/
  `bulbocavernosus_loss` at conus + cauda (localising, S2-4); **frontal release** `grasp_reflex`/
  `palmomental` at the frontal cortex. Also improved `inverse.minimalSet`: its greedy tie-break now
  prefers the site that explains MORE observed findings (not just fewest over-predictions) — the
  nuclear-vs-peripheral multifocal case (a CN sign shared by a nucleus and a foramen resolves to the one
  that also explains the accompanying long-tract signs).

- **Parinaud / vertical gaze** (`docs/superpowers/specs/2026-07-18-parinaud-vertical-gaze-design.md`) —
  finishes the brainstem's **vertical-gaze map**. A new **tectal** site (posterior commissure / riMLF)
  produces the supranuclear `vertical_gaze_palsy` (+ `nystagmus_convergence_retraction`, joining the
  nystagmus taxonomy, + `lid_retraction`/Collier's, a non-localising companion). **Parinaud emerges as
  the UNION** of that tectal site with the pre-existing pupillary pretectum relay (`ar_lnd` →
  light-near dissociation) — the same **subset⊆superset nesting** the skull-base foramina use (SOF ⊆
  cavernous ⊆ orbital apex), so **no new solver mechanism**: an isolated `vertical_gaze_palsy` localises
  to `dorsal_midbrain_tectum`, an isolated light-near dissociation still localises to `pupil_pretectum`
  (Argyll Robertson, the pupillary subset), and the full tetrad resolves to the single
  `parinaud_dorsal_midbrain` site rather than a two-site cover. Modelling note: both dorsal-midbrain
  sites are `side: "bilateral"` (like `pupil_pretectum`) because `light_near_dissociation` is
  lateralised (@left + @right); the vertical-gaze findings are NON_LATERALISED so they emit @none
  regardless. The union site is keyed in the `syndromes.js` phonebook by its exact site id (both sites
  share `level_part` `dorsal_midbrain_tectum`, and `nameForSite` prefers an exact-id entry).

- **Reticular activating system & reduced level of consciousness**
  (`docs/superpowers/specs/2026-07-18-reticular-activating-system-consciousness-design.md`) — arousal, a
  different *kind* of finding. 3 findings (`reduced_consciousness`, `preserved_vertical_gaze`,
  `extensor_posturing`), all `@none` + LOCALISING. Four sites via `composeConsciousnessSites()`:
  `cerebrum_diffuse` + `brainstem_aras` (+ decerebrate posturing) + `thalamus_bilateral_percheron` (reuses
  `vertical_gaze_palsy`) + `locked_in` (bilateral `cst_pons` → quadriplegia + `preserved_vertical_gaze`,
  **no** `reduced_consciousness`). **No new solver mechanism** — the "arousal needs both hemispheres, so a
  unilateral lesion impairs nothing" principle reuses the existing **`bilateralOnly` gate** (Anton/Balint)
  on the paramedian-thalamus and diffuse-cortex arousal structures. Emergence: isolated arousal → diffuse
  (strict — the ARAS site over-predicts posturing, Percheron over-predicts vertical gaze); + posturing →
  ARAS; + vertical gaze palsy → Percheron; quadriplegia + preserved gaze → locked-in. **Modelling call made
  during impl (deviation from the spec):** the two paramedian-thalamus arousal structures live on a
  dedicated composer-only level `thalamus_arousal`/`paramedian`, **not** on `subcortex`/`thalamus` — putting
  `bilateralOnly` structures on the `subcortex` level tripped a subcortex-suite invariant ("no subcortex
  structure is gated") and its VPL structure-enumeration; the dedicated level is also more faithful
  (intralaminar/paramedian nuclei are distinct from the VPL relay). Phonebook keyed by exact site id.

- **Trigeminal complex & trochlear nucleus**
  (`docs/superpowers/specs/2026-07-18-trigeminal-complex-trochlear-nucleus-design.md`) — the last two
  brainstem coverage-audit gaps, one increment, no new solver mechanism. **Trigeminal:** 2 findings
  (`face_touch_loss`, `jaw_weakness`, ipsilateral, LOCALISING); the pontine main-sensory + motor nuclei at a
  new `pons`/`trigeminal` part → a dedicated `pons_trigeminal` site, PLUS a union composite
  (`composeLateralPontineTrigeminalSites`, `pons_lateral ∪ pons_trigeminal` = `pons_lateral_trigeminal`) —
  the skull-base nesting pattern, so the lateral pontine (Marie-Foix/AICA) syndrome that reaches the nuclei
  is one composite. Emergent dissociation: facial **touch** = pons (main sensory), **pain/temp** = medulla
  (spinal nucleus) — the facial analogue of the cord DC-vs-STT split. **Trochlear:** CN IV fully decussates,
  so `cn4_nucleus` (`midbrain`/`trochlear`, **`crosses:true`**) emits a CONTRALATERAL `cn4_palsy`
  (per-structure crossing override, the cord pattern); it is composer-built (`composeTrochlearNucleusSites`,
  lateralised) so it stays OUT of the midbrain-hemi composite. A co-located `mlf_midbrain` (→ ipsilateral
  `ino`) is the companion: it makes an isolated CN4 resolve **strictly** to the ipsilateral peripheral nerve
  (`cn4_nerve` at `skull_base`/`trochlear_cisternal`, buildSites — the nucleus over-predicts `ino`), and
  makes the nucleus win on *contralateral CN4 + ipsilateral INO*. **User-driven modelling call:** the
  companion was originally Horner (mechanical crutch to make the nucleus reachable); switched to INO (adjacent
  rostral MLF) as the more classic dorsal-midbrain pairing. Consequence (accepted): an isolated INO now has a
  lean dorsal-midbrain home (no lean *pontine* INO site exists — `mlf_pons` is bundled), so the site is named
  for the dorsal-midbrain tegmentum. Phonebooked by `level_part`. **The brainstem map is now complete.**

- **Guillain-Mollaret triangle** (`docs/superpowers/specs/2026-07-19-guillain-mollaret-triangle-design.md`)
  — the dentato-rubro-olivary loop; **palatal / oculopalatal tremor**. 2 findings (`palatal_tremor`,
  `nystagmus_pendular`, `@none` + LOCALISING). `palatal_tremor` is a SHARED finding: one composer
  `composeGuillainMollaretSites()` builds a broad **midline `guillain_mollaret_triangle`** (structures =
  inferior olive + central tegmental tract + the pendular source — the isolated-palatal-tremor nodes) plus
  two **corner** sites that are SUPERSETS of the broad triangle (triangle findings + one node-specific
  finding): `gm_rubral` (+ the reused `red_nucleus` structure → contralateral `tremor_rubral`) and
  `gm_dentate` (+ the reused `cerebellum`/`hemisphere` structures). **Broad-default / sharp-with-company via
  superset/subset parsimony, no new mechanism:** isolated palatal (± pendular) tremor → the broad triangle
  (corners over-predict their extra finding); palatal + rubral tremor → the rubral corner; palatal +
  cerebellar signs → the dentate corner. All composer-built → ZERO pollution of existing vascular syndromes.
  **Impl refinements:** the dentate corner mirrors the FULL cerebellar-hemisphere signature (else an isolated
  bare `dysmetria` would wrongly prefer `gm_dentate`); an isolated `tremor_rubral` resolves to `gm_rubral`
  (accepted — no lean red-nucleus base exists; Holmes tremor is never isolated; the note says palatal tremor
  "may accompany"). Phonebook by `level_part`.

- **Aphasia taxonomy** (`docs/superpowers/specs/2026-07-19-aphasia-taxonomy-design.md`) — replaced the two
  stored aphasia findings (`aphasia_expressive`/`aphasia_receptive`) with **4 language FEATURES**
  (`speech_nonfluent`, `comprehension_impaired`, `repetition_impaired` — LOCALISING; `naming_impaired` —
  NON-localising, since anomia is in every aphasia). The **8 classic aphasias EMERGE** from feature
  combinations at dominant-gated sites — Broca (operculum), Wernicke (temporoparietal), conduction
  (new `arcuate` part), transcortical motor / sensory (new `watershed_anterior`/`watershed_posterior`
  parts), anomic (new `angular` part), plus composites `aphasia_global` (perisylvian union) and
  `aphasia_mixed_transcortical` (both watersheds) via new `composeAphasiaSites()`. **Repetition is the
  discriminator**: perisylvian sites emit `repetition_impaired`, watershed sites don't, so a repetition-
  spared input picks a transcortical syndrome by parsimony (the perisylvian site over-predicts). The new
  language parts are kept OUT of `DIVISION` so they don't join the MCA/ACA/PCA vascular composites. **Two
  subcortical aphasias** (thalamic, striatocapsular) as dominant-gated composites that MIRROR their base
  site's full signature (reuse the VPL-thalamus / internal-capsule structures) + an aphasia feature, so
  they never steal a pure sensory/motor input and win only with the aphasia + subcortical company. NO new
  solver mechanism. **Ripple (recorded in the plan):** the subcortex cortical-vs-subcortical test now uses
  a genuinely cortical discriminator (`gaze_deviation`) since aphasia alone is no longer unambiguously
  cortical (striatocapsular). Refactored `cortex.test.js` for the feature decomposition.

- **Frontal lobe completeness** (`docs/superpowers/specs/2026-07-19-frontal-lobe-completeness-design.md`) —
  filled the frontal map by region. 4 new findings (`limb_apraxia`, `alien_limb`, `urinary_incontinence`,
  `gait_apraxia`, all `@none` + LOCALISING, not hemisphere-gated) + 4 structures at 3 new cortex parts:
  `premotor` (→ limb apraxia, MCA superior), `sma` (→ alien limb / SMA syndrome, ACA), `paracentral`
  (→ urinary incontinence + gait apraxia, ACA). Purely additive, no new mechanism. **New parts kept OUT of
  `DIVISION`** (like the aphasia language parts) so they localise standalone and don't churn the MCA/ACA
  vascular composites (zero regressions). Also named the pre-existing prefrontal trio in the phonebook
  (`cortex_dlpfc` dysexecutive, `cortex_medial_pfc` abulia / akinetic mutism, `cortex_orbitofrontal`
  disinhibition) so the whole frontal convexity is named. The frontal map is now complete by gyrus/region
  (primary motor, premotor, SMA, FEF, Broca, DLPFC, medial PFC/cingulate, orbitofrontal, paracentral).

- **Parietal / temporal / occipital completeness**
  (`docs/superpowers/specs/2026-07-19-parietal-temporal-occipital-completeness-design.md`) — the frontal
  audit-and-fill applied to the other lobes. 7 new findings (`@none`, LOCALISING). **Parietal:**
  `ideomotor_apraxia` (dominant) + `dressing_apraxia` (non-dominant) on the existing `parietal` part.
  **Temporal:** `cortical_deafness` (new `auditory` part) + `kluver_bucy` (new `anterior_temporal` part),
  both `bilateralOnly` → `bilateral_auditory` / `bilateral_anterior_temporal` via `composeBilateralCortexSites`
  (the Anton/Balint mechanism). **Ventral occipitotemporal:** a new `fusiform` part — `visual_agnosia` +
  `achromatopsia` (`bilateralOnly` → `bilateral_fusiform`), `alexia_without_agraphia` (dominant — the VWFA,
  placed here NOT on the occipital hemianopia site to avoid churning its exact-set test), and **relocated
  `prosopagnosia`** from its old simplified `parietal` home to the fusiform (non-dominant). `cortex_fusiform`
  is a `{dominant: alexia, nondominant: prosopagnosia}` phonebook variant (the `cortex_parietal` pattern).
  New parts kept OUT of `DIVISION` (no vascular-composite churn); no new mechanism; ZERO regressions.

- **Thalamic nuclei + hypothalamus** (`docs/superpowers/specs/2026-07-19-thalamus-hypothalamus-design.md`)
  — 9 new findings. **Thalamus:** the remaining nuclei on a DEDICATED `thalamus` level (like `thalamus_arousal`
  / `aphasia_subcortical`, so `subcortex/thalamus` VPL is untouched and the subcortex invariants hold): VPM
  (`face_sensory_loss`, contralateral — crossed vs ipsilateral brainstem trigeminal), VA/VL (`thalamic_tremor`),
  pulvinar (reuses `neglect`, non-dominant), anterior/DM (`amnesia`, shared with the hypothalamic mammillary
  bodies). **Hypothalamus:** a NEW `hypothalamus` LEVEL, MIDLINE sites via `composeHypothalamusSites()` (the
  cauda/conus pattern, id == level_part), one per nucleus: supraoptic (`diabetes_insipidus`), thermoregulatory
  (`thermodysregulation`), ventromedial (`hyperphagia`), lateral (`narcolepsy`), suprachiasmatic
  (`circadian_disruption`), mammillary (`amnesia`), tuberal (`endocrine_dysfunction`). No new mechanism.
  **Accepted behaviour change:** an ISOLATED `neglect` now resolves to the lean thalamic pulvinar (a deep
  focal lesion) rather than the rich cortical parietal — `neglect` WITH other parietal signs (anosognosia,
  apraxias) still resolves to the cortex; the lobes-test regression was updated to that discriminator.
  MGN skipped (clinically silent unilaterally).

- **Corpus callosum — callosal disconnection** (`docs/superpowers/specs/2026-07-19-callosal-disconnection-design.md`)
  — the last classic disconnection syndrome (conduction/arcuate, pure alexia/splenium-VWFA, transcortical/
  watershed, INO/MLF were already there). Insight: a disconnection syndrome needs NO new mechanism — a tract
  is a site, the disconnection deficit is its finding. 2 new findings (`callosal_apraxia`, `tactile_anomia`,
  `@none` + LOCALISING) + reuses `alien_limb`. NEW composer-only MIDLINE `corpus_callosum` level via
  `composeCorpusCallosumSites()` (hypothalamus pattern): `anterior` (genu/body → callosal_apraxia + alien_limb)
  and `splenium` (→ tactile_anomia; the visual half of pure alexia stays at the VWFA). Regression-safe: an
  isolated `alien_limb` still → the SMA (lean buildSites site); `callosal_apraxia + alien_limb` → the anterior
  callosum. Findings `@none` (the non-dominant-hand laterality noted in the phonebook, not modelled as a side).

- **Cranial nerves — peripheral course** (`docs/superpowers/specs/2026-07-19-cranial-nerve-peripheral-course-design.md`,
  `docs/superpowers/plans/2026-07-19-cranial-nerve-peripheral-course.md`) — the LONGITUDINAL axis of the
  skull-base cranial nerves: sites ALONG one nerve's course, differentiated by which branch is spared. The
  same mechanism as the `nerve-segments` limb increment — no new solver code; a spared branch localises
  distally by the over-prediction penalty. Re-keyed the skull base from foramen-bundled parts to **per-nerve
  (nerve, compartment) primitives**; the multi-nerve foramen syndromes now EMERGE from `composeSkullBaseSites`
  unioning them. 13 findings (`lacrimation_loss`, `hyperacusis`, `taste_loss`, `facial_weak_branch`,
  `v3_sensory`, `gag_afferent_loss`, `taste_posterior`, `palatal_weakness`, `vocal_cord_palsy`,
  `cn3_superior_div`, `cn3_inferior_div`, `weak_scm`, `weak_trapezius`); `cn11_weakness` retired →
  `weak_scm`/`weak_trapezius`. Coverage: **VII** 6-level chain (IAM→geniculate→tympanic→mastoid→
  stylomastoid→parotid; Ramsay Hunt, Bell's), **V** divisions (V1/V2/V3-ovale + Gasserian ganglion), **III**
  superior/inferior divisions, **VI** petrous apex (Gradenigo), **IX/X** gag afferent-vs-efferent split + X
  distal recurrent-laryngeal chain (palate-sparing), **XI** SCM-vs-trapezius (posterior triangle), **XII**
  canal-vs-neck, and IAM-vs-CPA. Meatal = the shared `iam` part (VII+VIII, subset of `cpa`) so it needs the
  hearing sign to win — no meatal/geniculate tie. The pre-divisional trunks (III/IV/VI) are composite-only so
  isolated palsies still resolve to their pupil/cisternal/nuclear sites. `cn_bulbar` retained for the
  motor-unit diffuse bulbar palsy only. Picks up the two items the original skull-base spec deferred (IAM-vs-
  CPA and V3/foramen ovale). Still deferred: peripheral vestibular apparatus, IX/X autonomic detail
  (neuralgia, carotid-sinus, secretomotor), proptosis/chemosis, cause weighting.

- **Tier 1 completeness — CN I, insula, basis-pontis lacunes** (`test/tier1-completeness.test.js`;
  `docs/superpowers/specs/2026-07-19-tier1-completeness-design.md`,
  `docs/superpowers/plans/2026-07-19-tier1-completeness.md`; from the coverage audit
  `docs/superpowers/audits/2026-07-19-neuraxis-coverage-audit.md`, Increment A). ZERO-new-mechanism (one
  existing-style `crosses:true` override). 3 findings: `anosmia` (CN I, LOCALISING), `gustatory_loss`
  (insula, LOCALISING), `dysarthria` (@none, NON-localising — general articulation sign, distinct from the
  cerebellar `ataxic_dysarthria`; the *combinations* localise). **CN I:** new `olfactory` LEVEL + part
  `olfactory_groove` → `anosmia`; Foster-Kennedy emerges as the 2-site cover (olfactory + `optic_canal`).
  **Insula:** new cortex part `insula` → `dysarthria` + `gustatory_loss`; kept OUT of the `DIVISION` map
  (like the aphasia language parts) so it doesn't pollute the MCA composites. **Basis pontis:** new `pons`
  part `basis_pontis` (ventral, distinct from the dorsal `medial` tegmentum so it spares gaze/cn6/cn7) →
  corticospinal (`hemiparesis`), corticobulbar (`facial_weak_umn` + `dysarthria`), pontocerebellar
  (`limb_ataxia`, `crosses:true` → CONTRA, same side as the weakness). **Ataxic hemiparesis** (hemiparesis +
  ipsilateral ataxia) beats midbrain|medial (over-predicts cn3+rubral); **dysarthria-clumsy-hand**
  (dysarthria + facial UMN) beats the internal capsule (can't explain dysarthria). ZERO regressions. Phonebook:
  olfactory_olfactory_groove, cortex_insula, pons_basis_pontis. **Tier 1 Increment B (peripheral-vestibular
  HINTS axis: head-impulse / test-of-skew / positional, peripheral-vs-central) is the next fill; Tier 2
  backlog in the audit.**

- **Vestibular HINTS axis — peripheral vs central AVS** (`test/vestibular-hints.test.js`;
  `docs/superpowers/specs/2026-07-20-vestibular-hints-design.md`,
  `docs/superpowers/plans/2026-07-20-vestibular-hints.md`; Tier 1 Increment B from the audit). ZERO-new-mechanism.
  5 findings (@none, LOCALISING): `head_impulse_abnormal` (peripheral), `skew_deviation` (central),
  `nystagmus_positional_posterior/horizontal/anterior` (canal-specific BPPV). **The "normal head-impulse =
  stroke" logic EMERGES from the over-prediction penalty** — the peripheral labyrinth predicts an abnormal
  head impulse, so its absence + skew tips the lean central site. **Peripheral:** labyrinth gains
  `head_impulse_abnormal` (vestibular neuritis); 3 new canal parts (`posterior_canal`/`horizontal_canal`/
  `anterior_canal`) → BPPV by nystagmus direction. **Central:** NEW lean `central_vestibular|nucleus`
  (cn8_vertigo + nystagmus_gaze_evoked + skew_deviation) — the HINTS-central posterior-circulation stroke;
  ordered after `peripheral_vestibular` in LEVELS so isolated vertigo → peripheral. **Wallenberg enriched**
  with `skew_deviation` (icp_otr, lateral medulla OTR) — full Wallenberg still → medulla|lateral. Emergence:
  neuritis→labyrinth, stroke→central_vestibular, normal-HIT+skew→central (the emergency), BPPV→its canal,
  Ménière→labyrinth+cochlear. ZERO regressions. Phonebook: the 3 canals + central_vestibular_nucleus (INFARCT
  red flag). **★ Tier 1 (audit completeness fills) is now COMPLETE** — CN I, insula, basis-pontis lacunes,
  and the vestibular HINTS axis all done. Tier 2 backlog remains in the audit.

- **Tier 2 backlog — 5 completeness increments** (from `docs/superpowers/audits/2026-07-19-neuraxis-coverage-audit.md`;
  all ZERO-new-solver-mechanism, built 2026-07-20). (1) **Brainstem** (`tier2-brainstem`): pseudobulbar palsy —
  NEW `emotional_lability` finding + bilateral-corticobulbar composer site (`composePseudobulbarSites`), distinct
  from LMN bulbar palsy; + `abducens_nucleus`→gaze_palsy (nuclear VI = gaze palsy, not abduction; Foville/one-and-
  a-half emerge). (2) **Cord combined degenerations** (`tier2-cord-combined`): NEW `sensory_ataxia` finding (also on
  the posterior columns) + a `composeCombinedDegenerationSites` composer → SCD (B12: dorsal columns + lateral
  corticospinal, STT/pain-temp SPARED — the dissociation) and Friedreich (+ spinocerebellar limb ataxia + areflexia
  with extensor plantars). (3) **Corona radiata** (`tier2-lacunar`): a subcortex white-matter pure-motor lacune —
  honestly TIES the internal capsule (indistinguishable); completeness/naming (Tier 1 basis pontis already homed
  ataxic hemiparesis + dysarthria-clumsy-hand). (4) **PNS depth** (`tier2-pns-depth`): roots C3/C4 (+phrenic/
  diaphragm — NEW `weak_diaphragm`), thoracic T4/T10/L1 + sacral S2/S3 dermatomes, plexus middle trunk (C7), nerves
  phrenic / pudendal / saphenous / sural. (Brachial-plexus cords deferred — intricate waystations that rarely
  localise distinctly on exam.) (5) **Cortical hand-knob** (`tier2-cortical`): NEW `weak_hand` + a precentral
  `hand_knob` cortex part — isolated cortical hand weakness that mimics an ulnar/radial/C8 lesion but is UMN.
  ZERO regressions across all five.

- **Tier 2 deferred items — now complete** (`tier2-deferred`; built 2026-07-20; ZERO-new-mechanism). (a) **Brachial
  plexus cords** — NEW `composeBrachialCordSites` unioning terminal NERVES (not roots): posterior_cord (axillary +
  radial = deltoid + all extensors), lateral_cord (musculocutaneous), medial_cord (ulnar + median = C8-T1 hand;
  median assigned here as its hand functions dominate). Isolated single nerves are not stolen (leaner wins). (b)
  **Optic-nerve field geometry** — NEW `altitudinal_defect` (AION) + `central_scotoma` (optic neuritis), each a lean
  skull-base optic sub-site (`optic_aion`, `optic_neuritis` with RAPD); generic `optic_neuropathy` still → optic
  canal. (c) **Cortical sensory hand** — NEW `cortical_sensory_hand` + postcentral `sensory_hand` cortex part (the
  sensory analogue of the hand-knob; cheiro-oral noted in the phonebook, also localising to thalamic VPL/VPM).
  **★ The neuraxis coverage audit is now FULLY closed** (Tier 1 + Tier 2 + all deferrals). Only capsular somatotopy
  remains explicitly out of scope.

- **Causes / aetiology layer — the "what"** (`src/data/causes.js`, `test/causes.test.js`;
  `docs/superpowers/specs/2026-07-20-causes-aetiology-layer-design.md`). The third dimension: given a lesion
  at site X, the tempo-aware **surgical-sieve** differential of CAUSES. 8 categories (vascular, inflammatory/
  demyelinating, neoplastic, infective, metabolic/toxic, traumatic, degenerative, congenital), 4 tempo buckets
  (hyperacute/acute/subacute/chronic), 3 likelihoods. `causesFor(site, {onset})` → causes grouped by category,
  ranked common-first, filtered by onset. Curated per-site `CAUSES` (bootstrapped from the phonebook `ddx`,
  keyed exactly like `nameForSite`) for the high-yield named sites; a **derived category fallback** seeds
  plausible categories from site attributes (vascular territory→stroke; skull-base→compressive; bilateral/
  diffuse→metabolic/degenerative; nerve→entrapment/vasculitic; root→disc/zoster; optic→neuritis/AION) so every
  site returns something. Pure data + one pure function — ZERO engine changes, ZERO regressions. Sub-project A
  of the prototype; the app (sub-project B) consumes it for the "What" panel. **FULL coverage** via a 3-source
  `causesFor`: (1) hand-curated `CAUSES`; (2) the phonebook `ddx` **categorised live** — keyword→category map (+
  per-category tempo, index→likelihood, red-flag regex) structures all ~185 named sites from the single source of
  truth (`syndromes.js` now exports `BY_SITE`); (3) attribute-derived fallback for sites with neither. Every phonebook
  site returns categorised, tempo-filterable causes (verified in the app). `source` ∈ curated/phonebook/derived.

- **Web-app prototype** (`app/`, `docs/superpowers/specs/2026-07-20-web-app-prototype-design.md`). A
  ZERO-dependency static web app that imports the real engine ES modules directly (no build step, single
  source of truth). Two modes: **Localise** — a **narrowing differential** (findings are constraints:
  `differential()` lists every candidate site whose `expectedFindings` ⊇ the entered findings — deliberately
  NOT the best-fit score, which penalises over-prediction and under-returns on sparse input; one finding →
  many sites, each added finding intersects → the list narrows). Click a lesion → its **Why**
  (explained/unexplained/predicted-absent) + **What** (tempo-filtered `causesFor` + red flags); no-single-site
  → rank by most-explained + multifocal banner (minimal-set cover). And **Atlas** (browse a site → its forward
  `expectedFindings` + syndrome + causes). Input is the exam-flow curation (`app/exam-map.js`, all findings
  mapped; unmapped fall through to "Other") + search + data-driven L/R/M side controls + worked-example
  presets. `app/serve.mjs` is a zero-dep static server (`node app/serve.mjs` → http://localhost:8137/app/).
  `test/app-smoke.test.js` guards the exam-map against model drift. Verified by driving it in a browser
  (Wallenberg → left lateral medulla + vascular/dissection causes, onset filter narrows to chronic→neoplastic;
  Atlas operculum → Broca's + findings + causes). The **where/why** run on the engine; the **what** on the
  causes layer (sub-project A).

### Next: pathology layer (ALS) · non-organic (FND) · UI
The neuraxis regions are essentially complete (brainstem → cord → cortex → subcortex → skull base → motor
unit → roots/polyneuropathy → plexus/nerves → non-muscle reflexes). What remains: the REQUIRED visual
pathway and pathology layer (below), the **non-organic (FND) layer** (Hoover's, give-way, entrainment —
positive functional signs that localise to NOTHING; the solver must FLAG them, not localise or penalise —
deferred from the reflexes increment), and the UI.

### REQUIRED refinements (flagged 2026-07-12, not yet built — do not forget)
- **Tone / spasticity as the UMN-vs-LMN axis.** Add tone findings — `spasticity` / increased tone
  (clasp-knife) as a UMN sign (companion of the corticospinal tract, alongside `babinski`/`hoffmann`,
  non-localising) and `hypotonia` / flaccidity as an LMN sign (companion of anterior horn / root / nerve /
  cauda). Tone is the classic UMN-vs-LMN discriminator; it pairs with the already-modelled Babinski/
  Hoffmann (UMN) and `lmn_weakness`/`fasciculations` (LMN). Same shape as the reflexes increment — pure
  anatomy findings, no new mechanism.
- **Complete motor innervation of every peripheral nerve.** The plexus/nerves increment gave each named
  nerve a *representative* movement set; extend each to ALL the movements it supplies (e.g. median in the
  forearm not just APB; radial's triceps/brachioradialis; ulnar's FDP 4/5 + adductor pollicis; tibial's
  toe flexors; etc.), so the nerve-vs-root and nerve-segment (elbow-vs-wrist) discriminators are complete.
  Pure data extension on the movement vocabulary already built.
- **Pupillary pathways & autonomic localisation (sympathetic + parasympathetic + afferent).** Model the
  three pupil pathways so pupil signs LOCALISE:
  - **Afferent** (optic nerve/tract) → **RAPD** (relative afferent pupillary defect) — ties into the
    visual-pathway region above; localises to the optic nerve.
  - **Efferent parasympathetic** (Edinger-Westphal → CN III → ciliary ganglion → sphincter pupillae) →
    a **fixed dilated pupil** / efferent defect; the pupil-involving-vs-sparing CN III distinction
    (compressive/aneurysm vs ischaemic), and a **tonic (Adie) pupil** at the ciliary ganglion.
  - **Sympathetic** (hypothalamus → ciliospinal centre of Budge C8–T2 → superior cervical ganglion →
    dilator pupillae) → **Horner's syndrome localised along its three-order pathway**: 1st-order/central
    (brainstem/cord — already emits `horner`), 2nd-order/preganglionic (apical lung / Pancoast, already
    hinted at the lower trunk), 3rd-order/postganglionic (carotid — already a `carotid_space` site). This
    turns the existing single `horner` finding into a *localising axis* (central vs pre- vs
    post-ganglionic, ± anhidrosis distribution), and adds **light-near dissociation** (Argyll Robertson).
  Best built alongside the visual pathway (they share the afferent optic limb) or as its own small region.

### Later: Visual pathway (REQUIRED — deferred from the skull-base increment, do not forget)
The skull-base increment modelled CN II only as *monocular* `optic_neuropathy` at the optic canal /
orbital apex. This dedicated region completes the **retina → optic nerve → chiasm → optic tract →
lateral geniculate → optic radiation → occipital cortex** pathway, where the field defect's geometry
localises the lesion:
- **Structures / new findings**: the optic chiasm → **bitemporal hemianopia** (pituitary adenoma,
  craniopharyngioma); optic tract / LGN → contralateral (incongruous) homonymous hemianopia; the
  radiations already exist (temporal = superior quadrantanopia, parietal = inferior, subcortex
  `optic_radiation`), and occipital `homonymous_hemianopia` is the terminus.
- **Why it's a clean region**: it *connects* three existing regions (skull base `optic_neuropathy`,
  subcortex `optic_radiation`, cortex `homonymous_hemianopia`/quadrantanopias) into one axis — the field
  defect is the localiser, no new mechanism expected (all findings lateralised/contra or midline-ish).
  The chiasm's bitemporal defect is the one genuinely new finding + the pituitary/parasellar site.

### Cross-cutting layers (after regions exist)
- **Pathology layer (ALS/MND is the flagship — REQUIRED, deferred from the motor-unit increment)**:
  pathologies as first-class objects that fire on the *co-occurrence* of findings across several
  anatomical sites, and *name* the pattern. **ALS/MND** is the motivating case: UMN findings (`umn_signs`,
  corticospinal) **plus** LMN findings (`lmn_weakness`/`fasciculations`, anterior horn) with **no sensory
  loss** → motor neurone disease. The anatomy stays pure (the anterior horn is LMN-only); the pathology
  layer recognises the combination. The engine's minimal-set cover is the precursor — it already returns
  the site *pair*; this layer adds the naming + the "one process, many sites" weighting. Other pathology
  objects follow the same shape (the cortex increment set the anatomy-first / pathology-as-annotation
  precedent).
- **Multifocal**: already works via minimal-set cover; extend to weigh "one disease hitting many
  sites" (MS, mets, sarcoid, vasculitis) by tempo + dissemination in space/time.
- **Tempo**: port the sudden/subacute/chronic differential-weighting from the old prototype.
- **Non-organic**: FND as *positive* findings (Hoover's, entrainment, inconsistency) that no
  anatomical site predicts — surfaced when localising findings are functional, never as a
  fallback for "doesn't localise."
- **Clinical layer**: differentials, red flags, investigations attached per site (port from the
  old prototype's pattern data).
- **UI**: the examination checklist from the old HTML prototype, re-pointed at this engine's
  finding vocabulary; render the ranked sites + minimal-set with the "how this was derived"
  structure-by-structure explanation `forward.explain()` already produces.

## What NOT to do

- Don't add a UI before the cord and cortex regions exist — the engine is the hard part.
- Don't collapse laterality to save typing; ipsi/contra is the whole game.
- Don't let `syndromes.js` grow logic. It is a phonebook, not a brain.
- Don't skip the test for a syndrome because it "obviously works" — the regression guard is the
  only thing that lets you refactor the engine safely later.

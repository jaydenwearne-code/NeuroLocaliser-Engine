# UI restructure — nested exam tree (Sub-project D)

**Status:** design approved 2026-07-25; not yet implemented.

**Depends on:** nothing new; restructures the input UI. Branch off `main`.

## Problem

Findings are entered from a **flat** accordion of ~25 steps (`EXAM_FLOW`), and a row of
worked-example **preset** buttons sits above it. The clinician wants a **nested, cascading** input
(higher function → lobe → finding; cranial nerves → nerve → finding; motor → pattern → finding;
sensation → pattern → modality → finding) and the presets removed.

## Goal

Replace the flat `EXAM_FLOW` with a recursive `EXAM_TREE` (categories → subcategories →
[modality] → findings), render it as a nested expandable tree with in-place side-button ticking,
retain search, and delete the presets. Nothing downstream of finding entry changes.

## Design

### 1. Data model — `EXAM_TREE` (`app/exam-map.js`)

A recursive tree. Each node has **exactly one** of:
- `groups: Node[]` — an expandable category, or
- `findings: string[]` — a leaf of finding ids (each rendered with L/R/• side buttons).

Every node has `{ id, label }`. Depth is 1–3 (only Sensation → Limb/hemibody → modality is depth 3).
A helper `flattenFindings(tree)` returns every finding id in the tree (for the coverage guarantee and
the "Other findings" catch-all). **`PRESETS` is deleted** from `exam-map.js`.

**Taxonomy** (top-level → subgroups → findings; every current finding mapped exactly once):

- **Higher function** → `frontal` · `parietal` · `temporal` · `occipital`
- **Speech & language** (leaf)
- **Consciousness & arousal** (leaf)
- **Cranial nerves** → `I — smell` · `II — vision & fields` · `III/IV/VI — eye movements` ·
  `V — face & jaw` · `VII — facial` · `VIII — hearing & vestibular` · `IX–XII — bulbar & neck`
- **Brainstem & pupils** → `Gaze & integrative signs` · `Pupils & oculosympathetic`
  (intra-axial gaze/INO/pupil signs — deliberately separate from Cranial nerves)
- **Motor** → `By limb (patterns)` · `By myotome (segmental movements)`
- **Tone** (leaf, top-level)
- **Reflexes** (leaf, top-level)
- **Wasting & fasciculations** (leaf, top-level)
- **Sensation** →
  - `Limb / hemibody` → `Pain & temperature` · `Vibration & proprioception` · `Cortical / discriminative`
  - `Dermatomal (root)` (leaf) · `Peripheral-nerve territory` (leaf) · `Glove-and-stocking` (leaf) ·
    `Sensory level / cord` (leaf)
- **Coordination & cerebellar** (leaf)
- **Movement disorders** (leaf)
- **Fatiguability / augmentation** (leaf)
- **Autonomic, sphincter & hypothalamic** (leaf)
- **Functional signs (positive)** (leaf)

**Finding placement** (from the current `EXAM_FLOW`, re-parented):

- Higher function/frontal: executive_dysfunction, abulia, disinhibition, limb_apraxia, alien_limb, gait_apraxia, callosal_apraxia
- Higher function/parietal: neglect, anosognosia, constructional_apraxia, dressing_apraxia, ideomotor_apraxia, agraphia, acalculia, finger_agnosia, left_right_disorientation, optic_ataxia, oculomotor_apraxia, simultanagnosia, tactile_anomia
- Higher function/temporal: verbal_memory_impairment, nonverbal_memory_impairment, amnesia, hallucinations, mood_change, cortical_deafness, kluver_bucy
- Higher function/occipital: visual_agnosia, achromatopsia, prosopagnosia, alexia_without_agraphia, cortical_blindness
- Speech & language: speech_nonfluent, comprehension_impaired, repetition_impaired, naming_impaired, motor_dysprosody, sensory_dysprosody, dysarthria, ataxic_dysarthria, emotional_lability
- Consciousness & arousal: reduced_consciousness, preserved_vertical_gaze, extensor_posturing
- CN/I: anosmia
- CN/II: optic_neuropathy, central_scotoma, altitudinal_defect, rapd, homonymous_hemianopia, superior_quadrantanopia, inferior_quadrantanopia, bitemporal_hemianopia, macular_sparing
- CN/III-IV-VI: ptosis, weak_adduction, weak_abduction, weak_elevation, weak_depression, vertical_diplopia, gaze_deviation, nystagmus_gaze_evoked, nystagmus_downbeat, nystagmus_upbeat, nystagmus_pendular
- CN/V: v1_sensory, v2_sensory, v3_sensory, face_pain_loss, face_touch_loss, face_sensory_loss, jaw_weakness
- CN/VII: facial_weakness, forehead_spared, facial_weak_branch, lacrimation_loss, hyperacusis, taste_loss, gustatory_loss
- CN/VIII: hearing_loss, cn8_vertigo, nystagmus_peripheral, head_impulse_abnormal, nystagmus_positional_posterior, nystagmus_positional_horizontal, nystagmus_positional_anterior
- CN/IX-XII: dysphagia, gag_afferent_loss, taste_posterior, palatal_weakness, vocal_cord_palsy, weak_scm, weak_trapezius, cn12_palsy
- Brainstem & pupils/gaze: gaze_palsy, ino, vertical_gaze_palsy, skew_deviation, lid_retraction, nystagmus_convergence_retraction
- Brainstem & pupils/pupils: fixed_dilated_pupil, light_near_dissociation, miosis, anhidrosis_face, anhidrosis_body
- Motor/by-limb: weak_arm, weak_leg, weak_hand, proximal_weakness, distal_motor_weakness, lmn_weakness, weak_diaphragm
- Motor/by-myotome: weak_shoulder_abduction, weak_shoulder_external_rotation, weak_scapular_stabilisation, weak_elbow_flexion, weak_elbow_extension, weak_forearm_supination, weak_forearm_pronation, weak_wrist_extension, weak_wrist_flexion, weak_finger_extension, weak_finger_flexion, weak_finger_abduction, weak_thumb_abduction, weak_thumb_adduction, ulnar_claw, weak_hip_flexion, weak_hip_adduction, weak_hip_abduction, weak_knee_extension, weak_knee_flexion, weak_ankle_dorsiflexion, weak_great_toe_extension, weak_foot_eversion, weak_foot_inversion, weak_ankle_plantarflexion, weak_toe_flexion
- Tone: spasticity, rigidity, hypotonia
- Reflexes: babinski, hoffmann, umn_signs, reflex_biceps_loss, reflex_brachioradialis_loss, reflex_triceps_loss, reflex_knee_loss, reflex_ankle_loss, grasp_reflex, palmomental, anal_wink_loss, bulbocavernosus_loss
- Wasting & fasciculations: wasting, fasciculations
- Sensation/limb/pain-temp: spinothalamic, thalamic_pain
- Sensation/limb/vibration: dorsal_sensory, sensory_ataxia
- Sensation/limb/cortical: cortical_sensory_arm, cortical_sensory_leg, cortical_sensory_hand
- Sensation/dermatomal: sensory_c3, sensory_c4, sensory_c5, sensory_c6, sensory_c7, sensory_c8, sensory_t1, sensory_t4, sensory_t10, sensory_l1, sensory_l2, sensory_l3, sensory_l4, sensory_l5, sensory_s1, sensory_s2, sensory_s3, radicular_pain
- Sensation/peripheral-nerve: axillary_sensory, musculocutaneous_sensory, radial_sensory, median_sensory, median_palmar_sensory, ulnar_sensory, ulnar_dorsal_sensory, femoral_sensory, obturator_sensory, lat_fem_cutaneous_sensory, saphenous_sensory, sciatic_sensory, peroneal_sensory, deep_peroneal_sensory, tibial_sensory, sural_sensory
- Sensation/glove-stocking: distal_sensory_loss
- Sensation/sensory-level-cord: suspended_sensory, saddle_anaesthesia
- Coordination & cerebellar: limb_ataxia, dysmetria, dysdiadochokinesis, intention_tremor, truncal_ataxia, tremor_rubral, palatal_tremor
- Movement disorders: bradykinesia, rest_tremor, chorea, dystonia, hemiballismus, thalamic_tremor
- Fatiguability: fatigable_weakness, fatigable_ocular, facilitating_weakness, autonomic_features
- Autonomic: sphincter_dysfunction, urinary_incontinence, diabetes_insipidus, thermodysregulation, hyperphagia, narcolepsy, circadian_disruption, endocrine_dysfunction
- Functional: hoovers_sign, give_way_weakness, entrainment, exam_inconsistency

Any finding in `FINDINGS` not placed above is caught by the app's "Other findings" leaf (unchanged
guarantee). Each finding is placed exactly once.

### 2. App rendering (`app/app.js`)

- `examAccordion()` becomes **recursive** — `renderNode(node, depth)`:
  - `node.groups` → a `<details data-gid>` with `summary` = label + a count badge (sum of descendant
    findings), body = the child nodes rendered recursively (indented by depth).
  - `node.findings` → the existing `frow(f)` rows.
  - Top-level `<details>` collapsed by default; nested ones too.
- The tree is built from `EXAM_TREE` plus an appended `{ id:"other", label:"Other findings",
  findings:[…unmapped…] }` leaf (computed via `flattenFindings`), exactly as the flat version did.
- **Search** (`filterFindings`) generalised: on a query, hide non-matching `.frow`s and `open` every
  ancestor `<details>` of a match; clear restores collapsed state.
- **Presets removed**: delete the `.presets` markup, the `PRESETS` import, and the presets click
  handler in `wireLocalise`.
- `frow`, side buttons, `markSides`, chips, and everything downstream unchanged.

### 3. Tests (`test/app-smoke.test.js`)

Rewrite around the tree:
- Import `EXAM_TREE` (+ `flattenFindings`) instead of `EXAM_FLOW`/`PRESETS`.
- **Structural guard:** every node has exactly one of `groups`/`findings`; every `groups` and every
  `findings` is non-empty; every `id`/`label` present.
- **Validity:** every leaf finding is a real finding id (`FINDINGS[f]`).
- **Coverage:** `flattenFindings(EXAM_TREE)` ∪ the app's "Other" leaf = all of `FINDINGS` (nothing
  lost); no finding appears twice in the tree.
- **Spot-checks (taxonomy intent):** Sensation → Limb/hemibody → Pain & temperature contains
  `spinothalamic`; Motor → By myotome contains `weak_c5`; Fatiguability leaf contains
  `fatigable_weakness`, `fatigable_ocular`, `facilitating_weakness` (carried over from the old test).
- **Drop** the `PRESETS` assertions.

## Non-goals

- No change to findings, the engine, causes, synthesis, or the diagram.
- No new dependencies / framework — still a zero-build static app; the tree is nested `<details>`.
- Atlas mode unchanged.
- Modality tier only under Sensation → Limb/hemibody (agreed); other patterns are modality-agnostic.

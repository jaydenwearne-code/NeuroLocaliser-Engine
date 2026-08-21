// structures.js — the anatomical structure catalogue.
//
// Each structure, when damaged, produces exactly one finding (the `produces` field).
// A structure exists at one or more brainstem levels and is placed medially or laterally.
// The engine never mentions syndromes here — only structures and what they do. Syndromes
// emerge later from which structures happen to share a site.
//
// `level`  : 'midbrain' | 'pons' | 'medulla' | 'cord'
// `part`   : brainstem 'medial' | 'lateral'  (paramedian vs lateral tegmental — the key
//            vascular split); cord 'anterior' | 'posterior' (ASA vs PSA territory)
// `produces`: a finding id from findings.js
// `crosses`: OPTIONAL per-structure override of the finding-level CROSSES map. Present when the
//            same finding crosses differently depending on WHERE the lesion is. The brainstem
//            structures omit it (they inherit findings.CROSSES); the cord structures set it,
//            because below the pyramidal decussation the corticospinal tract and dorsal columns
//            are ipsilateral, the opposite of their brainstem behaviour.

export const STRUCTURES = [
  // ---- MIDBRAIN ----
  // oculomotor fascicle exiting through the midbrain — CN III palsy EMERGES from the four ductions + lid
  { id: "cn3_fasc_ptosis", level: "midbrain", part: "medial", produces: "ptosis",          note: "CN III fascicle — ptosis (LPS)" },
  { id: "cn3_fasc_add",    level: "midbrain", part: "medial", produces: "weak_adduction",   note: "CN III fascicle — weak adduction (MR)" },
  { id: "cn3_fasc_elev",   level: "midbrain", part: "medial", produces: "weak_elevation",   note: "CN III fascicle — weak elevation (SR/IO)" },
  { id: "cn3_fasc_depr",   level: "midbrain", part: "medial", produces: "weak_depression",  note: "CN III fascicle — weak depression (IR)" },
  { id: "red_nucleus",    level: "midbrain", part: "medial",  produces: "tremor_rubral",
    note: "red nucleus — contralateral tremor/involuntary movement" },
  // CROSSES — an override, because the default for limb_ataxia is ipsilateral (cerebellar signs normally
  // sit on the side of the lesion). THE SCP DECUSSATES IN THE CAUDAL MIDBRAIN, so by the time the peduncle
  // is at this level its fibres have already crossed: a lesion here gives CONTRALATERAL limb ataxia. This
  // is the one place in the cerebellar outflow where the ipsilateral rule breaks, and it is exactly the
  // layered-crossing case the model exists to express (owner ruling, 2026-08-21 — the old note hedged
  // "contralateral/ipsilateral" while the code silently emitted ipsilateral).
  { id: "scp_midbrain",   level: "midbrain", part: "medial",  produces: "limb_ataxia", crosses: true,
    note: "superior cerebellar peduncle, above its decussation — CONTRALATERAL limb ataxia" },
  // corticospinal tract in the cerebral peduncle — compact, so a lesion weakens BOTH arm and leg together
  // (a "hemiparesis" emerges from weak_arm + weak_leg co-occurring; the site is pinned by CN company)
  { id: "cst_midbrain_arm", level: "midbrain", part: "medial", produces: "weak_arm", note: "corticospinal (midbrain) — contra arm weakness" },
  { id: "cst_midbrain_leg", level: "midbrain", part: "medial", produces: "weak_leg", note: "corticospinal (midbrain) — contra leg weakness" },
  { id: "cbt_midbrain",   level: "midbrain", part: "medial",  produces: "facial_weakness",
    note: "corticobulbar fibres in the peduncle — contralateral lower-face UMN weakness" },
  { id: "cbt_midbrain_forehead", level: "midbrain", part: "medial", produces: "forehead_spared",
    note: "corticobulbar UMN — upper face bilaterally innervated → forehead spared" },
  { id: "ml_midbrain",    level: "midbrain", part: "lateral", produces: "dorsal_sensory",
    note: "medial lemniscus (has crossed) — contralateral vibration/proprioception" },
  { id: "stt_midbrain",   level: "midbrain", part: "lateral", produces: "spinothalamic",
    note: "spinothalamic tract — contralateral pain/temperature" },
  // trochlear nucleus (dorsal midbrain) — CN IV DECUSSATES, so a nuclear lesion gives a CONTRALATERAL SO palsy
  { id: "cn4_nuc_depr", level: "midbrain", part: "trochlear", produces: "weak_depression",  crosses: true,
    note: "trochlear nucleus — contralateral weak depression (SO)" },
  { id: "cn4_nuc_vd",   level: "midbrain", part: "trochlear", produces: "vertical_diplopia", crosses: true,
    note: "trochlear nucleus — contralateral vertical diplopia" },
  { id: "mlf_midbrain", level: "midbrain", part: "trochlear", produces: "ino", crosses: false,
    note: "rostral MLF adjacent to the trochlear fascicle — ipsilateral INO (the co-located companion)" },

  // ---- GUILLAIN-MOLLARET TRIANGLE (dentato-rubro-olivary; composer-only level) ----
  // palatal_tremor is SHARED across the loop. The broad `triangle` site (inferior olive + central tegmental
  // tract, the isolated-palatal-tremor nodes) is the default; the rubral corner reuses the existing
  // red_nucleus structure, the dentate corner adds a cerebellar sign — so company sharpens the node.
  { id: "inferior_olive", level: "guillain_mollaret", part: "triangle", produces: "palatal_tremor",
    note: "inferior olive — hypertrophic olivary degeneration effector / MRI hallmark" },
  { id: "central_tegmental_tract", level: "guillain_mollaret", part: "triangle", produces: "palatal_tremor",
    note: "central tegmental tract — the commonest lesion (rubro-olivary limb)" },
  { id: "gm_pendular", level: "guillain_mollaret", part: "triangle", produces: "nystagmus_pendular",
    note: "oculopalatal tremor — pendular nystagmus from HOD" },
  // (the dentate corner reuses the cerebellar-hemisphere structures — see composeGuillainMollaretSites)

  // ---- PONS ----
  { id: "abducens_nucleus", level: "pons", part: "medial", produces: "gaze_palsy",
    note: "abducens NUCLEUS — ipsilateral horizontal gaze palsy (houses interneurons to the contralateral MR via the MLF); nuclear VI ≠ isolated abduction. Co-located with the PPRF gaze centre." },
  { id: "cn6_nucleus",    level: "pons", part: "medial",  produces: "weak_abduction",
    note: "abducens FASCICLE (caudal pons) — isolated abduction weakness; with cn7 + cst = Millard-Gubler (vs the NUCLEUS, which gives a gaze palsy → abducens_nucleus / Foville)" },
  { id: "cn7_fascicle",   level: "pons", part: "medial",  produces: "facial_weakness", crosses: false,
    note: "facial fascicle looping around the abducens nucleus" },
  { id: "pprf",           level: "pons", part: "medial",  produces: "gaze_palsy",
    note: "paramedian pontine reticular formation / lateral gaze centre" },
  { id: "mlf_pons",       level: "pons", part: "medial",  produces: "ino",
    note: "medial longitudinal fasciculus" },
  { id: "cst_pons_arm", level: "pons", part: "medial", produces: "weak_arm", note: "corticospinal (pons) — contra arm weakness" },
  { id: "cst_pons_leg", level: "pons", part: "medial", produces: "weak_leg", note: "corticospinal (pons) — contra leg weakness" },
  { id: "ml_pons",        level: "pons", part: "medial",  produces: "dorsal_sensory",
    note: "medial lemniscus in the pons" },
  { id: "stt_pons",       level: "pons", part: "lateral", produces: "spinothalamic",
    note: "spinothalamic tract laterally" },
  { id: "mcp_pons",       level: "pons", part: "lateral", produces: "limb_ataxia",
    note: "middle cerebellar peduncle — ipsilateral ataxia" },
  { id: "cn8_pons",       level: "pons", part: "lateral", produces: "cn8_vertigo",
    note: "vestibular nuclei laterally" },
  { id: "cn8_pons_nyst",  level: "pons", part: "lateral", produces: "nystagmus_gaze_evoked",
    note: "vestibular nuclei (pons) — central gaze-evoked nystagmus" },
  { id: "trig_main_sensory", level: "pons", part: "trigeminal", produces: "face_touch_loss",
    note: "principal / main sensory nucleus (pons) — discriminative facial touch; ipsilateral" },
  { id: "trig_motor",        level: "pons", part: "trigeminal", produces: "jaw_weakness",
    note: "motor nucleus V — muscles of mastication; jaw deviates to the weak side; ipsilateral" },

  // ---- MEDULLA ----
  { id: "cn12_nucleus",   level: "medulla", part: "medial",  produces: "cn12_palsy",
    note: "hypoglossal nucleus/fascicle, medial" },
  { id: "pyramid_arm", level: "medulla", part: "medial", produces: "weak_arm", note: "medullary pyramid (corticospinal, above decussation) — contra arm weakness" },
  { id: "pyramid_leg", level: "medulla", part: "medial", produces: "weak_leg", note: "medullary pyramid — contra leg weakness" },
  { id: "ml_medulla",     level: "medulla", part: "medial",  produces: "dorsal_sensory",
    note: "medial lemniscus, medial" },
  // nucleus ambiguus (IX/X) — bulbar palsy EMERGES from palatal + vocal + dysphagia (unifies with the
  // already-split high-vagal IX/X skull-base course)
  { id: "nuc_amb_palate", level: "medulla", part: "lateral", produces: "palatal_weakness",
    note: "nucleus ambiguus (X) — palatal weakness / gag efferent" },
  { id: "nuc_amb_vocal",  level: "medulla", part: "lateral", produces: "vocal_cord_palsy",
    note: "nucleus ambiguus (X) — vocal-cord palsy / hoarseness" },
  { id: "nuc_amb_dysph",  level: "medulla", part: "lateral", produces: "dysphagia",
    note: "nucleus ambiguus (IX/X) — dysphagia" },
  { id: "spinal_trig",    level: "medulla", part: "lateral", produces: "face_pain_loss",
    note: "spinal trigeminal tract/nucleus — ipsilateral face pain/temp" },
  { id: "stt_medulla",    level: "medulla", part: "lateral", produces: "spinothalamic",
    note: "spinothalamic tract — contralateral body pain/temp" },
  // descending sympathetic fibres — ipsilateral Horner's (EMERGES from miosis + partial ptosis + anhidrosis)
  { id: "sym_miosis", level: "medulla", part: "lateral", produces: "miosis", note: "descending sympathetic — miosis" },
  { id: "sym_ptosis", level: "medulla", part: "lateral", produces: "ptosis", note: "descending sympathetic — partial ptosis" },
  { id: "sym_med_anhface", level: "medulla", part: "lateral", produces: "anhidrosis_face",
    note: "central (1st-order) Horner — ipsilateral facial anhidrosis" },
  { id: "sym_med_anhbody", level: "medulla", part: "lateral", produces: "anhidrosis_body",
    note: "central (1st-order) Horner — ipsilateral hemibody anhidrosis" },
  { id: "icp_vestib",     level: "medulla", part: "lateral", produces: "cn8_vertigo",
    note: "vestibular nuclei / inferior cerebellar peduncle" },
  { id: "icp_vestib_nyst", level: "medulla", part: "lateral", produces: "nystagmus_gaze_evoked",
    note: "vestibular nuclei (medulla) — central gaze-evoked nystagmus (rides Wallenberg)" },
  { id: "icp_otr", level: "medulla", part: "lateral", produces: "skew_deviation",
    note: "lateral medulla — ocular tilt reaction / skew deviation (Wallenberg)" },
  { id: "icp_medulla",    level: "medulla", part: "lateral", produces: "limb_ataxia",
    note: "inferior cerebellar peduncle — ipsilateral ataxia" },

  // ---- SPINAL CORD ----
  // Modelled as one generic level for now (tract PATTERN distinguishes the cord syndromes;
  // WHICH level needs the sensory-level mechanism, a later increment). Part = vascular zone:
  // 'anterior' = anterior spinal artery (anterior two-thirds), 'posterior' = posterior spinal
  // arteries (dorsal columns). Crossing is set explicitly because it is the OPPOSITE of the
  // brainstem for the motor and dorsal-column pathways.
  // lateral corticospinal tract (ASA-supplied) — already crossed at the pyramids, so a cord lesion gives
  // IPSILATERAL weakness (arm + leg) below the level
  { id: "cst_cord_arm", level: "cord", part: "anterior", produces: "weak_arm", crosses: false, note: "corticospinal (cord) — IPSI arm weakness below the level" },
  { id: "cst_cord_leg", level: "cord", part: "anterior", produces: "weak_leg", crosses: false, note: "corticospinal (cord) — IPSI leg weakness below the level" },
  { id: "stt_cord",  level: "cord", part: "anterior",  produces: "spinothalamic",  crosses: true,
    note: "spinothalamic tract — crosses within the cord (~1–2 levels), so CONTRALATERAL pain/temperature loss below the level" },
  { id: "dc_cord",   level: "cord", part: "posterior", produces: "dorsal_sensory", crosses: false,
    note: "dorsal columns (PSA-supplied) — ascend uncrossed to the medulla, so IPSILATERAL vibration/proprioception loss" },
  { id: "dc_sensory_ataxia", level: "cord", part: "posterior", produces: "sensory_ataxia", crosses: false,
    note: "dorsal columns — proprioceptive (Romberg-positive) sensory ataxia; companion of the dorsal-column sensory loss (tabes, SCD, cervical myelopathy)" },
  { id: "commissural_stt", level: "cord", part: "central", produces: "suspended_sensory", crosses: false,
    note: "decussating spinothalamic fibres in the anterior white commissure — a central (syrinx) lesion gives bilateral, suspended, dissociated pain/temperature loss with sacral sparing" },
  // Descending oculosympathetic in the LATERAL cord → central (1st-order) Horner, but only at/above ~T1
  // (below that the fibres have exited at the ciliospinal centre C8–T2). LEVEL-GATED via emitAtOrAbove.
  // Rides the hemicord composite, so a CERVICAL Brown-Séquard produces a Horner and a thoracic one does not.
  { id: "sym_cord_miosis", level: "cord", part: "lateral", produces: "miosis", crosses: false, emitAtOrAbove: "T1",
    note: "descending sympathetic (lateral cord) — miosis, only at/above ~T1" },
  { id: "sym_cord_ptosis", level: "cord", part: "lateral", produces: "ptosis", crosses: false, emitAtOrAbove: "T1",
    note: "descending sympathetic (lateral cord) — partial ptosis, only at/above ~T1" },
  { id: "sym_cord_anhface", level: "cord", part: "lateral", produces: "anhidrosis_face", crosses: false, emitAtOrAbove: "T1",
    note: "central cord Horner — facial anhidrosis (≥ ~T1)" },
  { id: "sym_cord_anhbody", level: "cord", part: "lateral", produces: "anhidrosis_body", crosses: false, emitAtOrAbove: "T1",
    note: "central cord Horner — hemibody anhidrosis (≥ ~T1)" },

  // ---- CAUDA EQUINA (lumbosacral nerve roots, below the conus) ----
  { id: "ls_roots_motor",       level: "cauda", part: "equina", produces: "lmn_weakness",         crosses: false,
    note: "lumbosacral motor roots — flaccid, areflexic (LMN) leg weakness" },
  { id: "sacral_roots_sensory", level: "cauda", part: "equina", produces: "saddle_anaesthesia",    crosses: false,
    note: "S2–S5 sensory roots — saddle anaesthesia" },
  { id: "sacral_roots_autonom", level: "cauda", part: "equina", produces: "sphincter_dysfunction", crosses: false,
    note: "sacral parasympathetic roots — bladder/bowel/sphincter dysfunction" },
  { id: "ls_roots_pain",        level: "cauda", part: "equina", produces: "radicular_pain",         crosses: false,
    note: "compressed lumbosacral roots — radicular pain (sciatica), often asymmetric" },

  // ---- CONUS MEDULLARIS (sacral cord tip, ~T12–L1 vertebral) ----
  { id: "conus_cst",            level: "conus", part: "medullaris", produces: "umn_signs",            crosses: false,
    note: "corticospinal fibres at the conus — UMN signs (hyperreflexia, extensor plantar)" },
  { id: "conus_sacral_sensory", level: "conus", part: "medullaris", produces: "saddle_anaesthesia",    crosses: false,
    note: "sacral cord segments — early symmetric saddle anaesthesia" },
  { id: "conus_sacral_autonom", level: "conus", part: "medullaris", produces: "sphincter_dysfunction", crosses: false,
    note: "sacral autonomic centres — early symmetric bladder/bowel dysfunction" },

  // ---- CEREBRAL CORTEX (part = subregion; territory is annotated separately in sites.js) ----
  // Frontal
  { id: "ctx_motor_leg",   level: "cortex", part: "motor_leg",   produces: "weak_leg",
    note: "paracentral lobule (leg motor) — ACA territory" },
  { id: "ctx_motor_face",  level: "cortex", part: "motor_facearm", produces: "facial_weakness",
    note: "precentral face (lower face UMN) — MCA superior division" },
  { id: "ctx_motor_forehead", level: "cortex", part: "motor_facearm", produces: "forehead_spared",
    note: "precentral face UMN — forehead spared (upper face bilaterally innervated)" },
  { id: "ctx_motor_arm",   level: "cortex", part: "motor_facearm", produces: "weak_arm",
    note: "precentral arm — MCA superior division" },
  // Broca (frontal operculum, dominant) DECOMPOSED into features — non-fluent + impaired repetition.
  { id: "ctx_broca_fluency",    level: "cortex", part: "operculum", produces: "speech_nonfluent", hemisphere: "dominant",
    note: "frontal operculum (Broca) — non-fluent output; dominant hemisphere" },
  { id: "ctx_broca_repetition", level: "cortex", part: "operculum", produces: "repetition_impaired", hemisphere: "dominant",
    note: "frontal operculum (Broca) — impaired repetition (perisylvian); dominant hemisphere" },
  { id: "ctx_motor_prosody", level: "cortex", part: "operculum", produces: "motor_dysprosody", hemisphere: "nondominant",
    note: "right frontal operculum homologue — non-dominant motor aprosodia" },
  { id: "ctx_fef",         level: "cortex", part: "frontal_eye_field", produces: "gaze_deviation",
    note: "frontal eye field — conjugate deviation toward the lesion (ipsi)" },
  { id: "ctx_dlpfc",       level: "cortex", part: "dlpfc", produces: "executive_dysfunction",
    note: "dorsolateral prefrontal cortex — executive dysfunction" },
  { id: "ctx_medial_pfc",  level: "cortex", part: "medial_pfc", produces: "abulia",
    note: "medial prefrontal cortex — apathy/abulia — ACA territory" },
  { id: "ctx_orbitofrontal", level: "cortex", part: "orbitofrontal", produces: "disinhibition",
    note: "orbitofrontal cortex — disinhibition, personality change" },
  // Motor-frontal tier + paracentral (completing the frontal map by region; NOT hemisphere-gated).
  { id: "ctx_premotor",    level: "cortex", part: "premotor", produces: "limb_apraxia",
    note: "premotor cortex — limb (motor) apraxia (impaired skilled movement, power intact); MCA superior" },
  { id: "ctx_sma",         level: "cortex", part: "sma", produces: "alien_limb",
    note: "supplementary motor area — SMA syndrome (alien limb, akinesia); ACA / parasagittal" },
  { id: "ctx_micturition", level: "cortex", part: "paracentral", produces: "urinary_incontinence",
    note: "superomedial frontal / paracentral micturition centre — cortical urinary incontinence; ACA" },
  { id: "ctx_gait",        level: "cortex", part: "paracentral", produces: "gait_apraxia",
    note: "medial / parasagittal frontal — frontal gait apraxia (magnetic gait, NPH); ACA" },
  // Parietal (primary sensory in MCA superior; association parietal in MCA inferior)
  { id: "ctx_sensory_arm", level: "cortex", part: "sensory_facearm", produces: "cortical_sensory_arm",
    note: "postcentral face/arm sensory — MCA superior division" },
  { id: "ctx_sensory_leg", level: "cortex", part: "sensory_leg", produces: "cortical_sensory_leg",
    note: "postcentral leg sensory (paracentral) — ACA territory" },
  // dominant angular/supramarginal gyrus — Gerstmann EMERGES from the tetrad co-occurring at one site
  { id: "ctx_gerst_agraphia", level: "cortex", part: "parietal", produces: "agraphia", hemisphere: "dominant",
    note: "dominant angular gyrus — agraphia (Gerstmann)" },
  { id: "ctx_gerst_acalculia", level: "cortex", part: "parietal", produces: "acalculia", hemisphere: "dominant",
    note: "dominant angular gyrus — acalculia (Gerstmann)" },
  { id: "ctx_gerst_finger", level: "cortex", part: "parietal", produces: "finger_agnosia", hemisphere: "dominant",
    note: "dominant angular gyrus — finger agnosia (Gerstmann)" },
  { id: "ctx_gerst_lrd", level: "cortex", part: "parietal", produces: "left_right_disorientation", hemisphere: "dominant",
    note: "dominant angular gyrus — left–right disorientation (Gerstmann)" },
  { id: "ctx_neglect",     level: "cortex", part: "parietal", produces: "neglect", hemisphere: "nondominant",
    note: "non-dominant parietal — hemispatial neglect (contralesional)" },
  { id: "ctx_anosognosia", level: "cortex", part: "parietal", produces: "anosognosia", hemisphere: "nondominant",
    note: "non-dominant parietal — anosognosia" },
  { id: "ctx_constructional", level: "cortex", part: "parietal", produces: "constructional_apraxia", hemisphere: "nondominant",
    note: "non-dominant parietal — constructional apraxia" },
  { id: "ctx_ideomotor",   level: "cortex", part: "parietal", produces: "ideomotor_apraxia", hemisphere: "dominant",
    note: "dominant supramarginal gyrus — ideomotor apraxia (impaired gesture / tool pantomime)" },
  { id: "ctx_dressing",    level: "cortex", part: "parietal", produces: "dressing_apraxia", hemisphere: "nondominant",
    note: "non-dominant parietal — dressing apraxia" },
  { id: "ctx_inf_quadrant", level: "cortex", part: "parietal", produces: "inferior_quadrantanopia",
    note: "parietal (dorsal) optic radiations — inferior quadrantanopia" },
  // bilateral parieto-occipital — Balint syndrome EMERGES from the triad (all bilateralOnly)
  { id: "ctx_balint_oa",  level: "cortex", part: "parietal", produces: "optic_ataxia", bilateralOnly: true,
    note: "bilateral parieto-occipital — optic ataxia (Balint)" },
  { id: "ctx_balint_oma", level: "cortex", part: "parietal", produces: "oculomotor_apraxia", bilateralOnly: true,
    note: "bilateral parieto-occipital — oculomotor apraxia (Balint)" },
  { id: "ctx_balint_sim", level: "cortex", part: "parietal", produces: "simultanagnosia", bilateralOnly: true,
    note: "bilateral parieto-occipital — simultanagnosia (Balint)" },
  // Temporal
  // Wernicke (temporoparietal, dominant) DECOMPOSED — impaired comprehension + impaired repetition.
  { id: "ctx_wernicke_comp",       level: "cortex", part: "temporoparietal", produces: "comprehension_impaired", hemisphere: "dominant",
    note: "dominant temporoparietal (Wernicke) — impaired comprehension" },
  { id: "ctx_wernicke_repetition", level: "cortex", part: "temporoparietal", produces: "repetition_impaired", hemisphere: "dominant",
    note: "dominant temporoparietal (Wernicke) — impaired repetition (perisylvian)" },
  { id: "ctx_sensory_prosody", level: "cortex", part: "temporoparietal", produces: "sensory_dysprosody", hemisphere: "nondominant",
    note: "non-dominant temporoparietal — sensory aprosodia" },
  // The rest of the perisylvian / watershed language map (all dominant; new parts, NOT in DIVISION).
  { id: "ctx_arcuate", level: "cortex", part: "arcuate", produces: "repetition_impaired", hemisphere: "dominant",
    note: "arcuate fasciculus / supramarginal gyrus — CONDUCTION aphasia (repetition impaired, fluency + comprehension intact)" },
  { id: "ctx_tcma", level: "cortex", part: "watershed_anterior", produces: "speech_nonfluent", hemisphere: "dominant",
    note: "anterior watershed (ACA-MCA border / SMA) — TRANSCORTICAL MOTOR (non-fluent, repetition SPARED)" },
  { id: "ctx_tcsa", level: "cortex", part: "watershed_posterior", produces: "comprehension_impaired", hemisphere: "dominant",
    note: "posterior watershed (MCA-PCA border) — TRANSCORTICAL SENSORY (impaired comprehension, repetition SPARED)" },
  { id: "ctx_anomic", level: "cortex", part: "angular", produces: "naming_impaired", hemisphere: "dominant",
    note: "angular gyrus — ANOMIC aphasia (isolated naming failure; the least-localising aphasia)" },
  // Subcortical aphasia feature structures (composer-only level so they don't pollute the plain
  // subcortex / basal-ganglia sites; reused by the subcortical-aphasia composites in sites.js).
  { id: "th_aphasia_comp",     level: "aphasia_subcortical", part: "thalamic", produces: "comprehension_impaired", hemisphere: "dominant",
    note: "dominant thalamus — thalamic aphasia (fluent, anomic, variable comprehension, repetition preserved)" },
  { id: "th_aphasia_naming",   level: "aphasia_subcortical", part: "thalamic", produces: "naming_impaired", hemisphere: "dominant",
    note: "dominant thalamus — anomia of thalamic aphasia" },
  { id: "sc_aphasia_nonfluent",level: "aphasia_subcortical", part: "striatocapsular", produces: "speech_nonfluent", hemisphere: "dominant",
    note: "dominant striatum / internal capsule — striatocapsular aphasia (non-fluent, dysarthric)" },
  { id: "ctx_hallucinations", level: "cortex", part: "temporal", produces: "hallucinations",
    note: "temporal lobe (either side) — hallucinations / episodic fear" },
  { id: "ctx_mood",        level: "cortex", part: "temporal", produces: "mood_change",
    note: "temporal lobe (either side) — episodic mood change" },
  { id: "ctx_verbal_memory", level: "cortex", part: "temporal", produces: "verbal_memory_impairment", hemisphere: "dominant",
    note: "dominant temporal — verbal short-term memory" },
  { id: "ctx_nonverbal_memory", level: "cortex", part: "temporal", produces: "nonverbal_memory_impairment", hemisphere: "nondominant",
    note: "non-dominant temporal — non-verbal short-term memory" },
  { id: "ctx_sup_quadrant", level: "cortex", part: "temporal", produces: "superior_quadrantanopia",
    note: "temporal (Meyer's loop) optic radiations — superior quadrantanopia" },
  // Occipital
  { id: "ctx_visual_cortex", level: "cortex", part: "occipital", produces: "homonymous_hemianopia",
    note: "primary visual cortex — PCA territory" },
  { id: "ctx_macular", level: "cortex", part: "occipital", produces: "macular_sparing",
    note: "occipital pole (dual MCA/PCA supply) — macular sparing, the PCA-occipital hallmark" },
  { id: "ctx_anton",       level: "cortex", part: "occipital", produces: "cortical_blindness", bilateralOnly: true,
    note: "bilateral occipital — Anton's syndrome (needs both sides)" },
  // Primary auditory (Heschl) + anterior temporal — both BILATERAL syndromes (Anton/Balint pattern)
  { id: "ctx_cortical_deafness", level: "cortex", part: "auditory", produces: "cortical_deafness", bilateralOnly: true,
    note: "bilateral primary auditory cortex (Heschl) — cortical deafness / auditory agnosia (needs both sides)" },
  { id: "ctx_kluver_bucy", level: "cortex", part: "anterior_temporal", produces: "kluver_bucy", bilateralOnly: true,
    note: "bilateral anterior temporal / amygdala — Klüver-Bucy syndrome (needs both sides)" },
  // Ventral occipitotemporal (fusiform) — the "what" stream: objects, colour, faces, word-form.
  { id: "ctx_visual_agnosia", level: "cortex", part: "fusiform", produces: "visual_agnosia", bilateralOnly: true,
    note: "bilateral ventral occipitotemporal — visual (object) agnosia (needs both sides)" },
  { id: "ctx_achromatopsia",  level: "cortex", part: "fusiform", produces: "achromatopsia", bilateralOnly: true,
    note: "bilateral ventral occipital (V4) — cerebral achromatopsia (needs both sides)" },
  { id: "ctx_prosopagnosia",  level: "cortex", part: "fusiform", produces: "prosopagnosia", hemisphere: "nondominant",
    note: "non-dominant fusiform gyrus — prosopagnosia (face recognition)" },
  { id: "ctx_alexia",         level: "cortex", part: "fusiform", produces: "alexia_without_agraphia", hemisphere: "dominant",
    note: "dominant fusiform (visual word form area) + splenial disconnection — alexia without agraphia (pure alexia)" },

  // ---- SUBCORTEX (deep grey + deep white; part = deep structure, territory annotated in sites.js) ----
  // Everything here is CONTRALATERAL (above all decussations) and lateralised — so no `crosses`
  // override (findings.CROSSES already contra for these) and no hemisphere/bilateral gate. The
  // internal capsule packs face+arm+leg corticospinal/corticobulbar fibres into one compact site,
  // reusing the cortical somatotopic findings: pure-motor localisation then EMERGES from parsimony
  // (a cortical explanation for all three over-predicts cortical signs) — no bespoke finding needed.
  { id: "ic_cst_arm",  level: "subcortex", part: "internal_capsule", produces: "weak_arm",
    note: "corticospinal fibres (arm) in the posterior limb of the internal capsule" },
  { id: "ic_cst_leg",  level: "subcortex", part: "internal_capsule", produces: "weak_leg",
    note: "corticospinal fibres (leg) in the posterior limb of the internal capsule" },
  { id: "ic_cbt_face", level: "subcortex", part: "internal_capsule", produces: "facial_weakness",
    note: "corticobulbar fibres (lower face UMN) in the genu/posterior limb" },
  { id: "ic_cbt_forehead", level: "subcortex", part: "internal_capsule", produces: "forehead_spared",
    note: "corticobulbar UMN — forehead spared" },
  { id: "thal_dc",   level: "subcortex", part: "thalamus", produces: "dorsal_sensory",
    note: "VPL thalamus — the relay for the (already crossed) medial lemniscus" },
  { id: "thal_stt",  level: "subcortex", part: "thalamus", produces: "spinothalamic",
    note: "VPL thalamus — the relay for the (already crossed) spinothalamic tract" },
  { id: "thal_pain", level: "subcortex", part: "thalamus", produces: "thalamic_pain",
    note: "VPL thalamus — central post-stroke pain (Déjerine–Roussy), the same lesion delayed" },
  // Other thalamic nuclei — a DEDICATED `thalamus` level (like thalamus_arousal / aphasia_subcortical), so the
  // `subcortex/thalamus` VPL relay is untouched and the subcortex "no gated structure" invariant holds.
  { id: "thal_vpm",  level: "thalamus", part: "vpm", produces: "face_sensory_loss",
    note: "VPM thalamus — contralateral facial (trigeminothalamic) sensory relay (crossed face sensory, vs ipsilateral brainstem trigeminal)" },
  { id: "thal_vl",   level: "thalamus", part: "vl", produces: "thalamic_tremor",
    note: "ventral anterior/lateral (VA/VL) — motor relay (dentato-/pallido-thalamic); thalamic tremor / dystonic 'thalamic hand'" },
  { id: "thal_pulvinar", level: "thalamus", part: "pulvinar", produces: "neglect", hemisphere: "nondominant",
    note: "pulvinar / posterior thalamus — thalamic (contralateral) neglect" },
  { id: "thal_amnesia", level: "thalamus", part: "limbic", produces: "amnesia",
    note: "anterior + dorsomedial nuclei (Papez / mammillothalamic) — diencephalic anterograde amnesia" },

  // ---- HYPOTHALAMUS (composer-only MIDLINE level; functions are midline/bilateral) ----
  { id: "hy_di",         level: "hypothalamus", part: "supraoptic",       produces: "diabetes_insipidus",
    note: "supraoptic / paraventricular — ADH; lesion → central diabetes insipidus" },
  { id: "hy_thermo",     level: "hypothalamus", part: "thermoregulatory", produces: "thermodysregulation",
    note: "anterior/preoptic (heat loss, hyperthermia if lesioned) ↔ posterior (heat conservation / poikilothermia)" },
  { id: "hy_vmn",        level: "hypothalamus", part: "ventromedial",     produces: "hyperphagia",
    note: "ventromedial nucleus (satiety) — lesion → hyperphagia / obesity (± rage)" },
  { id: "hy_lateral",    level: "hypothalamus", part: "lateral",          produces: "narcolepsy",
    note: "lateral hypothalamic area — orexin (narcolepsy); also hunger (aphagia/wasting if lesioned)" },
  { id: "hy_scn",        level: "hypothalamus", part: "suprachiasmatic",  produces: "circadian_disruption",
    note: "suprachiasmatic nucleus — circadian pacemaker; lesion → sleep-wake / circadian disruption" },
  { id: "hy_mammillary", level: "hypothalamus", part: "mammillary",       produces: "amnesia",
    note: "mammillary bodies (Papez) — Wernicke-Korsakoff amnesia (shares the diencephalic amnesia finding)" },
  { id: "hy_tuberal",    level: "hypothalamus", part: "tuberal",          produces: "endocrine_dysfunction",
    note: "tuberal / arcuate — hypothalamic-pituitary axis (hypopituitarism, hyperprolactinaemia, precocious puberty)" },

  // ---- CORPUS CALLOSUM (callosal disconnection / split-brain; midline tract — a disconnection syndrome) ----
  // A tract is just a site; the disconnection deficit is the finding. Anterior (genu/body) = verbal-motor
  // disconnection (left-hand apraxia/agraphia, alien hand); splenium = visuotactile disconnection.
  { id: "cc_apraxia", level: "corpus_callosum", part: "anterior", produces: "callosal_apraxia",
    note: "anterior corpus callosum (genu/body) — left-hand (verbal-command) apraxia + agraphia (left-hemisphere language cut off from right motor cortex)" },
  { id: "cc_alien",   level: "corpus_callosum", part: "anterior", produces: "alien_limb",
    note: "anterior corpus callosum — alien hand / intermanual conflict (reuses the alien-limb finding shared with the SMA)" },
  { id: "cc_tactile", level: "corpus_callosum", part: "splenium", produces: "tactile_anomia",
    note: "splenium / posterior body — left-hand tactile anomia (right-hemisphere somatosensation cut off from left-hemisphere language); the splenium is also the visual half of pure alexia (word form at the VWFA)" },
  { id: "stn",       level: "basal_ganglia", part: "subthalamic", produces: "hemiballismus",
    note: "subthalamic nucleus — contralateral hemiballismus" },
  { id: "optic_rad", level: "subcortex", part: "optic_radiation", produces: "homonymous_hemianopia",
    note: "deep optic radiation (retrolenticular/anterior choroidal) — hemianopia with NO cortical signs" },

  // ---- BASAL GANGLIA (extrapyramidal movement nuclei; all CONTRALATERAL, above every decussation —
  // no crosses override, inherit findings.CROSSES) ----
  // A focal/structural lesion of one nucleus gives the contralateral HEMI-syndrome; the bilateral
  // degenerative disease (PD, Huntington's) comes from composeBasalGangliaBilateralSites (sites.js) and
  // is NAMED by the phonebook — the anatomy stays pure. The subthalamic nucleus (stn, above) is the
  // fourth nucleus, relocated here from subcortex.
  // substantia nigra pars compacta (nigrostriatal) — contralateral parkinsonism EMERGES from bradykinesia
  // + rest tremor + rigidity
  { id: "snc_brady",  level: "basal_ganglia", part: "substantia_nigra", produces: "bradykinesia",
    note: "substantia nigra pars compacta — contralateral bradykinesia" },
  { id: "snc_tremor", level: "basal_ganglia", part: "substantia_nigra", produces: "rest_tremor",
    note: "substantia nigra pars compacta — contralateral rest tremor" },
  { id: "snc_rigid",      level: "basal_ganglia", part: "substantia_nigra", produces: "rigidity",
    note: "substantia nigra — extrapyramidal rigidity (tone-axis companion, non-localising)" },
  { id: "striatum_chorea",level: "basal_ganglia", part: "striatum",         produces: "chorea",
    note: "striatum (caudate + putamen) — contralateral chorea / choreoathetosis" },
  { id: "gp_dystonia",    level: "basal_ganglia", part: "globus_pallidus",  produces: "dystonia",
    note: "globus pallidus — contralateral dystonia" },

  // ---- CEREBELLUM (the organ; distinct from its brainstem peduncles) ----
  // Hemisphere = IPSILATERAL appendicular signs (no crosses override — limb_ataxia & companions inherit
  // CROSSES:false). Vermis & flocculonodular = MIDLINE axial/vestibulocerebellar signs, all
  // NON_LATERALISED (@none). Sites: hemisphere via buildSites (lateralised); vermis + flocculonodular via
  // composeCerebellumMidlineSites; a diffuse pancerebellar composite via composeCerebellumPancerebellarSites.
  { id: "cb_hemi_ataxia",    level: "cerebellum", part: "hemisphere", produces: "limb_ataxia",
    note: "cerebellar hemisphere — ipsilateral limb ataxia" },
  { id: "cb_hemi_dysmetria", level: "cerebellum", part: "hemisphere", produces: "dysmetria",
    note: "cerebellar hemisphere — ipsilateral dysmetria (past-pointing)" },
  { id: "cb_hemi_ddk",       level: "cerebellum", part: "hemisphere", produces: "dysdiadochokinesis",
    note: "cerebellar hemisphere — ipsilateral dysdiadochokinesis" },
  { id: "cb_hemi_tremor",    level: "cerebellum", part: "hemisphere", produces: "intention_tremor",
    note: "cerebellar hemisphere — ipsilateral intention tremor" },
  { id: "cb_vermis_truncal",   level: "cerebellum", part: "vermis", produces: "truncal_ataxia",
    note: "cerebellar vermis — truncal / gait ataxia (axial, midline)" },
  { id: "cb_vermis_dysarthria",level: "cerebellum", part: "vermis", produces: "ataxic_dysarthria",
    note: "cerebellar vermis (paravermal) — ataxic / scanning dysarthria" },
  { id: "cb_flocc_gaze",  level: "cerebellum", part: "flocculonodular", produces: "nystagmus_gaze_evoked",
    note: "flocculonodular lobe (vestibulocerebellum) — gaze-evoked / central nystagmus" },

  // ---- PERIPHERAL VESTIBULAR (labyrinth / inner ear) ----
  // The peripheral end of the vestibular system: unidirectional fixation-suppressed nystagmus + vertigo.
  // Ipsilateral (cn8_vertigo inherits CROSSES:false; nystagmus_peripheral is NON_LATERALISED @none). No
  // hearing_loss on the core site — vestibular neuritis spares hearing; labyrinthitis/Ménière (+ hearing)
  // is labyrinth + cochlear, left to emerge by company.
  { id: "vest_periph_nyst",   level: "peripheral_vestibular", part: "labyrinth", produces: "nystagmus_peripheral",
    note: "labyrinth — peripheral (unidirectional, fixation-suppressed) nystagmus" },
  { id: "vest_periph_vertigo", level: "peripheral_vestibular", part: "labyrinth", produces: "cn8_vertigo",
    note: "labyrinth / vestibular nerve — vertigo (vestibular neuritis, labyrinthitis, Ménière, BPPV)" },
  { id: "vest_head_impulse", level: "peripheral_vestibular", part: "labyrinth", produces: "head_impulse_abnormal",
    note: "labyrinth / vestibular nerve — abnormal head impulse (corrective saccade); the peripheral HINTS sign" },
  // canal-specific BPPV — positional nystagmus DIRECTION localises the semicircular canal
  { id: "bppv_post",  level: "peripheral_vestibular", part: "posterior_canal",  produces: "nystagmus_positional_posterior",  note: "posterior semicircular canal — up-beat torsional positional nystagmus (BPPV)" },
  { id: "bppv_horiz", level: "peripheral_vestibular", part: "horizontal_canal", produces: "nystagmus_positional_horizontal", note: "horizontal (lateral) canal — horizontal positional nystagmus (BPPV)" },
  { id: "bppv_ant",   level: "peripheral_vestibular", part: "anterior_canal",   produces: "nystagmus_positional_anterior",   note: "anterior canal — down-beat torsional positional nystagmus (BPPV, rare)" },

  // ---- CENTRAL VESTIBULAR (vestibular nucleus / nodulus) — the lean HINTS-central AVS site ----
  // The central counterpart to the peripheral labyrinth: continuous vertigo with a NORMAL head impulse,
  // direction-changing nystagmus and skew — a posterior-circulation stroke. Lean, so an isolated central
  // AVS localises here rather than over-predicting the rest of Wallenberg.
  { id: "cv_vertigo", level: "central_vestibular", part: "nucleus", produces: "cn8_vertigo",          note: "central vestibular (vestibular nucleus / nodulus) — vertigo" },
  { id: "cv_nyst",    level: "central_vestibular", part: "nucleus", produces: "nystagmus_gaze_evoked", note: "central vestibular — direction-changing / gaze-evoked nystagmus" },
  { id: "cv_skew",    level: "central_vestibular", part: "nucleus", produces: "skew_deviation",        note: "central vestibular — skew deviation (the central HINTS sign)" },

  // ---- CENTRAL DIRECTIONAL NYSTAGMUS GENERATORS (midline; type is the localiser) ----
  { id: "cvj_downbeat",  level: "craniocervical_junction", part: "foramen_magnum", produces: "nystagmus_downbeat",
    note: "craniocervical junction / floor of IV ventricle — downbeat nystagmus (Chiari, foramen-magnum lesion)" },
  { id: "ponto_upbeat",  level: "pontomesencephalic", part: "tegmentum", produces: "nystagmus_upbeat",
    note: "pontomesencephalic / medullary tegmentum — upbeat nystagmus" },

  // ---- VISUAL PATHWAY (chiasm → optic tract → LGN; optic nerve is the skull-base optic canal, the
  // radiation is subcortex/temporal/parietal, the terminus is occipital cortex). Field-defect geometry
  // localises. RAPD (afferent) rides the optic nerve + optic tract only — pupil fibres leave at the
  // tract — so it separates pre- from post-geniculate. Chiasm is a MIDLINE site (composeVisualPathwaySites).
  { id: "chiasm_bitemp", level: "visual_pathway", part: "chiasm", produces: "bitemporal_hemianopia", crosses: false,
    note: "optic chiasm — decussating nasal fibres → bitemporal hemianopia (pituitary/parasellar), midline" },
  { id: "ot_hh",   level: "visual_pathway", part: "optic_tract", produces: "homonymous_hemianopia",
    note: "optic tract — contralateral (incongruous) homonymous hemianopia" },
  { id: "ot_rapd", level: "visual_pathway", part: "optic_tract", produces: "rapd", crosses: true,
    note: "optic tract — contralateral RAPD (afferent fibres still present → the pre-geniculate marker)" },
  { id: "lgn_hh",  level: "visual_pathway", part: "lgn", produces: "homonymous_hemianopia",
    note: "lateral geniculate nucleus — contralateral homonymous hemianopia, NO RAPD (post-geniculate for pupils)" },

  // ---- PUPILLARY EFFERENT (parasympathetic light-reflex limb) ----
  // The parasympathetic fibres run on the SURFACE of CN III, so the pupil localises: a compressive lesion
  // (aneurysm/uncal) is pupil-INVOLVING, an ischaemic one is pupil-SPARING. Adie (ciliary ganglion) and
  // Argyll Robertson (pretectum) share light-near dissociation, separated by the fixed dilated pupil +
  // laterality (Adie unilateral tonic-dilated; AR small bilateral). Pretectum is a BILATERAL site.
  // CN III trunk (subarachnoid) — compressive palsy (PCOM aneurysm / uncal herniation); the four ductions
  { id: "cmp_cn3_ptosis", level: "pupil", part: "cn3_compressive", produces: "ptosis",         note: "compressive CN III — ptosis" },
  { id: "cmp_cn3_add",    level: "pupil", part: "cn3_compressive", produces: "weak_adduction",  note: "compressive CN III — weak adduction" },
  { id: "cmp_cn3_elev",   level: "pupil", part: "cn3_compressive", produces: "weak_elevation",  note: "compressive CN III — weak elevation" },
  { id: "cmp_cn3_depr",   level: "pupil", part: "cn3_compressive", produces: "weak_depression", note: "compressive CN III — weak depression" },
  { id: "cmp_pupil", level: "pupil", part: "cn3_compressive", produces: "fixed_dilated_pupil",
    note: "surface parasympathetic fibres compressed first — pupil-INVOLVING (surgical emergency)" },
  // CN III trunk — microvascular ischaemia (diabetes/HTN); core hit, surface SPARED → pupil-sparing (no pupil structure)
  { id: "isch_cn3_ptosis", level: "pupil", part: "cn3_ischaemic", produces: "ptosis",         note: "ischaemic CN III — ptosis (pupil-sparing)" },
  { id: "isch_cn3_add",    level: "pupil", part: "cn3_ischaemic", produces: "weak_adduction",  note: "ischaemic CN III — weak adduction" },
  { id: "isch_cn3_elev",   level: "pupil", part: "cn3_ischaemic", produces: "weak_elevation",  note: "ischaemic CN III — weak elevation" },
  { id: "isch_cn3_depr",   level: "pupil", part: "cn3_ischaemic", produces: "weak_depression", note: "ischaemic CN III — weak depression" },
  { id: "cg_pupil",  level: "pupil", part: "ciliary_ganglion", produces: "fixed_dilated_pupil",
    note: "ciliary ganglion (postganglionic parasympathetic) — dilated pupil (Adie)" },
  { id: "cg_lnd",    level: "pupil", part: "ciliary_ganglion", produces: "light_near_dissociation",
    note: "Adie tonic pupil — light-near dissociation (near response preserved, tonic re-dilation)" },
  { id: "ar_lnd",    level: "pupil", part: "pretectum", produces: "light_near_dissociation",
    note: "pretectum / dorsal midbrain (light-reflex relay) — Argyll Robertson (small bilateral, light-near dissociation)" },

  // ---- DORSAL MIDBRAIN / TECTUM (supranuclear vertical gaze — Parinaud) ----
  // The posterior commissure / rostral interstitial MLF (riMLF) and pretectum. A dorsal-midbrain lesion
  // (pineal tumour, tectal infarct, hydrocephalus) gives a supranuclear VERTICAL gaze palsy — distinct
  // from the CN III fascicle/nucleus (nuclear/infranuclear). Parinaud emerges as the UNION of these tectal
  // structures with the pretectal light-reflex relay (ar_lnd), the skull-base nesting pattern (see sites.js).
  { id: "tect_vgaze",   level: "dorsal_midbrain", part: "tectum", produces: "vertical_gaze_palsy",
    note: "posterior commissure / riMLF — supranuclear vertical (up-) gaze palsy (dorsal midbrain)" },
  { id: "tect_convret", level: "dorsal_midbrain", part: "tectum", produces: "nystagmus_convergence_retraction",
    note: "pretectum — convergence-retraction nystagmus on attempted upgaze" },
  { id: "tect_lid",     level: "dorsal_midbrain", part: "tectum", produces: "lid_retraction",
    note: "posterior commissure — Collier's sign (bilateral lid retraction)" },

  // ---- CONSCIOUSNESS / AROUSAL (ARAS, paramedian thalamus, diffuse cortex, locked-in) ----
  // Composer-only levels (not in LEVELS/PARTS) — assembled by composeConsciousnessSites(). The brainstem
  // ARAS is a midline paramedian tegmental lesion (a single lesion suffices); it carries decerebrate
  // (extensor) posturing, the co-located structural-coma motor sign. The paramedian-thalamus (intralaminar,
  // DISTINCT from the subcortex VPL relay) and diffuse-cortex arousal structures are bilateralOnly (need
  // both hemispheres — a unilateral lesion spares consciousness: content vs arousal). Locked-in is a
  // bilateral ventral-pons (basis pontis) site: bilateral corticospinal (cst_pons) → quadriplegia, ARAS
  // spared → awake.
  { id: "thal_aras", level: "thalamus_arousal", part: "paramedian", produces: "reduced_consciousness", bilateralOnly: true,
    note: "intralaminar / paramedian thalamus — arousal relay of the ARAS; BILATERAL only (artery of Percheron)" },
  { id: "thal_vgaze_bilat", level: "thalamus_arousal", part: "paramedian", produces: "vertical_gaze_palsy", bilateralOnly: true,
    note: "meso-diencephalic junction — Percheron's vertical gaze palsy; BILATERAL only" },
  { id: "aras_brainstem", level: "brainstem_aras", part: "paramedian_tegmentum", produces: "reduced_consciousness",
    note: "paramedian rostral pons/midbrain tegmentum — ascending reticular activating system (arousal)" },
  { id: "aras_posturing", level: "brainstem_aras", part: "paramedian_tegmentum", produces: "extensor_posturing",
    note: "upper brainstem (red nucleus↔vestibular nuclei) — decerebrate (extensor) posturing" },
  { id: "cereb_diffuse", level: "cerebrum", part: "diffuse", produces: "reduced_consciousness", bilateralOnly: true,
    note: "diffuse bihemispheric cortical dysfunction (metabolic / anoxic) — the structural correlate of encephalopathy" },
  { id: "li_ocular", level: "locked_in", part: "ventral_pons", produces: "preserved_vertical_gaze",
    note: "locked-in — preserved vertical eye movements / blink (dorsal tegmentum spared by a ventral basis pontis lesion)" },

  // ---- CORTICAL HAND-KNOB (precentral gyrus) — isolated cortical hand weakness ----
  // A small precentral 'hand knob' stroke gives isolated hand/finger weakness that MIMICS a peripheral
  // (ulnar/radial/C8) lesion — but it is UMN (brisk reflexes, extensor plantar) with no wasting/sensory-nerve
  // territory. weak_hand is produced ONLY here, so it localises by parsimony; babinski marks the UMN nature.
  { id: "ctx_hand_knob", level: "cortex", part: "hand_knob", produces: "weak_hand", note: "precentral hand knob — isolated contralateral hand weakness (cortical hand)" },
  { id: "ctx_hand_bab",  level: "cortex", part: "hand_knob", produces: "babinski",   note: "hand-knob stroke — extensor plantar (UMN; separates it from a peripheral hand lesion)" },
  // POSTCENTRAL sensory hand — the sensory analogue: isolated cortical hand sensory loss (pseudo-peripheral;
  // with perioral loss = cheiro-oral syndrome, the hand↔mouth homuncular adjacency).
  { id: "ctx_sens_hand", level: "cortex", part: "sensory_hand", produces: "cortical_sensory_hand", note: "postcentral hand — isolated contralateral hand sensory loss (cortical / pseudo-peripheral)" },

  // ---- CORONA RADIATA (deep white matter) — the corticospinal descent above the internal capsule ----
  // A pure-motor lacune here is clinically indistinguishable from a capsular one (it ties the internal
  // capsule); it completes the corticospinal white-matter chain cortex → corona radiata → internal capsule
  // → basis pontis, and is named separately in the phonebook. Contralateral (standard crossing).
  { id: "cr_arm",  level: "subcortex", part: "corona_radiata", produces: "weak_arm",        note: "corona radiata — contralateral arm weakness" },
  { id: "cr_leg",  level: "subcortex", part: "corona_radiata", produces: "weak_leg",        note: "corona radiata — contralateral leg weakness" },
  { id: "cr_face", level: "subcortex", part: "corona_radiata", produces: "facial_weakness", note: "corona radiata — contralateral facial UMN" },
  { id: "cr_forehead", level: "subcortex", part: "corona_radiata", produces: "forehead_spared", note: "corona radiata — forehead spared (UMN)" },
  { id: "cr_bab",  level: "subcortex", part: "corona_radiata", produces: "babinski",         note: "corona radiata — extensor plantar" },
  { id: "cr_hof",  level: "subcortex", part: "corona_radiata", produces: "hoffmann",         note: "corona radiata — Hoffmann" },
  { id: "cr_spast",level: "subcortex", part: "corona_radiata", produces: "spasticity",       note: "corona radiata — increased tone" },

  // ---- PSEUDOBULBAR PALSY (bilateral corticobulbar) — composer-only BILATERAL level ----
  // Bilateral UMN of the bulbar muscles: dysarthria + dysphagia + pathological affect (emotional lability) +
  // a brisk jaw jerk + spastic tongue. Distinct from LMN bulbar palsy (nucleus ambiguus / motor unit →
  // dysphagia + dysarthria, tongue wasting + fasciculation). Emotional lability is the discriminating pseudobulbar sign.
  { id: "pbulb_dysarthria", level: "pseudobulbar", part: "corticobulbar", produces: "dysarthria",         note: "bilateral corticobulbar — spastic dysarthria" },
  { id: "pbulb_lability",   level: "pseudobulbar", part: "corticobulbar", produces: "emotional_lability", note: "bilateral corticobulbar — pathological laughing/crying (pseudobulbar affect)" },
  { id: "pbulb_face",       level: "pseudobulbar", part: "corticobulbar", produces: "facial_weakness",    note: "bilateral corticobulbar — bilateral facial UMN weakness" },
  { id: "pbulb_forehead",   level: "pseudobulbar", part: "corticobulbar", produces: "forehead_spared",    note: "bilateral corticobulbar — forehead spared (UMN)" },

  // ---- COMBINED DEGENERATIONS (tract-selective, bilateral) — composer-only level ----
  // Metabolic/hereditary patterns that pick tracts, not vascular territories. SCD (B12/copper): dorsal
  // columns + LATERAL corticospinal, the spinothalamic (pain/temp) SPARED — that STT sparing separates it
  // from a transverse/level lesion. Friedreich: + spinocerebellar (limb ataxia) + areflexia with extensor
  // plantars (the paradoxical hallmark). All BILATERAL (composeCombinedDegenerationSites).
  { id: "scd_dc",     level: "combined_degeneration", part: "scd", produces: "dorsal_sensory", note: "SCD — dorsal columns (vibration/proprioception)" },
  { id: "scd_ataxia", level: "combined_degeneration", part: "scd", produces: "sensory_ataxia", note: "SCD — sensory (Romberg-positive) ataxia" },
  { id: "scd_spast",  level: "combined_degeneration", part: "scd", produces: "spasticity",     note: "SCD — lateral corticospinal (spastic legs)" },
  { id: "scd_bab",    level: "combined_degeneration", part: "scd", produces: "babinski",       note: "SCD — extensor plantars (corticospinal)" },
  { id: "fr_dc",       level: "combined_degeneration", part: "friedreich", produces: "dorsal_sensory", note: "Friedreich — dorsal columns" },
  { id: "fr_ataxia_s", level: "combined_degeneration", part: "friedreich", produces: "sensory_ataxia", note: "Friedreich — sensory ataxia" },
  { id: "fr_ataxia_c", level: "combined_degeneration", part: "friedreich", produces: "limb_ataxia",    note: "Friedreich — spinocerebellar / cerebellar limb ataxia" },
  { id: "fr_bab",      level: "combined_degeneration", part: "friedreich", produces: "babinski",       note: "Friedreich — extensor plantars (corticospinal)" },
  { id: "fr_areflex_k",level: "combined_degeneration", part: "friedreich", produces: "reflex_knee_loss",  note: "Friedreich — areflexia (knee); with extensor plantars = the hallmark paradox" },
  { id: "fr_areflex_a",level: "combined_degeneration", part: "friedreich", produces: "reflex_ankle_loss", note: "Friedreich — areflexia (ankle)" },
  { id: "fr_dysarthria",level: "combined_degeneration", part: "friedreich", produces: "dysarthria",   note: "Friedreich — dysarthria" },

  // ---- OLFACTORY (CN I) ----
  { id: "olf_tract", level: "olfactory", part: "olfactory_groove", produces: "anosmia",
    note: "olfactory bulb / tract on the cribriform plate (olfactory groove) — anosmia; with ipsilateral optic atrophy = Foster-Kennedy" },

  // ---- INSULA (cortex) ----
  { id: "ins_dysarthria", level: "cortex", part: "insula", produces: "dysarthria",
    note: "anterior insula / operculum — dysarthria (general articulation sign)" },
  { id: "ins_gustatory",  level: "cortex", part: "insula", produces: "gustatory_loss",
    note: "insular gustatory cortex — central loss of taste" },

  // ---- BASIS PONTIS (ventral pons) — lacunar ataxic hemiparesis / dysarthria-clumsy-hand ----
  // The ventral (basilar) pons, distinct from the dorsal pons|medial tegmentum — so a basis-pontis lacune
  // SPARES gaze / cn6 / cn7. Carries the three ventral fibre systems; bp_pcf crosses (pontocerebellar
  // decussation) so the ataxia is CONTRA — the same side as the weakness (the ataxic-hemiparesis hallmark).
  { id: "bp_cst_arm", level: "pons", part: "basis_pontis", produces: "weak_arm", crosses: true, note: "corticospinal in the basis pontis — contra arm weakness" },
  { id: "bp_cst_leg", level: "pons", part: "basis_pontis", produces: "weak_leg", crosses: true, note: "corticospinal in the basis pontis — contra leg weakness" },
  { id: "bp_cbt",     level: "pons", part: "basis_pontis", produces: "facial_weakness", crosses: true, note: "corticobulbar in the basis pontis — contra facial UMN" },
  { id: "bp_cbt_forehead", level: "pons", part: "basis_pontis", produces: "forehead_spared", crosses: true, note: "basis pontis corticobulbar — forehead spared (UMN)" },
  { id: "bp_cbt_dys", level: "pons", part: "basis_pontis", produces: "dysarthria",                     note: "corticobulbar → dysarthria (@none)" },
  { id: "bp_pcf",     level: "pons", part: "basis_pontis", produces: "limb_ataxia",     crosses: true, note: "pontocerebellar fibres (cross) — ataxia CONTRA, same side as the weakness (ataxic hemiparesis)" },

  // ---- SKULL BASE (extra-axial cranial nerves) — the PER-NERVE (nerve, compartment) catalogue ----
  // Two axes from one table: (1) each primitive part is a candidate site, so a spared branch localises
  // distally by the over-prediction penalty (the nerve-segments mechanism, now cranial); (2) the foramen
  // syndromes EMERGE from composeSkullBaseSites unioning the per-nerve parts. Every finding is ipsilateral
  // (CROSSES:false) — no crosses override, no gate, no new forward-model path.

  // III oculomotor — pre-divisional trunk (SOF/cavernous, company localises) then orbital divisions.
  // CN III trunk through the cavernous sinus / SOF — company (V2, Horner, other CNs) localises
  { id: "iii_trunk_ptosis", level: "skull_base", part: "iii_trunk", produces: "ptosis",         note: "CN III trunk — ptosis (LPS)" },
  { id: "iii_trunk_add",    level: "skull_base", part: "iii_trunk", produces: "weak_adduction",  note: "CN III trunk — weak adduction (MR)" },
  { id: "iii_trunk_elev",   level: "skull_base", part: "iii_trunk", produces: "weak_elevation",  note: "CN III trunk — weak elevation (SR/IO)" },
  { id: "iii_trunk_depr",   level: "skull_base", part: "iii_trunk", produces: "weak_depression", note: "CN III trunk — weak depression (IR)" },
  // superior division (SR + LPS) — ptosis + failure of elevation
  { id: "iii_orbit_sup_ptosis", level: "skull_base", part: "iii_orbit_sup", produces: "ptosis",        note: "III superior division — ptosis (LPS)" },
  { id: "iii_orbit_sup_elev",   level: "skull_base", part: "iii_orbit_sup", produces: "weak_elevation", note: "III superior division — weak elevation (SR)" },
  // inferior division (MR/IR/IO + parasympathetic) — failed adduction/depression + pupil, ptosis SPARED
  { id: "iii_orbit_inf_add",   level: "skull_base", part: "iii_orbit_inf", produces: "weak_adduction",     note: "III inferior division — weak adduction (MR)" },
  { id: "iii_orbit_inf_depr",  level: "skull_base", part: "iii_orbit_inf", produces: "weak_depression",    note: "III inferior division — weak depression (IR)" },
  { id: "iii_orbit_inf_pupil", level: "skull_base", part: "iii_orbit_inf", produces: "fixed_dilated_pupil", note: "III inferior division — parasympathetic (fixed dilated pupil)" },

  // IV trochlear — nuclear (dorsal midbrain, contralateral) + cisternal (long course) + anterior trunk.
  { id: "iv_trunk_depr", level: "skull_base", part: "iv_trunk", produces: "weak_depression",  note: "CN IV anterior trunk (cavernous / SOF) — weak depression (SO)" },
  { id: "iv_trunk_vd",   level: "skull_base", part: "iv_trunk", produces: "vertical_diplopia", note: "CN IV anterior trunk — vertical diplopia" },
  { id: "cn4_nerve_depr", level: "skull_base", part: "trochlear_cisternal", produces: "weak_depression",  note: "trochlear nerve (IV) cisternal — weak depression (SO); ipsilateral" },
  { id: "cn4_nerve_vd",   level: "skull_base", part: "trochlear_cisternal", produces: "vertical_diplopia", note: "trochlear nerve (IV) cisternal — vertical diplopia" },

  // VI abducens — cisternal → petrous apex (Dorello, Gradenigo) → anterior trunk (cavernous / SOF).
  { id: "vi_cisternal",    level: "skull_base", part: "vi_cisternal",    produces: "weak_abduction",
    note: "CN VI subarachnoid / cisternal course — weak abduction" },
  { id: "vi_petrous_apex", level: "skull_base", part: "vi_petrous_apex", produces: "weak_abduction",
    note: "CN VI at Dorello's canal / petrous apex — weak abduction; with V1 ⇒ Gradenigo via composer" },
  { id: "vi_trunk",        level: "skull_base", part: "vi_trunk",        produces: "weak_abduction",
    note: "CN VI anterior trunk (cavernous sinus / SOF) — weak abduction" },

  // V trigeminal — root (CPA, below) → ganglion (Meckel: all divisions) → V1 SOF / V2 rotundum / V3 ovale;
  // plus a V1 contribution at the petrous apex for Gradenigo. One structure = one finding.
  { id: "vg_v1",  level: "skull_base", part: "v_ganglion", produces: "v1_sensory", note: "Gasserian ganglion (Meckel's cave) — V1" },
  { id: "vg_v2",  level: "skull_base", part: "v_ganglion", produces: "v2_sensory", note: "Gasserian ganglion — V2" },
  { id: "vg_v3",  level: "skull_base", part: "v_ganglion", produces: "v3_sensory", note: "Gasserian ganglion — V3" },
  { id: "vg_jaw", level: "skull_base", part: "v_ganglion", produces: "jaw_weakness", note: "Gasserian ganglion — motor V3 (jaw)" },
  { id: "v1_div", level: "skull_base", part: "v1_division", produces: "v1_sensory", note: "ophthalmic division (V1) — SOF contributor" },
  { id: "rot_v2", level: "skull_base", part: "foramen_rotundum", produces: "v2_sensory", note: "maxillary division (V2) — foramen rotundum" },
  { id: "v3_ovale_sens",  level: "skull_base", part: "v3_ovale", produces: "v3_sensory", note: "mandibular (V3) sensory — foramen ovale" },
  { id: "v3_ovale_motor", level: "skull_base", part: "v3_ovale", produces: "jaw_weakness", note: "mandibular (V3) motor — jaw (foramen ovale)" },
  { id: "v1_petrous",     level: "skull_base", part: "v1_petrous", produces: "v1_sensory", note: "V1 at the petrous apex (Meckel) — the Gradenigo trigeminal contribution" },

  // II optic — optic canal (monocular visual loss + RAPD).
  { id: "opt_cn2",  level: "skull_base", part: "optic_canal", produces: "optic_neuropathy",
    note: "optic nerve (II) in the optic canal — monocular visual loss (orbital-apex discriminator)" },
  { id: "opt_rapd", level: "skull_base", part: "optic_canal", produces: "rapd",
    note: "optic nerve (II) — afferent pupillary defect (RAPD), ipsilateral" },
  // optic-nerve FIELD GEOMETRY — lean sub-patterns of optic neuropathy (each its own site so it localises)
  { id: "aion_field", level: "skull_base", part: "optic_aion", produces: "altitudinal_defect",
    note: "anterior ischaemic optic neuropathy — altitudinal (horizontal) field cut (watershed of the optic disc)" },
  { id: "aion_rapd",  level: "skull_base", part: "optic_aion", produces: "rapd",
    note: "AION — RAPD" },
  { id: "neuritis_field", level: "skull_base", part: "optic_neuritis", produces: "central_scotoma",
    note: "optic neuritis — central scotoma (painful, reduced colour vision; MS/idiopathic/NMO)" },
  { id: "neuritis_rapd",  level: "skull_base", part: "optic_neuritis", produces: "rapd",
    note: "optic neuritis — RAPD" },
  // FUNDOSCOPY at the optic nerve — the pale disc is the chronic END-STATE of any optic neuropathy, and the
  // acuity loss here is organic, so it does NOT correct with a pinhole. That pairing is the discriminator
  // from a refractive error, which is why both are modelled at the same sites.
  { id: "opt_atrophy",   level: "skull_base", part: "optic_canal", produces: "optic_atrophy",
    note: "optic nerve (II) — pale, atrophic disc once the damage is established" },
  { id: "opt_va",        level: "skull_base", part: "optic_canal", produces: "va_reduced_no_pinhole",
    note: "optic nerve (II) — acuity loss that does not correct with a pinhole (organic)" },
  { id: "aion_atrophy",  level: "skull_base", part: "optic_aion", produces: "optic_atrophy",
    note: "AION — the swollen disc becomes pale and atrophic over weeks" },
  { id: "aion_va",       level: "skull_base", part: "optic_aion", produces: "va_reduced_no_pinhole",
    note: "AION — organic acuity loss, no pinhole improvement" },
  { id: "neuritis_atrophy", level: "skull_base", part: "optic_neuritis", produces: "optic_atrophy",
    note: "optic neuritis — temporal disc pallor follows the acute attack" },
  { id: "neuritis_va",   level: "skull_base", part: "optic_neuritis", produces: "va_reduced_no_pinhole",
    note: "optic neuritis — organic acuity loss, no pinhole improvement" },

  // THE RETINA — a separate place from the optic nerve. A retinal ARTERY occlusion whitens the retina and
  // leaves a cherry-red spot (the fovea, fed by the choroid, keeps its colour). It is a stroke of the eye:
  // ophthalmic/internal-carotid territory, and it is measured in minutes to hours, not days.
  { id: "retina_pallor", level: "visual_pathway", part: "retina", produces: "retinal_pallor", crosses: false,
    note: "retinal artery occlusion — whitened ischaemic retina with a cherry-red spot (ipsilateral eye)" },
  { id: "retina_va",     level: "visual_pathway", part: "retina", produces: "va_reduced_no_pinhole", crosses: false,
    note: "retinal artery occlusion — sudden painless organic acuity loss, no pinhole improvement" },
  { id: "retina_rapd",   level: "visual_pathway", part: "retina", produces: "rapd", crosses: false,
    note: "retinal artery occlusion — RAPD (the afferent limb fails at the retina, before the nerve)" },

  // Oculosympathetic in the orbital fissure — COMPOSITE-ONLY (part not in PARTS, so no standalone site;
  // isolated Horner belongs to the Horner-order axis). Contributes Horner to SOF / cavernous / orbital apex.
  { id: "sof_symp_miosis", level: "skull_base", part: "orbital_sympathetic", produces: "miosis",
    note: "oculosympathetic fibres entering the orbit (SOF / cavernous) — miosis" },
  { id: "sof_symp_ptosis", level: "skull_base", part: "orbital_sympathetic", produces: "ptosis",
    note: "oculosympathetic (SOF / cavernous) — partial ptosis" },

  // VII facial — meatal (IAM, with VIII) then intratemporal chain; each distal segment spares one branch.
  { id: "iam_vii_motor", level: "skull_base", part: "iam", produces: "facial_weakness", crosses: false,         note: "IAM — facial motor (VII), before geniculate" },
  { id: "iam_vii_lacr",  level: "skull_base", part: "iam", produces: "lacrimation_loss", note: "IAM — greater petrosal (lacrimation)" },
  { id: "iam_vii_hyper", level: "skull_base", part: "iam", produces: "hyperacusis",      note: "IAM — nerve to stapedius (hyperacusis)" },
  { id: "iam_vii_taste", level: "skull_base", part: "iam", produces: "taste_loss",       note: "IAM — chorda tympani (taste)" },
  { id: "iam_viii",      level: "skull_base", part: "iam", produces: "hearing_loss",     note: "IAM — cochlear nerve (VIII); the meatal-vs-geniculate discriminator" },
  { id: "vii_gen_motor", level: "skull_base", part: "vii_geniculate", produces: "facial_weakness", crosses: false,         note: "geniculate — motor (Ramsay Hunt)" },
  { id: "vii_gen_lacr",  level: "skull_base", part: "vii_geniculate", produces: "lacrimation_loss", note: "geniculate — greater petrosal (lacrimation)" },
  { id: "vii_gen_hyper", level: "skull_base", part: "vii_geniculate", produces: "hyperacusis",      note: "geniculate — stapedius (hyperacusis)" },
  { id: "vii_gen_taste", level: "skull_base", part: "vii_geniculate", produces: "taste_loss",       note: "geniculate — chorda tympani (taste)" },
  { id: "vii_tym_motor", level: "skull_base", part: "vii_tympanic", produces: "facial_weakness", crosses: false,     note: "tympanic — motor; greater petrosal already left ⊃ lacrimation SPARED" },
  { id: "vii_tym_hyper", level: "skull_base", part: "vii_tympanic", produces: "hyperacusis", note: "tympanic — stapedius (hyperacusis)" },
  { id: "vii_tym_taste", level: "skull_base", part: "vii_tympanic", produces: "taste_loss",  note: "tympanic — chorda tympani (taste)" },
  { id: "vii_mas_motor", level: "skull_base", part: "vii_mastoid", produces: "facial_weakness", crosses: false,    note: "mastoid — motor; stapedius already left ⊃ hyperacusis SPARED" },
  { id: "vii_mas_taste", level: "skull_base", part: "vii_mastoid", produces: "taste_loss", note: "mastoid — chorda tympani (taste)" },
  { id: "vii_sty_motor", level: "skull_base", part: "vii_stylomastoid", produces: "facial_weakness", crosses: false, note: "stylomastoid foramen — pure motor (Bell's palsy site); chorda already left ⊃ taste SPARED" },
  { id: "vii_par_branch", level: "skull_base", part: "vii_parotid", produces: "facial_weak_branch", note: "parotid — single branch, partial hemiface" },

  // CPA — the cerebellopontine angle: VII + VIII + trigeminal root (corneal) + cerebellar compression.
  { id: "cpa_cn7",    level: "skull_base", part: "cpa", produces: "facial_weakness", crosses: false,     note: "facial nerve (VII) at the CPA" },
  { id: "cpa_cn8",    level: "skull_base", part: "cpa", produces: "hearing_loss", note: "vestibulocochlear (VIII) at the CPA — sensorineural hearing loss (vestibular schwannoma)" },
  { id: "cpa_v1",     level: "skull_base", part: "cpa", produces: "v1_sensory",  note: "trigeminal root (V) at the CPA — reduced corneal reflex" },
  { id: "cpa_ataxia", level: "skull_base", part: "cpa", produces: "limb_ataxia", note: "cerebellar / peduncle compression by a large CPA mass — ipsilateral ataxia" },

  // IX glossopharyngeal — jugular foramen: gag afferent + posterior-third taste.
  { id: "ix_gag",   level: "skull_base", part: "ix_jugular", produces: "gag_afferent_loss", note: "IX — pharyngeal sensation / gag afferent limb" },
  { id: "ix_taste", level: "skull_base", part: "ix_jugular", produces: "taste_posterior",   note: "IX — taste, posterior third of tongue" },

  // X vagus — high (jugular): palate (gag efferent) + cords; distal (recurrent laryngeal): cords only.
  { id: "x_palate", level: "skull_base", part: "x_jugular", produces: "palatal_weakness",  note: "X — palate / uvula (gag efferent), high vagal" },
  { id: "x_vocal",  level: "skull_base", part: "x_jugular", produces: "vocal_cord_palsy",   note: "X — larynx (cords), high vagal" },
  { id: "x_rln",    level: "skull_base", part: "x_recurrent_laryngeal", produces: "vocal_cord_palsy", note: "recurrent laryngeal — hoarseness with palate SPARED (thyroid/aortic/Pancoast)" },

  // XI accessory — jugular (SCM + trapezius, with IX/X) vs posterior triangle (trapezius only).
  { id: "xi_jug_scm",  level: "skull_base", part: "xi_jugular", produces: "weak_scm",       note: "XI at the jugular foramen — sternocleidomastoid" },
  { id: "xi_jug_trap", level: "skull_base", part: "xi_jugular", produces: "weak_trapezius", note: "XI at the jugular foramen — trapezius" },
  { id: "xi_pt_trap",  level: "skull_base", part: "xi_posterior_triangle", produces: "weak_trapezius", note: "XI in the posterior triangle — trapezius; SCM branch already left ⊃ SCM SPARED" },

  // XII hypoglossal — canal (with IX/X/XI ⇒ Collet-Sicard) vs neck (isolated).
  { id: "hyp_cn12",  level: "skull_base", part: "hypoglossal_canal", produces: "cn12_palsy", note: "hypoglossal nerve (XII) in the canal" },
  { id: "xii_neck",  level: "skull_base", part: "xii_neck",          produces: "cn12_palsy", note: "hypoglossal (XII) in the neck (carotid / submandibular) — isolated" },

  // Cervical sympathetic (carotid space) — isolated Horner (carotid dissection); Horner-order axis.
  { id: "car_symp_miosis", level: "skull_base", part: "carotid_space", produces: "miosis",
    note: "cervical sympathetic chain in the carotid space — miosis (isolated Horner)" },
  { id: "car_symp_ptosis", level: "skull_base", part: "carotid_space", produces: "ptosis",
    note: "cervical sympathetic (carotid space) — partial ptosis" },

  // ---- MOTOR UNIT (pure-motor endings: anterior horn / NMJ / muscle) ----
  // Generalized, symmetric conditions → each part is one BILATERAL site (see composeMotorUnitSites).
  // The anterior horn is modelled as PURE LOWER MOTOR NEURONE: it carries NO umn_signs. ALS's UMN
  // component comes from the corticospinal tract (above the motor unit); ALS is a PATHOLOGY that fires
  // on UMN+LMN co-occurrence across two sites — the future pathology layer, not a site here.
  // Fasciculations are a GENERAL LMN sign (any LMN level) and are non-localising in score.js.
  { id: "ah_lmn",    level: "motor_unit", part: "anterior_horn", produces: "lmn_weakness",
    note: "anterior horn cell — flaccid, areflexic (LMN) weakness (PMA/SMA/polio/Kennedy)" },
  { id: "ah_fascic", level: "motor_unit", part: "anterior_horn", produces: "fasciculations",
    note: "anterior horn cell irritability — fasciculations (general LMN sign, not localising)" },
  { id: "ah_bulbar_dysph", level: "motor_unit", part: "anterior_horn", produces: "dysphagia",
    note: "bulbar motor neurones (progressive bulbar palsy) — dysphagia (LMN)" },
  { id: "ah_bulbar_dysar", level: "motor_unit", part: "anterior_horn", produces: "dysarthria",
    note: "bulbar motor neurones (progressive bulbar palsy) — dysarthria (LMN)" },
  { id: "mg_fatig",  level: "motor_unit", part: "nmj_postsynaptic", produces: "fatigable_weakness",
    note: "post-synaptic NMJ (AChR) — fatigable weakness worsening with effort (myasthenia gravis)" },
  { id: "mg_ocular", level: "motor_unit", part: "nmj_postsynaptic", produces: "fatigable_ocular",
    note: "ocular myasthenia — fatigable ptosis and diplopia (separates MG from LEMS)" },
  { id: "mg_bulbar_dysph", level: "motor_unit", part: "nmj_postsynaptic", produces: "dysphagia",
    note: "bulbar myasthenia — fatigable dysphagia" },
  { id: "mg_bulbar_dysar", level: "motor_unit", part: "nmj_postsynaptic", produces: "dysarthria",
    note: "bulbar myasthenia — fatigable dysarthria" },
  { id: "mg_prox",   level: "motor_unit", part: "nmj_postsynaptic", produces: "proximal_weakness",
    note: "myasthenic proximal/limb-girdle weakness" },
  { id: "lems_facil",level: "motor_unit", part: "nmj_presynaptic", produces: "facilitating_weakness",
    note: "pre-synaptic NMJ (VGCC) — post-exercise facilitation (Lambert-Eaton)" },
  { id: "lems_auto", level: "motor_unit", part: "nmj_presynaptic", produces: "autonomic_features",
    note: "Lambert-Eaton autonomic features — dry mouth, constipation" },
  { id: "lems_prox", level: "motor_unit", part: "nmj_presynaptic", produces: "proximal_weakness",
    note: "Lambert-Eaton proximal/limb-girdle weakness" },
  { id: "myo_prox",  level: "motor_unit", part: "muscle", produces: "proximal_weakness",
    note: "myopathy — symmetric proximal weakness, no sensory loss, preserved reflexes, no fatigability" },

  // ---- NERVE ROOTS (radiculopathy; part = segment) ----
  // Each root is a per-segment SITE: the segment EMERGES from its distinct dermatome + myotome + reflex
  // (unlike the cord sensory level, where the tracts are identical at every segment). All ipsilateral.
  // A dermatome/myotome mismatch fails to fit any single root → the existing multifocal cover surfaces it.
  { id: "root_c5_derm", level: "root", part: "c5", produces: "sensory_c5", note: "C5 dermatome — lateral upper arm" },
  { id: "root_c5_abd",    level: "root", part: "c5", produces: "weak_shoulder_abduction", note: "C5 — deltoid" },
  { id: "root_c5_elbflex",level: "root", part: "c5", produces: "weak_elbow_flexion", note: "C5 — biceps" },
  { id: "root_c5_extrot", level: "root", part: "c5", produces: "weak_shoulder_external_rotation", note: "C5 — infraspinatus" },
  { id: "root_c5_reflex", level: "root", part: "c5", produces: "reflex_biceps_loss", note: "biceps jerk (C5/6)" },
  { id: "root_c5_pain", level: "root", part: "c5", produces: "radicular_pain", note: "C5 radicular pain" },
  { id: "root_c6_derm", level: "root", part: "c6", produces: "sensory_c6", note: "C6 dermatome — thumb / lateral forearm" },
  { id: "root_c6_elbflex",level: "root", part: "c6", produces: "weak_elbow_flexion", note: "C6 — biceps/brachioradialis" },
  { id: "root_c6_wristext",level: "root", part: "c6", produces: "weak_wrist_extension", note: "C6 — wrist extensors" },
  { id: "root_c6_sup",    level: "root", part: "c6", produces: "weak_forearm_supination", note: "C6 — supinator" },
  { id: "root_c6_reflex", level: "root", part: "c6", produces: "reflex_brachioradialis_loss", note: "brachioradialis (supinator) jerk (C6)" },
  { id: "root_c6_pain", level: "root", part: "c6", produces: "radicular_pain", note: "C6 radicular pain" },
  { id: "root_c7_derm", level: "root", part: "c7", produces: "sensory_c7", note: "C7 dermatome — middle finger" },
  { id: "root_c7_elbext", level: "root", part: "c7", produces: "weak_elbow_extension", note: "C7 — triceps" },
  { id: "root_c7_wristflex",level: "root", part: "c7", produces: "weak_wrist_flexion", note: "C7 — wrist flexors" },
  { id: "root_c7_fingext",level: "root", part: "c7", produces: "weak_finger_extension", note: "C7 — finger extensors" },
  { id: "root_c7_reflex", level: "root", part: "c7", produces: "reflex_triceps_loss", note: "triceps jerk (C7)" },
  { id: "root_c7_pain", level: "root", part: "c7", produces: "radicular_pain", note: "C7 radicular pain" },
  { id: "root_c8_derm", level: "root", part: "c8", produces: "sensory_c8", note: "C8 dermatome — little finger / medial forearm" },
  { id: "root_c8_fingflex",level: "root", part: "c8", produces: "weak_finger_flexion", note: "C8 — long finger flexors" },
  { id: "root_c8_fingabd", level: "root", part: "c8", produces: "weak_finger_abduction", note: "C8 — interossei" },
  { id: "root_c8_thumbabd",level: "root", part: "c8", produces: "weak_thumb_abduction", note: "C8 — APB (median)" },
  { id: "root_c8_pain", level: "root", part: "c8", produces: "radicular_pain", note: "C8 radicular pain (no classic reflex)" },
  { id: "root_t1_derm", level: "root", part: "t1", produces: "sensory_t1", note: "T1 dermatome — medial arm / axilla" },
  { id: "root_t1_fingabd", level: "root", part: "t1", produces: "weak_finger_abduction", note: "T1 — interossei" },
  { id: "root_t1_thumbabd",level: "root", part: "t1", produces: "weak_thumb_abduction", note: "T1 — APB (median)" },
  { id: "root_t1_pain", level: "root", part: "t1", produces: "radicular_pain", note: "T1 radicular pain (no classic reflex)" },
  { id: "root_l2_derm", level: "root", part: "l2", produces: "sensory_l2", note: "L2 dermatome — anterior thigh" },
  { id: "root_l2_hipflex",level: "root", part: "l2", produces: "weak_hip_flexion", note: "L2 — iliopsoas" },
  { id: "root_l2_hipadd", level: "root", part: "l2", produces: "weak_hip_adduction", note: "L2 — adductors" },
  { id: "root_l2_pain", level: "root", part: "l2", produces: "radicular_pain", note: "L2 radicular pain (no classic reflex)" },
  { id: "root_l3_derm", level: "root", part: "l3", produces: "sensory_l3", note: "L3 dermatome — lower anterior thigh / knee" },
  { id: "root_l3_kneeext",level: "root", part: "l3", produces: "weak_knee_extension", note: "L3 — quadriceps" },
  { id: "root_l3_hipadd", level: "root", part: "l3", produces: "weak_hip_adduction", note: "L3 — adductors" },
  { id: "root_l3_reflex", level: "root", part: "l3", produces: "reflex_knee_loss", note: "knee jerk (L3/4)" },
  { id: "root_l3_pain", level: "root", part: "l3", produces: "radicular_pain", note: "L3 radicular pain" },
  { id: "root_l4_derm", level: "root", part: "l4", produces: "sensory_l4", note: "L4 dermatome — medial shin" },
  { id: "root_l4_kneeext",level: "root", part: "l4", produces: "weak_knee_extension", note: "L4 — quadriceps" },
  { id: "root_l4_df",     level: "root", part: "l4", produces: "weak_ankle_dorsiflexion", note: "L4 — tibialis anterior" },
  { id: "root_l4_inv",    level: "root", part: "l4", produces: "weak_foot_inversion", note: "L4 — tibialis posterior" },
  { id: "root_l4_reflex", level: "root", part: "l4", produces: "reflex_knee_loss", note: "knee jerk (L3/4)" },
  { id: "root_l4_pain", level: "root", part: "l4", produces: "radicular_pain", note: "L4 radicular pain" },
  { id: "root_l5_derm", level: "root", part: "l5", produces: "sensory_l5", note: "L5 dermatome — dorsum of foot / great toe" },
  { id: "root_l5_df",    level: "root", part: "l5", produces: "weak_ankle_dorsiflexion", note: "L5 — tibialis anterior (shared → foot drop)" },
  { id: "root_l5_gte",   level: "root", part: "l5", produces: "weak_great_toe_extension", note: "L5 — EHL" },
  { id: "root_l5_ev",    level: "root", part: "l5", produces: "weak_foot_eversion", note: "L5 — peronei" },
  { id: "root_l5_inv",   level: "root", part: "l5", produces: "weak_foot_inversion", note: "L5 — tibialis posterior (discriminator vs peroneal)" },
  { id: "root_l5_hipabd",level: "root", part: "l5", produces: "weak_hip_abduction", note: "L5 — gluteus medius (discriminator vs peroneal)" },
  { id: "root_l5_pain", level: "root", part: "l5", produces: "radicular_pain", note: "L5 radicular pain (no classic reflex)" },
  { id: "root_s1_derm", level: "root", part: "s1", produces: "sensory_s1", note: "S1 dermatome — lateral foot / sole" },
  { id: "root_s1_pf",    level: "root", part: "s1", produces: "weak_ankle_plantarflexion", note: "S1 — gastrocnemius" },
  { id: "root_s1_ev",    level: "root", part: "s1", produces: "weak_foot_eversion", note: "S1 — peronei" },
  { id: "root_s1_kneeflex",level: "root", part: "s1", produces: "weak_knee_flexion", note: "S1 — hamstrings" },
  { id: "root_s1_toeflex",level: "root", part: "s1", produces: "weak_toe_flexion", note: "S1 — toe flexors" },
  { id: "root_s1_reflex", level: "root", part: "s1", produces: "reflex_ankle_loss", note: "ankle jerk (S1)" },
  { id: "root_s1_pain", level: "root", part: "s1", produces: "radicular_pain", note: "S1 radicular pain" },

  // ---- PNS DEPTH: high-cervical (C3/C4 + phrenic/diaphragm), thoracic (T4/T10/L1), sacral (S2/S3) roots ----
  { id: "root_c3_derm", level: "root", part: "c3", produces: "sensory_c3", note: "C3 dermatome — lower neck" },
  { id: "root_c3_phrenic", level: "root", part: "c3", produces: "weak_diaphragm", note: "C3 — phrenic (diaphragm)" },
  { id: "root_c3_pain", level: "root", part: "c3", produces: "radicular_pain", note: "C3 radicular pain" },
  { id: "root_c4_derm", level: "root", part: "c4", produces: "sensory_c4", note: "C4 dermatome — shoulder cape" },
  { id: "root_c4_phrenic", level: "root", part: "c4", produces: "weak_diaphragm", note: "C4 — phrenic (diaphragm)" },
  { id: "root_c4_pain", level: "root", part: "c4", produces: "radicular_pain", note: "C4 radicular pain" },
  { id: "root_t4_derm", level: "root", part: "t4", produces: "sensory_t4", note: "T4 dermatome — nipple line" },
  { id: "root_t4_pain", level: "root", part: "t4", produces: "radicular_pain", note: "T4 radicular pain (thoracic radiculopathy — zoster, diabetic truncal)" },
  { id: "root_t10_derm", level: "root", part: "t10", produces: "sensory_t10", note: "T10 dermatome — umbilicus" },
  { id: "root_t10_pain", level: "root", part: "t10", produces: "radicular_pain", note: "T10 radicular pain" },
  { id: "root_l1_derm", level: "root", part: "l1", produces: "sensory_l1", note: "L1 dermatome — groin / inguinal" },
  { id: "root_l1_pain", level: "root", part: "l1", produces: "radicular_pain", note: "L1 radicular pain" },
  { id: "root_s2_derm", level: "root", part: "s2", produces: "sensory_s2", note: "S2 dermatome — posterior thigh / perineum" },
  { id: "root_s2_pain", level: "root", part: "s2", produces: "radicular_pain", note: "S2 radicular pain" },
  { id: "root_s3_derm", level: "root", part: "s3", produces: "sensory_s3", note: "S3 dermatome — perineal / genital" },
  { id: "root_s3_pain", level: "root", part: "s3", produces: "radicular_pain", note: "S3 radicular pain" },

  // ---- POLYNEUROPATHY (length-dependent; bilateral site) ----
  // One diffuse bilateral site; HOW FAR the deficit ascends is the orthogonal nerveLength.js axis.
  { id: "poly_sensory", level: "polyneuropathy", part: "length_dependent", produces: "distal_sensory_loss",
    note: "length-dependent sensory axonopathy — distal symmetric (stocking-glove)" },
  { id: "poly_motor",   level: "polyneuropathy", part: "length_dependent", produces: "distal_motor_weakness",
    note: "length-dependent motor axonopathy — distal symmetric weakness" },

  // ---- NAMED PERIPHERAL NERVES (mononeuropathy; part = nerve) ----
  // Each nerve is a territory site: its cutaneous sensory territory + the movements it supplies. It
  // SHARES movement findings with the roots that feed it, so root-vs-nerve discriminators emerge from
  // which movements are spared (peroneal spares inversion/hip-abduction; ulnar spares thumb abduction).
  // ---- upper limb ----
  { id: "axil_sens",  level: "nerve", part: "axillary", produces: "axillary_sensory", note: "axillary — regimental-badge sensory" },
  { id: "axil_abd",   level: "nerve", part: "axillary", produces: "weak_shoulder_abduction", note: "axillary — deltoid" },
  { id: "mcut_sens",  level: "nerve", part: "musculocutaneous", produces: "musculocutaneous_sensory", note: "musculocutaneous — lateral forearm" },
  { id: "mcut_flex",  level: "nerve", part: "musculocutaneous", produces: "weak_elbow_flexion", note: "musculocutaneous — biceps" },
  { id: "mcut_sup",   level: "nerve", part: "musculocutaneous", produces: "weak_forearm_supination", note: "musculocutaneous — biceps (supination)" },
  { id: "mcut_reflex",level: "nerve", part: "musculocutaneous", produces: "reflex_biceps_loss", note: "biceps jerk (musculocutaneous)" },
  { id: "supra_er",   level: "nerve", part: "suprascapular", produces: "weak_shoulder_external_rotation", note: "suprascapular — infraspinatus" },
  { id: "supra_abd",  level: "nerve", part: "suprascapular", produces: "weak_shoulder_abduction", note: "suprascapular — supraspinatus (initiation)" },
  { id: "lthor_wing", level: "nerve", part: "long_thoracic", produces: "weak_scapular_stabilisation", note: "long thoracic — serratus anterior (winging)" },
  // ---- RADIAL nerve segments (axilla ⊃ spiral groove ⊃ PIN) ----
  { id: "rad_ax_tri",    level: "nerve", part: "radial_axilla", produces: "weak_elbow_extension", note: "radial (axilla) — triceps" },
  { id: "rad_ax_trijerk",level: "nerve", part: "radial_axilla", produces: "reflex_triceps_loss", note: "radial (axilla) — triceps jerk lost" },
  { id: "rad_ax_brd",    level: "nerve", part: "radial_axilla", produces: "weak_elbow_flexion", note: "radial (axilla) — brachioradialis" },
  { id: "rad_ax_sup",    level: "nerve", part: "radial_axilla", produces: "weak_forearm_supination", note: "radial (axilla) — supinator" },
  { id: "rad_ax_wr",     level: "nerve", part: "radial_axilla", produces: "weak_wrist_extension", note: "radial (axilla) — wrist drop" },
  { id: "rad_ax_fg",     level: "nerve", part: "radial_axilla", produces: "weak_finger_extension", note: "radial (axilla) — finger extensors" },
  { id: "rad_ax_sens",   level: "nerve", part: "radial_axilla", produces: "radial_sensory", note: "radial (axilla) — dorsal web" },
  { id: "rad_ax_wast",   level: "nerve", part: "radial_axilla", produces: "wasting", note: "radial (axilla) — extensor + triceps wasting" },
  { id: "rad_sg_brd",    level: "nerve", part: "radial_spiral_groove", produces: "weak_elbow_flexion", note: "radial (spiral groove) — brachioradialis" },
  { id: "rad_sg_sup",    level: "nerve", part: "radial_spiral_groove", produces: "weak_forearm_supination", note: "radial (spiral groove) — supinator" },
  { id: "rad_sg_wr",     level: "nerve", part: "radial_spiral_groove", produces: "weak_wrist_extension", note: "radial (spiral groove) — wrist drop; triceps SPARED" },
  { id: "rad_sg_fg",     level: "nerve", part: "radial_spiral_groove", produces: "weak_finger_extension", note: "radial (spiral groove) — finger extensors" },
  { id: "rad_sg_sens",   level: "nerve", part: "radial_spiral_groove", produces: "radial_sensory", note: "radial (spiral groove) — dorsal web" },
  { id: "rad_sg_wast",   level: "nerve", part: "radial_spiral_groove", produces: "wasting", note: "radial (spiral groove) — extensor compartment wasting" },
  { id: "rad_pin_fg",    level: "nerve", part: "radial_pin", produces: "weak_finger_extension", note: "posterior interosseous — finger drop" },
  { id: "rad_pin_sup",   level: "nerve", part: "radial_pin", produces: "weak_forearm_supination", note: "posterior interosseous — supinator" },
  { id: "rad_pin_wast",  level: "nerve", part: "radial_pin", produces: "wasting", note: "posterior interosseous — extensor wasting; wrist ext + sensory SPARED" },

  // ---- MEDIAN nerve segments (proximal ⊃ {AIN | carpal tunnel}) ----
  { id: "med_px_pron",   level: "nerve", part: "median_proximal", produces: "weak_forearm_pronation", note: "median (proximal) — pronator teres" },
  { id: "med_px_wf",     level: "nerve", part: "median_proximal", produces: "weak_wrist_flexion", note: "median (proximal) — FCR" },
  { id: "med_px_ff",     level: "nerve", part: "median_proximal", produces: "weak_finger_flexion", note: "median (proximal) — FDS/FDP2-3/FPL" },
  { id: "med_px_apb",    level: "nerve", part: "median_proximal", produces: "weak_thumb_abduction", note: "median (proximal) — APB" },
  { id: "med_px_sens",   level: "nerve", part: "median_proximal", produces: "median_sensory", note: "median (proximal) — radial 3½ digits" },
  { id: "med_px_palm",   level: "nerve", part: "median_proximal", produces: "median_palmar_sensory", note: "median (proximal) — palmar cutaneous branch" },
  { id: "med_px_wast",   level: "nerve", part: "median_proximal", produces: "wasting", note: "median (proximal) — forearm + thenar wasting" },
  { id: "med_ain_ff",    level: "nerve", part: "median_ain", produces: "weak_finger_flexion", note: "anterior interosseous — FPL/FDP2-3 (pure motor)" },
  { id: "med_ain_pron",  level: "nerve", part: "median_ain", produces: "weak_forearm_pronation", note: "anterior interosseous — pronator quadratus" },
  { id: "med_ain_wast",  level: "nerve", part: "median_ain", produces: "wasting", note: "anterior interosseous — deep-flexor wasting; thenar + sensory SPARED" },
  { id: "med_ct_apb",    level: "nerve", part: "median_carpal_tunnel", produces: "weak_thumb_abduction", note: "median (carpal tunnel) — APB" },
  { id: "med_ct_sens",   level: "nerve", part: "median_carpal_tunnel", produces: "median_sensory", note: "median (carpal tunnel) — radial 3½ digits" },
  { id: "med_ct_wast",   level: "nerve", part: "median_carpal_tunnel", produces: "wasting", note: "median (carpal tunnel) — thenar wasting; forearm + palmar cutaneous SPARED" },

  // ---- ULNAR nerve segments (elbow ⊃ wrist; the CLAW appears distally — the paradox) ----
  { id: "uln_el_fab",    level: "nerve", part: "ulnar_elbow", produces: "weak_finger_abduction", note: "ulnar (elbow) — interossei" },
  { id: "uln_el_tad",    level: "nerve", part: "ulnar_elbow", produces: "weak_thumb_adduction", note: "ulnar (elbow) — adductor pollicis (Froment)" },
  { id: "uln_el_ff",     level: "nerve", part: "ulnar_elbow", produces: "weak_finger_flexion", note: "ulnar (elbow) — FDP 4/5" },
  { id: "uln_el_wf",     level: "nerve", part: "ulnar_elbow", produces: "weak_wrist_flexion", note: "ulnar (elbow) — FCU" },
  { id: "uln_el_sens",   level: "nerve", part: "ulnar_elbow", produces: "ulnar_sensory", note: "ulnar (elbow) — palmar little finger + medial hand" },
  { id: "uln_el_dsens",  level: "nerve", part: "ulnar_elbow", produces: "ulnar_dorsal_sensory", note: "ulnar (elbow) — dorsal ulnar cutaneous" },
  { id: "uln_el_wast",   level: "nerve", part: "ulnar_elbow", produces: "wasting", note: "ulnar (elbow) — intrinsic + forearm wasting" },
  { id: "uln_wr_fab",    level: "nerve", part: "ulnar_wrist", produces: "weak_finger_abduction", note: "ulnar (wrist/Guyon) — interossei" },
  { id: "uln_wr_tad",    level: "nerve", part: "ulnar_wrist", produces: "weak_thumb_adduction", note: "ulnar (wrist/Guyon) — adductor pollicis (Froment)" },
  { id: "uln_wr_claw",   level: "nerve", part: "ulnar_wrist", produces: "ulnar_claw", note: "ulnar (wrist) — claw (intact FDP 4/5 claws harder — the paradox)" },
  { id: "uln_wr_sens",   level: "nerve", part: "ulnar_wrist", produces: "ulnar_sensory", note: "ulnar (wrist) — palmar little finger; FDP/FCU + dorsal sensory SPARED" },
  { id: "uln_wr_wast",   level: "nerve", part: "ulnar_wrist", produces: "wasting", note: "ulnar (wrist) — intrinsic hand wasting" },
  // ---- lower limb ----
  { id: "fem_sens",   level: "nerve", part: "femoral", produces: "femoral_sensory", note: "femoral — anterior thigh / saphenous" },
  { id: "fem_hipflex",level: "nerve", part: "femoral", produces: "weak_hip_flexion", note: "femoral — iliopsoas" },
  { id: "fem_kneeext",level: "nerve", part: "femoral", produces: "weak_knee_extension", note: "femoral — quadriceps" },
  { id: "fem_reflex", level: "nerve", part: "femoral", produces: "reflex_knee_loss", note: "knee jerk (femoral)" },
  { id: "obt_sens",   level: "nerve", part: "obturator", produces: "obturator_sensory", note: "obturator — medial thigh" },
  { id: "obt_add",    level: "nerve", part: "obturator", produces: "weak_hip_adduction", note: "obturator — adductors" },
  { id: "lfc_sens",   level: "nerve", part: "lat_fem_cutaneous", produces: "lat_fem_cutaneous_sensory", note: "lateral femoral cutaneous — meralgia (pure sensory)" },
  { id: "supglut_abd",level: "nerve", part: "superior_gluteal", produces: "weak_hip_abduction", note: "superior gluteal — gluteus medius (Trendelenburg)" },
  { id: "sci_sens",   level: "nerve", part: "sciatic", produces: "sciatic_sensory", note: "sciatic — below knee" },
  { id: "sci_kneeflex",level: "nerve", part: "sciatic", produces: "weak_knee_flexion", note: "sciatic — hamstrings" },
  { id: "sci_df",     level: "nerve", part: "sciatic", produces: "weak_ankle_dorsiflexion", note: "sciatic — via common peroneal" },
  { id: "sci_pf",     level: "nerve", part: "sciatic", produces: "weak_ankle_plantarflexion", note: "sciatic — via tibial" },
  { id: "sci_ev",     level: "nerve", part: "sciatic", produces: "weak_foot_eversion", note: "sciatic — via peroneal" },
  { id: "sci_reflex", level: "nerve", part: "sciatic", produces: "reflex_ankle_loss", note: "ankle jerk (sciatic/tibial)" },
  // ---- COMMON PERONEAL segments (common ⊃ {deep | superficial}) ----
  { id: "cper_cm_df",    level: "nerve", part: "peroneal_common", produces: "weak_ankle_dorsiflexion", note: "common peroneal (fibular neck) — foot drop" },
  { id: "cper_cm_gte",   level: "nerve", part: "peroneal_common", produces: "weak_great_toe_extension", note: "common peroneal — EHL" },
  { id: "cper_cm_ev",    level: "nerve", part: "peroneal_common", produces: "weak_foot_eversion", note: "common peroneal — peronei" },
  { id: "cper_cm_sens",  level: "nerve", part: "peroneal_common", produces: "peroneal_sensory", note: "common peroneal — dorsum of foot" },
  { id: "cper_cm_dsens", level: "nerve", part: "peroneal_common", produces: "deep_peroneal_sensory", note: "common peroneal — first dorsal web" },
  { id: "cper_cm_wast",  level: "nerve", part: "peroneal_common", produces: "wasting", note: "common peroneal — anterolateral compartment wasting" },
  { id: "cper_dp_df",    level: "nerve", part: "peroneal_deep", produces: "weak_ankle_dorsiflexion", note: "deep peroneal — tibialis anterior" },
  { id: "cper_dp_gte",   level: "nerve", part: "peroneal_deep", produces: "weak_great_toe_extension", note: "deep peroneal — EHL" },
  { id: "cper_dp_dsens", level: "nerve", part: "peroneal_deep", produces: "deep_peroneal_sensory", note: "deep peroneal — first dorsal web; eversion SPARED" },
  { id: "cper_dp_wast",  level: "nerve", part: "peroneal_deep", produces: "wasting", note: "deep peroneal — anterior compartment wasting" },
  { id: "cper_sf_ev",    level: "nerve", part: "peroneal_superficial", produces: "weak_foot_eversion", note: "superficial peroneal — peronei" },
  { id: "cper_sf_sens",  level: "nerve", part: "peroneal_superficial", produces: "peroneal_sensory", note: "superficial peroneal — dorsum of foot; dorsiflexion SPARED" },
  { id: "cper_sf_wast",  level: "nerve", part: "peroneal_superficial", produces: "wasting", note: "superficial peroneal — lateral compartment wasting" },
  { id: "tib_sens",   level: "nerve", part: "tibial", produces: "tibial_sensory", note: "tibial — sole" },
  { id: "tib_pf",     level: "nerve", part: "tibial", produces: "weak_ankle_plantarflexion", note: "tibial — gastrocnemius" },
  { id: "tib_inv",    level: "nerve", part: "tibial", produces: "weak_foot_inversion", note: "tibial — tibialis posterior" },
  { id: "tib_toeflex",level: "nerve", part: "tibial", produces: "weak_toe_flexion", note: "tibial — toe flexors" },
  { id: "tib_reflex", level: "nerve", part: "tibial", produces: "reflex_ankle_loss", note: "ankle jerk (tibial)" },
  // PNS-depth named nerves: phrenic (diaphragm), pudendal (perineum/sphincter), saphenous + sural (pure sensory)
  { id: "phr_diaphragm", level: "nerve", part: "phrenic", produces: "weak_diaphragm", note: "phrenic (C3-5) — diaphragm; the pure-motor localiser for hemidiaphragm palsy" },
  { id: "pud_sens",  level: "nerve", part: "pudendal", produces: "sensory_s3", note: "pudendal (S2-4) — perineal / genital sensation" },
  { id: "pud_sphincter", level: "nerve", part: "pudendal", produces: "sphincter_dysfunction", note: "pudendal — external anal / urethral sphincter" },
  { id: "saph_sens", level: "nerve", part: "saphenous", produces: "saphenous_sensory", note: "saphenous (femoral branch) — medial leg / malleolus (pure sensory)" },
  { id: "sural_sens", level: "nerve", part: "sural", produces: "sural_sensory", note: "sural — lateral foot / heel (pure sensory; the biopsy nerve)" },

  // ---- NON-MUSCLE REFLEXES (anatomy-layer signs; companions of existing structures) ----
  // UMN release signs (Babinski leg / Hoffmann arm) accompany a corticospinal lesion at EVERY level it
  // is modelled. They are non-localising (score.js) — they confirm UMN and feed the future ALS layer,
  // but the level is pinned by the accompanying localisers. Crossing follows the tract at that site:
  // contralateral by default; the CORD structures override crosses:false (ipsilateral, below the level).
  { id: "cst_midbrain_bab", level: "midbrain", part: "medial", produces: "babinski", note: "corticospinal (midbrain) — extensor plantar, contra" },
  { id: "cst_midbrain_hof", level: "midbrain", part: "medial", produces: "hoffmann", note: "corticospinal (midbrain) — Hoffmann, contra" },
  { id: "cst_pons_bab", level: "pons", part: "medial", produces: "babinski", note: "corticospinal (pons) — extensor plantar, contra" },
  { id: "cst_pons_hof", level: "pons", part: "medial", produces: "hoffmann", note: "corticospinal (pons) — Hoffmann, contra" },
  { id: "pyr_bab", level: "medulla", part: "medial", produces: "babinski", note: "corticospinal (medullary pyramid) — extensor plantar, contra" },
  { id: "pyr_hof", level: "medulla", part: "medial", produces: "hoffmann", note: "corticospinal (medullary pyramid) — Hoffmann, contra" },
  { id: "cst_cord_bab", level: "cord", part: "anterior", produces: "babinski", crosses: false, note: "corticospinal (cord) — extensor plantar IPSI, below the level" },
  { id: "cst_cord_hof", level: "cord", part: "anterior", produces: "hoffmann", crosses: false, note: "corticospinal (cord) — Hoffmann IPSI (cervical myelopathy; generic-cord simplification)" },
  { id: "ic_bab", level: "subcortex", part: "internal_capsule", produces: "babinski", note: "corticospinal (internal capsule) — extensor plantar, contra" },
  { id: "ic_hof", level: "subcortex", part: "internal_capsule", produces: "hoffmann", note: "corticospinal (internal capsule) — Hoffmann, contra" },
  { id: "ctx_bab", level: "cortex", part: "motor_leg", produces: "babinski", note: "corticospinal (leg motor cortex) — extensor plantar, contra" },
  { id: "ctx_hof", level: "cortex", part: "motor_facearm", produces: "hoffmann", note: "corticospinal (arm motor cortex) — Hoffmann, contra" },
  // Sacral superficial reflexes (S2–4 arc) — lost in a conus OR cauda lesion; @midline. Localising.
  { id: "conus_anal", level: "conus", part: "medullaris", produces: "anal_wink_loss", crosses: false, note: "S2–4 sacral arc — anal wink lost" },
  { id: "conus_bulbo", level: "conus", part: "medullaris", produces: "bulbocavernosus_loss", crosses: false, note: "S2–4 sacral arc — bulbocavernosus lost" },
  { id: "cauda_anal", level: "cauda", part: "equina", produces: "anal_wink_loss", crosses: false, note: "S2–4 sacral roots — anal wink lost" },
  { id: "cauda_bulbo", level: "cauda", part: "equina", produces: "bulbocavernosus_loss", crosses: false, note: "S2–4 sacral roots — bulbocavernosus lost" },
  // Frontal release signs — contralateral (grasp) / non-specific (palmomental), frontal cortex.
  { id: "ctx_grasp", level: "cortex", part: "medial_pfc", produces: "grasp_reflex", note: "medial frontal — contralateral grasp reflex" },
  { id: "ctx_palmomental", level: "cortex", part: "orbitofrontal", produces: "palmomental", note: "frontal release — palmomental (non-specific)" },

  // ---- TONE & WASTING (UMN-vs-LMN axis; anatomy-layer companions, non-localising) ----
  // spasticity: increased tone — a corticospinal (UMN) companion at EVERY level the tract is modelled,
  // exactly like babinski/hoffmann. Crossing follows the tract: contra by default; cord + conus override
  // crosses:false (ipsi/local). Non-localising in score.js.
  { id: "cst_midbrain_spast", level: "midbrain", part: "medial", produces: "spasticity", note: "corticospinal (midbrain) — increased tone, contra" },
  { id: "cst_pons_spast", level: "pons", part: "medial", produces: "spasticity", note: "corticospinal (pons) — increased tone, contra" },
  { id: "pyr_spast", level: "medulla", part: "medial", produces: "spasticity", note: "corticospinal (medullary pyramid) — increased tone, contra" },
  { id: "cst_cord_spast", level: "cord", part: "anterior", produces: "spasticity", crosses: false, note: "corticospinal (cord) — increased tone IPSI, below the level" },
  { id: "ic_spast", level: "subcortex", part: "internal_capsule", produces: "spasticity", note: "corticospinal (internal capsule) — increased tone, contra" },
  { id: "ctx_spast_leg", level: "cortex", part: "motor_leg", produces: "spasticity", note: "corticospinal (leg motor cortex) — increased tone, contra" },
  { id: "ctx_spast_arm", level: "cortex", part: "motor_facearm", produces: "spasticity", note: "corticospinal (arm motor cortex) — increased tone, contra" },
  { id: "conus_spast", level: "conus", part: "medullaris", produces: "spasticity", crosses: false, note: "corticospinal fibres at the conus — increased tone (UMN), midline" },

  // hypotonia: reduced tone — GENERALISED-flaccid LMN only (anterior horn, cauda, polyneuropathy).
  // NOT at individual roots/nerves (focal LMN has clinically normal limb tone), NMJ, or muscle.
  { id: "ah_hypotonia", level: "motor_unit", part: "anterior_horn", produces: "hypotonia", note: "anterior horn — flaccid, hypotonic (generalised LMN)" },
  { id: "cauda_hypotonia", level: "cauda", part: "equina", produces: "hypotonia", crosses: false, note: "cauda equina — flaccid, hypotonic legs, midline" },
  { id: "poly_hypotonia", level: "polyneuropathy", part: "length_dependent", produces: "hypotonia", note: "length-dependent polyneuropathy — distal hypotonia (generalised LMN)" },

  // wasting: muscle atrophy — the broad LMN set. Requires innervated muscle, so it EXCLUDES pure-sensory
  // lat_fem_cutaneous, and (already LMN-excluded) NMJ + muscle. Non-localising, like fasciculations.
  { id: "ah_wasting", level: "motor_unit", part: "anterior_horn", produces: "wasting", note: "anterior horn — denervation wasting (generalised LMN)" },
  { id: "cauda_wasting", level: "cauda", part: "equina", produces: "wasting", crosses: false, note: "cauda equina — denervation wasting, midline" },
  { id: "poly_wasting", level: "polyneuropathy", part: "length_dependent", produces: "wasting", note: "polyneuropathy — distal denervation wasting" },
  { id: "root_c5_wasting", level: "root", part: "c5", produces: "wasting", note: "C5 — segmental wasting (deltoid/biceps)" },
  { id: "root_c6_wasting", level: "root", part: "c6", produces: "wasting", note: "C6 — segmental wasting" },
  { id: "root_c7_wasting", level: "root", part: "c7", produces: "wasting", note: "C7 — segmental wasting (triceps)" },
  { id: "root_c8_wasting", level: "root", part: "c8", produces: "wasting", note: "C8 — segmental wasting (intrinsic hand)" },
  { id: "root_t1_wasting", level: "root", part: "t1", produces: "wasting", note: "T1 — segmental wasting (intrinsic hand)" },
  { id: "root_l2_wasting", level: "root", part: "l2", produces: "wasting", note: "L2 — segmental wasting (hip flexors)" },
  { id: "root_l3_wasting", level: "root", part: "l3", produces: "wasting", note: "L3 — segmental wasting (quadriceps)" },
  { id: "root_l4_wasting", level: "root", part: "l4", produces: "wasting", note: "L4 — segmental wasting (quadriceps/TA)" },
  { id: "root_l5_wasting", level: "root", part: "l5", produces: "wasting", note: "L5 — segmental wasting (TA/EHL)" },
  { id: "root_s1_wasting", level: "root", part: "s1", produces: "wasting", note: "S1 — segmental wasting (calf)" },
  { id: "axil_wasting", level: "nerve", part: "axillary", produces: "wasting", note: "axillary — deltoid wasting" },
  { id: "mcut_wasting", level: "nerve", part: "musculocutaneous", produces: "wasting", note: "musculocutaneous — biceps wasting" },
  { id: "supra_wasting", level: "nerve", part: "suprascapular", produces: "wasting", note: "suprascapular — infraspinatus/supraspinatus wasting" },
  { id: "lthor_wasting", level: "nerve", part: "long_thoracic", produces: "wasting", note: "long thoracic — serratus anterior wasting" },
  { id: "fem_wasting", level: "nerve", part: "femoral", produces: "wasting", note: "femoral — quadriceps wasting" },
  { id: "obt_wasting", level: "nerve", part: "obturator", produces: "wasting", note: "obturator — adductor wasting" },
  { id: "supglut_wasting", level: "nerve", part: "superior_gluteal", produces: "wasting", note: "superior gluteal — gluteus medius wasting" },
  { id: "sci_wasting", level: "nerve", part: "sciatic", produces: "wasting", note: "sciatic — hamstring/below-knee wasting" },
  { id: "tib_wasting", level: "nerve", part: "tibial", produces: "wasting", note: "tibial — calf/sole wasting" },

  // ---- SYMPATHETIC / HORNER AXIS — preganglionic (2nd-order) primitive ----
  // The lean preganglionic Horner (stellate ganglion). Pancoast is its composite with the lower trunk
  // (C8/T1), built by composePancoastSites. Ungated (not a cord lesion).
  { id: "preg_miosis",  level: "sympathetic", part: "preganglionic", produces: "miosis",
    note: "preganglionic (2nd-order) oculosympathetic — miosis (stellate ganglion / lung apex)" },
  { id: "preg_ptosis",  level: "sympathetic", part: "preganglionic", produces: "ptosis",
    note: "preganglionic (2nd-order) oculosympathetic — partial ptosis" },
  { id: "preg_anhface", level: "sympathetic", part: "preganglionic", produces: "anhidrosis_face",
    note: "preganglionic Horner — facial anhidrosis, body spared" }
];

// NB papilloedema is deliberately NOT a structure at any site. It is a PRESSURE sign, not a syndrome
// component: a motor-cortex lesion does not "produce" papilloedema the way it produces weakness — a large
// enough lesion anywhere intracranial does. Modelling it per-site would claim it as part of every cortical
// syndrome and would penalise every intracranial site for over-prediction whenever it is absent. It is
// instead an ORTHOGONAL COMPARTMENT AXIS in inverse.js (`raisedPressureAxis`), the same shape as the
// sensory level: it narrows WHICH COMPARTMENT the lesion is in without joining any site's finding set.

// Index by id for quick lookup.
export const STRUCTURE_BY_ID = Object.fromEntries(STRUCTURES.map(s => [s.id, s]));

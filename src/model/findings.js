// findings.js — the canonical vocabulary of examinable findings.
//
// A "finding" is something you can observe at the bedside. The engine speaks only in
// findings: the forward model emits them, the inverse solver consumes them.
//
// Laterality: findings are recorded relative to the SIDE OF THE BODY. A finding carries
// a `side` of 'ipsi' or 'contra' RELATIVE TO THE LESION when produced by the forward model.
// At the bedside the examiner records left/right; the solver tries the lesion on each side.
//
// `group` is only for display grouping. `desc` is human-readable.

export const FINDINGS = {
  // Cranial nerve / nuclear signs (localise the LEVEL in the brainstem)
  // Ocular motility — RAW ductions & lid (the CN III/IV/VI palsies EMERGE from which co-occur).
  ptosis:          { desc: "Drooping upper eyelid (ptosis)", group: "Eye movements" },
  weak_adduction:  { desc: "Weak adduction (eye won't turn in)", group: "Eye movements" },
  weak_abduction:  { desc: "Weak abduction (eye won't turn out)", group: "Eye movements" },
  weak_elevation:  { desc: "Weak elevation (eye won't turn up)", group: "Eye movements" },
  weak_depression: { desc: "Weak depression (eye won't turn down)", group: "Eye movements" },
  vertical_diplopia:{ desc: "Vertical double vision, worse on down-gaze / head tilt", group: "Eye movements" },
  facial_weakness: { desc: "Weakness of one side of the face", group: "Cranial nerve" },
  forehead_spared: { desc: "Forehead movement preserved (upper face spared)", group: "Cranial nerve" },
  cn8_vertigo:    { desc: "Vertigo (peripheral or central vestibular)", group: "Cranial nerve" },
  dysphagia:      { desc: "Difficulty swallowing", group: "Cranial nerve" },
  cn12_palsy:     { desc: "CN XII palsy (tongue deviation/wasting)", group: "Cranial nerve" },
  gaze_palsy:     { desc: "Horizontal conjugate gaze palsy", group: "Cranial nerve" },
  ino:            { desc: "Adduction lag on conjugate gaze + abducting-eye nystagmus (convergence spared)", group: "Eye movements" },
  vertical_gaze_palsy: { desc: "Supranuclear vertical (esp. up-) gaze palsy (dorsal midbrain — posterior commissure / riMLF)", group: "Cranial nerve" },
  lid_retraction:      { desc: "Bilateral lid retraction (Collier's sign — dorsal midbrain)", group: "Cranial nerve" },
  // Peripheral cranial-nerve signs at the skull base (all ipsilateral)
  optic_neuropathy: { desc: "Monocular visual loss", group: "Cranial nerve" },
  v1_sensory:     { desc: "Facial sensory loss / reduced corneal reflex — forehead / eye", group: "Cranial nerve" },
  v2_sensory:     { desc: "Facial sensory loss — cheek", group: "Cranial nerve" },
  v3_sensory:     { desc: "Facial sensory loss — jaw / chin", group: "Cranial nerve" },
  altitudinal_defect: { desc: "Altitudinal (superior or inferior half) monocular field loss — anterior ischaemic optic neuropathy (AION) / optic nerve", group: "Cranial nerve" },
  central_scotoma:    { desc: "Central monocular scotoma (± painful, reduced colour vision) — optic neuritis / optic nerve", group: "Cranial nerve" },
  hearing_loss:   { desc: "Sensorineural hearing loss ± tinnitus", group: "Cranial nerve" },
  // facial nerve (VII) branch discriminators along its intratemporal course
  lacrimation_loss:   { desc: "Reduced tearing / dry eye", group: "Cranial nerve" },
  hyperacusis:        { desc: "Loudness intolerance", group: "Cranial nerve" },
  taste_loss:         { desc: "Loss of taste, anterior two-thirds of tongue", group: "Cranial nerve" },
  facial_weak_branch: { desc: "Partial facial weakness in a single branch territory (extracranial / parotid)", group: "Cranial nerve" },
  // lower cranial nerves (IX/X gag afferent vs efferent; X distal; XI split)
  gag_afferent_loss:  { desc: "Absent gag (afferent limb) + pharyngeal sensory loss — glossopharyngeal (IX)", group: "Cranial nerve" },
  taste_posterior:    { desc: "Loss of taste, posterior third of tongue — glossopharyngeal (IX)", group: "Cranial nerve" },
  palatal_weakness:   { desc: "Palatal droop / uvular deviation, nasal regurgitation (gag efferent) — vagal pharyngeal branches (X)", group: "Cranial nerve" },
  vocal_cord_palsy:   { desc: "Hoarseness / vocal-cord paresis — recurrent (or high vagal) laryngeal (X)", group: "Cranial nerve" },
  weak_scm:           { desc: "Sternocleidomastoid weakness (head turn to opposite side) — accessory (XI)", group: "Cranial nerve" },
  weak_trapezius:     { desc: "Trapezius weakness / shoulder droop — accessory (XI)", group: "Cranial nerve" },

  // Olfactory (CN I) + insular cortex + general articulation
  anosmia:        { desc: "Loss of smell — olfactory nerve / tract (CN I)", group: "Cranial nerve" },
  gustatory_loss: { desc: "Central loss of taste", group: "Cortical" },
  dysarthria:     { desc: "Slurred / imprecise speech (articulation)", group: "Long tract" },
  emotional_lability: { desc: "Pathological laughing / crying", group: "Long tract" },
  sensory_ataxia: { desc: "Romberg-positive proprioceptive (sensory) ataxia", group: "Long tract" },
  // PNS depth — high-cervical / thoracic / sacral dermatomes, diaphragm, extra sensory nerves
  weak_diaphragm: { desc: "Diaphragm weakness (orthopnoea, paradoxical abdominal breathing) — phrenic nerve / C3-5", group: "Peripheral" },
  sensory_c3:  { desc: "C3 dermatome — lower neck", group: "Peripheral" },
  sensory_c4:  { desc: "C4 dermatome — shoulder cape / clavicle", group: "Peripheral" },
  sensory_t4:  { desc: "T4 dermatome — nipple line (thoracic radiculopathy)", group: "Peripheral" },
  sensory_t10: { desc: "T10 dermatome — umbilicus (thoracic radiculopathy)", group: "Peripheral" },
  sensory_l1:  { desc: "L1 dermatome — groin / inguinal (upper lumbar radiculopathy)", group: "Peripheral" },
  sensory_s2:  { desc: "S2 dermatome — posterior thigh / perineum", group: "Peripheral" },
  sensory_s3:  { desc: "S3 dermatome — perineal / genital", group: "Peripheral" },
  saphenous_sensory: { desc: "Saphenous nerve territory — medial leg / medial malleolus (femoral branch)", group: "Peripheral" },
  sural_sensory:     { desc: "Sural nerve territory — lateral foot / lateral heel", group: "Peripheral" },

  // Long-tract signs (localise the SIDE and imply level via what accompanies them)
  dorsal_sensory: { desc: "Loss of vibration / joint-position sense", group: "Long tract" },
  spinothalamic:  { desc: "Loss of pain / temperature on the body", group: "Long tract" },
  suspended_sensory:{ desc: "Cape-like bilateral loss of pain / temperature, touch preserved", group: "Long tract" },
  face_pain_loss: { desc: "Loss of pain / temperature on the face", group: "Long tract" },
  face_touch_loss:{ desc: "Loss of light touch on the face", group: "Long tract" },
  jaw_weakness:   { desc: "Jaw weakness / deviation toward the weak side + masseter wasting", group: "Cranial nerve" },

  // Motor unit — pure-motor endings (anterior horn / NMJ / muscle); generalized & symmetric
  fatigable_weakness:    { desc: "Fatigable weakness — worsens with sustained/repeated effort (post-synaptic NMJ, myasthenia)", group: "Motor unit" },
  fatigable_ocular:      { desc: "Fatigable ptosis and diplopia (ocular myasthenia)", group: "Motor unit" },
  facilitating_weakness: { desc: "Weakness that transiently improves with brief exercise (pre-synaptic NMJ, Lambert-Eaton)", group: "Motor unit" },
  autonomic_features:    { desc: "Autonomic features — dry mouth, constipation, impotence (Lambert-Eaton / autonomic)", group: "Motor unit" },
  fasciculations:        { desc: "Muscle fasciculations — lower-motor-neurone irritability (NOT localising: anterior horn, root, plexus or nerve)", group: "Motor unit" },
  proximal_weakness:     { desc: "Symmetric proximal (limb-girdle) weakness", group: "Motor unit" },

  // Nerve roots — segment-specific dermatome / myotome / reflex (radiculopathy; all ipsilateral)
  sensory_c5: { desc: "C5 dermatomal sensory loss (lateral upper arm)", group: "Root / LMN" },
  sensory_c6: { desc: "C6 dermatomal sensory loss (thumb, lateral forearm)", group: "Root / LMN" },
  sensory_c7: { desc: "C7 dermatomal sensory loss (middle finger)", group: "Root / LMN" },
  sensory_c8: { desc: "C8 dermatomal sensory loss (little finger, medial forearm)", group: "Root / LMN" },
  sensory_t1: { desc: "T1 dermatomal sensory loss (medial arm / axilla)", group: "Root / LMN" },
  sensory_l2: { desc: "L2 dermatomal sensory loss (anterior thigh)", group: "Root / LMN" },
  sensory_l3: { desc: "L3 dermatomal sensory loss (lower anterior thigh / knee)", group: "Root / LMN" },
  sensory_l4: { desc: "L4 dermatomal sensory loss (medial shin)", group: "Root / LMN" },
  sensory_l5: { desc: "L5 dermatomal sensory loss (dorsum of foot / great toe)", group: "Root / LMN" },
  sensory_s1: { desc: "S1 dermatomal sensory loss (lateral foot / sole)", group: "Root / LMN" },
  // Movement-based myotome vocabulary — SHARED by roots and named nerves (a nerve/root lesion maps to a
  // pattern of weak movements; the discriminators emerge from which movements are spared). Non-localising.
  weak_shoulder_abduction:        { desc: "Weak shoulder abduction (deltoid — C5, axillary)", group: "Movement" },
  weak_shoulder_external_rotation:{ desc: "Weak shoulder external rotation (infraspinatus — suprascapular)", group: "Movement" },
  weak_scapular_stabilisation:    { desc: "Scapular winging (serratus anterior — long thoracic)", group: "Movement" },
  weak_elbow_flexion:             { desc: "Weak elbow flexion (biceps — C5/6, musculocutaneous)", group: "Movement" },
  weak_elbow_extension:           { desc: "Weak elbow extension (triceps — C7, radial)", group: "Movement" },
  weak_forearm_supination:        { desc: "Weak forearm supination (biceps / supinator — C6)", group: "Movement" },
  weak_wrist_extension:           { desc: "Weak wrist extension / wrist drop (C6/7, radial)", group: "Movement" },
  weak_finger_extension:          { desc: "Weak finger extension (C7/8, radial / PIN)", group: "Movement" },
  weak_wrist_flexion:             { desc: "Weak wrist flexion (C7, median/ulnar)", group: "Movement" },
  weak_finger_flexion:            { desc: "Weak finger flexion (C8, median/ulnar)", group: "Movement" },
  weak_thumb_abduction:           { desc: "Weak thumb abduction (APB — C8/T1, median)", group: "Movement" },
  weak_finger_abduction:          { desc: "Weak finger abduction (interossei — C8/T1, ulnar)", group: "Movement" },
  weak_hip_flexion:               { desc: "Weak hip flexion (iliopsoas — L2/3, femoral)", group: "Movement" },
  weak_hip_adduction:             { desc: "Weak hip adduction (adductors — L2-4, obturator)", group: "Movement" },
  weak_hip_abduction:             { desc: "Weak hip abduction (gluteus medius — L5, superior gluteal)", group: "Movement" },
  weak_knee_extension:            { desc: "Weak knee extension (quadriceps — L3/4, femoral)", group: "Movement" },
  weak_knee_flexion:              { desc: "Weak knee flexion (hamstrings — L5/S1, sciatic)", group: "Movement" },
  weak_ankle_dorsiflexion:        { desc: "Weak ankle dorsiflexion / foot drop (tibialis anterior — L4/5, deep peroneal)", group: "Movement" },
  weak_great_toe_extension:       { desc: "Weak great-toe extension (EHL — L5, deep peroneal)", group: "Movement" },
  weak_foot_eversion:             { desc: "Weak foot eversion (peronei — L5/S1, superficial peroneal)", group: "Movement" },
  weak_foot_inversion:            { desc: "Weak foot inversion (tibialis posterior — L4/5, tibial)", group: "Movement" },
  weak_ankle_plantarflexion:      { desc: "Weak ankle plantarflexion (gastrocnemius — S1, tibial)", group: "Movement" },
  weak_toe_flexion:               { desc: "Weak toe flexion (S1/2, tibial)", group: "Movement" },
  // Named-nerve cutaneous territories (distinct from dermatomes) — LOCALISING
  axillary_sensory:          { desc: "Sensory loss over the deltoid (regimental badge — axillary nerve)", group: "Peripheral nerve" },
  musculocutaneous_sensory:  { desc: "Lateral forearm sensory loss (musculocutaneous nerve)", group: "Peripheral nerve" },
  radial_sensory:            { desc: "Dorsal web / anatomical snuffbox sensory loss (radial nerve)", group: "Peripheral nerve" },
  median_sensory:            { desc: "Radial 3½-digit palmar sensory loss (median nerve)", group: "Peripheral nerve" },
  ulnar_sensory:             { desc: "Little finger + medial hand sensory loss (ulnar nerve)", group: "Peripheral nerve" },
  femoral_sensory:           { desc: "Anterior thigh + medial leg (saphenous) sensory loss (femoral nerve)", group: "Peripheral nerve" },
  obturator_sensory:         { desc: "Medial thigh sensory loss (obturator nerve)", group: "Peripheral nerve" },
  lat_fem_cutaneous_sensory: { desc: "Lateral thigh sensory loss (lateral femoral cutaneous — meralgia paraesthetica)", group: "Peripheral nerve" },
  sciatic_sensory:           { desc: "Below-knee sensory loss, sparing the medial leg (sciatic nerve)", group: "Peripheral nerve" },
  peroneal_sensory:          { desc: "Dorsum of foot / lateral shin sensory loss (common peroneal nerve)", group: "Peripheral nerve" },
  tibial_sensory:            { desc: "Sole of foot sensory loss (tibial nerve)", group: "Peripheral nerve" },
  // Complete-innervation increment — movements + spared cutaneous branches + the ulnar claw
  weak_forearm_pronation: { desc: "Weak forearm pronation (pronator teres/quadratus — median)", group: "Movement" },
  weak_thumb_adduction:   { desc: "Weak thumb adduction (adductor pollicis — ulnar; Froment's sign)", group: "Movement" },
  deep_peroneal_sensory:  { desc: "First dorsal web-space sensory loss (deep peroneal nerve)", group: "Peripheral nerve" },
  ulnar_dorsal_sensory:   { desc: "Dorsal ulnar hand sensory loss (dorsal ulnar cutaneous branch — spared at the wrist/Guyon)", group: "Peripheral nerve" },
  median_palmar_sensory:  { desc: "Palmar / thenar-skin sensory loss (palmar cutaneous branch — spared in carpal tunnel)", group: "Peripheral nerve" },
  ulnar_claw:             { desc: "Ulnar claw hand — 4th/5th-digit clawing (worse in DISTAL ulnar lesions — the ulnar paradox)", group: "Peripheral nerve" },
  reflex_biceps_loss:         { desc: "Absent biceps jerk (C5/6)", group: "Root / LMN" },
  reflex_brachioradialis_loss:{ desc: "Absent brachioradialis (supinator) jerk (C6)", group: "Root / LMN" },
  reflex_triceps_loss:        { desc: "Absent triceps jerk (C7)", group: "Root / LMN" },
  reflex_knee_loss:           { desc: "Absent knee jerk (L3/4)", group: "Root / LMN" },
  reflex_ankle_loss:          { desc: "Absent ankle jerk (S1)", group: "Root / LMN" },
  // Length-dependent polyneuropathy (bilateral, distal, symmetric)
  distal_sensory_loss:  { desc: "Distal symmetric sensory loss (stocking-glove)", group: "Peripheral nerve" },
  distal_motor_weakness:{ desc: "Distal symmetric weakness (length-dependent)", group: "Peripheral nerve" },

  // Root / lower-motor-neurone and below-cord findings
  lmn_weakness:   { desc: "Flaccid, areflexic (lower motor neurone) weakness", group: "Root / LMN" },
  umn_signs:      { desc: "Upper motor neurone signs (hyperreflexia, extensor plantar)", group: "Root / LMN" },
  saddle_anaesthesia:{ desc: "Saddle anaesthesia (S2–S5 perineal sensory loss)", group: "Root / LMN" },
  sphincter_dysfunction:{ desc: "Bladder / bowel dysfunction (retention, incontinence, lax anal tone)", group: "Root / LMN" },
  radicular_pain: { desc: "Radicular pain (sciatica), often asymmetric", group: "Root / LMN" },

  // Cerebellar / connections
  limb_ataxia:    { desc: "Limb ataxia (cerebellar peduncle/connections)", group: "Cerebellar" },
  tremor_rubral:  { desc: "Contralateral tremor / involuntary movements (red nucleus)", group: "Cerebellar" },
  // Cerebellar — appendicular (hemisphere, ipsilateral) + axial/vestibulocerebellar (midline, @none)
  dysmetria:          { desc: "Dysmetria — past-pointing / inaccurate reach (cerebellar hemisphere)", group: "Cerebellar" },
  dysdiadochokinesis: { desc: "Dysdiadochokinesis — impaired rapid alternating movements (cerebellar hemisphere)", group: "Cerebellar" },
  intention_tremor:   { desc: "Intention tremor — worsens on approach to target (cerebellar hemisphere)", group: "Cerebellar" },
  truncal_ataxia:     { desc: "Truncal / gait ataxia — wide-based, titubation (cerebellar vermis)", group: "Cerebellar" },
  ataxic_dysarthria:  { desc: "Ataxic / scanning dysarthria (cerebellar)", group: "Cerebellar" },
  nystagmus_peripheral:  { desc: "Peripheral vestibular nystagmus — unidirectional horizontal-torsional, fatigable, fixation-suppressed (labyrinth / inner ear)", group: "Vestibular / nystagmus" },
  nystagmus_gaze_evoked: { desc: "Gaze-evoked / direction-changing nystagmus — the central type (cerebellum flocculonodular, brainstem vestibular nuclei)", group: "Vestibular / nystagmus" },
  nystagmus_downbeat:    { desc: "Downbeat nystagmus — craniocervical junction (Chiari) / floor of IV ventricle", group: "Vestibular / nystagmus" },
  nystagmus_upbeat:      { desc: "Upbeat nystagmus — pontomesencephalic / medullary tegmentum", group: "Vestibular / nystagmus" },
  head_impulse_abnormal: { desc: "Corrective catch-up saccade on head-impulse (h-HIT) — peripheral (VOR broken at the labyrinth/nerve)", group: "Vestibular / nystagmus" },
  skew_deviation:        { desc: "Vertical ocular misalignment (ocular tilt reaction) — central (brainstem graviceptive / otolithic)", group: "Vestibular / nystagmus" },
  nystagmus_positional_posterior:  { desc: "Up-beat + torsional positional nystagmus (Dix-Hallpike) — posterior semicircular canal (BPPV)", group: "Vestibular / nystagmus" },
  nystagmus_positional_horizontal: { desc: "Horizontal positional nystagmus (supine roll) — horizontal (lateral) semicircular canal (BPPV)", group: "Vestibular / nystagmus" },
  nystagmus_positional_anterior:   { desc: "Down-beat + torsional positional nystagmus — anterior semicircular canal (BPPV, rare)", group: "Vestibular / nystagmus" },
  nystagmus_convergence_retraction: { desc: "Convergence-retraction nystagmus on attempted upgaze (dorsal midbrain / pretectum)", group: "Vestibular / nystagmus" },
  nystagmus_pendular: { desc: "Vertical pendular nystagmus — with palatal tremor = oculopalatal tremor (Guillain-Mollaret / HOD)", group: "Vestibular / nystagmus" },
  palatal_tremor:     { desc: "Palatal myoclonus / tremor (~2 Hz) — the dentato-rubro-olivary sign (Guillain-Mollaret triangle / hypertrophic olivary degeneration)", group: "Cerebellar" },

  // Basal ganglia / movement disorders (extrapyramidal; contralateral to a focal nucleus lesion)
  bradykinesia:   { desc: "Slowness of movement (bradykinesia)", group: "Basal ganglia / movement" },
  rest_tremor:    { desc: "Tremor at rest", group: "Basal ganglia / movement" },
  chorea:         { desc: "Chorea — brief, irregular, dance-like involuntary movements (striatum)", group: "Basal ganglia / movement" },
  dystonia:       { desc: "Dystonia — sustained co-contraction / abnormal posturing (globus pallidus)", group: "Basal ganglia / movement" },
  rigidity:       { desc: "Rigidity — increased tone, uniform through range (lead-pipe / cogwheel; extrapyramidal — the third tone type)", group: "Tone / wasting" },

  // Non-muscle reflexes — UMN release, sacral superficial, frontal release (anatomy-layer signs)
  babinski:       { desc: "Extensor plantar response", group: "Reflex" },
  hoffmann:       { desc: "Hoffmann's sign", group: "Reflex" },
  anal_wink_loss: { desc: "Absent anal wink (S2–4 reflex arc)", group: "Reflex" },
  bulbocavernosus_loss: { desc: "Absent bulbocavernosus reflex (S2–4 reflex arc)", group: "Reflex" },
  grasp_reflex:   { desc: "Grasp reflex (frontal release — contralateral frontal lobe)", group: "Reflex" },
  palmomental:    { desc: "Palmomental reflex (frontal release — non-specific)", group: "Reflex" },

  // Tone & wasting — the UMN-vs-LMN axis (anatomy-layer companions, non-localising)
  spasticity:     { desc: "Increased tone (clasp-knife / spastic)", group: "Tone / wasting" },
  hypotonia:      { desc: "Reduced tone / flaccidity (generalised LMN — anterior horn, cauda, polyneuropathy)", group: "Tone / wasting" },
  wasting:        { desc: "Muscle wasting / atrophy (lower motor neurone — anterior horn, root, nerve; NOT localising)", group: "Tone / wasting" },

  // Autonomic
  fixed_dilated_pupil:     { desc: "Fixed dilated pupil (efferent parasympathetic defect — CN III / ciliary ganglion)", group: "Pupil" },
  light_near_dissociation: { desc: "Light-near dissociation (reacts to near, not light — Adie / Argyll Robertson)", group: "Pupil" },
  miosis:         { desc: "Small pupil (miosis)", group: "Autonomic" },
  anhidrosis_face: { desc: "Facial anhidrosis (loss of sweating — sympathetic, central or preganglionic)", group: "Autonomic" },
  anhidrosis_body: { desc: "Hemibody (trunk/limb) anhidrosis (central sympathetic — whole hemibody)", group: "Autonomic" },

  // Cortical — somatotopic motor/sensory (lateralised)
  weak_arm:       { desc: "Arm weakness", group: "Cortical" },
  weak_leg:       { desc: "Leg weakness", group: "Cortical" },
  weak_hand:      { desc: "Isolated hand / finger weakness", group: "Cortical" },
  cortical_sensory_hand: { desc: "Loss of discriminative sense — hand (± perioral: cheiro-oral)", group: "Cortical" },
  cortical_sensory_arm: { desc: "Loss of discriminative sense (stereognosis / 2-point) — arm", group: "Cortical" },
  cortical_sensory_leg: { desc: "Loss of discriminative sense (stereognosis / 2-point) — leg", group: "Cortical" },
  gaze_deviation: { desc: "Conjugate gaze deviation toward the lesion (away from the weak side)", group: "Cortical" },
  neglect:        { desc: "Hemispatial neglect / inattention to the contralesional side", group: "Cortical" },
  homonymous_hemianopia:   { desc: "Homonymous hemianopia (± macular sparing)", group: "Cortical" },
  bitemporal_hemianopia:   { desc: "Bitemporal hemianopia (optic chiasm — decussating nasal fibres)", group: "Visual pathway" },
  rapd:                    { desc: "Relative afferent pupillary defect (RAPD — optic nerve / optic tract)", group: "Visual pathway" },
  macular_sparing:         { desc: "Macular sparing (occipital / PCA hallmark of a homonymous hemianopia)", group: "Visual pathway" },
  superior_quadrantanopia: { desc: "Superior homonymous quadrantanopia", group: "Cortical" },
  inferior_quadrantanopia: { desc: "Inferior homonymous quadrantanopia", group: "Cortical" },
  // Cortical — non-lateralised higher-cortical / behavioural (emitted @none)
  // Aphasia is decomposed into four language FEATURES; the 8 classic aphasia types EMERGE from which
  // features co-occur at a site (repetition is the perisylvian-vs-transcortical discriminator).
  speech_nonfluent:      { desc: "Non-fluent / effortful / agrammatic speech output (fluency)", group: "Cortical" },
  comprehension_impaired:{ desc: "Impaired auditory comprehension", group: "Cortical" },
  repetition_impaired:   { desc: "Impaired repetition (spared in the transcortical / watershed aphasias)", group: "Cortical" },
  naming_impaired:       { desc: "Anomia / word-finding failure (present in ALL aphasias — non-localising; isolated = anomic)", group: "Cortical" },
  // Gerstmann tetrad — the four raw components (the syndrome emerges at the dominant angular gyrus)
  agraphia:  { desc: "Impaired writing (agraphia)", group: "Cortical" },
  acalculia: { desc: "Impaired calculation (acalculia)", group: "Cortical" },
  finger_agnosia: { desc: "Cannot identify / name individual fingers (finger agnosia)", group: "Cortical" },
  left_right_disorientation: { desc: "Left–right disorientation", group: "Cortical" },
  motor_dysprosody:   { desc: "Motor (expressive) aprosodia — flat, unmodulated speech", group: "Cortical" },
  sensory_dysprosody: { desc: "Sensory (receptive) aprosodia — cannot read emotional prosody", group: "Cortical" },
  anosognosia:        { desc: "Anosognosia (denial / unawareness of deficit)", group: "Cortical" },
  constructional_apraxia: { desc: "Constructional apraxia", group: "Cortical" },
  prosopagnosia:      { desc: "Prosopagnosia (impaired face recognition)", group: "Cortical" },
  executive_dysfunction: { desc: "Executive dysfunction (poor planning, organising, sequencing)", group: "Cortical" },
  abulia:             { desc: "Apathy / abulia (reduced spontaneous behaviour)", group: "Cortical" },
  disinhibition:      { desc: "Disinhibition, personality change, irritability", group: "Cortical" },
  // Motor-frontal + paracentral (completing the frontal map by region)
  limb_apraxia:       { desc: "Limb (motor) apraxia — impaired skilled/learned movement, power intact (premotor)", group: "Cortical" },
  alien_limb:         { desc: "Alien-limb phenomenon — involuntary grasping/groping, non-ownership (SMA / medial frontal)", group: "Cortical" },
  urinary_incontinence:{ desc: "Cortical (UMN) urinary incontinence — loss of cortical bladder inhibition (superomedial frontal / paracentral)", group: "Cortical" },
  gait_apraxia:       { desc: "Frontal gait apraxia — magnetic / ignition-failure gait, power intact (frontal / parasagittal, NPH)", group: "Cortical" },
  hallucinations:     { desc: "Hallucinations (olfactory/gustatory/visual/auditory) or episodic fear", group: "Cortical" },
  mood_change:        { desc: "Episodic mood change", group: "Cortical" },
  verbal_memory_impairment:    { desc: "Short-term verbal / written memory impairment", group: "Cortical" },
  nonverbal_memory_impairment: { desc: "Short-term non-verbal memory impairment (e.g. music)", group: "Cortical" },
  cortical_blindness: { desc: "Cortical blindness with unawareness (Anton's syndrome)", group: "Cortical" },
  // Balint triad — the three raw components (the syndrome emerges at bilateral parieto-occipital cortex)
  optic_ataxia:       { desc: "Misreaching under visual guidance (optic ataxia)", group: "Cortical" },
  oculomotor_apraxia: { desc: "Cannot voluntarily direct gaze to targets (oculomotor apraxia)", group: "Cortical" },
  simultanagnosia:    { desc: "Cannot perceive more than one object at once (simultanagnosia)", group: "Cortical" },
  // Parietal / temporal / occipital completeness
  ideomotor_apraxia:  { desc: "Ideomotor apraxia — impaired pantomime of learned gestures / tool use (dominant supramarginal)", group: "Cortical" },
  dressing_apraxia:   { desc: "Dressing apraxia (non-dominant parietal)", group: "Cortical" },
  cortical_deafness:  { desc: "Cortical deafness / auditory agnosia (bilateral primary auditory / Heschl)", group: "Cortical" },
  kluver_bucy:        { desc: "Klüver-Bucy syndrome (bilateral anterior temporal / amygdala) — hyperorality, hypersexuality, placidity, hypermetamorphosis", group: "Cortical" },
  visual_agnosia:     { desc: "Visual (object) agnosia — cannot recognise seen objects despite intact vision (ventral occipitotemporal)", group: "Cortical" },
  achromatopsia:      { desc: "Cerebral achromatopsia — cortical colour blindness (ventral occipital / V4)", group: "Cortical" },
  alexia_without_agraphia: { desc: "Alexia without agraphia (pure alexia) — can write but not read (dominant fusiform / visual word form area + splenial disconnection)", group: "Cortical" },

  // Thalamic nuclei (beyond VPL sensory / intralaminar arousal / LGN visual)
  thalamic_tremor:    { desc: "Thalamic tremor / dystonic 'thalamic hand' (ventral anterior/lateral — motor relay)", group: "Thalamus / hypothalamus" },
  face_sensory_loss:  { desc: "Contralateral facial (discriminative) sensory loss (VPM thalamus)", group: "Thalamus / hypothalamus" },
  amnesia:            { desc: "Anterograde amnesia (diencephalic — anterior/dorsomedial thalamus, mammillary bodies; Papez circuit)", group: "Thalamus / hypothalamus" },
  // Hypothalamus by nucleus
  diabetes_insipidus: { desc: "Central diabetes insipidus — polyuria/polydipsia (ADH failure; supraoptic / paraventricular)", group: "Thalamus / hypothalamus" },
  thermodysregulation:{ desc: "Temperature dysregulation — hyper- or hypothermia / poikilothermia (anterior vs posterior hypothalamus)", group: "Thalamus / hypothalamus" },
  hyperphagia:        { desc: "Hyperphagia / obesity (± rage) — ventromedial hypothalamic nucleus", group: "Thalamus / hypothalamus" },
  narcolepsy:         { desc: "Narcolepsy / hypersomnia — orexin loss (lateral hypothalamus)", group: "Thalamus / hypothalamus" },
  circadian_disruption:{ desc: "Sleep-wake / circadian rhythm disruption (suprachiasmatic nucleus)", group: "Thalamus / hypothalamus" },
  endocrine_dysfunction:{ desc: "Hypothalamic-pituitary endocrine dysfunction (hypopituitarism, hyperprolactinaemia, precocious puberty; tuberal / arcuate)", group: "Thalamus / hypothalamus" },

  // Corpus callosum — callosal disconnection (split-brain) syndrome
  callosal_apraxia:   { desc: "Left-hand (verbal-command) apraxia + agraphia — anterior callosal disconnection", group: "Disconnection" },
  tactile_anomia:     { desc: "Left-hand tactile anomia — cannot name objects felt with the left hand (splenial / callosal disconnection)", group: "Disconnection" },


  // Consciousness / arousal (ascending reticular activating system; non-lateralised)
  reduced_consciousness:   { desc: "Reduced level of consciousness / impaired arousal (ascending reticular activating system)", group: "Consciousness" },
  preserved_vertical_gaze: { desc: "Preserved vertical eye movements / blink-to-command with quadriplegia + anarthria (locked-in hallmark)", group: "Consciousness" },
  extensor_posturing:      { desc: "Decerebrate (extensor) posturing — structural upper-brainstem coma", group: "Consciousness" },
  // Subcortical / deep grey (all contralateral, above every decussation)
  thalamic_pain:  { desc: "Contralateral central post-stroke pain (Déjerine–Roussy, thalamic VPL)", group: "Subcortical" },
  hemiballismus:  { desc: "Contralateral hemiballismus / violent proximal flinging (subthalamic nucleus)", group: "Basal ganglia / movement" },

  // Functional (non-organic) POSITIVE signs — they do NOT localise (no producing structure, not in LOCALISING);
  // read by patterns.functionalFlag to flag "consider functional", never scored as an organic deficit.
  hoovers_sign:       { desc: "Hoover's sign (hip extension returns with contralateral hip flexion)", group: "Functional" },
  give_way_weakness:  { desc: "Give-way / collapsing weakness (inconsistent effort)", group: "Functional" },
  entrainment:        { desc: "Tremor entrains to a voluntary rhythm", group: "Functional" },
  exam_inconsistency: { desc: "Inconsistency / distractibility of the sign", group: "Functional" }
};

// True if the finding, when caused by a brainstem lesion, appears on the OPPOSITE side of the
// body to the lesion (because the pathway has already crossed, or crosses below the lesion).
// Cranial-nerve/nuclear signs are ipsilateral (the nucleus/fascicle is in the brainstem itself).
// This is used by the forward model to assign body-side to each emitted finding.
export const CROSSES = {
  // (weakness is one vocabulary — weak_arm / weak_leg / facial_weakness — across the whole neuraxis; a
  // brainstem/cord lesion emits weak_arm + weak_leg together, so a "hemiparesis" EMERGES from their co-occurrence)
  // facial weakness: UMN (corticobulbar) is contralateral (default true); peripheral VII structures
  // override crosses:false (ipsilateral). forehead_spared rides with the UMN face (contralateral).
  facial_weakness: true, forehead_spared: true,
  dorsal_sensory: true,    // medial lemniscus has crossed in the medulla
  spinothalamic: true,     // spinothalamic crossed in the cord
  suspended_sensory: false,// bilateral by nature (commissural); crossing is moot for the bilateral central site
  lmn_weakness: false, umn_signs: false, saddle_anaesthesia: false,
  sphincter_dysfunction: false, radicular_pain: false, // midline / local — never cross
  tremor_rubral: true,     // red nucleus lesion -> contralateral tremor
  bradykinesia: true, rest_tremor: true, chorea: true, dystonia: true, rigidity: true, // basal ganglia — contralateral to a focal nucleus lesion
  // non-muscle reflexes: UMN release (Babinski/Hoffmann) follow the corticospinal tract (contra by
  // default, cord structures override to ipsi); frontal release is contralateral; sacral arc is local.
  babinski: true, hoffmann: true, grasp_reflex: true, palmomental: true,
  anal_wink_loss: false, bulbocavernosus_loss: false,
  face_pain_loss: false,   // spinal trigeminal tract/nucleus -> ipsilateral face
  face_touch_loss: false,  // main sensory nucleus (pons) -> ipsilateral face touch
  jaw_weakness: false,     // motor nucleus V -> ipsilateral jaw
  limb_ataxia: false,      // cerebellar connections -> ipsilateral
  dysmetria: false, dysdiadochokinesis: false, intention_tremor: false, // appendicular cerebellar — ipsilateral
  truncal_ataxia: false, ataxic_dysarthria: false, // axial cerebellar — NON_LATERALISED (@none)
  nystagmus_peripheral: false, nystagmus_gaze_evoked: false, nystagmus_downbeat: false, nystagmus_upbeat: false, // nystagmus types — NON_LATERALISED (@none); value moot
  head_impulse_abnormal: false, skew_deviation: false, // HINTS — peripheral / central, @none
  nystagmus_positional_posterior: false, nystagmus_positional_horizontal: false, nystagmus_positional_anterior: false, // BPPV positional — @none
  vertical_gaze_palsy: false, nystagmus_convergence_retraction: false, lid_retraction: false, // dorsal midbrain / pretectal — @none
  nystagmus_pendular: false, palatal_tremor: false, // Guillain-Mollaret triangle — @none
  reduced_consciousness: false, preserved_vertical_gaze: false, extensor_posturing: false, // consciousness / arousal — @none
  miosis: false,           // Horner miosis (descending sympathetic) -> ipsilateral; ptosis (shared) already false
  // pupillary efferent (parasympathetic) — the affected eye, ipsilateral; never cross
  fixed_dilated_pupil: false, light_near_dissociation: false,
  // sympathetic anhidrosis — ipsilateral to the lesion, never cross
  anhidrosis_face: false, anhidrosis_body: false,
  // ocular ductions & lid — ipsilateral to the affected eye (the palsies emerge from which co-occur):
  ptosis: false, weak_adduction: false, weak_abduction: false, weak_elevation: false,
  weak_depression: false, vertical_diplopia: false,
  // all cranial-nerve nuclear/fascicular signs are ipsilateral:
  cn8_vertigo: false, dysphagia: false, cn12_palsy: false, gaze_palsy: false, ino: false,
  // peripheral skull-base CN signs — all ipsilateral
  optic_neuropathy: false, v1_sensory: false, v2_sensory: false, v3_sensory: false, hearing_loss: false,
  altitudinal_defect: false, central_scotoma: false, // optic-nerve field patterns — monocular, ipsilateral eye
  lacrimation_loss: false, hyperacusis: false, taste_loss: false, facial_weak_branch: false,
  gag_afferent_loss: false, taste_posterior: false, palatal_weakness: false, vocal_cord_palsy: false,
  weak_scm: false, weak_trapezius: false,
  // olfactory + insular + articulation — ipsilateral / sideless
  anosmia: false, gustatory_loss: false, dysarthria: false, emotional_lability: false, sensory_ataxia: false,
  // motor-unit pure-motor findings — generalized/symmetric (bilateral), never cross
  fatigable_weakness: false, fatigable_ocular: false, facilitating_weakness: false,
  autonomic_features: false, fasciculations: false, proximal_weakness: false,
  // nerve-root (radiculopathy) findings — ipsilateral, never cross
  weak_diaphragm: false,
  sensory_c3: false, sensory_c4: false, sensory_t4: false, sensory_t10: false, sensory_l1: false,
  sensory_s2: false, sensory_s3: false, saphenous_sensory: false, sural_sensory: false,
  sensory_c5: false, sensory_c6: false, sensory_c7: false, sensory_c8: false, sensory_t1: false,
  sensory_l2: false, sensory_l3: false, sensory_l4: false, sensory_l5: false, sensory_s1: false,
  weak_shoulder_abduction: false, weak_shoulder_external_rotation: false, weak_scapular_stabilisation: false,
  weak_elbow_flexion: false, weak_elbow_extension: false, weak_forearm_supination: false,
  weak_wrist_extension: false, weak_finger_extension: false, weak_wrist_flexion: false, weak_finger_flexion: false,
  weak_thumb_abduction: false, weak_finger_abduction: false,
  weak_hip_flexion: false, weak_hip_adduction: false, weak_hip_abduction: false,
  weak_knee_extension: false, weak_knee_flexion: false, weak_ankle_dorsiflexion: false,
  weak_great_toe_extension: false, weak_foot_eversion: false, weak_foot_inversion: false,
  weak_ankle_plantarflexion: false, weak_toe_flexion: false,
  axillary_sensory: false, musculocutaneous_sensory: false, radial_sensory: false, median_sensory: false,
  ulnar_sensory: false, femoral_sensory: false, obturator_sensory: false, lat_fem_cutaneous_sensory: false,
  sciatic_sensory: false, peroneal_sensory: false, tibial_sensory: false,
  // complete-innervation nerve-segment findings — all peripheral, ipsilateral (never cross)
  weak_forearm_pronation: false, weak_thumb_adduction: false,
  deep_peroneal_sensory: false, ulnar_dorsal_sensory: false, median_palmar_sensory: false, ulnar_claw: false,
  reflex_biceps_loss: false, reflex_brachioradialis_loss: false, reflex_triceps_loss: false,
  reflex_knee_loss: false, reflex_ankle_loss: false,
  // polyneuropathy — bilateral/symmetric, never cross
  distal_sensory_loss: false, distal_motor_weakness: false,
  // cortical somatotopic + visual findings — contralateral (above all decussations)
  weak_arm: true, weak_leg: true, weak_hand: true, cortical_sensory_arm: true, cortical_sensory_leg: true, cortical_sensory_hand: true,
  neglect: true, homonymous_hemianopia: true, superior_quadrantanopia: true, inferior_quadrantanopia: true,
  // visual pathway: bitemporal is midline; RAPD is ipsilateral at the optic nerve (the optic-tract
  // structure overrides crosses:true → contralateral); macular sparing rides the hemianopia (contra).
  bitemporal_hemianopia: false, rapd: false, macular_sparing: true,
  gaze_deviation: false, // conjugate deviation TOWARD the lesion — ipsilateral
  // sideless higher-cortical: crossing is moot, kept false for map completeness
  speech_nonfluent: false, comprehension_impaired: false, repetition_impaired: false, naming_impaired: false,
  agraphia: false, acalculia: false, finger_agnosia: false, left_right_disorientation: false, motor_dysprosody: false,
  sensory_dysprosody: false, anosognosia: false, constructional_apraxia: false, prosopagnosia: false,
  executive_dysfunction: false, abulia: false, disinhibition: false, hallucinations: false,
  limb_apraxia: false, alien_limb: false, urinary_incontinence: false, gait_apraxia: false, // motor-frontal + paracentral — @none
  ideomotor_apraxia: false, dressing_apraxia: false, cortical_deafness: false, kluver_bucy: false, // parietal/temporal — @none
  visual_agnosia: false, achromatopsia: false, alexia_without_agraphia: false, // ventral occipitotemporal — @none
  face_sensory_loss: true, // VPM thalamus — contralateral (like body sensory)
  thalamic_tremor: false, amnesia: false, // thalamus — @none
  diabetes_insipidus: false, thermodysregulation: false, hyperphagia: false, narcolepsy: false, // hypothalamus — @none
  circadian_disruption: false, endocrine_dysfunction: false, // hypothalamus — @none
  callosal_apraxia: false, tactile_anomia: false, // corpus callosum — @none
  mood_change: false, verbal_memory_impairment: false, nonverbal_memory_impairment: false,
  cortical_blindness: false, optic_ataxia: false, oculomotor_apraxia: false, simultanagnosia: false,
  // subcortical deep grey — contralateral (above all decussations)
  thalamic_pain: true, hemiballismus: true,
  // tone & wasting — spasticity follows the corticospinal tract (contra by default; cord + conus
  // structures override crosses:false → ipsi/local); hypotonia & wasting are LMN, local, never cross
  spasticity: true, hypotonia: false, wasting: false,
  // functional (non-organic) signs — sideless, never cross
  hoovers_sign: false, give_way_weakness: false, entrainment: false, exam_inconsistency: false
};

// Findings with no body side — emitted `@none` by the forward model (higher-cortical / behavioural).
export const NON_LATERALISED = new Set([
  "speech_nonfluent","comprehension_impaired","repetition_impaired","naming_impaired",
  "agraphia","acalculia","finger_agnosia","left_right_disorientation","motor_dysprosody","sensory_dysprosody",
  "anosognosia","constructional_apraxia","prosopagnosia","executive_dysfunction","abulia",
  "disinhibition","limb_apraxia","alien_limb","urinary_incontinence","gait_apraxia",
  "ideomotor_apraxia","dressing_apraxia","cortical_deafness","kluver_bucy",
  "visual_agnosia","achromatopsia","alexia_without_agraphia",
  "thalamic_tremor","amnesia", // thalamus — no side (face_sensory_loss is lateralised)
  "diabetes_insipidus","thermodysregulation","hyperphagia","narcolepsy","circadian_disruption","endocrine_dysfunction", // hypothalamus — no side
  "callosal_apraxia","tactile_anomia", // corpus callosum — no side
  "hallucinations","mood_change","verbal_memory_impairment",
  "nonverbal_memory_impairment","cortical_blindness","optic_ataxia","oculomotor_apraxia","simultanagnosia",
  "truncal_ataxia","ataxic_dysarthria", // axial cerebellar — no side
  "nystagmus_peripheral","nystagmus_gaze_evoked","nystagmus_downbeat","nystagmus_upbeat", // nystagmus types — no side
  "head_impulse_abnormal","skew_deviation", // HINTS — no side
  "nystagmus_positional_posterior","nystagmus_positional_horizontal","nystagmus_positional_anterior", // BPPV positional — no side
  "nystagmus_convergence_retraction","vertical_gaze_palsy","lid_retraction", // dorsal midbrain / pretectal — no side
  "nystagmus_pendular","palatal_tremor", // Guillain-Mollaret triangle — no side
  "reduced_consciousness","preserved_vertical_gaze","extensor_posturing", // consciousness / arousal — no side
  "dysarthria", // general articulation sign — no side (many sources; combinations localise)
  "emotional_lability", // pseudobulbar affect — no side
  "sensory_ataxia", // proprioceptive / Romberg-positive gait ataxia — no side
  "hoovers_sign","give_way_weakness","entrainment","exam_inconsistency" // functional signs — no side
]);

export function isFinding(id) { return Object.prototype.hasOwnProperty.call(FINDINGS, id); }

// multifocal.js — THE CROSS-SITE PATHOLOGY LAYER. Content only; the matching logic lives in
// src/engine/multifocal.js, so this file can be clinically reviewed on its own.
//
// CAUSES is keyed per site and therefore cannot express these: MND is not a cause AT the anterior horn,
// it is a process spanning the anterior horn and the corticospinal tract.
//
// PREDICATES ARE OVER ANATOMICAL ATTRIBUTES, NEVER SITE IDS — 201 sites makes id combinations
// combinatorial and stale the moment a site is added. Same "derive, don't store" rule as the rest of
// the engine.
//
// Spec: docs/superpowers/specs/2026-08-14-multi-location-ddx-design.md §2

// `forbids` names a finding CLASS, not individual ids, so a roster entry cannot silently stop working
// when a new finding is added to the vocabulary.
export const FINDING_CLASSES = {
  sensory: ["spinothalamic", "dorsal_sensory", "distal_sensory_loss", "suspended_sensory", "sensory_ataxia",
    "cortical_sensory_arm", "cortical_sensory_leg", "cortical_sensory_hand", "saddle_anaesthesia",
    "face_sensory_loss", "face_pain_loss", "thalamic_pain"],
  visual: ["homonymous_hemianopia", "superior_quadrantanopia", "inferior_quadrantanopia",
    "bitemporal_hemianopia", "optic_neuropathy", "rapd", "optic_atrophy", "central_scotoma",
    "altitudinal_defect", "cortical_blindness"],
  bulbar: ["dysphagia", "palatal_weakness", "vocal_cord_palsy", "cn12_palsy", "dysarthria"],
  cortical: ["speech_nonfluent", "comprehension_impaired", "repetition_impaired", "neglect", "amnesia",
    "limb_apraxia", "agraphia", "acalculia", "visual_agnosia", "prosopagnosia"],
};

// mf(name, cat, opts) — mirrors c() in causes.js.
//   pattern      ["mass"|"territorial"|"surface"|"systemSelective"|"nerveTrunk"|"motorSystem"|"cns"]
//                the SHAPE of dissemination this disease produces (PATTERNS in engine/multifocal.js).
//                ANY ONE matching fires — some diseases have more than one mode (systemic vasculitis is
//                territorial in the CNS and a nerve-trunk process in the PNS). This REPLACED `spread`,
//                which asked only "are there two sites?" and so fired nine of thirteen entities together.
//   sites        [{compartment|level|region}]      specific places, each matched by a DISTINCT site
//   motor        "mixed"                            delegates to umnLmnPattern() over the observed findings
//   forbids      ["sensory"]                        finding CLASSES that exclude this entity
//   compartments ["brain","cord",...]  OPTIONAL allow-list of compartments the entity can plausibly
//                involve (owner ruling 4, 2026-08-14) — a HARD constraint like pattern/sites/motor/forbids:
//                if declared, EVERY site in the picture must resolve to one of the listed compartments or
//                the entity does not fire at all. This is anatomy, not tempo — it filters, it never merely
//                demotes. An entity without the field is unconstrained.
//   course/tempo SOFT axes — they demote, they never drop (owner ruling 2026-08-14)
//   matches      RegExp                             canonicalises per-site CAUSES names onto this entity
const mf = (name, cat, opts) => ({ name, cat, red: false, confirm: "", ...opts });

export const MULTIFOCAL = [
  mf("Motor neurone disease (ALS)", "degenerative", {
    pattern: ["motorSystem"], motor: "mixed", forbids: ["sensory"],
    // Owner ruling 4 (2026-08-14) draft allow-list — the anterior horn/corticospinal disease process.
    compartments: ["brain", "brainstem", "cord", "motor_unit"],
    course: ["progressive"], tempo: ["subacute", "chronic"], likelihood: "common",
    matches: /motor neurone|motor neuron|\bALS\b|amyotrophic/i,
    red: "Progressive bulbar or respiratory involvement — assess FVC early, before symptoms of hypoventilation appear",
    feature: "Painless, progressive and asymmetric; wasting and fasciculation in a limb with a brisk reflex in that same limb",
    confirm: "Fasciculation in two or more regions with entirely preserved sensation on formal testing",
  }),
  mf("Multiple sclerosis", "inflammatory", {
    pattern: ["cns"],
    // Owner ruling 3 (2026-08-14): MS fired on ANY two distinct compartments — including anatomically
    // senseless pairs like skull base + sympathetic chain (690 new site pairs once those two compartments
    // were split out). Restricted to the CNS: brain, brainstem, cerebellum, cord. `optic` is included
    // DELIBERATELY — the optic nerve is a CNS tract, and optic neuritis is a defining MS presentation (see
    // `feature` below, which names it). Flag for the owner's veto if they disagree with including it.
    compartments: ["brain", "brainstem", "cerebellum", "cord", "optic"],
    course: ["relapsing", "progressive", "stepwise"], tempo: ["subacute"], likelihood: "common",
    // Excludes osmotic demyelination (central/extrapontine myelinolysis) — a distinct osmotic/metabolic
    // entity that otherwise matches `demyelinat` and gets wrongly canonicalised onto MS (2026-08-14 review).
    matches: /^(?!.*(?:osmotic demyelinat|myelinolysis|extrapontine)).*(?:demyelinat|multiple sclerosis|\bMS plaque\b)/i,
    // Owner ruling 2 (2026-08-14): flag a first presentation disseminated in space. MS's only clause is
    // `pattern: ["cns"]`, so this flag applies to every case that fires at all.
    red: "A first presentation already disseminated in space is not a one-off — confirm the diagnosis formally, because it changes long-term management",
    feature: "Lesions separated in space AND time, typically optic nerve, brainstem, cord or periventricular white matter; young adult, symptoms evolving over days then partly recovering",
    confirm: "Uhthoff's phenomenon — the deficit reappears or worsens with heat or exercise",
  }),
  mf("Metastases", "neoplastic", {
    // Owner ruling (2026-08-15), TYPICALITY not possibility: metastases can reach a peripheral nerve or
    // plexus, but it almost never happens, and listing it there is noise. Constrained to where secondary
    // deposits actually land.
    compartments: ["brain", "brainstem", "cerebellum", "cord"],
    pattern: ["mass"],
    course: ["progressive", "stepwise"], tempo: ["subacute", "chronic"], likelihood: "common",
    matches: /metasta/i,
    red: "Multiple lesions with a known or suspected primary — image the whole neuraxis and look for cord compression",
    feature: "Several lesions appearing over weeks, with systemic features (weight loss, a known primary, smoking history); headache worse on waking",
    confirm: "Examine the breasts, chest, skin and lymph nodes — the primary is often findable at the bedside",
  }),
  mf("Vasculitis (CNS or systemic)", "inflammatory", {
    // Deliberately the BROADEST allow-list — hitting both CNS and PNS is the point of systemic vasculitis
    // (that is what mononeuritis multiplex IS). But it does not typically pick off the neuromuscular
    // junction/muscle, the pupillary efferent, the sympathetic chain or the cauda, so those are excluded.
    compartments: ["brain", "brainstem", "cerebellum", "cord", "optic", "skull_base", "root", "plexus", "nerve"],
    pattern: ["territorial", "nerveTrunk"],
    course: ["stepwise", "progressive"], tempo: ["acute", "subacute"], likelihood: "uncommon",
    matches: /vasculit/i,
    red: "Stepwise multifocal deficits with systemic inflammation — untreated, each step causes further irreversible loss",
    feature: "Discrete events with plateaus between them, systemic features (rash, arthralgia, weight loss, raised inflammatory markers), often painful",
    confirm: "Palpable purpura, nail-fold infarcts, or a mononeuritis multiplex pattern on limb examination",
  }),
  mf("Neurosarcoidosis", "inflammatory", {
    sites: [{ compartment: "skull_base" }, {}],
    // Owner ruling 4 (2026-08-14) draft allow-list — granulomatous disease along the neuraxis and its
    // cranial/spinal nerve exits; excludes cerebellum, plexus, motor_unit, pupil and sympathetic.
    // `cauda` dropped 2026-08-15 (typicality review): cranial neuropathy, basal meningitis, optic
    // neuropathy and myelopathy are the typical neurosarcoid presentations; a cauda syndrome is not.
    compartments: ["brain", "brainstem", "cord", "root", "nerve", "optic", "skull_base"],
    course: ["progressive", "relapsing"], tempo: ["subacute", "chronic"], likelihood: "uncommon",
    matches: /sarcoid/i,
    red: false,
    feature: "Cranial neuropathy (especially facial, often bilateral) with a second deficit elsewhere; basal meningeal involvement; may have hilar lymphadenopathy or uveitis",
    confirm: "Look for uveitis, erythema nodosum, lupus pernio and parotid enlargement",
  }),
  mf("Mononeuritis multiplex", "inflammatory", {
    sites: [{ compartment: "nerve" }, { compartment: "nerve" }],
    course: ["stepwise"], tempo: ["acute", "subacute"], likelihood: "uncommon",
    matches: /mononeuritis multiplex/i,
    red: "Successive named-nerve palsies — a vasculitic emergency until proven otherwise",
    feature: "Two or more NAMED nerves picked off sequentially, each with pain at onset; not a length-dependent pattern",
    confirm: "Map the deficit against named-nerve territories — the sparing rules (triceps, first web space, inversion) show it is not a root or a plexus",
  }),
  mf("Leptomeningeal disease", "neoplastic", {
    pattern: ["surface"],
    // Owner ruling 4 (2026-08-14) draft allow-list — CSF-bathed surfaces and the nerves/roots that run
    // through them; excludes plexus, nerve (distal to the CSF space), motor_unit, pupil, sympathetic.
    // `root` and `cauda` KEPT deliberately (2026-08-15): leptomeningeal carcinomatosis classically presents
    // with cranial neuropathies PLUS radiculopathy, and cauda equina polyradiculopathy is a recognised
    // presentation — this entity's own `feature` names radiculopathy. `cerebellum` dropped: spread over the
    // cerebellar surface is real but is not what makes anyone think of the diagnosis.
    compartments: ["brain", "brainstem", "cord", "cauda", "root", "skull_base"],
    course: ["progressive", "stepwise"], tempo: ["subacute"], likelihood: "uncommon",
    matches: /leptomeningeal|carcinomatous meningitis|meningeal carcinomatosis/i,
    red: "Multiple cranial neuropathies with radicular pain and headache — needs CSF, and repeat cytology if the first is negative",
    feature: "Deficits that do not fit ONE place: several cranial nerves plus radiculopathy plus headache, in a patient with known malignancy",
    confirm: "Multiple cranial nerve palsies at different skull-base exits at once",
  }),
  mf("NMOSD (neuromyelitis optica spectrum disorder)", "inflammatory", {
    sites: [{ compartment: "optic" }, { compartment: "cord" }],
    course: ["relapsing"], tempo: ["acute", "subacute"], likelihood: "uncommon",
    matches: /NMOSD|neuromyelitis/i,
    red: "Optic neuritis with myelitis — attacks are more destructive than MS and treated differently; needs AQP4 testing",
    feature: "Severe optic neuritis (often bilateral) with a longitudinally extensive myelitis; intractable hiccups or vomiting from the area postrema",
    confirm: "Poorer visual recovery and a more severe cord syndrome than MS would produce",
  }),
  mf("Primary CNS lymphoma", "neoplastic", {
    pattern: ["mass"],
    // Owner ruling 4 (2026-08-14) draft allow-list — a CNS-parenchymal disease (the name says so).
    // `cord` dropped 2026-08-15 (typicality review): periventricular/deep brain and vitreoretinal disease
    // are typical; primary spinal cord lymphoma is rare enough to be noise.
    compartments: ["brain", "brainstem", "cerebellum", "optic"],
    course: ["progressive"], tempo: ["subacute"], likelihood: "rare",
    matches: /lymphoma/i,
    red: "Do NOT give steroids before biopsy — the lesion melts away and the diagnosis is lost",
    feature: "Periventricular lesions crossing the midline, progressing over weeks; immunosuppression or HIV raises the odds sharply",
    confirm: "Examine the eyes — vitreous involvement (ocular lymphoma) can be seen on slit lamp",
  }),
  mf("Neurofibromatosis type 2", "congenital", {
    sites: [{ compartment: "skull_base" }, {}],
    // Owner ruling 4 (2026-08-14) draft allow-list — schwannomas/meningiomas along CNS surfaces and
    // nerve roots; excludes cerebellum (the vestibular schwannoma itself is a skull_base/CPA site),
    // cauda, plexus, motor_unit, optic, pupil, sympathetic.
    compartments: ["brain", "cord", "root", "nerve", "skull_base"],
    course: ["progressive"], tempo: ["chronic"], likelihood: "rare",
    matches: /neurofibromatosis|\bNF2\b/i,
    red: false,
    feature: "Bilateral vestibular schwannomas, often with meningiomas and spinal tumours; family history; presents in young adulthood",
    confirm: "Bilateral sensorineural hearing loss with cutaneous schwannomas and posterior subcapsular cataracts",
  }),
  mf("Paraneoplastic syndrome", "inflammatory", {
    pattern: ["systemSelective"],
    // Owner ruling 4 (2026-08-14) draft allow-list — antibody-mediated attack on neurons/nerves/junction
    // across the neuraxis (limbic, cerebellar, brainstem, dorsal root ganglia, NMJ per its own `feature`).
    compartments: ["brain", "brainstem", "cerebellum", "cord", "root", "nerve", "motor_unit"],
    course: ["progressive", "stepwise"], tempo: ["subacute"], likelihood: "rare",
    matches: /paraneoplastic|anti-Hu|anti-Ma2|anti-Yo/i,
    red: "A subacute multifocal syndrome may precede the tumour by months — the cancer search is the investigation",
    feature: "Subacute progression over weeks affecting several levels at once (limbic, cerebellar, brainstem, dorsal root ganglia), out of proportion to imaging",
    confirm: "Weight loss with a sensory neuronopathy — sensory loss that is non-length-dependent, affecting face and trunk",
  }),
  mf("Neurosyphilis or HIV", "infective", {
    pattern: ["mass", "surface", "nerveTrunk"],
    // Owner ruling 4 (2026-08-14) draft allow-list — "any combination of cognitive change, myelopathy,
    // neuropathy and cranial neuropathy" per its own `feature`; excludes cerebellum, cauda, plexus,
    // motor_unit, pupil, sympathetic.
    compartments: ["brain", "brainstem", "cord", "root", "nerve", "skull_base", "optic"],
    course: ["progressive", "stepwise"], tempo: ["subacute", "chronic"], likelihood: "rare",
    matches: /syphilis|\bHIV\b|tabes/i,
    red: "Treatable and routinely missed — test whenever a multifocal picture has no better explanation",
    feature: "Any combination of cognitive change, myelopathy, neuropathy and cranial neuropathy in one patient; risk factors may not be volunteered",
    confirm: "Argyll Robertson pupils — small, irregular, accommodating but not reacting to light",
  }),
  mf("Embolic shower (cardiac or aortic source)", "vascular", {
    pattern: ["territorial"],
    // Owner ruling 4 (2026-08-14) draft allow-list — arterial territories a shower of emboli can reach.
    // `cord` dropped 2026-08-15 (typicality review): retinal emboli are typical, but embolic cord
    // infarction from a cardiac shower is vanishingly rare.
    compartments: ["brain", "brainstem", "cerebellum", "optic"],
    course: ["simultaneous"], tempo: ["hyperacute", "acute"], likelihood: "common",
    matches: /embol/i,
    red: "Multiple territories at once means a PROXIMAL source — needs urgent cardiac and aortic imaging to prevent the next shower",
    feature: "Several deficits all beginning at the same moment, in different vascular territories; atrial fibrillation, recent instrumentation or endocarditis",
    confirm: "Irregular pulse, a new murmur, splinter haemorrhages or Roth spots",
  }),
];

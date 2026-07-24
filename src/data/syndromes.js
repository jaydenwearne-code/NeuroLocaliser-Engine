// syndromes.js — the THIN descriptive layer.
//
// The engine localises to a site purely from anatomy. This layer does one job: given the
// site the engine chose, attach the eponym clinicians use for a lesion there, plus clinical
// colour (differentials, red flags). It is descriptive, not part of localisation — remove it
// and the engine still localises correctly, it just returns "left medial midbrain" instead of
// "Weber syndrome".
//
// Keyed by site id (side-agnostic where the eponym is bilateral in usage). This is a lookup
// from an EMERGENT location to a name — not a set of rules the solver reasons with.

export const BY_SITE = {
  midbrain_medial: {
    name: "Weber syndrome (or medial midbrain syndrome)",
    note: "CN III fascicle + corticospinal/corticobulbar tract in the cerebral peduncle.",
    ddx: ["Midbrain infarct (PCA perforators)", "Haemorrhage / cavernous malformation", "Tumour", "Demyelination"],
    red: "Crossed midbrain signs can be haemorrhage, not just infarct — image before assuming stroke."
  },
  midbrain_lateral: {
    name: "Lateral midbrain / tegmental syndrome",
    note: "Medial lemniscus + spinothalamic tract laterally; if red nucleus/SCP involved, expect tremor/ataxia (Benedikt/Claude spectrum).",
    ddx: ["Midbrain infarct", "Demyelination", "Tumour"],
    red: "Posterior circulation imaging is warranted for any crossed midbrain picture."
  },
  pons_medial: {
    name: "Medial pontine syndrome (Millard-Gubler / Foville spectrum)",
    note: "CN VI ± VII fascicles with the corticospinal tract in the basis pontis; add gaze palsy + INO for Foville / one-and-a-half.",
    ddx: ["Pontine infarct (basilar perforators)", "Central pontine myelinolysis", "Demyelination", "Pontine glioma"],
    red: "Basilar territory disease can progress to locked-in syndrome — watch closely."
  },
  pons_lateral: {
    name: "Lateral pontine syndrome (Marie-Foix)",
    note: "Middle cerebellar peduncle, spinothalamic tract and vestibular nuclei laterally (AICA territory).",
    ddx: ["AICA infarct", "Demyelination", "Tumour"],
    red: "AICA strokes can cause deafness — the labyrinthine artery is a branch."
  },
  medulla_medial: {
    name: "Medial medullary syndrome (Dejerine)",
    note: "Hypoglossal nucleus + pyramid + medial lemniscus (anterior spinal / vertebral territory).",
    ddx: ["Medial medullary infarct", "Vertebral artery disease/dissection", "Demyelination"],
    red: "Bilateral involvement threatens respiration — monitor and image urgently."
  },
  medulla_lateral: {
    name: "Lateral medullary syndrome (Wallenberg)",
    note: "Spinal trigeminal, spinothalamic, nucleus ambiguus, vestibular nuclei, sympathetic fibres and cerebellar peduncle in one PICA wedge.",
    ddx: ["PICA / vertebral infarct", "Vertebral artery dissection", "Demyelination"],
    red: "Swallowing can fail early — keep nil by mouth until assessed."
  },
  medulla_hemi: {
    name: "Hemimedullary syndrome (Reinhold)",
    note: "Medial + lateral medulla together on one side — Dejerine plus Wallenberg features.",
    ddx: ["Vertebral artery occlusion/dissection"],
    red: "A large vertebral territory event — high stakes, image the vessels."
  },

  // ---- SPINAL CORD ----
  cord_hemi: {
    name: "Brown-Séquard syndrome (cord hemisection)",
    note: "One cord half: ipsilateral weakness (corticospinal) + ipsilateral vibration/proprioception loss (dorsal columns) + contralateral pain/temperature loss (spinothalamic), all below the level.",
    ddx: ["Penetrating/traumatic cord injury", "Compressive lesion (tumour, disc)", "Demyelination (MS)", "Cord infarct (partial)"],
    red: "A structural cord lesion until proven otherwise — urgent MRI; a compressive cause is a surgical emergency."
  },
  cord_anterior: {
    name: "Anterior cord syndrome (anterior spinal artery)",
    note: "Anterior two-thirds of the cord: bilateral weakness + bilateral pain/temperature loss, with vibration/proprioception SPARED (dorsal columns are posterior-spinal territory).",
    ddx: ["Anterior spinal artery infarct", "Aortic disease/surgery (watershed)", "Severe compression", "Demyelination"],
    red: "Preserved vibration with dense weakness and a dissociated sensory loss points to ASA territory — look for an aortic/vascular cause."
  },
  cord_posterior: {
    name: "Posterior column syndrome (SCD pattern)",
    note: "Dorsal columns bilaterally: vibration/proprioception loss and sensory ataxia, with power and pain/temperature relatively spared.",
    ddx: ["Subacute combined degeneration (B12/copper deficiency)", "Posterior spinal artery infarct", "Tabes dorsalis", "Demyelination"],
    red: "Check B12/copper before it becomes irreversible — a treatable cause of a progressive myelopathy."
  },
  cord_transverse: {
    name: "Transverse myelopathy (complete cord cross-section)",
    note: "The whole cord cross-section at a level: bilateral weakness, all sensory modalities lost, and (clinically) sphincter involvement below the level.",
    ddx: ["Transverse myelitis (demyelinating/autoimmune/infective)", "Compression (tumour, abscess, disc)", "Cord infarct", "Trauma"],
    red: "A new bilateral myelopathy with a sensory level is a neurological emergency — MRI the whole cord to exclude compression before anything else."
  },
  cord_central: {
    name: "Central cord syndrome (syringomyelia / intramedullary)",
    note: "Central expansion strikes the decussating spinothalamic fibres in the anterior white commissure: bilateral, suspended (cape-like) dissociated pain/temperature loss with dorsal columns preserved and characteristic sacral sparing.",
    ddx: ["Syringomyelia (± Chiari I)", "Intramedullary tumour (ependymoma, astrocytoma)", "Post-traumatic syrinx", "Hydromyelia"],
    red: "Sacral sparing + a suspended dissociated loss points intramedullary — MRI the cord; exclude a tumour or Chiari malformation."
  },
  cauda_equina: {
    name: "Cauda equina syndrome",
    note: "Compression of the lumbosacral nerve roots below the conus: flaccid, areflexic (LMN) leg weakness, often asymmetric, with radicular pain (sciatica), saddle anaesthesia and bladder/bowel dysfunction.",
    ddx: ["Central lumbar disc prolapse", "Tumour / metastasis", "Epidural abscess or haematoma", "Trauma"],
    red: "A surgical emergency — new saddle anaesthesia, bladder dysfunction or bilateral sciatica needs urgent MRI and decompression."
  },
  conus_medullaris: {
    name: "Conus medullaris syndrome",
    note: "Lesion of the sacral cord tip: early, symmetric saddle anaesthesia and bladder/bowel dysfunction with a mixed UMN + LMN picture (UMN signs — hyperreflexia, extensor plantars) and relatively symmetric, less radicular leg involvement.",
    ddx: ["Intramedullary or extramedullary tumour", "Disc / compression at T12–L1", "Ischaemia", "Demyelination"],
    red: "Early symmetric sphincter involvement with UMN signs — urgent MRI of the conus; distinguish from cauda equina as it changes the level imaged."
  },

  // ---- CEREBRAL CORTEX (variant entries: dominant vs non-dominant where the eponym differs) ----
  cortex_aca: {
    name: "Anterior cerebral artery (ACA) syndrome",
    note: "Medial hemisphere: contralateral leg-predominant weakness and cortical sensory loss, with abulia/apathy (medial prefrontal). Arm and face relatively spared.",
    ddx: ["ACA infarct", "Parasagittal meningioma or metastasis", "Anterior communicating artery aneurysm", "Superior sagittal sinus thrombosis"],
    red: "Bilateral ACA territory (azygos ACA) causes paraparesis + abulia that can mimic a cord or psychiatric picture — image the vessels."
  },
  cortex_mca_superior: {
    dominant: {
      name: "Dominant MCA superior division syndrome (Broca)",
      note: "Fronto-opercular: contralateral face/arm-predominant weakness, cortical sensory loss, non-fluent (Broca's) aphasia, and conjugate gaze deviation toward the lesion.",
      ddx: ["MCA superior division infarct", "Intracerebral haemorrhage", "Tumour", "Focal seizure with Todd's paresis"],
      red: "A gaze-deviated, aphasic, face/arm-weak patient is a large-vessel stroke until proven otherwise — time-critical."
    },
    nondominant: {
      name: "Non-dominant MCA superior division syndrome",
      note: "Fronto-opercular: contralateral face/arm-predominant weakness and cortical sensory loss with motor aprosodia (flat, unmodulated speech) and gaze deviation toward the lesion.",
      ddx: ["MCA superior division infarct", "Haemorrhage", "Tumour", "Focal seizure"],
      red: "Same large-vessel urgency as the dominant side; the language exam looks deceptively normal."
    }
  },
  cortex_mca_inferior: {
    dominant: {
      name: "Dominant MCA inferior division syndrome (Wernicke)",
      note: "Temporoparietal: fluent (Wernicke's) receptive aphasia, contralateral quadrantanopia, ± Gerstmann features, with little or no weakness.",
      ddx: ["MCA inferior division infarct", "Haemorrhage", "Tumour", "Herpes simplex encephalitis (temporal)"],
      red: "Fluent-but-nonsensical speech without weakness is easily mistaken for delirium/psychiatric — it is a stroke syndrome."
    },
    nondominant: {
      name: "Non-dominant MCA inferior division syndrome (neglect)",
      note: "Temporoparietal: hemispatial neglect, anosognosia, constructional apraxia, sensory aprosodia and a contralateral quadrantanopia, with little or no weakness.",
      ddx: ["MCA inferior division infarct", "Haemorrhage", "Tumour"],
      red: "Dense neglect with anosognosia underestimates the deficit — the patient denies it; corroborate and image."
    }
  },
  cortex_mca: {
    dominant: {
      name: "Complete dominant MCA syndrome (global aphasia)",
      note: "Whole MCA territory: dense contralateral face/arm-predominant hemiparesis and hemisensory loss, global aphasia, homonymous field loss and gaze deviation toward the lesion.",
      ddx: ["Proximal MCA / carotid-T occlusion", "Large intracerebral haemorrhage", "Malignant MCA infarction"],
      red: "Malignant MCA infarction risks fatal oedema — monitor conscious level; consider decompressive hemicraniectomy early."
    },
    nondominant: {
      name: "Complete non-dominant MCA syndrome",
      note: "Whole MCA territory: dense contralateral hemiparesis and hemisensory loss, profound neglect/anosognosia, homonymous field loss and gaze deviation toward the lesion.",
      ddx: ["Proximal MCA / carotid-T occlusion", "Large haemorrhage", "Malignant MCA infarction"],
      red: "Malignant MCA infarction risk as for the dominant side; neglect masks the severity."
    }
  },
  cortex_pca: {
    name: "Posterior cerebral artery (PCA) syndrome",
    note: "Occipital: isolated contralateral homonymous hemianopia (often with macular sparing); minimal other deficit.",
    ddx: ["PCA infarct", "Occipital haemorrhage", "Tumour", "Posterior reversible encephalopathy (PRES)", "Migrainous / seizure aura"],
    red: "An isolated hemianopia is easily missed — confrontation-test fields; consider a posterior-circulation cause."
  },
  cortex_occipital: {
    name: "Occipital (PCA territory) syndrome",
    note: "Primary visual cortex lesion: contralateral homonymous hemianopia, typically with macular sparing; the vascular label is the posterior cerebral artery.",
    ddx: ["PCA infarct", "Occipital haemorrhage", "Tumour", "PRES", "Migrainous / seizure aura"],
    red: "Confrontation-test the fields — an isolated hemianopia is easily overlooked; posterior circulation imaging is warranted."
  },
  cortex_parietal: {
    dominant: {
      name: "Dominant parietal syndrome (Gerstmann / ideomotor apraxia)",
      note: "Angular/supramarginal gyrus: Gerstmann tetrad (agraphia, acalculia, finger agnosia, right–left disorientation) and ideomotor apraxia, ± inferior quadrantanopia.",
      ddx: ["Infarct (MCA inferior division)", "Tumour (glioma, metastasis)", "Focal seizure", "Neurodegeneration (posterior cortical)"],
      red: "A focal cortical syndrome without weakness still needs imaging — tumour and stroke present identically here."
    },
    nondominant: {
      name: "Non-dominant parietal syndrome (neglect)",
      note: "Hemispatial neglect, anosognosia, constructional apraxia and dressing apraxia, ± inferior quadrantanopia.",
      ddx: ["Infarct (MCA inferior division)", "Tumour", "Focal seizure"],
      red: "Neglect with anosognosia leads patients to deny deficits — corroborate history and examine formally."
    }
  },
  cortex_temporoparietal: {
    dominant: {
      name: "Dominant temporoparietal syndrome (Wernicke's aphasia)",
      note: "Fluent, paraphasic speech with impaired comprehension and repetition; ± quadrantanopia.",
      ddx: ["MCA inferior division infarct", "Tumour", "Herpes simplex encephalitis", "Focal seizure"],
      red: "Acute fluent aphasia can be mistaken for confusion — it is a localising cortical sign."
    },
    nondominant: {
      name: "Non-dominant temporoparietal syndrome (sensory aprosodia)",
      note: "Impaired comprehension of emotional prosody, ± quadrantanopia and neglect features.",
      ddx: ["MCA inferior division infarct", "Tumour", "Focal seizure"],
      red: "Subtle; the deficit is in emotional communication rather than words."
    }
  },
  cortex_medial_pfc: {
    name: "Medial frontal (ACA) behavioural syndrome",
    note: "Apathy / abulia — reduced spontaneous behaviour and initiation, out of proportion to weakness.",
    ddx: ["ACA infarct", "Parasagittal tumour", "Anterior communicating aneurysm rupture", "Normal-pressure hydrocephalus"],
    red: "Abulia is easily labelled 'depression' — an acute-onset case warrants imaging."
  },
  cortex_orbitofrontal: {
    name: "Orbitofrontal syndrome",
    note: "Disinhibition, personality change and irritability with relatively preserved elementary neurology.",
    ddx: ["Orbitofrontal contusion (head injury)", "Subfrontal meningioma", "Frontotemporal dementia", "Anterior communicating aneurysm"],
    red: "Personality change with anosmia suggests a subfrontal mass — image before attributing to psychiatry."
  },
  cortex_temporal: {
    name: "Temporal lobe syndrome",
    note: "Material-specific short-term memory impairment (verbal if dominant, non-verbal if non-dominant), episodic hallucinations/fear or mood change, ± superior quadrantanopia.",
    ddx: ["Temporal tumour", "Herpes simplex encephalitis", "Mesial temporal sclerosis / focal seizures", "MCA inferior division infarct"],
    red: "New olfactory/gustatory hallucinations or episodic fear may be focal seizures — consider EEG and imaging."
  },
  bilateral_occipital: {
    name: "Anton's syndrome (bilateral occipital)",
    note: "Cortical blindness with denial of blindness (visual anosognosia) — pupils and fundi normal, patient confabulates vision.",
    ddx: ["Bilateral PCA infarction (top-of-basilar)", "PRES / eclampsia", "Hypoxic-ischaemic injury", "Bilateral occipital tumour"],
    red: "Top-of-the-basilar embolism is a treatable cause of bilateral occipital stroke — image the posterior circulation urgently."
  },
  bilateral_auditory: {
    name: "Cortical deafness (bilateral primary auditory)",
    note: "Bilateral primary auditory cortex (Heschl's gyri) — deafness with normal peripheral hearing (intact OAEs / brainstem responses); a spectrum with auditory agnosia and pure word deafness.",
    ddx: ["Bilateral (sequential) MCA / temporal infarcts", "Haemorrhage", "Trauma", "Herpes encephalitis"],
    red: "Deafness with a normal audiogram and intact brainstem responses points to bilateral cortical lesions — image both temporal lobes."
  },
  bilateral_anterior_temporal: {
    name: "Klüver-Bucy syndrome (bilateral anterior temporal)",
    note: "Bilateral anterior temporal / amygdala injury — placidity, hyperorality, hypersexuality, hypermetamorphosis and visual (or multimodal) agnosia.",
    ddx: ["Herpes simplex encephalitis", "Frontotemporal dementia", "Bilateral temporal trauma / surgery", "Anoxic injury"],
    red: "Acute Klüver-Bucy features with fever / confusion — treat empirically for HSV encephalitis while imaging and doing an LP."
  },
  bilateral_fusiform: {
    name: "Ventral occipitotemporal (fusiform) syndrome — visual agnosia / achromatopsia",
    note: "Bilateral ventral occipitotemporal ('what' stream) — visual object agnosia (cannot recognise seen objects) and cerebral achromatopsia (loss of colour vision), often with prosopagnosia and alexia.",
    ddx: ["Bilateral PCA infarction", "Posterior cortical atrophy", "Anoxic injury", "PRES"],
    red: "Bilateral ventral occipitotemporal lesions imply a posterior-circulation or degenerative process — image the PCA territories."
  },
  cortex_fusiform: {
    dominant: {
      name: "Alexia without agraphia (pure alexia) — dominant fusiform / visual word form area",
      note: "Can write but not read own writing; a left occipital + splenial (or fusiform / VWFA) disconnection — the seen word cannot reach the language cortex. Classically with a right homonymous hemianopia.",
      ddx: ["Left PCA infarct (occipital + splenium)", "Tumour (splenial / medial occipitotemporal)", "Neurodegeneration"],
      red: "New pure alexia with a right hemianopia is a left PCA stroke until proven otherwise."
    },
    nondominant: {
      name: "Prosopagnosia — non-dominant fusiform",
      note: "Impaired recognition of familiar faces despite intact vision and naming of other objects (fusiform face area); may extend to other within-category discrimination.",
      ddx: ["Right / bilateral PCA infarct", "Tumour", "Neurodegeneration (right temporal variant)"],
      red: "Acquired prosopagnosia points to the right (or bilateral) fusiform — image the medial occipitotemporal region."
    }
  },
  bilateral_parietal: {
    name: "Balint's syndrome (bilateral parieto-occipital)",
    note: "Simultanagnosia, optic ataxia and oculomotor apraxia from bilateral parieto-occipital dysfunction.",
    ddx: ["Watershed infarction (bilateral)", "Posterior cortical atrophy", "PRES", "Hypoxic-ischaemic injury"],
    red: "Bilateral watershed infarcts imply global hypoperfusion — look for a cardiac/haemodynamic cause."
  },

  // ---- SUBCORTEX (deep grey + deep white; the cortical-vs-subcortical distinction) ----
  subcortex_internal_capsule: {
    name: "Pure motor lacune (internal capsule)",
    note: "Lenticulostriate perforator: dense, proportional contralateral face + arm + leg weakness with NO cortical signs (no aphasia, neglect, gaze deviation or field defect). The absence of cortical signs is the localiser.",
    ddx: ["Small-vessel (lacunar) infarct", "Deep (capsular/putaminal) haemorrhage", "Demyelination", "Small deep metastasis"],
    red: "A stuttering or fluctuating pure-motor deficit is the capsular warning syndrome — a lacune in evolution; treat and monitor closely."
  },
  subcortex_thalamus: {
    name: "Pure sensory lacune / Déjerine–Roussy (thalamic VPL)",
    note: "Ventral posterolateral thalamus: contralateral loss of all sensory modalities on the face, arm and leg, with no weakness; a delayed contralateral central post-stroke pain (Déjerine–Roussy) may follow.",
    ddx: ["Thalamic lacunar infarct", "Thalamic haemorrhage", "Demyelination", "Small tumour / metastasis"],
    red: "Central post-stroke pain is often refractory and misattributed — it is a thalamic sign, not functional."
  },
  // ---- VESTIBULAR / NYSTAGMUS (peripheral labyrinth + central directional generators) ----
  peripheral_vestibular_labyrinth: {
    name: "Peripheral vestibular syndrome (labyrinth / vestibular nerve)",
    note: "Unidirectional, fixation-suppressed, fatigable horizontal-torsional nystagmus with vertigo and an ABNORMAL head-impulse (corrective saccade) — the peripheral (benign) HINTS pattern. Hearing loss/tinnitus (if present) points to a cochlear/labyrinthine process (labyrinthitis, Ménière) rather than pure vestibular neuritis.",
    ddx: ["Vestibular neuritis (no hearing loss)", "Labyrinthitis (+ hearing loss)", "Ménière's disease", "BPPV (positional)", "Vestibular schwannoma (nerve)"],
    red: "An acute vestibular syndrome with CENTRAL features (direction-changing/gaze-evoked or vertical nystagmus, NORMAL head-impulse, skew) is a posterior-circulation stroke until proven otherwise — image, do not reassure."
  },
  peripheral_vestibular_posterior_canal: {
    name: "Posterior-canal BPPV",
    note: "Brief, position-triggered vertigo with up-beat torsional nystagmus on the Dix-Hallpike manoeuvre — otoconia in the posterior semicircular canal. The commonest BPPV; head-impulse and skew are normal.",
    ddx: ["Benign paroxysmal positional vertigo (posterior canal)"]
  },
  peripheral_vestibular_horizontal_canal: {
    name: "Horizontal-canal BPPV",
    note: "Position-triggered vertigo with horizontal nystagmus on the supine roll test — horizontal (lateral) semicircular canal; geotropic (canalithiasis) or apogeotropic (cupulolithiasis).",
    ddx: ["BPPV (horizontal canal)"]
  },
  peripheral_vestibular_anterior_canal: {
    name: "Anterior-canal BPPV",
    note: "Position-triggered vertigo with down-beat torsional nystagmus — anterior canal (rare). Because it mimics central downbeat nystagmus, exclude a craniocervical-junction lesion.",
    ddx: ["BPPV (anterior canal)", "Central downbeat (craniocervical junction) — exclude"]
  },
  central_vestibular_nucleus: {
    name: "Central acute vestibular syndrome (HINTS-central)",
    note: "Acute continuous vertigo with a NORMAL head-impulse test, direction-changing (gaze-evoked) or vertical nystagmus, and/or skew deviation — the 'INFARCT' pattern (Impulse Normal, Fast-phase Alternating, Refixation on Cover Test) of a posterior-circulation (cerebellar / brainstem) stroke. A normal head impulse in an acutely, continuously vertiginous patient is the danger sign.",
    ddx: ["Cerebellar infarct (PICA / AICA)", "Lateral medullary / pontine stroke", "MS plaque", "Vertebrobasilar TIA"],
    red: "Vertigo with a NORMAL head impulse, a skew deviation, or direction-changing nystagmus is a stroke until proven otherwise — MRI-DWI; do not discharge as labyrinthitis."
  },
  craniocervical_junction_foramen_magnum: {
    name: "Downbeat nystagmus — craniocervical junction",
    note: "Downbeat nystagmus localises to the craniocervical junction / floor of the IV ventricle (and the flocculus). A central sign — never peripheral.",
    ddx: ["Chiari I malformation", "Foramen-magnum lesion (meningioma)", "Cerebellar degeneration (SCA)", "Drugs (lithium, anticonvulsants)", "Wernicke's"],
    red: "New downbeat nystagmus warrants craniocervical-junction imaging — a Chiari or foramen-magnum lesion is surgically treatable."
  },
  pontomesencephalic_tegmentum: {
    name: "Upbeat nystagmus — pontomesencephalic / medullary tegmentum",
    note: "Upbeat nystagmus localises to the pontomesencephalic junction or the medullary tegmentum. A central sign.",
    ddx: ["Brainstem tegmental infarct / demyelination", "Wernicke's encephalopathy", "Tumour", "Drugs"],
    red: "Upbeat nystagmus with other brainstem signs needs urgent imaging; consider thiamine (Wernicke's) empirically if any nutritional risk."
  },

  // ---- CEREBELLUM (the organ). Hemisphere is side-agnostic (a plain entry; the level_part fallback
  // resolves left/right); vermis, flocculonodular and pancerebellar key on their exact composite site id.
  cerebellum_hemisphere: {
    name: "Cerebellar hemisphere syndrome",
    note: "Ipsilateral appendicular ataxia: limb dysmetria, dysdiadochokinesis, intention tremor (and gait veering toward the lesion). The lateralised, limb-predominant cerebellar picture.",
    ddx: ["Cerebellar infarct (PICA / SCA)", "Haemorrhage", "Tumour / metastasis", "Multiple sclerosis", "Abscess"],
    red: "A space-occupying posterior-fossa lesion can cause brainstem compression and obstructive hydrocephalus — a neurosurgical emergency; image urgently."
  },
  cerebellum_vermis: {
    name: "Cerebellar vermis syndrome",
    note: "Midline axial ataxia: wide-based truncal / gait ataxia with titubation and ataxic (scanning) dysarthria, with the limbs relatively spared.",
    ddx: ["Medulloblastoma (children)", "Alcoholic cerebellar degeneration (superior vermis → gait)", "ADEM / post-infectious cerebellitis", "Vermian infarct"],
    red: "Truncal ataxia with headache and vomiting in a child suggests a midline posterior-fossa tumour — image and refer."
  },
  cerebellum_flocculonodular: {
    name: "Flocculonodular (vestibulocerebellar) syndrome",
    note: "Gaze-evoked / direction-changing nystagmus, vertigo and gait imbalance from a flocculonodular / vestibulocerebellar lesion, often with the limbs and speech spared.",
    ddx: ["Medulloblastoma / ependymoma (children)", "Vestibulocerebellar infarct", "Demyelination"],
    red: "New central (gaze-evoked, direction-changing) nystagmus with imbalance warrants posterior-fossa imaging."
  },
  cerebellum_pancerebellar: {
    name: "Pancerebellar syndrome (diffuse)",
    note: "Diffuse cerebellar dysfunction: bilateral limb ataxia with truncal ataxia, ataxic dysarthria and nystagmus together — the whole-cerebellum picture.",
    ddx: ["Paraneoplastic cerebellar degeneration", "Toxic (phenytoin, lithium, alcohol)", "Hereditary ataxia (SCA / Friedreich)", "Hypothyroidism", "Post-infectious"],
    red: "A subacute pancerebellar syndrome can be paraneoplastic — screen for an occult malignancy (anti-Yo/Hu/Tr) alongside imaging."
  },

  // ---- BASAL GANGLIA (movement disorders). Nigra & striatum use the { dominant, nondominant, bilateral }
  // variant: the unilateral sides give the structural HEMI-syndrome (dominant === nondominant — nucleus
  // laterality, not hemisphere, is what matters), the bilateral side gives the degenerative disease. ----
  basal_ganglia_subthalamic: {
    name: "Hemiballismus (subthalamic nucleus)",
    note: "Subthalamic nucleus lesion: violent, large-amplitude involuntary flinging of the contralateral limbs, usually proximal.",
    ddx: ["Subthalamic lacunar infarct / haemorrhage", "Non-ketotic hyperglycaemia (striatal)", "Tumour", "Demyelination"],
    red: "Check glucose — non-ketotic hyperglycaemia is a treatable, striatal cause of acute hemiballismus/hemichorea."
  },
  basal_ganglia_substantia_nigra: {
    dominant: {
      name: "Hemiparkinsonism (structural)",
      note: "Focal substantia-nigra / nigrostriatal lesion: contralateral bradykinesia, rigidity and (variably) rest tremor. The structural mirror of idiopathic Parkinson's disease.",
      ddx: ["Contralateral midbrain / nigral infarct or haemorrhage", "Mass lesion", "Demyelination", "Vascular parkinsonism (focal)"],
      red: "Acute or rapidly progressive hemiparkinsonism is structural until proven otherwise — image the midbrain."
    },
    nondominant: {
      name: "Hemiparkinsonism (structural)",
      note: "Focal substantia-nigra / nigrostriatal lesion: contralateral bradykinesia, rigidity and (variably) rest tremor. The structural mirror of idiopathic Parkinson's disease.",
      ddx: ["Contralateral midbrain / nigral infarct or haemorrhage", "Mass lesion", "Demyelination", "Vascular parkinsonism (focal)"],
      red: "Acute or rapidly progressive hemiparkinsonism is structural until proven otherwise — image the midbrain."
    },
    bilateral: {
      name: "Parkinsonism (bilateral — Parkinson's disease & mimics)",
      note: "Bilateral nigrostriatal dopamine loss: bradykinesia with rigidity and rest tremor. Idiopathic Parkinson's disease is the commonest cause; the asymmetric onset still resolves to the bilateral nucleus.",
      ddx: ["Parkinson's disease", "Drug-induced parkinsonism", "Vascular parkinsonism", "Parkinson-plus (MSA / PSP / CBD)", "Wilson's disease (young)"],
      red: "A symmetric, tremor-poor, rapidly progressive or early-falls parkinsonism suggests a Parkinson-plus syndrome — not idiopathic PD."
    }
  },
  basal_ganglia_striatum: {
    dominant: {
      name: "Hemichorea / choreoathetosis (structural)",
      note: "Focal striatal (caudate/putamen) lesion: contralateral chorea, sometimes with a ballistic or athetoid component.",
      ddx: ["Non-ketotic hyperglycaemia (classic)", "Striatal lacunar infarct / haemorrhage", "Mass lesion", "Vasculitis / lupus"],
      red: "Check glucose — non-ketotic hyperglycaemia is a treatable cause of acute hemichorea/hemiballismus."
    },
    nondominant: {
      name: "Hemichorea / choreoathetosis (structural)",
      note: "Focal striatal (caudate/putamen) lesion: contralateral chorea, sometimes with a ballistic or athetoid component.",
      ddx: ["Non-ketotic hyperglycaemia (classic)", "Striatal lacunar infarct / haemorrhage", "Mass lesion", "Vasculitis / lupus"],
      red: "Check glucose — non-ketotic hyperglycaemia is a treatable cause of acute hemichorea/hemiballismus."
    },
    bilateral: {
      name: "Chorea (bilateral — Huntington's & mimics)",
      note: "Bilateral striatal dysfunction: generalised chorea. Huntington's disease is the archetype; several treatable causes mimic it.",
      ddx: ["Huntington's disease", "Sydenham's chorea", "Chorea gravidarum / OCP", "Drug-induced (levodopa, neuroleptic withdrawal)", "SLE / antiphospholipid", "Thyrotoxicosis"],
      red: "New chorea warrants a treatable-cause screen (glucose, thyroid, autoimmune, pregnancy/drug history) before attributing it to Huntington's."
    }
  },
  basal_ganglia_globus_pallidus: {
    name: "Dystonia (globus pallidus)",
    note: "Pallidal dysfunction: sustained or intermittent co-contraction producing abnormal posturing — focal (contralateral) or, when bilateral, generalised.",
    ddx: ["Genetic / idiopathic dystonia", "Wilson's disease", "Drug-induced (neuroleptics — acute dystonia / tardive)", "Post-anoxic / kernicterus (pallidal)", "Focal pallidal lesion"],
    red: "Young-onset dystonia needs Wilson's disease excluded (copper studies, slit-lamp) — it is treatable."
  },
  subcortex_sensorimotor: {
    name: "Sensorimotor lacune (thalamocapsular)",
    note: "One perforator spanning the internal capsule and the adjacent VPL thalamus: contralateral weakness AND hemisensory loss together, still with no cortical signs.",
    ddx: ["Thalamocapsular lacunar infarct", "Deep haemorrhage", "Demyelination"],
    red: "A deep sensorimotor stroke without cortical signs is small-vessel until proven otherwise — but image to exclude haemorrhage."
  },
  subcortex_anterior_choroidal: {
    name: "Anterior choroidal artery syndrome",
    note: "A single small vessel to the posterior limb of the internal capsule, VPL thalamus and optic radiation: the classic triad of contralateral hemiplegia, hemianaesthesia and homonymous hemianopia — with no cortical signs.",
    ddx: ["Anterior choroidal artery infarct", "Deep haemorrhage", "Tumour"],
    red: "The full triad from one small perforator can look like a large cortical stroke — the absence of cortical signs points deep; image to confirm."
  },

  // ---- SKULL BASE (extra-axial cranial nerves — foramina as sites) ----
  // ---- per-nerve peripheral-course sites (the longitudinal axis) ----
  plexus_posterior_cord: {
    name: "Posterior cord (brachial plexus) lesion",
    note: "Axillary + radial territory: weak shoulder abduction (deltoid) with weak elbow/wrist/finger extension (wrist drop) and sensory loss over the badge area + dorsal hand/forearm — the 'all extensors + deltoid' pattern.",
    ddx: ["Trauma / traction", "Neuralgic amyotrophy (Parsonage-Turner)", "Tumour infiltration", "Crutch / axillary compression"]
  },
  plexus_lateral_cord: {
    name: "Lateral cord (brachial plexus) lesion",
    note: "Musculocutaneous + lateral median root: weak elbow flexion (biceps) with lateral forearm sensory loss (and, via the median lateral root, weak forearm pronation/wrist flexion) — median hand intrinsics and the ulnar are SPARED (medial cord).",
    ddx: ["Trauma / traction", "Neuralgic amyotrophy", "Tumour"]
  },
  plexus_medial_cord: {
    name: "Medial cord (brachial plexus) lesion",
    note: "Ulnar + medial median root: a C8-T1 hand pattern — ulnar-innervated intrinsics plus median thenar (thumb abduction) weakness and medial forearm/arm sensory loss; elbow flexion and the extensors are SPARED. Overlaps the lower-trunk (Klumpke) picture.",
    ddx: ["Trauma / traction", "Pancoast tumour (apical)", "Neuralgic amyotrophy"]
  },
  skull_base_optic_aion: {
    name: "Anterior ischaemic optic neuropathy (AION)",
    note: "Sudden painless monocular visual loss with an ALTITUDINAL (superior or inferior half) field defect and a RAPD — a watershed infarct of the optic-disc circulation. Arteritic (giant-cell arteritis — urgent) or non-arteritic (crowded disc, vascular risk).",
    ddx: ["Non-arteritic AION (vasculopathic)", "Arteritic AION (giant-cell arteritis)"],
    red: "Altitudinal visual loss with jaw claudication, scalp tenderness or raised ESR/CRP is giant-cell arteritis — start high-dose steroids immediately to save the other eye."
  },
  skull_base_optic_neuritis: {
    name: "Optic neuritis",
    note: "Subacute monocular visual loss with a CENTRAL scotoma, pain on eye movement, reduced colour vision (red desaturation) and a RAPD — demyelinating (MS), idiopathic, or NMO/MOG. Contrast AION (painless, altitudinal, older/vascular).",
    ddx: ["Multiple sclerosis", "Idiopathic optic neuritis", "NMO / MOG-associated", "Sarcoid / infective"]
  },
  cortex_sensory_hand: {
    name: "Cortical sensory hand / cheiro-oral syndrome",
    note: "Isolated hand sensory loss from a small postcentral (sensory cortex) lesion — pseudo-peripheral, mimicking an ulnar or C8 sensory loss but cortical. When the perioral region is also involved it is CHEIRO-ORAL syndrome (the hand and mouth are adjacent in the sensory homunculus); this also localises to the thalamus (VPL+VPM adjacency).",
    ddx: ["Small postcentral cortical infarct", "Thalamic (VPL/VPM) lacune — cheiro-oral", "Small haemorrhage / demyelination"]
  },
  cortex_hand_knob: {
    name: "Cortical hand-knob syndrome (pseudo-peripheral hand)",
    note: "Isolated weakness of the hand/fingers from a small precentral 'hand knob' stroke — it MIMICS an ulnar, radial or C8/T1 lesion, but is UPPER motor neurone: brisk reflexes, an extensor plantar, no wasting and no nerve/dermatomal sensory territory. A classic stroke-mimicking-mononeuropathy pearl.",
    ddx: ["Small precentral (hand-knob) infarct", "Cortical vein thrombosis", "Small metastasis / demyelination", "(mimics: ulnar neuropathy, C8 radiculopathy)"]
  },
  nerve_phrenic: {
    name: "Phrenic nerve palsy (diaphragm)",
    note: "Unilateral diaphragm weakness — orthopnoea, exertional dyspnoea, paradoxical abdominal movement, a raised hemidiaphragm on imaging. From the phrenic nerve (C3-5) or its roots.",
    ddx: ["Cardiac/thoracic surgery injury", "Idiopathic neuralgic amyotrophy", "Malignant infiltration (mediastinum/apex)", "High cervical cord / C3-5 root lesion", "Neuromuscular disease (if bilateral)"]
  },
  nerve_pudendal: {
    name: "Pudendal neuralgia",
    note: "Perineal / genital sensory loss or pain with external sphincter weakness — the pudendal nerve (S2-4). Distinguish a cauda equina / conus lesion (bilateral saddle anaesthesia + sphincter + leg signs).",
    ddx: ["Pudendal nerve entrapment (Alcock's canal)", "Childbirth / cycling injury", "Pelvic surgery or tumour"]
  },
  root_t4: {
    name: "Thoracic radiculopathy (dermatomal band)",
    note: "A band of dermatomal sensory loss / girdle pain around the trunk (T4 nipple, T10 umbilicus, L1 groin) — thoracic root involvement. Motor signs are clinically silent, so it is essentially sensory.",
    ddx: ["Herpes zoster", "Diabetic thoracic radiculopathy (truncal)", "Vertebral metastasis / disc", "Post-thoracotomy"]
  },
  subcortex_corona_radiata: {
    name: "Corona radiata lacune (pure motor)",
    note: "A pure-motor hemiparesis (face + arm + leg, contralateral, with pyramidal signs, no cortical or sensory features) from a small-vessel lacune in the corona radiata — clinically indistinguishable from an internal-capsule lacune. The lacunar syndromes (pure motor, ataxic hemiparesis, dysarthria-clumsy-hand) localise across the corona radiata, internal capsule and basis pontis.",
    ddx: ["Lacunar (small-vessel) infarct", "Internal-capsule lacune", "Basis-pontis lacune"]
  },
  combined_degeneration_scd: {
    name: "Subacute combined degeneration (B12 / copper)",
    note: "Symmetric dorsal-column loss (vibration/proprioception, Romberg-positive sensory ataxia) WITH upper-motor-neurone signs in the legs (spasticity, extensor plantars) but pain/temperature (spinothalamic) PRESERVED — the combined posterior + lateral column degeneration of B12 or copper deficiency. Ankle jerks may be lost (co-existing peripheral neuropathy).",
    ddx: ["Vitamin B12 deficiency", "Copper deficiency (zinc excess, bariatric surgery)", "Nitrous-oxide abuse", "Cervical spondylotic myelopathy (has a sensory level)", "HIV / tabes"],
    red: "Check B12 (and methylmalonic acid) early — SCD is treatable but irreversible if missed."
  },
  combined_degeneration_friedreich: {
    name: "Friedreich's ataxia",
    note: "Dorsal columns + corticospinal + spinocerebellar tracts: progressive gait ataxia (sensory + cerebellar), dysarthria, and the hallmark AREFLEXIA with EXTENSOR PLANTARS (absent reflexes but upgoing toes). Pes cavus, scoliosis and hypertrophic cardiomyopathy accompany it.",
    ddx: ["Friedreich's ataxia (frataxin, GAA repeat)", "Other hereditary spinocerebellar ataxias", "Vitamin E deficiency (mimics)", "SCD"]
  },
  pseudobulbar_corticobulbar: {
    name: "Pseudobulbar palsy (bilateral corticobulbar)",
    note: "Bilateral UPPER motor neurone lesions of the bulbar muscles: spastic dysarthria, dysphagia, a brisk jaw jerk and a spastic (small, immobile) tongue, with EMOTIONAL LABILITY (pathological laughing/crying). Contrast bulbar palsy (LOWER motor neurone — nucleus ambiguus / motor unit): a wasted, fasciculating tongue, nasal speech, and NO emotional lability. The jaw jerk (brisk = pseudobulbar, absent = bulbar) and the tongue (spastic vs wasted) separate them.",
    ddx: ["Bilateral hemispheric small-vessel disease / lacunes", "Motor neurone disease (UMN-predominant)", "Bilateral strokes", "MS", "Progressive supranuclear palsy"]
  },
  olfactory_olfactory_groove: {
    name: "Olfactory groove syndrome (anosmia)",
    note: "Unilateral loss of smell from the olfactory bulb/tract on the cribriform plate. With ipsilateral optic atrophy (± contralateral papilloedema) this is Foster-Kennedy syndrome — an olfactory-groove or sphenoid-wing meningioma compressing both the olfactory and optic nerves.",
    ddx: ["Olfactory groove / sphenoid-wing meningioma", "Head trauma (cribriform shearing)", "Kallmann syndrome", "Parkinson's / neurodegeneration (bilateral)"]
  },
  cortex_insula: {
    name: "Insular cortex syndrome",
    note: "Dysarthria and central loss of taste (± visceral / autonomic or vestibular sensations) from the insula — usually part of a middle cerebral artery infarct.",
    ddx: ["MCA infarct (insular)", "Glioma", "Herpes / limbic encephalitis"]
  },
  pons_basis_pontis: {
    name: "Ventral pontine (basis pontis) lacune",
    note: "A small-vessel lacune of the ventral pons. Two classic pictures emerge: ATAXIC HEMIPARESIS (pyramidal weakness with crossed pontocerebellar ataxia on the same side, out of proportion to the weakness) and DYSARTHRIA-CLUMSY-HAND (corticobulbar dysarthria + central facial weakness + a clumsy hand). Gaze, CN VI and CN VII are SPARED (the tegmentum is dorsal).",
    ddx: ["Lacunar (small-vessel) infarct", "Basilar perforator disease", "Small pontine haemorrhage / demyelination"]
  },
  skull_base_iam: {
    name: "Internal acoustic meatus syndrome (early acoustic neuroma)",
    note: "VII lower-motor facial palsy WITH sensorineural hearing loss (VIII) but no corneal loss or ataxia — the meatal segment; hearing loss is what separates it from a purely intratemporal facial palsy (geniculate).",
    ddx: ["Vestibular schwannoma (early, intracanalicular)", "Meningioma", "Epidermoid", "Facial nerve schwannoma"],
    red: "Progressive unilateral sensorineural hearing loss with facial palsy needs an MRI of the IAM/CPA."
  },
  skull_base_vii_geniculate: {
    name: "Geniculate ganglion syndrome (Ramsay Hunt)",
    note: "Facial palsy with reduced lacrimation (greater petrosal), hyperacusis (stapedius) and loss of taste (chorda tympani) — hearing intact, so proximal-intratemporal but distal to the IAM. Herpes zoster oticus adds vesicles.",
    ddx: ["Ramsay Hunt syndrome (herpes zoster oticus)", "Geniculate schwannoma", "Bell's palsy (proximal)"],
    red: "Ramsay Hunt has worse recovery than Bell's — treat zoster early (aciclovir + steroids)."
  },
  skull_base_vii_tympanic: {
    name: "Tympanic-segment facial palsy",
    note: "Facial palsy with hyperacusis and loss of taste but lacrimation SPARED (lesion distal to the greater petrosal) — the middle-ear segment (otitis media, cholesteatoma, iatrogenic).",
    ddx: ["Middle-ear infection / cholesteatoma", "Iatrogenic (mastoid surgery)", "Glomus tympanicum"]
  },
  skull_base_vii_mastoid: {
    name: "Mastoid-segment facial palsy",
    note: "Facial palsy with loss of taste but hyperacusis SPARED (lesion distal to the nerve to stapedius, proximal to where the chorda tympani leaves) — the descending/mastoid segment.",
    ddx: ["Mastoiditis / cholesteatoma", "Temporal-bone fracture", "Facial nerve schwannoma"]
  },
  skull_base_vii_stylomastoid: {
    name: "Stylomastoid (extratemporal) facial palsy — Bell's palsy pattern",
    note: "Pure lower-motor facial weakness of the whole hemiface with taste, hyperacusis and lacrimation all SPARED — the lesion is at/below the stylomastoid foramen (idiopathic Bell's palsy localises here).",
    ddx: ["Bell's palsy (idiopathic)", "Sarcoid / Lyme", "Diabetes"],
    red: "Forehead-SPARING facial weakness is an UPPER-motor (central) lesion, not this — re-examine the forehead."
  },
  skull_base_vii_parotid: {
    name: "Parotid / branch facial palsy",
    note: "Weakness confined to one facial-nerve branch territory (e.g. marginal mandibular — lower lip) rather than the whole hemiface — an extracranial lesion in or beyond the parotid.",
    ddx: ["Parotid tumour", "Facial trauma / laceration", "Iatrogenic (parotidectomy)"]
  },
  skull_base_v_ganglion: {
    name: "Trigeminal (Gasserian) ganglion syndrome",
    note: "Sensory loss across all three divisions (V1+V2+V3) with jaw (motor) weakness — Meckel's cave. Isolated single-division loss localises to that division's foramen instead.",
    ddx: ["Trigeminal schwannoma", "Meningioma", "Perineural tumour spread", "Herpes zoster"]
  },
  skull_base_v3_ovale: {
    name: "Mandibular division (V3) — foramen ovale",
    note: "Chin/jaw sensory loss WITH jaw weakness (V3 is the only division carrying motor) — foramen ovale; the motor component separates it from a V1 or V2 lesion.",
    ddx: ["Perineural spread (e.g. skin SCC)", "Schwannoma", "Numb-chin syndrome (malignancy)"]
  },
  skull_base_iii_orbit_sup: {
    name: "CN III superior-division palsy",
    note: "Ptosis and failure of elevation (levator + superior rectus) with the pupil and adduction/depression spared — a divisional (orbital / anterior) third-nerve lesion, not a complete III palsy."
  },
  skull_base_iii_orbit_inf: {
    name: "CN III inferior-division palsy",
    note: "Failure of adduction/depression with a fixed dilated pupil, ptosis SPARED — the inferior division (MR/IR/IO + parasympathetic) in the orbit."
  },
  skull_base_petrous_apex: {
    name: "Petrous apex syndrome (Gradenigo)",
    note: "Abducens (VI) palsy with ipsilateral trigeminal (V1) pain — Dorello's canal at the petrous apex; classically with otorrhoea/otitis media.",
    ddx: ["Petrous apicitis (complicated otitis media)", "Chondrosarcoma", "Metastasis", "Cholesterol granuloma"],
    red: "Gradenigo's triad after otitis media is a surgical emergency — image the petrous apex."
  },
  skull_base_x_recurrent_laryngeal: {
    name: "Recurrent laryngeal nerve palsy",
    note: "Isolated hoarseness / vocal-cord paresis with an intact palate and preserved gag — a distal vagal lesion below the pharyngeal branches (thyroid surgery, aortic/mediastinal, Pancoast).",
    ddx: ["Thyroid surgery / goitre", "Aortic arch / mediastinal mass", "Pancoast tumour", "Idiopathic"]
  },
  skull_base_ix_jugular: {
    name: "Glossopharyngeal (IX) lesion",
    note: "Absent gag (afferent limb) and loss of taste over the posterior third of the tongue with an INTACT palate — the vagal (efferent) limb is spared, so a pure IX lesion.",
    ddx: ["Glossopharyngeal schwannoma", "Jugular foramen tumour (early)", "Glossopharyngeal neuralgia"]
  },
  skull_base_x_jugular: {
    name: "High vagal (X) lesion",
    note: "Palatal droop / uvular deviation (gag efferent) with hoarseness — a proximal vagal lesion affecting palate AND larynx; taste and pharyngeal sensation (IX) intact.",
    ddx: ["Jugular foramen tumour", "Skull-base metastasis", "Vagal schwannoma"]
  },
  skull_base_xi_jugular: {
    name: "Spinal accessory (XI) — proximal",
    note: "Sternocleidomastoid AND trapezius weakness; when accompanied by IX/X it localises to the jugular foramen (Vernet)."
  },
  skull_base_xi_posterior_triangle: {
    name: "Spinal accessory (XI) — posterior triangle",
    note: "Trapezius weakness / shoulder droop with the sternocleidomastoid SPARED — a lesion in the posterior triangle of the neck distal to the SCM branch (e.g. lymph-node biopsy).",
    ddx: ["Iatrogenic (cervical lymph-node biopsy / dissection)", "Trauma", "Schwannoma"]
  },
  skull_base_xii_neck: {
    name: "Hypoglossal (XII) — neck",
    note: "Isolated tongue deviation/wasting toward the weak side from an extracranial lesion (carotid, submandibular)."
  },

  skull_base_sup_orbital_fissure: {
    name: "Superior orbital fissure syndrome",
    note: "Ophthalmoplegia (III, IV, VI) with ophthalmic (V1) sensory loss and ± Horner's, but the maxillary division (V2) and vision SPARED — that sparing is what separates it from the cavernous sinus and orbital apex.",
    ddx: ["Trauma (fissure fracture)", "Tumour (meningioma, metastasis, perineural spread)", "Tolosa-Hunt (granulomatous inflammation)", "Aneurysm"],
    red: "Painful ophthalmoplegia can be Tolosa-Hunt, but exclude a mass or aneurysm first — image before steroids."
  },
  skull_base_cavernous_sinus: {
    name: "Cavernous sinus syndrome",
    note: "III, IV, VI, V1 AND V2 with oculosympathetic (Horner's) involvement — V2 (cheek) sensory loss added to the SOF picture localises to the cavernous sinus. A painful ophthalmoplegia.",
    ddx: ["Cavernous sinus thrombosis", "Carotid-cavernous fistula", "Tumour (meningioma, pituitary, metastasis, perineural spread)", "Tolosa-Hunt", "Carotid aneurysm"],
    red: "A septic cavernous sinus thrombosis is an emergency — fever, proptosis and rapidly progressive multi-nerve palsy need urgent imaging and antibiotics."
  },
  skull_base_orbital_apex: {
    name: "Orbital apex syndrome (Jacod)",
    note: "The superior orbital fissure picture (III, IV, VI, V1, ± Horner's) PLUS optic neuropathy — monocular visual loss is what distinguishes the apex from the SOF and cavernous sinus.",
    ddx: ["Tumour (meningioma, metastasis, perineural spread)", "Invasive fungal sinusitis (mucormycosis, aspergillosis)", "Granulomatosis with polyangiitis / sarcoid", "Trauma"],
    red: "In a diabetic or immunocompromised patient, apex syndrome with a black nasal eschar is invasive mucormycosis — a surgical emergency."
  },
  skull_base_jugular_foramen: {
    name: "Jugular foramen syndrome (Vernet)",
    note: "IX, X and XI in the jugular foramen: loss of the gag afferent (IX) + posterior-third taste, palatal droop and hoarseness (X, gag efferent + cords), and sternocleidomastoid + trapezius weakness (XI) — the tongue (XII) is spared (that spares it from Collet-Sicard).",
    ddx: ["Glomus jugulare tumour (paraganglioma)", "Schwannoma / meningioma", "Metastasis", "Jugular vein thrombosis"],
    red: "A pulsatile tinnitus with lower-cranial-nerve palsies suggests a glomus tumour — image the skull base with contrast."
  },
  skull_base_hypoglossal_canal: {
    name: "Hypoglossal canal syndrome",
    note: "Isolated CN XII palsy: tongue deviation toward the lesion with wasting/fasciculation, no other deficit.",
    ddx: ["Skull-base metastasis", "Chordoma / clivus tumour", "Occipital condyle fracture", "Carotid dissection"],
    red: "An isolated XII palsy is a skull-base lesion until proven otherwise — image the clivus and occipital condyle."
  },
  skull_base_collet_sicard: {
    name: "Collet-Sicard syndrome",
    note: "IX, X, XI AND XII together — the jugular foramen syndrome plus tongue involvement, without a Horner's (that would make it Villaret).",
    ddx: ["Skull-base tumour / metastasis", "Nasopharyngeal carcinoma", "Carotid dissection", "Trauma (occipital condyle)"],
    red: "Four unilateral lower-cranial-nerve palsies point to a skull-base or nasopharyngeal malignancy — image and consider ENT referral."
  },
  skull_base_villaret: {
    name: "Villaret syndrome",
    note: "IX, X, XI, XII with a Horner's — the Collet-Sicard picture plus oculosympathetic involvement, localising to the retropharyngeal / posterior retroparotid space.",
    ddx: ["Nasopharyngeal / parotid-space tumour", "Metastasis", "Carotid dissection", "Retropharyngeal abscess"],
    red: "The added Horner's places the lesion in the retroparotid/retropharyngeal space — image the deep neck as well as the skull base."
  },
  skull_base_cpa: {
    name: "Cerebellopontine angle syndrome",
    note: "VII, VIII and V at the CPA: progressive sensorineural hearing loss (± tinnitus), facial weakness and a reduced corneal reflex, with ipsilateral ataxia if the mass is large.",
    ddx: ["Vestibular schwannoma (acoustic neuroma)", "Meningioma", "Epidermoid cyst", "Metastasis"],
    red: "Unilateral sensorineural hearing loss deserves an MRI of the internal auditory meatus — a schwannoma is eminently treatable when small."
  },

  // ---- MOTOR UNIT (pure-motor endings — anterior horn / NMJ / muscle) ----
  motor_unit_anterior_horn: {
    name: "Anterior horn cell disease (lower motor neurone)",
    note: "Pure lower-motor-neurone signs — flaccid, wasting, areflexic weakness with fasciculations and NO sensory loss. The pure-LMN anterior-horn diseases; a MIXED UMN+LMN picture is motor neurone disease (ALS), recognised by the pathology layer, not localised as a single site.",
    ddx: ["Progressive muscular atrophy (LMN-predominant MND)", "Spinal muscular atrophy", "Poliomyelitis / post-polio syndrome", "Monomelic amyotrophy (Hirayama)", "Kennedy's disease (SBMA)"],
    red: "New progressive painless weakness with fasciculations and no sensory loss needs urgent neurology — if upper motor neurone signs are also present, think ALS."
  },
  motor_unit_nmj_postsynaptic: {
    name: "Myasthenia gravis (post-synaptic NMJ)",
    note: "Fatigable weakness worsening with effort, with fatigable ptosis/diplopia and bulbar involvement, no sensory loss and preserved reflexes. Ocular predominance separates it from Lambert-Eaton.",
    ddx: ["Myasthenia gravis (AChR / MuSK antibodies)", "Thymoma-associated MG", "Congenital myasthenic syndromes", "Botulism (also NMJ but pre-synaptic)"],
    red: "A myasthenic crisis with bulbar/respiratory failure is an emergency — watch the forced vital capacity, not just the oxygen saturation."
  },
  motor_unit_nmj_presynaptic: {
    name: "Lambert-Eaton myasthenic syndrome (pre-synaptic NMJ)",
    note: "Proximal weakness that transiently IMPROVES with brief exercise (post-exercise facilitation) with autonomic features (dry mouth) and depressed reflexes that potentiate. Ocular sparing early.",
    ddx: ["Paraneoplastic LEMS (small-cell lung cancer, anti-VGCC)", "Autoimmune LEMS", "Botulism"],
    red: "Lambert-Eaton is paraneoplastic until proven otherwise — screen for small-cell lung cancer (CT chest, smoking history)."
  },
  motor_unit_muscle: {
    name: "Myopathy (muscle)",
    note: "Symmetric proximal (limb-girdle) weakness with no sensory loss, preserved reflexes and no fatigability — the parsimonious explanation for bare proximal weakness.",
    ddx: ["Inflammatory myopathy (polymyositis, dermatomyositis, IBM)", "Muscular dystrophy", "Endocrine/metabolic myopathy (steroid, thyroid)", "Drug/toxic myopathy (statins)"],
    red: "Proximal weakness with a rash or dysphagia may be dermatomyositis — check CK and screen for an underlying malignancy."
  },

  // ---- NERVE ROOTS (radiculopathy — the segment emerges from dermatome/myotome/reflex) ----
  root_c5: { name: "C5 radiculopathy", note: "Lateral upper-arm sensory loss, weak shoulder abduction (deltoid), depressed biceps jerk, with radicular pain.", ddx: ["Cervical disc / foraminal stenosis", "Tumour / nerve-root schwannoma", "Herpes zoster", "Trauma / avulsion"], red: "Progressive or bilateral cervical radiculopathy — image and exclude a myelopathy (long-tract signs change everything)." },
  root_c6: { name: "C6 radiculopathy", note: "Thumb / lateral-forearm sensory loss, weak elbow flexion and wrist extension, depressed brachioradialis jerk.", ddx: ["C5/6 disc / foraminal stenosis", "Tumour", "Herpes zoster"], red: "C6 and C7 overlap clinically — the reflex (brachioradialis vs triceps) and the affected digit help separate them." },
  root_c7: { name: "C7 radiculopathy", note: "Middle-finger sensory loss, weak elbow extension (triceps), depressed triceps jerk, with radicular pain — the commonest cervical radiculopathy.", ddx: ["C6/7 disc prolapse", "Foraminal stenosis", "Tumour", "Herpes zoster"], red: "New bilateral or progressive signs, or any long-tract sign, means image to exclude cord compression." },
  root_c8: { name: "C8 radiculopathy", note: "Little-finger / medial-forearm sensory loss and weak finger flexion (no classic reflex).", ddx: ["C7/T1 disc", "Pancoast (apical lung) tumour", "Foraminal stenosis"], red: "C8/T1 signs with a Horner's suggest a Pancoast tumour — image the lung apex." },
  root_t1: { name: "T1 radiculopathy", note: "Medial-arm sensory loss and weak finger abduction (hand intrinsics).", ddx: ["Pancoast tumour", "Thoracic outlet syndrome", "Disc (rare)"], red: "Wasting of the hand intrinsics with a Horner's — exclude an apical lung lesion." },
  root_l2: { name: "L2 radiculopathy", note: "Anterior-thigh sensory loss and weak hip flexion.", ddx: ["Lumbar disc (high)", "Diabetic lumbosacral radiculoplexus neuropathy (amyotrophy)", "Retroperitoneal mass"], red: "Proximal leg weakness with weight loss may be diabetic amyotrophy or a retroperitoneal lesion — image and check glucose." },
  root_l3: { name: "L3 radiculopathy", note: "Lower-anterior-thigh / knee sensory loss, weak knee extension, depressed knee jerk.", ddx: ["L2/3 or L3/4 disc", "Diabetic amyotrophy", "Foraminal stenosis"], red: "Knee buckling from quadriceps weakness — assess falls risk; image the high lumbar spine." },
  root_l4: { name: "L4 radiculopathy", note: "Medial-shin sensory loss, weak ankle dorsiflexion and knee extension, depressed knee jerk.", ddx: ["L3/4 disc", "Foraminal stenosis", "Diabetic amyotrophy"], red: "Foot drop can be L4/L5 or a peroneal palsy — the knee jerk and dorsiflexion pattern separate them." },
  root_l5: { name: "L5 radiculopathy", note: "Dorsum-of-foot / great-toe sensory loss and weak great-toe and ankle dorsiflexion (no classic reflex) — the commonest lumbar radiculopathy.", ddx: ["L4/5 disc prolapse", "Foraminal stenosis", "Far-lateral disc"], red: "Distinguish an L5 root from a common peroneal palsy: L5 also weakens foot inversion and hip abduction, the peroneal nerve does not." },
  root_s1: { name: "S1 radiculopathy", note: "Lateral-foot / sole sensory loss, weak ankle plantarflexion, depressed ankle jerk, with sciatica.", ddx: ["L5/S1 disc prolapse", "Foraminal stenosis", "Tumour"], red: "Bilateral S1/S2 signs with saddle anaesthesia or sphincter change is cauda equina — a surgical emergency." },

  // ---- POLYNEUROPATHY ----
  polyneuropathy_length_dependent: {
    name: "Length-dependent (stocking-glove) polyneuropathy",
    note: "Distal, symmetric, bilateral sensory (± motor) loss with distal areflexia — the longest axons fail first, so the feet are affected before the hands and the deficit ascends the legs before the fingertips (same axon length as the knees) are involved.",
    ddx: ["Diabetes mellitus", "Alcohol / nutritional (B1, B6, B12)", "Chronic kidney disease (uraemia)", "Drugs / toxins (chemotherapy, isoniazid)", "Hereditary (CMT)"],
    red: "A rapidly ascending or NON-length-dependent pattern (hands before feet, asymmetric, or areflexia out of proportion) points away from a stocking-glove axonopathy — think Guillain-Barré, vasculitis or a demyelinating neuropathy, and act urgently."
  },

  // ---- BRACHIAL / LUMBOSACRAL PLEXUS (root composites) ----
  plexus_upper_trunk: { name: "Erb's palsy (upper trunk, C5-6)", note: "Upper brachial plexus: the 'waiter's tip' arm — weak shoulder abduction, external rotation and elbow flexion, with C5-6 sensory loss and a depressed biceps jerk.", ddx: ["Birth injury (shoulder dystocia)", "Traction / motorcycle injury", "Rucksack palsy", "Neuralgic amyotrophy (Parsonage-Turner)"], red: "Acute painful upper-limb weakness with patchy wasting may be neuralgic amyotrophy — but exclude traction injury and malignant infiltration." },
  plexus_lower_trunk: { name: "Klumpke's palsy (lower trunk, C8-T1)", note: "Lower brachial plexus: intrinsic hand weakness (claw hand), finger flexion/abduction and thumb abduction weak, with C8-T1 sensory loss (± a Horner's from T1 sympathetic).", ddx: ["Traction (arm-up fall)", "Pancoast (apical lung) tumour", "Cervical rib / thoracic outlet", "Birth injury"], red: "A lower-trunk plexopathy with a Horner's is a Pancoast tumour until proven otherwise — image the lung apex." },
  plexus_lumbar_plexus: { name: "Lumbar plexopathy (L2-4)", note: "Anterior thigh sensory loss with weak hip flexion, hip adduction and knee extension, and a depressed knee jerk.", ddx: ["Diabetic lumbosacral radiculoplexus neuropathy (amyotrophy)", "Retroperitoneal haematoma / psoas abscess", "Malignant infiltration", "Radiotherapy"], red: "Painful proximal leg weakness with weight loss needs imaging of the retroperitoneum and a diabetes screen." },
  plexus_sacral_plexus: { name: "Sacral plexopathy (L4-S1)", note: "Weakness spanning the L4-S1 myotomes (foot drop, plantarflexion, hip abduction) with below-knee sensory loss — broader than a single root or nerve.", ddx: ["Malignant / pelvic infiltration", "Radiotherapy plexopathy", "Diabetic amyotrophy", "Retroperitoneal / pelvic mass"], red: "A progressive painful sacral plexopathy suggests pelvic malignancy — image the pelvis." },

  // ---- NAMED PERIPHERAL NERVES ----
  nerve_axillary: { name: "Axillary nerve palsy", note: "Weak shoulder abduction (deltoid) with sensory loss over the deltoid (regimental badge).", ddx: ["Shoulder dislocation", "Surgical-neck humerus fracture", "Deltoid intramuscular injection", "Neuralgic amyotrophy"], red: "Check axillary function after every shoulder dislocation/reduction — it is easily missed." },
  nerve_musculocutaneous: { name: "Musculocutaneous nerve palsy", note: "Weak elbow flexion and supination with lateral-forearm sensory loss and a depressed biceps jerk.", ddx: ["Strenuous exercise / traction", "Shoulder surgery", "Neuralgic amyotrophy"], red: "Isolated musculocutaneous palsy is rare — look for a wider plexus lesion." },
  nerve_suprascapular: { name: "Suprascapular nerve palsy", note: "Weak shoulder external rotation (infraspinatus) and abduction initiation, with deep shoulder pain and no cutaneous sensory loss.", ddx: ["Suprascapular notch entrapment / ganglion", "Traction", "Neuralgic amyotrophy"], red: "Deep shoulder pain with external-rotation weakness — image the notch for a ganglion." },
  nerve_long_thoracic: { name: "Long thoracic nerve palsy (winged scapula)", note: "Serratus anterior weakness → medial winging of the scapula, worse on wall-push; motor only, no sensory loss.", ddx: ["Neuralgic amyotrophy", "Traction / rucksack", "Post-surgical (axillary)"], red: "Painful winging after a viral illness is often neuralgic amyotrophy — usually recovers, but confirm the pattern." },
  nerve_radial_axilla: { name: "Radial nerve palsy at the axilla (crutch palsy)", note: "Weak elbow extension (triceps), wrist and finger extension, with a lost triceps jerk and dorsal-web sensory loss — a high radial lesion.", ddx: ["Crutch / 'Saturday-night' compression in the axilla", "Shoulder dislocation", "Humeral fracture"], red: "Triceps weakness + lost triceps jerk marks a lesion above the spiral groove — separate from a C7 root by the intact dermatome/other C7 muscles." },
  nerve_radial_spiral_groove: { name: "Radial nerve palsy at the spiral groove (Saturday-night)", note: "Wrist drop and finger drop with dorsal-web sensory loss, but the TRICEPS is spared (jerk preserved) — the classic humeral spiral-groove compression.", ddx: ["Saturday-night palsy (compression)", "Humeral shaft fracture", "Lead toxicity"], red: "Wrist drop with a preserved triceps jerk localises to the spiral groove, not the axilla." },
  nerve_radial_pin: { name: "Posterior interosseous nerve palsy", note: "Finger (and thumb) drop with the WRIST EXTENSION preserved (radial deviation on extension) and NO sensory loss — a pure-motor deep branch lesion.", ddx: ["PIN entrapment (arcade of Frohse)", "Rheumatoid synovitis", "Ganglion / lipoma"], red: "Finger drop with a preserved wrist extension and no sensory loss is the PIN, not a spiral-groove radial palsy." },
  nerve_median_proximal: { name: "Proximal median nerve palsy (pronator)", note: "Weak pronation, wrist and finger flexion and thumb abduction with digital AND palmar sensory loss — a forearm-level median lesion.", ddx: ["Pronator syndrome", "Supracondylar fracture", "Ligament of Struthers"], red: "Median weakness that includes pronation and forearm flexors (not just thenar) localises proximal to the carpal tunnel." },
  nerve_median_ain: { name: "Anterior interosseous nerve palsy", note: "Weak thumb and index flexion (FPL/FDP2) — a failed 'OK' sign — with pronator quadratus weakness and NO sensory loss; a pure-motor deep-branch lesion.", ddx: ["AIN neuritis (Parsonage-Turner)", "Forearm trauma", "Compression"], red: "An inability to make the 'OK' sign with no sensory loss is the anterior interosseous nerve." },
  nerve_median_carpal_tunnel: { name: "Median nerve palsy (carpal tunnel syndrome)", note: "Weak thumb abduction (APB) with thenar wasting and digital sensory loss over the radial 3½ digits — but the PALM (palmar cutaneous branch) is spared.", ddx: ["Carpal tunnel syndrome", "Hypothyroidism / pregnancy / RA (predisposing)"], red: "Nocturnal hand paraesthesiae with thenar wasting and palmar sparing is carpal tunnel — treat before permanent wasting." },
  nerve_ulnar_elbow: { name: "Ulnar nerve palsy at the elbow (cubital tunnel)", note: "Weak interossei, thumb adduction (Froment), FDP 4/5 and FCU, with palmar AND dorsal-hand sensory loss — a lesion at the elbow.", ddx: ["Cubital tunnel syndrome", "Elbow trauma / OA", "Leprosy (worldwide)"], red: "Dorsal-hand sensory loss and FDP/FCU weakness localise the ulnar lesion to the elbow, not the wrist." },
  nerve_ulnar_wrist: { name: "Ulnar nerve palsy at the wrist (Guyon's canal)", note: "Weak interossei and thumb adduction (Froment) with a MORE pronounced claw (intact FDP 4/5), sparing the FDP, FCU and dorsal-hand sensation — the ulnar paradox.", ddx: ["Guyon's canal compression (handlebar palsy, ganglion)", "Hook-of-hamate fracture", "Trauma"], red: "A worse claw with spared FDP and dorsal-hand sensation localises the ulnar lesion to the wrist — the paradox that the distal lesion looks worse." },
  nerve_femoral: { name: "Femoral nerve palsy", note: "Weak hip flexion and knee extension with a depressed knee jerk and anterior-thigh / saphenous (medial leg) sensory loss.", ddx: ["Retroperitoneal / iliopsoas haematoma", "Pelvic surgery or lithotomy positioning", "Diabetic amyotrophy", "Femoral catheterisation"], red: "Femoral palsy with anticoagulation is a retroperitoneal haematoma until proven otherwise — image urgently." },
  nerve_obturator: { name: "Obturator nerve palsy", note: "Weak hip adduction with medial-thigh sensory loss.", ddx: ["Pelvic surgery / obstetric injury", "Obturator hernia", "Pelvic tumour"], red: "Medial-thigh pain with adductor weakness — consider an obturator hernia or pelvic mass." },
  nerve_lat_fem_cutaneous: { name: "Meralgia paraesthetica (lateral femoral cutaneous nerve)", note: "Pure sensory: burning / numbness over the lateral thigh, with no weakness and no reflex change.", ddx: ["Inguinal-ligament entrapment (obesity, tight belts, pregnancy)", "Diabetes", "Iliac-crest bone-graft harvest"], red: "Purely sensory and benign — but new cases warrant a diabetes check and a look for a compressive cause." },
  nerve_superior_gluteal: { name: "Superior gluteal nerve palsy (Trendelenburg)", note: "Weak hip abduction (gluteus medius) → a Trendelenburg gait/sign; motor only, no sensory loss.", ddx: ["Intramuscular injection injury", "Hip surgery", "Pelvic fracture"], red: "A Trendelenburg gait localises to gluteus medius (superior gluteal) or an L5 root — the sensory exam separates them." },
  nerve_sciatic: { name: "Sciatic nerve palsy", note: "Weak knee flexion and all movements below the knee (foot drop and plantarflexion) with below-knee sensory loss sparing the medial leg (saphenous), and a lost ankle jerk.", ddx: ["Hip surgery / dislocation", "Deep gluteal injection", "Piriformis / pelvic mass", "Prolonged pressure"], red: "A dense sciatic palsy after hip surgery needs early recognition — the peroneal division is the most vulnerable and may look like an isolated foot drop." },
  nerve_peroneal_common: { name: "Common peroneal (fibular) nerve palsy", note: "Foot drop — weak ankle dorsiflexion, great-toe extension AND eversion — with dorsum-of-foot sensory loss; inversion, plantarflexion and the ankle jerk are spared.", ddx: ["Fibular-neck compression (crossed legs, plaster, weight loss)", "Trauma", "Ganglion", "Vasculitis (mononeuritis)"], red: "Foot drop with SPARED inversion and hip abduction is peroneal, not L5 — the spared movements are the whole discriminator." },
  nerve_peroneal_deep: { name: "Deep peroneal nerve palsy", note: "Weak ankle dorsiflexion and great-toe extension with first dorsal web-space sensory loss; EVERSION is spared (superficial peroneal intact).", ddx: ["Anterior compartment / deep-branch entrapment", "Anterior tarsal tunnel", "Trauma"], red: "Foot drop with spared eversion localises below the peroneal bifurcation to the deep branch." },
  nerve_peroneal_superficial: { name: "Superficial peroneal nerve palsy", note: "Weak foot eversion with sensory loss over the dorsum of the foot; DORSIFLEXION and great-toe extension are spared.", ddx: ["Lateral compartment entrapment", "Ankle sprain / trauma", "Fascial defect"], red: "Weak eversion with preserved dorsiflexion is the superficial peroneal branch." },
  nerve_tibial: { name: "Tibial nerve palsy", note: "Weak plantarflexion, foot inversion and toe flexion with sole sensory loss and a lost ankle jerk (tarsal-tunnel lesions are more distal, sparing plantarflexion).", ddx: ["Tarsal tunnel syndrome (distal)", "Popliteal trauma / Baker's cyst", "Nerve tumour"], red: "Sole numbness with weak toe flexion localises to the tibial nerve — tarsal-tunnel entrapment is treatable." },
  visual_pathway_chiasm: { name: "Chiasmal (parasellar) lesion", note: "Bitemporal hemianopia from compression of the decussating nasal fibres at the optic chiasm.", ddx: ["Pituitary macroadenoma (from below)", "Craniopharyngioma (from above)", "Meningioma", "Internal carotid aneurysm"], red: "Bitemporal field loss with headache or endocrine change — image the sella; acuity/colour loss or apoplexy are emergencies." },
  visual_pathway_optic_tract: { name: "Optic tract lesion", note: "Contralateral incongruous homonymous hemianopia WITH a relative afferent pupillary defect (the pupil fibres are still in the tract).", ddx: ["Craniopharyngioma / parasellar tumour", "Anterior/posterior choroidal infarct", "Demyelination"], red: "A homonymous hemianopia WITH an RAPD localises to the optic tract (pre-geniculate), not the occipital cortex." },
  visual_pathway_lgn: { name: "Lateral geniculate lesion", note: "Contralateral (often incongruous / sectoranopic) homonymous hemianopia with NO RAPD; look for thalamic sensory company (choroidal blood supply).", ddx: ["Anterior/posterior choroidal artery infarct", "Tumour", "Demyelination"], red: "A wedge/sectoranopia with thalamic sensory signs points to the lateral geniculate." },
  pupil_cn3_compressive: { name: "Compressive (pupil-involving) CN III palsy", note: "A CN III palsy WITH a fixed dilated pupil — the surface parasympathetic fibres are compressed first.", ddx: ["Posterior communicating artery aneurysm", "Uncal herniation", "Tumour / cavernous mass"], red: "A fixed dilated pupil with a third-nerve palsy is a SURGICAL EMERGENCY — image the vessels (CTA/MRA) for an aneurysm now." },
  pupil_cn3_ischaemic: { name: "Ischaemic (pupil-sparing) CN III palsy", note: "A CN III palsy that SPARES the pupil — the core is infarcted (vasa nervorum) but the surface parasympathetic fibres survive; typically microvascular.", ddx: ["Diabetic / hypertensive microvascular infarct", "Giant cell arteritis", "Migraine"], red: "Pupil-sparing is reassuring, but recheck the pupil over days and review vascular risk (and ESR/CRP for GCA)." },
  pupil_ciliary_ganglion: { name: "Adie (tonic) pupil", note: "A dilated pupil with light-near dissociation and slow tonic re-dilation from a ciliary-ganglion (postganglionic parasympathetic) lesion; with absent deep-tendon reflexes it is Holmes-Adie.", ddx: ["Post-viral / idiopathic ciliary ganglionitis", "Orbital trauma / surgery", "Autonomic neuropathy"], red: "Benign — but confirm with dilute pilocarpine (denervation supersensitivity) and exclude an efferent CN III cause." },
  pupil_pretectum: { name: "Argyll Robertson pupils", note: "Small, irregular, bilateral pupils with light-near dissociation (accommodate but do not react to light) from a dorsal-midbrain / pretectal lesion.", ddx: ["Neurosyphilis (classic)", "Diabetes", "Dorsal midbrain lesion"], red: "Bilateral light-near dissociation warrants syphilis serology and a look at the dorsal midbrain." },
  dorsal_midbrain_tectum: {
    name: "Dorsal-midbrain (tectal) vertical gaze palsy",
    note: "Posterior commissure / riMLF — supranuclear vertical (up-) gaze palsy without pupillary involvement.",
    ddx: ["Dorsal-midbrain infarct", "Progressive supranuclear palsy (degenerative)", "Demyelination (MS)", "Early tectal / pineal tumour"],
    red: "A supranuclear vertical gaze palsy warrants dorsal-midbrain imaging — look for a tectal lesion or early hydrocephalus."
  },
  cortex_premotor: {
    name: "Premotor cortex — limb (motor) apraxia",
    note: "Impaired skilled / learned / sequenced movement with intact power, tone and coordination — a motor-planning deficit anterior to the primary motor strip.",
    ddx: ["MCA superior-division infarct", "Tumour", "Neurodegeneration (corticobasal syndrome)"],
    red: "Apraxia with normal power is a cortical (premotor / parietal) sign — image the frontoparietal cortex."
  },
  cortex_sma: {
    name: "Supplementary motor area (SMA) syndrome",
    note: "A medial premotor (SMA) lesion: alien-limb phenomenon (grasping / groping), akinesia / reduced spontaneous movement, and — on the dominant side — transiently reduced speech initiation (transcortical-motor-like). Often recovers.",
    ddx: ["ACA / parasagittal infarct", "Falx / parasagittal meningioma", "Glioma", "Post-resection"],
    red: "A medial frontal / parasagittal lesion — image the interhemispheric frontal region and the ACA territory."
  },
  cortex_paracentral: {
    name: "Paracentral / superomedial frontal (bladder + gait)",
    note: "The superomedial frontal micturition centre and the medial / parasagittal gait pathways: cortical urinary incontinence (loss of bladder inhibition) ± frontal gait apraxia (magnetic gait). With medial leg-motor involvement gives the parasagittal picture (leg weakness + incontinence).",
    ddx: ["Parasagittal / falx meningioma (bilateral leg weakness + incontinence)", "ACA infarct", "Normal-pressure hydrocephalus (gait + incontinence + cognition)"],
    red: "Bilateral leg weakness with urinary incontinence is a parasagittal lesion until proven otherwise — image the interhemispheric fissure."
  },
  cortex_dlpfc: {
    name: "Dorsolateral prefrontal (dysexecutive) syndrome",
    note: "Impaired planning, organising, sequencing, working memory and set-shifting (perseveration), with intact primary functions.",
    ddx: ["MCA superior-division / frontal lesion", "Neurodegeneration (frontotemporal, vascular)", "Tumour"],
    red: "A dysexecutive syndrome warrants frontal imaging and cognitive assessment."
  },
  cortex_medial_pfc: {
    name: "Medial prefrontal / anterior cingulate (abulic) syndrome",
    note: "Apathy / abulia — reduced spontaneous behaviour and speech; when bilateral, akinetic mutism. ACA territory (+ a contralateral grasp reflex).",
    ddx: ["ACA infarct (esp. bilateral)", "Anterior communicating artery aneurysm rupture", "Falx meningioma", "Tumour"],
    red: "Profound apathy / akinetic mutism after SAH or ACA stroke — image the medial frontal lobes."
  },
  cortex_orbitofrontal: {
    name: "Orbitofrontal disinhibition syndrome",
    note: "Disinhibition, impulsivity, poor social judgement and personality change (pseudopsychopathic), often with a palmomental reflex.",
    ddx: ["Orbitofrontal contusion (head injury)", "Frontotemporal dementia", "Olfactory-groove / subfrontal meningioma", "Tumour"],
    red: "New disinhibition / personality change is a frontal sign — image the orbitofrontal region (and consider subfrontal masses)."
  },
  cortex_operculum: {
    name: "Broca's aphasia (non-fluent; repetition impaired)",
    note: "Dominant frontal operculum / posterior inferior frontal gyrus. Non-fluent, effortful, agrammatic output with relatively preserved comprehension and impaired repetition; often with right face/arm weakness.",
    ddx: ["MCA superior-division infarct", "Haemorrhage", "Tumour"],
    red: "Acute non-fluent aphasia + right hemiparesis is a dominant MCA stroke — time-critical."
  },
  cortex_temporoparietal: {
    name: "Wernicke's aphasia (fluent; comprehension + repetition impaired)",
    note: "Dominant posterior superior temporal gyrus. Fluent, paraphasic (empty) speech with impaired comprehension and repetition; often no weakness (can be mistaken for confusion / psychosis).",
    ddx: ["MCA inferior-division infarct", "Haemorrhage", "Tumour", "Encephalitis"],
    red: "Fluent jargon aphasia without weakness is easily missed as an acute stroke — image and consider thrombolysis."
  },
  cortex_arcuate: {
    name: "Conduction aphasia (arcuate fasciculus)",
    note: "Fluent with intact comprehension but disproportionately impaired repetition and phonemic paraphasias — a disconnection of Wernicke from Broca (arcuate fasciculus / supramarginal gyrus).",
    ddx: ["MCA (supramarginal) infarct", "Small subcortical lesion", "Tumour"],
    red: "Repetition out of proportion to fluency and comprehension points to the arcuate fasciculus."
  },
  cortex_watershed_anterior: {
    name: "Transcortical motor aphasia (anterior watershed)",
    note: "Non-fluent with intact comprehension but PRESERVED repetition — an anterior watershed (ACA-MCA border) / supplementary-motor-area lesion sparing the perisylvian core.",
    ddx: ["Anterior watershed (border-zone) infarct — hypotension / carotid stenosis", "SMA / medial frontal lesion"],
    red: "Preserved repetition with non-fluent aphasia suggests a border-zone infarct — check for carotid stenosis / hypoperfusion."
  },
  cortex_watershed_posterior: {
    name: "Transcortical sensory aphasia (posterior watershed)",
    note: "Fluent with impaired comprehension but PRESERVED repetition (echolalia) — a posterior watershed (MCA-PCA border) lesion sparing the perisylvian core.",
    ddx: ["Posterior watershed (border-zone) infarct", "Neurodegeneration (logopenic / semantic)", "Tumour"],
    red: "Preserved repetition with poor comprehension suggests a border-zone infarct or a degenerative aphasia."
  },
  cortex_angular: {
    name: "Anomic aphasia (angular gyrus)",
    note: "Fluent, good comprehension and repetition, isolated word-finding failure (anomia). The least-localising aphasia — the angular gyrus is the classic focal site, but anomia occurs with many lesions and in recovery.",
    ddx: ["Angular gyrus lesion", "Recovering / residual aphasia of any type", "Neurodegeneration"],
    red: "Isolated anomia localises poorly — correlate with the rest of the exam and imaging."
  },
  cortex_aphasia_global: {
    name: "Global aphasia (perisylvian)",
    note: "Non-fluent, impaired comprehension and impaired repetition — a large dominant perisylvian lesion (Broca + Wernicke + the arcuate between). Usually with dense right hemiparesis and hemianopia.",
    ddx: ["Large dominant MCA infarct (proximal M1)", "Haemorrhage", "Tumour"],
    red: "Global aphasia with hemiplegia is a large dominant MCA stroke — urgent imaging / reperfusion assessment."
  },
  cortex_aphasia_mixed_transcortical: {
    name: "Mixed transcortical aphasia (isolation of the speech area)",
    note: "Non-fluent, impaired comprehension, but PRESERVED repetition (echolalia) — both watershed zones affected, isolating an intact perisylvian core (isolation of the speech area).",
    ddx: ["Complete border-zone (watershed) infarction — severe hypotension / carotid occlusion", "Anoxic injury"],
    red: "Echolalia with otherwise severe aphasia suggests global border-zone hypoperfusion — look for a haemodynamic cause."
  },
  aphasia_subcortical_thalamic: {
    name: "Thalamic aphasia (dominant thalamus)",
    note: "A fluent, anomic, paraphasic aphasia with fluctuating comprehension but preserved repetition, from a dominant thalamic lesion — here accompanied by contralateral sensory loss (VPL).",
    ddx: ["Dominant thalamic infarct / haemorrhage", "Artery of Percheron (if bilateral)", "Tumour"],
    red: "Aphasia with contralateral sensory loss and no cortical signs points to the dominant thalamus."
  },
  aphasia_subcortical_striatocapsular: {
    name: "Striatocapsular aphasia (dominant striatum / internal capsule)",
    note: "A non-fluent, dysarthric aphasia from a dominant striatocapsular lesion, accompanied by contralateral hemiparesis (internal capsule).",
    ddx: ["Lenticulostriate (striatocapsular) infarct", "Hypertensive haemorrhage (putamen)", "Tumour"],
    red: "Aphasia with a dense contralateral hemiparesis and no cortical signs points to a deep dominant (striatocapsular) lesion."
  },
  thalamus_vpm: {
    name: "VPM thalamic syndrome — contralateral facial sensory loss",
    note: "The VPM (face) division of the thalamic sensory relay: contralateral facial sensory loss — crossed, unlike the ipsilateral facial loss of a brainstem trigeminal lesion.",
    ddx: ["Thalamic infarct / haemorrhage", "Tumour"],
    red: "Crossed facial sensory loss (contralateral, no ipsilateral brainstem signs) points above the pons — image the thalamus."
  },
  thalamus_vl: {
    name: "Ventrolateral thalamic (motor-relay) syndrome — thalamic tremor",
    note: "Ventral anterior/lateral nuclei (the dentato-/pallido-thalamic motor relay to cortex): a delayed dystonic 'thalamic hand', tremor and sometimes ataxia; the VL is the thalamotomy / DBS target for tremor.",
    ddx: ["Thalamic infarct / haemorrhage", "Tumour", "Post-stroke (delayed)"],
    red: "A new movement disorder with a deep contralateral lesion — image the thalamus."
  },
  thalamus_pulvinar: {
    name: "Pulvinar (posterior thalamic) syndrome — thalamic neglect",
    note: "Pulvinar / posterior thalamus (visual attention / salience): contralateral hemispatial neglect from a deep lesion; distinguished from cortical neglect by the absence of other parietal signs.",
    ddx: ["Thalamic (posterior) infarct / haemorrhage", "Tumour"],
    red: "Neglect can arise from a deep thalamic lesion as well as the cortex — image both."
  },
  thalamus_limbic: {
    name: "Anterior / dorsomedial thalamic syndrome — diencephalic amnesia",
    note: "Anterior and dorsomedial nuclei (Papez circuit / mammillothalamic tract): prominent anterograde amnesia (± executive change), the thalamic form of diencephalic amnesia.",
    ddx: ["Artery of Percheron / paramedian thalamic infarct", "Thiamine deficiency (Wernicke-Korsakoff)", "Tumour"],
    red: "Acute amnesia with a diencephalic lesion — give thiamine before glucose if any nutritional risk (Wernicke)."
  },
  hypothalamus_supraoptic: {
    name: "Central diabetes insipidus (supraoptic / paraventricular hypothalamus)",
    note: "ADH (vasopressin) failure — polyuria with dilute urine and hypernatraemia; from hypothalamic (or pituitary-stalk) injury.",
    ddx: ["Hypothalamic / stalk tumour (craniopharyngioma, germinoma)", "Neurosurgery / trauma", "Neurosarcoid / Langerhans histiocytosis", "Lymphocytic hypophysitis"],
    red: "Polyuria with rising sodium after pituitary surgery or head injury is central DI — measure paired serum/urine osmolality."
  },
  hypothalamus_thermoregulatory: {
    name: "Hypothalamic thermoregulatory failure",
    note: "Anterior/preoptic (heat loss) vs posterior (heat conservation): a lesion gives sustained hyper- or hypothermia / poikilothermia not explained by infection.",
    ddx: ["Hypothalamic tumour / infiltration", "Stroke / haemorrhage", "Wernicke's", "Post-surgical"],
    red: "Unexplained persistent hyper/hypothermia with other hypothalamic signs — image the hypothalamus."
  },
  hypothalamus_ventromedial: {
    name: "Ventromedial hypothalamic syndrome — hyperphagia / obesity",
    note: "Ventromedial nucleus (satiety centre): hyperphagia, rapid weight gain and sometimes rage / aggression.",
    ddx: ["Craniopharyngioma / hypothalamic tumour", "Post-surgical hypothalamic injury", "Trauma"],
    red: "New-onset hyperphagic obesity with visual or endocrine signs — image the suprasellar / hypothalamic region."
  },
  hypothalamus_lateral: {
    name: "Lateral hypothalamic syndrome — narcolepsy / cachexia",
    note: "Lateral hypothalamic area: orexin (hypocretin) loss → narcolepsy-cataplexy / hypersomnia; a destructive lesion → aphagia and wasting (diencephalic cachexia of infancy).",
    ddx: ["Autoimmune hypocretin loss (narcolepsy type 1)", "Hypothalamic tumour", "Trauma / infarct"],
    red: "Excessive daytime sleepiness with cataplexy — consider CSF hypocretin and MRI."
  },
  hypothalamus_suprachiasmatic: {
    name: "Suprachiasmatic (circadian) syndrome",
    note: "Suprachiasmatic nucleus (the circadian pacemaker): disrupted sleep-wake timing / free-running rhythm.",
    ddx: ["Suprasellar tumour", "Trauma", "Neurodegeneration"],
    red: "Persistent circadian disruption with other hypothalamic features warrants imaging."
  },
  hypothalamus_mammillary: {
    name: "Mammillary body syndrome (Wernicke-Korsakoff)",
    note: "Mammillary bodies (Papez): amnesia with confabulation (Korsakoff), classically with the Wernicke triad (ophthalmoplegia, ataxia, confusion) from thiamine deficiency.",
    ddx: ["Thiamine deficiency (alcohol, malnutrition, hyperemesis, bariatric surgery)", "Tumour", "Infarct"],
    red: "Give parenteral thiamine BEFORE glucose in any at-risk patient with confusion / amnesia — Wernicke is a treatable emergency."
  },
  hypothalamus_tuberal: {
    name: "Tuberal / arcuate hypothalamic syndrome — endocrine dysfunction",
    note: "Tuberal / arcuate hypothalamus and the hypothalamic-pituitary axis: hypopituitarism, hyperprolactinaemia (stalk effect) or precocious puberty.",
    ddx: ["Craniopharyngioma / hypothalamic hamartoma / germinoma", "Pituitary macroadenoma (stalk effect)", "Infiltration (sarcoid, histiocytosis)", "Radiotherapy"],
    red: "Combined endocrine dysfunction with visual-field loss points to a suprasellar mass — image and check the pituitary axis."
  },
  corpus_callosum_anterior: {
    name: "Anterior callosal disconnection (split-brain)",
    note: "Genu / body of the corpus callosum: left-hand (verbal-command) apraxia and agraphia, with alien-hand / intermanual conflict — the left-hemisphere language and the right motor cortex (left hand) are disconnected. The right hand is spared.",
    ddx: ["ACA / callosal infarct (pericallosal artery)", "Callosotomy (epilepsy surgery)", "Tumour (butterfly glioma)", "Marchiafava-Bignami (alcohol)", "Demyelination"],
    red: "A one-handed (left) apraxia with alien-hand behaviour is a callosal / medial-frontal lesion — image the interhemispheric region."
  },
  corpus_callosum_splenium: {
    name: "Splenial callosal disconnection",
    note: "Splenium (posterior corpus callosum): left-hand tactile anomia — objects felt with the left hand cannot be named (though they can be used). The splenium is also the visual half of alexia without agraphia (the word-form deficit itself sits at the dominant fusiform / VWFA).",
    ddx: ["Left PCA infarct (splenium + occipital)", "Tumour", "Demyelination (MS — splenial lesions)", "Callosotomy"],
    red: "Splenial signs travel with a left PCA territory lesion (right hemianopia, pure alexia) — image the posterior circulation."
  },
  guillain_mollaret_triangle: {
    name: "Guillain-Mollaret triangle (dentato-rubro-olivary) — palatal / oculopalatal tremor",
    note: "Palatal myoclonus (± vertical pendular nystagmus = oculopalatal tremor) from hypertrophic olivary degeneration. A lesion anywhere in the loop (red nucleus → central tegmental tract → inferior olive → olivocerebellar → dentate → superior cerebellar peduncle → red nucleus) produces it; the commonest is the central tegmental tract, and the hypertrophied olive is the MRI hallmark.",
    ddx: ["Brainstem infarct / haemorrhage / cavernous malformation (central tegmental tract)", "Demyelination (MS)", "Trauma", "Neurodegeneration"],
    red: "New palatal tremor warrants MRI looking for hypertrophic olivary degeneration and the causative brainstem/cerebellar lesion."
  },
  guillain_mollaret_rubral: {
    name: "Guillain-Mollaret triangle — red-nucleus (rubral) corner",
    note: "A midbrain lesion at the red-nucleus corner of the triangle — a contralateral rubral (Holmes) tremor, which may be accompanied by palatal tremor.",
    ddx: ["Midbrain infarct / haemorrhage", "Demyelination", "Tumour"],
    red: "Palatal tremor plus rubral (Holmes) tremor localises to the midbrain — image the dorsal midbrain."
  },
  guillain_mollaret_dentate: {
    name: "Guillain-Mollaret triangle — dentate (cerebellar) corner",
    note: "Palatal tremor with ipsilateral appendicular cerebellar signs — a lesion at the dentate corner (dentato-olivary limb via the superior cerebellar peduncle).",
    ddx: ["Cerebellar / dentate infarct or haemorrhage", "Tumour", "Demyelination", "Surgical (post-resection)"],
    red: "Palatal tremor with cerebellar signs points to the dentate / superior cerebellar peduncle — image the cerebellum and its peduncles."
  },
  pons_trigeminal: {
    name: "Trigeminal complex (pontine) — main sensory + motor V",
    note: "Ipsilateral facial (discriminative) touch loss + jaw weakness (jaw deviates to the weak side) from the pontine main sensory + motor trigeminal nuclei. Touch localises to the pons; pain/temperature to the medullary spinal nucleus.",
    ddx: ["Trigeminal schwannoma", "Focal pontine lesion (demyelination, infarct)", "Pontine glioma"],
    red: "A trigeminal motor + main-sensory deficit points into the pons — image the brainstem."
  },
  pons_lateral_trigeminal: {
    name: "Lateral pontine syndrome (Marie-Foix) with trigeminal (V) involvement",
    note: "The AICA / lateral-pontine cluster (spinothalamic, middle cerebellar peduncle, vestibular) reaching the trigeminal nuclei — adds ipsilateral facial touch loss + jaw weakness.",
    ddx: ["AICA infarct", "Demyelination", "Pontine tumour"],
    red: "AICA territory can cause deafness (labyrinthine artery) — a lateral pontine picture warrants posterior-circulation imaging."
  },
  skull_base_trochlear_cisternal: {
    name: "Trochlear (CN IV) nerve palsy — ipsilateral superior oblique",
    note: "An isolated superior oblique palsy from the trochlear nerve's long cisternal course; vertical/torsional diplopia worse on downgaze and on head tilt to the affected side.",
    ddx: ["Trauma (the long course is vulnerable)", "Microvascular (diabetes / hypertension)", "Congenital (decompensated)", "Raised intracranial pressure"],
    red: "Bilateral trochlear palsy after head trauma suggests a dorsal-midbrain (tectal plate) injury — image it."
  },
  midbrain_trochlear: {
    name: "Dorsal-midbrain (trochlear / MLF) syndrome — contralateral superior oblique palsy ± INO",
    note: "CN IV decussates, so a nuclear/fascicular lesion gives a CONTRALATERAL superior oblique palsy; the adjacent rostral MLF adds an ipsilateral INO. The crossed SO palsy (and/or INO) is the localiser.",
    ddx: ["Dorsal-midbrain infarct", "Demyelination (MS)", "Tumour (pineal / tectal)", "Haemorrhage"],
    red: "A CONTRALATERAL (crossed) superior oblique palsy localises into the dorsal midbrain, not the nerve — image the brainstem."
  },
  cerebrum_diffuse: {
    name: "Diffuse bihemispheric / cortical dysfunction (encephalopathy)",
    note: "Impaired arousal from bilateral / diffuse cortical dysfunction with no focal signs.",
    ddx: ["Metabolic (hypoglycaemia, hepatic / uraemic, Na / Ca)", "Hypoxic-ischaemic injury", "Drug / toxin", "Sepsis", "Non-convulsive status epilepticus", "Bilateral cortical stroke"],
    red: "Coma with no focal signs and intact brainstem reflexes is metabolic / diffuse until proven otherwise — check glucose, sodium and a blood gas immediately."
  },
  brainstem_aras: {
    name: "Brainstem ARAS (rostral tegmental) arousal failure",
    note: "A paramedian upper-pons / midbrain tegmental lesion knocks out the ascending reticular activating system; decerebrate (extensor) posturing and other brainstem signs accompany it.",
    ddx: ["Top-of-basilar / midbrain infarct", "Pontine haemorrhage", "Central (transtentorial) herniation", "Demyelination"],
    red: "Impaired arousal with brainstem signs (extensor posturing, asymmetric / fixed pupils, gaze palsy) is a posterior-circulation emergency — image the vessels."
  },
  thalamus_bilateral_percheron: {
    name: "Bilateral paramedian thalamic syndrome (artery of Percheron)",
    note: "One artery (of Percheron) supplies both paramedian thalami ± the rostral midbrain → impaired arousal + vertical gaze palsy + memory / confusion.",
    ddx: ["Artery of Percheron infarct", "Deep cerebral venous thrombosis", "Top-of-basilar syndrome"],
    red: "Sudden coma with vertical gaze palsy and a near-normal early CT → suspect a Percheron infarct or deep venous thrombosis; get vascular imaging."
  },
  locked_in: {
    name: "Locked-in syndrome (ventral pontine)",
    note: "A bilateral basis pontis lesion → quadriplegia + anarthria with PRESERVED consciousness; the dorsal tegmental ARAS is spared, so the patient is awake and communicates by vertical eye movements / blink.",
    ddx: ["Basilar (ventral pontine) infarct", "Central pontine myelinolysis", "Pontine haemorrhage"],
    red: "Do not mistake locked-in for coma or a vegetative state — the patient is fully aware; establish a vertical-eye-movement / blink communication channel."
  },
  parinaud_dorsal_midbrain: {
    name: "Parinaud syndrome (dorsal midbrain / pretectal syndrome)",
    note: "One pretectal / tectal lesion: vertical (up-) gaze palsy + convergence-retraction nystagmus + light-near dissociation ± lid retraction (Collier's sign).",
    ddx: ["Pineal / tectal tumour (compresses the tectum)", "Dorsal-midbrain infarct", "Obstructive hydrocephalus (aqueductal stenosis)", "Demyelination (MS)"],
    red: "Vertical gaze palsy + light-near dissociation, especially in a young patient — image the pineal region and ventricles; obstructive hydrocephalus is a neurosurgical emergency."
  },
  cord_lateral: { name: "Central (first-order) Horner's — cervical cord", note: "Descending sympathetic in the lateral cervical cord (syringomyelia, cord tumour/infarct); ipsilateral hemibody anhidrosis. Only a lesion at/above ~T1 gives a Horner.", ddx: ["Syringomyelia", "Intramedullary tumour", "Cord infarct", "Demyelination"], red: "A Horner with suspended sensory loss or long-tract signs → image the cervical cord." },
  sympathetic_preganglionic: { name: "Preganglionic (second-order) Horner's", note: "A Horner from the preganglionic oculosympathetic (ciliospinal centre → stellate ganglion); facial anhidrosis with the body spared.", ddx: ["Pancoast (apical lung) tumour", "Thyroid / mediastinal mass", "Iatrogenic (CVC, surgery)", "Trauma"], red: "A preganglionic Horner with C8/T1 wasting or arm pain → image the lung apex for a Pancoast tumour." },
  sympathetic_pancoast: { name: "Pancoast syndrome (superior sulcus tumour)", note: "A preganglionic Horner PLUS lower-trunk (C8/T1) involvement — hand-intrinsic wasting, T1 sensory loss and aching arm/shoulder pain — from an apical lung tumour.", ddx: ["Bronchogenic (superior sulcus) carcinoma", "Apical TB / infection", "Metastasis"], red: "A Horner with hand wasting and arm pain is a Pancoast tumour until proven otherwise — image the lung apex urgently." },
  skull_base_carotid_space: { name: "Postganglionic (third-order) Horner's — carotid", note: "A Horner from the postganglionic fibres on the internal carotid (carotid dissection, cavernous lesion); isolated, often painful, with NO anhidrosis (the facial sudomotor fibres left with the external carotid).", ddx: ["Internal carotid artery dissection", "Cavernous sinus lesion", "Cluster headache"], red: "A painful isolated Horner is a carotid dissection until proven otherwise — urgent vessel imaging (stroke risk)." }
};

// Recognise the eponym for a chosen site. Falls back to a plain anatomical description.
// For cortex sites the eponym can depend on hemisphere, so an entry may be a
// { dominant, nondominant, bilateral } variant object; resolve by the site side vs dominantSide.
export function nameForSite(site, opts = {}) {
  // Prefer an exact site-id entry (e.g. the bilateral cortex sites, whose level+part collides with a
  // unilateral subregion); otherwise key by level_part as usual.
  const key = BY_SITE[site.id] ? site.id : `${site.level}_${site.part}`;
  const entry = BY_SITE[key];
  const anatomical = `${site.side} ${site.level}, ${site.part}`;
  if (entry) {
    const variant = (entry.dominant || entry.nondominant || entry.bilateral)
      ? (site.side === "bilateral"
          ? (entry.bilateral || entry.dominant)
          : (site.side === (opts.dominantSide || "left") ? entry.dominant : entry.nondominant))
      : entry;
    return { ...variant, anatomical };
  }
  return {
    name: `${site.side} ${site.level} (${site.part})`,
    note: "No eponym for this exact combination — the engine still localises it anatomically.",
    ddx: [], red: null, anatomical
  };
}

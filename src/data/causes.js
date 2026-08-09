// causes.js — the aetiology ("what") layer. Given a lesion at a site, the tempo-aware surgical-sieve
// differential of CAUSES. Causes are not derivable from anatomy the way syndromes are, but cause
// CATEGORIES correlate with site attributes and with the TEMPO of onset. This module is the structured,
// tempo-aware layer over the same knowledge the phonebook (syndromes.js) holds as free-text ddx.
//
//   causesFor(site, { onset }) -> { byCategory, all, onset, derived }
//
// Curated per-site entries (bootstrapped from the phonebook ddx) take precedence; a derived category
// fallback seeds plausible categories from site attributes so EVERY site returns something.

// ---- the surgical sieve ----
export const CATEGORIES = [
  { id: "vascular",     label: "Vascular (ischaemic / haemorrhagic)",        tint: "--terra" },
  { id: "inflammatory", label: "Inflammatory / demyelinating / autoimmune",  tint: "--bilat" },
  { id: "neoplastic",   label: "Neoplastic / compressive",                   tint: "--navy-2" },
  { id: "infective",    label: "Infective",                                  tint: "--ipsi" },
  { id: "metabolic",    label: "Metabolic / toxic / nutritional",            tint: "--gold" },
  { id: "traumatic",    label: "Traumatic / mechanical",                     tint: "--muted" },
  { id: "degenerative", label: "Degenerative / hereditary",                  tint: "--faint" },
  { id: "congenital",   label: "Congenital / structural",                    tint: "--none" },
];
export const TEMPO = [
  { id: "hyperacute", label: "Hyperacute (secs–min)" },
  { id: "acute",      label: "Acute (hrs–days)" },
  { id: "subacute",   label: "Subacute (days–wks)" },
  { id: "chronic",    label: "Chronic (wks–yrs)" },
];
export const LIKELIHOOD = ["common", "uncommon", "rare"];

// terse constructor.
//  `feature` (optional) — a short discriminating clue ("what points to this cause"), a suggestive hint.
//  `pathognomonic` (optional) — a genuine pathognomonic / near-pathognomonic BEDSIDE sign to look for that
//   confirms this cause ("if you see X, it's Y"). Shown as a distinct "Confirm on exam" flag. Reserved for
//   real bedside confirmatory signs (e.g. Ramsay Hunt ear vesicles) — NOT investigations (those are Next steps).
// The live phonebook categoriser and the derived fallback leave both blank.
const c = (name, cat, tempo, likelihood, red = false, feature = "", pathognomonic = "") =>
  ({ name, cat, tempo, likelihood, red, feature, pathognomonic });

// ---- curated causes, keyed like the phonebook (site.id if it has its own entry, else level_part) ----
export const CAUSES = {
  // --- brainstem ---
  midbrain_medial: [ // Weber / Benedikt / Claude
    c("PCA perforator infarct", "vascular", ["hyperacute","acute"], "common", false, "Sudden onset; crossed signs (ipsilateral CN III + contralateral hemiparesis)"),
    c("Haemorrhage / cavernous malformation", "vascular", ["acute"], "uncommon", false, "Headache, depressed consciousness; blood on CT/GRE"),
    c("Demyelination (MS)", "inflammatory", ["subacute"], "uncommon", false, "Younger patient, subacute, prior episodes; T2 lesions"),
    c("Midbrain tumour / metastasis", "neoplastic", ["chronic"], "rare", false, "Progressive over weeks; enhancing mass"),
    c("Top-of-the-basilar embolism", "vascular", ["hyperacute","acute"], "uncommon", true, "Bilateral, with visual + behavioural change and reduced consciousness"),
  ],
  medulla_lateral: [ // Wallenberg
    c("PICA / vertebral artery occlusion", "vascular", ["hyperacute","acute"], "common", false, "Vertigo, ipsilateral facial + contralateral body pain/temp loss, Horner's, dysphagia"),
    c("Vertebral artery dissection", "vascular", ["hyperacute","acute"], "common", true, "Younger patient, neck pain/recent trauma, often no vascular risk factors"),
    c("Demyelination (MS)", "inflammatory", ["subacute"], "uncommon", false, "Younger, subacute onset, prior demyelinating episodes"),
    c("Lateral medullary tumour / metastasis", "neoplastic", ["chronic"], "rare", false, "Progressive; enhancing lesion on MRI"),
  ],
  medulla_medial: [ // Dejerine
    c("Anterior spinal / vertebral artery infarct", "vascular", ["hyperacute","acute"], "common", false, "Contralateral hemiparesis + tongue deviation + dorsal-column loss"),
    c("Vertebral dissection", "vascular", ["acute"], "uncommon", true, "Neck pain, younger patient"),
  ],
  pons_medial: [ // Millard-Gubler / Foville
    c("Basilar perforator infarct", "vascular", ["hyperacute","acute"], "common", false, "Crossed pontine signs; risk of progression to basilar occlusion"),
    c("Pontine haemorrhage", "vascular", ["hyperacute","acute"], "uncommon", true, "Pinpoint pupils, coma, hyperthermia; hypertensive"),
    c("Demyelination (MS)", "inflammatory", ["subacute"], "uncommon", false, "Younger, subacute, prior episodes; may cause INO"),
    c("Pontine glioma (esp. children)", "neoplastic", ["chronic"], "rare", false, "Progressive multiple cranial neuropathies; diffuse pontine expansion"),
  ],
  pons_basis_pontis: [ // ventral pontine lacune (ataxic hemiparesis / DCH)
    c("Small-vessel lacunar infarct", "vascular", ["acute"], "common"),
    c("Small pontine haemorrhage", "vascular", ["acute"], "uncommon", true),
    c("Demyelination", "inflammatory", ["subacute"], "rare"),
  ],
  // --- cord ---
  cord_anterior: [ // anterior spinal artery
    c("Anterior spinal artery infarct", "vascular", ["hyperacute","acute"], "common", false, "Sudden para/tetraparesis + pain/temp loss, dorsal columns spared; aortic surgery/hypotension"),
    c("Compressive myelopathy (disc / mass / abscess)", "neoplastic", ["subacute","chronic"], "common", true, "Progressive with a sensory level; MRI shows compression — surgical emergency"),
    c("Transverse myelitis (demyelinating)", "inflammatory", ["subacute"], "uncommon", false, "Subacute, cord signal change over ≥1 segment; MS/NMO/MOG or para-infectious"),
    c("Epidural abscess", "infective", ["acute","subacute"], "uncommon", true, "Fever, focal spinal pain, raised inflammatory markers; risk factors (IVDU, diabetes)"),
  ],
  cord_posterior: [
    c("B12 / copper deficiency (SCD)", "metabolic", ["subacute","chronic"], "common", false, "Distal paraesthesiae + sensory ataxia; a positive Romberg"),
    c("Tabes dorsalis (neurosyphilis)", "infective", ["chronic"], "rare", false, "Lightning pains, sensory ataxia, areflexia", "an Argyll Robertson pupil (accommodates but does not react to light)"),
    c("Demyelination", "inflammatory", ["subacute"], "uncommon"),
  ],
  cord_central: [ // syrinx
    c("Syringomyelia (± Chiari)", "congenital", ["chronic"], "common", false, "Cape-distribution dissociated sensory loss (pain/temp lost, touch spared)", "painless burns or scars on the hands from unnoticed injury"),
    c("Post-traumatic syrinx", "traumatic", ["chronic"], "uncommon"),
    c("Intramedullary tumour (ependymoma / astrocytoma)", "neoplastic", ["chronic"], "uncommon"),
  ],
  combined_degeneration_scd: [
    c("Vitamin B12 deficiency", "metabolic", ["subacute","chronic"], "common"),
    c("Copper deficiency (zinc excess / bariatric)", "metabolic", ["subacute","chronic"], "uncommon"),
    c("Nitrous-oxide toxicity", "metabolic", ["subacute"], "uncommon", true),
  ],
  combined_degeneration_friedreich: [
    c("Friedreich's ataxia (frataxin, GAA repeat)", "degenerative", ["chronic"], "common", false, "Teenager, progressive ataxia + areflexia with extensor plantars", "pes cavus and scoliosis with absent ankle jerks but upgoing plantars"),
    c("Other hereditary spinocerebellar ataxia", "degenerative", ["chronic"], "uncommon"),
    c("Vitamin E deficiency (mimic)", "metabolic", ["chronic"], "rare"),
  ],
  // --- skull base / cranial nerves ---
  skull_base_cavernous_sinus: [
    c("Cavernous sinus thrombosis", "vascular", ["acute","subacute"], "uncommon", true),
    c("Septic cavernous sinus thrombosis", "infective", ["acute"], "rare", true),
    c("Carotid-cavernous fistula", "vascular", ["subacute"], "uncommon"),
    c("Meningioma / pituitary / metastasis / perineural spread", "neoplastic", ["chronic"], "common"),
    c("Tolosa-Hunt (granulomatous)", "inflammatory", ["subacute"], "uncommon"),
    c("Carotid aneurysm", "vascular", ["chronic"], "rare"),
  ],
  skull_base_jugular_foramen: [ // Vernet
    c("Glomus jugulare (paraganglioma)", "neoplastic", ["chronic"], "common"),
    c("Schwannoma / meningioma", "neoplastic", ["chronic"], "common"),
    c("Metastasis / skull-base infiltration", "neoplastic", ["subacute","chronic"], "uncommon"),
    c("Jugular vein thrombosis", "vascular", ["subacute"], "rare", true),
  ],
  skull_base_cpa: [
    c("Vestibular schwannoma", "neoplastic", ["chronic"], "common"),
    c("Meningioma", "neoplastic", ["chronic"], "uncommon"),
    c("Epidermoid cyst", "congenital", ["chronic"], "rare"),
  ],
  skull_base_petrous_apex: [ // Gradenigo
    c("Petrous apicitis (complicated otitis media)", "infective", ["acute","subacute"], "uncommon", true),
    c("Chondrosarcoma", "neoplastic", ["chronic"], "rare"),
    c("Metastasis / cholesterol granuloma", "neoplastic", ["chronic"], "rare"),
  ],
  skull_base_orbital_apex: [
    c("Invasive fungal sinusitis (mucormycosis)", "infective", ["acute"], "rare", true),
    c("Tumour / perineural spread", "neoplastic", ["chronic"], "common"),
    c("Granulomatosis with polyangiitis / sarcoid", "inflammatory", ["subacute"], "uncommon"),
  ],
  skull_base_optic_neuritis: [
    c("Multiple sclerosis", "inflammatory", ["subacute"], "common", false, "Young adult, painful on eye movement, central scotoma, RAPD; recovers over weeks"),
    c("Idiopathic optic neuritis", "inflammatory", ["subacute"], "common", false, "Isolated, painful, unilateral; normal brain MRI"),
    c("NMO / MOG-associated", "inflammatory", ["subacute"], "uncommon", true, "Severe/bilateral or poor recovery; check aquaporin-4 & MOG antibodies"),
    c("Infective / para-infectious", "infective", ["subacute"], "rare", false, "Recent infection/vaccination; may be bilateral in children"),
  ],
  skull_base_optic_aion: [
    c("Arteritic AION — giant-cell arteritis", "vascular", ["acute"], "uncommon", true, "Age >50, jaw claudication, scalp tenderness, raised ESR/CRP — sight- and life-threatening"),
    c("Non-arteritic AION (vasculopathic)", "vascular", ["acute"], "common", false, "Painless altitudinal loss, 'disc at risk', vascular risk factors; ESR/CRP normal"),
  ],
  skull_base_vii_stylomastoid: [ // Bell's palsy site
    c("Bell's palsy (idiopathic / HSV)", "inflammatory", ["acute"], "common", false, "Isolated LMN facial weakness (forehead involved), over hours–days; diagnosis of exclusion"),
    c("Ramsay Hunt (herpes zoster oticus)", "infective", ["acute"], "uncommon", false, "Ear pain, ± hearing loss/vertigo", "vesicles in the external auditory meatus or on the pinna"),
    c("Lyme disease", "infective", ["subacute"], "uncommon", false, "Endemic area/tick exposure; may be bilateral facial palsy", "an expanding erythema migrans rash at a tick-bite site"),
    c("Parotid tumour / malignant infiltration", "neoplastic", ["chronic"], "uncommon", true, "Slowly progressive or a parotid mass — not a true 'Bell's'"),
    c("Sarcoidosis", "inflammatory", ["subacute"], "rare", false, "May be bilateral; consider with uveitis/hilar lymphadenopathy"),
  ],
  skull_base_vii_geniculate: [ // Ramsay Hunt
    c("Herpes zoster oticus (Ramsay Hunt)", "infective", ["acute"], "common", false, "Ear pain + facial palsy, ± taste/hearing/vertigo", "vesicles in the external auditory meatus or on the pinna"),
    c("Geniculate schwannoma", "neoplastic", ["chronic"], "rare"),
  ],
  skull_base_iam: [
    c("Vestibular schwannoma (intracanalicular)", "neoplastic", ["chronic"], "common"),
    c("Meningioma / facial schwannoma", "neoplastic", ["chronic"], "uncommon"),
  ],
  // --- vestibular ---
  peripheral_vestibular_labyrinth: [
    c("Vestibular neuritis", "inflammatory", ["acute"], "common"),
    c("Labyrinthitis (viral / bacterial)", "infective", ["acute"], "common"),
    c("Ménière's disease", "degenerative", ["subacute"], "uncommon"),
  ],
  central_vestibular_nucleus: [
    c("Cerebellar / brainstem stroke (PICA / AICA)", "vascular", ["hyperacute","acute"], "common", true),
    c("Demyelination (MS)", "inflammatory", ["subacute"], "uncommon"),
    c("Vertebrobasilar TIA", "vascular", ["acute"], "uncommon", true),
  ],
  // --- cortex / subcortex ---
  subcortex_internal_capsule: [
    c("Small-vessel lacunar infarct", "vascular", ["acute"], "common", false, "Pure motor (or sensorimotor) deficit, no cortical signs; hypertension/diabetes"),
    c("Hypertensive haemorrhage", "vascular", ["acute"], "uncommon", true, "Deep bleed on CT; headache, reduced consciousness, very high BP"),
  ],
  cortex_hand_knob: [
    c("Small precentral (hand-knob) infarct", "vascular", ["acute"], "common"),
    c("Cortical vein thrombosis", "vascular", ["subacute"], "rare", true),
    c("Small metastasis / demyelination", "neoplastic", ["subacute"], "rare"),
  ],
  cortex_operculum: [ // Broca
    c("MCA (superior division) infarct", "vascular", ["hyperacute","acute"], "common", false, "Abrupt non-fluent aphasia with face/arm weakness and gaze deviation toward the lesion"),
    c("Haemorrhage", "vascular", ["acute"], "uncommon", true, "Headache and vomiting with a deficit that worsens over minutes to hours rather than being maximal at onset"),
    c("Tumour (glioma / metastasis)", "neoplastic", ["chronic"], "uncommon", false, "Weeks of progressive speech difficulty, often announced by a focal seizure"),
  ],
  // --- cortex: anterior & posterior circulation territories (Region A) ---
  // The phonebook keys these dominant/nondominant (no flat `ddx`), so before curation they fell through to
  // the generic derived fallback. Commonest first; `feature` is the bedside discriminator.
  cortex_mca: [ // complete MCA territory — the classic large-vessel occlusion
    c("Proximal MCA (M1) / carotid-T occlusion", "vascular", ["hyperacute","acute"], "common", true,
      "Dense face/arm-predominant hemiparesis, gaze deviation toward the lesion, and aphasia or neglect — a large-vessel occlusion until proven otherwise, so thrombectomy assessment is time-critical"),
    c("Cardioembolic infarct (AF, endocarditis, post-MI thrombus)", "vascular", ["hyperacute","acute"], "common", false,
      "Deficit maximal at onset with an irregular pulse or known atrial fibrillation; infarcts in more than one arterial territory point to a cardiac or aortic source"),
    c("Large intracerebral haemorrhage", "vascular", ["hyperacute","acute"], "uncommon", true,
      "Headache, vomiting, depressed consciousness and very high blood pressure — clinically indistinguishable from infarct, so only the CT separates them"),
    c("Malignant MCA infarction (space-occupying oedema)", "vascular", ["acute","subacute"], "uncommon", true,
      "Declining consciousness on day 2–5 after a complete MCA infarct, with midline shift — decompressive hemicraniectomy is time-critical in selected patients"),
    c("Internal carotid artery dissection", "vascular", ["hyperacute","acute"], "uncommon", true,
      "Younger patient with neck or face pain after trauma or neck manipulation, often with no vascular risk factors",
      "a painful ipsilateral partial Horner's — ptosis and miosis with facial sweating preserved (the sudomotor fibres travel with the external carotid) — alongside the neck pain"),
    c("Glioma / metastasis presenting with a large hemispheric deficit", "neoplastic", ["subacute","chronic"], "rare", false,
      "Progression over weeks rather than seconds, often with seizures at onset and headache that is worse in the morning"),
  ],
  cortex_mca_superior: [ // fronto-opercular (Broca / motor aprosodia)
    c("MCA superior division infarct", "vascular", ["hyperacute","acute"], "common", true,
      "Face/arm-predominant weakness with non-fluent aphasia (dominant) or flat, unmodulated speech (non-dominant) and gaze deviation toward the lesion"),
    c("Intracerebral haemorrhage", "vascular", ["hyperacute","acute"], "uncommon", true,
      "Headache and vomiting with a deficit that worsens over minutes to hours rather than being maximal at onset"),
    c("Glioma / metastasis", "neoplastic", ["subacute","chronic"], "uncommon", false,
      "Progressive over weeks, frequently announced by a focal motor seizure; an enhancing mass with surrounding vasogenic oedema"),
    c("Cerebral abscess", "infective", ["acute","subacute"], "rare", true,
      "Fever, headache and raised inflammatory markers with a ring-enhancing lesion — look for the source (ear, sinuses, endocarditis, right-to-left shunt)"),
    c("Demyelination (large juxtacortical plaque)", "inflammatory", ["subacute"], "rare", false,
      "Younger patient, evolving over days with prior episodes and other lesions disseminated in time and space on MRI"),
  ],
  cortex_mca_inferior: [ // temporoparietal (Wernicke / neglect)
    c("MCA inferior division infarct", "vascular", ["hyperacute","acute"], "common", true,
      "Fluent but nonsensical speech (dominant) or dense neglect with anosognosia (non-dominant), a quadrantanopia, and little or no weakness"),
    c("Herpes simplex encephalitis", "infective", ["acute","subacute"], "uncommon", true,
      "Fever, headache, confusion and seizures with temporal-lobe signs — a CSF lymphocytosis with HSV PCR confirms, but suspicion alone warrants same-hour specialist input"),
    c("Intracerebral haemorrhage", "vascular", ["hyperacute","acute"], "uncommon", true,
      "Headache and vomiting with reduced consciousness; a lobar bleed in an older patient suggests cerebral amyloid angiopathy"),
    c("Glioma / metastasis", "neoplastic", ["subacute","chronic"], "uncommon", false,
      "Weeks of progressive language or spatial failure, often with seizures; an enhancing mass on MRI"),
  ],
  cortex_aca: [
    c("ACA infarct", "vascular", ["hyperacute","acute"], "common", false,
      "Contralateral leg-predominant weakness and cortical sensory loss with abulia or apathy; the face and arm are relatively spared"),
    c("Parasagittal meningioma", "neoplastic", ["chronic"], "common", false,
      "Months of slowly progressive leg weakness, often bilateral and with sphincter disturbance — it mimics a spinal cord lesion, so image the brain when the cord MRI is normal"),
    c("Superior sagittal sinus thrombosis", "vascular", ["acute","subacute"], "uncommon", true,
      "Headache with seizures and bilateral leg weakness; look for a prothrombotic state — pregnancy or the puerperium, the combined oral contraceptive, dehydration or malignancy"),
    c("Anterior communicating artery aneurysm (rupture ± vasospasm)", "vascular", ["hyperacute","acute"], "uncommon", true,
      "Thunderclap headache followed by leg weakness, abulia and amnesia — subarachnoid haemorrhage with ACA-territory ischaemia from vasospasm"),
    c("Azygos (unpaired) ACA supplying both hemispheres", "congenital", ["hyperacute","acute"], "rare", true,
      "A single occlusion causes bilateral leg weakness with abulia and incontinence — easily mistaken for a cord lesion or a psychiatric presentation"),
  ],
  cortex_pca: [
    c("PCA infarct", "vascular", ["hyperacute","acute"], "common", false,
      "Isolated contralateral homonymous hemianopia, typically with macular sparing and little else; often cardioembolic or from vertebrobasilar disease"),
    c("Occipital haemorrhage", "vascular", ["hyperacute","acute"], "uncommon", true,
      "Headache and vomiting with the field loss; a lobar bleed in an older patient suggests cerebral amyloid angiopathy"),
    c("Posterior reversible encephalopathy syndrome (PRES)", "metabolic", ["acute","subacute"], "uncommon", true,
      "Severe hypertension, eclampsia, or calcineurin-inhibitor / chemotherapy exposure, with headache, seizures and cortical visual loss — reversible if the trigger is corrected, but it can progress to haemorrhage or status epilepticus"),
    c("Glioma / metastasis", "neoplastic", ["subacute","chronic"], "uncommon", false,
      "Field loss progressing over weeks, often with headache or seizures; an enhancing mass on MRI"),
    c("Posterior cortical atrophy (Benson's syndrome)", "degenerative", ["chronic"], "rare", false,
      "Years of progressive visuospatial failure — trouble reading, judging distance and dressing — in a younger dementia patient whose memory is relatively preserved early on"),
  ],
  cortex_occipital: [
    c("PCA infarct", "vascular", ["hyperacute","acute"], "common", false,
      "Abrupt isolated homonymous hemianopia, typically with macular sparing; confrontation-test the fields or it will be missed"),
    c("Occipital haemorrhage", "vascular", ["hyperacute","acute"], "uncommon", true,
      "Headache and vomiting with the field loss; a lobar bleed in an older patient suggests cerebral amyloid angiopathy"),
    c("PRES (posterior reversible encephalopathy)", "metabolic", ["acute","subacute"], "uncommon", true,
      "Severe hypertension, eclampsia or calcineurin-inhibitor exposure, with headache, seizures and cortical visual loss — reversible if the trigger is corrected"),
    c("Glioma / metastasis", "neoplastic", ["subacute","chronic"], "uncommon", false,
      "Field loss progressing over weeks, often with headache or seizures; an enhancing mass on MRI"),
  ],
  cortex_watershed_anterior: [ // ACA-MCA border zone
    c("Border-zone (watershed) infarct from hypoperfusion", "vascular", ["hyperacute","acute"], "common", true,
      "Deficit appearing during hypotension, sepsis, major haemorrhage, cardiac arrest or cardiac surgery; bilateral anterior border-zone infarcts give the 'man-in-a-barrel' pattern of proximal arm weakness with the legs and hands spared"),
    c("Severe carotid stenosis or occlusion", "vascular", ["acute","subacute"], "common", true,
      "Recurrent stereotyped events provoked by standing or by blood-pressure lowering, sometimes with limb-shaking TIAs — image the carotids urgently"),
    c("Global hypoxic-ischaemic injury", "metabolic", ["acute"], "uncommon", true,
      "Follows cardiac arrest, drowning or profound hypoglycaemia; the deficits are bilateral and accompanied by impaired consciousness"),
    c("Tumour of the SMA / medial frontal region", "neoplastic", ["subacute","chronic"], "rare", false,
      "Weeks of progressive non-fluent speech with preserved repetition, rather than the abrupt onset of a border-zone infarct"),
  ],
  cortex_watershed_posterior: [ // MCA-PCA border zone
    c("Border-zone (watershed) infarct from hypoperfusion", "vascular", ["hyperacute","acute"], "common", true,
      "Abrupt fluent aphasia with impaired comprehension but preserved repetition, appearing during hypotension, sepsis, major haemorrhage or cardiac surgery"),
    c("Severe carotid stenosis or occlusion", "vascular", ["acute","subacute"], "common", true,
      "Stereotyped events provoked by standing or by blood-pressure lowering, with a carotid bruit or known stenosis — image the carotids urgently"),
    c("Primary progressive aphasia (semantic or logopenic variant)", "degenerative", ["chronic"], "uncommon", false,
      "Years rather than seconds: the semantic variant loses word meaning with fluent, empty speech and preserved repetition; the logopenic variant sits in the same territory but impairs sentence repetition"),
    c("Glioma / metastasis", "neoplastic", ["subacute","chronic"], "uncommon", false,
      "Progressive over weeks, often with seizures; an enhancing temporoparietal mass"),
  ],
  cortex_motor_facearm: [ // precentral strip, MCA
    c("MCA superior division infarct", "vascular", ["hyperacute","acute"], "common", true,
      "Abrupt contralateral face and arm weakness with the leg relatively spared; look for gaze deviation toward the lesion and cortical signs"),
    c("Intracerebral haemorrhage", "vascular", ["hyperacute","acute"], "uncommon", true,
      "Headache and vomiting with weakness that worsens over minutes to hours rather than being maximal at onset"),
    c("Glioma / metastasis", "neoplastic", ["subacute","chronic"], "uncommon", false,
      "Weeks of progressive weakness, often announced by focal motor seizures of the face or hand"),
    c("Cerebral abscess", "infective", ["acute","subacute"], "rare", true,
      "Fever with headache and raised inflammatory markers; a ring-enhancing lesion with a source such as sinusitis or endocarditis"),
    c("Focal cortical demyelination", "inflammatory", ["subacute"], "rare", false,
      "Younger patient with weakness evolving over days and prior demyelinating episodes"),
  ],
  cortex_motor_leg: [ // paracentral lobule, ACA
    c("ACA infarct", "vascular", ["hyperacute","acute"], "common", false,
      "Abrupt contralateral leg-predominant weakness with the face and arm spared, often with abulia"),
    c("Parasagittal meningioma", "neoplastic", ["chronic"], "common", false,
      "Months of progressive leg weakness, often bilateral and with sphincter disturbance — it mimics a spinal cord lesion, so image the brain if the cord MRI is normal"),
    c("Superior sagittal sinus thrombosis", "vascular", ["acute","subacute"], "uncommon", true,
      "Headache and seizures with bilateral leg weakness; look for pregnancy or the puerperium, the combined oral contraceptive, dehydration or malignancy"),
    c("Parasagittal metastasis", "neoplastic", ["subacute"], "uncommon", false,
      "Weeks of progressive leg weakness in a patient with a known primary; often multiple enhancing lesions with surrounding oedema"),
  ],
  cortex_sensory_facearm: [ // postcentral strip, MCA
    c("MCA infarct (postcentral / parietal branch)", "vascular", ["hyperacute","acute"], "common", true,
      "Abrupt cortical sensory loss of the face and arm — astereognosis, agraphaesthesia and loss of two-point discrimination, with crude touch and pain preserved"),
    c("Intracerebral haemorrhage", "vascular", ["hyperacute","acute"], "uncommon", true,
      "Headache and vomiting with sensory loss that worsens over minutes to hours"),
    c("Glioma / metastasis", "neoplastic", ["subacute","chronic"], "uncommon", false,
      "Weeks of progressive numbness, often preceded by focal sensory seizures marching up the arm to the face"),
    c("Focal cortical demyelination", "inflammatory", ["subacute"], "rare", false,
      "Younger patient with numbness evolving over days and prior demyelinating episodes"),
  ],
  cortex_sensory_leg: [ // paracentral lobule, ACA
    c("ACA infarct", "vascular", ["hyperacute","acute"], "common", false,
      "Abrupt cortical sensory loss of the contralateral leg with the arm and face spared, usually alongside leg weakness and abulia"),
    c("Parasagittal meningioma", "neoplastic", ["chronic"], "common", false,
      "Months of progressive leg numbness and weakness, often bilateral with sphincter disturbance — it mimics a spinal cord lesion"),
    c("Superior sagittal sinus thrombosis", "vascular", ["acute","subacute"], "uncommon", true,
      "Headache and seizures with bilateral leg symptoms; look for a prothrombotic state such as pregnancy, the combined oral contraceptive or malignancy"),
    c("Glioma / metastasis", "neoplastic", ["subacute","chronic"], "uncommon", false,
      "Weeks of progressive leg numbness, often with focal sensory seizures of the leg"),
  ],
  cortex_parietal: [
    c("MCA inferior division infarct", "vascular", ["hyperacute","acute"], "common", true,
      "Abrupt Gerstmann features (dominant) or neglect with anosognosia (non-dominant), an inferior quadrantanopia, and little or no weakness"),
    c("Glioma / metastasis", "neoplastic", ["subacute","chronic"], "common", false,
      "Weeks of progressive cortical failure, often with focal seizures — a focal cortical syndrome without weakness still needs imaging"),
    c("Intracerebral haemorrhage", "vascular", ["hyperacute","acute"], "uncommon", true,
      "Headache and vomiting with the cortical syndrome; a lobar bleed in an older patient suggests cerebral amyloid angiopathy"),
    c("Posterior cortical atrophy (Benson's syndrome)", "degenerative", ["chronic"], "uncommon", false,
      "Years of progressive visuospatial and apraxic failure — trouble reading, judging distance and dressing — with memory relatively preserved early on"),
    c("Cerebral abscess", "infective", ["acute","subacute"], "rare", true,
      "Fever, headache and raised inflammatory markers with a ring-enhancing lesion; look for the source"),
  ],
  // --- deep grey / cerebellum / movement ---
  cerebellum_hemisphere: [
    c("Cerebellar infarct (SCA / PICA)", "vascular", ["hyperacute","acute"], "common", true, "Acute ataxia/vertigo; watch for swelling → 4th-ventricle compression/hydrocephalus"),
    c("Cerebellar haemorrhage", "vascular", ["acute"], "uncommon", true, "Headache, vomiting, reduced consciousness — may need urgent decompression"),
    c("Metastasis / haemangioblastoma", "neoplastic", ["chronic"], "uncommon", false, "Progressive; haemangioblastoma linked to von Hippel–Lindau"),
    c("Alcohol / toxic / paraneoplastic degeneration", "degenerative", ["subacute","chronic"], "uncommon", false, "Subacute midline/truncal ataxia; check history and anti-neuronal antibodies"),
  ],
  basal_ganglia_substantia_nigra: [
    c("Parkinson's disease", "degenerative", ["chronic"], "common", false, "Asymmetric onset, rest tremor, bradykinesia, good levodopa response"),
    c("Drug-induced parkinsonism", "metabolic", ["subacute"], "common", false, "Dopamine-blocker exposure (antipsychotics, metoclopramide); usually symmetric"),
    c("Atypical parkinsonism (PSP / MSA)", "degenerative", ["chronic"], "uncommon", false, "Early falls/vertical gaze palsy (PSP) or autonomic failure (MSA); poor levodopa response"),
    c("Wilson's disease (young-onset)", "metabolic", ["subacute","chronic"], "uncommon", false, "Patient <40 with mixed parkinsonism/tremor/dystonia, ± liver disease or psychiatric change", "Kayser-Fleischer rings at the corneal limbus (slit-lamp; a wing-beating tremor is also characteristic)"),
  ],
  basal_ganglia_globus_pallidus: [ // dystonia
    c("Wilson's disease (young-onset)", "metabolic", ["subacute","chronic"], "uncommon", false, "Young patient with dystonia ± parkinsonism/tremor and liver/psychiatric features", "Kayser-Fleischer rings at the corneal limbus"),
    c("Primary / genetic dystonia (e.g. DYT1)", "degenerative", ["chronic"], "common", false, "Younger onset, may be task-specific, no other neurological signs"),
    c("Tardive dystonia (dopamine-blocker exposure)", "metabolic", ["subacute","chronic"], "common", false, "History of antipsychotic / antiemetic use"),
    c("Bilateral pallidal injury (hypoxia / kernicterus / manganese)", "metabolic", ["subacute","chronic"], "uncommon", false, "Perinatal jaundice, hypoxic insult, or chronic manganese/liver failure"),
  ],
  guillain_mollaret_triangle: [
    c("Brainstem stroke / cavernoma (with hypertrophic olivary degeneration)", "vascular", ["chronic"], "common"),
    c("Trauma / surgery", "traumatic", ["chronic"], "uncommon"),
    c("Demyelination / neurodegeneration", "inflammatory", ["chronic"], "rare"),
  ],
  // --- motor unit ---
  motor_unit_anterior_horn: [
    c("Motor neurone disease / ALS", "degenerative", ["chronic"], "common", false, "Progressive painless mixed UMN+LMN, no sensory loss; fasciculations, wasting", "tongue wasting with fasciculations plus brisk reflexes in a wasted limb (mixed UMN+LMN)"),
    c("Spinal muscular atrophy", "degenerative", ["chronic"], "common", false, "Pure LMN, hereditary; younger onset by type"),
    c("Poliomyelitis / West Nile virus", "infective", ["acute"], "rare", false, "Acute febrile asymmetric flaccid paralysis"),
    c("Kennedy's disease (SBMA)", "degenerative", ["chronic"], "rare", false, "X-linked, bulbar involvement, gynaecomastia; CAG repeat"),
  ],
  motor_unit_nmj_postsynaptic: [
    c("Myasthenia gravis (autoimmune)", "inflammatory", ["subacute","chronic"], "common", false, "Fatigable weakness, ptosis/diplopia worse through the day", "ptosis that improves after an ice-pack is held on the eye for 2 minutes (ice-pack test); Cogan's lid twitch"),
    c("Myasthenic crisis (respiratory)", "inflammatory", ["acute"], "uncommon", true, "Bulbar + respiratory weakness — monitor FVC, may need ventilation"),
    c("Lambert-Eaton myasthenic syndrome", "inflammatory", ["subacute"], "rare", false, "Small-cell lung cancer association", "power and reflexes that AUGMENT (improve) after a few seconds of sustained contraction"),
  ],
};

// ---- live categoriser for the phonebook ddx (structures the ~185 hand-authored cause lists) ----
import { BY_SITE } from "./syndromes.js";

// keyword → category, tried in priority order (first match wins). Infective/inflammatory before vascular so
// "septic thrombosis" / "granulomatous" don't fall to vascular; neoplastic last (it is the broad catch-all).
const CAT_KEYWORDS = [
  ["infective",    /zoster|herpes|\blyme\b|abscess|\bhiv\b|syphilis|tabes|polio|west nile|infect|apicitis|mucor|aspergill|fungal|meningitis|encephalitis|septic|sepsis|tubercul|\btb\b|otitis|osteomyelitis/],
  ["inflammatory", /\bms\b|multiple sclerosis|demyelinat|neuritis|inflammat|sarcoid|tolosa|autoimmune|guillain|miller-fisher|vasculit|\bnmo\b|\bmog\b|granulomatos|polyangiitis|wegener|myasthen|behcet|lupus|cidp|idiopathic \(hsv\)|bell's palsy|encephalomyeliti/],
  ["metabolic",    /b12|copper|nitrous|thiamine|wernicke|diabet|toxic|metabolic|deficiency|\bpres\b|alcohol|hepatic|uraemic|uremic|electrolyte|drug-induced|nutrition|vitamin/],
  ["degenerative", /motor neurone|mnd|\bsma\b|kennedy|parkinson|\bpsp\b|\bmsa\b|degener|hereditary|friedreich|frataxin|spinocerebellar|huntington|neurodegener|amyotroph/],
  ["congenital",   /chiari|syrinx|syringomyel|congenit|malformation|developmental|kallmann|epidermoid|dermoid|arachnoid cyst/],
  ["traumatic",    /trauma|fracture|injury|\bdisc\b|spondylo|entrapment|iatrogenic|surgery|surgical|biopsy|crutch|saturday|pressure|compression|childbirth|cycling/],
  ["vascular",     /infarct|stroke|ischaem|ischem|haemorrhag|hemorrhag|aneurysm|dissection|thrombo|fistula|vascular|occlusion|\btia\b|cavernoma|cavernous malformation|\bavm\b|vasculopath|hypertensive|embol|aion|carotid|perforator/],
  ["neoplastic",   /schwannoma|meningioma|metasta|tumou?r|glioma|carcinoma|paraganglioma|glomus|adenoma|pituitary|craniophar|pharyngioma|neoplas|lymphoma|\bmass\b|chordoma|chondrosarcoma|haemangioblastoma|perineural|infiltrat|apudoma|nasopharyng/],
];
const CAT_TEMPO = {
  vascular:["hyperacute","acute"], infective:["acute","subacute"], inflammatory:["subacute"],
  neoplastic:["chronic"], metabolic:["subacute","chronic"], degenerative:["chronic"],
  congenital:["chronic"], traumatic:["acute","subacute"],
};
const RED_RE = /dissection|giant.cell|arteritic|mucor|abscess|herniation|emergency|malignan|septic|cavernous sinus thrombo|carotid.cavernous/i;

// ---- pathognomonic "Confirm on exam" bedside signs (keyword → sign), applied to ANY cause whose name
// matches and that has no inline `pathognomonic` yet. First match wins. Kept to genuine bedside signs you
// look for on examination (NOT investigations); the borderline few name their confirming test in-line.
// Kept to genuine bedside signs; the borderline few name their confirming test in-line.
const PATHOGNOMONIC = [
  // formerly-inline curated flags, now centralised so they surface wherever the disease is named
  [/ramsay hunt|zoster oticus/i,                 "vesicles in the external auditory meatus or on the pinna"],
  [/tabes|argyll robertson|neurosyphilis/i,      "an Argyll Robertson pupil (accommodates but does not react to light)"],
  [/wilson/i,                                     "Kayser-Fleischer rings at the corneal limbus (± a wing-beating tremor)"],
  [/myasthenia|\bmg\b/i,                          "ptosis that improves after a 2-minute ice-pack on the eye (ice-pack test); Cogan's lid twitch"],
  [/lambert.eaton|\blems\b/i,                     "power and reflexes that AUGMENT after a few seconds of sustained contraction"],
  [/friedreich/i,                                 "pes cavus and scoliosis with absent ankle jerks but upgoing plantars"],
  // swept from the phonebook (2026-07-28)
  [/mucor|invasive fungal sinusitis/i,           "a black necrotic eschar on the hard palate or nasal mucosa (in a diabetic or immunocompromised patient)"],
  [/dermatomyositis/i,                            "Gottron's papules over the knuckles and a heliotrope rash on the eyelids"],
  [/leprosy/i,                                    "thickened, palpable peripheral nerves with hypopigmented, anaesthetic skin patches"],
  [/wernicke|thiamine/i,                          "the triad of ophthalmoplegia (or nystagmus), gait ataxia and confusion in an at-risk patient (alcohol, hyperemesis, bariatric surgery)"],
  [/progressive supranuclear palsy|\bpsp\b/i,     "a vertical supranuclear gaze palsy (especially down-gaze) with early backward falls; reflex (doll's-eye) eye movements are preserved"],
  [/charcot-marie-tooth|\bcmt\b/i,                "pes cavus, hammer toes and 'inverted champagne-bottle' distal-leg wasting"],
  [/kennedy|\bsbma\b/i,                           "perioral and tongue fasciculations with gynaecomastia"],
  [/olfactory.groove|subfrontal meningioma/i,     "Foster-Kennedy syndrome — ipsilateral optic atrophy with contralateral papilloedema on fundoscopy, plus anosmia"],
  [/botulism/i,                                   "symmetric descending flaccid paralysis with fixed dilated pupils and a dry mouth, no fever or sensory loss"],
  [/giant.cell|arteritic aion/i,                  "a tender, thickened, pulseless temporal artery with jaw claudication and scalp tenderness (raised ESR/CRP confirms)"],
  [/normal.pressure hydrocephalus/i,              "the triad of a magnetic/apraxic gait, urinary incontinence and cognitive decline; the gait improves after a large-volume LP (tap test)"],
  [/cluster headache/i,                           "strictly unilateral attacks with ipsilateral cranial autonomic features (lacrimation, conjunctival injection, ptosis/miosis) and marked restlessness"],
  [/numb.chin/i,                                  "isolated numbness of the chin (mental neuropathy) — a red flag for malignant infiltration"],
];
function pathognomonicFor(name) {
  const s = String(name || "");
  for (const [re, sign] of PATHOGNOMONIC) if (re.test(s)) return sign;
  return "";
}

function categorise(ddxItem, i, fallbackCat) {
  const s = ddxItem.toLowerCase();
  let cat = fallbackCat;
  for (const [id, re] of CAT_KEYWORDS) if (re.test(s)) { cat = id; break; }
  const likelihood = i === 0 ? "common" : i <= 2 ? "uncommon" : "rare";
  return { name: ddxItem, cat, tempo: CAT_TEMPO[cat] || ["subacute"], likelihood, red: RED_RE.test(s) };
}

// ---- derived category fallback (derive-don't-store spirit) ----
function derive(site) {
  const out = [];
  const terr = (site.territory || "").toLowerCase();
  const part = (site.part || "").toLowerCase();
  const vasc = /aca|mca|pca|pica|aica|\bsca\b|basilar|vertebral|perforator|lenticulostriate|spinal artery|choroidal|labyrinthine/.test(terr);
  if (vasc) out.push(c("Ischaemic or haemorrhagic stroke", "vascular", ["hyperacute","acute"], "common"));
  if (site.level === "skull_base") out.push(c("Compressive mass (schwannoma / meningioma / metastasis)", "neoplastic", ["chronic"], "common"));
  if (site.level === "nerve") {
    out.push(c("Compression / entrapment", "traumatic", ["subacute","chronic"], "common"));
    out.push(c("Diabetic / metabolic mononeuropathy", "metabolic", ["subacute"], "uncommon"));
    out.push(c("Vasculitic / inflammatory neuropathy", "inflammatory", ["subacute"], "uncommon"));
  }
  if (site.level === "root") {
    out.push(c("Disc prolapse / spondylosis / compressive mass", "neoplastic", ["subacute","chronic"], "common"));
    out.push(c("Herpes zoster (radiculitis)", "infective", ["acute"], "uncommon"));
  }
  const diffuse = site.side === "bilateral" ||
    ["motor_unit","polyneuropathy","combined_degeneration","cerebrum","thalamus_arousal","pseudobulbar"].includes(site.level);
  if (diffuse) {
    out.push(c("Metabolic / toxic / nutritional", "metabolic", ["subacute","chronic"], "common"));
    out.push(c("Degenerative / hereditary", "degenerative", ["chronic"], "uncommon"));
    out.push(c("Autoimmune / inflammatory", "inflammatory", ["subacute"], "uncommon"));
  }
  if (/optic/.test(part) || site.level === "visual_pathway") {
    out.push(c("Optic neuritis / demyelination", "inflammatory", ["subacute"], "common"));
    out.push(c("Compressive (e.g. pituitary / meningioma)", "neoplastic", ["chronic"], "uncommon"));
  }
  if (!out.length) { // generic backstop — nothing is ever empty
    out.push(c("Neoplastic / compressive", "neoplastic", ["subacute","chronic"], "uncommon"));
    out.push(c("Inflammatory / demyelinating", "inflammatory", ["subacute"], "uncommon"));
    out.push(c("Vascular", "vascular", ["acute"], "uncommon"));
  }
  return out;
}

// ---- sieve completion: region-tuned generic causes for the plausible-but-missing categories ----
export function regionOf(site) {
  const L = site.level, part = site.part || "";
  if (L === "visual_pathway" || /optic/.test(part)) return "optic";
  if (["nerve", "plexus", "root", "polyneuropathy"].includes(L)) return "peripheral";
  if (L === "skull_base") return "skull_base";
  if (L === "motor_unit") return "motor_unit";
  return "parenchyma";
}
const SIEVE_GENERICS = {
  parenchyma: [
    c("Demyelination (e.g. MS plaque)", "inflammatory", ["subacute"], "uncommon"),
    c("Tumour / metastasis", "neoplastic", ["chronic"], "uncommon"),
    c("Abscess / focal infection", "infective", ["acute", "subacute"], "rare"),
    c("Ischaemic or haemorrhagic stroke", "vascular", ["hyperacute", "acute"], "uncommon"),
  ],
  peripheral: [
    c("Compression / entrapment", "traumatic", ["subacute", "chronic"], "uncommon"),
    c("Vasculitic / inflammatory neuropathy", "inflammatory", ["subacute"], "uncommon"),
    c("Diabetic / metabolic", "metabolic", ["subacute", "chronic"], "uncommon"),
    c("Nerve-sheath tumour", "neoplastic", ["chronic"], "rare"),
  ],
  skull_base: [
    c("Compressive mass (schwannoma / meningioma / metastasis)", "neoplastic", ["chronic"], "uncommon"),
    c("Skull-base infection (osteomyelitis / fungal)", "infective", ["subacute"], "rare", true),
    c("Granulomatous / inflammatory (sarcoid / Tolosa-Hunt)", "inflammatory", ["subacute"], "rare"),
  ],
  motor_unit: [
    c("Autoimmune (myasthenia / myositis)", "inflammatory", ["subacute", "chronic"], "uncommon"),
    c("Toxic / drug-induced", "metabolic", ["subacute"], "uncommon"),
    c("Degenerative / hereditary", "degenerative", ["chronic"], "uncommon"),
  ],
  optic: [
    c("Optic neuritis / demyelination", "inflammatory", ["subacute"], "uncommon"),
    c("Compressive (pituitary / meningioma)", "neoplastic", ["chronic"], "uncommon"),
    c("Ischaemic (AION)", "vascular", ["acute"], "uncommon"),
  ],
};
export function sieveGenerics(site) { return SIEVE_GENERICS[regionOf(site)] || SIEVE_GENERICS.parenchyma; }

// ---- public API ----
// Three sources, in priority: (1) hand-curated CAUSES (best); (2) the phonebook ddx, categorised live so all
// ~185 named sites get structured causes from one source of truth; (3) attribute-derived fallback so a site
// with neither still returns plausible categories.
export function causesFor(site, { onset } = {}) {
  const key = CAUSES[site.id] ? site.id : `${site.level}_${site.part}`;
  const pbKey = BY_SITE[site.id] ? site.id : `${site.level}_${site.part}`;
  let list, source;
  if (CAUSES[key]) { list = CAUSES[key]; source = "curated"; }
  else if (BY_SITE[pbKey] && Array.isArray(BY_SITE[pbKey].ddx) && BY_SITE[pbKey].ddx.length) {
    const fallbackCat = (derive(site)[0] || {}).cat || "neoplastic";
    list = BY_SITE[pbKey].ddx.map((d, i) => categorise(d, i, fallbackCat));
    source = "phonebook";
  } else { list = derive(site); source = "derived"; }
  // enrich with pathognomonic "confirm on exam" flags — any cause whose name matches the keyword table and
  // that has no inline flag yet (covers curated, phonebook and derived from one source of truth).
  list = list.map(x => x.pathognomonic ? x : { ...x, pathognomonic: pathognomonicFor(x.name) });
  const derived = source === "derived";
  const filtered = (onset ? list.filter(x => x.tempo.includes(onset)) : list.slice())
    .sort((a, b) => LIKELIHOOD.indexOf(a.likelihood) - LIKELIHOOD.indexOf(b.likelihood));
  const byCategory = CATEGORIES
    .map(cat => ({ cat: cat.id, label: cat.label, tint: cat.tint, causes: filtered.filter(x => x.cat === cat.id) }))
    .filter(g => g.causes.length);
  // sieve completion — region generics for the plausible categories not already present, tempo-filtered.
  // presentCats uses the UNfiltered list so a tempo-hidden specific category is not re-added generically.
  const presentCats = new Set(list.map(x => x.cat));
  const compAll = sieveGenerics(site)
    .filter(g => !presentCats.has(g.cat))
    .filter(g => !onset || g.tempo.includes(onset))
    .map(x => ({ ...x, generic: true }));
  const completion = CATEGORIES
    .map(cat => ({ cat: cat.id, label: cat.label, tint: cat.tint, causes: compAll.filter(x => x.cat === cat.id) }))
    .filter(g => g.causes.length);
  return { byCategory, all: filtered, onset: onset || null, derived, source, completion };
}

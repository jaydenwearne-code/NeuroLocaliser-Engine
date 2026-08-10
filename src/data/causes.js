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
  // Listed LAST, and deliberately outside the surgical sieve: these are differentials for the
  // PRESENTATION, not lesions at this site (Todd's paresis, migraine aura, hypoglycaemia, delirium).
  // Shoehorning them into a sieve category would misteach; the sieve completion never fabricates them.
  // NB: needs its own --mimic token. --contra is aliased to the same hex as --terra in the dark theme,
  // which made the mimic dot indistinguishable from the vascular one.
  { id: "mimic",        label: "Mimic (not a lesion at this site)",          tint: "--mimic" },
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
  pons_basis_pontis: [ // ventral pontine lacune (ataxic hemiparesis / dysarthria-clumsy-hand)
    c("Small-vessel lacunar infarct", "vascular", ["hyperacute","acute"], "common", false,
      "Ataxic hemiparesis or dysarthria with a clumsy hand — ataxia out of proportion to the weakness, and no cortical signs; hypertension and diabetes"),
    c("Small pontine haemorrhage", "vascular", ["hyperacute","acute"], "uncommon", true,
      "Abrupt onset with headache and vomiting; a larger pontine bleed gives pinpoint pupils and coma, so image early"),
    c("Basilar perforator disease with progression", "vascular", ["hyperacute","acute"], "uncommon", true,
      "A deficit that stutters or worsens stepwise over hours — basilar territory disease can progress to locked-in syndrome, so monitor closely"),
    c("Demyelination", "inflammatory", ["subacute"], "rare", false,
      "Younger patient, evolving over days, with prior episodes and other lesions on MRI"),
  ],
  // --- cord ---
  cord_anterior: [ // anterior spinal artery
    c("Anterior spinal artery infarct", "vascular", ["hyperacute","acute"], "common", false, "Sudden para/tetraparesis + pain/temp loss, dorsal columns spared; aortic surgery/hypotension"),
    c("Compressive myelopathy (disc / mass / abscess)", "neoplastic", ["subacute","chronic"], "common", true, "Progressive with a sensory level; MRI shows compression — surgical emergency"),
    c("Transverse myelitis (demyelinating)", "inflammatory", ["subacute"], "uncommon", false, "Subacute, cord signal change over ≥1 segment; MS/NMO/MOG or para-infectious"),
    c("Epidural abscess", "infective", ["acute","subacute"], "uncommon", true, "Fever, focal spinal pain, raised inflammatory markers; risk factors (IVDU, diabetes)"),
  ],
  cord_transverse: [ // complete cord cross-section — compression must be excluded FIRST
    c("Compressive myelopathy (tumour, disc, abscess, haematoma)", "neoplastic", ["acute","subacute"], "common", true,
      "A sensory level with bilateral long-tract signs — this is the diagnosis to EXCLUDE FIRST, because decompression is time-critical and the window closes fast"),
    c("Transverse myelitis (MS / NMOSD / MOG / para-infectious)", "inflammatory", ["subacute"], "common", false,
      "Evolving over days with cord signal change; only label it inflammatory once whole-spine imaging has excluded compression — the two are indistinguishable at the bedside"),
    c("Spinal cord infarct (anterior spinal artery)", "vascular", ["hyperacute","acute"], "uncommon", true,
      "Maximal within minutes to hours, often with back pain, sparing the dorsal columns; think aortic surgery, dissection or profound hypotension"),
    c("Spinal epidural abscess", "infective", ["acute","subacute"], "uncommon", true,
      "Fever, focal spinal tenderness and raised inflammatory markers; risk factors are intravenous drug use, diabetes, and recent spinal instrumentation"),
    c("Traumatic cord injury", "traumatic", ["hyperacute","acute"], "uncommon", true,
      "Clear mechanism; immobilise and image before moving the patient"),
    c("Metastatic spinal cord compression", "neoplastic", ["subacute"], "common", true,
      "Progressive back pain worse at night or on lying flat, preceding the weakness, in a patient with a known primary"),
  ],
  cord_hemi: [ // Brown-Séquard
    c("Penetrating or traumatic cord injury", "traumatic", ["hyperacute","acute"], "common", true,
      "A stab or gunshot wound, or fracture-dislocation — ipsilateral weakness and dorsal-column loss with contralateral pain/temperature loss"),
    c("Compressive lesion (tumour or disc)", "neoplastic", ["subacute","chronic"], "common", true,
      "Progressive hemicord signs with local spinal pain — a surgical emergency once cord compression is confirmed"),
    c("Demyelination (MS)", "inflammatory", ["subacute"], "common", false,
      "Younger patient, evolving over days, often incomplete, with prior episodes and lesions elsewhere on MRI"),
    c("Partial cord infarct", "vascular", ["hyperacute","acute"], "rare", true,
      "Abrupt onset, maximal within minutes to hours, often with back pain at onset"),
  ],
  cord_lateral: [ // cervical cord — first-order Horner's + long tracts
    c("Syringomyelia (± Chiari)", "congenital", ["chronic"], "common", false,
      "Years of a suspended, cape-like dissociated sensory loss with a first-order Horner's; pain and temperature go while light touch is spared"),
    c("Intramedullary tumour (ependymoma / astrocytoma)", "neoplastic", ["chronic"], "uncommon", false,
      "Slowly progressive over months with cord expansion on MRI, often with central pain"),
    c("Cord infarct", "vascular", ["hyperacute","acute"], "uncommon", true,
      "Abrupt onset maximal within hours, often with back pain; consider aortic disease or hypotension"),
    c("Demyelination", "inflammatory", ["subacute"], "uncommon", false,
      "Younger patient, evolving over days, with prior episodes and lesions elsewhere"),
  ],
  cauda_equina: [ // a surgical emergency — every structural cause here is red
    c("Central lumbar disc prolapse", "traumatic", ["hyperacute","acute","subacute"], "common", true,
      "Bilateral sciatica with saddle anaesthesia and bladder dysfunction — the commonest cause, and a surgical emergency where delay costs continence permanently"),
    c("Metastatic or primary tumour", "neoplastic", ["subacute"], "common", true,
      "Progressive back pain worse at night or on lying flat, preceding the sphincter and saddle symptoms, in a patient with a known primary"),
    c("Spinal epidural abscess", "infective", ["acute","subacute"], "uncommon", true,
      "Fever, severe focal spinal pain and raised inflammatory markers; intravenous drug use, diabetes or recent spinal instrumentation"),
    c("Spinal epidural haematoma", "vascular", ["hyperacute","acute"], "uncommon", true,
      "Abrupt severe back pain with rapidly progressive deficit, on anticoagulation (warfarin or a DOAC) or after spinal anaesthesia, epidural injection or lumbar puncture"),
    c("Traumatic fracture with canal compromise", "traumatic", ["hyperacute","acute"], "uncommon", true,
      "Clear mechanism with focal spinal tenderness — immobilise and image before moving the patient"),
  ],
  conus_medullaris: [
    c("Compressive lesion at T12-L1 (disc, tumour or metastasis)", "neoplastic", ["acute","subacute"], "common", true,
      "EARLY, SYMMETRIC and severe sphincter and saddle involvement with brisk reflexes and extensor plantars (UMN signs) — cauda equina by contrast is asymmetric, painful and purely lower motor neurone, and it sits at a different imaging level"),
    c("Intramedullary tumour (ependymoma)", "neoplastic", ["chronic"], "uncommon", false,
      "Months of progressive sphincter disturbance and saddle numbness with cord expansion on MRI"),
    c("Cord infarct at the conus", "vascular", ["hyperacute","acute"], "uncommon", true,
      "Abrupt onset maximal within hours, often with back pain; consider aortic disease or hypotension"),
    c("Demyelination / transverse myelitis", "inflammatory", ["subacute"], "uncommon", false,
      "Evolving over days in a younger patient with cord signal change — but exclude compression first"),
    c("Spinal epidural abscess", "infective", ["acute","subacute"], "rare", true,
      "Fever, focal spinal pain and raised inflammatory markers with the risk factors for spinal infection"),
  ],
  craniocervical_junction_foramen_magnum: [
    c("Chiari I malformation", "congenital", ["chronic"], "common", false,
      "Years of symptoms with downbeat nystagmus, often with an associated syrinx causing a cape-like sensory loss"),
    c("Foramen-magnum meningioma", "neoplastic", ["chronic"], "uncommon", true,
      "Slowly progressive over months, classically with weakness that rotates around the limbs, plus neck pain — surgically treatable, so it must not be missed"),
    c("Spinocerebellar / cerebellar degeneration", "degenerative", ["chronic"], "uncommon", false,
      "Years of progressive ataxia with downbeat nystagmus, often with a family history"),
    c("Drug toxicity (lithium, phenytoin, carbamazepine)", "metabolic", ["subacute","chronic"], "common", false,
      "Downbeat nystagmus with ataxia in a patient on lithium or an anticonvulsant — check the drug level, as it is reversible on withdrawal"),
    c("Wernicke's encephalopathy", "metabolic", ["acute","subacute"], "uncommon", true,
      "An at-risk patient (alcohol, hyperemesis, bariatric surgery) with nystagmus, ataxia and confusion"),
    c("Craniocervical instability / basilar invagination", "congenital", ["chronic"], "rare", true,
      "Neck pain worse on movement with long-tract signs; consider rheumatoid arthritis, Down syndrome or a connective-tissue disorder"),
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
    c("Capsular warning syndrome", "vascular", ["hyperacute","acute"], "uncommon", true,
      "Stuttering, crescendo, recurrent stereotyped episodes of pure motor weakness that keep resolving — a high risk of completing into a fixed capsular infarct, so it needs admission rather than reassurance"),
    c("Hypoglycaemia", "mimic", ["hyperacute","acute"], "common", true,
      "A bedside glucose is the first test in any sudden focal deficit — it can reproduce a pure motor hemiparesis exactly and reverses on correction"),
    c("Focal seizure with Todd's paresis", "mimic", ["hyperacute","acute"], "uncommon", false,
      "A witnessed convulsion or stereotyped aura, with weakness improving over minutes to hours rather than persisting"),
  ],
  // --- Region B: deep grey / lacunar + cord emergencies ---
  subcortex_corona_radiata: [
    c("Small-vessel lacunar infarct", "vascular", ["hyperacute","acute"], "common", false,
      "Pure motor hemiparesis of face, arm and leg with NO cortical signs (no aphasia, neglect or field defect) — the absence is what localises it deep"),
    c("Hypertensive deep haemorrhage", "vascular", ["hyperacute","acute"], "uncommon", true,
      "Headache, vomiting and reduced consciousness with very high blood pressure; only the CT separates it from a lacune"),
    c("Demyelinating plaque", "inflammatory", ["subacute"], "uncommon", false,
      "Younger patient with weakness evolving over days, prior episodes, and periventricular lesions disseminated in time and space"),
    c("Small metastasis / glioma", "neoplastic", ["subacute","chronic"], "rare", false,
      "Progression over weeks with headache or seizures; an enhancing lesion with surrounding oedema"),
    c("Hypoglycaemia", "mimic", ["hyperacute","acute"], "common", true,
      "Check a bedside glucose before anything else — it reproduces a pure motor deficit and reverses completely on correction"),
  ],
  subcortex_thalamus: [ // VPL — pure sensory lacune / Déjerine-Roussy
    c("Thalamic lacunar infarct (VPL)", "vascular", ["hyperacute","acute"], "common", false,
      "Pure hemisensory loss of face, arm and leg with no weakness and no cortical signs; small-vessel risk factors"),
    c("Déjerine-Roussy (central post-stroke pain)", "vascular", ["subacute","chronic"], "common", false,
      "Weeks to months AFTER a thalamic stroke, the numb side becomes spontaneously painful and hypersensitive to light touch — it is a thalamic sign, not a functional one, and is often misattributed"),
    c("Thalamic haemorrhage", "vascular", ["hyperacute","acute"], "uncommon", true,
      "Headache and vomiting with rapidly reduced consciousness; hypertensive, and it may rupture into the ventricles causing hydrocephalus"),
    c("Demyelination", "inflammatory", ["subacute"], "uncommon", false,
      "Younger patient with sensory symptoms evolving over days and prior demyelinating episodes"),
    c("Small metastasis / glioma", "neoplastic", ["subacute","chronic"], "rare", false,
      "Progressive sensory symptoms over weeks; an enhancing thalamic lesion"),
  ],
  subcortex_anterior_choroidal: [
    c("Anterior choroidal artery infarct", "vascular", ["hyperacute","acute"], "common", false,
      "The full triad — hemiparesis, hemisensory loss AND homonymous hemianopia — from one tiny perforator; it looks like a huge cortical stroke, but the ABSENCE of aphasia or neglect points deep"),
    c("Deep hypertensive haemorrhage", "vascular", ["hyperacute","acute"], "uncommon", true,
      "Headache, vomiting and reduced consciousness with very high blood pressure; the CT distinguishes it"),
    c("Tumour / metastasis", "neoplastic", ["subacute","chronic"], "rare", false,
      "Progression over weeks rather than seconds; an enhancing deep lesion with oedema"),
  ],
  subcortex_sensorimotor: [ // thalamocapsular lacune
    c("Thalamocapsular lacunar infarct", "vascular", ["hyperacute","acute"], "common", false,
      "Combined weakness AND sensory loss of face, arm and leg with no cortical signs — one small lesion straddling the capsule and thalamus"),
    c("Deep hypertensive haemorrhage", "vascular", ["hyperacute","acute"], "uncommon", true,
      "Headache, vomiting, reduced consciousness and very high blood pressure — image before assuming a lacune"),
    c("Demyelination", "inflammatory", ["subacute"], "rare", false,
      "Younger patient, evolving over days, with prior episodes and other lesions on MRI"),
  ],
  subcortex_optic_radiation: [
    c("MCA or PCA branch infarct of the optic radiation", "vascular", ["hyperacute","acute"], "common", false,
      "An isolated homonymous field defect; Meyer's loop in the temporal lobe gives a SUPERIOR quadrantanopia ('pie in the sky'), the parietal fibres an inferior one"),
    c("Tumour (glioma / metastasis)", "neoplastic", ["subacute","chronic"], "uncommon", false,
      "Field loss progressing over weeks, often with seizures; an enhancing deep white-matter mass"),
    c("Post-surgical injury (anterior temporal lobectomy)", "traumatic", ["acute"], "uncommon", false,
      "A superior quadrantanopia appearing after epilepsy surgery — Meyer's loop sweeps forward into the temporal lobe and is in the resection path"),
    c("Demyelination", "inflammatory", ["subacute"], "uncommon", false,
      "Younger patient with a field defect evolving over days and prior demyelinating episodes"),
    c("Deep haemorrhage", "vascular", ["hyperacute","acute"], "rare", true,
      "Headache and vomiting with the field loss; the CT distinguishes it from infarct"),
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
    c("Hypoglycaemia", "mimic", ["hyperacute","acute"], "common", true,
      "A bedside glucose is the first test in any sudden focal deficit — hypoglycaemia can reproduce a dense hemiparesis with aphasia, and it reverses completely on correction"),
    c("Focal seizure with Todd's paresis", "mimic", ["hyperacute","acute"], "uncommon", false,
      "A witnessed convulsion or a stereotyped preceding aura, with weakness that improves over minutes to hours rather than persisting"),
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
    c("Focal motor seizure with Todd's paresis", "mimic", ["hyperacute","acute"], "uncommon", false,
      "A witnessed focal motor seizure or preceding aura, with weakness improving over minutes to hours; during the seizure itself the eyes deviate AWAY from the affected hemisphere — the opposite of the gaze deviation of an infarct"),
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
    c("Delirium", "mimic", ["acute","subacute"], "common", false,
      "Fluctuating attention with a systemic trigger (infection, drugs, metabolic upset) — alertness waxes and wanes, whereas Wernicke's aphasia selectively destroys comprehension and naming in a fully alert patient"),
    c("Focal temporal seizure with postictal aphasia", "mimic", ["hyperacute","acute"], "uncommon", false,
      "Language failure that fluctuates and improves over minutes to hours, often after a witnessed seizure or with automatisms"),
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
    c("Migraine with visual aura", "mimic", ["hyperacute","acute"], "common", false,
      "A POSITIVE, moving, scintillating scotoma that builds over 20–30 minutes and then resolves, often followed by headache — an infarct gives NEGATIVE, static field loss that is maximal instantly"),
    c("Occipital seizure", "mimic", ["hyperacute","acute"], "rare", false,
      "Brief, stereotyped, repeated episodes of coloured circular visual hallucinations with abrupt onset and offset, sometimes with eye deviation"),
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
    c("Migraine with visual aura", "mimic", ["hyperacute","acute"], "common", false,
      "A POSITIVE, moving, scintillating scotoma building over 20–30 minutes then resolving, often followed by headache — an infarct gives NEGATIVE, static field loss, maximal instantly"),
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
    c("Focal motor seizure with Todd's paresis", "mimic", ["hyperacute","acute"], "uncommon", false,
      "Weakness following a witnessed focal motor seizure or a Jacksonian march, improving over minutes to hours rather than persisting"),
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
    c("Focal sensory seizure (Jacksonian march)", "mimic", ["hyperacute","acute"], "uncommon", false,
      "POSITIVE tingling that marches over seconds to minutes from hand to face and then stops — a lesion gives NEGATIVE, static numbness"),
    c("Migraine sensory aura", "mimic", ["hyperacute","acute"], "uncommon", false,
      "Tingling spreading over 20–30 minutes, often following a visual aura and then a headache; it resolves completely"),
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
    c("Delirium", "mimic", ["acute","subacute"], "common", false,
      "Fluctuating attention with a systemic trigger; formal testing shows GLOBAL inattention rather than a neglect confined to one side of space"),
    c("Focal seizure", "mimic", ["hyperacute","acute"], "uncommon", false,
      "Brief, stereotyped, repeated episodes with abrupt onset and offset, rather than a fixed deficit that persists between events"),
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
  // mimic first: this language is unambiguous and nothing else claims it. Kept deliberately TIGHT (no bare
  // /seizure/, which would swallow genuine epileptogenic lesions like cortical dysplasia).
  ["mimic",        /\btodd\b|todd's|focal seizure|seizure aura|migrain|hypoglyc|post.?ictal|transient global amnesia|conversion disorder|functional neurological/],
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
  congenital:["chronic"], traumatic:["acute","subacute"], mimic:["hyperacute","acute"],
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
  // Region B (2026-08-10)
  [/chiari/i,                                     "a headache brought on by coughing, straining or laughing, with downbeat nystagmus worst on lateral gaze"],
  [/thalamic ha?emorrhage/i,                      "forced DOWNWARD gaze with small, poorly reactive pupils — the eyes appear to peer at the tip of the nose"],
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

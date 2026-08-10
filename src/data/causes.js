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
  // --- Region C: remaining brainstem + cerebellum (2026-08-10) ---
  midbrain_lateral: [ // Claude's / Benedikt's — CN III with contralateral cerebellar or rubral signs
    c("Posterior cerebral / basilar perforator infarct", "vascular", ["hyperacute","acute"], "common", true,
      "An ipsilateral third-nerve palsy with contralateral ataxia (Claude's) or contralateral tremor and chorea (Benedikt's, with red-nucleus involvement) — a crossed sign that pins it to the midbrain"),
    c("Midbrain haemorrhage", "vascular", ["hyperacute","acute"], "uncommon", true,
      "Abrupt onset with headache and reduced consciousness; a small bleed here has a large effect, so image early"),
    c("Demyelination", "inflammatory", ["subacute"], "uncommon", false,
      "Younger patient evolving over days, with prior episodes and lesions disseminated in time and space"),
    c("Tumour / metastasis", "neoplastic", ["subacute","chronic"], "rare", false,
      "Progression over weeks with headache; an enhancing brainstem lesion on MRI"),
  ],
  midbrain_trochlear: [ // CN IV nucleus — the only cranial nerve nucleus whose fibres fully decussate
    c("Small brainstem infarct", "vascular", ["hyperacute","acute"], "uncommon", false,
      "Vertical diplopia that is worse on looking down (reading, stairs), with a compensatory head tilt AWAY from the lesion — the nucleus decussates, so a nuclear lesion gives a CONTRALATERAL superior oblique palsy"),
    c("Demyelination", "inflammatory", ["subacute"], "common", false,
      "A younger patient with vertical diplopia evolving over days and prior demyelinating episodes"),
    c("Tumour (pineal or tectal)", "neoplastic", ["subacute","chronic"], "uncommon", true,
      "Progressive vertical diplopia with upgaze failure or headache — a dorsal midbrain mass, often with hydrocephalus"),
    c("Head trauma", "traumatic", ["hyperacute","acute"], "common", false,
      "Vertical diplopia after a head injury; the trochlear nerve's long dorsal course makes it the most vulnerable to trauma"),
  ],
  midbrain_hemi: [
    c("Top-of-the-basilar occlusion", "vascular", ["hyperacute","acute"], "common", true,
      "Reduced consciousness with vertical gaze failure and pupillary abnormalities; a large-vessel emergency needing immediate vessel imaging"),
    c("Midbrain haemorrhage", "vascular", ["hyperacute","acute"], "uncommon", true,
      "Abrupt onset with headache, vomiting and rapidly reduced consciousness"),
    c("Tumour / metastasis", "neoplastic", ["subacute","chronic"], "uncommon", false,
      "Progression over weeks with headache and gait disturbance; an enhancing brainstem mass"),
    c("Demyelination", "inflammatory", ["subacute"], "rare", false,
      "Younger patient evolving over days with prior episodes"),
  ],
  dorsal_midbrain_tectum: [ // Parinaud / dorsal midbrain syndrome
    c("Pineal region tumour (germinoma)", "neoplastic", ["subacute","chronic"], "common", true,
      "Upgaze palsy with headache in a young patient, classically a teenage boy — it obstructs the aqueduct and causes hydrocephalus",
      "convergence-retraction nystagmus on attempted UPGAZE (ask the patient to follow a downward-rolling optokinetic drum) with light-near dissociation of the pupils"),
    c("Obstructive hydrocephalus / shunt failure", "congenital", ["hyperacute","acute","subacute"], "common", true,
      "Headache, vomiting and drowsiness with upgaze failure — in a shunted patient, assume shunt failure until proven otherwise; the 'setting-sun' sign in infants"),
    c("Dorsal midbrain infarct", "vascular", ["hyperacute","acute"], "uncommon", true,
      "Abrupt onset of vertical gaze failure, often with other top-of-basilar features"),
    c("Demyelination", "inflammatory", ["subacute"], "uncommon", false,
      "Younger patient evolving over days with prior demyelinating episodes"),
    c("Midbrain haemorrhage", "vascular", ["hyperacute","acute"], "rare", true,
      "Abrupt onset with headache and reduced consciousness"),
  ],
  pupil_pretectum: [
    c("Dorsal midbrain (pretectal) lesion", "neoplastic", ["subacute","chronic"], "common", true,
      "Light-near dissociation: the pupils react poorly to light but constrict normally on convergence — with upgaze palsy this is Parinaud's syndrome, and a pineal mass or hydrocephalus must be excluded"),
    c("Neurosyphilis (tabes dorsalis)", "infective", ["chronic"], "rare", false,
      "Small irregular pupils with light-near dissociation, in a patient with other tertiary features"),
    c("Diabetic autonomic neuropathy", "metabolic", ["chronic"], "uncommon", false,
      "Long-standing diabetes with other autonomic features; light-near dissociation without a structural midbrain lesion"),
  ],
  pons_lateral: [ // Marie-Foix — AICA territory
    c("AICA territory infarct", "vascular", ["hyperacute","acute"], "common", true,
      "Vertigo, ipsilateral facial weakness and ataxia WITH IPSILATERAL DEAFNESS — the labyrinthine artery arises from AICA, so hearing loss is what separates AICA from PICA/Wallenberg, where hearing is spared"),
    c("Pontine haemorrhage", "vascular", ["hyperacute","acute"], "uncommon", true,
      "Abrupt onset with headache and reduced consciousness; image before assuming infarct"),
    c("Cerebellopontine angle tumour (vestibular schwannoma, meningioma)", "neoplastic", ["chronic"], "uncommon", false,
      "Months to years of progressive unilateral hearing loss with tinnitus, then facial numbness and ataxia as it enlarges"),
    c("Demyelination", "inflammatory", ["subacute"], "uncommon", false,
      "Younger patient evolving over days with prior episodes and lesions elsewhere on MRI"),
  ],
  pons_lateral_trigeminal: [
    c("AICA territory infarct involving the trigeminal complex", "vascular", ["hyperacute","acute"], "common", true,
      "The lateral pontine picture plus ipsilateral facial sensory loss; ipsilateral deafness points to AICA rather than PICA"),
    c("Cerebellopontine angle tumour", "neoplastic", ["chronic"], "uncommon", false,
      "Progressive hearing loss and facial numbness over months to years, with an absent corneal reflex often the earliest sign"),
    c("Demyelination", "inflammatory", ["subacute"], "uncommon", false,
      "Younger patient with facial numbness evolving over days and prior demyelinating episodes"),
    c("Pontine haemorrhage", "vascular", ["hyperacute","acute"], "rare", true,
      "Abrupt onset with headache and reduced consciousness"),
  ],
  pons_trigeminal: [ // main sensory + motor V nuclei
    c("Demyelination (multiple sclerosis)", "inflammatory", ["subacute"], "common", false,
      "Facial numbness or trigeminal neuralgia in a YOUNG patient, or bilateral neuralgia, should raise MS — a pontine plaque at the root entry zone"),
    c("Pontine infarct", "vascular", ["hyperacute","acute"], "uncommon", false,
      "Abrupt onset of facial sensory loss with other crossed brainstem signs"),
    c("Cerebellopontine angle tumour", "neoplastic", ["chronic"], "uncommon", false,
      "Progressive facial numbness with hearing loss over months; an absent corneal reflex is often the earliest sign"),
    c("Syringobulbia", "congenital", ["chronic"], "rare", false,
      "Years of progressive dissociated facial sensory loss in an onion-skin distribution, often with a cervical syrinx"),
  ],
  pons_hemi: [
    c("Basilar artery occlusion", "vascular", ["hyperacute","acute"], "common", true,
      "Reduced consciousness with bilateral or crossed brainstem signs — a time-critical large-vessel emergency that may progress to locked-in syndrome"),
    c("Hypertensive pontine haemorrhage", "vascular", ["hyperacute","acute"], "uncommon", true,
      "Abrupt coma with PINPOINT but reactive pupils, hyperthermia and extensor posturing; very high blood pressure"),
    c("Central pontine myelinolysis (osmotic demyelination)", "metabolic", ["acute","subacute"], "uncommon", true,
      "A biphasic course — the patient improves as hyponatraemia is corrected, then deteriorates days later with quadriparesis and bulbar failure, after the SODIUM WAS CORRECTED TOO RAPIDLY; alcohol, malnutrition and liver disease are risk factors"),
    c("Demyelination", "inflammatory", ["subacute"], "rare", false,
      "Younger patient evolving over days with prior episodes"),
    c("Pontine glioma", "neoplastic", ["subacute","chronic"], "rare", false,
      "Progressive crossed brainstem signs over weeks to months; a diffusely expanded pons on MRI"),
  ],
  medulla_hemi: [ // Reinhold / Babinski-Nageotte
    c("Vertebral artery occlusion or dissection", "vascular", ["hyperacute","acute"], "common", true,
      "The lateral and medial medullary syndromes together — Wallenberg's features plus contralateral hemiparesis and tongue weakness; neck pain suggests dissection, so image the vessels"),
    c("Medullary haemorrhage", "vascular", ["hyperacute","acute"], "rare", true,
      "Abrupt onset with headache and rapidly reduced consciousness; respiratory compromise is the danger"),
    c("Demyelination", "inflammatory", ["subacute"], "rare", false,
      "Younger patient evolving over days with prior demyelinating episodes"),
    c("Tumour / metastasis", "neoplastic", ["subacute","chronic"], "rare", false,
      "Progression over weeks with lower cranial-nerve signs and an enhancing lesion"),
  ],
  pontomesencephalic_tegmentum: [ // upbeat nystagmus
    c("Wernicke's encephalopathy", "metabolic", ["acute","subacute"], "common", true,
      "Upbeat nystagmus with ataxia and confusion in an at-risk patient (alcohol, hyperemesis, bariatric surgery, malnutrition) — give thiamine IMMEDIATELY and empirically, because the window to prevent permanent Korsakoff amnesia is short",
      "the triad of ophthalmoplegia, ataxia and confusion — though all three are present in a minority, so treat on suspicion"),
    c("Brainstem infarct", "vascular", ["hyperacute","acute"], "uncommon", true,
      "Abrupt onset of upbeat nystagmus with other posterior-circulation signs"),
    c("Demyelination", "inflammatory", ["subacute"], "uncommon", false,
      "Younger patient evolving over days with prior episodes"),
    c("Drug toxicity (anticonvulsants, lithium)", "metabolic", ["subacute","chronic"], "common", false,
      "Nystagmus with ataxia in a patient on phenytoin, carbamazepine or lithium — check levels, as it is reversible"),
    c("Paraneoplastic or posterior-fossa tumour", "neoplastic", ["subacute","chronic"], "rare", false,
      "Subacute progressive brainstem-cerebellar signs; look for an underlying malignancy"),
  ],
  brainstem_aras_paramedian_tegmentum: [
    c("Top-of-the-basilar / brainstem infarct", "vascular", ["hyperacute","acute"], "common", true,
      "Sudden reduced consciousness with pupillary and eye-movement abnormalities but preserved limb reflexes — a small paramedian tegmental lesion abolishes arousal"),
    c("Brainstem haemorrhage", "vascular", ["hyperacute","acute"], "uncommon", true,
      "Abrupt coma with pinpoint pupils and extensor posturing; very high blood pressure"),
    c("Mass effect with transtentorial herniation", "neoplastic", ["acute","subacute"], "common", true,
      "Progressive drowsiness with a dilating pupil and a falling conscious level — the brainstem is being compressed from above, so this is a neurosurgical emergency"),
    c("Diffuse axonal injury", "traumatic", ["hyperacute","acute"], "uncommon", true,
      "Persistent coma after significant head trauma with imaging that looks milder than the clinical state"),
    c("Metabolic or drug-induced coma", "metabolic", ["hyperacute","acute"], "common", false,
      "Reduced consciousness with PRESERVED and symmetric brainstem reflexes and no focal signs — check glucose, sodium, ammonia, toxicology and CO2 before assuming a structural cause"),
  ],
  locked_in_ventral_pons: [
    c("Basilar artery occlusion", "vascular", ["hyperacute","acute"], "common", true,
      "The patient is fully AWAKE and aware but can move only the eyes — establish vertical eye movement and blinking as communication immediately, and never mistake this for coma or a vegetative state; it is a thrombectomy-eligible emergency",
      "preserved vertical eye movements and blinking to command in a patient who appears unresponsive — always ask them to look up and blink twice"),
    c("Pontine haemorrhage", "vascular", ["hyperacute","acute"], "uncommon", true,
      "Abrupt onset with pinpoint reactive pupils and extensor posturing; very high blood pressure"),
    c("Central pontine myelinolysis (osmotic demyelination)", "metabolic", ["acute","subacute"], "uncommon", true,
      "A biphasic course after rapid correction of hyponatraemia, with quadriparesis and bulbar failure evolving over days"),
    c("Pontine trauma or tumour", "traumatic", ["hyperacute","acute","subacute"], "rare", false,
      "A clear mechanism, or progressive bilateral pontine signs from an expanding mass"),
  ],
  thalamus_arousal_paramedian: [ // artery of Percheron
    c("Artery of Percheron infarct", "vascular", ["hyperacute","acute"], "common", true,
      "Sudden coma or hypersomnolence with vertical gaze palsy and dense amnesia — a single perforator supplies BOTH paramedian thalami, so one small occlusion gives bilateral infarcts; the early CT is often normal"),
    c("Deep cerebral venous thrombosis (internal cerebral veins / straight sinus / vein of Galen)", "vascular", ["acute","subacute"], "uncommon", true,
      "BILATERAL thalamic change should always prompt venous imaging — headache, a prothrombotic state or pregnancy, with oedema that does not respect an arterial territory; it is treatable with anticoagulation, so it must not be missed"),
    c("Bilateral thalamic glioma", "neoplastic", ["subacute","chronic"], "rare", false,
      "Progressive drowsiness and cognitive decline over weeks to months with bilateral thalamic expansion"),
    c("Wernicke's encephalopathy", "metabolic", ["acute","subacute"], "uncommon", true,
      "Confusion with ophthalmoplegia and ataxia in an at-risk patient; medial thalamic and mammillary change on MRI — give thiamine empirically"),
  ],
  pseudobulbar_corticobulbar: [
    c("Bilateral vascular disease (multi-infarct / lacunar state)", "vascular", ["subacute","chronic"], "common", false,
      "Stepwise accumulation of deficits with a brisk jaw jerk, a small spastic tongue and emotional lability — in pseudobulbar (UMN) palsy the tongue is spastic and the jaw jerk brisk, whereas in bulbar (LMN) palsy the tongue is WASTED and FASCICULATING and the jaw jerk absent"),
    c("Motor neurone disease (ALS)", "degenerative", ["subacute","chronic"], "common", true,
      "Progressive dysarthria and dysphagia with MIXED upper and lower motor neurone signs in the same territory — a brisk jaw jerk alongside a wasted fasciculating tongue is the combination that makes the diagnosis"),
    c("Multiple sclerosis", "inflammatory", ["subacute","chronic"], "uncommon", false,
      "Younger patient with relapsing episodes and lesions disseminated in time and space"),
    c("Progressive supranuclear palsy", "degenerative", ["chronic"], "uncommon", false,
      "Years of falls (backwards, early), vertical gaze palsy and axial rigidity with pseudobulbar features"),
    c("Bilateral traumatic or hypoxic injury", "traumatic", ["acute","subacute"], "rare", false,
      "Bulbar failure following severe head injury or a hypoxic-ischaemic insult"),
  ],
  cerebellum_vermis: [
    c("Alcohol-related cerebellar degeneration", "metabolic", ["chronic"], "common", false,
      "Years of heavy alcohol use with a wide-based unsteady GAIT and truncal ataxia, while the arms are relatively spared — the anterior vermis bears the brunt"),
    c("Medulloblastoma", "neoplastic", ["subacute","chronic"], "common", true,
      "A CHILD with truncal ataxia, morning headache and vomiting — a midline posterior-fossa mass obstructing the fourth ventricle, causing hydrocephalus"),
    c("Cerebellar infarct or haemorrhage", "vascular", ["hyperacute","acute"], "common", true,
      "Abrupt truncal ataxia with headache and vomiting; posterior-fossa SWELLING can obstruct the fourth ventricle and cause fatal herniation, so conscious level must be watched closely"),
    c("Paraneoplastic cerebellar degeneration", "neoplastic", ["subacute"], "rare", false,
      "Subacute ataxia over weeks with anti-Yo or anti-Hu antibodies; look for an underlying breast, ovarian or lung malignancy"),
  ],
  cerebellum_flocculonodular: [
    c("Medulloblastoma", "neoplastic", ["subacute","chronic"], "common", true,
      "A child with unsteadiness, nystagmus and headache from a midline posterior-fossa mass with hydrocephalus"),
    c("Cerebellar infarct (PICA)", "vascular", ["hyperacute","acute"], "common", true,
      "Abrupt vertigo with nystagmus and gait unsteadiness; posterior-fossa swelling can compress the fourth ventricle, so monitor conscious level"),
    c("Demyelination", "inflammatory", ["subacute"], "uncommon", false,
      "Younger patient with nystagmus and unsteadiness evolving over days and prior episodes"),
    c("Drug toxicity (anticonvulsants, alcohol)", "metabolic", ["acute","subacute","chronic"], "common", false,
      "Nystagmus and unsteadiness with phenytoin, carbamazepine or alcohol — reversible, so check levels"),
  ],
  cerebellum_pancerebellar: [
    c("Alcohol-related cerebellar degeneration", "metabolic", ["chronic"], "common", false,
      "Years of heavy alcohol use with gait-predominant ataxia; often with nutritional deficiency, so treat thiamine alongside"),
    c("Anticonvulsant / drug toxicity (phenytoin, lithium, carbamazepine)", "metabolic", ["acute","subacute","chronic"], "common", false,
      "Ataxia with nystagmus and dysarthria in a patient on these drugs — check levels, since it is reversible on withdrawal, though chronic phenytoin can cause permanent loss"),
    c("Paraneoplastic cerebellar degeneration", "neoplastic", ["subacute"], "uncommon", true,
      "Rapidly progressive pancerebellar ataxia over weeks in a smoker or a patient with breast/ovarian/lung malignancy; anti-Yo, anti-Hu or anti-Tr antibodies — it may precede the cancer diagnosis"),
    c("Spinocerebellar ataxia (hereditary)", "degenerative", ["chronic"], "uncommon", false,
      "Years of slowly progressive ataxia with a family history; genetic testing confirms the subtype"),
    c("Multiple system atrophy (MSA-C)", "degenerative", ["chronic"], "uncommon", false,
      "Progressive ataxia with early and prominent autonomic failure — postural hypotension, bladder dysfunction and erectile failure"),
    c("Hypothyroidism, coeliac disease or vitamin E deficiency", "metabolic", ["chronic"], "rare", false,
      "Slowly progressive ataxia with a treatable systemic cause — worth screening, because correction can halt or reverse it"),
    c("Wilson's disease", "degenerative", ["subacute","chronic"], "rare", true,
      "A young patient with ataxia, tremor and dysarthria, often with psychiatric or hepatic features — treatable, so never miss it in the under-50s"),
  ],
  guillain_mollaret_rubral: [
    c("Brainstem haemorrhage or cavernoma", "vascular", ["acute","subacute","chronic"], "common", true,
      "Palatal tremor appearing MONTHS AFTER the original brainstem insult — the delay is the clue, as hypertrophic olivary degeneration takes weeks to months to develop"),
    c("Brainstem infarct", "vascular", ["acute","subacute"], "uncommon", false,
      "A prior brainstem stroke, with the rhythmic palatal movement emerging weeks to months later"),
    c("Demyelination", "inflammatory", ["subacute"], "rare", false,
      "Younger patient with prior demyelinating episodes and a lesion within the triangle"),
    c("Brainstem tumour or trauma", "neoplastic", ["subacute","chronic"], "rare", false,
      "A structural lesion interrupting the dentato-rubro-olivary pathway, with the tremor appearing after a delay"),
  ],
  guillain_mollaret_dentate: [
    c("Brainstem or cerebellar haemorrhage / cavernoma", "vascular", ["acute","subacute","chronic"], "common", true,
      "Palatal tremor developing MONTHS AFTER the original insult, from hypertrophic olivary degeneration — the characteristic delay separates it from an acute lesion"),
    c("Cerebellar or brainstem infarct", "vascular", ["acute","subacute"], "uncommon", false,
      "A prior stroke within the triangle, with rhythmic palatal movement emerging weeks to months later"),
    c("Demyelination", "inflammatory", ["subacute"], "rare", false,
      "Younger patient with prior episodes and a lesion interrupting the pathway"),
    c("Tumour or surgical injury", "neoplastic", ["subacute","chronic"], "rare", false,
      "A mass or a posterior-fossa operation interrupting the dentato-rubro-olivary pathway, with delayed onset"),
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
  // --- Region D: visual pathway, olfactory, pupil + ocular motor course (2026-08-10) ---
  visual_pathway_chiasm: [
    c("Pituitary macroadenoma", "neoplastic", ["chronic"], "common", false,
      "A bitemporal hemianopia that starts in the UPPER outer quadrants (the crossing inferonasal fibres are compressed first) and creeps on painlessly over months, often with endocrine features — amenorrhoea, galactorrhoea, acromegaly or hypopituitarism"),
    c("Pituitary apoplexy", "vascular", ["hyperacute","acute"], "uncommon", true,
      "SUDDEN severe headache with visual loss, ophthalmoplegia and collapse — haemorrhage into an adenoma; it causes acute adrenal insufficiency, so give steroids and do not wait for imaging to treat the endocrine emergency"),
    c("Craniopharyngioma", "congenital", ["chronic"], "uncommon", false,
      "A child or young adult with visual field loss, growth failure and diabetes insipidus; a calcified suprasellar cystic mass"),
    c("Meningioma (tuberculum sellae)", "neoplastic", ["chronic"], "uncommon", false,
      "Years of slowly progressive asymmetric visual loss with optic atrophy, typically in a middle-aged woman"),
    c("Internal carotid aneurysm", "vascular", ["chronic","acute"], "rare", true,
      "Field loss with pain or a third-nerve palsy; a parasellar aneurysm needs vascular imaging before any biopsy"),
    c("Demyelination (chiasmal neuritis)", "inflammatory", ["subacute"], "rare", false,
      "Younger patient with painful visual loss evolving over days and other demyelinating lesions"),
  ],
  visual_pathway_optic_tract: [
    c("Middle or posterior cerebral artery infarct", "vascular", ["hyperacute","acute"], "common", false,
      "Abrupt INCONGRUOUS homonymous hemianopia — the more anterior the lesion, the less the two eyes' defects match; a relative afferent pupillary defect may be present in the contralateral eye"),
    c("Tumour (glioma, metastasis, craniopharyngioma)", "neoplastic", ["subacute","chronic"], "uncommon", false,
      "Field loss progressing over weeks to months, often with endocrine or hypothalamic features given the proximity to the sella"),
    c("Demyelination", "inflammatory", ["subacute"], "uncommon", false,
      "Younger patient with a field defect evolving over days and prior demyelinating episodes"),
    c("Aneurysm or deep haemorrhage", "vascular", ["hyperacute","acute"], "rare", true,
      "Abrupt onset with headache; image urgently"),
  ],
  visual_pathway_lgn: [
    c("Anterior or posterior choroidal artery infarct", "vascular", ["hyperacute","acute"], "common", false,
      "An abrupt, often wedge-shaped or sectoranopic homonymous field defect — the lateral geniculate has a dual blood supply, which produces these unusual congruous sectoral patterns"),
    c("Tumour / metastasis", "neoplastic", ["subacute","chronic"], "rare", false,
      "Progressive field loss over weeks with an enhancing thalamic-region lesion"),
    c("Demyelination", "inflammatory", ["subacute"], "rare", false,
      "Younger patient evolving over days with prior episodes"),
  ],
  skull_base_optic_canal: [
    c("Traumatic optic neuropathy", "traumatic", ["hyperacute","acute"], "common", true,
      "Visual loss immediately after blunt head or orbital trauma, often a blow to the brow, with a relative afferent pupillary defect and an initially normal-looking disc — the nerve is injured within the bony canal"),
    c("Optic nerve sheath meningioma", "neoplastic", ["chronic"], "uncommon", false,
      "Slowly progressive painless visual loss over years with proptosis, optic atrophy and optociliary shunt vessels on the disc"),
    c("Fibrous dysplasia or bony overgrowth", "congenital", ["chronic"], "rare", false,
      "Gradual visual loss from bony narrowing of the canal, often with facial asymmetry"),
    c("Optic nerve glioma", "neoplastic", ["chronic"], "rare", false,
      "A child with progressive visual loss and proptosis; strongly associated with neurofibromatosis type 1"),
  ],
  olfactory_olfactory_groove: [
    c("Olfactory groove meningioma", "neoplastic", ["chronic"], "common", false,
      "Years of unnoticed anosmia with personality change and later visual loss — the FOSTER KENNEDY syndrome is ipsilateral optic atrophy (from direct compression) with contralateral papilloedema (from raised pressure)"),
    c("Post-viral anosmia", "infective", ["acute","subacute"], "common", false,
      "Smell loss following an upper respiratory infection, including COVID-19; usually improves over weeks to months, and there are no other neurological signs"),
    c("Head trauma (cribriform plate shearing)", "traumatic", ["hyperacute","acute"], "common", false,
      "Anosmia immediately after a head injury, especially an occipital blow; ask about CSF rhinorrhoea, which risks meningitis"),
    c("Neurodegenerative disease (Parkinson's, Alzheimer's)", "degenerative", ["chronic"], "common", false,
      "Anosmia can PRECEDE the motor or cognitive features by years, so it is an early marker rather than an incidental finding"),
    c("Chronic rhinosinusitis / nasal polyps", "inflammatory", ["chronic"], "common", false,
      "Nasal obstruction with smell loss that fluctuates — a conductive cause, and the commonest overall; examine the nose before blaming the brain"),
  ],
  pupil_cn3_compressive: [
    c("Posterior communicating artery aneurysm", "vascular", ["hyperacute","acute"], "common", true,
      "A PUPIL-INVOLVING third-nerve palsy is a posterior communicating artery aneurysm UNTIL PROVEN OTHERWISE — the parasympathetic fibres run on the outside of the nerve, so compression hits the pupil first; painful onset demands emergency angiography before it ruptures",
      "a dilated, poorly reactive pupil with ptosis and a 'down-and-out' eye — check the pupil in EVERY third-nerve palsy"),
    c("Uncal herniation", "neoplastic", ["hyperacute","acute"], "uncommon", true,
      "A dilating pupil with a falling conscious level — the temporal lobe is compressing the nerve against the tentorium; a neurosurgical emergency"),
    c("Tumour or meningeal disease at the skull base", "neoplastic", ["subacute","chronic"], "uncommon", false,
      "Progressive third-nerve palsy over weeks, often with other cranial nerves involved"),
    c("Cavernous sinus lesion", "vascular", ["subacute"], "uncommon", false,
      "Third-nerve palsy with other ocular motor nerves and V1 sensory loss — the combination localises to the cavernous sinus"),
  ],
  pupil_cn3_ischaemic: [
    c("Microvascular (diabetic / hypertensive) third-nerve palsy", "vascular", ["hyperacute","acute"], "common", false,
      "A PUPIL-SPARING third-nerve palsy in an older patient with diabetes or hypertension — the microvascular infarct hits the central fibres and spares the peripheral parasympathetics; often painful, and it should recover within about three months"),
    c("Giant cell arteritis", "inflammatory", ["acute","subacute"], "uncommon", true,
      "Ophthalmoplegia with headache, jaw claudication and scalp tenderness in a patient over 50 — check ESR/CRP and treat immediately to protect the other eye"),
    c("Demyelination", "inflammatory", ["subacute"], "rare", false,
      "A younger patient with painless ophthalmoplegia evolving over days and prior demyelinating episodes"),
    c("Partially or late-presenting compressive lesion", "neoplastic", ["subacute"], "uncommon", true,
      "Pupil sparing is reassuring but NOT absolute — if the palsy fails to recover by three months, progresses, or involves other nerves, image for a compressive cause"),
  ],
  pupil_ciliary_ganglion: [
    c("Holmes-Adie (tonic) pupil", "degenerative", ["subacute","chronic"], "common", false,
      "A young woman noticing a large pupil with blurred near vision; the pupil is poorly reactive to light but constricts slowly and tonically on sustained near effort, with slow redilation, and the ankle jerks may be absent",
      "constriction of the affected pupil to DILUTE (0.1%) pilocarpine — denervation supersensitivity, where a normal pupil will not respond"),
    c("Orbital trauma or surgery", "traumatic", ["acute","subacute"], "uncommon", false,
      "A tonic pupil after orbital injury, retinal surgery or photocoagulation damaging the short ciliary nerves"),
    c("Varicella zoster or viral ganglionitis", "infective", ["acute","subacute"], "rare", false,
      "A tonic pupil following herpes zoster ophthalmicus or another viral illness"),
    c("Autonomic neuropathy (diabetes, amyloid, Sjogren's)", "metabolic", ["chronic"], "uncommon", false,
      "A tonic pupil as part of a wider autonomic neuropathy with postural hypotension and sudomotor failure"),
  ],
  skull_base_iii_orbit_sup: [
    c("Orbital trauma or fracture", "traumatic", ["hyperacute","acute"], "common", false,
      "Ptosis with failure of elevation after orbital injury — the superior division supplies only levator and superior rectus, so the pupil and adduction are spared"),
    c("Orbital inflammatory disease / cellulitis", "inflammatory", ["acute","subacute"], "uncommon", true,
      "Painful proptosis with lid swelling and restricted elevation; fever and systemic upset suggest cellulitis needing urgent antibiotics"),
    c("Orbital tumour or metastasis", "neoplastic", ["subacute","chronic"], "uncommon", false,
      "Progressive proptosis with restricted elevation over weeks to months"),
    c("Microvascular infarct of the superior division", "vascular", ["acute"], "uncommon", false,
      "Abrupt isolated ptosis and elevation failure in a diabetic or hypertensive patient, expected to recover"),
  ],
  skull_base_iii_orbit_inf: [
    c("Orbital trauma or fracture", "traumatic", ["hyperacute","acute"], "common", false,
      "Failure of adduction, depression and pupil constriction after orbital injury, with the lid and elevation spared — the inferior division carries the parasympathetics"),
    c("Orbital inflammatory disease / cellulitis", "inflammatory", ["acute","subacute"], "uncommon", true,
      "Painful proptosis with restricted movement; urgent imaging and antibiotics if infective"),
    c("Orbital tumour or metastasis", "neoplastic", ["subacute","chronic"], "uncommon", false,
      "Progressive proptosis with restricted movement and a dilated pupil"),
    c("Microvascular infarct of the inferior division", "vascular", ["acute"], "rare", false,
      "Abrupt onset in a diabetic or hypertensive patient, expected to recover over about three months"),
  ],
  skull_base_vi_cisternal: [
    c("Raised intracranial pressure (false localising sign)", "neoplastic", ["acute","subacute"], "common", true,
      "A sixth-nerve palsy is a FALSE LOCALISING SIGN — the nerve's long intracranial course makes it vulnerable to stretch from raised pressure ANYWHERE, so look for headache and papilloedema rather than assuming a pontine lesion"),
    c("Microvascular (diabetic / hypertensive) palsy", "vascular", ["acute"], "common", false,
      "Abrupt isolated horizontal diplopia in an older patient with vascular risk factors; should recover within about three months"),
    c("Skull base tumour or nasopharyngeal carcinoma", "neoplastic", ["subacute","chronic"], "uncommon", true,
      "Progressive diplopia with other cranial nerves, ear fullness or neck nodes — examine the postnasal space"),
    c("Meningitis or meningeal disease", "infective", ["acute","subacute"], "uncommon", true,
      "Headache, fever and neck stiffness with cranial-nerve palsies; consider tuberculous and carcinomatous meningitis"),
    c("Head trauma", "traumatic", ["hyperacute","acute"], "uncommon", false,
      "Horizontal diplopia after head injury; the long course makes it vulnerable"),
  ],
  skull_base_vi_petrous_apex: [
    c("Petrous apicitis (Gradenigo's syndrome)", "infective", ["acute","subacute"], "uncommon", true,
      "The triad of a sixth-nerve palsy, deep retro-orbital or facial pain, and a discharging ear — a complication of middle-ear infection that needs urgent imaging and antibiotics"),
    c("Petrous apex tumour or cholesteatoma", "neoplastic", ["chronic"], "uncommon", false,
      "Progressive diplopia with facial pain and hearing loss over months"),
    c("Raised intracranial pressure", "neoplastic", ["acute","subacute"], "common", true,
      "A false localising sign from stretch over the petrous ridge; look for headache and papilloedema"),
    c("Head trauma with petrous fracture", "traumatic", ["hyperacute","acute"], "uncommon", false,
      "Diplopia after temporal bone injury, often with hearing loss or CSF otorrhoea"),
  ],
  skull_base_trochlear_cisternal: [
    c("Head trauma", "traumatic", ["hyperacute","acute"], "common", false,
      "Vertical diplopia after head injury — the fourth nerve has the longest, most exposed intracranial course of any cranial nerve and is the one most often damaged by trauma, frequently bilaterally"),
    c("Microvascular (diabetic / hypertensive) palsy", "vascular", ["acute"], "common", false,
      "Abrupt isolated vertical diplopia in an older patient with vascular risk factors; recovery expected within about three months"),
    c("Congenital fourth-nerve palsy (decompensating)", "congenital", ["chronic"], "common", false,
      "A long-standing head tilt visible in old photographs, with a large vertical fusion range — it decompensates in adulthood and can masquerade as new"),
    c("Tumour or raised intracranial pressure", "neoplastic", ["subacute","chronic"], "uncommon", true,
      "Progressive diplopia with headache or other cranial-nerve signs; image if it fails to recover or gains company"),
  ],
  skull_base_sup_orbital_fissure: [
    c("Tumour / metastasis / perineural spread", "neoplastic", ["subacute","chronic"], "common", true,
      "Progressive ophthalmoplegia with V1 numbness over weeks to months; ask about previous facial skin cancer, since perineural spread can present long after the primary"),
    c("Tolosa-Hunt syndrome (granulomatous inflammation)", "inflammatory", ["subacute"], "uncommon", false,
      "Painful ophthalmoplegia that responds dramatically to steroids — but it is a diagnosis of exclusion, so image and exclude tumour and aneurysm first"),
    c("Trauma / orbital fracture", "traumatic", ["hyperacute","acute"], "uncommon", false,
      "Ophthalmoplegia with V1 sensory loss after orbital injury"),
    c("Carotid-cavernous fistula", "vascular", ["subacute"], "rare", true,
      "Pulsatile proptosis with a bruit, chemosis and dilated conjunctival vessels, often after trauma"),
    c("Infection (fungal, mucormycosis)", "infective", ["acute"], "rare", true,
      "A diabetic or immunocompromised patient with rapidly progressive painful ophthalmoplegia — look in the nose for a black eschar and treat as a surgical emergency"),
  ],
  // --- Region D: trigeminal course, facial segments, lower cranial nerves (2026-08-10) ---
  skull_base_v_ganglion: [
    c("Herpes zoster (trigeminal ganglionitis)", "infective", ["acute"], "common", false,
      "Severe burning facial pain preceding a dermatomal vesicular rash; V1 involvement threatens the eye, so look for vesicles on the nose tip (Hutchinson's sign) and refer to ophthalmology"),
    c("Trigeminal schwannoma", "neoplastic", ["chronic"], "uncommon", false,
      "Years of progressive facial numbness across two or three divisions, with wasting of the muscles of mastication if the motor root is involved"),
    c("Perineural tumour spread", "neoplastic", ["subacute","chronic"], "uncommon", true,
      "Progressive facial numbness with pain in a patient with previous facial skin cancer or a head-and-neck primary — the tumour tracks back along the nerve, sometimes years later"),
    c("Meningioma of Meckel's cave", "neoplastic", ["chronic"], "uncommon", false,
      "Slowly progressive multi-divisional facial numbness with an enhancing mass at the petrous apex"),
    c("Skull base metastasis or nasopharyngeal carcinoma", "neoplastic", ["subacute"], "uncommon", true,
      "Facial numbness with other cranial-nerve palsies, ear symptoms or neck nodes"),
  ],
  skull_base_v1_division: [
    c("Herpes zoster ophthalmicus", "infective", ["acute"], "common", true,
      "Forehead pain and vesicles in the V1 dermatome; vesicles on the tip of the nose (Hutchinson's sign) warn of sight-threatening eye involvement"),
    c("Cavernous sinus or superior orbital fissure lesion", "neoplastic", ["subacute","chronic"], "uncommon", true,
      "V1 numbness with ophthalmoplegia — the company it keeps localises it, since V1 rarely goes alone"),
    c("Perineural tumour spread", "neoplastic", ["subacute","chronic"], "uncommon", true,
      "Progressive forehead numbness in a patient with previous facial skin cancer"),
    c("Trauma (supraorbital nerve injury)", "traumatic", ["acute"], "common", false,
      "Numbness over the forehead after a brow laceration or fracture, in a sharply demarcated territory"),
  ],
  skull_base_v1_petrous: [
    c("Petrous apex lesion (Gradenigo's, cholesteatoma, tumour)", "infective", ["acute","subacute"], "uncommon", true,
      "Deep retro-orbital pain with a sixth-nerve palsy and ear discharge — the trigeminal ganglion sits on the petrous apex beside the abducens nerve"),
    c("Perineural or skull base tumour spread", "neoplastic", ["subacute","chronic"], "uncommon", true,
      "Progressive facial pain and numbness with other cranial nerves over weeks to months"),
    c("Skull base trauma (petrous fracture)", "traumatic", ["hyperacute","acute"], "rare", false,
      "Facial numbness and pain after temporal bone injury, often with hearing loss"),
  ],
  skull_base_foramen_rotundum: [
    c("Perineural tumour spread along V2", "neoplastic", ["subacute","chronic"], "common", true,
      "Progressive numbness of the cheek and upper teeth in a patient with a previous midface skin cancer — V2 is a common route for perineural spread, and it may present long after the primary was treated"),
    c("Maxillary sinus tumour", "neoplastic", ["subacute","chronic"], "uncommon", true,
      "Cheek numbness with nasal obstruction, epistaxis or loosening teeth; examine the postnasal space and image the sinuses"),
    c("Trigeminal neuralgia (V2 distribution)", "vascular", ["chronic"], "common", false,
      "Brief, electric-shock pains in the cheek triggered by touch, chewing or cold, usually from vascular compression at the root entry zone"),
    c("Trauma or dental / sinus surgery", "traumatic", ["acute"], "uncommon", false,
      "Cheek and gum numbness after a maxillary fracture or dental procedure"),
  ],
  skull_base_v3_ovale: [
    c("Perineural tumour spread / skull base malignancy", "neoplastic", ["subacute","chronic"], "common", true,
      "A NUMB CHIN is a sinister sign — numbness in the mental nerve territory should be assumed to be malignant infiltration (breast, lung, lymphoma or a head-and-neck primary) until imaging proves otherwise, and it may be the first sign of relapse"),
    c("Trigeminal schwannoma", "neoplastic", ["chronic"], "uncommon", false,
      "Progressive chin and tongue numbness with WASTING of the muscles of mastication and jaw deviation toward the weak side"),
    c("Nasopharyngeal carcinoma", "neoplastic", ["subacute","chronic"], "uncommon", true,
      "Facial numbness with ear fullness, epistaxis or neck nodes; examine the postnasal space"),
    c("Trigeminal neuralgia (V3 distribution)", "vascular", ["chronic"], "common", false,
      "Brief electric-shock pains in the jaw triggered by chewing, touch or cold"),
    c("Mandibular trauma or dental surgery", "traumatic", ["acute"], "common", false,
      "Chin numbness after a mandibular fracture, third-molar extraction or dental implant"),
  ],
  skull_base_vii_tympanic: [
    c("Cholesteatoma", "neoplastic", ["chronic"], "common", true,
      "Facial weakness with a long history of foul-smelling ear discharge and conductive hearing loss — an expanding keratin sac eroding the facial canal; it needs surgery, not antibiotics alone"),
    c("Acute or chronic otitis media", "infective", ["acute","subacute"], "common", true,
      "Facial palsy with a painful discharging ear and fever — an emergency complication requiring urgent ENT review, drainage and antibiotics"),
    c("Iatrogenic injury at middle-ear surgery", "traumatic", ["acute"], "uncommon", false,
      "Facial weakness immediately after mastoid or middle-ear surgery"),
    c("Temporal bone fracture", "traumatic", ["hyperacute","acute"], "uncommon", true,
      "Facial palsy after head injury with haemotympanum or CSF otorrhoea; immediate-onset palsy suggests transection and needs urgent assessment"),
    c("Glomus tympanicum tumour", "neoplastic", ["chronic"], "rare", false,
      "Pulsatile tinnitus with a red retrotympanic mass and slowly progressive facial weakness"),
  ],
  skull_base_vii_mastoid: [
    c("Cholesteatoma", "neoplastic", ["chronic"], "common", true,
      "Chronic foul ear discharge with progressive facial weakness; the mastoid segment lies just above the stylomastoid foramen and is eroded late"),
    c("Mastoiditis", "infective", ["acute"], "uncommon", true,
      "A tender, boggy, protruding ear with fever and facial weakness — urgent ENT review, imaging and intravenous antibiotics"),
    c("Temporal bone fracture", "traumatic", ["hyperacute","acute"], "uncommon", true,
      "Facial palsy after head injury; immediate complete palsy suggests nerve transection and may need surgical exploration"),
    c("Iatrogenic injury at mastoid surgery", "traumatic", ["acute"], "uncommon", false,
      "Facial weakness immediately following mastoidectomy"),
    c("Hearing loss with facial weakness from tumour", "neoplastic", ["chronic"], "rare", false,
      "Slowly progressive facial weakness with conductive hearing loss and a mass on imaging"),
  ],
  skull_base_vii_parotid: [
    c("Parotid malignancy", "neoplastic", ["subacute","chronic"], "common", true,
      "A facial palsy WITH A PAROTID LUMP is malignant infiltration until proven otherwise — this is NOT Bell's palsy, and the combination of a parotid mass and facial weakness mandates urgent imaging and biopsy rather than steroids",
      "palpate the parotid and examine the neck in EVERY facial palsy — a mass, or weakness confined to one or two branches, points away from Bell's"),
    c("Parotid surgery or trauma", "traumatic", ["acute"], "common", false,
      "Weakness confined to individual branches after parotidectomy or a facial laceration — a branch lesion gives PATCHY weakness, unlike the complete hemifacial weakness of a proximal lesion"),
    c("Parotitis or parotid abscess", "infective", ["acute"], "uncommon", false,
      "A painful, swollen, tender parotid with fever; facial weakness is unusual and should still prompt imaging"),
    c("Benign parotid tumour with mass effect", "neoplastic", ["chronic"], "uncommon", false,
      "A slowly enlarging painless parotid lump; facial weakness is uncommon in benign disease, so its presence suggests malignancy"),
  ],
  skull_base_ix_jugular: [
    c("Glomus jugulare tumour (paraganglioma)", "neoplastic", ["chronic"], "uncommon", false,
      "Pulsatile tinnitus and hearing loss with progressive lower cranial-nerve palsies over years; a vascular, intensely enhancing mass at the jugular foramen"),
    c("Skull base metastasis", "neoplastic", ["subacute"], "uncommon", true,
      "Rapidly progressive lower cranial-nerve palsies with pain in a patient with known malignancy"),
    c("Schwannoma", "neoplastic", ["chronic"], "rare", false,
      "Slowly progressive isolated lower cranial-nerve involvement with a smooth enhancing mass"),
    c("Skull base infection / osteomyelitis", "infective", ["subacute"], "rare", true,
      "Severe ear pain with granulation tissue in an elderly diabetic — malignant otitis externa, usually pseudomonal, spreading to the skull base"),
  ],
  skull_base_x_jugular: [
    c("Glomus jugulare tumour (paraganglioma)", "neoplastic", ["chronic"], "uncommon", false,
      "Hoarseness and swallowing difficulty with pulsatile tinnitus; a HIGH vagal lesion also causes palatal weakness, unlike a recurrent laryngeal lesion"),
    c("Skull base metastasis or nasopharyngeal carcinoma", "neoplastic", ["subacute"], "uncommon", true,
      "Progressive hoarseness and dysphagia with other cranial nerves and pain"),
    c("Jugular vein thrombosis or dissection", "vascular", ["acute","subacute"], "rare", true,
      "Neck pain with lower cranial-nerve palsies; consider a prothrombotic state or recent instrumentation"),
    c("Schwannoma", "neoplastic", ["chronic"], "rare", false,
      "Slowly progressive hoarseness with a smooth enhancing mass at the jugular foramen"),
  ],
  skull_base_x_recurrent_laryngeal: [
    c("Lung malignancy (left recurrent laryngeal)", "neoplastic", ["subacute","chronic"], "common", true,
      "Hoarseness with a bovine cough in a smoker — the LEFT nerve loops under the AORTIC ARCH, so it has a long intrathoracic course and can be caught by a left hilar or mediastinal tumour; imaging must therefore cover the whole course down into the chest, not just the neck"),
    c("Thyroid or neck surgery (iatrogenic)", "traumatic", ["acute"], "common", false,
      "Hoarseness immediately after thyroidectomy, parathyroid, carotid or anterior cervical spine surgery — the commonest iatrogenic cause"),
    c("Thyroid malignancy or large goitre", "neoplastic", ["subacute","chronic"], "uncommon", true,
      "Hoarseness with a neck mass; new voice change in a thyroid lump suggests invasion rather than compression"),
    c("Aortic arch aneurysm or cardiac enlargement (Ortner's syndrome)", "vascular", ["chronic"], "rare", true,
      "Hoarseness from stretching of the left nerve by an enlarged aorta, left atrium or pulmonary artery"),
    c("Viral or idiopathic neuropathy", "infective", ["acute","subacute"], "uncommon", false,
      "Hoarseness after a viral illness, a diagnosis of exclusion once imaging of the full nerve course is clear"),
  ],
  skull_base_xi_jugular: [
    c("Skull base tumour or metastasis", "neoplastic", ["subacute","chronic"], "common", true,
      "Weakness of BOTH sternocleidomastoid and trapezius with other lower cranial nerves — a proximal lesion at the jugular foramen, unlike the isolated trapezius weakness of a posterior triangle injury"),
    c("Glomus jugulare tumour", "neoplastic", ["chronic"], "uncommon", false,
      "Pulsatile tinnitus with progressive lower cranial-nerve palsies over years"),
    c("Skull base trauma or fracture", "traumatic", ["hyperacute","acute"], "rare", false,
      "Shoulder and head-turning weakness after significant head or neck injury"),
    c("Skull base infection / osteomyelitis", "infective", ["subacute"], "rare", true,
      "Severe ear pain with cranial-nerve palsies in an elderly diabetic"),
  ],
  skull_base_xi_posterior_triangle: [
    c("Iatrogenic injury at cervical lymph node biopsy", "traumatic", ["acute"], "common", true,
      "Shoulder droop, winging and difficulty lifting the arm above the head, appearing after a lymph node biopsy or excision in the posterior triangle — the nerve is superficial here and is the classic surgical casualty; SCM is SPARED because its branches leave more proximally"),
    c("Penetrating trauma to the posterior triangle", "traumatic", ["hyperacute","acute"], "uncommon", false,
      "Trapezius weakness after a stab or laceration to the side of the neck"),
    c("Neck dissection or carotid surgery", "traumatic", ["acute"], "common", false,
      "Trapezius weakness following radical or selective neck dissection"),
    c("Tumour infiltration or radiotherapy", "neoplastic", ["subacute","chronic"], "uncommon", false,
      "Progressive shoulder weakness in a treated head-and-neck cancer patient; distinguish recurrence from radiation injury"),
  ],
  skull_base_hypoglossal_canal: [
    c("Skull base metastasis", "neoplastic", ["subacute"], "common", true,
      "Progressive tongue wasting and deviation TOWARD the weak side with occipital pain — the occipital condyle syndrome, often the first sign of skull base metastasis"),
    c("Chordoma or clival tumour", "neoplastic", ["chronic"], "uncommon", false,
      "Slowly progressive tongue weakness with other lower cranial nerves and a destructive clival mass"),
    c("Nasopharyngeal carcinoma", "neoplastic", ["subacute","chronic"], "uncommon", true,
      "Tongue weakness with ear fullness, epistaxis or neck nodes"),
    c("Skull base trauma or occipital condyle fracture", "traumatic", ["hyperacute","acute"], "rare", false,
      "Tongue weakness after significant craniocervical injury"),
  ],
  skull_base_xii_neck: [
    c("Carotid dissection or aneurysm", "vascular", ["acute","subacute"], "uncommon", true,
      "Tongue weakness with neck pain and possibly a Horner's — the hypoglossal nerve runs beside the carotid, so isolated tongue weakness with neck pain demands vessel imaging"),
    c("Iatrogenic injury (carotid endarterectomy, neck surgery)", "traumatic", ["acute"], "common", false,
      "Tongue deviation immediately after carotid or submandibular surgery"),
    c("Neck malignancy or lymphadenopathy", "neoplastic", ["subacute","chronic"], "uncommon", true,
      "Progressive tongue wasting with a neck mass; image the whole course from skull base to tongue"),
    c("Penetrating neck trauma", "traumatic", ["hyperacute","acute"], "rare", false,
      "Tongue weakness after a stab or laceration to the upper neck"),
  ],
  skull_base_carotid_space: [
    c("Carotid artery dissection", "vascular", ["hyperacute","acute"], "common", true,
      "A PAINFUL third-order Horner's — partial ptosis and miosis with PRESERVED facial sweating (the sudomotor fibres leave with the external carotid) plus neck or face pain; it may herald a stroke within days, so image the vessels urgently"),
    c("Carotid body tumour / paraganglioma", "neoplastic", ["chronic"], "uncommon", false,
      "A slowly enlarging pulsatile neck mass at the carotid bifurcation, mobile side to side but not up and down, with a Horner's or lower cranial-nerve palsies"),
    c("Neck malignancy or lymphadenopathy", "neoplastic", ["subacute","chronic"], "uncommon", true,
      "A Horner's with a neck mass or known head-and-neck primary; image from skull base to thorax"),
    c("Iatrogenic (carotid surgery, central line, interscalene block)", "traumatic", ["acute"], "uncommon", false,
      "A Horner's appearing immediately after a neck procedure or regional block"),
    c("Cluster headache", "vascular", ["acute","chronic"], "common", false,
      "A transient partial Horner's during severe unilateral periorbital pain attacks with lacrimation and nasal congestion; it may become permanent after many attacks"),
  ],
  skull_base_collet_sicard: [
    c("Skull base metastasis", "neoplastic", ["subacute"], "common", true,
      "Cranial nerves IX, X, XI AND XII together — the jugular foramen trio plus the hypoglossal canal, without a Horner's; rapid progression with pain suggests metastatic infiltration"),
    c("Glomus jugulare tumour (paraganglioma)", "neoplastic", ["chronic"], "uncommon", false,
      "Years of pulsatile tinnitus with progressive lower cranial-nerve palsies and an intensely enhancing mass"),
    c("Nasopharyngeal carcinoma", "neoplastic", ["subacute","chronic"], "uncommon", true,
      "Lower cranial-nerve palsies with ear fullness, epistaxis or neck nodes; examine the postnasal space"),
    c("Skull base osteomyelitis", "infective", ["subacute"], "rare", true,
      "Severe ear pain with granulation tissue in an elderly diabetic — malignant otitis externa spreading to the skull base"),
    c("Occipital condyle fracture or craniocervical trauma", "traumatic", ["hyperacute","acute"], "rare", false,
      "Multiple lower cranial-nerve palsies after significant craniocervical injury"),
  ],
  skull_base_villaret: [
    c("Skull base or retroparotid metastasis", "neoplastic", ["subacute"], "common", true,
      "Cranial nerves IX, X, XI and XII PLUS a HORNER'S — the added sympathetic involvement places the lesion in the retroparotid (retrostyloid) space rather than at the jugular foramen itself"),
    c("Carotid artery dissection", "vascular", ["acute"], "uncommon", true,
      "Neck pain with a Horner's and lower cranial-nerve palsies; image the vessels urgently, as stroke may follow"),
    c("Glomus or carotid body tumour", "neoplastic", ["chronic"], "uncommon", false,
      "A slowly progressive pulsatile neck mass with sympathetic and lower cranial-nerve involvement"),
    c("Nasopharyngeal carcinoma or parotid malignancy", "neoplastic", ["subacute","chronic"], "uncommon", true,
      "Progressive palsies with a parotid or neck mass; biopsy is needed"),
    c("Retropharyngeal abscess or deep neck infection", "infective", ["acute"], "rare", true,
      "Fever with neck pain, stiffness and dysphagia; urgent imaging and drainage"),
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

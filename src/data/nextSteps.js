// nextSteps.js — the EDUCATIONAL "what next" layer, now TIERED: immediate/bedside actions, first-line
// investigations, confirmatory/specialist tests, and monitoring/safety-netting, plus urgency + referral.
// These are TEACHING PROMPTS, not clinical directives — no drug doses, no definitive management. The app
// pairs them with an explicit "not clinical advice" disclaimer.
//
//   nextStepsFor(site) -> { immediate, investigations, confirmatory, monitoring, urgency, referral, curated }
//
// Curated per-site entries (by site.id, else level_part) carry the site-specific first-line investigations
// and referral; the immediate / confirmatory / monitoring tiers are DERIVED from urgency + region so EVERY
// site gets a full, structured plan (derive-don't-store spirit). A curated entry may override any tier via
// its optional `extra` ({ immediate, confirmatory, monitoring }).

const ns = (investigations, urgency, referral, extra = {}) => ({ investigations, urgency, referral, ...extra });

// ---- curated, high-value sites (seeded from the phonebook red flags + ddx) ----
export const NEXT = {
  // --- Region B: lacunar / deep grey + cord emergencies (2026-08-10) ---
  cauda_equina: ns(
    ["EMERGENCY MRI of the whole lumbosacral spine — do not wait for the morning list, and do not let a normal plain film reassure you",
     "Bloods incl. FBC, CRP/ESR (abscess) and clotting/INR (epidural haematoma on anticoagulation)"],
    "emergency",
    "Refer IMMEDIATELY to emergency spinal surgery / neurosurgery — decompression is time-critical, not a next-day referral.",
    { immediate: ["Bladder scan for post-void residual volume — a raised residual is the objective early sign, before retention is obvious",
                  "Test saddle (S2-S4) sensation directly, including perianal skin",
                  "Assess anal tone and voluntary squeeze per rectum (PR), and ask about altered sensation when wiping",
                  "Document the exact time of onset of sphincter symptoms — it drives the surgical urgency"],
      confirmatory: ["MRI defines the level and the compressing lesion (disc, tumour, abscess, haematoma)",
                     "If abscess is suspected: blood cultures BEFORE antibiotics, plus CRP and inflammatory markers"],
      monitoring: ["Serial bladder scans and repeat saddle/anal-tone examination — document each time",
                   "Delay causes PERMANENT, irreversible loss of continence and sexual function; deterioration must trigger immediate re-referral"] }),
  conus_medullaris: ns(
    ["EMERGENCY MRI centred on the CONUS at the T12-L1 level — a scan aimed only at the lumbosacral roots can miss it entirely",
     "Bloods incl. FBC, CRP/ESR and clotting/INR"],
    "emergency",
    "Refer immediately to emergency spinal surgery / neurosurgery; imaging the wrong level wastes the window.",
    { immediate: ["Bladder scan for post-void residual; sphincter involvement is EARLY and symmetric here",
                  "Test saddle sensation and anal tone, and look specifically for UMN signs (brisk reflexes, extensor plantars) that separate conus from cauda equina",
                  "Document the sensory level and the time of onset"],
      confirmatory: ["MRI defines the compressing or intrinsic lesion at T12-L1",
                     "If inflammatory rather than compressive: lumbar puncture, aquaporin-4 (AQP4) and MOG antibodies, oligoclonal bands"],
      monitoring: ["Serial bladder scans and repeat examination; deterioration needs immediate re-referral",
                   "Delay risks permanent sphincter and sexual dysfunction"] }),
  cord_transverse: ns(
    ["EMERGENCY MRI of the WHOLE SPINE with contrast — the first job is to exclude compression, because that is the surgically reversible cause",
     "Bloods incl. FBC, CRP/ESR, clotting/INR, B12 and HIV/syphilis serology"],
    "emergency",
    "Acute neurology + emergency spinal surgery in parallel — do not label it myelitis until compression is excluded.",
    { immediate: ["Establish and mark the sensory level, and document power and reflexes for comparison",
                  "Bladder scan for post-void residual; catheterise if in retention",
                  "Ask about back pain, fever and known malignancy — each points to a different cause"],
      confirmatory: ["If no compression: lumbar puncture (cells, protein, oligoclonal bands), aquaporin-4 (AQP4) and MOG antibodies",
                     "MRI brain to look for demyelinating lesions disseminated in space",
                     "If cord infarct suspected: vascular imaging and an aortic assessment"],
      monitoring: ["Serial neuro-obs with a marked sensory level — an ascending level threatens respiratory function",
                   "Monitor vital capacity if the level is cervical or high thoracic",
                   "Bladder care, pressure-area care and VTE prophylaxis from the outset"] }),
  cord_hemi: ns( // Brown-Séquard
    ["Urgent MRI of the whole spine with contrast — a compressive cause is a surgical emergency",
     "If penetrating trauma: CT for retained fragments and bony injury"],
    "emergency",
    "Emergency spinal surgery / neurosurgery if compression or penetrating injury; acute neurology if inflammatory.",
    { immediate: ["Document the level: ipsilateral weakness and dorsal-column loss with contralateral pain/temperature loss",
                  "Immobilise if there is any traumatic mechanism, before moving the patient",
                  "Bladder scan for post-void residual"],
      confirmatory: ["MRI defines a compressive versus intrinsic cord lesion",
                     "If demyelinating: lumbar puncture, oligoclonal bands, MRI brain, AQP4/MOG antibodies"],
      monitoring: ["Serial neuro-obs for progression to a complete cord syndrome", "Bladder care and VTE prophylaxis"] }),
  cord_lateral: ns(
    ["MRI of the cervical cord with contrast — a Horner's with suspended sensory loss or long-tract signs needs cord imaging",
     "Include the craniocervical junction to look for a Chiari malformation with an associated syrinx"],
    "urgent",
    "Neurology; neurosurgery if a syrinx, Chiari or intramedullary tumour is found.",
    { immediate: ["Map the suspended, cape-like dissociated sensory loss (pain/temperature lost, light touch spared)",
                  "Examine for a first-order Horner's and for long-tract signs below the lesion"],
      confirmatory: ["Whole-spine MRI to define the extent of any syrinx", "If inflammatory: lumbar puncture, oligoclonal bands, AQP4/MOG antibodies"],
      monitoring: ["Warn about painless burns and injuries to the analgesic areas", "Serial examination for progression of the sensory level or new weakness"] }),
  subcortex_internal_capsule: ns(
    ["Urgent non-contrast CT head to exclude haemorrhage, then MRI (DWI) to confirm the lacune",
     "Bedside glucose FIRST — hypoglycaemia reproduces a pure motor hemiparesis exactly"],
    "emergency",
    "Acute stroke team — hyperacute pathway; a stuttering or crescendo deficit (capsular warning syndrome) needs admission, not reassurance.",
    { immediate: ["Bedside glucose and blood pressure", "Establish the exact time last known well for thrombolysis eligibility",
                  "Confirm the ABSENCE of cortical signs (aphasia, neglect, field defect) — that is what localises it deep"],
      confirmatory: ["Vascular risk-factor work-up: ECG/telemetry, lipids, HbA1c", "Carotid imaging and echocardiography as indicated"],
      monitoring: ["Frequent neuro-obs — a capsular warning syndrome can complete into a fixed infarct", "Swallow screen before oral intake"] }),
  subcortex_corona_radiata: ns(
    ["Urgent non-contrast CT head to exclude haemorrhage, then MRI (DWI) for the white-matter lacune",
     "Bedside glucose FIRST"],
    "emergency", "Acute stroke team — hyperacute pathway.",
    { immediate: ["Bedside glucose and blood pressure", "Time last known well", "Confirm no cortical signs — pure motor deficit points deep"],
      confirmatory: ["Vascular risk-factor work-up: ECG/telemetry, lipids, HbA1c"],
      monitoring: ["Frequent neuro-obs for progression", "Swallow screen before oral intake"] }),
  subcortex_thalamus: ns(
    ["Urgent non-contrast CT head — thalamic haemorrhage may rupture into the ventricles and cause hydrocephalus",
     "MRI (DWI) to confirm a VPL lacune"],
    "emergency", "Acute stroke team; neurosurgery if there is haemorrhage with intraventricular extension or hydrocephalus.",
    { immediate: ["Bedside glucose and blood pressure", "Map the pure hemisensory loss of face, arm and leg",
                  "Check conscious level and pupils — forced downgaze with small pupils suggests a thalamic bleed"],
      confirmatory: ["Vascular risk-factor work-up: ECG/telemetry, lipids, HbA1c",
                     "Counsel about central post-stroke pain (Déjerine-Roussy) — it may appear weeks to months later"],
      monitoring: ["Watch for hydrocephalus if there is intraventricular blood",
                   "Follow up for central post-stroke pain; it is neuropathic, often refractory, and treated with agents such as amitriptyline, gabapentinoids or duloxetine — not dismissed as functional"] }),
  subcortex_anterior_choroidal: ns(
    ["Urgent non-contrast CT then MRI (DWI) — the full triad from one perforator mimics a large cortical stroke",
     "Vascular imaging (CTA/MRA) to assess the carotid and perforator territory"],
    "emergency", "Acute stroke team — hyperacute pathway.",
    { immediate: ["Bedside glucose and blood pressure", "Time last known well",
                  "Document the triad (hemiparesis, hemisensory loss, hemianopia) and the absence of aphasia or neglect"],
      confirmatory: ["Vascular risk-factor work-up: ECG/telemetry, lipids, HbA1c", "Carotid imaging and echocardiography"],
      monitoring: ["Frequent neuro-obs", "Formal visual-field testing once stable, with driving advice"] }),
  subcortex_sensorimotor: ns(
    ["Urgent non-contrast CT head to exclude haemorrhage, then MRI (DWI)", "Bedside glucose FIRST"],
    "emergency", "Acute stroke team — hyperacute pathway.",
    { immediate: ["Bedside glucose and blood pressure", "Time last known well", "Confirm combined motor AND sensory loss with no cortical signs"],
      confirmatory: ["Vascular risk-factor work-up: ECG/telemetry, lipids, HbA1c"],
      monitoring: ["Frequent neuro-obs for progression", "Swallow screen before oral intake"] }),
  subcortex_optic_radiation: ns(
    ["Urgent CT/MRI brain — an isolated homonymous field defect is a stroke until proven otherwise",
     "Formal visual-field perimetry to define the defect precisely"],
    "emergency", "Acute stroke team if acute; ophthalmology and neurology for field characterisation and rehabilitation.",
    { immediate: ["Confrontation visual-field testing to each eye separately",
                  "Establish whether the defect is congruous and whether it respects the vertical meridian",
                  "Time last known well"],
      confirmatory: ["Formal perimetry (Humphrey/Goldmann) to document the quadrantanopia or hemianopia",
                     "Vascular risk-factor work-up: ECG/telemetry, lipids, HbA1c"],
      monitoring: ["DRIVING advice is mandatory — a homonymous field defect usually precludes driving; advise the patient to notify the licensing authority",
                   "Refer for visual rehabilitation and occupational-therapy assessment"] }),
  pons_basis_pontis: ns(
    ["Urgent MRI brain (DWI) + MRA of the basilar territory", "CT first if haemorrhage is suspected"],
    "emergency", "Acute stroke team — basilar territory disease can progress to locked-in syndrome; monitor closely.",
    { immediate: ["Bedside glucose and blood pressure", "Time last known well",
                  "Document ataxia out of proportion to weakness (ataxic hemiparesis) or dysarthria with a clumsy hand"],
      confirmatory: ["Vascular risk-factor work-up: ECG/telemetry, lipids, HbA1c"],
      monitoring: ["Frequent neuro-obs — a stuttering or stepwise deficit suggests basilar perforator disease that may progress",
                   "Swallow screen before oral intake"] }),
  craniocervical_junction_foramen_magnum: ns(
    ["MRI of the craniocervical junction and cervical cord — new downbeat nystagmus warrants imaging, as a Chiari or foramen-magnum lesion is surgically treatable",
     "Check lithium and anticonvulsant levels; a drug cause is reversible"],
    "urgent",
    "Neurology; neurosurgery if a Chiari malformation, foramen-magnum tumour or craniocervical instability is found.",
    { immediate: ["Characterise the nystagmus — downbeat, worst on lateral and downward gaze",
                  "Ask specifically about headache brought on by coughing, straining or laughing (Chiari)",
                  "Examine for long-tract signs and for a cape-like sensory loss suggesting an associated syrinx"],
      confirmatory: ["Whole-spine MRI if a syrinx is present, to define its extent",
                     "Thiamine level and treat empirically if Wernicke's is possible; drug levels for lithium/phenytoin/carbamazepine",
                     "Genetic testing for spinocerebellar ataxia where the picture and family history fit"],
      monitoring: ["Serial examination for progressive long-tract signs or a rising sensory level",
                   "Flexion-extension imaging if craniocervical instability is suspected; advise caution with neck manipulation"] }),
  // --- Region C: remaining brainstem + cerebellum (2026-08-10) ---
  midbrain_lateral: ns(
    ["Urgent MRI brain (DWI) + CTA/MRA — posterior cerebral / basilar perforator territory",
     "CT first if haemorrhage is suspected: a small midbrain bleed has a large effect"],
    "emergency", "Acute stroke team — hyperacute pathway; crossed brainstem signs mean posterior circulation.",
    { immediate: ["Assess the third nerve (pupil, lid, eye position) and contralateral ataxia or tremor — the crossed pattern localises to the midbrain",
                  "Bedside glucose; establish time last known well"],
      confirmatory: ["Vessel imaging for basilar disease", "Vascular risk-factor work-up: ECG/telemetry, lipids, HbA1c"],
      monitoring: ["Frequent neuro-obs — basilar territory disease can progress", "Swallow screen before oral intake"] }),
  midbrain_trochlear: ns(
    ["MRI brain focused on the dorsal midbrain — exclude a tectal or pineal mass and demyelination",
     "In an isolated fourth-nerve palsy after head trauma, imaging may be normal"],
    "urgent", "Neurology and ophthalmology; neurosurgery if a dorsal midbrain mass is found.",
    { immediate: ["Test the vertical diplopia: worse on looking down and on head tilt TOWARD the affected side (Bielschowsky test)",
                  "Look for a compensatory head tilt away from the lesion",
                  "Check for upgaze palsy and pupil abnormalities, which would indicate a dorsal midbrain syndrome"],
      confirmatory: ["MRI with contrast if a mass is suspected", "Demyelination work-up in a younger patient: MRI brain and spine, oligoclonal bands"],
      monitoring: ["Orthoptic review; prisms or occlusion for diplopia while awaiting recovery",
                   "Re-image if new signs appear — an isolated palsy that gains company suggests a structural cause"] }),
  midbrain_hemi: ns(
    ["EMERGENCY CTA/MRA — top-of-the-basilar occlusion is a large-vessel emergency",
     "Urgent CT then MRI (DWI) for the extent of infarction"],
    "emergency", "IMMEDIATE stroke team and neurointerventional referral; ICU for airway protection.",
    { immediate: ["ABCDE and airway protection; bedside glucose", "Assess conscious level, pupils and vertical gaze", "Time last known well"],
      confirmatory: ["Vessel imaging to confirm basilar occlusion and plan thrombectomy", "Vascular risk-factor work-up once stable"],
      monitoring: ["Continuous neuro-obs in critical care — deterioration is rapid", "Swallow screen before oral intake"] }),
  dorsal_midbrain_tectum: ns(
    ["Urgent MRI brain with contrast — a pineal or tectal mass, and the ventricular size",
     "Urgent CT if the patient is drowsy or shunted: assume SHUNT FAILURE until proven otherwise",
     "Tumour markers (alpha-fetoprotein, beta-hCG) in serum and CSF for a germ-cell tumour"],
    "emergency",
    "NEUROSURGERY urgently — hydrocephalus may need immediate CSF diversion; oncology if a pineal tumour is confirmed.",
    { immediate: ["Assess conscious level and look for headache, vomiting and papilloedema — raised intracranial pressure is the danger",
                  "Test upgaze and look for convergence-retraction nystagmus and light-near dissociation of the pupils",
                  "In a shunted patient, examine the shunt and escalate immediately"],
      confirmatory: ["MRI with contrast to characterise the mass", "CSF cytology and tumour markers once safe", "Ophthalmology review for the pupillary findings"],
      monitoring: ["Watch conscious level closely — obstructive hydrocephalus can decompensate quickly",
                   "Serial imaging of ventricular size after any intervention"] }),
  pons_lateral: ns(
    ["Urgent MRI brain (DWI) + MRA — AICA territory and basilar disease",
     "FORMAL AUDIOMETRY: ipsilateral hearing loss distinguishes AICA from PICA territory",
     "CT first if haemorrhage is suspected"],
    "emergency", "Acute stroke team — hyperacute pathway; ENT/audiology for the hearing loss.",
    { immediate: ["Test hearing at the bedside — deafness points to AICA rather than PICA",
                  "Perform HINTS if this presented as acute vertigo; a central pattern means stroke",
                  "Bedside glucose; time last known well; swallow screen"],
      confirmatory: ["Audiometry", "Vascular risk-factor work-up: ECG/telemetry, lipids, HbA1c",
                     "MRI with contrast (internal auditory meatus) if a cerebellopontine angle tumour is suspected"],
      monitoring: ["Frequent neuro-obs; watch for posterior-fossa swelling if there is cerebellar infarction",
                   "Swallow screen before oral intake; audiology follow-up for persistent hearing loss"] }),
  pons_lateral_trigeminal: ns(
    ["Urgent MRI brain (DWI) + MRA — AICA territory, including the trigeminal complex",
     "MRI with contrast through the internal auditory meatus if a cerebellopontine angle tumour is suspected"],
    "emergency", "Acute stroke team if acute; neurosurgery/ENT if a cerebellopontine angle mass.",
    { immediate: ["Test facial sensation in all three divisions AND the corneal reflex — an absent corneal reflex is often the earliest sign",
                  "Test hearing; deafness points to AICA territory", "Bedside glucose; time last known well"],
      confirmatory: ["Audiometry and dedicated internal-auditory-meatus imaging", "Vascular risk-factor work-up"],
      monitoring: ["EYE PROTECTION while the cornea is anaesthetic — lubricants and review, since a numb cornea ulcerates painlessly",
                   "Frequent neuro-obs; swallow screen before oral intake"] }),
  pons_trigeminal: ns(
    ["MRI brain with attention to the pons and trigeminal root entry zone",
     "In a young patient or with BILATERAL symptoms, investigate for multiple sclerosis: MRI brain and spine, oligoclonal bands"],
    "urgent", "Neurology; neurosurgery if a cerebellopontine angle mass or for neuralgia refractory to medical therapy.",
    { immediate: ["Map facial sensation by division and test the CORNEAL REFLEX",
                  "Test the muscles of mastication and jaw deviation for motor V involvement",
                  "Ask about trigeminal neuralgia: brief, electric-shock pains triggered by touch, chewing or cold"],
      confirmatory: ["MRI with contrast to assess the root entry zone and cerebellopontine angle",
                     "Demyelination work-up in the young: oligoclonal bands, MRI spine"],
      monitoring: ["EYE PROTECTION if the cornea is anaesthetic — a numb cornea ulcerates without pain",
                   "If neuralgia, carbamazepine is first-line; review response and sodium levels"] }),
  pons_hemi: ns(
    ["EMERGENCY CTA/MRA of the basilar artery — basilar occlusion is thrombectomy-eligible",
     "Urgent CT then MRI (DWI); CT identifies hypertensive pontine haemorrhage",
     "CHECK SODIUM and the rate of any recent correction — osmotic demyelination is the key non-vascular cause"],
    "emergency", "IMMEDIATE stroke team and neurointerventional referral; ICU for airway protection.",
    { immediate: ["ABCDE and airway protection — bulbar and respiratory failure are the immediate risks",
                  "Examine pupils (pinpoint but reactive suggests pontine haemorrhage) and conscious level",
                  "ASK THE PATIENT TO LOOK UP AND BLINK — they may be locked-in and fully aware",
                  "Bedside glucose; time last known well"],
      confirmatory: ["Vessel imaging to confirm basilar occlusion", "Review the sodium correction rate over the preceding days", "Vascular risk-factor work-up once stable"],
      monitoring: ["Continuous neuro-obs in critical care — progression to locked-in syndrome is the feared course",
                   "Correct hyponatraemia no faster than the recommended limit to avoid osmotic demyelination",
                   "Nil by mouth until swallow is formally assessed"] }),
  medulla_hemi: ns(
    ["Urgent MRI brain (DWI) + MRA/CTA head and neck — vertebral territory and DISSECTION",
     "Fat-saturated MRI of the neck if dissection is suspected (neck pain, young patient, recent trauma or manipulation)"],
    "emergency", "Acute stroke team — hyperacute pathway; keep nil by mouth until swallow is assessed.",
    { immediate: ["SWALLOW SCREEN before any oral intake — aspiration risk is high with medullary lesions",
                  "Assess respiratory effort; medullary lesions threaten respiratory drive",
                  "Examine tongue deviation, palate, and the crossed sensory pattern", "Bedside glucose; time last known well"],
      confirmatory: ["Vessel imaging for vertebral dissection", "Vascular risk-factor work-up: ECG/telemetry, lipids, HbA1c"],
      monitoring: ["Continuous neuro-obs and respiratory monitoring — medullary lesions can cause sudden respiratory failure",
                   "Dietitian and speech therapy input; consider nasogastric feeding early"] }),
  pontomesencephalic_tegmentum: ns(
    ["GIVE PARENTERAL THIAMINE IMMEDIATELY and empirically where there is any nutritional risk — do NOT wait for imaging or levels, and give it BEFORE any glucose",
     "MRI brain (including FLAIR/DWI of the mammillary bodies and periaqueductal region)",
     "Check anticonvulsant and lithium levels; bloods including LFTs, magnesium and B12"],
    "emergency", "Acute medicine/neurology; stroke team if the onset is abrupt.",
    { immediate: ["Give thiamine before glucose in any at-risk patient — a glucose load without thiamine can precipitate Wernicke's",
                  "Characterise the nystagmus (upbeat) and test gait, eye movements and orientation",
                  "Take an alcohol, nutritional and bariatric-surgery history"],
      confirmatory: ["MRI to look for mammillary body and periaqueductal change", "Drug levels; magnesium (thiamine is ineffective if magnesium is low)"],
      monitoring: ["Continue high-dose parenteral thiamine for the full course — under-treatment risks permanent Korsakoff amnesia",
                   "Repeat cognitive assessment; falls risk and physiotherapy"] }),
  guillain_mollaret_rubral: ns(
    ["MRI brain including the brainstem and the OLIVE — look for hypertrophic olivary degeneration and the original causative lesion",
     "Susceptibility-weighted imaging for a cavernoma or old haemorrhage"],
    "routine", "Neurology; neurosurgery if a cavernoma or resectable lesion is identified.",
    { immediate: ["Inspect the palate directly for rhythmic movement, and ask about ear clicking",
                  "Take a history for a brainstem event MONTHS earlier — the delay is the diagnostic clue",
                  "Test for accompanying cerebellar and brainstem signs"],
      confirmatory: ["MRI to demonstrate olivary hypertrophy (T2 hyperintensity and enlargement)",
                     "Imaging of the original lesion within the dentato-rubro-olivary triangle"],
      monitoring: ["Explain the delayed mechanism to the patient — it is not a new stroke",
                   "Treatment is often unsatisfactory; consider trials of clonazepam and review symptom burden"] }),
  guillain_mollaret_dentate: ns(
    ["MRI brain including the brainstem and the OLIVE — hypertrophic olivary degeneration plus the original causative lesion",
     "Susceptibility-weighted imaging for a cavernoma or old haemorrhage"],
    "routine", "Neurology; neurosurgery if a cavernoma or resectable lesion is identified.",
    { immediate: ["Inspect the palate for rhythmic movement and ask about ear clicking",
                  "Take a history for a brainstem or cerebellar event MONTHS earlier, including posterior-fossa surgery",
                  "Assess accompanying cerebellar signs"],
      confirmatory: ["MRI to demonstrate olivary hypertrophy", "Imaging of the causative lesion within the triangle"],
      monitoring: ["Explain the delayed mechanism — it is not a new event",
                   "Consider clonazepam; review symptom burden and functional impact"] }),
  locked_in: ns(
    ["EMERGENCY CTA/MRA of the basilar artery — basilar occlusion is thrombectomy-eligible well beyond the usual anterior-circulation window",
     "Urgent MRI brain (DWI) for the extent of pontine infarction; CT first if haemorrhage is suspected",
     "Check sodium and the rate of any recent correction — osmotic demyelination is the key non-vascular cause"],
    "emergency",
    "IMMEDIATE stroke team and neurointerventional referral for thrombectomy; ICU for airway protection.",
    { immediate: ["Ask the patient to look UP and to blink twice — preserved vertical eye movement and blinking establish that they are AWAKE and aware",
                  "Set up a yes/no communication code by blinking or vertical gaze BEFORE anything else, and tell the whole team the patient can hear them",
                  "Protect the airway; assess swallow and respiratory effort",
                  "Establish the time last known well"],
      confirmatory: ["Vessel imaging to confirm basilar occlusion and plan intervention",
                     "Vascular risk-factor work-up once stable: ECG/telemetry, lipids, HbA1c"],
      monitoring: ["Continuous neuro-obs in a critical-care setting — respiratory failure and progression are the immediate risks",
                   "Maintain the communication channel at every interaction; document that the patient is aware",
                   "Early involvement of speech and language therapy for augmentative communication"] }),
  brainstem_aras: ns(
    ["Urgent CT head then MRI (DWI) — a small paramedian tegmental lesion abolishes arousal",
     "CTA to assess the basilar artery (top-of-the-basilar occlusion)",
     "Screen the metabolic causes in parallel: glucose, sodium, calcium, ammonia, CO2, toxicology"],
    "emergency",
    "Acute stroke team + ICU; neurosurgery urgently if there is a mass with herniation.",
    { immediate: ["ABCDE and airway protection; bedside glucose",
                  "Examine pupils, brainstem reflexes and eye movements — PRESERVED symmetric brainstem reflexes with no focal signs point to a metabolic rather than structural cause",
                  "Look for a dilating pupil and falling conscious level, which indicate herniation"],
      confirmatory: ["MRI brainstem once stable", "Thiamine empirically if there is any nutritional risk", "EEG if non-convulsive status is possible"],
      monitoring: ["Continuous neuro-obs with GCS and pupils — deterioration means herniation until proven otherwise",
                   "Airway and respiratory monitoring in a critical-care setting"] }),
  thalamus_bilateral_percheron: ns(
    ["Urgent MRI brain (DWI) — bilateral paramedian thalamic infarcts, with an often NORMAL early CT",
     "CT/MR VENOGRAPHY as well as arterial imaging — bilateral thalamic change must prompt exclusion of deep cerebral venous thrombosis, which is treatable with anticoagulation",
     "Thrombophilia and pregnancy screen where venous thrombosis is suspected"],
    "emergency",
    "Acute stroke team; haematology input if deep venous thrombosis is confirmed.",
    { immediate: ["Assess conscious level, vertical gaze and memory — the triad of hypersomnolence, vertical gaze palsy and amnesia",
                  "Bedside glucose; establish time last known well",
                  "Airway protection if hypersomnolent"],
      confirmatory: ["Venography to exclude internal cerebral vein / straight sinus thrombosis",
                     "Thiamine empirically if there is nutritional risk (Wernicke's affects the medial thalami too)",
                     "Vascular risk-factor work-up: ECG/telemetry, lipids, HbA1c"],
      monitoring: ["Neuro-obs for conscious level; hypersomnolence may persist and fluctuate",
                   "Formal cognitive assessment — dense amnesia is often the lasting deficit and needs rehabilitation planning"] }),
  cerebellum_vermis: ns(
    ["Urgent CT/MRI posterior fossa — midline masses and infarcts here obstruct the fourth ventricle",
     "In a child with truncal ataxia and morning headache, image urgently for medulloblastoma",
     "Alcohol and nutritional history with thiamine, B12 and liver function"],
    "emergency",
    "Neurosurgery urgently if there is a mass, swelling or hydrocephalus; stroke team if vascular; neurology otherwise.",
    { immediate: ["Assess conscious level and look for headache, vomiting and papilloedema — signs of raised intracranial pressure",
                  "Test truncal and gait ataxia specifically (sitting unsupported, walking) — the vermis affects trunk and gait more than the limbs",
                  "Give thiamine empirically where there is alcohol or nutritional risk"],
      confirmatory: ["MRI with contrast to characterise a mass", "Paraneoplastic antibodies (anti-Yo, anti-Hu) if subacute", "Drug levels where relevant"],
      monitoring: ["Watch conscious level closely — posterior-fossa SWELLING can obstruct the fourth ventricle and cause fatal herniation, and it peaks at 2-4 days after infarction",
                   "Urgent neurosurgical review if consciousness declines: decompression can be life-saving",
                   "Falls risk assessment and physiotherapy"] }),
  cerebellum_flocculonodular: ns(
    ["Urgent MRI posterior fossa — a midline mass here obstructs the fourth ventricle",
     "Review medications and check anticonvulsant / lithium levels"],
    "urgent",
    "Neurosurgery if a mass or hydrocephalus; neurology otherwise; stroke team if acute vascular onset.",
    { immediate: ["Characterise the nystagmus and test gait and truncal stability",
                  "Look for headache, vomiting and papilloedema",
                  "Perform HINTS if this presented as acute vertigo — a central pattern means stroke, not neuritis"],
      confirmatory: ["MRI with contrast", "Drug levels; alcohol and nutritional screen"],
      monitoring: ["Watch conscious level for posterior-fossa swelling and obstructive hydrocephalus",
                   "Falls risk and vestibular rehabilitation"] }),
  cerebellum_pancerebellar: ns(
    ["MRI brain to assess cerebellar volume and exclude a structural or inflammatory cause",
     "Bloods: FBC, LFTs, TSH, B12, vitamin E, coeliac serology, and DRUG LEVELS (phenytoin, lithium, carbamazepine)",
     "Copper and caeruloplasmin in anyone under 50 — Wilson's disease is treatable"],
    "urgent",
    "Neurology; urgent if subacute, since paraneoplastic degeneration may precede the cancer diagnosis.",
    { immediate: ["Full drug and alcohol history — the commonest reversible causes",
                  "Test limb, gait, truncal ataxia, speech and eye movements to establish the pattern",
                  "Lying and standing blood pressure to look for the autonomic failure of MSA-C"],
      confirmatory: ["PARANEOPLASTIC antibody panel (anti-Yo, anti-Hu, anti-Tr) with CT chest/abdomen/pelvis if subacute",
                     "Genetic testing for spinocerebellar ataxia where there is a family history",
                     "Slit-lamp for Kayser-Fleischer rings if Wilson's is possible"],
      monitoring: ["Re-check drug levels after adjustment — much of the deficit may be reversible",
                   "Falls risk assessment, physiotherapy and speech therapy",
                   "If paraneoplastic antibodies are positive but imaging is clear, repeat cancer screening — the tumour may declare itself later"] }),
  pseudobulbar_corticobulbar: ns(
    ["MRI brain — bilateral corticobulbar involvement from vascular disease, demyelination or a degenerative process",
     "Swallow assessment before any oral intake"],
    "urgent",
    "Neurology; urgent MND referral if there are mixed upper and lower motor neurone signs.",
    { immediate: ["SWALLOW SCREEN before oral intake — aspiration is the immediate risk",
                  "Examine the jaw jerk and the tongue: a brisk jaw jerk with a small spastic tongue is pseudobulbar (UMN); a wasted, fasciculating tongue with an absent jaw jerk is bulbar (LMN); BOTH together suggest motor neurone disease",
                  "Ask about emotional lability (laughing or crying out of keeping with mood) and explain it is a neurological sign, not a mood disorder"],
      confirmatory: ["EMG and nerve conduction studies if motor neurone disease is suspected",
                     "Vascular risk-factor work-up if multi-infarct", "MRI to assess demyelination or a PSP pattern"],
      monitoring: ["Dietitian and speech therapy input; consider PEG feeding early if swallowing deteriorates",
                   "Monitor respiratory function where motor neurone disease is suspected",
                   "Treat emotional lability if distressing, and counsel the patient and family about what it is"] }),
  // brainstem / posterior circulation strokes
  medulla_lateral: ns( // Wallenberg
    ["Urgent MRI brain (DWI) + MRA/CTA head & neck — assess vertebral/PICA territory and dissection"],
    "emergency", "Acute stroke team — hyperacute pathway; keep nil by mouth until swallow assessed.",
    { immediate: ["Bedside swallow screen before any oral intake (aspiration risk)", "ABCDE, IV access, bedside glucose"],
      confirmatory: ["Vessel imaging for dissection (fat-sat MRI neck)", "Vascular risk-factor work-up (ECG/telemetry, lipids, HbA1c)"] }),
  medulla_medial: ns( // Dejerine
    ["Urgent MRI brain (DWI) + MRA/CTA — anterior spinal / vertebral territory and dissection"],
    "emergency", "Acute stroke team — hyperacute pathway."),
  midbrain_medial: ns( // Weber
    ["Urgent MRI brain + vascular imaging; crossed brainstem signs may be haemorrhage, so include CT/GRE"],
    "emergency", "Acute stroke team; image before assuming infarct."),
  pons_medial: ns( // Millard-Gubler / Foville
    ["Urgent MRI brain + MRA (basilar territory)", "Consider CT if haemorrhage suspected"],
    "emergency", "Acute stroke team — basilar disease can progress to locked-in; monitor closely.",
    { monitoring: ["Frequent neuro-obs — basilar disease can progress rapidly to locked-in syndrome"] }),
  central_vestibular_nucleus: ns( // central AVS / HINTS-central
    ["Urgent MRI brain (DWI, posterior fossa) — a normal head-impulse with skew/direction-changing nystagmus suggests stroke, not neuritis"],
    "emergency", "Acute stroke team — do not discharge as peripheral vertigo.",
    { immediate: ["Perform HINTS at the bedside; a central pattern (normal head-impulse, skew, direction-changing nystagmus) is a red flag"] }),
  // skull base
  skull_base_cavernous_sinus: ns(
    ["MRI brain + orbits with contrast + MRV (cavernous sinus)", "Inflammatory markers; blood cultures if septic thrombosis suspected"],
    "urgent", "Neurosurgery / ophthalmology; septic cavernous sinus thrombosis needs urgent antimicrobials + neurosurgical input."),
  skull_base_optic_aion: ns( // AION — exclude GCA
    ["Immediate ESR + CRP (± platelets) to exclude giant-cell arteritis", "Temporal artery ultrasound / biopsy if GCA suspected"],
    "emergency", "Same-day ophthalmology + rheumatology if GCA suspected — sight- and life-threatening.",
    { immediate: ["Same-day ESR/CRP/platelets; if GCA is strongly suspected escalate urgently — do not wait for biopsy to seek specialist review"],
      monitoring: ["Sight- and life-threatening: monitor the other eye and for systemic GCA features"] }),
  skull_base_optic_neuritis: ns(
    ["MRI brain + orbits with contrast (demyelination)", "Aquaporin-4 (NMO) and MOG antibodies"],
    "urgent", "Neurology / neuro-ophthalmology."),
  skull_base_cpa: ns(
    ["MRI internal auditory meatus with contrast", "Pure-tone audiogram"],
    "routine", "ENT / skull-base neurosurgery."),
  // cord
  cord_anterior: ns(
    ["Urgent whole-spine MRI to exclude cord compression", "If non-compressive: consider vascular / inflammatory (MRI cord signal, LP, aquaporin-4/MOG)"],
    "emergency", "Spinal surgery / neurology — cord compression is time-critical.",
    { immediate: ["Examine for a sensory level; post-void bladder scan; assess perianal sensation + anal tone"],
      monitoring: ["Serial power/sensory level and bladder function — deterioration is a surgical emergency"] }),
  // cortex / deep vascular
  cortex_mca: ns(
    ["Immediate non-contrast CT head, then CT/MR angiography + perfusion", "Bloods incl. glucose; ECG"],
    "emergency", "Hyperacute stroke pathway — assess for thrombolysis / thrombectomy within the window.",
    { immediate: ["Confirm time of onset (last-known-well), bedside glucose, and NIHSS — the clock drives treatment",
                  "Bedside swallow screen before any oral intake"],
      monitoring: ["Serial conscious level for malignant MCA oedema — deterioration on day 2–5 with midline shift warrants an urgent neurosurgical discussion about decompressive hemicraniectomy",
                   "Neuro-obs, blood pressure and glucose per the hyperacute stroke protocol"] }),
  cortex_mca_superior: ns(
    ["Immediate non-contrast CT head, then CT angiography (± CT perfusion) — this presentation is a large-vessel occlusion until proven otherwise",
     "Bloods incl. glucose and clotting; ECG for atrial fibrillation"],
    "emergency", "Hyperacute stroke pathway — thrombolysis and thrombectomy assessment; involve the thrombectomy centre early.",
    { immediate: ["Confirm last-known-well, bedside glucose and NIHSS — gaze deviation with face/arm weakness and aphasia scores high and predicts a large-vessel occlusion",
                  "Bedside swallow screen before any oral intake"] }),
  cortex_mca_inferior: ns(
    ["Immediate non-contrast CT head, then CT/MR angiography — fluent aphasia or neglect without weakness is still a large-vessel syndrome",
     "Bloods incl. glucose; ECG and prolonged cardiac monitoring for atrial fibrillation"],
    "emergency", "Hyperacute stroke pathway; if febrile or seizing, involve neurology / infection in parallel for suspected encephalitis.",
    { immediate: ["Fluent-but-nonsensical speech or dense neglect is easily mislabelled as delirium or a psychiatric presentation — test formally for aphasia and neglect, and confirm last-known-well",
                  "Bedside glucose and NIHSS; swallow screen before any oral intake"],
      confirmatory: ["Vascular risk-factor work-up (prolonged ECG monitoring, echocardiogram, lipids, HbA1c)",
                     "If fever, seizures or a temporal-lobe picture: MRI brain and lumbar puncture with HSV PCR — suspected herpes encephalitis needs same-hour specialist input, not a wait for the result"] }),
  cortex_aca: ns(
    ["Immediate non-contrast CT head, then CT/MR angiography of the anterior circulation",
     "Include venous imaging (CT venography / MRV) — superior sagittal sinus thrombosis presents identically with leg weakness and seizures",
     "Bloods incl. glucose and clotting; ECG"],
    "emergency", "Hyperacute stroke pathway; neurosurgery if a parasagittal mass or aneurysmal subarachnoid haemorrhage is found.",
    { immediate: ["Confirm last-known-well, bedside glucose and NIHSS; ask specifically about a thunderclap headache (aneurysmal subarachnoid haemorrhage)",
                  "Test the legs against the arms — leg-predominant weakness with a spared face is the ACA signature"],
      confirmatory: ["If the picture is bilateral or progressive: MRI brain with contrast for a parasagittal meningioma, plus a thrombophilia and malignancy screen if the sinus is thrombosed",
                     "Vascular risk-factor work-up (ECG/telemetry, echocardiogram, lipids, HbA1c)"] }),
  cortex_pca: ns(
    ["Immediate non-contrast CT head, then CT/MR angiography of the posterior circulation",
     "Bloods incl. glucose; ECG and prolonged cardiac monitoring (PCA infarcts are often cardioembolic)"],
    "emergency", "Hyperacute stroke pathway — posterior-circulation stroke; ophthalmology if the field defect persists.",
    { immediate: ["Formally test the visual fields to confrontation in all four quadrants — an isolated homonymous hemianopia is the deficit most often missed",
                  "Confirm last-known-well, bedside glucose and NIHSS (a pure hemianopia scores low but is still a stroke)"],
      monitoring: ["Document the field defect and its functional impact; arrange formal perimetry and give driving advice per local regulations"] }),
  cortex_occipital: ns(
    ["Immediate non-contrast CT head, then CT/MR angiography of the posterior circulation",
     "Bloods incl. glucose; ECG and prolonged cardiac monitoring"],
    "emergency", "Hyperacute stroke pathway — posterior-circulation stroke; ophthalmology if the field defect persists.",
    { immediate: ["Formally test the visual fields to confrontation — an isolated homonymous hemianopia is easily overlooked",
                  "Confirm last-known-well, bedside glucose and NIHSS"],
      monitoring: ["Document the field defect and its functional impact; arrange formal perimetry and give driving advice per local regulations"] }),
  cortex_watershed_anterior: ns(
    ["MRI brain (DWI) — border-zone infarcts are easily missed on CT",
     "Carotid imaging (Doppler / CTA / MRA) for severe stenosis or occlusion",
     "Find the haemodynamic trigger: blood-pressure chart, ECG, echocardiogram, haemoglobin, septic screen"],
    "emergency", "Acute stroke team — the mechanism is haemodynamic, so define and treat the cause of the hypoperfusion and assess the carotids.",
    { immediate: ["Look for the hypoperfusion trigger at the bedside — blood pressure lying and standing, sepsis, bleeding, arrhythmia, or a recent cardiac or surgical event",
                  "Review recent antihypertensives and any blood-pressure lowering; bedside glucose"],
      monitoring: ["Border-zone territory is pressure-dependent: monitor for recurrent deficits on standing or with blood-pressure lowering, and escalate early"] }),
  cortex_watershed_posterior: ns(
    ["MRI brain (DWI) — border-zone infarcts are easily missed on CT",
     "Carotid imaging (Doppler / CTA / MRA) for severe stenosis or occlusion",
     "Find the haemodynamic trigger: blood-pressure chart, ECG, echocardiogram, haemoglobin, septic screen"],
    "emergency", "Acute stroke team — haemodynamic mechanism; assess the carotids. Cognitive/speech therapy input if the aphasia persists.",
    { immediate: ["Look for the hypoperfusion trigger at the bedside — blood pressure lying and standing, sepsis, bleeding, arrhythmia, or a recent cardiac or surgical event",
                  "Test repetition specifically: preserved repetition with poor comprehension points to the border zone rather than the perisylvian core"],
      monitoring: ["Border-zone territory is pressure-dependent: monitor for recurrent deficits on standing or with blood-pressure lowering, and escalate early"] }),
  cortex_motor_facearm: ns(
    ["Immediate non-contrast CT head, then CT/MR angiography (± perfusion)", "Bloods incl. glucose; ECG"],
    "emergency", "Hyperacute stroke pathway — assess for thrombolysis / thrombectomy within the window.",
    { immediate: ["Confirm last-known-well, bedside glucose and NIHSS; face/arm-predominant weakness with the leg spared is a cortical MCA pattern"] }),
  cortex_motor_leg: ns(
    ["Immediate non-contrast CT head, then CT/MR angiography of the anterior circulation",
     "Include venous imaging (CT venography / MRV) if there is headache, seizures or bilateral leg weakness",
     "Bloods incl. glucose; ECG"],
    "emergency", "Hyperacute stroke pathway; neurosurgery if a parasagittal mass is found.",
    { immediate: ["Confirm last-known-well, bedside glucose and NIHSS; leg-predominant weakness with a spared face points to the ACA territory, not the cord"],
      confirmatory: ["If progressive or bilateral: MRI brain with contrast for a parasagittal meningioma — a cord MRI alone will miss it",
                     "Vascular risk-factor work-up (ECG/telemetry, echocardiogram, lipids, HbA1c)"] }),
  cortex_sensory_facearm: ns(
    ["Immediate non-contrast CT head, then CT/MR angiography (± perfusion)", "Bloods incl. glucose; ECG"],
    "emergency", "Hyperacute stroke pathway — a sensory-only cortical deficit is still a stroke.",
    { immediate: ["Test cortical sensory modalities specifically — stereognosis, graphaesthesia, two-point discrimination and sensory extinction; crude touch and pain may be normal",
                  "Confirm last-known-well, bedside glucose and NIHSS"] }),
  cortex_sensory_leg: ns(
    ["Immediate non-contrast CT head, then CT/MR angiography of the anterior circulation",
     "Include venous imaging (CT venography / MRV) if there is headache, seizures or bilateral leg symptoms",
     "Bloods incl. glucose; ECG"],
    "emergency", "Hyperacute stroke pathway; neurosurgery if a parasagittal mass is found.",
    { immediate: ["Map the sensory loss against the arm and face — leg-predominant cortical sensory loss points to the ACA territory rather than the cord",
                  "Confirm last-known-well, bedside glucose and NIHSS"],
      confirmatory: ["If progressive or bilateral: MRI brain with contrast for a parasagittal meningioma — a cord MRI alone will miss it",
                     "Vascular risk-factor work-up (ECG/telemetry, echocardiogram, lipids, HbA1c)"] }),
  cortex_parietal: ns(
    ["Immediate non-contrast CT head, then CT/MR angiography — a focal cortical syndrome without weakness still needs urgent imaging",
     "Bloods incl. glucose; ECG and prolonged cardiac monitoring for atrial fibrillation"],
    "emergency", "Hyperacute stroke pathway; neurology / cognitive clinic if the course turns out to be progressive rather than abrupt.",
    { immediate: ["Test formally for neglect and extinction (line bisection, double simultaneous stimulation) and for the Gerstmann tetrad — anosognosia means the patient will not report the deficit, so corroborate with a relative",
                  "Confirm last-known-well, bedside glucose and NIHSS"],
      confirmatory: ["Vascular risk-factor work-up (prolonged ECG monitoring, echocardiogram, lipids, HbA1c)",
                     "If the history is months rather than minutes: MRI with volumetric sequences and neuropsychometry for posterior cortical atrophy"],
      monitoring: ["Neglect is a major falls and safety risk — occupational-therapy assessment before mobilising or discharge"] }),
  subcortex_internal_capsule: ns( // lacune
    ["MRI brain (DWI) — small-vessel lacune", "Vascular risk-factor screen (BP, glucose, lipids); consider hypertensive haemorrhage on CT"],
    "urgent", "Stroke team / TIA clinic."),
  // motor unit
  motor_unit_anterior_horn: ns( // MND / SMA
    ["EMG / nerve conduction studies", "MRI brain + cord to exclude a structural mimic"],
    "routine", "Neuromuscular / MND clinic."),
  motor_unit_nmj_postsynaptic: ns( // myasthenia
    ["Acetylcholine-receptor (± MuSK) antibodies", "Repetitive nerve stimulation / single-fibre EMG", "CT chest for thymoma"],
    "urgent", "Neurology — watch for bulbar/respiratory involvement (myasthenic crisis).",
    { immediate: ["Bedside respiratory function (FVC / single-breath count) + bulbar/swallow check"],
      monitoring: ["Serial FVC — a myasthenic crisis needs prompt supported ventilation"] }),
  // peripheral vestibular
  peripheral_vestibular_labyrinth: ns(
    ["Clinical HINTS exam (peripheral pattern); audiometry if hearing involved"],
    "routine", "Usually self-limiting; ENT / neurology if atypical or central features."),
};

// ---- derive fallback (derive-don't-store) — first-line investigations keyed off site.level / territory ----
function derive(site) {
  const terr = (site.territory || "").toLowerCase();
  const vasc = /aca|mca|pca|pica|aica|\bsca\b|basilar|vertebral|perforator|lenticulostriate|spinal artery|choroidal/.test(terr);
  if (vasc) return ns(["Immediate non-contrast CT head, then CT/MR angiography"], "emergency", "Acute stroke pathway.");
  switch (site.level) {
    case "cord":
      return ns(["Urgent whole-spine MRI to exclude cord compression"], "emergency", "Spinal surgery / neurology — cord compression is time-critical.");
    case "cauda": case "conus":
      return ns(["Urgent lumbosacral MRI (cauda equina / conus)", "Post-void bladder scan"], "emergency", "Emergency spinal surgery — cauda equina is time-critical.");
    case "skull_base":
      return ns(["MRI skull base with contrast", "Targeted bloods per the differential"], "urgent", "Neurosurgery / ENT / ophthalmology as appropriate.");
    case "nerve": case "root": case "plexus":
      return ns(["Nerve conduction studies / EMG", "Imaging if a compressive cause is suspected"], "routine", "Neurology / neurophysiology.");
    case "motor_unit": case "polyneuropathy":
      return ns(["Nerve conduction studies / EMG", "Screening bloods (glucose, B12, TFTs, immunoglobulins)"], "routine", "Neuromuscular clinic.");
    case "cerebellum": case "midbrain": case "pons": case "medulla":
      return ns(["MRI brain (posterior fossa) + vascular imaging"], "urgent", "Neurology / stroke team.");
    default:
      return ns(["MRI of the relevant region", "Targeted bloods per the differential"], "routine", "Neurology outpatient referral.");
  }
}

// ---- derived tiers: bedside / confirmatory / monitoring, from urgency + region (fill when not curated) ----
const has = (level, ...ls) => ls.includes(level);
const bulbarLevel = s => has(s.level, "medulla", "pons", "pseudobulbar", "brainstem_aras") || /bulbar/.test(s.part || "");
const cordLevel = s => has(s.level, "cord", "cauda", "conus", "combined_degeneration");
const arousalLevel = s => has(s.level, "brainstem_aras", "thalamus_arousal", "cerebrum", "locked_in");
const nmuLevel = s => has(s.level, "motor_unit", "polyneuropathy");
const opticLevel = s => s.level === "visual_pathway" || /optic/.test(s.part || "");
const vestibularLevel = s => has(s.level, "peripheral_vestibular", "central_vestibular");

function regionBedside(site) {
  const out = [];
  if (bulbarLevel(site)) out.push("Bedside swallow screen; keep nil by mouth until safe (aspiration risk)");
  if (cordLevel(site)) out.push("Post-void bladder scan; check perianal sensation + anal tone; document any sensory level");
  if (arousalLevel(site)) out.push("GCS + pupils; protect the airway; check glucose");
  if (nmuLevel(site)) out.push("Bedside respiratory function (FVC / single-breath count); watch for bulbar/respiratory involvement");
  if (opticLevel(site)) out.push("Visual acuity, fields to confrontation, colour vision, and fundoscopy");
  if (vestibularLevel(site)) out.push("HINTS exam; look for direction-changing or vertical nystagmus and skew (central pattern)");
  return out;
}

function deriveImmediate(site, urgency) {
  const general = urgency === "emergency"
    ? ["ABCDE assessment; IV access; bedside glucose", "Escalate early to the relevant acute team"]
    : urgency === "urgent"
    ? ["Baseline observations and bedside glucose"]
    : ["Document a full baseline neurological examination"];
  return [...regionBedside(site), ...general];
}

function deriveConfirmatory(site) {
  const terr = (site.territory || "").toLowerCase();
  const vasc = /aca|mca|pca|pica|aica|\bsca\b|basilar|vertebral|perforator|lenticulostriate|spinal artery|choroidal/.test(terr);
  if (vasc || has(site.level, "midbrain", "pons", "medulla", "cerebellum", "cortex", "subcortex"))
    return ["Vascular risk-factor work-up (ECG/telemetry, echocardiogram, lipids, HbA1c)", "If imaging non-diagnostic: consider LP and a vasculitis/autoimmune screen"];
  if (cordLevel(site))
    return ["If non-compressive: MRI cord signal, LP (oligoclonal bands), aquaporin-4/MOG antibodies, B12/copper"];
  if (site.level === "skull_base")
    return ["Contrast MRI ± CT bone windows; targeted bloods per the differential; biopsy if a mass is found"];
  if (has(site.level, "nerve", "root", "plexus", "polyneuropathy"))
    return ["Screening bloods (glucose/HbA1c, B12, TFTs, immunoglobulins, ESR/CRP)", "Imaging or LP if a compressive or inflammatory cause is suspected"];
  if (site.level === "motor_unit")
    return ["Relevant antibodies (AChR/MuSK; anti-neuronal if paraneoplastic suspected)", "Respiratory function tests"];
  if (opticLevel(site))
    return ["OCT + formal perimetry; contrast MRI orbits/brain; aquaporin-4/MOG antibodies"];
  return ["Targeted second-line tests guided by the leading differential"];
}

function deriveMonitoring(site, urgency) {
  const out = [];
  if (urgency === "emergency") out.push("Continuous monitoring; escalate on any deterioration");
  else if (urgency === "urgent") out.push("Safety-net and review promptly; give clear return advice");
  else out.push("Review with results; safety-net for any red-flag features");
  if (bulbarLevel(site)) out.push("Aspiration/respiratory watch until swallow confirmed safe");
  else if (cordLevel(site)) out.push("Monitor bladder/bowel function and for any progression");
  else if (nmuLevel(site)) out.push("Monitor respiratory function (FVC) if weakness is progressing");
  return out;
}

// ---- public API ----
export function nextStepsFor(site) {
  const key = NEXT[site.id] ? site.id : `${site.level}_${site.part}`;
  const base = NEXT[key] ? { ...NEXT[key], curated: true } : { ...derive(site), curated: false };
  return {
    immediate: base.immediate || deriveImmediate(site, base.urgency),
    investigations: base.investigations || [],
    confirmatory: base.confirmatory || deriveConfirmatory(site),
    monitoring: base.monitoring || deriveMonitoring(site, base.urgency),
    urgency: base.urgency,
    referral: base.referral,
    curated: base.curated,
  };
}

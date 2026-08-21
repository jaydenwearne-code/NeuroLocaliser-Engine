// mimic.js — pathology workups for the MIMIC category.
//
// A mimic is NOT a lesion at this site at all, so the workup's job is to exclude it fast, before the
// structural pathway is embarked on.
//
// Content only — the builders live in ./builders.js and the public API in ../pathologyNextSteps.js.
// Teaching prompts, not directives: no doses, no definitive management.
//
// REVIEW STATUS: ✅ ALL SIGNED OFF by the owner (a clinician), 2026-08-18.
//   Tranche 1 — hypoglycaemia. Tranche 2 (round 9) — the not-a-lesion-here family.
import { dz, family } from "./builders.js";


// THE MIMICS. These are NOT lesions at the site the app has landed on, so the workup's job is to EXCLUDE
// them quickly and cheaply, before the structural pathway is embarked on. Every one of them is a diagnosis
// the reader can make at the bedside or with a single test, and every one of them is regularly imaged
// first instead.
const MIMIC_SPINE = {
  confirmatory: [
    "ASK WHETHER THIS IS A LESION AT ALL. The finding that should stop you is a deficit that does not fit ONE place, or one that fluctuates, or one in a patient whose story does not match a structural cause: {flavour}",
    "The confirming test here is usually simple and quick, and doing it FIRST costs almost nothing while doing it last costs the patient a pathway",
    "Examine {level}, and re-examine after any intervention — a deficit that resolves with a simple measure was never structural",
    "Where the mimic is confirmed, say so explicitly in the record: an undocumented near-miss becomes someone else's structural work-up next week",
  ],
  monitoring: [
    "SAFETY NET: A MIMIC AND A LESION CAN COEXIST. Confirming the mimic does not exclude structural disease, and a deficit that persists after the mimic is treated needs the structural pathway after all",
    "Track {level} against the treatment of the mimic: resolution confirms it, persistence refutes it, and that is the most informative test available",
    "Document the reasoning rather than only the conclusion — the next clinician needs to know what was considered and excluded, not just the label",
  ],
  urgency: "urgent",
  referral: "As the mimic dictates — often no neurological referral at all, which is the point",
};


// ---- ROUND 10 (tranche 3): the mimic bucket ----
// This category is different in kind from the other nine. A mimic is NOT A LESION AT THIS SITE, so the
// work-up is not "what is the lesion" but "how do I show there isn't one" — and, more usefully, "what is
// the positive evidence for the alternative". Three families cover thirty of the forty-five.

// FOCAL SEIZURE AND ITS POSTICTAL DEFICIT — the great structural mimic. Nineteen names, one disease.
// What unites them is that the deficit is PRODUCED rather than lost: seizures make positive phenomena that
// spread, and the weakness comes AFTERWARDS and resolves.
const FOCAL_SEIZURE = {
  confirmatory: [
    "IMAGE FIRST AND URGENTLY. A first focal seizure is a STRUCTURAL question — the seizure is the symptom, and the lesion causing it is the diagnosis. Calling it 'just a seizure' without imaging is the error this whole category invites",
    "EEG supports and localises but a NORMAL INTERICTAL EEG NEVER EXCLUDES EPILEPSY — most are normal between events, so a clean study must not be used to overturn a good history",
    "{flavour}",
    "TAKE THE HISTORY FROM A WITNESS. The distinction from stroke lives in the account: seizures produce POSITIVE phenomena that MARCH over seconds, where a stroke produces loss at maximum intensity from the outset",
  ],
  monitoring: [
    "{level}",
    "A TODD'S DEFICIT RESOLVES — usually within hours, occasionally over a day or two. A deficit that does NOT resolve was never postictal, and needs re-imaging rather than more anticonvulsant",
    "DRIVING, and it is a legal obligation rather than advice: give the rules in writing at the first consultation. Also cover swimming, bathing, heights and working alone",
  ],
  urgency: "urgent",
  referral: "First-seizure clinic or neurology; ED with urgent imaging where the deficit has not resolved.",
};

// MIGRAINE AND ITS AURAS — the other great mimic. The spine is the same: aura is POSITIVE, SPREADS SLOWLY
// over minutes, and RESOLVES; and a first presentation is never diagnosed without excluding the vascular
// alternative.
const MIGRAINE_AURA = {
  confirmatory: [
    "THE TEMPO IS THE DIAGNOSIS: aura builds over MINUTES (typically five to twenty) and resolves within an hour. A stroke is maximal at onset and a seizure marches over SECONDS — the three are separated by the clock more reliably than by the phenomenology",
    "{flavour}",
    "A FIRST EPISODE IS NOT MIGRAINE UNTIL IMAGED, particularly with new aura over fifty, aura that is always on the same side, or any residual deficit — cortical spreading depression is a diagnosis of exclusion the first time",
    "Take a headache history including previous auras, family history, and triggers — a long history of identical stereotyped episodes is the strongest evidence available",
  ],
  monitoring: [
    "{level}",
    "SAFETY NET: any aura that persists beyond an hour, changes character, or leaves a deficit needs same-day reassessment for infarction",
    "Migraine with aura raises stroke risk — review COMBINED HORMONAL CONTRACEPTION, which is contraindicated with aura, and address smoking and other vascular risk",
  ],
  urgency: "urgent",
  referral: "Neurology; ED same-day for a first or atypical episode.",
};

// A PERIPHERAL LESION MASQUERADING AS A CENTRAL ONE. The commonest and most embarrassing error in the
// other direction: the patient does not have a stroke or a cord lesion, they have a compressed nerve.
const PERIPHERAL_MIMIC = {
  confirmatory: [
    "THE DISTRIBUTION IS THE ANSWER, and it is a bedside question rather than an imaging one — map the deficit against NERVE and ROOT territories before accepting a central explanation",
    "{flavour}",
    "NERVE CONDUCTION STUDIES confirm it objectively and are far cheaper than the imaging pathway a wrong central label triggers",
    "Check the reflexes and tone: a peripheral lesion gives depressed reflexes and normal or reduced tone, where a central one eventually gives brisk reflexes and an extensor plantar",
  ],
  monitoring: [
    "{level}",
    "TREATING THIS AS A CENTRAL LESION COSTS THE PATIENT the treatable diagnosis — and these are treatable: splinting, decompression or simply removing the compression",
    "Where both could be present, say so and treat both rather than choosing; a peripheral lesion and a central one coexist more often than either is suspected",
  ],
  urgency: "routine",
  referral: "Neurophysiology; hand or orthopaedic surgery where decompression is indicated.",
};

export default {
  // ---- SINGLETON MIMICS ----
  "Delirium": dz("Delirium", {
    slots: { flavour: "the deficit is one of ATTENTION rather than of a domain" },
    bySite: {
      cortex_temporoparietal: { flavour: "delirium imitates a fluent aphasia — but the language is INCOHERENT rather than paraphasic, and the giveaway is that ATTENTION fails first: test it before concluding aphasia" },
      cortex_mca_inferior: { flavour: "an acute confusional state imitates a non-dominant inferior-division stroke, and both produce neglect-like inattention — the fluctuation over hours is what separates them" },
      cortex_parietal: { flavour: "inattention in delirium is GLOBAL, where parietal neglect is SPATIAL and lateralised: a patient who ignores one side consistently has neglect, one who ignores everything intermittently has delirium" },
    },
    confirmatory: [
      "IT IS A DIAGNOSIS OF EXCLUSION AND A MEDICAL EMERGENCY — screen for the cause rather than the phenomenon: infection, hypoxia, retention, constipation, pain, drugs, alcohol withdrawal and electrolytes",
      "{flavour}",
      "USE A VALIDATED TOOL (4AT or CAM) — delirium is missed in the majority of cases when clinical impression alone is used, particularly the hypoactive form",
      "Establish the BASELINE from a relative or carer: without it, delirium and dementia cannot be separated, and the distinction changes everything",
    ],
    monitoring: [
      "THE HYPOACTIVE FORM IS COMMONER AND MISSED MORE OFTEN — a quiet, withdrawn patient is not 'settled', and has a worse prognosis than the agitated one",
      "Non-pharmacological management first: orientation, glasses, hearing aids, sleep, mobility, hydration. Sedation treats the staff rather than the patient",
      "SAFETY NET: delirium that does not resolve as the cause is treated needs re-evaluation — for a subdural, a stroke or an underlying dementia",
    ],
    urgency: "urgent",
    referral: "Acute medicine or the parent team; old-age psychiatry where it persists.",
  }),

  "Depression": dz("Depression", {
    confirmatory: [
      "THE DISCRIMINATION FROM APATHY IS THE POINT: an apathetic patient is NOT DISTRESSED by their inactivity, where a depressed one is. Ask about distress, guilt and hopelessness rather than about activity",
      "Screen formally, and take a collateral history — families describe the change better than the patient does",
      "Exclude the organic contributors: thyroid, B12, medication (including steroids and beta-blockers), alcohol, and obstructive sleep apnoea",
      "Where the presentation is late-onset with prominent cognitive complaint, image and consider a frontal lesion — an orbitofrontal or medial frontal tumour presents as depression",
    ],
    monitoring: [
      "ASK ABOUT SUICIDAL THOUGHTS EXPLICITLY at every review; the question does not plant the idea and omitting it is the avoidable harm",
      "Pseudodementia — cognitive impairment from depression — improves with treatment; if it does not, reconsider a neurodegenerative cause",
      "Antidepressants do not treat apathy from a frontal lesion, so a non-response should prompt reconsideration rather than a dose increase",
    ],
    urgency: "urgent",
    referral: "Primary care or psychiatry; neurology if there are any focal signs or a late first presentation.",
  }),

  "Benign fasciculation syndrome": dz("Benign fasciculation syndrome", {
    confirmatory: [
      "FASCICULATIONS WITHOUT WEAKNESS, WASTING OR REFLEX CHANGE ARE BENIGN — the presence of any one of those three is what makes it not benign, and the examination is therefore the test",
      "EMG where there is any doubt: benign fasciculations show NO denervation, and that normal study is the reassurance a worried patient needs",
      "Check thyroid function, magnesium and caffeine intake, and ask about anxiety — these patients have very often already searched the internet and arrived terrified of MND",
      "Take a history of exercise, stress and sleep deprivation, which are the usual triggers",
    ],
    monitoring: [
      "REASSURANCE IS THE TREATMENT, and it needs to be specific rather than general: explain WHY it is not MND — no weakness, no wasting, normal reflexes, normal EMG — because vague reassurance does not work here",
      "Offer a single review at a few months rather than open-ended follow-up; the deficit that would change the diagnosis appears within that time",
      "Address the anxiety directly, which is often the more disabling problem",
    ],
    urgency: "routine",
    referral: "Neurology for one assessment; neurophysiology if the examination is not entirely normal.",
  }),

  "Essential tremor (the mimic)": dz("Essential tremor (the mimic)", {
    confirmatory: [
      "IT IS AN ACTION TREMOR, present on posture and movement and ABSENT AT REST — where parkinsonian tremor is the opposite. Watch the hands at rest, on outstretched arms, and finger-to-nose to separate them",
      "Ask about ALCOHOL RESPONSE and FAMILY HISTORY — both support essential tremor and neither features in Parkinson's disease",
      "Look for the parkinsonian features that would refute it: bradykinesia with decrement on repetitive movement, rigidity, and reduced arm swing",
      "Check thyroid function and review drugs — salbutamol, lithium, valproate and caffeine all produce an enhanced physiological tremor",
    ],
    monitoring: [
      "Head and voice tremor favour essential tremor; a strictly unilateral rest tremor favours Parkinson's, and the two coexist often enough that a changing picture warrants review",
      "Treat when it is functionally or socially disabling rather than because it exists",
      "Where the diagnosis remains unclear, a DaT scan separates them — but the clinical examination is right most of the time",
    ],
    urgency: "routine",
    referral: "Neurology or movement disorders clinic.",
  }),

  "Transient global amnesia (the mimic)": dz("Transient global amnesia (the mimic)", {
    confirmatory: [
      "THE SYNDROME IS DEFINED BY WHAT IS PRESERVED: isolated anterograde amnesia with REPETITIVE QUESTIONING, personal identity intact, no focal signs, and full resolution within 24 hours",
      "ANY FOCAL SIGN, ANY LOSS OF PERSONAL IDENTITY, OR A DURATION BEYOND 24 HOURS MEANS IT IS NOT TGA — and the alternatives are stroke, seizure and a dissociative state",
      "MRI with diffusion imaging performed at 24–72 hours shows punctate hippocampal lesions in many cases; scanning immediately is often negative, so timing matters",
      "Consider transient EPILEPTIC amnesia where episodes are RECURRENT, brief or on waking — that is a different, treatable diagnosis",
    ],
    monitoring: [
      "REASSURE ABOUT RECURRENCE: it is uncommon, and this is not a stroke or a warning of dementia — that is the question the patient and family are actually asking",
      "The amnesic gap for the episode itself is permanent; say so, because patients keep trying to recall it",
      "Recurrent episodes warrant EEG and reconsideration rather than repeated reassurance",
    ],
    urgency: "urgent",
    referral: "ED or neurology for the first episode; neurology for recurrences.",
  }),

  "Anorexia nervosa (the mimic)": dz("Anorexia nervosa (the mimic)", {
    confirmatory: [
      "WEIGHT LOSS WITH A DISTORTED BODY IMAGE AND FEAR OF WEIGHT GAIN is a psychiatric diagnosis, where a hypothalamic lesion causes weight loss WITHOUT those features — the attitude to the weight is the discriminator",
      "IMAGE THE HYPOTHALAMUS where the picture is atypical: young age at onset, absent body-image concern, or any endocrine or visual abnormality. A diencephalic tumour has been mistaken for anorexia nervosa for years at a time",
      "Full endocrine screen and DEXA; the endocrine changes of starvation are reversible and those of a lesion are not",
      "ECG and electrolytes — the cardiac risk is what kills, and it is silent",
    ],
    monitoring: [
      "SAFETY NET: refeeding syndrome. Correct phosphate, magnesium and potassium and refeed cautiously under specialist supervision — the treatment is more dangerous than the illness in the first days",
      "Physical risk assessment alongside psychiatric care; neither service can manage this alone",
      "Re-examine the diagnosis if weight is regained but the neurological or endocrine features persist",
    ],
    urgency: "urgent",
    referral: "Eating disorder service with medical monitoring; endocrinology and neurology if atypical.",
  }),

  "Nephrogenic diabetes insipidus (the mimic)": dz("Nephrogenic diabetes insipidus (the mimic)", {
    confirmatory: [
      "THE WATER DEPRIVATION TEST WITH DESMOPRESSIN SEPARATES THEM: in CENTRAL DI the urine concentrates after desmopressin, in NEPHROGENIC DI it does not — because the kidney, not the hypothalamus, is the problem",
      "Review the drug chart for LITHIUM first — it is much the commonest acquired cause and is easily overlooked",
      "Check calcium and potassium: hypercalcaemia and hypokalaemia both cause a reversible nephrogenic picture",
      "Renal function and imaging where an intrinsic renal cause is suspected",
    ],
    monitoring: [
      "SAFETY NET: ensure free access to water at all times. These patients are safe while drinking and become dangerously hypernatraemic when access is removed — by illness, surgery or hospital admission",
      "Where lithium is the cause, stopping it is a psychiatric decision with its own risks and needs a joint conversation rather than a unilateral one",
      "Monitor sodium during any intercurrent illness",
    ],
    urgency: "urgent",
    referral: "Endocrinology with nephrology; psychiatry where lithium is implicated.",
  }),

  "Circadian rhythm disorder from schedule or light exposure (the mimic)": dz("Circadian rhythm disorder from schedule or light exposure (the mimic)", {
    confirmatory: [
      "A SLEEP DIARY OR ACTIGRAPHY OVER TWO TO THREE WEEKS is the test — the pattern is only visible over time, and a single consultation cannot show it",
      "TAKE A SHIFT-WORK, TRAVEL AND SCREEN-EXPOSURE HISTORY. The commonest cause of a disrupted rhythm is behavioural and environmental, not a lesion, and it is entirely reversible",
      "Distinguish delayed sleep phase — sleeping normally but at the wrong time — from insomnia, which is the failure to sleep at all",
      "Consider the free-running pattern of total blindness where relevant, which is a different mechanism entirely",
    ],
    monitoring: [
      "TIMED LIGHT EXPOSURE AND MELATONIN work, but the TIMING is everything — given at the wrong circadian phase they shift the rhythm the wrong way and make it worse",
      "Sleep hygiene and a fixed wake time are the foundation; hypnotics do not correct a circadian problem",
      "Occupational advice for shift workers, which is often the only durable intervention",
    ],
    urgency: "routine",
    referral: "Sleep medicine; occupational health for shift workers.",
  }),

  "Peripheral (cochlear) deafness": dz("Peripheral (cochlear) deafness", {
    confirmatory: [
      "AUDIOMETRY IS THE TEST and it separates the two immediately: cochlear deafness raises the pure-tone thresholds, where cortical deafness leaves them NORMAL with the patient unable to interpret what they hear",
      "SPEECH DISCRIMINATION disproportionately poor for the thresholds suggests a retrocochlear lesion, which is a third possibility and needs MRI of the internal acoustic meati",
      "EXAMINE THE EAR — wax, effusion and perforation are common, conductive and treatable, and are found in seconds",
      "Rinne and Weber at the bedside separate conductive from sensorineural before any audiogram",
    ],
    monitoring: [
      "SAFETY NET: SUDDEN sensorineural hearing loss is a same-day ENT emergency, because the window for steroid treatment is short and closes quickly",
      "Unilateral loss always needs MRI to exclude a vestibular schwannoma, even when an obvious cause is present",
      "Hearing aids and rehabilitation for established loss; untreated hearing loss is a modifiable dementia risk factor and worth saying so",
    ],
    urgency: "urgent",
    referral: "Same-day ENT for sudden loss; audiology otherwise.",
  }),

  "Non-arteritic AION (the mimic)": dz("Non-arteritic AION (the mimic)", {
    confirmatory: [
      "EXCLUDE GIANT CELL ARTERITIS FIRST, EVERY TIME — ESR, CRP and platelets urgently, and ask directly about jaw claudication, scalp tenderness, temporal headache and polymyalgia. Missing it costs the SECOND eye within days",
      "The disc is SWOLLEN in AION and normal in a retrobulbar or retinal cause; and an ALTITUDINAL field defect with a crowded 'disc at risk' in the other eye supports the non-arteritic form",
      "Distinguish it from CENTRAL RETINAL ARTERY OCCLUSION: AION spares the retina and causes disc swelling, where CRAO whitens the retina with a cherry-red spot — and CRAO is a stroke needing urgent vascular workup",
      "Check blood pressure, glucose, lipids and ask about nocturnal hypotension and sleep apnoea",
    ],
    monitoring: [
      "SAFETY NET: if there is ANY suspicion of giant cell arteritis, start steroids IMMEDIATELY and arrange biopsy afterwards — treatment must not wait for confirmation, because the fellow eye is what is at stake",
      "Warn about the risk to the second eye in non-arteritic disease too, and manage vascular risk factors accordingly",
      "Vision rarely recovers; support and low-vision services rather than repeated investigation",
    ],
    urgency: "emergency",
    referral: "Same-day ophthalmology; rheumatology if giant cell arteritis is suspected.",
  }),

  "Afferent (optic nerve) lesion imitating light-near dissociation": dz("Afferent (optic nerve) lesion imitating light-near dissociation", {
    confirmatory: [
      "THIS IS THE CLASSIC TRAP: a severely damaged optic nerve cannot carry the light signal, so the pupil reacts poorly to light but normally to a near target — imitating light-near dissociation without any pretectal lesion at all",
      "THE DISCRIMINATOR IS VISION. In a true pretectal dissociation vision is NORMAL; in the afferent mimic it is not. Measure acuity and fields before interpreting the pupil",
      "Test for a RELATIVE AFFERENT PUPILLARY DEFECT with the swinging torch — its presence points to the afferent pathway and away from the pretectum",
      "Where vision is genuinely normal and the dissociation is real, investigate for the pretectal causes: syphilis, a dorsal midbrain lesion and diabetes",
    ],
    monitoring: [
      "Document acuity, fields and the pupil together — the pupil finding is uninterpretable without the visual data beside it",
      "Investigate the optic neuropathy on its own merits once the pupil is explained",
      "Argyll Robertson pupils warrant syphilis serology regardless, since it is treatable",
    ],
    urgency: "urgent",
    referral: "Neuro-ophthalmology.",
  }),


  // ---- FOCAL SEIZURE ----
  ...family("focal-seizure", FOCAL_SEIZURE, {
    "Focal seizure": {
      slots: { flavour: "MRI with an epilepsy protocol — a standard sequence misses hippocampal sclerosis and focal cortical dysplasia, which are exactly what is being looked for", level: "document the semiology in the patient's own words; it localises better than any investigation" } },
    "Focal seizure with Todd's paresis": {
      slots: { flavour: "the weakness FOLLOWS the seizure rather than causing it, and it can last hours — during which the patient looks exactly like a stroke", level: "re-examine at intervals: resolution confirms Todd's, and persistence refutes it" },
      bySite: {
        subcortex_internal_capsule: { flavour: "a dense face-arm-leg weakness after a seizure imitates a capsular lacune exactly — and the THROMBOLYSIS DECISION is the reason this distinction is urgent rather than academic",
          level: "if thrombolysis is being considered, the witnessed seizure history and the resolving course are what argue against it — but a seizure at stroke onset does NOT by itself exclude a stroke" },
        subcortex_anterior_choroidal: { flavour: "a postictal deficit here can add a field defect to the hemiparesis, imitating an anterior choroidal infarct in full",
          level: "re-test the visual fields as the weakness resolves; a persisting field defect refutes the postictal explanation" },
        cortex_mca: { flavour: "a large postictal deficit across a whole MCA distribution is the most convincing stroke mimic there is, and the witness account is worth more than the scan",
          level: "serial NIHSS-style examination; improvement over hours is the evidence, deterioration is not postictal" },
      } },
    "Focal motor seizure with Todd's paresis": {
      slots: { flavour: "ask whether the movement STARTED somewhere and SPREAD — a Jacksonian march over seconds is close to diagnostic and no imaging shows it", level: "track the resolving weakness hourly rather than daily" },
      bySite: {
        cortex_mca_superior: { flavour: "a superior-division picture — face and arm weak, leg spared — reproduced by a postictal deficit; ask about the march, which no infarct produces",
          level: "face and arm power hourly; a leg that becomes involved later argues against both explanations" },
        cortex_motor_facearm: { flavour: "the motor strip is where focal motor seizures begin, so a lesion FOUND here is as likely to be the seizure's cause as its mimic — image with an epilepsy protocol rather than a stroke protocol",
          level: "power in the face and arm, and look for a cortical lesion on the scan rather than assuming the deficit is purely postictal" },
      } },
    "Focal motor seizure of the hand with Todd's paresis": {
      slots: { flavour: "the hand has a large cortical representation, so it is where focal motor seizures most often begin — and where a post-ictal palsy most convincingly imitates a cortical hand stroke", level: "hand power specifically, at intervals" } },
    "Focal motor seizure of the leg with Todd's paresis": {
      slots: { flavour: "a leg-predominant seizure points at the PARASAGITTAL cortex — and a parasagittal lesion is the structural cause to look for on the scan", level: "leg power and gait as it resolves" } },
    "Focal sensorimotor seizure with Todd's phenomenon": {
      slots: { flavour: "a mixed sensory and motor march implicates the central sulcus region; ask which came first, since the sequence localises", level: "both modalities as they recover, which may be at different rates" } },
    "Focal sensory seizure": {
      slots: { flavour: "POSITIVE sensory phenomena — tingling, buzzing — rather than numbness. A stroke takes sensation AWAY; a seizure ADDS something", level: "ask specifically whether the feeling was added or lost; patients say 'numb' for both" } },
    "Focal sensory seizure (Jacksonian march)": {
      slots: { flavour: "the MARCH is the diagnosis: spread along the homunculus over seconds, hand to face or hand to arm, which no vascular event does", level: "record the route and the timing of the march" } },
    "Focal sensory seizure of the leg": {
      slots: { flavour: "leg sensory seizures again point parasagittally, where a meningioma is the classic structural cause", level: "leg sensation, and look for a parasagittal lesion on imaging" } },
    "Focal seizure with versive gaze deviation": {
      slots: { flavour: "VERSIVE deviation is AWAY from the seizure focus, which is the opposite of a destructive frontal lesion where the eyes look TOWARDS the lesion — that reversal is the localiser", level: "note the direction of deviation and of any head turn" } },
    "Focal seizure with speech arrest": {
      slots: { flavour: "speech arrest with PRESERVED comprehension and awareness suggests a dominant frontal focus; test comprehension during the event if it is witnessed", level: "distinguish arrest from dysphasia at review — they localise differently" } },
    "Postictal (peri-ictal) aphasia": {
      slots: { flavour: "postictal aphasia implicates the DOMINANT hemisphere and resolves over minutes to hours — the resolution is what separates it from a dominant MCA stroke", level: "serial language assessment; improvement over hours is the evidence" } },
    "Postictal aphasia after a focal temporal seizure": {
      slots: { flavour: "a temporal focus with postictal language difficulty — image for hippocampal sclerosis with an epilepsy protocol", level: "language, and ask about the aura: rising epigastric sensation or déjà vu supports a temporal origin" } },
    "Focal temporal seizure with postictal aphasia": {
      slots: { flavour: "ask about the characteristic temporal auras, which patients rarely volunteer because they do not consider them symptoms", level: "language recovery, and screen for the memory complaints that accompany temporal epilepsy" } },
    "Focal seizure with transient Gerstmann features": {
      slots: { flavour: "a transient Gerstmann tetrad is a dominant PARIETAL seizure, and it is striking enough to be mistaken for an acute parietal infarct", level: "re-test writing, calculation and left-right orientation as it resolves" } },
    "Supplementary motor area seizure": {
      slots: { flavour: "SMA seizures are brief, nocturnal, bizarre and hyperkinetic with PRESERVED AWARENESS — and are very commonly misdiagnosed as functional or as a parasomnia", level: "video where possible; the semiology is the diagnosis and description does it no justice" } },
    "Insular (opercular) epilepsy": {
      slots: { flavour: "insular seizures produce laryngeal constriction, unpleasant throat sensations and autonomic features, and they masquerade as temporal epilepsy — which matters because surgical planning differs", level: "the autonomic and somatosensory features specifically" } },
    "Occipital seizure": {
      slots: { flavour: "occipital seizures produce COLOURED, CIRCULAR, multiple visual elements developing over SECONDS — where migraine aura is monochrome, zigzag and builds over MINUTES", level: "the phenomenology and its speed, which is the whole discrimination" } },
    "Seizure or postictal auditory disturbance": {
      slots: { flavour: "the name hedges between an ictal auditory phenomenon and a postictal deficit — EEG and the time course resolve it", level: "formal audiometry if the disturbance persists, since a true deafness is not postictal" } },
    "Migraine or occipital seizure": {
      slots: { flavour: "this name hedges between the two commonest mimics, and the discrimination is the one above: colours and seconds point to seizure, zigzags and minutes to migraine", level: "get a description of the images themselves — patients can usually say whether they were coloured" } },
  }),

  // ---- MIGRAINE ----
  ...family("migraine-aura", MIGRAINE_AURA, {
    "Migraine with visual aura": {
      slots: { flavour: "the classic aura is a scintillating scotoma with a zigzag fortification spectrum that ENLARGES and drifts across the field over minutes, leaving a scotoma behind it", level: "ask whether it affected one eye or one FIELD — patients say 'one eye' when they mean one side of both" },
      bySite: {
        cortex_pca: { flavour: "a PCA infarct is the alternative, and it leaves a PERMANENT field defect where aura leaves none — so the question at review is simply whether the field has recovered",
          level: "formal perimetry if any field abnormality persists beyond an hour" },
        cortex_occipital: { flavour: "occipital aura versus occipital SEIZURE is the harder discrimination: migraine is monochrome zigzags over MINUTES, seizure is coloured circles over SECONDS",
          level: "ask the patient to describe the shapes and colours; that description separates them better than any test" },
      } },
    "Migraine sensory aura": {
      slots: { flavour: "cheiro-oral spread — hand to mouth over minutes — is the characteristic sensory aura, and the slow spread is what separates it from a seizure's march", level: "the tempo of the spread specifically" } },
    "Vestibular migraine": {
      slots: { flavour: "vertigo lasting minutes to hours WITH migrainous features, in someone with a migraine history — and note that headache need not accompany the vertigo, which is why it is missed", level: "a diary of episodes and triggers; exclude BPPV with positional testing first, since it is commoner and treatable" },
      bySite: {
        peripheral_vestibular_posterior_canal: { flavour: "the rival here is BPPV, and the clock separates them: BPPV lasts SECONDS and is positional, vestibular migraine lasts minutes to hours",
          level: "do the Dix-Hallpike first — BPPV is commoner and is treated in the same appointment" },
        central_vestibular_nucleus: { flavour: "the rival here is a posterior-circulation STROKE, and HINTS is what separates them — a normal head impulse with acute constant vertigo points central, whatever the migraine history",
          level: "do not let a migraine history override a worrying HINTS examination; the two coexist and the stroke is the one that kills" },
      } },
    "Retinal migraine (vasospasm)": {
      slots: { flavour: "TRULY MONOCULAR transient visual loss — confirm by asking the patient to cover each eye during an episode. Monocular loss is a VASCULAR territory question and needs carotid and cardiac assessment before it is called migraine",
               level: "treat a first monocular episode as amaurosis fugax until vascular imaging is clear" } },
    "Ophthalmoplegic migraine (recurrent painful ophthalmoplegic neuropathy)": {
      slots: { flavour: "recurrent painful third-nerve palsy with headache — but a painful third-nerve palsy is a POSTERIOR COMMUNICATING ANEURYSM until angiography says otherwise, every time, however typical the history",
               level: "MRI with contrast showing nerve enhancement supports it; the aneurysm must be excluded first" },
      urgency: "emergency",
      referral: "Same-day neuroimaging with angiography; neurology thereafter." },
  }),

  // ---- PERIPHERAL MASQUERADING AS CENTRAL ----
  ...family("peripheral-mimic", PERIPHERAL_MIMIC, {
    "Carpal tunnel syndrome (the common mimic)": {
      slots: { flavour: "median territory sparing the PALM — the palmar cutaneous branch bypasses the tunnel — and nocturnal symptoms relieved by shaking the hand", level: "thenar bulk and thumb abduction; splint while awaiting studies" } },
    "Ulnar neuropathy (the common mimic)": {
      slots: { flavour: "ulnar territory with a SPLIT RING FINGER — the medial half numb and the lateral half spared, which no central lesion produces", level: "the split ring finger and the dorsal ulnar patch, which places elbow versus wrist" } },
    "Ulnar or median neuropathy (the mimic)": {
      slots: { flavour: "an isolated weak hand is far more often a nerve than a cortical hand-knob stroke — but check the plantar response, because that one sign separates them", level: "reflexes and plantars alongside the hand" } },
    "Peripheral nerve or root lesion (the mimic)": {
      slots: { flavour: "map the deficit against dermatomes AND nerve territories; a pattern fitting neither should raise a functional or central cause", level: "reflexes, which are the fastest discriminator available" } },
    "Femoral neuropathy (the mimic)": {
      slots: { flavour: "weak knee extension with a lost knee jerk and numbness over the anterior thigh — and check for a retroperitoneal HAEMATOMA in anyone anticoagulated, which is the treatable emergency here", level: "quadriceps power and the knee jerk; image the retroperitoneum if anticoagulated" },
      urgency: "urgent" },
    "Ilioinguinal nerve entrapment (the mimic)": {
      slots: { flavour: "groin pain and numbness after hernia repair, appendicectomy or a Pfannenstiel incision — the scar is the history", level: "the groin sensory patch; a local anaesthetic block is both diagnostic and therapeutic" } },
    "Piriformis or gluteal compression (the mimic)": {
      slots: { flavour: "buttock pain reproduced by resisted external rotation, without the back pain of a radiculopathy — and imaging the spine finds incidental degeneration that misleads", level: "straight-leg raise and piriformis provocation, and examine the back to exclude a root" } },
  }),


  ...family("not-a-lesion-here", MIMIC_SPINE, {
    "Non-convulsive status epilepticus": {
      slots: { level: "conscious level, and any subtle motor phenomena — eyelid or facial twitching, nystagmoid eye movements",
               flavour: "a fluctuating or unexplained encephalopathy, or a focal deficit that will not settle, with NO structural explanation. It is invisible without an EEG and is repeatedly managed as delirium, a prolonged post-ictal state, or a stroke" },
      confirmatory: [
        "EEG IS THE TEST AND IT IS THE ONLY TEST — nothing else diagnoses this, and it is not requested because the possibility is not considered",
        "A therapeutic trial of a benzodiazepine with EEG monitoring is both diagnostic and therapeutic where EEG is not immediately available",
        "Look for the precipitant: antiepileptic non-adherence or withdrawal, alcohol, infection, metabolic derangement, and a structural lesion that has become epileptogenic",
        "Examine {level}, and re-examine AFTER treatment — resolution of the deficit with treatment of the seizure is what confirms it",
      ],
      monitoringExtra: ["Prolonged non-convulsive status causes neuronal injury of its own, so this is not a benign version of status epilepticus — the delay to recognition is the harm"],
      urgency: "emergency",
      referral: "Acute neurology with EEG urgently; critical care if refractory",
      bySite: {
        aphasia_subcortical_thalamic: { level: "language, which may fluctuate strikingly from minute to minute" },
        cerebrum_diffuse:             { level: "conscious level and responsiveness" },
        cortex_frontal_eye_field:     { level: "gaze deviation — which in a seizure beats AWAY from the discharging side, the opposite of a destructive lesion" },
        cortex_aphasia_global:        { level: "language and conscious level together" },
      },
    },
    "Miller Fisher syndrome": {
      slots: { level: "eye movements, coordination and the REFLEXES",
               flavour: "the triad of OPHTHALMOPLEGIA, ATAXIA AND AREFLEXIA — it looks like a brainstem or cerebellar lesion and is neither. AREFLEXIA is the finding that says peripheral, and it is the one most often not tested" },
      confirmatory: [
        "ANTI-GQ1b ANTIBODIES, which are positive in the great majority and effectively confirm it",
        "Nerve conduction studies, and CSF for albuminocytological dissociation — though CSF protein may be normal in the first week",
        "MRI to exclude the brainstem lesion this imitates — but a NORMAL scan in this triad supports the diagnosis rather than leaving it unexplained",
        "Examine {level}, and test the reflexes carefully in all four limbs, since their absence is what redirects the whole work-up",
      ],
      monitoringExtra: ["Monitor FORCED VITAL CAPACITY and swallow: Miller Fisher sits on the Guillain-Barré spectrum and can progress to limb and respiratory weakness, so it is not a purely ocular diagnosis"],
      urgency: "emergency",
      referral: "Neurology with critical care standby if there is any bulbar or respiratory involvement",
    },
    "Complete neuromuscular paralysis (severe GBS, botulism, prolonged blockade)": {
      slots: { level: "any voluntary movement at all, including EYE MOVEMENT and blinking",
               flavour: "a patient who appears unresponsive because they cannot move — not because they cannot think. This imitates locked-in syndrome and coma, and the difference is everything" },
      confirmatory: [
        "ASSUME AWARENESS AND SAY SO ALOUD. Before any test, speak to the patient as though they can hear, because in every one of these they usually can",
        "Look for ANY residual channel — vertical eye movement, blink, a finger flicker — and build communication through it. In complete neuromuscular paralysis even eye movement may be gone, which is what separates it from locked-in syndrome",
        "TRAIN-OF-FOUR monitoring where neuromuscular blockade may be responsible: prolonged blockade is the reversible cause and is identified in seconds at the bedside",
        "EEG is what demonstrates a normally reactive, awake brain in an unmoving body — and it is the test that prevents a catastrophic misjudgement about awareness",
      ],
      monitoringExtra: [
        "SEDATION AND ANALGESIA ARE NOT OPTIONAL in a paralysed but aware patient — this is one of the most distressing experiences in medicine and it is caused by us",
        "Re-examine daily for a returning channel of communication, and tell the family what is happening, because the patient can hear what is said at the bedside",
      ],
      urgency: "emergency",
      referral: "Critical care and neurology together",
    },
    "Visceral disease mimicking a dermatomal band": {
      slots: { level: "the band itself — and whether it is truly dermatomal, or crosses the midline, or has no sensory sign at all",
               flavour: "thoracic pain in a band with NO objective sensory loss and no rash — cardiac, pleural, aortic, oesophageal and biliary disease all refer this way, and the neurological pathway can absorb weeks while the actual disease progresses" },
      confirmatory: [
        "EXCLUDE THE VISCERAL EMERGENCIES FIRST: ECG and troponin, chest imaging, and consideration of aortic dissection and pulmonary embolism. These are quick, and they are the ones that kill",
        "Ask what the pain is RELATED TO — exertion, eating, breathing, posture — since a relationship to any of those points away from a root and towards an organ",
        "Examine for objective signs of a root lesion: sensory loss to pin in a true dermatomal distribution, and a rash. Their absence is what should redirect the work-up",
        "Consider zoster BEFORE the rash appears, which is the one neurological cause that legitimately presents as pain alone",
      ],
      urgency: "emergency",
      referral: "Acute medicine or the relevant specialty — this is usually not a neurological problem at all",
    },
    "Visceral / abdominal disease mimicking a band": {
      slots: { level: "the abdominal wall and the band, plus a proper ABDOMINAL examination",
               flavour: "abdominal pathology referring to a T10 band — and the neurological label is what delays the laparotomy. A tender abdomen with guarding is not a radiculopathy" },
      confirmatory: [
        "EXAMINE THE ABDOMEN PROPERLY, which is the examination least likely to have been done by the time a neurological opinion is sought",
        "Bloods and abdominal imaging as the picture dictates — biliary, pancreatic, renal and bowel pathology all refer to the thoracoabdominal dermatomes",
        "CARNETT'S SIGN separates abdominal wall pain from visceral pain at the bedside: pain that WORSENS on tensing the abdominal wall is somatic, pain that eases is visceral",
        "Look for the true radicular features — a dermatomal sensory deficit, a rash, or spinal tenderness — whose absence argues against a root",
      ],
      urgency: "urgent",
      referral: "General surgery or acute medicine as the abdominal findings dictate",
    },
  }),

  // Listed in CAUSES as a MIMIC — not a lesion at this site at all. The workup reflects that: the job is to
  // exclude it at the bedside in seconds, before any of the structural pathway is embarked on.
  "Hypoglycaemia": dz("Hypoglycaemia", {
    confirmatory: [
      "CAPILLARY BLOOD GLUCOSE, IMMEDIATELY — before imaging, before bloods, before anything else. It takes seconds, it is the one fully reversible cause of a focal deficit, and it is missed by starting with the CT",
      "A LABORATORY glucose to confirm the capillary reading, drawn before treatment wherever that does not delay it",
      "Where hypoglycaemia is confirmed and unexplained, take the diagnostic samples AT THE TIME OF the low glucose — insulin, C-peptide, and a sulfonylurea screen — because after treatment the opportunity is gone",
      "Establish the cause: diabetes treatment, alcohol, liver disease, adrenal insufficiency, sepsis, or exogenous insulin",
    ],
    monitoring: [
      "SAFETY NET: hypoglycaemia can produce a DENSE FOCAL DEFICIT that mimics a stroke exactly, including hemiplegia and aphasia — and it is an explicit exclusion before thrombolysis. Treat it and re-examine before committing to the stroke pathway",
      "Recheck the glucose after treatment and again later: sulfonylurea and long-acting insulin hypoglycaemia RECURS after an initial correction, and patients are discharged into that relapse",
      "If {level} does not recover once the glucose is corrected, the deficit is structural and the stroke pathway resumes — a corrected glucose does not close the case",
      "{flavour}",
    ],
    urgency: "emergency",
    referral: "Acute medicine; diabetes team where the cause is treatment-related",
    bySite: {
      cortex_mca: {
        level: "the full hemispheric deficit",
        flavour: "profound hypoglycaemia has a recognised predilection for producing hemispheric and cortical deficits, so the resemblance to a large-vessel stroke is close",
      },
      subcortex_internal_capsule: {
        level: "the pure motor deficit",
        flavour: "a dense pure hemiparesis with a normal conscious level is an entirely plausible presentation of hypoglycaemia",
      },
      cortex_aphasia_global: {
        level: "language, once the patient is able to cooperate",
        flavour: "isolated aphasia from hypoglycaemia is well described and is regularly thrombolysed before the glucose is checked",
      },
    },
  }),
};

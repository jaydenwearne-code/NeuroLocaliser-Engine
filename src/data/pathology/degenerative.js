// degenerative.js — pathology workups for the DEGENERATIVE category.
//
// Content only — the builders live in ./builders.js and the public API in ../pathologyNextSteps.js.
// Teaching prompts, not directives: no doses, no definitive management.
//
// REVIEW STATUS: ✅ ALL SIGNED OFF by the owner (a clinician) — tranches 1 and 2 on 2026-08-18,
//   tranche 3 on 2026-08-21.
//   Tranche 2 (round 9) — four singletons. The degenerative red set is complete.
//   Tranche 3 (round 14, 2026-08-21) — six families (degenerative-radiculopathy,
//   degenerative-canal-stenosis, cortical-dementia, parkinsonian-degeneration, progressive-ataxia,
//   bppv-canal) and eight singletons. 57 names, none of them red. The file below the tranche-2 block is
//   almost entirely new content awaiting the owner's read.
//
// These are singletons rather than a family, deliberately: a degenerative label is the END of a
// diagnostic process, and what they share is not a workup but an obligation — to EXCLUDE THE TREATABLE
// MIMIC before accepting it. That obligation is different in each case, which is why one spine could not
// carry them.
import { dz, family } from "./builders.js";
// ---- ROUND 14 (tranche 3): DEGENERATIVE SPINE DISEASE ----
// 24 of the 57 remaining degenerative names are spondylosis, foraminal stenosis and disc prolapse at a
// named level. They split into TWO families, and the split is the clinical claim: compression of a ROOT
// is a pain problem with a good natural history, where compression of the CORD or the CAUDA is a
// progressive disability where surgery prevents rather than restores. One spine could not say both.
const RADICULOPATHY_SPINE = {
  confirmatory: [
    "THE EXAMINATION NAMES THE ROOT, NOT THE SCAN. Degenerative change is present on the imaging of most people in this age group, so a disc or a narrowed foramen only means something if it matches the level the examination already pointed to: {flavour}",
    "MRI OF THE SYMPTOMATIC SEGMENT, on a threshold rather than by default — a progressive deficit, a red flag, or failure to settle over about six weeks. Imaging everyone early finds degenerative change in almost everyone and drives operations the natural history would have made unnecessary",
    "THE RED FLAGS ARE WHAT CHANGES THAT THRESHOLD: pain that is non-mechanical or wakes the patient at night, fever, weight loss, a history of cancer, immunosuppression or injecting drug use. Those point to infection or malignancy rather than spondylosis, and they are imaged now rather than in six weeks",
    "Examine {level}. At every contact look for the neighbouring emergency as well: long-tract signs — brisk reflexes BELOW the level, Hoffmann's, an upgoing plantar, a changed gait — mean the CORD, and any bladder, bowel or saddle change means the CAUDA EQUINA",
  ],
  monitoring: [
    "SAFETY NET: give explicit WRITTEN advice. New bladder or bowel symptoms, saddle numbness, or weakness that is getting worse means same-day assessment, not the next appointment",
    "MOST RADICULAR PAIN SETTLES WITHOUT SURGERY over weeks to a few months, and saying so IS part of the treatment — the pain is severe, and a patient who believes it is permanent will seek an operation for it",
    "Track {level} at each review and record power as a graded figure rather than as an impression; 'weak' is not something the next clinician can compare against",
    "A PROGRESSIVE MOTOR DEFICIT is the indication for early surgery — not the severity of the pain. Numbness and a lost reflex often persist after full functional recovery, which is worth saying at the outset so that they are not read as failure",
    "Keep the patient active rather than resting, with physiotherapy and neuropathic rather than simple analgesia; and where a root block or surgery is considered, the imaging and the examination should agree on the level before anyone operates",
  ],
  urgency: "urgent",
  referral: "Primary care with physiotherapy; urgent spinal surgery for a progressive deficit, and emergency assessment for any cord or cauda equina feature",
};

// The canal rather than the foramen. The neural structure is compressed along its length, the course is
// progressive, and the operation buys the future rather than the past.
const CANAL_STENOSIS_SPINE = {
  confirmatory: [
    "THIS COMPRESSES THE CORD OR THE CAUDA, NOT A ROOT, and that changes what the diagnosis is for: surgery is done to PREVENT further loss rather than to relieve pain, so the deficit at the time of the operation largely sets the ceiling on recovery. {flavour}",
    "MRI OF THE WHOLE RELEVANT REGION rather than of one level — degenerative canal narrowing is usually multilevel, and T2 signal change within the cord is the finding that says it is suffering rather than merely narrowed",
    "GRADE THE DEFICIT FORMALLY AND WRITE THE SCORE DOWN, using a recognised myelopathy or claudication scale. It is the figure the surgical decision and every later review are made against, and an impression cannot serve that purpose",
    "Examine {level}; and exclude the other causes of the same picture before accepting this one — B12 and copper, an inflammatory or demyelinating myelopathy, and a tumour. A stenotic canal on the scan does not prove the stenosis is what is causing the deficit",
  ],
  monitoring: [
    "SAFETY NET: RAPID deterioration, a new bladder or bowel change, or a fall in function over days is an emergency and goes to spinal surgery the same day rather than to the next clinic",
    "Track {level} with the SAME formal score at each review. The trajectory is what decides between operating and watching, and a trajectory can only be read from comparable measurements",
    "FALLS ARE THE IMMEDIATE DANGER and are what actually injures these patients — a myelopathic or claudicant gait over a stenotic cervical canal means a minor fall can cause a central cord injury. Address the falls risk at the first visit rather than after the first fall",
    "Be honest about what surgery does: it usually ARRESTS progression and recovers some function, but it does not restore what is already lost. A patient who expects restoration will count a technically excellent operation a failure",
  ],
  urgency: "urgent",
  referral: "Spinal surgery, with neurology where the cause of the myelopathy is not settled",
};


// A DEGENERATIVE DEMENTIA IS A DIAGNOSIS MADE OVER TIME, and the file header's rule applies hardest here:
// what these share is not a test but an obligation, to exclude what is treatable before the label goes on.
// The tempo does most of the work — years, not weeks — and a rapid course means this spine is wrong.
const DEMENTIA_SPINE = {
  confirmatory: [
    "THE TEMPO IS THE FIRST INVESTIGATION. Degeneration takes years; a decline over WEEKS TO MONTHS is not this and needs an urgent work-up for an inflammatory, autoimmune, infective, neoplastic or prion cause instead. {flavour}",
    "SCREEN FOR THE REVERSIBLE CAUSES IN EVERY CASE — B12, folate, thyroid function, calcium, glucose, liver and renal function, and HIV and syphilis serology where there is any risk. Review the DRUG CHART for anticholinergics, sedatives and opiates, and screen for DEPRESSION and for obstructive sleep apnoea, both of which imitate dementia and both of which are treatable",
    "MRI rather than CT: the question is the PATTERN OF ATROPHY, which localises the syndrome, and the same scan excludes hydrocephalus, a subdural collection, a tumour and the vascular burden. A CT answers only the last of those",
    "FORMAL NEUROPSYCHOLOGY IS THE INVESTIGATION, not a bedside screen — a brief cognitive test is normal in early focal presentations and falsely abnormal in the distressed. Examine {level}",
  ],
  monitoring: [
    "SAFETY NET: any RAPID change, new focal signs, seizures or myoclonus means the diagnosis is wrong or something else has happened — that is a re-investigation, not a progression",
    "DRIVING AND CAPACITY ARE PART OF THIS CONSULTATION, not an afterthought. The licensing authority must be notified, and the conversation is easier early than after an incident",
    "Track {level} and, more usefully, function — what the person can no longer do at home is the outcome that matters and the one families can report",
    "THE CARER IS THE OTHER PATIENT. Carer strain predicts admission to care better than the severity of the disease does, so support, respite and benefits belong in the plan from the first visit",
    "Advance care planning, power of attorney and the person's own wishes belong in the window where they can still express them — that window closes quietly, and it is routinely missed",
  ],
  urgency: "routine",
  referral: "Cognitive neurology or a memory service; neuropsychology, and a young-onset service where the patient is under sixty-five",
};

// The diagnosis is clinical and longitudinal, and the single most useful piece of information is how the
// patient responds to levodopa over time. The spine's real job is the RED FLAGS that say this is not
// Parkinson's disease, because the atypical syndromes need different conversations much earlier.
const PARKINSONIAN_SPINE = {
  confirmatory: [
    "THIS IS A CLINICAL DIAGNOSIS AND TIME IS THE TEST. {flavour}",
    "REVIEW THE DRUG CHART FIRST, EVERY TIME — antipsychotics, metoclopramide, prochlorperazine and some antidepressants all produce parkinsonism, it is the commonest reversible cause, and it can take months to resolve after the drug is stopped",
    "THE RED FLAGS FOR AN ATYPICAL SYNDROME ARE ALL BEDSIDE FINDINGS: falls within the first year, early autonomic failure, a vertical gaze palsy, early dementia or hallucinations, symmetry at onset, rapid progression, and a poor levodopa response. Any of them changes the prognosis and the conversation",
    "MRI to exclude the structural and vascular mimics. A dopamine transporter scan separates a DEGENERATIVE parkinsonism from essential tremor or a drug-induced picture, but it does NOT distinguish Parkinson's disease from the atypical syndromes — so it answers a narrower question than it is usually asked. Examine {level}",
  ],
  monitoring: [
    "A LEVODOPA TRIAL IS AN INVESTIGATION AS WELL AS A TREATMENT: a clear, sustained response supports Parkinson's disease, and a genuine absence of response after an adequate trial argues against it",
    "SAFETY NET: NEVER STOP DOPAMINERGIC MEDICATION ABRUPTLY, including during an admission or when the patient is nil by mouth. Abrupt withdrawal can precipitate a neuroleptic-malignant-like state, and missed doses in hospital are a recognised, preventable harm",
    "Track {level}; and ask at every visit about the non-motor features that determine quality of life more than the motor ones do — constipation, bladder, blood pressure on standing, sleep, mood, pain and REM sleep behaviour disorder",
    "FALLS, SWALLOW AND POSTURAL BLOOD PRESSURE are the three that cause the harm. Measure lying and standing pressure rather than asking about dizziness, and refer to physiotherapy and speech therapy early rather than at crisis",
    "Where impulse-control behaviours appear — gambling, spending, hypersexuality, compulsive eating — ask about them directly and ask the family too. Patients rarely volunteer them, and they are a drug effect rather than a change of character",
  ],
  urgency: "routine",
  referral: "Neurology or a movement disorder service, with a Parkinson's specialist nurse, physiotherapy and speech therapy",
};

// The order is what matters: the ACQUIRED AND TREATABLE causes are excluded before a degenerative or
// genetic label is used, because that label is permanent and the treatable ones are common.
const ATAXIA_SPINE = {
  confirmatory: [
    "EXCLUDE THE ACQUIRED AND TREATABLE CAUSES FIRST, in this order, because they are common and the degenerative label is irreversible: ALCOHOL, thiamine, B12 and vitamin E, thyroid function, COELIAC serology, and the drug chart — phenytoin, lithium, carbamazepine and chemotherapy all cause ataxia. {flavour}",
    "THEN THE IMMUNE AND PARANEOPLASTIC CAUSES, which have a treatment window: anti-neuronal antibodies (including anti-Yo, anti-Hu and anti-Tr), anti-GAD, and a search for an underlying cancer where the course is SUBACUTE over weeks to months rather than over years",
    "MRI brain and craniocervical junction: the structural causes (a Chiari malformation, a posterior fossa lesion, superficial siderosis) are excluded on the scan, and the PATTERN of cerebellar atrophy, and whether the brainstem is involved with it, points towards the degenerative diagnosis",
    "GENETIC TESTING LAST AND WITH COUNSELLING, guided by the family history, the age at onset and the associated features — a result carries implications for children and siblings that must be discussed before the blood is taken, not after. Examine {level}",
  ],
  monitoring: [
    "SAFETY NET: a SUBACUTE course — weeks to months — is not a degeneration and should send you back to the paraneoplastic, immune and toxic causes, repeatedly if necessary. Cancer can precede the syndrome's discovery by a year or more",
    "Track {level}; and record gait and speech with a standard scale, because progression in ataxia is slow and only comparable measurements can show it",
    "FALLS, SWALLOW AND SPEECH determine the future here — physiotherapy, an early speech therapy assessment, and an aid the patient will actually use rather than the one they will refuse",
    "Look for what can still be treated even when the diagnosis is degenerative: alcohol, nutrition, thyroid, sleep apnoea and a drug that could be changed. A degenerative label does not exempt the patient from the treatable list",
  ],
  urgency: "routine",
  referral: "Neurology, with clinical genetics where a hereditary cause is likely; physiotherapy and speech therapy alongside",
};

// The diagnosis is a POSITIONAL TEST and the treatment is a MANOEUVRE, both at the same visit — the
// nystagmus names the canal, and the canal names the manoeuvre. Imaging answers nothing here except
// whether the picture is central, which is a bedside judgement in the first place.
const BPPV_SPINE = {
  confirmatory: [
    "THE DIAGNOSIS IS A POSITIONAL TEST, NOT A SCAN, and the DIRECTION OF THE NYSTAGMUS NAMES THE CANAL — which in turn names the repositioning manoeuvre. Getting the canal wrong means performing the wrong manoeuvre and concluding the treatment does not work. {flavour}",
    "USE VIDEO-FRENZEL OR AT LEAST REMOVE FIXATION where you can: fixation suppresses the nystagmus, and a test read as negative under bright light is the commonest reason BPPV is missed",
    "THE CENTRAL MIMIC IS WHAT THE TEST IS ALSO FOR: nystagmus that is DOWNBEAT in the wrong plane, that has no latency, that does not fatigue, or that comes with any other neurological sign is NOT benign positional vertigo — the craniocervical junction and the posterior fossa are the concern, and that is what gets imaged",
    "Examine {level}. Ask about the FIRST attack too — BPPV commonly follows head injury or a vestibular neuritis, and it is more frequent in older patients, in whom it is a substantial and correctable cause of falls",
  ],
  monitoring: [
    "TREAT IT IN THE SAME VISIT. The repositioning manoeuvre for the identified canal is the treatment, it works quickly, and vestibular sedatives do not treat this at all — they suppress compensation and add to the falls risk in exactly the patients who can least afford it",
    "SAFETY NET: vertigo that becomes CONSTANT rather than positional, or that acquires any other neurological sign — new deafness, diplopia, weakness, ataxia out of proportion — is no longer this diagnosis and is reassessed rather than re-manoeuvred",
    "Track {level}, and re-test at follow-up: recurrence is common and is not a failure of the first treatment. Teach the patient the home exercise so that a recurrence does not require another appointment",
    "IN AN OLDER PATIENT THIS IS A FALLS DIAGNOSIS — treating it reduces falls, so the falls assessment and the home hazards belong in the same plan as the manoeuvre",
  ],
  urgency: "routine",
  referral: "Primary care or a vestibular physiotherapy service; ENT or neurology if it does not settle or if any central feature appears",
};

export default {
  // ---- ROUND 14 (tranche 3): CORTICAL NEURODEGENERATION ----
  ...family("cortical-dementia", DEMENTIA_SPINE, {
    "Alzheimer's disease (medial temporal)": {
      slots: { level: "EPISODIC memory with delayed recall and CUEING — a patient who cannot recall but is helped by a cue has a retrieval problem, while no benefit from cueing points to true storage failure",
               flavour: "years of insidious episodic memory loss with medial temporal atrophy. The tempo is what separates it from an encephalitis presenting with the same amnesia over days" },
      confirmatoryExtra: ["Where the diagnosis is uncertain, the patient is YOUNG, or the answer would change management, CSF or PET biomarkers can support it — but they are an adjunct to a clinical diagnosis rather than a substitute for one, and a positive biomarker in an asymptomatic person is not a diagnosis at all"],
    },
    "Alzheimer's disease / posterior cortical atrophy": {
      slots: { level: "naming, CALCULATION, writing and finger identification — the Gerstmann elements — alongside memory",
               flavour: "years of progressive naming, calculation and visuospatial failure. A Gerstmann-like picture emerging SLOWLY is posterior-predominant degeneration, where the same tetrad appearing abruptly is an angular gyrus stroke" },
    },
    "Posterior cortical atrophy (Benson's syndrome)": {
      slots: { level: "VISION as a cortical function — reading, judging distance, finding an object on a patterned surface, and copying a figure — with normal acuity and normal eyes",
               flavour: "years of progressive visual recognition failure in a YOUNGER dementia patient whose memory is relatively preserved early. Patients see an optician first, often more than once, and are given new glasses that do not help" },
      confirmatoryExtra: [
        "OPHTHALMOLOGY WILL HAVE BEEN NORMAL, and that is the diagnostic clue rather than a reason to doubt the story: the eyes and the acuity are fine and the problem is cortical",
        "The underlying pathology is usually Alzheimer's, so the biomarker and young-onset pathways apply — and this group is young enough that employment, dependent children and finances are pressing issues from the first visit",
      ],
      bySite: {
        cortex_fusiform: { level: "face recognition, colour perception and reading specifically — ask whether they recognise people by voice rather than by face" },
        cortex_pca: { level: "the visual fields alongside the cortical visual tests, since a field defect and a visual agnosia can look the same to the patient" },
        cortex_parietal: { level: "simultanagnosia and optic ataxia — reaching for an object under vision, and describing a busy picture as a whole rather than piecemeal (the Balint elements)" },
      },
    },
    "Frontotemporal dementia (behavioural variant)": {
      slots: { level: "BEHAVIOUR AND EXECUTIVE FUNCTION, taken from an INFORMANT rather than the patient — insight is lost early, so the patient's own account will be reassuring and wrong",
               flavour: "years of progressive apathy, disinhibition, loss of empathy, compulsive routines and changed eating, with memory relatively preserved. It is repeatedly diagnosed as depression, midlife crisis or a psychiatric illness first, and the family's account is the diagnosis" },
      confirmatoryExtra: [
        "SCREEN FOR MOTOR NEURONE DISEASE at every visit — ask about wasting, fasciculations, swallow and speech. The two overlap, and the co-occurrence changes the prognosis and the plan entirely",
        "TAKE A FAMILY HISTORY PROPERLY AND CONSIDER GENETIC TESTING WITH COUNSELLING: a substantial minority of behavioural-variant cases are familial, which matters to adult children who are often the informants sitting in the room",
      ],
      bySite: {
        cortex_dlpfc: { level: "planning, set-shifting and perseveration — formal executive testing, since a standard cognitive screen will be normal" },
        cortex_orbitofrontal: { level: "disinhibition, social judgement and impulse control, with an informant account of what has changed at home and at work" },
      },
    },
    "Frontotemporal dementia": {
      slots: { level: "INITIATION and apathy, taken from an informant — and distinguish apathy from low mood, since they look identical and are treated differently",
               flavour: "years of progressive apathy and loss of initiative with early loss of insight. A medial frontal presentation is the quietest of the dementias and is repeatedly treated as depression before anyone images the brain" },
    },
    "Semantic dementia (semantic variant PPA)": {
      slots: { level: "word MEANING rather than word finding — ask the patient what a fork is, and test naming, single-word comprehension, repetition and object knowledge separately",
               flavour: "years of progressive loss of word meaning with fluent but empty speech, preserved repetition and preserved day-to-day memory, on a background of asymmetric ANTERIOR TEMPORAL atrophy. The preserved repetition is what places it" },
      confirmatoryExtra: ["Speech and language therapy is a treatment here rather than a referral of last resort — communication strategies and a personalised word book make a real difference while comprehension remains"],
    },
    "Primary progressive aphasia (semantic or logopenic variant)": {
      slots: { level: "fluency, single-word comprehension, SENTENCE REPETITION and naming, each tested separately — the profile is what names the variant",
               flavour: "years rather than seconds, which is what separates it from a stroke in the same territory: the semantic variant loses word MEANING with fluent empty speech and preserved repetition, while the logopenic variant impairs SENTENCE REPETITION and word retrieval with meaning intact, and usually has Alzheimer pathology behind it" },
    },
    "Advanced Alzheimer's or a degenerative aphasia": {
      slots: { level: "whether speech is ECHOLALIC — does the patient repeat what is said to them without comprehension — alongside naming and comprehension",
               flavour: "the same echolalic pattern that appears abruptly after a watershed infarct can emerge over YEARS in advanced degenerative disease. The tempo is the whole discrimination, and the history has to come from someone who has watched it" },
    },
    "Diffuse neurodegenerative disease": {
      slots: { level: "global cognition formally, and look hard for FOCAL signs — their presence argues against a diffuse degeneration",
               flavour: "years of progressive global decline rather than the days-to-weeks course of an encephalopathy. When a patient with an established dementia declines suddenly, the answer is almost always a superimposed DELIRIUM — infection, drugs, pain, constipation or retention — and not the dementia moving faster" },
      confirmatoryExtra: ["A sudden decline on a background of dementia is investigated as a delirium, every time. Treating it as progression is the commonest and most consequential error in this group"],
    },
    "Neurodegenerative disease (Alzheimer's, Parkinson's)": {
      slots: { level: "the SLEEP-WAKE pattern with a diary or actigraphy over two weeks, plus the daytime cognition it degrades",
               flavour: "progressive circadian fragmentation with SUNDOWNING and night-time wandering. This is frequently the symptom that precipitates a care-home placement — so treating it is not a comfort measure, it is what keeps someone at home" },
      confirmatoryExtra: ["Exclude what makes it worse before adding anything: pain, nocturia, sleep apnoea, alcohol, caffeine, and sedating or activating drugs given at the wrong time of day"],
      monitoringExtra: [
        "LIGHT AND ROUTINE FIRST — bright light in the morning, activity during the day, and a dark, quiet night. Sedatives in this group increase falls, confusion and mortality, and antipsychotics carry a stroke and mortality risk in dementia that has to be weighed explicitly rather than assumed away",
        "Ask what the nights are actually like for the CARER. Night-time wandering is the symptom that exhausts families fastest, and support at night is often the intervention that works",
      ],
    },
    "Neurodegenerative disease (Parkinson's, Alzheimer's)": {
      slots: { level: "SMELL FORMALLY, with a standardised test rather than by asking — patients conflate smell with taste and consistently under-report the loss",
               flavour: "anosmia PRECEDES the motor and cognitive features by years, which makes it an early marker rather than an incidental finding. It is not on its own a reason to investigate for a degenerative disease, and it should not be presented to the patient as one" },
      confirmatoryExtra: [
        "EXCLUDE THE COMMON AND TREATABLE CAUSES FIRST — chronic rhinosinusitis, nasal polyps, post-viral loss and head injury account for most anosmia, and an ENT examination is what settles it",
        "Ask about REM SLEEP BEHAVIOUR DISORDER — acting out dreams — which sits alongside anosmia as an early marker, and about constipation. Together they carry more weight than any of them alone",
      ],
      monitoringExtra: ["SAFETY: a patient who cannot smell cannot detect gas, smoke or spoiled food. Smoke alarms, a gas safety check and food-dating advice are the practical part of this consultation and are almost always omitted"],
    },
  }),

  // ---- ROUND 14 (tranche 3): PARKINSONIAN DEGENERATION ----
  ...family("parkinsonian-degeneration", PARKINSONIAN_SPINE, {
    "Parkinson's disease": {
      slots: { level: "bradykinesia with a DECREMENT on repetitive movement — the amplitude falling away as the movement is repeated is the finding, not slowness alone — plus rest tremor, rigidity and the gait",
               flavour: "ASYMMETRIC onset with a rest tremor, bradykinesia and a good levodopa response. Asymmetry is the single most useful early feature, and a symmetrical picture should make you look again at the drug chart and at the atypical syndromes" },
      confirmatoryExtra: ["Ask about the PRODROME — anosmia, constipation, REM sleep behaviour disorder and depression frequently precede the motor features by years, and their presence supports the diagnosis at a stage when the examination is equivocal"],
    },
    "Atypical parkinsonism (PSP / MSA)": {
      slots: { level: "the features that do NOT belong to Parkinson's disease — vertical gaze, postural blood pressure, early falls, symmetry, and the response to levodopa",
               flavour: "early falls with a vertical gaze palsy points to PSP; early autonomic failure with bladder and blood-pressure involvement points to MSA. Both progress faster than Parkinson's disease and respond poorly to levodopa, which is why the label matters early" },
      confirmatoryExtra: [
        "MEASURE LYING AND STANDING BLOOD PRESSURE PROPERLY rather than asking about dizziness — autonomic failure is the discriminator for MSA and it is measurable in the clinic in a few minutes",
        "MRI signs support but do not make the diagnosis: midbrain atrophy in PSP, and pontine or middle cerebellar peduncle change in MSA. A normal scan does not exclude either",
      ],
      monitoringExtra: ["THE PROGNOSIS IS DIFFERENT AND SO IS THE TIMING OF EVERY CONVERSATION: swallowing, communication, mobility and advance care planning all arrive sooner than in Parkinson's disease, and deferring them to the pattern of a typical clinic is how the window is missed"],
      urgency: "urgent",
    },
    "Progressive supranuclear palsy": {
      slots: { level: "VERTICAL gaze, and specifically DOWNgaze, then the OCULOCEPHALIC manoeuvre — a supranuclear palsy is overcome by passive head movement, which is what makes it supranuclear",
               flavour: "years rather than weeks: early BACKWARD falls with a vertical gaze palsy worst on downgaze. It is the slow mimic of the dorsal midbrain syndrome, and the preserved reflex eye movements are what separate a degeneration from a lesion in the tectum" },
      confirmatoryExtra: ["Ask about the FALLS DIRECTION and the timing — falling backwards within the first year, without warning and without protective reactions, is close to characteristic and is a history no scan replaces"],
      monitoringExtra: [
        "FALLS ARE THE MAIN CAUSE OF INJURY AND OF DEATH here, and they are unusually resistant to intervention because the patient lacks insight into the risk. Weighted frames, home modification and honest discussion with the family do more than physiotherapy alone",
        "The vertical gaze palsy makes eating and stairs hazardous in a way patients cannot explain — feeding, environment and lighting all belong in the plan",
      ],
      bySite: {
        dorsal_midbrain_tectum: { level: "vertical gaze in both directions, convergence-retraction nystagmus, and the pupils — then the oculocephalic manoeuvre" },
        pseudobulbar_corticobulbar: { level: "the jaw jerk, speech, swallow and emotional control — PSP produces a pseudobulbar picture alongside the gaze palsy, and the SWALLOW is what shortens life" },
      },
    },
    "Multiple system atrophy (MSA-C)": {
      slots: { level: "POSTURAL BLOOD PRESSURE and bladder function alongside the ataxia — the autonomic failure is the diagnosis, not an accompaniment",
               flavour: "progressive ataxia with EARLY and PROMINENT autonomic failure: postural hypotension, bladder dysfunction and erectile failure. Ataxia alone is a long differential, and it is the autonomic story that narrows it" },
      confirmatoryExtra: [
        "MEASURE THE POSTURAL DROP and check a post-void residual: both are simple, both are frequently omitted, and together they carry more diagnostic weight here than the MRI does",
        "ASK ABOUT NOCTURNAL STRIDOR AND SLEEP-DISORDERED BREATHING. Stridor in MSA is a recognised cause of sudden death, it is treatable, and it will not be volunteered — the question has to be put to whoever shares the room",
      ],
      urgency: "urgent",
    },
    "Corticobasal degeneration": {
      slots: { level: "the ASYMMETRY above everything — apraxia, rigidity, dystonia, myoclonus and cortical sensory loss, all markedly worse on one side",
               flavour: "years of progressive, strikingly ASYMMETRIC limb apraxia with rigidity, dystonia, myoclonus and an ALIEN LIMB that acts against the patient's intention. The apraxia is out of proportion to the weakness, which is what distinguishes it" },
      confirmatoryExtra: ["Test PRAXIS explicitly and test CORTICAL SENSATION on the affected side — neither is part of a standard examination, and without them the picture reads as an odd, drug-unresponsive parkinsonism"],
      monitoringExtra: ["The affected limb becomes painfully dystonic and useless; pain management, splinting and occupational therapy matter more here than dopaminergic drugs, which usually do not work"],
      urgency: "urgent",
    },
    "Corticobasal syndrome from other pathology (PSP, Alzheimer's)": {
      slots: { level: "the same asymmetric cortical and extrapyramidal signs — and then the features of the OTHER diseases that produce them",
               flavour: "the SYNDROME and the PATHOLOGY are not the same thing: this clinical picture arises from corticobasal degeneration, from PSP, and from Alzheimer's disease, so the label describes what is seen rather than what is causing it" },
      confirmatoryExtra: [
        "SAY SO TO THE PATIENT AND THE FAMILY. Naming a syndrome and naming a disease are different acts, and the honest position — that the picture is clear and the underlying pathology is not — prevents a later 'change of diagnosis' that feels like an error",
        "It matters practically because ALZHEIMER pathology is one of the causes, so where the answer would change management, biomarkers can identify the treatable-in-part subgroup",
      ],
      urgency: "urgent",
    },
  }),

  // ---- ROUND 14 (tranche 3): PROGRESSIVE ATAXIA ----
  ...family("progressive-ataxia", ATAXIA_SPINE, {
    "Spinocerebellar / cerebellar degeneration": {
      slots: { level: "gait and limb coordination, speech, and the eye movements — nystagmus, saccadic pursuit and square-wave jerks",
               flavour: "years of progressive ataxia with DOWNBEAT nystagmus, often with a family history. Downbeat nystagmus points to the craniocervical junction or the flocculus, so a CHIARI MALFORMATION has to be excluded on the scan before a degeneration is accepted — one is operable and the other is not" },
      confirmatoryExtra: ["A family history is asked for over three generations and including consanguinity, since a recessive or a mitochondrial pattern is easily missed when only parents and siblings are asked about"],
    },
    "Progressive ataxia with palatal tremor (PAPT)": {
      slots: { level: "the PALATE at rest with the mouth open, alongside gait, limb coordination and speech",
               flavour: "palatal tremor with progressive ataxia and NO preceding brainstem lesion. The ABSENCE of a causative lesion is the whole diagnosis — symptomatic palatal tremor follows a stroke or a demyelinating lesion within the Guillain-Mollaret triangle, and this sporadic degenerative form does not" },
      confirmatoryExtra: [
        "REVIEW THE MRI SPECIFICALLY FOR AN OLD LESION IN THE TRIANGLE — dentate, red nucleus, inferior olive and the connections between them. Finding one makes this the wrong diagnosis, and the hypertrophic olivary change itself appears in both forms",
        "Consider the treatable and inherited mimics that produce ataxia with palatal tremor: superficial siderosis, Alexander disease and the progressive ataxia syndromes with a genetic cause",
      ],
      bySite: {
        guillain_mollaret_rubral: { level: "the palate, plus any tremor of the arm — a rubral or Holmes tremor is present at rest, on posture AND on action, which no other tremor is" },
        guillain_mollaret_triangle: { level: "the palate, the eyes for oculopalatal tremor, and gait — the tremor persists in SLEEP, which is a discriminator no functional movement shares" },
      },
    },
    "Alcohol / toxic / paraneoplastic degeneration": {
      slots: { level: "the pattern — midline and truncal against limb ataxia — plus gait, and the peripheral nerves, which are usually involved too",
               flavour: "SUBACUTE midline and truncal ataxia. The tempo is the point: weeks to months is not a degeneration, and this grouping exists because alcohol, a toxin and a paraneoplastic process all produce the same picture and all have something that can be done about them" },
      confirmatoryExtra: [
        "GIVE PARENTERAL THIAMINE BEFORE ANY GLUCOSE where alcohol or malnutrition is possible — Wernicke's encephalopathy is treatable, is frequently incomplete in its presentation, and giving glucose first can precipitate it. Do not wait for confirmation",
        "TAKE AN HONEST ALCOHOL HISTORY, including from the family, and screen for the deficiencies that travel with it — thiamine, B12, folate and magnesium",
        "Where the course is subacute and no toxin explains it, look for the CANCER: anti-neuronal antibodies and CT of chest, abdomen and pelvis, with a gynaecological and breast assessment in women and a testicular examination in men. Paraneoplastic cerebellar degeneration can precede the tumour's discovery by a year or more",
      ],
      urgency: "urgent",
    },
  }),

  // ---- ROUND 14 (tranche 3): BENIGN PAROXYSMAL POSITIONAL VERTIGO, BY CANAL ----
  ...family("bppv-canal", BPPV_SPINE, {
    "Posterior-canal BPPV (canalithiasis)": {
      slots: { level: "the DIX-HALLPIKE in both directions, watching for latency, direction, duration and fatigability",
               flavour: "brief spinning vertigo lasting under a minute, triggered by lying down, rolling over or looking up. The Dix-Hallpike reproduces it with UPBEAT-TORSIONAL nystagmus after a short latency, and it fatigues on repetition. This is the commonest canal by a wide margin, and the Epley is its manoeuvre" },
    },
    "Horizontal-canal BPPV": {
      slots: { level: "the SUPINE ROLL (Pagnini-McClure) test, not the Dix-Hallpike — and which side gives the stronger response",
               flavour: "vertigo triggered by ROLLING OVER IN BED. GEOTROPIC nystagmus (beating towards the ground) indicates canalithiasis and APOGEOTROPIC nystagmus indicates cupulolithiasis, and the two need different manoeuvres — which is why this canal is the one most often treated unsuccessfully" },
      confirmatoryExtra: ["A patient who has had a failed Epley and still has positional vertigo very often has HORIZONTAL-canal BPPV that was never tested for, because the Dix-Hallpike does not assess this canal"],
    },
    "Anterior-canal BPPV": {
      slots: { level: "positional testing in both Dix-Hallpike positions and in the straight head-hanging position, watching the direction of the torsional component",
               flavour: "the rarest variant, because the anatomy of this canal lets debris drain spontaneously. It gives DOWNBEAT-torsional nystagmus on positional testing — and downbeat nystagmus is also the signature of a CENTRAL lesion, so this is the canal where the central mimic must be actively excluded rather than assumed against" },
      confirmatoryExtra: ["Because of that overlap, a persistent downbeat positional nystagmus that does not respond to repositioning is imaged — the craniocervical junction and the posterior fossa — rather than manoeuvred again"],
      urgency: "urgent",
    },
  }),

  // ---- ROUND 14 (tranche 3): DEGENERATIVE SINGLETONS ----
  // Each is here rather than in a family because what it needs is specific to it, which is the same
  // reasoning that made the tranche-2 degenerative set singletons.

  "Meniere's disease": dz("Meniere's disease", {
    confirmatory: [
      "AUDIOMETRY IS THE DIAGNOSTIC TEST, and it has to be done more than once: the diagnosis requires DOCUMENTED low-frequency sensorineural hearing loss in the affected ear, and the fluctuation is what distinguishes it. A single normal audiogram between attacks does not exclude it",
      "THE ATTACK DEFINES IT: episodes lasting roughly twenty minutes to several hours — not seconds, which is positional vertigo, and not days, which is a neuritis or a stroke — with tinnitus, aural FULLNESS and hearing change during the attack, and wellness between them",
      "MRI WITH INTERNAL AUDITORY MEATUS VIEWS to exclude a VESTIBULAR SCHWANNOMA, which presents with progressive unilateral hearing loss and imbalance and is the tumour this diagnosis hides",
      "Examine {level}; and consider VESTIBULAR MIGRAINE, which is commoner than Ménière's disease, overlaps with it almost completely, and is treated entirely differently — ask about headache, photophobia and motion sensitivity around the attacks",
    ],
    monitoring: [
      "SAFETY NET: DROP ATTACKS (Tumarkin crises) — sudden falls without warning and without loss of consciousness — occur in this disease and cause serious injury. Ask about them directly, and address DRIVING explicitly, because unheralded incapacitating vertigo is a licensing matter",
      "Track {level} with SERIAL AUDIOGRAMS, which is the only objective record of progression and the basis of every treatment decision",
      "Diet and lifestyle measures come first — reducing salt, caffeine and alcohol — with betahistine or a diuretic as medical treatment; intratympanic and surgical options are for disease that resists them, and some of them cost hearing",
      "Hearing loss becomes PERMANENT over years even as the vertigo settles, so hearing rehabilitation and tinnitus support belong in the long-term plan rather than at the end of it",
    ],
    urgency: "routine",
    referral: "ENT or a neuro-otology service, with audiology; vestibular physiotherapy for the imbalance between attacks",
    bySite: {
      peripheral_vestibular_posterior_canal: { level: "positional testing as well as the hearing — BPPV is common in the same ear and the two coexist, so a positional component does not exclude this diagnosis" },
      peripheral_vestibular_labyrinth: { level: "hearing, tinnitus and aural fullness in each ear, plus the head impulse test and gait between attacks" },
    },
  }),

  "Holmes-Adie (tonic) pupil": dz("Holmes-Adie (tonic) pupil", {
    confirmatory: [
      "THIS IS A BENIGN DIAGNOSIS, AND THE WORK-UP EXISTS TO CONFIRM THAT RATHER THAN TO FIND SOMETHING. A large pupil that constricts SLOWLY AND TONICALLY to a near target and re-dilates slowly, in a young adult, is the picture — and the SLIT LAMP shows the segmental, vermiform iris movements that clinch it",
      "DILUTE PILOCARPINE CONFIRMS DENERVATION SUPERSENSITIVITY: the affected pupil constricts to a concentration too weak to affect a normal one. It is a bedside test, and a positive result is the difference between reassurance and an unnecessary work-up",
      "CHECK THE DEEP TENDON REFLEXES, particularly the ankle jerks — their absence completes HOLMES-ADIE SYNDROME and supports the benign diagnosis rather than raising a new concern",
      "Examine {level}. The important negatives are the ones that would make this something else: PTOSIS and ophthalmoplegia mean a THIRD NERVE PALSY and need urgent vessel imaging, and light-near dissociation with SMALL irregular pupils is an ARGYLL ROBERTSON pupil, which means syphilis serology",
    ],
    monitoring: [
      "SAFETY NET: an isolated tonic pupil needs no imaging, but a large pupil WITH a ptosis or any eye movement deficit is a third nerve palsy until proven otherwise, and that is a posterior communicating aneurysm question with a clock on it",
      "Track {level}: the pupil becomes SMALLER over years rather than larger, and the fellow eye may become involved later — both are expected, and neither is a new disease",
      "Reassurance is the treatment. Photophobia and difficulty with near focus are the real symptoms; sunglasses, and reading glasses or dilute pilocarpine drops where the near vision is troublesome, are usually all that is needed",
      "Where a tonic pupil appears with widespread areflexia and autonomic symptoms, consider an acquired autonomic neuropathy instead — the pupil is then part of a systemic problem rather than an isolated finding",
    ],
    urgency: "routine",
    referral: "Ophthalmology or neuro-ophthalmology for confirmation; no further work-up where the picture is typical and isolated",
    bySite: {
      pupil_pretectum: { level: "the LIGHT-NEAR DISSOCIATION and the pupils' size and regularity — the pretectal alternative is a dorsal midbrain lesion, which brings a vertical gaze palsy and lid retraction with it, so look at the eye movements before settling on the benign answer" },
      pupil_ciliary_ganglion: { level: "the pupil at the slit lamp for segmental palsy and vermiform movement, accommodation, and the ankle jerks" },
    },
  }),

  "Superficial siderosis": dz("Superficial siderosis", {
    confirmatory: [
      "THE MRI SEQUENCE IS THE DIAGNOSIS, AND IT MUST BE ASKED FOR: GRADIENT-ECHO or susceptibility-weighted imaging shows a haemosiderin rim coating the brainstem, cerebellum and cord. Routine sequences do not show it, so the scan has to be requested with this question on it",
      "THEN FIND THE BLEEDING SOURCE, which is the point of making the diagnosis, because stopping the bleeding is what stops the disease: image the WHOLE NEURAXIS including the spine for a dural defect, a previous surgical site, a nerve root avulsion, a cavernoma or a tumour",
      "A DURAL TEAR IN THE SPINE IS THE COMMONEST SOURCE and is often decades after the causative injury or operation. CT myelography or dynamic imaging may be needed to find it when the standard MRI does not",
      "Examine {level}: the triad is progressive BILATERAL sensorineural deafness, ataxia and myelopathy — and formal audiometry documents the hearing loss, which is usually the first and worst-affected part",
    ],
    monitoring: [
      "SAFETY NET: the deficits are largely IRREVERSIBLE, so the value of this diagnosis lies entirely in finding and closing the source before more is lost. A delay of years is typical, and each year costs hearing",
      "Track {level} with serial audiometry and gait assessment — the hearing loss progresses even after the source is closed, and knowing that in advance prevents a successful repair being read as a failure",
      "Hearing rehabilitation early: conventional aids help while there is residual function, and cochlear implantation is considered, though the outcome is less predictable than in other causes of deafness because the nerve itself is damaged",
      "Iron chelation is used in some centres and remains of uncertain benefit — say so plainly rather than offering it as an established treatment",
    ],
    urgency: "urgent",
    referral: "Neurology with neurosurgery and neuroradiology to find the source; audiology and vestibular rehabilitation alongside",
  }),

  "Creutzfeldt-Jakob disease": dz("Creutzfeldt-Jakob disease", {
    confirmatory: [
      "THE TEMPO IS WHAT MAKES THIS URGENT RATHER THAN THE TREATMENT: a RAPIDLY progressive dementia over WEEKS TO MONTHS, with myoclonus and ataxia. That course excludes the ordinary degenerative dementias and puts the treatable rapid causes in front of you",
      "EXCLUDE THE TREATABLE MIMICS FIRST AND PROPERLY, because that is the only part of this work-up that can change an outcome: AUTOIMMUNE ENCEPHALITIS (serum and CSF neuronal antibodies), CNS vasculitis, lymphoma, thyroid disease with Hashimoto's encephalopathy, B12, HIV and syphilis. Several are steroid- or immunotherapy-responsive",
      "MRI WITH DIFFUSION IS THE KEY IMAGING and it must be requested with this question: cortical RIBBONING and basal ganglia restricted diffusion are characteristic and are readily overlooked when the scan is reported as generic atrophy. In the variant form, symmetrical posterior thalamic high signal is the pulvinar sign",
      "CSF FOR RT-QuIC — now the test with much the best performance — with 14-3-3, and an EEG for the periodic sharp wave complexes of the sporadic form. Examine {level}",
    ],
    monitoring: [
      "SAFETY NET: INFECTION CONTROL AND INSTRUMENT HANDLING carry specific prion requirements, and they must be flagged BEFORE any procedure, biopsy or operation rather than discovered afterwards",
      "Refer to the NATIONAL PRION SURVEILLANCE SERVICE — it is part of making the diagnosis, not an administrative afterthought, and it guides which investigations are worth doing",
      "Track {level}. The course is relentless and measured in months, so palliative involvement belongs early, and myoclonus, agitation and pain are treatable even when the disease is not",
      "The family needs senior, consistent and repeated communication, and questions about heritability and about risk to others should be answered by the surveillance service rather than improvised",
    ],
    urgency: "urgent",
    referral: "Neurology urgently, with the national prion surveillance service; palliative care early",
    bySite: {
      thalamus_arousal_paramedian: { level: "conscious level and arousal alongside the cognition, plus myoclonus and startle",
        flavour: "symmetrical high signal in the POSTERIOR THALAMI on FLAIR and diffusion — the pulvinar sign — is characteristic of the variant form and must be looked for specifically" },
    },
  }),

  "Creutzfeldt-Jakob disease (Heidenhain variant)": dz("Creutzfeldt-Jakob disease (Heidenhain variant)", {
    confirmatory: [
      "IT PRESENTS TO OPHTHALMOLOGY, AND THAT IS THE TRAP: rapidly progressive visual failure over WEEKS — distorted colours, difficulty judging distance, then cortical blindness — with entirely normal eyes. Patients are given new glasses, sometimes twice, before anyone examines the cognition",
      "NORMAL EYES WITH FAILING VISION MEANS THE CORTEX. Once the ophthalmic examination is normal, the next test is an MRI WITH DIFFUSION, requested with this question: occipital cortical ribboning is the finding, and it is easily reported as unremarkable if nobody asks",
      "Then the same rapid-dementia work-up as any other prion presentation, and for the same reason — to exclude the TREATABLE causes of a rapid decline: autoimmune encephalitis with neuronal antibodies, vasculitis, lymphoma, thyroid, B12, HIV and syphilis",
      "CSF RT-QuIC and 14-3-3, and an EEG for periodic complexes. Examine {level} — and MYOCLONUS and dementia follow the visual failure rather than accompanying it, so their absence early does not argue against the diagnosis",
    ],
    monitoring: [
      "SAFETY NET: prion INFECTION CONTROL applies from the moment this is suspected, and it applies to ophthalmic instruments and to any procedure involving the eye — which is precisely where this patient has already been seen",
      "Refer to the national prion surveillance service, and involve neurology urgently rather than continuing an ophthalmic work-up",
      "Track {level}. Vision is lost quickly and completely, so practical support for blindness is needed within weeks, not at the pace a progressive eye disease would require",
      "The visual presentation means the family have often been told this is an eye problem. Correcting that gently and clearly, by someone senior, matters more here than in almost any other presentation",
    ],
    urgency: "urgent",
    referral: "Neurology urgently with the national prion surveillance service; palliative care early",
  }),

  "Narcolepsy with cataplexy (orexin/hypocretin loss)": dz("Narcolepsy with cataplexy (orexin/hypocretin loss)", {
    confirmatory: [
      "CATAPLEXY IS THE DIAGNOSIS AND IT MUST BE ASKED ABOUT PRECISELY: sudden bilateral loss of muscle tone triggered by LAUGHTER or emotion, with AWARENESS FULLY PRESERVED. Ask about the jaw, the head and the knees rather than about 'collapsing', because patients describe it as a feeling of weakness and doctors record it as syncope or as a seizure",
      "POLYSOMNOGRAPHY FOLLOWED BY A MULTIPLE SLEEP LATENCY TEST is the confirmatory pathway, and the overnight study also excludes the far commoner sleep apnoea and quantifies the sleep the patient is actually getting",
      "CSF OREXIN (HYPOCRETIN) is low or undetectable and is diagnostic where the picture is atypical or the sleep studies cannot be interpreted — the disease is loss of the orexin neurones of the lateral hypothalamus, so this measures the lesion directly",
      "Examine {level}, and take the whole tetrad: excessive daytime sleepiness, cataplexy, sleep paralysis and hypnagogic hallucinations. MRI is indicated where the onset is late or there are other hypothalamic features, since a structural lesion can produce secondary narcolepsy",
    ],
    monitoring: [
      "SAFETY NET: DRIVING AND MACHINERY. Sleep attacks and cataplexy are incompatible with safe driving until treated and stable, the licensing authority must be notified, and this conversation happens at the first appointment rather than the third",
      "Track {level} with a validated sleepiness scale and a sleep diary — the response to treatment is judged on those rather than on the patient's impression, which is skewed by years of adaptation",
      "SCHEDULED NAPS AND SLEEP HYGIENE ARE REAL TREATMENT and work alongside drugs; stimulants for the sleepiness and specific agents for cataplexy are separate decisions, and cataplexy can worsen if an antidepressant used to treat it is stopped suddenly",
      "The diagnosis is typically delayed by many years, during which patients are labelled lazy, depressed or epileptic. Saying that plainly, and addressing the school or workplace, is part of the treatment",
    ],
    urgency: "routine",
    referral: "A sleep service with neurology; occupational health or school liaison where the diagnosis affects work or study",
  }),

  "Mesial temporal sclerosis / temporal lobe epilepsy": dz("Mesial temporal sclerosis / temporal lobe epilepsy", {
    confirmatory: [
      "THE HISTORY IS THE DIAGNOSIS AND IT NEEDS A WITNESS: recurrent STEREOTYPED events with a rising epigastric aura, déjà vu, an unpleasant smell or taste, then a motionless stare with lip-smacking or fumbling automatisms, and post-ictal confusion. Stereotypy across events is the feature that distinguishes seizures from almost everything else",
      "MRI WITH A DEDICATED EPILEPSY PROTOCOL — thin coronal sequences angled through the hippocampi. A standard head MRI misses hippocampal sclerosis routinely, so the request has to say what is being looked for",
      "EEG, understanding what it can and cannot do: an interictal recording is often normal and does NOT exclude epilepsy, while prolonged or sleep-deprived recording raises the yield. The diagnosis is not made or unmade by a single tracing",
      "Examine {level}, and ask about the antecedents — prolonged febrile convulsions in childhood, meningitis, encephalitis or head injury, sometimes decades earlier, all associate with hippocampal sclerosis",
    ],
    monitoring: [
      "SAFETY NET: DRIVING, and then swimming, baths, heights, working at height and the care of small children. The licensing rules are specific and non-negotiable, and this conversation belongs in the first consultation with a written record that it happened",
      "Track {level} and keep a SEIZURE DIARY — the frequency is what treatment decisions rest on, and patients are unaware of many of their own seizures, so a family member's record is more accurate than theirs",
      "MEDICATION-RESISTANT TEMPORAL LOBE EPILEPSY IS SURGICALLY TREATABLE, and this is the part most often missed: when two appropriate drugs have failed, further drugs are unlikely to achieve seizure freedom while surgery for hippocampal sclerosis often does. Refer to an epilepsy surgery service rather than trying a third and fourth agent",
      "Address MOOD, MEMORY and, in women of childbearing potential, the choice of drug and pre-conception counselling — some anti-seizure medications carry substantial teratogenic risk and that discussion happens before pregnancy, not during it",
    ],
    urgency: "urgent",
    referral: "Neurology or an epilepsy service; an epilepsy surgery centre where two drugs have failed",
  }),

  "Cerebral small-vessel disease (confluent leukoaraiosis)": dz("Cerebral small-vessel disease (confluent leukoaraiosis)", {
    confirmatory: [
      "THIS IS THE ACCUMULATED BURDEN RATHER THAN ANY ONE LACUNE, and that is what the diagnosis is saying: years of a widening, MAGNETIC gait with urinary urgency and cognitive slowing, where each new small infarct lands on an already compromised network",
      "MRI RATHER THAN CT — CT systematically understates white-matter disease, and the extent of it is the diagnosis. Report it as a burden (confluent versus punctate), and look for the lacunes, the microbleeds and the enlarged perivascular spaces that go with it",
      "EXCLUDE NORMAL PRESSURE HYDROCEPHALUS on the same scan: the magnetic gait, urinary urgency and cognitive slowing are the same triad, and it is potentially reversible. The ventricles and the sulcal pattern answer it",
      "Examine {level}; and screen for the treatable contributors — B12, thyroid, sleep apnoea and depression all deepen this picture and all respond to treatment even though the white matter does not",
    ],
    monitoring: [
      "BLOOD PRESSURE CONTROL IS THE TREATMENT, and it is the only intervention that alters the trajectory. That makes it a neurological prescription rather than a background cardiovascular matter, and it belongs in the letter in those terms",
      "SAFETY NET: an ABRUPT step down in function is a new stroke or a delirium, not this disease progressing — the label must not be allowed to explain away the next event",
      "Track {level} with gait and cognition together; and treat FALLS as the immediate risk, because a gait disorder in this group is what fractures a hip",
      "Address CONTINENCE explicitly. Urgency is part of the syndrome, patients rarely raise it, and it drives social isolation and care-home admission more powerfully than the cognitive change does",
    ],
    urgency: "routine",
    referral: "Neurology or a memory service, with vascular risk management; physiotherapy and continence services alongside",
  }),

  // ---- ROUND 14 (tranche 3): ROOT COMPRESSION AT A NAMED LEVEL ----
  // The chronic spondylosis members badge ROUTINE and the acute prolapses URGENT. That is the tranche-1
  // ruling working as intended — a plan may sit below the site's badge, because a tool that escalates
  // everything stops meaning anything. What keeps it safe is that the immediate and first-line tiers stay
  // the site's, and that every member carries the cord and cauda equina safety net.
  ...family("degenerative-radiculopathy", RADICULOPATHY_SPINE, {
    "Cervical spondylosis / foraminal stenosis": {
      urgency: "routine",
      slots: { level: "the dermatome, the segmental reflex, and the strength of the muscles that root supplies",
               flavour: "a chronically narrowed foramen in an older neck — the pain is worse on EXTENSION and on rotation towards the affected side, and better with the hand placed on the head" },
      bySite: {
        root_c3: { level: "sensation over the upper neck and the angle of the jaw, neck movement — and the DIAPHRAGM, since C3 contributes to it",
                   flavour: "high cervical levels feed the phrenic nerve, so ask about breathlessness lying flat. A high cervical radiculopathy that is also short of breath is a different problem from a painful neck" },
        root_c4: { level: "sensation across the top of the shoulder and the base of the neck, and again the diaphragm",
                   flavour: "C4 pain is felt over the shoulder cape and is regularly investigated as a shoulder problem — the discriminator is that it does not change with shoulder movement" },
      },
    },
    "Cervical spondylosis / foraminal stenosis (C4/5)": {
      urgency: "routine",
      slots: { level: "shoulder ABDUCTION (deltoid), the BICEPS jerk, and sensation over the badge area",
               flavour: "weak abduction with a depressed biceps jerk names C5 — and always check for coexisting MYELOPATHY, because spondylosis narrows the canal and the foramen together" },
    },
    "Cervical spondylosis / foraminal stenosis (C5/6)": {
      urgency: "routine",
      slots: { level: "elbow flexion, the BRACHIORADIALIS (supinator) jerk, and sensation over the THUMB",
               flavour: "C5/6 is one of the commonest levels; the thumb and the supinator jerk together name it, and the myelopathy check applies here too" },
    },
    "Cervical spondylosis / foraminal stenosis (C6/7)": {
      urgency: "routine",
      slots: { level: "elbow EXTENSION, the TRICEPS jerk, and sensation over the MIDDLE FINGER",
               flavour: "C6/7 is the commonest radiculopathy of all — weak triceps with a depressed triceps jerk and a numb middle finger, and again look for myelopathy" },
    },
    "Cervical spondylosis / foraminal stenosis (C7/T1)": {
      urgency: "routine",
      slots: { level: "finger flexion, the small muscles of the hand, and sensation over the LITTLE FINGER",
               flavour: "C8 is less common than C6 or C7 — and hand wasting with little-finger numbness has to be separated from an ulnar neuropathy and from a THORACIC OUTLET or Pancoast lesion, so look at the chest apex and the sympathetic supply" },
    },
    "Disc prolapse (C2/3)": {
      slots: { level: "sensation over the upper neck and occiput, and neck movement in each direction",
               flavour: "ACUTE — the pain radiates to the occiput and the ear and is worse on extension and rotation towards the side, which is what separates it from the chronic foraminal picture" },
    },
    "Disc prolapse (C3/4)": {
      slots: { level: "sensation across the top of the shoulder, and diaphragm function",
               flavour: "ACUTE neck pain radiating across the shoulder cape. At this height the phrenic contribution matters, so breathlessness lying flat is asked about rather than waited for" },
    },
    "Disc prolapse (C4/5)": {
      slots: { level: "deltoid power and the biceps jerk",
               flavour: "ACUTE neck-to-shoulder pain with deltoid weakness, relieved by placing the hand ON TOP OF THE HEAD — the shoulder abduction relief sign, which is close to specific for a cervical disc" },
    },
    "Disc prolapse (C5/6)": {
      slots: { level: "elbow flexion, the supinator jerk and thumb sensation",
               flavour: "ACUTE pain radiating to the thumb, reproduced by extension and ipsilateral rotation with axial compression (Spurling's test)" },
    },
    "Disc prolapse (C6/7)": {
      slots: { level: "elbow extension and the triceps jerk",
               flavour: "ACUTE pain radiating to the middle finger with triceps weakness — the commonest acute cervical disc, and the triceps jerk is the sign most often not tested" },
    },
    "Disc prolapse (C7/T1)": {
      slots: { level: "finger flexion, hand intrinsics and little-finger sensation",
               flavour: "ACUTE pain radiating to the little finger with hand weakness — and hand wasting at this level always prompts a look at the lung apex before it is called degenerative" },
    },
    "Disc prolapse or foraminal stenosis (T1)": {
      slots: { level: "the small muscles of the hand, sensation over the inner arm, and the PUPIL",
               flavour: "T1 disease is rare compared with the cervical levels, and that rarity is the point: hand intrinsic wasting with inner-arm pain, particularly with a Horner's, is a PANCOAST TUMOUR until the apex has been imaged" },
      confirmatoryExtra: ["IMAGE THE LUNG APEX, not only the spine. A T1 radicular pattern with hand wasting or a Horner's is the classic presentation of an apical lung tumour, and a spine MRI alone will not show it"],
    },
    "Disc prolapse (T12/L1)": {
      slots: { level: "sensation across the GROIN in the L1 dermatome, and hip flexion",
               flavour: "ACUTE groin pain with an L1 sensory disturbance. High lumbar discs are uncommon, and at the thoracolumbar junction the CONUS is close — so sphincter function is asked about here rather than assumed" },
    },
    "Disc prolapse (L1/2)": {
      slots: { level: "hip flexion and sensation over the upper anterior thigh",
               flavour: "ACUTE anterior thigh pain with weak hip flexion. A high lumbar disc is uncommon enough that the alternatives — a psoas problem, a hip, a femoral neuropathy or diabetic amyotrophy — are worth thinking about before it is accepted" },
    },
    "Disc prolapse (L2/3 or L3/4)": {
      slots: { level: "KNEE EXTENSION, the knee jerk, and the FEMORAL STRETCH test (prone hip extension) rather than the straight-leg raise",
               flavour: "ACUTE anterior thigh pain with quadriceps weakness. The straight-leg raise tests the lower roots and will be negative here, so the femoral stretch test is what reproduces it" },
    },
    "Disc prolapse (L3/4)": {
      slots: { level: "knee extension, the knee jerk, and sensation over the MEDIAL SHIN",
               flavour: "ACUTE pain into the medial shin with quadriceps weakness and a positive femoral stretch test — weak knee extension is a falls risk from the first day, so it is not a purely painful problem" },
    },
    "Lumbar spondylosis / foraminal stenosis": {
      urgency: "routine",
      slots: { level: "the dermatome, the segmental reflex and the muscles of that root",
               flavour: "CHRONIC and POSITIONAL — worse on standing and on extension, better on sitting or leaning forward. That posture-dependence is the history that names it" },
      bySite: {
        root_l1: { level: "sensation across the GROIN, hip flexion, and the abdominal wall",
                   flavour: "L1 groin pain worse on standing and extension. Groin pain has a long non-spinal differential — hernia, hip and genitourinary — so those are excluded rather than assumed away" },
        root_l2: { level: "hip flexion, thigh adduction, and sensation over the anterior thigh",
                   flavour: "L2 anterior thigh symptoms. In a diabetic patient the same picture is DIABETIC AMYOTROPHY, which is painful, wasting and does not need a surgeon" },
        root_s1: { level: "plantarflexion tested by REPEATED SINGLE-LEG HEEL RAISES, the ANKLE JERK, and sensation over the sole and lateral foot",
                   flavour: "S1 buttock-to-sole pain with a lost ankle jerk. Couch testing of plantarflexion misses all but severe weakness, which is why the heel raises matter — and the ankle jerk frequently never returns, even after full recovery" },
      },
    },
    "Lumbar spondylosis / foraminal stenosis (L3/4)": {
      urgency: "routine",
      slots: { level: "knee extension, the knee jerk, and the femoral stretch test",
               flavour: "CHRONIC anterior thigh symptoms with weak knee extension — positional, and worse on standing and walking" },
      bySite: {
        root_l3: { level: "knee extension and hip adduction, with sensation over the lower anterior thigh",
                   flavour: "L3 disease weakens the quadriceps enough to buckle the knee, so ask about falls and about the stairs specifically rather than about pain alone" },
        root_l4: { level: "knee extension and ankle INVERSION, with sensation over the medial shin",
                   flavour: "L4 adds inversion weakness to the quadriceps picture, and the preserved inversion is what separates an L5 root from a peroneal palsy one level down" },
      },
    },
    "Lumbosacral spondylosis / foraminal stenosis": {
      urgency: "routine",
      slots: { level: "posterior thigh sensation, hamstring power and the sacral reflexes",
               flavour: "CHRONIC posterior thigh discomfort, worse on standing and walking. The sacral levels are where a chronic complaint and a cauda equina emergency use the same words, so the sphincter questions are asked at every visit" },
      bySite: {
        root_s2: { level: "posterior thigh sensation, plantarflexion endurance, and the ANAL REFLEX and sphincter tone" },
        root_s3: { level: "PERINEAL sensation and bladder function specifically — this is a level where the deficit that matters is the one the patient will not raise unless asked" },
      },
    },
    "Lumbar spondylosis / foraminal or lateral recess stenosis": {
      urgency: "routine",
      slots: { level: "dorsiflexion and great-toe extension, hip abduction, and sensation over the dorsum of the foot",
               flavour: "LATERAL RECESS stenosis traps the traversing L5 root: buttock and leg pain worse on standing and walking and relieved by sitting or leaning forward. Weak INVERSION and HIP ABDUCTION separate the root from a peroneal palsy, which is the discrimination this level exists to make" },
    },
    "Cervical spondylosis or C3-5 root disease": {
      slots: { level: "the DIAPHRAGM — respiratory function sitting AND lying, plus the neck and the upper limbs",
               flavour: "C3, 4 and 5 keep the diaphragm alive, so high cervical disease can present as BREATHLESSNESS rather than as a painful neck. A patient short of breath lying flat, with a neck problem, is a neurological presentation being managed as a respiratory one" },
      confirmatoryExtra: [
        "MEASURE VITAL CAPACITY ERECT AND SUPINE. A substantial fall on lying down is the signature of diaphragm weakness, and it tells you how to interpret a measurement rather than setting a threshold for an action",
        "MRI cervical spine including the high levels — a routine cervical study aimed at C5-C7 can miss the segment responsible",
      ],
      monitoringExtra: ["Nocturnal hypoventilation comes before daytime failure: ask about morning headache, unrefreshing sleep and orthopnoea, and involve the respiratory service before the gases are abnormal"],
      urgency: "urgent",
    },
  }),

  // ---- ROUND 14 (tranche 3): DEGENERATIVE CANAL STENOSIS ----
  ...family("degenerative-canal-stenosis", CANAL_STENOSIS_SPINE, {
    "Cervical spondylotic myelopathy": {
      slots: { level: "hand function against a clock (rapid finger movements, buttons), the gait, and the reflexes ABOVE and BELOW the level",
               flavour: "MONTHS of clumsy hands and a stiffening gait in an older patient, with Hoffmann's and brisk reflexes BELOW the level but not above. That reflex boundary is what localises it, and it is the commonest cause of spinal cord dysfunction in this age group" },
      confirmatoryExtra: ["It is regularly attributed to age, arthritis or a stroke for a year or more before anyone examines the gait and the reflexes together — so the diagnosis is usually late, and late is what limits the outcome"],
      bySite: {
        cord_hemi: { level: "the ASYMMETRY between the two sides — power on one, pinprick on the other",
                     flavour: "asymmetric compression can closely mimic a Brown-Séquard hemicord picture, so a hemicord pattern in an older neck is spondylosis before it is anything more exotic" },
        cord_posterior: { level: "JOINT POSITION SENSE and vibration in the hands and feet, and Romberg",
                          flavour: "dorsal column involvement gives the numb, clumsy hands and the sensory ataxia — and that picture also belongs to B12 and copper deficiency, which are treatable and are excluded with a blood test" },
      },
    },
    "Lumbar canal stenosis (neurogenic claudication)": {
      slots: { level: "the legs AFTER WALKING rather than at rest — examine the patient again once the symptoms have been provoked, because the examination at rest is often normal",
               flavour: "leg pain and heaviness on walking, relieved by SITTING or leaning forward rather than by merely standing still, with PRESERVED PEDAL PULSES. That posture-dependence and those pulses are what separate it from vascular claudication, which is the differential that matters" },
      confirmatoryExtra: ["Check the pulses and consider ankle-brachial pressures: vascular and neurogenic claudication coexist often in this age group, and operating on the wrong one is a well-recognised outcome"],
      monitoringExtra: ["The natural history is slow, so surgery here is largely a QUALITY-OF-LIFE decision made on walking distance rather than an urgent one — unless there is a progressive deficit or a cauda equina feature, which changes it completely"],
      urgency: "routine",
    },
    "Thoracic disc prolapse or spondylosis": {
      slots: { level: "the SENSORY LEVEL on the trunk, and the legs for long-tract signs",
               flavour: "thoracic discs are uncommon, and that is exactly why they are missed: the canal is narrow here and the cord's blood supply is marginal, so a thoracic disc compresses the CORD rather than a root. Band-like trunk pain with any leg sign is a myelopathy" },
      confirmatoryExtra: ["A band of trunk pain is repeatedly worked up as cardiac, biliary or musculoskeletal. The finding that redirects it is a sensory level or a brisk reflex in the legs, so those are examined for rather than waited for"],
      bySite: {
        root_t4: { level: "the sensory level around the nipple line, and the legs" },
        root_t10: { level: "the sensory level at the umbilicus — and BEEVOR'S SIGN, the umbilicus moving upward on head-raising, which localises the lesion around T10 at no cost" },
      },
    },
  }),

  // The treatable one. Missing it is the costly error in every young movement disorder.
  "Wilson's disease": dz("Wilson's disease", {
    confirmatory: [
      "SERUM CAERULOPLASMIN AND 24-HOUR URINARY COPPER — and interpret them together, because caeruloplasmin alone is neither sensitive nor specific and a normal value does not exclude it",
      "SLIT-LAMP EXAMINATION FOR KAYSER-FLEISCHER RINGS by an ophthalmologist — they are present in essentially all patients with NEUROLOGICAL Wilson's, which makes this a high-yield test and one that can be done the same day",
      "MRI brain: the 'face of the giant panda' in the midbrain is characteristic, with basal ganglia and thalamic signal change — and liver function, clotting and an ultrasound, since the liver is involved even when it is silent",
      "Examine {level}, and consider genetic testing and liver biopsy where the picture is suggestive but the biochemistry is equivocal",
    ],
    monitoring: [
      "SAFETY NET: THIS IS TREATABLE AND THE ALTERNATIVE IS DEATH OR SEVERE DISABILITY. Any young person with an unexplained movement disorder, dysarthria, tremor or a psychiatric presentation with neurological signs should be screened — the cost of the test is trivial and the cost of missing it is not",
      "Track {level}; and warn that neurological function can WORSEN transiently when chelation begins, which is expected rather than a reason to stop",
      "SCREEN SIBLINGS AND FIRST-DEGREE RELATIVES — presymptomatic treatment prevents the disease entirely, which makes this one of the highest-value family screens in neurology",
      "Lifelong treatment and adherence monitoring: relapse after stopping is common and can be catastrophic, and adherence in adolescence is where it usually fails",
    ],
    urgency: "urgent",
    referral: "Hepatology and neurology together, with genetics for family screening",
    bySite: {
      basal_ganglia_striatum: { level: "tremor, dystonia and dysarthria",
        flavour: "the striatum is where the movement disorder comes from — the classic WING-BEATING tremor, oromandibular dystonia and the risus sardonicus that gives the fixed smile" },
      cerebellum_pancerebellar: { level: "gait, limb coordination and speech",
        flavour: "an ataxic presentation is less well known than the dystonic one and is therefore missed more often — a young person with unexplained ataxia deserves the same copper screen" },
    },
  }),

  "Motor neurone disease (ALS)": dz("Motor neurone disease (ALS)", {
    confirmatory: [
      "EMG AND NERVE CONDUCTION STUDIES looking for widespread denervation across multiple regions with NORMAL sensory studies — the combination of upper and lower motor neurone signs in the same territories is the clinical core",
      "EXCLUDE THE TREATABLE MIMICS BEFORE ACCEPTING THIS, because the diagnosis is irreversible in its consequences: MRI of the whole neuraxis for cervical myeloradiculopathy, anti-GM1 antibodies for MULTIFOCAL MOTOR NEUROPATHY, and B12, copper, thyroid and parathyroid function",
      "MRI brain and cervical spine specifically to exclude a structural cause of combined upper and lower motor neurone signs, which is the single commonest mimic",
      "Examine {level}, and test for the pseudobulbar features — emotional lability, a brisk jaw jerk — which localise to the corticobulbar tracts rather than to the bulbar nuclei",
    ],
    monitoring: [
      "SAFETY NET: MEASURE RESPIRATORY FUNCTION FROM DIAGNOSIS, including erect and supine vital capacity and sniff nasal pressure — respiratory failure is what kills, ventilatory support materially extends and improves life, and the assessment is repeatedly deferred until it is an emergency",
      "Track {level}, and assess SWALLOW and nutrition early; gastrostomy is placed while respiratory function still permits it safely, which means discussing it before it is needed",
      "MULTIDISCIPLINARY care demonstrably improves survival and quality of life, so referral to a specialist service is a treatment rather than a courtesy",
      "Communication, advance care planning and honest prognostic conversation belong early — the window in which the patient can express their own wishes closes, and it closes silently",
    ],
    urgency: "urgent",
    referral: "A specialist motor neurone disease service — neurology, respiratory, dietetics, speech therapy and palliative care together",
  }),

  "Variant Creutzfeldt-Jakob disease": dz("Variant Creutzfeldt-Jakob disease", {
    confirmatory: [
      "MRI WITH FLAIR AND DIFFUSION LOOKING FOR THE PULVINAR SIGN — symmetrical hyperintensity of the posterior thalami, more marked than the striatum. It is the imaging finding that distinguishes the variant form and it must be asked for specifically",
      "CSF for RT-QuIC and 14-3-3, and EEG — noting that the periodic complexes of sporadic CJD are usually ABSENT in the variant form, so a normal EEG does not help",
      "Take the history that fits: a YOUNGER patient with a PSYCHIATRIC or sensory prodrome for months before the neurological decline, which is the opposite of sporadic CJD's rapid dementia in an older patient",
      "Examine {level}, and involve the national prion surveillance service early — they guide investigation, including tonsil biopsy where appropriate",
    ],
    monitoring: [
      "SAFETY NET: INFECTION CONTROL AND INSTRUMENT HANDLING have specific requirements for suspected prion disease, and they must be flagged BEFORE any procedure or surgery rather than after",
      "Track {level}; the course is relentless and the care is supportive, so the emphasis shifts early to symptom control and family support",
      "This is a notifiable and nationally monitored condition — the surveillance referral is part of the diagnosis, not an administrative extra",
      "Families need consistent, senior and repeated communication: the diagnosis carries public and personal weight far beyond most neurological illness",
    ],
    urgency: "urgent",
    referral: "Neurology with the national prion surveillance service; palliative care early",
  }),

  "Cervical spondylotic amyotrophy / structural cord lesion": dz("Cervical spondylotic amyotrophy / structural cord lesion", {
    confirmatory: [
      "MRI CERVICAL SPINE — this is the STRUCTURAL MIMIC of motor neurone disease, and it is the reason every patient with combined upper and lower motor neurone signs is imaged before the degenerative label is applied",
      "EMG to define the distribution: denervation confined to a few contiguous myotomes points to a root or cord level, while widespread denervation across regions points away from a structural cause",
      "The features that favour a structural lesion: a SENSORY level or sensory symptoms, a clear anatomical boundary to the wasting, neck pain, and sphincter involvement — none of which belong to early motor neurone disease",
      "Examine {level}, and look for the wasting confined to a segmental distribution rather than spreading across regions",
    ],
    monitoring: [
      "SAFETY NET: THIS IS THE ONE THAT IS OPERABLE. Distinguishing it from motor neurone disease changes the outcome completely, so the threshold for imaging is essentially zero and the scan is repeated if the picture evolves atypically",
      "Track {level}; a progressive myelopathy with cord signal change is a decompression question with a clock, and delay costs function that does not return",
      "Where both coexist — spondylosis is common in the age group that develops motor neurone disease — the surgical decision becomes genuinely difficult and belongs to a specialist discussion rather than a default",
      "If a decompression is performed and the deficit continues to progress in a non-segmental pattern, revisit the diagnosis rather than the surgery",
    ],
    urgency: "urgent",
    referral: "Spinal surgery with neurology — and a motor neurone disease service if the structural cause is excluded",
  }),
};

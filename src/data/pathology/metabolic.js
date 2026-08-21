// metabolic.js — pathology workups for the METABOLIC / TOXIC / NUTRITIONAL category.
//
// Several of these are reversible if treated early and irreversible if not, which is why treatment
// precedes confirmation more often here than anywhere else.
//
// Content only — the builders live in ./builders.js and the public API in ../pathologyNextSteps.js.
// Teaching prompts, not directives: no doses, no definitive management.
//
// REVIEW STATUS: ✅ ALL SIGNED OFF by the owner (a clinician), 2026-08-18.
//   Tranche 1 — Wernicke's encephalopathy. Tranche 2 (round 6) — thiamine/nutritional, metabolic
//   myelopathy, toxidrome, hypoxic-ischaemic, and six singletons. The metabolic red set is complete.
import { dz, family } from "./builders.js";

// ---- ROUND 6 (tranche 2): the metabolic red set ----
// The organising fact of this category is that most of it is REVERSIBLE if treated early and irreversible
// if not — so treatment repeatedly precedes confirmation, and the diagnostic sample is taken on the way.

// THIAMINE AND NUTRITIONAL DEFICIENCY. Treat first, confirm later, and never give glucose before thiamine.
const THIAMINE_SPINE = {
  confirmatory: [
    "PARENTERAL THIAMINE ON SUSPICION, BEFORE ANY GLUCOSE-CONTAINING FLUID — a glucose load in a thiamine-deplete patient precipitates the encephalopathy, and this ordering is the single most important thing in this family",
    "MRI supports but never excludes: symmetrical change in the mammillary bodies, periaqueductal grey and medial thalami — {flavour}",
    "Do not wait for thiamine levels or red cell transketolase; the results arrive far too late to guide the decision that has to be made now",
    "Look BEYOND ALCOHOL for the cause — hyperemesis, bariatric surgery, prolonged vomiting, malignancy and malnutrition all produce it, and the non-alcoholic cases are the ones that get missed",
  ],
  monitoring: [
    "SAFETY NET: undertreated, this becomes KORSAKOFF SYNDROME, which is largely irreversible. Under-dosing and stopping early do as much harm as not treating",
    "Track {level}; the eye signs improve first and fastest, and their improvement supports the diagnosis retrospectively",
    "Replace MAGNESIUM as well — thiamine-dependent enzymes require it, and thiamine may not work while magnesium is low",
    "Arrange nutritional review and treat the underlying cause, or the deficiency recurs the moment the acute episode is over",
  ],
  urgency: "emergency",
  referral: "Acute medicine and neurology; alcohol liaison, bariatric or nutrition services as the cause dictates",
};

// TREATABLE METABOLIC MYELOPATHIES AND ATAXIAS. Rare, easily mistaken for degenerative disease, and the
// reason to know them is that the deficiency ones reverse — or at least arrest — on replacement.
const METABOLIC_MYELOPATHY_SPINE = {
  confirmatory: [
    "SEND THE WHOLE REVERSIBLE PANEL AT ONCE rather than one test at a time: B12 with methylmalonic acid and homocysteine, COPPER and caeruloplasmin, zinc, and vitamin E — these present identically and only a panel separates them",
    "MRI of the whole cord: symmetrical DORSAL COLUMN signal change is the shared signature, and it looks the same whichever deficiency caused it — {flavour}",
    "Take the exposure and surgical history that explains the deficiency: bariatric or gastric surgery, malabsorption, restrictive diet, EXCESS ZINC (which blocks copper absorption), and nitrous oxide use",
    "Examine {level} — and note that a normal B12 level does NOT exclude functional deficiency, which is why the metabolites are sent alongside it",
  ],
  monitoring: [
    "SAFETY NET: DEFICIENCY MYELOPATHIES ARREST BUT SELDOM REVERSE once established, so the delay to diagnosis is the prognosis — this is a diagnosis to make early rather than confidently",
    "Track {level} after starting replacement: stabilisation is a success here, and expecting recovery sets the patient up for disappointment",
    "Where nitrous oxide is the cause, addressing the USE is the treatment — replacement alone fails while exposure continues, and this needs asking about directly and without judgement",
    "Check the haematology too: the neurological damage can precede any anaemia, so a normal blood count is not reassurance",
  ],
  urgency: "urgent",
  referral: "Neurology with gastroenterology or nutrition; genetics for the inherited metabolic causes",
};

// DRUG AND TOXIN EMERGENCIES. The history is the investigation, and the treatment is usually removal of
// the agent plus supportive care — so the drug chart outranks the scanner.
const TOXIDROME_SPINE = {
  confirmatory: [
    "THE DRUG CHART AND THE HISTORY ARE THE INVESTIGATION — prescribed, over-the-counter, recreational, herbal, and anything started or stopped in the last fortnight. This is where the diagnosis is, not on the scan",
    "Examine the AUTONOMIC signature, which is what separates the toxidromes: pupils, sweating, bowel sounds, skin temperature and reflexes — {flavour}",
    "Bloods for the treatable and the dangerous: creatine kinase, renal function, electrolytes, glucose, and a temperature that is actually measured rather than assumed",
    "Track {level}, and consider a toxicology screen — but negative results never exclude a toxidrome, since most agents are not on the panel",
  ],
  monitoring: [
    "SAFETY NET: HYPERTHERMIA plus rigidity is a medical emergency whatever the label. Active cooling, aggressive fluids and critical care come BEFORE settling the argument about which syndrome it is",
    "Monitor creatine kinase and renal function — rhabdomyolysis is the common pathway to harm, and it is preventable with early fluids",
    "Track {level} and the conscious level, and STOP the offending agent — continuing it while investigating is the commonest error here",
    "Contact a poisons service early: specific antidotes and management differ sharply between syndromes that look alike at the bedside",
  ],
  urgency: "emergency",
  referral: "Critical care and clinical toxicology; psychiatry liaison where the agent was prescribed",
};

// HYPOXIC-ISCHAEMIC AND GLOBAL INJURY. The insult is over by the time you meet the patient, so the work
// is preventing the second insult and being honest about prognosis at the right time — not the first day.
const HYPOXIC_SPINE = {
  confirmatory: [
    "ESTABLISH THE INSULT precisely: duration of arrest or hypoxia, downtime before resuscitation, the lowest recorded saturation or pressure, and the environment — a carbon monoxide exposure is invisible unless it is asked about",
    "MRI with diffusion after the acute phase shows the watershed and selectively vulnerable regions; early CT is usually unhelpful except to exclude something else — {flavour}",
    "EEG for non-convulsive status and for myoclonic status, both of which are common, treatable, and impossible to detect clinically in a sedated patient",
    "Examine {level} — but interpret it against sedation, temperature and organ failure, all of which confound it",
  ],
  monitoring: [
    "SAFETY NET: DO NOT PROGNOSTICATE EARLY. Sedation, hypothermia, renal and hepatic failure all suppress the examination, and confident early pessimism becomes self-fulfilling. Multimodal assessment comes after rewarming and off sedation",
    "Prevent the SECOND insult: oxygenation, blood pressure, glucose, temperature and seizure control are the treatment, and each is a modifiable determinant of the final outcome",
    "Track {level}; and expect a DELAYED syndrome in carbon monoxide and some hypoxic injuries — a patient who recovers and then deteriorates weeks later is a recognised course, not a new event",
    "Families need honest, staged conversations rather than a single early verdict — the uncertainty is real and saying so is more useful than a confident guess",
  ],
  urgency: "emergency",
  referral: "Critical care with neurology; hyperbaric medicine where carbon monoxide is confirmed and available",
};


// ---- ROUND 11 (tranche 3): the metabolic NON-red set ----
// The most duplicated bucket in the model: four spellings of diabetic amyotrophy, three of the
// entrapment-prone note and five of anticonvulsant toxicity. The spellings are aliased in
// ../pathologyNextSteps.js; what follows are the diseases.

// DIABETIC COMPLICATIONS — one disease with many neurological faces. The spine is the same throughout:
// confirm the diabetes, look for its other complications, and treat glycaemic control as part of the
// neurological management rather than someone else's problem.
const DIABETIC = {
  confirmatory: [
    "HbA1c AND FASTING GLUCOSE — and where they are normal but suspicion is high, an ORAL GLUCOSE TOLERANCE TEST, because impaired glucose tolerance alone causes neuropathy and is missed by HbA1c",
    "{flavour}",
    "SCREEN THE OTHER COMPLICATIONS at the same visit: retinopathy, nephropathy with urinary ACR, and the feet. Neurological presentations are frequently the first time a patient is examined properly",
    "Exclude the treatable neuropathy mimics that coexist: B12 (especially on metformin), thyroid, paraprotein and alcohol",
  ],
  monitoring: [
    "{level}",
    "GLYCAEMIC CONTROL IS PART OF THIS TREATMENT — but warn about TREATMENT-INDUCED NEUROPATHY: a rapid fall in HbA1c can precipitate acute painful neuropathy, so correction should be gradual",
    "Foot care, footwear and podiatry wherever sensation is reduced; the avoidable harm is ulceration rather than the neuropathy itself",
  ],
  urgency: "routine",
  referral: "Diabetes service with neurology; podiatry where sensation is impaired.",
};

// DRUG AND TOXIN — the diagnosis is in the drug chart, and the test is a level plus a rechallenge that
// never happens. The unifying claim: STOP THE DRUG AND SEE, which nothing else in the sieve allows.
const DRUG_TOXICITY = {
  confirmatory: [
    "TAKE THE DRUG CHART AS THE HISTORY — including doses, recent changes, over-the-counter and herbal preparations, and check for the INTERACTION that pushed a stable drug into toxicity",
    "{flavour}",
    "Measure levels where they exist, but treat the patient rather than the number: toxicity occurs within the therapeutic range, particularly in the elderly and in renal impairment",
    "Check renal and hepatic function and electrolytes — a stable dose becomes toxic when clearance falls",
  ],
  monitoring: [
    "{level}",
    "WITHDRAWAL IS THE DIAGNOSTIC TEST: improvement after stopping or reducing confirms it, and no other cause in the differential offers that",
    "Where the drug cannot be stopped, involve the prescribing specialty rather than stopping unilaterally — the indication may matter more than the side effect",
  ],
  urgency: "urgent",
  referral: "The prescribing specialty with neurology; toxicology where levels are high.",
};

// NUTRITIONAL DEFICIENCY — treatable, and the harm comes from delay rather than from difficulty.
const DEFICIENCY = {
  confirmatory: [
    "{flavour}",
    "TREAT ON SUSPICION RATHER THAN WAITING FOR THE RESULT where the picture fits — the deficiency states cause irreversible damage while confirmation is pending, and replacement is harmless",
    "Look for the CAUSE of the deficiency rather than just replacing it: diet, malabsorption, coeliac disease, bariatric surgery, alcohol, metformin and nitrous oxide use",
    "Check the related nutrients together — B12, folate, copper, vitamin E and thiamine travel with one another, and correcting one alone can unmask another",
  ],
  monitoring: [
    "{level}",
    "REPLACE PARENTERALLY where absorption is the problem; oral replacement of a malabsorption state does not work and wastes months",
    "Recovery is slow and often incomplete once axonal loss is established — which is the argument for treating early rather than perfectly",
  ],
  urgency: "urgent",
  referral: "Gastroenterology or dietetics for the cause; neurology for the deficit.",
};

export default {
  // ---- DIABETIC ----
  ...family("diabetic-complication", DIABETIC, {
    "Diabetes mellitus": {
      slots: { flavour: "establish which diabetic neuropathy this is — length-dependent, focal, radiculoplexus or autonomic — because they differ in prognosis and in whether they recover",
               level: "map the deficit and re-examine; a length-dependent pattern that is asymmetric or rapidly progressive is not simple diabetic neuropathy and needs re-investigation" },
      bySite: {
        nerve_median_carpal_tunnel: { flavour: "diabetes roughly doubles the risk of carpal tunnel syndrome, and diabetic nerves tolerate compression badly — but DECOMPRESSION STILL WORKS and should not be withheld on the grounds that the patient is diabetic",
          level: "thenar bulk and median sensation; treat the entrapment on its merits alongside the glucose" },
        nerve_lat_fem_cutaneous: { flavour: "meralgia in a diabetic is usually mechanical rather than metabolic — weight, belts and posture — so look for the compression before attributing it to the diabetes",
          level: "the lateral thigh patch, confirming power and reflexes are normal" },
        polyneuropathy_length_dependent: { flavour: "the classic length-dependent picture, feet before hands — and remember METFORMIN causes B12 deficiency, so check it rather than assuming the diabetes explains everything",
          level: "feet, footwear and skin at every review; the ulcer is the outcome that matters" } },
    },
    "Diabetic lumbosacral radiculoplexus neuropathy (amyotrophy)": {
      slots: { flavour: "the story is characteristic and the sequence matters: SEVERE THIGH PAIN first, then profound proximal weakness and marked WEIGHT LOSS, often in a well-controlled type 2 patient",
               level: "document quadriceps power and weight; recovery takes many months and is usually good, which is the reassurance patients most need" },
      bySite: {
        root_l2: { level: "hip flexion and the anterior thigh; the pain often begins here before the weakness spreads" },
        root_l3: { level: "knee extension and the knee jerk — the quadriceps is where the wasting is most obvious" },
        root_l4: { level: "knee extension with ankle dorsiflexion and inversion, which is what separates this from a femoral neuropathy" } },
      confirmatoryExtra: ["EMG confirms a radiculoplexus rather than a femoral neuropathy, and MRI lumbar spine excludes the compressive alternative that this most resembles"],
      urgency: "urgent" },
    "Diabetic thoracic radiculopathy": {
      slots: { flavour: "a band of severe truncal pain with dermatomal sensory change, and it is routinely investigated as an abdominal or cardiac emergency before anyone considers the nerve",
               level: "look for the localised ABDOMINAL WALL BULGE from segmental weakness — a physical sign that clinches it and is easily missed" },
      bySite: {
        root_t4: { flavour: "at the nipple line this imitates CARDIAC pain, and patients commonly reach the neurologist only after a negative cardiac workup" },
        root_t10: { flavour: "at the umbilicus this imitates an ACUTE ABDOMEN, and laparotomy has been performed for it — the dermatomal band and the preserved bowel sounds are what should stop that" } },
      urgency: "urgent" },
    "Microvascular (diabetic) ischaemic palsy": {
      slots: { flavour: "a PUPIL-SPARING third-nerve palsy in a vasculopath is the classic microvascular picture — but pupil involvement, pain or progression means imaging for an aneurysm, urgently",
               level: "re-check the pupil daily in the first week: a pupil that becomes involved changes the diagnosis entirely" },
      urgency: "urgent" },
    "Diabetic autonomic neuropathy": {
      slots: { flavour: "ask about the symptoms directly — postural dizziness, gastroparesis, erectile dysfunction, bladder emptying and sweating changes are almost never volunteered",
               level: "lying and standing blood pressure at every visit, and warn that SILENT MYOCARDIAL ISCHAEMIA is a real risk when the afferents fail" } },
    "Diabetes or entrapment-prone neuropathy": {
      slots: { flavour: "diabetic nerves are MORE SUSCEPTIBLE TO COMPRESSION, so an entrapment in a diabetic is both a mechanical and a metabolic problem — decompression still works and should not be withheld",
               level: "the entrapment site alongside a general neuropathy screen; treating one without the other under-treats the patient" },
      bySite: {
        nerve_peroneal_deep: { level: "the first web space and toe extension — and examine the FOOTWEAR, since the deep peroneal is compressed under a tight lace or strap" },
        nerve_peroneal_superficial: { level: "the dorsum of the foot with dorsiflexion preserved; check for a fascial defect and for chronic exertional symptoms" } },
      urgency: "routine" },
    "Diabetes or systemic arthropathy": {
      slots: { flavour: "the name hedges between a metabolic and a mechanical cause, and both are common in the same patient — imaging the joint and testing glucose answers it",
               level: "joint examination alongside the nerve; treating the arthropathy often relieves the nerve" },
      urgency: "routine" },
  }),

  // ---- DRUG AND TOXIN ----
  ...family("drug-toxicity", DRUG_TOXICITY, {
    "Anticonvulsant or lithium toxicity": {
      slots: { flavour: "LITHIUM AND PHENYTOIN levels, with renal function — and note that lithium toxicity can leave PERMANENT cerebellar damage, so it is urgent rather than routine",
               level: "nystagmus, gait and speech as the level falls; persisting cerebellar signs after the level normalises suggest permanent injury" } },
    "Drug toxicity (anticonvulsants, lithium)": {
      slots: { flavour: "check levels and look for the precipitant — dehydration, an NSAID, an ACE inhibitor or a diuretic added to stable lithium is the usual story",
               level: "conscious level and cerebellar signs; lithium toxicity can progress after the last dose" } },
    "Anticonvulsant / drug toxicity (phenytoin, lithium, carbamazepine)": {
      slots: { flavour: "PHENYTOIN follows zero-order kinetics, so a small dose increase produces a large level rise — ask what changed recently rather than assuming steady state",
               level: "gait, eye movements and drowsiness, which appear in that order as the level climbs" } },
    "Drug toxicity (lithium, phenytoin, carbamazepine)": {
      slots: { flavour: "check sodium too — carbamazepine causes hyponatraemia which itself produces ataxia and confusion, and the two mechanisms compound",
               level: "sodium alongside the drug level; correcting one without the other leaves the patient unwell" } },
    "Drug toxicity (anticonvulsants, alcohol)": {
      slots: { flavour: "alcohol and anticonvulsants are additive, and the alcohol history is the part usually not taken — ask about it explicitly and consider withdrawal risk on admission",
               level: "cerebellar signs and withdrawal features together; treat thiamine before glucose" } },
    "Drug-induced parkinsonism": {
      slots: { flavour: "review ALL dopamine blockers including ANTIEMETICS — metoclopramide and prochlorperazine are the ones forgotten, because patients do not consider them medicines",
               level: "the tremor and rigidity over MONTHS after withdrawal: recovery is slow, and stopping too early is judged a failure when it is not" },
      urgency: "routine" },
    "Drug-induced movement disorder (levodopa, antipsychotics, stimulants)": {
      slots: { flavour: "establish the TIMING against doses — levodopa dyskinesia peaks at peak dose, where tardive syndromes emerge after prolonged exposure",
               level: "a diary of movements against dose timing, which does more than any investigation" },
      urgency: "routine" },
    "Tardive dystonia (dopamine-blocker exposure)": {
      slots: { flavour: "take the FULL exposure history including remote and brief courses — tardive syndromes appear after months to years and may begin after the drug has stopped",
               level: "the dystonia over time; it may be permanent, and that possibility should be discussed honestly" },
      urgency: "routine" },
  }),

  // ---- DEFICIENCY ----
  ...family("nutritional-deficiency", DEFICIENCY, {
    "Vitamin B12 deficiency": {
      slots: { flavour: "B12 with METHYLMALONIC ACID and homocysteine where the level is borderline — a 'normal' B12 does not exclude deficiency, and the metabolites are what settle it",
               level: "ASK ABOUT NITROUS OXIDE USE — recreational use causes a functional B12 deficiency with a normal level, and it is now a common cause in young people" },
      bySite: {
        combined_degeneration_scd: { flavour: "here it is a MYELOPATHY — dorsal columns and corticospinal together with the spinothalamic SPARED, which is the pattern that names subacute combined degeneration and separates it from a transverse lesion",
          level: "gait, vibration and plantars; treat urgently, because cord damage becomes irreversible in a way the neuropathy does not" },
        polyneuropathy_length_dependent: { flavour: "here it is a NEUROPATHY — symmetric, distal and slowly progressive, and it can exist without any cord involvement or macrocytosis at all",
          level: "distal sensation and reflexes; the blood count is frequently normal, so a normal film must not be used to exclude it" } },
    },
    "B12 / copper deficiency (SCD)": {
      slots: { flavour: "check COPPER AND CAERULOPLASMIN as well as B12 — copper deficiency causes an identical myelopathy, is caused by zinc excess and bariatric surgery, and is missed because it is not tested",
               level: "dorsal column function and gait; treating B12 alone in a copper-deficient patient achieves nothing" } },
    "Copper deficiency (zinc excess / bariatric)": {
      slots: { flavour: "ask about ZINC — denture adhesives and supplements are the classic hidden sources — and about bariatric surgery, which may be many years earlier",
               level: "gait and dorsal columns; check the full blood count too, since a cytopenia often accompanies it" } },
    "Folate deficiency or methotrexate exposure": {
      slots: { flavour: "folate with B12 ALWAYS — replacing folate alone in B12 deficiency can precipitate or worsen the neurological damage, which is the classic and avoidable error",
               level: "the deficit and the blood count; review methotrexate dosing and whether folate rescue is being taken correctly" } },
    "Coeliac disease or malabsorption": {
      slots: { flavour: "TISSUE TRANSGLUTAMINASE with total IgA — and note that neurological presentations of coeliac disease often occur WITHOUT gastrointestinal symptoms, which is why it is missed",
               level: "the neurological deficit alongside nutritional markers; gluten withdrawal may arrest but rarely reverses established damage" },
      urgency: "routine" },
    "Hypothyroidism, coeliac disease or vitamin E deficiency": {
      slots: { flavour: "the name lists three separate treatable causes and all three should simply be TESTED — TSH, tissue transglutaminase and vitamin E are cheap and the alternative is missing a reversible ataxia",
               level: "gait and dorsal columns; recovery depends on how long the deficiency has run" },
      urgency: "routine" },
    "Alcohol-related or B12/thiamine deficiency": {
      slots: { flavour: "GIVE THIAMINE BEFORE GLUCOSE in anyone alcohol-dependent — a glucose load without thiamine can precipitate Wernicke's encephalopathy, and that error is entirely avoidable",
               level: "eye movements, gait and confusion — the Wernicke triad is incomplete in most cases, so treat on any one of them" },
      urgency: "emergency" },
    "Alcohol excess and nutritional deficiency": {
      slots: { flavour: "thiamine parenterally first, then assess; and screen for the other consequences — liver disease, cardiomyopathy and withdrawal risk",
               level: "withdrawal scoring on admission alongside the neurological deficit" },
      urgency: "urgent" },
  }),

  // ---- SINGLETONS ----
  "Alcohol-related cerebellar degeneration": dz("Alcohol-related cerebellar degeneration", {
    slots: { flavour: "the pattern is characteristic" },
    bySite: {
      cerebellum_vermis: { flavour: "it targets the ANTERIOR SUPERIOR VERMIS, which is why the gait and legs are affected out of proportion to the arms and why speech is often spared — a strikingly selective pattern" },
      cerebellum_pancerebellar: { flavour: "when the WHOLE cerebellum is involved rather than the superior vermis alone, look harder for a second cause — paraneoplastic, hereditary or nutritional — because pure alcohol damage is characteristically vermian" },
    },
    confirmatory: [
      "{flavour}",
      "GIVE THIAMINE PARENTERALLY BEFORE GLUCOSE — Wernicke's encephalopathy coexists, is treatable, and is missed in most cases at first presentation",
      "MRI to exclude the structural alternatives and to look for the superior vermian atrophy",
      "Screen for the other treatable contributors: B12, thiamine, magnesium, and liver disease",
    ],
    monitoring: [
      "ABSTINENCE ARRESTS PROGRESSION and may allow partial recovery — that is the single most useful thing to tell the patient, and it is often not said",
      "Falls risk assessment and physiotherapy; the ataxia is what causes the injuries",
      "Address the alcohol dependence itself with the appropriate service rather than treating only the neurology",
    ],
    urgency: "urgent",
    referral: "Neurology with alcohol services and dietetics.",
  }),

  "Alcohol-induced positional nystagmus": dz("Alcohol-induced positional nystagmus", {
    confirmatory: [
      "THE MECHANISM EXPLAINS THE TIMING: alcohol diffuses into the cupula before the endolymph and then out again, so the nystagmus DIRECTION REVERSES several hours after drinking — a positional nystagmus that changes direction with time is this",
      "Distinguish it from BPPV, which is brief, fatigable and provoked by a specific position rather than present in any lateral position",
      "Take an alcohol history with timing; the diagnosis is made from the history and confirmed by resolution",
      "Where the nystagmus is DOWNBEAT or persists after alcohol has cleared, image the craniocervical junction instead",
    ],
    monitoring: [
      "It resolves as alcohol clears; no treatment is needed beyond explanation",
      "Use it as an opening to discuss alcohol intake, since the patient has usually presented with dizziness rather than for alcohol advice",
      "Persisting nystagmus is not this diagnosis and needs re-evaluation",
    ],
    urgency: "routine",
    referral: "None routinely; ENT or neurology if it persists.",
  }),

  "Length-dependent polyneuropathy": dz("Length-dependent polyneuropathy", {
    confirmatory: [
      "THE SCREEN IS STANDARD AND WORTH DOING IN FULL: glucose and HbA1c, B12, thyroid, renal and liver function, protein electrophoresis with immunofixation, and ESR",
      "A PARAPROTEIN CHANGES EVERYTHING — it is the test most often omitted, and it turns an idiopathic neuropathy into a haematological diagnosis",
      "Nerve conduction studies to separate AXONAL from DEMYELINATING: a demyelinating pattern raises CIDP, which is TREATABLE and must not be labelled idiopathic",
      "Take an alcohol, drug, occupational and family history — and examine the feet of relatives if a hereditary cause is possible",
    ],
    monitoring: [
      "SAFETY NET: foot care, footwear and podiatry. Ulceration and unnoticed injury cause most of the disability, and none of it is caused by the neuropathy directly",
      "Treat neuropathic pain in its own right; it responds even when the neuropathy does not",
      "A neuropathy that is ASYMMETRIC, rapidly progressive, or predominantly motor is not a simple length-dependent one — reconsider rather than accepting the label",
    ],
    urgency: "routine",
    referral: "Neurology with neurophysiology; diabetes or haematology as the screen directs.",
  }),

  "Chemotherapy or drug toxicity (platinum, taxanes, vincristine, isoniazid, amiodarone)": dz("Chemotherapy or drug toxicity (platinum, taxanes, vincristine, isoniazid, amiodarone)", {
    confirmatory: [
      "IDENTIFY THE AGENT AND THE CUMULATIVE DOSE — the neuropathy is dose-dependent, and the oncology record holds the answer rather than the neurological examination",
      "PLATINUM CAUSES COASTING: the neuropathy continues to worsen for MONTHS after the last dose, which is alarming for patients and is not treatment failure",
      "VINCRISTINE IS CATASTROPHIC IN HEREDITARY NEUROPATHY — ask about family history and foot deformity before it is given, not afterwards",
      "For isoniazid, check pyridoxine status: the neuropathy is preventable with supplementation and is a prescribing error when it occurs",
    ],
    monitoring: [
      "GRADE IT AND FEED IT BACK TO THE ONCOLOGY TEAM — dose reduction is the only intervention that reliably works, and that decision needs the neurological grading",
      "Warn about the balance and burn risk from insensate hands and feet, particularly for platinum agents",
      "Duloxetine has the best evidence for the pain; most other agents have little",
    ],
    urgency: "urgent",
    referral: "Oncology first — the dose decision is theirs; neurology for severe or atypical cases.",
  }),

  "Statin-induced myopathy": dz("Statin-induced myopathy", {
    confirmatory: [
      "CREATINE KINASE, and distinguish the three levels of severity: myalgia with a normal CK, myositis with a raised CK, and RHABDOMYOLYSIS with renal failure",
      "LOOK FOR THE INTERACTING DRUG — fibrates, macrolides, azoles, amiodarone and ciclosporin all raise statin levels, and the interaction is usually the reason it happened now",
      "Check thyroid function and vitamin D: hypothyroidism and deficiency both lower the threshold for statin myopathy and are correctable",
      "WHERE WEAKNESS PERSISTS OR CK STAYS HIGH AFTER STOPPING, TEST FOR HMGCR ANTIBODIES — statin-induced immune-mediated necrotising myopathy continues after withdrawal and needs immunosuppression",
    ],
    monitoring: [
      "Stopping the statin resolves the ordinary form within weeks; failure to resolve is the signal for the autoimmune variant rather than a reason to wait longer",
      "REVISIT THE CARDIOVASCULAR INDICATION with the patient — stopping a statin has its own risk, and rechallenge with a different agent or dose often succeeds",
      "Monitor renal function where CK is markedly raised",
    ],
    urgency: "urgent",
    referral: "Primary care or lipid clinic; rheumatology or neurology if it persists after withdrawal.",
  }),

  "Thyroid disease or steroid myopathy": dz("Thyroid disease or steroid myopathy", {
    confirmatory: [
      "TSH AND FREE T4 — both hypo- and hyperthyroidism cause a proximal myopathy, and both are entirely reversible, which makes this a test not worth skipping",
      "STEROID MYOPATHY HAS A NORMAL CK, which is the discriminator from an inflammatory myopathy — and it is painless, proximal and worse in the legs",
      "Review cumulative steroid exposure including inhaled and topical preparations, which patients do not report as medication",
      "Where CK is raised, this is not steroid myopathy — look for an inflammatory or metabolic cause instead",
    ],
    monitoring: [
      "Correcting the thyroid or reducing the steroid reverses it over weeks to months; recovery lags the biochemistry and that lag should be expected rather than investigated",
      "Resistance exercise and physiotherapy help steroid myopathy specifically, more than rest does",
      "Watch for adrenal insufficiency during steroid reduction, which produces its own weakness and fatigue",
    ],
    urgency: "routine",
    referral: "Endocrinology; the prescribing specialty for steroid reduction.",
  }),

  "Chronic kidney disease or hypothyroidism": dz("Chronic kidney disease or hypothyroidism", {
    confirmatory: [
      "RENAL FUNCTION AND TSH — two cheap tests for two reversible causes, and both are routinely omitted in the workup of a neuropathy or carpal tunnel syndrome",
      "In dialysis patients, consider AMYLOID from beta-2 microglobulin, which causes carpal tunnel syndrome specifically and is a different problem",
      "Check calcium, phosphate and parathyroid hormone — renal bone disease contributes to the musculoskeletal picture",
      "Exclude the coexisting causes rather than settling on one: diabetes and renal disease travel together",
    ],
    monitoring: [
      "Correcting the thyroid reverses the deficit; uraemic neuropathy improves with adequate dialysis and resolves after transplantation",
      "Both causes progress silently, so periodic reassessment matters more than a single normal result",
      "Review drug doses against renal function — many neurotoxic drugs accumulate",
    ],
    urgency: "routine",
    referral: "Nephrology or endocrinology as the tests direct.",
  }),

  "Pregnancy, hypothyroidism, acromegaly, rheumatoid or amyloid": dz("Pregnancy, hypothyroidism, acromegaly, rheumatoid or amyloid", {
    confirmatory: [
      "THIS NAME IS A CHECKLIST OF THE SECONDARY CAUSES, and the point is to work through it rather than call the entrapment idiopathic: pregnancy test, TSH, IGF-1, rheumatoid serology and a paraprotein screen",
      "ACROMEGALY IS THE ONE MOST OFTEN MISSED — look at the hands, the jaw and old photographs, because the change is gradual and neither patient nor family notices",
      "BILATERAL carpal tunnel syndrome, or onset in a young patient, should always prompt this search rather than a splint",
      "Where amyloid is possible, look for the systemic features and consider genetic testing for hereditary transthyretin amyloidosis, which is now treatable",
    ],
    monitoring: [
      "Pregnancy-related entrapment usually RESOLVES AFTER DELIVERY — say so, and manage conservatively rather than operating",
      "Treating the underlying cause often resolves the entrapment without surgery, which is the reason to look",
      "Where no cause is found and symptoms persist, decompression remains effective",
    ],
    urgency: "routine",
    referral: "Endocrinology, rheumatology or haematology as the screen directs; hand surgery if it persists.",
  }),

  "Autonomic neuropathy (diabetes, amyloid, Sjogren's)": dz("Autonomic neuropathy (diabetes, amyloid, Sjogren's)", {
    confirmatory: [
      "LYING AND STANDING BLOOD PRESSURE, measured properly at three minutes — this is the test, it costs nothing, and it is the one most often done badly or not at all",
      "Work the causes in order of treatability: glucose, then a paraprotein and amyloid screen, then anti-Ro and anti-La for Sjogren's, then paraneoplastic antibodies",
      "AMYLOIDOSIS IS THE ONE NOT TO MISS — a painful small-fibre neuropathy with autonomic failure, cardiac or renal involvement, and hereditary transthyretin disease is now treatable",
      "Formal autonomic function testing where available, and consider a skin biopsy for small-fibre density",
    ],
    monitoring: [
      "SAFETY NET: falls from orthostatic hypotension, and SILENT myocardial ischaemia where cardiac afferents fail — chest pain may never occur",
      "Non-pharmacological measures first: salt, fluid, compression, head-up sleeping and avoiding the drugs that worsen it",
      "Review the drug chart for antihypertensives, alpha-blockers and tricyclics, which are frequently the largest contributor",
    ],
    urgency: "urgent",
    referral: "Neurology with cardiology; haematology if a paraprotein is found.",
  }),

  "Nocturnal hypotension": dz("Nocturnal hypotension", {
    confirmatory: [
      "24-HOUR AMBULATORY BLOOD PRESSURE MONITORING is the only way to see it — a clinic reading cannot, and this is the entire reason the diagnosis is missed",
      "REVIEW THE TIMING OF ANTIHYPERTENSIVES: evening dosing is frequently the cause, and simply moving it is the treatment",
      "Ask about OBSTRUCTIVE SLEEP APNOEA, which causes nocturnal dips and is independently treatable",
      "Where visual loss on waking is the presentation, examine for the crowded 'disc at risk' and manage as non-arteritic ischaemic optic neuropathy",
    ],
    monitoring: [
      "SAFETY NET: this is a recognised precipitant of NON-ARTERITIC AION, so visual loss noticed on waking should be taken seriously rather than attributed to sleep",
      "Avoid evening antihypertensives and treat any sleep apnoea; both are simple and effective",
      "Re-monitor after changing the regimen to confirm the dip has gone",
    ],
    urgency: "routine",
    referral: "Primary care or cardiology; ophthalmology where there has been visual loss.",
  }),

  "Metabolic or drug-induced coma": dz("Metabolic or drug-induced coma", {
    confirmatory: [
      "GLUCOSE FIRST, AT THE BEDSIDE, IN EVERY UNCONSCIOUS PATIENT — it is the fastest reversible cause and the one that must never be missed",
      "The screen is broad because the causes are: sodium, calcium, urea, ammonia, blood gas, osmolality, liver and thyroid function, and a toxicology screen including alcohol and paracetamol",
      "PRESERVED BRAINSTEM REFLEXES WITH SYMMETRICAL SIGNS point metabolic; asymmetry or a lost brainstem reflex points structural and demands imaging",
      "Give THIAMINE before glucose where alcohol or malnutrition is possible, and consider naloxone and flumazenil where the history fits",
    ],
    monitoring: [
      "SAFETY NET: protect the airway first — the neurological diagnosis is secondary to that, always",
      "Correct sodium SLOWLY: over-rapid correction of chronic hyponatraemia causes osmotic demyelination, converting a reversible coma into a permanent deficit",
      "Re-examine frequently; a metabolic coma that does not improve as the derangement corrects needs imaging for a structural cause",
    ],
    urgency: "emergency",
    referral: "Critical care and acute medicine immediately; neurology if it does not resolve with correction.",
  }),

  "Lead poisoning": dz("Lead poisoning", {
    confirmatory: [
      "BLOOD LEAD LEVEL — and take an OCCUPATIONAL AND ENVIRONMENTAL history: battery work, smelting, demolition, old paint, indoor firing ranges, imported cosmetics, traditional remedies and pica in children",
      "The neuropathy is characteristically MOTOR and affects the WRIST EXTENSORS — a bilateral wrist drop with no sensory loss is close to diagnostic and is otherwise a very rare picture",
      "Full blood count and film for basophilic stippling and anaemia; abdominal pain and constipation often precede the neurology",
      "In children, test siblings and the household — this is an environmental diagnosis rather than an individual one",
    ],
    monitoring: [
      "IDENTIFY AND REMOVE THE SOURCE, and notify public health — chelation without source removal simply allows re-exposure",
      "Chelation is for high levels or symptomatic poisoning and is a specialist decision",
      "Cognitive effects in children may be permanent, which is why the environmental step is more important than the medical one",
    ],
    urgency: "urgent",
    referral: "Toxicology or occupational health, and public health; paediatrics for children.",
  }),

  "Aminoglycoside or magnesium-induced neuromuscular blockade": dz("Aminoglycoside or magnesium-induced neuromuscular blockade", {
    confirmatory: [
      "THE DIAGNOSIS IS IN THE DRUG CHART AND THE INFUSION — check magnesium level and review aminoglycosides, and be alert to it in obstetric patients on magnesium for pre-eclampsia",
      "IT UNMASKS OR WORSENS MYASTHENIA, so a myasthenic crisis after a new antibiotic is this until proven otherwise",
      "Check renal function: both accumulate when clearance falls, and the frail elderly are at particular risk",
      "Neurophysiology is rarely needed acutely — the temporal relationship to the drug is the evidence",
    ],
    monitoring: [
      "SAFETY NET: monitor RESPIRATORY function actively, because neuromuscular blockade can progress to respiratory failure and the deterioration can be rapid",
      "Calcium reverses magnesium-induced blockade; stopping the drug is the treatment otherwise",
      "Record it prominently as a drug alert — recurrence on re-exposure is the avoidable harm",
    ],
    urgency: "emergency",
    referral: "Critical care and the prescribing team immediately; neurology if myasthenia is suspected.",
  }),

  "Bilateral pallidal injury (hypoxia / kernicterus / manganese)": dz("Bilateral pallidal injury (hypoxia / kernicterus / manganese)", {
    confirmatory: [
      "MRI shows symmetrical pallidal signal change, and the SEQUENCE PATTERN separates the causes: manganese and hepatic disease give T1 HIGH signal, where hypoxic injury does not",
      "Take the history that dates the insult: perinatal jaundice or asphyxia, a cardiac arrest, carbon monoxide exposure, or occupational manganese in welding and mining",
      "Check LIVER FUNCTION — chronic liver disease and portosystemic shunting cause manganese accumulation with the same imaging appearance",
      "Consider carbon monoxide specifically where there was a delayed deterioration after an exposure, which is characteristic",
    ],
    monitoring: [
      "The movement disorder is usually FIXED rather than progressive, and dating the insult is what establishes that — a progressive course means the diagnosis is wrong",
      "Treat the dystonia symptomatically; deep brain stimulation results are poorer in secondary dystonia than in primary, and that should be said before referral",
      "Where manganese exposure is ongoing, removing it is the priority and is an occupational health matter",
    ],
    urgency: "routine",
    referral: "Movement disorders neurology; occupational health or hepatology as the cause directs.",
  }),


  // ---- ROUND 6 SINGLETONS ----

  // Iatrogenic in most cases, and the prevention is better understood than the treatment.
  "Osmotic demyelination syndrome (central pontine myelinolysis)": dz("Osmotic demyelination syndrome (central pontine myelinolysis)", {
    confirmatory: [
      "RECONSTRUCT THE SODIUM CURVE from every recorded value — the diagnosis is made from the RATE OF CORRECTION, not from the current level, and the damage follows a rise that was too fast rather than a number that is now normal",
      "MRI is typically NORMAL FOR THE FIRST WEEK or two and then shows the central pontine 'trident' — so an early normal scan in a convincing story means repeating it rather than abandoning the diagnosis",
      "Identify the risk factors that made the patient vulnerable: chronic hyponatraemia, alcohol use, malnutrition, liver disease and transplantation, hypokalaemia",
      "Examine {level} — the classic course is BIPHASIC: an encephalopathy that improves as the sodium corrects, then a quadriparesis and bulbar failure days later, which is the part that gets attributed to something new",
    ],
    monitoring: [
      "SAFETY NET: PREVENTION IS THE TREATMENT. Correct chronic hyponatraemia SLOWLY, and if the sodium has already risen too fast, RELOWERING it is an accepted rescue — so this is worth recognising within hours, not after the deficit appears",
      "Track {level} and the bulbar functions; swallow and airway are what threaten life in the second phase",
      "Watch for LOCKED-IN SYNDROME and establish communication rather than assuming unawareness — patients have described hearing themselves discussed",
      "Prognosis is substantially better than the classical teaching suggests, and meaningful recovery over months is common — so early pessimism is both unkind and often wrong",
    ],
    urgency: "emergency",
    referral: "Critical care with neurology; nephrology or endocrinology for the sodium",
    bySite: {
      pons_medial: { level: "eye movements, facial power and swallow, plus conscious level",
        flavour: "medial pontine involvement takes the sixth and seventh nuclei with the long tracts, so the deficit is broad even when the lesion looks modest" },
      pons_basis_pontis: { level: "all four limbs and speech, with VERTICAL gaze and blinking preserved",
        flavour: "the ventral pons is where LOCKED-IN SYNDROME comes from — the patient is aware, and establishing communication through vertical eye movement is the first thing to do, not the last" },
    },
  }),

  "Extrapontine osmotic demyelination": dz("Extrapontine osmotic demyelination", {
    confirmatory: [
      "Same mechanism, different target: reconstruct the SODIUM CURVE, because the cause is the rate of correction rather than any current value",
      "MRI showing symmetrical change in the BASAL GANGLIA, thalami, cerebellum or white matter — extrapontine involvement occurs with or without the pontine lesion, so its absence does not exclude the syndrome",
      "Examine {level} — extrapontine disease presents as a MOVEMENT DISORDER (parkinsonism, dystonia, chorea) or a behavioural change rather than as the quadriparesis of the pontine form, which is why it is not recognised",
      "Check potassium, magnesium and nutritional status alongside the sodium: hypokalaemia in particular increases the risk",
    ],
    monitoring: [
      "SAFETY NET: as for the pontine form, RELOWERING an over-rapidly corrected sodium is an accepted rescue, and the window is measured in hours",
      "Track {level} and the movement disorder specifically — it may evolve over weeks after the acute illness and is frequently attributed to an unrelated cause by then",
      "Movement disorders here can respond to symptomatic treatment, so specialist review is worthwhile rather than accepting the deficit as fixed",
    ],
    urgency: "emergency",
    referral: "Critical care and neurology, with movement disorder review as it evolves",
  }),

  // Reversible if the cause is treated, and named for that — but the name misleads on both counts.
  "Posterior reversible encephalopathy syndrome (PRES)": dz("Posterior reversible encephalopathy syndrome (PRES)", {
    confirmatory: [
      "MRI with FLAIR: symmetrical, predominantly POSTERIOR subcortical white matter oedema — but note the name misleads twice, because it is not always posterior and not always reversible",
      "FIND AND TREAT THE TRIGGER, which is the actual treatment: severe or rapidly rising blood pressure, eclampsia, renal failure, sepsis, and the immunosuppressive and cytotoxic drugs — {flavour}",
      "In a pregnant or recently pregnant woman this is ECLAMPSIA until proven otherwise — check the blood pressure, urinary protein, platelets and liver function, and involve obstetrics immediately",
      "Examine {level}; and review the drug chart specifically for calcineurin inhibitors and chemotherapy agents, which are common and reversible causes",
    ],
    monitoring: [
      "SAFETY NET: the RATE of blood pressure rise matters more than the absolute value — PRES occurs at pressures that would be unremarkable in a chronic hypertensive, and can occur at normal pressures altogether",
      "Seizures are common and often the presenting event; status epilepticus occurs and needs treating in its own right",
      "Track {level} and reimage if there is no improvement — haemorrhage and infarction complicate a minority and change it from reversible to not",
      "Avoid over-rapid blood pressure lowering, which risks watershed infarction — controlled reduction rather than normalisation is the aim",
    ],
    urgency: "emergency",
    referral: "Acute neurology with the specialty owning the trigger — obstetrics, nephrology, oncology or transplant medicine",
    bySite: {
      cortex_pca: { level: "the visual fields, and whether the patient is AWARE of the deficit",
        flavour: "the parieto-occipital white matter is the classic territory, which is why cortical visual disturbance dominates and is often the presenting complaint" },
      cortex_watershed_posterior: { level: "visual fields and higher visual processing",
        flavour: "the border zone is where the vasogenic oedema concentrates — and it is why the pattern imitates bilateral posterior infarction on a hurried read" },
      subcortex_optic_radiation: { level: "the visual field, formally",
        flavour: "subcortical white matter oedema SPARING the cortex is the discriminator from infarction, which takes both" },
      corpus_callosum_splenium: { level: "reading, and any left-sided visual naming failure",
        flavour: "splenial involvement is well described and reversible — do not read it as a demyelinating or ischaemic lesion on a single scan" },
    },
  }),

  // A movement disorder that is a blood glucose reading.
  "Non-ketotic hyperglycaemia": dz("Non-ketotic hyperglycaemia", {
    confirmatory: [
      "CHECK THE GLUCOSE AND HbA1c — this is a movement disorder whose diagnosis is a blood test, and it is repeatedly imaged and admitted as a stroke before anyone measures it",
      "CT shows striatal HYPERDENSITY and MRI striatal T1 HYPERintensity — a striking and near-specific appearance that is regularly misread as haemorrhage or calcification",
      "Examine {level} — the presentation is HEMICHOREA-HEMIBALLISM, usually in an older patient with poorly controlled or newly diagnosed type 2 diabetes",
      "Exclude ketosis and check osmolality: the syndrome is specifically NON-ketotic, and the metabolic derangement needs correcting in its own right",
    ],
    monitoring: [
      "SAFETY NET: the movement disorder RESOLVES with glycaemic control, usually over days to weeks — so the treatment is the diabetes, and no amount of neurological investigation substitutes for it",
      "Track {level} and the glucose together; failure to improve with control should prompt reconsideration rather than escalation of the movement disorder treatment",
      "Severe chorea can cause exhaustion and rhabdomyolysis — monitor creatine kinase and hydration where it is violent",
    ],
    urgency: "urgent",
    referral: "Diabetes team with neurology",
    bySite: {
      basal_ganglia_striatum: { level: "the amplitude and distribution of the chorea",
        flavour: "the putamen and caudate are the classic targets — unilateral striatal T1 hyperintensity opposite the movements is close to diagnostic" },
      basal_ganglia_subthalamic: { level: "the proximal flinging movements specifically",
        flavour: "subthalamic involvement gives true HEMIBALLISM — violent and exhausting, and more likely to need symptomatic treatment while the glucose is corrected" },
    },
  }),

  // A muscle emergency whose danger is renal.
  "Rhabdomyolysis": dz("Rhabdomyolysis", {
    confirmatory: [
      "CREATINE KINASE, renal function, POTASSIUM, calcium, phosphate and urine dipstick — a dipstick POSITIVE FOR BLOOD with no red cells on microscopy is myoglobin, and that is the bedside clue",
      "Find the cause, because it changes everything after the fluids: crush or compression injury, prolonged immobility, seizures, exertion, drugs and statins, toxins, and an underlying metabolic myopathy",
      "Examine {level} — and look for COMPARTMENT SYNDROME in any swollen, tense, disproportionately painful limb, which is a surgical emergency in its own right",
      "Where it is recurrent, exertional or familial, investigate for an inherited metabolic myopathy AFTER the acute episode rather than accepting a single explanation",
    ],
    monitoring: [
      "SAFETY NET: HYPERKALAEMIA kills first and acute kidney injury follows — ECG and potassium immediately, and aggressive fluids are the treatment while the cause is being established",
      "Monitor renal function, potassium and calcium serially; hypocalcaemia early and REBOUND HYPERcalcaemia later are both recognised and are managed differently",
      "Track {level}: the weakness itself usually recovers, and the lasting harm is renal rather than muscular",
      "Watch the compartments in a crush injury even after fluids have started — reperfusion swelling can produce a compartment syndrome hours later",
    ],
    urgency: "emergency",
    referral: "Acute medicine or critical care with nephrology; orthopaedics urgently if a compartment syndrome is suspected",
  }),

  // Preventable, dose-related, and often permanent.
  "Ototoxicity (aminoglycosides, cisplatin)": dz("Ototoxicity (aminoglycosides, cisplatin)", {
    confirmatory: [
      "REVIEW THE DRUG CHART AND THE CUMULATIVE DOSE — aminoglycosides, cisplatin, loop diuretics and some antimalarials. This is a prescribing diagnosis, and the exposure is usually still ongoing when the patient presents",
      "AUDIOMETRY including HIGH-FREQUENCY testing, which detects the loss before the patient notices it — standard audiometry is normal at the stage where stopping the drug still helps",
      "Examine {level} — and test for BILATERAL vestibular failure with a dynamic visual acuity test and head impulse in both directions, since aminoglycoside toxicity is characteristically bilateral and vestibular rather than cochlear",
      "Check renal function and drug levels: toxicity is dose- and level-related, and renal impairment is what allows accumulation",
    ],
    monitoring: [
      "SAFETY NET: the damage is often PERMANENT, so the intervention that matters is stopping or changing the drug EARLY — this is a diagnosis whose value is entirely preventive",
      "The disabling symptom of bilateral vestibular loss is OSCILLOPSIA — the world moving with head movement — and patients describe it as blurred vision rather than dizziness, so it is missed unless asked about specifically",
      "Track {level}; vestibular rehabilitation genuinely helps bilateral loss and should be referred early rather than after months of adaptation",
      "Flag the drug allergy or caution prominently in the record — re-exposure compounds the loss, and mitochondrial variants make some patients susceptible at ordinary doses",
    ],
    urgency: "urgent",
    referral: "The prescribing team to review the agent, with ENT/audiology and vestibular rehabilitation",
  }),

  // ---- THIAMINE AND NUTRITIONAL DEFICIENCY ----
  ...family("thiamine-nutritional", THIAMINE_SPINE, {
    "Wernicke-Korsakoff syndrome (thiamine deficiency)": {
      slots: { level: "eye movements, gait, and memory once arousal allows testing",
               flavour: "mammillary body change is the signature, and ATROPHY of the mammillary bodies on a later scan marks the transition to the Korsakoff stage" },
    },
    "Korsakoff syndrome (thiamine deficiency)": {
      slots: { level: "anterograde memory specifically, and CONFABULATION",
               flavour: "the chronic, largely irreversible stage — a profound anterograde amnesia with preserved attention and intellect, which is why it is mistaken for evasiveness rather than recognised as amnesia" },
      monitoringExtra: ["Continue thiamine anyway: some improvement is possible, and the alternative is accepting a preventable disability without trying. Capacity and long-term care planning become the substance of the follow-up"],
      urgency: "urgent",
    },
    "Bariatric surgery, hyperemesis or malnutrition": {
      slots: { level: "eye movements, gait and orientation",
               flavour: "the NON-ALCOHOLIC causes, which are the ones that get missed — because the reader is looking for a drinker and finds a post-surgical patient or a pregnant woman vomiting" },
      confirmatoryExtra: ["In HYPEREMESIS GRAVIDARUM, treat before the imaging and before the glucose — this is a recognised and entirely preventable cause of permanent brain injury in a young woman"],
    },
    "Marchiafava-Bignami disease": {
      slots: { level: "gait, interhemispheric transfer, and conscious level",
               flavour: "NECROSIS OF THE CORPUS CALLOSUM in chronic alcohol use — callosal signal change with disconnection signs, and it responds to thiamine, so it is treated as part of the same emergency" },
      confirmatoryExtra: ["Test for the DISCONNECTION signs directly: left-hand agraphia and apraxia to verbal command, which are otherwise never elicited and are what confirm the callosum is involved"],
    },
  }),

  // ---- TREATABLE METABOLIC MYELOPATHIES AND ATAXIAS ----
  ...family("metabolic-myelopathy", METABOLIC_MYELOPATHY_SPINE, {
    "Copper deficiency myelopathy": {
      slots: { level: "vibration, proprioception and gait with the eyes closed",
               flavour: "clinically INDISTINGUISHABLE from B12 deficiency, and the commonest missed cause — check copper in every myelopathy where B12 is normal, and ask about zinc supplements and denture adhesive, which block absorption" },
      confirmatoryExtra: ["Send ZINC alongside copper: zinc excess is a common and reversible cause of copper deficiency, and treating the copper without stopping the zinc does not work"],
    },
    "Nitrous oxide abuse": {
      slots: { level: "dorsal column function, gait, and the reflexes",
               flavour: "nitrous oxide inactivates B12 irreversibly, so the LEVEL CAN BE NORMAL while the patient is functionally deficient — send methylmalonic acid and homocysteine, which are the tests that show it" },
      confirmatoryExtra: ["Ask directly and without judgement about canister use, and note the pattern of heavy recreational use in young people — this is now a common cause of subacute combined degeneration in that age group"],
    },
    "Nitrous-oxide toxicity": {
      slots: { level: "dorsal columns and pyramidal signs together",
               flavour: "the classic subacute combined degeneration picture — dorsal columns and lateral columns with SPARED pain and temperature, which is the dissociation that localises it" },
    },
    "Vitamin E deficiency (mimic)": {
      slots: { level: "gait, proprioception and the reflexes, with the fundus",
               flavour: "imitates Friedreich ataxia closely — ataxia with areflexia and dorsal column loss, plus RETINITIS PIGMENTOSA, and it is treatable with replacement where the genetic disease is not" },
      confirmatoryExtra: ["Check vitamin E with a LIPID profile, since the level must be interpreted against serum lipids — and consider ataxia with isolated vitamin E deficiency, a treatable genetic disorder of its transfer protein"],
    },
    "Abetalipoproteinaemia": {
      slots: { level: "gait, proprioception and the fundus",
               flavour: "fat malabsorption from childhood with ACANTHOCYTES on the blood film, very low cholesterol, and the fat-soluble vitamin deficiencies that follow — the blood film and the lipid panel make the diagnosis cheaply" },
      confirmatoryExtra: ["Blood film for acanthocytes and a full lipid profile: a strikingly LOW cholesterol in a young patient with ataxia is the clue, and high-dose fat-soluble vitamin replacement arrests the progression"],
    },
    "Cerebrotendinous xanthomatosis": {
      slots: { level: "gait, cognition, and the ACHILLES TENDONS on palpation",
               flavour: "TENDON XANTHOMAS — thickened Achilles tendons — with juvenile cataracts, chronic diarrhoea and progressive ataxia. A treatable genetic disease whose physical signs are visible from the end of the bed if you know to look" },
      confirmatoryExtra: [
        "Serum cholestanol and genetic testing for CYP27A1 — and ask about JUVENILE CATARACTS and childhood diarrhoea, which precede the neurology by decades",
        "Treatment with chenodeoxycholic acid arrests and can partially reverse this, so it belongs on the list of ataxias worth testing for rather than accepting as degenerative",
      ],
    },
  }),

  // ---- DRUG AND TOXIN EMERGENCIES ----
  ...family("toxidrome", TOXIDROME_SPINE, {
    "Neuroleptic malignant syndrome / serotonin syndrome": {
      slots: { level: "tone, reflexes and temperature",
               flavour: "the two are separated at the bedside: NMS gives LEAD-PIPE rigidity with HYPOreflexia over days, serotonin syndrome gives CLONUS and HYPERreflexia, worse in the legs, over hours" },
      confirmatoryExtra: ["The TEMPO is as discriminating as the signs: serotonin syndrome develops within 24 hours of a serotonergic drug, NMS over days to weeks of an antidopaminergic. Creatine kinase is usually much higher in NMS"],
    },
    "Anticholinergic or sympathomimetic toxidrome": {
      slots: { level: "pupils, skin, bowel sounds and temperature",
               flavour: "the discriminator is the SKIN: anticholinergic is DRY (hot as a hare, dry as a bone), sympathomimetic is SWEATING — and bowel sounds are absent in one and present in the other" },
    },
    "Acute dystonic reaction": {
      slots: { level: "the posture — neck, jaw, tongue, and the EYES for oculogyric crisis",
               flavour: "an acute, treatable drug reaction that is repeatedly mistaken for a seizure, tetanus or a psychiatric episode — and it responds to an anticholinergic within minutes, which is diagnostic in itself" },
      confirmatoryExtra: ["Check for LARYNGEAL involvement — stridor or difficulty swallowing makes this an airway emergency rather than an inconvenience"],
    },
    "Status dystonicus": {
      slots: { level: "the severity and continuity of the spasms, plus creatine kinase and temperature",
               flavour: "unremitting severe dystonia is a life-threatening emergency through RHABDOMYOLYSIS, renal failure and exhaustion — the movement disorder itself is what kills" },
      confirmatoryExtra: ["Look for the TRIGGER: infection, a missed dose of dopaminergic or antidystonic medication, a drug change, or a failing intrathecal baclofen pump — and check the pump before anything else in a patient who has one"],
    },
    "Drug-induced myasthenia or unmasking": {
      slots: { level: "fatigable weakness, bulbar function and FORCED VITAL CAPACITY",
               flavour: "many common drugs unmask or worsen myasthenia — several antibiotic classes, magnesium, and some cardiac drugs. A deterioration after a new prescription is a recognised pattern, not a coincidence" },
      confirmatoryExtra: ["Review every drug started in the preceding weeks against a myasthenia caution list, and check MAGNESIUM — it is given routinely in some settings and is a potent precipitant"],
    },
    "Organophosphate poisoning": {
      slots: { level: "pupils, secretions, fasciculations and respiratory effort",
               flavour: "the CHOLINERGIC crisis — pinpoint pupils with copious secretions, bradycardia and fasciculations. Occupational or agricultural exposure, and deliberate ingestion, are the settings" },
      confirmatoryExtra: [
        "Red cell and plasma cholinesterase activity confirm it, but treatment is clinical and immediate — and DECONTAMINATE, with staff protection, because secondary exposure is a real risk to the team",
        "Watch for the INTERMEDIATE SYNDROME days later: proximal and respiratory weakness after the cholinergic phase has settled, which catches teams who have relaxed",
      ],
    },
    "Metabolic or toxic encephalopathy": {
      slots: { level: "conscious level, asterixis and myoclonus",
               flavour: "a DIFFUSE encephalopathy with no focal signs — the causes are systemic, and the screen is broad: glucose, sodium, calcium, renal and liver function, ammonia, thyroid, and the drug chart" },
      confirmatoryExtra: ["New FOCAL signs mean this is not a metabolic encephalopathy — image, and reconsider a structural cause"],
    },
    "Drug intoxication or withdrawal": {
      slots: { level: "conscious level, pupils, tremor and autonomic signs",
               flavour: "WITHDRAWAL is the one that kills, and it is the one nobody has documented — alcohol and benzodiazepine withdrawal cause seizures and delirium tremens days after admission for something else" },
      confirmatoryExtra: ["Take a substance history explicitly on admission, including alcohol quantity and the time of the LAST drink — the deterioration on day two is entirely predictable if that has been asked"],
    },
  }),

  // ---- HYPOXIC-ISCHAEMIC AND GLOBAL INJURY ----
  ...family("hypoxic-ischaemic", HYPOXIC_SPINE, {
    "Hypoxic-ischaemic brain injury": {
      slots: { level: "conscious level, brainstem reflexes and myoclonus",
               flavour: "the selectively vulnerable regions — hippocampi, basal ganglia, cortex and the watershed zones — show up on delayed diffusion imaging rather than on the acute scan" },
      bySite: {
        cerebrum_diffuse:                   { level: "conscious level and brainstem reflexes" },
        cortex_aphasia_mixed_transcortical: { level: "repetition against spontaneous speech and comprehension" },
      },
    },
    "Global hypoxic-ischaemic injury": {
      slots: { level: "PROXIMAL limb power and the visual fields",
               flavour: "the border zones fail first — the man-in-a-barrel pattern of proximal weakness with preserved distal function is what global hypoperfusion looks like" },
    },
    "Carbon monoxide poisoning": {
      slots: { level: "conscious level, cognition, and any parkinsonism",
               flavour: "GLOBUS PALLIDUS change is characteristic — and pulse oximetry is FALSELY NORMAL, so the diagnosis needs a carboxyhaemoglobin level and cannot be excluded from the saturation probe" },
      confirmatoryExtra: [
        "Carboxyhaemoglobin on a blood gas, and ask about the SOURCE — faulty heating, a generator, a shared household. Other occupants and pets may be affected and need finding",
        "DELAYED NEUROPSYCHIATRIC SYNDROME occurs weeks after apparent recovery in a minority: warn the patient and arrange follow-up rather than discharging as resolved",
      ],
    },
    "Manganese or carbon monoxide toxicity": {
      slots: { level: "parkinsonism, gait, and any dystonia",
               flavour: "both target the basal ganglia and produce a parkinsonism that is POORLY LEVODOPA-RESPONSIVE — take the occupational history (welding, mining) and ask about parenteral nutrition and liver failure, which raise manganese" },
    },
    "Severe anaemia or haemorrhagic shock": {
      slots: { level: "acuity, the fundus and the pupil",
               flavour: "the optic nerve head has a watershed supply, so profound anaemia or hypotension can infarct it — this is a SYSTEMIC diagnosis presenting through the eye, and correcting the anaemia is the treatment" },
      confirmatoryExtra: ["Find the source of blood loss urgently, and remember that this can follow a period of hypotension in theatre or on dialysis — the eye is the presenting complaint but the problem is elsewhere"],
    },
  }),

  "Wernicke's encephalopathy": dz("Wernicke's encephalopathy", {
    confirmatory: [
      "THIS IS A CLINICAL DIAGNOSIS AND TREATMENT COMES FIRST — parenteral thiamine is given on suspicion, BEFORE any glucose-containing fluid, because a glucose load in a thiamine-deplete patient can precipitate the encephalopathy",
      "MRI shows symmetrical signal change in the mammillary bodies, the periaqueductal grey and the medial thalami — but a NORMAL MRI DOES NOT EXCLUDE IT, and waiting for the scan is the error that causes the harm",
      "Do not wait for thiamine levels or red cell transketolase: the results arrive far too late to guide the decision",
      "Look for the deficiency's context beyond alcohol — hyperemesis, bariatric surgery, prolonged vomiting, malignancy and malnutrition all produce it, and the non-alcoholic cases are the ones that get missed",
    ],
    monitoring: [
      "The classic triad is present in a MINORITY — do not require confusion, ophthalmoplegia and ataxia together before treating; any one of them with a plausible history is enough",
      "Track {level} — {flavour} — and reassess after treatment begins, since the eye signs improve first and fastest and their improvement supports the diagnosis",
      "SAFETY NET: untreated or undertreated, this becomes KORSAKOFF SYNDROME, which is largely irreversible. Under-dosing and stopping early are as damaging as not treating",
      "Replace magnesium as well: thiamine-dependent enzymes need it, and thiamine may not work while magnesium is low",
    ],
    urgency: "emergency",
    referral: "Acute medicine and neurology; alcohol liaison where relevant",
    bySite: {
      thalamus_arousal_paramedian: {
        level: "conscious level and orientation",
        flavour: "paramedian thalamic involvement is what produces the confusion and drowsiness, and it is the component that recovers least",
      },
      skull_base_vi_cisternal: {
        level: "eye abduction, and the eyes for nystagmus",
        flavour: "a bilateral sixth-nerve palsy with nystagmus in this context is Wernicke's until treated otherwise",
      },
      pontomesencephalic_tegmentum: {
        level: "eye movements in all directions, and gait",
        flavour: "periaqueductal involvement gives the ophthalmoplegia — the sign that responds most visibly to treatment",
      },
      hypothalamus_thermoregulatory: {
        level: "temperature, and autonomic stability",
        flavour: "hypothalamic involvement can give hypothermia and hypotension, which are easily attributed to something else in an unwell patient",
      },
    },
  }),
};

// metabolic.js — pathology workups for the METABOLIC / TOXIC / NUTRITIONAL category.
//
// Several of these are reversible if treated early and irreversible if not, which is why treatment
// precedes confirmation more often here than anywhere else.
//
// Content only — the builders live in ./builders.js and the public API in ../pathologyNextSteps.js.
// Teaching prompts, not directives: no doses, no definitive management.
//
// REVIEW STATUS:
//   ✅ Wernicke's encephalopathy — SIGNED OFF 2026-08-18 (tranche 1).
//   ⚠  THIAMINE/NUTRITIONAL (4), METABOLIC MYELOPATHY (6), TOXIDROME (8), HYPOXIC-ISCHAEMIC (5)
//      + 6 singletons — tranche 2 round 6, AWAITING REVIEW.
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

export default {
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

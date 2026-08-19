// congenital.js — pathology workups for the CONGENITAL / HEREDITARY category.
//
// Content only — the builders live in ./builders.js and the public API in ../pathologyNextSteps.js.
// Teaching prompts, not directives: no doses, no definitive management.
//
// REVIEW STATUS:
//   ⚠  the HINDBRAIN / CRANIOCERVICAL MALFORMATION family (7) — tranche 2 round 2b, AWAITING REVIEW.
//   ⚠  7 further singletons — tranche 2 round 9, AWAITING REVIEW.
//
// NOTE ON SCOPE: tranche 2 targets the 337 RED must-not-miss causes, and only 2 of the 7 here are red.
// The other 5 were added at the owner's request (2026-08-18) because the group is only coherent whole —
// authoring Chiari without the syrinx it causes would teach half a mechanism.
import { dz, family } from "./builders.js";

// ---- HINDBRAIN AND CRANIOCERVICAL DEVELOPMENTAL MALFORMATIONS ----
// These are NOT vascular malformations and are deliberately kept out of that family: they share only the
// word. What unites THESE is a developmental anomaly at the hindbrain, craniocervical junction or neural
// tube, and a common mechanism — obstructed CSF flow. That mechanism is why the imaging question is the
// same for all of them, and why a syrinx is a CONSEQUENCE to be hunted rather than a separate diagnosis.
//
// Deliberately excluded: craniocervical TRAUMA (odontoid and condyle fractures) and craniocervical
// COMPRESSION by a foramen-magnum meningioma. Both sit at the same place and neither is developmental.
const HINDBRAIN_SPINE = {
  confirmatory: [
    "MRI of the CRANIOCERVICAL JUNCTION on thin sagittal slices — the anatomy here is missed on a standard brain study, which is framed for the hemispheres and often stops above the problem",
    "MRI of the WHOLE NEURAXIS, brain and entire cord: {flavour}",
    "CSF FLOW STUDY (cine phase-contrast) where surgery is being considered — the question is not what the anatomy looks like but whether flow is actually obstructed, and the two do not always agree",
    "Assess for the associated anomalies rather than stopping at the first: hydrocephalus, a syrinx, scoliosis, and a tethered cord at the other end of the neuraxis",
  ],
  monitoring: [
    "Track {level} at defined intervals — these are chronic and often stable for years, so the decision to operate rests on PROGRESSION rather than on the appearance of the scan",
    "Ask specifically about COUGH or Valsalva-provoked occipital headache: it is the symptom most characteristic of obstructed flow at the foramen magnum, and patients rarely volunteer it because it seems unremarkable to them",
    "SAFETY NET: progressive weakness, new sphincter symptoms, sleep-disordered breathing, or bulbar symptoms such as swallow difficulty or stridor are the features that convert observation into a surgical referral",
    "An INCIDENTAL finding is common and does not itself need treating — matching the symptoms to the anatomy honestly is the harder and more important part of this diagnosis",
  ],
  urgency: "routine",
  referral: "Neurosurgery, with neurology; spinal surgery where a syrinx or tethering is the dominant problem",
};

export default {
  // ---- ROUND 9 SINGLETONS ----

  "Neurofibromatosis type 2": dz("Neurofibromatosis type 2", {
    confirmatory: [
      "MRI OF THE INTERNAL AUDITORY MEATI WITH CONTRAST AND THIN SLICES — BILATERAL vestibular schwannomas are diagnostic, and a standard brain study does not resolve a small intracanalicular tumour",
      "Image the WHOLE NEURAXIS: meningiomas and spinal ependymomas travel with it, and finding them changes the surveillance plan and sometimes the order of operations",
      "Audiometry and vestibular testing as a baseline — hearing preservation is the central goal of management, and decisions are made against a documented starting point",
      "Examine {level}, and examine the SKIN and EYES: cataracts and skin schwannomas support it, and NF2 has few of the café-au-lait macules of NF1, which is a common source of confusion",
    ],
    monitoring: [
      "SAFETY NET: the decision is rarely to remove everything — it is to preserve HEARING and function for as long as possible, so watchful waiting with serial imaging is a legitimate active plan and often the right one",
      "Track {level} and hearing serially; growth rate rather than size drives intervention",
      "GENETIC counselling and screening of first-degree relatives is part of the diagnosis, not an add-on — and a substantial proportion of cases are new mutations, which changes what families are told",
      "Plan for the eventual loss of hearing: early discussion of communication strategies and auditory implantation is kinder than raising it once deafness is established",
    ],
    urgency: "urgent",
    referral: "A specialist NF2 service where one exists — skull-base neurosurgery, ENT, audiology and genetics together",
    bySite: {
      skull_base_iam: { level: "hearing, speech discrimination, and facial movement",
        flavour: "an intracanalicular tumour is small and hearing-threatening — this is the stage where hearing preservation surgery or radiosurgery is still possible, so finding it early matters" },
      skull_base_cpa: { level: "hearing, facial sensation, facial movement and coordination",
        flavour: "extension into the cerebellopontine angle means the tumour has outgrown the canal, and the fifth nerve and brainstem are now in question as well as hearing" },
    },
  }),

  "Obstructive hydrocephalus / shunt failure": dz("Obstructive hydrocephalus / shunt failure", {
    confirmatory: [
      "URGENT CT AND COMPARE IT WITH THE PATIENT'S OWN PREVIOUS SCANS — ventricular size is meaningless in isolation here, and the comparison is the investigation",
      "IN A SHUNTED PATIENT, ASSUME SHUNT FAILURE UNTIL PROVEN OTHERWISE. Take the parents' or carer's account seriously: they recognise the pattern earlier than any scan, and 'this is how it was last time' is high-quality clinical information",
      "SHUNT SERIES radiographs to look for disconnection or migration, and neurosurgical assessment of the valve and reservoir",
      "Examine {level}, plus conscious level, and check the FUNDI for papilloedema",
    ],
    monitoring: [
      "SAFETY NET: shunt failure can deteriorate from headache to coma over HOURS, and slit-ventricle syndrome means the ventricles may barely enlarge despite dangerously raised pressure — so a normal-looking scan does not exclude it",
      "Track {level} and conscious level continuously while the diagnosis is in doubt; escalate to neurosurgery on the trajectory rather than the images",
      "Ask about the classic triad in a shunted patient — headache, vomiting and drowsiness — and treat that combination as failure until the shunt is shown to work",
    ],
    urgency: "emergency",
    referral: "Emergency neurosurgery — a blocked shunt is revised, not observed",
  }),

  "Obstructive hydrocephalus compressing the pretectum": dz("Obstructive hydrocephalus compressing the pretectum", {
    confirmatory: [
      "URGENT imaging with attention to the ventricles AND the aqueduct — dilated lateral and third ventricles with a normal fourth localises the obstruction to the aqueduct",
      "The pretectal signs ARE the monitoring tool: upgaze failure, light-near dissociation and lid retraction appear as pressure rises and resolve as it is relieved — {flavour}",
      "Look for the CAUSE of the obstruction — a pineal or tectal mass, aqueduct stenosis, or a shunt that has stopped working",
      "Examine {level}, and check the fundi; in a child, measure the head circumference and ask about the SETTING-SUN sign",
    ],
    monitoring: [
      "SAFETY NET: NEW OR WORSENING UPGAZE FAILURE IS A PRESSURE SIGN, not an eye problem — it is one of the most useful bedside markers of decompensating hydrocephalus and it is not looked for unless someone has said so",
      "Track {level} and conscious level; diversion of CSF is the treatment and it is urgent",
      "Once the pressure is relieved the eye signs usually improve, so their persistence suggests the obstruction has not been adequately treated",
    ],
    urgency: "emergency",
    referral: "Emergency neurosurgery for CSF diversion",
  }),

  "Sickle cell disease": dz("Sickle cell disease", {
    confirmatory: [
      "FULL BLOOD COUNT, RETICULOCYTES AND HAEMOGLOBIN ELECTROPHORESIS — and in a patient already known to have it, establish the baseline haemoglobin and the recent transfusion history",
      "URGENT vessel imaging: sickle cell causes a large-vessel VASCULOPATHY with stenosis of the distal internal carotid and proximal MCA, which is a moyamoya-like picture rather than simple small-vessel occlusion",
      "MRI with diffusion, and remember that SILENT INFARCTS are common and cumulative — so a first clinical stroke frequently sits on top of years of unrecognised injury",
      "Examine {level}, and look for the precipitant: infection, dehydration, hypoxia, acute chest syndrome or a recent crisis",
    ],
    monitoring: [
      "SAFETY NET: THE TREATMENT OF ACUTE STROKE HERE IS URGENT EXCHANGE TRANSFUSION, which is a haematological intervention rather than a neurological one — involve haematology immediately rather than routing this through the standard stroke pathway alone",
      "Track {level}; and maintain oxygenation, hydration and normothermia, all of which reduce further sickling",
      "TRANSCRANIAL DOPPLER screening identifies children at high risk BEFORE a stroke and is an established preventive programme — a child presenting with stroke should prompt asking whether screening happened",
      "Long-term prevention is transfusion or hydroxycarbamide rather than antiplatelet therapy, which is a genuinely different secondary-prevention pathway from atherosclerotic stroke",
    ],
    urgency: "emergency",
    referral: "Haematology and acute stroke together — exchange transfusion is the treatment",
  }),

  "Sickle cell disease or hyperviscosity": dz("Sickle cell disease or hyperviscosity", {
    confirmatory: [
      "FULL BLOOD COUNT with film, ESR, and haemoglobin electrophoresis; plus paraprotein screen, white cell count and platelets where hyperviscosity is possible",
      "FUNDOSCOPY IS THE INVESTIGATION — dilated tortuous 'sausage-link' veins, scattered haemorrhages and a boxcar appearance are visible signs of hyperviscosity, and they are seen rather than measured",
      "Identify which mechanism: sickling, a paraproteinaemia (myeloma or Waldenström), leukaemia with a very high blast count, or polycythaemia — each has a different urgent treatment",
      "Examine {level}, including acuity and the fields, and ask about the systemic symptoms of hyperviscosity: headache, mucosal bleeding, blurred vision and confusion",
    ],
    monitoring: [
      "SAFETY NET: symptomatic hyperviscosity is a HAEMATOLOGICAL EMERGENCY treated by plasmapheresis, leukapheresis or exchange transfusion — the eye is the presenting organ but the treatment is systemic and urgent",
      "Track {level} and the vision; visual loss from retinal vascular occlusion here can be prevented by treating the viscosity rather than the eye",
      "Avoid transfusing red cells before reducing the viscosity in a hyperviscous patient — it can make things acutely worse, which is counter-intuitive and easily done",
    ],
    urgency: "emergency",
    referral: "Haematology urgently, with ophthalmology",
  }),

  "Azygos (unpaired) ACA supplying both hemispheres": dz("Azygos (unpaired) ACA supplying both hemispheres", {
    confirmatory: [
      "ANGIOGRAPHY (CT or MR) to demonstrate the ANATOMY — a single unpaired anterior cerebral artery supplying both hemispheres, which is why one occlusion produces a BILATERAL deficit",
      "This is an anatomical VARIANT rather than a disease: the workup is the stroke workup, and the variant explains the pattern rather than changing the acute treatment",
      "Examine {level} — bilateral leg weakness with abulia and incontinence, a picture that is repeatedly investigated as a cord lesion because the arms are spared",
      "Note the variant prominently in the record: it carries a higher association with anterior communicating aneurysms, which matters for any future imaging",
    ],
    monitoring: [
      "SAFETY NET: bilateral leg weakness with preserved arms sends most readers to the spine — if the cord MRI is normal, image the BRAIN before anything else",
      "Track {level}; and manage as a stroke, since the variant changes the explanation rather than the pathway",
      "Rehabilitation for the abulia and incontinence matters as much as for the weakness, and is more often overlooked because it is not obviously neurological",
    ],
    urgency: "emergency",
    referral: "Acute stroke pathway",
  }),

  "Pantothenate kinase-associated neurodegeneration (PKAN)": dz("Pantothenate kinase-associated neurodegeneration (PKAN)", {
    confirmatory: [
      "MRI BRAIN LOOKING FOR THE 'EYE OF THE TIGER' SIGN — central hyperintensity within a hypointense globus pallidus on T2. It is close to specific and it is the reason to image rather than to test blindly",
      "GENETIC testing for PANK2, which confirms it; and blood film for acanthocytes, which points instead to the neuroacanthocytosis syndromes",
      "Examine {level}, and look for the associated features: dystonia (particularly oromandibular), pigmentary retinopathy, and pyramidal signs",
      "Exclude the TREATABLE brain-iron and metal disorders that resemble it — Wilson's disease above all, since missing that one is the costly error",
    ],
    monitoring: [
      "SAFETY NET: STATUS DYSTONICUS is the life-threatening complication — unremitting spasms causing rhabdomyolysis, renal failure and exhaustion. It is precipitated by infection, pain or a medication change, and it is what actually kills",
      "Track {level} and the dystonia severity; symptomatic treatment genuinely helps, and deep brain stimulation benefits selected patients, so this is not a diagnosis to make and then abandon",
      "GENETIC counselling for the family, and coordinate the multidisciplinary care — feeding, communication, posture and pain are where quality of life is won or lost",
    ],
    urgency: "urgent",
    referral: "Movement disorder service with genetics; a paediatric neurology service in a child",
  }),

  ...family("hindbrain-craniocervical-malformation", HINDBRAIN_SPINE, {
    "Chiari I malformation": {
      slots: { level: "gait, the lower cranial nerves, and any dissociated sensory loss in the arms",
               flavour: "measure the TONSILLAR DESCENT below the foramen magnum, and look for the syrinx that follows from it — the syrinx is often what actually causes the deficit, and the tonsils are only why it formed" },
      bySite: {
        cerebellum_flocculonodular: { level: "gait, and DOWNBEAT nystagmus specifically",
                                      flavour: "downbeat nystagmus in a young adult is a craniocervical junction sign until the scan says otherwise, and Chiari is the commonest structural cause" },
        craniocervical_junction_foramen_magnum: { level: "all four limbs, the lower cranial nerves, and respiratory pattern in sleep" },
      },
    },
    "Chiari malformation or cerebellar degeneration": {
      slots: { level: "gait, nystagmus and limb coordination",
               flavour: "the name holds two very different answers — a STRUCTURAL malformation that may be operable, or a DEGENERATIVE process that is not. The scan separates them, and the distinction changes everything that follows" },
      confirmatoryExtra: ["If the picture is degenerative rather than structural, the work-up diverges entirely: alcohol history, thyroid and B12, coeliac and paraneoplastic antibodies, and a family history for the hereditary ataxias"],
      urgency: "urgent",
    },
    "Cerebellar malformation (Dandy-Walker, vermian hypoplasia)": {
      slots: { level: "truncal stability and developmental milestones where the patient is a child",
               flavour: "cystic dilatation of the fourth ventricle with an absent or hypoplastic VERMIS and an enlarged posterior fossa — and look at the ventricles, because hydrocephalus is present in most and is the treatable part" },
      confirmatoryExtra: ["Look for the associated anomalies beyond the posterior fossa — callosal agenesis, cardiac and renal malformations — since Dandy-Walker is frequently part of a wider syndrome rather than an isolated finding"],
      monitoringExtra: ["Head circumference and developmental progress in a child; in an adult found incidentally, the question is whether the hydrocephalus is compensated or slowly decompensating"],
    },
    "Syringomyelia (± Chiari)": {
      slots: { level: "the dissociated sensory loss, and its upper and lower borders",
               flavour: "a fluid cavity within the cord — the classic picture is a CAPE-LIKE loss of pain and temperature with PRESERVED light touch and vibration, because the syrinx interrupts the crossing fibres at the centre and spares the columns" },
      confirmatoryExtra: [
        "ALWAYS image the craniocervical junction as well as the syrinx: most are secondary to Chiari, and treating the syrinx without addressing the obstruction above it does not work",
        "Where there is no Chiari, look for the other causes — previous trauma, arachnoiditis after meningitis or surgery, and an intramedullary tumour, which needs contrast to exclude",
      ],
      monitoringExtra: ["Warn about PAINLESS INJURY: burns and cuts to insensate hands are common and preventable, and the patient will not report an injury they did not feel"],
      bySite: {
        cord_lateral:  { level: "the dissociated loss, plus the long tracts as the cavity expands outward" },
        cord_central:  { level: "the cape distribution and the arm reflexes, which are lost early" },
      },
    },
    "Syringobulbia": {
      slots: { level: "facial sensation in an ONION-SKIN pattern, plus palate, tongue and swallow",
               flavour: "the cavity has extended up into the brainstem — facial sensory loss follows the onion-skin distribution of the spinal trigeminal nucleus rather than the divisions of the nerve, which is the finding that localises it" },
      monitoringExtra: ["Bulbar function and sleep-disordered breathing are the features that make this more urgent than a cord syrinx alone — ask about swallow, voice and nocturnal stridor at every review"],
      urgency: "urgent",
    },
    "Craniocervical instability / basilar invagination": {
      slots: { level: "all four limbs, the lower cranial nerves, and any positional worsening",
               flavour: "the odontoid peg sits ABOVE its normal line and indents the brainstem — and look for the underlying reason: rheumatoid disease, Down syndrome, a connective tissue disorder, or skeletal dysplasia" },
      confirmatoryExtra: [
        "DYNAMIC (flexion-extension) imaging is what demonstrates instability — a static scan can look acceptable in a neck that is dangerous when it moves",
        "CT defines the BONE and MRI the cord: they answer different questions here and are not alternatives",
      ],
      monitoringExtra: ["SAFETY NET: symptoms brought on by NECK POSITION, or a history of transient weakness after a minor injury, indicate a cord at risk — that patient needs a surgical opinion before the next fall, not after it"],
      urgency: "urgent",
    },
    "Tethered cord / spinal dysraphism": {
      slots: { level: "sphincter function, saddle sensation and the ankle jerks",
               flavour: "a conus lying BELOW L2 with a thickened filum — and examine the back for the cutaneous marker: a dimple, tuft of hair, lipoma or naevus that has been there since birth and was never connected to the symptoms" },
      confirmatoryExtra: [
        "URODYNAMIC assessment is often the most sensitive measure of progression here, and bladder function is what is most likely to be lost irreversibly",
        "Look for the associated anomalies — a lipoma, dermal sinus tract, diastematomyelia, and anorectal or renal malformations",
      ],
      monitoringExtra: ["Deterioration is classically triggered by a GROWTH SPURT in a child, or by a specific stretch such as pregnancy or an unusual exertion in an adult — so a stable patient can change quickly at a predictable time"],
    },
  }),
};

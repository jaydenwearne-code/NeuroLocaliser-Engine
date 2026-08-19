// mimic.js — pathology workups for the MIMIC category.
//
// A mimic is NOT a lesion at this site at all, so the workup's job is to exclude it fast, before the
// structural pathway is embarked on.
//
// Content only — the builders live in ./builders.js and the public API in ../pathologyNextSteps.js.
// Teaching prompts, not directives: no doses, no definitive management.
//
// REVIEW STATUS: ✅ all 1 plans here SIGNED OFF 2026-08-18 (tranche 1, round 3).
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

export default {
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

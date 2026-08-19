// vascular.js — pathology workups for the VASCULAR category (ischaemic / haemorrhagic).
//
// The clock is the first investigation in this category, not the scan: for most of these the question
// 'when was the patient last known well' decides what can still be offered.
//
// Content only — the builders live in ./builders.js and the public API in ../pathologyNextSteps.js.
// Teaching prompts, not directives: no doses, no definitive management.
//
// REVIEW STATUS: ✅ all 2 plans here SIGNED OFF 2026-08-18 (tranche 1, round 1, round 3).
import { dz } from "./builders.js";

export default {
  // ---- PROMOTED INTO TRANCHE 1 ON CLINICAL GROUNDS (owner ruling, 2026-08-18) ----
  // Only 2 host sites, so reuse count would have left it until tranche 3. It is nonetheless the app's
  // sharpest must-not-miss: both hosts are BPPV sites that badge "routine", and the whole clinical point
  // of the vestibular axis is that a peripheral-looking acute vestibular syndrome can be a stroke.
  "Posterior circulation stroke": dz("Posterior circulation stroke", {
    confirmatory: [
      "MRI with DWI — but a NEGATIVE early DWI does NOT exclude it: small posterior-fossa infarcts are missed in a substantial minority within the first 24-48 hours, so a convincing central examination outweighs a normal early scan",
      "CT angiography or MR angiography of the vertebrobasilar circulation, looking for vertebral dissection or basilar disease",
      "The bedside examination is the more sensitive test here: {flavour}",
      "Once the diagnosis is made, the usual ischaemic-stroke aetiology work-up — cardiac rhythm monitoring, echocardiography and vascular risk profiling",
    ],
    monitoring: [
      "SAFETY NET: a fluctuating or stuttering course in the posterior circulation can herald basilar occlusion — deterioration in conscious level, new cranial nerve signs or bilateral long-tract signs need immediate reimaging, not observation",
      "Swallow screen before anything by mouth, and monitor for the posterior-fossa oedema that peaks at 2-4 days and can obstruct CSF flow",
      "Track {level} on serial examination — that is where deterioration will show first",
    ],
    urgency: "emergency",
    referral: "Acute stroke pathway — time-critical, and reperfusion may be on the table",
    bySite: {
      peripheral_vestibular_posterior_canal: {
        level: "gaze holding, skew and limb coordination",
        flavour: "HINTS — a NORMAL head impulse in a patient with ongoing vertigo and nystagmus points CENTRAL, and direction-changing or downbeat positional nystagmus is not posterior-canal BPPV, whatever the Dix-Hallpike looks like",
      },
      peripheral_vestibular_horizontal_canal: {
        level: "gaze holding, skew and truncal stability",
        flavour: "HINTS — horizontal-canal BPPV also gives direction-changing nystagmus on the supine roll test, so the discriminators here are a normal head impulse, skew deviation, and truncal ataxia too severe to sit unsupported",
      },
    },
  }),

  "Intracerebral haemorrhage": dz("Intracerebral haemorrhage", {
    confirmatory: [
      "NON-CONTRAST CT is the immediate test and is diagnostic — this is the one situation where CT beats MRI for the primary question",
      "CT ANGIOGRAPHY in the same sitting: it looks for an underlying vascular lesion and for contrast extravasation within the haematoma, which predicts expansion",
      "Establish anticoagulant and antiplatelet exposure IMMEDIATELY — reversal is time-critical and is the single most modifiable factor in the first hour",
      "Delayed MRI with blood-sensitive sequences once stable, to find the cause the acute scan cannot show: lobar microbleeds suggesting amyloid angiopathy, an underlying tumour, or a cavernoma — {flavour}",
    ],
    monitoring: [
      "SAFETY NET: haematoma EXPANSION happens in the first hours and is the commonest cause of early deterioration — a fall in conscious level means repeat imaging immediately, not observation",
      "Blood pressure, conscious level and {level} on a frequent, defined schedule; intensive early blood-pressure lowering is standard practice and is a treatment, not a bystander observation",
      "Swallow screen before anything by mouth, and monitor for seizures, which are more frequent with lobar than deep haemorrhage",
      "A LOBAR haemorrhage in an older patient raises cerebral amyloid angiopathy, which changes future anticoagulation decisions permanently — flag it for the discharge summary rather than leaving it to be rediscovered",
    ],
    urgency: "emergency",
    referral: "Acute stroke pathway with neurosurgery; critical care if conscious level is falling",
    bySite: {
      cortex_mca_superior: {
        level: "face and arm power and speech output",
        flavour: "a lobar location in this territory raises amyloid angiopathy in an older patient and an underlying lesion in a younger one",
      },
      cortex_insula: {
        level: "conscious level, and blood pressure and rhythm",
        flavour: "insular haemorrhage is associated with autonomic and cardiac instability out of proportion to the deficit",
      },
      cortex_parietal: {
        level: "cortical sensation, neglect and fields",
        flavour: "neglect can make the patient appear unconcerned and mask deterioration — do not rely on their report of change",
      },
      cortex_hand_knob: {
        level: "isolated hand function, which mimics a peripheral nerve lesion",
        flavour: "a small haemorrhage here produces a strikingly focal deficit, and the cause matters more than the volume",
      },
    },
  }),
};

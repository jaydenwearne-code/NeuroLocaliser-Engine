// iatrogenic.js — pathology workups for the IATROGENIC category (procedures and radiation ONLY;
// a drug acting systemically stays under metabolic / toxic).
//
// Content only — the builders live in ./builders.js and the public API in ../pathologyNextSteps.js.
// Teaching prompts, not directives: no doses, no definitive management.
//
// REVIEW STATUS: ✅ all 1 plans here SIGNED OFF 2026-08-18 (tranche 1, round 3).
import { dz } from "./builders.js";

export default {
  "Radiation plexopathy": dz("Radiation plexopathy", {
    confirmatory: [
      "EMG looking for MYOKYMIC DISCHARGES — myokymia is the most useful single discriminator, being characteristic of radiation injury and not of tumour infiltration",
      "MRI of the plexus with contrast: radiation change is typically diffuse thickening with T2 signal change and LITTLE enhancement, whereas an infiltrating tumour tends to form an enhancing mass",
      "Establish the RADIOTHERAPY FIELD, dose and date, and check the plexus lay within it — the latency is typically months to many years, so the treatment is often not volunteered",
      "PET-CT where the distinction from recurrence remains unresolved, since the management diverges completely — {flavour}",
    ],
    monitoring: [
      "The discriminating clinical difference is PAIN: severe early pain favours tumour recurrence, while radiation plexopathy is characteristically more numb and weak than painful. A Horner's syndrome also favours tumour",
      "Track {level} — radiation plexopathy is typically slowly progressive and irreversible, so the realistic goal is function and pain, not reversal",
      "SAFETY NET: worsening pain, a new Horner's syndrome, or rapid progression should send you back to imaging for recurrence rather than being attributed to the radiation",
      "Refer early for rehabilitation, orthotics and lymphoedema management, which do more for function here than further investigation does",
    ],
    urgency: "routine",
    referral: "Neurology with the treating oncology team; rehabilitation medicine and pain services",
    bySite: {
      plexus_middle_trunk: {
        level: "elbow extension and wrist extension",
        flavour: "upper and middle plexus involvement after breast radiotherapy favours radiation injury, whereas tumour recurrence characteristically takes the LOWER plexus",
      },
      plexus_lower_trunk: {
        level: "the small muscles of the hand and the medial forearm",
        flavour: "LOWER-trunk involvement with pain and a Horner's syndrome favours tumour recurrence and must be excluded before accepting radiation injury",
      },
      plexus_lumbar_plexus: {
        level: "hip flexion and knee extension",
        flavour: "after pelvic radiotherapy the competing diagnoses are recurrence and, where the picture is bilateral, radiation-induced damage to the cauda equina",
      },
      plexus_sacral_plexus: {
        level: "ankle movement and sphincter function",
        flavour: "sacral involvement after pelvic radiotherapy warrants explicit questions about bladder, bowel and sexual function, which are rarely volunteered",
      },
    },
  }),
};

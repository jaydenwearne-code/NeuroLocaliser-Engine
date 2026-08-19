// iatrogenic.js — pathology workups for the IATROGENIC category (procedures and radiation ONLY;
// a drug acting systemically stays under metabolic / toxic).
//
// Content only — the builders live in ./builders.js and the public API in ../pathologyNextSteps.js.
// Teaching prompts, not directives: no doses, no definitive management.
//
// REVIEW STATUS:
//   ✅ Radiation plexopathy — SIGNED OFF 2026-08-18 (tranche 1).
//   ⚠  PROCEDURE-RELATED INJURY (3) — tranche 2 round 9, AWAITING REVIEW.
import { dz, family } from "./builders.js";


// PROCEDURE-RELATED NERVE INJURY. What unites these is that a TREATMENT caused the deficit — which changes
// the conversation as much as the workup. Documentation, honest disclosure and prevention for the next
// patient are part of the clinical response, not an administrative afterthought.
const IATROGENIC_SPINE = {
  confirmatory: [
    "ESTABLISH THE TIMING PRECISELY against the procedure — immediate, on waking, or delayed by days. That interval separates direct injury from positioning, from swelling, and from an unrelated cause, and it cannot be reconstructed later",
    "Obtain the OPERATION NOTE and the anaesthetic record: position, duration, tourniquet time, blocks used, and any noted difficulty. This is the investigation, and it is rarely requested by the neurologist",
    "Neurophysiology at about three weeks to define the lesion and its severity — earlier studies cannot distinguish neurapraxia from axonal loss, which is the distinction the prognosis rests on: {flavour}",
    "Examine {level} and document it fully, including what is PRESERVED — the record made now is what any later discussion, clinical or otherwise, will rest on",
  ],
  monitoring: [
    "SAFETY NET: distinguish a stable deficit from a PROGRESSIVE one. Progression after a procedure suggests an expanding haematoma, a compartment syndrome or a compressive collection — all of which need imaging and possibly re-operation, urgently",
    "Track {level} at defined intervals; neurapraxia recovers over weeks and axonal injury over months, so the trajectory is what tells the patient which they have",
    "BE OPEN WITH THE PATIENT. A complication explained honestly and early is managed better clinically and causes less harm than one discovered by the patient — and the duty of candour is a professional obligation, not a legal calculation",
    "Refer for rehabilitation, splinting and pain management early rather than waiting to see whether recovery occurs — function preserved in the interim is function available if the nerve returns",
  ],
  urgency: "urgent",
  referral: "Neurology or peripheral nerve surgery, with the team that performed the procedure involved rather than bypassed",
};

export default {
  ...family("procedure-related-injury", IATROGENIC_SPINE, {
    "Iatrogenic injury at cervical lymph node biopsy": {
      slots: { level: "trapezius specifically — shoulder shrug, scapular position and abduction above 90 degrees",
               flavour: "the accessory nerve runs SUPERFICIALLY through the posterior triangle with almost nothing over it, which is exactly why a node biopsy there transects it — this is the classic avoidable surgical nerve injury" },
      confirmatoryExtra: ["If the nerve was transected and recognised, EARLY exploration and repair gives far better results than waiting — so the question of whether to explore is asked in weeks, not months"],
      monitoringExtra: ["Trapezius palsy causes a painful drooping shoulder and winging that worsens with time, and the pain is often more disabling than the weakness — physiotherapy from the outset genuinely changes the outcome"],
    },
    "Perioperative ischaemic optic neuropathy": {
      slots: { level: "acuity, colour vision, fields and the pupil in BOTH eyes",
               flavour: "painless visual loss noticed ON WAKING, often BILATERAL — associated with prolonged prone spinal surgery, cardiac surgery, blood loss and hypotension, and the disc may look normal initially in the posterior form" },
      confirmatoryExtra: [
        "Urgent ophthalmology, and exclude the treatable alternatives — an orbital compartment syndrome from positioning, a central retinal artery occlusion, and cortical visual loss from a perioperative stroke",
        "Check haemoglobin and review the intraoperative blood pressure record: anaemia and hypotension are the modifiable associations, and they matter for the NEXT operation as much as this one",
      ],
      monitoringExtra: ["There is no established effective treatment once it has occurred, which is why the honest conversation and the prevention message for future surgery are the substance of the follow-up"],
      urgency: "emergency",
      referral: "Emergency ophthalmology, with the surgical and anaesthetic teams",
    },
    "Aberrant regeneration after a third nerve palsy": {
      slots: { level: "the lid and pupil DURING eye movement, not at rest",
               flavour: "misdirected regrowth after a third nerve injury — the lid ELEVATES on downgaze or adduction (pseudo-Graefe), or the pupil constricts on adduction. It appears months later and is a sign of a healed injury, not a new one" },
      confirmatoryExtra: [
        "THE IMPORTANT DISTINCTION IS PRIMARY versus SECONDARY. Aberrant regeneration WITHOUT a preceding acute palsy — primary aberrant regeneration — implies a slowly compressive lesion such as a cavernous meningioma or aneurysm, and mandates imaging",
        "Aberrant regeneration essentially never follows a MICROVASCULAR third nerve palsy, so its presence argues that the original event was compressive or traumatic rather than ischaemic",
      ],
      monitoringExtra: ["Reassurance is usually the treatment where the history of an acute palsy is clear; strabismus surgery or lid surgery can help selected patients, so referral is reasonable rather than dismissive"],
      urgency: "urgent",
    },
  }),

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

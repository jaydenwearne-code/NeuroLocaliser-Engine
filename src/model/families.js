// families.js — WORD FAMILIES and BACKGROUND findings (false-multifocal fix, owner-ruled 2026-10-22). CONTENT ONLY:
// the matching lives in src/engine/families.js, so this table can be clinically reviewed on its own.
//
// A FAMILY is several bedside words for one examination. The vocabulary names findings by anatomy, so before this
// table "past-pointing" pointed only at the cerebellar hemisphere, and a Wallenberg entered with it read "two lesions,
// multiple sclerosis". Each family cites the owner's ruling it comes from (audit round 1, rows 18–21). `relation`:
//   same        — one finding, whichever word was entered: matched through `head`.
//   hemiparesis — one finding only INSIDE a hemiparesis: a member reads as `head` when a finding in `inside` is entered
//                 on the same side. Outside it the words stay different findings.
//   generic     — `generic` is explained by a place that gives a more specific member (specific → generic is safe);
//                 the reverse is a different claim.
//   different   — different findings: they localise differently.
// `nearFit: true` — a member entered INSTEAD of another member that a place predicts on that side (and that was not
// entered) makes that place a near-fit with no multifocal claim: the narrow overturn of "a LOCALISING sign is never
// relaxed away" (false-multifocal fix rows 5–7). Not weak hand outside a hemiparesis (row 6).
export const FINDING_FAMILIES = [
  { id: "cerebellar_limb", relation: "same", head: "limb_ataxia",
    members: ["limb_ataxia", "dysmetria", "dysdiadochokinesis", "intention_tremor"], nearFit: false,
    ruling: "Equivalent: dysmetria is how limb ataxia is examined (audit round 1, row 18)." },
  { id: "arm_hand", relation: "hemiparesis", head: "weak_arm", inside: ["weak_leg", "facial_weakness"],
    members: ["weak_arm", "weak_hand"], nearFit: false,
    ruling: "Equivalent inside a hemiparesis (leg or face weakness on that side); weak hand alone still means the hand knob (audit round 1, row 20)." },
  { id: "dysarthria", relation: "generic", generic: "dysarthria",
    members: ["dysarthria", "ataxic_dysarthria"], nearFit: true,
    ruling: "Specific → generic is safe; generic → specific is a different claim (audit round 1, row 21)." },
  { id: "face_sensation", relation: "different",
    members: ["face_pain_loss", "face_touch_loss", "face_sensory_loss"], nearFit: true,
    ruling: "Not equivalent: pain vs touch localises, and face_sensory_loss is VPM loss (audit round 1, row 19)." },
];

// BACKGROUND (Hickam) findings: common enough to be a separate, co-existing condition. Only ever as a PAIR on both
// sides — an absent ankle jerk on one side is an S1 sign. Hearing loss on both sides is NOT here: it is NF2's own
// picture. Owner ruling 2026-10-22, false-multifocal fix rows 11–13. The card's sentences live in app/answer.js.
export const BACKGROUND_FINDINGS = ["reflex_ankle_loss", "distal_sensory_loss"];

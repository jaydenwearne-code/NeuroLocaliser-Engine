// follow-ups.js — findings that appear under a ticked finding (spec 2026-09-27 §5.3). The map is CONTENT,
// reviewed on its own; the layout rule below it is pure and DOM-free.
//
// A follow-up is only a TRUE REFINEMENT of its parent — the same deficit described more precisely (owner ruling
// 2026-09-27). Ticking the parent ENTERS it, so a different kind of finding must never nest here: myotomes under
// "leg weakness" would hand a peroneal foot drop a pyramidal finding it does not have.
//
// REVIEW STATUS: ⚠ AWAITING CLINICAL REVIEW (round 2 of 3, spec 2026-09-27 §8).
import { EXAM_TREE } from "./exam-map.js";

// Key order is display priority: a follow-up shared by two entered parents shows under the first listed here.
export const FOLLOW_UPS = {
  facial_weakness: ["forehead_spared", "forehead_involved", "hyperacusis", "taste_loss", "lacrimation_loss"],
  cn8_vertigo: ["nystagmus_peripheral", "nystagmus_gaze_evoked", "head_impulse_abnormal", "skew_deviation",
    "nystagmus_positional_posterior", "nystagmus_positional_horizontal"],
  ptosis: ["miosis", "fixed_dilated_pupil", "fatigable_ocular"],
  miosis: ["anhidrosis_face"],
  homonymous_hemianopia: ["macular_sparing"],
  optic_neuropathy: ["central_scotoma", "altitudinal_defect", "rapd"],
  limb_ataxia: ["dysmetria", "dysdiadochokinesis", "intention_tremor"],
  dysarthria: ["ataxic_dysarthria"],
  speech_nonfluent: ["repetition_impaired", "naming_impaired"],
  comprehension_impaired: ["repetition_impaired", "naming_impaired"],
  saddle_anaesthesia: ["anal_wink_loss", "bulbocavernosus_loss"],
  reduced_consciousness: ["extensor_posturing"],
};

// finding -> the id of the exam-tree leaf group it lives in (its "home").
export const GROUP_OF = {};
{
  const walk = n => { if (n.findings) n.findings.forEach(f => { GROUP_OF[f] = n.id; }); (n.groups || []).forEach(walk); };
  EXAM_TREE.forEach(walk);
}

// Given the ENTERED finding ids, where does each follow-up show?
//   under    — Map(parent -> [follow-up ids]) for every entered parent, each follow-up placed once (first parent wins)
//   hideHome — follow-ups shown under a parent in their OWN group, so their home row is hidden (never shown twice
//              in one view). A follow-up whose home is another group keeps its home row: RAPD must stay enterable
//              on its own, because an optic TRACT lesion gives an RAPD with no monocular visual loss.
// An entered follow-up whose parent is removed is simply back on its home row — nothing to do.
export function followUpLayout(entered, groupOf = GROUP_OF) {
  const under = new Map(), placed = new Set();
  for (const [parent, kids] of Object.entries(FOLLOW_UPS)) {
    if (!entered.has(parent)) continue;
    const mine = kids.filter(f => !placed.has(f));
    mine.forEach(f => placed.add(f));
    if (mine.length) under.set(parent, mine);
  }
  const hideHome = new Set();
  for (const [parent, kids] of under) for (const f of kids) if (groupOf[f] === groupOf[parent]) hideHome.add(f);
  return { under, hideHome };
}

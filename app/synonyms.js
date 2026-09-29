// synonyms.js — what the search box finds (spec 2026-09-27 §5.5). CONTENT (the bedside-phrase table) plus two pure
// matchers. searchFindings() is the whole search: a finding's id, long description, plain label, proper name and row
// note, and the phrases below — which cover only what none of those contain. Measured 2026-09-27: "foot drop" and
// "wrist drop" already worked (their descriptions contain them); "dizzy", "Horner" and "hemiparesis" found nothing.
// "Slurred speech", "droopy eyelid" and "face droop" left this table on 2026-09-29, when they became plain labels.
import { FINDINGS } from "../src/model/findings.js";
import { PLAIN } from "./plain-labels.js";
//
// REVIEW STATUS: ⚠ AWAITING CLINICAL REVIEW (round 3 of 3, spec 2026-09-27 §8).
export const SYNONYMS = {
  "drooping eyelid": ["ptosis"],
  "can't find words": ["naming_impaired"],
  "word finding": ["naming_impaired"],
  "can't understand": ["comprehension_impaired"],
  "dizzy": ["cn8_vertigo"],
  "dizziness": ["cn8_vertigo"],
  "spinning": ["cn8_vertigo"],
  "numb face": ["face_pain_loss", "face_touch_loss", "face_sensory_loss"],
  "facial numbness": ["face_pain_loss", "face_touch_loss", "face_sensory_loss"],
  "facial droop": ["facial_weakness"],
  "facial palsy": ["facial_weakness"],
  "bell's palsy": ["facial_weakness", "forehead_involved"],
  "horner": ["ptosis", "miosis", "anhidrosis_face"],
  "double vision": ["weak_abduction", "weak_adduction", "vertical_diplopia", "ino", "fatigable_ocular"],
  "diplopia": ["weak_abduction", "weak_adduction", "vertical_diplopia", "ino", "fatigable_ocular"],
  "field cut": ["homonymous_hemianopia", "bitemporal_hemianopia"],
  "vision loss": ["optic_neuropathy", "homonymous_hemianopia", "cortical_blindness"],
  "clumsy": ["limb_ataxia", "dysmetria"],
  "unsteady": ["truncal_ataxia", "sensory_ataxia", "limb_ataxia"],
  "can't walk": ["truncal_ataxia", "weak_leg", "gait_apraxia"],
  "hemiparesis": ["weak_arm", "weak_leg"],
  "one-sided weakness": ["weak_arm", "weak_leg"],
  "can't lift the foot": ["weak_ankle_dorsiflexion"],
  "weak grip": ["weak_finger_flexion", "weak_hand"],
  "pins and needles": ["spinothalamic", "dorsal_sensory", "distal_sensory_loss"],
  "tingling": ["spinothalamic", "dorsal_sensory", "distal_sensory_loss"],
  "carpal tunnel": ["median_sensory", "weak_thumb_abduction"],
  "numb saddle": ["saddle_anaesthesia"],
  "confused": ["reduced_consciousness"],
  "drowsy": ["reduced_consciousness"],
  "unresponsive": ["reduced_consciousness"],
  "shaking": ["rest_tremor", "intention_tremor"],
  "stiff": ["spasticity", "rigidity"],
  "fatigue": ["fatigable_weakness", "fatigable_ocular"],
  "can't hear": ["hearing_loss"],
  "upgoing": ["babinski"],
  "downgoing": ["plantar_flexor"],
  "normal plantar": ["plantar_flexor"],
  "palpitations": ["arrhythmia"],
  "postural drop": ["labile_blood_pressure"],
  "dizzy on standing": ["labile_blood_pressure"],
  "impotence": ["erectile_dysfunction"],
  "floppy": ["hypotonia", "lmn_weakness"],
  "twitching": ["fasciculations"],
  "slow movements": ["bradykinesia"],
};

// Finding ids whose bedside phrase matches the query: the phrase contains what was typed ("dizz" -> dizzy), or
// what was typed contains the phrase ("left face droop"). Three characters minimum, so one keystroke does not
// light up half the table.
export function synonymHits(query) {
  const q = String(query || "").trim().toLowerCase();
  const out = new Set();
  if (q.length < 3) return out;
  for (const [phrase, ids] of Object.entries(SYNONYMS)) {
    if (phrase.includes(q) || q.includes(phrase)) ids.forEach(f => out.add(f));
  }
  return out;
}

// Every finding the search box should show for a query. A long query also matches when it CONTAINS a label
// ("left face droop" -> face droop); labels under five letters are left out of that, so "ino" does not match inside
// other words.
export function searchFindings(query) {
  const q = String(query || "").trim().toLowerCase();
  const out = new Set();
  if (!q) return out;
  for (const f of Object.keys(FINDINGS)) {
    const p = PLAIN[f] || {}, label = (p.label || "").toLowerCase();
    if (f.includes(q) || FINDINGS[f].desc.toLowerCase().includes(q) || label.includes(q)
      || (p.term || "").toLowerCase().includes(q) || (p.note || "").toLowerCase().includes(q)
      || (label.length >= 5 && q.includes(label))) out.add(f);
  }
  for (const f of synonymHits(q)) out.add(f);
  return out;
}

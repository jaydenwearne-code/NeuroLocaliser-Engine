// engine.test.js — proof that syndromes EMERGE from anatomy.
//
// Each test states observed findings (as the bedside sees them: finding@bodySide) and asserts
// the engine localises to the correct site — WITHOUT any syndrome being encoded as a rule.
// Run: node test/engine.test.js

import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0;
const results = [];

function check(label, observed, expectSiteId, opts = {}) {
  const observedSet = new Set(observed);
  const { best, single, multi, singleExplainsAll } = solve(observedSet);
  const gotId = best ? best.site.id : "(none)";
  const name = best ? nameForSite(best.site).name : "(none)";
  let ok = opts.anySite ? true : (gotId === expectSiteId);

  if (opts.expectMulti) {
    ok = ok && !!multi && multi.sites.length >= 2;
    // for the two-lesion case, assert both expected sites are in the minimal set
    if (opts.expectSites) {
      const got = new Set(multi ? multi.sites.map(s => s.id) : []);
      ok = ok && opts.expectSites.every(id => got.has(id));
    }
  }
  if (opts.singleShouldExplainAll !== undefined) {
    ok = ok && singleExplainsAll === opts.singleShouldExplainAll;
  }

  results.push({ label, gotId, expectSiteId, name, ok,
    multi: multi ? multi.sites.map(s => s.id) : null,
    top3: single.slice(0,3).map(r => `${r.site.id}(${r.score.toFixed(1)})`) });
  if (ok) pass++; else fail++;
}

// ============ MIDBRAIN ============
// Weber: left CN III palsy (ipsi) + right hemiparesis (contra) -> left medial midbrain
check("Weber (L CN III + R hemiparesis)",
  ["ptosis@left", "weak_adduction@left", "weak_elevation@left", "weak_depression@left", "weak_arm@right","weak_leg@right", "facial_weakness@right","forehead_spared@right"],
  "left_midbrain_medial");

// ============ PONS ============
// Millard-Gubler: left CN VI + left CN VII (ipsi) + right hemiparesis (contra) -> left medial pons
check("Millard-Gubler (L VI + L VII + R hemiparesis)",
  ["weak_abduction@left", "facial_weakness@left", "weak_arm@right","weak_leg@right"],
  "left_pons_medial");

// One-and-a-half emerges from medial pons (gaze palsy + INO): left medial pons
check("One-and-a-half (L gaze palsy + L INO)",
  ["gaze_palsy@left", "ino@left"],
  "left_pons_medial");

// ============ MEDULLA ============
// Wallenberg: left face pain loss (ipsi) + right body spinothalamic (contra) + left Horner
//   + bulbar + vertigo + left ataxia -> left lateral medulla
check("Wallenberg (L face + R body STT + L Horner + bulbar + ataxia)",
  ["face_pain_loss@left", "spinothalamic@right", "miosis@left","ptosis@left", "palatal_weakness@left", "vocal_cord_palsy@left", "dysphagia@left",
   "cn8_vertigo@left", "limb_ataxia@left", "nystagmus_gaze_evoked@none"],
  "left_medulla_lateral");

// Dejerine (medial medullary): left CN XII (ipsi) + right hemiparesis + right dorsal sensory
check("Dejerine (L CN XII + R hemiparesis + R dorsal sensory)",
  ["cn12_palsy@left", "weak_arm@right","weak_leg@right", "dorsal_sensory@right"],
  "left_medulla_medial");

// ============ SIDE DISCRIMINATION ============
// Mirror of Weber: right CN III + left hemiparesis -> right medial midbrain
check("Weber mirrored (R CN III + L hemiparesis)",
  ["ptosis@right", "weak_adduction@right", "weak_elevation@right", "weak_depression@right", "weak_arm@left","weak_leg@left", "facial_weakness@left","forehead_spared@left"],
  "right_midbrain_medial");

// ============ MULTIFOCAL (minimal-set) ============
// Two lesions: a left medial midbrain (CN III + R hemiparesis) AND a right lateral medulla
//   (R face pain + L body STT + R Horner). No single site explains all -> minimal set of 2.
check("Two lesions: L midbrain + R lateral medulla",
  ["ptosis@left", "weak_adduction@left", "weak_elevation@left", "weak_depression@left", "weak_arm@right","weak_leg@right",
   "face_pain_loss@right", "spinothalamic@left", "miosis@right","ptosis@right"],
  null, { expectMulti: true, anySite: true, expectSites: ["left_midbrain_medial", "right_medulla_lateral"] });

// ============ EMERGENCE OF AN UNNAMED COMBINATION ============
// A lesion the eponyms don't cleanly name should still localise anatomically.
check("Lateral pons (Marie-Foix: L ataxia + R body STT + L vertigo)",
  ["limb_ataxia@left", "spinothalamic@right", "cn8_vertigo@left", "nystagmus_gaze_evoked@none"],
  "left_pons_lateral");

// ---- report ----
console.log("\nNeuroLocaliser anatomical engine — emergence tests\n" + "=".repeat(52));
for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
  console.log(`      -> ${r.gotId}  ${r.name !== "(none)" ? "= " + r.name : ""}`);
  if (!r.ok) console.log(`      expected ${r.expectSiteId}; top3: ${r.top3.join(", ")}`);
  if (r.multi) console.log(`      multifocal set: ${r.multi.join(" + ")}`);
}
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);

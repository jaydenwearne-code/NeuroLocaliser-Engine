// vocab-rulings.test.js — the owner's finding-vocabulary rulings from review round 1 (2026-09-29, ED first
// glance). Four changes to WHAT the findings are, each pinned here so it cannot quietly revert:
//   1. brisk reflexes (hyperreflexia) are split from the up-going plantar and produced along the tract;
//   2. a down-going plantar is an explicit NORMAL — the engine's first — that rules out an up-going plantar;
//   3. central post-stroke pain is not an examination finding and is gone from the model;
//   4. the autonomic features are separate findings, each predicted by Lambert-Eaton AND acute Guillain–Barré.
import { FINDINGS, NON_LATERALISED, EXPLICIT_NORMAL } from "../src/model/findings.js";
import { STRUCTURES } from "../src/model/structures.js";
import { stationOf } from "../src/model/stations.js";
import { solve, knownNegatives } from "../src/engine/inverse.js";
import { whyChain, whyClues } from "../src/engine/why.js";
import { offersFor } from "../app/sides.js";
import { EXAM_TREE, flattenFindings } from "../app/exam-map.js";

let pass = 0, fail = 0;
const ok = (l, c, d = "") => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l + (c ? "" : `  ${d}`)); };
const opts = { dominantSide: "left" };
const producers = f => STRUCTURES.filter(s => s.produces === f);
const places = f => new Set(producers(f).map(s => `${s.level}|${s.part}`));
const group = id => { let hit = null; const walk = n => { if (n.id === id) hit = n; (n.groups || []).forEach(walk); }; EXAM_TREE.forEach(walk); return hit; };
const inTree = new Set(flattenFindings(EXAM_TREE));

// ---- 1: brisk reflexes (hyperreflexia), split from the plantar, along the tract ----
{
  ok("the combined 'UMN signs' finding is gone", !FINDINGS.umn_signs && producers("umn_signs").length === 0);
  ok("brisk reflexes (hyperreflexia) is a finding, in the exam tree", !!FINDINGS.hyperreflexia && inTree.has("hyperreflexia"));
  const bab = places("babinski"), hyp = places("hyperreflexia");
  // Friedreich's ataxia is the classic ABSENT reflexes with up-going plantars; SCD has absent ankle jerks.
  const dissociated = new Set(["combined_degeneration|scd", "combined_degeneration|friedreich"]);
  const missing = [...bab].filter(p => !dissociated.has(p) && !hyp.has(p));
  ok("brisk reflexes are produced wherever an up-going plantar is", missing.length === 0, missing.join(", "));
  ok("…except the combined degenerations (reflexes lost, plantars up)", ![...dissociated].some(p => hyp.has(p)));
  ok("the conus predicts brisk reflexes AND an up-going plantar", hyp.has("conus|medullaris") && bab.has("conus|medullaris"));
  const stroke = solve(new Set(["weak_arm@right", "weak_leg@right", "hyperreflexia@right"]), opts);
  ok("a hemiparesis with brisk reflexes no longer points at the conus",
     stroke.explainAll.length > 0 && !stroke.explainAll.some(c => c.site.id === "conus_medullaris"),
     stroke.display.slice(0, 3).map(c => c.site.id).join(", "));
  const conus = solve(new Set(["saddle_anaesthesia@midline", "sphincter_dysfunction@midline", "hyperreflexia@midline", "babinski@midline"]), opts);
  ok("the conus picture still localises to the conus", conus.display[0].site.id === "conus_medullaris", conus.display[0].site.id);
}

// ---- 2: a down-going plantar — an explicit NORMAL ----
{
  ok("down-going plantar is a finding, in the exam tree", !!FINDINGS.plantar_flexor && inTree.has("plantar_flexor"));
  ok("it is the normal of the up-going plantar", EXPLICIT_NORMAL.plantar_flexor === "babinski");
  ok("no structure produces it — a normal is not a lesion's sign", producers("plantar_flexor").length === 0);
  ok("it is offered on the left and the right", offersFor("plantar_flexor").map(o => o.key).join(",") === "left,right",
     offersFor("plantar_flexor").map(o => o.key).join(","));
  const one = knownNegatives(new Set(["plantar_flexor@left"]));
  ok("a left down-going plantar makes a left up-going plantar a known negative", one.has("babinski@left"));
  ok("…and says nothing about the other side", !one.has("plantar_flexor@right") && !one.has("babinski@right"));
  ok("down-going plantars on BOTH sides also rule out a midline up-going plantar (the conus)",
     knownNegatives(new Set(["plantar_flexor@left", "plantar_flexor@right"])).has("babinski@midline"));

  const toks = ["weak_leg@right", "plantar_flexor@right"];
  const r = solve(new Set(toks), opts);
  ok("sites predicting a right up-going plantar are excluded", r.differential.length > 0 && r.differential.every(c => !c.exp.has("babinski@right")));
  ok("…and shown as ruled out by it", r.ruledOut.some(x => x.contradictedBy === "babinski@right"));
  ok("the normal is neither explained nor unexplained — every fit explains the one abnormal finding",
     r.explainAll.length > 0 && r.explainAll.every(c => c.n === 1));
  const w = whyChain(new Set(toks), r.display[0].site, opts);
  ok("the Why chain has no step for a normal", w.steps.every(s => s.finding !== "plantar_flexor"));
  const where = [...new Set(r.explainAll.map(c => stationOf(c.site)))].sort();
  ok("…but its meet honours it, so the Why agrees with the Where", JSON.stringify([...w.meet.stations].sort()) === JSON.stringify(where),
     `${w.meet.stations} vs ${where}`);
  const clues = whyClues(w, new Set(toks), opts);
  ok("…and the clues never name the normal", clues.clues.every(c => c.finding !== "plantar_flexor") && clues.reached);
  ok("a normal on its own localises nothing", solve(new Set(["plantar_flexor@left"]), opts).differential.length === 0);
}

// ---- 3: central post-stroke pain is not an examination finding ----
{
  ok("central post-stroke pain is not a finding", !FINDINGS.thalamic_pain && !inTree.has("thalamic_pain"));
  ok("…and no structure produces it", producers("thalamic_pain").length === 0);
  const r = solve(new Set(["spinothalamic@right", "dorsal_sensory@right", "face_sensory_loss@right"]), opts);
  ok("a pure sensory stroke still localises to the thalamus", r.display[0].site.id === "left_subcortex_thalamus", r.display[0].site.id);
}

// ---- 4: the autonomic findings, each predicted by Lambert-Eaton and acute Guillain–Barré ----
{
  const AUTO = ["dry_mouth", "constipation", "erectile_dysfunction", "labile_blood_pressure", "arrhythmia"];
  ok("the combined 'autonomic features' finding is gone", !FINDINGS.autonomic_features && producers("autonomic_features").length === 0);
  ok("each autonomic finding exists and has no side", AUTO.every(f => FINDINGS[f] && NON_LATERALISED.has(f)), AUTO.filter(f => !FINDINGS[f] || !NON_LATERALISED.has(f)).join(", "));
  const both = f => places(f).has("motor_unit|nmj_presynaptic") && places(f).has("polyradiculoneuropathy|acute");
  ok("each is predicted by Lambert-Eaton AND acute Guillain–Barré", AUTO.every(both), AUTO.filter(f => !both(f)).join(", "));
  ok("they sit in the Autonomic exam group", AUTO.every(f => group("autonomic").findings.includes(f)));
  ok("…and none in Fatiguability", !group("fatiguability").findings.some(f => AUTO.includes(f) || f === "autonomic_features"));
  const lems = solve(new Set(["facilitating_weakness@left", "facilitating_weakness@right", "dry_mouth@none", "constipation@none"]), opts);
  ok("Lambert-Eaton still comes first with dry mouth and constipation", lems.display[0].site.id === "motor_unit_nmj_presynaptic", lems.display[0].site.id);
  const auto = solve(new Set(["dry_mouth@none"]), opts);
  ok("dry mouth alone offers both diseases", ["motor_unit_nmj_presynaptic", "polyradiculoneuropathy_acute"].every(id => auto.explainAll.some(c => c.site.id === id)));
}

console.log(`\nvocabulary rulings: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

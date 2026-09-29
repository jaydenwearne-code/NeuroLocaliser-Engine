// vocab-rulings.test.js — the owner's finding-vocabulary rulings from review round 1 (2026-09-29, ED first
// glance). Four changes to WHAT the findings are, each pinned here so it cannot quietly revert:
//   1. brisk reflexes (hyperreflexia) are split from the up-going plantar and produced along the tract;
//   2. a down-going plantar is an explicit NORMAL — the engine's first — that DEMOTES lesions predicting an
//      up-going plantar (it does not exclude them), and the basis pontis gains its plantar and brisk reflexes;
//   3. central post-stroke pain is not an examination finding and is gone from the model;
//   4. the autonomic features are separate findings, each predicted by Lambert-Eaton AND acute Guillain–Barré.
import { FINDINGS, NON_LATERALISED, EXPLICIT_NORMAL } from "../src/model/findings.js";
import { STRUCTURES } from "../src/model/structures.js";
import { stationOf } from "../src/model/stations.js";
import { solve, knownNegatives, normalNegatives } from "../src/engine/inverse.js";
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
  const conus = solve(new Set(["saddle_anaesthesia@midline", "sphincter_dysfunction@midline",
                               "hyperreflexia@left", "hyperreflexia@right", "babinski@left", "babinski@right"]), opts);
  ok("the conus picture still localises to the conus", conus.display[0].site.id === "conus_medullaris", conus.display[0].site.id);
}

// ---- 2: a down-going plantar — an explicit NORMAL that DEMOTES (owner rulings 2026-09-29) ----
// Built first as an exclusion; driving it showed leg weakness + a down-going plantar left ONE candidate (the
// basis pontis, then the only corticospinal site without a plantar sign). A flexor plantar is common early in a
// stroke, so it DEMOTES instead — the way onset demotes causes — and the basis pontis gained its plantar.
{
  ok("down-going plantar is a finding, in the exam tree", !!FINDINGS.plantar_flexor && inTree.has("plantar_flexor"));
  ok("it is the normal of the up-going plantar", EXPLICIT_NORMAL.plantar_flexor === "babinski");
  ok("no structure produces it — a normal is not a lesion's sign", producers("plantar_flexor").length === 0);
  ok("it is offered on the left and the right", offersFor("plantar_flexor").map(o => o.key).join(",") === "left,right",
     offersFor("plantar_flexor").map(o => o.key).join(","));
  const one = normalNegatives(new Set(["plantar_flexor@left"]));
  ok("a left down-going plantar counts against a left up-going plantar", one.has("babinski@left"));
  ok("…and says nothing about the other side", !one.has("babinski@right"));
  // The conus predicts an up-going plantar on BOTH sides (spec 2026-09-29-conus-cauda-bilateral), so the per-side
  // rule reaches it; the old both-sides -> midline rule is gone.
  const both = normalNegatives(new Set(["plantar_flexor@left", "plantar_flexor@right"]));
  ok("down-going plantars on BOTH sides count against both up-going plantars (so against the conus)",
     both.has("babinski@left") && both.has("babinski@right") && !both.has("babinski@midline"));
  ok("it is NOT a known negative — it never excludes", !knownNegatives(new Set(["plantar_flexor@left"])).has("babinski@left"));

  ok("the basis pontis now predicts an up-going plantar and brisk reflexes, like every corticospinal site",
     places("babinski").has("pons|basis_pontis") && places("hyperreflexia").has("pons|basis_pontis"));

  const toks = ["weak_leg@right", "plantar_flexor@right"];
  const withNormal = solve(new Set(toks), opts), without = solve(new Set(["weak_leg@right"]), opts);
  ok("leg weakness + down-going plantar keeps every lesion that fits leg weakness",
     withNormal.explainAll.length === without.explainAll.length && withNormal.explainAll.length > 1,
     `${withNormal.explainAll.length} vs ${without.explainAll.length}`);
  ok("…each predicting an up-going plantar is marked as counted against",
     withNormal.explainAll.filter(c => c.exp.has("babinski@right")).every(c => c.against === "babinski@right"));
  ok("…and nothing is listed as ruled out by it", !withNormal.ruledOut.some(x => x.contradictedBy === "babinski@right"));
  ok("the normal is neither explained nor unexplained — every fit explains the one abnormal finding",
     withNormal.explainAll.every(c => c.n === 1));

  // A mixed field: bilateral vibration loss fits sites that do and do not predict up-going plantars.
  const mixed = solve(new Set(["dorsal_sensory@left", "dorsal_sensory@right", "plantar_flexor@left", "plantar_flexor@right"]), opts);
  const d = mixed.differential, firstAgainst = d.findIndex(c => c.against);
  ok("in a mixed field some fits are demoted and some are not", firstAgainst > 0 && d.some(c => !c.against));
  const misordered = d.filter((c, i) => c.against && d.slice(i + 1).some(x => !x.against && x.n === c.n));
  ok("…and every demoted fit ranks below every undemoted fit of the same coverage", misordered.length === 0,
     misordered.map(c => c.site.id).join(", "));
  ok("…so the first answer does not predict an up-going plantar", !mixed.display[0].against, mixed.display[0].site.id);

  const w = whyChain(new Set(toks), withNormal.display[0].site, opts);
  ok("the Why chain has no step for a normal", w.steps.every(s => s.finding !== "plantar_flexor"));
  const where = [...new Set(withNormal.explainAll.map(c => stationOf(c.site)))].sort();
  ok("…and its meet still agrees with the Where", JSON.stringify([...w.meet.stations].sort()) === JSON.stringify(where),
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

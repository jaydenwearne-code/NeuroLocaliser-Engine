// why.test.js — the integrated Why (spec 2026-09-26): stations, side reasons, and the reasoning chain.
import { candidateSites, solve } from "../src/engine/inverse.js";
import { expectedFindings } from "../src/engine/forward.js";
import { whyChain, renderWhere } from "../src/engine/why.js";
import { EXAMPLES } from "../app/examples.js";
import { STATIONS, STATION_ORDER, STATION_GROUP, AXIS, stationOf } from "../src/model/stations.js";

let pass = 0, fail = 0;
const ok = (l, c, d = "") => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l + (c ? "" : `  ${d}`)); };
const cs = candidateSites();
const byId = id => cs.find(s => s.id === id);

// ---- 1: stations ----
{
  const unmapped = [...new Set(cs.filter(s => !stationOf(s)).map(s => `${s.level}|${s.part}`))];
  ok(`every candidate site maps to a station (${cs.length} sites)`, unmapped.length === 0, unmapped.join(", "));
  const known = new Set(STATION_ORDER);
  ok("every mapped station is a declared station", cs.every(s => known.has(stationOf(s))));
  ok("every station has a group", STATIONS.every(s => ["hemisphere", "brainstem", "cerebellum", "cord", "peripheral"].includes(s.group)));
  ok("the axis is an ordered subset of the stations", AXIS.every((a, i) => i === 0 || STATION_ORDER.indexOf(a) > STATION_ORDER.indexOf(AXIS[i - 1])));
  ok("the brainstem stays split by level (Weber midbrain, Wallenberg medulla)",
     stationOf(byId("left_midbrain_medial")) === "midbrain" && stationOf(byId("left_medulla_lateral")) === "medulla");
  ok("a part override beats its level (the VPL thalamus is thalamus, not deep white matter)",
     stationOf(byId("left_subcortex_thalamus")) === "thalamus" && stationOf(byId("left_subcortex_internal_capsule")) === "deep white matter");
  ok("the optic-nerve sites are visual pathway, not cranial nerve", stationOf(byId("left_skull_base_optic_neuritis")) === "visual pathway");
  ok("a group per station, keyed by id", STATION_GROUP["medulla"] === "brainstem" && STATION_GROUP["nerve root"] === "peripheral");
}

// ---- 2: the chain ----
const chainFor = toks => { const r = solve(new Set(toks), { dominantSide: "left" });
  return { site: r.display[0].site, w: whyChain(new Set(toks), r.display[0].site, { dominantSide: "left" }) }; };
const stepOf = (w, tok) => w.steps.find(s => s.token === tok);
{
  const { w } = chainFor(["face_pain_loss@left", "spinothalamic@right", "miosis@left", "dysphagia@left", "limb_ataxia@left"]);
  ok("Wallenberg meets at the medulla, left side, one place",
     w.verdict === "one" && JSON.stringify(w.meet.stations) === '["medulla"]' && JSON.stringify(w.meet.sides) === '["left"]');
  const face = stepOf(w, "face_pain_loss@left"), body = stepOf(w, "spinothalamic@right");
  ok("…the face is SAME side, explained by the trigeminal crossing", face.relation === "same" && /trigeminal lemniscus/.test(face.reason) && /does not lie between/.test(face.reason));
  ok("…the body is OPPOSITE side, explained by the anterior white commissure", body.relation === "opposite" && /anterior white commissure/.test(body.reason) && /lies between/.test(body.reason));
  ok("…the Horner step says the pathway does not cross", /does not cross/.test(stepOf(w, "miosis@left").reason));
  ok("…the ataxia step says the cerebellar outflow crosses twice", /crosses twice/.test(stepOf(w, "limb_ataxia@left").reason));
  ok("…every step is carried here, by a named structure", w.steps.every(s => s.explained && s.carrier));
  ok("…steps run most-localising first", w.steps.every((s, i) => i === 0 || s.stations.length >= w.steps[i - 1].stations.length));
  ok("…the face step could arise only at pons or medulla", face.where === "pons, medulla", face.where);
}
{
  // A SHARED finding (ptosis: CN III or sympathetic) takes its pathway from its carrier's siblings at the same
  // site — the sympathetic ptosis in Wallenberg rides with the sympathetic miosis, not with the cranial nerves.
  const { w } = chainFor(["face_pain_loss@left", "spinothalamic@right", "ptosis@left", "miosis@left", "dysphagia@left"]);
  ok("a sympathetic ptosis is explained as the uncrossed sympathetic pathway", /does not cross/.test(stepOf(w, "ptosis@left").reason), stepOf(w, "ptosis@left").reason);
  const weber = chainFor(["ptosis@left", "weak_adduction@left", "weak_arm@right", "weak_leg@right"]).w;
  ok("…while a CN III ptosis is explained as a cranial nerve", /cranial nerves serve their own side/.test(stepOf(weber, "ptosis@left").reason), stepOf(weber, "ptosis@left").reason);
}
{
  const { w } = chainFor(["ptosis@left", "weak_adduction@left", "weak_arm@right", "weak_leg@right"]);
  ok("Weber meets at the midbrain", w.verdict === "one" && JSON.stringify(w.meet.stations) === '["midbrain"]');
  ok("…arm weakness is opposite side across the pyramidal decussation",
     stepOf(w, "weak_arm@right").relation === "opposite" && /pyramidal decussation/.test(stepOf(w, "weak_arm@right").reason));
  ok("…arm weakness could arise anywhere from cortex to cord", stepOf(w, "weak_arm@right").where === "cerebral cortex → spinal cord");
}
{
  const { w } = chainFor(["weak_ankle_dorsiflexion@left", "weak_hip_abduction@left", "sensory_l5@left"]);
  ok("L5 radiculopathy fits several places: nerve root, plexus", w.verdict === "several" && JSON.stringify(w.meet.stations) === '["nerve root","plexus"]');
}
{
  const { w } = chainFor(["babinski@left"]);
  ok("an isolated Babinski does not localise: several places, cortex → cord",
     w.verdict === "several" && w.steps[0].where === "cerebral cortex → spinal cord", w.steps[0].where);
}
{
  const two = EXAMPLES.find(e => e.id === "twolesions");
  const { w } = chainFor(two.tokens);
  ok("the two-lesion worked example meets nowhere", w.verdict === "none" && w.meet.stations.length === 0);
  ok("…and the step the chosen site cannot carry says so", w.steps.some(s => !s.explained && s.carrier === null && s.reason === ""));
}
{
  ok("renderWhere compresses a run of three or more along the axis", renderWhere(["midbrain", "pons", "medulla"]) === "midbrain → medulla");
  ok("renderWhere keeps a run of two as a list", renderWhere(["pons", "medulla"]) === "pons, medulla");
  ok("renderWhere lists off-axis stations after the axis runs", renderWhere(["deep white matter", "thalamus", "midbrain", "pons"]) === "deep white matter → pons, thalamus");
  const w = whyChain(new Set(["papilloedema@none", "hoovers_sign@none", "weak_arm@right"]), byId("left_subcortex_internal_capsule"), { dominantSide: "left" });
  ok("axis and flag findings (papilloedema, functional) are not steps", w.steps.map(s => s.token).join() === "weak_arm@right");
}

// ---- 3: invariants over every site's own complete picture ----
{
  const noSelf = [], noCarrier = [], disagree = [];
  for (const s of cs) {
    let E; try { E = expectedFindings(s, { dominantSide: "left" }); } catch { continue; }
    if (!E.size) continue;
    const w = whyChain(E, s, { dominantSide: "left" });
    if (!w.meet.stations.includes(stationOf(s))) noSelf.push(s.id);
    if (w.steps.some(x => x.explained && !x.carrier)) noCarrier.push(s.id);
    const r = solve(E, { dominantSide: "left" });
    if (r.singleExplainsAll) {
      const top = r.display[0].site;
      if (!whyChain(E, top, { dominantSide: "left" }).meet.stations.includes(stationOf(top))) disagree.push(s.id);
    }
  }
  ok("every site's complete picture meets at that site's own station", noSelf.length === 0, noSelf.join(", "));
  ok("every explained step names its carrier", noCarrier.length === 0, noCarrier.join(", "));
  ok("the Why agrees with the Where (the first-ranked site's station is in the meet)", disagree.length === 0, disagree.join(", "));
}

console.log(`\nintegrated why: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

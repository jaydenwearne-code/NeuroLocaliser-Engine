// why.test.js — the integrated Why (spec 2026-09-26): stations, side reasons, and the reasoning chain.
import { candidateSites, solve } from "../src/engine/inverse.js";
import { expectedFindings } from "../src/engine/forward.js";
import { whyChain, renderWhere, whyClues } from "../src/engine/why.js";
import { readFileSync } from "node:fs";
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

// ---- 4: the Why line's key clues (spec 2026-09-27 §4) ----
// The vignettes are the owner-reviewed bedside cases; they are read from their own suite rather than copied.
const VIGNETTES = [...readFileSync(new URL("./clinical-vignettes.test.js", import.meta.url), "utf8")
  .matchAll(/^\s*\["([^"]+)",\s*"([^"]+)"/gm)].map(m => ({ label: m[1], tokens: m[2].split(/\s+/) }));
const cluesOf = toks => {
  const obs = new Set(toks), opts = { dominantSide: "left" };
  const site = solve(obs, opts).display[0].site;
  return whyClues(whyChain(obs, site, opts), obs, opts);
};
const said = w => w.clues.map(c => (c.side ? c.side + " " : "") + c.finding).join(" + ");
const vig = label => VIGNETTES.find(v => v.label === label).tokens;
{
  ok(`the vignettes were read (${VIGNETTES.length})`, VIGNETTES.length >= 80, String(VIGNETTES.length));
  const expect = {
    "Weber": "left weak_adduction + right weak_arm",
    "Wallenberg (with dysphagia)": "left face_pain_loss + left dysphagia + right spinothalamic",
    "Medial medullary (Dejerine)": "left cn12_palsy + right weak_arm",
    "Brown-Sequard": "left weak_leg + right spinothalamic",
    "Complete dominant MCA": "speech_nonfluent + right homonymous_hemianopia",
    "CN III compressive (pupil involved)": "left fixed_dilated_pupil + left ptosis",
    "Guillain-Barré (symmetric LMN + areflexia)": "bilateral lmn_weakness + bilateral reflex_knee_loss",
    "L5 radiculopathy": "left sensory_l5",
  };
  for (const [label, want] of Object.entries(expect)) ok(`clues — ${label}: ${want}`, said(cluesOf(vig(label))) === want, said(cluesOf(vig(label))));
  const gbs = cluesOf(vig("Guillain-Barré (symmetric LMN + areflexia)"));
  ok("a finding entered on both sides is one clue, with no side relation", gbs.clues.every(c => c.side === "bilateral" && c.relation === "both"));
  ok("L5 alone: several places, and the clue says so", cluesOf(vig("L5 radiculopathy")).verdict === "several");
  const none = whyClues({ verdict: "none", steps: [], meet: { stations: [], sides: [] } }, new Set());
  ok("no single place: no clues", none.verdict === "none" && none.clues.length === 0);
}
{
  const bad = [], tooMany = [], notEntered = [];
  for (const v of VIGNETTES) {
    const w = cluesOf(v.tokens);
    if (!w.reached) bad.push(v.label);
    if (w.clues.length > 3) tooMany.push(v.label);
    if (w.clues.some(c => c.tokens.some(t => !v.tokens.includes(t)))) notEntered.push(v.label);
  }
  ok("every vignette's clues narrow to the answer's place", bad.length === 0, bad.join(", "));
  ok("never more than 3 clues shown", tooMany.length === 0, tooMany.join(", "));
  ok("every clue is a finding the clinician entered", notEntered.length === 0, notEntered.join(", "));
}
{
  // Every site's own complete picture: the clues reach that place, and a one-sided clue set never hides the
  // crossed half. 365 pictures; about three seconds.
  const bad = [], halfCrossed = [];
  for (const s of cs) {
    let E; try { E = new Set(expectedFindings(s, { dominantSide: "left" })); } catch { continue; }
    if (!E.size) continue;
    const chain = whyChain(E, s, { dominantSide: "left" });
    const w = whyClues(chain, E, { dominantSide: "left" });
    if (!w.reached) bad.push(s.id);
    const oneSided = chain.steps.filter(x => !(E.has(`${x.finding}@left`) && E.has(`${x.finding}@right`)));
    const crossed = oneSided.some(x => x.relation === "same") && oneSided.some(x => x.relation === "opposite");
    const kinds = ["same", "opposite"].filter(k => w.clues.some(c => c.relation === k)).length;
    if (crossed && kinds === 1 && w.clues.length < 3) halfCrossed.push(s.id);
  }
  ok("every site's own picture: the clues reach its place", bad.length === 0, bad.slice(0, 8).join(", "));
  ok("a crossed picture never shows only one side in its clues", halfCrossed.length === 0, halfCrossed.slice(0, 8).join(", "));
}

console.log(`\nintegrated why: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

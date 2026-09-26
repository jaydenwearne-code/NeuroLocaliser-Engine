// accuracy-mechanisms.test.js — the engine mechanisms added by accuracy round 1 (spec 2026-09-25 §4A).
// Content (which structures sit where) is asserted in the regional suites; this suite pins the machinery.
import { STRUCTURE_BY_ID } from "../src/model/structures.js";
import { expectedFindings, explain } from "../src/engine/forward.js";
import { candidateSites, differential, ruledOutSites, solve, PREVALENCE_ALLOWANCE, rankKey } from "../src/engine/inverse.js";
import { prevalenceOf, COMMON, UNCOMMON, RARE } from "../src/model/prevalence.js";
import { SITE_BY_ID } from "../src/model/sites.js";
import { FINDINGS, CROSSES } from "../src/model/findings.js";
import { LOCALISING } from "../src/engine/score.js";
import { EXAM_TREE, flattenFindings } from "../app/exam-map.js";

let pass = 0, fail = 0;
const ok = (l, c, d = "") => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l + (c ? "" : `  ${d}`)); };

// ---- A2: structure emission override ----
// Synthetic structures, injected and removed again, so the mechanism is tested independently of content.
{
  STRUCTURE_BY_ID.zz_emit_mid = { id: "zz_emit_mid", level: "cord", part: "zz", produces: "sphincter_dysfunction", emit: "midline" };
  STRUCTURE_BY_ID.zz_emit_bi = { id: "zz_emit_bi", level: "cauda", part: "zz", produces: "reflex_ankle_loss", emit: "bilateral" };
  STRUCTURE_BY_ID.zz_plain = { id: "zz_plain", level: "cauda", part: "zz", produces: "saddle_anaesthesia" };
  const bilat = { id: "zz_bilat", side: "bilateral", level: "cord", part: "zz", structures: ["zz_emit_mid"] };
  const mid = { id: "zz_mid", side: "midline", level: "cauda", part: "zz", structures: ["zz_emit_bi", "zz_plain"] };
  const left = { id: "zz_left", side: "left", level: "cauda", part: "zz", structures: ["zz_emit_bi"] };
  const eb = expectedFindings(bilat), em = expectedFindings(mid), el = expectedFindings(left);
  ok("emit:'midline' at a BILATERAL site emits @midline only",
     eb.has("sphincter_dysfunction@midline") && !eb.has("sphincter_dysfunction@left") && !eb.has("sphincter_dysfunction@right"));
  ok("emit:'bilateral' at a MIDLINE site emits @left and @right, not @midline",
     em.has("reflex_ankle_loss@left") && em.has("reflex_ankle_loss@right") && !em.has("reflex_ankle_loss@midline"));
  ok("a structure without `emit` keeps the site's own rule (midline site → @midline)", em.has("saddle_anaesthesia@midline"));
  ok("emit:'bilateral' at a one-sided site still emits both sides",
     el.has("reflex_ankle_loss@left") && el.has("reflex_ankle_loss@right"));
  const xm = explain(mid).filter(e => e.structure === "zz_emit_bi").map(e => e.bodySide).sort();
  ok("explain() agrees with expectedFindings() for emit:'bilateral'", JSON.stringify(xm) === JSON.stringify(["left", "right"]));
  const xb = explain(bilat).map(e => e.bodySide);
  ok("explain() agrees with expectedFindings() for emit:'midline'", JSON.stringify(xb) === JSON.stringify(["midline"]));
  delete STRUCTURE_BY_ID.zz_emit_mid; delete STRUCTURE_BY_ID.zz_emit_bi; delete STRUCTURE_BY_ID.zz_plain;
}

// ---- A1: asymmetry-tolerant sites (owner rulings 2026-09-25) ----
{
  const cs = candidateSites();
  const byId = id => cs.find(s => s.id === id);
  const asym = ["motor_unit_anterior_horn", "motor_unit_nmj_postsynaptic", "motor_unit_nmj_presynaptic", "motor_unit_muscle", "cauda_equina"];
  ok("the four motor-unit sites and the cauda equina are asymmetric", asym.every(id => byId(id)?.asymmetric === true),
     asym.filter(id => byId(id)?.asymmetric !== true).join(", "));
  const sym = ["conus_medullaris", "polyneuropathy_length_dependent", "combined_degeneration_scd", "combined_degeneration_friedreich", "locked_in", "bilateral_cord_transverse"];
  ok("symmetric-by-definition sites are NOT asymmetric", sym.every(id => byId(id) && !byId(id).asymmetric),
     sym.filter(id => byId(id)?.asymmetric).join(", "));
  const ids = toks => differential(new Set(toks), { dominantSide: "left" }).map(c => c.site.id);
  ok("one-sided fatigable ptosis keeps myasthenia as a candidate", ids(["fatigable_ocular@left"]).includes("motor_unit_nmj_postsynaptic"));
  ok("one-sided fasciculations keep the anterior horn as a candidate", ids(["fasciculations@left"]).includes("motor_unit_anterior_horn"));
  ok("one-sided LMN weakness is no longer a dead end", ids(["lmn_weakness@left"]).length > 0);
  ok("a symmetric site is still excluded by a one-sided entry (distal sensory loss, left only)",
     !ids(["distal_sensory_loss@left"]).includes("polyneuropathy_length_dependent"));
  const ruled = ruledOutSites(new Set(["fatigable_ocular@left", "fasciculations@left"]), { dominantSide: "left" });
  ok("ruledOutSites never lists an asymmetric site", !ruled.some(x => x.site.asymmetric), ruled.map(x => x.site.id).join(", "));
}

// ---- A3: tighter-fit ranking ----
{
  ok("each prevalence tier is worth 3 unreported predictions", PREVALENCE_ALLOWANCE === 3);
  ok("rankKey = over − 3 × prevalence", rankKey({ over: 7, prevalence: 2 }) === 1 && rankKey({ over: 0, prevalence: 0 }) === 0);
  // Transitivity: the order must be a total preorder, or Array.sort is undefined. Check every pair of a
  // large real differential against the documented key.
  const d = differential(new Set(["weak_arm@left"]), { dominantSide: "left" });
  let consistent = true;
  for (let i = 0; i < d.length; i++) for (let j = i + 1; j < d.length; j++) {
    const a = d[i], b = d[j];
    const before = a.n > b.n || (a.n === b.n && (rankKey(a) < rankKey(b) || (rankKey(a) === rankKey(b)
      && (a.prevalence > b.prevalence || (a.prevalence === b.prevalence && (a.over < b.over
      || (a.over === b.over && a.site.id.localeCompare(b.site.id) <= 0)))))));
    if (!before) consistent = false;
  }
  ok(`the differential is a total order under the documented key (${d.length} candidates)`, consistent);
  const first = toks => solve(new Set(toks), { dominantSide: "left" }).display[0]?.site.id;
  ok("thalamic pain → the thalamus, not the sensorimotor stroke that predicts 7 unreported signs",
     first(["thalamic_pain@left"]) === "right_subcortex_thalamus", first(["thalamic_pain@left"]));
}

// ---- A6: prevalence ordering ----
{
  const cs = candidateSites(); const byId = id => cs.find(s => s.id === id);
  ok("length-dependent polyneuropathy is COMMON (the bilateral rule no longer shadows it)",
     prevalenceOf(byId("polyneuropathy_length_dependent")) === COMMON);
  ok("other bilateral sites stay RARE", ["locked_in", "motor_unit_muscle", "bilateral_cord_transverse"].every(id => prevalenceOf(byId(id)) === RARE));
}

// ---- B13: forehead also weak — the LMN facial discriminator ----
{
  ok("forehead_involved is a finding, ipsilateral, LOCALISING, and in the exam tree",
     !!FINDINGS.forehead_involved && CROSSES.forehead_involved === false && LOCALISING.has("forehead_involved")
     && flattenFindings(EXAM_TREE).includes("forehead_involved"));
  const lmnVII = ["left_skull_base_iam", "left_skull_base_cpa", "left_skull_base_vii_geniculate", "left_skull_base_vii_tympanic",
                  "left_skull_base_vii_mastoid", "left_skull_base_vii_stylomastoid", "left_pons_medial", "left_pons_lateral"];
  const cs = candidateSites(); const byId = id => cs.find(s => s.id === id);
  ok("every LMN facial site predicts the forehead weak on the SAME side",
     lmnVII.every(id => expectedFindings(byId(id), { dominantSide: "left" }).has("forehead_involved@left")),
     lmnVII.filter(id => !expectedFindings(byId(id), { dominantSide: "left" }).has("forehead_involved@left")).join(", "));
  ok("the parotid (a single branch) does not predict the forehead", !expectedFindings(byId("left_skull_base_vii_parotid")).has("forehead_involved@left"));
  ok("no UMN facial site predicts it", !expectedFindings(byId("right_cortex_motor_facearm")).has("forehead_involved@left"));
}

// ---- B12: the AICA / lateral inferior pontine syndrome ----
{
  const e = expectedFindings(SITE_BY_ID.left_pons_lateral, { dominantSide: "left" });
  const want = ["facial_weakness@left", "forehead_involved@left", "hearing_loss@left", "face_pain_loss@left", "miosis@left", "ptosis@left"];
  ok("the lateral pons predicts the AICA features, all ipsilateral", want.every(t => e.has(t)), want.filter(t => !e.has(t)).join(", "));
}

console.log(`\naccuracy mechanisms: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

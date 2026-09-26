// accuracy-mechanisms.test.js — the engine mechanisms added by accuracy round 1 (spec 2026-09-25 §4A).
// Content (which structures sit where) is asserted in the regional suites; this suite pins the machinery.
import { STRUCTURE_BY_ID } from "../src/model/structures.js";
import { expectedFindings, explain } from "../src/engine/forward.js";
import { candidateSites, differential, ruledOutSites } from "../src/engine/inverse.js";

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

console.log(`\naccuracy mechanisms: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

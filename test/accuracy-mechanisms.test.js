// accuracy-mechanisms.test.js — the engine mechanisms added by accuracy round 1 (spec 2026-09-25 §4A).
// Content (which structures sit where) is asserted in the regional suites; this suite pins the machinery.
import { STRUCTURE_BY_ID } from "../src/model/structures.js";
import { expectedFindings, explain } from "../src/engine/forward.js";

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

console.log(`\naccuracy mechanisms: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

// level-axis.test.js — the sensory level in the app (spinal cord fix, round 1, rows 9–10): WHEN the field shows and
// WHAT the level line says. Pure — app/level-axis.js has no DOM. Run: node test/level-axis.test.js
import { CORD_AXIS_FINDINGS, showLevelField, levelLine } from "../app/level-axis.js";
import { FINDINGS } from "../src/model/findings.js";
import { solve } from "../src/engine/inverse.js";
import { answerFor } from "../app/answer.js";

let pass = 0, fail = 0;
function ok(label, cond, detail = "") { cond ? pass++ : fail++; console.log(`${cond ? "PASS" : "FAIL"}  ${label}${cond ? "" : "  " + detail}`); }
const L = s => new Set(s.split(/\s+/).filter(Boolean));
const B = f => `${f}@left ${f}@right`;
const show = toks => showLevelField(L(toks), solve(L(toks)).display);
const r = (toks, lvl) => solve(L(toks), lvl ? { sensoryLevel: lvl } : {});

// ---- when the field shows (row 10, as refined by the owner: a cord FIRST answer) ----
ok("every trigger id is a real finding (dorsal_column, sensory_level, glove_stocking are gone)", [...CORD_AXIS_FINDINGS].every(f => FINDINGS[f]));
ok("a pure dorsal-column picture shows the field", show(B("dorsal_sensory")));
ok("a spastic paraparesis shows the field (the cord is the answer)", show(`${B("hyperreflexia")} ${B("babinski")} ${B("spasticity")}`));
ok("a single weak arm does not (the 2026-08-16 rule holds)", !show("weak_arm@right"));
ok("a hemiparesis does not", !show("weak_arm@right weak_leg@right"));
ok("no findings: hidden", !showLevelField(new Set(), []));

// ---- what the level line says (row 9) ----
ok("no level typed and a non-cord answer → no line", levelLine(r("weak_arm@right weak_leg@right facial_weakness@right forehead_spared@right").level, "x") === null);
const p14 = r(`${B("hyperreflexia")} ${B("babinski")} ${B("spasticity")}`, "T10");
ok("a level typed under a cord answer → the engine's note (content round, B3)", /^lesion at or above T10 — /.test(levelLine(p14.level, "x") || ""));
const ca = r("saddle_anaesthesia@midline sphincter_dysfunction@midline reflex_ankle_loss@left reflex_ankle_loss@right lmn_weakness@left radicular_pain@left", "T10");
ok("a level typed under a cauda answer → the contradiction, the place leading (content round, C1)",
   levelLine(ca.level, "Midline cauda equina") === "Midline cauda equina cannot produce a sensory level at T10 — that needs a cord lesion at or above T10. Re-check the level, or consider a second lesion.");
const p1 = r(`reflex_biceps_loss@left reflex_brachioradialis_loss@left weak_elbow_flexion@left ${B("hyperreflexia")} ${B("babinski")} ${B("spasticity")}`);
ok("no level typed, an at-level reading → its segment", /C5–6/.test(levelLine(p1.level, "x") || ""));
ok("an unrecognised level typed under a cord answer → the 'unrecognised' note", /unrecognised/.test(levelLine(r(B("dorsal_sensory"), "Z9").level, "x") || ""));

// ---- the reading on the card (content round, A1–A2): the answer's Where line names it; "also fit" stays plain ----
const card = (toks, lvl) => {
  const tokens = L(toks), rr = r(toks, lvl);
  return answerFor({ r: rr, sel: rr.display[0], total: tokens.size, tokens, onset: undefined, course: undefined, dominant: "left",
    sensoryLevel: lvl, pinned: new Set(), scope: "site", selectedPathology: undefined, selectedEntity: undefined }).lines;
};
const spasticCard = card(`${B("hyperreflexia")} ${B("babinski")} ${B("spasticity")}`);
ok("A1: a spastic paraparesis reads 'Bilateral anterior cord (arms spared).'", spasticCard.where.startsWith("Bilateral anterior cord (arms spared)."), spasticCard.where);
ok("A2: …and the places that also fit carry no reading", /also fit: [^()]*$/.test(spasticCard.where), spasticCard.where);
const p1Card = card(`reflex_biceps_loss@left reflex_brachioradialis_loss@left weak_elbow_flexion@left ${B("hyperreflexia")} ${B("babinski")} ${B("spasticity")}`);
ok("A1: a C5/6 myeloradiculopathy reads 'Bilateral anterior cord (at about C5–6, root signs on the left).'", p1Card.where.startsWith("Bilateral anterior cord (at about C5–6, root signs on the left)."), p1Card.where);
const shockCard = card(`${B("lmn_weakness")} ${B("reflex_knee_loss")} ${B("reflex_ankle_loss")} ${B("hypotonia")} ${B("spinothalamic")} sphincter_dysfunction@midline`, "T6");
ok("A1: spinal shock reads '(spinal shock, arms spared)'", shockCard.where.startsWith("Bilateral anterior cord (spinal shock, arms spared)."), shockCard.where);
ok("A1: never 'thoracic' on the card", ![spasticCard, p1Card, shockCard].some(c => /thoracic/i.test(c.where)));
ok("E1: the spastic paraparesis card names compression first", /^Most likely Compressive myelopathy \(disc \/ mass \/ abscess\)/.test(spasticCard.what), spasticCard.what);

console.log(`\nlevel axis (app): ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);

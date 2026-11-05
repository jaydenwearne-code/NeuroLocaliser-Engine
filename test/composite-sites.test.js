// composite-sites.test.js — the composite sites (owner-ruled 2026-11-05; spec
// docs/superpowers/specs/2026-11-05-composite-sites-design.md). One lesion that spans places the model held only
// separately: each approved row is pinned here, with the guards the spec's §6 lists as unchanged by design.
// Run: node test/composite-sites.test.js
import { solve, candidateSites } from "../src/engine/inverse.js";
import { expectedFindings } from "../src/engine/forward.js";
import { whyChain, whyClues } from "../src/engine/why.js";
import { STRUCTURES } from "../src/model/structures.js";
import { stationOf } from "../src/model/stations.js";
import { nameForSite } from "../src/data/syndromes.js";
import { causesFor, leadingCause } from "../src/data/causes.js";
import { nextStepsFor } from "../src/data/nextSteps.js";
import { plainSiteName, readingLabel } from "../app/labels.js";

let pass = 0, fail = 0;
const ok = (label, cond, detail = "") => { cond ? pass++ : fail++; console.log((cond ? "PASS  " : "FAIL  ") + label + (cond ? "" : `  ${detail}`)); };
const T = s => new Set(s.split(/\s+/).filter(Boolean));
const SITE = Object.fromEntries(candidateSites().map(s => [s.id, s]));
const has = id => !!SITE[id];
const predicts = (id, tok) => has(id) && expectedFindings(SITE[id]).has(tok);
const ids = r => r.display.map(c => c.site.id);
// The answer the card shows: its id, the reading it was read as (a variant key, or null), and the claim.
const answer = (toks, opts = {}) => { const r = solve(T(toks), opts); const c = r.display[0];
  return { id: c ? c.site.id : null, reading: c ? c.site.variant || null : null, multi: r.multi, r }; };
const rowsOf = (level, part, pred = () => true) => STRUCTURES.filter(s => s.level === level && s.part === part && pred(s)).map(s => s.id);
const whereOf = (toks, opts = {}) => { const set = T(toks); const r = solve(set, opts);
  return whyClues(whyChain(set, r.display[0].site, opts), set, opts); };

const QUADRI = "weak_arm@left weak_arm@right weak_leg@left weak_leg@right";
const LOCKED_IN_FULL = `${QUADRI} facial_weakness@left facial_weakness@right dysarthria@none gaze_palsy@left gaze_palsy@right preserved_vertical_gaze@none`;
const BASILAR = `reduced_consciousness@none babinski@left babinski@right ${QUADRI}`;
const SYRINX = "suspended_sensory@left suspended_sensory@right wasting@left wasting@right weak_leg@left weak_leg@right babinski@left babinski@right";
const SPASTIC_LEGS = "hyperreflexia@left hyperreflexia@right babinski@left babinski@right spasticity@left spasticity@right";
const PARASAGITTAL = "weak_leg@left weak_leg@right babinski@left babinski@right urinary_incontinence@none";
const TOP_OF_BASILAR = "reduced_consciousness@none vertical_gaze_palsy@none cortical_blindness@none";
const BILATERAL_PCA = "cortical_blindness@none amnesia@none";

// ---- 1. Both paracentral lobules (row 6) ----
{
  ok("row 6: the parasagittal site is derived from both paracentral lobules (leg motor, leg sensory, micturition)",
     has("bilateral_paracentral") && JSON.stringify(SITE.bilateral_paracentral.structures) ===
       JSON.stringify(STRUCTURES.filter(s => s.level === "cortex" && ["motor_leg", "sensory_leg", "paracentral"].includes(s.part)).map(s => s.id)));
  const ps = answer(PARASAGITTAL);
  ok("row 6: both legs UMN + cortical incontinence → both paracentral lobules, one lesion (R1 #12)", ps.id === "bilateral_paracentral" && ps.multi === null, `${ps.id} multi=${!!ps.multi}`);
  const cs = answer("weak_leg@left weak_leg@right babinski@left babinski@right cortical_sensory_leg@left cortical_sensory_leg@right");
  ok("row 6: …and with cortical sensory loss in both legs", cs.id === "bilateral_paracentral" && cs.multi === null, `${cs.id} multi=${!!cs.multi}`);
  const pap = answer("papilloedema@none weak_leg@left weak_leg@right babinski@left babinski@right sphincter_dysfunction@midline");
  ok("row 6: papilloedema + paraparesis + sphincter → both paracentral lobules first, no claim (R1 #16)", pap.id === "bilateral_paracentral" && pap.multi === null, `${pap.id} multi=${!!pap.multi}`);
  ok("row 6: its phonebook entry", has("bilateral_paracentral") && /parasagittal/i.test(nameForSite(SITE.bilateral_paracentral).name));
  ok("row 6: its causes are the paracentral lobule's (the meningioma first)", has("bilateral_paracentral") &&
     causesFor(SITE.bilateral_paracentral).all[0].name === "Parasagittal / falx meningioma");
  ok("row 6 guard: a paraparesis + both Babinski still leads with the cord", answer("weak_leg@left weak_leg@right babinski@left babinski@right").id === "bilateral_cord_anterior");
  ok("row 6 guard: one weak leg + Babinski + incontinence still → the one-sided ACA", answer("weak_leg@right babinski@right urinary_incontinence@none").id === "left_cortex_aca");
}

// ---- 2. The pons (rows 1–2) ----
{
  const li = SITE.locked_in;
  const basis = rowsOf("pons", "basis_pontis");
  ok("row 1: locked-in is derived from every basis pontis row", basis.length > 0 && basis.every(id => li.structures.includes(id)));
  ok("row 1: …and the paramedian pons's horizontal-gaze rows", rowsOf("pons", "medial", s => s.produces === "gaze_palsy").every(id => li.structures.includes(id)));
  ok("row 1: locked-in predicts both Babinski signs, both facial palsies, anarthria and both horizontal gaze palsies",
     ["babinski@left", "babinski@right", "facial_weakness@left", "facial_weakness@right", "dysarthria@none", "gaze_palsy@left", "gaze_palsy@right"].every(t => predicts("locked_in", t)));
  ok("row 1: locked-in keeps preserved vertical gaze and never predicts reduced consciousness",
     predicts("locked_in", "preserved_vertical_gaze@none") && !predicts("locked_in", "reduced_consciousness@none"));
  const full = answer(LOCKED_IN_FULL);
  ok("row 1: the full locked-in picture → locked-in, one lesion", full.id === "locked_in" && full.multi === null, `${full.id} multi=${!!full.multi}`);
  const bab = answer(`${QUADRI} babinski@left babinski@right preserved_vertical_gaze@none`);
  ok("row 1: locked-in with both Babinski signs → locked-in, one lesion", bab.id === "locked_in" && bab.multi === null, `${bab.id} multi=${!!bab.multi}`);
  const vign = answer(`${QUADRI} preserved_vertical_gaze@none`);
  ok("row 1 guard: quadriplegia + preserved vertical gaze still → locked-in", vign.id === "locked_in" && vign.multi === null, vign.id);

  const bas = answer(BASILAR);
  ok("row 2: coma + quadriparesis + both Babinski → the ARAS read with the basis pontis, one lesion",
     bas.id === "brainstem_aras" && bas.reading === "basis" && bas.multi === null, `${bas.id} {${bas.reading}} multi=${!!bas.multi}`);
  const haem = answer(`reduced_consciousness@none gaze_palsy@left gaze_palsy@right ${QUADRI}`);
  ok("row 2: coma + both horizontal gaze palsies + quadriparesis (pontine haemorrhage) → the same reading, one lesion",
     haem.id === "brainstem_aras" && haem.reading === "basis" && haem.multi === null, `${haem.id} {${haem.reading}} multi=${!!haem.multi}`);
  const post = answer(`reduced_consciousness@none extensor_posturing@none ${QUADRI}`);
  ok("row 2: coma + extensor posturing + quadriparesis → the same reading, one lesion", post.id === "brainstem_aras" && post.reading === "basis" && post.multi === null, `${post.id} {${post.reading}}`);
  const o3 = answer("reduced_consciousness@none babinski@left babinski@right");
  ok("row 2: coma + both Babinski signs (the raised-pressure round's O3) → the same reading, one lesion", o3.id === "brainstem_aras" && o3.multi === null, `${o3.id} multi=${!!o3.multi}`);
  ok("row 2 guard: coma alone still → the diffuse cerebrum", answer("reduced_consciousness@none").id === "cerebrum_diffuse");
  const cp = answer("reduced_consciousness@none extensor_posturing@none");
  ok("row 2 guard: coma + extensor posturing still → the ARAS itself, not the reading", cp.id === "brainstem_aras" && cp.reading === null, `{${cp.reading}}`);
  ok("row 2: the ARAS itself stays midline; the reading is bilateral and sits in the pons",
     SITE.brainstem_aras.side === "midline" && bas.r.display[0].site.side === "bilateral" && stationOf(bas.r.display[0].site) === "pons");
  ok("row 2: the reading's label", readingLabel(bas.r.display[0].site) === " — with the basis pontis", JSON.stringify(readingLabel(bas.r.display[0].site)));
  ok("row 2 guard: quadriparesis + both Babinski still leads with the cord", answer(`${QUADRI} babinski@left babinski@right`).id === "bilateral_cord_anterior");
  ok("row 2: the basilar picture → only the pons", whereOf(BASILAR).where === "pons", whereOf(BASILAR).where);
}

// ---- report ----
console.log(`\nNeuroLocaliser — composite sites (round 1)\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

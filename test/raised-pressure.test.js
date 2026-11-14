// raised-pressure.test.js — the raised-pressure and herniation round (owner-ruled 2026-11-05; spec
// docs/superpowers/specs/2026-11-05-raised-pressure-design.md). Pins each approved row, and the pictures the spec's §6
// lists as unchanged by design. Run: node test/raised-pressure.test.js
import { solve, candidateSites, isNormalToken, INTRACRANIAL_LEVELS } from "../src/engine/inverse.js";
import { expectedFindings } from "../src/engine/forward.js";
import * as CMP from "../src/model/compartments.js";
import { causesFor } from "../src/data/causes.js";
import * as ANS from "../app/answer.js";

let pass = 0, fail = 0;
const ok = (label, cond, detail = "") => { cond ? pass++ : fail++; console.log((cond ? "PASS  " : "FAIL  ") + label + (cond ? "" : `  ${detail}`)); };
const T = s => new Set(s.split(/\s+/).filter(Boolean));
const SITE = Object.fromEntries(candidateSites().map(s => [s.id, s]));
const ids = r => r.display.map(c => c.site.id);
const exp = id => SITE[id] ? [...expectedFindings(SITE[id])].sort() : [];
const lead = site => (causesFor(site).all[0] || {}).name || null;
const flOf = r => (r.pressure && r.pressure.falseLocalising ? r.pressure.falseLocalising.tokens : []).slice().sort();
const P = "papilloedema@none";
// Read from the module namespaces, so a missing export fails its assertions instead of the whole suite.
const PRESSURE_REACHES = CMP.PRESSURE_REACHES || new Set();
// The answer card for a picture, as app.js builds it: the count leaves out the papilloedema and any explicit normal.
const card = (toks, rOverride = null) => {
  const tokens = T(toks), r = rOverride || solve(tokens);
  const sel = r.display.find(x => x.site.id === r.defaultSite) || r.display[0];
  const total = [...tokens].filter(t => !t.startsWith("papilloedema@") && !isNormalToken(t)).length;
  return { r, sel, ans: sel ? ANS.answerFor({ r, sel, total, tokens, onset: "", course: "", dominant: "left", sensoryLevel: "",
    pinned: new Set(), scope: "site", selectedPathology: undefined, selectedEntity: undefined }) : null };
};

// ---- A. Both VI nerves, and the pressure reaches the VI's own course (rows 1, 2) ----
ok("row 1: a bilateral VI site on the cisternal course exists", !!SITE.bilateral_skull_base_vi_cisternal);
ok("row 1: it predicts weak abduction on both sides, and nothing else",
   exp("bilateral_skull_base_vi_cisternal").join() === "weak_abduction@left,weak_abduction@right", exp("bilateral_skull_base_vi_cisternal").join());
ok("row 1: it reads the cisternal VI's causes — raised pressure first",
   !!SITE.bilateral_skull_base_vi_cisternal && lead(SITE.bilateral_skull_base_vi_cisternal) === "Raised intracranial pressure (false localising sign)");
{ const r = solve(T("weak_abduction@left weak_abduction@right"));
  ok("row 1: bilateral VI alone → the bilateral VI site, one lesion (R1 #8)",
     ids(r)[0] === "bilateral_skull_base_vi_cisternal" && r.multi === null, `${ids(r)[0]} multi=${!!r.multi}`); }
{ const r = solve(T(`weak_abduction@left weak_abduction@right ${P}`));
  ok("rows 1–2: bilateral VI + papilloedema → the bilateral VI site, one lesion, the axis fires (R1 #7)",
     ids(r)[0] === "bilateral_skull_base_vi_cisternal" && r.multi === null && r.pressure.present, `${ids(r)[0]} multi=${!!r.multi}`); }
{ const r = solve(T(`weak_abduction@left ${P}`));
  ok("row 2: a VI palsy + papilloedema → the VI nerve first, not the pons", ids(r)[0] === "left_skull_base_vi_cisternal", ids(r).slice(0, 3).join(", "));
  ok("row 2: …the pons still fits", ids(r).includes("left_pons_medial")); }
ok("row 2: PRESSURE_REACHES is the VI's cisternal course, the VI at the petrous apex and (pressure-follows round, row 15) the IV's cisternal course",
   [...PRESSURE_REACHES].sort().join() === "skull_base|trochlear_cisternal,skull_base|vi_cisternal,skull_base|vi_petrous_apex", [...PRESSURE_REACHES].join());
{ // The cross-check (row 2): the parts outside the skull's levels whose own causes name raised pressure are exactly
  // PRESSURE_REACHES — the IV's cisternal course joined it in the pressure-follows round (row 15).
  const named = new Set(candidateSites().filter(s => !INTRACRANIAL_LEVELS.has(s.level)
    && causesFor(s).all.some(c => /raised intracranial pressure/i.test(c.name))).map(s => `${s.level}|${s.part}`));
  ok("row 2: every part the pressure reaches names raised pressure among its own causes",
     PRESSURE_REACHES.size > 0 && [...PRESSURE_REACHES].every(k => named.has(k)), [...named].join(", "));
  ok("row 2: no other part names it (the IV joined, pressure-follows round, row 15)",
     [...named].filter(k => !PRESSURE_REACHES.has(k)).length === 0, [...named].join(", ")); }
{ const { ans } = card("weak_abduction@left weak_abduction@right");
  ok("row 1: the card names the bilateral site and the pressure",
     ans?.lines.where === "Bilateral VI — cisternal segment." && ans?.lines.what === "Most likely Raised intracranial pressure (false localising sign) (must not miss). Must not miss: Skull base tumour or nasopharyngeal carcinoma.",
     `${ans?.lines.where} | ${ans?.lines.what}`); }
ok("row 1 guard: a single VI palsy leads with the left VI, and the bilateral site is not offered (the other side is a known normal)",
   ids(solve(T("weak_abduction@left")))[0] === "left_skull_base_vi_cisternal" && !ids(solve(T("weak_abduction@left"))).includes("bilateral_skull_base_vi_cisternal"));
{ const r = solve(T(`weak_depression@left vertical_diplopia@left ${P}`));
  ok("row 2 (pressure-follows round, row 15): a IV palsy + papilloedema leads with the IV nerve; the contralateral nucleus also fits",
     ids(r)[0] === "left_skull_base_trochlear_cisternal" && ids(r).includes("right_midbrain_trochlear"), ids(r).slice(0, 3).join(", ")); }

// ---- B. The uncal reading of the compressive III (rows 5–8, 11) ----
const UNCAL = "reduced_consciousness@none fixed_dilated_pupil@left extensor_posturing@none";
const RED = "A new dilated pupil with a falling conscious level is uncal herniation until proven otherwise — CT head now and call neurosurgery; start lowering the pressure while you wait.";
const CN3_FLAG = "A fixed dilated pupil with a third-nerve palsy is a SURGICAL EMERGENCY — image the vessels (CTA/MRA) for an aneurysm now.";
{ const r = solve(T(UNCAL)), c = r.display[0];
  ok("row 5: coma + a blown L pupil + posturing → the left compressive III, one lesion (R1 #13)",
     c?.site.id === "left_pupil_cn3_compressive" && r.multi === null, `${ids(r)[0]} multi=${!!r.multi}`);
  ok("row 5: …in its uncal reading", c?.site.variant === "uncal", c?.site.variant);
  ok("row 6: the reading leads with uncal herniation", !!c && lead(c.site) === "Uncal herniation", c && lead(c.site)); }
{ const r = solve(T("reduced_consciousness@none fixed_dilated_pupil@left"));
  ok("row 5: coma + a blown L pupil → the left compressive III, one lesion (it read the Adie pupil, routine)",
     ids(r)[0] === "left_pupil_cn3_compressive" && r.multi === null, `${ids(r)[0]} multi=${!!r.multi}`); }
{ const r = solve(T("reduced_consciousness@none fixed_dilated_pupil@left weak_arm@right weak_leg@right babinski@right"));
  ok("row 5: …with a contralateral hemiparesis and Babinski (the peduncle) → still one place",
     ids(r)[0] === "left_pupil_cn3_compressive" && r.multi === null, `${ids(r)[0]} multi=${!!r.multi}`); }
{ const { ans } = card(UNCAL);
  ok("row 8: the Where line names the reading", ans?.lines.where === "Left CN III (compressive) — uncal herniation.", ans?.lines.where);
  ok("row 6: the What line leads with uncal herniation",
     ans?.lines.what === "Most likely Uncal herniation (must not miss). Must not miss: Posterior communicating artery aneurysm.", ans?.lines.what);
  ok("row 6: the Next line stays the site's plan", /^IMMEDIATE neurosurgery/.test(ans?.lines.next || ""), ans?.lines.next);
  // Since the card follows its cause (2026-11-11) the reading's flag lives on its cause, "Uncal herniation", and the red line
  // shows the card's cause's flag and then the place's own, which no longer gives way to the reading's.
  ok("rows 7, 11: the reading's red flag, then the compressive III's own", ans?.lines.red === `${RED} ${CN3_FLAG}`, ans?.lines.red); }
{ const c = solve(T(UNCAL)).display[0];
  ok("row 6: within the reading it reads as common, so the What card's own 'Most likely' line names it first",
     !!c && (causesFor(c.site).all.filter(x => x.likelihood === "common")[0] || {}).name === "Uncal herniation"); }
ok("row 6 guard: the awake III keeps the authored order and likelihood (the aneurysm common, herniation uncommon)",
   (causesFor(SITE.left_pupil_cn3_compressive).all.find(x => x.name === "Uncal herniation") || {}).likelihood === "uncommon"
   && lead(SITE.left_pupil_cn3_compressive) === "Posterior communicating artery aneurysm");
ok("row 5 gate: an awake blown pupil → the Adie pupil still leads", ids(solve(T("fixed_dilated_pupil@left")))[0] === "left_pupil_ciliary_ganglion");
{ const r = solve(T("ptosis@left weak_adduction@left weak_elevation@left weak_depression@left fixed_dilated_pupil@left")), c = r.display[0];
  ok("row 5 gate: an awake pupil-involving III → the compressive III, not the reading, aneurysm first",
     c?.site.id === "left_pupil_cn3_compressive" && !c.site.variant && lead(c.site) === "Posterior communicating artery aneurysm", `${c?.site.id} ${c?.site.variant}`); }
ok("row 5 gate: Weber, awake → the left medial midbrain still leads",
   ids(solve(T("ptosis@left weak_adduction@left weak_elevation@left weak_depression@left weak_arm@right weak_leg@right")))[0] === "left_midbrain_medial");
ok("row 5 gate: coma alone does not list the reading", !solve(T("reduced_consciousness@none")).display.some(c => c.site.variant === "uncal"));
ok("row 5 gate: coma + posturing does not list the reading", ids(solve(T("reduced_consciousness@none extensor_posturing@none"))).join() === "brainstem_aras");
ok("row 5 gate: coma + a weak arm (no III sign) does not offer the reading",
   !solve(T("reduced_consciousness@none weak_arm@left")).display.some(c => c.site.variant === "uncal"));

// ---- C. The false-localising set-aside (rows 3, 9) ----
{ const r = solve(T(`weak_abduction@left weak_abduction@right ${P} weak_arm@right weak_leg@right`));
  ok("row 3: bilateral VI + papilloedema + R hemiparesis → a left hemisphere place, one lesion",
     /^left_(cortex|subcortex)_/.test(ids(r)[0] || "") && r.multi === null, `${ids(r)[0]} multi=${!!r.multi}`);
  ok("row 3: …both VI palsies are set aside", flOf(r).join() === "weak_abduction@left,weak_abduction@right", flOf(r).join()); }
{ const r = solve(T(`weak_abduction@left ${P} weak_arm@left weak_leg@left`));
  ok("row 3: L VI + papilloedema + L hemiparesis → a right hemisphere place, the VI set aside",
     /^right_(cortex|subcortex)_/.test(ids(r)[0] || "") && r.multi === null && flOf(r).join() === "weak_abduction@left", `${ids(r)[0]} ${flOf(r).join()}`); }
ok("row 3 (b): one place explains it all (the pons: L VI + papilloedema + R hemiparesis) → nothing set aside",
   flOf(solve(T(`weak_abduction@left ${P} weak_arm@right weak_leg@right`))).length === 0);
{ const r = solve(T(`weak_abduction@left v1_sensory@left ${P}`));
  ok("row 3 (c): Gradenigo + papilloedema → nothing set aside (no place explains the rest)", flOf(r).length === 0, flOf(r).join()); }
{ const jug = exp("left_skull_base_x_jugular").join(" ");
  const r = solve(T(`weak_abduction@left ${jug} ${P}`));
  ok("row 3 (d): a jugular-foramen picture + VI + papilloedema keeps its claim (papilloedema had moved the rest)",
     jug.length > 0 && flOf(r).length === 0 && r.multi !== null, `${flOf(r).join()} multi=${!!r.multi}`); }
ok("row 3: without papilloedema nothing is set aside",
   flOf(solve(T("weak_abduction@left weak_abduction@right weak_arm@right weak_leg@right"))).length === 0);
{ const { ans } = card(`weak_abduction@left weak_abduction@right ${P} weak_arm@right weak_leg@right`);
  ok("row 9: the Where line names the set-aside palsies",
     (ans?.lines.where || "").endsWith("The sixth-nerve palsies are set aside: with papilloedema they are a false-localising sign of the raised pressure, not further lesions."), ans?.lines.where);
  ok("row 9: the Where line counts without them", /^Left corona radiata\. \d+ other places also fit/.test(ans?.lines.where || ""), ans?.lines.where);
  ok("row 9: the Why line leaves them out",
     ans?.lines.why === "Right arm weakness → anywhere from the cerebral cortex to the spinal cord; see Where for what separates them.", ans?.lines.why); }
ok("row 9: the one-palsy sentence", (ANS.falseLocalisingSentence || (() => ""))(1) === "The sixth-nerve palsy is set aside: with papilloedema it is a false-localising sign of the raised pressure, not a second lesion.");

// ---- D. The pressure-only card (rows 4, 10) ----
const PO = ANS.PRESSURE_ONLY || {};
{ const { ans } = card(P);
  ok("row 4: papilloedema alone → the pressure-only card", ans?.pressureOnly === true);
  ok("row 10: its four lines",
     ans?.lines.where === "Inside the skull — papilloedema means raised intracranial pressure, and on its own it does not say where."
     && ans?.lines.why === "Papilloedema → raised intracranial pressure: it places the problem inside the skull but localises nothing."
     && ans?.lines.what === "Find what is raising the pressure: a mass, hydrocephalus or cerebral venous sinus thrombosis — idiopathic intracranial hypertension only once those are excluded."
     && ans?.lines.next === "Image the head, with venography, before any lumbar puncture; neurosurgery if there is a mass or hydrocephalus.",
     JSON.stringify(ans?.lines));
  ok("row 10: badged urgent, with no red flag line (the banner stays)", ans?.nx.urgency === "urgent" && ans?.lines.red === null);
  ok("row 10: the card's head is the banner's own label", PO.head === "Raised intracranial pressure"); }
ok("row 4: a down-going plantar + papilloedema → the pressure-only card too", card(`plantar_flexor@left ${P}`).ans?.pressureOnly === true);
ok("row 4 guard: papilloedema + a hemiparesis is a place, not the pressure-only card", !card(`${P} weak_arm@right weak_leg@right`).ans?.pressureOnly);
{ // Row 10's last sentence: with rows 1–2 in, no picture reaches it through solve(), so it is pinned with a crafted result.
  const r0 = solve(T(P)), r = { ...r0, pressure: { ...r0.pressure, falseLocalising: { tokens: ["weak_abduction@left"] } } };
  const { ans } = card(`weak_abduction@left ${P}`, r);
  ok("row 10: a set-aside palsy adds its sentence to the pressure-only card",
     ans?.pressureOnly === true && (ans?.lines.where || "").endsWith(" The sixth-nerve palsy is a false-localising sign of the raised pressure, not a second lesion."), ans?.lines.where); }

// ---- E. Unchanged by design (spec §6) ----
const first = toks => ids(solve(T(toks)))[0];
ok("guard: Gradenigo (VI + V1) → the petrous apex", first("weak_abduction@left v1_sensory@left") === "left_skull_base_petrous_apex");
ok("guard: Millard-Gubler → the left medial pons", first("weak_abduction@left facial_weakness@left forehead_involved@left weak_arm@right weak_leg@right") === "left_pons_medial");
ok("guard: Millard-Gubler + papilloedema → the left medial pons", first(`weak_abduction@left facial_weakness@left forehead_involved@left weak_arm@right weak_leg@right ${P}`) === "left_pons_medial");
ok("guard: a complete III, pupil not entered → the ischaemic III", first("ptosis@left weak_adduction@left weak_elevation@left weak_depression@left") === "left_pupil_cn3_ischaemic");
ok("guard: coma alone → the diffuse cerebrum", first("reduced_consciousness@none") === "cerebrum_diffuse");
ok("guard: coma + papilloedema → the diffuse cerebrum", first(`reduced_consciousness@none ${P}`) === "cerebrum_diffuse");
ok("guard: Kernohan's picture (coma + L pupil + L hemiparesis) → unchanged, the right corona radiata",
   first("reduced_consciousness@none fixed_dilated_pupil@left weak_arm@left weak_leg@left") === "right_subcortex_corona_radiata");
{ const r = solve(T("fixed_dilated_pupil@left weak_arm@right weak_leg@right"));
  ok("guard: an awake dilated pupil + contralateral hemiparesis stays two places, without the reading",
     r.multi !== null && !r.display.some(c => c.site.variant === "uncal")); }
ok("guard: papilloedema + R hemiparesis → the left corona radiata", first(`${P} weak_arm@right weak_leg@right`) === "left_subcortex_corona_radiata");
{ const r = solve(T("weak_depression@left weak_depression@right vertical_diplopia@left vertical_diplopia@right"));
  ok("guard: bilateral IV stays the two IV nerves (no bilateral IV site)",
     (r.multi?.sites.map(s => s.id).sort().join() || "") === "left_skull_base_trochlear_cisternal,right_skull_base_trochlear_cisternal"); }

// ---- report ----
console.log(`\nNeuroLocaliser — raised-pressure and herniation round (round 1)\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

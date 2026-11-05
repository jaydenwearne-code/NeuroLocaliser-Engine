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
ok("row 2: PRESSURE_REACHES is the VI's cisternal course and the VI at the petrous apex",
   [...PRESSURE_REACHES].sort().join() === "skull_base|vi_cisternal,skull_base|vi_petrous_apex", [...PRESSURE_REACHES].join());
{ // The cross-check (row 2): the parts outside the skull's levels whose own causes name raised pressure are PRESSURE_REACHES,
  // and the IV's cisternal course, deferred.
  const named = new Set(candidateSites().filter(s => !INTRACRANIAL_LEVELS.has(s.level)
    && causesFor(s).all.some(c => /raised intracranial pressure/i.test(c.name))).map(s => `${s.level}|${s.part}`));
  ok("row 2: every part the pressure reaches names raised pressure among its own causes",
     PRESSURE_REACHES.size > 0 && [...PRESSURE_REACHES].every(k => named.has(k)), [...named].join(", "));
  ok("row 2: every other part that names it is the deferred IV",
     [...named].filter(k => !PRESSURE_REACHES.has(k)).join() === "skull_base|trochlear_cisternal", [...named].join(", ")); }
{ const { ans } = card("weak_abduction@left weak_abduction@right");
  ok("row 1: the card names the bilateral site and the pressure",
     ans?.lines.where === "Bilateral VI — cisternal segment." && ans?.lines.what === "Most likely Raised intracranial pressure (false localising sign) (must not miss). Must not miss: Skull base tumour or nasopharyngeal carcinoma.",
     `${ans?.lines.where} | ${ans?.lines.what}`); }
ok("row 1 guard: a single VI palsy leads with the left VI, and the bilateral site is not offered (the other side is a known normal)",
   ids(solve(T("weak_abduction@left")))[0] === "left_skull_base_vi_cisternal" && !ids(solve(T("weak_abduction@left"))).includes("bilateral_skull_base_vi_cisternal"));
ok("row 2 guard: a IV palsy + papilloedema still leads with the contralateral trochlear nucleus (the IV is deferred)",
   ids(solve(T(`weak_depression@left vertical_diplopia@left ${P}`)))[0] === "right_midbrain_trochlear");

// ---- report ----
console.log(`\nNeuroLocaliser — raised-pressure and herniation round (round 1)\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

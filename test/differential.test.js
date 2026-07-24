// differential.test.js — the broad narrowing differential, now owned by the engine (moved out of app.js).
// Every candidate site COMPATIBLE with the findings so far (predicted ⊇ some observed); ranked by how many
// findings it explains, then tightness, then site.id (phonebook-free tie-break). explainAll = strict superset;
// display = explainAll if any, else the full differential; defaultSite = the site to select by default.
import { solve, differential } from "../src/engine/inverse.js";

let pass = 0, fail = 0;
const ok = (l, c) => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l); };
const ids = list => list.map(c => c.site.id);
const opts = { dominantSide: "left" };

// --- one finding fans out to many candidate sites ---
const one = solve(new Set(["weak_arm@left"]), opts);
ok("one finding → many candidate sites", one.differential.length > 1);
ok("a lone finding is explained by all listed sites (explainAll == differential)",
   one.explainAll.length === one.differential.length);

// --- adding constraints narrows the displayed set (monotone while explainAll stays non-empty) ---
const two = solve(new Set(["weak_arm@left","weak_leg@left"]), opts);
const three = solve(new Set(["weak_arm@left","weak_leg@left","neglect@left"]), opts);
ok("adding weak_leg narrows or holds the display", two.display.length <= one.display.length);
ok("adding the neglect localiser narrows further", three.display.length < two.display.length);
ok("weak_arm + weak_leg + neglect pins the non-dominant MCA", three.display.length === 1
   && three.display[0].site.id === "right_cortex_mca");
ok("defaultSite is the id of display[0]", three.defaultSite === "right_cortex_mca");

// --- explainAll is the strict superset set; empty when a stray finding no site explains is present ---
const stray = solve(new Set(["weak_arm@left","weak_leg@left","facial_weakness@left","forehead_spared@left",
  "neglect@left","cortical_sensory_arm@left","dorsal_sensory@left"]), opts);
ok("a stray unexplained finding empties explainAll", stray.explainAll.length === 0);
ok("with empty explainAll, display falls back to the full differential",
   stray.display.length === stray.differential.length);
ok("defaultSite is still the top of the differential (the near-fit site)",
   stray.defaultSite === "right_cortex_mca");

const clean = solve(new Set(["weak_arm@left","weak_leg@left","facial_weakness@left","forehead_spared@left",
  "neglect@left","cortical_sensory_arm@left"]), opts);
ok("a clean superset populates explainAll", clean.explainAll.length >= 1
   && clean.explainAll.some(c => c.site.id === "right_cortex_mca"));
ok("when explainAll is non-empty, display === explainAll",
   JSON.stringify(ids(clean.display)) === JSON.stringify(ids(clean.explainAll)));

// --- every explainAll entry explains ALL observed findings (n === total) ---
const total = 6;
ok("every explainAll entry has n === total", clean.explainAll.every(c => c.n === total));

// --- differential() is exported and ordering respects (n desc, over asc, site.id asc) at every step ---
const d = differential(new Set(["weak_arm@left","weak_leg@left"]), opts);
let ordered = true;
for (let i = 1; i < d.length; i++) {
  const a = d[i - 1], b = d[i];
  const bad = a.n < b.n
    || (a.n === b.n && a.over > b.over)
    || (a.n === b.n && a.over === b.over && a.site.id.localeCompare(b.site.id) > 0);
  if (bad) { ordered = false; break; }
}
ok("differential is sorted by n desc, over asc, then site.id asc", ordered);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

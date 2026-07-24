// visual-pathway.test.js — the visual pathway as a field-defect-geometry localiser + afferent RAPD.
// Pupil (afferent) fibres leave the pathway at the optic TRACT, so an RAPD accompanies the optic nerve
// and optic tract but NOT the LGN/radiation/occipital — it separates pre- from post-geniculate. The
// chiasm (bitemporal, midline) is the one genuinely new finding + site; the rest reuse HH.
// Run: node test/visual-pathway.test.js
import { CROSSES, NON_LATERALISED, isFinding } from "../src/model/findings.js";
import { LOCALISING } from "../src/engine/score.js";
import { STRUCTURES } from "../src/model/structures.js";
import { expectedFindings } from "../src/engine/forward.js";
import { SITE_BY_ID, composeVisualPathwaySites } from "../src/model/sites.js";
import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }
const producesAt = (level, part, f) => STRUCTURES.some(s => s.level === level && s.part === part && s.produces === f);
const best = set => solve(new Set(set)).best;
const chiasm = () => composeVisualPathwaySites().find(s => s.id === "visual_pathway_chiasm");

// --- 1: vocabulary & policy ---
for (const id of ["bitemporal_hemianopia","rapd","macular_sparing"]) ok(`finding ${id} exists`, isFinding(id));
ok("bitemporal_hemianopia does not cross (midline)", CROSSES.bitemporal_hemianopia === false);
ok("rapd does not cross by default (optic nerve ipsi)", CROSSES.rapd === false);
ok("macular_sparing crosses (contra, like HH)", CROSSES.macular_sparing === true);
for (const id of ["bitemporal_hemianopia","rapd","macular_sparing"]) ok(`${id} IS localising`, LOCALISING.has(id));
for (const id of ["bitemporal_hemianopia","rapd","macular_sparing"]) ok(`${id} is lateralised`, !NON_LATERALISED.has(id));

// --- 2: sites & structures ---
ok("left optic tract site exists", !!SITE_BY_ID.left_visual_pathway_optic_tract);
ok("right LGN site exists", !!SITE_BY_ID.right_visual_pathway_lgn);
ok("chiasm midline site exists", !!chiasm() && chiasm().side === "midline");
ok("optic canal now produces rapd", producesAt("skull_base","optic_canal","rapd"));
ok("occipital now produces macular_sparing", producesAt("cortex","occipital","macular_sparing"));
ok("optic tract produces rapd (afferent)", producesAt("visual_pathway","optic_tract","rapd"));
ok("LGN does NOT produce rapd (post-geniculate for pupils)", !producesAt("visual_pathway","lgn","rapd"));

// --- 3: forward emission ---
{
  ok("chiasm -> bitemporal_hemianopia@midline", expectedFindings(chiasm()).has("bitemporal_hemianopia@midline"));
  const ot = expectedFindings(SITE_BY_ID.left_visual_pathway_optic_tract);
  ok("left optic tract -> homonymous_hemianopia@right (contra)", ot.has("homonymous_hemianopia@right"));
  ok("left optic tract -> rapd@right (contra)", ot.has("rapd@right"));
  const lgn = expectedFindings(SITE_BY_ID.left_visual_pathway_lgn);
  ok("left LGN -> homonymous_hemianopia@right", lgn.has("homonymous_hemianopia@right"));
  ok("left LGN -> NO rapd", !lgn.has("rapd@right") && !lgn.has("rapd@left"));
  const oc = expectedFindings(SITE_BY_ID.left_skull_base_optic_canal);
  ok("left optic canal -> optic_neuropathy@left + rapd@left (ipsi)", oc.has("optic_neuropathy@left") && oc.has("rapd@left"));
  const occ = expectedFindings(SITE_BY_ID.left_cortex_occipital);
  ok("left occipital -> macular_sparing@right (contra)", occ.has("macular_sparing@right"));
}

// --- 4: discriminators emerge (via solve) ---
ok("monocular loss + ipsi RAPD -> optic nerve (optic canal)",
   best(["optic_neuropathy@left","rapd@left"]).site.id === "left_skull_base_optic_canal");
ok("bitemporal hemianopia -> chiasm",
   best(["bitemporal_hemianopia@midline"]).site.id === "visual_pathway_chiasm");
ok("HH + contra RAPD -> optic tract",
   best(["homonymous_hemianopia@right","rapd@right"]).site.id === "left_visual_pathway_optic_tract");
ok("HH + macular sparing -> occipital / PCA",
   ["left_cortex_occipital","left_cortex_pca"].includes(best(["homonymous_hemianopia@right","macular_sparing@right"]).site.id));
{
  const b = best(["homonymous_hemianopia@right"]);
  ok("bare HH -> a retrochiasmal RAPD-negative site (LGN / deep radiation / occipital)",
     ["left_visual_pathway_lgn","left_subcortex_optic_radiation","left_cortex_occipital","left_cortex_pca"].includes(b.site.id));
  ok("bare HH is NOT the optic tract (no RAPD)", b.site.id !== "left_visual_pathway_optic_tract");
}

// --- 5: phonebook ---
ok("chiasm names parasellar / chiasm / bitemporal",
   /chiasm|parasellar|pituitary|bitemporal/i.test(nameForSite(best(["bitemporal_hemianopia@midline"]).site).name));
ok("optic tract names the tract",
   /optic tract|tract/i.test(nameForSite(best(["homonymous_hemianopia@right","rapd@right"]).site).name));

// ---- report ----
console.log("\nNeuroLocaliser — VISUAL PATHWAY + RAPD tests\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);

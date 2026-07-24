// parinaud.test.js — the dorsal-midbrain / pretectal (Parinaud) syndrome. A supranuclear VERTICAL
// gaze palsy (+ convergence-retraction nystagmus, lid retraction) that EMERGES as the union of the
// existing pupillary pretectum site (light-near dissociation → Argyll Robertson) and a new tectal
// vertical-gaze site. Nesting (subset⊆superset), no new solver mechanism.
// Run: node test/parinaud.test.js
import { FINDINGS, CROSSES, NON_LATERALISED, isFinding } from "../src/model/findings.js";
import { LOCALISING } from "../src/engine/score.js";
import { STRUCTURES } from "../src/model/structures.js";
import { SITE_BY_ID, composeDorsalMidbrainSites } from "../src/model/sites.js";
import { expectedFindings } from "../src/engine/forward.js";
import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }

// --- Task 1: vocabulary ---
for (const id of ["vertical_gaze_palsy", "nystagmus_convergence_retraction", "lid_retraction"]) {
  ok(`${id} exists`, isFinding(id));
  ok(`${id} is NON_LATERALISED (@none)`, NON_LATERALISED.has(id));
  ok(`${id} has a CROSSES entry`, id in CROSSES);
}
ok("vertical_gaze_palsy is LOCALISING", LOCALISING.has("vertical_gaze_palsy"));
ok("nystagmus_convergence_retraction is LOCALISING", LOCALISING.has("nystagmus_convergence_retraction"));
ok("lid_retraction is NOT LOCALISING (companion sign)", !LOCALISING.has("lid_retraction"));

// --- Task 2: tectal structures, sites, forward ---
const DM = Object.fromEntries(composeDorsalMidbrainSites().map(s => [s.id, s]));
ok("dorsal_midbrain_tectum site exists", !!DM.dorsal_midbrain_tectum);
ok("parinaud_dorsal_midbrain site exists", !!DM.parinaud_dorsal_midbrain);
ok("tectum site side is bilateral", DM.dorsal_midbrain_tectum && DM.dorsal_midbrain_tectum.side === "bilateral");

// Parinaud site is the UNION: pretectum pupil structure + the three tectal structures.
{
  const s = DM.parinaud_dorsal_midbrain.structures;
  ok("parinaud unions the pretectum pupil structure (ar_lnd)", s.includes("ar_lnd"));
  ok("parinaud includes tect_vgaze", s.includes("tect_vgaze"));
  ok("parinaud includes tect_convret", s.includes("tect_convret"));
  ok("parinaud includes tect_lid", s.includes("tect_lid"));
}

// Forward: tectal site emits the three vertical-gaze findings @none, NOT light-near dissociation.
{
  const t = expectedFindings(DM.dorsal_midbrain_tectum);
  ok("tectum -> vertical_gaze_palsy@none", t.has("vertical_gaze_palsy@none"));
  ok("tectum -> nystagmus_convergence_retraction@none", t.has("nystagmus_convergence_retraction@none"));
  ok("tectum -> lid_retraction@none", t.has("lid_retraction@none"));
  ok("tectum does NOT emit light_near_dissociation", ![...t].some(x => x.startsWith("light_near_dissociation")));
}
// Forward: Parinaud union additionally emits light-near dissociation (lateralised, @left + @right —
// the pupil convention), plus the tectal vertical-gaze findings @none: the full tetrad.
{
  const p = expectedFindings(DM.parinaud_dorsal_midbrain);
  ok("parinaud -> vertical_gaze_palsy@none", p.has("vertical_gaze_palsy@none"));
  ok("parinaud -> light_near_dissociation@left AND @right (bilateral, pupil convention)",
     p.has("light_near_dissociation@left") && p.has("light_near_dissociation@right"));
}

// --- Task 3: emergent naming + inverse emergence (the headline) ---
// Full tetrad -> the single Parinaud union site, named Parinaud. (light_near_dissociation is
// lateralised, so the pupillary component is @left + @right — the pupil convention.)
const TETRAD = [
  "vertical_gaze_palsy@none", "nystagmus_convergence_retraction@none",
  "light_near_dissociation@left", "light_near_dissociation@right", "lid_retraction@none"
];
{
  const { best } = solve(new Set(TETRAD));
  ok("full tetrad -> parinaud_dorsal_midbrain", best && best.site.id === "parinaud_dorsal_midbrain");
  ok("parinaud_dorsal_midbrain names Parinaud", best && /parinaud/i.test(nameForSite(best.site).name));
}
// Isolated vertical gaze palsy (no pupil sign) -> the tectal subset site.
{
  const { best } = solve(new Set(["vertical_gaze_palsy@none", "nystagmus_convergence_retraction@none"]));
  ok("isolated vertical gaze -> dorsal_midbrain_tectum", best && best.site.id === "dorsal_midbrain_tectum");
  ok("dorsal_midbrain_tectum names a dorsal-midbrain vertical gaze palsy",
     best && /vertical gaze|dorsal midbrain/i.test(nameForSite(best.site).name));
}
// REGRESSION: isolated light-near dissociation still -> pupil_pretectum (Argyll Robertson), NOT stolen.
{
  const { best } = solve(new Set(["light_near_dissociation@left", "light_near_dissociation@right"]));
  ok("isolated light-near dissociation -> pupil_pretectum (unchanged)",
     best && best.site.id === "pupil_pretectum");
  ok("pupil_pretectum still names Argyll Robertson",
     best && /argyll/i.test(nameForSite(best.site).name));
}
// PARSIMONY: the full tetrad is ONE lesion, not a two-site (pretectum + tectum) cover.
{
  const { best, minimalSet } = solve(new Set(TETRAD));
  ok("full tetrad resolves to a single site (no multifocal cover needed)",
     best && best.site.id === "parinaud_dorsal_midbrain" && (!minimalSet || minimalSet.length <= 1));
}

console.log("====================================================");
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("====================================================");
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

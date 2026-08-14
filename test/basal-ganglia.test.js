// basal-ganglia.test.js — the basal ganglia region: substantia nigra (parkinsonism), striatum
// (chorea), globus pallidus (dystonia), and the RELOCATED subthalamic nucleus (hemiballismus).
// Adds NO new forward-model mechanism: movement findings are contralateral (above all decussations),
// the bilateral degenerative picture reuses the motor-unit bilateral-site pattern, and the
// hemi-vs-disease naming reuses the nameForSite variant mechanism. `rigidity` completes the tone axis
// (spasticity=UMN / hypotonia=LMN / rigidity=extrapyramidal) but, unlike its multi-level tone-axis
// companions, is confined to substantia_nigra — so the 2026-08-14 LOCALISING audit promoted it,
// consistent with its co-producers bradykinesia/rest_tremor.
// Run: node test/basal-ganglia.test.js
import { FINDINGS, CROSSES, NON_LATERALISED, isFinding } from "../src/model/findings.js";
import { LOCALISING } from "../src/engine/score.js";
import { STRUCTURES } from "../src/model/structures.js";
import { SITE_BY_ID, composeBasalGangliaBilateralSites } from "../src/model/sites.js";
import { expectedFindings } from "../src/engine/forward.js";
import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// --- Task 1: vocabulary ---
for (const id of ["bradykinesia", "rest_tremor", "chorea", "dystonia", "rigidity"])
  ok(`${id} exists`, isFinding(id));
ok("bradykinesia crosses (contra)", CROSSES.bradykinesia === true);
ok("rest_tremor crosses (contra)", CROSSES.rest_tremor === true);
ok("chorea crosses (contra)", CROSSES.chorea === true);
ok("dystonia crosses (contra)", CROSSES.dystonia === true);
ok("rigidity crosses (contra)", CROSSES.rigidity === true);
for (const id of ["bradykinesia", "rest_tremor", "chorea", "dystonia", "rigidity"])
  ok(`${id} is NOT non-lateralised`, !NON_LATERALISED.has(id));
ok("bradykinesia + rest_tremor are LOCALISING", LOCALISING.has("bradykinesia") && LOCALISING.has("rest_tremor"));
ok("chorea is LOCALISING", LOCALISING.has("chorea"));
ok("dystonia is LOCALISING", LOCALISING.has("dystonia"));
ok("rigidity IS localising (2026-08-14 audit — confined to substantia_nigra, like its bradykinesia/rest_tremor co-producers; unlike spasticity/hypotonia it is not a multi-level tone-axis companion)",
   LOCALISING.has("rigidity"));
ok("tone axis is complete: spasticity + hypotonia + rigidity all exist",
   isFinding("spasticity") && isFinding("hypotonia") && isFinding("rigidity"));

// --- Task 2: structures (one structure = one finding) ---
const bgOf = (part) => STRUCTURES.filter(s => s.level === "basal_ganglia" && s.part === part)
  .map(s => s.produces).sort();
ok("substantia_nigra -> bradykinesia + rest_tremor + rigidity", eq(bgOf("substantia_nigra"), ["bradykinesia", "rest_tremor", "rigidity"]));
ok("striatum -> chorea", eq(bgOf("striatum"), ["chorea"]));
ok("globus_pallidus -> dystonia", eq(bgOf("globus_pallidus"), ["dystonia"]));
ok("subthalamic -> hemiballismus (relocated to basal_ganglia)", eq(bgOf("subthalamic"), ["hemiballismus"]));
ok("no basal_ganglia structure sets a crosses override (inherits findings.CROSSES)",
   STRUCTURES.filter(s => s.level === "basal_ganglia")
     .every(s => !Object.prototype.hasOwnProperty.call(s, "crosses")));
ok("stn no longer lives in subcortex",
   !STRUCTURES.some(s => s.level === "subcortex" && s.part === "subthalamic"));

// --- Task 3: focal (left/right) sites, contralateral emission ---
ok("left_basal_ganglia_substantia_nigra exists", !!SITE_BY_ID.left_basal_ganglia_substantia_nigra);
ok("right_basal_ganglia_striatum exists", !!SITE_BY_ID.right_basal_ganglia_striatum);
ok("left_basal_ganglia_globus_pallidus exists", !!SITE_BY_ID.left_basal_ganglia_globus_pallidus);
ok("left_basal_ganglia_subthalamic exists (STN relocated)", !!SITE_BY_ID.left_basal_ganglia_subthalamic);
ok("left_subcortex_subthalamic no longer exists", !SITE_BY_ID.left_subcortex_subthalamic);
{
  const nigra = expectedFindings(SITE_BY_ID.left_basal_ganglia_substantia_nigra);
  ok("left nigra -> bradykinesia@right + rest_tremor@right (contra)", nigra.has("bradykinesia@right") && nigra.has("rest_tremor@right"));
  ok("left nigra -> rigidity@right (contra)", nigra.has("rigidity@right"));
  const striatum = expectedFindings(SITE_BY_ID.left_basal_ganglia_striatum);
  ok("left striatum -> chorea@right (contra)", striatum.has("chorea@right"));
  const gp = expectedFindings(SITE_BY_ID.left_basal_ganglia_globus_pallidus);
  ok("left globus pallidus -> dystonia@right (contra)", gp.has("dystonia@right"));
  const stn = expectedFindings(SITE_BY_ID.left_basal_ganglia_subthalamic);
  ok("left subthalamic -> hemiballismus@right (contra)", stn.has("hemiballismus@right"));
}

// --- Task 4: bilateral (degenerative) sites — emit @left AND @right, never @bilateral ---
// Composite sites are only in candidateSites(), not SITE_BY_ID — look them up via the composer.
const BG_BILAT = Object.fromEntries(composeBasalGangliaBilateralSites().map(s => [s.id, s]));
ok("bilateral site basal_ganglia_substantia_nigra exists", !!BG_BILAT.basal_ganglia_substantia_nigra);
ok("bilateral nigra site is side=bilateral",
   BG_BILAT.basal_ganglia_substantia_nigra && BG_BILAT.basal_ganglia_substantia_nigra.side === "bilateral");
ok("bilateral site basal_ganglia_striatum exists", !!BG_BILAT.basal_ganglia_striatum);
ok("bilateral site basal_ganglia_globus_pallidus exists", !!BG_BILAT.basal_ganglia_globus_pallidus);
ok("NO bilateral subthalamic site (STN excluded from the composer)",
   !BG_BILAT.basal_ganglia_subthalamic);
{
  const nigra = expectedFindings(BG_BILAT.basal_ganglia_substantia_nigra);
  ok("bilateral nigra -> bradykinesia@left AND @right",
     nigra.has("bradykinesia@left") && nigra.has("bradykinesia@right"));
  ok("bilateral nigra -> rigidity@left AND @right",
     nigra.has("rigidity@left") && nigra.has("rigidity@right"));
  ok("bilateral nigra emits NO @bilateral token", !nigra.has("bradykinesia@bilateral"));
  const striatum = expectedFindings(BG_BILAT.basal_ganglia_striatum);
  ok("bilateral striatum -> chorea@left AND @right",
     striatum.has("chorea@left") && striatum.has("chorea@right"));
}

// --- Task 5: inverse emergence + naming ---
const bilat = (...ids) => new Set(ids.flatMap(f => [`${f}@left`, `${f}@right`]));

// focal (structural) hemi-syndromes -> the left/right nucleus site
{
  const { best } = solve(new Set(["bradykinesia@right", "rest_tremor@right", "rigidity@right"]));
  ok("contra bradykinesia+rest_tremor+rigidity -> left_basal_ganglia_substantia_nigra",
     best && best.site.id === "left_basal_ganglia_substantia_nigra");
  ok("focal nigra names hemiparkinsonism", best && /hemiparkinson/i.test(nameForSite(best.site).name));
}
{
  const { best } = solve(new Set(["chorea@right"]));
  ok("contra chorea -> left_basal_ganglia_striatum",
     best && best.site.id === "left_basal_ganglia_striatum");
  ok("focal striatum names hemichorea", best && /hemichorea/i.test(nameForSite(best.site).name));
}
{
  const { best } = solve(new Set(["dystonia@right"]));
  ok("contra dystonia -> left_basal_ganglia_globus_pallidus",
     best && best.site.id === "left_basal_ganglia_globus_pallidus");
  ok("globus pallidus names dystonia", best && /dystonia/i.test(nameForSite(best.site).name));
}
{
  const { best } = solve(new Set(["hemiballismus@right"]));
  ok("hemiballismus -> left_basal_ganglia_subthalamic (relocated)",
     best && best.site.id === "left_basal_ganglia_subthalamic");
  ok("subthalamic still names hemiballismus", best && /hemiballism/i.test(nameForSite(best.site).name));
}

// bilateral (degenerative) diseases -> the bilateral composite site, named the disease
{
  const { best } = solve(bilat("bradykinesia", "rest_tremor", "rigidity"));
  ok("bilateral parkinsonism -> basal_ganglia_substantia_nigra (composite)",
     best && best.site.id === "basal_ganglia_substantia_nigra");
  ok("bilateral nigra names Parkinsonism/PD",
     best && /parkinson/i.test(nameForSite(best.site, { dominantSide: "left" }).name));
}
{
  const { best } = solve(bilat("chorea"));
  ok("bilateral chorea -> basal_ganglia_striatum (composite)",
     best && best.site.id === "basal_ganglia_striatum");
  ok("bilateral striatum names chorea/Huntington's",
     best && /chorea|huntington/i.test(nameForSite(best.site).name));
}

// ---- report ----
console.log("\nNeuroLocaliser — BASAL GANGLIA tests\n" + "=".repeat(52));
for (const { label, ok: good } of log) console.log(`${good ? "PASS" : "FAIL"}  ${label}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

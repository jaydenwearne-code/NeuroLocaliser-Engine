// subcortex.test.js — the subcortex region: internal capsule, thalamus,
// optic radiation. The teaching point is the CORTICAL-vs-SUBCORTICAL distinction: deep long-tract
// signs with NO cortical signs. This region adds NO new forward-model mechanism — pure anatomy
// tables + one composer (composeDeepVascularSites, sibling of composeVascularCortexSites).
// Run: node test/subcortex.test.js
import { FINDINGS, CROSSES, NON_LATERALISED, isFinding } from "../src/model/findings.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }

// --- Task 1: vocabulary (2 new findings; the rest are reused) ---
ok("thalamic_pain exists", isFinding("thalamic_pain"));
ok("thalamic_pain crosses (contra)", CROSSES.thalamic_pain === true);
ok("thalamic_pain is NOT non-lateralised", !NON_LATERALISED.has("thalamic_pain"));
// reused findings — the capsule/thalamus/radiation do NOT invent new tokens (Approach A)
for (const id of ["weak_arm","weak_leg","facial_weakness","forehead_spared","dorsal_sensory","spinothalamic","homonymous_hemianopia"])
  ok(`reused finding ${id} still exists`, isFinding(id));

// --- Task 2: structure catalogue ---
import { STRUCTURES, STRUCTURE_BY_ID } from "../src/model/structures.js";
const subOf = part => STRUCTURES.filter(s => s.level === "subcortex" && s.part === part).map(s => s.produces).sort();
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// the capsule now also carries the UMN release signs (Babinski + Hoffmann) — the reflexes increment; a
// capsular lacune is UMN, so this is clinically correct and keeps the pure-motor picture an exact match.
ok("internal_capsule -> face+arm+leg (dense hemiparesis) + Babinski + Hoffmann + spasticity",
   eq(subOf("internal_capsule"), ["babinski","facial_weakness","forehead_spared","hoffmann","spasticity","weak_arm","weak_leg"].sort()));
ok("thalamus -> dorsal+spinothalamic+thalamic_pain",
   eq(subOf("thalamus"), ["dorsal_sensory","spinothalamic","thalamic_pain"].sort()));
ok("optic_radiation -> homonymous_hemianopia", eq(subOf("optic_radiation"), ["homonymous_hemianopia"]));
// Approach A invariant: no bespoke dense-hemiparesis token; reuse the somatotopic findings.
ok("no dense_hemiparesis finding invented", !isFinding("dense_hemiparesis"));
// subcortex structures carry NO crosses override and NO cortical gates
{
  const subStructs = STRUCTURES.filter(s => s.level === "subcortex");
  ok("no subcortex structure sets a crosses override",
     subStructs.every(s => !Object.prototype.hasOwnProperty.call(s, "crosses")));
  ok("no subcortex structure is hemisphere/bilateral gated",
     subStructs.every(s => !s.hemisphere && !s.bilateralOnly));
}

// --- Task 3: primitive sites + deep vascular annotation ---
import { SITE_BY_ID, DEEP_TERRITORY } from "../src/model/sites.js";
ok("left_subcortex_internal_capsule exists", !!SITE_BY_ID.left_subcortex_internal_capsule);
ok("right_subcortex_thalamus exists", !!SITE_BY_ID.right_subcortex_thalamus);
ok("left_subcortex_optic_radiation exists", !!SITE_BY_ID.left_subcortex_optic_radiation);
ok("internal capsule has a lenticulostriate territory",
   /lenticulostriate/i.test(SITE_BY_ID.left_subcortex_internal_capsule.territory || ""));
ok("DEEP_TERRITORY maps internal_capsule to lenticulostriate",
   DEEP_TERRITORY.internal_capsule && /lenticulostriate/i.test(DEEP_TERRITORY.internal_capsule.territory));
ok("DEEP_TERRITORY maps optic_radiation to anterior choroidal",
   DEEP_TERRITORY.optic_radiation && /choroidal/i.test(DEEP_TERRITORY.optic_radiation.territory));

// --- Task 4: forward model — everything contralateral, no new mechanism ---
import { expectedFindings } from "../src/engine/forward.js";
{
  const ic = expectedFindings(SITE_BY_ID.left_subcortex_internal_capsule);
  ok("left capsule -> weak_arm@right (contra)", ic.has("weak_arm@right"));
  ok("left capsule -> weak_leg@right (contra)", ic.has("weak_leg@right"));
  ok("left capsule -> facial_weakness@right + forehead_spared@right (contra UMN)", ic.has("facial_weakness@right") && ic.has("forehead_spared@right"));
  ok("left capsule emits NO cortical signs", !ic.has("aphasia_expressive@none") && !ic.has("neglect@right"));
}
{
  const th = expectedFindings(SITE_BY_ID.left_subcortex_thalamus);
  ok("left thalamus -> dorsal_sensory@right (contra)", th.has("dorsal_sensory@right"));
  ok("left thalamus -> spinothalamic@right (contra)", th.has("spinothalamic@right"));
  ok("left thalamus -> thalamic_pain@right (contra)", th.has("thalamic_pain@right"));
  const orad = expectedFindings(SITE_BY_ID.left_subcortex_optic_radiation);
  ok("left optic radiation -> homonymous_hemianopia@right (contra)", orad.has("homonymous_hemianopia@right"));
}

// --- Task 5: deep vascular composers ---
import { composeDeepVascularSites } from "../src/model/sites.js";
{
  const deep = composeDeepVascularSites();
  const byId = Object.fromEntries(deep.map(s => [s.id, s]));
  ok("left_subcortex_sensorimotor composite exists", !!byId.left_subcortex_sensorimotor);
  ok("left_subcortex_anterior_choroidal composite exists", !!byId.left_subcortex_anterior_choroidal);
  ok("sensorimotor unions capsule + thalamus structures",
     byId.left_subcortex_sensorimotor.structures.some(id => STRUCTURE_BY_ID[id].part === "internal_capsule") &&
     byId.left_subcortex_sensorimotor.structures.some(id => STRUCTURE_BY_ID[id].part === "thalamus"));
  ok("sensorimotor does NOT include the optic radiation",
     !byId.left_subcortex_sensorimotor.structures.some(id => STRUCTURE_BY_ID[id].part === "optic_radiation"));
  ok("anterior choroidal adds the optic radiation",
     byId.left_subcortex_anterior_choroidal.structures.some(id => STRUCTURE_BY_ID[id].part === "optic_radiation"));
}

// --- Task 6: emergent syndromes (same scorer, no rules) ---
import { solve } from "../src/engine/inverse.js";

// THE HEADLINE: pure motor lacune. Face+arm+leg + the UMN release signs (a capsular lacune is UMN,
// so also spastic), nothing cortical -> the compact capsule, which beats any cortical explanation by parsimony.
{
  const { best } = solve(new Set(["weak_arm@right","weak_leg@right","facial_weakness@right","forehead_spared@right","babinski@right","hoffmann@right","spasticity@right"]));
  ok("pure motor -> left_subcortex_internal_capsule", best && best.site.id === "left_subcortex_internal_capsule");
  ok("pure motor beats every cortex site", best && best.site.level === "subcortex");
  ok("pure motor over-predicts nothing", best && best.missedByPatient.length === 0);
}
// Cortical-vs-subcortical: add CORTICAL signs (Broca aphasia + a cortical gaze deviation) and it must
// flip OFF the capsule to cortex. NB gaze_deviation is the cortical discriminator here — aphasia ALONE is
// no longer unambiguously cortical now that striatocapsular (subcortical) aphasia is modelled.
{
  const { best } = solve(new Set(["weak_arm@right","facial_weakness@right","forehead_spared@right","speech_nonfluent@none","gaze_deviation@left"]));
  ok("adding cortical signs flips to a cortex site", best && best.site.level === "cortex");
  ok("...specifically the dominant MCA superior division", best && best.site.id === "left_cortex_mca_superior");
}
// Pure sensory: both body modalities, same side, no motor. This is the medial-lemniscus +
// spinothalamic CONVERGENCE, which the VPL thalamus shares with the lateral (lemniscal/spinothalamic)
// midbrain tegmentum — a genuine ddx the engine SURFACES rather than hides. It must not be a cord or
// cortical pattern, and the thalamus must be a leading deep candidate; thalamic_pain (below) is what
// uniquely pins it to the thalamus (Déjerine–Roussy).
{
  const { best, single } = solve(new Set(["dorsal_sensory@right","spinothalamic@right"]));
  ok("pure sensory is an ML+STT convergence (VPL thalamus or lateral midbrain tegmentum)",
     best && (best.site.id === "left_subcortex_thalamus"
       || (best.site.level === "midbrain" && best.site.part === "lateral")));
  ok("pure sensory does NOT localise to the cord", best && best.site.level !== "cord");
  ok("pure sensory does NOT localise to the cortex", best && best.site.level !== "cortex");
  ok("VPL thalamus is a ranked candidate for pure sensory loss",
     single.some(r => r.site.id === "left_subcortex_thalamus"));
}
// Déjerine–Roussy: the same thalamus site, now with central pain — an exact match.
{
  const res = solve(new Set(["dorsal_sensory@right","spinothalamic@right","thalamic_pain@right"]));
  ok("thalamic pain -> left_subcortex_thalamus (exact)", res.best && res.best.site.id === "left_subcortex_thalamus");
  ok("Déjerine–Roussy over-predicts nothing", res.best && res.best.missedByPatient.length === 0);
}
// Sensorimotor lacune: weakness AND hemisensory loss, no cortical signs -> the composite,
// outranking capsule-alone and thalamus-alone.
{
  const { best } = solve(new Set(["weak_arm@right","weak_leg@right","facial_weakness@right","forehead_spared@right",
    "dorsal_sensory@right","spinothalamic@right"]));
  ok("sensorimotor lacune -> left_subcortex_sensorimotor", best && best.site.id === "left_subcortex_sensorimotor");
}
// Anterior choroidal triad: hemiplegia + hemianaesthesia + hemianopia from one small vessel.
{
  const res = solve(new Set(["weak_arm@right","weak_leg@right","facial_weakness@right","forehead_spared@right",
    "dorsal_sensory@right","spinothalamic@right","homonymous_hemianopia@right"]));
  ok("anterior choroidal triad -> left_subcortex_anterior_choroidal",
     res.best && res.best.site.id === "left_subcortex_anterior_choroidal");
}

// --- Task 7: the optic-radiation tie (decision: accept + relax) ---
// An isolated homonymous hemianopia genuinely cannot be told apart by field defect alone: occipital
// (PCA) cortex and the deep optic radiation tie. Occipital wins `best` by build order (subcortex is
// built AFTER cortex), but the deep radiation must appear as a co-equal top candidate.
{
  const { single, best } = solve(new Set(["homonymous_hemianopia@right"]));
  ok("isolated (RAPD-negative) hemianopia resolves to a retrochiasmal site (deep radiation / LGN / occipital)",
     best && ["left_subcortex_optic_radiation","left_visual_pathway_lgn","left_cortex_occipital","left_cortex_pca"].includes(best.site.id));
  const orad = single.find(r => r.site.id === "left_subcortex_optic_radiation");
  ok("deep optic radiation is a ranked candidate", !!orad);
  ok("deep optic radiation ties the top score", orad && orad.score === single[0].score);
}

// --- Task 8: laterality mirror ---
// Pure motor hemiparesis (face+arm+leg, no other signs) is the classic LACUNAR SYNDROME — not precisely
// localisable without imaging: internal capsule, corona radiata, and basis pontis are all recognised
// pure-motor lacune sites and are clinically indistinguishable from this pattern alone. Any of them (on the
// RIGHT, for left-sided weakness) is correct; the cortical MCA is excluded here (no neglect/sensory company).
{
  const { best } = solve(new Set(["weak_arm@left","weak_leg@left","facial_weakness@left","forehead_spared@left"]));
  ok("left-sided pure motor -> a right-sided pure-motor lacune site (capsule / corona radiata / basis pontis)",
     best && ["right_subcortex_internal_capsule","right_subcortex_corona_radiata","right_pons_basis_pontis"].includes(best.site.id));
}

// --- Task 9: phonebook (keyed by emergent site id) ---
import { nameForSite } from "../src/data/syndromes.js";
{
  const capsule = nameForSite(SITE_BY_ID.left_subcortex_internal_capsule);
  ok("capsule names a pure motor lacune", /pure motor|lacun/i.test(capsule.name));
  const thal = solve(new Set(["dorsal_sensory@right","spinothalamic@right","thalamic_pain@right"])).best;
  ok("thalamus names a sensory lacune / Déjerine–Roussy",
     /sensory|roussy|d[eé]jerine/i.test(nameForSite(thal.site).name));
  const achor = solve(new Set(["weak_arm@right","weak_leg@right","facial_weakness@right","forehead_spared@right",
    "dorsal_sensory@right","spinothalamic@right","homonymous_hemianopia@right"])).best;
  ok("anterior choroidal composite names the artery", /choroidal/i.test(nameForSite(achor.site).name));
}

// ---- report ----
console.log("\nNeuroLocaliser — SUBCORTEX tests\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);

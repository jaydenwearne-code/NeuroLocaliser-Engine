// nystagmus.test.js — the multi-source directional nystagmus taxonomy. Nystagmus TYPE localises:
// peripheral (labyrinth / inner ear), gaze-evoked (cerebellum flocculonodular + brainstem vestibular
// nuclei — shared central), downbeat (craniocervical junction), upbeat (pontomesencephalic tegmentum),
// INO (MLF, pre-existing). All typed findings are NON_LATERALISED (@none) + LOCALISING.
// Run: node test/nystagmus.test.js
import { FINDINGS, CROSSES, NON_LATERALISED, isFinding } from "../src/model/findings.js";
import { LOCALISING } from "../src/engine/score.js";
import { STRUCTURES } from "../src/model/structures.js";
import { SITE_BY_ID, composeCentralNystagmusSites } from "../src/model/sites.js";
import { expectedFindings } from "../src/engine/forward.js";
import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// --- Task 1: taxonomy vocabulary ---
const TYPES = ["nystagmus_peripheral", "nystagmus_gaze_evoked", "nystagmus_downbeat", "nystagmus_upbeat"];
for (const id of TYPES) {
  ok(`${id} exists`, isFinding(id));
  ok(`${id} is NON_LATERALISED (@none)`, NON_LATERALISED.has(id));
  ok(`${id} is LOCALISING`, LOCALISING.has(id));
}
ok("generic `nystagmus` is GONE", !isFinding("nystagmus"));
ok("generic `nystagmus` not in NON_LATERALISED", !NON_LATERALISED.has("nystagmus"));
ok("generic `nystagmus` not in LOCALISING", !LOCALISING.has("nystagmus"));
ok("cn8_vertigo still LOCALISING + crosses:false",
   LOCALISING.has("cn8_vertigo") && CROSSES.cn8_vertigo === false);
ok("ino unchanged (exists + LOCALISING)", isFinding("ino") && LOCALISING.has("ino"));

// --- Task 2: central vestibular nuclei emit the shared gaze-evoked type ---
{
  const wall = expectedFindings(SITE_BY_ID.left_medulla_lateral);
  ok("lateral medulla (Wallenberg) -> nystagmus_gaze_evoked@none", wall.has("nystagmus_gaze_evoked@none"));
  ok("lateral medulla still -> cn8_vertigo@left", wall.has("cn8_vertigo@left"));
  const lp = expectedFindings(SITE_BY_ID.left_pons_lateral);
  ok("lateral pons -> nystagmus_gaze_evoked@none", lp.has("nystagmus_gaze_evoked@none"));
}
// isolated gaze-evoked -> lean cerebellar flocculonodular, NOT the over-predicting nucleus clusters
{
  const { best } = solve(new Set(["nystagmus_gaze_evoked@none"]));
  ok("isolated gaze-evoked -> cerebellum_flocculonodular (lean site wins)",
     best && best.site.id === "cerebellum_flocculonodular");
}
// Wallenberg WITH the nystagmus still -> lateral medulla (shared by company)
{
  const { best } = solve(new Set(["face_pain_loss@left", "spinothalamic@right", "miosis@left","ptosis@left",
    "palatal_weakness@left", "vocal_cord_palsy@left", "dysphagia@left", "cn8_vertigo@left", "limb_ataxia@left", "nystagmus_gaze_evoked@none"]));
  ok("Wallenberg + gaze-evoked -> left_medulla_lateral", best && best.site.id === "left_medulla_lateral");
}

// --- Task 3: peripheral vestibular (labyrinth) site ---
ok("left_peripheral_vestibular_labyrinth exists", !!SITE_BY_ID.left_peripheral_vestibular_labyrinth);
{
  const lab = expectedFindings(SITE_BY_ID.left_peripheral_vestibular_labyrinth);
  ok("left labyrinth -> nystagmus_peripheral@none", lab.has("nystagmus_peripheral@none"));
  ok("left labyrinth -> cn8_vertigo@left (ipsi)", lab.has("cn8_vertigo@left"));
  ok("left labyrinth emits NO hearing_loss (vestibular neuritis, not labyrinthitis)",
     ![...lab].some(t => t.startsWith("hearing_loss")));
}

// --- Task 4: central directional generators (downbeat CVJ, upbeat pontomesencephalic) ---
const CN = Object.fromEntries(composeCentralNystagmusSites().map(s => [s.id, s]));
ok("craniocervical_junction_foramen_magnum exists (midline)",
   CN.craniocervical_junction_foramen_magnum && CN.craniocervical_junction_foramen_magnum.side === "midline");
ok("pontomesencephalic_tegmentum exists (midline)",
   CN.pontomesencephalic_tegmentum && CN.pontomesencephalic_tegmentum.side === "midline");
{
  const cvj = expectedFindings(CN.craniocervical_junction_foramen_magnum);
  ok("CVJ -> nystagmus_downbeat@none", cvj.has("nystagmus_downbeat@none"));
  const pm = expectedFindings(CN.pontomesencephalic_tegmentum);
  ok("pontomesencephalic -> nystagmus_upbeat@none", pm.has("nystagmus_upbeat@none"));
}

// --- Task 5: inverse emergence + naming + peripheral-vs-central discrimination ---
{
  const { best } = solve(new Set(["nystagmus_peripheral@none", "cn8_vertigo@left"]));
  ok("peripheral nystagmus + vertigo -> left_peripheral_vestibular_labyrinth",
     best && best.site.id === "left_peripheral_vestibular_labyrinth");
  ok("labyrinth names a peripheral vestibular syndrome",
     best && /peripheral vestibular/i.test(nameForSite(best.site).name));
}
{
  const { best } = solve(new Set(["nystagmus_downbeat@none"]));
  ok("downbeat -> craniocervical_junction_foramen_magnum",
     best && best.site.id === "craniocervical_junction_foramen_magnum");
  ok("downbeat names a craniocervical junction syndrome",
     best && /downbeat/i.test(nameForSite(best.site).name));
}
{
  const { best } = solve(new Set(["nystagmus_upbeat@none"]));
  ok("upbeat -> pontomesencephalic_tegmentum",
     best && best.site.id === "pontomesencephalic_tegmentum");
  ok("upbeat names a pontomesencephalic syndrome",
     best && /upbeat/i.test(nameForSite(best.site).name));
}
// isolated cn8_vertigo prefers the peripheral labyrinth over the central nucleus clusters
{
  const { best } = solve(new Set(["cn8_vertigo@left"]));
  ok("isolated vertigo -> peripheral labyrinth (fewer over-predictions)",
     best && best.site.id === "left_peripheral_vestibular_labyrinth");
}

// ---- report ----
console.log("\nNeuroLocaliser — NYSTAGMUS tests\n" + "=".repeat(52));
for (const { label, ok: good } of log) console.log(`${good ? "PASS" : "FAIL"}  ${label}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

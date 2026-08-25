// trigeminal.test.js — the pontine trigeminal complex. Main sensory nucleus -> facial TOUCH (pons);
// motor nucleus -> jaw weakness (V3). Dissociation: touch=pons, pain/temp=medulla (spinal nucleus). The
// complex is its own site AND unions into the lateral pontine (Marie-Foix/AICA) syndrome.
// Run: node test/trigeminal.test.js
import { CROSSES, NON_LATERALISED, isFinding } from "../src/model/findings.js";
import { LOCALISING } from "../src/engine/score.js";
import { SITE_BY_ID, SITES, composeLateralPontineTrigeminalSites } from "../src/model/sites.js";
import { STRUCTURES } from "../src/model/structures.js";
import { expectedFindings } from "../src/engine/forward.js";
import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }

// Vocabulary
for (const id of ["face_touch_loss", "jaw_weakness"]) {
  ok(`${id} exists`, isFinding(id));
  ok(`${id} is ipsilateral (CROSSES false)`, CROSSES[id] === false);
  ok(`${id} is LOCALISING`, LOCALISING.has(id));
  ok(`${id} is NOT non-lateralised`, !NON_LATERALISED.has(id));
}

// Forward dissociation: touch=pons, pain/temp=medulla
{
  const t = expectedFindings(SITE_BY_ID.left_pons_trigeminal);
  ok("left_pons_trigeminal -> face_touch_loss@left + jaw_weakness@left",
     t.has("face_touch_loss@left") && t.has("jaw_weakness@left"));
  ok("left_pons_trigeminal does NOT emit face_pain_loss (that's medullary)",
     !t.has("face_pain_loss@left"));
  const m = expectedFindings(SITE_BY_ID.left_medulla_lateral);
  ok("medulla still -> face_pain_loss@left (spinal nucleus)", m.has("face_pain_loss@left"));
}

// Isolated trigeminal complex
{
  const { best } = solve(new Set(["face_touch_loss@left", "jaw_weakness@left"]));
  ok("isolated trigeminal -> left_pons_trigeminal", best && best.site.id === "left_pons_trigeminal");
  ok("pons_trigeminal names the trigeminal complex",
     best && /trigeminal/i.test(nameForSite(best.site).name));
}

// Union with the lateral pons (Marie-Foix + trigeminal), left lesion
{
  const { best } = solve(new Set([
    "spinothalamic@right", "limb_ataxia@left", "cn8_vertigo@left",
    "face_touch_loss@left", "jaw_weakness@left"
  ]));
  ok("lateral pons + trigeminal -> left_pons_lateral_trigeminal",
     best && best.site.id === "left_pons_lateral_trigeminal");
  ok("union names Marie-Foix with trigeminal",
     best && /trigeminal/i.test(nameForSite(best.site).name));
}

// ---- THE TRIGEMINAL LEMNISCUS IN THE MIDBRAIN (added 2026-08-25, owner's ruling) ----
// The model recorded the trigeminal nuclei (pons, medulla) and their thalamic target (VPM) but NOTHING in
// between, so the pathway jumped pons -> thalamus. Last's 9th ed p.613: the medial lemniscus "is joined by
// the trigeminal lemniscus" on its way up through pons and midbrain. It goes on the LATERAL midbrain,
// where ml_midbrain and stt_midbrain already run, rather than on a new part — the lemnisci travel
// together, which is the whole reason a lateral midbrain lesion takes out face and body sensation at once.
{
  const S = STRUCTURES.find(s => s.id === "tl_midbrain");
  ok("the trigeminal lemniscus is modelled in the midbrain", !!S);
  ok("...on the LATERAL part, with the other two lemnisci",
     S && S.level === "midbrain" && S.part === "lateral");
  ok("...carrying all facial modalities above the nuclei", S && S.produces === "face_sensory_loss");

  // ABOVE the nuclei the pathway is crossed, so the deficit is CONTRALATERAL — unlike the spinal
  // trigeminal nucleus in the medulla, which gives the ipsilateral face of Wallenberg.
  const exp = expectedFindings(SITES.find(s => s.id === "left_midbrain_lateral"));
  ok("a LEFT lateral midbrain lesion gives RIGHT-sided facial sensory loss",
     [...exp].includes("face_sensory_loss@right"), [...exp].filter(t => /face/.test(t)).join(", "));

  // and it now localises: the finding must reach the midbrain
  const r = solve(new Set(["face_sensory_loss@right", "spinothalamic@right"]), {});
  ok("right face + right body sensory loss reaches the lateral midbrain",
     r.differential.some(c => c.site.id === "left_midbrain_lateral"),
     r.differential.slice(0, 4).map(c => c.site.id).join(", "));
}

console.log("====================================================");
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("====================================================");
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

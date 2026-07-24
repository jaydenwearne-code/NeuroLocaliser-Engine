// lobes.test.js — parietal / temporal / occipital completeness (the audit-and-fill applied to the other
// lobes, after the frontal one). Parietal: ideomotor (dominant) + dressing (non-dominant) apraxia.
// Temporal: cortical deafness + Kluver-Bucy (both bilateral). Ventral occipitotemporal (fusiform) "what"
// stream: visual agnosia + achromatopsia (bilateral), prosopagnosia (non-dominant, relocated here),
// alexia without agraphia (dominant — the visual word form area).
// Run: node test/lobes.test.js
import { CROSSES, NON_LATERALISED, isFinding } from "../src/model/findings.js";
import { LOCALISING } from "../src/engine/score.js";
import { STRUCTURE_BY_ID } from "../src/model/structures.js";
import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0; const log = [];
function ok(l, c) { log.push({ l, ok: !!c }); c ? pass++ : fail++; }
const B = f => solve(new Set([f])).best;
const nameB = b => (b ? nameForSite(b.site, { dominantSide: "left" }).name : "");

// Vocabulary
for (const id of ["ideomotor_apraxia", "dressing_apraxia", "cortical_deafness", "kluver_bucy",
                  "visual_agnosia", "achromatopsia", "alexia_without_agraphia"]) {
  ok(`${id} exists`, isFinding(id));
  ok(`${id} @none`, NON_LATERALISED.has(id));
  ok(`${id} CROSSES false`, CROSSES[id] === false);
  ok(`${id} LOCALISING`, LOCALISING.has(id));
}

// PARIETAL apraxias (dominant / non-dominant of the existing parietal region)
{
  const b = B("ideomotor_apraxia@none");
  ok("ideomotor apraxia -> dominant parietal", b && b.site.id === "left_cortex_parietal");
  ok("  names dominant parietal", /dominant parietal/i.test(nameB(b)));
}
{
  const b = B("dressing_apraxia@none");
  ok("dressing apraxia -> non-dominant parietal", b && b.site.id === "right_cortex_parietal");
  ok("  names non-dominant parietal", /non-?dominant parietal/i.test(nameB(b)));
}

// TEMPORAL — both bilateral (Anton/Balint pattern)
{
  const b = B("cortical_deafness@none");
  ok("cortical deafness -> bilateral_auditory", b && b.site.id === "bilateral_auditory");
  ok("  names cortical deafness / auditory", /deaf|auditory/i.test(nameB(b)));
}
{
  const b = B("kluver_bucy@none");
  ok("Kluver-Bucy -> bilateral_anterior_temporal", b && b.site.id === "bilateral_anterior_temporal");
  ok("  names Kluver-Bucy", /kl[uü]ver/i.test(nameB(b)));
}

// VENTRAL OCCIPITOTEMPORAL (fusiform)
{
  const b = B("visual_agnosia@none");
  ok("visual agnosia -> bilateral_fusiform", b && b.site.id === "bilateral_fusiform");
}
{
  const b = B("achromatopsia@none");
  ok("achromatopsia -> bilateral_fusiform", b && b.site.id === "bilateral_fusiform");
}
{
  const b = B("alexia_without_agraphia@none");
  ok("pure alexia -> dominant fusiform (VWFA)", b && b.site.id === "left_cortex_fusiform");
  ok("  names alexia without agraphia", /alexia/i.test(nameB(b)));
}
{
  const b = B("prosopagnosia@none");
  ok("prosopagnosia -> non-dominant fusiform (relocated)", b && b.site.id === "right_cortex_fusiform");
  ok("  names prosopagnosia", /prosopagnosia|face/i.test(nameB(b)));
}
// prosopagnosia is no longer a parietal structure
ok("prosopagnosia relocated OFF parietal", STRUCTURE_BY_ID.ctx_prosopagnosia.part === "fusiform");

// Regression: existing parietal syndromes still resolve
ok("Gerstmann tetrad still -> dominant parietal", (() => {
  const b = solve(new Set(["agraphia@none","acalculia@none","finger_agnosia@none","left_right_disorientation@none"])).best;
  return b && b.site.id === "left_cortex_parietal";
})());
// neglect WITH other parietal signs -> cortex (isolated neglect now localises to the thalamic pulvinar —
// a deep lesion — since it's leaner; the cortex wins when it explains the accompanying parietal signs).
ok("neglect + anosognosia -> non-dominant parietal (cortex)",
   solve(new Set(["neglect@left", "anosognosia@none"])).best?.site.id === "right_cortex_parietal");

console.log("====================================================");
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.l}`);
console.log("====================================================");
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

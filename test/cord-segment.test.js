// cord-segment.test.js — WHERE along the cord (spinal cord fix, round 1; spec 2026-10-22-spinal-cord-fix-design.md).
// The cross-section says WHICH cord syndrome; the segment says WHERE along the cord, and a stated sensory level now
// counts as evidence of where. Each section pins one approved row of the round-1 ruling table.
// Run: node test/cord-segment.test.js
import { solve, candidateSites, knownNegatives } from "../src/engine/inverse.js";
import { expectedFindings } from "../src/engine/forward.js";
import { prevalenceOf, UNCOMMON, RARE } from "../src/model/prevalence.js";

let pass = 0, fail = 0;
function ok(label, cond, detail = "") { cond ? pass++ : fail++; console.log(`${cond ? "PASS" : "FAIL"}  ${label}${cond ? "" : "  " + detail}`); }
const L = s => new Set(s.split(/\s+/).filter(Boolean));
const B = f => `${f}@left ${f}@right`;
const site = id => candidateSites().find(s => s.id === id);
const first = r => r.display[0]?.site;
const ids = r => r.display.map(c => c.site.id);

// ---- Row 4: prevalence — the bilateral cord patterns take the cord's own tier; the conus is rare ----
ok("the bilateral anterior cord is UNCOMMON (the cord's own tier), no longer RARE", prevalenceOf(site("bilateral_cord_anterior")) === UNCOMMON);
ok("…and so are the posterior and the central cord", prevalenceOf(site("bilateral_cord_posterior")) === UNCOMMON && prevalenceOf(site("bilateral_cord_central")) === UNCOMMON);
ok("the transverse cord stays RARE (its own RARE_PARTS entry)", prevalenceOf(site("bilateral_cord_transverse")) === RARE);
ok("the conus is RARE", prevalenceOf(site("conus_medullaris")) === RARE);
ok("the cauda is unchanged (UNCOMMON)", prevalenceOf(site("cauda_equina")) === UNCOMMON);
ok("other bilateral sites stay RARE (locked-in)", prevalenceOf(site("locked_in")) === RARE);

// ---- Row 5: upper motor neurone signs come before weakness (known negatives) ----
{
  const neg = knownNegatives(L("weak_leg@right babinski@right babinski@left"));
  ok("a left Babinski means the left corticospinal tract is involved: left leg weakness is NOT a known normal", !neg.has("weak_leg@left"));
  const emb = knownNegatives(L("weak_arm@right weak_leg@left"));
  ok("weakness never excuses: R arm + L leg keeps the L arm and the R leg as known normals", emb.has("weak_arm@left") && emb.has("weak_leg@right"));
  const lone = knownNegatives(L("weak_leg@right babinski@right"));
  ok("with nothing entered on the left, the left leg and plantar stay known normals", lone.has("weak_leg@left") && lone.has("babinski@left"));
  const r = solve(L("weak_leg@right babinski@right babinski@left sphincter_dysfunction@midline"));
  ok("asymmetric compression (R leg weak + both Babinski + sphincter) → a cord lesion first, one lesion", first(r)?.level === "cord" && r.multi === null, ids(r).slice(0, 3).join(", "));
}

// ---- Row 2: the cord's segment, as VARIANTS of the same sites ----
{
  const all = candidateSites().map(s => s.id);
  ok("candidateSites() still lists each site once (a variant is never a candidate of its own)", new Set(all).size === all.length && candidateSites().every(s => !s.variant));
  const spastic = L(`${B("hyperreflexia")} ${B("babinski")} ${B("spasticity")}`);
  const r = solve(spastic);
  ok("spastic legs alone → a cord lesion first, read with the arms spared", first(r)?.level === "cord" && first(r)?.variant === "arms-spared", ids(r).slice(0, 3).join(", "));
  ok("…and the conus is still offered, below it", ids(r).indexOf("conus_medullaris") > 0);
  ok("every displayed id is a candidate id (variants add none)", r.display.every(c => all.includes(c.site.id)));
  ok("each id is displayed once", new Set(ids(r)).size === ids(r).length);
  const rl = solve(spastic, { sensoryLevel: "T10" });
  ok("spastic legs + level T10 → the level note follows the displayed cord answer", rl.level.applies && /at or just above T10/.test(rl.level.note), rl.level.note);
  const v = site("bilateral_cord_anterior").variants?.find(x => x.key === "arms-spared");
  const e = v ? expectedFindings({ ...site("bilateral_cord_anterior"), structures: v.structures }) : new Set();
  ok("the arms-spared reading predicts no arm weakness and no Hoffmann's, but still the legs", !!v && !e.has("weak_arm@left") && !e.has("hoffmann@left") && e.has("weak_leg@left"));
  ok("both hemicords carry the arms-spared reading", ["left_cord_hemi", "right_cord_hemi"].every(id => site(id).variants?.some(x => x.key === "arms-spared")));
  const bs = solve(L("weak_leg@right babinski@right dorsal_sensory@right spinothalamic@left"));
  ok("Brown-Séquard without arm signs → the right hemicord, arms spared", first(bs)?.id === "right_cord_hemi" && first(bs)?.variant === "arms-spared");
}

// ---- Row 3: at-level signs — two-segment spans, on one side or both ----
{
  const p1 = solve(L(`reflex_biceps_loss@left reflex_brachioradialis_loss@left weak_elbow_flexion@left ${B("hyperreflexia")} ${B("babinski")} ${B("spasticity")}`));
  ok("C5/6 myeloradiculopathy → the anterior cord at C5–6 with left root signs, one lesion", first(p1)?.id === "bilateral_cord_anterior" && first(p1)?.variant === "C5-6:left" && p1.multi === null, `${ids(p1).slice(0, 2)} ${first(p1)?.variant}`);
  const mir = solve(L(`reflex_biceps_loss@right reflex_brachioradialis_loss@right weak_elbow_flexion@right ${B("hyperreflexia")} ${B("babinski")} ${B("spasticity")}`));
  ok("…its mirror reads the right side", first(mir)?.variant === "C5-6:right" && mir.multi === null);
  const c7 = solve(L(`reflex_triceps_loss@right weak_elbow_extension@right ${B("hyperreflexia")} ${B("babinski")}`));
  ok("R triceps jerk lost + weak elbow extension + both legs UMN → one cord lesion", first(c7)?.level === "cord" && c7.multi === null, ids(c7).slice(0, 2).join(", "));
  const v = site("bilateral_cord_anterior").variants.find(x => x.key === "C5-6:left");
  const e = v ? expectedFindings({ ...site("bilateral_cord_anterior"), structures: v.structures, atLevel: v.atLevel }) : new Set();
  ok("at-level rows are emitted on their own side only", !!v && e.has("reflex_biceps_loss@left") && !e.has("reflex_biceps_loss@right") && e.has("babinski@right"));
  ok("the spans are C5–6, C6–7, C7–8 and C8–T1, each left, right and both", site("bilateral_cord_anterior").variants.filter(x => x.atLevel).length === 12);
}

// ---- report ----
console.log(`\ncord segment: ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);

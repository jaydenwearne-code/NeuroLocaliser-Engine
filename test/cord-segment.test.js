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

// ---- Row 6: a complete lesion takes the saddle; the incomplete patterns keep sacral sparing ----
{
  const has = id => expectedFindings(site(id)).has("saddle_anaesthesia@midline");
  ok("the transverse (complete) cord predicts saddle anaesthesia", has("bilateral_cord_transverse"));
  ok("the anterior, central and hemicord do not", !has("bilateral_cord_anterior") && !has("bilateral_cord_central") && !has("left_cord_hemi"));
  const t8 = solve(L(`${B("weak_leg")} ${B("babinski")} ${B("spinothalamic")} ${B("dorsal_sensory")} sphincter_dysfunction@midline saddle_anaesthesia@midline`), { sensoryLevel: "T8" });
  ok("T8 compression examined fully, saddle included → one lesion, the transverse cord", first(t8)?.id === "bilateral_cord_transverse" && t8.multi === null, ids(t8).slice(0, 2).join(", "));
  const conus = solve(L(`saddle_anaesthesia@midline sphincter_dysfunction@midline ${B("babinski")} ${B("hyperreflexia")}`));
  ok("the conus picture is still one lesion, the conus first", first(conus)?.id === "conus_medullaris" && conus.multi === null);
  ok("…with the complete cord listed second (look for a level)", conus.display[1]?.site.id === "bilateral_cord_transverse");
}

// ---- Row 7: spinal shock — flaccid and areflexic below an acute lesion, offered only with a stated level ----
{
  const flaccid = `${B("lmn_weakness")} ${B("reflex_knee_loss")} ${B("reflex_ankle_loss")}`;
  const p15 = solve(L(`${flaccid} ${B("hypotonia")} ${B("spinothalamic")} sphincter_dysfunction@midline`), { sensoryLevel: "T6" });
  ok("flaccid areflexic legs + pain loss + retention, level T6 → the cord in spinal shock, one lesion", first(p15)?.level === "cord" && /^shock/.test(first(p15)?.variant || "") && p15.multi === null, `${ids(p15).slice(0, 2)} ${first(p15)?.variant}`);
  const p16 = solve(L(`${B("weak_leg")} ${B("reflex_knee_loss")} ${B("reflex_ankle_loss")} ${B("spinothalamic")} sphincter_dysfunction@midline`), { sensoryLevel: "T6" });
  ok("…entered as weak legs + areflexia → the same, one lesion", first(p16)?.level === "cord" && p16.multi === null);
  const gbs = solve(L(flaccid));
  ok("with no level stated, spinal shock is not offered: flaccid areflexic legs stay GBS", first(gbs)?.id === "polyradiculoneuropathy_acute" && !ids(gbs).some(id => id.startsWith("bilateral_cord")));
  const bab = solve(L(`${flaccid} ${B("spinothalamic")} sphincter_dysfunction@midline ${B("babinski")}`), { sensoryLevel: "T6" });
  ok("up-going plantars do not argue against shock: still one lesion", first(bab)?.level === "cord" && bab.multi === null);
  const down = solve(L(`${flaccid} ${B("spinothalamic")} sphincter_dysfunction@midline plantar_flexor@left plantar_flexor@right`), { sensoryLevel: "T6" });
  ok("down-going plantars only demote it", first(down)?.level === "cord" && !!down.display[0].against);
}

// ---- Row 1: a stated level — demote what cannot produce it; the segment must lie at or above it ----
{
  const conusT10 = solve(L(`saddle_anaesthesia@midline sphincter_dysfunction@midline ${B("babinski")}`), { sensoryLevel: "T10" });
  ok("the conus picture with a T10 level → a cord lesion first", first(conusT10)?.level === "cord", ids(conusT10).slice(0, 2).join(", "));
  const cc = conusT10.display.find(c => c.site.id === "conus_medullaris");
  ok("…the conus demoted, never excluded", !!cc && cc.levelAgainst === "T10");
  const c4 = solve(L(`${B("hyperreflexia")} ${B("babinski")} ${B("spasticity")}`), { sensoryLevel: "C4" });
  ok("spastic legs + level C4 → a cord lesion first, NOT the arms-spared reading", first(c4)?.level === "cord" && first(c4)?.variant !== "arms-spared", `${ids(c4).slice(0, 2)} ${first(c4)?.variant}`);
  const weber = solve(L("ptosis@left weak_adduction@left weak_elevation@left weak_depression@left weak_arm@right weak_leg@right facial_weakness@right forehead_spared@right"), { sensoryLevel: "T10" });
  ok("Weber + T10 → still the midbrain (the only site that explains it), no multifocal claim", first(weber)?.id === "left_midbrain_medial" && weber.multi === null);
  ok("…and the level says the answer cannot produce it", weber.level.contradicts === true && weber.level.applies === false);
  ok("with no level stated nothing is demoted", solve(L(`${B("hyperreflexia")} ${B("babinski")}`)).display.every(c => !c.levelAgainst));
}

// ---- Row 9: the level note names the segment the chosen reading implies ----
{
  const p1 = solve(L(`reflex_biceps_loss@left reflex_brachioradialis_loss@left weak_elbow_flexion@left ${B("hyperreflexia")} ${B("babinski")} ${B("spasticity")}`));
  ok("no level typed: the at-level reading names its segment", p1.level.fromVariant === true && /C5–6/.test(p1.level.note), p1.level.note);
  const sp = solve(L(`${B("hyperreflexia")} ${B("babinski")} ${B("spasticity")}`));
  ok("no level typed: the arms-spared reading says so, and never says thoracic", sp.level.fromVariant === true && /arms are spared/.test(sp.level.note) && !/thoracic/i.test(sp.level.note), sp.level.note);
  const cauda = solve(L("saddle_anaesthesia@midline sphincter_dysfunction@midline reflex_ankle_loss@left reflex_ankle_loss@right lmn_weakness@left radicular_pain@left"), { sensoryLevel: "T10" });
  ok("a level under a cauda answer is flagged as contradicted", first(cauda)?.id === "cauda_equina" && cauda.level.contradicts === true);
  const bs = solve(L("weak_arm@left weak_leg@left dorsal_sensory@left spinothalamic@right"));
  ok("a generic cord reading with no level keeps 'level undetermined'", !bs.level.fromVariant && /level undetermined/.test(bs.level.note));
}

// ---- report ----
console.log(`\ncord segment: ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);

// tracts.test.js — Sub-project B: long-tract taxonomy + tractsFor derivation.
import { TRACTS, NEURAXIS, neuraxisIndex } from "../src/model/tracts.js";
import { tractsFor, tractNarrative, whyNotOthers } from "../src/engine/tracts.js";
import { candidateSites } from "../src/engine/inverse.js";
import { STRUCTURES } from "../src/model/structures.js";

let pass = 0, fail = 0;
const ok = (l, c) => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l); };
const opts = { dominantSide: "left" };

// ---- consistency guard: every course level (bar narrative-only origins) has a producing structure ----
for (const t of TRACTS) {
  for (const wp of t.course) {
    if (wp.narrativeOnly) continue; // an anatomical origin/terminus with no discrete lesion site (e.g. hypothalamus)
    const has = STRUCTURES.some(s => s.level === wp.level && t.findings.includes(s.produces));
    ok(`${t.id}: course level ${wp.level} has a producing structure`, has);
  }
}

// ---- richer-why: direction + per-waypoint detail/supply ----
for (const t of TRACTS) {
  ok(`${t.id}: has a direction`, t.direction === "descending" || t.direction === "ascending");
  for (const wp of t.course) ok(`${t.id}/${wp.level}: has detail + supply`, !!wp.detail && !!wp.supply);
}

// ---- corticospinal implicated by arm+leg weakness, and no other core tract ----
const cst = tractsFor(new Set(["weak_arm@left", "weak_leg@left"]), opts);
ok("weak_arm+weak_leg implicates exactly one tract", cst.length === 1);
ok("that tract is corticospinal", cst[0] && cst[0].tract.id === "corticospinal");

// ---- candidate sites ordered rostral→caudal by neuraxis ----
const idx = id => cst[0].sites.findIndex(s => s.site.id === id);
ok("cortex site precedes pons site", idx("right_cortex_mca") > -1 && idx("right_pons_basis_pontis") > -1
   && idx("right_cortex_mca") < idx("right_pons_basis_pontis"));
ok("pons precedes medulla", idx("right_pons_basis_pontis") < idx("right_medulla_medial"));
ok("medulla precedes the cord composite", idx("right_medulla_medial") < idx("left_cord_hemi"));
ok("sites are sorted by non-decreasing neuraxisIndex",
   cst[0].sites.every((s, i, a) => i === 0 || a[i - 1].neuraxisIndex <= s.neuraxisIndex));

// ---- corticospinal decussation is medulla→cord ----
ok("corticospinal decussates between medulla and cord",
   cst[0].decussation.between && cst[0].decussation.between[0] === "medulla" && cst[0].decussation.between[1] === "cord");

// ---- multi-tract (Brown-Séquard): all three long tracts implicated ----
const bs = tractsFor(new Set(["weak_arm@left", "dorsal_sensory@left", "spinothalamic@right"]), opts);
const ids = new Set(bs.map(t => t.tract.id));
ok("Brown-Séquard implicates corticospinal", ids.has("corticospinal"));
ok("Brown-Séquard implicates dorsal_column", ids.has("dorsal_column"));
ok("Brown-Séquard implicates spinothalamic", ids.has("spinothalamic"));

// ---- corticobulbar (fast-follow): the UMN discriminator forehead_spared implicates it ----
const cb = tractsFor(new Set(["facial_weakness@left", "forehead_spared@left"]), opts);
const cbTract = cb.find(t => t.tract.id === "corticobulbar");
ok("forehead_spared implicates the corticobulbar tract", !!cbTract);
ok("corticobulbar keys on forehead_spared (UMN), not shared facial_weakness",
   cbTract && cbTract.tract.findings.includes("forehead_spared") && !cbTract.tract.findings.includes("facial_weakness"));
ok("corticobulbar course tops out at the pons (no medulla/cord)",
   cbTract && cbTract.tract.course.every(wp => ["cortex", "subcortex", "midbrain", "pons"].includes(wp.level)));
ok("plain arm+leg weakness does NOT implicate corticobulbar",
   !tractsFor(new Set(["weak_arm@left", "weak_leg@left"]), opts).some(t => t.tract.id === "corticobulbar"));

// ---- non-tract input → empty (fallback) ----
ok("a non-tract finding implicates no tract", tractsFor(new Set(["dysarthria@none"]), opts).length === 0);

// ---- oculosympathetic (Horner) pathway ----
const horner = tractsFor(new Set(["miosis@left", "anhidrosis_face@left"]), opts);
const symp = horner.find(t => t.tract.id === "oculosympathetic");
ok("Horner findings (miosis + anhidrosis) implicate the oculosympathetic pathway", !!symp);
{ const n = tractNarrative(symp.tract);
  ok("oculosympathetic narrative mentions the ciliospinal centre of Budge", /ciliospinal centre of Budge/i.test(n));
  ok("oculosympathetic narrative mentions the superior cervical ganglion", /superior cervical ganglion/i.test(n));
  ok("oculosympathetic narrative mentions the internal carotid", /internal carotid/i.test(n)); }
ok("oculosympathetic is ipsilateral throughout (crossing note)", /ipsilateral/i.test(symp.tract.crossingNote));
ok("oculosympathetic has no decussation", !symp.tract.decussation.between && !symp.tract.decussation.inLevel);
// sites ordered central (brainstem/cord) → preganglionic (sympathetic) → postganglionic (skull_base)
{ const lvlSeq = symp.sites.map(s => s.level);
  const firstSym = lvlSeq.indexOf("sympathetic"), firstSB = lvlSeq.indexOf("skull_base"), lastCord = lvlSeq.lastIndexOf("cord");
  ok("oculosympathetic candidates ordered central→pre→postganglionic",
     (lastCord === -1 || firstSym === -1 || lastCord < firstSym) && (firstSym === -1 || firstSB === -1 || firstSym < firstSB)); }
// a pupil-SPARING/involving CN III palsy (ptosis + dilated pupil, NO miosis/anhidrosis) must NOT hijack it
ok("a CN III picture (ptosis + fixed dilated pupil) does NOT implicate the oculosympathetic pathway",
   tractsFor(new Set(["ptosis@left", "fixed_dilated_pupil@left"]), opts).every(t => t.tract.id !== "oculosympathetic"));

// ---- MLF / INO ----
const inoTf = tractsFor(new Set(["ino@left"]), opts);
const mlf = inoTf.find(t => t.tract.id === "mlf");
ok("ino implicates the MLF pathway", !!mlf);
ok("MLF course listed rostral→caudal (midbrain, pons)", mlf && mlf.tract.course.map(w => w.level).join(">") === "midbrain>pons");
ok("MLF narrative reads caudal→rostral (pons → midbrain)", mlf && /begins in the abducens internuclear neurons in the pons[\s\S]*medial-rectus subnucleus/i.test(tractNarrative(mlf.tract)));
ok("MLF crossing note says INO is ipsilateral to the lesion", mlf && /ipsilateral to the lesion/i.test(mlf.tract.crossingNote));

// ---- visual pathway ----
const vis = tractsFor(new Set(["bitemporal_hemianopia@midline"]), opts).find(t => t.tract.id === "visual");
ok("a bitemporal hemianopia implicates the visual pathway", !!vis);
{ const n = tractNarrative(vis.tract);
  ok("visual narrative mentions the optic chiasm", /chiasm/i.test(n));
  ok("visual narrative mentions the calcarine / occipital cortex", /calcarine|occipital/i.test(n)); }
ok("visual pathway decussates at the chiasm", vis.tract.decussation.label && /chiasm/i.test(vis.tract.decussation.label));
// a homonymous hemianopia should surface candidate sites from tract through to occipital cortex
{ const hh = tractsFor(new Set(["homonymous_hemianopia@right"]), opts).find(t => t.tract.id === "visual");
  const lvls = new Set(hh.sites.map(s => s.level));
  ok("homonymous defect spans post-chiasmal stations (radiation/cortex)", lvls.has("subcortex") || lvls.has("cortex")); }

// ---- cerebellar (spinocerebellar) pathway ----
const cbTf = tractsFor(new Set(["limb_ataxia@left"]), opts).find(t => t.tract.id === "cerebellar");
ok("limb_ataxia implicates the cerebellar pathway", !!cbTf);
{ const n = tractNarrative(cbTf.tract);
  ok("cerebellar narrative mentions the cerebellar peduncle(s)", /cerebellar peduncle/i.test(n));
  ok("cerebellar narrative mentions the spinocerebellar tracts", /spinocerebellar/i.test(n)); }
ok("cerebellar signs described as ipsilateral", /ipsilateral/i.test(cbTf.tract.crossingNote));
ok("cerebellar candidates include a cerebellum site", cbTf.sites.some(s => s.level === "cerebellum"));

// ---- central tegmental tract (palatal tremor) ----
const ctt = tractsFor(new Set(["palatal_tremor@midline"]), opts).find(t => t.tract.id === "central_tegmental");
ok("palatal_tremor implicates the central tegmental tract", !!ctt);
ok("central-tegmental crossing note names the Guillain–Mollaret triangle", ctt && /guillain.?mollaret/i.test(ctt.tract.crossingNote));
ok("central-tegmental mentions hypertrophic olivary degeneration", ctt && /hypertrophic olivary/i.test(ctt.tract.crossingNote));

// ---- trigeminothalamic (face sensation) ----
const tt = tractsFor(new Set(["face_pain_loss@left"]), opts).find(t => t.tract.id === "trigeminothalamic");
ok("face_pain_loss implicates the trigeminothalamic pathway", !!tt);
{ const n = tractNarrative(tt.tract);
  ok("trigeminothalamic narrative reads spinal trigeminal nucleus → VPM", /spinal trigeminal nucleus[\s\S]*VPM|ventral posteromedial/i.test(n)); }
ok("trigeminothalamic crossing note captures the Wallenberg crossed pattern",
   tt && /ipsilateral facial|uncrossed-face|crossed-body/i.test(tt.tract.crossingNote));
// Wallenberg picture (ipsi face pain + contra body pain/temp) implicates BOTH trigeminothalamic AND spinothalamic
{ const wall = tractsFor(new Set(["face_pain_loss@left", "spinothalamic@right"]), opts).map(t => t.tract.id);
  ok("Wallenberg picture implicates both trigeminothalamic and spinothalamic", wall.includes("trigeminothalamic") && wall.includes("spinothalamic")); }

// ---- oculosympathetic why-not surfaces the order discrimination (emergent) ----
{ const pregSite = candidateSites().find(s => /preganglionic/.test(s.id) || (s.level === "sympathetic"));
  if (pregSite) {
    const wnS = whyNotOthers(new Set(["miosis@left", "anhidrosis_face@left"]), pregSite, opts);
    ok("Horner why-not includes a brainstem/central alternative", wnS.buckets.some(b => b.bucket === "brainstem" || b.bucket === "spinal cord"));
  } else ok("Horner why-not (preganglionic site present)", false); }

// ---- composed anatomy narrative (richer-why) ----
const cstTract = TRACTS.find(t => t.id === "corticospinal");
const narr = tractNarrative(cstTract);
for (const sub of ["primary motor cortex", "MCA", "ACA", "internal capsule", "pyramidal decussation"])
  ok(`corticospinal narrative mentions "${sub}"`, narr.includes(sub));

// ---- derived "why not the others" ----
const icSite = candidateSites().find(s => s.id === "right_subcortex_internal_capsule");
const wn = whyNotOthers(new Set(["weak_arm@left", "weak_leg@left"]), icSite, { dominantSide: "left" });
const bucket = name => wn.buckets.find(b => b.bucket === name);
ok("whyNotOthers has a cortical bucket with a cortical sign",
   !!bucket("cortical") && bucket("cortical").findings.some(f => ["neglect","gaze_deviation","motor_dysprosody","abulia","cortical_sensory_arm","cortical_sensory_leg","executive_dysfunction","anosognosia","grasp_reflex"].includes(f)));
ok("whyNotOthers has a brainstem bucket with a brainstem sign",
   !!bucket("brainstem") && bucket("brainstem").findings.some(f => ["weak_adduction","weak_elevation","weak_depression","limb_ataxia","gaze_palsy","facial_weakness","cn12_palsy","ino"].includes(f)));
ok("whyNotOthers has a spinal cord bucket with a crossed/dorsal sensory sign",
   !!bucket("spinal cord") && bucket("spinal cord").findings.some(f => ["spinothalamic","sensory_ataxia","dorsal_sensory"].includes(f)));
ok("each why-not bucket carries a blood supply", wn.buckets.every(b => !!b.supply));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

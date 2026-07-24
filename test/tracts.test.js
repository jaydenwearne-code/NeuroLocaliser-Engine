// tracts.test.js — Sub-project B: long-tract taxonomy + tractsFor derivation.
import { TRACTS, NEURAXIS, neuraxisIndex } from "../src/model/tracts.js";
import { tractsFor } from "../src/engine/tracts.js";
import { STRUCTURES } from "../src/model/structures.js";

let pass = 0, fail = 0;
const ok = (l, c) => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l); };
const opts = { dominantSide: "left" };

// ---- consistency guard: every course level has a structure producing a tract finding ----
for (const t of TRACTS) {
  for (const wp of t.course) {
    const has = STRUCTURES.some(s => s.level === wp.level && t.findings.includes(s.produces));
    ok(`${t.id}: course level ${wp.level} has a producing structure`, has);
  }
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

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

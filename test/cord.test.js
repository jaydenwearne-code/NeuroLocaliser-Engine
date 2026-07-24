// cord.test.js — proof that the SPINAL CORD syndromes EMERGE from anatomy.
//
// Same contract as engine.test.js: state the findings the bedside sees (finding@bodySide)
// and assert the engine localises to the correct site, with NO syndrome encoded as a rule.
// The cord's crux is different from the brainstem's:
//   - corticospinal has already crossed at the pyramids -> IPSILATERAL weakness below a cord lesion
//   - dorsal columns are uncrossed -> IPSILATERAL vibration/proprioception loss
//   - spinothalamic crosses within the cord -> CONTRALATERAL pain/temperature loss
//   - anterior (ASA) vs posterior (PSA) territory is what makes vibration-sparing emerge
//   - anterior/posterior/transverse lesions are BILATERAL (findings on both body sides)
// Run: node test/cord.test.js

import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0;
const results = [];

function check(label, observed, expectSiteId, opts = {}) {
  const observedSet = new Set(observed);
  const { best, single, multi, singleExplainsAll } = solve(observedSet);
  const gotId = best ? best.site.id : "(none)";
  const name = best ? nameForSite(best.site).name : "(none)";
  let ok = opts.anySite ? true : (gotId === expectSiteId);

  if (opts.expectName) ok = ok && name.toLowerCase().includes(opts.expectName.toLowerCase());
  if (opts.expectMulti) {
    ok = ok && !!multi && multi.sites.length >= 2;
    if (opts.expectSites) {
      const got = new Set(multi ? multi.sites.map(s => s.id) : []);
      ok = ok && opts.expectSites.every(id => got.has(id));
    }
  }
  if (opts.singleShouldExplainAll !== undefined) {
    ok = ok && singleExplainsAll === opts.singleShouldExplainAll;
  }

  results.push({ label, gotId, expectSiteId, name, ok,
    multi: multi ? multi.sites.map(s => s.id) : null,
    top3: single.slice(0,3).map(r => `${r.site.id}(${r.score.toFixed(1)})`) });
  if (ok) pass++; else fail++;
}

// ============ BROWN-SÉQUARD (hemicord) ============
// Left hemicord: ipsilateral weakness (CST already crossed) + ipsilateral dorsal-column loss
//   (uncrossed) + CONTRALATERAL pain/temperature loss (STT crossed in the cord) -> left hemicord.
check("Brown-Séquard (L weakness + L dorsal + R spinothalamic)",
  ["weak_arm@left","weak_leg@left", "dorsal_sensory@left", "spinothalamic@right"],
  "left_cord_hemi", { expectName: "Brown" });

// Side discrimination — mirror image localises to the right hemicord.
check("Brown-Séquard mirrored (R weakness + R dorsal + L spinothalamic)",
  ["weak_arm@right","weak_leg@right", "dorsal_sensory@right", "spinothalamic@left"],
  "right_cord_hemi", { expectName: "Brown" });

// ============ ANTERIOR CORD / ASA ============
// Bilateral weakness + bilateral pain/temperature loss, vibration/proprioception SPARED
//   (dorsal columns are PSA territory) -> anterior cord. Sparing must beat transverse.
check("Anterior cord / ASA (bilat weakness + bilat spinothalamic, vibration spared)",
  ["weak_arm@left","weak_leg@left", "weak_arm@right","weak_leg@right", "spinothalamic@left", "spinothalamic@right"],
  "bilateral_cord_anterior", { expectName: "anterior" });

// ============ POSTERIOR COLUMN / SCD ============
// Bilateral vibration/proprioception loss only (dorsal columns), power + pain/temp spared.
check("Posterior column / SCD (bilateral vibration/proprioception loss)",
  ["dorsal_sensory@left", "dorsal_sensory@right"],
  "bilateral_cord_posterior", { expectName: "posterior" });

// ============ TRANSVERSE MYELOPATHY ============
// Everything below the level, bilateral — the complete cord cross-section.
check("Transverse myelopathy (all tracts, both sides)",
  ["weak_arm@left","weak_leg@left", "weak_arm@right","weak_leg@right",
   "dorsal_sensory@left", "dorsal_sensory@right",
   "spinothalamic@left", "spinothalamic@right"],
  "bilateral_cord_transverse", { expectName: "transverse" });

// ---- report ----
console.log("\nNeuroLocaliser anatomical engine — SPINAL CORD emergence tests\n" + "=".repeat(52));
for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
  console.log(`      -> ${r.gotId}  ${r.name !== "(none)" ? "= " + r.name : ""}`);
  if (!r.ok) console.log(`      expected ${r.expectSiteId}; top3: ${r.top3.join(", ")}`);
  if (r.multi) console.log(`      multifocal set: ${r.multi.join(" + ")}`);
}
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);

// thalamus-hypothalamus.test.js — the remaining thalamic nuclei (VA/VL motor, VPM face, pulvinar,
// anterior/DM limbic) and the hypothalamus by region (DI, thermoregulation, appetite, sleep, memory,
// endocrine). Run: node test/thalamus-hypothalamus.test.js
import { CROSSES, NON_LATERALISED, isFinding } from "../src/model/findings.js";
import { LOCALISING } from "../src/engine/score.js";
import { composeHypothalamusSites } from "../src/model/sites.js";
import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0; const log = [];
function ok(l, c) { log.push({ l, ok: !!c }); c ? pass++ : fail++; }
const B = (...fs) => solve(new Set(fs)).best;
const nameB = b => (b ? nameForSite(b.site, { dominantSide: "left" }).name : "");

// Vocabulary
for (const id of ["thalamic_tremor", "face_sensory_loss", "amnesia", "diabetes_insipidus",
                  "thermodysregulation", "hyperphagia", "narcolepsy", "circadian_disruption", "endocrine_dysfunction"]) {
  ok(`${id} exists`, isFinding(id));
  ok(`${id} LOCALISING`, LOCALISING.has(id));
}
ok("face_sensory_loss is LATERALISED + crosses (contra)", !NON_LATERALISED.has("face_sensory_loss") && CROSSES.face_sensory_loss === true);
ok("thalamic_tremor is @none", NON_LATERALISED.has("thalamic_tremor"));
ok("amnesia is @none", NON_LATERALISED.has("amnesia"));

// THALAMUS nuclei
{
  const b = B("thalamic_tremor@none");
  ok("thalamic tremor -> thalamus_vl", b && b.site.id.includes("thalamus_vl"));
  ok("  names ventrolateral / motor / tremor", /ventrolateral|motor|tremor|VL/i.test(nameB(b)));
}
{
  const b = B("amnesia@none");
  ok("amnesia -> a diencephalic memory site (thalamus_limbic or mammillary)",
     b && (b.site.id.includes("thalamus_limbic") || b.site.id.includes("mammillary")));
  ok("  names amnesia / diencephalic / Korsakoff", /amnesi|diencephalic|korsakoff|memory/i.test(nameB(b)));
}
// VPM: crossed (contralateral) facial sensory loss localises to the thalamus (vs ipsilateral brainstem)
{
  const b = B("face_sensory_loss@right");
  ok("contralateral face sensory -> left_thalamus_vpm", b && b.site.id === "left_thalamus_vpm");
}
// Pulvinar neglect vs cortical: neglect + anosognosia is CORTICAL; isolated neglect is thalamic pulvinar
{
  const cortex = B("neglect@left", "anosognosia@none");
  ok("neglect + anosognosia -> cortex parietal", cortex && cortex.site.id === "right_cortex_parietal");
  const thal = B("neglect@left");
  ok("isolated neglect -> thalamus_pulvinar", thal && thal.site.id.includes("thalamus_pulvinar"));
}

// HYPOTHALAMUS by region
const HY = Object.fromEntries(composeHypothalamusSites().map(s => [s.id, s]));
ok("hypothalamus sites are midline", Object.values(HY).every(s => s.side === "midline"));
const hy = (finding, part) => {
  const b = B(finding);
  ok(`${finding} -> hypothalamus_${part}`, b && b.site.id === `hypothalamus_${part}`);
};
hy("diabetes_insipidus@none", "supraoptic");
hy("thermodysregulation@none", "thermoregulatory");
hy("hyperphagia@none", "ventromedial");
hy("narcolepsy@none", "lateral");
hy("circadian_disruption@none", "suprachiasmatic");
hy("endocrine_dysfunction@none", "tuberal");

// Regression: pure body sensory still the VPL thalamus (thalamic_pain discriminates Dejerine-Roussy)
{
  const b = B("dorsal_sensory@right", "spinothalamic@right", "thalamic_pain@right");
  ok("pure body sensory + central pain -> VPL thalamus", b && b.site.id === "left_subcortex_thalamus");
}

console.log("====================================================");
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.l}`);
console.log("====================================================");
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

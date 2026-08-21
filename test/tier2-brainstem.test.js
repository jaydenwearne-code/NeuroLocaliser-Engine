// tier2-brainstem.test.js — brainstem refinements (Tier 2, increment 1):
//   (1) pseudobulbar palsy — bilateral corticobulbar (dysarthria + emotional lability + bilateral facial UMN),
//       distinct from LMN bulbar palsy (cn_bulbar);
//   (2) abducens NUCLEUS = ipsilateral horizontal gaze palsy (nuclear VI ≠ isolated abduction / fascicular VI).
// Run: node test/tier2-brainstem.test.js
import { CROSSES, NON_LATERALISED, isFinding } from "../src/model/findings.js";
import { LOCALISING } from "../src/engine/score.js";
import { STRUCTURES } from "../src/model/structures.js";
import { solve, candidateSites } from "../src/engine/inverse.js";
import { expectedFindings } from "../src/engine/forward.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }
const S = (...t) => new Set(t);
const win = set => solve(set).best?.site?.id ?? null;
const nameOf = set => { const b = solve(set).best; if (!b) return ""; const e = nameForSite(b.site); return (e.name || "") + " " + (e.note || ""); };
const produced = (lvl, part) => STRUCTURES.filter(s => s.level === lvl && s.part === part).map(s => s.produces);

// --- pseudobulbar ---
ok("emotional_lability exists", isFinding("emotional_lability"));
ok("emotional_lability @none + CROSSES false", NON_LATERALISED.has("emotional_lability") && CROSSES["emotional_lability"] === false);
ok("emotional_lability LOCALISING", LOCALISING.has("emotional_lability"));
ok("pseudobulbar site produces dysarthria + emotional_lability + facial_weak_umn",
   ["dysarthria", "emotional_lability", "facial_weakness","forehead_spared"].every(f => produced("pseudobulbar", "corticobulbar").includes(f)));
ok("dysarthria + emotional lability -> pseudobulbar",
   win(S("dysarthria@none", "emotional_lability@none")) === "pseudobulbar_corticobulbar");
ok("pseudobulbar phonebook names it", /pseudobulbar/i.test(nameOf(S("dysarthria@none", "emotional_lability@none"))));
// pseudobulbar (UMN, emotional lability) is distinct from bulbar palsy (LMN: dysphagia + fasciculations)
ok("bulbar palsy (dysphagia + fasciculations) does NOT become pseudobulbar",
   win(S("dysphagia@left", "fasciculations@left")) !== "pseudobulbar_corticobulbar");

// --- abducens nucleus = gaze palsy ---
ok("pons medial now produces gaze_palsy (abducens nucleus = nuclear VI)", produced("pons", "medial").includes("gaze_palsy"));
ok("pons medial still produces weak_abduction (fascicle = isolated abduction)", produced("pons", "medial").includes("weak_abduction"));
// isolated gaze palsy is non-localising in this bundled-pons model (like isolated cn6); it localises WITH company
ok("one-and-a-half (gaze palsy + INO) -> pons medial", /pons_medial/.test(win(S("gaze_palsy@left", "ino@left"))));
ok("Foville (gaze palsy + cn7 + hemiparesis) -> pons medial", /pons_medial/.test(win(S("gaze_palsy@left", "facial_weakness@left", "weak_arm@right","weak_leg@right"))));

// ---- report ----
console.log("\nNeuroLocaliser — TIER 2 · BRAINSTEM REFINEMENTS (pseudobulbar · abducens nucleus)\n" + "=".repeat(52));
// --- THE SUPERIOR CEREBELLAR PEDUNCLE DECUSSATES (owner ruling, 2026-08-21) ---
// Cerebellar signs are ipsilateral as a rule, and `limb_ataxia` defaults to ipsilateral because of it. The
// SCP is the exception: it crosses in the caudal midbrain, so at this level its fibres have ALREADY
// crossed and a lesion gives CONTRALATERAL limb ataxia. The model hedged ("contralateral/ipsilateral") in
// a note while silently emitting ipsilateral, and NO TEST CAUGHT IT — the whole suite passed on the fix,
// which is why this one exists.
{
  const toks = [...expectedFindings(candidateSites().find(s => s.id === "left_midbrain_medial"))]
    .filter(t => t.startsWith("limb_ataxia"));
  ok("a LEFT midbrain SCP lesion gives RIGHT limb ataxia (it has decussated)", toks.includes("limb_ataxia@right"));
  ok("...and NOT ipsilateral ataxia", !toks.includes("limb_ataxia@left"));

  // The contrast that proves the rule is about the LEVEL, not the finding: below the decussation the
  // inferior cerebellar peduncle keeps the ipsilateral default.
  const icp = [...expectedFindings(candidateSites().find(s => s.id === "left_medulla_lateral"))];
  ok("the medullary ICP is still IPSILATERAL (below the decussation)", icp.includes("limb_ataxia@left"));
}

for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);

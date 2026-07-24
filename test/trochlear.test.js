// trochlear.test.js — CN IV is unique: it fully decussates, so a NUCLEAR lesion gives a CONTRALATERAL
// superior oblique palsy, a peripheral one an ipsilateral palsy. The dorsal-midbrain nucleus site carries a
// co-located MLF (-> ipsilateral INO) as its companion, so isolated CN4 -> peripheral (strict), and
// contralateral CN4 + ipsilateral INO -> nucleus.
// Run: node test/trochlear.test.js
import { isFinding } from "../src/model/findings.js";
import { SITE_BY_ID, composeTrochlearNucleusSites } from "../src/model/sites.js";
import { expectedFindings } from "../src/engine/forward.js";
import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }

const NUC = Object.fromEntries(composeTrochlearNucleusSites().map(s => [s.id, s]));

// Vocabulary / sites
ok("weak_depression + vertical_diplopia are findings (CN IV decomposed)", isFinding("weak_depression") && isFinding("vertical_diplopia"));
ok("left_midbrain_trochlear nucleus site exists", !!NUC.left_midbrain_trochlear);
ok("peripheral cn4 nerve site exists", !!SITE_BY_ID.left_skull_base_trochlear_cisternal);

// Forward crossing (the teaching point)
{
  const nuc = expectedFindings(NUC.left_midbrain_trochlear);
  ok("nucleus (left) -> weak_depression@right (CONTRALATERAL — decussates)", nuc.has("weak_depression@right"));
  ok("nucleus (left) -> ino@left (ipsilateral companion)", nuc.has("ino@left"));
  ok("nucleus does NOT emit weak_depression@left", !nuc.has("weak_depression@left"));
  const per = expectedFindings(SITE_BY_ID.right_skull_base_trochlear_cisternal);
  ok("peripheral (right) -> weak_depression@right (IPSILATERAL)", per.has("weak_depression@right"));
}

// Isolated CN4 -> peripheral (strict: nucleus over-predicts ino)
{
  const { best } = solve(new Set(["weak_depression@right", "vertical_diplopia@right"]));
  ok("isolated CN IV (depression + vertical diplopia)@right -> right_skull_base_trochlear_cisternal (peripheral)",
     best && best.site.id === "right_skull_base_trochlear_cisternal");
  ok("peripheral names an ipsilateral trochlear nerve palsy",
     best && /trochlear|superior oblique/i.test(nameForSite(best.site).name));
}

// Nuclear emergence: contralateral CN4 + ipsilateral INO -> nucleus
{
  const { best } = solve(new Set(["weak_depression@right", "vertical_diplopia@right", "ino@left"]));
  ok("CN IV@right + ino@left -> left_midbrain_trochlear (nucleus)",
     best && best.site.id === "left_midbrain_trochlear");
  ok("nucleus names a dorsal-midbrain (trochlear/MLF) syndrome",
     best && /dorsal[- ]?midbrain|trochlear/i.test(nameForSite(best.site).name));
}

console.log("====================================================");
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("====================================================");
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

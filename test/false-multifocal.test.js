// false-multifocal.test.js — the false-multifocal fix (owner rulings 2026-10-22, all 20 rows of round 1).
// Spec: docs/superpowers/specs/2026-10-22-false-multifocal-design.md
import { FINDING_FAMILIES, BACKGROUND_FINDINGS } from "../src/model/families.js";
import { matchToken, enteredToken, enteredSet, predictedSet, sameFamilyInstead } from "../src/engine/families.js";
import { FINDINGS } from "../src/model/findings.js";

let pass = 0, fail = 0;
const ok = (l, c, d = "") => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l + (!c && d ? `  [${d}]` : "")); };
const S = s => new Set(s.split(/\s+/).filter(Boolean));

// ---- 1. the content and the matching ----
for (const fam of FINDING_FAMILIES) {
  ok(`family ${fam.id}: every member is a real finding`, fam.members.every(f => FINDINGS[f]));
  ok(`family ${fam.id}: cites its ruling`, /row \d+/.test(fam.ruling));
  if (fam.head) ok(`family ${fam.id}: its head is a member`, fam.members.includes(fam.head));
}
ok("background findings are real findings", BACKGROUND_FINDINGS.every(f => FINDINGS[f]));
ok("hearing loss is NOT background (NF2's own picture)", !BACKGROUND_FINDINGS.includes("hearing_loss"));
ok("row 2: past-pointing is matched as limb ataxia", matchToken("dysmetria@left") === "limb_ataxia@left");
ok("row 2: the head itself is unchanged", matchToken("limb_ataxia@left") === "limb_ataxia@left");
ok("row 3: hand weakness with leg weakness on that side reads as arm weakness",
   enteredToken("weak_hand@right", S("weak_hand@right weak_leg@right")) === "weak_arm@right");
ok("row 3: ...with facial weakness on that side too",
   enteredToken("weak_hand@right", S("weak_hand@right facial_weakness@right")) === "weak_arm@right");
ok("row 3: hand weakness with only Babinski + brisk stays hand weakness",
   enteredToken("weak_hand@right", S("weak_hand@right babinski@right hyperreflexia@right")) === "weak_hand@right");
ok("row 3: leg weakness on the OTHER side does not count",
   enteredToken("weak_hand@right", S("weak_hand@right weak_leg@left")) === "weak_hand@right");
ok("row 4: scanning speech is matched as slurred speech when only slurred speech was entered",
   predictedSet(S("ataxic_dysarthria@none truncal_ataxia@none"), enteredSet(S("dysarthria@none truncal_ataxia@none"))).has("dysarthria@none"));
ok("row 4: ...but not when scanning speech itself was entered",
   predictedSet(S("ataxic_dysarthria@none"), enteredSet(S("ataxic_dysarthria@none"))).has("ataxic_dysarthria@none"));
ok("row 5: face numbness entered, face pain loss predicted and not entered → face pain loss",
   sameFamilyInstead("face_sensory_loss@left", S("face_pain_loss@left"), S("face_sensory_loss@left")) === "face_pain_loss@left");
ok("row 7: both words entered is not a substitution",
   sameFamilyInstead("face_sensory_loss@left", S("face_pain_loss@left"), S("face_sensory_loss@left face_pain_loss@left")) === null);
ok("row 5: the other side does not count",
   sameFamilyInstead("face_sensory_loss@left", S("face_pain_loss@right"), S("face_sensory_loss@left")) === null);
ok("row 6: hand/arm is not a near-fit family",
   sameFamilyInstead("weak_hand@right", S("weak_arm@right"), S("weak_hand@right")) === null);
ok("row 6: plain → scanning speech is a near-fit family",
   sameFamilyInstead("ataxic_dysarthria@none", S("dysarthria@none"), S("ataxic_dysarthria@none")) === "dysarthria@none");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

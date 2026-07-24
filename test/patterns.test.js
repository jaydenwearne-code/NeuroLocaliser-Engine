// patterns.test.js — cross-cutting SYNTHESIS over the observed findings (UMN/LMN; functional).
// These read the finding SET and answer a clinical question that localisation alone doesn't — they
// never change WHERE the lesion is, they annotate it.
import { umnLmnPattern, functionalFlag } from "../src/engine/patterns.js";
import { isFinding, NON_LATERALISED, CROSSES } from "../src/model/findings.js";
import { LOCALISING } from "../src/engine/score.js";
import { STRUCTURES } from "../src/model/structures.js";

let pass = 0, fail = 0;
const ok = (l, c) => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l); };
const S = (...t) => new Set(t);

// --- UMN vs LMN ---
ok("spasticity + Babinski -> UMN",
   umnLmnPattern(S("spasticity@left","babinski@left")).verdict === "UMN");
ok("wasting + fasciculations + areflexia -> LMN",
   umnLmnPattern(S("wasting@left","fasciculations@left","reflex_ankle_loss@left")).verdict === "LMN");
ok("UMN + LMN together -> mixed (think MND)",
   umnLmnPattern(S("spasticity@left","babinski@left","wasting@left","fasciculations@left")).verdict === "mixed");
ok("no UMN/LMN signs -> null",
   umnLmnPattern(S("neglect@left","comprehension_impaired@none")).verdict === null);
ok("mixed note mentions MND / motor neurone",
   /mnd|motor neurone|amyotroph/i.test(umnLmnPattern(S("spasticity@left","wasting@left")).note));
ok("UMN result lists the matched UMN signs",
   umnLmnPattern(S("spasticity@left","babinski@left")).umnSigns.sort().join(",") === "babinski,spasticity");

// --- Functional (FND) positive signs ---
const FND = ["hoovers_sign","give_way_weakness","entrainment","exam_inconsistency"];
ok("FND findings exist, are non-lateralised, do not cross",
   FND.every(f => isFinding(f) && NON_LATERALISED.has(f) && CROSSES[f] === false));
ok("FND findings are NOT localising",
   FND.every(f => !LOCALISING.has(f)));
ok("FND findings have NO producing structure (never localise)",
   FND.every(f => !STRUCTURES.some(s => s.produces === f)));
ok("a positive FND sign with only subjective (strength) findings -> flags functional",
   functionalFlag(S("give_way_weakness@none","weak_arm@left")).functional === true);
ok("a positive FND sign with only subjective (sensory) findings -> flags functional",
   functionalFlag(S("give_way_weakness@none","cortical_sensory_arm@left","dorsal_sensory@left")).functional === true);
ok("no FND sign -> not flagged",
   functionalFlag(S("weak_arm@left")).functional === false);
ok("functional note mentions functional / non-organic",
   /functional|non-organic/i.test(functionalFlag(S("hoovers_sign@none")).note));

// --- SAFETY: an un-fakeable objective finding SUPPRESSES the functional flag (never mask organic pathology) ---
ok("FND sign + blown pupil (objective) -> NOT flagged functional (suppressed)",
   functionalFlag(S("give_way_weakness@none","fixed_dilated_pupil@left","weak_arm@left")).functional === false);
ok("...and it reports suppressed = true",
   functionalFlag(S("give_way_weakness@none","fixed_dilated_pupil@left")).suppressed === true);
ok("FND sign + facial droop (objective) -> suppressed",
   functionalFlag(S("give_way_weakness@none","facial_weakness@left")).functional === false);
ok("FND sign + Babinski (objective) -> suppressed",
   functionalFlag(S("give_way_weakness@none","babinski@left")).functional === false);
ok("FND sign + RAPD (objective) -> suppressed",
   functionalFlag(S("entrainment@none","rapd@left")).functional === false);
ok("suppressed note names the objective finding and says organic",
   /organic|objective/i.test(functionalFlag(S("give_way_weakness@none","fixed_dilated_pupil@left")).note));
ok("purely subjective + FND sign is NOT suppressed",
   functionalFlag(S("give_way_weakness@none","weak_leg@left","cortical_sensory_leg@left")).suppressed === false);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

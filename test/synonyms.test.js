// synonyms.test.js — bedside phrases the search box understands (spec 2026-09-27 §5.5).
import { SYNONYMS, synonymHits, searchFindings } from "../app/synonyms.js";
import { FINDINGS } from "../src/model/findings.js";
import { PLAIN } from "../app/plain-labels.js";

let pass = 0, fail = 0;
const ok = (l, c, d = "") => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l + (c ? "" : `  ${d}`)); };

const entries = Object.entries(SYNONYMS);
const unreal = entries.flatMap(([p, ids]) => ids.filter(f => !FINDINGS[f]).map(f => `${p} -> ${f}`));
ok(`every phrase resolves to real findings (${entries.length} phrases)`, unreal.length === 0, unreal.join(", "));
ok("every phrase names at least one finding", entries.every(([, ids]) => ids.length > 0));
ok("phrases are lower case and trimmed", entries.every(([p]) => p === p.trim().toLowerCase()));

// The table exists for what the search does not already find: it matches a finding's long description, plain label
// and proper name, so a phrase any of those contains is dead weight ("brisk reflexes" became a label on 2026-09-29).
const own = f => [FINDINGS[f].desc, PLAIN[f]?.label || "", PLAIN[f]?.term || ""].join(" | ").toLowerCase();
const redundant = entries.filter(([p, ids]) => ids.length === 1 && own(ids[0]).includes(p)).map(([p]) => p);
ok("no phrase only repeats a finding's own description, label or proper name", redundant.length === 0, redundant.join(", "));

ok("'slurred speech' finds dysarthria (its plain label)", searchFindings("slurred speech").has("dysarthria"));
ok("'droopy eyelid' finds ptosis, whatever the case", searchFindings("Droopy Eyelid").has("ptosis"));
ok("the proper name is searchable too ('acalculia', 'Klüver')", searchFindings("acalculia").has("acalculia") && searchFindings("klüver").has("kluver_bucy"));
ok("'foot drop' still finds weak dorsiflexion", searchFindings("foot drop").has("weak_ankle_dorsiflexion"));
ok("'dizzy' finds vertigo through the phrase table", searchFindings("dizzy").has("cn8_vertigo"));
ok("a partial word matches as it is typed ('dizz')", synonymHits("dizz").has("cn8_vertigo"));
ok("a longer query containing a phrase matches ('left facial droop')", synonymHits("left facial droop").has("facial_weakness"));
ok("…and one containing a label ('left face droop')", searchFindings("left face droop").has("facial_weakness"));
ok("a short label does not match inside other words", !searchFindings("pinocchio").has("ino"));
ok("Horner finds the eyelid, the pupil and the sweating", ["ptosis", "miosis", "anhidrosis_face"].every(f => synonymHits("horner").has(f)));
ok("fewer than three characters match nothing", synonymHits("di").size === 0 && synonymHits("").size === 0);
ok("the round-1 findings are searchable in bedside words", synonymHits("downgoing").has("plantar_flexor")
   && synonymHits("palpitations").has("arrhythmia") && synonymHits("postural drop").has("labile_blood_pressure"));

console.log(`\nsynonyms: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

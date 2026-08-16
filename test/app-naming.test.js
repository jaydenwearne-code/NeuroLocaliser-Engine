// app-naming.test.js — display-naming invariants (app/labels.js). The app must speak clinical English:
// no raw ids, no un-expanded abbreviations, no underscores on screen.
import { ABBREV, humanisePart } from "../app/labels.js";

let pass = 0, fail = 0;
const log = [];
const ok = (label, cond, detail) => { log.push({ label, ok: !!cond, detail }); cond ? pass++ : fail++; };

// ---- humanisePart: underscores become spaces, known abbreviations expand ----
ok("splits underscores into words", humanisePart("frontal_eye_field") === "frontal eye field");
ok("leaves a single plain word alone", humanisePart("insula") === "insula");
ok("expands a lowercase vascular abbreviation to uppercase", humanisePart("aca") === "ACA");
ok("expands an abbreviation inside a compound", humanisePart("iii_orbit_sup").includes("superior"));
ok("expands dlpfc to words", humanisePart("dlpfc") === "dorsolateral prefrontal");
ok("never returns an underscore", !humanisePart("anterior_choroidal").includes("_"));
ok("ABBREV keys are all lowercase, no underscores",
   Object.keys(ABBREV).every(k => k === k.toLowerCase() && !k.includes("_")));

console.log("\nNeuroLocaliser — DISPLAY NAMING\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}${r.detail ? "  → " + r.detail : ""}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);

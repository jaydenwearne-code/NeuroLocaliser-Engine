// app-naming.test.js — display-naming invariants (app/labels.js). The app must speak clinical English:
// no raw ids, no un-expanded abbreviations, no underscores on screen.
import { ABBREV, humanisePart, PART_LABEL, siteLabel } from "../app/labels.js";
import { candidateSites } from "../src/engine/inverse.js";

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

const SITES = candidateSites();

// ---- PART_LABEL keying: level|part, NEVER part alone ----
// 4 part names are reused across levels (lateral spans 5, hemi spans 4, medial 3, anterior 2), exactly the
// trap src/model/vascular.js and topography.js document. A bare-part key would give lateral medulla and
// lateral midbrain one shared label.
ok("every PART_LABEL key is `level|part`",
   Object.keys(PART_LABEL).every(k => k.includes("|") && k.split("|").length === 2));
{
  const known = new Set(SITES.map(s => `${s.level}|${s.part}`));
  const orphan = Object.keys(PART_LABEL).find(k => !known.has(k));
  ok("no PART_LABEL key is dead (every key names a real site)", !orphan, orphan);
}

// ---- the clean-label invariant, over every reachable site ----
{
  const seen = new Set(); const bad = [];
  for (const s of SITES) {
    const k = `${s.level}|${s.part}`;
    if (seen.has(k)) continue; seen.add(k);
    const label = siteLabel(s);
    if (!label || !label.trim()) { bad.push(`${k}: empty`); continue; }
    if (label.includes("_")) bad.push(`${k}: underscore in "${label}"`);
    // an un-expanded abbreviation: a whole word that is a key of ABBREV
    const stray = label.split(/\s+/).find(w => ABBREV[w.toLowerCase()] && w !== ABBREV[w.toLowerCase()]);
    if (stray) bad.push(`${k}: un-expanded "${stray}" in "${label}"`);
    // the level word must not appear twice ("motor leg cortex cortex")
    const words = label.toLowerCase().split(/\s+/);
    if (words.length !== new Set(words).size) bad.push(`${k}: repeated word in "${label}"`);
  }
  ok(`every site key yields a clean label (${seen.size} keys)`, !bad.length, bad.slice(0, 12).join(" | "));
}

// ---- readability: the cases the mechanical transform gets WRONG ----
// The clean-label invariant above is a floor (no underscores, no stray abbreviations); it passes on an
// empty PART_LABEL. These pin the judgements the table exists to make, so an override cannot be dropped.
{
  const lab = (level, part) => siteLabel({ level, part });
  ok("the motor strip is named by body part first, not `motor leg`",
     lab("cortex", "motor_leg") === "leg motor cortex", lab("cortex", "motor_leg"));
  ok("a vascular territory says `territory`, not `ACA cortex`",
     /territory/.test(lab("cortex", "aca")), lab("cortex", "aca"));
  ok("an eponym part is spelled as the eponym",
     /Friedreich/.test(lab("combined_degeneration", "friedreich")), lab("combined_degeneration", "friedreich"));
  ok("a nerve names where it is compressed",
     lab("nerve", "ulnar_elbow") === "ulnar nerve at the elbow", lab("nerve", "ulnar_elbow"));
  ok("a plexus cord is not confusable with the spinal cord",
     /brachial plexus/.test(lab("plexus", "lateral_cord")) && /cord/.test(lab("cord", "lateral")),
     `${lab("plexus", "lateral_cord")} vs ${lab("cord", "lateral")}`);
  ok("a cranial-nerve course site names the nerve and the segment",
     /VII/.test(lab("skull_base", "vii_geniculate")) && /geniculate/.test(lab("skull_base", "vii_geniculate")),
     lab("skull_base", "vii_geniculate"));
  ok("no label still ends in a bare level word for the implied levels",
     !/ skull base$/.test(lab("skull_base", "cavernous_sinus")), lab("skull_base", "cavernous_sinus"));
}

// ---- reused part names stay distinguishable ----
{
  const lat = SITES.filter(s => s.part === "lateral");
  const labels = new Set(lat.map(siteLabel));
  ok("the 5 levels sharing part `lateral` get distinct labels", labels.size === new Set(lat.map(s => s.level)).size,
     [...labels].join(" / "));
}

console.log("\nNeuroLocaliser — DISPLAY NAMING\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}${r.detail ? "  → " + r.detail : ""}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);

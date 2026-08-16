// app-naming.test.js — display-naming invariants (app/labels.js). The app must speak clinical English:
// no raw ids, no un-expanded abbreviations, no underscores on screen.
import { ABBREV, humanisePart, PART_LABEL, siteLabel, plainSiteName, shortFindingLabel } from "../app/labels.js";
import { candidateSites } from "../src/engine/inverse.js";
import { FINDINGS } from "../src/model/findings.js";

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

// ---- plainSiteName: eponym wins the headline; plain anatomy fills the subtitle ----
{
  const byId = id => SITES.find(s => s.id === id);
  const aca = byId("right_cortex_aca");           // HAS an eponym
  const leg = byId("right_cortex_motor_leg");     // has NO eponym (one of the 52)
  ok("an eponym site keeps its eponym as the name", !!aca && /anterior cerebral/i.test(plainSiteName(aca).name));
  ok("an eponym site gets plain anatomy in the subtitle", !!aca && plainSiteName(aca).sub.length > 0);
  ok("a no-eponym site is named in plain English, not schema",
     !!leg && !plainSiteName(leg).name.includes("_") && !/\(motor_leg\)/.test(plainSiteName(leg).name));
  ok("a no-eponym site names its side", !!leg && /^right/i.test(plainSiteName(leg).name));
  // the named nerves/roots restate their label in `territory`; the subtitle must not print it twice
  const uln = byId("right_nerve_ulnar_elbow");
  ok("a subtitle never restates the label it sits under",
     !uln || !/(ulnar nerve at the elbow).*\1/i.test(plainSiteName(uln).sub), uln && plainSiteName(uln).sub);
  ok("raw keeps the id triple for the disclosure",
     !!leg && plainSiteName(leg).raw === "right · cortex · motor_leg", leg && plainSiteName(leg).raw);
}
// ---- no site anywhere renders an underscore or an empty name ----
{
  const bad = SITES.filter(s => { const p = plainSiteName(s);
    return !p.name || !p.name.trim() || p.name.includes("_"); });
  ok(`no site yields an empty or schema name (${SITES.length} sites)`, !bad.length,
     bad.slice(0, 5).map(s => s.id).join(" | "));
}
// ---- shortFindingLabel: chip-sized, never empty, for every finding ----
{
  const ids = Object.keys(FINDINGS);
  const tooLong = ids.filter(f => shortFindingLabel(f).length > 32);
  const empty = ids.filter(f => !shortFindingLabel(f).trim());
  ok(`every finding label fits 32 chars (${ids.length} findings)`, !tooLong.length, tooLong.slice(0, 5).join(" | "));
  ok("no finding label is empty", !empty.length, empty.slice(0, 5).join(" | "));
  ok("a short desc passes through unchanged", shortFindingLabel("weak_arm") === "Arm weakness", shortFindingLabel("weak_arm"));
  ok("a parenthetical is trimmed", shortFindingLabel("weak_adduction") === "Weak adduction", shortFindingLabel("weak_adduction"));
}

console.log("\nNeuroLocaliser — DISPLAY NAMING\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}${r.detail ? "  → " + r.detail : ""}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);

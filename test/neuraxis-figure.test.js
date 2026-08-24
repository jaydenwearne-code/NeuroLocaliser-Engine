// neuraxis-figure.test.js — the authored figure is CONTENT; these assert the RULES that keep it complete,
// not the coordinate values. A new site must never be able to land undetermined.
import { MX, ANCHOR, zoneOf, anchorFor } from "../app/neuraxis-figure.js";
import { candidateSites } from "../src/engine/inverse.js";

let pass = 0, fail = 0;
const ok = (l, c, extra = "") => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l + (c ? "" : "  " + extra)); };

const sites = candidateSites();

// ---- 1. every level the diagram can receive has an anchor ----
// Keyed to candidateSites(), NOT SITES: the composers add 18 levels on top of the model's 18.
const levels = [...new Set(sites.map(s => s.level))];
const missing = levels.filter(l => !ANCHOR[l]);
ok(`every candidateSites() level has an anchor (${levels.length} levels)`, missing.length === 0, missing.join(", "));
ok("no anchor is orphaned (every ANCHOR key is a real level)",
   Object.keys(ANCHOR).every(k => levels.includes(k)),
   Object.keys(ANCHOR).filter(k => !levels.includes(k)).join(", "));

// ---- 2. zone is DERIVED from LEVEL + part, never authored, and only where a cross-section exists ----
const ZONE_WORDS = ["anterior", "posterior", "lateral", "medial", "central"];
ok("zoneOf returns null for a part that declares no zone", zoneOf("subcortex", "corona_radiata") === null);
ok("zoneOf reads a bare zone name at a cross-sectional level",
   zoneOf("medulla", "lateral") === "lateral" && zoneOf("medulla", "medial") === "medial");
ok("zoneOf reads basis_pontis as ventral-equivalent (anterior)", zoneOf("pons", "basis_pontis") === "anterior");
ok("zoneOf reads a compound name", zoneOf("pons", "lateral_trigeminal") === "lateral");

// A NAMED STRUCTURE THAT MERELY CONTAINS A POSITION WORD MUST NOT RESOLVE TO A ZONE. Deriving from the
// part name alone read the brachial plexus cords as spinal cord zones, the semicircular canals as canal
// positions, and the posterior triangle of the neck as "posterior" — nudging pins on a claim the name
// never made.
for (const [level, part] of [["plexus", "lateral_cord"], ["plexus", "medial_cord"], ["plexus", "posterior_cord"],
                             ["peripheral_vestibular", "anterior_canal"], ["peripheral_vestibular", "posterior_canal"],
                             ["skull_base", "xi_posterior_triangle"], ["subcortex", "anterior_choroidal"],
                             ["motor_unit", "anterior_horn"], ["cortex", "watershed_anterior"]]) {
  ok(`"${part}" at ${level} is a NAMED STRUCTURE, not a zone`, zoneOf(level, part) === null);
}

const zoned = [...new Set(sites.map(s => `${s.level}|${s.part}`))].filter(k => zoneOf(...k.split("|")) !== null);
const zonedParts = [...new Set(zoned.map(k => k.split("|")[1]))];
ok(`exactly the cross-sectional parts resolve (${zonedParts.length})`, zonedParts.length === 7, zonedParts.sort().join(", "));
ok("every resolved zone is one of the five zone words",
   zoned.every(k => ZONE_WORDS.includes(zoneOf(...k.split("|")))));

// ---- 3. all FOUR side values place a pin; bilateral/midline sit on the midline ----
for (const side of ["left", "right", "bilateral", "midline"]) {
  const s = sites.find(x => x.side === side);
  ok(`side "${side}" is represented in candidateSites()`, !!s);
  const a = anchorFor(s.level, s.part, s.side);
  ok(`side "${side}" yields finite coordinates`, Number.isFinite(a.x) && Number.isFinite(a.y));
}
const cordL = anchorFor("cord", "hemi", "left"), cordR = anchorFor("cord", "hemi", "right");
ok("patient's LEFT is left of the midline (anatomical convention)", cordL.x < MX);
ok("patient's RIGHT is right of the midline", cordR.x > MX);
ok("left and right mirror about the midline", Math.abs((MX - cordL.x) - (cordR.x - MX)) < 0.001);
ok("midline sits ON the midline", anchorFor("cord", "hemi", "midline").x === MX);
ok("bilateral sits ON the midline", anchorFor("cord", "hemi", "bilateral").x === MX);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

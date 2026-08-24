// neuraxis-figure.test.js — the authored figure is CONTENT; these assert the RULES that keep it complete,
// not the coordinate values. A new site must never be able to land undetermined.
import { MX, FIG_W, FIG_H, ANCHOR, CROP, zoneOf, anchorFor, cropFor,
         baseFigure, regionCaptions, sideCaptions } from "../app/neuraxis-figure.js";
import { candidateSites } from "../src/engine/inverse.js";
import { compartmentOf } from "../src/model/compartments.js";

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

// ---- 4. crop boxes: one per compartment, and a union that always lands inside the figure ----
const comps = [...new Set(sites.map(s => compartmentOf(s)))];
const missingC = comps.filter(c => !CROP[c]);
ok(`every compartment has a crop box (${comps.length} compartments)`, missingC.length === 0, missingC.join(", "));
ok("no crop box is orphaned", Object.keys(CROP).every(k => comps.includes(k)),
   Object.keys(CROP).filter(k => !comps.includes(k)).join(", "));

const whole = cropFor(comps);
const inside = (b, o) => b[0] >= o[0] && b[1] >= o[1] && b[0] + b[2] <= o[0] + o[2] && b[1] + b[3] <= o[1] + o[3];
ok("the union crop contains every compartment's box", comps.every(c => inside(CROP[c], whole)));
ok("the union crop is larger than any single box", comps.every(c => CROP[c][2] * CROP[c][3] <= whole[2] * whole[3]));
ok("the union crop stays inside the figure",
   whole[0] >= 0 && whole[1] >= 0 && whole[0] + whole[2] <= FIG_W && whole[1] + whole[3] <= FIG_H);

const periph = cropFor(["root", "plexus", "nerve"]);
ok("a peripheral crop excludes the cerebrum", periph[1] > ANCHOR.cortex[1]);
ok("a peripheral crop is smaller than the whole figure", periph[3] < whole[3]);
ok("no compartments yields the whole figure", cropFor([]).join() === [0, 0, FIG_W, FIG_H].join());

for (const c of comps) {
  const [x, y, w, h] = CROP[c];
  ok(`crop "${c}" is inside the figure and non-empty`,
     w > 0 && h > 0 && x >= 0 && y >= 0 && x + w <= FIG_W && y + h <= FIG_H, `${x},${y},${w},${h}`);
  // every level living in this compartment must actually fall inside its box, or a crop can hide a pin
  for (const s of sites.filter(s => compartmentOf(s) === c)) {
    const a = anchorFor(s.level, s.part, s.side);
    if (!(a.y >= y && a.y <= y + h)) { ok(`crop "${c}" contains ${s.level} (y=${a.y})`, false, `box y ${y}..${y + h}`); break; }
  }
}
ok("every candidate's anchor falls inside its own compartment's crop",
   sites.every(s => { const b = CROP[compartmentOf(s)], a = anchorFor(s.level, s.part, s.side);
                      return b && a.y >= b[1] && a.y <= b[1] + b[3] && a.x >= b[0] && a.x <= b[0] + b[2]; }));

// ---- 5. the base figure ----
const fig = baseFigure();
ok("baseFigure returns an SVG fragment", typeof fig === "string" && fig.includes("<path"));
ok("the figure is authored as one half and MIRRORED (no second copy to drift)",
   (fig.match(/scale\(-1,1\)/g) || []).length === 1);
ok("anatomy strokes never use --line (invisible in dark; must be --muted)",
   !/stroke:\s*var\(--line\)/.test(fig));
ok("the figure paints no accent inline", !/--terra/.test(fig));
ok("the figure carries no inline style at all (classes only)", !/style="/.test(fig));
const wide = sideCaptions([0, 0, FIG_W, FIG_H]);
ok("side captions name the patient's sides explicitly", /left/i.test(wide) && /right/i.test(wide));
ok("side captions are placed either side of the midline",
   wide.includes(String(MX - 250)) && wide.includes(String(MX + 250)));
ok("side captions are DROPPED when the crop has no room for both",
   sideCaptions([264, 504, 232, 152]) === "");
ok("region captions are present", regionCaptions([0, 0, FIG_W, FIG_H]).includes("<text"));
ok("a region caption outside the crop is not drawn",
   !regionCaptions([268, 380, 224, 200]).includes("cerebrum"));
ok("midline region captions sit in the crop's left margin, clear of midline pins",
   /x="274"/.test(regionCaptions([268, 380, 224, 200])) || regionCaptions([268, 380, 224, 200]) === "");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

// neuraxis-figure.test.js — the authored figure is CONTENT; these assert the RULES that keep it complete,
// not the coordinate values. A new site must never be able to land undetermined.
import { MX, FIG_W, FIG_H, ANCHOR, zoneOf, anchorFor,
         baseFigure, regionCaptions, sideCaptions } from "../app/neuraxis-figure.js";
import { bandY } from "../app/neuraxis-figure.js";
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

// ---- 4. THE CROP IS DERIVED, so there is no table to assert ----
// It used to be a hand-authored box per compartment; it went stale twice when the figure moved and only
// an invariant caught it. neuraxis-diagram.js now computes it from the pins on screen.

// ---- 5. the base figure ----
const fig = baseFigure();
ok("baseFigure returns an SVG fragment", typeof fig === "string" && fig.includes("nx-band-box"));
// The orthogonal schema is symmetric by construction — every exit rail is drawn on both sides from the
// same rank — so there is no mirrored copy to keep in step any more.
ok("the figure has no oblique lines at all",
   !/<line[^>]*x1="([\d.]+)"[^>]*y1="([\d.]+)"[^>]*x2="(?!\1)[\d.]+"[^>]*y2="(?!\2)[\d.]+"/.test(fig),
   "an oblique line is in the base figure");
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

// ---- 6. EVERY ANATOMY CLASS MUST HAVE A CSS RULE, AND EVERY RULE MUST BE USED ----
// An SVG shape with no `fill` declared defaults to BLACK. A missing rule therefore does not degrade
// quietly — it paints a solid wedge over the anatomy, which is exactly what happened when the brainstem
// detail classes were introduced during the traced-plate composition. Nothing caught it but looking.
// The reverse direction matters too: this project deletes dead CSS rather than letting it accumulate.
import { readFileSync } from "node:fs";
const HTML = readFileSync(new URL("../app/index.html", import.meta.url), "utf8");
const STYLE = HTML.slice(HTML.indexOf("<style>"), HTML.indexOf("</style>"));
const figSVG = baseFigure();

const usedClasses = [...new Set([...figSVG.matchAll(/class="(an-[a-z0-9-]+)"/g)].map(m => m[1]))];
const ruledClasses = [...new Set([...STYLE.matchAll(/\.(an-[a-z0-9-]+)/g)].map(m => m[1]))];

const unstyled = usedClasses.filter(c => !ruledClasses.includes(c));
ok(`every anatomy class in the figure has a CSS rule (${usedClasses.length} classes)`,
   unstyled.length === 0, "would paint BLACK: " + unstyled.join(", "));

const dead = ruledClasses.filter(c => !usedClasses.includes(c));
ok("no anatomy CSS rule is dead", dead.length === 0, "unused: " + dead.join(", "));

// ---- 7. ONE LANE PER TRACT, ALL DISTINCT ----
// Under the orthogonal schema a tract is a single vertical line at a fixed x, so the elaborate ordering
// checks this file used to carry are gone: there is no lateral drift to keep ordered, and two verticals in
// different lanes cannot touch. All that remains to assert is that the lanes ARE distinct and ordered.
import { TRACT_LANE, isPlanar } from "../app/neuraxis-figure.js";
const laneIds = Object.keys(TRACT_LANE);
const laneVals = laneIds.map(id => TRACT_LANE[id]);
ok(`every tract has a lane (${laneIds.length})`, laneVals.every(v => Number.isFinite(v) && v > 0));
ok("no two tracts share a lane", new Set(laneVals).size === laneVals.length,
   laneIds.map(id => `${id}:${TRACT_LANE[id]}`).join(" "));
ok("lanes run medial to lateral in order", laneVals.every((v, i) => i === 0 || v > laneVals[i - 1]));
ok("the non-planar pathways are declared", laneIds.filter(id => !isPlanar(id)).length === 2,
   laneIds.filter(id => !isPlanar(id)).join(", "));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

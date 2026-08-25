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

// ---- 7. LANE ORDER MUST NOT SWAP — AT ANY HEIGHT, NOT JUST AT SHARED LEVELS ----
// Two pathways that trade lateral places are forced to cross, because a flat coronal drawing has no
// dorsoventral axis to separate them with.
//
// COMPARING ONLY AT SHARED LEVELS IS NOT ENOUGH, and that gap cost several rounds. Spinothalamic and
// oculosympathetic agree at the two levels they both declare (medulla, cord) and still cross, because
// spinothalamic's lane narrows from dx 50 at the subcortex to 17 at the medulla and sweeps across the
// other lane in between. A lane is a CONTINUOUS line between its knots, so the order has to hold at every
// height where both tracts exist.
import { TRACT_LANE } from "../app/neuraxis-figure.js";
const laneCurve = id => Object.entries(TRACT_LANE[id])
  .filter(([lvl]) => !lvl.startsWith("_") && ANCHOR[lvl])
  .map(([lvl, v]) => [ANCHOR[lvl][1], v[0]])
  .sort((a, b) => a[0] - b[0]);
const dxAt = (curve, y) => {
  if (y < curve[0][0] || y > curve[curve.length - 1][0]) return null;
  for (let i = 0; i < curve.length - 1; i++) {
    const [y0, d0] = curve[i], [y1, d1] = curve[i + 1];
    if (y >= y0 && y <= y1) return y1 === y0 ? d0 : d0 + (d1 - d0) * (y - y0) / (y1 - y0);
  }
  return null;
};
// A non-planar pathway is exempt: its separation from the others is in depth, not on the page.
const tractIds = Object.keys(TRACT_LANE).filter(id => TRACT_LANE[id]._planar !== false);
ok("the non-planar pathways are declared", Object.keys(TRACT_LANE).length - tractIds.length === 2);
let swaps = 0;
for (let i = 0; i < tractIds.length; i++) {
  for (let j = i + 1; j < tractIds.length; j++) {
    const A = laneCurve(tractIds[i]), B = laneCurve(tractIds[j]);
    if (A.length < 2 || B.length < 2) continue;
    const lo = Math.max(A[0][0], B[0][0]), hi = Math.min(A[A.length - 1][0], B[B.length - 1][0]);
    if (hi - lo < 20) continue;                       // barely overlap; nothing to order
    // TWO LANES THAT MEET ARE AS BAD AS TWO THAT SWAP: equal lanes put the lines on top of each other and
    // the smoothing then weaves them. Treat a near-zero gap as a violation rather than skipping it, which
    // is how trigeminothalamic and spinothalamic both ended up at midbrain dx 20.
    const signs = new Set();
    let touched = false;
    for (let y = lo; y <= hi; y += 4) {
      const a = dxAt(A, y), b = dxAt(B, y);
      if (a === null || b === null) continue;
      if (Math.abs(a - b) < 2) { touched = true; continue; }
      signs.add(Math.sign(a - b));
    }
    if (signs.size > 1 || touched) {
      swaps++;
      const at = [];
      for (let y = lo; y <= hi; y += 4) {
        const a = dxAt(A, y), b = dxAt(B, y);
        if (a !== null && b !== null) at.push(`${Math.round(y)}:${a.toFixed(0)}v${b.toFixed(0)}`);
      }
      ok(`${tractIds[i]} and ${tractIds[j]} keep clear, ordered lanes at every height`, false,
         at.filter((_, k) => k % 6 === 0).join(" "));
    }
  }
}
ok("no two tract lanes swap order or touch at any height", swaps === 0, `${swaps} bad pairs`);

// ---- 8. NO DEAD LANES ----
// A lane only takes effect at a level the tract's COURSE actually visits. A midbrain lane was once added
// to trigeminothalamic to steer it between the thalamus and the pons; that tract has no midbrain in its
// course, so the entry did nothing and the line kept cutting through its neighbour. Dead data that looks
// like a fix is worse than no data.
const { TRACTS } = await import("../src/engine/../model/tracts.js");
for (const tr of TRACTS) {
  const lanes = TRACT_LANE[tr.id];
  if (!lanes) continue;
  const courseLevels = new Set(tr.course.map(w => w.level));
  const dead = Object.keys(lanes).filter(k => !k.startsWith("_") && !courseLevels.has(k));
  ok(`every lane on "${tr.id}" is a level its course visits`, dead.length === 0, "dead: " + dead.join(", "));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

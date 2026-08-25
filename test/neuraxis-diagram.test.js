// neuraxis-diagram.test.js — the builder is a pure string function (DOM-free, testable in node).
import { neuraxisSVG, neuraxisIndex, neuraxisLegend } from "../app/neuraxis-diagram.js";
import { tractsFor } from "../src/engine/tracts.js";
import { solve } from "../src/engine/inverse.js";
import { MX, ANCHOR, isPlanar } from "../app/neuraxis-figure.js";
import { plainSiteName } from "../app/labels.js";

let pass = 0, fail = 0;
const ok = (l, c, extra = "") => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l + (c ? "" : "  " + extra)); };
const esc0 = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const build = toks => {
  const obs = new Set(toks);
  const r = solve(obs, {});
  return { r, tf: tractsFor(obs, {}), cands: r.display };
};

const hemi = build(["weak_arm@left", "weak_leg@left"]);
const svg = neuraxisSVG(hemi.cands, hemi.tf, { selectedId: hemi.cands[0].site.id, labelFor: s => s.id });

ok("returns an <svg>", typeof svg === "string" && svg.trim().startsWith("<svg") && svg.includes("</svg>"));
ok("every candidate carries a data-k handle", hemi.cands.every(c => svg.includes(`data-k="${c.site.id}"`)));
ok("the selected candidate is marked",
   /data-sel="1"/.test(svg) && new RegExp(`data-sel="1" data-k="${hemi.cands[0].site.id}"`).test(svg));
ok("empty input yields empty string", neuraxisSVG([], [], {}) === "");

// ---- THE DEFECT THIS INCREMENT EXISTS TO FIX ----
// Foot drop and Cauda equina implicate NO long tract, so the old tract-driven diagram rendered "".
for (const [name, toks] of [
  ["foot drop", ["weak_ankle_dorsiflexion@left", "weak_great_toe_extension@left", "weak_foot_eversion@left"]],
  ["cauda equina", ["saddle_anaesthesia@midline", "sphincter_dysfunction@midline", "radicular_pain@midline", "anal_wink_loss@midline"]],
]) {
  const c = build(toks);
  ok(`${name} implicates no tract (the precondition of the bug)`, c.tf.length === 0);
  const s = neuraxisSVG(c.cands, c.tf, { labelFor: x => x.id });
  ok(`${name} STILL renders a figure`, s.startsWith("<svg") && s.includes("<path"));
  ok(`${name} pins its candidates`, c.cands.some(x => s.includes(`data-k="${x.site.id}"`)));
}

// ---- laterality: the one fact the old diagram could not express ----
// Read the pin's own recorded centre rather than a geometry attribute: a bilateral pin is a <rect> with
// `x` (a left edge), not a <circle> with `cx`, so keying on cx would silently skip exactly the case the
// midline assertions below exist to check.
const xOf = (s, id) => { const m = new RegExp(`data-k="${id}" data-x="([\\d.]+)"`).exec(s); return m ? +m[1] : null; };
const left = build(["weak_arm@left"]), right = build(["weak_arm@right"]);
const sL = neuraxisSVG(left.cands, left.tf, { labelFor: x => x.id });
const sR = neuraxisSVG(right.cands, right.tf, { labelFor: x => x.id });
const pickL = left.cands.find(c => c.site.side === "right");   // a LEFT-sided finding implicates RIGHT sites
const pickR = right.cands.find(c => c.site.side === "left");
ok("a right-sided site pins right of the midline", pickL && xOf(sL, pickL.site.id) > MX);
ok("a left-sided site pins left of the midline", pickR && xOf(sR, pickR.site.id) < MX);

// ---- clustering: NMOSD is the stress case at 47 candidates ----
const nmo = build(["rapd@left", "va_reduced_no_pinhole@left", "weak_leg@left", "weak_leg@right",
                   "spinothalamic@left", "spinothalamic@right", "babinski@left", "babinski@right"]);
const sN = neuraxisSVG(nmo.cands, nmo.tf, { labelFor: x => x.id });
ok(`NMOSD is a dense case (${nmo.cands.length} candidates)`, nmo.cands.length >= 20);
ok("a dense case clusters rather than overlapping", sN.includes("nx-cluster"));
ok("every candidate is still reachable in the markup",
   nmo.cands.every(c => sN.includes(`data-k="${c.site.id}"`)));

// ---- bilateral and midline each render exactly ONE pin, on the midline ----
const mid = build(["saddle_anaesthesia@midline", "sphincter_dysfunction@midline"]);
const sM = neuraxisSVG(mid.cands, mid.tf, { labelFor: x => x.id });
const midCand = mid.cands.find(c => c.site.side === "midline" || c.site.side === "bilateral");
ok("the cauda case has a midline/bilateral candidate", !!midCand);
if (midCand) {
  ok("a midline/bilateral candidate renders exactly one pin",
     (sM.match(new RegExp(`data-k="${midCand.site.id}"`, "g")) || []).length === 1);
  ok("a midline/bilateral candidate sits on the midline", xOf(sM, midCand.site.id) === MX);
}

// ---- the index ----
const idx = neuraxisIndex(nmo.cands, { selectedId: nmo.cands[0].site.id, labelFor: s => s.id });
ok("the index is an ordered list", idx.startsWith("<ol") && idx.includes("</ol>"));
ok("EVERY candidate appears in the index, including clustered ones",
   nmo.cands.every(c => idx.includes(`data-k="${c.site.id}"`)));
ok("the index numbering matches the figure's (both follow solve() order)",
   nmo.cands.every((c, i) => new RegExp(`data-k="${c.site.id}"[^>]*>\\s*<b>${i + 1}</b>`).test(idx)));
ok("empty input yields empty string", neuraxisIndex([], {}) === "");

// A row the reader cannot tell apart from the row above it is a defect, not density. MS renders
// "Anterior choroidal artery syndrome" twice because dedup is by site.id (left/right differ) while the
// display name drops the side.
const dup = neuraxisIndex(
  [{ site: { id: "left_x", level: "cord", part: "hemi", side: "left" } },
   { site: { id: "right_x", level: "cord", part: "hemi", side: "right" } }],
  { labelFor: () => "Same Name Syndrome" });
const texts = [...dup.matchAll(/<\/b>([^<]+)</g)].map(m => m[1].trim());
ok("identical display names are disambiguated by side", new Set(texts).size === 2, texts.join(" | "));
ok("disambiguation names the side", texts.some(t => /left/i.test(t)) && texts.some(t => /right/i.test(t)));

// ...but a name that is ALREADY unique must be left alone — disambiguating everything would be noise.
const uniq = neuraxisIndex(
  [{ site: { id: "a", level: "cord", part: "hemi", side: "left" } },
   { site: { id: "b", level: "cord", part: "hemi", side: "right" } }],
  { labelFor: s => (s.id === "a" ? "Alpha" : "Beta") });
ok("unique names are not disambiguated", /<\/b>Alpha</.test(uniq) && /<\/b>Beta</.test(uniq));

// the real defect, on the real case: MS renders two identical rows today
const ms = build(["rapd@left", "va_reduced_no_pinhole@left", "dorsal_sensory@left", "dorsal_sensory@right", "sensory_ataxia@none"]);
const msIdx = neuraxisIndex(ms.cands, { labelFor: s => plainSiteName(s, {}).name });
const msTexts = [...msIdx.matchAll(/<\/b>([^<]+)</g)].map(m => m[1].trim());
ok(`no two index rows are identical on the MS case (${msTexts.length} rows)`,
   new Set(msTexts).size === msTexts.length,
   msTexts.filter((x, i) => msTexts.indexOf(x) !== i).join(" | "));

// ---- the tract overlay ----
const wall = build(["cn8_vertigo@left", "face_pain_loss@left", "spinothalamic@right",
                    "ptosis@left", "miosis@left", "limb_ataxia@left"]);
const sW = neuraxisSVG(wall.cands, wall.tf, { labelFor: x => x.id });
ok(`Wallenberg implicates several tracts (${wall.tf.length})`, wall.tf.length >= 3);
ok("each implicated tract draws a path", (sW.match(/class="nx-tract/g) || []).length >= wall.tf.length);
// The legend is HTML beside the figure, not inside it — see neuraxisLegend.
const legW = neuraxisLegend(wall.tf);
ok("the legend names each implicated tract",
   wall.tf.every(t => legW.includes(esc0(t.tract.label || t.tract.id.replace(/_/g, " ")))), legW.slice(0, 200));
ok("the legend is NOT inside the figure, where it covered the pins", !sW.includes("nx-legend"));
ok("a tractless case has no legend", neuraxisLegend([]) === "");

// PRESENT IN THE MARKUP IS NOT THE SAME AS VISIBLE ON THE SCREEN. The legend was positioned in FIGURE
// coordinates while the viewBox is CROPPED, so Wallenberg drew four tracts and showed no legend at all —
// and the assertion above passed the whole time. Assert it lands inside the viewBox.
const inView = (s, tx, ty) => {
  const vb = /viewBox="([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)"/.exec(s).slice(1).map(Number);
  return tx >= vb[0] && tx <= vb[0] + vb[2] && ty >= vb[1] && ty <= vb[1] + vb[3];
};
// same trap for the locator: it must sit inside the crop, and it must contain an actual thumbnail rather
// than an empty frame (it shipped as an empty box first time and only looking at it revealed that).
const locBg = /<rect class="nx-loc-bg" x="([-\d.]+)" y="([-\d.]+)"/.exec(sW);
ok("the locator is INSIDE the cropped viewBox", locBg && inView(sW, +locBg[1], +locBg[2]));
ok("the locator contains a real thumbnail, not an empty frame", /nx-loc-fig[^>]*>\s*<g class="anatomy"/.test(sW));

// every pin must land inside the viewBox too — a crop that hides a candidate is worse than no crop
const vb = /viewBox="([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)"/.exec(sW).slice(1).map(Number);
const pinXs = [...sW.matchAll(/data-x="([-\d.]+)"/g)].map(m => +m[1]);
ok(`every pin is inside the cropped viewBox (${pinXs.length} pins)`,
   pinXs.every(x => x >= vb[0] && x <= vb[0] + vb[2]));

// DISTINGUISHED BY FORM AS WELL AS HUE, so the lines stay separable in greyscale and for a colourblind
// reader — the rule the danger chip already follows.
ok("tracts carry a dash pattern as well as a colour", /stroke-dasharray/.test(sW));

// A tract with no modelled decussation draws no crossing. oculosympathetic is UNCROSSED throughout —
// which is why Horner's is ipsilateral — so its empty decussation is an ASSERTION, not a gap to fill.
const os = wall.tf.find(t => t.tract.id === "oculosympathetic");
ok("oculosympathetic is modelled as uncrossed", os && !os.decussation.between && !os.decussation.inLevel);
const st = wall.tf.find(t => t.tract.id === "spinothalamic");
ok("a tract WITH a decussation draws a crossing marker", st && sW.includes("nx-decus"));

// a case with no tracts still renders, and simply has no overlay
const fd = build(["weak_ankle_dorsiflexion@left", "weak_great_toe_extension@left", "weak_foot_eversion@left"]);
const sF = neuraxisSVG(fd.cands, fd.tf, { labelFor: x => x.id });
ok("a tractless case renders no overlay", !sF.includes("nx-tract"));

// ---- THE SECOND GATE ----
// The builder handling a tractless case is only half the fix: whyCard() in app.js had its OWN early
// return for !tf.length that skipped the diagram entirely, so foot drop rendered nothing even after
// neuraxisSVG was correct. Both unit tests above passed while the app was still broken — this was found
// by driving the browser, and this assertion exists so it cannot come back.
//
// app.js is DOM-bound and cannot be imported in node, so the source is scanned as TEXT — the same idiom
// test/brand.test.js uses to scan the stylesheet.
import { readFileSync } from "node:fs";
const APP = readFileSync(new URL("../app/app.js", import.meta.url), "utf8");
const why = APP.slice(APP.indexOf("function whyCard("));
const body = why.slice(0, why.indexOf("\nfunction "));
const early = body.slice(body.indexOf("if (!tf.length)"), body.indexOf("const course ="));
ok("whyCard builds the diagram BEFORE its tractless early return",
   body.indexOf("const diagram =") < body.indexOf("if (!tf.length)"));
ok("whyCard's tractless branch renders the diagram", /\$\{diagram\}/.test(early), early.slice(0, 200));
ok("whyCard builds the diagram exactly once (no second copy to drift)",
   (body.match(/const diagram =/g) || []).length === 1);

// ---- THE NON-CROSSING INVARIANT ----
// Owner's report, 2026-08-25: "your lines cross one another when they aren't decussating, which doesn't
// happen in neuroanatomy". Measured at the time: WALLENBERG ALONE RENDERED 16 PAIRWISE CROSSINGS, none at
// a decussation. The cause was that every tract at a level used the SAME anchor point, so paths were
// guaranteed to converge. This asserts the anatomy directly.
// Grouped by tract, because one tract can be drawn as several strokes (the oculosympathetic's three-neuron
// chain, and any tract split at its decussation).
function strokesByTract(svg) {
  const g = {};
  for (const m of svg.matchAll(/class="nx-tract nx-tract-(\d+)" points="([^"]+)"/g))
    (g[m[1]] ??= []).push(m[2].trim().split(/\s+/).map(p => p.split(",").map(Number)));
  return g;
}
function segmentsCross(a, b, c, d) {
  const o = (p, q, r) => Math.sign((q[0]-p[0])*(r[1]-p[1]) - (q[1]-p[1])*(r[0]-p[0]));
  return o(a,b,c) !== o(a,b,d) && o(c,d,a) !== o(c,d,b);
}
// A decussation IS a crossing, so intersections are allowed where one is declared. A `between`
// decussation occupies the whole INTERVAL between its two levels rather than a point — the pyramidal
// decussation is declared between medulla and cord and the paths converge across that entire span.
function decussationBands(tf) {
  const bands = [];
  for (const t of tf) {
    const d = t.decussation || {};
    if (d.between && ANCHOR[d.between[0]] && ANCHOR[d.between[1]]) {
      const a = ANCHOR[d.between[0]][1], b = ANCHOR[d.between[1]][1];
      bands.push([Math.min(a, b) - 20, Math.max(a, b) + 20]);
    } else if (d.inLevel && ANCHOR[d.inLevel]) {
      bands.push([ANCHOR[d.inLevel][1] - 40, ANCHOR[d.inLevel][1] + 40]);
    }
  }
  return bands;
}
const inBand = (y, bands) => bands.some(([lo, hi]) => y >= lo && y <= hi);

// NO EXEMPTIONS. There was one — trigeminothalamic against its neighbours — and it is gone, because the
// cause was a missing midbrain segment in the model rather than anything about the drawing. Fixing the
// model removed the need for the exemption entirely, which is the outcome an exemption should always be
// pushing towards.
const exemptPair = () => false;

let totalCrossings = 0, checked = 0;
for (const [name, toks] of [
  ["Wallenberg", ["cn8_vertigo@left","face_pain_loss@left","spinothalamic@right","ptosis@left","miosis@left","limb_ataxia@left"]],
  ["hemiparesis", ["weak_arm@left","weak_leg@left"]],
  ["MS", ["rapd@left","va_reduced_no_pinhole@left","dorsal_sensory@left","dorsal_sensory@right","sensory_ataxia@none"]],
  ["NMOSD", ["rapd@left","va_reduced_no_pinhole@left","weak_leg@left","weak_leg@right","spinothalamic@left","spinothalamic@right","babinski@left","babinski@right"]],
]) {
  const c = build(toks);
  if (!c.tf.length) continue;
  const s = neuraxisSVG(c.cands, c.tf, { labelFor: x => x.id });
  const g = strokesByTract(s), bands = decussationBands(c.tf);
  const keys = Object.keys(g);
  let n = 0;
  for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) {
    // A NON-PLANAR pathway is exempt. The oculosympathetic ascends on the carotid and the visual pathway
    // runs from the orbit — both ANTERIOR to the brainstem, separated from the rest by depth. A coronal
    // drawing has no depth axis, so their lines must traverse other lanes on the page while crossing
    // nothing in the body.
    if (!isPlanar(c.tf[+keys[i]].tract.id) || !isPlanar(c.tf[+keys[j]].tract.id)) continue;
    if (exemptPair(c.tf[+keys[i]].tract.id, c.tf[+keys[j]].tract.id)) continue;
    for (const A of g[keys[i]]) for (const B of g[keys[j]])
      for (let a = 0; a < A.length - 1; a++) for (let b = 0; b < B.length - 1; b++) {
        if (!segmentsCross(A[a], A[a+1], B[b], B[b+1])) continue;
        const y = (A[a][1] + A[a+1][1] + B[b][1] + B[b+1][1]) / 4;
        if (!inBand(y, bands)) n++;
      }
  }
  checked++;
  totalCrossings += n;
  ok(`${name}: no tract path crosses another away from a decussation (${c.tf.length} tracts)`, n === 0, `${n} crossings`);
}
ok(`the invariant actually exercised several cases (${checked})`, checked >= 3);
ok(`total spurious crossings across every case is zero`, totalCrossings === 0, `${totalCrossings} found`);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

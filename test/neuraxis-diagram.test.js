// neuraxis-diagram.test.js — the builder is a pure string function (DOM-free, testable in node).
import { neuraxisSVG, neuraxisIndex } from "../app/neuraxis-diagram.js";
import { tractsFor } from "../src/engine/tracts.js";
import { solve } from "../src/engine/inverse.js";
import { MX } from "../app/neuraxis-figure.js";
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
ok("the legend names each implicated tract",
   wall.tf.every(t => sW.includes(esc0(t.tract.id)) || sW.toLowerCase().includes(t.tract.id.replace(/_/g, " "))));

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
ok("a tractless case renders no overlay and no legend", !sF.includes("nx-tract") && !sF.includes("nx-legend"));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

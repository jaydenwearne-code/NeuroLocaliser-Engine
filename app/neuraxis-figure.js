// neuraxis-figure.js — CONTENT ONLY for the neuraxis drawing: the midline, where each level sits, how a
// part name nudges a pin within its level, and the authored half-figure itself.
//
// It imports NOTHING from src/. That split is deliberate and matches src/data/multifocal.js against
// src/engine/multifocal.js: the anatomy can be reviewed as anatomy without reading UI code.
//
// THE TRACED CORONAL PLATE IS DELIBERATELY NOT USED HERE. It was composed into this figure and reverted:
// a coronal section at the thalamus ALREADY contains the midbrain and pons, and the cord is not in that
// plane at all, so an authored brainstem bolted below a real section reads as a brain on a stick. This
// figure is a SCHEMATIC COMPOSITE of the whole neuraxis and is not any real section — which is exactly
// why a real section cannot be its spine. The plate belongs to the brain REGIONAL view, where a true
// coronal section is the correct thing to show. See app/plates.js and the 2026-08-24 spec amendment.
//
// COORDINATES, NOT CLAIMS. These are drawing positions in a schematic. Where a tract RUNS, and what sits
// beside it in cross-section, is increment 2 and carries a clinical review gate.

export const MX = 450;                 // midline x — the figure is symmetric about this
export const FIG_W = 900, FIG_H = 660;

// ---- THE ORTHOGONAL SCHEMA (owner's ruling, 2026-08-25) ----
// NO OBLIQUE LINES. A vertical line is a tract descending or ascending the neuraxis; a horizontal line is
// either a DECUSSATION or a pathway LEAVING THE CNS. Nothing else is drawn, and nothing is drawn at an
// angle. That single rule replaces the anatomical drawing, and it removes by construction the defect that
// caused most of the trouble before it: a diagonal run sweeps across every lane it passes, whereas a
// vertical run in its own lane cannot touch its neighbours at all.
//
// THE SPINE, rostral to caudal, is the column the owner named.
export const BANDS = ["cerebrum", "subcortex", "thalamus", "midbrain", "pons", "medulla", "cord"];
const BAND_TOP = 60, BAND_H = 84;
export const bandY = b => BAND_TOP + BANDS.indexOf(b) * BAND_H + BAND_H / 2;

// Every level in the model maps onto a spine band, or hangs off one laterally. The model has 36 levels and
// the spine names 7, so this table is what stops the other 29 falling off the diagram.
//
// `cortex` is the one worth flagging: it carries 71 sites — more than any other level — and is NOT in the
// spine, because the model splits `cerebrum` (the composite, 1 site) from `cortex` (the lobar detail).
// Both are the cerebrum band.
const SPINE_LEVEL = {
  cerebrum: "cerebrum", cortex: "cerebrum", corpus_callosum: "cerebrum", olfactory: "cerebrum",
  subcortex: "subcortex", basal_ganglia: "subcortex", aphasia_subcortical: "subcortex",
  thalamus: "thalamus", thalamus_arousal: "thalamus", hypothalamus: "thalamus",
  midbrain: "midbrain", dorsal_midbrain: "midbrain", pontomesencephalic: "midbrain", brainstem_aras: "midbrain",
  pons: "pons", locked_in: "pons", pseudobulbar: "pons", guillain_mollaret: "pons", central_vestibular: "pons",
  medulla: "medulla", craniocervical_junction: "medulla",
  cord: "cord", combined_degeneration: "cord", conus: "cord",
};

// LEAVING THE CNS. Each of these hangs off a band on a horizontal run; `rank` is how far out, so a
// pathway that exits and continues (root -> plexus -> nerve -> motor unit) steps outward in order.
const LATERAL_LEVEL = {
  visual_pathway:        { band: "thalamus", rank: 1 },
  pupil:                 { band: "midbrain", rank: 2 },
  cerebellum:            { band: "pons",     rank: 1 },
  peripheral_vestibular: { band: "pons",     rank: 2 },
  skull_base:            { band: "medulla",  rank: 2 },
  sympathetic:           { band: "cord",     rank: 1 },
  root:                  { band: "cord",     rank: 2 },
  plexus:                { band: "cord",     rank: 3 },
  nerve:                 { band: "cord",     rank: 4 },
  polyneuropathy:        { band: "cord",     rank: 5 },
  motor_unit:            { band: "cord",     rank: 5 },
  cauda:                 { band: "cord",     rank: 1 },
};

export const bandOf = level => SPINE_LEVEL[level] || (LATERAL_LEVEL[level] && LATERAL_LEVEL[level].band) || null;
export const lateralOf = level => LATERAL_LEVEL[level] || null;

// The rails: a spine level sits on the midline column, a lateral level on its rank's rail.
const RAIL = [0, 96, 168, 240, 300, 348];
export const RAIL_X = RAIL;

// ---- ANCHOR is now DERIVED from the schema, not hand-placed ----
// It keeps its old shape — level -> [dx from the midline, y] — so everything downstream is unchanged, but
// no coordinate is invented any more: y comes from the band, dx from the rail.
export const ANCHOR = Object.fromEntries([
  ...Object.entries(SPINE_LEVEL).map(([lvl, band]) => [lvl, [26, bandY(band)]]),
  ...Object.entries(LATERAL_LEVEL).map(([lvl, v]) => [lvl, [RAIL[v.rank], bandY(v.band)]]),
]);

// ---- ZONE: derived from LEVEL + part name, never authored. ----
// A ZONE IS A CROSS-SECTIONAL POSITION, so it only means anything at a level that HAS a cross-section.
// Gating on the level is not tidiness — deriving from the part name alone is anatomically WRONG, because
// several NAMED STRUCTURES merely contain a position word:
//
//   lateral_cord / medial_cord / posterior_cord   the BRACHIAL PLEXUS cords, not spinal cord zones
//   anterior_canal / posterior_canal              the SEMICIRCULAR CANALS
//   xi_posterior_triangle                         the POSTERIOR TRIANGLE of the neck
//   anterior_choroidal                            the anterior choroidal ARTERY territory
//   anterior_horn                                 at motor_unit, the anterior horn CELL
//
// Reading those as "lateral" or "posterior" would nudge a pin sideways on a claim the name never made.
// Same class of trap as PART_LABEL keying by ${level}|${part}, and as "a LEVEL is not its contents".
//
// The four zone-bearing levels are exactly the four the cross-sections of increment 2 will author.
const ZONE_LEVELS = new Set(["midbrain", "pons", "medulla", "cord"]);
const ZONE_RE = /(^|_)(anterior|posterior|lateral|medial|central)($|_)/;

export function zoneOf(level, part) {
  if (!ZONE_LEVELS.has(level) || typeof part !== "string") return null;
  if (part === "basis_pontis") return "anterior";   // the basis IS the ventral pons
  const m = ZONE_RE.exec(part);
  return m ? m[2] : null;
}

// How far a zone nudges a pin within its level's shape: [dx outward, dy].
// `anterior` is ventral (drawn toward the viewer's top of the stem), `posterior` dorsal.
const ZONE_NUDGE = {
  lateral:   [14, 0], medial: [-6, 0], central: [0, 0],
  anterior:  [0, 7],  posterior: [0, -7],
};

// ---- anchorFor: the one function that turns a site into a point. ----
// SIDE HANDLING. bilateral (27 candidates) and midline (18) both sit ON the midline; a bilateral pin is
// distinguished from a midline one by its FORM in the renderer, never by position or hue — one candidate
// is always exactly one pin, so the index numbering stays unambiguous.
export function anchorFor(level, part, side) {
  const a = ANCHOR[level] || [60, 330];
  const zone = zoneOf(level, part);
  const n = (zone && ZONE_NUDGE[zone]) || [0, 0];
  if (side === "midline" || side === "bilateral") return { x: MX, y: a[1] + n[1], zone };
  const sign = side === "right" ? 1 : -1;            // anatomical: patient's left on the LEFT of the page
  return { x: MX + sign * (a[0] + n[0]), y: a[1] + n[1], zone };
}

// ---- CROP: compartment -> [x, y, w, h] in figure coordinates. 13 keys. ----
// KEYED BY COMPARTMENT, NOT BY LEVEL, so a crop always contains whole anatomical structures rather than
// slicing a shape in half. compartmentOf() is part-aware, which is why the optic pathway can share the
// `skull_base` LEVEL yet crop separately.
// NO CROP TABLE. It was hand-authored, went stale twice when the figure's coordinates moved, and both
// times only an invariant caught it. The crop is now computed in neuraxis-diagram.js from the anchors of
// the sites actually being shown, so there is nothing to keep in step.
export const PAD = 26;
export const MIN_W = 420, MIN_H = 640;



// ---- TRACT LANES: ONE LANE PER TRACT, for its whole vertical run ----
// Under the orthogonal schema a tract is a SINGLE VERTICAL LINE. It does not drift laterally from level to
// level, because every such drift would be a horizontal jog, and a horizontal jog crosses every lane it
// passes — which is exactly the defect the schema exists to remove. The only horizontals a tract draws are
// its DECUSSATION and its exit from the CNS.
//
// So the per-level cross-sectional positions from Last's are no longer drawn as lateral drift. They are
// still true, and still where the pathway sits in a cross-section; they belong to the CROSS-SECTION views
// (increment 4), which is the only place a cross-sectional fact can honestly be shown.
//
// The ORDER is the medial -> lateral order of the brainstem, which is what the lane index encodes.
const LANE_ORDER = [
  "mlf", "corticobulbar", "dorsal_column", "corticospinal", "central_tegmental",
  "trigeminothalamic", "spinothalamic", "cerebellar", "oculosympathetic", "visual",
];
const LANE_0 = 11, LANE_STEP = 5;

// `_planar: false` marks a pathway that LEAVES THE CORONAL PLANE — the oculosympathetic ascending on the
// carotid, the visual pathway from the orbit, both ANTERIOR to the brainstem. Their separation from the
// rest is in depth, which no flat drawing has an axis for.
const NON_PLANAR = new Set(["oculosympathetic", "visual"]);

export const TRACT_LANE = Object.fromEntries(LANE_ORDER.map((id, i) => [id, LANE_0 + i * LANE_STEP]));
export const laneFor = tractId => TRACT_LANE[tractId] ?? LANE_0 + LANE_ORDER.length * LANE_STEP;
export const isPlanar = tractId => !NON_PLANAR.has(tractId);

// A pathway whose course is not monotonic along the neuraxis doubles back on itself. The cerebellar entry
// bundles INFLOW and OUTFLOW, which travel opposite ways, so its course order describes connections rather
// than one fibre's route; ordering those knots along the neuraxis removes a self-crossing that means
// nothing. A pathway that authors its own route is left as written.
const AUTHORED_ROUTE = new Set(["oculosympathetic"]);
export const routeIsAuthored = tractId => AUTHORED_ROUTE.has(tractId);
// The oculosympathetic is a THREE-NEURON CHAIN; drawn as one stroke its limbs closed a loop that enclosed
// the posterior fossa. It breaks at the ciliospinal centre — first-order descending, second and third
// ascending — which is both the fix and the more honest picture.
export const breaksAfter = (tractId, level) => tractId === "oculosympathetic" && level === "cord";
export const viaAfter = () => [];

// The point a tract passes through at a level, on a given side.
export function tractPoint(tractId, level, side) {
  const a = ANCHOR[level];
  if (!a) return null;
  const dx = laneFor(tractId);
  const sign = side === "right" ? 1 : -1;
  return [MX + (side === "midline" || side === "bilateral" ? 0 : sign * dx), a[1]];
}

// ---- the drawing: an orthogonal schematic, no oblique lines anywhere ----
// The column is the neuraxis, one band per level of the spine. A pathway leaving the CNS steps out along a
// horizontal rail. Everything is axis-aligned, including the anatomy, because a diagram whose rule is "no
// diagonals" cannot have a diagonal drawing underneath it.
const COL_HALF = 54;                         // half-width of the CNS column
export const FIG_TOP = 60;
export const FIG_BOTTOM = () => bandY("cord") + 42;

const bandRow = (b, i) => {
  const y = bandY(b), top = y - 42, bot = y + 42;
  return `<rect class="nx-band-box" x="${MX - COL_HALF}" y="${top}" width="${COL_HALF * 2}" height="84"/>`
    + `<text class="nx-band-name" x="${MX - COL_HALF - 10}" y="${top + 16}">${b === "cord" ? "spinal cord" : b}</text>`
    + (i < BANDS.length - 1 ? `<line class="nx-band-rule" x1="${MX - COL_HALF}" y1="${bot}" x2="${MX + COL_HALF}" y2="${bot}"/>` : "");
};

// The horizontal exits: one rail per rank, drawn on BOTH sides, with a tick where each level sits.
const exits = () => {
  const seen = new Map();
  for (const [lvl, v] of Object.entries(LATERAL_LEVEL)) {
    const key = `${v.band}|${v.rank}`;
    if (!seen.has(key)) seen.set(key, { band: v.band, rank: v.rank, levels: [] });
    seen.get(key).levels.push(lvl);
  }
  let out = "";
  for (const { band, rank } of seen.values()) {
    const y = bandY(band), x = RAIL[rank];
    for (const sgn of [-1, 1]) {
      out += `<line class="nx-exit" x1="${MX + sgn * COL_HALF}" y1="${y}" x2="${MX + sgn * x}" y2="${y}"/>`
        + `<line class="nx-exit-tick" x1="${MX + sgn * x}" y1="${y - 9}" x2="${MX + sgn * x}" y2="${y + 9}"/>`;
    }
  }
  return out;
};

export const baseFigure = () =>
  `<g class="anatomy">`
  + BANDS.map(bandRow).join("")
  + exits()
  + `<line class="an-mid" x1="${MX}" y1="${FIG_TOP - 18}" x2="${MX}" y2="${FIG_BOTTOM()}"/>`
  + `</g>`;

// Captioned explicitly because the convention is ANATOMICAL (patient's left on the left), which is the
// opposite of a scan — a reader with imaging on the next screen must not have to guess.
// Only drawn when the crop actually has room for BOTH — half a side caption is worse than none, and a
// crop tight to the cord has no left and right worth naming.
export const sideCaptions = (crop) => {
  const [cx, cy, cw] = crop || [0, 0, FIG_W];
  const l = MX - 250, r = MX + 250;
  if (l - 42 < cx + 2 || r + 42 > cx + cw - 2) return "";
  return `<text class="nx-side" x="${l}" y="${cy + 18}" text-anchor="middle">patient's left</text>`
    + `<text class="nx-side" x="${r}" y="${cy + 18}" text-anchor="middle">patient's right</text>`;
};

// The bands label themselves (see bandRow), so region captions only name what hangs off the RAILS.
const RAIL_LABEL = {
  "thalamus|1": "visual pathway", "midbrain|2": "pupil", "pons|1": "cerebellum",
  "pons|2": "inner ear", "medulla|2": "skull base / cranial nerves", "cord|1": "sympathetic · cauda",
  "cord|2": "root", "cord|3": "plexus", "cord|4": "nerve", "cord|5": "motor unit",
};
export const regionCaptions = (crop) => {
  const [cx, cy, cw, ch] = crop || [0, 0, FIG_W, FIG_H];
  let out = "";
  for (const [key, label] of Object.entries(RAIL_LABEL)) {
    const [band, rank] = key.split("|");
    const y = bandY(band), x = MX + RAIL[+rank] + 10;
    if (y < cy + 10 || y > cy + ch - 6 || x < cx + 2 || x > cx + cw - 30) continue;
    out += `<text class="nx-region" x="${x}" y="${y - 13}" text-anchor="start">${label}</text>`;
  }
  return out;
};

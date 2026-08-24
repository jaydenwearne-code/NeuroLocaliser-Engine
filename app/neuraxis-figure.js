// neuraxis-figure.js — CONTENT ONLY for the neuraxis drawing: the midline, where each level sits, how a
// part name nudges a pin within its level, and the authored half-figure itself.
//
// It imports NOTHING from src/. That split is deliberate and matches src/data/multifocal.js against
// src/engine/multifocal.js: the anatomy can be reviewed as anatomy without reading UI code.
//
// COORDINATES, NOT CLAIMS. These are drawing positions in a schematic. Where a tract RUNS, and what sits
// beside it in cross-section, is increment 2 and carries a clinical review gate.

export const MX = 380;                 // midline x — the figure is symmetric about this
export const FIG_W = 760, FIG_H = 660;

// ---- ANCHOR: level -> [dx from the midline, y]. 36 keys. ----
// KEYED BY LEVEL, NEVER BY PART. Level ids are globally unique, so there is no level|part collision here
// — unlike PART_LABEL / vascular.js / topography.js, where `lateral` and `medial` are reused across levels.
//
// It must cover candidateSites(), NOT SITES: SITES has 18 levels, but the composers (composeHemiLevelSites,
// composeBilateralCordSites, composeCaudaConusSites) add 18 more, and the diagram receives all of them.
export const ANCHOR = {
  // brain
  cerebrum: [130, 76], cortex: [112, 92], basal_ganglia: [80, 152], corpus_callosum: [30, 140],
  subcortex: [74, 168], thalamus: [46, 186], aphasia_subcortical: [52, 196], thalamus_arousal: [40, 202],
  hypothalamus: [26, 208], olfactory: [34, 222],
  // brainstem
  dorsal_midbrain: [14, 226], midbrain: [20, 240], guillain_mollaret: [46, 252],
  brainstem_aras: [12, 268], pontomesencephalic: [18, 258], pseudobulbar: [34, 276],
  pons: [28, 296], locked_in: [10, 302], central_vestibular: [30, 344], medulla: [20, 362],
  craniocervical_junction: [16, 388],
  // cerebellum
  cerebellum: [66, 306],
  // cord and below
  cord: [15, 470], combined_degeneration: [15, 500], conus: [13, 552], cauda: [22, 582],
  // visual, pupil, sympathetic, skull base
  visual_pathway: [44, 186], pupil: [162, 222], sympathetic: [100, 404],
  skull_base: [152, 228], peripheral_vestibular: [128, 262],
  // peripheral
  root: [46, 486], plexus: [92, 512], nerve: [126, 566], polyneuropathy: [150, 606],
  motor_unit: [160, 626],
};

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
export const CROP = {
  brain:       [ 96,  20, 568, 220],
  brainstem:   [232, 196, 296, 220],
  cerebellum:  [232, 250, 296, 130],
  cord:        [268, 380, 224, 200],
  cauda:       [280, 520, 200, 120],
  root:        [268, 420, 224, 160],
  plexus:      [212, 450, 336, 140],
  nerve:       [180, 500, 400, 150],
  motor_unit:  [160, 560, 440, 100],
  skull_base:  [140, 170, 480, 140],
  sympathetic: [212, 340, 336, 160],
  optic:       [140,  20, 480, 240],
  pupil:       [140, 160, 480, 130],
};

const PAD = 16;

// The union of the crop boxes of whatever compartments are in play, padded and clamped to the figure.
// ZOOM IS A DERIVED viewBox CROP over ONE authored drawing — there is no second figure and no detail
// level, so a crop can never disagree with the figure it crops.
export function cropFor(compartments) {
  const boxes = (compartments || []).map(c => CROP[c]).filter(Boolean);
  if (!boxes.length) return [0, 0, FIG_W, FIG_H];
  const x0 = Math.min(...boxes.map(b => b[0])), y0 = Math.min(...boxes.map(b => b[1]));
  const x1 = Math.max(...boxes.map(b => b[0] + b[2])), y1 = Math.max(...boxes.map(b => b[1] + b[3]));
  const x = Math.max(0, x0 - PAD), y = Math.max(0, y0 - PAD);
  return [x, y, Math.min(FIG_W - x, x1 - x0 + PAD * 2), Math.min(FIG_H - y, y1 - y0 + PAD * 2)];
}

// ---- the drawing itself ----
// AUTHORED AS ONE HALF AND MIRRORED. Symmetry holds by construction and there is no second copy of the
// anatomy to drift out of step — the same reasoning as markSVG() in brand.js drawing one geometry twice.
// Classes only; no inline colour (test/contrast.test.js fails inline accent in app/*.js).
const HALF = `
  <path class="an-brain" d="M380 46 C458 46 528 86 536 152 C542 200 514 228 470 228 L380 228 Z"/>
  <path class="an-line" d="M470 120 C494 132 502 156 496 178"/>
  <path class="an-line" d="M446 150 L430 176 L448 200"/>
  <ellipse class="an-deep" cx="416" cy="186" rx="20" ry="13"/>
  <ellipse class="an-deep" cx="452" cy="152" rx="16" ry="11"/>
  <path class="an-stem" d="M380 228 L410 228 L410 264 L424 276 L424 318 L406 332 L406 396 L380 396 Z"/>
  <ellipse class="an-cbm" cx="466" cy="306" rx="54" ry="42"/>
  <path class="an-folia" d="M424 288 C444 296 462 300 500 298 M424 306 C446 314 466 318 508 316 M428 324 C450 332 470 336 502 334"/>
  <path class="an-cord" d="M380 396 L398 396 L398 556 L380 566 Z"/>
  <path class="an-plate" d="M380 224 L566 224"/>
  <g class="an-roots">
    <path d="M398 430 L432 442"/><path d="M398 458 L432 470"/><path d="M398 486 L436 498"/>
    <path d="M398 514 L432 526"/><path d="M398 540 L428 552"/>
  </g>
  <path class="an-plexus" d="M436 470 L470 486 L508 494 M436 498 L474 494 L508 494 M436 442 L472 470 L508 494"/>
  <path class="an-nerve" d="M508 494 L534 548 L546 606 L552 640"/>
  <path class="an-symp" d="M406 366 C438 380 456 396 458 424 C460 452 438 466 424 470"/>
  <circle class="an-gang" cx="458" cy="424" r="5"/>
  <path class="an-symp" d="M458 424 C486 400 508 340 512 262 C514 240 520 230 532 226"/>
  <circle class="an-eye" cx="542" cy="222" r="13"/>
  <circle class="an-pupil" cx="542" cy="222" r="4.5"/>
  <path class="an-optic" d="M530 216 C494 200 452 176 424 186"/>
`;

export const baseFigure = () =>
  `<g class="anatomy">${HALF}<g transform="translate(${MX * 2},0) scale(-1,1)">${HALF}</g>`
  + `<path class="an-optic" d="M424 186 L336 186"/><circle class="an-chiasm" cx="${MX}" cy="186" r="6"/>`
  + `<line class="an-mid" x1="${MX}" y1="34" x2="${MX}" y2="640"/></g>`;

// Captioned explicitly because the convention is ANATOMICAL (patient's left on the left), which is the
// opposite of a scan — a reader with imaging on the next screen must not have to guess.
export const SIDE_CAPTIONS =
  `<text class="nx-side" x="${MX - 250}" y="22" text-anchor="middle">patient's left</text>`
  + `<text class="nx-side" x="${MX + 250}" y="22" text-anchor="middle">patient's right</text>`;

const REGIONS = [
  [0, 84, "cerebrum"], [0, 244, "midbrain"], [0, 300, "pons"], [0, 366, "medulla"],
  [96, 306, "cerebellum"], [0, 474, "cord"], [176, 224, "skull base"],
  [124, 408, "sympathetic chain"], [0, 178, "chiasm"], [150, 570, "peripheral nerve"],
];

export const regionCaptions = () => REGIONS.map(([dx, y, t]) =>
  `<text class="nx-region" x="${MX + (dx ? dx + 30 : 0)}" y="${y}" text-anchor="${dx ? "start" : "middle"}">${t}</text>`
).join("");

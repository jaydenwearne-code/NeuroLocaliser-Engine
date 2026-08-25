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
// A crop must not zoom so far that the reader loses the anatomy around the pins. Several compartments are
// a thin band, and cropping one tightly filled the panel with a single structure. Floor it and centre on
// the region instead. (Learned while composing the traced plate; kept when that was reverted.)
const MIN_W = 300, MIN_H = 260;

// The union of the crop boxes of whatever compartments are in play, padded and clamped to the figure.
// ZOOM IS A DERIVED viewBox CROP over ONE authored drawing — there is no second figure and no detail
// level, so a crop can never disagree with the figure it crops.
export function cropFor(compartments) {
  const boxes = (compartments || []).map(c => CROP[c]).filter(Boolean);
  if (!boxes.length) return [0, 0, FIG_W, FIG_H];
  const x0 = Math.min(...boxes.map(b => b[0])), y0 = Math.min(...boxes.map(b => b[1]));
  const x1 = Math.max(...boxes.map(b => b[0] + b[2])), y1 = Math.max(...boxes.map(b => b[1] + b[3]));
  const w = Math.min(FIG_W, Math.max(MIN_W, x1 - x0 + PAD * 2));
  const h = Math.min(FIG_H, Math.max(MIN_H, y1 - y0 + PAD * 2));
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const x = Math.max(0, Math.min(FIG_W - w, cx - w / 2));
  const y = Math.max(0, Math.min(FIG_H - h, cy - h / 2));
  return [x, y, w, h];
}


// ---- TRACT LANES: where each pathway sits IN CROSS-SECTION at each level ----
// [dx from the midline, dy from the level's anchor]. Positive dx is lateral; negative dy is dorsal.
//
// WHY THIS TABLE EXISTS. Every tract used to be drawn through its LEVEL'S anchor — one point shared by
// all of them — so paths were guaranteed to converge and cross. Wallenberg rendered 16 pairwise crossings
// away from any decussation, which does not happen in neuroanatomy. Giving each pathway its own lane is
// the fix, and test/neuraxis-diagram.test.js asserts no two paths may cross except at a declared
// decussation.
//
// The positions are read off Last's Anatomy 9th ed, ch.7 (pp. 612-613, 623-625) — the same source already
// recorded in the spec but never used for drawing. Page references are per entry.
// THE LATERAL ORDER OF THE LANES MUST NOT SWAP BETWEEN LEVELS. Two pathways that trade places between one
// level and the next are forced to cross, whatever the anatomy says — corticospinal (46) and spinothalamic
// (38) did exactly that at the subcortex before inverting at the midbrain (13 vs 18). In three dimensions
// they do not cross: the lemnisci are DORSAL to the crus, not lateral to it. A flat coronal drawing cannot
// show dorsoventral separation, so lateral order carries it, and the order chosen is the one the brainstem
// has: corticobulbar, corticospinal, dorsal column, spinothalamic, medial to lateral.
export const TRACT_LANE = {
  // NOTE: the order test in test/neuraxis-figure.test.js compares lanes at SHARED LEVELS, which cannot see
  // a pair that swaps BETWEEN levels — trigeminothalamic and oculosympathetic share only the medulla, yet
  // crossed higher up because one was lateral at the thalamus and medial by the pons. The geometric
  // non-crossing test in test/neuraxis-diagram.test.js is what catches those, and it is the authority.
  //
  // `_planar: false` marks a pathway that LEAVES THE CORONAL PLANE, and lane ordering does not apply to it.
  // Two do. The oculosympathetic ascends on the internal carotid and the visual pathway runs from the
  // orbit — both ANTERIOR to the brainstem, separated from everything else by depth rather than by side.
  // A coronal drawing has no depth axis, so their lines must traverse other lanes on the page while
  // crossing nothing in the body. Marking them is honest; forcing them into the lane order is not, and
  // five attempts to place the oculosympathetic "correctly" only moved the crossing around.
  //
  // ONE CONSISTENT MEDIAL -> LATERAL ORDER, top to bottom of this table:
  //   mlf · corticobulbar · dorsal column · corticospinal · trigeminothalamic · spinothalamic ·
  //   cerebellar · oculosympathetic
  // The ML's DRIFT is still drawn — dx grows from 4 in the medulla to 30 at the thalamus (Last's p.613,
  // "adjacent to the midline ... deviates laterally") — but its RANK against the other tracts never
  // changes, because a rank change is a forced crossing.
  // A LADDER WITH SIX-UNIT GAPS between neighbours at each level.
  //
  // Four units was not enough and the reason is worth recording: the ORDER CHECK interpolates lanes
  // LINEARLY, but the figure draws a SPLINE, which leaves its knots between levels. Lines that are
  // correctly ordered at every knot still wove into each other across a four-unit gap. The geometric
  // non-crossing test in test/neuraxis-diagram.test.js reads the drawn geometry and is the authority; the
  // order check here is the cheaper early warning.
  //
  // The lateral lanes sit outside the drawn brainstem, deliberately — the stem is ~20 units half-width and
  // seven pathways run through it. A teaching figure shows the lanes legibly rather than to scale.
  mlf:               { midbrain: [3, -6], pons: [3, -6] },
  corticobulbar:     { cortex: [50, 0], subcortex: [20, 0], midbrain: [9, 4], pons: [9, 6] },
  central_tegmental: { midbrain: [9, 0], guillain_mollaret: [40, 0] },
  dorsal_column:     { cord: [4, -4], medulla: [3, 0], pons: [15, 0], midbrain: [15, 0], subcortex: [30, 0] },
  corticospinal:     { cortex: [66, 0], subcortex: [40, 0], midbrain: [21, 4], pons: [21, 6], medulla: [9, 6], cord: [10, 0] },
  // VPM is medial to VPL (50). A LANE ONLY EXISTS AT A LEVEL THE TRACT'S COURSE ACTUALLY VISITS, and this
  // one had no midbrain — so a midbrain lane was dead data and the line ran straight from the thalamus to
  // the pons, cutting across corticospinal and spinothalamic on the way.
  //
  // NO LANE VALUE CAN FIX IT, and that was proved rather than assumed. Between y=186 and y=296 the
  // corticospinal lane falls from 35 to 21 while the spinothalamic sits at 33; a STRAIGHT line (which is
  // all this tract can draw, having no knot in between) would need to be above 37 at the top and below 31
  // in the middle and above 23 at the bottom, which is not a line. The real fix is a MODEL change — the
  // course jumps pons -> thalamus with no midbrain segment, though the trigeminal lemniscus ascends
  // through the midbrain beside the medial lemniscus (Last's p.613). Adding it needs a producing structure
  // at that level, which creates a NEW CANDIDATE SITE and is a localisation change, so it is the owner's
  // call. Until then the pair is exempted in test/neuraxis-diagram.test.js, by name and with this reason.
  trigeminothalamic: { thalamus: [40, 0], pons: [27, -6], medulla: [15, -7] },
  spinothalamic:     { cord: [16, 3], medulla: [21, 0], pons: [33, -2], midbrain: [33, -2], subcortex: [50, 0] },
  cerebellar:        { cerebellum: [60, 0], midbrain: [39, -4], pons: [39, 0], medulla: [27, -4], combined_degeneration: [22, 0] },
  // Runs WITH the spinal lemniscus through the lateral brainstem (Last's p.613) — the adjacency that makes
  // one lateral medullary lesion give both a Horner's and contralateral body pain and temperature loss.
  // In the cord it lies in the lateral funiculus by the lateral horn (p.625).
  oculosympathetic:  { _planar: false,
                       hypothalamus: [16, 0], medulla: [20, 5], cord: [16, 2], sympathetic: [100, 0], skull_base: [140, 0],
                       _break: "cord" },
  visual:            { _planar: false,
                       skull_base: [130, 0], visual_pathway: [30, 0], subcortex: [60, 0], cortex: [90, 0] },
};


// A pathway with no authored lane at a level falls back INSIDE its level, not onto the shared anchor.
export function laneFor(tractId, level) {
  const t = TRACT_LANE[tractId];
  if (t && t[level]) return t[level];
  const a = ANCHOR[level];
  return [a ? Math.abs(a[0]) * 0.6 : 30, 0];
}

// Extra knots to insert after a level, for a pathway whose real course doubles back (see oculosympathetic).
// Does the drawn line stop after this level and resume as a separate stroke?
export function breaksAfter(tractId, level) {
  const t = TRACT_LANE[tractId];
  return !!(t && t._break === level);
}

// A pathway whose course is not monotonic along the neuraxis doubles back on itself, and its excursion
// crosses whatever lies between. The cerebellar entry bundles INFLOW and OUTFLOW, which travel opposite
// ways, so its course order is a description of connections rather than one fibre's route. Ordering those
// knots along the neuraxis instead removes a self-crossing that means nothing anatomically. A pathway that
// authors an explicit route (`_via` or `_break`) is left exactly as written.
// Does this pathway stay in the coronal plane? A non-planar one is exempt from lane ordering and from the
// non-crossing rule, because its separation from the others is in DEPTH, which the drawing cannot show.
export function isPlanar(tractId) {
  const t = TRACT_LANE[tractId];
  return !(t && t._planar === false);
}

export function routeIsAuthored(tractId) {
  const t = TRACT_LANE[tractId];
  return !!(t && (t._via || t._break));
}

export function viaAfter(tractId, level) {
  const t = TRACT_LANE[tractId];
  return (t && t._via && t._via[level]) || [];
}

// The point a tract passes through at a level, on a given side.
export function tractPoint(tractId, level, side) {
  const a = ANCHOR[level];
  if (!a) return null;
  const [dx, dy] = laneFor(tractId, level);
  const sign = side === "right" ? 1 : -1;
  return [MX + (side === "midline" || side === "bilateral" ? 0 : sign * dx), a[1] + dy];
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
// Only drawn when the crop actually has room for BOTH — half a side caption is worse than none, and a
// crop tight to the cord has no left and right worth naming.
export const sideCaptions = (crop) => {
  const [cx, cy, cw] = crop || [0, 0, FIG_W];
  const l = MX - 250, r = MX + 250;
  if (l - 42 < cx + 2 || r + 42 > cx + cw - 2) return "";
  return `<text class="nx-side" x="${l}" y="${cy + 18}" text-anchor="middle">patient's left</text>`
    + `<text class="nx-side" x="${r}" y="${cy + 18}" text-anchor="middle">patient's right</text>`;
};

const REGIONS = [
  [0, 84, "cerebrum"], [0, 244, "midbrain"], [0, 300, "pons"], [0, 366, "medulla"],
  [96, 306, "cerebellum"], [0, 474, "cord"], [176, 224, "skull base"],
  [124, 408, "sympathetic chain"], [0, 178, "chiasm"], [150, 570, "peripheral nerve"],
];

// TWO THINGS LEARNED BY LOOKING AT THE RENDERED FIGURE, not from a test:
//
// 1. A caption outside the current crop must not render — a cropped figure was showing "cerebell",
//    "medulla" and "sy" sliced off at the edge.
// 2. A MIDLINE caption collides with MIDLINE PINS. The brainstem levels sit on the midline and so do
//    bilateral/midline candidates, so "medulla" rendered underneath its own pin. Midline captions
//    therefore go in the crop's LEFT MARGIN — which is what the old band labels did, and it worked.
//    Captions for lateral structures (cerebellum, skull base, sympathetic chain) keep their own offset,
//    because there they ARE the label for something out at that position.
export const regionCaptions = (crop) => {
  const [cx, cy, cw, ch] = crop || [0, 0, FIG_W, FIG_H];
  return REGIONS.filter(([dx, y]) => y > cy + 10 && y < cy + ch - 4)
    .map(([dx, y, t]) => {
      const x = dx ? MX + dx + 30 : cx + 6;
      if (x < cx + 2 || x > cx + cw - 40) return "";        // would clip at the edge
      return `<text class="nx-region" x="${x}" y="${y}" text-anchor="start">${t}</text>`;
    }).join("");
};

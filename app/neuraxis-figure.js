// neuraxis-figure.js — CONTENT ONLY for the neuraxis drawing: the midline, where each level sits, how a
// part name nudges a pin within its level, and the authored half-figure itself.
//
// It imports NOTHING from src/. That split is deliberate and matches src/data/multifocal.js against
// src/engine/multifocal.js: the anatomy can be reviewed as anatomy without reading UI code.
//
// COORDINATES, NOT CLAIMS. These are drawing positions in a schematic. Where a tract RUNS, and what sits
// beside it in cross-section, is increment 2 and carries a clinical review gate.

import { PATHS as BRAIN_PATHS, MIDLINE as BRAIN_MID } from "./plates/coronal-brain.js";

export const MX = 380;                 // midline x
export const FIG_W = 760, FIG_H = 960;

// ---- the cerebrum is a TRACED PUBLIC-DOMAIN PLATE, not drawn by hand ----
// Gray 717, label-free, traced by tools/trace. It is placed whole and NOT mirrored: the plate's two halves
// are drawn differently (one shows the cut face and its internal structures, the other mostly gyral
// outline), and mirroring one half was tried and produced a symmetric Rorschach rather than a brain.
// Its own midline sits at x=300 in plate coordinates and is mapped onto MX here.
const BRAIN_K = 1.12;                                    // plate units -> figure units
const BRAIN_TOP = 34, BRAIN_INK_TOP = 83;                // the plate's ink starts at y=83, not y=0
const brainX = px => MX + (px - BRAIN_MID) * BRAIN_K;
const brainY = py => BRAIN_TOP + (py - BRAIN_INK_TOP) * BRAIN_K;
export const BRAIN_BOTTOM = brainY(523);                 // where the authored brainstem takes over

// ---- ANCHOR: level -> [dx from the midline, y]. 36 keys. ----
// KEYED BY LEVEL, NEVER BY PART. Level ids are globally unique, so there is no level|part collision here
// — unlike PART_LABEL / vascular.js / topography.js, where `lateral` and `medial` are reused across levels.
//
// It must cover candidateSites(), NOT SITES: SITES has 18 levels, but the composers (composeHemiLevelSites,
// composeBilateralCordSites, composeCaudaConusSites) add 18 more, and the diagram receives all of them.
export const ANCHOR = {
  // ---- brain: coordinates read off the TRACED PLATE, via brainX/brainY ----
  // These are no longer invented. Each is a point in Gray 717's own coordinates, mapped into the figure,
  // so a pin lands on the structure the plate actually draws. A test asserts every level HAS an anchor;
  // no test can say an anchor is in the RIGHT place — that is the owner's read, as with the site labels.
  cerebrum:            [brainX(300) - MX, brainY(150)],
  cortex:              [brainX(430) - MX, brainY(170)],
  basal_ganglia:       [brainX(352) - MX, brainY(300)],
  corpus_callosum:     [brainX(300) - MX, brainY(272)],
  subcortex:           [brainX(342) - MX, brainY(285)],
  thalamus:            [brainX(322) - MX, brainY(318)],
  aphasia_subcortical: [brainX(330) - MX, brainY(330)],
  thalamus_arousal:    [brainX(318) - MX, brainY(340)],
  hypothalamus:        [brainX(306) - MX, brainY(352)],
  olfactory:           [brainX(300) - MX, brainY(392)],
  visual_pathway:      [brainX(320) - MX, brainY(372)],
  // ---- brainstem and below: authored, continuing from the plate ----
  dorsal_midbrain: [14, 566], midbrain: [20, 584], guillain_mollaret: [46, 596],
  brainstem_aras: [12, 606], pontomesencephalic: [18, 598], pseudobulbar: [34, 614],
  pons: [28, 636], locked_in: [10, 642], central_vestibular: [30, 678], medulla: [20, 696],
  craniocervical_junction: [16, 722],
  cerebellum: [78, 646],
  cord: [15, 790], combined_degeneration: [15, 816], conus: [13, 862], cauda: [22, 890],
  pupil: [178, 300], sympathetic: [104, 740],
  skull_base: [150, 470], peripheral_vestibular: [124, 500],
  root: [46, 806], plexus: [96, 832], nerve: [126, 896], polyneuropathy: [140, 922],
  motor_unit: [150, 942],
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
  brain:       [ 188,   69,  383,  351],
  brainstem:   [ 288,  526,  184,  236],
  cerebellum:  [ 256,  606,  248,   80],
  cord:        [ 319,  750,  122,  152],
  cauda:       [ 312,  850,  136,   80],
  root:        [ 288,  766,  184,   80],
  plexus:      [ 238,  792,  284,   80],
  nerve:       [ 194,  850,  372,  106],
  motor_unit:  [ 184,  888,  392,   72],
  skull_base:  [ 184,  430,  392,  110],
  sympathetic: [ 230,  700,  300,   80],
  optic:       [ 184,  318,  392,  192],
  pupil:       [ 156,  260,  448,   80],
};

const PAD = 16;
// A crop must not zoom so far that the reader loses the anatomy around the pins. The figure is 1080 tall
// and several compartments are an 80px band, which cropped to a 122x152 box and filled the panel with one
// structure. Floor the crop and centre it on the region instead.
const MIN_W = 300, MIN_H = 300;

// The union of the crop boxes of whatever compartments are in play, padded and clamped to the figure.
// ZOOM IS A DERIVED viewBox CROP over ONE authored drawing — there is no second figure and no detail
// level, so a crop can never disagree with the figure it crops.
export function cropFor(compartments) {
  const boxes = (compartments || []).map(c => CROP[c]).filter(Boolean);
  if (!boxes.length) return [0, 0, FIG_W, FIG_H];
  const x0 = Math.min(...boxes.map(b => b[0])), y0 = Math.min(...boxes.map(b => b[1]));
  const x1 = Math.max(...boxes.map(b => b[0] + b[2])), y1 = Math.max(...boxes.map(b => b[1] + b[3]));
  let w = Math.min(FIG_W, Math.max(MIN_W, x1 - x0 + PAD * 2));
  let h = Math.min(FIG_H, Math.max(MIN_H, y1 - y0 + PAD * 2));
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const x = Math.max(0, Math.min(FIG_W - w, cx - w / 2));
  const y = Math.max(0, Math.min(FIG_H - h, cy - h / 2));
  return [x, y, w, h];
}

// ---- the drawing ----
// The cerebrum is the traced plate. EVERYTHING BELOW IT IS AUTHORED, because no public-domain plate shows
// the brainstem, cord and limb in one continuous coronal view — and stitching a coronal brain to an
// oblique plexus plate would be anatomically incoherent, which is the same objection that rejected the
// sagittal layout. Authored anatomy is mirrored about the midline; the plate is not (see BRAIN_K above).
const HALF = `
  <!-- THE JUNCTION. The plate ends with its own pons, 112 units wide at y=527; the authored stem used to
       start 26 units wide, which read as the brainstem hanging off the bottom of the brain. It now takes
       over at the plate's own footprint and tapers to the medulla. -->
  <path class="an-stem" d="M380 527 L436 527 C 434 556 426 582 416 606 C 408 630 404 654 404 678 L404 726 L380 726 Z"/>
  <path class="an-peduncle" d="M382 532 C 404 532 420 538 428 548 L382 548 Z"/>
  <path class="an-pyramid" d="M382 686 C 392 686 397 692 397 702 C 397 714 393 721 388 725 L382 725 Z"/>
  <ellipse class="an-olive" cx="401" cy="700" rx="7" ry="12"/>
  <path class="an-stemline" d="M384 566 C 400 568 412 574 420 584 M384 606 C 398 608 408 614 414 622"/>
  <path class="an-cbm" d="M424 556 C 452 546 490 550 508 570 C 526 588 524 616 506 630 C 484 646 448 644 428 626 C 418 616 416 578 424 556 Z"/>
  <path class="an-folia" d="M430 566 C 456 560 486 562 502 572 M426 582 C 454 576 490 578 514 588
    M426 598 C 454 594 492 596 516 604 M428 614 C 456 612 490 614 510 620"/>
  <path class="an-cord" d="M380 726 L398 726 L398 866 C 398 882 390 894 380 900 Z"/>
  <path class="an-greymatter" d="M380 752 C 390 752 394 758 396 766 C 397 774 393 780 386 782 C 383 784 381 788 380 792 Z"/>
  <g class="an-roots">
    <path d="M398 754 C 416 758 428 766 436 778"/><path d="M398 782 C 418 786 432 794 440 806"/>
    <path d="M398 810 C 420 814 434 824 442 836"/><path d="M398 838 C 418 846 430 858 436 870"/>
  </g>
  <path class="an-cauda" d="M386 886 C 390 918 396 950 400 976 M390 890 C 398 920 406 950 412 974"/>
  <path class="an-plexus" d="M436 778 C 462 800 476 822 480 846 M440 806 C 464 822 476 840 480 858
    M442 836 C 462 848 476 862 482 876"/>
  <!-- Nerve TRUNKS only. The limb, and the compression sites on it (fibular neck, carpal tunnel), belong
       to the lower-limb regional view: drawing the whole leg here is anatomically honest but makes the
       main figure head-to-foot, which is unreadable in a results column. -->
  <path class="an-nerve" d="M480 858 C 498 884 508 906 512 930"/>
  <path class="an-nerve" d="M462 872 C 474 896 482 916 486 936"/>
  <path class="an-symp" d="M406 700 C 438 714 456 730 458 758 C 460 786 438 800 424 804"/>
  <circle class="an-gang" cx="458" cy="758" r="5"/>
  <path class="an-symp" d="M458 758 C 486 720 508 600 512 500 C 514 480 520 470 532 466"/>
  <path class="an-plate" d="M380 466 L566 466"/>
  <circle class="an-eye" cx="544" cy="300" r="14"/><circle class="an-pupil" cx="544" cy="300" r="4.6"/>
`;

export const baseFigure = () =>
  `<g class="anatomy">`
  + `<g class="an-brain-plate" transform="translate(${MX - BRAIN_MID * BRAIN_K},${BRAIN_TOP - BRAIN_INK_TOP * BRAIN_K}) scale(${BRAIN_K})">${BRAIN_PATHS}</g>`
  + `${HALF}<g transform="translate(${MX * 2},0) scale(-1,1)">${HALF}</g>`
  + `<line class="an-mid" x1="${MX}" y1="${BRAIN_TOP}" x2="${MX}" y2="930"/></g>`;

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
  // Coordinates belong to THIS figure. They were left at increment-1 values through the plate swap and
  // every caption landed on top of the brain — a silent breakage, because a caption has no invariant.
  [0, 150, "cerebrum"], [0, 300, "deep grey"], [0, 360, "chiasm"],
  [0, 560, "midbrain"], [0, 606, "pons"], [0, 694, "medulla"], [0, 790, "cord"], [0, 880, "cauda"],
  [116, 594, "cerebellum"], [176, 466, "skull base"], [126, 762, "sympathetic chain"],
  [120, 900, "peripheral nerve"],
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

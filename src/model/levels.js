// levels.js — the ordered spinal-cord dermatome coordinate.
//
// The cord's cross-sectional pattern (which tracts, which sides) says WHICH syndrome; this module
// supplies the orthogonal axis — WHERE along the cord. A plain ordered list of segments plus pure
// helpers, with no knowledge of findings, sites or scoring. Index position defines "below": a
// higher index is further caudal.

export const CORD_LEVELS = [
  "C2","C3","C4","C5","C6","C7","C8",
  "T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12",
  "L1","L2","L3","L4","L5",
  "S1","S2","S3","S4","S5"
];

const INDEX = Object.fromEntries(CORD_LEVELS.map((name, i) => [name, i]));

// Normalise a raw input to a canonical segment name, or null if unrecognised.
export function normaliseLevel(raw) {
  if (typeof raw !== "string") return null;
  const name = raw.trim().toUpperCase();
  return Object.prototype.hasOwnProperty.call(INDEX, name) ? name : null;
}

export function isKnownLevel(raw) { return normaliseLevel(raw) !== null; }

// 0-based position in CORD_LEVELS; -1 if unknown.
export function levelIndex(raw) {
  const name = normaliseLevel(raw);
  return name === null ? -1 : INDEX[name];
}

// True if segment a is BELOW segment b (further caudal). False if either is unknown or a is at/above b.
export function isBelow(a, b) {
  const ia = levelIndex(a), ib = levelIndex(b);
  if (ia < 0 || ib < 0) return false;
  return ia > ib;
}

// Region from the segment prefix; null if unknown.
export function regionOf(raw) {
  const name = normaliseLevel(raw);
  if (name === null) return null;
  return { C: "cervical", T: "thoracic", L: "lumbar", S: "sacral" }[name[0]] || null;
}

// Teaching landmark for the common sensory anchors only; null otherwise. Descriptive.
const LANDMARKS = { C4: "clavicle", T4: "nipple", T6: "xiphisternum", T10: "umbilicus", L1: "groin" };
export function landmarkOf(raw) {
  const name = normaliseLevel(raw);
  return name === null ? null : (LANDMARKS[name] || null);
}

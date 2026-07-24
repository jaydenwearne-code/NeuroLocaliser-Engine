// nerveLength.js — the axon-length coordinate (the orthogonal axis for length-dependent polyneuropathy).
//
// The twin of levels.js: a plain coordinate + pure helpers, with no knowledge of findings, sites or
// scoring. Where levels.js says WHERE ALONG THE CORD, this says HOW FAR a length-dependent (dying-back)
// neuropathy has ascended. A longer axon fails earlier, so each body region has an axon-length RANK
// (higher = longer = more vulnerable). The interleave of the limbs is the whole point: the FINGERTIPS
// share a rank with the KNEES, so when the deficit ascends to the knees the fingertips are recruited —
// the "glove" appears. Stocking-glove is DERIVED by comparing axon lengths, not stored as a rule.

export const LENGTH_RANK = {
  // lower limb (longest axons in the body)
  toes: 10, feet: 9, ankles: 8, mid_calf: 7, knees: 6, thighs: 4, hips: 2,
  // upper limb — fingertips are the SAME axon length as the knees
  fingertips: 6, hands: 5, forearms: 4, upper_arms: 2
};

const REGIONS = Object.keys(LENGTH_RANK);

// Canonical region name (trim/lowercase), or null if unrecognised.
export function normaliseRegion(raw) {
  if (typeof raw !== "string") return null;
  const name = raw.trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(LENGTH_RANK, name) ? name : null;
}

export function rankOf(raw) {
  const name = normaliseRegion(raw);
  return name === null ? -1 : LENGTH_RANK[name];
}

// Every region at or above a rank threshold — what a dying-back front of that reach has recruited.
export function regionsAtOrAbove(threshold) {
  return REGIONS.filter(r => LENGTH_RANK[r] >= threshold).sort((a, b) => LENGTH_RANK[b] - LENGTH_RANK[a]);
}

// Describe a length-dependent process that has ascended to `reach` (a lower-limb landmark, usually).
// The threshold is that region's axon length; everything at or above it is involved; the GLOVE appears
// when the fingertips' length is at or above the threshold (derived, not stored).
export function describeReach(reach) {
  const threshold = rankOf(reach);
  if (threshold < 0) return { reach: null, threshold: null, involved: [], glove: false, applies: false,
    note: `unrecognised distal reach '${reach}'` };
  const involved = regionsAtOrAbove(threshold);
  const glove = LENGTH_RANK.fingertips >= threshold;
  const severity = threshold >= 8 ? "mild (feet)" : threshold >= 6 ? "moderate (to the knees — hands now involved)" : "severe (proximal spread)";
  return { reach: normaliseRegion(reach), threshold, involved, glove, applies: true,
    note: glove
      ? `length-dependent: the deficit reaches the ${normaliseRegion(reach)}; the fingertips (same axon length as the knees) are now involved — stocking-and-glove`
      : `length-dependent: distal lower-limb deficit to the ${normaliseRegion(reach)}; the hands are still spared (their axons are shorter)`,
    severity };
}

// Is an observed set of involved regions consistent with a single length-dependent (dying-back) front?
// It is iff the set is exactly {every region with rank >= the shortest involved axon}. So "hands without
// feet" is INCONSISTENT — the feet outrank the hands and must be involved first (points away from a
// stocking-glove neuropathy, e.g. towards a multifocal or non-length-dependent process).
export function isLengthDependent(regions) {
  const names = (regions || []).map(normaliseRegion);
  if (names.length === 0 || names.some(n => n === null)) return false;
  const minRank = Math.min(...names.map(n => LENGTH_RANK[n]));
  const expected = new Set(regionsAtOrAbove(minRank));
  const observed = new Set(names);
  if (observed.size !== expected.size) return false;
  for (const r of expected) if (!observed.has(r)) return false;
  return true;
}

// inverse.js — observed findings -> best lesion explanation(s).
//
// Two modes, run together:
//   1. SINGLE-LESION: score every candidate site; rank them. This is tried first and always.
//   2. MINIMAL-SET:   if the best single site leaves localising findings unexplained, search
//      for the smallest set of sites that together explain all localising findings. That set
//      IS the multifocal hypothesis — it is derived, not a fallback label.
//
// "Localising findings" are the ones a lesion must account for; long-tract signs can attach to
// many sites, so coverage is judged on the localising set to avoid trivial explanations.

import { SITES, composeHemiLevelSites, composeBilateralCordSites, composeCaudaConusSites,
         composeVascularCortexSites, composeBilateralCortexSites, composeDeepVascularSites,
         composeSkullBaseSites, composeMotorUnitSites, composePolyneuropathySites,
         composePlexusSites, composeBrachialCordSites, composeVisualPathwaySites, composePupilPretectumSites,
         composePancoastSites, composeBasalGangliaBilateralSites,
         composeCerebellumMidlineSites, composeCerebellumPancerebellarSites,
         composeCentralNystagmusSites, composeDorsalMidbrainSites,
         composeConsciousnessSites, composeLateralPontineTrigeminalSites,
         composeTrochlearNucleusSites, composeGuillainMollaretSites,
         composeAphasiaSites, composeHypothalamusSites,
         composeCorpusCallosumSites, composePseudobulbarSites,
         composeCombinedDegenerationSites } from "../model/sites.js";
import { scoreSite, LOCALISING, findingIdOf } from "./score.js";
import { expectedFindings } from "./forward.js";
import { normaliseLevel, regionOf, landmarkOf } from "../model/levels.js";
import { describeReach } from "../model/nerveLength.js";

function candidateSites() {
  return [...SITES, ...composeHemiLevelSites(), ...composeBilateralCordSites(),
          ...composeCaudaConusSites(), ...composeVascularCortexSites(), ...composeBilateralCortexSites(),
          ...composeDeepVascularSites(), ...composeSkullBaseSites(), ...composeMotorUnitSites(),
          ...composePolyneuropathySites(), ...composePlexusSites(), ...composeBrachialCordSites(), ...composeVisualPathwaySites(),
          ...composePupilPretectumSites(), ...composePancoastSites(),
          ...composeBasalGangliaBilateralSites(),
          ...composeCerebellumMidlineSites(), ...composeCerebellumPancerebellarSites(),
          ...composeCentralNystagmusSites(), ...composeDorsalMidbrainSites(),
          ...composeConsciousnessSites(), ...composeLateralPontineTrigeminalSites(),
          ...composeTrochlearNucleusSites(), ...composeGuillainMollaretSites(),
          ...composeAphasiaSites(), ...composeHypothalamusSites(),
          ...composeCorpusCallosumSites(), ...composePseudobulbarSites(),
          ...composeCombinedDegenerationSites()];
}

function localisingObserved(observedSet) {
  return [...observedSet].filter(s => LOCALISING.has(findingIdOf(s)));
}

// ---- SINGLE-LESION RANKING ----
export function rankSingle(observedSet, opts = {}) {
  return candidateSites()
    .map(site => scoreSite(site, observedSet, opts))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

// Does a single site explain every localising finding?
function coversAllLocalising(result, observedSet) {
  const need = new Set(localisingObserved(observedSet));
  for (const m of result.matched) need.delete(m);
  return need.size === 0;
}

// ---- MINIMAL-SET SEARCH (multifocal) ----
// Greedy set cover over the localising findings, preferring high-scoring sites and fewest sites.
// For a POC the localising set is small, so greedy with a refinement pass is ample.
export function minimalSet(observedSet, opts = {}) {
  const needAll = new Set(localisingObserved(observedSet));
  if (needAll.size === 0) return null;

  const sites = candidateSites().map(site => {
    const exp = expectedFindings(site, opts);
    const covers = new Set([...needAll].filter(f => exp.has(f)));
    return { site, exp, covers };
  }).filter(s => s.covers.size > 0);

  const remaining = new Set(needAll);
  const chosen = [];
  while (remaining.size > 0) {
    // pick the site covering the most remaining localising findings; tie-break first on explaining MORE
    // of the observed findings (a site that also accounts for the accompanying long-tract signs is the
    // better lesion than one that merely shares a cranial-nerve sign — the nuclear-vs-peripheral case),
    // then on fewest over-predictions (tightest fit).
    let best = null;
    for (const s of sites) {
      const gain = [...s.covers].filter(f => remaining.has(f)).length;
      if (gain === 0) continue;
      const matched = [...s.exp].filter(f => observedSet.has(f)).length;
      const overPredict = [...s.exp].filter(f => !observedSet.has(f)).length;
      if (!best || gain > best.gain
          || (gain === best.gain && matched > best.matched)
          || (gain === best.gain && matched === best.matched && overPredict < best.overPredict)) {
        best = { s, gain, matched, overPredict };
      }
    }
    if (!best) break; // cannot cover the rest with the current site model
    chosen.push(best.s.site);
    for (const f of best.s.covers) remaining.delete(f);
  }

  return { sites: chosen, uncovered: [...remaining] };
}

// ---- DROP-1 (NON-LOCALISING) RELAXATION ----
// "Slight relaxation of parameters": if no single site explains EVERY entered finding, retry allowing exactly
// ONE non-localising finding to go unexplained. If a single site then explains all the rest, that is a
// near-fit — surfaced (naming the odd finding) BEFORE the multifocal hypothesis. A LOCALISING sign is never
// relaxed away: it is too specific to ignore. Superset-based, matching the app's "explains all" differential.
export function nearFit(observedSet, opts = {}) {
  const observed = [...observedSet];
  const sites = candidateSites();
  const explainsAll = tokens => {
    for (const site of sites) {
      let exp; try { exp = expectedFindings(site, opts); } catch { continue; }
      if (tokens.every(t => exp.has(t))) return site;
    }
    return null;
  };
  if (explainsAll(observed)) return null; // a single site already explains everything — no relaxation needed
  for (const drop of observed) {
    if (LOCALISING.has(findingIdOf(drop))) continue; // never relax a localising sign
    const site = explainsAll(observed.filter(t => t !== drop));
    if (site) return { site, missing: drop };
  }
  return null;
}

// ---- SENSORY LEVEL (orthogonal to which site wins) ----
// The cross-sectional pattern says WHICH syndrome; the sensory level says WHERE along the cord.
// It never changes the localisation — it annotates it. Reports the segment when the best site is
// in the cord and a valid level was given; otherwise explains why the level does not apply.
export function describeLevel(best, sensoryLevel) {
  const raw = (typeof sensoryLevel === "string" && sensoryLevel.trim() !== "") ? sensoryLevel : null;
  const isCord = !!best && best.site.level === "cord";
  const segment = normaliseLevel(raw);
  const base = { given: raw, applies: false, segment: null, region: null, landmark: null, note: "" };

  // Central (syrinx) lesions cause a SUSPENDED cape, not a below-the-level deficit — the single
  // "below the level" sensory level does not apply. Checked before the generic cord branches.
  if (isCord && best.site.part === "central") {
    return { given: raw, applies: false, segment,
      region: segment ? regionOf(segment) : null, landmark: segment ? landmarkOf(segment) : null,
      note: "suspended (cape-like) distribution — the sensory loss spans the lesion's segments and is spared above and below, so a single below-the-level sensory level does not apply" };
  }

  // Below the cord: cauda equina / conus. Not a cord "sensory level" — the saddle (S2–S5)
  // distribution is the localiser. Placed before the non-cord "inconsistency" branch so a
  // stated level here is reported gently rather than flagged as contradicting a cord lesion.
  if (best && (best.site.level === "cauda" || best.site.level === "conus")) {
    return { given: raw, applies: false, segment,
      region: segment ? regionOf(segment) : null, landmark: segment ? landmarkOf(segment) : null,
      note: "below the cord — a cauda equina / conus lesion; the saddle (S2–S5) distribution is the localiser, not a single sensory level" };
  }

  if (isCord && segment) {
    return { given: raw, applies: true, segment, region: regionOf(segment), landmark: landmarkOf(segment),
      note: `lesion at or just above ${segment} (the sensory level typically sits a segment or two below the lesion)` };
  }
  if (isCord && raw && !segment) {
    return { ...base, note: `unrecognised sensory level '${raw}'; expected a segment such as T10` };
  }
  if (isCord && !raw) {
    return { ...base, note: "level undetermined — a sensory level is needed to localise the segment" };
  }
  if (!isCord && raw) {
    return { given: raw, applies: false, segment, region: segment ? regionOf(segment) : null,
      landmark: segment ? landmarkOf(segment) : null,
      note: `a sensory level suggests a spinal cord lesion, but the findings localise to ${best ? best.site.id : "(no site)"}` };
  }
  return base;
}

// ---- LENGTH-DEPENDENCE (orthogonal to which site wins, for a polyneuropathy) ----
// The site says "polyneuropathy"; this says HOW FAR the length-dependent deficit has ascended and whether
// the stocking-glove has appeared. It annotates the winner, never changes it. Only applies when the best
// site is the polyneuropathy; otherwise it reports gently that it does not apply.
export function describeLength(best, distalReach) {
  const raw = (typeof distalReach === "string" && distalReach.trim() !== "") ? distalReach : null;
  const isPoly = !!best && best.site.level === "polyneuropathy";
  if (!isPoly) {
    return { applies: false, reach: null, glove: false,
      note: raw ? `a distal 'reach' was given, but the findings localise to ${best ? best.site.id : "(no site)"} — not a length-dependent polyneuropathy`
                : "" };
  }
  if (!raw) {
    return { applies: false, reach: null, glove: false,
      note: "length-dependent polyneuropathy — supply a distal reach (e.g. 'ankles', 'knees') to gauge extent / stocking-glove" };
  }
  return describeReach(raw); // { reach, threshold, involved, glove, applies, note, severity }
}

// ---- TOP-LEVEL SOLVE ----
export function solve(observedSet, options = {}) {
  const opts = { dominantSide: options.dominantSide || "left", sensoryLevel: options.sensoryLevel };
  const single = rankSingle(observedSet, opts);
  const best = single[0] || null;
  const singleExplainsAll = best ? coversAllLocalising(best, observedSet) : false;

  let multi = null;
  if (!singleExplainsAll) {
    const ms = minimalSet(observedSet, opts);
    // Only surface a multifocal hypothesis if it needs >1 site (otherwise the single ranking already has it).
    if (ms && ms.sites.length > 1) multi = ms;
  }

  const nf = nearFit(observedSet, opts);
  const level = describeLevel(best, options.sensoryLevel);
  const length = describeLength(best, options.distalReach);
  return { single, best, singleExplainsAll, multi, nearFit: nf, level, length, dominantSide: opts.dominantSide };
}

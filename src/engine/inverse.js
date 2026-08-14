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

import * as sitesMod from "../model/sites.js";
const { SITES } = sitesMod;
import { scoreSite, LOCALISING, findingIdOf } from "./score.js";
import { expectedFindings } from "./forward.js";
import { normaliseLevel, regionOf, landmarkOf } from "../model/levels.js";
import { describeReach } from "../model/nerveLength.js";
import { prevalenceOf } from "../model/prevalence.js";
import { LEVEL_COMPARTMENT, INTRACRANIAL_COMPARTMENTS } from "../model/compartments.js";

// One enumeration of every candidate lesion site, shared by the engine and the app. Reflection over
// the sites module auto-includes any new `compose*` — no hand-maintained list to drift out of sync.
export function candidateSites() {
  // `buildingBlock` sites (e.g. one-sided cord anterior/posterior primitives) exist only to feed the
  // composers (hemicord / bilateral cord) — they are not clinically standalone lesions, so they are not
  // offered as candidates. The composers read the raw SITES export directly, so they still see them.
  const out = [...SITES.filter(s => !s.buildingBlock)];
  for (const k of Object.keys(sitesMod)) {
    if (k.startsWith("compose") && typeof sitesMod[k] === "function") {
      try { out.push(...sitesMod[k]()); } catch { /* skip a composer that throws on empty input */ }
    }
  }
  return out;
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

// ---- NARROWING DIFFERENTIAL (count / superset) ----
// Every candidate site COMPATIBLE with the findings so far — i.e. whose predicted findings include at least
// one observed token. One finding → many sites; each added finding intersects the set → it narrows. This is
// deliberately NOT the best-fit score (which penalises over-prediction and under-returns on sparse input) —
// it is the broad differential the app shows and narrows. Tie-break on site.id keeps the engine independent
// of the phonebook (the golden rule).
// A lateralised finding entered on one side implies its opposite side was examined and found normal —
// a KNOWN NEGATIVE. Any site that predicts a known-negative would produce a sign the patient demonstrably
// lacks, so it is not a candidate. Only left↔right have a homolog; midline / bilateral / none are skipped.
const OPPOSITE_SIDE = { left: "right", right: "left" };
export function knownNegatives(observedSet) {
  const neg = new Set();
  for (const tok of observedSet) {
    const [f, side] = tok.split("@");
    const other = OPPOSITE_SIDE[side];
    if (!other) continue;
    const homolog = `${f}@${other}`;
    if (!observedSet.has(homolog)) neg.add(homolog);
  }
  return neg;
}

// ---- the raised-pressure (compartment) axis ----
// Papilloedema says INSIDE THE SKULL, not where. Anything intracranial that blocks CSF, swells or exerts
// mass can produce it, so it belongs to no single site's finding set — modelling it per-site would make it
// part of every cortical syndrome. It is instead an axis ORTHOGONAL to localisation, the same shape as the
// sensory level: it narrows the COMPARTMENT (intracranial vs everything below the foramen magnum) and
// annotates the answer, without ever changing which site wins within that compartment.
//
// Excluded deliberately: cord, roots, plexus, peripheral nerves, polyneuropathy, motor unit, combined
// degenerations, the peripheral vestibular apparatus and the sympathetic chain — and the skull-base
// CORRIDORS, which are extra-axial nerve-in-a-canal lesions rather than mass within the compartment.
// DERIVED from the compartment table (compartments.js) so there is exactly one definition of "inside the
// skull". Previously a hand-listed set here, which was a second source of truth waiting to drift.
export const INTRACRANIAL_LEVELS = new Set(
  Object.entries(LEVEL_COMPARTMENT)
    .filter(([, cmp]) => INTRACRANIAL_COMPARTMENTS.has(cmp))
    .map(([level]) => level)
);
const PRESSURE_TOKEN = /^papilloedema@/;

// Is papilloedema among the observations, and what does that mean for the candidate list?
export function raisedPressureAxis(observedSet) {
  const present = [...observedSet].some(t => PRESSURE_TOKEN.test(t));
  return {
    present,
    note: present
      ? "Papilloedema means RAISED INTRACRANIAL PRESSURE. It does not localise, but it does place the lesion INSIDE THE SKULL — so the cord, roots, plexus, peripheral nerves and motor unit are excluded, and anything intracranial that blocks CSF, swells or exerts mass is in play. Image before any lumbar puncture."
      : "",
  };
}

export function differential(observedSet, opts = {}) {
  // The pressure token is stripped before matching: no site's expectedFindings contain it, so leaving it in
  // would make every site fail to explain it and collapse the differential to nothing.
  const observed = [...observedSet].filter(t => !PRESSURE_TOKEN.test(t));
  const pressure = raisedPressureAxis(observedSet);
  const negatives = knownNegatives(observedSet);
  const cands = [];
  for (const site of candidateSites()) {
    if (pressure.present && !INTRACRANIAL_LEVELS.has(site.level)) continue; // compartment filter
    let exp; try { exp = expectedFindings(site, opts); } catch { continue; }
    let contradicted = false;
    for (const neg of negatives) if (exp.has(neg)) { contradicted = true; break; } // known-negative → not a candidate
    if (contradicted) continue;
    const explained = observed.filter(t => exp.has(t));
    // Papilloedema on its own explains nothing site-specific, but it is still informative: every
    // intracranial site stays in play rather than the list collapsing to empty.
    if (!explained.length && !(pressure.present && !observed.length)) continue;
    cands.push({ site, exp, explained, over: [...exp].filter(t => !observedSet.has(t)).length,
                 n: explained.length, prevalence: prevalenceOf(site) });
  }
  // coverage first (localisation), then prevalence (commoner lesion), then tightness, then deterministic id.
  cands.sort((a, b) => b.n - a.n || b.prevalence - a.prevalence || a.over - b.over || a.site.id.localeCompare(b.site.id));
  return cands;
}

// The sites the known-negative filter removed — but only those that WOULD have explained something (so the
// footnote lists relevant near-misses like locked-in, not every unrelated bilateral site). Each is paired
// with the first known-negative token that contradicted it, for a teaching note.
export function ruledOutSites(observedSet, opts = {}) {
  const negatives = knownNegatives(observedSet);
  if (!negatives.size) return [];
  const out = [];
  for (const site of candidateSites()) {
    let exp; try { exp = expectedFindings(site, opts); } catch { continue; }
    let explainsSomething = false;
    for (const t of observedSet) if (exp.has(t)) { explainsSomething = true; break; }
    if (!explainsSomething) continue;
    let contradictedBy = null;
    for (const neg of negatives) if (exp.has(neg)) { contradictedBy = neg; break; }
    if (contradictedBy) out.push({ site, contradictedBy });
  }
  return out;
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
  // The raised-pressure token is an AXIS, not a site finding — no site's expectedFindings contain it. It is
  // therefore stripped from every SCORED path (which would otherwise count it as permanently unexplained and
  // report "no single lesion explains all"), while `differential` below still receives the full set so it can
  // apply the compartment filter. `pressure` is returned so the caller can annotate.
  const pressure = raisedPressureAxis(observedSet);
  const localising = pressure.present
    ? new Set([...observedSet].filter(t => !PRESSURE_TOKEN.test(t)))
    : observedSet;
  const single = rankSingle(localising, opts);
  const best = single[0] || null;
  const singleExplainsAll = best ? coversAllLocalising(best, localising) : false;

  let multi = null;
  if (!singleExplainsAll) {
    const ms = minimalSet(localising, opts);
    // Only surface a multifocal hypothesis if it needs >1 site (otherwise the single ranking already has it).
    if (ms && ms.sites.length > 1) multi = ms;
  }

  const nf = nearFit(localising, opts);
  const level = describeLevel(best, options.sensoryLevel);
  const length = describeLength(best, options.distalReach);
  const diff = differential(observedSet, opts);
  const total = localising.size;
  const explainAll = diff.filter(c => c.n === total);
  const display = explainAll.length ? explainAll : diff;
  const defaultSite = display[0]?.site.id ?? null;
  const ruledOut = ruledOutSites(localising, opts);
  return { single, best, singleExplainsAll, multi, nearFit: nf, level, length, dominantSide: opts.dominantSide,
           differential: diff, explainAll, display, defaultSite, ruledOut, pressure };
}

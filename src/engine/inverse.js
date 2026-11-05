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
import { normaliseLevel, regionOf, landmarkOf, levelIndex, spanName } from "../model/levels.js";
import { describeReach } from "../model/nerveLength.js";
import { prevalenceOf } from "../model/prevalence.js";
import { LEVEL_COMPARTMENT, INTRACRANIAL_COMPARTMENTS, PRESSURE_REACHES } from "../model/compartments.js";
import { EXPLICIT_NORMAL } from "../model/findings.js";
import { BACKGROUND_FINDINGS } from "../model/families.js";
import { enteredToken, enteredSet, predictedSet, sameFamilyInstead } from "./families.js";

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

// The SOLVER'S enumeration: every candidate site plus its VARIANTS — the same cord lesion read at another segment or
// in spinal shock (sites.js cordVariants; spinal cord fix, round 1). A variant keeps its site's id, so content, links
// and pins are untouched, and every ranked list keeps each site once, as its best variant (firstPerId).
// candidateSites() stays one site per id for everything that enumerates sites (the atlas, the per-site tests).
export function solverSites(opts = {}) {
  const level = normaliseLevel(opts.sensoryLevel);
  const out = [];
  for (const site of candidateSites()) {
    out.push(site);
    for (const v of site.variants || []) {
      // Spinal shock needs a stated level (spinal cord fix, row 1c): the level is the bedside discriminator from GBS,
      // and without it the shock reading takes GBS's own picture (measured: the GBS probe, vignette and Why clue).
      if (v.needsLevel && !level) continue;
      // A stated level means a lesion at or above it (row 1b): a reading whose highest segment lies below it is out.
      if (level && v.top && levelIndex(v.top) > levelIndex(level)) continue;
      out.push(variantOf(site, v));
    }
  }
  return out;
}
const variantOf = (site, v) => ({ ...site, variant: v.key, structures: v.structures, atLevel: v.atLevel,
  segments: v.segments, variants: undefined });
const firstPerId = list => { const seen = new Set(); return list.filter(x => { const id = (x.site || x).id; return !seen.has(id) && !!seen.add(id); }); };

function localisingObserved(observedSet) {
  return [...observedSet].filter(s => LOCALISING.has(findingIdOf(s)));
}

// ---- SINGLE-LESION RANKING ----
export function rankSingle(observedSet, opts = {}) {
  return firstPerId(solverSites(opts)
    .map(site => scoreSite(site, observedSet, opts))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score));
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
// UPPER MOTOR NEURONE SIGNS COME BEFORE WEAKNESS (spinal cord fix, row 5, 2026-10-22). A Babinski, brisk reflexes,
// spasticity or Hoffmann's entered on a side means that side's corticospinal tract IS involved, so its other
// corticospinal signs there are a matter of degree, not a known normal: "right leg weak + both plantars up" no longer
// rules out every bilateral cord lesion. Weakness never excuses — "right arm + left leg weak" stays two lesions.
const CORTICOSPINAL_SIGNS = new Set(["weak_arm", "weak_leg", "babinski", "hyperreflexia", "spasticity", "hoffmann"]);
const UMN_RELEASE_SIGNS = ["babinski", "hyperreflexia", "spasticity", "hoffmann"];
// An EXPLICIT NORMAL (a down-going plantar — EXPLICIT_NORMAL in findings.js) is never a known negative: it does
// not exclude. It COUNTS AGAINST the lesions that predict the abnormal finding on that side — see normalNegatives()
// and the `against` demotion in differential(). Built first as an exclusion; driving it showed leg weakness + a
// down-going plantar leaving a single candidate, and a flexor plantar is common early in a stroke (owner ruling
// 2026-09-29: demote, not exclude).
export const isNormalToken = t => Object.prototype.hasOwnProperty.call(EXPLICIT_NORMAL, t.split("@")[0]);
export function knownNegatives(observedSet) {
  const neg = new Set();
  for (const tok of observedSet) {
    if (isNormalToken(tok)) continue;       // a normal implies nothing about the other side either
    const [f, side] = tok.split("@");
    const other = OPPOSITE_SIDE[side];
    if (!other) continue;
    if (CORTICOSPINAL_SIGNS.has(f) && UMN_RELEASE_SIGNS.some(g => observedSet.has(`${g}@${other}`))) continue;
    const homolog = `${f}@${other}`;
    if (!observedSet.has(homolog)) neg.add(homolog);
  }
  return neg;
}
// The abnormal tokens the explicit normals count against: that finding on that side. (A both-sides -> midline rule
// lived here while the conus emitted its UMN signs @midline; it emits them on both sides now, so the per-side rule
// covers it.) A normal that contradicts an entered abnormal finding is ignored.
export function normalNegatives(observedSet) {
  const neg = new Set();
  for (const tok of observedSet) {
    if (!isNormalToken(tok)) continue;
    const [f, side] = tok.split("@");
    const abn = EXPLICIT_NORMAL[f];
    if (!observedSet.has(`${abn}@${side}`)) neg.add(`${abn}@${side}`);
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
// CORRIDORS, which are extra-axial nerve-in-a-canal lesions rather than mass within the compartment. The nerve courses the
// pressure itself injures stay in play (PRESSURE_REACHES in compartments.js — raised-pressure round, row 2).
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

// ---- ranking (accuracy round 1, spec 2026-09-25 A3) ----
// Coverage first, always. Among sites that explain the same number of findings, the old order put
// PREVALENCE before tightness, so a common site predicting seven signs the patient does not have beat an
// uncommon site predicting exactly what was entered (hemisensory loss → "sensorimotor stroke"; thalamic
// pain → the same). Now each prevalence tier is worth PREVALENCE_ALLOWANCE unreported predictions.
// A LINEAR key, deliberately: the pairwise rule first measured ("tighter wins when the gap is ≥ 3") is not
// transitive — three sites can beat each other in a cycle — and gave identical results on every measured
// set (84 vignettes, 364 complete pictures, 233 single findings) while this one is a total order.
export const PREVALENCE_ALLOWANCE = 3;
export const rankKey = c => c.over - PREVALENCE_ALLOWANCE * c.prevalence;

export function differential(observedSet, opts = {}) {
  // The pressure token is stripped before matching: no site's expectedFindings contain it, so leaving it in
  // would make every site fail to explain it and collapse the differential to nothing.
  // Explicit normals are stripped too: they act only through knownNegatives(), never as a finding to explain.
  const observed = [...observedSet].filter(t => !PRESSURE_TOKEN.test(t) && !isNormalToken(t));
  const pressure = raisedPressureAxis(observedSet);
  // WORD FAMILIES (false-multifocal fix, rows 1–4): each entered word is read through its family, in the context of
  // everything entered, and each place's prediction is read the same way. The entered token itself is what is counted,
  // shown and returned in `explained`; `exp` holds the place's tokens as read.
  const read = enteredSet(observedSet);
  const readOf = new Map(observed.map(t => [t, enteredToken(t, observedSet)]));
  const negatives = knownNegatives(read);
  const againstNormal = normalNegatives(read);
  const level = normaliseLevel(opts.sensoryLevel);
  const cands = [];
  for (const site of solverSites(opts)) {
    if (pressure.present && !INTRACRANIAL_LEVELS.has(site.level) && !PRESSURE_REACHES.has(`${site.level}|${site.part}`)) continue; // compartment filter
    let exp; try { exp = predictedSet(expectedFindings(site, opts), read); } catch { continue; }
    let contradicted = false;
    // An ASYMMETRIC site (motor-unit disease, cauda equina) may present on one side: the un-entered side is
    // not evidence against it, so the known-negative exclusion does not apply to it.
    if (!site.asymmetric) for (const neg of negatives) if (exp.has(neg)) { contradicted = true; break; } // known-negative → not a candidate
    if (contradicted) continue;
    const explained = observed.filter(t => exp.has(readOf.get(t)));
    // Papilloedema on its own explains nothing site-specific, but it is still informative: every
    // intracranial site stays in play rather than the list collapsing to empty.
    if (!explained.length && !(pressure.present && !observed.length)) continue;
    // `against`: the first abnormal token an entered normal counts against — the site stays a candidate, demoted.
    const against = [...againstNormal].find(t => exp.has(t)) || null;
    // A STATED SENSORY LEVEL means a cord lesion at or above it (spinal cord fix, row 1a). A site that cannot produce
    // one — anything outside the cord; the conus and cauda lie below every cord level — sorts below every site that
    // explains as much and can: demoted like a recorded normal, never excluded, so no multifocal claim changes.
    const levelAgainst = level && site.level !== "cord" ? level : null;
    cands.push({ site, exp, explained, over: [...exp].filter(t => !read.has(t)).length,
                 n: explained.length, prevalence: prevalenceOf(site), against, levelAgainst });
  }
  // coverage first (localisation), then anything a recorded normal counts against goes below the rest, then fit
  // weighed against prior (rankKey), then prevalence, tightness, id.
  cands.sort((a, b) => b.n - a.n || (!!(a.against || a.levelAgainst) - !!(b.against || b.levelAgainst))
    || rankKey(a) - rankKey(b) || b.prevalence - a.prevalence || a.over - b.over || a.site.id.localeCompare(b.site.id));
  return firstPerId(cands);
}

// The sites the known-negative filter removed — but only those that WOULD have explained something (so the
// footnote lists relevant near-misses like locked-in, not every unrelated bilateral site). Each is paired
// with the first known-negative token that contradicted it, for a teaching note.
export function ruledOutSites(observedSet, opts = {}) {
  const read = enteredSet(observedSet);   // word families, as in differential()
  const negatives = knownNegatives(read);
  if (!negatives.size) return [];
  // Per site, across its variants: ruled out only when EVERY variant that would explain something is contradicted.
  const byId = new Map();
  for (const site of solverSites(opts)) {
    let exp; try { exp = predictedSet(expectedFindings(site, opts), read); } catch { continue; }
    let explainsSomething = false;
    for (const t of read) if (exp.has(t)) { explainsSomething = true; break; }
    if (!explainsSomething) continue;
    if (site.asymmetric) continue; // never excluded by a known negative, so never "ruled out" by one
    let contradictedBy = null;
    for (const neg of negatives) if (exp.has(neg)) { contradictedBy = neg; break; }
    const seen = byId.get(site.id);
    if (!seen) byId.set(site.id, { site, contradictedBy });
    else if (!contradictedBy) seen.contradictedBy = null;
  }
  return [...byId.values()].filter(e => e.contradictedBy).map(e => ({ site: e.site, contradictedBy: e.contradictedBy }));
}

// ---- MINIMAL-SET SEARCH (multifocal) ----
// Greedy set cover over the OBSERVED findings, preferring high-scoring sites and fewest sites.
//
// This used to cover only the LOCALISING findings, which under-called multifocality in two ways
// (owner bug report, 2026-08-15 — "right arm and left leg weakness ... not flagged as multifocal"):
//   1. When NO observed finding is localising — `weak_arm` and `weak_leg` are both long-tract signs and
//      deliberately non-localising — the target set was empty and this returned null immediately, so a
//      picture that plainly needs two lesions produced no multifocal hypothesis at all.
//   2. More generally, if ONE site happened to cover every localising finding, the cover was a single
//      site and `multi` stayed null even while the other findings went unexplained. That silently hit
//      8.8% of site pairs.
// Covering the observed set fixes both. Findings that no site can explain still land in `uncovered`
// rather than inventing a site for them, and the tie-break below still prefers the site that explains
// more of the picture — so a stray sign does not get its own lesion while a real site can absorb it.
// A cover larger than this is not a clinical hypothesis — see the note at its use in solve().
export const MAX_COVER_SITES = 3;

export function minimalSet(observedSet, opts = {}) {
  const needAll = new Set(observedSet);
  if (needAll.size === 0) return null;

  // The pool is the DIFFERENTIAL's candidate list, not a fresh enumeration of every site. differential()
  // already applies the known-negative exclusion (the un-entered opposite side of a lateralised finding is
  // treated as confirmed-normal) and the raised-pressure compartment filter, and it try/catches composers
  // that throw. Enumerating separately let the cover be built from sites the differential had already
  // ruled out: `weak_arm@right` + `weak_leg@left` was "covered" by locked-in alone — a bilateral site that
  // also predicts a weak LEFT arm and a weak RIGHT leg, both recorded as normal — so the cover collapsed to
  // one site and no multifocal hypothesis was offered (owner bug report, 2026-08-15).
  const readOf = new Map([...needAll].map(t => [t, enteredToken(t, observedSet)]));   // word families
  const read = new Set(readOf.values());
  const sites = differential(observedSet, opts)
    .map(c => ({ site: c.site, exp: c.exp, covers: new Set([...needAll].filter(f => c.exp.has(readOf.get(f)))) }))
    .filter(s => s.covers.size > 0);

  const remaining = new Set(needAll);
  const chosen = [];
  while (remaining.size > 0) {
    // pick the site covering the most remaining localising findings; tie-break first on explaining MORE
    // of the observed findings (a site that also accounts for the accompanying long-tract signs is the
    // better lesion than one that merely shares a cranial-nerve sign — the nuclear-vs-peripheral case),
    // then on fewest over-predictions (tightest fit).
    let best = null;
    for (const s of sites) {
      // A family is ONE finding (false-multifocal fix, row 17): its words count once in the gain. Otherwise one
      // cerebellar sign on each side covers eight words, and a hemipons wins the first pick of a two-place cover.
      const gain = new Set([...s.covers].filter(f => remaining.has(f)).map(f => readOf.get(f))).size;
      if (gain === 0) continue;
      const matched = [...s.exp].filter(f => read.has(f)).length;
      const overPredict = [...s.exp].filter(f => !read.has(f)).length;
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
// relaxed away here: it is too specific to ignore. Superset-based, matching the app's "explains all" differential.
// The ONE exception (owner ruling 2026-10-22) lives in solveOne(): a word entered INSTEAD of a same-family word that
// a place predicts on that side — see "THE SAME-FAMILY NEAR-FIT" there.
export function nearFit(observedSet, opts = {}) {
  const observed = [...observedSet];
  const sites = solverSites(opts);
  const read = enteredSet(observedSet);   // word families, as in differential()
  const explainsAll = tokens => {
    for (const site of sites) {
      let exp; try { exp = predictedSet(expectedFindings(site, opts), read); } catch { continue; }
      if (tokens.every(t => exp.has(enteredToken(t, observedSet)))) return site;
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

// ---- SENSORY LEVEL ----
// The cross-sectional pattern says WHICH syndrome; the sensory level says WHERE along the neuraxis. Since the
// spinal cord fix (2026-10-22, owner-approved) a stated level is EVIDENCE as well as an annotation: it demotes what
// cannot produce it (differential), restricts the cord's readings to those at or above it and gates spinal shock
// (solverSites). This function annotates the DISPLAYED answer: the segment when it is a cord site and a valid level was
// given; otherwise why the level does not apply, or — with no level typed — the segment the cord reading implies.
export function describeLevel(best, sensoryLevel) {
  const raw = (typeof sensoryLevel === "string" && sensoryLevel.trim() !== "") ? sensoryLevel : null;
  const isCord = !!best && best.site.level === "cord";
  const segment = normaliseLevel(raw);
  // A stated level the answer cannot produce (spinal cord fix, row 9): flagged, so the app can say so in words with
  // the site's plain name. The engine's own notes below keep their wording.
  const contradicts = !!segment && !!best && !isCord;
  const base = { given: raw, applies: false, segment: null, region: null, landmark: null, note: "", contradicts };

  // Central (syrinx) lesions cause a SUSPENDED cape, not a below-the-level deficit — the single
  // "below the level" sensory level does not apply. Checked before the generic cord branches.
  if (isCord && best.site.part === "central") {
    return { given: raw, applies: false, segment, contradicts,
      region: segment ? regionOf(segment) : null, landmark: segment ? landmarkOf(segment) : null,
      note: "suspended (cape-like) distribution — the sensory loss spans the lesion's segments and is spared above and below, so a single below-the-level sensory level does not apply" };
  }

  // Below the cord: cauda equina / conus. Not a cord "sensory level" — the saddle (S2–S5)
  // distribution is the localiser. Placed before the non-cord "inconsistency" branch so a
  // stated level here is reported gently rather than flagged as contradicting a cord lesion.
  if (best && (best.site.level === "cauda" || best.site.level === "conus")) {
    return { given: raw, applies: false, segment, contradicts,
      region: segment ? regionOf(segment) : null, landmark: segment ? landmarkOf(segment) : null,
      note: "below the cord — a cauda equina / conus lesion; the saddle (S2–S5) distribution is the localiser, not a single sensory level" };
  }

  if (isCord && segment) {
    // "At or just above" could send the scan to the wrong segment — the error the spinal cord fix exists to stop: a
    // level can sit several segments below a compression (owner, 2026-10-22, content round B3).
    return { given: raw, applies: true, segment, region: regionOf(segment), landmark: landmarkOf(segment), contradicts,
      note: `lesion at or above ${segment} — usually just above it, but a compression can sit several segments higher (a cervical lesion can give a thoracic level), so the level does not replace whole-spine imaging` };
  }
  if (isCord && raw && !segment) {
    return { ...base, note: `unrecognised sensory level '${raw}'; expected a segment such as T10` };
  }
  if (isCord && !raw) {
    // No level typed, but the chosen READING of the cord can still say where (spinal cord fix, row 9). Never
    // "thoracic": a legs-only myelopathy can be cervical, and the plans keep the imaging at the whole spine.
    const s = best.site;
    // Wording approved in the content round (owner, 2026-10-22, B1–B2).
    if (s.segments) return { ...base, fromVariant: true,
      note: `root signs ${s.atLevel.sides.length > 1 ? "on both sides" : `on the ${s.atLevel.sides[0]}`} place the lesion at about ${spanName(s.segments, "–")}; the long-tract signs below it come from the same lesion` };
    if (s.variant === "arms-spared") return { ...base, fromVariant: true,
      note: "arms spared — the lesion is below the arm segments, or cervical and not yet reaching the arm fibres; a sensory level will narrow it" };
    return { ...base, note: "level undetermined — a sensory level is needed to localise the segment" };
  }
  if (!isCord && raw) {
    return { given: raw, applies: false, segment, region: segment ? regionOf(segment) : null, contradicts,
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

// ---- SOLVING ONE PICTURE ---- (solve(), below, sets background aside first, then calls this)
function solveOne(observedSet, options = {}) {
  const opts = { dominantSide: options.dominantSide || "left", sensoryLevel: options.sensoryLevel };
  // The raised-pressure token is an AXIS, not a site finding — no site's expectedFindings contain it. It is
  // therefore stripped from every SCORED path (which would otherwise count it as permanently unexplained and
  // report "no single lesion explains all"), while `differential` below still receives the full set so it can
  // apply the compartment filter. `pressure` is returned so the caller can annotate.
  const pressure = raisedPressureAxis(observedSet);
  // Explicit normals (a down-going plantar) are stripped from the scored paths for the same reason: no site
  // produces them. They act through the differential's known negatives, which receives the full set.
  const localising = new Set([...observedSet].filter(t => !PRESSURE_TOKEN.test(t) && !isNormalToken(t)));
  const single = rankSingle(localising, opts);
  const best = single[0] || null;

  const diff = differential(observedSet, opts);
  const total = localising.size;
  const explainAll = diff.filter(c => c.n === total);

  // "Does a single lesion explain everything?" is the SUPERSET question the differential already answers,
  // so it is answered here in exactly one place. It used to be a separate test over the LOCALISING findings
  // only, which returned TRUE VACUOUSLY when none of the observed findings were localising — so
  // `weak_arm@right` + `weak_leg@left` reported "a single lesion explains all" while `explainAll` was
  // simultaneously 0, and the two fields contradicted each other on the same screen (owner bug report,
  // 2026-08-15).
  const singleExplainsAll = explainAll.length > 0;

  let multi = null;
  if (!singleExplainsAll) {
    const ms = minimalSet(localising, opts);
    // Only surface a multifocal hypothesis if it needs >1 site (otherwise the single ranking already has it)
    // and no more than MAX_COVER_SITES. Two lesions is a clinical hypothesis; five is not — a cover that
    // large means the findings are internally INCONSISTENT (typically a lateralised sign entered on the
    // wrong side, which the known-negative filter then uses to eliminate the one site that actually fits,
    // leaving the cover to assemble fragments). Asserting "you have five lesions" would be worse than
    // saying nothing; the near-fit line and the "best explains n/total" header already carry the signal.
    // The bound is evidence-based, not a guess: across every genuine two-lesion pair sampled, 100% cover
    // in <= 3 sites (1838 at exactly 2, 5 at 3), so this discards no real multifocal picture.
    if (ms && ms.sites.length > 1 && ms.sites.length <= MAX_COVER_SITES) multi = ms;
  }

  // THE SAME-FAMILY NEAR-FIT (owner ruling 2026-10-22, false-multifocal fix rows 5–9) — the one exception to "a
  // LOCALISING sign is never relaxed away". A word entered INSTEAD of a family word that a place predicts on that
  // side, and that was not entered (face numbness for the face pain loss a lateral medulla gives): that place is a
  // near-fit, it leads the list, and NO multifocal claim is made — a single non-equivalent word gives one place, not
  // two lesions plus MS (audit round 1). Both words entered is not a substitution, so the claim stands (row 7).
  // DOMINANCE AS A PRIOR (owner ruling 2026-11-01, content-gap fix row 9; audit R1 #10). The setting gates every dominant
  // and non-dominant structure. When NO place explains every finding with the dominance set, the places that do with
  // the other dominance are the answer: atypical (crossed) dominance. They lead, no second lesion is claimed, and the
  // card names the assumption. Whenever any place explains the picture with the setting, this never runs, so an aphasia
  // the left hemisphere explains never lists a right-hemisphere place. It runs before the same-family near-fit: a place
  // that explains everything beats one that explains all but one finding.
  let atypical = null;
  if (!singleExplainsAll) {
    const assumed = opts.dominantSide === "left" ? "right" : "left";
    const alt = differential(observedSet, { ...opts, dominantSide: assumed }).filter(c => c.n === total);
    if (alt.length) atypical = { assumed, sites: alt };
  }
  let sameFamily = null;
  if (!singleExplainsAll && !atypical) {
    const read = enteredSet(localising);
    for (const c of diff) {
      if (c.n !== total - 1) break;
      const missing = [...localising].find(t => !c.explained.includes(t));
      const instead = sameFamilyInstead(enteredToken(missing, localising), c.exp, read);
      if (instead) { sameFamily = { site: c.site, missing, instead }; break; }
    }
  }
  if (sameFamily || atypical) multi = null;
  const nf = atypical ? null : sameFamily || nearFit(localising, opts);
  const display = explainAll.length ? explainAll
    : atypical ? atypical.sites
    : sameFamily ? [diff.find(c => c.site.id === sameFamily.site.id), ...diff.filter(c => c.site.id !== sameFamily.site.id)]
    : diff;
  // The level note describes the answer the reader SEES (spinal cord fix, row 9). It used to read the scored ranking,
  // which can disagree with the display — a GBS answer whose note named Friedreich's.
  const level = describeLevel(display[0] || best, options.sensoryLevel);
  const length = describeLength(best, options.distalReach);
  const defaultSite = display[0]?.site.id ?? null;
  const ruledOut = ruledOutSites(localising, opts);
  return { single, best, singleExplainsAll, multi, nearFit: nf, level, length, dominantSide: opts.dominantSide,
           differential: diff, explainAll: atypical ? atypical.sites : explainAll, display, defaultSite, ruledOut, pressure,
           dominance: atypical ? { assumed: atypical.assumed, set: opts.dominantSide } : null };
}

// ---- BACKGROUND (Hickam) — owner ruling 2026-10-22, false-multifocal fix rows 11–13 ----
// A common finding on BOTH sides (BACKGROUND_FINDINGS: absent ankle jerks, glove-and-stocking numbness) is set aside as
// a probably separate condition when it is what stops one place explaining the rest. It is KEPT when a place in the
// answer predicts it on both sides (GBS keeps its absent ankle jerks); it goes as a pair, never one side; and it never
// joins a multifocal cover, so a genuine two-lesion picture keeps its claim without a background place.
// Returns the tokens to set aside: [] when nothing is.
export function backgroundAside(observedSet, options = {}) {
  const opts = { dominantSide: options.dominantSide || "left", sensoryLevel: options.sensoryLevel };
  const entered = [...observedSet].filter(t => !PRESSURE_TOKEN.test(t) && !isNormalToken(t));
  const pairs = BACKGROUND_FINDINGS.filter(f => entered.includes(`${f}@left`) && entered.includes(`${f}@right`));
  if (!pairs.length) return [];
  const bg = new Set(pairs.flatMap(f => [`${f}@left`, `${f}@right`]));
  const rest = entered.filter(t => !bg.has(t));
  if (!rest.length) return [];                                 // the background IS the picture
  const full = differential(observedSet, opts);
  if (full.some(c => c.n === entered.length)) return [];       // one place explains it all, background included
  // The places in the answer: those explaining everything else, or else the cover of everything else.
  let answer = differential(new Set([...observedSet].filter(t => !bg.has(t))), opts).filter(c => c.n === rest.length);
  if (!answer.length) {
    const ms = minimalSet(new Set(rest), opts);
    answer = ms ? full.filter(c => ms.sites.some(s => s.id === c.site.id)) : [];
  }
  const kept = pairs.filter(f => answer.some(c => c.exp.has(`${f}@left`) && c.exp.has(`${f}@right`)));
  return pairs.filter(f => !kept.includes(f)).flatMap(f => [`${f}@left`, `${f}@right`]);
}

// ---- TOP-LEVEL SOLVE ----
// The background step runs first: what it sets aside is not localised at all, and the rest is solved as usual.
// `background` is null, or { tokens } — the tokens set aside, for the card to name.
export function solve(observedSet, options = {}) {
  const aside = backgroundAside(observedSet, options);
  if (!aside.length) return { ...solveOne(observedSet, options), background: null };
  return { ...solveOne(new Set([...observedSet].filter(t => !aside.includes(t))), options), background: { tokens: aside } };
}

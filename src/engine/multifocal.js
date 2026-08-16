// multifocal.js (engine) — matching and ranking for the cross-site layer. LOGIC ONLY: every disease name,
// feature and red flag lives in src/data/multifocal.js so the content can be reviewed on its own.
//
// HARD constraints (substrate / sites / motor / forbids) FILTER: they are anatomical facts, and an entity
// that does not fit them does not apply. SOFT constraints (tempo / course) only DEMOTE — a mismatch is
// informative, not disqualifying (owner ruling, 2026-08-14).
//
// Spec: docs/superpowers/specs/2026-08-14-multi-location-ddx-design.md §3
import { MULTIFOCAL, FINDING_CLASSES } from "../data/multifocal.js";
import { compartmentOf } from "../model/compartments.js";
import { regionOf } from "../data/causes.js";
import { umnLmnPattern } from "./patterns.js";
import { LIKELIHOOD } from "../data/causes.js";
import { solve } from "./inverse.js";
import { LOCALISING } from "./score.js";
import { separatedInSpace } from "./space.js";
import { substratesAt } from "../model/substrate.js";

const idOf = t => t.split("@")[0];

// Does ONE site satisfy ONE site-clause? An empty clause `{}` means "any site" (used as the second,
// unconstrained half of a pair like sarcoid's "cranial nerve PLUS something else").
function siteMatches(site, clause) {
  if (!clause || Object.keys(clause).length === 0) return true;
  if (clause.compartment && compartmentOf(site) !== clause.compartment) return false;
  if (clause.level && site.level !== clause.level) return false;
  if (clause.region && regionOf(site) !== clause.region) return false;
  if (clause.part && site.part !== clause.part) return false;
  return true;
}

// Each clause must be satisfied by a DISTINCT site. This is bipartite matching (clauses <-> sites), so a
// greedy "first match wins" walk is order-dependent: a permissive clause evaluated before a specific one
// can consume the only site the specific clause needed, wrongly rejecting an entity that DOES have a
// valid assignment. Exhaustive backtracking removes that dependency — clause order cannot affect whether
// an assignment is found, only the search path taken to find one. Clause counts are 2-3 against a handful
// of sites, so exhaustive search is trivially cheap; there is no case here worth optimising.
export function assignClauses(sites, clauses) {
  const used = new Array(sites.length).fill(false);
  const why = new Array(clauses.length).fill(null);

  function assign(clauseIndex) {
    if (clauseIndex === clauses.length) return true;
    const clause = clauses[clauseIndex];
    for (let i = 0; i < sites.length; i++) {
      if (used[i] || !siteMatches(sites[i], clause)) continue;
      used[i] = true;
      why[clauseIndex] = { clause, satisfiedBy: sites[i] };
      if (assign(clauseIndex + 1)) return true;
      used[i] = false;
      why[clauseIndex] = null;
    }
    return false;
  }

  return assign(0) ? why : null;
}

// ---- SUBSTRATE + DISTRIBUTION (spec 2026-08-15 §4) ----
// A disease attacks a SUBSTRATE, and that substrate has its own distribution through the body. Vasculitis
// crosses the CNS/PNS boundary because vessels exist on both sides of it; metastases do not, because
// parenchyma does not. Distribution is a property of the target tissue, not of the disease's "shape".
//
// This REPLACED a "lesion pattern" axis that phrased every rule as "every site is X". That formulation was
// implemented, measured and rejected: silent site pairs rose 7.8% -> 38.0%, 74% of them mixed CNS+PNS, and
// `cord + L5 root` returned an empty card — because a mixed picture could satisfy no single pattern, so the
// two diseases whose defining feature is hitting BOTH sides (vasculitis, neurosyphilis) were exactly the
// two that could never fire on one.
export const DISTRIBUTIONS = ["segment", "any", "nerveTrunk"];

// An entity fires when its substrate is present at EVERY site, and its distribution rule holds over the set.
export function substrateMatches(entity, sites, observedSet) {
  if (!Array.isArray(sites) || sites.length < 2) return false;

  // `motor_neuron` is a property of the observed FINDINGS (upper + lower motor neurone signs together),
  // not of a place — so it delegates to the existing synthesis and never consults the site set.
  if (entity.substrate === "motor_neuron") return umnLmnPattern(observedSet).verdict === "mixed";

  if (!sites.every(s => substratesAt(s).has(entity.substrate))) return false;

  switch (entity.distribution) {
    // Emboli lodge at branch points, so the lesions sit in distinct arterial segments.
    case "segment": return separatedInSpace(sites, "segment");
    // Disseminated in space on any axis — segment, vessel, lobe, hemisphere or level.
    case "any": return separatedInSpace(sites, "any");
    // Vasculitis of the vasa nervorum: the same substrate as vasculitis, restricted to peripheral nerve.
    case "nerveTrunk": return sites.every(s => compartmentOf(s) === "nerve");
    default: return true;
  }
}

export function unifyingDiagnoses(sites, observedSet, { onset, course } = {}) {
  const concordant = [], discordant = [];
  if (!Array.isArray(sites) || sites.length < 2) return { concordant, discordant };

  const observedIds = new Set([...observedSet].map(idOf));
  const motor = umnLmnPattern(observedSet);

  for (const entity of MULTIFOCAL) {
    let why = [];

    // --- hard: anatomical sense-check (owner ruling 4, 2026-08-14) ---
    // An optional allow-list of compartments the entity can plausibly involve. If declared, EVERY site in
    // the set must resolve to one of the listed compartments, or the entity does not fire at all — this is
    // anatomy, not tempo, so it FILTERS exactly like spread/sites/motor/forbids, never merely demotes. An
    // entity without the field is unconstrained (unchanged behaviour). E.g. two peripheral-nerve sites must
    // not be able to return Primary CNS lymphoma or an embolic shower, which make no anatomical sense there.
    if (entity.compartments && sites.some(s => !entity.compartments.includes(compartmentOf(s)))) continue;

    // --- hard: SUBSTRATE — the tissue this disease attacks, and how it spreads within it ---
    if (entity.substrate) {
      if (!substrateMatches(entity, sites, observedSet)) continue;
      why.push({ clause: { substrate: entity.substrate, distribution: entity.distribution || null },
                 satisfiedBy: null });
    }
    // --- hard: specific places ---
    if (entity.sites && entity.sites.length) {
      const w = assignClauses(sites, entity.sites);
      if (!w) continue;
      why = why.concat(w);
    }
    // --- hard: motor pattern, delegated to the existing synthesis so the two can never disagree ---
    if (entity.motor && motor.verdict !== entity.motor) continue;
    // `motor` is determined by umnLmnPattern() over ALL observed findings, not by any one site.
    if (entity.motor) why.push({ clause: { motor: entity.motor }, satisfiedBy: null });

    // --- hard: forbidden finding CLASSES ---
    if (entity.forbids && entity.forbids.some(cls => (FINDING_CLASSES[cls] || []).some(f => observedIds.has(f)))) continue;

    // --- soft: tempo and course DEMOTE, never drop ---
    const demotions = [];
    if (onset && !entity.tempo.includes(onset)) demotions.push({ axis: "tempo", entered: onset, expected: entity.tempo });
    if (course && !entity.course.includes(course)) demotions.push({ axis: "course", entered: course, expected: entity.course });

    (demotions.length ? discordant : concordant).push({ ...entity, why, demotions });
  }

  const rank = (a, b) =>
    LIKELIHOOD.indexOf(a.likelihood) - LIKELIHOOD.indexOf(b.likelihood) || b.why.length - a.why.length;
  return { concordant: concordant.sort(rank), discordant: discordant.sort(rank) };
}

// THE PARSIMONY GUARD. Multifocality is a claim that must be earned, and the app's first job is to try to
// talk you out of it: a localising sign entered on the wrong side is the one real path to over-calling,
// because nearFit() deliberately refuses to relax a localising sign.
//
// So rather than relaxing it automatically, we NAME it and hand the judgement to the clinician — which is
// that rule's intent. For each localising finding, does removing it collapse the picture to one site?
//
// Returns `{ findings: [{ token, collapsesTo }] }` — each element pairs a forcing finding with the SITE
// THAT TOKEN collapses to. This is deliberately per-finding rather than a single shared field: different
// forcing findings can collapse the picture to different sites (e.g. two mirrored lesions, each one's
// contralateral vertigo token forcing collapse onto the OTHER side's site), and a shared field can only
// ever report one of them, silently misnaming the rest.
export function forcingFindings(observedSet, opts = {}) {
  const current = solve(observedSet, opts);
  if (current.singleExplainsAll) return { findings: [] };

  const findings = [];
  for (const tok of observedSet) {
    if (!LOCALISING.has(idOf(tok))) continue; // a soft sign can never be what forces a second lesion
    const without = new Set([...observedSet].filter(t => t !== tok));
    const r = solve(without, opts);
    if (r.singleExplainsAll) {
      const collapsesTo = (r.display && r.display[0] ? r.display[0].site : r.best && r.best.site) || null;
      findings.push({ token: tok, collapsesTo });
    }
  }
  return { findings };
}

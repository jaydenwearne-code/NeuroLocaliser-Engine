// multifocal.js (engine) — matching and ranking for the cross-site layer. LOGIC ONLY: every disease name,
// feature and red flag lives in src/data/multifocal.js so the content can be reviewed on its own.
//
// HARD constraints (spread / sites / motor / forbids) FILTER: they are anatomical facts, and an entity
// that does not fit them does not apply. SOFT constraints (tempo / course) only DEMOTE — a mismatch is
// informative, not disqualifying (owner ruling, 2026-08-14).
//
// Spec: docs/superpowers/specs/2026-08-14-multi-location-ddx-design.md §3
import { MULTIFOCAL, FINDING_CLASSES } from "../data/multifocal.js";
import { compartmentOf } from "../model/compartments.js";
import { regionOf } from "../data/causes.js";
import { umnLmnPattern } from "./patterns.js";
import { LIKELIHOOD } from "../data/causes.js";

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

// Each clause must be satisfied by a DISTINCT site. Greedy assignment is sufficient here: clause counts
// are 2-3 and clauses are near-disjoint, so there is no meaningful backtracking to do.
function assignClauses(sites, clauses) {
  const used = new Set();
  const why = [];
  for (const clause of clauses) {
    const hit = sites.find(s => !used.has(s.id) && siteMatches(s, clause));
    if (!hit) return null;
    used.add(hit.id);
    why.push({ clause, satisfiedBy: hit });
  }
  return why;
}

function spreadSatisfied(sites, spread) {
  const minSites = spread.minSites || 2;
  if (sites.length < minSites) return null;
  if (spread.distinctCompartments) {
    const cmps = new Set(sites.map(compartmentOf).filter(Boolean));
    if (cmps.size < spread.distinctCompartments) return null;
    return [{ clause: { spread: `${cmps.size} compartments` }, satisfiedBy: sites[0] }];
  }
  return [{ clause: { spread: `${sites.length} sites` }, satisfiedBy: sites[0] }];
}

export function unifyingDiagnoses(sites, observedSet, { onset, course } = {}) {
  const concordant = [], discordant = [];
  if (!Array.isArray(sites) || sites.length < 2) return { concordant, discordant };

  const observedIds = new Set([...observedSet].map(idOf));
  const motor = umnLmnPattern(observedSet);

  for (const entity of MULTIFOCAL) {
    let why = [];

    // --- hard: dissemination in space ---
    if (entity.spread) {
      const w = spreadSatisfied(sites, entity.spread);
      if (!w) continue;
      why = why.concat(w);
    }
    // --- hard: specific places ---
    if (entity.sites && entity.sites.length) {
      const w = assignClauses(sites, entity.sites);
      if (!w) continue;
      why = why.concat(w);
    }
    // --- hard: motor pattern, delegated to the existing synthesis so the two can never disagree ---
    if (entity.motor && motor.verdict !== entity.motor) continue;
    if (entity.motor) why.push({ clause: { motor: entity.motor }, satisfiedBy: sites[0] });

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

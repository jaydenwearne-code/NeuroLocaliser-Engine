// tracts.js (engine) — map observed findings to the long tract(s) they implicate, with the candidate
// lesion sites arranged along each tract's course. Structured facts only (no prose / no SVG); the app
// composes the narrative and the diagram from these. Candidate sites come from differential(), so the
// known-negative exclusion + prevalence ranking already applied. A site is "on the tract" when it PREDICTS
// one of the tract's findings — keyed on shared findings, not (level,part), so composites (hemicord, whole
// MCA) map correctly even though the cord/anterior primitive is a buildingBlock.
import { TRACTS, NEURAXIS, neuraxisIndex } from "../model/tracts.js";
import { differential } from "./inverse.js";

const idOf = tok => tok.split("@")[0];
const sideOf = tok => tok.split("@")[1];

export function tractsFor(observedSet, opts = {}) {
  const observed = [...observedSet];
  const cands = differential(observedSet, opts);
  const out = [];
  for (const tract of TRACTS) {
    const findingSet = new Set(tract.findings);
    const matched = observed.filter(t => findingSet.has(idOf(t)));
    if (!matched.length) continue;
    const sides = [...new Set(matched.map(sideOf))];
    // Order candidate sites along the pathway. Classic rostro-caudal tracts order by the global neuraxis
    // (preserved exactly). Non-classical pathways (oculosympathetic, visual) whose course leaves the neuraxis
    // order by their OWN course position, so central→preganglionic→postganglionic / nerve→chiasm→cortex read right.
    const courseLevels = tract.course.map(w => w.level);
    const classic = courseLevels.every(l => NEURAXIS.includes(l));
    const courseIndexOf = lvl => { const i = courseLevels.indexOf(lvl); return i >= 0 ? i : courseLevels.length + neuraxisIndex(lvl); };
    const sortKey = lvl => classic ? neuraxisIndex(lvl) : courseIndexOf(lvl);
    const sites = cands
      .filter(c => [...c.exp].some(t => findingSet.has(idOf(t))))
      .map(c => ({ site: c.site, level: c.site.level, neuraxisIndex: neuraxisIndex(c.site.level), courseIndex: courseIndexOf(c.site.level), explained: c.explained }))
      .sort((a, b) => sortKey(a.level) - sortKey(b.level) || a.neuraxisIndex - b.neuraxisIndex || a.site.id.localeCompare(b.site.id));
    out.push({ tract, findingsMatched: matched, sides, sites, decussation: tract.decussation });
  }
  return out;
}

// Compose the tract's anatomical journey from the structured waypoint fields (detail + supply), the
// decussation, and the crossing note. Physiological order: descending tracts read cortex→cord, ascending
// tracts read cord→thalamus. Prose is intentionally template-composed (tuned by eye).
function capFirst(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }
function joinAnd(xs) { return xs.length > 1 ? xs.slice(0, -1).join(", ") + " and " + xs[xs.length - 1] : (xs[0] || ""); }
export function tractNarrative(tract) {
  const asc = tract.direction === "ascending";
  const path = asc ? [...tract.course].reverse() : tract.course; // origin → termination
  const withSupply = w => w.supply ? `${w.detail} (${w.supply})` : w.detail;
  const origin = path[0];
  const rest = path.slice(1);
  const term = rest.length ? rest[rest.length - 1] : origin;
  const middle = rest.slice(0, -1);
  const middlePhrases = middle.map((w, i) => i === 0 ? withSupply(w) : w.detail); // supply on the first convergence level only
  let s = `The ${tract.label} ${asc ? "begins in the" : "arises in the"} ${withSupply(origin)}`;
  if (middle.length) s += `, ${asc ? "ascending" : "descending"} through the ${joinAnd(middlePhrases)}`;
  if (tract.decussation.label) s += `, ${asc ? "having decussated" : "decussating"} at the ${tract.decussation.label}`;
  s += `, to reach the ${term.detail}. ${capFirst(tract.crossingNote)}.`;
  return s;
}

// whyNotOthers() was retired 2026-09-26 — the integrated Why (src/engine/why.js) and the compare panel answer
// "why not elsewhere" for the candidates actually in play (spec 2026-09-26).

// tracts.js (engine) — map observed findings to the long tract(s) they implicate, with the candidate
// lesion sites arranged along each tract's course. Structured facts only (no prose / no SVG); the app
// composes the narrative and the diagram from these. Candidate sites come from differential(), so the
// known-negative exclusion + prevalence ranking already applied. A site is "on the tract" when it PREDICTS
// one of the tract's findings — keyed on shared findings, not (level,part), so composites (hemicord, whole
// MCA) map correctly even though the cord/anterior primitive is a buildingBlock.
import { TRACTS, neuraxisIndex } from "../model/tracts.js";
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
    const sites = cands
      .filter(c => [...c.exp].some(t => findingSet.has(idOf(t))))
      .map(c => ({ site: c.site, level: c.site.level, neuraxisIndex: neuraxisIndex(c.site.level), explained: c.explained }))
      .sort((a, b) => a.neuraxisIndex - b.neuraxisIndex || a.site.id.localeCompare(b.site.id));
    out.push({ tract, findingsMatched: matched, sides, sites, decussation: tract.decussation });
  }
  return out;
}

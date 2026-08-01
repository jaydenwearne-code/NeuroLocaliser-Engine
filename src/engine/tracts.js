// tracts.js (engine) — map observed findings to the long tract(s) they implicate, with the candidate
// lesion sites arranged along each tract's course. Structured facts only (no prose / no SVG); the app
// composes the narrative and the diagram from these. Candidate sites come from differential(), so the
// known-negative exclusion + prevalence ranking already applied. A site is "on the tract" when it PREDICTS
// one of the tract's findings — keyed on shared findings, not (level,part), so composites (hemicord, whole
// MCA) map correctly even though the cord/anterior primitive is a buildingBlock.
import { TRACTS, NEURAXIS, neuraxisIndex } from "../model/tracts.js";
import { differential } from "./inverse.js";
import { expectedFindings } from "./forward.js";
import { LOCALISING } from "./score.js";

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

// Level buckets for the "why not the other sites" reasoning.
const BUCKET = {
  cortex: "cortical", subcortex: "deep subcortical", aphasia_subcortical: "deep subcortical",
  thalamus: "deep subcortical", hypothalamus: "deep subcortical",
  midbrain: "brainstem", pons: "brainstem", medulla: "brainstem", cord: "spinal cord",
  guillain_mollaret: "brainstem", combined_degeneration: "spinal cord", cerebellum: "cerebellum",
  // non-classical pathway stations (oculosympathetic, visual)
  sympathetic: "sympathetic chain", skull_base: "skull base / orbit", visual_pathway: "chiasm / optic tract", pupil: "orbit / pupil",
};
const BUCKET_ORDER = ["cortical", "deep subcortical", "brainstem", "cerebellum", "spinal cord",
  "chiasm / optic tract", "sympathetic chain", "skull base / orbit", "orbit / pupil"];
const bucketOf = level => BUCKET[level] || "other";

// For the SELECTED lesion, derive what each OTHER candidate on its tract(s) would additionally produce (and
// which is absent) — grouped by neuraxis-level bucket, with the bucket's blood supply. This is the "why this
// site and not the others" reasoning: the discriminating signs to examine for and exclude.
export function whyNotOthers(observedSet, selectedSite, opts = {}) {
  const tf = tractsFor(observedSet, opts);
  const relevant = tf.filter(t => t.sites.some(s => s.site.id === selectedSite.id));
  let selExp; try { selExp = expectedFindings(selectedSite, opts); } catch { selExp = new Set(); }
  const bucketSupply = {};
  for (const t of relevant) for (const w of t.tract.course) {
    const b = bucketOf(w.level); if (w.supply && !bucketSupply[b]) bucketSupply[b] = w.supply;
  }
  const byBucket = {}; const seen = new Set();
  for (const t of relevant) for (const s of t.sites) {
    if (s.site.id === selectedSite.id || seen.has(s.site.id)) continue; seen.add(s.site.id);
    let exp; try { exp = expectedFindings(s.site, opts); } catch { continue; }
    const b = bucketOf(s.site.level);
    for (const tok of exp) {
      if (selExp.has(tok) || observedSet.has(tok)) continue;
      const id = tok.split("@")[0];
      (byBucket[b] ??= new Map()).set(id, (byBucket[b].get(id) || 0) + (LOCALISING.has(id) ? 2 : 1));
    }
  }
  const buckets = BUCKET_ORDER.filter(b => byBucket[b]).map(b => ({
    bucket: b, label: b, supply: bucketSupply[b] || "",
    findings: [...byBucket[b].entries()].sort((a, c) => c[1] - a[1]).slice(0, 4).map(([id]) => id),
  }));
  return { selectedBucket: bucketOf(selectedSite.level), buckets };
}

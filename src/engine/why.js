// why.js — the integrated Why (spec 2026-09-26). For each entered finding: what carries it at the chosen site,
// why it is on that side, and everywhere else it could arise on its own; then where they all MEET. Entirely
// DERIVED — from the forward model, the candidate sites and the differential. Nothing is authored per syndrome.
//
// `meet` is the differential's explain-all set mapped to (station, side), not a raw intersection of possible
// places: it applies the known-negative rule, so the Why and the Where cannot disagree.
import { candidateSites, differential } from "./inverse.js";
import { expectedFindings, explain } from "./forward.js";
import { STRUCTURE_BY_ID } from "../model/structures.js";
import { TRACTS } from "../model/tracts.js";
import { stationOf, STATION_ORDER, STATION_GROUP, AXIS } from "../model/stations.js";
import { REASON, TRACT_SAME, CROSSING_NAME } from "../data/sideReasons.js";

// "corticobulbar tract (to the facial nucleus)" -> "corticobulbar tract"; "trigeminal lemniscus — crosses…" ->
// "trigeminal lemniscus". Model labels carry teaching asides that do not belong mid-sentence.
const plain = s => String(s).replace(/\s*\([^)]*\)/g, "").split(" — ")[0].trim();
const fillIn = (tpl, v) => tpl.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "");
const byOrder = (a, b) => STATION_ORDER.indexOf(a) - STATION_ORDER.indexOf(b);

// token -> Set of stations where ANY candidate site produces it. Built once per (dominance, sensory level),
// the two options that change what a site emits.
const INDEX = new Map();
function locusIndex(opts) {
  const key = `${opts.dominantSide || "left"}|${opts.sensoryLevel || ""}`;
  if (INDEX.has(key)) return INDEX.get(key);
  const idx = new Map();
  for (const s of candidateSites()) {
    let E; try { E = expectedFindings(s, opts); } catch { continue; }
    const st = stationOf(s); if (!st) continue;
    for (const t of E) (idx.get(t) ?? idx.set(t, new Set()).get(t)).add(st);
  }
  INDEX.set(key, idx);
  return idx;
}

// Stations as a phrase: runs of three or more along the long-tract AXIS compress to "A → B"; off-axis stations
// follow in station order.
export function renderWhere(stations) {
  const parts = [];
  let run = [];
  const flush = () => { if (run.length >= 3) parts.push(`${run[0]} → ${run[run.length - 1]}`); else parts.push(...run); run = []; };
  for (const s of AXIS) { if (stations.includes(s)) run.push(s); else flush(); }
  flush();
  return [...parts, ...stations.filter(s => !AXIS.includes(s)).sort(byOrder)].join(", ");
}

function relationOf(token, site) {
  const side = token.split("@")[1];
  if (side === "none") return "none";
  if (site.side === "bilateral") return "both";
  if (site.side === "midline" || side === "midline") return "midline";
  return side === site.side ? "same" : "opposite";
}

// Why is this finding on this side? The relation is already decided by the forward model; this only explains
// it. A tract is chosen by finding MEMBERSHIP (not course level): the relation is derived, the tract only
// supplies the words — and the pontine Horner rows sit at a level the oculosympathetic course does not list.
// A SHARED finding on no tract (ptosis: CN III or sympathetic) takes the tract of a SIBLING — a structure at
// the same site with the same carrier — so a sympathetic ptosis rides with the sympathetic miosis.
export function reasonFor(finding, relation, struct, station, siblingFindings = []) {
  if (relation === "both") return REASON.both;
  if (relation === "midline") return REASON.midline;
  if (relation === "none") return struct?.hemisphere === "dominant" ? REASON.noneDominant
    : struct?.hemisphere === "nondominant" ? REASON.noneNondominant : REASON.none;
  const tract = TRACTS.find(t => t.findings.includes(finding))
    || TRACTS.find(t => siblingFindings.some(f => t.findings.includes(f)));
  if (tract) {
    if (relation === "same" && TRACT_SAME[tract.id]) return TRACT_SAME[tract.id];
    if (tract.decussation && tract.decussation.label) {
      const v = { tract: plain(tract.label), crossing: CROSSING_NAME[tract.id] || plain(tract.decussation.label) };
      return fillIn(relation === "opposite" ? REASON.crossOpposite : REASON.crossSame, v);
    }
  }
  const g = STATION_GROUP[station];
  if (relation === "opposite" && g === "hemisphere") return REASON.hemisphereOpposite;
  if (relation === "same" && g === "cerebellum") return REASON.cerebellumSame;
  if (relation === "same" && g === "brainstem") return REASON.brainstemSame;
  if (relation === "opposite" && g === "brainstem") return REASON.brainstemOpposite;
  if (relation === "same" && g === "peripheral") return REASON.peripheralSame;
  return REASON[relation];
}

export function whyChain(observedSet, site, opts = {}) {
  const idx = locusIndex(opts);
  // Only findings some site produces are steps: papilloedema (an axis) and the refractive and functional signs
  // (flags) carry their own banners and localise nothing.
  const toks = [...observedSet].filter(t => idx.has(t));
  const station = stationOf(site);
  const ex = explain(site, opts);
  const carrierOf = e => STRUCTURE_BY_ID[e.structure].note.split(" — ")[0];
  const steps = toks.map((token, order) => {
    const [finding, bodySide] = token.split("@");
    const e = ex.find(x => `${x.finding}@${x.bodySide}` === token);
    const struct = e ? STRUCTURE_BY_ID[e.structure] : null;
    const stations = [...idx.get(token)].sort(byOrder);
    const relation = relationOf(token, site);
    const siblings = e ? ex.filter(x => x.finding !== finding && carrierOf(x) === carrierOf(e)).map(x => x.finding) : [];
    return {
      token, finding, bodySide, explained: !!e,
      carrier: struct ? struct.note.split(" — ")[0] : null,
      structure: struct ? struct.id : null,
      relation, reason: e ? reasonFor(finding, relation, struct, station, siblings) : "",
      stations, where: renderWhere(stations), order,
    };
  }).sort((a, b) => a.stations.length - b.stations.length || a.order - b.order);
  const all = toks.length ? differential(new Set(toks), opts).filter(c => c.n === toks.length) : [];
  const pairs = [...new Set(all.map(c => `${stationOf(c.site)}|${c.site.side}`))];
  const meet = {
    stations: [...new Set(pairs.map(p => p.split("|")[0]))].sort(byOrder),
    sides: [...new Set(pairs.map(p => p.split("|")[1]))],
  };
  const verdict = !pairs.length ? "none" : meet.stations.length === 1 ? "one" : "several";
  return { steps, meet, verdict, station };
}

// ---- the Why line's key clues (spec 2026-09-27 §4) ----
// The fewest entered findings that, ON THEIR OWN, narrow the differential to the place the whole picture meets
// at. Chosen against the SAME explain-all differential the Where card uses — not against each finding's "could
// arise at" stations, which stalled on 12 of 249 single-place answers (a brachial-plexus cord: each finding
// could be plexus or nerve, but no single nerve carries both, and only the differential sees that).
// Returns data, not prose: app/answer.js words it with the plain labels.
export function whyClues(chain, observedSet, opts = {}) {
  if (chain.verdict === "none") return { verdict: "none", clues: [], more: 0, reached: true, meet: chain.meet, where: "" };
  // One unit per FINDING. Entered on both sides it is ONE "bilateral" clue with no side relation — split, the
  // known-negative rule would read one side alone as the other side confirmed normal.
  const units = [];
  for (const s of chain.steps) {
    const u = units.find(x => x.finding === s.finding);
    if (u) {
      u.tokens.push(s.token);
      if (u.tokens.some(t => t.endsWith("@left")) && u.tokens.some(t => t.endsWith("@right"))) { u.side = "bilateral"; u.relation = "both"; }
      continue;
    }
    units.push({ finding: s.finding, tokens: [s.token], order: s.order, relation: s.relation,
      side: s.bodySide === "left" || s.bodySide === "right" ? s.bodySide : null });
  }
  const memo = new Map();
  const placesOf = toks => {
    const key = [...toks].sort().join(" ");
    if (!memo.has(key)) {
      const fit = differential(new Set(toks), opts).filter(c => c.n === toks.length);
      memo.set(key, [...new Set(fit.map(c => `${stationOf(c.site)}|${c.site.side}`))]);
    }
    return memo.get(key);
  };
  const target = placesOf(units.flatMap(u => u.tokens));
  const within = p => p.length > 0 && p.every(x => target.includes(x));
  // Ties go first to a side relation the chosen clues do not show yet (so a crossed picture shows both halves),
  // then to the finding the clinician entered first — measured against station count, entry order gave the more
  // natural clue (Weber: arm weakness, not forehead sparing; compressive CN III: ptosis, not weak elevation).
  const fresh = (u, chosen) => chosen.length > 0 && !chosen.some(c => c.relation === u.relation);
  const better = (u, p, b, bp, chosen) => {
    if (p.length !== bp.length) return p.length < bp.length;
    if (fresh(u, chosen) !== fresh(b, chosen)) return fresh(u, chosen);
    return u.order < b.order;
  };
  const chosen = [], pool = [...units];
  let cur = [];
  while (pool.length) {
    let best = null, bp = null;
    for (const u of pool) {
      const p = placesOf([...chosen, u].flatMap(x => x.tokens));
      if (p.length && (!best || better(u, p, best, bp, chosen))) { best = u; bp = p; }
    }
    if (!best) break;
    chosen.push(best); cur = bp; pool.splice(pool.indexOf(best), 1);
    if (within(cur)) break;
  }
  const reached = within(cur);
  // Crossed completion: clues that show ONE side get the other side's first finding, so Wallenberg reads
  // "… + right body pain loss". Clues that show no side at all are left alone — a whole-MCA picture is pinned by
  // "impaired repetition" by itself, and adding sides to it would be noise.
  const kinds = ["same", "opposite"].filter(k => chosen.some(c => c.relation === k));
  if (kinds.length === 1 && chosen.length < 3) {
    const other = units.find(u => u.relation === (kinds[0] === "same" ? "opposite" : "same"));
    if (other) chosen.push(other);
  }
  const shown = chosen.slice(0, 3);
  return {
    verdict: chain.verdict, reached, more: chosen.length - shown.length,
    clues: shown.map(u => ({ finding: u.finding, side: u.side, relation: u.relation, tokens: u.tokens })),
    meet: chain.meet, where: renderWhere(chain.meet.stations),
  };
}

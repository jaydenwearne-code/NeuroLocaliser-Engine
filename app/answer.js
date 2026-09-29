// answer.js — the answer card's lines (spec 2026-09-27 §3.1). Pure and DOM-free, so every line and every edge
// state is asserted in node (test/answer.test.js). Nothing here is authored per site: each line is DERIVED from
// what the detail cards below already compute. Findings are named as the app shows them — the plain label with
// its proper name in brackets (displayLabel, owner ruling 2026-09-29).
import { whyChain, whyClues } from "../src/engine/why.js";
import { causesFor, rankCauses, leadingCause } from "../src/data/causes.js";
import { pathologyNextStepsFor, combinedNextSteps } from "../src/data/nextSteps.js";
import { nameForSite } from "../src/data/syndromes.js";
import { unifyingDiagnoses } from "../src/engine/multifocal.js";
import { MULTIFOCAL } from "../src/data/multifocal.js";
import { combinedSites } from "./combined-sites.js";
import { plainSiteName } from "./labels.js";
import { displayLabel } from "./plain-labels.js";

const cap = s => (s ? s[0].toUpperCase() + s.slice(1) : s);
const andList = xs => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const orList = xs => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} or ${xs[xs.length - 1]}`);

// ---- Where ----
export function whereLine({ place, others = [], cover = null, fit = null }) {
  if (cover && cover.length >= 2) return `No single place explains every finding — likely ${andList(cover)}.`;
  if (fit && fit.n < fit.total) return `${place} explains ${fit.n} of ${fit.total} findings.`;
  if (!others.length) return `${place}.`;
  const n = others.length, shown = others.slice(0, 2);
  const tail = n > 2 ? `, and ${n - 2} more` : "";
  return `${place}. ${n} other place${n > 1 ? "s" : ""} also fit${n > 1 ? "" : "s"}: ${shown.join(", ")}${tail}.`;
}

// ---- Why ----
// renderWhere() writes a run of three or more long-tract stations as "A → B"; the sentence reads it as a range.
function placePhrase(where, side) {
  const parts = where.split(", ");
  const ranges = parts.filter(p => p.includes(" → ")).map(p => { const [a, b] = p.split(" → "); return `anywhere from the ${a} to the ${b}`; });
  const points = parts.filter(p => !p.includes(" → "));
  return [...ranges, points.length ? `the ${side}${orList(points)}` : ""].filter(Boolean).join(", or ");
}
export function whySentence(w) {
  if (!w || w.verdict === "none" || !w.clues.length) return "These findings need more than one lesion — see Together.";
  const lhs = cap(w.clues.map(c => `${c.side ? c.side + " " : ""}${displayLabel(c.finding)}`).join(" + "))
    + (w.more ? ` + ${w.more} more finding${w.more > 1 ? "s" : ""}` : "");
  const s = w.meet.sides.length === 1 && (w.meet.sides[0] === "left" || w.meet.sides[0] === "right") ? `${w.meet.sides[0]} ` : "";
  if (w.verdict === "one") return `${lhs} → only the ${s}${w.where}.`;
  return `${lhs} → ${placePhrase(w.where, s)}; see Where for what separates them.`;
}

// ---- What ----
// `causes` are the concordant causes (causesFor().all); a cause set aside by the onset is only counted.
// `oldStroke`: a chronic onset set the site's infarct aside and the plan follows another cause — but a deficit present
// for months is often a residual OLD stroke, so the line says so (owner, 2026-09-29).
export function whatLine({ causes = [], demotedCount = 0, selected = null, entity = null, twoLesions = false, oldStroke = false }) {
  if (selected) return `Selected: ${selected}.`;
  if (twoLesions) return entity ? `Together: ${entity}.` : "No catalogued disease spans these places — see Together.";
  // rankCauses/leadingCause are the ranking the Next steps' onset rule reads too, so What and Next name the same
  // cause. A SEQUEL (`after`, e.g. central post-stroke pain) never leads and is never the must-not-miss — it is
  // named in its own clause, as what may follow an earlier event (owner, 2026-09-29).
  const ranked = rankCauses(causes);
  if (!ranked.length) return demotedCount ? `No cause here typically starts this way — ${demotedCount} set aside.` : "";
  const top = leadingCause(causes), mustNot = ranked.find(c => c.red && c !== top && !c.after);
  const sq = ranked.find(c => c.after), sequel = sq ? `After a previous ${sq.after} here: ${sq.name}.` : "";
  if (!top) return sequel;
  return `Most likely ${top.name}${top.red ? " (must not miss)" : ""}.${mustNot ? ` Must not miss: ${mustNot.name}.` : ""}`
    + `${oldStroke ? " Could represent an old stroke." : ""}${sequel ? ` ${sequel}` : ""}`;
}

// ---- which workup is on screen ----
// ONE resolution, shared by the Next card and the answer card, so the badge and the Next line can never describe
// a different plan from the card below them. It follows the selection, as the Next card always has.
export function resolveNext({ site, r, pinned, scope, selectedPathology, selectedEntity, onset }) {
  const { sites } = combinedSites(r, r.display, pinned);
  const combined = sites.length >= 2 && scope === "all";
  const o = { onset: onset || undefined };
  const nx = combined
    ? combinedNextSteps(sites, selectedEntity || null, o)
    : pathologyNextStepsFor(site, selectedPathology || null, o);
  return { nx, combined };
}

// ---- the whole card ----
// `st` carries exactly what app.js holds: the solve() result, the selected candidate, the finding count, and the
// case state (tokens, onset, course, dominant, sensoryLevel, pinned, scope, selectedPathology, selectedEntity).
export function answerFor(st) {
  const opts = { dominantSide: st.dominant, sensoryLevel: st.sensoryLevel || undefined };
  const list = st.r.display;
  const place = s => plainSiteName(s, { dominantSide: st.dominant }).place;
  const { sites } = combinedSites(st.r, list, st.pinned);
  const twoLesions = !st.r.explainAll.length && sites.length >= 2;
  const { nx, combined } = resolveNext({ ...st, site: st.sel.site });
  let entity = st.selectedEntity || null;
  if (twoLesions && !entity) {
    const u = unifyingDiagnoses(sites, st.tokens, { onset: st.onset || undefined, course: st.course || undefined });
    entity = u.concordant.length ? u.concordant[0].name : null;
  }
  const res = causesFor(st.sel.site, { onset: st.onset || undefined });
  const entityRed = st.selectedEntity ? ((MULTIFOCAL.find(e => e.name === st.selectedEntity) || {}).red || null) : null;
  const lines = {
    where: whereLine({
      place: place(st.sel.site),
      others: list.filter(c => c.n === st.total && c.site.id !== st.sel.site.id).map(c => place(c.site)),
      cover: twoLesions ? sites.map(place) : null,
      fit: { n: st.sel.n, total: st.total },
    }),
    why: whySentence(whyClues(whyChain(st.tokens, st.sel.site, opts), st.tokens, opts)),
    what: whatLine({
      causes: res.all, demotedCount: (res.demoted || []).length,
      selected: (twoLesions ? st.selectedEntity : st.selectedPathology) || null, entity, twoLesions,
      oldStroke: !!(nx.followed && nx.followed.onset === "chronic"),
    }),
    next: nx.referral || "",
    red: entityRed || nameForSite(st.sel.site).red || null,
  };
  return { lines, nx, combined, twoLesions };
}

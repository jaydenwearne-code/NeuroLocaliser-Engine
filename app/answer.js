// answer.js — the answer card's lines (spec 2026-09-27 §3.1). Pure and DOM-free, so every line and every edge
// state is asserted in node (test/answer.test.js). Nothing here is authored per site: each line is DERIVED from
// what the detail cards below already compute. Findings are named as the app shows them — the plain label with
// its proper name in brackets (displayLabel, owner ruling 2026-09-29).
import { whyChain, whyClues } from "../src/engine/why.js";
import { causesFor, rankCauses, leadingCause, pressureDemotesAt } from "../src/data/causes.js";
import { pathologyNextStepsFor, combinedNextSteps, hyperacuteVascular } from "../src/data/nextSteps.js";
import { nameForSite, phonebookVariant } from "../src/data/syndromes.js";
import { unifyingDiagnoses } from "../src/engine/multifocal.js";
import { MULTIFOCAL } from "../src/data/multifocal.js";
import { combinedSites } from "./combined-sites.js";
import { plainSiteName, readingLabel } from "./labels.js";
import { displayLabel, PLAIN } from "./plain-labels.js";

const cap = s => (s ? s[0].toUpperCase() + s.slice(1) : s);
const andList = xs => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const orList = xs => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} or ${xs[xs.length - 1]}`);

// ---- Where ----
// A word as the near-fit line names it: its label, its proper name, and its row note when it has one — "face numbness
// (thalamic pattern)". The note is what says why two words for the face are different findings.
const wordFor = f => displayLabel(f) + (PLAIN[f] && PLAIN[f].note ? ` (${PLAIN[f].note})` : "");
// Background set aside (false-multifocal fix rows 11–15; wording approved by the owner 2026-10-22).
export const BACKGROUND_LINE = {
  reflex_ankle_loss: "Absent ankle jerks on both sides are set aside: common with age and in a neuropathy, and probably a separate condition.",
  distal_sensory_loss: "Glove-and-stocking numbness on both sides is set aside: a length-dependent neuropathy (most often diabetic) is common, and probably a separate condition.",
};
// Row 9 (owner-approved wording, raised-pressure round 2026-11-05): the false-localising set-aside.
export const falseLocalisingSentence = n => !n ? "" : n > 1
  ? "The sixth-nerve palsies are set aside: with papilloedema they are a false-localising sign of the raised pressure, not further lesions."
  : "The sixth-nerve palsy is set aside: with papilloedema it is a false-localising sign of the raised pressure, not a second lesion.";
export const B12_LINE = "With a myelopathy, check B12 (subacute combined degeneration) before calling them separate.";
export const backgroundSentence = (findings, cord = false) =>
  findings.length ? findings.map(f => BACKGROUND_LINE[f]).join(" ") + (cord ? ` ${B12_LINE}` : "") : "";
// Row 14 (owner-approved wording, content-gap fix 2026-11-01): the assumption the dominance fallback made.
export const dominanceSentence = d =>
  d ? `This assumes the ${d.assumed} hemisphere is dominant, though ${d.set} dominance is set (atypical dominance). If that is unlikely for this patient, no single place explains these findings.` : "";
export function whereLine({ place, others = [], cover = null, fit = null, instead = null, background = "" }) {
  const after = background ? ` ${background}` : "";
  if (cover && cover.length >= 2) return `No single place explains every finding — likely ${andList(cover)}.${after}`;
  // The same-family near-fit (rows 5–10): the place, both words, and what to do — never "two lesions".
  if (instead && fit) return `${place} explains ${fit.n} of ${fit.total} findings. It gives ${wordFor(instead.gives)}, but ${wordFor(instead.entered)} was entered — re-examine that before calling this two lesions.${after}`;
  if (fit && fit.n < fit.total) return `${place} explains ${fit.n} of ${fit.total} findings.${after}`;
  if (!others.length) return `${place}.${after}`;
  const n = others.length, shown = others.slice(0, 2);
  const more = n > 2 ? `, and ${n - 2} more` : "";
  return `${place}. ${n} other place${n > 1 ? "s" : ""} also fit${n > 1 ? "" : "s"}: ${shown.join(", ")}${more}.${after}`;
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
// a different plan from the card below them. It follows the selection, as the Next card always has. Papilloedema steers it as
// the onset does (pressure follows the cause, rows 9 and 11); and where no cause at the place can raise the pressure, the plan
// follows the pressure itself: the pressure-only card's Next line, badged at least urgent (row 10). A selection, the
// all-sites view and a two-place card are left as they are.
export function resolveNext({ site, r, pinned, scope, selectedPathology, selectedEntity, onset }) {
  const { sites } = combinedSites(r, r.display, pinned);
  const combined = sites.length >= 2 && scope === "all";
  const pressure = !!(r.pressure && r.pressure.present);
  const o = { onset: onset || undefined, pressure };
  const nx = combined
    ? combinedNextSteps(sites, selectedEntity || null, o)
    : pathologyNextStepsFor(site, selectedPathology || null, o);
  const twoLesions = !r.explainAll.length && sites.length >= 2;
  if (pressure && !combined && !selectedPathology && !twoLesions && pressureLeads(site, onset))
    return { nx: { ...nx, referral: PRESSURE_ONLY.next, urgency: nx.urgency === "emergency" ? "emergency" : "urgent", pressureLeads: true }, combined };
  return { nx, combined };
}

// Papilloedema is entered and no cause at this place can raise the pressure, at this onset (row 10). One test, read by
// resolveNext and by the What card. The retina, and a place outside the skull, never demote for the pressure, so never qualify.
// INSIDE THE STROKE WINDOW THE PRESSURE NEVER LEADS (owner, 2026-11-11, in the integration of the open fixes): at hyperacute
// onset, at a place whose leading cause is vascular (hyperacuteVascular, the escalation's own test), papilloedema cannot have
// formed since the onset, so it predates the event. There the card keeps the place's own stroke card — its causes, plan, badge
// and red flag, read without the papilloedema — and names the pressure on a second line (strokeWindowHolds).
const pressureEmpties = (site, onset) =>
  pressureDemotesAt(site) && !causesFor(site, { onset: onset || undefined, pressure: true }).all.length;
export const strokeWindowHolds = (site, onset) => pressureEmpties(site, onset) && hyperacuteVascular(site, onset);
export const pressureLeads = (site, onset) => pressureEmpties(site, onset) && !hyperacuteVascular(site, onset);

// ---- papilloedema with nothing else localised (raised-pressure round, rows 4 and 10, owner-approved wording) ----
// The card names no place: every intracranial place explains 0 of 0, and the first of them is an accident of the ranking.
export const PRESSURE_ONLY = {
  head: "Raised intracranial pressure",
  where: "Inside the skull — papilloedema means raised intracranial pressure, and on its own it does not say where.",
  why: "Papilloedema → raised intracranial pressure: it places the problem inside the skull but localises nothing.",
  what: "Find what is raising the pressure: a mass, hydrocephalus or cerebral venous sinus thrombosis — idiopathic intracranial hypertension only once those are excluded.",
  next: "Image the head, with venography, before any lumbar puncture; neurosurgery if there is a mass or hydrocephalus.",
  urgency: "urgent",
};
// ---- the pressure follow's wording (pressure follows the cause, rows 16–18, owner-approved 2026-11-10) ----
// The What card's band for the causes papilloedema demotes, and the Next card's notes. Plain text: app.js escapes it.
export const PRESSURE_BAND = {
  title: "less likely with papilloedema",
  note: "Papilloedema means the intracranial pressure is raised. These causes do not raise it: they can explain the deficit, but not the papilloedema.",
  tag: "does not raise the pressure",
};
export const PRESSURE_LEADS_NOTE = "No cause usually found here raises the intracranial pressure, so the plan follows the papilloedema itself.";
// Why the plan follows a cause nobody selected: the pressure's sentence, or the approved onset sentence (2026-09-29).
export function followNote(f) {
  if (!f) return "";
  if (f.pressure && f.by && f.by.pressure) return f.by.onset
    ? `Following the most likely cause, ${f.cause}. A ${f.onset} onset and papilloedema set aside ${f.setAside}, which this site's usual plan is written for.`
    : `Following the most likely cause, ${f.cause}. Papilloedema sets aside ${f.setAside}, which cannot raise the intracranial pressure and is what this site's usual plan is written for.`;
  return `Following the most likely cause, ${f.cause}. A ${f.onset} onset rules out ${f.setAside}, which this site's usual plan is written for.`;
}
// A demoted cause's reason as its row shows it: the tempo it usually has, that it does not raise the pressure, or both.
export function demotionReason(d) {
  return [d.axis === "tempo" ? `usually ${d.expected.join(" / ")}` : "", d.axis === "pressure" || d.pressure ? PRESSURE_BAND.tag : ""]
    .filter(Boolean).join(" · ");
}

const pressureOnlyFalseLocalising = n => !n ? "" : n > 1
  ? " The sixth-nerve palsies are a false-localising sign of the raised pressure, not further lesions."
  : " The sixth-nerve palsy is a false-localising sign of the raised pressure, not a second lesion.";
function pressureOnlyCard(nFalseLocalising) {
  return { lines: { where: PRESSURE_ONLY.where + pressureOnlyFalseLocalising(nFalseLocalising), why: PRESSURE_ONLY.why,
    what: PRESSURE_ONLY.what, next: PRESSURE_ONLY.next, red: null },
    nx: { urgency: PRESSURE_ONLY.urgency, referral: PRESSURE_ONLY.next }, combined: false, twoLesions: false, pressureOnly: true };
}

// ---- the whole card ----
// `st` carries exactly what app.js holds: the solve() result, the selected candidate, the finding count, and the
// case state (tokens, onset, course, dominant, sensoryLevel, pinned, scope, selectedPathology, selectedEntity).
export function answerFor(st) {
  // The dominance the answer assumes (content-gap fix, rows 9 and 15): the setting, or the other side when the engine's
  // dominance fallback answered. The place, the Why line and the red flag all read with it.
  const dom = st.r.dominance ? st.r.dominance.assumed : st.dominant;
  const opts = { dominantSide: dom, sensoryLevel: st.sensoryLevel || undefined };
  const list = st.r.display;
  const place = s => plainSiteName(s, { dominantSide: dom }).place;
  const { sites } = combinedSites(st.r, list, st.pinned);
  const twoLesions = !st.r.explainAll.length && sites.length >= 2;
  // Background set aside (rows 11–15) is not localised: it leaves the count and the Why line, and the Where line names
  // it. The same-family near-fit's entered word (rows 5–10) is named on the Where line and left out of the Why line,
  // which explains the rest.
  // The false-localising palsies (raised-pressure round, rows 3 and 9) leave the count and the Why line, as background does.
  const flTok = st.r.pressure && st.r.pressure.falseLocalising ? st.r.pressure.falseLocalising.tokens : [];
  const aside = new Set([...(st.r.background ? st.r.background.tokens : []), ...flTok]);
  const nf = st.r.nearFit && st.r.nearFit.instead && st.r.nearFit.site.id === st.sel.site.id ? st.r.nearFit : null;
  const whyTokens = new Set([...st.tokens].filter(t => !aside.has(t) && !(nf && t === nf.missing)));
  const total = st.total - aside.size;
  if (st.r.pressure && st.r.pressure.present && total === 0) return pressureOnlyCard(flTok.length); // rows 4, 10
  const background = [backgroundSentence([...new Set([...aside].filter(t => !flTok.includes(t)).map(t => t.split("@")[0]))], st.sel.site.level === "cord"),
    falseLocalisingSentence(flTok.length)].filter(Boolean).join(" ");
  const { nx, combined } = resolveNext({ ...st, site: st.sel.site });
  let entity = st.selectedEntity || null;
  if (twoLesions && !entity) {
    const u = unifyingDiagnoses(sites, st.tokens, { onset: st.onset || undefined, course: st.course || undefined });
    entity = u.concordant.length ? u.concordant[0].name : null;
  }
  const pressed = !!(st.r.pressure && st.r.pressure.present);
  // Inside the stroke window the place's own causes stand, read without the papilloedema, and the pressure is the What line's
  // second sentence (owner, 2026-11-11) — on the same cards the pressure would otherwise lead.
  const held = pressed && !combined && !twoLesions && !st.selectedPathology && strokeWindowHolds(st.sel.site, st.onset);
  const res = causesFor(st.sel.site, { onset: st.onset || undefined, pressure: pressed && !held });
  const entityRed = st.selectedEntity ? ((MULTIFOCAL.find(e => e.name === st.selectedEntity) || {}).red || null) : null;
  const lines = {
    where: whereLine({
      place: place(st.sel.site) + readingLabel(st.sel.site),
      others: list.filter(c => c.n === total && c.site.id !== st.sel.site.id).map(c => place(c.site)),
      cover: twoLesions ? sites.map(place) : null,
      fit: { n: st.sel.n, total },
      instead: nf ? { entered: nf.missing.split("@")[0], gives: nf.instead.split("@")[0] } : null,
      background,
    }) + (st.r.dominance ? ` ${dominanceSentence(st.r.dominance)}` : ""),
    why: whySentence(whyClues(whyChain(whyTokens, st.sel.site, opts), whyTokens, opts)),
    what: whatLine({
      causes: res.all, demotedCount: (res.demoted || []).length,
      selected: (twoLesions ? st.selectedEntity : st.selectedPathology) || null, entity, twoLesions,
      // With papilloedema the line names a cause that can raise the pressure; an old stroke cannot (row 14).
      oldStroke: !pressed && !!(nx.followed && nx.followed.onset === "chronic"),
    }) + (held ? ` ${PRESSURE_ONLY.what}` : ""),
    next: nx.referral || "",
    // The card's cause's own flags here, then the place's (the card follows its cause): a two-place card's selected disease
    // speaks for itself.
    red: entityRed || redLine(st.sel.site, cardCause({ res, selected: twoLesions ? null : st.selectedPathology,
      twoLesions, pressureLeads: !!nx.pressureLeads }), dom),
  };
  // The card follows the pressure itself (row 10): the pressure-only card's What line. No cause is named, so the red line is the
  // place's own flag, true whatever the cause (row 10's blank reversed, 2026-11-11). resolveNext gave the Next line and badge.
  if (nx.pressureLeads) lines.what = PRESSURE_ONLY.what;
  return { lines, nx, combined, twoLesions };
}

// ---- the red line: the card follows its cause (owner-ruled 2026-11-11; spec 2026-11-11-card-follows-cause-design.md) ----
// The cause the card names: the reader's selection, else the What line's most likely cause (which the plan follows). None on a
// two-place card (the Together card's disease speaks there) or when the pressure itself leads. One rule for the answer card and
// the What card, so a future axis that moves the What line's cause moves the flag with it.
export function cardCause({ res, selected = null, twoLesions = false, pressureLeads = false }) {
  if (twoLesions || pressureLeads) return null;
  if (selected) return [...res.all, ...(res.demoted || [])].find(c => c.name === selected) || null;
  return leadingCause(res.all) || null;
}
// A cause's flag shows at this place unless it is restricted to another place reading the same list, or to the other
// hemisphere (as the phonebook resolves it).
export function flagApplies(flag, site, dominantSide) {
  if (!flag.only) return true;
  if (flag.only === "dominant" || flag.only === "nondominant") return phonebookVariant(site, { dominantSide }) === flag.only;
  return site.id.replace(/^(left|right)_/, "") === flag.only;
}
// The red line: the cause's flags at this place, then the place's own flag (true whatever the cause). Null when neither.
export function redLine(site, cause, dominantSide) {
  const own = ((cause && cause.flags) || []).filter(f => flagApplies(f, site, dominantSide)).map(f => f.text);
  const all = [...own, nameForSite(site, { dominantSide }).red].filter(Boolean);
  return all.length ? all.join(" ") : null;
}

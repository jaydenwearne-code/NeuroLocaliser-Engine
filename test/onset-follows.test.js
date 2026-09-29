// onset-follows.test.js — a stroke plan stops at a slow onset (spec 2026-09-29-onset-follows-cause-design.md).
// A stroke-window site's plan is written for its infarct. When the entered onset sets that infarct aside, the Next
// steps follow the cause the What line names instead — its authored confirmatory, monitoring, referral and urgency —
// while immediate and first-line stay the site's (the tier split). Owner rulings 2026-09-29.
import { SITES } from "../src/model/sites.js";
import { causesFor, leadingCause } from "../src/data/causes.js";
import { sitePlan, nextStepsFor, onsetFollows, pathologyNextStepsFor, resolveUrgency, combinedNextSteps } from "../src/data/nextSteps.js";
import { pathologyPlanFor } from "../src/data/pathologyNextSteps.js";
import { compartmentOf } from "../src/model/compartments.js";
import { whatLine } from "../app/answer.js";

let pass = 0, fail = 0;
const ok = (l, c, d = "") => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l + (c ? "" : `  ${d}`)); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const kind = s => `${s.level}|${s.part}`;
const KINDS = []; { const seen = new Set(); for (const s of SITES) if (!seen.has(kind(s))) { seen.add(kind(s)); KINDS.push(s); } }
const ONSETS = ["hyperacute", "acute", "subacute", "chronic"];
const site = id => SITES.find(s => s.id === id);

// ---- 1: nothing changes without an onset, or at acute onset ----
{
  const moved = [];
  for (const s of SITES) for (const onset of [undefined, "acute"]) {
    const nx = nextStepsFor(s, { onset });
    if (!same(nx, sitePlan(s, { onset })) || "followed" in nx) moved.push(`${s.id}@${onset || "none"}`);
  }
  ok("with no onset, and at acute onset, every site's plan is its own", moved.length === 0, moved.slice(0, 5).join(", "));
}

// ---- 2: where it fires, and how often ----
// The counts are a RATCHET: a content change that moves them (a new site, a cause re-tempoed) must be looked at,
// not absorbed.
{
  const WIN = new Set(["brain", "brainstem", "cerebellum", "cord", "optic"]);
  // …and something still fits the onset: at subacute onset NO cause at the optic nerve (AION) fits, the What line
  // says so ("No cause here typically starts this way"), and there is nothing to follow — the site plan stands.
  const expected = (s, onset) => {
    const lead = causesFor(s).all.find(c => c.cat !== "mimic");
    if (!WIN.has(compartmentOf(s)) || !lead || lead.cat !== "vascular") return false;
    const at = causesFor(s, { onset }).all;
    return at.length > 0 && !at.some(c => c.name === lead.name);
  };
  const counts = {}, wrong = [];
  for (const onset of ONSETS) {
    counts[onset] = 0;
    for (const s of KINDS) {
      const f = onsetFollows(s, onset);
      if (f) counts[onset]++;
      if (!!f !== expected(s, onset)) wrong.push(`${kind(s)}@${onset}`);
    }
  }
  ok("it fires exactly where the onset sets aside a stroke-window site's vascular leading cause", wrong.length === 0, wrong.join(", "));
  ok("site kinds: hyperacute 1, acute 0, subacute 40, chronic 42",
     same(counts, { hyperacute: 1, acute: 0, subacute: 40, chronic: 42 }), JSON.stringify(counts));
  ok("the one hyperacute case is the optic nerve (AION)",
     KINDS.filter(s => onsetFollows(s, "hyperacute")).map(kind).join() === "skull_base|optic_aion");
}

// ---- 3: what follows the cause, and what stays the site's ----
{
  const bad = [];
  for (const onset of ONSETS) for (const s of KINDS) {
    const f = onsetFollows(s, onset);
    if (!f) continue;
    const nx = nextStepsFor(s, { onset }), own = sitePlan(s, { onset }), cause = pathologyNextStepsFor(s, f.cause, { onset });
    if (!same(nx.immediate, own.immediate) || !same(nx.investigations, own.investigations)) bad.push(`${kind(s)}@${onset}: site tiers`);
    if (!same(nx.confirmatory, cause.confirmatory) || !same(nx.monitoring, cause.monitoring) || nx.referral !== cause.referral)
      bad.push(`${kind(s)}@${onset}: cause tiers`);
    if (nx.urgency !== resolveUrgency(s, f.cause, { onset })) bad.push(`${kind(s)}@${onset}: urgency`);
    if (!same(nx.followed, f) || f.onset !== onset) bad.push(`${kind(s)}@${onset}: followed`);
  }
  ok("immediate and first-line stay the site's; the rest is the followed cause's plan, urgency as if it were selected",
     bad.length === 0, bad.slice(0, 5).join(", "));
}

// ---- 4: the What line and the Next line name the same cause, and it has an authored plan ----
{
  const bad = [];
  for (const onset of ONSETS) for (const s of KINDS) {
    const f = onsetFollows(s, onset);
    if (!f) continue;
    const res = causesFor(s, { onset });
    if (!whatLine({ causes: res.all }).startsWith(`Most likely ${f.cause}`)) bad.push(`${kind(s)}@${onset}: what`);
    if (leadingCause(res.all).name !== f.cause) bad.push(`${kind(s)}@${onset}: leading`);
    if (!pathologyPlanFor(f.cause, s)) bad.push(`${kind(s)}@${onset}: no plan`);
  }
  ok("the followed cause is the one the What line names, and has an authored plan", bad.length === 0, bad.slice(0, 5).join(", "));
}

// ---- 5: a selection wins, and builds on the site's own plan exactly as before ----
{
  const bad = [];
  for (const onset of ["subacute", "chronic"]) for (const s of KINDS) {
    if (!onsetFollows(s, onset)) continue;
    const own = sitePlan(s, { onset });
    for (const c of causesFor(s, { onset }).all) {
      const nx = pathologyNextStepsFor(s, c.name, { onset }), plan = pathologyPlanFor(c.name, s);
      if ("followed" in nx) bad.push(`${kind(s)}@${onset} / ${c.name}: followed`);
      if (!same(nx.immediate, own.immediate) || !same(nx.investigations, own.investigations)) bad.push(`${kind(s)}@${onset} / ${c.name}: site tiers`);
      if (nx.referral !== ((plan && plan.referral) || own.referral)) bad.push(`${kind(s)}@${onset} / ${c.name}: referral`);
      if (nx.pathology !== c.name) bad.push(`${kind(s)}@${onset} / ${c.name}: pathology`);
    }
  }
  ok("a selected cause carries no 'followed' and builds on the site's own plan", bad.length === 0, bad.slice(0, 5).join(", "));
}

// ---- 6: the canary — no stroke referral beside a non-vascular most likely cause ----
// Referrals conditional by their own wording ("stroke team if acute", "urgent stroke pathway if HINTS is central")
// are correct at any onset and exempt.
{
  const STROKE = /hyperacute|thromboly|thrombectomy|stroke team|stroke pathway|stroke\/TIA service/i;
  const CONDITIONAL = /(stroke|TIA)[^.;]*\bif\b|\bif (acute|HINTS|central)/i;
  const hits = onset => KINDS.filter(s => {
    const top = leadingCause(causesFor(s, { onset }).all), ref = pathologyNextStepsFor(s, null, { onset }).referral || "";
    return top && top.cat !== "vascular" && STROKE.test(ref) && !CONDITIONAL.test(ref);
  }).map(kind);
  ok("chronic onset: no site pairs a stroke referral with a non-vascular most likely cause", hits("chronic").length === 0, hits("chronic").join(", "));
  ok("subacute onset: only the retina, whose leading cause is GCA (spec §4, out of scope)",
     hits("subacute").join() === "visual_pathway|retina", hits("subacute").join(", "));
}

// ---- 7: the case the defect was found on ----
{
  const s = site("left_cortex_motor_facearm");
  const nx = pathologyNextStepsFor(s, null, { onset: "chronic" });
  ok("chronic motor cortex follows Glioma / metastasis, setting aside the MCA infarct",
     !!nx.followed && nx.followed.cause === "Glioma / metastasis" && nx.followed.setAside === "MCA superior division infarct",
     JSON.stringify(nx.followed));
  ok("…to neuro-oncology, urgent — not the hyperacute stroke pathway",
     /neuro-oncology/i.test(nx.referral) && nx.urgency === "urgent" && !/thromboly|hyperacute/i.test(nx.referral), `${nx.urgency} ${nx.referral}`);
  ok("…with the site's own first steps", same(nx.immediate, sitePlan(s, { onset: "chronic" }).immediate));
  const h = pathologyNextStepsFor(s, null, { onset: "hyperacute" });
  ok("at hyperacute onset it is still the stroke plan, an emergency", !h.followed && h.urgency === "emergency" && /thromboly/i.test(h.referral), h.referral);
}

// ---- 8: two lesions follow site by site ----
{
  const pair = [site("left_cortex_motor_facearm"), site("right_cortex_occipital")];
  const slow = combinedNextSteps(pair, null, { onset: "chronic" }), none = combinedNextSteps(pair, null, {});
  ok("two stroke sites at chronic onset: no hyperacute stroke referral, no emergency badge",
     !/thromboly|hyperacute/i.test(slow.referral) && slow.urgency !== "emergency", `${slow.urgency} ${slow.referral}`);
  ok("…and with no onset the union is the two stroke plans, as before",
     /thromboly/i.test(none.referral) && none.urgency === "emergency");
}

console.log(`\nonset follows the cause: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

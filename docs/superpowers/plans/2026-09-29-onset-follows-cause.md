# Onset follows the cause — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status: IMPLEMENTED (2026-09-29).** Spec: `docs/superpowers/specs/2026-09-29-onset-follows-cause-design.md` (approved).

**Goal:** At a slow onset that rules out a stroke-window site's infarct, the Next steps (and the answer card's Next line
and badge) follow the authored plan of the cause the What line names, instead of the site's stroke plan.

**Architecture:** One derived rule in the data layer, the mirror of the existing hyperacute escalation.
`nextStepsFor` becomes `sitePlan` (today's body) plus `onsetFollows`. A selected cause still builds on `sitePlan`, so
selection behaviour is unchanged. The What line and the rule share one ranking function (`rankCauses` /
`leadingCause` in `causes.js`). The only UI change is a one-line note on the Next card.

**Tech Stack:** Zero-dependency Node ES modules; standalone test scripts with an `ok()` helper chained in the
`package.json` `test` script; static web app in `app/`.

## Global Constraints

- Node is off PATH: prefix every node/npm command with `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"`.
- Work on branch `fix/onset-follows-cause` (already created off `main` at `65278f8`; the spec is committed as `ff3b7db`).
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **No new clinical text.** The rule only chooses between plans that are already authored and signed off. The one new
  sentence is the Next card note, whose template the owner approved with the design.
- **Never merge or push to `main`** and never enable auto-merge. Merging deploys to testers; the owner merges.
- Clinical behaviour changes need the owner's review. Task 3 is that gate. Stop there.

## Prototyped before writing

Every code block below was run in a scratch copy of the repo before this plan was written. Results: the full suite
green at **82 suites / 7068 assertions**, with every existing test passing unedited. The new suite is 15/15 and
the answer card +5. The Next card note was checked in the browser (chronic motor cortex: URGENT, neuro-oncology,
the note, scope tags "— site" / "— Glioma / metastasis"). Two things the prototype found are already in the code
below:

- **Nothing to follow at the optic nerve at subacute onset.** Every cause there is set aside, and the What line says
  "No cause here typically starts this way". The rule requires something to follow, and the test helper states that
  condition.
- **The recursion trap.** `resolveUrgency` used to call `nextStepsFor`. Once `nextStepsFor` calls `resolveUrgency`,
  that recursion never ends. `resolveUrgency` must read `sitePlan`.

## Files

| File | Responsibility |
|---|---|
| `src/data/causes.js` | `rankCauses(causes)`, `leadingCause(causes)`: the What line's ranking, shared |
| `src/data/nextSteps.js` | `sitePlan` (the old `nextStepsFor` body), `onsetFollows`, `nextStepsFor` = site plan + follow; `resolveUrgency` and `pathologyNextStepsFor`-with-a-cause read `sitePlan` |
| `app/answer.js` | `whatLine` ranks with `rankCauses` |
| `app/app.js` | `nextBlock`: the follow note and the scope tags |
| `test/onset-follows.test.js` | new suite (spec §7) |
| `test/answer.test.js` | the chronic card |
| `package.json` | chain the new suite; version 0.10.1 (Task 4) |

---

### Task 1: The rule, test-first

**Files:**
- Create: `test/onset-follows.test.js`
- Modify: `package.json` (test script), `src/data/causes.js` (after `causesFor`), `app/answer.js` (imports, `RANK`,
  `whatLine`), `src/data/nextSteps.js` (header comment, import, `resolveUrgency`, public API, `pathologyNextStepsFor`),
  `test/answer.test.js` (before the final `console.log`)

**Interfaces:**
- Produces: `rankCauses(causes) → causes[]`, `leadingCause(causes) → cause | null` (causes.js);
  `sitePlan(site, opts) → plan` (today's `nextStepsFor` output); `onsetFollows(site, onset) → { cause, setAside, onset } | null`;
  `nextStepsFor(site, opts)` now carries `followed: { cause, setAside, onset }` when the rule fires, and no such key
  otherwise.
- Consumed by Task 2: `nx.followed` on the object `resolveNext` returns for a single site with nothing selected.

- [ ] **Step 1: Write the failing test.** Create `test/onset-follows.test.js`:

```js
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
```

- [ ] **Step 2: Chain it into `npm test`.** In `package.json`, in the `test` script, replace
  `node test/answer.test.js"` with `node test/answer.test.js && node test/onset-follows.test.js"`.

- [ ] **Step 3: Run it and watch it fail.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/onset-follows.test.js`
Expected: `SyntaxError: The requested module '../src/data/causes.js' does not provide an export named 'leadingCause'`

- [ ] **Step 4: The shared ranking.** In `src/data/causes.js`, directly after the closing `}` of `causesFor` (the line
  after `return { byCategory, demoted, all: concordant, onset: onset || null, derived, source };`), insert:

```js

// ---- the cause the What line names (spec 2026-09-29) ----
// Most likely first, the curated order standing within a likelihood (a stable sort); a cause without a likelihood
// goes last. ONE ranking, shared by the answer card's What line and the Next steps' onset rule (nextSteps.js
// onsetFollows), so the two lines of the card can never name different causes.
const likelihoodRank = c => { const i = LIKELIHOOD.indexOf(c.likelihood); return i < 0 ? LIKELIHOOD.length : i; };
export function rankCauses(causes) {
  return [...causes].sort((a, b) => likelihoodRank(a) - likelihoodRank(b));
}
export function leadingCause(causes) {
  return rankCauses(causes)[0] || null;
}
```

- [ ] **Step 5: The What line uses it.** In `app/answer.js`:
  - replace `import { causesFor } from "../src/data/causes.js";` with
    `import { causesFor, rankCauses } from "../src/data/causes.js";`
  - delete the line `const RANK = { common: 0, uncommon: 1, rare: 2 };` (its only use is the next replacement)
  - in `whatLine`, replace

```js
  // Stable sort: within a likelihood the curated list order stands.
  const ranked = [...causes].sort((a, b) => (RANK[a.likelihood] ?? 3) - (RANK[b.likelihood] ?? 3));
```

with

```js
  // rankCauses is the ranking the Next steps' onset rule reads too, so What and Next name the same cause.
  const ranked = rankCauses(causes);
```

- [ ] **Step 6: The rule.** In `src/data/nextSteps.js`:

  (a) Header comment: replace
  `//   nextStepsFor(site, { onset }) -> { immediate, investigations, confirmatory, monitoring, urgency, referral, curated }`
  with
  `//   nextStepsFor(site, { onset }) -> { immediate, investigations, confirmatory, monitoring, urgency, referral, curated[, followed] }`

  (b) Import: replace `import { CAUSES, causesFor } from "./causes.js";` with
  `import { CAUSES, causesFor, leadingCause } from "./causes.js";`

  (c) In `resolveUrgency`, replace `  const siteUrgency = nextStepsFor(site, opts).urgency || "routine";` with
  `  const siteUrgency = sitePlan(site, opts).urgency || "routine";`. **Required, not tidying.** Without it,
  `nextStepsFor → resolveUrgency → nextStepsFor` recurses forever.

  (d) Replace

```js
// ---- public API ----
export function nextStepsFor(site, opts = {}) {
```

with

```js
// ---- public API ----
// The site's OWN plan — curated, else derived — with the hyperacute escalation. A selected cause builds on this
// (pathologyNextStepsFor, resolveUrgency), never on a followed plan, so a selection behaves exactly as it did
// before the onset rule below existed.
export function sitePlan(site, opts = {}) {
```

  (The function body is unchanged.)

  (e) Directly before the comment line `// The same plan, narrowed to ONE pathology (spec 2026-08-18).`, insert:

```js
// ---- the onset follows the cause (spec 2026-09-29, owner rulings) ----
// hyperacuteVascular()'s mirror: that rule ESCALATES a stroke-window site inside the window; nothing ever
// de-escalated, so a site's stroke plan was shown at every onset — "Hyperacute stroke pathway — assess for
// thrombolysis", EMERGENCY, beside a What line that had already named a glioma for a chronic onset.
//
// A stroke-window site's plan is written for its LEADING cause, the infarct (the first non-mimic, as
// hyperacuteVascular reads it). When the entered onset sets that cause aside, the plan no longer applies, and the
// Next steps FOLLOW the cause the What line names (leadingCause — the same ranking). The trigger is the infarct
// being set aside, NOT every vascular cause (owner): a cavernoma or a dural fistula is vascular, fits a slow
// onset, and would otherwise keep the stroke plan beside a tumour. It only CHOOSES between signed-off plans — it
// writes no clinical text — and it requires the followed cause to have an authored plan, so it can never fall back
// to the site plan while claiming to follow.
export function onsetFollows(site, onset) {
  if (!onset || !STROKE_WINDOW_COMPARTMENTS.has(compartmentOf(site))) return null;
  try {
    const lead = causesFor(site).all.find(c => c.cat !== "mimic");
    if (!lead || lead.cat !== "vascular") return null;
    const at = causesFor(site, { onset }).all;
    if (at.some(c => c.name === lead.name)) return null;
    const cause = leadingCause(at);
    if (!cause || !pathologyPlanFor(cause.name, site)) return null;
    return { cause: cause.name, setAside: lead.name, onset };
  } catch { return null; }
}

// The plan the Next card shows with nothing selected. THE TIER SPLIT holds: immediate and first-line stay the
// site's — done before the cause is known, and what identifies it. Confirmatory, monitoring, referral and urgency
// become the followed cause's, resolved exactly as a selection of it would be. Where the rule does not fire this
// is sitePlan() with no added key, so with no onset, or at acute onset, nothing changes.
export function nextStepsFor(site, opts = {}) {
  const base = sitePlan(site, opts);
  const followed = onsetFollows(site, opts.onset);
  if (!followed) return base;
  const plan = pathologyPlanFor(followed.cause, site);
  return {
    ...base,
    confirmatory: plan.confirmatory,
    monitoring: plan.monitoring,
    urgency: resolveUrgency(site, followed.cause, opts),
    referral: plan.referral || base.referral,
    followed,
  };
}

```

  (f) In `pathologyNextStepsFor`, replace

```js
  const base = nextStepsFor(site, opts);
  if (!causeName) return { ...base, pathology: null, pathologyCurated: false };
```

with

```js
  if (!causeName) return { ...nextStepsFor(site, opts), pathology: null, pathologyCurated: false };
  const base = sitePlan(site, opts);
```

- [ ] **Step 7: Run the suite — green.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/onset-follows.test.js | tail -1`
Expected: `onset follows the cause: 15 passed, 0 failed`

- [ ] **Step 8: The chronic card, in the answer test.** In `test/answer.test.js`, insert directly before the final
  ``console.log(`\nanswer card: ${pass} passed, ${fail} failed`);``:

```js
{
  // A slow onset no longer reads the stroke plan beside a tumour (spec 2026-09-29): the Next line and the badge
  // follow the cause the What line names.
  const st = stateFor({ tokens: ["weak_arm@right", "hyperreflexia@right"], onset: "chronic" });
  const out = answerFor(st);
  eq("chronic — the answer is the motor cortex", st.sel.site.id, "left_cortex_motor_facearm");
  eq("chronic — What names the tumour", out.lines.what, "Most likely Glioma / metastasis.");
  eq("chronic — Next follows it", out.lines.next, "Neuro-oncology multidisciplinary team, with neurosurgery");
  eq("chronic — the badge follows it", out.nx.urgency, "urgent");
  const hyper = answerFor(stateFor({ tokens: ["weak_arm@right", "hyperreflexia@right"], onset: "hyperacute" }));
  eq("hyperacute — still the stroke plan", hyper.lines.next, "Hyperacute stroke pathway — assess for thrombolysis / thrombectomy within the window.");
}

```

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/answer.test.js | tail -1`
Expected: `answer card: 35 passed, 0 failed`

- [ ] **Step 9: The full suite.**

Run (with `$SP` set to the session scratchpad directory): `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test > $SP/nl.log 2>&1; echo $?; grep -cE "passed, [0-9]+ failed" $SP/nl.log; grep -cE "^PASS" $SP/nl.log; grep -E "^FAIL" $SP/nl.log`
Expected: `0`, `82`, `7068`, and no FAIL lines. **No existing test may be edited to get there.** Every hyperacute
assertion in `test/accuracy-mechanisms.test.js` and `test/next-steps.test.js` must pass as written (spec §7.7).

- [ ] **Step 10: Commit.**

```bash
git add test/onset-follows.test.js test/answer.test.js package.json src/data/causes.js src/data/nextSteps.js app/answer.js
git commit -m "fix: a stroke plan stops at a slow onset — Next follows the most likely cause

onsetFollows() mirrors the hyperacute escalation: when the entered onset sets a
stroke-window site's infarct aside, confirmatory, monitoring, referral and urgency
follow the cause the What line names; immediate and first-line stay the site's.
A selection still builds on sitePlan(). The What line and the rule share one ranking
(rankCauses/leadingCause). Chronic 42, subacute 40, acute 0 site kinds.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: The Next card says why

**Files:**
- Modify: `app/app.js` (`nextBlock`)

**Interfaces:**
- Consumes: `nx.followed = { cause, setAside, onset }` from Task 1, present only with nothing selected.

- [ ] **Step 1: The flag.** In `app/app.js` `nextBlock`, directly after the line `  const ux = combined && nx.entity;`,
  insert:

```js
  // The onset rule (spec 2026-09-29): with nothing selected, a slow onset that rules out the site's infarct makes
  // the plan follow the most likely cause. Said in one line, so it never reads as a selection the clinician did
  // not make; the tiers carry the same scope tags a selection gives them.
  const fx = !combined && !px && nx.followed;
```

- [ ] **Step 2: The note.** Directly before the comment line
  `  // The honest fallback (spec 2026-08-18): an uncurated pathology shows the SITE plan and says so, rather`,
  insert:

```js
  const fxHead = fx
    ? `<p class="derived">Following the most likely cause, ${esc(fx.cause)}. A ${esc(fx.onset)} onset rules out ${esc(fx.setAside)}, which this site's usual plan is written for.</p>` : "";
```

- [ ] **Step 3: Place it, and tag the tiers.** In the returned template, replace

```js
    ${pxHead}
    ${tier("Immediate / bedside", nx.immediate, px || ux ? "site" : "")}
    ${tier("First-line investigations", nx.investigations, px || ux ? "site" : "")}
```

with

```js
    ${pxHead}${fxHead}
    ${tier("Immediate / bedside", nx.immediate, px || ux || fx ? "site" : "")}
    ${tier("First-line investigations", nx.investigations, px || ux || fx ? "site" : "")}
```

and replace

```js
    ${tier("Confirmatory / specialist", nx.confirmatory, px && nx.pathologyCurated ? nx.pathology : ux ? nx.entity : "")}
    ${tier("Monitoring / safety-netting", nx.monitoring, px && nx.pathologyCurated ? nx.pathology : ux ? nx.entity : "")}
```

with

```js
    ${tier("Confirmatory / specialist", nx.confirmatory, px && nx.pathologyCurated ? nx.pathology : ux ? nx.entity : fx ? fx.cause : "")}
    ${tier("Monitoring / safety-netting", nx.monitoring, px && nx.pathologyCurated ? nx.pathology : ux ? nx.entity : fx ? fx.cause : "")}
```

- [ ] **Step 4: Check it in the browser.** `preview_start` with `{ name: "NeuroLocaliser app" }` (port 8137, from
  `Code/.claude/launch.json`; do not edit the engine's own tracked `.claude/launch.json`). Then:
  1. Navigate to `http://localhost:8137/app/#f=weak_arm@right,hyperreflexia@right&o=chronic`. Open the Next steps card.
     Using `find` / `read_page`, confirm: the urgency band reads `URGENT` · `Neuro-oncology multidisciplinary team, with
     neurosurgery`; the note reads `Following the most likely cause, Glioma / metastasis. A chronic onset rules out MCA
     superior division infarct, which this site's usual plan is written for.`; the tier headings carry `— site`,
     `— site`, `— Glioma / metastasis`, `— Glioma / metastasis`. The answer card's Next line and the phone strip say
     urgent too.
  2. Select a cause on the What card (click its row). The note disappears and `Plan for: <cause>` shows instead.
  3. Change the onset to hyperacute: the stroke plan and EMERGENCY return, with no note.
  4. `read_console_messages` with `onlyErrors: true`: none.
  5. `resize_window` preset `mobile` and then `colorScheme: "dark"`. Screenshot each to confirm the note wraps with no
     horizontal scroll. The pane may be hidden and throttle frames, so take a second screenshot if the first is blank.
     Reset with preset `desktop`.

- [ ] **Step 5: Commit.**

```bash
git add app/app.js
git commit -m "feat: the Next card says why it follows the most likely cause

One derived line above the tiers at a slow onset that rules out the site's infarct,
so the followed plan never reads as a selection; the tiers carry the scope tags a
selection gives them. Template approved with the design (spec 2026-09-29 §5).

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Owner review — one round (STOP here)

**Files:** none in the repo. The review page is generated into the session scratchpad.

- [ ] **Step 1: Generate the before/after table.** Write this script to the scratchpad as `review-table.mjs`, then
  run it from the repo root: `PATH=… node <scratchpad>/review-table.mjs > <scratchpad>/onset-follows-review.html`.

```js
// review-table.mjs — the owner's one review round for the onset rule (spec 2026-09-29 §8): every changed case,
// before and after. Run from the repo root: node <this file> > onset-follows-review.html
const R = process.cwd();
const { SITES } = await import(R + "/src/model/sites.js");
const { sitePlan, nextStepsFor } = await import(R + "/src/data/nextSteps.js");
const { causesFor } = await import(R + "/src/data/causes.js");
const { plainSiteName } = await import(R + "/app/labels.js");
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const kind = s => `${s.level}|${s.part}`;
const KINDS = []; { const seen = new Set(); for (const s of SITES) if (!seen.has(kind(s))) { seen.add(kind(s)); KINDS.push(s); } }
const badge = u => `<span class="b ${u}">${u.toUpperCase()}</span>`;
let rows = "", n = 0;
for (const onset of ["hyperacute", "subacute", "chronic"]) {
  const block = [];
  for (const s of KINDS) {
    const after = nextStepsFor(s, { onset }); if (!after.followed) continue;
    const before = sitePlan(s, { onset }), f = after.followed;
    const cat = (causesFor(s, { onset }).all.find(c => c.name === f.cause) || {}).cat || "";
    const flags = [cat === "mimic" ? "follows a mimic" : "", cat === "vascular" ? "follows a vascular cause" : "",
      after.urgency === "emergency" ? "still emergency" : "", kind(s) === "cortex|temporoparietal" && onset === "subacute" ? "SEE SPEC §4" : ""].filter(Boolean);
    block.push(`<tr><td>${esc(plainSiteName(s, { dominantSide: "left" }).place)}</td><td>${esc(f.cause)}<div class="sub">sets aside ${esc(f.setAside)}</div></td>
      <td>${badge(before.urgency)} ${esc(before.referral)}</td><td>${badge(after.urgency)} ${esc(after.referral)}</td><td class="fl">${flags.map(esc).join("<br>")}</td></tr>`);
  }
  n += block.length;
  rows += `<tr class="grp"><th colspan="5">Onset: ${onset} — ${block.length} site kind${block.length === 1 ? "" : "s"}</th></tr>${block.join("")}`;
}
console.log(`<!doctype html><html><head><meta charset="utf-8"><title>Onset rule review</title><style>
:root{--bg:#fff;--fg:#1d2330;--mut:#5b6474;--line:#dfe3ea;--em:#b3261e;--ur:#8a6100;--ro:#5b6474}
@media (prefers-color-scheme:dark){:root{--bg:#131a26;--fg:#e6e9ef;--mut:#9aa3b2;--line:#2a3344;--em:#ff8a80;--ur:#f3c969;--ro:#9aa3b2}}
body{background:var(--bg);color:var(--fg);font:14px/1.45 system-ui,sans-serif;margin:0;padding:16px}
h1{font-size:18px;margin:0 0 4px}p{color:var(--mut);margin:0 0 12px;max-width:70ch}
.wrap{overflow-x:auto}table{border-collapse:collapse;width:100%;min-width:760px}
td,th{border-bottom:1px solid var(--line);padding:6px 8px;text-align:left;vertical-align:top}
tr.grp th{background:var(--line);font-size:13px}.sub{color:var(--mut);font-size:12px}.fl{color:var(--mut);font-size:12px}
.b{font-size:11px;font-weight:700;letter-spacing:.03em}.b.emergency{color:var(--em)}.b.urgent{color:var(--ur)}.b.routine{color:var(--ro)}
</style></head><body><h1>Onset rule — every changed case (${n})</h1>
<p>With nothing selected, a slow onset that rules out the site's infarct now makes the Next line and badge follow the cause the What line names. Immediate and first-line steps are unchanged. One site per kind is shown (left where there is a side).</p>
<div class="wrap"><table><thead><tr><th>Site</th><th>Most likely at this onset</th><th>Before</th><th>After</th><th>Flags</th></tr></thead><tbody>${rows}</tbody></table></div></body></html>`);
```

Expected: the page heading says `(83)`, and the groups read `hyperacute — 1 site kind`, `subacute — 40 site kinds`,
`chronic — 42 site kinds`.

- [ ] **Step 2: Send it to the owner.** `SendUserFile` with `display: "render"`. In the message, list the flagged
  cases so they are easy to find:
  - **temporoparietal cortex at subacute onset → Delirium.** The site's own referral says "do not dismiss as
    delirium", and the stroke plan is not reachable at that onset (spec §4). This is the case most likely to need a
    ruling.
  - **optic nerve (AION) at hyperacute onset → perioperative ischaemic optic neuropathy**, EMERGENCY either way.
  - **the rows marked "follows a mimic"**: five at chronic onset, three at subacute.
  - **the rows marked "still emergency"**.

- [ ] **Step 3: STOP for the owner's rulings.** If the owner approves, go to Task 4. If they rule on a case (for
  example, keeping the stroke plan where the What line names a mimic), take the ruling back to the spec: record it
  in §2, change the rule and its tests, and regenerate the table. Do not patch individual sites.

---

### Task 4: Release docs and version

**Files:**
- Modify: `package.json` (`"version"`), `app/brand.js` (`VERSION`), `README.md` (status line), `CLAUDE.md` (status
  line, known-issue note, new section), the spec's status line, and this plan's status line.

- [ ] **Step 1: Version 0.10.1.** `package.json`: `"version": "0.10.0"` → `"version": "0.10.1"`. `app/brand.js`:
  `export const VERSION = "0.10.0";` → `export const VERSION = "0.10.1";`. `README.md`: `**Beta (v0.10.0), deployed`
  → `**Beta (v0.10.1), deployed`. (`test/brand.test.js` asserts that package.json and brand.js agree.)

- [ ] **Step 2: CLAUDE.md.**
  - Status line: `**81 test suites / 7048 assertions green**` → `**82 test suites / 7068 assertions green**`.
  - In the ED first-glance section, replace the paragraph that starts `**Known and deliberately left:** at chronic
    onset the What line can name a tumour` with:
    `**Closed 2026-09-29 (v0.10.1):** the chronic-onset tumour-plus-stroke-plan pairing was a clinical-safety defect,
    not an oddity — see "Onset follows the cause" below.`
  - Insert a new section directly before `## Commands`:

```markdown
## Onset follows the cause (DONE 2026-09-29, v0.10.1) — ✅ owner-approved rule

**The defect.** At a chronic onset the What line named a glioma while the Next line read "Hyperacute stroke pathway
— assess for thrombolysis / thrombectomy within the window", EMERGENCY. The causes layer already set the infarct
aside; the Next steps layer never asked — its only onset rule was the hyperacute ESCALATION, and nothing
de-escalated. 42 stroke-site kinds at chronic onset, 40 at subacute.

**The rule** (`onsetFollows()` in `src/data/nextSteps.js`, the mirror of `hyperacuteVascular()`): a stroke-window
site whose leading cause is vascular, at an onset that sets THAT cause aside, FOLLOWS the cause the What line
names. Confirmatory, monitoring, referral and urgency become that cause's authored plan (urgency resolved as a
selection would be, the must-not-miss floor included); immediate and first-line stay the site's — THE TIER
SPLIT is unchanged. It only chooses between signed-off plans and writes no clinical text. **Owner rulings:**
follow the most likely cause (not a warning, not 43 authored slow-onset referrals); trigger on the INFARCT being
set aside, not every vascular cause (a cavernoma or a dural fistula is vascular and fits a slow onset, and kept
the stroke plan beside a tumour).

**Mechanics worth knowing:** `nextStepsFor` = `sitePlan` (the old body) + the follow, with NO added key where the
rule does not fire — so no onset / acute onset is byte-identical. A SELECTION builds on `sitePlan`, never on the
followed plan, and `resolveUrgency` must read `sitePlan` (reading `nextStepsFor` recurses forever). The What line
and the rule share `rankCauses`/`leadingCause` (`causes.js`). The Next card says why in one derived line
("Following the most likely cause, X. A chronic onset rules out Y, which this site's usual plan is written for.").
The Together card follows automatically (it unions per-site `nextStepsFor`).

**Known and left:** the retina — its leading cause is GCA, so the rule does not apply and "acute stroke pathway"
stands at every onset; the rule for NON-stroke sites (up to 99 site kinds) is its own decision; at subacute onset
the optic nerve (AION) has NO cause fitting the onset, so nothing is followed.

Spec/plan: `docs/superpowers/specs/2026-09-29-onset-follows-cause-design.md`, `docs/superpowers/plans/2026-09-29-onset-follows-cause.md`.
```

  If the owner's Task 3 rulings changed anything, record them in this section too.

- [ ] **Step 3: Status lines.** The spec's `**Status: APPROVED (2026-09-29).**` becomes
  `**Status: IMPLEMENTED (<date>).**`, and this plan's `**Status: PLANNED (2026-09-29).**` becomes
  `**Status: IMPLEMENTED (<date>).**`.

- [ ] **Step 4: Full suite.** Same command as Task 1 Step 9. Expected: exit 0, 82 suites, 7068 assertions, no FAIL.

- [ ] **Step 5: Commit.**

```bash
git add package.json app/brand.js README.md CLAUDE.md docs/superpowers/specs/2026-09-29-onset-follows-cause-design.md docs/superpowers/plans/2026-09-29-onset-follows-cause.md
git commit -m "docs: onset follows the cause recorded; v0.10.1

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 6: Finish the branch** with superpowers:finishing-a-development-branch. The owner picks from its options.
  If they choose a PR: push the branch, open the PR, and bind it with the ccd_pr tools. Do not merge it; the owner
  merges, and merging deploys to testers.

---

## Execution log

**2026-09-29, inline (owner's choice).**

- **Task 1** — as written. Committed as `3829bf4`: 15/15 in the new suite, answer card 35/35, full suite 82 suites /
  7068 green, no existing test edited. The three source files were byte-identical to the prototype.
- **Task 2** — as written. Committed as `643796a`. One placement difference from the prototype: `fxHead` sits
  before the "honest fallback" comment, as the plan says, not after it. Browser-checked: the chronic card (URGENT,
  neuro-oncology, the note, scope tags); a selection replaces the note with "Plan for:"; hyperacute onset keeps
  the stroke plan with no note; no console errors; 375px light and dark with no horizontal scroll. Changing only
  the hash does not re-render; reload after changing it.
- **Task 3** — the review round changed the RULE. Spec §2 records rulings 4–6:
  - **4. A mimic is never the default card.** Where a mimic leads, the site's own plan stands. `onsetFollows` adds
    `cause.cat === "mimic"` to its null conditions; this came from the temporoparietal "potentially missed stroke"
    ruling.
  - **5. Central post-stroke pain is a sequel.** The two entries are tagged `after: "stroke"`; `leadingCause`
    skips sequels; `whatLine` skips them for the lead and the must-not-miss and adds
    `After a previous {after} here: {name}.`
  - **6. The AION follow at hyperacute onset** is kept.

  Tests added: suite sections 9 and 10, three `whatLine` cases, and the canary exempting mimic leads. The ratchet
  moved from 40/42 to **37/37**. Full suite: **82 suites / 7080 green**. Task 4 uses 7080, not 7068. With no onset the
  thalamus (VPL) and VPM What lines also gain the sequel clause, because post-stroke pain fits then as well.
- **After Task 4, ruling 4 was revised** (owner: *"it can be mimics if the chronicity is specified as chronic"*).
  The null condition became `cause.cat === "mimic" && onset !== "chronic"`, so at chronic onset five site kinds
  follow a mimic again. The ratchet is now **37/42**, section 9 pins both halves, and the canary exempts mimic leads
  only below chronic. Full suite: **82 suites / 7082 green**.

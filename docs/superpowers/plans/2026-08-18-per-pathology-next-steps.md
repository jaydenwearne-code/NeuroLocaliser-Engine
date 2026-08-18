# Per-Pathology Next Steps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the user select a cause in the What card and have the Next steps card re-render its confirmatory, monitoring, urgency and referral for that specific pathology.

**Architecture:** A new pure-data module `src/data/pathologyNextSteps.js` holds one plan per pathology name, built by a `dz()` spine with per-site interpolation — the fifth use of the `sbSpine`/`nvSpine`/`rtSpine`/`rootNS` idiom already in this codebase. `nextSteps.js` gains one new exported function, `pathologyNextStepsFor(site, causeName)`, which keeps the site-level immediate/first-line tiers and swaps the lower tiers. The app gains one piece of state (`S.selectedPathology`) and renders the same `nextBlock` with a different object.

**Tech Stack:** Zero-dependency ES modules, no build step. Node v24.18.0. Tests are plain node scripts with a local `ok()` helper and a nonzero exit on failure.

## Global Constraints

- **Node is not on PATH.** Every command in this plan must be prefixed: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"`.
- **Zero dependencies.** No npm installs, no build step, no test framework. Tests are `node test/<name>.test.js`.
- **Teaching prompts, not clinical directives.** No drug doses, no definitive management. Every string added must survive that rule.
- **Never manufacture generic content.** Where nothing authored exists, fall back to the site plan under an explicit label. The generic sieve filler was deleted engine-wide on 2026-08-11; do not reintroduce it in another shape.
- **A mechanical invariant is a FLOOR, not a ceiling.** The `red`-derived urgency floor may raise urgency, never cap it.
- **`--terra` means identity or THE answer, nothing else.** The selected-pathology marker qualifies (it is the answer the card is now about). Do not add other `--terra` declarations.
- **A LEVEL is not its contents; a PORTION is not the WHOLE.** Applies to any label copy added.
- Working branch is `feat/per-pathology-next-steps`, already created, spec committed at `a89103c`.

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `src/data/pathologyNextSteps.js` | The `dz()` spine builder, `PATHOLOGY_NEXT`, `PATHOLOGY_ALIAS`, and `pathologyPlanFor(name, site)` which resolves a plan with interpolation. Knows nothing about sites' own workups. | Create |
| `src/data/nextSteps.js` | Gains `pathologyNextStepsFor(site, causeName)` — merges the site plan with the pathology plan and resolves urgency. Existing exports untouched. | Modify |
| `app/app.js` | `S.selectedPathology`, clickable cause rows in `whatBlock`, chip + "Plan for:" line in `nextCard`. | Modify |
| `app/case-url.js` | `px` key round-trip. | Modify |
| `app/index.html` | CSS for `.cause.sel`, `.px-chip`, `.px-line`, `.ns-h .ns-scope`. | Modify |
| `test/pathology-next-steps.test.js` | All invariants for the new layer. | Create |
| `test/case-url.test.js` | `px` round-trip cases. | Modify |
| `package.json` | Add the new test file to the `test` script. | Modify |

Content lives in `pathologyNextSteps.js` and nowhere else, so a clinical reviewer reads one file without touching UI code — the same split `examples.js` and `exam-map.js` already use.

---

### Task 1: The `dz()` spine builder and plan resolution

**Files:**
- Create: `src/data/pathologyNextSteps.js`
- Create: `test/pathology-next-steps.test.js`
- Modify: `package.json` (add the test to the `test` script)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `PATHOLOGY_NEXT` (object, keys are pathology name strings), `PATHOLOGY_ALIAS` (object, string → string), and `pathologyPlanFor(name, site)` returning `{ confirmatory: string[], monitoring: string[], urgency: string|null, referral: string|null } | null`. Returns `null` when the name has no plan. `site` is a site object with `.id`, `.level`, `.part`.

- [ ] **Step 1: Write the failing test**

Create `test/pathology-next-steps.test.js`:

```js
// pathology-next-steps.test.js — the PER-PATHOLOGY workup layer (spec 2026-08-18).
//
// The Next steps card was keyed by SITE, so it unioned every pathology that could produce a lesion there.
// This layer keys the confirmatory / monitoring / urgency / referral tiers by the pathology the user
// selected, while immediate + first-line stay site-level (they are what GET you the cause).
import { PATHOLOGY_NEXT, PATHOLOGY_ALIAS, pathologyPlanFor } from "../src/data/pathologyNextSteps.js";

let pass = 0, fail = 0;
const ok = (l, c, d = "") => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l + (!c && d ? `  [${d}]` : "")); };

const site = id => ({ id, level: id.split("_")[0], part: id.split("_").slice(1).join("_") });

// --- 1: the spine resolves, with and without a bySite entry ---
{
  const p = pathologyPlanFor("Spinal epidural abscess", site("cord_transverse"));
  ok("a known pathology returns a plan", !!p);
  ok("the plan carries confirmatory steps", Array.isArray(p.confirmatory) && p.confirmatory.length > 0);
  ok("the plan carries monitoring steps", Array.isArray(p.monitoring) && p.monitoring.length > 0);
  ok("the plan carries an urgency", typeof p.urgency === "string");
  ok("an unknown pathology returns null", pathologyPlanFor("Not A Real Disease", site("cord_transverse")) === null);
}

// --- 2: interpolation — no unreplaced slots ever reach the UI ---
{
  for (const name of Object.keys(PATHOLOGY_NEXT)) {
    const p = pathologyPlanFor(name, site("cord_transverse"));
    const leaked = [...p.confirmatory, ...p.monitoring].filter(s => /\{[a-z]+\}/.test(s));
    ok(`\`${name}\` leaves no unreplaced {slot}`, leaked.length === 0, leaked.join(" | "));
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/pathology-next-steps.test.js
```
Expected: FAIL — `ERR_MODULE_NOT_FOUND: Cannot find module '.../src/data/pathologyNextSteps.js'`.

- [ ] **Step 3: Write minimal implementation**

Create `src/data/pathologyNextSteps.js`:

```js
// pathologyNextSteps.js — the PER-PATHOLOGY workup layer (spec 2026-08-18).
//
//   pathologyPlanFor(name, site) -> { confirmatory, monitoring, urgency, referral } | null
//
// Keyed by pathology NAME with per-site interpolation — the sbSpine / nvSpine / rtSpine / rootNS idiom,
// applied to diseases instead of corridors. One `dz()` spine carries what is true of the disease
// everywhere; `bySite` fills the slots that differ, so no two sites emit the same text for a shared name.
//
// DELIBERATELY NOT keyed by canonicalKey(): that collapses 93 names onto 10 very coarse entities
// ("Metastases" swallows 40 names from orbital tumour to vertebral metastasis), which is precisely the
// blandness this layer exists to remove. Exact synonyms are handled narrowly by PATHOLOGY_ALIAS instead.
//
// This file is the CLINICAL CONTENT. It imports nothing from the UI and nothing from nextSteps.js, so a
// reviewer reads only this file. Teaching prompts, not directives — no doses, no definitive management.

// Slot defaults used when a site has no `bySite` entry. Neutral, never invented specifics.
const DEFAULTS = { level: "the affected region", flavour: "the appearance expected for this lesion" };

const fill = (str, slots) => str.replace(/\{([a-z]+)\}/g, (_, k) => slots[k] ?? DEFAULTS[k] ?? "");

const dz = (name, { confirmatory = [], monitoring = [], urgency = null, referral = null, bySite = {} }) =>
  ({ name, confirmatory, monitoring, urgency, referral, bySite });

// Exact synonyms only — two spellings of ONE disease that must share one plan. NOT a place to merge
// related-but-different entities; the no-two-identical-plans invariant is what keeps that honest.
export const PATHOLOGY_ALIAS = {};

export const PATHOLOGY_NEXT = {
  "Spinal epidural abscess": dz("Spinal epidural abscess", {
    confirmatory: [
      "Blood cultures (at least two sets) BEFORE antibiotics wherever the delay is acceptable — the organism guides everything that follows",
      "MRI {level} WITH gadolinium — skip lesions at a non-contiguous level are common, which is why the imaged field matters here",
      "CRP and ESR serially — they track response better than the white cell count",
    ],
    monitoring: [
      "Hourly neurological observations while the deficit is evolving — {flavour}",
      "SAFETY NET: new or worsening weakness, or bladder or bowel dysfunction, is a surgical emergency, not a reason to wait for the next scan",
    ],
    urgency: "emergency",
    referral: "Emergency neurosurgery / spinal surgery, with infectious diseases alongside",
    bySite: {
      cord_transverse: { level: "the WHOLE spine",
        flavour: "a rising sensory level is the sign that the collection is expanding" },
      root_l5: { level: "the whole spine, not the symptomatic level alone",
        flavour: "watch for the radicular deficit becoming a cord or cauda syndrome" },
    },
  }),
};

export function pathologyPlanFor(name, site) {
  const key = PATHOLOGY_ALIAS[name] || name;
  const p = PATHOLOGY_NEXT[key];
  if (!p) return null;
  const slots = { ...DEFAULTS, ...(p.bySite[site?.id] || p.bySite[`${site?.level}_${site?.part}`] || {}) };
  return {
    confirmatory: p.confirmatory.map(s => fill(s, slots)),
    monitoring: p.monitoring.map(s => fill(s, slots)),
    urgency: p.urgency,
    referral: p.referral,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/pathology-next-steps.test.js
```
Expected: PASS — `7 passed, 0 failed`.

- [ ] **Step 5: Wire the test into the suite**

In `package.json`, append to the end of the `test` script value (it is one long `&&` chain — add to the end, before the closing quote):

```
 && node test/pathology-next-steps.test.js
```

Run the whole suite to confirm nothing regressed:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test 2>&1 | tail -5
```
Expected: the final line of each suite reports `0 failed`, and the command exits 0.

- [ ] **Step 6: Commit**

```bash
git add src/data/pathologyNextSteps.js test/pathology-next-steps.test.js package.json
git commit -m "feat(engine): dz() spine builder for per-pathology workups"
```

---

### Task 2: Every plan key must name a real cause

A plan keyed to a misspelled pathology never fires and never errors. This invariant is the only thing that catches it.

**Files:**
- Modify: `test/pathology-next-steps.test.js`
- Modify: `src/data/pathologyNextSteps.js` (only if the test finds a bad key)

**Interfaces:**
- Consumes: `PATHOLOGY_NEXT`, `PATHOLOGY_ALIAS` from Task 1.
- Produces: no new exports.

- [ ] **Step 1: Write the failing test**

Add to `test/pathology-next-steps.test.js`, above the final `console.log`. Add this import at the top of the file, beneath the existing import:

```js
import { CAUSES } from "../src/data/causes.js";
```

Then the block:

```js
// --- 3: no orphan plans — every key names a cause that actually exists ---
{
  const realNames = new Set(Object.keys(CAUSES).flatMap(k => CAUSES[k].map(c => c.name)));
  for (const name of Object.keys(PATHOLOGY_NEXT))
    ok(`plan key \`${name}\` matches a real cause in CAUSES`, realNames.has(name));
  for (const [from, to] of Object.entries(PATHOLOGY_ALIAS)) {
    ok(`alias source \`${from}\` matches a real cause`, realNames.has(from));
    ok(`alias target \`${to}\` has a plan`, !!PATHOLOGY_NEXT[to]);
  }
}
```

- [ ] **Step 2: Run test to verify it passes or fails honestly**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/pathology-next-steps.test.js
```
Expected: PASS for `Spinal epidural abscess` (it is a real cause name at 21 sites). If it FAILS, the name in Task 1 is misspelled — fix the key in `PATHOLOGY_NEXT`, not the test.

- [ ] **Step 3: Commit**

```bash
git add test/pathology-next-steps.test.js
git commit -m "test(engine): assert no orphan pathology plans"
```

---

### Task 3: Urgency resolution with the red floor

**Files:**
- Modify: `src/data/nextSteps.js`
- Modify: `test/pathology-next-steps.test.js`

**Interfaces:**
- Consumes: `pathologyPlanFor(name, site)` from Task 1.
- Produces: `resolveUrgency(site, causeName)` exported from `src/data/nextSteps.js`, returning one of `"emergency" | "urgent" | "routine"`.

- [ ] **Step 1: Write the failing test**

Add to `test/pathology-next-steps.test.js`. Add these imports at the top:

```js
import { resolveUrgency, nextStepsFor } from "../src/data/nextSteps.js";
import { candidateSites } from "../src/engine/inverse.js";
```

Then the block:

```js
// --- 4: urgency — curated value wins, red is a FLOOR beneath it, site is the fallback ---
{
  const sites = candidateSites();
  const causesAt = s => CAUSES[s.id] || CAUSES[`${s.level}_${s.part}`] || [];

  // the red floor: no red must-not-miss may render as routine, curated or not.
  // 377 sites carry a red cause and 76 of them badge routine today — this is the invariant that fixes them.
  let violations = [];
  for (const s of sites) for (const c of causesAt(s))
    if (c.red && resolveUrgency(s, c.name) === "routine") violations.push(`${s.id} / ${c.name}`);
  ok("no red cause resolves to routine anywhere", violations.length === 0, violations.slice(0, 3).join(" ; "));

  // the sharpest real case: BPPV badges routine, but posterior circulation stroke is its must-not-miss.
  const bppv = sites.find(s => s.id === "left_peripheral_vestibular_posterior_canal");
  ok("BPPV site itself still badges routine", nextStepsFor(bppv).urgency === "routine");
  const stroke = causesAt(bppv).find(c => /posterior circulation stroke/i.test(c.name));
  ok("its posterior-circulation-stroke cause exists", !!stroke);
  ok("selecting that cause escalates off routine", resolveUrgency(bppv, stroke.name) !== "routine");

  // no selection = unchanged
  ok("null pathology returns the site's own urgency", resolveUrgency(bppv, null) === nextStepsFor(bppv).urgency);

  // Authored descent is permitted (owner ruling 2026-08-18): a curated NON-red pathology may resolve
  // BELOW the site's urgency. Tested with a stub plan rather than by waiting for content to exist, so the
  // rule is pinned from day one and cannot be silently reversed by a later refactor.
  {
    const host = sites.find(s => {
      const cz = CAUSES[s.id] || CAUSES[`${s.level}_${s.part}`] || [];
      return nextStepsFor(s).urgency === "emergency" && cz.some(c => !c.red);
    });
    ok("an emergency-badged site with a non-red cause exists", !!host);
    if (host) {
      const benign = (CAUSES[host.id] || CAUSES[`${host.level}_${host.part}`]).find(c => !c.red);
      PATHOLOGY_NEXT[benign.name] = { name: benign.name, confirmatory: ["stub"], monitoring: ["stub"],
                                      urgency: "routine", referral: "stub", bySite: {} };
      ok("an authored routine urgency descends below an emergency site badge",
         resolveUrgency(host, benign.name) === "routine");
      delete PATHOLOGY_NEXT[benign.name];
    }

    // ...but a RED cause may never be descended below the floor, even by an authored plan.
    const redHost = sites.find(s => (CAUSES[s.id] || CAUSES[`${s.level}_${s.part}`] || []).some(c => c.red));
    const redCause = (CAUSES[redHost.id] || CAUSES[`${redHost.level}_${redHost.part}`]).find(c => c.red);
    PATHOLOGY_NEXT[redCause.name] = { name: redCause.name, confirmatory: ["stub"], monitoring: ["stub"],
                                      urgency: "routine", referral: "stub", bySite: {} };
    ok("the red floor overrides an authored routine urgency",
       resolveUrgency(redHost, redCause.name) !== "routine");
    delete PATHOLOGY_NEXT[redCause.name];
  }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/pathology-next-steps.test.js
```
Expected: FAIL — `resolveUrgency is not a function` (it is not exported yet).

- [ ] **Step 3: Write minimal implementation**

In `src/data/nextSteps.js`, add this import at the top beside the existing `CAUSES` import:

```js
import { pathologyPlanFor } from "./pathologyNextSteps.js";
```

Then add, immediately above the `// ---- public API ----` comment:

```js
// ---- urgency resolution when a pathology is selected (spec 2026-08-18) ----
// Three inputs, in order: the curated pathology urgency, else the site's, and beneath BOTH a floor derived
// from `red: true`. The floor may RAISE urgency and never caps it — a curated plan may legitimately sit
// below the site's badge (a chronic degenerative cause at an emergency-badged site), but nothing flagged
// as a must-not-miss may ever render as routine.
const URGENCY_RANK = { emergency: 3, urgent: 2, routine: 1 };
const RED_FLOOR = "urgent";

function causeEntry(site, causeName) {
  const key = CAUSES[site.id] ? site.id : `${site.level}_${site.part}`;
  return (CAUSES[key] || []).find(c => c.name === causeName) || null;
}

export function resolveUrgency(site, causeName) {
  const siteUrgency = nextStepsFor(site).urgency || "routine";
  if (!causeName) return siteUrgency;
  const plan = pathologyPlanFor(causeName, site);
  const chosen = (plan && plan.urgency) || siteUrgency;
  const entry = causeEntry(site, causeName);
  if (!entry || !entry.red) return chosen;
  return URGENCY_RANK[chosen] >= URGENCY_RANK[RED_FLOOR] ? chosen : RED_FLOOR;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/pathology-next-steps.test.js
```
Expected: PASS on all urgency assertions, including `no red cause resolves to routine anywhere`.

- [ ] **Step 5: Run the full suite**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test 2>&1 | grep -c "^FAIL" || echo "no failures"
```
Expected: `no failures`.

- [ ] **Step 6: Commit**

```bash
git add src/data/nextSteps.js test/pathology-next-steps.test.js
git commit -m "feat(engine): resolve urgency per pathology with a red floor"
```

---

### Task 4: The public API — `pathologyNextStepsFor`

**Files:**
- Modify: `src/data/nextSteps.js`
- Modify: `test/pathology-next-steps.test.js`

**Interfaces:**
- Consumes: `pathologyPlanFor` (Task 1), `resolveUrgency` (Task 3).
- Produces: `pathologyNextStepsFor(site, causeName)` exported from `src/data/nextSteps.js`, returning `{ immediate, investigations, confirmatory, monitoring, urgency, referral, curated, pathology, pathologyCurated }`.

- [ ] **Step 1: Write the failing test**

Add to `test/pathology-next-steps.test.js`. Extend the `nextSteps.js` import to include the new function:

```js
import { resolveUrgency, nextStepsFor, pathologyNextStepsFor } from "../src/data/nextSteps.js";
```

Then the block:

```js
// --- 5: the public API — tier split, fallback flag, and no regression when nothing is selected ---
{
  const sites = candidateSites();
  const cord = sites.find(s => (CAUSES[s.id] || CAUSES[`${s.level}_${s.part}`] || [])
    .some(c => c.name === "Spinal epidural abscess"));
  ok("a site carrying the exemplar pathology exists", !!cord);

  // nothing selected => byte-identical to today's card
  const plain = pathologyNextStepsFor(cord, null), today = nextStepsFor(cord);
  for (const k of ["immediate", "investigations", "confirmatory", "monitoring", "urgency", "referral"])
    ok(`null pathology leaves \`${k}\` identical to nextStepsFor`,
       JSON.stringify(plain[k]) === JSON.stringify(today[k]));
  ok("null pathology reports no pathology", plain.pathology === null);

  // selected + curated => lower tiers swap, upper tiers do not
  const sel = pathologyNextStepsFor(cord, "Spinal epidural abscess");
  ok("immediate stays site-level", JSON.stringify(sel.immediate) === JSON.stringify(today.immediate));
  ok("first-line stays site-level", JSON.stringify(sel.investigations) === JSON.stringify(today.investigations));
  ok("confirmatory swaps to the pathology", JSON.stringify(sel.confirmatory) !== JSON.stringify(today.confirmatory));
  ok("monitoring swaps to the pathology", JSON.stringify(sel.monitoring) !== JSON.stringify(today.monitoring));
  ok("pathologyCurated is true for an authored plan", sel.pathologyCurated === true);
  ok("the pathology name is carried", sel.pathology === "Spinal epidural abscess");

  // selected + uncurated => site tiers, flagged so the UI can label them
  const uncurated = (CAUSES[cord.id] || CAUSES[`${cord.level}_${cord.part}`] || [])
    .map(c => c.name).find(n => !PATHOLOGY_NEXT[n] && !PATHOLOGY_ALIAS[n]);
  ok("an uncurated cause exists at that site to test the fallback", !!uncurated);
  const fb = pathologyNextStepsFor(cord, uncurated);
  ok("uncurated falls back to the site confirmatory",
     JSON.stringify(fb.confirmatory) === JSON.stringify(today.confirmatory));
  ok("uncurated is flagged so the UI can label it", fb.pathologyCurated === false);
  ok("uncurated still carries the name for the label", fb.pathology === uncurated);
}
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/pathology-next-steps.test.js
```
Expected: FAIL — `pathologyNextStepsFor is not a function`.

- [ ] **Step 3: Write minimal implementation**

In `src/data/nextSteps.js`, add immediately after the existing `nextStepsFor` function:

```js
// The same plan, narrowed to ONE pathology (spec 2026-08-18). Immediate and first-line stay site-level —
// they are performed before the cause is known, and are what identify it. Confirmatory, monitoring,
// urgency and referral become pathology-level where a plan is authored.
//
// `causeName: null` returns exactly what nextStepsFor() returns, so the card has ONE code path and the
// no-selection view cannot drift from the pre-2026-08-18 behaviour.
export function pathologyNextStepsFor(site, causeName) {
  const base = nextStepsFor(site);
  if (!causeName) return { ...base, pathology: null, pathologyCurated: false };
  const plan = pathologyPlanFor(causeName, site);
  return {
    ...base,
    confirmatory: plan ? plan.confirmatory : base.confirmatory,
    monitoring:   plan ? plan.monitoring   : base.monitoring,
    urgency:      resolveUrgency(site, causeName),
    referral:     (plan && plan.referral) || base.referral,
    pathology: causeName,
    pathologyCurated: !!plan,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/pathology-next-steps.test.js
```
Expected: PASS on all API assertions.

- [ ] **Step 5: Commit**

```bash
git add src/data/nextSteps.js test/pathology-next-steps.test.js
git commit -m "feat(engine): pathologyNextStepsFor() narrows the plan to one disease"
```

---

### Task 5: The no-two-identical-plans invariant

This is what forces `bySite` to earn its place — without it, a spine with no per-site slots reads identically at 31 sites and the layer teaches nothing more than the site card did.

**Files:**
- Modify: `test/pathology-next-steps.test.js`

**Interfaces:**
- Consumes: `pathologyPlanFor` (Task 1), `PATHOLOGY_NEXT` (Task 1).
- Produces: no new exports.

- [ ] **Step 1: Write the test**

Add to `test/pathology-next-steps.test.js`:

```js
// --- 6: a shared pathology must not read identically at every site it appears at ---
// The sbSpine no-two-identical-lists rule, applied to diseases. A pathology present at ONE site is exempt
// (there is nothing to differentiate it from); one present at several must differentiate at least once.
{
  const sites = candidateSites();
  const sitesWith = name => sites.filter(s =>
    (CAUSES[s.id] || CAUSES[`${s.level}_${s.part}`] || []).some(c => c.name === name));

  for (const name of Object.keys(PATHOLOGY_NEXT)) {
    const hosts = sitesWith(name);
    if (hosts.length < 2) continue;
    const rendered = new Set(hosts.map(s => JSON.stringify(pathologyPlanFor(name, s))));
    ok(`\`${name}\` differentiates across its ${hosts.length} sites`, rendered.size > 1,
       `identical text at all ${hosts.length} sites — add bySite entries`);
  }
}
```

- [ ] **Step 2: Run test to verify it passes**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/pathology-next-steps.test.js
```
Expected: PASS — `Spinal epidural abscess` has two `bySite` entries from Task 1, so it renders at least two distinct texts across its 21 sites.

- [ ] **Step 3: Commit**

```bash
git add test/pathology-next-steps.test.js
git commit -m "test(engine): a shared pathology must differentiate across its sites"
```

---

### Task 6: Content tranche 1 — infective (6 pathologies)

**This task is clinical authoring, not mechanical work.** Draft each plan, then hold it for owner review before merge. Source material: the cause's own `feature` and `pathognomonic` strings in `causes.js`, and the pathology-specific prose already sitting in each host site's curated `investigations` in `nextSteps.js` — much of this is redistribution rather than new writing.

**Files:**
- Modify: `src/data/pathologyNextSteps.js`

**Interfaces:**
- Consumes: `dz()` (Task 1).
- Produces: six new `PATHOLOGY_NEXT` keys. No signature changes.

Pathologies, with their site counts and red status:

| Pathology (exact `CAUSES` name) | Sites | Red |
|---|---|---|
| `Basal meningitis (tuberculous, carcinomatous or fungal)` | 22 | yes |
| `Herpes zoster` | 10 | no |
| `Lyme radiculitis (Bannwarth syndrome)` | 10 | no |
| `Cerebral abscess` | 8 | yes |
| `Herpes simplex encephalitis` | 8 | yes |
| `Skull-base osteomyelitis (malignant otitis externa)` | 7 | yes |

- [ ] **Step 1: Find each pathology's host sites**

For each name, list where it appears so you know which `bySite` entries are worth writing:

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node -e '
const R=process.cwd();
import(R+"/src/data/causes.js").then(({CAUSES})=>{
  const n=process.argv[1];
  console.log(Object.keys(CAUSES).filter(k=>CAUSES[k].some(c=>c.name===n)).join("\n"));
});' "Herpes simplex encephalitis"
```

- [ ] **Step 2: Write each plan**

Add each to `PATHOLOGY_NEXT` in `src/data/pathologyNextSteps.js`, following the exemplar's shape exactly. Every plan must supply: `confirmatory` (≥2 entries), `monitoring` (≥1, including a safety-net line where the disease deteriorates), `urgency`, `referral`, and `bySite` entries for **at least two** host sites — the Task 5 invariant fails otherwise.

Worked exemplar for one of the six, to set the standard:

```js
  "Herpes simplex encephalitis": dz("Herpes simplex encephalitis", {
    confirmatory: [
      "CSF HSV PCR — it can be NEGATIVE in the first 48 hours, so a negative early result does not exclude it and does not stop treatment",
      "MRI {level} — {flavour}",
      "EEG for lateralised periodic discharges over the affected region",
    ],
    monitoring: [
      "SAFETY NET: treatment is started on suspicion and continued while the PCR is awaited — waiting for confirmation is the error this diagnosis is known for",
      "Watch conscious level and for seizures; {flavour} predicts where the deficit will show",
    ],
    urgency: "emergency",
    referral: "Acute neurology, with infectious diseases",
    bySite: {
      cortex_temporal: { level: "brain, with diffusion and FLAIR",
        flavour: "asymmetric medial temporal and insular signal change, often with haemorrhage" },
      cortex_orbitofrontal: { level: "brain, with diffusion and FLAIR",
        flavour: "inferior frontal involvement continuous with the temporal change" },
    },
  }),
```

- [ ] **Step 3: Run the suite after each plan**

Run after every plan, not once at the end — the differentiation invariant tells you immediately if a spine has no per-site content:

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/pathology-next-steps.test.js
```
Expected: PASS, with a new `differentiates across its N sites` line per plan added.

- [ ] **Step 4: Commit**

```bash
git add src/data/pathologyNextSteps.js
git commit -m "content(pathology): infective tranche — 6 plans"
```

---

### Task 7: Content tranche 2 — neoplastic (7 pathologies)

Same method, same standards, same per-plan test run as Task 6.

**Files:**
- Modify: `src/data/pathologyNextSteps.js`

**Interfaces:**
- Consumes: `dz()` (Task 1). Produces: seven new `PATHOLOGY_NEXT` keys.

| Pathology (exact `CAUSES` name) | Sites | Red |
|---|---|---|
| `Glioma / metastasis` | 16 | no |
| `Nerve sheath tumour (schwannoma / neurofibroma)` | 14 | no |
| `Perineural spread of head-and-neck malignancy` | 8 | yes |
| `Schwannoma / meningioma / metastasis` | 8 | no |
| `Vertebral metastasis or myeloma` | 8 | yes |
| `Nerve-root schwannoma or neurofibroma` | 7 | no |
| `Nasopharyngeal carcinoma` | 6 | yes |

**Note on the near-duplicates.** Four of these canonicalise onto the coarse `Metastases` entity but are genuinely different workups (a vertebral metastasis and a perineural spread share almost nothing). Author them separately — do **not** add them to `PATHOLOGY_ALIAS`, which is reserved for exact synonyms of one disease.

- [ ] **Step 1: Write the seven plans**

Follow the Task 6 exemplar's shape. Each needs `confirmatory` (≥2), `monitoring` (≥1 with a safety net), `urgency`, `referral`, and `bySite` for ≥2 host sites.

- [ ] **Step 2: Run the test after each plan**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/pathology-next-steps.test.js
```
Expected: PASS, one new differentiation line per plan.

- [ ] **Step 3: Commit**

```bash
git add src/data/pathologyNextSteps.js
git commit -m "content(pathology): neoplastic tranche — 7 plans"
```

---

### Task 8: Content tranche 3 — inflammatory, vascular, metabolic, other (11 pathologies)

**Files:**
- Modify: `src/data/pathologyNextSteps.js`

**Interfaces:**
- Consumes: `dz()` (Task 1). Produces: eleven new `PATHOLOGY_NEXT` keys and one `PATHOLOGY_ALIAS` entry.

| Pathology (exact `CAUSES` name) | Sites | Red |
|---|---|---|
| `Demyelination` | 31 | no |
| `Vasculitic mononeuritis multiplex` | 25 | yes |
| `Intracerebral haemorrhage` | 12 | yes |
| `Radiation plexopathy` | 7 | no |
| `Wernicke's encephalopathy` | 7 | yes |
| `Brainstem abscess or tuberculoma` | 6 | yes |
| `Head trauma` | 6 | no |
| `Hypoglycaemia` | 6 | yes |
| `Malignant infiltration or vertebral metastasis` | 6 | yes |
| `Neuralgic amyotrophy` | 6 | no |
| `Spinal epidural abscess` | 21 | yes | *(already authored in Task 1 — verify only)* |

- [ ] **Step 1: Add the one legitimate alias**

`Demyelination (MS)` (6 sites) and `Demyelination` (31 sites) are two spellings of one disease. Author the plan under `Demyelination` and alias the other. In `src/data/pathologyNextSteps.js`:

```js
export const PATHOLOGY_ALIAS = {
  "Demyelination (MS)": "Demyelination",
};
```

This is the only alias this tranche adds. Anything requiring judgement about whether two names are the same disease goes to owner review first.

- [ ] **Step 2: Write the ten remaining plans**

`Demyelination` at 31 sites is the heaviest interpolation in the tranche and the best test of the spine — it needs `bySite` entries for the neuraxial levels that differ most (`cord_lateral`, `subcortex_optic_radiation`, `visual_pathway_optic_tract`, and a brainstem site), since "MRI the affected region" is exactly the blandness this layer removes.

- [ ] **Step 3: Run the test after each plan**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/pathology-next-steps.test.js
```
Expected: PASS.

- [ ] **Step 4: Verify the tranche total**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node -e '
const R=process.cwd();
Promise.all([import(R+"/src/data/pathologyNextSteps.js"),import(R+"/src/data/causes.js")]).then(([P,C])=>{
  const all=Object.keys(C.CAUSES).flatMap(k=>C.CAUSES[k]);
  const named=new Set([...Object.keys(P.PATHOLOGY_NEXT),...Object.keys(P.PATHOLOGY_ALIAS)]);
  const rows=all.filter(c=>named.has(c.name)).length;
  console.log("plans:",Object.keys(P.PATHOLOGY_NEXT).length,"| rows covered:",rows,"of",all.length,
              "("+(100*rows/all.length).toFixed(0)+"%)");
});'
```
Expected: `plans: 24 | rows covered: 271 of 1286 (21%)`.

(24 plans, not 25 — `Demyelination (MS)` is an alias onto `Demyelination` rather than a plan of its own, and its 6 rows are still counted.)

- [ ] **Step 5: Commit**

```bash
git add src/data/pathologyNextSteps.js
git commit -m "content(pathology): inflammatory/vascular/metabolic tranche — completes the 271-row first tranche"
```

---

### Task 9: App — selectable cause rows in the What card

**Files:**
- Modify: `app/app.js:50` (state), `app/app.js:686-694` (`renderCause`), `app/app.js:696+` (`whatBlock`)
- Modify: `app/index.html` (CSS)

**Interfaces:**
- Consumes: nothing from the engine tasks directly.
- Produces: `S.selectedPathology` (string | undefined) — the exact cause name; read by Task 10.

- [ ] **Step 1: Add the state field**

In `app/app.js`, in the `S` object literal at line 50, add `selectedPathology:undefined,` after `pinned:new Set(),`:

```js
const S = { mode:"localise", tokens:new Set(), dominant:"left", onset:"", course:"", sensoryLevel:"", distalReach:"", atlas:null, pinned:new Set(), selectedPathology:undefined, scope:"site",
```

- [ ] **Step 2: Make the row carry its name and selected state**

Replace `renderCause` (currently at `app/app.js:687`) with:

```js
// One cause: the row (name · tempo · likelihood · red) plus an optional discriminating-feature line.
// The row is SELECTABLE (spec 2026-08-18) — clicking it narrows the Next card to this pathology.
// `--terra` on the selected row is a legitimate use of the identity colour: the selected pathology IS the
// answer the Next card is now about.
function renderCause(c) {
  const path = c.pathognomonic ? `<div class="cpath"><span class="cpath-ic">🔎</span><span><b>Confirm on exam:</b> ${esc(c.pathognomonic)}</span></div>` : "";
  const on = S.selectedPathology === c.name ? " sel" : "";
  return `<div class="cause${on}" data-px="${esc(c.name)}" role="button" tabindex="0" aria-pressed="${S.selectedPathology === c.name}"><div class="cline"><span class="cn">${esc(c.name)}</span><span class="tp" title="typical tempo">${c.tempo.map(x=>x[0].toUpperCase()).join("")}</span><span class="lk">${esc(c.likelihood)}</span>${c.red?`<span class="rf">⚑ RED</span>`:""}</div>${c.feature?`<div class="cfeat">${esc(c.feature)}</div>`:""}${path}</div>`;
}
```

- [ ] **Step 3: Wire the click**

In `app/app.js`, find the results click delegation at line 271 (`if (nx) nx.onclick = …`). Immediately after that statement, add:

`card(cap, body, anchor)` at `app/app.js:301` emits `<section class="out-card" id="sec-<anchor>">`, so the What card is `#sec-what` and the Next card is `#sec-next`. Bind on those two rather than on `#results`, so the handler cannot interfere with the existing `#difflist` and `[data-scope]` delegations:

```js
  // Selecting a cause narrows the Next card to that pathology; clicking the selected one clears it.
  // Bound on both cards: the What rows and the Next card's chip both carry data-px, so one handler
  // shape serves them and the chip's × needs no separate wiring.
  for (const id of ["sec-what", "sec-next"]) {
    const sec = document.getElementById(id);
    if (!sec) continue;
    sec.onclick = e => {
      const row = e.target.closest("[data-px]"); if (!row) return;
      const name = row.dataset.px;
      S.selectedPathology = S.selectedPathology === name ? undefined : name;
      renderResults();
    };
  }
```

Place this immediately after the `if (nx) nx.onclick = …` neuraxis handler at line 271, inside the same `try` block.

- [ ] **Step 4: Clear the selection when the site changes**

A pathology selected at one lesion is meaningless at another. In `app/app.js` line 271 and line 284, both of which set `S.selected`, add `S.selectedPathology = undefined;` immediately before each `S.selected = …` assignment. Also add it at line 201 beside the existing `S.selected = undefined;`.

- [ ] **Step 5: Add the CSS**

In `app/index.html`, beside the existing `.cause` rule, add:

```css
.cause[data-px]{cursor:pointer}
.cause.sel{border-left:2px solid var(--terra);background:var(--sel-bg);border-radius:0 5px 5px 0}
.cause[data-px]:focus-visible{outline:2px solid var(--terra);outline-offset:2px}
```

Add `--sel-bg` to both theme blocks in `app/index.html` — define it on bare `:root` and redefine it in the dark block, alongside the other background tokens.

- [ ] **Step 6: Verify in the browser**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node app/serve.mjs
```
Load `http://localhost:8137/app/`, click the **Cauda equina** worked example, then click a cause row in the What card. Expected: the row takes a terracotta left border; clicking it again clears it.

- [ ] **Step 7: Commit**

```bash
git add app/app.js app/index.html
git commit -m "feat(app): selectable cause rows in the What card"
```

---

### Task 10: App — the Next card renders the selected pathology

**Files:**
- Modify: `app/app.js:739-746` (`nextCard`), `app/app.js:751-768` (`nextBlock`)
- Modify: `app/index.html` (CSS)

**Interfaces:**
- Consumes: `S.selectedPathology` (Task 9), `pathologyNextStepsFor` (Task 4).
- Produces: no new exports.

- [ ] **Step 1: Import the new function**

In `app/app.js` line 8, extend the existing import:

```js
import { nextStepsFor, combinedNextSteps, pathologyNextStepsFor } from "../src/data/nextSteps.js";
```

- [ ] **Step 2: Feed the pathology plan to the card**

Replace `nextCard` with:

```js
function nextCard(site, r, list) {
  // S.pinned MUST be passed — see the note in whatCard().
  const { sites } = combinedSites(r, list, S.pinned);
  const combined = sites.length >= 2 && S.scope === "all";
  // Selection is single-site only: "whose pathology?" has no honest answer across a multifocal set, so the
  // combined view ignores S.selectedPathology rather than picking one site's arbitrarily.
  const nx = combined ? combinedNextSteps(sites) : pathologyNextStepsFor(site, S.selectedPathology || null);
  const cap = combined ? `Next steps <span class="oc-n">(all sites)</span>` : "Next steps";
  return card(cap, nextBlock(nx, combined), "next");
}
```

- [ ] **Step 3: Render the chip, the "Plan for" line, and the tier scope tags**

Replace `nextBlock` with:

```js
function nextBlock(nx, combined) {
  const urgTint = nx.urgency === "emergency" ? "--red" : nx.urgency === "urgent" ? "--gold" : "--faint";
  const urgLabel = nx.urgency === "emergency" ? "EMERGENCY" : nx.urgency === "urgent" ? "URGENT" : "routine";
  // `scope` tags which tiers the selection actually changed. NOT dimming: opacity reads as "disabled"
  // rather than "unaffected", and these tiers are live and correct — they are simply site-level.
  const tier = (title, items, scope) => (items && items.length)
    ? `<div class="ns-tier"><h4 class="ns-h">${esc(title)}${scope ? `<span class="ns-scope">— ${esc(scope)}</span>` : ""}</h4><ul class="nextlist">${items.map(i => `<li>${esc(i)}</li>`).join("")}</ul></div>` : "";
  const px = !combined && nx.pathology;
  const pxHead = px
    ? `<div class="px-line">Plan for: <button class="px-chip" data-px="${esc(nx.pathology)}">${esc(nx.pathology)} <span class="px-x" aria-hidden="true">×</span></button></div>`
    : "";
  const pxFallback = px && !nx.pathologyCurated
    ? `<p class="derived">General plan for this site — not specific to ${esc(nx.pathology)}.</p>` : "";
  const provenance = combined
    ? `<p class="derived">Merged from each site's individual workup plan — see "This site" for any one site's own tiers.</p>`
    : (nx.curated ? "" : `<p class="derived">Tiers derived from site type + urgency — not individually curated.</p>`);
  return `<p class="what-cap"><span class="derived">Educational teaching prompts — not clinical advice.</span></p>
    <div class="multi" style="border-style:solid;border-color:var(${urgTint})"><b>Urgency:</b> ${esc(urgLabel)} · <b>Referral:</b> ${esc(nx.referral)}</div>
    ${pxHead}
    ${tier("Immediate / bedside", nx.immediate, px ? "site" : "")}
    ${tier("First-line investigations", nx.investigations, px ? "site" : "")}
    ${pxFallback}
    ${tier("Confirmatory / specialist", nx.confirmatory, px && nx.pathologyCurated ? nx.pathology : "")}
    ${tier("Monitoring / safety-netting", nx.monitoring, px && nx.pathologyCurated ? nx.pathology : "")}
    ${provenance}`;
}
```

The chip carries `data-px` with the selected name, so the Task 9 handler — which is already bound to `#sec-next` as well as `#sec-what` — toggles it off. **No new wiring is needed in this task.**

- [ ] **Step 4: Add the CSS**

In `app/index.html`:

```css
.px-line{font-size:11.5px;color:var(--muted);margin:6px 0 2px;display:flex;align-items:center;gap:6px}
.px-chip{background:var(--sel-bg);border:1px solid var(--terra);color:var(--fg);border-radius:99px;
         padding:2px 9px;font-size:11px;cursor:pointer;font-family:inherit}
.px-x{color:var(--muted);font-weight:700}
.ns-scope{color:var(--muted);font-weight:400;text-transform:none;letter-spacing:0;margin-left:6px}
```

- [ ] **Step 5: Verify the headline case in the browser**

Serve the app, then load a BPPV case — the one where the badge is wrong today:

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node app/serve.mjs
```

Enter `vertigo` + `head_impulse_abnormal` findings (or use the search box for "positional vertigo"), select the peripheral vestibular site, then click **Posterior circulation stroke** in the What card.

Expected: the urgency line flips from **routine** to **EMERGENCY**; the Confirmatory and Monitoring tiers are tagged with the pathology name; Immediate and First-line are tagged `— site`. Take a screenshot for the PR.

- [ ] **Step 6: Commit**

```bash
git add app/app.js app/index.html
git commit -m "feat(app): Next card renders the selected pathology"
```

---

### Task 11: Case-URL round-trip for the selected pathology

**Files:**
- Modify: `app/case-url.js`
- Modify: `test/case-url.test.js`
- Modify: `app/app.js` (hydrate on boot)

**Interfaces:**
- Consumes: `S.selectedPathology` (Task 9).
- Produces: `encodeCase` emits `px`; `decodeCase` returns `out.selectedPathology` (string) when valid.

- [ ] **Step 1: Write the failing test**

Add to `test/case-url.test.js`, before the final summary:

```js
// --- selected pathology (spec 2026-08-18) ---
{
  const enc = encodeCase({ tokens:new Set(["weak_leg@left"]), selected:"cord_transverse",
                           selectedPathology:"Spinal epidural abscess" });
  ok("the selected pathology is encoded", /(^|&)px=/.test(enc));
  const dec = decodeCase("#" + enc, { validPathologies: new Set(["Spinal epidural abscess"]) });
  ok("it round-trips", dec.selectedPathology === "Spinal epidural abscess");

  const bad = decodeCase("#px=Not%20A%20Real%20Disease", { validPathologies: new Set(["Spinal epidural abscess"]) });
  ok("an unknown pathology is dropped, not thrown on", bad.selectedPathology === undefined);

  const nofilter = decodeCase("#px=Anything");
  ok("with no validPathologies set, any value is accepted", nofilter.selectedPathology === "Anything");
}
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/case-url.test.js
```
Expected: FAIL on `the selected pathology is encoded`.

- [ ] **Step 3: Write the implementation**

In `app/case-url.js`, inside `encodeCase`, after the `if (state.selected)` line:

```js
  if (state.selectedPathology) p.set("px", state.selectedPathology);
```

Inside `decodeCase`, after the block that reads `s`, add — mirroring how findings and sites are validated:

```js
  const px = p.get("px");
  if (px && (!opts.validPathologies || opts.validPathologies.has(px))) out.selectedPathology = px;
```

Add `validPathologies` to the options comment block at the top of `decodeCase` beside `validFindings` and `validSites`.

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/case-url.test.js
```
Expected: PASS.

- [ ] **Step 5: Hydrate and persist in the app**

In `app/app.js`, build the valid set beside `VALID_FINDINGS` / `VALID_SITES` at lines 55-56:

```js
const VALID_PATHOLOGIES = new Set(Object.keys(CAUSES).flatMap(k => CAUSES[k].map(c => c.name)));
```

Add `CAUSES` to the existing `causes.js` import on line 6. In `restoreFromURL`, pass it through and hydrate:

```js
  const st = decodeCase(location.hash, { validFindings: VALID_FINDINGS, validSites: VALID_SITES, validPathologies: VALID_PATHOLOGIES });
```
```js
  if (st.selectedPathology) S.selectedPathology = st.selectedPathology;
```

Find the call site that builds the object passed to `encodeCase` and add `selectedPathology: S.selectedPathology` to it.

- [ ] **Step 6: Verify the round-trip in the browser**

Serve the app, select a lesion and a pathology, copy the URL, open it in a new tab. Expected: the same pathology is selected and the Next card shows its plan.

- [ ] **Step 7: Run the full suite and commit**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test 2>&1 | grep "^FAIL" || echo "all green"
git add app/case-url.js app/app.js test/case-url.test.js
git commit -m "feat(app): share the selected pathology in the case URL"
```

---

### Task 12: Full verification and PR

**Files:** none modified.

- [ ] **Step 1: Run the entire suite**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test 2>&1 | tail -3
```
Expected: exit 0, `0 failed` on the final suite.

- [ ] **Step 2: Confirm the no-selection view is unchanged**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node -e '
const R=process.cwd();
Promise.all([import(R+"/src/data/nextSteps.js"),import(R+"/src/engine/inverse.js")]).then(([N,I])=>{
  const bad=I.candidateSites().filter(s=>
    JSON.stringify(N.pathologyNextStepsFor(s,null))!==JSON.stringify({...N.nextStepsFor(s),pathology:null,pathologyCurated:false}));
  console.log(bad.length===0?"UNCHANGED at all "+I.candidateSites().length+" sites":"DRIFT at "+bad.length+" sites");
});'
```
Expected: `UNCHANGED at all N sites`.

- [ ] **Step 3: Confirm the tranche coverage**

Re-run the Task 8 Step 4 command. Expected: `plans: 24 | rows covered: 271 of 1286 (21%)`.

- [ ] **Step 4: Open the PR**

```bash
git push -u origin feat/per-pathology-next-steps
gh pr create --title "Per-pathology next steps: select a cause, get its workup" --body "$(cat <<'EOF'
The Next steps card was keyed by site, so it unioned every pathology that could produce a lesion there.
Selecting a cause in the What card now narrows the confirmatory, monitoring, urgency and referral tiers to
that disease. Immediate and first-line stay site-level — they are what get you the cause.

Spec: docs/superpowers/specs/2026-08-18-per-pathology-next-steps-design.md

- New `src/data/pathologyNextSteps.js` — `dz()` spine + per-site interpolation, the fifth use of the
  sbSpine/nvSpine/rtSpine/rootNS idiom.
- `pathologyNextStepsFor(site, causeName)`; with `null` it is byte-identical to `nextStepsFor(site)`.
- Urgency gains a `red`-derived FLOOR: 377 sites carry a red must-not-miss and 76 badged "routine".
  Selecting posterior circulation stroke at a BPPV site now reads EMERGENCY.
- First tranche: 24 plans covering 271 of 1286 rows (21%). Uncurated causes fall back to the site plan
  under an explicit label rather than manufacturing generic content.

**Needs clinical review:** the 24 authored plans in `src/data/pathologyNextSteps.js`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Out of scope

Each is its own future project, named here so it is not silently dropped:

- **The remaining 831 pathologies.** Tranche 2+ in the A–H region rhythm, each with its own clinical sign-off.
- **The fundal-photography defect.** `VISUAL_FINDING` in `nextSteps.js:26` does not respect the chiasm — 22 sites fire on a retro-chiasmal token alone, 16 of them post-geniculate where the discs are normal. It also keys on *predicted* rather than *observed* findings. This plan moves the raised-pressure half into pathology plans but does not touch the field-defect half.
- **`combinedNextSteps` / the Together card.** Selection is deliberately ignored in combined view (Task 10, Step 2).

# Together Card Cross-Site Workup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Together card's cross-site diagnosis selectable, so the all-sites Next steps card shows the workup for *that disease* instead of a union of per-site plans.

**Architecture:** A new content-only module `src/data/multifocalNextSteps.js` holds one authored workup per `MULTIFOCAL` entity, keyed by entity name and site-independent. `combinedNextSteps(sites, entityName)` gains an optional second argument that swaps the lower tiers for the entity plan, adds the entity's own first-line tests as a second labelled group, and floors urgency at the most-urgent site. The app gains a `S.selectedEntity` field, selectable only from the Together card's rows, round-tripping through the case URL as `ux=`.

**Tech Stack:** Zero-dependency ES modules. No build step, no test framework — each suite is a standalone Node script with a local `ok(label, cond)` helper.

**Spec:** `docs/superpowers/specs/2026-08-21-together-card-cross-site-workup-design.md`

## Global Constraints

- **Runtime:** no system Node. Prefix every command: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"`.
- **Branch:** `feat/together-cross-site-workup` (already created; the spec commit `677b7e9` is on it).
- **Zero dependencies.** No new packages, no build step, ES modules only.
- **NO SPECIFIC FIGURES** in clinical content — no thresholds, doses, intervals or cut-offs. Say how to interpret a measurement, never what number to act on.
- **Content and logic stay apart.** `src/data/multifocalNextSteps.js` imports nothing from `app/` and nothing from `nextSteps.js`, so a clinician reviews one file.
- **`--terra` allowlist:** do NOT add new terracotta CSS declarations. This work reuses `.cause.sel` and `.px-chip`, both already on the allowlist in `test/brand.test.js`. Writing `var(--terra)` in a CSS *comment* also fails that guard — name the colour in prose.
- **Every new suite must be added** to the `test` script in `package.json`.
- **Clinical content is unreviewed until the owner signs it off**, one round at a time. Each round's commit records the review status in the module header.

---

### Task 1: The cross-site plan module, its shape, and content round 1

**Files:**
- Create: `src/data/multifocalNextSteps.js`
- Create: `test/multifocal-next-steps.test.js`
- Modify: `package.json` (add the suite to the `test` script)

**Interfaces:**
- Consumes: `MULTIFOCAL` from `src/data/multifocal.js` (each entry has `name`, `cat`, `likelihood`, `red` — a string or `false`).
- Produces: `mfPlan(entity, opts)` and `multifocalPlanFor(name) -> { firstLine, confirmatory, monitoring, urgency, referral } | null`, plus `export const MULTIFOCAL_NEXT`. Urgency returned by `multifocalPlanFor` is ALREADY floored by the entity's own `red` flag; Task 2 applies the site floor on top.

- [ ] **Step 1: Write the failing test**

Create `test/multifocal-next-steps.test.js`:

```js
// multifocal-next-steps.test.js — the CROSS-SITE workup layer (spec 2026-08-21).
//
// The Together card names the disease that spans the sites. This layer gives that disease its own workup,
// so the all-sites Next card can stop unioning per-site plans once the cross-site claim has been made.
import { MULTIFOCAL_NEXT, multifocalPlanFor } from "../src/data/multifocalNextSteps.js";
import { MULTIFOCAL } from "../src/data/multifocal.js";
import { PATHOLOGY_NEXT, pathologyPlanFor } from "../src/data/pathologyNextSteps.js";

let pass = 0, fail = 0;
const ok = (l, c, d = "") => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l + (!c && d ? `  [${d}]` : "")); };

// --- 1: the module resolves ---
{
  const p = multifocalPlanFor("Multiple sclerosis");
  ok("a known entity returns a plan", !!p);
  ok("the plan carries first-line tests", Array.isArray(p.firstLine) && p.firstLine.length > 0);
  ok("the plan carries confirmatory steps", Array.isArray(p.confirmatory) && p.confirmatory.length > 0);
  ok("an unknown entity returns null", multifocalPlanFor("Not A Real Disease") === null);
}

// --- 2: no orphan plans — every key names a real roster entity ---
// A plan keyed to a misspelled entity never fires and never errors. This is the only thing that catches it.
{
  const rosterNames = new Set(MULTIFOCAL.map(e => e.name));
  for (const name of Object.keys(MULTIFOCAL_NEXT))
    ok(`plan key \`${name}\` names a real MULTIFOCAL entity`, rosterNames.has(name));
}

// --- 3: every plan is complete ---
{
  for (const name of Object.keys(MULTIFOCAL_NEXT)) {
    const p = multifocalPlanFor(name);
    ok(`\`${name}\` has first-line and confirmatory content`, p.firstLine.length > 0 && p.confirmatory.length > 0);
    ok(`\`${name}\` has monitoring content`, p.monitoring.length > 0);
    ok(`\`${name}\` has an urgency and a referral`, typeof p.urgency === "string" && typeof p.referral === "string" && p.referral.length > 0);
  }
}

// --- 4: no two entity plans are identical ---
// The family() invariant, reapplied. 13 plans that emit the same text are one bland plan wearing 13 labels.
{
  const seen = new Map();
  for (const name of Object.keys(MULTIFOCAL_NEXT)) {
    const p = multifocalPlanFor(name);
    const sig = JSON.stringify([p.firstLine, p.confirmatory, p.monitoring]);
    ok(`\`${name}\` emits a plan no other entity emits`, !seen.has(sig), `same as ${seen.get(sig)}`);
    seen.set(sig, name);
  }
}

// --- 5: the entity `red` floor ---
// An entity carrying a red flag may never render as routine, exactly as a red per-site cause may not.
{
  for (const e of MULTIFOCAL) {
    const p = multifocalPlanFor(e.name);
    if (!p || !e.red) continue;
    ok(`\`${e.name}\` (red) is not routine`, p.urgency !== "routine");
  }
}

// --- 6: cross-site plans are NOT the same as the same-named SITE plans ---
// Four entity names are also verbatim per-site cause names. Three of them have a PATHOLOGY_NEXT plan under
// that same name, and those are SITE plans — reusing one as a cross-site plan is the trap this catches.
// "Multiple sclerosis" is excluded: it has no PATHOLOGY_NEXT entry under that exact spelling (its per-site
// plan is authored as "Demyelination"), so there is nothing to differ from.
{
  const collide = ["Motor neurone disease (ALS)", "Neurosarcoidosis", "Neurofibromatosis type 2"];
  for (const name of collide) {
    if (!MULTIFOCAL_NEXT[name]) continue;                       // not yet authored — a later round covers it
    ok(`\`${name}\` has a SITE plan to differ from`, !!PATHOLOGY_NEXT[name]);
    const cross = multifocalPlanFor(name);
    const perSite = pathologyPlanFor(name, null);
    ok(`\`${name}\` cross-site confirmatory differs from its site plan`,
       JSON.stringify(cross.confirmatory) !== JSON.stringify(perSite.confirmatory));
  }
}

// --- 7: THE RATCHET. Entities with no plan may only ever DECREASE. ---
// Same shape as tranche 2's RED_WITHOUT_PLAN_CEILING: a plain "every entity has a plan" would fail on every
// authoring round, so this is a ceiling that falls with each round and retires into a hard gate at 0.
const ENTITY_WITHOUT_PLAN_CEILING = 8;
{
  const missing = MULTIFOCAL.filter(e => !MULTIFOCAL_NEXT[e.name]).map(e => e.name);
  ok(`entities without a plan (${missing.length}) is at or below the ceiling (${ENTITY_WITHOUT_PLAN_CEILING})`,
     missing.length <= ENTITY_WITHOUT_PLAN_CEILING, missing.join(" | "));
  console.log(`\nREPORT  ${MULTIFOCAL.length - missing.length} of ${MULTIFOCAL.length} entities planned; ` +
              `${missing.length} left${missing.length ? " — " + missing.join(", ") : ""}`);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run test to verify it fails**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/multifocal-next-steps.test.js
```

Expected: FAIL — `Cannot find module '.../src/data/multifocalNextSteps.js'`.

- [ ] **Step 3: Write the module with round-1 content**

Create `src/data/multifocalNextSteps.js`:

```js
// multifocalNextSteps.js — THE CROSS-SITE WORKUP LAYER (spec 2026-08-21).
//
//   multifocalPlanFor(name) -> { firstLine, confirmatory, monitoring, urgency, referral } | null
//
// The Together card names the process that spans the sites; this gives that process its own workup, so the
// all-sites Next card can stop unioning per-site plans once the cross-site claim has been made. A union of
// an optic-nerve plan and a cord plan never orders the lumbar puncture that settles MS, because neither
// site knows the two lesions are related.
//
// CONTENT ONLY. Imports nothing from the UI and nothing from nextSteps.js, so a clinician reviews one file.
//
// SITE-INDEPENDENT BY CONSTRUCTION — no `slots`, no `bySite`. That is the whole point: MS needs MRI brain
// AND whole spine, CSF oligoclonal bands and AQP4/MOG regardless of which two places the lesions sit in.
// This is why the plans do NOT live in src/data/pathology/, whose plans are keyed by per-site cause name
// and interpolate per-site anatomy.
//
// A `firstLine` tier exists here and does NOT exist in tranche 2's dz(): in the per-site layer, first-line
// was always site-level. Here it is ADDITIVE — the site union PLUS these, never instead of them, so an
// urgent MRI whole spine cannot vanish because someone clicked MS.
//
// REVIEW STATUS: round 1 (inflammatory / demyelinating — 5 entities) AWAITING CLINICAL REVIEW.
import { MULTIFOCAL } from "./multifocal.js";

const URGENCY_RANK = { emergency: 3, urgent: 2, routine: 1 };
const RED_FLOOR = "urgent";

export const mfPlan = (entity, { firstLine = [], confirmatory = [], monitoring = [], urgency = "routine", referral = "" }) =>
  ({ entity, firstLine, confirmatory, monitoring, urgency, referral });

export const MULTIFOCAL_NEXT = {
  "Multiple sclerosis": mfPlan("Multiple sclerosis", {
    firstLine: [
      "MRI BRAIN AND WHOLE SPINE with contrast in one sitting — dissemination in space is the diagnosis, and a cord lesion is missed by brain imaging alone",
      "LUMBAR PUNCTURE for CSF-restricted OLIGOCLONAL BANDS with a paired serum sample — the test that separates demyelination from its mimics",
      "Serum AQP4 and MOG antibodies BEFORE committing to an MS label — both are treated differently, and both can look like MS at a first attack",
      "Bloods for the mimics that image alike: B12, thyroid function, ANA/ENA, ACE, HIV and syphilis serology",
    ],
    confirmatory: [
      "Visual evoked potentials where a clinically silent optic lesion would add dissemination in space",
      "OCT of the retinal nerve fibre layer for subclinical thinning",
      "Neurology referral for formal criteria review and a disease-modifying therapy discussion",
    ],
    monitoring: [
      "Record a baseline disability score before treatment starts, so later change is measurable rather than remembered",
      "Screen for the treatable things that worsen function independently of relapses — bladder dysfunction, spasticity, fatigue, low mood",
      "Counsel on the relapse-versus-pseudorelapse distinction, and give explicit re-presentation advice",
    ],
    urgency: "urgent",
    referral: "Neurology — MS service; urgent for a first presentation disseminated in space or any cord involvement.",
  }),

  "NMOSD (neuromyelitis optica spectrum disorder)": mfPlan("NMOSD (neuromyelitis optica spectrum disorder)", {
    firstLine: [
      "Serum AQP4-IgG by CELL-BASED ASSAY, with MOG-IgG alongside it — the assay matters, and an ELISA result is not equivalent",
      "MRI brain and WHOLE SPINE with contrast — look for a longitudinally extensive cord lesion and for area postrema involvement",
      "Lumbar puncture — oligoclonal bands are usually ABSENT here, which is itself informative against MS",
      "Baseline bloods with a screen for coexisting autoimmune disease",
    ],
    confirmatory: [
      "Formal acuity, colour vision and perimetry — optic neuritis here is more often bilateral or chiasmal, and more severe, than in MS",
      "OCT for retinal nerve fibre layer loss",
      "URGENT neurology / neuroimmunology discussion: acute escalation to plasma exchange is time-critical and must not wait for the antibody result",
    ],
    monitoring: [
      "Watch respiratory function and swallow where there is a cervical cord or area postrema lesion",
      "Intractable hiccups or vomiting is a relapse, not a gastrointestinal problem — treat it as one",
      "Recovery is less complete than in MS: involve rehabilitation early rather than after a plateau",
    ],
    urgency: "emergency",
    referral: "Neurology / neuroimmunology — same day. Do not delay acute treatment for the antibody result.",
  }),

  "Neurosarcoidosis": mfPlan("Neurosarcoidosis", {
    firstLine: [
      "MRI brain and spine with contrast — leptomeningeal and cranial nerve enhancement is the pattern to look for",
      "Serum ACE and calcium, with CT chest (or thorax/abdomen/pelvis) for systemic disease — the accessible biopsy target is usually OUTSIDE the nervous system",
      "Lumbar puncture: cell count, protein, glucose, cytology and CSF ACE with a paired serum sample",
      "Ophthalmology review for uveitis — a silent extraneural site that both supports the diagnosis and needs treating",
    ],
    confirmatory: [
      "FDG-PET to find an occult systemic focus when chest imaging is unrevealing",
      "TISSUE DIAGNOSIS from the most accessible site — mediastinal node, skin or conjunctiva, long before brain or meningeal biopsy is considered",
      "Exclude by name the mimics that enhance identically: tuberculosis, lymphoma, IgG4-related disease",
    ],
    monitoring: [
      "Neuroendocrine assessment where there is hypothalamic or pituitary involvement — easily missed, and readily treated",
      "Monitor for hydrocephalus wherever there is basal meningeal disease",
      "Plan steroid-sparing therapy, and monitor for the metabolic and bone consequences of prolonged steroids",
    ],
    urgency: "urgent",
    referral: "Neurology with respiratory or rheumatology input; ophthalmology for uveitis.",
  }),

  "Vasculitis (CNS or systemic)": mfPlan("Vasculitis (CNS or systemic)", {
    firstLine: [
      "ESR AND CRP together (one can be normal), full blood count with film, renal function, and URINALYSIS for casts and protein",
      "ANCA, ANA/ENA, complement, cryoglobulins, rheumatoid factor, and hepatitis B and C serology",
      "MRI brain and spine with contrast plus vessel imaging — infarcts in multiple territories OF DIFFERING AGE is the pattern",
      "Lumbar puncture to exclude infection and to demonstrate inflammation, BEFORE immunosuppression starts",
    ],
    confirmatory: [
      "Catheter angiography where the vessels involved are large enough to show beading — a normal MRA does not exclude small-vessel disease",
      "BIOPSY of the most accessible affected organ; brain and leptomeningeal biopsy only where nothing else is available",
      "Blood cultures and echocardiography — endocarditis mimics vasculitis exactly, and immunosuppressing it would be catastrophic",
    ],
    monitoring: [
      "Treat the infectious mimics as excluded only when cultures and imaging say so, never on the strength of the clinical picture",
      "Monitor renal function and urinalysis: the kidney declares systemic vasculitis earlier than the nervous system does",
      "Plan induction and maintenance immunosuppression with the relevant specialty, and monitor for treatment-related infection",
    ],
    urgency: "urgent",
    referral: "Neurology with rheumatology; renal if urinalysis is abnormal.",
  }),

  "Mononeuritis multiplex": mfPlan("Mononeuritis multiplex", {
    firstLine: [
      "NERVE CONDUCTION STUDIES AND EMG — the study that proves the pattern is multiple NAMED nerves in a non-length-dependent distribution, not a polyneuropathy",
      "Vasculitic screen: ESR/CRP, ANCA, ANA/ENA, cryoglobulins, complement, hepatitis B and C, HIV",
      "Glucose and HbA1c — diabetes is the commonest non-vasculitic cause, and it does not need immunosuppression",
      "Urinalysis and renal function for systemic involvement",
    ],
    confirmatory: [
      "NERVE AND MUSCLE BIOPSY (sural nerve with adjacent muscle) — the highest-yield tissue diagnosis, and best taken before immunosuppression begins",
      "Whole-body imaging or PET where a paraneoplastic or lymphomatous cause is suspected",
      "Consider leprosy wherever there is a relevant exposure history — it remains the commonest cause worldwide",
    ],
    monitoring: [
      "This progresses stepwise: each new nerve is a relapse, so document the deficit carefully at every review",
      "Splinting and hand or foot therapy early, before contracture becomes fixed",
      "Neuropathic pain here is severe and routinely undertreated — address it explicitly rather than in passing",
    ],
    urgency: "urgent",
    referral: "Neurology with rheumatology; urgent where there is systemic involvement or rapid progression.",
  }),
};

// The entity's own `red` flag floors its urgency, exactly as a red per-site cause floors the site's. The
// floor may RAISE urgency and never caps it: a plan may legitimately sit below the site's badge, but
// nothing flagged as a must-not-miss may render as routine.
const RED_BY_ENTITY = new Map(MULTIFOCAL.map(e => [e.name, !!e.red]));

export function multifocalPlanFor(name) {
  const p = MULTIFOCAL_NEXT[name];
  if (!p) return null;
  const floored = RED_BY_ENTITY.get(name) && URGENCY_RANK[p.urgency] < URGENCY_RANK[RED_FLOOR]
    ? RED_FLOOR : p.urgency;
  return { firstLine: p.firstLine, confirmatory: p.confirmatory, monitoring: p.monitoring,
           urgency: floored, referral: p.referral };
}
```

- [ ] **Step 4: Add the suite to package.json**

In `package.json`, append to the end of the `test` script value (after `&& node test/pathology-next-steps.test.js`):

```
 && node test/multifocal-next-steps.test.js
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/multifocal-next-steps.test.js
```

Expected: PASS on every line, and a final report reading `REPORT  5 of 13 entities planned; 8 left — Motor neurone disease (ALS), Metastases, ...`.

- [ ] **Step 6: Run the full suite**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test 2>&1 | tail -3
```

Expected: `0 failed` on the last line. No existing suite may change.

- [ ] **Step 7: Commit**

```bash
git add src/data/multifocalNextSteps.js test/multifocal-next-steps.test.js package.json
git commit -m "feat(multifocal): cross-site workup module + content round 1

Five inflammatory / demyelinating entities: MS, NMOSD, neurosarcoidosis,
vasculitis, mononeuritis multiplex. Site-independent by construction — no
slots, no bySite — which is why they do not live in src/data/pathology/.

Ratchet ENTITY_WITHOUT_PLAN_CEILING opens at 8 and may never rise.

Content AWAITING CLINICAL REVIEW.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

- [ ] **Step 8: STOP for clinical review**

Round 1 is new clinical content. Present the five plans to the owner for review before starting Task 2. Do not batch this with later rounds — the review rhythm that caught errors in tranches 1 and 2 is one round at a time.

---

### Task 2: `combinedNextSteps(sites, entityName)`

**Files:**
- Modify: `src/data/nextSteps.js` (the `combinedNextSteps` export at the end of the file)
- Modify: `test/multifocal-next-steps.test.js` (append sections 8-11)

**Interfaces:**
- Consumes: `multifocalPlanFor(name)` from Task 1; `URGENCY_RANK` already declared in `nextSteps.js`.
- Produces: `combinedNextSteps(sites, entityName = null)`. With no entity it returns EXACTLY today's object (no new keys). With an entity it adds `entity: <name>` and `entityFirstLine: string[]`, replaces `confirmatory` / `monitoring` / `referral`, and raises `urgency`. `investigations` is NEVER modified.

- [ ] **Step 1: Write the failing test**

Append to `test/multifocal-next-steps.test.js`, immediately before the final `console.log` / `process.exit` lines:

```js
// ---- the combined card (spec §3) ----
import { combinedNextSteps } from "../src/data/nextSteps.js";
import { candidateSites } from "../src/engine/inverse.js";

const ALL = candidateSites();
const byId = id => ALL.find(s => s.id === id);
const PAIR = [byId("left_skull_base_optic_neuritis"), byId("left_cord_lateral")];

// --- 8: no entity means byte-identical to the pre-2026-08-21 behaviour ---
// One code path, so the no-selection view cannot drift. Compared as JSON: an ADDED key would fail this,
// which is why `entity` and `entityFirstLine` are absent rather than null when nothing is selected.
{
  ok("both fixture sites resolve", PAIR.every(Boolean));
  const a = JSON.stringify(combinedNextSteps(PAIR));
  const b = JSON.stringify(combinedNextSteps(PAIR, null));
  ok("combinedNextSteps(sites) === combinedNextSteps(sites, null)", a === b);
  ok("no entity leaves no `entity` key", !("entity" in combinedNextSteps(PAIR)));
  ok("an unknown entity falls back to the plain union", JSON.stringify(combinedNextSteps(PAIR, "Not A Real Disease")) === a);
}

// --- 9: the tier split — immediate and first-line are site-level and UNCHANGED ---
{
  const plain = combinedNextSteps(PAIR);
  const withE = combinedNextSteps(PAIR, "Multiple sclerosis");
  ok("immediate is untouched by the selection",
     JSON.stringify(withE.immediate) === JSON.stringify(plain.immediate));
  ok("first-line (site) is untouched by the selection",
     JSON.stringify(withE.investigations) === JSON.stringify(plain.investigations));
  ok("the entity's own first-line arrives alongside it", withE.entityFirstLine.length > 0);
  ok("the rendered first-line is a SUPERSET of the site union",
     plain.investigations.every(i => [...withE.investigations, ...withE.entityFirstLine].includes(i)));
  ok("confirmatory becomes the entity plan",
     JSON.stringify(withE.confirmatory) === JSON.stringify(multifocalPlanFor("Multiple sclerosis").confirmatory));
  ok("monitoring becomes the entity plan",
     JSON.stringify(withE.monitoring) === JSON.stringify(multifocalPlanFor("Multiple sclerosis").monitoring));
  ok("referral becomes the entity plan's", withE.referral === multifocalPlanFor("Multiple sclerosis").referral);
  ok("the entity is reported back", withE.entity === "Multiple sclerosis");
}

// --- 10: THE URGENCY FLOOR — selecting an entity may raise urgency, never lower it ---
// Swept over real pairs rather than one fixture: the failure this guards against is a chronic-sounding
// entity silently de-escalating a picture that contains a cord site badged emergency.
{
  const RANK = { emergency: 3, urgent: 2, routine: 1 };
  const sample = [byId("left_skull_base_optic_neuritis"), byId("left_cord_lateral"),
                  byId("left_nerve_median_proximal"), byId("left_cord_hemi")].filter(Boolean);
  let violations = 0, checked = 0;
  for (let i = 0; i < sample.length; i++) for (let j = i + 1; j < sample.length; j++) {
    const pair = [sample[i], sample[j]];
    const floor = RANK[combinedNextSteps(pair).urgency];
    for (const name of Object.keys(MULTIFOCAL_NEXT)) {
      checked++;
      if (RANK[combinedNextSteps(pair, name).urgency] < floor) violations++;
    }
  }
  ok(`the site urgency is a FLOOR across ${checked} (pair, entity) combinations`, violations === 0, `${violations} de-escalations`);
}

// --- 11: an emergency entity RAISES a routine pair ---
{
  const pair = [byId("left_nerve_median_proximal"), byId("left_skull_base_optic_neuritis")].filter(Boolean);
  const withE = combinedNextSteps(pair, "NMOSD (neuromyelitis optica spectrum disorder)");
  ok("an emergency entity plan reaches the card", withE.urgency === "emergency");
}
```

> Move the two new `import` lines to the top of the file with the others — ES module imports are hoisted, so they work where written, but keeping them at the top matches every other suite in this repo.

- [ ] **Step 2: Run test to verify it fails**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/multifocal-next-steps.test.js 2>&1 | grep -E "^FAIL|failed"
```

Expected: FAIL on `the entity's own first-line arrives alongside it` (`withE.entityFirstLine` is undefined) and on the tiers that have not yet been swapped.

- [ ] **Step 3: Write the implementation**

In `src/data/nextSteps.js`, add to the import block at the top of the file:

```js
import { multifocalPlanFor } from "./multifocalNextSteps.js";
```

Then replace the whole `combinedNextSteps` function at the end of the file with:

```js
// `entityName` narrows the plan to the ONE cross-site disease the Together card named (spec 2026-08-21).
//
// THE TIER SPLIT. Immediate stays the site union: it is done before the cause is known. First-line is
// ADDITIVE — `investigations` is never touched and the entity's own tests ride alongside it in
// `entityFirstLine`, because the tests that IDENTIFY a cross-site disease (CSF oligoclonal bands, AQP4,
// ANCA) live in first-line and no site plan will ever order them, while an urgent MRI whole spine must not
// vanish because someone clicked MS. Confirmatory, monitoring and referral become the entity's.
//
// `entityName: null` returns EXACTLY the object this function returned before this argument existed — no
// added keys — so the no-selection view has one code path and cannot drift. An unknown name degrades to
// the same thing rather than throwing.
export function combinedNextSteps(sites, entityName = null) {
  const all = sites.map(nextStepsFor);
  const union = key => [...new Set(all.flatMap(n => n[key] || []))];
  const siteUrgency = URGENCY_ORDER.find(u => all.some(n => n.urgency === u)) || "routine";
  const referral = [...new Set(all.map(n => n.referral).filter(Boolean))].join(" · ");
  const base = {
    immediate: union("immediate"),
    investigations: union("investigations"),
    confirmatory: union("confirmatory"),
    monitoring: union("monitoring"),
    urgency: siteUrgency,
    referral,
    sites: sites.map(s => s.id),
  };
  const plan = entityName ? multifocalPlanFor(entityName) : null;
  if (!plan) return base;
  // THE SITE UNION IS A FLOOR, never a ceiling — the same shape as resolveUrgency()'s red floor. Selecting
  // a cross-site disease must not de-escalate a picture that contains an emergency-badged site.
  const urgency = URGENCY_RANK[plan.urgency] >= URGENCY_RANK[siteUrgency] ? plan.urgency : siteUrgency;
  return {
    ...base,
    entityFirstLine: plan.firstLine,
    confirmatory: plan.confirmatory,
    monitoring: plan.monitoring,
    urgency,
    referral: plan.referral,
    entity: entityName,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/multifocal-next-steps.test.js 2>&1 | tail -3
```

Expected: `0 failed`.

- [ ] **Step 5: Run the full suite**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test 2>&1 | tail -3
```

Expected: `0 failed`. `test/next-steps.test.js` and `test/multifocal.test.js` must pass **untouched** — that is the proof the default path is unchanged.

- [ ] **Step 6: Commit**

```bash
git add src/data/nextSteps.js test/multifocal-next-steps.test.js
git commit -m "feat(multifocal): combinedNextSteps takes an optional entity

Immediate and site first-line untouched; the entity's own first-line rides
alongside in entityFirstLine; confirmatory/monitoring/referral become the
entity's. The site urgency is a FLOOR, never a ceiling.

combinedNextSteps(sites, null) is byte-identical to combinedNextSteps(sites),
asserted as JSON so an added key would fail it.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: App wiring — selectable Together rows and the narrowed Next card

**Files:**
- Modify: `app/app.js` (state at :50, `loadExample` at :206, handlers at :270-315, `unifyingRow` at :466, `togetherCard` at :498, `nextCard` at :762, `nextBlock` at :774)

**Interfaces:**
- Consumes: `combinedNextSteps(sites, entityName)` from Task 2; `MULTIFOCAL` for the validity gate.
- Produces: `S.selectedEntity` (string | undefined), read by Task 4's URL encoder.

**No new CSS.** The selected row reuses `.cause.sel` and the chip reuses `.px-chip`, both already on the `--terra` allowlist in `test/brand.test.js`. Adding a new terracotta declaration will fail that suite.

- [ ] **Step 1: Add the state field**

In `app/app.js` line 50, add `selectedEntity:undefined,` immediately after `selectedPathology:undefined,`:

```js
const S = { mode:"localise", tokens:new Set(), dominant:"left", onset:"", course:"", sensoryLevel:"", distalReach:"", atlas:null, pinned:new Set(), selectedPathology:undefined, selectedEntity:undefined, scope:"site",
```

- [ ] **Step 2: Import the roster for the validity gate**

`app/app.js` line 19 already reads:

```js
import { unifyingDiagnoses, forcingFindings } from "../src/engine/multifocal.js";
```

Add below it:

```js
import { MULTIFOCAL } from "../src/data/multifocal.js";
```

- [ ] **Step 3: Make the Together rows selectable**

Replace `unifyingRow` (app.js:466-473) with:

```js
// The row is SELECTABLE (spec 2026-08-21) — clicking it narrows the all-sites Next card to this disease.
// `.cause.sel` carries the terracotta, reusing the allowlisted rule: the selected entity IS the answer the
// Next card is now about, exactly as the selected per-site pathology is.
function unifyingRow(e, sites) {
  const whyLine = e.why
    .map(w => (w.satisfiedBy && w.satisfiedBy.id) ? esc(siteName(w.satisfiedBy)) : clauseText(w.clause, sites))
    .filter(Boolean).join(" · ");
  const path = e.confirm ? `<div class="cpath"><span class="cpath-ic">🔎</span><span><b>Confirm on exam:</b> ${esc(e.confirm)}</span></div>` : "";
  const red = e.red ? `<div class="multi" style="border-style:solid;border-color:var(--red);background:var(--red-bg)"><b>Red flag:</b> ${esc(e.red)}</div>` : "";
  const on = S.selectedEntity === e.name;
  return `<div class="cause${on ? " sel" : ""}" data-ux="${esc(e.name)}" role="button" tabindex="0" aria-pressed="${on}"><div class="cline"><span class="cn">${esc(e.name)}</span><span class="lk">${esc(e.likelihood)}</span>${e.red ? `<span class="rf">⚑ RED</span>` : ""}</div>${e.feature ? `<div class="cfeat">${esc(e.feature)}</div>` : ""}${whyLine ? `<div class="dloc">${whyLine}</div>` : ""}${red}${path}</div>`;
}
```

- [ ] **Step 4: Add the validity gate**

The entity is a claim about a SPECIFIC SITE SET, so rather than clearing it from every handler that could
invalidate it, one gate at render time drops it the moment the Together card stops offering it. Insert this
function immediately above `togetherCard` (app.js:498):

```js
// THE VALIDITY GATE. `S.selectedEntity` is a claim about the CURRENT site set, so it survives exactly as
// long as the Together card still offers it. One rule here subsumes the enumerated clears — fewer than two
// sites, a findings edit that stops the entity firing, a re-pin onto a pair it does not fit — because in
// every one of those cases the roster stops returning it. Scattering `S.selectedEntity = undefined` across
// the handlers would be four places to forget instead of one.
//
// A findings edit that leaves the entity STILL FIRING deliberately keeps the selection: the claim is still
// on offer and still true, so dropping it would be busywork for the reader.
function pruneSelectedEntity(offered) {
  if (S.selectedEntity && !offered.has(S.selectedEntity)) S.selectedEntity = undefined;
}
```

Then inside `togetherCard`, immediately after the `const u = unifyingDiagnoses(...)` line (app.js:521), add:

```js
  pruneSelectedEntity(new Set([...u.concordant, ...u.discordant].map(e => e.name)));
```

And at the top of `togetherCard`, replace the early return so a collapsed card also drops the claim:

```js
  const { sites, source } = combinedSites(r, list, S.pinned);
  if (sites.length < 2) { S.selectedEntity = undefined; return ""; }
```

- [ ] **Step 5: Move `syncURL()` below the Together card**

The gate runs inside `togetherCard`, which `renderResults` already calls at app.js:262 — BEFORE `nextCard`
at :272 — so a pruned entity cannot reach the Next card in the same frame. But `syncURL()` currently runs at
app.js:260, one line ABOVE it, so an invalidated entity would be written into the shareable hash for one
frame. Move the call so the URL is written from pruned state.

Delete the `syncURL();` line at app.js:260, and add it immediately after the `const together = ...` line:

```js
  const tf = tractsFor(S.tokens, { dominantSide: S.dominant, sensoryLevel: S.sensoryLevel || undefined });
  const together = togetherCard(r, list);
  // AFTER togetherCard, never before: the validity gate lives in that call, and the hash is the shareable
  // case — writing it from unpruned state would put an entity in the link that the card no longer offers.
  syncURL();
```

- [ ] **Step 6: Wire the click handler**

In the handler block at app.js:280-289, extend the section list to include the Together card and handle
both attributes. Replace:

```js
  for (const secId of ["sec-what", "sec-next"]) {
    const sec = document.getElementById(secId);
    if (!sec) continue;
    sec.onclick = e => {
      const row = e.target.closest("[data-px]"); if (!row) return;
      const name = row.dataset.px;
      S.selectedPathology = S.selectedPathology === name ? undefined : name;
      renderResults();
    };
  }
```

with:

```js
  for (const secId of ["sec-what", "sec-next", "sec-together"]) {
    const sec = document.getElementById(secId);
    if (!sec) continue;
    sec.onclick = e => {
      // data-ux (a cross-site entity, from the Together card or the Next card's chip) and data-px (a
      // per-site pathology) are DIFFERENT CLAIMS and must not share a field: four entity names are also
      // verbatim per-site cause names, so one string could not say which was meant.
      const uxRow = e.target.closest("[data-ux]");
      if (uxRow) {
        const name = uxRow.dataset.ux;
        S.selectedEntity = S.selectedEntity === name ? undefined : name;
        renderResults();
        return;
      }
      const row = e.target.closest("[data-px]"); if (!row) return;
      const name = row.dataset.px;
      S.selectedPathology = S.selectedPathology === name ? undefined : name;
      renderResults();
    };
  }
```

- [ ] **Step 7: Clear the entity when an example loads**

In `loadExample` (app.js:206), add after `S.selectedPathology = undefined;`:

```js
  S.selectedEntity = undefined;
```

- [ ] **Step 8: Feed the entity to the Next card**

Replace the body of `nextCard` (app.js:762-770) with:

```js
function nextCard(site, r, list) {
  // S.pinned MUST be passed — see the note in whatCard().
  const { sites } = combinedSites(r, list, S.pinned);
  const combined = sites.length >= 2 && S.scope === "all";
  // Per-site selection is single-site only; the CROSS-SITE selection is the combined view's answer to
  // "whose pathology?" — the disease the Together card named as spanning these sites (spec 2026-08-21).
  const nx = combined
    ? combinedNextSteps(sites, S.selectedEntity || null)
    : pathologyNextStepsFor(site, S.selectedPathology || null);
  const cap = combined ? `Next steps <span class="oc-n">(all sites)</span>` : "Next steps";
  return card(cap, nextBlock(nx, combined), "next");
}
```

- [ ] **Step 9: Render the entity tiers**

In `nextBlock` (app.js:774-806), replace everything from `const px = !combined && nx.pathology;` to the
closing backtick of the return template with:

```js
  const px = !combined && nx.pathology;
  const ux = combined && nx.entity;
  const pxHead = px
    ? `<div class="px-line">Plan for: <button class="px-chip" data-px="${esc(nx.pathology)}" title="Clear the selected pathology">${esc(nx.pathology)} <span class="px-x" aria-hidden="true">×</span></button></div>`
    : ux
    ? `<div class="px-line">Plan for: <button class="px-chip" data-ux="${esc(nx.entity)}" title="Clear the selected cross-site diagnosis">${esc(nx.entity)} <span class="px-x" aria-hidden="true">×</span></button></div>`
    : "";
  // The honest fallback (spec 2026-08-18): an uncurated pathology shows the SITE plan and says so, rather
  // than deriving generic content to fill the gap. There is deliberately NO cross-site equivalent — every
  // entity has an authored plan (the gate in test/multifocal-next-steps.test.js), so `ux` never falls back.
  const pxFallback = px && !nx.pathologyCurated
    ? `<p class="derived">General plan for this site — not specific to ${esc(nx.pathology)}.</p>` : "";
  const provenance = ux
    ? `<p class="derived">Immediate and first-line steps are merged from each site's own plan; the tiers below them are the workup for ${esc(nx.entity)}.</p>`
    : combined
    ? `<p class="derived">Merged from each site's individual workup plan — see "This site" for any one site's own tiers.</p>`
    : (nx.curated ? "" : `<p class="derived">Tiers derived from site type + urgency — not individually curated.</p>`);
  return `<p class="what-cap"><span class="derived">Educational teaching prompts — not clinical advice.</span></p>
    <div class="multi" style="border-style:solid;border-color:var(${urgTint})"><b>Urgency:</b> ${esc(urgLabel)} · <b>Referral:</b> ${esc(nx.referral)}</div>
    ${pxHead}
    ${tier("Immediate / bedside", nx.immediate, px || ux ? "site" : "")}
    ${tier("First-line investigations", nx.investigations, px || ux ? "site" : "")}
    ${ux ? tier("First-line investigations", nx.entityFirstLine, nx.entity) : ""}
    ${pxFallback}
    ${tier("Confirmatory / specialist", nx.confirmatory, px && nx.pathologyCurated ? nx.pathology : ux ? nx.entity : "")}
    ${tier("Monitoring / safety-netting", nx.monitoring, px && nx.pathologyCurated ? nx.pathology : ux ? nx.entity : "")}
    ${provenance}`;
}
```

- [ ] **Step 10: Run the full suite**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test 2>&1 | tail -3
```

Expected: `0 failed`. `test/brand.test.js` in particular must stay green — it scans the stylesheet for
terracotta declarations, and this task adds none.

- [ ] **Step 11: Drive it in the browser**

Start the server and load the "Two lesions" worked example, which exists precisely to exercise the Together card:

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node app/serve.mjs
```

Open http://localhost:8137/app/, click **Two lesions**, switch the scope toggle to **All 2 sites**, then click a row in the Together card. Confirm:

1. The row takes the terracotta selected state.
2. The Next card grows a "Plan for: <entity> ×" chip.
3. A second **First-line investigations** group appears, tagged with the entity name, below the one tagged "— site".
4. Confirmatory and Monitoring are tagged with the entity name.
5. Clicking the chip's × clears the selection and the card returns to the union.
6. The urgency pill never falls when an entity is selected.

- [ ] **Step 12: Commit**

```bash
git add app/app.js
git commit -m "feat(app): the Together card's rows select their cross-site workup

Only the Together rows select; the What card's shared and remainder rows stay
inert in the all-sites view. S.selectedEntity is a separate field from
S.selectedPathology because four entity names are also verbatim per-site cause
names, so one field could not say which claim was meant.

One validity gate at render time replaces four scattered clears: the claim
survives exactly as long as the roster still offers it.

No new CSS — .cause.sel and .px-chip are already on the --terra allowlist.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Case URL round-trip (`ux=`)

**Files:**
- Modify: `app/case-url.js` (`encodeCase`, `decodeCase`)
- Modify: `app/app.js` (`VALID_ENTITIES`, `restoreFromURL`)
- Modify: `test/case-url.test.js`

**Interfaces:**
- Consumes: `S.selectedEntity` from Task 3.
- Produces: `decodeCase(...).selectedEntity` and `decodeCase(...).scope`.

- [ ] **Step 1: Write the failing test**

Append to `test/case-url.test.js`, immediately before the final `console.log` / `process.exit` lines:

```js
// ---- ux= : the cross-site entity (spec 2026-08-21) ----
{
  const validEntities = new Set(["Multiple sclerosis", "Vasculitis (CNS or systemic)"]);
  const enc = encodeCase({ tokens: new Set(["weak_leg@left"]), selectedEntity: "Multiple sclerosis" });
  ok("encodes the entity as ux=", /ux=/.test(enc));
  const back = decodeCase("#" + enc, { validFindings, validEntities });
  ok("round-trips the entity", back.selectedEntity === "Multiple sclerosis");
  // ux has no meaning outside the all-sites view, so its presence IS the scope.
  ok("ux implies the all-sites scope", back.scope === "all");

  const bogus = decodeCase("#ux=" + encodeURIComponent("Not A Real Disease"), { validFindings, validEntities });
  ok("an unknown entity token is dropped", bogus.selectedEntity === undefined);
  ok("a dropped entity implies no scope", bogus.scope === undefined);

  ok("no entity means no ux key", !/ux=/.test(encodeCase({ tokens: new Set(["weak_leg@left"]) })));

  // px and ux describe DIFFERENT scopes and must both survive one URL.
  const both = decodeCase("#" + encodeCase({ selectedPathology: "Cardioembolism", selectedEntity: "Multiple sclerosis" }),
                          { validEntities });
  ok("px and ux coexist in one URL", both.selectedPathology === "Cardioembolism" && both.selectedEntity === "Multiple sclerosis");
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/case-url.test.js 2>&1 | grep -E "^FAIL|failed"
```

Expected: FAIL on `encodes the entity as ux=`.

- [ ] **Step 3: Write the implementation**

In `app/case-url.js`, add to `encodeCase` immediately after the `px` line:

```js
  if (state.selectedEntity) p.set("ux", state.selectedEntity);
```

Add to `decodeCase` immediately after the `px` block:

```js
  // `ux` is the CROSS-SITE entity named by the Together card — a different claim from `px`, which names a
  // pathology at ONE site, so the two are separate parameters and may both appear. `ux` has no meaning
  // outside the all-sites view, so its presence IS the scope; that is the parameter's definition, not an
  // inference. It degrades safely — a restored case with fewer than two sites never renders the combined
  // view at all, so the scope is simply unused.
  const ux = p.get("ux");
  if (ux && (!validEntities || validEntities.has(ux))) { out.selectedEntity = ux; out.scope = "all"; }
```

And add to the `opts` destructuring at the top of `decodeCase`, below `validPathologies`:

```js
  const validEntities = opts.validEntities || null;       // null = accept any entity name
```

In `app/app.js`, add below the `VALID_PATHOLOGIES` declaration (:58):

```js
// Every cross-site entity in the roster — a hand-edited ux= token that names no real entity is dropped on
// decode, exactly as px= is.
const VALID_ENTITIES = new Set(MULTIFOCAL.map(e => e.name));
```

Then in `restoreFromURL`, extend the `decodeCase` options and hydrate the two new fields:

```js
  const st = decodeCase(location.hash, { validFindings: VALID_FINDINGS, validSites: VALID_SITES, validPathologies: VALID_PATHOLOGIES, validEntities: VALID_ENTITIES });
```

and add after the `selectedPathology` line:

```js
  if (st.selectedEntity) S.selectedEntity = st.selectedEntity;
  if (st.scope) S.scope = st.scope;
```

No change is needed at the encode call site: `syncURL` passes the whole state object
(`const hash = encodeCase(S);`, app.js:76), so `S.selectedEntity` is picked up as soon as `encodeCase` reads
it. Task 3 Step 5 already moved that call below the validity gate.

- [ ] **Step 4: Run the test to verify it passes**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/case-url.test.js 2>&1 | tail -3
```

Expected: `0 failed`.

- [ ] **Step 5: Run the full suite**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test 2>&1 | tail -3
```

Expected: `0 failed`.

- [ ] **Step 6: Verify the round-trip in the browser**

Load the "Two lesions" example, switch to All sites, select an entity, copy the URL from the address bar,
open it in a fresh tab. The case must restore with the entity selected AND the scope already on "All sites".

- [ ] **Step 7: Commit**

```bash
git add app/case-url.js app/app.js test/case-url.test.js
git commit -m "feat(app): ux= round-trips the cross-site diagnosis

Validated against the MULTIFOCAL roster exactly as px= is validated against
CAUSES. ux implies scope=all, because the parameter has no meaning in any
other scope; it degrades safely when the restored case has under two sites.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Content round 2 — neoplastic, degenerative, congenital

**Files:**
- Modify: `src/data/multifocalNextSteps.js` (add 5 entries; update the REVIEW STATUS header)
- Modify: `test/multifocal-next-steps.test.js` (lower the ratchet)

**Interfaces:** unchanged — this task adds content only.

- [ ] **Step 1: Lower the ratchet so the suite fails**

In `test/multifocal-next-steps.test.js`, change:

```js
const ENTITY_WITHOUT_PLAN_CEILING = 8;
```

to:

```js
const ENTITY_WITHOUT_PLAN_CEILING = 3;
```

- [ ] **Step 2: Run test to verify it fails**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/multifocal-next-steps.test.js 2>&1 | grep -E "^FAIL|failed"
```

Expected: FAIL on `entities without a plan (8) is at or below the ceiling (3)`.

- [ ] **Step 3: Add the five plans**

In `src/data/multifocalNextSteps.js`, add these entries to `MULTIFOCAL_NEXT` after `"Mononeuritis multiplex"`:

```js
  "Metastases": mfPlan("Metastases", {
    firstLine: [
      "MRI BRAIN AND WHOLE SPINE WITH CONTRAST — multiple sites means whole-neuraxis imaging, and cord compression is the finding that changes management within hours",
      "CT chest, abdomen and pelvis for the primary and the burden of disease",
      "Bloods including calcium, liver function and clotting",
      "Ask about and EXAMINE FOR the primary — breast, skin, prostate, testis; the examination that finds it is often the one nobody did",
    ],
    confirmatory: [
      "TISSUE from the most accessible site — a peripheral node or a skin lesion long before a craniotomy",
      "FDG-PET where the primary remains unknown after cross-sectional imaging",
      "Tumour markers and receptor status once the primary is identified — they change the treatment entirely",
    ],
    monitoring: [
      "Corticosteroids for symptomatic oedema, at the shortest effective course, with gastric protection considered",
      "Seizure risk with cortical deposits — counsel explicitly about driving",
      "Involve oncology and palliative care in parallel, not in sequence",
    ],
    urgency: "emergency",
    referral: "Oncology urgently; neurosurgery or spinal surgery same-day if there is cord compression.",
  }),

  "Leptomeningeal disease": mfPlan("Leptomeningeal disease", {
    firstLine: [
      "MRI BRAIN AND WHOLE SPINE WITH CONTRAST BEFORE the lumbar puncture — post-LP dural enhancement mimics the disease you are looking for",
      "LUMBAR PUNCTURE FOR CYTOLOGY with a large-volume sample; sensitivity rises substantially with repeat taps",
      "Record the opening pressure, cell count, protein and glucose — a low glucose with high protein and a lymphocytosis is the classic profile",
      "CT chest, abdomen and pelvis for the primary if it is not already known",
    ],
    confirmatory: [
      "CSF flow cytometry wherever lymphoma or leukaemia is possible",
      "REPEAT the cytology rather than accepting a single negative result — one negative tap does not exclude this",
      "Discuss intrathecal access and radiotherapy planning with oncology early",
    ],
    monitoring: [
      "Watch for hydrocephalus and for progressive cranial neuropathies",
      "Treat pain and delirium actively — this is a high-symptom-burden diagnosis",
      "Palliative care alongside oncology from the point of diagnosis",
    ],
    urgency: "emergency",
    referral: "Oncology / neuro-oncology urgently; neurosurgery if hydrocephalus develops.",
  }),

  "Primary CNS lymphoma": mfPlan("Primary CNS lymphoma", {
    firstLine: [
      "MRI brain and whole spine with contrast — homogeneously enhancing periventricular lesions crossing the corpus callosum are the pattern",
      "DO NOT GIVE CORTICOSTEROIDS BEFORE BIOPSY unless the patient is deteriorating from mass effect: steroids dissolve the lesion and the tissue diagnosis with it",
      "HIV test — it changes both the differential and the treatment",
      "Ophthalmology slit-lamp examination for vitreoretinal involvement, which can give the diagnosis without a brain biopsy",
    ],
    confirmatory: [
      "STEREOTACTIC BRAIN BIOPSY, arranged urgently and before any steroid",
      "Lumbar puncture with cytology and flow cytometry",
      "CT chest/abdomen/pelvis with testicular examination and ultrasound — systemic lymphoma with CNS spread is a different disease with a different treatment",
    ],
    monitoring: [
      "If steroids have already been given the lesion may vanish: flag this to the neurosurgeons explicitly, and time the biopsy to its return",
      "Monitor for raised intracranial pressure",
      "Haemato-oncology referral for a methotrexate-based regimen",
    ],
    urgency: "emergency",
    referral: "Neuro-oncology / haematology urgently; neurosurgery for the biopsy.",
  }),

  "Neurofibromatosis type 2": mfPlan("Neurofibromatosis type 2", {
    firstLine: [
      "MRI BRAIN WITH INTERNAL AUDITORY MEATUS VIEWS AND WHOLE SPINE, with contrast — bilateral vestibular schwannomas are the defining lesion, and spinal tumours are frequently silent",
      "Formal audiometry with speech discrimination, plus brainstem evoked responses",
      "Ophthalmology review for juvenile cataract and retinal hamartoma",
      "Examine the skin for schwannomas and take a family history across three generations",
    ],
    confirmatory: [
      "GENETIC TESTING with counselling arranged alongside it — mosaicism is common and changes what relatives are told",
      "Screening of first-degree relatives once the diagnosis is established",
      "Referral to a specialist multidisciplinary service: hearing-preservation strategy depends on the whole tumour burden, never on one lesion",
    ],
    monitoring: [
      "Serial imaging and audiometry on a planned interval rather than symptom-driven review",
      "Plan for hearing loss BEFORE it happens — communication strategy, and auditory brainstem implantation discussed while the cochlear nerve is intact",
      "Watch for brainstem compression, and for cord compression from spinal tumours",
    ],
    urgency: "urgent",
    referral: "Specialist NF2 multidisciplinary service; clinical genetics.",
  }),

  "Motor neurone disease (ALS)": mfPlan("Motor neurone disease (ALS)", {
    firstLine: [
      "EMG AND NERVE CONDUCTION STUDIES SAMPLING MULTIPLE REGIONS — bulbar, cervical, thoracic and lumbosacral — because the diagnosis is denervation in regions the examination has not yet declared",
      "MRI brain and the relevant cord levels to exclude the structural mimics: a cervical myelopathy with radiculopathy reproduces the mixed picture exactly",
      "Bloods: creatine kinase, thyroid function, B12, protein electrophoresis, and anti-GM1 antibodies where multifocal motor conduction block is possible",
      "RESPIRATORY FUNCTION INCLUDING ERECT AND SUPINE VITAL CAPACITY — a fall on lying flat indicates diaphragm weakness, and this is done at diagnosis rather than when the patient is breathless",
    ],
    confirmatory: [
      "Specialist neuromuscular review against the diagnostic criteria before the diagnosis is given",
      "Exclude the treatable mimics deliberately and by name — multifocal motor neuropathy, myasthenia, inclusion body myositis, Kennedy's disease",
      "Genetic testing with counselling where there is a family history or young onset",
    ],
    monitoring: [
      "Serial respiratory function with an early non-invasive ventilation discussion — the intervention with the clearest benefit",
      "Swallow and nutrition review, with gastrostomy discussed EARLY, while respiratory function still permits it safely",
      "Multidisciplinary clinic, advance care planning and carer support started at diagnosis rather than deferred",
    ],
    urgency: "urgent",
    referral: "Neurology — specialist MND / neuromuscular service, with early respiratory and palliative care involvement.",
  }),
```

Update the header line to:

```js
// REVIEW STATUS: round 1 (inflammatory / demyelinating) and round 2 (neoplastic / degenerative /
// congenital) — see the commit trail for each round's sign-off.
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/multifocal-next-steps.test.js 2>&1 | tail -3
```

Expected: `0 failed`, and the report reads `10 of 13 entities planned; 3 left`. Section 6 now runs for all
three colliding names — if any of them fails, the cross-site plan has been written too close to the
existing site plan and must be rewritten as a genuinely cross-site workup.

- [ ] **Step 5: Run the full suite and commit**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test 2>&1 | tail -3
git add src/data/multifocalNextSteps.js test/multifocal-next-steps.test.js
git commit -m "content(multifocal): round 2 — neoplastic, degenerative, congenital

Metastases, leptomeningeal disease, primary CNS lymphoma, NF2, MND.
Ratchet 8 -> 3.

Content AWAITING CLINICAL REVIEW.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

- [ ] **Step 6: STOP for clinical review** — as in Task 1, one round at a time.

---

### Task 6: Content round 3 — infective, vascular, paraneoplastic; retire the ratchet

**Files:**
- Modify: `src/data/multifocalNextSteps.js` (add 3 entries; final REVIEW STATUS header)
- Modify: `test/multifocal-next-steps.test.js` (replace the ratchet with a hard gate)

- [ ] **Step 1: Replace the ratchet with the hard gate so the suite fails**

In `test/multifocal-next-steps.test.js`, replace the whole section 7 block with:

```js
// --- 7: THE HARD GATE. Every roster entity has a plan. ---
// The ratchet retired here (13 -> 0 across three rounds). Its durable value starts now: a future entity
// added to MULTIFOCAL with no workup behind it fails this suite immediately. That is what keeps the
// Together card's rows behaving alike — a card where some rows select and some do not is the rejected
// mockup arriving through the back door.
{
  const missing = MULTIFOCAL.filter(e => !MULTIFOCAL_NEXT[e.name]).map(e => e.name);
  ok(`GATE: all ${MULTIFOCAL.length} cross-site entities have an authored workup`, missing.length === 0, missing.join(" | "));
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/multifocal-next-steps.test.js 2>&1 | grep -E "^FAIL|failed"
```

Expected: FAIL on `GATE: all 13 cross-site entities have an authored workup`, naming the three that are missing.

- [ ] **Step 3: Add the final three plans**

In `src/data/multifocalNextSteps.js`, add to `MULTIFOCAL_NEXT`:

```js
  "Neurosyphilis or HIV": mfPlan("Neurosyphilis or HIV", {
    firstLine: [
      "HIV TESTING AND SYPHILIS SEROLOGY (treponemal and non-treponemal together) — BOTH, in every case: they coexist, and each alters the other's course",
      "MRI brain and spine with contrast",
      "LUMBAR PUNCTURE with cell count, protein, CSF VDRL and treponemal testing — CSF VDRL is specific but insensitive, so a negative result does not exclude this",
      "CD4 count and HIV viral load where HIV is confirmed",
    ],
    confirmatory: [
      "CSF testing for the opportunistic infections that present the same way — JC virus PCR, toxoplasma, cryptococcal antigen, tuberculosis",
      "Ophthalmology and audiology review: ocular and otosyphilis are treated as neurosyphilis regardless of any other finding",
      "Sexual health services for partner notification and contact tracing",
    ],
    monitoring: [
      "Warn about and observe for the Jarisch-Herxheimer reaction when treatment starts",
      "Repeat CSF and serological testing at planned intervals to confirm the response",
      "Watch for immune reconstitution inflammatory syndrome after antiretroviral therapy begins",
    ],
    urgency: "urgent",
    referral: "Infectious diseases / sexual health, with neurology. Both are treatable — treat rather than observe.",
  }),

  "Embolic shower (cardiac or aortic source)": mfPlan("Embolic shower (cardiac or aortic source)", {
    firstLine: [
      "MRI BRAIN WITH DWI — scattered infarcts in MULTIPLE arterial territories OF THE SAME AGE is the finding that makes this diagnosis",
      "ECG plus PROLONGED cardiac rhythm monitoring — a single ECG does not exclude paroxysmal atrial fibrillation",
      "ECHOCARDIOGRAPHY, transoesophageal where the transthoracic study is unrevealing: vegetations, thrombus, aortic arch atheroma and a right-to-left shunt all live there",
      "BLOOD CULTURES BEFORE ANTIBIOTICS, with inflammatory markers — infective endocarditis is the source you must not miss",
    ],
    confirmatory: [
      "CT or MR angiography of the aortic arch and neck vessels for a proximal source",
      "Bubble study for a right-to-left shunt where no other source is found, particularly in a younger patient",
      "Screen for malignancy and for a hypercoagulable state once cultures and cardiac imaging are clear — non-bacterial thrombotic endocarditis presents exactly this way",
    ],
    monitoring: [
      "WITHHOLD ANTICOAGULATION until endocarditis is excluded — anticoagulating an infected embolus causes haemorrhage",
      "Serial neurological observation: the process is ongoing, and further emboli are expected rather than surprising",
      "Secondary prevention is decided by the SOURCE, not by the infarct pattern",
    ],
    urgency: "emergency",
    referral: "Stroke team with cardiology; infectious diseases urgently if endocarditis is possible.",
  }),

  "Paraneoplastic syndrome": mfPlan("Paraneoplastic syndrome", {
    firstLine: [
      "PARANEOPLASTIC AND NEURONAL SURFACE ANTIBODY PANELS IN SERUM AND CSF TOGETHER — the panels differ between the two compartments, and a serum-only request misses cases",
      "MRI brain and spine with contrast — medial temporal signal change supports limbic encephalitis, but normal imaging does not exclude the diagnosis",
      "CT chest, abdomen and pelvis as the first search for the tumour",
      "Lumbar puncture: cell count, protein, oligoclonal bands and cytology",
    ],
    confirmatory: [
      "FDG-PET when cross-sectional imaging is negative — the tumour is often small, and the neurological syndrome precedes it",
      "Antibody-directed targeted search: examine the testes, image the pelvis and breasts, according to the antibody found",
      "REPEAT the tumour search at intervals if the first is negative — one negative screen does not exclude an occult malignancy",
    ],
    monitoring: [
      "Treating the tumour is the definitive treatment for the neurological syndrome; immunotherapy alone rarely holds",
      "Monitor for seizures and for the psychiatric and cognitive features, which are readily attributed elsewhere",
      "Neurological recovery lags tumour treatment — set expectations accordingly",
    ],
    urgency: "urgent",
    referral: "Neurology / neuroimmunology and oncology in parallel.",
  }),
```

Update the header to:

```js
// REVIEW STATUS: all 13 entities authored across three rounds — see the commit trail for each round's
// sign-off. Content added from here is held to the same bar.
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/multifocal-next-steps.test.js 2>&1 | tail -3
```

Expected: `0 failed`.

- [ ] **Step 5: Run the full suite and commit**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test 2>&1 | tail -3
git add src/data/multifocalNextSteps.js test/multifocal-next-steps.test.js
git commit -m "content(multifocal): round 3 — THE ENTITY SET IS CLOSED. Ratchet retires.

Neurosyphilis/HIV, embolic shower, paraneoplastic syndrome. 13 of 13 entities
now carry an authored cross-site workup, so the ratchet becomes a hard gate: a
future roster entity with no plan behind it fails the suite immediately.

Content AWAITING CLINICAL REVIEW.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

- [ ] **Step 6: STOP for clinical review.**

---

### Task 7: Verify end-to-end and update the documentation

**Files:**
- Modify: `CLAUDE.md` (new section; close open item 3 in the per-pathology list)
- Modify: `docs/superpowers/specs/2026-08-21-together-card-cross-site-workup-design.md` (§4.3 amendment)

- [ ] **Step 1: Run the full suite one final time**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test 2>&1 | grep -E "passed, [0-9]+ failed" | grep -v ", 0 failed"; echo "clean=$?"
```

Expected: no output before `clean=1` — i.e. no suite reports a non-zero failure count.

- [ ] **Step 2: Drive every entity in the browser**

With the server running, load the "Two lesions" example, switch to All sites, and click through **every**
row the Together card offers (concordant and the discordant band both). For each: the chip names it, the
second first-line group appears, and the urgency pill never drops below what the unselected card showed.

- [ ] **Step 3: Amend the spec's §4.3**

The implementation replaced the enumerated clears with one validity gate. Record it. In
`docs/superpowers/specs/2026-08-21-together-card-cross-site-workup-design.md`, replace the two bullets under
**### 4.3 Lifecycle** with:

```markdown
Implemented as ONE validity gate at render time (`pruneSelectedEntity`) rather than as clears scattered
through the handlers: the selection survives exactly as long as the Together card still offers it.

- **Cleared** when the selected entity no longer appears among the Together card's rows, which subsumes the
  cases that would otherwise each need their own clear — fewer than two sites, a findings edit that stops
  the entity firing, a re-pin onto a pair it does not fit.
- **Preserved** across scope-toggle flips, and across a findings edit that leaves the entity STILL FIRING —
  the claim is still on offer and still true, so dropping it would be busywork for the reader. This is the
  one deliberate difference from the design as first written, which said "cleared on any findings change".
```

- [ ] **Step 4: Add the CLAUDE.md section**

Append this after the "Pathology tranche 2" section, substituting the real suite and assertion counts from
Step 1 where marked:

```markdown
## Together card — the cross-site workup (DONE 2026-08-21)

**What it fixes.** The Together card named the disease spanning the sites and the Next card below it still
showed the union of two site workups — so a multifocal MS picture never surfaced the lumbar puncture that
settles it. Tranche 1 had switched per-pathology selection off in the combined view because *"whose
pathology?" has no honest answer across a multifocal set*; the multi-location DDx layer since made that
answerable, and this closes the gap.

**`src/data/multifocalNextSteps.js` is content-only** — imports nothing from the UI, nothing from
`nextSteps.js` — keyed by entity name, **13 of 13 entities authored** across three reviewed rounds.
**SITE-INDEPENDENT BY CONSTRUCTION: no `slots`, no `bySite`.** That is why these plans are NOT in
`src/data/pathology/`, whose plans key on a per-site cause name and interpolate per-site anatomy — and why
`PATHOLOGY_NEXT` keeps one kind of key, which the RED GATE test depends on.

**THE TIER SPLIT DIFFERS FROM TRANCHE 1's, deliberately.** Immediate stays the site union. **First-line is
ADDITIVE, not frozen** — `investigations` is untouched and the entity's own tests ride alongside in
`entityFirstLine`, rendered as a second labelled group. Freezing it (strict tranche-1 parity) would mean the
MS plan could never order the LP and the vasculitis plan never ESR/CRP, because those live in first-line;
replacing it would lose the site union's safety floor. Confirmatory, monitoring and referral become the
entity's.

**THE SITE UNION IS AN URGENCY FLOOR, never a ceiling** — the same shape as `resolveUrgency()`'s red floor.
Selecting a cross-site disease cannot de-escalate a picture containing an emergency-badged site.

**NO CROSS-SITE FALLBACK STATE EXISTS.** There is no equivalent of `pathologyCurated: false` and no
"General plan — not specific to X" label, because the hard gate guarantees every entity has a plan. Do not
add one as a convenience: it is the seam through which "some rows behave differently from others" returns.

**The Together card is the ONLY entry point** (chosen from mockups against two alternatives). The What
card's shared-cause and remainder rows stay inert in the all-sites view. Putting the click on a shared-cause
row was rejected because clicking *"Demyelination (MS)"* would light up *"Multiple sclerosis"* one card
above — the row you click is not the label you get — and because whether a shared row clicked at all would
depend on something invisible (does its name canonicalise?).

**`S.selectedEntity` IS A SEPARATE FIELD FROM `S.selectedPathology`, and this is forced, not stylistic:
four entity names are ALSO verbatim per-site cause names** — *Motor neurone disease (ALS)*, *Multiple
sclerosis*, *Neurosarcoidosis*, *Neurofibromatosis type 2*. One string field cannot say whether
`"Neurosarcoidosis"` means the disease at this site or the disease across these sites.

**ONE VALIDITY GATE, not four scattered clears.** `pruneSelectedEntity()` drops the selection the moment the
Together card stops offering the entity — which subsumes fewer-than-two-sites, a findings edit that stops it
firing, and a re-pin onto a pair it does not fit. A findings edit that leaves the entity STILL FIRING keeps
the selection deliberately. `syncURL()` had to move BELOW the `togetherCard()` call, because the hash is the
shareable case and the gate lives inside that call.

**Case URL `ux=`**, validated against the roster exactly as `px=` is validated against `CAUSES`. **`ux`
implies scope `all`** — the parameter has no meaning in any other scope — and degrades safely when the
restored case has under two sites. `S.scope` still does not round-trip on its own; that gap is pre-existing
and deliberately untouched.

**THE HARD GATE.** `test/multifocal-next-steps.test.js` asserts every `MULTIFOCAL` entity has a plan. The
ratchet ran 13 → 8 → 3 → 0 across the three authoring rounds and retired into the gate, the same shape as
tranche 2's red ratchet. Its durable value starts now: a future roster entity added with no workup behind it
fails the suite immediately, and that is what keeps every row in the card behaving alike.

**No new CSS.** The selected row reuses `.cause.sel` and the chip reuses `.px-chip`, both already on the
`--terra` allowlist — the selected cross-site diagnosis IS the answer the Next card is about.

> **Clinical review status:** authored in three rounds (inflammatory/demyelinating; neoplastic/degenerative/
> congenital; infective/vascular/paraneoplastic), each presented to the owner separately rather than batched.
> Record the sign-off date here once given.

<!-- Substitute the real numbers from the final `npm test` run: -->
NN suites / NNNN assertions green. Spec/plan:
`docs/superpowers/specs/2026-08-21-together-card-cross-site-workup-design.md`,
`docs/superpowers/plans/2026-08-21-together-card-cross-site-workup.md`.
```

Then change open item 3 in the per-pathology "STILL OPEN" list from a live item to a closed one:

```markdown
3. ~~**`combinedNextSteps` / the Together card**~~ — **CLOSED 2026-08-21.** See the cross-site workup
   section below.
```

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md docs/superpowers/specs/2026-08-21-together-card-cross-site-workup-design.md
git commit -m "docs: record the cross-site workup layer; close open item 3

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

- [ ] **Step 6: Finish the branch**

Use the `superpowers:finishing-a-development-branch` skill to decide between merge, PR, or further work.
The owner's established rhythm on this repo is a PR per increment (`gh pr create`), reviewed and merged,
with `origin/main` auto-deploying to Pages on push.

---

## Notes for the implementer

- **`gh` is installed and authenticated, but is not on this shell's PATH** in every session. If `gh` is not
  found, the branch can still be pushed with `git push -u origin feat/together-cross-site-workup` and the PR
  opened in the browser.
- **The visual companion server** from the design session may still be running on a high port with files
  under `.superpowers/brainstorm/`. That directory is gitignored; leave it alone.
- **Do not touch `src/data/multifocal.js`.** The roster's matching predicates are signed-off clinical
  content and this work does not need to change them.

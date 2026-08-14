# Multi-location DDx Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** implemented 2026-08-14. Spec: `docs/superpowers/specs/2026-08-14-multi-location-ddx-design.md`.

**Goal:** When a picture needs more than one lesion, answer *what single disease hits both of these places* — with a curated cross-site entity roster, merged causes and workup, manual pinning of a pair, and a parsimony guard that names the finding forcing the second lesion.

**Architecture:** Four new files keep content and logic apart: `src/data/multifocal.js` holds the ~13 entities as declarative data with no logic (so it can be clinically reviewed on its own), `src/engine/multifocal.js` holds the matching and ranking with no content, `src/model/compartments.js` adds a level→compartment axis, `src/model/course.js` adds the course vocabulary. Entity predicates are over **anatomical attributes, never site ids**. Hard anatomical constraints filter; tempo and course only demote into a labelled collapsible band. The app stays a pure consumer.

**Tech Stack:** Zero-dependency ES modules, Node v24, no build step, no test framework. Each test file is a standalone script with a local `ok()` helper.

## Global Constraints

- **Node is not on PATH.** Every command must be prefixed: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"`. Do not re-diagnose "node not found".
- **Zero dependencies.** No `npm install`, no `node_modules`, no build step, no linter. `"type": "module"`.
- **Every new test suite** must be added to the `test` script in `package.json` **and** to the README's suite list.
- **House test style:** standalone script; `let pass = 0, fail = 0; const log = [];` plus `function ok(label, cond, detail = "")`; print `PASS`/`FAIL` lines; `process.exit(fail === 0 ? 0 : 1)`. Copy the header shape from `test/causes-depth.test.js`.
- **Derive, don't store.** Never write `if (hasX && hasY) return "someSyndrome"`. Predicates are over attributes.
- **`app/` is a pure consumer** of the engine. No model changes from app tasks.
- **Build every test probe from `expectedFindings()` of a real site**, never from hand-typed finding tokens. An unmodelled token is silently non-localising and will fake either failure mode. This mistake produced a false bug report during design.
- **Clinical content norm:** cause lists, red flags and bedside signs must be clinically sound; `pathognomonic`/`confirm` are bedside signs, never investigations. Flag anything uncertain for the owner (a clinician) to review.
- **Existing vocabularies to reuse, verbatim:** `TEMPO` ids `hyperacute · acute · subacute · chronic`; `LIKELIHOOD` = `["common", "uncommon", "rare"]`; urgency values `emergency · urgent · routine`; `CATEGORIES` ids include `vascular inflammatory neoplastic infective metabolic traumatic iatrogenic degenerative congenital mimic`.
- **Run the full suite before every commit:** `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`. Baseline is **3330 assertions / 55 suites green**.

## File Structure

| File | Responsibility |
|---|---|
| `src/model/compartments.js` (new) | `COMPARTMENTS`, `LEVEL_COMPARTMENT` table, `compartmentOf(site)`. Sole source of truth for "which compartment is this level in", including intracranial. |
| `src/model/course.js` (new) | `COURSES` vocabulary + labels. Nothing else. |
| `src/data/multifocal.js` (new) | `mf()` constructor, `FINDING_CLASSES` map, `MULTIFOCAL` roster. **Content only, no logic.** |
| `src/engine/multifocal.js` (new) | `unifyingDiagnoses()`, `forcingFindings()`. **Logic only, no content.** |
| `src/engine/score.js` (modify) | `LOCALISING` promotions + new `NOT_LOCALISING_BY_DESIGN` map. Export both. |
| `src/engine/inverse.js` (modify) | `INTRACRANIAL_LEVELS` derived from `compartments.js`. |
| `src/data/causes.js` (modify) | `causesFor()` demotes instead of dropping; add `combinedCauses()`. |
| `src/data/nextSteps.js` (modify) | Add `combinedNextSteps()`. |
| `app/app.js`, `app/index.html`, `app/case-url.js` (modify) | Course control, pinning, Together card, scope toggle. |
| `test/multifocal.test.js` (new) | Roster invariants, emergence, demotion, forcing-finding property test, murky-input regression set. |
| `test/localising-audit.test.js` (new) | Every single-level finding is localising or explicitly excused. |

---

### Task 1: Compartment axis

**Files:**
- Create: `src/model/compartments.js`
- Create: `test/compartments.test.js`
- Modify: `src/engine/inverse.js:79-85` (replace the literal `INTRACRANIAL_LEVELS` set)
- Modify: `package.json` (test chain), `README.md` (suite list)

**Interfaces:**
- Consumes: `candidateSites()` from `src/engine/inverse.js`
- Produces: `COMPARTMENTS` (array of ids), `LEVEL_COMPARTMENT` (object level→compartment id), `compartmentOf(site) -> string`, `INTRACRANIAL_COMPARTMENTS` (Set of compartment ids that sit inside the skull)

- [ ] **Step 1: Write the failing test**

Create `test/compartments.test.js`:

```js
// compartments.test.js — the level -> compartment axis.
//
// regionOf() in causes.js lumps brain and cord together as `parenchyma`, but brain-plus-cord is exactly
// the dissemination MS must demonstrate. This is the finer axis the multifocal roster predicates over.
// It is also the single source of truth for "inside the skull" (INTRACRANIAL_LEVELS derives from it).
//
// Spec: docs/superpowers/specs/2026-08-14-multi-location-ddx-design.md §1
// Run: node test/compartments.test.js
import { COMPARTMENTS, LEVEL_COMPARTMENT, compartmentOf, INTRACRANIAL_COMPARTMENTS } from "../src/model/compartments.js";
import { candidateSites, INTRACRANIAL_LEVELS } from "../src/engine/inverse.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond, detail = "") { log.push({ label, ok: !!cond, detail }); cond ? pass++ : fail++; }

const SITES = candidateSites();

// --- 1: total coverage — nothing may fall through ---
{
  const unmapped = [...new Set(SITES.map(s => s.level))].filter(l => !LEVEL_COMPARTMENT[l]);
  ok(`every site level maps to a compartment (${unmapped.length} unmapped)`, unmapped.length === 0, unmapped.join(", "));
}
{
  const bad = [...new Set(Object.values(LEVEL_COMPARTMENT))].filter(cmp => !COMPARTMENTS.includes(cmp));
  ok(`every mapped compartment is declared in COMPARTMENTS (${bad.length} undeclared)`, bad.length === 0, bad.join(", "));
}

// --- 2: the distinctions the roster depends on ---
{
  const cordSite = SITES.find(s => s.level === "cord");
  const cortexSite = SITES.find(s => s.level === "cortex");
  ok("brain and cord are DIFFERENT compartments (MS dissemination depends on it)",
     compartmentOf(cortexSite) !== compartmentOf(cordSite));
  ok("cortex is the `brain` compartment", compartmentOf(cortexSite) === "brain");
  ok("cord is the `cord` compartment", compartmentOf(cordSite) === "cord");
  const nerveSite = SITES.find(s => s.level === "nerve");
  ok("a named nerve is the `nerve` compartment", compartmentOf(nerveSite) === "nerve");
}

// --- 3: INTRACRANIAL_LEVELS is now DERIVED, and did not change ---
// This is the regression guard on the refactor: the raised-pressure axis must behave identically.
{
  const EXPECTED = ["midbrain", "pons", "medulla", "brainstem", "pontomesencephalic", "dorsal_midbrain",
    "parinaud", "locked_in", "pseudobulbar", "guillain_mollaret", "central_vestibular", "cortex",
    "subcortex", "cerebrum", "corpus_callosum", "aphasia_subcortical", "thalamus", "thalamus_arousal",
    "hypothalamus", "basal_ganglia", "cerebellum", "visual_pathway", "olfactory", "craniocervical_junction"];
  const missing = EXPECTED.filter(l => !INTRACRANIAL_LEVELS.has(l));
  ok(`derived INTRACRANIAL_LEVELS still contains all 24 original levels (${missing.length} missing)`,
     missing.length === 0, missing.join(", "));
  ok("cord is NOT intracranial", !INTRACRANIAL_LEVELS.has("cord"));
  ok("nerve is NOT intracranial", !INTRACRANIAL_LEVELS.has("nerve"));
  ok("INTRACRANIAL_COMPARTMENTS is a Set of declared compartments",
     [...INTRACRANIAL_COMPARTMENTS].every(cmp => COMPARTMENTS.includes(cmp)));
}

for (const l of log) console.log(`${l.ok ? "PASS" : "FAIL"}  ${l.label}${l.detail && !l.ok ? `  [${l.detail}]` : ""}`);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run it to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/compartments.test.js`
Expected: FAIL — `Cannot find module '.../src/model/compartments.js'`

- [ ] **Step 3: Create the compartment table**

Create `src/model/compartments.js`:

```js
// compartments.js — the level -> COMPARTMENT axis.
//
// `regionOf()` in causes.js splits sites five ways for choosing a workup flavour, but it lumps brain and
// cord together as `parenchyma`. The multifocal roster needs them apart: "disseminated in space" for MS
// means brain AND cord, and a predicate that cannot tell them apart cannot express it.
//
// This is also the SINGLE SOURCE OF TRUTH for "inside the skull" — inverse.js derives INTRACRANIAL_LEVELS
// from it rather than keeping a second overlapping list.
//
// Spec: docs/superpowers/specs/2026-08-14-multi-location-ddx-design.md §1

export const COMPARTMENTS = [
  "brain", "brainstem", "cerebellum", "cord", "cauda",
  "optic", "skull_base", "root", "plexus", "nerve", "motor_unit",
];

// Every level produced by candidateSites() must appear here (asserted in test/compartments.test.js).
export const LEVEL_COMPARTMENT = {
  // --- supratentorial ---
  cortex: "brain", subcortex: "brain", cerebrum: "brain", corpus_callosum: "brain",
  aphasia_subcortical: "brain", thalamus: "brain", thalamus_arousal: "brain",
  hypothalamus: "brain", basal_ganglia: "brain", olfactory: "brain",
  // --- brainstem (incl. the composite/functional brainstem levels) ---
  midbrain: "brainstem", pons: "brainstem", medulla: "brainstem", brainstem_aras: "brainstem",
  pontomesencephalic: "brainstem", dorsal_midbrain: "brainstem", parinaud: "brainstem",
  locked_in: "brainstem", pseudobulbar: "brainstem", guillain_mollaret: "brainstem",
  central_vestibular: "brainstem", craniocervical_junction: "brainstem",
  // --- cerebellum ---
  cerebellum: "cerebellum",
  // --- cord and below ---
  cord: "cord", combined_degeneration: "cord", conus: "cord",
  cauda: "cauda",
  // --- visual + pupil + sympathetic axes ---
  visual_pathway: "optic", pupil: "optic",
  sympathetic: "skull_base",
  // --- skull base / peripheral vestibular ---
  skull_base: "skull_base", peripheral_vestibular: "skull_base",
  // --- peripheral nervous system ---
  root: "root", plexus: "plexus", nerve: "nerve", polyneuropathy: "nerve",
  motor_unit: "motor_unit",
};

// Which compartments sit inside the skull. `cord` and everything distal are excluded — that is exactly
// what the raised-pressure (papilloedema) axis means when it says "inside the skull".
export const INTRACRANIAL_COMPARTMENTS = new Set(["brain", "brainstem", "cerebellum", "optic"]);

export function compartmentOf(site) {
  return LEVEL_COMPARTMENT[site.level] || null;
}
```

> **NOTE on `sympathetic` and `peripheral_vestibular`:** both are mapped to `skull_base` because their
> sites lie in bony corridors rather than in the neuraxis proper, and neither is intracranial for the
> purposes of the pressure axis (matching the current `INTRACRANIAL_LEVELS`, which omits both). Do not
> "fix" this to `brain`.

- [ ] **Step 4: Derive `INTRACRANIAL_LEVELS` from the table**

In `src/engine/inverse.js`, add to the imports at the top of the file:

```js
import { LEVEL_COMPARTMENT, INTRACRANIAL_COMPARTMENTS } from "../model/compartments.js";
```

Then replace the literal set at lines 79-85 with:

```js
// DERIVED from the compartment table (compartments.js) so there is exactly one definition of "inside the
// skull". Previously a hand-listed set here, which was a second source of truth waiting to drift.
export const INTRACRANIAL_LEVELS = new Set(
  Object.entries(LEVEL_COMPARTMENT)
    .filter(([, cmp]) => INTRACRANIAL_COMPARTMENTS.has(cmp))
    .map(([level]) => level)
);
```

- [ ] **Step 5: Run the new suite to verify it passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/compartments.test.js`
Expected: PASS on all assertions, `0 failed`

- [ ] **Step 6: Register the suite**

In `package.json`, add ` && node test/compartments.test.js` to the `test` script, immediately after `node test/fundus.test.js`.

In `README.md`, add to the suite list next to the other model suites:

```
node test/compartments.test.js  # level -> compartment axis; INTRACRANIAL_LEVELS derives from it
```

- [ ] **Step 7: Run the FULL suite — the pressure axis is the thing at risk**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: `0 failed` in every suite, including `test/fundus.test.js` (which guards the papilloedema axis).

If `fundus.test.js` fails, a level was dropped from or added to the intracranial set — diff the derived set against the 24-level list in Step 1's test rather than editing the test.

- [ ] **Step 8: Commit**

```bash
git add src/model/compartments.js test/compartments.test.js src/engine/inverse.js package.json README.md
git commit -m "feat(model): level->compartment axis; INTRACRANIAL_LEVELS now derives from it"
```

---

### Task 2: `LOCALISING` audit

**Files:**
- Modify: `src/engine/score.js:16-46` (the `LOCALISING` set; export it and the new map)
- Create: `test/localising-audit.test.js`
- Modify: `package.json`, `README.md`

**Interfaces:**
- Consumes: `compartmentOf` is **not** needed here; uses `candidateSites()` + `expectedFindings()`
- Produces: `LOCALISING` (already exported), `NOT_LOCALISING_BY_DESIGN` (new export: object findingId → reason string)

> **⚠ CLINICAL SIGN-OFF REQUIRED BEFORE MERGE.** This task changes localisation behaviour: promoting a
> finding raises its match weight from 1 to 3 **and** lets it force a second lesion. The promote/excuse
> split below is a recommendation and must be confirmed by the owner (a clinician). Present the two lists
> at review.

- [ ] **Step 1: Write the failing test**

Create `test/localising-audit.test.js`:

```js
// localising-audit.test.js — nothing may fall through the LOCALISING net silently.
//
// LOCALISING (score.js) gates everything downstream: the cover in minimalSet(), coversAllLocalising(),
// and what nearFit() refuses to relax. A finding missing from it can never force a second lesion.
// It was hand-curated, and the fundoscopy findings added in the 2026-08-11 increment appear to have been
// missed — so this suite makes the omission impossible to repeat.
//
// A PURE COUNT RULE WOULD BE WRONG IN BOTH DIRECTIONS: limb_ataxia spans 7 levels / 24 sites and is
// correctly localising (it pins a SYSTEM, not a level), while lmn_weakness sits at 2 levels and is
// deliberately NOT localising. So the rule is: every SINGLE-LEVEL finding must be either localising or
// explicitly excused WITH A REASON.
//
// Spec: docs/superpowers/specs/2026-08-14-multi-location-ddx-design.md §9
// Run: node test/localising-audit.test.js
import { LOCALISING, NOT_LOCALISING_BY_DESIGN } from "../src/engine/score.js";
import { candidateSites } from "../src/engine/inverse.js";
import { expectedFindings } from "../src/engine/forward.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond, detail = "") { log.push({ label, ok: !!cond, detail }); cond ? pass++ : fail++; }

// Build finding -> distinct levels, from the FORWARD MODEL (never from hand-typed tokens).
const levelsOf = {};
for (const site of candidateSites()) {
  let exp; try { exp = expectedFindings(site); } catch { continue; }
  for (const tok of exp) {
    const id = tok.split("@")[0];
    (levelsOf[id] ||= new Set()).add(site.level);
  }
}

const singleLevel = Object.keys(levelsOf).filter(id => levelsOf[id].size === 1);

// --- 1: THE INVARIANT ---
{
  const orphans = singleLevel.filter(id => !LOCALISING.has(id) && !NOT_LOCALISING_BY_DESIGN[id]);
  ok(`every single-level finding is localising or explicitly excused (${orphans.length} orphans)`,
     orphans.length === 0, orphans.join(", "));
}

// --- 2: every excusal carries a REASON, and is not also localising ---
{
  const noReason = Object.keys(NOT_LOCALISING_BY_DESIGN).filter(id => !String(NOT_LOCALISING_BY_DESIGN[id]).trim());
  ok(`every deliberate exclusion states a reason (${noReason.length} blank)`, noReason.length === 0, noReason.join(", "));
  const both = Object.keys(NOT_LOCALISING_BY_DESIGN).filter(id => LOCALISING.has(id));
  ok(`no finding is both localising and excused (${both.length})`, both.length === 0, both.join(", "));
}

// --- 3: the two documented exclusions survive (they are clinical judgements, not oversights) ---
{
  ok("lmn_weakness stays NON-localising (a general LMN sign, demoted in the PNS increment)",
     !LOCALISING.has("lmn_weakness") && !!NOT_LOCALISING_BY_DESIGN.lmn_weakness);
  ok("naming_impaired stays NON-localising (present in every aphasia)",
     !LOCALISING.has("naming_impaired") && !!NOT_LOCALISING_BY_DESIGN.naming_impaired);
}

// --- 4: the fundoscopy findings are now localising (the gap that motivated this audit) ---
{
  ok("retinal_pallor is localising", LOCALISING.has("retinal_pallor"));
  ok("optic_atrophy is localising", LOCALISING.has("optic_atrophy"));
  ok("fasciculations is localising (anterior horn)", LOCALISING.has("fasciculations"));
}

// --- 5: multi-level SYSTEM signs are untouched — proof the rule was not applied as a count threshold ---
{
  ok("limb_ataxia is still localising despite spanning many levels", LOCALISING.has("limb_ataxia"));
  ok("limb_ataxia really does span >1 level", levelsOf.limb_ataxia.size > 1);
  ok("forehead_spared is still localising despite spanning many levels", LOCALISING.has("forehead_spared"));
}

for (const l of log) console.log(`${l.ok ? "PASS" : "FAIL"}  ${l.label}${l.detail && !l.ok ? `  [${l.detail}]` : ""}`);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run it to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/localising-audit.test.js`
Expected: FAIL — `NOT_LOCALISING_BY_DESIGN` is not exported (import is `undefined`), and the orphan assertion fails listing ~19 findings.

- [ ] **Step 3: Export `LOCALISING` and add the promotions**

In `src/engine/score.js`, change `const LOCALISING = new Set([` to `export const LOCALISING = new Set([` (it is currently module-private and re-declared for export elsewhere; verify with `grep -n "LOCALISING" src/engine/*.js` and keep the existing export shape if one already exists).

Add these entries inside the `LOCALISING` set, as a clearly commented block before the closing `]);`:

```js
  // --- 2026-08-14 LOCALISING audit (spec §9) ---
  // Findings confined to a single level that were never added to this set. The fundoscopy pair arrived
  // with the 2026-08-11 increment and was missed; the rest predate it. Promoting a finding raises its
  // match weight 1 -> 3 and lets it force a second lesion, so each of these is a clinical judgement that
  // the sign genuinely pins a place.
  "retinal_pallor",            // CRAO retinal whitening — pins the retina
  "optic_atrophy",             // disc pallor — pins the optic nerve / anterior visual pathway
  "fasciculations",            // anterior horn
  "cortical_sensory_arm", "cortical_sensory_leg", "cortical_sensory_hand", // cortical sensory loss pins parietal cortex
  "weak_hand",                 // cortical hand-knob (pseudo-peripheral cortical hand)
  "weak_scapular_stabilisation", // long thoracic / scapular winging
  "lid_retraction",            // Collier's sign — dorsal midbrain
  "verbal_memory_impairment", "nonverbal_memory_impairment", // dominant vs non-dominant temporal/thalamic
  "rigidity",                  // basal ganglia
  "disinhibition",             // orbitofrontal
  "executive_dysfunction",     // dorsolateral prefrontal
  "palmomental",               // frontal release
```

- [ ] **Step 4: Add the excusal map**

In `src/engine/score.js`, immediately after the `LOCALISING` set's closing `]);`, add:

```js
// Findings that are confined to a single level in the MODEL but are deliberately NOT localising, each with
// the reason. This replaces prose comments that a future edit can miss: test/localising-audit.test.js
// asserts that every single-level finding is either in LOCALISING or here, so nothing can fall through
// silently the way the fundoscopy findings did.
export const NOT_LOCALISING_BY_DESIGN = {
  lmn_weakness: "A GENERAL lower-motor-neurone sign — anterior horn, root, plexus and nerve all cause flaccid areflexic weakness, so it marks LMN-ness, not level. Demoted in the PNS increment.",
  naming_impaired: "Present in EVERY aphasia, so it identifies aphasia rather than which language area is hit. The localisers are speech_nonfluent / comprehension_impaired / repetition_impaired.",
  proximal_weakness: "A PATTERN, not a level — myopathy, NMJ disease and some neuropathies all produce it. Same reasoning as lmn_weakness.",
  distal_motor_weakness: "A length-dependent PATTERN shared by every distal neuropathy; the level comes from the accompanying sensory findings, not from this sign.",
  hallucinations: "Far commoner in delirium, drug effect and psychiatric illness than in focal lesions — a poor localiser at the bedside despite being modelled at one level.",
  mood_change: "Non-specific; produced by diffuse, systemic and psychiatric processes as readily as by a focal lesion.",
};
```

- [ ] **Step 5: Run the audit suite to verify it passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/localising-audit.test.js`
Expected: PASS, `0 failed`

- [ ] **Step 6: Register the suite, then run the FULL suite**

Add ` && node test/localising-audit.test.js` to `package.json`'s `test` script after `node test/compartments.test.js`, and a matching line to the README suite list.

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`

**Expect failures here — this is the point of the task.** Fifteen promotions change scoring weights and ranking. For each failure, decide whether the assertion encoded the *old thin behaviour* or a *real invariant*:
- If a ranking assertion now prefers a different site **because a genuinely localising sign is finally weighted**, re-pin the assertion to its real intent (the Region B precedent) and note it in the commit message.
- If a site that should win now loses, the promotion was wrong — remove it and add it to `NOT_LOCALISING_BY_DESIGN` with a reason instead.

Do **not** weaken an assertion to make it pass. List every restated assertion in the commit body.

- [ ] **Step 7: Commit**

```bash
git add src/engine/score.js test/localising-audit.test.js package.json README.md
git commit -m "fix(score): LOCALISING audit — 15 single-level findings promoted, 6 excused with reasons

Every single-level finding must now be either LOCALISING or explicitly excused
(test/localising-audit.test.js). The fundoscopy findings from 2026-08-11 had
never been added. Restated assertions are listed below.

Spec: docs/superpowers/specs/2026-08-14-multi-location-ddx-design.md §9"
```

---

### Task 3: Tempo demotes instead of dropping

**Files:**
- Modify: `src/data/causes.js:3096-3103` (`causesFor()`)
- Modify: `app/app.js:347-372` (`whatBlock()`)
- Modify: `test/causes.test.js` (restate tempo assertions)

**Interfaces:**
- Produces: `causesFor(site, { onset })` returns `{ byCategory, demoted, all, onset, derived, source }` — **new `demoted` key**; `byCategory` contains only tempo-concordant causes, `demoted` is an array of `{ ...cause, demotion: { axis: "tempo", entered, expected } }`.

- [ ] **Step 1: Write the failing test**

Append to `test/causes.test.js`, before the final `for (const l of log)` reporting block:

```js
// --- tempo DEMOTES, never DROPS (2026-08-14, owner ruling) ---
// A tempo mismatch used to delete the cause from the output. Content vanishing without saying why is the
// same failure the sieve sweep fixed, in reverse — so a mismatch now demotes into a labelled band.
{
  const site = candidateSites().find(s => s.id === "left_medulla_lateral");
  const all = causesFor(site, {});
  const chronic = causesFor(site, { onset: "chronic" });
  const shown = chronic.byCategory.reduce((n, g) => n + g.causes.length, 0);
  ok("no cause is lost to a tempo filter — shown + demoted equals the unfiltered total",
     shown + chronic.demoted.length === all.all.length,
     `${shown} + ${chronic.demoted.length} vs ${all.all.length}`);
  ok("a tempo mismatch lands in `demoted`, not in byCategory", chronic.demoted.length > 0);
  ok("every demoted cause names the axis and what was entered",
     chronic.demoted.every(c => c.demotion && c.demotion.axis === "tempo" && c.demotion.entered === "chronic"));
  ok("every demoted cause states the tempo it DOES fit",
     chronic.demoted.every(c => Array.isArray(c.demotion.expected) && c.demotion.expected.length > 0));
  ok("nothing tempo-concordant is demoted",
     chronic.demoted.every(c => !c.tempo.includes("chronic")));
  ok("with no onset entered, nothing is demoted", causesFor(site, {}).demoted.length === 0);
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/causes.test.js`
Expected: FAIL — `chronic.demoted` is `undefined`.

- [ ] **Step 3: Change `causesFor()` to partition rather than filter**

In `src/data/causes.js`, replace the block at lines 3096-3103 with:

```js
  // TEMPO DEMOTES, IT DOES NOT DROP (owner ruling, 2026-08-14). A cause whose tempo does not match the
  // entered onset is still a real cause at this site — hiding it entirely is the same failure the sieve
  // sweep fixed, in reverse. It moves to `demoted`, carrying WHICH axis missed and what it does fit, so
  // the app can show it behind a "less likely given the tempo" disclosure.
  const byLikelihood = (a, b) => LIKELIHOOD.indexOf(a.likelihood) - LIKELIHOOD.indexOf(b.likelihood);
  const concordant = (onset ? list.filter(x => x.tempo.includes(onset)) : list.slice()).sort(byLikelihood);
  const demoted = (onset ? list.filter(x => !x.tempo.includes(onset)) : [])
    .map(x => ({ ...x, demotion: { axis: "tempo", entered: onset, expected: x.tempo } }))
    .sort(byLikelihood);
  // A sieve category with no plausible cause at this site simply does not appear. The sieve is an
  // authoring checklist, not an output format — it must never manufacture content to fill itself.
  const byCategory = CATEGORIES
    .map(cat => ({ cat: cat.id, label: cat.label, tint: cat.tint, causes: concordant.filter(x => x.cat === cat.id) }))
    .filter(g => g.causes.length);
  return { byCategory, demoted, all: concordant, onset: onset || null, derived, source };
}
```

> **`all` deliberately stays tempo-concordant** so existing callers keep their current meaning. The
> unfiltered list is `byCategory` ∪ `demoted`.

- [ ] **Step 4: Run the causes suite to verify it passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/causes.test.js`
Expected: the six new assertions PASS. **Other assertions in this file may now fail** — those are the ones written against dropping. Restate each to its real intent (e.g. "chronic onset yields no vascular causes here" becomes "vascular causes are demoted, with the tempo mismatch named"), never weaken it, and list them in the commit body.

- [ ] **Step 5: Render the demoted band in the What card**

In `app/app.js` `whatBlock()`, the empty-tempo message currently *replaces* the content. Change it to head the disclosure instead. After the existing `byCategory` rendering and before the function's `return`, add:

```js
  // Tempo mismatches are demoted, never deleted — the teaching line that used to REPLACE the content now
  // heads the disclosure. Spec 2026-08-14 §7.
  const dem = res.demoted && res.demoted.length
    ? `<details class="demoted" style="margin-top:6px"><summary style="font-size:11.5px;color:var(--muted)">Less likely given <b>${esc(S.onset)}</b> onset <span class="c">${res.demoted.length}</span></summary>
        <div class="annot" style="margin-top:4px">A lesion here does not typically present with <b>${esc(S.onset)}</b> onset — the mismatch between tempo and site is itself informative.</div>
        ${res.demoted.map(x => `<div class="cause"><b>${esc(x.name)}</b> <span class="dloc">usually ${x.demotion.expected.map(esc).join(" / ")}</span>${x.feature ? ` — ${esc(x.feature)}` : ""}</div>`).join("")}</details>`
    : "";
```

Include `${dem}` in the returned HTML, immediately after the category list and before the red-flag block. Delete the old branch that replaced the whole card body with the empty-tempo message.

- [ ] **Step 6: Run the full suite**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: `0 failed`.

- [ ] **Step 7: Commit**

```bash
git add src/data/causes.js app/app.js test/causes.test.js
git commit -m "feat(causes): tempo demotes instead of dropping

A tempo mismatch moved the cause out of the output entirely. It now moves to a
`demoted` band carrying the axis and the tempo it does fit, shown behind a
disclosure headed by the existing teaching line. Restated assertions below.

Own commit, ahead of the multifocal layer, so it can be reverted alone.
Spec: docs/superpowers/specs/2026-08-14-multi-location-ddx-design.md §7"
```

---

### Task 4: Course vocabulary

**Files:**
- Create: `src/model/course.js`

**Interfaces:**
- Produces: `COURSES` — array of `{ id, label }` with ids `single · simultaneous · stepwise · relapsing · progressive`

- [ ] **Step 1: Create the file**

There is no separate suite for this — it is a vocabulary with no logic, and Task 6 asserts every roster entry's `course` values are drawn from it.

Create `src/model/course.js`:

```js
// course.js — HOW THE ILLNESS UNFOLDED, an axis orthogonal to localisation.
//
// Onset tempo (TEMPO in causes.js) says how fast it started. Course says how it evolved, and for the
// cross-site roster it is much the stronger discriminator: vasculitis is stepwise, MS relapsing, MND
// progressive, an embolic shower simultaneous. Without it, MS, metastases and MND all present as
// "two CNS sites, subacute".
//
// Like the sensory level and the raised-pressure axis, this ANNOTATES and DEMOTES — it never changes
// which sites are candidates. It is deliberately NOT applied to per-site causes: the 1286 CAUSES entries
// carry `tempo` and no `course` field, so passing it to causesFor() would be a silent no-op.
//
// Spec: docs/superpowers/specs/2026-08-14-multi-location-ddx-design.md §5

export const COURSES = [
  { id: "single",       label: "Single event" },
  { id: "simultaneous", label: "All at once (simultaneous)" },
  { id: "stepwise",     label: "Stepwise (discrete events, plateaus between)" },
  { id: "relapsing",    label: "Relapsing–remitting (partial recovery between)" },
  { id: "progressive",  label: "Steadily progressive (no recovery)" },
];

export const COURSE_IDS = new Set(COURSES.map(c => c.id));
```

- [ ] **Step 2: Verify it loads**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node -e "import('./src/model/course.js').then(m=>console.log(m.COURSES.map(c=>c.id).join(' ')))"`
Expected: `single simultaneous stepwise relapsing progressive`

- [ ] **Step 3: Commit**

```bash
git add src/model/course.js
git commit -m "feat(model): course axis vocabulary"
```

---

### Task 5: The entity roster

**Files:**
- Create: `src/data/multifocal.js`

**Interfaces:**
- Produces: `mf(name, cat, opts) -> entity`, `FINDING_CLASSES` (object className → array of finding ids), `MULTIFOCAL` (array of entities)
- Entity shape: `{ name, cat, spread?, sites?, motor?, forbids?, course, tempo, likelihood, matches?, red?, feature, confirm? }`

> **⚠ CLINICAL CONTENT — REQUIRES THE OWNER'S SIGN-OFF BEFORE MERGE.** Thirteen new entities. Batch-present
> them for review as a table (name · what makes it fire · discriminating feature · red flag) exactly as the
> A–H region reviews were presented.

- [ ] **Step 1: Write the failing test**

Create `test/multifocal.test.js` with the roster invariants only (emergence tests are added in Task 6):

```js
// multifocal.test.js — the cross-site (multi-location) layer.
//
// CAUSES is keyed per site, so it cannot express MND: motor neurone disease is not a cause AT the anterior
// horn, it is a process spanning the anterior horn and the corticospinal tract. This layer names the
// processes that hit several places, using predicates over ANATOMICAL ATTRIBUTES — never over site ids,
// which would be combinatorial across 201 sites and stale the moment a site is added.
//
// Spec: docs/superpowers/specs/2026-08-14-multi-location-ddx-design.md
// Run: node test/multifocal.test.js
import { MULTIFOCAL, FINDING_CLASSES } from "../src/data/multifocal.js";
import { CATEGORIES, CAUSES, TEMPO, LIKELIHOOD } from "../src/data/causes.js";
import { COURSE_IDS } from "../src/model/course.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond, detail = "") { log.push({ label, ok: !!cond, detail }); cond ? pass++ : fail++; }

const CAT_IDS = new Set(CATEGORIES.map(c => c.id));
const TEMPO_IDS = new Set(TEMPO.map(t => t.id));

// --- 1: shape ---
{
  ok(`the roster has >= 13 entities (got ${MULTIFOCAL.length})`, MULTIFOCAL.length >= 13);
  const noClause = MULTIFOCAL.filter(e => !e.spread && !(e.sites && e.sites.length) && !e.motor);
  ok(`every entity has at least one HARD clause (${noClause.length} without)`, noClause.length === 0,
     noClause.map(e => e.name).join(", "));
  const badCat = MULTIFOCAL.filter(e => !CAT_IDS.has(e.cat));
  ok(`every category is declared in CATEGORIES (${badCat.length} undeclared)`, badCat.length === 0,
     badCat.map(e => `${e.name}:${e.cat}`).join(", "));
  const badCourse = MULTIFOCAL.filter(e => !Array.isArray(e.course) || !e.course.length || e.course.some(c => !COURSE_IDS.has(c)));
  ok(`every entity declares valid course values (${badCourse.length} bad)`, badCourse.length === 0,
     badCourse.map(e => e.name).join(", "));
  const badTempo = MULTIFOCAL.filter(e => !Array.isArray(e.tempo) || !e.tempo.length || e.tempo.some(t => !TEMPO_IDS.has(t)));
  ok(`every entity declares valid tempo values (${badTempo.length} bad)`, badTempo.length === 0,
     badTempo.map(e => e.name).join(", "));
  const badLik = MULTIFOCAL.filter(e => !LIKELIHOOD.includes(e.likelihood));
  ok(`every likelihood is a declared tier (${badLik.length} bad)`, badLik.length === 0,
     badLik.map(e => `${e.name}:${e.likelihood}`).join(", "));
  const noFeature = MULTIFOCAL.filter(e => !e.feature || !e.feature.trim());
  ok(`every entity has a discriminating feature (${noFeature.length} without)`, noFeature.length === 0,
     noFeature.map(e => e.name).join(", "));
}

// --- 2: THE ANTI-OVER-CALL GUARD ---
// A cross-site entity that a single site could satisfy is not a cross-site entity.
{
  const singleSatisfiable = MULTIFOCAL.filter(e => {
    const minSpread = e.spread ? (e.spread.minSites || 2) : 0;
    const nSites = e.sites ? e.sites.length : 0;
    return Math.max(minSpread, nSites) < 2 && e.motor !== "mixed";
  });
  ok(`no entity can be satisfied by a single site (${singleSatisfiable.length})`, singleSatisfiable.length === 0,
     singleSatisfiable.map(e => e.name).join(", "));
}

// --- 3: forbids names a declared finding CLASS, never a bare finding id ---
{
  const bad = MULTIFOCAL.filter(e => e.forbids && e.forbids.some(f => !FINDING_CLASSES[f]));
  ok(`every \`forbids\` names a declared finding class (${bad.length} bad)`, bad.length === 0,
     bad.map(e => e.name).join(", "));
  ok("FINDING_CLASSES declares a `sensory` class", Array.isArray(FINDING_CLASSES.sensory) && FINDING_CLASSES.sensory.length > 0);
}

// --- 4: a `matches` regex that has stopped matching is DEAD — it can never surface via the merge ---
{
  const names = [...new Set(Object.values(CAUSES).flat().map(c => c.name))];
  const dead = MULTIFOCAL.filter(e => e.matches && names.filter(n => e.matches.test(n)).length < 1);
  ok(`every \`matches\` regex still matches at least one curated cause (${dead.length} dead)`,
     dead.length === 0, dead.map(e => e.name).join(", "));
}

for (const l of log) console.log(`${l.ok ? "PASS" : "FAIL"}  ${l.label}${l.detail && !l.ok ? `  [${l.detail}]` : ""}`);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run it to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/multifocal.test.js`
Expected: FAIL — `Cannot find module '.../src/data/multifocal.js'`

- [ ] **Step 3: Write the roster**

Create `src/data/multifocal.js`:

```js
// multifocal.js — THE CROSS-SITE PATHOLOGY LAYER. Content only; the matching logic lives in
// src/engine/multifocal.js, so this file can be clinically reviewed on its own.
//
// CAUSES is keyed per site and therefore cannot express these: MND is not a cause AT the anterior horn,
// it is a process spanning the anterior horn and the corticospinal tract.
//
// PREDICATES ARE OVER ANATOMICAL ATTRIBUTES, NEVER SITE IDS — 201 sites makes id combinations
// combinatorial and stale the moment a site is added. Same "derive, don't store" rule as the rest of
// the engine.
//
// Spec: docs/superpowers/specs/2026-08-14-multi-location-ddx-design.md §2

// `forbids` names a finding CLASS, not individual ids, so a roster entry cannot silently stop working
// when a new finding is added to the vocabulary.
export const FINDING_CLASSES = {
  sensory: ["spinothalamic", "dorsal_sensory", "distal_sensory_loss", "suspended_sensory", "sensory_ataxia",
    "cortical_sensory_arm", "cortical_sensory_leg", "cortical_sensory_hand", "saddle_anaesthesia",
    "face_sensory_loss", "face_pain_loss", "thalamic_pain"],
  visual: ["homonymous_hemianopia", "superior_quadrantanopia", "inferior_quadrantanopia",
    "bitemporal_hemianopia", "optic_neuropathy", "rapd", "optic_atrophy", "central_scotoma",
    "altitudinal_defect", "cortical_blindness"],
  bulbar: ["dysphagia", "palatal_weakness", "vocal_cord_palsy", "cn12_palsy", "dysarthria"],
  cortical: ["speech_nonfluent", "comprehension_impaired", "repetition_impaired", "neglect", "amnesia",
    "limb_apraxia", "agraphia", "acalculia", "visual_agnosia", "prosopagnosia"],
};

// mf(name, cat, opts) — mirrors c() in causes.js.
//   spread   {minSites, distinctCompartments}  generic dissemination in space
//   sites    [{compartment|level|region}]      specific places, each matched by a DISTINCT site
//   motor    "mixed"                            delegates to umnLmnPattern() over the observed findings
//   forbids  ["sensory"]                        finding CLASSES that exclude this entity
//   course/tempo  SOFT axes — they demote, they never drop (owner ruling 2026-08-14)
//   matches  RegExp                             canonicalises per-site CAUSES names onto this entity
const mf = (name, cat, opts) => ({ name, cat, red: false, confirm: "", ...opts });

export const MULTIFOCAL = [
  mf("Motor neurone disease (ALS)", "degenerative", {
    spread: { minSites: 2 }, motor: "mixed", forbids: ["sensory"],
    course: ["progressive"], tempo: ["subacute", "chronic"], likelihood: "common",
    matches: /motor neurone|motor neuron|\bALS\b|amyotrophic/i,
    red: "Progressive bulbar or respiratory involvement — assess FVC early, before symptoms of hypoventilation appear",
    feature: "Painless, progressive and asymmetric; wasting and fasciculation in a limb with a brisk reflex in that same limb",
    confirm: "Fasciculation in two or more regions with entirely preserved sensation on formal testing",
  }),
  mf("Multiple sclerosis", "inflammatory", {
    spread: { minSites: 2, distinctCompartments: 2 },
    course: ["relapsing", "progressive", "stepwise"], tempo: ["subacute"], likelihood: "common",
    matches: /demyelinat|multiple sclerosis|\bMS plaque\b/i,
    red: false,
    feature: "Lesions separated in space AND time, typically optic nerve, brainstem, cord or periventricular white matter; young adult, symptoms evolving over days then partly recovering",
    confirm: "Uhthoff's phenomenon — the deficit reappears or worsens with heat or exercise",
  }),
  mf("Metastases", "neoplastic", {
    spread: { minSites: 2 },
    course: ["progressive", "stepwise"], tempo: ["subacute", "chronic"], likelihood: "common",
    matches: /metasta/i,
    red: "Multiple lesions with a known or suspected primary — image the whole neuraxis and look for cord compression",
    feature: "Several lesions appearing over weeks, with systemic features (weight loss, a known primary, smoking history); headache worse on waking",
    confirm: "Examine the breasts, chest, skin and lymph nodes — the primary is often findable at the bedside",
  }),
  mf("Vasculitis (CNS or systemic)", "inflammatory", {
    spread: { minSites: 2 },
    course: ["stepwise", "progressive"], tempo: ["acute", "subacute"], likelihood: "uncommon",
    matches: /vasculit/i,
    red: "Stepwise multifocal deficits with systemic inflammation — untreated, each step causes further irreversible loss",
    feature: "Discrete events with plateaus between them, systemic features (rash, arthralgia, weight loss, raised inflammatory markers), often painful",
    confirm: "Palpable purpura, nail-fold infarcts, or a mononeuritis multiplex pattern on limb examination",
  }),
  mf("Neurosarcoidosis", "inflammatory", {
    sites: [{ compartment: "skull_base" }, {}],
    course: ["progressive", "relapsing"], tempo: ["subacute", "chronic"], likelihood: "uncommon",
    matches: /sarcoid/i,
    red: false,
    feature: "Cranial neuropathy (especially facial, often bilateral) with a second deficit elsewhere; basal meningeal involvement; may have hilar lymphadenopathy or uveitis",
    confirm: "Look for uveitis, erythema nodosum, lupus pernio and parotid enlargement",
  }),
  mf("Mononeuritis multiplex", "inflammatory", {
    sites: [{ compartment: "nerve" }, { compartment: "nerve" }],
    course: ["stepwise"], tempo: ["acute", "subacute"], likelihood: "uncommon",
    matches: /mononeuritis multiplex/i,
    red: "Successive named-nerve palsies — a vasculitic emergency until proven otherwise",
    feature: "Two or more NAMED nerves picked off sequentially, each with pain at onset; not a length-dependent pattern",
    confirm: "Map the deficit against named-nerve territories — the sparing rules (triceps, first web space, inversion) show it is not a root or a plexus",
  }),
  mf("Leptomeningeal disease", "neoplastic", {
    spread: { minSites: 2 },
    course: ["progressive", "stepwise"], tempo: ["subacute"], likelihood: "uncommon",
    matches: /leptomeningeal|carcinomatous meningitis|meningeal carcinomatosis/i,
    red: "Multiple cranial neuropathies with radicular pain and headache — needs CSF, and repeat cytology if the first is negative",
    feature: "Deficits that do not fit ONE place: several cranial nerves plus radiculopathy plus headache, in a patient with known malignancy",
    confirm: "Multiple cranial nerve palsies at different skull-base exits at once",
  }),
  mf("NMOSD (neuromyelitis optica spectrum disorder)", "inflammatory", {
    sites: [{ compartment: "optic" }, { compartment: "cord" }],
    course: ["relapsing"], tempo: ["acute", "subacute"], likelihood: "uncommon",
    matches: /NMOSD|neuromyelitis/i,
    red: "Optic neuritis with myelitis — attacks are more destructive than MS and treated differently; needs AQP4 testing",
    feature: "Severe optic neuritis (often bilateral) with a longitudinally extensive myelitis; intractable hiccups or vomiting from the area postrema",
    confirm: "Poorer visual recovery and a more severe cord syndrome than MS would produce",
  }),
  mf("Primary CNS lymphoma", "neoplastic", {
    spread: { minSites: 2 },
    course: ["progressive"], tempo: ["subacute"], likelihood: "rare",
    matches: /lymphoma/i,
    red: "Do NOT give steroids before biopsy — the lesion melts away and the diagnosis is lost",
    feature: "Periventricular lesions crossing the midline, progressing over weeks; immunosuppression or HIV raises the odds sharply",
    confirm: "Examine the eyes — vitreous involvement (ocular lymphoma) can be seen on slit lamp",
  }),
  mf("Neurofibromatosis type 2", "congenital", {
    sites: [{ compartment: "skull_base" }, {}],
    course: ["progressive"], tempo: ["chronic"], likelihood: "rare",
    matches: /neurofibromatosis|\bNF2\b/i,
    red: false,
    feature: "Bilateral vestibular schwannomas, often with meningiomas and spinal tumours; family history; presents in young adulthood",
    confirm: "Bilateral sensorineural hearing loss with cutaneous schwannomas and posterior subcapsular cataracts",
  }),
  mf("Paraneoplastic syndrome", "inflammatory", {
    spread: { minSites: 2 },
    course: ["progressive", "stepwise"], tempo: ["subacute"], likelihood: "rare",
    matches: /paraneoplastic|anti-Hu|anti-Ma2|anti-Yo/i,
    red: "A subacute multifocal syndrome may precede the tumour by months — the cancer search is the investigation",
    feature: "Subacute progression over weeks affecting several levels at once (limbic, cerebellar, brainstem, dorsal root ganglia), out of proportion to imaging",
    confirm: "Weight loss with a sensory neuronopathy — sensory loss that is non-length-dependent, affecting face and trunk",
  }),
  mf("Neurosyphilis or HIV", "infective", {
    spread: { minSites: 2 },
    course: ["progressive", "stepwise"], tempo: ["subacute", "chronic"], likelihood: "rare",
    matches: /syphilis|\bHIV\b|tabes/i,
    red: "Treatable and routinely missed — test whenever a multifocal picture has no better explanation",
    feature: "Any combination of cognitive change, myelopathy, neuropathy and cranial neuropathy in one patient; risk factors may not be volunteered",
    confirm: "Argyll Robertson pupils — small, irregular, accommodating but not reacting to light",
  }),
  mf("Embolic shower (cardiac or aortic source)", "vascular", {
    spread: { minSites: 2 },
    course: ["simultaneous"], tempo: ["hyperacute", "acute"], likelihood: "common",
    matches: /embol/i,
    red: "Multiple territories at once means a PROXIMAL source — needs urgent cardiac and aortic imaging to prevent the next shower",
    feature: "Several deficits all beginning at the same moment, in different vascular territories; atrial fibrillation, recent instrumentation or endocarditis",
    confirm: "Irregular pulse, a new murmur, splinter haemorrhages or Roth spots",
  }),
];
```

- [ ] **Step 4: Run the suite to verify it passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/multifocal.test.js`
Expected: PASS, `0 failed`

If the `matches`-regex assertion fails for an entity, the regex does not match any curated cause name — widen it against real names by running:

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node -e "import('./src/data/causes.js').then(({CAUSES})=>{const n=[...new Set(Object.values(CAUSES).flat().map(c=>c.name))];console.log(n.filter(x=>/YOUR_PATTERN/i.test(x)).join('\n'))})"
```

- [ ] **Step 5: Register the suite and commit**

Add ` && node test/multifocal.test.js` to `package.json`'s `test` script and a line to the README.

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test` → expect `0 failed`.

```bash
git add src/data/multifocal.js test/multifocal.test.js package.json README.md
git commit -m "feat(multifocal): the cross-site entity roster (13 entities)

Content only, no logic, so it can be clinically reviewed on its own.
AWAITING CLINICAL SIGN-OFF.
Spec: docs/superpowers/specs/2026-08-14-multi-location-ddx-design.md §2"
```

---

### Task 6: `unifyingDiagnoses()`

**Files:**
- Create: `src/engine/multifocal.js`
- Modify: `test/multifocal.test.js` (append emergence + demotion tests)

**Interfaces:**
- Consumes: `MULTIFOCAL`, `FINDING_CLASSES` (Task 5); `compartmentOf` (Task 1); `umnLmnPattern` from `src/engine/patterns.js`; `regionOf` from `src/data/causes.js`
- Produces: `unifyingDiagnoses(sites, observedSet, { onset, course }) -> { concordant: Entry[], discordant: Entry[] }` where `Entry = { ...entity, why: [{ clause, satisfiedBy }], demotions: [{ axis, entered, expected }] }`

- [ ] **Step 1: Write the failing tests**

Append to `test/multifocal.test.js`, before the reporting block. Add these imports at the top of the file:

```js
import { unifyingDiagnoses } from "../src/engine/multifocal.js";
import { candidateSites } from "../src/engine/inverse.js";
import { expectedFindings } from "../src/engine/forward.js";
```

```js
// --- 5: EMERGENCE — build every probe from expectedFindings() of a REAL site, never hand-typed tokens ---
const siteById = id => candidateSites().find(s => s.id === id);
const tokensFor = (...ids) => new Set(ids.flatMap(id => [...expectedFindings(siteById(id))]));

{
  // MND: a UMN site and an LMN site, with UMN + LMN signs and NO sensory involvement.
  const umnSite = siteById("left_cortex_motor_facearm");
  const lmnSite = siteById("motor_unit_anterior_horn");
  const sites = [umnSite, lmnSite];
  const toks = new Set([...expectedFindings(umnSite), ...expectedFindings(lmnSite), "babinski@left", "fasciculations@left"]);
  const r = unifyingDiagnoses(sites, toks, { course: "progressive", onset: "chronic" });
  const names = [...r.concordant, ...r.discordant].map(e => e.name);
  ok("MND emerges on a mixed UMN + LMN picture", names.some(n => /motor neurone/i.test(n)));

  // ...and DISAPPEARS once sensory involvement is present. This is the whole diagnosis.
  const withSensory = new Set([...toks, "spinothalamic@right"]);
  const r2 = unifyingDiagnoses(sites, withSensory, { course: "progressive", onset: "chronic" });
  const names2 = [...r2.concordant, ...r2.discordant].map(e => e.name);
  ok("MND does NOT fire once a sensory finding is present", !names2.some(n => /motor neurone/i.test(n)));
}

{
  // MS: optic + cord = two distinct compartments.
  const sites = [siteById("left_visual_pathway_optic_neuritis") || siteById("left_visual_pathway_optic_nerve"),
                 siteById("left_cord_hemi")].filter(Boolean);
  const toks = tokensFor(...sites.map(s => s.id));
  const r = unifyingDiagnoses(sites, toks, { course: "relapsing", onset: "subacute" });
  ok("MS emerges on optic + cord (two compartments)",
     r.concordant.some(e => /multiple sclerosis/i.test(e.name)));
  const ms = r.concordant.find(e => /multiple sclerosis/i.test(e.name));
  ok("MS carries its derivation (`why` names the satisfying sites)",
     ms && Array.isArray(ms.why) && ms.why.length > 0 && ms.why.every(w => w.satisfiedBy));
}

// --- 6: SOFT AXES DEMOTE, THEY DO NOT DROP (the owner's ruling — the assertion that guards it) ---
{
  const sites = [siteById("left_cortex_motor_facearm"), siteById("motor_unit_anterior_horn")];
  const toks = new Set([...expectedFindings(sites[0]), ...expectedFindings(sites[1]), "babinski@left", "fasciculations@left"]);
  const fits = unifyingDiagnoses(sites, toks, { course: "progressive" });
  const clashes = unifyingDiagnoses(sites, toks, { course: "relapsing" });
  const nFits = fits.concordant.length + fits.discordant.length;
  const nClash = clashes.concordant.length + clashes.discordant.length;
  ok("a course mismatch changes the BAND, not the total count", nFits === nClash, `${nFits} vs ${nClash}`);
  const mnd = clashes.discordant.find(e => /motor neurone/i.test(e.name));
  ok("MND is demoted (not deleted) by a relapsing course", !!mnd);
  ok("the demotion names the axis and what was entered",
     mnd && mnd.demotions.some(d => d.axis === "course" && d.entered === "relapsing"));
  ok("nothing in the concordant band carries a demotion",
     clashes.concordant.every(e => e.demotions.length === 0));
}

// --- 7: hard constraints DO filter ---
{
  const one = [siteById("left_cortex_motor_facearm")];
  const toks = tokensFor("left_cortex_motor_facearm");
  const r = unifyingDiagnoses(one, toks, {});
  ok("a single site yields NO cross-site entities", r.concordant.length === 0 && r.discordant.length === 0);
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/multifocal.test.js`
Expected: FAIL — `Cannot find module '.../src/engine/multifocal.js'`

- [ ] **Step 3: Implement the matcher**

Create `src/engine/multifocal.js`:

```js
// multifocal.js (engine) — matching and ranking for the cross-site layer. LOGIC ONLY: every disease name,
// feature and red flag lives in src/data/multifocal.js so the content can be reviewed on its own.
//
// HARD constraints (spread / sites / motor / forbids) FILTER: they are anatomical facts, and an entity
// that does not fit them does not apply. SOFT constraints (tempo / course) only DEMOTE — a mismatch is
// informative, not disqualifying (owner ruling, 2026-08-14).
//
// Spec: docs/superpowers/specs/2026-08-14-multi-location-ddx-design.md §3
import { MULTIFOCAL, FINDING_CLASSES } from "../data/multifocal.js";
import { compartmentOf } from "../model/compartments.js";
import { regionOf } from "../data/causes.js";
import { umnLmnPattern } from "./patterns.js";
import { LIKELIHOOD } from "../data/causes.js";

const idOf = t => t.split("@")[0];

// Does ONE site satisfy ONE site-clause? An empty clause `{}` means "any site" (used as the second,
// unconstrained half of a pair like sarcoid's "cranial nerve PLUS something else").
function siteMatches(site, clause) {
  if (!clause || Object.keys(clause).length === 0) return true;
  if (clause.compartment && compartmentOf(site) !== clause.compartment) return false;
  if (clause.level && site.level !== clause.level) return false;
  if (clause.region && regionOf(site) !== clause.region) return false;
  if (clause.part && site.part !== clause.part) return false;
  return true;
}

// Each clause must be satisfied by a DISTINCT site. Greedy assignment is sufficient here: clause counts
// are 2-3 and clauses are near-disjoint, so there is no meaningful backtracking to do.
function assignClauses(sites, clauses) {
  const used = new Set();
  const why = [];
  for (const clause of clauses) {
    const hit = sites.find(s => !used.has(s.id) && siteMatches(s, clause));
    if (!hit) return null;
    used.add(hit.id);
    why.push({ clause, satisfiedBy: hit });
  }
  return why;
}

function spreadSatisfied(sites, spread) {
  const minSites = spread.minSites || 2;
  if (sites.length < minSites) return null;
  if (spread.distinctCompartments) {
    const cmps = new Set(sites.map(compartmentOf).filter(Boolean));
    if (cmps.size < spread.distinctCompartments) return null;
    return [{ clause: { spread: `${cmps.size} compartments` }, satisfiedBy: sites[0] }];
  }
  return [{ clause: { spread: `${sites.length} sites` }, satisfiedBy: sites[0] }];
}

export function unifyingDiagnoses(sites, observedSet, { onset, course } = {}) {
  const concordant = [], discordant = [];
  if (!Array.isArray(sites) || sites.length < 2) return { concordant, discordant };

  const observedIds = new Set([...observedSet].map(idOf));
  const motor = umnLmnPattern(observedSet);

  for (const entity of MULTIFOCAL) {
    let why = [];

    // --- hard: dissemination in space ---
    if (entity.spread) {
      const w = spreadSatisfied(sites, entity.spread);
      if (!w) continue;
      why = why.concat(w);
    }
    // --- hard: specific places ---
    if (entity.sites && entity.sites.length) {
      const w = assignClauses(sites, entity.sites);
      if (!w) continue;
      why = why.concat(w);
    }
    // --- hard: motor pattern, delegated to the existing synthesis so the two can never disagree ---
    if (entity.motor && motor.verdict !== entity.motor) continue;
    if (entity.motor) why.push({ clause: { motor: entity.motor }, satisfiedBy: sites[0] });

    // --- hard: forbidden finding CLASSES ---
    if (entity.forbids && entity.forbids.some(cls => (FINDING_CLASSES[cls] || []).some(f => observedIds.has(f)))) continue;

    // --- soft: tempo and course DEMOTE, never drop ---
    const demotions = [];
    if (onset && !entity.tempo.includes(onset)) demotions.push({ axis: "tempo", entered: onset, expected: entity.tempo });
    if (course && !entity.course.includes(course)) demotions.push({ axis: "course", entered: course, expected: entity.course });

    (demotions.length ? discordant : concordant).push({ ...entity, why, demotions });
  }

  const rank = (a, b) =>
    LIKELIHOOD.indexOf(a.likelihood) - LIKELIHOOD.indexOf(b.likelihood) || b.why.length - a.why.length;
  return { concordant: concordant.sort(rank), discordant: discordant.sort(rank) };
}
```

- [ ] **Step 4: Run the suite to verify it passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/multifocal.test.js`
Expected: PASS, `0 failed`.

If the MS test fails because a site id does not exist, find the real optic ids with:

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node -e "import('./src/engine/inverse.js').then(m=>console.log(m.candidateSites().filter(s=>s.level==='visual_pathway').map(s=>s.id).join('\n')))"
```

- [ ] **Step 5: Run the full suite and commit**

```bash
git add src/engine/multifocal.js test/multifocal.test.js
git commit -m "feat(multifocal): unifyingDiagnoses — hard clauses filter, tempo/course demote"
```

---

### Task 7: `forcingFindings()` — the parsimony guard

**Files:**
- Modify: `src/engine/multifocal.js` (append)
- Modify: `test/multifocal.test.js` (append)

**Interfaces:**
- Consumes: `solve` / `minimalSet` / `candidateSites` from `src/engine/inverse.js`; `LOCALISING` from `src/engine/score.js`
- Produces: `forcingFindings(observedSet, opts) -> { findings: string[], collapsesTo: site|null }` — `findings` are the localising tokens whose removal collapses the picture to a single site

- [ ] **Step 1: Write the failing test**

Append to `test/multifocal.test.js` (add `import { forcingFindings } from "../src/engine/multifocal.js";` to the existing import):

```js
// --- 8: THE FORCING-FINDING GUARD, as a PROPERTY TEST ---
// The card claims "remove this finding and one lesion explains everything". The test IS that claim: for
// every finding named, removing it must actually collapse the picture. Claim and test are one statement.
{
  const wallenberg = siteById("left_medulla_lateral");
  const l5 = siteById("right_root_l5");
  const toks = new Set([...expectedFindings(wallenberg), ...expectedFindings(l5)]);
  const f = forcingFindings(toks, {});
  ok("a genuinely multifocal case names at least one forcing finding", f.findings.length > 0);

  const { solve } = await import("../src/engine/inverse.js");
  const allCollapse = f.findings.every(tok => {
    const without = new Set([...toks].filter(t => t !== tok));
    return solve(without).singleExplainsAll === true;
  });
  ok("EVERY named forcing finding provably collapses the picture when removed", allCollapse);
}
{
  // A single-lesion case has nothing forcing a second site.
  const toks = new Set(expectedFindings(siteById("left_medulla_lateral")));
  ok("a single-lesion case names no forcing findings", forcingFindings(toks, {}).findings.length === 0);
}

// --- 9: MURKY-INPUT REGRESSION SET — these must NEVER produce a combined view ---
// Probes from the design session. They are the guard against a future loosening of the trigger.
{
  const { solve } = await import("../src/engine/inverse.js");
  const exp = [...expectedFindings(siteById("left_medulla_lateral"))];
  const cases = {
    "clean Wallenberg": exp,
    "crossed sensory on the WRONG side": exp.map(t => t === "spinothalamic@right" ? "spinothalamic@left" : t),
    "one spurious non-localising sign": [...exp, "babinski@right"],
    "sparse murky input": ["weak_arm@left", "distal_sensory_loss@right"],
  };
  for (const [label, toks] of Object.entries(cases)) {
    const r = solve(new Set(toks));
    ok(`murky input produces no multifocal claim: ${label}`, !r.multi);
  }
}
```

> **NOTE:** `test/multifocal.test.js` uses top-level `await` for the dynamic imports above. That is valid
> in an ES module and needs no flag on Node v24.

- [ ] **Step 2: Run it to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/multifocal.test.js`
Expected: FAIL — `forcingFindings is not a function`

- [ ] **Step 3: Implement it**

Add these two lines to the **import block at the top** of `src/engine/multifocal.js` (imports must sit with the others, not after the code):

```js
import { solve } from "./inverse.js";
import { LOCALISING } from "./score.js";
```

Then append the function to the end of the file:

```js
// THE PARSIMONY GUARD. Multifocality is a claim that must be earned, and the app's first job is to try to
// talk you out of it: a localising sign entered on the wrong side is the one real path to over-calling,
// because nearFit() deliberately refuses to relax a localising sign.
//
// So rather than relaxing it automatically, we NAME it and hand the judgement to the clinician — which is
// that rule's intent. For each localising finding, does removing it collapse the picture to one site?
export function forcingFindings(observedSet, opts = {}) {
  const current = solve(observedSet, opts);
  if (current.singleExplainsAll) return { findings: [], collapsesTo: null };

  const findings = [];
  let collapsesTo = null;
  for (const tok of observedSet) {
    if (!LOCALISING.has(idOf(tok))) continue; // a soft sign can never be what forces a second lesion
    const without = new Set([...observedSet].filter(t => t !== tok));
    const r = solve(without, opts);
    if (r.singleExplainsAll) {
      findings.push(tok);
      collapsesTo = collapsesTo || (r.display && r.display[0] ? r.display[0].site : r.best && r.best.site) || null;
    }
  }
  return { findings, collapsesTo };
}
```

- [ ] **Step 4: Run to verify it passes, then the full suite**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/multifocal.test.js` → PASS
Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test` → `0 failed`

- [ ] **Step 5: Commit**

```bash
git add src/engine/multifocal.js test/multifocal.test.js
git commit -m "feat(multifocal): forcingFindings guard + murky-input regression set"
```

---

### Task 8: `combinedCauses()`

**Files:**
- Modify: `src/data/causes.js` (append, after `causesFor`)
- Modify: `test/causes.test.js` (append)

**Interfaces:**
- Consumes: `causesFor()`; `MULTIFOCAL` from `src/data/multifocal.js`
- Produces: `combinedCauses(sites, { onset }) -> { shared: Shared[], perSite: [{ site, causes }] }` where `Shared = { name, cat, red, feature, entity, sites: siteId[], count }`

- [ ] **Step 1: Write the failing test**

Append to `test/causes.test.js` before the reporting block:

```js
// --- combinedCauses: the cross-site merge (spec 2026-08-14 §6) ---
// Naive name intersection DOES NOT WORK and this is the assertion that proves it stays fixed: MS appears
// as >=8 different strings across the layer ("Demyelination", "Demyelination (MS)", "Multiple sclerosis"),
// so canonicalisation via the roster's `matches` regex is what makes the flagship case surface at all.
{
  const { combinedCauses } = await import("../src/data/causes.js");
  const optic = candidateSites().find(s => s.level === "visual_pathway" && /optic/.test(s.part));
  const cord = candidateSites().find(s => s.id === "left_cord_hemi");
  const r = combinedCauses([optic, cord], {});
  ok("combinedCauses returns shared and perSite", Array.isArray(r.shared) && Array.isArray(r.perSite));
  ok("every shared cause names >= 2 sites", r.shared.every(s => s.sites.length >= 2));
  ok("every shared cause reports its count", r.shared.every(s => s.count === s.sites.length));
  ok("demyelination surfaces across differently-worded sites (canonicalisation works)",
     r.shared.some(s => /demyelinat|sclerosis/i.test(s.name) || s.entity === "Multiple sclerosis"));
  ok("perSite covers every site passed in", r.perSite.length === 2);
  // A single site can share nothing with itself-as-a-pair.
  ok("one site yields no shared causes", combinedCauses([optic], {}).shared.length === 0);
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/causes.test.js`
Expected: FAIL — `combinedCauses is not a function`

- [ ] **Step 3: Implement it**

Append to `src/data/causes.js`, after `causesFor()`:

```js
// ---- CROSS-SITE MERGE (spec 2026-08-14 §6) ----
// Which causes are plausible at MORE THAN ONE of these sites? Measured before designing: 856 distinct
// cause names, only 147 repeat verbatim. The family builders (sbSpine/nvSpine/rtSpine) produce identical
// names by construction and intersect perfectly; HAND-AUTHORED entities fragment badly — MS alone appears
// as "Demyelination", "Demyelination (MS)", "Multiple sclerosis", "Demyelination (multiple sclerosis)".
//
// So: canonicalise through the roster's `matches` regexes FIRST (one table doing double duty — it names
// the cross-site entity AND supplies the intersection key, so there is no second alias map to drift),
// then fall back to the verbatim name, which already works for the builder families.
import { MULTIFOCAL } from "./multifocal.js";

function canonicalKey(name) {
  const hit = MULTIFOCAL.find(e => e.matches && e.matches.test(name));
  return hit ? { key: `entity:${hit.name}`, entity: hit.name } : { key: `name:${name}`, entity: null };
}

export function combinedCauses(sites, { onset } = {}) {
  const perSite = sites.map(site => ({ site, causes: causesFor(site, { onset }).all }));
  const buckets = new Map();
  for (const { site, causes } of perSite) {
    for (const c of causes) {
      const { key, entity } = canonicalKey(c.name);
      const b = buckets.get(key) || { name: c.name, cat: c.cat, red: false, feature: c.feature, entity, sites: [] };
      // Prefer the SHORTEST name as the display label — the canonical form is nearly always the plainest
      // ("Multiple sclerosis" over "Demyelination (multiple sclerosis)").
      if (c.name.length < b.name.length) { b.name = c.name; b.feature = c.feature || b.feature; }
      b.red = b.red || !!c.red;               // the strongest red flag among the sites wins
      if (!b.sites.includes(site.id)) b.sites.push(site.id);
      buckets.set(key, b);
    }
  }
  const shared = [...buckets.values()]
    .filter(b => b.sites.length >= 2)
    .map(b => ({ ...b, count: b.sites.length }))
    .sort((a, b) => b.count - a.count || Number(b.red) - Number(a.red));
  return { shared, perSite };
}
```

> **Circular-import note:** `src/data/multifocal.js` must NOT import from `causes.js`. It currently
> imports nothing, which is why the roster is pure data. Keep it that way.

- [ ] **Step 4: Verify, run full suite, commit**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/causes.test.js` → PASS
Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test` → `0 failed`

```bash
git add src/data/causes.js test/causes.test.js
git commit -m "feat(causes): combinedCauses — canonicalised cross-site merge"
```

---

### Task 9: `combinedNextSteps()`

**Files:**
- Modify: `src/data/nextSteps.js` (append)
- Modify: `test/next-steps.test.js` (append)

**Interfaces:**
- Consumes: `nextStepsFor()`
- Produces: `combinedNextSteps(sites) -> { immediate, investigations, confirmatory, monitoring, urgency, referral, sites }`

- [ ] **Step 1: Write the failing test**

Append to `test/next-steps.test.js` before the reporting block:

```js
// --- combinedNextSteps: one plan for a multifocal picture (spec 2026-08-14 §6) ---
{
  const { combinedNextSteps } = await import("../src/data/nextSteps.js");
  const cord = candidateSites().find(s => s.id === "left_cord_hemi");
  const nerve = candidateSites().find(s => s.level === "nerve");
  const r = combinedNextSteps([cord, nerve]);
  const cordN = nextStepsFor(cord), nerveN = nextStepsFor(nerve);

  ok("all four tiers are present", ["immediate","investigations","confirmatory","monitoring"].every(k => Array.isArray(r[k])));
  ok("tiers are de-duplicated", r.investigations.length === new Set(r.investigations).size);
  ok("the MOST urgent urgency wins, never an average",
     r.urgency === (["emergency","urgent","routine"].find(u => u === cordN.urgency || u === nerveN.urgency)));
  ok("every investigation from each site survives the union",
     [...cordN.investigations, ...nerveN.investigations].every(i => r.investigations.includes(i)));
  ok("referrals from both sites are unioned",
     r.referral.includes(cordN.referral) && r.referral.includes(nerveN.referral));
  ok("the site list is carried", r.sites.length === 2);
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/next-steps.test.js`
Expected: FAIL — `combinedNextSteps is not a function`

- [ ] **Step 3: Implement it**

Append to `src/data/nextSteps.js`:

```js
// ---- CROSS-SITE WORKUP (spec 2026-08-14 §6) ----
// One plan for a multifocal picture. The urgency is the MOST urgent across the set, never an average —
// a cord site plus a nerve site is a cord-urgency workup, and averaging would under-call it.
const URGENCY_ORDER = ["emergency", "urgent", "routine"];

export function combinedNextSteps(sites) {
  const all = sites.map(nextStepsFor);
  const union = key => [...new Set(all.flatMap(n => n[key] || []))];
  const urgency = URGENCY_ORDER.find(u => all.some(n => n.urgency === u)) || "routine";
  const referral = [...new Set(all.map(n => n.referral).filter(Boolean))].join(" · ");
  return {
    immediate: union("immediate"),
    investigations: union("investigations"),
    confirmatory: union("confirmatory"),
    monitoring: union("monitoring"),
    urgency,
    referral,
    sites: sites.map(s => s.id),
  };
}
```

- [ ] **Step 4: Verify, run full suite, commit**

```bash
git add src/data/nextSteps.js test/next-steps.test.js
git commit -m "feat(workup): combinedNextSteps — merged four-tier plan, most-urgent wins"
```

---

### Task 10: Course control in the app

**Files:**
- Modify: `app/app.js:43` (state), `:72` (control), `:86` (sync), `:120` (handler)
- Modify: `app/case-url.js:6-40`
- Modify: `test/case-url.test.js`

**Interfaces:**
- Consumes: `COURSES`, `COURSE_IDS` from `src/model/course.js`
- Produces: `S.course` state; case-URL key `c=`

- [ ] **Step 1: Write the failing test**

Append to `test/case-url.test.js` before the reporting block:

```js
// --- course axis in the shareable case (spec 2026-08-14 §8) ---
{
  const enc = encodeCase({ tokens: new Set(["weak_arm@left"]), course: "stepwise" });
  ok("course is serialised as c=", enc.includes("c=stepwise"));
  ok("course round-trips", decodeCase("#" + enc).course === "stepwise");
  ok("an invalid hand-edited course is DROPPED, never thrown on",
     decodeCase("#c=notacourse").course === undefined);
  ok("no course means no key", !encodeCase({ tokens: new Set(["weak_arm@left"]) }).includes("c="));
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/case-url.test.js`
Expected: FAIL — `c=stepwise` is not in the encoded string.

- [ ] **Step 3: Wire the case URL**

In `app/case-url.js`, add the import at the top:

```js
import { COURSE_IDS } from "../src/model/course.js";
```

In `encodeCase()`, after the `o` line:

```js
  if (state.course) p.set("c", state.course);
```

In `decodeCase()`, after the `o` line:

```js
  const cr = p.get("c"); if (cr && COURSE_IDS.has(cr)) out.course = cr;
```

- [ ] **Step 4: Add the control to the app**

In `app/app.js`:

1. Import at the top: `import { COURSES } from "../src/model/course.js";`
2. Line 43 — add `course:""` to the `S` object.
3. Line 54 area — add `if (st.course) S.course = st.course;`
4. Line 72 — add immediately after the Onset `<label>`:

```js
    <label>Course (for causes) <select id="course"><option value="">all</option>${COURSES.map(c=>`<option value="${c.id}">${esc(c.label)}</option>`).join("")}</select></label>
```

5. Line 86 area — add `document.getElementById("course").value = S.course;`
6. Line 120 area — add:

```js
    document.getElementById("course").onchange = e => { S.course = e.target.value; renderResults(); };
```

7. In `syncURL()`, ensure `course: S.course` is included in the object passed to `encodeCase`.

- [ ] **Step 5: Verify and commit**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test` → `0 failed`

```bash
git add app/app.js app/case-url.js src/model/course.js test/case-url.test.js
git commit -m "feat(app): course control + c= case-URL key"
```

---

### Task 11: Pinning

**Files:**
- Modify: `app/app.js` (state, `whereCard()` at :241-265, the `difflist` click handler at :192)
- Modify: `app/index.html` (CSS for `.pin`)
- Modify: `app/case-url.js`
- Modify: `test/case-url.test.js`, `test/app-smoke.test.js`

**Interfaces:**
- Produces: `S.pinned` (a `Set` of site ids); case-URL key `p=`; `combinedSites(r)` helper in `app.js` returning `{ sites, source: "pinned"|"cover"|null }`

- [ ] **Step 1: Write the failing test**

Append to `test/case-url.test.js`:

```js
// --- pinned sites in the shareable case (spec 2026-08-14 §8) ---
{
  const enc = encodeCase({ tokens: new Set(["weak_arm@left"]), pinned: new Set(["left_cord_hemi", "right_root_l5"]) });
  ok("pins are serialised as p=", /p=left_cord_hemi%2Cright_root_l5|p=left_cord_hemi,right_root_l5/.test(enc));
  const back = decodeCase("#" + enc, { validSites: new Set(["left_cord_hemi", "right_root_l5"]) });
  ok("pins round-trip as a Set", back.pinned instanceof Set && back.pinned.size === 2);
  const filtered = decodeCase("#p=left_cord_hemi,not_a_site", { validSites: new Set(["left_cord_hemi"]) });
  ok("unknown pinned site ids are dropped, never thrown on",
     filtered.pinned instanceof Set && filtered.pinned.size === 1);
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/case-url.test.js`
Expected: FAIL — no `p=` in the encoded string.

- [ ] **Step 3: Wire the case URL**

In `app/case-url.js` `encodeCase()`:

```js
  const pins = [...(state.pinned || [])];
  if (pins.length) p.set("p", pins.join(","));
```

In `decodeCase()`:

```js
  const pn = p.get("p");
  if (pn) {
    const ids = pn.split(",").map(t => t.trim()).filter(Boolean).filter(id => !validSites || validSites.has(id));
    if (ids.length) out.pinned = new Set(ids);
  }
```

- [ ] **Step 4: Add the pin toggle to the Where card**

In `app/app.js`:

1. Add `pinned:new Set()` to `S` (line 43) and `if (st.pinned) S.pinned = st.pinned;` to the restore block.
2. Include `pinned: S.pinned` in the `encodeCase` call inside `syncURL()`.
3. In `whereCard()`, change the row template (line 255) to append a pin button **outside** the existing name/fit divs:

```js
    const pinned = S.pinned.has(c.site.id) ? " pinned" : "";
    return `<div class="drow${on}" data-k="${esc(c.site.id)}"><div class="dn"><b>${esc(siteName(c.site))}</b><span class="dloc">${esc(siteLoc(c.site))}${c.site.territory?` · ${esc(c.site.territory)}`:""}</span></div><div class="dfit">${fit}<div class="dbar" style="width:${w}px"></div></div><button class="pin${pinned}" data-pin="${esc(c.site.id)}" title="Pin this site to compare across lesions">📌</button></div>`;
```

4. Extend the `difflist` click handler (line 192) so the pin button does NOT also select the row:

```js
  if (dl) dl.onclick = e => {
    const pin = e.target.closest("[data-pin]");
    if (pin) {                      // pin toggle — must not fall through to row selection
      const id = pin.dataset.pin;
      S.pinned.has(id) ? S.pinned.delete(id) : S.pinned.add(id);
      renderResults();
      return;
    }
    const row = e.target.closest(".drow");
    if (!row) return;
    S.selected = row.dataset.k;
    renderResults();
  };
```

5. Add the resolution helper near `whereCard()`:

```js
// What does the combined view describe — the user's pinned pair, or the engine's minimal cover? The label
// matters: the user must always know which they are looking at.
function combinedSites(r, list) {
  if (S.pinned.size >= 2) {
    const sites = list.filter(c => S.pinned.has(c.site.id)).map(c => c.site);
    if (sites.length >= 2) return { sites, source: "pinned" };
  }
  if (r.multi && r.multi.sites.length > 1) return { sites: r.multi.sites, source: "cover" };
  return { sites: [], source: null };
}
```

- [ ] **Step 5: Add the CSS**

In `app/index.html`, add next to the other `.drow` rules:

```css
.pin { background:none; border:0; cursor:pointer; opacity:.25; font-size:13px; padding:0 4px; line-height:1; }
.pin:hover { opacity:.6; }
.pin.pinned { opacity:1; }
```

- [ ] **Step 6: Pin the state shape in app-smoke**

Append to `test/app-smoke.test.js`:

```js
// The combined view resolves to the pinned pair when there is one, else the engine's cover. This pins the
// SHAPES the app consumes: minimalSet() yields RAW site objects, unlike r.nearFit which is a {site,missing}
// wrapper — two adjacent solve() fields with opposite shapes, which has already caused one crash.
{
  const r = solve(new Set([...expectedFindings(siteById("left_medulla_lateral")), ...expectedFindings(siteById("right_root_l5"))]));
  ok("r.multi.sites are RAW site objects with an id", r.multi.sites.every(s => s && typeof s.id === "string"));
  ok("r.multi.sites are NOT {site} wrappers", r.multi.sites.every(s => s.site === undefined));
}
```

- [ ] **Step 7: Run the full suite and commit**

```bash
git add app/app.js app/index.html app/case-url.js test/case-url.test.js test/app-smoke.test.js
git commit -m "feat(app): pin candidate sites to compare a pair; p= case-URL key"
```

---

### Task 12: The Together card

**Files:**
- Modify: `app/app.js` (`renderResults()` at :182-187, new `togetherCard()`)
- Modify: `app/index.html` (CSS)

**Interfaces:**
- Consumes: `unifyingDiagnoses`, `forcingFindings` (Tasks 6-7); `combinedSites()` (Task 11)

- [ ] **Step 1: Add the card function**

In `app/app.js`, import at the top:

```js
import { unifyingDiagnoses, forcingFindings } from "../src/engine/multifocal.js";
```

Add after `whereCard()`:

```js
// ② Together — the cross-site view. PARSIMONY FIRST: the card's first job is to try to talk you out of a
// multifocal claim, because a localising sign entered on the wrong side is the one real path to
// over-calling. The disease list comes second, framed conditionally.
function togetherCard(r, list) {
  const { sites, source } = combinedSites(r, list);
  if (sites.length < 2) return "";

  const ff = forcingFindings(S.tokens, { dominantSide: S.dominant, sensoryLevel: S.sensoryLevel || undefined });
  const guard = ff.findings.length
    ? `<div class="multi" style="border-color:var(--gold)"><b>Check this first.</b> This is multifocal only because of ${ff.findings.map(t => `<code>${esc(t)}</code>`).join(", ")}. If that sign is uncertain, re-check it${ff.collapsesTo ? ` — without it, a single ${esc(siteName(ff.collapsesTo))} lesion explains everything` : ""}.</div>`
    : `<div class="annot"><b>Several findings independently require a second site</b> — no single observation is carrying the multifocal claim.</div>`;

  const srcLine = `<div class="annot">Showing <b>${source === "pinned" ? "your selection" : "the engine's minimal cover"}</b>: ${sites.map(s => esc(siteName(s))).join(" + ")}.${source === "cover" ? " Pin two sites in the list above to test a different pair." : ""}</div>`;

  const u = unifyingDiagnoses(sites, S.tokens, { onset: S.onset || undefined, course: S.course || undefined });
  const row = e => `<div class="cause${e.red ? " red" : ""}"><b>${esc(e.name)}</b>${e.red ? ` <span class="rf">RED</span>` : ""} — ${esc(e.feature)}${e.confirm ? `<div class="pathog">🔎 Confirm on exam: ${esc(e.confirm)}</div>` : ""}<div class="dloc">${e.why.map(w => esc(w.satisfiedBy.id ? siteName(w.satisfiedBy) : "")).filter(Boolean).join(" · ")}</div></div>`;

  const fits = u.concordant.length
    ? u.concordant.map(row).join("")
    : `<div class="empty">No catalogued cross-site process fits this combination — which is itself informative: consider two unrelated lesions.</div>`;

  // Soft-axis mismatches DEMOTE, they never drop (owner ruling). The band names WHICH axis missed and what
  // would have to be true.
  const axisLabel = es => {
    const axes = [...new Set(es.flatMap(e => e.demotions.map(d => d.axis)))];
    return axes.length === 2 ? "tempo and course" : axes[0] === "course" ? "the course" : "the tempo";
  };
  const disc = u.discordant.length
    ? `<details style="margin-top:6px"><summary style="font-size:11.5px;color:var(--muted)">Less likely given ${esc(axisLabel(u.discordant))} <span class="c">${u.discordant.length}</span></summary>
        ${u.discordant.map(e => `${row(e)}<div class="annot">${e.demotions.map(d => `You entered <b>${esc(d.entered)}</b>; this is typically ${d.expected.map(esc).join(" / ")}.`).join(" ")}</div>`).join("")}</details>`
    : "";

  return card(`Together <span class="oc-n">(${sites.length} sites)</span>`, guard + srcLine + fits + disc);
}
```

- [ ] **Step 2: Insert it into the render**

In `renderResults()`, change the card assembly (line 184-187) to:

```js
    + whereCard(list, cands, total, r)
    + togetherCard(r, list)
    + whyCard(tf, sel, total)
    + whatCard(sel.site)
    + nextCard(sel.site);
```

- [ ] **Step 3: Verify in the browser — this is where the real bugs are**

Start the server (never via Bash — use the preview tooling) and load a genuinely multifocal case:

```
http://localhost:8137/app/#f=<wallenberg+L5 tokens>
```

Generate the token string with:

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node -e "
Promise.all([import('./src/engine/inverse.js'),import('./src/engine/forward.js')]).then(([i,f])=>{
  const s=id=>i.candidateSites().find(x=>x.id===id);
  const t=[...f.expectedFindings(s('left_medulla_lateral')),...f.expectedFindings(s('right_root_l5'))];
  console.log('#f='+t.map(encodeURIComponent).join(','));})"
```

Confirm: the Together card renders; the guard line names a finding; the source line says "the engine's minimal cover"; pinning two other rows switches it to "your selection".

> **Gotchas from previous sessions:** the passphrase gate needs BOTH the passphrase (`NeuroLocaliser`) AND
> the safety checkbox, or submit silently fails. The case hash only restores on LOAD, so set
> `location.hash` then `location.reload()`. The in-app browser serves CACHED ES modules —
> `location.reload(true)` is needed to pick up app.js changes. Screenshots come back blank after scrolling
> on this tall page; slice `document.body.innerText` instead.

- [ ] **Step 4: Run the full suite and commit**

```bash
git add app/app.js app/index.html
git commit -m "feat(app): Together card — parsimony guard, sites, unifying diagnoses"
```

---

### Task 13: Scope toggle on What and Next

**Files:**
- Modify: `app/app.js` (`whatCard()`, `whatBlock()`, `nextCard()`)

**Interfaces:**
- Consumes: `combinedCauses`, `combinedNextSteps` (Tasks 8-9); `combinedSites()` (Task 11)
- Produces: `S.scope` — `"site"` (default) or `"all"`

- [ ] **Step 1: Add the state and the toggle**

In `app/app.js`, add `scope:"site"` to `S`. Add a toggle helper:

```js
// Merged causes/workup render through the cards that already OWN that presentation, rather than a third
// rendering of the category dots that could drift out of sync.
function scopeToggle(n) {
  return `<div class="scope"><button class="sc${S.scope==="site"?" on":""}" data-scope="site">This site</button><button class="sc${S.scope==="all"?" on":""}" data-scope="all">All ${n} sites</button></div>`;
}
```

Wire the handler at the end of `renderResults()`, alongside the `difflist` handler:

```js
  const el2 = document.getElementById("results");
  el2.querySelectorAll("[data-scope]").forEach(b => {
    b.onclick = () => { S.scope = b.dataset.scope; renderResults(); };
  });
```

- [ ] **Step 2: Branch `whatCard()` and `nextCard()`**

In `whatCard(site)`, change the signature to `whatCard(site, r, list)` and branch:

```js
function whatCard(site, r, list) {
  const { sites } = combinedSites(r, list);
  const toggle = sites.length >= 2 ? scopeToggle(sites.length) : "";
  if (sites.length >= 2 && S.scope === "all") {
    const cc = combinedCauses(sites, { onset: S.onset || undefined });
    const shared = cc.shared.length
      ? cc.shared.map(s => `<div class="cause${s.red?" red":""}"><b>${esc(s.name)}</b>${s.red?` <span class="rf">RED</span>`:""} <span class="dloc">at ${s.count} of ${sites.length} sites</span>${s.feature?` — ${esc(s.feature)}`:""}</div>`).join("")
      : `<div class="empty">No cause is plausible at more than one of these sites — which argues for two unrelated processes.</div>`;
    return card(`What <span class="oc-n">(all sites)</span>`, toggle + shared);
  }
  return card("What", toggle + whatBlock(site));
}
```

`nextCard()` currently calls `nextStepsFor(site)` and renders the result inline. Split the rendering out so both scopes use **one** renderer, then branch only on which object is fed in:

```js
function nextCard(site, r, list) {
  const { sites } = combinedSites(r, list);
  const combined = sites.length >= 2 && S.scope === "all";
  const nx = combined ? combinedNextSteps(sites) : nextStepsFor(site);
  const toggle = sites.length >= 2 ? scopeToggle(sites.length) : "";
  const cap = combined ? `Next steps <span class="oc-n">(all sites)</span>` : "Next steps";
  return card(cap, toggle + nextBlock(nx));
}
```

Move the existing body of `nextCard()` into a new `nextBlock(nx)` that takes the workup object and returns the four-tier HTML **unchanged** — it already reads only `nx.immediate`, `nx.investigations`, `nx.confirmatory`, `nx.monitoring`, `nx.urgency` and `nx.referral`, all of which `combinedNextSteps()` returns with the same names and types. Do not write a second renderer.

Update the call sites in `renderResults()`:

```js
    + whatCard(sel.site, r, list)
    + nextCard(sel.site, r, list);
```

Add the imports at the top of `app/app.js`:

```js
import { combinedCauses } from "../src/data/causes.js";
import { combinedNextSteps } from "../src/data/nextSteps.js";
```

- [ ] **Step 3: Add the CSS**

In `app/index.html`:

```css
.scope { display:flex; gap:4px; margin-bottom:6px; }
.sc { font-size:11px; padding:2px 8px; border:1px solid var(--line); background:none; border-radius:10px; cursor:pointer; color:var(--muted); }
.sc.on { background:var(--navy-2); color:#fff; border-color:var(--navy-2); }
```

- [ ] **Step 4: Verify in the browser**

Load the multifocal case, switch the What card to "All 2 sites", confirm shared causes render with their "at N of M sites" counts, and that Next shows the **most urgent** urgency (emergency for a cord site), not the nerve site's.

- [ ] **Step 5: Run the full suite and commit**

```bash
git add app/app.js app/index.html
git commit -m "feat(app): scope toggle — merged causes and workup in the What/Next cards"
```

---

### Task 14: Documentation and handover

**Files:**
- Modify: `CLAUDE.md` (parked follow-up #1), `CONTRIBUTING.md` (the multifocal roadmap line), `README.md`
- Modify: `docs/superpowers/plans/2026-08-14-multi-location-ddx.md` (mark implemented)

- [ ] **Step 1: Update CLAUDE.md**

Remove **"Multi-location DDx synthesis"** from the parked follow-ups list and add a section describing what shipped: the four new files, the hard-filter/soft-demote rule, the parsimony guard, pinning, and that the roster is clinical content requiring sign-off. Follow the shape of the existing "Differential-depth sweep" section.

- [ ] **Step 2: Update CONTRIBUTING.md**

Replace the "**Multifocal**: already works via minimal-set cover; extend to weigh 'one disease hitting many sites'…" bullet with a note that this is now built, pointing at the spec.

- [ ] **Step 3: Mark the plan implemented**

Change this plan's `**Status:**` line to `implemented YYYY-MM-DD`.

- [ ] **Step 4: Full suite + final in-browser pass**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test` → `0 failed`

Drive the app one last time: single-lesion case (no Together card), multifocal case (card present, guard names a finding), pin a different pair (label changes to "your selection"), set a clashing course (entities move to the discordant band, none disappear), and toggle What/Next to "All sites".

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md CONTRIBUTING.md README.md docs/superpowers/plans/2026-08-14-multi-location-ddx.md
git commit -m "docs: multi-location DDx layer is built"
```

---

## Review gate before merge

**Do not merge to `main` without offering the owner the clinical review**, exactly as the A–H region reviews were offered:

1. **The 13 roster entities** (Task 5) — present as a table: name · what makes it fire · discriminating feature · red flag.
2. **The `LOCALISING` promote/excuse split** (Task 2) — 15 promotions and 6 excusals, each with its reason. This one changes localisation behaviour, so it carries more risk than the roster.

The owner has previously chosen to merge before completing a review gate. That is their call to make again — but the gate must be offered, not assumed.

# Content-gap fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status: NOT STARTED.** Implements every ruling of round 1 in
`docs/superpowers/specs/2026-11-01-content-gaps-design.md` (owner: *"Approve as written"*, 2026-11-01). Row 5 is
deferred to the plexus round and is NOT built.

**Goal:** Fix the 16 counted clinical-audit checks of this round (and the striatocapsular ranking check) by adding the
approved content rows, the `pyramidal` matching relation and the dominance fallback, with the card wording that goes
with them.

**Architecture:** Nine one-finding structure rows; three small composite changes in `sites.js`; one new relation in the
word-families table (matched in `src/engine/families.js`, never rewriting the entered word); one solver step in
`solveOne` (the dominance fallback, before the same-family near-fit), whose result the card and the app read. Every
number to reproduce is in the spec's §5. Prototype flags for each task live in
`/Users/jaydenwearne/Library/Application Support/Claude/side-session-notes/local_41ab95b6-0719-4b24-a5ff-a2935dab7f26/content-gaps-prototype/lib.mjs`.

**Tech stack:** zero-dependency ES modules, Node 24, standalone test scripts (`ok(label, cond)`, `process.exit`).

## Global constraints

- Node is not on PATH: prefix every command with `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"`.
- Work in `/Users/jaydenwearne/Desktop/Personal/Claude Code/Projects/NeuroLocaliser/Code/neurolocaliser-content`
  (branch `fix/content-gaps`). Never push; no PR.
- `npm run test:audit` is NOT part of `npm test`; never wire it in and never loosen an audit assertion.
- Site ids never change (the audit's regexes pin them). A structure produces exactly one finding.
- The owner's wording is used verbatim where the spec gives it (rows 14, 16, 17 and the structure notes in row 20).
- No CSS changes (the `--terra` allowlist in `test/brand.test.js` is untouched).
- Re-pin ONLY the assertions listed in the spec's row 18. Any other failing assertion is a bug in the change.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## File map

| File | Change | Task |
|---|---|---|
| `test/content-gaps.test.js` | **new** suite pinning rows 1–17 and the guards | 1–6 |
| `package.json` | append `node test/content-gaps.test.js` to `test` | 1 |
| `src/model/structures.js` | nine rows | 1, 2, 3 |
| `src/model/sites.js` | `composePlexusSites` `nerves`; `DIVISION.fusiform`; thalamic-aphasia composite + `thal_ataxia` | 1, 3 |
| `src/engine/score.js` | the `LOCALISING` comment on the ulnar claw | 1 |
| `src/model/families.js`, `src/engine/families.js` | the `leg_foot` family, relation `pyramidal` | 4 |
| `src/engine/inverse.js` | the dominance fallback in `solveOne`; `r.dominance` | 5 |
| `app/answer.js`, `app/app.js` | read the assumed dominance; the row-14 sentence; red flag follows dominance | 5 |
| `src/model/findings.js`, `src/data/syndromes.js` | rows 16 and 17 wording | 6 |
| `docs/artifacts/anatomy-model.html` | nine rows (row 20) | 6 |
| `test/nerve-segments.test.js`, `test/motor-unit.test.js`, `test/cranial-nerves.test.js`, `test/engine.test.js`, `test/subcortex.test.js` | the row-18 re-pins | 1, 2, 3 |
| `test/clinical-audit.test.js`, `docs/superpowers/specs/2026-10-18-clinical-audit-suite.md` | three probes (row 19) and their record | 7 |
| `CLAUDE.md`, the spec, `Code/.claude/launch.json` | docs, status, a preview entry | 8 |

---

### Task 1: Roots, plexus and nerves (rows 1–4) + the new suite

**Files:**
- Create: `test/content-gaps.test.js`
- Modify: `package.json` (the `test` script), `src/model/structures.js` (three rows), `src/model/sites.js`
  (`composePlexusSites`), `src/engine/score.js` (one comment), `test/nerve-segments.test.js:51-53` (re-pin)

**Interfaces:**
- Produces: `test/content-gaps.test.js` with helpers `ok`, `T`, `SITE`, `predicts(id, token, opts)`,
  `first(tokens, opts)`, `ids(r)` that later tasks append sections to, ABOVE the final report block.

- [ ] **Step 1: Write the failing suite (section A)**

Create `test/content-gaps.test.js`:

```js
// content-gaps.test.js — the content-gap fixes (owner-ruled 2026-11-01; spec
// docs/superpowers/specs/2026-11-01-content-gaps-design.md). Pins each approved row, and the guards the spec's §6 lists
// as unchanged by design. Run: node test/content-gaps.test.js
import { solve, candidateSites } from "../src/engine/inverse.js";
import { expectedFindings } from "../src/engine/forward.js";
import { unifyingDiagnoses } from "../src/engine/multifocal.js";
import { STRUCTURES } from "../src/model/structures.js";

let pass = 0, fail = 0;
const ok = (label, cond, detail = "") => { cond ? pass++ : fail++; console.log((cond ? "PASS  " : "FAIL  ") + label + (cond ? "" : `  ${detail}`)); };
const T = s => new Set(s.split(/\s+/).filter(Boolean));
const SITE = Object.fromEntries(candidateSites().map(s => [s.id, s]));
const predicts = (id, tok, opts = {}) => expectedFindings(SITE[id], opts).has(tok);
const ids = r => r.display.map(c => c.site.id);
const first = (toks, opts = {}) => ids(solve(T(toks), opts))[0];

// ---- A. Roots, plexus and nerves (rows 1–4) ----
const ULNAR_ELBOW = "ulnar_sensory@left ulnar_dorsal_sensory@left weak_finger_abduction@left ulnar_claw@left";
ok("row 1: the ulnar nerve at the elbow gives the claw", predicts("left_nerve_ulnar_elbow", "ulnar_claw@left"));
{ const r = solve(T(ULNAR_ELBOW));
  ok("row 1: claw + dorsal-hand sensory loss → the elbow, one lesion", ids(r)[0] === "left_nerve_ulnar_elbow" && r.multi === null, `${ids(r)[0]} multi=${!!r.multi}`); }
ok("row 1 guard: Guyon (dorsal sensation not entered) still leads with the wrist",
   first("ulnar_sensory@left weak_finger_abduction@left ulnar_claw@left") === "left_nerve_ulnar_wrist");
ok("row 2: the C6 root gives the biceps jerk (C5/6)", predicts("left_root_c6", "reflex_biceps_loss@left"));
ok("row 2: C6 radiculopathy → the C6 root first",
   first("sensory_c6@left reflex_biceps_loss@left reflex_brachioradialis_loss@left weak_elbow_flexion@left radicular_pain@left") === "left_root_c6");
ok("row 2 guard: C5 radiculopathy still leads with the C5 root",
   first("sensory_c5@left weak_shoulder_abduction@left weak_elbow_flexion@left reflex_biceps_loss@left radicular_pain@left") === "left_root_c5");
ok("row 3: the L4 root gives the adductors (obturator, L2–4)", predicts("left_root_l4", "weak_hip_adduction@left"));
ok("row 3: knee extension + adduction + knee jerk + L4 dermatome → the L4 root first (R1 #4)",
   first("weak_knee_extension@left weak_hip_adduction@left reflex_knee_loss@left sensory_l4@left") === "left_root_l4");
ok("row 3 guard: L3 radiculopathy still leads with the L3 root",
   first("sensory_l3@left weak_knee_extension@left weak_hip_adduction@left reflex_knee_loss@left") === "left_root_l3");
ok("row 4: the upper trunk carries the axillary sensory row (deltoid patch)", predicts("left_plexus_upper_trunk", "axillary_sensory@left"));
ok("row 5 deferred: the upper trunk does not yet carry musculocutaneous sensation (plexus round)",
   !predicts("left_plexus_upper_trunk", "musculocutaneous_sensory@left"));
{ const r = solve(T("weak_shoulder_abduction@left weak_elbow_flexion@left weak_shoulder_external_rotation@left reflex_biceps_loss@left axillary_sensory@left"));
  ok("row 4: Erb with deltoid-patch numbness → the upper trunk, one lesion", ids(r)[0] === "left_plexus_upper_trunk" && r.multi === null, `${ids(r)[0]} multi=${!!r.multi}`); }
ok("row 4 guard: an axillary neuropathy still leads with the axillary nerve",
   first("axillary_sensory@left weak_shoulder_abduction@left") === "left_nerve_axillary");

// ---- report ----
console.log(`\nNeuroLocaliser — content-gap fixes (round 1)\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run it to see it fail**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/content-gaps.test.js`
Expected: 8 of the 13 lines FAIL (the eight row lines); the five guards (Guyon, C5, L3, axillary, row 5 deferred) pass;
exit 1.

- [ ] **Step 3: Add the three rows to `src/model/structures.js`**

After the line `  { id: "uln_el_dsens",  level: "nerve", part: "ulnar_elbow", produces: "ulnar_dorsal_sensory", note: "ulnar (elbow) — dorsal ulnar cutaneous" },` insert:

```js
  // ADDED 2026-11-01 (content-gap fix, row 1, owner-approved): the ulnar paradox is about DEGREE — the claw is milder
  // at the elbow because FDP 4/5 is weak too, but it is there. Dorsal-hand sensation and FDP/FCU weakness are what
  // separate elbow from wrist.
  { id: "uln_el_claw",   level: "nerve", part: "ulnar_elbow", produces: "ulnar_claw", note: "ulnar (elbow) — claw, usually milder than at the wrist because FDP 4/5 is weak too (the ulnar paradox)" },
```

After `  { id: "root_c6_reflex", level: "root", part: "c6", produces: "reflex_brachioradialis_loss", note: "brachioradialis (supinator) jerk (C6)" },` insert:

```js
  { id: "root_c6_biceps", level: "root", part: "c6", produces: "reflex_biceps_loss", note: "biceps jerk (C5/6)" }, // content-gap fix, row 2
```

After `  { id: "root_l4_inv",    level: "root", part: "l4", produces: "weak_foot_inversion", note: "L4 — tibialis posterior" },` insert:

```js
  { id: "root_l4_hipadd", level: "root", part: "l4", produces: "weak_hip_adduction", note: "L4 — adductors (obturator, L2–4)" }, // content-gap fix, row 3
```

- [ ] **Step 4: Give the upper trunk the axillary sensory row (`src/model/sites.js`, `composePlexusSites`)**

Replace `    { part: "upper_trunk",   segs: ["c5", "c6"], terr: "brachial plexus upper trunk (C5-6) — Erb's palsy" },` with:

```js
    // The upper trunk also carries the axillary nerve's cutaneous fibres — the deltoid patch a clinician tests (content-gap
    // fix, row 4). The musculocutaneous row waits for the plexus round (row 5, deferred).
    { part: "upper_trunk",   segs: ["c5", "c6"], nerves: ["axil_sens"], terr: "brachial plexus upper trunk (C5-6) — Erb's palsy" },
```

and replace `    const structures = structuresForRoots(g.segs);` with:

```js
    const structures = [...structuresForRoots(g.segs), ...(g.nerves || [])]; // nerve rows are REUSED, as the cords reuse them
```

- [ ] **Step 5: Correct the `LOCALISING` comment (`src/engine/score.js`)**

Replace `  // nerve-segment cutaneous branches + the ulnar claw — each pins a nerve SEGMENT (level). Movements` with:

```js
  // nerve-segment cutaneous branches pin a nerve SEGMENT (level); the ulnar claw pins the ulnar nerve (elbow or wrist —
  // content-gap fix, row 1: the dorsal branch and FDP/FCU decide which). Movements
```

- [ ] **Step 6: Re-pin `test/nerve-segments.test.js:51-53` (row 18)**

Replace:

```js
ok("ulnar_elbow has FDP + dorsal sensory, NO claw",
   nerveOf("ulnar_elbow").includes("weak_finger_flexion") && nerveOf("ulnar_elbow").includes("ulnar_dorsal_sensory") &&
   !nerveOf("ulnar_elbow").includes("ulnar_claw"));
```

with:

```js
// The claw is milder at the elbow (FDP 4/5 weak too — the paradox), but present: owner ruling 2026-11-01, content-gap
// fix row 1. Dorsal sensation and FDP/FCU separate the levels.
ok("ulnar_elbow has FDP + dorsal sensory, and a (milder) claw",
   nerveOf("ulnar_elbow").includes("weak_finger_flexion") && nerveOf("ulnar_elbow").includes("ulnar_dorsal_sensory") &&
   nerveOf("ulnar_elbow").includes("ulnar_claw"));
```

- [ ] **Step 7: Add the suite to `package.json`**

In the `test` script, replace the tail `&& node test/false-multifocal.test.js"` with
`&& node test/false-multifocal.test.js && node test/content-gaps.test.js"`.

- [ ] **Step 8: Run the suite, the touched suites, and the PNS suites**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/content-gaps.test.js && node test/nerve-segments.test.js && node test/pns.test.js && node test/pns-nerves.test.js && node test/tier2-pns-depth.test.js && node test/cord-segment.test.js`
Expected: all PASS, exit 0. Then `npm test` must be green apart from nothing (no other suite changes in this task).

- [ ] **Step 9: Commit**

```bash
git add test/content-gaps.test.js package.json src/model/structures.js src/model/sites.js src/engine/score.js test/nerve-segments.test.js
git commit -m "feat(pns): the elbow's claw, the C6 biceps jerk, the L4 adductors, the upper trunk's deltoid patch (rows 1-4)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Motor unit, carotid space and AICA's inner ear (rows 6–8)

**Files:**
- Modify: `src/model/structures.js` (four rows), `test/content-gaps.test.js` (section B),
  `test/motor-unit.test.js:36-37,78-79,110`, `test/cranial-nerves.test.js:94`, `test/engine.test.js` (the `check`
  helper and the Marie-Foix call)

**Interfaces:**
- Consumes: the Task 1 helpers. Produces: no new names.

- [ ] **Step 1: Append section B to the suite (above `// ---- report ----`)**

```js
// ---- B. Motor unit, carotid space, AICA (rows 6–8) ----
ok("row 6: the anterior horn's bulbar neurones give the tongue, both sides",
   predicts("motor_unit_anterior_horn", "cn12_palsy@left") && predicts("motor_unit_anterior_horn", "cn12_palsy@right"));
{ const r = solve(T("cn12_palsy@left cn12_palsy@right dysarthria@none dysphagia@left dysphagia@right fasciculations@left fasciculations@right"));
  ok("row 6: bulbar ALS → the anterior horn, one lesion (R1 #3)", ids(r)[0] === "motor_unit_anterior_horn" && r.multi === null); }
ok("row 6 guard: a one-sided XII palsy still leads with the hypoglossal canal", first("cn12_palsy@left") === "left_skull_base_hypoglossal_canal");
{ const set = T("fasciculations@left fasciculations@right wasting@left wasting@right hyperreflexia@left hyperreflexia@right babinski@left babinski@right dysarthria@none");
  const r = solve(set);
  ok("row 6 guard: UMN + LMN still names motor neurone disease (R1 #2)", !!r.multi && /Motor neurone/.test(unifyingDiagnoses(r.multi.sites, set, {}).concordant[0]?.name || "")); }
ok("row 7: the carotid space gives a XII palsy", predicts("left_skull_base_carotid_space", "cn12_palsy@left"));
ok("row 7: Horner + XII → the carotid space first (dissection)", first("miosis@left ptosis@left cn12_palsy@left") === "left_skull_base_carotid_space");
ok("row 7 guard: Collet-Sicard still leads with Collet-Sicard",
   first("gag_afferent_loss@left palatal_weakness@left vocal_cord_palsy@left weak_scm@left weak_trapezius@left cn12_palsy@left") === "left_skull_base_collet_sicard");
ok("row 7 guard: Horner alone still leads with the carotid space", first("miosis@left ptosis@left") === "left_skull_base_carotid_space");
ok("row 8: AICA's inner-ear rows (abnormal head impulse, peripheral nystagmus)",
   predicts("left_pons_lateral", "head_impulse_abnormal@none") && predicts("left_pons_lateral", "nystagmus_peripheral@none"));
{ const r = solve(T("cn8_vertigo@left hearing_loss@left nystagmus_peripheral@none head_impulse_abnormal@none"));
  ok("row 8: HINTS-plus → labyrinth first, AICA (lateral pons) in the top 3 (R1 #9)",
     ids(r)[0] === "left_peripheral_vestibular_labyrinth" && ids(r).slice(0, 3).includes("left_pons_lateral"), ids(r).slice(0, 3).join(", ")); }
{ const r = solve(T("cn8_vertigo@left hearing_loss@left facial_weakness@left forehead_involved@left limb_ataxia@left head_impulse_abnormal@none"));
  ok("row 8: AICA picture + abnormal head impulse → the lateral pons, one lesion", ids(r)[0] === "left_pons_lateral" && r.multi === null); }
ok("row 8 guard (the accepted cost): vestibular neuritis still leads with the labyrinth",
   first("cn8_vertigo@left nystagmus_peripheral@none head_impulse_abnormal@none") === "left_peripheral_vestibular_labyrinth");
ok("row 8 guard: a central AVS still leads with the central vestibular nucleus",
   first("cn8_vertigo@left nystagmus_gaze_evoked@none skew_deviation@none") === "left_central_vestibular_nucleus");
```

- [ ] **Step 2: Run it to see section B fail** — `node test/content-gaps.test.js`; expected FAIL on the 7 row lines
  (not the guards); exit 1.

- [ ] **Step 3: Add the four rows (`src/model/structures.js`)**

After `  { id: "ah_bulbar_dysar", level: "motor_unit", part: "anterior_horn", produces: "dysarthria",\n    note: "bulbar motor neurones (progressive bulbar palsy) — dysarthria (LMN)" },` insert:

```js
  { id: "ah_bulbar_tongue", level: "motor_unit", part: "anterior_horn", produces: "cn12_palsy",
    note: "bulbar motor neurones (hypoglossal nuclei) — tongue weakness, wasting and fasciculation (LMN)" }, // content-gap fix, row 6
```

After `  { id: "car_symp_ptosis", level: "skull_base", part: "carotid_space", produces: "ptosis",\n    note: "cervical sympathetic (carotid space) — partial ptosis" },` insert:

```js
  // ADDED 2026-11-01 (content-gap fix, row 7): XII crosses the internal carotid below the skull base — the commonest
  // cranial nerve palsy in carotid dissection. Painful Horner + XII is dissection until shown otherwise.
  { id: "car_cn12", level: "skull_base", part: "carotid_space", produces: "cn12_palsy",
    note: "the hypoglossal nerve where it crosses the internal carotid — the commonest cranial nerve palsy in carotid dissection" },
```

After `  { id: "cochlear_pons", level: "pons", part: "lateral", produces: "hearing_loss",\n    note: "cochlear nuclei / labyrinthine artery (an AICA branch) — IPSI sensorineural deafness" },` insert:

```js
  // ADDED 2026-11-01 (content-gap fix, row 8): an AICA infarct reaching the inner ear breaks the VOR like a peripheral
  // lesion — why HINTS-plus asks about hearing. Accepted cost (owner ruling): AICA is an "also fits" for every
  // peripheral-HINTS picture, with or without hearing loss.
  { id: "lab_art_hit", level: "pons", part: "lateral", produces: "head_impulse_abnormal",
    note: "labyrinthine artery (an AICA branch) — inner-ear infarct: the head impulse is abnormal, as in a peripheral lesion (why HINTS-plus asks about hearing)" },
  { id: "lab_art_nyst", level: "pons", part: "lateral", produces: "nystagmus_peripheral",
    note: "labyrinthine artery — inner-ear infarct: peripheral-type nystagmus" },
```

- [ ] **Step 4: Re-pin `test/motor-unit.test.js` (row 18, three places)**

Lines 36-37 — replace the expected list with one that includes the tongue:

```js
ok("anterior_horn -> lmn_weakness + fasciculations + bulbar (dysphagia+dysarthria+tongue) + hypotonia + wasting (PURE LMN)",
   eq(muOf("anterior_horn"), ["cn12_palsy","dysphagia","dysarthria","fasciculations","hypotonia","lmn_weakness","wasting"].sort()));
```

Lines 77-80 — read the displayed answer:

```js
// The DISPLAYED answer: since the anterior horn gives the tongue (content-gap fix, row 6), one more bilateral prediction
// takes this picture's scored `best` below zero; the display, which the app shows, is unchanged.
{
  const r = solve(bilat("lmn_weakness", "fasciculations"));
  ok("pure-LMN (weakness + fasciculations) -> anterior horn (displayed answer)", r.display[0]?.site.id === "motor_unit_anterior_horn");
}
```

Line 110 — fall back to the displayed answer when the scored `best` is empty:

```js
  const name = set => { const r = solve(set); return nameForSite((r.best || r.display[0]).site).name; }; // content-gap fix row 6
```

- [ ] **Step 5: Re-pin `test/cranial-nerves.test.js:94` (row 18)**

```js
ok("carotid_space -> Horner + XII (content-gap fix, row 7)", eq(baseOf("carotid_space"), ["cn12_palsy","miosis","ptosis"]));
```

- [ ] **Step 6: Re-pin the Marie-Foix check in `test/engine.test.js` (row 18)**

In `check`, change `const { best, single, multi, singleExplainsAll } = solve(observedSet);` to
`const { best, single, multi, singleExplainsAll, explainAll } = solve(observedSet);` and, after the
`singleShouldExplainAll` block, add:

```js
  // The emergence claim, where two places explain the picture and the prior picks between them.
  if (opts.explainedBy) ok = ok && explainAll.some(c => c.site.id === opts.explainedBy);
```

Replace the Marie-Foix call with:

```js
// The lateral pons explains all four (the emergence claim). Which of the two places explaining them leads is the prior's
// job: the lateral medulla is COMMON (owner ruling 2026-09-26) and was already the displayed answer; since AICA's
// inner-ear rows (content-gap fix, row 8) it is the scored best too.
check("Lateral pons (Marie-Foix: L ataxia + R body STT + L vertigo)",
  ["limb_ataxia@left", "spinothalamic@right", "cn8_vertigo@left", "nystagmus_gaze_evoked@none"],
  "left_pons_lateral", { anySite: true, explainedBy: "left_pons_lateral" });
```

- [ ] **Step 7: Run** `node test/content-gaps.test.js && node test/motor-unit.test.js && node test/cranial-nerves.test.js && node test/engine.test.js && node test/vestibular-hints.test.js && node test/tier2-brainstem.test.js`
  Expected: all PASS. Then `npm test`: green.

- [ ] **Step 8: Commit**

```bash
git add src/model/structures.js test/content-gaps.test.js test/motor-unit.test.js test/cranial-nerves.test.js test/engine.test.js
git commit -m "feat(engine): the tongue in bulbar MND, XII in the carotid space, AICA's inner ear (rows 6-8)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: PCA, wrong-way eyes, thalamic hemiataxia (rows 10–12)

**Files:**
- Modify: `src/model/sites.js` (`DIVISION`; `composeAphasiaSites` `thalamic`), `src/model/structures.js` (two rows),
  `test/content-gaps.test.js` (section C), `test/subcortex.test.js` (three re-pins)

- [ ] **Step 1: Append section C to the suite**

```js
// ---- C. PCA, wrong-way eyes, thalamus (rows 10–12) ----
ok("row 10: the left (dominant) PCA gives alexia without agraphia", predicts("left_cortex_pca", "alexia_without_agraphia@none"));
ok("row 10: the right (non-dominant) PCA gives prosopagnosia", predicts("right_cortex_pca", "prosopagnosia@none"));
{ const r = solve(T("homonymous_hemianopia@right alexia_without_agraphia@none"));
  ok("row 10: alexia without agraphia + right hemianopia → the left PCA, one lesion", ids(r)[0] === "left_cortex_pca" && r.multi === null); }
{ const r = solve(T("homonymous_hemianopia@left prosopagnosia@none"));
  ok("row 10: left hemianopia + prosopagnosia → the right PCA, one lesion", ids(r)[0] === "right_cortex_pca" && r.multi === null); }
ok("row 10 guard: an isolated right hemianopia still leads with the occipital cortex", first("homonymous_hemianopia@right") === "left_cortex_occipital");
ok("row 11: an acute right PPRF lesion leaves the eyes deviated LEFT (toward the hemiparesis)", predicts("right_pons_medial", "gaze_deviation@left"));
{ const r = solve(T("gaze_deviation@left weak_arm@left weak_leg@left"));
  ok("row 11: wrong-way eyes → the right pons, one lesion", ids(r)[0] === "right_pons_medial" && r.multi === null, `${ids(r)[0]} multi=${!!r.multi}`); }
ok("row 11 guard: right-way eyes (gaze right + left hemiparesis + face) still lead with the right MCA",
   first("gaze_deviation@right weak_arm@left weak_leg@left facial_weakness@left forehead_spared@left") === "right_cortex_mca");
ok("row 12: the thalamus gives contralateral hemiataxia", predicts("left_subcortex_thalamus", "limb_ataxia@right"));
ok("row 12: the hand-listed thalamic-aphasia composite carries the same row (the B11 trap)",
   SITE["thalamic_aphasia_left"].structures.includes("thal_ataxia"));
ok("row 12: hemisensory loss + hemiataxia + face → the thalamus first",
   first("spinothalamic@right dorsal_sensory@right face_sensory_loss@right limb_ataxia@right") === "left_subcortex_thalamus");
ok("row 12 guard: a pure sensory stroke still leads with the thalamus",
   first("spinothalamic@right dorsal_sensory@right face_sensory_loss@right") === "left_subcortex_thalamus");
ok("row 12 guard: hemibody pain loss alone still leads with the thalamus", first("spinothalamic@left") === "right_subcortex_thalamus");
ok("row 12 guard: face + body pain loss on one side still leads contralaterally",
   /^right_(subcortex_(thalamus|sensorimotor)|thalamus_vpm|midbrain_lateral)$/.test(first("face_pain_loss@left spinothalamic@left") || ""));
```

- [ ] **Step 2: Run to see section C fail** (expected FAIL on the 9 row lines).

- [ ] **Step 3: `src/model/sites.js` — the fusiform is PCA territory**

Replace `  occipital:      { territory: "PCA" },` with:

```js
  occipital:      { territory: "PCA" },
  // The ventral occipitotemporal (fusiform) gyrus is PCA territory (P4, as vascular.js already says) — content-gap fix,
  // row 10: the dominant PCA gives alexia without agraphia, the non-dominant prosopagnosia.
  fusiform:       { territory: "PCA" },
```

- [ ] **Step 4: `src/model/structures.js` — two crossed rows**

After `  { id: "pprf",           level: "pons", part: "medial",  produces: "gaze_palsy",\n    note: "paramedian pontine reticular formation / lateral gaze centre" },` insert:

```js
  // ADDED 2026-11-01 (content-gap fix, row 11): the eyes look toward a frontal lesion and AWAY from a pontine one.
  { id: "pprf_deviation", level: "pons", part: "medial", produces: "gaze_deviation", crosses: true,
    note: "PPRF / abducens nucleus, acute — the eyes rest deviated away from the lesion, toward the hemiparesis ('wrong-way eyes')" },
```

After `  { id: "thal_face", level: "subcortex", part: "thalamus", produces: "face_sensory_loss",\n    note: "VPM beside VPL — contralateral facial sensory loss (the pure-sensory lacune is face-arm-leg)" },` insert:

```js
  // ADDED 2026-11-01 (content-gap fix, row 12): the thalamogeniculate territory reaches the ventral lateral nucleus — the
  // cerebellar relay, already crossed in the midbrain (as scp_midbrain), so the hemiataxia is contralateral. The ONE
  // subcortex row with a crossing override (subcortex.test.js names it).
  { id: "thal_ataxia", level: "subcortex", part: "thalamus", produces: "limb_ataxia", crosses: true,
    note: "ventral lateral nucleus beside VPL (thalamogeniculate territory) — the cerebellar relay, already crossed in the midbrain: contralateral hemiataxia" },
```

- [ ] **Step 5: `src/model/sites.js` — keep the thalamic-aphasia composite in step**

Replace `  const thalamic = ["th_aphasia_comp", "th_aphasia_naming", "thal_dc", "thal_stt", "thal_face"];` with:

```js
  // thal_ataxia too (content-gap fix, row 12) — the same trap: a stale copy out-ranks the real thalamus.
  const thalamic = ["th_aphasia_comp", "th_aphasia_naming", "thal_dc", "thal_stt", "thal_face", "thal_ataxia"];
```

- [ ] **Step 6: Re-pin `test/subcortex.test.js` (row 18, three assertions)**

```js
ok("thalamus -> dorsal+spinothalamic+face + hemiataxia (VL, content-gap fix row 12)",
   eq(subOf("thalamus"), ["dorsal_sensory","face_sensory_loss","limb_ataxia","spinothalamic"].sort()));
```

```js
  ok("no subcortex structure sets a crosses override, except thal_ataxia (the cerebellar relay, crossed in the midbrain)",
     subStructs.every(s => !Object.prototype.hasOwnProperty.call(s, "crosses") || s.id === "thal_ataxia"));
```

```js
  ok("the pure sensory lacune over-predicts only the hemiataxia (content-gap fix row 12)", res.display[0].over === 1, String(res.display[0].over));
```

- [ ] **Step 7: Run** `node test/content-gaps.test.js && node test/subcortex.test.js && node test/thalamus-hypothalamus.test.js && node test/cortex.test.js && node test/lobes.test.js && node test/accuracy-mechanisms.test.js && node test/clinical-vignettes.test.js`; then `npm test` green.

- [ ] **Step 8: Commit**

```bash
git add src/model/sites.js src/model/structures.js test/content-gaps.test.js test/subcortex.test.js
git commit -m "feat(engine): the PCA reaches the fusiform, wrong-way eyes, thalamic hemiataxia (rows 10-12)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: The pyramidal foot drop (row 13, option A2)

**Files:**
- Modify: `src/model/families.js`, `src/engine/families.js`, `test/content-gaps.test.js` (section D)

**Interfaces:**
- Produces: a `FINDING_FAMILIES` entry `{ id: "leg_foot", relation: "pyramidal", head: "weak_leg", member:
  "weak_ankle_dorsiflexion", inside: [...], members: [...], nearFit: false, ruling }`; `predictedToken(t, read)` reads
  a place's `weak_leg@side` as `weak_ankle_dorsiflexion@side` in that context; `indexTokens` lists both.

- [ ] **Step 1: Append section D**

```js
// ---- D. The pyramidal foot drop (row 13, option A2) ----
import { enteredToken } from "../src/engine/families.js";
{ const r = solve(T("weak_ankle_dorsiflexion@left babinski@left hyperreflexia@left"));
  ok("row 13: foot drop + Babinski + brisk → a right corticospinal place (not the hand knob), one lesion (R1 #5)",
     ids(r)[0] === "right_cortex_motor_leg" && r.multi === null, `${ids(r)[0]} multi=${!!r.multi}`); }
{ const r = solve(T("weak_ankle_dorsiflexion@left weak_arm@left facial_weakness@left forehead_spared@left"));
  ok("row 13: foot drop + weak arm + face (one side) → one capsular lesion", ids(r)[0] === "right_subcortex_corona_radiata" && r.multi === null); }
{ const r = solve(T("weak_ankle_dorsiflexion@left weak_great_toe_extension@left sensory_l5@left babinski@left"));
  ok("row 13 guard (A2, not A): an L5 root + Babinski keeps the L5 root first; the second place is the leg area",
     ids(r)[0] === "left_root_l5" && !!r.multi && r.multi.sites.some(s => s.id === "right_cortex_motor_leg")); }
ok("row 13 guard: a foot drop alone still means a nerve or root", /^left_(nerve|root|plexus)_/.test(first("weak_ankle_dorsiflexion@left") || ""));
ok("row 13 guard: the cortical hand still leads with the hand knob", first("weak_hand@left babinski@left hyperreflexia@left") === "right_cortex_hand_knob");
{ const set = T("weak_ankle_dorsiflexion@left babinski@left");
  ok("row 13: the entered word is never rewritten", enteredToken("weak_ankle_dorsiflexion@left", set) === "weak_ankle_dorsiflexion@left"); }
```

Move the `import { enteredToken } …` line up to the imports at the top of the file (ES modules hoist imports, but keep
the file readable).

- [ ] **Step 2: Run to see section D fail** — 3 lines fail: the two row-13 pictures, and the L5 + Babinski line (its
  second place is the hand knob today). The rest pass.

- [ ] **Step 3: `src/model/families.js` — the family**

Document the relation in the header comment, after the `generic` line:

```js
//   pyramidal   — a place that gives `head` (pyramidal leg weakness) also explains `member` (a foot drop) entered with a
//                 finding in `inside` on the same side. The PLACE's word is read, never the entered one, so a root or a
//                 nerve that predicts the foot drop keeps its match (content-gap fix, row 13, option A2).
```

After the `arm_hand` entry insert:

```js
  { id: "leg_foot", relation: "pyramidal", head: "weak_leg", member: "weak_ankle_dorsiflexion",
    inside: ["babinski", "hyperreflexia", "spasticity", "hoffmann", "weak_arm", "facial_weakness"],
    members: ["weak_leg", "weak_ankle_dorsiflexion"], nearFit: false,
    ruling: "A foot drop with an UMN sign or other pyramidal weakness on that side is explained by pyramidal leg weakness; the word is never rewritten (audit round 1, row 5; content-gap fix, row 13)." },
```

- [ ] **Step 4: `src/engine/families.js` — read the place's word**

In `predictedToken`, before `  return m;`, add:

```js
  // `pyramidal` (content-gap fix, row 13): a place's leg weakness reads as the foot drop that was entered with an UMN
  // sign or other pyramidal weakness on that side. The entered word is untouched.
  if (fam && fam.relation === "pyramidal" && f === fam.head) {
    const d = `${fam.member}@${s}`;
    if (read.has(d) && !read.has(m) && fam.inside.some(g => read.has(`${g}@${s}`))) return d;
  }
```

In `indexTokens`, before the final `return`, add:

```js
  if (fam && fam.relation === "pyramidal" && f === fam.head) return [m, `${fam.member}@${s}`];
```

- [ ] **Step 5: Run** `node test/content-gaps.test.js && node test/false-multifocal.test.js && node test/vocab-rulings.test.js && node test/examples.test.js && node test/answer.test.js`; then `npm test` green (`false-multifocal.test` gains 3 table checks).

- [ ] **Step 6: Commit**

```bash
git add src/model/families.js src/engine/families.js test/content-gaps.test.js
git commit -m "feat(families): a place's pyramidal leg weakness explains a foot drop with an UMN sign (row 13, A2)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Dominance as a prior, and the card (rows 9, 14, 15)

**Files:**
- Modify: `src/engine/inverse.js` (`solveOne`), `app/answer.js` (`answerFor`), `app/app.js` (lines 98, 362, 488-490,
  642, 867, 975, 1153), `test/content-gaps.test.js` (section E)

**Interfaces:**
- Produces: `solve(...).dominance` — `null`, or `{ assumed: "left"|"right", set: "left"|"right" }` when the fallback
  answered; then `explainAll` and `display` are the places that explain everything with `assumed`, and `multi` and
  `nearFit` are `null`. `answerFor` reads it; `app.js` reads it through `domView()`.

- [ ] **Step 1: Append section E**

```js
// ---- E. Dominance as a prior (row 9) and the card (rows 14, 15) ----
import { answerFor } from "../app/answer.js";
import { nameForSite } from "../src/data/syndromes.js";
const R10 = "speech_nonfluent@none comprehension_impaired@none weak_arm@right facial_weakness@right forehead_spared@right homonymous_hemianopia@right";
{ const r = solve(T(R10), { dominantSide: "right" });
  ok("row 9: left MCA picture, right dominance set → the left MCA, one lesion (R1 #10)", ids(r)[0] === "left_cortex_mca" && r.multi === null);
  ok("row 9: the result names the assumption", r.dominance && r.dominance.assumed === "left" && r.dominance.set === "right", JSON.stringify(r.dominance)); }
{ const r = solve(T(R10));
  ok("row 9 guard: with the dominance that explains it, no fallback", r.dominance === null && ids(r)[0] === "left_cortex_mca"); }
{ const r = solve(T("speech_nonfluent@none"));
  ok("row 9 guard: an aphasia the setting explains never lists the other hemisphere", r.dominance === null && !ids(r).some(id => /^right_|_right$/.test(id))); }
{ const r = solve(T("speech_nonfluent@none weak_arm@left facial_weakness@left forehead_spared@left"));
  ok("row 9: crossed aphasia → one right-hemisphere lesion, assuming right dominance (R1 #11 consistent)",
     /^right_cortex_/.test(ids(r)[0] || "") && r.multi === null && r.dominance?.assumed === "right"); }
{ const flipped = R10.replace(/@right/g, "@left");
  const r = solve(T(flipped), { dominantSide: "left" });
  ok("row 9 mirror: right MCA picture, left dominance set → the right MCA", ids(r)[0] === "right_cortex_mca" && r.dominance?.assumed === "right"); }
{ const r = solve(T("face_sensory_loss@left spinothalamic@right miosis@left ptosis@left limb_ataxia@left dysphagia@left"));
  ok("row 9 guard: the same-family near-fit is untouched (no gated finding)", r.dominance === null && !!r.nearFit?.instead); }
const cardFor = (toks, dominant) => {
  const tokens = T(toks), r = solve(tokens, { dominantSide: dominant });
  const sel = r.display.find(x => x.site.id === r.defaultSite) || r.display[0];
  return { r, lines: answerFor({ r, sel, total: tokens.size, tokens, onset: "", course: "", dominant, sensoryLevel: "",
    pinned: new Set(), scope: "site", selectedPathology: undefined, selectedEntity: undefined }).lines };
};
{ const { r, lines } = cardFor(R10, "right");
  ok("row 14: the Where line names the assumption",
     lines.where.endsWith("This assumes the left hemisphere is dominant, though right dominance is set (atypical dominance). If that is unlikely for this patient, no single place explains these findings."), lines.where);
  ok("row 14: the Why line reads with the assumed dominance", /only the left cerebral cortex/.test(lines.why), lines.why);
  ok("row 15: the red flag follows the assumed dominance", lines.red === nameForSite(r.display[0].site, { dominantSide: "left" }).red); }
{ const { r, lines } = cardFor("speech_nonfluent@none comprehension_impaired@none weak_arm@left facial_weakness@left forehead_spared@left homonymous_hemianopia@left", "right");
  ok("row 15: with right dominance set, a right MCA aphasia shows the DOMINANT red flag (the live bug)",
     r.dominance === null && lines.red === nameForSite(r.display[0].site, { dominantSide: "right" }).red, lines.red); }
```

- [ ] **Step 2: Run to see section E fail.**

- [ ] **Step 3: `src/engine/inverse.js` `solveOne` — the fallback**

Replace:

```js
  let sameFamily = null;
  if (!singleExplainsAll) {
```

with:

```js
  // DOMINANCE AS A PRIOR (owner ruling 2026-11-01, content-gap fix row 9; audit R1 #10). The setting gates every dominant
  // and non-dominant structure. When NO place explains every finding with the dominance set, the places that do with
  // the other dominance are the answer: atypical (crossed) dominance. They lead, no second lesion is claimed, and the
  // card names the assumption. Whenever any place explains the picture with the setting, this never runs, so an aphasia
  // the left hemisphere explains never lists a right-hemisphere place. It runs before the same-family near-fit: a place
  // that explains everything beats one that explains all but one finding.
  let atypical = null;
  if (!singleExplainsAll) {
    const assumed = opts.dominantSide === "left" ? "right" : "left";
    const alt = differential(observedSet, { ...opts, dominantSide: assumed }).filter(c => c.n === total);
    if (alt.length) atypical = { assumed, sites: alt };
  }
  let sameFamily = null;
  if (!singleExplainsAll && !atypical) {
```

Replace:

```js
  if (sameFamily) multi = null;
  const nf = sameFamily || nearFit(localising, opts);
  const display = explainAll.length ? explainAll
    : sameFamily ?
```

with:

```js
  if (sameFamily || atypical) multi = null;
  const nf = atypical ? null : sameFamily || nearFit(localising, opts);
  const display = explainAll.length ? explainAll
    : atypical ? atypical.sites
    : sameFamily ?
```

Replace the return's last line `           differential: diff, explainAll, display, defaultSite, ruledOut, pressure };` with:

```js
           differential: diff, explainAll: atypical ? atypical.sites : explainAll, display, defaultSite, ruledOut, pressure,
           dominance: atypical ? { assumed: atypical.assumed, set: opts.dominantSide } : null };
```

- [ ] **Step 4: `app/answer.js` `answerFor` — read the assumed dominance**

Replace:

```js
  const opts = { dominantSide: st.dominant, sensoryLevel: st.sensoryLevel || undefined };
  const list = st.r.display;
  const place = s => plainSiteName(s, { dominantSide: st.dominant }).place;
```

with:

```js
  // The dominance the answer assumes (content-gap fix, rows 9 and 15): the setting, or the other side when the engine's
  // dominance fallback answered. The place, the Why line and the red flag all read with it.
  const dom = st.r.dominance ? st.r.dominance.assumed : st.dominant;
  const opts = { dominantSide: dom, sensoryLevel: st.sensoryLevel || undefined };
  const list = st.r.display;
  const place = s => plainSiteName(s, { dominantSide: dom }).place;
```

Add, above `export function whereLine`:

```js
// Row 14 (owner-approved wording, 2026-11-01): the assumption the dominance fallback made.
export const dominanceSentence = d =>
  d ? `This assumes the ${d.assumed} hemisphere is dominant, though ${d.set} dominance is set (atypical dominance). If that is unlikely for this patient, no single place explains these findings.` : "";
```

In `lines`, change `where: whereLine({` … `}),` to append the sentence: replace the closing `      background,\n    }),` with:

```js
      background,
    }) + (st.r.dominance ? ` ${dominanceSentence(st.r.dominance)}` : ""),
```

and replace `    red: entityRed || nameForSite(st.sel.site).red || null,` with:

```js
    red: entityRed || nameForSite(st.sel.site, { dominantSide: dom }).red || null,
```

- [ ] **Step 5: `app/app.js` — one result dominance for the cards**

After `let LAST_DISPLAY = [];` (line 98) add:

```js
// The dominance the displayed answer assumes (content-gap fix, row 15): null = the setting; the other side when the
// engine's dominance fallback answered (r.dominance). Reset on every render; set after the localiser solves.
let RESULT_DOM = null;
const domView = () => RESULT_DOM || S.dominant;
```

At the very top of `renderResults` (after `function renderResults() {`, line 339) add `  RESULT_DOM = null;` — it can
return early before solving. After the `const r = solve(S.tokens, …);` line (line 362) add:

```js
  RESULT_DOM = r.dominance ? r.dominance.assumed : null;
```

Change `{ dominantSide: S.dominant }` to `{ dominantSide: domView() }` in `siteName`, `siteSub`, `siteRaw` (lines
488-490) and in the `levelLine` call (line 642); change line 867 to
`  const opts = { dominantSide: domView(), sensoryLevel: S.sensoryLevel || undefined };`; change line 975 to
`  const ph = nameForSite(site, { dominantSide: domView() });`; and change line 1153 to
`  try { RESULT_DOM = null; S.mode==="atlas" ? renderAtlas() : S.mode==="stroke" ? renderStroke() : renderLocalise(); }`.
Leave `solve` (line 362), `tractsFor` (390) and `forcingFindings` (733) on `S.dominant`: they are about the setting,
and the Together card is not shown when the fallback answered.

- [ ] **Step 6: Run** `node test/content-gaps.test.js && node test/answer.test.js && node test/app-smoke.test.js && node test/aphasia.test.js && node test/cortex.test.js && node test/false-multifocal.test.js && node test/relaxation.test.js`; then `npm test` green.

- [ ] **Step 7: Commit**

```bash
git add src/engine/inverse.js app/answer.js app/app.js test/content-gaps.test.js
git commit -m "feat(engine): the dominance setting is a prior; the card names the assumption (rows 9, 14, 15)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Wording — the finding, the phonebook, the anatomy sheet (rows 16, 17, 20)

**Files:**
- Modify: `src/model/findings.js:226`, `src/data/syndromes.js` (four entries), `docs/artifacts/anatomy-model.html`
  (nine rows), `test/content-gaps.test.js` (section F)

- [ ] **Step 1: Append section F**

```js
// ---- F. Wording (rows 16, 17) ----
import { FINDINGS } from "../src/model/findings.js";
ok("row 16: gaze deviation is described by the side the eyes look toward", /record the side the eyes look toward/.test(FINDINGS.gaze_deviation.desc));
ok("row 17: the carotid space's red flag names the XII palsy", /alone or with a XII palsy/.test(nameForSite(SITE["left_skull_base_carotid_space"]).red));
ok("row 17: the dominant PCA's red flag is the pure-alexia flag", /pure alexia/.test(nameForSite(SITE["left_cortex_pca"], { dominantSide: "left" }).red));
ok("row 17: the non-dominant PCA names prosopagnosia", /prosopagnosia/i.test(nameForSite(SITE["right_cortex_pca"], { dominantSide: "left" }).note));
ok("row 17: the elbow's note says the claw is milder", /claw is milder/.test(nameForSite(SITE["left_nerve_ulnar_elbow"]).note));
ok("row 17: the thalamus's note names the hemiataxia", /hemiataxia/.test(nameForSite(SITE["left_subcortex_thalamus"]).note));
```

- [ ] **Step 2: Run to see section F fail.**

- [ ] **Step 3: `src/model/findings.js:226`** — replace the `gaze_deviation` line with:

```js
  gaze_deviation: { desc: "Conjugate gaze deviation — record the side the eyes look toward (toward a frontal lesion, away from a pontine one)", group: "Cortical" },
```

- [ ] **Step 4: `src/data/syndromes.js`** — four entries.

Carotid space (line ~970): replace its `note` and `red` with
`note: "A Horner from the postganglionic fibres on the internal carotid (carotid dissection, cavernous lesion); often painful, with NO anhidrosis (the facial sudomotor fibres left with the external carotid) — with a XII palsy in some (the hypoglossal crosses the internal carotid).", red: "A painful Horner, alone or with a XII palsy, is a carotid dissection until proven otherwise — urgent vessel imaging (stroke risk)."`

PCA (`cortex_pca`, line ~151): replace the whole entry with dominant / non-dominant variants (the `cortex_fusiform`
shape):

```js
  cortex_pca: {
    dominant: {
      name: "Posterior cerebral artery (PCA) syndrome",
      note: "Occipital: contralateral homonymous hemianopia (often with macular sparing). In the dominant hemisphere, alexia without agraphia (the fusiform with the splenium).",
      ddx: ["PCA infarct", "Occipital haemorrhage", "Tumour", "Posterior reversible encephalopathy (PRES)", "Migrainous / seizure aura"],
      red: "New pure alexia with a right hemianopia is a left PCA stroke until proven otherwise."
    },
    nondominant: {
      name: "Posterior cerebral artery (PCA) syndrome",
      note: "Occipital: contralateral homonymous hemianopia (often with macular sparing). In the non-dominant hemisphere, prosopagnosia (the fusiform face area).",
      ddx: ["PCA infarct", "Occipital haemorrhage", "Tumour", "Posterior reversible encephalopathy (PRES)", "Migrainous / seizure aura"],
      red: "An isolated hemianopia is easily missed — confrontation-test fields; consider a posterior-circulation cause."
    }
  },
```

Ulnar at the elbow (`nerve_ulnar_elbow`, line ~697): replace its `note` with
`note: "Weak interossei, thumb adduction (Froment), FDP 4/5 and FCU, with palmar AND dorsal-hand sensory loss — a lesion at the elbow. The claw is milder than at the wrist (FDP 4/5 is weak too — the paradox)."`

Thalamus (`subcortex_thalamus`, line ~261): replace its `note` with
`note: "Ventral posterolateral thalamus: contralateral loss of all sensory modalities on the face, arm and leg, with no weakness; a larger thalamogeniculate infarct reaching the ventral lateral nucleus adds contralateral hemiataxia; a delayed contralateral central post-stroke pain (Déjerine–Roussy) may follow."`

Then grep the suites for any test that pins the old texts: `grep -rn "isolated, often painful\|minimal other deficit\|no weakness; a delayed" test/` — re-pin nothing else; if a hit appears, stop and report it (it is not in row 18).

- [ ] **Step 5: `docs/artifacts/anatomy-model.html` — nine rows (row 20)**

Insert each row directly after its neighbour row (search the neighbour's `<div class="id">…</div>`):

| after | insert |
|---|---|
| `uln_el_dsens` | `<div class="row"><span class="badge bi">IPSI</span><div class="m"><div class="id">uln_el_claw</div><div class="fn">ulnar claw — <b>milder</b> than at the wrist, because FDP 4/5 is weak too (the paradox); added 2026-11-01</div></div></div>` |
| `root_c6_reflex` | `<div class="row"><span class="badge bi">IPSI</span><div class="m"><div class="id">root_c6_biceps</div><div class="fn">biceps jerk lost (C5/6); added 2026-11-01</div></div></div>` |
| `root_l4_inv` | `<div class="row"><span class="badge bi">IPSI</span><div class="m"><div class="id">root_l4_hipadd</div><div class="fn">weak hip adduction — the obturator is L2–4; added 2026-11-01</div></div></div>` |
| `ah_bulbar_dysar` | `<div class="row"><span class="badge bb">BILAT</span><div class="m"><div class="id">ah_bulbar_tongue</div><div class="fn">tongue weakness, wasting and fasciculation — bulbar motor neurones (hypoglossal nuclei); added 2026-11-01</div></div></div>` |
| `car_symp_ptosis` | `<div class="row"><span class="badge bi">IPSI</span><div class="m"><div class="id">car_cn12</div><div class="fn">tongue weakness — XII crosses the internal carotid: <b>painful Horner + XII is dissection</b> until shown otherwise; added 2026-11-01</div></div></div>` |
| `cochlear_pons` | `<div class="row"><span class="badge bnone">NONE</span><div class="m"><div class="id">lab_art_hit</div><div class="fn">abnormal head impulse — the labyrinthine artery's inner-ear infarct breaks the VOR <b>like a peripheral lesion</b> (why HINTS-plus asks about hearing); added 2026-11-01</div></div></div>` and `<div class="row"><span class="badge bnone">NONE</span><div class="m"><div class="id">lab_art_nyst</div><div class="fn">peripheral-type nystagmus — the same inner-ear infarct; added 2026-11-01</div></div></div>` |
| `pprf` | `<div class="row"><span class="badge bc">CONTRA</span><div class="m"><div class="id">pprf_deviation</div><div class="fn">gaze deviation — acutely the eyes rest <b>away</b> from the lesion, toward the hemiparesis ("wrong-way eyes"); added 2026-11-01</div></div></div>` |
| `thal_face` | `<div class="row"><span class="badge bc">CONTRA</span><div class="m"><div class="id">thal_ataxia</div><div class="fn">limb ataxia — the ventral lateral nucleus, the cerebellar relay, already crossed in the midbrain: <b>contralateral hemiataxia</b> (Déjerine–Roussy); added 2026-11-01</div></div></div>` |

Verify every id against `structures.js`: `for id in uln_el_claw root_c6_biceps root_l4_hipadd ah_bulbar_tongue car_cn12 lab_art_hit lab_art_nyst pprf_deviation thal_ataxia; do grep -c "id: \"$id\"" src/model/structures.js; grep -c ">$id<" docs/artifacts/anatomy-model.html; done` — every count is 1.

- [ ] **Step 6: Run** `node test/content-gaps.test.js && node test/app-naming.test.js && node test/answer.test.js`; then `npm test` green.

- [ ] **Step 7: Commit**

```bash
git add src/model/findings.js src/data/syndromes.js docs/artifacts/anatomy-model.html test/content-gaps.test.js
git commit -m "docs(content): the wording the new rows need; nine anatomy-sheet rows (rows 16, 17, 20)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Three audit probes and their record (row 19)

**Files:**
- Modify: `test/clinical-audit.test.js` (after the row-19 block of the false-multifocal fix),
  `docs/superpowers/specs/2026-10-18-clinical-audit-suite.md` (a new final section)

- [ ] **Step 1: Add the probes** after the line ending `{ first: /^left_nerve_median_carpal_tunnel$/, single: true });`:

```js
// owner-approved 2026-11-01 (content-gap fix, round 1, row 19): pictures the new rows decide, which no audit probe
// covered. Each failed on 417385f.
T("Brainstem", "AICA picture + abnormal head impulse → lateral pons, one lesion", "cn8_vertigo@left hearing_loss@left facial_weakness@left forehead_involved@left limb_ataxia@left head_impulse_abnormal@none", { first: /^left_pons_lateral$/, single: true });
T("Hemispheres, thalamus & vision", "left hemianopia + prosopagnosia → right PCA, one lesion", "homonymous_hemianopia@left prosopagnosia@none", { first: /^right_cortex_pca$/, single: true });
T("Roots, plexus & nerves", "foot drop + weak arm + facial weakness, one side → a contralateral corticospinal site, one lesion", "weak_ankle_dorsiflexion@left weak_arm@left facial_weakness@left forehead_spared@left", { first: /^right_(cortex|subcortex|pons|midbrain|medulla)_/, single: true });
```

- [ ] **Step 2: Run the audit** — `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm run test:audit` (exit 1 by design).
  Expected: harness PASS; probes **101 / 111**; counted checks **1034 passed, 13 failed**; swaps 272 / 272; background
  292 / 292; mirror **273 / 273**. The 13 failures are exactly: syrinx; basilar (2); locked-in (2); bilateral INO; bilateral
  VI (2); parasagittal; uncal (2); top of the basilar; bilateral PCA. Stop and investigate any other.

- [ ] **Step 3: Record them** — append to `2026-10-18-clinical-audit-suite.md`:

```markdown
## Content-gap fix, round 1, row 19: three probes added (2026-11-01)

The content-gap fix's round 1 (`2026-11-01-content-gaps-design.md`, row 19, approved as written) added three counted
probes. Each fails on `417385f` (the false-multifocal fix):

| Probe | Expected answer (approved) | Baseline |
|---|---|---|
| AICA picture + abnormal head impulse | the left lateral pons first; one lesion | lateral pons + labyrinth, "Vasculitis" |
| left hemianopia + prosopagnosia | the right PCA first; one lesion | right fusiform + right optic radiation, "MS" |
| foot drop + weak arm + facial weakness, one side | a contralateral corticospinal site first; one lesion | face-arm cortex + deep peroneal nerve, "Vasculitis" |

Each probe is also mirrored, so the mirror property runs **273** checks.

**After the fix (measured on `fix/content-gaps`):** probes **101 / 111**; counted checks 1034 passed, 13 failed (the
composite-sites and raised-pressure rounds); synonym swaps 272 / 272 (48 new cerebellar swaps from the thalamic
hemiataxia, all passing); background 292 / 292; mirror 273 / 273.
```

(Replace the measured figures with what Step 2 printed if they differ, and say why.)

- [ ] **Step 4: Commit**

```bash
git add test/clinical-audit.test.js docs/superpowers/specs/2026-10-18-clinical-audit-suite.md
git commit -m "test(audit): three probes approved in the content-gap fix's round 1 (row 19)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Verify end to end, then document

- [ ] **Step 1: `npm test`** — green; note the suite and assertion counts (86 suites).
- [ ] **Step 2: Reproduce the prototype** — copy the prototype folder to a scratch dir, run `node run.mjs base` against
  `417385f`'s copy and compare its audit checks with the branch: the 17 fixed checks and the 48 new swap checks must
  match the spec's §5 one for one.
- [ ] **Step 3: Drive the app in the browser.** Add to `Code/.claude/launch.json` a configuration
  `{ "name": "NeuroLocaliser content worktree", "runtimeExecutable": "/usr/bin/env", "runtimeArgs": ["PORT=8140", "/Users/jaydenwearne/.local/node-v24.18.0-darwin-arm64/bin/node", "neurolocaliser-content/app/serve.mjs"], "port": 8140 }`
  (`serve.mjs` reads `PORT`, as the multifocal entry does). Check, by TAPPING rows (not by
  typing tokens):
  - the R1 #10 picture with the header dominance set to right: the card shows "Left MCA territory" and the row-14
    sentence; the red flag is the dominant MCA's;
  - wrong-way eyes ("eyes deviated to one side" on the left + left arm and leg weakness): "Right medial pons";
  - foot drop + Babinski + brisk reflexes: "Right leg area of the motor cortex";
  - vestibular neuritis: the labyrinth leads, the lateral pons is listed;
  - no console errors. Open a NEW query string for each case (a hash-only change does not reload the case).
- [ ] **Step 4: Documentation**
  - `CLAUDE.md`: a section "## Content-gap fix (DONE 2026-11-01, round 1) — ✅ owner-approved rulings (every row)"
    after the false-multifocal section, in that section's shape (mechanics; rulings that are traps: the thalamic-aphasia
    copy, the subcortex crossing exception, option A vs A2, the AICA cost, the dominance fallback's crossed pattern;
    measured). Update the status line (suites / assertions), the Commands section's audit figures (101 / 111), and the
    `families.js` / `inverse.js` lines in the layer list (the `pyramidal` relation; the dominance fallback).
  - The spec: status → IMPLEMENTED, with the measured figures and the commit range.
- [ ] **Step 5: Commit** — `git add CLAUDE.md docs/superpowers/specs/2026-11-01-content-gaps-design.md` and commit
  "docs: the content-gap fix — rulings applied, measured" (with the Co-Authored-By line). `Code/.claude/launch.json`
  lives outside the repo; do not commit it.

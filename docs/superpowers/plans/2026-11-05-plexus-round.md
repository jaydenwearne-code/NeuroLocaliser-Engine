# Plexus round, rows 3–7 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status: PLANNED (2026-11-05).** It implements rows 3–7 and their rows 11–16 of round 1 in
`docs/superpowers/specs/2026-11-04-plexus-round-design.md` (owner: *"Approve as written"*, 2026-11-05). Rows 8–9 (the L4
split with a whole lumbosacral plexus) wait for content round 2 and are NOT built here. Rows 1–2 change nothing.

**Goal:** Give each plexus element the cutaneous row of every mixed nerve that arises wholly from it, so that a
plexopathy entered in nerve-territory words reads as one plexus lesion. Ship it with the approved wording, one re-pin,
four audit probes and a new suite.

**Architecture:** One composer change. `composePlexusSites` already reuses `axil_sens` on the upper trunk, through its
per-group `nerves` list (the content-gap row-4 idiom). This plan adds four existing rows to those lists: `mcut_sens` on the
upper trunk, `uln_el_sens` on the lower trunk, `fem_sens` and `obt_sens` on the lumbar plexus, and `sci_sens` on the
sacral plexus. No new structure, finding, site id or solver step.

**Tech stack:** zero-dependency ES modules, Node 24, standalone test scripts (`ok(label, cond)`, `process.exit`).

## Global constraints

- Node is not on PATH: prefix every command with `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"`.
- Work in `/Users/jaydenwearne/Desktop/Personal/Claude Code/Projects/NeuroLocaliser/Code/neurolocaliser-plexus`
  (branch `fix/plexus-round`, on top of `4d781bd`). Never push; no PR.
- `npm run test:audit` is NOT part of `npm test`; never wire it in and never loosen an audit assertion.
- Site ids never change. No new structure ids (the anatomy sheet's id ↔ row check must stay clean).
- Radicular pain stays on the plexus (row 2). L4 still travels in both plexuses (rows 8–9 are not built).
- Branch and pure-sensory rows stay out of every plexus element (row 7): `cper_*_sens`/`dsens`, `tib_sens`,
  `sural_sens`, `saph_sens`, `lfc_sens`, `uln_el_dsens`, `med_*_palm`.
- The owner's wording is used verbatim where the spec gives it (rows 11–13).
- Re-pin ONLY the content-gap suite's "row 5 deferred" assertion (row 14). Any other failing assertion is a bug.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## File map

| File | Change | Task |
|---|---|---|
| `test/plexus-round.test.js` | **new** suite: the composition, rows 3–7, mirrors, the spec §6 guards, wording | 1, 3 |
| `package.json` | append `node test/plexus-round.test.js` to `test` | 1 |
| `test/content-gaps.test.js` | the row-14 re-pin | 1 |
| `src/model/sites.js` | `composePlexusSites` `nerves` lists + comment | 2 |
| `src/data/syndromes.js` | three phonebook notes (rows 11–12) | 3 |
| `docs/artifacts/anatomy-model.html` | the plexus composite line (row 13) | 3 |
| `test/clinical-audit.test.js` | four probes (row 15) | 4 |
| `docs/superpowers/specs/2026-10-18-clinical-audit-suite.md` | the row-15 probe section | 4 |
| `CLAUDE.md`, the spec, this plan | status + a "Plexus round" section | 5 |

---

### Task 1: The failing suite and the re-pin

**Files:**
- Create: `test/plexus-round.test.js`
- Modify: `package.json` (the `test` script), `test/content-gaps.test.js:38-39`

**Interfaces:**
- Consumes: `solve`, `candidateSites` (`src/engine/inverse.js`), `expectedFindings` (`src/engine/forward.js`),
  `composePlexusSites` (`src/model/sites.js`), `nameForSite` (`src/data/syndromes.js`).
- Produces: the suite Task 3 appends wording assertions to (it ends with the `// ---- report ----` block).

- [ ] **Step 1: Write the suite**

```js
// plexus-round.test.js — the plexus round, rows 3–7 (owner-ruled 2026-11-05; spec
// docs/superpowers/specs/2026-11-04-plexus-round-design.md). Each plexus element carries the cutaneous row of every MIXED
// nerve that arises wholly from it; branch and pure-sensory nerves keep pinning their own territory. Pins each approved
// row on both sides, and the spec's §6 "unchanged by design" list. Run: node test/plexus-round.test.js
import { solve, candidateSites } from "../src/engine/inverse.js";
import { expectedFindings } from "../src/engine/forward.js";
import { composePlexusSites } from "../src/model/sites.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0;
const ok = (label, cond, detail = "") => { cond ? pass++ : fail++; console.log((cond ? "PASS  " : "FAIL  ") + label + (cond ? "" : `  ${detail}`)); };
const T = s => new Set(s.split(/\s+/).filter(Boolean));
const SITE = Object.fromEntries(candidateSites().map(s => [s.id, s]));
const predicts = (id, tok) => expectedFindings(SITE[id]).has(tok);
const ids = r => r.display.map(c => c.site.id);
const first = toks => ids(solve(T(toks)))[0];
const mirror = s => s.replace(/@left/g, "@L").replace(/@right/g, "@left").replace(/@L/g, "@right");
// a one-lesion picture, asserted on the left and mirrored to the right
const oneLesion = (toks, id, label) => {
  for (const [side, t, want] of [["left", toks, id], ["right", mirror(toks), id.replace(/^left_/, "right_")]]) {
    const r = solve(T(t));
    ok(`${label} (${side})`, ids(r)[0] === want && r.multi === null, `${ids(r)[0]} multi=${!!r.multi}`);
  }
};

// ---- The composition: the nerve rows each element reuses (content-gap row 4; rows 3–7) ----
const NERVE_ROWS = {
  upper_trunk: ["axil_sens", "mcut_sens"],
  middle_trunk: [],
  lower_trunk: ["uln_el_sens"],
  lumbar_plexus: ["fem_sens", "obt_sens"],
  sacral_plexus: ["sci_sens"],
};
for (const s of composePlexusSites().filter(s => s.side === "left")) {
  const nerveRows = s.structures.filter(id => !id.startsWith("root_")).sort();
  ok(`the ${s.part.replace(/_/g, " ")} reuses exactly: ${NERVE_ROWS[s.part].join(", ") || "no nerve row"}`,
     JSON.stringify(nerveRows) === JSON.stringify([...NERVE_ROWS[s.part]].sort()), nerveRows.join(", "));
}

// ---- Row 3: the upper trunk + the musculocutaneous row ----
ok("row 3: the upper trunk carries lateral forearm numbness (musculocutaneous)", predicts("left_plexus_upper_trunk", "musculocutaneous_sensory@left"));
oneLesion("weak_shoulder_abduction@left weak_elbow_flexion@left weak_shoulder_external_rotation@left reflex_biceps_loss@left axillary_sensory@left musculocutaneous_sensory@left",
  "left_plexus_upper_trunk", "row 3: Erb with deltoid-patch and lateral-forearm numbness → the upper trunk, one lesion");
{ const r = solve(T("musculocutaneous_sensory@left weak_elbow_flexion@left reflex_biceps_loss@left weak_forearm_supination@left"));
  ok("row 3 guard: a musculocutaneous neuropathy still leads with the nerve, the upper trunk also fitting",
     ids(r)[0] === "left_nerve_musculocutaneous" && ids(r).includes("left_plexus_upper_trunk"), ids(r).join(", ")); }

// ---- Row 4: the lumbar plexus + the femoral and obturator rows ----
ok("row 4: the lumbar plexus carries front- and inner-thigh numbness (femoral, obturator)",
   predicts("left_plexus_lumbar_plexus", "femoral_sensory@left") && predicts("left_plexus_lumbar_plexus", "obturator_sensory@left"));
oneLesion("weak_hip_flexion@left weak_knee_extension@left weak_hip_adduction@left reflex_knee_loss@left femoral_sensory@left obturator_sensory@left",
  "left_plexus_lumbar_plexus", "row 4: a lumbar plexopathy in nerve words → the lumbar plexus, one lesion");
ok("row 4 guard: a femoral neuropathy still leads with the femoral nerve (audit probe)",
   first("weak_knee_extension@left reflex_knee_loss@left femoral_sensory@left") === "left_nerve_femoral");
ok("row 4 guard: an obturator neuropathy still leads with the obturator nerve", first("obturator_sensory@left weak_hip_adduction@left") === "left_nerve_obturator");

// ---- Row 5: the sacral plexus + the sciatic row ----
ok("row 5: the sacral plexus carries below-knee numbness (sciatic)", predicts("left_plexus_sacral_plexus", "sciatic_sensory@left"));
oneLesion("sciatic_sensory@left weak_knee_flexion@left weak_ankle_dorsiflexion@left weak_ankle_plantarflexion@left reflex_ankle_loss@left weak_hip_abduction@left",
  "left_plexus_sacral_plexus", "row 5: sciatic numbness + weak gluteus medius → the sacral plexus, one lesion");
ok("row 5 guard: a sciatic neuropathy still leads with the sciatic nerve",
   first("sciatic_sensory@left weak_knee_flexion@left weak_ankle_dorsiflexion@left weak_ankle_plantarflexion@left weak_foot_eversion@left reflex_ankle_loss@left") === "left_nerve_sciatic");

// ---- Row 6: the lower trunk + the ulnar palmar row ----
ok("row 6: the lower trunk carries little-finger numbness (ulnar, palmar)", predicts("left_plexus_lower_trunk", "ulnar_sensory@left"));
oneLesion("ulnar_sensory@left sensory_t1@left weak_thumb_abduction@left weak_finger_abduction@left",
  "left_plexus_lower_trunk", "row 6: little-finger + T1 numbness + weak thumb and finger abduction → the lower trunk, one lesion");
ok("row 6 guard: the ulnar nerve at the elbow still leads with the elbow (audit probe)",
   first("ulnar_sensory@left ulnar_dorsal_sensory@left weak_finger_abduction@left ulnar_claw@left") === "left_nerve_ulnar_elbow");
ok("row 6 guard: Guyon still leads with the wrist", first("ulnar_sensory@left weak_finger_abduction@left ulnar_claw@left") === "left_nerve_ulnar_wrist");

// ---- Row 7: branch and pure-sensory nerves stay out ----
const BRANCH = ["deep_peroneal_sensory", "peroneal_sensory", "tibial_sensory", "sural_sensory", "saphenous_sensory",
  "lat_fem_cutaneous_sensory", "ulnar_dorsal_sensory", "median_palmar_sensory"];
for (const s of composePlexusSites().filter(s => s.side === "left")) {
  const got = BRANCH.filter(f => expectedFindings(s).has(`${f}@left`));
  ok(`row 7: the ${s.part.replace(/_/g, " ")} predicts no branch or pure-sensory territory`, got.length === 0, got.join(", "));
}
ok("row 7 guard: first web-space numbness still pins the peroneal nerve (the foot-drop worked example)",
   ids(solve(T("weak_ankle_dorsiflexion@left weak_great_toe_extension@left weak_foot_eversion@left deep_peroneal_sensory@left"))).join() === "left_nerve_peroneal_common");
ok("row 7 guard: meralgia still reads the lateral femoral cutaneous nerve alone", ids(solve(T("lat_fem_cutaneous_sensory@left"))).join() === "left_nerve_lat_fem_cutaneous");
ok("row 7 guard: sural numbness still reads the sural nerve alone", ids(solve(T("sural_sensory@left"))).join() === "left_nerve_sural");

// ---- Unchanged by design (spec §6); rows 2 and 8–9 ----
ok("row 2: root pain stays shared — the upper trunk still predicts root pain", predicts("left_plexus_upper_trunk", "radicular_pain@left"));
{ const r = solve(T("sensory_c6@left reflex_biceps_loss@left reflex_brachioradialis_loss@left weak_elbow_flexion@left radicular_pain@left"));
  ok("guard: C6 radiculopathy → the C6 root first, the upper trunk also fitting", ids(r)[0] === "left_root_c6" && ids(r).includes("left_plexus_upper_trunk"), ids(r).join(", ")); }
{ const r = solve(T("weak_shoulder_abduction@left weak_elbow_flexion@left weak_shoulder_external_rotation@left reflex_biceps_loss@left axillary_sensory@left radicular_pain@left"));
  ok("guard: Erb + root pain is still one upper-trunk lesion", ids(r)[0] === "left_plexus_upper_trunk" && r.multi === null, `${ids(r)[0]} multi=${!!r.multi}`); }
{ const r = solve(T("weak_hip_flexion@left weak_knee_extension@left weak_hip_adduction@left reflex_knee_loss@left radicular_pain@left"));
  ok("guard: diabetic amyotrophy with root pain is still one lumbar-plexus lesion", ids(r)[0] === "left_plexus_lumbar_plexus" && r.multi === null, `${ids(r)[0]} multi=${!!r.multi}`); }
ok("guard: the foot-drop worked example still has its three places",
   ids(solve(T("weak_ankle_dorsiflexion@left weak_great_toe_extension@left weak_foot_eversion@left"))).join() === "left_nerve_peroneal_common,left_root_l5,left_plexus_sacral_plexus");
ok("guard: + weak hip abduction → the L5 root", first("weak_ankle_dorsiflexion@left weak_great_toe_extension@left weak_foot_eversion@left weak_hip_abduction@left") === "left_root_l5");
ok("guard: Klumpke → the lower trunk", first("weak_thumb_abduction@left weak_finger_abduction@left weak_finger_flexion@left sensory_c8@left sensory_t1@left") === "left_plexus_lower_trunk");
ok("guard: C8 + thumb and finger abduction → the C8 root or the lower trunk (audit probe)",
   /^left_(root_c8|plexus_lower_trunk)$/.test(first("weak_thumb_abduction@left weak_finger_abduction@left sensory_c8@left") || ""));
ok("guard: Pancoast → the lung apex",
   first("miosis@left ptosis@left anhidrosis_face@left sensory_c8@left sensory_t1@left weak_finger_abduction@left radicular_pain@left") === "left_sympathetic_pancoast");
ok("rows 8–9 not built: the sacral plexus still carries L4's knee jerk (until the lumbosacral place exists)",
   predicts("left_plexus_sacral_plexus", "reflex_knee_loss@left"));

// ---- report ----
console.log(`\nNeuroLocaliser — plexus round (round 1, rows 3–7)\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Register it and re-pin row 5**

In `package.json`, the `test` script ends `… && node test/content-gaps.test.js"`. Make it end
`… && node test/content-gaps.test.js && node test/plexus-round.test.js"`.

In `test/content-gaps.test.js`, replace:

```js
ok("row 5 deferred: the upper trunk does not yet carry musculocutaneous sensation (plexus round)",
   !predicts("left_plexus_upper_trunk", "musculocutaneous_sensory@left"));
```

with:

```js
ok("row 5: the upper trunk carries the musculocutaneous sensory row (plexus round)",
   predicts("left_plexus_upper_trunk", "musculocutaneous_sensory@left"));
```

- [ ] **Step 3: Run both and confirm the expected failures**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/plexus-round.test.js; node test/content-gaps.test.js | tail -3`
Expected: plexus-round fails exactly the four compositions that gain a row, the four row predictions, the eight
one-lesion pictures (rows 3–6, both sides) and the row-3 guard (17 FAIL); every row-7 check, the other guards and the
middle trunk's composition pass. content-gaps fails only the re-pinned row 5.

- [ ] **Step 4: Commit**

```bash
git add test/plexus-round.test.js package.json test/content-gaps.test.js
git commit -m "test(plexus): rows 3-7 — each element carries its mixed nerves' cutaneous rows (red)"
```

### Task 2: The composer

**Files:**
- Modify: `src/model/sites.js` (`composePlexusSites`, the `groups` array and the comment above it)

**Interfaces:**
- Consumes: the existing structure ids `mcut_sens`, `uln_el_sens`, `fem_sens`, `obt_sens`, `sci_sens`
  (`src/model/structures.js`).
- Produces: plexus sites whose `structures` end with the reused nerve rows (the suite's composition check).

- [ ] **Step 1: Change the groups**

Replace the comment and `groups` array inside `composePlexusSites` with:

```js
  // Each element also carries the cutaneous row of every MIXED nerve that arises wholly from it — the patch a clinician
  // tests for that plexopathy (content-gap fix row 4; plexus round rows 3–6, owner-ruled 2026-11-05). Nerve rows are
  // REUSED, as the cords reuse them. Branch and pure-sensory nerves (deep and superficial peroneal, tibial, sural,
  // saphenous, lateral femoral cutaneous, dorsal ulnar) keep pinning their own territory, so they stay out (row 7: the
  // foot-drop worked example's first web space). Every root row travels in, radicular pain included (row 2: the pain is
  // shared). L4 still travels in both plexuses until the whole lumbosacral place exists (rows 8–9, content round 2).
  const groups = [
    { part: "upper_trunk",   segs: ["c5", "c6"], nerves: ["axil_sens", "mcut_sens"], terr: "brachial plexus upper trunk (C5-6) — Erb's palsy" },
    { part: "middle_trunk",  segs: ["c7"], terr: "brachial plexus middle trunk (C7)" },
    { part: "lower_trunk",   segs: ["c8", "t1"], nerves: ["uln_el_sens"], terr: "brachial plexus lower trunk (C8-T1) — Klumpke's palsy" },
    { part: "lumbar_plexus", segs: ["l2", "l3", "l4"], nerves: ["fem_sens", "obt_sens"], terr: "lumbar plexus (L2-4)" },
    { part: "sacral_plexus", segs: ["l4", "l5", "s1"], nerves: ["sci_sens"], terr: "sacral plexus (L4-S1)" }
  ];
```

and drop the now-redundant trailing comment on the `structures` line (`// nerve rows are REUSED, as the cords reuse them`).

- [ ] **Step 2: Run the two suites**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/plexus-round.test.js | tail -2; node test/content-gaps.test.js | tail -2`
Expected: both 0 failed.

- [ ] **Step 3: Run everything**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test 2>&1 | grep -E "^\s*FAIL|failed" | grep -v " 0 failed"`
Expected: no output (all 87 suites green). Then the audit:
`PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm run test:audit 2>&1 | tail -1`
Expected: `clinical audit: 1034 passed, 13 failed …` (no check flips; exit 1 by design).

- [ ] **Step 4: Commit**

```bash
git add src/model/sites.js
git commit -m "feat(plexus): each element carries its mixed nerves' cutaneous rows (rows 3-6); branch rows stay out (row 7)"
```

### Task 3: The wording

**Files:**
- Modify: `test/plexus-round.test.js` (append before `// ---- report ----`), `src/data/syndromes.js` (three notes),
  `docs/artifacts/anatomy-model.html` (the plexus composite line)

**Interfaces:**
- Consumes: `nameForSite(site).note` and the `SITE` map from Task 1.

- [ ] **Step 1: Append the failing wording checks**

```js
// ---- Wording (rows 11, 12) ----
ok("row 11: the upper trunk's note names the deltoid patch and the lateral forearm",
   /numbness over the deltoid patch and the lateral forearm/.test(nameForSite(SITE["left_plexus_upper_trunk"]).note));
ok("row 12: the lumbar plexus's note names front- and inner-thigh numbness",
   /^Front- and inner-thigh numbness \(femoral and obturator territories\)/.test(nameForSite(SITE["left_plexus_lumbar_plexus"]).note));
ok("row 12: the lower trunk's note names the little finger and the medial forearm",
   /sensory loss over the little finger and the medial forearm/.test(nameForSite(SITE["left_plexus_lower_trunk"]).note));
```

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/plexus-round.test.js | tail -1`
Expected: `… 3 failed`.

- [ ] **Step 2: Change the three notes (spec rows 11–12, verbatim)**

In `src/data/syndromes.js`:
- `plexus_upper_trunk` note → `"Upper brachial plexus: the 'waiter's tip' arm — weak shoulder abduction, external rotation and elbow flexion, with numbness over the deltoid patch and the lateral forearm (C5–6) and a depressed biceps jerk."`
- `plexus_lumbar_plexus` note → `"Front- and inner-thigh numbness (femoral and obturator territories) with weak hip flexion, hip adduction and knee extension, and a depressed knee jerk."`
- `plexus_lower_trunk` note → `"Lower brachial plexus: intrinsic hand weakness (claw hand), finger flexion/abduction and thumb abduction weak, with C8–T1 sensory loss over the little finger and the medial forearm (± a Horner's from T1 sympathetic)."`
- `plexus_sacral_plexus` stays as it is.

- [ ] **Step 3: The anatomy-sheet line (row 13)**

In `docs/artifacts/anatomy-model.html`, the `plexus_upper_trunk · lower_trunk (root composites)` entry's text becomes:
`Erb = C5∪C6 + the axillary and musculocutaneous patches · Klumpke = C8∪T1 + the ulnar patch · lumbar = L2–4 + femoral and obturator · sacral = L4–S1 + sciatic — a two-adjacent-root pattern beats two roots by parsimony`

- [ ] **Step 4: Run the suite, then everything**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/plexus-round.test.js | tail -1 && npm test 2>&1 | grep -E "^\s*FAIL" | head`
Expected: `… 0 failed`, and no FAIL lines.

- [ ] **Step 5: Commit**

```bash
git add test/plexus-round.test.js src/data/syndromes.js docs/artifacts/anatomy-model.html
git commit -m "docs(content): the plexus notes name the patches each element carries (rows 11-13)"
```

### Task 4: The four audit probes (row 15)

**Files:**
- Modify: `test/clinical-audit.test.js` (after the content-gap fix's row-19 block, before the harness section),
  `docs/superpowers/specs/2026-10-18-clinical-audit-suite.md` (a new last section)

- [ ] **Step 1: Add the probes**

```js
// owner-approved 2026-11-05 (plexus round, round 1, row 15): plexopathies entered in the nerve-territory words a
// clinician tests, which no audit probe covered. Each failed on 4d781bd (the content-gap fix).
T("Roots, plexus & nerves", "Erb with deltoid-patch and lateral-forearm numbness → upper trunk, one lesion", "weak_shoulder_abduction@left weak_elbow_flexion@left weak_shoulder_external_rotation@left reflex_biceps_loss@left axillary_sensory@left musculocutaneous_sensory@left", { first: /^left_plexus_upper_trunk$/, single: true });
T("Roots, plexus & nerves", "lumbar plexopathy in nerve words (front- and inner-thigh numbness) → lumbar plexus, one lesion", "weak_hip_flexion@left weak_knee_extension@left weak_hip_adduction@left reflex_knee_loss@left femoral_sensory@left obturator_sensory@left", { first: /^left_plexus_lumbar_plexus$/, single: true });
T("Roots, plexus & nerves", "sciatic numbness + sciatic motor signs + weak gluteus medius → sacral plexus, one lesion", "sciatic_sensory@left weak_knee_flexion@left weak_ankle_dorsiflexion@left weak_ankle_plantarflexion@left reflex_ankle_loss@left weak_hip_abduction@left", { first: /^left_plexus_sacral_plexus$/, single: true });
T("Roots, plexus & nerves", "little-finger + T1 numbness + weak thumb and finger abduction → lower trunk, one lesion", "ulnar_sensory@left sensory_t1@left weak_thumb_abduction@left weak_finger_abduction@left", { first: /^left_plexus_lower_trunk$/, single: true });
```

- [ ] **Step 2: Confirm each fails on the baseline and passes now**

Copy the changed audit file into a scratch copy of `4d781bd` and run it there; then run it here.
Expected there: all four probes FAIL (the baseline's two-lesion claims). Here: all four PASS; the audit reads
probes 105 / 115 and `1046 passed, 13 failed` (the 13 are the composite-sites and raised-pressure rounds); mirror 277 / 277.

- [ ] **Step 3: Record them in the audit spec**

Append a section `## Plexus round, round 1, row 15: four probes added (2026-11-05)`, in the shape of the content-gap
section above it: one sentence of provenance, a table (probe · expected answer · baseline), the mirror count, and the
measured after-numbers from Step 2.

- [ ] **Step 4: Commit**

```bash
git add test/clinical-audit.test.js docs/superpowers/specs/2026-10-18-clinical-audit-suite.md
git commit -m "test(audit): four probes approved in the plexus round's round 1 (row 15)"
```

### Task 5: Verify, browser-check, document

- [ ] **Step 1: The real cards.** Capture `answerFor` for the spec §6 pictures with the prototype's `card.mjs` (shared notes folder, `plexus-prototype/v2-on-4d781bd/`, pointed at this worktree) and compare them with §6. Each must match.
- [ ] **Step 2: The browser.** Serve this worktree (a `launch.json` entry on port 8141), enter the lumbar plexopathy by
  row taps (front-of-thigh numbness, inner-thigh numbness, weak hip flexion, weak knee extension, weak hip adduction,
  absent knee jerk, all left), and check that the card reads "Left lumbar plexus" with no Together line.
- [ ] **Step 3: Docs.**
  - CLAUDE.md gets a "Plexus round" section after the content-gap one: what changed, the rule, the two "no" rulings
    as traps, and the measured numbers. Update the suite count and the audit lines in "Commands".
  - The spec's status gains "IMPLEMENTED (rows 3–7)". This plan's status becomes IMPLEMENTED, with the commit range.
- [ ] **Step 4: Commit** the docs, then update the shared hand-over note and memory. Do not push.

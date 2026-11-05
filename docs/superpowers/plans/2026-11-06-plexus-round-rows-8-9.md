# Plexus round, rows 8–9 + content round 2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status: PLANNED (2026-11-06).** Implements rows 1, 8 and 9 of round 1 and every row of content round 2 (C1–C14) in
`docs/superpowers/specs/2026-11-04-plexus-round-design.md` (owner: *"Approve as written"*, both rounds, 2026-11-05).
Row 10 / C14 is "no": there is no whole brachial plexus place.

**Goal:** L4 divides between the lumbar and sacral plexus, and a whole lumbosacral plexus place reads a plexopathy that
spans both. The place ships with its approved content.

**Architecture:**
- **Tags.** Each of the eight L4 rows names the plexus it travels in, as a `plexus` field on the structure (row 1).
- **Composer.** `composePlexusSites` reads the tag, and a new `whole` group takes every L2–S1 row plus the femoral,
  obturator and sciatic rows.
- **Content.** The place's content goes where every place's lives:
  - the phonebook (`syndromes.js`);
  - causes (`causes.js`);
  - the workup (`nextSteps.js`);
  - one line per reused plan, in the `src/data/pathology/` families;
  - one new plan, the mimic;
  - a topography row.

No new finding, structure id or solver step. The scratch prototype
(`side-session-notes/local_ee2d02d5…/plexus-prototype/content-round-2/`, `lib4.mjs` + `content2.mjs`) is the reference: the
built branch must match its cards and its sample.

**Tech stack:** zero-dependency ES modules, Node 24, standalone test scripts (`ok(label, cond)`, `process.exit`).

## Global constraints

- Node is not on PATH: prefix every command with `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"`.
- Work in `Code/neurolocaliser-plexus` (branch `fix/plexus-round`). Never push; no PR.
- `npm run test:audit` is NOT part of `npm test`; never wire it in, never loosen an audit assertion. No new probes.
- Site ids never change; the new id is `left_/right_plexus_lumbosacral_plexus`.
- Radicular pain stays shared (row 2): `root_l4_pain` travels in both plexuses.
- The approved wording is used verbatim (C2–C10).
- Re-pin ONLY C13's list: `discriminators` "foot drop has three candidates" → four; `answer` "Foot drop — Where names the
  other two"; the worked example's comment in `app/examples.js`; this round's own suite. Any other failing assertion is a
  bug.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## File map

| File | Change | Task |
|---|---|---|
| `test/plexus-round.test.js` | rows 8–9 + C12–C14 assertions; composition table; content assertions | 1, 3 |
| `test/discriminators.test.js`, `test/answer.test.js`, `app/examples.js` | the C13 re-pins | 1 |
| `src/model/structures.js` | `plexus` on the eight L4 rows | 2 |
| `src/model/sites.js` | `composePlexusSites` reads the tag; the lumbosacral group | 2 |
| `src/model/topography.js` | `plexus\|lumbosacral_plexus` | 2 |
| `src/data/syndromes.js`, `src/data/causes.js`, `src/data/nextSteps.js` | phonebook, causes, workup (C2–C9) | 3 |
| `src/data/pathology/{metabolic,neoplastic,vascular,iatrogenic,inflammatory,infective,degenerative}.js` | C10 per-place lines; C7's new plan | 3 |
| `docs/artifacts/anatomy-model.html`, CLAUDE.md, spec, plans | C11 line; docs | 4 |

---

### Task 1: Red — the new assertions and the C13 re-pins

**Files:** Modify `test/plexus-round.test.js`, `test/discriminators.test.js:17,21`, `test/answer.test.js:74`,
`app/examples.js:27`.

- [ ] **Step 1: The suite.** Add `import { STRUCTURES } from "../src/model/structures.js";`. Add
  `lumbosacral_plexus: ["fem_sens", "obt_sens", "sci_sens"],` to `NERVE_ROWS`. Replace the foot-drop guard and the
  "rows 8–9 not built" pin with:

```js
ok("guard: the foot-drop worked example has four places (C13: the whole lumbosacral plexus joins)",
   ids(solve(T("weak_ankle_dorsiflexion@left weak_great_toe_extension@left weak_foot_eversion@left"))).join() === "left_nerve_peroneal_common,left_root_l5,left_plexus_sacral_plexus,left_plexus_lumbosacral_plexus");

// ---- Rows 1, 8, 9: L4 divides; the whole lumbosacral plexus ----
{ const l4 = STRUCTURES.filter(s => s.level === "root" && s.part === "l4");
  ok("row 1: every L4 row names the plexus it travels in", l4.length === 8 && l4.every(s => Array.isArray(s.plexus) && s.plexus.length > 0),
     l4.filter(s => !Array.isArray(s.plexus)).map(s => s.id).join(", "));
  ok("row 1: no other root row carries a plexus tag (only L4 divides)",
     STRUCTURES.filter(s => s.level === "root" && s.part !== "l4" && s.plexus).length === 0); }
ok("row 8: the lumbar plexus no longer carries L4's tibialis anterior or posterior",
   !predicts("left_plexus_lumbar_plexus", "weak_ankle_dorsiflexion@left") && !predicts("left_plexus_lumbar_plexus", "weak_foot_inversion@left"));
ok("row 8: the sacral plexus no longer carries L4's quadriceps, knee jerk, adductors or medial-shin numbness",
   ["weak_knee_extension", "reflex_knee_loss", "weak_hip_adduction", "sensory_l4"].every(f => !predicts("left_plexus_sacral_plexus", `${f}@left`)));
ok("row 8: both plexuses keep L4's wasting and root pain",
   ["left_plexus_lumbar_plexus", "left_plexus_sacral_plexus"].every(id => predicts(id, "wasting@left") && predicts(id, "radicular_pain@left")));
{ const r = solve(T("weak_knee_extension@left weak_ankle_dorsiflexion@left reflex_knee_loss@left sensory_l4@left"));
  ok("row 8: quadriceps + foot drop + knee jerk + medial shin → the L4 root first, the lumbosacral plexus also fitting",
     ids(r)[0] === "left_root_l4" && ids(r).includes("left_plexus_lumbosacral_plexus") && !ids(r).includes("left_plexus_sacral_plexus"), ids(r).join(", ")); }
ok("row 9: the whole lumbosacral plexus carries the knee AND the ankle jerk",
   predicts("left_plexus_lumbosacral_plexus", "reflex_knee_loss@left") && predicts("left_plexus_lumbosacral_plexus", "reflex_ankle_loss@left"));
oneLesion("femoral_sensory@left obturator_sensory@left sciatic_sensory@left weak_hip_flexion@left weak_knee_extension@left weak_ankle_dorsiflexion@left weak_ankle_plantarflexion@left reflex_knee_loss@left reflex_ankle_loss@left",
  "left_plexus_lumbosacral_plexus", "row 9: a whole-leg plexopathy in nerve words → the lumbosacral plexus, one lesion");
oneLesion("reflex_knee_loss@left reflex_ankle_loss@left", "left_plexus_lumbosacral_plexus", "row 9: knee jerk + ankle jerk lost on one side → the lumbosacral plexus");
ok("row 9 guard: L5 radiculopathy with root pain still leads with the L5 root",
   first("weak_ankle_dorsiflexion@left weak_great_toe_extension@left weak_hip_abduction@left sensory_l5@left radicular_pain@left") === "left_root_l5");
ok("row 9 guard: L4 (R1 #4) still leads with the L4 root", first("weak_knee_extension@left weak_hip_adduction@left reflex_knee_loss@left sensory_l4@left") === "left_root_l4");
ok("C12 (accepted): L2 numbness + S1 numbness reads one lumbosacral plexus", first("sensory_l2@left sensory_s1@left") === "left_plexus_lumbosacral_plexus");
ok("C14: there is no whole brachial plexus place", !SITE["left_plexus_brachial_plexus"]);
```

- [ ] **Step 2: The C13 re-pins.** `test/discriminators.test.js`: the comment `// Three candidates, …` → `// Four
  candidates (the whole lumbosacral plexus joined in the plexus round), …`; `ok(\`foot drop has three candidates …\`,
  cands.length === 3)` → `ok(\`foot drop has four candidates (${cands.length})\`, cands.length === 4)`.
  `test/answer.test.js`: the expected Where line → `"Left common peroneal nerve. 3 other places also fit: Left L5 root,
  Left sacral plexus, and 1 more."`. `app/examples.js`: `so three candidates appear and none wins` → `so four candidates
  appear and none wins`.

- [ ] **Step 3: Watch them fail.** `node test/plexus-round.test.js | grep -c ^FAIL` → the rows 1/8/9, C12, the foot-drop
  guard and the lumbosacral composition fail (C14 and the row-9 guards pass); `discriminators` and `answer` fail their
  re-pinned lines.

- [ ] **Step 4: Commit** `test(plexus): rows 8-9 — L4 divides, the whole lumbosacral plexus (red); C13 re-pins`.

### Task 2: Green — the tags, the composer, the topography row

**Files:** `src/model/structures.js:926-932,1178`, `src/model/sites.js` (`composePlexusSites`), `src/model/topography.js`.

- [ ] **Step 1: The tags.** Add `plexus: ["lumbar_plexus"]` to `root_l4_derm`, `root_l4_kneeext`, `root_l4_hipadd`,
  `root_l4_reflex`; `plexus: ["sacral_plexus"]` to `root_l4_df`, `root_l4_inv`; `plexus: ["lumbar_plexus",
  "sacral_plexus"]` to `root_l4_pain` and `root_l4_wasting`.

- [ ] **Step 2: The composer.** Inside `composePlexusSites`:

```js
  // A root that divides between two elements (only L4) names the element each row travels in (`plexus` on the
  // structure; plexus round row 1); a WHOLE element takes every row of its roots (row 9).
  const structuresForRoots = (segs, part, whole) =>
    STRUCTURES.filter(s => s.level === "root" && segs.includes(s.part) && (whole || !s.plexus || s.plexus.includes(part))).map(s => s.id);
```

  and append the group (after `sacral_plexus`):

```js
    // the whole leg plexus: every L2–S1 row and the three mixed nerves (plexus round rows 8–9, content round 2)
    { part: "lumbosacral_plexus", segs: ["l2", "l3", "l4", "l5", "s1"], nerves: ["fem_sens", "obt_sens", "sci_sens"], whole: true, terr: "lumbosacral plexus (L2-S1)" }
```

  with the loop calling `structuresForRoots(g.segs, g.part, g.whole)`. Update the comment's last sentence ("L4 still
  travels in both plexuses until …") to say L4 divides, per row 1.

- [ ] **Step 3: Topography.** After `"plexus|sacral_plexus"`: `"plexus|lumbosacral_plexus": { lobe: null, surface:
  false, system: null },` (aligned like its neighbours).

- [ ] **Step 4: Green.** `node test/plexus-round.test.js | tail -1` → 0 failed; `npm test` → green (87 suites); audit →
  `1047 passed, 13 failed` (one new mirror check, passing).

- [ ] **Step 5: Commit** `feat(plexus): L4 divides between the plexuses; the whole lumbosacral plexus (rows 1, 8, 9)`.

### Task 3: The content (C2–C10)

**Files:** `test/plexus-round.test.js`, `src/data/syndromes.js`, `src/data/causes.js`, `src/data/nextSteps.js`,
`src/data/pathology/*.js`.

- [ ] **Step 1: Red.** Append (importing `causesFor` from `../src/data/causes.js`, `nextStepsFor` from
  `../src/data/nextSteps.js`, `pathologyPlanFor` from `../src/data/pathologyNextSteps.js`):

```js
// ---- Content round 2 (C2–C10) ----
{ const ls = SITE["left_plexus_lumbosacral_plexus"], pb = nameForSite(ls);
  ok("C2: the place's name", pb.name === "Lumbosacral plexopathy (L2-S1)", pb.name);
  ok("C3: the note names weakness above AND below the knee", /^The whole leg plexus: weakness above AND below the knee/.test(pb.note || ""));
  ok("C5: the red flag names diabetic amyotrophy, infiltration and the haematoma", /diabetic amyotrophy or malignant infiltration/.test(pb.red || "") && /image urgently for a haematoma/.test(pb.red || ""));
  const all = causesFor(ls).all.map(c => c.name);
  ok("C6: seven causes, diabetic amyotrophy first", all.length === 7 && all[0] === "Diabetic lumbosacral radiculoplexus neuropathy (diabetic amyotrophy)", all.join(" | "));
  ok("C7: the mimic is listed, as a mimic", causesFor(ls).all.some(c => c.name === "Several lumbosacral roots (multilevel spondylosis or canal stenosis)" && c.cat === "mimic"));
  const nx = nextStepsFor(ls);
  ok("C8: urgent, with the approved referral", nx.urgency === "urgent" && /oncology if infiltration; neurology\/diabetes team otherwise/.test(nx.referral || ""), `${nx.urgency} ${nx.referral}`);
  ok("C9: the first immediate step tests above AND below the knee", /^Test ABOVE and BELOW the knee/.test((nx.immediate || [])[0] || ""));
  for (const name of ["Diabetic lumbosacral radiculoplexus neuropathy (diabetic amyotrophy)", "Pelvic or retroperitoneal tumour", "Retroperitoneal or pelvic haematoma",
                      "Radiation plexopathy", "Vasculitic plexopathy", "Pelvic abscess or infection", "Several lumbosacral roots (multilevel spondylosis or canal stenosis)"])
    ok(`C10: \`${name}\` has a plan at the whole plexus`, !!pathologyPlanFor(name, ls)); }
```

  Run → fails (the fallback content).

- [ ] **Step 2: Green — port the approved content verbatim.** The text is spec §10 C2–C10. It was prototyped
  as `content2.mjs` in the shared notes folder, which holds the exact anchors and blocks:
  - the phonebook entry before `// ---- NAMED PERIPHERAL NERVES ----`;
  - `CAUSES.plexus_lumbosacral_plexus` after the sacral plexus list;
  - `NEXT.plexus_lumbosacral_plexus` after the sacral plexus workup;
  - a `plexus_lumbosacral_plexus` per-place line for the six reused plans;
  - the mimic's plan in the degenerative-radiculopathy family, before "Lumbar spondylosis / foraminal or lateral
    recess stenosis".

- [ ] **Step 3: Green.** The suite reads 0 failed; `npm test` is green. Every content gate passes: depth, the plan gates,
  the red and hard gates.

- [ ] **Step 4: Commit** `feat(content): the whole lumbosacral plexus — phonebook, causes, workup and plans (content round 2)`.

### Task 4: Verify and document

- [ ] **Cards:** capture `answerFor` for the content-round-2 pictures (`whole.json`, `plexus-cards.json`) on this branch.
  They must equal the prototype's `c2.cards.txt`.
- [ ] **Sample:** run `pictures2.mjs` against the tip snapshot. Expect claims 9180 → 9173 (7 ended, 0 new).
- [ ] **Browser:** on port 8141, enter the whole-leg plexopathy by row taps. The card must read "Left lumbosacral
  plexus.", and the console must have no errors.
- [ ] **Docs:**
  - the anatomy-sheet plexus line gains C11's lumbosacral clause and the L4 rows' plexus;
  - CLAUDE.md: the plexus-round section (rows 8–9, C12–C14, the traps) and the worked-examples "three candidates" → four;
  - the spec's and both plans' status.
- [ ] **Commit** the docs; then the shared hand-over note and memory. Do not push.

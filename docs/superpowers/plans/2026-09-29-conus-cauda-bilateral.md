# The conus and cauda signs are on both sides — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status: PLANNED (2026-09-29).** Spec: `docs/superpowers/specs/2026-09-29-conus-cauda-bilateral-design.md` (approved).

**Goal:** The classic conus and cauda pictures, entered with "Both" or one side, resolve to one lesion instead of
"needs more than one lesion". This is done by emitting the seven conus and cauda limb signs on both sides.

**Architecture:** A model change of one flag on seven structures (`emit: "bilateral"`, the `cauda_ankle_reflex`
precedent), plus three note words. The side offers follow automatically. Around it: the worked example
re-derived, a generic legacy-link conversion (`currentTokens` in `app/sides.js`), and the removal of the dead
both-sides → midline rule in `normalNegatives`.

**Tech Stack:** Zero-dependency Node ES modules; standalone test scripts chained in the `package.json` `test` script;
static web app in `app/`.

## Global Constraints

- Node is off PATH: prefix every node/npm command with `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"`.
- Branch `fix/conus-cauda-bilateral` (already created, stacked on `fix/onset-follows-cause` = PR #14; spec committed
  as `8031b55`).
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **No test is loosened.** Fixture edits change how a picture is written (midline → left + right), never what is
  asserted.
- **Never merge or push to `main`**, and never enable auto-merge. Merging deploys to testers; the owner merges, and
  PR #14 goes first.
- Clinical model changes need the owner's review: Task 4 is that gate. Stop there.

## Prototyped before writing

Every edit below was applied to a scratch copy of this branch before the plan was written:

- With the test edits alone, six suites fail: `cauda-conus` cannot load (`currentTokens` missing), and `tone`,
  `discriminators`, `clinical-vignettes`, `why` and `vocab-rulings` fail on the midline fixtures.
- With the model change added, the full suite is green: **82 suites / 7100 assertions** (7087 + 13 new).
- The anatomy sheet still has 594 rows for 594 structures, and every `emit: "bilateral"` structure's row reads BILAT.

The prototype also found that `cauda-conus.test.js`'s conus picture still used `umn_signs`, a finding removed in
v0.10.0. Its conus assertion passed without the conus explaining anything, and Task 1 replaces it.

## Files

| File | Change |
|---|---|
| `src/model/structures.js` | `emit: "bilateral"` on seven structures; three note words |
| `app/examples.js` | the cauda example: sciatica on both sides |
| `app/sides.js` | `currentTokens(tokens)` |
| `app/app.js` | `restoreFromURL` runs the decoded tokens through `currentTokens` |
| `src/engine/inverse.js` | `normalNegatives`: the both-sides → midline rule removed |
| `test/cauda-conus.test.js` | realistic pictures + sections 5–8 (13 new assertions) |
| `test/tone.test.js`, `test/discriminators.test.js`, `test/clinical-vignettes.test.js`, `test/why.test.js`, `test/vocab-rulings.test.js` | fixtures → left + right |
| `docs/artifacts/anatomy-model.html` | seven rows MIDLINE → BILAT |

---

### Task 1: The failing tests

**Files:** the six test files above.

**Interfaces:**
- Consumes (from Task 2): `currentTokens(tokens: string[]) → string[]`, exported from `app/sides.js`.

Apply each replacement with the Edit tool. Each `old` string occurs exactly once.

- [ ] **Step 1: `test/tone.test.js`.** Replace

```js
  ok("cauda equina -> hypotonia@midline + wasting@midline", caudaExp.has("hypotonia@midline") && caudaExp.has("wasting@midline"));
```

with

```js
  ok("cauda equina -> hypotonia + wasting on both legs",
     ["hypotonia@left", "hypotonia@right", "wasting@left", "wasting@right"].every(t => caudaExp.has(t)));
```

- [ ] **Step 2: `test/discriminators.test.js`.** Replace

```js
  const { obs, r } = build(["saddle_anaesthesia@midline", "sphincter_dysfunction@midline",
                            "radicular_pain@midline", "anal_wink_loss@midline"]);
```

with

```js
  const { obs, r } = build(["saddle_anaesthesia@midline", "sphincter_dysfunction@midline",
                            "radicular_pain@left", "radicular_pain@right", "anal_wink_loss@midline"]);
```

- [ ] **Step 3: `test/clinical-vignettes.test.js`.** In the "Cauda equina, asymmetric ankle jerk" vignette, replace
  the token string `"saddle_anaesthesia@midline sphincter_dysfunction@midline reflex_ankle_loss@right radicular_pain@midline"`
  with `"saddle_anaesthesia@midline sphincter_dysfunction@midline reflex_ankle_loss@right radicular_pain@left radicular_pain@right"`.
  In the "Conus" vignette, replace `"saddle_anaesthesia@midline sphincter_dysfunction@midline hyperreflexia@midline babinski@midline"`
  with `"saddle_anaesthesia@midline sphincter_dysfunction@midline hyperreflexia@left hyperreflexia@right babinski@left babinski@right"`.

- [ ] **Step 4: `test/why.test.js`.** Replace

```js
  ok("an isolated Babinski does not localise: several places, cortex → cord",
     w.verdict === "several" && w.steps[0].where === "cerebral cortex → spinal cord", w.steps[0].where);
```

with

```js
  // "Could arise at" lists every producer: the conus makes a left up-going plantar too (with the right — its limb
  // signs are on both sides), though the differential rules it out here by the known-negative rule.
  ok("an isolated Babinski does not localise: several places, cortex → cord (and the conus)",
     w.verdict === "several" && w.steps[0].where === "cerebral cortex → spinal cord, conus", w.steps[0].where);
```

and replace

```js
    "Guillain-Barré (symmetric LMN + areflexia)": "bilateral lmn_weakness + bilateral reflex_knee_loss",
```

with

```js
    // Bilateral flaccid weakness now also fits the cauda (its limb signs are on both sides), so the knee jerks lead.
    "Guillain-Barré (symmetric LMN + areflexia)": "bilateral reflex_knee_loss + bilateral lmn_weakness",
```

- [ ] **Step 5: `test/vocab-rulings.test.js`.** Replace

```js
  const conus = solve(new Set(["saddle_anaesthesia@midline", "sphincter_dysfunction@midline", "hyperreflexia@midline", "babinski@midline"]), opts);
```

with

```js
  const conus = solve(new Set(["saddle_anaesthesia@midline", "sphincter_dysfunction@midline",
                               "hyperreflexia@left", "hyperreflexia@right", "babinski@left", "babinski@right"]), opts);
```

and replace

```js
  ok("down-going plantars on BOTH sides also count against a midline up-going plantar (the conus)",
     normalNegatives(new Set(["plantar_flexor@left", "plantar_flexor@right"])).has("babinski@midline"));
```

with

```js
  // The conus predicts an up-going plantar on BOTH sides (spec 2026-09-29-conus-cauda-bilateral), so the per-side
  // rule reaches it; the old both-sides -> midline rule is gone.
  const both = normalNegatives(new Set(["plantar_flexor@left", "plantar_flexor@right"]));
  ok("down-going plantars on BOTH sides count against both up-going plantars (so against the conus)",
     both.has("babinski@left") && both.has("babinski@right") && !both.has("babinski@midline"));
```

- [ ] **Step 6: `test/cauda-conus.test.js`, the header and imports.** Replace

```js
// pure LMN (+ radicular pain) → cauda equina; UMN signs present → conus. Findings are midline.
// Run: node test/cauda-conus.test.js

import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";
```

with

```js
// pure LMN (+ radicular pain) → cauda equina; UMN signs present → conus. Saddle numbness, sphincter dysfunction and
// anal wink are midline; the LIMB signs are on both sides, as a clinician enters them (spec 2026-09-29-conus-cauda-
// bilateral) — they used to be midline, and every "Both" entry of the classic pictures said two lesions.
// Run: node test/cauda-conus.test.js

import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";
import { offersFor, currentTokens } from "../app/sides.js";
```

- [ ] **Step 7: the pictures.** Replace the old `umn_signs` conus picture:

```js
const ces = ["lmn_weakness@midline","saddle_anaesthesia@midline","sphincter_dysfunction@midline","radicular_pain@midline"];
const conus = ["umn_signs@midline","saddle_anaesthesia@midline","sphincter_dysfunction@midline"];
```

with

```js
const B = f => [`${f}@left`, `${f}@right`];
const ces = [...B("lmn_weakness"), "saddle_anaesthesia@midline", "sphincter_dysfunction@midline", ...B("radicular_pain")];
const conus = [...B("babinski"), ...B("hyperreflexia"), "saddle_anaesthesia@midline", "sphincter_dysfunction@midline"];
```

- [ ] **Step 8: the new assertions.** Insert directly before the line `// ---- report ----`:

```js
// 5. The classic pictures, entered as a clinician enters them, are ONE lesion — each said "needs more than one
//    lesion" while the conus and cauda emitted their limb signs on midline.
{
  const opts = { dominantSide: "left" };
  const saddle = ["saddle_anaesthesia@midline", "sphincter_dysfunction@midline"];
  const one = (label, toks, id) => {
    const r = solve(new Set([...saddle, ...toks]), opts);
    ok(`${label} → one lesion, ${id}`, r.explainAll.length === 1 && r.display[0].site.id === id);
  };
  one("sciatica on both sides", B("radicular_pain"), "cauda_equina");
  one("sciatica on one side", ["radicular_pain@left"], "cauda_equina");
  one("both plantars up + brisk reflexes", [...B("babinski"), ...B("hyperreflexia")], "conus_medullaris");
  one("both legs flaccid-weak + wasting", [...B("lmn_weakness"), ...B("wasting")], "cauda_equina");
  one("one leg flaccid-weak + floppy", ["lmn_weakness@left", "hypotonia@left"], "cauda_equina");
}

// 6. None of the seven limb signs is offered on midline; every one is offered on the left and the right.
{
  const SEVEN = ["radicular_pain", "lmn_weakness", "hypotonia", "wasting", "babinski", "hyperreflexia", "spasticity"];
  const keys = f => offersFor(f).map(o => o.key);
  ok("no conus/cauda limb sign is offered on midline", SEVEN.every(f => !keys(f).includes("midline")));
  ok("  each is offered left and right", SEVEN.every(f => keys(f).includes("left") && keys(f).includes("right")));
  ok("  saddle numbness is still midline", keys("saddle_anaesthesia").join() === "midline");
}

// 7. A saved link from before the change still loads the right answer.
{
  ok("legacy midline sciatica becomes both sides",
     currentTokens(["radicular_pain@midline"]).join() === "radicular_pain@left,radicular_pain@right");
  ok("  an offered token passes through untouched", currentTokens(["saddle_anaesthesia@midline"]).join() === "saddle_anaesthesia@midline");
  ok("  a token on a side never offered is dropped", currentTokens(["saddle_anaesthesia@left"]).length === 0);
  const legacy = ["saddle_anaesthesia@midline", "sphincter_dysfunction@midline", "radicular_pain@midline", "anal_wink_loss@midline"];
  const r = solve(new Set(currentTokens(legacy)), { dominantSide: "left" });
  ok("  the old worked-example link loads the cauda, one lesion", r.explainAll.length === 1 && r.display[0].site.id === "cauda_equina");
}

// 8. Down-going plantars on both sides still count against the conus.
{
  const r = solve(new Set(["saddle_anaesthesia@midline", "sphincter_dysfunction@midline", ...B("hyperreflexia"),
                           "plantar_flexor@left", "plantar_flexor@right"]), { dominantSide: "left" });
  const c = r.differential.find(x => x.site.id === "conus_medullaris");
  ok("both plantars down demote the conus", !!c && !!c.against);
}

```

- [ ] **Step 9: Run them and watch them fail.**

Run: `for f in cauda-conus tone discriminators clinical-vignettes why vocab-rulings; do PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/$f.test.js 2>&1 | grep -cE "^FAIL|SyntaxError"; done`
Expected: every suite reports failures. `cauda-conus` fails to load with
`does not provide an export named 'currentTokens'`.

---

### Task 2: The model change

**Files:** `src/model/structures.js`, `app/examples.js`, `app/sides.js`, `app/app.js`, `src/engine/inverse.js`

**Interfaces:**
- Produces: `currentTokens(tokens: string[]) → string[]` (app/sides.js).
  - Offered tokens pass through in order.
  - A `@midline` token becomes `@left` + `@right` where both are offered.
  - Anything else unoffered is dropped.
  - The result is de-duplicated.

- [ ] **Step 1: Seven structures emit on both sides.** In `src/model/structures.js`, on the line of each of
  `ls_roots_pain`, `ls_roots_motor`, `cauda_hypotonia`, `cauda_wasting`, `conus_bab`, `conus_cst`, `conus_spast`,
  change `crosses: false,` to `crosses: false, emit: "bilateral",`. None of them has an `emit` today. Afterwards:

```js
  { id: "ls_roots_motor",       level: "cauda", part: "equina", produces: "lmn_weakness",         crosses: false, emit: "bilateral",
  { id: "ls_roots_pain",        level: "cauda", part: "equina", produces: "radicular_pain",         crosses: false, emit: "bilateral",
  { id: "conus_cst",            level: "conus", part: "medullaris", produces: "hyperreflexia",        crosses: false, emit: "bilateral",
  { id: "conus_bab",            level: "conus", part: "medullaris", produces: "babinski",             crosses: false, emit: "bilateral",
  { id: "conus_spast", level: "conus", part: "medullaris", produces: "spasticity", crosses: false, emit: "bilateral", note: …
  { id: "cauda_hypotonia", level: "cauda", part: "equina", produces: "hypotonia", crosses: false, emit: "bilateral", note: …
  { id: "cauda_wasting", level: "cauda", part: "equina", produces: "wasting", crosses: false, emit: "bilateral", note: …
```

- [ ] **Step 2: The three note words.** Replace:
  - `note: "corticospinal fibres at the conus — increased tone (UMN), midline"` with
    `note: "corticospinal fibres at the conus — increased tone (UMN), both legs"`;
  - `note: "cauda equina — flaccid, hypotonic legs, midline"` with
    `note: "cauda equina — flaccid, hypotonic, both legs"`;
  - `note: "cauda equina — denervation wasting, midline"` with
    `note: "cauda equina — denervation wasting, both legs"`.

- [ ] **Step 3: The worked example.** In `app/examples.js`, replace

```js
    tokens: ["saddle_anaesthesia@midline", "sphincter_dysfunction@midline",
             "radicular_pain@midline", "anal_wink_loss@midline"],
```

with

```js
    // Sciatica on BOTH sides — bilateral sciatica is the red flag, and it is what the Why line names (the cauda's
    // limb signs are emitted on both sides, spec 2026-09-29-conus-cauda-bilateral).
    tokens: ["saddle_anaesthesia@midline", "sphincter_dysfunction@midline",
             "radicular_pain@left", "radicular_pain@right", "anal_wink_loss@midline"],
```

- [ ] **Step 4: `currentTokens`.** In `app/sides.js`, directly after the line
  ``export const offersFor = f => OFFERS[f] || [{ key: "none", tokens: [`${f}@none`] }];``, insert:

```js

// A SAVED LINK can carry a token on a side its finding is no longer offered on — the conus and cauda limb signs moved
// from midline to both sides (spec 2026-09-29-conus-cauda-bilateral), and a stale @midline would match nothing and
// load a false two-lesion answer. Midline becomes left + right where both are offered; anything else unoffered is
// dropped. Offered tokens pass through untouched, in order.
export function currentTokens(tokens) {
  const out = [];
  for (const tok of tokens) {
    const [f, side] = tok.split("@");
    const offered = offersFor(f).flatMap(o => o.tokens);
    if (offered.includes(tok)) out.push(tok);
    else if (side === "midline" && offered.includes(`${f}@left`) && offered.includes(`${f}@right`)) out.push(`${f}@left`, `${f}@right`);
  }
  return [...new Set(out)];
}
```

- [ ] **Step 5: Links load through it.** In `app/app.js`, replace
  `import { offersFor, tokensForRow } from "./sides.js";` with
  `import { offersFor, tokensForRow, currentTokens } from "./sides.js";`, and in `restoreFromURL` replace
  `  if (st.tokens) S.tokens = st.tokens;` with
  `  if (st.tokens) S.tokens = new Set(currentTokens([...st.tokens]));`. (`decodeCase` returns the tokens as a Set.)

- [ ] **Step 6: The dead rule.** In `src/engine/inverse.js`, replace the comment above `normalNegatives`

```js
// The abnormal tokens the explicit normals count against: that finding on that side, and its midline form once
// the normal is recorded on BOTH sides (the conus emits its UMN signs @midline). A normal that contradicts an
// entered abnormal finding is ignored.
```

with

```js
// The abnormal tokens the explicit normals count against: that finding on that side. (A both-sides -> midline rule
// lived here while the conus emitted its UMN signs @midline; it emits them on both sides now, so the per-side rule
// covers it.) A normal that contradicts an entered abnormal finding is ignored.
```

and its body

```js
  const neg = new Set(), sides = {};
  for (const tok of observedSet) {
    if (!isNormalToken(tok)) continue;
    const [f, side] = tok.split("@");
    const abn = EXPLICIT_NORMAL[f];
    if (!observedSet.has(`${abn}@${side}`)) neg.add(`${abn}@${side}`);
    (sides[abn] ??= new Set()).add(side);
  }
  for (const [abn, s] of Object.entries(sides))
    if (s.has("left") && s.has("right") && !observedSet.has(`${abn}@midline`)) neg.add(`${abn}@midline`);
  return neg;
```

with

```js
  const neg = new Set();
  for (const tok of observedSet) {
    if (!isNormalToken(tok)) continue;
    const [f, side] = tok.split("@");
    const abn = EXPLICIT_NORMAL[f];
    if (!observedSet.has(`${abn}@${side}`)) neg.add(`${abn}@${side}`);
  }
  return neg;
```

- [ ] **Step 7: The full suite.** Run `npm test` into `$SP/nl.log` (the session scratchpad), then count lines.
  Expected: exit 0, **82** `passed, N failed` lines, **7100** `PASS` lines, no `FAIL`.

- [ ] **Step 8: Commit** (Tasks 1 and 2 together: the tests and the change they describe).

```bash
git add src/model/structures.js app/examples.js app/sides.js app/app.js src/engine/inverse.js test/cauda-conus.test.js test/tone.test.js test/discriminators.test.js test/clinical-vignettes.test.js test/why.test.js test/vocab-rulings.test.js
git commit -m "fix: the conus and cauda limb signs are on both sides

Saddle numbness + sphincter dysfunction with sciatica on both sides or one, both
plantars up, or bilateral flaccid weakness said 'needs more than one lesion': the conus
and cauda emitted their limb signs @midline while clinicians enter L / R / Both. Seven
structures emit bilateral (the cauda ankle-jerk precedent). The cauda example enters
bilateral sciatica; legacy midline links convert (currentTokens); the dead
both-sides -> midline rule in normalNegatives is removed.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: The anatomy sheet and the browser

**Files:** `docs/artifacts/anatomy-model.html`

- [ ] **Step 1: Seven rows.** For each of `conus_cst`, `conus_bab`, `conus_spast`, `ls_roots_motor`, `ls_roots_pain`,
  `cauda_hypotonia` and `cauda_wasting`, replace
  `<span class="badge bm">MIDLINE</span><div class="m"><div class="id">{id}</div>` with
  `<span class="badge bb">BILAT</span><div class="m"><div class="id">{id}</div>`. Each occurs once.

- [ ] **Step 2: Verify the sheet.** In node:
  - read the sheet's `<div class="id">…</div>` ids;
  - compare them with `STRUCTURES`.

  Expected: 594 rows, 594 structures, 0 missing, 0 extra, 0 duplicates. Every structure with `emit: "bilateral"`
  should have a BILAT row.

- [ ] **Step 3: Browser.** `preview_start { name: "NeuroLocaliser app" }`. After changing only the hash, reload the
  page (a hash change alone does not re-render). Check:
  1. **The cauda worked example.** Click it from the empty state. The answer card should read:
     - Where "Midline cauda equina.";
     - Why "Bilateral sciatica-type root pain (radicular pain) → only the cauda equina.";
     - What "Most likely Central lumbar disc prolapse (must not miss). Must not miss: Spinal epidural abscess.";
     - the immediate spinal-surgery referral on the Next line.
  2. **A "Both" entry.** Set "Symptoms on" to Both, then tick saddle numbness, bladder or bowel dysfunction, and
     sciatica-type root pain. Expected: the cauda, one lesion, with no multifocal banner.
  3. **The side buttons.** The root pain row offers L and R, and no M.
  4. **A legacy link.** Navigate to
     `#f=saddle_anaesthesia@midline,sphincter_dysfunction@midline,radicular_pain@midline,anal_wink_loss@midline` and
     reload. Expected: the cauda, one lesion, and the URL rewritten with `radicular_pain@left,radicular_pain@right`.
  5. `read_console_messages` with `onlyErrors`: none.

- [ ] **Step 4: Commit.**

```bash
git add docs/artifacts/anatomy-model.html
git commit -m "docs: anatomy sheet — the seven conus/cauda limb signs are BILAT

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Owner review (STOP here)

- [ ] **Step 1:** Show the owner:
  - the model change: the seven structures;
  - the three note words, including "cauda equina — flaccid, hypotonic, both legs", reworded so it doesn't read
    "legs, both legs";
  - the spec's §4 table, confirmed in the browser.
- [ ] **Step 2: STOP for the ruling.** If they rule on something, take it back to the spec (§2) and change the rule
  and tests. Do not patch individual sites.

---

### Task 5: Release

- [ ] **Step 1: Version 0.10.2.** In `package.json` and `app/brand.js`, change `0.10.1` → `0.10.2`. In `README.md`,
  change `**Beta (v0.10.1), deployed` → `**Beta (v0.10.2), deployed`.
- [ ] **Step 2: CLAUDE.md.**
  - Status line: `**82 test suites / 7087 assertions green**` → `**82 test suites / 7100 assertions green**`.
  - Add a section before `## Commands`: "Conus and cauda signs on both sides (DONE 2026-09-29, v0.10.2)". Cover:
    - the defect, with its five pictures;
    - the owner ruling (seven signs; the conus stays symmetric and the cauda asymmetric);
    - the mechanics: the side offers follow automatically; `currentTokens` converts legacy links; the dead
      `normalNegatives` rule is removed;
    - the worked example's new Why line;
    - the stale `umn_signs` fixture found on the way;
    - the spec and plan paths.
- [ ] **Step 3: Status lines.** The spec and this plan → `**Status: IMPLEMENTED (<date>).**`.
- [ ] **Step 4: Full suite** (as in Task 2 Step 7): 82 / 7100, no FAIL. Commit
  `docs: conus/cauda signs on both sides recorded; v0.10.2`.
- [ ] **Step 5: Finish the branch** with superpowers:finishing-a-development-branch. If the owner chooses a PR, it
  targets `fix/onset-follows-cause` (stacked). If PR #14 is already merged by then, it targets `main`. Bind it with the
  ccd_pr tools. **Republish the anatomy sheet** in place (the URL in `docs/artifacts/README.md`) once the owner has
  reviewed it.

---

## Execution log

**2026-09-29, inline (owner's choice).**

- **Tasks 1–2** — as written. Committed as `c230f70`. All 11 files were byte-identical to the prototype, and the full
  suite was 82 suites / 7100 green.
- **Task 3** — the sheet rows went in as written, committed as `d401024` (594/594). Browser checks: the worked
  example ✓, the side buttons ✓, the legacy link ✓ (the URL is rewritten to left + right), no console errors. **Check 2
  (a "Both" entry through row taps) FAILED.** The tap entered sphincter dysfunction left + right, because it was still
  offered on a side through the pudendal nerve. The picture became "cauda + left and right pudendal nerves"; with
  "Left" set it failed the same way. This has been live since v0.10.0's row taps. The engine tests could not see it,
  because they enter tokens, not taps.
- **Task 4, owner review:** the notes were approved as built, and the owner ruled **the pudendal nerve's sphincter
  dysfunction is midline too** (spec §2, ruling 3). Done TDD:
  - `pud_sphincter` got `emit: "midline"`;
  - `currentTokens` converts a one-sided token to midline where only midline is offered;
  - the sheet's `pud_sphincter` row changed IPSI → MIDLINE;
  - `cauda-conus` gained section 9 (4 assertions);
  - `tier2-pns-depth`'s pudendal fixture moved to midline;
  - `app-smoke`'s "multifocal case" (itself the trap) became the "Two lesions" example;
  - one section 7 assertion now uses `weak_arm@none`, because `saddle_anaesthesia@left` is now correctly converted
    to midline.

  Browser re-check: "Both" + row taps → the cauda, one lesion; "Left" + row taps → the cauda, *"Saddle numbness +
  left sciatica-type root pain → only the cauda equina."* No finding is offered on both midline and a side any
  more. Full suite: **82 suites / 7104 green**, so Task 5 uses 7104, not 7100.

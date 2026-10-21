# Spinal Cord Fix (round 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status: NOT STARTED.** Spec: `docs/superpowers/specs/2026-10-22-spinal-cord-fix-design.md`. All 13 rows were
approved as written on 2026-10-22.

**Goal:** Make the engine localise along the spinal cord. The thirteen approved rulings, in short:
- cord segment variants (arms spared, at-level spans, spinal shock);
- a stated sensory level as evidence;
- cord and conus prevalence;
- upper motor neurone grading of known negatives;
- saddle loss in the complete cord;
- arm signs in the central cord;
- the level line and field in the app;
- four new audit probes.

**Architecture:** A cord site may carry `variants`, alternative structure lists for the SAME lesion at another segment
or in spinal shock. They are derived in `sites.js` from the structure catalogue. `inverse.js` `solverSites(opts)`
expands them, the solver keeps each id once (its best variant), and `candidateSites()` stays one site per id. A stated
sensory level demotes (never excludes) sites that cannot produce it, restricts which variants may apply, and gates
spinal shock. App text lives in a new pure module, `app/level-axis.js`.

**Tech Stack:** zero-dependency ES modules (Node 24); standalone test scripts; no build step.

## Global Constraints

- Node is NOT on PATH. Prefix every command: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"`.
- Work only in the worktree `Code/neurolocaliser-cord/`, on branch `fix/cord-localisation`. Do not touch
  `Code/neurolocaliser-engine/` (PR #17) or `Code/neurolocaliser-audit/` (PR #18). Merge nothing. Push nothing
  unless the owner asks.
- **Site ids never change and variants never add ids.** The audit and the vignettes pin exact ids; new ids were
  measured at 4/16 for the cord.
- **Never loosen or edit an existing assertion in `test/clinical-audit.test.js`.** The only change to that file is
  appending the four probes approved in row 13 (Task 1).
- `npm test` must be green at the end of every task. Two pinned assertions may change, and only as approved:
  - `test/cauda-conus.test.js`, the conus case (row 11, Task 6);
  - `test/tone.test.js`, the hypotonia levels (row 12, Task 7).
- Golden rule (CLAUDE.md): no `if (hasX && hasY)` syndrome logic. Everything derives from structures sharing a
  lesion.
- The level demotion never excludes a site and never creates or removes a multifocal claim.
- Spinal shock is offered only when a sensory level is stated.
- No specific clinical figures (thresholds, intervals) in any new text (owner content rule).
- New clinical wording goes to the owner in the content round (spec §8) BEFORE this branch merges:
  - the level notes in Task 8;
  - the structure notes in Tasks 6–7;
  - the contradiction sentence in Task 10;
  - the anatomy-sheet rows in Task 11.
- Every new structure gets an anatomy-sheet row (`docs/artifacts/anatomy-model.html`). Republishing the Artifact
  needs the owner's go-ahead.

## Measured target (prototype, spec §5)

- `npm run test:audit`: **79 / 105** probes. That is 75/101 plus the four row-13 probes, which pass. Spinal cord
  19 / 20.
- Every other region and the metamorphic totals are unchanged: swaps 103/224, comorbidity 144/292, mirror 263/263.
- `npm test`: green.

If a task's numbers differ from the expectation it states, stop and investigate before the next task.

## File map

| File | Responsibility | Tasks |
|---|---|---|
| `test/clinical-audit.test.js` | + 4 approved probes (append only) | 1 |
| `docs/superpowers/specs/2026-10-18-clinical-audit-suite.md` | record the 4 probes | 1 |
| `test/cord-segment.test.js` (new) | pins each approved row | 2–9 |
| `src/model/prevalence.js` | row 4 | 2 |
| `src/engine/inverse.js` | `solverSites`, `firstPerId`, known-negative grading, level demotion, `describeLevel` | 3, 4, 7, 8 |
| `src/model/levels.js` | `spanName()` | 4 |
| `src/model/sites.js` | `cordVariants`, `armsSpared`, cord composites | 4, 5, 6, 7, 9 |
| `src/engine/why.js` | station index over variants | 4 |
| `src/engine/forward.js` | at-level rows on their own side | 5 |
| `src/model/structures.js` | `cord_saddle` + 6 spinal-shock rows | 6, 7 |
| `test/cauda-conus.test.js`, `test/tone.test.js` | the two approved re-pins | 6, 7 |
| `app/level-axis.js` (new), `test/level-axis.test.js` (new), `app/app.js` | rows 9–10 in the app | 10 |
| `package.json` | two new suites in `test` | 2, 10 |
| CLAUDE.md, README.md, CONTRIBUTING.md, `docs/artifacts/*.html`, the spec | docs | 11 |

---

### Task 1: The four approved audit probes (row 13)

**Files:**
- Modify: `test/clinical-audit.test.js`. Insert after the last `T("Spinal cord", …)` line, the one labelled
  "spinal shock entered as weak legs + areflexia, level T6 → acute cord".
- Modify: `docs/superpowers/specs/2026-10-18-clinical-audit-suite.md`
- Modify: `CLAUDE.md`, the "Clinical audit" bullet under "## Commands"

**Interfaces:** Consumes the existing `T(region, label, toks, want, opts)` helper and `CORD` regex. Produces nothing
other tasks call.

- [ ] **Step 1: Append the probes.** Insert this block right after the "spinal shock entered as weak legs" `T(...)`
  line, before the blank line and `// Cauda & conus`:

```js
// owner-approved 2026-10-22 (spinal cord fix, round 1, row 13): pictures the sensory-level options decide, which no
// audit probe covered. Each failed on the 2026-10-18 baseline.
T("Spinal cord", "conus picture with a T10 level → a cord lesion at or above T10, not the conus", "saddle_anaesthesia@midline sphincter_dysfunction@midline babinski@left babinski@right", { first: CORD, level: /T10/ }, { sensoryLevel: "T10" });
T("Spinal cord", "spastic legs with a C4 level → a cervical cord lesion, not the conus", "hyperreflexia@left hyperreflexia@right babinski@left babinski@right spasticity@left spasticity@right", { first: CORD, level: /C4/ }, { sensoryLevel: "C4" });
T("Spinal cord", "C6/7 myeloradiculopathy (R triceps jerk lost + weak elbow extension, legs UMN) → one cord lesion", "reflex_triceps_loss@right weak_elbow_extension@right hyperreflexia@left hyperreflexia@right babinski@left babinski@right", { first: CORD, single: true });
T("Spinal cord", "flaccid areflexic legs with a T6 level (no sphincter or pain loss) → acute cord, not GBS", "lmn_weakness@left lmn_weakness@right reflex_knee_loss@left reflex_knee_loss@right reflex_ankle_loss@left reflex_ankle_loss@right", { first: CORD }, { sensoryLevel: "T6" });
```

- [ ] **Step 2: Run the audit and confirm the four new probes fail.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm run test:audit | tail -20`
Expected:
- `Spinal cord   6/20`.
- `all probes   66/105`.
- The harness line still passes, because every token is offered on its side.
- Exit code 1, by design.

- [ ] **Step 3: Record them in the audit spec.**
  - In `docs/superpowers/specs/2026-10-18-clinical-audit-suite.md`, change the first bullet under "## What it is"
    from `- **101 probes**: the audit's \`c1–c6.json\` cases.` to
    `- **105 probes**: the audit's 101 \`c1–c6.json\` cases, plus 4 added by the spinal cord fix (below).`
  - Append this section at the end of the file:

```markdown
## Spinal cord fix, round 1, row 13: four probes added (2026-10-22)

The spinal cord fix's round 1 (`2026-10-22-spinal-cord-fix-design.md`, row 13, approved as written) added four
counted probes. They cover pictures that the sensory-level options decide and that no probe covered. Each fails on
the 2026-10-18 baseline:

| Probe | Expected answer (approved) | Baseline |
|---|---|---|
| saddle + sphincter + both Babinski, level T10 | a cord site first; the level note names T10 | conus first; "below the cord" |
| spastic legs, level C4 | a cord site first; the level note names C4 | conus first; "below the cord" |
| R triceps jerk lost + weak elbow extension + both legs UMN | a cord site first; one lesion | conus + R C7 root, "vasculitis" |
| flaccid areflexic legs, level T6 (no sphincter or pain loss) | a cord site first | GBS first |

Baseline with them: **66 / 105** probes; spinal cord **6 / 20**.
```

  - In CLAUDE.md, in the "Clinical audit" bullet under "## Commands":
    - Replace `the 2026-10-18 audit's 101 bedside probes` with
      `the 2026-10-18 audit's 101 bedside probes (+ 4 added by the spinal cord fix, 2026-10-22)`.
    - Replace `Baseline: 66/101 probes correct.` with
      `Baseline: 66/101 probes correct (66/105 with the cord fix's four).`

- [ ] **Step 4: Confirm `npm test` is untouched.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test > /tmp/cord-npm.txt 2>&1; echo "exit $?"; grep -c "^\s*PASS" /tmp/cord-npm.txt`
Expected: `exit 0`, `7134`.

- [ ] **Step 5: Commit.**

```bash
git add test/clinical-audit.test.js docs/superpowers/specs/2026-10-18-clinical-audit-suite.md CLAUDE.md
git commit -m "test(audit): four cord probes approved in the spinal cord fix's round 1 (row 13)"
```

---

### Task 2: Prevalence — the cord's own tier, the conus rare (row 4)

**Files:**
- Create: `test/cord-segment.test.js`
- Modify: `src/model/prevalence.js:1-15` (header comment, `RARE_LEVELS`) and `:39-46` (`prevalenceOf`)
- Modify: `package.json`. Add `node test/cord-segment.test.js` to the `test` script, right after
  `node test/cauda-conus.test.js`.

**Interfaces:** Produces the suite skeleton every later task appends to. Later sections go **above** the
`// ---- report ----` line.

- [ ] **Step 1: Write the suite with the row-4 section.**

```js
// cord-segment.test.js — WHERE along the cord (spinal cord fix, round 1; spec 2026-10-22-spinal-cord-fix-design.md).
// The cross-section says WHICH cord syndrome; the segment says WHERE along the cord, and a stated sensory level now
// counts as evidence of where. Each section pins one approved row of the round-1 ruling table.
// Run: node test/cord-segment.test.js
import { solve, candidateSites, knownNegatives } from "../src/engine/inverse.js";
import { expectedFindings } from "../src/engine/forward.js";
import { prevalenceOf, UNCOMMON, RARE } from "../src/model/prevalence.js";

let pass = 0, fail = 0;
function ok(label, cond, detail = "") { cond ? pass++ : fail++; console.log(`${cond ? "PASS" : "FAIL"}  ${label}${cond ? "" : "  " + detail}`); }
const L = s => new Set(s.split(/\s+/).filter(Boolean));
const B = f => `${f}@left ${f}@right`;
const site = id => candidateSites().find(s => s.id === id);
const first = r => r.display[0]?.site;
const ids = r => r.display.map(c => c.site.id);

// ---- Row 4: prevalence — the bilateral cord patterns take the cord's own tier; the conus is rare ----
ok("the bilateral anterior cord is UNCOMMON (the cord's own tier), no longer RARE", prevalenceOf(site("bilateral_cord_anterior")) === UNCOMMON);
ok("…and so are the posterior and the central cord", prevalenceOf(site("bilateral_cord_posterior")) === UNCOMMON && prevalenceOf(site("bilateral_cord_central")) === UNCOMMON);
ok("the transverse cord stays RARE (its own RARE_PARTS entry)", prevalenceOf(site("bilateral_cord_transverse")) === RARE);
ok("the conus is RARE", prevalenceOf(site("conus_medullaris")) === RARE);
ok("the cauda is unchanged (UNCOMMON)", prevalenceOf(site("cauda_equina")) === UNCOMMON);
ok("other bilateral sites stay RARE (locked-in)", prevalenceOf(site("locked_in")) === RARE);

// ---- report ----
console.log(`\ncord segment: ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run it and confirm it fails.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cord-segment.test.js`
Expected: `FAIL` on the anterior, the posterior/central and the conus lines; exit 1.

- [ ] **Step 3: Implement in `src/model/prevalence.js`.** There are three edits.
  - In the header comment, replace these two lines

```js
// common; bilateral / composite and eponymous-rarity localisations are rare. Clinician-tunable — edit the
// sets below. Precedence: rare wins → explicit (level,part) → level default → global default (uncommon).
```

  with

```js
// common; bilateral / composite and eponymous-rarity localisations are rare — except a bilateral CORD lesion,
// which takes the cord's own tier (a paraparesis is the common myelopathy picture). Clinician-tunable — edit the
// sets below. Precedence: rare wins → explicit (level,part) → level default → global default (uncommon).
```

  - Replace everything from the line `// Rare by level — bilateral / composite / eponymous-rarity localisations.` down to
    the `]);` that closes `RARE_LEVELS`. The replacement is below, and adds `OWN_TIER_BILATERAL_LEVELS` after the set:

```js
// Rare by level — bilateral / composite / eponymous-rarity localisations. The conus joined 2026-10-22 (spinal cord
// fix, row 4): an isolated conus lesion is far rarer than a myelopathy, and it escaped "bilateral = rare" only because
// its side is "midline" — so it outranked the cord for a spastic paraparesis.
const RARE_LEVELS = new Set([
  "locked_in", "combined_degeneration", "guillain_mollaret", "pseudobulbar", "brainstem_aras",
  "thalamus_arousal", "corpus_callosum", "hypothalamus", "pontomesencephalic", "dorsal_midbrain",
  "craniocervical_junction", "central_vestibular", "polyradiculoneuropathy", "conus",
]);
// Bilateral sites that take their level's own tier instead of RARE. A bilateral cord lesion IS the common myelopathy
// picture, so the blanket rule made every cord pattern rare (spinal cord fix, row 4). The transverse cord stays RARE
// through RARE_PARTS.
const OWN_TIER_BILATERAL_LEVELS = new Set(["cord"]);
```

  - In `prevalenceOf`, replace
    `  if (site.side === "bilateral") return COMMON_BILATERAL_LEVELS.has(site.level) ? COMMON : RARE;` with
    `  if (site.side === "bilateral" && !OWN_TIER_BILATERAL_LEVELS.has(site.level)) return COMMON_BILATERAL_LEVELS.has(site.level) ? COMMON : RARE;`

- [ ] **Step 4: Run the suite and `npm test`.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cord-segment.test.js && PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test > /tmp/cord-npm.txt 2>&1; echo "exit $?"`
Expected:
- The suite reports `6 passed, 0 failed`.
- `npm test` exits 0. Measured: the prevalence change alone flips nothing.

- [ ] **Step 5: Commit.**

```bash
git add test/cord-segment.test.js src/model/prevalence.js package.json
git commit -m "fix(cord): a bilateral cord lesion takes the cord's own tier; the conus is rare (row 4)"
```

---

### Task 3: Upper motor neurone signs come before weakness (row 5)

**Files:**
- Modify: `src/engine/inverse.js:58-76` (`OPPOSITE_SIDE`, `knownNegatives`)
- Test: `test/cord-segment.test.js`

**Interfaces:** `knownNegatives(observedSet) → Set<token>` keeps its signature; only its contents change.

- [ ] **Step 1: Add the failing section** above `// ---- report ----`:

```js
// ---- Row 5: upper motor neurone signs come before weakness (known negatives) ----
{
  const neg = knownNegatives(L("weak_leg@right babinski@right babinski@left"));
  ok("a left Babinski means the left corticospinal tract is involved: left leg weakness is NOT a known normal", !neg.has("weak_leg@left"));
  const emb = knownNegatives(L("weak_arm@right weak_leg@left"));
  ok("weakness never excuses: R arm + L leg keeps the L arm and the R leg as known normals", emb.has("weak_arm@left") && emb.has("weak_leg@right"));
  const lone = knownNegatives(L("weak_leg@right babinski@right"));
  ok("with nothing entered on the left, the left leg and plantar stay known normals", lone.has("weak_leg@left") && lone.has("babinski@left"));
  const r = solve(L("weak_leg@right babinski@right babinski@left sphincter_dysfunction@midline"));
  ok("asymmetric compression (R leg weak + both Babinski + sphincter) → a cord lesion first, one lesion", first(r)?.level === "cord" && r.multi === null, ids(r).slice(0, 3).join(", "));
}
```

- [ ] **Step 2: Run the suite and confirm it fails.** Expected: FAIL on the first and the last line of the section.

- [ ] **Step 3: Implement.** In `src/engine/inverse.js`, replace

```js
const OPPOSITE_SIDE = { left: "right", right: "left" };
```

with

```js
const OPPOSITE_SIDE = { left: "right", right: "left" };
// UPPER MOTOR NEURONE SIGNS COME BEFORE WEAKNESS (spinal cord fix, row 5, 2026-10-22). A Babinski, brisk reflexes,
// spasticity or Hoffmann's entered on a side means that side's corticospinal tract IS involved, so its other
// corticospinal signs there are a matter of degree, not a known normal: "right leg weak + both plantars up" no longer
// rules out every bilateral cord lesion. Weakness never excuses — "right arm + left leg weak" stays two lesions.
const CORTICOSPINAL_SIGNS = new Set(["weak_arm", "weak_leg", "babinski", "hyperreflexia", "spasticity", "hoffmann"]);
const UMN_RELEASE_SIGNS = ["babinski", "hyperreflexia", "spasticity", "hoffmann"];
```

and inside `knownNegatives`, replace

```js
    const homolog = `${f}@${other}`;
    if (!observedSet.has(homolog)) neg.add(homolog);
```

with

```js
    if (CORTICOSPINAL_SIGNS.has(f) && UMN_RELEASE_SIGNS.some(g => observedSet.has(`${g}@${other}`))) continue;
    const homolog = `${f}@${other}`;
    if (!observedSet.has(homolog)) neg.add(homolog);
```

- [ ] **Step 4: Run the suite and `npm test`.** Expected: the suite has 0 failures; `npm test` exits 0. Measured: the
  embolic two-lesion picture and every multifocal suite stay green.

- [ ] **Step 5: Commit.**

```bash
git add src/engine/inverse.js test/cord-segment.test.js
git commit -m "fix(cord): an UMN sign on a side means that tract is involved — a missing sign there is a grade (row 5)"
```

---

### Task 4: Variants, the arms-spared reading, and the note that follows the answer (rows 2, 9)

**Files:**
- Modify: `src/model/levels.js` (append `spanName`)
- Modify: `src/model/sites.js`:
  - import `spanName`;
  - new helpers before the `// A larger lesion can span medial+lateral` comment (~line 296);
  - `composeHemiLevelSites`;
  - `composeBilateralCordSites`.
- Modify: `src/engine/inverse.js`:
  - add `solverSites` and `firstPerId` after `candidateSites`;
  - `rankSingle`, `differential`, `ruledOutSites` and `nearFit` use them;
  - `solve()` computes `display` before `level`.
- Modify: `src/engine/why.js`. `locusIndex` iterates `solverSites(opts)`.
- Test: `test/cord-segment.test.js`

**Interfaces:**
- Produces `solverSites(opts) → site[]`. These are the candidate sites plus each site's variants as
  `{ ...site, variant, structures, atLevel, segments, variants: undefined }`, keeping the same `id`.
- Produces `site.variants: { key, top?, segments?, atLevel?, needsLevel?, structures }[]` on the bilateral anterior,
  the transverse and both cord hemis.
- Produces `spanName([a, b], dash = "-") → "C5-6" | "C8-T1"`.
- Variant keys used by later tasks: `"arms-spared"`, `"C5-6:left"` style, `"shock"`, `"shock:arms-spared"`.

- [ ] **Step 1: Add the failing section** above `// ---- report ----`:

```js
// ---- Row 2: the cord's segment, as VARIANTS of the same sites ----
{
  const all = candidateSites().map(s => s.id);
  ok("candidateSites() still lists each site once (a variant is never a candidate of its own)", new Set(all).size === all.length && candidateSites().every(s => !s.variant));
  const spastic = L(`${B("hyperreflexia")} ${B("babinski")} ${B("spasticity")}`);
  const r = solve(spastic);
  ok("spastic legs alone → a cord lesion first, read with the arms spared", first(r)?.level === "cord" && first(r)?.variant === "arms-spared", ids(r).slice(0, 3).join(", "));
  ok("…and the conus is still offered, below it", ids(r).indexOf("conus_medullaris") > 0);
  ok("every displayed id is a candidate id (variants add none)", r.display.every(c => all.includes(c.site.id)));
  ok("each id is displayed once", new Set(ids(r)).size === ids(r).length);
  const rl = solve(spastic, { sensoryLevel: "T10" });
  ok("spastic legs + level T10 → the level note follows the displayed cord answer", rl.level.applies && /at or just above T10/.test(rl.level.note), rl.level.note);
  const v = site("bilateral_cord_anterior").variants.find(x => x.key === "arms-spared");
  const e = expectedFindings({ ...site("bilateral_cord_anterior"), structures: v.structures });
  ok("the arms-spared reading predicts no arm weakness and no Hoffmann's, but still the legs", !e.has("weak_arm@left") && !e.has("hoffmann@left") && e.has("weak_leg@left"));
  ok("both hemicords carry the arms-spared reading", ["left_cord_hemi", "right_cord_hemi"].every(id => site(id).variants?.some(x => x.key === "arms-spared")));
  const bs = solve(L("weak_leg@right babinski@right dorsal_sensory@right spinothalamic@left"));
  ok("Brown-Séquard without arm signs → the right hemicord, arms spared", first(bs)?.id === "right_cord_hemi" && first(bs)?.variant === "arms-spared");
}
```

- [ ] **Step 2: Run the suite and confirm it fails.** Expected: FAIL on the spastic-legs and later lines.
  `site(...).variants` is undefined, so the variant lines fail.

- [ ] **Step 3: Implement `spanName`.** Append to `src/model/levels.js`:

```js
// A two-segment span as a name: ["C5","C6"] → "C5-6", ["C8","T1"] → "C8-T1" (dash "–" for prose).
export function spanName([a, b], dash = "-") {
  return a[0] === b[0] ? `${a}${dash}${b.slice(1)}` : `${a}${dash}${b}`;
}
```

- [ ] **Step 4: Implement the variant helpers in `sites.js`.** After `import { STRUCTURES } from "./structures.js";`
  add `import { spanName } from "./levels.js";`. Then insert this block immediately before the comment line
  `// A larger lesion can span medial+lateral at one level/side (a "hemi-level" lesion).`:

```js
// ---- WHERE ALONG THE CORD: variants of one cord lesion (spinal cord fix, round 1 — spec 2026-10-22) ----
// The cross-section says WHICH cord syndrome; a VARIANT says WHERE along the cord. A variant is the same lesion — the
// same id, causes, plans and links — read at another segment or in another state, so it predicts a different set of
// signs. inverse.js solverSites() scores every variant and shows each site once, as its best; candidateSites() still
// lists one site per id. Everything is DERIVED from the structure catalogue.
//   arms-spared — below the arm segments, or cervical and not yet reaching the arm fibres: no arm weakness, no
//                 Hoffmann's. `top` is the highest segment it can occupy, for the sensory-level constraint.
const CORD_ARM_ROWS = new Set(["cst_cord_arm", "cst_cord_hof"]);
const armsSpared = structures => ({ key: "arms-spared", top: "T2", structures: structures.filter(id => !CORD_ARM_ROWS.has(id)) });
function cordVariants(structures) {
  return [armsSpared(structures)];
}
```

- [ ] **Step 5: Attach variants to the cord composites.**
  - In `composeHemiLevelSites`, replace

```js
        structures: parts.flatMap(p => p.structures),
        composite: true
      });
```

  with

```js
        structures: parts.flatMap(p => p.structures),
        composite: true,
        // where along the cord: a hemicord below the arm segments spares the arm (spinal cord fix, row 2)
        ...(level === "cord" ? { variants: [armsSpared(parts.flatMap(p => p.structures))] } : {})
      });
```

  - In `composeBilateralCordSites`, replace

```js
      territory: TERRITORY[`cord|${part}`],
      structures, composite: true
    });
```

  with

```js
      territory: TERRITORY[`cord|${part}`],
      structures, composite: true,
      ...(part === "anterior" ? { variants: cordVariants(structures) } : {})
    });
```

  - and replace

```js
      structures: [...belowLevel, ...autonomic], composite: true
    });
```

  with

```js
      structures: [...belowLevel, ...autonomic], composite: true,
      variants: cordVariants([...belowLevel, ...autonomic])
    });
```

- [ ] **Step 6: Implement the solver side in `src/engine/inverse.js`.**
  - Directly after the closing `}` of `candidateSites()`, add:

```js
// The SOLVER'S enumeration: every candidate site plus its VARIANTS — the same cord lesion read at another segment or
// in spinal shock (sites.js cordVariants; spinal cord fix, round 1). A variant keeps its site's id, so content, links
// and pins are untouched, and every ranked list keeps each site once, as its best variant (firstPerId).
// candidateSites() stays one site per id for everything that enumerates sites (the atlas, the per-site tests).
export function solverSites(opts = {}) {
  const out = [];
  for (const site of candidateSites()) {
    out.push(site);
    for (const v of site.variants || []) out.push(variantOf(site, v));
  }
  return out;
}
const variantOf = (site, v) => ({ ...site, variant: v.key, structures: v.structures, atLevel: v.atLevel,
  segments: v.segments, variants: undefined });
const firstPerId = list => { const seen = new Set(); return list.filter(x => { const id = (x.site || x).id; return !seen.has(id) && !!seen.add(id); }); };
```

  - In `rankSingle`, replace

```js
  return candidateSites()
    .map(site => scoreSite(site, observedSet, opts))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score);
```

  with

```js
  return firstPerId(solverSites(opts)
    .map(site => scoreSite(site, observedSet, opts))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score));
```

  - In `differential`:
    - Replace the loop head
      `  for (const site of candidateSites()) {\n    if (pressure.present && !INTRACRANIAL_LEVELS.has(site.level)) continue; // compartment filter`
      with `  for (const site of solverSites(opts)) {\n    if (pressure.present && !INTRACRANIAL_LEVELS.has(site.level)) continue; // compartment filter`.
    - Replace the function's last line `  return cands;` with `  return firstPerId(cands);`.
  - Replace the body of `ruledOutSites` from `  const out = [];` to its `  return out;` with:

```js
  // Per site, across its variants: ruled out only when EVERY variant that would explain something is contradicted.
  const byId = new Map();
  for (const site of solverSites(opts)) {
    let exp; try { exp = expectedFindings(site, opts); } catch { continue; }
    let explainsSomething = false;
    for (const t of observedSet) if (exp.has(t)) { explainsSomething = true; break; }
    if (!explainsSomething) continue;
    if (site.asymmetric) continue; // never excluded by a known negative, so never "ruled out" by one
    let contradictedBy = null;
    for (const neg of negatives) if (exp.has(neg)) { contradictedBy = neg; break; }
    const seen = byId.get(site.id);
    if (!seen) byId.set(site.id, { site, contradictedBy });
    else if (!contradictedBy) seen.contradictedBy = null;
  }
  return [...byId.values()].filter(e => e.contradictedBy).map(e => ({ site: e.site, contradictedBy: e.contradictedBy }));
```

  - In `nearFit`, replace `  const sites = candidateSites();` with `  const sites = solverSites(opts);`.
  - In `solve()`, replace

```js
  const nf = nearFit(localising, opts);
  const level = describeLevel(best, options.sensoryLevel);
  const length = describeLength(best, options.distalReach);
  const display = explainAll.length ? explainAll : diff;
```

  with

```js
  const nf = nearFit(localising, opts);
  const display = explainAll.length ? explainAll : diff;
  // The level note describes the answer the reader SEES (spinal cord fix, row 9). It used to read the scored ranking,
  // which can disagree with the display — a GBS answer whose note named Friedreich's.
  const level = describeLevel(display[0] || best, options.sensoryLevel);
  const length = describeLength(best, options.distalReach);
```

- [ ] **Step 7: The Why's station index sees variants too.** In `src/engine/why.js`:
  - Change the import to `import { candidateSites, differential, isNormalToken, solverSites } from "./inverse.js";`.
  - In `locusIndex`, replace `  for (const s of candidateSites()) {` with `  for (const s of solverSites(opts)) {`.
  - Check whether `candidateSites` is still used elsewhere in `why.js`:
    `grep -n "candidateSites" src/engine/why.js`. If the only hit is the import, remove it from the import.

- [ ] **Step 8: Run the suite and `npm test`.** Expected: the suite has 0 failures and `npm test` exits 0, as measured
  on the prototype with prevalence + arms-spared + the note.

- [ ] **Step 9: Commit.**

```bash
git add src/model/levels.js src/model/sites.js src/engine/inverse.js src/engine/why.js test/cord-segment.test.js
git commit -m "feat(cord): segment variants of the same cord sites; the arms-spared reading; the level note follows the answer (rows 2, 9)"
```

---

### Task 5: At-level signs — two-segment spans, per side (row 3)

**Files:**
- Modify: `src/model/sites.js` (`cordVariants` and its block)
- Modify: `src/engine/forward.js` (`expectedFindings`, `explain`)
- Test: `test/cord-segment.test.js`

**Interfaces:**
- Consumes `spanName` (Task 4).
- Produces variants with keys `"C5-6:left"`, `"C5-6:right"`, `"C5-6:left+right"`, …, `"C8-T1:left+right"`. Each has
  `segments: ["C5","C6"]`, `top: "C5"` and `atLevel: { structures: string[], sides: ("left"|"right")[] }`.

- [ ] **Step 1: Add the failing section:**

```js
// ---- Row 3: at-level signs — two-segment spans, on one side or both ----
{
  const p1 = solve(L(`reflex_biceps_loss@left reflex_brachioradialis_loss@left weak_elbow_flexion@left ${B("hyperreflexia")} ${B("babinski")} ${B("spasticity")}`));
  ok("C5/6 myeloradiculopathy → the anterior cord at C5–6 with left root signs, one lesion", first(p1)?.id === "bilateral_cord_anterior" && first(p1)?.variant === "C5-6:left" && p1.multi === null, `${ids(p1).slice(0, 2)} ${first(p1)?.variant}`);
  const mir = solve(L(`reflex_biceps_loss@right reflex_brachioradialis_loss@right weak_elbow_flexion@right ${B("hyperreflexia")} ${B("babinski")} ${B("spasticity")}`));
  ok("…its mirror reads the right side", first(mir)?.variant === "C5-6:right" && mir.multi === null);
  const c7 = solve(L(`reflex_triceps_loss@right weak_elbow_extension@right ${B("hyperreflexia")} ${B("babinski")}`));
  ok("R triceps jerk lost + weak elbow extension + both legs UMN → one cord lesion", first(c7)?.level === "cord" && c7.multi === null, ids(c7).slice(0, 2).join(", "));
  const v = site("bilateral_cord_anterior").variants.find(x => x.key === "C5-6:left");
  const e = expectedFindings({ ...site("bilateral_cord_anterior"), structures: v.structures, atLevel: v.atLevel });
  ok("at-level rows are emitted on their own side only", e.has("reflex_biceps_loss@left") && !e.has("reflex_biceps_loss@right") && e.has("babinski@right"));
  ok("the spans are C5–6, C6–7, C7–8 and C8–T1, each left, right and both", site("bilateral_cord_anterior").variants.filter(x => x.atLevel).length === 12);
}
```

- [ ] **Step 2: Run the suite and confirm the new lines fail.**

- [ ] **Step 3: Extend the variant block in `sites.js`.** Replace

```js
const CORD_ARM_ROWS = new Set(["cst_cord_arm", "cst_cord_hof"]);
const armsSpared = structures => ({ key: "arms-spared", top: "T2", structures: structures.filter(id => !CORD_ARM_ROWS.has(id)) });
function cordVariants(structures) {
  return [armsSpared(structures)];
}
```

with

```js
//   at-level    — a two-segment span (a disc-level lesion takes two segments: the biceps jerk is a C5 row, the
//                 supinator jerk a C6 row) whose anterior horn cells and exiting roots are caught: the span's root
//                 motor, reflex and wasting rows, on the left, the right or both — reused, not duplicated.
const CORD_ARM_ROWS = new Set(["cst_cord_arm", "cst_cord_hof"]);
const AT_LEVEL_SPANS = [["C5", "C6"], ["C6", "C7"], ["C7", "C8"], ["C8", "T1"]];
const armsSpared = structures => ({ key: "arms-spared", top: "T2", structures: structures.filter(id => !CORD_ARM_ROWS.has(id)) });
const atLevelRows = span => STRUCTURES
  .filter(s => s.level === "root" && span.includes(s.part.toUpperCase()) && !/_(derm|pain)$/.test(s.id))
  .map(s => s.id);
function cordVariants(structures) {
  const variants = [armsSpared(structures)];
  for (const span of AT_LEVEL_SPANS) {
    const rows = atLevelRows(span);
    for (const sides of [["left"], ["right"], ["left", "right"]])
      variants.push({ key: `${spanName(span)}:${sides.join("+")}`, top: span[0], segments: span,
        structures: [...structures, ...rows], atLevel: { structures: rows, sides } });
  }
  return variants;
}
```

- [ ] **Step 4: Emit at-level rows on their own side, in `src/engine/forward.js`.**
  - In `expectedFindings`, replace

```js
    const f = struct.produces;
    if (NON_LATERALISED.has(f)) {
```

  with

```js
    const f = struct.produces;
    // A cord variant's AT-LEVEL rows (sites.js cordVariants) go on that variant's own side(s): a disc-level lesion
    // can catch the roots on one side while the long tracts below it are caught on both.
    if (site.atLevel && site.atLevel.structures.includes(structId)) {
      for (const s of site.atLevel.sides) out.add(signed(f, s));
      continue;
    }
    if (NON_LATERALISED.has(f)) {
```

  - In `explain`, replace

```js
    const f = s.produces;
    const sides = NON_LATERALISED.has(f) ? ["none"]
```

  with

```js
    const f = s.produces;
    const sides = site.atLevel && site.atLevel.structures.includes(structId) ? site.atLevel.sides
      : NON_LATERALISED.has(f) ? ["none"]
```

- [ ] **Step 5: Run the suite and `npm test`.** Expected: 0 failures; exit 0.

- [ ] **Step 6: Commit.**

```bash
git add src/model/sites.js src/engine/forward.js test/cord-segment.test.js
git commit -m "feat(cord): at-level signs — two-segment spans C5-6 to C8-T1, per side, from the root rows (row 3)"
```

---

### Task 6: A complete lesion takes the saddle (row 6) + the conus re-pin (row 11)

**Files:**
- Modify: `src/model/structures.js`. Insert before the line `  // ---- CAUDA EQUINA (lumbosacral nerve roots, below the conus) ----`.
- Modify: `src/model/sites.js` (`composeBilateralCordSites`)
- Modify: `test/cauda-conus.test.js` (section 5)
- Test: `test/cord-segment.test.js`

**Interfaces:** Produces structure `cord_saddle` (level `cord`, part `sacral`, composite-only).

- [ ] **Step 1: Add the failing section:**

```js
// ---- Row 6: a complete lesion takes the saddle; the incomplete patterns keep sacral sparing ----
{
  const has = id => expectedFindings(site(id)).has("saddle_anaesthesia@midline");
  ok("the transverse (complete) cord predicts saddle anaesthesia", has("bilateral_cord_transverse"));
  ok("the anterior, central and hemicord do not", !has("bilateral_cord_anterior") && !has("bilateral_cord_central") && !has("left_cord_hemi"));
  const t8 = solve(L(`${B("weak_leg")} ${B("babinski")} ${B("spinothalamic")} ${B("dorsal_sensory")} sphincter_dysfunction@midline saddle_anaesthesia@midline`), { sensoryLevel: "T8" });
  ok("T8 compression examined fully, saddle included → one lesion, the transverse cord", first(t8)?.id === "bilateral_cord_transverse" && t8.multi === null, ids(t8).slice(0, 2).join(", "));
  const conus = solve(L(`saddle_anaesthesia@midline sphincter_dysfunction@midline ${B("babinski")} ${B("hyperreflexia")}`));
  ok("the conus picture is still one lesion, the conus first", first(conus)?.id === "conus_medullaris" && conus.multi === null);
  ok("…with the complete cord listed second (look for a level)", conus.display[1]?.site.id === "bilateral_cord_transverse");
}
```

- [ ] **Step 2: Run the suite and confirm the new lines fail.**

- [ ] **Step 3: Add the structure.** In `src/model/structures.js`, insert immediately before
  `  // ---- CAUDA EQUINA (lumbosacral nerve roots, below the conus) ----`:

```js
  // ADDED 2026-10-22 (spinal cord fix, row 6): a COMPLETE lesion takes every modality below the level, the sacral
  // dermatomes included. A composite-only part (not in sites.js PARTS, like cord|autonomic), pulled in by the
  // TRANSVERSE composite only: the anterior, central and hemicord patterns keep sacral sparing. emit:"midline" —
  // saddle numbness has no side, and must match the token the conus and cauda emit.
  { id: "cord_saddle", level: "cord", part: "sacral", produces: "saddle_anaesthesia", crosses: false, emit: "midline",
    note: "complete cord lesion — every modality lost below the level, the saddle included" },

```

- [ ] **Step 4: The transverse pulls it in.** In `composeBilateralCordSites`:
  - Replace `  const autonomic = structuresForPart("autonomic");` with:

```js
  const autonomic = structuresForPart("autonomic");
  // The saddle (cord|sacral) belongs to the complete TRANSVERSE lesion only (spinal cord fix, row 6).
  const sacral = structuresForPart("sacral");
```

  - Replace

```js
      structures: [...belowLevel, ...autonomic], composite: true,
      variants: cordVariants([...belowLevel, ...autonomic])
```

  with

```js
      structures: [...belowLevel, ...autonomic, ...sacral], composite: true,
      variants: cordVariants([...belowLevel, ...autonomic, ...sacral])
```

- [ ] **Step 5: Run `npm test` and confirm exactly the expected failure.**
  Expected: `test/cauda-conus.test.js` fails `both plantars up + brisk reflexes → one lesion, conus_medullaris`.
  `explainAll.length` is 2 now, with the conus still first. Nothing else fails.

- [ ] **Step 6: Re-pin it as ruled (row 11).** In `test/cauda-conus.test.js`, section 5:
  - Replace

```js
  const one = (label, toks, id) => {
    const r = solve(new Set([...saddle, ...toks]), opts);
    ok(`${label} → one lesion, ${id}`, r.explainAll.length === 1 && r.display[0].site.id === id);
  };
```

  with

```js
  // "One lesion" = no multifocal claim and this site first. Owner ruling 2026-10-22 (spinal cord fix, rows 6 + 11): the
  // conus picture also lists the complete cord SECOND — a complete lesion above the conus takes the saddle too, so look
  // for a level. Every other picture here is still the ONLY site that explains it.
  const one = (label, toks, id, { alone = true } = {}) => {
    const r = solve(new Set([...saddle, ...toks]), opts);
    ok(`${label} → one lesion, ${id}`, (alone ? r.explainAll.length === 1 : r.multi === null) && r.display[0].site.id === id);
  };
```

  - and replace
    `  one("both plantars up + brisk reflexes", [...B("babinski"), ...B("hyperreflexia")], "conus_medullaris");` with
    `  one("both plantars up + brisk reflexes", [...B("babinski"), ...B("hyperreflexia")], "conus_medullaris", { alone: false });`

- [ ] **Step 7: Run the suite and `npm test`.** Expected: 0 failures; exit 0.

- [ ] **Step 8: Commit.**

```bash
git add src/model/structures.js src/model/sites.js test/cauda-conus.test.js test/cord-segment.test.js
git commit -m "fix(cord): a complete lesion takes the saddle; the conus picture lists it second (rows 6, 11)"
```

---

### Task 7: Spinal shock, offered only with a stated level (row 7, row 1c) + the tone re-pin (row 12)

**Files:**
- Modify: `src/model/structures.js`. Insert right after the `cord_saddle` row from Task 6.
- Modify: `src/model/sites.js` (`cordVariants` block)
- Modify: `src/engine/inverse.js` (`solverSites`)
- Modify: `test/tone.test.js:38-40`
- Test: `test/cord-segment.test.js`

**Interfaces:**
- Produces variants `"shock"` and `"shock:arms-spared"`, each with `needsLevel: true`.
- `solverSites(opts)` now skips `needsLevel` variants when `opts.sensoryLevel` is not a valid segment.

- [ ] **Step 1: Add the failing section:**

```js
// ---- Row 7: spinal shock — flaccid and areflexic below an acute lesion, offered only with a stated level ----
{
  const flaccid = `${B("lmn_weakness")} ${B("reflex_knee_loss")} ${B("reflex_ankle_loss")}`;
  const p15 = solve(L(`${flaccid} ${B("hypotonia")} ${B("spinothalamic")} sphincter_dysfunction@midline`), { sensoryLevel: "T6" });
  ok("flaccid areflexic legs + pain loss + retention, level T6 → the cord in spinal shock, one lesion", first(p15)?.level === "cord" && /^shock/.test(first(p15)?.variant || "") && p15.multi === null, `${ids(p15).slice(0, 2)} ${first(p15)?.variant}`);
  const p16 = solve(L(`${B("weak_leg")} ${B("reflex_knee_loss")} ${B("reflex_ankle_loss")} ${B("spinothalamic")} sphincter_dysfunction@midline`), { sensoryLevel: "T6" });
  ok("…entered as weak legs + areflexia → the same, one lesion", first(p16)?.level === "cord" && p16.multi === null);
  const gbs = solve(L(flaccid));
  ok("with no level stated, spinal shock is not offered: flaccid areflexic legs stay GBS", first(gbs)?.id === "polyradiculoneuropathy_acute" && !ids(gbs).some(id => id.startsWith("bilateral_cord")));
  const bab = solve(L(`${flaccid} ${B("spinothalamic")} sphincter_dysfunction@midline ${B("babinski")}`), { sensoryLevel: "T6" });
  ok("up-going plantars do not argue against shock: still one lesion", first(bab)?.level === "cord" && bab.multi === null);
  const down = solve(L(`${flaccid} ${B("spinothalamic")} sphincter_dysfunction@midline plantar_flexor@left plantar_flexor@right`), { sensoryLevel: "T6" });
  ok("down-going plantars only demote it", first(down)?.level === "cord" && !!down.display[0].against);
}
```

- [ ] **Step 2: Run the suite and confirm the new lines fail.** The GBS line already passes; the others fail.

- [ ] **Step 3: Add the six rows.** In `src/model/structures.js`, insert right after the `cord_saddle` row:

```js
  // ADDED 2026-10-22 (spinal cord fix, row 7): SPINAL SHOCK. Below an acute cord lesion the legs are at first flaccid
  // and areflexic and the sacral reflexes are lost; the release signs come later. A composite-only part (cord|shock),
  // used only by the shock variants of the anterior and transverse cord (sites.js cordVariants), which need a stated
  // sensory level.
  { id: "cord_shock_flaccid", level: "cord", part: "shock", produces: "lmn_weakness", crosses: false,
    note: "spinal shock — flaccid paralysis below an acute cord lesion" },
  { id: "cord_shock_tone", level: "cord", part: "shock", produces: "hypotonia", crosses: false,
    note: "spinal shock — tone lost below the lesion" },
  { id: "cord_shock_knee", level: "cord", part: "shock", produces: "reflex_knee_loss", crosses: false,
    note: "spinal shock — knee jerks lost below the lesion" },
  { id: "cord_shock_ankle", level: "cord", part: "shock", produces: "reflex_ankle_loss", crosses: false,
    note: "spinal shock — ankle jerks lost below the lesion" },
  { id: "cord_shock_bulbo", level: "cord", part: "shock", produces: "bulbocavernosus_loss", crosses: false, emit: "midline",
    note: "spinal shock — bulbocavernosus reflex lost; its return marks the end of shock" },
  { id: "cord_shock_anal", level: "cord", part: "shock", produces: "anal_wink_loss", crosses: false, emit: "midline",
    note: "spinal shock — anal wink lost" },

```

- [ ] **Step 4: Add the shock variants.** In `sites.js`:
  - Replace the comment line `//                 motor, reflex and wasting rows, on the left, the right or both — reused, not duplicated.` with:

```js
//                 motor, reflex and wasting rows, on the left, the right or both — reused, not duplicated.
//   shock       — an acute lesion in spinal shock: flaccid and areflexic below the level, the sacral reflexes lost; the
//                 release signs (brisk reflexes, spasticity, Hoffmann's) have not appeared. Babinski is kept — the
//                 plantars may be mute, flexor or already extensor. `needsLevel`: offered only with a stated level.
```

  - Replace `const CORD_ARM_ROWS = new Set(["cst_cord_arm", "cst_cord_hof"]);` with:

```js
const CORD_ARM_ROWS = new Set(["cst_cord_arm", "cst_cord_hof"]);
const CORD_RELEASE_ROWS = new Set(["cst_cord_hyper", "cst_cord_spast", "cst_cord_hof"]);
```

  - In `cordVariants`, replace `  return variants;` with:

```js
  const shockRows = STRUCTURES.filter(s => s.level === "cord" && s.part === "shock").map(s => s.id);
  const shock = [...structures.filter(id => !CORD_RELEASE_ROWS.has(id)), ...shockRows];
  variants.push({ key: "shock", structures: shock, needsLevel: true });
  variants.push({ ...armsSpared(shock), key: "shock:arms-spared", needsLevel: true });
  return variants;
```

- [ ] **Step 5: Gate it in `solverSites`.** In `src/engine/inverse.js`, replace

```js
export function solverSites(opts = {}) {
  const out = [];
  for (const site of candidateSites()) {
    out.push(site);
    for (const v of site.variants || []) out.push(variantOf(site, v));
  }
  return out;
}
```

with

```js
export function solverSites(opts = {}) {
  const level = normaliseLevel(opts.sensoryLevel);
  const out = [];
  for (const site of candidateSites()) {
    out.push(site);
    for (const v of site.variants || []) {
      // Spinal shock needs a stated level (spinal cord fix, row 1c): the level is the bedside discriminator from GBS,
      // and without it the shock reading takes GBS's own picture (measured: the GBS probe, vignette and Why clue).
      if (v.needsLevel && !level) continue;
      out.push(variantOf(site, v));
    }
  }
  return out;
}
```

- [ ] **Step 6: Run `npm test` and confirm exactly the expected failure.**
  Expected: `test/tone.test.js` fails `hypotonia is generalised-flaccid ONLY (anterior horn, cauda, polyneuropathy, GBS)`.
  Nothing else fails. If the GBS vignette fails, the gate is missing.

- [ ] **Step 7: Re-pin it as ruled (row 12).** In `test/tone.test.js`, replace

```js
// + the acute polyradiculoneuropathy since accuracy round 1 (B14, 2026-09-26) — GBS is flaccid too.
ok("hypotonia is generalised-flaccid ONLY (anterior horn, cauda, polyneuropathy, GBS)",
   JSON.stringify(levelsProducing("hypotonia")) === JSON.stringify(["cauda","motor_unit","polyneuropathy","polyradiculoneuropathy"]));
```

with

```js
// + the acute polyradiculoneuropathy since accuracy round 1 (B14, 2026-09-26) — GBS is flaccid too.
// + the cord in SPINAL SHOCK only (owner ruling 2026-10-22, spinal cord fix, rows 7 + 12).
ok("hypotonia is generalised-flaccid ONLY (anterior horn, cauda, polyneuropathy, GBS, the cord in spinal shock)",
   JSON.stringify(levelsProducing("hypotonia")) === JSON.stringify(["cauda","cord","motor_unit","polyneuropathy","polyradiculoneuropathy"]));
ok("the cord's hypotonia is the spinal-shock row only",
   producersOf("hypotonia").filter(s => s.level === "cord").every(s => s.part === "shock"));
```

- [ ] **Step 8: Run the suite and `npm test`.** Expected: 0 failures; exit 0.

- [ ] **Step 9: Commit.**

```bash
git add src/model/structures.js src/model/sites.js src/engine/inverse.js test/tone.test.js test/cord-segment.test.js
git commit -m "feat(cord): spinal shock — flaccid and areflexic below an acute lesion, only with a stated level (rows 7, 1c, 12)"
```

---

### Task 8: The level axis — constrain, demote, and say so (rows 1a–b, 9)

**Files:**
- Modify: `src/engine/inverse.js`:
  - the `levels.js` import;
  - `solverSites`;
  - `differential`;
  - `describeLevel`.
- Test: `test/cord-segment.test.js`

**Interfaces:**
- Differential candidates gain `levelAgainst: string | null`, the stated segment a non-cord site cannot produce.
- `describeLevel(...)` gains `contradicts: boolean`, true when a valid level is stated and the answer is not a cord
  site. It also gains `fromVariant?: true`, set when no level is stated and the note names the variant's segment.
- Task 10 consumes all three.

- [ ] **Step 1: Add the failing sections:**

```js
// ---- Row 1: a stated level — demote what cannot produce it; the segment must lie at or above it ----
{
  const conusT10 = solve(L(`saddle_anaesthesia@midline sphincter_dysfunction@midline ${B("babinski")}`), { sensoryLevel: "T10" });
  ok("the conus picture with a T10 level → a cord lesion first", first(conusT10)?.level === "cord", ids(conusT10).slice(0, 2).join(", "));
  const cc = conusT10.display.find(c => c.site.id === "conus_medullaris");
  ok("…the conus demoted, never excluded", !!cc && cc.levelAgainst === "T10");
  const c4 = solve(L(`${B("hyperreflexia")} ${B("babinski")} ${B("spasticity")}`), { sensoryLevel: "C4" });
  ok("spastic legs + level C4 → a cord lesion first, NOT the arms-spared reading", first(c4)?.level === "cord" && first(c4)?.variant !== "arms-spared", `${ids(c4).slice(0, 2)} ${first(c4)?.variant}`);
  const weber = solve(L("ptosis@left weak_adduction@left weak_elevation@left weak_depression@left weak_arm@right weak_leg@right facial_weakness@right forehead_spared@right"), { sensoryLevel: "T10" });
  ok("Weber + T10 → still the midbrain (the only site that explains it), no multifocal claim", first(weber)?.id === "left_midbrain_medial" && weber.multi === null);
  ok("…and the level says the answer cannot produce it", weber.level.contradicts === true && weber.level.applies === false);
  ok("with no level stated nothing is demoted", solve(L(`${B("hyperreflexia")} ${B("babinski")}`)).display.every(c => !c.levelAgainst));
}

// ---- Row 9: the level note names the segment the chosen reading implies ----
{
  const p1 = solve(L(`reflex_biceps_loss@left reflex_brachioradialis_loss@left weak_elbow_flexion@left ${B("hyperreflexia")} ${B("babinski")} ${B("spasticity")}`));
  ok("no level typed: the at-level reading names its segment", p1.level.fromVariant === true && /C5–6/.test(p1.level.note), p1.level.note);
  const sp = solve(L(`${B("hyperreflexia")} ${B("babinski")} ${B("spasticity")}`));
  ok("no level typed: the arms-spared reading says so, and never says thoracic", sp.level.fromVariant === true && /arms are spared/.test(sp.level.note) && !/thoracic/i.test(sp.level.note), sp.level.note);
  const cauda = solve(L("saddle_anaesthesia@midline sphincter_dysfunction@midline reflex_ankle_loss@left reflex_ankle_loss@right lmn_weakness@left radicular_pain@left"), { sensoryLevel: "T10" });
  ok("a level under a cauda answer is flagged as contradicted", first(cauda)?.id === "cauda_equina" && cauda.level.contradicts === true);
  const bs = solve(L("weak_arm@left weak_leg@left dorsal_sensory@left spinothalamic@right"));
  ok("a generic cord reading with no level keeps 'level undetermined'", !bs.level.fromVariant && /level undetermined/.test(bs.level.note));
}
```

- [ ] **Step 2: Run the suite and confirm the new lines fail.**

- [ ] **Step 3: Implement the constraint.**
  - Change the import `import { normaliseLevel, regionOf, landmarkOf } from "../model/levels.js";` to
    `import { normaliseLevel, regionOf, landmarkOf, levelIndex, spanName } from "../model/levels.js";`.
  - In `solverSites`, replace `      if (v.needsLevel && !level) continue;` with:

```js
      if (v.needsLevel && !level) continue;
      // A stated level means a lesion at or above it (row 1b): a reading whose highest segment lies below it is out.
      if (level && v.top && levelIndex(v.top) > levelIndex(level)) continue;
```

- [ ] **Step 4: Implement the demotion in `differential`.**
  - After `  const againstNormal = normalNegatives(observedSet);` add `  const level = normaliseLevel(opts.sensoryLevel);`.
  - Replace

```js
    const against = [...againstNormal].find(t => exp.has(t)) || null;
    cands.push({ site, exp, explained, over: [...exp].filter(t => !observedSet.has(t)).length,
                 n: explained.length, prevalence: prevalenceOf(site), against });
```

  with

```js
    const against = [...againstNormal].find(t => exp.has(t)) || null;
    // A STATED SENSORY LEVEL means a cord lesion at or above it (spinal cord fix, row 1a). A site that cannot produce
    // one — anything outside the cord; the conus and cauda lie below every cord level — sorts below every site that
    // explains as much and can: demoted like a recorded normal, never excluded, so no multifocal claim changes.
    const levelAgainst = level && site.level !== "cord" ? level : null;
    cands.push({ site, exp, explained, over: [...exp].filter(t => !observedSet.has(t)).length,
                 n: explained.length, prevalence: prevalenceOf(site), against, levelAgainst });
```

  - Replace

```js
  cands.sort((a, b) => b.n - a.n || (!!a.against - !!b.against) || rankKey(a) - rankKey(b) || b.prevalence - a.prevalence
    || a.over - b.over || a.site.id.localeCompare(b.site.id));
```

  with

```js
  cands.sort((a, b) => b.n - a.n || (!!(a.against || a.levelAgainst) - !!(b.against || b.levelAgainst))
    || rankKey(a) - rankKey(b) || b.prevalence - a.prevalence || a.over - b.over || a.site.id.localeCompare(b.site.id));
```

- [ ] **Step 5: Implement the notes.** Replace the whole `describeLevel` function with:

```js
export function describeLevel(best, sensoryLevel) {
  const raw = (typeof sensoryLevel === "string" && sensoryLevel.trim() !== "") ? sensoryLevel : null;
  const isCord = !!best && best.site.level === "cord";
  const segment = normaliseLevel(raw);
  // A stated level the answer cannot produce (spinal cord fix, row 9): flagged, so the app can say so in words with
  // the site's plain name. The engine's own notes below keep their wording.
  const contradicts = !!segment && !!best && !isCord;
  const base = { given: raw, applies: false, segment: null, region: null, landmark: null, note: "", contradicts };

  // Central (syrinx) lesions cause a SUSPENDED cape, not a below-the-level deficit — the single
  // "below the level" sensory level does not apply. Checked before the generic cord branches.
  if (isCord && best.site.part === "central") {
    return { given: raw, applies: false, segment, contradicts,
      region: segment ? regionOf(segment) : null, landmark: segment ? landmarkOf(segment) : null,
      note: "suspended (cape-like) distribution — the sensory loss spans the lesion's segments and is spared above and below, so a single below-the-level sensory level does not apply" };
  }

  // Below the cord: cauda equina / conus. Not a cord "sensory level" — the saddle (S2–S5)
  // distribution is the localiser. Placed before the non-cord "inconsistency" branch so a
  // stated level here is reported gently rather than flagged as contradicting a cord lesion.
  if (best && (best.site.level === "cauda" || best.site.level === "conus")) {
    return { given: raw, applies: false, segment, contradicts,
      region: segment ? regionOf(segment) : null, landmark: segment ? landmarkOf(segment) : null,
      note: "below the cord — a cauda equina / conus lesion; the saddle (S2–S5) distribution is the localiser, not a single sensory level" };
  }

  if (isCord && segment) {
    return { given: raw, applies: true, segment, region: regionOf(segment), landmark: landmarkOf(segment), contradicts,
      note: `lesion at or just above ${segment} (the sensory level typically sits a segment or two below the lesion)` };
  }
  if (isCord && raw && !segment) {
    return { ...base, note: `unrecognised sensory level '${raw}'; expected a segment such as T10` };
  }
  if (isCord && !raw) {
    // No level typed, but the chosen READING of the cord can still say where (spinal cord fix, row 9). Never
    // "thoracic": a legs-only myelopathy can be cervical, and the plans keep the imaging at the whole spine.
    const s = best.site;
    if (s.segments) return { ...base, fromVariant: true,
      note: `the at-level signs (${s.atLevel.sides.join(" and ")}) place the lesion at about ${spanName(s.segments, "–")}; the long-tract signs below it come from the same lesion` };
    if (s.variant === "arms-spared") return { ...base, fromVariant: true,
      note: "the arms are spared — the lesion lies below the arm segments, or is cervical and not yet reaching the arm fibres; a sensory level is needed to localise the segment" };
    return { ...base, note: "level undetermined — a sensory level is needed to localise the segment" };
  }
  if (!isCord && raw) {
    return { given: raw, applies: false, segment, region: segment ? regionOf(segment) : null, contradicts,
      landmark: segment ? landmarkOf(segment) : null,
      note: `a sensory level suggests a spinal cord lesion, but the findings localise to ${best ? best.site.id : "(no site)"}` };
  }
  return base;
}
```

  Also update the comment block above it. Replace

```js
// ---- SENSORY LEVEL (orthogonal to which site wins) ----
// The cross-sectional pattern says WHICH syndrome; the sensory level says WHERE along the cord.
// It never changes the localisation — it annotates it. Reports the segment when the best site is
// in the cord and a valid level was given; otherwise explains why the level does not apply.
```

  with

```js
// ---- SENSORY LEVEL ----
// The cross-sectional pattern says WHICH syndrome; the sensory level says WHERE along the neuraxis. Since the
// spinal cord fix (2026-10-22, owner-approved) a stated level is EVIDENCE as well as an annotation: it demotes what
// cannot produce it (differential), restricts the cord's readings to those at or above it and gates spinal shock
// (solverSites). This function annotates the DISPLAYED answer: the segment when it is a cord site and a valid level was
// given; otherwise why the level does not apply, or — with no level typed — the segment the cord reading implies.
```

- [ ] **Step 6: Run the suite, `sensory-level.test.js` and `npm test`.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cord-segment.test.js && PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/sensory-level.test.js && PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test > /tmp/cord-npm.txt 2>&1; echo "exit $?"`
Expected: both suites 0 failures; `exit 0`. The sensory-level suite's Weber + T10 note is unchanged.

- [ ] **Step 7: Commit.**

```bash
git add src/engine/inverse.js test/cord-segment.test.js
git commit -m "feat(cord): a stated level demotes what cannot produce it and constrains the cord's segment; notes name the reading (rows 1a-b, 9)"
```

---

### Task 9: The central cord reaches the arm fibres and the anterior horns (row 8)

**Files:**
- Modify: `src/model/sites.js` (`composeBilateralCordSites` + a const above it)
- Test: `test/cord-segment.test.js`

**Interfaces:** None new. `bilateral_cord_central` now also lists `cst_cord_arm` and `ah_wasting`.

- [ ] **Step 1: Add the failing section:**

```js
// ---- Row 8: the central cord takes the arm fibres and the anterior horn cells at its level ----
{
  const e = expectedFindings(site("bilateral_cord_central"));
  ok("the central cord predicts arm weakness and wasting on both sides", ["weak_arm", "wasting"].every(f => e.has(`${f}@left`) && e.has(`${f}@right`)));
  ok("…but not leg weakness (deferred) or bladder involvement (owner ruling 2026-09-26)", !e.has("weak_leg@left") && !e.has("sphincter_dysfunction@midline"));
  const p8 = solve(L(`${B("weak_arm")} ${B("suspended_sensory")}`));
  ok("both arms weak + cape → the central cord, one lesion", first(p8)?.id === "bilateral_cord_central" && p8.multi === null);
  ok("a bare cape still → the central cord", first(solve(L(B("suspended_sensory")))).id === "bilateral_cord_central");
}
```

- [ ] **Step 2: Run the suite and confirm the first and third new lines fail.**

- [ ] **Step 3: Implement.** In `sites.js`:
  - Insert immediately before `export function composeBilateralCordSites() {`:

```js
// The central cord takes more than the commissure: the corticospinal ARM fibres (arms weaker than legs) and the
// anterior horn cells at its level (wasting) — spinal cord fix, row 8, 2026-10-22. Both rows are reused. Leg signs
// for an expanding syrinx are deferred to the composite-sites round; bladder stays out (owner ruling 2026-09-26).
const CENTRAL_REACH = ["cst_cord_arm", "ah_wasting"];
```

  - Replace `    const structures = [...structuresForPart(part), ...(part === "anterior" ? autonomic : [])];` with:

```js
    const structures = [...structuresForPart(part), ...(part === "anterior" ? autonomic : []),
      ...(part === "central" ? CENTRAL_REACH : [])];
```

- [ ] **Step 4: Run the suite, `central-cord.test.js`, `tone.test.js` and `npm test`.** Expected: 0 failures; exit 0.
  `ah_wasting` stays a `motor_unit` row, so tone's "UMN has NO wasting" invariant holds (measured).

- [ ] **Step 5: Commit.**

```bash
git add src/model/sites.js test/cord-segment.test.js
git commit -m "fix(cord): the central cord reaches the arm fibres and the anterior horn cells (row 8)"
```

---

### Task 10: The app — the level line, the level field, the parsimony guard (rows 9–10)

**Files:**
- Create: `app/level-axis.js`
- Create: `test/level-axis.test.js`
- Modify: `app/app.js`:
  - imports;
  - the `CORD_AXIS_FINDINGS` block (~92–100);
  - `renderLocalise` (~103);
  - `syncLevelCtrls` (~289–292);
  - `renderResults` (~344–363);
  - `whereCard` (~632, ~642);
  - `forcingFindingsMemo` (~720–723).
- Modify: `package.json`. Add `node test/level-axis.test.js` to the `test` script, right after `node test/answer.test.js`.

**Interfaces:**
- Consumes `level.contradicts`, `level.fromVariant`, `level.segment`, `level.note`, `level.given`, and the candidates'
  `levelAgainst` (Task 8).
- Produces `showLevelField(tokens: Set<string>, display: candidate[]) → boolean`.
- Produces `levelLine(level, place: string) → string | null`.
- Produces `CORD_AXIS_FINDINGS: Set<string>`.

**Row 10 as refined by the owner (2026-10-22):** the field shows when the **displayed FIRST answer** is a cord site, not
when a cord site is anywhere in the list. Measured, "anywhere" shows it for a single weak arm or leg, which reverses the
2026-08-16 rule. "First" shows it for:
- 0 of 126 brain/brainstem pictures;
- 2 of 389 single findings;
- every cord probe after the fix.

- [ ] **Step 1: Write the failing suite `test/level-axis.test.js`:**

```js
// level-axis.test.js — the sensory level in the app (spinal cord fix, round 1, rows 9–10): WHEN the field shows and
// WHAT the level line says. Pure — app/level-axis.js has no DOM. Run: node test/level-axis.test.js
import { CORD_AXIS_FINDINGS, showLevelField, levelLine } from "../app/level-axis.js";
import { FINDINGS } from "../src/model/findings.js";
import { solve } from "../src/engine/inverse.js";

let pass = 0, fail = 0;
function ok(label, cond, detail = "") { cond ? pass++ : fail++; console.log(`${cond ? "PASS" : "FAIL"}  ${label}${cond ? "" : "  " + detail}`); }
const L = s => new Set(s.split(/\s+/).filter(Boolean));
const B = f => `${f}@left ${f}@right`;
const show = toks => showLevelField(L(toks), solve(L(toks)).display);
const r = (toks, lvl) => solve(L(toks), lvl ? { sensoryLevel: lvl } : {});

// ---- when the field shows (row 10) ----
ok("every trigger id is a real finding (dorsal_column, sensory_level, glove_stocking are gone)", [...CORD_AXIS_FINDINGS].every(f => FINDINGS[f]));
ok("a pure dorsal-column picture shows the field", show(B("dorsal_sensory")));
ok("a spastic paraparesis shows the field (the cord is the answer)", show(`${B("hyperreflexia")} ${B("babinski")} ${B("spasticity")}`));
ok("a single weak arm does not (the 2026-08-16 rule holds)", !show("weak_arm@right"));
ok("a hemiparesis does not", !show("weak_arm@right weak_leg@right"));
ok("no findings: hidden", !showLevelField(new Set(), []));

// ---- what the level line says (row 9) ----
ok("no level typed and a non-cord answer → no line", levelLine(r("weak_arm@right weak_leg@right facial_weakness@right forehead_spared@right").level, "x") === null);
const p14 = r(`${B("hyperreflexia")} ${B("babinski")} ${B("spasticity")}`, "T10");
ok("a level typed under a cord answer → the engine's note", /at or just above T10/.test(levelLine(p14.level, "x") || ""));
const ca = r("saddle_anaesthesia@midline sphincter_dysfunction@midline reflex_ankle_loss@left reflex_ankle_loss@right lmn_weakness@left radicular_pain@left", "T10");
ok("a level typed under a cauda answer → the contradiction, naming the place",
   levelLine(ca.level, "the cauda equina") === "a sensory level at T10 needs a cord lesion at or above T10; the cauda equina cannot produce one — re-check the level, or consider a second lesion");
const p1 = r(`reflex_biceps_loss@left reflex_brachioradialis_loss@left weak_elbow_flexion@left ${B("hyperreflexia")} ${B("babinski")} ${B("spasticity")}`);
ok("no level typed, an at-level reading → its segment", /C5–6/.test(levelLine(p1.level, "x") || ""));
ok("an unrecognised level typed under a cord answer → the 'unrecognised' note", /unrecognised/.test(levelLine(r(B("dorsal_sensory"), "Z9").level, "x") || ""));

console.log(`\nlevel axis (app): ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run it and confirm it fails.** Expected: a module-not-found error for `../app/level-axis.js`.

- [ ] **Step 3: Create `app/level-axis.js`:**

```js
// level-axis.js — the sensory level in the app (spinal cord fix, round 1, rows 9–10, 2026-10-22). Pure and DOM-free so
// it can be tested: WHEN the Sensory level field shows, and WHAT the level line says.

// The findings that put the level (and distal-reach) inputs on screen. Deliberately NOT weak_arm / weak_leg: limb
// weakness is the commonest finding in the app and usually cortical (2026-08-16 UI-clarity rule). Three ids here were
// not findings (dorsal_column, sensory_level, glove_stocking), so a pure dorsal-column picture never showed the field.
export const CORD_AXIS_FINDINGS = new Set(["spinothalamic", "dorsal_sensory", "sensory_ataxia",
  "sphincter_dysfunction", "saddle_anaesthesia", "distal_sensory_loss"]);

// Also whenever the displayed answer IS a cord lesion: a spastic paraparesis has no sensory finding to trigger the
// field, and it is the picture where the level matters most.
export function showLevelField(tokens, display) {
  return [...tokens].some(t => CORD_AXIS_FINDINGS.has(t.split("@")[0])) || display?.[0]?.site.level === "cord";
}

// The level line under the Where card, or null. Shown whenever a level is typed — a dismissed level used to be
// invisible — and when none is typed but the chosen reading of the cord names its segment. `place` is the displayed
// answer's plain name.
export function levelLine(level, place) {
  if (!level || !(level.given || level.fromVariant)) return null;
  if (level.contradicts) return `a sensory level at ${level.segment} needs a cord lesion at or above ${level.segment}; ${place} cannot produce one — re-check the level, or consider a second lesion`;
  return level.note || null;
}
```

- [ ] **Step 4: Run the new suite.** Expected: 0 failures.

- [ ] **Step 5: Wire `app/app.js`.**
  - Add the import after `import { searchFindings } from "./synonyms.js";`:

```js
import { showLevelField, levelLine } from "./level-axis.js";
```

  - Replace the comment and set (the block starting `// The sensory-level and distal-reach inputs annotate` and
    ending with `"sphincter_dysfunction","saddle_anaesthesia","glove_stocking","distal_sensory_loss"]);`) with:

```js
// The sensory-level and distal-reach inputs mount for a cord / length-dependent finding, and whenever the displayed
// answer is a cord lesion — app/level-axis.js holds the rule (spinal cord fix, row 10). Onset, course and dominant
// hemisphere moved into the card they act on (What / Together / the header) — see the 2026-08-16 UI-clarity spec.
// The last displayed list, so the field's visibility can follow the answer without re-solving.
let LAST_DISPLAY = [];
```

  - In `renderLocalise`, replace `  const hasCord = [...S.tokens].some(t => CORD_AXIS_FINDINGS.has(fid(t)));` with
    `  const hasCord = showLevelField(S.tokens, LAST_DISPLAY);`.
  - In `syncLevelCtrls`, replace `  el.hidden = ![...S.tokens].some(t => CORD_AXIS_FINDINGS.has(fid(t)));` with
    `  el.hidden = !showLevelField(S.tokens, LAST_DISPLAY);`.
  - In `renderResults`:
    - In the empty branch, replace `    S.selected = undefined; S.selectedPathology = undefined; S.selectedEntity = undefined;`
      with `    S.selected = undefined; S.selectedPathology = undefined; S.selectedEntity = undefined;\n    LAST_DISPLAY = []; syncLevelCtrls();`.
    - Directly after the line
      `  const r = solve(S.tokens, { dominantSide: S.dominant, sensoryLevel: S.sensoryLevel || undefined, distalReach: S.distalReach || undefined });`
      add `  LAST_DISPLAY = r.display; syncLevelCtrls();`.
  - In `whereCard`, replace

```js
  if (r.level && r.level.applies) annot += `<div class="annot"><b>Sensory level:</b> ${esc(r.level.note || (r.level.landmark||r.level.segment||""))}</div>`;
```

  with

```js
  const ll = levelLine(r.level, list[0] ? siteName(list[0].site) : "");
  if (ll) annot += `<div class="annot"><b>Sensory level:</b> ${esc(ll)}</div>`;
```

  - In the same function's row template, replace

```js
${c.against ? `<span class="dagainst">less likely — would give ${esc(displayLabel(fid(c.against)))} on the ${esc(c.against.split("@")[1])}</span>` : ""}
```

  with

```js
${c.against ? `<span class="dagainst">less likely — would give ${esc(displayLabel(fid(c.against)))} on the ${esc(c.against.split("@")[1])}</span>` : ""}${c.levelAgainst ? `<span class="dagainst">less likely — cannot produce a sensory level at ${esc(c.levelAgainst)}</span>` : ""}
```

  - Replace `forcingFindingsMemo` with:

```js
function forcingFindingsMemo() {
  // The sensory level changes the answer since the spinal cord fix (row 10), so it is passed and memoised on.
  const key = [...S.tokens].sort().join("|") + "#" + S.dominant + "#" + S.sensoryLevel;
  if (key !== _ffKey) { _ffKey = key; _ffVal = forcingFindings(S.tokens, { dominantSide: S.dominant, sensoryLevel: S.sensoryLevel || undefined }); }
  return _ffVal;
}
```

  - Fix the memo's explanatory comment block above `let _ffKey`. Replace

```js
// The memo is keyed on the finding set plus the dominant hemisphere ONLY. `sensoryLevel` and `distalReach`
// are deliberately excluded: they are ANNOTATION axes (see CLAUDE.md — the sensory level annotates the
// winner, it never changes it), and this was verified rather than assumed — 7 sensoryLevel variants and a
// distalReach variant all produce a byte-identical forcingFindings result.
```

  with

```js
// The memo is keyed on the finding set, the dominant hemisphere and the sensory level. The level joined the key on
// 2026-10-22: since the spinal cord fix it changes the answer (it demotes what cannot produce it and gates spinal
// shock). `distalReach` stays out — it only annotates a polyneuropathy.
```

  - Confirm nothing else uses the old set: `grep -n "CORD_AXIS_FINDINGS" app/app.js` must print nothing.

- [ ] **Step 6: Add the suite to `package.json`** after `node test/answer.test.js`. Then run `npm test`.
  Expected: exit 0.

- [ ] **Step 7: Browser check: drive the row taps, not just the engine (CLAUDE.md lesson).** Start the app with the
  preview tool (`.claude/launch.json` → `neurolocaliser`, port 8137), open `/app/` and pass the gate (passphrase in
  CLAUDE.md). Verify each item, and screenshot the first two:
  - Tap brisk reflexes, Babinski and spasticity, each on Both. The Sensory level field appears. The answer is the
    bilateral anterior cord. The level line reads "the arms are spared — …".
  - Type `T10`. The line reads "lesion at or just above T10 …".
  - Clear. Tap saddle numbness, sphincter dysfunction and Babinski on Both, then type `T10`. The cord is first. The
    conus row shows "less likely — cannot produce a sensory level at T10".
  - Clear. Tap weak arm on Right only. The level field stays hidden.
  - `read_console_messages` shows no errors.

- [ ] **Step 8: Commit.**

```bash
git add app/level-axis.js app/app.js test/level-axis.test.js package.json
git commit -m "feat(app): the level line follows the answer and says when a level is contradicted; the field shows for a cord answer (rows 9-10)"
```

---

### Task 11: Docs, the anatomy sheet, and the principle

**Files:**
- Modify: `CLAUDE.md`:
  - the status line (suite and assertion counts, measured in Task 12);
  - "Orthogonal axes";
  - a new section after "## Conus and cauda signs on both sides".
- Modify: `README.md`. The tests line and "runs all N in sequence".
- Modify: `CONTRIBUTING.md:63-64` and `:108`.
- Modify: `docs/artifacts/architecture.html:302-303`.
- Modify: `docs/artifacts/anatomy-model.html` (cord block)
- Modify: `docs/superpowers/specs/2026-10-22-spinal-cord-fix-design.md`. Status → IMPLEMENTED (after Task 12).

- [ ] **Step 1: Rewrite the principle in CLAUDE.md.** Replace the "Orthogonal axes" bullet's text

```
- **Orthogonal axes.** The cross-sectional pattern says *which* syndrome; the sensory level
  (`levels.js` + `describeLevel`) says *where along the cord* — it annotates the winner, never changes
  it. New per-region mechanisms follow this shape: add a small, well-contained axis rather than
  branching the solver.
```

with

```
- **Orthogonal axes.** The cross-sectional pattern says *which* syndrome; the sensory level says *where along the
  neuraxis* — and since the spinal cord fix (2026-10-22, owner-approved, overturning "annotates, never changes") it is
  EVIDENCE: a stated level demotes (never excludes) every site that cannot produce it, restricts the cord's readings
  to those at or above it, and gates spinal shock. It never adds or removes a candidate or a multifocal claim.
  The cord's own WHERE is carried by VARIANTS of the same cord sites (`sites.js` `cordVariants`, `inverse.js`
  `solverSites`): arms-spared, at-level spans (C5–6 … C8–T1, per side) and spinal shock. New per-region mechanisms
  still follow this shape: a small, well-contained axis rather than a branch in the solver.
```

- [ ] **Step 2: Add the CLAUDE.md section** directly before `## Commands`:

```markdown
## Spinal cord fix (DONE 2026-10-22, round 1) — ✅ owner-approved rulings (all 13 rows)

The first fix from the 2026-10-18 clinical audit. **The defect:** one generic cord predicted arm signs for every cord
lesion and had no segment, the conus outranked it, and spinal shock did not exist. So a thoracic paraparesis read as
"conus", whose plan images T12–L1, while the cord plans image the whole spine.

**Mechanics:**
- `cordVariants` derives the readings of the bilateral anterior, the transverse and the hemicords:
  - arms-spared;
  - at-level spans from the root rows, per side;
  - spinal shock, with six `cord|shock` rows, Babinski kept, and only with a stated level.
- `solverSites(opts)` scores them and `firstPerId` keeps each id once.
- `candidateSites()` is unchanged.
- The bilateral cord takes the cord's own tier; the conus is RARE.
- An UMN release sign on a side excuses that side's missing corticospinal signs. Weakness never excuses.
- The transverse cord takes the saddle (`cord_saddle`).
- The central cord adds `cst_cord_arm` + `ah_wasting`.
- A stated level:
  - demotes non-cord sites (`levelAgainst`);
  - restricts variants (`top`);
  - is described from the DISPLAYED answer.
- `app/level-axis.js` holds when the field shows and what the level line says.

**Rulings that are traps:**
- New site ids FAIL the audit's exact-id regexes (measured: cord 4/16), so variants keep the id.
- Spinal shock without the level gate steals GBS's picture.
- Saddle loss on the anterior cord beats the conus for the classic conus picture.
- The segment constraint without the demotion puts the conus first for spastic legs + C4.

**Deferred:** the syrinx's leg signs and the basilar coma picture go to the composite-sites round. The syrinx's leg
signs conflict with R1 #12 until a bilateral parasagittal site exists.

Spec/plan: `docs/superpowers/specs/2026-10-22-spinal-cord-fix-design.md`, `docs/superpowers/plans/2026-10-22-spinal-cord-fix.md`.
```

- [ ] **Step 3: Update CONTRIBUTING.md.**
  - Replace
    `  it annotates *where along the cord* without changing which cross-sectional pattern wins.` with
    `  it says *where along the cord*; since the spinal cord fix (2026-10-22) it is also evidence — it demotes what
    cannot produce it, restricts the cord's segment readings and gates spinal shock (CLAUDE.md, "Orthogonal axes").`
  - Replace `the cord sensory level is an axis only because its tracts are identical at every segment.` with
    `the cord is NOT identical at every segment (the arms, the at-level signs) — since 2026-10-22 its segment is carried by variants of the same cord sites.`

- [ ] **Step 4: Update `docs/artifacts/architecture.html`.** Replace the heading text
  `Orthogonal axes — they annotate, they never decide` with `Orthogonal axes — where, not which`. In the paragraph
  after it, replace `and only refine the winner.` with
  `and refine the winner; since 2026-10-22 a stated sensory level is also evidence — it demotes what cannot produce it.`

- [ ] **Step 5: Anatomy sheet rows.** In `docs/artifacts/anatomy-model.html`, in the cord block ("Cord —
  cross-sectional primitives"):
  - Replace `<div class="terr">central cord / periependymal (syrinx, intramedullary)</div>` with
    `<div class="terr">central cord / periependymal (syrinx, intramedullary) — the central composite also carries cst_cord_arm and ah_wasting (2026-10-22)</div>`.
  - Replace the `sym_cord_anhbody` row and the three closing lines after it

```html
            <div class="row"><span class="badge bi">IPSI</span><div class="m"><div class="id">sym_cord_anhbody</div><div class="fn">hemibody anhidrosis — a Horner this extensive is <b>central</b></div></div></div>
          </div>
        </div>
      </div>
```

  with

```html
            <div class="row"><span class="badge bi">IPSI</span><div class="m"><div class="id">sym_cord_anhbody</div><div class="fn">hemibody anhidrosis — a Horner this extensive is <b>central</b></div></div></div>
          </div>
        </div>
      </div>
      <div class="cols two">
        <div class="col">
          <div class="col-h"><div class="p">sacral (transverse only)</div><div class="terr">the sacral dermatomes below a complete lesion — added 2026-10-22</div></div>
          <div class="rows">
            <div class="row"><span class="badge bm">MIDLINE</span><div class="m"><div class="id">cord_saddle</div><div class="fn">saddle anaesthesia — a <b>complete</b> lesion takes every modality below the level, the saddle included; the incomplete patterns keep sacral sparing</div></div></div>
          </div>
        </div>
        <div class="col">
          <div class="col-h"><div class="p">spinal shock (shock readings only)</div><div class="terr">below an acute lesion; offered only with a stated sensory level — added 2026-10-22</div></div>
          <div class="rows">
            <div class="row"><span class="badge bb">BILAT</span><div class="m"><div class="id">cord_shock_flaccid</div><div class="fn">flaccid paralysis below an acute cord lesion</div></div></div>
            <div class="row"><span class="badge bb">BILAT</span><div class="m"><div class="id">cord_shock_tone</div><div class="fn">tone lost below the lesion</div></div></div>
            <div class="row"><span class="badge bb">BILAT</span><div class="m"><div class="id">cord_shock_knee</div><div class="fn">knee jerks lost below the lesion</div></div></div>
            <div class="row"><span class="badge bb">BILAT</span><div class="m"><div class="id">cord_shock_ankle</div><div class="fn">ankle jerks lost below the lesion</div></div></div>
            <div class="row"><span class="badge bm">MIDLINE</span><div class="m"><div class="id">cord_shock_bulbo</div><div class="fn">bulbocavernosus reflex lost — its <b>return</b> marks the end of shock</div></div></div>
            <div class="row"><span class="badge bm">MIDLINE</span><div class="m"><div class="id">cord_shock_anal</div><div class="fn">anal wink lost</div></div></div>
          </div>
        </div>
      </div>
```

  - Verify every id against the catalogue:
    `grep -o 'id">cord_[a-z_]*' docs/artifacts/anatomy-model.html | sort -u`. The output must include `cord_saddle`
    and the six `cord_shock_*` ids, and each must exist in `src/model/structures.js`.
  - Do NOT republish the Artifact. The owner reviews these rows in the content round, and republishing needs their
    go-ahead.

- [ ] **Step 6: Commit.**

```bash
git add CLAUDE.md README.md CONTRIBUTING.md docs/artifacts/architecture.html docs/artifacts/anatomy-model.html
git commit -m "docs: the spinal cord fix — the level is evidence; variants carry where along the cord"
```

---

### Task 12: Verify against the measured target, then record the numbers

**Files:**
- Modify: `CLAUDE.md` (status line counts)
- Modify: `README.md` (tests line)
- Modify: the design spec status

- [ ] **Step 1: Full `npm test`.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test > /tmp/cord-npm.txt 2>&1; echo "exit $?"; grep -c "^\s*PASS" /tmp/cord-npm.txt; grep -c "^\s*FAIL" /tmp/cord-npm.txt`
Expected: `exit 0`, 0 FAIL. Write down the PASS count. The suite count is 84: the `test` script had 82, and Tasks 2
and 10 add one each.

- [ ] **Step 2: The audit.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm run test:audit | tail -32`
Expected:
- `Spinal cord 19/20`.
- `all probes 79/105`.
- Every other region identical to the baseline.
- `synonym swaps … 114 called multifocal`, comorbidity 73/73 + 73/73, `mirror: 263/263 mirror cleanly`.

If anything differs from the prototype's numbers, investigate before recording.

- [ ] **Step 3: Record**, using the counts measured in Steps 1–2. Never carry a number over from this plan or from the
  prototype.
  - CLAUDE.md status line: replace `**82 test suites / 7134 assertions green**` with
    `**84 test suites / <PASS count from Step 1> assertions green**`.
  - README tests line: replace `76 suites, **6907 assertions**` with `84 suites, **<PASS count> assertions**`, and
    `runs all 76` with `runs all 84`.
  - Spec status line: replace the bold first line (`**Status: ROUND 1 RULED (2026-10-22)…`) with
    `**Status: IMPLEMENTED (<today's date>) on \`fix/cord-localisation\`. Audit <Step 2 probes> (cord <Step 2 cord>). Content round (spec §8) pending.**`.
    Keep the owner's quote below it.

- [ ] **Step 4: Commit.**

```bash
git add CLAUDE.md README.md docs/superpowers/specs/2026-10-22-spinal-cord-fix-design.md
git commit -m "docs: spinal cord fix verified — audit 79/105, cord 19/20, npm test green"
```

- [ ] **Step 5: Hand back to the owner.** Report the numbers, then ask for the content round (spec §8):
  - the variant names;
  - the level-note wording from Task 8;
  - the contradiction sentence from Task 10;
  - the 7 structure notes and anatomy rows;
  - the cause order per variant.

  Do not push or open a PR unless the owner asks.

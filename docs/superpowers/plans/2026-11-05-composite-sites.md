# Composite sites — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status: IMPLEMENTED (2026-11-05), `6b3a3c1..480a4bb` + docs; every step verified (npm 87 suites / 7420 green; audit
1055/4).** Task 7's browser drive loaded the pictures by case link, and the bilateral INO also by row taps. The hidden pane's
screenshot was unusable (frozen transitions), so the card text was read instead. It implements every ruling of round 1 in
`docs/superpowers/specs/2026-11-05-composite-sites-design.md` (owner: *"Approve as written"*, 2026-11-05).

**Goal:** Fix the 9 counted clinical-audit checks where one lesion spans places the model held only separately: syrinx,
basilar coma (2), full locked-in (2), parasagittal (R1 #12), top of the basilar (R1 #14), bilateral PCA (R1 #15) and
bilateral INO. The card wording that goes with them ships too.

**Architecture:**
- **Two readings of existing sites, which keep their ids** (the cord fix's idiom: a `variants` entry, scored by
  `solverSites`):
  - the ARAS read with the basis pontis;
  - the central cord read reaching the corticospinal tracts. This one is offered only with the cape, through a `needs`
    gate.
- **Three new derived sites:** both MLFs, both paracentral lobules, and the top of the basilar.
- **The locked-in site re-derived** from its source rows.
- **A Why-line rule** for the one place that spans two stations.

Every composite is DERIVED from its source rows; none is hand-listed. Every number to reproduce was measured on the
prototype, stage by stage. The flags for each task are in
`/Users/jaydenwearne/Library/Application Support/Claude/side-session-notes/local_ee2d02d5-4a70-46e4-b205-371f87906cf3/composite-prototype/lib.mjs`:

| Task | Flags |
|---|---|
| 1 | `parasag`, `parasagRe` |
| 2 | `li`, `basilar`, `basilarStation` |
| 3 | `mlf` |
| 4 | `syrinx`, `syrinxGate`, `ahNote`, and the syrinx half of `labelsFinal` |
| 5 | `apex`, `apexPlans`, `carrierStations`, `cjd`, and the label half of `labelsFinal` |
| 6 | `probes` |

The suite (`suite`) is `composite-prototype/composite-sites.test.js`, split here by section.

**Tech stack:** zero-dependency ES modules, Node 24, standalone test scripts (`ok(label, cond)`, `process.exit`).

## Global constraints

- Node is not on PATH: prefix every command with `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"`.
- Work in `/Users/jaydenwearne/Desktop/Personal/Claude Code/Projects/NeuroLocaliser/Code/neurolocaliser-composite`
  (branch `fix/composite-sites`). Never push; no PR.
- `npm run test:audit` is NOT part of `npm test`: never wire it in, and never loosen an audit assertion. The only audit
  edits are row 7's PARASAG regex (Task 1) and row 15's four probes (Task 6).
- Site ids never change. The new ids are exactly `bilateral_paracentral`, `bilateral_pons_mlf` and `top_of_basilar`. The
  reading keys are exactly `basis` and `syrinx`.
- Composites are DERIVED from their source rows (a `STRUCTURES` filter), never hand-listed. This is the B11 trap, which
  `locked_in` fell into.
- No new structures (row 16). The only structure edit is the `ah_wasting` note (row 13).
- The owner's wording is used verbatim where the spec gives it: rows 10–12, the three phonebook entries, and the first
  cause's feature. The other cause features and the workup lines are the prototype's wording, the text the spec's
  measured cards were captured from.
- No CSS changes: the `--terra` allowlist in `test/brand.test.js` is untouched.
- **No re-pins (row 14).** Any existing assertion that fails is a bug in the change.
- **The raised-pressure round (`fix/raised-pressure`, ruled 2026-11-05) adds the same gate.** If it has been merged into
  this branch first:
  - Task 4 reuses its `solverSites(opts, observed)` gate instead of adding a second one;
  - Task 2 adds `side` and `station` beside the fields its `variantOf` already carries;
  - the expected audit numbers below then differ by that round's own checks.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Count assertions from a FILE, never a pipe. On macOS a pipe write is asynchronous, so a suite that calls
  `process.exit()` can lose lines:
  `npm test > "$TMPDIR/npm-test.txt" 2>&1; echo "exit $?"; grep -c '^\s*PASS' "$TMPDIR/npm-test.txt"`.

## File map

| File | Change | Task |
|---|---|---|
| `test/composite-sites.test.js` | **new** suite pinning rows 1–13 and the guards | 1–5 |
| `package.json` | append `node test/composite-sites.test.js` to `test` | 1 |
| `src/model/sites.js` | `composeParasagittalSites`; `PONS_GAZE`, the locked-in derivation, the ARAS's `basis` reading; `composeBilateralMlfSites`; `SYRINX_REACH` + the central cord's `syrinx` reading; `composeTopOfBasilarSites` + a territory line | 1–5 |
| `src/data/syndromes.js` | three phonebook entries (row 11) | 1, 3, 5 |
| `test/clinical-audit.test.js` | PARASAG (row 7); four probes (row 15) | 1, 6 |
| `src/engine/inverse.js` | `variantOf` carries `side` and `station`; `solverSites(opts, entered)` honours `needs` | 2, 4 |
| `src/model/stations.js` | `stationOf` reads a site's own `station` | 2 |
| `app/labels.js` | two reading labels; the top of the basilar's place label | 2, 4, 5 |
| `src/model/structures.js` | the `ah_wasting` note (row 13) | 4 |
| `src/model/vascular.js`, `src/model/topography.js` | the top of the basilar's rows | 5 |
| `src/data/causes.js`, `src/data/nextSteps.js` | the top of the basilar's causes and plan (row 12) | 5 |
| `src/data/pathology/vascular.js`, `src/data/pathology/degenerative.js` | four plan slots at the new place | 5 |
| `src/engine/why.js` | `stationsAt` (row 9) | 5 |
| `docs/superpowers/specs/2026-10-18-clinical-audit-suite.md` | the record of rows 7 and 15 | 6 |
| `docs/artifacts/anatomy-model.html`, `CLAUDE.md`, the spec, this plan | docs and status | 7 |
| `Code/.claude/launch.json` (outside the repo) | a preview entry, port 8142 | 7 |

## Expected numbers, task by task (measured on the prototype)

| After | The new suite | `npm test` (assertions) | Audit (counted) |
|---|---|---|---|
| today (`b2778ad`) | — | 7355 | 1034 passed, 13 failed |
| Task 1: both paracentral lobules + PARASAG | 8 / 8 | 7363 | 1035 / 12 |
| Task 2: the pons | 25 / 25 | 7380 | 1039 / 8 |
| Task 3: both MLFs | 32 / 32 | 7387 | 1040 / 7 |
| Task 4: the syrinx reading | 40 / 40 | 7395 | 1041 / 6 |
| Task 5: the top of the basilar | 57 / 57 | 7420 | 1043 / 4 |
| Task 6: the four probes | 57 / 57 | 7420 | **1055 / 4**; probes 112 / 115; mirror 277 / 277 |

**The audit never goes backwards in this order.** Built the other way round, the pons (Task 2) breaks R1 #12's top 3
until the parasagittal site and its regex land (spec §2.4). The 4 audit failures left at the end are the raised-pressure
round's: bilateral VI ×2 and uncal herniation ×2.

---

### Task 1: Both paracentral lobules and the PARASAG regex (rows 6–7) + the new suite

**Files:**
- Create: `test/composite-sites.test.js`
- Modify: `package.json` (the `test` script), `src/model/sites.js` (a composer above `// PLEXUS SITES.`),
  `src/data/syndromes.js` (one entry), `test/clinical-audit.test.js:59` (PARASAG)

**Interfaces:**
- Produces `test/composite-sites.test.js` with these helpers:
  - `ok`, `T`, `SITE`, `has(id)`, `predicts(id, token)`, `ids(r)`;
  - `answer(tokens, opts)`, which returns `{ id, reading, multi, r }`;
  - `rowsOf(level, part, pred)`;
  - `whereOf(tokens, opts)`, which returns `whyClues(...)`'s result;
  - the picture constants `QUADRI`, `LOCKED_IN_FULL`, `BASILAR`, `SYRINX`, `SPASTIC_LEGS`, `PARASAGITTAL`,
    `TOP_OF_BASILAR` and `BILATERAL_PCA`.

  Later tasks insert their sections ABOVE the `// ---- report ----` line.
- Produces the site `bilateral_paracentral` (side `bilateral`, level `cortex`, part `paracentral`).

- [ ] **Step 1: Write the failing suite (header + section 1)**

Create `test/composite-sites.test.js`:

```js
// composite-sites.test.js — the composite sites (owner-ruled 2026-11-05; spec
// docs/superpowers/specs/2026-11-05-composite-sites-design.md). One lesion that spans places the model held only
// separately: each approved row is pinned here, with the guards the spec's §6 lists as unchanged by design.
// Run: node test/composite-sites.test.js
import { solve, candidateSites } from "../src/engine/inverse.js";
import { expectedFindings } from "../src/engine/forward.js";
import { whyChain, whyClues } from "../src/engine/why.js";
import { STRUCTURES } from "../src/model/structures.js";
import { stationOf } from "../src/model/stations.js";
import { nameForSite } from "../src/data/syndromes.js";
import { causesFor, leadingCause } from "../src/data/causes.js";
import { nextStepsFor } from "../src/data/nextSteps.js";
import { plainSiteName, readingLabel } from "../app/labels.js";

let pass = 0, fail = 0;
const ok = (label, cond, detail = "") => { cond ? pass++ : fail++; console.log((cond ? "PASS  " : "FAIL  ") + label + (cond ? "" : `  ${detail}`)); };
const T = s => new Set(s.split(/\s+/).filter(Boolean));
const SITE = Object.fromEntries(candidateSites().map(s => [s.id, s]));
const has = id => !!SITE[id];
const predicts = (id, tok) => has(id) && expectedFindings(SITE[id]).has(tok);
const ids = r => r.display.map(c => c.site.id);
// The answer the card shows: its id, the reading it was read as (a variant key, or null), and the claim.
const answer = (toks, opts = {}) => { const r = solve(T(toks), opts); const c = r.display[0];
  return { id: c ? c.site.id : null, reading: c ? c.site.variant || null : null, multi: r.multi, r }; };
const rowsOf = (level, part, pred = () => true) => STRUCTURES.filter(s => s.level === level && s.part === part && pred(s)).map(s => s.id);
const whereOf = (toks, opts = {}) => { const set = T(toks); const r = solve(set, opts);
  return whyClues(whyChain(set, r.display[0].site, opts), set, opts); };

const QUADRI = "weak_arm@left weak_arm@right weak_leg@left weak_leg@right";
const LOCKED_IN_FULL = `${QUADRI} facial_weakness@left facial_weakness@right dysarthria@none gaze_palsy@left gaze_palsy@right preserved_vertical_gaze@none`;
const BASILAR = `reduced_consciousness@none babinski@left babinski@right ${QUADRI}`;
const SYRINX = "suspended_sensory@left suspended_sensory@right wasting@left wasting@right weak_leg@left weak_leg@right babinski@left babinski@right";
const SPASTIC_LEGS = "hyperreflexia@left hyperreflexia@right babinski@left babinski@right spasticity@left spasticity@right";
const PARASAGITTAL = "weak_leg@left weak_leg@right babinski@left babinski@right urinary_incontinence@none";
const TOP_OF_BASILAR = "reduced_consciousness@none vertical_gaze_palsy@none cortical_blindness@none";
const BILATERAL_PCA = "cortical_blindness@none amnesia@none";

// ---- 1. Both paracentral lobules (row 6) ----
{
  ok("row 6: the parasagittal site is derived from both paracentral lobules (leg motor, leg sensory, micturition)",
     has("bilateral_paracentral") && JSON.stringify(SITE.bilateral_paracentral.structures) ===
       JSON.stringify(STRUCTURES.filter(s => s.level === "cortex" && ["motor_leg", "sensory_leg", "paracentral"].includes(s.part)).map(s => s.id)));
  const ps = answer(PARASAGITTAL);
  ok("row 6: both legs UMN + cortical incontinence → both paracentral lobules, one lesion (R1 #12)", ps.id === "bilateral_paracentral" && ps.multi === null, `${ps.id} multi=${!!ps.multi}`);
  const cs = answer("weak_leg@left weak_leg@right babinski@left babinski@right cortical_sensory_leg@left cortical_sensory_leg@right");
  ok("row 6: …and with cortical sensory loss in both legs", cs.id === "bilateral_paracentral" && cs.multi === null, `${cs.id} multi=${!!cs.multi}`);
  const pap = answer("papilloedema@none weak_leg@left weak_leg@right babinski@left babinski@right sphincter_dysfunction@midline");
  ok("row 6: papilloedema + paraparesis + sphincter → both paracentral lobules first, no claim (R1 #16)", pap.id === "bilateral_paracentral" && pap.multi === null, `${pap.id} multi=${!!pap.multi}`);
  ok("row 6: its phonebook entry", has("bilateral_paracentral") && /parasagittal/i.test(nameForSite(SITE.bilateral_paracentral).name));
  ok("row 6: its causes are the paracentral lobule's (the meningioma first)", has("bilateral_paracentral") &&
     causesFor(SITE.bilateral_paracentral).all[0].name === "Parasagittal / falx meningioma");
  ok("row 6 guard: a paraparesis + both Babinski still leads with the cord", answer("weak_leg@left weak_leg@right babinski@left babinski@right").id === "bilateral_cord_anterior");
  ok("row 6 guard: one weak leg + Babinski + incontinence still → the one-sided ACA", answer("weak_leg@right babinski@right urinary_incontinence@none").id === "left_cortex_aca");
}

// ---- report ----
console.log(`\nNeuroLocaliser — composite sites (round 1)\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run it to see it fail**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/composite-sites.test.js`
Expected: 8 lines. The six row-6 lines FAIL; the two guards PASS; exit 1.

- [ ] **Step 3: Add the suite to `npm test`**

In `package.json`, in the `test` script, replace `node test/content-gaps.test.js"` with
`node test/content-gaps.test.js && node test/composite-sites.test.js"`.

- [ ] **Step 4: Add the composer to `src/model/sites.js`**

Insert immediately ABOVE the line that begins `// PLEXUS SITES. A trunk / plexus lesion affects exactly the roots`:

```js
// THE PARASAGITTAL LESION — both paracentral lobules (composite-sites round, row 6, owner-approved 2026-11-05). A falx
// meningioma, a superior sagittal sinus thrombosis or an azygos ACA takes both medial hemispheres at the vertex: both legs
// (motor and cortical sensory) and the cortical micturition centre. Derived from the three paracentral parts, both sides.
// Its causes, plan, label and tables fall back to cortex_paracentral (level cortex, part paracentral), already written for
// both legs; its phonebook entry is its own.
const PARACENTRAL_PARTS = ["motor_leg", "sensory_leg", "paracentral"];
export function composeParasagittalSites() {
  const structures = STRUCTURES.filter(s => s.level === "cortex" && PARACENTRAL_PARTS.includes(s.part)).map(s => s.id);
  return structures.length ? [{ id: "bilateral_paracentral", side: "bilateral", level: "cortex", part: "paracentral",
    territory: "both paracentral lobules (parasagittal — falx / superior sagittal sinus / both ACAs)", structures, composite: true }] : [];
}

```

- [ ] **Step 5: Add its phonebook entry to `src/data/syndromes.js`**

Insert immediately ABOVE the line `  cortex_dlpfc: {`:

```js
  bilateral_paracentral: {
    name: "Parasagittal syndrome (both paracentral lobules)",
    note: "A lesion at the vertex takes both medial hemispheres: a spastic paraparesis with cortical-type urinary incontinence, often with cortical sensory loss in the legs and a magnetic gait — it mimics a spinal cord lesion almost perfectly.",
    ddx: ["Parasagittal / falx meningioma", "Bilateral ACA infarct (azygos ACA, vasospasm)", "Superior sagittal sinus thrombosis", "Normal-pressure hydrocephalus (mimic)"],
    red: "Bilateral leg weakness with urinary incontinence and a normal spine MRI is a parasagittal lesion until proven otherwise — image the brain."
  },
```

- [ ] **Step 6: Run the suite**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/composite-sites.test.js`
Expected: `8 passed, 0 failed`, exit 0.

- [ ] **Step 7: Run every suite**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test > "$TMPDIR/npm-test.txt" 2>&1; echo "exit $?"; grep -c '^\s*PASS' "$TMPDIR/npm-test.txt"`
Expected: `exit 0` and `7363`.

- [ ] **Step 8: Commit**

```bash
git add test/composite-sites.test.js package.json src/model/sites.js src/data/syndromes.js
git commit -m "feat(engine): both paracentral lobules — the parasagittal site (row 6)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 9: Admit the bilateral site to the audit's parasagittal family (row 7)**

In `test/clinical-audit.test.js`, replace the line
`const PARASAG = /^(left|right)_cortex_(aca|paracentral|motor_leg)$/;` with:

```js
// owner-approved 2026-11-05 (composite-sites round, row 7): R1 #12 asked for "a parasagittal site"; the bilateral one is the
// place it asked for, and nothing else can pass through it.
const PARASAG = /^((left|right)_cortex_(aca|paracentral|motor_leg)|bilateral_paracentral)$/;
```

- [ ] **Step 10: Run the audit**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm run test:audit 2>&1 | tail -1`
Expected: `clinical audit: 1035 passed, 12 failed (counted); 0 pending the owner's ruling`. Both R1 #12 lines (the
parasagittal meningioma) and R1 #16's top-3 line PASS (check with `npm run test:audit 2>&1 | grep parasag`).

- [ ] **Step 11: Commit**

```bash
git add test/clinical-audit.test.js
git commit -m "test(audit): the bilateral paracentral site joins the parasagittal family (composite-sites row 7)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: The pons — locked-in re-derived and the ARAS's basilar reading (rows 1–2)

The two rows must ship together. Measured: row 1 alone turns the pontine haemorrhage probe into a two-place claim,
because today it passes only because its cover needs four places.

**Files:**
- Modify: `src/model/sites.js` (`composeConsciousnessSites`), `src/engine/inverse.js:59-60` (`variantOf`),
  `src/model/stations.js` (`stationOf`), `app/labels.js` (`readingLabel`), `test/composite-sites.test.js`

**Interfaces:**
- Consumes: the suite helpers (Task 1).
- Produces:
  - a reading may carry `side` and `station`, which `variantOf` copies onto the scored site;
  - `stationOf(site)` returns `site.station` when it is set;
  - the reading key `basis` on `brainstem_aras`;
  - `PONS_GAZE()`, a function returning the ids of the paramedian pons's `gaze_palsy` rows.

- [ ] **Step 1: Write the failing tests (section 2)**

Insert immediately ABOVE `// ---- report ----` in `test/composite-sites.test.js`:

```js
// ---- 2. The pons (rows 1–2) ----
{
  const li = SITE.locked_in;
  const basis = rowsOf("pons", "basis_pontis");
  ok("row 1: locked-in is derived from every basis pontis row", basis.length > 0 && basis.every(id => li.structures.includes(id)));
  ok("row 1: …and the paramedian pons's horizontal-gaze rows", rowsOf("pons", "medial", s => s.produces === "gaze_palsy").every(id => li.structures.includes(id)));
  ok("row 1: locked-in predicts both Babinski signs, both facial palsies, anarthria and both horizontal gaze palsies",
     ["babinski@left", "babinski@right", "facial_weakness@left", "facial_weakness@right", "dysarthria@none", "gaze_palsy@left", "gaze_palsy@right"].every(t => predicts("locked_in", t)));
  ok("row 1: locked-in keeps preserved vertical gaze and never predicts reduced consciousness",
     predicts("locked_in", "preserved_vertical_gaze@none") && !predicts("locked_in", "reduced_consciousness@none"));
  const full = answer(LOCKED_IN_FULL);
  ok("row 1: the full locked-in picture → locked-in, one lesion", full.id === "locked_in" && full.multi === null, `${full.id} multi=${!!full.multi}`);
  const bab = answer(`${QUADRI} babinski@left babinski@right preserved_vertical_gaze@none`);
  ok("row 1: locked-in with both Babinski signs → locked-in, one lesion", bab.id === "locked_in" && bab.multi === null, `${bab.id} multi=${!!bab.multi}`);
  const vign = answer(`${QUADRI} preserved_vertical_gaze@none`);
  ok("row 1 guard: quadriplegia + preserved vertical gaze still → locked-in", vign.id === "locked_in" && vign.multi === null, vign.id);

  const bas = answer(BASILAR);
  ok("row 2: coma + quadriparesis + both Babinski → the ARAS read with the basis pontis, one lesion",
     bas.id === "brainstem_aras" && bas.reading === "basis" && bas.multi === null, `${bas.id} {${bas.reading}} multi=${!!bas.multi}`);
  const haem = answer(`reduced_consciousness@none gaze_palsy@left gaze_palsy@right ${QUADRI}`);
  ok("row 2: coma + both horizontal gaze palsies + quadriparesis (pontine haemorrhage) → the same reading, one lesion",
     haem.id === "brainstem_aras" && haem.reading === "basis" && haem.multi === null, `${haem.id} {${haem.reading}} multi=${!!haem.multi}`);
  const post = answer(`reduced_consciousness@none extensor_posturing@none ${QUADRI}`);
  ok("row 2: coma + extensor posturing + quadriparesis → the same reading, one lesion", post.id === "brainstem_aras" && post.reading === "basis" && post.multi === null, `${post.id} {${post.reading}}`);
  const o3 = answer("reduced_consciousness@none babinski@left babinski@right");
  ok("row 2: coma + both Babinski signs (the raised-pressure round's O3) → the same reading, one lesion", o3.id === "brainstem_aras" && o3.multi === null, `${o3.id} multi=${!!o3.multi}`);
  ok("row 2 guard: coma alone still → the diffuse cerebrum", answer("reduced_consciousness@none").id === "cerebrum_diffuse");
  const cp = answer("reduced_consciousness@none extensor_posturing@none");
  ok("row 2 guard: coma + extensor posturing still → the ARAS itself, not the reading", cp.id === "brainstem_aras" && cp.reading === null, `{${cp.reading}}`);
  ok("row 2: the ARAS itself stays midline; the reading is bilateral and sits in the pons",
     SITE.brainstem_aras.side === "midline" && bas.r.display[0].site.side === "bilateral" && stationOf(bas.r.display[0].site) === "pons");
  ok("row 2: the reading's label", readingLabel(bas.r.display[0].site) === " — with the basis pontis", JSON.stringify(readingLabel(bas.r.display[0].site)));
  ok("row 2 guard: quadriparesis + both Babinski still leads with the cord", answer(`${QUADRI} babinski@left babinski@right`).id === "bilateral_cord_anterior");
  ok("row 2: the basilar picture → only the pons", whereOf(BASILAR).where === "pons", whereOf(BASILAR).where);
}

```

- [ ] **Step 2: Run it to see it fail**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/composite-sites.test.js`
Expected: section 1's 8 lines PASS. Of section 2's 17 lines, 12 FAIL and 5 PASS: preserved vertical gaze, the
quadriplegia vignette, coma alone, coma + posturing, and quadriparesis + Babinski. Exit 1.

- [ ] **Step 3: Re-derive locked-in and add the ARAS's reading in `src/model/sites.js`**

(a) Insert immediately ABOVE `export function composeConsciousnessSites() {`:

```js
// The paramedian pons's horizontal-gaze rows (the PPRF and the abducens nucleus). Locked-in loses horizontal gaze and keeps
// vertical gaze and blinking; the ARAS's basilar reading carries them too (composite-sites round, rows 1–2).
const PONS_GAZE = () => STRUCTURES.filter(s => s.level === "pons" && s.part === "medial" && s.produces === "gaze_palsy").map(s => s.id);
```

(b) Inside `composeConsciousnessSites`, replace

```js
  if (aras.length) sites.push({ id: "brainstem_aras", side: "midline", level: "brainstem_aras", part: "paramedian_tegmentum",
    territory: TERRITORY["brainstem_aras|paramedian_tegmentum"], structures: aras, composite: true });
```

with

```js
  // Its BASILAR READING (composite-sites round, row 2, owner-approved 2026-11-05): the tegmental lesion grown into the basis
  // pontis on both sides — coma with quadriparesis, both Babinski signs and horizontal gaze palsies (basilar occlusion,
  // pontine haemorrhage). The same id, causes and plan; the reading is bilateral and sits in the pons on the Why line (its
  // level's own station, "brainstem (several levels)", would put an isolated Babinski there too).
  if (aras.length) sites.push({ id: "brainstem_aras", side: "midline", level: "brainstem_aras", part: "paramedian_tegmentum",
    territory: TERRITORY["brainstem_aras|paramedian_tegmentum"], structures: aras, composite: true,
    variants: [{ key: "basis", side: "bilateral", station: "pons", structures: [...aras, ...byLevelPart("pons", "basis_pontis"), ...PONS_GAZE()] }] });
```

(c) In the same function, replace

```js
    territory: TERRITORY["locked_in|ventral_pons"], structures: ["cst_pons_arm", "cst_pons_leg", ...li], composite: true });
```

with

```js
    // BOTH SIDES OF THE BASIS PONTIS, derived (composite-sites round, row 1): the hand list it replaced (cst_pons_arm +
    // cst_pons_leg) went stale as the pons gained its Babinski, face and speech rows — the B11 trap a fourth time.
    territory: TERRITORY["locked_in|ventral_pons"], structures: [...byLevelPart("pons", "basis_pontis"), ...PONS_GAZE(), ...li], composite: true });
```

- [ ] **Step 4: Let a reading carry its side and station (`src/engine/inverse.js`)**

Replace

```js
const variantOf = (site, v) => ({ ...site, variant: v.key, structures: v.structures, atLevel: v.atLevel,
  segments: v.segments, variants: undefined });
```

with

```js
// A reading may carry its own side (the ARAS's basilar reading is bilateral, though the ARAS is midline) and its own
// station on the Why line (that reading sits in the pons) — composite-sites round, row 2.
const variantOf = (site, v) => ({ ...site, ...(v.side ? { side: v.side } : {}), ...(v.station ? { station: v.station } : {}),
  variant: v.key, structures: v.structures, atLevel: v.atLevel, segments: v.segments, variants: undefined });
```

If the raised-pressure round has landed, `variantOf` already carries `leads` and `red`. Keep them, and add only the
`side` and `station` spreads.

- [ ] **Step 5: `stationOf` reads a site's own station (`src/model/stations.js`)**

Replace `export const stationOf = site => BY_PART[` with `export const stationOf = site => site.station || BY_PART[`.
Leave the rest of that line as it is. Add this comment above it:

```js
// A site (or a reading) may name its own station: the ARAS's basilar reading sits in the pons (composite-sites round, row 2).
```

- [ ] **Step 6: The reading's label (`app/labels.js` `readingLabel`)**

In the object literal on the line `return { "arms-spared": " (arms spared)", shock: " (spinal shock)", …}[v] || "";`,
add the key `basis: " — with the basis pontis"`. It takes a dash, not brackets, because the ARAS label already ends in a
bracket. The line becomes:

```js
  return { "arms-spared": " (arms spared)", shock: " (spinal shock)", "shock:arms-spared": " (spinal shock, arms spared)", basis: " — with the basis pontis" }[v] || "";
```

(Keep any key the raised-pressure round added, such as `uncal`.)

- [ ] **Step 7: Run the suite**

Expected: `25 passed, 0 failed`, exit 0.

- [ ] **Step 8: Run every suite**

Run the Task 1 Step 7 command. Expected: `exit 0` and `7380`. The existing pins that read the locked-in site pass
unchanged (measured): `consciousness.test` (scored best for quadriplegia + preserved gaze),
`clinical-vignettes` "Locked-in", and `ranking-realism`.

- [ ] **Step 9: Run the audit**

Expected: `clinical audit: 1039 passed, 8 failed`. The basilar probe (2 lines), the locked-in probe (2 lines) and the
pontine-haemorrhage probe all PASS.

- [ ] **Step 10: Commit**

```bash
git add src/model/sites.js src/engine/inverse.js src/model/stations.js app/labels.js test/composite-sites.test.js
git commit -m "feat(engine): locked-in re-derived from the basis pontis; the ARAS's basilar reading (rows 1-2)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Both MLFs (row 3)

**Files:**
- Modify: `src/model/sites.js` (a composer above `// PLEXUS SITES.`), `src/data/syndromes.js` (one entry),
  `test/composite-sites.test.js`

**Interfaces:**
- Consumes: the suite helpers.
- Produces: the site `bilateral_pons_mlf` (side `bilateral`, level `pons`, part `medial`). Its causes, plan, label and
  tables fall back to `pons_medial`.

- [ ] **Step 1: Write the failing tests (section 3)**

Insert immediately ABOVE `// ---- report ----`:

```js
// ---- 3. Both MLFs (row 3) ----
{
  ok("row 3: the both-MLFs site exists, built from the paramedian pons's INO rows",
     has("bilateral_pons_mlf") && JSON.stringify(SITE.bilateral_pons_mlf.structures) === JSON.stringify(rowsOf("pons", "medial", s => s.produces === "ino")));
  ok("row 3: it predicts an INO on each side and nothing else",
     has("bilateral_pons_mlf") && [...expectedFindings(SITE.bilateral_pons_mlf)].sort().join() === "ino@left,ino@right");
  const ino = answer("ino@left ino@right");
  ok("row 3: bilateral INO → both MLFs, one lesion", ino.id === "bilateral_pons_mlf" && ino.multi === null, `${ino.id} multi=${!!ino.multi}`);
  ok("row 3: its phonebook entry", has("bilateral_pons_mlf") && /internuclear/i.test(nameForSite(SITE.bilateral_pons_mlf).name));
  ok("row 3: its causes are the medial pons's", has("bilateral_pons_mlf") &&
     causesFor(SITE.bilateral_pons_mlf).all.map(c => c.name).join() === causesFor(SITE.left_pons_medial).all.map(c => c.name).join());
  const one = answer("ino@left");
  ok("row 3 guard: a one-sided INO never reads both MLFs", one.id !== "bilateral_pons_mlf" && !ids(one.r).includes("bilateral_pons_mlf"), one.id);
  ok("row 3 guard: one-and-a-half still → the left medial pons", answer("gaze_palsy@left ino@left").id === "left_pons_medial");
}

```

- [ ] **Step 2: Run it to see it fail**

Expected: sections 1–2 PASS. Of section 3's 7 lines, the five row lines FAIL and the two guards PASS. Exit 1.

- [ ] **Step 3: Add the composer to `src/model/sites.js`**

Insert immediately ABOVE the line that begins `// PLEXUS SITES. A trunk / plexus lesion affects exactly the roots`:

```js
// BILATERAL INO — both MLFs (composite-sites round, row 3, owner-approved 2026-11-05). The two fasciculi lie side by side in
// the paramedian tegmentum, so one small paramedian lesion takes both. Derived: the paramedian pons's INO rows, emitted on
// both sides. Its causes, plan, label and tables fall back to pons_medial; its phonebook entry is its own.
export function composeBilateralMlfSites() {
  const structures = STRUCTURES.filter(s => s.level === "pons" && s.part === "medial" && s.produces === "ino").map(s => s.id);
  return structures.length ? [{ id: "bilateral_pons_mlf", side: "bilateral", level: "pons", part: "medial",
    territory: "both medial longitudinal fasciculi (paramedian pontine tegmentum)", structures, composite: true }] : [];
}

```

- [ ] **Step 4: Add its phonebook entry to `src/data/syndromes.js`**

Insert immediately ABOVE the line `  pons_lateral: {`:

```js
  bilateral_pons_mlf: {
    name: "Bilateral internuclear ophthalmoplegia (both MLFs)",
    note: "The two medial longitudinal fasciculi lie side by side in the paramedian tegmentum, so one small paramedian lesion takes both: neither eye adducts on lateral gaze, with nystagmus of the abducting eye on each side; convergence may be spared.",
    ddx: ["Demyelination (MS) — the commonest cause in a younger patient", "Brainstem infarct (basilar perforators) in an older patient", "Wernicke's encephalopathy", "Tumour", "Myasthenia gravis (pseudo-INO)"],
    red: "A bilateral INO in an older patient, or with any other brainstem sign, is a posterior-circulation stroke until imaging says otherwise."
  },
```

- [ ] **Step 5: Run the suite.** Expected: `32 passed, 0 failed`.

- [ ] **Step 6: Run every suite.** Expected: `exit 0` and `7387`.

- [ ] **Step 7: Run the audit.** Expected: `clinical audit: 1040 passed, 7 failed`; the bilateral INO lines PASS.

- [ ] **Step 8: Commit**

```bash
git add src/model/sites.js src/data/syndromes.js test/composite-sites.test.js
git commit -m "feat(engine): both MLFs — one paramedian lesion for a bilateral INO (row 3)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: The syrinx reading, its gate and the wasting note (rows 4, 5 and 13)

**Files:**
- Modify: `src/engine/inverse.js` (`solverSites` and its four callers, unless the raised-pressure gate is present),
  `src/model/sites.js` (`SYRINX_REACH`, `composeBilateralCordSites`, the `CENTRAL_REACH` comment), `app/labels.js`
  (`readingLabel`), `src/model/structures.js` (`ah_wasting`), `test/composite-sites.test.js`

**Interfaces:**
- Consumes: `variantOf` (Task 2).
- Produces:
  - `solverSites(opts, entered)`, where a reading with `needs: [findingId…]` is offered only when one of those findings
    is entered, on any side;
  - the reading key `syrinx` on `bilateral_cord_central`.

- [ ] **Step 1: Write the failing tests (section 4)**

Insert immediately ABOVE `// ---- report ----`:

```js
// ---- 4. The syrinx reading and its gate (rows 4, 5 and 13) ----
{
  const syr = answer(SYRINX);
  ok("row 4: cape + wasted hands + spastic legs → the central cord read reaching the corticospinal tracts, one lesion",
     syr.id === "bilateral_cord_central" && syr.reading === "syrinx" && syr.multi === null, `${syr.id} {${syr.reading}} multi=${!!syr.multi}`);
  const legs = answer("suspended_sensory@left suspended_sensory@right weak_leg@left weak_leg@right babinski@left babinski@right hyperreflexia@left hyperreflexia@right");
  ok("row 4: cape + spastic legs, without wasted hands → the same reading, one lesion", legs.id === "bilateral_cord_central" && legs.multi === null, `${legs.id} multi=${!!legs.multi}`);
  ok("row 4: the reading's label", syr.id === "bilateral_cord_central" && readingLabel(syr.r.display[0].site) === " (reaching the corticospinal tracts)",
     JSON.stringify(syr.id === "bilateral_cord_central" ? readingLabel(syr.r.display[0].site) : null));
  const c4 = answer(SPASTIC_LEGS, { sensoryLevel: "C4" });
  ok("row 5: without a cape the reading is not offered — spastic legs + C4 still → the anterior cord, level named",
     c4.id === "bilateral_cord_anterior" && /C4/.test(c4.r.level?.note || ""), `${c4.id} {${c4.reading}}`);
  ok("row 5: …and spastic legs alone never list the reading", !solve(T(SPASTIC_LEGS)).display.some(c => c.site.variant === "syrinx"));
  const cape = answer("suspended_sensory@left suspended_sensory@right");
  ok("row 4 guard: a bare cape still → the central cord, plain", cape.id === "bilateral_cord_central" && cape.reading === null, `{${cape.reading}}`);
  const cc = answer("weak_arm@left weak_arm@right suspended_sensory@left suspended_sensory@right");
  ok("row 4 guard: both arms weak + cape still → the central cord, plain, one lesion", cc.id === "bilateral_cord_central" && cc.reading === null && cc.multi === null);
  const ah = STRUCTURES.find(s => s.id === "ah_wasting");
  ok("row 13: the shared anterior-horn wasting row no longer says 'generalised'", !!ah && !/generalised/i.test(ah.note), ah && ah.note);
}

```

- [ ] **Step 2: Run it to see it fail**

Expected: sections 1–3 PASS. Of section 4's 8 lines, 4 FAIL: the three row-4 lines and row 13. The two row-5 lines and
the two guards PASS. Exit 1.

- [ ] **Step 3: The `needs` gate (`src/engine/inverse.js`)**

First check whether the raised-pressure round's gate is already present:
`grep -n "export function solverSites(opts = {}, " src/engine/inverse.js`.
- **If it prints a line:** do NOT add a second gate. Give the syrinx reading its requirement in that gate's own format:
  one finding, `suspended_sensory`, entered on any side. Skip to Step 4, and translate Step 4's
  `needs: ["suspended_sensory"]` into that format.
- **If it prints nothing:** make the edits below.

Replace `export function solverSites(opts = {}) {` with:

```js
// `entered`: what the clinician entered. A reading that NEEDS its defining finding (`needs`, composite-sites round, row 5:
// the expanding syrinx needs the cape) is offered only when it is entered — as spinal shock is offered only with a stated
// level. Callers without an entered set (the Why index) never see a gated reading.
export function solverSites(opts = {}, entered = null) {
```

Immediately below the line `      if (v.needsLevel && !level) continue;`, insert:

```js
      if (v.needs && !(entered && [...entered].some(t => v.needs.includes(t.split("@")[0])))) continue;
```

Then pass the entered set at the four callers. Each sits in a function whose first parameter is `observedSet`:
- in `rankSingle`: `return firstPerId(solverSites(opts)` → `return firstPerId(solverSites(opts, observedSet)`;
- in `differential` AND in `ruledOutSites`, two identical lines: `  for (const site of solverSites(opts)) {` →
  `  for (const site of solverSites(opts, observedSet)) {`;
- in `nearFit`: `  const sites = solverSites(opts);` → `  const sites = solverSites(opts, observedSet);`.

Leave `src/engine/why.js`'s `solverSites(opts)` call as it is. The central cord's plain reading is still indexed there,
so the Why stations do not change.

- [ ] **Step 4: The reading (`src/model/sites.js`)**

(a) Insert immediately ABOVE `export function composeBilateralCordSites() {`:

```js
// The cord's LEG corticospinal rows: the anterior cord's corticospinal rows other than the arm rows. An expanding syrinx
// reaches them from the centre (composite-sites round, row 4).
const SYRINX_REACH = () => STRUCTURES.filter(s => s.level === "cord" && s.part === "anterior" && s.id.startsWith("cst_cord_") && !CORD_ARM_ROWS.has(s.id)).map(s => s.id);
```

(b) In `composeBilateralCordSites`, replace

```js
      ...(part === "anterior" ? { variants: cordVariants(structures) } : {})
```

with

```js
      ...(part === "anterior" ? { variants: cordVariants(structures) } : {}),
      // the SYRINX READING (rows 4–5): the central lesion grown into the lateral columns — legs weak and spastic below it.
      // Offered only with the cape that defines the central cord: ungated it takes "spastic legs + a cervical level".
      ...(part === "central" ? { variants: [{ key: "syrinx", needs: ["suspended_sensory"], structures: [...structures, ...SYRINX_REACH()] }] } : {})
```

(c) In the comment above `const CENTRAL_REACH = ["cst_cord_arm", "ah_wasting"];`, replace the comment line
`// for an expanding syrinx are deferred to the composite-sites round; bladder stays out (owner ruling 2026-09-26).`
with:

```js
// for an expanding syrinx are its syrinx READING (composite-sites round, rows 4–5), offered only with the cape; bladder
// stays out (owner ruling 2026-09-26).
```

- [ ] **Step 5: The reading's label (`app/labels.js`)**

Add the key `syrinx: " (reaching the corticospinal tracts)"` to the same `readingLabel` object as Task 2 Step 6. It
takes brackets, like the cord's other readings.

- [ ] **Step 6: The wasting note (`src/model/structures.js`, row 13)**

Replace `note: "anterior horn — denervation wasting (generalised LMN)" }` with
`note: "anterior horn cells — denervation wasting (LMN)" }`.

The central cord reuses this row, so the syrinx's Why card would otherwise quote "generalised" for wasted hands. That
was the cord spec's D8. A cord-level wasting row was measured and rejected: `tone.test` pins "UMN has NO wasting".

- [ ] **Step 7: Run the suite.** Expected: `40 passed, 0 failed`.

- [ ] **Step 8: Run every suite.** Expected: `exit 0` and `7395`.

- [ ] **Step 9: Run the audit.** Expected: `clinical audit: 1041 passed, 6 failed`. The syrinx line passes, and
  "spastic legs with a C4 level" still PASSES.

- [ ] **Step 10: Commit**

```bash
git add src/engine/inverse.js src/model/sites.js app/labels.js src/model/structures.js test/composite-sites.test.js
git commit -m "feat(engine): the central cord's syrinx reading, offered with the cape (rows 4, 5, 13)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: The top of the basilar and its Why line (rows 8–12)

**Files:**
- Modify: `src/model/sites.js` (`TERRITORY`, a composer above `// PLEXUS SITES.`), `app/labels.js` (`PART_LABEL`),
  `src/model/vascular.js`, `src/model/topography.js`, `src/data/syndromes.js`, `src/data/causes.js`,
  `src/data/nextSteps.js`, `src/data/pathology/vascular.js`, `src/data/pathology/degenerative.js`, `src/engine/why.js`,
  `test/composite-sites.test.js`

**Interfaces:**
- Consumes: the suite helpers.
- Produces:
  - the site `top_of_basilar` (side `bilateral`, level `thalamus_arousal`, part `basilar_apex`, `carrierStations: true`),
    with its own content key: `CAUSES.top_of_basilar`, `NEXT.top_of_basilar`, `BY_SITE.top_of_basilar`;
  - `stationsAt(site, toks, observedSet, opts)` in why.js (module-private).

- [ ] **Step 1: Write the failing tests (section 5)**

Insert immediately ABOVE `// ---- report ----`:

```js
// ---- 5. The top of the basilar (rows 8, 10–12) and its Why line (row 9) ----
{
  const tob = SITE.top_of_basilar;
  const percheron = rowsOf("thalamus_arousal", "paramedian");
  const pca = STRUCTURES.filter(s => s.level === "cortex" && ["occipital", "fusiform"].includes(s.part)).map(s => s.id);
  ok("row 8: the top of the basilar is derived from Percheron's rows and both PCA cortical territories",
     !!tob && tob.side === "bilateral" && [...percheron, ...pca].every(id => tob.structures.includes(id)) && tob.structures.length === percheron.length + pca.length);
  const t14 = answer(TOP_OF_BASILAR);
  ok("row 8: coma + vertical gaze palsy + cortical blindness → the top of the basilar, one lesion (R1 #14)", t14.id === "top_of_basilar" && t14.multi === null, `${t14.id} multi=${!!t14.multi}`);
  const t15 = answer(BILATERAL_PCA);
  ok("row 8: cortical blindness + amnesia → the top of the basilar, one lesion (R1 #15)", t15.id === "top_of_basilar" && t15.multi === null, `${t15.id} multi=${!!t15.multi}`);
  const tf = answer("reduced_consciousness@none vertical_gaze_palsy@none homonymous_hemianopia@left homonymous_hemianopia@right");
  ok("row 8: …and entered as a hemianopia on each side", tf.id === "top_of_basilar" && tf.multi === null, `${tf.id} multi=${!!tf.multi}`);
  ok("row 8 guard: Percheron's triad still → the paramedian thalami", answer("reduced_consciousness@none vertical_gaze_palsy@none amnesia@none").id === "thalamus_bilateral_percheron");
  ok("row 8 guard: Anton's alone still → both occipital lobes", answer("cortical_blindness@none").id === "bilateral_occipital");
  ok("row 8 guard: a hemianopia on each side still → both occipital lobes", answer("homonymous_hemianopia@left homonymous_hemianopia@right").id === "bilateral_occipital");
  ok("row 10: the place reads 'Bilateral thalami and occipital lobes (top of the basilar)'",
     !!tob && plainSiteName(tob).place === "Bilateral thalami and occipital lobes (top of the basilar)", tob && plainSiteName(tob).place);
  ok("row 11: its phonebook entry", !!tob && /top-of-the-basilar/i.test(nameForSite(tob).name));
  const names = tob ? causesFor(tob).all.map(c => c.name) : [];
  const RULED = ["Top-of-the-basilar embolism", "Basilar artery occlusion", "Vertebral artery dissection",
    "Posterior reversible encephalopathy syndrome (PRES)", "Deep cerebral venous thrombosis",
    "Cardiac arrest / profound global hypoperfusion", "Creutzfeldt-Jakob disease (Heidenhain variant)", "Non-convulsive status epilepticus"];
  ok("row 12: its eight causes", names.length === 8 && RULED.every(n => names.includes(n)), names.join(" | "));
  ok("row 12: with no onset the embolism leads", !!tob && (leadingCause(causesFor(tob).all) || {}).name === "Top-of-the-basilar embolism");
  ok("row 12: at a chronic onset the What line names the slow cause, not nothing",
     !!tob && (leadingCause(causesFor(tob, { onset: "chronic" }).all) || {}).name === "Creutzfeldt-Jakob disease (Heidenhain variant)");
  ok("row 12: its plan is an emergency", !!tob && nextStepsFor(tob).urgency === "emergency");

  ok("row 9: Anton's alone → only the cerebral cortex", whereOf("cortical_blindness@none").where === "cerebral cortex", whereOf("cortical_blindness@none").where);
  const w15 = whereOf(BILATERAL_PCA);
  ok("row 9: cortical blindness + amnesia → one place, the cerebral cortex and thalamus", w15.verdict === "one" && w15.where === "cerebral cortex and thalamus", `${w15.verdict}: ${w15.where}`);
  const w14 = whereOf(TOP_OF_BASILAR);
  ok("row 9: the top of the basilar's own picture → the cerebral cortex and thalamus", w14.verdict === "one" && w14.where === "cerebral cortex and thalamus", `${w14.verdict}: ${w14.where}`);
  ok("row 9 guard: Percheron's triad → only the thalamus", whereOf("reduced_consciousness@none vertical_gaze_palsy@none amnesia@none").where === "thalamus");
}

```

- [ ] **Step 2: Run it to see it fail**

Expected: sections 1–4 PASS. Of section 5's 17 lines, 12 FAIL and 5 PASS: the three row-8 guards, Anton's Why line and
Percheron's Why line. Exit 1.

- [ ] **Step 3: The site (`src/model/sites.js`)**

(a) In `TERRITORY`, insert immediately BELOW the line
`  "thalamus_arousal|paramedian": "bilateral paramedian / intralaminar thalamus (artery of Percheron)",`:

```js
  "thalamus_arousal|basilar_apex": "basilar apex — both P1 thalamoperforators and both posterior cerebral arteries (top of the basilar)",
```

(b) Insert immediately ABOVE the line that begins `// PLEXUS SITES. A trunk / plexus lesion affects exactly the roots`:

```js
// TOP OF THE BASILAR — the basilar apex (composite-sites round, row 8, owner-approved 2026-11-05): both P1s with their
// thalamoperforators (the paramedian thalami, as the artery of Percheron) and both PCAs beyond (the occipital and ventral
// occipitotemporal cortex). One embolus at the tip takes them all. Derived: the Percheron rows + the PCA cortical parts
// (DIVISION), both sides. It spans two stations, so the Why line places it by the rows that carry what was entered
// (carrierStations, row 9). Its own content key.
export function composeTopOfBasilarSites() {
  const thal = STRUCTURES.filter(s => s.level === "thalamus_arousal" && s.part === "paramedian").map(s => s.id);
  const pcaParts = Object.keys(DIVISION).filter(p => DIVISION[p].territory === "PCA");
  const pca = STRUCTURES.filter(s => s.level === "cortex" && pcaParts.includes(s.part)).map(s => s.id);
  return thal.length && pca.length ? [{ id: "top_of_basilar", side: "bilateral", level: "thalamus_arousal", part: "basilar_apex",
    territory: TERRITORY["thalamus_arousal|basilar_apex"], structures: [...thal, ...pca], composite: true, carrierStations: true }] : [];
}

```

- [ ] **Step 4: The place label (`app/labels.js`, row 10)**

In `PART_LABEL`, insert immediately BELOW `  "thalamus_arousal|paramedian": "paramedian thalamus",`:

```js
  "thalamus_arousal|basilar_apex": "thalami and occipital lobes (top of the basilar)",
```

- [ ] **Step 5: The tables (`src/model/vascular.js`, `src/model/topography.js`)**

In `src/model/vascular.js`, insert immediately BELOW the `"thalamus_arousal|paramedian":` row of the vascular table:

```js
  "thalamus_arousal|basilar_apex":      { vessel: "BA",  segment: null, branch: "basilar apex (both P1 perforators and both PCAs)", zone: "cortical" },
```

Then, immediately BELOW `export const SEGMENT_NULL_REASON = {`, insert:

```js
  "thalamus_arousal|basilar_apex": "The basilar tip feeds both PCAs from P1 onward; no single segment.",
```

In `src/model/topography.js`, insert immediately BELOW the `"thalamus_arousal|paramedian":` row:

```js
  "thalamus_arousal|basilar_apex":               { lobe: null        , surface: false, system: null },
```

Its lobe is null: only cortex keys carry a lobe, which is test-enforced.

- [ ] **Step 6: The phonebook entry (`src/data/syndromes.js`, row 11)**

Insert immediately ABOVE `  thalamus_bilateral_percheron: {`:

```js
  top_of_basilar: {
    name: "Top-of-the-basilar syndrome (basilar apex)",
    note: "An embolus at the basilar tip blocks both P1 segments, with the thalamoperforators to both paramedian thalami, and both PCAs beyond: reduced arousal, vertical gaze palsy and amnesia with cortical blindness or bilateral field loss — often with PRESERVED power.",
    ddx: ["Top-of-the-basilar embolism (cardiac or vertebral source)", "Basilar artery thrombosis", "PRES", "Deep cerebral venous thrombosis (mimics the thalamic half)"],
    red: "Drowsiness with vertical gaze palsy and visual loss is a basilar-tip occlusion until proven otherwise — CTA now; it is a thrombectomy target, and it is regularly called delirium."
  },
```

- [ ] **Step 7: The causes (`src/data/causes.js`, row 12)**

Insert immediately ABOVE `  thalamus_arousal_paramedian: [ // artery of Percheron`:

```js
  top_of_basilar: [ // basilar apex — both P1 perforator territories + both PCAs (composite-sites round, row 12)
    c("Top-of-the-basilar embolism", "vascular", ["hyperacute","acute"], "common", true,
      "Sudden drowsiness, vertical gaze palsy and visual loss together, with little or no weakness — one embolus at the tip blocks both posterior cerebral arteries and the thalamoperforators at once; it is regularly mistaken for delirium"),
    c("Basilar artery occlusion", "vascular", ["hyperacute","acute"], "common", true,
      "Prodromal dizziness, diplopia or a fluctuating conscious level before the full picture — thrombosis on basilar atheroma propagating to the tip; the fluctuation is the warning"),
    c("Vertebral artery dissection", "vascular", ["hyperacute","acute"], "uncommon", true,
      "Neck or occipital pain before the deficit in a younger patient, often after trauma or neck manipulation — an artery-to-artery embolus to the basilar tip"),
    c("Posterior reversible encephalopathy syndrome (PRES)", "metabolic", ["acute","subacute"], "uncommon", true,
      "Severe hypertension, eclampsia or a calcineurin inhibitor, with headache, seizures and cortical visual loss — the oedema favours the occipital lobes and can reach the thalami and brainstem; reversible if the trigger is corrected"),
    c("Deep cerebral venous thrombosis", "vascular", ["acute","subacute"], "uncommon", true,
      "Headache and reduced consciousness with BILATERAL thalamic change that does not respect an arterial territory — a prothrombotic state or pregnancy; the thalamic half of the picture without the occipital one"),
    c("Cardiac arrest / profound global hypoperfusion", "vascular", ["hyperacute","acute"], "uncommon", true,
      "Cortical blindness and amnesia after a cardiac arrest or a profound fall in blood pressure — the posterior watershed and the thalami fail first; there is a clear precipitating event"),
    // the slow cause (row 12): a chronic onset sets the other seven aside, and without it the stroke plan would stand
    c("Creutzfeldt-Jakob disease (Heidenhain variant)", "degenerative", ["subacute","chronic"], "rare", false,
      "Weeks to months of progressive cortical visual loss, then dementia and myoclonus, with no vascular event — the Heidenhain variant begins in the occipital lobes, and DWI shows cortical ribboning with thalamic signal"),
    c("Non-convulsive status epilepticus", "mimic", ["acute","subacute"], "uncommon", true,
      "Fluctuating unresponsiveness with subtle twitching or eye deviation and no structural lesion on imaging — only the EEG makes the diagnosis"),
  ],
```

The Heidenhain variant is `["subacute"]` at `cortex_occipital`. Here it is `["subacute","chronic"]` on purpose, because
the row exists to give a chronic onset a cause to follow. The generic CJD entry at the paramedian thalami uses the same
pair.

- [ ] **Step 8: The plan (`src/data/nextSteps.js`, row 12)**

Insert immediately ABOVE `  thalamus_bilateral_percheron: ns(`:

```js
  top_of_basilar: ns(
    ["EMERGENCY CT and CTA of the basilar artery — a basilar-tip occlusion is a thrombectomy target, with a wider window than the anterior circulation",
     "MRI brain (DWI) for both thalami, the midbrain and both occipital lobes — the early CT is often normal",
     "ECG and cardiac monitoring for an embolic source; venography if the thalamic change is not arterial"],
    "emergency",
    "IMMEDIATE stroke team and neurointerventional referral.",
    { immediate: ["Assess conscious level, vertical gaze, the pupils and the visual fields — the combination with preserved power is the diagnosis",
                  "Bedside glucose; establish the time last known well",
                  "Protect the airway if drowsy"],
      confirmatory: ["Echocardiography and prolonged rhythm monitoring for a cardiac source; vertebral artery imaging for dissection",
                     "Vascular risk-factor work-up: lipids, HbA1c"],
      monitoring: ["Continuous neuro-obs in a critical-care or stroke-unit setting — a basilar picture can progress",
                   "Formal visual-field, memory and cognitive assessment once stable — cortical blindness may be denied (Anton's)"] }),
```

- [ ] **Step 9: Four plan slots at the new place (the plan-differentiation invariant)**

`test/pathology-next-steps.test.js` fails a pathology whose plan reads identically at two places. Four of the new
place's causes would. Add a `bySite` entry for `top_of_basilar` to each:

(a) `src/data/pathology/vascular.js`, `"Vertebral artery dissection": {`: immediately BELOW its
`flavour: "OCCIPITAL or posterior neck pain preceding a lateral medullary syndrome — … than atherosclerosis" },` line,
insert:

```js
      bySite: { top_of_basilar: { level: "conscious level, vertical gaze and both visual fields, and the neck for pain",
        flavour: "an embolus from a dissected vertebral artery can lodge at the basilar tip — neck or occipital pain before a top-of-the-basilar picture in a younger patient" } },
```

(b) The same file, `"Top-of-the-basilar embolism": {`: immediately BELOW its
`flavour: "a bewildering mixture of visual, oculomotor and behavioural signs with PRESERVED POWER — … called delirium" },`
line, insert:

```js
      bySite: { top_of_basilar: { level: "conscious level, vertical gaze, the pupils and BOTH visual fields — cortical blindness may be denied" } },
```

(c) The same file, `"Cardiac arrest / profound global hypoperfusion": {`: immediately BELOW its `confirmatoryExtra: [...]`
line, insert:

```js
      bySite: { top_of_basilar: { level: "conscious level, vertical gaze and both visual fields — cortical blindness may be denied (Anton's)" } },
```

(d) `src/data/pathology/degenerative.js`, `"Creutzfeldt-Jakob disease (Heidenhain variant)": dz(…`: immediately BELOW
its line `    referral: "Neurology urgently with the national prion surveillance service; palliative care early",`, insert:

```js
    bySite: { top_of_basilar: { level: "the visual fields, conscious level and vertical gaze" } },
```

No existing place's text changes: every slot is keyed to the new place.

- [ ] **Step 10: The Why line for a place spanning two stations (`src/engine/why.js`, row 9)**

(a) Insert immediately ABOVE the comment line `// token -> Set of stations where ANY candidate site produces it. Built once per (dominance, sensory level),`:

```js
// A composite that spans stations (carrierStations: the top of the basilar — thalami AND occipital lobes) sits, for a
// picture, at the stations of the structures that carry what was entered; every other site sits at its one station, exactly
// as before (composite-sites round, row 9). Without this the site took its level's station, the thalamus, and Anton's
// alone read "the cerebral cortex or thalamus".
const stationOfStructure = id => { const s = STRUCTURE_BY_ID[id]; return s ? stationOf({ level: s.level, part: s.part }) : null; };
function stationsAt(site, toks, observedSet, opts) {
  if (!site.carrierStations) return [stationOf(site)];
  const read = enteredSet(observedSet);
  const ex = explain(site, opts);
  const st = new Set();
  for (const t of toks) {
    const asRead = enteredToken(t, observedSet);
    for (const x of ex) if (predictedToken(`${x.finding}@${x.bodySide}`, read) === asRead) { const k = stationOfStructure(x.structure); if (k) st.add(k); }
  }
  return st.size ? [...st].sort(byOrder) : [stationOf(site)];
}

```

(b) In `locusIndex`, replace the line `    const st = stationOf(s); if (!st) continue;` with:

```js
    const st = stationOf(s); if (!st) continue;
    // a carrierStations composite indexes each token at its carrier's station
    const at = new Map();
    if (s.carrierStations) for (const x of explain(s, opts)) { const k = stationOfStructure(x.structure); if (k) at.set(`${x.finding}@${x.bodySide}`, k); }
```

Then, in the line two below it, which begins `    for (const t0 of E) for (const t of indexTokens(t0))`, replace `.add(st);`
with `.add(at.get(t0) ?? st);`. A comment line sits between the two.

(c) In `whyChain`, replace

```js
  const pairs = [...new Set(all.map(c => `${stationOf(c.site)}|${c.site.side}`))];
  const meet = {
    stations: [...new Set(pairs.map(p => p.split("|")[0]))].sort(byOrder),
    sides: [...new Set(pairs.map(p => p.split("|")[1]))],
  };
  const verdict = !pairs.length ? "none" : meet.stations.length === 1 ? "one" : "several";
```

with

```js
  // One PLACE may span two stations (carrierStations); the verdict counts places, so it is "one" for that place alone.
  const pairs = [...new Set(all.map(c => `${stationsAt(c.site, toks, observedSet, opts).join("+")}|${c.site.side}`))];
  const places = [...new Set(pairs.map(p => p.split("|")[0]))];
  const meet = {
    stations: [...new Set(places.flatMap(p => p.split("+")))].sort(byOrder),
    sides: [...new Set(pairs.map(p => p.split("|")[1]))],
  };
  const verdict = !pairs.length ? "none" : places.length === 1 ? "one" : "several";
```

(d) In `whyClues`, in `placesOf`, replace

```js
      memo.set(key, [...new Set(fit.map(c => `${stationOf(c.site)}|${c.site.side}`))]);
```

with

```js
      memo.set(key, [...new Set(fit.map(c => `${stationsAt(c.site, toks, observedSet, opts).join("+")}|${c.site.side}`))]);
```

(e) In `whyClues`'s return, replace `meet: chain.meet, where: renderWhere(chain.meet.stations),` with:

```js
    meet: chain.meet, where: chain.verdict === "one" && chain.meet.stations.length > 1 ? chain.meet.stations.join(" and ") : renderWhere(chain.meet.stations),
```

For every other site, `places` equals the stations, so the verdict and the wording are exactly as before. `why.test`
passes unchanged (measured).

- [ ] **Step 11: Run the suite.** Expected: `57 passed, 0 failed`.

- [ ] **Step 12: Run every suite.** Expected: `exit 0` and `7420`. `pathology-next-steps` gains 8 checks (2465 → 2473):
  the new place's plans render, and the four slots differentiate.

- [ ] **Step 13: Run the audit.** Expected: `clinical audit: 1043 passed, 4 failed`. The 4 FAIL lines are bilateral VI
  + papilloedema, bilateral VI alone, and the two uncal-herniation lines: the raised-pressure round.

- [ ] **Step 14: Commit**

```bash
git add src/model/sites.js app/labels.js src/model/vascular.js src/model/topography.js src/data/syndromes.js src/data/causes.js src/data/nextSteps.js src/data/pathology/vascular.js src/data/pathology/degenerative.js src/engine/why.js test/composite-sites.test.js
git commit -m "feat(engine): the top of the basilar — one place for the basilar apex, and its Why line (rows 8-12)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: The four probes (row 15) and the audit's record

**Files:**
- Modify: `test/clinical-audit.test.js` (after the content-gap probes),
  `docs/superpowers/specs/2026-10-18-clinical-audit-suite.md` (a new last section)

- [ ] **Step 1: Add the probes**

In `test/clinical-audit.test.js`, insert immediately BELOW the line that begins
`T("Roots, plexus & nerves", "foot drop + weak arm + facial weakness, one side → a contralateral corticospinal site, one lesion"`.
If the raised-pressure round's probes follow it, insert below theirs.

```js
// owner-approved 2026-11-05 (composite-sites round, round 1, row 15): pictures the composite sites decide, which no audit
// probe covered. Each failed on 4d781bd.
T("Spinal cord", "syrinx without wasted hands: cape + spastic legs → the central cord, one lesion", "suspended_sensory@left suspended_sensory@right weak_leg@left weak_leg@right babinski@left babinski@right hyperreflexia@left hyperreflexia@right", { first: /^bilateral_cord_central$/, single: true });
T("Brainstem", "locked-in with both Babinski signs → ventral pons, one lesion", "weak_arm@left weak_arm@right weak_leg@left weak_leg@right babinski@left babinski@right preserved_vertical_gaze@none", { first: /^locked_in$/, single: true });
T("Consciousness & raised pressure", "top of the basilar entered as field loss: coma + vertical gaze palsy + a hemianopia on each side → the basilar apex, one lesion", "reduced_consciousness@none vertical_gaze_palsy@none homonymous_hemianopia@left homonymous_hemianopia@right", { first: /^top_of_basilar$/, single: true });
T("Hemispheres, thalamus & vision", "parasagittal with cortical sensory loss in both legs → both paracentral lobules, one lesion", "weak_leg@left weak_leg@right babinski@left babinski@right cortical_sensory_leg@left cortical_sensory_leg@right", { first: /^bilateral_paracentral$/, single: true });
```

- [ ] **Step 2: Run the audit**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm run test:audit 2>&1 | grep -E "^(all probes|mirror:|clinical audit:)"`
Expected:
- `all probes … 112/115`;
- `mirror: 277/277 mirror cleanly`;
- `clinical audit: 1055 passed, 4 failed (counted)`.

The harness line passes, which means every new token is one the app offers on that side.

- [ ] **Step 3: Record it in the audit spec**

Append to `docs/superpowers/specs/2026-10-18-clinical-audit-suite.md`:

```markdown
## Composite-sites round, round 1, rows 7 and 15: one regex widened, four probes added (2026-11-05)

The composite-sites round's round 1 (`2026-11-05-composite-sites-design.md`, approved as written) changed the suite twice:

- **Row 7.** `PARASAG` also admits `bilateral_paracentral`. R1 #12 asked for "a parasagittal site", and the bilateral one
  is the place it asked for. With it, both of R1 #12's checks pass. Without it, R1 #16 (passing until then) would break
  once the pontine places existed, because its top 3 would be the bilateral site, locked-in and the ARAS's basilar reading.
- **Row 15.** Four counted probes cover pictures the composite sites decide, which no probe covered. Each fails on
  `4d781bd`:

| Probe | Expected answer (approved) | Before |
|---|---|---|
| cape + spastic legs, without wasted hands | `bilateral_cord_central` first; one lesion | anterior + central cord, "Metastases" |
| quadriplegia + both Babinski + preserved vertical gaze | `locked_in` first; one lesion | anterior cord + locked-in, "MS" |
| coma + vertical gaze palsy + a hemianopia on each side | `top_of_basilar` first; one lesion | paramedian thalami + both occipital lobes, "MS" |
| both legs weak + both Babinski + cortical sensory loss in both legs | `bilateral_paracentral` first; one lesion | cord + both ACAs, "MS" |

Each probe is also mirrored, so the mirror property runs **277** checks.

**After the fix (measured on `fix/composite-sites`):** probes **112 / 115**; counted checks 1055 passed, 4 failed. The 4
are exactly the raised-pressure round. Synonym swaps 272 / 272; background 292 / 292; mirror 277 / 277.
```

- [ ] **Step 4: Commit**

```bash
git add test/clinical-audit.test.js docs/superpowers/specs/2026-10-18-clinical-audit-suite.md
git commit -m "test(audit): four probes approved in the composite-sites round 1 (row 15)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Docs, status, and a browser check

**Files:**
- Modify: `docs/artifacts/anatomy-model.html` (two column notes), `CLAUDE.md`,
  `docs/superpowers/specs/2026-11-05-composite-sites-design.md` (status), this plan (status)
- Modify, outside the repo and not committed: `Code/.claude/launch.json`

- [ ] **Step 1: The anatomy sheet's composite notes**

There are no new structures, so there are no new rows. Two column notes describe composites that changed:
- the `locked_in · ventral_pons` column header: its `terr` text `basilar — ventral pons` becomes
  `basilar — ventral pons; the locked-in site is both sides of the basis pontis + the paramedian pons's horizontal-gaze rows + this row (2026-11-05)`;
- the cord `central` column header: append
  `; its syrinx reading adds the leg corticospinal rows, offered only with the cape (2026-11-05)` after `(2026-10-22)`.

The sheet shows `ah_wasting` as an id and a finding only, so row 13's note needs no sheet edit.

- [ ] **Step 2: CLAUDE.md**

(a) In "Project state", replace `**86 test suites / 7355 assertions green**` with
`**87 test suites / 7420 assertions green**`.

(b) In "Commands", in the clinical-audit paragraph:
- replace `and 3 by the content-gap fix, 2026-11-01)` with
  `and 3 by the content-gap fix, 2026-11-01, and 4 by the composite-sites round, 2026-11-05)`;
- replace `after the content-gap fix: 101/111.` with
  `after the content-gap fix: 101/111; after the composite-sites round: 112/115.`

(c) Insert this section immediately ABOVE `## Commands`:

```markdown
## Composite sites (DONE 2026-11-05, round 1) — ✅ owner-approved rulings (all 16 rows)

The fourth fix from the 2026-10-18 clinical audit. **The defect:** one lesion spanned places the model held only
separately, so it claimed two lesions and named a disease to join them. Three cards sent the reader the wrong way:
- a basilar coma got the cord's plan (*"Spinal surgery — cord compression is time-critical"*);
- so did a parasagittal meningioma, the very mimic its own cause list warns about;
- a comatose pontine haemorrhage showed the locked-in red flag, *"the patient is fully aware"*.

**The principle (spec §3.1):** the same lesion grown larger is a READING of its site (same id, content and links, the
cord fix's idiom); a different place is a NEW SITE. Either way it is DERIVED from its source rows, never hand-listed.

**Mechanics:**
- **Locked-in re-derived** (`composeConsciousnessSites`): both sides of the basis pontis + the paramedian pons's
  horizontal-gaze rows (`PONS_GAZE`) + preserved vertical gaze.
- **Two readings:**
  - the ARAS's `basis` reading: bilateral, `station: "pons"`; coma with quadriparesis, both Babinski signs and gaze palsies;
  - the central cord's `syrinx` reading: the leg corticospinal rows, `needs: ["suspended_sensory"]`.
  `variantOf` carries a reading's `side` and `station`. `solverSites(opts, entered)` offers a `needs` reading only when its
  finding is entered.
- **Three new sites:** `bilateral_pons_mlf` (content from the medial pons); `bilateral_paracentral` (content from
  `cortex_paracentral`); `top_of_basilar` (Percheron's rows + both PCA cortical territories, its own content key
  `thalamus_arousal|basilar_apex`).
- **The Why line:** a place spanning two stations (`carrierStations`, the top of the basilar) sits where the rows carrying
  the entered findings are (`stationsAt` in why.js). So Anton's alone still reads "only the cerebral cortex".

**Rulings that are traps:**
- **The locked-in hand list went stale** — the B11 trap a fourth time. It had no Babinski, face, speech or gaze.
- **The pontine haemorrhage probe passed by accident.** Its cover needed four places, one over the limit. Re-deriving
  locked-in alone makes it a two-place claim; the basilar reading makes it one place. Ship them together.
- **R1 #12's top 3 passed only because exactly two cord sites outranked the one-sided ACA.** Any new place explaining
  "both legs + Babinski" pushes it out. The audit's PARASAG regex now admits `bilateral_paracentral` (owner's ruling on
  the yardstick, row 7).
- **The syrinx reading ungated** takes "spastic legs + a cervical level" from the anterior cord. Its gate is the cape.
- **A new id for the basilar reading** fails the audit's PONS regex (measured −2), so it stays a reading of
  `brainstem_aras`.
- **The raised-pressure round** (`fix/raised-pressure`) gates its uncal reading the same way. Whichever lands second
  reuses the first's gate.

**Measured:**
- Audit 101 → 112/115 probes (4 added by row 15). Counted checks 1034/13 → 1055/4; the 4 are the raised-pressure round.
- Swaps 272/272, background 292/292, mirror 277/277.
- `npm test`: 87 suites, 7420 assertions, no re-pins. The new suite is `test/composite-sites.test.js`.
- Frozen-input safety sample: 2 two-lesion claims become one place (both basis pontis → locked-in; both fusiform gyri +
  coma → the top of the basilar), 0 new, 21 covers move (the cover's larger-place tie-break), and no site picture
  changes its first answer.

Spec/plan: `docs/superpowers/specs/2026-11-05-composite-sites-design.md`, `docs/superpowers/plans/2026-11-05-composite-sites.md`.
```

- [ ] **Step 3: Status lines**

- In the spec, replace its first status line with: `**Status: RULED and IMPLEMENTED (2026-11-05) on
  \`fix/composite-sites\`. Round 1: every recommendation APPROVED as written.**` Then add one line with the measured
  numbers: `npm test` 87 suites / 7420 green; audit 112 / 115 probes, 1055 passed / 4 failed.
- In this plan, replace `**Status: NOT STARTED.**` with `**Status: IMPLEMENTED (2026-11-05), \`<first>..<last>\` + docs;
  every step verified.**`, filling in the commit range.

- [ ] **Step 4: A preview entry**

In `Code/.claude/launch.json` (outside the repo; do not commit), add to `configurations`:

```json
    {
      "name": "NeuroLocaliser composite worktree",
      "runtimeExecutable": "/usr/bin/env",
      "runtimeArgs": ["PORT=8142", "/Users/jaydenwearne/.local/node-v24.18.0-darwin-arm64/bin/node", "neurolocaliser-composite/app/serve.mjs"],
      "port": 8142
    }
```

- [ ] **Step 5: Drive the app**

Start the preview with `preview_start` `{ name: "NeuroLocaliser composite worktree" }`. For each picture below, enter its
findings with the exam tree's row taps and search, which is what a clinician enters, not tokens. Read the answer card
and compare it with the spec's §6.

| Picture | Expected Where / What |
|---|---|
| Both legs weak + both Babinski + urinary incontinence | Bilateral paracentral lobule; Parasagittal / falx meningioma |
| Coma + quadriparesis + both Babinski | Bilateral paramedian tegmentum (ARAS) — with the basis pontis; Top-of-the-basilar / brainstem infarct |
| The full locked-in picture | Bilateral ventral pons (basis pontis); Basilar artery occlusion; the locked-in red flag |
| INO on both sides | Bilateral medial pons; Basilar perforator infarct (no onset) |
| Cape + wasted hands + spastic legs | Bilateral central cord (reaching the corticospinal tracts); Syringomyelia (± Chiari) |
| Coma + vertical gaze palsy + cortical blindness | Bilateral thalami and occipital lobes (top of the basilar); Top-of-the-basilar embolism; Why line ending "→ only the cerebral cortex and thalamus." |
| Cortical blindness alone | Bilateral primary visual cortex; Why line "→ only the cerebral cortex." |

`read_console_messages` must show no errors. Take one screenshot of the top-of-the-basilar card for the record.

- [ ] **Step 6: Final verification**

Run `npm test` (the Task 1 Step 7 command): `exit 0`, `7420`. Run `npm run test:audit`: `1055 passed, 4 failed`.

- [ ] **Step 7: Commit**

```bash
git add docs/artifacts/anatomy-model.html CLAUDE.md docs/superpowers/specs/2026-11-05-composite-sites-design.md docs/superpowers/plans/2026-11-05-composite-sites.md
git commit -m "docs: the composite-sites round — rulings applied, measured, browser-checked

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

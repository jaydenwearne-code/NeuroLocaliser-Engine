# Parinaud / vertical gaze — dorsal midbrain (pretectal) syndrome — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the dorsal-midbrain / pretectal (Parinaud) syndrome emerge — a supranuclear vertical
gaze palsy with convergence-retraction nystagmus, lid retraction, and the already-modelled light-near
dissociation — as the union of the existing pupillary pretectum site and a new tectal vertical-gaze
site.

**Architecture:** Pure anatomy-table extension in the established shape (findings → structures → sites
→ phonebook → tests). Three new findings, three tectal structures, and one region composer that
returns two midline sites: the tectal site (vertical-gaze subset) and the Parinaud union site
(pretectum ∪ tectum). Parinaud emerges by the skull-base subset⊆superset nesting — **no new solver
mechanism**.

**Tech Stack:** Zero-dependency ES modules, Node v24. Standalone test scripts (no framework), one
`ok(label, cond)` helper per file, `process.exit(fail === 0 ? 0 : 1)`.

## Global Constraints

- **Runtime:** no Node on PATH. Prefix every command:
  `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" <cmd>`.
- **Not a git repository.** History lives in `docs/superpowers/` + the test suites, not commits.
  There are **no commit steps**; each task's checkpoint is "run the suite(s) and confirm green".
- **The golden rule:** never `if (hasX && hasY) return syndrome`. Findings come from structures
  sharing a site; names come from the `syndromes.js` phonebook keyed by emergent site id.
- **All three new findings are `@none`** (NON_LATERALISED, midline). `vertical_gaze_palsy` and
  `nystagmus_convergence_retraction` are LOCALISING; `lid_retraction` is **not**.
- **Naming collision:** `nameForSite` keys by `BY_SITE[site.id]` first, else `level_part`. Both new
  sites are `dorsal_midbrain`/`tectum`, so the union site **must** have a phonebook entry keyed by its
  exact id `parinaud_dorsal_midbrain` (Task 3).
- **TDD, red-first.** Add each test block, watch it fail, add the anatomy, watch it pass. Keep all 20
  prior suites green at every task boundary.

---

### Task 1: Findings & scoring vocabulary

**Files:**
- Modify: `src/model/findings.js` (add 3 findings + CROSSES + NON_LATERALISED)
- Modify: `src/engine/score.js:16-20` (LOCALISING — add 2 of the 3)
- Create: `test/parinaud.test.js` (harness + vocabulary block)
- Modify: `package.json` (test chain), `README.md` (suite list)

**Interfaces:**
- Produces: findings `vertical_gaze_palsy`, `nystagmus_convergence_retraction`, `lid_retraction`;
  all in `NON_LATERALISED`; first two in `LOCALISING`. Consumed by Tasks 2–3.

- [ ] **Step 1: Write the failing test** — create `test/parinaud.test.js`:

```javascript
// parinaud.test.js — the dorsal-midbrain / pretectal (Parinaud) syndrome. A supranuclear VERTICAL
// gaze palsy (+ convergence-retraction nystagmus, lid retraction) that EMERGES as the union of the
// existing pupillary pretectum site (light-near dissociation → Argyll Robertson) and a new tectal
// vertical-gaze site. Nesting (subset⊆superset), no new solver mechanism.
// Run: node test/parinaud.test.js
import { FINDINGS, CROSSES, NON_LATERALISED, isFinding } from "../src/model/findings.js";
import { LOCALISING } from "../src/engine/score.js";
import { STRUCTURES } from "../src/model/structures.js";
import { SITE_BY_ID, composeDorsalMidbrainSites } from "../src/model/sites.js";
import { expectedFindings } from "../src/engine/forward.js";
import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }

// --- Task 1: vocabulary ---
for (const id of ["vertical_gaze_palsy", "nystagmus_convergence_retraction", "lid_retraction"]) {
  ok(`${id} exists`, isFinding(id));
  ok(`${id} is NON_LATERALISED (@none)`, NON_LATERALISED.has(id));
  ok(`${id} has a CROSSES entry`, id in CROSSES);
}
ok("vertical_gaze_palsy is LOCALISING", LOCALISING.has("vertical_gaze_palsy"));
ok("nystagmus_convergence_retraction is LOCALISING", LOCALISING.has("nystagmus_convergence_retraction"));
ok("lid_retraction is NOT LOCALISING (companion sign)", !LOCALISING.has("lid_retraction"));

console.log("====================================================");
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("====================================================");
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/parinaud.test.js`
Expected: FAIL — the `import { composeDorsalMidbrainSites }` line throws
`SyntaxError: ... does not provide an export named 'composeDorsalMidbrainSites'` (added in Task 2).
That import must be present now so Task 2 needs no test edit; to see the Task-1 vocabulary assertions
fail *specifically*, temporarily comment that one import line, confirm the six vocab assertions FAIL,
then restore it. (Simplest: just accept the import error as the red state and proceed — Step 4 turns
it green once Task 2 lands. To keep Task 1 independently runnable, comment the `composeDorsalMidbrainSites`
import + its Task-2/3 uses until Task 2, or split the import as noted.)

> Practical note for the implementer: to keep Task 1 self-contained, omit `composeDorsalMidbrainSites`
> from the import line in Step 1 and add it in Task 2. The code block above lists it for the final
> file; add it when Task 2 introduces the export.

- [ ] **Step 3: Add the three findings** to `src/model/findings.js`.

After the `ino:` line (`src/model/findings.js:22`), add the two ocular-motor findings:

```javascript
  vertical_gaze_palsy: { desc: "Supranuclear vertical (esp. up-) gaze palsy (dorsal midbrain — posterior commissure / riMLF)", group: "Cranial nerve" },
  lid_retraction:      { desc: "Bilateral lid retraction (Collier's sign — dorsal midbrain)", group: "Cranial nerve" },
```

After the `nystagmus_upbeat:` line (`src/model/findings.js:129`), add the convergence-retraction type
to the nystagmus family:

```javascript
  nystagmus_convergence_retraction: { desc: "Convergence-retraction nystagmus on attempted upgaze (dorsal midbrain / pretectum)", group: "Vestibular / nystagmus" },
```

- [ ] **Step 4: Add CROSSES entries.** In the CROSSES map, alongside the nystagmus `false` entries
(`src/model/findings.js:216`) and the pupil entries (`:219`), add (value is moot — NON_LATERALISED
short-circuits to `@none`):

```javascript
  vertical_gaze_palsy: false, nystagmus_convergence_retraction: false, lid_retraction: false, // dorsal midbrain — @none
```

- [ ] **Step 5: Add to NON_LATERALISED.** Extend the set (`src/model/findings.js:272-279`). Change the
last nystagmus line to include the new type and add the two ocular-motor findings:

```javascript
  "nystagmus_peripheral","nystagmus_gaze_evoked","nystagmus_downbeat","nystagmus_upbeat", // nystagmus types — no side
  "nystagmus_convergence_retraction","vertical_gaze_palsy","lid_retraction" // dorsal midbrain / pretectal — no side
```

(Ensure the previous last entry now ends with a comma.)

- [ ] **Step 6: Add the two localisers** to `src/engine/score.js`. Append `vertical_gaze_palsy` to the
gaze/ino line (`:18`) and `nystagmus_convergence_retraction` to the nystagmus-taxonomy line (`:20`):

```javascript
  "gaze_palsy","ino","vertical_gaze_palsy","horner","limb_ataxia","face_pain_loss","tremor_rubral",
```
```javascript
  "nystagmus_peripheral","nystagmus_gaze_evoked","nystagmus_downbeat","nystagmus_upbeat","nystagmus_convergence_retraction", // nystagmus taxonomy
```

Do **not** add `lid_retraction` (companion, non-localising).

- [ ] **Step 7: Register the suite.** In `package.json`, append to the `test` script chain:
` && node test/parinaud.test.js`. In `README.md`, add a line to the suite list near the other
`node test/*.test.js` entries:

```
node test/parinaud.test.js       # dorsal midbrain / pretectal (Parinaud) — vertical gaze palsy, nesting
```

- [ ] **Step 8: Run test to verify vocabulary passes** (with `composeDorsalMidbrainSites` import still
omitted per the Step-2 note):

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/parinaud.test.js`
Expected: PASS — 12 assertions (3 findings × 3 vocab checks, plus 3 LOCALISING checks), `0 failed`.

- [ ] **Step 9: Full-suite checkpoint** (no regressions from the vocabulary additions):

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: all suites `0 failed` (new findings have no producer yet, so nothing else changes).

---

### Task 2: Tectal structures, sites & forward model

**Files:**
- Modify: `src/model/structures.js` (3 tectal structures, after the pupil pretectum `ar_lnd` block `:290`)
- Modify: `src/model/sites.js` (TERRITORY entry `:129` area; new `composeDorsalMidbrainSites()`)
- Modify: `src/engine/inverse.js:12-32` (import + register in `candidateSites()`)
- Modify: `test/parinaud.test.js` (add sites + forward block; add the `composeDorsalMidbrainSites` import)

**Interfaces:**
- Consumes: findings from Task 1.
- Produces: structures `tect_vgaze` (→ `vertical_gaze_palsy`), `tect_convret`
  (→ `nystagmus_convergence_retraction`), `tect_lid` (→ `lid_retraction`) at `level: "dorsal_midbrain",
  part: "tectum"`. Export `composeDorsalMidbrainSites()` returning two sites:
  `{ id: "dorsal_midbrain_tectum", side: "midline", level: "dorsal_midbrain", part: "tectum", structures: [tect_vgaze, tect_convret, tect_lid], composite: true }`
  and `{ id: "parinaud_dorsal_midbrain", side: "midline", level: "dorsal_midbrain", part: "tectum", structures: [ar_lnd, tect_vgaze, tect_convret, tect_lid], composite: true }`.
  Both registered in `inverse.candidateSites()`. Consumed by Task 3.

- [ ] **Step 1: Write the failing test** — append to `test/parinaud.test.js` **before** the print
block (and add `composeDorsalMidbrainSites` to the `sites.js` import line from Task 1):

```javascript
// --- Task 2: tectal structures, sites, forward ---
const DM = Object.fromEntries(composeDorsalMidbrainSites().map(s => [s.id, s]));
ok("dorsal_midbrain_tectum site exists", !!DM.dorsal_midbrain_tectum);
ok("parinaud_dorsal_midbrain site exists", !!DM.parinaud_dorsal_midbrain);
ok("tectum site side is midline", DM.dorsal_midbrain_tectum && DM.dorsal_midbrain_tectum.side === "midline");

// Parinaud site is the UNION: pretectum pupil structure + the three tectal structures.
{
  const s = DM.parinaud_dorsal_midbrain.structures;
  ok("parinaud unions the pretectum pupil structure (ar_lnd)", s.includes("ar_lnd"));
  ok("parinaud includes tect_vgaze", s.includes("tect_vgaze"));
  ok("parinaud includes tect_convret", s.includes("tect_convret"));
  ok("parinaud includes tect_lid", s.includes("tect_lid"));
}

// Forward: tectal site emits the three vertical-gaze findings @none, NOT light-near dissociation.
{
  const t = expectedFindings(DM.dorsal_midbrain_tectum);
  ok("tectum -> vertical_gaze_palsy@none", t.has("vertical_gaze_palsy@none"));
  ok("tectum -> nystagmus_convergence_retraction@none", t.has("nystagmus_convergence_retraction@none"));
  ok("tectum -> lid_retraction@none", t.has("lid_retraction@none"));
  ok("tectum does NOT emit light_near_dissociation", !t.has("light_near_dissociation@none"));
}
// Forward: Parinaud union additionally emits light-near dissociation (the full tetrad).
{
  const p = expectedFindings(DM.parinaud_dorsal_midbrain);
  ok("parinaud -> vertical_gaze_palsy@none", p.has("vertical_gaze_palsy@none"));
  ok("parinaud -> light_near_dissociation@none", p.has("light_near_dissociation@none"));
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/parinaud.test.js`
Expected: FAIL — `composeDorsalMidbrainSites is not a function` / not exported.

- [ ] **Step 3: Add the tectal structures** to `src/model/structures.js`, immediately after the
`ar_lnd` pupil pretectum structure (`src/model/structures.js:290`):

```javascript

  // ---- DORSAL MIDBRAIN / TECTUM (supranuclear vertical gaze — Parinaud) ----
  // The posterior commissure / rostral interstitial MLF (riMLF) and pretectum. A dorsal-midbrain lesion
  // (pineal tumour, tectal infarct, hydrocephalus) gives a supranuclear VERTICAL gaze palsy — distinct
  // from the CN III fascicle/nucleus (nuclear/infranuclear). Parinaud emerges as the UNION of these tectal
  // structures with the pretectal light-reflex relay (ar_lnd), the skull-base nesting pattern (see sites.js).
  { id: "tect_vgaze",   level: "dorsal_midbrain", part: "tectum", produces: "vertical_gaze_palsy",
    note: "posterior commissure / riMLF — supranuclear vertical (up-) gaze palsy (dorsal midbrain)" },
  { id: "tect_convret", level: "dorsal_midbrain", part: "tectum", produces: "nystagmus_convergence_retraction",
    note: "pretectum — convergence-retraction nystagmus on attempted upgaze" },
  { id: "tect_lid",     level: "dorsal_midbrain", part: "tectum", produces: "lid_retraction",
    note: "posterior commissure — Collier's sign (bilateral lid retraction)" },
```

- [ ] **Step 4: Add the TERRITORY entry** to `src/model/sites.js`, after the `pupil|pretectum` line
(`src/model/sites.js:129`):

```javascript
  "dorsal_midbrain|tectum": "dorsal midbrain / tectum (posterior commissure — Parinaud)",
```

- [ ] **Step 5: Add the region composer** to `src/model/sites.js`, after
`composeCentralNystagmusSites()` (`src/model/sites.js:474`):

```javascript

// DORSAL MIDBRAIN / PRETECTAL (Parinaud). Two MIDLINE sites (composer-only; level/part not in
// LEVELS/PARTS). `dorsal_midbrain_tectum` = the supranuclear vertical-gaze subset; `parinaud_dorsal_midbrain`
// = the UNION of the pretectum pupil relay (ar_lnd — light-near dissociation) and the tectal structures,
// so the full Parinaud tetrad EMERGES as one site (the skull-base subset⊆superset nesting), while an
// isolated light-near dissociation still localises to pupil_pretectum (Argyll Robertson).
export function composeDorsalMidbrainSites() {
  const tectal = STRUCTURES.filter(s => s.level === "dorsal_midbrain" && s.part === "tectum").map(s => s.id);
  if (!tectal.length) return [];
  const pretectal = STRUCTURES.filter(s => s.level === "pupil" && s.part === "pretectum").map(s => s.id);
  const territory = TERRITORY["dorsal_midbrain|tectum"];
  return [
    { id: "dorsal_midbrain_tectum", side: "midline", level: "dorsal_midbrain", part: "tectum",
      territory, structures: tectal, composite: true },
    { id: "parinaud_dorsal_midbrain", side: "midline", level: "dorsal_midbrain", part: "tectum",
      territory, structures: [...pretectal, ...tectal], composite: true }
  ];
}
```

- [ ] **Step 6: Register in the solver.** In `src/engine/inverse.js`, add
`composeDorsalMidbrainSites` to the import from `sites.js` (`src/engine/inverse.js:12-18`) and to the
concat in `candidateSites()` (`:24-32`), after `composeCentralNystagmusSites()`:

```javascript
          ...composeCentralNystagmusSites(), ...composeDorsalMidbrainSites()];
```

- [ ] **Step 7: Run test to verify it passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/parinaud.test.js`
Expected: PASS — Task 1 + Task 2 blocks all PASS, `0 failed`.

- [ ] **Step 8: Full-suite checkpoint** (the two new sites are now solver candidates — confirm no
existing input is mis-pulled to them):

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: all suites `0 failed`. (The new sites emit only the three new findings, absent from every
existing test input, so they never out-score an existing winner.)

---

### Task 3: Emergent naming & inverse emergence

**Files:**
- Modify: `src/data/syndromes.js` (2 phonebook entries)
- Modify: `test/parinaud.test.js` (inverse emergence + regression block)

**Interfaces:**
- Consumes: sites `dorsal_midbrain_tectum`, `parinaud_dorsal_midbrain` from Task 2; `nameForSite`,
  `solve` from the engine.
- Produces: phonebook names for both sites (union keyed by exact id to beat the `level_part` collision).

- [ ] **Step 1: Write the failing test** — append to `test/parinaud.test.js` before the print block:

```javascript
// --- Task 3: emergent naming + inverse emergence (the headline) ---
// Full tetrad -> the single Parinaud union site, named Parinaud.
{
  const { best } = solve(new Set([
    "vertical_gaze_palsy@none", "nystagmus_convergence_retraction@none",
    "light_near_dissociation@none", "lid_retraction@none"
  ]));
  ok("full tetrad -> parinaud_dorsal_midbrain", best && best.site.id === "parinaud_dorsal_midbrain");
  ok("parinaud_dorsal_midbrain names Parinaud", best && /parinaud/i.test(nameForSite(best.site).name));
}
// Isolated vertical gaze palsy (no pupil sign) -> the tectal subset site.
{
  const { best } = solve(new Set(["vertical_gaze_palsy@none", "nystagmus_convergence_retraction@none"]));
  ok("isolated vertical gaze -> dorsal_midbrain_tectum", best && best.site.id === "dorsal_midbrain_tectum");
  ok("dorsal_midbrain_tectum names a dorsal-midbrain vertical gaze palsy",
     best && /vertical gaze|dorsal midbrain/i.test(nameForSite(best.site).name));
}
// REGRESSION: isolated light-near dissociation still -> pupil_pretectum (Argyll Robertson), NOT stolen.
{
  const { best } = solve(new Set(["light_near_dissociation@none"]));
  ok("isolated light-near dissociation -> pupil_pretectum (unchanged)",
     best && best.site.id === "pupil_pretectum");
  ok("pupil_pretectum still names Argyll Robertson",
     best && /argyll/i.test(nameForSite(best.site).name));
}
// PARSIMONY: the full tetrad is ONE lesion, not a two-site (pretectum + tectum) cover.
{
  const { best, minimalSet } = solve(new Set([
    "vertical_gaze_palsy@none", "nystagmus_convergence_retraction@none",
    "light_near_dissociation@none", "lid_retraction@none"
  ]));
  ok("full tetrad resolves to a single site (no multifocal cover needed)",
     best && best.site.id === "parinaud_dorsal_midbrain" && (!minimalSet || minimalSet.length <= 1));
}
```

> Note: `solve()` returns `{ best, minimalSet, ... }`; `minimalSet` is only populated when the best
> single site fails to cover all localising findings. Parinaud covers all localising findings
> (`vertical_gaze_palsy`, `nystagmus_convergence_retraction`, `light_near_dissociation`), so
> `minimalSet` should be absent/short. If the returned shape differs, assert on `best.site.id` alone
> and drop the `minimalSet` clause — do not weaken the single-site assertion.

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/parinaud.test.js`
Expected: FAIL — the naming assertions fail (`nameForSite` returns the anatomical fallback
`"midline dorsal_midbrain (tectum)"`, not "Parinaud"). The site-id emergence assertions should
already PASS (sites registered in Task 2).

- [ ] **Step 3: Add the phonebook entries** to `src/data/syndromes.js`, inside `BY_SITE` (place near
the other midbrain/pupil entries; order is irrelevant — it is a lookup). The union entry **must** be
keyed by the exact site id `parinaud_dorsal_midbrain`, because both sites share `level_part`
`dorsal_midbrain_tectum` and `nameForSite` prefers an exact-id entry:

```javascript
  dorsal_midbrain_tectum: {
    name: "Dorsal-midbrain (tectal) vertical gaze palsy",
    note: "Posterior commissure / riMLF — supranuclear vertical (up-) gaze palsy without pupillary involvement.",
    ddx: ["Dorsal-midbrain infarct", "Progressive supranuclear palsy (degenerative)", "Demyelination (MS)", "Early tectal/pineal tumour"],
    red: "A supranuclear vertical gaze palsy warrants dorsal-midbrain imaging — look for a tectal lesion or early hydrocephalus."
  },
  parinaud_dorsal_midbrain: {
    name: "Parinaud syndrome (dorsal midbrain / pretectal syndrome)",
    note: "One pretectal/tectal lesion: vertical (up-) gaze palsy + convergence-retraction nystagmus + light-near dissociation ± lid retraction (Collier's sign).",
    ddx: ["Pineal / tectal tumour (compresses the tectum)", "Dorsal-midbrain infarct", "Obstructive hydrocephalus (aqueductal stenosis)", "Demyelination (MS)"],
    red: "Vertical gaze palsy + light-near dissociation, especially in a young patient — image the pineal region and ventricles; obstructive hydrocephalus is a neurosurgical emergency."
  },
```

- [ ] **Step 4: Run test to verify the full Parinaud suite passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/parinaud.test.js`
Expected: PASS — every block, `0 failed`.

- [ ] **Step 5: Full-suite checkpoint (all 21 suites green)**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: every suite `0 failed`. Aggregate assertion count rises by the parinaud suite's total; the
20 prior suites are unchanged.

- [ ] **Step 6: Update docs of record** (no git; history lives in docs):
  - `README.md`: add a short paragraph to the "Status" narrative — the dorsal midbrain / Parinaud
    now emerges (vertical gaze palsy as the tectal subset, the full tetrad as the pretectum∪tectum
    union, Argyll Robertson preserved as the pupillary subset — the skull-base nesting pattern applied
    to the tectum).
  - `CONTRIBUTING.md`: add the increment to the changelog-style narrative near the other brainstem/
    pupil entries, and note the brainstem vertical-gaze map is now complete.
  - Update the two Claude Artifacts if the workflow in `docs/artifacts/` calls for it (flow + anatomy
    sheet) — optional this increment; flag if deferred.

---

## Self-Review

**Spec coverage:**
- 3 findings (`vertical_gaze_palsy`, `nystagmus_convergence_retraction`, `lid_retraction`), NON_LATERALISED, CROSSES → Task 1 ✓
- LOCALISING: first two yes, lid no → Task 1 Step 6 ✓
- Tectal structures + `dorsal_midbrain_tectum` + `parinaud_dorsal_midbrain` union via one composer → Task 2 ✓
- Solver registration → Task 2 Step 6 ✓
- Phonebook (both, union keyed by exact id) → Task 3 Step 3 ✓
- Emergence: full tetrad → Parinaud; isolated vgaze → tectum; isolated LND → pretectum (regression); parsimony single-site → Task 3 Step 1 ✓
- New suite in `package.json` + README → Task 1 Step 7 ✓
- All 20 prior suites green → Task 1/2/3 checkpoints ✓

**Placeholder scan:** none — all code blocks are literal.

**Type consistency:** `composeDorsalMidbrainSites()` name identical across sites.js export, inverse.js
import/registration, and the test import. Structure ids `tect_vgaze` / `tect_convret` / `tect_lid` and
site ids `dorsal_midbrain_tectum` / `parinaud_dorsal_midbrain` are consistent across tasks. Finding ids
match between findings.js, score.js, structures.js `produces`, and the test assertions.

**YAGNI check:** no skew deviation, no pupil-size modelling, no PSP pathology object, no aqueduct site
(all deferred per spec).

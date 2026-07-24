# Cerebellum (as an organ) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the cerebellum as a new anatomical level so the cerebellar syndromes localise by subdivision — hemisphere (ipsilateral appendicular), vermis (midline axial), flocculonodular (vestibulocerebellar), plus a diffuse pancerebellar composite.

**Architecture:** Standard region recipe — declarative additions to `src/model/` tables (findings → structures → sites) plus two composers (midline, pancerebellar), a phonebook entry, and a TDD emergence suite. No new solver mechanism: appendicular signs reuse ipsilateral crossing; axial signs reuse `@none` (NON_LATERALISED) emission; vermis/flocculonodular reuse the cauda/conus midline-composer pattern; pancerebellar reuses the basal-ganglia bilateral-composite pattern.

**Tech Stack:** Zero-dependency ES modules, Node v24 (off PATH), no test framework (standalone assertion scripts).

## Global Constraints

- **Runtime:** no system Node. Prefix every command: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" …`.
- **Zero dependencies, no build step.** Pure ES modules. Nothing to install.
- **Not a git repository.** No git commits; each task's checkpoint is a **test run** (the new suite, plus full `npm test` at integration-sensitive points).
- **TDD, red-first.** Write the failing assertion(s), run to see them fail, then add the minimal anatomy. **All 18 existing suites must stay green** after every task.
- **The golden rule:** never write `if (hasX && hasY) return syndrome`. Syndromes emerge from structures sharing a site; `syndromes.js` is a phonebook.
- **New findings & laterality:**
  - Appendicular (hemisphere, ipsilateral): `dysmetria`, `dysdiadochokinesis`, `intention_tremor` — `CROSSES:false`, LOCALISING. (`limb_ataxia` reused, already `crosses:false` + LOCALISING.)
  - Axial / vestibulocerebellar (midline parts): `truncal_ataxia`, `ataxic_dysarthria`, `nystagmus` — added to `NON_LATERALISED` (emit `@none`), LOCALISING.
- **New level:** `cerebellum`; part `hemisphere` (lateralised) in `LEVELS`/`PARTS`; parts `vermis`/`flocculonodular`/`pancerebellar` are composer-built only (NOT in `PARTS`).

---

### Task 1: Findings vocabulary + LOCALISING + suite scaffold

**Files:**
- Modify: `src/model/findings.js` (FINDINGS + CROSSES + NON_LATERALISED)
- Modify: `src/engine/score.js` (LOCALISING)
- Create: `test/cerebellum.test.js`

**Interfaces:**
- Produces: findings `dysmetria`, `dysdiadochokinesis`, `intention_tremor`, `truncal_ataxia`, `ataxic_dysarthria`, `nystagmus`; all six in `LOCALISING`; the three axial ones in `NON_LATERALISED`.

- [ ] **Step 1: Write the failing test.** Create `test/cerebellum.test.js`:

```js
// cerebellum.test.js — the cerebellum as an ORGAN: hemisphere (ipsilateral appendicular signs), vermis
// (midline axial signs), flocculonodular lobe (vestibulocerebellar), and a diffuse pancerebellar
// composite. Until now the cerebellum was only its brainstem peduncles (SCP/MCP/ICP → limb_ataxia).
// NO new solver mechanism: appendicular = ipsilateral (crosses:false, like limb_ataxia); axial =
// NON_LATERALISED (@none); vermis/flocculonodular = midline composer (cauda/conus pattern);
// pancerebellar = bilateral composite (basal-ganglia pattern).
// Run: node test/cerebellum.test.js
import { FINDINGS, CROSSES, NON_LATERALISED, isFinding } from "../src/model/findings.js";
import { LOCALISING } from "../src/engine/score.js";
import { STRUCTURES } from "../src/model/structures.js";
import { SITE_BY_ID } from "../src/model/sites.js";
import { expectedFindings } from "../src/engine/forward.js";
import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// --- Task 1: vocabulary ---
const APPENDICULAR = ["dysmetria", "dysdiadochokinesis", "intention_tremor"];
const AXIAL = ["truncal_ataxia", "ataxic_dysarthria", "nystagmus"];
for (const id of [...APPENDICULAR, ...AXIAL]) ok(`${id} exists`, isFinding(id));
for (const id of APPENDICULAR) {
  ok(`${id} is ipsilateral (crosses:false)`, CROSSES[id] === false);
  ok(`${id} is NOT non-lateralised`, !NON_LATERALISED.has(id));
  ok(`${id} is LOCALISING`, LOCALISING.has(id));
}
for (const id of AXIAL) {
  ok(`${id} is NON_LATERALISED (@none)`, NON_LATERALISED.has(id));
  ok(`${id} is LOCALISING`, LOCALISING.has(id));
}
ok("limb_ataxia still crosses:false + LOCALISING",
   CROSSES.limb_ataxia === false && LOCALISING.has("limb_ataxia"));

// ---- report ----
console.log("\nNeuroLocaliser — CEREBELLUM tests\n" + "=".repeat(52));
for (const { label, ok: good } of log) console.log(`${good ? "PASS" : "FAIL"}  ${label}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run it to verify it fails.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cerebellum.test.js`
Expected: FAIL — `dysmetria exists` etc. fail.

- [ ] **Step 3: Add the findings.** In `src/model/findings.js`, in the "Cerebellar / connections" group (after `tremor_rubral`), add:

```js
  // Cerebellar — appendicular (hemisphere, ipsilateral) + axial/vestibulocerebellar (midline, @none)
  dysmetria:          { desc: "Dysmetria — past-pointing / inaccurate reach (cerebellar hemisphere)", group: "Cerebellar" },
  dysdiadochokinesis: { desc: "Dysdiadochokinesis — impaired rapid alternating movements (cerebellar hemisphere)", group: "Cerebellar" },
  intention_tremor:   { desc: "Intention tremor — worsens on approach to target (cerebellar hemisphere)", group: "Cerebellar" },
  truncal_ataxia:     { desc: "Truncal / gait ataxia — wide-based, titubation (cerebellar vermis)", group: "Cerebellar" },
  ataxic_dysarthria:  { desc: "Ataxic / scanning dysarthria (cerebellar)", group: "Cerebellar" },
  nystagmus:          { desc: "Nystagmus — gaze-evoked / central (cerebellar flocculonodular; NB also brainstem & peripheral vestibular — later)", group: "Cerebellar" },
```

- [ ] **Step 4: Add the CROSSES entries.** In `src/model/findings.js`, near `limb_ataxia: false`, add the appendicular three (ipsilateral). Also give the axial three a `false` entry for map completeness (moot — `NON_LATERALISED` short-circuits to `@none`):

```js
  limb_ataxia: false,      // cerebellar connections -> ipsilateral
  dysmetria: false, dysdiadochokinesis: false, intention_tremor: false, // appendicular cerebellar — ipsilateral
  truncal_ataxia: false, ataxic_dysarthria: false, nystagmus: false, // axial — NON_LATERALISED (@none); value moot
```

(If `limb_ataxia: false` already carries the `// cerebellar connections` comment on its own line, insert the two new lines directly after it.)

- [ ] **Step 5: Add the axial findings to NON_LATERALISED.** In `src/model/findings.js`, extend the `NON_LATERALISED` set:

```js
export const NON_LATERALISED = new Set([
  "aphasia_expressive","aphasia_receptive","gerstmann","motor_dysprosody","sensory_dysprosody",
  "anosognosia","constructional_apraxia","prosopagnosia","executive_dysfunction","abulia",
  "disinhibition","hallucinations","mood_change","verbal_memory_impairment",
  "nonverbal_memory_impairment","cortical_blindness","balint_syndrome",
  "truncal_ataxia","ataxic_dysarthria","nystagmus" // axial / vestibulocerebellar — no side
]);
```

- [ ] **Step 6: Add the LOCALISING entries.** In `src/engine/score.js`, add the six new findings to the `LOCALISING` set. Add a line after the existing cerebellar entry (`"gaze_palsy","ino","horner","limb_ataxia","face_pain_loss","tremor_rubral",`):

```js
  "dysmetria","dysdiadochokinesis","intention_tremor","truncal_ataxia","ataxic_dysarthria","nystagmus", // cerebellar organ
```

- [ ] **Step 7: Run to verify it passes.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cerebellum.test.js`
Expected: PASS — all vocabulary assertions green.

- [ ] **Step 8: Checkpoint — full suite still green.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: every suite PASS, `0 failed`. (`cerebellum.test.js` is not in the chain yet — run it directly.)

---

### Task 2: Structures — three cerebellar parts

**Files:**
- Modify: `src/model/structures.js` (add cerebellum block)
- Modify: `test/cerebellum.test.js` (append structure assertions)

**Interfaces:**
- Consumes: findings from Task 1.
- Produces: cerebellum structures at `level: "cerebellum"` — `cb_hemi_ataxia`/`cb_hemi_dysmetria`/`cb_hemi_ddk`/`cb_hemi_tremor` (part `hemisphere`), `cb_vermis_truncal`/`cb_vermis_dysarthria` (part `vermis`), `cb_flocc_nystagmus` (part `flocculonodular`).

- [ ] **Step 1: Write the failing test.** In `test/cerebellum.test.js`, insert before the report block:

```js
// --- Task 2: structures (one structure = one finding) ---
const cbOf = (part) => STRUCTURES.filter(s => s.level === "cerebellum" && s.part === part)
  .map(s => s.produces).sort();
ok("hemisphere -> limb_ataxia + dysmetria + dysdiadochokinesis + intention_tremor",
   eq(cbOf("hemisphere"), ["dysdiadochokinesis", "dysmetria", "intention_tremor", "limb_ataxia"]));
ok("vermis -> truncal_ataxia + ataxic_dysarthria",
   eq(cbOf("vermis"), ["ataxic_dysarthria", "truncal_ataxia"]));
ok("flocculonodular -> nystagmus", eq(cbOf("flocculonodular"), ["nystagmus"]));
ok("no cerebellum structure sets a crosses override (appendicular inherit false; axial are NON_LATERALISED)",
   STRUCTURES.filter(s => s.level === "cerebellum")
     .every(s => !Object.prototype.hasOwnProperty.call(s, "crosses")));
```

- [ ] **Step 2: Run to verify it fails.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cerebellum.test.js`
Expected: FAIL — `hemisphere -> …` empty.

- [ ] **Step 3: Add the cerebellum structure block.** In `src/model/structures.js`, add a new block (place it after the BASAL GANGLIA block, before the VISUAL PATHWAY block):

```js
  // ---- CEREBELLUM (the organ; distinct from its brainstem peduncles) ----
  // Hemisphere = IPSILATERAL appendicular signs (no crosses override — limb_ataxia & companions inherit
  // CROSSES:false). Vermis & flocculonodular = MIDLINE axial/vestibulocerebellar signs, all
  // NON_LATERALISED (@none). Sites: hemisphere via buildSites (lateralised); vermis + flocculonodular via
  // composeCerebellumMidlineSites; a diffuse pancerebellar composite via composeCerebellumPancerebellarSites.
  { id: "cb_hemi_ataxia",    level: "cerebellum", part: "hemisphere", produces: "limb_ataxia",
    note: "cerebellar hemisphere — ipsilateral limb ataxia" },
  { id: "cb_hemi_dysmetria", level: "cerebellum", part: "hemisphere", produces: "dysmetria",
    note: "cerebellar hemisphere — ipsilateral dysmetria (past-pointing)" },
  { id: "cb_hemi_ddk",       level: "cerebellum", part: "hemisphere", produces: "dysdiadochokinesis",
    note: "cerebellar hemisphere — ipsilateral dysdiadochokinesis" },
  { id: "cb_hemi_tremor",    level: "cerebellum", part: "hemisphere", produces: "intention_tremor",
    note: "cerebellar hemisphere — ipsilateral intention tremor" },
  { id: "cb_vermis_truncal",   level: "cerebellum", part: "vermis", produces: "truncal_ataxia",
    note: "cerebellar vermis — truncal / gait ataxia (axial, midline)" },
  { id: "cb_vermis_dysarthria",level: "cerebellum", part: "vermis", produces: "ataxic_dysarthria",
    note: "cerebellar vermis (paravermal) — ataxic / scanning dysarthria" },
  { id: "cb_flocc_nystagmus",  level: "cerebellum", part: "flocculonodular", produces: "nystagmus",
    note: "flocculonodular lobe (vestibulocerebellum) — nystagmus" },
```

- [ ] **Step 4: Run to verify it passes.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cerebellum.test.js`
Expected: PASS for Task 1–2 assertions.

- [ ] **Step 5: Checkpoint — full suite still green.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: all suites PASS, `0 failed`. (Structures exist but no `cerebellum` sites are built yet — no candidate emits them, so no regression. `cerebellum.test.js` still run directly.)

---

### Task 3: Hemisphere focal sites (lateralised)

**Files:**
- Modify: `src/model/sites.js` (`LEVELS`, `PARTS`, `TERRITORY`)
- Modify: `test/cerebellum.test.js` (append hemisphere site + forward assertions)

**Interfaces:**
- Consumes: structures from Task 2.
- Produces: focal sites `left_cerebellum_hemisphere` / `right_cerebellum_hemisphere` (built by `buildSites`).

- [ ] **Step 1: Write the failing test.** In `test/cerebellum.test.js`, insert before the report block:

```js
// --- Task 3: hemisphere focal (left/right) sites, ipsilateral appendicular emission ---
ok("left_cerebellum_hemisphere exists", !!SITE_BY_ID.left_cerebellum_hemisphere);
ok("right_cerebellum_hemisphere exists", !!SITE_BY_ID.right_cerebellum_hemisphere);
{
  const h = expectedFindings(SITE_BY_ID.left_cerebellum_hemisphere);
  ok("left hemisphere -> limb_ataxia@left (ipsi)", h.has("limb_ataxia@left"));
  ok("left hemisphere -> dysmetria@left (ipsi)", h.has("dysmetria@left"));
  ok("left hemisphere -> dysdiadochokinesis@left (ipsi)", h.has("dysdiadochokinesis@left"));
  ok("left hemisphere -> intention_tremor@left (ipsi)", h.has("intention_tremor@left"));
  ok("left hemisphere emits NOTHING on the right", ![...h].some(t => t.endsWith("@right")));
}
```

- [ ] **Step 2: Run to verify it fails.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cerebellum.test.js`
Expected: FAIL — `left_cerebellum_hemisphere` undefined (crashes on `expectedFindings(undefined)`; confirm via `2>&1 | tail`).

- [ ] **Step 3: Register the level.** In `src/model/sites.js`, add `"cerebellum"` to `LEVELS` (after `"basal_ganglia"`):

```js
const LEVELS = ["midbrain", "pons", "medulla", "cord", "cortex", "subcortex", "basal_ganglia", "cerebellum", "skull_base", "root", "nerve", "visual_pathway", "pupil", "sympathetic"];
```

- [ ] **Step 4: Register the hemisphere part.** In `src/model/sites.js`, in `PARTS`, add `"hemisphere"` (on the basal-ganglia/deep line — only `hemisphere` is lateralised; vermis/flocculonodular/pancerebellar are composer-built and must NOT be here):

```js
  "substantia_nigra", "striatum", "globus_pallidus",
  "hemisphere",
```

- [ ] **Step 5: Add the TERRITORY entries.** In `src/model/sites.js`, in `TERRITORY`, add all four cerebellar keys (hemisphere used now; the other three used by the composers in Task 4–5):

```js
  "cerebellum|hemisphere":      "SCA / PICA (cerebellar hemisphere)",
  "cerebellum|vermis":          "SCA (superior) / PICA (inferior) vermis",
  "cerebellum|flocculonodular": "PICA / AICA (flocculonodular lobe)",
  "cerebellum|pancerebellar":   "diffuse / whole cerebellum",
```

- [ ] **Step 6: Run to verify it passes.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cerebellum.test.js`
Expected: PASS for Task 1–3 assertions.

- [ ] **Step 7: Checkpoint — full suite still green (peduncle regression watch).**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: all 18 suites PASS, `0 failed`. **Specifically confirm the brainstem, cranial-nerves, and any `limb_ataxia` suites are unchanged** — the cerebellar hemisphere now competes for `limb_ataxia`, but it also emits 3 appendicular companions, so a Wallenberg/CPA/brainstem picture (which lacks them) makes the hemisphere over-predict and lose. If any assertion flips, STOP and report (do not patch silently).

---

### Task 4: Midline + pancerebellar composers

**Files:**
- Modify: `src/model/sites.js` (add `composeCerebellumMidlineSites`, `composeCerebellumPancerebellarSites`)
- Modify: `src/engine/inverse.js` (import + register both in `candidateSites`)
- Modify: `test/cerebellum.test.js` (append composer-site + forward assertions)

**Interfaces:**
- Consumes: structures/sites from Tasks 2–3.
- Produces: `composeCerebellumMidlineSites()` → `cerebellum_vermis` / `cerebellum_flocculonodular` (side `"midline"`); `composeCerebellumPancerebellarSites()` → `cerebellum_pancerebellar` (side `"bilateral"`, unions all cerebellum structures).

- [ ] **Step 1: Add the composer import + write the failing test.** In `test/cerebellum.test.js`, change the sites import and append the assertions.

Change the import line to:

```js
import { SITE_BY_ID, composeCerebellumMidlineSites, composeCerebellumPancerebellarSites } from "../src/model/sites.js";
```

Insert before the report block:

```js
// --- Task 4: midline (vermis / flocculonodular) + pancerebellar composites ---
// Composite sites are only in candidateSites(), not SITE_BY_ID — look them up via the composers.
const CB_MID = Object.fromEntries(composeCerebellumMidlineSites().map(s => [s.id, s]));
const CB_PAN = Object.fromEntries(composeCerebellumPancerebellarSites().map(s => [s.id, s]));
ok("cerebellum_vermis exists (midline)",
   CB_MID.cerebellum_vermis && CB_MID.cerebellum_vermis.side === "midline");
ok("cerebellum_flocculonodular exists (midline)",
   CB_MID.cerebellum_flocculonodular && CB_MID.cerebellum_flocculonodular.side === "midline");
ok("cerebellum_pancerebellar exists (bilateral)",
   CB_PAN.cerebellum_pancerebellar && CB_PAN.cerebellum_pancerebellar.side === "bilateral");
{
  const v = expectedFindings(CB_MID.cerebellum_vermis);
  ok("vermis -> truncal_ataxia@none", v.has("truncal_ataxia@none"));
  ok("vermis -> ataxic_dysarthria@none", v.has("ataxic_dysarthria@none"));
  const f = expectedFindings(CB_MID.cerebellum_flocculonodular);
  ok("flocculonodular -> nystagmus@none", f.has("nystagmus@none"));
  const p = expectedFindings(CB_PAN.cerebellum_pancerebellar);
  ok("pancerebellar -> limb_ataxia@left AND @right", p.has("limb_ataxia@left") && p.has("limb_ataxia@right"));
  ok("pancerebellar -> dysmetria@left AND @right", p.has("dysmetria@left") && p.has("dysmetria@right"));
  ok("pancerebellar -> truncal_ataxia@none (axial stays @none, NOT @left)",
     p.has("truncal_ataxia@none") && !p.has("truncal_ataxia@left"));
  ok("pancerebellar -> nystagmus@none", p.has("nystagmus@none"));
}
```

- [ ] **Step 2: Run to verify it fails.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cerebellum.test.js`
Expected: FAIL — `SyntaxError … does not provide an export named 'composeCerebellumMidlineSites'`.

- [ ] **Step 3: Add the midline composer.** In `src/model/sites.js`, add after `composeCaudaConusSites` (or near the other midline/bilateral composers):

```js
// CEREBELLUM MIDLINE SITES. Vermis + flocculonodular are MIDLINE (side "midline", cauda/conus pattern);
// their findings are NON_LATERALISED so they emit @none regardless — the midline side is bookkeeping.
// Not in PARTS, so buildSites never makes left/right copies.
export function composeCerebellumMidlineSites() {
  const build = (id, part) => {
    const structures = STRUCTURES.filter(s => s.level === "cerebellum" && s.part === part).map(s => s.id);
    return structures.length ? [{ id, side: "midline", level: "cerebellum", part,
      territory: TERRITORY[`cerebellum|${part}`], structures, composite: true }] : [];
  };
  return [ ...build("cerebellum_vermis", "vermis"),
           ...build("cerebellum_flocculonodular", "flocculonodular") ];
}

// CEREBELLUM PANCEREBELLAR SITE. The diffuse degenerations (paraneoplastic, toxic, alcoholic, hereditary
// SCA): one BILATERAL composite unioning ALL cerebellum structures. Appendicular findings emit @left+@right;
// axial findings are NON_LATERALISED so they emit @none — the full diffuse picture.
export function composeCerebellumPancerebellarSites() {
  const structures = STRUCTURES.filter(s => s.level === "cerebellum").map(s => s.id);
  if (structures.length === 0) return [];
  return [{ id: "cerebellum_pancerebellar", side: "bilateral", level: "cerebellum",
    part: "pancerebellar", territory: TERRITORY["cerebellum|pancerebellar"], structures, composite: true }];
}
```

- [ ] **Step 4: Register both composers.** In `src/engine/inverse.js`, add them to the `../model/sites.js` import and to the `candidateSites()` return array:

```js
import { SITES, composeHemiLevelSites, composeBilateralCordSites, composeCaudaConusSites,
         composeVascularCortexSites, composeBilateralCortexSites, composeDeepVascularSites,
         composeSkullBaseSites, composeMotorUnitSites, composePolyneuropathySites,
         composePlexusSites, composeVisualPathwaySites, composePupilPretectumSites,
         composePancoastSites, composeBasalGangliaBilateralSites,
         composeCerebellumMidlineSites, composeCerebellumPancerebellarSites } from "../model/sites.js";
```

```js
function candidateSites() {
  return [...SITES, ...composeHemiLevelSites(), ...composeBilateralCordSites(),
          ...composeCaudaConusSites(), ...composeVascularCortexSites(), ...composeBilateralCortexSites(),
          ...composeDeepVascularSites(), ...composeSkullBaseSites(), ...composeMotorUnitSites(),
          ...composePolyneuropathySites(), ...composePlexusSites(), ...composeVisualPathwaySites(),
          ...composePupilPretectumSites(), ...composePancoastSites(),
          ...composeBasalGangliaBilateralSites(),
          ...composeCerebellumMidlineSites(), ...composeCerebellumPancerebellarSites()];
}
```

- [ ] **Step 5: Run to verify it passes.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cerebellum.test.js`
Expected: PASS for Task 1–4 assertions.

- [ ] **Step 6: Checkpoint — full suite still green.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: all 18 suites PASS, `0 failed`. (New composer sites emit only cerebellar findings, so they can't win any existing test.)

---

### Task 5: Phonebook naming + inverse emergence

**Files:**
- Modify: `src/data/syndromes.js` (add four cerebellum entries)
- Modify: `test/cerebellum.test.js` (append emergence + naming assertions)

**Interfaces:**
- Consumes: sites from Tasks 3–4; `solve` / `nameForSite`.
- Produces: phonebook keys `cerebellum_hemisphere`, `cerebellum_vermis`, `cerebellum_flocculonodular`, `cerebellum_pancerebellar`.

- [ ] **Step 1: Write the failing test.** In `test/cerebellum.test.js`, insert before the report block:

```js
// --- Task 5: inverse emergence + naming ---
const bilat = (...ids) => new Set(ids.flatMap(f => [`${f}@left`, `${f}@right`]));
{
  const { best } = solve(new Set(["limb_ataxia@left", "dysmetria@left", "dysdiadochokinesis@left", "intention_tremor@left"]));
  ok("pure appendicular -> left_cerebellum_hemisphere",
     best && best.site.id === "left_cerebellum_hemisphere");
  ok("hemisphere names a cerebellar hemisphere syndrome",
     best && /cerebellar hemisphere/i.test(nameForSite(best.site).name));
}
{
  const { best } = solve(new Set(["truncal_ataxia@none", "ataxic_dysarthria@none"]));
  ok("truncal + dysarthria -> cerebellum_vermis", best && best.site.id === "cerebellum_vermis");
  ok("vermis names a vermis syndrome", best && /vermis/i.test(nameForSite(best.site).name));
}
{
  const { best } = solve(new Set(["nystagmus@none"]));
  ok("nystagmus -> cerebellum_flocculonodular", best && best.site.id === "cerebellum_flocculonodular");
  ok("flocculonodular names a flocculonodular syndrome",
     best && /flocculonodular/i.test(nameForSite(best.site).name));
}
{
  const set = bilat("limb_ataxia", "dysmetria", "dysdiadochokinesis", "intention_tremor");
  set.add("truncal_ataxia@none"); set.add("ataxic_dysarthria@none"); set.add("nystagmus@none");
  const { best } = solve(set);
  ok("full diffuse set -> cerebellum_pancerebellar", best && best.site.id === "cerebellum_pancerebellar");
  ok("pancerebellar names a pancerebellar syndrome",
     best && /pancerebellar/i.test(nameForSite(best.site).name));
}
```

- [ ] **Step 2: Run to verify it fails.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cerebellum.test.js`
Expected: FAIL — the site-id assertions PASS (solver localises without the phonebook), the `name` regexes FAIL (fall back to plain anatomical strings).

- [ ] **Step 3: Add the phonebook entries.** In `src/data/syndromes.js`, add (near the basal-ganglia block or with the other deep/posterior-fossa entries):

```js
  // ---- CEREBELLUM (the organ). Hemisphere is side-agnostic (a plain entry; the level_part fallback
  // resolves left/right); vermis, flocculonodular and pancerebellar key on their exact composite site id.
  cerebellum_hemisphere: {
    name: "Cerebellar hemisphere syndrome",
    note: "Ipsilateral appendicular ataxia: limb dysmetria, dysdiadochokinesis, intention tremor (and gait veering toward the lesion). The lateralised, limb-predominant cerebellar picture.",
    ddx: ["Cerebellar infarct (PICA / SCA)", "Haemorrhage", "Tumour / metastasis", "Multiple sclerosis", "Abscess"],
    red: "A space-occupying posterior-fossa lesion can cause brainstem compression and obstructive hydrocephalus — a neurosurgical emergency; image urgently."
  },
  cerebellum_vermis: {
    name: "Cerebellar vermis syndrome",
    note: "Midline axial ataxia: wide-based truncal / gait ataxia with titubation and ataxic (scanning) dysarthria, with the limbs relatively spared.",
    ddx: ["Medulloblastoma (children)", "Alcoholic cerebellar degeneration (superior vermis → gait)", "ADEM / post-infectious cerebellitis", "Vermian infarct"],
    red: "Truncal ataxia with headache and vomiting in a child suggests a midline posterior-fossa tumour — image and refer."
  },
  cerebellum_flocculonodular: {
    name: "Flocculonodular (vestibulocerebellar) syndrome",
    note: "Nystagmus, vertigo and gait imbalance from a flocculonodular / vestibulocerebellar lesion, often with the limbs and speech spared.",
    ddx: ["Medulloblastoma / ependymoma (children)", "Vestibulocerebellar infarct", "Demyelination"],
    red: "New central (gaze-evoked, direction-changing) nystagmus with imbalance warrants posterior-fossa imaging."
  },
  cerebellum_pancerebellar: {
    name: "Pancerebellar syndrome (diffuse)",
    note: "Diffuse cerebellar dysfunction: bilateral limb ataxia with truncal ataxia, ataxic dysarthria and nystagmus together — the whole-cerebellum picture.",
    ddx: ["Paraneoplastic cerebellar degeneration", "Toxic (phenytoin, lithium, alcohol)", "Hereditary ataxia (SCA / Friedreich)", "Hypothyroidism", "Post-infectious"],
    red: "A subacute pancerebellar syndrome can be paraneoplastic — screen for an occult malignancy (anti-Yo/Hu/Tr) alongside imaging."
  },
```

- [ ] **Step 4: Run to verify it passes.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cerebellum.test.js`
Expected: PASS — all emergence + naming assertions green.

---

### Task 6: Wire suite into chain + full regression

**Files:**
- Modify: `package.json` (`test` script)
- Modify: `README.md` (test-chain listing)

**Interfaces:**
- Consumes: everything from Tasks 1–5.
- Produces: a green full suite of **19** files with `cerebellum.test.js` in the chain.

- [ ] **Step 1: Add the suite to package.json.** In `package.json`, append `cerebellum.test.js` to the `test` script chain (after `basal-ganglia.test.js`):

```json
    "test": "node test/engine.test.js && node test/cord.test.js && node test/sensory-level.test.js && node test/central-cord.test.js && node test/cauda-conus.test.js && node test/cortex.test.js && node test/subcortex.test.js && node test/cranial-nerves.test.js && node test/motor-unit.test.js && node test/pns.test.js && node test/pns-nerves.test.js && node test/reflexes.test.js && node test/tone.test.js && node test/nerve-segments.test.js && node test/visual-pathway.test.js && node test/pupil-efferent.test.js && node test/horner-axis.test.js && node test/basal-ganglia.test.js && node test/cerebellum.test.js"
```

- [ ] **Step 2: Add the suite to the README listing.** In `README.md`, add a line after the `basal-ganglia.test.js` line:

```
node test/cerebellum.test.js     # cerebellum organ (hemisphere/vermis/flocculonodular + pancerebellar)
```

- [ ] **Step 3: Full regression checkpoint.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: all 19 suites PASS, `0 failed` on every line. Confirm no prior suite dropped or shifted assertions (especially the brainstem/CPA `limb_ataxia` winners — the peduncle regression watch).

---

### Task 7: Sync the anatomy artifact

**Files:**
- Modify: `docs/artifacts/anatomy-model.html` (add a Cerebellum region block)

**Interfaces:** none (documentation sync per CLAUDE.md).

- [ ] **Step 1: Locate an insertion point.** The cerebellum is posterior-fossa; place its block after the Basal ganglia block (mirroring the source-tree order) or wherever posterior-fossa/deep regions sit.

Run: `grep -n "Basal ganglia\|Cranial nerves / skull base" docs/artifacts/anatomy-model.html`
Expected: the region-title lines that bracket the insertion point.

- [ ] **Step 2: Add a Cerebellum region block.** Modelled on the Basal ganglia block markup (copy a sibling block's exact tag nesting and class names — `region-title`/`level`/`level-head`/`cols flow`/`col`/`col-h`/`p`/`terr`/`rows`/`row`/`badge`/`m`/`id`/`fn`). Four columns:
  - `hemisphere` (badge `bi` IPSI): `cb_hemi_ataxia` limb ataxia · `cb_hemi_dysmetria` dysmetria · `cb_hemi_ddk` dysdiadochokinesis · `cb_hemi_tremor` intention tremor
  - `vermis` (badge — use the MIDLINE/NONE style used elsewhere, e.g. the cauda/conus midline badge): `cb_vermis_truncal` truncal/gait ataxia · `cb_vermis_dysarthria` ataxic dysarthria
  - `flocculonodular` (same midline/none style): `cb_flocc_nystagmus` nystagmus
  Region note: "the organ, distinct from its brainstem peduncles · appendicular = ipsilateral hemisphere · axial = midline vermis/flocculonodular · no new mechanism".
  (Check how an existing `@none`/midline finding is badged in the sheet — reuse that badge class rather than inventing one.)

- [ ] **Step 3: Add the pancerebellar composite to the compose-grid strip.** In the composite summary section (the `cmp`/`cid`/`cd` grid), add a line near the basal-ganglia composites:

```html
        <div class="cmp"><div class="cid">cerebellum_vermis · flocculonodular (midline)</div><div class="cd">Midline cerebellum → truncal/gait ataxia · dysarthria · nystagmus (axial, no side)</div></div>
        <div class="cmp"><div class="cid">cerebellum_pancerebellar (bilateral)</div><div class="cd">Whole cerebellum → bilateral limb ataxia + truncal + nystagmus (paraneoplastic / toxic / SCA)</div></div>
```

- [ ] **Step 4: Verify the artifact is well-formed.** Confirm `<div>` balance and that all referenced ids exist in `structures.js`:

Run: `cd docs/artifacts && OPEN=$(grep -oE "<div" anatomy-model.html | wc -l); CLOSE=$(grep -oE "</div>" anatomy-model.html | wc -l); echo "open=$OPEN close=$CLOSE"`
Expected: `open` == `close`. (The in-app browser can't render `file://`; static tag-balance + id check is the verification, then the user eyeballs. Republishing to the live URL is a manual follow-up.)

- [ ] **Step 5: Final full-suite confirmation.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: all 19 suites PASS, `0 failed`.

---

## Self-review notes

- **Spec coverage:** level + 3 parts (T2–3), 6 findings with the appendicular/axial split (T1), hemisphere focal sites (T3), midline + pancerebellar composers (T4), all-localising scoring (T1), phonebook naming (T5), suite wiring + peduncle regression watch (T3 Step 7, T6 Step 3), artifact sync (T7). All spec sections map to a task.
- **Axial `@none` handling** is asserted directly (T4: `truncal_ataxia@none` present, `truncal_ataxia@left` absent even on the bilateral pancerebellar site).
- **Composite sites are not in `SITE_BY_ID`** — T4 looks them up via the composers.
- **Type/name consistency:** `composeCerebellumMidlineSites` / `composeCerebellumPancerebellarSites` used identically in sites.js, inverse.js, and the test; site ids `left/right_cerebellum_hemisphere` (focal) vs `cerebellum_vermis` / `cerebellum_flocculonodular` / `cerebellum_pancerebellar` (composite) are distinct; phonebook keys match the `level_part` (hemisphere) and exact ids (composites).
- **Regression risk (called out for the executor):** the cerebellar hemisphere newly competes for `limb_ataxia`; T3 Step 7 and T6 Step 3 gate on the existing brainstem/CPA winners being unchanged.

# Basal ganglia & movement disorders — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the basal ganglia as a new anatomical level so parkinsonism (substantia nigra), chorea (striatum), and dystonia (globus pallidus) localise — alongside the relocated hemiballismus (subthalamic nucleus) — and complete the tone axis with extrapyramidal `rigidity`.

**Architecture:** Follows the engine's standard region recipe — declarative additions to the `src/model/` tables (findings → structures → sites) plus one bilateral composer, a phonebook entry, and a TDD emergence suite. No new solver mechanism: movement findings are contralateral (above all decussations) exactly like the existing `hemiballismus`/`tremor_rubral`; the bilateral degenerative presentation reuses the `composeMotorUnitSites` bilateral-site pattern; the hemi-vs-disease naming reuses the existing `nameForSite` variant mechanism.

**Tech Stack:** Zero-dependency ES modules, Node v24 (off PATH), no test framework (standalone assertion scripts).

## Global Constraints

- **Runtime:** no system Node. Prefix every command: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" …` (npm's shebang is `#!/usr/bin/env node`).
- **Zero dependencies, no build step.** Pure ES modules (`"type": "module"`). Nothing to install.
- **Not a git repository.** There are no git commits. Each task's checkpoint is a **test run** (the new suite, plus the full `npm test` at integration-sensitive points). History lives in this plan + the test suites, per CLAUDE.md.
- **TDD, red-first.** Every task writes the failing assertion(s), runs to see them fail, then adds the minimal anatomy to pass. **All 17 existing suites must stay green** after every task.
- **The golden rule:** never write `if (hasX && hasY) return syndrome`. Syndromes emerge from structures sharing a site; `syndromes.js` is a phonebook, not logic.
- **New findings:** `parkinsonism`, `chorea`, `dystonia` (LOCALISING, contralateral); `rigidity` (non-localising tone-axis companion, contralateral). All `crosses: true` via the finding-level `CROSSES` map — structures do **not** set a per-structure `crosses` override (they inherit, like every subcortex structure).
- **New level:** `basal_ganglia`, parts `substantia_nigra` / `striatum` / `globus_pallidus` / `subthalamic` (STN relocated here from `subcortex`).

---

### Task 1: Findings vocabulary + LOCALISING + suite scaffold

**Files:**
- Modify: `src/model/findings.js` (FINDINGS catalogue + CROSSES map)
- Modify: `src/engine/score.js` (LOCALISING set)
- Create: `test/basal-ganglia.test.js`

**Interfaces:**
- Produces: findings `parkinsonism`, `chorea`, `dystonia`, `rigidity` (ids used by all later tasks); `parkinsonism`/`chorea`/`dystonia` present in `LOCALISING`.

- [ ] **Step 1: Write the failing test.** Create `test/basal-ganglia.test.js`:

```js
// basal-ganglia.test.js — the basal ganglia region: substantia nigra (parkinsonism), striatum
// (chorea), globus pallidus (dystonia), and the RELOCATED subthalamic nucleus (hemiballismus).
// Adds NO new forward-model mechanism: movement findings are contralateral (above all decussations),
// the bilateral degenerative picture reuses the motor-unit bilateral-site pattern, and the
// hemi-vs-disease naming reuses the nameForSite variant mechanism. `rigidity` completes the tone axis
// (spasticity=UMN / hypotonia=LMN / rigidity=extrapyramidal).
// Run: node test/basal-ganglia.test.js
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
for (const id of ["parkinsonism", "chorea", "dystonia", "rigidity"])
  ok(`${id} exists`, isFinding(id));
ok("parkinsonism crosses (contra)", CROSSES.parkinsonism === true);
ok("chorea crosses (contra)", CROSSES.chorea === true);
ok("dystonia crosses (contra)", CROSSES.dystonia === true);
ok("rigidity crosses (contra)", CROSSES.rigidity === true);
for (const id of ["parkinsonism", "chorea", "dystonia", "rigidity"])
  ok(`${id} is NOT non-lateralised`, !NON_LATERALISED.has(id));
ok("parkinsonism is LOCALISING", LOCALISING.has("parkinsonism"));
ok("chorea is LOCALISING", LOCALISING.has("chorea"));
ok("dystonia is LOCALISING", LOCALISING.has("dystonia"));
ok("rigidity is NOT localising (tone-axis companion, like spasticity/hypotonia)",
   !LOCALISING.has("rigidity"));
ok("tone axis is complete: spasticity + hypotonia + rigidity all exist",
   isFinding("spasticity") && isFinding("hypotonia") && isFinding("rigidity"));

// ---- report ----
console.log("\nNeuroLocaliser — BASAL GANGLIA tests\n" + "=".repeat(52));
for (const { label, ok: good } of log) console.log(`${good ? "PASS" : "FAIL"}  ${label}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run it to verify it fails.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/basal-ganglia.test.js`
Expected: FAIL — `parkinsonism exists` etc. fail (findings not defined yet).

- [ ] **Step 3: Add the findings.** In `src/model/findings.js`, add to the `FINDINGS` object (place after the existing "Cerebellar / connections" group, around the `tremor_rubral` line):

```js
  // Basal ganglia / movement disorders (extrapyramidal; contralateral to a focal nucleus lesion)
  parkinsonism:   { desc: "Parkinsonism — bradykinesia, rest tremor, rigidity (substantia nigra / nigrostriatal)", group: "Basal ganglia / movement" },
  chorea:         { desc: "Chorea — brief, irregular, dance-like involuntary movements (striatum)", group: "Basal ganglia / movement" },
  dystonia:       { desc: "Dystonia — sustained co-contraction / abnormal posturing (globus pallidus)", group: "Basal ganglia / movement" },
  rigidity:       { desc: "Rigidity — increased tone, uniform through range (lead-pipe / cogwheel; extrapyramidal — the third tone type)", group: "Tone / wasting" },
```

- [ ] **Step 4: Re-group hemiballismus.** In `src/model/findings.js`, change the existing `hemiballismus` group from `"Subcortical"` to `"Basal ganglia / movement"`:

```js
  hemiballismus:  { desc: "Contralateral hemiballismus / violent proximal flinging (subthalamic nucleus)", group: "Basal ganglia / movement" },
```

- [ ] **Step 5: Add the CROSSES entries.** In `src/model/findings.js`, in the `CROSSES` map, add (near the `tremor_rubral: true` line):

```js
  parkinsonism: true, chorea: true, dystonia: true, rigidity: true, // basal ganglia — contralateral to a focal nucleus lesion
```

- [ ] **Step 6: Add the LOCALISING entries.** In `src/engine/score.js`, add the three movement findings to the `LOCALISING` set (on the line with `"thalamic_pain","hemiballismus",`):

```js
  "thalamic_pain","hemiballismus","parkinsonism","chorea","dystonia",
```

- [ ] **Step 7: Run to verify it passes.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/basal-ganglia.test.js`
Expected: PASS — all vocabulary assertions green.

- [ ] **Step 8: Checkpoint — full suite still green.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: every suite PASS, `0 failed` throughout. (`basal-ganglia.test.js` is not in the chain yet — that is Task 6; run it directly.)

---

### Task 2: Structures — add three nuclei + relocate STN

**Files:**
- Modify: `src/model/structures.js` (add basal-ganglia block; move `stn` level)
- Modify: `test/basal-ganglia.test.js` (append structure + forward assertions)

**Interfaces:**
- Consumes: findings from Task 1.
- Produces: structures `snc_park`, `snc_rigid`, `striatum_chorea`, `gp_dystonia` at `level: "basal_ganglia"`; the existing `stn` structure moved to `level: "basal_ganglia"` (part `subthalamic` unchanged).

- [ ] **Step 1: Write the failing test.** In `test/basal-ganglia.test.js`, insert before the `// ---- report ----` block:

```js
// --- Task 2: structures (one structure = one finding) ---
const bgOf = (part) => STRUCTURES.filter(s => s.level === "basal_ganglia" && s.part === part)
  .map(s => s.produces).sort();
ok("substantia_nigra -> parkinsonism + rigidity", eq(bgOf("substantia_nigra"), ["parkinsonism", "rigidity"]));
ok("striatum -> chorea", eq(bgOf("striatum"), ["chorea"]));
ok("globus_pallidus -> dystonia", eq(bgOf("globus_pallidus"), ["dystonia"]));
ok("subthalamic -> hemiballismus (relocated to basal_ganglia)", eq(bgOf("subthalamic"), ["hemiballismus"]));
ok("no basal_ganglia structure sets a crosses override (inherits findings.CROSSES)",
   STRUCTURES.filter(s => s.level === "basal_ganglia")
     .every(s => !Object.prototype.hasOwnProperty.call(s, "crosses")));
ok("stn no longer lives in subcortex",
   !STRUCTURES.some(s => s.level === "subcortex" && s.part === "subthalamic"));
```

- [ ] **Step 2: Run to verify it fails.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/basal-ganglia.test.js`
Expected: FAIL — `substantia_nigra -> …` empty; `subthalamic -> hemiballismus (relocated…)` fails (still in subcortex).

- [ ] **Step 3: Relocate the STN structure.** In `src/model/structures.js`, change the existing `stn` structure's level from `subcortex` to `basal_ganglia` (leave `part`, `produces`, `note` unchanged):

```js
  { id: "stn",       level: "basal_ganglia", part: "subthalamic", produces: "hemiballismus",
    note: "subthalamic nucleus — contralateral hemiballismus" },
```

- [ ] **Step 4: Add the three new nuclei.** In `src/model/structures.js`, add a new block (place it just after the SUBCORTEX block, before the VISUAL PATHWAY block):

```js
  // ---- BASAL GANGLIA (extrapyramidal movement nuclei; all CONTRALATERAL, above every decussation —
  // no crosses override, inherit findings.CROSSES) ----
  // A focal/structural lesion of one nucleus gives the contralateral HEMI-syndrome; the bilateral
  // degenerative disease (PD, Huntington's) comes from composeBasalGangliaBilateralSites (Task 4) and
  // is NAMED by the phonebook (Task 5) — the anatomy stays pure. The subthalamic nucleus (stn, above)
  // is the fourth nucleus, relocated here from subcortex.
  { id: "snc_park",       level: "basal_ganglia", part: "substantia_nigra", produces: "parkinsonism",
    note: "substantia nigra pars compacta (nigrostriatal) — contralateral parkinsonism" },
  { id: "snc_rigid",      level: "basal_ganglia", part: "substantia_nigra", produces: "rigidity",
    note: "substantia nigra — extrapyramidal rigidity (tone-axis companion, non-localising)" },
  { id: "striatum_chorea",level: "basal_ganglia", part: "striatum",         produces: "chorea",
    note: "striatum (caudate + putamen) — contralateral chorea / choreoathetosis" },
  { id: "gp_dystonia",    level: "basal_ganglia", part: "globus_pallidus",  produces: "dystonia",
    note: "globus pallidus — contralateral dystonia" },
```

- [ ] **Step 5: Run to verify the new structure assertions pass.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/basal-ganglia.test.js`
Expected: PASS for the Task 2 assertions. (Forward/site assertions come in Task 3; sites don't exist yet, but no assertion references them yet.)

- [ ] **Step 6: Checkpoint.** The `subcortex` suite still references `left_subcortex_subthalamic`, which no longer builds — it will FAIL here. That is expected and fixed in Task 6. Run only the unaffected proof now:

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/basal-ganglia.test.js`
Expected: PASS. (Do **not** run full `npm test` until Task 6 migrates the subcortex assertions.)

---

### Task 3: Focal sites — LEVELS / PARTS / TERRITORY + subcortex cleanup

**Files:**
- Modify: `src/model/sites.js` (`LEVELS`, `PARTS`, `TERRITORY`, `DEEP_TERRITORY`)
- Modify: `test/basal-ganglia.test.js` (append focal-site + forward assertions)

**Interfaces:**
- Consumes: structures from Task 2.
- Produces: focal sites `left_basal_ganglia_<part>` / `right_basal_ganglia_<part>` for all four parts (built by `buildSites` from `LEVELS`×`PARTS`).

- [ ] **Step 1: Write the failing test.** In `test/basal-ganglia.test.js`, insert before the report block:

```js
// --- Task 3: focal (left/right) sites, contralateral emission ---
ok("left_basal_ganglia_substantia_nigra exists", !!SITE_BY_ID.left_basal_ganglia_substantia_nigra);
ok("right_basal_ganglia_striatum exists", !!SITE_BY_ID.right_basal_ganglia_striatum);
ok("left_basal_ganglia_globus_pallidus exists", !!SITE_BY_ID.left_basal_ganglia_globus_pallidus);
ok("left_basal_ganglia_subthalamic exists (STN relocated)", !!SITE_BY_ID.left_basal_ganglia_subthalamic);
ok("left_subcortex_subthalamic no longer exists", !SITE_BY_ID.left_subcortex_subthalamic);
{
  const nigra = expectedFindings(SITE_BY_ID.left_basal_ganglia_substantia_nigra);
  ok("left nigra -> parkinsonism@right (contra)", nigra.has("parkinsonism@right"));
  ok("left nigra -> rigidity@right (contra)", nigra.has("rigidity@right"));
  const striatum = expectedFindings(SITE_BY_ID.left_basal_ganglia_striatum);
  ok("left striatum -> chorea@right (contra)", striatum.has("chorea@right"));
  const gp = expectedFindings(SITE_BY_ID.left_basal_ganglia_globus_pallidus);
  ok("left globus pallidus -> dystonia@right (contra)", gp.has("dystonia@right"));
  const stn = expectedFindings(SITE_BY_ID.left_basal_ganglia_subthalamic);
  ok("left subthalamic -> hemiballismus@right (contra)", stn.has("hemiballismus@right"));
}
```

- [ ] **Step 2: Run to verify it fails.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/basal-ganglia.test.js`
Expected: FAIL — `left_basal_ganglia_substantia_nigra` is undefined (level not registered).

- [ ] **Step 3: Register the level.** In `src/model/sites.js`, add `"basal_ganglia"` to `LEVELS` (place it right after `"subcortex"`):

```js
const LEVELS = ["midbrain", "pons", "medulla", "cord", "cortex", "subcortex", "basal_ganglia", "skull_base", "root", "nerve", "visual_pathway", "pupil", "sympathetic"];
```

- [ ] **Step 4: Register the parts.** In `src/model/sites.js`, in `PARTS`, add the three new parts on the subcortex/deep line (keep `"subthalamic"` — it is now used by the `basal_ganglia` level):

```js
  "internal_capsule", "thalamus", "subthalamic", "optic_radiation",
  "substantia_nigra", "striatum", "globus_pallidus",
```

- [ ] **Step 5: Move + add TERRITORY entries.** In `src/model/sites.js`, in the `TERRITORY` map, replace the `"subcortex|subthalamic"` entry with four `basal_ganglia|…` entries:

```js
  "basal_ganglia|substantia_nigra": "midbrain / nigrostriatal (substantia nigra)",
  "basal_ganglia|striatum":         "lenticulostriate perforators (caudate / putamen)",
  "basal_ganglia|globus_pallidus":  "lenticulostriate / anterior choroidal (globus pallidus)",
  "basal_ganglia|subthalamic":      "posterior/thalamoperforators (subthalamic nucleus)",
```

(Delete the old `"subcortex|subthalamic": "posterior/thalamoperforators (subthalamic nucleus)",` line.)

- [ ] **Step 6: Drop the now-unused DEEP_TERRITORY entry.** In `src/model/sites.js`, remove the `subthalamic` line from `DEEP_TERRITORY` (STN is no longer a subcortex deep-vascular part; it is in no lacune composite group):

```js
export const DEEP_TERRITORY = {
  internal_capsule: { territory: "lenticulostriate perforators (MCA)" },
  thalamus:         { territory: "thalamoperforators / thalamogeniculate (PCA)" },
  optic_radiation:  { territory: "anterior choroidal artery" }
};
```

- [ ] **Step 7: Run to verify it passes.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/basal-ganglia.test.js`
Expected: PASS for all Task 1–3 assertions.

---

### Task 4: Bilateral composer (degenerative disease sites)

**Files:**
- Modify: `src/model/sites.js` (add `composeBasalGangliaBilateralSites`)
- Modify: `src/engine/inverse.js` (import + register in `candidateSites`)
- Modify: `test/basal-ganglia.test.js` (append bilateral-site assertions)

**Interfaces:**
- Consumes: structures/sites from Tasks 2–3.
- Produces: `composeBasalGangliaBilateralSites()` → sites `basal_ganglia_substantia_nigra` / `basal_ganglia_striatum` / `basal_ganglia_globus_pallidus`, each `side: "bilateral"`, `composite: true`. **No** `basal_ganglia_subthalamic` bilateral site.

- [ ] **Step 1: Write the failing test.** In `test/basal-ganglia.test.js`, insert before the report block:

```js
// --- Task 4: bilateral (degenerative) sites — emit @left AND @right, never @bilateral ---
ok("bilateral site basal_ganglia_substantia_nigra exists", !!SITE_BY_ID.basal_ganglia_substantia_nigra);
ok("bilateral nigra site is side=bilateral",
   SITE_BY_ID.basal_ganglia_substantia_nigra && SITE_BY_ID.basal_ganglia_substantia_nigra.side === "bilateral");
ok("bilateral site basal_ganglia_striatum exists", !!SITE_BY_ID.basal_ganglia_striatum);
ok("bilateral site basal_ganglia_globus_pallidus exists", !!SITE_BY_ID.basal_ganglia_globus_pallidus);
ok("NO bilateral subthalamic site (STN excluded from the composer)",
   !SITE_BY_ID.basal_ganglia_subthalamic);
{
  const nigra = expectedFindings(SITE_BY_ID.basal_ganglia_substantia_nigra);
  ok("bilateral nigra -> parkinsonism@left AND @right",
     nigra.has("parkinsonism@left") && nigra.has("parkinsonism@right"));
  ok("bilateral nigra -> rigidity@left AND @right",
     nigra.has("rigidity@left") && nigra.has("rigidity@right"));
  ok("bilateral nigra emits NO @bilateral token", !nigra.has("parkinsonism@bilateral"));
  const striatum = expectedFindings(SITE_BY_ID.basal_ganglia_striatum);
  ok("bilateral striatum -> chorea@left AND @right",
     striatum.has("chorea@left") && striatum.has("chorea@right"));
}
```

- [ ] **Step 2: Run to verify it fails.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/basal-ganglia.test.js`
Expected: FAIL — `basal_ganglia_substantia_nigra` (the composite id, no side prefix) is undefined.

- [ ] **Step 3: Add the composer.** In `src/model/sites.js`, add after `composeMotorUnitSites` (or near the other bilateral composers):

```js
// BASAL GANGLIA BILATERAL SITES. The degenerative diseases (Parkinson's, Huntington's) are BILATERAL
// (often asymmetric-onset). One bilateral site per nucleus, id `basal_ganglia_<part>` (motor-unit
// convention — no side prefix, so it never collides with the focal left_/right_ sites). A bilateral
// site emits each finding on BOTH body sides (@left + @right). The subthalamic nucleus is EXCLUDED —
// bilateral ballism is not a classic syndrome; STN stays focal/contralateral.
export function composeBasalGangliaBilateralSites() {
  const parts = ["substantia_nigra", "striatum", "globus_pallidus"];
  const sites = [];
  for (const part of parts) {
    const structures = STRUCTURES.filter(s => s.level === "basal_ganglia" && s.part === part).map(s => s.id);
    if (structures.length === 0) continue;
    sites.push({ id: `basal_ganglia_${part}`, side: "bilateral", level: "basal_ganglia", part,
      territory: TERRITORY[`basal_ganglia|${part}`], structures, composite: true });
  }
  return sites;
}
```

- [ ] **Step 4: Register the composer.** In `src/engine/inverse.js`, add `composeBasalGangliaBilateralSites` to the import from `../model/sites.js`, then add it to the `candidateSites()` return array:

```js
import { SITES, composeHemiLevelSites, composeBilateralCordSites, composeCaudaConusSites,
         composeVascularCortexSites, composeBilateralCortexSites, composeDeepVascularSites,
         composeSkullBaseSites, composeMotorUnitSites, composePolyneuropathySites,
         composePlexusSites, composeVisualPathwaySites, composePupilPretectumSites,
         composePancoastSites, composeBasalGangliaBilateralSites } from "../model/sites.js";
```

```js
function candidateSites() {
  return [...SITES, ...composeHemiLevelSites(), ...composeBilateralCordSites(),
          ...composeCaudaConusSites(), ...composeVascularCortexSites(), ...composeBilateralCortexSites(),
          ...composeDeepVascularSites(), ...composeSkullBaseSites(), ...composeMotorUnitSites(),
          ...composePolyneuropathySites(), ...composePlexusSites(), ...composeVisualPathwaySites(),
          ...composePupilPretectumSites(), ...composePancoastSites(),
          ...composeBasalGangliaBilateralSites()];
}
```

> **Note:** `SITE_BY_ID` (used by the test) is built from `SITES` (the focal `buildSites` output) and does **not** include composer sites. The composite `basal_ganglia_*` sites are only in `candidateSites()`. Adjust the Task 4 test to look them up via the composer instead:

```js
import { composeBasalGangliaBilateralSites } from "../src/model/sites.js";
const BG_BILAT = Object.fromEntries(composeBasalGangliaBilateralSites().map(s => [s.id, s]));
```

Replace `SITE_BY_ID.basal_ganglia_substantia_nigra` etc. in the Task 4 assertions with `BG_BILAT.basal_ganglia_substantia_nigra`, and the `SITE_BY_ID.basal_ganglia_subthalamic` check with `!BG_BILAT.basal_ganglia_subthalamic`. (Add the import at the top of the file alongside the other imports.)

- [ ] **Step 5: Run to verify it passes.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/basal-ganglia.test.js`
Expected: PASS for all Task 1–4 assertions.

---

### Task 5: Phonebook naming + inverse emergence

**Files:**
- Modify: `src/data/syndromes.js` (relocate the subthalamic entry; add nigra/striatum/pallidus entries)
- Modify: `test/basal-ganglia.test.js` (append emergence + naming assertions)

**Interfaces:**
- Consumes: sites (focal + bilateral) from Tasks 3–4; `solve` / `nameForSite`.
- Produces: phonebook keys `basal_ganglia_substantia_nigra` (variant), `basal_ganglia_striatum` (variant), `basal_ganglia_globus_pallidus` (plain), `basal_ganglia_subthalamic` (plain, moved from `subcortex_subthalamic`).

- [ ] **Step 1: Write the failing test.** In `test/basal-ganglia.test.js`, insert before the report block. Bilateral inputs use both `@left`+`@right` (the site emits both):

```js
// --- Task 5: inverse emergence + naming ---
const bilat = (...ids) => new Set(ids.flatMap(f => [`${f}@left`, `${f}@right`]));

// focal (structural) hemi-syndromes -> the left/right nucleus site
{
  const { best } = solve(new Set(["parkinsonism@right", "rigidity@right"]));
  ok("contra parkinsonism+rigidity -> left_basal_ganglia_substantia_nigra",
     best && best.site.id === "left_basal_ganglia_substantia_nigra");
  ok("focal nigra names hemiparkinsonism", best && /hemiparkinson/i.test(nameForSite(best.site).name));
}
{
  const { best } = solve(new Set(["chorea@right"]));
  ok("contra chorea -> left_basal_ganglia_striatum",
     best && best.site.id === "left_basal_ganglia_striatum");
  ok("focal striatum names hemichorea", best && /hemichorea/i.test(nameForSite(best.site).name));
}
{
  const { best } = solve(new Set(["dystonia@right"]));
  ok("contra dystonia -> left_basal_ganglia_globus_pallidus",
     best && best.site.id === "left_basal_ganglia_globus_pallidus");
  ok("globus pallidus names dystonia", best && /dystonia/i.test(nameForSite(best.site).name));
}
{
  const { best } = solve(new Set(["hemiballismus@right"]));
  ok("hemiballismus -> left_basal_ganglia_subthalamic (relocated)",
     best && best.site.id === "left_basal_ganglia_subthalamic");
  ok("subthalamic still names hemiballismus", best && /hemiballism/i.test(nameForSite(best.site).name));
}

// bilateral (degenerative) diseases -> the bilateral composite site, named the disease
{
  const { best } = solve(bilat("parkinsonism", "rigidity"));
  ok("bilateral parkinsonism -> basal_ganglia_substantia_nigra (composite)",
     best && best.site.id === "basal_ganglia_substantia_nigra");
  ok("bilateral nigra names Parkinsonism/PD",
     best && /parkinson/i.test(nameForSite(best.site, { dominantSide: "left" }).name));
}
{
  const { best } = solve(bilat("chorea"));
  ok("bilateral chorea -> basal_ganglia_striatum (composite)",
     best && best.site.id === "basal_ganglia_striatum");
  ok("bilateral striatum names chorea/Huntington's",
     best && /chorea|huntington/i.test(nameForSite(best.site).name));
}
```

- [ ] **Step 2: Run to verify it fails.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/basal-ganglia.test.js`
Expected: FAIL — names fall back to plain anatomical strings (`left basal_ganglia (substantia_nigra)`), so the `/hemiparkinson/`, `/parkinson/`, `/chorea/` regexes fail. Site-id assertions should already PASS (the solver localises without the phonebook).

- [ ] **Step 3: Relocate the subthalamic phonebook entry.** In `src/data/syndromes.js`, rename the `subcortex_subthalamic:` key to `basal_ganglia_subthalamic:` (content unchanged):

```js
  basal_ganglia_subthalamic: {
    name: "Hemiballismus (subthalamic nucleus)",
    note: "Subthalamic nucleus lesion: violent, large-amplitude involuntary flinging of the contralateral limbs, usually proximal.",
    ddx: ["Subthalamic lacunar infarct / haemorrhage", "Non-ketotic hyperglycaemia (striatal)", "Tumour", "Demyelination"],
    red: "Check glucose — non-ketotic hyperglycaemia is a treatable, striatal cause of acute hemiballismus/hemichorea."
  },
```

- [ ] **Step 4: Add the three new entries.** In `src/data/syndromes.js`, add near the relocated subthalamic entry. Nigra and striatum use the `{ dominant, nondominant, bilateral }` variant object (the unilateral sides give the hemi-syndrome — `dominant` and `nondominant` are identical here since laterality of the nucleus, not the hemisphere, is what matters; the bilateral side gives the disease):

```js
  basal_ganglia_substantia_nigra: {
    dominant: {
      name: "Hemiparkinsonism (structural)",
      note: "Focal substantia-nigra / nigrostriatal lesion: contralateral bradykinesia, rigidity and (variably) rest tremor. The structural mirror of idiopathic Parkinson's disease.",
      ddx: ["Contralateral midbrain / nigral infarct or haemorrhage", "Mass lesion", "Demyelination", "Vascular parkinsonism (focal)"],
      red: "Acute or rapidly progressive hemiparkinsonism is structural until proven otherwise — image the midbrain."
    },
    nondominant: {
      name: "Hemiparkinsonism (structural)",
      note: "Focal substantia-nigra / nigrostriatal lesion: contralateral bradykinesia, rigidity and (variably) rest tremor. The structural mirror of idiopathic Parkinson's disease.",
      ddx: ["Contralateral midbrain / nigral infarct or haemorrhage", "Mass lesion", "Demyelination", "Vascular parkinsonism (focal)"],
      red: "Acute or rapidly progressive hemiparkinsonism is structural until proven otherwise — image the midbrain."
    },
    bilateral: {
      name: "Parkinsonism (bilateral — Parkinson's disease & mimics)",
      note: "Bilateral nigrostriatal dopamine loss: bradykinesia with rigidity and rest tremor. Idiopathic Parkinson's disease is the commonest cause; the asymmetric onset still resolves to the bilateral nucleus.",
      ddx: ["Parkinson's disease", "Drug-induced parkinsonism", "Vascular parkinsonism", "Parkinson-plus (MSA / PSP / CBD)", "Wilson's disease (young)"],
      red: "A symmetric, tremor-poor, rapidly progressive or early-falls parkinsonism suggests a Parkinson-plus syndrome — not idiopathic PD."
    }
  },
  basal_ganglia_striatum: {
    dominant: {
      name: "Hemichorea / choreoathetosis (structural)",
      note: "Focal striatal (caudate/putamen) lesion: contralateral chorea, sometimes with a ballistic or athetoid component.",
      ddx: ["Non-ketotic hyperglycaemia (classic)", "Striatal lacunar infarct / haemorrhage", "Mass lesion", "Vasculitis / lupus"],
      red: "Check glucose — non-ketotic hyperglycaemia is a treatable cause of acute hemichorea/hemiballismus."
    },
    nondominant: {
      name: "Hemichorea / choreoathetosis (structural)",
      note: "Focal striatal (caudate/putamen) lesion: contralateral chorea, sometimes with a ballistic or athetoid component.",
      ddx: ["Non-ketotic hyperglycaemia (classic)", "Striatal lacunar infarct / haemorrhage", "Mass lesion", "Vasculitis / lupus"],
      red: "Check glucose — non-ketotic hyperglycaemia is a treatable cause of acute hemichorea/hemiballismus."
    },
    bilateral: {
      name: "Chorea (bilateral — Huntington's & mimics)",
      note: "Bilateral striatal dysfunction: generalised chorea. Huntington's disease is the archetype; several treatable causes mimic it.",
      ddx: ["Huntington's disease", "Sydenham's chorea", "Chorea gravidarum / OCP", "Drug-induced (levodopa, neuroleptic withdrawal)", "SLE / antiphospholipid", "Thyrotoxicosis"],
      red: "New chorea warrants a treatable-cause screen (glucose, thyroid, autoimmune, pregnancy/drug history) before attributing it to Huntington's."
    }
  },
  basal_ganglia_globus_pallidus: {
    name: "Dystonia (globus pallidus)",
    note: "Pallidal dysfunction: sustained or intermittent co-contraction producing abnormal posturing — focal (contralateral) or, when bilateral, generalised.",
    ddx: ["Genetic / idiopathic dystonia", "Wilson's disease", "Drug-induced (neuroleptics — acute dystonia / tardive)", "Post-anoxic / kernicterus (pallidal)", "Focal pallidal lesion"],
    red: "Young-onset dystonia needs Wilson's disease excluded (copper studies, slit-lamp) — it is treatable."
  },
```

- [ ] **Step 5: Remove the old subcortex key.** Confirm the original `subcortex_subthalamic:` block is deleted (it was renamed in Step 3, not duplicated). Search:

Run: `grep -n "subcortex_subthalamic" src/data/syndromes.js`
Expected: no matches.

- [ ] **Step 6: Run to verify it passes.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/basal-ganglia.test.js`
Expected: PASS — all emergence + naming assertions green.

---

### Task 6: Migrate subcortex suite, wire into the chain, full regression

**Files:**
- Modify: `test/subcortex.test.js` (remove the subthalamic/hemiballismus assertions — now owned by the basal-ganglia suite)
- Modify: `package.json` (`test` script)
- Modify: `README.md` (test-chain listing)

**Interfaces:**
- Consumes: everything from Tasks 1–5.
- Produces: a green full suite of **18** files with `basal-ganglia.test.js` in the chain.

- [ ] **Step 1: Update the subcortex header comment.** In `test/subcortex.test.js` line 1, drop "subthalamic nucleus,":

```js
// subcortex.test.js — the subcortex region: internal capsule, thalamus, optic radiation.
```

- [ ] **Step 2: Remove the hemiballismus vocabulary assertions.** In `test/subcortex.test.js`, delete these three lines (keep the `thalamic_pain` ones):

```js
ok("hemiballismus exists", isFinding("hemiballismus"));
ok("hemiballismus crosses (contra)", CROSSES.hemiballismus === true);
ok("hemiballismus is NOT non-lateralised", !NON_LATERALISED.has("hemiballismus"));
```

- [ ] **Step 3: Remove the subthalamic structure assertion.** Delete:

```js
ok("subthalamic -> hemiballismus", eq(subOf("subthalamic"), ["hemiballismus"]));
```

- [ ] **Step 4: Remove the subthalamic site-existence assertion.** Delete:

```js
ok("left_subcortex_subthalamic exists", !!SITE_BY_ID.left_subcortex_subthalamic);
```

- [ ] **Step 5: Remove the subthalamic forward assertion.** Delete these two lines:

```js
  const stn = expectedFindings(SITE_BY_ID.left_subcortex_subthalamic);
  ok("left subthalamic -> hemiballismus@right (contra)", stn.has("hemiballismus@right"));
```

- [ ] **Step 6: Remove the hemiballismus inverse block.** Delete:

```js
// Hemiballismus: an isolated deep localiser -> subthalamic nucleus.
{
  const { best } = solve(new Set(["hemiballismus@right"]));
  ok("hemiballismus -> left_subcortex_subthalamic", best && best.site.id === "left_subcortex_subthalamic");
}
```

- [ ] **Step 7: Remove the subthalamic naming assertion.** Delete these two lines (inside the naming block):

```js
  const stn = solve(new Set(["hemiballismus@right"])).best;
  ok("subthalamic names hemiballismus", /hemiballism/i.test(nameForSite(stn.site).name));
```

- [ ] **Step 8: Run the subcortex suite to confirm it is green without STN.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/subcortex.test.js`
Expected: PASS, `0 failed`. (If `subOf`, `SITES`, `NON_LATERALISED`, or `nameForSite` becomes an unused import, that is harmless — leave imports as-is to minimise churn.)

- [ ] **Step 9: Add the suite to package.json.** In `package.json`, append `basal-ganglia.test.js` to the `test` script chain (after `subcortex.test.js` to mirror anatomical order, or at the end — either is fine; end shown):

```json
    "test": "node test/engine.test.js && node test/cord.test.js && node test/sensory-level.test.js && node test/central-cord.test.js && node test/cauda-conus.test.js && node test/cortex.test.js && node test/subcortex.test.js && node test/cranial-nerves.test.js && node test/motor-unit.test.js && node test/pns.test.js && node test/pns-nerves.test.js && node test/reflexes.test.js && node test/tone.test.js && node test/nerve-segments.test.js && node test/visual-pathway.test.js && node test/pupil-efferent.test.js && node test/horner-axis.test.js && node test/basal-ganglia.test.js"
```

- [ ] **Step 10: Add the suite to the README listing.** In `README.md`, update the STN description on the subcortex line and add a basal-ganglia line after the `horner-axis` line:

```
node test/subcortex.test.js      # subcortex (capsule/thalamus/optic radiation; lacunes)
```

```
node test/basal-ganglia.test.js  # basal ganglia (nigra→parkinsonism, striatum→chorea, GP→dystonia, STN→hemiballismus)
```

- [ ] **Step 11: Full regression checkpoint.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: all 18 suites PASS, `0 failed` on every line. Confirm the total assertion count rose by the basal-ganglia suite's count and no prior suite dropped assertions unexpectedly.

---

### Task 7: Sync the anatomy artifact

**Files:**
- Modify: `docs/artifacts/anatomy-model.html` (move the STN row; add a basal-ganglia block)

**Interfaces:** none (documentation sync per CLAUDE.md — "Keep them in sync after each region increment").

- [ ] **Step 1: Locate the STN row and the subcortex block.**

Run: `grep -n "subthalamic\|subcortex primitive\|substantia" docs/artifacts/anatomy-model.html`
Expected: the STN row (`<div class="id">stn</div>`) sits inside the subcortex block (~line 460–462); the composite summary mentions "hemiballismus (STN)" (~line 834).

- [ ] **Step 2: Move the STN row out of the subcortex block and add a basal-ganglia block.** Remove the `subthalamic` column/row from the subcortex section and add a new basal-ganglia section modelled on the existing block markup, listing four nuclei with CONTRA badges: `snc_park` (substantia nigra → parkinsonism), `snc_rigid` (→ rigidity, tone-axis), `striatum_chorea` (striatum → chorea), `gp_dystonia` (globus pallidus → dystonia), `stn` (subthalamic → hemiballismus). Match the surrounding HTML structure exactly (copy a sibling block's tag nesting and class names — `col-h`/`p`/`terr`/`row`/`badge bc`/`m`/`id`/`fn`). Note the bilateral degenerative sites (Parkinson's / Huntington's) as the bilateral composite in the same style the other composites are annotated.

- [ ] **Step 3: Update the composite summary line.** In the subcortex composite summary (~line 834), remove "· hemiballismus (STN)" from the subcortex primitive description (STN now belongs to the basal-ganglia block).

- [ ] **Step 4: Verify the artifact is well-formed.** Open `docs/artifacts/anatomy-model.html` in a browser (or eyeball the diff) and confirm the basal-ganglia block renders and the subcortex block no longer shows STN. (Re-publishing to the live Artifact URL is a manual follow-up per `docs/artifacts/` — not part of this plan.)

- [ ] **Step 5: Final full-suite confirmation.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: all 18 suites PASS, `0 failed`.

---

## Self-review notes

- **Spec coverage:** level+four nuclei (T2–3), rigidity on the tone axis (T1), focal-contra sites (T3), bilateral composer excluding STN (T4), LOCALISING split (T1), variant naming hemi-vs-disease + STN relocation (T5), regression + suite wiring (T6), artifact sync (T7). All spec sections map to a task.
- **Bilateral emission** is `@left`+`@right` (forward.js), asserted explicitly (T4) including the negative `!has("…@bilateral")`.
- **Composite sites are not in `SITE_BY_ID`** — the T4 test looks them up through the composer directly (noted in T4 Step 4).
- **Type/name consistency:** `composeBasalGangliaBilateralSites` used identically in sites.js, inverse.js, and the test; site ids `left_basal_ganglia_<part>` (focal) vs `basal_ganglia_<part>` (bilateral) are distinct; phonebook keys match `basal_ganglia_<part>`.

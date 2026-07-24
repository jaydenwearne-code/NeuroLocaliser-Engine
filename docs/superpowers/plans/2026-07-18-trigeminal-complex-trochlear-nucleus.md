# Trigeminal complex & trochlear nucleus — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the pontine trigeminal complex (main sensory + motor V, with a lateral-pons union) and the
midbrain trochlear nucleus (contralateral SO palsy + a lean peripheral trochlear nerve).

**Architecture:** Pure anatomy-table extension. Trigeminal: a new pons part + a union composer (skull-base
nesting pattern). Trochlear: a per-structure `crosses: true` override (cord pattern) on a composer-built
nucleus site + a `buildSites` peripheral nerve site. No new solver mechanism.

**Tech Stack:** Zero-dependency ES modules, Node v24. Standalone test scripts, one `ok(label, cond)` helper.

## Global Constraints

- **Runtime:** no Node on PATH. Prefix every command:
  `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" <cmd>`.
- **Not a git repository.** No commit steps; each task's checkpoint is "run the suite(s) and confirm green".
- **The golden rule:** findings come from structures sharing a site; names come from the `syndromes.js`
  phonebook. No `if (hasX && hasY)` logic.
- **Trigeminal findings** `face_touch_loss`, `jaw_weakness`: ipsilateral (`CROSSES:false`), LOCALISING.
- **Trochlear:** `cn4_palsy` gets a *contralateral* producer via a structure-level `crosses:true` override;
  the nucleus co-emits `ino` (ipsilateral, existing finding) as the companion. Isolated CN4 → peripheral
  strictly (nucleus over-predicts `ino`).
- **TDD, red-first.** Keep all prior suites green at every task boundary (963 assertions / 22 suites now).

---

### Task 1: Trigeminal complex (pons)

**Files:**
- Modify: `src/model/findings.js` (2 findings + CROSSES)
- Modify: `src/engine/score.js:61` (LOCALISING)
- Modify: `src/model/structures.js` (2 structures after pons-lateral block `:55`)
- Modify: `src/model/sites.js` (`PARTS` add `trigeminal`; TERRITORY; union composer)
- Modify: `src/engine/inverse.js:34` (register composer)
- Modify: `src/data/syndromes.js` (2 phonebook entries)
- Create: `test/trigeminal.test.js`
- Modify: `package.json`, `README.md`

**Interfaces:**
- Produces: findings `face_touch_loss`, `jaw_weakness`; structures `trig_main_sensory`, `trig_motor` at
  `pons`/`trigeminal`; sites `left/right_pons_trigeminal` (buildSites) + `left/right_pons_lateral_trigeminal`
  (composer `composeLateralPontineTrigeminalSites`, `level:"pons"`, `part:"lateral_trigeminal"`).

- [ ] **Step 1: Write the failing test** — create `test/trigeminal.test.js`:

```javascript
// trigeminal.test.js — the pontine trigeminal complex. Main sensory nucleus -> facial TOUCH (pons);
// motor nucleus -> jaw weakness (V3). Dissociation: touch=pons, pain/temp=medulla (spinal nucleus). The
// complex is its own site AND unions into the lateral pontine (Marie-Foix/AICA) syndrome.
// Run: node test/trigeminal.test.js
import { CROSSES, NON_LATERALISED, isFinding } from "../src/model/findings.js";
import { LOCALISING } from "../src/engine/score.js";
import { SITE_BY_ID, composeLateralPontineTrigeminalSites } from "../src/model/sites.js";
import { expectedFindings } from "../src/engine/forward.js";
import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }

// Vocabulary
for (const id of ["face_touch_loss", "jaw_weakness"]) {
  ok(`${id} exists`, isFinding(id));
  ok(`${id} is ipsilateral (CROSSES false)`, CROSSES[id] === false);
  ok(`${id} is LOCALISING`, LOCALISING.has(id));
  ok(`${id} is NOT non-lateralised`, !NON_LATERALISED.has(id));
}

// Forward dissociation: touch=pons, pain/temp=medulla
{
  const t = expectedFindings(SITE_BY_ID.left_pons_trigeminal);
  ok("left_pons_trigeminal -> face_touch_loss@left + jaw_weakness@left",
     t.has("face_touch_loss@left") && t.has("jaw_weakness@left"));
  ok("left_pons_trigeminal does NOT emit face_pain_loss (that's medullary)",
     !t.has("face_pain_loss@left"));
  const m = expectedFindings(SITE_BY_ID.left_medulla_lateral);
  ok("medulla still -> face_pain_loss@left (spinal nucleus)", m.has("face_pain_loss@left"));
}

// Isolated trigeminal complex
{
  const { best } = solve(new Set(["face_touch_loss@left", "jaw_weakness@left"]));
  ok("isolated trigeminal -> left_pons_trigeminal", best && best.site.id === "left_pons_trigeminal");
  ok("pons_trigeminal names the trigeminal complex",
     best && /trigeminal/i.test(nameForSite(best.site).name));
}

// Union with the lateral pons (Marie-Foix + trigeminal), left lesion
{
  const { best } = solve(new Set([
    "spinothalamic@right", "limb_ataxia@left", "cn8_vertigo@left",
    "face_touch_loss@left", "jaw_weakness@left"
  ]));
  ok("lateral pons + trigeminal -> left_pons_lateral_trigeminal",
     best && best.site.id === "left_pons_lateral_trigeminal");
  ok("union names Marie-Foix with trigeminal",
     best && /trigeminal/i.test(nameForSite(best.site).name));
}

console.log("====================================================");
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("====================================================");
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/trigeminal.test.js`
Expected: FAIL — `composeLateralPontineTrigeminalSites` not exported / findings missing.

- [ ] **Step 3: Add the two findings** to `src/model/findings.js`. After the `v2_sensory:` line
(`:28`), in the Cranial-nerve group (jaw), and after the `face_pain_loss:` line (`:38`) for the sensory one
— OR place both together after `face_pain_loss:` (`:38`):

```javascript
  face_touch_loss:{ desc: "Facial (discriminative) TOUCH loss — principal / main sensory nucleus (pons)", group: "Long tract" },
  jaw_weakness:   { desc: "Jaw weakness / deviation toward the weak side + masseter wasting (motor nucleus V, V3 LMN)", group: "Cranial nerve" },
```

- [ ] **Step 4: Add CROSSES entries.** After the `face_pain_loss: false` line (`src/model/findings.js:220`):

```javascript
  face_touch_loss: false,  // main sensory nucleus (pons) -> ipsilateral face touch
  jaw_weakness: false,     // motor nucleus V -> ipsilateral jaw
```

- [ ] **Step 5: Add to LOCALISING** in `src/engine/score.js`. Change the last LOCALISING line (`:61`) to
add a trailing comma and append:

```javascript
  "reduced_consciousness","preserved_vertical_gaze","extensor_posturing",
  // trigeminal complex (pontine main sensory + motor V)
  "face_touch_loss","jaw_weakness"
```

- [ ] **Step 6: Add the two structures** to `src/model/structures.js`, after the `cn8_pons_nyst` block
(`src/model/structures.js:55`, i.e. before the `// ---- MEDULLA ----` comment):

```javascript
  { id: "trig_main_sensory", level: "pons", part: "trigeminal", produces: "face_touch_loss",
    note: "principal / main sensory nucleus (pons) — discriminative facial touch; ipsilateral" },
  { id: "trig_motor",        level: "pons", part: "trigeminal", produces: "jaw_weakness",
    note: "motor nucleus V — muscles of mastication; jaw deviates to the weak side; ipsilateral" },
```

- [ ] **Step 7: Register the part + territory + union composer** in `src/model/sites.js`:

7a. Add `trigeminal` and `lateral_trigeminal` to `PARTS` (`src/model/sites.js:35`) — change the closing:

```javascript
  "cn3_compressive", "cn3_ischaemic", "ciliary_ganglion", "preganglionic",
  "trigeminal"];
```
(Do NOT add `lateral_trigeminal` to `PARTS` — the union site is composer-built; `buildSites` must not make
a bare `pons_lateral_trigeminal` from empty structures. `trigeminal` IS added so `buildSites` makes
`left/right_pons_trigeminal`.)

7b. Add TERRITORY entries after the `locked_in|ventral_pons` line (`src/model/sites.js:134`):

```javascript
  "pons|trigeminal": "pontine trigeminal complex (main sensory + motor V)",
  "pons|lateral_trigeminal": "lateral pons + trigeminal (AICA / Marie-Foix territory)",
```

7c. Add the union composer after `composeConsciousnessSites()`'s closing brace
(`src/model/sites.js:522`):

```javascript

// LATERAL PONTINE + TRIGEMINAL (Marie-Foix with V involvement). The trigeminal nuclei sit in the
// dorsolateral pons (AICA territory), so a lateral pontine lesion reaching them is the UNION of pons-lateral
// and pons-trigeminal — the skull-base nesting pattern (cavernous = SOF ∪ V2). Isolated trigeminal ->
// pons_trigeminal; isolated lateral pons -> pons_lateral; the combined picture -> this union.
export function composeLateralPontineTrigeminalSites() {
  const out = [];
  for (const side of ["left", "right"]) {
    const lateral = SITES.find(s => s.level === "pons" && s.part === "lateral" && s.side === side);
    const trig    = SITES.find(s => s.level === "pons" && s.part === "trigeminal" && s.side === side);
    if (!lateral || !trig) continue;
    out.push({ id: `${side}_pons_lateral_trigeminal`, side, level: "pons", part: "lateral_trigeminal",
      territory: TERRITORY["pons|lateral_trigeminal"],
      structures: [...lateral.structures, ...trig.structures], composite: true });
  }
  return out;
}
```

- [ ] **Step 8: Register in the solver.** In `src/engine/inverse.js`, add
`composeLateralPontineTrigeminalSites` to the `sites.js` import and to the `candidateSites()` concat
(`:34`):

```javascript
          ...composeConsciousnessSites(), ...composeLateralPontineTrigeminalSites()];
```

- [ ] **Step 9: Add phonebook entries** to `src/data/syndromes.js` (place near the pons entries):

```javascript
  pons_trigeminal: {
    name: "Trigeminal complex (pontine) — main sensory + motor V",
    note: "Ipsilateral facial (discriminative) touch loss + jaw weakness (jaw deviates to the weak side) from the pontine main sensory + motor trigeminal nuclei. Touch localises to the pons; pain/temperature to the medullary spinal nucleus.",
    ddx: ["Trigeminal schwannoma", "Focal pontine lesion (demyelination, infarct)", "Pontine glioma"],
    red: "A trigeminal motor + main-sensory deficit points into the pons — image the brainstem."
  },
  pons_lateral_trigeminal: {
    name: "Lateral pontine syndrome (Marie-Foix) with trigeminal (V) involvement",
    note: "The AICA / lateral-pontine cluster (spinothalamic, middle cerebellar peduncle, vestibular) reaching the trigeminal nuclei — adds ipsilateral facial touch loss + jaw weakness.",
    ddx: ["AICA infarct", "Demyelination", "Pontine tumour"],
    red: "AICA territory can cause deafness (labyrinthine artery) — a lateral pontine picture warrants posterior-circulation imaging."
  },
```

- [ ] **Step 10: Register the suite.** `package.json` test chain: append ` && node test/trigeminal.test.js`.
`README.md` suite list (after the consciousness line):

```
node test/trigeminal.test.js     # trigeminal complex (pontine main-sensory + motor V; Marie-Foix union)
```

- [ ] **Step 11: Run test to verify it passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/trigeminal.test.js`
Expected: PASS, `0 failed`.

- [ ] **Step 12: Full-suite checkpoint**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: all suites `0 failed`. (The pons-hemi composite now also carries the trigeminal findings —
winner-only assertions are unaffected.) If anything shifts, STOP and surface it.

---

### Task 2: Trochlear nucleus + peripheral nerve (midbrain / skull base)

**Files:**
- Modify: `src/model/structures.js` (`cn4_nucleus` + `mlf_midbrain` at midbrain/trochlear; `cn4_nerve` at skull_base/trochlear_cisternal)
- Modify: `src/model/sites.js` (`PARTS` add `trochlear_cisternal`; TERRITORY; nucleus composer)
- Modify: `src/engine/inverse.js` (register composer)
- Modify: `src/data/syndromes.js` (2 phonebook entries)
- Create: `test/trochlear.test.js`
- Modify: `package.json`, `README.md`

**Interfaces:**
- Consumes: existing `cn4_palsy`, `ino` findings.
- Produces: structures `cn4_nucleus` (midbrain/trochlear, `crosses:true`), `mlf_midbrain` (midbrain/trochlear,
  produces `ino`), `cn4_nerve` (skull_base/trochlear_cisternal); sites `left/right_midbrain_trochlear`
  (composer `composeTrochlearNucleusSites`) + `left/right_skull_base_trochlear_cisternal` (buildSites).

- [ ] **Step 1: Write the failing test** — create `test/trochlear.test.js`:

```javascript
// trochlear.test.js — CN IV is unique: it fully decussates, so a NUCLEAR lesion gives a CONTRALATERAL
// superior oblique palsy, a peripheral one an ipsilateral palsy. The dorsal-midbrain nucleus site carries a
// co-located MLF (-> ipsilateral INO) as its companion, so isolated CN4 -> peripheral (strict), and
// contralateral CN4 + ipsilateral INO -> nucleus.
// Run: node test/trochlear.test.js
import { isFinding } from "../src/model/findings.js";
import { SITE_BY_ID, composeTrochlearNucleusSites } from "../src/model/sites.js";
import { expectedFindings } from "../src/engine/forward.js";
import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }

const NUC = Object.fromEntries(composeTrochlearNucleusSites().map(s => [s.id, s]));

// Vocabulary / sites
ok("cn4_palsy still a finding", isFinding("cn4_palsy"));
ok("left_midbrain_trochlear nucleus site exists", !!NUC.left_midbrain_trochlear);
ok("peripheral cn4 nerve site exists", !!SITE_BY_ID.left_skull_base_trochlear_cisternal);

// Forward crossing (the teaching point)
{
  const nuc = expectedFindings(NUC.left_midbrain_trochlear);
  ok("nucleus (left) -> cn4_palsy@right (CONTRALATERAL — decussates)", nuc.has("cn4_palsy@right"));
  ok("nucleus (left) -> ino@left (ipsilateral companion)", nuc.has("ino@left"));
  ok("nucleus does NOT emit cn4_palsy@left", !nuc.has("cn4_palsy@left"));
  const per = expectedFindings(SITE_BY_ID.right_skull_base_trochlear_cisternal);
  ok("peripheral (right) -> cn4_palsy@right (IPSILATERAL)", per.has("cn4_palsy@right"));
}

// Isolated CN4 -> peripheral (strict: nucleus over-predicts ino)
{
  const { best } = solve(new Set(["cn4_palsy@right"]));
  ok("isolated cn4_palsy@right -> right_skull_base_trochlear_cisternal (peripheral)",
     best && best.site.id === "right_skull_base_trochlear_cisternal");
  ok("peripheral names an ipsilateral trochlear nerve palsy",
     best && /trochlear|superior oblique/i.test(nameForSite(best.site).name));
}

// Nuclear emergence: contralateral CN4 + ipsilateral INO -> nucleus
{
  const { best } = solve(new Set(["cn4_palsy@right", "ino@left"]));
  ok("cn4@right + ino@left -> left_midbrain_trochlear (nucleus)",
     best && best.site.id === "left_midbrain_trochlear");
  ok("nucleus names a dorsal-midbrain (trochlear/MLF) syndrome",
     best && /dorsal[- ]?midbrain|trochlear/i.test(nameForSite(best.site).name));
}

console.log("====================================================");
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("====================================================");
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/trochlear.test.js`
Expected: FAIL — `composeTrochlearNucleusSites` not exported / sites missing.

- [ ] **Step 3: Add the three structures** to `src/model/structures.js`, after the `sof_cn4` block
(`src/model/structures.js:334`):

```javascript
  { id: "cn4_nerve", level: "skull_base", part: "trochlear_cisternal", produces: "cn4_palsy",
    note: "trochlear nerve (IV) — long cisternal course (trauma / microvascular); ipsilateral SO palsy" },
```

And in the MIDBRAIN section, after the `stt_midbrain` structure (`src/model/structures.js:32-33`):

```javascript
  { id: "cn4_nucleus", level: "midbrain", part: "trochlear", produces: "cn4_palsy", crosses: true,
    note: "trochlear nucleus/fascicle (dorsal midbrain) — CN IV DECUSSATES, so a nuclear lesion gives a CONTRALATERAL superior oblique palsy" },
  { id: "mlf_midbrain", level: "midbrain", part: "trochlear", produces: "ino", crosses: false,
    note: "rostral MLF adjacent to the trochlear fascicle — ipsilateral INO (the co-located companion)" },
```

(Confirm the exact insertion point by reading the two lines of `stt_midbrain` first; place the new block
immediately after its closing `},`.)

- [ ] **Step 4: Register the peripheral part + territories + nucleus composer** in `src/model/sites.js`:

4a. Add `trochlear_cisternal` to `PARTS` (extend the closing line changed in Task 1):

```javascript
  "cn3_compressive", "cn3_ischaemic", "ciliary_ganglion", "preganglionic",
  "trigeminal", "trochlear_cisternal"];
```
(Do NOT add `trochlear` to `PARTS` — the nucleus is composer-built, keeping it out of the midbrain-hemi
composite.)

4b. Add TERRITORY entries (after the trigeminal ones from Task 1):

```javascript
  "midbrain|trochlear": "dorsal midbrain (trochlear nucleus / rostral MLF)",
  "skull_base|trochlear_cisternal": "trochlear nerve — cisternal course (tentorial edge)",
```

4c. Add the nucleus composer after `composeLateralPontineTrigeminalSites()` (from Task 1):

```javascript

// TROCHLEAR NUCLEUS (dorsal midbrain). Composer-built and LATERALISED (left/right) so it stays out of the
// midbrain-hemi composite (part `trochlear` is not in PARTS). cn4_nucleus has crosses:true, so a LEFT
// nucleus emits cn4_palsy@right (contralateral — CN IV decussates); the co-located mlf_midbrain adds
// ino@left (ipsilateral). The companion makes an isolated CN4 resolve to the ipsilateral peripheral nerve
// (the nucleus over-predicts ino), and makes the nucleus win when INO is present.
export function composeTrochlearNucleusSites() {
  const structures = STRUCTURES.filter(s => s.level === "midbrain" && s.part === "trochlear").map(s => s.id);
  if (!structures.length) return [];
  return ["left", "right"].map(side => ({
    id: `${side}_midbrain_trochlear`, side, level: "midbrain", part: "trochlear",
    territory: TERRITORY["midbrain|trochlear"], structures, composite: true
  }));
}
```

- [ ] **Step 5: Register in the solver.** In `src/engine/inverse.js`, add `composeTrochlearNucleusSites`
to the import and the `candidateSites()` concat:

```javascript
          ...composeConsciousnessSites(), ...composeLateralPontineTrigeminalSites(),
          ...composeTrochlearNucleusSites()];
```

- [ ] **Step 6: Add phonebook entries** to `src/data/syndromes.js`:

```javascript
  skull_base_trochlear_cisternal: {
    name: "Trochlear (CN IV) nerve palsy — ipsilateral superior oblique",
    note: "An isolated superior oblique palsy from the trochlear nerve's long cisternal course; vertical/torsional diplopia worse on downgaze and on head tilt to the affected side.",
    ddx: ["Trauma (the long course is vulnerable)", "Microvascular (diabetes / hypertension)", "Congenital (decompensated)", "Raised intracranial pressure"],
    red: "Bilateral trochlear palsy after head trauma suggests a dorsal-midbrain (tectal plate) injury — image it."
  },
  midbrain_trochlear: {
    name: "Dorsal-midbrain (trochlear / MLF) syndrome — contralateral superior oblique palsy ± INO",
    note: "CN IV decussates, so a nuclear/fascicular lesion gives a CONTRALATERAL superior oblique palsy; the adjacent rostral MLF adds an ipsilateral INO. The crossed SO palsy (and/or INO) is the localiser.",
    ddx: ["Dorsal-midbrain infarct", "Demyelination (MS)", "Tumour (pineal / tectal)", "Haemorrhage"],
    red: "A CONTRALATERAL (crossed) superior oblique palsy localises into the dorsal midbrain, not the nerve — image the brainstem."
  },
```

- [ ] **Step 7: Register the suite.** `package.json`: append ` && node test/trochlear.test.js`.
`README.md` (after the trigeminal line):

```
node test/trochlear.test.js      # trochlear nucleus (contralateral SO palsy + INO) vs peripheral nerve
```

- [ ] **Step 8: Run test to verify it passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/trochlear.test.js`
Expected: PASS, `0 failed`.

- [ ] **Step 9: Full-suite checkpoint**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: all suites `0 failed`. Watch the INO-bearing pontine syndromes (one-and-a-half, Foville) — they
carry `ino` with gaze/other signs, so the pontine site still wins; the midbrain nucleus over-predicts
`cn4_palsy` and loses. Watch the SOF `cn4` cluster (unchanged). If any assertion shifts, STOP and surface
it — do not silently patch.

---

### Task 3: Docs of record

**Files:** `README.md` (Status narrative), `CONTRIBUTING.md` (changelog + strike the gaps), memory.

- [ ] **Step 1:** `README.md` "Status" — add a short paragraph: the pontine trigeminal complex now emerges
  (touch=pons main sensory nucleus / pain-temp=medulla spinal nucleus; jaw = motor V), as its own site and
  as a union with the lateral pons (Marie-Foix); and the trochlear nucleus now emerges — CN IV decussates,
  so a nuclear lesion gives a contralateral SO palsy (+ adjacent INO), distinguished from the ipsilateral
  peripheral trochlear nerve.
- [ ] **Step 2:** `CONTRIBUTING.md` — add the increment to the changelog narrative near the consciousness
  entry; strike "trigeminal complex" and "trochlear nucleus" from the remaining coverage-audit gaps.
- [ ] **Step 3:** Update memory (`neurolocaliser-engine-state.md` header count + increment bullet; MEMORY.md
  index line + gaps). Record the final suite count from the Task 2 checkpoint.
- [ ] **Step 4: Final full-suite confirmation**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: all suites `0 failed`; record the aggregate.

---

## Self-Review

**Spec coverage:**
- 2 trigeminal findings + CROSSES + LOCALISING → Task 1 Steps 3–5 ✓
- trigeminal structures + `pons_trigeminal` site + union composite + register + phonebook → Task 1 Steps 6–9 ✓
- trochlear structures (nucleus contra + mlf ino + peripheral) + composer + peripheral buildSites + register + phonebook → Task 2 ✓
- Emergence: dissociation, isolated trigeminal, union, forward crossing, isolated CN4→peripheral, nuclear→nucleus → Tasks 1–2 tests ✓
- Two suites in package.json + README → Task 1 Step 10, Task 2 Step 7 ✓
- Regression watch (INO pontine syndromes, SOF cluster, hemi composites) → Task 1/2 checkpoints ✓

**Placeholder scan:** none — all code literal. (Task 2 Step 3 asks the implementer to confirm the exact
`stt_midbrain` anchor by reading two lines first — that is a precision instruction, not a placeholder.)

**Type consistency:** `composeLateralPontineTrigeminalSites` and `composeTrochlearNucleusSites` identical
across sites.js export, inverse.js import/registration, and the test imports. Structure ids
(`trig_main_sensory`, `trig_motor`, `cn4_nucleus`, `mlf_midbrain`, `cn4_nerve`) and site ids
(`pons_trigeminal`, `pons_lateral_trigeminal`, `midbrain_trochlear`, `skull_base_trochlear_cisternal`)
consistent. `SITES` (referenced by the union composer) is the module-level buildSites array in sites.js.

**YAGNI check:** no onion-skin somatotopy, no separate corneal finding, no trochlear fascicle-as-separate-
site, no diplopia geometry (all deferred per spec).

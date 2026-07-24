# Complete Nerve Innervation + Nerve-Segment Sites — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete each named nerve's motor innervation and split radial/ulnar/median/common-peroneal into level segments so the proximal-vs-distal (elbow-vs-wrist) discriminator — including the ulnar-claw paradox and the spared cutaneous branches — emerges by parsimony.

**Architecture:** Six new findings. The four segmented nerves become multiple `part`s under the existing `nerve` level (the roots pattern): each segment lists its full muscle/sensory set, a proximal segment is a superset of the distal one, and which spared muscle/branch localises the level falls out of the existing scorer (localising findings weigh 3×, over-prediction penalised). No solver/forward changes — findings, structures, `PARTS`, `TERRITORY`, `LOCALISING`, phonebook only.

**Tech Stack:** Node.js ES modules, zero dependencies. Hand-rolled standalone test scripts (repo convention).

## Global Constraints

- **Node is not on PATH.** Prefix every command with `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"`, run from repo root `Code/neurolocaliser-engine/`.
- **No git for this project** (user choice). Each "Checkpoint" step runs the suite and confirms green.
- **UK spelling** everywhere (e.g. "localise").
- **Derive-don't-store:** no syndrome as an `if` rule; the phonebook stays keyed by emergent site id.
- **No new solver mechanism:** `forward.js`, `inverse.js`, `score.js` scoring code all UNCHANGED (only the `LOCALISING` set gains 4 entries).
- **Backward compatibility:** all 13 existing suites must end green. Replacing the four whole-nerve parts changes their site ids, so `pns-nerves.test.js` (site ids) and `tone.test.js` (nerve `wasting` count 13→20) are updated as part of this increment. `pns.test.js` (roots/polyneuropathy) is untouched. If a discriminator resolves unexpectedly, use superpowers:systematic-debugging; do NOT force it by promoting a movement to `LOCALISING`.
- **Spec:** `docs/superpowers/specs/2026-07-13-nerve-segments-complete-innervation-design.md`.

## File Structure

- **Modify** `src/model/findings.js` — 6 findings in `FINDINGS` + 6 `CROSSES` entries.
- **Modify** `src/engine/score.js` — 4 findings into `LOCALISING`.
- **Modify** `src/model/structures.js` — replace the radial/median/ulnar (8) and common-peroneal (4) nerve structures with the 11 segments' structures (incl. per-segment `wasting`); remove the 4 old nerve `wasting` lines from the tone block.
- **Modify** `src/model/sites.js` — `PARTS` (−4, +11) and `TERRITORY` (−4, +11).
- **Modify** `src/data/syndromes.js` — re-key the 4 nerve phonebook entries to segments.
- **Modify** `test/pns-nerves.test.js` — re-point the existence loop + 3 discriminator assertions.
- **Modify** `test/tone.test.js` — nerve `wasting` count 13 → 20.
- **Create** `test/nerve-segments.test.js`.
- **Modify** `package.json`, `README.md`.

Run command used throughout (from `Code/neurolocaliser-engine/`):
```
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/nerve-segments.test.js
```

---

### Task 1: New findings + crossing + localising policy

Foundational vocabulary. Adding findings alone breaks nothing (no structure emits them yet), so the full suite stays green after this task.

**Files:**
- Modify: `src/model/findings.js`, `src/engine/score.js`
- Test: (covered by Task 2's suite; verify via regression here)

**Interfaces:**
- Produces: findings `weak_forearm_pronation`, `weak_thumb_adduction` (non-localising); `deep_peroneal_sensory`, `ulnar_dorsal_sensory`, `median_palmar_sensory`, `ulnar_claw` (localising). All `CROSSES:false`.

- [ ] **Step 1: Add the six findings**

In `src/model/findings.js`, find the `tibial_sensory` finding line:

```js
  tibial_sensory:            { desc: "Sole of foot sensory loss (tibial nerve)", group: "Peripheral nerve" },
```

Insert immediately after it:

```js
  // Complete-innervation increment — movements + spared cutaneous branches + the ulnar claw
  weak_forearm_pronation: { desc: "Weak forearm pronation (pronator teres/quadratus — median)", group: "Movement" },
  weak_thumb_adduction:   { desc: "Weak thumb adduction (adductor pollicis — ulnar; Froment's sign)", group: "Movement" },
  deep_peroneal_sensory:  { desc: "First dorsal web-space sensory loss (deep peroneal nerve)", group: "Peripheral nerve" },
  ulnar_dorsal_sensory:   { desc: "Dorsal ulnar hand sensory loss (dorsal ulnar cutaneous branch — spared at the wrist/Guyon)", group: "Peripheral nerve" },
  median_palmar_sensory:  { desc: "Palmar / thenar-skin sensory loss (palmar cutaneous branch — spared in carpal tunnel)", group: "Peripheral nerve" },
  ulnar_claw:             { desc: "Ulnar claw hand — 4th/5th-digit clawing (worse in DISTAL ulnar lesions — the ulnar paradox)", group: "Peripheral nerve" },
```

- [ ] **Step 2: Add the six `CROSSES` entries**

In `src/model/findings.js`, in the `CROSSES` map, find:

```js
  sciatic_sensory: false, peroneal_sensory: false, tibial_sensory: false,
```

Insert immediately after it:

```js
  // complete-innervation nerve-segment findings — all peripheral, ipsilateral (never cross)
  weak_forearm_pronation: false, weak_thumb_adduction: false,
  deep_peroneal_sensory: false, ulnar_dorsal_sensory: false, median_palmar_sensory: false, ulnar_claw: false,
```

- [ ] **Step 3: Add the four localising findings**

In `src/engine/score.js`, find the named-nerve cutaneous line in the `LOCALISING` set:

```js
  "axillary_sensory","musculocutaneous_sensory","radial_sensory","median_sensory","ulnar_sensory",
  "femoral_sensory","obturator_sensory","lat_fem_cutaneous_sensory","sciatic_sensory","peroneal_sensory","tibial_sensory",
```

Insert immediately after those two lines:

```js
  // nerve-segment cutaneous branches + the ulnar claw — each pins a nerve SEGMENT (level). Movements
  // (weak_forearm_pronation / weak_thumb_adduction) stay NON-localising, like every other movement.
  "deep_peroneal_sensory","ulnar_dorsal_sensory","median_palmar_sensory","ulnar_claw",
```

- [ ] **Step 4: Checkpoint (no git) — regression stays green**

New findings are not emitted by any structure yet, so nothing changes.
Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: the 13 suites unchanged (`8`, `5`, `22`, `8`, `8`, `116`, `62`, `65`, `50`, `91`, `103`, `31`, `34`) — all `0 failed`.

---

### Task 2: The nerve restructure — segments, registration, phonebook, tests

Atomic: `buildSites` needs every segment registered in `PARTS`, and removing the old whole-nerve parts changes ids that the existing tests reference — so the structure edits, registration, phonebook re-key and the test updates land together as one red→green cycle.

**Files:**
- Create: `test/nerve-segments.test.js`
- Modify: `src/model/structures.js`, `src/model/sites.js`, `src/data/syndromes.js`, `test/pns-nerves.test.js`, `test/tone.test.js`

**Interfaces:**
- Consumes: findings from Task 1; `solve`, `expectedFindings`, `STRUCTURES`, `SITE_BY_ID`, `nameForSite`.
- Produces: 11 segment sites `left_nerve_<part>` / `right_nerve_<part>` for parts `radial_axilla`, `radial_spiral_groove`, `radial_pin`, `ulnar_elbow`, `ulnar_wrist`, `median_proximal`, `median_ain`, `median_carpal_tunnel`, `peroneal_common`, `peroneal_deep`, `peroneal_superficial`. Old `left_nerve_radial` / `_median` / `_ulnar` / `_common_peroneal` no longer exist.

- [ ] **Step 1: Write the failing test**

Create `test/nerve-segments.test.js`:

```js
// nerve-segments.test.js — complete nerve innervation + level segments (proximal-vs-distal).
// A segment is a `part` under the `nerve` level; a proximal segment is the SUPERSET of the distal one,
// so which spared muscle / cutaneous branch localises the level emerges from parsimony (no new mechanism):
//   radial  — axilla ⊃ spiral groove ⊃ PIN (triceps, then wrist-drop, then sensory drop away distally)
//   ulnar   — elbow vs wrist (Guyon): FDP4/5 + FCU + dorsal sensory spared distally; ulnar CLAW appears
//             distally (the paradox — intact FDP claws harder)
//   median  — proximal vs AIN (pure motor) vs carpal tunnel (palmar cutaneous spared → palmar sparing)
//   peroneal— common vs deep (eversion spared) vs superficial (dorsiflexion spared)
// Run: node test/nerve-segments.test.js
import { CROSSES, NON_LATERALISED, isFinding } from "../src/model/findings.js";
import { LOCALISING } from "../src/engine/score.js";
import { STRUCTURES } from "../src/model/structures.js";
import { SITE_BY_ID } from "../src/model/sites.js";
import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }

const NEW = ["weak_forearm_pronation","weak_thumb_adduction","deep_peroneal_sensory",
             "ulnar_dorsal_sensory","median_palmar_sensory","ulnar_claw"];
const nerveOf = part => STRUCTURES.filter(s => s.level === "nerve" && s.part === part).map(s => s.produces).sort();

// --- 1: vocabulary & policy ---
for (const id of NEW) ok(`finding ${id} exists`, isFinding(id));
for (const id of NEW) ok(`${id} does not cross (peripheral)`, CROSSES[id] === false);
for (const id of NEW) ok(`${id} is lateralised (not @none)`, !NON_LATERALISED.has(id));
for (const id of ["deep_peroneal_sensory","ulnar_dorsal_sensory","median_palmar_sensory","ulnar_claw"])
  ok(`${id} IS localising`, LOCALISING.has(id));
for (const id of ["weak_forearm_pronation","weak_thumb_adduction"])
  ok(`${id} is NOT localising (movement)`, !LOCALISING.has(id));

// --- 2: registration — segment sites exist, whole-nerve sites gone ---
for (const p of ["radial_axilla","radial_spiral_groove","radial_pin","ulnar_elbow","ulnar_wrist",
                 "median_proximal","median_ain","median_carpal_tunnel",
                 "peroneal_common","peroneal_deep","peroneal_superficial"])
  ok(`left_nerve_${p} exists`, !!SITE_BY_ID[`left_nerve_${p}`]);
for (const p of ["radial","median","ulnar","common_peroneal"])
  ok(`old left_nerve_${p} is gone`, !SITE_BY_ID[`left_nerve_${p}`]);

// --- 3: structure sets (spot-checks of the spared-muscle boundaries) ---
ok("radial_axilla has triceps (elbow ext) + triceps jerk",
   nerveOf("radial_axilla").includes("weak_elbow_extension") && nerveOf("radial_axilla").includes("reflex_triceps_loss"));
ok("radial_spiral_groove spares triceps, keeps wrist ext + sensory",
   !nerveOf("radial_spiral_groove").includes("weak_elbow_extension") &&
   nerveOf("radial_spiral_groove").includes("weak_wrist_extension") && nerveOf("radial_spiral_groove").includes("radial_sensory"));
ok("radial_pin spares wrist ext + all sensory (pure motor finger drop)",
   !nerveOf("radial_pin").includes("weak_wrist_extension") && !nerveOf("radial_pin").includes("radial_sensory") &&
   nerveOf("radial_pin").includes("weak_finger_extension"));
ok("ulnar_elbow has FDP + dorsal sensory, NO claw",
   nerveOf("ulnar_elbow").includes("weak_finger_flexion") && nerveOf("ulnar_elbow").includes("ulnar_dorsal_sensory") &&
   !nerveOf("ulnar_elbow").includes("ulnar_claw"));
ok("ulnar_wrist has claw, spares FDP + dorsal sensory",
   nerveOf("ulnar_wrist").includes("ulnar_claw") && !nerveOf("ulnar_wrist").includes("weak_finger_flexion") &&
   !nerveOf("ulnar_wrist").includes("ulnar_dorsal_sensory"));
ok("median_carpal_tunnel spares palmar cutaneous + all forearm muscles",
   !nerveOf("median_carpal_tunnel").includes("median_palmar_sensory") &&
   !nerveOf("median_carpal_tunnel").includes("weak_forearm_pronation") &&
   nerveOf("median_carpal_tunnel").includes("weak_thumb_abduction") && nerveOf("median_carpal_tunnel").includes("median_sensory"));
ok("median_ain is pure motor (deep flexion + pronation, no thenar/sensory)",
   nerveOf("median_ain").includes("weak_finger_flexion") && nerveOf("median_ain").includes("weak_forearm_pronation") &&
   !nerveOf("median_ain").includes("median_sensory") && !nerveOf("median_ain").includes("weak_thumb_abduction"));
ok("median_proximal has palmar cutaneous + pronation",
   nerveOf("median_proximal").includes("median_palmar_sensory") && nerveOf("median_proximal").includes("weak_forearm_pronation"));
ok("peroneal_deep spares eversion, has first-web sensory",
   !nerveOf("peroneal_deep").includes("weak_foot_eversion") && nerveOf("peroneal_deep").includes("deep_peroneal_sensory"));
ok("peroneal_superficial spares dorsiflexion, has dorsum sensory",
   !nerveOf("peroneal_superficial").includes("weak_ankle_dorsiflexion") && nerveOf("peroneal_superficial").includes("peroneal_sensory"));

// --- 4: discriminators emerge (via solve) ---
const best = set => solve(new Set(set)).best;
// Radial level
ok("wrist+finger drop + triceps weak + lost triceps jerk -> axilla",
   best(["weak_wrist_extension@left","weak_finger_extension@left","weak_elbow_extension@left","reflex_triceps_loss@left","radial_sensory@left"]).site.id === "left_nerve_radial_axilla");
ok("wrist+finger drop + sensory, triceps SPARED -> spiral groove",
   best(["weak_wrist_extension@left","weak_finger_extension@left","radial_sensory@left"]).site.id === "left_nerve_radial_spiral_groove");
ok("finger drop, wrist ext preserved, NO sensory -> PIN",
   best(["weak_finger_extension@left","weak_forearm_supination@left"]).site.id === "left_nerve_radial_pin");
// Ulnar level (the paradox)
ok("intrinsics + Froment + FDP + FCU + dorsal sensory, no claw -> elbow",
   best(["weak_finger_abduction@left","weak_thumb_adduction@left","weak_finger_flexion@left","weak_wrist_flexion@left","ulnar_sensory@left","ulnar_dorsal_sensory@left"]).site.id === "left_nerve_ulnar_elbow");
ok("intrinsics + Froment + CLAW + palmar sensory, FDP/dorsal SPARED -> wrist (paradox)",
   best(["weak_finger_abduction@left","weak_thumb_adduction@left","ulnar_claw@left","ulnar_sensory@left"]).site.id === "left_nerve_ulnar_wrist");
// Median level
ok("thenar weakness + digital sensory, palmar SPARED -> carpal tunnel",
   best(["weak_thumb_abduction@left","median_sensory@left"]).site.id === "left_nerve_median_carpal_tunnel");
ok("pronation + wrist/finger flexion + thenar + digital + palmar sensory -> proximal",
   best(["weak_forearm_pronation@left","weak_wrist_flexion@left","weak_finger_flexion@left","weak_thumb_abduction@left","median_sensory@left","median_palmar_sensory@left"]).site.id === "left_nerve_median_proximal");
ok("deep finger flexion + pronation, no thenar/sensory -> AIN",
   best(["weak_finger_flexion@left","weak_forearm_pronation@left"]).site.id === "left_nerve_median_ain");
// Peroneal branch
ok("dorsiflexion + great-toe ext + eversion + dorsum sensory -> common peroneal",
   best(["weak_ankle_dorsiflexion@left","weak_great_toe_extension@left","weak_foot_eversion@left","peroneal_sensory@left"]).site.id === "left_nerve_peroneal_common");
ok("dorsiflexion + great-toe ext + first-web sensory, eversion SPARED -> deep peroneal",
   best(["weak_ankle_dorsiflexion@left","weak_great_toe_extension@left","deep_peroneal_sensory@left"]).site.id === "left_nerve_peroneal_deep");
ok("eversion + dorsum sensory, dorsiflexion SPARED -> superficial peroneal",
   best(["weak_foot_eversion@left","peroneal_sensory@left"]).site.id === "left_nerve_peroneal_superficial");

// --- 5: phonebook names the segments ---
ok("carpal tunnel names CTS / carpal tunnel",
   /carpal|median/i.test(nameForSite(best(["weak_thumb_abduction@left","median_sensory@left"]).site).name));
ok("spiral groove names Saturday-night / radial",
   /saturday|spiral|radial/i.test(nameForSite(best(["weak_wrist_extension@left","weak_finger_extension@left","radial_sensory@left"]).site).name));

// ---- report ----
console.log("\nNeuroLocaliser — NERVE SEGMENTS (complete innervation) tests\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/nerve-segments.test.js`
Expected: FAIL — the segment sites don't exist and the old whole-nerve sites still do.

- [ ] **Step 3: Replace the radial + median + ulnar nerve structures**

In `src/model/structures.js`, find these eight lines:

```js
  { id: "rad_sens",   level: "nerve", part: "radial", produces: "radial_sensory", note: "radial — dorsal web" },
  { id: "rad_wristext",level: "nerve", part: "radial", produces: "weak_wrist_extension", note: "radial — wrist drop" },
  { id: "rad_fingext",level: "nerve", part: "radial", produces: "weak_finger_extension", note: "radial — finger extensors" },
  { id: "med_sens",   level: "nerve", part: "median", produces: "median_sensory", note: "median — radial 3½ digits" },
  { id: "med_thumbabd",level: "nerve", part: "median", produces: "weak_thumb_abduction", note: "median — APB (carpal tunnel)" },
  { id: "uln_sens",   level: "nerve", part: "ulnar", produces: "ulnar_sensory", note: "ulnar — little finger + medial hand" },
  { id: "uln_fingabd",level: "nerve", part: "ulnar", produces: "weak_finger_abduction", note: "ulnar — interossei" },
  { id: "uln_fingflex",level: "nerve", part: "ulnar", produces: "weak_finger_flexion", note: "ulnar — FDP 4/5" },
```

Replace all eight with (each segment carries its full muscle/sensory set AND its own wasting — co-located):

```js
  // ---- RADIAL nerve segments (axilla ⊃ spiral groove ⊃ PIN) ----
  { id: "rad_ax_tri",    level: "nerve", part: "radial_axilla", produces: "weak_elbow_extension", note: "radial (axilla) — triceps" },
  { id: "rad_ax_trijerk",level: "nerve", part: "radial_axilla", produces: "reflex_triceps_loss", note: "radial (axilla) — triceps jerk lost" },
  { id: "rad_ax_brd",    level: "nerve", part: "radial_axilla", produces: "weak_elbow_flexion", note: "radial (axilla) — brachioradialis" },
  { id: "rad_ax_sup",    level: "nerve", part: "radial_axilla", produces: "weak_forearm_supination", note: "radial (axilla) — supinator" },
  { id: "rad_ax_wr",     level: "nerve", part: "radial_axilla", produces: "weak_wrist_extension", note: "radial (axilla) — wrist drop" },
  { id: "rad_ax_fg",     level: "nerve", part: "radial_axilla", produces: "weak_finger_extension", note: "radial (axilla) — finger extensors" },
  { id: "rad_ax_sens",   level: "nerve", part: "radial_axilla", produces: "radial_sensory", note: "radial (axilla) — dorsal web" },
  { id: "rad_ax_wast",   level: "nerve", part: "radial_axilla", produces: "wasting", note: "radial (axilla) — extensor + triceps wasting" },
  { id: "rad_sg_brd",    level: "nerve", part: "radial_spiral_groove", produces: "weak_elbow_flexion", note: "radial (spiral groove) — brachioradialis" },
  { id: "rad_sg_sup",    level: "nerve", part: "radial_spiral_groove", produces: "weak_forearm_supination", note: "radial (spiral groove) — supinator" },
  { id: "rad_sg_wr",     level: "nerve", part: "radial_spiral_groove", produces: "weak_wrist_extension", note: "radial (spiral groove) — wrist drop; triceps SPARED" },
  { id: "rad_sg_fg",     level: "nerve", part: "radial_spiral_groove", produces: "weak_finger_extension", note: "radial (spiral groove) — finger extensors" },
  { id: "rad_sg_sens",   level: "nerve", part: "radial_spiral_groove", produces: "radial_sensory", note: "radial (spiral groove) — dorsal web" },
  { id: "rad_sg_wast",   level: "nerve", part: "radial_spiral_groove", produces: "wasting", note: "radial (spiral groove) — extensor compartment wasting" },
  { id: "rad_pin_fg",    level: "nerve", part: "radial_pin", produces: "weak_finger_extension", note: "posterior interosseous — finger drop" },
  { id: "rad_pin_sup",   level: "nerve", part: "radial_pin", produces: "weak_forearm_supination", note: "posterior interosseous — supinator" },
  { id: "rad_pin_wast",  level: "nerve", part: "radial_pin", produces: "wasting", note: "posterior interosseous — extensor wasting; wrist ext + sensory SPARED" },

  // ---- MEDIAN nerve segments (proximal ⊃ {AIN | carpal tunnel}) ----
  { id: "med_px_pron",   level: "nerve", part: "median_proximal", produces: "weak_forearm_pronation", note: "median (proximal) — pronator teres" },
  { id: "med_px_wf",     level: "nerve", part: "median_proximal", produces: "weak_wrist_flexion", note: "median (proximal) — FCR" },
  { id: "med_px_ff",     level: "nerve", part: "median_proximal", produces: "weak_finger_flexion", note: "median (proximal) — FDS/FDP2-3/FPL" },
  { id: "med_px_apb",    level: "nerve", part: "median_proximal", produces: "weak_thumb_abduction", note: "median (proximal) — APB" },
  { id: "med_px_sens",   level: "nerve", part: "median_proximal", produces: "median_sensory", note: "median (proximal) — radial 3½ digits" },
  { id: "med_px_palm",   level: "nerve", part: "median_proximal", produces: "median_palmar_sensory", note: "median (proximal) — palmar cutaneous branch" },
  { id: "med_px_wast",   level: "nerve", part: "median_proximal", produces: "wasting", note: "median (proximal) — forearm + thenar wasting" },
  { id: "med_ain_ff",    level: "nerve", part: "median_ain", produces: "weak_finger_flexion", note: "anterior interosseous — FPL/FDP2-3 (pure motor)" },
  { id: "med_ain_pron",  level: "nerve", part: "median_ain", produces: "weak_forearm_pronation", note: "anterior interosseous — pronator quadratus" },
  { id: "med_ain_wast",  level: "nerve", part: "median_ain", produces: "wasting", note: "anterior interosseous — deep-flexor wasting; thenar + sensory SPARED" },
  { id: "med_ct_apb",    level: "nerve", part: "median_carpal_tunnel", produces: "weak_thumb_abduction", note: "median (carpal tunnel) — APB" },
  { id: "med_ct_sens",   level: "nerve", part: "median_carpal_tunnel", produces: "median_sensory", note: "median (carpal tunnel) — radial 3½ digits" },
  { id: "med_ct_wast",   level: "nerve", part: "median_carpal_tunnel", produces: "wasting", note: "median (carpal tunnel) — thenar wasting; forearm + palmar cutaneous SPARED" },

  // ---- ULNAR nerve segments (elbow ⊃ wrist; the CLAW appears distally — the paradox) ----
  { id: "uln_el_fab",    level: "nerve", part: "ulnar_elbow", produces: "weak_finger_abduction", note: "ulnar (elbow) — interossei" },
  { id: "uln_el_tad",    level: "nerve", part: "ulnar_elbow", produces: "weak_thumb_adduction", note: "ulnar (elbow) — adductor pollicis (Froment)" },
  { id: "uln_el_ff",     level: "nerve", part: "ulnar_elbow", produces: "weak_finger_flexion", note: "ulnar (elbow) — FDP 4/5" },
  { id: "uln_el_wf",     level: "nerve", part: "ulnar_elbow", produces: "weak_wrist_flexion", note: "ulnar (elbow) — FCU" },
  { id: "uln_el_sens",   level: "nerve", part: "ulnar_elbow", produces: "ulnar_sensory", note: "ulnar (elbow) — palmar little finger + medial hand" },
  { id: "uln_el_dsens",  level: "nerve", part: "ulnar_elbow", produces: "ulnar_dorsal_sensory", note: "ulnar (elbow) — dorsal ulnar cutaneous" },
  { id: "uln_el_wast",   level: "nerve", part: "ulnar_elbow", produces: "wasting", note: "ulnar (elbow) — intrinsic + forearm wasting" },
  { id: "uln_wr_fab",    level: "nerve", part: "ulnar_wrist", produces: "weak_finger_abduction", note: "ulnar (wrist/Guyon) — interossei" },
  { id: "uln_wr_tad",    level: "nerve", part: "ulnar_wrist", produces: "weak_thumb_adduction", note: "ulnar (wrist/Guyon) — adductor pollicis (Froment)" },
  { id: "uln_wr_claw",   level: "nerve", part: "ulnar_wrist", produces: "ulnar_claw", note: "ulnar (wrist) — claw (intact FDP 4/5 claws harder — the paradox)" },
  { id: "uln_wr_sens",   level: "nerve", part: "ulnar_wrist", produces: "ulnar_sensory", note: "ulnar (wrist) — palmar little finger; FDP/FCU + dorsal sensory SPARED" },
  { id: "uln_wr_wast",   level: "nerve", part: "ulnar_wrist", produces: "wasting", note: "ulnar (wrist) — intrinsic hand wasting" },
```

- [ ] **Step 4: Replace the common-peroneal nerve structures**

In `src/model/structures.js`, find these four lines:

```js
  { id: "cper_sens",  level: "nerve", part: "common_peroneal", produces: "peroneal_sensory", note: "common peroneal — dorsum foot" },
  { id: "cper_df",    level: "nerve", part: "common_peroneal", produces: "weak_ankle_dorsiflexion", note: "common peroneal — foot drop (deep)" },
  { id: "cper_gte",   level: "nerve", part: "common_peroneal", produces: "weak_great_toe_extension", note: "common peroneal — EHL (deep)" },
  { id: "cper_ev",    level: "nerve", part: "common_peroneal", produces: "weak_foot_eversion", note: "common peroneal — peronei (superficial)" },
```

Replace all four with:

```js
  // ---- COMMON PERONEAL segments (common ⊃ {deep | superficial}) ----
  { id: "cper_cm_df",    level: "nerve", part: "peroneal_common", produces: "weak_ankle_dorsiflexion", note: "common peroneal (fibular neck) — foot drop" },
  { id: "cper_cm_gte",   level: "nerve", part: "peroneal_common", produces: "weak_great_toe_extension", note: "common peroneal — EHL" },
  { id: "cper_cm_ev",    level: "nerve", part: "peroneal_common", produces: "weak_foot_eversion", note: "common peroneal — peronei" },
  { id: "cper_cm_sens",  level: "nerve", part: "peroneal_common", produces: "peroneal_sensory", note: "common peroneal — dorsum of foot" },
  { id: "cper_cm_dsens", level: "nerve", part: "peroneal_common", produces: "deep_peroneal_sensory", note: "common peroneal — first dorsal web" },
  { id: "cper_cm_wast",  level: "nerve", part: "peroneal_common", produces: "wasting", note: "common peroneal — anterolateral compartment wasting" },
  { id: "cper_dp_df",    level: "nerve", part: "peroneal_deep", produces: "weak_ankle_dorsiflexion", note: "deep peroneal — tibialis anterior" },
  { id: "cper_dp_gte",   level: "nerve", part: "peroneal_deep", produces: "weak_great_toe_extension", note: "deep peroneal — EHL" },
  { id: "cper_dp_dsens", level: "nerve", part: "peroneal_deep", produces: "deep_peroneal_sensory", note: "deep peroneal — first dorsal web; eversion SPARED" },
  { id: "cper_dp_wast",  level: "nerve", part: "peroneal_deep", produces: "wasting", note: "deep peroneal — anterior compartment wasting" },
  { id: "cper_sf_ev",    level: "nerve", part: "peroneal_superficial", produces: "weak_foot_eversion", note: "superficial peroneal — peronei" },
  { id: "cper_sf_sens",  level: "nerve", part: "peroneal_superficial", produces: "peroneal_sensory", note: "superficial peroneal — dorsum of foot; dorsiflexion SPARED" },
  { id: "cper_sf_wast",  level: "nerve", part: "peroneal_superficial", produces: "wasting", note: "superficial peroneal — lateral compartment wasting" },
```

- [ ] **Step 5: Remove the four old nerve `wasting` lines from the tone block**

In `src/model/structures.js`, find these three consecutive lines and delete them (their segment wasting now lives with the segments above):

```js
  { id: "rad_wasting", level: "nerve", part: "radial", produces: "wasting", note: "radial — extensor compartment wasting" },
  { id: "med_wasting", level: "nerve", part: "median", produces: "wasting", note: "median — thenar wasting" },
  { id: "uln_wasting", level: "nerve", part: "ulnar", produces: "wasting", note: "ulnar — hypothenar/interosseous wasting" },
```

Then find and delete this line:

```js
  { id: "cper_wasting", level: "nerve", part: "common_peroneal", produces: "wasting", note: "common peroneal — anterolateral compartment wasting" },
```

- [ ] **Step 6: Register the segment parts in `PARTS`**

In `src/model/sites.js`, find:

```js
  "axillary", "musculocutaneous", "suprascapular", "long_thoracic", "radial", "median", "ulnar",
  "femoral", "obturator", "lat_fem_cutaneous", "superior_gluteal", "sciatic", "common_peroneal", "tibial"];
```

Replace with (drop `radial`, `median`, `ulnar`, `common_peroneal`; add the 11 segments):

```js
  "axillary", "musculocutaneous", "suprascapular", "long_thoracic",
  "radial_axilla", "radial_spiral_groove", "radial_pin",
  "median_proximal", "median_ain", "median_carpal_tunnel",
  "ulnar_elbow", "ulnar_wrist",
  "femoral", "obturator", "lat_fem_cutaneous", "superior_gluteal", "sciatic",
  "peroneal_common", "peroneal_deep", "peroneal_superficial", "tibial"];
```

- [ ] **Step 7: Update `TERRITORY`**

In `src/model/sites.js`, find these four lines:

```js
  "nerve|radial":           "radial nerve (C5-T1, posterior cord)",
  "nerve|median":           "median nerve (C6-T1) — carpal tunnel at the wrist",
  "nerve|ulnar":            "ulnar nerve (C8-T1, medial cord)",
```

Replace with:

```js
  "nerve|radial_axilla":         "radial nerve at the axilla (crutch palsy — triceps involved)",
  "nerve|radial_spiral_groove":  "radial nerve at the spiral groove (Saturday-night palsy — triceps spared)",
  "nerve|radial_pin":            "posterior interosseous nerve (finger drop, wrist extension + sensation spared)",
  "nerve|median_proximal":       "median nerve proximal forearm (pronator / supracondylar)",
  "nerve|median_ain":            "anterior interosseous nerve (pure-motor deep flexors)",
  "nerve|median_carpal_tunnel":  "median nerve at the carpal tunnel (CTS — palmar cutaneous spared)",
  "nerve|ulnar_elbow":           "ulnar nerve at the elbow (cubital tunnel)",
  "nerve|ulnar_wrist":           "ulnar nerve at the wrist (Guyon's canal — FDP + dorsal branch spared, worse claw)",
```

Then find:

```js
  "nerve|common_peroneal":  "common peroneal (fibular) nerve (L4-S1) — fibular neck",
```

Replace with:

```js
  "nerve|peroneal_common":       "common peroneal nerve at the fibular neck",
  "nerve|peroneal_deep":         "deep peroneal nerve (dorsiflexion + great-toe ext; eversion spared)",
  "nerve|peroneal_superficial":  "superficial peroneal nerve (eversion; dorsiflexion spared)",
```

- [ ] **Step 8: Re-key the phonebook**

In `src/data/syndromes.js`, find and replace `nerve_radial:` … through `nerve_ulnar:` (the three entries) and separately `nerve_common_peroneal:`. Replace the radial entry:

```js
  nerve_radial: { name: "Radial nerve palsy (wrist drop)", note: "Weak wrist and finger extension (wrist drop) with sensory loss over the dorsal web; the triceps is spared in a spiral-groove ('Saturday-night') lesion.", ddx: ["Spiral-groove compression (Saturday-night palsy)", "Humeral shaft fracture", "PIN entrapment (spares wrist, no sensory)", "Lead toxicity"], red: "Distinguish a radial palsy from a C7 root and a central lesion — finger drop with preserved reflexes and a dorsal-web sensory patch points to the nerve." },
```

with:

```js
  nerve_radial_axilla: { name: "Radial nerve palsy at the axilla (crutch palsy)", note: "Weak elbow extension (triceps), wrist and finger extension, with a lost triceps jerk and dorsal-web sensory loss — a high radial lesion.", ddx: ["Crutch / 'Saturday-night' compression in the axilla", "Shoulder dislocation", "Humeral fracture"], red: "Triceps weakness + lost triceps jerk marks a lesion above the spiral groove — separate from a C7 root by the intact dermatome/other C7 muscles." },
  nerve_radial_spiral_groove: { name: "Radial nerve palsy at the spiral groove (Saturday-night)", note: "Wrist drop and finger drop with dorsal-web sensory loss, but the TRICEPS is spared (jerk preserved) — the classic humeral spiral-groove compression.", ddx: ["Saturday-night palsy (compression)", "Humeral shaft fracture", "Lead toxicity"], red: "Wrist drop with a preserved triceps jerk localises to the spiral groove, not the axilla." },
  nerve_radial_pin: { name: "Posterior interosseous nerve palsy", note: "Finger (and thumb) drop with the WRIST EXTENSION preserved (radial deviation on extension) and NO sensory loss — a pure-motor deep branch lesion.", ddx: ["PIN entrapment (arcade of Frohse)", "Rheumatoid synovitis", "Ganglion / lipoma"], red: "Finger drop with a preserved wrist extension and no sensory loss is the PIN, not a spiral-groove radial palsy." },
```

Replace the median entry:

```js
  nerve_median: { name: "Median nerve palsy (carpal tunnel)", note: "Weak thumb abduction (APB) with thenar wasting and sensory loss over the radial 3½ digits — the carpal-tunnel presentation.", ddx: ["Carpal tunnel syndrome", "Pronator / AIN syndrome (proximal)", "Hypothyroidism / pregnancy / RA (predisposing)"], red: "Nocturnal hand paraesthesiae with thenar wasting is carpal tunnel — treat before permanent wasting." },
```

with:

```js
  nerve_median_proximal: { name: "Proximal median nerve palsy (pronator)", note: "Weak pronation, wrist and finger flexion and thumb abduction with digital AND palmar sensory loss — a forearm-level median lesion.", ddx: ["Pronator syndrome", "Supracondylar fracture", "Ligament of Struthers"], red: "Median weakness that includes pronation and forearm flexors (not just thenar) localises proximal to the carpal tunnel." },
  nerve_median_ain: { name: "Anterior interosseous nerve palsy", note: "Weak thumb and index flexion (FPL/FDP2) — a failed 'OK' sign — with pronator quadratus weakness and NO sensory loss; a pure-motor deep-branch lesion.", ddx: ["AIN neuritis (Parsonage-Turner)", "Forearm trauma", "Compression"], red: "An inability to make the 'OK' sign with no sensory loss is the anterior interosseous nerve." },
  nerve_median_carpal_tunnel: { name: "Median nerve palsy (carpal tunnel syndrome)", note: "Weak thumb abduction (APB) with thenar wasting and digital sensory loss over the radial 3½ digits — but the PALM (palmar cutaneous branch) is spared.", ddx: ["Carpal tunnel syndrome", "Hypothyroidism / pregnancy / RA (predisposing)"], red: "Nocturnal hand paraesthesiae with thenar wasting and palmar sparing is carpal tunnel — treat before permanent wasting." },
```

Replace the ulnar entry:

```js
  nerve_ulnar: { name: "Ulnar nerve palsy", note: "Weak finger abduction (interossei) and FDP 4/5 with sensory loss over the little finger and medial hand; thumb abduction (median) is spared.", ddx: ["Cubital tunnel (elbow)", "Guyon's canal (wrist)", "Trauma", "Leprosy (worldwide)"], red: "Sparing of thumb abduction separates an ulnar lesion from a C8/T1 root — and dorsal-hand sensory loss localises it above the wrist." },
```

with:

```js
  nerve_ulnar_elbow: { name: "Ulnar nerve palsy at the elbow (cubital tunnel)", note: "Weak interossei, thumb adduction (Froment), FDP 4/5 and FCU, with palmar AND dorsal-hand sensory loss — a lesion at the elbow.", ddx: ["Cubital tunnel syndrome", "Elbow trauma / OA", "Leprosy (worldwide)"], red: "Dorsal-hand sensory loss and FDP/FCU weakness localise the ulnar lesion to the elbow, not the wrist." },
  nerve_ulnar_wrist: { name: "Ulnar nerve palsy at the wrist (Guyon's canal)", note: "Weak interossei and thumb adduction (Froment) with a MORE pronounced claw (intact FDP 4/5), sparing the FDP, FCU and dorsal-hand sensation — the ulnar paradox.", ddx: ["Guyon's canal compression (handlebar palsy, ganglion)", "Hook-of-hamate fracture", "Trauma"], red: "A worse claw with spared FDP and dorsal-hand sensation localises the ulnar lesion to the wrist — the paradox that the distal lesion looks worse." },
```

Replace the common-peroneal entry:

```js
  nerve_common_peroneal: { name: "Common peroneal (fibular) nerve palsy", note: "Foot drop — weak ankle dorsiflexion, great-toe extension and eversion — with sensory loss over the dorsum of the foot; INVERSION, plantarflexion and the ankle jerk are spared.", ddx: ["Fibular-neck compression (crossed legs, plaster, weight loss)", "Trauma", "Ganglion", "Vasculitis (mononeuritis)"], red: "Foot drop with SPARED inversion and hip abduction is peroneal, not L5 — the spared movements are the whole discriminator." },
```

with:

```js
  nerve_peroneal_common: { name: "Common peroneal (fibular) nerve palsy", note: "Foot drop — weak ankle dorsiflexion, great-toe extension AND eversion — with dorsum-of-foot sensory loss; inversion, plantarflexion and the ankle jerk are spared.", ddx: ["Fibular-neck compression (crossed legs, plaster, weight loss)", "Trauma", "Ganglion", "Vasculitis (mononeuritis)"], red: "Foot drop with SPARED inversion and hip abduction is peroneal, not L5 — the spared movements are the whole discriminator." },
  nerve_peroneal_deep: { name: "Deep peroneal nerve palsy", note: "Weak ankle dorsiflexion and great-toe extension with first dorsal web-space sensory loss; EVERSION is spared (superficial peroneal intact).", ddx: ["Anterior compartment / deep-branch entrapment", "Anterior tarsal tunnel", "Trauma"], red: "Foot drop with spared eversion localises below the peroneal bifurcation to the deep branch." },
  nerve_peroneal_superficial: { name: "Superficial peroneal nerve palsy", note: "Weak foot eversion with sensory loss over the dorsum of the foot; DORSIFLEXION and great-toe extension are spared.", ddx: ["Lateral compartment entrapment", "Ankle sprain / trauma", "Fascial defect"], red: "Weak eversion with preserved dorsiflexion is the superficial peroneal branch." },
```

- [ ] **Step 9: Re-point `pns-nerves.test.js` (site ids)**

In `test/pns-nerves.test.js`, replace the nerve-existence loop:

```js
for (const n of ["median","ulnar","radial","axillary","musculocutaneous","common_peroneal","tibial","femoral","superior_gluteal","long_thoracic","lat_fem_cutaneous"])
  ok(`left_nerve_${n} exists`, !!SITE_BY_ID[`left_nerve_${n}`]);
```

with (segmented nerves use their segment ids; unsegmented unchanged):

```js
for (const n of ["median_carpal_tunnel","ulnar_elbow","radial_spiral_groove","axillary","musculocutaneous","peroneal_common","tibial","femoral","superior_gluteal","long_thoracic","lat_fem_cutaneous"])
  ok(`left_nerve_${n} exists`, !!SITE_BY_ID[`left_nerve_${n}`]);
```

In the same file, replace the common-peroneal assertion:

```js
  ok("foot drop + eversion + dorsal-foot sensory, inversion SPARED -> common peroneal",
     peroneal && peroneal.site.id === "left_nerve_common_peroneal");
```

with:

```js
  ok("foot drop + eversion + dorsal-foot sensory, inversion SPARED -> common peroneal",
     peroneal && peroneal.site.id === "left_nerve_peroneal_common");
```

Replace the ulnar-vs-root assertion (a minimal ulnar picture fits the smaller distal site by parsimony, so accept any ulnar segment — the point of this test is ulnar-nerve-beats-C8-root):

```js
  const ulnar = solve(new Set(["ulnar_sensory@left","weak_finger_abduction@left"])).best;
  ok("intrinsic weakness + ulnar sensory, thumb abduction SPARED -> ulnar nerve", ulnar && ulnar.site.id === "left_nerve_ulnar");
```

with:

```js
  const ulnar = solve(new Set(["ulnar_sensory@left","weak_finger_abduction@left"])).best;
  ok("intrinsic weakness + ulnar sensory, thumb abduction SPARED -> an ulnar nerve segment",
     ulnar && ulnar.site.level === "nerve" && /^ulnar_/.test(ulnar.site.part));
```

Replace the median carpal-tunnel assertion:

```js
  const ct = solve(new Set(["median_sensory@left","weak_thumb_abduction@left"])).best;
  ok("median territory + thumb abduction -> median (carpal tunnel)", ct && ct.site.id === "left_nerve_median");
```

with:

```js
  const ct = solve(new Set(["median_sensory@left","weak_thumb_abduction@left"])).best;
  ok("median territory + thumb abduction -> median carpal tunnel", ct && ct.site.id === "left_nerve_median_carpal_tunnel");
```

- [ ] **Step 10: Update `tone.test.js` (nerve wasting count 13 → 20)**

In `test/tone.test.js`, replace:

```js
ok("wasting at 13 motor nerves (every named nerve EXCEPT pure-sensory lat_fem_cutaneous)",
   producersOf("wasting").filter(s => s.level === "nerve").length === 13);
```

with:

```js
ok("wasting at 20 motor-nerve sites (9 unsegmented + 11 segments; EXCEPT pure-sensory lat_fem_cutaneous)",
   producersOf("wasting").filter(s => s.level === "nerve").length === 20);
```

- [ ] **Step 11: Run the new suite to verify it passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/nerve-segments.test.js`
Expected: PASS — `62 passed, 0 failed`.

- [ ] **Step 12: Checkpoint (no git) — full regression**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: the 13 existing suites green (with `pns-nerves.test.js` still 103 and `tone.test.js` still 34 after the id/count updates). `nerve-segments.test.js` is not yet in the chain (Task 3). If a discriminator misfires, use superpowers:systematic-debugging — check the scored candidates with `rankSingle`, do not promote a movement to `LOCALISING`.

---

### Task 3: Wire-up — test script & README

**Files:**
- Modify: `package.json` (the `scripts.test` line), `README.md` (Running + Status)

**Interfaces:**
- Consumes: `test/nerve-segments.test.js` from Task 2.
- Produces: `npm test` runs all 14 suites.

- [ ] **Step 1: Update the test script**

In `package.json`, replace the tail of the `scripts.test` chain:

```json
 && node test/reflexes.test.js && node test/tone.test.js"
```

with:

```json
 && node test/reflexes.test.js && node test/tone.test.js && node test/nerve-segments.test.js"
```

- [ ] **Step 2: Run the whole suite via npm**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: 14 blocks, the last being `62 passed, 0 failed`, exit code 0.

- [ ] **Step 3: Update the README — Running list**

In `README.md`, under `## Running`, add after the `node test/tone.test.js …` line:

```
node test/nerve-segments.test.js # complete nerve innervation + level segments (radial/ulnar/median/peroneal)
```

- [ ] **Step 4: Update the README — Status paragraph**

In `README.md`, find the line:

```
The visual pathway (chiasm onward) and a pathology layer (ALS and friends) are the remaining pieces.
```

Insert this paragraph immediately BEFORE it:

```
Each named nerve now carries its full motor innervation, and the four classically-segmented nerves are
split into level segments so the proximal-vs-distal lesion localises: radial (axilla with triceps →
spiral groove with the triceps spared → posterior interosseous with the wrist extension and sensation
spared), median (proximal → anterior interosseous, pure motor → carpal tunnel with palmar sparing),
ulnar (elbow → wrist/Guyon), and common peroneal (common → deep vs superficial). A proximal segment is
the superset of the distal one, so the spared muscle or cutaneous branch is the localiser — pure
parsimony, no new mechanism. The ulnar paradox falls out of the anatomy: because the wrist lesion spares
FDP 4/5, the intact long flexors claw the fingers harder, so the ulnar claw is emitted by the distal
(wrist) segment and the more distal lesion looks worse.
```

- [ ] **Step 5: Checkpoint (no git)**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: all 14 suites green, exit 0.

---

### Post-plan (orchestrator, not a subagent step)

After Task 3 is green: refresh project memory (`neurolocaliser-engine-state`) — nerve segments done (radial/median/ulnar/peroneal split; 6 new findings incl. ulnar_claw paradox; wasting 20 nerve sites), new counts (14 suites, 665 assertions = prior 603 + 62), and strike refinement (b) off the REQUIRED list. The Artifact anatomy-model nerve section update stays deferred with the reflexes/tone sync the user postponed.

## Self-Review

**Spec coverage:**
- 6 findings + `CROSSES` → Task 1 Steps 1–2. ✓
- 4 findings → `LOCALISING` (2 movements excluded) → Task 1 Step 3. ✓
- Radial/median/ulnar segments + peroneal segments (structures, incl. per-segment wasting; old wasting removed) → Task 2 Steps 3–5. ✓
- `PARTS` (−4, +11) + `TERRITORY` (−4, +11) → Task 2 Steps 6–7. ✓
- Phonebook re-key (radial×3, median×3, ulnar×2, peroneal×3) → Task 2 Step 8. ✓
- Ulnar paradox (`ulnar_claw` at wrist only) → structures Step 3 + discriminator + set-check tests Step 1. ✓
- Spared cutaneous branches (`ulnar_dorsal_sensory` elbow-only, `median_palmar_sensory` proximal-only) → Step 3 + tests. ✓
- Existing-test updates (`pns-nerves` ids, `tone` count) → Task 2 Steps 9–10. ✓
- Discriminator emergence (radial/ulnar/median/peroneal) → new suite §4. ✓
- Wire-up → Task 3. ✓
- Out-of-scope (sciatic division, tarsal tunnel, opposition/extension findings, claw grading) → no tasks. ✓

**Placeholder scan:** No TBD/TODO; every code step shows complete code; every run step states the exact command and expected output. ✓

**Type consistency:** every structure produces a finding that exists (existing movements/reflex/sensory + the 6 new); segment part names identical across structures/`PARTS`/`TERRITORY`/tests/phonebook (`radial_axilla`, `radial_spiral_groove`, `radial_pin`, `median_proximal`, `median_ain`, `median_carpal_tunnel`, `ulnar_elbow`, `ulnar_wrist`, `peroneal_common`, `peroneal_deep`, `peroneal_superficial`); site ids `left_nerve_<part>` match `nameForSite` keys `nerve_<part>`; nerve wasting count = 9 unsegmented (axillary, musculocutaneous, suprascapular, long_thoracic, femoral, obturator, superior_gluteal, sciatic, tibial) + 11 segments = 20, matching the updated `tone.test.js` assertion.

**Assertion tally (new suite):** §1 vocabulary 6 (exist) + 6 (CROSSES) + 6 (lateralised) + 4 (localising yes) + 2 (localising no) = 24; §2 registration 11 (exist) + 4 (gone) = 15; §3 structure sets 10; §4 discriminators 11; §5 phonebook 2 → **total 62** (matches Task 2 Step 11 and Task 3 Step 2).

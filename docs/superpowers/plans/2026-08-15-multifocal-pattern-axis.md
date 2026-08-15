# Multifocal Pattern Axis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** not started. Spec: `docs/superpowers/specs/2026-08-15-multifocal-pattern-axis-design.md`.

**Goal:** Replace the cross-site roster's "are there two sites?" trigger with "does this disease produce *this shape* of dissemination?", so leptomeningeal disease and paraneoplastic syndrome stop firing on two motor-strip lesions and multiple sclerosis starts.

**Architecture:** Two new authored per-`level|part` tables (`vascular.js` — vessel/segment/branch/zone; `topography.js` — lobe/surface/system), one new derived predicate module (`space.js` — `separatedInSpace` across five axes), and a `pattern` field on each roster entity that replaces `spread`. Pattern mismatch is a HARD filter, alongside the existing `compartments` allow-list; tempo and course remain the only soft axes.

**Tech Stack:** Zero-dependency ES modules, Node v24, no build step, no test framework.

## Global Constraints

- **Node is not on PATH.** Prefix every command: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"`. Do not re-diagnose "node not found" — the runtime exists, it is just off PATH.
- **Zero dependencies.** No `npm install`, no `node_modules`, no build step, no linter. `"type": "module"`.
- **Every new test suite** must be added to the `test` script in `package.json` **and** to the README suite list.
- **House test style:** standalone script; `let pass = 0, fail = 0; const log = [];` plus `function ok(label, cond, detail = "")`; print `PASS`/`FAIL` lines; `process.exit(fail === 0 ? 0 : 1)`. Copy the header shape from `test/compartments.test.js`.
- **Tables are keyed by `` `${level}|${part}` ``, never by `part` alone.** Four part names collide across levels (`lateral`, `hemi`, `medial`, `anterior`), giving 94 distinct names but **104** distinct keys. Keying on the bare name would give lateral medulla (PICA) and lateral midbrain one shared row — a silent clinical error.
- **`segment: null` is a deliberate statement, never an unfilled cell.** Every null carries a reason in `SEGMENT_NULL_REASON`, and an invariant asserts every null is accounted for — the same shape as `NOT_LOCALISING_BY_DESIGN` in `score.js`.
- **Derive, don't store.** `separatedInSpace()` is computed from the tables; separation is never a stored field.
- **Content and logic stay apart.** `src/model/vascular.js` and `src/model/topography.js` are data with no logic and import NOTHING. `src/engine/space.js` and `src/engine/multifocal.js` are logic with no clinical content.
- **Build every test probe from `expectedFindings()` of a real site**, never from hand-typed finding tokens — an unmodelled token is silently non-localising and fakes either failure mode.
- **Clinical-accuracy norm:** the vascular and topography tables are clinical content at the roster's bar. Flag anything uncertain for the owner (a clinician) rather than guessing.
- **Run the full suite before every commit:** `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`. Baseline: **60 suites / 3519 assertions, 0 failed**.

## File Structure

| File | Responsibility |
|---|---|
| `src/model/vascular.js` (new) | `VESSELS`, `SEGMENTS`, `ZONES` vocabularies; `VASCULAR` table (104 keys); `SEGMENT_NULL_REASON`; `vascularOf(site)` |
| `src/model/topography.js` (new) | `LOBES`, `SYSTEMS` vocabularies; `TOPOGRAPHY` table (104 keys); `topographyOf(site)` |
| `src/engine/space.js` (new) | `SEPARATION_AXES`; `separatedInSpace(sites, axis)` |
| `src/engine/multifocal.js` (modify) | `patternMatches(pattern, sites, observedSet)`; replace the `spread` branch |
| `src/data/multifocal.js` (modify) | Entities: `spread` → `pattern`; remove `spread` from the shape |
| `test/vascular.test.js`, `test/topography.test.js`, `test/space.test.js` (new) | Table + predicate invariants |
| `test/multifocal.test.js` (modify) | Pattern emergence + the owner's six verdicts |

---

### Task 1: Vascular table — anterior circulation (45 keys)

**Files:**
- Create: `src/model/vascular.js`
- Create: `test/vascular.test.js`
- Modify: `package.json`, `README.md`

**Interfaces:**
- Consumes: `candidateSites()` from `src/engine/inverse.js` (tests only)
- Produces: `VESSELS`, `SEGMENTS`, `ZONES` (arrays of strings), `VASCULAR` (object keyed `` `${level}|${part}` ``), `SEGMENT_NULL_REASON` (object key → reason string), `vascularOf(site) -> {vessel, segment, branch, zone} | null`

> **⚠ CLINICAL CONTENT — the owner (a clinician) must review this batch before Task 2 starts.** Present it as a table: key · vessel · segment · branch · zone.

- [ ] **Step 1: Write the failing test**

Create `test/vascular.test.js`:

```js
// vascular.test.js — the authored vascular axis.
//
// `site.territory` is human-readable prose ("MCA superior division (precentral — face/arm motor)") and
// none of the 211 distinct strings carries a vessel segment, so branch-level resolution cannot be parsed
// out of it — it has to be authored. This table is that authoring.
//
// Keyed by `${level}|${part}`, NOT by part alone: four part names (`lateral`, `hemi`, `medial`,
// `anterior`) are reused across levels, so a bare-name key would give lateral medulla (PICA) and lateral
// midbrain one shared row.
//
// Spec: docs/superpowers/specs/2026-08-15-multifocal-pattern-axis-design.md §1
// Run: node test/vascular.test.js
import { VESSELS, SEGMENTS, ZONES, VASCULAR, SEGMENT_NULL_REASON, vascularOf } from "../src/model/vascular.js";
import { candidateSites } from "../src/engine/inverse.js";
import { compartmentOf } from "../src/model/compartments.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond, detail = "") { log.push({ label, ok: !!cond, detail }); cond ? pass++ : fail++; }

const CNS = new Set(["brain", "brainstem", "cerebellum", "cord", "optic"]);
const cnsKeys = [...new Set(candidateSites().filter(s => CNS.has(compartmentOf(s))).map(s => `${s.level}|${s.part}`))];

// --- 1: vocabularies are closed ---
{
  const badVessel = Object.entries(VASCULAR).filter(([, v]) => !VESSELS.includes(v.vessel));
  ok(`every vessel is in the declared vocabulary (${badVessel.length} bad)`, badVessel.length === 0,
     badVessel.map(([k, v]) => `${k}:${v.vessel}`).slice(0, 5).join(" · "));
  const badSeg = Object.entries(VASCULAR).filter(([, v]) => v.segment !== null && !SEGMENTS.includes(v.segment));
  ok(`every segment is in the declared vocabulary or null (${badSeg.length} bad)`, badSeg.length === 0,
     badSeg.map(([k, v]) => `${k}:${v.segment}`).slice(0, 5).join(" · "));
  const badZone = Object.entries(VASCULAR).filter(([, v]) => !ZONES.includes(v.zone));
  ok(`every zone is in the declared vocabulary (${badZone.length} bad)`, badZone.length === 0,
     badZone.map(([k, v]) => `${k}:${v.zone}`).slice(0, 5).join(" · "));
}

// --- 2: every `segment: null` is DELIBERATE, with a reason ---
// A null must never be an unfilled cell. Same shape as NOT_LOCALISING_BY_DESIGN in score.js.
{
  const nulls = Object.entries(VASCULAR).filter(([, v]) => v.segment === null).map(([k]) => k);
  const unexplained = nulls.filter(k => !SEGMENT_NULL_REASON[k] || !String(SEGMENT_NULL_REASON[k]).trim());
  ok(`every null segment states a reason (${unexplained.length} unexplained of ${nulls.length})`,
     unexplained.length === 0, unexplained.slice(0, 6).join(" · "));
  const stale = Object.keys(SEGMENT_NULL_REASON).filter(k => VASCULAR[k] && VASCULAR[k].segment !== null);
  ok(`no reason is recorded for a key that HAS a segment (${stale.length} stale)`, stale.length === 0,
     stale.slice(0, 5).join(" · "));
}

// --- 3: the collision the key format exists to prevent ---
{
  ok("lateral medulla and lateral midbrain have DIFFERENT rows",
     VASCULAR["medulla|lateral"] && VASCULAR["midbrain|lateral"] &&
     VASCULAR["medulla|lateral"].vessel !== VASCULAR["midbrain|lateral"].vessel);
  ok("lateral medulla is PICA", VASCULAR["medulla|lateral"]?.vessel === "PICA");
}

// --- 4: vascularOf() resolves a site through the level|part key ---
{
  const site = candidateSites().find(s => s.id === "left_cortex_motor_facearm");
  const v = vascularOf(site);
  ok("vascularOf resolves a real site", !!v && v.vessel === "MCA" && v.segment === "M4");
  ok("vascularOf returns null for a site with no row", vascularOf({ level: "zz", part: "zz" }) === null);
}

// --- 5: BATCH 1 COVERAGE (anterior circulation) — later batches extend this ---
{
  const batch1 = cnsKeys.filter(k => /^(cortex|subcortex|basal_ganglia|aphasia_subcortical)\|/.test(k));
  const missing = batch1.filter(k => !VASCULAR[k]);
  ok(`every anterior-circulation key has a row (${missing.length} missing of ${batch1.length})`,
     missing.length === 0, missing.slice(0, 8).join(" · "));
}

for (const l of log) console.log(`${l.ok ? "PASS" : "FAIL"}  ${l.label}${l.detail && !l.ok ? `  [${l.detail}]` : ""}`);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run it to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/vascular.test.js`
Expected: FAIL — `Cannot find module '.../src/model/vascular.js'`

- [ ] **Step 3: Create the table with the anterior-circulation batch**

Create `src/model/vascular.js`:

```js
// vascular.js — the AUTHORED vascular axis: which vessel, and at what branch level.
//
// Why authored and not derived: `site.territory` is human-readable prose ("MCA superior division
// (precentral — face/arm motor)"), and NONE of the 211 distinct territory strings carries a vessel
// segment. Branch-level resolution cannot be parsed out of it.
//
// KEYED BY `${level}|${part}`, NEVER BY PART ALONE. Four part names are reused across levels —
// `lateral` (midbrain, pons, medulla, cord, hypothalamus), `hemi` (four levels), `medial`, `anterior` —
// so a bare-name key would give lateral medulla (PICA) and lateral midbrain one shared row. causes.js
// resolves keys as `${level}_${part}` for the same reason.
//
// Spec: docs/superpowers/specs/2026-08-15-multifocal-pattern-axis-design.md §1

export const VESSELS = [
  "ACA", "MCA", "PCA", "ACA-MCA", "MCA-PCA", "anterior choroidal", "anterior communicating",
  "BA", "PICA", "AICA", "SCA", "vertebral", "vertebrobasilar",
  "anterior spinal", "posterior spinal", "ophthalmic", "posterior ciliary", "none",
];

export const SEGMENTS = ["M1", "M2", "M3", "M4", "A1", "A2", "A3", "A4", "P1", "P2", "P3", "P4"];

export const ZONES = ["cortical", "perforator", "watershed", "brainstem", "cord", "nonvascular"];

export const VASCULAR = {
  // ---- cortex (33) ----
  "cortex|motor_facearm":   { vessel: "MCA", segment: "M4", branch: "precentral", zone: "cortical" },
  "cortex|motor_leg":       { vessel: "ACA", segment: "A4", branch: "paracentral", zone: "cortical" },
  "cortex|sensory_facearm": { vessel: "MCA", segment: "M4", branch: "postcentral", zone: "cortical" },
  "cortex|sensory_leg":     { vessel: "ACA", segment: "A4", branch: "paracentral", zone: "cortical" },
  "cortex|sensory_hand":    { vessel: "MCA", segment: "M4", branch: "postcentral (hand)", zone: "cortical" },
  "cortex|hand_knob":       { vessel: "MCA", segment: "M4", branch: "precentral (hand knob)", zone: "cortical" },
  "cortex|paracentral":     { vessel: "ACA", segment: "A4", branch: "paracentral", zone: "cortical" },
  "cortex|premotor":        { vessel: "MCA", segment: "M4", branch: "precentral / middle frontal", zone: "cortical" },
  "cortex|sma":             { vessel: "ACA", segment: "A3", branch: "medial frontal (SMA)", zone: "cortical" },
  "cortex|frontal_eye_field":{ vessel: "MCA", segment: "M4", branch: "middle frontal", zone: "cortical" },
  "cortex|operculum":       { vessel: "MCA", segment: "M3", branch: "frontal operculum", zone: "cortical" },
  "cortex|dlpfc":           { vessel: "MCA", segment: "M4", branch: "prefrontal", zone: "cortical" },
  "cortex|medial_pfc":      { vessel: "ACA", segment: "A3", branch: "callosomarginal", zone: "cortical" },
  "cortex|orbitofrontal":   { vessel: "ACA", segment: "A2", branch: "orbitofrontal", zone: "cortical" },
  "cortex|parietal":        { vessel: "MCA", segment: "M4", branch: "inferior parietal", zone: "cortical" },
  "cortex|angular":         { vessel: "MCA", segment: "M4", branch: "angular", zone: "cortical" },
  "cortex|temporoparietal": { vessel: "MCA", segment: "M4", branch: "posterior temporal", zone: "cortical" },
  "cortex|temporal":        { vessel: "MCA", segment: "M4", branch: "middle temporal", zone: "cortical" },
  "cortex|anterior_temporal":{ vessel: "MCA", segment: "M4", branch: "anterior temporal", zone: "cortical" },
  "cortex|auditory":        { vessel: "MCA", segment: "M4", branch: "Heschl / superior temporal", zone: "cortical" },
  "cortex|insula":          { vessel: "MCA", segment: "M2", branch: "insular", zone: "cortical" },
  "cortex|occipital":       { vessel: "PCA", segment: "P4", branch: "calcarine", zone: "cortical" },
  "cortex|fusiform":        { vessel: "PCA", segment: "P4", branch: "posterior temporal", zone: "cortical" },
  "cortex|mca_superior":    { vessel: "MCA", segment: "M2", branch: "superior division", zone: "cortical" },
  "cortex|mca_inferior":    { vessel: "MCA", segment: "M2", branch: "inferior division", zone: "cortical" },
  "cortex|mca":             { vessel: "MCA", segment: null, branch: "whole MCA territory", zone: "cortical" },
  "cortex|aca":             { vessel: "ACA", segment: null, branch: "whole ACA territory", zone: "cortical" },
  "cortex|pca":             { vessel: "PCA", segment: null, branch: "whole PCA territory", zone: "cortical" },
  "cortex|watershed_anterior":  { vessel: "ACA-MCA", segment: null, branch: "anterior borderzone", zone: "watershed" },
  "cortex|watershed_posterior": { vessel: "MCA-PCA", segment: null, branch: "posterior borderzone", zone: "watershed" },
  "cortex|arcuate":         { vessel: "MCA", segment: null, branch: "perisylvian white matter", zone: "nonvascular" },
  "cortex|aphasia_global":  { vessel: "MCA", segment: null, branch: "whole MCA territory", zone: "cortical" },
  "cortex|aphasia_mixed_transcortical": { vessel: "ACA-MCA", segment: null, branch: "borderzone (both)", zone: "watershed" },

  // ---- subcortex (6) ----
  "subcortex|internal_capsule": { vessel: "MCA", segment: "M1", branch: "lenticulostriate", zone: "perforator" },
  "subcortex|corona_radiata":   { vessel: "MCA", segment: "M1", branch: "deep medullary / lenticulostriate", zone: "perforator" },
  "subcortex|sensorimotor":     { vessel: "MCA", segment: "M1", branch: "lenticulostriate", zone: "perforator" },
  "subcortex|anterior_choroidal":{ vessel: "anterior choroidal", segment: null, branch: "anterior choroidal", zone: "perforator" },
  "subcortex|optic_radiation":  { vessel: "anterior choroidal", segment: null, branch: "anterior choroidal / PCA", zone: "perforator" },
  "subcortex|thalamus":         { vessel: "PCA", segment: "P1", branch: "thalamoperforator", zone: "perforator" },

  // ---- basal ganglia (4) ----
  "basal_ganglia|striatum":        { vessel: "MCA", segment: "M1", branch: "lenticulostriate", zone: "perforator" },
  "basal_ganglia|globus_pallidus": { vessel: "MCA", segment: "M1", branch: "lenticulostriate", zone: "perforator" },
  "basal_ganglia|subthalamic":     { vessel: "PCA", segment: "P1", branch: "thalamoperforator", zone: "perforator" },
  "basal_ganglia|substantia_nigra":{ vessel: "PCA", segment: "P1", branch: "mesencephalic perforator", zone: "perforator" },

  // ---- subcortical aphasia (2) ----
  "aphasia_subcortical|striatocapsular": { vessel: "MCA", segment: "M1", branch: "lenticulostriate", zone: "perforator" },
  "aphasia_subcortical|thalamic":        { vessel: "PCA", segment: "P1", branch: "thalamoperforator", zone: "perforator" },
};

// Every `segment: null` above is DELIBERATE and must appear here with its reason. A null is a statement
// that the part is not defined by a single arterial segment — never an unfilled cell.
export const SEGMENT_NULL_REASON = {
  "cortex|mca": "A whole-territory site, not one branch — it IS the MCA territory.",
  "cortex|aca": "A whole-territory site, not one branch.",
  "cortex|pca": "A whole-territory site, not one branch.",
  "cortex|watershed_anterior": "A borderzone between two territories; by definition no single segment supplies it.",
  "cortex|watershed_posterior": "A borderzone between two territories; by definition no single segment supplies it.",
  "cortex|arcuate": "A white-matter fasciculus, not a vascular territory — it is defined by connectivity.",
  "cortex|aphasia_global": "A whole-territory syndrome spanning both MCA divisions.",
  "cortex|aphasia_mixed_transcortical": "A borderzone syndrome sparing the perisylvian core; no single segment.",
  "subcortex|anterior_choroidal": "The anterior choroidal artery has no M/A/P segment numbering.",
  "subcortex|optic_radiation": "Dual supply (anterior choroidal proximally, PCA distally) — no single segment.",
};

export function vascularOf(site) {
  return VASCULAR[`${site.level}|${site.part}`] || null;
}
```

- [ ] **Step 4: Run the suite to verify it passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/vascular.test.js`
Expected: PASS on all assertions except §3's `medulla|lateral` checks, which fail until Task 2 adds the brainstem rows.

**If §3 fails, that is expected at this point.** Temporarily guard those two assertions with `VASCULAR["medulla|lateral"] ? … : true` and add a comment `// filled in by Task 2`, then remove the guard in Task 2. Do not delete the assertions.

- [ ] **Step 5: Register the suite and commit**

Add ` && node test/vascular.test.js` to the `test` script in `package.json` after `node test/compartments.test.js`, and a matching line in the README suite list.

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test` → expect `0 failed`.

```bash
git add src/model/vascular.js test/vascular.test.js package.json README.md
git commit -m "feat(model): vascular axis — anterior circulation batch (45 keys)

AWAITING CLINICAL SIGN-OFF. Keyed by level|part because four part names
collide across levels."
```

---

### Task 2: Vascular table — posterior circulation and brainstem (30 keys)

**Files:**
- Modify: `src/model/vascular.js` (extend `VASCULAR` and `SEGMENT_NULL_REASON`)
- Modify: `test/vascular.test.js` (extend the coverage assertion; un-guard §3)

**Interfaces:**
- Consumes: `VESSELS`, `SEGMENTS`, `ZONES`, `VASCULAR`, `SEGMENT_NULL_REASON` from Task 1
- Produces: no new exports — the same table, extended

> **⚠ CLINICAL CONTENT — present this batch to the owner before Task 3 starts.**

- [ ] **Step 1: Extend the coverage assertion (failing first)**

In `test/vascular.test.js`, replace the §5 block with:

```js
// --- 5: BATCH 1+2 COVERAGE (anterior + posterior/brainstem) ---
{
  const done = cnsKeys.filter(k => /^(cortex|subcortex|basal_ganglia|aphasia_subcortical|midbrain|pons|medulla|cerebellum|thalamus|thalamus_arousal|brainstem_aras|dorsal_midbrain|pontomesencephalic|locked_in|central_vestibular|guillain_mollaret)\|/.test(k));
  const missing = done.filter(k => !VASCULAR[k]);
  ok(`every anterior + posterior/brainstem key has a row (${missing.length} missing of ${done.length})`,
     missing.length === 0, missing.slice(0, 8).join(" · "));
}
```

Also remove the temporary guard added in Task 1 Step 4 so §3's `medulla|lateral` assertions run for real.

- [ ] **Step 2: Run it to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/vascular.test.js`
Expected: FAIL — the coverage assertion lists ~30 missing keys, and §3 fails because `medulla|lateral` has no row yet.

- [ ] **Step 3: Add the posterior-circulation rows**

Insert into `VASCULAR` in `src/model/vascular.js`, after the subcortical-aphasia block:

```js
  // ---- midbrain (4) ----
  "midbrain|medial":    { vessel: "BA",  segment: "P1", branch: "paramedian mesencephalic", zone: "brainstem" },
  "midbrain|lateral":   { vessel: "PCA", segment: "P1", branch: "short circumferential", zone: "brainstem" },
  "midbrain|hemi":      { vessel: "BA",  segment: null, branch: "paramedian + circumferential", zone: "brainstem" },
  "midbrain|trochlear": { vessel: "SCA", segment: null, branch: "dorsal midbrain", zone: "brainstem" },

  // ---- pons (6) ----
  "pons|medial":            { vessel: "BA",   segment: null, branch: "paramedian pontine", zone: "brainstem" },
  "pons|basis_pontis":      { vessel: "BA",   segment: null, branch: "paramedian pontine", zone: "brainstem" },
  "pons|lateral":           { vessel: "AICA", segment: null, branch: "lateral pontine", zone: "brainstem" },
  "pons|lateral_trigeminal":{ vessel: "AICA", segment: null, branch: "lateral pontine", zone: "brainstem" },
  "pons|trigeminal":        { vessel: "AICA", segment: null, branch: "lateral pontine", zone: "brainstem" },
  "pons|hemi":              { vessel: "BA",   segment: null, branch: "paramedian + lateral", zone: "brainstem" },

  // ---- medulla (3) ----
  "medulla|lateral": { vessel: "PICA",      segment: null, branch: "lateral medullary", zone: "brainstem" },
  "medulla|medial":  { vessel: "vertebral", segment: null, branch: "anterior spinal / paramedian", zone: "brainstem" },
  "medulla|hemi":    { vessel: "vertebral", segment: null, branch: "paramedian + lateral", zone: "brainstem" },

  // ---- cerebellum (4) ----
  "cerebellum|hemisphere":      { vessel: "PICA", segment: null, branch: "PICA / AICA / SCA", zone: "brainstem" },
  "cerebellum|vermis":          { vessel: "PICA", segment: null, branch: "medial branch", zone: "brainstem" },
  "cerebellum|flocculonodular": { vessel: "AICA", segment: null, branch: "flocculus", zone: "brainstem" },
  "cerebellum|pancerebellar":   { vessel: "vertebrobasilar", segment: null, branch: "all three cerebellar arteries", zone: "brainstem" },

  // ---- thalamus proper (4) ----
  "thalamus|vpm":    { vessel: "PCA", segment: "P1", branch: "thalamogeniculate", zone: "perforator" },
  "thalamus|vl":     { vessel: "PCA", segment: "P1", branch: "thalamogeniculate", zone: "perforator" },
  "thalamus|pulvinar":{ vessel: "PCA", segment: "P2", branch: "posterior choroidal", zone: "perforator" },
  "thalamus|limbic": { vessel: "PCA", segment: "P1", branch: "tuberothalamic / paramedian", zone: "perforator" },

  // ---- brainstem composites and functional levels (5) ----
  "thalamus_arousal|paramedian":       { vessel: "PCA", segment: "P1", branch: "paramedian (artery of Percheron)", zone: "perforator" },
  "brainstem_aras|paramedian_tegmentum":{ vessel: "BA", segment: null, branch: "paramedian tegmental", zone: "brainstem" },
  "dorsal_midbrain|tectum":            { vessel: "SCA", segment: null, branch: "quadrigeminal", zone: "brainstem" },
  "pontomesencephalic|tegmentum":      { vessel: "BA",  segment: null, branch: "paramedian tegmental", zone: "brainstem" },
  "locked_in|ventral_pons":            { vessel: "BA",  segment: null, branch: "bilateral paramedian pontine", zone: "brainstem" },

  // ---- vestibular + Guillain-Mollaret (4) ----
  "central_vestibular|nucleus":     { vessel: "PICA", segment: null, branch: "lateral medullary / pontine", zone: "brainstem" },
  "guillain_mollaret|dentate":      { vessel: "SCA",  segment: null, branch: "dentate nucleus", zone: "brainstem" },
  "guillain_mollaret|rubral":       { vessel: "BA",   segment: null, branch: "paramedian mesencephalic (red nucleus)", zone: "brainstem" },
  "guillain_mollaret|triangle":     { vessel: "none", segment: null, branch: null, zone: "nonvascular" },
```

Add to `SEGMENT_NULL_REASON`:

```js
  "midbrain|hemi": "A composite of paramedian and circumferential territories, not one segment.",
  "midbrain|trochlear": "The trochlear nucleus/fascicle is supplied by small dorsal branches without segment numbering.",
  "pons|medial": "Pontine perforators arise directly from the basilar trunk and carry no segment numbering.",
  "pons|basis_pontis": "Basilar perforators; no segment numbering.",
  "pons|lateral": "AICA branches carry no segment numbering.",
  "pons|lateral_trigeminal": "AICA branches carry no segment numbering.",
  "pons|trigeminal": "AICA branches carry no segment numbering.",
  "pons|hemi": "A composite of paramedian and lateral territories.",
  "medulla|lateral": "PICA branches carry no segment numbering.",
  "medulla|medial": "Vertebral/anterior spinal perforators; no segment numbering.",
  "medulla|hemi": "A composite of paramedian and lateral territories.",
  "cerebellum|hemisphere": "Hemispheric supply is shared between PICA, AICA and SCA — no single segment.",
  "cerebellum|vermis": "Medial cerebellar branches carry no segment numbering.",
  "cerebellum|flocculonodular": "AICA branches carry no segment numbering.",
  "cerebellum|pancerebellar": "By definition all three cerebellar arteries — a whole-organ pattern.",
  "brainstem_aras|paramedian_tegmentum": "Basilar tegmental perforators; no segment numbering.",
  "dorsal_midbrain|tectum": "Quadrigeminal branches carry no segment numbering.",
  "pontomesencephalic|tegmentum": "Basilar tegmental perforators; no segment numbering.",
  "locked_in|ventral_pons": "A bilateral basilar perforator territory, not one segment.",
  "central_vestibular|nucleus": "Vestibular nuclei straddle the PICA/AICA border; no single segment.",
  "guillain_mollaret|dentate": "Cerebellar nuclear branches carry no segment numbering.",
  "guillain_mollaret|rubral": "Mesencephalic perforators; no segment numbering.",
  "guillain_mollaret|triangle": "The triangle is a CIRCUIT (dentato-rubro-olivary), not a vascular territory at all — hence vessel `none` and zone `nonvascular`.",
```

- [ ] **Step 4: Run to verify it passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/vascular.test.js`
Expected: PASS, `0 failed` — including §3, which now compares PICA (medulla) against PCA (midbrain).

- [ ] **Step 5: Full suite and commit**

```bash
git add src/model/vascular.js test/vascular.test.js
git commit -m "feat(model): vascular axis — posterior circulation and brainstem (30 keys)

AWAITING CLINICAL SIGN-OFF."
```

---

### Task 3: Vascular table — cord, optic and remainder (29 keys), and the completeness invariant

**Files:**
- Modify: `src/model/vascular.js`
- Modify: `test/vascular.test.js`

**Interfaces:**
- Consumes: everything from Tasks 1-2
- Produces: no new exports; after this task `VASCULAR` covers all 104 CNS keys

> **⚠ CLINICAL CONTENT — present this batch to the owner.**

- [ ] **Step 1: Replace the batch coverage assertion with the FULL invariant (failing first)**

In `test/vascular.test.js`, replace the §5 block entirely with:

```js
// --- 5: TOTAL COVERAGE — every CNS level|part key has a row ---
// This is the invariant that stops a newly added site from silently falling through.
{
  const missing = cnsKeys.filter(k => !VASCULAR[k]);
  ok(`every CNS level|part key has a vascular row (${missing.length} missing of ${cnsKeys.length})`,
     missing.length === 0, missing.slice(0, 10).join(" · "));
  const orphan = Object.keys(VASCULAR).filter(k => !cnsKeys.includes(k));
  ok(`no vascular row exists for a key the model does not produce (${orphan.length} orphans)`,
     orphan.length === 0, orphan.slice(0, 10).join(" · "));
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/vascular.test.js`
Expected: FAIL listing the ~29 remaining keys.

- [ ] **Step 3: Add the remaining rows**

Insert into `VASCULAR`:

```js
  // ---- cord (6) + conus + craniocervical junction ----
  "cord|anterior":   { vessel: "anterior spinal",  segment: null, branch: "anterior spinal", zone: "cord" },
  "cord|posterior":  { vessel: "posterior spinal", segment: null, branch: "posterior spinal", zone: "cord" },
  "cord|central":    { vessel: "anterior spinal",  segment: null, branch: "central (sulcal) branches", zone: "cord" },
  "cord|lateral":    { vessel: "anterior spinal",  segment: null, branch: "circumferential pial plexus", zone: "cord" },
  "cord|hemi":       { vessel: "anterior spinal",  segment: null, branch: "anterior + posterior spinal", zone: "cord" },
  "cord|transverse": { vessel: "anterior spinal",  segment: null, branch: "anterior + posterior spinal", zone: "cord" },
  "conus|medullaris":{ vessel: "anterior spinal",  segment: null, branch: "artery of Adamkiewicz territory", zone: "cord" },
  "craniocervical_junction|foramen_magnum": { vessel: "vertebral", segment: null, branch: "vertebral / anterior spinal origin", zone: "brainstem" },

  // ---- combined degenerations (2) — tract pairs, not territories ----
  "combined_degeneration|scd":       { vessel: "none", segment: null, branch: null, zone: "nonvascular" },
  "combined_degeneration|friedreich":{ vessel: "none", segment: null, branch: null, zone: "nonvascular" },

  // ---- corpus callosum (2) ----
  "corpus_callosum|anterior": { vessel: "ACA", segment: "A3", branch: "pericallosal", zone: "cortical" },
  "corpus_callosum|splenium": { vessel: "PCA", segment: "P3", branch: "splenial", zone: "cortical" },

  // ---- hypothalamus (7) ----
  "hypothalamus|supraoptic":       { vessel: "anterior communicating", segment: null, branch: "hypothalamic perforators", zone: "perforator" },
  "hypothalamus|suprachiasmatic":  { vessel: "anterior communicating", segment: null, branch: "hypothalamic perforators", zone: "perforator" },
  "hypothalamus|tuberal":          { vessel: "PCA", segment: "P1", branch: "tuberal perforators", zone: "perforator" },
  "hypothalamus|ventromedial":     { vessel: "PCA", segment: "P1", branch: "tuberal perforators", zone: "perforator" },
  "hypothalamus|lateral":          { vessel: "PCA", segment: "P1", branch: "tuberal perforators", zone: "perforator" },
  "hypothalamus|mammillary":       { vessel: "PCA", segment: "P1", branch: "mammillary perforators", zone: "perforator" },
  "hypothalamus|thermoregulatory": { vessel: "anterior communicating", segment: null, branch: "hypothalamic perforators", zone: "perforator" },

  // ---- olfactory, diffuse, pseudobulbar ----
  "olfactory|olfactory_groove": { vessel: "ACA",  segment: "A2", branch: "olfactory / anterior ethmoidal", zone: "cortical" },
  "cerebrum|diffuse":           { vessel: "none", segment: null, branch: null, zone: "nonvascular" },
  "pseudobulbar|corticobulbar": { vessel: "none", segment: null, branch: null, zone: "nonvascular" },

  // ---- visual pathway (4) + optic skull-base parts (3) ----
  "visual_pathway|retina":     { vessel: "ophthalmic", segment: null, branch: "central retinal", zone: "cortical" },
  "visual_pathway|chiasm":     { vessel: "anterior communicating", segment: null, branch: "superior hypophyseal", zone: "perforator" },
  "visual_pathway|optic_tract":{ vessel: "anterior choroidal", segment: null, branch: "anterior choroidal", zone: "perforator" },
  "visual_pathway|lgn":        { vessel: "anterior choroidal", segment: null, branch: "anterior choroidal / lateral posterior choroidal", zone: "perforator" },
  "skull_base|optic_canal":    { vessel: "ophthalmic", segment: null, branch: "ophthalmic in the canal", zone: "cortical" },
  "skull_base|optic_aion":     { vessel: "posterior ciliary", segment: null, branch: "short posterior ciliary", zone: "cortical" },
  "skull_base|optic_neuritis": { vessel: "none", segment: null, branch: null, zone: "nonvascular" },
```

Add the matching `SEGMENT_NULL_REASON` entries — one per null above. Use these reasons:

```js
  "cord|anterior": "Spinal arteries carry no M/A/P segment numbering.",
  "cord|posterior": "Spinal arteries carry no segment numbering.",
  "cord|central": "Sulcal branches of the anterior spinal artery; no segment numbering.",
  "cord|lateral": "Supplied by the circumferential pial plexus; no segment numbering.",
  "cord|hemi": "A composite of anterior and posterior spinal territories.",
  "cord|transverse": "A composite of anterior and posterior spinal territories.",
  "conus|medullaris": "Radicular supply (artery of Adamkiewicz) carries no segment numbering.",
  "craniocervical_junction|foramen_magnum": "Vertebral origin; no segment numbering.",
  "combined_degeneration|scd": "Subacute combined degeneration is a metabolic tract disease, not a vascular territory.",
  "combined_degeneration|friedreich": "A hereditary tract degeneration, not a vascular territory.",
  "hypothalamus|supraoptic": "Hypothalamic perforators carry no segment numbering.",
  "hypothalamus|suprachiasmatic": "Hypothalamic perforators carry no segment numbering.",
  "hypothalamus|thermoregulatory": "Hypothalamic perforators carry no segment numbering.",
  "cerebrum|diffuse": "A diffuse/global process by definition — no territory at all.",
  "pseudobulbar|corticobulbar": "A BILATERAL corticobulbar tract syndrome; it requires two lesions and is not one territory.",
  "visual_pathway|retina": "The central retinal artery carries no segment numbering.",
  "visual_pathway|chiasm": "Superior hypophyseal perforators carry no segment numbering.",
  "visual_pathway|optic_tract": "The anterior choroidal artery has no segment numbering.",
  "visual_pathway|lgn": "Dual choroidal supply; no single segment.",
  "skull_base|optic_canal": "The ophthalmic artery carries no segment numbering.",
  "skull_base|optic_aion": "Short posterior ciliary arteries carry no segment numbering.",
  "skull_base|optic_neuritis": "Optic neuritis is an INFLAMMATORY lesion of the nerve, not a vascular territory — contrast with optic_aion, which is ischaemic.",
  "guillain_mollaret|triangle": "The triangle is a CIRCUIT (dentato-rubro-olivary), not a vascular territory at all.",
```

- [ ] **Step 4: Run to verify it passes, then the full suite**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/vascular.test.js` → PASS, `0 failed`.
Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test` → `0 failed`.

Report the final counts: total keys, keys with a segment, keys with `segment: null`.

- [ ] **Step 5: Commit**

```bash
git add src/model/vascular.js test/vascular.test.js
git commit -m "feat(model): vascular axis complete — 104 CNS keys, every null reasoned

AWAITING CLINICAL SIGN-OFF."
```

---

### Task 4: Topography table — lobe, surface, system

**Files:**
- Create: `src/model/topography.js`
- Create: `test/topography.test.js`
- Modify: `package.json`, `README.md`

**Interfaces:**
- Produces: `LOBES` (array), `SYSTEMS` (array), `TOPOGRAPHY` (object keyed `` `${level}|${part}` ``), `topographyOf(site) -> {lobe, surface, system} | null`

> **⚠ CLINICAL CONTENT — present the `surface` and `system` assignments to the owner.**

- [ ] **Step 1: Write the failing test**

Create `test/topography.test.js`:

```js
// topography.test.js — the authored NON-vascular location axis: which lobe, CSF surface or deep
// parenchyma, and which selectively vulnerable system.
//
// Kept separate from vascular.js because it is a different clinical review question. Keyed by
// `${level}|${part}` for the same collision reason.
//
// Spec: docs/superpowers/specs/2026-08-15-multifocal-pattern-axis-design.md §2
// Run: node test/topography.test.js
import { LOBES, SYSTEMS, TOPOGRAPHY, topographyOf } from "../src/model/topography.js";
import { candidateSites } from "../src/engine/inverse.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond, detail = "") { log.push({ label, ok: !!cond, detail }); cond ? pass++ : fail++; }

const keys = [...new Set(candidateSites().map(s => `${s.level}|${s.part}`))];

// --- 1: total coverage over EVERY site, not only CNS ---
// `surface` must be answerable for roots, cauda and cranial-nerve exits too — those are exactly the
// places the `surface` pattern (leptomeningeal disease) needs.
{
  const missing = keys.filter(k => !TOPOGRAPHY[k]);
  ok(`every level|part key has a topography row (${missing.length} missing of ${keys.length})`,
     missing.length === 0, missing.slice(0, 10).join(" · "));
}

// --- 2: closed vocabularies ---
{
  const badLobe = Object.entries(TOPOGRAPHY).filter(([, t]) => t.lobe !== null && !LOBES.includes(t.lobe));
  ok(`every lobe is declared or null (${badLobe.length} bad)`, badLobe.length === 0,
     badLobe.map(([k, t]) => `${k}:${t.lobe}`).slice(0, 5).join(" · "));
  const badSys = Object.entries(TOPOGRAPHY).filter(([, t]) => t.system !== null && !SYSTEMS.includes(t.system));
  ok(`every system is declared or null (${badSys.length} bad)`, badSys.length === 0,
     badSys.map(([k, t]) => `${k}:${t.system}`).slice(0, 5).join(" · "));
  const badSurface = Object.entries(TOPOGRAPHY).filter(([, t]) => typeof t.surface !== "boolean");
  ok(`surface is always a boolean, never null (${badSurface.length} bad)`, badSurface.length === 0,
     badSurface.map(([k]) => k).slice(0, 5).join(" · "));
}

// --- 3: only cortex carries a lobe ---
{
  const nonCortexWithLobe = Object.entries(TOPOGRAPHY).filter(([k, t]) => t.lobe !== null && !k.startsWith("cortex|"));
  ok(`only cortex keys carry a lobe (${nonCortexWithLobe.length} others do)`, nonCortexWithLobe.length === 0,
     nonCortexWithLobe.map(([k]) => k).slice(0, 5).join(" · "));
}

// --- 4: the discriminations the patterns depend on ---
{
  ok("cauda equina is a CSF surface", TOPOGRAPHY["cauda|cauda_equina"]?.surface === true);
  ok("motor cortex is NOT a surface", TOPOGRAPHY["cortex|motor_facearm"]?.surface === false);
  ok("a nerve root is a CSF surface", TOPOGRAPHY["root|l5"]?.surface === true);
  ok("anterior temporal carries the limbic system tag", TOPOGRAPHY["cortex|anterior_temporal"]?.system === "limbic");
  ok("motor cortex carries NO system tag", TOPOGRAPHY["cortex|motor_facearm"]?.system === null);
  ok("a cerebellar hemisphere carries the cerebellar system tag",
     TOPOGRAPHY["cerebellum|hemisphere"]?.system === "cerebellar");
}

// --- 5: topographyOf resolves through the key ---
{
  const site = candidateSites().find(s => s.id === "left_cortex_motor_leg");
  ok("topographyOf resolves a real site", topographyOf(site)?.lobe === "frontal");
  ok("topographyOf returns null for an unknown key", topographyOf({ level: "zz", part: "zz" }) === null);
}

for (const l of log) console.log(`${l.ok ? "PASS" : "FAIL"}  ${l.label}${l.detail && !l.ok ? `  [${l.detail}]` : ""}`);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run it to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/topography.test.js`
Expected: FAIL — `Cannot find module '.../src/model/topography.js'`

- [ ] **Step 3: Create the table**

Create `src/model/topography.js`. Author a row for **every** `level|part` key the model produces (all
compartments, not just CNS — `surface` must be answerable for roots and cranial-nerve exits).

Rules to apply, so the assignments are consistent rather than ad hoc:

- **`lobe`** — only `cortex|*` keys. `frontal` for motor/premotor/SMA/paracentral/frontal-eye-field/
  operculum/dlpfc/medial_pfc/orbitofrontal/aca/watershed_anterior; `parietal` for sensory_*/parietal/
  angular/sensory_hand; `temporal` for temporal/anterior_temporal/temporoparietal/auditory/fusiform;
  `occipital` for occipital/pca/watershed_posterior; `insula` for insula. Whole-territory and syndrome
  keys (`mca`, `aphasia_global`, `aphasia_mixed_transcortical`, `arcuate`, `hand_knob`, `mca_superior`,
  `mca_inferior`) take the lobe of their dominant location — `frontal` for hand_knob and mca_superior,
  `temporal` for mca_inferior, `null` for `mca`, `aphasia_global`, `aphasia_mixed_transcortical` and
  `arcuate` (they span lobes). **Everything outside `cortex|` is `lobe: null`.**
- **`surface`** — a boolean on **every** key, never null. Decided by compartment, exhaustively, so there is
  no key the rule fails to answer:

  | Compartment | `surface` | Why |
  |---|---|---|
  | `root` | **true** | The roots run in the thecal sac, bathed in CSF — this is what leptomeningeal disease seeds |
  | `cauda` | **true** | Same, and the classic site of leptomeningeal polyradiculopathy |
  | `skull_base` | **true** | Cranial-nerve corridors are cisternal / dural, reached from the subarachnoid space |
  | `optic` | **`visual_pathway|chiasm` true; `optic_tract`, `lgn`, `retina` false** | The chiasm sits in the suprasellar cistern; the tract and LGN are parenchymal, the retina is intraocular |
  | `cord` | **`conus|medullaris` true; all `cord|*` cross-sections false** | The conus-cauda junction is a CSF-surface site; a cord cross-section is parenchyma |
  | `brain`, `brainstem`, `cerebellum` | **false** | Parenchyma |
  | `plexus` | **false** | Extradural — outside the CSF space |
  | `nerve`, `motor_unit`, `sympathetic`, `pupil` | **false** | Peripheral / extradural |

  Every other compartment not named above is **false**. If a key exists whose compartment is not in this
  table, stop and report it rather than guessing — the table is meant to be exhaustive.
- **`system`** — only these tags, everything else `null`: `limbic` for `cortex|anterior_temporal`,
  `hypothalamus|mammillary`, `thalamus|limbic`; `cerebellar` for every `cerebellum|*` and
  `guillain_mollaret|dentate`; `brainstem` for every `midbrain|*`, `pons|*`, `medulla|*`,
  `pontomesencephalic|*`, `brainstem_aras|*`, `locked_in|*`, `dorsal_midbrain|*`, `central_vestibular|*`;
  `DRG` for every `root|*`; `NMJ` for `motor_unit|nmj_presynaptic` and `motor_unit|nmj_postsynaptic`.

```js
// topography.js — the authored NON-vascular location axis. Content only; no logic.
//
// Three attributes, each earning its place in a pattern predicate:
//   lobe    — which cortical lobe (cortex keys only); a separation axis in its own right
//   surface — CSF-bathed (meninges, cranial-nerve corridors, roots, cauda, chiasm) vs deep parenchyma.
//             This is what separates leptomeningeal seeding from a parenchymal mass.
//   system  — the selectively vulnerable systems a paraneoplastic process targets, and nothing else
//
// Keyed by `${level}|${part}` — see the note in vascular.js on why part alone is unsafe.
// Spec: docs/superpowers/specs/2026-08-15-multifocal-pattern-axis-design.md §2

export const LOBES = ["frontal", "parietal", "temporal", "occipital", "insula"];
export const SYSTEMS = ["limbic", "cerebellar", "brainstem", "DRG", "NMJ"];

export const TOPOGRAPHY = {
  "cortex|motor_facearm":    { lobe: "frontal",   surface: false, system: null },
  "cortex|motor_leg":        { lobe: "frontal",   surface: false, system: null },
  "cortex|anterior_temporal":{ lobe: "temporal",  surface: false, system: "limbic" },
  "cerebellum|hemisphere":   { lobe: null,        surface: false, system: "cerebellar" },
  "cauda|cauda_equina":      { lobe: null,        surface: true,  system: null },
  "root|l5":                 { lobe: null,        surface: true,  system: "DRG" },
  // … one row per level|part key produced by candidateSites(), following the rules above
};

export function topographyOf(site) {
  return TOPOGRAPHY[`${site.level}|${site.part}`] || null;
}
```

**Enumerate the exact key list to author with:**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node -e "
import('./src/engine/inverse.js').then(m=>{
  const k=[...new Set(m.candidateSites().map(s=>s.level+'|'+s.part))].sort();
  console.log(k.length); k.forEach(x=>console.log(x));})"
```

- [ ] **Step 4: Run to verify it passes, then the full suite**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/topography.test.js` → PASS.
Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test` → `0 failed`.

- [ ] **Step 5: Register the suite and commit**

Add ` && node test/topography.test.js` to `package.json` and the README list.

```bash
git add src/model/topography.js test/topography.test.js package.json README.md
git commit -m "feat(model): topography axis — lobe, CSF surface, vulnerable system

AWAITING CLINICAL SIGN-OFF."
```

---

### Task 5: `separatedInSpace()`

**Files:**
- Create: `src/engine/space.js`
- Create: `test/space.test.js`
- Modify: `package.json`, `README.md`

**Interfaces:**
- Consumes: `vascularOf` (Task 1-3), `topographyOf` (Task 4), `compartmentOf` from `src/model/compartments.js`
- Produces: `SEPARATION_AXES` = `["segment", "vessel", "lobe", "hemisphere", "level"]`; `separatedInSpace(sites, axis) -> boolean`

- [ ] **Step 1: Write the failing test**

Create `test/space.test.js`:

```js
// space.test.js — "separated in space", derived from the authored tables and never stored.
//
// Five axes, coarsening left to right: segment -> vessel -> lobe -> hemisphere -> level.
// `"any"` means the set differs on AT LEAST ONE axis. A key whose segment is null simply cannot satisfy
// the `segment` axis; it falls back to whatever coarser axis the caller allows.
//
// Spec: docs/superpowers/specs/2026-08-15-multifocal-pattern-axis-design.md §3
// Run: node test/space.test.js
import { SEPARATION_AXES, separatedInSpace } from "../src/engine/space.js";
import { candidateSites } from "../src/engine/inverse.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond, detail = "") { log.push({ label, ok: !!cond, detail }); cond ? pass++ : fail++; }

const site = id => candidateSites().find(s => s.id === id);

// The owner's reported case: right ACA-A4 paracentral + left MCA-M4 precentral.
const rLeg = site("right_cortex_motor_leg");
const lArm = site("left_cortex_motor_facearm");

{
  ok("SEPARATION_AXES is the five documented axes",
     SEPARATION_AXES.join(",") === "segment,vessel,lobe,hemisphere,level");
}

// --- the reported case, axis by axis ---
{
  ok("separated at `segment` (A4 vs M4)", separatedInSpace([rLeg, lArm], "segment"));
  ok("separated at `vessel` (ACA vs MCA)", separatedInSpace([rLeg, lArm], "vessel"));
  ok("NOT separated at `lobe` (both frontal)", !separatedInSpace([rLeg, lArm], "lobe"));
  ok("separated at `hemisphere` (right vs left)", separatedInSpace([rLeg, lArm], "hemisphere"));
  ok("NOT separated at `level` (both cortex)", !separatedInSpace([rLeg, lArm], "level"));
  ok("separated at `any` — it differs on three axes", separatedInSpace([rLeg, lArm], "any"));
}

// --- the same site twice is never separated, on any axis ---
{
  for (const axis of [...SEPARATION_AXES, "any"]) {
    ok(`one site repeated is NOT separated at \`${axis}\``, !separatedInSpace([rLeg, rLeg], axis));
  }
}

// --- a null segment cannot satisfy the segment axis, but can satisfy a coarser one ---
{
  const watershed = site("left_cortex_watershed_anterior");   // segment: null
  const occipital = site("left_cortex_occipital");            // PCA P4
  ok("a null-segment key is NOT separated at `segment`", !separatedInSpace([watershed, occipital], "segment"));
  ok("...but IS separated at `vessel` (ACA-MCA vs PCA)", separatedInSpace([watershed, occipital], "vessel"));
}

// --- a single site is never "separated" ---
{
  ok("fewer than two sites is never separated", !separatedInSpace([rLeg], "any"));
  ok("an empty set is never separated", !separatedInSpace([], "any"));
}

for (const l of log) console.log(`${l.ok ? "PASS" : "FAIL"}  ${l.label}${l.detail && !l.ok ? `  [${l.detail}]` : ""}`);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run it to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/space.test.js`
Expected: FAIL — `Cannot find module '.../src/engine/space.js'`

- [ ] **Step 3: Implement it**

Create `src/engine/space.js`:

```js
// space.js — "separated in space", DERIVED from the authored tables. Separation is never stored.
//
// Five axes, coarsening left to right:
//   segment -> vessel -> lobe -> hemisphere -> level
// Each pattern in the multifocal roster names the axis it needs; `"any"` means the set differs on at
// least one of them. A key whose `segment` is null cannot satisfy the `segment` axis — that is the point
// of the null, not a gap — and falls back to whatever coarser axis the caller allows.
//
// Spec: docs/superpowers/specs/2026-08-15-multifocal-pattern-axis-design.md §3
import { vascularOf } from "../model/vascular.js";
import { topographyOf } from "../model/topography.js";

export const SEPARATION_AXES = ["segment", "vessel", "lobe", "hemisphere", "level"];

// The value of one site on one axis. `null` means "this axis cannot speak for this site" — two nulls
// must never count as a difference, which is why they are filtered out below rather than compared.
function valueOn(site, axis) {
  if (axis === "hemisphere") return site.side || null;
  if (axis === "level") return site.level || null;
  if (axis === "lobe") return topographyOf(site)?.lobe ?? null;
  const v = vascularOf(site);
  if (!v) return null;
  if (axis === "vessel") return v.vessel ?? null;
  if (axis === "segment") return v.segment ?? null;
  return null;
}

export function separatedInSpace(sites, axis = "any") {
  if (!Array.isArray(sites) || sites.length < 2) return false;
  if (axis === "any") return SEPARATION_AXES.some(a => separatedInSpace(sites, a));
  const values = sites.map(s => valueOn(s, axis)).filter(v => v !== null);
  // Every site must be able to speak on this axis, or the axis cannot establish separation.
  if (values.length !== sites.length) return false;
  return new Set(values).size > 1;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/space.test.js` → PASS, `0 failed`.

- [ ] **Step 5: Register and commit**

Add ` && node test/space.test.js` to `package.json` and the README list. Run the full suite.

```bash
git add src/engine/space.js test/space.test.js package.json README.md
git commit -m "feat(engine): separatedInSpace across segment/vessel/lobe/hemisphere/level"
```

---

### Task 6: Pattern predicates

**Files:**
- Modify: `src/engine/multifocal.js`
- Modify: `test/multifocal.test.js`

**Interfaces:**
- Consumes: `separatedInSpace`, `SEPARATION_AXES` (Task 5); `topographyOf` (Task 4); `compartmentOf`; `umnLmnPattern` from `src/engine/patterns.js`
- Produces: `PATTERNS` (array of the seven names); `patternMatches(pattern, sites, observedSet) -> boolean`

- [ ] **Step 1: Write the failing test**

Append to `test/multifocal.test.js`, and add `import { PATTERNS, patternMatches } from "../src/engine/multifocal.js";` to the existing import block:

```js
// --- 23: PATTERN PREDICATES (spec 2026-08-15 §4) ---
// Each is a predicate over the WHOLE site set, so there is exactly one reading. "CNS compartments" means
// brain, brainstem, cerebellum, cord, optic.
{
  const s = id => siteById(id);
  const cortexPair = [s("right_cortex_motor_leg"), s("left_cortex_motor_facearm")];
  const nervePair  = [s("left_nerve_radial_axilla"), s("left_nerve_median_proximal")];
  const surfacePair = [s("left_skull_base_vii_geniculate"), s("cauda_equina")];

  ok("PATTERNS lists the seven documented patterns", PATTERNS.length === 7);

  ok("`mass` matches two deep CNS lesions", patternMatches("mass", cortexPair, new Set()));
  ok("`mass` does NOT match two peripheral nerves", !patternMatches("mass", nervePair, new Set()));
  ok("`mass` does NOT match CSF-surface sites", !patternMatches("mass", surfacePair, new Set()));

  ok("`territorial` matches two different arterial segments (A4 vs M4)",
     patternMatches("territorial", cortexPair, new Set()));
  ok("`territorial` does NOT match two peripheral nerves",
     !patternMatches("territorial", nervePair, new Set()));

  ok("`surface` matches a cranial-nerve corridor + cauda", patternMatches("surface", surfacePair, new Set()));
  ok("`surface` does NOT match two motor strips", !patternMatches("surface", cortexPair, new Set()));

  ok("`nerveTrunk` matches two named nerves", patternMatches("nerveTrunk", nervePair, new Set()));
  ok("`nerveTrunk` does NOT match two cortical sites", !patternMatches("nerveTrunk", cortexPair, new Set()));

  ok("`cns` matches two CNS sites separated on any axis", patternMatches("cns", cortexPair, new Set()));
  ok("`cns` does NOT match two peripheral nerves", !patternMatches("cns", nervePair, new Set()));

  // systemSelective needs every site to carry a system tag
  const brainstemPair = [s("left_medulla_lateral"), s("left_pons_lateral")];
  ok("`systemSelective` matches two brainstem sites (both tagged)",
     patternMatches("systemSelective", brainstemPair, new Set()));
  ok("`systemSelective` does NOT match two motor strips (no system tag)",
     !patternMatches("systemSelective", cortexPair, new Set()));

  // motorSystem delegates to umnLmnPattern over the OBSERVED findings, not the sites
  const mixed = new Set([...expectedFindings(s("left_cortex_motor_facearm")),
                         ...expectedFindings(s("motor_unit_anterior_horn")),
                         "babinski@left", "fasciculations@left"]);
  ok("`motorSystem` matches a mixed UMN + LMN finding set",
     patternMatches("motorSystem", [s("left_cortex_motor_facearm"), s("motor_unit_anterior_horn")], mixed));
  ok("`motorSystem` does NOT match a picture with no LMN signs",
     !patternMatches("motorSystem", cortexPair, new Set(expectedFindings(s("left_cortex_motor_facearm")))));
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/multifocal.test.js`
Expected: FAIL — `patternMatches is not a function`

- [ ] **Step 3: Implement the predicates**

Add these imports to the top import block of `src/engine/multifocal.js`:

```js
import { separatedInSpace } from "./space.js";
import { topographyOf } from "../model/topography.js";
```

Then add, above `unifyingDiagnoses`:

```js
// ---- LESION PATTERNS (spec 2026-08-15) ----
// A disease has a characteristic lesion PATTERN, not a lesion count. `spread: {minSites: 2}` asked
// "are there two sites?" — a counting question — and fired nine of thirteen entities together, so
// leptomeningeal disease and paraneoplastic syndrome appeared on two motor-strip lesions while MS,
// blocked by `distinctCompartments`, did not appear at all.
//
// Every predicate below is stated over the WHOLE site set, so there is exactly one reading.
export const PATTERNS = ["mass", "territorial", "surface", "systemSelective", "nerveTrunk", "motorSystem", "cns"];

const CNS_COMPARTMENTS = new Set(["brain", "brainstem", "cerebellum", "cord", "optic"]);
const allCns = sites => sites.every(s => CNS_COMPARTMENTS.has(compartmentOf(s)));

export function patternMatches(pattern, sites, observedSet) {
  if (!Array.isArray(sites) || sites.length < 2) return false;
  switch (pattern) {
    // A discrete lesion IN parenchyma, rather than on a CSF surface.
    case "mass":
      return allCns(sites) && sites.every(s => topographyOf(s)?.surface === false);
    // Multiple arterial territories at BRANCH level — the signature of a shower of emboli.
    case "territorial":
      return allCns(sites) && separatedInSpace(sites, "segment");
    // Seeded along CSF-bathed surfaces: meninges, cranial-nerve corridors, roots, cauda.
    case "surface":
      return sites.every(s => topographyOf(s)?.surface === true);
    // Targets a selectively vulnerable system rather than an arbitrary place.
    case "systemSelective":
      return sites.every(s => !!topographyOf(s)?.system);
    case "nerveTrunk":
      return sites.every(s => compartmentOf(s) === "nerve");
    // Delegates to the existing synthesis over the OBSERVED findings, so this layer and the UMN/LMN
    // flag can never disagree. Not a property of the site set.
    case "motorSystem":
      return umnLmnPattern(observedSet).verdict === "mixed";
    // Any two CNS sites separated in space on ANY axis (owner's ruling for MS).
    case "cns":
      return allCns(sites) && separatedInSpace(sites, "any");
    default:
      return false;
  }
}
```

- [ ] **Step 4: Run to verify it passes, then the full suite**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/multifocal.test.js` → PASS.
Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test` → `0 failed`.

- [ ] **Step 5: Commit**

```bash
git add src/engine/multifocal.js test/multifocal.test.js
git commit -m "feat(multifocal): seven lesion-pattern predicates"
```

---

### Task 7: Migrate the roster from `spread` to `pattern`

**Files:**
- Modify: `src/data/multifocal.js` (all 13 entities; remove `spread` from the shape)
- Modify: `src/engine/multifocal.js` (`unifyingDiagnoses` — replace the `spread` branch)
- Modify: `test/multifocal.test.js`

**Interfaces:**
- Consumes: `patternMatches`, `PATTERNS` (Task 6)
- Produces: entities carry `pattern: string[]`; `spread` no longer exists anywhere

- [ ] **Step 1: Write the failing test — the owner's six verdicts**

Append to `test/multifocal.test.js`:

```js
// --- 24: THE OWNER'S VERDICTS on right arm + left leg weakness (bug report 2026-08-15) ---
// "multifocal masses, embolic or vasculitic phenomena" are right; "leptomeningeal and especially
// paraneoplastic causes are quite a stretch"; "demyelination would also cause this issue but it is not
// offered". These six are the headline regression for the whole pattern axis.
{
  const sites = [siteById("right_cortex_motor_leg"), siteById("left_cortex_motor_facearm")];
  const toks = new Set(["weak_arm@right", "weak_leg@left"]);
  const r = unifyingDiagnoses(sites, toks, {});
  const names = [...r.concordant, ...r.discordant].map(e => e.name).join(" | ");
  const has = re => new RegExp(re, "i").test(names);

  ok("metastases fire (multifocal masses)", has("metasta"), names);
  ok("embolic shower fires", has("embol"), names);
  ok("vasculitis fires", has("vasculit"), names);
  ok("MULTIPLE SCLEROSIS fires — the reported omission", has("multiple sclerosis"), names);
  ok("primary CNS lymphoma fires (owner: 'mass is right')", has("lymphoma"), names);
  ok("leptomeningeal disease does NOT fire — a stretch here", !has("leptomeningeal"), names);
  ok("paraneoplastic syndrome does NOT fire — especially a stretch", !has("paraneoplastic"), names);
}

// --- 25: `spread` is gone from the entity shape ---
{
  const withSpread = MULTIFOCAL.filter(e => e.spread !== undefined);
  ok(`no entity still carries a \`spread\` clause (${withSpread.length})`, withSpread.length === 0,
     withSpread.map(e => e.name).join(", "));
  const withoutTrigger = MULTIFOCAL.filter(e => !e.pattern && !(e.sites && e.sites.length) && !e.motor);
  ok(`every entity has a trigger — pattern, sites or motor (${withoutTrigger.length} without)`,
     withoutTrigger.length === 0, withoutTrigger.map(e => e.name).join(", "));
  const badPattern = MULTIFOCAL.filter(e => e.pattern && e.pattern.some(p => !PATTERNS.includes(p)));
  ok(`every declared pattern is a known one (${badPattern.length} bad)`, badPattern.length === 0,
     badPattern.map(e => e.name).join(", "));
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/multifocal.test.js`
Expected: FAIL — MS does not fire, leptomeningeal and paraneoplastic do, and every entity still has `spread`.

- [ ] **Step 3: Swap `spread` for `pattern` in the roster**

In `src/data/multifocal.js`, for each entity replace the `spread: {...}` line with a `pattern` line. Leave
`compartments`, `course`, `tempo`, `likelihood`, `matches`, `red`, `feature` and `confirm` untouched — those
are signed-off clinical content.

| Entity | Replace `spread` with |
|---|---|
| Motor neurone disease (ALS) | `pattern: ["motorSystem"],` |
| Multiple sclerosis | `pattern: ["cns"],` |
| Metastases | `pattern: ["mass"],` |
| Vasculitis (CNS or systemic) | `pattern: ["territorial", "nerveTrunk"],` |
| Leptomeningeal disease | `pattern: ["surface"],` |
| Primary CNS lymphoma | `pattern: ["mass"],` |
| Paraneoplastic syndrome | `pattern: ["systemSelective"],` |
| Neurosyphilis or HIV | `pattern: ["mass", "surface", "nerveTrunk"],` |
| Embolic shower (cardiac or aortic source) | `pattern: ["territorial"],` |

**MS also loses its `distinctCompartments` requirement entirely** — that is the clause that blocked it, and
`cns` + `"any"` replaces it. Neurosarcoidosis, NMOSD, Mononeuritis multiplex and NF2 keep their existing
`sites` clauses and gain no `pattern`.

Update the `mf()` doc comment: remove the `spread` line, add
`//   pattern  ["mass"|"territorial"|…]  the SHAPE of dissemination (see engine/multifocal.js PATTERNS)`.

- [ ] **Step 4: Replace the `spread` branch in the matcher**

In `src/engine/multifocal.js` `unifyingDiagnoses()`, delete the `if (entity.spread) { … }` block and the
`spreadSatisfied()` helper, and insert in its place:

```js
    // --- hard: lesion PATTERN — the shape of dissemination, not a site count ---
    if (entity.pattern && entity.pattern.length) {
      const hit = entity.pattern.find(p => patternMatches(p, sites, observedSet));
      if (!hit) continue;
      why.push({ clause: { pattern: hit }, satisfiedBy: null });
    }
```

`satisfiedBy` is `null` because a pattern is satisfied by the SET, not by one site — `clauseText()` in
`app/app.js` already renders a null `satisfiedBy` from the clause description, so the card keeps its
derivation line.

- [ ] **Step 5: Run to verify it passes, then the full suite**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/multifocal.test.js` → PASS.
Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`

**Expect failures in earlier tests that asserted the old `spread` behaviour.** For each, decide whether the
assertion encoded the OLD trigger or a real invariant. Restate it to its real intent — never weaken it, never
delete a case — and list every restated assertion in the commit body.

- [ ] **Step 6: Commit**

```bash
git add src/data/multifocal.js src/engine/multifocal.js test/multifocal.test.js
git commit -m "feat(multifocal): entities declare a lesion pattern; spread is gone

Owner bug report: right arm + left leg weakness fired leptomeningeal and
paraneoplastic (a stretch) while MS, blocked by distinctCompartments, did not
fire at all. Restated assertions listed below."
```

---

### Task 8: Measure over-suppression, re-sweep, and document

**Files:**
- Modify: `test/multifocal.test.js` (silence-rate guard)
- Modify: `CLAUDE.md`, `CONTRIBUTING.md`, `README.md`
- Modify: `docs/superpowers/plans/2026-08-15-multifocal-pattern-axis.md` (mark implemented)

- [ ] **Step 1: Measure the silent-pair rate**

The spec makes this a deliverable, not a check. Run:

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node -e "
Promise.all([import('./src/engine/inverse.js'),import('./src/engine/forward.js'),import('./src/engine/multifocal.js')]).then(([inv,fwd,eng])=>{
  const S=inv.candidateSites().filter((_,i)=>i%5===0);
  let pairs=0, empty=0;
  for(let i=0;i<S.length;i++) for(let j=i+1;j<S.length;j++){
    let t; try{ t=new Set([...fwd.expectedFindings(S[i]),...fwd.expectedFindings(S[j])]); }catch{continue;}
    pairs++;
    const r=eng.unifyingDiagnoses([S[i],S[j]],t,{});
    if(r.concordant.length+r.discordant.length===0) empty++;
  }
  console.log('pairs',pairs,'| zero entities',empty,'('+(100*empty/pairs).toFixed(1)+'%)');})"
```

**Report the number.** The pre-change baseline is **7.8%**. If it exceeds ~40%, stop and report: the
patterns are drawn too tight, and the fix is to widen a NAMED pattern with the owner, not to loosen the
mechanism.

- [ ] **Step 2: Pin the rate as a guard**

Append to `test/multifocal.test.js`, substituting the measured number:

```js
// --- 26: over-suppression guard ---
// Hard-filtering on pattern necessarily raises the share of site pairs with no catalogued cross-site
// entity (7.8% before the pattern axis). That is honest when the pair genuinely has no unifying disease,
// but a steep climb would mean the patterns are drawn too tight rather than the pairs being unusual.
{
  const { candidateSites: cs } = await import("../src/engine/inverse.js");
  const S = cs().filter((_, i) => i % 9 === 0);
  let pairs = 0, empty = 0;
  for (let i = 0; i < S.length; i++) for (let j = i + 1; j < S.length; j++) {
    let t; try { t = new Set([...expectedFindings(S[i]), ...expectedFindings(S[j])]); } catch { continue; }
    pairs++;
    const r = unifyingDiagnoses([S[i], S[j]], t, {});
    if (r.concordant.length + r.discordant.length === 0) empty++;
  }
  const pct = 100 * empty / pairs;
  ok(`silent-pair rate stays under 45% (measured ${pct.toFixed(1)}%)`, pct < 45, `${empty}/${pairs}`);
}
```

- [ ] **Step 3: Re-run the systematic sweep in both directions**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node -e "
Promise.all([import('./src/engine/inverse.js'),import('./src/engine/forward.js')]).then(([inv,fwd])=>{
  const ALL=inv.candidateSites();
  let n=0,bad=0;
  for(const s of ALL){ let t; try{t=new Set(fwd.expectedFindings(s));}catch{continue;} if(!t.size) continue; n++;
    if(inv.solve(t).multi) bad++; }
  console.log('single sites',n,'| multi wrongly fired',bad);
  const S=ALL.filter((_,i)=>i%4===0); let pairs=0,fires=0,silent=0;
  for(let i=0;i<S.length;i++) for(let j=i+1;j<S.length;j++){
    let t; try{ t=new Set([...fwd.expectedFindings(S[i]),...fwd.expectedFindings(S[j])]); }catch{continue;}
    if(!t.size) continue; pairs++;
    const r=inv.solve(t);
    if(r.explainAll.length===0){ r.multi?fires++:silent++; } }
  console.log('pairs',pairs,'| multi fires',fires,'| silent',silent);})"
```

Expected: **0** wrongly-fired singles and **0** silent pairs, matching the 2026-08-15 fix. This confirms the
pattern axis changed which ENTITIES are offered without changing whether the multifocal cover itself fires.

- [ ] **Step 4: Update the docs**

In `CLAUDE.md`, extend the multi-location DDx section: `spread` is gone, entities declare a `pattern`, and
the two new authored tables exist. Record the owner's rulings — hard filter, branch-level vascular axis,
lobes and hemispheres count as separation, MS fires on any two CNS sites separated in space. Note that the
vascular and topography tables are **new clinical content awaiting sign-off**.

In `CONTRIBUTING.md`, add `vascular.js` and `topography.js` to the `src/model/` layer description and
`space.js` to `src/engine/`.

In `README.md`, confirm the three new suites are listed.

Mark this plan `**Status:** implemented YYYY-MM-DD`.

- [ ] **Step 5: Full suite, browser check, commit**

Run the full suite → `0 failed`.

Drive the app (via the preview tooling, never `node app/serve.mjs` in a shell) on the reported case
`#f=weak_arm%40right,weak_leg%40left` and confirm the Together card lists metastases, embolic shower,
vasculitis, MS and lymphoma, and lists neither leptomeningeal disease nor paraneoplastic syndrome. The gate
needs the passphrase `NeuroLocaliser` and the safety checkbox, or set `localStorage.nl_gate_v1 = "ok"` and
navigate with `location.href`.

```bash
git add CLAUDE.md CONTRIBUTING.md README.md test/multifocal.test.js docs/superpowers/plans/2026-08-15-multifocal-pattern-axis.md
git commit -m "docs: multifocal pattern axis is built; silent-pair rate measured"
```

---

## Review gate before merge

**Do not merge without offering the owner the clinical review**, as with the roster:

1. **The vascular table** (Tasks 1-3) — 104 rows, presented in the three anatomical batches: key · vessel · segment · branch · zone, plus the list of `segment: null` keys with their reasons.
2. **The topography table** (Task 4) — the `surface` and `system` assignments, which are what stop leptomeningeal disease and paraneoplastic syndrome firing everywhere.
3. **The measured silent-pair rate** before and after.

The owner has previously chosen to merge before completing a gate. That is their call to make again — but the gate must be offered, not assumed.

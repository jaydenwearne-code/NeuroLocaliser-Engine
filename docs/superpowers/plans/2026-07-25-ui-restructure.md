# UI Restructure — Nested Exam Tree (Sub-project D) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat exam accordion with a nested, cascading `EXAM_TREE` (category → subcategory → [modality] → findings), rendered as an expandable tree with in-place side-button ticking; remove the worked-example presets.

**Architecture:** `app/exam-map.js` exports a recursive `EXAM_TREE` + `flattenFindings()` (and drops `PRESETS`). `app/app.js` renders it recursively and generalises search; the presets UI is removed. `test/app-smoke.test.js` is rewritten to walk the tree. Nothing downstream of finding entry changes.

**Tech Stack:** Zero-dependency ES modules, Node v24 (off PATH — see Global Constraints). Browser app is a zero-build static page; the tree is nested `<details>`.

## Global Constraints

- **Node is off PATH.** Prefix every `node`/`npm` command with `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"`.
- **Zero dependencies, no build step.** No new packages, no framework.
- **Input-only change.** Do not touch findings, the engine, causes, synthesis, the diagram, or Atlas mode. Everything downstream of ticking a finding is unchanged.
- **Coverage guarantee preserved.** Every finding in `FINDINGS` must remain reachable (tree ∪ the app's "Other findings" leaf). Each finding appears in the tree exactly once.
- **Only `app.js` consumes `app.js`.** No node test imports `app/app.js` (it uses `document`), so the full suite stays green after the data change even before the app is updated; the app is validated in the browser at Task 2.
- **Branch off `main`:**
  ```bash
  cd "/Users/jaydenwearne/Desktop/Personal/Claude Code/Projects/NeuroLocaliser/Code/neurolocaliser-engine"
  git checkout -b ui-restructure
  ```

---

### Task 1: `EXAM_TREE` + `flattenFindings`, drop `PRESETS`, rewrite app-smoke

**Files:**
- Modify: `app/exam-map.js` (replace `EXAM_FLOW`+`PRESETS` with `EXAM_TREE`+`flattenFindings`)
- Rewrite: `test/app-smoke.test.js` (walk the tree; drop preset assertions)

**Interfaces:**
- Produces: `export const EXAM_TREE: Node[]` where `Node = { id, label, groups?: Node[], findings?: string[] }` (exactly one of `groups`/`findings`); `export function flattenFindings(nodes): string[]`.
- `PRESETS` and `EXAM_FLOW` are removed.

- [ ] **Step 1: Rewrite the failing test**

Replace the entire contents of `test/app-smoke.test.js` with:

```js
// app-smoke.test.js — integrity of the nested exam tree (Sub-project D). Every leaf finding is real;
// every finding is reachable (tree ∪ "Other"); structure is well-formed; taxonomy spot-checks hold.
import { EXAM_TREE, flattenFindings } from "../app/exam-map.js";
import { FINDINGS } from "../src/model/findings.js";

let pass = 0, fail = 0;
const log = [];
const ok = (label, cond) => { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; };
const isFinding = f => Object.prototype.hasOwnProperty.call(FINDINGS, f);

// ---- structural well-formedness (recursive) ----
let structBad = null;
const walkNode = (n, path) => {
  const here = `${path}/${n.id}`;
  const hasG = Array.isArray(n.groups), hasF = Array.isArray(n.findings);
  if (!n.id || !n.label) structBad = structBad || `${here}: missing id/label`;
  if (hasG === hasF) structBad = structBad || `${here}: must have exactly one of groups/findings`;
  if (hasG && !n.groups.length) structBad = structBad || `${here}: empty groups`;
  if (hasF && !n.findings.length) structBad = structBad || `${here}: empty findings`;
  if (hasG) n.groups.forEach(c => walkNode(c, here));
};
EXAM_TREE.forEach(n => walkNode(n, ""));
ok("every node is well-formed (id+label, exactly one of groups/findings, non-empty)", !structBad, structBad);

// ---- every leaf finding is a real finding id ----
const all = flattenFindings(EXAM_TREE);
const badId = all.find(f => !isFinding(f));
ok("every tree finding is a real finding", !badId, badId);

// ---- no finding appears twice in the tree ----
const dupe = all.find((f, i) => all.indexOf(f) !== i);
ok("no finding appears twice in the tree", !dupe, dupe);

// ---- coverage: tree ∪ Other = all findings (nothing lost) ----
const inTree = new Set(all);
const other = Object.keys(FINDINGS).filter(f => !inTree.has(f));
ok("tree ∪ Other covers every finding", inTree.size + other.length === Object.keys(FINDINGS).length);

// ---- taxonomy spot-checks (intent) ----
const findNode = (nodes, id) => {
  for (const n of nodes) { if (n.id === id) return n; if (n.groups) { const r = findNode(n.groups, id); if (r) return r; } }
  return null;
};
const paintemp = findNode(EXAM_TREE, "sens_paintemp");
ok("Sensation → Limb/hemibody → Pain & temperature contains spinothalamic", !!paintemp && paintemp.findings.includes("spinothalamic"));
const myotome = findNode(EXAM_TREE, "motor_myotome");
ok("Motor → By myotome contains weak_c5", !!myotome && myotome.findings.includes("weak_c5"));
const fatig = findNode(EXAM_TREE, "fatiguability");
ok("Fatiguability leaf carries the fatigable set",
   !!fatig && ["fatigable_weakness","fatigable_ocular","facilitating_weakness"].every(x => fatig.findings.includes(x)));
const tone = findNode(EXAM_TREE, "tone");
ok("Tone is its own top-level leaf", EXAM_TREE.some(n => n.id === "tone") && !!tone && Array.isArray(tone.findings));

console.log("\nNeuroLocaliser — EXAM TREE integrity (Sub-project D)\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run to verify it fails**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/app-smoke.test.js 2>&1 | grep -E "SyntaxError|does not provide|passed" | head
```
Expected: FAIL — `exam-map.js` does not provide `EXAM_TREE` / `flattenFindings` yet.

- [ ] **Step 3: Replace `exam-map.js` with the tree**

Replace the entire contents of `app/exam-map.js` with:

```js
// exam-map.js — the exam vocabulary as a NESTED tree (Sub-project D). Data only. Each node has exactly
// one of `groups` (an expandable category) or `findings` (leaf finding ids). Every finding id must be real
// (test/app-smoke.test.js enforces this + full coverage + well-formedness). Depth is 1–3 (only Sensation →
// Limb/hemibody → modality is depth 3). Anything not placed here is surfaced by app.js under "Other findings".
export const EXAM_TREE = [
  { id: "higher", label: "Higher function", groups: [
    { id: "frontal", label: "Frontal", findings: [
      "executive_dysfunction","abulia","disinhibition","limb_apraxia","alien_limb","gait_apraxia","callosal_apraxia" ] },
    { id: "parietal", label: "Parietal", findings: [
      "neglect","anosognosia","constructional_apraxia","dressing_apraxia","ideomotor_apraxia",
      "agraphia","acalculia","finger_agnosia","left_right_disorientation",
      "optic_ataxia","oculomotor_apraxia","simultanagnosia","tactile_anomia" ] },
    { id: "temporal", label: "Temporal", findings: [
      "verbal_memory_impairment","nonverbal_memory_impairment","amnesia","hallucinations","mood_change",
      "cortical_deafness","kluver_bucy" ] },
    { id: "occipital", label: "Occipital", findings: [
      "visual_agnosia","achromatopsia","prosopagnosia","alexia_without_agraphia","cortical_blindness" ] },
  ] },
  { id: "language", label: "Speech & language", findings: [
    "speech_nonfluent","comprehension_impaired","repetition_impaired","naming_impaired","motor_dysprosody",
    "sensory_dysprosody","dysarthria","ataxic_dysarthria","emotional_lability" ] },
  { id: "arousal", label: "Consciousness & arousal", findings: [
    "reduced_consciousness","preserved_vertical_gaze","extensor_posturing" ] },
  { id: "cn", label: "Cranial nerves", groups: [
    { id: "cn1", label: "I — smell", findings: [ "anosmia" ] },
    { id: "cn2", label: "II — vision & fields", findings: [
      "optic_neuropathy","central_scotoma","altitudinal_defect","rapd","homonymous_hemianopia",
      "superior_quadrantanopia","inferior_quadrantanopia","bitemporal_hemianopia","macular_sparing" ] },
    { id: "eom", label: "III / IV / VI — eye movements", findings: [
      "ptosis","weak_adduction","weak_abduction","weak_elevation","weak_depression","vertical_diplopia",
      "gaze_deviation","nystagmus_gaze_evoked","nystagmus_downbeat","nystagmus_upbeat","nystagmus_pendular" ] },
    { id: "cn5", label: "V — face & jaw", findings: [
      "v1_sensory","v2_sensory","v3_sensory","face_pain_loss","face_touch_loss","face_sensory_loss","jaw_weakness" ] },
    { id: "cn7", label: "VII — facial", findings: [
      "facial_weakness","forehead_spared","facial_weak_branch","lacrimation_loss","hyperacusis","taste_loss","gustatory_loss" ] },
    { id: "cn8", label: "VIII — hearing & vestibular", findings: [
      "hearing_loss","cn8_vertigo","nystagmus_peripheral","head_impulse_abnormal",
      "nystagmus_positional_posterior","nystagmus_positional_horizontal","nystagmus_positional_anterior" ] },
    { id: "bulbar", label: "IX–XII — bulbar & neck", findings: [
      "dysphagia","gag_afferent_loss","taste_posterior","palatal_weakness","vocal_cord_palsy","weak_scm",
      "weak_trapezius","cn12_palsy" ] },
  ] },
  { id: "brainstem_pupils", label: "Brainstem & pupils", groups: [
    { id: "brainstem", label: "Gaze & integrative signs", findings: [
      "gaze_palsy","ino","vertical_gaze_palsy","skew_deviation","lid_retraction","nystagmus_convergence_retraction" ] },
    { id: "pupils", label: "Pupils & oculosympathetic", findings: [
      "fixed_dilated_pupil","light_near_dissociation","miosis","anhidrosis_face","anhidrosis_body" ] },
  ] },
  { id: "motor", label: "Motor", groups: [
    { id: "motor_limb", label: "By limb (patterns)", findings: [
      "weak_arm","weak_leg","weak_hand","proximal_weakness","distal_motor_weakness","lmn_weakness","weak_diaphragm" ] },
    { id: "motor_myotome", label: "By myotome (segmental movements)", findings: [
      "weak_shoulder_abduction","weak_shoulder_external_rotation","weak_scapular_stabilisation","weak_elbow_flexion",
      "weak_elbow_extension","weak_forearm_supination","weak_forearm_pronation","weak_wrist_extension",
      "weak_wrist_flexion","weak_finger_extension","weak_finger_flexion","weak_finger_abduction",
      "weak_thumb_abduction","weak_thumb_adduction","ulnar_claw","weak_hip_flexion","weak_hip_adduction",
      "weak_hip_abduction","weak_knee_extension","weak_knee_flexion","weak_ankle_dorsiflexion",
      "weak_great_toe_extension","weak_foot_eversion","weak_foot_inversion","weak_ankle_plantarflexion","weak_toe_flexion" ] },
  ] },
  { id: "tone", label: "Tone", findings: [ "spasticity","rigidity","hypotonia" ] },
  { id: "reflexes", label: "Reflexes", findings: [
    "babinski","hoffmann","umn_signs","reflex_biceps_loss","reflex_brachioradialis_loss","reflex_triceps_loss",
    "reflex_knee_loss","reflex_ankle_loss","grasp_reflex","palmomental","anal_wink_loss","bulbocavernosus_loss" ] },
  { id: "wasting", label: "Wasting & fasciculations", findings: [ "wasting","fasciculations" ] },
  { id: "sensation", label: "Sensation", groups: [
    { id: "sens_limb", label: "Limb / hemibody", groups: [
      { id: "sens_paintemp", label: "Pain & temperature", findings: [ "spinothalamic","thalamic_pain" ] },
      { id: "sens_vibration", label: "Vibration & proprioception", findings: [ "dorsal_sensory","sensory_ataxia" ] },
      { id: "sens_cortical", label: "Cortical / discriminative", findings: [ "cortical_sensory_arm","cortical_sensory_leg","cortical_sensory_hand" ] },
    ] },
    { id: "sens_dermatome", label: "Dermatomal (root)", findings: [
      "sensory_c3","sensory_c4","sensory_c5","sensory_c6","sensory_c7","sensory_c8","sensory_t1","sensory_t4",
      "sensory_t10","sensory_l1","sensory_l2","sensory_l3","sensory_l4","sensory_l5","sensory_s1","sensory_s2","sensory_s3","radicular_pain" ] },
    { id: "sens_nerve", label: "Peripheral-nerve territory", findings: [
      "axillary_sensory","musculocutaneous_sensory","radial_sensory","median_sensory","median_palmar_sensory","ulnar_sensory",
      "ulnar_dorsal_sensory","femoral_sensory","obturator_sensory","lat_fem_cutaneous_sensory","saphenous_sensory",
      "sciatic_sensory","peroneal_sensory","deep_peroneal_sensory","tibial_sensory","sural_sensory" ] },
    { id: "sens_glove", label: "Glove-and-stocking", findings: [ "distal_sensory_loss" ] },
    { id: "sens_level", label: "Sensory level / cord", findings: [ "suspended_sensory","saddle_anaesthesia" ] },
  ] },
  { id: "coordination", label: "Coordination & cerebellar", findings: [
    "limb_ataxia","dysmetria","dysdiadochokinesis","intention_tremor","truncal_ataxia","tremor_rubral","palatal_tremor" ] },
  { id: "movement_dis", label: "Movement disorders", findings: [
    "bradykinesia","rest_tremor","chorea","dystonia","hemiballismus","thalamic_tremor" ] },
  { id: "fatiguability", label: "Fatiguability / augmentation", findings: [
    "fatigable_weakness","fatigable_ocular","facilitating_weakness","autonomic_features" ] },
  { id: "autonomic", label: "Autonomic, sphincter & hypothalamic", findings: [
    "sphincter_dysfunction","urinary_incontinence","diabetes_insipidus","thermodysregulation",
    "hyperphagia","narcolepsy","circadian_disruption","endocrine_dysfunction" ] },
  { id: "functional", label: "Functional signs (positive)", findings: [
    "hoovers_sign","give_way_weakness","entrainment","exam_inconsistency" ] },
];

// every finding id in the tree (for the coverage guarantee + the "Other findings" catch-all)
export function flattenFindings(nodes) {
  const out = [];
  const walk = n => { if (n.findings) out.push(...n.findings); if (n.groups) n.groups.forEach(walk); };
  nodes.forEach(walk);
  return out;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/app-smoke.test.js 2>&1 | tail -3
```
Expected: PASS — `N passed, 0 failed`. If "no finding appears twice" or coverage fails, a finding was mis-parented (moved without removing the original) — fix the tree.

- [ ] **Step 5: Run the full suite**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test 2>&1 | grep -E "failed" | grep -v "0 failed" || echo "ALL SUITES GREEN"
```
Expected: `ALL SUITES GREEN` (no node test imports `app/app.js`, so the not-yet-updated app does not affect the suite).

- [ ] **Step 6: Commit**

```bash
git add app/exam-map.js test/app-smoke.test.js
git commit -m "feat(app): nested EXAM_TREE + flattenFindings; drop presets; rewrite app-smoke"
```

---

### Task 2: Recursive rendering + search; remove presets (`app/app.js`, `app/index.html`)

**Files:**
- Modify: `app/app.js` (import; recursive `examAccordion`; generalise `filterFindings`; remove presets markup + wiring)
- Modify: `app/index.html` (nesting indentation CSS)

**Interfaces:**
- Consumes: `EXAM_TREE`, `flattenFindings` from `./exam-map.js`. Reuses `frow`, `FINDINGS`, `esc`, `desc`.

- [ ] **Step 1: Update the import**

In `app/app.js`, change:
```js
import { EXAM_FLOW, PRESETS } from "./exam-map.js";
```
to:
```js
import { EXAM_TREE, flattenFindings } from "./exam-map.js";
```

- [ ] **Step 2: Replace `examAccordion` with recursive rendering**

In `app/app.js`, replace the whole `examAccordion` function:
```js
function examAccordion() {
  const used = new Set(EXAM_FLOW.flatMap(s => s.findings));
  const other = Object.keys(FINDINGS).filter(f => !used.has(f));
  const steps = other.length ? [...EXAM_FLOW, { id:"other", label:"Other findings", findings:other }] : EXAM_FLOW;
  return steps.map(step => `
    <details data-step="${step.id}"><summary>${esc(step.label)}<span class="c">${step.findings.filter(f=>FINDINGS[f]).length}</span></summary>
      ${step.findings.filter(f=>FINDINGS[f]).map(f=>frow(f)).join("")}
    </details>`).join("");
}
```
with:
```js
function countFindings(node) {
  if (node.findings) return node.findings.filter(f => FINDINGS[f]).length;
  return (node.groups || []).reduce((n, g) => n + countFindings(g), 0);
}
function renderNode(node, depth) {
  const cnt = countFindings(node);
  if (node.findings) {
    const rows = node.findings.filter(f => FINDINGS[f]).map(f => frow(f)).join("");
    return `<details data-step="${esc(node.id)}" class="nx-lvl nx-lvl${depth}"><summary>${esc(node.label)}<span class="c">${cnt}</span></summary>${rows}</details>`;
  }
  const kids = (node.groups || []).map(g => renderNode(g, depth + 1)).join("");
  return `<details data-gid="${esc(node.id)}" class="nx-lvl nx-lvl${depth}"><summary>${esc(node.label)}<span class="c">${cnt}</span></summary><div class="nx-children">${kids}</div></details>`;
}
function examAccordion() {
  const used = new Set(flattenFindings(EXAM_TREE));
  const other = Object.keys(FINDINGS).filter(f => !used.has(f));
  const tree = other.length ? [...EXAM_TREE, { id: "other", label: "Other findings", findings: other }] : EXAM_TREE;
  return tree.map(n => renderNode(n, 0)).join("");
}
```

- [ ] **Step 3: Remove the presets markup**

In `app/app.js` `renderLocalise`, delete this line from the template:
```js
      <div class="presets" id="presets">${PRESETS.map((p,i)=>`<button data-p="${i}">${esc(p.label)}</button>`).join("")}</div>
```

- [ ] **Step 4: Remove the presets wiring**

In `app/app.js` `wireLocalise`, delete this handler:
```js
  document.getElementById("presets").onclick = e => { const i = e.target.dataset.p; if (i==null) return;
    S.tokens = new Set(PRESETS[+i].tokens); renderChips(); renderResults(); markSides(); };
```

- [ ] **Step 5: Generalise `filterFindings` for the tree**

In `app/app.js`, replace `filterFindings`:
```js
function filterFindings(q) {
  const acc = document.getElementById("acc");
  acc.querySelectorAll(".frow").forEach(r => {
    const f = r.dataset.fid; const hit = !q || f.includes(q) || desc(f).toLowerCase().includes(q);
    r.style.display = hit ? "" : "none";
  });
  acc.querySelectorAll("details").forEach(d => { if (q) d.open = true; });
}
```
with (open only the ancestor branches of matches; collapse all when cleared):
```js
function filterFindings(q) {
  const acc = document.getElementById("acc");
  acc.querySelectorAll(".frow").forEach(r => {
    const f = r.dataset.fid; const hit = !q || f.includes(q) || desc(f).toLowerCase().includes(q);
    r.style.display = hit ? "" : "none";
    if (hit && q) { let el = r.parentElement; while (el && el !== acc) { if (el.tagName === "DETAILS") el.open = true; el = el.parentElement; } }
  });
  if (!q) acc.querySelectorAll("details").forEach(d => { d.open = false; });
}
```

- [ ] **Step 6: Add nesting CSS to `app/index.html`**

In `app/index.html`, just before `</style>`, append:
```css
  /* nested exam tree (Sub-project D) */
  .nx-children{padding-left:10px;margin-left:2px;border-left:1px solid var(--line);}
  .accordion .nx-lvl>summary{cursor:pointer;}
  .accordion .nx-lvl1>summary{font-size:12.5px;color:var(--muted);}
  .accordion .nx-lvl2>summary{font-size:12px;color:var(--faint);}
```

- [ ] **Step 7: Verify in the browser**

Start the server if needed: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node app/serve.mjs`.
At `http://localhost:8137/app/`:
- Confirm the **presets row is gone**.
- Expand **Sensation → Limb / hemibody → Pain & temperature**, tick `spinothalamic` R — confirm the chip appears and the differential updates (nesting + ticking works at depth 3).
- Expand **Cranial nerves → VII — facial**, tick `facial_weakness` L.
- Type `weak_c5` in search — confirm its branch (Motor → By myotome) auto-opens and the row shows; clear search — confirm branches collapse.
- Confirm each top-level group shows a finding count badge and no console errors (`read_console_messages`).
- Capture a screenshot of the expanded Sensation cascade.

- [ ] **Step 8: Commit**

```bash
git add app/app.js app/index.html
git commit -m "feat(app): render nested exam tree, generalise search, remove presets UI"
```

---

## Notes for the implementer

- `renderNode` recursion depth: top-level = 0. The classes `nx-lvl0/1/2` drive indentation/typography; keep them additive to the existing `.accordion` styling.
- The accordion click delegation (`document.getElementById("acc").onclick` → `button[data-f]`) already works for nested rows (event delegation on the container) — do not change it.
- The "Other findings" leaf will currently be **empty** (all 228 findings are placed), so it won't render — but keep the computation as the safety net for future findings.
- Do not touch `frow`, `markSides`, `renderChips`, `toggleToken`, or anything after finding entry.
- If the README or memory references presets as a feature, that is out of scope here (docs), not a blocker.

# Code-stroke mode — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a third mode ("Code stroke") — a single-scrolling clinician's cognitive-aid worksheet (intake · live clock · NIHSS · likely syndrome/LVO via the existing localiser · thrombolysis & thrombectomy eligibility checklists · acute-management reference · stroke-mimic prompt · handover summary), framed as educational and citing the 2026 AHA/ASA guideline.

**Architecture:** Pure data (`app/stroke-data.js`) + pure DOM-free logic (`app/stroke-logic.js`) that are unit-tested the project's way; a DOM renderer (`app/code-stroke.js`) that reuses `solve()` for localisation; wired as a third mode in `app/app.js`. Zero engine/model changes; client-only, zero-build, no backend.

**Tech Stack:** Vanilla ES modules; native `Date`/`setInterval`/`Intl`. No framework, no bundler.

## Global Constraints

- **Runtime for every command:** prefix `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"`. Tests: `… npm test`.
- **Zero dependencies, zero build step.** New files are plain ES modules under `app/`.
- **No engine/model changes.** Only `app/` + docs. All existing suites (currently 51) stay green.
- **Test convention:** standalone script; `let pass=0,fail=0; const ok=(l,c)=>{c?pass++:fail++;console.log((c?"PASS  ":"FAIL  ")+l);}`; end `console.log(\`\n${pass} passed, ${fail} failed\`); process.exit(fail===0?0:1);`. Add each new suite to `package.json`'s `test` script.
- **Positioning (hard):** educational cognitive aid — **never** a treat/don't-treat verdict. Outputs are **met / not-met / need-info** + guideline text. A persistent in-mode safety banner and per-criterion citations are required.
- **Clinical-accuracy gate (hard):** no clinical number ships unless attributable to the 2026 AHA/ASA guideline (DOI 10.1161/STR.0000000000000513). Task 1 encodes provisional content already cross-checked from reputable summaries; **Task 8 reconciles it against the primary source and the owner signs off before final commit.** Every `stroke-data.js` item carries a `cite` string.
- **Dev server:** `preview_start {name:"neurolocaliser"}` → http://localhost:8137/app/ ; verify in the Browser pane. The app must be opened at `/app/` (relative module imports break at `/`). Set `localStorage.nl_gate_v1="ok"` to skip the passphrase gate.
- **Finding vocabulary is fixed** (from `src/model/findings.js`): the NIHSS→localiser bridge must emit only existing tokens. Verified tokens to use: `reduced_consciousness`, `gaze_deviation`, `homonymous_hemianopia`, `facial_weakness`, `weak_arm`, `weak_leg`, `limb_ataxia`, `cortical_sensory_arm`, `speech_nonfluent`, `comprehension_impaired`, `dysarthria`, `neglect`. Sides: `left`/`right` for lateralised, `none` for non-lateralised.

---

### Task 1: `stroke-data.js` — clinical content as cited data

Pure data: the standard NIHSS item set, the eligibility criteria (as shapes + provisional cited content), acute-management reference values, and stroke mimics. No logic, no DOM.

**Files:**
- Create: `app/stroke-data.js`
- Test: `test/stroke-data.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `NIHSS_ITEMS: [{ id, label, options:[{score,label}] }]` — the 15 standard items (11 rows; arm/leg split L/R).
  - `THROMBOLYSIS_CRITERIA: [{ id, label, kind:"inclusion"|"contra", auto?, cite }]` and `THROMBECTOMY_CRITERIA` (same shape). `auto` (optional) is the name of a state-derived check filled by the renderer (e.g. `"windowIVT"`, `"age"`, `"nihss6"`, `"mrs01"`).
  - `ACUTE_MGMT: [{ id, title, body, cite }]` — BP / glucose / reversal reference cards.
  - `MIMICS: [string]` — the stroke-mimic prompt list.
  - `GUIDELINE_CITE: string` — the primary-source citation shown in the banner.

- [ ] **Step 1: Write the failing test**

Create `test/stroke-data.test.js`:

```js
// stroke-data.test.js — the code-stroke clinical content is pure, cited data (guards integrity, not medicine).
import { NIHSS_ITEMS, THROMBOLYSIS_CRITERIA, THROMBECTOMY_CRITERIA, ACUTE_MGMT, MIMICS, GUIDELINE_CITE } from "../app/stroke-data.js";

let pass = 0, fail = 0;
const ok = (l, c) => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l); };

// NIHSS: 13 array rows (1a/1b/1c split; arm & leg carry side:true → scored L+R = 15 components); max total 42.
ok("NIHSS models the 13 standard rows", NIHSS_ITEMS.length === 13);
ok("every NIHSS item has options with numeric scores", NIHSS_ITEMS.every(i => i.options.length && i.options.every(o => Number.isInteger(o.score))));
const maxTotal = NIHSS_ITEMS.reduce((s, i) => s + Math.max(...i.options.map(o => o.score)) * (i.side ? 2 : 1), 0);
ok(`NIHSS max total is 42, counting arm/leg per side (got ${maxTotal})`, maxTotal === 42);

// every eligibility criterion + reference card carries a citation (the accuracy gate)
const allCited = [...THROMBOLYSIS_CRITERIA, ...THROMBECTOMY_CRITERIA, ...ACUTE_MGMT];
ok("every criterion / reference card has a non-empty cite", allCited.every(x => typeof x.cite === "string" && x.cite.length > 0));
ok("thrombolysis criteria include both inclusion and contraindication kinds", THROMBOLYSIS_CRITERIA.some(c => c.kind === "inclusion") && THROMBOLYSIS_CRITERIA.some(c => c.kind === "contra"));
ok("thrombectomy criteria reference NIHSS / mRS / ASPECTS / window", /nihss|mrs|aspects|window|hour/i.test(THROMBECTOMY_CRITERIA.map(c => c.label + c.id).join(" ")));
ok("mimics prompt includes glucose-first", MIMICS.some(m => /glucose|hypoglyc/i.test(m)));
ok("guideline citation names the 2026 AHA/ASA source", /2026/.test(GUIDELINE_CITE) && /AHA|ASA|Stroke/i.test(GUIDELINE_CITE));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/stroke-data.test.js`
Expected: FAIL — `Cannot find module '../app/stroke-data.js'`.

- [ ] **Step 3: Write the implementation**

Create `app/stroke-data.js`. The NIHSS items are the standard scale (finite, non-clinical-judgement content). The eligibility/reference content is the **provisional cross-checked draft from the spec's Appendix A** — Task 8 reconciles it against the primary source. Every clinical item carries `cite`.

```js
// stroke-data.js — clinical content for code-stroke mode, as pure cited data. NIHSS is the standard scale.
// Eligibility + reference content is drafted from the 2026 AHA/ASA guideline (see GUIDELINE_CITE) and is
// OWNER-REVIEWED against the primary source before final commit (see the plan's Task 8). Educational only.

export const GUIDELINE_CITE = "2026 AHA/ASA Guideline for the Early Management of Patients With Acute Ischemic Stroke, Stroke (DOI 10.1161/STR.0000000000000513)";

export const NIHSS_ITEMS = [
  { id: "loc",       label: "1a. Level of consciousness",      options: [{score:0,label:"Alert"},{score:1,label:"Drowsy"},{score:2,label:"Obtunded"},{score:3,label:"Coma/unresponsive"}] },
  { id: "locQ",      label: "1b. LOC questions (month, age)",  options: [{score:0,label:"Both correct"},{score:1,label:"One correct"},{score:2,label:"Neither"}] },
  { id: "locC",      label: "1c. LOC commands (eyes, grip)",   options: [{score:0,label:"Both"},{score:1,label:"One"},{score:2,label:"Neither"}] },
  { id: "gaze",      label: "2. Best gaze",                    options: [{score:0,label:"Normal"},{score:1,label:"Partial palsy"},{score:2,label:"Forced deviation"}] },
  { id: "visual",    label: "3. Visual fields",                options: [{score:0,label:"No loss"},{score:1,label:"Partial hemianopia"},{score:2,label:"Complete hemianopia"},{score:3,label:"Bilateral"}] },
  { id: "facial",    label: "4. Facial palsy",                 options: [{score:0,label:"Normal"},{score:1,label:"Minor"},{score:2,label:"Partial"},{score:3,label:"Complete"}] },
  { id: "arm",       label: "5. Motor arm (worse side)",       options: [{score:0,label:"No drift"},{score:1,label:"Drift"},{score:2,label:"Some effort vs gravity"},{score:3,label:"No effort vs gravity"},{score:4,label:"No movement"}], side: true },
  { id: "leg",       label: "6. Motor leg (worse side)",       options: [{score:0,label:"No drift"},{score:1,label:"Drift"},{score:2,label:"Some effort vs gravity"},{score:3,label:"No effort vs gravity"},{score:4,label:"No movement"}], side: true },
  { id: "ataxia",    label: "7. Limb ataxia",                  options: [{score:0,label:"Absent"},{score:1,label:"One limb"},{score:2,label:"Two limbs"}] },
  { id: "sensory",   label: "8. Sensory",                      options: [{score:0,label:"Normal"},{score:1,label:"Mild-moderate loss"},{score:2,label:"Severe/total loss"}] },
  { id: "language",  label: "9. Best language",                options: [{score:0,label:"Normal"},{score:1,label:"Mild-moderate aphasia"},{score:2,label:"Severe aphasia"},{score:3,label:"Mute/global"}] },
  { id: "dysarthria",label: "10. Dysarthria",                  options: [{score:0,label:"Normal"},{score:1,label:"Mild-moderate"},{score:2,label:"Severe"}] },
  { id: "extinction",label: "11. Extinction/inattention",     options: [{score:0,label:"Normal"},{score:1,label:"One modality"},{score:2,label:"Profound/≥2"}] },
];
// NB: items 5 & 6 (`side:true`) are scored per limb (L+R) in the UI — the max-total-42 invariant counts both.

export const THROMBOLYSIS_CRITERIA = [
  { id:"dx",       kind:"inclusion", label:"Disabling acute ischaemic stroke, deficit not clearing", cite:GUIDELINE_CITE },
  { id:"windowIVT",kind:"inclusion", auto:"windowIVT", label:"Within 4.5 h of last-known-well (or extended 4.5–9 h / wake-up with perfusion or DWI-FLAIR mismatch)", cite:GUIDELINE_CITE },
  { id:"bp185",    kind:"inclusion", auto:"bp185",     label:"BP controllable to <185/110 before treatment", cite:GUIDELINE_CITE },
  { id:"glucose",  kind:"inclusion", auto:"glucoseOk", label:"Glucose is not the cause of the deficit (treat hypo/hyperglycaemia)", cite:GUIDELINE_CITE },
  { id:"recentICH",kind:"contra",    label:"Prior intracranial haemorrhage", cite:GUIDELINE_CITE },
  { id:"recentSurg",kind:"contra",   label:"Recent major surgery / serious trauma (per guideline window)", cite:GUIDELINE_CITE },
  { id:"activeBleed",kind:"contra",  label:"Active internal bleeding / bleeding diathesis", cite:GUIDELINE_CITE },
  { id:"anticoag", kind:"contra",    label:"Therapeutic anticoagulation / relevant coagulopathy", cite:GUIDELINE_CITE },
  // NB (Task 8): the 2026 guideline MODIFIED the contraindication list — reconcile this set against the
  // primary source and the owner's local protocol before final commit; add/remove items as verified.
];

export const THROMBECTOMY_CRITERIA = [
  { id:"lvo",       kind:"inclusion", label:"Anterior LVO (ICA or M1) on CTA/MRA (or basilar for posterior)", cite:GUIDELINE_CITE },
  { id:"nihss6",    kind:"inclusion", auto:"nihss6", label:"NIHSS ≥ 6 (≥ 10 for basilar)", cite:GUIDELINE_CITE },
  { id:"mrs01",     kind:"inclusion", auto:"mrs01",  label:"Pre-stroke mRS 0–1", cite:GUIDELINE_CITE },
  { id:"aspects",   kind:"inclusion", label:"ASPECTS 3–10 (<6 h) / 3–5 (6–24 h) / PC-ASPECTS ≥6 (basilar)", cite:GUIDELINE_CITE },
  { id:"windowEVT", kind:"inclusion", auto:"windowEVT", label:"Within 6 h (or 6–24 h selected, age <80, with imaging)", cite:GUIDELINE_CITE },
];

export const ACUTE_MGMT = [
  { id:"bp", title:"Blood pressure", body:"Pre-lysis: control to <185/110 to be eligible. After IVT/EVT: do NOT intensively lower SBP to <140 (no benefit; harmful after EVT) — disciplined, not reflexive lowering. First-24 h upper ceiling: per your local protocol (confirm against the primary source).", cite:GUIDELINE_CITE },
  { id:"glucose", title:"Glucose", body:"Maintain ~140–180 mg/dL; avoid hypoglycaemia (<70). Intensive control (80–130) not recommended.", cite:GUIDELINE_CITE },
  { id:"reversal", title:"Anticoagulation", body:"Establish agent + last dose; reverse per local protocol before/at decision. Baseline ECG/troponin recommended but must not delay IVT/EVT.", cite:GUIDELINE_CITE },
];

export const MIMICS = [
  "Check glucose FIRST — treat hypoglycaemia before calling it a stroke",
  "Seizure with Todd's paresis",
  "Migraine with aura",
  "Functional / conversion",
  "Sepsis or metabolic derangement unmasking an old deficit",
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/stroke-data.test.js`
Expected: PASS — `9 passed, 0 failed`.

- [ ] **Step 5: Add to the test chain**

In `package.json`, append to the end of the `test` script: ` && node test/stroke-data.test.js`

- [ ] **Step 6: Commit**

```bash
git add app/stroke-data.js test/stroke-data.test.js package.json
git commit -m "feat(stroke): code-stroke clinical content as cited data (NIHSS + eligibility + reference)"
```

---

### Task 2: `stroke-logic.js` — NIHSS total + localiser bridge

**Files:**
- Create: `app/stroke-logic.js`
- Test: `test/stroke-logic.test.js`

**Interfaces:**
- Consumes: `NIHSS_ITEMS` (Task 1); finding tokens (Global Constraints).
- Produces:
  - `nihssTotal(nihss) -> number` — `nihss` is `{ loc,locQ,locC,gaze,visual,facial,armL,armR,legL,legR,ataxia,sensory,language,dysarthria,extinction }` (missing = 0).
  - `nihssToFindings(nihss, dominant) -> Set<string>` — maps scored items to `finding@side` tokens for `solve()`. Body-deficit side = the arm/leg side scoring higher (ties → whichever has any score; else no lateralised emit). Gaze deviates toward the lesion (opposite the deficit side).

- [ ] **Step 1: Write the failing test**

Create `test/stroke-logic.test.js`:

```js
// stroke-logic.test.js — pure code-stroke logic (DOM-free, testable in node).
import { nihssTotal, nihssToFindings } from "../app/stroke-logic.js";

let pass = 0, fail = 0;
const ok = (l, c) => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l); };

// nihssTotal sums all components, treating missing as 0
ok("empty NIHSS totals 0", nihssTotal({}) === 0);
ok("sums components incl. both arms/legs", nihssTotal({ gaze:2, armR:4, legR:4, facial:2, language:2 }) === 14);

// nihssToFindings — a right-hemiparetic aphasic pattern (dominant left) → left-hemisphere tokens
const f = nihssToFindings({ facial:2, armR:3, legR:3, gaze:2, visual:2, sensory:1, language:2, dysarthria:1, extinction:0 }, "left");
ok("emits contralateral (right) arm/leg weakness", f.has("weak_arm@right") && f.has("weak_leg@right"));
ok("emits right facial weakness", f.has("facial_weakness@right"));
ok("gaze deviates toward the lesion (left, opposite the deficit)", f.has("gaze_deviation@left"));
ok("emits a right field defect", f.has("homonymous_hemianopia@right"));
ok("emits aphasia tokens (non-lateralised)", f.has("speech_nonfluent@none") && f.has("comprehension_impaired@none"));
ok("emits dysarthria", f.has("dysarthria@none"));
ok("emits cortical sensory on the deficit side", f.has("cortical_sensory_arm@right"));
ok("no extinction token when score 0", ![...f].some(t => t.startsWith("neglect")));

// left-limb weakness → left-side tokens, gaze to the right
const g = nihssToFindings({ armL:4, legL:2, extinction:2 }, "left");
ok("left weakness emits left tokens", g.has("weak_arm@left") && g.has("weak_leg@left"));
ok("extinction emits neglect", g.has("neglect@none"));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/stroke-logic.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `app/stroke-logic.js`:

```js
// stroke-logic.js — pure, DOM-free logic for code-stroke mode. See the design spec
// docs/superpowers/specs/2026-07-28-code-stroke-mode-design.md.

const n = v => Number(v) || 0;
const other = s => s === "left" ? "right" : "left";

// Sum every NIHSS component (arms/legs counted per limb). Missing components are 0.
export function nihssTotal(nihss = {}) {
  const k = ["loc","locQ","locC","gaze","visual","facial","armL","armR","legL","legR","ataxia","sensory","language","dysarthria","extinction"];
  return k.reduce((s, key) => s + n(nihss[key]), 0);
}

// Map a scored NIHSS to localiser finding tokens. Lateralised deficits are emitted on the BODY side
// (contralateral to the lesion — the localiser's crossing model resolves lesion side); gaze deviates
// toward the lesion (opposite the body-deficit side). Aphasia/dysarthria/extinction are non-lateralised.
export function nihssToFindings(nihss = {}, dominant = "left") {
  const out = new Set();
  const rightMotor = n(nihss.armR) + n(nihss.legR), leftMotor = n(nihss.armL) + n(nihss.legL);
  const deficitSide = rightMotor === 0 && leftMotor === 0 ? null : (rightMotor >= leftMotor ? "right" : "left");
  if (n(nihss.armL)) out.add("weak_arm@left");
  if (n(nihss.armR)) out.add("weak_arm@right");
  if (n(nihss.legL)) out.add("weak_leg@left");
  if (n(nihss.legR)) out.add("weak_leg@right");
  if (deficitSide) {
    if (n(nihss.facial)) out.add(`facial_weakness@${deficitSide}`);
    if (n(nihss.visual)) out.add(`homonymous_hemianopia@${deficitSide}`);
    if (n(nihss.sensory)) out.add(`cortical_sensory_arm@${deficitSide}`);
    if (n(nihss.ataxia)) out.add(`limb_ataxia@${deficitSide}`);
    if (n(nihss.gaze)) out.add(`gaze_deviation@${other(deficitSide)}`); // eyes look toward the lesion
  }
  if (n(nihss.language)) { out.add("speech_nonfluent@none"); out.add("comprehension_impaired@none"); }
  if (n(nihss.dysarthria)) out.add("dysarthria@none");
  if (n(nihss.extinction)) out.add("neglect@none");
  if (n(nihss.loc) >= 2) out.add("reduced_consciousness@none");
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/stroke-logic.test.js`
Expected: PASS — `13 passed, 0 failed`.

- [ ] **Step 5: Verify the bridge localises correctly (integration sanity)**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node -e '
Promise.all([import("./app/stroke-logic.js"),import("./src/engine/inverse.js")]).then(([sl,inv])=>{
  const f=sl.nihssToFindings({facial:2,armR:3,legR:3,gaze:2,language:2},"left");
  const r=inv.solve(f,{dominantSide:"left"});
  console.log("top:", r.display[0]?.site.id);
});'
```
Expected: a left-hemisphere cortical/MCA site (e.g. `left_cortex_mca` or `left_cortex_mca_superior`).

- [ ] **Step 6: Add to the test chain + commit**

In `package.json` append ` && node test/stroke-logic.test.js`. Then:
```bash
git add app/stroke-logic.js test/stroke-logic.test.js package.json
git commit -m "feat(stroke): NIHSS total + NIHSS→localiser finding bridge"
```

---

### Task 3: `stroke-logic.js` — time windows + LVO screen

**Files:**
- Modify: `app/stroke-logic.js`
- Test: `test/stroke-logic.test.js` (extend)

**Interfaces:**
- Produces:
  - `timeWindows(lkwISO, nowMs) -> { elapsedMin, ivtStandard, ivtExtended, evtEarly, evtExtended }` where each window is `{ status:"open"|"closing"|"closed"|"unknown", minsLeft:number|null }`. `closing` = ≤30 min left. Missing/invalid `lkwISO` → all `"unknown"`.
  - `lvoScreen(nihss) -> { likely:boolean, reasons:string[] }` — likely when a cortical sign (gaze/language/extinction > 0) is present AND `nihssTotal ≥ 6`.

- [ ] **Step 1: Add failing tests** (append to `test/stroke-logic.test.js`, before the final report block)

```js
import { timeWindows, lvoScreen } from "../app/stroke-logic.js";
const AT = (mins) => { const d = new Date("2026-07-28T08:00:00Z"); return { lkw: d.toISOString(), now: d.getTime() + mins*60000 }; };
{ const a = AT(60); const t = timeWindows(a.lkw, a.now);
  ok("at 60 min IVT standard window is open", t.ivtStandard.status === "open");
  ok("at 60 min elapsed is 60", t.elapsedMin === 60); }
{ const a = AT(275); const t = timeWindows(a.lkw, a.now);
  ok("at 275 min IVT standard is closed", t.ivtStandard.status === "closed");
  ok("at 275 min IVT extended still open", t.ivtExtended.status === "open"); }
{ const a = AT(350); const t = timeWindows(a.lkw, a.now);
  ok("at 350 min EVT early is closing (≤30 left of 360)", t.evtEarly.status === "closing"); }
ok("missing LKW → unknown windows", timeWindows(null, Date.now()).ivtStandard.status === "unknown");

ok("LVO likely: gaze + NIHSS≥6", lvoScreen({ gaze:2, armR:4 }).likely === true);
ok("LVO not likely: low NIHSS", lvoScreen({ armR:1 }).likely === false);
ok("LVO screen gives reasons", lvoScreen({ language:2, armR:4, legR:2 }).reasons.length > 0);
```

- [ ] **Step 2: Run to verify failure**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/stroke-logic.test.js`
Expected: FAIL — `timeWindows`/`lvoScreen` not exported.

- [ ] **Step 3: Implement** (append to `app/stroke-logic.js`)

```js
const WINDOWS = { ivtStandard: 270, ivtExtended: 540, evtEarly: 360, evtExtended: 1440 }; // minutes
function windowStatus(elapsed, limit) {
  if (elapsed >= limit) return { status: "closed", minsLeft: 0 };
  const minsLeft = limit - elapsed;
  return { status: minsLeft <= 30 ? "closing" : "open", minsLeft };
}
export function timeWindows(lkwISO, nowMs = Date.now()) {
  const lkw = lkwISO ? Date.parse(lkwISO) : NaN;
  if (!Number.isFinite(lkw)) {
    const u = { status: "unknown", minsLeft: null };
    return { elapsedMin: null, ivtStandard: u, ivtExtended: u, evtEarly: u, evtExtended: u };
  }
  const elapsedMin = Math.max(0, Math.round((nowMs - lkw) / 60000));
  return {
    elapsedMin,
    ivtStandard: windowStatus(elapsedMin, WINDOWS.ivtStandard),
    ivtExtended: windowStatus(elapsedMin, WINDOWS.ivtExtended),
    evtEarly:    windowStatus(elapsedMin, WINDOWS.evtEarly),
    evtExtended: windowStatus(elapsedMin, WINDOWS.evtExtended),
  };
}
export function lvoScreen(nihss = {}) {
  const reasons = [];
  if (n(nihss.gaze)) reasons.push("gaze deviation");
  if (n(nihss.language)) reasons.push("aphasia");
  if (n(nihss.extinction)) reasons.push("neglect/extinction");
  const total = nihssTotal(nihss);
  const likely = reasons.length > 0 && total >= 6;
  if (likely) reasons.push(`NIHSS ${total} (≥6)`);
  return { likely, reasons };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/stroke-logic.test.js`
Expected: PASS (all, ~21 assertions).

- [ ] **Step 5: Commit**

```bash
git add app/stroke-logic.js test/stroke-logic.test.js
git commit -m "feat(stroke): time-window status + LVO screen"
```

---

### Task 4: `stroke-logic.js` — eligibility summary + handover

**Files:**
- Modify: `app/stroke-logic.js`
- Test: `test/stroke-logic.test.js` (extend)

**Interfaces:**
- Consumes: criteria arrays (Task 1); a `derived` object `{ windowIVT, windowEVT, age, mrs, nihssTotal, sbp, dbp, glucose }` built by the renderer; a `ticks` Set of contraindication ids the clinician marked present.
- Produces:
  - `evalAuto(autoId, derived) -> true|false|null` — evaluates an inclusion criterion's `auto` check (null = need-info).
  - `eligibilitySummary(criteria, derived, ticks) -> { met, notMet, needInfo, contraPresent:[ids] }`.
  - `buildHandover(state, derived) -> string`.

- [ ] **Step 1: Add failing tests** (append before the report block)

```js
import { evalAuto, eligibilitySummary, buildHandover } from "../app/stroke-logic.js";
ok("evalAuto age <80 true", evalAuto("age", { age: 72 }) === true);
ok("evalAuto age missing → null (need-info)", evalAuto("age", {}) === null);
ok("evalAuto nihss6 true at 8", evalAuto("nihss6", { nihssTotal: 8 }) === true);
ok("evalAuto bp185 false when >185/110", evalAuto("bp185", { sbp: 200, dbp: 95 }) === false);
{ const crit = [{ id:"a", kind:"inclusion", auto:"nihss6" }, { id:"b", kind:"inclusion" }, { id:"c", kind:"contra" }];
  const s = eligibilitySummary(crit, { nihssTotal: 8 }, new Set(["c"]));
  ok("summary counts a met inclusion", s.met === 1);
  ok("summary counts a need-info inclusion (no auto, manual)", s.needInfo === 1);
  ok("summary lists present contraindications", s.contraPresent.includes("c")); }
{ const h = buildHandover({ lkw:"2026-07-28T08:00:00Z", nihss:{armR:4} }, { nihssTotal: 4, elapsedMin: 60, topSite: "left MCA" });
  ok("handover includes NIHSS + time + localisation", /NIHSS/.test(h) && /60/.test(h) && /left MCA/.test(h)); }
```

- [ ] **Step 2: Run to verify failure**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/stroke-logic.test.js`
Expected: FAIL — not exported.

- [ ] **Step 3: Implement** (append to `app/stroke-logic.js`)

```js
// Evaluate an inclusion criterion's auto-check against derived state. Returns null when the input is unknown.
export function evalAuto(autoId, d = {}) {
  switch (autoId) {
    case "age":       return d.age == null ? null : d.age < 80;
    case "nihss6":    return d.nihssTotal == null ? null : d.nihssTotal >= 6;
    case "mrs01":     return d.mrs == null ? null : d.mrs <= 1;
    case "bp185":     return (d.sbp == null || d.dbp == null) ? null : (d.sbp < 185 && d.dbp < 110);
    case "glucoseOk": return d.glucose == null ? null : (d.glucose >= 50 && d.glucose <= 400);
    case "windowIVT": return d.windowIVT == null ? null : d.windowIVT;   // renderer passes a boolean from timeWindows
    case "windowEVT": return d.windowEVT == null ? null : d.windowEVT;
    default:          return null;
  }
}
export function eligibilitySummary(criteria = [], derived = {}, ticks = new Set()) {
  let met = 0, notMet = 0, needInfo = 0; const contraPresent = [];
  for (const c of criteria) {
    if (c.kind === "contra") { if (ticks.has(c.id)) contraPresent.push(c.id); continue; }
    const v = c.auto ? evalAuto(c.auto, derived) : (ticks.has(c.id) ? true : null); // manual inclusions: ticked = met
    if (v === true) met++; else if (v === false) notMet++; else needInfo++;
  }
  return { met, notMet, needInfo, contraPresent };
}
export function buildHandover(state = {}, derived = {}) {
  const lines = [
    "CODE STROKE — summary (educational aid; verify against local protocol)",
    `Last-known-well: ${state.lkw || "—"}  |  Elapsed: ${derived.elapsedMin != null ? derived.elapsedMin + " min" : "—"}`,
    `Age: ${state.age ?? "—"}  |  Pre-stroke mRS: ${state.mrs ?? "—"}`,
    `NIHSS: ${derived.nihssTotal ?? "—"}  |  Likely localisation: ${derived.topSite || "—"}  |  LVO screen: ${derived.lvo ? "positive" : "negative/unknown"}`,
    `BP: ${state.sbp ?? "—"}/${state.dbp ?? "—"}  |  Glucose: ${state.glucose ?? "—"}`,
    `Thrombolysis: ${derived.ivtSummary || "—"}`,
    `Thrombectomy: ${derived.evtSummary || "—"}`,
  ];
  return lines.join("\n");
}
```

- [ ] **Step 4: Run to verify pass**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/stroke-logic.test.js`
Expected: PASS (all, ~29 assertions).

- [ ] **Step 5: Commit**

```bash
git add app/stroke-logic.js test/stroke-logic.test.js
git commit -m "feat(stroke): eligibility summary + handover builder"
```

---

### Task 5: Third mode button + worksheet CSS + safety banner

**Files:**
- Modify: `app/index.html` (mode button at line ~219–222; add CSS before `</style>`)

**Interfaces:** none (markup/CSS). Produces the `data-mode="stroke"` button `renderCodeStroke()` (Task 6) targets.

- [ ] **Step 1: Add the mode button**

In `app/index.html`, change the modes block:
```html
      <div class="modes" id="modes">
        <button data-mode="localise" class="on">Localise</button>
        <button data-mode="atlas">Atlas</button>
        <button data-mode="stroke">Code stroke</button>
      </div>
```

- [ ] **Step 2: Add worksheet CSS** (before `</style>`)

```css
  /* code-stroke worksheet */
  .cs-banner{border:1px solid var(--gold);background:var(--gold-bg);color:var(--ink);border-radius:10px;padding:8px 12px;font-size:11.5px;margin:10px 0;}
  .cs-header{position:sticky;top:0;z-index:5;display:flex;flex-wrap:wrap;gap:8px 18px;align-items:center;background:var(--paper);border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow);padding:10px 14px;margin-bottom:12px;}
  .cs-clock{font-family:var(--mono);font-size:18px;font-weight:800;color:var(--ink);} .cs-clock small{font-size:11px;color:var(--muted);font-weight:600;}
  .cs-stat{font-size:12px;color:var(--muted);} .cs-stat b{color:var(--ink);font-size:14px;}
  .cs-lvo{font-size:11px;font-weight:800;padding:3px 9px;border-radius:999px;} .cs-lvo.pos{color:#fff;background:var(--contra);} .cs-lvo.neg{color:var(--muted);background:var(--band);}
  .cs-sec{background:var(--paper);border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow);padding:14px 15px;margin-bottom:12px;}
  .cs-sec>h3{margin:0 0 10px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--navy);}
  .cs-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;}
  .cs-field label{display:block;font-size:11px;color:var(--muted);margin-bottom:3px;} .cs-field input,.cs-field select{width:100%;font:inherit;font-size:13px;padding:6px 8px;border:1px solid var(--line);border-radius:7px;background:var(--band);color:var(--ink);}
  .cs-nihss-row{display:flex;align-items:center;gap:10px;padding:5px 0;border-bottom:1px solid var(--line);font-size:12px;} .cs-nihss-row .lbl{flex:1;min-width:0;} .cs-nihss-row select{font:inherit;font-size:12px;padding:4px 6px;border:1px solid var(--line);border-radius:6px;background:var(--band);color:var(--ink);}
  .cs-win{display:flex;justify-content:space-between;font-size:12px;padding:5px 0;border-bottom:1px solid var(--line);} .cs-win .open{color:var(--ipsi);font-weight:700;} .cs-win .closing{color:var(--gold);font-weight:800;} .cs-win .closed{color:var(--contra);font-weight:700;} .cs-win .unknown{color:var(--faint);}
  .cs-crit{display:flex;align-items:flex-start;gap:8px;font-size:12px;padding:5px 0;border-bottom:1px solid var(--line);} .cs-crit .mark{flex:none;width:16px;text-align:center;} .cs-crit .cite{display:block;font-size:10px;color:var(--faint);}
  .cs-summary{font-size:12.5px;margin-top:8px;} .cs-summary b{color:var(--ink);}
  .cs-mimic{font-size:12px;color:var(--muted);} .cs-mimic li{margin:3px 0;} .cs-mimic li:first-child{color:var(--contra);font-weight:600;}
  .cs-handover{width:100%;min-height:120px;font-family:var(--mono);font-size:11px;padding:9px;border:1px solid var(--line);border-radius:8px;background:var(--band);color:var(--ink);}
```

- [ ] **Step 3: Verify markup loads** (no behaviour yet — the button exists; clicking it does nothing until Task 6)

Run: `preview_start {name:"neurolocaliser"}`, open `http://localhost:8137/app/`, `read_page` → confirm a third "Code stroke" button is present in `#modes`.

- [ ] **Step 4: Commit**

```bash
git add app/index.html
git commit -m "feat(stroke): third mode button + worksheet CSS + safety banner styles"
```

---

### Task 6: `code-stroke.js` — worksheet render (intake · NIHSS · mimic) + mode wiring + clock

**Files:**
- Create: `app/code-stroke.js`
- Modify: `app/app.js` (import; extend `S`; route the `stroke` mode; clock lifecycle)

**Interfaces:**
- Consumes: `NIHSS_ITEMS`, `MIMICS`, `GUIDELINE_CITE` (Task 1); `nihssTotal`, `nihssToFindings`, `timeWindows`, `lvoScreen` (Tasks 2–3); `solve`, `siteName`/`nameForSite`, `esc` (existing app.js — export or pass as needed).
- Produces: `renderCodeStroke(ctx)` where `ctx = { S, app, esc, siteName, solve, syncURL }`; `stopStrokeClock()`.

- [ ] **Step 1: Extend state + wire the mode in `app/app.js`**

Add the import near the other app imports:
```js
import { renderCodeStroke, stopStrokeClock } from "./code-stroke.js";
```
Extend `S` (line 42) with the stroke sub-state:
```js
const S = { mode:"localise", tokens:new Set(), dominant:"left", onset:"", sensoryLevel:"", distalReach:"", atlas:null,
  stroke:{ age:"", lkw:"", mrs:"", sbp:"", dbp:"", glucose:"", nihss:{}, thrombolysisTicks:new Set(), thrombectomyTicks:new Set() } };
```
Change `boot()`'s mode handler + first render to route `stroke` and stop the clock on switch:
```js
  document.getElementById("modes").onclick = e => { const m = e.target.dataset.mode; if (!m || m===S.mode) return;
    stopStrokeClock();
    S.mode = m; document.querySelectorAll("#modes button").forEach(b=>b.classList.toggle("on", b.dataset.mode===m));
    m==="localise" ? renderLocalise() : m==="atlas" ? renderAtlas() : renderStroke(); syncURL(); };
```
And the first-render dispatch:
```js
  try { S.mode==="atlas" ? renderAtlas() : S.mode==="stroke" ? renderStroke() : renderLocalise(); }
  catch (err) { app.innerHTML = errorPanel(err); }
```
Add a thin adapter near the other render functions (passes the app's helpers into the module):
```js
function renderStroke(){ renderCodeStroke({ S, app, esc, siteName, solve, syncURL }); }
```

- [ ] **Step 2: Create `app/code-stroke.js` — intake + NIHSS + mimic + sticky header + clock**

```js
// code-stroke.js — the code-stroke worksheet (a clinician's cognitive aid). Pure consumer of stroke-data,
// stroke-logic, and the localiser. Educational only — never a treat/don't-treat verdict. See the spec.
import { NIHSS_ITEMS, MIMICS, GUIDELINE_CITE } from "./stroke-data.js";
import { nihssTotal, nihssToFindings, timeWindows, lvoScreen } from "./stroke-logic.js";

let clockTimer = null;
export function stopStrokeClock(){ if (clockTimer){ clearInterval(clockTimer); clockTimer = null; } }

export function renderCodeStroke(ctx) {
  const { S, app, esc } = ctx;
  const st = S.stroke;
  app.innerHTML = `
    <div class="cs-banner"><b>Educational cognitive aid</b> — not a medical device, and not a substitute for clinical judgement or your local stroke protocol. Criteria from the ${esc(GUIDELINE_CITE)}; verify before acting. Nothing you enter leaves this browser.</div>
    <div class="cs-header" id="csHeader"></div>
    <div class="cs-sec"><h3>Intake</h3>
      <div class="cs-grid">
        ${field("age","Age","number",st.age)}
        ${field("lkw","Last known well","datetime-local",st.lkw)}
        ${field("mrs","Pre-stroke mRS (0–5)","number",st.mrs)}
        ${field("sbp","Systolic BP","number",st.sbp)}
        ${field("dbp","Diastolic BP","number",st.dbp)}
        ${field("glucose","Glucose (mg/dL)","number",st.glucose)}
      </div>
    </div>
    <div class="cs-sec"><h3>Before you commit — mimics</h3><ul class="cs-mimic">${MIMICS.map(m=>`<li>${esc(m)}</li>`).join("")}</ul></div>
    <div class="cs-sec"><h3>NIHSS</h3><div id="csNihss">${NIHSS_ITEMS.map(nihssRow).join("")}</div></div>
    <div class="cs-sec"><h3>Likely syndrome / LVO</h3><div id="csLoc"></div></div>
    <div class="cs-sec"><h3>Time windows</h3><div id="csWin"></div></div>
    <div class="cs-sec"><h3>Thrombolysis eligibility</h3><div id="csIvt"></div></div>
    <div class="cs-sec"><h3>Thrombectomy eligibility</h3><div id="csEvt"></div></div>
    <div class="cs-sec"><h3>Acute management (reference)</h3><div id="csMgmt"></div></div>
    <div class="cs-sec"><h3>Handover summary</h3><textarea class="cs-handover" id="csHandover" readonly></textarea><button class="report-btn" id="csCopy" style="margin-top:6px">Copy</button></div>`;

  function field(id,label,type,val){ return `<div class="cs-field"><label>${esc(label)}</label><input data-fld="${id}" type="${type}" value="${esc(val??"")}"></div>`; }
  function nihssRow(item){
    if (item.side) return `<div class="cs-nihss-row"><span class="lbl">${esc(item.label)}</span>${sel(item.id+"L","L",item)}${sel(item.id+"R","R",item)}</div>`;
    return `<div class="cs-nihss-row"><span class="lbl">${esc(item.label)}</span>${sel(item.id,"",item)}</div>`;
  }
  function sel(key,tag,item){ const cur=S.stroke.nihss[key]??0;
    return `<label style="font-size:10px;color:var(--muted)">${tag}<select data-nihss="${key}">${item.options.map(o=>`<option value="${o.score}"${o.score===cur?" selected":""}>${o.score} · ${esc(o.label)}</option>`).join("")}</select></label>`; }

  // wire inputs
  app.querySelectorAll("[data-fld]").forEach(el => el.oninput = e => { S.stroke[e.target.dataset.fld] = e.target.value; recompute(ctx); });
  app.querySelectorAll("[data-nihss]").forEach(el => el.onchange = e => { S.stroke.nihss[e.target.dataset.nihss] = Number(e.target.value); recompute(ctx); });
  app.querySelector("#csCopy").onclick = () => { navigator.clipboard?.writeText(app.querySelector("#csHandover").value); };

  stopStrokeClock();
  clockTimer = setInterval(() => paintHeader(ctx), 1000);
  recompute(ctx); // fills header + all output panels (Task 7)
}
```

- [ ] **Step 3: Verify intake + NIHSS render and the clock ticks**

Run: `preview_start {name:"neurolocaliser"}`; in the browser set `localStorage.nl_gate_v1="ok"`, reload `http://localhost:8137/app/`, click **Code stroke**. Confirm (via `read_page`/screenshot): the banner, intake fields, mimic list (glucose-first in accent), the 11 NIHSS rows (arm/leg with L+R selects) render; entering a `last known well` makes the sticky-header clock tick each second; `read_console_messages` clean. (Output panels are empty until Task 7 — expected.)

- [ ] **Step 4: Commit**

```bash
git add app/code-stroke.js app/app.js
git commit -m "feat(stroke): worksheet render (intake/NIHSS/mimic) + mode wiring + live clock"
```

---

### Task 7: `code-stroke.js` — output panels (header · localisation/LVO · windows · eligibility · reference · handover)

**Files:**
- Modify: `app/code-stroke.js` (add `recompute()` + `paintHeader()` + the panel renderers)

**Interfaces:**
- Consumes: everything from Tasks 1–4 + `ctx.solve`, `ctx.siteName`.
- Produces: `recompute(ctx)` (rebuilds all output panels from `S.stroke`) and `paintHeader(ctx)` (clock/NIHSS/LVO header, called each second).

- [ ] **Step 1: Implement `recompute` + `paintHeader` + panel renderers** (append to `app/code-stroke.js`)

```js
import { THROMBOLYSIS_CRITERIA, THROMBECTOMY_CRITERIA, ACUTE_MGMT } from "./stroke-data.js";
import { eligibilitySummary, buildHandover } from "./stroke-logic.js";

const WIN_LABELS = { ivtStandard:"IV thrombolysis ≤4.5 h", ivtExtended:"IVT extended 4.5–9 h / wake-up", evtEarly:"Thrombectomy ≤6 h", evtExtended:"Thrombectomy 6–24 h (selected)" };

function paintHeader(ctx){
  const { S, app, esc } = ctx; const st = S.stroke; const h = app.querySelector("#csHeader"); if (!h) return;
  const tw = timeWindows(st.lkw ? new Date(st.lkw).toISOString() : null, Date.now());
  const total = nihssTotal(st.nihss); const lvo = lvoScreen(st.nihss);
  const clk = tw.elapsedMin == null ? "—:—<small> enter last-known-well</small>" : `${String(Math.floor(tw.elapsedMin/60)).padStart(2,"0")}:${String(tw.elapsedMin%60).padStart(2,"0")}<small> since LKW</small>`;
  h.innerHTML = `<span class="cs-clock">${clk}</span><span class="cs-stat">NIHSS <b>${total}</b></span><span class="cs-lvo ${lvo.likely?"pos":"neg"}">${lvo.likely?"LVO screen +":"LVO screen –"}</span>`;
}

function recompute(ctx){
  const { S, app, esc, siteName, solve } = ctx; const st = S.stroke;
  paintHeader(ctx);
  const total = nihssTotal(st.nihss);
  const tw = timeWindows(st.lkw ? new Date(st.lkw).toISOString() : null, Date.now());
  const lvo = lvoScreen(st.nihss);

  // localisation via the existing engine
  let topSite = "";
  try {
    const findings = nihssToFindings(st.nihss, S.dominant);
    if (findings.size) { const r = solve(findings, { dominantSide: S.dominant }); topSite = r.display[0] ? siteName(r.display[0].site) : ""; 
      app.querySelector("#csLoc").innerHTML = `<div class="cs-summary"><b>Likely:</b> ${esc(topSite||"—")}${lvo.likely?` · <span style="color:var(--contra);font-weight:700">LVO likely — activate stroke team / thrombectomy centre</span>`:""}</div><p class="derived" style="margin-top:4px">A low NIHSS does not exclude a posterior-circulation (basilar) LVO. Screen, not a diagnosis.</p>`; }
    else app.querySelector("#csLoc").innerHTML = `<div class="empty">Enter NIHSS to estimate localisation.</div>`;
  } catch { app.querySelector("#csLoc").innerHTML = `<div class="empty">—</div>`; }

  // time windows
  app.querySelector("#csWin").innerHTML = Object.keys(WIN_LABELS).map(k => {
    const w = tw[k]; const txt = w.status === "unknown" ? "enter LKW" : w.status === "closed" ? "closed" : `${w.status} · ${w.minsLeft} min left`;
    return `<div class="cs-win"><span>${esc(WIN_LABELS[k])}</span><span class="${w.status}">${esc(txt)}</span></div>`;
  }).join("") + `<p class="derived" style="margin-top:6px">Targets: door-to-needle ≤60 min; door-to-groin as fast as possible.</p>`;

  // eligibility — derived inputs
  const num = v => v === "" || v == null ? null : Number(v);
  const derived = { age:num(st.age), mrs:num(st.mrs), nihssTotal:total, sbp:num(st.sbp), dbp:num(st.dbp), glucose:num(st.glucose),
    windowIVT: tw.ivtStandard.status==="unknown"?null:(tw.ivtStandard.status!=="closed"||tw.ivtExtended.status!=="closed"),
    windowEVT: tw.evtEarly.status==="unknown"?null:(tw.evtEarly.status!=="closed"||tw.evtExtended.status!=="closed") };
  app.querySelector("#csIvt").innerHTML = critPanel(THROMBOLYSIS_CRITERIA, derived, st.thrombolysisTicks, ctx);
  app.querySelector("#csEvt").innerHTML = critPanel(THROMBECTOMY_CRITERIA, derived, st.thrombectomyTicks, ctx);
  wireTicks(app.querySelector("#csIvt"), st.thrombolysisTicks, ctx);
  wireTicks(app.querySelector("#csEvt"), st.thrombectomyTicks, ctx);

  // reference cards
  app.querySelector("#csMgmt").innerHTML = ACUTE_MGMT.map(m => `<div class="cs-summary"><b>${esc(m.title)}.</b> ${esc(m.body)} <span class="cite" style="display:block;font-size:10px;color:var(--faint)">${esc(m.cite)}</span></div>`).join("<hr style='border:0;border-top:1px solid var(--line);margin:8px 0'>");

  // handover
  const ivtS = eligibilitySummary(THROMBOLYSIS_CRITERIA, derived, st.thrombolysisTicks);
  const evtS = eligibilitySummary(THROMBECTOMY_CRITERIA, derived, st.thrombectomyTicks);
  const summ = s => `${s.met} met / ${s.notMet} not-met / ${s.needInfo} need-info${s.contraPresent.length?` · ${s.contraPresent.length} contraindication(s) present`:""}`;
  app.querySelector("#csHandover").value = buildHandover(
    { lkw:st.lkw, age:st.age, mrs:st.mrs, sbp:st.sbp, dbp:st.dbp, glucose:st.glucose },
    { elapsedMin:tw.elapsedMin, nihssTotal:total, topSite, lvo:lvo.likely, ivtSummary:summ(ivtS), evtSummary:summ(evtS) });
}

function critPanel(criteria, derived, ticks, ctx){
  const { esc } = ctx;
  const rows = criteria.map(c => {
    if (c.kind === "contra") { const on = ticks.has(c.id);
      return `<label class="cs-crit"><input type="checkbox" data-tick="${c.id}"${on?" checked":""}><span class="mark">${on?"⚠":""}</span><span>${esc(c.label)} <span class="cite">${esc(c.cite)}</span></span></label>`; }
    const v = c.auto ? evalAutoDisplay(c.auto, derived) : (ticks.has(c.id) ? true : null);
    const mark = v === true ? "✓" : v === false ? "✗" : "?";
    const manualBox = c.auto ? "" : `<input type="checkbox" data-tick="${c.id}"${ticks.has(c.id)?" checked":""}>`;
    return `<label class="cs-crit">${manualBox}<span class="mark">${mark}</span><span>${esc(c.label)} <span class="cite">${esc(c.cite)}</span></span></label>`;
  }).join("");
  const s = eligibilitySummary(criteria, derived, ticks);
  return rows + `<div class="cs-summary"><b>${s.met}</b> met · <b>${s.notMet}</b> not-met · <b>${s.needInfo}</b> need-info${s.contraPresent.length?` · <span style="color:var(--contra)"><b>${s.contraPresent.length}</b> contraindication(s) present</span>`:""}. <span class="derived">Not a verdict — confirm against the guideline + local protocol.</span></div>`;
}
function evalAutoDisplay(autoId, derived){ /* mirror evalAuto for the mark */
  const m = { age:"age", nihss6:"nihssTotal", mrs01:"mrs", bp185:"sbp", glucoseOk:"glucose", windowIVT:"windowIVT", windowEVT:"windowEVT" };
  return evalAutoLocal(autoId, derived);
}
function evalAutoLocal(autoId, d){
  switch(autoId){
    case "age": return d.age==null?null:d.age<80;
    case "nihss6": return d.nihssTotal==null?null:d.nihssTotal>=6;
    case "mrs01": return d.mrs==null?null:d.mrs<=1;
    case "bp185": return (d.sbp==null||d.dbp==null)?null:(d.sbp<185&&d.dbp<110);
    case "glucoseOk": return d.glucose==null?null:(d.glucose>=50&&d.glucose<=400);
    case "windowIVT": return d.windowIVT==null?null:d.windowIVT;
    case "windowEVT": return d.windowEVT==null?null:d.windowEVT;
    default: return null;
  }
}
function wireTicks(container, ticks, ctx){
  container.querySelectorAll("[data-tick]").forEach(el => el.onchange = e => {
    const id = e.target.dataset.tick; e.target.checked ? ticks.add(id) : ticks.delete(id); recompute(ctx);
  });
}
```

> **DRY note:** `evalAutoLocal` duplicates `evalAuto` from `stroke-logic.js`. To keep one source of truth, import `evalAuto` from `stroke-logic.js` and delete `evalAutoDisplay`/`evalAutoLocal`, calling `evalAuto(c.auto, derived)` directly in `critPanel`. (Written inline here only so the task reads standalone — prefer the import.)

- [ ] **Step 2: Replace the duplication with the import**

At the top of `app/code-stroke.js`, add `evalAuto` to the `stroke-logic.js` import; in `critPanel` replace `evalAutoDisplay(c.auto, derived)` with `evalAuto(c.auto, derived)`; delete `evalAutoDisplay` and `evalAutoLocal`.

- [ ] **Step 3: Verify the full worksheet in the browser**

Run: `preview_start`, open `/app/`, Code stroke. Enter a **left-MCA pattern**: LKW ~90 min ago; NIHSS gaze 2, facial 2, arm-R 3, leg-R 3, language 2. Confirm:
- header clock ticks, NIHSS total updates, LVO screen shows **+**;
- Likely = a left MCA/cortex site; posterior-circulation caveat shown;
- time windows show IVT ≤4.5h **open**;
- thrombolysis panel auto-marks window/BP/glucose, contraindication ticks toggle the summary;
- thrombectomy panel marks NIHSS≥6 ✓, mRS need-info until entered;
- reference cards show BP/glucose/reversal with citations;
- handover textarea populates; **Copy** works.
`read_console_messages` clean; screenshot for the record.

- [ ] **Step 4: Commit**

```bash
git add app/code-stroke.js
git commit -m "feat(stroke): output panels — localisation/LVO, windows, eligibility, reference, handover"
```

---

### Task 8: Primary-source reconciliation (owner review) + docs + full regression

The clinical accuracy gate. Nothing in this task invents content — it verifies and records.

**Files:**
- Modify: `app/stroke-data.js` (only if the owner's review changes content), `README.md`, `CLAUDE.md`, `CONTRIBUTING.md`.

- [ ] **Step 1: Fetch the primary guideline + reconcile**

Fetch the primary source (`https://www.ahajournals.org/doi/10.1161/STR.0000000000000513`) and, if paywalled, the AHA "top things to know" + Guideline Central + emDocs. Reconcile each `stroke-data.js` clinical item against it, especially: the **modified contraindication list**, the **exact post-lysis BP ceiling**, tenecteplase/alteplase specifics, and the EVT ASPECTS/mRS/window sub-criteria. Record the source used in each `cite`.

- [ ] **Step 2: Owner review checkpoint**

Present the reconciled `THROMBOLYSIS_CRITERIA` / `THROMBECTOMY_CRITERIA` / `ACUTE_MGMT` content to the owner (a clinician) for sign-off. Apply their corrections. **Do not proceed to the count/docs step until the owner approves the clinical content.**

- [ ] **Step 3: Full regression**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: exit 0; the three new suites (`stroke-data`, `stroke-logic`) plus all existing suites pass.

- [ ] **Step 4: Update the README suite list + docs**

Add `stroke-data` + `stroke-logic` to the README's `npm test` suite list (same style as the others). In `CLAUDE.md` add a "Code stroke mode (done)" milestone line + update the suite/assertion count; in `CONTRIBUTING.md` note the new mode and that its clinical content is owner-reviewed against the 2026 AHA/ASA guideline.

- [ ] **Step 5: Commit**

```bash
git add app/stroke-data.js README.md CLAUDE.md CONTRIBUTING.md
git commit -m "docs+content: reconcile code-stroke criteria to primary source (owner-reviewed); mark mode done"
```

---

## Deploy

`main` auto-redeploys on push (GitHub Pages). Push only after Task 8's owner sign-off, so no unverified clinical content goes live. The safety banner + per-criterion citations must be visibly present before sharing with testers.

## Self-review notes (for the executor)

- **Spec coverage:** intake/clock/NIHSS/localisation+LVO → T6/T7; time windows → T3/T7; thrombolysis + thrombectomy checklists → T1/T4/T7; reference cards → T1/T7; mimic prompt → T1/T6; handover → T4/T7; safety framing + citations → T1/T5/T7; testing → T1–T4 + T8; accuracy gate → T1 (provisional, cited) + T8 (primary-source reconciliation + owner sign-off).
- **Type consistency:** `nihss` component keys (`armL/armR/legL/legR` etc.) are consistent across `nihssTotal`/`nihssToFindings`/renderer; `evalAuto` auto-ids (`age/nihss6/mrs01/bp185/glucoseOk/windowIVT/windowEVT`) match the `auto` fields in `stroke-data.js` criteria; `eligibilitySummary` shape (`{met,notMet,needInfo,contraPresent}`) consistent in logic + renderer + handover.
- **Deliberate content deferral (not a placeholder-failure):** exact contraindication list + post-lysis BP ceiling are encoded provisionally-with-citation in T1 and reconciled to the primary source under owner review in T8 — this is the spec's hard accuracy gate, not a TODO.
```
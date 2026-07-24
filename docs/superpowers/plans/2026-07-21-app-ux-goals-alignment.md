# App UX Goals Alignment Implementation Plan

> **✅ IMPLEMENTED (2026-07-21)** — all four workstreams executed inline (TDD + review checkpoints). 44 suites / 1562 assertions green; app verified in-browser at each checkpoint. See memory `app-ux-goals-alignment-done`.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the NeuroLocaliser app into line with the four target goals — (1) input as single findings grouped the way a neuro exam runs (higher-cortical by lobe, a Brainstem group, a Fatiguability step, clinician-friendly labels), (2) synthesise findings → localise with near-miss *relaxation* and a *functional/non-organic* flag, (3) tempo-aware DDx for the location(s), (4) an *educational next-steps* layer (first-line investigations, urgency + referral, red flags), plus a derived **UMN-vs-LMN** readout.

**Architecture:** Four independent workstreams (A input, B UMN/LMN synthesis, C relaxation + functional, D next-steps content), executed A→B→C→D with a review checkpoint between each. The engine stays "derive, don't store": new layers are small pure functions over the existing findings/sites; the app remains a thin consumer. No syndrome is ever hard-coded as a rule.

**Tech Stack:** Zero-dependency ES modules, Node v24 (off PATH — see Global Constraints). No test framework: each `test/*.js` is a standalone script using a local `ok(label, cond)` helper and `process.exit`. The app (`app/`) is zero-build static ESM served by `app/serve.mjs`.

## Global Constraints

- **Node is off PATH.** Prefix EVERY command: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" …`. Never re-diagnose "node not found".
- **Run all tests:** `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test` (chained `&&`; non-zero exit on any failure). Baseline at start: **41 suites / 1516 assertions green** (app-smoke tail prints `… passed, 0 failed`).
- **Run one suite:** `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/<suite>.test.js`.
- **New test suites** must be added to the `test` script in `package.json` AND the README test list.
- **Derive, don't store (golden rule):** never `if (hasX && hasY) return syndrome`. New synthesis (UMN/LMN, functional) is a transparent function over the finding set, not a per-syndrome rule table.
- **Findings vocabulary is now fully raw** (post raw-observations refactor): weakness = `weak_arm`/`weak_leg`/`weak_hand`/`facial_weakness`(+`forehead_spared`); ocular = ductions; bulbar = `dysphagia`+`palatal_weakness`+`vocal_cord_palsy`; Horner = `miosis`+`ptosis`; parkinsonism = `bradykinesia`+`rest_tremor`+`rigidity`; Gerstmann/Balint decomposed. `hemiparesis`/`cn3_palsy`/`horner`/etc. are RETIRED — do not reintroduce them.
- **`app/exam-map.js` is guarded by `test/app-smoke.test.js`**: every id in `EXAM_FLOW` and every `PRESETS` token must be a real finding; any finding not in `EXAM_FLOW` auto-appears under "Other findings" (nothing is lost).
- **Not a medical device; not for clinical use.** Workstream D content is framed as *teaching prompts*, never directives — no drug doses, no definitive management. A visible disclaimer accompanies the next-steps panel.
- **Verify UI changes in-browser** (`node app/serve.mjs` → http://localhost:8137/app/); verify model changes with `npm test` staying green.

---

# WORKSTREAM A — Input restructure (Goal 1)

Data/UI only, no engine change. Three concrete changes: higher-cortical split by lobe (+ speech), a Brainstem group, a Fatiguability step; then clinician-friendly labels. The rest of the exam flow (CN steps, motor, sensation, tone, reflexes, coordination, autonomic) already follows the exam and is kept.

### Task A1: Restructure `EXAM_FLOW` — higher-cortical by lobe, brainstem group, fatiguability step

**Files:**
- Modify: `app/exam-map.js` (the `EXAM_FLOW` array)
- Test: `test/app-smoke.test.js` (extend coverage assertions)

**Interfaces:**
- Produces: an `EXAM_FLOW` where every finding id is still real (app-smoke guard) and the new step ids exist: `frontal`, `parietal`, `temporal`, `occipital`, `language`, `brainstem`, `fatiguability`.

- [ ] **Step 1: Write the failing coverage test** — add to `test/app-smoke.test.js` (before the final report):

```js
// --- Goal-1 taxonomy: lobe-subcategorised higher cortical + brainstem + fatiguability ---
import { EXAM_FLOW as FLOW2 } from "../app/exam-map.js";
const stepIds = new Set(FLOW2.map(s => s.id));
for (const id of ["frontal","parietal","temporal","occipital","language","brainstem","fatiguability"])
  ok(`exam step '${id}' exists`, stepIds.has(id));
ok("no monolithic 'cognition' bucket remains", !stepIds.has("cognition"));
// the fatiguability step carries the MG/LEMS discriminators
{ const f = FLOW2.find(s => s.id === "fatiguability");
  ok("fatiguability step has fatigable + facilitating findings",
     ["fatigable_weakness","fatigable_ocular","facilitating_weakness"].every(x => f.findings.includes(x))); }
```

- [ ] **Step 2: Run it — verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/app-smoke.test.js`
Expected: FAILs (`cognition` still exists, new step ids absent).

- [ ] **Step 3: Rewrite the higher-cortical + brainstem + fatiguability steps** in `app/exam-map.js`. Replace the single `cognition` step and the `speech` step with these lobe/domain steps, add a `brainstem` step, and add a `fatiguability` step. Keep every other step (`arousal`, `cn1`, `cn2`, `eom`, `pupils`, `cn5`, `cn7`, `cn8`, `bulbar`, `power`, `movements`, `tone`, `reflexes`, `coordination`, `sensation`, `movement_dis`, `autonomic`, `wasting`) unchanged. Insert the new steps in exam order (frontal → parietal → temporal → occipital → language, then after arousal keep CN steps, and place `brainstem` after `bulbar`, `fatiguability` near the end before `autonomic`):

```js
  { id: "frontal", label: "Higher function — frontal", findings: [
    "executive_dysfunction","abulia","disinhibition","limb_apraxia","alien_limb","gait_apraxia",
    "urinary_incontinence","gaze_deviation","grasp_reflex","palmomental","callosal_apraxia" ] },
  { id: "parietal", label: "Higher function — parietal", findings: [
    "neglect","anosognosia","constructional_apraxia","dressing_apraxia","ideomotor_apraxia",
    "agraphia","acalculia","finger_agnosia","left_right_disorientation",
    "optic_ataxia","oculomotor_apraxia","simultanagnosia","tactile_anomia" ] },
  { id: "temporal", label: "Higher function — temporal", findings: [
    "verbal_memory_impairment","nonverbal_memory_impairment","amnesia","hallucinations","mood_change",
    "cortical_deafness","kluver_bucy" ] },
  { id: "occipital", label: "Higher function — occipital", findings: [
    "visual_agnosia","achromatopsia","prosopagnosia","alexia_without_agraphia","cortical_blindness" ] },
  { id: "language", label: "Speech & language", findings: [
    "speech_nonfluent","comprehension_impaired","repetition_impaired","naming_impaired",
    "motor_dysprosody","sensory_dysprosody","dysarthria","ataxic_dysarthria" ] },
```

Add after the `bulbar` step (collects the intra-axial brainstem integrative signs; the discrete CN findings stay in their CN steps):

```js
  { id: "brainstem", label: "Brainstem (gaze, crossed & long-tract signs)", findings: [
    "gaze_palsy","ino","vertical_gaze_palsy","skew_deviation","lid_retraction",
    "nystagmus_upbeat","nystagmus_downbeat","reduced_consciousness","extensor_posturing","preserved_vertical_gaze" ] },
```

Add before the `autonomic` step:

```js
  { id: "fatiguability", label: "Fatiguability / augmentation with repetition", findings: [
    "fatigable_weakness","fatigable_ocular","facilitating_weakness","autonomic_features" ] },
```

Remove `"fatigable_weakness"` / `"facilitating_weakness"` from the `power` step and `"fatigable_ocular"` from the `eom` step (they now live in `fatiguability`; a finding may appear in only one step to avoid duplicate rows). Leave `"autonomic_features"` also under `autonomic` — it is a genuine cross-listing hint; **decision:** list it only in `fatiguability` here to keep single-listing (remove from `autonomic`). Keep `emotional_lability` — move it to the `frontal`/`language` step or leave under whichever it currently sits; place it in `language` (pseudobulbar affect).

- [ ] **Step 4: Run app-smoke — verify green**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/app-smoke.test.js`
Expected: PASS, including the new step assertions and the existing "every EXAM_FLOW id is a real finding" guard. Any finding accidentally dropped from all steps still surfaces under auto-"Other findings" — but verify the count didn't unexpectedly balloon (the smoke test can assert `Other` is small/empty).

- [ ] **Step 5: Full suite green**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: all suites PASS (exam-map is data; engine untouched).

- [ ] **Step 6: Commit / checkpoint.**

### Task A2: Clinician-friendly finding labels (demote the raw id)

**Files:**
- Modify: `app/app.js` (`frow()` ~L76-82)
- Verify: in-browser

**Interfaces:**
- Consumes: `desc(f)` (already returns the raw-observation description), `FINDINGS`.

- [ ] **Step 1: Rewrite `frow()`** so the human description is the primary label and the raw id is demoted to a small muted tag (or a `title` tooltip). Replace the `.nm` block:

```js
function frow(f) {
  const sides = sidesOf(f);
  const btns = (NON_LATERALISED.has(f) || (sides.length===1 && sides[0]==="none"))
    ? `<button data-f="${f}" data-s="none">add</button>`
    : sides.filter(s=>s!=="none").map(s=>`<button data-f="${f}" data-s="${s}">${sideTag(s)}</button>`).join("");
  return `<div class="frow" data-fid="${f}" title="${esc(f)}"><div class="nm"><span class="fd-primary">${esc(desc(f))}</span> <span class="fid-mini">${esc(f)}</span></div><div class="sides">${btns}</div></div>`;
}
```

- [ ] **Step 2: Add CSS** in `app/index.html` (or wherever the app styles live) so `.fd-primary` is the prominent label and `.fid-mini` is small/muted (font-size ~10px, `var(--faint)`). If styles are inline in index.html, add:

```css
.fd-primary{font-weight:600}
.fid-mini{font-size:10px;color:var(--faint);font-family:monospace}
```

- [ ] **Step 3: Verify in-browser** — `preview_start` the app, open a step, confirm each row reads as the clinical description first (e.g. "Arm weakness") with `weak_arm` as a small tag. Screenshot as proof.

- [ ] **Step 4: Commit / checkpoint. → REVIEW CHECKPOINT A.**

---

# WORKSTREAM B — UMN-vs-LMN synthesis readout (Goal 1.v/1.vi)

A new pure function that reads the observed finding set and returns an explicit UMN / LMN / mixed determination, surfaced as a small panel. Reuses the existing non-localising signs; the engine's localisation is unchanged.

### Task B1: `umnLmnPattern()` synthesis function

**Files:**
- Create: `src/engine/patterns.js`
- Test: `test/patterns.test.js` (new suite; register in `package.json` + README)

**Interfaces:**
- Produces: `umnLmnPattern(observedSet) -> { verdict, umnSigns, lmnSigns, note }` where `verdict` ∈ `"UMN" | "LMN" | "mixed" | null` and `umnSigns`/`lmnSigns` are arrays of the matched finding ids (bare, side-stripped).

- [ ] **Step 1: Write the failing test** — create `test/patterns.test.js`:

```js
import { umnLmnPattern } from "../src/engine/patterns.js";
let pass=0, fail=0;
const ok=(l,c)=>{c?pass++:fail++;console.log((c?"PASS  ":"FAIL  ")+l);};
const S=(...t)=>new Set(t);

ok("spasticity + Babinski -> UMN",
   umnLmnPattern(S("spasticity@left","babinski@left")).verdict === "UMN");
ok("wasting + fasciculations + areflexia -> LMN",
   umnLmnPattern(S("wasting@left","fasciculations@left","reflex_ankle_loss@left")).verdict === "LMN");
ok("UMN + LMN together -> mixed (think MND)",
   umnLmnPattern(S("spasticity@left","babinski@left","wasting@left","fasciculations@left")).verdict === "mixed");
ok("no UMN/LMN signs -> null",
   umnLmnPattern(S("neglect@left","comprehension_impaired@none")).verdict === null);
ok("mixed note mentions MND", /mnd|motor neurone|amyotroph/i.test(umnLmnPattern(S("spasticity@left","wasting@left")).note));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail===0?0:1);
```

- [ ] **Step 2: Run it — verify it fails** (`patterns.js` not found).

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/patterns.test.js`
Expected: FAIL (module missing).

- [ ] **Step 3: Implement `src/engine/patterns.js`:**

```js
// patterns.js — cross-cutting SYNTHESIS over the observed findings (not localisation).
// The UMN-vs-LMN determination: the tone/reflex/wasting signs the localiser treats as non-localising
// annotations, read together, answer the UMN/LMN question. Co-occurrence of BOTH is the MND (ALS) precursor.
const UMN = new Set(["spasticity","babinski","hoffmann","umn_signs","grasp_reflex"]);
const LMN = new Set(["wasting","fasciculations","hypotonia","lmn_weakness",
  "reflex_biceps_loss","reflex_brachioradialis_loss","reflex_triceps_loss","reflex_knee_loss","reflex_ankle_loss"]);

const idOf = t => t.split("@")[0];

export function umnLmnPattern(observedSet) {
  const ids = [...observedSet].map(idOf);
  const umnSigns = [...new Set(ids.filter(f => UMN.has(f)))];
  const lmnSigns = [...new Set(ids.filter(f => LMN.has(f)))];
  const hasU = umnSigns.length > 0, hasL = lmnSigns.length > 0;
  let verdict = null, note = "";
  if (hasU && hasL) { verdict = "mixed";
    note = "Combined UMN + LMN signs — a single lesion cannot produce both; consider motor neurone disease (MND/ALS) or a multi-level process."; }
  else if (hasU) { verdict = "UMN";
    note = "Upper motor neurone pattern (increased tone, hyperreflexia / extensor plantar) — lesion is above the anterior horn (cortex → corticospinal tract)."; }
  else if (hasL) { verdict = "LMN";
    note = "Lower motor neurone pattern (wasting, fasciculation, hypotonia, areflexia) — lesion is at the anterior horn, root, plexus, nerve, or NMJ/muscle."; }
  return { verdict, umnSigns, lmnSigns, note };
}
```

- [ ] **Step 4: Run test — verify it passes.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/patterns.test.js`
Expected: `5 passed, 0 failed`.

- [ ] **Step 5: Register the suite** — add `&& node test/patterns.test.js` to `package.json` `test` script and the README list. Run the full suite — all green.

- [ ] **Step 6: Commit / checkpoint.**

### Task B2: Surface the UMN/LMN readout in the app

**Files:**
- Modify: `app/app.js` (import + `renderResults`/`diffBlock`)

**Interfaces:**
- Consumes: `umnLmnPattern` from `src/engine/patterns.js`.

- [ ] **Step 1: Import and render.** In `app/app.js` add `import { umnLmnPattern } from "../src/engine/patterns.js";`. In `diffBlock()` (after the `annot` block, before `rows`), compute and render the pattern when present:

```js
  const pat = umnLmnPattern(S.tokens);
  let umnlmn = "";
  if (pat.verdict) umnlmn = `<div class="annot"><b>${pat.verdict === "mixed" ? "UMN + LMN (mixed)" : pat.verdict} pattern:</b> ${esc(pat.note)}</div>`;
```

and include `${umnlmn}` in the returned template alongside `${annot}`.

- [ ] **Step 2: Verify in-browser** — enter `spasticity@left` + `babinski@left` + `weak_arm@left` → the panel shows "UMN pattern". Add `wasting@left` + `fasciculations@left` → it flips to "UMN + LMN (mixed) … consider MND". Screenshot.

- [ ] **Step 3: Commit / checkpoint. → REVIEW CHECKPOINT B.**

---

# WORKSTREAM C — Relaxation + functional/non-organic layer (Goal 2.1)

**⚠ DESIGN DECISION TO CONFIRM AT CHECKPOINT B (before starting C):** how much relaxation is "slight". This plan implements **drop-1 relaxation**: if no single site explains all *localising* findings, retry allowing exactly ONE observed finding to go unexplained; if a single site then covers the rest, surface it as a *near-fit* ("explains all but {finding}") ranked above the multifocal hypothesis. Confirm this (vs a downweight/tolerance approach) before Task C1.

### Task C1: Drop-1 near-fit relaxation in `solve()`

**Files:**
- Modify: `src/engine/inverse.js` (`solve()` + a new `nearFit()` helper)
- Test: `test/relaxation.test.js` (new suite; register)

**Interfaces:**
- Produces: `solve(...)` result gains a `nearFit` field: `null`, or `{ site, missing }` where `missing` is the single observed token the site does not explain. Only set when `singleExplainsAll` is false AND a single site explains all-but-one.

- [ ] **Step 1: Write the failing test** — create `test/relaxation.test.js`. Construct a case where one stray finding blocks a single-site fit, and assert `nearFit` names the site + the stray token. Use a real over-constrained example (a cortical MCA picture + one incompatible brainstem sign):

```js
import { solve } from "../src/engine/inverse.js";
let pass=0, fail=0;
const ok=(l,c)=>{c?pass++:fail++;console.log((c?"PASS  ":"FAIL  ")+l);};

// Right-MCA total picture + ONE stray finding no MCA site explains (an unrelated ipsilateral CN sign)
const set = new Set(["weak_arm@left","weak_leg@left","facial_weakness@left","neglect@left","cortical_sensory_arm@left","dysphagia@left"]);
const r = solve(set, { dominantSide: "left" });
ok("no single site explains ALL (dysphagia is the odd one out)", r.singleExplainsAll === false);
ok("nearFit surfaces a site explaining all-but-one", !!r.nearFit && !!r.nearFit.site);
ok("nearFit names the stray finding as missing", r.nearFit && /dysphagia/.test(r.nearFit.missing));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail===0?0:1);
```

(Adjust the stray token after a first run if the chosen one is coincidentally explained; pick one genuinely outside the MCA territory.)

- [ ] **Step 2: Run it — verify it fails** (`nearFit` is undefined).

- [ ] **Step 3: Implement `nearFit()` and wire it into `solve()`** in `src/engine/inverse.js`. Add after `minimalSet`:

```js
// Drop-1 relaxation: is there a single site that explains ALL localising findings except one observed token?
// Surfaced as a near-fit BEFORE declaring multifocal — "slight relaxation of parameters".
export function nearFit(observedSet, opts = {}) {
  const observed = [...observedSet];
  for (const drop of observed) {
    const relaxed = new Set(observed.filter(t => t !== drop));
    const best = rankSingle(relaxed, opts)[0];
    if (best && coversAllLocalising(best, relaxed)) return { site: best.site, missing: drop };
  }
  return null;
}
```

In `solve()`, after computing `multi`, add:

```js
  let nf = null;
  if (!singleExplainsAll) nf = nearFit(observedSet, opts);
```

and add `nearFit: nf` to the returned object.

- [ ] **Step 4: Run test — verify green.** Then run the FULL suite (`npm test`) — the new field is additive; nothing should break.

- [ ] **Step 5: Register `test/relaxation.test.js`** in `package.json` + README. Full suite green.

- [ ] **Step 6: Commit / checkpoint.**

### Task C2: Functional (FND) positive-sign layer

**Files:**
- Modify: `src/model/findings.js` (add FND findings + `CROSSES` + `NON_LATERALISED`), `src/engine/patterns.js` (add `functionalFlag`)
- Test: `test/patterns.test.js` (extend)

**Interfaces:**
- Produces: FND findings `hoovers_sign`, `give_way_weakness`, `entrainment`, `exam_inconsistency` (all NON_LATERALISED, NOT in LOCALISING, NO producing structure — they never localise). `functionalFlag(observedSet) -> { functional: bool, signs: [...], note }`.

- [ ] **Step 1: Write the failing test** — extend `test/patterns.test.js`:

```js
import { functionalFlag } from "../src/engine/patterns.js";
import { isFinding, NON_LATERALISED } from "../src/model/findings.js";
ok("FND findings exist and are non-lateralised",
   ["hoovers_sign","give_way_weakness","entrainment","exam_inconsistency"].every(f => isFinding(f) && NON_LATERALISED.has(f)));
ok("a positive FND sign flags functional",
   functionalFlag(new Set(["give_way_weakness@none","weak_arm@left"])).functional === true);
ok("no FND sign -> not flagged", functionalFlag(new Set(["weak_arm@left"])).functional === false);
```

- [ ] **Step 2: Run — verify it fails.**

- [ ] **Step 3: Add the FND findings** to `src/model/findings.js` `FINDINGS` (with a `group: "Functional"`), add each to `CROSSES` as `false`, and to the `NON_LATERALISED` set. Do NOT add any structure in `structures.js` (they must not localise), and do NOT add them to `LOCALISING` in `score.js`:

```js
  hoovers_sign:       { desc: "Hoover's sign (hip extension returns with contralateral hip flexion)", group: "Functional" },
  give_way_weakness:  { desc: "Give-way / collapsing weakness (inconsistent effort)", group: "Functional" },
  entrainment:        { desc: "Tremor entrains to a voluntary rhythm", group: "Functional" },
  exam_inconsistency: { desc: "Inconsistency / distractibility of the sign", group: "Functional" },
```

- [ ] **Step 4: Add `functionalFlag`** to `src/engine/patterns.js`:

```js
const FND = new Set(["hoovers_sign","give_way_weakness","entrainment","exam_inconsistency"]);
export function functionalFlag(observedSet) {
  const signs = [...new Set([...observedSet].map(t => t.split("@")[0]).filter(f => FND.has(f)))];
  return { functional: signs.length > 0, signs,
    note: signs.length ? "Positive functional (non-organic) signs present — consider a functional neurological disorder. These do not localise and should not be scored as an organic deficit." : "" };
}
```

- [ ] **Step 5: Add the FND findings to a `functional` exam step** in `app/exam-map.js`:

```js
  { id: "functional", label: "Functional signs (positive)", findings: [
    "hoovers_sign","give_way_weakness","entrainment","exam_inconsistency" ] },
```

- [ ] **Step 6: Run — verify green.** Full suite green (the FND findings emit no `@side` tokens from any site, so no localisation test changes).

- [ ] **Step 7: Commit / checkpoint.**

### Task C3: App messaging — near-fit + functional + "can't localise"

**Files:**
- Modify: `app/app.js` (`diffBlock` + `renderResults`)

- [ ] **Step 1: Render the near-fit and functional flags.** In `diffBlock()`, when `!nAll`:
  - if `r.nearFit`, show a "Near-fit" line above the multifocal banner: `<div class="annot"><b>Near-fit:</b> ${siteName(r.nearFit.site)} explains all but <code>${esc(r.nearFit.missing)}</code> — re-check that finding, or consider a second lesion.</div>`
  - compute `const fnd = functionalFlag(S.tokens);` (import it) and if `fnd.functional`, show `<div class="multi" style="border-color:var(--gold)"><b>⚠ Consider functional.</b> ${esc(fnd.note)}</div>`.
- In `renderResults()`, extend the zero-match branch (currently "this may be non-organic") to also fire the functional flag when FND signs are present even if other findings exist but nothing localises.

- [ ] **Step 2: Verify in-browser** — enter a near-fit case → "Near-fit" line appears; add `give_way_weakness` → "Consider functional" banner appears. Screenshot.

- [ ] **Step 3: Commit / checkpoint. → REVIEW CHECKPOINT C.**

---

# WORKSTREAM D — Educational next-steps layer (Goal 4)

A new content module keyed like the causes/phonebook (site id, else `level_part`), with a derive fallback so every site returns something. Framed as teaching prompts. No doses, no definitive management.

### Task D1: `nextSteps.js` data module + derive fallback

**Files:**
- Create: `src/data/nextSteps.js`
- Test: `test/next-steps.test.js` (new suite; register)

**Interfaces:**
- Produces: `nextStepsFor(site) -> { investigations: [str], urgency: "emergency"|"urgent"|"routine", referral: str, curated: bool }`. Curated entries keyed by `site.id` or `${level}_${part}`; a `derive(site)` fallback keys off `site.level`/`territory` (mirroring `causes.js` `derive`).

- [ ] **Step 1: Write the failing test** — create `test/next-steps.test.js`:

```js
import { nextStepsFor } from "../src/data/nextSteps.js";
import { SITE_BY_ID } from "../src/model/sites.js";
let pass=0, fail=0;
const ok=(l,c)=>{c?pass++:fail++;console.log((c?"PASS  ":"FAIL  ")+l);};

const wallenberg = nextStepsFor({ id:"medulla_lateral", level:"medulla", part:"lateral", territory:"PICA / vertebral" });
ok("Wallenberg -> urgent/emergency stroke pathway", ["emergency","urgent"].includes(wallenberg.urgency));
ok("Wallenberg investigations mention MRI/MRA", wallenberg.investigations.some(i => /mri|mra|angiogra/i.test(i)));
ok("every site returns something (derive fallback)",
   !!nextStepsFor({ id:"x", level:"nerve", part:"ulnar_elbow" }).investigations.length);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail===0?0:1);
```

- [ ] **Step 2: Run — verify it fails** (module missing).

- [ ] **Step 3: Implement `src/data/nextSteps.js`** — a `NEXT` curated table (seed ~15-20 high-value sites from the existing `red`/`ddx`, e.g. `medulla_lateral`, `skull_base_cavernous_sinus`, `skull_base_optic_aion`, `cortex_mca`, `motor_unit_anterior_horn`, `peripheral_vestibular_labyrinth`) plus a `derive(site)` fallback:

```js
// nextSteps.js — the EDUCATIONAL "what next" layer: first-line investigations, urgency, referral pathway.
// Teaching prompts, NOT clinical directives — no doses, no definitive management. Keyed like causes.js.
const ns = (investigations, urgency, referral) => ({ investigations, urgency, referral });

export const NEXT = {
  medulla_lateral: ns(
    ["Urgent MRI brain + MRA/CTA head & neck (assess vertebral/PICA + dissection)", "Swallow assessment before oral intake"],
    "emergency", "Acute stroke team — hyperacute pathway; NIL by mouth until swallow safe."),
  skull_base_cavernous_sinus: ns(
    ["MRI brain + orbits with contrast + MRV (cavernous sinus)", "Bloods incl. inflammatory markers; consider blood cultures if septic"],
    "urgent", "Neurosurgery / ophthalmology; if septic thrombosis, urgent antimicrobials + neurosurgical input."),
  skull_base_optic_aion: ns(
    ["Immediate ESR + CRP (± temporal artery biopsy) to exclude giant-cell arteritis"],
    "emergency", "Same-day ophthalmology + rheumatology if GCA suspected — sight- and life-threatening."),
  motor_unit_anterior_horn: ns(
    ["EMG / nerve conduction studies", "MRI brain + cord to exclude structural mimic"],
    "routine", "Neuromuscular / MND clinic referral."),
};

function derive(site) {
  const terr = (site.territory || "").toLowerCase();
  const vasc = /aca|mca|pca|pica|aica|\bsca\b|basilar|vertebral|perforator|lenticulostriate|spinal artery/.test(terr);
  if (vasc) return ns(["Urgent non-contrast CT head then MRI + vascular imaging (CTA/MRA)"], "emergency",
    "Acute stroke team / hyperacute stroke pathway.");
  if (site.level === "skull_base") return ns(["MRI skull base with contrast"], "urgent", "Neurosurgery / ENT / ophthalmology as appropriate.");
  if (site.level === "cord") return ns(["Urgent whole-spine MRI to exclude cord compression"], "emergency",
    "Spinal surgery / neurology — cord compression is a time-critical emergency.");
  if (site.level === "nerve" || site.level === "root") return ns(["Nerve conduction studies / EMG", "Imaging if compressive cause suspected"], "routine", "Neurology / neurophysiology.");
  return ns(["MRI of the relevant region", "Targeted bloods per the differential"], "routine", "Neurology outpatient referral.");
}

export function nextStepsFor(site) {
  const key = NEXT[site.id] ? site.id : `${site.level}_${site.part}`;
  if (NEXT[key]) return { ...NEXT[key], curated: true };
  return { ...derive(site), curated: false };
}
```

- [ ] **Step 4: Run — verify green.** Register `test/next-steps.test.js` in `package.json` + README. Full suite green.

- [ ] **Step 5: Commit / checkpoint.**

### Task D2: Next-steps panel in the app + disclaimer

**Files:**
- Modify: `app/app.js` (`whatBlock` → append a next-steps block; import `nextStepsFor`)

- [ ] **Step 1: Render the panel.** Import `nextStepsFor`. In `whatBlock(site)`, after the causes groups, append a next-steps section with an urgency-coloured banner and an explicit disclaimer:

```js
  const ns = nextStepsFor(site);
  const urgTint = ns.urgency === "emergency" ? "--red" : ns.urgency === "urgent" ? "--gold" : "--faint";
  const next = `<h3 style="margin-top:14px">Next steps <span class="derived">(educational — not clinical advice)</span></h3>
    <div class="multi" style="border-color:var(${urgTint})"><b>Urgency:</b> ${esc(ns.urgency)} · <b>Referral:</b> ${esc(ns.referral)}</div>
    <ul class="nextlist">${ns.investigations.map(i=>`<li>${esc(i)}</li>`).join("")}</ul>
    ${ns.curated ? "" : `<p class="derived">Derived from site type — not individually curated.</p>`}`;
```

and return `... + next` from `whatBlock`. Add `.nextlist` CSS (simple `<ul>` styling) if needed.

- [ ] **Step 2: Verify in-browser** — Wallenberg preset → next-steps shows "emergency · Acute stroke team", investigations list MRI/MRA + swallow. Screenshot. Confirm the "educational — not clinical advice" disclaimer is visible.

- [ ] **Step 3: Commit / checkpoint. → REVIEW CHECKPOINT D (final).**

---

## Final verification

- [ ] Full suite: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test` — all suites green (baseline 1516 + the new patterns/relaxation/next-steps assertions).
- [ ] App end-to-end: launch, walk the four goals — (1) input by lobe + brainstem + fatiguability + friendly labels; (2) a rich picture localises to few sites, a stray finding shows Near-fit then multifocal, an FND sign shows Consider-functional, a UMN/LMN pattern is stated; (3) onset filters the DDx; (4) the next-steps panel shows investigations + urgency + referral with disclaimer. Screenshot each.
- [ ] Update `neurolocaliser-engine/CLAUDE.md` / memory + the design docs to mark the four workstreams done with new counts.

## Self-Review (against the audit + the four decisions)

- **Goal 1 (Full clinical restructure):** Task A1 (lobe split + brainstem + fatiguability) + A2 (friendly labels). Speech folded into `language`; fatiguability its own step. ✓
- **Goal 1.v/vi (UMN/LMN, "Yes"):** Workstream B (`umnLmnPattern` + panel), reusing the non-localising signs, mixed → MND. ✓
- **Goal 2.1 (Relaxation + functional, "Both"):** Workstream C1 (drop-1 `nearFit`) + C2 (FND findings + `functionalFlag`) + C3 (messaging). Relaxation definition flagged for confirmation at Checkpoint B. ✓
- **Goal 4 (Educational next-steps):** Workstream D (`nextStepsFor`: investigations + urgency + referral + disclaimer, curated + derive fallback, no doses/definitive mgmt). ✓
- **Goal 3 (tempo DDx):** already 🟢 in the audit; not re-built. The audit's *multi-location DDx synthesis* gap is deliberately deferred (not in the four chosen decisions) — noted here as a candidate follow-up, not a task.
- **Invariants:** every new finding (FND) added to `FINDINGS`+`CROSSES`+`NON_LATERALISED`, kept OUT of `LOCALISING` and `structures.js` (so they never localise); new suites registered in `package.json`+README; the app-smoke guard keeps exam-map honest; baseline stays green per-task.
- **Type consistency:** `umnLmnPattern(set)→{verdict,umnSigns,lmnSigns,note}`, `functionalFlag(set)→{functional,signs,note}`, `nearFit(set,opts)→{site,missing}|null` (also on `solve().nearFit`), `nextStepsFor(site)→{investigations,urgency,referral,curated}` — used identically in their consumer tasks.

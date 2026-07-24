# Findings as Raw Observations — De-interpret & Decompose Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every examinable finding a *raw bedside observation* — relabel findings that name a tract/CN/diagnosis, and decompose pre-interpreted clusters (CN III/IV/VI palsies, bulbar palsy, facial UMN/LMN, Horner, parkinsonism, Gerstmann, Balint) into raw primitives, so the syndrome + site *emerge* from anatomy rather than being stored.

**Architecture:** The engine already derives syndromes from structures sharing a site (the aphasia features → Broca/Wernicke/conduction pattern is the exemplar). This refactor extends that pattern to the remaining clusters: retire the cluster finding tokens, add raw-primitive findings, and re-key the producing structures so the cluster re-emerges by co-occurrence at a site. No engine/solver changes — only `src/model/` tables, the `score.js` LOCALISING set, the app vocabulary (`exam-map.js` + presets), and the test suites.

**Tech Stack:** Zero-dependency ES modules, Node v24 (off PATH — see Global Constraints). No test framework: each `test/*.js` is a standalone script using a local `ok(label, cond)` helper and `process.exit`.

## Global Constraints

- **Node is off PATH.** Prefix EVERY command: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" …`. Never re-diagnose "node not found".
- **Run all tests:** `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test` (chained `&&`; exits non-zero on any failure).
- **Run one suite:** `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/<suite>.test.js`.
- **Derive, don't store (the golden rule):** never write `if (hasX && hasY) return syndrome`. Clusters must emerge from structures sharing a `(level, part)` site. `src/data/syndromes.js` is a phonebook keyed by **site id** — decomposing a finding never changes a site id, so the phonebook keys are safe.
- **One structure = one finding** (`produces`). To make a site emit N raw findings, add N structures at the same `(level, part)`.
- **Signed findings:** everything is a `finding@side` token; `side` ∈ `left`/`right`/`bilateral`/`midline`/`none`. A new finding MUST be added to `findings.CROSSES` (true/contra, false/ipsi) or the forward model has no crossing rule. Non-lateralised findings also go in `findings.NON_LATERALISED`.
- **New findings that pin location** go in the `LOCALISING` set in `src/engine/score.js` (weighted 3× and penalised 3× when unexplained).
- **New test suites** must be added to the `test` script in `package.json` AND the `npm test` chain AND the README test list.
- **Baseline at start:** 40 suites / 1494 assertions green (the `app-smoke` suite prints `24 passed, 0 failed` as the tail). Every task must end with the FULL suite green.
- Not a medical device; not for clinical use.

**Cross-cutting per-token blast radius** (grep before editing; update in the SAME task that retires the token so the suite stays green):

| retired token | files that reference it |
|---|---|
| `cn3_palsy` | structures.js, findings.js, score.js, app/exam-map.js, test/{cranial-nerves,cortex,reflexes,pupil-efferent,sensory-level,engine,tone} |
| `cn4_palsy` | findings.js, structures.js, sites.js (comment only, L655-657), app/exam-map.js, score.js, test/{cranial-nerves,trochlear} |
| `cn6_palsy` | findings.js, structures.js, score.js, app/exam-map.js, test/{cranial-nerves,tier2-brainstem,engine} |
| `cn3_superior_div`,`cn3_inferior_div` | findings.js, structures.js, score.js, app/exam-map.js, test/cranial-nerves, test/tier1-completeness |
| `cn7_lmn` | findings.js, score.js, app/exam-map.js, structures.js, test/{tier2-brainstem,engine,cranial-nerves} |
| `facial_weak_umn` | findings.js, app/exam-map.js, structures.js, test/{cranial-nerves,aphasia,cortex,pupil-efferent,subcortex,reflexes,tier2-brainstem,engine,sensory-level,tier1-completeness,tier2-lacunar,tone} |
| `cn_bulbar` | findings.js, structures.js, score.js, app/exam-map.js, test/{vestibular-hints,horner-axis,tier2-brainstem,motor-unit,nystagmus,engine} |
| `horner` | findings.js, score.js, structures.js, app/exam-map.js, test/{cranial-nerves,nystagmus,horner-axis,vestibular-hints,engine}, docs/artifacts/anatomy-model.html |
| `parkinsonism` | findings.js, structures.js, score.js, src/data/{causes.js,syndromes.js} (text only, not keys), app/exam-map.js, test/basal-ganglia, docs/artifacts/anatomy-model.html |
| `gerstmann` | findings.js, structures.js, score.js, app/exam-map.js, test/{lobes,cortex}, docs/artifacts/anatomy-model.html |
| `balint_syndrome` | findings.js, score.js, structures.js, app/exam-map.js, test/cortex |
| `ino` | KEEP (see Task B1). Beware `grep ino` is noisy — it substring-matches "spino", "amino", "domino". Match `\bino\b` or `ino@`/`"ino"`/`: "ino"`. |

---

## Task A: RELABEL pass (Type 1 — descriptions only, inert)

Rewrite the `desc` prose of every finding whose text names a pathway/tract/CN/diagnosis so it states only what is **observed**. Token ids, `CROSSES`, `LOCALISING`, structures — all unchanged. Descriptions are never asserted by any test, so this is inert: the entire suite stays green before and after.

**Files:**
- Modify: `src/model/findings.js` (the `desc` strings only)
- Test: no test changes (full suite is the guard)

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing structural — same token ids, same shape.

- [ ] **Step 1: Confirm green baseline**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: final line `24 passed, 0 failed` (app-smoke), non-zero exit only on failure. Note the total for later.

- [ ] **Step 2: Rewrite the interpreted descriptions**

In `src/model/findings.js`, rewrite these `desc` values (drop the tract/CN/diagnosis parenthetical; keep it a pure observation). Non-exhaustive sweep — apply the same rule to every remaining `desc` that names a pathway:

```js
hemiparesis:    { desc: "Weakness of one side (arm ± leg ± face)", group: "Long tract" },
weak_arm:       { desc: "Arm weakness", group: "Cortical" },
weak_leg:       { desc: "Leg weakness", group: "Cortical" },
weak_hand:      { desc: "Isolated hand / finger weakness", group: "Cortical" },
dorsal_sensory: { desc: "Loss of vibration / joint-position sense", group: "Long tract" },
spinothalamic:  { desc: "Loss of pain / temperature on the body", group: "Long tract" },
face_pain_loss: { desc: "Loss of pain / temperature on the face", group: "Long tract" },
face_touch_loss:{ desc: "Loss of light touch on the face", group: "Long tract" },
cortical_sensory_arm: { desc: "Loss of discriminative sense (stereognosis / 2-point) — arm", group: "Cortical" },
cortical_sensory_leg: { desc: "Loss of discriminative sense (stereognosis / 2-point) — leg", group: "Cortical" },
cortical_sensory_hand:{ desc: "Loss of discriminative sense — hand (± perioral: cheiro-oral)", group: "Cortical" },
optic_neuropathy: { desc: "Monocular visual loss", group: "Cranial nerve" },
babinski:       { desc: "Extensor plantar response", group: "Reflex" },
hoffmann:       { desc: "Hoffmann's sign", group: "Reflex" },
spasticity:     { desc: "Increased tone (clasp-knife / spastic)", group: "Tone / wasting" },
hearing_loss:   { desc: "Sensorineural hearing loss ± tinnitus", group: "Cranial nerve" },
v1_sensory:     { desc: "Facial sensory loss / reduced corneal reflex — forehead / eye", group: "Cranial nerve" },
v2_sensory:     { desc: "Facial sensory loss — cheek", group: "Cranial nerve" },
v3_sensory:     { desc: "Facial sensory loss — jaw / chin", group: "Cranial nerve" },
emotional_lability: { desc: "Pathological laughing / crying", group: "Long tract" },
```

Also drop the tract/CN parenthetical from (keep the observation): `lacrimation_loss`, `taste_loss`, `gustatory_loss`, `superior_quadrantanopia`, `inferior_quadrantanopia`, `dysarthria`, `sensory_ataxia`, `jaw_weakness`, and any other `desc` naming a nucleus/tract/eponym. Leave already-raw descriptions (e.g. `chorea`, `neglect`) alone.

- [ ] **Step 3: Run the full suite — must stay green (inert change)**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: identical pass count to Step 1 (`24 passed, 0 failed` tail). If ANY suite fails, a description was being asserted somewhere unexpected — grep the failing assertion and fix the description reference, do not weaken the test.

- [ ] **Step 4: Commit** (if the repo is later git-init'd; otherwise this is a logical checkpoint — the design docs are the history)

---

## Task B1: Decompose ocular motility (the flagship — CN III / IV / VI, divisions, gaze; keep INO)

Retire `cn3_palsy`, `cn4_palsy`, `cn6_palsy`, `cn3_superior_div`, `cn3_inferior_div`. Add raw ductions/lid findings. Re-key every producing structure so each palsy re-emerges from which ductions co-occur. **Keep `ino`** as a single observed compound sign (relabel only) and **keep `gaze_palsy`**.

**New raw findings** (all `CROSSES:false` = ipsilateral to the affected eye, all LOCALISING):
`ptosis`, `weak_adduction`, `weak_abduction`, `weak_elevation`, `weak_depression`, `vertical_diplopia`.

**Decision (from the design doc):** CN IV gets `weak_depression` **plus** `vertical_diplopia` as its discriminator, so an isolated IV (depression + vertical diplopia, no ptosis/adduction/elevation) separates cleanly from a III (which also has ptosis + adduction + elevation). `ptosis` is shared by III and (later, Task B4a) Horner — so `ptosis` alone is non-localising and localises only in combination. Reuse the existing `fixed_dilated_pupil`.

**Emergence targets (acceptance):**
- `ptosis + weak_adduction + weak_elevation + weak_depression` (+ `fixed_dilated_pupil` if compressive) → a CN III site (skull-base `iii_trunk`, midbrain `cn3_fascicle`, or pupil `cn3_compressive`/`cn3_ischaemic`).
- `ptosis + weak_elevation` (no adduction/depression) → III **superior division** (`iii_orbit_sup`).
- `weak_adduction + weak_depression + fixed_dilated_pupil` (no ptosis) → III **inferior division** (`iii_orbit_inf`).
- isolated `weak_abduction` → a CN VI site.
- isolated `weak_depression + vertical_diplopia` → a CN IV site.

**Files:**
- Modify: `src/model/findings.js` — remove the 5 retired tokens from `FINDINGS`, `CROSSES`; add the 6 new tokens to `FINDINGS` + `CROSSES` (all `false`). Relabel `ino` desc to "Adduction lag on conjugate gaze + abducting-eye nystagmus (convergence spared)".
- Modify: `src/engine/score.js` — in `LOCALISING`, remove the 5 retired tokens; add the 6 new tokens. (`ino`, `gaze_palsy` stay.)
- Modify: `src/model/structures.js` — re-key producers (details below).
- Modify: `app/exam-map.js` — the `eom` step + `Cavernous sinus` preset.
- Test: create `test/raw-observations.test.js` (new emergence suite); update `test/{cranial-nerves,tier1-completeness,trochlear,tier2-brainstem,engine,cortex,reflexes,pupil-efferent,sensory-level,tone}.test.js` references.
- Modify: `package.json` + README — register `test/raw-observations.test.js`.

**Interfaces:**
- Produces (new finding ids other tasks/tests use): `ptosis`, `weak_adduction`, `weak_abduction`, `weak_elevation`, `weak_depression`, `vertical_diplopia`.

- [ ] **Step 1: Write the failing emergence suite** — create `test/raw-observations.test.js`:

```js
// raw-observations.test.js — acceptance tests for the raw-observations refactor.
import { solve } from "../src/engine/inverse.js";
let pass = 0, fail = 0;
const ok = (label, cond) => { if (cond) { pass++; console.log("PASS  " + label); }
  else { fail++; console.log("FAIL  " + label); } };
const S = (...toks) => new Set(toks);
const win = set => solve(set).best?.site ?? null;

// --- B1 ocular motility ---
{ const s = win(S("ptosis@left","weak_adduction@left","weak_elevation@left","weak_depression@left"));
  ok("ptosis+add+elev+depr -> CN III (oculomotor) site",
     !!s && (s.id.includes("iii_trunk") || s.part === "cn3_fascicle" || s.part?.startsWith("cn3_"))); }
{ const s = win(S("weak_abduction@left"));
  ok("isolated abduction weakness -> CN VI site",
     !!s && (s.part?.startsWith("vi_") || s.part === "cn6_nucleus" || s.id.includes("vi_"))); }
{ const s = win(S("weak_depression@left","vertical_diplopia@left"));
  ok("depression + vertical diplopia -> CN IV site",
     !!s && (s.part?.startsWith("iv_") || s.part === "trochlear_cisternal" || s.part === "trochlear")); }
{ const s = win(S("ptosis@left","weak_elevation@left"));
  ok("ptosis + elevation only -> III superior division", s?.part === "iii_orbit_sup"); }
{ const s = win(S("weak_adduction@left","weak_depression@left","fixed_dilated_pupil@left"));
  ok("adduction+depression+pupil -> III inferior division", s?.part === "iii_orbit_inf"); }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run it — verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/raw-observations.test.js`
Expected: FAILs (findings `ptosis`/`weak_adduction`/… are not defined → sites emit nothing → `win` is null).

- [ ] **Step 3: Update `findings.js`** — remove retired tokens, add raw ductions:

In `FINDINGS`, delete the entries `cn3_palsy`, `cn4_palsy`, `cn6_palsy`, `cn3_superior_div`, `cn3_inferior_div`, and add:

```js
  ptosis:          { desc: "Drooping upper eyelid (ptosis)", group: "Eye movements" },
  weak_adduction:  { desc: "Weak adduction (eye won't turn in)", group: "Eye movements" },
  weak_abduction:  { desc: "Weak abduction (eye won't turn out)", group: "Eye movements" },
  weak_elevation:  { desc: "Weak elevation (eye won't turn up)", group: "Eye movements" },
  weak_depression: { desc: "Weak depression (eye won't turn down)", group: "Eye movements" },
  vertical_diplopia:{ desc: "Vertical double vision, worse on down-gaze / head tilt", group: "Eye movements" },
```

Relabel `ino` desc to a plain observation (keep the token). In `CROSSES`, delete the retired-token lines and add: `ptosis: false, weak_adduction: false, weak_abduction: false, weak_elevation: false, weak_depression: false, vertical_diplopia: false,`.

- [ ] **Step 4: Update `score.js` LOCALISING** — delete `cn3_palsy`,`cn4_palsy`,`cn6_palsy`,`cn3_superior_div`,`cn3_inferior_div`; add `ptosis`,`weak_adduction`,`weak_abduction`,`weak_elevation`,`weak_depression`,`vertical_diplopia`. Keep `ino`,`gaze_palsy`.

- [ ] **Step 5: Re-key the producing structures** in `src/model/structures.js`. Replace each single-finding producer with the raw-duction structures at the SAME `(level, part)`:

CN III trunk / fascicle / compressive / ischaemic — expand each `produces: "cn3_palsy"` into four duction structures. Example for `iii_trunk` (skull_base):

```js
  { id: "iii_trunk_ptosis", level: "skull_base", part: "iii_trunk", produces: "ptosis",
    note: "CN III trunk (cavernous/SOF) — ptosis (LPS)" },
  { id: "iii_trunk_add",    level: "skull_base", part: "iii_trunk", produces: "weak_adduction",
    note: "CN III trunk — weak adduction (MR)" },
  { id: "iii_trunk_elev",   level: "skull_base", part: "iii_trunk", produces: "weak_elevation",
    note: "CN III trunk — weak elevation (SR/IO)" },
  { id: "iii_trunk_depr",   level: "skull_base", part: "iii_trunk", produces: "weak_depression",
    note: "CN III trunk — weak depression (IR)" },
```

Apply the same 4-structure expansion to: midbrain `cn3_fascicle`, pupil `cmp_cn3` (`cn3_compressive` — keep the co-located `cmp_pupil` → `fixed_dilated_pupil`), pupil `isch_cn3` (`cn3_ischaemic` — pupil-sparing, so NO pupil structure). Divisions: `iii_orbit_sup` → `ptosis` + `weak_elevation`; `iii_orbit_inf` → `weak_adduction` + `weak_depression` (the co-located `fixed_dilated_pupil` is the inferior-division parasympathetic — add an `iii_orbit_inf` → `fixed_dilated_pupil` structure).

CN VI — replace every `produces: "cn6_palsy"` (`cn6_nucleus` fascicle in pons; skull_base `vi_cisternal`,`vi_petrous_apex`,`vi_trunk`) with `produces: "weak_abduction"` (rename the structure ids `*_abd`). The nuclear `abducens_nucleus` stays `produces: "gaze_palsy"`.

CN IV — replace every `produces: "cn4_palsy"` (midbrain `cn4_nucleus` with `crosses:true`; skull_base `iv_trunk`; `cn4_nerve` trochlear_cisternal) with TWO structures each: `produces: "weak_depression"` + `produces: "vertical_diplopia"` (same `(level,part)`, same `crosses` as the original). Example:

```js
  { id: "cn4_nucleus_depr", level: "midbrain", part: "trochlear", produces: "weak_depression", crosses: true,
    note: "trochlear nucleus — CONTRALATERAL SO palsy (IV decussates): weak depression" },
  { id: "cn4_nucleus_vd",   level: "midbrain", part: "trochlear", produces: "vertical_diplopia", crosses: true,
    note: "trochlear nucleus — vertical diplopia (contralateral)" },
```

Keep the co-located `mlf_midbrain` → `ino` (unchanged) so the nucleus-vs-nerve INO over-prediction discriminator survives.

- [ ] **Step 6: Run the emergence suite — verify green**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/raw-observations.test.js`
Expected: `5 passed, 0 failed`. If the CN IV case resolves to the nucleus instead of the peripheral nerve, confirm the co-located `ino` over-prediction penalty still steers isolated IV to the cisternal nerve (as the old `cn4_palsy` did — see sites.js L655-657).

- [ ] **Step 7: Fix the fallout in existing suites.** For each file in the B1 blast-radius row, replace retired-token references:
  - Input sets: `cn3_palsy@X` → `ptosis@X` + `weak_adduction@X` + `weak_elevation@X` + `weak_depression@X`; `cn6_palsy@X` → `weak_abduction@X`; `cn4_palsy@X` → `weak_depression@X` + `vertical_diplopia@X`; `cn3_superior_div@X` → `ptosis@X`+`weak_elevation@X`; `cn3_inferior_div@X` → `weak_adduction@X`+`weak_depression@X`+`fixed_dilated_pupil@X`.
  - `baseOf(structure)` assertions (e.g. `test/cranial-nerves.test.js` L65-67): update the expected finding array to the new duction set the re-keyed structure emits, OR assert on the site the ductions resolve to. Prefer asserting emergent site (more robust).
  - `test/tier1-completeness.test.js` L30 token list + L66-67, L97, L156-159: swap to the raw tokens / division sites.
  - `test/engine.test.js` Weber: Weber uses `cn3` — update to the III ductions on the Weber input.

- [ ] **Step 8: Update `app/exam-map.js`** — the `eom` step: replace `"cn3_palsy","cn3_superior_div","cn3_inferior_div","cn4_palsy","cn6_palsy"` with `"ptosis","weak_adduction","weak_abduction","weak_elevation","weak_depression","vertical_diplopia"` (keep `gaze_palsy`,`ino`,`vertical_gaze_palsy`,… ). Update the `Cavernous sinus` preset tokens: `cn3_palsy@left,cn4_palsy@left,cn6_palsy@left` → `ptosis@left,weak_adduction@left,weak_elevation@left,weak_depression@left,weak_abduction@left,vertical_diplopia@left` (+ keep `v1_sensory@left,v2_sensory@left,horner@left` — `horner` handled in B4a).

- [ ] **Step 9: Register the new suite** — add `&& node test/raw-observations.test.js` to the `test` script in `package.json` and to the README test list.

- [ ] **Step 10: Run the FULL suite — all green**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: every suite PASS; app-smoke `at least 5 worked-example presets` + `every preset token is a real finding` still pass (the smoke test validates preset tokens against `FINDINGS`).

- [ ] **Step 11: Commit / checkpoint.**

---

## Task B2: Decompose bulbar palsy (`cn_bulbar`)

Retire `cn_bulbar`. Add raw `dysphagia`; reuse the already-split `palatal_weakness`, `vocal_cord_palsy`, `gag_afferent_loss`. Re-key nucleus ambiguus (Wallenberg) and the motor-unit bulbar producers.

**Files:**
- Modify: `src/model/findings.js` — remove `cn_bulbar`; add `dysphagia` (+ `CROSSES: false`). If `dysphagia` should be sideless, also add to `NON_LATERALISED`; **decision:** keep it lateralised-capable (`false`/ipsilateral) so a unilateral nucleus ambiguus emits `dysphagia@side` — simplest, matches `palatal_weakness`.
- Modify: `src/engine/score.js` — remove `cn_bulbar` from LOCALISING; add `dysphagia`.
- Modify: `src/model/structures.js` — re-key `nuc_ambiguus`, `ah_bulbar`, `mg_bulbar`.
- Modify: `app/exam-map.js` — `bulbar` step + `Wallenberg` preset.
- Test: add a B2 emergence block to `test/raw-observations.test.js`; fix `test/{engine,motor-unit,vestibular-hints,horner-axis,tier2-brainstem,nystagmus}.test.js`.

**Interfaces:**
- Produces: `dysphagia`.

- [ ] **Step 1: Add the failing B2 emergence test** to `test/raw-observations.test.js`:

```js
// --- B2 bulbar ---
{ const s = win(S("palatal_weakness@left","vocal_cord_palsy@left","dysphagia@left"));
  ok("palatal+vocal+dysphagia -> nucleus ambiguus (lateral medulla)",
     s?.level === "medulla" && s?.part === "lateral"); }
```

- [ ] **Step 2: Run it — verify it fails** (`dysphagia` undefined).
Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/raw-observations.test.js` → the new assertion FAILs.

- [ ] **Step 3: `findings.js`** — delete `cn_bulbar` from `FINDINGS` + `CROSSES`; add:

```js
  dysphagia: { desc: "Difficulty swallowing (bulbar)", group: "Cranial nerve" },
```
and `dysphagia: false,` in `CROSSES`.

- [ ] **Step 4: `score.js`** — remove `cn_bulbar` from LOCALISING, add `dysphagia`.

- [ ] **Step 5: `structures.js`** — replace `nuc_ambiguus` (`produces: "cn_bulbar"`) with three structures at `medulla/lateral`:

```js
  { id: "nuc_amb_palate", level: "medulla", part: "lateral", produces: "palatal_weakness",
    note: "nucleus ambiguus (X) — palatal weakness / gag efferent" },
  { id: "nuc_amb_vocal",  level: "medulla", part: "lateral", produces: "vocal_cord_palsy",
    note: "nucleus ambiguus (X) — vocal-cord palsy / hoarseness" },
  { id: "nuc_amb_dysph",  level: "medulla", part: "lateral", produces: "dysphagia",
    note: "nucleus ambiguus (IX/X) — dysphagia" },
```

Replace `ah_bulbar` and `mg_bulbar` (`produces: "cn_bulbar"`) each with `produces: "dysphagia"` + `produces: "dysarthria"` (two structures at their `motor_unit` part; `dysarthria` already exists and is `@none`). Example:

```js
  { id: "ah_bulbar_dysph", level: "motor_unit", part: "anterior_horn", produces: "dysphagia",
    note: "progressive bulbar palsy — dysphagia (LMN)" },
  { id: "ah_bulbar_dysar", level: "motor_unit", part: "anterior_horn", produces: "dysarthria",
    note: "progressive bulbar palsy — dysarthria (LMN)" },
```

- [ ] **Step 6: Run the emergence suite — B2 green.**

- [ ] **Step 7: Fix fallout** — replace `cn_bulbar@X` in `test/engine.test.js` (Wallenberg) with `palatal_weakness@X + vocal_cord_palsy@X + dysphagia@X`; same in `test/{vestibular-hints,horner-axis,tier2-brainstem,nystagmus}.test.js`; `test/motor-unit.test.js` bulbar assertions → `dysphagia`/`dysarthria`.

- [ ] **Step 8: `app/exam-map.js`** — `bulbar` step: replace `"cn_bulbar"` with `"dysphagia"` (palatal/vocal/gag already listed). `Wallenberg` preset: replace `cn_bulbar@left` with `palatal_weakness@left,vocal_cord_palsy@left,dysphagia@left`.

- [ ] **Step 9: Full suite green.**
Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test` → all PASS.

- [ ] **Step 10: Commit / checkpoint.**

---

## Task B3: Decompose facial weakness (`cn7_lmn` / `facial_weak_umn`)

Add raw `facial_weakness` (one hemiface) + `forehead_spared` (a raw observation). **CN VII (LMN)** → `facial_weakness` only (forehead NOT spared). **Corticobulbar (UMN)** → `facial_weakness` + `forehead_spared`. Keep `facial_weak_branch`. Retire `cn7_lmn` and `facial_weak_umn`. This is the biggest test blast radius (`facial_weak_umn` is in 13 suites).

**Decision:** `facial_weakness` is lateralised. LMN (CN VII) is ipsilateral (`CROSSES:false`); UMN corticobulbar is contralateral (`CROSSES:true`) — same crossing the old `facial_weak_umn` had. `forehead_spared` rides with the UMN face (`CROSSES:true`), emitted only by the corticobulbar structures. So `facial_weakness` alone (no forehead sparing) = LMN; `facial_weakness + forehead_spared` = UMN — the LMN/UMN split emerges from `forehead_spared`.

**Files:**
- Modify: `src/model/findings.js` — remove `cn7_lmn`,`facial_weak_umn`; add `facial_weakness` (`CROSSES` set per structure, default true so cortical UMN is contra) + `forehead_spared` (`CROSSES: true`). NOTE: LMN CN VII structures must override `crosses:false`.
- Modify: `src/engine/score.js` — LOCALISING: remove `cn7_lmn`; add `facial_weakness`,`forehead_spared`. (`facial_weak_umn` was NOT localising — it is not in the set; verify.)
- Modify: `src/model/structures.js` — every `produces: "cn7_lmn"` → `produces: "facial_weakness"` (add `crosses: false` on the peripheral VII structures if not already ipsilateral — CN VII structures are skull_base/pons and default `facial_weakness` to contra, so they NEED `crosses: false`). Every `produces: "facial_weak_umn"` → `produces: "facial_weakness"` + a co-located `produces: "forehead_spared"` structure (UMN marker).
- Modify: `app/exam-map.js` — `cn7` step.
- Test: add B3 emergence block; fix all 13 suites referencing `facial_weak_umn` and the 3 referencing `cn7_lmn`.

**Interfaces:**
- Produces: `facial_weakness`, `forehead_spared`.

- [ ] **Step 1: Add failing B3 emergence tests** to `test/raw-observations.test.js`:

```js
// --- B3 facial UMN vs LMN ---
{ const s = win(S("facial_weakness@left"));  // LMN, forehead NOT spared
  ok("facial weakness alone -> peripheral CN VII (LMN) site",
     !!s && (s.level === "skull_base" || s.part === "vii_stylomastoid" || String(s.id).includes("vii"))); }
{ const r = solve(S("facial_weakness@right","forehead_spared@right","weak_arm@right"));
  ok("facial weakness + forehead spared + arm -> UMN (cortical/capsular), forehead_spared explained",
     !!r.best && r.best.matched?.some(m => m.startsWith("forehead_spared"))); }
```

(Adjust the LMN expectation to whatever isolated `facial_weakness` resolves to — likely the stylomastoid/Bell's site by parsimony; run to see, then pin.)

- [ ] **Step 2: Run — verify it fails.**

- [ ] **Step 3: `findings.js`** — remove `cn7_lmn`,`facial_weak_umn`; add:

```js
  facial_weakness: { desc: "Weakness of one side of the face", group: "Cranial nerve" },
  forehead_spared: { desc: "Forehead movement preserved (upper face spared)", group: "Cranial nerve" },
```
`CROSSES`: add `facial_weakness: true` (default cortical/UMN contra) and `forehead_spared: true`. Remove the old two lines.

- [ ] **Step 4: `score.js`** — LOCALISING: remove `cn7_lmn`; add `facial_weakness`,`forehead_spared`.

- [ ] **Step 5: `structures.js`** — re-key:
  - Peripheral VII (all `skull_base`/pons `cn7_fascicle`, `iam_vii_motor`, `vii_gen_motor`, `vii_tym_motor`, `vii_mas_motor`, `vii_sty_motor`, `cpa_cn7`): `produces: "facial_weakness", crosses: false` (LMN ipsilateral, forehead NOT spared → no `forehead_spared` structure).
  - UMN corticobulbar (`cbt_midbrain`, `ctx_motor_face`, `ic_cbt_face`, `cr_face`, `bp_cbt`, `pbulb_face`): `produces: "facial_weakness"` (inherits `crosses:true`; `bp_cbt` keeps its explicit `crosses:true`) PLUS a co-located `forehead_spared` structure. Example:

```js
  { id: "ic_cbt_face",   level: "subcortex", part: "internal_capsule", produces: "facial_weakness",
    note: "corticobulbar (lower face UMN) — internal capsule" },
  { id: "ic_cbt_forehead", level: "subcortex", part: "internal_capsule", produces: "forehead_spared",
    note: "corticobulbar UMN — upper face bilaterally innervated → forehead spared" },
```
  (`pbulb_face` is bilateral corticobulbar → its `forehead_spared` companion is fine; pseudobulbar already carries emotional_lability.)

- [ ] **Step 6: Run emergence suite — B3 green.**

- [ ] **Step 7: Fix the 13-suite fallout.** In every suite: `facial_weak_umn@X` → `facial_weakness@X` + (where the test intends UMN) `forehead_spared@X`; `cn7_lmn@X` → `facial_weakness@X` (no forehead_spared). The `Pure-motor lacune` and Weber/Millard-Gubler style tests especially. Where a test asserts a structure's `produces`, update to `facial_weakness`.

- [ ] **Step 8: `app/exam-map.js`** — `cn7` step: replace `"cn7_lmn","facial_weak_umn"` with `"facial_weakness","forehead_spared"`. Update `Pure-motor lacune` preset: `facial_weak_umn@right` → `facial_weakness@right` + `forehead_spared@right`.

- [ ] **Step 9: Full suite green.**

- [ ] **Step 10: Commit / checkpoint.**

---

## Task B4a: Decompose Horner (`horner`)

`horner` → `miosis` + reuse `ptosis` (partial ptosis; the same token added in B1, so ptosis becomes shared by III / Horner → non-localising alone) + keep the existing `anhidrosis_face`/`anhidrosis_body`. `miosis` is the Horner localiser. Every structure producing `horner` (many: `sympathetic`, `sym_med_*` reuse anhidrosis, `sym_cord_horner`, `sof_symp`, `car_symp`, `preg_horner`) must now emit `miosis` (+ its existing anhidrosis companions where present, + `ptosis`).

**Files:**
- Modify: `src/model/findings.js` — remove `horner`; add `miosis` (`CROSSES:false`).
- Modify: `src/engine/score.js` — LOCALISING: remove `horner`; add `miosis`.
- Modify: `src/model/structures.js` — each `produces: "horner"` → `produces: "miosis"` (+ add a co-located `ptosis` structure so Horner has partial ptosis; keep the anhidrosis structures). Watch the level-gated `sym_cord_*` (`emitAtOrAbove: "T1"`) — the miosis + ptosis companions must carry the same gate.
- Modify: `app/exam-map.js` — `pupils` step + `Wallenberg`/`Cavernous sinus` presets.
- Modify: `docs/artifacts/anatomy-model.html` — the `horner` reference (label text only).
- Test: add B4a emergence; fix `test/{cranial-nerves,nystagmus,horner-axis,vestibular-hints,engine}.test.js`.

**Interfaces:**
- Produces: `miosis`.

- [ ] **Step 1: Add failing B4a emergence test:**

```js
// --- B4a Horner ---
{ const s = win(S("miosis@left","ptosis@left","anhidrosis_face@left","anhidrosis_body@left"));
  ok("miosis+ptosis+anhidrosis(face+body) -> central (1st-order) Horner, lateral medulla",
     s?.level === "medulla" && s?.part === "lateral"); }
{ const s = win(S("miosis@left","ptosis@left"));
  ok("miosis+ptosis (no anhidrosis pattern) -> a Horner site (order axis)",
     !!s && solve(S("miosis@left","ptosis@left")).best.matched.some(m => m.startsWith("miosis"))); }
```

- [ ] **Step 2: Run — verify fails** (`miosis` undefined).

- [ ] **Step 3: `findings.js`** — remove `horner`; add `miosis: { desc: "Small pupil (miosis)", group: "Autonomic" }`, `CROSSES` `miosis: false`.

- [ ] **Step 4: `score.js`** — LOCALISING: remove `horner`, add `miosis`.

- [ ] **Step 5: `structures.js`** — for EACH `produces: "horner"` structure, change to `produces: "miosis"` and add a co-located `ptosis` structure (same level/part/crosses/gate). The anhidrosis structures already coexist and are unchanged. Gated example:

```js
  { id: "sym_cord_miosis", level: "cord", part: "lateral", produces: "miosis", crosses: false, emitAtOrAbove: "T1",
    note: "descending sympathetic (lateral cord) — miosis, only at/above ~T1" },
  { id: "sym_cord_ptosis", level: "cord", part: "lateral", produces: "ptosis", crosses: false, emitAtOrAbove: "T1",
    note: "central cord Horner — partial ptosis (≥ ~T1)" },
```
Apply to: `sympathetic` (medulla), `sym_cord_horner`, `sof_symp` (skull_base), `car_symp` (skull_base), `preg_horner` (sympathetic preganglionic). Keep `sym_med_anhface`/`sym_med_anhbody`/`sym_cord_anh*`/`preg_anhface` as-is.

- [ ] **Step 6: Run emergence — B4a green.** Verify the Horner-order axis (1st/2nd/3rd) still separates by anhidrosis distribution (the `anhidrosis_face`/`anhidrosis_body` localisers are untouched).

- [ ] **Step 7: Fix fallout** — `horner@X` → `miosis@X` + `ptosis@X` in `test/{cranial-nerves,nystagmus,horner-axis,vestibular-hints,engine}.test.js`. In `horner-axis.test.js` the anhidrosis discriminators stay; only the core `horner` token becomes `miosis`+`ptosis`.

- [ ] **Step 8: `app/exam-map.js`** — `pupils` step: `"horner"` → `"miosis"` (ptosis is under `eom`; that's fine — it's the same shared token). `Wallenberg` preset: `horner@left` → `miosis@left,ptosis@left`. `Cavernous sinus` preset: `horner@left` → `miosis@left` (ptosis already added in B1). Update `docs/artifacts/anatomy-model.html` label.

- [ ] **Step 9: Full suite green.**

- [ ] **Step 10: Commit / checkpoint.**

---

## Task B4b: Decompose parkinsonism (`parkinsonism`)

`parkinsonism` → `bradykinesia` + `rest_tremor` (+ reuse existing `rigidity`). The substantia-nigra site emits all three; hemiparkinsonism re-emerges. `chorea`/`dystonia`/`hemiballismus` are already single observations — keep.

**Files:**
- Modify: `src/model/findings.js` — remove `parkinsonism`; add `bradykinesia`,`rest_tremor` (`CROSSES:true`, like the old contralateral extrapyramidal sign).
- Modify: `src/engine/score.js` — LOCALISING: remove `parkinsonism`; add `bradykinesia`,`rest_tremor`.
- Modify: `src/model/structures.js` — `snc_park` (`produces: "parkinsonism"`) → `snc_brady` (`bradykinesia`) + `snc_tremor` (`rest_tremor`); the co-located `snc_rigid` (`rigidity`) stays.
- Modify: `app/exam-map.js` — `movement_dis` step.
- Modify: `src/data/{causes.js,syndromes.js}` — TEXT ONLY (ddx/name strings mention "parkinsonism"); leave as prose. No finding-key change needed (syndromes keyed by site id). Verify no code path keys on the `parkinsonism` finding id.
- Modify: `docs/artifacts/anatomy-model.html` — label text.
- Test: add B4b emergence; fix `test/basal-ganglia.test.js`.

**Interfaces:**
- Produces: `bradykinesia`, `rest_tremor`.

- [ ] **Step 1: Add failing B4b emergence test:**

```js
// --- B4b parkinsonism ---
{ const s = win(S("bradykinesia@left","rest_tremor@left","rigidity@left"));
  ok("bradykinesia+rest_tremor+rigidity -> substantia nigra (contralateral hemiparkinsonism)",
     s?.level === "basal_ganglia" && s?.part === "substantia_nigra"); }
```

- [ ] **Step 2: Run — verify fails.**

- [ ] **Step 3: `findings.js`** — remove `parkinsonism`; add `bradykinesia: { desc: "Slowness of movement (bradykinesia)", group: "Basal ganglia / movement" }`, `rest_tremor: { desc: "Tremor at rest", group: "Basal ganglia / movement" }`; `CROSSES` both `true`.

- [ ] **Step 4: `score.js`** — LOCALISING: remove `parkinsonism`; add `bradykinesia`,`rest_tremor`.

- [ ] **Step 5: `structures.js`** — replace `snc_park` with:

```js
  { id: "snc_brady",  level: "basal_ganglia", part: "substantia_nigra", produces: "bradykinesia",
    note: "substantia nigra pars compacta — contralateral bradykinesia" },
  { id: "snc_tremor", level: "basal_ganglia", part: "substantia_nigra", produces: "rest_tremor",
    note: "substantia nigra — contralateral rest tremor" },
```

- [ ] **Step 6: Run emergence — B4b green.**

- [ ] **Step 7: Fix fallout** — `test/basal-ganglia.test.js`: `parkinsonism@X` → `bradykinesia@X` + `rest_tremor@X` (+ `rigidity@X` where the test wants full PD). The bilateral-PD composite + phonebook name assertions stay (site-keyed).

- [ ] **Step 8: `app/exam-map.js`** — `movement_dis`: `"parkinsonism"` → `"bradykinesia","rest_tremor"` (`rigidity` is under `tone`). Update the anatomy-model.html label.

- [ ] **Step 9: Full suite green.**

- [ ] **Step 10: Commit / checkpoint.**

---

## Task B4c: Decompose Gerstmann (`gerstmann`)

`gerstmann` → `agraphia` + `acalculia` + `finger_agnosia` + `left_right_disorientation` (the tetrad). The dominant angular-gyrus site (`ctx_gerstmann`) produces all four; the syndrome re-emerges. All four are `@none` (non-lateralised higher-cortical), all LOCALISING.

**Files:**
- Modify: `src/model/findings.js` — remove `gerstmann`; add the four (+ `CROSSES:false` + `NON_LATERALISED`).
- Modify: `src/engine/score.js` — LOCALISING: remove `gerstmann`; add the four.
- Modify: `src/model/structures.js` — `ctx_gerstmann` (one structure, `produces: "gerstmann"`, `hemisphere:"dominant"`) → four structures at `cortex/parietal`, `hemisphere:"dominant"`.
- Modify: `app/exam-map.js` — `cognition` step.
- Modify: `docs/artifacts/anatomy-model.html` — label.
- Test: add B4c emergence; fix `test/{lobes,cortex}.test.js`.

- [ ] **Step 1: Add failing B4c emergence test:**

```js
// --- B4c Gerstmann ---
{ const s = win(S("agraphia@none","acalculia@none","finger_agnosia@none","left_right_disorientation@none"));
  ok("Gerstmann tetrad -> dominant angular/supramarginal (parietal)",
     s?.level === "cortex" && s?.part === "parietal"); }
```

- [ ] **Step 2: Run — verify fails.**

- [ ] **Step 3: `findings.js`** — remove `gerstmann`; add:

```js
  agraphia:  { desc: "Impaired writing (agraphia)", group: "Cortical" },
  acalculia: { desc: "Impaired calculation (acalculia)", group: "Cortical" },
  finger_agnosia: { desc: "Cannot identify/name individual fingers (finger agnosia)", group: "Cortical" },
  left_right_disorientation: { desc: "Left–right disorientation", group: "Cortical" },
```
`CROSSES` all `false`; add all four to `NON_LATERALISED`.

- [ ] **Step 4: `score.js`** — LOCALISING: remove `gerstmann`; add the four.

- [ ] **Step 5: `structures.js`** — replace `ctx_gerstmann` with four structures at `cortex/parietal`, `hemisphere:"dominant"` (ids `ctx_gerst_agraphia`, `_acalculia`, `_finger`, `_lrd`), each `produces` one of the four.

- [ ] **Step 6: Run emergence — B4c green.**

- [ ] **Step 7: Fix fallout** — `test/{lobes,cortex}.test.js`: `gerstmann@none` → the four tokens. Keep the site/phonebook name assertions.

- [ ] **Step 8: `app/exam-map.js`** — `cognition`: replace `"gerstmann"` with the four tokens. Update anatomy-model.html label.

- [ ] **Step 9: Full suite green.**

- [ ] **Step 10: Commit / checkpoint.**

---

## Task B4d: Decompose Balint (`balint_syndrome`)

`balint_syndrome` → `optic_ataxia` + `oculomotor_apraxia` + `simultanagnosia` (bilateral parieto-occipital). `ctx_balint` (`bilateralOnly:true`) → three structures. All `@none`, LOCALISING.

**Files:**
- Modify: `src/model/findings.js` — remove `balint_syndrome`; add the three (+ `CROSSES:false` + `NON_LATERALISED`).
- Modify: `src/engine/score.js` — LOCALISING: remove `balint_syndrome`; add the three.
- Modify: `src/model/structures.js` — `ctx_balint` → three structures at `cortex/parietal`, `bilateralOnly:true`.
- Modify: `app/exam-map.js` — `cognition` step.
- Test: add B4d emergence; fix `test/cortex.test.js`.

- [ ] **Step 1: Add failing B4d emergence test:**

```js
// --- B4d Balint (bilateral) ---
{ const set = S("optic_ataxia@none","oculomotor_apraxia@none","simultanagnosia@none");
  const b = solve(set).best;
  ok("Balint triad -> bilateral parieto-occipital site", !!b && /balint|parietal|occipital/i.test(b.site.id + b.site.part)); }
```

(Balint is a `bilateralOnly` composite — confirm the composer surfaces it; mirror the existing `balint_syndrome@none` test's `solve` shape in `test/cortex.test.js`.)

- [ ] **Step 2: Run — verify fails.**

- [ ] **Step 3: `findings.js`** — remove `balint_syndrome`; add:

```js
  optic_ataxia:       { desc: "Misreaching under visual guidance (optic ataxia)", group: "Cortical" },
  oculomotor_apraxia: { desc: "Cannot voluntarily direct gaze to targets (oculomotor apraxia)", group: "Cortical" },
  simultanagnosia:    { desc: "Cannot perceive more than one object at once (simultanagnosia)", group: "Cortical" },
```
`CROSSES` all `false`; add all three to `NON_LATERALISED`.

- [ ] **Step 4: `score.js`** — LOCALISING: remove `balint_syndrome`; add the three.

- [ ] **Step 5: `structures.js`** — replace `ctx_balint` with three `bilateralOnly:true` structures at `cortex/parietal` (ids `ctx_balint_oa`, `_oma`, `_sim`).

- [ ] **Step 6: Run emergence — B4d green.**

- [ ] **Step 7: Fix fallout** — `test/cortex.test.js`: `balint_syndrome@none` → the three tokens.

- [ ] **Step 8: `app/exam-map.js`** — `cognition`: replace `"balint_syndrome"` with the three tokens.

- [ ] **Step 9: Full suite green.**

- [ ] **Step 10: Commit / checkpoint.**

---

## Task C: End-to-end app verification + docs sync

The app's narrowing-differential UI consumes the finding vocabulary directly, so it auto-benefits once the tokens change — but the exam-map, presets, and smoke test must be self-consistent, and the change must be seen working in the browser.

**Files:**
- Verify: `app/exam-map.js`, `app/app.js` (differential flow — no code change expected).
- Modify (if drift found): `test/app-smoke.test.js` (exam-map coverage / preset validity).
- Modify: `docs/artifacts/anatomy-model.html` (labels touched in B4a/b/c) — republish workflow noted in `docs/artifacts/`.

- [ ] **Step 1: Full suite green** (final).
Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: every suite PASS, including `test/raw-observations.test.js` and `test/app-smoke.test.js` (`every preset token is a real finding` — this is the guard that catches any stale preset token).

- [ ] **Step 2: Launch the app and drive it** (use the `verify`/`run` skill or preview tools; launch.json is at `Code/.claude/launch.json`).
Run the dev server (`node app/serve.mjs` → http://localhost:8137/app/) via the preview tools, then in the browser:
  - Localise mode: enter the CN III ductions (`ptosis` + `weak_adduction` + `weak_elevation` + `weak_depression`, left) → confirm it narrows to a CN III site with the oculomotor-palsy phonebook entry.
  - Enter `weak_abduction` (left) alone → CN VI.
  - Enter `facial_weakness` + `forehead_spared` (right) + `weak_arm` (right) → a UMN cortical/capsular site (forehead_spared explained).
  - Run the `Wallenberg` preset → left lateral medulla, vascular/dissection red flags (now via `palatal_weakness`+`vocal_cord_palsy`+`dysphagia`+`miosis`+`ptosis`).
  - Atlas mode: browse the substantia-nigra site → forward findings now list `bradykinesia`/`rest_tremor`/`rigidity`.
Capture a screenshot as proof.

- [ ] **Step 3: Sync the anatomy-model artefact** — update the `horner`/`parkinsonism`/`gerstmann` labels in `docs/artifacts/anatomy-model.html` to the decomposed vocabulary; republish to the same URL per `docs/artifacts/` workflow (only if the user approves publishing — otherwise leave the source edited and note it).

- [ ] **Step 4: Update `neurolocaliser-engine/CLAUDE.md` / memory** — mark the raw-observations refactor DONE; update the assertion/suite counts; delete/retire the `raw-observations-refactor-pending` memory.

- [ ] **Step 5: Final commit / checkpoint.**

---

## Self-Review (completed against the design doc)

- **Spec coverage:** Part A relabel → Task A. B1 ocular → Task B1 (retires cn3/4/6_palsy + divisions, adds 6 ductions, keeps ino/gaze_palsy, adds vertical_diplopia per the design's IV decision). B2 bulbar → Task B2. B3 facial → Task B3. B4 clusters → Tasks B4a (horner), B4b (parkinsonism), B4c (gerstmann), B4d (balint); kluver_bucy/chorea/dystonia/hemiballismus explicitly KEPT (design B4 "keep"); cn12_palsy/gustatory_loss/emotional_lability/suspended_sensory relabel-only under Task A. App exam-map + presets + smoke test folded into each task (kept green per-task) + final Task C. Cross-cutting token blast radius captured in the Global Constraints table.
- **Decisions locked:** keep `ino` (relabel only); IV = `weak_depression` + `vertical_diplopia`; `horner` → `miosis` + shared `ptosis`; `dysphagia` lateralised; `facial_weakness` + `forehead_spared` (UMN emits the spared marker). These match the design doc's recommended decisions.
- **Type consistency:** new finding ids (`ptosis`,`weak_adduction`,`weak_abduction`,`weak_elevation`,`weak_depression`,`vertical_diplopia`,`dysphagia`,`facial_weakness`,`forehead_spared`,`miosis`,`bradykinesia`,`rest_tremor`,`agraphia`,`acalculia`,`finger_agnosia`,`left_right_disorientation`,`optic_ataxia`,`oculomotor_apraxia`,`simultanagnosia`) are used identically in findings.js, score.js, structures.js, tests, and exam-map across tasks.
- **Invariant:** every new finding is added to `FINDINGS` + `CROSSES` (+ `NON_LATERALISED` where `@none`) + `LOCALISING`, and every retired token is removed from all four plus the app vocabulary in the same task — enforced by the per-task "Full suite green" step and the app-smoke `every preset token is a real finding` assertion.

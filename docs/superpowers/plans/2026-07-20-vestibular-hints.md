# Vestibular HINTS axis — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use `- [ ]`.

**Goal:** Add the HINTS axis (head-impulse, skew, canal-specific BPPV) + a lean central-vestibular site, so peripheral-vs-central acute vestibular syndrome localises. Spec: `docs/superpowers/specs/2026-07-20-vestibular-hints-design.md`.

**Architecture:** Pure anatomy data, zero new solver mechanism. 5 findings (@none, LOCALISING), 3 new canal parts + 1 new `central_vestibular` level, structures on labyrinth / canals / central nucleus / lateral medulla.

## Global Constraints
- Node off PATH: prefix `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"`. Not a git repo (checkpoint = `npm test` green).
- All-additive; keep the other 31 suites green. `central_vestibular` goes in `LEVELS` AFTER `peripheral_vestibular` (isolated-vertigo tie → peripheral).

---

## Task 1: Findings + LOCALISING

**Files:** `findings.js`, `score.js`, `test/vestibular-hints.test.js` (new).

- [ ] **Step 1** — new suite vocabulary section:

```js
import { FINDINGS, CROSSES, NON_LATERALISED, isFinding } from "../src/model/findings.js";
import { LOCALISING } from "../src/engine/score.js";
let pass=0, fail=0; const log=[]; function ok(l,c){log.push({l,ok:!!c});c?pass++:fail++;}
const NEW=["head_impulse_abnormal","skew_deviation","nystagmus_positional_posterior","nystagmus_positional_horizontal","nystagmus_positional_anterior"];
for (const id of NEW){ ok(`${id} exists`,isFinding(id)); ok(`${id} CROSSES false`,CROSSES[id]===false);
  ok(`${id} @none`,NON_LATERALISED.has(id)); ok(`${id} LOCALISING`,LOCALISING.has(id)); }
```
(add report footer `console.log`+`process.exit(fail===0?0:1)` so it runs.)

- [ ] **Step 2** — run `node test/vestibular-hints.test.js`; expect FAIL.
- [ ] **Step 3** — `findings.js` add to `FINDINGS` (Vestibular / nystagmus group):

```js
  head_impulse_abnormal: { desc: "Corrective catch-up saccade on head-impulse (h-HIT) — peripheral (VOR broken at the labyrinth/nerve)", group: "Vestibular / nystagmus" },
  skew_deviation:        { desc: "Vertical ocular misalignment (ocular tilt reaction) — central (brainstem graviceptive/otolithic)", group: "Vestibular / nystagmus" },
  nystagmus_positional_posterior:  { desc: "Up-beat + torsional positional nystagmus (Dix-Hallpike) — posterior semicircular canal (BPPV)", group: "Vestibular / nystagmus" },
  nystagmus_positional_horizontal: { desc: "Horizontal positional nystagmus (supine roll) — horizontal (lateral) canal (BPPV)", group: "Vestibular / nystagmus" },
  nystagmus_positional_anterior:   { desc: "Down-beat + torsional positional nystagmus — anterior canal (BPPV, rare)", group: "Vestibular / nystagmus" },
```
Add to `CROSSES` all 5 `: false`. Add all 5 to `NON_LATERALISED`.

- [ ] **Step 4** — `score.js` `LOCALISING` += all 5.
- [ ] **Step 5** — run; vocabulary PASS.

---

## Task 2: Structures + sites

**Files:** `structures.js`, `sites.js`, test (structure section).

- [ ] **Step 1** — append structure tests:

```js
import { STRUCTURES } from "../src/model/structures.js";
import { SITE_BY_ID } from "../src/model/sites.js";
const baseOf=(l,p)=>STRUCTURES.filter(s=>s.level===l&&s.part===p).map(s=>s.produces).sort();
const eq=(a,b)=>JSON.stringify([...(a||[])].sort())===JSON.stringify([...(b||[])].sort());
ok("labyrinth incl head_impulse", baseOf("peripheral_vestibular","labyrinth").includes("head_impulse_abnormal"));
ok("posterior_canal -> positional_posterior", eq(baseOf("peripheral_vestibular","posterior_canal"),["nystagmus_positional_posterior"]));
ok("horizontal_canal -> positional_horizontal", eq(baseOf("peripheral_vestibular","horizontal_canal"),["nystagmus_positional_horizontal"]));
ok("anterior_canal -> positional_anterior", eq(baseOf("peripheral_vestibular","anterior_canal"),["nystagmus_positional_anterior"]));
ok("central_vestibular nucleus -> vertigo+gaze+skew", eq(baseOf("central_vestibular","nucleus"),["cn8_vertigo","nystagmus_gaze_evoked","skew_deviation"]));
ok("medulla lateral now includes skew", baseOf("medulla","lateral").includes("skew_deviation"));
for (const id of ["left_peripheral_vestibular_posterior_canal","left_peripheral_vestibular_horizontal_canal","left_peripheral_vestibular_anterior_canal","left_central_vestibular_nucleus"])
  ok(`${id} site exists`, !!SITE_BY_ID[id]);
```

- [ ] **Step 2** — run; expect FAIL.
- [ ] **Step 3** — `structures.js`: in the peripheral-vestibular block add `vest_head_impulse` (labyrinth) + the 3 canal structures; add a CENTRAL VESTIBULAR block; add `icp_otr` at `medulla|lateral` (near the other icp_vestib structures):

```js
  { id: "vest_head_impulse", level: "peripheral_vestibular", part: "labyrinth", produces: "head_impulse_abnormal",
    note: "labyrinth / vestibular nerve — abnormal head impulse (corrective saccade); the peripheral HINTS sign" },
  { id: "bppv_post",  level: "peripheral_vestibular", part: "posterior_canal",  produces: "nystagmus_positional_posterior",  note: "posterior semicircular canal — up-beat torsional positional nystagmus (BPPV)" },
  { id: "bppv_horiz", level: "peripheral_vestibular", part: "horizontal_canal", produces: "nystagmus_positional_horizontal", note: "horizontal (lateral) canal — horizontal positional nystagmus (BPPV)" },
  { id: "bppv_ant",   level: "peripheral_vestibular", part: "anterior_canal",   produces: "nystagmus_positional_anterior",   note: "anterior canal — down-beat torsional positional nystagmus (BPPV, rare)" },
  // ---- CENTRAL VESTIBULAR (vestibular nucleus / nodulus) — the HINTS-central AVS site ----
  { id: "cv_vertigo", level: "central_vestibular", part: "nucleus", produces: "cn8_vertigo",           note: "central vestibular (vestibular nucleus / nodulus) — vertigo" },
  { id: "cv_nyst",    level: "central_vestibular", part: "nucleus", produces: "nystagmus_gaze_evoked",  note: "central vestibular — direction-changing / gaze-evoked nystagmus" },
  { id: "cv_skew",    level: "central_vestibular", part: "nucleus", produces: "skew_deviation",         note: "central vestibular — skew deviation (the central HINTS sign)" },
```
And at `medulla|lateral` (add beside icp_vestib):
```js
  { id: "icp_otr", level: "medulla", part: "lateral", produces: "skew_deviation", note: "lateral medulla — ocular tilt reaction / skew deviation (Wallenberg)" },
```

- [ ] **Step 4** — `sites.js`: `LEVELS` add `"central_vestibular"` AFTER `"peripheral_vestibular"`; `PARTS` add `"posterior_canal","horizontal_canal","anterior_canal","nucleus"`; `TERRITORY` add:
```js
  "peripheral_vestibular|posterior_canal": "posterior semicircular canal (BPPV)",
  "peripheral_vestibular|horizontal_canal": "horizontal (lateral) semicircular canal (BPPV)",
  "peripheral_vestibular|anterior_canal": "anterior semicircular canal (BPPV)",
  "central_vestibular|nucleus": "vestibular nucleus / nodulus (central acute vestibular syndrome)",
```

- [ ] **Step 5** — run; structure + site sections PASS.

---

## Task 3: Emergence + phonebook + regression

**Files:** test (emergence), `syndromes.js`.

- [ ] **Step 1** — append emergence tests:

```js
import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";
const S=(...t)=>new Set(t); const win=set=>solve(set).best?.site?.id??null;
const nameOf=set=>{const b=solve(set).best; if(!b)return ""; const e=nameForSite(b.site); return (e.name||"")+" "+(e.note||"");};
ok("vestibular neuritis -> labyrinth", win(S("cn8_vertigo@left","nystagmus_peripheral@none","head_impulse_abnormal@none"))==="left_peripheral_vestibular_labyrinth");
ok("central AVS -> central vestibular", win(S("cn8_vertigo@left","nystagmus_gaze_evoked@none","skew_deviation@none"))==="left_central_vestibular_nucleus");
ok("normal-HIT + skew (dangerous) -> central", win(S("cn8_vertigo@left","skew_deviation@none"))==="left_central_vestibular_nucleus");
ok("posterior BPPV -> posterior canal", win(S("nystagmus_positional_posterior@none"))==="left_peripheral_vestibular_posterior_canal" || win(S("nystagmus_positional_posterior@none"))==="right_peripheral_vestibular_posterior_canal");
ok("horizontal BPPV -> horizontal canal", /horizontal_canal/.test(win(S("nystagmus_positional_horizontal@none"))));
ok("Meniere still -> labyrinth", win(S("cn8_vertigo@left","nystagmus_peripheral@none","hearing_loss@left"))==="left_peripheral_vestibular_labyrinth");
ok("central phonebook names stroke/central AVS", /central|stroke|posterior circulation|HINTS/i.test(nameOf(S("cn8_vertigo@left","nystagmus_gaze_evoked@none","skew_deviation@none"))));
// full Wallenberg regression
ok("full Wallenberg still -> lateral medulla", solve(S("spinothalamic@right","face_pain_loss@left","horner@left","cn_bulbar@left","limb_ataxia@left","cn8_vertigo@left")).best?.site?.id==="left_medulla_lateral");
```
Note: adjust the Wallenberg input tokens to match `engine.test.js`'s canonical Wallenberg set if the assertion is finicky; the point is the winner stays `*_medulla_lateral`.

- [ ] **Step 2** — run; localisation PASS off Task-2 anatomy; central phonebook FAIL until Step 3. Debug any red localisation per systematic-debugging (check `central_vestibular` after `peripheral_vestibular` in LEVELS; check central beats labyrinth on skew).
- [ ] **Step 3** — `syndromes.js`: update `peripheral_vestibular_labyrinth` note to mention the peripheral HINTS pattern (abnormal head impulse, unidirectional nystagmus, no skew); add:

```js
  peripheral_vestibular_posterior_canal: { name: "Posterior-canal BPPV", note: "Brief positional vertigo with up-beat torsional nystagmus on Dix-Hallpike — otoconia in the posterior semicircular canal. The commonest BPPV.", ddx: ["Benign paroxysmal positional vertigo (posterior canal)"] },
  peripheral_vestibular_horizontal_canal: { name: "Horizontal-canal BPPV", note: "Positional vertigo with horizontal nystagmus on the supine roll test — horizontal (lateral) semicircular canal.", ddx: ["BPPV (horizontal canal)"] },
  peripheral_vestibular_anterior_canal: { name: "Anterior-canal BPPV", note: "Positional vertigo with down-beat torsional nystagmus — anterior canal (rare); mimics central downbeat, so exclude a craniocervical lesion.", ddx: ["BPPV (anterior canal)", "Central downbeat (craniocervical junction) — exclude"] },
  central_vestibular_nucleus: { name: "Central acute vestibular syndrome (HINTS-central)", note: "Acute continuous vertigo with a NORMAL head-impulse test, direction-changing (gaze-evoked) or vertical nystagmus, and/or skew deviation — the INFARCT pattern of a posterior-circulation (cerebellar/brainstem) stroke. A normal head impulse in an acutely vertiginous patient is the danger sign.", ddx: ["Cerebellar infarct (PICA/AICA)", "Lateral medullary / pontine stroke", "MS plaque", "Vertebrobasilar TIA"], red: "Vertigo with a NORMAL head impulse, skew, or direction-changing nystagmus is a stroke until proven otherwise — image (MRI-DWI), do not discharge as labyrinthitis." },
```

- [ ] **Step 4** — run suite green. `npm test` full aggregate: 32 suites, 0 failed. Confirm `engine`/`nystagmus`/`cerebellum` green (skew added to lateral medulla; central_vestibular added).

---

## Task 4: Register + docs + memory

- [ ] `package.json` test chain + README list += `node test/vestibular-hints.test.js`.
- [ ] `CONTRIBUTING.md` — completed-region entry (Tier 1 Increment B). Tier 1 now COMPLETE.
- [ ] Memory — `neurolocaliser-engine-state.md` (new region, 32 suites, new totals) + `MEMORY.md` pointer.
- [ ] Final `npm test` aggregate green.

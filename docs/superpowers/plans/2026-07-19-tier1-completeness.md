# Tier 1 completeness — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use `- [ ]`.

**Goal:** Fill three coverage-audit gaps — CN I (olfactory), insular cortex, and the two basis-pontis lacunar syndromes (ataxic hemiparesis, dysarthria-clumsy-hand).

**Architecture:** Pure anatomy-table data extension — 3 findings, 3 new parts (one on a new `olfactory` level, one cortex part, one pons part), 6 structures. Zero new solver mechanism except one existing-style `crosses:true` override on the pontocerebellar fibre. Spec: `docs/superpowers/specs/2026-07-19-tier1-completeness-design.md`.

## Global Constraints

- Node off PATH: prefix `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"`. Not a git repo (checkpoint = `npm test` green, no git).
- Golden rule; one structure = one finding; all-additive (keep the other 30 suites green).

---

## Task 1: Findings + LOCALISING

**Files:** `src/model/findings.js`, `src/engine/score.js`, `test/tier1-completeness.test.js` (new).

- [ ] **Step 1** — write the new suite's vocabulary section (harness + imports + these):

```js
import { FINDINGS, CROSSES, NON_LATERALISED, isFinding } from "../src/model/findings.js";
import { LOCALISING } from "../src/engine/score.js";
let pass=0, fail=0; const log=[];
function ok(l,c){ log.push({l,ok:!!c}); c?pass++:fail++; }
for (const id of ["anosmia","gustatory_loss","dysarthria"]) {
  ok(`${id} exists`, isFinding(id));
  ok(`${id} CROSSES false`, CROSSES[id] === false);
}
ok("anosmia LOCALISING + lateralised", LOCALISING.has("anosmia") && !NON_LATERALISED.has("anosmia"));
ok("gustatory_loss LOCALISING + lateralised", LOCALISING.has("gustatory_loss") && !NON_LATERALISED.has("gustatory_loss"));
ok("dysarthria NON-localising + @none", !LOCALISING.has("dysarthria") && NON_LATERALISED.has("dysarthria"));
```

- [ ] **Step 2** — run `node test/tier1-completeness.test.js`; expect FAIL (findings absent). (Add the report footer `console.log`+`process.exit(fail===0?0:1)` now so it runs.)
- [ ] **Step 3** — in `findings.js` add to `FINDINGS` (near the cranial-nerve / long-tract groups):

```js
  anosmia:        { desc: "Loss of smell — olfactory nerve / tract (CN I)", group: "Cranial nerve" },
  gustatory_loss: { desc: "Central loss of taste — insula / frontal operculum", group: "Cortical" },
  dysarthria:     { desc: "Slurred / imprecise speech (articulation) — general sign", group: "Long tract" },
```

Add to `CROSSES`: `anosmia: false, gustatory_loss: false, dysarthria: false,`. Add `"dysarthria"` to `NON_LATERALISED`.

- [ ] **Step 4** — in `score.js` `LOCALISING`, add `"anosmia","gustatory_loss",` (NOT dysarthria).
- [ ] **Step 5** — run; vocabulary section PASS.

---

## Task 2: Structures + sites

**Files:** `src/model/structures.js`, `src/model/sites.js`, test suite (structure section).

- [ ] **Step 1** — append structure-section tests:

```js
import { STRUCTURES } from "../src/model/structures.js";
import { SITE_BY_ID } from "../src/model/sites.js";
const baseOf = (lvl,part) => STRUCTURES.filter(s=>s.level===lvl&&s.part===part).map(s=>s.produces).sort();
const eq=(a,b)=>JSON.stringify([...(a||[])].sort())===JSON.stringify([...(b||[])].sort());
ok("olfactory_groove -> anosmia", eq(baseOf("olfactory","olfactory_groove"),["anosmia"]));
ok("insula -> dysarthria + gustatory_loss", eq(baseOf("cortex","insula"),["dysarthria","gustatory_loss"]));
ok("basis_pontis -> hemiparesis+facial_umn+dysarthria+limb_ataxia",
   eq(baseOf("pons","basis_pontis"),["hemiparesis","facial_weak_umn","dysarthria","limb_ataxia"]));
ok("bp_pcf has crosses:true", STRUCTURES.find(s=>s.id==="bp_pcf")?.crosses===true);
for (const id of ["left_olfactory_olfactory_groove","left_cortex_insula","left_pons_basis_pontis"])
  ok(`${id} site exists`, !!SITE_BY_ID[id]);
```

- [ ] **Step 2** — run; expect FAIL.
- [ ] **Step 3** — in `structures.js` add (a new OLFACTORY block; an insula pair in the cortex block; a basis-pontis block in the pons region):

```js
  // ---- OLFACTORY (CN I) ----
  { id: "olf_tract", level: "olfactory", part: "olfactory_groove", produces: "anosmia",
    note: "olfactory bulb / tract on the cribriform plate (olfactory groove) — anosmia" },
  // ---- INSULA (cortex) ----
  { id: "ins_dysarthria", level: "cortex", part: "insula", produces: "dysarthria", note: "anterior insula / operculum — dysarthria" },
  { id: "ins_gustatory",  level: "cortex", part: "insula", produces: "gustatory_loss", note: "insular gustatory cortex — central taste loss" },
  // ---- BASIS PONTIS (ventral pons) — lacunar ataxic hemiparesis / dysarthria-clumsy-hand ----
  { id: "bp_cst",     level: "pons", part: "basis_pontis", produces: "hemiparesis",     crosses: true, note: "corticospinal in the basis pontis — contra weakness" },
  { id: "bp_cbt",     level: "pons", part: "basis_pontis", produces: "facial_weak_umn", crosses: true, note: "corticobulbar in the basis pontis — contra facial UMN" },
  { id: "bp_cbt_dys", level: "pons", part: "basis_pontis", produces: "dysarthria",                     note: "corticobulbar → dysarthria" },
  { id: "bp_pcf",     level: "pons", part: "basis_pontis", produces: "limb_ataxia",     crosses: true, note: "pontocerebellar fibres (cross) — ataxia CONTRA, same side as weakness (ataxic hemiparesis)" },
```

- [ ] **Step 4** — in `sites.js`: add `"olfactory"` to `LEVELS`; add `"olfactory_groove"`, `"insula"`, `"basis_pontis"` to `PARTS`; add `TERRITORY`:

```js
  "olfactory|olfactory_groove": "olfactory groove / cribriform plate (CN I)",
  "cortex|insula": "insular cortex (MCA insular arteries)",
  "pons|basis_pontis": "basilar perforators (ventral / basis pontis)",
```

Do **not** touch `DIVISION` (insula stays out of the vascular composites).

- [ ] **Step 5** — run; structure + site sections PASS.

---

## Task 3: Localisation emergence + phonebook + regression

**Files:** test suite (emergence section), `src/data/syndromes.js`.

- [ ] **Step 1** — append emergence tests:

```js
import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";
const S=(...t)=>new Set(t); // pass full `finding@side` tokens
const win=set=>solve(set).best?.site?.id ?? null;
const nameOf=set=>{const b=solve(set).best; if(!b)return ""; const e=nameForSite(b.site); return (e.name||"")+" "+(e.note||"");};
// CN I
ok("isolated anosmia -> olfactory groove", win(S("anosmia@left"))==="left_olfactory_olfactory_groove");
{ const cov = solve(S("anosmia@left","optic_neuropathy@left"));
  const ids = cov.best?.covers ? cov.best.covers.map(c=>c.site.id) : [cov.best?.site?.id];
  // Foster-Kennedy: multi-site cover includes olfactory + optic_canal (accept either shape the solver returns)
  ok("Foster-Kennedy covers olfactory + optic", JSON.stringify(cov).includes("olfactory_olfactory_groove") && JSON.stringify(cov).includes("optic_canal")); }
ok("olfactory phonebook names Foster-Kennedy/anosmia", /foster|anosmia|olfactory/i.test(nameOf(S("anosmia@left"))));
// insula
ok("isolated gustatory_loss -> insula", win(S("gustatory_loss@left"))==="left_cortex_insula");
ok("dysarthria + gustatory -> insula", win(S("dysarthria@none","gustatory_loss@left"))==="left_cortex_insula");
// basis pontis
ok("ataxic hemiparesis -> basis pontis", win(S("hemiparesis@right","limb_ataxia@right"))==="left_pons_basis_pontis");
ok("dysarthria-clumsy-hand -> basis pontis", win(S("dysarthria@none","facial_weak_umn@right"))==="left_pons_basis_pontis");
ok("right basis pontis mirrors", win(S("hemiparesis@left","limb_ataxia@left"))==="right_pons_basis_pontis");
ok("basis pontis phonebook names the lacune", /pontine|basis pontis|ataxic|lacun/i.test(nameOf(S("hemiparesis@right","limb_ataxia@right"))));
```

- [ ] **Step 2** — run; localisation lines should PASS off the anatomy (Task 2); phonebook lines FAIL until Step 3. If a localisation line fails, debug per `superpowers:systematic-debugging` (check the `crosses:true` on bp_pcf; check basis_pontis beats midbrain|medial / internal_capsule).
- [ ] **Step 3** — in `syndromes.js` add:

```js
  olfactory_olfactory_groove: {
    name: "Olfactory groove syndrome (anosmia)",
    note: "Unilateral loss of smell from the olfactory bulb/tract on the cribriform plate. With ipsilateral optic atrophy (± contralateral papilloedema) this is Foster-Kennedy syndrome — an olfactory-groove or sphenoid-wing meningioma compressing both the olfactory and optic nerves.",
    ddx: ["Olfactory groove / sphenoid-wing meningioma", "Head trauma (cribriform shearing)", "Kallmann syndrome", "Parkinson's / neurodegeneration (bilateral)"]
  },
  cortex_insula: {
    name: "Insular cortex syndrome",
    note: "Dysarthria and central loss of taste (± visceral/autonomic or vestibular sensations) from the insula — usually part of a middle cerebral artery infarct.",
    ddx: ["MCA infarct (insular)", "Glioma", "Herpes / limbic encephalitis"]
  },
  pons_basis_pontis: {
    name: "Ventral pontine (basis pontis) lacune",
    note: "A small-vessel lacune of the ventral pons. Two classic pictures emerge: ATAXIC HEMIPARESIS (pyramidal weakness with crossed pontocerebellar ataxia on the same side, out of proportion to the weakness) and DYSARTHRIA-CLUMSY-HAND (corticobulbar dysarthria + central facial weakness + a clumsy hand). Gaze, cn6 and cn7 are SPARED (the tegmentum is dorsal).",
    ddx: ["Lacunar (small-vessel) infarct", "Basilar perforator disease", "Small pontine haemorrhage / demyelination"]
  },
```

- [ ] **Step 4** — run the suite green. Then `npm test` full aggregate: 31 suites, 0 failed. Confirm no regression in `cortex`/`lobes` (insula not in DIVISION), `engine`/`nystagmus` (Wallenberg/Weber/Millard-Gubler unaffected by the new basis_pontis part).

---

## Task 4: Register + docs + memory

- [ ] Add `node test/tier1-completeness.test.js` to `package.json` `test` chain and the README/`npm test` list.
- [ ] `CONTRIBUTING.md` — add a completed-region entry (Tier 1 Increment A: CN I + insula + basis-pontis lacunes; note Increment B = vestibular HINTS still pending, Tier 2 backlog).
- [ ] Memory — update `neurolocaliser-engine-state.md` (new region, 31 suites, new totals) + `MEMORY.md` pointer.
- [ ] Final: `npm test` aggregate green.

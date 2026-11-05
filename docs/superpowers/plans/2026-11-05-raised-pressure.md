# Raised-pressure and herniation round — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status: NOT STARTED — awaiting the owner's go-ahead to build.** Implements every ruling of round 1 in
`docs/superpowers/specs/2026-11-05-raised-pressure-design.md` (owner: *"Approve as written"*, 2026-11-05). **The code in
this plan was dry-run** on a throwaway copy of this branch at `bebf6b1`, task by task: `npm test` 87 suites / 7413 green;
audit 1050 passed / 9 failed (probes 108 / 115); the 41 captured answer cards identical to the prototype's. The dry-run
patch is `plan/planpatch.mjs` in the prototype folder below.

**Goal:** Fix the four counted clinical-audit checks of R1 #7, #8 and #13 — and the three unsafe answer cards behind them —
with the bilateral VI site, the nerve courses the pressure reaches, the false-localising set-aside, the pressure-only card and
the uncal reading of the compressive III, with the card wording that goes with them.

**Architecture:** One composer in `sites.js` (both VI nerves) and one table of READINGS of a primitive site (the uncal reading,
attached as a variant, as the cord's are); two sets in `compartments.js` (`PRESSURE_REACHES`, `FALSE_LOCALISING_SIGNS`); in
`inverse.js` the compartment filter keeps `PRESSURE_REACHES`, `solverSites` applies a reading's gate, and
`falseLocalisingAside` runs before the background step; `causesFor` lets a reading lead with its cause; the card
(`app/answer.js`, `app/app.js`) names the reading, the set-aside palsies and the pressure-only state. No structure, cause or
plan is added or edited. Prototype flags for each task live in
`/Users/jaydenwearne/Library/Application Support/Claude/side-session-notes/local_ee2d02d5-4a70-46e4-b205-371f87906cf3/pressure-prototype/lib.mjs`
(the recommended set is `rec2.txt`).

**Tech stack:** zero-dependency ES modules, Node 24, standalone test scripts (`ok(label, cond)`, `process.exit`).

## Global constraints

- Node is not on PATH: prefix every command with `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"`.
- Work in `/Users/jaydenwearne/Desktop/Personal/Claude Code/Projects/NeuroLocaliser/Code/neurolocaliser-pressure`
  (branch `fix/raised-pressure`). Never push; no PR.
- `npm run test:audit` is NOT part of `npm test`; never wire it in and never loosen an audit assertion.
- Site ids never change. The one new site is `bilateral_skull_base_vi_cisternal`. No structure is added: every row is reused.
- The owner's wording is used verbatim (spec rows 8–11).
- No cause, workup or phonebook entry is added or edited (row 6 only re-orders, for one reading).
- No CSS changes (the `--terra` allowlist in `test/brand.test.js` is untouched).
- Re-pin ONLY the assertion in the spec's row 12. Any other failing assertion is a bug in the change.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Decisions this plan makes that the spec does not spell out

Each follows from a ruling; each is open to your veto before building.

1. **The pressure-only state draws the answer card, the banner and the Where list only.** The Together, Why, What and Next
   cards describe the selected place, and row 4's card names none, so they are not drawn. The card's head reads *"Raised
   intracranial pressure"* (the banner's own label) and the phone strip *"Urgent · Raised intracranial pressure"*.
2. **Row 10's last sentence cannot be reached** once rows 1–2 are in: no picture leaves only papilloedema after setting VI
   palsies aside. It is built as approved and pinned with a crafted result, so it is live if row 1 or 2 is ever withdrawn.
3. **Row 6 marks the cause `lead`, and reads it as *common* within the reading.** It sorts first in `causesFor` and
   `rankCauses`. The likelihood matters because the What card's own *"Most likely:"* line lists only common causes: with the
   authored *uncommon* kept, the What card would say *"Most likely: Posterior communicating artery aneurysm"* under an answer
   card that says uncal herniation (found in the plan's dry run). At the tentorial edge, in a comatose patient, herniation is
   the common cause. The authored row is not edited: the awake III still reads it as uncommon, with the aneurysm first.
4. **A caller that passes no findings never sees a gated reading.** `why.js`'s station index calls `solverSites(opts)` without
   findings, so the Why line's stations are unchanged (as the prototype measured).
5. **The detail Why card keeps every entered finding**, as it does for background; only the answer card's Why line and the
   count leave the set-aside palsies out.

## File map

| File | Change | Task |
|---|---|---|
| `test/raised-pressure.test.js` | **new** suite pinning rows 1–11 and the guards | 1–4 |
| `package.json` | append `node test/raised-pressure.test.js` to `test` | 1 |
| `src/model/sites.js` | `composeBilateralAbducensSites`; `READINGS` attached in `buildSites` | 1, 2 |
| `src/model/compartments.js` | `PRESSURE_REACHES`, `FALSE_LOCALISING_SIGNS` | 1, 3 |
| `src/engine/inverse.js` | the filter keeps `PRESSURE_REACHES`; `solverSites(opts, observed)` gate; `variantOf` carries `leads`, `red`; `falseLocalisingAside`; `solve` | 1, 2, 3 |
| `src/data/causes.js` | `causesFor` and `rankCauses` read a reading's `lead` | 2 |
| `app/answer.js` | reading red flag; `falseLocalisingSentence`; set-aside in the count, Why and Where lines; `PRESSURE_ONLY` card | 2, 3, 4 |
| `app/labels.js` | `readingLabel`: `uncal` | 2 |
| `app/app.js` | What card red flag; count and Where-card annot for the set-aside; pressure-only rendering, head and strip | 2, 3, 4 |
| `test/fundus.test.js` | the row-12 re-pin | 1 |
| `test/clinical-audit.test.js`, `docs/superpowers/specs/2026-10-18-clinical-audit-suite.md` | four probes (row 13) and their record | 5 |
| `CLAUDE.md`, the spec, this plan, `Code/.claude/launch.json` | docs, status, a preview entry | 6 |

---

### Task 1: Both VI nerves; the pressure reaches the VI's course (rows 1, 2, 12) + the new suite

**Files:**
- Create: `test/raised-pressure.test.js`
- Modify: `package.json` (the `test` script), `src/model/sites.js` (a composer), `src/model/compartments.js`
  (`PRESSURE_REACHES`), `src/engine/inverse.js` (import, comment, filter), `test/fundus.test.js:20-22, 72` (re-pin)

**Interfaces:**
- Produces: `test/raised-pressure.test.js` with helpers `ok`, `T`, `SITE`, `ids`, `exp(id)`, `lead(site)`, `flOf(r)`, `P`,
  `card(toks, rOverride)` that later tasks append sections to, ABOVE the `// ---- report ----` block.
- Produces: `PRESSURE_REACHES` (a `Set` of `level|part` strings) exported from `src/model/compartments.js`; the site
  `bilateral_skull_base_vi_cisternal` (side `bilateral`, level `skull_base`, part `vi_cisternal`).

- [ ] **Step 1: Write the suite (header, section A, report)**

Create `test/raised-pressure.test.js`:

```js
// raised-pressure.test.js — the raised-pressure and herniation round (owner-ruled 2026-11-05; spec
// docs/superpowers/specs/2026-11-05-raised-pressure-design.md). Pins each approved row, and the pictures the spec's §6
// lists as unchanged by design. Run: node test/raised-pressure.test.js
import { solve, candidateSites, isNormalToken, INTRACRANIAL_LEVELS } from "../src/engine/inverse.js";
import { expectedFindings } from "../src/engine/forward.js";
import * as CMP from "../src/model/compartments.js";
import { causesFor } from "../src/data/causes.js";
import * as ANS from "../app/answer.js";

let pass = 0, fail = 0;
const ok = (label, cond, detail = "") => { cond ? pass++ : fail++; console.log((cond ? "PASS  " : "FAIL  ") + label + (cond ? "" : `  ${detail}`)); };
const T = s => new Set(s.split(/\s+/).filter(Boolean));
const SITE = Object.fromEntries(candidateSites().map(s => [s.id, s]));
const ids = r => r.display.map(c => c.site.id);
const exp = id => SITE[id] ? [...expectedFindings(SITE[id])].sort() : [];
const lead = site => (causesFor(site).all[0] || {}).name || null;
const flOf = r => (r.pressure && r.pressure.falseLocalising ? r.pressure.falseLocalising.tokens : []).slice().sort();
const P = "papilloedema@none";
// Read from the module namespaces, so a missing export fails its assertions instead of the whole suite.
const PRESSURE_REACHES = CMP.PRESSURE_REACHES || new Set();
// The answer card for a picture, as app.js builds it: the count leaves out the papilloedema and any explicit normal.
const card = (toks, rOverride = null) => {
  const tokens = T(toks), r = rOverride || solve(tokens);
  const sel = r.display.find(x => x.site.id === r.defaultSite) || r.display[0];
  const total = [...tokens].filter(t => !t.startsWith("papilloedema@") && !isNormalToken(t)).length;
  return { r, sel, ans: sel ? ANS.answerFor({ r, sel, total, tokens, onset: "", course: "", dominant: "left", sensoryLevel: "",
    pinned: new Set(), scope: "site", selectedPathology: undefined, selectedEntity: undefined }) : null };
};

// ---- A. Both VI nerves, and the pressure reaches the VI's own course (rows 1, 2) ----
ok("row 1: a bilateral VI site on the cisternal course exists", !!SITE.bilateral_skull_base_vi_cisternal);
ok("row 1: it predicts weak abduction on both sides, and nothing else",
   exp("bilateral_skull_base_vi_cisternal").join() === "weak_abduction@left,weak_abduction@right", exp("bilateral_skull_base_vi_cisternal").join());
ok("row 1: it reads the cisternal VI's causes — raised pressure first",
   !!SITE.bilateral_skull_base_vi_cisternal && lead(SITE.bilateral_skull_base_vi_cisternal) === "Raised intracranial pressure (false localising sign)");
{ const r = solve(T("weak_abduction@left weak_abduction@right"));
  ok("row 1: bilateral VI alone → the bilateral VI site, one lesion (R1 #8)",
     ids(r)[0] === "bilateral_skull_base_vi_cisternal" && r.multi === null, `${ids(r)[0]} multi=${!!r.multi}`); }
{ const r = solve(T(`weak_abduction@left weak_abduction@right ${P}`));
  ok("rows 1–2: bilateral VI + papilloedema → the bilateral VI site, one lesion, the axis fires (R1 #7)",
     ids(r)[0] === "bilateral_skull_base_vi_cisternal" && r.multi === null && r.pressure.present, `${ids(r)[0]} multi=${!!r.multi}`); }
{ const r = solve(T(`weak_abduction@left ${P}`));
  ok("row 2: a VI palsy + papilloedema → the VI nerve first, not the pons", ids(r)[0] === "left_skull_base_vi_cisternal", ids(r).slice(0, 3).join(", "));
  ok("row 2: …the pons still fits", ids(r).includes("left_pons_medial")); }
ok("row 2: PRESSURE_REACHES is the VI's cisternal course and the VI at the petrous apex",
   [...PRESSURE_REACHES].sort().join() === "skull_base|vi_cisternal,skull_base|vi_petrous_apex", [...PRESSURE_REACHES].join());
{ // The cross-check (row 2): the parts outside the skull's levels whose own causes name raised pressure are PRESSURE_REACHES,
  // and the IV's cisternal course, deferred.
  const named = new Set(candidateSites().filter(s => !INTRACRANIAL_LEVELS.has(s.level)
    && causesFor(s).all.some(c => /raised intracranial pressure/i.test(c.name))).map(s => `${s.level}|${s.part}`));
  ok("row 2: every part the pressure reaches names raised pressure among its own causes",
     PRESSURE_REACHES.size > 0 && [...PRESSURE_REACHES].every(k => named.has(k)), [...named].join(", "));
  ok("row 2: every other part that names it is the deferred IV",
     [...named].filter(k => !PRESSURE_REACHES.has(k)).join() === "skull_base|trochlear_cisternal", [...named].join(", ")); }
{ const { ans } = card("weak_abduction@left weak_abduction@right");
  ok("row 1: the card names the bilateral site and the pressure",
     ans?.lines.where === "Bilateral VI — cisternal segment." && ans?.lines.what === "Most likely Raised intracranial pressure (false localising sign) (must not miss). Must not miss: Skull base tumour or nasopharyngeal carcinoma.",
     `${ans?.lines.where} | ${ans?.lines.what}`); }
ok("row 1 guard: a single VI palsy leads with the left VI, and the bilateral site is not offered (the other side is a known normal)",
   ids(solve(T("weak_abduction@left")))[0] === "left_skull_base_vi_cisternal" && !ids(solve(T("weak_abduction@left"))).includes("bilateral_skull_base_vi_cisternal"));
ok("row 2 guard: a IV palsy + papilloedema still leads with the contralateral trochlear nucleus (the IV is deferred)",
   ids(solve(T(`weak_depression@left vertical_diplopia@left ${P}`)))[0] === "right_midbrain_trochlear");

// ---- report ----
console.log(`\nNeuroLocaliser — raised-pressure and herniation round (round 1)\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run it to see it fail**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/raised-pressure.test.js`
Expected: `3 passed, 10 failed`, exit 1. The three that pass are "the pons still fits" and the two guards.

- [ ] **Step 3: Add the bilateral VI composer (`src/model/sites.js`)**

Immediately above the line `// MOTOR-UNIT SITES (pure-motor endings). These are generalized, symmetric conditions, so each part is`
insert:

```js
// BOTH VI NERVES (raised-pressure round, row 1, owner-approved 2026-11-05). The two nerves climb the clivus side by side in
// the prepontine cistern to Dorello's canals, so one process there — raised or low CSF pressure, a clival tumour, basal
// meningitis, trauma — catches both. ONE bilateral site from the same `vi_cisternal` row: it keeps every table keyed by the
// place (causes, workup, label, vascular, topography), so it adds no content. buildSites still makes the left and right sites.
export function composeBilateralAbducensSites() {
  const structures = STRUCTURES.filter(s => s.level === "skull_base" && s.part === "vi_cisternal").map(s => s.id);
  return structures.length ? [{ id: "bilateral_skull_base_vi_cisternal", side: "bilateral", level: "skull_base",
    part: "vi_cisternal", territory: TERRITORY["skull_base|vi_cisternal"], structures, composite: true }] : [];
}

```

(`candidateSites()` picks up every `compose*` export by reflection; nothing else registers it.)

- [ ] **Step 4: Declare the nerve courses the pressure reaches (`src/model/compartments.js`)**

After the line `export const INTRACRANIAL_COMPARTMENTS = new Set(["brain", "brainstem", "cerebellum", "optic", "pupil"]);`
insert:

```js

// THE NERVE COURSES RAISED PRESSURE ITSELF INJURES (raised-pressure round, row 2, owner-approved 2026-11-05), keyed
// `level|part`. Papilloedema keeps only the places inside the skull — and these, because the pressure produces their palsy
// itself: the VI's long cisternal course, and the VI tethered at the petrous apex (the false-localising sign). Exactly three
// parts outside the skull's levels name raised pressure among their own causes; the third, the IV's cisternal course, is
// DEFERRED: kept under papilloedema, its card would lead with head trauma and badge routine, because its plan is not written
// for the pressure (spec 2026-11-05, row 2, O1, O8). test/raised-pressure.test.js checks this set against the causes.
export const PRESSURE_REACHES = new Set(["skull_base|vi_cisternal", "skull_base|vi_petrous_apex"]);
```

- [ ] **Step 5: The compartment filter keeps them (`src/engine/inverse.js`)**

Replace the import `import { LEVEL_COMPARTMENT, INTRACRANIAL_COMPARTMENTS } from "../model/compartments.js";` with:

```js
import { LEVEL_COMPARTMENT, INTRACRANIAL_COMPARTMENTS, PRESSURE_REACHES } from "../model/compartments.js";
```

Replace the comment line `// CORRIDORS, which are extra-axial nerve-in-a-canal lesions rather than mass within the compartment.` with:

```js
// CORRIDORS, which are extra-axial nerve-in-a-canal lesions rather than mass within the compartment. The nerve courses the
// pressure itself injures stay in play (PRESSURE_REACHES in compartments.js — raised-pressure round, row 2).
```

In `differential()`, replace `    if (pressure.present && !INTRACRANIAL_LEVELS.has(site.level)) continue; // compartment filter` with:

```js
    if (pressure.present && !INTRACRANIAL_LEVELS.has(site.level) && !PRESSURE_REACHES.has(`${site.level}|${site.part}`)) continue; // compartment filter
```

- [ ] **Step 6: Re-pin `test/fundus.test.js` (row 12)**

After the import line `import { causesFor } from "../src/data/causes.js";` add:

```js
import { PRESSURE_REACHES } from "../src/model/compartments.js";
```

Replace `  ok("papilloedema alone excludes the periphery", alone.every(c => INTRACRANIAL_LEVELS.has(c.site.level)));` with:

```js
  // The VI's own course stays in play: raised pressure itself produces its palsy (raised-pressure round, row 2, 2026-11-05).
  ok("papilloedema alone keeps only intracranial places and the nerve courses the pressure reaches",
     alone.every(c => INTRACRANIAL_LEVELS.has(c.site.level) || PRESSURE_REACHES.has(`${c.site.level}|${c.site.part}`)));
```

- [ ] **Step 7: Add the suite to `package.json`**

In the `test` script, replace the tail `&& node test/content-gaps.test.js"` with
`&& node test/content-gaps.test.js && node test/raised-pressure.test.js"`.

- [ ] **Step 8: Run the suite, the touched suites, then everything**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/raised-pressure.test.js && node test/fundus.test.js && node test/compartments.test.js && node test/cranial-nerves.test.js`
Expected: `13 passed, 0 failed`, and every other suite PASS, exit 0.
Then `npm test`: green (87 suites). Then `npm run test:audit`: **1036 passed, 11 failed** (R1 #7 and R1 #8 now pass).

- [ ] **Step 9: Commit**

```bash
git add test/raised-pressure.test.js package.json src/model/sites.js src/model/compartments.js src/engine/inverse.js test/fundus.test.js
git commit -m "feat(engine): both VI nerves as one place; papilloedema keeps the VI's own course (rows 1, 2, 12)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: The uncal reading of the compressive III (rows 5–8, 11)

**Files:**
- Modify: `test/raised-pressure.test.js` (sections B and E), `src/model/sites.js` (`READINGS`, `buildSites`),
  `src/engine/inverse.js` (`solverSites`, `variantOf`, four callers), `src/data/causes.js` (`causesFor`, `rankCauses`),
  `app/answer.js` (red flag), `app/labels.js` (`readingLabel`), `app/app.js` (`whatBlock`)

**Interfaces:**
- Consumes: the suite's helpers (Task 1).
- Produces: a variant of every `pupil|cn3_compressive` site: `{ key: "uncal", structures, needs: "reduced_consciousness",
  needsOwn: true, leads: "Uncal herniation", red }`; `solverSites(opts = {}, observed = null)`; a variant site object carries
  `variant`, `leads` and `red`; a cause object may carry `lead: true`.

- [ ] **Step 1: Append sections B and E to the suite**

Immediately above `// ---- report ----` in `test/raised-pressure.test.js` insert:

```js
// ---- B. The uncal reading of the compressive III (rows 5–8, 11) ----
const UNCAL = "reduced_consciousness@none fixed_dilated_pupil@left extensor_posturing@none";
const RED = "A new dilated pupil with a falling conscious level is uncal herniation until proven otherwise — CT head now and call neurosurgery; start lowering the pressure while you wait.";
{ const r = solve(T(UNCAL)), c = r.display[0];
  ok("row 5: coma + a blown L pupil + posturing → the left compressive III, one lesion (R1 #13)",
     c?.site.id === "left_pupil_cn3_compressive" && r.multi === null, `${ids(r)[0]} multi=${!!r.multi}`);
  ok("row 5: …in its uncal reading", c?.site.variant === "uncal", c?.site.variant);
  ok("row 6: the reading leads with uncal herniation", !!c && lead(c.site) === "Uncal herniation", c && lead(c.site)); }
{ const r = solve(T("reduced_consciousness@none fixed_dilated_pupil@left"));
  ok("row 5: coma + a blown L pupil → the left compressive III, one lesion (it read the Adie pupil, routine)",
     ids(r)[0] === "left_pupil_cn3_compressive" && r.multi === null, `${ids(r)[0]} multi=${!!r.multi}`); }
{ const r = solve(T("reduced_consciousness@none fixed_dilated_pupil@left weak_arm@right weak_leg@right babinski@right"));
  ok("row 5: …with a contralateral hemiparesis and Babinski (the peduncle) → still one place",
     ids(r)[0] === "left_pupil_cn3_compressive" && r.multi === null, `${ids(r)[0]} multi=${!!r.multi}`); }
{ const { ans } = card(UNCAL);
  ok("row 8: the Where line names the reading", ans?.lines.where === "Left CN III (compressive) — uncal herniation.", ans?.lines.where);
  ok("row 6: the What line leads with uncal herniation",
     ans?.lines.what === "Most likely Uncal herniation (must not miss). Must not miss: Posterior communicating artery aneurysm.", ans?.lines.what);
  ok("row 6: the Next line stays the site's plan", /^IMMEDIATE neurosurgery/.test(ans?.lines.next || ""), ans?.lines.next);
  ok("rows 7, 11: the reading's red flag", ans?.lines.red === RED, ans?.lines.red); }
{ const c = solve(T(UNCAL)).display[0];
  ok("row 6: within the reading it reads as common, so the What card's own 'Most likely' line names it first",
     !!c && (causesFor(c.site).all.filter(x => x.likelihood === "common")[0] || {}).name === "Uncal herniation"); }
ok("row 6 guard: the awake III keeps the authored order and likelihood (the aneurysm common, herniation uncommon)",
   (causesFor(SITE.left_pupil_cn3_compressive).all.find(x => x.name === "Uncal herniation") || {}).likelihood === "uncommon"
   && lead(SITE.left_pupil_cn3_compressive) === "Posterior communicating artery aneurysm");
ok("row 5 gate: an awake blown pupil → the Adie pupil still leads", ids(solve(T("fixed_dilated_pupil@left")))[0] === "left_pupil_ciliary_ganglion");
{ const r = solve(T("ptosis@left weak_adduction@left weak_elevation@left weak_depression@left fixed_dilated_pupil@left")), c = r.display[0];
  ok("row 5 gate: an awake pupil-involving III → the compressive III, not the reading, aneurysm first",
     c?.site.id === "left_pupil_cn3_compressive" && !c.site.variant && lead(c.site) === "Posterior communicating artery aneurysm", `${c?.site.id} ${c?.site.variant}`); }
ok("row 5 gate: Weber, awake → the left medial midbrain still leads",
   ids(solve(T("ptosis@left weak_adduction@left weak_elevation@left weak_depression@left weak_arm@right weak_leg@right")))[0] === "left_midbrain_medial");
ok("row 5 gate: coma alone does not list the reading", !solve(T("reduced_consciousness@none")).display.some(c => c.site.variant === "uncal"));
ok("row 5 gate: coma + posturing does not list the reading", ids(solve(T("reduced_consciousness@none extensor_posturing@none"))).join() === "brainstem_aras");
ok("row 5 gate: coma + a weak arm (no III sign) does not offer the reading",
   !solve(T("reduced_consciousness@none weak_arm@left")).display.some(c => c.site.variant === "uncal"));

// ---- E. Unchanged by design (spec §6) ----
const first = toks => ids(solve(T(toks)))[0];
ok("guard: Gradenigo (VI + V1) → the petrous apex", first("weak_abduction@left v1_sensory@left") === "left_skull_base_petrous_apex");
ok("guard: Millard-Gubler → the left medial pons", first("weak_abduction@left facial_weakness@left forehead_involved@left weak_arm@right weak_leg@right") === "left_pons_medial");
ok("guard: Millard-Gubler + papilloedema → the left medial pons", first(`weak_abduction@left facial_weakness@left forehead_involved@left weak_arm@right weak_leg@right ${P}`) === "left_pons_medial");
ok("guard: a complete III, pupil not entered → the ischaemic III", first("ptosis@left weak_adduction@left weak_elevation@left weak_depression@left") === "left_pupil_cn3_ischaemic");
ok("guard: coma alone → the diffuse cerebrum", first("reduced_consciousness@none") === "cerebrum_diffuse");
ok("guard: coma + papilloedema → the diffuse cerebrum", first(`reduced_consciousness@none ${P}`) === "cerebrum_diffuse");
ok("guard: Kernohan's picture (coma + L pupil + L hemiparesis) → unchanged, the right corona radiata",
   first("reduced_consciousness@none fixed_dilated_pupil@left weak_arm@left weak_leg@left") === "right_subcortex_corona_radiata");
{ const r = solve(T("fixed_dilated_pupil@left weak_arm@right weak_leg@right"));
  ok("guard: an awake dilated pupil + contralateral hemiparesis stays two places, without the reading",
     r.multi !== null && !r.display.some(c => c.site.variant === "uncal")); }
ok("guard: papilloedema + R hemiparesis → the left corona radiata", first(`${P} weak_arm@right weak_leg@right`) === "left_subcortex_corona_radiata");
{ const r = solve(T("weak_depression@left weak_depression@right vertical_diplopia@left vertical_diplopia@right"));
  ok("guard: bilateral IV stays the two IV nerves (no bilateral IV site)",
     (r.multi?.sites.map(s => s.id).sort().join() || "") === "left_skull_base_trochlear_cisternal,right_skull_base_trochlear_cisternal"); }

```

- [ ] **Step 2: Run it to see it fail**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/raised-pressure.test.js`
Expected: `30 passed, 10 failed`, exit 1. The ten failing lines are section B's row lines; its seven guards (the six gate
lines and the awake-III guard) and all ten section-E guards pass.

- [ ] **Step 3: Add the READINGS table and attach it (`src/model/sites.js`)**

Immediately above `function buildSites() {` insert:

```js
// READINGS OF A PRIMITIVE SITE (raised-pressure round, row 5, owner-approved 2026-11-05). A reading is a variant, as the
// cord's are: the same place, id, causes and plans, read in another state, so it predicts a different set of signs.
//   uncal — the compressive III at the tentorial edge: the herniating uncus presses the III (the pupil first) and the
//           midbrain beside it: the ARAS (reduced consciousness), extensor posturing, and the cerebral peduncle
//           (contralateral weakness and Babinski). Every row is REUSED.
// The gate: offered only with reduced consciousness entered (`needs`) AND one of the III's own signs (`needsOwn`). Ungated it
// took the awake Weber picture (7 assertions); with the consciousness condition alone, coma + a weak arm read a compressed
// III with no III sign entered (spec §3.3). `leads`: the cause its What line leads with (row 6); `red`: its red flag (row 11).
const READINGS = {
  "pupil|cn3_compressive": structures => [{
    key: "uncal",
    structures: [...structures, "aras_brainstem", "aras_posturing", "cst_midbrain_arm", "cst_midbrain_leg", "cst_midbrain_bab"],
    needs: "reduced_consciousness", needsOwn: true,
    leads: "Uncal herniation",
    red: "A new dilated pupil with a falling conscious level is uncal herniation until proven otherwise — CT head now and call neurosurgery; start lowering the pressure while you wait.",
  }],
};

```

In `buildSites()`, replace

```js
          structures, // structure ids present at this site, derived not hand-listed
          ...(buildingBlock ? { buildingBlock: true } : {})
```

with

```js
          structures, // structure ids present at this site, derived not hand-listed
          ...(buildingBlock ? { buildingBlock: true } : {}),
          ...(READINGS[`${level}|${part}`] ? { variants: READINGS[`${level}|${part}`](structures) } : {})
```

- [ ] **Step 4: Apply the reading's gate (`src/engine/inverse.js`)**

Replace `export function solverSites(opts = {}) {` with `export function solverSites(opts = {}, observed = null) {`.

In the same function, replace

```js
      if (level && v.top && levelIndex(v.top) > levelIndex(level)) continue;
      out.push(variantOf(site, v));
```

with

```js
      if (level && v.top && levelIndex(v.top) > levelIndex(level)) continue;
      // A READING's gate (raised-pressure round, row 5): offered only when its finding is entered and, with `needsOwn`, when
      // the place itself is implicated (one of its own findings entered). With no findings passed, a gated reading is not
      // offered, as spinal shock is not offered without a level.
      if (v.needs && !(observed && [...observed].some(t => t.startsWith(`${v.needs}@`)))) continue;
      if (v.needsOwn && !(observed && [...expectedFindings(site, opts)].some(t => observed.has(t)))) continue;
      out.push(variantOf(site, v));
```

Replace `  segments: v.segments, variants: undefined });` (the end of `variantOf`) with:

```js
  segments: v.segments, variants: undefined, leads: v.leads, red: v.red });
```

Pass the findings from the four callers: replace each `solverSites(opts)` with `solverSites(opts, observedSet)` — exactly
four occurrences, in `rankSingle`, `differential`, `ruledOutSites` and `nearFit` (each has an `observedSet` parameter).
`src/engine/why.js` keeps `solverSites(opts)`: its station index is built without findings, so it never sees a gated
reading (decision 4).

- [ ] **Step 5: A reading may lead with its cause (`src/data/causes.js`)**

In `causesFor()`, replace

```js
  const byLikelihood = (a, b) => LIKELIHOOD.indexOf(a.likelihood) - LIKELIHOOD.indexOf(b.likelihood);
```

with

```js
  const byLikelihood = (a, b) => (!!b.lead - !!a.lead) || LIKELIHOOD.indexOf(a.likelihood) - LIKELIHOOD.indexOf(b.likelihood);
  // A READING may lead with its own cause (raised-pressure round, row 6): the uncal reading of the compressive III leads with
  // uncal herniation, where the awake III leads with the posterior communicating artery aneurysm. Within the reading it is the
  // common cause, so it reads as common there (the What card's "Most likely" line agrees). The authored row is not edited.
  if (site.leads) list = list.map(x => x.name === site.leads ? { ...x, lead: true, likelihood: "common" } : x);
```

Replace

```js
export function rankCauses(causes) {
  return [...causes].sort((a, b) => likelihoodRank(a) - likelihoodRank(b));
}
```

with

```js
export function rankCauses(causes) {
  return [...causes].sort((a, b) => (!!b.lead - !!a.lead) || likelihoodRank(a) - likelihoodRank(b)); // a reading's lead first
}
```

- [ ] **Step 6: The card reads the reading (`app/answer.js`, `app/labels.js`, `app/app.js`)**

`app/answer.js` — replace `    red: entityRed || nameForSite(st.sel.site, { dominantSide: dom }).red || null,` with:

```js
    red: entityRed || st.sel.site.red || nameForSite(st.sel.site, { dominantSide: dom }).red || null, // a reading's own flag first
```

`app/labels.js` (`readingLabel`) — replace `"shock:arms-spared": " (spinal shock, arms spared)" }[v] || "";` with:

```js
"shock:arms-spared": " (spinal shock, arms spared)", uncal: " — uncal herniation" }[v] || "";
```

`app/app.js` (`whatBlock`) — replace

```js
  const ph = nameForSite(site, { dominantSide: domView() });
  const red = ph.red ? `<div class="multi" style="border-style:solid;border-color:var(--red);background:var(--red-bg)"><b>Red flag:</b> ${esc(ph.red)}</div>` : "";
```

with

```js
  const ph = nameForSite(site, { dominantSide: domView() });
  const redText = site.red || ph.red; // a reading's own red flag (the uncal reading, raised-pressure round, row 11)
  const red = redText ? `<div class="multi" style="border-style:solid;border-color:var(--red);background:var(--red-bg)"><b>Red flag:</b> ${esc(redText)}</div>` : "";
```

- [ ] **Step 7: Run the suite, the touched suites, then everything**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/raised-pressure.test.js && node test/pupil-efferent.test.js && node test/consciousness.test.js && node test/why.test.js && node test/engine.test.js && node test/causes.test.js && node test/answer.test.js && node test/app-smoke.test.js`
Expected: `40 passed, 0 failed`, and every other suite PASS, exit 0. Then `npm test`: green. Then `npm run test:audit`:
**1038 passed, 9 failed** — the composite-sites round exactly.

- [ ] **Step 8: Commit**

```bash
git add test/raised-pressure.test.js src/model/sites.js src/engine/inverse.js src/data/causes.js app/answer.js app/labels.js app/app.js
git commit -m "feat(engine): the uncal reading of the compressive III, gated; it leads with uncal herniation (rows 5-8, 11)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: The false-localising set-aside (rows 3, 9)

**Files:**
- Modify: `test/raised-pressure.test.js` (section C), `src/model/compartments.js` (`FALSE_LOCALISING_SIGNS`),
  `src/engine/inverse.js` (import, `falseLocalisingAside`, `solve`), `app/answer.js` (sentence, count, Why and Where lines),
  `app/app.js` (import, count, Where-card annot)

**Interfaces:**
- Consumes: `PRESSURE_REACHES` and the suite's helpers (Task 1).
- Produces: `falseLocalisingAside(observedSet, options) → string[]` (exported from `inverse.js`); every `solve()` result
  carries `pressure.falseLocalising` — `null`, or `{ tokens: string[] }`; `falseLocalisingSentence(n) → string` exported from
  `app/answer.js` (used by Task 4 and `app.js`).

- [ ] **Step 1: Append section C to the suite**

Immediately above `// ---- E. Unchanged by design (spec §6) ----` insert:

```js
// ---- C. The false-localising set-aside (rows 3, 9) ----
{ const r = solve(T(`weak_abduction@left weak_abduction@right ${P} weak_arm@right weak_leg@right`));
  ok("row 3: bilateral VI + papilloedema + R hemiparesis → a left hemisphere place, one lesion",
     /^left_(cortex|subcortex)_/.test(ids(r)[0] || "") && r.multi === null, `${ids(r)[0]} multi=${!!r.multi}`);
  ok("row 3: …both VI palsies are set aside", flOf(r).join() === "weak_abduction@left,weak_abduction@right", flOf(r).join()); }
{ const r = solve(T(`weak_abduction@left ${P} weak_arm@left weak_leg@left`));
  ok("row 3: L VI + papilloedema + L hemiparesis → a right hemisphere place, the VI set aside",
     /^right_(cortex|subcortex)_/.test(ids(r)[0] || "") && r.multi === null && flOf(r).join() === "weak_abduction@left", `${ids(r)[0]} ${flOf(r).join()}`); }
ok("row 3 (b): one place explains it all (the pons: L VI + papilloedema + R hemiparesis) → nothing set aside",
   flOf(solve(T(`weak_abduction@left ${P} weak_arm@right weak_leg@right`))).length === 0);
{ const r = solve(T(`weak_abduction@left v1_sensory@left ${P}`));
  ok("row 3 (c): Gradenigo + papilloedema → nothing set aside (no place explains the rest)", flOf(r).length === 0, flOf(r).join()); }
{ const jug = exp("left_skull_base_x_jugular").join(" ");
  const r = solve(T(`weak_abduction@left ${jug} ${P}`));
  ok("row 3 (d): a jugular-foramen picture + VI + papilloedema keeps its claim (papilloedema had moved the rest)",
     jug.length > 0 && flOf(r).length === 0 && r.multi !== null, `${flOf(r).join()} multi=${!!r.multi}`); }
ok("row 3: without papilloedema nothing is set aside",
   flOf(solve(T("weak_abduction@left weak_abduction@right weak_arm@right weak_leg@right"))).length === 0);
{ const { ans } = card(`weak_abduction@left weak_abduction@right ${P} weak_arm@right weak_leg@right`);
  ok("row 9: the Where line names the set-aside palsies",
     (ans?.lines.where || "").endsWith("The sixth-nerve palsies are set aside: with papilloedema they are a false-localising sign of the raised pressure, not further lesions."), ans?.lines.where);
  ok("row 9: the Where line counts without them", /^Left corona radiata\. \d+ other places also fit/.test(ans?.lines.where || ""), ans?.lines.where);
  ok("row 9: the Why line leaves them out",
     ans?.lines.why === "Right arm weakness → anywhere from the cerebral cortex to the spinal cord; see Where for what separates them.", ans?.lines.why); }
ok("row 9: the one-palsy sentence", (ANS.falseLocalisingSentence || (() => ""))(1) === "The sixth-nerve palsy is set aside: with papilloedema it is a false-localising sign of the raised pressure, not a second lesion.");

```

- [ ] **Step 2: Run it to see it fail**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/raised-pressure.test.js`
Expected: `44 passed, 7 failed`, exit 1. Section C's four guard lines — (b), (c), (d) and "without papilloedema" — pass.

- [ ] **Step 3: Declare the false-localising signs (`src/model/compartments.js`)**

After the line `export const PRESSURE_REACHES = new Set(["skull_base|vi_cisternal", "skull_base|vi_petrous_apex"]);` insert:

```js
// The palsies papilloedema makes false-localising (raised-pressure round, row 3): set aside, under the conditions in
// inverse.js falseLocalisingAside, when they are what stops one place explaining the rest. The VI only; the IV was measured
// and is not included (it is rarely the false-localising sign, and row 2 defers it).
export const FALSE_LOCALISING_SIGNS = new Set(["weak_abduction"]);
```

- [ ] **Step 4: The set-aside, before the background step (`src/engine/inverse.js`)**

Replace the import `import { LEVEL_COMPARTMENT, INTRACRANIAL_COMPARTMENTS, PRESSURE_REACHES } from "../model/compartments.js";` with:

```js
import { LEVEL_COMPARTMENT, INTRACRANIAL_COMPARTMENTS, PRESSURE_REACHES, FALSE_LOCALISING_SIGNS } from "../model/compartments.js";
```

Replace the whole `// ---- TOP-LEVEL SOLVE ----` block, from that comment to the closing `}` of `solve`, with:

```js
// ---- FALSE-LOCALISING SIGNS (raised-pressure round, row 3, owner-approved 2026-11-05) ----
// The second narrow overturn of "a LOCALISING sign is never relaxed away" (the first is the same-family near-fit). With
// papilloedema, a sixth-nerve palsy (FALSE_LOCALISING_SIGNS) is set aside as a false-localising sign of the pressure when:
//   (a) papilloedema is entered; (b) no place explains every finding;
//   (c) one place explains the rest, or nothing is left but the papilloedema;
//   (d) that place is the rest's own answer read without the papilloedema — a jugular-foramen or carotid-space picture
//       that papilloedema replaces with a brainstem place keeps its claim.
// Like background it never joins a cover, and the card names it. Returns the tokens to set aside: [] when nothing is.
export function falseLocalisingAside(observedSet, options = {}) {
  if (![...observedSet].some(t => PRESSURE_TOKEN.test(t))) return [];                       // (a)
  const opts = { dominantSide: options.dominantSide || "left", sensoryLevel: options.sensoryLevel };
  const entered = [...observedSet].filter(t => !PRESSURE_TOKEN.test(t) && !isNormalToken(t));
  const fl = entered.filter(t => FALSE_LOCALISING_SIGNS.has(t.split("@")[0]));
  if (!fl.length) return [];
  if (differential(observedSet, opts).some(c => c.n === entered.length)) return [];         // (b)
  const rest = entered.filter(t => !fl.includes(t));
  if (!rest.length) return fl;                                                                // (c), nothing left
  const fits = differential(new Set([...observedSet].filter(t => !fl.includes(t))), opts).filter(c => c.n === rest.length);
  if (!fits.length) return [];                                                                // (c)
  const own = differential(new Set(rest), opts).find(c => c.n === rest.length);
  return own && fits.some(c => c.site.id === own.site.id) ? fl : [];                          // (d)
}

// ---- TOP-LEVEL SOLVE ----
// The false-localising step runs first, then the background step: what they set aside is not localised at all, and the rest
// is solved as usual. `background` is null, or { tokens }; `pressure.falseLocalising` is null, or { tokens } — for the card.
export function solve(observedSet, options = {}) {
  const fl = falseLocalisingAside(observedSet, options);
  const kept = fl.length ? new Set([...observedSet].filter(t => !fl.includes(t))) : observedSet;
  const aside = backgroundAside(kept, options);
  const r = aside.length
    ? { ...solveOne(new Set([...kept].filter(t => !aside.includes(t))), options), background: { tokens: aside } }
    : { ...solveOne(kept, options), background: null };
  return { ...r, pressure: { ...r.pressure, falseLocalising: fl.length ? { tokens: fl } : null } };
}
```

- [ ] **Step 5: The card names them and counts without them (`app/answer.js`)**

Immediately above `export const B12_LINE =` insert:

```js
// Row 9 (owner-approved wording, raised-pressure round 2026-11-05): the false-localising set-aside.
export const falseLocalisingSentence = n => !n ? "" : n > 1
  ? "The sixth-nerve palsies are set aside: with papilloedema they are a false-localising sign of the raised pressure, not further lesions."
  : "The sixth-nerve palsy is set aside: with papilloedema it is a false-localising sign of the raised pressure, not a second lesion.";
```

In `answerFor`, replace `  const aside = new Set(st.r.background ? st.r.background.tokens : []);` with:

```js
  // The false-localising palsies (raised-pressure round, rows 3 and 9) leave the count and the Why line, as background does.
  const flTok = st.r.pressure && st.r.pressure.falseLocalising ? st.r.pressure.falseLocalising.tokens : [];
  const aside = new Set([...(st.r.background ? st.r.background.tokens : []), ...flTok]);
```

and replace `  const background = backgroundSentence([...new Set([...aside].map(t => t.split("@")[0]))], st.sel.site.level === "cord");` with:

```js
  const background = [backgroundSentence([...new Set([...aside].filter(t => !flTok.includes(t)).map(t => t.split("@")[0]))], st.sel.site.level === "cord"),
    falseLocalisingSentence(flTok.length)].filter(Boolean).join(" ");
```

- [ ] **Step 6: The app counts without them and the Where card names them (`app/app.js`)**

Replace the import `import { answerFor, resolveNext, backgroundSentence } from "./answer.js";` with:

```js
import { answerFor, resolveNext, backgroundSentence, falseLocalisingSentence } from "./answer.js";
```

In `renderResults`, replace `  const counted = total - (r.background ? r.background.tokens.length : 0);` with:

```js
  const flCount = r.pressure && r.pressure.falseLocalising ? r.pressure.falseLocalising.tokens.length : 0;
  const counted = total - (r.background ? r.background.tokens.length : 0) - flCount; // raised-pressure round, row 3
```

In `whereCard`, immediately above `  const multi = (!nAll && r.multi)` insert:

```js
  // The false-localising palsies (raised-pressure round, rows 3 and 9): the same sentence as the answer card's Where line.
  const fl = r.pressure && r.pressure.falseLocalising
    ? `<div class="annot"><b>False-localising:</b> ${esc(falseLocalisingSentence(r.pressure.falseLocalising.tokens.length))}</div>` : "";
```

and in its return line replace `${near}${multi}${bg}${annot}${ruled}` with `${near}${multi}${bg}${fl}${annot}${ruled}`.

- [ ] **Step 7: Run the suite, the touched suites, then everything**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/raised-pressure.test.js && node test/fundus.test.js && node test/false-multifocal.test.js && node test/answer.test.js && node test/app-smoke.test.js`
Expected: `51 passed, 0 failed`, and every other suite PASS, exit 0. Then `npm test`: green. Then `npm run test:audit`:
**1038 passed, 9 failed** (unchanged by this task).

- [ ] **Step 8: Commit**

```bash
git add test/raised-pressure.test.js src/model/compartments.js src/engine/inverse.js app/answer.js app/app.js
git commit -m "feat(engine): with papilloedema a VI palsy that stops one place explaining the rest is set aside as false-localising (rows 3, 9)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: The pressure-only card (rows 4, 10)

**Files:**
- Modify: `test/raised-pressure.test.js` (section D), `app/answer.js` (`PRESSURE_ONLY`, `pressureOnlyCard`, early return),
  `app/app.js` (import, `renderResults`, `answerCard`, `answerStrip`)

**Interfaces:**
- Consumes: `falseLocalisingSentence`, `pressure.falseLocalising` (Task 3).
- Produces: `PRESSURE_ONLY` `{ head, where, why, what, next, urgency }` exported from `app/answer.js`; `answerFor()` returns
  `pressureOnly: true` (with `lines`, `nx: { urgency, referral }`) when papilloedema is entered and nothing else is left to
  localise.

- [ ] **Step 1: Append section D to the suite**

Immediately above `// ---- E. Unchanged by design (spec §6) ----` insert:

```js
// ---- D. The pressure-only card (rows 4, 10) ----
const PO = ANS.PRESSURE_ONLY || {};
{ const { ans } = card(P);
  ok("row 4: papilloedema alone → the pressure-only card", ans?.pressureOnly === true);
  ok("row 10: its four lines",
     ans?.lines.where === "Inside the skull — papilloedema means raised intracranial pressure, and on its own it does not say where."
     && ans?.lines.why === "Papilloedema → raised intracranial pressure: it places the problem inside the skull but localises nothing."
     && ans?.lines.what === "Find what is raising the pressure: a mass, hydrocephalus or cerebral venous sinus thrombosis — idiopathic intracranial hypertension only once those are excluded."
     && ans?.lines.next === "Image the head, with venography, before any lumbar puncture; neurosurgery if there is a mass or hydrocephalus.",
     JSON.stringify(ans?.lines));
  ok("row 10: badged urgent, with no red flag line (the banner stays)", ans?.nx.urgency === "urgent" && ans?.lines.red === null);
  ok("row 10: the card's head is the banner's own label", PO.head === "Raised intracranial pressure"); }
ok("row 4: a down-going plantar + papilloedema → the pressure-only card too", card(`plantar_flexor@left ${P}`).ans?.pressureOnly === true);
ok("row 4 guard: papilloedema + a hemiparesis is a place, not the pressure-only card", !card(`${P} weak_arm@right weak_leg@right`).ans?.pressureOnly);
{ // Row 10's last sentence: with rows 1–2 in, no picture reaches it through solve(), so it is pinned with a crafted result.
  const r0 = solve(T(P)), r = { ...r0, pressure: { ...r0.pressure, falseLocalising: { tokens: ["weak_abduction@left"] } } };
  const { ans } = card(`weak_abduction@left ${P}`, r);
  ok("row 10: a set-aside palsy adds its sentence to the pressure-only card",
     ans?.pressureOnly === true && (ans?.lines.where || "").endsWith(" The sixth-nerve palsy is a false-localising sign of the raised pressure, not a second lesion."), ans?.lines.where); }

```

- [ ] **Step 2: Run it to see it fail**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/raised-pressure.test.js`
Expected: `52 passed, 6 failed`, exit 1. Only the row-4 guard of section D passes.

- [ ] **Step 3: The card for papilloedema alone (`app/answer.js`)**

Immediately above `// ---- the whole card ----` insert:

```js
// ---- papilloedema with nothing else localised (raised-pressure round, rows 4 and 10, owner-approved wording) ----
// The card names no place: every intracranial place explains 0 of 0, and the first of them is an accident of the ranking.
export const PRESSURE_ONLY = {
  head: "Raised intracranial pressure",
  where: "Inside the skull — papilloedema means raised intracranial pressure, and on its own it does not say where.",
  why: "Papilloedema → raised intracranial pressure: it places the problem inside the skull but localises nothing.",
  what: "Find what is raising the pressure: a mass, hydrocephalus or cerebral venous sinus thrombosis — idiopathic intracranial hypertension only once those are excluded.",
  next: "Image the head, with venography, before any lumbar puncture; neurosurgery if there is a mass or hydrocephalus.",
  urgency: "urgent",
};
const pressureOnlyFalseLocalising = n => !n ? "" : n > 1
  ? " The sixth-nerve palsies are a false-localising sign of the raised pressure, not further lesions."
  : " The sixth-nerve palsy is a false-localising sign of the raised pressure, not a second lesion.";
function pressureOnlyCard(nFalseLocalising) {
  return { lines: { where: PRESSURE_ONLY.where + pressureOnlyFalseLocalising(nFalseLocalising), why: PRESSURE_ONLY.why,
    what: PRESSURE_ONLY.what, next: PRESSURE_ONLY.next, red: null },
    nx: { urgency: PRESSURE_ONLY.urgency, referral: PRESSURE_ONLY.next }, combined: false, twoLesions: false, pressureOnly: true };
}

```

In `answerFor`, replace `  const total = st.total - aside.size;` with:

```js
  const total = st.total - aside.size;
  if (st.r.pressure && st.r.pressure.present && total === 0) return pressureOnlyCard(flTok.length); // rows 4, 10
```

- [ ] **Step 4: The app draws it (`app/app.js`)**

Replace the import `import { answerFor, resolveNext, backgroundSentence, falseLocalisingSentence } from "./answer.js";` with:

```js
import { answerFor, resolveNext, backgroundSentence, falseLocalisingSentence, PRESSURE_ONLY } from "./answer.js";
```

In `renderResults`, replace

```js
  el.innerHTML = answerCard(sel, list, r, ans)
    + sectionNav(has)
    + pmsg + rmsg
    + whereCard(list, cands, counted, r)
    + together
    + whyCard(tf, sel, list)
    + whatCard(sel.site, r, list)
    + nextCard(sel.site, r, list)
    + answerStrip(sel, list, counted, ans.nx);
```

with

```js
  // Papilloedema with nothing else localised (raised-pressure round, row 4): the card names no place, so the cards that
  // describe the selected place (Together, Why, What, Next) are not drawn; the Where list stays, as fundus.test pins it.
  if (ans.pressureOnly) {
    el.innerHTML = answerCard(sel, list, r, ans) + pmsg + rmsg + whereCard(list, cands, counted, r)
      + answerStrip(sel, list, counted, ans.nx, PRESSURE_ONLY.head);
  } else {
    el.innerHTML = answerCard(sel, list, r, ans)
      + sectionNav(has)
      + pmsg + rmsg
      + whereCard(list, cands, counted, r)
      + together
      + whyCard(tf, sel, list)
      + whatCard(sel.site, r, list)
      + nextCard(sel.site, r, list)
      + answerStrip(sel, list, counted, ans.nx);
  }
```

(The `wireCardControls()` … `wireAnswerStrip()` calls that follow, and the section loop after them, stay as they are: the loop
already skips a section that is not on the page.)

In `answerCard`, replace

```js
    <div class="oh-lead"><div class="oh-lead-txt"><b>${esc(siteName(sel.site))}</b>
      <details class="oh-raw"><summary>site id</summary><code>${esc(siteRaw(sel.site))} · ${esc(sel.site.id)}</code></details>
```

with

```js
    <div class="oh-lead"><div class="oh-lead-txt"><b>${esc(ans.pressureOnly ? PRESSURE_ONLY.head : siteName(sel.site))}</b>
      ${ans.pressureOnly ? "" : `<details class="oh-raw"><summary>site id</summary><code>${esc(siteRaw(sel.site))} · ${esc(sel.site.id)}</code></details>`}
```

In `answerStrip`, replace

```js
function answerStrip(sel, list, total, nx) {
  const n = list.filter(c => c.n === total).length;
```

with

```js
function answerStrip(sel, list, total, nx, head = null) {
  const n = head ? 0 : list.filter(c => c.n === total).length; // `head`: the pressure-only card names no place (row 4)
```

and replace `<span class="ans-strip-t">${u}${n > 1 ? ` · ${n} fit` : ""} · ${esc(siteName(sel.site))}</span>` with
`<span class="ans-strip-t">${u}${n > 1 ? ` · ${n} fit` : ""} · ${esc(head || siteName(sel.site))}</span>`.

- [ ] **Step 5: Run the suite, the touched suites, then everything**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/raised-pressure.test.js && node test/answer.test.js && node test/app-smoke.test.js && node test/fundus.test.js`
Expected: `58 passed, 0 failed`, and every other suite PASS, exit 0. Then `npm test`: **87 suites, 7413 assertions, green**.

- [ ] **Step 6: Commit**

```bash
git add test/raised-pressure.test.js app/answer.js app/app.js
git commit -m "feat(card): papilloedema with nothing else localised names no place (rows 4, 10)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Four audit probes and their record (row 13)

**Files:**
- Modify: `test/clinical-audit.test.js` (after the content-gap probes), `docs/superpowers/specs/2026-10-18-clinical-audit-suite.md`

- [ ] **Step 1: Add the four probes**

In `test/clinical-audit.test.js`, immediately after the line that ends
`{ first: /^right_(cortex|subcortex|pons|midbrain|medulla)_/, single: true });` (the content-gap fix's foot-drop probe),
insert:

```js
// owner-approved 2026-11-05 (raised-pressure round, round 1, row 13): pictures the round decides, which no audit probe
// covered. Each fails on 4d781bd.
T("Cranial nerves & skull base", "VI palsy + papilloedema → the VI nerve (false-localising), not a pontine stroke", "weak_abduction@left papilloedema@none", { first: /^left_skull_base_vi_(cisternal|petrous_apex)$/, pressure: true });
T("Consciousness & raised pressure", "coma + fixed dilated L pupil → the compressive III (uncal herniation), one lesion", "reduced_consciousness@none fixed_dilated_pupil@left", { first: /^left_pupil_cn3_compressive$/, single: true });
T("Consciousness & raised pressure", "coma + fixed dilated L pupil + R hemiparesis → the compressive III (uncal herniation), one lesion", "reduced_consciousness@none fixed_dilated_pupil@left weak_arm@right weak_leg@right", { first: /^left_pupil_cn3_compressive$/, single: true });
T("Consciousness & raised pressure", "bilateral VI + papilloedema + R hemiparesis → a left hemisphere site, one lesion (the VIs false-localising)", "weak_abduction@left weak_abduction@right papilloedema@none weak_arm@right weak_leg@right", { first: /^left_(cortex|subcortex)_/, single: true });
```

- [ ] **Step 2: Run the audit**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm run test:audit`
Expected: harness PASS; probes **108 / 115**; counted checks **1050 passed, 9 failed**; mirror **277 / 277**; swaps 272 / 272;
background 292 / 292. The 9 failing are the composite-sites round: syrinx; bilateral INO; basilar coma (2); locked-in (2);
parasagittal; top of the basilar; bilateral PCA. (Measured in the dry run: with these probes added to `4d781bd` the audit
reads 1039 / 20 — each probe fails there.)

- [ ] **Step 3: Record them in the audit spec**

Append to `docs/superpowers/specs/2026-10-18-clinical-audit-suite.md`:

```markdown

## Raised-pressure round, round 1, row 13: four probes added (2026-11-05)

The raised-pressure round's round 1 (`2026-11-05-raised-pressure-design.md`, row 13, approved as written) added four counted
probes. They cover pictures that the new rows decide, and that no probe covered. Each fails on `4d781bd` (the content-gap
fix):

| Probe | Expected answer (approved) | Baseline |
|---|---|---|
| VI palsy + papilloedema | a left VI site first, not the pons; the raised-pressure axis fires | left medial pons first (basilar perforator infarct) |
| coma + fixed dilated left pupil | the left compressive III first; one lesion | diffuse cerebrum + left ciliary ganglion (Adie pupil, routine) |
| coma + fixed dilated left pupil + right hemiparesis | the left compressive III first; one lesion | three places |
| bilateral VI + papilloedema + right hemiparesis | a left hemisphere site first; one lesion | left medial pons + right VI, "Vasculitis" |

Each probe is also mirrored, so the mirror property runs **277** checks.

**After the fix (measured on `fix/raised-pressure`):** probes **108 / 115**; counted checks 1050 passed, 9 failed. The 9 are
exactly the composite-sites round. Synonym swaps 272 / 272; background 292 / 292; mirror 277 / 277.
```

- [ ] **Step 4: Commit**

```bash
git add test/clinical-audit.test.js docs/superpowers/specs/2026-10-18-clinical-audit-suite.md
git commit -m "test(audit): four probes approved in the raised-pressure round's round 1 (row 13)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Verify end to end, then document

**Files:**
- Modify: `CLAUDE.md`, `docs/superpowers/specs/2026-11-05-raised-pressure-design.md` (status), this plan (status),
  `/Users/jaydenwearne/Desktop/Personal/Claude Code/Projects/NeuroLocaliser/Code/.claude/launch.json` (a preview entry)

- [ ] **Step 1: The suites and the audit, from clean**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test && npm run test:audit`
Expected: 87 suites / 7413 assertions green; then the audit as in Task 5, Step 2 (the audit exits 1 by design: 9 failing).

- [ ] **Step 2: Re-measure the samples and the cards against the spec**

In the prototype folder (`…/pressure-prototype/`, whose `run.mjs` already points at this worktree, and whose
`out/inputs.json`, `out/base.pics.json` and `out/base.psample.json` are the frozen `4d781bd` baselines), run with that
folder as the working directory:

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"
node run.mjs impl
node pictures.mjs impl && node picdiff.mjs base impl 40
node psample.mjs impl && node psdiff.mjs base impl 30
node card.mjs impl cards.json > out/impl.cards.txt && node carddiff.mjs out/REC2.cards.txt out/impl.cards.txt
```

(`impl` names no flag, so `run.mjs` copies the branch as it is.) Expected, as the spec's §5 and §6:
- safety sample: claims 9,191 → 9,188, 0 new; 14 covers change places, none in size;
- pressure sample: pairs + papilloedema 9,191 → 9,107, 0 new; site pictures + coma 359 → 351; single findings + coma 376 → 366;
- cards: `(unchanged: 41)` against the prototype's capture.

- [ ] **Step 3: Drive the app**

Add to `Code/.claude/launch.json` (beside the plexus entry):

```json
    {
      "name": "NeuroLocaliser pressure worktree",
      "runtimeExecutable": "/usr/bin/env",
      "runtimeArgs": ["PORT=8142", "/Users/jaydenwearne/.local/node-v24.18.0-darwin-arm64/bin/node", "neurolocaliser-pressure/app/serve.mjs"],
      "port": 8142
    }
```

Start it with `preview_start {name: "NeuroLocaliser pressure worktree"}`, unlock with the passphrase, and check, reloading
between cases (a hash-only change does not re-run boot):
- **papilloedema alone:** head *Raised intracranial pressure*, the four row-10 lines, the URGENT pill, the red banner, the
  Where list; no Together, Why, What or Next card; at 375 px the strip reads *Urgent · Raised intracranial pressure*.
- **coma + fixed dilated left pupil:** *Left CN III (compressive) — uncal herniation*; the What line leads with uncal
  herniation; the red-flag line is row 11's; the What card shows the reading's red flag, and its *"Most likely:"* line reads
  *Uncal herniation; Posterior communicating artery aneurysm* (its category groups keep their fixed order, vascular first).
- **bilateral VI + papilloedema + right hemiparesis:** the row-9 sentence on the answer card and under *False-localising:* in
  the Where card; "12 other places also fit" (the count leaves the palsies out).
- **bilateral VI + papilloedema:** *Bilateral VI — cisternal segment*, with the banner.
- No console errors (`read_console_messages`).

- [ ] **Step 4: Document**

- `CLAUDE.md`: a section *"Raised-pressure round (DONE 2026-11-05, round 1) — ✅ owner-approved rulings (every row)"* after the
  content-gap section, in its shape: the defect; the mechanics (the bilateral VI site; `PRESSURE_REACHES`; the false-localising
  overturn and its four conditions; the pressure-only card; READINGS of a primitive site and their gate); the traps (an
  ungated reading takes the awake Weber picture; a consciousness-only gate lets coma + a weak arm read a compressed III and
  lets the reading take covers; the cover ignores the compartment filter, O2; the IV deferral); the measured numbers; the
  spec/plan paths. Update the status counts (87 suites / 7413), the clinical-audit paragraph in *Commands* (+4 probes by the
  raised-pressure round, 2026-11-05; after it 108 / 115), and the *Layers* entries for `compartments.js` (`PRESSURE_REACHES`,
  `FALSE_LOCALISING_SIGNS`) and `sites.js` (`READINGS`).
- The anatomy sheet (`docs/artifacts/anatomy-model.html`): **no change** — no structure is added (spec row 14).
- The spec: status line → *IMPLEMENTED (date) on `fix/raised-pressure` (commits)*, with the measured numbers.
- This plan: status line → *IMPLEMENTED*, with the commit range.

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md docs/superpowers/specs/2026-11-05-raised-pressure-design.md docs/superpowers/plans/2026-11-05-raised-pressure.md
git commit -m "docs: the raised-pressure round — rulings applied, measured, browser-checked

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

(`Code/.claude/launch.json` is outside the repository and is not committed.)

# Guillain-Mollaret triangle — Implementation Plan

> **For agentic workers:** use superpowers:executing-plans / subagent-driven-development. Checkbox steps.

**Goal:** Make palatal / oculopalatal tremor emerge — isolated → the broad Guillain-Mollaret triangle;
palatal tremor + rubral tremor → the red-nucleus corner; palatal tremor + cerebellar signs → the dentate
corner. Superset/subset parsimony; no new solver mechanism; all sites dedicated/composer-built (zero
pollution). One test suite. Full spec: `docs/superpowers/specs/2026-07-19-guillain-mollaret-triangle-design.md`.

## Global Constraints
- Runtime prefix: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" <cmd>`. Not a git repo (no commits).
- 2 findings `palatal_tremor`, `nystagmus_pendular`: `@none` (NON_LATERALISED), LOCALISING.
- All GM sites composer-built; `gm_rubral` reuses the existing `red_nucleus` structure by reference.
- TDD red-first; all prior suites green (989 assertions / 24 suites now).

---

### Task 1: Findings, structures, sites, phonebook, test (single vertical slice)

**Files:** `src/model/findings.js`, `src/engine/score.js`, `src/model/structures.js`, `src/model/sites.js`,
`src/engine/inverse.js`, `src/data/syndromes.js`, `test/guillain-mollaret.test.js`, `package.json`, `README.md`.

- [ ] **Step 1 — failing test** `test/guillain-mollaret.test.js`:

```javascript
// guillain-mollaret.test.js — the dentato-rubro-olivary loop. palatal_tremor is SHARED: isolated ->
// broad triangle (HOD); + rubral tremor -> red-nucleus corner; + cerebellar signs -> dentate corner.
// Run: node test/guillain-mollaret.test.js
import { CROSSES, NON_LATERALISED, isFinding } from "../src/model/findings.js";
import { LOCALISING } from "../src/engine/score.js";
import { composeGuillainMollaretSites } from "../src/model/sites.js";
import { expectedFindings } from "../src/engine/forward.js";
import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0; const log = [];
function ok(l, c) { log.push({ l, ok: !!c }); c ? pass++ : fail++; }

for (const id of ["palatal_tremor", "nystagmus_pendular"]) {
  ok(`${id} exists`, isFinding(id));
  ok(`${id} @none`, NON_LATERALISED.has(id));
  ok(`${id} CROSSES false`, CROSSES[id] === false);
  ok(`${id} LOCALISING`, LOCALISING.has(id));
}

const GM = Object.fromEntries(composeGuillainMollaretSites().map(s => [s.id, s]));
ok("triangle site exists", !!GM.guillain_mollaret_triangle);
ok("rubral corner exists", !!GM.gm_rubral_left);
ok("dentate corner exists", !!GM.gm_dentate_left);

// Forward
{
  const tri = expectedFindings(GM.guillain_mollaret_triangle);
  ok("triangle -> palatal_tremor@none + nystagmus_pendular@none",
     tri.has("palatal_tremor@none") && tri.has("nystagmus_pendular@none"));
  const rub = expectedFindings(GM.gm_rubral_left);
  ok("gm_rubral_left -> tremor_rubral@right (contra) + palatal_tremor@none",
     rub.has("tremor_rubral@right") && rub.has("palatal_tremor@none"));
  const den = expectedFindings(GM.gm_dentate_left);
  ok("gm_dentate_left -> dysmetria@left (ipsi) + palatal_tremor@none",
     den.has("dysmetria@left") && den.has("palatal_tremor@none"));
}

// Emergence
{
  const { best } = solve(new Set(["palatal_tremor@none"]));
  ok("isolated palatal -> triangle (broad default)", best && best.site.id === "guillain_mollaret_triangle");
  ok("triangle names Guillain-Mollaret / palatal", best && /guillain|mollaret|palatal/i.test(nameForSite(best.site).name));
}
{
  const { best } = solve(new Set(["palatal_tremor@none", "nystagmus_pendular@none"]));
  ok("oculopalatal -> triangle", best && best.site.id === "guillain_mollaret_triangle");
}
{
  const { best } = solve(new Set(["palatal_tremor@none", "tremor_rubral@right"]));
  ok("palatal + rubral -> gm_rubral_left (rubral corner)", best && best.site.id === "gm_rubral_left");
  ok("rubral corner names rubral", best && /rubral|red[- ]?nucleus/i.test(nameForSite(best.site).name));
}
{
  const { best } = solve(new Set(["palatal_tremor@none", "dysmetria@left"]));
  ok("palatal + cerebellar -> gm_dentate_left (dentate corner)", best && best.site.id === "gm_dentate_left");
  ok("dentate corner names dentate/cerebellar", best && /dentate|cerebell/i.test(nameForSite(best.site).name));
}

console.log("====================================================");
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.l}`);
console.log("====================================================");
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2 — run red:** `node test/guillain-mollaret.test.js` → FAIL (findings/composer missing).
- [ ] **Step 3 — findings** (`src/model/findings.js`): add `palatal_tremor` + `nystagmus_pendular` to
  `FINDINGS`; add both to `CROSSES` (`false`) near the nystagmus block; add both to `NON_LATERALISED`
  (append `nystagmus_pendular` to the nystagmus line, `palatal_tremor` too).
- [ ] **Step 4 — LOCALISING** (`src/engine/score.js`): add `palatal_tremor` and `nystagmus_pendular`
  (put the latter on the nystagmus-taxonomy line).
- [ ] **Step 5 — structures** (`src/model/structures.js`, new block, e.g. after the trochlear block):
```javascript
  // ---- GUILLAIN-MOLLARET TRIANGLE (dentato-rubro-olivary; composer-only level) ----
  { id: "inferior_olive", level: "guillain_mollaret", part: "triangle", produces: "palatal_tremor",
    note: "inferior olive — hypertrophic olivary degeneration effector / MRI hallmark" },
  { id: "central_tegmental_tract", level: "guillain_mollaret", part: "triangle", produces: "palatal_tremor",
    note: "central tegmental tract — the commonest lesion (rubro-olivary limb)" },
  { id: "gm_pendular", level: "guillain_mollaret", part: "triangle", produces: "nystagmus_pendular",
    note: "oculopalatal tremor — pendular nystagmus from HOD" },
  { id: "gm_dentate_dysmetria", level: "guillain_mollaret", part: "dentate", produces: "dysmetria", crosses: false,
    note: "dentate nucleus — appendicular cerebellar output; the dentate corner's disambiguating sign" },
```
- [ ] **Step 6 — TERRITORY + composer** (`src/model/sites.js`): add TERRITORY keys
  `guillain_mollaret|triangle`, `|rubral`, `|dentate`; add `composeGuillainMollaretSites()` exactly as in
  the spec (after an existing composer).
- [ ] **Step 7 — register** (`src/engine/inverse.js`): import + append
  `...composeGuillainMollaretSites()` to `candidateSites()`.
- [ ] **Step 8 — phonebook** (`src/data/syndromes.js`): add the three entries keyed
  `guillain_mollaret_triangle`, `guillain_mollaret_rubral`, `guillain_mollaret_dentate` (names/notes per spec).
- [ ] **Step 9 — register suite:** `package.json` append ` && node test/guillain-mollaret.test.js`;
  `README.md` add the suite line.
- [ ] **Step 10 — run green:** `node test/guillain-mollaret.test.js` → PASS.
- [ ] **Step 11 — full suite:** `npm test` → all `0 failed`. Watch the isolated-`tremor_rubral` /
  Benedikt / cerebellar-hemisphere regression note. If anything shifts, STOP and surface it.

### Task 2: Docs of record
- [ ] README Status paragraph; CONTRIBUTING changelog entry; memory (header count + increment bullet).
- [ ] Final `npm test`; record aggregate.

## Self-Review
Spec coverage: 2 findings + CROSSES/NON_LAT/LOCALISING ✓; 4 structures ✓; composer 3-site family + register
✓; phonebook 3 ✓; emergence (isolated→triangle, oculopalatal→triangle, +rubral→rubral, +cerebellar→dentate,
forward crossings) ✓; suite registered ✓; regression watch ✓. No placeholders. Names consistent
(`composeGuillainMollaretSites`, ids `guillain_mollaret_triangle`/`gm_rubral_*`/`gm_dentate_*`, structures
`inferior_olive`/`central_tegmental_tract`/`gm_pendular`/`gm_dentate_dysmetria`; `red_nucleus` reused exists).

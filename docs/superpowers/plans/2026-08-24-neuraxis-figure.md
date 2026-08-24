# Neuraxis Diagram — Increment 1: the figure and the candidates

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat level-list diagram with a coronal anatomical figure driven by the candidate
sites from `solve()`, so every case renders a picture — including the eight shipped examples that render
nothing today.

**Architecture:** A hand-authored half-figure in a new content-only module (`app/neuraxis-figure.js`) is
mirrored about the midline; a rewritten logic-only `app/neuraxis-diagram.js` derives pins, clustering, a
tract overlay, a viewBox crop and a numbered index from engine output. Both stay pure string-in /
string-out and DOM-free, so both are testable in node.

**Tech Stack:** Zero-dependency ES modules, no build step, no test framework. Each suite is a standalone
script asserting with a local `ok(label, cond)` helper and exiting non-zero on failure.

## Global Constraints

- **Run tests with:** `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test` — there is no
  system node. Never re-diagnose "node not found".
- **Zero dependencies.** No `npm install`, no new packages, no build step.
- **`neuraxisSVG` and `neuraxisIndex` must stay pure and DOM-free** — no `document`, no `window`, no
  `location`. Interaction lives in `app/app.js`.
- **`app/neuraxis-figure.js` is CONTENT ONLY** — it must not import from `src/engine/` or `src/model/`.
- **No engine or model change in this increment.** `src/` is not touched at all.
- **Terracotta (`--terra`) is identity or THE answer, nothing else.** `test/brand.test.js` enforces an
  allowlist. Only the selected pin and selected index row may use it, and both must be added to
  `TERRA_ALLOWED`. A hover state, a focus ring, or a tract colour must NOT use it.
- **No inline accent colour in JS.** `test/contrast.test.js` fails any `app/*.js` painting text with the
  accent inline. Use classes.
- **The palette has exactly four blocks.** `test/brand.test.js` counts them. Add new tokens *inside* the
  existing four; never add a fifth block.
- **Anatomy strokes use `var(--muted)` at reduced opacity, never `var(--line)`** — `--line` is `#26364d`
  in dark and is invisible.
- **Every new suite is added to the `test` script in `package.json`** and to the README chain.
- **The side convention is anatomical: the patient's left is on the LEFT of the page**, and both sides are
  captioned on the figure.

---

## File Structure

| File | Responsibility |
|---|---|
| `app/neuraxis-figure.js` *(create)* | Content only: midline constant, the 36-level `ANCHOR` table, zone derivation, the 13-compartment `CROP` table, the authored half-figure paths, region captions. |
| `app/neuraxis-diagram.js` *(rewrite)* | Logic only: `neuraxisSVG(candidates, tracts, opts)` and `neuraxisIndex(candidates, opts)`. |
| `app/app.js` *(modify)* | Pass `r.display` into the diagram; wire cluster expansion. |
| `app/index.html` *(modify)* | Diagram CSS and the five `--tract-N` tokens in all four palette blocks. |
| `test/neuraxis-figure.test.js` *(create)* | The anchor / zone / side / crop invariants. |
| `test/neuraxis-diagram.test.js` *(rewrite)* | Rendering contracts. |
| `test/brand.test.js`, `test/contrast.test.js` *(modify)* | Allowlist and NOT_TEXT entries. |
| `package.json` *(modify)* | Add the new suite to the `test` chain. |

**Data shapes, measured — do not re-derive:**

- A candidate entry from `solve().display` is `{ site, exp, explained, over, n, prevalence }`.
- `site` is `{ id, level, part, side, ... }`; `side` ∈ `left` | `right` | `bilateral` | `midline`.
- `candidateSites()` yields **377 sites across 36 levels and 192 part names**; **13 compartments**;
  side counts **left 166, right 166, bilateral 27, midline 18**.
- A tract entry from `tractsFor()` is `{ tract, findingsMatched, sides, sites, decussation }`.
  `tract.course` is `[{ level, detail, supply }]`. `decussation` is `{}`, `{between:[a,b], label}`, or
  `{inLevel, label}`.

---

### Task 1: The anchor table, zone derivation and side placement

**Files:**
- Create: `app/neuraxis-figure.js`
- Create: `test/neuraxis-figure.test.js`
- Modify: `package.json` (test chain)

**Interfaces:**
- Consumes: nothing.
- Produces: `MX` (number, 380), `FIG_W` (760), `FIG_H` (660), `ANCHOR` (object, level → `[dx, y]`),
  `zoneOf(part) -> string|null`, `anchorFor(level, part, side) -> {x, y, zone}`.

- [ ] **Step 1: Write the failing test**

Create `test/neuraxis-figure.test.js`:

```js
// neuraxis-figure.test.js — the authored figure is CONTENT; these assert the RULES that keep it complete,
// not the coordinate values. A new site must never be able to land undetermined.
import { MX, ANCHOR, zoneOf, anchorFor } from "../app/neuraxis-figure.js";
import { candidateSites } from "../src/engine/inverse.js";

let pass = 0, fail = 0;
const ok = (l, c, extra = "") => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l + (c ? "" : "  " + extra)); };

const sites = candidateSites();

// ---- 1. every level the diagram can receive has an anchor ----
// Keyed to candidateSites(), NOT SITES: the composers add 18 levels on top of the model's 18.
const levels = [...new Set(sites.map(s => s.level))];
const missing = levels.filter(l => !ANCHOR[l]);
ok(`every candidateSites() level has an anchor (${levels.length} levels)`, missing.length === 0, missing.join(", "));
ok("no anchor is orphaned (every ANCHOR key is a real level)",
   Object.keys(ANCHOR).every(k => levels.includes(k)),
   Object.keys(ANCHOR).filter(k => !levels.includes(k)).join(", "));

// ---- 2. zone is DERIVED, never authored, and only where the part name declares one ----
const ZONE_WORDS = ["anterior", "posterior", "lateral", "medial", "central"];
ok("zoneOf returns null for a part that declares no zone", zoneOf("corona_radiata") === null);
ok("zoneOf reads a bare zone name", zoneOf("lateral") === "lateral" && zoneOf("medial") === "medial");
ok("zoneOf reads basis_pontis as ventral-equivalent (anterior)", zoneOf("basis_pontis") === "anterior");
ok("zoneOf reads a compound name", zoneOf("watershed_anterior") === "anterior" && zoneOf("anterior_horn") === "anterior");
const zoned = [...new Set(sites.map(s => s.part))].filter(p => zoneOf(p) !== null);
ok(`exactly the zone-declaring parts resolve (${zoned.length} of 192)`, zoned.length === 15, zoned.sort().join(", "));
ok("every resolved zone is one of the five zone words",
   zoned.every(p => ZONE_WORDS.includes(zoneOf(p))));

// ---- 3. all FOUR side values place a pin; bilateral/midline sit on the midline ----
for (const side of ["left", "right", "bilateral", "midline"]) {
  const s = sites.find(x => x.side === side);
  ok(`side "${side}" is represented in candidateSites()`, !!s);
  const a = anchorFor(s.level, s.part, s.side);
  ok(`side "${side}" yields finite coordinates`, Number.isFinite(a.x) && Number.isFinite(a.y));
}
const cordL = anchorFor("cord", "hemi", "left"), cordR = anchorFor("cord", "hemi", "right");
ok("patient's LEFT is left of the midline (anatomical convention)", cordL.x < MX);
ok("patient's RIGHT is right of the midline", cordR.x > MX);
ok("left and right mirror about the midline", Math.abs((MX - cordL.x) - (cordR.x - MX)) < 0.001);
ok("midline sits ON the midline", anchorFor("cord", "hemi", "midline").x === MX);
ok("bilateral sits ON the midline", anchorFor("cord", "hemi", "bilateral").x === MX);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/neuraxis-figure.test.js`
Expected: FAIL — `Cannot find module '.../app/neuraxis-figure.js'`

- [ ] **Step 3: Write minimal implementation**

Create `app/neuraxis-figure.js`:

```js
// neuraxis-figure.js — CONTENT ONLY for the neuraxis drawing: the midline, where each level sits, how a
// part name nudges a pin within its level, and the authored half-figure itself.
//
// It imports NOTHING from src/. That split is deliberate and matches src/data/multifocal.js against
// src/engine/multifocal.js: the anatomy can be reviewed as anatomy without reading UI code.
//
// COORDINATES, NOT CLAIMS. These are drawing positions in a schematic. Where a tract RUNS, and what sits
// beside it in cross-section, is increment 2 and carries a clinical review gate.

export const MX = 380;                 // midline x — the figure is symmetric about this
export const FIG_W = 760, FIG_H = 660;

// ---- ANCHOR: level -> [dx from the midline, y]. 36 keys. ----
// KEYED BY LEVEL, NEVER BY PART. Level ids are globally unique, so there is no level|part collision here
// — unlike PART_LABEL / vascular.js / topography.js, where `lateral` and `medial` are reused across levels.
//
// It must cover candidateSites(), NOT SITES: SITES has 18 levels, but the composers (composeHemiLevelSites,
// composeBilateralCordSites, composeCaudaConusSites) add 18 more, and the diagram receives all of them.
export const ANCHOR = {
  // brain
  cerebrum: [130, 76], cortex: [112, 92], basal_ganglia: [80, 152], corpus_callosum: [30, 140],
  subcortex: [74, 168], thalamus: [46, 186], aphasia_subcortical: [52, 196], thalamus_arousal: [40, 202],
  hypothalamus: [26, 208], olfactory: [34, 222],
  // brainstem
  dorsal_midbrain: [14, 226], midbrain: [20, 240], guillain_mollaret: [46, 252],
  brainstem_aras: [12, 268], pontomesencephalic: [18, 258], pseudobulbar: [34, 276],
  pons: [28, 296], locked_in: [10, 302], central_vestibular: [30, 344], medulla: [20, 362],
  craniocervical_junction: [16, 388],
  // cerebellum
  cerebellum: [66, 306],
  // cord and below
  cord: [15, 470], combined_degeneration: [15, 500], conus: [13, 552], cauda: [22, 582],
  // visual, pupil, sympathetic, skull base
  visual_pathway: [44, 186], pupil: [162, 222], sympathetic: [100, 404],
  skull_base: [152, 228], peripheral_vestibular: [128, 262],
  // peripheral
  root: [46, 486], plexus: [92, 512], nerve: [126, 566], polyneuropathy: [150, 606],
  motor_unit: [160, 626],
};

// ---- ZONE: derived from the part name, never authored. ----
// MEASURED: only 15 of the 192 part names in candidateSites() declare a zone. An authored override for the
// other 177 would be a full anatomical table needing clinical review — so a part that does not declare a
// zone simply gets none, and its pin sits at its level's anchor.
//
// The 15 that DO declare one are exactly the cross-sectional brainstem and cord names where the
// distinction is clinically load-bearing: lateral vs medial medulla is Wallenberg vs a medial medullary
// syndrome.
const ZONE_RE = /(^|_)(anterior|posterior|lateral|medial|central)($|_)/;

export function zoneOf(part) {
  if (typeof part !== "string") return null;
  if (part === "basis_pontis") return "anterior";   // the basis IS the ventral pons
  const m = ZONE_RE.exec(part);
  return m ? m[2] : null;
}

// How far a zone nudges a pin within its level's shape: [dx outward, dy].
// `anterior` is ventral (drawn toward the viewer's top of the stem), `posterior` dorsal.
const ZONE_NUDGE = {
  lateral:   [14, 0], medial: [-6, 0], central: [0, 0],
  anterior:  [0, 7],  posterior: [0, -7],
};

// ---- anchorFor: the one function that turns a site into a point. ----
// SIDE HANDLING. bilateral (27 candidates) and midline (18) both sit ON the midline; a bilateral pin is
// distinguished from a midline one by its FORM in the renderer, never by position or hue — one candidate
// is always exactly one pin, so the index numbering stays unambiguous.
export function anchorFor(level, part, side) {
  const a = ANCHOR[level] || [60, 330];
  const zone = zoneOf(part);
  const n = (zone && ZONE_NUDGE[zone]) || [0, 0];
  if (side === "midline" || side === "bilateral") return { x: MX, y: a[1] + n[1], zone };
  const sign = side === "right" ? 1 : -1;            // anatomical: patient's left on the LEFT of the page
  return { x: MX + sign * (a[0] + n[0]), y: a[1] + n[1], zone };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/neuraxis-figure.test.js`
Expected: PASS on every line, `0 failed`.

If "every candidateSites() level has an anchor" fails, the FAIL line prints the missing level ids — add
each to `ANCHOR` with a coordinate consistent with its neighbours. Do not change the assertion.

- [ ] **Step 5: Add the suite to the test chain**

In `package.json`, in the `test` script, insert immediately before `node test/neuraxis-diagram.test.js`:

```
node test/neuraxis-figure.test.js &&
```

- [ ] **Step 6: Run the full suite**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: exit 0, no `FAIL` lines.

- [ ] **Step 7: Commit**

```bash
git add app/neuraxis-figure.js test/neuraxis-figure.test.js package.json
git commit -m "feat: anchor table and zone derivation for the neuraxis figure

Keyed to candidateSites() (36 levels), not SITES (18) — the composers
add 18 more and the diagram receives all of them. Zone is derived from
the part name and null where the name declares none: only 15 of 192
parts declare one, so an override table would assert anatomy. bilateral
and midline candidates pin on the midline, one pin per candidate."
```

---

### Task 2: Crop boxes per compartment

**Files:**
- Modify: `app/neuraxis-figure.js`
- Modify: `test/neuraxis-figure.test.js`

**Interfaces:**
- Consumes: `MX`, `FIG_W`, `FIG_H`, `ANCHOR` from Task 1.
- Produces: `CROP` (object, compartment → `[x, y, w, h]`), `cropFor(compartments) -> [x, y, w, h]`.

- [ ] **Step 1: Write the failing test**

Append to `test/neuraxis-figure.test.js`, immediately before the final `console.log`:

```js
// ---- 4. crop boxes: one per compartment, and a union that always lands inside the figure ----
import { CROP, cropFor, FIG_W, FIG_H } from "../app/neuraxis-figure.js";
import { compartmentOf } from "../src/model/compartments.js";

const comps = [...new Set(sites.map(s => compartmentOf(s)))];
const missingC = comps.filter(c => !CROP[c]);
ok(`every compartment has a crop box (${comps.length} compartments)`, missingC.length === 0, missingC.join(", "));

const whole = cropFor(comps);
const inside = (b, o) => b[0] >= o[0] && b[1] >= o[1] && b[0] + b[2] <= o[0] + o[2] && b[1] + b[3] <= o[1] + o[3];
ok("the union crop contains every compartment's box", comps.every(c => inside(CROP[c], whole)));
ok("the union crop is larger than any single box", comps.every(c => CROP[c][2] * CROP[c][3] <= whole[2] * whole[3]));
ok("the union crop stays inside the figure",
   whole[0] >= 0 && whole[1] >= 0 && whole[0] + whole[2] <= FIG_W && whole[1] + whole[3] <= FIG_H);

const periph = cropFor(["root", "plexus", "nerve"]);
ok("a peripheral crop excludes the cerebrum", periph[1] > ANCHOR.cortex[1]);
ok("a peripheral crop is smaller than the whole figure", periph[3] < whole[3]);

for (const c of comps) {
  const [x, y, w, h] = CROP[c];
  ok(`crop "${c}" is inside the figure and non-empty`,
     w > 0 && h > 0 && x >= 0 && y >= 0 && x + w <= FIG_W && y + h <= FIG_H, `${x},${y},${w},${h}`);
  const a = ANCHOR[sites.find(s => compartmentOf(s) === c).level];
  ok(`crop "${c}" contains its own anchor`, a[1] >= y && a[1] <= y + h);
}
```

Move the two new `import` lines to the top of the file with the others — ES module imports are hoisted, but
keeping them together is the house style.

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/neuraxis-figure.test.js`
Expected: FAIL — `CROP` and `cropFor` are not exported.

- [ ] **Step 3: Write minimal implementation**

Append to `app/neuraxis-figure.js`:

```js
// ---- CROP: compartment -> [x, y, w, h] in figure coordinates. 13 keys. ----
// KEYED BY COMPARTMENT, NOT BY LEVEL, so a crop always contains whole anatomical structures rather than
// slicing a shape in half. compartmentOf() is part-aware, which is why the optic pathway can share the
// `skull_base` LEVEL yet crop separately.
export const CROP = {
  brain:       [ 96,  20, 568, 220],
  brainstem:   [232, 196, 296, 220],
  cerebellum:  [232, 250, 296, 130],
  cord:        [268, 380, 224, 200],
  cauda:       [280, 520, 200, 120],
  root:        [268, 420, 224, 160],
  plexus:      [212, 450, 336, 140],
  nerve:       [180, 500, 400, 150],
  motor_unit:  [160, 560, 440, 100],
  skull_base:  [140, 170, 480, 140],
  sympathetic: [212, 340, 336, 160],
  optic:       [140,  20, 480, 240],
  pupil:       [140, 160, 480, 130],
};

const PAD = 16;

// The union of the crop boxes of whatever compartments are in play, padded and clamped to the figure.
// ZOOM IS A DERIVED viewBox CROP over ONE authored drawing — there is no second figure and no detail
// level, so a crop can never disagree with the figure it crops.
export function cropFor(compartments) {
  const boxes = (compartments || []).map(c => CROP[c]).filter(Boolean);
  if (!boxes.length) return [0, 0, FIG_W, FIG_H];
  const x0 = Math.min(...boxes.map(b => b[0])), y0 = Math.min(...boxes.map(b => b[1]));
  const x1 = Math.max(...boxes.map(b => b[0] + b[2])), y1 = Math.max(...boxes.map(b => b[1] + b[3]));
  const x = Math.max(0, x0 - PAD), y = Math.max(0, y0 - PAD);
  return [x, y, Math.min(FIG_W - x, x1 - x0 + PAD * 2), Math.min(FIG_H - y, y1 - y0 + PAD * 2)];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/neuraxis-figure.test.js`
Expected: PASS, `0 failed`.

- [ ] **Step 5: Commit**

```bash
git add app/neuraxis-figure.js test/neuraxis-figure.test.js
git commit -m "feat: per-compartment crop boxes and a derived union crop

Keyed by compartment rather than level so a crop always contains whole
anatomical structures instead of slicing a shape in half."
```

---

### Task 3: The authored half-figure

**Files:**
- Modify: `app/neuraxis-figure.js`
- Modify: `test/neuraxis-figure.test.js`

**Interfaces:**
- Consumes: `MX` from Task 1.
- Produces: `baseFigure() -> string` (SVG fragment), `regionCaptions() -> string`, `SIDE_CAPTIONS -> string`.

- [ ] **Step 1: Write the failing test**

Append to `test/neuraxis-figure.test.js` before the final `console.log`:

```js
// ---- 5. the base figure ----
import { baseFigure, regionCaptions, SIDE_CAPTIONS } from "../app/neuraxis-figure.js";

const fig = baseFigure();
ok("baseFigure returns an SVG fragment", typeof fig === "string" && fig.includes("<path"));
ok("the figure is authored as one half and MIRRORED (no second copy to drift)",
   (fig.match(/scale\(-1,1\)/g) || []).length === 1);
ok("anatomy strokes never use --line (invisible in dark; must be --muted)",
   !/stroke:\s*var\(--line\)/.test(fig));
ok("the figure paints no accent inline", !/--terra/.test(fig));
ok("side captions name the patient's sides explicitly",
   /left/i.test(SIDE_CAPTIONS) && /right/i.test(SIDE_CAPTIONS));
ok("region captions are present", regionCaptions().includes("<text"));
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/neuraxis-figure.test.js`
Expected: FAIL — `baseFigure` is not exported.

- [ ] **Step 3: Write minimal implementation**

Append to `app/neuraxis-figure.js`:

```js
// ---- the drawing itself ----
// AUTHORED AS ONE HALF AND MIRRORED. Symmetry holds by construction and there is no second copy of the
// anatomy to drift out of step — the same reasoning as markSVG() in brand.js drawing one geometry twice.
// Classes only; no inline colour (test/contrast.test.js fails inline accent in app/*.js).
const HALF = `
  <path class="an-brain" d="M380 46 C458 46 528 86 536 152 C542 200 514 228 470 228 L380 228 Z"/>
  <path class="an-line" d="M470 120 C494 132 502 156 496 178"/>
  <path class="an-line" d="M446 150 L430 176 L448 200"/>
  <ellipse class="an-deep" cx="416" cy="186" rx="20" ry="13"/>
  <ellipse class="an-deep" cx="452" cy="152" rx="16" ry="11"/>
  <path class="an-stem" d="M380 228 L410 228 L410 264 L424 276 L424 318 L406 332 L406 396 L380 396 Z"/>
  <ellipse class="an-cbm" cx="466" cy="306" rx="54" ry="42"/>
  <path class="an-folia" d="M424 288 C444 296 462 300 500 298 M424 306 C446 314 466 318 508 316 M428 324 C450 332 470 336 502 334"/>
  <path class="an-cord" d="M380 396 L398 396 L398 556 L380 566 Z"/>
  <path class="an-plate" d="M380 224 L566 224"/>
  <g class="an-roots">
    <path d="M398 430 L432 442"/><path d="M398 458 L432 470"/><path d="M398 486 L436 498"/>
    <path d="M398 514 L432 526"/><path d="M398 540 L428 552"/>
  </g>
  <path class="an-plexus" d="M436 470 L470 486 L508 494 M436 498 L474 494 L508 494 M436 442 L472 470 L508 494"/>
  <path class="an-nerve" d="M508 494 L534 548 L546 606 L552 640"/>
  <path class="an-symp" d="M406 366 C438 380 456 396 458 424 C460 452 438 466 424 470"/>
  <circle class="an-gang" cx="458" cy="424" r="5"/>
  <path class="an-symp" d="M458 424 C486 400 508 340 512 262 C514 240 520 230 532 226"/>
  <circle class="an-eye" cx="542" cy="222" r="13"/>
  <circle class="an-pupil" cx="542" cy="222" r="4.5"/>
  <path class="an-optic" d="M530 216 C494 200 452 176 424 186"/>
`;

export const baseFigure = () =>
  `<g class="anatomy">${HALF}<g transform="translate(${MX * 2},0) scale(-1,1)">${HALF}</g>`
  + `<path class="an-optic" d="M424 186 L336 186"/><circle class="an-chiasm" cx="${MX}" cy="186" r="6"/>`
  + `<line class="an-mid" x1="${MX}" y1="34" x2="${MX}" y2="640"/></g>`;

// Captioned explicitly because the convention is ANATOMICAL (patient's left on the left), which is the
// opposite of a scan — a reader with imaging on the next screen must not have to guess.
export const SIDE_CAPTIONS =
  `<text class="nx-side" x="${MX - 250}" y="22" text-anchor="middle">patient's left</text>`
  + `<text class="nx-side" x="${MX + 250}" y="22" text-anchor="middle">patient's right</text>`;

const REGIONS = [
  [0, 84, "cerebrum"], [0, 244, "midbrain"], [0, 300, "pons"], [0, 366, "medulla"],
  [96, 306, "cerebellum"], [0, 474, "cord"], [176, 224, "skull base"],
  [124, 408, "sympathetic chain"], [0, 178, "chiasm"], [150, 570, "peripheral nerve"],
];

export const regionCaptions = () => REGIONS.map(([dx, y, t]) =>
  `<text class="nx-region" x="${MX + (dx ? dx + 30 : 0)}" y="${y}" text-anchor="${dx ? "start" : "middle"}">${t}</text>`
).join("");
```

- [ ] **Step 4: Run test to verify it passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/neuraxis-figure.test.js`
Expected: PASS, `0 failed`.

- [ ] **Step 5: Commit**

```bash
git add app/neuraxis-figure.js test/neuraxis-figure.test.js
git commit -m "feat: the authored coronal half-figure, mirrored about the midline

One half authored and mirrored, so symmetry holds by construction and
there is no second copy of the anatomy to drift."
```

---

### Task 4: `neuraxisSVG` — pins, slots and clustering

**Files:**
- Rewrite: `app/neuraxis-diagram.js`
- Rewrite: `test/neuraxis-diagram.test.js`

**Interfaces:**
- Consumes: `MX`, `FIG_W`, `FIG_H`, `anchorFor`, `baseFigure`, `regionCaptions`, `SIDE_CAPTIONS`,
  `cropFor` from Tasks 1–3; `compartmentOf` from `src/model/compartments.js`.
- Produces: `neuraxisSVG(candidates, tracts, opts) -> string`. `candidates` is `solve().display`;
  `tracts` is `tractsFor()` output or `[]`; `opts` is `{ selectedId, labelFor }`.

- [ ] **Step 1: Write the failing test**

Replace `test/neuraxis-diagram.test.js` entirely:

```js
// neuraxis-diagram.test.js — the builder is a pure string function (DOM-free, testable in node).
import { neuraxisSVG } from "../app/neuraxis-diagram.js";
import { tractsFor } from "../src/engine/tracts.js";
import { solve } from "../src/engine/inverse.js";
import { MX } from "../app/neuraxis-figure.js";

let pass = 0, fail = 0;
const ok = (l, c, extra = "") => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l + (c ? "" : "  " + extra)); };

const build = toks => {
  const obs = new Set(toks);
  const r = solve(obs, {});
  return { r, tf: tractsFor(obs, {}), cands: r.display };
};

const hemi = build(["weak_arm@left", "weak_leg@left"]);
const svg = neuraxisSVG(hemi.cands, hemi.tf, { selectedId: hemi.cands[0].site.id, labelFor: s => s.id });

ok("returns an <svg>", typeof svg === "string" && svg.trim().startsWith("<svg") && svg.includes("</svg>"));
ok("every candidate carries a data-k handle", hemi.cands.every(c => svg.includes(`data-k="${c.site.id}"`)));
ok("the selected candidate is marked",
   /data-sel="1"/.test(svg) && new RegExp(`data-sel="1" data-k="${hemi.cands[0].site.id}"`).test(svg));
ok("empty input yields empty string", neuraxisSVG([], [], {}) === "");

// ---- THE DEFECT THIS INCREMENT EXISTS TO FIX ----
// Foot drop and Cauda equina implicate NO long tract, so the old tract-driven diagram rendered "".
for (const [name, toks] of [
  ["foot drop", ["weak_ankle_dorsiflexion@left", "weak_great_toe_extension@left", "weak_foot_eversion@left"]],
  ["cauda equina", ["saddle_anaesthesia@midline", "sphincter_dysfunction@midline", "radicular_pain@midline", "anal_wink_loss@midline"]],
]) {
  const c = build(toks);
  ok(`${name} implicates no tract (the precondition of the bug)`, c.tf.length === 0);
  const s = neuraxisSVG(c.cands, c.tf, { labelFor: x => x.id });
  ok(`${name} STILL renders a figure`, s.startsWith("<svg") && s.includes("<path"));
  ok(`${name} pins its candidates`, c.cands.some(x => s.includes(`data-k="${x.site.id}"`)));
}

// ---- laterality: the one fact the old diagram could not express ----
// Read the pin's own recorded centre rather than a geometry attribute: a bilateral pin is a <rect> with
// `x` (a left edge), not a <circle> with `cx`, so keying on cx would silently skip exactly the case the
// midline assertions below exist to check.
const xOf = (s, id) => { const m = new RegExp(`data-k="${id}" data-x="([\\d.]+)"`).exec(s); return m ? +m[1] : null; };
const left = build(["weak_arm@left"]), right = build(["weak_arm@right"]);
const sL = neuraxisSVG(left.cands, left.tf, { labelFor: x => x.id });
const sR = neuraxisSVG(right.cands, right.tf, { labelFor: x => x.id });
const pickL = left.cands.find(c => c.site.side === "right");   // a LEFT-sided finding implicates RIGHT sites
const pickR = right.cands.find(c => c.site.side === "left");
ok("a right-sided site pins right of the midline", pickL && xOf(sL, pickL.site.id) > MX);
ok("a left-sided site pins left of the midline", pickR && xOf(sR, pickR.site.id) < MX);

// ---- clustering: NMOSD is the stress case at 47 candidates ----
const nmo = build(["rapd@left", "va_reduced_no_pinhole@left", "weak_leg@left", "weak_leg@right",
                   "spinothalamic@left", "spinothalamic@right", "babinski@left", "babinski@right"]);
const sN = neuraxisSVG(nmo.cands, nmo.tf, { labelFor: x => x.id });
ok(`NMOSD is a dense case (${nmo.cands.length} candidates)`, nmo.cands.length >= 20);
ok("a dense case clusters rather than overlapping", sN.includes("nx-cluster"));
ok("every candidate is still reachable in the markup",
   nmo.cands.every(c => sN.includes(`data-k="${c.site.id}"`)));

// ---- bilateral and midline each render exactly ONE pin, on the midline ----
const mid = build(["saddle_anaesthesia@midline", "sphincter_dysfunction@midline"]);
const sM = neuraxisSVG(mid.cands, mid.tf, { labelFor: x => x.id });
const midCand = mid.cands.find(c => c.site.side === "midline" || c.site.side === "bilateral");
if (midCand) {
  ok("a midline/bilateral candidate renders exactly one pin",
     (sM.match(new RegExp(`data-k="${midCand.site.id}"`, "g")) || []).length === 1);
  ok("a midline/bilateral candidate sits on the midline", xOf(sM, midCand.site.id) === MX);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/neuraxis-diagram.test.js`
Expected: FAIL — the old `neuraxisSVG(tracts, opts)` signature ignores the new first argument.

- [ ] **Step 3: Write minimal implementation**

Replace `app/neuraxis-diagram.js` entirely:

```js
// neuraxis-diagram.js — LOGIC ONLY. Turns engine output into a coronal anatomical figure. Pure string in →
// string out (no DOM), so it is unit-testable in node; interaction lives in app.js.
//
// DRIVEN BY CANDIDATE SITES, NOT BY TRACTS. The previous version harvested its sites from tractsFor(), so a
// picture with no implicated long tract had no sites and rendered "" — eight of the seventeen shipped
// examples, including Foot drop and Cauda equina. Tracts are now an OVERLAY.
import { MX, FIG_W, FIG_H, anchorFor, baseFigure, regionCaptions, SIDE_CAPTIONS, cropFor } from "./neuraxis-figure.js";
import { compartmentOf } from "../src/model/compartments.js";

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const FAN_MAX = 3;      // above this, a slot collapses to one counted pin
const FAN_STEP = 15;

// One candidate is always exactly ONE pin, so the numbering it shares with the index stays unambiguous.
// A bilateral candidate is told from a midline one by FORM (an elongated capsule), never by hue — the
// rule the danger chip already follows.
function pin(c, x, y, n, sel) {
  const wide = c.site.side === "bilateral";
  const shape = wide
    ? `<rect class="nx-dot" x="${x - 11}" y="${y - 6.5}" width="22" height="13" rx="6.5"/>`
    : `<circle class="nx-dot" cx="${x}" cy="${y}" r="7.5"/>`;
  // data-x records the pin's centre. The two shapes carry different geometry attributes (`cx` vs a left
  // edge `x`), so anything reading position off the shape would mis-handle bilateral pins.
  return `<g class="nx-pin${sel ? " sel" : ""}"${sel ? ' data-sel="1"' : ""} data-k="${esc(c.site.id)}" data-x="${x}">`
    + shape + `<text class="nx-n" x="${x}" y="${y + 3}">${n}</text></g>`;
}

export function neuraxisSVG(candidates, tracts, opts = {}) {
  if (!candidates || !candidates.length) return "";
  const { selectedId = null } = opts;

  // number in solve()'s own order, so pin 1 is the leading candidate and the figure and the Where card
  // agree on which candidate is which. The index shares this numbering — there is no second ordering.
  const items = candidates.map((c, i) => ({ c, n: i + 1, comp: compartmentOf(c.site) }));

  // slot = level | side | zone. Up to FAN_MAX fan in place; above that the slot collapses.
  const slots = new Map();
  for (const it of items) {
    const a = anchorFor(it.c.site.level, it.c.site.part, it.c.site.side);
    it.a = a;
    const key = `${it.c.site.level}|${it.c.site.side}|${a.zone || "-"}`;
    if (!slots.has(key)) slots.set(key, []);
    slots.get(key).push(it);
  }

  let pins = "";
  for (const list of slots.values()) {
    const a = list[0].a;
    const sel = list.find(it => it.c.site.id === selectedId);
    if (list.length <= FAN_MAX) {
      list.forEach((it, j) => {
        const x = a.x + (j - (list.length - 1) / 2) * FAN_STEP * (it.c.site.side === "right" ? 1 : -1);
        pins += pin(it.c, x, a.y, it.n, it.c.site.id === selectedId);
      });
    } else {
      // THE FANNED PINS ARE STILL EMITTED, hidden by a class — app.js toggles `.open` on click, so no
      // interaction logic crosses into this pure builder. The index lists every candidate regardless:
      // a cluster is a drawing decision, never a filter on the differential.
      pins += `<g class="nx-cluster${sel ? " has-sel" : ""}" data-cluster="1">`
        + `<circle class="nx-dot nx-clusterdot" cx="${a.x}" cy="${a.y}" r="10"/>`
        + `<text class="nx-n" x="${a.x}" y="${a.y + 3.5}">${list.length}</text>`
        + `<g class="nx-fan">`
        + list.map((it, j) => {
            const col = j % 3, row = Math.floor(j / 3);
            const x = a.x + (col - 1) * FAN_STEP * (it.c.site.side === "right" ? 1 : -1);
            return pin(it.c, x, a.y + 18 + row * FAN_STEP, it.n, it.c.site.id === selectedId);
          }).join("")
        + `</g></g>`;
    }
  }

  const [vx, vy, vw, vh] = cropFor([...new Set(items.map(it => it.comp))]);
  const zoomed = vw < FIG_W * 0.95 || vh < FIG_H * 0.95;

  return `<svg viewBox="${vx} ${vy} ${vw} ${vh}" class="neuraxis" xmlns="http://www.w3.org/2000/svg"`
    + ` role="img" aria-label="neuraxis figure with candidate lesion sites">`
    + SIDE_CAPTIONS + baseFigure() + regionCaptions() + pins
    + (zoomed ? locator(vx, vy, vw, vh) : "")
    + `</svg>`;
}

// The crop buys detail at the cost of a stable frame. The locator buys the frame back: a whole-neuraxis
// thumbnail with the crop marked, so a peripheral case still says where it sits in the whole thing.
function locator(vx, vy, vw, vh) {
  const S = 0.13, w = FIG_W * S, h = FIG_H * S;
  const x = vx + vw - w - 8, y = vy + 8;
  return `<g class="nx-locator" aria-hidden="true">`
    + `<rect class="nx-loc-bg" x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/>`
    + `<rect class="nx-loc-box" x="${x + vx * S}" y="${y + vy * S}" width="${vw * S}" height="${vh * S}"/>`
    + `</g>`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/neuraxis-diagram.test.js`
Expected: PASS, `0 failed`.

- [ ] **Step 5: Commit**

```bash
git add app/neuraxis-diagram.js test/neuraxis-diagram.test.js
git commit -m "feat: drive the neuraxis figure from candidate sites, not tracts

Fixes the eight shipped examples that rendered no diagram at all: sites
were harvested from tractsFor(), so a picture with no long tract had no
sites. Adds pins at true compartment and side, slot clustering for dense
cases (NMOSD reaches 47 candidates), midline handling for bilateral and
midline sites, and a derived crop with a locator."
```

---

### Task 5: `neuraxisIndex` — numbering and the duplicate-label fix

**Files:**
- Modify: `app/neuraxis-diagram.js`
- Modify: `test/neuraxis-diagram.test.js`

**Interfaces:**
- Consumes: everything from Task 4.
- Produces: `neuraxisIndex(candidates, opts) -> string` (an `<ol class="nx-idx">`). `opts` is
  `{ selectedId, labelFor }`; `labelFor` defaults to `s => s.id`.

- [ ] **Step 1: Write the failing test**

Append to `test/neuraxis-diagram.test.js` before the final `console.log`:

```js
// ---- the index ----
import { neuraxisIndex } from "../app/neuraxis-diagram.js";

const idx = neuraxisIndex(nmo.cands, { selectedId: nmo.cands[0].site.id, labelFor: s => s.id });
ok("the index is an ordered list", idx.startsWith("<ol") && idx.includes("</ol>"));
ok("EVERY candidate appears in the index, including clustered ones",
   nmo.cands.every(c => idx.includes(`data-k="${c.site.id}"`)));
ok("the index numbering matches the figure's (both follow solve() order)",
   nmo.cands.every((c, i) => new RegExp(`data-k="${c.site.id}"[^>]*>\\s*<b>${i + 1}</b>`).test(idx)));

// A row the reader cannot tell apart from the row above it is a defect, not density. MS renders
// "Anterior choroidal artery syndrome" twice because dedup is by site.id (left/right differ) while the
// display name drops the side.
const dup = neuraxisIndex(
  [{ site: { id: "left_x", level: "cord", part: "hemi", side: "left" } },
   { site: { id: "right_x", level: "cord", part: "hemi", side: "right" } }],
  { labelFor: () => "Same Name Syndrome" });
const texts = [...dup.matchAll(/<\/b>([^<]+)</g)].map(m => m[1].trim());
ok("identical display names are disambiguated by side", new Set(texts).size === 2, texts.join(" | "));
ok("disambiguation names the side", texts.some(t => /left/i.test(t)) && texts.some(t => /right/i.test(t)));
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/neuraxis-diagram.test.js`
Expected: FAIL — `neuraxisIndex` is not exported.

- [ ] **Step 3: Write minimal implementation**

Append to `app/neuraxis-diagram.js`:

```js
// The index carries EVERY candidate, whatever the figure collapses into a cluster — nothing is ever
// only-hidden. It is a separate export rather than appended to the SVG string: a function named …SVG must
// return an SVG, and the two are independently testable.
export function neuraxisIndex(candidates, opts = {}) {
  if (!candidates || !candidates.length) return "";
  const { selectedId = null, labelFor = s => s.id } = opts;

  const raw = candidates.map(c => labelFor(c.site));
  const seen = new Map();
  for (const r of raw) seen.set(r, (seen.get(r) || 0) + 1);

  const rows = candidates.map((c, i) => {
    // Two rows the reader cannot tell apart are a defect. plainSiteName() drops the side for some sites,
    // so a left/right pair collapses to one string — append the side where that happens.
    const label = seen.get(raw[i]) > 1 && (c.site.side === "left" || c.site.side === "right")
      ? `${raw[i]} — ${c.site.side}` : raw[i];
    const sel = c.site.id === selectedId;
    return `<li class="nx-row${sel ? " sel" : ""}" data-k="${esc(c.site.id)}"><b>${i + 1}</b>${esc(label)}</li>`;
  }).join("");

  return `<ol class="nx-idx">${rows}</ol>`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/neuraxis-diagram.test.js`
Expected: PASS, `0 failed`.

- [ ] **Step 5: Commit**

```bash
git add app/neuraxis-diagram.js test/neuraxis-diagram.test.js
git commit -m "feat: the numbered candidate index, sharing the figure's numbering

Also fixes duplicate rows: dedup is by site.id but the display name drops
the side, so MS rendered 'Anterior choroidal artery syndrome' twice."
```

---

### Task 6: The tract overlay and legend

**Files:**
- Modify: `app/neuraxis-diagram.js`
- Modify: `test/neuraxis-diagram.test.js`

**Interfaces:**
- Consumes: `ANCHOR` (via `anchorFor`) from Task 1.
- Produces: no new export — `neuraxisSVG` gains the overlay internally.

- [ ] **Step 1: Write the failing test**

Append to `test/neuraxis-diagram.test.js` before the final `console.log`:

```js
// ---- the tract overlay ----
const wall = build(["cn8_vertigo@left", "face_pain_loss@left", "spinothalamic@right",
                    "ptosis@left", "miosis@left", "limb_ataxia@left"]);
const sW = neuraxisSVG(wall.cands, wall.tf, { labelFor: x => x.id });
ok(`Wallenberg implicates several tracts (${wall.tf.length})`, wall.tf.length >= 3);
ok("each implicated tract draws a path", (sW.match(/class="nx-tract/g) || []).length >= wall.tf.length);
ok("the legend names each implicated tract",
   wall.tf.every(t => sW.includes(esc0(t.tract.id)) || sW.toLowerCase().includes(t.tract.id.replace(/_/g, " "))));

// DISTINGUISHED BY FORM AS WELL AS HUE, so the lines stay separable in greyscale and for a colourblind
// reader — the rule the danger chip already follows.
ok("tracts carry a dash pattern as well as a colour", /stroke-dasharray/.test(sW));

// A tract with no modelled decussation draws no crossing. oculosympathetic is UNCROSSED throughout —
// which is why Horner's is ipsilateral — so its empty decussation is an ASSERTION, not a gap to fill.
const os = wall.tf.find(t => t.tract.id === "oculosympathetic");
ok("oculosympathetic is modelled as uncrossed", os && !os.decussation.between && !os.decussation.inLevel);
const st = wall.tf.find(t => t.tract.id === "spinothalamic");
ok("a tract WITH a decussation draws a crossing marker", st && sW.includes("nx-decus"));

// a case with no tracts still renders, and simply has no overlay
const fd = build(["weak_ankle_dorsiflexion@left", "weak_great_toe_extension@left", "weak_foot_eversion@left"]);
const sF = neuraxisSVG(fd.cands, fd.tf, { labelFor: x => x.id });
ok("a tractless case renders no overlay and no legend", !sF.includes("nx-tract") && !sF.includes("nx-legend"));
```

Add this helper just below the `ok` definition at the top of the file:

```js
const esc0 = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/neuraxis-diagram.test.js`
Expected: FAIL — no `nx-tract` in the output.

- [ ] **Step 3: Write minimal implementation**

Add to `app/neuraxis-diagram.js`, above `export function neuraxisSVG`:

```js
const TRACT_DASH = ["none", "6 3", "2 3", "10 3 2 3", "1 4"];   // FORM, not hue alone

// Each implicated pathway drawn along its modelled course, on the correct side, crossing where the model
// records a decussation.
//
// INCREMENT 1 DRAWS THE COURSE AS MODELLED. Refining it to Last's — the medial lemniscus hugging the
// midline in the medulla then drifting laterally, the corticospinal tract breaking into bundles through
// the basis pontis — is increment 2, together with the three MISSING decussation entries. With today's
// data `cerebellar`, `mlf` and `trigeminothalamic` draw no crossing. That is the state today too, so it
// is not a regression; it is fixed with citations in increment 2.
function tractOverlay(tracts, sides) {
  if (!tracts || !tracts.length) return "";
  const side = sides.includes("left") ? "left" : "right";
  const other = side === "left" ? "right" : "left";

  const paths = tracts.map((t, i) => {
    const d = t.decussation || {};
    const crossAt = d.between ? d.between[1] : d.inLevel || null;
    const pts = t.tract.course
      .filter(w => !!w.level)
      .map(w => {
        const past = crossAt && t.tract.course.findIndex(x => x.level === w.level)
                    >= t.tract.course.findIndex(x => x.level === crossAt);
        const a = anchorFor(w.level, "-", past ? other : side);
        return `${a.x},${a.y}`;
      });
    if (pts.length < 2) return "";
    const dash = TRACT_DASH[i % TRACT_DASH.length];
    return `<polyline class="nx-tract nx-tract-${i % 5}" points="${pts.join(" ")}"`
      + (dash === "none" ? "" : ` stroke-dasharray="${dash}"`)
      + ` marker-end="url(#nx-arrow)"/>`;
  }).join("");

  const marks = tracts.map(t => {
    const d = t.decussation || {};
    const lvl = d.inLevel || (d.between && d.between[1]);
    if (!lvl) return "";                        // no modelled crossing → draw none. See the note above.
    const a = anchorFor(lvl, "-", side), b = anchorFor(lvl, "-", other);
    return `<g class="nx-decus"><line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/></g>`;
  }).join("");

  const legend = tracts.map((t, i) =>
    `<g class="nx-legend-item"><line class="nx-tract nx-tract-${i % 5}" x1="0" y1="${i * 14}" x2="18" y2="${i * 14}"`
    + (TRACT_DASH[i % TRACT_DASH.length] === "none" ? "" : ` stroke-dasharray="${TRACT_DASH[i % TRACT_DASH.length]}"`)
    + `/><text class="nx-legend-t" x="24" y="${i * 14 + 3.5}">${esc(t.tract.id.replace(/_/g, " "))}</text></g>`
  ).join("");

  return `<defs><marker id="nx-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5"`
    + ` orient="auto-start-reverse"><path d="M0 0 L8 4 L0 8 z" class="nx-arrowhead"/></marker></defs>`
    + marks + paths
    + `<g class="nx-legend" transform="translate(14,${FIG_H - 20 - tracts.length * 14})">${legend}</g>`;
}
```

Then in `neuraxisSVG`, change the return so the overlay sits between the figure and the pins:

```js
    + SIDE_CAPTIONS + baseFigure() + regionCaptions()
    + tractOverlay(tracts, [...new Set((tracts || []).flatMap(t => t.sides || []))])
    + pins
```

- [ ] **Step 4: Run test to verify it passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/neuraxis-diagram.test.js`
Expected: PASS, `0 failed`.

- [ ] **Step 5: Commit**

```bash
git add app/neuraxis-diagram.js test/neuraxis-diagram.test.js
git commit -m "feat: tract overlay with legend, direction arrows and crossings

Distinguished by dash pattern as well as colour so the lines stay
separable in greyscale. A tract with no modelled decussation draws no
crossing; oculosympathetic's absence is asserted, since it is uncrossed
throughout and that is why Horner's is ipsilateral."
```

---

### Task 7: CSS, tokens and the standing guards

**Files:**
- Modify: `app/index.html:107-124` (the diagram CSS block) and all four palette blocks
- Modify: `test/brand.test.js` (`TERRA_ALLOWED`)
- Modify: `test/contrast.test.js` (`NOT_TEXT`)

**Interfaces:**
- Consumes: the class names emitted in Tasks 3–6: `an-brain`, `an-line`, `an-deep`, `an-stem`, `an-cbm`,
  `an-folia`, `an-cord`, `an-plate`, `an-roots`, `an-plexus`, `an-nerve`, `an-symp`, `an-gang`, `an-eye`,
  `an-pupil`, `an-optic`, `an-chiasm`, `an-mid`, `nx-side`, `nx-region`, `nx-pin`, `nx-dot`, `nx-n`,
  `nx-cluster`, `nx-clusterdot`, `nx-fan`, `nx-tract-0…4`, `nx-decus`, `nx-arrowhead`, `nx-legend`,
  `nx-legend-t`, `nx-locator`, `nx-loc-bg`, `nx-loc-box`, `nx-idx`, `nx-row`.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Add the tract tokens to all four palette blocks**

In `app/index.html`, add to the light `:root` block (the one containing `--terra:#d36d52`):

```
--tract-1:#3f6ea8;--tract-2:#8e5296;--tract-3:#3d7a63;--tract-4:#9a6a24;--tract-5:#a04352;
```

And to the dark block (the one containing `--terra:#e79075`):

```
--tract-1:#7fb0e0;--tract-2:#c79ccd;--tract-3:#7cc0a2;--tract-4:#d6ab63;--tract-5:#e0919c;
```

Add the same two lines to the two `:root[data-theme=…]` override blocks so all four blocks define them —
`test/brand.test.js` requires exactly four blocks and every token present in each.

- [ ] **Step 2: Declare the tract tokens NOT_TEXT**

In `test/contrast.test.js`, add to the `NOT_TEXT` map:

```js
  "tract-1": "a tract STROKE on the neuraxis figure, never text",
  "tract-2": "a tract STROKE on the neuraxis figure, never text",
  "tract-3": "a tract STROKE on the neuraxis figure, never text",
  "tract-4": "a tract STROKE on the neuraxis figure, never text",
  "tract-5": "a tract STROKE on the neuraxis figure, never text",
```

- [ ] **Step 3: Allowlist the two terracotta rules**

In `test/brand.test.js`, add to `TERRA_ALLOWED`:

```js
  ".nx-pin.sel",   // the selected candidate IS the answer — same argument as .cause.sel and .px-chip
  ".nx-row.sel",   // its index row is the same answer, read as text
```

**Do not add any other diagram selector.** A hover state, a focus ring or a tract colour is neither
identity nor the answer; if you find yourself wanting terracotta there, delete the rule instead — that is
what happened to the terracotta focus ring in the 2026-08-16 brand pass.

- [ ] **Step 4: Replace the diagram CSS**

In `app/index.html`, replace the block currently at lines 112–124 (from `.neuraxis-wrap{` through
`.neuraxis .nx-node:hover .nx-label{...}`) with:

```css
  .neuraxis-wrap{margin:10px 0;border:1px solid var(--line);border-radius:8px;padding:8px;overflow-x:auto;}
  .nx-cap{font-size:var(--fs-meta);color:var(--faint);margin-bottom:4px;}
  .neuraxis{max-width:100%;height:auto;color:var(--ink);display:block;}
  /* Anatomy strokes are --muted, NOT --line: --line is #26364d in dark and is invisible. */
  .anatomy path,.anatomy ellipse,.anatomy circle,.anatomy line{vector-effect:non-scaling-stroke;}
  .an-brain,.an-stem,.an-cbm,.an-cord{fill:var(--band);stroke:var(--muted);stroke-width:1.3;opacity:.8;}
  .an-line,.an-deep,.an-optic,.an-chiasm,.an-plexus,.an-nerve{fill:none;stroke:var(--muted);stroke-width:1;opacity:.65;}
  .an-roots path{fill:none;stroke:var(--muted);stroke-width:1;opacity:.65;}
  .an-folia{fill:none;stroke:var(--muted);stroke-width:.7;opacity:.45;}
  .an-plate{fill:none;stroke:var(--muted);stroke-width:1;stroke-dasharray:2 3;opacity:.45;}
  .an-symp{fill:none;stroke:var(--muted);stroke-width:1.1;stroke-dasharray:3 2.5;opacity:.7;}
  .an-gang,.an-eye{fill:var(--band);stroke:var(--muted);stroke-width:1;opacity:.8;}
  .an-pupil{fill:var(--muted);stroke:none;opacity:.7;}
  .an-mid{stroke:var(--muted);stroke-width:.6;stroke-dasharray:1 4;opacity:.5;}
  .nx-side{font-size:var(--fs-cap);fill:var(--faint);letter-spacing:.09em;text-transform:uppercase;}
  .nx-region{font-size:var(--fs-cap);fill:var(--faint);}
  .nx-tract{fill:none;stroke-width:2.2;opacity:.9;stroke-linecap:round;stroke-linejoin:round;}
  .nx-tract-0{stroke:var(--tract-1);}.nx-tract-1{stroke:var(--tract-2);}.nx-tract-2{stroke:var(--tract-3);}
  .nx-tract-3{stroke:var(--tract-4);}.nx-tract-4{stroke:var(--tract-5);}
  .nx-arrowhead{fill:var(--muted);}
  .nx-decus line{stroke:var(--gold);stroke-width:1.2;stroke-dasharray:3 2;}
  .nx-legend-t{font-size:var(--fs-cap);fill:var(--faint);}
  .nx-pin{cursor:pointer;}
  .nx-pin .nx-dot{fill:var(--paper);stroke:var(--muted);stroke-width:1.2;}
  .nx-pin .nx-n{font-size:var(--fs-cap);fill:var(--muted);text-anchor:middle;font-weight:600;}
  .nx-pin.sel .nx-dot{fill:var(--terra);stroke:var(--terra);}
  .nx-pin.sel .nx-n{fill:var(--on-danger);}
  .nx-cluster{cursor:pointer;}
  .nx-cluster .nx-clusterdot{fill:var(--band);stroke:var(--muted);stroke-width:1.4;}
  .nx-cluster .nx-fan{display:none;}
  .nx-cluster.open .nx-fan{display:inline;}
  .nx-cluster.open .nx-clusterdot{opacity:.35;}
  .nx-locator .nx-loc-bg{fill:var(--band);stroke:var(--line);stroke-width:1;opacity:.9;}
  .nx-locator .nx-loc-box{fill:none;stroke:var(--muted);stroke-width:1.5;}
  .nx-idx{columns:3;column-gap:20px;font-size:var(--fs-meta);margin:10px 0 0;padding:0;list-style:none;}
  .nx-idx .nx-row{break-inside:avoid;margin:0 0 3px;padding-left:20px;text-indent:-20px;line-height:1.35;cursor:pointer;color:var(--ink);}
  .nx-idx .nx-row b{display:inline-block;width:15px;text-align:right;margin-right:5px;color:var(--muted);font-weight:600;}
  .nx-idx .nx-row.sel{color:var(--terra);font-weight:700;}
  .nx-idx .nx-row.sel b{color:var(--terra);}
  @media (max-width:640px){.nx-idx{columns:1;}}
```

- [ ] **Step 5: Run the guard suites**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/brand.test.js && PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/contrast.test.js`
Expected: both PASS, `0 failed`.

If brand fails with an un-allowlisted `var(--terra)` rule, do NOT widen the allowlist — find the rule and
remove the terracotta from it.

- [ ] **Step 6: Commit**

```bash
git add app/index.html test/brand.test.js test/contrast.test.js
git commit -m "feat: diagram CSS, five tract tokens, and the guard entries

Anatomy strokes are --muted rather than --line, which is invisible in
dark. Only the selected pin and its index row take terracotta, both
allowlisted; the tract tokens are declared NOT_TEXT since they are
strokes."
```

---

### Task 8: Wire it into the app

**Files:**
- Modify: `app/app.js:12` (import), `app/app.js:634-638` (`neuraxisBlock`), `app/app.js:693`
  (the `whyCard` call site), `app/app.js:296-297` (click wiring)

**Interfaces:**
- Consumes: `neuraxisSVG`, `neuraxisIndex` from Tasks 4–5.
- Produces: nothing.

- [ ] **Step 1: Update the import**

`app/app.js` line 12 — replace:

```js
import { neuraxisSVG } from "./neuraxis-diagram.js";
```

with:

```js
import { neuraxisSVG, neuraxisIndex } from "./neuraxis-diagram.js";
```

- [ ] **Step 2: Rewrite `neuraxisBlock`**

Replace the function at `app/app.js:634-638` with:

```js
// THE INPUT CONTRACT: candidates come from solve() (`list` is r.display), not from tractsFor(). Harvesting
// sites from tracts is why eight of the seventeen shipped examples rendered no diagram at all.
function neuraxisBlock(list, tf, selectedId) {
  if (!list || !list.length) return "";
  const opts = { selectedId, labelFor: s => siteName(s) };
  return `<div class="neuraxis-wrap"><div class="nx-cap">Neuraxis — click a site to select it</div>`
    + neuraxisSVG(list, tf, opts) + neuraxisIndex(list, opts) + `</div>`;
}
```

- [ ] **Step 3: Update the call site**

`app/app.js:693` — replace `neuraxisBlock(tf, sel.site.id)` with `neuraxisBlock(list, tf, sel.site.id)`.

`whyCard` must now receive `list`. Change its signature from `function whyCard(tf, sel, total)` to
`function whyCard(tf, sel, total, list)`, and at `app/app.js:291` change `whyCard(tf, sel, total)` to
`whyCard(tf, sel, total, list)`. `list` is already in scope there (`app/app.js:275`).

- [ ] **Step 4: Extend the click wiring**

Replace `app/app.js:296-297` with:

```js
  const nx = el.querySelector(".neuraxis-wrap");
  if (nx) nx.onclick = e => {
    // A cluster expands in place; it is a drawing decision, so it must not change the selection.
    const cluster = e.target.closest(".nx-cluster");
    if (cluster && !e.target.closest(".nx-fan")) { cluster.classList.toggle("open"); return; }
    const g = e.target.closest("[data-k]"); if (!g) return;
    S.selectedPathology = undefined; S.selected = g.dataset.k; renderResults();
  };
```

- [ ] **Step 5: Run the full suite**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: exit 0, no `FAIL` lines. `test/app-smoke.test.js` must stay green — it pins the case-URL round
trip, which this must not disturb.

- [ ] **Step 6: Commit**

```bash
git add app/app.js
git commit -m "feat: render the neuraxis figure from the differential

whyCard now passes r.display through to the diagram, and the wrap
delegates cluster expansion separately from selection."
```

---

### Task 9: Verify in the browser and clean up

**Files:**
- Delete: `app/_harness.html`, `app/_mockups.html` (both gitignored build artefacts from the design phase)
- Modify: `.gitignore` (drop the two entries)
- Modify: `README.md` (test chain)

- [ ] **Step 1: Start the app**

Use the preview tooling, not Bash: `preview_start` with `{name: "neurolocaliser"}`, then open
`http://localhost:8137/app/`. Enter the passphrase `NeuroLocaliser`.

- [ ] **Step 2: Check each worked example renders a figure**

Click each of the four worked examples in the Localise empty state and confirm the Why card's Neuraxis
diagram shows a figure:

| example | expect |
|---|---|
| Wallenberg | figure with pins clustered down the patient's LEFT, one pin on the right, 4 tracts in the legend |
| **Foot drop** | **a figure — this rendered nothing before**, cropped to cord/root/plexus/nerve, with a locator |
| **Cauda equina** | **a figure — this rendered nothing before**, midline pins |
| Two lesions | pins on both sides at the cortex |

- [ ] **Step 3: Check the console and the dense case**

Run `read_console_messages` with `onlyErrors: true`. Expected: no errors.

Load the NMOSD cross-site archetype from the disclosure below the worked examples. Confirm a cluster pin
shows a count, clicking it fans the pins out, and the index below lists all of them.

- [ ] **Step 4: Check both themes**

Toggle the theme control in the header through light, dark and system. Confirm the anatomy is visible in
all three — this is the specific failure mode `--line` caused before.

- [ ] **Step 5: Take a screenshot for the owner**

`computer` with `{action: "screenshot"}` on the Wallenberg case, scrolled to the diagram. The authored
anatomy is not under a formal review gate in this increment, but show it to the owner before merge — the
2026-08-16 labels pass needed three rounds because a mechanical test cannot see whether a drawing is
anatomically true.

- [ ] **Step 6: Remove the design-phase artefacts**

```bash
rm -f app/_harness.html app/_mockups.html
```

Remove the `app/_harness.html` and `app/_mockups.html` lines from `.gitignore`.

- [ ] **Step 7: Add the new suite to the README chain**

In `README.md`, find the list of test suites and add `test/neuraxis-figure.test.js` alongside
`test/neuraxis-diagram.test.js`.

- [ ] **Step 8: Run the full suite one last time**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: exit 0. Record the suite and assertion counts for the commit message.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: drop the design-phase harnesses, document the new suite

Verified in the browser: all four worked examples render a figure,
including Foot drop and Cauda equina which rendered nothing before."
```

---

## What increment 2 picks up

Recorded here so the next implementer does not mistake these for oversights:

- `cerebellar`, `mlf` and `trigeminothalamic` draw **no crossing**, because their `decussation` is `{}` in
  `src/model/tracts.js`. Increment 2 fills all three with Last's citations. `oculosympathetic` stays empty
  and Task 6 asserts it.
- The tract courses are drawn **as modelled**, not to Last's. The medial lemniscus does not drift
  laterally, the corticospinal tract does not break into bundles through the basis pontis.
- There are **no cross-sections**. Tract adjacency — the reason a lateral medullary lesion gives both a
  Horner's and contralateral body pain and temperature loss — is not yet shown.
- The cord carries **no somatotopic lamination**.

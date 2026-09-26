# Integrated Why Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status: NOT YET IMPLEMENTED.** Spec: `docs/superpowers/specs/2026-09-26-integrated-why-design.md` (approved;
§6 records the refinements this plan implements).

**Goal:** Replace the Why card's per-tract lead with a derived reasoning chain — for each entered finding, what
carries it at the chosen site, why it is on that side, and everywhere else it could arise — ending with where
they all meet.

**Architecture:** One model table (`src/model/stations.js`: level → readable neuraxis station), one content
table (`src/data/sideReasons.js`: side-reason phrases), one pure engine module (`src/engine/why.js`:
`whyChain`), and a rewrite of `whyCard` in `app/app.js`. `meet` comes from the differential's explain-all set,
so the Why cannot disagree with the Where. The retired "Why not elsewhere" (`whyNotOthers`) is deleted.

**Tech Stack:** Node v24 ES modules, zero dependencies, no build step; standalone test scripts.

## Global Constraints

- Prefix every command: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"`.
- Branch: `feat/integrated-why` (off `feat/accuracy-round-1`). Never commit to `main`.
- Tests are standalone scripts with a local `ok(label, cond)` helper, `process.exit(fail === 0 ? 0 : 1)`; a new
  suite joins the `test` script in `package.json`.
- Per-(level,part) tables are keyed `${level}|${part}`, never by part alone.
- DERIVE, don't store: nothing in this plan is authored per syndrome.
- No new use of the brand accent in CSS (`test/brand.test.js` allowlist), and never write its custom-property
  name in a CSS comment (that suite scans the stylesheet as text).
- Commit messages end with a blank line then `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

---

### Task 1: Stations table

**Files:**
- Create: `src/model/stations.js`
- Create: `test/why.test.js`
- Modify: `package.json` (add `node test/why.test.js` after `node test/clinical-vignettes.test.js`)

**Interfaces:**
- Produces: `STATIONS` (array of `{ id, group }`), `STATION_ORDER` (ids in order), `STATION_GROUP`
  (id → group), `AXIS` (ids along which runs compress), `stationOf(site) -> string | null`.

- [ ] **Step 1: Write the failing test** — create `test/why.test.js`:

```js
// why.test.js — the integrated Why (spec 2026-09-26): stations, side reasons, and the reasoning chain.
import { candidateSites } from "../src/engine/inverse.js";
import { STATIONS, STATION_ORDER, STATION_GROUP, AXIS, stationOf } from "../src/model/stations.js";

let pass = 0, fail = 0;
const ok = (l, c, d = "") => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l + (c ? "" : `  ${d}`)); };
const cs = candidateSites();
const byId = id => cs.find(s => s.id === id);

// ---- 1: stations ----
{
  const unmapped = [...new Set(cs.filter(s => !stationOf(s)).map(s => `${s.level}|${s.part}`))];
  ok(`every candidate site maps to a station (${cs.length} sites)`, unmapped.length === 0, unmapped.join(", "));
  const known = new Set(STATION_ORDER);
  ok("every mapped station is a declared station", cs.every(s => known.has(stationOf(s))));
  ok("every station has a group", STATIONS.every(s => ["hemisphere", "brainstem", "cerebellum", "cord", "peripheral"].includes(s.group)));
  ok("the axis is an ordered subset of the stations", AXIS.every((a, i) => i === 0 || STATION_ORDER.indexOf(a) > STATION_ORDER.indexOf(AXIS[i - 1])));
  ok("the brainstem stays split by level (Weber midbrain, Wallenberg medulla)",
     stationOf(byId("left_midbrain_medial")) === "midbrain" && stationOf(byId("left_medulla_lateral")) === "medulla");
  ok("a part override beats its level (the VPL thalamus is thalamus, not deep white matter)",
     stationOf(byId("left_subcortex_thalamus")) === "thalamus" && stationOf(byId("left_subcortex_internal_capsule")) === "deep white matter");
  ok("the optic-nerve sites are visual pathway, not cranial nerve", stationOf(byId("left_skull_base_optic_neuritis")) === "visual pathway");
  ok("a group per station, keyed by id", STATION_GROUP["medulla"] === "brainstem" && STATION_GROUP["nerve root"] === "peripheral");
}

console.log(`\nintegrated why: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run to verify it fails** — `node test/why.test.js` → module not found.

- [ ] **Step 3: Create `src/model/stations.js`**

```js
// stations.js — a readable projection of the model's levels onto the neuraxis (integrated Why, spec
// 2026-09-26). A STATION is where along the nervous system a lesion sits, in words a clinician reads:
// "medulla", "nerve root". Keyed by level, with a `${level}|${part}` override where a part sits in a
// different station from its level — NEVER keyed by part alone (`lateral`, `thalamus` recur across levels).
//
// `group` drives the side-reason phrasing (src/data/sideReasons.js). ORDER is the display order; AXIS is the
// long-tract spine along which "could arise at" compresses a run of three or more into "A → B".
// Owner-approved 2026-09-26 (spec §4.2).
export const STATIONS = [
  { id: "cerebral cortex",   group: "hemisphere" },
  { id: "corpus callosum",   group: "hemisphere" },
  { id: "deep white matter", group: "hemisphere" },
  { id: "basal ganglia",     group: "hemisphere" },
  { id: "thalamus",          group: "hemisphere" },
  { id: "hypothalamus",      group: "hemisphere" },
  { id: "midbrain",          group: "brainstem" },
  { id: "pons",              group: "brainstem" },
  { id: "medulla",           group: "brainstem" },
  { id: "brainstem (several levels)", group: "brainstem" },
  { id: "cerebellum",        group: "cerebellum" },
  { id: "spinal cord",       group: "cord" },
  { id: "conus",             group: "cord" },
  { id: "cauda equina",      group: "peripheral" },
  { id: "nerve root",        group: "peripheral" },
  { id: "plexus",            group: "peripheral" },
  { id: "peripheral nerve",  group: "peripheral" },
  { id: "motor unit",        group: "peripheral" },
  { id: "cranial nerve",     group: "peripheral" },
  { id: "inner ear",         group: "peripheral" },
  { id: "visual pathway",    group: "peripheral" },
  { id: "pupil pathway",     group: "peripheral" },
  { id: "sympathetic chain", group: "peripheral" },
  { id: "olfactory",         group: "peripheral" },
];
export const STATION_ORDER = STATIONS.map(s => s.id);
export const STATION_GROUP = Object.fromEntries(STATIONS.map(s => [s.id, s.group]));
export const AXIS = ["cerebral cortex", "deep white matter", "midbrain", "pons", "medulla", "spinal cord"];

const BY_LEVEL = {
  cortex: "cerebral cortex", cerebrum: "cerebral cortex",
  corpus_callosum: "corpus callosum",
  subcortex: "deep white matter", pseudobulbar: "deep white matter",
  basal_ganglia: "basal ganglia",
  thalamus: "thalamus", thalamus_arousal: "thalamus",
  hypothalamus: "hypothalamus",
  midbrain: "midbrain", dorsal_midbrain: "midbrain",
  pons: "pons", locked_in: "pons", pontomesencephalic: "pons",
  medulla: "medulla", craniocervical_junction: "medulla",
  brainstem_aras: "brainstem (several levels)", guillain_mollaret: "brainstem (several levels)",
  central_vestibular: "brainstem (several levels)",
  cerebellum: "cerebellum",
  cord: "spinal cord", combined_degeneration: "spinal cord",
  conus: "conus", cauda: "cauda equina",
  root: "nerve root", polyradiculoneuropathy: "nerve root",
  plexus: "plexus",
  nerve: "peripheral nerve", polyneuropathy: "peripheral nerve",
  motor_unit: "motor unit",
  skull_base: "cranial nerve",
  peripheral_vestibular: "inner ear",
  visual_pathway: "visual pathway",
  pupil: "pupil pathway",
  sympathetic: "sympathetic chain",
  olfactory: "olfactory",
};
const BY_PART = {
  "subcortex|thalamus": "thalamus",
  "aphasia_subcortical|thalamic": "thalamus",
  "aphasia_subcortical|striatocapsular": "deep white matter",
  "skull_base|optic_aion": "visual pathway",
  "skull_base|optic_neuritis": "visual pathway",
  "skull_base|optic_canal": "visual pathway",
};
export const stationOf = site => BY_PART[`${site.level}|${site.part}`] || BY_LEVEL[site.level] || null;
```

- [ ] **Step 4: Run** — `node test/why.test.js` → all PASS. Add ` && node test/why.test.js` after
  `node test/clinical-vignettes.test.js` in `package.json`; `npm test` exits 0.

- [ ] **Step 5: Commit** — `git add src/model/stations.js test/why.test.js package.json && git commit -m "feat: stations — the model's levels as readable neuraxis places" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"`

---

### Task 2: Side reasons and `whyChain`

**Files:**
- Create: `src/data/sideReasons.js`, `src/engine/why.js`
- Modify: `test/why.test.js`

**Interfaces:**
- Consumes: `stationOf`, `STATION_ORDER`, `STATION_GROUP`, `AXIS` (Task 1); `candidateSites`, `differential`
  (`inverse.js`); `expectedFindings`, `explain` (`forward.js`); `TRACTS` (`model/tracts.js`).
- Produces: `whyChain(observedSet, site, opts) -> { steps, meet: { stations, sides }, verdict, station }`,
  where each step is `{ token, finding, bodySide, explained, carrier, structure, relation, reason, stations,
  where, order }`, `relation ∈ same|opposite|both|midline|none`, `verdict ∈ one|several|none`. Also exports
  `renderWhere(stations) -> string` and `reasonFor(finding, relation, struct, station) -> string`.

- [ ] **Step 1: Add the failing tests** — in `test/why.test.js` add to the imports:

```js
import { solve } from "../src/engine/inverse.js";
import { expectedFindings } from "../src/engine/forward.js";
import { whyChain, renderWhere } from "../src/engine/why.js";
import { EXAMPLES } from "../app/examples.js";
```

(merge `solve` into the existing `inverse.js` import) and insert before the final `console.log`:

```js
// ---- 2: the chain ----
const chainFor = toks => { const r = solve(new Set(toks), { dominantSide: "left" });
  return { site: r.display[0].site, w: whyChain(new Set(toks), r.display[0].site, { dominantSide: "left" }) }; };
const stepOf = (w, tok) => w.steps.find(s => s.token === tok);
{
  const { w } = chainFor(["face_pain_loss@left", "spinothalamic@right", "miosis@left", "dysphagia@left", "limb_ataxia@left"]);
  ok("Wallenberg meets at the medulla, left side, one place",
     w.verdict === "one" && JSON.stringify(w.meet.stations) === '["medulla"]' && JSON.stringify(w.meet.sides) === '["left"]');
  const face = stepOf(w, "face_pain_loss@left"), body = stepOf(w, "spinothalamic@right");
  ok("…the face is SAME side, explained by the trigeminal crossing", face.relation === "same" && /trigeminal lemniscus/.test(face.reason) && /does not lie between/.test(face.reason));
  ok("…the body is OPPOSITE side, explained by the anterior white commissure", body.relation === "opposite" && /anterior white commissure/.test(body.reason) && /lies between/.test(body.reason));
  ok("…the Horner step says the pathway does not cross", /does not cross/.test(stepOf(w, "miosis@left").reason));
  ok("…the ataxia step says the cerebellar outflow crosses twice", /crosses twice/.test(stepOf(w, "limb_ataxia@left").reason));
  ok("…every step is carried here, by a named structure", w.steps.every(s => s.explained && s.carrier));
  ok("…steps run most-localising first", w.steps.every((s, i) => i === 0 || s.stations.length >= w.steps[i - 1].stations.length));
  ok("…the face step could arise only at pons or medulla", face.where === "pons, medulla", face.where);
}
{
  const { w } = chainFor(["ptosis@left", "weak_adduction@left", "weak_arm@right", "weak_leg@right"]);
  ok("Weber meets at the midbrain", w.verdict === "one" && JSON.stringify(w.meet.stations) === '["midbrain"]');
  ok("…arm weakness is opposite side across the pyramidal decussation",
     stepOf(w, "weak_arm@right").relation === "opposite" && /pyramidal decussation/.test(stepOf(w, "weak_arm@right").reason));
  ok("…arm weakness could arise anywhere from cortex to cord", stepOf(w, "weak_arm@right").where === "cerebral cortex → spinal cord");
}
{
  const { w } = chainFor(["weak_ankle_dorsiflexion@left", "weak_hip_abduction@left", "sensory_l5@left"]);
  ok("L5 radiculopathy fits several places: nerve root, plexus", w.verdict === "several" && JSON.stringify(w.meet.stations) === '["nerve root","plexus"]');
}
{
  const { w } = chainFor(["babinski@left"]);
  ok("an isolated Babinski does not localise: several places, cortex → cord",
     w.verdict === "several" && w.steps[0].where === "cerebral cortex → spinal cord", w.steps[0].where);
}
{
  const two = EXAMPLES.find(e => e.id === "twolesions");
  const { w } = chainFor(two.tokens);
  ok("the two-lesion worked example meets nowhere", w.verdict === "none" && w.meet.stations.length === 0);
  ok("…and the step the chosen site cannot carry says so", w.steps.some(s => !s.explained && s.carrier === null && s.reason === ""));
}
{
  ok("renderWhere compresses a run of three or more along the axis", renderWhere(["midbrain", "pons", "medulla"]) === "midbrain → medulla");
  ok("renderWhere keeps a run of two as a list", renderWhere(["pons", "medulla"]) === "pons, medulla");
  ok("renderWhere lists off-axis stations after the axis runs", renderWhere(["deep white matter", "thalamus", "midbrain", "pons"]) === "deep white matter → pons, thalamus");
  const w = whyChain(new Set(["papilloedema@none", "hoovers_sign@none", "weak_arm@right"]), byId("left_subcortex_internal_capsule"), { dominantSide: "left" });
  ok("axis and flag findings (papilloedema, functional) are not steps", w.steps.map(s => s.token).join() === "weak_arm@right");
}

// ---- 3: invariants over every site's own complete picture ----
{
  const noSelf = [], noCarrier = [], disagree = [];
  for (const s of cs) {
    let E; try { E = expectedFindings(s, { dominantSide: "left" }); } catch { continue; }
    if (!E.size) continue;
    const w = whyChain(E, s, { dominantSide: "left" });
    if (!w.meet.stations.includes(stationOf(s))) noSelf.push(s.id);
    if (w.steps.some(x => x.explained && !x.carrier)) noCarrier.push(s.id);
    const r = solve(E, { dominantSide: "left" });
    if (r.singleExplainsAll) {
      const top = r.display[0].site;
      if (!whyChain(E, top, { dominantSide: "left" }).meet.stations.includes(stationOf(top))) disagree.push(s.id);
    }
  }
  ok("every site's complete picture meets at that site's own station", noSelf.length === 0, noSelf.join(", "));
  ok("every explained step names its carrier", noCarrier.length === 0, noCarrier.join(", "));
  ok("the Why agrees with the Where (the first-ranked site's station is in the meet)", disagree.length === 0, disagree.join(", "));
}
```

- [ ] **Step 2: Run to verify it fails** — `node test/why.test.js` → module not found (`why.js`).

- [ ] **Step 3: Create `src/data/sideReasons.js`**

```js
// sideReasons.js — CONTENT ONLY: the phrases the integrated Why uses to explain why a finding is on the side it
// is (spec 2026-09-26 §4.3, owner-approved; wording refined §6). The side itself is DERIVED by the forward
// model — these only say why. The choosing logic lives in src/engine/why.js.
//
// The crossing phrases are direction-free on purpose: a descending tract in the cord has crossed ABOVE the
// lesion and an ascending tract in the medulla has not crossed yet — both give "same side". What decides it is
// whether the crossing lies BETWEEN the lesion and the side the pathway serves.
export const REASON = {
  both: "both sides — the lesion crosses the midline",
  midline: "midline — no side",
  noneDominant: "no side — a dominant-hemisphere function",
  noneNondominant: "no side — a non-dominant-hemisphere function",
  none: "no side",
  crossOpposite: "opposite side — the {tract} crosses at the {crossing}, and that crossing lies between this level and the side it serves",
  crossSame: "same side — the {tract} crosses at the {crossing}, but that crossing does not lie between this level and the side it serves",
  hemisphereOpposite: "opposite side — each hemisphere serves the other side of the body",
  cerebellumSame: "same side — the cerebellum coordinates its own side",
  brainstemSame: "same side — brainstem nuclei and cranial nerves serve their own side",
  brainstemOpposite: "opposite side — this pathway has already crossed at this level",
  peripheralSame: "same side — a nerve serves its own side",
  same: "same side",
  opposite: "opposite side",
};

// Tracts whose SAME side needs its own sentence: the cerebellar outflow crosses twice (so "does not cross"
// would be wrong); the oculosympathetic pathway genuinely never crosses.
export const TRACT_SAME = {
  cerebellar: "same side — the cerebellar outflow crosses twice, so each cerebellar pathway serves its own side",
  oculosympathetic: "same side — the oculosympathetic pathway does not cross",
};

// A crossing whose model label is a sentence rather than a name.
export const CROSSING_NAME = { mlf: "abducens internuclear crossing in the pons" };
```

- [ ] **Step 4: Create `src/engine/why.js`**

```js
// why.js — the integrated Why (spec 2026-09-26). For each entered finding: what carries it at the chosen site,
// why it is on that side, and everywhere else it could arise on its own; then where they all MEET. Entirely
// DERIVED — from the forward model, the candidate sites and the differential. Nothing is authored per syndrome.
//
// `meet` is the differential's explain-all set mapped to (station, side), not a raw intersection of possible
// places: it applies the known-negative rule, so the Why and the Where cannot disagree.
import { candidateSites, differential } from "./inverse.js";
import { expectedFindings, explain } from "./forward.js";
import { STRUCTURE_BY_ID } from "../model/structures.js";
import { TRACTS } from "../model/tracts.js";
import { stationOf, STATION_ORDER, STATION_GROUP, AXIS } from "../model/stations.js";
import { REASON, TRACT_SAME, CROSSING_NAME } from "../data/sideReasons.js";

// "corticobulbar tract (to the facial nucleus)" -> "corticobulbar tract"; "trigeminal lemniscus — crosses…" ->
// "trigeminal lemniscus". Model labels carry teaching asides that do not belong mid-sentence.
const plain = s => String(s).replace(/\s*\([^)]*\)/g, "").split(" — ")[0].trim();
const fillIn = (tpl, v) => tpl.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "");
const byOrder = (a, b) => STATION_ORDER.indexOf(a) - STATION_ORDER.indexOf(b);

// token -> Set of stations where ANY candidate site produces it. Built once per (dominance, sensory level),
// the two options that change what a site emits.
const INDEX = new Map();
function locusIndex(opts) {
  const key = `${opts.dominantSide || "left"}|${opts.sensoryLevel || ""}`;
  if (INDEX.has(key)) return INDEX.get(key);
  const idx = new Map();
  for (const s of candidateSites()) {
    let E; try { E = expectedFindings(s, opts); } catch { continue; }
    const st = stationOf(s); if (!st) continue;
    for (const t of E) (idx.get(t) ?? idx.set(t, new Set()).get(t)).add(st);
  }
  INDEX.set(key, idx);
  return idx;
}

// Stations as a phrase: runs of three or more along the long-tract AXIS compress to "A → B"; off-axis stations
// follow in station order.
export function renderWhere(stations) {
  const parts = [];
  let run = [];
  const flush = () => { if (run.length >= 3) parts.push(`${run[0]} → ${run[run.length - 1]}`); else parts.push(...run); run = []; };
  for (const s of AXIS) { if (stations.includes(s)) run.push(s); else flush(); }
  flush();
  return [...parts, ...stations.filter(s => !AXIS.includes(s)).sort(byOrder)].join(", ");
}

function relationOf(token, site) {
  const side = token.split("@")[1];
  if (side === "none") return "none";
  if (site.side === "bilateral") return "both";
  if (site.side === "midline" || side === "midline") return "midline";
  return side === site.side ? "same" : "opposite";
}

// Why is this finding on this side? The relation is already decided by the forward model; this only explains
// it. A tract is chosen by finding MEMBERSHIP (not course level): the relation is derived, the tract only
// supplies the words — and the pontine Horner rows sit at a level the oculosympathetic course does not list.
export function reasonFor(finding, relation, struct, station) {
  if (relation === "both") return REASON.both;
  if (relation === "midline") return REASON.midline;
  if (relation === "none") return struct?.hemisphere === "dominant" ? REASON.noneDominant
    : struct?.hemisphere === "nondominant" ? REASON.noneNondominant : REASON.none;
  const tract = TRACTS.find(t => t.findings.includes(finding));
  if (tract) {
    if (relation === "same" && TRACT_SAME[tract.id]) return TRACT_SAME[tract.id];
    if (tract.decussation && tract.decussation.label) {
      const v = { tract: plain(tract.label), crossing: CROSSING_NAME[tract.id] || plain(tract.decussation.label) };
      return fillIn(relation === "opposite" ? REASON.crossOpposite : REASON.crossSame, v);
    }
  }
  const g = STATION_GROUP[station];
  if (relation === "opposite" && g === "hemisphere") return REASON.hemisphereOpposite;
  if (relation === "same" && g === "cerebellum") return REASON.cerebellumSame;
  if (relation === "same" && g === "brainstem") return REASON.brainstemSame;
  if (relation === "opposite" && g === "brainstem") return REASON.brainstemOpposite;
  if (relation === "same" && g === "peripheral") return REASON.peripheralSame;
  return REASON[relation];
}

export function whyChain(observedSet, site, opts = {}) {
  const idx = locusIndex(opts);
  // Only findings some site produces are steps: papilloedema (an axis) and the refractive and functional signs
  // (flags) carry their own banners and localise nothing.
  const toks = [...observedSet].filter(t => idx.has(t));
  const station = stationOf(site);
  const ex = explain(site, opts);
  const steps = toks.map((token, order) => {
    const [finding, bodySide] = token.split("@");
    const e = ex.find(x => `${x.finding}@${x.bodySide}` === token);
    const struct = e ? STRUCTURE_BY_ID[e.structure] : null;
    const stations = [...idx.get(token)].sort(byOrder);
    const relation = relationOf(token, site);
    return {
      token, finding, bodySide, explained: !!e,
      carrier: struct ? struct.note.split(" — ")[0] : null,
      structure: struct ? struct.id : null,
      relation, reason: e ? reasonFor(finding, relation, struct, station) : "",
      stations, where: renderWhere(stations), order,
    };
  }).sort((a, b) => a.stations.length - b.stations.length || a.order - b.order);
  const all = toks.length ? differential(new Set(toks), opts).filter(c => c.n === toks.length) : [];
  const pairs = [...new Set(all.map(c => `${stationOf(c.site)}|${c.site.side}`))];
  const meet = {
    stations: [...new Set(pairs.map(p => p.split("|")[0]))].sort(byOrder),
    sides: [...new Set(pairs.map(p => p.split("|")[1]))],
  };
  const verdict = !pairs.length ? "none" : meet.stations.length === 1 ? "one" : "several";
  return { steps, meet, verdict, station };
}
```

- [ ] **Step 5: Run** — `node test/why.test.js` → all PASS; `npm test` exits 0.

- [ ] **Step 6: Commit** — `git add src/data/sideReasons.js src/engine/why.js test/why.test.js && git commit -m "feat: whyChain — what carries each finding, why that side, and where they meet" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"`

---

### Task 3: The Why card, and retiring "Why not elsewhere"

**Files:**
- Modify: `app/app.js` (imports; `whyCard`; its call site; delete `synthesisHTML`, `whyBlock`, the `sideName` const
  if unused, and the `whyNotOthers`/`prevalenceOf` imports if unused)
- Modify: `app/index.html` (CSS: add the chain rules; delete the dead `.whynot*`, `.synth .cross`, `.synth.converge` rules)
- Modify: `src/engine/tracts.js` (delete `whyNotOthers` and its `BUCKET`/`BUCKET_ORDER`/`bucketOf` helpers)
- Modify: `test/tracts.test.js` (delete the two `whyNotOthers` blocks and the import)

- [ ] **Step 1: Engine removal first (keeps the suite green between edits)** — in `src/engine/tracts.js` delete
  from the comment `// Level buckets for the "why not the other sites" reasoning.` through the end of
  `whyNotOthers`, and remove the now-unused `LOCALISING` and `expectedFindings` imports if nothing else in the
  file uses them (check with `grep -n "LOCALISING\|expectedFindings" src/engine/tracts.js`). In
  `test/tracts.test.js` change the import to `import { tractsFor, tractNarrative } from "../src/engine/tracts.js";`
  and delete the block headed `// ---- oculosympathetic why-not surfaces the order discrimination (emergent) ----`
  and the block headed `// ---- derived "why not the others" ----` (through its last `ok(...)`), adding in their
  place the comment `// whyNotOthers() was retired 2026-09-26 — the integrated Why and the compare panel answer it (spec 2026-09-26).`

- [ ] **Step 2: Rewrite `whyCard` in `app/app.js`**

Add imports:

```js
import { whyChain } from "../src/engine/why.js";
```

and change `import { tractsFor, tractNarrative, whyNotOthers } from "../src/engine/tracts.js";` to
`import { tractsFor, tractNarrative } from "../src/engine/tracts.js";`.

Replace the whole of `function whyCard(tf, sel, total, list) { … }` with:

```js
// ② Why — the integrated reasoning chain (spec 2026-09-26): for each finding, what carries it HERE and why it
// is on that side, and everywhere else it could arise; then where they all meet. Derived by src/engine/why.js.
// The compare panel follows (what to examine next); the old tract Course narratives sit behind "Pathway
// anatomy". "Why not elsewhere" was retired — the compare panel answers it for the candidates actually in play.
function meetSentence(w) {
  const n = w.steps.length;
  const side = w.meet.sides.length === 1 ? w.meet.sides[0] : null;
  const at = st => side === "left" || side === "right" ? `the ${side} ${st}` : side === "bilateral" ? `the ${st} (both sides)` : `the ${st}`;
  if (w.verdict === "none") return "No single place carries all of these findings — together they need more than one lesion, or a finding needs re-checking.";
  if (w.verdict === "one") return n === 1 ? `This finding arises only in ${at(w.meet.stations[0])}.` : `Only ${at(w.meet.stations[0])} carries all ${n} findings.`;
  if (n === 1) return `${shortFindingLabel(w.steps[0].finding)} alone does not localise: it can arise at ${w.steps[0].where}.`;
  return `These findings fit ${w.meet.stations.map(at).join(" or ")} — see what separates them below.`;
}
const capFirst = s => s ? s[0].toUpperCase() + s.slice(1) : s;
function whyStepHTML(s) {
  const how = s.explained
    ? `<div class="wc-d">Carried here by <b>${esc(s.carrier)}</b>. ${esc(capFirst(s.reason.replace(" — ", ": ")))}.</div>`
    : `<div class="wc-d wc-no">Not carried at this site.</div>`;
  return `<div class="wc-step"><div class="wc-f">${tokenLabel(s.token)}</div>${how}<div class="wc-w">Could arise at: ${esc(s.where)}</div></div>`;
}
function whyCard(tf, sel, list) {
  const pat = umnLmnPattern(S.tokens);
  const umnlmn = pat.verdict
    ? `<div class="annot"><b>${pat.verdict === "mixed" ? "UMN + LMN (mixed)" : pat.verdict + " pattern"}:</b> ${esc(pat.note)}</div>`
    : "";
  const opts = { dominantSide: S.dominant, sensoryLevel: S.sensoryLevel || undefined };
  const w = whyChain(S.tokens, sel.site, opts);
  const chain = w.steps.length
    ? `<p class="wc-h">Why ${esc(siteName(sel.site))}</p><div class="why-chain">${w.steps.map(whyStepHTML).join("")}</div><p class="wc-meet">${esc(meetSentence(w))}</p>`
    : "";
  const compare = `<details class="nx-toggle" open style="margin-top:6px"><summary>What separates these locations</summary><div class="cmp-wrap">${comparePanel(list)}</div></details>`;
  let missed = [];
  try { missed = [...expectedFindings(sel.site, opts)].filter(t => !S.tokens.has(t)); } catch { missed = []; }
  const expected = missed.length
    ? `<details class="nx-toggle" style="margin-top:6px"><summary>Also expected here, not reported <span class="c">${missed.length}</span></summary><div class="why-list" style="margin-top:4px">${missed.map(t => `<div class="why-item"><span class="k warn">⚠</span>${tokenLabel(t)}</div>`).join("")}</div><p class="derived">Examine for these to confirm the site.</p></details>`
    : "";
  const anatomy = tf.length
    ? `<details class="nx-toggle" style="margin-top:6px"><summary>Pathway anatomy</summary>${tf.map(t => `<p class="synth"><b>${esc(capFirst(t.tract.label))}.</b> ${esc(tractNarrative(t.tract))}</p>`).join("")}</details>`
    : "";
  return card("Why", `${umnlmn}${chain}${compare}${expected}${anatomy}`, "why");
}
```

In `renderResults`, change the call `whyCard(tf, sel, total, list)` to `whyCard(tf, sel, list)`.

Delete the functions `synthesisHTML` and `whyBlock` (both now unreferenced). Then check for orphans and remove
any import or const that is no longer referenced:
`grep -n "prevalenceOf\|sideName\|synthesisHTML\|whyBlock\|whyNotOthers" app/app.js` — delete each hit that is
only a definition or import.

- [ ] **Step 3: CSS in `app/index.html`**

Delete the rules `.synth .cross{…}`, `.synth.converge{…}`, `.whynot{…}`, `.whynot-list{…}`, `.whynot-list li{…}`,
`.whynot .wn-terr{…}`. After the existing `.why-item .t…` line (the `.why-item .d` rule), add:

```css
  .wc-h{font-size:var(--fs-body);font-weight:600;margin:4px 0 6px;color:var(--ink);}
  .why-chain{display:flex;flex-direction:column;gap:8px;}
  .wc-step{border-left:2px solid var(--line);padding-left:8px;}
  .wc-f{font-size:var(--fs-body);color:var(--ink);}
  .wc-d{font-size:var(--fs-meta);color:var(--ink);line-height:1.45;}
  .wc-d.wc-no{color:var(--muted);}
  .wc-w{font-size:var(--fs-meta);color:var(--muted);}
  .wc-meet{font-size:var(--fs-body);font-weight:600;margin:10px 0 2px;color:var(--ink);line-height:1.45;}
```

- [ ] **Step 4: Run the suite** — `npm test` exits 0 (`app-smoke` parse-checks `app.js`; `brand` and
  `contrast` check the stylesheet).

- [ ] **Step 5: Verify in the browser** (the owner accepted a few usage rows): start the preview
  (`preview_start {name:"neurolocaliser"}`), load each case URL with a RELOAD (hash-only navigation does not
  re-run boot), and read the Why card:
  - `/app/#f=cn8_vertigo%40left%2Cface_pain_loss%40left%2Cspinothalamic%40right%2Cptosis%40left%2Cmiosis%40left%2Climb_ataxia%40left%2Cdysphagia%40left`
    → "Why … lateral medulla", seven steps, ends "Only the left medulla carries all 7 findings."
  - `/app/#f=babinski%40left` → "Extensor plantar … alone does not localise: it can arise at cerebral cortex → spinal cord."
  - `/app/#f=weak_arm%40right%2Cweak_leg%40left` → the "No single place…" sentence.
  - Check `read_console_messages` (errors only) is empty; take one screenshot of the Wallenberg Why card.

- [ ] **Step 6: Commit** — `git add app/app.js app/index.html src/engine/tracts.js test/tracts.test.js && git commit -m "feat: the Why card leads with the reasoning chain; 'why not elsewhere' retired" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"`

---

### Task 4: Close-out

**Files:** `CLAUDE.md`, `README.md`, the spec and this plan (status lines).

- [ ] **Step 1:** `npm test` exits 0; count assertions with `npm test 2>&1 | grep -c '^PASS'` and suites with
  `grep -o 'node test/[a-z0-9-]*\.test\.js' package.json | wc -l`.
- [ ] **Step 2:** Update the counts on `README.md` line 17 and line 93 and the "test suites / assertions green"
  line near the top of `CLAUDE.md`. Add a `CLAUDE.md` section before `## Commands`:

```markdown
## Integrated Why (DONE 2026-09-26) — ✅ owner-approved tables

**Branch `feat/integrated-why` (stacked on `feat/accuracy-round-1`).** The Why card used to lead with a
per-tract Course narrative — the same textbook journey for every site on the tract — and never showed what
decided the answer. It now leads with a DERIVED reasoning chain (`src/engine/why.js` `whyChain`): for each
entered finding, the structure that carries it at the chosen site (its note's own words), why it is on that
side, and every station where it could arise on its own; then where they all meet — one place, several
(→ the compare panel), or none (→ Together). An isolated sign that does not localise says so ("an extensor
plantar alone does not localise: cortex → cord").

**`meet` is the differential's explain-all set mapped to (station, side)**, not a raw intersection: it
applies the known-negative rule, so the Why and the Where cannot disagree (asserted over all 364 sites' own
pictures). **Stations** (`src/model/stations.js`) project levels onto a readable neuraxis, keyed
`${level}|${part}` for overrides; **side reasons** (`src/data/sideReasons.js`) are content only. The crossing
phrase is direction-free on purpose — *"that crossing lies (or does not lie) between this level and the side
it serves"* — because a descending tract in the cord has crossed above and an ascending tract in the medulla
has not crossed yet, and both are "same side". The cerebellar outflow crosses TWICE, so its same side has its
own sentence rather than "does not cross".

`whyNotOthers()` is deleted (the compare panel answers "why not elsewhere" for the candidates actually in
play); the Course narratives live on behind "Pathway anatomy".

Spec/plan: `docs/superpowers/specs/2026-09-26-integrated-why-design.md`,
`docs/superpowers/plans/2026-09-26-integrated-why.md`.
```

- [ ] **Step 3:** Set the spec's status line to `**Status: IMPLEMENTED (2026-09-26) on feat/integrated-why.**`
  and this plan's to `**Status: IMPLEMENTED (2026-09-26).**`
- [ ] **Step 4: Commit** — `git add CLAUDE.md README.md docs/superpowers/ && git commit -m "docs: integrated Why recorded" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"`

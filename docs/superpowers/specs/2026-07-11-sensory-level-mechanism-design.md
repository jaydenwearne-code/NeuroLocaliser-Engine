# Sensory-level mechanism — design spec

**Date:** 2026-07-11
**Region increment:** spinal cord — the "sensory level" mechanism (next step after the cord core four)
**Status:** approved design, ready for implementation planning

## Context

The NeuroLocaliser anatomical engine derives syndromes from anatomy rather than storing them.
The brainstem and the spinal-cord **core four** (Brown-Séquard, anterior cord/ASA, posterior
column/SCD, transverse myelopathy) are built and green (13 tests). The cord is currently modelled
as a **single generic level `"cord"`**: the tract pattern (which columns, which sides) picks the
cross-sectional syndrome, but the engine cannot say *where along the cord* the lesion is.

This increment adds the **sensory level** — the highest level of sensory loss, the single most
important localiser of *level* in spinal cord disease. It lets the engine report "Brown-Séquard
**at ~T10**" instead of just "hemicord", and lays the ordered-level foundation that central
cord (suspended level, sacral sparing) and cauda equina (below the conus) will build on.

CONTRIBUTING.md flags this exact mechanism: *"a sensory level — findings below a spinal level.
Add a `level_index` to cord sites and let findings carry 'below L?' semantics."*

## Decisions (settled with the user)

1. **Dermatomal granularity.** Levels are specific segments (C2…S5), not coarse regions. A
   stated sensory level like "T10" is interpreted at segment precision.
2. **Pin if given, else level-agnostic.** With a sensory level, the engine pins the segment.
   Without one, it still returns the cross-sectional pattern but reports the level as
   *undetermined* — mirroring practice (no sensory exam, no level) and preserving all current
   cord tests.
3. **Orthogonal coordinate.** The sensory level is orthogonal to the cross-sectional pattern (the
   tracts are identical at every segment). So it is **not** a new finding and **not** a per-segment
   site explosion. Cord sites stay pattern-only (one generic level); `solve()` takes an optional
   sensory-level observation and reports pattern + level as two independent pieces.

## The core insight

Two orthogonal axes:

- **Cross-section** (which tracts, which sides) → the syndrome/eponym. Handled entirely by the
  existing site model + scorer. **Unchanged.**
- **Level** (where along the cord) → supplied by the sensory-level observation, layered on top.

Because they don't interact, the level never changes *which* site wins; it only annotates the
result. This keeps the change small and additive.

## Design

### New module: `src/model/levels.js`

The ordered dermatome coordinate — one clear purpose, no dependencies.

- `CORD_LEVELS` — ordered array of segment names: `C2…C8, T1…T12, L1…L5, S1…S5`.
- `levelIndex(name)` — 0-based position in `CORD_LEVELS`; `-1` if unknown.
- `isBelow(a, b)` — true if segment `a` is below segment `b` (higher index). Foundation for
  "below the level" and later suspended-level logic.
- `regionOf(name)` — `"cervical" | "thoracic" | "lumbar" | "sacral"` from the segment prefix;
  `null` if unknown.
- `landmarkOf(name)` — teaching landmark for the common anchors only
  (`C4→"clavicle"`, `T4→"nipple"`, `T6→"xiphisternum"`, `T10→"umbilicus"`, `L1→"groin"`);
  `null` otherwise. Purely descriptive.
- `isKnownLevel(name)` — convenience boolean.

### Changed: `src/engine/inverse.js`

`solve(observedSet, options = {})` gains `options.sensoryLevel` (a segment string such as `"T10"`,
or absent). The **cross-sectional solve is unchanged**; a small helper computes the level layer.

```
describeLevel(best, sensoryLevel) -> {
  given:    <the raw input or null>,
  applies:  <boolean>,
  segment:  <normalised segment or null>,
  region:   <regionOf(segment) or null>,
  landmark: <landmarkOf(segment) or null>,
  note:     <human-readable interpretation>
}
```

Rules:

| best site | sensoryLevel | `applies` | `note` |
|-----------|-------------|-----------|--------|
| cord | valid segment | `true` | "lesion at or just above <seg> (the sensory level typically sits a segment or two below the lesion)" |
| cord | absent | `false` | "level undetermined — a sensory level is needed to localise the segment" |
| cord | unknown/invalid | `false` | "unrecognised sensory level '<input>'; expected a segment such as T10" |
| non-cord | present | `false` | "a sensory level suggests a spinal cord lesion, but the findings localise to <best.site.id>" |
| non-cord | absent | `false` | "" (not applicable) |

A site is "cord" when `best.site.level === "cord"` — this covers the primitive, hemi, and
bilateral cord sites (all carry `level: "cord"`). `solve` includes `level` in its returned
object: `{ single, best, singleExplainsAll, multi, level }`.

**Input normalisation.** The raw `sensoryLevel` is trimmed and upper-cased before lookup, so
`"t10"`, `" T10 "` and `"T10"` all resolve to segment `"T10"`. `given` preserves the raw input;
`segment` holds the normalised value. Any non-string or empty input is treated as absent.

**The clinical offset is reported, not matched.** With dermatomal precision, the sensory level
usually sits a segment or two *below* the true lesion (spinothalamic fibres cross over ~1–2
levels). We surface that as interpretive text in `note`; we do not build tolerance matching,
because the level is an attached coordinate, not something scored against sites.

### Output / naming

`nameForSite` (the phonebook) is untouched — the eponym stays a pure site→name lookup. The level
lives at the solve/report layer, keeping cross-section and level cleanly separated.

## Modules touched

- **NEW** `src/model/levels.js` — ordered dermatomes + helpers.
- **EDIT** `src/engine/inverse.js` — additive `options.sensoryLevel`, `describeLevel`, `level` in
  the return. Only change to existing engine code.
- **NEW** `test/sensory-level.test.js` — behaviour tests (assert the `level` output).
- **EDIT** `package.json` — test script runs the third file.
- **EDIT** `README.md` — status line notes the sensory level.
- **EDIT** the living architecture artefact — mark the step done on completion (same URL).

## Testing (TDD, red first)

New file `test/sensory-level.test.js`:

1. **Pin** — Brown-Séquard findings + `sensoryLevel:"T10"` → best `left_cord_hemi`,
   `level = {applies:true, segment:"T10", region:"thoracic"}`.
2. **Agnostic** — same findings, no `sensoryLevel` → best `left_cord_hemi`, `level.applies:false`
   (undetermined note).
3. **Second pattern + level** — ASA findings + `sensoryLevel:"T4"` → best `bilateral_cord_anterior`,
   `level.segment:"T4"`, `region:"thoracic"`.
4. **`levels.js` units** — `isBelow("T11","T10")===true`, `isBelow("T10","T11")===false`,
   `regionOf("L1")==="lumbar"`, `landmarkOf("T10")==="umbilicus"`, and `CORD_LEVELS` indices
   are strictly monotonic in order.
5. **Inconsistency** — Weber findings + `sensoryLevel:"T10"` → best `left_midbrain_medial`,
   `level.applies:false` with the "suggests cord but findings localise elsewhere" note.
6. **Graceful invalid** — cord findings + `sensoryLevel:"Z9"` → `level.applies:false`,
   unrecognised-level note, no throw.

**Backward compatibility:** `solve(observedSet)` with no second argument is byte-identical to
today (`level.applies:false`, `given:null`), so the existing 8 brainstem + 5 cord tests stay green.

## Out of scope (explicitly deferred)

- **Central cord / syrinx** — suspended (at-level, not below-level) dissociated loss, commissural
  crossing fibres, sacral sparing. Uses `isBelow` but needs at/below/above semantics not built here.
- **Cauda equina / conus** — new LMN, sphincter, saddle finding types.
- **Level inferred from findings** (arm vs leg myotomes) — overlaps the future root→muscle region.
- Anatomy-table review by a neuroanatomist/neurologist remains an outstanding validation step.

## Verification

`cd Code/neurolocaliser-engine && PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
→ all three suites green (brainstem 8 + cord 5 + sensory-level 6). Node lives in `~/.local`
(no system runtime on this machine); see project memory.

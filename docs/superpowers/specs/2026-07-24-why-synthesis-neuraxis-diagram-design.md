# "Why" synthesis + neuraxis diagram (Sub-project B)

**Status:** design approved 2026-07-24; not yet implemented.

**Depends on:** the unify-localiser-engines and ranking-realism work (uses the engine-owned
`differential()` / `candidateSites()`, and the cord `buildingBlock` change). Branch off `main`.

## Problem

The app's "why" panel echoes the entered findings back per selected site (✓ explained /
✗ unexplained / ⚠ predicted-but-absent). There is no *synthesis* — it says "locked-in because
you ticked arm + leg weakness", not *why* those findings localise the way they do. The clinician
wants tract-level reasoning: "arm and leg weakness localise to the corticospinal tract, where the
fibres run together; a lesion can lie anywhere along its course — internal capsule, cerebral
peduncle, basis pontis, pyramid (all contralateral, above the decussation) or the cord
(ipsilateral, below it)" — plus a diagram of the tract with the candidate sites marked.

## Goal

Add a tract taxonomy the engine *derives* from (in keeping with "derive, don't store"), use it to
(1) generate a synthesis narrative organised around the shared tract(s) and their decussations,
and (2) render a derived, clickable neuraxis diagram of the implicated tract(s) with the candidate
sites as nodes. Non-tract findings fall back to today's per-site "why".

Core tracts in scope: **corticospinal**, **spinothalamic**, **dorsal-column–medial-lemniscus**.
**Corticobulbar** (facial weakness) is a fast-follow, out of scope here.

## Design

### 1. Tract taxonomy — `src/model/tracts.js`

Declarative, new anatomy. A rostro-caudal neuraxis ordering, and one entry per long tract:

```
NEURAXIS (rostral→caudal): cortex · subcortex · midbrain · pons · medulla · cord

corticospinal
  findings:   weak_arm, weak_leg
  course:     cortex/motor · subcortex/corona_radiata · subcortex/internal_capsule
              · midbrain/medial · pons/medial · pons/basis_pontis · medulla/medial (pyramid)
              ══ pyramidal decussation ══  cord/anterior
  decussation: between medulla and cord (cervicomedullary / pyramids)
  laterality:  contralateral to the weakness ABOVE the decussation; ipsilateral BELOW

spinothalamic
  findings:   spinothalamic
  course:     subcortex/thalamus (VPL) · midbrain/lateral · pons/lateral · medulla/lateral
              ══ decussates low, in the cord (anterior white commissure, ~1–2 segments) ══ cord/anterior
  decussation: in the cord, near entry
  laterality:  contralateral to the pain/temperature loss essentially throughout (it crosses low)

dorsal_column   (dorsal column → medial lemniscus)
  findings:   dorsal_sensory, sensory_ataxia
  course:     subcortex/thalamus (VPL) · midbrain/lateral · pons/medial · medulla/medial (nuclei / ML)
              ══ sensory decussation in the medulla (internal arcuate) ══ cord/posterior
  decussation: between medulla and cord (in the medulla)
  laterality:  contralateral ABOVE the medullary decussation; ipsilateral in the cord BELOW it
```

Each tract stores: `id`, `label`, `findings: string[]`, `course` (ordered array of
`{ level, label }` waypoints at **neuraxis-level granularity** — `label` carries the anatomical
detail, e.g. "internal capsule", "cerebral peduncle", "basis pontis / pyramid"), `decussation`
(`{ between: [rostralLevel, caudalLevel] }` or `{ inLevel: "cord" }`), and human `crossingNote`.
Waypoints are level-granular on purpose: site→tract mapping is by *shared findings* (§2), not by
waypoint, so waypoints only drive the diagram bands, the labels, and the consistency guard. Where a
tract passes a level at two parts (corticospinal through `pons/medial` and `pons/basis_pontis`),
that is one `pons` waypoint; both candidate sites still land in the pons band via §2.

The tract courses are new authored anatomy; a test asserts they stay consistent with
`structures.js` (every course **level** actually contains a structure producing one of the tract's
findings — so the model can't silently drift).

### 2. Engine derivation — `src/engine/tracts.js`

```
tractsFor(observedSet, opts) -> [
  {
    tract,                         // the taxonomy entry
    findingsMatched: string[],     // which observed tokens implicated it
    sides: string[],               // body side(s) of those findings (for the diagram laterality)
    sites: [ { site, level, neuraxisIndex, explained } ],  // candidate sites on this tract,
                                                           // ordered rostral→caudal by NEURAXIS
    decussation                    // passthrough for the diagram + narrative
  }, ...
]
```

- A tract is **implicated** when `observedSet` shares a finding id with `tract.findings`.
- A candidate site is **on the tract** when `expectedFindings(site) ∩ tract.findings ≠ ∅` — keyed on
  *shared findings*, not `(level, part)`, so composites map correctly (the hemicord and the
  bilateral cord composites carry corticospinal fibres even though the `cord/anterior` primitive is
  now a `buildingBlock`; the whole-MCA carries it at cortex/subcortex). Candidate sites come from
  `differential(observedSet, opts)` so the known-negative exclusion + ranking already applied.
- Sites are ordered by the `NEURAXIS` index of their `level`.

This is pure/engine-testable and returns **structured facts** — no prose. The app composes the
sentences and the SVG from these facts.

### 3. Synthesis narrative (rewrites `whyBlock` in `app/app.js`)

Leads with tract reasoning composed from `tractsFor`:

- **Single tract:** "*[Arm and leg weakness] localise to the [corticospinal tract] — [the fibres
  run together]. A lesion can lie anywhere along its course: [site labels, rostral→caudal],
  [contralateral above the pyramidal decussation, ipsilateral in the cord below it].*"
- **Multiple tracts:** one clause per implicated tract with its crossing, then the **convergence** —
  e.g. ipsilateral weakness (corticospinal, below the pyramids) **+** contralateral pain/temp
  (spinothalamic, crossed low) ⇒ the two decussations differing is what pins a **hemicord**.
- Then a **trimmed per-selected-site note** (what this specific site adds, why it is the commonest)
  replaces the raw ✓/✗ list. The full predicted-but-absent detail stays available in a collapsible.
- **Fallback:** when `tractsFor` returns empty (non-tract findings — cranial-nerve nuclei, cortical
  syndromes), render today's per-site "why" unchanged.

The prose is generated from the derived facts (tract label, ordered site labels, decussation,
laterality) — no stored per-pattern paragraphs.

### 4. Derived neuraxis diagram — `app/neuraxis-diagram.js`

A builder `neuraxisSVG(tractsForResult, { selectedId }) -> svgString`:

- A vertical neuraxis column, cortex at top → cord at bottom, one band per `NEURAXIS` level.
- Each implicated tract drawn as a poly-line down its course that **visibly crosses sides at its
  decussation** (the line steps from one column to the other at the decussation band).
- Each candidate site a **node** placed in its level band; the selected site emphasised.
- Nodes carry `data-k="<site.id>"`; the app wires clicks to set `S.selected` (shared with the
  differential list), so clicking a node selects that lesion and vice-versa.
- Multi-tract input overlays each tract (distinct stroke), each with its own decussation band.
- Self-contained inline SVG (no external assets), theme-aware via the app's CSS variables.

### 5. Wiring

`renderResults` computes `tractsFor` once, passes it to the rewritten `whyBlock` (narrative) and to
`neuraxisSVG` (diagram, rendered in the results pane near the "why"). Node clicks reuse the existing
`S.selected` + `renderResults` path.

## Tests

`test/tracts.test.js`:
- `weak_arm@left + weak_leg@left` implicates **corticospinal** and no other core tract.
- Its `sites` are ordered rostral→caudal by neuraxis (cortex/subcortex before pons before medulla
  before cord composites).
- The corticospinal `decussation` is between medulla and cord; laterality flips there.
- Brown-Séquard input (`weak_arm@left + dorsal_sensory@left + spinothalamic@right`) implicates
  **both** corticospinal and dorsal-column (and spinothalamic), each with the right decussation.
- Non-tract input (e.g. `dysarthria@none` / a pure cranial-nerve finding) yields `[]` (fallback).
- **Consistency guard:** every tract `course` waypoint `level` contains a structure in
  `structures.js` producing one of that tract's findings.

`test/neuraxis-diagram.test.js` (pure string/DOM-free builder):
- `neuraxisSVG` returns an `<svg>` containing a node with `data-k` for each candidate site on the
  tract, and a crossing at the decussation band.

Both wired into `package.json` + the README chain. All existing suites stay green (additive:
`tractsFor` is new; `whyBlock` rewrite is app-only and guarded by the fallback).

## Non-goals

- Corticobulbar and any tract beyond the core three (fast-follow).
- No change to localisation, ranking, causes, or the scored path.
- The diagram is schematic (teaching), not anatomically-scaled.
- No new UI framework — inline SVG string, same zero-build app.

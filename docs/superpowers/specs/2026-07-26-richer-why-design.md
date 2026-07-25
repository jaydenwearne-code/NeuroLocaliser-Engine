# Richer Why — composed anatomy + derived discrimination

**Status:** design approved 2026-07-26; not yet implemented.

**Depends on:** the tract taxonomy (`tracts.js` / `engine/tracts.js`) and the output cards. Branch off `main`.

## Problem

The Why card's synthesis is a thin one-liner ("corticospinal tract — the fibres run together … a
lesion can lie anywhere along its course: [site list]"). It restates the WHERE list and adds little
reasoning. The clinician wants (a) a richer anatomical narrative (origin, blood supply, convergence,
descent, decussation) and (b) the *diagnostic* reasoning — why the selected site is most likely and
why it is **not** the other candidate sites ("a lacune here hits only these fibres → the isolated
deficit; a cortical/brainstem/cord lesion would add its own signs — absent, so review to exclude").

## Goal

Replace the synthesis paragraph with three short, derived blocks — **Course** (composed anatomy),
**Why this site** (parsimony), **Why not elsewhere** (level-grouped exclusions) — and expand the
neuraxis diagram by default. The anatomy is composed from structured waypoint fields; the
discrimination is derived from the candidate set. No localisation/engine-model change.

## Design

### 1. Model enrichment (`src/model/tracts.js`)

Each course waypoint gains:
- **`detail`**: the anatomical structure at that level as a noun phrase ("primary motor cortex",
  "corona radiata and internal capsule", "cerebral peduncle", "basis pontis", "medullary pyramid",
  "lateral corticospinal tract").
- **`supply`**: the vascular territory ("MCA to the face/arm, ACA to the leg"; "lenticulostriate
  perforators"; "basilar perforators"; "anterior spinal / vertebral"; "anterior spinal artery").

Added for all 4 core tracts (corticospinal, spinothalamic, dorsal-column, corticobulbar). A
consistency guard (extending the existing course check) asserts every waypoint has `detail` + `supply`.

### 2. Composed narrative — `tractNarrative(tract)` (`engine/tracts.js`, pure/testable)

Assembles a sentence from the waypoints' `detail` + `supply`, the `decussation`, and `crossingNote`,
walking rostral→caudal and marking where the tract crosses. Target prose (tuned by eye; tests pin key
substrings, not exact wording):

> *"The corticospinal tract arises in the primary motor cortex (MCA to the face/arm, ACA to the leg),
> its fibres converging through the corona radiata and internal capsule (lenticulostriate
> perforators), then descending through the cerebral peduncle, basis pontis and medullary pyramid
> before decussating at the pyramidal decussation into the lateral corticospinal tract of the cord —
> contralateral to the weakness above the decussation, ipsilateral in the cord below it."*

Returns a string. Reused per implicated tract (multi-tract → one Course each).

### 3. Derived discrimination — `whyNotOthers(observedSet, selectedSite, opts)` (`engine/tracts.js`, testable)

- Level buckets: `bucketOf(level)` → `cortical` (cortex) · `deep subcortical` (subcortex,
  aphasia_subcortical, thalamus) · `brainstem` (midbrain, pons, medulla) · `spinal cord` (cord).
- For the tract(s) that contain `selectedSite`, gather the other candidate sites; for each, the
  **extra** findings = `expectedFindings(other) \ expectedFindings(selected) \ observed`.
- Group extras by the other site's bucket; per bucket keep the discriminating findings (prefer
  `LOCALISING`, dedupe by finding id, limit ~4), and attach the bucket's **territory** (from the
  tract's waypoint `supply` at a representative level of that bucket).
- Returns `{ selectedBucket, buckets: [{ bucket, label, supply, findings: [{id, desc}] }] }`, ordered
  rostral→caudal. Empty findings-buckets are dropped.

**Why-this (parsimony)** is composed in the app from this + `prevalenceOf(selectedSite)`: "the deficit
is confined to <tract> fibres with no accompanying signs, so the lesion lies where the tract runs in
relative isolation — a small deep lesion such as this <site>" (+ "lesions here are also common" when
the prevalence tier is common).

### 4. Presentation (`whyCard` in `app/app.js`)

Replaces the `synthesisHTML(tf)` paragraph with, per implicated tract, a **Course** line
(`tractNarrative`), then a single **Why this site** line (parsimony), then **Why not elsewhere** —
the `whyNotOthers` buckets rendered as: *"If <bucket> (<territory>) — you'd also expect
<findings>."* followed by a muted "None reported — examine specifically to exclude." The UMN/LMN line
and the per-site "why" (collapsed) stay. The **neuraxis diagram now renders expanded** (the
`nx-toggle` `<details>` gets `open`), since the prose is the primary reasoning and the diagram supports
it.

Fallback (non-tract findings): unchanged — the per-site "why" expanded, no Course/discrimination.

### 5. Tests (`test/tracts.test.js`, additive)

- Consistency: every core-tract waypoint has `detail` + `supply`.
- `tractNarrative(corticospinal)` contains "primary motor cortex", "MCA", "ACA", "internal capsule",
  and "pyramidal decussation".
- `whyNotOthers({weak_arm@left, weak_leg@left}, internal_capsule_site)`:
  - a **cortical** bucket whose findings include `neglect`;
  - a **brainstem** bucket with a cranial-nerve sign (e.g. `gaze_palsy` or `facial_weakness`);
  - a **spinal cord** bucket with a crossed sensory sign (e.g. `spinothalamic` or `sensory_ataxia`);
  - each bucket carries a non-empty `supply`.
- The existing tract/tractsFor/diagram tests stay green (additive fields + new functions).

## Non-goals

- No change to localisation, ranking, causes, or the exam tree.
- Discrimination is limited to sites on the selected lesion's implicated tract(s) (the neuraxis story);
  not a full cross-differential essay.
- Wording is tuned by eye; tests assert substrings/structure, not exact prose.

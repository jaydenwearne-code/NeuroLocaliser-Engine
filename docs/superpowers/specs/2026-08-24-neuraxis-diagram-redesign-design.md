# Neuraxis diagram: an anatomical figure, not a list with a line

**Status: SPEC, not implemented. SPLIT INTO TWO INCREMENTS** — see §The split. Increment 1 ships on its
own and needs no clinical review; increment 2 carries all the authored anatomy and the model change.

## The split

The first draft of this spec was one increment carrying the input contract, the anatomy, pins, clustering,
the crop, redrawn tract courses, four cross-sections and a model change. That is larger than any single
increment in this project's history, and it welds work that needs no review to work that cannot ship
without one. Split on that seam, at the owner's direction.

### Increment 1 — the figure and the candidates (this plan)

Fixes the eight blank examples and every layout defect in §1–5. **Reviewable as code, not as anatomy** in
one respect that matters: nothing in it asserts a new clinical fact. The figure is a schematic the reader
recognises, not a claim about where a tract runs.

- input contract: candidates from `solve()`, tracts optional (§1)
- `app/neuraxis-figure.js`: authored half-figure, anchors, zones, crop boxes
- `neuraxisSVG()` + `neuraxisIndex()`
- pins, clustering, shared numbering, the duplicate-label fix (§5)
- the derived crop and the locator
- side convention and captions
- a **minimal tract overlay**: implicated pathways drawn on the figure with colour, dash, direction arrow
  and a named legend, **using the decussation data that exists today**
- `test/neuraxis-diagram.test.js` rewritten, `test/neuraxis-figure.test.js` new

**Accepted limitation, and it is NOT a regression.** With today's data, `cerebellar`, `mlf` and
`trigeminothalamic` draw no crossing — exactly as they do now (§6). Increment 1 leaves that where it is
rather than guessing; increment 2 fixes it with citations. Stating it here so it is a known state, not a
defect someone rediscovers.

### Increment 2 — the tracts, to Last's

Everything that asserts an anatomical fact, so the whole of it goes to the owner in one review round
instead of two.

- the three missing `decussation` entries, with citations (§Model data)
- the Last's-accurate course refinements (§Tracts: the medial lemniscus drift, the pontine bundles, the
  oculosympathetic/spinal-lemniscus adjacency)
- `app/neuraxis-sections.js`: the four cross-sections and the cord's somatotopic lamination
  (§Cross-sections)
- `neuraxisSection()`, and `test/neuraxis-sections.test.js`

## Source

Cross-checked against **Last's Anatomy, 9th edition, chapter 7 (Central Nervous System)**, supplied by the
owner: brainstem pp. 606–614, brainstem tracts pp. 612–613, spinal cord and its tracts pp. 621–625.
Cross-sections Figs 7.25–7.31 (midbrain → lower medulla) and Fig 7.35 (cord). Page numbers below are the
book's own printed page numbers.

## How this was found

The owner asked to improve the aesthetic and the diagrammatic quality of the diagram, then — seeing the
first proposal — asked specifically that the tracts be better illustrated as they course through the
structures, and supplied Last's to cross-check the courses and their relationships to one another.

The diagram was driven in the browser across all four worked examples and all thirteen cross-site
archetypes, rendering real `neuraxisSVG()` output through a harness importing the real modules.

## What is actually wrong

### 1. Over half the shipped examples render NO DIAGRAM AT ALL

Measured across `EXAMPLES` + `CROSS_SITE_EXAMPLES` (17 cases):

| tracts | candidates | case |
|---|---|---|
| 4 | 21 | Wallenberg |
| 3 | 18 | Metastases; Embolic shower |
| 2 | 47 | NMOSD |
| 2 | 4 | Primary CNS lymphoma |
| 1 | 26 | Multiple sclerosis; Neurosyphilis or HIV |
| 1 | 25 | Paraneoplastic syndrome |
| 1 | 4 | Two lesions |
| **0** | **0** | **Foot drop, Cauda equina, Neurosarcoidosis, Vasculitis, Mononeuritis multiplex, Leptomeningeal disease, NF2, MND** |

**Eight of seventeen are blank**, including two of the four worked examples — and Foot drop is the one the
2026-08-16 worked-examples pass chose specifically to teach the narrowing (root vs nerve), which is exactly
a question a picture answers better than prose.

**The cause is the input contract.** Candidate sites are harvested *from* `tractsFor()`: `tf[i].sites`. A
picture with no implicated long tract therefore has no sites, and a diagram with no sites renders `""`. The
figure must instead be driven by the **candidate sites from `solve()`**, with tracts as an overlay.

### 2. The vertical axis stops being a neuraxis

`NEURAXIS` holds seven levels; `SITES` uses **eighteen**. On Wallenberg the axis reads `Cortex, Subcortex,
Midbrain, Pons, Medulla, Cord` — correct — then continues `Hypothalamus, Sympathetic, Skull Base,
Cerebellum, Combined Degeneration, Thalamus, Aphasia Subcortical, Guillain Mollaret`. The tail is in no
anatomical order, and three of those are not anatomical levels at all.

### 3. It is a flat list with a decorative line

All 21 Wallenberg candidates sit in one column at a single x, regardless of side. **20 are on the patient's
left and one on the right, and the diagram cannot show that** — the one fact a localisation tool most needs
to make visible. Four tracts share two lanes at `stroke-width:1.5; opacity:.55`, indistinguishable and
unlabelled.

### 4. Collisions and dead space

The decussation caption overlaps the band label and clips off the left edge (`x` can go negative). On
*Two lesions* every node is at Cortex, followed by ~200px of empty bands, and the crossing line dangles
into nothing.

### 5. Duplicate rows

MS renders "Anterior choroidal artery syndrome" twice and "Sensorimotor lacune (thalamocapsular)" twice.
Dedup is by `site.id`, which differs left from right, but `plainSiteName()` drops the side for these.
**Rows the reader cannot tell apart are a defect, not density.**

### 6. Three pathways draw no crossing, and it is MISSING DATA, not a drawing bug

On Wallenberg only one of four decussations renders. **An earlier draft of this spec blamed the diagram;
that was wrong.** Four of the ten pathways carry `decussation: {}`, so there is nothing to draw:

| pathway | `decussation` | correct? |
|---|---|---|
| `oculosympathetic` | `{}` | **Yes — it is uncrossed throughout**, which is why Horner's is ipsilateral |
| `trigeminothalamic` | `{}` | No — the trigeminal lemniscus crosses |
| `cerebellar` | `{}` | No — the superior cerebellar peduncles decussate |
| `mlf` | `{}` | No — abducens internuclear neurons cross to the contralateral MLF |
| `central_tegmental` | `{}` | Left alone this increment (§Model data) |

## Cross-check against Last's

### Confirmed

The modelled courses are sound. Last's backs the corticospinal route (cortex → corona radiata → internal
capsule → crus → basis pontis → pyramid → decussation → lateral corticospinal tract, p. 612), the sensory
decussation as internal arcuate fibres (p. 613), the genu for corticonuclear fibres (p. 612), and the
three-neuron oculosympathetic chain (pp. 613, 625).

An independent confirmation worth recording: p. 612 — *"The superior cerebellar peduncles enter the
midbrain tegmentum and decussate at the level of the inferior colliculi."* That is the fact behind the
`scp_midbrain` crossing bug found while authoring the anatomy review sheet and fixed in PR #9.

### Detail that makes the picture teach

These are the facts the redesigned figure is built to show. Each is drawable, and each explains a syndrome
the app already localises:

- **Somatotopic lamination in both columns** (Fig 7.35 labels S/L/T/C on each). Posterior column: *"fibres
  from the lowest parts of the body lie nearest the midline, and incoming fibres are added progressively
  laterally"* (p. 623) — sacral medial, cervical lateral. Anterolateral tract: *"sacral segments lying most
  laterally, while those from cervical segments are the most deeply placed"* (p. 624). This is **why a
  central cord lesion spares the sacral fibres**.
- **The anterolateral tract lies in front of the lateral corticospinal tract**, with the denticulate
  ligament attachment as the landmark between them (pp. 624, 637) — the plane used for anterolateral
  cordotomy.
- **The descending sympathetic tract runs in the region of the spinal lemniscus** (p. 613). This single
  adjacency explains half of Wallenberg: one lateral medullary slice gives a Horner's *and* contralateral
  body pain and temperature loss.
- **The medial lemniscus starts adjacent to the midline in the medulla and deviates laterally** as it
  ascends through pons and midbrain (p. 613).
- **Corticospinal detail** (p. 612): anterior two-thirds of the posterior limb of the internal capsule;
  central three-fifths of the crus with **arm fibres medial to leg**; **85%** cross in the motor
  decussation; the uncrossed remainder becomes the anterior corticospinal tract and crosses lower.
- **Anterior spinocerebellar crosses, ascends to the midbrain, then doubles back down into the superior
  cerebellar peduncle**; posterior spinocerebellar stays ipsilateral (pp. 613, 625).

### The structural observation

**Last's teaches tracts almost entirely in cross-section** — Figs 7.25–7.31 for the brainstem and 7.35 for
the cord. *Relationship to one another* is a cross-sectional fact; a longitudinal course view structurally
cannot show it. Hence §Cross-sections.

## Decisions

Owner's rulings from the design conversation:

1. **The diagram answers WHERE and WHY together** — an anatomical picture of where the lesion is, with the
   implicated pathways running through it.
2. **Hand-drawn base, derived overlay.** The anatomy is authored once; pins, tracts, decussations,
   selection and crop are derived. "Derive, don't store" governs *content*; the drawing is presentation.
3. **Anatomical convention: the patient's left is on the left of the page.** It is the opposite of a scan,
   so **both sides are captioned on the figure** rather than left implicit.
4. **Zoom to the implicated region**, with a locator (§Zoom).
5. **Cross-section insets, with somatotopic lamination** (§Cross-sections).
6. **Fill the missing decussations, flagged for clinical review** (§Model data).

Three layouts were mocked with real Wallenberg data and compared in the browser:

- **A — coronal figure, labels in the gutters.** 20 labels on one side force the canvas to 1260px wide,
  shrinking the figure and dropping effective type to ~6px; the leader lines converge into an unreadable
  fan. Direct labelling does not survive the candidate count.
- **B — sagittal profile with left/right rails.** Rejected. A profile has no left and right, so laterality
  moves onto two abstract rails and the labels collapse back into one column — today's flat list with a
  silhouette beside it, and crossings stop being anatomical events.
- **C — coronal figure, numbered pins, index beneath.** Chosen.

**What the mockups surfaced:** on Wallenberg, **7 of 21 candidates live in the sympathetic chain and the
skull base** — a third of them. Those are not edge cases to annex off the side of a CNS drawing, and the
oculosympathetic path is the entire reason Wallenberg has a Horner's.

## Architecture

### `app/neuraxis-figure.js` — new, CONTENT ONLY

The authored half-figure path data, the anchor table, zone offsets, region captions, crop boxes. **Imports
nothing from the engine and contains no logic**, so the anatomy can be reviewed as anatomy without reading
UI code — the same split as `src/data/multifocal.js` against `src/engine/multifocal.js`.

**Authored as ONE HALF and mirrored** (`transform="scale(-1,1) translate(-2·MX,0)"`). Symmetry holds by
construction and there is no second copy to drift — the reasoning behind `markSVG()` in `brand.js`.

Covered: cerebrum with deep grey matter and internal capsule, brainstem (midbrain / pons / medulla),
cerebellar hemispheres, cord with segmental root stubs, conus and cauda, plexus, peripheral nerve to a
limb, skull base plate, the three-neuron oculosympathetic chain, globe and pupil, optic nerve and chiasm.

### `app/neuraxis-sections.js` — new, CONTENT ONLY

The cross-sections (§Cross-sections). Separate from the figure file because it is a different drawing at a
different scale reviewed against different textbook figures, and because a single file holding both would
be the largest file in `app/`.

### `app/neuraxis-diagram.js` — rewritten, LOGIC ONLY

Stays a **pure string-in / string-out function, DOM-free and node-testable** — that property is why the
current module is testable at all and it is not given up.

**Three exports, not one return shape:**

- `neuraxisSVG(candidates, tracts, opts)` → the longitudinal `<svg>`, and nothing else. It keeps returning
  a string starting `<svg`, which the existing suite asserts.
- `neuraxisIndex(candidates, opts)` → the numbered index as HTML.
- `neuraxisSection(level, tracts, opts)` → the cross-section `<svg>` for one level, or `""`.

One function returning SVG-plus-HTML was rejected: it makes a function named `…SVG` return something that
is not an SVG, and welds independently testable pieces into one string. `app.js` composes the three.

### `app/app.js`

One call site changes to pass the differential alongside the tracts, plus a handler for expanding a
cluster. Click delegation on `[data-k]` is unchanged in shape.

## Anchors — level, optionally nudged by zone

**Measured before authoring, and two assumptions in the first draft were wrong.**

`ANCHOR` is authored and keyed by **level**, giving `{dx, dy}` from the midline with `dx` flipped by side.

**It must cover 36 levels, not 18.** `SITES` uses 18, but the diagram receives `candidateSites()`, which
concatenates the composers and yields **36 levels across 377 sites** — the extra 18 are `cauda`, `conus`,
`plexus`, `motor_unit`, `thalamus`, `hypothalamus`, `corpus_callosum`, `locked_in`, `pseudobulbar` and the
rest. Keying the invariant to `SITES` would have left half the table unwritten. **The invariant is over
`candidateSites()`.**

Level ids are globally unique, so there is no `level|part` collision here — unlike `PART_LABEL`,
`vascular.js` and `topography.js`, which key by `${level}|${part}`. **Do not key this table by part name.**

**Zone is OPTIONAL, and that is a measurement, not a preference.** Of the **192 part names** in
`candidateSites()`, only **15** declare a zone: `anterior`, `anterior_canal`, `anterior_choroidal`,
`anterior_horn`, `anterior_temporal`, `basis_pontis`, `central`, `lateral`, `medial`, `paracentral`,
`posterior`, `posterior_canal`, `posterior_cord`, `watershed_anterior`, `watershed_posterior`. The first
draft proposed "an authored override map for parts whose name does not say it" — that map would hold
**177 entries**, which is not a cheap middle ground but a full authored anatomical table, and one that
asserts facts needing clinical review.

So: **where the part name declares a zone, the pin is nudged; otherwise `zone` is `null` and the pin sits
at its level's anchor.** This is not a compromise — the 15 that declare one are precisely the
cross-sectional brainstem and cord names where the distinction is clinically load-bearing (lateral versus
medial medulla is the difference between Wallenberg and a medial medullary syndrome). The other 177 name
gyri, nerves, roots and canals, for which "medial or lateral" is not the organising idea.

`zone` is derived by pattern from the part name — **no authored table in increment 1** — so nothing here
asserts an anatomical fact and nothing here needs review.

### Sides: `bilateral` and `midline` are 45 of 377 candidates

The first draft addressed only left and right. Measured: **left 166, right 166, bilateral 27, midline 18.**

- `midline` pins at `dx = 0`.
- `bilateral` also pins at `dx = 0`, drawn as a horizontally elongated capsule spanning the midline.

**One candidate is always exactly one pin**, so the shared numbering with the index holds. A bilateral
candidate is distinguished from a midline one **by the pin's FORM, not by position or hue** — the rule the
danger chip already follows. Drawing a bilateral candidate as two mirrored pins was rejected: it breaks
1 candidate = 1 pin and would make the index numbering ambiguous.

**Invariants (`test/neuraxis-figure.test.js`):** every level in `candidateSites()` has an anchor; every
one of the four `side` values places a pin; and a part whose name declares a zone resolves to that zone
while any other part resolves to `null`. Assert the RULE, not the values, so a new site cannot land
undetermined — the rule `topography.js` already follows for `surface`.

Full per-part anchoring (the 202-key `vascular.js` / `topography.js` shape) is **deliberately not in this
increment**, and on the measurement above it would be increment-2 work in any case, since it asserts
anatomy.

## Cross-sections  *[increment 2]*

Four canonical sections, authored from Last's and keyed by **level**:

| level | drawn from | key contents |
|---|---|---|
| `midbrain` | Fig 7.25 (superior colliculus) | crus with corticospinal and corticonuclear fibres (corticonuclear medial), substantia nigra, red nucleus, oculomotor nucleus, MLF and tectospinal ventral to the aqueduct, medial and spinal lemnisci dorsolaterally |
| `pons` | Figs 7.27 / 7.28 | corticospinal and corticonuclear fibres **broken into bundles among the pontine nuclei**, pontocerebellar fibres, medial lemniscus, spinal and lateral lemnisci, trigeminal nuclei, facial and abducens nuclei, MLF |
| `medulla` | Fig 7.29 (open medulla) | pyramid, medial lemniscus adjacent to the midline, inferior olivary nucleus, spinal tract and nucleus of the trigeminal, nucleus ambiguus, spinal lemniscus, inferior cerebellar peduncle, hypoglossal and vagal nuclei |
| `cord` | Fig 7.35 | posterior white column (gracile medial, cuneate lateral), anterolateral tract, lateral corticospinal tract, denticulate ligament, spinocerebellar tracts, lateral horn, grey matter |

The section for the **selected candidate's level** renders beside the longitudinal figure. Implicated
tracts are highlighted in their true position within the slice, in the same colour they carry on the
longitudinal view — the colour is the link between the two drawings, so no legend is needed twice. The
selected candidate's **zone** is shaded, so "lateral medulla" is a region of the slice rather than a word.

**Somatotopic lamination is drawn on the cord section**, on both the posterior column (sacral medial →
cervical lateral) and the anterolateral tract (sacral superficial → cervical deep), with the **denticulate
ligament** marked between the anterolateral and corticospinal tracts.

Where a level has no authored section, no section renders. **It must never fall back to a generic slice** —
that is the `sieveGenerics` mistake the project deleted engine-wide on 2026-08-11: a checklist must not
manufacture content to fill itself.

**Known limit, recorded deliberately:** the medulla section is the *open* medulla, where Wallenberg and the
medial medullary syndrome sit. **Both the pyramidal and the sensory decussations are in the closed medulla**
(Figs 7.30, 7.31), so the section cannot show them. A second medullary variant is a candidate follow-up,
not this increment.

## Pins and clustering

Slot = `level | side | zone`. Up to **3** candidates fan in place; above that the slot draws **one pin
badged with the count**. NMOSD is the stress case at **47 candidates**, so this is load-bearing.

**The builder emits both the cluster pin and the fanned pins**, the latter hidden by a class; `app.js`
toggles `.open` on click. No interaction logic crosses into the builder.

**The index always lists every candidate**, whatever the figure collapses. Nothing is ever only-hidden — a
cluster is a drawing decision, never a filter on the differential.

Numbering follows the order of `solve()`'s differential, so pin 1 is the leading candidate and the figure
and the Where card agree on which candidate is which. **The index and the pins share one numbering.**

Where two candidates resolve to the same display name, **the side is appended** to disambiguate (§5).

## Tracts

Every implicated pathway is drawn along its true course, on the correct side, crossing at its decussation,
with a direction arrow and a **named legend**. Wallenberg draws four: spinothalamic, oculosympathetic,
cerebellar, trigeminothalamic.

**Increment 1** draws each pathway along its modelled course with colour, dash, arrow and legend.
**Increment 2** refines the course to Last's. Three specifics are load-bearing there, because each is a
fact a reader can carry away:

- the **medial lemniscus hugs the midline in the medulla and drifts laterally** climbing to the thalamus;
- the **corticospinal tract breaks into bundles through the basis pontis** and recollects as the pyramid;
- the **oculosympathetic fibres run with the spinal lemniscus** through the lateral brainstem.

Measured ceiling across all 17 examples is **4 simultaneous tracts**. The palette carries **5**
distinguishable stroke colours and cycles beyond.

**Distinguished by FORM as well as hue** — each tract carries a dash pattern as well as a colour, so the
lines stay separable in greyscale and for a colourblind reader. This is the rule the danger chip already
follows (`RED` and `EMERGENCY` are filled chips with a ⚑ glyph so a tired reader never has to tell
`#d36d52` from `#b32b1c` at 10px).

New tokens `--tract-1` … `--tract-5`, defined in **all four** palette blocks. Four blocks stay four —
`test/brand.test.js` counts them. They are strokes, never text, and are declared in `NOT_TEXT` in
`test/contrast.test.js`.

## Model data  *[increment 2]*

`decussation` is consumed **only** by `app/neuraxis-diagram.js` and by `tractNarrative()` in
`src/engine/tracts.js`. It **never reaches the solver** — laterality comes from `findings.CROSSES` and
per-structure `crosses`, resolved in `forward.bodySideFor()`. Filling these entries changes what is drawn
and narrated and **cannot change any localisation**. Verified by grep before this was scoped.

Three entries to add, each with its Last's citation:

| pathway | proposed decussation | source |
|---|---|---|
| `trigeminothalamic` | crosses in the brainstem to join the contralateral medial lemniscus as the trigeminal lemniscus | p. 613 — the spinal nucleus's axons *"run up to join the medial lemniscus"* |
| `cerebellar` | decussation of the superior cerebellar peduncles, in the midbrain at inferior colliculus level | p. 612, and Fig 7.26 labels it directly |
| `mlf` | abducens internuclear neurons cross the midline to the contralateral MLF, in the pons | p. 613 |

`oculosympathetic` **stays `{}` and that is an assertion, not an omission** — it is uncrossed throughout,
which is why Horner's is ipsilateral. A test pins it, so nobody later "fixes" the gap.

`central_tegmental` is left this increment. The Guillain–Mollaret triangle crosses twice (dentate → 
contralateral red nucleus; olivocerebellar back again), so a single `decussation` field misrepresents it
either way. Recorded as a known gap rather than answered badly.

**Also flagged, NOT changed:** the spinothalamic label reads *"anterior white commissure (crosses within
1–2 segments)"*. Last's p. 624 says the crossing *"takes place more and more obliquely at higher levels so
that in the cervical region the decussation may require the height of four or five segments"*. The 1–2
figure is the usual clinical shorthand. This is clinical content behind a review gate closed on
2026-08-21, so it is the owner's call, handled as its own change.

> **⚠ CLINICAL REVIEW REQUIRED before merge**, on three bodies of new content: the three decussation
> entries above, the authored anatomy in `neuraxis-figure.js`, and the four cross-sections in
> `neuraxis-sections.js`. Every comparable authored table in this project (the 104-key vascular, the
> 202-key topography, the 202 site labels) went through the owner's sign-off, and the 2026-08-16 labels
> pass needed three passes because **a mechanical test cannot see whether a drawing is anatomically true**.

## Zoom, and the locator

The full figure is authored once. **Zoom is a derived viewBox crop**: union the crop boxes of the
compartments in play, pad, emit. No second drawing and no detail levels — a crop cannot disagree with the
figure it crops.

Crop boxes are per **compartment** (`compartmentOf()`), not per level, so a crop always contains whole
anatomical structures rather than slicing a shape in half.

The cost the owner accepted was losing a stable frame. It is bought back with a **locator**: a small
whole-neuraxis thumbnail in the corner with the crop rectangle marked. Foot drop then reads "lumbar cord →
peroneal nerve, and here is where that sits in the whole thing."

## Theming and the standing guards

- **`--terra` allowlist (`test/brand.test.js`).** The selected pin and its index row **are the answer**, so
  they are justified additions — the argument that admitted `.cause.sel` and `.px-chip`. Nothing else in
  the diagram takes terracotta. A hover state, a focus ring or a tract colour is neither identity nor the
  answer; if one is proposed it is deleted rather than allowlisted, as the terracotta focus ring was.
- **No inline accent in JS.** `app.js` emitting `<span style="color:…accent…">` bypassed the stylesheet
  scan once already, because `brand.test.js` slices `<style>`→`</style>`. Everything here uses classes.
- **Contrast.** Anatomy strokes specified as `--line` are invisible in dark (`#26364d`); they move to
  `--muted` at reduced opacity. Any rule setting both a background and a colour is checked in all four
  palette blocks.
- **The theme is not part of the case.** Nothing here enters `S`, `encodeCase()` or `syncURL()` beyond the
  already-round-tripped selected site.

## Testing

`test/neuraxis-diagram.test.js` is rewritten, keeping the `data-k` and `data-sel="1"` contracts that
`app.js` delegates on. New assertions:

- a case with **zero implicated tracts still renders a figure** (Foot drop, Cauda equina);
- `neuraxisSVG()` still returns a string beginning `<svg`;
- **every candidate appears in the index**, including those collapsed into a cluster;
- a `bilateral` and a `midline` candidate each render exactly one pin, on the midline, distinguishable
  from each other;
- **no two index rows carry identical text**;
- a left-sided case pins left of the midline and a right-sided case pins right of it;
- the crop for a peripheral case excludes the cerebrum, and the locator still renders the whole figure;
- **every implicated tract whose model carries a decussation draws a crossing**, and `oculosympathetic`
  draws none — the latter asserted in increment 1 so the correct empty entry cannot be "fixed" away.

`test/neuraxis-figure.test.js` (new, increment 1) asserts the anchor and zone rules.

*Increment 2 adds:* a level with no authored section renders no section, never a generic one; and
`test/neuraxis-sections.test.js` asserting each section names the tracts Last's places in it and that the
cord section carries both laminations.

Each new suite is added to the `test` script in `package.json` and the README chain as it lands.

## Out of scope

*(of the redesign as a whole — for what is merely deferred to increment 2, see §The split)*

- Per-part 202-key anchoring (§Anchors).
- A second medullary cross-section for the closed medulla and its two decussations (§Cross-sections).
- `central_tegmental`'s decussation, and the spinothalamic label (§Model data).
- Any other engine or model change.
- Atlas mode's own rendering.
- The `--mimic` / `--iatro` dead tokens from the 2026-08-22 contrast pass.

---

# Amendment (2026-08-25): artwork, regional views, and the tract-geometry bug

Increment 1 shipped and was reviewed in the browser by the owner, who set the direction for the rest.

## What the owner reported, and what measurement confirmed

1. **Tract lines cross where no decussation exists.** Confirmed and quantified: **Wallenberg alone renders 16
   pairwise crossings between tract paths, none at a decussation.**
2. **Tract lines cut corners.** Same root cause.
3. **No neighbouring anatomy** — a common fibular palsy gives no sense that the FIBULAR NECK is the
   compression site.
4. **The drawings look primitive.**

**1 and 2 are one bug.** Tracts are polylines through *shared level anchors*: the medulla anchor is a
single point, so the spinothalamic, oculosympathetic, cerebellar and trigeminothalamic paths all pass
through the same coordinate and are *guaranteed* to converge. One waypoint per level also makes the
cortex→cord segment a straight chord across the brain.

**The fix** is per-tract, per-level cross-sectional geometry — which Last's already supplied and this spec
already records (§Cross-check against Last's) but the drawing never used: corticospinal in the central
three-fifths of the crus with arm medial to leg; the medial lemniscus hugging the midline in the medulla
and drifting laterally; the spinal lemniscus at the lateral then dorsal edge of it with the descending
sympathetic fibres alongside. Plus dense waypoints and smooth curves so a path follows a contour instead
of chording across it.

**THE INVARIANT: no two tract paths may intersect except at a declared decussation.** Mechanically
testable by pairwise segment intersection, and it would have failed on day one.

## Artwork: OPTION D — public-domain VECTOR plates, recoloured (owner's ruling)

Copyright is the hard constraint: **Last's figures cannot ship** — it is in copyright and the app is
publicly deployed. Last's is read for anatomy, never copied.

Four options were built with real assets and compared in the browser. **Option D won**: a public-domain
*vector* plate can be de-labelled and have its hard-coded 1918 colours mapped onto the app's palette by
LUMINANCE, so it themes, crops and highlights like authored SVG while carrying real anatomical geometry.
Option B (raster base) was rejected on measurement: a plate stays a white rectangle in dark mode, its
burned-in labels collide with ours, pins sit on pixels so nothing can light up, and the crop can only ever
be the one view.

### The plate set is chosen by SITE COUNT, not by convenience

Measured distribution across all 377 candidate sites:

| compartment | sites | share |
|---|---|---|
| brain | 119 | 32% |
| **skull_base** | **72** | **19%** |
| nerve | 51 | 14% |
| brainstem | 40 | 11% |
| root | 34 | 9% |
| plexus | 16 | 4% |
| optic | 13 | 3% |
| **cord** | **11** | **3%** |

**The figure built in increment 1 is weighted backwards**: the cord has 11 sites and the most prominent
structure on the page; the skull base has 72 and a dotted line.

**PASS — usable directly (all public domain, verified via the Commons API):**

| plate | serves | sites |
|---|---|---|
| `Brain_diagram_without_text.svg` | cortex — lobes, sulci, cerebellum | ~71 |
| `Gray728.svg` | cerebral hemisphere, lobe boundaries | ~71 |
| `Gray722.svg` | visual pathway | ~20 |
| `Brachial_plexus_2.svg` | plexus + upper-limb nerves | ~16 |

**REJECTED, with the reason — this is the reusable rule:**

- `Medulla_section_uk.svg` — **zero font markers, 215 of 431 paths are outlined glyphs.** The Ukrainian
  labels were flattened into paths indistinguishable from anatomy. No rule can separate them.
- `Gray669-ja.svg` — nested Inkscape groups; the strip **kept only 36% of paths and still left Japanese
  text**, deleting anatomy and missing labels at once.

> **A foreign-language plate is only safe when its labels are real `<text>` or tagged Inkscape groups
> (`id="text…"` / `flowRoot…` / a `font-size` style). Flattened glyphs mean REJECT, never half-clean.**

**GAPS — no public-domain vector exists; trace from public-domain RASTER** (all downloaded; tracing a PD
work carries no licence obligation, so the whole set stays free of CC BY-SA):

| gap | source | why it matters |
|---|---|---|
| skull base foramina | `Gray191.png` | 72 sites, the second-largest compartment |
| coronal brain, deep grey | `Gray717_without_text.png` | ~31 sites; already label-free |
| base of brain + cranial nerves | `Gray724.png` | CN origins |
| lumbosacral plexus / fibular neck | `Gray823.png`, `Gray828.png` | the owner's point 3 |
| brainstem cross-sections | PD raster | increment 2's tract adjacency |

## Regional views (owner's ruling, 2026-08-25)

> **Anatomical proportions stay TRUE TO LIFE in the main figure. Where the pathology involves the skull
> base, a SEPARATE picture is offered that lets those sites spread.**

This is anatomically forced, not a layout preference: the foramen ovale, the jugular foramen and the IAM
sit at different depths and **cannot be separated on a coronal view at all**. So **the projection follows
the region** — coronal for the neuraxis, a different projection for a regional view.

A regional view is therefore NOT a crop. A crop is the same drawing zoomed; a regional view is a different
projection chosen because it is the one in which that region's sites are distinguishable.

**Measured: the skull-base compartment spans FOUR anatomical zones, not one plane** — 36 distinct parts
across the skull base floor (foramina), the cavernous sinus and orbit, the temporal bone (the facial
nerve's whole course, plus labyrinth and the three semicircular canals), and the upper neck (XI posterior
triangle, XII, recurrent laryngeal, Collet-Sicard, Villaret). **A single "skull base from above" plate
holds about half of them**, which is the open design question below.

## The three regional views (owner's rulings, 2026-08-25)

**The skull-base view is organised by CRANIAL NERVE COURSE, not by bone.** Each nerve is drawn from its
nucleus → cisternal segment → its foramen → its target, with sites pinned along that course.

This is the ruling that makes the view possible at all. A bone plate is a plane and the sites are not in
one; **a nerve course crosses all four zones by its nature**, so the same view holds the foramen, the
cavernous sinus, the temporal bone and the neck exit. It also matches how the pathology varies: the facial
nerve's five sites (geniculate → tympanic → mastoid → stylomastoid → parotid) ARE a course, and localising
along it is the clinical skill the app teaches. The jugular-foramen group still clusters at one hole,
which is correct — they genuinely are one place.

**The peripheral regions get the same treatment: an UPPER LIMB and a LOWER LIMB view.** Together
nerve + root + plexus is **101 sites, 27% of the model**, and the compression sites — fibular neck, carpal
tunnel, cubital tunnel, spiral groove, suprascapular notch — are exactly what a line down a limb cannot
show. `Brachial_plexus_2.svg` is validated and ready; the lower limb traces from `Gray823`/`Gray828`.

**A regional view is offered, never forced.** The main figure stays the answer to "where"; a regional view
opens when the candidate set lands in that region, because that is when its sites need room.

## Order of work, and the split into three increments

The owner's ruling is **artwork first, then tract geometry, then regional detail** — tract courses must be
authored against settled anatomy, so drawing them before the redraw would be waste. The 16 spurious
crossings stand until then.

That is more than one plan, so:

- **Increment 2 — artwork.** The plate-adoption pipeline (de-label, recolour by luminance, reject
  flattened-glyph plates), the four validated plates, tracing the coronal brain from `Gray717_without_text`,
  and the main neuraxis figure redrawn at TRUE ANATOMICAL PROPORTIONS.
- **Increment 3 — tract geometry.** Per-tract cross-sectional waypoints from Last's, smooth curves, the
  three missing `decussation` entries, and **the non-crossing invariant**. Carries a clinical review gate.
- **Increment 4 — regional views.** The offer mechanism plus the three views: cranial-nerve course, upper
  limb, lower limb.


---

# Amendment (2026-08-25b): the traced plate belongs to a REGIONAL view, not the main figure

**Discovered by building it, and reverted.** The traced Gray 717 coronal section was composed into the
main figure as its cerebrum, with the authored brainstem, cerebellum and cord continuing below.

**It cannot work, and the reason is anatomical, not cosmetic.** A coronal section at the thalamus ALREADY
CONTAINS the midbrain and pons, and the cord is not in that plane at all. Bolting an authored brainstem
below a real section therefore produces a brain on a stick. The junction itself can be made flush — the
plate hands over a pons 112 units wide and the authored stem was 26, which was a real defect and was
fixed — but no amount of coordinate tuning repairs the premise.

> **THE MAIN FIGURE IS A SCHEMATIC COMPOSITE OF THE WHOLE NEURAXIS. It is not any real section — which is
> precisely why a real section cannot be its spine.** This is the same objection that rejected stitching
> different projections into one picture; it applies to the main figure too.

**The correction follows the owner's own ruling, one level up: realism lives in the REGIONAL views.** A
true coronal section is exactly the right thing to show in a *brain* regional view, where the projection
is chosen for the region. So the four validated plates and the traced coronal section move to increment 4
and the main figure stays schematic.

**Three fixes from the attempt were kept**, because each was a genuine defect:

1. **Every anatomy class must have a CSS rule** — an SVG shape with no `fill` declared defaults to BLACK,
   so seven new classes painted solid wedges over the anatomy. This is now an invariant in
   `test/neuraxis-figure.test.js`, asserted in BOTH directions: no class may be unstyled, and no rule may
   be dead. The reverse direction immediately removed nine rules left behind by the revert.
2. **`REGIONS` held stale coordinates** through the plate swap and every caption landed on the brain. A
   caption has no invariant; only looking caught it.
3. **Crops are floored and centred**, because several compartments are a thin band that cropped to a tiny
   box and filled the panel with one structure.

**Increment 2 is therefore complete at:** the plate-adoption pipeline (`app/plates.js` + registry), the
tracer (`tools/trace`), the four validated plates, the traced coronal section, and the three fixes above.
The main figure is unchanged from increment 1 apart from the crop floor.

---

# Amendment (2026-08-25c): tract geometry landed; TWO defects found and NOT yet fixed

**Increment 3's geometry is done and merged into the branch.** The 22 spurious crossings are gone (spec
amendment 2026-08-25a). Attempting the second half — the three missing decussations — surfaced two further
defects that are **recorded here rather than half-fixed**.

## 1. THE SIDE ASSIGNMENT IS DIRECTION-BLIND (a real laterality bug)

`tractOverlay` decides which side of the midline each level is drawn on by walking the course array and
switching at the decussation index. **That assumes course order equals direction of travel, and for an
ASCENDING tract it does not.** `tract.course` is written rostral-to-caudal for every pathway, so an
ascending tract has its ORIGIN at the END of the array.

The consequence is visible on Wallenberg: the trigeminal nuclei render contralateral and the thalamus
ipsilateral — backwards. It is the exact relationship the app teaches (ipsilateral face, contralateral
body), drawn the wrong way round.

**The fix is known and small** — split the course at the decussation and put the half containing the
origin on the finding's side, choosing the origin by `tract.direction`. It is not landed because it
**moves the geometry**, and with the current lanes it reintroduces one crossing (below).

## 2. A LANE CANNOT SIT INSIDE A DECUSSATING TRACT'S SWEEP

With the direction fix applied, spinothalamic runs from dx 50 at the subcortex to the midline at its
decussation. **Anything parked between those two values is crossed on the way down**, and the
oculosympathetic sits there. Five placements were tried — lateral, medial, wider gaps, spreading the
brainstem lanes past the drawn outline, and splitting decussating tracts into two strokes meeting at the
midline — and each moved the crossing rather than removing it.

> **The lane table alone cannot express this.** A tract that decussates does not occupy a lane; it occupies
> a WEDGE from its lateral origin to the midline, and no other pathway may cross that wedge. That is a
> different constraint from the rank rule already recorded, and the next attempt should model it directly
> — for example by routing decussating tracts down their lane and turning to the midline only within the
> decussation band, rather than sweeping the whole way.

**Both are deferred deliberately.** The branch is left at the green state (74 suites, 6756 assertions, zero
crossings) rather than red or half-fixed. The laterality bug predates this work — it is not a regression —
but it is now understood and written down.

## Still outstanding from increment 3

- The three missing `decussation` entries (`mlf`, `trigeminothalamic`; `cerebellar` was added and
  **reverted** — that entry models inflow AND outflow, a pathway that crosses TWICE, which is why
  cerebellar signs are ipsilateral, and one field cannot say that. Same reasoning as `central_tegmental`).
- The spinothalamic label discrepancy against Last's p.624 (1-2 segments vs four or five in the cervical
  cord), still the owner's call.

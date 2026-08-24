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

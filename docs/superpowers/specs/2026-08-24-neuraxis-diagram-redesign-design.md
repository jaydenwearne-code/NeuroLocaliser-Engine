# Neuraxis diagram: an anatomical figure, not a list with a line

**Status: SPEC, not implemented.** Branch to be cut off `main`. Touches `app/neuraxis-diagram.js`
(rewritten), a new `app/neuraxis-figure.js`, the diagram's CSS in `app/index.html`, one call site in
`app/app.js`, and `test/neuraxis-diagram.test.js` (rewritten) plus a new `test/neuraxis-figure.test.js`.
**No engine or model change.** The app stays a pure consumer of `solve()` / `tractsFor()`.

## How this was found

The owner asked to improve the aesthetic and the diagrammatic quality of the neuraxis diagram. It was then
driven in the browser across all four worked examples and all thirteen cross-site archetypes, rendering the
real `neuraxisSVG()` output through a harness that imports the real modules — not read from source.

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

**The cause is the input contract, and it is the single most important change in this spec.** Candidate
sites are harvested *from* `tractsFor()`: `tf[i].sites`. A picture with no implicated long tract therefore
has no sites, and a diagram with no sites renders `""`. The figure must instead be driven by the
**candidate sites from `solve()`**, with tracts as an overlay that appears when a pathway is implicated.

### 2. The vertical axis stops being a neuraxis

Rows are the union of course levels and candidate levels, ordered by the implicated pathways' own course
with a fallback to `NEURAXIS`. `NEURAXIS` holds seven levels; `SITES` uses **eighteen**. On Wallenberg the
axis reads `Cortex, Subcortex, Midbrain, Pons, Medulla, Cord` — correct — and then continues
`Hypothalamus, Sympathetic, Skull Base, Cerebellum, Combined Degeneration, Thalamus, Aphasia Subcortical,
Guillain Mollaret`. The tail is in no anatomical order, and three of those are not anatomical levels at all.

### 3. It is a flat list with a decorative line

All 21 Wallenberg candidates sit in one column at a single x, regardless of side. 20 of them are on the
patient's left and one on the right, and **the diagram cannot show that** — the one fact a localisation
tool most needs to make visible. Four tracts share two lanes at `stroke-width:1.5; opacity:.55`,
indistinguishable and unlabelled, and only one of four decussations renders (the others return `""`).

### 4. Collisions and dead space

The decussation caption overlaps the band label and clips off the left edge (`x` can go negative). On
*Two lesions* every node is at Cortex, followed by ~200px of empty bands, and the crossing line dangles
into nothing.

### 5. Duplicate rows

MS renders "Anterior choroidal artery syndrome" twice and "Sensorimotor lacune (thalamocapsular)" twice.
Dedup is by `site.id`, which differs left from right, but `plainSiteName()` drops the side for these — so
the reader sees two identical rows. **Rows the reader cannot tell apart are a defect, not density.**

## Decisions

Four rulings from the design conversation, all the owner's:

1. **The diagram answers WHERE and WHY together.** An anatomical picture of where the lesion is, with the
   implicated pathways running through it. Not one or the other.
2. **Hand-drawn base, derived overlay.** The anatomy is authored once; everything case-specific — pins,
   tracts, decussations, selection, crop — is derived from the model. "Derive, don't store" governs
   *content*; the drawing is presentation.
3. **Anatomical convention: the patient's left is on the left of the page.** Matches a textbook tract
   diagram and how you would draw it on paper. It is the opposite of a scan, so **both sides are captioned
   on the figure** rather than left implicit.
4. **Zoom to the implicated region**, with a locator to buy back the stable frame (§Zoom).

Three layouts were mocked with the real Wallenberg data and compared in the browser:

- **A — coronal figure, labels in the gutters.** 20 labels on one side force the canvas to 1260px wide to
  fit the gutter, which shrinks the figure and drops the effective type size to ~6px; the leader lines
  converge into an unreadable fan. Direct labelling does not survive the candidate count.
- **B — sagittal profile with left/right rails.** Rejected. A profile has no left and right, so laterality
  moves onto two abstract rails and the labels collapse back into one column — it reproduces today's flat
  list with a silhouette parked beside it, and crossings stop being anatomical events.
- **C — coronal figure, numbered pins, index beneath.** Chosen. The figure stays compact and legible, every
  candidate lands at its true compartment and side, and the index reads in columns underneath.

**What the mockups surfaced:** on Wallenberg, **7 of 21 candidates live in the sympathetic chain and the
skull base** — a third of them. Those are not edge cases to annex off the side of a CNS drawing, and the
oculosympathetic path is the entire reason Wallenberg has a Horner's. The base gives them real anatomical
room.

## Architecture

### `app/neuraxis-figure.js` — new, CONTENT ONLY

Authored half-figure path data, the anchor table, zone offsets, region captions, crop boxes. **Imports
nothing from the engine and contains no logic**, so the anatomy can be reviewed as anatomy without reading
UI code — the same split as `src/data/multifocal.js` against `src/engine/multifocal.js`.

**The figure is authored as ONE HALF and mirrored** (`transform="scale(-1,1) translate(-2·MX,0)"`).
Symmetry holds by construction and there is no second copy of the anatomy to drift — the same reasoning as
`markSVG()` in `brand.js` drawing one geometry twice.

Covered by the base: cerebrum with deep grey matter and internal capsule, brainstem (midbrain / pons /
medulla), cerebellar hemispheres, cord with segmental root stubs, conus and cauda, plexus, peripheral nerve
to a limb, skull base plate, the three-neuron oculosympathetic chain, globe and pupil, optic nerve and
chiasm.

### `app/neuraxis-diagram.js` — rewritten, LOGIC ONLY

Stays a **pure string-in / string-out function, DOM-free and node-testable** — that property is why the
current module is unit-testable at all and it is not given up.

**Two exports, not one return shape.** `neuraxisSVG(candidates, tracts, opts)` returns the `<svg>` figure
and nothing else — it keeps returning a string that starts with `<svg`, which the existing suite asserts
and which is worth preserving. `neuraxisIndex(candidates, opts)` is a second pure function returning the
numbered index as HTML. `app.js` composes the two.

The alternative — one function returning SVG followed by the index markup — was rejected: it makes a
function named `…SVG` return something that is not an SVG, and it welds two independently testable pieces
into one string. Candidates come first in both signatures because they are now the subject; `tracts` may be
empty.

### `app/app.js`

One call site changes to pass the differential alongside the tracts. Click wiring is unchanged in shape —
it already delegates on `[data-k]` — plus one new handler for expanding a cluster (§Pins).

## Anchors — level, nudged by zone

`ANCHOR` is authored and keyed by **level**: 18 keys, `{dx, dy}` from the midline, `dx` flipped by side.

Level ids are globally unique, so there is no `level|part` collision here — unlike `PART_LABEL`,
`vascular.js` and `topography.js`, which key by `${level}|${part}` because `lateral`, `hemi`, `medial` and
`anterior` are each reused across levels. **Do not key this table by part name.**

Part granularity comes from a derived **zone** — `medial` / `lateral` / `dorsal` / `ventral` / `central` —
read off the part name, with an authored override map for parts whose name does not say it. Each zone is a
fixed nudge within its level's shape, so the lateral medulla pins dorsolaterally and the basis pontis pins
ventrally without authoring 202 coordinates.

**Invariant (`test/neuraxis-figure.test.js`): every level in `SITES` has an anchor, and every part resolves
to a zone.** Assert the RULE, not the values, so a new site cannot land undetermined — the rule
`topography.js` already follows for `surface`.

Full per-part anchoring (the 202-key `vascular.js` / `topography.js` shape) is **deliberately not in this
increment**. If the zone nudge proves too coarse, measure it and author the table then.

## Pins and clustering

Slot = `level | side | zone`. Up to **3** candidates fan in place around the anchor; above that the slot
draws **one pin badged with the count**.

NMOSD is the stress case at **47 candidates**, so this is load-bearing, not a nicety.

**The builder emits both the cluster pin and the fanned pins**, the latter carrying a class that hides
them; `app.js` toggles `.open` on click. No interaction logic crosses into the builder, so it stays pure.

**The index beneath always lists every candidate**, whatever the figure collapses. Nothing is ever
only-hidden — a cluster is a drawing decision, never a filter on the differential.

Numbering follows the order of `solve()`'s differential, so pin 1 is the leading candidate and the figure
and the Where card agree on which candidate is which. **The index and the pins share one numbering** —
there is no second ordering to drift.

Where two candidates in one diagram resolve to the same display name, **the side is appended** to
disambiguate (§What is actually wrong, 5).

## Tracts

Every implicated pathway is drawn along its true course, on the correct side, crossing at its decussation,
with a direction arrow (ascending / descending) and a **named legend**. Wallenberg draws four:
spinothalamic, oculosympathetic, cerebellar, trigeminothalamic.

Measured ceiling across all 17 examples is **4 simultaneous tracts**. The palette carries **5**
distinguishable stroke colours and cycles beyond that.

**Distinguished by FORM as well as hue** — each tract carries a dash pattern as well as a colour, so the
lines stay separable in greyscale and for a colourblind reader. This is the rule the danger chip already
follows (`RED` and `EMERGENCY` are filled chips with a ⚑ glyph so a tired reader never has to tell
`#d36d52` from `#b32b1c` at 10px).

New tokens `--tract-1` … `--tract-5`, defined in **all four** palette blocks. Four blocks stay four —
`test/brand.test.js` counts them. They are strokes, never text, and are declared in `NOT_TEXT` in
`test/contrast.test.js` accordingly.

A decussation renders as a marked crossing on the figure. **Every implicated tract's decussation must
render or be explicitly absent** — today three of four silently return `""`, which teaches the reader that
those pathways do not cross.

## Zoom, and the locator

The full figure is authored once. **Zoom is a derived viewBox crop**: union the crop boxes of the
compartments actually in play, pad, emit. There is no second drawing and no detail levels — a crop cannot
disagree with the figure it crops.

Crop boxes are per **compartment** (`compartmentOf()`), not per level, so a crop always contains whole
anatomical structures rather than slicing a shape in half.

The cost the owner accepted was losing a stable, memorable frame. It is bought back with a **locator**: a
small whole-neuraxis thumbnail in the corner with the crop rectangle marked. Foot drop then reads "lumbar
cord → peroneal nerve, and here is where that sits in the whole thing."

## Theming and the standing guards

- **`--terra` allowlist (`test/brand.test.js`).** The selected pin and its index row **are the answer**, so
  they are justified additions to the allowlist — the same argument that admitted `.cause.sel` and
  `.px-chip`. Nothing else in the diagram takes terracotta. A hover state, a focus ring or a tract colour
  is neither identity nor the answer; if one is proposed, it is deleted rather than allowlisted, as the
  terracotta focus ring was.
- **No inline accent in JS.** `app.js` emitting `<span style="color:…accent…">` bypassed the stylesheet
  scan once already, because `brand.test.js` slices `<style>`→`</style>`. Everything here goes through
  classes.
- **Contrast.** Anatomy strokes currently specified as `--line` are invisible in dark (`#26364d`); they
  move to `--muted` at reduced opacity. Any rule setting both a background and a colour is checked by
  `test/contrast.test.js` in all four palette blocks.
- **The theme is not part of the case.** Nothing in the diagram enters `S`, `encodeCase()` or `syncURL()`
  beyond the already-round-tripped selected site.

## Testing

`test/neuraxis-diagram.test.js` is rewritten. It keeps the `data-k` per candidate and `data-sel="1"`
contracts — `app.js` delegates on those — and replaces the `class="decussation"` assertion against the new
markup. New assertions:

- a case with **zero implicated tracts still renders a figure** (Foot drop, Cauda equina) — the defect that
  motivated the input-contract change;
- `neuraxisSVG()` still returns a string beginning `<svg`, and the index is `neuraxisIndex()`'s business;
- **every candidate appears in the index**, including those the figure collapses into a cluster;
- **no two index rows carry identical text**;
- a left-sided case pins left of the midline and a right-sided case pins right of it — the laterality the
  current diagram cannot express;
- the crop for a peripheral case excludes the cerebrum, and the locator still renders the whole figure.

`test/neuraxis-figure.test.js` is new and asserts the anchor/zone rules above.

Both are added to the `test` script in `package.json` and to the README chain.

## Out of scope

- Per-part 202-key anchoring (see §Anchors).
- Any engine or model change. If the diagram wants something the model does not expose, that is a separate
  increment with its own review.
- Atlas mode's own rendering.
- The `--mimic` / `--iatro` dead tokens recorded in the 2026-08-22 contrast pass. Still dead, still
  separate work.

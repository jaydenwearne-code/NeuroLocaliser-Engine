# Parinaud / vertical gaze — dorsal midbrain (pretectal) syndrome — design spec

**Date:** 2026-07-18
**Region increment:** finish the brainstem map with the **dorsal midbrain / pretectal (Parinaud)
syndrome** — a supranuclear **vertical gaze palsy** with convergence-retraction nystagmus, lid
retraction (Collier's), and the already-modelled light-near dissociation. Parinaud **emerges as the
union** of the existing pupillary pretectum site and a new tectal vertical-gaze site — the skull-base
subset⊆superset nesting pattern applied to the tectum, no new solver mechanism.
**Status:** approved design, ready for implementation planning

## Context

The brainstem region is otherwise complete (3 levels × 2 territories × 2 sides, plus the midline
directional-nystagmus generators and the pupil pathways). The dorsal midbrain is **already partly
modelled**:

- `pupil_pretectum` (composer `composePupilPretectumSites`, bilateral composite) emits
  `light_near_dissociation`, named **Argyll Robertson** (small bilateral pupils, light-near
  dissociation). This is the pretectal light-reflex relay.
- `pontomesencephalic_tegmentum` (midline composer site) emits `nystagmus_upbeat`.
- The oculomotor **fascicle** (`cn3_fascicle`, midbrain·medial) and CN III trunk (pupil level) are
  modelled — but these are the *nuclear/infranuclear* third nerve, not the **supranuclear vertical
  gaze** apparatus (posterior commissure / riMLF), which is unmodelled.

**The gap:** vertical gaze palsy — the cardinal dorsal-midbrain sign — has no producer, so Parinaud
cannot emerge. A pineal tumour compressing the tectum, a dorsal-midbrain infarct, or obstructive
hydrocephalus (aqueductal stenosis) all present with the Parinaud tetrad, and the engine currently
localises only the pupillary component (Argyll Robertson) of that picture.

## Design decisions (settled during brainstorming)

1. **Nested sites, not one combined site** (the skull-base foramina precedent: SOF ⊆ cavernous ⊆
   orbital apex). The pupillary subset (`light_near_dissociation` → Argyll Robertson) stays its own
   site; a new **tectal** site carries the vertical-gaze signs; **Parinaud is the union** of the two.
   This *preserves* the existing isolated-Argyll-Robertson emergence, and names both the subset and
   the superset — a single combined site could do neither (it would collapse AR into Parinaud and
   over-predict gaze signs for an isolated light-near-dissociation input, breaking the pupil-efferent
   test). Rejected: single combined dorsal-midbrain site.
2. **Three distinct findings, not one folded gaze finding.** `vertical_gaze_palsy` (cardinal),
   `nystagmus_convergence_retraction` (joins the existing `nystagmus_*` taxonomy), and `lid_retraction`
   (Collier's). The first two are LOCALISING; lid retraction is a non-localising companion (lid
   retraction also occurs in thyroid eye disease, so it does not pin location on its own).

## The findings (`findings.js`)

Three new findings, all **NON_LATERALISED** (`@none` — a supranuclear vertical-gaze deficit and a
convergence/retraction movement have no body side; they are midline):

| Finding | Character | LOCALISING? |
|---------|-----------|-------------|
| `vertical_gaze_palsy` | supranuclear vertical (esp. up-) gaze palsy | **yes** |
| `nystagmus_convergence_retraction` | convergence-retraction nystagmus on attempted upgaze | **yes** (joins `nystagmus_*`) |
| `lid_retraction` | Collier's sign (bilateral lid retraction) | no (companion) |

Concrete edits to `findings.js`:
- **Add** the three to `FINDINGS`. Group `vertical_gaze_palsy` and `lid_retraction` under
  "Cranial nerve" (ocular motility) — or a shared group with the existing gaze findings; put
  `nystagmus_convergence_retraction` in the existing "Vestibular / nystagmus" group alongside the
  other `nystagmus_*` types.
- **Add** all three to `NON_LATERALISED`, and give each a `CROSSES: false` entry for map completeness
  (moot — `NON_LATERALISED` short-circuits to `@none`).

## Anatomical homes (`structures.js`, `sites.js`)

Model the **tectum / posterior commissure** as a midline dorsal-midbrain generator, mirroring the
`composeCentralNystagmusSites` pattern (midline site, id == `level_part`, level/part composer-only —
not in `LEVELS`/`PARTS`).

**Structures** (new level `dorsal_midbrain`, part `tectum`):
- `tect_vgaze` → `vertical_gaze_palsy` — note: "posterior commissure / rostral interstitial MLF
  (riMLF) — supranuclear vertical gaze palsy (dorsal midbrain)".
- `tect_convret` → `nystagmus_convergence_retraction` — note: "pretectum — convergence-retraction
  nystagmus on attempted upgaze".
- `tect_lid` → `lid_retraction` — note: "posterior commissure — Collier's sign (lid retraction)".

**Sites** (three, via composers registered in `inverse.candidateSites()`):

| Site id | Side | Structures | Emergent name |
|---------|------|------------|---------------|
| `pupil_pretectum` *(exists, unchanged)* | bilateral | `ar_lnd` | Argyll Robertson (pupillary subset) |
| `dorsal_midbrain_tectum` *(new)* | midline | `tect_vgaze`, `tect_convret`, `tect_lid` | Dorsal-midbrain vertical gaze palsy (tectal) |
| `parinaud_dorsal_midbrain` *(new, union)* | midline | pretectum ∪ tectum structures | **Parinaud syndrome** |

- `dorsal_midbrain_tectum`: built by a small composer `composeDorsalMidbrainSites()` following the
  `composeCentralNystagmusSites` shape (side `midline`, id == `level_part`, `TERRITORY` entry added,
  level/part **not** in `LEVELS`/`PARTS`).
- `parinaud_dorsal_midbrain`: built by `composeParinaudSite()` — the **union** of the pretectum
  pupillary structures (`level: "pupil", part: "pretectum"`) and the tectal structures
  (`level: "dorsal_midbrain", part: "tectum"`), side `midline`, `composite: true`, its own `TERRITORY`
  entry. This is the SOF∪V2 → cavernous-sinus union pattern, transplanted to the dorsal midbrain. It
  may live inside `composeDorsalMidbrainSites()` as a second returned site rather than a separate
  function — one composer for the region.

**Why nesting works with no new mechanism:** the union site explains the full tetrad with **zero
over-prediction**, so it out-scores both subsets on the full picture; each subset explains only part.
On an isolated input, the matching subset wins because the union over-predicts the absent signs —
exactly the skull-base behaviour.

## Scoring (`score.js`)

`LOCALISING`: **add** `vertical_gaze_palsy` and `nystagmus_convergence_retraction`. `lid_retraction`
is **not** added (companion, non-localising).

## Emergent naming (`syndromes.js` — phonebook)

| Key | Named | note / ddx / red |
|---|---|---|
| `dorsal_midbrain_tectum` | Dorsal-midbrain (tectal) vertical gaze palsy | posterior commissure / riMLF lesion; ddx dorsal-midbrain infarct, MS, PSP (degenerative), early tectal tumour |
| `parinaud_dorsal_midbrain` | **Parinaud syndrome (dorsal midbrain / pretectal syndrome)** | note: vertical (up-) gaze palsy + convergence-retraction nystagmus + light-near dissociation ± lid retraction (Collier's) — one pretectal/tectal lesion. ddx: **pineal / tectal tumour**, dorsal-midbrain infarct, **obstructive hydrocephalus (aqueductal stenosis)**, MS. red: "Vertical gaze palsy + light-near dissociation, especially in a young patient → image the pineal region and ventricles; obstructive hydrocephalus is a neurosurgical emergency." |

`pupil_pretectum` keeps its existing Argyll Robertson entry, unchanged.

## Tests

**New `test/parinaud.test.js`** (added to `npm test` chain in `package.json` + the README list),
TDD red-first:
1. **Vocabulary:** the three findings exist, are in `NON_LATERALISED`; `vertical_gaze_palsy` and
   `nystagmus_convergence_retraction` are LOCALISING; `lid_retraction` is **not** LOCALISING.
2. **Structures/sites:** `dorsal_midbrain_tectum` and `parinaud_dorsal_midbrain` sites exist (via the
   composer); `parinaud_dorsal_midbrain` structures are the **union** (includes `ar_lnd` and the three
   tectal structures).
3. **Forward:** `dorsal_midbrain_tectum` → `vertical_gaze_palsy@none` + `nystagmus_convergence_retraction@none`
   + `lid_retraction@none`; `parinaud_dorsal_midbrain` additionally → `light_near_dissociation@none`.
4. **Inverse emergence (the headline):**
   - full tetrad `{vertical_gaze_palsy, nystagmus_convergence_retraction, light_near_dissociation,
     lid_retraction}@none` → `parinaud_dorsal_midbrain`, named **Parinaud**;
   - isolated `vertical_gaze_palsy@none` (± convergence-retraction, no pupil sign) →
     `dorsal_midbrain_tectum`, named dorsal-midbrain vertical gaze palsy;
   - **regression:** isolated `light_near_dissociation@none` still → `pupil_pretectum`, named
     **Argyll Robertson** (the nesting must not steal it — the union and tectal sites over-predict).
5. **Nesting / parsimony:** the full tetrad prefers the single `parinaud_dorsal_midbrain` union over a
   two-site (pretectum + tectum) minimal-set cover — one lesion, not two.

**Regression watch (explicit):** all 20 existing suites green. In particular the **pupil-efferent**
suite's isolated-Argyll-Robertson assertion must be unchanged (the new sites do not out-score
`pupil_pretectum` on a pupil-only input). No existing brainstem/pupil/nystagmus site emits the new
findings, so ripple should be minimal; if any assertion shifts, surface it — don't silently patch.

## What this increment does NOT do (YAGNI / deferred)

- **No skew deviation, no vertical-one-and-a-half, no monocular elevation palsy** — the four Parinaud
  tetrad components are enough to make the syndrome emerge; rarer dorsal-midbrain ocular motor
  variants are deferred.
- **No pupil-size modelling** — Parinaud's mid-dilated pupils and Argyll Robertson's small pupils both
  reduce to the shared `light_near_dissociation` finding; pupil diameter is not in the vocabulary.
- **No PSP / degenerative pathology object** — PSP is a *pathology* (a degenerative process with a
  vertical gaze palsy), named later by the pathology layer, not a site here. The tectal site names the
  focal-lesion cause; PSP appears only as a ddx line.
- **No aqueduct / hydrocephalus site** — obstructive hydrocephalus is a *cause* (ddx / red flag),
  surfaced in the phonebook note, not modelled as its own anatomical site.

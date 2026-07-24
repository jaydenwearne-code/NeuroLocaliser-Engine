# Sympathetic / Horner three-order axis (with level-gated cord sympathetic) — design spec

**Date:** 2026-07-13
**Region increment:** turn the single `horner` finding into a localising axis — central (1st) /
preganglionic (2nd) / postganglionic (3rd) — with the **anhidrosis distribution** as the discriminator,
and model the cord's oculosympathetic as a **level-gated** lateral-cord structure so a *cervical*
Brown-Séquard produces a Horner while a *thoracic* one does not.
**Status:** approved design, ready for implementation planning
**Sub-project 3 of 3** — completes the REQUIRED visual/pupil/autonomic region.

## Context

`horner` currently fires identically at three sites (lateral medulla / Wallenberg, SOF-cavernous, carotid
space) — it marks the syndrome but not the ORDER. The oculosympathetic pathway has three neurons and the
sudomotor fibres peel off at different points, so the **anhidrosis distribution** localises the order:
- **1st / central** (hypothalamus → brainstem → descending in the lateral cord → ciliospinal centre
  C8–T2): ipsilateral **hemibody** anhidrosis (face + trunk + limb).
- **2nd / preganglionic** (ciliospinal centre → lung apex / stellate ganglion → superior cervical
  ganglion): **facial** anhidrosis (body spared).
- **3rd / postganglionic** (superior cervical ganglion → along the ICA → orbit): **no anhidrosis** (the
  facial sudomotor fibres travel with the EXTERNAL carotid, which branches off before the ICA).

Crucially the central first-order neuron runs **through the lateral cord** and synapses at C8–T2, so a
cord lesion causes a Horner only **at/above ~T1**; below T1 the oculosympathetic has exited and there is
**no Horner**. This makes the Horner a level-dependent cord finding.

## The new mechanism: level-gated emission

Until now the sensory level is a strictly **orthogonal annotation** (`describeLevel` runs after the
winner is chosen; the forward model never sees the level). This increment adds the first **level-gated
finding**: a structure may carry `emitAtOrAbove: "<segment>"`, and the forward model emits it **only**
when a valid `sensoryLevel` at or above that segment is supplied.

- `expectedFindings(site, opts)` / `explain(site, opts)` skip a gated structure unless
  `normaliseLevel(opts.sensoryLevel)` exists and is **not below** the threshold:
  `if (struct.emitAtOrAbove) { const lvl = normaliseLevel(opts.sensoryLevel); if (!lvl || isBelow(lvl, struct.emitAtOrAbove)) continue; }`
- `inverse.solve` threads `options.sensoryLevel` into the `opts` passed to `rankSingle` / `minimalSet`
  (today only `dominantSide` is threaded).
- **Restrictive default** (no level → skip): keeps every existing level-less test unchanged (a gated
  structure emits nothing without a level, so it never over-predicts), and only affects a site when a
  level is supplied. Verified safe against the existing `sensoryLevel` tests (T10, T4, C6-on-a-syrinx,
  invalid Z9 → all leave the gated cord sympathetic OFF).

Only the new cord sympathetic structures are gated; every existing structure has no `emitAtOrAbove` and
is unaffected. This is the bounded, principled departure the roadmap's Horner refinement needs.

## Decisions (settled with the user)

1. Anhidrosis distribution is the axis (`anhidrosis_face`, `anhidrosis_body`).
2. **Cord oculosympathetic is level-gated in the cross-section** — a `cord/lateral` structure gated
   `emitAtOrAbove: "T1"`, so a **cervical** Brown-Séquard (via the hemicord composite) produces a Horner
   as ONE lesion and a **thoracic** one does not.
3. Preganglionic **primitive** is **lean** (`horner` + `anhidrosis_face`) — for an isolated preganglionic
   Horner — and **Pancoast is a derived composite**: `sympathetic/preganglionic` ∪ the lower trunk
   (C8/T1), so a full Pancoast picture (preganglionic Horner + hand wasting + T1 sensory + arm pain)
   localises to ONE apical site, exactly like Erb = C5∪C6. This honours the lean-primitive decision while
   completing the localisation.
4. Postganglionic **reuses the carotid space** (existing, `horner`-only).
5. Brainstem central **reuses the lateral medulla** (Wallenberg), ungated (always above the outflow).

## Findings vocabulary (`src/model/findings.js`) — 2 new

| Finding | CROSSES | LOCALISING | Role |
|---|---|---|---|
| `anhidrosis_face` | false (ipsi) | **yes** | facial sweat loss — central + preganglionic |
| `anhidrosis_body` | false (ipsi) | **yes** | trunk/limb (hemibody) sweat loss — central only |

Reuse `horner` (the shared composite; stays at all orders).

## Sites & structures

| order | site | structures |
|---|---|---|
| **central — brainstem** | `medulla / lateral` (**existing** Wallenberg) | **add** `sym_med_anh_face` (`anhidrosis_face`) + `sym_med_anh_body` (`anhidrosis_body`), ungated |
| **central — cervical cord** | `cord / lateral` (**new** cord part → also feeds the hemicord composite = Brown-Séquard) | `sym_cord_horner` (`horner`) + `sym_cord_anh_face` (`anhidrosis_face`) + `sym_cord_anh_body` (`anhidrosis_body`), all `crosses:false`, all **`emitAtOrAbove:"T1"`** |
| **preganglionic (2nd)** | `sympathetic / preganglionic` (**new** level, L/R via buildSites — stellate ganglion) | `preg_horner` (`horner`) + `preg_anh_face` (`anhidrosis_face`), ungated |
| **Pancoast (composite)** | `sympathetic / pancoast` (**new** composer — lung apex) | UNION of `sympathetic/preganglionic` ∪ `root/c8` ∪ `root/t1` structure ids (preganglionic Horner + facial anhidrosis + C8/T1 sensory + hand wasting/weakness + radicular pain) |
| **postganglionic (3rd)** | `skull_base / carotid_space` (**existing**, ICA dissection) + SOF-cavernous | unchanged — `horner` only |

**How the cord site does double duty:** `buildSites` builds a standalone `left/right_cord_lateral`
(isolated cervical central Horner, *with a cervical level*), and `composeHemiLevelSites` (which unions all
cord parts on a side) folds it into `left/right_cord_hemi` so a **cervical Brown-Séquard emits the Horner
as one lesion**. The gate keeps a **thoracic** Brown-Séquard Horner-free.

Registration (`sites.js`): `LEVELS += "sympathetic"`; `PARTS += "preganglionic"` (`"lateral"` is already
in `PARTS`); `TERRITORY += "cord|lateral"`, `"sympathetic|preganglionic"`. `cord/lateral` rides
`buildSites` + the existing hemicord composer; `preganglionic` rides `buildSites`; **Pancoast is a new
composer** `composePancoastSites()` (id `${side}_sympathetic_pancoast`, part `pancoast` — NOT in `PARTS`,
like the plexus/foramina composites) registered in `inverse.candidateSites()`.
`composeBilateralCordSites` keeps its explicit part list (`anterior`/`posterior`/`central`), so the
bilateral/transverse cord sites do **not** gain the sympathetic (a bilateral cervical-cord Horner is
deferred).

## Engine changes

- `src/engine/forward.js` — the level gate in `expectedFindings` + `explain` (per the mechanism above).
- `src/engine/inverse.js` — thread `options.sensoryLevel` into the `opts` for `rankSingle`/`minimalSet`;
  register `composePancoastSites()` in `candidateSites`.
- `src/model/sites.js` — add `composePancoastSites()` (union of the preganglionic sympathetic + the C8/T1
  root structures, per side).
- `src/engine/score.js` — add `anhidrosis_face`, `anhidrosis_body` to `LOCALISING`. No scoring-code change.
- `src/model/levels.js` — no change (reuse `normaliseLevel` + `isBelow`).

## Emergent discrimination (what the tests prove)

| Findings (± level) | Localises to |
|---|---|
| `horner` + `anhidrosis_face` + `anhidrosis_body`, `sensoryLevel` cervical (e.g. C7) | **central — cervical cord** (`left_cord_lateral`) |
| `horner` + `anhidrosis_face` + `anhidrosis_body`, no level | **central — lateral medulla** (Wallenberg; the cord site is gated off without a level) |
| Brown-Séquard + `horner` + anhidrosis, `sensoryLevel` C5 | **one cervical hemicord** (`left_cord_hemi`) |
| Brown-Séquard, `sensoryLevel` T10 | `left_cord_hemi` **emitting no Horner** (gate off below T1) |
| `horner` + `anhidrosis_face` (body spared), isolated | **preganglionic** primitive (stellate) |
| `horner` + `anhidrosis_face` + C8/T1 signs (hand wasting, T1 sensory, arm pain) | **Pancoast** composite (lung apex) |
| C8/T1 signs alone (no Horner) | **lower trunk** (Klumpke, existing) — Pancoast over-predicts the Horner |
| `horner` alone | **postganglionic** (carotid — isolated painful Horner) |

## Phonebook (`src/data/syndromes.js`)

- `cord_lateral` → "Central (1st-order) Horner's — descending sympathetic in the lateral cervical cord
  (syringomyelia, cord tumour/infarct); ipsilateral hemibody anhidrosis; only above ~T1" (red flag: a
  Horner with suspended sensory loss or long-tract signs → image the cervical cord).
- `sympathetic_preganglionic` → "Preganglionic (2nd-order) Horner's — stellate ganglion; facial
  anhidrosis, body spared" (red flag: with C8/T1 wasting or arm pain → image the lung apex — Pancoast).
- `sympathetic_pancoast` → "Pancoast syndrome (superior sulcus tumour) — a preganglionic Horner PLUS
  lower-trunk C8/T1 involvement (hand-intrinsic wasting, T1 sensory loss, aching arm/shoulder pain)"
  (red flag: a Horner with hand wasting and arm pain → image the lung apex urgently for a Pancoast tumour).
- `skull_base_carotid_space` (add if absent) → "Postganglionic (3rd-order) Horner's — internal carotid
  dissection; isolated, often painful, NO anhidrosis" (red flag: a painful isolated Horner is a carotid
  dissection until proven otherwise — urgent vessel imaging).

## Testing — new `test/horner-axis.test.js`

1. **Vocabulary** — `anhidrosis_face`, `anhidrosis_body` exist; `CROSSES:false`; both `LOCALISING`; neither
   `NON_LATERALISED`.
2. **Sites/structures** — `left/right_sympathetic_preganglionic` and `left/right_cord_lateral` exist; the
   cord lateral sympathetic structures carry `emitAtOrAbove:"T1"`; the lateral medulla now produces
   `anhidrosis_face` + `anhidrosis_body`; the preganglionic site = `horner` + `anhidrosis_face`; the
   carotid space stays `horner`-only.
3. **The level gate (forward)** — `expectedFindings(left_cord_lateral, {sensoryLevel:"C7"})` has
   `horner@left` + both anhidroses; `expectedFindings(left_cord_lateral, {sensoryLevel:"T10"})` has
   **none** of them; `expectedFindings(left_cord_lateral)` (no level) has none. Same three checks on the
   **hemicord** composite for `horner@left` (a cervical Brown-Séquard emits it; a thoracic one does not).
4. **Discriminators** (via `solve`) — isolated hemibody Horner + cervical level → `left_cord_lateral`;
   isolated hemibody Horner, no level → `left_medulla_lateral`; cervical Brown-Séquard + Horner + level C5
   → `left_cord_hemi`; isolated face-only-anhidrosis Horner → `left_sympathetic_preganglionic`; Horner +
   face anhidrosis + C8/T1 (hand wasting + T1 sensory + arm pain) → `left_sympathetic_pancoast`; the same
   C8/T1 signs WITHOUT the Horner → `left_plexus_lower_trunk` (Klumpke); isolated Horner → postganglionic
   (carotid); guard: full Wallenberg picture (no anhidrosis, no level) still → `left_medulla_lateral`.
5. **Phonebook** — cord central names cervical cord / syrinx; preganglionic names preganglionic/stellate;
   Pancoast names Pancoast / superior sulcus; postganglionic (carotid) names carotid/dissection.
6. **Regression** — all 16 prior suites green. Particular attention: the `sensory-level` suite (T10/T4/
   invalid) and `central-cord` (C6) must be unchanged (the gated cord sympathetic stays off for them or
   doesn't steal their winner), and the Wallenberg / SOF-cavernous Horner-company pictures unaffected.

## Out of scope (deferred)

- Bilateral/transverse cervical-cord Horner (kept the bilateral cord composer's explicit part list).
- Segmental below-lesion body anhidrosis at thoracic levels without a Horner (the gate treats the whole
  sympathetic signature as one ≥T1 bundle).
- Neck/face pain as a positive postganglionic finding; pharmacological localisation; harlequin;
  heterochromia; cluster-headache autonomic features.

## Verification

`PATH=… npm test` — new `horner-axis.test.js` green and all 16 prior suites green. Completes the
visual/pupil/autonomic region (3 of 3) and introduces the level-gated-emission mechanism. Artifact sync
stays deferred. Not a medical device; anatomy tables still need neuroanatomist review.

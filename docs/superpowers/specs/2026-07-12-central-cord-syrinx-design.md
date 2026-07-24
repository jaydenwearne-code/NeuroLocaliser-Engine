# Central cord / syrinx — design spec

**Date:** 2026-07-12
**Region increment:** spinal cord — the central cord / syringomyelia (intramedullary) picture
**Status:** approved design, ready for implementation planning

## Context

The engine derives syndromes from anatomy. Built and green (35 tests): brainstem, the spinal-cord
**core four** (Brown-Séquard, ASA, posterior column/SCD, transverse), and the dermatomal
**sensory-level** mechanism. Everything modelled so far is a *below-the-level* deficit.

This increment adds the **central cord / syrinx** picture — the classic intramedullary lesion.
A syrinx expands from the centre of the cord and first strikes the **decussating spinothalamic
fibres in the anterior white commissure**, producing pain/temperature loss that is:

- **bilateral** (crossing fibres from both sides are hit),
- **suspended** — present only at the lesion's segments (a "cape"), spared *both above and below*
  (the fundamentally new distribution; every prior finding was below-the-level),
- **dissociated** — dorsal columns preserved, so vibration/proprioception is intact,
- with **sacral sparing** — the laminated sacral spinothalamic fibres sit most lateral and escape
  a central lesion (the classic intramedullary-vs-extramedullary discriminator).

## Decisions (settled with the user)

1. **Scope: syrinx dissociated/suspended picture only.** Not the traumatic central-cord
   upper>lower-limb weakness (needs limb-specific motor findings + CST somatotopy — deferred), and
   not segmental anterior-horn LMN wasting (deferred to cauda equina, which also needs LMN).
2. **Suspended loss is a distinct finding.** The distribution (suspended vs below-the-level) is
   *localising* — it is what separates a central lesion from ASA — so it belongs in the finding
   vocabulary, not as an orthogonal annotation. A new `suspended_sensory` finding, keeping the
   signed-token format `finding@side` unchanged.
3. **Sacral sparing is a descriptive hallmark now.** Reported on the central-cord site
   (`syndromes.js`); not modelled as a reasoning finding, because nothing in current scope
   (no extramedullary/compressive lesion) contrasts against it. It becomes a real discriminator
   when intramedullary-vs-extramedullary is built.

## The core insight

Only **one** thing is genuinely new: the **suspended/at-level distribution**. Everything else
reuses existing mechanisms:

- **Dissociation emerges for free** — the central structure carries only spinothalamic fibres, so
  dorsal columns are never predicted; "vibration preserved" falls out exactly as ASA's
  vibration-sparing did (a consequence of which structures a site contains, not a rule).
- **Bilaterality reuses** the existing `side: "bilateral"` midline-site machinery.
- **Localisation** is the existing scorer; the new finding just needs to be in `LOCALISING`.

## Design

### `src/model/findings.js`

Add one finding and its crossing entry:

```js
suspended_sensory: { desc: "Suspended dissociated sensory loss (cape-like bilateral pain/temperature loss, dorsal columns preserved)", group: "Long tract" },
```
and in `CROSSES`: `suspended_sensory: false` — moot for a bilateral site (the forward model emits
both sides regardless of crossing), included to keep the map complete.

### `src/model/structures.js`

Add the commissural structure in a new `central` part:

```js
{ id: "commissural_stt", level: "cord", part: "central", produces: "suspended_sensory", crosses: false,
  note: "decussating spinothalamic fibres in the anterior white commissure — a central (syrinx) lesion gives bilateral, suspended, dissociated pain/temperature loss with sacral sparing" },
```

`central` is deliberately **not** added to `PARTS` in `sites.js`, so `buildSites` creates no
per-side `*_cord_central` primitives and `composeHemiLevelSites` (Brown-Séquard) is untouched.
The central site is built only as a bilateral composite (below).

### `src/model/sites.js`

- Add territory label: `"cord|central": "central cord / periependymal (syrinx, intramedullary)"`.
- In `composeBilateralCordSites`:
  - add `"central"` to the bilateral parts it emits → `bilateral_cord_central`
    (side `"bilateral"`, structures `[commissural_stt]`, territory from the map).
  - redefine the transverse composite to the **below-level** structures only — cord structures
    whose part is `anterior` or `posterior` (i.e. exclude `central`). This keeps
    `bilateral_cord_transverse` = `cst_cord, stt_cord, dc_cord`, exactly as today, so the
    transverse test stays an exact match rather than gaining a spurious suspended cape.

### `src/engine/score.js`

Add `suspended_sensory` to the `LOCALISING` set — it strongly pins the central/intramedullary
location. (Adding an id to `LOCALISING` cannot affect inputs that don't contain it, so existing
tests are unaffected.)

### `src/engine/inverse.js` — `describeLevel`

Add a branch, checked **before** the generic cord branches: when the best site is cord and
`best.site.part === "central"`, the below-the-level sensory-level concept does not apply — report
the suspended distribution instead of "level undetermined":

```
{ given: raw, applies: false,
  segment: <normalised raw or null>, region: <regionOf(segment) or null>, landmark: <landmarkOf(segment) or null>,
  note: "suspended (cape-like) distribution — the sensory loss spans the lesion's segments and is spared above and below, so a single below-the-level sensory level does not apply" }
```

A supplied sensory level (if valid) is carried through as the approximate centre of the cape.

### `src/data/syndromes.js`

Add a phonebook entry keyed `cord_central` (matches `nameForSite`'s `${level}_${part}`):

```js
cord_central: {
  name: "Central cord syndrome (syringomyelia / intramedullary)",
  note: "Central expansion strikes the decussating spinothalamic fibres in the anterior white commissure: bilateral, suspended (cape-like) dissociated pain/temperature loss with dorsal columns preserved and characteristic sacral sparing.",
  ddx: ["Syringomyelia (± Chiari I)", "Intramedullary tumour (ependymoma, astrocytoma)", "Post-traumatic syrinx", "Hydromyelia"],
  red: "Sacral sparing + a suspended dissociated loss points intramedullary — MRI the cord; exclude a tumour or Chiari malformation."
}
```

`nameForSite` is otherwise unchanged.

## Emergence & non-interference (verified against the scorer)

- **Emergence:** `[suspended_sensory@left, suspended_sensory@right]` → `bilateral_cord_central`
  matches exactly (localising ×3 each). Every other site fails to produce `suspended_sensory`, so
  it is an *unexplained localising* finding for them → heavily penalised → filtered. Clean win;
  `singleExplainsAll` is true (no spurious multifocal).
- **No cross-contamination:** on the ASA / posterior / Brown-Séquard / transverse inputs, the
  central site predicts `suspended_sensory@both`, which those patients lack → it scores < 0 and is
  filtered. All five existing cord tests stay green.
- **Transverse exactness preserved** by the transverse-composite redefinition above.

## Modules touched

- `src/model/findings.js` — `suspended_sensory` finding + `CROSSES` entry.
- `src/model/structures.js` — `commissural_stt` (part `central`).
- `src/model/sites.js` — central bilateral site + transverse redefinition + `cord|central` territory.
- `src/engine/score.js` — `suspended_sensory` → `LOCALISING`.
- `src/engine/inverse.js` — central/suspended branch in `describeLevel`.
- `src/data/syndromes.js` — `cord_central` entry.
- `test/central-cord.test.js` (new) + `package.json` test script + `README.md` status line.
- Post: living architecture artefact + project memory.

## Testing (TDD, red first)

New file `test/central-cord.test.js`:

1. **Emergence** — `[suspended_sensory@left, suspended_sensory@right]` → best `bilateral_cord_central`,
   `nameForSite(best.site).name` includes "Central cord".
2. **Dissociation guard** — same input: best is **not** `bilateral_cord_anterior` (no weakness
   over-predicted) — asserted explicitly.
3. **Suspended level note** — `solve(centralInput)` → `level.applies === false` and
   `/suspended/.test(level.note)`.
4. **Suspended note with a supplied level** — `solve(centralInput, { sensoryLevel: "C6" })` →
   `level.applies === false`, `level.segment === "C6"`, `/suspended/.test(level.note)`.

**Regression:** the existing 8 + 5 + 22 tests must stay green (the transverse test is the key
guard for the composite change). `solve(observedSet)` with no options is unchanged.

## Out of scope (deferred)

- Traumatic central cord (upper>lower weakness) — needs limb-specific motor findings + CST
  somatotopy; overlaps the cortex/root work.
- Segmental anterior-horn LMN wasting — deferred to cauda equina/conus (which also needs LMN,
  sphincter, saddle findings).
- Sacral sparing as a reasoning finding — waits for intramedullary-vs-extramedullary.
- Modelling the cape's level span (upper + lower border) — the distinct finding already carries
  "suspended"; a numeric span is future.
- Anatomy-table review by a neuroanatomist/neurologist remains outstanding.

## Verification

`cd Code/neurolocaliser-engine && PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
→ all four suites green (brainstem 8 + cord 5 + sensory-level 22 + central-cord). Node lives in
`~/.local` (no system runtime); see project memory.

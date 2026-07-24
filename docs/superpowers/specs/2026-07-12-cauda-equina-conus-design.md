# Cauda equina / conus medullaris — design spec

**Date:** 2026-07-12
**Region increment:** below the cord — the cauda equina and conus medullaris
**Status:** approved design, ready for implementation planning

## Context

The engine derives syndromes from anatomy. Built and green (43 tests): brainstem, the spinal-cord
core four, the dermatomal sensory-level mechanism, and central cord / syrinx. Everything so far
lives in the cord or brainstem and speaks in long-tract / cranial-nerve findings.

This increment adds the region **below where the cord ends (~L1)**: the **cauda equina** (the
lumbosacral nerve *roots*) and the **conus medullaris** (the tapered sacral tip of the cord). Their
distinction is a classic teaching point:

- **Cauda equina** — pure **lower motor neurone** (roots): flaccid, areflexic leg weakness,
  **asymmetric**, prominent **radicular pain** (sciatica); saddle anaesthesia and sphincter loss
  often later. A surgical emergency.
- **Conus medullaris** — **mixed UMN + LMN**, **symmetric**, with **early, prominent** saddle
  anaesthesia and bladder/bowel dysfunction and **UMN signs** (hyperreflexia, extensor plantars);
  less radicular pain.

It is also the first region needing genuinely new finding *types* (LMN weakness, sphincter,
saddle, UMN signs, radicular pain), which will later seed the root→plexus→nerve→muscle region.

## Decisions (settled with the user)

1. **Scope: both cauda equina and conus.** The CES-vs-conus distinction is the point.
2. **Five new findings:** `lmn_weakness`, `saddle_anaesthesia`, `sphincter_dysfunction`,
   `umn_signs`, `radicular_pain`. `umn_signs` (hyperreflexia / extensor plantar) is the clean,
   clinically accurate CES-vs-conus discriminator — absent in CES (pure LMN), present in conus.
   Areflexia is folded into `lmn_weakness`.
3. **Midline representation.** Saddle anaesthesia and sphincter loss have no side, and these
   syndromes are not discriminated by laterality, so cauda/conus are modelled as `side: "midline"`
   sites: the forward model emits each finding once as `finding@midline`. A third side value
   alongside left/right and bilateral; the `finding@side` token format is unchanged.

## The emergent signatures

- **Cauda equina** → `lmn_weakness` + `saddle_anaesthesia` + `sphincter_dysfunction` + `radicular_pain`.
- **Conus medullaris** → `umn_signs` + `saddle_anaesthesia` + `sphincter_dysfunction`.

Shared `saddle_anaesthesia` + `sphincter_dysfunction` place both in the region; the discriminator
emerges from the rest under the existing scorer:
- A CES presentation `→ cauda_equina` (exact match); `conus_medullaris` over-predicts `umn_signs`
  and leaves `lmn_weakness` + `radicular_pain` unexplained → filtered.
- A conus presentation `→ conus_medullaris` (exact match); `cauda_equina` over-predicts
  `lmn_weakness` + `radicular_pain` and leaves `umn_signs` unexplained → filtered.

No rule — the same mechanism that separates the cord syndromes.

## Design

### `src/model/findings.js`

Add five findings (group them clearly — they are a new class of below-cord / root findings):

```js
lmn_weakness:       { desc: "Flaccid, areflexic (lower motor neurone) weakness", group: "Root / LMN" },
umn_signs:          { desc: "Upper motor neurone signs (hyperreflexia, extensor plantar)", group: "Root / LMN" },
saddle_anaesthesia: { desc: "Saddle anaesthesia (S2–S5 perineal sensory loss)", group: "Root / LMN" },
sphincter_dysfunction:{ desc: "Bladder / bowel dysfunction (retention, incontinence, lax anal tone)", group: "Root / LMN" },
radicular_pain:     { desc: "Radicular pain (sciatica), often asymmetric", group: "Root / LMN" },
```

`CROSSES` entries — all `false` (midline / local, never cross): add `lmn_weakness`, `umn_signs`,
`saddle_anaesthesia`, `sphincter_dysfunction`, `radicular_pain` each `false`. (Crossing is moot for
a midline site, but the map is kept complete.)

### `src/model/structures.js`

Add a below-cord block, one structure = one finding:

```js
// ---- CAUDA EQUINA (lumbosacral nerve roots, below the conus) ----
{ id: "ls_roots_motor",       level: "cauda", part: "equina", produces: "lmn_weakness",         crosses: false, note: "lumbosacral motor roots — flaccid, areflexic (LMN) leg weakness" },
{ id: "sacral_roots_sensory", level: "cauda", part: "equina", produces: "saddle_anaesthesia",    crosses: false, note: "S2–S5 sensory roots — saddle anaesthesia" },
{ id: "sacral_roots_autonom", level: "cauda", part: "equina", produces: "sphincter_dysfunction", crosses: false, note: "sacral parasympathetic roots — bladder/bowel/sphincter dysfunction" },
{ id: "ls_roots_pain",        level: "cauda", part: "equina", produces: "radicular_pain",         crosses: false, note: "compressed lumbosacral roots — radicular pain (sciatica), often asymmetric" },
// ---- CONUS MEDULLARIS (sacral cord tip, ~T12–L1 vertebral) ----
{ id: "conus_cst",            level: "conus", part: "medullaris", produces: "umn_signs",            crosses: false, note: "corticospinal fibres at the conus — UMN signs (hyperreflexia, extensor plantar)" },
{ id: "conus_sacral_sensory", level: "conus", part: "medullaris", produces: "saddle_anaesthesia",    crosses: false, note: "sacral cord segments — early symmetric saddle anaesthesia" },
{ id: "conus_sacral_autonom", level: "conus", part: "medullaris", produces: "sphincter_dysfunction", crosses: false, note: "sacral autonomic centres — early symmetric bladder/bowel dysfunction" },
```

`cauda` / `conus` are **not** added to `PARTS` in `sites.js`; their sites come only from the
dedicated composer below, so `buildSites` and the cord composites are untouched.

### `src/model/sites.js`

- `TERRITORY`: add `"cauda|equina": "lumbosacral nerve roots (thecal sac)"` and
  `"conus|medullaris": "conus medullaris (distal cord tip, S2–S5)"`.
- Add `composeCaudaConusSites()`: returns the two midline sites, deriving structures from the
  catalogue (not hand-listed):

```js
export function composeCaudaConusSites() {
  const build = (id, level, part) => {
    const structures = STRUCTURES.filter(s => s.level === level && s.part === part).map(s => s.id);
    return structures.length ? [{ id, side: "midline", level, part,
      territory: TERRITORY[`${level}|${part}`], structures, composite: true }] : [];
  };
  return [ ...build("cauda_equina", "cauda", "equina"),
           ...build("conus_medullaris", "conus", "medullaris") ];
}
```

### `src/engine/inverse.js`

- `candidateSites()` → append `...composeCaudaConusSites()`.
- `describeLevel`: add a branch for the below-cord region. It must be placed **before every other
  branch except the central one** — in particular before the `!isCord && raw` "suggests a cord
  lesion but localises elsewhere" branch, so a cauda/conus best site (which is not `level === "cord"`)
  is handled here rather than falling through to that inconsistency note. When
  `best && (best.site.level === "cauda" || best.site.level === "conus")`, return
  `{ given: raw, applies: false, segment, region: segment ? regionOf(segment) : null, landmark: segment ? landmarkOf(segment) : null, note: "below the cord — a cauda equina / conus lesion; the saddle (S2–S5) distribution is the localiser, not a single sensory level" }`.

### `src/engine/forward.js`

Add a `midline` case to `expectedFindings` and `explain`: when `site.side === "midline"`, emit each
produced finding once with body side `"midline"` (crossing is not consulted). The existing
`bilateral` and one-sided paths are unchanged.

```js
// in expectedFindings, per structure:
if (site.side === "midline") { out.add(signed(struct.produces, "midline")); }
else if (bilateral) { out.add(signed(struct.produces, "left")); out.add(signed(struct.produces, "right")); }
else { out.add(signed(struct.produces, bodySideFor(struct.produces, site.side, struct))); }
```

`explain` mirrors this: `sides = site.side === "midline" ? ["midline"] : (bilateral ? ["left","right"] : [bodySideFor(...)])`.

### `src/engine/score.js`

Add to `LOCALISING`: `saddle_anaesthesia`, `sphincter_dysfunction`, `umn_signs`, `lmn_weakness`.
(`radicular_pain` is left non-localising — pain localises weakly.) Adding ids to `LOCALISING`
cannot affect inputs that don't contain them, so existing tests are unaffected.

### `src/data/syndromes.js`

Add two phonebook entries keyed by `${level}_${part}`:

```js
cauda_equina: {
  name: "Cauda equina syndrome",
  note: "Compression of the lumbosacral nerve roots below the conus: flaccid, areflexic (LMN) leg weakness, often asymmetric, with radicular pain (sciatica), saddle anaesthesia and bladder/bowel dysfunction.",
  ddx: ["Central lumbar disc prolapse", "Tumour / metastasis", "Epidural abscess or haematoma", "Trauma"],
  red: "A surgical emergency — new saddle anaesthesia, bladder dysfunction or bilateral sciatica needs urgent MRI and decompression."
},
conus_medullaris: {
  name: "Conus medullaris syndrome",
  note: "Lesion of the sacral cord tip: early, symmetric saddle anaesthesia and bladder/bowel dysfunction with a mixed UMN + LMN picture (UMN signs — hyperreflexia, extensor plantars) and relatively symmetric, less radicular leg involvement.",
  ddx: ["Intramedullary or extramedullary tumour", "Disc / compression at T12–L1", "Ischaemia", "Demyelination"],
  red: "Early symmetric sphincter involvement with UMN signs — urgent MRI of the conus; distinguish from cauda equina as it changes the level imaged."
},
```

`nameForSite` is unchanged.

## Modules touched

- `src/model/findings.js` — 5 findings + 5 `CROSSES` entries.
- `src/model/structures.js` — 7 structures (levels `cauda`, `conus`).
- `src/model/sites.js` — 2 territories + `composeCaudaConusSites()`.
- `src/engine/inverse.js` — candidate list + `describeLevel` branch.
- `src/engine/forward.js` — `midline` emission in `expectedFindings` + `explain`.
- `src/engine/score.js` — 4 findings → `LOCALISING`.
- `src/data/syndromes.js` — `cauda_equina` + `conus_medullaris` entries.
- `test/cauda-conus.test.js` (new) + `package.json` test script + `README.md` status line.
- Post: both artefacts (flow coverage strip + anatomy model) and project memory.

## Testing (TDD, red first)

New file `test/cauda-conus.test.js`:

1. **CES emergence** — `["lmn_weakness@midline","saddle_anaesthesia@midline","sphincter_dysfunction@midline","radicular_pain@midline"]`
   → best `cauda_equina`, name includes "Cauda equina".
2. **Conus emergence** — `["umn_signs@midline","saddle_anaesthesia@midline","sphincter_dysfunction@midline"]`
   → best `conus_medullaris`, name includes "Conus".
3. **Discrimination** — CES input's best is **not** `conus_medullaris`; conus input's best is **not**
   `cauda_equina` (shared saddle + sphincter don't collapse them).
4. **Midline level note** — `solve(cesInput).level.applies === false` and the note mentions the
   saddle/below-the-cord distribution (not "undetermined").

**Regression:** the existing 8 + 5 + 22 + 8 = 43 tests stay green — the `midline` emission fires
only for `side: "midline"` sites, the new findings never appear in existing inputs, and the
`describeLevel` branch fires only for cauda/conus best sites.

## Out of scope (deferred)

- Asymmetry / symmetry as a modelled, scored feature (CES asymmetric, conus symmetric) — described
  in the phonebook, not reasoned with; laterality isn't load-bearing for these midline syndromes.
- Individual root / dermatome / myotome mapping (L4 vs S1 etc.) — belongs to the future
  root→plexus→nerve→muscle region, which these findings seed.
- Anatomy-table review by a neuroanatomist/neurologist remains outstanding.

## Verification

`cd Code/neurolocaliser-engine && PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
→ all five suites green (brainstem 8 + cord 5 + sensory-level 22 + central-cord 8 + cauda-conus).
Node lives in `~/.local` (no system runtime); see project memory.

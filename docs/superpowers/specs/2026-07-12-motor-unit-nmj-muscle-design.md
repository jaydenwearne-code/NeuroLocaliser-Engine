# Motor unit — anterior horn, NMJ & muscle — regional mapping design spec

**Date:** 2026-07-12
**Region increment:** the pure-motor end of the motor unit — anterior horn cell, neuromuscular junction
(post- and pre-synaptic), and muscle
**Status:** approved design, ready for implementation planning

## Context

The engine derives syndromes from anatomy (golden rule: no syndrome is an `if` rule; `syndromes.js`
is a phonebook keyed by emergent site). Built and green (294 assertions, 8 suites): brainstem, the
spinal-cord core four, the sensory-level mechanism, central cord / syrinx, cauda equina / conus, the
cortex, the subcortex, and the cranial nerves / skull base.

This increment opens the **peripheral neuromuscular apparatus** with its **pure-motor end**: the
anterior horn cell, the neuromuscular junction, and muscle. The clinical question it answers is *"a
symmetric weakness with no sensory loss — is it the anterior horn, the junction, or the muscle?"* The
sensory-bearing peripheral regions (root, plexus, named nerve, length-dependent polyneuropathy) are the
**next** increment; they add the sensory findings that will complete the peripheral localisation and
justify the refactor flagged below.

These conditions are **generalized and symmetric**, so each is a **bilateral** site (emits
`finding@left` + `finding@right`), reusing the cord's existing bilateral emission. Like cauda/conus,
`motor_unit` is a **composer-built level**, not a left/right `buildSites` level (a one-sided myopathy
would be wrong). **This is the fourth region in a row that adds no new forward-model mechanism** — the
much-anticipated "fatigability" and "length-dependence" turn out to be *findings*, not solver machinery.

## Decisions (settled with the user)

1. **Scope: the pure-motor endings only** — anterior horn cell, NMJ (post- and pre-synaptic), muscle.
   Root / plexus / named nerve / polyneuropathy are the next increment; the visual pathway and the
   pathology layer remain their own future regions.
2. **The anterior horn is modelled as PURE LOWER MOTOR NEURONE — not ALS.** Baking `umn_signs` into the
   anterior-horn part would be a disguised `if (UMN && LMN) → ALS` rule, violating the golden rule: the
   UMN signs of ALS come from a different structure (the corticospinal tract, *above* the motor unit).
   The anterior-horn part therefore localises the genuinely pure-LMN anterior-horn diseases (progressive
   muscular atrophy, spinal muscular atrophy, poliomyelitis / post-polio, monomelic amyotrophy,
   Kennedy's). **ALS is deferred to the future pathology layer** as its flagship case: a pathology that
   fires on the *co-occurrence* of UMN findings and LMN findings across the corticospinal tract and the
   anterior horn, with no sensory loss. The engine's existing multifocal minimal-set cover is the
   precursor; the pathology layer will later *name* that site pair "MND/ALS". A `CONTRIBUTING.md` note
   records this so it is tracked, not lost.
3. **Fasciculations are a GENERAL, NON-LOCALISING lower-motor-neurone finding.** Fasciculations reflect
   LMN irritability *anywhere* along the lower motor neurone (anterior horn, root, plexus, nerve — even
   benign fasciculation syndrome). They are florid in anterior-horn disease but not specific to it, so
   they mark *LMN-ness*, not *level*. `fasciculations` is declared general and non-localising; in this
   increment only the anterior horn emits it, but when root/plexus/nerve arrive they emit it too and it
   correctly stops discriminating between them.
4. **What localises the anterior horn is the PATTERN, not a sign** — pure-motor LMN signs with **no
   sensory loss** and a distribution **not confined to a root or nerve territory**. In this increment
   that wins by parsimony over NMJ/muscle (which differ by fatigability / fixed-proximal); when
   root/plexus/nerve arrive, those add *sensory* findings, so a pure-motor picture localises to the
   anterior horn by parsimony (no sensory to explain) while a motor+sensory picture goes to the
   root/nerve. **The sensory findings become the level-localisers; the LMN-ness findings stay shared.**
5. **`lmn_weakness` is the same kind of general LMN sign** and is currently marked `LOCALISING` only as a
   legacy of the cauda increment (the sacral roots were then the sole LMN producer). Demoting it is the
   principled endpoint but it touches the cauda/conus region and its tests, and the sensory localisers
   that justify the change are not built until the PNS increment. **It is therefore left as-is here and
   flagged for the PNS increment**, not demoted in this pass.

## Architecture — no new mechanism

- **Crossing** — every finding is bilateral/ipsilateral; the new findings get `CROSSES: false`, no
  per-structure override, no gate. Bilateral sites emit each finding `@left` and `@right`.
- **Emission** — reuses the existing `side: "bilateral"` branch of the forward model.
- **Sites** — `composeMotorUnitSites()` builds one bilateral site per part (`motor_unit_<part>`), the
  same shape as `composeCaudaConusSites` (which builds midline sites) — so `motor_unit` is NOT added to
  `LEVELS`/`PARTS`; it exists only through its structures and this composer. Concatenated in
  `inverse.candidateSites()`.
- **describeLevel** — a `motor_unit` winner is not cord/cauda/conus, so no new branch.

## The part → finding map

Each is a **bilateral** site (symmetric disease):

| Part (`motor_unit_<part>`) | Structures → findings | Localises to |
|---|---|---|
| `anterior_horn` | lmn_weakness, **fasciculations** (general LMN), cn_bulbar | pure-LMN anterior-horn disease (PMA/SMA/polio/Kennedy) |
| `nmj_postsynaptic` | **fatigable_weakness**, **fatigable_ocular**, cn_bulbar, proximal_weakness | Myasthenia gravis |
| `nmj_presynaptic` | **facilitating_weakness**, **autonomic_features**, proximal_weakness | Lambert-Eaton |
| `muscle` | proximal_weakness | Myopathy |

## Findings vocabulary (`src/model/findings.js`)

Six new findings, group `"Motor unit"`, all `CROSSES: false`, none `NON_LATERALISED`.

```js
fatigable_weakness:   { desc: "Fatigable weakness — worsens with sustained/repeated effort (post-synaptic NMJ, myasthenia)", group: "Motor unit" },
fatigable_ocular:     { desc: "Fatigable ptosis and diplopia (ocular myasthenia)", group: "Motor unit" },
facilitating_weakness:{ desc: "Weakness that transiently improves with brief exercise (pre-synaptic NMJ, Lambert-Eaton)", group: "Motor unit" },
autonomic_features:   { desc: "Autonomic features — dry mouth, constipation, impotence (Lambert-Eaton / autonomic)", group: "Motor unit" },
fasciculations:       { desc: "Muscle fasciculations — lower-motor-neurone irritability (NOT localising: anterior horn, root, plexus or nerve)", group: "Motor unit" },
proximal_weakness:    { desc: "Symmetric proximal (limb-girdle) weakness", group: "Motor unit" },
```

- **`LOCALISING` (in `score.js`):** `fatigable_weakness`, `fatigable_ocular`, `facilitating_weakness`,
  `autonomic_features`.
- **NON-localising (deliberately not added):** `fasciculations` (general LMN sign, decision 3) and
  `proximal_weakness` (shared by MG/LEMS/muscle — so **myopathy emerges by parsimony**: bare bilateral
  proximal weakness → muscle, because MG/LEMS over-predict fatigability/autonomic).

Reused: `lmn_weakness`, `cn_bulbar` (both already `CROSSES:false`, both already `LOCALISING`).

## Structures (`src/model/structures.js`)

A `motor_unit` level. One structure = one finding, no override, no gate. The anterior horn carries **no**
`umn_signs` (decision 2).

```
anterior_horn:    ah_lmn → lmn_weakness; ah_fascic → fasciculations; ah_bulbar → cn_bulbar
nmj_postsynaptic: mg_fatig → fatigable_weakness; mg_ocular → fatigable_ocular; mg_bulbar → cn_bulbar; mg_prox → proximal_weakness
nmj_presynaptic:  lems_facil → facilitating_weakness; lems_auto → autonomic_features; lems_prox → proximal_weakness
muscle:           myo_prox → proximal_weakness
```

## Sites (`src/model/sites.js`)

- Add `TERRITORY` entries for the four `motor_unit|<part>` keys (compartment/description).
- Add `composeMotorUnitSites()`: for each part, one `{ id: "motor_unit_<part>", side: "bilateral",
  level: "motor_unit", part, structures (derived), composite: true }`. `LEVELS`/`PARTS` untouched.

## Forward model / Scoring / Inverse solver

- `forward.js` — **no changes** (bilateral emission already exists).
- `score.js` — add the four localising findings to `LOCALISING` (not `fasciculations`, not
  `proximal_weakness`).
- `inverse.js` — import and concatenate `composeMotorUnitSites()` in `candidateSites()`.

## Phonebook (`src/data/syndromes.js`)

Keyed by `level_part`:
- `motor_unit_anterior_horn` → **Anterior horn cell disease (lower motor neurone)** — PMA, SMA,
  poliomyelitis/post-polio, Kennedy's. Explicitly *not* ALS (the mixed UMN+LMN picture is the pathology
  layer's job).
- `motor_unit_nmj_postsynaptic` → **Myasthenia gravis (post-synaptic NMJ)**.
- `motor_unit_nmj_presynaptic` → **Lambert-Eaton myasthenic syndrome (pre-synaptic NMJ)**.
- `motor_unit_muscle` → **Myopathy (muscle)**.

## Emergent syndromes (no rules — same scorer)

- **Anterior horn (pure LMN)** — `lmn_weakness` + `fasciculations` (no sensory) → anterior horn; NMJ and
  muscle emit neither.
- **Myasthenia gravis** — `fatigable_weakness` (+ ocular) is the hallmark; ocular predominance separates
  it from LEMS.
- **Lambert-Eaton** — `facilitating_weakness` + `autonomic_features`.
- **Myopathy** — bare bilateral proximal weakness, by parsimony (MG/LEMS over-predict).
- **ALS is deliberately NOT a single site** — a mixed bilateral `umn_signs` + `lmn_weakness` picture
  leaves `umn_signs` unexplained by the anterior-horn (pure-LMN) site, which is the honest pre-pathology-
  layer behaviour (the UMN component belongs to the corticospinal tract / pathology layer).

## Testing (TDD, red first) — `test/motor-unit.test.js`

New standalone suite (added to `package.json` `test` and the README/`npm test` chain). Assertions:

1. **Vocabulary** — the six new findings exist, `CROSSES:false`, not `NON_LATERALISED`.
2. **Localising policy (decisions 3 & 5)** — `LOCALISING` (imported from `score.js`) **has**
   `fatigable_weakness` / `facilitating_weakness` / `autonomic_features` / `fatigable_ocular` and
   **does NOT have** `fasciculations` or `proximal_weakness`.
3. **Structures** — each part produces its findings; `anterior_horn` produces **no** `umn_signs`; no
   skull/crosses/gate fields on any `motor_unit` structure.
4. **Sites & composer** — `composeMotorUnitSites` builds the four sites, each `side: "bilateral"`.
5. **Forward** — `anterior_horn` emits `lmn_weakness@left` and `@right`, `fasciculations@left`/`@right`;
   `nmj_postsynaptic` emits `fatigable_weakness@left`/`@right`.
6. **Anterior horn (pure LMN)** — `{lmn_weakness, fasciculations}` bilateral → `motor_unit_anterior_horn`.
7. **Myasthenia gravis** — `{fatigable_weakness, fatigable_ocular, proximal_weakness, cn_bulbar}`
   bilateral → `motor_unit_nmj_postsynaptic`.
8. **Lambert-Eaton** — `{facilitating_weakness, autonomic_features, proximal_weakness}` bilateral →
   `motor_unit_nmj_presynaptic`.
9. **Myopathy by parsimony** — `{proximal_weakness}` bilateral → `motor_unit_muscle` (beats MG/LEMS).
10. **ALS is not a site** — `{lmn_weakness, umn_signs, fasciculations}` bilateral: best is the anterior
    horn but `umn_signs@left` is in its **unexplained** set (the UMN component is not captured by any
    motor-unit site → the pathology layer).
11. **Regression** — all eight prior suites stay green.

## Modules touched

- `src/model/findings.js` — 6 findings + 6 `CROSSES` entries.
- `src/model/structures.js` — `motor_unit` level, 11 structures.
- `src/model/sites.js` — `TERRITORY` + `composeMotorUnitSites`.
- `src/engine/score.js` — 4 `LOCALISING` additions.
- `src/engine/inverse.js` — concat the new composer in `candidateSites()`.
- `src/data/syndromes.js` — 4 phonebook entries.
- `test/motor-unit.test.js` — new suite; `package.json`, `README.md`, `CONTRIBUTING.md` — register.
- `CONTRIBUTING.md` — add a **Pathology layer** note (ALS/MND flagship: UMN+LMN co-occurrence) and flag
  the `lmn_weakness` demotion for the PNS increment.
- `docs/artifacts/architecture.html`, `docs/artifacts/anatomy-model.html` — sync the new region.

## Out of scope (deferred)

- **Root / plexus / named nerve / length-dependent polyneuropathy** — the sensory-bearing PNS and the
  first genuine length-dependence mechanism (stocking-glove). The next increment; it also carries the
  `lmn_weakness` → non-localising refactor (decision 5).
- **ALS / MND as a named entity** — the pathology layer (decision 2), keyed on UMN+LMN co-occurrence
  across the corticospinal tract + anterior horn with no sensory loss.
- **Upper motor neurone in isolation** (primary lateral sclerosis, hereditary spastic paraplegia) — a
  corticospinal/UMN region, above the motor unit.
- Fibrillations/EMG findings, myotonia, specific myopathy subtypes, single-fibre/RNS electrophysiology,
  ocular-vs-generalized MG staging.

## Verification

`PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test` — the new suite green and all eight
prior suites still green. Then sync and eyeball the two Artifacts.

Not a medical device; not for clinical use. Anatomy tables still need neuroanatomist review.

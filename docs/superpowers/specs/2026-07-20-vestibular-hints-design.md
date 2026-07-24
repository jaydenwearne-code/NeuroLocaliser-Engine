# Peripheral-vestibular HINTS axis — design spec

**Date:** 2026-07-20
**Region increment:** Tier 1 Increment B — the vestibular HINTS axis (Head-Impulse, Nystagmus, Test-of-Skew)
distinguishing peripheral from central acute vestibular syndrome, plus canal-specific BPPV.
**Status:** approved design, ready for implementation planning
**Audit:** `docs/superpowers/audits/2026-07-19-neuraxis-coverage-audit.md` (Tier 1, Increment B)

## Context

The nystagmus increment (2026-07-13) built the peripheral-vs-central *nystagmus* axis (`nystagmus_peripheral`
vs `nystagmus_gaze_evoked`) and the multi-source `cn8_vertigo`, and explicitly **deferred the HINTS mechanics**
(head-impulse, test-of-skew, positional). This increment adds them — the highest-stakes vestibular call
(benign vestibular neuritis vs a posterior-circulation stroke). Pure anatomy data; **no new solver mechanism**.

## The headline claim

**The counterintuitive "normal head-impulse = stroke" logic emerges from the over-prediction penalty — not a
rule.** The peripheral labyrinth predicts `head_impulse_abnormal`. In an acute vestibular syndrome, a patient
with vertigo + `skew_deviation` but WITHOUT `head_impulse_abnormal` (a *normal* head impulse — the dangerous
sign) makes the labyrinth over-predict (`head_impulse_abnormal` unmatched) and fail to explain the skew, so
the lean central-vestibular site wins. HINTS-central ("INFARCT": Impulse Normal, Fast-phase Alternating,
Refixation-on-cover) falls out of which findings each site does and does not produce.

## Findings vocabulary (`src/model/findings.js`)

Five new findings, group `"Vestibular / nystagmus"`, all `CROSSES:false`, all in `NON_LATERALISED` (@none;
they are direction/pattern signs, not body-side — the SITE carries the side via `cn8_vertigo`), all LOCALISING.

| finding | desc |
|---|---|
| `head_impulse_abnormal` | Corrective catch-up saccade on head-impulse (h-HIT) — a PERIPHERAL sign (VOR broken at the labyrinth/nerve) |
| `skew_deviation` | Vertical ocular misalignment (ocular tilt reaction) — a CENTRAL sign (brainstem graviceptive/otolithic) |
| `nystagmus_positional_posterior` | Up-beat + torsional nystagmus on Dix-Hallpike — posterior semicircular canal (BPPV) |
| `nystagmus_positional_horizontal` | Horizontal nystagmus on supine roll — horizontal (lateral) canal (BPPV) |
| `nystagmus_positional_anterior` | Down-beat + torsional nystagmus — anterior canal (BPPV, rare) |

Reused: `cn8_vertigo` (lateralised), `nystagmus_peripheral` (@none), `nystagmus_gaze_evoked` (@none),
`hearing_loss`.

## Sites & structures

### Peripheral vestibular (`peripheral_vestibular` level)

- **`labyrinth`** (existing, lateralised) gains a structure `vest_head_impulse` → `head_impulse_abnormal`.
  This is the acute-vestibular-syndrome / vestibular-neuritis site: `cn8_vertigo` + `nystagmus_peripheral` +
  `head_impulse_abnormal` (+ `hearing_loss` by company → labyrinthitis / Ménière). A *normal* head impulse is
  simply the absence of `head_impulse_abnormal` from the input.
- **Three new canal parts** (lateralised, `buildSites`), each one structure → its positional finding:
  - `posterior_canal` → `bppv_post` → `nystagmus_positional_posterior`
  - `horizontal_canal` → `bppv_horiz` → `nystagmus_positional_horizontal`
  - `anterior_canal` → `bppv_ant` → `nystagmus_positional_anterior`
  BPPV localises to the specific canal by the nystagmus DIRECTION. The canal sites do NOT carry
  `head_impulse_abnormal` (HIT is normal in BPPV — positional, not spontaneous, vertigo).

### Central vestibular (`central_vestibular` level — NEW)

- **`central_vestibular|nucleus`** (lateralised, `buildSites`), the lean HINTS-central site (vestibular
  nucleus / nodulus, posterior-fossa AVS):
  - `cv_vertigo` → `cn8_vertigo`
  - `cv_nyst` → `nystagmus_gaze_evoked`
  - `cv_skew` → `skew_deviation`
  Being lean, it wins the isolated central-AVS picture over `medulla|lateral` (which over-predicts the rest of
  Wallenberg). Add `central_vestibular` to `LEVELS` **after `peripheral_vestibular`**, `nucleus` to `PARTS` +
  `TERRITORY`. The build order matters: an *isolated* `cn8_vertigo` (no discriminators) ties the two lean
  sites, and it must resolve to the peripheral labyrinth (isolated vertigo is usually peripheral) — `buildSites`
  iterates `LEVELS` in order, so peripheral (earlier) wins the tie.

### Wallenberg enrichment (`medulla|lateral`)

- Add `icp_otr` → `skew_deviation` at `medulla|lateral` — the ocular tilt reaction / skew is classic in
  Wallenberg. A full Wallenberg still localises to the lateral medulla; this only enriches its emission.

## Emergence (no rules — same scorer)

- **Vestibular neuritis (peripheral AVS)** — `{cn8_vertigo@L, nystagmus_peripheral@none,
  head_impulse_abnormal@none}` → `left_peripheral_vestibular_labyrinth`. Central over-predicts
  gaze-evoked + skew and can't match the peripheral pair.
- **Posterior-circulation stroke (central AVS)** — `{cn8_vertigo@L, nystagmus_gaze_evoked@none,
  skew_deviation@none}` → `left_central_vestibular_nucleus`. Labyrinth over-predicts nystagmus_peripheral +
  head_impulse_abnormal and can't explain skew; lateral medulla over-predicts the rest of Wallenberg.
- **The dangerous "normal HIT + skew"** — `{cn8_vertigo@L, skew_deviation@none}` (no head_impulse_abnormal)
  → central_vestibular (the tell is skew; labyrinth over-predicts head_impulse_abnormal).
- **BPPV** — an isolated `nystagmus_positional_posterior@none` → `posterior_canal`; horizontal → horizontal
  canal; anterior → anterior canal.
- **Ménière / labyrinthitis** — `{cn8_vertigo@L, nystagmus_peripheral@none, hearing_loss@L}` → labyrinth
  (+ cochlear by company), unchanged.
- **Full Wallenberg** — still → `medulla|lateral` (skew now among its signs).

## Architecture — modules touched

- `src/model/findings.js` — 5 findings; `CROSSES` (all false); `NON_LATERALISED` += all 5.
- `src/engine/score.js` — `LOCALISING` += all 5.
- `src/model/structures.js` — `vest_head_impulse`; `bppv_post`/`bppv_horiz`/`bppv_ant`; `cv_vertigo`/`cv_nyst`/
  `cv_skew`; `icp_otr`.
- `src/model/sites.js` — `LEVELS` += `central_vestibular`; `PARTS` += `posterior_canal`, `horizontal_canal`,
  `anterior_canal`, `nucleus`; `TERRITORY` += the four.
- `src/engine/forward.js`, `src/engine/inverse.js` — **no change**.
- `src/data/syndromes.js` — update `peripheral_vestibular_labyrinth`; add the 3 canals + `central_vestibular_nucleus`.
- `test/vestibular-hints.test.js` — new suite; register in `package.json`, `README.md`, `CONTRIBUTING.md`.
- Memory sync.

## Testing (TDD, red first) — `test/vestibular-hints.test.js`

1. **Vocabulary** — 5 findings exist; all `CROSSES:false`, all NON_LATERALISED, all LOCALISING.
2. **Structures/sites** — labyrinth includes head_impulse_abnormal; the 3 canal sites exist and each →
   its positional finding; `central_vestibular|nucleus` → cn8_vertigo+nystagmus_gaze_evoked+skew_deviation;
   `medulla|lateral` now includes skew_deviation.
3. **Peripheral AVS** — the neuritis triad → labyrinth; central does NOT win.
4. **Central AVS** — the central triad → central_vestibular; and `{cn8_vertigo, skew_deviation}` (normal HIT)
   → central_vestibular (the emergency).
5. **BPPV** — each positional finding localises to its canal.
6. **Regression** — Ménière still → labyrinth; **full Wallenberg still → medulla|lateral** (verify
   engine.test Wallenberg winner unchanged despite the added skew); all prior suites green.

## Out of scope (deferred)

- Otolith/utricle-saccule modelling beyond skew; canal repositioning (Epley) and cupulo-vs-canalithiasis
  (geotropic vs apogeotropic) sub-typing; the full ocular tilt reaction triad (head tilt + ocular torsion);
  central positional nystagmus (nodulus) as distinct from BPPV; vestibular migraine (a pathology, not a site).

## Verification

`PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test` — new suite green, all prior suites green.
Not a medical device; anatomy tables still need neuroanatomist review.

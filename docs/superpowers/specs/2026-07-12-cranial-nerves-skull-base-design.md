# Cranial nerves & skull base — regional mapping design spec

**Date:** 2026-07-12
**Region increment:** the extra-axial cranial nerves at the skull base — cavernous sinus, superior
orbital fissure, orbital apex, jugular foramen, hypoglossal canal, carotid space, cerebellopontine angle
**Status:** approved design, ready for implementation planning

## Context

The engine derives syndromes from anatomy (golden rule: no syndrome is an `if` rule; `syndromes.js`
is a phonebook keyed by emergent site). Built and green (229 assertions, 7 suites): brainstem, the
spinal-cord core four, the sensory-level mechanism, central cord / syrinx, cauda equina / conus, the
cortex, and the subcortex.

This increment adds the **peripheral cranial nerves at the skull base** — the extra-axial counterpart of
the brainstem's *nuclear* cranial-nerve signs. Where the brainstem models CN nuclei sharing a vascular
territory, the skull base models CN trunks sharing a **bony foramen or compartment**. The organising
concept is therefore **foramina-as-sites: the peripheral analogue of shared vascular territory** — nerves
that thread the same canal fail together, so modelling the compartment yields the syndrome for free.

Everything here is **ipsilateral** (a peripheral nerve lesion appears on its own side), so crossing
reuses the existing `CROSSES: false` default (every CN finding is already `false`). There is no new
emission path, no gate, no `describeLevel` branch. **This is the third region in a row that adds no new
forward-model mechanism** — further evidence the solver has stabilised and regions are now pure data.

## The headline claims (what the tests must prove)

1. **Nested syndromes derive by union; discriminators emerge.** The superior orbital fissure (SOF) is
   the shared core (III, IV, VI, V1). The cavernous sinus is `SOF ∪ foramen_rotundum` (adds V2); the
   orbital apex is `SOF ∪ optic_canal` (adds monocular visual loss). So **V2 cheek numbness is exactly
   what separates a cavernous-sinus lesion from an SOF lesion, and optic neuropathy separates the orbital
   apex** — not because a rule says so, but because those nerves are/aren't in the compartment's union.
   This mirrors `whole-MCA = superior ∪ inferior` from the cortex increment.
2. **Nuclear vs peripheral emerges from the company a sign keeps.** An isolated `cn6_palsy` is honestly
   non-localising (long intracranial course). But `cn3_palsy` **+ contralateral hemiparesis** localises
   to the midbrain nucleus (Weber), while `cn3 + cn4 + cn6 + V1 + V2 + Horner`, all ipsilateral with no
   long-tract signs, localises to the cavernous sinus. The same CN finding resolves nuclear or peripheral
   by what accompanies it — the subcortex increment's "surface the ddx" pattern, again with no rule.

## Decisions (settled with the user)

1. **Scope: the full skull base** — the orbital/cavernous cluster (cavernous sinus, SOF, orbital apex),
   the lower-cranial-nerve cluster (jugular foramen / Vernet, Collet-Sicard, Villaret, hypoglossal
   canal), and the cerebellopontine angle (VII/VIII/V).
2. **Proptosis / chemosis are deferred to a later pathology/mechanical layer.** They are congestive,
   mechanical signs of a swollen orbit — not "a nerve produces a finding" — so they do not fit the
   one-structure-is-one-nerve model. They belong with the future pathology + adjacency layer, not here.
3. **CPA cranial nerve VIII is a new `hearing_loss` finding** (sensorineural hearing loss ± tinnitus,
   the acoustic-neuroma sentinel), distinct from the existing vestibular `cn8_vertigo` (which stays the
   brainstem/vestibular sign).
4. **`optic_neuropathy` is monocular visual loss only** (optic canal / orbital apex). **The rest of the
   visual pathway is deferred to its own dedicated future increment — and must NOT be forgotten.** See
   "Out of scope" and the roadmap note below; the implementation adds an explicit **Visual pathway**
   entry to `CONTRIBUTING.md` and project memory so it is tracked as required, not lost.

## Architecture — no new mechanism

- **Crossing** — every finding is ipsilateral; the five new findings get `CROSSES: false`, and no
  structure sets a per-structure override. Standard `bodySideFor` places each finding on the lesion side.
- **Emission** — every site is a left/right primitive or a left/right composite; no `@none` / `@midline`
  / `@bilateral`. Standard one-sided emission.
- **Gating** — no hemisphere / bilateral-only gate; `structActiveAt` passes every skull-base structure.
- **Composites** — `composeSkullBaseSites()` is a direct sibling of `composeVascularCortexSites` /
  `composeDeepVascularSites`, unioning primitive foramina into the named cross-compartment syndromes,
  and is concatenated in `inverse.candidateSites()`.
- **Re-listing a nerve per compartment is the established pattern** — the corticospinal tract already
  exists as `cst_midbrain → cst_pons → pyramid → cst_cord`. A cranial nerve that traverses several
  compartments is likewise a separate structure in each; that is honest anatomy, not redundancy. To
  avoid re-listing the four shared orbital nerves, the bigger compartments are **unions** of the SOF core
  (see below), so each shared nerve is stated once.

## The compartment → nerve map

**Primitive parts** (each a valid standalone lesion site; all findings ipsilateral):

| Part (`skull_base\|…`) | Structures → finding | Compartment |
|---|---|---|
| `sup_orbital_fissure` | cn3, cn4, cn6, **v1_sensory**, horner | superior orbital fissure |
| `foramen_rotundum` | **v2_sensory** | foramen rotundum (V2) |
| `optic_canal` | **optic_neuropathy** | optic canal (CN II) |
| `jugular_foramen` | cn_bulbar (IX/X), **cn11_weakness** | jugular foramen |
| `hypoglossal_canal` | cn12_palsy | hypoglossal canal |
| `carotid_space` | horner | carotid space (cervical sympathetic) |
| `cpa` | cn7_lmn, **hearing_loss**, v1_sensory (corneal), limb_ataxia | cerebellopontine angle |

**Composite parts** (`composeSkullBaseSites()`):
- `cavernous_sinus` = `sup_orbital_fissure ∪ foramen_rotundum` → III/IV/VI/V1/**V2**/Horner
- `orbital_apex` = `sup_orbital_fissure ∪ optic_canal` → III/IV/VI/V1/Horner/**optic**
- `collet_sicard` = `jugular_foramen ∪ hypoglossal_canal` → IX/X, XI, **XII**
- `villaret` = `jugular_foramen ∪ hypoglossal_canal ∪ carotid_space` → IX/X, XI, XII, **Horner**
- Vernet is the `jugular_foramen` primitive itself (named in the phonebook, no composite needed).

Notes for neuroanatomist review: (a) the orbital sympathetic (Horner) is placed in the SOF so cavernous
and orbital apex inherit it; the SOF-vs-cavernous discriminator is V2, not Horner. (b) CPA trigeminal is
modelled by `v1_sensory` (the corneal-reflex sentinel); `limb_ataxia` represents the large-CPA
cerebellar/peduncle compression.

## Findings vocabulary (`src/model/findings.js`)

Five new findings, group `"Cranial nerve"`, all ipsilateral. `cn4_palsy` already exists (previously an
orphan with no producer) and finally gets one.

```js
optic_neuropathy: { desc: "Monocular visual loss / optic neuropathy (CN II)", group: "Cranial nerve" },
v1_sensory:       { desc: "Facial sensory loss / reduced corneal reflex — ophthalmic division (V1)", group: "Cranial nerve" },
v2_sensory:       { desc: "Facial sensory loss — maxillary division (V2, cheek)", group: "Cranial nerve" },
cn11_weakness:    { desc: "Accessory (CN XI) palsy — trapezius / sternocleidomastoid weakness, shoulder droop", group: "Cranial nerve" },
hearing_loss:     { desc: "Sensorineural hearing loss ± tinnitus (CN VIII)", group: "Cranial nerve" },
```

`CROSSES`: all five `false`. None in `NON_LATERALISED`.

## Structures (`src/model/structures.js`)

A `skull_base` level. One structure = one nerve = one finding, no `crosses` override, no gates. ~15
structures across the seven primitive parts (see the map above). Structure ids follow the compartment,
e.g. `sof_cn3`, `sof_cn4`, `sof_cn6`, `sof_v1`, `sof_symp`, `rot_v2`, `opt_cn2`, `jug_ixx`, `jug_cn11`,
`hyp_cn12`, `car_symp`, `cpa_cn7`, `cpa_cn8`, `cpa_v1`, `cpa_ataxia`.

## Sites (`src/model/sites.js`)

- Add `"skull_base"` to `LEVELS` (after `subcortex`).
- Add the seven primitive parts to `PARTS` (the four composite parts are composer-only, like `mca`/`aca`).
- Add `TERRITORY` entries for the seven `skull_base|…` primitives (the compartment description).
- Add `composeSkullBaseSites()`: builds `cavernous_sinus`, `orbital_apex`, `collet_sicard`, `villaret`
  per side by unioning the derived structure lists of the primitive parts — the same shape as the
  cortical/deep vascular composers.

## Forward model (`src/engine/forward.js`)

**No changes.** Every finding is ipsilateral and lateralised; the standard emission path handles them.

## Scoring (`src/engine/score.js`)

Add the five new findings to `LOCALISING` (each pins a compartment). Every reused CN finding is already
localising.

## Inverse solver (`src/engine/inverse.js`)

- Import and concatenate `composeSkullBaseSites()` in `candidateSites()`.
- `describeLevel` needs **no new branch**: a skull-base winner is not cord/cauda/conus, so a stray
  sensory level is reported gently ("suggests cord, but findings localise to …skull_base…").

## Phonebook (`src/data/syndromes.js`)

Descriptive entries keyed by `level_part`:
- `skull_base_sup_orbital_fissure` → **Superior orbital fissure syndrome**
- `skull_base_cavernous_sinus` → **Cavernous sinus syndrome**
- `skull_base_orbital_apex` → **Orbital apex syndrome (Jacod)**
- `skull_base_jugular_foramen` → **Jugular foramen syndrome (Vernet)**
- `skull_base_hypoglossal_canal` → **Hypoglossal canal syndrome**
- `skull_base_collet_sicard` → **Collet-Sicard syndrome**
- `skull_base_villaret` → **Villaret syndrome**
- `skull_base_cpa` → **Cerebellopontine angle syndrome** (e.g. vestibular schwannoma)
- (optional isolated primitives: `skull_base_foramen_rotundum`, `skull_base_optic_canal`,
  `skull_base_carotid_space` — isolated V2 / optic / Horner)

## Emergent syndromes (no rules — same scorer)

- **SOF vs cavernous vs orbital apex** — discriminated by V2 (cavernous) and optic neuropathy (apex);
  bare SOF wins when neither is present, by parsimony.
- **Vernet → Collet-Sicard → Villaret** — the lower-CN staircase: adding XII promotes Vernet to
  Collet-Sicard, adding Horner promotes it to Villaret; each emerges from the union.
- **CPA** — VII + sensorineural hearing loss + corneal (V1) ± ataxia.
- **Nuclear vs peripheral** — `cn3 + contralateral hemiparesis` → midbrain (Weber); `cn3 + cn4 + cn6 +
  V1 + V2 + Horner`, all ipsilateral → cavernous sinus.

## Testing (TDD, red first) — `test/cranial-nerves.test.js`

New standalone suite (added to `package.json` `test` and the README/`npm test` chain). Assertions:

1. **Vocabulary** — the five new findings exist, are `CROSSES:false`, not `NON_LATERALISED`; `cn4_palsy`
   now has ≥1 producer.
2. **Structures** — each primitive part produces its expected findings; no `crosses`/`hemisphere`/
   `bilateralOnly` on any skull-base structure.
3. **Sites & composers** — primitive sites exist; `composeSkullBaseSites` builds cavernous (has V2),
   orbital apex (has optic), collet_sicard (has XII), villaret (has Horner), each unioning the right
   primitives.
4. **Forward** — a left SOF emits cn3/cn4/cn6/v1_sensory/horner `@left`; cavernous adds v2 `@left`;
   orbital apex adds optic `@left`; cpa emits cn7/hearing_loss/v1 `@left`.
5. **SOF vs cavernous vs orbital apex** — the three discriminator cases localise to the three distinct
   compartments; bare SOF is not called cavernous or apex.
6. **Vernet / Collet-Sicard / Villaret staircase** — the three cases localise up the staircase.
7. **CPA** — VII + hearing loss + corneal → `cpa`.
8. **Nuclear vs peripheral** — `{cn3_palsy@L, hemiparesis@R}` → a midbrain site (level `midbrain`);
   the full ipsilateral cavernous picture → level `skull_base`.
9. **Laterality mirror** — a right-sided compartment picture mirrors correctly.
10. **Phonebook** — the emergent sites name their eponyms (SOF, cavernous, orbital apex, Vernet,
    Collet-Sicard, Villaret, CPA).
11. **Regression** — all seven prior suites stay green.

## Modules touched

- `src/model/findings.js` — 5 findings + 5 `CROSSES` entries.
- `src/model/structures.js` — `skull_base` level, ~15 structures.
- `src/model/sites.js` — `LEVELS` + `PARTS` + `TERRITORY` + `composeSkullBaseSites`.
- `src/engine/score.js` — 5 `LOCALISING` additions.
- `src/engine/inverse.js` — concat the new composer in `candidateSites()`.
- `src/data/syndromes.js` — ~8 phonebook entries.
- `test/cranial-nerves.test.js` — new suite; `package.json`, `README.md`, `CONTRIBUTING.md` — register.
- `docs/artifacts/architecture.html`, `docs/artifacts/anatomy-model.html` — sync the new region.

## Out of scope (deferred)

- **Visual pathway (a REQUIRED future increment — do not forget).** This increment models CN II only as
  *monocular* `optic_neuropathy` at the optic canal / orbital apex. The chiasm (bitemporal hemianopia,
  pituitary/craniopharyngioma), optic tract, lateral geniculate, and the optic radiations as a deep
  structure are a **dedicated later region** that will complete the retina→occipital visual pathway and
  connect to the cortex's `homonymous_hemianopia` and the subcortex's optic-radiation site. The
  implementation records this explicitly in `CONTRIBUTING.md` (a "Later: Visual pathway" entry) and in
  project memory so it is tracked, not lost.
- **Proptosis / chemosis and other congestive/mechanical signs** — the pathology/mechanical layer.
- Individual named nerves distal to the foramina (e.g. specific orbital branches), the internal auditory
  meatus vs CPA distinction, cavernous carotid (CCF) haemodynamics, and V3 / foramen ovale.
- Multiple-cranial-neuropathy causes (meningeal carcinomatosis, GBS/Miller-Fisher, basal meningitis) —
  the later multifocal/pathology weighting, not anatomy.

## Verification

`PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test` — the new suite green and all seven
prior suites still green. Then sync and eyeball the two Artifacts (the in-app browser cannot render
file://, localhost, or claude.ai — verify statically and ask the user to view).

Not a medical device; not for clinical use. Anatomy tables still need neuroanatomist review.

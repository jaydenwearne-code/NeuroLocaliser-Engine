# Causes / aetiology layer ("what") — design spec

**Date:** 2026-07-20
**Increment:** the third dimension of the localiser — given a lesion at site X, the tempo-aware differential
of **causes** (the surgical sieve). Sub-project A of the prototype (the app, sub-project B, consumes this).
**Status:** approved design, ready for implementation planning

## Context

The engine answers **where** (site) and **why** (the reasoning + emergent syndrome, via `syndromes.js`). It
does not answer **what** — the aetiological differential. Causes are not derivable from anatomy the way
syndromes are (a lateral-medulla lesion may be stroke, demyelination or tumour), but they are not random:
cause *categories* correlate with site attributes (a vascular territory → stroke; a bony foramen → a
compressive mass; a bilateral/symmetric process → metabolic/degenerative) and with **tempo** of onset. This
layer adds a structured "surgical sieve" causes model that the app filters by onset.

New data module `src/data/causes.js` + a `test/causes.test.js` suite. **No engine changes** (pure data +
one pure function); all prior suites stay green.

## Taxonomy

**Sieve categories** (`CATEGORIES`, ordered; each `{ id, label, tint }` — tint is a CSS-var name for the app):

| id | label |
|---|---|
| `vascular` | Vascular (ischaemic / haemorrhagic) |
| `inflammatory` | Inflammatory / demyelinating / autoimmune |
| `neoplastic` | Neoplastic (+ compressive mass) |
| `infective` | Infective |
| `metabolic` | Metabolic / toxic / nutritional |
| `traumatic` | Traumatic / mechanical |
| `degenerative` | Degenerative / hereditary |
| `congenital` | Congenital / structural |

**Tempo buckets** (`TEMPO`, ordered): `hyperacute` (secs–min), `acute` (hrs–days), `subacute` (days–wks),
`chronic` (wks–yrs). Each cause is tagged with the tempo(s) it typically presents in.

**Likelihood** (`LIKELIHOOD`, ordered for ranking): `common`, `uncommon`, `rare`.

## Data shape

`CAUSES` — a map keyed by the **same site key `nameForSite` uses** (`site.id` if it has a dedicated entry,
else `${site.level}_${site.part}`), so the causes and the syndrome name always line up. Each value is an
array of cause objects:

```js
const CAUSES = {
  medulla_lateral: [
    { name: "PICA / vertebral artery occlusion", cat: "vascular", tempo: ["hyperacute","acute"], likelihood: "common" },
    { name: "Vertebral artery dissection",        cat: "vascular", tempo: ["hyperacute","acute"], likelihood: "common", red: true },
    { name: "MS plaque",                          cat: "inflammatory", tempo: ["subacute"], likelihood: "uncommon" },
    { name: "Lateral medullary tumour / metastasis", cat: "neoplastic", tempo: ["chronic"], likelihood: "rare" },
  ],
  skull_base_jugular_foramen: [
    { name: "Glomus jugulare (paraganglioma)", cat: "neoplastic", tempo: ["chronic"], likelihood: "common" },
    { name: "Schwannoma / meningioma",         cat: "neoplastic", tempo: ["chronic"], likelihood: "common" },
    { name: "Metastasis / skull-base infiltration", cat: "neoplastic", tempo: ["subacute","chronic"], likelihood: "uncommon" },
    { name: "Jugular vein thrombosis",         cat: "vascular", tempo: ["subacute"], likelihood: "rare", red: true },
  ],
  // …
};
```

`red: true` marks a can't-miss cause (surfaced prominently by the app, alongside the phonebook `red` string).

## Bootstrap — restructure the phonebook `ddx`, don't reinvent

`syndromes.js` already carries a hand-authored `ddx` (a causes list) and `red` for ~185 sites. The curated
`CAUSES` entries are produced by **restructuring those `ddx` items** — each freetext cause becomes
`{ name, cat, tempo, likelihood }` — starting with the high-yield **named-syndrome** sites across every
region (brainstem eponyms, cord syndromes, skull-base foramina, plexus, lacunes, the CN peripheral course,
vestibular, etc.). The phonebook `ddx`/`red` stay as the human-readable reference; `causes.js` is the
structured, tempo-aware layer over the same knowledge. **Prototype scope:** curate the named/high-yield
sites; the derived fallback (below) covers the rest, so *every* site returns something. (Full migration of
all 185 entries is a follow-on, tracked in CONTRIBUTING.)

## Derived category fallback (derive-don't-store spirit)

For a site with no curated `CAUSES` entry (or to supplement a thin one), `causesFor` seeds plausible
*category-level* causes from **site attributes** — generic named causes per category:

| Site attribute | Seeded category → generic cause |
|---|---|
| `territory` names an artery (ACA/MCA/PCA/PICA/AICA/SCA/basilar/vertebral/perforator/lenticulostriate/spinal) | `vascular` → "Ischaemic or haemorrhagic stroke" (hyperacute/acute) |
| `level === "skull_base"` (foramen/compartment/nerve-course) | `neoplastic` → "Compressive mass (schwannoma / meningioma / metastasis)" (chronic) |
| `side === "bilateral"` or `level` ∈ {motor_unit, polyneuropathy, combined_degeneration, cerebrum, thalamus_arousal, pseudobulbar} | `metabolic` → "Metabolic / toxic / nutritional"; `degenerative` → "Degenerative / hereditary"; `inflammatory` → "Autoimmune / inflammatory" (subacute/chronic) |
| `level === "nerve"` | `metabolic` → "Diabetic / entrapment"; `neoplastic` → "Compressive"; `inflammatory` → "Vasculitic / inflammatory" |
| `level === "root"` | `neoplastic`/compressive → "Disc / spondylosis / mass"; `infective` → "Herpes zoster" |
| optic sites (`optic_*`, `visual_pathway_chiasm`) | `inflammatory` → "Optic neuritis / demyelination"; `vascular` → "AION"; `neoplastic` → "Compressive (e.g. pituitary at chiasm)" |
| any (generic backstop) | `inflammatory`, `neoplastic`, `infective` as low-likelihood possibilities |

Curated specifics always take precedence over / augment the derived generics; the derived layer only
guarantees coverage.

## API

```js
export function causesFor(site, { onset } = {}) → {
  byCategory: [ { cat, label, tint, causes: [ {name, tempo, likelihood, red} ] } ],  // non-empty categories, category order
  all: [ …flattened, ranked… ],
  onset: onset || null,
  derived: boolean   // true if only the fallback applied (no curated entry)
}
```

- `site` is a site object (as returned by `solve().best.site`), or a bare `{id, level, part, side, territory}`.
- Ranking: by `likelihood` (common→rare), then curated-before-derived.
- `onset` (a tempo id) filters to causes whose `tempo` includes it; omitted → all tempos.
- Pure function; imports `CATEGORIES/TEMPO/LIKELIHOOD/CAUSES` + the derivation rules only.

## Modules touched

- `src/data/causes.js` — **new**: `CATEGORIES`, `TEMPO`, `LIKELIHOOD`, `CAUSES`, derivation rules, `causesFor`.
- `test/causes.test.js` — **new** suite; register in `package.json` + README + CONTRIBUTING.
- No changes to `findings.js` / `structures.js` / `sites.js` / engine. `syndromes.js` unchanged (kept as the
  human-readable reference; causes.js is the structured layer).

## Testing (TDD, red first)

1. **Taxonomy** — `CATEGORIES` has the 8 ids; `TEMPO` the 4; `LIKELIHOOD` the 3; each category has a label.
2. **Data integrity** — every cause in `CAUSES` has a valid `cat` (∈ CATEGORIES), non-empty `tempo` (all ∈
   TEMPO), and a valid `likelihood`. Every curated key resolves to a real site (cross-check against
   `SITE_BY_ID` / composite site ids).
3. **Coverage** — a representative set of named sites (Wallenberg `medulla_lateral`, jugular foramen,
   cavernous sinus, SCD, MG triangle, hand-knob, etc.) have curated `CAUSES` entries.
4. **`causesFor` — curated** — `causesFor({id:"left_medulla_lateral",level:"medulla",part:"lateral",…})`
   returns vascular stroke/dissection under `vascular`, grouped by category, ranked common-first.
5. **`causesFor` — onset filter** — same site with `{onset:"acute"}` includes the vascular stroke/dissection
   and excludes a `chronic`-only cause; `{onset:"chronic"}` does the reverse.
6. **Derived fallback** — an un-curated site with a vascular `territory` returns a `vascular` category (stroke)
   with `derived:true`; a `skull_base` site returns `neoplastic`; a `bilateral` motor-unit site returns
   `metabolic`/`degenerative`.
7. **Red flags** — `red:true` causes are retained and flagged (e.g. dissection, GCA for AION).
8. **Regression** — all prior suites green (purely additive).

## Out of scope (deferred)

- Full migration of all 185 phonebook `ddx` entries into curated `CAUSES` (prototype curates the high-yield
  set; derived fallback covers the rest).
- Probability weighting beyond the 3-level likelihood; epidemiology by age/risk factors; investigations /
  management. The app may later add an "investigations" hint per category, but not here.

## Verification

`PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test` — new suite green, all prior green.
Not a medical device; not for clinical use.

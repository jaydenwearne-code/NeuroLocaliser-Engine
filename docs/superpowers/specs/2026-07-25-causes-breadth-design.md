# Causes breadth — sieve completion (Sub-project C)

**Status:** design approved 2026-07-25; not yet implemented.

**Depends on:** nothing new; extends the existing `src/data/causes.js`. Branch off `main`.

## Problem

`causesFor(site, {onset})` returns curated causes when a site has them, and curated wins outright
(the function returns and stops). Lacunar/vascular sites have deliberately vascular-only curated
entries — e.g. `subcortex_internal_capsule` is just *lacunar infarct* + *hypertensive haemorrhage*.
So a right hemiparesis, clicked through to the internal capsule, shows **only vascular** causes,
even though the same lesion location can be produced by demyelination, tumour/metastasis, abscess,
etc. The `derive()` fallback already knows region-aware generics but only runs when there is no
curated/phonebook entry, so curated sites never see the rest of the sieve.

## Goal

Give every site the full plausible surgical sieve without discarding the specific curated causes.
Keep the specifics as the headline; add a *derived* "sieve completion" for the plausible-but-missing
categories, surfaced behind a toggle. Derive-don't-store: the completion is a region template minus
what's already present, not hand-authored per site.

## Design

### 1. `causesFor` gains a `completion` field (`src/data/causes.js`)

The return shape is extended (additive; existing `byCategory`, `all`, `onset`, `derived`, `source`
unchanged):

```
causesFor(site, { onset }) -> { byCategory, all, onset, derived, source, completion }
```

`completion` is a `byCategory`-shaped array (`{ cat, label, tint, causes }[]`, non-empty groups
only) of region-tuned generic causes for the surgical-sieve categories that are **plausible at this
site but not already represented** in the specific list. Same tempo-filtering by `onset` as the
specifics; each generic cause is flagged `generic: true` and carries an appropriate
tempo/likelihood.

Mechanism:

```
regionOf(site)          -> "parenchyma" | "peripheral" | "skull_base" | "motor_unit" | "optic"
sieveGenerics(site)     -> SIEVE_GENERICS[regionOf(site)]   // array of generic causes (c(...))
completion              = sieveGenerics(site)
                            .filter(g => !presentCategories.has(g.cat))   // fill gaps only
                            .filter(g => !onset || g.tempo.includes(onset))
                          then grouped by CATEGORIES like byCategory
```

`presentCategories` = the set of `cat` values in the specific `list` (curated/phonebook/derived).

`regionOf` by `site.level` (with an optic part override):

- **peripheral:** `nerve`, `plexus`, `root`, `polyneuropathy`
- **skull_base:** `skull_base`
- **motor_unit:** `motor_unit`
- **optic:** `visual_pathway`, or any site whose `part` matches `/optic/`
- **parenchyma:** everything else (cortex, subcortex, aphasia_subcortical, basal_ganglia, thalamus,
  hypothalamus, midbrain, pons, medulla, dorsal_midbrain, pontomesencephalic, cord, cerebellum,
  corpus_callosum, brainstem_aras, locked_in, guillain_mollaret, pseudobulbar, combined_degeneration,
  central_vestibular, peripheral_vestibular, pupil, sympathetic, olfactory, cerebrum, craniocervical_junction, …)

`SIEVE_GENERICS` (each `c(name, cat, tempo, likelihood, red?)`, tempo from the category's typical
onset):

- **parenchyma:** inflammatory → "Demyelination (e.g. MS plaque)" (subacute, uncommon);
  neoplastic → "Tumour / metastasis" (chronic, uncommon); infective → "Abscess / focal infection"
  (acute+subacute, rare); vascular → "Ischaemic or haemorrhagic stroke" (hyperacute+acute, uncommon)
- **peripheral:** traumatic → "Compression / entrapment" (subacute+chronic, uncommon);
  inflammatory → "Vasculitic / inflammatory neuropathy" (subacute, uncommon); metabolic →
  "Diabetic / metabolic" (subacute+chronic, uncommon); neoplastic → "Nerve-sheath tumour"
  (chronic, rare)
- **skull_base:** neoplastic → "Compressive mass (schwannoma / meningioma / metastasis)"
  (chronic, uncommon); infective → "Skull-base infection (osteomyelitis / fungal)" (subacute, rare,
  **red**); inflammatory → "Granulomatous / inflammatory (sarcoid / Tolosa-Hunt)" (subacute, rare)
- **motor_unit:** inflammatory → "Autoimmune (myasthenia / myositis)" (subacute+chronic, uncommon);
  metabolic → "Toxic / drug-induced" (subacute, uncommon); degenerative → "Degenerative / hereditary"
  (chronic, uncommon)
- **optic:** inflammatory → "Optic neuritis / demyelination" (subacute, uncommon); neoplastic →
  "Compressive (pituitary / meningioma)" (chronic, uncommon); vascular → "Ischaemic (AION)"
  (acute, uncommon)

The existing `derive()` fallback stays as-is (still used as the third source when there is no
curated/phonebook entry). `sieveGenerics` is the new, always-available completion source; the two
overlap in spirit but `completion` is computed for *every* site regardless of source.

### 2. App — "Complete the surgical sieve" toggle (`whatBlock` in `app/app.js`)

The specific `byCategory` groups render exactly as today. When `res.completion` is non-empty, append
a collapsible:

```
<details class="sieve"><summary>Complete the surgical sieve (+N)</summary>
  … completion groups, lighter style, each cause tagged "generic" …
</details>
```

`N` = number of completion causes (after onset filtering). Lighter style distinguishes the generic
completion from the vetted specifics. Respects the onset filter (the completion is already filtered
in the engine). The Atlas view (`renderAtlasDetail`) may show the same toggle or omit it — omit for
now (keep the atlas concise; scope note).

### 3. Behaviour example

`causesFor(internal_capsule, {})`:
- `byCategory`: Vascular → lacunar infarct, hypertensive haemorrhage (unchanged headline).
- `completion`: Inflammatory → demyelination; Neoplastic → tumour/metastasis; Infective → abscess.

`causesFor(internal_capsule, { onset: "chronic" })`:
- specifics filtered to chronic (may be empty for a lacune); completion filtered to chronic →
  Neoplastic → tumour/metastasis (the chronic sieve entry) shows.

`regionOf` and `sieveGenerics` are exported so tests can assert region classification directly
(the completion of a given site depends on what its specifics already cover, so testing the
generator + the gap-fill invariant is more robust than asserting exact categories per site).

## Tests (`test/causes.test.js`, additive)

- Internal capsule `completion` includes the `inflammatory`, `neoplastic`, and `infective`
  categories and **excludes** `vascular` (already present in the specifics) — the flagship case.
- Every completion cause is flagged `generic: true`.
- `regionOf` classifies correctly: a `nerve` → `peripheral`, a `skull_base` site → `skull_base`,
  a cortex/subcortex site → `parenchyma`.
- **Gap-fill invariant (any site):** the set of `completion` category ids is disjoint from the set
  of specific (`byCategory`) category ids — completion never repeats a present category.
- Completion is tempo-filtered: `causesFor(site, { onset: "hyperacute" }).completion` contains no
  cause whose tempo lacks `hyperacute`.
- The existing 39 assertions remain green (return shape is additive).

## Non-goals

- No change to the specific curated causes, the phonebook categoriser, `derive()`, the localisation
  engine, or the ranking.
- Not per-picture aggregation across the differential (rejected in brainstorming) — completion is
  per selected site.
- No Atlas toggle for now (parenchyma-concise); can follow.

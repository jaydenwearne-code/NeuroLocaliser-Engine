# Expand the pathologies + workup at localised lesions (design / runway)

**Status:** design drafted 2026-08-07; not started. A runway for a cold-start session. **Branch off `main`.**

**Depends on:** nothing new — this deepens two existing data layers. Zero engine/model changes.
This work is **independent of the open `feat/code-stroke-mode` PR** (which doesn't touch `causes.js`/`nextSteps.js`).

## Problem

The engine localises richly, and the app shows **What** (pathologies at the lesion) and **Next steps** (workup)
per selected site. But those two layers are hand-curated for only a fraction of sites:

- `src/data/causes.js` — **~37** curated `CAUSES` sites; the other ~150 named sites fall back to the phonebook
  `ddx` (categorised live) or an attribute-derived generic list.
- `src/data/nextSteps.js` — **~15** curated `NEXT` sites; the rest get tiers derived from urgency + region.

The fallbacks are serviceable but generic. The goal is to **curate richer, clinically specific pathology
differentials and workup for more high-yield sites**, with discriminating features and genuine bedside
"Confirm on exam" signs — the same quality bar as the flagship sites (Wallenberg, cavernous sinus, MG, …).

## Goal

Increase curated coverage of `CAUSES` and `NEXT` for the highest-yield sites, keeping every entry clinically
sound, tempo-aware, and (for `pathognomonic`) a genuine bedside sign. No engine changes; all suites stay green.

## Non-goals

- The **declarative cross-site pathology layer** (MND/SCD/GBS as first-class objects firing on multi-site
  patterns) — separate parked item in `CONTRIBUTING.md`.
- **Multi-location DDx synthesis** (combined view across a multifocal picture) — separate parked item.
- Re-architecting `causes.js`/`nextSteps.js` — only adding curated data + the odd `PATHOGNOMONIC` entry.

## The unit of work (per-site template)

For a chosen site (`site.id`, else `level_part`), add/extend:

```js
// src/data/causes.js — the pathology differential (commonest first; span the plausible sieve categories)
CAUSES["<id|level_part>"] = [
  c("<pathology>", "<category>", ["<tempo>", ...], "<likelihood>", <red?>, "<feature clue>", "<pathognomonic bedside sign?>"),
  // category ∈ CATEGORIES (vascular/inflammatory/neoplastic/infective/metabolic/traumatic/degenerative/congenital)
  // tempo ∈ TEMPO (hyperacute/acute/subacute/chronic) ; likelihood ∈ common|uncommon|rare
  // feature = "what points to this cause"; pathognomonic = a bedside "Confirm on exam" sign (optional)
  ...
];

// src/data/nextSteps.js — the workup (curate where the specifics matter; else the derived tiers apply)
NEXT["<id|level_part>"] = ns(
  ["<first-line investigation>", ...], "<emergency|urgent|routine>", "<referral pathway>",
  { immediate: ["<bedside>"], confirmatory: ["<second-line>"], monitoring: ["<safety-net>"] } // all optional
);
```

Notes:
- **Curated beats fallback.** `causesFor`/`nextStepsFor` prefer a curated entry over phonebook/derived, so a new
  `CAUSES`/`NEXT` entry immediately replaces the generic content for that site.
- **Pathognomonic reuse.** If a pathology recurs across sites (e.g. Ramsay Hunt, Wilson's), prefer extending the
  central `PATHOGNOMONIC` keyword→sign table in `causes.js` so it flags wherever the pathology is named, rather
  than repeating the string per site.
- **Red flags + features** are cheap, high-value: mark the can't-miss causes `red:true` and add a one-line
  `feature` discriminator to each.

## Prioritisation (recommended — adjust with the owner)

Curate in tiers by clinical yield × how often the site is reached in the app:

1. **Tier 1 — emergencies & common presentations:** the vascular territories not yet curated (MCA divisions,
   ACA, PCA, watershed), the common lacunar syndromes, remaining brainstem stroke syndromes, cord syndromes
   (transverse myelitis / compression / infarct), cauda equina/conus, common acute cranial neuropathies.
2. **Tier 2 — common subacute/outpatient:** peripheral entrapments & named nerves (median/ulnar/radial/
   peroneal), radiculopathies (C5–T1, L2–S1), MS-typical sites, cerebellar syndromes, vestibular.
3. **Tier 3 — rarer eponymous/deep sites** currently on the phonebook fallback (deep grey, skull-base foramina,
   thalamic nuclei, hypothalamus).

## Content norms (clinical integrity)

- Cause lists are **teaching-level surgical-sieve DDx** (clinical consensus) — commonest first, spanning the
  plausible categories. Per-cause *citations are not required* for consensus DDx (unlike the code-stroke
  guideline-specific criteria, which are cited); **but** any specific, contestable, or guideline-driven claim
  should be verified and cited, and **anything uncertain must be flagged for the owner (a clinician) to review**
  before it ships — the same gate used for the code-stroke content.
- `pathognomonic` is reserved for **genuine bedside signs** you look for on exam; investigations belong in the
  workup layer, never in `pathognomonic`.
- Workup (`nextSteps`) stays **educational** (urgency + first-line/confirmatory/monitoring + referral), never a
  directive to give/withhold a specific treatment.

## Testing (TDD, the project way)

Each site (or small batch) is a self-contained TDD increment:
1. In `test/causes.test.js`, assert coverage + a specific emergence for the new site(s): e.g.
   `CAUSES["<site>"]` exists and non-empty; `causesFor(<site>)` surfaces the expected commonest cause in the
   expected category; data-integrity holds (valid `cat`/`tempo`/`likelihood`). Add a `pathognomonic`/`feature`
   assertion where one was added.
2. In `test/next-steps.test.js`, assert the new `NEXT` entry's urgency/first-line/tiers.
3. Write the assertion first (red), add the curated data (green), keep **all** suites green:
   `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`.
4. Commit per site/batch (frequent commits).

## Files

- `src/data/causes.js` (CAUSES entries; `PATHOGNOMONIC` table), `src/data/nextSteps.js` (NEXT entries).
- `test/causes.test.js`, `test/next-steps.test.js`.
- No engine/model changes; no app changes (the app already renders whatever these return).

## How to run / verify

- Tests: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`.
- App (to eyeball a site's What/Next cards): `node app/serve.mjs` → http://localhost:8137/app/ → Localise a case,
  click the site, read the **What** and **Next steps** cards.

## Execution shape

Because this is open-ended content curation (not a fixed feature), it proceeds **region-by-region as TDD
increments** rather than one monolithic plan — pick a Tier-1 region, curate its sites + tests + green + commit,
repeat. A per-region mini-plan can be written at the start of each region if helpful. First session should
confirm the **prioritisation order** and the **citation policy** above with the owner before bulk-authoring.

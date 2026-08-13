# Differential depth: curated causes replace the generic sieve

**Date:** 2026-08-11
**Status:** design, approved — awaiting implementation plan
**Supersedes in part:** `2026-08-07-pathologies-workup-expansion-design.md` (the sieve-completion mechanism it introduced is removed here)

## The problem

The "What" card presents a *category-complete* differential rather than a *clinically real* one. Two
faults, both observed in the running app:

**Generic filler.** `causesFor()` pads every site with region-typical placeholders for the surgical-sieve
categories the curated list doesn't cover. On a right corona radiata lacune with acute onset, the
differential reads:

```
VASCULAR    Small-vessel lacunar infarct     common    + discriminating feature
            Hypertensive deep haemorrhage    uncommon  RED
INFECTIVE   Abscess / focal infection        rare      ← generic filler, no feature
MIMIC       Hypoglycaemia                    common    RED
```

"Abscess / focal infection" is not a differential for an acute pure-motor lacune. It is a category
placeholder, it carries no discriminating feature, and it dilutes the two rows that matter. This is not
an edge case: **349 of 375 candidate sites fire the completion**.

**Thin curation.** The curated lists average 4.5 causes. A differential that stops at four entries cannot
represent what a clinician actually holds in mind at the bedside.

### Measured baseline

| Metric | Value |
|---|---|
| Curated site keys | 201 |
| Cause entries | 900 |
| Entries per key | min 2, **median 4**, max 8 |
| Keys below the ≥6 bar | **178 / 201** |
| Candidate sites firing generic completion | **349 / 375** |
| Keys with no red-flagged must-not-miss cause | 35 |
| Entries with no discriminating `feature` | 42 |
| **New entries required to reach ≥6 everywhere** | **313** |

## The principle

**The surgical sieve is an authoring checklist, not an output format.** It exists to stop the author
forgetting a category. It must never manufacture content to fill itself. Where a category has no
plausible cause at a site, the honest output is silence.

Breadth is therefore replaced by depth: every category shown is a category with a real, named,
site-specific cause behind it.

## Design

### 1 · `causes.js` — remove the gap-fill

Delete `SIEVE_GENERICS`, `sieveGenerics()`, and the `completion` key from the `causesFor()` return.
The new shape is:

```js
causesFor(site, { onset }) -> { byCategory, all, onset, derived, source }
```

A sieve category with no plausible cause at the site does not appear in `byCategory`.

`regionOf(site)` is **retained** — it becomes the classifier the family builders key off (§2), so it
keeps a live consumer and its existing assertions stay meaningful.

The curated → phonebook → `derive()` precedence chain is unchanged, and `derive()` remains the backstop
for uncurated and synthetic sites (the `zz_never_curated` test path). Nothing about localisation,
scoring, or the workup layer is touched.

### 2 · Family builders

91 of the 201 keys fall into five near-identical families. Each gets a parameterised builder in the
mould of the existing `rootNS` builder in `nextSteps.js`:

| Family | Keys | Builder |
|---|---|---|
| Nerve roots | 17 | `rootCauses(root, { myotome, dermatome, reflex })` |
| Named peripheral nerves | 25 | `nerveCauses(nerve, { site, entrapmentPoint, movement })` |
| Skull-base compartments | 35 | `foramenCauses(foramen, { nerves, contents })` |
| Plexus trunks & cords | 8 | `plexusCauses(segment, { nerves, distribution })` |
| Cord cross-sections | 6 | `cordCauses(part, { supply })` |

The remaining **110 keys stay hand-authored** — the brainstem classics, lacunar syndromes, cortical
territories, thalamic nuclei and motor-unit sites, where the differential is genuinely distinctive.

**A builder is a shortcut for consistency, never for content.** Every builder must interpolate the
actual structure into *both* the cause name and its discriminating feature — `rootCauses("l5", …)`
yields "Disc prolapse (L4/5)" with the feature "foot drop with weak great-toe extension, sparing
ankle eversion", not "Disc prolapse / compressive mass". Invariant 4 (§3) is what enforces this: a
builder that fails to specialise produces identical lists across its family and fails the suite.

### 3 · Invariants

Asserted across every candidate site, written red before the content.

**Scope of the invariants:** they apply to sites resolving to a curated `CAUSES` entry — which, since
the 2026-08-10 sweep, is every real candidate site. They explicitly do **not** apply to the
phonebook and `derive()` fallback paths, which remain reachable only for synthetic probes
(`zz_never_curated`) and any future site added before it is curated. Tests must assert the invariants
over `candidateSites()` and assert the fallback paths separately.

1. **Depth** — every site returns ≥ 6 curated causes.
2. **Discrimination** — every cause carries a non-empty `feature`.
3. **Must-not-miss** — every site names ≥ 1 `red` cause.
4. **Anti-generic guard** — no two site keys produce an identical cause-name list.
5. *(retained)* No curated cause list sits beside a generic derived workup; every curated workup fills
   all four tiers.

Invariant 3 is deliberately expressed against the existing `red` boolean rather than a new
must-not-miss tier — see Out of scope.

### 4 · App presentation

`app/app.js` `whatBlock()`:

- drop the `byComp` merge over `res.completion`;
- drop the footnote "The full surgical sieve is shown; 'generic' items are region-typical categories,
  not vetted per site";
- drop the `.generic` styling path in `renderCause()` once nothing sets `generic: true`.

**Empty-tempo state.** Removing the filler creates one visible hole: a site with no cause matching the
selected onset. Today that reads "No causes for this onset — try a different tempo", which sends the
user away. It becomes a teaching negative instead — *"A lesion here does not typically present
hyperacutely."* This is the intended consequence of declining a no-empty-tempo-bucket invariant: a
site that genuinely never presents at a tempo should say so rather than have a cause invented for it.

The Atlas-mode cause list (`app/app.js` ~line 399) reads `res.byCategory` only and needs no change.

### 5 · Sequence and review

The same region sweep as the layer it deepens — **A** cortex, **B** cord/lacunar, **C**
brainstem/cerebellum, **D** skull base/CN course, **E** named nerves/motor unit, **F** roots/plexus,
**G** remaining cortex, **H** closing sweep.

**Each region ends at the owner's clinical sign-off before the next begins.** This work adds ~313
entries on top of 900 that have not yet had per-region review; reviewing at authoring time is far
cheaper than reviewing ~1200 entries in one sitting, and it catches a systematic authoring error after
one region rather than eight.

Region A additionally proves the mechanism: if the builder shape or an invariant is wrong, that is
discovered on one region, not across the whole sweep.

Base branch: `main`.

## Out of scope

Explicitly excluded, to keep this to a single implementation plan:

- **Case-conditioned likelihood** — shifting `common/uncommon/rare` by age, risk factors,
  immunosuppression or cancer history. Considered and declined; likelihood stays a static per-cause label.
- **A must-not-miss tier distinct from `red`** — invariant 3 uses the existing boolean.
- **Multi-site cross-lesion DDx** — remains parked as a follow-up.
- **Any change to localisation, scoring, tracts, or the workup layer.**

## Risks

| Risk | Mitigation |
|---|---|
| Family builders reintroduce genericness | Invariant 4 fails the suite on any two identical lists |
| ~313 new clinical entries authored unreviewed | Per-region sign-off gate (§5) |
| Sites lose visible categories and look thinner | Intended — depth over breadth; the ≥6 floor means total content rises, not falls |
| Existing tests assert on `completion` | `test/causes.test.js` lines ~162–199 and ~294 are removed with the mechanism |

## Success criteria

- `completion` and `sieveGenerics` no longer exist in `causes.js` or `app/app.js`.
- All five invariants green across every candidate site.
- Cause entries ≥ 1213 (900 + 313), every one with a discriminating feature.
- All 53 suites green.
- Every region carries the owner's clinical sign-off.

## Outcome (2026-08-11)

The A–H sweep is **complete on all 201 keys**. Delivered against the criteria above:

| | Target | Actual |
|---|---|---|
| Cause entries | ≥ 1213 | **1278** |
| Entries per key | ≥ 6 | min 6, median 6, max 8 |
| Entries with a discriminating feature | all | **1278 / 1278** |
| Keys with ≥ 1 must-not-miss | all | **201 / 201** (568 red-flagged entries) |
| Identical cause lists | 0 | 0 |
| Suites | all green | 54 suites, `npm test` exit 0 |

**Three family builders** were built rather than the five the design anticipated: `sbSpine()` for the
skull-base corridors, `nvSpine()` for the named nerves, `rtSpine()` for the roots. The plexus elements and
cord cross-sections turned out **not** to be families — their causes genuinely differ — so they were
hand-authored. Two phrasing rules learned in the process are recorded in the builder comments: join an
interpolated deficit with an em-dash clause rather than a relative pronoun, and keep the deficit short
enough to sit mid-sentence.

**Three invariants were added beyond the five specified**, each after a real defect:
`pathognomonic` may not name an investigation (caught a pulvinar MRI sign and a GCA biopsy reference in
that slot); no feature may repeat a word at a builder join (caught "Progressive progressive unilateral
hearing loss" live in the app); and the entry-count floor.

The `DEEPENED` region registry that let a half-finished sweep run green has been **retired** — the
invariants now assert directly over every key in `CAUSES`, so anything added from here must clear the bar
on arrival.

**Clinical sign-off: COMPLETE (2026-08-11).** The gate in §5 was not taken region by region as designed —
the owner chose to run A→H continuously and sign off once at the end, covering all 1286 cause entries, the
fundoscopy/acuity findings and the new retina site. That also closes the gate left open by the 2026-08-10
pathologies/workup layer beneath it. Worth noting for the next increment of this kind: batching the review
to the end worked here, but it meant a systematic authoring error would not have surfaced until every region
was written — the per-region gate exists to bound that risk, not to slow the work down.

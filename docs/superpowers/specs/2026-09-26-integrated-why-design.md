# Integrated Why — design (2026-09-26)

**Status: IMPLEMENTED (2026-09-26) on `feat/integrated-why`.** Owner-approved, including the §4.2 and §4.3 tables; refinements in §6.
Branch: `feat/integrated-why` (off `feat/accuracy-round-1`, whose engine changes it uses).

Sub-project 2 of 3 from the 2026-09-25 request: *"the why should integrate all of the findings to explain
why that one specific location. Many of the explanations just explain the laterality of motor findings
based on the corticospinal tract. It should integrate all of the tracts based on the symptoms inputted, and
identify where they intersect."* Sub-project 1 (accuracy) is PR #11. Sub-project 3 (UI) is parked.

## 1. What is wrong today

The Why card leads with a **Course** narrative per implicated long tract — the textbook journey of the
tract, identical for every site on it — then one generic sentence ("the findings map onto the X tract…the
accompanying signs place it at Y"). It never says what carries each finding AT the chosen site, never
explains the side of any finding except through the tract prose, ignores every finding that is not on a
modelled tract (cranial nerves, cortex, PNS), and never shows the intersection that actually decides the
answer. The "why this site" reasoning the engine performs is invisible.

## 2. The idea

Every finding, on its own, could arise in a set of places. The lesion is where those sets **meet**. Both
halves are already in the model: `explain(site)` names the structure that produces each finding at a site,
and the forward model says which sites produce a given signed finding. Nothing is authored per syndrome.

Measured on the prototype (scratch, 2026-09-26):

| Case | Where each finding could arise | Meets at |
|---|---|---|
| Wallenberg (face pain loss L, body pain loss R, L miosis, dysphagia, L ataxia) | pons–medulla · capsule→cord · pons, medulla, chain · medulla, root, NMJ · midbrain→cord | **medulla** |
| Weber (L ptosis + adduction, R arm + leg) | … | **midbrain** |
| L5 radiculopathy | root, plexus, nerve · root, plexus, nerve · root, plexus | **root, plexus** |
| Isolated Babinski | cortex → cord | **cortex → cord** (does not localise) |

## 3. Owner decisions (2026-09-26)

1. **Form: a reasoning chain**, not a grid — one line per finding, then one sentence naming where they
   meet. It carries the side reasoning a grid cannot, and it reads on a phone.
2. **Layout: the chain leads and the overlaps go.** The chain replaces the generic "Why this site" line and
   the ✓/✗ explained list; the compare panel ("What separates these locations") stays directly after it;
   "Why not elsewhere" is dropped (the compare panel answers it for the candidates actually in play); the
   per-tract Course narratives move behind a collapsed "Pathway anatomy" disclosure.

## 4. Design

### 4.1 `whyChain(observedSet, site, opts)` — `src/engine/why.js` (logic only)

Returns `{ steps, meet, verdict }`.

**`steps`** — one per observed token that SOME site produces (the axis/flag findings — papilloedema, the
refractive and functional signs — are excluded; they keep their own banners). Each step:

| field | meaning |
|---|---|
| `token`, `finding`, `bodySide` | the entered finding |
| `explained` | the site predicts this token |
| `carrier` | the producing structure at this site, from `explain()`: the part of its `note` before " — " (the whole note where there is no dash — true of all 575 structures). `null` when not explained |
| `relation` | `same` \| `opposite` \| `both` \| `midline` \| `none` — body side relative to lesion side |
| `reason` | a short derived phrase for that relation (§4.3) |
| `stations` | every station (§4.2) where ANY candidate site produces this token, in station order |
| `where` | `stations` rendered, with runs of three or more consecutive stations compressed to "A → B" |

Steps are ordered **most-localising first** (fewest stations), ties in entry order.

**`meet`** — the stations shared by EVERY step, and the lesion side at them (intersection of
(station, lesion side) pairs). **`verdict`**:
- `one` — a single station: *"Only the left medulla carries all five."*
- `several` — more than one: *"These fit the nerve root or the plexus — see what separates them below."*
  A single-finding case lands here with the honest line *"An extensor plantar alone does not localise: it
  can arise anywhere from the cortex to the cord."* (closes the round-1 Babinski open item)
- `none` — empty: *"No single place carries all of these — see Together."* (the multifocal case)

### 4.2 Stations — `src/model/stations.js` ⚠ owner review

A projection of model levels onto a readable neuraxis order. Keyed by level, with a `${level}|${part}`
override where a part sits in a different station from its level (never keyed by part alone).

| Station (in order) | Levels / parts |
|---|---|
| cerebral cortex | `cortex`, `cerebrum` |
| corpus callosum | `corpus_callosum` |
| deep white matter and internal capsule | `subcortex` (except `subcortex|thalamus`), `aphasia_subcortical|striatocapsular`, `pseudobulbar` |
| basal ganglia | `basal_ganglia` |
| thalamus | `thalamus`, `thalamus_arousal`, `subcortex|thalamus`, `aphasia_subcortical|thalamic` |
| hypothalamus | `hypothalamus` |
| midbrain | `midbrain`, `dorsal_midbrain` |
| pons | `pons`, `locked_in`, `pontomesencephalic` |
| medulla | `medulla`, `craniocervical_junction` |
| brainstem (several levels) | `brainstem_aras`, `guillain_mollaret`, `central_vestibular` |
| cerebellum | `cerebellum` |
| spinal cord | `cord`, `combined_degeneration` |
| conus | `conus` |
| cauda equina | `cauda` |
| nerve root | `root`, `polyradiculoneuropathy` |
| plexus | `plexus` |
| peripheral nerve | `nerve`, `polyneuropathy` |
| motor unit (anterior horn, NMJ, muscle) | `motor_unit` |
| cranial nerve (skull base) | `skull_base` (except the optic parts) |
| inner ear | `peripheral_vestibular` |
| visual pathway | `visual_pathway`, `skull_base|optic_aion`, `skull_base|optic_neuritis`, `skull_base|optic_canal` |
| pupil pathway | `pupil` |
| sympathetic chain | `sympathetic` |
| olfactory | `olfactory` |

Invariant: every level any candidate site uses maps to a station.

### 4.3 Side reasons — `src/data/sideReasons.js` (content only) ⚠ owner review

The relation is DERIVED (the forward model already decided the side); the reason only explains it. Chosen
in this order:

1. **Bilateral site** → *"both sides — the lesion crosses the midline"*; **midline site** → *"midline"*.
2. **No side** (NON_LATERALISED) → *"no side — a dominant-hemisphere function"* / *"…non-dominant…"* when
   the structure is hemisphere-gated, else *"no side"*.
3. **A long-tract finding** — the finding is on a `TRACTS` entry whose course includes the site's level:
   - opposite → *"opposite side — the {tract} crosses at the {decussation}, and this level is on the far
     side of that crossing"*
   - same, tract with a decussation → *"same side — this level is on the near side of the {decussation}"*
   - same, tract without one → *"same side — the {tract} does not cross"*
4. **Otherwise, by station group:**
   - hemisphere stations (cortex, callosum, deep white matter, basal ganglia, thalamus), opposite →
     *"opposite side — each hemisphere serves the other side of the body"*
   - cerebellum, same → *"same side — the cerebellum coordinates its own side"*
   - brainstem stations, same → *"same side — cranial nerve nuclei and their fibres serve their own side"*
   - brainstem stations, opposite → *"opposite side — this pathway has already crossed at this level"*
   - PNS, cranial nerve, inner ear, pupil, sympathetic, same → *"same side — a nerve serves its own side"*
   - any case not listed → the bare relation (*"same side"* / *"opposite side"*), never invented text.

### 4.4 The Why card (`app/app.js` `whyCard`)

Top to bottom:
1. UMN/LMN annotation — unchanged.
2. **Why {site}** — the chain: per step, the finding (with its side chip), *carried here by {carrier} —
   {reason}*, and *could arise at: {where}*. Unexplained steps read *"not carried at this site"*. Then the
   verdict sentence.
3. **What separates these locations** — the compare panel, unchanged.
4. **Also expected here, not reported: …** — collapsed; the site's predictions not entered ("examine to
   confirm"), which the deleted ✓/✗ block used to hold.
5. **Pathway anatomy** — collapsed; the existing `tractNarrative()` Course paragraphs, unchanged.

Removed: the generic "Why this site" line, the explained/unexplained list, "Why not elsewhere".
`whyNotOthers()` and its assertions in `test/tracts.test.js` are deleted (git history keeps them).

### 4.5 Not in scope

No change to localisation, ranking or any clinical table outside §4.2–4.3. No broader UI redesign
(sub-project 3). The chain wording inherits the structure notes' own phrasing; a wording pass on notes is
separate work.

## 5. Tests — `test/why.test.js` (TDD)

- Wallenberg meets at `medulla`, verdict `one`, lesion side left; the face step is `same` and the body step
  `opposite`, each with a tract reason naming its decussation.
- Weber meets at `midbrain`; the weakness steps are `opposite` with the pyramidal decussation.
- L5 radiculopathy → `several`: nerve root, plexus.
- Isolated Babinski → `several`, `where` reads cerebral cortex → spinal cord.
- The two-lesion worked example → `none`.
- Invariants: every candidate level maps to a station; every site's own complete picture meets at that
  site's station; every explained step has a non-empty carrier; every unproduced token is excluded; and
  **Why agrees with Where** — for every case in `test/clinical-vignettes.test.js` where a single site explains
  every finding, the meet contains the first-ranked site's station (where none does, the meet is empty and the
  verdict is `none`, by design).
- `whyCard` is DOM-bound: parse-checked by `test/app-smoke.test.js`, verified in the browser.

## 6. Refinements from prototyping (2026-09-26, before the plan)

Prototyped end to end against the repo before writing the plan; all spec cases behave as §2 describes and
every one of the 364 non-empty sites' own pictures meets at its own station.

1. **Side-reason wording made direction-free.** "far/near side of the crossing" was ambiguous (a descending
   tract in the cord has crossed ABOVE; an ascending tract in the medulla has not crossed yet — both are
   "same side"). The phrases now read *"…crosses at the {crossing}, and that crossing lies between this
   level and the side it serves"* (opposite) / *"…but that crossing does not lie between this level and the
   side it serves"* (same) — correct for descending, ascending and ocular pathways alike.
2. **Two tract-specific same-side phrases** (content, `TRACT_SAME`): the cerebellar outflow crosses TWICE,
   so its net same side must not read "does not cross"; the oculosympathetic pathway genuinely does not.
3. **Tract chosen by finding membership, not by course level.** The pontine Horner rows (round-1 follow-up)
   sit at a level the oculosympathetic course table does not list; the relation is already derived, so the
   tract only supplies the explanation.
4. **`meet` = the differential's explain-all set** mapped to (station, side), rather than a raw
   intersection of possible places. It applies the known-negative rule, so the Why and the Where cannot
   disagree (a raw intersection let locked-in "meet" a right-arm + left-leg picture).
5. **Station label shortened**: "deep white matter" (the internal capsule is deep white matter), so the
   verdict sentence reads "the left deep white matter" rather than a clause.
6. **The Why-agrees-with-Where invariant is asserted over every site's complete picture** (364 cases)
   rather than only the 84 vignettes, which cannot be imported (each suite exits on completion).
7. **Shared findings take their pathway from a sibling** (found by driving the app). Ptosis is on no tract
   (it is CN III or sympathetic), so in Wallenberg it read "cranial nerves serve their own side". A shared
   finding now takes the tract of a structure at the same site with the same carrier: a sympathetic ptosis
   rides with the sympathetic miosis; a CN III ptosis stays a cranial nerve.


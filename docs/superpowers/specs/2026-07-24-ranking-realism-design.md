# Ranking realism (Sub-project A)

**Status:** design approved 2026-07-24; not yet implemented.

**Depends on:** the unify-localiser-engines work (this modifies the engine-owned
`differential()` from `docs/superpowers/plans/2026-07-24-unify-localiser-engines.md`).
Branch off that work (or off `main` once it is merged).

## Problem

Two ranking defects in the displayed differential (reported by the clinician user):

1. **Bilateral lesions match unilateral input.** Entering right-arm + right-leg weakness
   returns `locked_in` (bilateral ventral pons) in the "explains-all" set, because the
   count/superset differential only asks *does this site predict the findings I entered?* —
   never *does it also predict findings I confirmed absent?* `locked_in` predicts
   `weak_arm@left/right` + `weak_leg@left/right`; for unilateral input it is a superset, so it
   ranks top. Clinically the absent contralateral weakness excludes it outright.
2. **Ties are not ordered by prevalence.** A pure-motor hemiparesis ties across internal
   capsule / corona radiata / midbrain / pons / medulla / hemicord. The lacune is by far the
   most common answer, but the differential orders these arbitrarily (tightness then site id).

## Goal

Make the displayed differential clinically credible: exclude sites contradicted by a
*known-negative* finding, and order otherwise-tied sites by how common a lesion at that site
actually is. Scope is the engine-owned `differential()` (the displayed list) only; the scored
`solve()` path is untouched.

## Design

### Component 1 — Contralateral known-negative exclusion

Some absent findings are *known negatives*, not merely *not-predicted*: if you found the right
arm weak, you also examined the left arm, so an un-entered `weak_arm@left` is confirmed normal.
A site that predicts a known-negative would produce a sign the patient demonstrably lacks — it
is not a candidate.

- New engine helper `knownNegatives(observedSet): Set<string>` — for every **lateralised**
  observed token `finding@side` (`side` ∈ {`left`,`right`}) whose opposite-side homolog
  `finding@other` is **not** in `observedSet`, emit `finding@other`. Findings entered on both
  sides yield no negative (both present). Non-lateralised sides (`midline`, `bilateral`,
  `none`) have no homolog and are skipped.
- `differential()` **excludes** any candidate site whose `expectedFindings` intersects the
  known-negative set.
- Discriminating, not a blanket bilateral ban: `locked_in`, anterior/transverse cord (predict
  contralateral weakness) drop out; **Brown-Séquard** predicts unilateral weakness + *crossed*
  spinothalamic loss and never predicts contralateral weakness, so it survives.

### Component 2 — Prevalence tier (`src/model/prevalence.js`)

Prevalence is a property of the anatomy (how often a lesion lands there, judged by the
pathologies that affect it), so it lives in the **model** layer the engine already depends on —
no coupling to the `syndromes.js` phonebook. New file exports `prevalenceOf(site): 2 | 1 | 0`
(common / uncommon / rare) via a default-by-`(level, part)` table plus explicit overrides. The
file header records the rationale so future edits stay principled: *the tier reflects the
prevalence of the pathologies that affect that site.*

**Tier assignments:**

- **common (2):** `cortex` (all parts — cortical strokes are common), `subcortex` parts
  `internal_capsule`, `corona_radiata`, `anterior_choroidal`, `sensorimotor` (lacunes),
  `basal_ganglia`, `root` (radiculopathy), `nerve` (entrapment mononeuropathy),
  `polyneuropathy`.
- **rare (0):** any site with `side === "bilateral"`; levels `locked_in`,
  `combined_degeneration`, `guillain_mollaret`, `pseudobulbar`, `brainstem_aras`,
  `thalamus_arousal`, `corpus_callosum`, `hypothalamus`, `pontomesencephalic`,
  `dorsal_midbrain`, `craniocervical_junction`, `central_vestibular`; `cerebellum` part
  `pancerebellar`; `cord` part `transverse`.
- **uncommon (1):** the default for everything unlisted — `thalamus` (level) and
  `subcortex[thalamus]` (thalamic stroke less common), `midbrain`, `pons`, `medulla`
  (brainstem strokes less common), `cerebellum`, `cord`, `plexus`, `cauda`, `conus`,
  `motor_unit`, `skull_base`, `visual_pathway`, `pupil`, `sympathetic`, `olfactory`, etc.

Precedence when a site matches more than one rule: **rare wins** (a `bilateral` cortical
composite is rare, not common), then explicit `(level, part)` entries, then the level default,
then the global default of `uncommon`.

### Component 3 — New ranking key

`differential()` first filters out known-negative-contradicted sites, then sorts by:

```
coverage (n) desc  →  prevalence desc  →  tightness (over) asc  →  site.id asc
```

Coverage still dominates (localisation is primary); prevalence breaks the clinician's tie case
(pure-motor → lacune above thalamus/brainstem/cord); tightness and id remain the final
discriminators. `explainAll` is a filtered subset of `differential`, so it inherits this order.

**Scope:** `differential()` only. The scored `solve()` path (`single`, `best`, `nearFit`,
`multi`) is unchanged — for unilateral pure input the explains-all set stays non-empty so
near-fit / multifocal never surface, and every existing scored suite stays green.

### Component 4 — `ruledOut` teaching footnote

`solve()` additionally returns `ruledOut: [{ site, contradictedBy }]` — the sites Component 1
excluded, each paired with the known-negative token that contradicted it (first match). The app
renders a collapsible teaching note, e.g. *"Ruled out: Locked-in syndrome — would also cause
right-sided weakness."* Populated only when the exclusion actually removed sites.

## Data flow (unchanged shape, extended)

`solve()` return gains `ruledOut`. `differential`/`explainAll`/`display`/`defaultSite` already
exist (from the unify work); their contents now reflect the exclusion + reorder. The app reads
`r.ruledOut` for the footnote; the list rendering is otherwise unchanged.

## Tests

New suite `test/ranking-realism.test.js`:

- `knownNegatives({weak_arm@left})` contains `weak_arm@right`; entering both sides yields
  neither; midline/none findings contribute nothing.
- `differential({weak_arm@left, weak_leg@left})` does **not** contain `locked_in` (excluded),
  and **does** still contain a Brown-Séquard hemicord site (survives).
- For a pure-motor hemiparesis, a lacunar site (`internal_capsule` / `corona_radiata`) ranks
  above a tying thalamic/brainstem/cord site.
- `prevalenceOf` spot-checks: `internal_capsule` → 2, a `thalamus` site → 1, a `locked_in` /
  `bilateral` site → 0.
- `solve(...).ruledOut` lists `locked_in` with a `contradictedBy` of `weak_arm@right` (or the
  relevant homolog) for the unilateral case; is empty when nothing was excluded.

Wired into the `test` script in `package.json` and the README `npm test` chain.

## Non-goals

- No change to scoring weights, `nearFit`, `minimalSet`, or the annotation logic.
- Prevalence is a coarse, fixed per-site tier — not tempo- or pattern-conditioned. (It is
  already implicitly conditioned on "this site explains the entered findings", since only
  matching sites appear.)
- No UI restructure, no causes/why changes — those are Sub-projects B, C, D.

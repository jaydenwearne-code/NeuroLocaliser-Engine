# Unify the two localiser engines

**Status:** design approved 2026-07-24; not yet implemented.

## Problem

The app runs two localisers side by side and stitches their outputs together, so
"confidence" is expressed two different ways on one screen.

- **Engine A — `differential()` in `app/app.js`.** Count/superset. For each candidate
  site it computes `explained = observed ∩ expected`, keeps every site with any overlap,
  and ranks by **# explained** (desc) then least over-prediction then site name. Its own
  comment says it *deliberately avoids* the best-fit score, "which penalises over-prediction
  and so under-returns on sparse input" — it is built to start broad and narrow. In
  `renderResults` the app then filters this to the strict-superset ("explains-all") set when
  one exists, else falls back to the full ranked list, and picks the default-selected lesion
  from the top of that list.
- **Engine B — `solve()` / `scoreSite` in `src/engine/inverse.js` + `src/engine/score.js`.**
  Weighted score: LOCALISING matches ×3, unexplained penalty (×3 if localising),
  over-prediction ×0.5. Owns `minimalSet` (multifocal), `nearFit` (drop-1 relaxation), and
  the `describeLevel` / `describeLength` annotations.

The app renders the **list** from A but the **near-fit / multifocal / annotations** from B,
and the *selected* lesion comes from A's ordering — which can disagree with B's `best`. Two
notions of confidence coexist.

Two latent inconsistencies make it worse:

1. **Two candidate-site enumerations.** `app.js` builds candidates by reflection over every
   `compose*` export of `sites.js`; `inverse.js` hard-lists the composers in
   `candidateSites()`. If those drift, the two engines rank over *different* site sets.
2. **A phonebook dependency in the ranking.** `differential()` breaks ties with
   `siteName().localeCompare()`, i.e. the display name from `syndromes.js`. The engine is
   deliberately independent of that phonebook (the golden rule: remove `syndromes.js` and the
   engine still localises).

## Goal

Architectural consolidation, behaviour preserved (chosen over collapsing to a single
confidence metric). Both semantics survive — the broad narrowing differential *and* the
scored best-fit — but they live in **one engine module**, are computed over **one candidate
set**, and are returned **together**. The app becomes a pure consumer that draws the result
and handles clicks.

This deliberately keeps the two-purpose design: the differential starts wide and narrows (the
UX users liked); the scored path stays the right tool for "which single lesion best explains a
full picture" plus near-fit and multifocal.

## Design

### 1. `solve()` is the single source of truth

`app.js` calls `solve()` **once** and draws what it gets back. `differential()` moves into
`inverse.js`; its output becomes fields on the `solve()` result. The `solve()` return is
**extended** (existing fields unchanged, so every existing suite stays green):

```
{
  // NEW — broad narrowing differential (Engine A semantics: count/superset)
  differential: [ { site, exp, explained, over, n }, … ],  // every site with any overlap, ranked
  explainAll:   [ … subset where n === total … ],          // strict-superset winners (may be empty)
  display:      [ … explainAll if non-empty else differential … ], // the list the app should show
  defaultSite:  siteId | null,                             // engine's default selection (top of display)

  // UNCHANGED — scored best-fit + relaxations (Engine B semantics)
  single, best, singleExplainsAll, multi, nearFit, level, length, dominantSide
}
```

`differential` ranking (unchanged from A, minus the phonebook tie-break): sort by `n` desc,
then `over` asc, then **`site.id`** asc (see clean-up 2). `total` = size of the observed
token set; `n === total` means expected ⊇ observed, i.e. the site explains every entered
finding. `defaultSite` = `display[0]?.site.id ?? null`.

The engine provides the **default** selection only. Which lesion is actually shown is view
state: `app.js` keeps `S.selected` as the user's click-override, persisting it across
re-solves while it is still present in `display`, and falling back to `defaultSite` otherwise.

### 2. Two clean-ups that fall out of the move

- **One candidate-site enumeration.** `inverse.js` owns a single reflection-based
  `candidateSites()` (iterates `compose*` exports of `sites.js`, like the app does today, so
  new composers are picked up automatically) and **exports** it. `app.js` imports it for its
  `SIDES` (which body-sides a finding can appear on) and `ATLAS` (dedupe by `level_part`)
  needs instead of rebuilding its own `CANDIDATES`. One list, no drift.
- **Phonebook-free tie-break.** `differential()`'s final tie-break becomes `site.id`
  (deterministic, no `syndromes.js` import in the engine). Cosmetic-only reordering among
  otherwise equal-rank sites; preserves the golden rule that the engine does not depend on the
  phonebook.

### 3. Tests

- New suite `test/differential.test.js` pins behaviour that is only implicit today (the
  function is currently untested, living in `app.js`):
  - one finding → many candidate sites; each added finding intersects → the list narrows
    (e.g. the documented `weak_arm` → 8, `+weak_leg` → 5, `+aphasia` → 1 striatocapsular);
  - `explainAll` is populated only when a site is a strict superset of the observed set, and
    is empty otherwise;
  - `display` equals `explainAll` when non-empty, else `differential`;
  - `defaultSite` is the id of `display[0]`;
  - tie-break is stable and by `site.id`.
- Added to the `test` script in `package.json` and to the README / `npm test` chain.
- All existing suites stay green because the `solve()` changes are purely additive;
  `test/app-smoke.test.js` is unaffected.

### 4. App diff

`app.js` shrinks:

- delete the local `differential()` function and the module-level `CANDIDATES` rebuild
  (import `candidateSites()` from the engine instead);
- in `renderResults`, replace the `differential()` call + `explainAll`/`sel` selection logic
  with reads off the single `solve()` result (`r.display`, `r.explainAll`, `r.defaultSite`);
- keep `S.selected` as the click-override with the persistence rule above;
- `functionalFlag` / `umnLmnPattern` (already imported from `patterns.js`) and the
  near-fit / multifocal / level / length rendering are unchanged — they now read from the same
  `r` that also produced the list.

## Non-goals

- No change to scoring weights, `minimalSet`, `nearFit`, or the annotation logic.
- No collapse to a single confidence metric — the two-purpose semantics are retained by
  design.
- No model/anatomy changes; this is engine-module + app-consumer refactoring only.

## Parked follow-up this does *not* close

Multi-location DDx synthesis (causes / next-steps shown for the one selected lesion only)
remains parked — out of scope here.

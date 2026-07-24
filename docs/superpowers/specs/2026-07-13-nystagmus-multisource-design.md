# Nystagmus — multi-source directional taxonomy — design spec

**Date:** 2026-07-13
**Region increment:** turn the single generic `nystagmus` finding into a **directional taxonomy** whose
*type* localises across the three sources of nystagmus — **inner ear** (peripheral vestibular),
**cerebellum** (gaze-evoked), and **brainstem** (upbeat, downbeat at the craniocervical junction, and the
existing INO). Adds the missing **peripheral vestibular (labyrinth)** site (the "inner ear" source) and
two central directional-nystagmus generators.
**Status:** approved design, ready for implementation planning

## Context

The cerebellum increment added a single generic `nystagmus` finding at the flocculonodular lobe, with a
flag (recorded in that spec and in memory) that **nystagmus is multi-source** — brainstem (MLF/INO, gaze
centres, vestibular nuclei), cerebellum (flocculonodular), and peripheral vestibular / inner ear — and
that the right long-term model is a shared finding with a **peripheral-vs-central** distinction.

The current state entangles vestibular findings:
- `cn8_vertigo` ("Vertigo / vestibular nystagmus (CN VIII)") is produced by the **brainstem vestibular
  nuclei** (`cn8_pons`, `icp_vestib`) — it conflates vertigo + nystagmus and sits centrally despite the
  "CN VIII" label.
- `nystagmus` (generic) is cerebellum-flocculonodular-only, `@none`, LOCALISING.
- `ino` (MLF) is a specific central nystagmus already modelled.
- `hearing_loss` is the CN VIII cochlear finding at the CPA.
- **There is no peripheral vestibular / labyrinth (inner ear) site at all.**

The clinically important scenario is the **isolated acute vestibular syndrome** (nystagmus + vertigo,
nothing else): vestibular neuritis vs a posterior-circulation stroke (the HINTS scenario). There,
"emerges by company" cannot discriminate — the localiser must be a **characteristic of the nystagmus
itself**. Hence a directional taxonomy (user's chosen approach).

## Design decisions (settled during brainstorming)

1. **Full directional taxonomy** — model nystagmus subtypes as distinct localising findings, each with an
   anatomical home, rather than one generic finding + company.
2. **Keep upbeat** — the full set including upbeat (pontomesencephalic) is in scope.
3. **Refine the just-built cerebellum region** — the flocculonodular lobe changes from generic
   `nystagmus` → `nystagmus_gaze_evoked` for a consistent taxonomy (no un-typed generic left behind).
4. **`cn8_vertigo` becomes multi-source** — it stays the *vertigo* finding, now emitted by both the new
   peripheral labyrinth and the existing central vestibular nuclei; peripheral-vs-central emerges by
   company + nystagmus type.

## The finding taxonomy (`findings.js`)

Replace the generic `nystagmus` with four typed findings; keep `ino`. All are **NON_LATERALISED**
(`@none` — a nystagmus type has no body side) and **LOCALISING**:

| Finding | Character | Localises to |
|---------|-----------|-------------|
| `nystagmus_peripheral` | unidirectional horizontal-torsional, fatigable, fixation-suppressed | inner ear — peripheral vestibular (labyrinth) |
| `nystagmus_gaze_evoked` | direction-changing, gaze-evoked (the central type) | **shared central** — cerebellum flocculonodular (refit) **AND** brainstem vestibular nuclei (`cn8_pons`, `icp_vestib`) |
| `nystagmus_downbeat` | downbeat | craniocervical junction (foramen magnum — Chiari) |
| `nystagmus_upbeat` | upbeat | pontomesencephalic / medullary tegmentum |
| `ino` *(exists, unchanged)* | dissociated, abducting eye | MLF |

`nystagmus_gaze_evoked` is a **shared central finding** — like `limb_ataxia` spans the peduncles and the
cerebellar hemisphere, it is emitted by both the cerebellum (flocculonodular) and the brainstem vestibular
nuclei. The peripheral-vs-central distinction is therefore `nystagmus_peripheral` (unidirectional,
fixation-suppressed) vs `nystagmus_gaze_evoked` (central, direction-changing). An **isolated**
`nystagmus_gaze_evoked` → the lean cerebellar flocculonodular site; with brainstem company (Wallenberg) →
the vestibular-nucleus site — emerges by company.

Concrete edits to `findings.js`:
- **Remove** `nystagmus` from `FINDINGS`, `CROSSES`, and `NON_LATERALISED`; **add** the four typed
  findings to `FINDINGS` (group "Cerebellar" / a "Vestibular / nystagmus" group), to `NON_LATERALISED`,
  and give each a `CROSSES: false` entry for map completeness (moot — `NON_LATERALISED` short-circuits to
  `@none`).
- **Update `cn8_vertigo`** description from "Vertigo / vestibular nystagmus (CN VIII)" to
  "Vertigo (peripheral or central vestibular)". It stays `crosses: false` and LOCALISING.

## Anatomical homes (`structures.js`, `sites.js`)

| Finding | Home | Mechanism |
|---------|------|-----------|
| `nystagmus_peripheral` + `cn8_vertigo` | **peripheral vestibular (labyrinth)** — new lateralised level `peripheral_vestibular`, part `labyrinth` | `buildSites` (left/right) |
| `nystagmus_gaze_evoked` | **cerebellum flocculonodular** (refit `cb_flocc`) **AND** **brainstem vestibular nuclei** (`cn8_pons` @ pons·lateral, `icp_vestib` @ medulla·lateral) | existing sites + 2 new companion structures |
| `nystagmus_downbeat` | **craniocervical junction** — midline site `craniocervical_junction`/`foramen_magnum` | composer |
| `nystagmus_upbeat` | **pontomesencephalic tegmentum** — midline site `pontomesencephalic`/`tegmentum` | composer |
| `ino` | MLF | unchanged |

**Structures:**
- `cb_flocc` (cerebellum flocculonodular) — change `produces: "nystagmus"` → `produces: "nystagmus_gaze_evoked"` (id may be renamed `cb_flocc_gaze`; note updated).
- **Central vestibular nuclei companions:** add `cn8_pons_nyst` at `level: "pons", part: "lateral"` and `icp_vestib_nyst` at `level: "medulla", part: "lateral"`, both `produces: "nystagmus_gaze_evoked"` — the vestibular nuclei's central nystagmus (rides the AICA / Wallenberg clusters).
- New peripheral vestibular: `vest_periph_nyst` (→ `nystagmus_peripheral`) and `vest_periph_vertigo` (→ `cn8_vertigo`) at `level: "peripheral_vestibular", part: "labyrinth"`. **No `hearing_loss`** on the core labyrinth site — vestibular neuritis has no hearing loss; Ménière/labyrinthitis (with hearing) is the labyrinth + cochlear picture, left to emerge by company rather than bundled in.
- New downbeat: `cvj_downbeat` (→ `nystagmus_downbeat`) at `level: "craniocervical_junction", part: "foramen_magnum"`.
- New upbeat: `ponto_upbeat` (→ `nystagmus_upbeat`) at `level: "pontomesencephalic", part: "tegmentum"`.

**Sites:**
- `peripheral_vestibular` → add to `LEVELS`; `labyrinth` → add to `PARTS`; `TERRITORY["peripheral_vestibular|labyrinth"]`. Lateralised via `buildSites` → `left/right_peripheral_vestibular_labyrinth`.
- The two central generators are **midline** sites built by a new **`composeCentralNystagmusSites()`** (the cauda/conus / cerebellum-vermis pattern, `side: "midline"`). Following the cerebellum-vermis convention the site **id == `level_part`**, so: id `craniocervical_junction_foramen_magnum` (level `craniocervical_junction`, part `foramen_magnum`) and id `pontomesencephalic_tegmentum` (level `pontomesencephalic`, part `tegmentum`). Their levels/parts are **not** in `LEVELS`/`PARTS` (composer-only, like `motor_unit`/`cauda`). `TERRITORY` entries added for both. Registered in `inverse.candidateSites()`.

**`cn8_vertigo` multi-source:** the existing `cn8_pons`/`icp_vestib` still emit `cn8_vertigo` (and now
gain the `nystagmus_gaze_evoked` companion); the new labyrinth site also emits `cn8_vertigo` (+
`nystagmus_peripheral`). So the central nuclei carry `cn8_vertigo` + `nystagmus_gaze_evoked`, the
peripheral labyrinth carries `cn8_vertigo` + `nystagmus_peripheral` — an isolated peripheral picture →
labyrinth; `cn8_vertigo` + `nystagmus_gaze_evoked` with brainstem company → central.

## Scoring (`score.js`)

`LOCALISING`: **remove** `nystagmus`; **add** `nystagmus_peripheral`, `nystagmus_gaze_evoked`,
`nystagmus_downbeat`, `nystagmus_upbeat`. `cn8_vertigo` and `ino` stay LOCALISING (unchanged).

Note `nystagmus_gaze_evoked` is LOCALISING but shared by three sites (flocculonodular + 2 vestibular
nuclei), so in isolation it localises to the lean cerebellar site and otherwise pins down by company —
the same shared-localiser behaviour `limb_ataxia` already has.

## Emergent naming (`syndromes.js` — phonebook)

| Key | Named | ddx / note |
|---|---|---|
| `peripheral_vestibular_labyrinth` | Peripheral vestibular syndrome | vestibular neuritis (no hearing), labyrinthitis / Ménière (+ hearing/tinnitus), BPPV; the benign end of the acute vestibular syndrome |
| `craniocervical_junction_foramen_magnum` | Downbeat nystagmus — craniocervical junction | Chiari I malformation, foramen-magnum lesion, also drugs (lithium) / SCA; "downbeat = CVJ" |
| `pontomesencephalic_tegmentum` | Upbeat nystagmus — pontomesencephalic / medullary tegmentum | brainstem tegmental lesion, Wernicke's, demyelination |
| `cerebellum_flocculonodular` *(existing, note updated)* | Flocculonodular (vestibulocerebellar) syndrome | note now names **gaze-evoked** nystagmus |

## Tests

**New `test/nystagmus.test.js`** (added to `npm test` chain + README), TDD red-first:
1. **Vocabulary:** the four typed findings exist, are in `NON_LATERALISED`, are LOCALISING; the old
   generic `nystagmus` is **gone** (`!isFinding("nystagmus")`); `cn8_vertigo` still LOCALISING +
   `crosses:false`.
2. **Structures/sites:** peripheral labyrinth produces `nystagmus_peripheral` + `cn8_vertigo`;
   `left_peripheral_vestibular_labyrinth` exists; the two midline generator sites exist (via the composer).
3. **Forward:** left labyrinth → `nystagmus_peripheral@none` + `cn8_vertigo@left`;
   `craniocervical_junction_foramen_magnum` → `nystagmus_downbeat@none`; `pontomesencephalic_tegmentum`
   → `nystagmus_upbeat@none`.
4. **Inverse emergence:**
   - `nystagmus_peripheral@none` + `cn8_vertigo@left` → `left_peripheral_vestibular_labyrinth`, named
     peripheral vestibular;
   - `nystagmus_downbeat@none` → `craniocervical_junction_foramen_magnum`, named downbeat/CVJ;
   - `nystagmus_upbeat@none` → `pontomesencephalic_tegmentum`, named upbeat.
5. **Multi-source discrimination:** an isolated `cn8_vertigo@left` prefers the peripheral labyrinth over
   the central nuclei sites (fewer over-predictions) — the peripheral-vs-central point.
6. **Shared central nystagmus:** an isolated `nystagmus_gaze_evoked@none` → the lean cerebellar
   flocculonodular site (the nucleus sites over-predict their brainstem clusters); a Wallenberg picture
   (with `nystagmus_gaze_evoked@none` added) still → the lateral medulla — the shared-by-company behaviour.

**Update `test/cerebellum.test.js`** for the rename: flocculonodular now produces `nystagmus_gaze_evoked`
(structure assertion, forward `nystagmus_gaze_evoked@none`, pancerebellar includes it, the emergence test
uses `nystagmus_gaze_evoked@none`). The vocabulary block that referenced the generic `nystagmus` is
updated.

**Regression watch (explicit):** all existing suites green. In particular:
- the **lateral medulla (Wallenberg)** and **lateral pons (AICA)** sites now also emit
  `nystagmus_gaze_evoked@none` (the vestibular-nucleus companion). Any exact-set / `missedByPatient===0`
  assertion for those syndromes must have `nystagmus_gaze_evoked@none` **added to its input**, and the
  winner must be unchanged (the site now explains the added finding, so it still wins). This is the main
  ripple — expect to touch the Wallenberg assertions in `cranial-nerves`/`engine`/`horner-axis` suites.
- a full **Wallenberg** still → the lateral medulla (the peripheral labyrinth over-predicts
  `nystagmus_peripheral` and loses; the CVJ/pontomesencephalic sites emit the wrong nystagmus type);
- an isolated **`cn8_vertigo`** prefers the peripheral labyrinth (fewer over-predictions);
- the **cerebellum** suite passes after the `nystagmus_gaze_evoked` refit.
If any assertion shifts unexpectedly, surface it — don't silently patch.

## What this increment does NOT do (YAGNI / deferred)

- **No fuller foramen-magnum / craniocervical syndrome** — the CVJ site emits only `nystagmus_downbeat`
  here; the fuller picture (high-cervical cord long-tract signs, lower cranial nerves) is a later region.
- **No positional / HINTS mechanics** — head-impulse, test-of-skew, positional (BPPV) manoeuvres are not
  modelled; only the spontaneous nystagmus type localises.
- **No periodic-alternating / see-saw / pendular subtypes** — the four commonest localising types plus
  INO are enough; rarer subtypes deferred.

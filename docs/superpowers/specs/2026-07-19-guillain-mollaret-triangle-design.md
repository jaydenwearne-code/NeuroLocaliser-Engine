# Guillain-Mollaret triangle (palatal / oculopalatal tremor) — design spec

**Date:** 2026-07-19
**Region increment:** model the **dentato-rubro-olivary loop** (Guillain-Mollaret triangle) so **palatal
myoclonus/tremor** (and oculopalatal tremor) emerges. `palatal_tremor` is a *shared* finding across the
loop: an **isolated** palatal (± pendular) tremor localises **broadly to the triangle** (hypertrophic
olivary degeneration), while palatal tremor **with node-specific company** sharpens to the **red-nucleus
(rubral) corner** or the **dentate (cerebellar) corner** — the broad-default / sharp-with-company pattern,
built from superset/subset parsimony. No new solver mechanism; all sites are dedicated/composer-built so no
existing vascular syndrome is polluted.
**Status:** approved design — IMPLEMENTED (25 suites / 1010 assertions green).

> **Refinements during impl (recorded):**
> 1. **The dentate corner mirrors the FULL cerebellar-hemisphere signature** (it unions the `cerebellum`/
>    `hemisphere` structures — `limb_ataxia`/`dysmetria`/`dysdiadochokinesis`/`intention_tremor`), not a
>    single custom `dysmetria` structure. Without this, an *isolated* cerebellar sign (e.g. bare `dysmetria`)
>    would wrongly localise to `gm_dentate` (leaner than the 4-sign hemisphere). Mirroring is also
>    anatomically right — the dentate is the hemisphere's output nucleus — so isolated cerebellar signs stay
>    with the hemisphere and only `palatal_tremor` + cerebellar signs wins the corner. The `gm_dentate_dysmetria`
>    structure was removed.
> 2. **Accepted edge case:** an *isolated* `tremor_rubral` resolves to `gm_rubral` (the only lean
>    `tremor_rubral` producer — the red nucleus is otherwise bundled in the midbrain·medial/Weber cluster,
>    which over-predicts). Clinically rubral (Holmes) tremor is essentially never isolated, and a red-nucleus-
>    corner (midbrain) localisation is anatomically correct; the phonebook note says the rubral tremor "may be
>    accompanied by palatal tremor" rather than implying palatal tremor is always present.

## Context

The Guillain-Mollaret triangle = **red nucleus** (midbrain) ↔ **inferior olive** (medulla) ↔ **dentate
nucleus** (contralateral cerebellum), linked by the **central tegmental tract** (red→olive), the
olivocerebellar fibres (olive→dentate) and the dentato-rubral fibres via the **superior cerebellar
peduncle** (dentate→red). A lesion anywhere in the loop causes **hypertrophic olivary degeneration (HOD)**
and **palatal tremor** (± vertical **pendular** nystagmus = oculopalatal tremor). The commonest lesions are
the central tegmental tract, the dentate, and the SCP; the olive is the effector / MRI hallmark.

Currently modelled: **red nucleus** (`red_nucleus`, midbrain·medial → `tremor_rubral`, `crosses:true`) and
the **SCP** (`scp_midbrain`, midbrain·medial → `limb_ataxia`). Missing: the inferior olive, the dentate as
a palatal-tremor node, the central tegmental tract, and the `palatal_tremor` / `nystagmus_pendular`
findings.

## Design decisions (settled during brainstorming)

1. **Full triangle**, with `palatal_tremor` a *shared* finding (like `limb_ataxia` spans peduncles +
   hemisphere).
2. **Include oculopalatal tremor** — a `nystagmus_pendular` companion finding (joins the `nystagmus_*`
   taxonomy).
3. **Sharp node disambiguation with a broad default:** isolated palatal/oculopalatal tremor → the broad
   **triangle** site; palatal tremor + rubral tremor → the **rubral corner**; palatal tremor + cerebellar
   signs → the **dentate corner**. Achieved by making the corner sites **supersets** of the broad triangle
   (triangle findings + one node-specific finding), so the broad site wins alone (corners over-predict) and
   a corner wins when its extra finding appears.

## The findings (`findings.js`)

Two new findings, both **NON_LATERALISED** (`@none` — palate and eyes are midline/bilateral), both
**LOCALISING**:

| Finding | Meaning |
|---------|---------|
| `palatal_tremor` | palatal myoclonus / tremor (~2 Hz) — the dentato-rubro-olivary sign (HOD) |
| `nystagmus_pendular` | vertical pendular nystagmus; with palatal tremor = oculopalatal tremor |

Edits: add both to `FINDINGS` (`palatal_tremor` group "Cerebellar" or "Brainstem network"; `nystagmus_pendular`
group "Vestibular / nystagmus"), to `NON_LATERALISED`, `CROSSES` (both `false`), and `LOCALISING` in
`score.js` (put `nystagmus_pendular` on the nystagmus-taxonomy line).

## Anatomical homes (`structures.js`, `sites.js`)

**Structures** (new composer-only level `guillain_mollaret`, not in `LEVELS`/`PARTS`):
- `inferior_olive` — part `triangle`, produces `palatal_tremor` (note: inferior olive — HOD effector / MRI hallmark).
- `central_tegmental_tract` — part `triangle`, produces `palatal_tremor` (note: central tegmental tract — the commonest lesion, rubro-olivary limb). *(Two structures both producing `palatal_tremor` document the two isolated-palatal-tremor nodes; the forward model dedupes to `palatal_tremor@none`.)*
- `gm_pendular` — part `triangle`, produces `nystagmus_pendular` (note: oculopalatal tremor — pendular nystagmus from HOD).
- `gm_dentate_dysmetria` — part `dentate`, produces `dysmetria`, `crosses:false` (note: dentate nucleus — appendicular cerebellar output; the dentate corner's disambiguating sign).

**Sites** (one composer `composeGuillainMollaretSites()`, registered in `inverse.candidateSites()`):

| Site id | Side | Structures | Emits |
|---------|------|------------|-------|
| `guillain_mollaret_triangle` | midline | `inferior_olive`, `central_tegmental_tract`, `gm_pendular` | `palatal_tremor@none` + `nystagmus_pendular@none` |
| `gm_rubral_left` / `_right` | left/right | triangle structures **+ `red_nucleus`** (the existing midbrain structure, `crosses:true`) | + `tremor_rubral@contra` |
| `gm_dentate_left` / `_right` | left/right | triangle structures **+ `gm_dentate_dysmetria`** | + `dysmetria@ipsi` |

```
export function composeGuillainMollaretSites() {
  const tri = STRUCTURES.filter(s => s.level === "guillain_mollaret" && s.part === "triangle").map(s => s.id);
  if (!tri.length) return [];
  const dent = STRUCTURES.filter(s => s.level === "guillain_mollaret" && s.part === "dentate").map(s => s.id);
  const out = [{ id: "guillain_mollaret_triangle", side: "midline", level: "guillain_mollaret", part: "triangle",
    territory: TERRITORY["guillain_mollaret|triangle"], structures: tri, composite: true }];
  for (const side of ["left", "right"]) {
    out.push({ id: `gm_rubral_${side}`, side, level: "guillain_mollaret", part: "rubral",
      territory: TERRITORY["guillain_mollaret|rubral"], structures: [...tri, "red_nucleus"], composite: true });
    out.push({ id: `gm_dentate_${side}`, side, level: "guillain_mollaret", part: "dentate",
      territory: TERRITORY["guillain_mollaret|dentate"], structures: [...tri, ...dent], composite: true });
  }
  return out;
}
```
`TERRITORY` entries added for `guillain_mollaret|triangle`, `|rubral`, `|dentate`.

**Why the corners don't pollute existing syndromes:** every GM site is composer-built and carries the two
GM findings; on a Benedikt input (`tremor_rubral` + `cn3` + …) `gm_rubral` matches only `tremor_rubral`,
leaves the rest unexplained, and over-predicts the GM findings → it loses to midbrain·medial. On a pure
cerebellar-hemisphere input, `gm_dentate` matches only `dysmetria`, misses the other cerebellar signs, and
over-predicts the GM findings → it loses to the hemisphere. The existing `red_nucleus` structure is reused
by reference (unioned into `gm_rubral`); midbrain·medial itself is unchanged.

## Scoring (`score.js`)

`LOCALISING`: add `palatal_tremor` and `nystagmus_pendular`.

## Emergent behaviour (tests)

1. **Isolated palatal tremor** `{palatal_tremor@none}` → `guillain_mollaret_triangle` (score 2.5 — matches
   `palatal_tremor`, over-predicts `nystagmus_pendular` 0.5; the corners over-predict their extra finding
   too and score lower). The broad "triangle / HOD" default.
2. **Oculopalatal tremor** `{palatal_tremor@none, nystagmus_pendular@none}` → `guillain_mollaret_triangle`
   (matches both, over-predicts nothing).
3. **Rubral corner** `{palatal_tremor@none, tremor_rubral@right}` → `gm_rubral_left` (explains both; beats
   the broad triangle, which leaves `tremor_rubral` unexplained, and midbrain·medial, which over-predicts
   its Weber cluster).
4. **Dentate corner** `{palatal_tremor@none, dysmetria@left}` → `gm_dentate_left` (explains both; beats the
   cerebellar hemisphere, which leaves `palatal_tremor` unexplained + over-predicts its other signs).
5. **Naming:** the triangle names the Guillain-Mollaret triangle / HOD; the corners name the rubral and
   dentate corners.
6. **Forward:** `gm_rubral_left` emits `tremor_rubral@right` (contra) + `palatal_tremor@none` +
   `nystagmus_pendular@none`; `gm_dentate_left` emits `dysmetria@left` (ipsi) + the two GM findings.

## Emergent naming (`syndromes.js` — phonebook, by `level_part`)

| key | Named | note |
|-----|-------|------|
| `guillain_mollaret_triangle` | Guillain-Mollaret triangle (dentato-rubro-olivary) — palatal / oculopalatal tremor | hypertrophic olivary degeneration; commonest lesion the central tegmental tract; the loop is red nucleus → central tegmental tract → inferior olive → olivocerebellar → dentate → SCP → red nucleus. ddx: brainstem infarct/haemorrhage/CM, MS, trauma, degeneration |
| `guillain_mollaret_rubral` | Guillain-Mollaret triangle — red-nucleus (rubral) corner | palatal tremor + contralateral rubral tremor — a midbrain lesion at the red-nucleus corner |
| `guillain_mollaret_dentate` | Guillain-Mollaret triangle — dentate (cerebellar) corner | palatal tremor + ipsilateral cerebellar signs — a lesion at the dentate corner |

## Regression watch

All prior suites green. Specifically: **an isolated `tremor_rubral`** may now resolve to `gm_rubral`
(the only lean `tremor_rubral` producer — midbrain·medial over-predicts its whole Weber cluster); confirm
no existing test asserts an isolated-`tremor_rubral` result, and that **Benedikt / midbrain** (with company)
and **cerebellar-hemisphere** inputs are unchanged (the corners lose them). If any assertion shifts, surface
it — don't silently patch.

## What this does NOT do (YAGNI)

- **No olive/CTT as separately-winning nodes** — they cause *isolated* palatal tremor, so they correctly
  fall under the broad-triangle default (documented as its structures). Only the corners with distinctive
  company (rubral, dentate) sharpen.
- **No SCP palatal-tremor emitter** — the dentate corner represents the dentato-SCP limb; the SCP is noted
  in the loop, not a new emitter (avoids Benedikt pollution).
- **No HOD tempo/latency modelling** (HOD develops weeks after the lesion) — that is a tempo layer concern.
- **No progressive ataxia / other pendular-nystagmus causes** (MS) — `nystagmus_pendular` here is the
  oculopalatal companion.

# Multifocal pattern axis: what shape of dissemination, not how many sites

**Date:** 2026-08-15
**Status:** design, approved — awaiting implementation plan
**Amends:** `2026-08-14-multi-location-ddx-design.md` (replaces the `spread` trigger it introduced)

## The problem

The cross-site roster fires on a **counting** question. Nine of the thirteen entities are triggered by
`spread: { minSites: 2 }` — *"are there two sites?"* — when the clinical question is a **pattern** question:
*"does this disease deposit lesions of this kind, in this relationship to each other?"*

Reported by the owner (a clinician) on the live app, entering **right arm and left leg weakness**:

> "some of the multifocal causes are overcalled because their trigger is 2 sites separated by space. right
> arm and left leg weakness would be explained by multifocal masses, embolic or vasculitic phenomena, but
> leptomeningeal and especially paraneoplastic causes are quite a stretch. Moreover, demyelination would
> also cause this issue but it is not offered as a differential."

Both halves verified against the engine:

**Over-call.** The two sites are `right_cortex_motor_leg` and `left_cortex_motor_facearm`. Every
`spread`-triggered entity whose `compartments` allow-list contains `brain` fires — seven of them — because
nothing asks whether the disease produces *this kind* of lesion. Leptomeningeal disease seeds CSF surfaces;
paraneoplastic syndromes target selectively vulnerable systems. Neither produces two discrete motor-strip
lesions, but both fire on the count.

**Under-call.** Multiple sclerosis is *blocked*, by its own `spread: { distinctCompartments: 2 }`. Both
sites are the `brain` compartment, so the engine reads two hemispheres in two arterial territories as "one
place".

### Measured baseline

| Fact | Value |
|---|---|
| Entities triggered by a bare site count | **9 of 13** |
| Entities firing on the reported case | 7 (2 of them clinically a stretch, 1 missing) |
| Site pairs with distinct **compartments** | 84% |
| Site pairs with distinct **territory strings** | **99%** |
| `territory` strings containing an explicit vessel segment (M1–4 / A1–5 / P1–4) | **0 of 211** |

The third and fourth rows killed the obvious shortcut. Swapping the compartment test for a territory test
would be nearly as blunt as counting, and the `territory` field is human-readable prose
(`"MCA superior division (precentral — face/arm motor)"`), not a structured taxonomy. **The discrimination
has to come from mechanism, and the vascular axis has to be authored rather than parsed.**

## The principle

**A disease has a characteristic lesion pattern, not a lesion count.** Two lesions is the precondition, not
the reason. The engine should ask what shape of dissemination the disease produces — masses in parenchyma,
occlusions across arterial territories, seeding of CSF surfaces, attack on a vulnerable system — and fire
only when the observed sites have that shape.

## Design

### 1. `src/model/vascular.js` — the authored vascular axis

Keyed by **`level|part`**, not by site, so left and right collapse to one row: **104 CNS keys** rather than
188 sites.

> **Keyed by `level|part`, NOT by `part` alone.** Part names are not unique across levels — `lateral` is
> used at midbrain, pons, medulla, cord *and* hypothalamus; `hemi` at four levels; also `medial` and
> `anterior`. Four names collide, which is why there are 94 distinct part names but **104** distinct
> `level|part` keys. Keying on the bare name would give lateral medulla (PICA) and lateral midbrain a single
> shared vascular row — a silent clinical error. `causes.js` already resolves keys as
> `` `${level}_${part}` `` for the same reason; follow that precedent.

```js
export const VASCULAR = {
  "cortex|motor_facearm":    { vessel: "MCA",     segment: "M4",  branch: "precentral",        zone: "cortical" },
  "cortex|hand_knob": { vessel: "MCA",     segment: "M4",  branch: "precentral",        zone: "cortical" },
  "cortex|operculum": { vessel: "MCA",     segment: "M3",  branch: "frontal operculum", zone: "cortical" },
  "cortex|motor_leg": { vessel: "ACA",     segment: "A4",  branch: "paracentral",       zone: "cortical" },
  "subcortex|internal_capsule": { vessel: "MCA",     segment: "M1",  branch: "lenticulostriate",  zone: "perforator" },
  "cortex|watershed_anterior": { vessel: "ACA-MCA",segment: null,  branch: null,                zone: "watershed" },
};
```

| Field | Purpose |
|---|---|
| `vessel` | Parent vessel — MCA, ACA, PCA, BA, PICA, AICA, SCA, vertebral, spinal arteries |
| `segment` | Branch-level resolution — M1–M4, A1–A5, P1–P4, or `null` where the part is not vascular-defined |
| `branch` | The named cortical branch; human-readable, and what a card can show |
| `zone` | `cortical · perforator · watershed · brainstem · cord` |

`zone` earns its place because "separated in space" means different things within each: two lesions in one
lenticulostriate perforator group are one small-vessel process, whereas two M4 branches are not.

**`segment: null` is a deliberate statement, never an unfilled cell.** Some parts are *functional* rather
than vascular — `arcuate` (a fasciculus), `combined_degeneration` (a tract pair), `aphasia_global`. Each
null carries a reason and is asserted as intentional, the same shape as `NOT_LOCALISING_BY_DESIGN` in
`score.js`. Separation for those parts falls back to a coarser axis.

### 2. `src/model/topography.js` — the authored non-vascular axis

Also keyed by `level|part`, for the same collision reason. Kept separate from `vascular.js` because it is a different clinical review question.

```js
export const TOPOGRAPHY = {
  "cortex|motor_facearm":     { lobe: "frontal",  surface: false, system: null },
  "cauda|cauda_equina": { lobe: null,       surface: true,  system: null },
  "cortex|anterior_temporal": { lobe: "temporal", surface: false, system: "limbic" },
};
```

- **`lobe`** — `frontal · parietal · temporal · occipital · insula`. **33 cortex keys** need a tag; the
  other 71 CNS keys are `lobe: null` by nature.
- **`surface`** — CSF-bathed (meninges, cranial-nerve exits, roots, cauda) versus deep parenchyma.
- **`system`** — tags only the selectively vulnerable systems: `limbic · cerebellar · brainstem · DRG ·
  NMJ`. `null` everywhere else.

### 3. `separatedInSpace(sites, axis)` — derived, never stored

Five axes, coarsening left to right:

```
segment  →  vessel  →  lobe  →  hemisphere  →  level
```

`hemisphere` is free (derived from `site.side`); `level` is the existing neuraxis level. Each pattern names
the axis it needs, and `"any"` means the sites differ on **at least one** axis. A part whose `segment` is
`null` simply cannot satisfy the `segment` axis and falls back to whatever coarser axis the pattern allows.

### 4. The `pattern` axis on entities

`pattern` takes an **array** — some diseases genuinely have more than one mode of dissemination.

Each definition below is stated as a predicate over the **whole site set**, so there is exactly one reading.
"CNS compartments" means `brain · brainstem · cerebellum · cord · optic`.

| Pattern | Fires when |
|---|---|
| `mass` | **every** site is in a CNS compartment **and** has `surface: false` — a discrete lesion in parenchyma rather than on a CSF surface |
| `territorial` | **every** site is in a CNS compartment, and the set is separated at the **`segment`** axis |
| `surface` | **every** site has `surface: true` |
| `systemSelective` | **every** site has a non-null `system` tag |
| `nerveTrunk` | **every** site is in the `nerve` compartment |
| `motorSystem` | UMN + LMN present and no sensory finding — delegates to `umnLmnPattern()` over the observed findings, not to the site set |
| `cns` | **every** site is in a CNS compartment, and the set is separated on **at least one** axis |

All patterns additionally require ≥2 sites, which `unifyingDiagnoses()` already enforces before any entity
is considered. An entity fires if **any one** of its declared patterns matches.

**Entity assignment:**

| Entity | Pattern | Separation |
|---|---|---|
| Metastases | `mass` | — |
| Primary CNS lymphoma | `mass` | — |
| Embolic shower | `territorial` | segment |
| Vasculitis | `territorial`, `nerveTrunk` | segment / — |
| **Multiple sclerosis** | **`cns`** | **any** |
| Leptomeningeal disease | `surface` | — |
| Neurosarcoidosis | `surface` | — |
| Paraneoplastic syndrome | `systemSelective` | — |
| Neurosyphilis or HIV | `mass`, `surface`, `nerveTrunk` | — |
| Motor neurone disease | `motorSystem` | — |
| NMOSD · Mononeuritis multiplex · NF2 | *keep their existing `sites` clauses* | — |

**MS is `cns` + `any`, on the owner's explicit ruling** ("MS should fire in any two CNS sites differentiated
in space"). An earlier draft proposed a `whiteMatter` pattern for it; that ruling removes the need, MS was
its only user, so **the `whiteMatter` pattern and its topography field are dropped entirely.**

**The `compartments` allow-lists signed off on 2026-08-15 stay unchanged.** Pattern and allow-list answer
different questions — *how it spreads* versus *where it goes* — and **both are HARD filters** (owner's
ruling). Tempo and course remain the only soft axes. Vasculitis needs `territorial` OR `nerveTrunk`
precisely because its allow-list already spans CNS and PNS.

`spread` is removed from the entity shape entirely, so no dead path remains.

### 5. Outcome on the reported case

`right_cortex_motor_leg` (ACA, A4, paracentral, frontal lobe, right) and `left_cortex_motor_facearm`
(MCA, M4, precentral, frontal lobe, left) — separated at `segment`, `vessel` and `hemisphere`, not at `lobe`.

| Entity | Fires | Matches the owner's read |
|---|---|---|
| Metastases | ✓ `mass` | ✓ |
| Primary CNS lymphoma | ✓ `mass` | ✓ (owner: "mass is right") |
| Embolic shower | ✓ `territorial` | ✓ |
| Vasculitis | ✓ `territorial` | ✓ |
| Multiple sclerosis | ✓ `cns` + any | ✓ — the reported omission, fixed |
| Leptomeningeal disease | ✗ not `surface` | ✓ |
| Paraneoplastic syndrome | ✗ no `system` tag | ✓ |

## Testing

**Table invariants**, in the shape that has held elsewhere in this engine:

- every CNS `level|part` key has a `VASCULAR` row and every key a `TOPOGRAPHY` row, asserted against
  `candidateSites()` at runtime so a newly added site cannot fall through silently;
- **every `segment: null` is deliberate and carries a reason** — a null is never an unfilled cell;
- every `vessel`, `segment`, `lobe`, `zone` and `system` value comes from a declared vocabulary, so free
  text cannot drift in.

**Behavioural tests.** The owner's six verdicts above are pinned as the headline regression. The systematic
sweep is re-run in both directions: 364 single sites must never fire, and pairs that genuinely need two
lesions must still fire.

**The over-suppression measurement is part of the deliverable, not an afterthought.** Today 7.8% of pairs
legitimately return no entity. Hard-filtering on pattern will raise that. The implementation must report the
before/after number rather than assert it is acceptable; if it climbs steeply the honest response is to
widen a specific pattern, not to loosen the mechanism.

## Risks

| Risk | Mitigation |
|---|---|
| Over-suppression — the card falls silent too often | Measured before/after and reported as a number; widen specific patterns if it climbs |
| 104 vascular rows are new clinical content at the roster's bar | Authored and presented in anatomical batches (anterior → posterior → perforator → brainstem → cord), not dropped at once |
| A key's territory is genuinely not vascular-defined | Explicit `segment: null` with a reason, asserted deliberate |
| Patterns drawn too tight, so a real disease stops being offered | Start tight, widen against cases the owner flags — the reverse is invisible |
| This changes behaviour already live to ED testers | Owner sign-off before merge, as with the roster |

## Out of scope

- Re-opening the `compartments` allow-lists or the `LOCALISING` audit — both signed off 2026-08-15.
- Case-conditioned likelihood (age, risk factors), still out as in the parent spec.
- Vascular subterritory for peripheral parts — separation there is by nerve or root, already derivable.

## Success criteria

1. Right arm + left leg weakness yields metastases, lymphoma, embolic shower, vasculitis and **MS**, and
   yields neither leptomeningeal disease nor paraneoplastic syndrome.
2. MS fires on any two CNS sites separated in space on any axis, and on no fewer.
3. `spread` no longer exists in the entity shape.
4. Every CNS `level|part` key has a vascular row; every `segment: null` is deliberate and reasoned.
5. Every single site alone still produces no multifocal claim; genuinely two-lesion pairs still fire.
6. The before/after silent-pair percentage is measured and reported.
7. All suites green, and the reported case verified in the running app.

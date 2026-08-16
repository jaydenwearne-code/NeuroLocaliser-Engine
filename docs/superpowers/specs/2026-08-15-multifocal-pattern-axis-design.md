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

### 4. The `substrate` axis on entities — what tissue the disease attacks

**AMENDED 2026-08-15, after measurement.** An earlier draft of this section defined seven lesion
*patterns* (`mass`, `territorial`, `surface`, `systemSelective`, `nerveTrunk`, `motorSystem`, `cns`), each
a predicate over the whole site set. It was built, measured, and **rejected** — see the amendment note at
the end of this section for what it broke and why the fix below is structural rather than a workaround.

**A disease attacks a SUBSTRATE, and that substrate has its own distribution through the body.** Vasculitis
crosses the CNS/PNS boundary because its substrate — blood vessels — exists on both sides of it. Metastases
do not, because theirs does not. Distribution is therefore not a property of the disease's "shape"; it is a
property of the tissue it targets and where that tissue exists.

**Substrates present at a site — DERIVED from the tables already authored, not newly hand-listed:**

| Substrate | Where it exists | Derived from |
|---|---|---|
| `vessel` | **everywhere** — CNS and PNS alike | universal |
| `parenchyma` | CNS, non-surface | CNS compartment + `surface: false` |
| `leptomeninges` | CSF-bathed surfaces | `surface: true` |
| `myelin_cns` | CNS white matter | CNS compartments |
| `schwann` | peripheral nerve, root, plexus | compartment |
| `neuron_population` | the selectively vulnerable systems | non-null `system` tag |
| `motor_neuron` | the motor system, upper and lower | `umnLmnPattern()` over the observed findings |

**Each entity declares the substrate it attacks, plus an optional distribution rule** for how it spreads
*within* that substrate. An entity fires when its substrate is present at **every** site in the set and the
distribution rule (if any) holds over the set.

| Entity | Attacks | Distribution |
|---|---|---|
| Vasculitis | `vessel` | — (vessels are everywhere, so CNS+PNS involvement follows structurally) |
| Embolic shower | `vessel` | distinct arterial **segments** — emboli lodge at branch points |
| Metastases | `parenchyma` | — |
| Primary CNS lymphoma | `parenchyma` | — |
| Multiple sclerosis | `myelin_cns` | separated in space, **any** axis |
| Leptomeningeal disease | `leptomeninges` | — |
| Neurosarcoidosis | `leptomeninges` | — |
| Paraneoplastic syndrome | `neuron_population` | — |
| Mononeuritis multiplex | `vessel` restricted to `schwann` territory | ≥2 named nerves |
| Motor neurone disease | `motor_neuron` | — |
| Neurofibromatosis type 2 | `schwann` | — |
| NMOSD | `myelin_cns` | its existing `sites` clause (optic + cord) |
| Neurosyphilis or HIV | `parenchyma`, `leptomeninges`, `schwann` | — |

Two consequences worth stating plainly:

- **Mononeuritis multiplex stops being its own mechanism** and becomes what it clinically is — vasculitis of
  the vasa nervorum. Same substrate as vasculitis, restricted to peripheral nerve.
- **Embolic shower and vasculitis share a substrate and differ only in distribution** (segment-lodging
  versus diffuse), which is the real clinical distinction between them.

#### The `compartments` allow-list is retained, subject to a narrowness invariant

Substrate answers *is the target tissue here* (structure). The allow-list answers *does this disease
actually turn up here* (frequency) — the owner's 2026-08-15 typicality ruling, which substrate cannot
express. Four of the typicality rulings become structural and their allow-list entries stop doing any work:
metastases not reaching nerve or plexus (`parenchyma` absent), MS not firing on skull base + sympathetic
chain (`myelin_cns` absent), leptomeningeal disease not firing on deep parenchyma (`leptomeninges` absent),
and two peripheral nerves not returning CNS lymphoma (`parenchyma` absent).

Four survive, and only an allow-list can state them, because the tissue **is** present:

| Ruling | Why substrate cannot express it |
|---|---|
| Embolic shower excludes `cord` | The cord has vessels (anterior spinal artery); embolic cord infarction is vanishingly rare |
| Primary CNS lymphoma excludes `cord` | The cord is parenchyma; primary spinal cord lymphoma is atypical |
| Neurosarcoidosis excludes `cauda` | The cauda is a CSF surface, so substrate would allow it |
| Vasculitis excludes NMJ, pupil, sympathetic, cauda | Vessels are everywhere, so substrate allows all of them |

**INVARIANT: an allow-list must be strictly NARROWER than its substrate's natural footprint, or it is
deleted.** An allow-list that merely restates its substrate looks meaningful but is not, and a later edit to
one could silently contradict the other. MND's list and MS's list are already restatements and go. This is
asserted, so a redundant allow-list cannot be reintroduced.

#### Vasculitis has no distribution rule — a measured decision

Vasculitis fires on ~92% of site pairs, because its substrate is universal. Four candidate distribution
rules were measured over 2850 pairs:

| Candidate | Fires on | Verdict |
|---|---|---|
| separated `any` | 97.3% | No narrower than no rule |
| distinct vascular unit | 96.9% | No narrower than no rule |
| separated `vessel` | 21.5% | Narrows only by disqualifying nerve sites — re-breaks `cord + L5 root` |
| separated `segment` | 5.0% | Same defect, more extreme |

**Spatial separation cannot discriminate vasculitis, because spatial separation is what vasculitis always
has.** Its real discriminator is temporal — stepwise, with plateaus — which lives in `course` and DEMOTES
rather than filters, per the standing ruling that course must never delete a differential. **Owner's
decision (2026-08-15): accept the breadth.** At `uncommon` likelihood it sorts below the common entities,
and a course mismatch collapses it into the demoted band.

#### Amendment note: why the pattern axis was replaced

The pattern version was implemented and measured before being rejected — the evidence is the reason for the
change, not a hunch. Silent site pairs rose from **7.8% to 38.0%**, and **74% of the silent pairs were mixed
CNS+PNS pictures**. Concretely, `brain + peripheral nerve`, `brainstem + peripheral nerve` and
**`cord + L5 root`** all returned an empty card — the last being the flagship multifocal example from the
original layer.

The cause was structural: every pattern was phrased "**every** site is X", so a mixed picture could satisfy
none of them. Vasculitis declared `["territorial", "nerveTrunk"]` precisely to cover both sides of the
neuraxis, and the "any one pattern over all sites" rule defeated that intent — the two diseases whose
defining feature is hitting CNS *and* PNS were the two that could never fire on a mixed picture.

The first proposed fix was to give vasculitis the `mass` pattern as well. **The owner rejected that as a
workaround** — it attributes a non-vascular attribute to a vascular disease to make the mechanics work,
which is fitting the disease to the model rather than modelling the disease. The substrate axis above is
the structural answer: vasculitis reaches both because vessels are in both.
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

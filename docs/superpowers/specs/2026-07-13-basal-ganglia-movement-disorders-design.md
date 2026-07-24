# Basal ganglia & movement disorders — design spec

**Date:** 2026-07-13
**Region increment:** add the **basal ganglia** as a new anatomical level so that the extrapyramidal
movement disorders — **parkinsonism** (substantia nigra), **chorea** (striatum), **dystonia** (globus
pallidus) — localise, alongside the already-modelled **hemiballismus** (subthalamic nucleus). Completes
the tone axis with its third member, **rigidity** (extrapyramidal), beside `spasticity` (UMN) and
`hypotonia` (LMN).
**Status:** approved design, ready for implementation planning

## Context

The engine models the whole neuraxis but has a conspicuous hole: the basal ganglia. Only two
movement structures exist today: the **subthalamic nucleus** → `hemiballismus` (in `subcortex`) and the
**red nucleus** → `tremor_rubral` (in `midbrain`). There is no substantia nigra, striatum, or globus
pallidus, so a localisation engine cannot place parkinsonism, chorea, or dystonia — an entire clinical
system is missing.

This increment adds those three nuclei and their movement findings, following the engine's established
recipe exactly (findings → structures → sites → phonebook → tests-first). It introduces **no new solver
mechanism**: movement findings are lateralised the same way every other supratentorial finding is
(contralateral, above all decussations), and the bilateral degenerative presentation reuses the existing
bilateral-composer pattern (`composeMotorUnitSites` / `composeBilateralCordSites`).

## Two design decisions (settled during brainstorming)

1. **Laterality: focal-contra sites AND bilateral sites; diseases named later.** Movement disorders
   present two ways. A *focal/structural* lesion of one nucleus gives a **contralateral hemi-syndrome**
   (hemiballismus from STN; hemichorea from striatum; hemidystonia from pallidum;
   hemiparkinsonism from a nigral lesion). The *degenerative diseases* (idiopathic Parkinson's,
   Huntington's) are **bilateral** (often asymmetric-onset). We model **both**: the default site
   machinery yields the left/right focal sites, and a small composer yields the bilateral site. The
   **eponyms** (PD, HD) are attached by the phonebook *after* localisation — the anatomy stays pure, the
   precedent set by ALS (a pathology, not a site) and the cortex increment (anatomy-first,
   pathology-as-annotation).

2. **Granularity: core findings + rigidity on the tone axis.** One finding each — `parkinsonism`,
   `chorea`, `dystonia` (+ existing `hemiballismus`). Rest tremor / bradykinesia fold into
   `parkinsonism` (they don't discriminate *which* nucleus, so decomposing adds no localising power).
   Additionally, **`rigidity`** (lead-pipe / cogwheel) is added as the **third member of the tone axis**,
   a companion of the substantia nigra — completing the clean UMN (`spasticity`) / LMN (`hypotonia`) /
   extrapyramidal (`rigidity`) three-way split.

## Anatomy: level, structures, findings

**New level `basal_ganglia`** with four parts. The **subthalamic nucleus is relocated here from
`subcortex`** — it belongs to the basal ganglia anatomically, so the whole system lives under one
cohesive level:

| Part | Structure → finding | Crossing | Note |
|------|--------------------|----------|------|
| `substantia_nigra` | → `parkinsonism` | `crosses: true` (contra) | nigrostriatal — bradykinesia, rest tremor, rigidity cluster |
| `substantia_nigra` | → `rigidity` | `crosses: true` (contra) | extrapyramidal tone; tone-axis companion (non-localising) |
| `striatum` | → `chorea` | `crosses: true` (contra) | caudate + putamen; choreoathetosis |
| `globus_pallidus` | → `dystonia` | `crosses: true` (contra) | focal (contra) vs generalised (bilateral) |
| `subthalamic` | → `hemiballismus` *(relocated)* | `crosses: true` (contra) | STN — unchanged finding, new home |

**Findings (`findings.js`):** add `parkinsonism`, `chorea`, `dystonia`, `rigidity` to the finding
catalogue (group: "Basal ganglia / movement" for the movement findings; `rigidity` groups with the
existing "Tone / wasting" family). Re-group the existing `hemiballismus` from "Subcortical" to "Basal
ganglia / movement" for cohesion. Add the three new movement findings to the **`CROSSES`** map with
`true` (contralateral, above all decussations — matching the existing `hemiballismus`/`tremor_rubral`
and the cortical somatotopic findings); `rigidity` also `true`. `hemiballismus` is already `true` and in
`LOCALISING` — **unchanged**.

**Refactor: relocating STN from `subcortex` → `basal_ganglia`.** The `stn` structure moves level
(`part: "subthalamic"` unchanged). The ripple, all mechanical:
- `structures.js` — `stn.level: "subcortex"` → `"basal_ganglia"`.
- `sites.js` — remove `"subthalamic"` from the subcortex `PARTS`; add `basal_ganglia` to `LEVELS` and
  its four parts to `PARTS`; move the `subcortex|subthalamic` `TERRITORY` entry to
  `basal_ganglia|subthalamic`; drop the now-unused `DEEP_TERRITORY.subthalamic` (STN is in no lacune
  composite group).
- **Site id changes** `left_subcortex_subthalamic` → `left_basal_ganglia_subthalamic` (and right).
- `syndromes.js` — phonebook key `subcortex_subthalamic` → `basal_ganglia_subthalamic` (content
  unchanged).
- `test/subcortex.test.js` — the subthalamic/hemiballismus assertions (structure lookup, site id,
  forward contra, inverse localisation + naming) **move out** to the new `basal-ganglia.test.js`; the
  subcortex suite's header comment and "no subcortex structure is hemisphere/bilateral gated" sweep are
  updated to no longer reference subthalamic.
- `docs/artifacts/anatomy-model.html` — move the STN row from the subcortex block to a new basal-ganglia
  block (artifact sync per CLAUDE.md).

STN joins the level but is **excluded from the bilateral composer** — a contralateral hemiballismus is
the clinical syndrome; bilateral ballism is not a classic picture, so only nigra/striatum/pallidum get
bilateral sites.

## Sites & laterality

Two site families per new nucleus, both from existing machinery — no solver change:

- **Focal / structural (contralateral hemi-syndrome).** `basal_ganglia` is added to the `LEVELS` list
  and its parts to `PARTS` in `sites.js`, with `TERRITORY` entries. The default `candidateSites()` build
  then emits a left site and a right site per part; each fires its finding **contralaterally** — giving
  hemiparkinsonism / hemichorea / hemidystonia (the stroke / structural picture, e.g. a lacune or
  non-ketotic hyperglycaemia).
- **Bilateral / degenerative.** A new composer **`composeBasalGangliaBilateralSites()`** (same shape as
  `composeMotorUnitSites`) makes one **bilateral** candidate site per part, id `basal_ganglia_<part>`
  with `side: "bilateral"` (the motor-unit convention — no `left_`/`right_` prefix, so it never collides
  with the focal sites). A bilateral site emits each finding on **both** body sides — i.e.
  `parkinsonism@left` **and** `parkinsonism@right` (forward.js emits `@left`+`@right` for a bilateral
  site, never a `@bilateral` token) — the common clinical picture (bilateral substantia nigra, bilateral
  striatum). Registered in `inverse.candidateSites()` alongside the other composers. The composer covers
  `substantia_nigra` / `striatum` / `globus_pallidus` only — **`subthalamic` is excluded** (bilateral
  ballism is not a classic syndrome; STN stays focal/contralateral).

**Athetosis** is *not* a separate finding — it localises to the same striatum as chorea, so it would add
no discrimination. It is noted as "choreoathetosis" in the striatum phonebook entry.

## Scoring (`score.js`)

- Add `parkinsonism`, `chorea`, `dystonia` to **`LOCALISING`** (3× weight). Each pins a specific
  nucleus, exactly as `hemiballismus` and `tremor_rubral` already do.
- `rigidity` is **non-localising** (weight 1), matching its tone-axis siblings `spasticity` and
  `hypotonia`. It confirms the extrapyramidal axis and enriches the parkinsonian cluster, but the nucleus
  is pinned by the accompanying `parkinsonism`.

## Emergent naming (`syndromes.js` — phonebook, no logic)

Descriptions keyed by `basal_ganglia_<part>` and attached *after* localisation. The focal (left/right)
site and the bilateral composite site share the same key, so nigra and striatum use the existing
**variant** mechanism (`{ dominant, nondominant, bilateral }`) that `nameForSite` already resolves by
side — the unilateral sides give the *hemi-* syndrome, the bilateral side gives the disease:

| Key | side left/right (focal) | side bilateral (composite) |
|---|---|---|
| `basal_ganglia_substantia_nigra` | Hemiparkinsonism (structural — contralateral midbrain/nigral lesion) | Parkinsonism — PD, drug-induced, vascular, Parkinson-plus (MSA/PSP/CBD) |
| `basal_ganglia_striatum` | Hemichorea / choreoathetosis (structural — NKH, striatal lacune) | Chorea — Huntington's, Sydenham's, chorea gravidarum, drug-induced |
| `basal_ganglia_globus_pallidus` | Dystonia (focal) | Dystonia (generalised) — genetic, Wilson's, drug-induced |
| `basal_ganglia_subthalamic` *(relocated)* | Hemiballismus — contralateral STN (lacune); content unchanged, key re-homed from `subcortex_subthalamic` | *(no bilateral site)* |

`globus_pallidus` may be a single (non-variant) `dystonia` entry if the focal/generalised wording is
folded into one note; nigra and striatum need the variant object.

## Tests — `test/basal-ganglia.test.js` (new; added to `npm test` chain + README)

TDD, red-first. Standalone script in the house style (`ok(label, cond)`, `process.exit`):

1. **Vocabulary:** the four findings exist; `parkinsonism`/`chorea`/`dystonia` are in `LOCALISING` and
   `CROSSES.*  === true`; `rigidity` is **not** in `LOCALISING` and sits on the tone axis with
   `spasticity`/`hypotonia`.
2. **Structures:** each `basal_ganglia` structure produces exactly its one finding at its `(level,
   part)`; substantia nigra produces both `parkinsonism` and `rigidity`.
3. **Forward (contra):** left substantia nigra → `parkinsonism@right` + `rigidity@right`; left striatum →
   `chorea@right`; left globus pallidus → `dystonia@right`.
4. **Bilateral composer:** the site `basal_ganglia_substantia_nigra` exists with `side: "bilateral"` and
   emits `parkinsonism@left` **and** `parkinsonism@right` (+ `rigidity@left`/`@right`);
   `basal_ganglia_striatum` emits `chorea@left`+`@right`. **No** `basal_ganglia_subthalamic` bilateral
   site exists (STN excluded from the composer).
5. **STN relocation:** the `stn` structure is now at `level: "basal_ganglia"`; the site
   `left_basal_ganglia_subthalamic` exists and `left_subcortex_subthalamic` does **not**;
   `hemiballismus@right` still solves to `left_basal_ganglia_subthalamic` and still names hemiballismus.
6. **Inverse emergence** (bilateral inputs use both `@left`+`@right`, per the `bilat()` test helper):
   - contralateral `parkinsonism`+`rigidity` → `left/right_basal_ganglia_substantia_nigra`, named
     hemiparkinsonism;
   - the *bilateral* version (`parkinsonism@left`+`@right`) → `basal_ganglia_substantia_nigra`, named
     Parkinsonism/PD;
   - bilateral `chorea` → `basal_ganglia_striatum`, named chorea/Huntington's;
   - unilateral `chorea` → focal striatum, named hemichorea;
   - `dystonia` → globus pallidus.
7. **No regressions:** all 17 existing suites stay green (the `subcortex` suite is updated so its
   subthalamic assertions move to this suite). The new findings must **not** leak into unrelated sites —
   `rigidity` must not attach to any corticospinal/UMN site (it is basal-ganglia-only), and the movement
   findings must not perturb the subcortex `tremor_rubral` assertion.

## What this increment does NOT do (YAGNI / deferred)

- **No new solver mechanism.** Pure data + one composer, reusing the bilateral-site and contralateral-
  crossing patterns already in place.
- **No decomposition of parkinsonism** into bradykinesia/rest-tremor/rigidity as separate localisers
  (they don't discriminate the nucleus). Rigidity is added *only* because it belongs to the orthogonal
  tone axis.
- **No disease-level pathology logic.** Eponyms live in the phonebook; a future pathology layer may add
  cross-site weighting (e.g. Parkinson-plus features, Wilson's copper signs) but that is out of scope.
- **No caudate-vs-putamen split** — one `striatum` part suffices (they share the chorea finding).

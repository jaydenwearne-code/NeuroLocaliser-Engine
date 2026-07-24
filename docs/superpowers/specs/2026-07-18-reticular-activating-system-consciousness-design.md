# Reticular activating system & reduced level of consciousness — design spec

**Date:** 2026-07-18
**Region increment:** model the anatomical sites of **reduced level of consciousness (arousal)** — the
brainstem **ARAS**, the **bilateral paramedian thalamus** (artery of Percheron), and the **diffuse
bihemispheric** correlate — plus **locked-in syndrome** as the ventral-vs-tegmental contrast (preserved
arousal). The organising principle — *arousal needs either the brainstem ARAS or both hemispheres, so a
unilateral hemispheric/thalamic lesion impairs nothing* — emerges from the existing `bilateralOnly` gate
(Anton/Balint). No new solver mechanism.
**Status:** approved design — IMPLEMENTED (all suites green, 22 suites / 963 assertions).

> **Implementation deviation (recorded):** the two paramedian-thalamus arousal structures
> (`thal_aras`, `thal_vgaze_bilat`) were placed on a dedicated composer-only level
> **`thalamus_arousal` / `paramedian`**, NOT on `subcortex` / `thalamus` as the tables below say. Putting
> `bilateralOnly` structures on the `subcortex` level tripped two subcortex-suite invariants ("no subcortex
> structure is hemisphere/bilateral gated" and the VPL structure-enumeration). The dedicated level is also
> more faithful — the intralaminar/paramedian arousal nuclei are distinct from the VPL sensory relay. The
> `thalamus_bilateral_percheron` site and `composeConsciousnessSites()` filter were updated to match, and a
> `TERRITORY["thalamus_arousal|paramedian"]` entry added. Everything else is as specified below.

## Context

"Reduced level of consciousness" is a different *kind* of finding from everything modelled so far: it is
about **arousal**, not a lateralised deficit. Its anatomy is the ascending reticular activating system
(ARAS) — paramedian tegmentum of the rostral pons/midbrain → intralaminar/paramedian thalamus → diffuse
cortex. The clinical logic the engine must reproduce:

- **Coma requires** *either* the brainstem ARAS (a single paramedian lesion suffices — it is a midline
  bilateral structure) *or* dysfunction of **both** hemispheres (bilateral thalamus, or diffuse cortex).
- A **unilateral** hemispheric or thalamic lesion does **not** impair arousal (content vs arousal).
- **Locked-in** is the mirror image: a **ventral** pontine (basis pontis) lesion abolishes voluntary
  movement (quadriplegia, anarthria) but **spares** the dorsal tegmental ARAS → the patient is **awake**,
  communicating by vertical eye movements / blink. Tegmentum vs basis is the discriminator.
- **Structural brainstem coma travels with brainstem signs.** The iconic motor one is **decerebrate
  (extensor) posturing**, which localises to the upper brainstem (between the red nucleus and the
  vestibular nuclei) — the same rostral tegmentum the ARAS runs through.

Nothing in the model currently represents arousal. The `bilateralOnly` mechanism (a structure that emits
*only* on a both-hemispheres site — used for Anton's cortical blindness and Balint's syndrome, see
`forward.structActiveAt`) is exactly the tool for "needs both sides".

## Design decisions (settled during brainstorming)

1. **Scope:** three coma site families (brainstem ARAS, bilateral paramedian thalamus, diffuse
   bihemispheric) **plus locked-in** as the emergent ventral-vs-tegmental contrast.
2. **Findings:** a single `reduced_consciousness` finding (arousal is not graded — drowsy/stupor/coma is a
   severity axis, out of scope); a positive locked-in hallmark `preserved_vertical_gaze`; and a positive
   **structural-brainstem-coma companion `extensor_posturing`** (decerebrate posturing).
3. **Dedicated ARAS site** (not a reuse of the `pontomesencephalic_tegmentum` upbeat-nystagmus site) —
   the arousal syndrome gets its own name and site.
4. **The ARAS site carries an honest companion (`extensor_posturing`)** so it is reachable and coherent.
   *Why this is needed:* the minimal-set solver covers each finding as parsimoniously as possible, and a
   `brainstem_aras` site emitting *only* `reduced_consciousness` would be tied (and out-competed on
   over-prediction) by the diffuse site for that finding — so brainstem company would fragment into an
   incoherent "diffuse + focal" cover and the ARAS site would never win. Decerebrate posturing is
   anatomically co-located (upper brainstem tegmentum), owned by no other site, and clinically *the*
   structural-coma motor sign — so `reduced_consciousness` + `extensor_posturing` localises cleanly to
   `brainstem_aras` as a single lesion, and — bonus — isolated `reduced_consciousness` now resolves to the
   diffuse site **strictly** (the ARAS site over-predicts posturing), matching the clinical default that
   coma without focal signs is metabolic/diffuse.

## The findings (`findings.js`)

Three new findings, all **NON_LATERALISED** (`@none`) and **LOCALISING**:

| Finding | Meaning | Home |
|---------|---------|------|
| `reduced_consciousness` | impaired arousal / reduced level of consciousness (ARAS) | the coma sites |
| `preserved_vertical_gaze` | locked-in hallmark — awake + quadriplegic + anarthric, communicating by vertical eye movements / blink-to-command | locked-in |
| `extensor_posturing` | decerebrate (extensor) posturing — structural upper-brainstem coma | brainstem ARAS |

Edits: add the three to `FINDINGS` (a new group `"Consciousness"`), to `NON_LATERALISED`, and a
`CROSSES: false` entry each (moot — NON_LATERALISED short-circuits to `@none`). Add all three to
`LOCALISING` in `score.js`.

Note: `preserved_vertical_gaze` is deliberately distinct from the Parinaud increment's `vertical_gaze_palsy`
(they are opposites — preserved vs palsy).

## Anatomical homes (`structures.js`, `sites.js`)

Four sites, all built by one composer `composeConsciousnessSites()` (registered in
`inverse.candidateSites()`).

| Site id | Side | Structures | Emits | Emergent name |
|---------|------|------------|-------|---------------|
| `cerebrum_diffuse` | bilateral | `cereb_diffuse` | `reduced_consciousness@none` | Diffuse bihemispheric / cortical dysfunction |
| `brainstem_aras` | midline | `aras_brainstem`, `aras_posturing` | `reduced_consciousness@none` + `extensor_posturing@none` | Brainstem ARAS (rostral tegmental) arousal failure |
| `thalamus_bilateral_percheron` | bilateral | `thal_aras`, `thal_vgaze_bilat` | `reduced_consciousness@none` + `vertical_gaze_palsy@none` | Bilateral paramedian thalamic (artery of Percheron) |
| `locked_in` | bilateral | `cst_pons`, `li_ocular` | `hemiparesis@left` + `hemiparesis@right` (quadriplegia) + `preserved_vertical_gaze@none` | Locked-in syndrome (ventral pontine) |

**Structures (new):**
- `aras_brainstem` — level `brainstem_aras`, part `paramedian_tegmentum` (composer-only level/part, **not**
  in `LEVELS`/`PARTS`), produces `reduced_consciousness`. Plain midline structure (a single paramedian
  lesion abolishes arousal).
- `aras_posturing` — same level/part `brainstem_aras`/`paramedian_tegmentum`, produces `extensor_posturing`.
- `thal_aras` — level `subcortex`, part `thalamus`, produces `reduced_consciousness`, **`bilateralOnly: true`**.
- `thal_vgaze_bilat` — level `subcortex`, part `thalamus`, produces `vertical_gaze_palsy`, **`bilateralOnly: true`**
  (Percheron's vertical gaze palsy from the meso-diencephalic junction; bilateral-only, so a **unilateral**
  thalamic lesion stays the pure-sensory VPL site — the content-vs-arousal point).
- `cereb_diffuse` — level `cerebrum`, part `diffuse` (composer-only level/part), produces
  `reduced_consciousness`, **`bilateralOnly: true`**.
- `li_ocular` — level `locked_in`, part `ventral_pons` (composer-only level/part), produces
  `preserved_vertical_gaze`. Composer-only, so it never forms a unilateral site.

**Composer `composeConsciousnessSites()`** (sibling of `composeBilateralCortexSites` /
`composeCentralNystagmusSites`):
```
export function composeConsciousnessSites() {
  const byLevelPart = (lvl, part) => STRUCTURES.filter(s => s.level === lvl && s.part === part).map(s => s.id);
  const thalBilat   = STRUCTURES.filter(s => s.level === "subcortex" && s.part === "thalamus" && s.bilateralOnly).map(s => s.id);
  const sites = [];
  const diffuse = byLevelPart("cerebrum", "diffuse");
  if (diffuse.length) sites.push({ id: "cerebrum_diffuse", side: "bilateral", level: "cerebrum", part: "diffuse",
    territory: TERRITORY["cerebrum|diffuse"], structures: diffuse, composite: true });
  const aras = byLevelPart("brainstem_aras", "paramedian_tegmentum");
  if (aras.length) sites.push({ id: "brainstem_aras", side: "midline", level: "brainstem_aras", part: "paramedian_tegmentum",
    territory: TERRITORY["brainstem_aras|paramedian_tegmentum"], structures: aras, composite: true });
  if (thalBilat.length) sites.push({ id: "thalamus_bilateral_percheron", side: "bilateral", level: "subcortex", part: "thalamus",
    territory: TERRITORY["subcortex|thalamus"], structures: thalBilat, composite: true });
  const li = byLevelPart("locked_in", "ventral_pons");
  if (li.length) sites.push({ id: "locked_in", side: "bilateral", level: "locked_in", part: "ventral_pons",
    territory: TERRITORY["locked_in|ventral_pons"], structures: ["cst_pons", ...li], composite: true });
  return sites;
}
```
`TERRITORY` entries added for `cerebrum|diffuse`, `brainstem_aras|paramedian_tegmentum`,
`locked_in|ventral_pons` (the `subcortex|thalamus` territory already exists, reused for the Percheron
composite).

**Why `bilateralOnly` is essential, not decorative:** `subcortex|thalamus` **does** form unilateral
left/right sites (VPL sensory, via `buildSites`). Without `bilateralOnly`, `thal_aras` would make a
*unilateral* thalamic lesion emit `reduced_consciousness` — clinically wrong. `structActiveAt` skips a
`bilateralOnly` structure unless `site.side === "bilateral"`, so `reduced_consciousness`/`vertical_gaze_palsy`
emit only on the Percheron composite. The unilateral thalamus stays pure sensory (regression: the subcortex
suite must be unchanged).

## Scoring (`score.js`)

`LOCALISING`: **add** `reduced_consciousness`, `preserved_vertical_gaze`, `extensor_posturing`.

## Emergent behaviour (what the tests assert)

1. **Isolated `reduced_consciousness@none`** → **`cerebrum_diffuse`** strictly (the conventional safe
   default): the ARAS site over-predicts `extensor_posturing` (score 2.5) and the Percheron site
   over-predicts `vertical_gaze_palsy` (2.5), so the diffuse site (score 3, nothing over-predicted) wins.
   Clinically: coma with no other signs is metabolic/diffuse until proven otherwise.
2. **`reduced_consciousness@none` + `extensor_posturing@none`** → **`brainstem_aras`** (single site,
   explains both — the coherent structural brainstem coma).
3. **`reduced_consciousness@none` + `vertical_gaze_palsy@none`** → **`thalamus_bilateral_percheron`**
   (single site, explains both; beats the tectal `dorsal_midbrain_tectum`, which cannot explain the
   arousal loss, and the diffuse/ARAS sites, which cannot explain the vertical gaze). The textbook
   coma + vertical-gaze-palsy pairing.
4. **`hemiparesis@left` + `hemiparesis@right` + `preserved_vertical_gaze@none`** → **`locked_in`**
   (single site; uniquely explains the preserved-gaze hallmark with bilateral pyramidal weakness).
5. **Regression — the content-vs-arousal gate:** a **unilateral** thalamic input
   (`dorsal_sensory@right` + `spinothalamic@right` ± `thalamic_pain@right`) still → the unilateral VPL
   thalamus site and emits **no** `reduced_consciousness` (the subcortex suite is unchanged).
6. **Forward — locked-in spares arousal:** `expectedFindings(locked_in)` contains
   `preserved_vertical_gaze@none` and does **not** contain `reduced_consciousness@none`; `brainstem_aras`
   emits `reduced_consciousness@none` + `extensor_posturing@none`; `thalamus_bilateral_percheron` emits
   `reduced_consciousness@none` + `vertical_gaze_palsy@none`.

## Emergent naming (`syndromes.js` — phonebook)

Keyed by exact site id (all four ids are unique):

| Key | Named | note / ddx / red |
|-----|-------|------------------|
| `cerebrum_diffuse` | Diffuse bihemispheric / cortical dysfunction (encephalopathy) | note: impaired arousal from bilateral/diffuse cortical dysfunction — no focal signs. ddx: metabolic (hypoglycaemia, hepatic/uraemic, Na/Ca), hypoxic-ischaemic, drug/toxin, sepsis, non-convulsive status, bilateral cortical stroke. red: "Coma with no focal signs and intact brainstem reflexes is metabolic/diffuse until proven otherwise — check glucose, Na, and a gas immediately." |
| `brainstem_aras` | Brainstem ARAS (rostral tegmental) arousal failure | note: a paramedian upper-pons/midbrain tegmental lesion knocks out the ascending reticular activating system; decerebrate (extensor) posturing and brainstem signs accompany it. ddx: top-of-basilar / midbrain infarct, pontine haemorrhage, central herniation, demyelination. red: "Impaired arousal with brainstem signs (extensor posturing, asymmetric/fixed pupils, gaze palsy) → posterior-circulation emergency, image the vessels." |
| `thalamus_bilateral_percheron` | Bilateral paramedian thalamic syndrome (artery of Percheron) | note: one artery (Percheron) supplies both paramedian thalami ± rostral midbrain → the triad of impaired arousal + vertical gaze palsy + memory/confusion. ddx: artery of Percheron infarct, deep cerebral venous thrombosis, top-of-basilar. red: "Sudden coma + vertical gaze palsy with a near-normal early scan → suspect a Percheron infarct or deep venous thrombosis; get vascular imaging." |
| `locked_in` | Locked-in syndrome (ventral pontine) | note: a bilateral basis pontis lesion → quadriplegia + anarthria with **preserved consciousness**; the dorsal tegmental ARAS is spared, so the patient is awake and communicates by vertical eye movements / blink. ddx: basilar (ventral pontine) infarct, central pontine myelinolysis, pontine haemorrhage. red: "Do not mistake locked-in for coma or a vegetative state — establish a vertical-eye-movement / blink communication channel; the patient is fully aware." |

## Tests

**New `test/consciousness.test.js`** (added to `npm test` in `package.json` + the README list),
TDD red-first: (1) vocabulary — the three findings exist, are NON_LATERALISED, are LOCALISING; (2) sites
exist via `composeConsciousnessSites()`; (3) forward emissions per the table (incl. locked-in has
`preserved_vertical_gaze@none`, not `reduced_consciousness@none`; brainstem_aras has both its findings;
Percheron has both its findings; the `bilateralOnly` thalamus structures do **not** emit on the unilateral
thalamus site); (4) the six emergent behaviours above.

**Regression watch (explicit):** all prior suites green — especially **subcortex** (the unilateral VPL
thalamus is unchanged: the two `bilateralOnly` structures never emit there) and **parinaud/nystagmus**
(the `pontomesencephalic_tegmentum` site is untouched — the ARAS is a *separate* `brainstem_aras` site).
`vertical_gaze_palsy` now has a second producer (the Percheron composite) — verify the isolated-vertical-
gaze Parinaud assertion still resolves to `dorsal_midbrain_tectum` (Percheron over-predicts
`reduced_consciousness`, so an isolated `vertical_gaze_palsy` still prefers the tectal site). `hemiparesis`
now appears on a new bilateral `locked_in` site — verify no existing bilateral-hemiparesis input (e.g. cord
transverse) is pulled to it (locked_in additionally predicts `preserved_vertical_gaze`, which those inputs
lack, so it over-predicts and loses). If any assertion shifts, surface it — don't silently patch.

## What this increment does NOT do (YAGNI / deferred)

- **No graded arousal / GCS** — drowsy/stupor/coma is a severity axis orthogonal to localisation.
- **No decorticate (flexor) posturing** — only decerebrate/extensor is modelled, as the upper-brainstem
  companion; the flexor/diencephalic level is deferred (would need a second posturing finding + level).
- **No brainstem reflex battery** (pupillary light, corneal, oculocephalic, gag) — the
  metabolic-vs-structural bedside discriminators; deferred (would need a "preserved reflexes" concept).
- **No herniation / mass-effect coma mechanism** — uncal/central herniation compressing the midbrain is a
  *pathology/secondary* process (belongs to the future pathology layer), not a primary site here.
- **No vegetative / minimally-conscious / brain-death states** — out of scope for a localiser.
- **No corticobulbar/anarthria structure for locked-in** — quadriplegia (bilateral CST) + the
  `preserved_vertical_gaze` hallmark are enough to make locked-in emerge and be named; anarthria is
  carried in the finding description and the phonebook note, not a separate finding.

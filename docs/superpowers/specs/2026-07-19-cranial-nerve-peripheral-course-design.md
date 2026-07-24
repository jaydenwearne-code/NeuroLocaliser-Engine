# Cranial-nerve peripheral course — longitudinal segment localisation design spec

**Date:** 2026-07-19
**Region increment:** the *longitudinal* axis of the extra-axial cranial nerves — sites **along a single
nerve's course** (facial branch points, trigeminal divisions, III divisions, VI petrous apex, recurrent
laryngeal, spinal accessory in the neck), differentiated by which **branch is spared**.
**Status:** approved design, ready for implementation planning

## Context

The engine derives syndromes from anatomy (golden rule: no syndrome is an `if` rule; `syndromes.js` is a
phonebook keyed by emergent site). Built and green (1171 assertions, 30 suites): the full neuraxis
including the skull-base cranial nerves.

The **2026-07-12 skull-base increment** modelled the cranial nerves by **foramen** — the compartment as a
site, where nerves threading the same canal fail together (cavernous sinus = III+IV+VI+V1+V2+Horner;
jugular foramen = IX+X+XI). It explicitly **deferred** (its "Out of scope"): *"the internal auditory
meatus vs CPA distinction … and V3 / foramen ovale"* and individual named branches distal to the foramina.
This increment picks those up and generalises them into a single mechanism.

The foramen axis answers *"which nerves fail together?"* This increment adds the orthogonal
**longitudinal axis**: *"where along one nerve's course is the lesion?"* — the classic bedside exercise of
localising a facial palsy to the internal acoustic meatus vs the middle ear vs the parotid by which of
lacrimation / hyperacusis / taste are spared. It is the **direct cranial analogue of the
`nerve-segments` increment** for limb nerves (radial: axilla ⊃ spiral groove ⊃ PIN), and reuses that
mechanism exactly.

## The mechanism — no new solver code

Two design decisions were settled with the user:

**1. Segments primary, foramina emerge.** Each skull-base primitive becomes a **(nerve, compartment)**
pair — one nerve, at one point on its course, producing that nerve's finding(s) there. There are then two
kinds of candidate site, both built from these primitives:

- **Longitudinal (single-nerve) sites** — each (nerve, compartment) primitive is a candidate site in its
  own right. A proximal segment produces *more* findings than a distal one, so when a branch is spared the
  proximal site **over-predicts** and is penalised, and the distal site wins **by parsimony**. This is the
  `nerve-segments` mechanism verbatim: **no nesting composer, no new forward-model path** — the segment
  parts simply restate their own finding sets and the existing over-prediction penalty does the
  localising.
- **Compartment (multi-nerve) sites** — a composer groups the primitives sharing a compartment and unions
  them, so the cavernous-sinus / Vernet / Gradenigo / acoustic pictures **emerge** rather than being
  hand-listed. This generalises the existing `composeSkullBaseSites` (which already unioned primitives for
  the SOF) from *union-of-parts* to *union-by-compartment-tag*.

**2. Full anatomical fidelity where the branch pattern localises.** The facial nerve is modelled to its
full six-level chain; III is split into superior/inferior divisions; XI is split into SCM vs trapezius.

Everything remains **ipsilateral** (`CROSSES: false`), lateralised, single-sided emission. As with the
original skull-base increment, **there is no new crossing rule, no gate, no `describeLevel` branch** — the
increment is pure data plus a generalised composer.

## The headline claims (what the tests must prove)

1. **A spared branch localises the level, and it emerges from parsimony.** Facial motor **+ taste, with
   lacrimation and hyperacusis intact** localises to the **mastoid** segment (distal to the stapedial
   branch, proximal to where chorda tympani leaves) — not because a rule says so, but because the
   geniculate/tympanic sites over-predict the intact branches. Add hyperacusis → tympanic; add lacrimation
   → geniculate; drop taste too → stylomastoid (pure-motor Bell's); reduce to a single branch → parotid.
   This is `nerve-segments` (radial axilla ⊃ spiral groove ⊃ PIN) applied to CN VII.
2. **The same primitives yield the foramen syndromes by union.** The **cavernous sinus** is the union of
   the cavernous-compartment primitives of III, IV, VI, V1, V2 and the oculosympathetic — so **V2 cheek
   numbness still separates cavernous from SOF**, now because V2's cavernous primitive is/ isn't in the
   union. **Gradenigo** (VI + V1 + ear, petrous apex) and the **acoustic** picture (VII + VIII at the IAM)
   emerge the same way. The two axes cooperate: the **IAM composite** captures a proximal facial palsy
   *with* hearing loss (VIII co-involved), while the VII longitudinal chain captures the intratemporal
   course by branch sparing.
3. **Isolated-distal vs grouped-proximal for the lower nerves.** Hoarseness with the **palate spared** →
   **recurrent laryngeal** (distal X), whereas hoarseness **+ palatal droop** → high vagus, and adding the
   IX gag-afferent/taste loss + XI → **jugular foramen (Vernet)**. An absent gag with an **intact palate**
   localises to **IX** (afferent limb); palatal droop with intact taste/sensation localises to **X**
   (efferent). Trapezius weakness with SCM **spared** → **posterior triangle of the neck**, whereas SCM +
   trapezius **with** IX/X → jugular foramen.

## Findings vocabulary (`src/model/findings.js`)

New findings, group `"Cranial nerve"`, all `CROSSES: false`, none `NON_LATERALISED`. Branch
discriminators are `LOCALISING` (each pins a level on a nerve's course).

| finding | branch / meaning | nerve | localising |
|---|---|---|---|
| `lacrimation_loss` | reduced tearing — greater petrosal n. (geniculate) | VII | yes |
| `hyperacusis` | loudness intolerance — nerve to stapedius | VII | yes |
| `taste_loss` | loss of taste, anterior ⅔ tongue — chorda tympani | VII | yes |
| `facial_weak_branch` | partial hemiface, single branch (extracranial/parotid) | VII | yes |
| `v3_sensory` | jaw/chin sensory loss — mandibular division (foramen ovale) | V | yes |
| `gag_afferent_loss` | absent gag (afferent limb) + pharyngeal sensory loss — glossopharyngeal | IX | yes |
| `taste_posterior` | loss of taste, posterior ⅓ tongue — glossopharyngeal | IX | yes |
| `palatal_weakness` | palatal droop / uvular deviation, nasal regurgitation (gag efferent) — vagal pharyngeal branches | X | yes |
| `vocal_cord_palsy` | hoarseness / vocal-cord paresis — recurrent (or high vagal) laryngeal | X | yes |
| `cn3_superior_div` | ptosis + failed elevation — superior division (SR + LPS) | III | yes |
| `cn3_inferior_div` | failed adduction/depression + pupil — inferior division (MR/IR/IO + parasymp.) | III | yes |
| `weak_scm` | sternocleidomastoid weakness (head turn) | XI | yes |
| `weak_trapezius` | trapezius weakness / shoulder droop | XI | yes |

**Retirements / changes:**
- `cn11_weakness` is **replaced** by `weak_scm` + `weak_trapezius` (so the posterior-triangle lesion,
  trapezius-only, localises distal to the jugular lesion). Update `findings.js`, `score.js` LOCALISING,
  `structures.js`, `syndromes.js`, and the `cranial-nerves` suite.
- `cn3_palsy` (whole III) is retained for the **proximal** III segments (subarachnoid, cavernous) where a
  complete III palsy with the pupil rule already localises; the two divisional findings are used only at
  the **orbital** segments. A proximal (cavernous/SOF) III site produces `cn3_palsy`; an orbital superior-
  or inferior-division site produces the divisional finding. (No attempt to make `cn3_palsy` a superset of
  the divisional tokens — they are distinct observations the clinician records; over-prediction still
  keeps a divisional picture off the proximal sites, which additionally carry IV/VI/V company there.)

**`cn_bulbar` is retained but no longer used at the jugular foramen.** The skull-base jugular sites now
carry the granular IX/X findings above, so a lesion can affect IX (gag afferent + posterior taste) or X
(palate + cords) independently. `cn_bulbar` remains the *diffuse* bulbar-palsy token for the **motor-unit**
contexts where IX and X fail together and are not separately localisable (anterior horn / progressive
bulbar palsy `ah_bulbar`, NMJ `mg_bulbar`) — those structures are unchanged.

Reused unchanged: `cn7_lmn`, `cn12_palsy`, `v1_sensory`, `v2_sensory`, `hearing_loss`, `jaw_weakness`,
`optic_neuropathy`, `rapd`, `horner`, `cn8_vertigo`, `limb_ataxia`.

## The per-nerve course map

Each row is a **(nerve, compartment)** primitive part under the `skull_base` level; `compartment` is a tag
used by the composer. Findings listed are what that primitive produces (all ipsilateral). Proximal → distal
top to bottom within a nerve. "⊃" notes in the notes column mark where a branch leaves (so distal spares it).

### VII — facial (the flagship, six-level chain)

| part | compartment | produces | note |
|---|---|---|---|
| `iam` (shared VII+VIII part) | `iam` | cn7_lmn, lacrimation_loss, hyperacusis, taste_loss, **hearing_loss** | meatal VII + cochlear VIII together; nested subset of `cpa` |
| `vii_geniculate` | `geniculate` | cn7_lmn, lacrimation_loss, hyperacusis, taste_loss | geniculate ganglion (Ramsay Hunt) |
| `vii_tympanic` | `tympanic` | cn7_lmn, hyperacusis, taste_loss | distal to greater petrosal ⊃ lacrimation SPARED |
| `vii_mastoid` | `mastoid` | cn7_lmn, taste_loss | distal to n. to stapedius ⊃ hyperacusis SPARED |
| `vii_stylomastoid` | `stylomastoid` | cn7_lmn | distal to chorda ⊃ taste SPARED (Bell's palsy site) |
| `vii_parotid` | `parotid` | facial_weak_branch | single branch, partial hemiface |

**Meatal vs geniculate — modelled by the shared IAM compartment.** The pre-geniculate (meatal /
labyrinthine) segment and the geniculate produce the *same* VII findings — the greater petrosal has not yet
left, so lacrimation is affected at both. They are therefore **indistinguishable on facial signs alone**;
the *only* discriminator is VIII (hearing loss), because VII and VIII share the internal acoustic meatus. So
the meatal level is modelled **not** as a redundant VII-only site but as a shared-compartment primitive
part `iam` that holds *both* the VII contribution (motor + full branch triad) **and** VIII (`hearing_loss`)
— exactly as the existing `cpa` part holds VII+VIII+V+ataxia together. The `iam` part is a **nested subset
of `cpa`** (no corneal, no ataxia), which yields the IAM-vs-CPA distinction the original spec deferred: a
VII palsy **+ hearing loss** with nothing else → `iam` (early acoustic); add corneal (V) ± ataxia → `cpa`
(large CPA mass); VII branch triad with **intact hearing** → `vii_geniculate` (`iam` would over-predict
hearing). No tie, no special casing — the shared compartment *is* the meatal level. The five intratemporal
VII segments (geniculate → parotid) are VII-only primitives; that chain localises purely by branch sparing.

**Isolated-nerve non-localisation is honest, not a bug.** Where several segments of one nerve produce the
identical finding (IV along cisternal/cavernous/SOF; VI along cisternal/petrous/cavernous/SOF; IX vs X both
`cn_bulbar` at the jugular), they tie on that nerve's signs alone — correctly, because an isolated IV / VI
/ bulbar palsy *is* non-localising along its course. The compartment company (the composite) is what
localises, exactly as the original skull-base spec's "isolated cn6 is honestly non-localising" claim.

### V — trigeminal (root → ganglion → three divisions)

| part | compartment | produces | note |
|---|---|---|---|
| `cpa` (shared) | `cpa` | v1_sensory (corneal) | root at the CPA (existing `cpa_v1`) |
| `v_ganglion` | `meckel` | v1_sensory, v2_sensory, v3_sensory, jaw_weakness | Meckel's cave / Gasserian ganglion — all three divisions |
| `v1_division` | `sof` | v1_sensory | ophthalmic; contributes to the SOF composite |
| `v2_rotundum` | `rotundum` | v2_sensory | maxillary, foramen rotundum |
| `v3_ovale` | `ovale` | v3_sensory, jaw_weakness | mandibular, foramen ovale — the only motor division |
| `v1_petrous` | `petrous_apex` | v1_sensory | V1 at the petrous apex (Meckel) — the Gradenigo trigeminal contribution |

### III — oculomotor (subarachnoid → cavernous → SOF → divisions)

| part | compartment | produces | note |
|---|---|---|---|
| `iii_subarachnoid_comp` | `subarachnoid` | cn3_palsy, pupil (compressive) | PCOM aneurysm / uncal — surface parasympathetic hit (already modelled) |
| `iii_subarachnoid_isch` | `subarachnoid` | cn3_palsy (pupil-sparing) | microvascular — core hit, surface spared (already modelled) |
| `iii_trunk` | `sof`+`cavernous` | cn3_palsy | pre-divisional trunk; in both SOF and cavernous composites — company (V2, Horner, other CNs) localises |
| `iii_orbit_sup` | `orbit_sup` | cn3_superior_div | ptosis + elevation fail |
| `iii_orbit_inf` | `orbit_inf` | cn3_inferior_div | adduction/depression fail + pupil (ptosis spared) |

The existing `iii_uncal` / `iii_microvascular` structures (pupillary-efferent increment) are the
subarachnoid segment; this increment leaves their pupil mechanism untouched and only ensures they read as
the proximal end of the III chain.

### IV — trochlear

| part | compartment | produces | note |
|---|---|---|---|
| `iv_nuclear` | (brainstem) | cn4_palsy (contralateral) | dorsal midbrain — already modelled, decussates |
| `trochlear_cisternal` | `cisternal` | cn4_palsy | long cisternal course (existing `cn4_nerve`) |
| `iv_trunk` | `sof`+`cavernous` | cn4_palsy | anterior trunk; in both SOF and cavernous composites |

### VI — abducens (adds the petrous apex)

| part | compartment | produces | note |
|---|---|---|---|
| `vi_cisternal` | `cisternal` | cn6_palsy | subarachnoid course |
| `vi_petrous_apex` | `petrous_apex` | cn6_palsy | Dorello's canal — with V1 ⇒ Gradenigo via composer |
| `vi_trunk` | `sof`+`cavernous` | cn6_palsy | anterior trunk; in both SOF and cavernous composites |

(The abducens **nucleus** — horizontal gaze palsy + ipsilateral VII loop — stays a brainstem structure;
this chain is the infranuclear course only.)

### VIII — vestibulocochlear

| part | compartment | produces | note |
|---|---|---|---|
| `viii_meatal` | `iam` | hearing_loss | cochlear, IAM — with VII ⇒ acoustic picture via composer |

(A `viii_labyrinth` end-organ site and the vestibular limb are left as the existing brainstem/vestibular
`cn8_vertigo`; extending the peripheral vestibular apparatus is out of scope, see below.)

### IX / X — glossopharyngeal / vagus (afferent vs efferent gag; X's own distal chain)

| part | compartment | produces | note |
|---|---|---|---|
| `ix_jugular` | `jugular` | gag_afferent_loss, taste_posterior | glossopharyngeal — pharyngeal sensation (gag afferent) + posterior ⅓ taste |
| `x_jugular` | `jugular` | palatal_weakness, vocal_cord_palsy | high vagus — palate/uvula (gag efferent) **and** larynx |
| `x_recurrent_laryngeal` | `rln` | vocal_cord_palsy | distal — hoarseness with palate SPARED (thyroid/aortic/Pancoast) |

**The gag reflex splits IX from X.** Gag is **afferent IX** (`gag_afferent_loss`) → **efferent X**
(`palatal_weakness`). So a pure IX lesion gives an absent gag with an *intact* palate (nothing wrong with
the efferent limb), plus loss of posterior-⅓ taste; a pure X lesion gives palatal droop / uvular deviation
away from the lesion and hoarseness with taste and pharyngeal sensation intact. **X has its own
longitudinal chain:** `x_jugular` (palate **+** cords) ⊃ `x_recurrent_laryngeal` (cords only — palatal
sparing localises the lesion distal to the pharyngeal branches). This is the same nested-superset parsimony
as the VII chain, now on the vagus.

### XI — accessory (jugular vs posterior triangle)

| part | compartment | produces | note |
|---|---|---|---|
| `xi_jugular` | `jugular` | weak_scm, weak_trapezius | with IX/X ⇒ Vernet via composer |
| `xi_posterior_triangle` | `neck_pt` | weak_trapezius | distal to SCM branch ⊃ SCM SPARED (e.g. lymph-node biopsy) |

### XII — hypoglossal (canal vs neck)

| part | compartment | produces | note |
|---|---|---|---|
| `xii_canal` | `hypoglossal` | cn12_palsy | hypoglossal canal — with IX/X/XI ⇒ Collet-Sicard via composer |
| `xii_neck` | `neck_submand` | cn12_palsy | extracranial neck (carotid/submandibular) — isolated |

### II — optic (unchanged)

`opt_cn2` (`optic_neuropathy`) + `opt_rapd` (`rapd`) at the `optic_canal` compartment stay as they are; the
full visual pathway is its own (already-built) region.

### Sympathetic (unchanged)

The oculosympathetic in the SOF/cavernous (`sof_symp`) and the carotid-space Horner (`car_symp`) stay; the
three-order Horner axis is its own region.

## Compartment composites (`composeSkullBaseSites`, extended)

The composer keeps its **explicit part-group** shape (a `groups` list of `{ compositePart, parts:[…] }`,
unioning the structures of the listed primitive parts) — the proven mechanism, just extended with the new
groups. Some compartments are *primitive* multi-nerve parts (built by `buildSites`, no composite needed);
others are composites-of-per-nerve-parts:

- **`iam`** (primitive part) → VII (motor + branch triad) + VIII (hearing) — **internal acoustic meatus /
  early acoustic**; nested subset of the **`cpa`** primitive part (adds V corneal + ataxia).
- **`sof`** composite = `iii_trunk` + `iv_trunk` + `vi_trunk` + `v1_division` + `sof_symp` — **superior
  orbital fissure**.
- **`cavernous_sinus`** composite = SOF parts ∪ `v2_rotundum` — **cavernous sinus** (V2 = the SOF-vs-
  cavernous key; the exact original union, re-keyed).
- **`orbital_apex`** composite = SOF parts ∪ `optic_canal` — **orbital apex (Jacod)**.
- **`petrous_apex`** composite = `vi_petrous_apex` + `v1_petrous` — **Gradenigo** (VI + V1).
- **`jugular_foramen`** composite = `ix_jugular` + `x_jugular` + `xi_jugular` — **Vernet** (IX gag-afferent
  + posterior taste, X palate + cords, XI SCM + trapezius).
- **`collet_sicard`** composite = jugular parts ∪ `xii_canal` — **Collet-Sicard** (adds XII).
- **`villaret`** composite = jugular parts ∪ `xii_canal` ∪ `carotid_space` — **Villaret** (adds Horner).

The per-nerve longitudinal primitives are **also** candidate sites (built by `buildSites`, concatenated in
`candidateSites()`), so a lone VI at the petrous apex, a lone III inferior division, or a lone V3 localises
on its own without needing the multi-nerve company.

## Architecture — modules touched

- `src/model/findings.js` — 13 new findings + `CROSSES:false`; remove `cn11_weakness`.
- `src/model/structures.js` — re-key skull-base structures to (nerve, compartment) primitives with a
  `compartment` tag; add the VII chain, V divisions (V3/ovale), III divisions, VI petrous apex, X RLN, XI
  split, XII neck, VIII meatal. One structure = one nerve = one finding; no `crosses`, no gate.
- `src/model/sites.js` — extend `PARTS`/`TERRITORY` with the new primitive parts; generalise
  `composeSkullBaseSites` to group-by-`compartment`; keep it concatenated in `candidateSites()`.
- `src/engine/forward.js` — **no change** (all ipsilateral, single-sided).
- `src/engine/score.js` — add the branch-discriminator findings to `LOCALISING`; drop `cn11_weakness`,
  add `weak_scm`/`weak_trapezius`.
- `src/engine/inverse.js` — **no change** beyond the composer already being concatenated.
- `src/data/syndromes.js` — phonebook entries keyed by emergent site: the six VII levels (Ramsay Hunt at
  geniculate, Bell's at stylomastoid), Gradenigo (petrous apex), acoustic (IAM), recurrent-laryngeal
  palsy, posterior-triangle XI, plus the retained cavernous/SOF/orbital-apex/Vernet/Collet-Sicard/
  Villaret entries re-pointed at the new site ids.
- `test/cranial-nerves.test.js` — extend (or split a `cranial-nerve-course` suite) with the assertions
  below; register in `package.json`, `README.md`, `CONTRIBUTING.md`.
- `docs/artifacts/architecture.html`, `docs/artifacts/anatomy-model.html` — sync the new region.

## Testing (TDD, red first)

1. **Vocabulary** — the 13 new findings exist, `CROSSES:false`, not `NON_LATERALISED`; the branch
   discriminators are `LOCALISING`; `cn11_weakness` is gone and has no producers.
2. **Structures** — each (nerve, compartment) primitive produces exactly its listed findings; no
   `crosses`/gate on any skull-base structure; every new part appears in `PARTS`/`TERRITORY`.
3. **VII chain (the flagship)** — the localisation cases walk the chain:
   - motor+lacrimation+hyperacusis+taste **+ hearing loss** → the `iam` composite (acoustic); assert no
     standalone `vii_meatal` site competes and the geniculate does not win here.
   - motor+lacrimation+hyperacusis+taste, **hearing intact** → `geniculate` (Ramsay Hunt), unambiguously
     (no meatal primitive to tie with).
   - motor+hyperacusis+taste, lacrimation intact → `tympanic`.
   - motor+taste, hyperacusis intact → `mastoid`.
   - motor only → `stylomastoid` (Bell's).
   - single-branch partial hemiface → `parotid`.
   Each asserts the more-proximal sites do **not** win (over-prediction), and the phonebook names Ramsay
   Hunt / Bell's where applicable.
4. **V divisions** — isolated V3 (jaw + chin sensory) → `v3_ovale`; all three divisions + jaw →
   `v_ganglion` (Meckel); V1-only → `v1_sof`, V2-only → `v2_rotundum`.
5. **III divisions** — superior-division picture → `iii_orbit_sup`; inferior-division (+pupil) →
   `iii_orbit_inf`; complete III with IV/VI/V1 company → cavernous composite.
6. **VI petrous apex** — VI + V1 + ear → Gradenigo (petrous_apex composite); isolated VI at the apex →
   `vi_petrous_apex` primitive.
7. **Lower-nerve distal vs grouped, incl. the IX/X split** —
   - hoarseness with **palate spared** → `x_recurrent_laryngeal`; hoarseness **+ palatal droop** →
     `x_jugular` (over `x_recurrent_laryngeal`, which under-predicts the palate).
   - absent gag + posterior-taste loss with **intact palate** → `ix_jugular` (IX only; assert `x_jugular`
     does not win — it would over-predict palate + cords).
   - palatal droop + hoarseness with **intact** taste/pharyngeal sensation → `x_jugular` (X only; assert
     IX not implicated).
   - full IX + X + XI picture → jugular (Vernet) composite.
   - Trapezius-only → `xi_posterior_triangle`; SCM + trapezius + IX/X → jugular. Isolated tongue →
     `xii_neck`/`xii_canal`; with IX/X/XI → Collet-Sicard.
8. **Foramen composites still emerge** — cavernous (has V2), orbital apex (has optic), Vernet,
   Collet-Sicard, Villaret, acoustic (IAM: VII+VIII) — the union sites build and name correctly.
9. **Laterality mirror** — a right-sided VII chain case mirrors correctly.
10. **Regression** — all prior suites stay green (only the `cranial-nerves` suite changes, because only it
    references the re-keyed skull-base part/structure ids).

## Out of scope (deferred, do not forget)

- **Peripheral vestibular apparatus** (labyrinth, semicircular canals, BPPV/Menière/vestibular neuronitis)
  — the peripheral end of VIII beyond `hearing_loss`; belongs with a dedicated vestibular increment.
- **IX/X fine autonomic detail** — the IX↔X gag afferent/efferent split, posterior-⅓ taste, palate, and
  cords are now **in scope** (above). Still deferred: glossopharyngeal neuralgia, carotid-sinus / baro-
  reflex afferents, stylopharyngeus, the parasympathetic secretomotor limbs (parotid via IX otic ganglion;
  thoracoabdominal vagus) — autonomic/visceral findings for a later layer.
- **Proptosis / chemosis / CCF haemodynamics** — the congestive/mechanical pathology layer (already
  deferred by the original skull-base spec).
- **Cause weighting** (schwannoma vs perineural spread vs basal meningitis vs GBS/Miller-Fisher) — the
  future multifocal/pathology layer, not anatomy.

## Verification

`PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test` — the extended cranial-nerve suite
green and all prior suites still green. Then sync and eyeball the two Artifacts (verify statically; the
in-app browser cannot render file://, localhost, or claude.ai — ask the user to view).

Not a medical device; not for clinical use. Anatomy tables still need neuroanatomist review.

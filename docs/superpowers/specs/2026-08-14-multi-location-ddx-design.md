# Multi-location DDx: what one disease explains two lesions

**Date:** 2026-08-14
**Status:** design, approved — awaiting implementation plan
**Closes:** parked follow-up #1 in `CLAUDE.md` ("Multi-location DDx synthesis")
**Builds on:** `2026-08-11-differential-depth-design.md` (the curated cause layer this merges across sites)

## The problem

The engine already decides that a picture needs more than one lesion. `minimalSet()` returns the covering
sites and `app.js` renders them as a single line:

```
⚠ Likely multifocal. Minimal cover — 2 sites: left lateral medulla + right L5 root.
```

And then every other card describes **one** of them. Why, What and Next are all keyed to `S.selected`. So
the app states that one lesion cannot explain the findings, and immediately offers a differential for one
lesion. The question a clinician asks next — *what single disease hits both of these places?* — is the one
question the app cannot answer.

Three specific gaps:

1. **No unifying diagnosis.** MND, MS, metastases, vasculitis and sarcoid are the reason two lesions
   appear together. None of them can be expressed in the current model, because `CAUSES` is keyed per site
   and MND is not a cause *at* the anterior horn — it is a process spanning the anterior horn and the
   corticospinal tract.
2. **No merged view.** The 1286 curated cause entries and 201 curated workups are never read across sites,
   so a cause plausible at both sites gets no more weight than one plausible at neither.
3. **No way to test a different pair.** `minimalSet()` is greedy and tie-broken; it returns one cover. A
   clinician who thinks the pair is different has no way to ask.

### Measured baseline

Run against `CAUSES` on 2026-08-14 (`main` @ `a9c2774`):

| Metric | Value |
|---|---|
| Distinct cause names | 856 |
| Names appearing at ≥2 site keys | 147 |
| `Demyelination` (builder-consistent) | 31 keys |
| `Vasculitic mononeuritis multiplex` | 25 keys |
| `Spinal epidural abscess` | 21 keys |
| Distinct **MS** name variants | ≥8 (`Demyelination`, `Demyelination (MS)`, `Multiple sclerosis`, …) |
| Distinct **metastasis** name variants | ~12, mostly ×1, inside compound names |

**This measurement changed the design.** Naive name intersection was the original plan and it does not
work: a `Demyelination` at the optic nerve and a `Multiple sclerosis` at the cord would not intersect, so
the merge would miss the flagship case. Family-builder causes (`sbSpine`/`nvSpine`/`rtSpine`) match
perfectly because they are generated from one template; only hand-authored entities fragment. The design
below canonicalises the fragmented ones and lets exact matching carry the rest.

## The principle

**Multifocality is a claim that must be earned, and the app's first job is to try to talk you out of it.**
Parsimony is the whole discipline of localisation. A cross-site card that leads with a list of multifocal
diseases teaches the opposite of what a neurologist does at the bedside. So the card leads with the
finding that forces the second lesion and invites the clinician to re-check it; the disease list comes
second, framed conditionally.

## Design

### 0. What triggers a combined view (unchanged)

The trigger stays exactly what `solve()` already computes — no single site covers every **localising**
finding, and `minimalSet()` needs more than one site. This is deliberate. It was verified (below) that
soft, murky findings cannot reach this path.

### 1. `src/model/compartments.js` — a new anatomical axis

`regionOf()` in `causes.js` splits sites five ways but lumps brain and cord together as `parenchyma`, and
brain-plus-cord is precisely the dissemination MS must demonstrate. A declarative level→compartment table:

```
brain · brainstem · cord · cauda · optic · skull_base · root · plexus · nerve · motor_unit
```

with `compartmentOf(site)` over it. All 36 levels map; nothing falls through (asserted).

`INTRACRANIAL_LEVELS` in `inverse.js` is a second, overlapping definition of "inside the skull". It is
derived from the new table so there is one source of truth. The fundus suite guards the change.

### 2. `src/data/multifocal.js` — the entity roster (content)

Declarative objects via an `mf()` constructor mirroring `c()` in `causes.js`. This file holds **content and
no logic**, so it can be clinically reviewed on its own — the same split that made the causes layer
reviewable.

```js
mf("Motor neurone disease (ALS)", "degenerative", {
  spread:   { minSites: 2 },
  motor:    "mixed",                    // delegates to umnLmnPattern()
  forbids:  ["sensory"],                // no sensory involvement — the discriminator
  course:   ["progressive"],
  tempo:    ["subacute", "chronic"],
  likelihood: "common",                 // the existing LIKELIHOOD tiers: common · uncommon · rare
  matches:  /motor neurone|motor neuron|\bALS\b/i,
  red:      "Progressive bulbar or respiratory involvement — assess FVC early",
  feature:  "Painless, progressive, asymmetric; wasting and fasciculation in a limb with a brisk reflex in the same limb",
  confirm:  "Fasciculation in ≥2 regions with preserved sensation on formal testing",
})
```

Three kinds of clause, deliberately few:

| Clause | Meaning |
|---|---|
| `spread` | Generic dissemination in space: `minSites`, `distinctCompartments`. Carries MS, mets, embolic shower without enumerating site combinations. |
| `sites: [clause…]` | Specific places required, each clause matched by a **distinct** site (`{compartment:"skull_base"}`, `{level:"cord"}`, `{region:"peripheral"}`). Sarcoid's cranial-nerve-plus-something is this shape. |
| `motor` / `forbids` | Constraints over the observed **findings**, not the sites. `motor:"mixed"` delegates to the existing `umnLmnPattern()`, so the new layer and the old flag can never disagree. |

`forbids` names **finding classes**, not individual finding ids — `"sensory"` resolves through a small
declarative class map in `multifocal.js` (`sensory`, `cortical`, `visual`, `bulbar`), so a roster entry
cannot silently stop working when a new sensory finding is added to the vocabulary. The map is asserted
complete against `findings.js`.

Predicates are over **anatomical attributes, never site ids** — 201 sites makes id combinations
combinatorial and stale the moment a site is added. Same "derive, don't store" rule as the rest of the
engine.

**Roster scope: ~13 entities.** MND/ALS, MS, metastases, vasculitis, sarcoidosis, mononeuritis multiplex,
leptomeningeal disease, NMOSD, CNS lymphoma, neurofibromatosis, paraneoplastic, HIV/syphilis, embolic
shower from a cardiac source.

### 3. `src/engine/multifocal.js` — the reasoning (no content)

`unifyingDiagnoses(sites, { onset, course })`.

**Hard constraints filter.** `spread`, `sites`, `motor` and `forbids` are anatomical facts — if they do not
fit, the entity does not apply.

**Tempo and course only demote, never drop.** Each surviving entity carries
`demotions: [{ axis, entered, expected }]` and the result comes back in two bands:

- **concordant** — no demotions, shown open
- **discordant** — ≥1 soft mismatch, collapsed behind a `<details>` labelled by the axis that missed
  ("Less likely given the course (3)")

Within each band, order by `likelihood` (`common · uncommon · rare`, the existing tiers), then by number of
satisfied clauses. Each discordant entry states **what would have to be true**: *"MND fits the anatomy, but
you entered a relapsing–remitting course; MND does not relapse and remit."* The mismatch teaches rather
than hides — the same shape as the why-not-elsewhere panel.

Every returned entity carries its own derivation, `why: [{ clause, satisfiedBy: <site> }]`, so the card
shows *"disseminated in space — left optic nerve and cervical cord"*, never a bare disease name.

### 4. `forcingFindings(observedSet, opts)` — the parsimony guard

For each **localising** finding, test whether removing it collapses the picture to a single site. The ones
that do are named in the card:

> This is multifocal only because of **left palatal weakness**. If that sign is uncertain, re-check it —
> without it, a single left lateral medullary lesion explains everything.

When no single finding forces it, that is the stronger statement and the card says so: *"several findings
independently require a second site."*

This never auto-relaxes a localising sign. `nearFit()` deliberately refuses to
(`inverse.js`, "a LOCALISING sign is never relaxed away"); this hands the judgement to the clinician
instead, which is that rule's intent.

### 5. `src/model/course.js` — the course axis

`COURSES` vocabulary + labels: *single event · simultaneous · stepwise · relapsing–remitting · steadily
progressive*. An orthogonal axis in the shape of `levels.js` and `raisedPressureAxis` — it demotes entries
in the **cross-site roster**, and **never changes which sites are candidates**.

**Course applies to the roster only, not to `causesFor()`.** The 1286 per-site cause entries carry `tempo`
and no `course` field, and adding one to all of them is out of scope here. Passing a course into
`causesFor()` would therefore be a silent no-op, so it is not passed at all — `causesFor()` keeps its
`{ onset }` signature.

Course is the strongest discriminator in this roster and tempo is the weakest: vasculitis is stepwise, MS
relapsing–remitting, MND progressive, embolic shower simultaneous. Without it, MS, mets and MND all present
as "≥2 CNS sites, subacute" and the card cannot justify its ordering.

### 6. Merged causes and workup

**`combinedCauses(sites, { onset })`** in `causes.js`, canonicalising in two passes:

1. **Roster regex.** Each entity's `matches` pattern canonicalises any cause it matches to that entity id.
   One table does double duty — it names the cross-site entity *and* supplies the canonical keys for the
   intersection, so there is no second alias map to drift. Same keyword-table shape as `PATHOGNOMONIC` and
   the phonebook `categorise()`.
2. **Exact name.** Everything else falls back to verbatim match, which already works for the 147 repeated
   names the family builders produce.

Returns `{ shared, perSite }`. `shared` = causes plausible at **≥2** of the sites (not all — requiring all
would hide a disease explaining most of the picture), each carrying which sites it came from, the count
("at 2 of 3 sites") and the strongest `red` among them. `perSite` = the remainder, so nothing is hidden.

**`combinedNextSteps(sites)`** in `nextSteps.js` unions the four tiers with exact-string dedupe, takes the
**most urgent** urgency across the set (never an average — a cord site plus a nerve site is a cord-urgency
workup), and unions referrals.

### 7. Tempo demotion extended to `causesFor()` (separate, earlier commit)

`causesFor()` currently hard-filters:

```js
const filtered = (onset ? list.filter(x => x.tempo.includes(onset)) : list.slice())
```

That contradicts the demote-not-drop rule above, and would put two contradictory rules on one screen. It is
changed to demote, with the existing empty-tempo teaching message ("a lesion here does not typically present
with chronic onset — the mismatch between tempo and site is itself informative") becoming the **heading of
the demoted section** rather than a replacement for content.

**This lands as its own commit, ahead of the new layer, so it is independently revertible** if the What card
does not read well.

### 8. The app

**Course control.** One `<select>` beside the existing Onset control, identical shape. New `S.course`, new
case-URL key `c=`, validated against `COURSES` on decode and dropped silently if hand-edited — the same
contract as `o=`. Passed to `unifyingDiagnoses()` only — never to `solve()` (course does not localise) and
never to `causesFor()` (see §5).

**Pinning.** Where rows stay single-select — clicking the row body still drives Why/What/Next, so nothing
existing changes. A separate pin toggle at the row's right edge, outside the click target, writes to
`S.pinned` (a `Set` of site ids), serialised as `p=`. Resolution order for what the combined view describes:

| Condition | Source | Label |
|---|---|---|
| `S.pinned.size >= 2` | the pinned set | **your selection** |
| else `r.multi` | the engine's cover | **minimal cover** |
| else | — | no combined view |

The label is required: the user must always know whether they are looking at their hypothesis or the
engine's.

**The Together card**, placed after Where and before Why — Where is about candidate sites, Why/What/Next are
about one site, so the cross-site view belongs at the boundary. Contents, parsimony first:

1. the forcing-finding guard (§4)
2. the sites, each with the localising findings it and only it contributes
3. unifying diagnoses — concordant open, discordant collapsed and labelled by axis

**Merged causes and workup do not go in this card.** The existing What and Next cards gain a scope toggle —
`This site | All 2 sites` — so `combinedCauses()` and `combinedNextSteps()` render through the presentation
those cards already own. One place for causes, one for workup; no third rendering of the category dots to
drift out of sync.

**Error handling** uses what exists: the results pane is already inside the error boundary, so a malformed
entity or an empty pinned set degrades to the friendly panel with the case attached. `unifyingDiagnoses()`
returning `[]` is a normal state, not an error — the card shows the guard and the sites and says no
catalogued cross-site process fits, which is itself informative.

### 9. `LOCALISING` audit (owner-directed, 2026-08-14)

**The rule:** a finding should be `LOCALISING` if it genuinely has a localising site.

`LOCALISING` in `score.js` is a hand-curated set of 178 findings, and it gates everything above — the cover
in `minimalSet()`, `coversAllLocalising()`, and what `nearFit()` refuses to relax. A finding missing from it
can never force a second lesion.

**Measured across the whole vocabulary** (233 findings), counting distinct levels that produce each:
**19 findings sit outside `LOCALISING` despite being confined to a single level.**

| Group | Findings |
|---|---|
| Likely genuine omissions | `retinal_pallor`, `optic_atrophy` (both from the 2026-08-11 fundoscopy increment), `fasciculations` (1 site), `cortical_sensory_hand`, `cortical_sensory_arm`, `cortical_sensory_leg`, `weak_hand`, `weak_scapular_stabilisation`, `lid_retraction`, `verbal_memory_impairment`, `nonverbal_memory_impairment`, `rigidity`, `disinhibition`, `executive_dysfunction`, `palmomental`, `hallucinations`, `mood_change`, `proximal_weakness`, `distal_motor_weakness` |
| Deliberately excluded, reasons already in the comments | `lmn_weakness` (a general LMN sign — explicitly demoted in the PNS increment), `naming_impaired` (present in every aphasia) |

**A derived rule alone will not work, and the data says so.** `limb_ataxia` spans **7** levels and 24 sites;
`forehead_spared` spans 6 — both correctly localising, because they pin a *system* rather than a level. A
"few levels ⇒ localising" rule would demote them and would promote the two deliberate exclusions.

**So the design is derived candidates + a curated, reasoned set:**

1. The 19 are audited against the owner's clinical judgement; the genuine ones are promoted.
2. A new `NOT_LOCALISING_BY_DESIGN` map in `score.js` records each deliberate exclusion **with its reason**,
   replacing prose comments that a future edit can miss.
3. **An invariant:** every finding confined to a single level must be either in `LOCALISING` or in
   `NOT_LOCALISING_BY_DESIGN`. Nothing may fall through silently — which is how the fundoscopy findings
   appear to have been missed when they were added.

**This changes localisation behaviour and lands as its own commit**, before the multifocal layer, with the
full suite as the guard: promoting a finding raises its match weight from 1 to 3 and lets it force a second
lesion, so ranking assertions across the existing suites are the regression net. Any that break get re-pinned
to their real intent, per the Region B precedent.

## Does this over-call multifocal disease on murky findings?

Asked during design; **tested rather than reasoned about**, on a Wallenberg case (`left_medulla_lateral`).

The cover in `minimalSet()` runs **only over `LOCALISING` findings** (178 of the vocabulary). Everything
soft and effort-dependent — tone, wasting, Babinski, give-way weakness — is outside that set and can never
force a second lesion.

| Input | Result |
|---|---|
| Clean Wallenberg | single lesion, no multi |
| Crossed sensory on the **wrong side** | single lesion + near-fit naming the flipped sign |
| **Two** spurious signs added | still single lesion |
| Sparse murky input (`weak_arm@left` + `distal_sensory_loss@right`) | **no multi**, near-fit instead |
| Genuine two lesions (Wallenberg + right L5 root) | multi fires correctly |
| Wallenberg **+ Broca's aphasia** (`speech_nonfluent@none`, `repetition_impaired@none`) | multi fires correctly — `left_medulla_lateral + left_cortex_operculum` |

The murky-exam case lands on the **near-fit** line, not the multifocal banner. **The one real over-call path
is a *localising* sign entered on the wrong side or over-called** — `nearFit()` refuses to relax a localising
sign, so there is no safety net there, and laterality is where this engine's bugs live. §4 exists for exactly
that path, and the probes above are pinned as a regression set (§Testing).

**A retracted claim, kept here because the correction matters.** An earlier draft of this spec reported an
under-call: that Wallenberg plus Broca's aphasia was reported as one lesion. **That was wrong.** The probe
used `aphasia_broca@left`, which is not in the vocabulary (aphasia is decomposed into `speech_nonfluent` /
`comprehension_impaired` / `repetition_impaired` / `naming_impaired`), and then used `@left` when those
findings are emitted `@none`. Given correct tokens the engine behaves correctly, as the table shows. The
lesson generalises: **probes must be built from `expectedFindings()` of a real site, never from hand-typed
tokens** — an unmodelled token is silently non-localising and will fake either failure mode.

The audit that claim provoked did, however, find real gaps — §9.

## Testing

New suite `test/multifocal.test.js` in the house style (standalone script, local `ok()`), added to the
`package.json` chain and the README.

**Roster invariants**, modelled on `causes-depth.test.js` so the content cannot rot:

- every entity has ≥1 hard clause, a `course`, a `feature`, and a `category` declared in `CATEGORIES`
- **no entity can be satisfied by a single site** — the structural anti-over-call guard
- every entity carrying `matches` actually matches causes at ≥2 site keys, or it can never surface through
  the intersection and the regex has silently died

**Emergence tests** (assert behaviour, not implementation):

- MND fires on a UMN-site + LMN-site pair, and **does not** fire once a sensory finding is added
- MS fires on optic + cord; mononeuritis multiplex on two named nerves
- **demotion, not dropping**: an entity whose course mismatches still appears — assert the *total count is
  unchanged* and only the band moves

**A property test for the forcing-finding guard**, which is self-verifying: for every finding the card names
as forcing the second lesion, removing it **must** collapse the picture to a single site. The claim and the
test are the same statement.

**A murky-input regression set** — the six probes above pinned as cases that must not produce a combined
view. This is what stops a future loosening of the trigger from silently reintroducing over-calling.

**Existing suites that will break.** Extending demote-not-drop to `causesFor()` will break tempo assertions
in `causes.test.js` written against dropping. Per the Region B precedent these are **re-pinned to their real
intent, not weakened** — "chronic onset yields no vascular causes here" becomes "vascular causes are
demoted, with the tempo mismatch named" — and each is listed in the commit rather than quietly edited.

**In-browser verification is part of the definition of done, not a nicety.** The unit suites assert engine
output, not the app's consumption of it; that is why they missed the multifocal banner crash and the
"Progressive progressive" builder join, both of which were found by driving the UI. The Together card, both
bands, the pin toggle and the scope toggle are all verified in the running app.

## Out of scope

- **Case-conditioned likelihood** (age, risk factors, immune status) — as in the depth sweep.
- **Re-deriving `LOCALISING` from site counts.** §9 audits and curates it; it does not replace clinical
  judgement with a threshold.
- **Alternative covers** — `minimalSet()` still returns one greedy cover; manual pinning is the answer to a
  disputed pair, not an enumeration of every valid cover.
- **Changing what `solve()` localises.** Course and pins never affect candidate sites.

## Risks

| Risk | Mitigation |
|---|---|
| Over-calling multifocal disease | Trigger unchanged; forcing-finding guard leads the card; murky-input regression set |
| ~13 entities are new, unreviewed clinical content | Batch-presented for clinical sign-off before merge; the gate is offered explicitly |
| Canonicalisation misses a name variant | `matches`-coverage invariant; the fragmentation is measured, not assumed |
| Demote change touches signed-off behaviour | Its own commit, ahead of the new layer, independently revertible |
| Greedy cover returns the wrong pair | Manual pinning — the reason pinning was worth its cost |
| Card grows unreadable | Merged causes/workup stay in the What/Next cards behind a scope toggle, not duplicated into Together |
| Promoting findings to `LOCALISING` (§9) shifts existing rankings | Its own commit ahead of the layer; the full suite is the regression net; promotions need the owner's clinical call, not a threshold |
| Probes built from hand-typed tokens fake both failure modes | Every test case is built from `expectedFindings()` of a real site — the mistake that produced the retracted under-call claim |

## Success criteria

1. A genuinely multifocal case (Wallenberg + right L5 root) produces a Together card naming the sites, the
   forcing finding, and at least one plausible unifying diagnosis with its derivation shown.
2. MND emerges on a mixed UMN/LMN picture and disappears when a sensory finding is added.
3. All six murky-input probes produce **no** combined view.
4. Every finding named as forcing a second lesion provably collapses the picture when removed.
5. Mismatches demote rather than delete — tempo **and** course in the Together card, tempo in the What card
   (course does not apply per-site; §5).
6. A pinned pair survives a case-URL round trip.
7. All suites green, and the card verified in the running app.
8. Every finding confined to a single level is either `LOCALISING` or explicitly excused with a reason (§9).

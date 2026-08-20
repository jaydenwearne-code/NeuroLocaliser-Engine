# Together card — the cross-site workup

**Date:** 2026-08-21
**Status:** design agreed, not implemented
**Closes:** open item 3 of the per-pathology next-steps spec (`2026-08-18-per-pathology-next-steps-design.md`)
— *"`combinedNextSteps` / the Together card — multi-site plus per-pathology needs its own design."*

---

## 1. The problem

The multifocal view has three cards and they stop short of talking to each other.

**Together** (`unifyingDiagnoses`) names the cross-site process — Multiple sclerosis, vasculitis, MND, 13
entities in all. **What (all sites)** (`combinedCauses`) lists what the sites share. **Next (all sites)**
(`combinedNextSteps`) unions the per-site plans and takes the most urgent urgency.

Tranche 1 (2026-08-18) made the Next card narrow to a selected disease, and deliberately switched that off
in the combined view: *"whose pathology?" has no honest answer across a multifocal set.* That was right at
the time. It is no longer, because the multi-location DDx layer (2026-08-14) now **names the disease that
spans the sites** — and that name is the honest answer to "whose pathology?".

So the gap is narrow and specific: **the card that makes the cross-site claim cannot act on it.** You can
read "Multiple sclerosis" in the Together card and the Next card below it still shows you the union of an
optic-nerve workup and a cord workup — never the LP for oligoclonal bands, which is the test that settles it.

## 2. What a cross-site plan is, and why it is authored rather than derived

**Owner decision (2026-08-21): the plan is newly authored, per entity.** Three cheaper routes were
considered and rejected:

- **Resolve the entity onto an existing per-site plan** via `canonicalKey()`. Rejected: the mapping is
  genuinely ambiguous. `Primary CNS lymphoma` matches planned names including *"Butterfly glioma or
  lymphoma"* and *"Falx metastasis or lymphoma"*, whose workups are not a PCNSL workup; `Metastases`
  matches 24 planned names including *"Metastatic spinal cord compression"*, which would put a cord-
  compression workup behind the entity when neither site is cord.
- **Union the per-site plans, narrowed to the shared cause.** Honest, and free — but it answers *"what do
  these two sites share?"*, which is a different question from *"what does this one disease need?"*.
- **Cross-site plan where authored, narrowed union elsewhere.** Rejected as two voices in one card, and
  because the all-or-none gate in §5 is what keeps the Together card's rows behaving alike.

A cross-site plan is **site-independent by construction**. That is the entire point of it: MS needs MRI
brain *and* whole spine with contrast, CSF oligoclonal bands and AQP4/MOG regardless of which two places
the lesions happen to sit. Vasculitis needs ESR/CRP, ANCA, ANA and a discussion about angiography or
biopsy. No site plan will ever order these, because no site plan knows the lesions are related.

### 2.1 Where the content lives

**New module `src/data/multifocalNextSteps.js`** — content only, keyed by entity name, exporting
`multifocalPlanFor(entityName)`. It mirrors `pathologyNextSteps.js` in role and is deliberately a separate
file from both of its neighbours:

- **Not on the roster in `src/data/multifocal.js`.** That file is the *matching predicates* — substrate,
  distribution, `forbids`, `compartments`. Mixing "what makes this fire" with "what to do about it" means a
  workup review round reads past the anatomy and an anatomy round reads past the workup. This is the same
  separation tranche 2 made when it split content out into `src/data/pathology/`.
- **Not in `src/data/pathology/<category>.js`.** Those are keyed by per-site cause *name* and interpolate
  per-site slots (`{level}`, `{flavour}`, `{aetiology}`). A cross-site plan has no site to interpolate into.
  Worse, `PATHOLOGY_NEXT` would then hold two kinds of key, and the RED GATE test walks that object — it
  would silently start walking entities too.

No import cycle results: `nextSteps.js` imports `multifocalNextSteps.js`; `multifocal.js` is untouched.

### 2.2 The shape

```
mfPlan(entity, { firstLine, confirmatory, monitoring, urgency, referral })
```

Two differences from tranche 2's `dz()`:

- **It has a `firstLine` tier**, which `dz()` has none of — in tranche 1 first-line was always site-level.
  Here it is additive (§3).
- **It has no `slots` and no `bySite`.** Site-independent by construction; there is nothing to fill.

### 2.3 The trap

Four entity names are **also verbatim per-site cause names**:

| Entity | Also a per-site cause name | Has a `PATHOLOGY_NEXT` plan under that name |
|---|---|---|
| Motor neurone disease (ALS) | yes | yes |
| Multiple sclerosis | yes | no |
| Neurosarcoidosis | yes | yes |
| Neurofibromatosis type 2 | yes | yes |

Those existing plans are **site** plans. They must not be silently reused as cross-site plans. The
cross-site 13 are authored fresh, and §5 test 6 asserts they differ.

## 3. What the card composes

`combinedNextSteps(sites, entityName)` — the existing function gains an optional second argument, mirroring
`pathologyNextStepsFor`'s contract exactly: **`entityName: null` returns byte-identical output to today's
`combinedNextSteps(sites)`**. One code path, so the no-selection view cannot drift.

| Tier | No selection | Entity selected |
|---|---|---|
| Immediate / bedside | site union | site union — unchanged |
| First-line investigations | site union | site union **+** the entity's first-line, as a second labelled group |
| Confirmatory / specialist | site union | the entity plan |
| Monitoring / safety-netting | site union | the entity plan |
| Referral | joined site referrals | the entity plan's referral |

**Owner decision (2026-08-21) on the tier split.** Tranche 1's rule was that immediate and first-line stay
site-level, "performed before the cause is known, and what identify it". That rule half-survives cross-site.
Immediate stays site-level unchanged. **First-line becomes additive** rather than either replaced or frozen,
because the tests that identify a cross-site disease — LP for oligoclonal bands, AQP4/MOG, ANCA, ESR/CRP —
live in first-line, and freezing the tier means the MS plan can never order the LP. Adding rather than
replacing keeps the safety floor: an urgent MRI whole spine does not vanish because someone clicked MS.

**Rendering the additive tier: two adjacent tiers**, headed *"First-line investigations — site"* and
*"First-line investigations — Multiple sclerosis"*. This reuses the existing `ns-scope` tagging idiom
(site-level tiers are already tagged `— site` and deliberately **not** dimmed, since opacity reads as
*disabled* rather than *unaffected*) and needs no new component. The reader sees at a glance which tests
they would have ordered anyway and which the cross-site claim is buying.

### 3.1 Urgency: the site union is a floor

```
urgency = max(entity plan urgency, most-urgent-site urgency)      // max over URGENCY_RANK, not strings
```

with a further `urgent` floor when the entity carries a `red` string. Selecting MS must never de-escalate a
picture containing a cord site badged emergency.

This is not a new rule, it is two existing ones applied together: `combinedNextSteps`'s *"urgency is the
MOST urgent across the set, never an average"*, and `resolveUrgency`'s red floor, which *"may RAISE urgency
and never caps it"*.

### 3.2 No fallback state

Because §5's gate guarantees all 13 entities have a plan, there is **no cross-site equivalent of
`pathologyCurated: false`** and no *"General plan for this site — not specific to X"* label. That branch
does not exist here. It must not be added later as a convenience: it is the seam through which "some rows
behave differently from others" would return.

## 4. Selection

### 4.1 Entry point — the Together card only

**Owner decision (2026-08-21), chosen from mockups.** Only the entity rows in the Together card are
selectable. In the all-sites view the What card's shared-cause rows and per-site remainder rows are inert
(remainder rows are already effectively inert today — their selection is discarded at `app.js:768`).

Two alternatives were mocked up and rejected:

- **Together rows + shared-cause rows**, resolving to the same entity. Rejected: clicking *"Demyelination
  (MS)"* would light up *"Multiple sclerosis"* in the card above — the row you click is not the label you
  get. And whether a shared row clicks at all would depend on something invisible (does its name
  canonicalise onto an entity?), so two identical-looking rows would behave differently.
- **Shared-cause rows only**, leaving Together read-only. Rejected: the card that makes the cross-site claim
  could not act on it, and the card about site *overlap* would become where you commit to a disease. A cause
  shared by two sites is not the same claim as one disease spanning them.

### 4.2 A separate state field

**`S.selectedEntity`**, not a reuse of `S.selectedPathology`. This is forced, not stylistic: the four names
in §2.3 are both entity names and per-site cause names, so a single string field cannot express which claim
`"Neurosarcoidosis"` is making — the disease at this site, or the disease across these sites.

### 4.3 Lifecycle

The entity is a claim about a **specific set of sites**, so it clears when that set stops being the one it
was selected against.

- **Cleared** on any findings change; on pinning/unpinning; when the site set drops below 2; and **when the
  selected entity no longer appears among the Together card's rows at all**. If the picture changes so that
  MS no longer fires, the plan for MS goes with it rather than lingering behind a card that no longer
  offers it.
- **Preserved** across scope-toggle flips. "All sites" → "This site" → back does not destroy it; the site
  set never changed.

### 4.4 Two rulings that follow from all-or-none

- **Discordant entities stay selectable.** Tempo and course demote, they never drop (owner ruling,
  2026-08-14). The "less likely given the tempo" band clicks, and its caveat line stays on screen.
- **The hypothetical pinned pair stays selectable.** When a single lesion already explains everything and a
  second has been pinned anyway, the Together card already prints that banner directly above the rows.
  Suppressing selection there would create rows that look clickable but are not.

### 4.5 Case URL

New parameter **`ux=`**, validated on decode against `MULTIFOCAL` names exactly as `px=` is validated
against `CAUSES` names — a hand-edited token naming no real entity is dropped, never thrown on.

**`ux` implies scope `all` on decode**, because the parameter has no meaning in any other scope. That is the
parameter's definition rather than inference, and it degrades safely: if the restored case has fewer than
two sites, the existing `sites.length >= 2 && S.scope === "all"` guard simply does not fire.

`px` and `ux` may both appear in one URL. They describe different scopes and both round-trip.

> **Known limitation, not fixed here.** `S.scope` does not round-trip in the case URL at all today, so a
> shared all-sites view already lands in "This site". That is pre-existing. `ux` implying scope is what
> keeps *this* feature's links honest without widening the change.

## 5. Tests

New suite `test/multifocal-next-steps.test.js`:

1. **HARD GATE — every `MULTIFOCAL` entity has a plan.** All 13 or none. Load-bearing for §4.1: a Together
   card where some rows click and some do not is the rejected mockup arriving through the back door. A
   future entity added to the roster with no workup behind it fails the suite immediately — the same shape
   as the RED GATE.
2. **No two entity plans are identical** — the `family()` invariant reapplied, so 13 plans cannot collapse
   into one bland one.
3. **`combinedNextSteps(sites, null)` is byte-identical to today's `combinedNextSteps(sites)`** across a
   sweep of site pairs, captured as a baseline before the change — the technique that proved the tranche-2
   content split lossless.
4. **The urgency floor never de-escalates** — for every (pair, entity), the resulting urgency is at least
   the most-urgent-site urgency.
5. **First-line is a superset** of the site union's first-line.
6. **The colliding names of §2.3 produce a different plan cross-site than per-site.** Asserted over the
   three that actually have a per-site plan under the same name — MND, Neurosarcoidosis, NF2. *Multiple
   sclerosis* is excluded because it has no `PATHOLOGY_NEXT` entry under that exact spelling (its
   per-site plan is authored as "Demyelination"), so there is nothing to differ from.
7. **Every plan has at least one first-line and one confirmatory item, and a non-null urgency and
   referral.**

In `test/case-url.test.js`: `ux=` round-trips; an unknown `ux` token is dropped; `ux` sets scope to `all`.

**All 67 existing suites stay green untouched.** That is the real proof, as it was for the content split.

## 6. Clinical review

The 13 cross-site plans are new clinical content and are held to the bar set on 2026-08-11 and 2026-08-18:
**reviewed by the owner one round at a time, not in one batch at the end** — the rhythm that caught errors a
batch review would have missed. The module carries its own review-status header, as each
`src/data/pathology/` file does. **No specific figures** (thresholds, doses, cut-offs) in the content.

Until that sign-off the module header records the content as unreviewed.

## 7. Out of scope

- **The remaining 494 non-red per-site causes.** Unchanged by this work; see the tranche-2 spec.
- **Making `S.scope` round-trip in the case URL** (§4.5).
- **`hasFieldDefect()` keying on predicted rather than observed findings.** Unrelated and benign; recorded
  in `CLAUDE.md`.

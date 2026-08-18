# Per-pathology next steps: select a cause, get its workup

**Date:** 2026-08-18
**Status:** designed — not yet implemented
**Scope:** new `src/data/pathologyNextSteps.js`, small API change in `src/data/nextSteps.js`, `app/` selection state
**Closes:** the Next steps card being a union over every cause at a site

## The problem

The Next steps card is keyed by **site**. `nextStepsFor(site)` returns one plan covering every pathology
that could produce a lesion there, so the card is a union — clinically useful while the cause is still
unknown, but wrong the moment it is known, which is usually straight after the immediate steps.

The presenting symptom was traced on 2026-08-18: **entering leg weakness surfaces "FUNDAL PHOTOGRAPHY and
OCT of the retinal nerve fibre layer."** It is not triggered by the leg weakness at all. `ophthalmicImaging()`
takes the *site* and fires when either the site's `expectedFindings` contain a visual token or its curated
causes mention raised pressure. For `weak_leg@left`, 4 of the 16 candidate sites fire it:

| Site | Route | Verdict |
|---|---|---|
| `cortex/motor_leg`, `cortex/aca` | cause list holds **superior sagittal sinus thrombosis** | correct, but it is a *pathology's* step wearing a site's clothes |
| `subcortex/anterior_choroidal`, `cortex/mca` | site *predicts* a hemianopia the patient does not have | wrong on two counts |

The union is the root cause. A card that speaks for ten diseases at once must either say everything (noise)
or say only what they share (blandness).

## What changes

**Selecting a cause in the What card re-renders the lower half of the Next card for that pathology.**

### 1. The tier split

The tiers divide by *when you know the cause*, which is the clinical reality — the immediate steps are what
**get** you the cause, so they cannot depend on it.

| Tier | Keyed by | Rationale |
|---|---|---|
| Immediate / bedside | **site** | performed before the cause is known |
| First-line investigations | **site** | these are what identify the cause |
| Confirmatory / specialist | **pathology** | only meaningful once you have a candidate |
| Monitoring / safety-netting | **pathology** | what you watch for depends on the disease |
| Urgency, referral | **pathology**, site as fallback | see §3 |

With nothing selected the card is byte-identical to today's.

### 2. Coverage and the honest fallback

`CAUSES` holds **1286 entries across 202 sites, but 856 distinct pathology names — 709 of which appear at
exactly one site.** Full curation is therefore ~4× the authoring that the 202 site workups took.

Every cause stays selectable. Where no plan is authored, the confirmatory and monitoring tiers fall back to
the site plan **under an explicit label**:

> *General plan for this site — not specific to `<pathology>`.*

This is the same honesty as the deleted generic sieve filler demanded, without the arbitrary affordance of
making only some rows clickable. The label doubles as the authoring backlog, visible in the live app.

**A derived-generic pathology plan is forbidden.** Where there is nothing authored to say, the fallback is
the site plan, explicitly labelled as such — never manufactured content. This is the same ruling that
deleted `completion`/`sieveGenerics` engine-wide on 2026-08-11.

### 3. Urgency and referral

Both become pathology-level, resolved in this order:

1. **Curated pathology value**, where authored.
2. Otherwise the **site** value.
3. Underneath both, a **floor derived from `red: true`** — an uncurated must-not-miss can never render as
   *routine*.

This matters more than it sounds. **377 sites carry at least one red cause; at 76 of them the site badge
reads _routine_.** The sharpest case is BPPV: `peripheral_vestibular_posterior_canal` badges *routine* while
its own cause list names *Posterior circulation stroke* as the must-not-miss. Under this design, selecting
that cause flips the badge to *emergency*.

**A curated pathology urgency may sit below the site's** (owner ruling, 2026-08-18) — selecting a chronic
degenerative cause at an emergency-badged site may legitimately read *routine*. Specificity is the point of
the feature, and a tool that can only escalate reads as crying wolf. But descent is only ever an **authored**
act; the `red` floor is mechanical and cannot be overridden, per the standing rule that *a mechanical
invariant is a FLOOR, not a ceiling*.

### 4. Where the content lives

**`src/data/pathologyNextSteps.js`** — a new module, not an extension of `nextSteps.js`, which is already
~2,340 lines and would otherwise become the largest file in the repo. The split is clean: `nextSteps.js`
answers *what do I do about a lesion here*, the new module answers *what do I do about this disease*.

Keyed by **pathology name, with per-site interpolation** — the `sbSpine` / `nvSpine` / `rtSpine` / `rootNS`
idiom, applied a fifth time. One `dz()` spine per disease carries what is true of it everywhere; `bySite`
fills the slots that differ:

```js
const dz = (name, { confirmatory, monitoring, urgency, referral, bySite = {} }) => …

export const PATHOLOGY_NEXT = {
  "Demyelination": dz("Demyelination", {
    confirmatory: ["MRI {level} with contrast — {flavour}", "CSF oligoclonal bands…"],
    monitoring:   [...],
    urgency: "urgent",
    referral: "Neurology / MS service",
    bySite: {
      cord_lateral: { level: "whole cord and brain",
        flavour: "a short-segment, dorsolateral, <2-vertebral-body plaque — a LONG lesion suggests NMOSD" },
      subcortex_optic_radiation: { level: "brain",
        flavour: "a periventricular ovoid lesion perpendicular to the callosum (Dawson's finger)" },
    },
  }),
};
```

Keying by name alone would make *Demyelination* read identically at the optic nerve and the conus, which
under-teaches. Keying by `(site, pathology)` would give 1286 plans and let the 147 shared names drift out of
sync — the exact failure `rootNS` exists to prevent.

### 5. The API

```js
pathologyNextStepsFor(site, causeName) → {
  immediate, investigations,     // site-level, untouched
  confirmatory, monitoring,      // pathology-level where curated, else site-level
  urgency, referral,
  pathology: causeName | null,
  pathologyCurated: boolean,     // false ⇒ render the fallback label
}
```

Called with `causeName: null` it returns what `nextStepsFor(site)` returns today, so the Next card has one
code path and nothing regresses.

### 6. The interaction

Cause rows in the What card become selectable. The selected row takes the terracotta marker — this is a
legitimate `--terra` use under the standing colour rule, because the selected pathology *is* the answer the
card is now about. The Next card gains a dismissible chip naming the selection, and a visible
**"Plan for: …"** line so the control is named rather than discovered.

Site-level tiers are **not dimmed** — opacity reads as *disabled* rather than *unaffected*. They carry a
small `— site` tag instead, reusing the tagging device already in the card headers.

Selection is persisted in the case URL. `app/case-url.js` already carries `s` (selected site) and `p`
(pinned); the selected pathology adds `px`, so a shared case reproduces the pathology view. Like every
other case token it is validated on decode and dropped if unknown, never thrown on.

## Scope

**In**, for the shipping project: the mechanism above, plus authored plans for the **top 25 reused
pathologies** — 271 of 1286 rows (21%).

Those 25 are chosen by reuse, which front-loads coverage (one plan for *Demyelination* lights up 31 rows),
and they also happen to span every failure mode the shape must survive:

| Pathology | Sites | Stresses |
|---|---|---|
| Demyelination | 31 | heavy per-site interpolation |
| Vasculitic mononeuritis multiplex | 25 | one disease crossing many named nerves |
| Basal meningitis (TB / carcinomatous / fungal) | 22 | a compartment disease, not a site disease |
| Spinal epidural abscess | 21 | red cause at sites currently badged *routine* |
| Glioma / metastasis | 16 | a name meaning different things at different levels |
| Nerve sheath tumour (schwannoma / neurofibroma) | 14 | |
| Intracerebral haemorrhage | 12 | |

Coverage curve, for planning later tranches:

| Names authored | Rows covered |
|---|---|
| 25 | 271 / 1286 (21%) |
| 50 | 369 (29%) |
| 100 | 483 (38%) |
| 147 (every reused name) | 577 (45%) |

After 147 the curve flattens — the remaining 709 names are used once each.

**Out of scope**, each its own future project:

- **The remaining 831 pathologies.** Tranche 2+, in the A–H region rhythm used for the causes-depth sweep,
  each with its own clinical sign-off. Note that much of this is *redistribution* rather than new writing:
  curated site `investigations` prose is often already pathology-specific and merely lives in the wrong
  bucket for want of somewhere better.
- **The fundal-photography defect.** This design dissolves the raised-pressure half (it becomes a pathology
  step), but the other half stands and needs its own fix: `VISUAL_FINDING` does not respect the chiasm.
  22 sites fire on a retro-chiasmal token alone — 4 defensibly (`optic_tract`, `lgn`, which are pre-/at-
  geniculate, so band atrophy and RNFL thinning are real and gradeable), 2 borderline
  (`anterior_choroidal`, which supplies the tract and part of the LGN), and 16 wrongly: post-geniculate
  sites where the discs are normal and OCT adds nothing. It also keys on *predicted* rather than
  *observed* findings.
- **`combinedNextSteps` / the Together card.** Multi-site plus per-pathology raises "whose pathology?" and
  does not belong in this change. Selection is simply unavailable in combined view.

## Tests

`test/pathology-next-steps.test.js`, in the style of the existing invariant suites:

1. Every `PATHOLOGY_NEXT` key matches a real cause name in `CAUSES` — no orphan plans, no typo'd name that
   silently never fires.
2. No two sites emit an identical plan for a shared pathology name (the `sbSpine` no-two-identical-lists
   rule, which is what forces `bySite` to earn its place).
3. Every `red` cause resolves to at least *urgent*, curated or not — covering all 76 currently-routine sites.
4. A curated pathology urgency below the site's is honoured (the authored-descent ruling), while no `red`
   cause is ever downgraded.
5. `pathologyCurated` is false exactly when the name is absent from `PATHOLOGY_NEXT`.
6. `pathologyNextStepsFor(site, null)` is deep-equal to `nextStepsFor(site)`.
7. Case-URL round-trip preserves the selected pathology; an unknown pathology token is dropped, not thrown on.

## Acceptance

- Selecting *Posterior circulation stroke* at a BPPV site flips the badge *routine* → *emergency* and shows
  the HINTS-driven plan.
- Selecting *Lumbar spondylosis* at the L5 root shows the site fallback under its explicit label.
- With nothing selected, every card is unchanged from today.

## Rollout

Branch, TDD, PR, clinical review of the 25 authored plans, merge to `main`, auto-deploy to Pages — the same
path as the last three projects. The mechanism can merge with 25 plans authored and the labelled fallback
doing honest work everywhere else; that is precisely what choosing the labelled fallback buys.

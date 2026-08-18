# Pathology tranche 2: a workup for every must-not-miss

**Date:** 2026-08-18
**Status:** designed — not yet implemented
**Scope:** `src/data/pathologyNextSteps.js` split into `src/data/pathology/`, a new `family()` builder, and 337 authored plans
**Follows:** `2026-08-18-per-pathology-next-steps-design.md` (tranche 1: 24 plans, 21% of rows, merged and live)

## The decision that shapes this: author by DANGER, not by coverage

Tranche 1 got 21% of rows from 24 plans because reuse did the work — one *Demyelination* plan lit up 31
sites. **That strategy is exhausted.** Of the 831 remaining pathology names, **709 appear at exactly one
site** and only one has six or more hosts:

| | Tranche 1 | "finish the coverage" |
|---|---|---|
| Plans to author | 24 | 831 |
| Rows covered | 267 | 1019 |
| **Rows per plan** | **11.1** | **1.2** |

Roughly **35× the authoring for 4× the coverage**. Completeness is the wrong goal at that price.

**So tranche 2 targets the 337 causes flagged `red: true` — the must-not-miss set — and stops there.**
These are, by construction, the pathologies where a specific workup changes what happens to a patient. The
other 494 keep the labelled site fallback introduced in tranche 1, which is honest and already correct.

Two supporting measurements:

- **49% of existing site-level investigation lines already name one of that site's own causes.** Text like
  *"If abscess is suspected: blood cultures BEFORE antibiotics"* is pathology content sitting in a site
  bucket. About half this work is redistribution, not new writing.
- **337 red names span 431 rows.** 173 fall into head-noun families; 164 are singletons.

## Mechanism

### 1. Split the content by sieve category

`pathologyNextSteps.js` is 882 lines for 24 plans — 37 lines each. At +337 that is **~13,000 lines in one
file**, four times `causes.js` and no longer reviewable, which defeats the purpose of isolating content in
its own module.

```
src/data/pathologyNextSteps.js   builders (dz, family) + PATHOLOGY_ALIAS + pathologyPlanFor() + assembly
src/data/pathology/vascular.js         one file per CATEGORIES entry
src/data/pathology/neoplastic.js
src/data/pathology/infective.js
src/data/pathology/inflammatory.js
src/data/pathology/metabolic.js
src/data/pathology/traumatic.js
src/data/pathology/iatrogenic.js
src/data/pathology/degenerative.js
src/data/pathology/congenital.js
src/data/pathology/mimic.js
```

Each lands at roughly 600–1,600 lines and holds one clinical domain, so a review round opens exactly one
file. The 24 tranche-1 plans move into these files unchanged — a pure move, asserted by the existing tests
staying green.

### 2. The `family()` builder

18 head-noun families cover 173 of the red names — 28 infarcts, 24 haemorrhages, 20 metastases, 15
abscesses. The tranche-1 `dz()` spine handles ONE NAME across many sites; it has no way to serve SEVERAL
NAMES sharing a workup. Writing the stroke pathway out 28 times is exactly the drift `rootNS` was built to
prevent.

`family(spine, members)` emits several named plans from one authored spine. **A member must be able to
override a tier outright, not merely flavour it** (owner ruling, 2026-08-18) — meningioma and metastasis
share a head noun but diverge on the actual investigations:

| The member wants | It supplies |
|---|---|
| the same workup, different anatomy | `slots` — interpolates the spine's `{level}` / `{flavour}` |
| the same workup plus something | `confirmatoryExtra` / `monitoringExtra` — appended |
| **a genuinely different workup** | `confirmatory:` / `monitoring:` — **replaces** the spine's |

`urgency` and `referral` override the same way; `bySite` remains available per member, since a family
member may itself span sites.

```js
const family = (spine, members) => Object.fromEntries(
  Object.entries(members).map(([name, m]) => [name, dz(name, {
    confirmatory: m.confirmatory
      ?? [...spine.confirmatory.map(s => fill(s, m.slots)), ...(m.confirmatoryExtra ?? [])],
    monitoring: m.monitoring
      ?? [...spine.monitoring.map(s => fill(s, m.slots)), ...(m.monitoringExtra ?? [])],
    urgency:  m.urgency  ?? spine.urgency,
    referral: m.referral ?? spine.referral,
    bySite:   m.bySite   ?? {},
  })])
);
```

**`tumour` is deliberately NOT a family** despite 24 matching names. Glioma, meningioma and metastasis want
different answers; forcing one spine would either fail the no-two-identical rule or, worse, pass it while
teaching a blurred workup. Those 24 go to Phase 2 as singletons. Expect one or two of the remaining 18
clusters to dissolve the same way once written — a family is a clinical claim, not a string match.

### 3. New invariants

Added to `test/pathology-next-steps.test.js`, alongside the tranche-1 rules (which all carry over):

1. **No two members of a family may emit an identical plan.** Otherwise the family is duplication wearing a
   hat. Mirrors the no-two-identical-cause-lists rule in `causes-depth`.
2. **A family must have ≥3 members.** Two plans sharing a spine is two plans with extra indirection.
3. **THE RED RATCHET** — see below.

### 4. The red ratchet

The completion criterion is *every `red: true` cause has an authored plan*, enforced by the suite rather
than by judgement (owner ruling). But asserted as a hard gate on day one it would fail for all fourteen
rounds, so it lands as a **ratchet**:

```js
// The number of red causes with no authored plan may NEVER INCREASE. It starts at 337 and falls with
// every round; when it reaches 0 the constant becomes the hard gate and the ratchet retires.
const RED_WITHOUT_PLAN_CEILING = 337;   // lower this with each round; never raise it
```

This does three things a plain end-state assertion cannot: it prevents regression from round 1 rather than
round 14, it makes progress visible in the suite output, and it stops a future red cause being added with
no workup behind it — which is the durable value, long after tranche 2 closes.

## The authoring programme

**Phase 1 — families, biggest first.** One round is one or two complete families: you review ONE clinical
argument plus what each member changes about it, so a round is larger in output than in reading.

| Round | Families | Members |
|---|---|---|
| 1 | infarct | 28 |
| 2 | haemorrhage + haematoma | 30 |
| 3 | metastasis + carcinoma | 24 |
| 4 | abscess + encephalitis | 28 |
| 5 | dissection + thrombosis + aneurysm | 27 |
| 6 | trauma + fracture + herniation | 16 |
| 7 | vasculitis + sarcoid + myelitis + deficiency + toxicity | 20 |

**Phase 2 — singletons, by sieve category**, which is also the file boundary, so a round opens one file.

| Round | Category | Names |
|---|---|---|
| 8–9 | Neoplastic / compressive | 57 |
| 10 | Vascular | 28 |
| 11 | Metabolic / toxic / nutritional | 24 |
| 12 | Infective | 19 |
| 13 | Congenital + Inflammatory | 18 |
| 14 | Traumatic + Degenerative + Iatrogenic + Mimic | 18 |

**~14 rounds**, against 20–48 for the alternatives considered.

**Review rhythm** is the one established in tranche 1 and confirmed by the owner: draft one round, owner
reviews, next round. Not a wall of content at the end. Each round records its sign-off in the file header
of the category file it touched.

**Content standards** are unchanged and non-negotiable: teaching prompts not directives, no doses, no
definitive management, a discriminating clue rather than a generic instruction, and a safety-net line
wherever the disease deteriorates.

**How this maps onto implementation plans.** ONE plan covers the mechanism — the category-file split, the
`family()` builder, the three new invariants and the ratchet — plus **round 1 (infarct)** as the worked
proof that the builder carries a real family end to end. Rounds 2–14 are repetitions of a single task
shape (author into a category file, run the suite, lower the ratchet, commit, owner reviews) and need no
further planning; they are executed against this spec directly, exactly as tranche 1's three rounds were.
That keeps the plan to something a fresh engineer can hold in context, instead of a fourteen-part document
whose later parts are copies of its earlier ones.

## Out of scope

- **The 494 non-red pathologies.** They keep the labelled site fallback. If the red set reads well and more
  is wanted, that is tranche 3 with its own spec.
- **Per-pathology selection in the Together card.** Unchanged from tranche 1: "whose pathology?" across a
  multifocal set is a real design question and needs its own brainstorm.
- **Any change to `pathologyNextStepsFor`, the red urgency floor, or the app layer.** Tranche 2 is content
  plus two builders; the mechanism shipped and is live.

## Acceptance

- `RED_WITHOUT_PLAN_CEILING` reaches 0 and the ratchet retires into a hard gate.
- No family emits two identical member plans; no family has fewer than 3 members.
- Every tranche-1 test still passes unchanged, including `pathologyNextStepsFor(site, null)` being
  deep-equal to `nextStepsFor(site)` at all 377 sites.
- Each category file carries its own review-status header, as `pathologyNextSteps.js` does today.

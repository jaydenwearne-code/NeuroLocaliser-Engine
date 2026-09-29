# The onset follows the cause: a stroke plan stops at a slow onset (design, 2026-09-29)

**Status: APPROVED (2026-09-29).** Branch: `fix/onset-follows-cause` (off `main` at `65278f8`). Ships as v0.10.1.

This closes the first of the two items left open by the ED first-glance release (PR #13). It was recorded there
as "at chronic onset the What line can name a tumour while Next still reads the site's stroke plan — reads
oddly". Measured, it is a clinical-safety defect, not an oddity.

---

## 1. Why

Right arm weakness with brisk reflexes, onset **chronic (weeks–years)**, on `main` today:

```
What   Most likely Glioma / metastasis.
Next   Hyperacute stroke pathway — assess for thrombolysis / thrombectomy within the window.
Badge  EMERGENCY
```

The causes layer already knows the onset rules the stroke out — it sets the infarct aside and names the tumour.
The Next steps layer never asks. Its only onset rule is the hyperacute ESCALATION (accuracy round 1, A4 + B16);
nothing ever de-escalates, so a site's stroke plan is shown at every onset.

Measured over every site kind in the five stroke-window compartments (brain, brainstem, cerebellum, cord,
optic) whose leading cause is vascular:

| Onset | Onset sets the leading (infarct) cause aside | Of those, What names a non-vascular cause | Badge EMERGENCY today → after |
|---|---|---|---|
| none | 0 | — | — |
| hyperacute | 1 (the optic nerve, AION — §4) | 1 | 1 → 1 |
| acute | 0 | — | — |
| subacute | 40 | 34 | 31 → 9 |
| chronic | 42 | 40 | 32 → 3 |

Over every site, the cases where the Next line carries an unconditional hyperacute or stroke-team referral beside
a non-vascular What line: **chronic 26 → 0, subacute 23 → 1** (the retina, §4).

## 2. Rulings (owner, 2026-09-29)

1. **The Next line and the badge follow the most likely cause** — the plan of the cause the What line names.
   Chosen over: keeping the stroke plan with a warning in front of it; authoring a second, slow-onset referral
   for each site; leaving it. No new clinical text — every cause already has a signed-off plan (tranche 3's hard
   gate), so the rule only CHOOSES between authored plans.
2. **The trigger is "the onset rules out the site's infarct"**, not "the onset rules out every vascular cause".
   The literal first reading missed sites where a slow VASCULAR cause that is not a stroke (a cavernoma, a dural
   arteriovenous fistula) survives the onset: at chronic onset the occipital cortex kept "Hyperacute stroke
   pathway" beside "Most likely Glioma / metastasis", and at subacute onset seven site kinds kept a hyperacute
   stroke referral beside a non-vascular What (the lateral medulla beside MS). The site's stroke plan was written
   for its infarct; once the onset sets that infarct aside, the plan no longer applies. The What line keeps its
   must-not-miss, and every cause that still fits the onset stays selectable.
3. **The tier split is unchanged.** Immediate and first-line steps stay the site's — they are done before the
   cause is known and are what identify it. Only confirmatory, monitoring, referral and urgency follow the cause,
   exactly as they do when the clinician selects it.

## 3. The rule — `src/data/nextSteps.js`

Beside `hyperacuteVascular()`, and deliberately its mirror:

```
onsetFollows(site, onset) → { cause, setAside } | null
```

It returns a cause only when ALL hold:

- `onset` is given;
- `compartmentOf(site)` is in `STROKE_WINDOW_COMPARTMENTS` (the set the escalation already uses);
- the site's **leading cause** — the first non-mimic of `causesFor(site).all`, the definition
  `hyperacuteVascular()` already uses — is `vascular`;
- `causesFor(site, { onset }).all` no longer contains that cause (the onset set it aside);
- the What line's cause at that onset exists and has an authored plan (`pathologyPlanFor`). Measured: every
  one does; the condition exists so the rule can never fall back to the site plan while claiming to follow.

`cause` is the cause the What line names; `setAside` is the site's leading cause (for the note, §5).

**One ranking.** The What line picks its cause by a stable sort on likelihood (`whatLine()` in
`app/answer.js`). That ranking moves to `leadingCause(causes)` in `src/data/causes.js`, and both `whatLine()`
and `onsetFollows()` call it, so the What line and the Next line cannot name different causes.

### How the plan is built

`nextStepsFor(site, opts)` keeps its shape. Internally, today's body becomes `sitePlan(site, opts)` (the
escalation included), and `nextStepsFor` is `sitePlan` plus the follow:

- When `onsetFollows` returns null: exactly `sitePlan` — **no added key**. With no onset, and at acute onset,
  every site's output is identical to today.
- When it fires: `immediate` and `investigations` stay the site's; `confirmatory`, `monitoring` and `referral`
  come from the followed cause's plan; `urgency` is resolved exactly as a selection of that cause would resolve it
  (`resolveUrgency`, including the must-not-miss floor); and a `followed: { cause, setAside, onset }` key is added.

**A selection wins, and behaves exactly as today.** `pathologyNextStepsFor(site, causeName)` with a cause
builds on `sitePlan`, not on the followed plan, and never carries `followed`; `resolveUrgency` reads `sitePlan`'s
urgency. Selecting any cause gives today's result for that cause. (The What card offers only the causes that fit
the onset for selection; set-aside causes are listed but not selectable — unchanged.)

**The Together card follows automatically.** `combinedNextSteps` builds each site's plan with `nextStepsFor`,
so a two-lesion picture at a slow onset unions the followed plans. With a spanning disease selected, the
disease's plan overrides as today.

## 4. Reach, and the cases worth knowing

- **Subacute 40, chronic 42, acute 0.** No onset: 0.
- **One case fires at hyperacute: the optic nerve (AION).** The causes layer does not tag non-arteritic AION
  hyperacute, so a hyperacute onset sets it aside and the What line names perioperative ischaemic optic
  neuropathy. The Next line becomes "Emergency ophthalmology, with the surgical and anaesthetic teams"; the badge
  is EMERGENCY either way. Kept (the rule stays pure), and listed in the review table.
- **Where the What line names a mimic, Next follows the mimic** — five site kinds at chronic onset (hand knob →
  ulnar or median neuropathy; cortical sensory hand → peripheral nerve or root lesion; auditory cortex →
  cochlear deafness; thalamic VL → essential tremor; central vestibular nucleus → vestibular migraine) and three
  at subacute (medial prefrontal → depression; hand knob; temporoparietal → delirium). This is the What line's own
  signed-off ranking; the card stays consistent with it.
- **Flagged for the review round: temporoparietal cortex at subacute onset → Delirium.** The site's own stroke
  referral says "do not dismiss as delirium" — a fluent aphasia mistaken for confusion. Following the rule, the
  Next line becomes delirium's plan (acute medicine or the parent team). The immediate and first-line tiers still
  image the brain, and the vascular cause that still fits (transverse or sigmoid sinus thrombosis) stays
  selectable on the What card — but the set-aside infarct is listed under "less likely given subacute onset" and,
  as today, cannot be selected, so the site's stroke plan is not reachable at that onset. This is the case most
  likely to need a ruling.
- **Where the followed cause is itself vascular**, Next follows that plan — e.g. the leg area of the motor
  cortex at subacute onset follows superior sagittal sinus thrombosis ("Acute stroke or neurology service, with
  haematology"), still EMERGENCY.
- **The canary.** After the change, at chronic onset no site shows an unconditional hyperacute or stroke-team
  referral beside a non-vascular What line (today: 26). Referrals that are conditional by their own wording
  ("stroke team if acute", "urgent stroke pathway if HINTS is central") are correct and exempt.
- **Badges after the change, at chronic onset (42):** urgent 25, routine 14, emergency 3 — the three are causes
  whose own authored plan is an emergency.
- **Known and left: the retina.** Its leading cause is giant cell arteritis (inflammatory), so the rule does not
  apply, and its referral ("IMMEDIATE ophthalmology AND acute stroke pathway") stands at every onset. Recorded,
  not changed — a separate question about the retina's own ranking.

## 5. What the clinician sees — `app/app.js`, `app/answer.js`

**The answer card.** No code change beyond the shared ranking: `resolveNext` already reads the plan, so the Next
line (the referral verbatim) and the badge follow.

```
Right arm weak + brisk reflexes · onset CHRONIC
What   Most likely Glioma / metastasis.
Next   Neuro-oncology multidisciplinary team, with neurosurgery
Badge  URGENT   (was EMERGENCY)
```

**The Next card.** When `nx.followed` is set (and nothing is selected), one derived line above the tiers says
why the plan is the cause's, so it never reads as a selection the clinician did not make:

> *Following the most likely cause, Glioma / metastasis. A chronic onset rules out MCA superior division infarct,
> which this site's usual plan is written for.*

Template: `Following the most likely cause, {cause}. A {onset} onset rules out {setAside}, which this site's usual
plan is written for.` — approved with the design (2026-09-29). The tiers carry the same scope tags a
selection gives them: "— site" on immediate and first-line, "— {cause}" on confirmatory and monitoring.

**The What card.** Unchanged: nothing is marked selected. Selecting any cause switches the plan as today, and the
note disappears.

## 6. Units

| Unit | Change |
|---|---|
| `src/data/causes.js` | `leadingCause(causes)` — the What line's ranking, moved here |
| `src/data/nextSteps.js` | `sitePlan()` (today's body), `onsetFollows()`, `nextStepsFor` = site plan + follow; `pathologyNextStepsFor` with a cause and `resolveUrgency` build on `sitePlan` |
| `app/answer.js` | `whatLine` calls `leadingCause` |
| `app/app.js` | `nextBlock` renders the note and the scope tags when `nx.followed` |
| `test/onset-follows.test.js` | new suite (§7), chained into `npm test` |
| `test/answer.test.js` | the chronic card, line by line |

## 7. Tests (TDD)

`test/onset-follows.test.js`:

1. With no onset, and at acute onset, `nextStepsFor` deep-equals `sitePlan` for every site, with no `followed` key.
2. At subacute and chronic, the rule fires exactly where §3's conditions hold, and the site-kind counts are the
   measured 40 and 42, with 1 at hyperacute and 0 at acute (a ratchet: a content change that moves them must be
   looked at, not absorbed).
3. When it fires: `immediate` and `investigations` are the site's; `confirmatory`, `monitoring`, `referral` equal
   the followed cause's `pathologyNextStepsFor` tiers; `urgency` equals `resolveUrgency(site, cause)`.
4. The followed cause is always the cause `whatLine` names, and always has an authored plan.
5. A selection wins: `pathologyNextStepsFor(site, name, { onset })` equals today's result (built on `sitePlan`)
   and carries no `followed`.
6. The canary (§4), over every site: 0 at chronic; at subacute, only the retina.
7. The hyperacute escalation is untouched: every hyperacute assertion in `test/accuracy-mechanisms.test.js` and
   `test/next-steps.test.js` still holds unedited.

`test/answer.test.js` gains the chronic motor-cortex card (What, Next, badge). The existing four worked examples
must pass unedited — none is at subacute or chronic onset.

## 8. Rollout

1. Branch `fix/onset-follows-cause`; TDD per §7; full suite green.
2. **Owner review, one round:** a before/after table of every changed case (site kind × onset: most likely
   cause, old referral + badge, new referral + badge) — 83 rows.
3. Browser check: the chronic card and the Next card note, desktop and 375px, light and dark.
4. v0.10.1 (`package.json`, `app/brand.js`, README status); CLAUDE.md section; PR. The owner merges — merging
   deploys to testers.

## 9. Out of scope

- **The rule for non-stroke sites.** The general form ("a site's plan follows the What line whenever the onset
  sets the site's leading cause aside") would fire at up to 99 site kinds at every onset, peripheral sites
  included, rewriting signed-off Next lines well beyond this defect. Its own decision.
- **The cauda equina worked example's Why line** ("Sciatica-type root pain → only the cauda equina") — the other
  open item from PR #13.
- **The retina's referral** at slow onsets (§4).
- **The anatomy sheet** — no structure changes.

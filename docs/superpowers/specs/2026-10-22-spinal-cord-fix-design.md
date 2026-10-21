# The spinal cord fix — where along the cord (design, 2026-10-22)

**Status: IMPLEMENTED (2026-10-22) on `fix/cord-localisation`.**
- Audit: 79/105 (cord 19/20). Before the fix it was 66/105 with the four row-13 probes; every other region and all
  metamorphic totals are unchanged.
- `npm test`: 84 suites, 7195 assertions, green.
- The content round (§8) is pending. Plan: `docs/superpowers/plans/2026-10-22-spinal-cord-fix.md`.
- Round 1 was ruled the same day: all 13 recommendations approved as written.

> *"Round 1 of the spinal cord fix: I approve all 13 recommendations as written."* — the owner

**Row 10 was refined the same day, by the owner's choice.** As written, "whenever a cord site is in the list" also
showed the Sensory level field for a single weak arm or leg (measured while writing the plan). That reverses the
2026-08-16 rule keeping the field off screen for limb weakness. The field now shows when the **displayed answer** is a
cord lesion, or when a sensory or bladder finding is ticked.

- Branch: `fix/cord-localisation` (worktree `Code/neurolocaliser-cord/`).
- Cut from `test/clinical-audit-suite` at `2e6bc30`. That branch is PR #18, which stays open and is not to be merged.
- Every number below was measured by applying candidate changes to throwaway copies of that branch. Nothing was
  committed except this document.

This is the first fix from the 2026-10-18 clinical audit. The yardstick is `npm run test:audit`; its baseline and
rulings are in `2026-10-18-clinical-audit-suite.md`.

---

## 1. Why the cord goes first

The spinal cord is the audit's worst region: **6 of 16 probes correct**. It also makes the most dangerous kind of
error. When the engine answers "conus", the Next steps say *"EMERGENCY MRI centred on the CONUS at the T12-L1
level"*. The plans for the cord patterns these pictures need all start with whole-spine MRI: anterior, transverse,
posterior, central and hemicord. So in a thoracic or cervical cord compression the wrong part of the spine gets
imaged.

Ten probes fail today, as the audit recorded them:

| Probe | Today |
|---|---|
| C5/6 myeloradiculopathy (R1 #1) | conus + upper trunk, "vasculitis" |
| asymmetric compression: R leg weak + both Babinski + sphincter | conus + leg motor cortex, "MS" |
| spastic legs alone | conus first |
| spastic legs + level T10 | conus first; the level note says "below the cord" |
| T8 compression examined fully, saddle included | transverse cord + conus, "MS" |
| the same at level C5 | anterior cord + conus, "MS" |
| central cord: both arms weak + cape | central cord + locked-in, "MS" |
| syrinx: cape + wasted hands + spastic legs | three sites, "vasculitis" |
| spinal shock, entered as flaccid legs | GBS first; GBS + cord |
| spinal shock, entered as weak legs | anterior cord + Friedreich's, "MS" |

## 2. What is wrong underneath

The audit named three root causes. Prototyping confirmed all three and found five more.

1. **The cord has no segment.** There is one generic cord, and every cord pattern predicts arm weakness and
   Hoffmann's sign. A legs-only picture therefore costs each bilateral cord pattern four wrong predictions (arm
   weakness and Hoffmann's, each side), and the tight conus wins. No cord site can produce signs AT its level
   either, so a myeloradiculopathy needs two lesions.
2. **"Bilateral = rare."** That blanket rule made every bilateral cord pattern RARE. The conus escaped it only
   because its side is "midline", so it stayed UNCOMMON. The module's own header puts cord lesions at "less
   common", not rare.
3. **Spinal shock is not modelled.** An acute cord lesion is flaccid and areflexic at first, and the engine knows
   only the spastic picture.
4. **Known negatives ignore grading.** An un-entered opposite side counts as normal. So "right leg weak + both
   Babinski" ruled out every bilateral cord site, because the left leg was not entered as weak. Babinski signs and
   brisk reflexes usually come before weakness.
5. **No cord site predicts saddle loss.** A complete lesion takes every modality below the level, the sacral
   dermatomes included. Without that, a fully examined T8 compression needs "cord + conus".
6. **The central cord predicts only the cape.** It does not predict arm weakness or hand wasting.
7. **The level note describes a different answer from the one shown.** It reads the scored ranking, and the reader
   sees the displayed one. Flaccid areflexic legs with a T6 level display GBS, and the note says *"…the findings
   localise to combined_degeneration_friedreich"*. And the app shows the level only when it "applies". So a
   dismissed level is invisible: type T10 under a conus answer and nothing about the level appears anywhere.
8. **The Sensory level field is hidden for a spastic paraparesis**, the picture where it matters most. It mounts
   only once one of these is ticked: pain loss, sensory ataxia, saddle loss, sphincter dysfunction or distal sensory
   loss. Three more trigger ids (`dorsal_column`, `sensory_level`, `glove_stocking`) are not finding ids, so a pure
   dorsal-column picture never shows it either.

## 3. The first decision: should a stated sensory level change the answer?

CLAUDE.md, "Orthogonal axes", says the level *"annotates the winner, never changes it"*. It is a signed-off
principle, so overturning it needs your ruling.

**The principle has already been bent once.** The level gates the cord Horner's (`emitAtOrAbove: "T1"`), so it
already changes what a cord site predicts. Papilloedema is an axis "the same shape as the sensory level", and it
already narrows the compartment.

**Annotate-only cannot fix the audit.** Two findings show why:
- **Spinal shock against GBS.** With no level stated, a spinal-shock state takes GBS's own picture. Three things
  fail: the audit's GBS probe, the GBS vignette (`clinical-vignettes`) and a GBS Why clue (`why.test`). The
  sensory level is the bedside discriminator, so the shock state has to depend on it.
- **Pictures the audit does not cover.** Saddle loss + sphincter + both Babinski with a T10 level still reads
  "conus", and the app hides the level. Spastic legs with a C4 level read "conus" too.

Four options were measured, each with the rest of the recommended set (§4) in place.

| Option | What the level does | Audit | `npm test`, beyond the two re-pins in rows 11–12 | Verdict |
|---|---|---|---|---|
| A. Keep annotate-only | nothing | 73/101 without spinal shock. Shock offered without a level: 75/101, but the GBS probe's "first" check fails | ungated shock: 2 more failures (GBS vignette, GBS Why clue) | Spinal shock cannot pass without breaking GBS; the conus pictures above stay wrong |
| **B. Narrow overturn** | demotes non-cord sites; constrains cord segments; gates spinal shock | 75/101 | **0** | **recommended** |
| C. The level becomes a finding that only the cord explains | counts in coverage | 75/101 | 4 more failures | Weber + T10 becomes "midbrain + hemicord", "MS". The Horner's level test and an anterior-cord test break; the finding needs a new label |
| D. Exclude, like papilloedema | removes non-cord sites | 75/101 | 2 more failures | Weber + T10 collapses to a hemicord explaining 2 findings, and the note says "lesion at or just above T10" |

**Option B, precisely.** A sensory level typed at segment S means a cord lesion at or above S. Three things follow:
- **a. Demote.** A site that cannot produce that level sorts below every site that explains as much and can. This
  covers everything outside the cord, and the conus and cauda below it. It is the same mechanism as a recorded
  down-going plantar (your 2026-09-29 ruling: demote, not exclude).
- **b. Constrain.** A cord pattern's segment must lie at or above S. Under a C4 level, an arms-spared reading is not
  offered.
- **c. Gate.** The spinal-shock state is offered only when a level is stated.

Under B, the level never adds a candidate, never removes one, and never creates or removes a multifocal claim. The
cross-sectional pattern still picks which syndrome. a and b must ship together: the constraint alone puts the conus
FIRST for spastic legs with a C4 level (measured).

The principle would then read: *the cross-section says WHICH syndrome; the level says WHERE along the neuraxis, and
it demotes what cannot lie there.*

## 4. Rulings — round 1 (all 13 APPROVED as written, 2026-10-22)

Each row is one decision, with my recommendation. The owner approved the table as written, so every recommendation
below is now a ruling.

| # | Decision | Recommendation | Measured effect |
|---|---|---|---|
| 1 | Does a stated level change the answer? (§3) | **Yes: option B**, demote + constrain + gate | Needed for the shock gate. Fixes the conus + T10 and the spastic + C4 pictures (§6). 0 `npm test` failures |
| 2 | Give the cord a segment axis, and in what form? | **Variants of the existing cord sites**, with the same ids and the same content. The solver scores each variant and shows each site once, as its best variant. An **arms-spared** variant (no arm weakness, no Hoffmann's) for the bilateral anterior, the transverse and both hemicords; **at-level** variants for the bilateral anterior and the transverse (row 3). | Needed for "spastic legs alone" and for the myeloradiculopathy. **New site ids were measured and rejected.** Each reading is then listed as a separate site, and none matches the cord ids the audit and the vignettes pin. The cord falls to 4/16, below today's 6/16. 15 audit checks that pass today break, including R1 #12's top 3 and two mirror checks. 4 textbook vignettes fail. Content is not the obstacle: a new id would inherit its pattern's causes and plans. |
| 3 | What are the at-level signs? | **Two-segment spans, C5–6, C6–7, C7–8 and C8–T1**, on the left, the right or both sides. Each is that span's root motor, reflex and wasting rows. They reuse the existing root structures, so there are no new structures. Spans are needed because a disc-level lesion takes two segments: the biceps jerk is a C5 row and the supinator jerk a C6 row. | Makes the C5/6 myeloradiculopathy one lesion: the anterior cord at C5–6, with left root signs. An unprobed C6/7 picture also becomes one cord lesion; today it is conus + C7 root, "vasculitis". |
| 4 | Prevalence of the cord and the conus | The bilateral cord patterns take the cord's own tier, **UNCOMMON**. The transverse stays RARE (its own `RARE_PARTS` entry). The conus becomes **RARE**: an isolated conus lesion is far rarer than a myelopathy. | Each of the two is needed, alongside row 2, for "spastic legs alone". Each alone changes nothing (0 fixed, 0 broken). |
| 5 | Upper motor neurone signs before weakness (known negatives) | A Babinski, brisk reflexes, spasticity or Hoffmann's on a side means that side's corticospinal tract is involved, so its other corticospinal signs there are **not "known normal"**. Weakness never excuses a missing sign. | Fixes the asymmetric compression; 0 regressions. The embolic "R arm + L leg" two-lesion picture is untouched. A broader version, where weakness also excuses, breaks that picture and is rejected: the audit's embolic probe, 11 `npm test` assertions, and a crash in the app smoke test. A cord-only exemption measured the same as the recommended rule, but it rests on no clinical rule. |
| 6 | Saddle loss in a cord lesion | The **complete (transverse)** cord predicts saddle anaesthesia. The anterior, central and hemicord keep sacral sparing. | Fixes both "T8 / C5 compression with saddle loss". Adding it to the anterior cord as well is rejected: that puts the cord ahead of the conus for the classic conus picture. The conus probe, the conus vignette, the conus vocabulary ruling and two anterior-cord tests fail. |
| 7 | Spinal shock | A **spinal-shock state** of the anterior and transverse cord, with the same ids. Below the level: flaccid weakness, reduced tone, absent knee and ankle jerks, and absent bulbocavernosus and anal wink; the bulbocavernosus returning marks the end of shock. These replace brisk reflexes, spasticity and Hoffmann's. **Babinski is kept**: the plantars may be mute, flexor or already extensor, so an up-going plantar does not argue against shock, and a down-going one only demotes. Six new structures; offered only with a stated level (row 1c). | Fixes both shock probes (4 checks). Keeping Babinski matters for "flaccid areflexic legs + both plantars up + pain loss + retention + T6": it is one lesion, where the state without Babinski gives cord + Friedreich's, "MS". Without the level gate the state takes GBS's picture: the GBS probe, the GBS vignette and a GBS Why clue fail. |
| 8 | The central cord | It also predicts **arm weakness** (corticospinal arm fibres) and **wasting** (anterior horn cells at the level). Both reuse existing structures. **Defer the leg signs** of an expanding syrinx to the composite-sites round (§7). | Fixes the central cord (no more "+ locked-in"); 0 regressions. |
| 9 | The level note | The note **follows the displayed answer**, not the scored one. It **shows whenever a level is typed**. When the answer contradicts the level it says so, for example: *"a level at T10 needs a cord lesion at or above T10; the cauda equina cannot produce one — re-check the level, or consider a second lesion"*. With no level typed, it names the segment the chosen variant implies. | Following the displayed answer fixes "spastic legs + T10"'s note check; 0 regressions. The other three parts are wording and display, not yet measured. |
| 10 | App consequences | The Together card's parsimony guard is called without the level and memoised on the findings only, because the level was "annotation only". **Pass it the level and memoise on it.** **Show the Sensory level field whenever a cord site is in the list.** **Fix the three dead trigger ids.** | Mechanical once row 1 is decided. |
| 11 | Re-pin: the conus picture | `cauda-conus.test.js` pins "both plantars up + brisk reflexes + saddle + sphincter" at `explainAll.length === 1`. The conus is still first and still one lesion, but the complete thoracic cord is now listed second (row 6). **Re-pin it as "one lesion, the conus first."** Listing a complete lesion above the conus second is correct teaching: look for a level. | 1 of the 2 `npm test` failures |
| 12 | Re-pin: tone | `tone.test.js` pins reduced tone to the anterior horn, cauda, polyneuropathy and GBS. **Add the cord, for spinal shock only.** | The other of the 2 failures |
| 13 | New audit probes for what the audit cannot see | Add four probes to the suite. Recommended expected answers: (a) saddle + sphincter + both Babinski, level T10 → a cord site first, level note applies. (b) spastic legs, level C4 → a cord site first, level note applies. (c) R triceps jerk lost + weak elbow extension + both legs UMN → a cord site first, one lesion. (d) flaccid areflexic legs, level T6, no sphincter or pain loss → a cord site first. | All four fail today; all four pass under the recommended set. They would sit in PR #18's suite, so I have not added them. |

## 5. Measured on the prototype

**The recommended set** is rows 1–8 plus row 9's note fix. It was measured on a copy of `2e6bc30`.

| | Today | Recommended set |
|---|---|---|
| Audit probes | 66 / 101 | **75 / 101** |
| Spinal cord probes | 6 / 16 | **15 / 16** |
| Spinal cord checks | 23 / 38 | **37 / 38** |
| Counted audit checks | 654 passed, 316 failed | 668 passed, 302 failed |
| Every other region | — | unchanged, check for check |
| Synonym swaps · comorbidity · mirror | 103/224 · 144/292 · 263/263 | unchanged |
| `npm test` | 7134 / 0 | 7132 / 2, the two re-pins in rows 11–12 |
| Run time (one run each) | audit 3.3 s, suites 13.0 s | audit 4.2 s, suites 15.4 s |

All 14 checks gained are spinal cord checks. Nothing that passes today fails.

**Each failing probe after the change, and what fixed it.** Leaving one change out at a time measured this.

| Probe | After | What it needs |
|---|---|---|
| C5/6 myeloradiculopathy | anterior cord at C5–6, left root signs; one lesion | the at-level variants (row 3) |
| asymmetric compression | anterior cord (arms spared); one lesion | row 5 |
| spastic legs alone | anterior cord (arms spared) first; conus second | the arms-spared variant AND both prevalence changes: removing any one of the three loses it |
| spastic legs + level T10 | the same; note "at or just above T10" | first: as above, or the level demotion (row 1a) on its own. Note: row 9 |
| T8 compression with saddle | transverse cord (arms spared); one lesion | row 6 |
| C5 compression with saddle | transverse cord; one lesion | row 6 |
| central cord | central cord; one lesion | row 8 |
| spinal shock, flaccid entry | anterior cord in spinal shock; one lesion; note "at or just above T6" | row 7 |
| spinal shock, weak-legs entry | anterior cord in spinal shock; one lesion | row 7 |
| syrinx | **still two lesions**: cord at C8–T1 + central cord, "metastases" | deferred (§7) |

The level demotion and the segment constraint (row 1a–b) gain nothing on the audit. They are what fix the
pictures in §6.

## 6. Pictures the audit does not cover

| Picture | Today | Recommended set |
|---|---|---|
| saddle + sphincter + both Babinski, level T10 | conus; the level is not shown | complete cord (arms spared) first, conus second; "at or just above T10" |
| spastic legs, level C4 | conus; the level is not shown | anterior cord (cervical reading) first; "at or just above C4" |
| R triceps jerk lost + weak elbow extension + both legs UMN | conus + R C7 root, "vasculitis" | one cord lesion: anterior cord, C7–8, right root signs |
| flaccid areflexic legs, level T6 (no sphincter, no pain loss) | GBS; the note names Friedreich's | cord in spinal shock first; GBS demoted |
| flaccid areflexic legs + both plantars up + pain loss + retention, T6 | Friedreich's first; three lesions (Friedreich's + cauda + anterior cord) | one lesion: cord in spinal shock |
| R hemiparesis + both Babinski | corona radiata + SCD, "MS" | one lesion: bilateral cord (cervical reading) |
| ALS (fasciculations + wasting + UMN signs) | anterior horn + conus, "MND" | cervical cord + anterior horn, "MND" (R1 #2 still passes) |
| cauda picture, level T10 | cauda; level hidden | cauda still first: it is the only site that explains it all. Row 9's wording would flag the contradiction (wording not prototyped) |
| Weber + level T10 | midbrain; level hidden | midbrain, demoted but still the only explainer. Row 9 would show the existing "suggests a spinal cord lesion" note |
| flaccid legs + pain loss + retention, **no** level | GBS + anterior cord, "vasculitis" | unchanged: without a level, shock cannot be told from GBS. The field is on screen for this picture, and the level fixes it |

## 7. What this round does not fix, and why

- **Syrinx (1 cord probe).** For one lesion, the central cord must also predict weak legs + Babinski. Measured:
  that pushes the parasagittal site out of R1 #12's top 3, an approved check that passes today only because exactly
  two cord sites outrank it. It also collapses the scored ranking for a bare cape: three central-cord assertions
  fail. Once the composite-sites round adds a bilateral parasagittal site, that site explains R1 #12's picture
  outright and the conflict goes away. **Recommendation: ship the central cord's leg signs in that round**, which
  takes the cord to 16/16.
- **Basilar (coma + quadriparesis + both Babinski)** still reads "cord + diffuse cerebrum". The cord cannot explain
  coma; the pontine composite in the composite-sites round can.
- **R1 #12 parasagittal** still fails its "one lesion" check; it needs the same bilateral parasagittal composite.
  Its top-3 check still passes.
- **The false-multifocal class** (synonym swaps, comorbidity) is the next fix, and these numbers do not move here.

## 8. Content for a later round (after this ruling)

None of this changes what the engine localises. It is clinical text, so it goes to you as a separate round:
- **Variant names on the answer card.** Proposed: "Bilateral anterior cord — arms spared", "— cervical, at C5–6, left
  root signs", "— acute: spinal shock".
- **Never "thoracic".** A legs-only myelopathy can be cervical, and parasagittal lesions mimic it. A label that says
  "thoracic" would narrow the imaging the plans rightly keep at the whole spine. The label must not move the imaging
  away from the whole spine.
- **Anatomy-sheet rows and notes** for the 7 new structures: 6 for spinal shock, 1 for the complete cord's saddle loss.
- **The Why line for at-level signs.** The at-level variants reuse the root rows, so the Why line cites the root's
  note for a cord lesion's at-level sign, for example *"C5 — biceps"*. Decide whether that wording stands, or whether
  the cord gets its own at-level rows ("anterior horn at C5 — biceps").
- **Cause order per variant.** Causes are keyed by pattern, and the anterior cord's list leads with anterior spinal
  artery infarction. That is wrong for a spondylotic myeloradiculopathy at a chronic onset.

## 9. How it would be built (the plan follows the ruling)

- `src/model/sites.js`: cord composites carry derived `variants`. Each variant has its structure list and the highest
  segment its lesion can occupy. Arms-spared drops `cst_cord_arm` and `cst_cord_hof`. At-level spans add the roots'
  motor, reflex and wasting rows on their side(s). Spinal shock swaps the release signs for the shock rows and needs
  a level. Transverse gains `cord_saddle`; the central composite adds `cst_cord_arm` + `ah_wasting`.
- `src/model/structures.js`: 7 new structures, 6 of them in a composite-only `cord|shock` part, as `cord|autonomic`
  is today.
- `src/engine/forward.js`: a variant's at-level rows are emitted on its own side(s).
- `src/engine/inverse.js`:
  - `differential`, `rankSingle`, `nearFit` and `ruledOutSites` expand the variants and keep each id once.
  - The known-negative grading rule (row 5).
  - The level demotion, using the existing `against` key.
  - `describeLevel` reads the displayed answer.
  - `candidateSites()` is unchanged, so the atlas and every per-site test still see one site per id.
- `src/model/prevalence.js`: row 4.
- `app/app.js`: row 10.
- Tests:
  - The cord, sensory-level and cauda-conus suites gain the variant and level pictures.
  - The two re-pins (rows 11–12).
- CLAUDE.md: the "Orthogonal axes" paragraph is rewritten.

**Measured, not assumed.** On the prototype, every suite passes except the two re-pins, including the suites that
assert these:
- every site's own picture reaches its own place;
- every textbook vignette;
- the Why and the Where agree.

The audit's 263 mirror pairs still mirror.

## 10. Content round 1 — the clinical wording (awaiting your ruling)

This round covers the clinical text the fix introduced, plus what it newly exposed. There are 22 rows. Approving the
table approves every recommendation as written. "Today" is the branch as built. Every recommended change was
prototyped on a scratch copy, except A2 (the "also fit" list), which is checked when it is built.

**Measured effect of all recommendations together:**
- **Audit:** unchanged at 79/105, cord 19/20, everything else identical.
- **`npm test`:** five pinned assertions change, and every one is wording or a count this round sets:
  - two in `cord-segment` and two in `level-axis`, which pin the B2, B3 and C1 wording;
  - the onset-follows count (row E2).

**What the reader sees, today → recommended.** The examples have no onset unless one is stated.

| Picture | Today | Recommended |
|---|---|---|
| Spastic paraparesis | *Bilateral anterior cord.* · *Most likely Anterior spinal artery infarct.* | *Bilateral anterior cord (arms spared).* · *Most likely Compressive myelopathy (disc / mass / abscess) (must not miss). Must not miss: Epidural abscess.* |
| The same, chronic onset | *Most likely Compressive myelopathy … Could represent an old stroke.* | *Most likely Compressive myelopathy … Must not miss: Spinal dural arteriovenous fistula.* |
| C5/6 myeloradiculopathy | *Bilateral anterior cord.* · *Most likely Anterior spinal artery infarct.* | *Bilateral anterior cord (at about C5–6, root signs on the left).* · *Most likely Compressive myelopathy …* |
| Spinal shock, level T6, acute | *Most likely Anterior spinal artery infarct.* | *Most likely Compressive myelopathy (disc / mass / abscess) (must not miss).* (ASA infarct still leads at a hyperacute onset) |
| Transverse cord, chronic onset | *No cause here typically starts this way — 6 set aside.* | *Most likely Compressive myelopathy (tumour, disc, abscess, haematoma) (must not miss).* |

### A. How a reading of the cord shows on the card

| # | Item | Today | Recommendation |
|---|---|---|---|
| A1 | The reading on the Where line | Not shown: every reading reads "Bilateral anterior cord" | **Add it to the place, in brackets:** "(arms spared)", "(at about C5–6, root signs on the left)", "(spinal shock)", "(spinal shock, arms spared)". Never "thoracic", because a legs-only myelopathy can be cervical. |
| A2 | Readings in the "also fit" list | The prototype repeats them: "1 other place also fits: Bilateral transverse cord (at about C5–6, root signs on the left)" | **Show the reading for the answer only;** the "also fit" list keeps plain places. |
| A3 | The card title | "Anterior cord syndrome (anterior spinal artery)" for every anterior reading | **Keep the pattern's title.** The reading (A1), the red flag (A4) and the cause order (E1) carry the difference. Per-reading titles would be a new piece of phonebook content for every reading. |
| A4 | The anterior cord's red-flag line, shown under every reading, even a spastic paraparesis with no sensory loss | "Preserved vibration with dense weakness and a dissociated sensory loss points to ASA territory — look for an aortic/vascular cause." | **"A new bilateral cord picture is compression until whole-spine MRI says otherwise; only then does preserved vibration with a dissociated sensory loss point to ASA territory and an aortic or vascular cause."** |

### B. The level notes

| # | Item | Today | Recommendation |
|---|---|---|---|
| B1 | At-level reading, no level typed | "the at-level signs (left) place the lesion at about C5–6; the long-tract signs below it come from the same lesion" | **"root signs on the left place the lesion at about C5–6; the long-tract signs below it come from the same lesion"**. "At-level signs" is jargon. |
| B2 | Arms-spared reading, no level typed | "the arms are spared — the lesion lies below the arm segments, or is cervical and not yet reaching the arm fibres; a sensory level is needed to localise the segment" | **"arms spared — the lesion is below the arm segments, or cervical and not yet reaching the arm fibres; a sensory level will narrow it"** |
| B3 | A level typed under a cord answer. This is existing, signed-off wording, which the fix now shows far more often | "lesion at or just above T10 (the sensory level typically sits a segment or two below the lesion)" | **"lesion at or above T10 — usually just above it, but a compression can sit several segments higher (a cervical lesion can give a thoracic level), so the level does not replace whole-spine imaging"**. "At or just above" can send the scan to the wrong segment, which is the very error this fix is about. |
| B4 | The demoted row | "less likely — cannot produce a sensory level at T10" | **Keep.** |

### C. The contradiction sentence

| # | Item | Today | Recommendation |
|---|---|---|---|
| C1 | A typed level under a non-cord answer | "a sensory level at T10 needs a cord lesion at or above T10; Midline cauda equina cannot produce one — re-check the level, or consider a second lesion" (the place lands capitalised mid-sentence) | **"Midline cauda equina cannot produce a sensory level at T10 — that needs a cord lesion at or above T10. Re-check the level, or consider a second lesion."** |

### D. The seven new structures, and reused rows

The note's first clause is what the Why line quotes ("carried by spinal shock"); the anatomy-sheet row is its long form.

| # | Structure | Note (anatomy row) | Recommendation |
|---|---|---|---|
| D1 | `cord_saddle` | "complete cord lesion — every modality lost below the level, the saddle included" (row: "…; the incomplete patterns keep sacral sparing") | **Keep.** |
| D2 | `cord_shock_flaccid` | "spinal shock — flaccid paralysis below an acute cord lesion" | **Keep.** |
| D3 | `cord_shock_tone` | "spinal shock — tone lost below the lesion" | **Keep.** |
| D4 | `cord_shock_knee` | "spinal shock — knee jerks lost below the lesion" | **Keep.** |
| D5 | `cord_shock_ankle` | "spinal shock — ankle jerks lost below the lesion" | **Keep.** |
| D6 | `cord_shock_bulbo` | "spinal shock — bulbocavernosus reflex lost; its return marks the end of shock" | **Keep.** |
| D7 | `cord_shock_anal` | "spinal shock — anal wink lost" | **Keep.** |
| D8 | Reused rows | The at-level readings quote the roots' own notes ("biceps jerk (C5/6)", "C5 — biceps"). The central cord's wasting would quote "anterior horn — denervation wasting (generalised LMN)". | **Keep the root rows**, which are accurate at the segment. "Generalised" is wrong for a syrinx, but no picture reaches it until the syrinx's leg signs land, so **fix it in the composite-sites round**. |

Once these rows are approved, the anatomy sheet's new rows count as reviewed and can be republished with the next
Artifact refresh.

### E. The cause order per reading (the What line)

Causes are keyed by pattern, so every reading of the anterior cord shares one list.

| # | Item | Today | Recommendation |
|---|---|---|---|
| E1 | The anterior cord, every reading | "Anterior spinal artery infarct" leads at no onset, hyperacute and acute. That covers a spastic paraparesis, a myeloradiculopathy and spinal shock. | **Put "Compressive myelopathy (disc / mass / abscess)" first, and let it be acute as well as subacute and chronic**: an acute disc, abscess or haematoma compresses acutely. Measured: compression leads at no onset, acute, subacute and chronic; ASA infarct still leads at a hyperacute onset. |
| E2 | The 2026-09-29 "onset follows the cause" rule | It applies to the anterior cord because its leading cause is vascular. At a chronic onset the card adds *"Could represent an old stroke."* | **Accept the consequence of E1.** The leading cause is no longer vascular, so the rule no longer applies here; the old-stroke clause goes and the site's own plan stands. **Re-pin onset-follows "subacute 37, chronic 42" → 36, 41.** |
| E3 | Cervical spondylotic myelopathy | Absent from the anterior and transverse lists, though it is the commonest myelopathy in older adults | **Add it to both** (chronic, common, not must-not-miss), after the compressive cause. It reuses its authored workup, so the every-cause gate holds. Its text has no figures ("an older patient"). It does not lead; compression does. |
| E4 | The transverse cord at a chronic onset | "No cause here typically starts this way — 6 set aside." | **Let "Compressive myelopathy (tumour, disc, abscess, haematoma)" be chronic too** (a slow tumour or spondylosis). Measured: "Most likely Compressive myelopathy …". |
| E5 | Spinal shock | — | **No separate change.** It follows E1 on the anterior cord. On the transverse cord, compression already leads at an acute onset and cord infarct at a hyperacute one. |

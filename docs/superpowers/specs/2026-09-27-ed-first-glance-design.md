# ED first glance: the answer card and a friendlier examination (design, 2026-09-27)

**Status: IMPLEMENTED (2026-09-29) on `feat/ed-first-glance`.** Review round 1 changed the model as well as the labels —
see the plan's execution log.
Branch: `feat/ed-first-glance` (off `main` at `ca4c164`).

This is sub-project 3 of 3 from the 2026-09-25 request. Sub-project 1 (accuracy) is PR #11, sub-project 2
(the integrated Why) is PR #12. Sub-project 3 was parked "pending a wider look at options"; the options were
laid out as mockups on 2026-09-27 and chosen from.

---

## 1. Why

The owner, 2026-09-25: testers *"have said it is too advanced and 'going over their heads'. The information
should be available if wanted, but it needs to be usable and not overwhelming on first glance."*

Asked which part lost them, the owner named **the amount of output**, plus a general impression. Measured on
the Wallenberg worked example (7 findings) on `main`:

- The results column is four stacked cards and **~670 words** before anything is collapsed. The Why card alone
  is **~380 words** — a carrier, a side reason and a "could arise at" list per finding — then a 7-row compare
  table.
- The input is **233 findings in 20 exam groups** (nested to three levels), each with side buttons, plus a
  sensory-level and distal-reach pair that appears for cord findings.
- On a phone (below the 860px single-column breakpoint) the results sit **below** the whole findings panel.

Nothing is wrong with the content — every layer of it has been clinically signed off. The problem is that all
of it arrives at once.

## 2. Rulings made while designing (2026-09-27)

1. **Scope: results AND input**, designed together and **shipped as one release**.
2. **Results layout: option A** — one answer card with a line each for Where / Why / What / Next, and today's
   four cards closed underneath (chosen over "four short cards" and "summary + tabs").
3. **The first glance is a short version of all four** — not action-first or reasoning-first alone.
4. **Input: the examination tree stays** — made friendlier with plain rows and the common findings first, and
   follow-ups that appear under a ticked finding. (Start-from-the-complaint was chosen first, then reversed by
   the owner the same day.)
   **Follow-ups are only true refinements** of the ticked finding, never a different kind of finding.
5. **Onset and the symptoms' side are asked up front**, both optional, in a row above the tree.
6. **The Why line: key clues + side** — the fewest findings that pin the place, each tagged with its body side.
7. **Phones get a sticky answer strip.**
8. **The site's red-flag sentence is a fifth line on the answer card** whenever the site has one.

**Prior rulings this design keeps.** The 2026-08-16 clarity pass ruled that the reasoning stays in ONE scroll
in a FIXED order, and rejected tabs because *a trainee could skip Why, which is the teaching payload*. The
order is unchanged, the detail is closed rather than tabbed, and the answer card itself carries a Why line, so
the reasoning's gist is on screen before anything is opened. **What does change:** the detail cards are now
closed by default. That is the point of the round and is stated here so it is not mistaken for a regression.
The 2026-09-25 vocabulary ruling (`weak_arm`/`weak_leg` mean pyramidal weakness) is carried by the plain
labels (§5.1): the arm-weakness row reads "Arm weakness — upper motor neuron pattern".

---

## 3. The results panel

### 3.1 The answer card

Replaces today's hero card (site name + urgency + "2 lesions explain all 7 findings"). Keeps the urgency
badge, the site id toggle and "Report a problem" in its header; the mono location line under the title goes,
because the Where line now names the place. **The badge follows the RESOLVED plan** — the same one the Next line
and the Next card show — so selecting a cause moves all three together (it used to read the site plan only).

```
[EMERGENCY]                                        [Report a problem]
Left lateral medulla — Wallenberg syndrome
Where  Left lateral medulla. 1 other place also fits: left hemimedulla.
Why    Left face pain loss + left swallowing difficulty + right body pain loss → only the left medulla.
What   Most likely PICA / vertebral artery occlusion. Must not miss: vertebral artery dissection.
Next   Acute stroke team — hyperacute pathway; keep nil by mouth until swallow assessed.
⚑      Swallowing can fail early — keep nil by mouth until assessed.
```

Every line is DERIVED from what `app.js` already computes; nothing is authored per site. A pure module,
`app/answer.js`, builds them (`answerFor(...)` → `{ lines: { where, why, what, next, red }, nx, combined, twoLesions }`), so every path is
testable in node.

| Line | Built from | Rule |
|---|---|---|
| **Where** | `plainSiteName()` of the displayed site + the other sites that explain every finding | "{name}." then, when others fit, "{k} other place(s) also fit: {up to 2 names}{, and n more}." |
| **Why** | `whyClues()` (§4) | Always engine-generated. |
| **What** | `causesFor(site, { onset })` | **Most likely** = the first concordant (not demoted) cause, ranked common > uncommon > rare, ties in list order. **Must not miss** = the first concordant `red` cause that is not the most likely. If the most likely is itself red it reads "Most likely X (must not miss)" and the second slot takes the next red, if any. |
| **Next** | the resolved workup's `referral` | The referral sentence **verbatim, never truncated** (median 79 characters, longest 188). The urgency is the badge. |
| **Red flag** | `nameForSite(site).red` | Shown only when present (266 of 378 sites), in the filled danger form. Only 46 of those 266 are already echoed in the referral, so hiding it would lose 220. |

**Why the Next line is the referral and not the first steps.** The first immediate step and the first
investigation are written for the detail card and run to ~190 characters ("Test dorsiflexion, great-toe
extension AND foot INVERSION and HIP ABDUCTION — …"); cutting them mid-sentence risks changing their clinical
meaning. The referral is already one line saying who and how fast. The early mockup's "stroke team · swallow
screen · MRI" was hand-composed and cannot be derived; this is the honest version of it.

**Edge states:**

| State | Where | What | Next / red |
|---|---|---|---|
| No single site explains everything | "No single place explains every finding — likely {A} and {B}." (the minimal cover / pinned pair, via `combinedSites()`) | "Together: {top concordant entity}" | the combined plan's referral; the entity's red sentence if selected |
| A cause is selected (`px=`) | unchanged | "Selected: {cause}" | that pathology plan's referral, as the Next card already resolves it |
| A cross-site entity is selected (`ux=`) | unchanged | "Selected: {entity}" | the entity plan's referral and red |
| No cause fits the onset | unchanged | "No cause here typically starts this way — {n} set aside." | unchanged |
| A single non-localising sign | the candidates as usual | as usual | as usual; the Why line reads "… → anywhere from the X to the Y" |

The functional, refractive and papilloedema banners keep their current position above the card.

### 3.2 The detail, closed below

Today's four cards (Where, Why, What, Next — and Together when it appears) follow in the same order as
closed disclosures, each with a one-line label ("Where — 2 places fit, and how to tell them apart"). Their
contents are unchanged. The section nav still works: a nav link opens its section and scrolls to it (keeping
the 2026-08-16 fix that jump links never let the browser rewrite the case hash). A section the reader opens
stays open as findings change, until they close it. Open/closed state is view state and never enters the URL.

### 3.3 The phone strip

Below the 860px single-column breakpoint, once there is a result and the answer card is out of view, a slim bar
pins to the bottom of the viewport: *"Left lateral medulla · Emergency · 2 fit — View"*. Tapping it scrolls to
the answer card. It hides whenever the card is on screen — measured on scroll and resize with `getBoundingClientRect()`, because
an `IntersectionObserver` was measured NOT to deliver callbacks in a throttled tab (the strip never appeared). It
leads with the urgency (*"Emergency · 2 fit · Lateral medullary syndrome…"*) so a narrow screen truncates the
name, never the urgency; it sits above the safety bar and does not exist on desktop.

---

## 4. `whyClues()` — the Why line

Lives in `src/engine/why.js` beside `whyChain()`, because it is reasoning rather than display.

**Definition:** the fewest entered findings that, **on their own**, narrow the differential to the place the
full picture meets at. Clues are chosen against the same explain-all differential the Where card uses — not
against the per-finding "could arise at" station lists — because the two differ. Measured over every site's
own picture: selecting by station overlap stalls on **12 of 249** single-place answers (the brachial-plexus
cords, a compressive CN III), where each finding could arise in the plexus or in a nerve but no single nerve
carries them all; only the differential sees that. Selecting by differential reaches the answer on 245; the
4 remaining were the symmetric sites, which fail only when a both-sides finding is split into its left and
right entries — hence rule 1.

**Algorithm:**
1. The clue units are the steps of `whyChain()`, with a finding entered on BOTH sides treated as one unit,
   tagged "bilateral" and carrying no side relation (it is neither same-side nor opposite-side).
2. Greedy: repeatedly add the unit that gives the smallest explain-all place set for the chosen units, where a
   place is `(station, side)` exactly as `whyChain().meet` computes it. Ties go, in order, to (a) a unit whose
   side relation (same / opposite) is not yet represented among the chosen, then (b) the unit the clinician
   entered first — measured against station count as the tie-break, entry order gave the more natural clue
   (Weber: arm weakness rather than forehead sparing; compressive CN III: ptosis rather than weak elevation). Stop as soon as the chosen units' place set lies within the full
   picture's meet.
3. **Crossed completion.** When the chosen clues carry exactly ONE of same-side / opposite-side, fewer than 3
   were chosen, and a unit of the other kind exists, append the first such unit in `whyChain()`'s step order
   (fewest possible stations first, then entry order). Clues that carry no side at all are left alone — a
   whole-MCA picture is pinned by "impaired repetition" alone, and adding sides to it would be noise.
   Measured 2026-09-27 over every site's own picture: 365/365 reach their place, 5 need more than 3 clues
   (shown as "+ n more findings"), and no one-sided clue set misses the crossed side. This is what makes the crossed
   pattern visible: Wallenberg gains "right body pain loss".
4. Show at most 3 clues; if more were needed, append "+ n more findings".

**Rendering:** each clue is `{side tag}{plain label}` (§5.1), side tag "left " / "right " / "bilateral " / none
for midline and non-lateralised findings; clues joined by " + ".

- verdict **one**: "{clues} → only the {side} {station}."
- verdict **several**: "{clues} → the {side} {A, B or C}; see Where for what separates them." — or, when the
  stations form a range, "… → anywhere from the {X} to the {Y}; …"
- verdict **none**: "These findings need more than one lesion — see Together." (the Where line already says no single
  place explains them, so the Why line does not repeat it)

**Prototype output (2026-09-27, the final algorithm over `test/clinical-vignettes.test.js` — all 85 cases reach
the answer's place, none needs more than 3 clues; plain labels are interim):**

| Case | Why line |
|---|---|
| Weber | Left eye won't turn in + right arm weakness → only the left midbrain. |
| Wallenberg | Left face pain loss + left swallowing difficulty + right body pain loss → only the left medulla. |
| Medial medullary | Left tongue weakness + right arm weakness → only the left medulla. |
| Brown-Séquard | Left leg weakness + right body pain loss → only the left spinal cord. |
| Complete dominant MCA | Non-fluent speech + right half-field loss → only the left cerebral cortex. |
| Compressive CN III | Left fixed dilated pupil + left droopy eyelid → only the left pupil pathway. |
| Guillain–Barré | Bilateral floppy weakness + bilateral absent knee jerk → only the nerve root. |
| L5 radiculopathy | Left L5 numbness → the left nerve root or plexus; see Where for what separates them. |
| Hemiparesis alone | Right arm weakness → anywhere from the cerebral cortex to the spinal cord; see Where … |

Cost: one `differential()` call per candidate unit per round, memoised within the call — 20ms worst case over
the 85 vignettes (162ms on a site's full synthetic picture, which nobody enters at the bedside).

---

## 5. The input panel — the examination, made easier to read

**The input stays the examination tree** (owner, 2026-09-27 — reversing the complaint-first choice made earlier
the same day: *"I prefer the input just being the examination like I had it before"*). The tree's groups,
order and nesting are unchanged. Three things make it easier to take in: plain rows with the common findings
first (§5.2), follow-ups that appear under a ticked finding (§5.3), and an onset and side row at the top (§5.4).

Top to bottom: the chips of entered findings → onset and side row → search → the examination tree → "Or try an
example".

### 5.1 Plain labels and common/less common — `app/plain-labels.js` (content, owner review round 1)

`PLAIN[findingId] = { label, note?, less? }` for **all 234 findings**:
- `label` is a short, plain, COMMA-FREE noun phrase (the "Less common" summary lists labels comma-separated, and
  "taste loss, front of tongue" read as two findings) ("face droop, one side", "eye won't turn in", "saddle numbness",
  "arm weakness"). One table, four consumers: the exam rows, the entered-finding chips,
  the Why line and the search. It closes the parked plain-labels item. The existing `shortFindingLabel()` cuts
  the long descriptions mechanically and cannot sit mid-sentence — the prototype produced "Whitened",
  "Flaccid" and "Supranuclear vertical".
- `note` is a qualifier shown on the exam ROW only — "arm weakness" + *upper motor neuron pattern* carries the
  strict vocabulary where the finding is chosen, while the Why line and the chips stay short ("right arm
  weakness").
- `less: true` marks a finding as less common in ED, which puts it behind its group's "Less common (n)"
  disclosure.

### 5.2 Plain rows, common first

Each row leads with the plain label; the existing technical description sits beneath it in small muted text,
clamped to ONE line (the full text stays in the row's title — three lines of it per row made the list dense
again), so the tree keeps teaching the textbook name.

```
Face droop, one side                                   [L] [R]
Facial weakness (CN VII)
```

Within each leaf group, the common findings show and the rest sit behind **"Less common (n): a, b, c…"**.
Opening it lists them in place. A group header shows how many of its findings are entered ("VII — face ·
1 entered"), so a closed group still says whether it holds part of the case. Search matches every finding
whatever its tag, and a less-common finding that is entered is always shown.

### 5.3 Follow-ups under a ticked finding — `app/follow-ups.js` (content, owner review round 2)

`FOLLOW_UPS[parentId] = [findingId, …]`. When a parent is entered, its follow-ups appear indented beneath it,
so depth appears only where something is abnormal.

**Ruling: a follow-up is only a TRUE REFINEMENT** — it describes the SAME deficit more precisely. A different
kind of finding never nests under a finding, because ticking the parent enters it: myotomes under "leg
weakness" would give a peroneal foot drop a pyramidal finding it does not have (the strict vocabulary,
2026-09-25). Myotomes and dermatomes stay in their own exam groups.

**Draft map, for review** (validated against the model on 2026-09-27 — every id real, every side compatible):

| When this is entered | These appear beneath it |
|---|---|
| Face droop (`facial_weakness`) | forehead spared, forehead weak too, loud sounds uncomfortable, taste loss, dry eye |
| Vertigo (`cn8_vertigo`) | peripheral-type nystagmus, gaze-evoked nystagmus, abnormal head impulse, skew deviation, positional nystagmus (posterior canal), positional nystagmus (horizontal canal) |
| Drooping eyelid (`ptosis`) | small pupil, fixed dilated pupil, fatigable ptosis and double vision |
| Small pupil (`miosis`) | facial anhidrosis |
| Homonymous hemianopia | macular sparing |
| Monocular visual loss (`optic_neuropathy`) | central scotoma, altitudinal defect, RAPD |
| Limb ataxia | dysmetria, dysdiadochokinesis, intention tremor |
| Slurred speech (`dysarthria`) | ataxic (scanning) dysarthria |
| Non-fluent speech | impaired repetition, anomia |
| Impaired comprehension | impaired repetition, anomia |
| Saddle anaesthesia | absent anal wink, absent bulbocavernosus reflex |
| Reduced consciousness | extensor posturing |

**Rules:**
- **Side.** A follow-up takes its parent's side when that side is offered for it (a left face droop → left
  forehead); a finding with a single offer of its own keeps it (the nystagmus types and skew take no side).
  The follow-up's own side buttons still override.
- **A follow-up keeps its home row.** RAPD must stay reachable on its own — an optic TRACT lesion gives an RAPD
  with no monocular visual loss — so nesting never removes a finding from its group. It is not shown twice in
  one view: while it is displayed under a ticked parent in the SAME group, its home row is hidden.
- A follow-up shared by two entered parents (anomia under both aphasia rows) shows under the first.
- A follow-up that is itself a parent (small pupil → facial anhidrosis) shows its own follow-ups when entered.
  The map is acyclic (asserted).
- An entered follow-up stays visible even if its parent is later removed.

### 5.4 Onset and side — the row above the tree

- **When did it start?** *Seconds–minutes · Hours–days · Days–weeks · Weeks–years*, optional, writing the SAME
  `S.onset` (`hyperacute` / `acute` / `subacute` / `chronic`) the What card uses. The What card's control stays
  and the two stay in step. It already travels in the case URL as `o=`.
- **Symptoms on:** *Left · Right · Both*, worded as the BODY side so nobody enters the lesion side. It sets a
  default: tapping a row's label adds the finding on that side, and the row's side buttons still override it
  (a crossed picture needs left face and right body). A pure `tokensForRow(finding, defaultSide)` in
  `app/sides.js` maps the default through `offersFor()`: a finding whose only offer is "Both" or "none" gets
  that offer whatever the default; "Both" adds both sides where both are offered; and **it never returns a
  token the panel does not offer** — the accuracy-round invariant (no offered option returns nothing) extends
  to the new control. With no default set, a row behaves exactly as today. The default is view state and never
  enters the URL.

### 5.5 Search — `app/synonyms.js` (content, owner review round 3)

The box matches the finding id, the long description, the plain label and a bedside-phrase table
(`SYNONYMS[phrase] → [findingId]`: "slurred speech", "droopy eyelid", "dizzy", "Horner", "face droop",
"hemiparesis", "can't find words"…). Today it matches only the id and the long description — measured on
2026-09-27, "foot drop" and "wrist drop" already work (their descriptions contain them), while "slurred speech",
"droopy eyelid", "dizzy", "Horner", "face droop" and "hemiparesis" find nothing. Filtering the tree in place, as today, is unchanged.

### 5.6 Unchanged

The tree's groups and order (`EXAM_TREE`), the sensory-level and distal-reach inputs for cord findings, the
dominant-hemisphere control, the worked examples, Code stroke and Atlas modes. Nothing new enters the URL:
follow-ups are derived from the entered findings, so a restored case shows them as they were.

**Considered and declined (2026-09-27):** start-from-the-complaint input (reversed in favour of the tree); a
body map; and moving the compare panel's "examine next" suggestions to the top of the exam panel.

---

## 6. Units

| File | Kind | Purpose |
|---|---|---|
| `src/engine/why.js` | engine, extended | `whyClues(chain, observed, opts)` |
| `app/plain-labels.js` | content | `PLAIN` — label + less-common tag for all 234 findings |
| `app/follow-ups.js` | content | `FOLLOW_UPS` + `visibleFollowUps(entered)` |
| `app/synonyms.js` | content | `SYNONYMS` + `searchFindings(query)` |
| `app/answer.js` | pure | `whereLine` / `whySentence` / `whatLine`, `resolveNext()` (the ONE workup resolution the Next card also uses) and `answerFor()` → the five lines |
| `app/sides.js` | pure, extended | `tokensForRow(finding, defaultSide)` |
| `app/app.js`, `app/index.html` | DOM | the rows, the card, the closed detail, the strip |

Content files import no UI; the pure modules are DOM-free; only `app.js` touches the DOM — the split the app
already uses.

## 7. Tests (TDD, one standalone suite per new unit)

- **`test/plain-labels.test.js`** — every `FINDINGS` id has a label; no underscores; short enough to sit
  mid-sentence; no two findings share a label (the chips would be ambiguous); every leaf group of `EXAM_TREE`
  keeps at least one finding NOT tagged less common, so no group opens empty.
- **`test/follow-ups.test.js`** — every parent and follow-up id is real; the map is acyclic; each follow-up
  either offers every side its parent offers or has a single offer of its own; `visibleFollowUps()` shows a
  follow-up once when two parents share it, keeps an entered follow-up after its parent is removed, and hides
  the home row only within the parent's own group; RAPD stays reachable without monocular visual loss.
- **`test/synonyms.test.js`** — every phrase resolves to real ids; "foot drop" → `weak_ankle_dorsiflexion`,
  "slurred speech" → `dysarthria`.
- **`test/why.test.js`** (extended) — the §4 table's cases; for every non-empty site's own picture and every
  vignette: the clues' own explain-all places lie within the full meet; at most 3 clues shown; when the picture
  is crossed both relations appear; clue tokens are a subset of the entered findings; a both-sides finding is
  one clue.
- **`test/answer.test.js`** — Next equals the referral verbatim; each What path (concordant, set aside by
  onset, cause selected, entity selected, two lesions); the red line appears exactly when `nameForSite().red`
  exists; Where names the others and caps at two.
- **`test/side-offers.test.js`** (extended) — `tokensForRow()` never returns an unoffered token, for every
  finding × default side.
- **Unchanged and must stay green:** the case-URL round trip, `examples.test.js`, `contrast.test.js`,
  `brand.test.js`, and `app-smoke.test.js`'s full-coverage check of `EXAM_TREE`. **The answer card reuses `.out-head`**, already on
  the `--terra` allowlist as the focal answer card, so the allowlist does not change.
- `test/app-smoke.test.js` parse-checks every new `app/*.js` automatically.
- **Browser:** the four worked examples and a crossed case, desktop and 375px, light and dark; the strip
  appears and hides; a nav link opens its section without rewriting the hash; ticking face droop shows its
  follow-ups on the same side, and unticking it leaves an entered follow-up in place.

## 8. Rollout

1. `whyClues()`, TDD.
2. **Review round 1:** the 234 plain labels and their common/less-common tags.
3. **Review round 2:** the follow-up map (§5.3).
4. **Review round 3:** the search phrases.
5. The answer card and the closed detail; then the exam rows, follow-ups and the onset/side row; then the
   phone strip.
6. Browser verification, then merge. Version **v0.9.0 → v0.10.0** so a feedback email names the new build.
   A push to `main` auto-deploys.

Content rounds come before the UI that shows them, one at a time — the owner's review rhythm since tranche 1.

## 9. Out of scope

- No change to the engine's localisation, ranking or any clinical table. `whyClues()` reads the differential;
  it does not change it.
- No change inside the four detail cards.
- Atlas and Code stroke modes.
- The usage counter's localhost guard, the dead `--mimic`/`--iatro` tokens and the `.cs-lvo.pos` appearance
  flag remain separate items.
- Measuring whether this helped: the usage counter counts opens, not comprehension. Asking the same testers
  again after v0.10.0 ships is the test.

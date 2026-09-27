# ED first glance: the answer card and complaint-first input (design, 2026-09-27)

**Status: DESIGN — approved section by section by the owner on 2026-09-27; awaiting review of this written spec.**
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
4. **Input: option 1, start from the complaint** (chosen over plain-word search alone and a body map), with the
   plain-word search folded in.
5. **Onset is asked up front**, optional, on the input side.
6. **The Why line: key clues + side** — the fewest findings that pin the place, each tagged with its body side.
7. **Phones get a sticky answer strip.**
8. **The site's red-flag sentence is a fifth line on the answer card** whenever the site has one.

**Prior rulings this design keeps.** The 2026-08-16 clarity pass ruled that the reasoning stays in ONE scroll
in a FIXED order, and rejected tabs because *a trainee could skip Why, which is the teaching payload*. The
order is unchanged, the detail is closed rather than tabbed, and the answer card itself carries a Why line, so
the reasoning's gist is on screen before anything is opened. **What does change:** the detail cards are now
closed by default. That is the point of the round and is stated here so it is not mistaken for a regression.
The 2026-09-25 vocabulary ruling (`weak_arm`/`weak_leg` mean pyramidal weakness) is carried by the plain
labels (§5.1): "Arm weakness (upper motor neuron)".

---

## 3. The results panel

### 3.1 The answer card

Replaces today's hero card (site name + urgency + "2 lesions explain all 7 findings"). Keeps the urgency
badge, the site id toggle and "Report a problem" in its header.

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
`app/answer.js`, builds them (`answerSummary(...)` → `{ where, why, what, next, red }`), so every path is
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
the answer card. It hides whenever the card is on screen (an `IntersectionObserver`), sits above the safety
bar, and does not exist on desktop.

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
1. The clue units are the explained steps of `whyChain()`, with a finding entered on BOTH sides treated as one
   unit (tagged "bilateral").
2. Greedy: repeatedly add the unit that gives the smallest explain-all place set for the chosen units, where a
   place is `(station, side)` exactly as `whyChain().meet` computes it. Ties go, in order, to (a) a unit whose
   side relation (same / opposite) is not yet represented among the chosen, (b) the unit with fewer possible
   stations, (c) the earlier-entered unit. Stop as soon as the chosen units' place set lies within the full
   picture's meet.
3. **Crossed completion.** When the explained steps include both a same-side and an opposite-side finding, the
   clues carry only one kind, and fewer than 3 clues were chosen, append the first finding of the missing kind
   in `whyChain()`'s step order (fewest possible stations first, then entry order). This is what makes the crossed
   pattern visible: Wallenberg gains "right body pain loss".
4. Show at most 3 clues; if more were needed, append "+ n more findings".

**Rendering:** each clue is `{side tag}{plain label}` (§5.1), side tag "left " / "right " / "bilateral " / none
for midline and non-lateralised findings; clues joined by " + ".

- verdict **one**: "{clues} → only the {side} {station}."
- verdict **several**: "{clues} → the {side} {A, B or C}; see Where for what separates them." — or, when the
  stations form a range, "… → anywhere from the {X} to the {Y}; …"
- verdict **none**: "No single place explains every finding."

**Prototype output (2026-09-27, against `test/clinical-vignettes.test.js`, with interim plain labels):**

| Case | Why line |
|---|---|
| Weber | Left eye won't turn in + right arm weakness → only the left midbrain. |
| Wallenberg | Left face pain loss + left swallowing difficulty + right body pain loss → only the left medulla. |
| Medial medullary | Left tongue weakness + right arm weakness → only the left medulla. |
| Brown-Séquard | Left leg weakness + right body pain loss → only the left spinal cord. |
| Complete dominant MCA | Non-fluent speech + poor comprehension → only the left cerebral cortex. |
| L5 radiculopathy | Left L5 numbness → the left nerve root or plexus; see Where for what separates them. |
| Hemiparesis alone | Right arm weakness → anywhere from the cerebral cortex to the spinal cord; see Where … |

Cost: one `differential()` call per candidate unit per round — 162ms worst case on a site's full synthetic
picture, far less on a bedside subset. Memoise per render if it shows in the browser.

---

## 5. The input panel

Top to bottom: complaints → onset → side → the chosen complaints' findings → search → Full examination →
"Or try an example". The chips of entered findings stay at the top of the panel.

### 5.1 Plain labels — `app/plain-labels.js` (content, owner review round 1)

`PLAIN[findingId]` — a short, plain noun phrase for **all 234 findings** ("face pain loss", "eye won't turn
in", "saddle numbness", "arm weakness (upper motor neuron)"). One table, four consumers: the complaint rows, the
entered-finding chips, the Why line and the search. It closes the parked plain-labels item.

The existing `shortFindingLabel()` cuts the long descriptions mechanically and cannot be used mid-sentence —
the prototype produced "Whitened", "Flaccid" and "Supranuclear vertical". The long `desc` stays as the row's
tooltip and in the Full examination tree.

### 5.2 Complaints — `app/complaints.js` (content, owner review round 2)

Eleven chips, **multi-select**. Each lists 8–13 findings, most common in ED first. A finding may sit under
several complaints; when two chosen complaints share one it is shown once, under the first. **Draft, for
review:**

| Complaint | Findings (by id) |
|---|---|
| Weakness | weak_arm, weak_leg, facial_weakness, weak_hand, weak_ankle_dorsiflexion, weak_wrist_extension, babinski, spasticity, reflex_ankle_loss, wasting, fatigable_weakness, proximal_weakness, hoovers_sign |
| Numbness | spinothalamic, dorsal_sensory, face_pain_loss, distal_sensory_loss, saddle_anaesthesia, median_sensory, ulnar_sensory, sensory_c6, sensory_l5, sensory_s1, radicular_pain |
| Speech or swallowing | dysarthria, speech_nonfluent, comprehension_impaired, naming_impaired, repetition_impaired, dysphagia, vocal_cord_palsy, cn12_palsy, palatal_weakness |
| Vision | homonymous_hemianopia, optic_neuropathy, central_scotoma, altitudinal_defect, bitemporal_hemianopia, rapd, va_reduced_no_pinhole, va_reduced_pinhole_corrects, papilloedema, retinal_pallor |
| Double vision or droopy eyelid | ptosis, weak_abduction, weak_adduction, vertical_diplopia, fixed_dilated_pupil, miosis, ino, gaze_palsy, skew_deviation, fatigable_ocular |
| Dizziness | cn8_vertigo, nystagmus_peripheral, head_impulse_abnormal, nystagmus_gaze_evoked, skew_deviation, hearing_loss, nystagmus_positional_posterior, truncal_ataxia, limb_ataxia |
| Face droop | facial_weakness, forehead_spared, forehead_involved, hyperacusis, taste_loss, lacrimation_loss, dysarthria, weak_arm |
| Unsteady or clumsy | limb_ataxia, truncal_ataxia, dysmetria, intention_tremor, sensory_ataxia, dorsal_sensory, nystagmus_gaze_evoked, ataxic_dysarthria |
| Drowsy or confused | reduced_consciousness, gaze_deviation, fixed_dilated_pupil, neglect, amnesia, extensor_posturing, papilloedema, preserved_vertical_gaze |
| Back pain with leg symptoms | radicular_pain, saddle_anaesthesia, sphincter_dysfunction, reflex_ankle_loss, reflex_knee_loss, weak_leg, weak_ankle_dorsiflexion, weak_great_toe_extension, weak_foot_eversion, spinothalamic, anal_wink_loss |
| Abnormal movements | rest_tremor, bradykinesia, rigidity, chorea, hemiballismus, dystonia, intention_tremor, fasciculations |

Every finding not listed stays reachable through the search and the Full examination tree. The draft covers 88
of the 234 findings and every finding in the four worked examples (big-toe extension and foot eversion sit
under *Back pain with leg symptoms* for the Foot drop example — they are the root-level discriminators of a
sciatica exam). Four of the 13 cross-site archetypes use findings outside every complaint; those show as chips
only, which is correct for a picture loaded rather than entered.

### 5.3 Onset — "When did it start?"

One optional row: *Seconds–minutes · Hours–days · Days–weeks · Weeks–years*, writing the SAME `S.onset`
(`hyperacute` / `acute` / `subacute` / `chronic`) the What card uses. The What card's control stays, and the
two stay in step. It already travels in the case URL as `o=`.

### 5.4 Side — "Which side are the symptoms?"

*Left · Right · Both*, worded as the BODY side so nobody enters the lesion side. It sets a default: tapping a
row adds the finding on that side; the row's side buttons still override it (a crossed picture needs left face
and right body). A pure `tokensForRow(finding, defaultSide)` in `app/sides.js` maps the default through
`offersFor()`:
- a finding whose only offer is "Both" or "none" gets that offer whatever the default;
- "Both" adds both sides where both are offered;
- **it never returns a token the panel does not offer** — the accuracy-round invariant (no offered option
  returns nothing) extends to the new control.

With no default set, a row behaves exactly as today. The default is view state and never enters the URL.

### 5.5 Search — `app/synonyms.js` (content, owner review round 3)

The box matches the finding id, the long description, the plain label and a bedside-phrase table
(`SYNONYMS[phrase] → [findingId]`: "foot drop", "slurred speech", "droopy eyelid", "can't find words",
"wrist drop", "numb saddle"…). Today it matches only the id and description, so "slurred speech" and
"foot drop" find nothing. While a query is non-empty the matches show as one flat list of rows in place of
the complaint rows; clearing it restores them.

### 5.6 Unchanged

The Full examination tree (today's `EXAM_TREE`, behind a disclosure), the sensory-level and distal-reach
inputs for cord findings, the dominant-hemisphere control, Code stroke and Atlas modes.

### 5.7 Examples and shared links

The chosen complaints are DERIVED from the findings: loading a worked example or restoring a case URL selects
every complaint containing any entered finding, so its rows show as entered. Loading Wallenberg selects
Dizziness, Numbness, Double vision or droopy eyelid, and Speech or swallowing. Nothing new enters the URL.

---

## 6. Units

| File | Kind | Purpose |
|---|---|---|
| `src/engine/why.js` | engine, extended | `whyClues(chain, observed, opts)` |
| `app/plain-labels.js` | content | `PLAIN` for all 234 findings |
| `app/complaints.js` | content | `COMPLAINTS` + `complaintsFor(tokens)` |
| `app/synonyms.js` | content | `SYNONYMS` + `searchFindings(query)` |
| `app/answer.js` | pure | `answerSummary(...)` → the five lines |
| `app/sides.js` | pure, extended | `tokensForRow(finding, defaultSide)` |
| `app/app.js`, `app/index.html` | DOM | the panel, the card, the closed detail, the strip |

Content files import no UI; the pure modules are DOM-free; only `app.js` touches the DOM — the split the app
already uses.

## 7. Tests (TDD, one standalone suite per new unit)

- **`test/plain-labels.test.js`** — every `FINDINGS` id has a label; no underscores; short enough to sit
  mid-sentence; no two findings share a label (the chips would be ambiguous).
- **`test/complaints.test.js`** — every id is real and has at least one side offer; each complaint has 8–13
  findings with no duplicates; every finding in the four worked examples (`EXAMPLES`) sits under some complaint;
  `complaintsFor()` returns the four for Wallenberg.
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
  `brand.test.js`. **The answer card's accent is terracotta** — it IS the answer — so it needs a justified
  entry on the `--terra` allowlist.
- `test/app-smoke.test.js` parse-checks every new `app/*.js` automatically.
- **Browser:** the four worked examples and a crossed case, desktop and 375px, light and dark; the strip
  appears and hides; a nav link opens its section without rewriting the hash.

## 8. Rollout

1. `whyClues()`, TDD.
2. **Review round 1:** the 234 plain labels.
3. **Review round 2:** the complaint table (§5.2).
4. **Review round 3:** the search phrases.
5. The answer card and the closed detail; then the input panel; then the phone strip.
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

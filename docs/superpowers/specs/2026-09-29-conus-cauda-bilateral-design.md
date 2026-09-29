# The conus and cauda signs are on both sides (design, 2026-09-29)

**Status: APPROVED (2026-09-29).** Branch: `fix/conus-cauda-bilateral`, stacked on `fix/onset-follows-cause` (PR #14)
at `49441eb`. Ships as v0.10.2, after PR #14.

This closes the second of the two items left open by the ED first-glance release (PR #13), recorded there as "the
cauda equina example's Why line leads with sciatica-type root pain". The Why line was the symptom. The defect
underneath is a false two-lesion claim on the two classic textbook pictures.

---

## 1. Why

The worked example "Cauda equina" enters sciatica on **midline** (the "M" button) and reads:

```
Why   Sciatica-type root pain (radicular pain) → only the cauda equina.
```

The clue is right. Only the cauda emits MIDLINE root pain, and saddle numbness alone leaves the conus and the cauda
both in play. But `whySentence` prints a side word only for left or right, so the qualifier that did the narrowing
is dropped. The line reads as if any sciatica meant cauda equina.

Underneath, the conus and the cauda emit their LIMB signs on midline, while every other site emits those signs left
or right. A clinician enters limb signs with L, R or "Both" (left + right). On `main`:

| Entered | `main` says |
|---|---|
| Saddle numbness + sphincter + sciatica on **both** sides | "These findings need more than one lesion — see Together." |
| Saddle numbness + sphincter + sciatica on **one** side | "These findings need more than one lesion" |
| Saddle numbness + sphincter + **both** plantars up + brisk reflexes (the conus) | "These findings need more than one lesion" |
| Saddle numbness + sphincter + **both** legs flaccid-weak + wasting (the cauda) | "These findings need more than one lesion" |
| Saddle numbness + sphincter + **one-sided** flaccid weakness + floppy tone | "These findings need more than one lesion" |

Accuracy round 1 called a false two-lesion claim the most serious class of error, because it tells a clinician that
a patient with one lesion has two. It fixed the same thing for the cauda's ankle jerks: `cauda_ankle_reflex` got
`emit: "bilateral"`, and the cauda became `asymmetric`. The other limb signs were not swept.

## 2. Rulings (owner, 2026-09-29)

1. **All seven conus and cauda limb signs are emitted on both sides**, the ankle-jerk precedent (accuracy round B7).
   Chosen over fixing only the cauda's root pain (the conus and the cauda's weakness would still say two lesions)
   and over rewording the Why line only (cosmetic).
2. **Unchanged:** saddle numbness, sphincter dysfunction and anal wink stay MIDLINE — they are midline by nature.
   The cauda stays `asymmetric` and the conus symmetric (owner ruling 2026-09-25: the conus is "early and symmetric
   by its own description"). So saddle numbness + sphincter + ONE up-going plantar still says two lesions; that is
   the symmetric-conus ruling working as intended, and it is not reopened here.

## 3. The model — `src/model/structures.js`

`emit: "bilateral"` on seven structures:

| Structure | Site | Finding |
|---|---|---|
| `ls_roots_pain` | cauda | radicular pain (sciatica) |
| `ls_roots_motor` | cauda | flaccid (LMN) weakness |
| `cauda_hypotonia` | cauda | floppy tone |
| `cauda_wasting` | cauda | wasting |
| `conus_bab` | conus | up-going plantar |
| `conus_cst` | conus | brisk reflexes |
| `conus_spast` | conus | spasticity |

Three notes end in "midline", which becomes wrong: `conus_spast` "increased tone (UMN), midline",
`cauda_hypotonia` "flaccid, hypotonic legs, midline", and `cauda_wasting` "denervation wasting, midline". The word
"midline" becomes **"both legs"**. The carrier text (before " — ") is untouched.

**Side offers follow automatically.** `offersFor` derives from what the structures emit, so the seven rows lose
the "M" button and offer L and R, with "Both" from the side row.

## 4. What changes — measured on a prototype

| Entered | After |
|---|---|
| Saddle + sphincter + sciatica both sides | **Cauda equina**, one lesion. Why: *"Bilateral sciatica-type root pain (radicular pain) → only the cauda equina."* |
| Saddle + sphincter + sciatica one side | **Cauda equina**. Why: *"Saddle numbness (saddle anaesthesia) + left sciatica-type root pain (radicular pain) → only the cauda equina."* |
| Saddle + sphincter + both plantars up + brisk (± spasticity) | **Conus**. Why: *"Saddle numbness (saddle anaesthesia) + bilateral up-going plantar (Babinski sign) → only the conus."* |
| Saddle + sphincter + both legs flaccid-weak + wasting | **Cauda equina**. Why: *"Saddle numbness (saddle anaesthesia) + bilateral flaccid weakness → only the cauda equina."* |
| Saddle + sphincter + one-sided flaccid weakness + floppy | **Cauda equina** |
| Left sciatica alone | Unchanged first answer (L1 root). The cauda is now a candidate, **23rd of 24**, because it is asymmetric |
| Left L5 / S1 / C6 radiculopathy with its deficit | Unchanged; the cauda does not appear |
| Isolated left up-going plantar | Unchanged verdict and differential — the conus is ruled out by the known-negative rule. The finding's "could arise at" list now names the conus, which does produce a left up-going plantar |
| Bilateral transverse cord picture | Unchanged answer. Its Why clue moves from the bilateral plantar (now shared with the conus) to bilateral body pain loss |
| Guillain–Barré (symmetric LMN + areflexia) | Unchanged answer. Its clues reorder — bilateral knee jerks lost, then bilateral flaccid weakness (which now also fits the cauda) |

## 5. The worked example — `app/examples.js`

The cauda example's tokens are re-derived from the site's own predicted findings and trimmed to a realistic bedside
subset, never hand-typed (the 2026-08-16 lesson): saddle numbness, sphincter dysfunction, anal wink lost, and
sciatica on **both** sides. Its Why line becomes *"Bilateral sciatica-type root pain (radicular pain) → only the cauda
equina."* Bilateral sciatica is the recognised red flag, which answers the concern this item was raised for. The
site's own red-flag line already names it ("…new saddle anaesthesia, bladder dysfunction or bilateral sciatica needs
urgent MRI and decompression"). Its What and Next lines are unchanged.

## 6. Saved case links — `app/sides.js`, `app/app.js`

A link saved before this change can carry one of the seven on midline. Nothing emits that token any more, so the
link would now load a false two-lesion answer. When a case loads, a token on a side its finding is no longer offered
on is converted: **midline → left + right**, where both are offered. Anything else unoffered is dropped. This is one
small generic function in `app/sides.js` (`currentTokens(tokens)`), applied where `app.js` decodes the hash. It also
covers any future side change.

## 7. A dead rule removed — `src/engine/inverse.js`

`normalNegatives()` has a both-sides → midline rule: down-going plantars on both sides count against a MIDLINE
up-going plantar. It was written for the midline conus, and after §3 no structure emits `babinski@midline`, so it is
dead. It is removed. Down-going plantars on both sides still demote the conus, through the ordinary per-side rule:
the conus now predicts `babinski@left` and `babinski@right`.

## 8. Tests

**Fixture updates (old midline form → left + right)**, in the suites that entered these signs on midline:

- `cauda-conus`
- `tone`
- `discriminators`
- `clinical-vignettes` (the cauda and conus vignettes)
- `examples`
- `answer` (the cauda card)
- `vocab-rulings` (the conus picture, and the both-sides normal)
- `why` (the isolated-Babinski "could arise at" list, and the Guillain–Barré clue order — §4)

Each is a change of representation. None of them may loosen what the test asserts.

**New assertions** in `test/cauda-conus.test.js`:

- the five pictures in §4's first five rows resolve to ONE lesion, with the named site first;
- none of the seven findings is offered on midline, and all seven are offered left and right;
- `currentTokens` converts a legacy `radicular_pain@midline` to left + right and drops an unoffered token, and a
  legacy cauda link loads the cauda;
- both down-going plantars demote the conus.

## 9. Anatomy sheet and rollout

1. TDD per §8; full suite green.
2. The seven rows of `docs/artifacts/anatomy-model.html` change badge from MIDLINE to BILAT, with the three note
   words (§3); ids verified against the model. Republished after the owner's review.
3. **Owner review:** the model change (§3), the note words, and the §4 table.
4. Browser check of the worked example and of a "Both" entry.
5. v0.10.2; CLAUDE.md section; a PR stacked on PR #14. Merge PR #14 first — merging deploys to testers.

## 10. Out of scope

- **Making the conus asymmetric** — ruled symmetric on 2026-09-25.
- **Other midline sites.** The sweep found only these seven limb findings offered on midline AND on a side (plus
  sphincter dysfunction, which is midline by nature and correctly offered both ways).

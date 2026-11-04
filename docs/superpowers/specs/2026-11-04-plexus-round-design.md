# The plexus round — what each plexus element carries (design, 2026-11-04)

**Status: RULED (2026-11-05). Round 1: every recommendation APPROVED as written. Rows 3–7 IMPLEMENTED (2026-11-05,
`f5af58c..e171a4e`, plan `docs/superpowers/plans/2026-11-05-plexus-round.md`): `npm test` 87 suites / 7399 green; audit
105/115 probes, 1046 passed / 13 failed. Rows 8–10 wait for content round 2 (§9).**

> *"Approve as written"* — the owner, on round 1 of the plexus round

Every recommendation in §4 is now a ruling:
- **Rows 3–7 are built next.** Each plexus element carries the cutaneous row of the mixed nerves that arise wholly
  from it; branch and pure-sensory nerves stay out.
- **Rows 1–2 change nothing now.** Root rows are tagged only where a root divides. Radicular pain stays shared with the
  plexus.
- **Rows 8–9 are approved together.** The L4 split is built only with a whole lumbosacral plexus place, after content
  round 2 (§9).
- **Row 10 is decided in content round 2.** It asks whether to add a whole brachial plexus place.
- **Rows 11–16 are approved:** the wording, the one re-pin, the four audit probes and the new suite.

The implementation plan for rows 3–7 follows this ruling.
- Branch: `fix/plexus-round` (worktree `Code/neurolocaliser-plexus/`). It was cut from `fix/content-gaps` and
  fast-forwarded to that branch's tip, `4d781bd` (the content-gap fix, implemented). Not pushed; no PR. The stacked PRs
  (#18 → #20 → #21 → #19) are the owner's to merge.
- **Every number below was measured on throwaway copies of `4d781bd`**, outside the repo, unless a line says otherwise.
  A first pass ran on `d75f60b` with the content-gap rows applied as flags. It agreed on every card and every test
  failure, and none of its numbers are quoted here.

This round came out of the content-gap round, not the audit. That round's observation O1 found that every plexus
element is a plain union of its roots, and its row 5 (the upper trunk's musculocutaneous row) was deferred here. **No
counted audit check fails because of this round's defects, and no option below changes one.** The measures are the
answer card, the safety sample and `npm test`.

**Headline (measured).** The recommended set for now is rows 3–7. It gives four plexus elements the cutaneous rows of the
mixed nerves that arise wholly from them, and leaves radicular pain where it is. It ends four two-lesion cards that are
one plexopathy:
- Erb's palsy with lateral forearm numbness;
- a lumbar plexopathy entered as femoral and obturator numbness;
- a sacral plexopathy entered as sciatic numbness with a weak gluteus medius;
- a lower-trunk lesion entered with little-finger numbness.

In the safety sample, 11 claims become one plexus and none are added. The audit stays at 1034 / 13. `npm test` fails one
assertion, the content-gap suite's deliberate "row 5 deferred" pin.

The L4 split (rows 8–9) is recommended too, but only together with a new place, a whole lumbosacral plexus. That place
needs a content round first (§9). Made alone, the split turns 9 sampled pictures into two-lesion claims.

---

## 1. What is wrong

The real answer card (`app/answer.js` `answerFor`) on `4d781bd`:

| Picture (left side) | Where today | What today |
|---|---|---|
| Erb with lateral forearm numbness (deltoid, spinati, biceps, biceps jerk, deltoid patch, lateral forearm) | No single place explains every finding — likely upper trunk and musculocutaneous nerve | Together: Vasculitis |
| Lumbar plexopathy in nerve words (hip flexion, knee extension, hip adduction, knee jerk, front- and inner-thigh numbness) | … likely femoral nerve and obturator nerve | Together: Mononeuritis multiplex. Next: EMERGENCY (the femoral nerve's haematoma plan) |
| Sacral plexopathy in nerve words (below-knee numbness, hamstrings, foot drop, plantarflexion, ankle jerk, weak hip abduction) | … likely sciatic nerve and sacral plexus | Together: Vasculitis |
| Lower trunk with little-finger numbness (ulnar numbness, T1 numbness, weak thumb and finger abduction) | … likely T1 root and medial cord | Together: Vasculitis |
| L4 root (R1 #4: knee extension, hip adduction, knee jerk, L4 numbness) | L4 root. 2 other places also fit: lumbar plexus, **sacral plexus** | Lumbar spondylosis |
| L4: quadriceps + foot drop + knee jerk + medial shin | L4 root. 2 other places also fit: lumbar plexus, sacral plexus | Lumbar spondylosis |
| Knee jerk and ankle jerk lost on one side | **Sacral plexus** | Pelvic malignancy (URGENT oncology) |
| Foot drop alone | Deep peroneal nerve. 6 other places also fit, including the **lumbar plexus** | Anterior tarsal tunnel |
| Compare panel, sciatic nerve vs sacral plexus (knee flexion + foot drop + plantarflexion + ankle jerk) | Examine to separate them; these four → the plexus: **an absent knee jerk, L4 numbness, weak hip adduction, weak knee extension** | — |

The first four are false two-lesion claims, the class the false-multifocal fix fought. The next five teach anatomy that is
wrong: the sacral plexus does not carry the quadriceps, the knee jerk, the adductors or medial-shin sensation, and the
lumbar plexus does not carry tibialis anterior. The compare panel turns the error into an instruction: it tells the
reader to test the knee jerk to find a sacral plexopathy.

## 2. Why it happens

`composePlexusSites` (`src/model/sites.js`) builds each element as **every row of every root that feeds it**. Since the
content-gap row 4, the upper trunk also reuses the axillary nerve's sensory row. Three things follow:

1. **A root that divides between two elements gives all its rows to both.** L4's femoral and obturator fibres join the
   lumbar plexus; its lumbosacral-trunk fibres (tibialis anterior and posterior) join the sacral plexus. Today both
   elements take all of L4. L4 is the only modelled root that divides.
2. **Rows that are the root's own come along.** Each root's radicular-pain row travels into its trunk or plexus (§3.2).
3. **An element carries no nerve's cutaneous row except the upper trunk's axillary one.** A plexopathy entered in the
   nerve-territory words a clinician tests (front of thigh, inner thigh, below the knee, lateral forearm, little finger)
   is two nerves.

## 3. The decisions that are more than content

### 3.1 How a root row says where it travels

| Option | What it is | Verdict |
|---|---|---|
| **A. A tag only where a root divides (recommended)** | An element takes its roots' rows, as today. A row of a root that feeds two elements names the element or elements its fibres travel in, as a `plexus` field on the structure (as `crosses` and `emit` are). The nerve rows an element reuses stay in the composer's `nerves` list, the content-gap row-4 idiom. A guard test fails if a dividing root's row names no element | The eight L4 rows carry a tag; the wasting and pain rows name both elements. Nothing else in the tables changes |
| B. Every root row names its nerve; each element is derived from the nerves downstream of it | About 60 clinical tags (C5 abduction → axillary + suprascapular; C6 elbow flexion → musculocutaneous + radial; …) | Same behaviour as A: every C5–T1 nerve lies downstream of its own trunk, so the tags change nothing outside L4. A dermatome has no single nerve (C6: musculocutaneous, radial and median) |
| C. A hand list of rows in the composer | — | Rejected. Hand-listed composites go stale when their source gains a row (the thalamic-aphasia copy, B11; the striatocapsular `ic_hyper`) |

### 3.2 Radicular pain: root-only or shared?

The 2026-07-12 PNS spec meant root pain to point at the root ("a single dermatome/pain → root"). It still does on the
display: every radiculopathy picture already leads with its root, by over-prediction and by the root's COMMON prior. The
question is whether a plexus element should stop predicting the pain at all.

| | Shared (today, **recommended**) | Root-only (P1) |
|---|---|---|
| Audit | — | 0 change |
| `npm test` | — | 4 fail: `pns` "C7 picture → root_c7" ×2 and its naming check (the scored `best`: the middle trunk, now the C7 root minus its pain, over-predicts less; the display still shows the root first), and `discriminators` "root vs plexus leads with a reflex …" (root pain now splits them and sorts first alphabetically) |
| Radiculopathy cards (C5, C6, C7, C8, L4, L5, S1 with root pain) | The root first, with its trunk or plexus also fitting | The root without its trunk or plexus; the Why line reads "… + root pain → only the left nerve root" |
| **A painful plexopathy entered with root pain** | One plexus | **Two lesions.** Erb + root pain → "C5 root + upper trunk — Vasculitis". Diabetic amyotrophy + root pain → "L3 root + lumbar plexus — Vasculitis" |
| Safety sample (§5) | — | 0 claims ended, **9 new claims**; 445 covers change, **381 grow from two places to three** |
| The musculocutaneous row's cover moves (row 3) | 20 | 4 |

**Root-only costs far more than it buys.** The plexus's own phonebook names painful diseases: diabetic lumbosacral
*radiculo*plexus neuropathy, neuralgic amyotrophy, malignant infiltration. Root pain is real in them, because they reach
the roots. P1 also makes the middle trunk a strict subset of the C7 root. The cover moves that motivated P1 are 20 covers
of one row (row 3), and changing covers is the tie-break round's remit (O3, `fix/cover-tiebreak`).

### 3.3 L4's two plexuses, and the plexopathy that spans both

The split itself is anatomy (row 8): L4's quadriceps, knee jerk, adductors and medial-shin dermatome travel in the lumbar
plexus, and its tibialis anterior and posterior in the sacral plexus. Today the sacral plexus's borrowed L4 rows stand in
for a plexopathy that spans both plexuses, and the model has no such place. Neoplastic lumbosacral plexopathy is
classified the same way (Jaeckle): upper (lumbar), lower (sacral) and pan-plexopathy. Diabetic lumbosacral
radiculoplexus neuropathy often spans both.

Measured on top of the recommended rows 3–7:

| Option | Sample | Cards | `npm test` |
|---|---|---|---|
| S1. Split alone | 1 claim ended, **9 new**: 3 two-root pairs (L2 + L4, L4 + L5, L4 + S1), an L4 root with an obturator neuropathy, and 5 pairs with a lumbar or sacral plexus picture. All 9 offer "Vasculitis". 302 covers change, 293 of them growing to three places; every one of the 293 pairs has a lumbar or sacral plexus picture that carries L4 signs the plexus no longer gives | R1 #4 lists only the lumbar plexus. Quadriceps + foot drop → **L4 root alone**. Foot drop alone stops listing the lumbar plexus. The compare panel stops offering the knee jerk, L4 numbness, hip adduction and knee extension for sciatic vs sacral plexus. **Knee + ankle jerk lost on one side → "femoral + tibial nerves — Mononeuritis multiplex", EMERGENCY** | clean |
| **S2. Split + a whole lumbosacral plexus (recommended, with §9's content first)** | **7 more claims end, none added.** 302 covers change, but only 6 grow; 291 move from the lumbar or sacral plexus to the lumbosacral one (O3) | Knee + ankle jerk → "Left lumbosacral plexus". Quadriceps + foot drop → "L4 root. 1 other place also fits: lumbosacral plexus". Every lumbar root and plexus picture lists the lumbosacral plexus as also fitting. **The foot-drop worked example gains a fourth candidate**: "… 3 other places also fit: L5 root, sacral plexus, and 1 more." | 4 fail: the row-5 pin (row 14), the topography table's missing key (content), and two pins of the worked example ("three candidates"; "Where names the other two") |
| S3. Neither (today) | — | — | — |

The prototype's lumbosacral place had no curated content, so its What line was the derived fallback ("Neoplastic /
compressive"). §9 lists what it needs before it can ship.

### 3.4 Which nerve territories an element carries

The upper trunk already reuses the axillary row (content-gap row 4). The rule proposed here is that **an element carries
the cutaneous row of each mixed nerve that arises wholly from it.**
- Upper trunk: axillary (done) and musculocutaneous.
- Lumbar plexus: femoral and obturator.
- Sacral plexus: sciatic.
- Lower trunk: ulnar (palmar).

Branch and pure-sensory nerves keep pinning their own territory: deep and superficial peroneal, tibial, sural, saphenous,
lateral femoral cutaneous and dorsal ulnar.

| Option | Sample | Cards | `npm test` |
|---|---|---|---|
| None beyond row 4 (today) | — | the four two-lesion cards of §1 | — |
| **Mixed nerves (recommended)** | 11 claims become one plexus, none added; 41 covers change places (20 musculocutaneous → upper trunk, 8 sciatic → sacral, 7 femoral and 6 obturator → lumbar), none grow, and 3 change their suggested disease | The four cards become one place. Femoral, obturator, sciatic and musculocutaneous neuropathy each list their plexus as also fitting, and the Why line reads "the plexus or peripheral nerve" instead of "only the peripheral nerve". The compare panel then names the classic test: inner-thigh numbness for femoral vs lumbar plexus, front-of-thigh numbness for obturator vs lumbar plexus, the deltoid patch for musculocutaneous vs upper trunk | 1 fail: the "row 5 deferred" pin |
| Broad (every nerve and branch in the territory) | not snapshotted on `4d781bd` | Meralgia, sural and saphenous numbness each list a plexus. **First web-space numbness no longer pins the peroneal nerve**: the sacral plexus gives it too | 3 more fail, the foot-drop worked example's own checks ("… and it confirms the NERVE, not the root"; "nerve-vs-root and root-vs-plexus lead with DIFFERENT examinations"; "root vs plexus leads with a reflex …") |

## 4. Rulings — round 1 (16 rows, all APPROVED as written, 2026-11-05)

Each row is one decision, with my recommendation. The owner approved the table as written, so every recommendation below
is now a ruling. Measured effects are against `4d781bd`, and for rows 3–7 they were also confirmed inside the recommended
set.

### A. How rows travel, and root pain

| # | Decision | Recommendation | Measured effect |
|---|---|---|---|
| 1 | How a root row says where it travels | **Option A (§3.1):** a `plexus` field on the rows of a root that divides (only L4); nerve rows stay in the composer's `nerves` lists; a guard test pins each element's composition. Built with row 8 | — |
| 2 | Radicular pain becomes a root-only sign (no plexus element predicts it) | **No (§3.2).** The radiculopathy cards keep listing the trunk or plexus as also fitting. The 2026-07-12 teaching "pain → root" keeps holding on the display, by parsimony and the prior | Root-only would add 9 sampled two-lesion claims, grow 381 covers to three places, make painful plexopathies "root + plexus — Vasculitis", and need 4 re-pins |

### B. Nerve territories in the plexus

| # | Decision | Recommendation | Measured effect |
|---|---|---|---|
| 3 | The upper trunk carries the musculocutaneous sensory row (`mcut_sens`; content-gap row 5) | **Yes** | Erb + lateral forearm: "upper trunk + musculocutaneous — Vasculitis" → "Left upper trunk". A musculocutaneous neuropathy lists the upper trunk too. 5 sampled claims become the upper trunk, all classic Erb combinations (axillary + musculocutaneous; suprascapular + musculocutaneous; suprascapular + lateral cord; C5 root + lateral cord; musculocutaneous + upper trunk). 20 covers swap the musculocutaneous nerve for the upper trunk, with the same number of places (O3) |
| 4 | The lumbar plexus carries the femoral and obturator sensory rows (`fem_sens`, `obt_sens`) | **Yes** | Lumbar plexopathy in nerve words: "femoral + obturator — Mononeuritis multiplex", EMERGENCY → "Left lumbar plexus. Most likely diabetic lumbosacral radiculoplexus neuropathy", URGENT. Femoral and obturator neuropathy list the lumbar plexus. 4 sampled claims become the lumbar plexus; 13 covers swap a nerve for it |
| 5 | The sacral plexus carries the sciatic sensory row (`sci_sens`) | **Yes** | Sciatic numbness + weak gluteus medius: "sciatic + sacral plexus — Vasculitis" → "Left sacral plexus. Most likely pelvic malignancy (must not miss)". A sciatic neuropathy lists the sacral plexus. 2 sampled claims become the sacral plexus; 8 covers swap. Until row 8 is built, comparing the two offers L4's borrowed tests (knee jerk, L4 numbness, hip adduction, knee extension) as sacral-plexus signs. That already happens today for a sciatic picture without the numbness, and row 5 extends it to one with it |
| 6 | The lower trunk carries the ulnar nerve's palmar sensory row (`uln_el_sens`) | **Yes** | Little-finger + T1 numbness + weak thumb and finger abduction: "T1 root + medial cord — Vasculitis" → "Left lower trunk. Must not miss: Pancoast". Little-finger numbness + weak thumb and finger abduction now leads with the lower trunk, with the medial cord also fitting (it led with the medial cord). No sampled claim or cover changes |
| 7 | Branch and pure-sensory nerves stay out (deep and superficial peroneal, tibial, sural, saphenous, lateral femoral cutaneous, dorsal ulnar) | **Yes, they stay out** | Putting them in breaks the foot-drop worked example: first web-space numbness would stop pinning the peroneal nerve (3 checks). Meralgia, sural and saphenous numbness would each list a plexus |

### C. L4, and the whole-plexus places

| # | Decision | Recommendation | Measured effect |
|---|---|---|---|
| 8 | L4 divides. Its quadriceps, knee jerk, adductors and medial-shin dermatome (saphenous) travel in the lumbar plexus; its tibialis anterior and posterior (the lumbosacral trunk) in the sacral plexus; its wasting row in both | **Yes, but build it only with row 9** (§3.3, S2) | Alone, on top of rows 3–7: 9 new sampled claims, 293 covers grow to three places, and knee + ankle jerk lost on one side reads "femoral + tibial — Mononeuritis multiplex", EMERGENCY. With row 9: none of that. Either way, R1 #4 lists the lumbar plexus only, quadriceps + foot drop points to L4, and the compare panel stops offering the knee jerk, L4 numbness, hip adduction and knee extension as sacral-plexus signs |
| 9 | A whole lumbosacral plexus place (L2–S1, the lumbar and sacral plexus together, with the femoral, obturator and sciatic rows) | **Yes, with row 8, after content round 2 (§9)** | 7 more sampled claims become one place, none added; 291 covers move to it from the lumbar or sacral plexus (O3). It lists as also fitting for every lumbar root and plexus picture, and the foot-drop worked example shows four places (2 re-pins). Its phonebook, causes, workup, plans, label and topography row must be authored first |
| 10 | A whole brachial plexus place (C5–T1; the flail arm of a complete traction injury) | **Decide it in content round 2, with row 9.** Not prototyped | Today a flail arm reads "posterior cord + C8 root + upper trunk — Vasculitis": three lesions |

### D. Wording

| # | Decision | Recommendation |
|---|---|---|
| 11 | The upper trunk's phonebook note | *"Upper brachial plexus: the 'waiter's tip' arm — weak shoulder abduction, external rotation and elbow flexion, with numbness over the deltoid patch and the lateral forearm (C5–6) and a depressed biceps jerk."* (it says "C5-6 sensory loss"; rows 3 and the content-gap row 4 make the two patches the trunk's own) |
| 12 | The lumbar and sacral plexus and the lower trunk's notes | Lumbar: *"Front- and inner-thigh numbness (femoral and obturator territories) with weak hip flexion, hip adduction and knee extension, and a depressed knee jerk."* Sacral: unchanged (it already says below-knee sensory loss and no quadriceps). Lower trunk: *"… with C8–T1 sensory loss over the little finger and the medial forearm (± a Horner's from T1 sympathetic)."* |
| 13 | The anatomy sheet (`docs/artifacts/anatomy-model.html`) | The plexus row says what each element reuses: *"Erb = C5∪C6 + the axillary and musculocutaneous patches · Klumpke = C8∪T1 + the ulnar patch · lumbar = L2–4 + femoral and obturator · sacral = L4–S1 + sciatic"*. No new structure ids (rows 3–6 reuse existing rows) |

### E. Tests and probes

| # | Decision | Recommendation |
|---|---|---|
| 14 | Re-pins | **Approve this one:** `content-gaps` "row 5 deferred: the upper trunk does not yet carry musculocutaneous sensation (plexus round)" → "row 5: the upper trunk carries the musculocutaneous sensory row (plexus round)". When rows 8–9 are built: the topography key `plexus|lumbosacral_plexus`, and the foot-drop example's two pins in `discriminators` and `answer` (four candidates) |
| 15 | New audit probes, in the audit suite on this branch (as the cord, false-multifocal and content-gap rounds added theirs) | **Add four.** Each fails today and passes under rows 3–6, and each is mirrored automatically: (a) Erb + lateral forearm → upper trunk first, one lesion; (b) lumbar plexopathy in nerve words → lumbar plexus first, one lesion; (c) sciatic numbness + weak gluteus medius + sciatic motor signs → sacral plexus first, one lesion; (d) little-finger + T1 numbness + weak thumb and finger abduction → lower trunk first, one lesion. I have not added them |
| 16 | A new suite, `test/plexus-round.test.js` | **Yes.** It pins each element's composition (the row-1 guard), the four cards of rows 3–6 with their mirrors, and the "unchanged by design" list of §6 |

## 5. Measured on the prototype

**The recommended set is rows 3–7.** Rows 8–9 wait for content round 2; rows 1–2 change nothing now.

| | `4d781bd` | Rows 3–7 |
|---|---|---|
| Audit probes | 101 / 111 | 101 / 111 |
| Counted checks | 1034 passed, 13 failed | **1034 passed, 13 failed**: no check flips |
| Swaps / background / mirror | 272 / 272 · 292 / 292 · 273 / 273 | unchanged |
| `npm test` | 86 suites, 7355 / 0 | 7354 / 1: the row-5 pin (row 14) |

Every option alone, against `4d781bd`:

| Option | Audit | `npm test` fails | Sampled claims ended / new | Covers that change places (grow to three) | Covers naming the two true places |
|---|---|---|---|---|---|
| Root pain root-only (row 2 = yes) | 0 | 4 | 0 / **9** | 445 (**381**) | 7324 → 6942 |
| L4 split alone (row 8) | 0 | 0 | 1 / **6** | 303 (**295**) | 7324 → 7063 |
| Musculocutaneous row (row 3) | 0 | 1 (pin) | 5 / 0 | 20 (0) | 7324 → 7313 |
| Mixed-nerve rows (rows 4–6) | 0 | 0 | 6 / 0 | 21 (0) | 7324 → 7304 |
| **Rows 3–7** | 0 | 1 (pin) | **11 / 0** | 41 (0) | 7324 → 7293 |
| Rows 3–7 + split (S1) | 0 | 1 (pin) | 1 / **9** more | 302 (**293**) | → 7035 |
| Rows 3–7 + split + lumbosacral place (S2) | 0, plus one new mirror check that passes | 4 | 7 / 0 more | 302 (6) | → 7024 |
| Root-only pain + rows 3–8 (the full alternative) | 0 | 5 | 7 / 9 | 468 (392) | 7324 → 6929 |

**The safety sample.** It takes every 7th pair (9,490) of the 66,430 pairs among the 365 site pictures, as in the
false-multifocal and content-gap designs. Each pair's picture is both sites' full pictures. Every variant is asked the
same frozen pictures, taken from `4d781bd`. On `4d781bd`, 9,191 of the pairs get a two-lesion claim. The pairs are
synthetic, so the truth is known: the two places that made the picture.

- **The 11 that become one place (rows 3–7)** all read as one plexopathy:
  - 5 Erb combinations → the upper trunk;
  - femoral + obturator, femoral + L2 root, obturator + L4 root, and obturator + lumbar plexus → the lumbar plexus;
  - sciatic + superior gluteal, and sciatic + sacral plexus → the sacral plexus.
- **The 41 cover moves are the cover tie-break (O3):** the place that predicts more of the picture wins a tie. They keep
  their claim and their number of places, and 3 change their suggested disease.
- **No first answer changes** among the 365 site pictures or the 389 offered single findings. Five findings gain one
  place on each side: lateral forearm numbness (2 → 3), little-finger numbness (3 → 4), and front-of-thigh, inner-thigh and
  below-knee numbness (1 → 2).
- **Read the split's growth with care.** All 293 covers that grow under S1 pair a lumbar or sacral plexus picture taken
  from `4d781bd`, and that picture carries the L4 signs the split takes away. Asked its own new picture, each plexus is
  still one place. The growth measures how often the model is asked about a plexopathy that spans both plexuses, which is
  why row 9 exists.
- **A faster snapshot was checked against the full one.** The snapshots re-solve only the pictures a plexus finding can
  reach (about 47% of pairs) and copy the rest. For rows 3–8, a full re-solve of all 9,490 pairs, 365 site pictures and
  389 single findings matched it exactly.

## 6. The answer card, before and after (rows 3–7)

Captured from `answerFor`, with the engine's default answer selected, as the app does.

| Picture | Today | Rows 3–7 |
|---|---|---|
| Erb + lateral forearm numbness | No single place … — likely upper trunk and musculocutaneous nerve. *Together: Vasculitis.* | Left upper trunk of the brachial plexus. **Why:** badge-area numbness (axillary nerve) + weak elbow flexion → only the left plexus. *Most likely Obstetric brachial plexus injury (Erb's palsy)* (content-gap O2: the obstetric lead at any age) |
| Lumbar plexopathy in nerve words | … femoral nerve and obturator nerve. *Together: Mononeuritis multiplex.* EMERGENCY | Left lumbar plexus. **Why:** front-of-thigh numbness (femoral nerve) + weak hip adduction → only the left plexus. *Most likely Diabetic lumbosacral radiculoplexus neuropathy. Must not miss: Retroperitoneal haematoma.* URGENT |
| Sacral plexopathy: sciatic numbness + gluteus medius | … sciatic nerve and sacral plexus. *Together: Vasculitis.* | Left sacral plexus. **Why:** below-knee numbness (sciatic nerve) + weak hip abduction → only the left plexus. *Most likely Pelvic malignancy (must not miss).* |
| Lower trunk with little-finger numbness | … T1 root and medial cord. *Together: Vasculitis.* | Left lower trunk of the brachial plexus. *Most likely Neoplastic infiltration. Must not miss: Pancoast (superior sulcus) tumour.* |
| Little-finger numbness + weak thumb and finger abduction | Left medial cord. *Most likely Traction or traumatic injury.* | Left lower trunk. 1 other place also fits: Left medial cord. *Most likely Neoplastic infiltration. Must not miss: Pancoast.* |
| Femoral neuropathy (audit probe) | Left femoral nerve. **Why:** … → only the left peripheral nerve. | Left femoral nerve. 1 other place also fits: Left lumbar plexus. **Why:** … → the left plexus or peripheral nerve; see Where for what separates them. |
| Obturator, sciatic, musculocutaneous neuropathy; front-of-thigh or lateral-forearm numbness alone | the nerve (musculocutaneous: + lateral cord) | the same nerve first, with its plexus element also fitting, as the femoral row above |
| **Unchanged by design:** every root picture (C5–S1, with and without root pain); Erb (audit probe and vignette); Erb + root pain; Klumpke (both); the C8 audit probe; Pancoast; diabetic amyotrophy with root pain; the foot-drop worked example (three places; + hip abduction → L5; + first web-space numbness → peroneal); common peroneal; foot drop alone; meralgia; sural and saphenous numbness; axillary; suprascapular; posterior cord; ulnar at the elbow; the mononeuritis-multiplex probe; the cauda example; C5/6 myeloradiculopathy. **Also unchanged until rows 8–9:** R1 #4 still lists the sacral plexus, and knee + ankle jerk lost on one side still reads "sacral plexus" | | |

With rows 8–9 as well (S2), measured: knee + ankle jerk lost on one side → "Left lumbosacral plexus"; quadriceps + foot
drop + knee jerk + medial shin → "Left L4 root. 1 other place also fits: Left lumbosacral plexus"; the foot-drop worked
example → "Left common peroneal nerve. 3 other places also fit: Left L5 root, Left sacral plexus, and 1 more."

## 7. What this round does not fix, and what it found

- **O1. The cover tie-break (content-gap O3).** Rows 3–6 move 41 sampled covers from a nerve to its plexus element. That
  is the tie-break's preference for the larger place, not these rows, and it belongs to the tie-break design
  (`fix/cover-tiebreak`).
- **O2. Erb's What line** still leads with "Obstetric brachial plexus injury" at any age (content-gap O2). Row 3 puts it on
  one more adult picture.
- **O3. Two lumbar roots have no degenerative unifier.** L4 + L5 radiculopathy, read as two roots under S1, offers
  "Vasculitis". Multilevel spondylosis is not on the multifocal roster. This matters only if row 8 is built alone.
- **O4. The compare panel breaks ties alphabetically.** So between the sciatic nerve and the sacral plexus, weak hip
  abduction (the classic test) sorts below radicular pain and the dermatomes. It is a separate ordering question.
- **O5. "Sciatica-type root pain"** is the label of the one radicular-pain finding, so a cervical root's Why line can
  read "sciatica-type" for arm pain. It is a plain-labels question.
- **O6. Root-only motor branches are not modelled.** The dorsal scapular (rhomboids), long thoracic (serratus anterior)
  and phrenic leave the roots before the trunks. They are the bedside's root-vs-trunk tests, and with them root and upper
  trunk would separate without relying on pain.
- **O7. The middle trunk is exactly the C7 root's rows.** It would become a strict subset of the root if pain were made
  root-only (row 2), which is one reason that row is "no".
- **O8. Klumpke's claw.** A lower-trunk lesion gives a claw of all four fingers (median and ulnar lumbricals). The model's
  `ulnar_claw` is the ulnar nerve's, so the lower trunk does not predict it. Not changed.
- **O9. The sciatic nerve is missing three of its muscles.** Its rows give hamstrings, dorsiflexion, plantarflexion,
  eversion and the ankle jerk, but not tibialis posterior (inversion), extensor hallucis longus or the toe flexors, which
  its tibial and peroneal divisions supply. So comparing it with the sacral plexus offers weak inversion, great-toe
  extension and toe flexion as plexus-only tests. It is a nerve content gap, outside this round.

## 8. How it would be built (the plan follows the ruling)

Rows 3–7, now:
- `src/model/sites.js` `composePlexusSites`: the `nerves` lists become: upper trunk `axil_sens`, `mcut_sens`; lower trunk
  `uln_el_sens`; lumbar plexus `fem_sens`, `obt_sens`; sacral plexus `sci_sens`. The comment states the rule of §3.4.
- `src/data/syndromes.js`: the row 11–12 notes. `docs/artifacts/anatomy-model.html`: the row-13 line.
- Tests: the row-14 re-pin; `test/plexus-round.test.js` (row 16); the four row-15 probes in `test/clinical-audit.test.js`
  and the audit spec's probe list.
- CLAUDE.md: a short section, with the rule, the measured costs and the traps (the worked example's branch rows; the
  frozen-picture caveat for any row that takes a sign away from a place).

Rows 8–9, after content round 2:
- `src/model/structures.js`: `plexus: "lumbar_plexus"` on `root_l4_derm`, `root_l4_kneeext`, `root_l4_reflex`,
  `root_l4_hipadd`; `plexus: "sacral_plexus"` on `root_l4_df`, `root_l4_inv`; both on `root_l4_wasting` and
  `root_l4_pain` (root pain travels with every element its root feeds, row 2).
- `composePlexusSites` reads the tag; a `lumbosacral_plexus` group takes every L2–S1 row and the three mixed-nerve rows.
- The content of §9, then the row-14 re-pins for the worked example and the topography key.

## 9. Content round 2 (only if rows 8–10 are approved)

A new place has to clear every content gate before it ships. For the lumbosacral plexus:
- **A label** (`app/labels.js`): "lumbosacral plexus".
- **A phonebook entry**: name, note, ddx and red flag.
- **Curated causes**: at least six, each with a discriminating feature and one red must-not-miss, and not identical to the
  lumbar or sacral plexus lists.
- **A four-tier workup.**
- **A pathology plan for each cause** that reaches the place (the `bySite` reachability gate).
- **A topography row**, and a prevalence tier (uncommon, as every plexus place).
- **An anatomy-sheet row.**

The same list applies to a whole brachial plexus place if row 10 says yes. I would draft them as a review round in the
shape of the cord fix's content round (§10 of `2026-10-22-spinal-cord-fix-design.md`).

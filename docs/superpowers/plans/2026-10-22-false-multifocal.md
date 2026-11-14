# False-multifocal fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status: written 2026-10-22 after the round-1 ruling (all 20 rows approved). Executed inline in the same session.**

**Goal:** Stop the engine claiming two lesions (plus "MS" / "vasculitis") when one place explains the picture: word
families, a narrow same-family near-fit, and a background (Hickam) step — exactly the 20 rows ruled in
`docs/superpowers/specs/2026-10-22-false-multifocal-design.md`.

**Architecture:** A content table of word families and background findings (`src/model/families.js`) and a small
matching module (`src/engine/families.js`). The solver matches every entered word through its family but never
rewrites it. `solve()` gains a background step (set the pair aside, then localise the rest) and the same-family
near-fit (it withholds the multifocal claim and leads the list). The answer card names what was set aside.

**Tech Stack:** zero-dependency ES modules, Node 24 (off PATH: `/Users/jaydenwearne/.local/node-v24.18.0-darwin-arm64/bin/node`), standalone test scripts.

## Global Constraints

- Never loosen or edit an existing audit assertion; the three new probes (row 19) are additions.
- `npm test` stays green. The prototype measured 7209 / 0 with no re-pins (row 20).
- The engine matches through a family and NEVER rewrites the entered word (row 1).
- Families: cerebellar limb signs = one finding (row 2); weak hand = weak arm only when leg or facial weakness is on
  that side (row 3); plain dysarthria is explained by a place giving scanning speech (row 4).
- Same-family near-fit only for the facial sensory words and plain → scanning speech (row 6); "instead of", never "as
  well as" (row 7); no minimum size (row 8); the near-fit place leads (row 9).
- Background: absent ankle jerks / glove-and-stocking numbness, both sides only (row 11); set aside as a pair, kept when
  a place in the answer predicts both sides, never joins a cover (row 12); any answer (row 13).
- The cover counts a family once (row 17). The roster is unchanged (row 18).
- Card wording, verbatim (rows 10, 14, 15):
  - near-fit: `<Place> explains <n> of <N> findings. It gives <word>, but <word> was entered — re-examine that before calling this two lesions.`
  - `Absent ankle jerks on both sides are set aside: common with age and in a neuropathy, and probably a separate condition.`
  - `Glove-and-stocking numbness on both sides is set aside: a length-dependent neuropathy (most often diabetic) is common, and probably a separate condition.`
  - cord answer adds: `With a myelopathy, check B12 (subacute combined degeneration) before calling them separate.`

---

### Task 1: The families content and matching module

**Files:**
- Create: `src/model/families.js`
- Create: `src/engine/families.js`
- Create: `test/false-multifocal.test.js` (section 1 only in this task)
- Modify: `package.json` (add the suite to `test`), `README.md` ("all 84" → "all 85")

**Interfaces:**
- Produces (`src/model/families.js`): `FINDING_FAMILIES` — `[{ id, relation: "same"|"hemiparesis"|"generic"|"different", members: string[], head?, inside?, generic?, nearFit: boolean, ruling: string }]`; `BACKGROUND_FINDINGS: string[]`.
- Produces (`src/engine/families.js`): `matchToken(t) → string`, `enteredToken(t, entered: Set) → string`,
  `enteredSet(entered: Set) → Set`, `predictedToken(t, read: Set) → string`, `predictedSet(exp: Set, read: Set) → Set`,
  `indexTokens(t) → string[]`, `sameFamilyInstead(token, predicted: Set, read: Set) → string|null`.

- [ ] **Step 1: Write the failing test (section 1)**

```js
// false-multifocal.test.js — the false-multifocal fix (owner rulings 2026-10-22, all 20 rows of round 1).
// Spec: docs/superpowers/specs/2026-10-22-false-multifocal-design.md
import { FINDING_FAMILIES, BACKGROUND_FINDINGS } from "../src/model/families.js";
import { matchToken, enteredToken, enteredSet, predictedSet, sameFamilyInstead } from "../src/engine/families.js";
import { FINDINGS } from "../src/model/findings.js";

let pass = 0, fail = 0;
const ok = (l, c, d = "") => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l + (!c && d ? `  [${d}]` : "")); };
const S = s => new Set(s.split(/\s+/).filter(Boolean));

// ---- 1. the content and the matching ----
for (const fam of FINDING_FAMILIES) {
  ok(`family ${fam.id}: every member is a real finding`, fam.members.every(f => FINDINGS[f]));
  ok(`family ${fam.id}: cites its ruling`, /row \d+/.test(fam.ruling));
  if (fam.head) ok(`family ${fam.id}: its head is a member`, fam.members.includes(fam.head));
}
ok("background findings are real findings", BACKGROUND_FINDINGS.every(f => FINDINGS[f]));
ok("hearing loss is NOT background (NF2's own picture)", !BACKGROUND_FINDINGS.includes("hearing_loss"));
ok("row 2: past-pointing is matched as limb ataxia", matchToken("dysmetria@left") === "limb_ataxia@left");
ok("row 2: the head itself is unchanged", matchToken("limb_ataxia@left") === "limb_ataxia@left");
ok("row 3: hand weakness with leg weakness on that side reads as arm weakness",
   enteredToken("weak_hand@right", S("weak_hand@right weak_leg@right")) === "weak_arm@right");
ok("row 3: ...with facial weakness on that side too",
   enteredToken("weak_hand@right", S("weak_hand@right facial_weakness@right")) === "weak_arm@right");
ok("row 3: hand weakness with only Babinski + brisk stays hand weakness",
   enteredToken("weak_hand@right", S("weak_hand@right babinski@right hyperreflexia@right")) === "weak_hand@right");
ok("row 3: leg weakness on the OTHER side does not count",
   enteredToken("weak_hand@right", S("weak_hand@right weak_leg@left")) === "weak_hand@right");
ok("row 4: scanning speech is matched as slurred speech when only slurred speech was entered",
   predictedSet(S("ataxic_dysarthria@none truncal_ataxia@none"), enteredSet(S("dysarthria@none truncal_ataxia@none"))).has("dysarthria@none"));
ok("row 4: ...but not when scanning speech itself was entered",
   predictedSet(S("ataxic_dysarthria@none"), enteredSet(S("ataxic_dysarthria@none"))).has("ataxic_dysarthria@none"));
ok("row 5: face numbness entered, face pain loss predicted and not entered → face pain loss",
   sameFamilyInstead("face_sensory_loss@left", S("face_pain_loss@left"), S("face_sensory_loss@left")) === "face_pain_loss@left");
ok("row 7: both words entered is not a substitution",
   sameFamilyInstead("face_sensory_loss@left", S("face_pain_loss@left"), S("face_sensory_loss@left face_pain_loss@left")) === null);
ok("row 5: the other side does not count",
   sameFamilyInstead("face_sensory_loss@left", S("face_pain_loss@right"), S("face_sensory_loss@left")) === null);
ok("row 6: hand/arm is not a near-fit family",
   sameFamilyInstead("weak_hand@right", S("weak_arm@right"), S("weak_hand@right")) === null);
ok("row 6: plain → scanning speech is a near-fit family",
   sameFamilyInstead("ataxic_dysarthria@none", S("dysarthria@none"), S("ataxic_dysarthria@none")) === "dysarthria@none");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run it to verify it fails**

Run: `/Users/jaydenwearne/.local/node-v24.18.0-darwin-arm64/bin/node test/false-multifocal.test.js`
Expected: crash — `Cannot find module '…/src/model/families.js'`.

- [ ] **Step 3: Write `src/model/families.js`**

```js
// families.js — WORD FAMILIES and BACKGROUND findings (false-multifocal fix, owner-ruled 2026-10-22). CONTENT ONLY:
// the matching lives in src/engine/families.js, so this table can be clinically reviewed on its own.
//
// A FAMILY is several bedside words for one examination. The vocabulary names findings by anatomy, so before this
// table "past-pointing" pointed only at the cerebellar hemisphere, and a Wallenberg entered with it read "two lesions,
// multiple sclerosis". Each family cites the owner's ruling it comes from (audit round 1, rows 18–21). `relation`:
//   same        — one finding, whichever word was entered: matched through `head`.
//   hemiparesis — one finding only INSIDE a hemiparesis: a member reads as `head` when a finding in `inside` is entered
//                 on the same side. Outside it the words stay different findings.
//   generic     — `generic` is explained by a place that gives a more specific member (specific → generic is safe);
//                 the reverse is a different claim.
//   different   — different findings: they localise differently.
// `nearFit: true` — a member entered INSTEAD of another member that a place predicts on that side (and that was not
// entered) makes that place a near-fit with no multifocal claim: the narrow overturn of "a LOCALISING sign is never
// relaxed away" (false-multifocal fix rows 5–7). Not weak hand outside a hemiparesis (row 6).
export const FINDING_FAMILIES = [
  { id: "cerebellar_limb", relation: "same", head: "limb_ataxia",
    members: ["limb_ataxia", "dysmetria", "dysdiadochokinesis", "intention_tremor"], nearFit: false,
    ruling: "Equivalent: dysmetria is how limb ataxia is examined (audit round 1, row 18)." },
  { id: "arm_hand", relation: "hemiparesis", head: "weak_arm", inside: ["weak_leg", "facial_weakness"],
    members: ["weak_arm", "weak_hand"], nearFit: false,
    ruling: "Equivalent inside a hemiparesis (leg or face weakness on that side); weak hand alone still means the hand knob (audit round 1, row 20)." },
  { id: "dysarthria", relation: "generic", generic: "dysarthria",
    members: ["dysarthria", "ataxic_dysarthria"], nearFit: true,
    ruling: "Specific → generic is safe; generic → specific is a different claim (audit round 1, row 21)." },
  { id: "face_sensation", relation: "different",
    members: ["face_pain_loss", "face_touch_loss", "face_sensory_loss"], nearFit: true,
    ruling: "Not equivalent: pain vs touch localises, and face_sensory_loss is VPM loss (audit round 1, row 19)." },
];

// BACKGROUND (Hickam) findings: common enough to be a separate, co-existing condition. Only ever as a PAIR on both
// sides — an absent ankle jerk on one side is an S1 sign. Hearing loss on both sides is NOT here: it is NF2's own
// picture. Owner ruling 2026-10-22, false-multifocal fix rows 11–13. The card's sentences live in app/answer.js.
export const BACKGROUND_FINDINGS = ["reflex_ankle_loss", "distal_sensory_loss"];
```

- [ ] **Step 4: Write `src/engine/families.js`**

```js
// families.js (engine) — matching through the word families (src/model/families.js). LOGIC ONLY.
//
// The engine MATCHES through a family and never rewrites the word: the card, the Why line and the case link keep what
// was entered (false-multifocal fix, row 1). Three readings of a token:
//   matchToken(t)             a PREDICTED token, context-free: a "same" family's member reads as its head.
//   enteredToken(t, entered)  an ENTERED token, in the context of everything entered: a "same" member reads as its
//                             head; a "hemiparesis" member reads as its head when an `inside` finding is on that side.
//   predictedToken(t, read)   a PREDICTED token against what was entered (already read): a specific member of a
//                             "generic" family reads as the generic word when only the generic word was entered.
import { FINDING_FAMILIES } from "../model/families.js";

const split = t => { const i = t.lastIndexOf("@"); return [t.slice(0, i), t.slice(i + 1)]; };
const FAMILY_OF = new Map();
for (const fam of FINDING_FAMILIES) for (const m of fam.members) FAMILY_OF.set(m, fam);

export function matchToken(t) {
  const [f, s] = split(t);
  const fam = FAMILY_OF.get(f);
  return fam && fam.relation === "same" && f !== fam.head ? `${fam.head}@${s}` : t;
}

export function enteredToken(t, entered) {
  const m = matchToken(t);
  if (m !== t) return m;
  const [f, s] = split(t);
  const fam = FAMILY_OF.get(f);
  if (fam && fam.relation === "hemiparesis" && f !== fam.head && fam.inside.some(g => entered.has(`${g}@${s}`))) return `${fam.head}@${s}`;
  return t;
}
export const enteredSet = entered => new Set([...entered].map(t => enteredToken(t, entered)));

export function predictedToken(t, read) {
  const m = matchToken(t);
  const [f, s] = split(m);
  const fam = FAMILY_OF.get(f);
  if (fam && fam.relation === "generic" && f !== fam.generic) {
    const g = `${fam.generic}@${s}`;
    if (read.has(g) && !read.has(m)) return g;
  }
  return m;
}
export const predictedSet = (exp, read) => new Set([...exp].map(t => predictedToken(t, read)));

// Every token a predicted word can be matched as, whatever was entered — for an index built once (why.js locusIndex).
export function indexTokens(t) {
  const m = matchToken(t);
  const [f, s] = split(m);
  const fam = FAMILY_OF.get(f);
  return fam && fam.relation === "generic" && f !== fam.generic ? [m, `${fam.generic}@${s}`] : [m];
}

// The SAME-FAMILY NEAR-FIT's word (rows 5–7): for a word that was entered, a member of its family that the place
// predicts on the same side and that was NOT entered. Only families with `nearFit`. Null when there is none.
export function sameFamilyInstead(token, predicted, read) {
  const [f, s] = split(token);
  const fam = FAMILY_OF.get(f);
  if (!fam || !fam.nearFit) return null;
  for (const g of fam.members) {
    if (g === f) continue;
    const t = `${g}@${s}`;
    if (predicted.has(t) && !read.has(t)) return t;
  }
  return null;
}
```

- [ ] **Step 5: Wire the suite in** — append ` && node test/false-multifocal.test.js` to the end of the `test` script in
  `package.json`; in `README.md` change "runs all 84 in sequence" to "runs all 85 in sequence".

- [ ] **Step 6: Run it to verify it passes**

Run: `/Users/jaydenwearne/.local/node-v24.18.0-darwin-arm64/bin/node test/false-multifocal.test.js`
Expected: every line PASS, exit 0.

- [ ] **Step 7: Commit** — `git add src/model/families.js src/engine/families.js test/false-multifocal.test.js package.json README.md && git commit -m "feat(families): word families and background findings — content + matching (rows 1-4, 11)"`

### Task 2: The solver matches through the families; the same-family near-fit; the background step

**Files:**
- Modify: `src/engine/inverse.js` (`differential`, `ruledOutSites`, `minimalSet`, `nearFit`, `solve`)
- Modify: `src/engine/score.js` (`scoreSite`)
- Test: `test/false-multifocal.test.js` (section 2), `test/relaxation.test.js` (the same-family case)

**Interfaces:**
- Consumes: Task 1's `enteredToken`, `enteredSet`, `predictedSet`, `sameFamilyInstead`, `BACKGROUND_FINDINGS`.
- Produces: `solve(observedSet, opts)` returns everything it did, plus `background: null | { tokens: string[] }`;
  `r.nearFit` may be `{ site, missing, instead }` (the same-family near-fit — the claim is withheld and the place
  leads `r.display`); `backgroundAside(observedSet, opts) → string[]` (exported).

- [ ] **Step 1: Write the failing tests (section 2)** — insert before the summary lines of `test/false-multifocal.test.js`:

```js
// ---- 2. the solver ----
import { solve, backgroundAside } from "../src/engine/inverse.js";
const first = r => r.display[0]?.site.id;
const ids = r => r.display.map(c => c.site.id);
const WALL = "face_pain_loss@left spinothalamic@right miosis@left ptosis@left limb_ataxia@left dysphagia@left";

// row 2 — the cerebellar limb signs
{
  const r = solve(S("face_pain_loss@left spinothalamic@right miosis@left ptosis@left dysmetria@left dysphagia@left cn8_vertigo@left"));
  ok("row 2: Wallenberg with past-pointing → the lateral medulla, one lesion", first(r) === "left_medulla_lateral" && r.multi === null, `${first(r)} multi=${r.multi && r.multi.sites.map(s => s.id)}`);
  const r2 = solve(S(WALL + " dysmetria@left"));
  ok("row 2: Wallenberg + limb ataxia + its listed refinement past-pointing → one lesion", first(r2) === "left_medulla_lateral" && r2.multi === null);
  ok("row 2: ...both words count as explained", r2.display[0].n === 7);
  const r3 = solve(S("dysmetria@left"));
  ok("row 2: past-pointing alone → the cerebellar hemisphere first", first(r3) === "left_cerebellum_hemisphere");
  ok("row 2: ...and the peduncles fit too (one finding along the pathway)", ids(r3).includes("left_medulla_lateral") && ids(r3).includes("left_pons_lateral"));
  const r4 = solve(S("limb_ataxia@left dysmetria@left intention_tremor@left dysdiadochokinesis@left"));
  ok("row 2: all four words → the cerebellar hemisphere first", first(r4) === "left_cerebellum_hemisphere" && r4.multi === null);
}
// row 3 — hand weakness inside a hemiparesis
{
  const r = solve(S("dysarthria@none facial_weakness@right forehead_spared@right weak_hand@right"));
  ok("row 3: dysarthria–clumsy hand → one lacunar place", /^left_(subcortex_(internal_capsule|corona_radiata)|pons_basis_pontis)$/.test(first(r)) && r.multi === null, `${first(r)}`);
  const r2 = solve(S("weak_hand@right weak_leg@right facial_weakness@right forehead_spared@right babinski@right"));
  ok("row 3: capsular hemiparesis entered with hand weakness → explained by one place", r2.explainAll.length > 0 && r2.multi === null);
  ok("row 3: hand weakness alone → the hand knob", first(solve(S("weak_hand@right"))) === "left_cortex_hand_knob");
  ok("row 3: hand weakness + Babinski + brisk → the hand knob", first(solve(S("weak_hand@right babinski@right hyperreflexia@right"))) === "left_cortex_hand_knob");
}
// row 4 — plain dysarthria in a cerebellar picture
{
  const r = solve(S("truncal_ataxia@none nystagmus_gaze_evoked@none dysarthria@none"));
  ok("row 4: cerebellar picture with slurred speech → a cerebellar place, one lesion", /^cerebellum_/.test(first(r)) && r.multi === null, `${first(r)}`);
}
// rows 5–9 — the same-family near-fit
{
  const r = solve(S("face_sensory_loss@left spinothalamic@right miosis@left ptosis@left limb_ataxia@left dysphagia@left"));
  ok("row 5: Wallenberg with face numbness → the lateral medulla first (R1 #6)", first(r) === "left_medulla_lateral");
  ok("row 5: ...a near-fit naming face pain loss instead", r.nearFit && r.nearFit.instead === "face_pain_loss@left" && r.nearFit.missing === "face_sensory_loss@left");
  ok("row 5: ...and no multifocal claim", r.multi === null);
  const r2 = solve(S("face_touch_loss@left spinothalamic@right miosis@left ptosis@left limb_ataxia@left dysphagia@left"));
  ok("row 5: Wallenberg with face touch loss → the lateral medulla near-fit, no claim", first(r2) === "left_medulla_lateral" && r2.multi === null);
  const r3 = solve(S("face_sensory_loss@left spinothalamic@right"));
  ok("rows 8–9: two findings → the lateral medulla near-fit leads", first(r3) === "left_medulla_lateral" && r3.multi === null && r3.nearFit && r3.nearFit.instead === "face_pain_loss@left");
  const r4 = solve(S("face_pain_loss@left face_sensory_loss@left spinothalamic@right miosis@left ptosis@left limb_ataxia@left dysphagia@left"));
  ok("row 7: both face words entered → the claim stands", r4.multi !== null);
  const r5 = solve(S("miosis@left ptosis@left anhidrosis_face@left weak_hand@right babinski@right hyperreflexia@right"));
  ok("row 6: Horner's + hand weakness with Babinski (outside a hemiparesis) → the claim stands", r5.multi !== null);
}
// rows 11–13 — background
{
  const MCA = "speech_nonfluent@none comprehension_impaired@none weak_arm@right facial_weakness@right forehead_spared@right homonymous_hemianopia@right";
  const r = solve(S(MCA + " reflex_ankle_loss@left reflex_ankle_loss@right"));
  ok("row 12: MCA + absent ankle jerks → the MCA, no claim", first(r) === "left_cortex_mca" && r.multi === null);
  ok("row 12: ...the pair is set aside", r.background && r.background.tokens.join(" ") === "reflex_ankle_loss@left reflex_ankle_loss@right");
  const r2 = solve(S(MCA + " distal_sensory_loss@left distal_sensory_loss@right"));
  ok("row 12: MCA + glove-and-stocking → the MCA, the numbness set aside", first(r2) === "left_cortex_mca" && r2.multi === null && r2.background && r2.background.tokens.length === 2);
  ok("row 12: the insula + absent ankle jerks keeps the insula first", first(solve(S("dysarthria@none gustatory_loss@left reflex_ankle_loss@left reflex_ankle_loss@right"))) === "left_cortex_insula");
  const g = solve(S("lmn_weakness@left lmn_weakness@right reflex_knee_loss@left reflex_knee_loss@right reflex_ankle_loss@left reflex_ankle_loss@right distal_sensory_loss@left distal_sensory_loss@right"));
  ok("row 12: GBS + stocking → GBS first, no claim", first(g) === "polyradiculoneuropathy_acute" && g.multi === null);
  ok("row 12: ...GBS KEEPS its absent ankle jerks; only the stocking numbness is set aside", g.background && g.background.tokens.join(" ") === "distal_sensory_loss@left distal_sensory_loss@right");
  ok("row 13: an L5 root + absent ankle jerks → the L5 root first", first(solve(S("weak_ankle_dorsiflexion@left weak_great_toe_extension@left weak_hip_abduction@left sensory_l5@left reflex_ankle_loss@left reflex_ankle_loss@right"))) === "left_root_l5");
  ok("row 13: carpal tunnel + absent ankle jerks → carpal tunnel, no claim", (r => first(r) === "left_nerve_median_carpal_tunnel" && r.multi === null)(solve(S("median_sensory@left weak_thumb_abduction@left reflex_ankle_loss@left reflex_ankle_loss@right"))));
  const m = solve(S("facial_weakness@right forehead_spared@right weak_arm@right homonymous_hemianopia@left reflex_ankle_loss@left reflex_ankle_loss@right"));
  ok("row 12: a genuine two-lesion picture + absent ankle jerks keeps its claim, without a background place",
     m.multi && m.multi.sites.length === 2 && m.multi.sites.every(s => s.level === "cortex" || s.level === "subcortex") && m.background);
  ok("row 11: ONE absent ankle jerk is never background", backgroundAside(S("speech_nonfluent@none weak_arm@right facial_weakness@right forehead_spared@right reflex_ankle_loss@left")).length === 0);
  ok("row 12: the SCD picture explains its own ankle jerks — nothing set aside", backgroundAside(S("dorsal_sensory@left dorsal_sensory@right sensory_ataxia@none babinski@left babinski@right reflex_ankle_loss@left reflex_ankle_loss@right")).length === 0);
  ok("row 12: absent ankle jerks alone are the picture — nothing set aside", backgroundAside(S("reflex_ankle_loss@left reflex_ankle_loss@right")).length === 0);
}
// row 17 — the cover counts a family once
{
  const r = solve(S("cn12_palsy@right weak_arm@left weak_leg@left dorsal_sensory@left babinski@left hoffmann@left hyperreflexia@left spasticity@left limb_ataxia@left limb_ataxia@right dysmetria@left dysmetria@right dysdiadochokinesis@left dysdiadochokinesis@right intention_tremor@left intention_tremor@right truncal_ataxia@none ataxic_dysarthria@none nystagmus_gaze_evoked@none"));
  ok("row 17: right medial medulla + whole cerebellum → a cover of two places, not three", r.multi && r.multi.sites.length === 2, r.multi && r.multi.sites.map(s => s.id).join(" + "));
}
// guards — genuine two-lesion pictures keep their claim
{
  const two = t => solve(S(t)).multi !== null;
  ok("guard: Wallenberg + Broca's aphasia → two lesions (signed off 2026-08-14)", two(WALL + " speech_nonfluent@none repetition_impaired@none"));
  ok("guard: Wallenberg + a right L5 root → two lesions", two(WALL + " weak_ankle_dorsiflexion@right weak_hip_abduction@right sensory_l5@right"));
  ok("guard: x-mets / x-embolic picture → two lesions", two("facial_weakness@right forehead_spared@right weak_arm@right homonymous_hemianopia@left"));
  ok("guard: x-paraneo picture → two lesions", two("limb_ataxia@left limb_ataxia@right truncal_ataxia@none ataxic_dysarthria@none amnesia@none"));
  ok("guard: x-syphilis picture → two lesions", two("dorsal_sensory@left dorsal_sensory@right sensory_ataxia@none executive_dysfunction@none"));
  ok("guard: R arm + L leg → two lesions", two("weak_arm@right weak_leg@left"));
  ok("guard: INO + optic neuritis → two lesions", two("ino@left central_scotoma@right rapd@right"));
}
```

And in `test/relaxation.test.js`, before the summary lines:

```js
// The SAME-FAMILY near-fit (false-multifocal fix rows 5–7, owner ruling 2026-10-22). nearFit() above still never drops
// a localising sign. solve() sets one aside only for a word entered INSTEAD of a family word that the place predicts on
// that side — and then it withholds the multifocal claim.
const wall = new Set(["face_sensory_loss@left","spinothalamic@right","miosis@left","ptosis@left","limb_ataxia@left","dysphagia@left"]);
ok("nearFit() still refuses to drop the localising face word", nearFit(wall, { dominantSide: "left" }) === null);
const rw = solve(wall, { dominantSide: "left" });
ok("solve() reads it as a same-family near-fit: the lateral medulla, face pain loss instead",
   !!rw.nearFit && rw.nearFit.site.id === "left_medulla_lateral" && rw.nearFit.instead === "face_pain_loss@left");
ok("...and withholds the multifocal claim", rw.multi === null);
ok("a stray face pain loss beside an MCA (no family word predicted) keeps its claim", solve(setLoc, { dominantSide: "left" }).multi !== null);
```

- [ ] **Step 2: Run them to verify they fail**

Run: `node test/false-multifocal.test.js` and `node test/relaxation.test.js`
Expected: section 2 FAIL lines (e.g. "row 2: Wallenberg with past-pointing → the lateral medulla, one lesion"); `backgroundAside` is not exported yet, so the suite crashes first — that is the expected failure.

- [ ] **Step 3: `src/engine/inverse.js` — import the families**

After `import { EXPLICIT_NORMAL } from "../model/findings.js";` add:

```js
import { BACKGROUND_FINDINGS } from "../model/families.js";
import { enteredToken, enteredSet, predictedSet, sameFamilyInstead } from "./families.js";
```

- [ ] **Step 4: `differential()` matches through the families** — replace the head of the function and the per-site
  matching:

```js
  const observed = [...observedSet].filter(t => !PRESSURE_TOKEN.test(t) && !isNormalToken(t));
  const pressure = raisedPressureAxis(observedSet);
  // WORD FAMILIES (false-multifocal fix, rows 1–4): each entered word is read through its family, in the context of
  // everything entered, and each place's prediction is read the same way. The entered token itself is what is counted,
  // shown and returned in `explained`; `exp` holds the place's tokens as read.
  const read = enteredSet(observedSet);
  const readOf = new Map(observed.map(t => [t, enteredToken(t, observedSet)]));
  const negatives = knownNegatives(read);
  const againstNormal = normalNegatives(read);
```

```js
    let exp; try { exp = predictedSet(expectedFindings(site, opts), read); } catch { continue; }
```

```js
    const explained = observed.filter(t => exp.has(readOf.get(t)));
```

```js
    cands.push({ site, exp, explained, over: [...exp].filter(t => !read.has(t)).length,
```

- [ ] **Step 5: `ruledOutSites()`** — read the entered set and the predictions the same way:

```js
export function ruledOutSites(observedSet, opts = {}) {
  const read = enteredSet(observedSet);
  const negatives = knownNegatives(read);
  if (!negatives.size) return [];
  // Per site, across its variants: ruled out only when EVERY variant that would explain something is contradicted.
  const byId = new Map();
  for (const site of solverSites(opts)) {
    let exp; try { exp = predictedSet(expectedFindings(site, opts), read); } catch { continue; }
    let explainsSomething = false;
    for (const t of read) if (exp.has(t)) { explainsSomething = true; break; }
```

- [ ] **Step 6: `minimalSet()`** — covers by the read token; a family counts once in the gain (row 17):

```js
  const readOf = new Map([...needAll].map(t => [t, enteredToken(t, observedSet)]));
  const read = new Set(readOf.values());
  const sites = differential(observedSet, opts)
    .map(c => ({ site: c.site, exp: c.exp, covers: new Set([...needAll].filter(f => c.exp.has(readOf.get(f)))) }))
    .filter(s => s.covers.size > 0);
```

```js
    for (const s of sites) {
      // A family is ONE finding (false-multifocal fix, row 17): its words count once in the gain. Otherwise one
      // cerebellar sign on each side covers eight words, and a hemipons wins the first pick of a two-place cover.
      const gain = new Set([...s.covers].filter(f => remaining.has(f)).map(f => readOf.get(f))).size;
      if (gain === 0) continue;
      const matched = [...s.exp].filter(f => read.has(f)).length;
      const overPredict = [...s.exp].filter(f => !read.has(f)).length;
```

- [ ] **Step 7: `nearFit()`** — the plain drop-one near-fit matches through the families (it still never drops a
  localising sign):

```js
  const observed = [...observedSet];
  const sites = solverSites(opts);
  const read = enteredSet(observedSet);
  const explainsAll = tokens => {
    for (const site of sites) {
      let exp; try { exp = predictedSet(expectedFindings(site, opts), read); } catch { continue; }
      if (tokens.every(t => exp.has(enteredToken(t, observedSet)))) return site;
    }
    return null;
  };
```

- [ ] **Step 8: `solve()` → `solveOne()` + the same-family near-fit** — rename `export function solve(` to
  `function solveOne(`, and replace

```js
  const nf = nearFit(localising, opts);
  const display = explainAll.length ? explainAll : diff;
```

with

```js
  // THE SAME-FAMILY NEAR-FIT (owner ruling 2026-10-22, false-multifocal fix rows 5–9) — the one exception to "a
  // LOCALISING sign is never relaxed away". A word entered INSTEAD of a family word that a place predicts on that
  // side, and that was not entered (face numbness for the face pain loss a lateral medulla gives): that place is a
  // near-fit, it leads the list, and NO multifocal claim is made — a single non-equivalent word gives one place, not
  // two lesions plus MS (audit round 1). Both words entered is not a substitution, so the claim stands (row 7).
  let sameFamily = null;
  if (!singleExplainsAll) {
    const read = enteredSet(localising);
    for (const c of diff) {
      if (c.n !== total - 1) break;
      const missing = [...localising].find(t => !c.explained.includes(t));
      const instead = sameFamilyInstead(enteredToken(missing, localising), c.exp, read);
      if (instead) { sameFamily = { site: c.site, missing, instead }; break; }
    }
  }
  if (sameFamily) multi = null;
  const nf = sameFamily || nearFit(localising, opts);
  const display = explainAll.length ? explainAll
    : sameFamily ? [diff.find(c => c.site.id === sameFamily.site.id), ...diff.filter(c => c.site.id !== sameFamily.site.id)]
    : diff;
```

- [ ] **Step 9: the background step and the new `solve()`** — append after `solveOne`:

```js
// ---- BACKGROUND (Hickam) — owner ruling 2026-10-22, false-multifocal fix rows 11–13 ----
// A common finding on BOTH sides (BACKGROUND_FINDINGS: absent ankle jerks, glove-and-stocking numbness) is set aside as
// a probably separate condition when it is what stops one place explaining the rest. It is KEPT when a place in the
// answer predicts it on both sides (GBS keeps its absent ankle jerks); it goes as a pair, never one side; and it never
// joins a multifocal cover, so a genuine two-lesion picture keeps its claim without a background place.
// Returns the tokens to set aside: [] when nothing is.
export function backgroundAside(observedSet, options = {}) {
  const opts = { dominantSide: options.dominantSide || "left", sensoryLevel: options.sensoryLevel };
  const entered = [...observedSet].filter(t => !PRESSURE_TOKEN.test(t) && !isNormalToken(t));
  const pairs = BACKGROUND_FINDINGS.filter(f => entered.includes(`${f}@left`) && entered.includes(`${f}@right`));
  if (!pairs.length) return [];
  const bg = new Set(pairs.flatMap(f => [`${f}@left`, `${f}@right`]));
  const rest = entered.filter(t => !bg.has(t));
  if (!rest.length) return [];                                 // the background IS the picture
  const full = differential(observedSet, opts);
  if (full.some(c => c.n === entered.length)) return [];       // one place explains it all, background included
  // The places in the answer: those explaining everything else, or else the cover of everything else.
  let answer = differential(new Set([...observedSet].filter(t => !bg.has(t))), opts).filter(c => c.n === rest.length);
  if (!answer.length) {
    const ms = minimalSet(new Set(rest), opts);
    answer = ms ? full.filter(c => ms.sites.some(s => s.id === c.site.id)) : [];
  }
  const kept = pairs.filter(f => answer.some(c => c.exp.has(`${f}@left`) && c.exp.has(`${f}@right`)));
  return pairs.filter(f => !kept.includes(f)).flatMap(f => [`${f}@left`, `${f}@right`]);
}

// The background step runs first: what it sets aside is not localised at all, and the rest is solved as usual.
// `background` is null, or { tokens } — the tokens set aside, for the card to name.
export function solve(observedSet, options = {}) {
  const aside = backgroundAside(observedSet, options);
  if (!aside.length) return { ...solveOne(observedSet, options), background: null };
  return { ...solveOne(new Set([...observedSet].filter(t => !aside.includes(t))), options), background: { tokens: aside } };
}
```

- [ ] **Step 10: `src/engine/score.js`** — import the families and read through them in `scoreSite`:

```js
import { expectedFindings } from "./forward.js";
import { enteredSet, enteredToken, predictedSet } from "./families.js";
```

```js
export function scoreSite(site, observedSet, opts = {}) {
  // Word families (false-multifocal fix): an entered word is matched through its family; the entered token is still
  // what is listed as matched or unexplained.
  const read = enteredSet(observedSet);
  const expected = predictedSet(expectedFindings(site, opts), read);
  let matched = [], missedByPatient = [], unexplained = [];

  for (const obs of observedSet) {
    if (expected.has(enteredToken(obs, observedSet))) matched.push(obs);
    else unexplained.push(obs); // patient has it, this site doesn't explain it
  }
  for (const exp of expected) {
    if (!read.has(exp)) missedByPatient.push(exp); // site predicts it, patient lacks it
  }
```

- [ ] **Step 11: Run the two suites to verify they pass, then the whole chain**

Run: `node test/false-multifocal.test.js && node test/relaxation.test.js && PATH=/Users/jaydenwearne/.local/node-v24.18.0-darwin-arm64/bin:$PATH npm test`
Expected: every line PASS; `npm test` green.

- [ ] **Step 12: Commit** — `git commit -am "feat(engine): match through word families; same-family near-fit; background step (rows 2-9, 11-13, 17)"`

### Task 3: The Why chain and the compare panel read through the families

**Files:**
- Modify: `src/engine/why.js` (`locusIndex`, `whyChain`)
- Modify: `app/discriminators.js` (`explainedBy`, `discriminators`)
- Test: `test/false-multifocal.test.js` (section 3)

**Interfaces:**
- Consumes: `enteredSet`, `enteredToken`, `predictedToken`, `indexTokens` (Task 1).

- [ ] **Step 1: Write the failing test (section 3)**

```js
// ---- 3. the Why chain and the compare panel ----
import { whyChain } from "../src/engine/why.js";
import { explainedBy, discriminators } from "../app/discriminators.js";
{
  const set = S("face_pain_loss@left spinothalamic@right miosis@left ptosis@left dysmetria@left dysphagia@left cn8_vertigo@left");
  const r = solve(set);
  const ch = whyChain(set, r.display[0].site);
  const step = ch.steps.find(s => s.finding === "dysmetria");
  ok("why: past-pointing is carried at the lateral medulla (the inferior peduncle)", step && step.explained && /cerebellar peduncle/.test(step.carrier), step && step.carrier);
  ok("why: ...and could arise along the whole cerebellar limb pathway, not only the cerebellum", step && step.stations.length > 1);
  ok("why: the picture meets at one place", ch.verdict === "one");
  ok("compare: the lateral medulla explains the past-pointing", explainedBy(r.display[0], set).includes("dysmetria@left"));
  ok("compare: limb ataxia is not offered as a finding still to examine",
     !discriminators(r.display.slice(0, 2), set).some(d => d.token === "limb_ataxia@left"));
}
```

- [ ] **Step 2: Run it to verify it fails** — `node test/false-multifocal.test.js`. Expected: the section-3 lines FAIL (the step for past-pointing is not explained at the medulla).

- [ ] **Step 3: `src/engine/why.js`**

```js
import { enteredSet, enteredToken, predictedToken, indexTokens } from "./families.js";
```

In `locusIndex`:

```js
    for (const t0 of E) for (const t of indexTokens(t0)) (idx.get(t) ?? idx.set(t, new Set()).get(t)).add(st);
```

In `whyChain`:

```js
  const idx = locusIndex(opts);
  // Word families (false-multifocal fix): each entered word is read through its family, so past-pointing is carried by
  // whatever carries limb ataxia at this place, and could arise wherever limb ataxia can.
  const read = enteredSet(observedSet);
  const toks = [...observedSet].filter(t => idx.has(enteredToken(t, observedSet)));
```

```js
    const [finding, bodySide] = token.split("@");
    const asRead = enteredToken(token, observedSet);
    const e = ex.find(x => predictedToken(`${x.finding}@${x.bodySide}`, read) === asRead);
```

```js
    const stations = [...idx.get(asRead)].sort(byOrder);
```

- [ ] **Step 4: `app/discriminators.js`**

```js
import { enteredSet, enteredToken } from "../src/engine/families.js";

// Which of the entered findings does this candidate account for? (Read through the word families: `cand.exp` holds the
// place's tokens as read — false-multifocal fix.)
export function explainedBy(cand, observed) {
  return [...observed].filter(t => cand.exp.has(enteredToken(t, observed)));
}
```

```js
  const tokens = new Set();
  const seen = enteredSet(observed);
  for (const c of candidates) for (const t of c.exp) if (!seen.has(t)) tokens.add(t);
```

- [ ] **Step 5: Run the suites** — `node test/false-multifocal.test.js && node test/why.test.js && node test/discriminators.test.js` → all PASS.

- [ ] **Step 6: Commit** — `git commit -am "feat(why): the Why chain and the compare panel read through the word families"`

### Task 4: The answer card and the app

**Files:**
- Modify: `app/answer.js` (`whereLine`, new `backgroundSentence`, `answerFor`)
- Modify: `app/app.js` (the counted total; the Where card's near-fit and set-aside notes)
- Test: `test/false-multifocal.test.js` (section 4)

**Interfaces:**
- Consumes: `r.background`, `r.nearFit.instead` (Task 2).
- Produces: `whereLine({ place, others, cover, fit, instead: { entered, gives } | null, background: string })`;
  `backgroundSentence(findings: string[], cord: boolean) → string`; `BACKGROUND_LINE`, `B12_LINE`.

- [ ] **Step 1: Write the failing test (section 4)**

```js
// ---- 4. the answer card ----
import { answerFor, whereLine } from "../app/answer.js";
const card = (t, o = {}) => {
  const tokens = S(t);
  const r = solve(tokens, { dominantSide: "left" });
  const sel = r.display.find(x => x.site.id === r.defaultSite) || r.display[0];
  return answerFor({ r, sel, total: tokens.size, tokens, onset: o.onset || "", course: "", dominant: "left", sensoryLevel: "",
    pinned: new Set(), scope: "site", selectedPathology: undefined, selectedEntity: undefined }).lines;
};
{
  const a = card("face_sensory_loss@left spinothalamic@right miosis@left ptosis@left limb_ataxia@left dysphagia@left");
  ok("card row 10: the near-fit Where line", a.where === "Left lateral medulla explains 5 of 6 findings. It gives face pain loss, but face numbness (thalamic pattern) was entered — re-examine that before calling this two lesions.", a.where);
  ok("card row 10: the Why line leaves the entered word out", a.why === "Left swallowing difficulty (dysphagia) + right body pain loss (spinothalamic loss) → only the left medulla.", a.why);
  ok("card: the What line is the place's own cause, not 'Together'", /^Most likely PICA/.test(a.what), a.what);
  const b = card("speech_nonfluent@none comprehension_impaired@none weak_arm@right facial_weakness@right forehead_spared@right homonymous_hemianopia@right reflex_ankle_loss@left reflex_ankle_loss@right");
  ok("card row 14: background after the place", b.where === "Left MCA territory. Absent ankle jerks on both sides are set aside: common with age and in a neuropathy, and probably a separate condition.", b.where);
  ok("card: the Why line is drawn without the set-aside pair", !/ankle/.test(b.why) && /only the left cerebral cortex/.test(b.why), b.why);
  const c = card("hyperreflexia@left hyperreflexia@right babinski@left babinski@right spasticity@left spasticity@right reflex_ankle_loss@left reflex_ankle_loss@right");
  ok("card row 15: a cord answer adds the B12 line", c.where.endsWith("Absent ankle jerks on both sides are set aside: common with age and in a neuropathy, and probably a separate condition. With a myelopathy, check B12 (subacute combined degeneration) before calling them separate."), c.where);
  const d = card("facial_weakness@right forehead_spared@right weak_arm@right homonymous_hemianopia@left reflex_ankle_loss@left reflex_ankle_loss@right");
  ok("card row 14: background after a two-lesion line too", /^No single place explains every finding — likely .+\. Absent ankle jerks on both sides are set aside/.test(d.where), d.where);
  ok("card: whereLine is unchanged without the new fields", whereLine({ place: "A", fit: { n: 3, total: 4 } }) === "A explains 3 of 4 findings.");
}
```

- [ ] **Step 2: Run it to verify it fails** — `node test/false-multifocal.test.js`. Expected: the section-4 lines FAIL.

- [ ] **Step 3: `app/answer.js`** — import `PLAIN`, add the sentences and extend `whereLine`:

```js
import { displayLabel, PLAIN } from "./plain-labels.js";
```

```js
// ---- Where ----
// A word as the near-fit line names it: its label, its proper name, and its row note when it has one — "face numbness
// (thalamic pattern)". The note is what says why two words for the face are different findings.
const wordFor = f => displayLabel(f) + (PLAIN[f] && PLAIN[f].note ? ` (${PLAIN[f].note})` : "");
// Background set aside (false-multifocal fix rows 11–15; wording approved by the owner 2026-10-22).
export const BACKGROUND_LINE = {
  reflex_ankle_loss: "Absent ankle jerks on both sides are set aside: common with age and in a neuropathy, and probably a separate condition.",
  distal_sensory_loss: "Glove-and-stocking numbness on both sides is set aside: a length-dependent neuropathy (most often diabetic) is common, and probably a separate condition.",
};
export const B12_LINE = "With a myelopathy, check B12 (subacute combined degeneration) before calling them separate.";
export const backgroundSentence = (findings, cord = false) =>
  findings.length ? findings.map(f => BACKGROUND_LINE[f]).join(" ") + (cord ? ` ${B12_LINE}` : "") : "";
export function whereLine({ place, others = [], cover = null, fit = null, instead = null, background = "" }) {
  const after = background ? ` ${background}` : "";
  if (cover && cover.length >= 2) return `No single place explains every finding — likely ${andList(cover)}.${after}`;
  // The same-family near-fit (rows 5–10): the place, both words, and what to do — never "two lesions".
  if (instead && fit) return `${place} explains ${fit.n} of ${fit.total} findings. It gives ${wordFor(instead.gives)}, but ${wordFor(instead.entered)} was entered — re-examine that before calling this two lesions.${after}`;
  if (fit && fit.n < fit.total) return `${place} explains ${fit.n} of ${fit.total} findings.${after}`;
  if (!others.length) return `${place}.${after}`;
  const n = others.length, shown = others.slice(0, 2);
  const more = n > 2 ? `, and ${n - 2} more` : "";
  return `${place}. ${n} other place${n > 1 ? "s" : ""} also fit${n > 1 ? "" : "s"}: ${shown.join(", ")}${more}.${after}`;
}
```

In `answerFor`, after `const twoLesions = …;`:

```js
  // Background set aside (rows 11–15) is not localised: it leaves the count and the Why line, and the Where line names
  // it. The same-family near-fit's entered word (rows 5–10) is named on the Where line and left out of the Why line,
  // which explains the rest.
  const aside = new Set(st.r.background ? st.r.background.tokens : []);
  const nf = st.r.nearFit && st.r.nearFit.instead && st.r.nearFit.site.id === st.sel.site.id ? st.r.nearFit : null;
  const whyTokens = new Set([...st.tokens].filter(t => !aside.has(t) && !(nf && t === nf.missing)));
  const total = st.total - aside.size;
  const background = backgroundSentence([...new Set([...aside].map(t => t.split("@")[0]))], st.sel.site.level === "cord");
```

and the `where` / `why` lines become:

```js
    where: whereLine({
      place: place(st.sel.site) + readingLabel(st.sel.site),
      others: list.filter(c => c.n === total && c.site.id !== st.sel.site.id).map(c => place(c.site)),
      cover: twoLesions ? sites.map(place) : null,
      fit: { n: st.sel.n, total },
      instead: nf ? { entered: nf.missing.split("@")[0], gives: nf.instead.split("@")[0] } : null,
      background,
    }),
    why: whySentence(whyClues(whyChain(whyTokens, st.sel.site, opts), whyTokens, opts)),
```

- [ ] **Step 4: `app/app.js`** — after `const r = solve(…);` add
  `const counted = total - (r.background ? r.background.tokens.length : 0);` (set-aside background is not a finding to
  explain), pass `counted` to `whereCard(list, cands, counted, r)` and `answerStrip(sel, list, counted, ans.nx)`, keep
  `total` for `answerFor` (it subtracts the background itself). Import `backgroundSentence` from `./answer.js`. In
  `whereCard`, replace the `near` line with:

```js
  const near = (!nAll && r.nearFit)
    ? (r.nearFit.instead
      // The same-family near-fit (false-multifocal fix row 10): both words, and no second lesion claimed.
      ? `<div class="annot"><b>Near-fit:</b> ${esc(siteName(r.nearFit.site))} explains all but ${esc(displayLabel(fid(r.nearFit.missing)))} — it gives ${esc(displayLabel(fid(r.nearFit.instead)))} on that side. Re-examine that finding; no second lesion is claimed.</div>`
      : `<div class="annot"><b>Near-fit:</b> ${esc(siteName(r.nearFit.site))} explains all but <code>${esc(r.nearFit.missing)}</code> — re-check that finding, or consider a second lesion.</div>`)
    : "";
  const bg = r.background
    ? `<div class="annot"><b>Set aside:</b> ${esc(backgroundSentence([...new Set(r.background.tokens.map(fid))], (list[0] && list[0].site.level === "cord")))}</div>` : "";
```

  and add `${bg}` after `${near}${multi}` in the card body.

- [ ] **Step 5: Run the suites** — `node test/false-multifocal.test.js && node test/answer.test.js && node test/app-smoke.test.js` → all PASS.

- [ ] **Step 6: Commit** — `git commit -am "feat(card): the near-fit names both words; background is set aside on the Where line (rows 10, 14, 15)"`

### Task 5: The three audit probes and the docs

**Files:**
- Modify: `test/clinical-audit.test.js` (three probes, row 19)
- Modify: `docs/superpowers/specs/2026-10-18-clinical-audit-suite.md` (a section for them)
- Modify: `CLAUDE.md` (a section for the fix; the layer list; the suite count), `docs/superpowers/specs/2026-10-22-false-multifocal-design.md` (status)

- [ ] **Step 1: Add the probes** — in `test/clinical-audit.test.js`, after the "Robustness & functional" probes and before
  the harness section:

```js
// owner-approved 2026-10-22 (false-multifocal fix, round 1, row 19): pictures the word families and the background
// step decide, which no audit probe covered. Each failed on the 2026-10-22 baseline (1afeddb).
T("Brainstem", "Wallenberg + limb ataxia AND its listed refinement past-pointing → lateral medulla, one lesion", "face_pain_loss@left spinothalamic@right miosis@left ptosis@left limb_ataxia@left dysmetria@left dysphagia@left", { first: /^left_medulla_lateral$/, single: true });
T("Vestibular & cerebellar", "truncal ataxia + gaze-evoked nystagmus + slurred speech (plain dysarthria) → a cerebellar site, one lesion", "truncal_ataxia@none nystagmus_gaze_evoked@none dysarthria@none", { first: /^cerebellum_/, single: true });
T("Roots, plexus & nerves", "carpal tunnel + absent ankle jerks on both sides → carpal tunnel, one lesion", "median_sensory@left weak_thumb_abduction@left reflex_ankle_loss@left reflex_ankle_loss@right", { first: /^left_nerve_median_carpal_tunnel$/, single: true });
```

- [ ] **Step 2: Run the audit** — `node test/clinical-audit.test.js | tail -30`. Expected: probes 86 / 108; counted
  checks 957 passed, 30 failed; swaps 223/224; comorbidity 292/292; mirror 270/270.

- [ ] **Step 3: Docs** — audit spec section "False-multifocal fix, round 1, row 19: three probes added (2026-10-22)";
  CLAUDE.md section "False-multifocal fix (DONE 2026-10-22)", the two new files in the layer list, the suite count;
  the design spec's status to IMPLEMENTED with the measured numbers.

- [ ] **Step 4: Commit** — `git commit -am "test(audit): three probes for the false-multifocal fix (row 19); docs"`

### Task 6: Verify

- [ ] `PATH=/Users/jaydenwearne/.local/node-v24.18.0-darwin-arm64/bin:$PATH npm test` → green (85 suites).
- [ ] `npm run test:audit` → the numbers in Task 5 Step 2.
- [ ] Drive the app (`preview_start neurolocaliser`): enter a Wallenberg with face numbness by row taps and read the
  answer card; enter the left MCA picture + absent ankle jerks with the "Both" button and read the card and the Where
  card; confirm the phone strip count.

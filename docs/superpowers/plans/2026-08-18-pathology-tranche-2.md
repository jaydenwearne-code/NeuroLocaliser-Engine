# Pathology Tranche 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every must-not-miss cause its own workup — starting with the mechanism (category files, a `family()` builder, a red ratchet) and round 1, the 28-member infarct family.

**Architecture:** `pathologyNextSteps.js` splits into `src/data/pathology/` — one file per sieve category, plus a `builders.js` holding `dz()` and the new `family()`. The parent module keeps only the builders' re-export, `PATHOLOGY_ALIAS`, `pathologyPlanFor()` and the assembly of the category files, so its public API is unchanged. A ratchet constant tracks how many red causes still lack a plan and may never rise.

**Tech Stack:** Zero-dependency ES modules, no build step. Node v24.18.0. Tests are plain node scripts with a local `ok()` helper.

## Global Constraints

- **Node is not on PATH.** Prefix every command: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"`.
- **Zero dependencies.** No installs, no build, no test framework.
- **Teaching prompts, not clinical directives.** No drug doses, no definitive management.
- **Never manufacture generic content.** Where nothing authored exists, the site fallback shows under its explicit label.
- **A family is a clinical claim, not a string match.** If members do not genuinely share a workup, they are singletons.
- **Content is authored for owner review.** Each category file carries a review-status header; nothing is presented as signed off until the owner says so.
- Working branch is `feat/pathology-tranche-2`, already created. Spec committed at `e00ddce`.
- Spec: `docs/superpowers/specs/2026-08-18-pathology-tranche-2-design.md`.

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `src/data/pathology/builders.js` | `DEFAULTS`, `fill()`, `dz()`, `family()`. No content. Imported by every content file AND by the parent — its own module so there is no import cycle. | Create |
| `src/data/pathology/vascular.js` | Vascular content. Receives 2 existing plans + round 1's 28 infarcts. | Create |
| `src/data/pathology/neoplastic.js` | 8 existing plans. | Create |
| `src/data/pathology/infective.js` | 8 existing plans. | Create |
| `src/data/pathology/inflammatory.js` | 3 existing plans. | Create |
| `src/data/pathology/metabolic.js` | 1 existing plan. | Create |
| `src/data/pathology/iatrogenic.js` | 1 existing plan. | Create |
| `src/data/pathology/mimic.js` | 1 existing plan. | Create |
| `src/data/pathologyNextSteps.js` | Builders re-export, `PATHOLOGY_ALIAS`, `pathologyPlanFor()`, assembly. Content removed. | Modify |
| `test/pathology-next-steps.test.js` | Family invariants + the ratchet. | Modify |

Categories with no plans yet (`traumatic`, `degenerative`, `congenital`) get their files when round 6 and rounds 13–14 need them. Creating them empty now would be YAGNI.

---

### Task 1: Split the content into category files

A pure move. No content changes, so **every existing test must stay green without being touched** — that is the proof the move was clean.

**Files:**
- Create: `src/data/pathology/builders.js`
- Create: `src/data/pathology/{vascular,neoplastic,infective,inflammatory,metabolic,iatrogenic,mimic}.js`
- Modify: `src/data/pathologyNextSteps.js`

**Interfaces:**
- Consumes: nothing new.
- Produces: `builders.js` exports `DEFAULTS`, `fill(str, slots)`, `dz(name, opts)`. Each content file exports a default object of `{ [name]: plan }`. `pathologyNextSteps.js` keeps exporting `PATHOLOGY_NEXT`, `PATHOLOGY_ALIAS`, `pathologyPlanFor` — **unchanged signatures**, since `nextSteps.js` and the test suite import them.

- [ ] **Step 1: Record the current behaviour as a baseline**

Before moving anything, capture what every plan currently renders, so the move can be proven lossless:

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node --input-type=module -e '
const R=process.cwd();
const P=await import(R+"/src/data/pathologyNextSteps.js");
const {candidateSites}=await import(R+"/src/engine/inverse.js");
const out={};
for (const n of Object.keys(P.PATHOLOGY_NEXT))
  for (const s of candidateSites()) out[n+"@"+s.id]=P.pathologyPlanFor(n,s);
console.log(JSON.stringify(out));' > /tmp/pathology-baseline.json && wc -c /tmp/pathology-baseline.json
```
Expected: a file of roughly 8–15 MB. Keep it for Step 5.

- [ ] **Step 2: Create the builders module**

Create `src/data/pathology/builders.js` by moving the four declarations verbatim out of `pathologyNextSteps.js` (`DEFAULTS`, `fill`, `dz`, and the comment block above them), adding `export` to each:

```js
// builders.js — the shape of a pathology plan. NO CONTENT: this module is imported by every content file
// in this directory AND by the parent pathologyNextSteps.js, so keeping it free of content is what stops
// an import cycle.

// Slot defaults used when a site has no `bySite` entry. Neutral, never invented specifics.
export const DEFAULTS = { level: "the affected region", flavour: "the appearance expected for this lesion" };

export const fill = (str, slots) => str.replace(/\{([a-z]+)\}/g, (_, k) => slots[k] ?? DEFAULTS[k] ?? "");

export const dz = (name, { confirmatory = [], monitoring = [], urgency = null, referral = null, bySite = {} }) =>
  ({ name, confirmatory, monitoring, urgency, referral, bySite });
```

- [ ] **Step 3: Move each plan into its category file**

Create the seven content files. Each has this shape — here is `mimic.js` in full, as the smallest and therefore the exact template:

```js
// mimic.js — pathology workups for the MIMIC category (spec 2026-08-18).
//
// A mimic is not a lesion at this site at all, so the workup's job is to EXCLUDE it fast, before the
// structural pathway is embarked on.
//
// REVIEW STATUS:
//   ✅ Hypoglycaemia — SIGNED OFF 2026-08-18 (tranche 1, round 3).
import { dz } from "./builders.js";

export default {
  "Hypoglycaemia": dz("Hypoglycaemia", { /* … moved verbatim … */ }),
};
```

Route each of the 24 existing plans by the category of its cause in `CAUSES` — this exact mapping:

| File | Plans |
|---|---|
| `vascular.js` | Posterior circulation stroke, Intracerebral haemorrhage |
| `neoplastic.js` | Glioma / metastasis, Nerve sheath tumour (schwannoma / neurofibroma), Perineural spread of head-and-neck malignancy, Schwannoma / meningioma / metastasis, Vertebral metastasis or myeloma, Nerve-root schwannoma or neurofibroma, Nasopharyngeal carcinoma, Malignant infiltration or vertebral metastasis |
| `infective.js` | Basal meningitis (tuberculous, carcinomatous or fungal), Herpes zoster, Lyme radiculitis (Bannwarth syndrome), Cerebral abscess, Herpes simplex encephalitis, Skull-base osteomyelitis (malignant otitis externa), Brainstem abscess or tuberculoma, Spinal epidural abscess |
| `inflammatory.js` | Demyelination, Vasculitic mononeuritis multiplex, Neuralgic amyotrophy |
| `metabolic.js` | Wernicke's encephalopathy |
| `iatrogenic.js` | Radiation plexopathy |
| `mimic.js` | Hypoglycaemia |

Carry each plan's own comment block with it. The tranche-1 review-status header in `pathologyNextSteps.js` is split across the files it describes.

- [ ] **Step 4: Reduce the parent to builders, alias, API and assembly**

`src/data/pathologyNextSteps.js` becomes:

```js
// pathologyNextSteps.js — the PER-PATHOLOGY workup layer (spec 2026-08-18, split 2026-08-18).
//
//   pathologyPlanFor(name, site) -> { confirmatory, monitoring, urgency, referral } | null
//
// CONTENT LIVES IN ./pathology/, one file per sieve category — at 37 lines per plan a single file would
// reach ~13,000 lines by the end of tranche 2 and stop being reviewable, which defeats the point of
// isolating content from the UI. A review round opens exactly one category file.
//
// DELIBERATELY NOT keyed by canonicalKey(): that collapses 93 names onto 10 very coarse entities — the
// `Metastases` entity alone swallows 40 names, from "Orbital tumour or metastasis" to "Metastasis to the
// pituitary stalk", which share almost no workup. Exact synonyms use PATHOLOGY_ALIAS instead.
import { DEFAULTS, fill } from "./pathology/builders.js";
import vascular from "./pathology/vascular.js";
import neoplastic from "./pathology/neoplastic.js";
import infective from "./pathology/infective.js";
import inflammatory from "./pathology/inflammatory.js";
import metabolic from "./pathology/metabolic.js";
import iatrogenic from "./pathology/iatrogenic.js";
import mimic from "./pathology/mimic.js";

export { dz, family, FAMILIES } from "./pathology/builders.js";

// Exact synonyms only — two spellings of ONE disease that must share one plan. NOT a place to merge
// related-but-different entities; the no-two-identical-plans invariant is what keeps that honest.
export const PATHOLOGY_ALIAS = {
  // Two spellings of ONE disease, at DISJOINT sets of sites (31 keys vs 6), which is exactly how the
  // duplicate survived the causes sweep unnoticed.
  "Demyelination (MS)": "Demyelination",
};

export const PATHOLOGY_NEXT = {
  ...vascular, ...neoplastic, ...infective, ...inflammatory, ...metabolic, ...iatrogenic, ...mimic,
};

export function pathologyPlanFor(name, site) {
  const key = PATHOLOGY_ALIAS[name] || name;
  const p = PATHOLOGY_NEXT[key];
  if (!p) return null;
  const slots = { ...DEFAULTS, ...(p.bySite[site?.id] || p.bySite[`${site?.level}_${site?.part}`] || {}) };
  return {
    confirmatory: p.confirmatory.map(s => fill(s, slots)),
    monitoring: p.monitoring.map(s => fill(s, slots)),
    urgency: p.urgency,
    referral: p.referral,
  };
}
```

- [ ] **Step 5: Prove the move was lossless**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node --input-type=module -e '
const R=process.cwd();
const P=await import(R+"/src/data/pathologyNextSteps.js");
const {candidateSites}=await import(R+"/src/engine/inverse.js");
const out={};
for (const n of Object.keys(P.PATHOLOGY_NEXT))
  for (const s of candidateSites()) out[n+"@"+s.id]=P.pathologyPlanFor(n,s);
const {readFileSync}=await import("node:fs");
const before=readFileSync("/tmp/pathology-baseline.json","utf8").trim();
console.log(JSON.stringify(out)===before ? "IDENTICAL — the move changed nothing" : "DRIFT — the move altered output");'
```
Expected: `IDENTICAL — the move changed nothing`.

- [ ] **Step 6: Run the full suite, untouched**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test 2>&1 | grep -c "^FAIL" || echo "no failures"
```
Expected: `no failures`. **No test file may be edited in this task** — if one needs changing, the move was not pure.

- [ ] **Step 7: Commit**

```bash
git add src/data/pathology src/data/pathologyNextSteps.js
git commit -m "refactor(pathology): split content into per-category files"
```

---

### Task 2: The `family()` builder

**Files:**
- Modify: `src/data/pathology/builders.js`
- Modify: `test/pathology-next-steps.test.js`

**Interfaces:**
- Consumes: `dz`, `fill` (Task 1).
- Produces: `family(label, spine, members)` and `FAMILIES` exported from `builders.js`. Returns `{ [name]: plan }` ready to spread into a content file's default export. `label` is the family's name (`"infarct"`), recorded in `FAMILIES` so Task 3's invariants can check membership without content files declaring it twice. `spine` is `{ confirmatory, monitoring, urgency, referral }`. Each member is `{ slots?, confirmatory?, monitoring?, confirmatoryExtra?, monitoringExtra?, urgency?, referral?, bySite? }`.

- [ ] **Step 1: Write the failing test**

Add to `test/pathology-next-steps.test.js`, importing `family` from the parent module (which re-exports it):

```js
// --- family(): one authored spine, several NAMED plans (spec 2026-08-18) ---
{
  const spine = {
    confirmatory: ["Image {level} urgently", "Establish the time of onset"],
    monitoring:   ["Watch {flavour}"],
    urgency: "emergency",
    referral: "Acute stroke pathway",
  };
  const fam = family("test-infarct", spine, {
    "A infarct": { slots: { level: "the brain", flavour: "conscious level" } },
    "B infarct": { slots: { level: "the cord", flavour: "the sensory level" },
                   confirmatoryExtra: ["Check the aorta"] },
    "C infarct": { slots: { level: "the brain", flavour: "conscious level" },
                   confirmatory: ["A completely different workup"], urgency: "urgent" },
  });

  ok("family emits one plan per member", Object.keys(fam).length === 3);
  ok("family records itself in the registry", FAMILIES["test-infarct"].length === 3);
  ok("a member interpolates the spine's slots",
     fam["A infarct"].confirmatory[0] === "Image the brain urgently");
  ok("members interpolate DIFFERENTLY",
     fam["B infarct"].confirmatory[0] === "Image the cord urgently");
  ok("confirmatoryExtra APPENDS to the spine",
     fam["B infarct"].confirmatory.length === 3 && fam["B infarct"].confirmatory[2] === "Check the aorta");
  ok("confirmatory REPLACES the spine outright",
     JSON.stringify(fam["C infarct"].confirmatory) === JSON.stringify(["A completely different workup"]));
  ok("a member inherits the spine's urgency", fam["A infarct"].urgency === "emergency");
  ok("a member may override urgency", fam["C infarct"].urgency === "urgent");
  ok("a member inherits the spine's referral", fam["A infarct"].referral === "Acute stroke pathway");
  ok("each plan carries its own name", fam["B infarct"].name === "B infarct");
  ok("monitoring interpolates too", fam["A infarct"].monitoring[0] === "Watch conscious level");
}
```

Extend the import at the top of the file:

```js
import { PATHOLOGY_NEXT, PATHOLOGY_ALIAS, pathologyPlanFor, family, FAMILIES } from "../src/data/pathologyNextSteps.js";
```

- [ ] **Step 2: Run test to verify it fails**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/pathology-next-steps.test.js
```
Expected: FAIL — `The requested module ... does not provide an export named 'family'`.

- [ ] **Step 3: Write the implementation**

Append to `src/data/pathology/builders.js`:

```js
// family() — ONE authored spine, SEVERAL named plans. The tranche-1 `dz()` spine handles one NAME across
// many sites; this handles several NAMES sharing a workup, which is what the red set is full of (28
// infarcts, 24 haemorrhages, 20 metastases). Writing the stroke pathway out 28 times is exactly the drift
// rootNS() was built to prevent.
//
// A member diverges at one of three levels, so the builder never forces a false shared answer:
//   slots              — same workup, different anatomy (interpolates the spine's {level} / {flavour})
//   confirmatoryExtra  — same workup plus something
//   confirmatory       — a genuinely DIFFERENT workup, replacing the spine's outright
// The third exists because meningioma and metastasis share a head noun and diverge on the investigations
// themselves (owner ruling, 2026-08-18).
//
// A FAMILY IS A CLINICAL CLAIM, NOT A STRING MATCH. Two invariants keep it honest: no two members may
// emit an identical plan, and a family must have at least three members.
// Every family() call registers its members here, so the invariants in test/pathology-next-steps.test.js
// can check membership without each content file declaring it a second time (which could drift).
export const FAMILIES = {};

export const family = (label, spine, members) => {
  FAMILIES[label] = Object.keys(members);
  return Object.fromEntries(
    Object.entries(members).map(([name, m]) => [name, dz(name, {
      confirmatory: m.confirmatory
        ?? [...(spine.confirmatory || []).map(s => fill(s, m.slots || {})), ...(m.confirmatoryExtra || [])],
      monitoring: m.monitoring
        ?? [...(spine.monitoring || []).map(s => fill(s, m.slots || {})), ...(m.monitoringExtra || [])],
      urgency:  m.urgency  ?? spine.urgency,
      referral: m.referral ?? spine.referral,
      bySite:   m.bySite   ?? {},
    })]));
};
```

- [ ] **Step 4: Run test to verify it passes**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/pathology-next-steps.test.js
```
Expected: PASS on all ten family assertions.

- [ ] **Step 5: Commit**

```bash
git add src/data/pathology/builders.js test/pathology-next-steps.test.js
git commit -m "feat(pathology): family() builder — one spine, several named plans"
```

---

### Task 3: The family invariants and the red ratchet

**Files:**
- Modify: `test/pathology-next-steps.test.js`
- Modify: none — assertions only. If a real family fails the ≥3 rule, the fix is in the CONTENT (fold it into singletons), never in the builder.

**Interfaces:**
- Consumes: `family` (Task 2), `PATHOLOGY_NEXT`, `CAUSES`.
- Produces: no new exports. This task is assertions only — `family()` and `FAMILIES` both landed in Task 2.

- [ ] **Step 1: Write the failing test**

Add to `test/pathology-next-steps.test.js`:

```js
// --- family invariants: a family is a CLINICAL CLAIM, not a string match ---
{
  for (const [label, names] of Object.entries(FAMILIES)) {
    ok(`family \`${label}\` has at least 3 members (${names.length})`, names.length >= 3,
       "two plans sharing a spine is two plans with extra indirection");
    const rendered = names.map(n => JSON.stringify({
      c: PATHOLOGY_NEXT[n].confirmatory, m: PATHOLOGY_NEXT[n].monitoring,
      u: PATHOLOGY_NEXT[n].urgency, r: PATHOLOGY_NEXT[n].referral,
    }));
    ok(`family \`${label}\` has no two members emitting an identical plan`,
       new Set(rendered).size === rendered.length,
       "identical members mean the family is duplication wearing a hat");
  }
}

// --- THE RED RATCHET: every must-not-miss must end up with a workup ---
// Asserted as a CEILING rather than an end state, because a plain "all red causes have a plan" would fail
// for all fourteen authoring rounds. The count starts at 337, falls with every round, and NEVER rises.
// At 0 the ratchet retires into a hard gate — and keeps working after tranche 2, since it stops a future
// red cause being added with no workup behind it.
const RED_WITHOUT_PLAN_CEILING = 337;   // LOWER this with each round; never raise it
{
  const planned = new Set([...Object.keys(PATHOLOGY_NEXT), ...Object.keys(PATHOLOGY_ALIAS)]);
  const redNames = new Set();
  for (const list of Object.values(CAUSES)) for (const c of list) if (c.red) redNames.add(c.name);
  const unplanned = [...redNames].filter(n => !planned.has(n));

  ok(`RED RATCHET: red causes without a plan is ${unplanned.length}, ceiling ${RED_WITHOUT_PLAN_CEILING}`,
     unplanned.length <= RED_WITHOUT_PLAN_CEILING,
     `went UP — a red cause was added without a workup: ${unplanned.slice(0, 3).join(" ; ")}`);
  ok(`RED RATCHET is tight (ceiling should equal the actual ${unplanned.length})`,
     RED_WITHOUT_PLAN_CEILING === unplanned.length,
     "lower RED_WITHOUT_PLAN_CEILING to the actual count — a slack ceiling stops ratcheting");
}
```

Add `FAMILIES` to the parent import:

```js
import { PATHOLOGY_NEXT, PATHOLOGY_ALIAS, pathologyPlanFor, family, FAMILIES } from "../src/data/pathologyNextSteps.js";
```

- [ ] **Step 2: Run test to verify it fails**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/pathology-next-steps.test.js
```
Expected: FAIL — no export named `FAMILIES`.

- [ ] **Step 3: No implementation needed — `FAMILIES` already exists**

`family()` and `FAMILIES` were both defined in Task 2, so this task adds assertions only. If the test
still reports no export named `FAMILIES`, Task 2 was not completed — go back rather than redefining it
here.

- [ ] **Step 4: Run test to verify it passes**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/pathology-next-steps.test.js
```
Expected: PASS, including `RED RATCHET: red causes without a plan is 337, ceiling 337`.

If the actual count is not 337, **lower the constant to the actual number and do not adjust the test** —
the measurement is the truth, and a mismatch means the red set moved since the spec was written.

- [ ] **Step 5: Run the full suite and commit**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test 2>&1 | grep -c "^FAIL" || echo "no failures"
git add src/data/pathology/builders.js src/data/pathologyNextSteps.js test/pathology-next-steps.test.js
git commit -m "test(pathology): family invariants + the red ratchet at 337"
```

---

### Task 4: Round 1 — the infarct family (28 members)

**This is clinical authoring, held for owner review before merge.** All 28 are `vascular`, so this task
opens exactly one file.

**Files:**
- Modify: `src/data/pathology/vascular.js`
- Modify: `test/pathology-next-steps.test.js` (lower the ratchet only)

**Interfaces:**
- Consumes: `family` (Task 3). Produces: 28 new `PATHOLOGY_NEXT` keys under the family label `"infarct"`.

The 28 members and their host sites:

| Member | Hosts |
|---|---|
| MCA inferior division infarct | cortex_temporoparietal, cortex_temporal, cortex_mca_inferior, cortex_parietal |
| Brainstem infarct | pontomesencephalic_tegmentum, guillain_mollaret_rubral |
| Artery of Percheron infarct | thalamus_arousal_paramedian, thalamus_limbic |
| MCA territory infarct | cortex_frontal_eye_field, cortex_insula |
| MCA superior division infarct | cortex_mca_superior, cortex_motor_facearm |
| Border-zone (watershed) infarct from hypoperfusion | cortex_watershed_anterior, cortex_watershed_posterior |
| Bilateral medial medullary infarct | medulla_medial |
| Posterior cerebral / basilar perforator infarct | midbrain_lateral |
| Dorsal midbrain infarct | dorsal_midbrain_tectum |
| AICA territory infarct | pons_lateral |
| AICA territory infarct involving the trigeminal complex | pons_lateral_trigeminal |
| Top-of-the-basilar / brainstem infarct | brainstem_aras_paramedian_tegmentum |
| Cerebellar infarct or haemorrhage | cerebellum_vermis |
| Cerebellar infarct (PICA) | cerebellum_flocculonodular |
| Cerebellar infarct (SCA / PICA) | cerebellum_hemisphere |
| Spinal cord infarct (anterior spinal artery) | cord_transverse |
| Partial cord infarct | cord_hemi |
| Cord infarct | cord_lateral |
| Cord infarct at the conus | conus_medullaris |
| Artery of Percheron or paramedian thalamic infarct | hypothalamus_mammillary |
| Striatocapsular infarct from PROXIMAL MCA occlusion | aphasia_subcortical_striatocapsular |
| Small cortical infarct or TIA | cortex_sensory_hand |
| Bilateral ACA territory infarct | cortex_paracentral |
| Bilateral temporal (Heschl's gyrus) infarcts | cortex_auditory |
| Large MCA territory (or ICA) infarct | cortex_aphasia_global |
| Labyrinthine artery infarct (AICA territory) | skull_base_iam |
| Malignant MCA infarction (space-occupying oedema) | cortex_mca |
| MCA infarct (postcentral / parietal branch) | cortex_sensory_facearm |

- [ ] **Step 1: Write the shared spine**

In `src/data/pathology/vascular.js`, add the spine. It carries what is true of every ischaemic infarct —
the clock, the imaging, the reperfusion question, the aetiology hunt — anchored on `{level}` (what to
image) and `{flavour}` (what to watch):

```js
import { dz, family } from "./builders.js";

const INFARCT_SPINE = {
  confirmatory: [
    "Establish the TIME LAST KNOWN WELL before anything else — it is what decides whether reperfusion is on the table, and it cannot be reconstructed later",
    "Non-contrast CT first to exclude haemorrhage, then CT angiography from arch to vertex for a large-vessel occlusion",
    "MRI with DWI where the diagnosis is uncertain or the CT is normal — {flavour}",
    "Aetiology work-up once the diagnosis is secure: cardiac rhythm monitoring for atrial fibrillation, echocardiography, carotid or vertebral imaging, and a vascular risk profile",
  ],
  monitoring: [
    "Swallow screen before anything by mouth — this is the single most preventable early complication",
    "Neurological observations tracking {level}, on a defined schedule rather than as needed",
    "SAFETY NET: any deterioration in conscious level or new deficit means immediate reimaging for haemorrhagic transformation or extension, not observation",
    "Glucose, temperature and blood pressure are all treatments here, not background measurements",
  ],
  urgency: "emergency",
  referral: "Acute stroke pathway — time-critical, and reperfusion may be on the table",
};
```

A worked member, showing `slots` plus `bySite` for a multi-host member:

```js
export default {
  ...family("infarct", INFARCT_SPINE, {
    "MCA superior division infarct": {
      slots: { level: "face and arm power and speech output",
               flavour: "the superior division territory spares the visual field, which is what separates it from a complete MCA infarct" },
      bySite: {
        cortex_mca_superior: { level: "face and arm power, and expressive speech" },
        cortex_motor_facearm: { level: "face and arm power specifically, with the leg spared" },
      },
    },
    // … 27 more …
  }),
  // the two tranche-1 vascular plans, moved in Task 1, stay alongside
};
```

Three members need judgement rather than the spine, and should be handled with an override, not forced:

- **Cord infarct ×4** (`cord_transverse`, `cord_hemi`, `cord_lateral`, `conus_medullaris`) — the brain
  reperfusion pathway does not apply. These want aortic imaging, a search for the aortic or vertebral
  source, and the recognition that MRI can be normal early. Use `confirmatory:` to replace outright.
- **Cerebellar infarct or haemorrhage** — the name spans both, and haemorrhage changes the answer. Either
  override, or flag it to the owner as a `CAUSES` naming problem rather than papering over it here.
- **Malignant MCA infarction (space-occupying oedema)** — the distinguishing content is the decompressive
  craniectomy window and the conscious-level watch, so it wants `monitoringExtra` at minimum.

- [ ] **Step 2: Author the 28 members**

Every member supplies `slots` for `{level}` and `{flavour}`, plus `bySite` where it spans more than one
host and the hosts genuinely differ. Multi-host members (the first six rows above) are where `bySite`
earns its place.

- [ ] **Step 3: Run the invariants after each group of members**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/pathology-next-steps.test.js 2>&1 | grep -E "^FAIL|family .infarct|failed$"
```
Expected: PASS on `family \`infarct\` has no two members emitting an identical plan`. A failure here means
two members are saying the same thing and one of them needs its own slots, extra, or override.

- [ ] **Step 4: Lower the ratchet**

Re-run and read the actual count, then set the constant to it:

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/pathology-next-steps.test.js 2>&1 | grep "RED RATCHET"
```
Expected after 28 members: `red causes without a plan is 309`. Set `RED_WITHOUT_PLAN_CEILING = 309`.

- [ ] **Step 5: Full suite**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test 2>&1 | grep -c "^FAIL" || echo "no failures"
```

- [ ] **Step 6: Commit and present for review**

```bash
git add src/data/pathology/vascular.js test/pathology-next-steps.test.js
git commit -m "content(pathology): round 1 — the infarct family (28 members)"
```

Then present to the owner: the spine, what each member overrides and why, and the specific claims worth
scrutiny. **Do not mark it signed off until the owner says so.**

---

### Task 5: Verify and open the PR

**Files:** none modified.

- [ ] **Step 1: Confirm nothing regressed**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node --input-type=module -e '
const R=process.cwd();
const [N,I]=await Promise.all([import(R+"/src/data/nextSteps.js"),import(R+"/src/engine/inverse.js")]);
const sites=I.candidateSites();
const bad=sites.filter(s=>JSON.stringify(N.pathologyNextStepsFor(s,null))!==JSON.stringify({...N.nextStepsFor(s),pathology:null,pathologyCurated:false}));
console.log(bad.length===0?"UNCHANGED at all "+sites.length+" sites":"DRIFT at "+bad.length);'
```
Expected: `UNCHANGED at all 377 sites`.

- [ ] **Step 2: Report coverage**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node --input-type=module -e '
const R=process.cwd();
const [P,C]=await Promise.all([import(R+"/src/data/pathologyNextSteps.js"),import(R+"/src/data/causes.js")]);
const all=Object.keys(C.CAUSES).flatMap(k=>C.CAUSES[k]);
const named=new Set([...Object.keys(P.PATHOLOGY_NEXT),...Object.keys(P.PATHOLOGY_ALIAS)]);
const rows=all.filter(c=>named.has(c.name)).length;
console.log(Object.keys(P.PATHOLOGY_NEXT).length+" plans | "+rows+"/"+all.length+" rows ("+(100*rows/all.length).toFixed(0)+"%)");'
```

- [ ] **Step 3: Measure the suite honestly**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test 2>&1 | grep -E "^[0-9]+ passed" | awk '{s+=$1;n++} END {print n" suites, "s" assertions"}'
```
Use this number in the PR body. **Do not carry a count over from another branch** — that error was made twice in tranche 1.

- [ ] **Step 4: Open the PR**

```bash
export PATH="$HOME/.local/gh_2.97.0_macOS_arm64/bin:$PATH"
git push -u origin feat/pathology-tranche-2
gh pr create --title "Pathology tranche 2: mechanism + the infarct family" --body "$(cat <<'EOF'
… compose from the points below …
EOF
)"
```

The body should state: the danger-not-coverage decision and why (709 of 831 names are single-site), the
category split and that the move was proven lossless against a baseline, the `family()` builder with its
three override levels, the ratchet's current value, and that rounds 2–14 follow against the spec.

---

## Rounds 2–14

Not planned in detail — each is the same task shape as Task 4 and runs against the spec:

1. Author the round's families or category into its content file.
2. Run `test/pathology-next-steps.test.js`; the no-two-identical-members invariant is the one that bites.
3. Lower `RED_WITHOUT_PLAN_CEILING` to the new actual count.
4. Full suite, commit, present to the owner, wait for sign-off before the next round.

The order is in the spec's two round tables. When the ratchet reaches **0**, delete it and replace with a
plain assertion that no red cause lacks a plan — the gate the ratchet was climbing towards.

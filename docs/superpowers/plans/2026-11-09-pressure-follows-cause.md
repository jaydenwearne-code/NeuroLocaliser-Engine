# Pressure follows the cause — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status: PLAN — not yet implemented.** It implements every ruling of round 1 in
`docs/superpowers/specs/2026-11-09-pressure-follows-cause-design.md` (owner: *"Approve as written"*, 2026-11-10).

**The code in this plan was dry-run**, task by task, on a throwaway copy of this branch at `7966a70`. After the last task:
- `npm test`: 88 suites / 7495 green;
- audit: 1063 passed, 9 failed (probes 112 / 119);
- the card sample matches the prototype's on 7,518 of 7,530 cards (the 12 are decision 1 below) and on all 1,226 pairs;
- the 46 + 41 captured cards are identical.

The dry-run copy (`work/`), its diff (`plan.diff`) and the stage scripts (`stages.sh`, `red.sh`) are in `/Users/jaydenwearne/Library/Application Support/Claude/side-session-notes/local_95cb1331-2672-472f-a200-e244e8a2b3a8/pressure-cause-prototype/plan/`.

**Goal:** With papilloedema entered, the What line, the Next plan and the badge follow a cause that can raise the
intracranial pressure, or the pressure itself where no cause at the place can. The IV's cisternal course joins the pressure's
reach.

**Architecture:**
- `causes.js` gets one table, `CAN_RAISE_PRESSURE` (category defaults and two name patterns), and a second demotion axis in
  `causesFor` beside the tempo. The axis applies only where `pressureDemotesAt(site)`: the compartment filter's own test,
  with the retina exempt.
- In `nextSteps.js`, `pressureFollows` (the mirror of `onsetFollows`) chooses the followed cause's signed-off plan, and
  `pressureFloor` keeps the badge off routine. The hyperacute escalation is untouched.
- In `app/answer.js`, `resolveNext` carries the pressure and follows the pressure itself where nothing can raise it. The file
  also holds the approved wording.
- `app/app.js` renders the What card's papilloedema band and the Next card's notes.
- `PRESSURE_REACHES` gains the IV.
- No structure, cause, workup or phonebook entry is added or edited.

Prototype flags for each task live in `/Users/jaydenwearne/Library/Application Support/Claude/side-session-notes/local_95cb1331-2672-472f-a200-e244e8a2b3a8/pressure-cause-prototype/lib.mjs` (the recommended set is `rec.txt`).

**Tech stack:** zero-dependency ES modules, Node 24, standalone test scripts (`ok(label, cond)`, `process.exit`).

## Global constraints

- Node is not on PATH: prefix every command with `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"`.
- Work in `/Users/jaydenwearne/Desktop/Personal/Claude Code/Projects/NeuroLocaliser/Code/neurolocaliser-pressure-cause` (branch `fix/pressure-follows-cause`). Never push; no PR.
- `npm run test:audit` is NOT part of `npm test`; never wire it in and never loosen an audit assertion.
- Site ids never change. No site, structure, cause, workup or phonebook entry is added or edited.
- The owner's wording is used verbatim: spec rows 16–18, and the pressure-only lines of the raised-pressure round's row 10.
- Without papilloedema nothing may change. Every existing suite passes unedited, except the three re-pins of row 19.
- No CSS changes (the `--terra` allowlist in `test/brand.test.js` is untouched).
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Decisions this plan makes that the spec does not spell out

Each follows from a ruling; each is open to your veto before building.

1. **The retina never follows the pressure, even when an onset alone empties its list.** `pressureLeads` asks for a place
   where the pressure demotes, and row 7 exempts the retina. The prototype let the 12 chronic retina cards follow the
   pressure. Here they keep today's line (*"No cause here typically starts this way — 8 set aside."*) and the retina's own
   emergency plan, so §5's chronic "the pressure leads" count becomes 71, not 83.
2. **The What card follows the answer card.** When the pressure leads, the What card's lead line is the pressure-only What
   line, and its red-flag box is not drawn (the banner is the red line). Its causes all sit in the papilloedema band.
3. **"Selectable" (row 1) is honoured in the papilloedema band.** Its causes render as ordinary cause rows, so a clinician can
   still select the lacune (the papilloedema may be unrelated) and get its plan, floored at urgent. The tempo band stays as
   it is: not selectable, the 2026-09-29 behaviour. A cause both axes demote sits there.
4. **The all-sites What view splits its demoted shared causes the same way.** When every shared cause is set aside for the
   pressure, it says *"Every shared cause is set aside with papilloedema — see "less likely with papilloedema" below."* This is
   new wording, in the shape of the tempo sentence beside it.
5. **The floor also covers a selection and a selected cross-site disease** (`pathologyNextStepsFor`, `combinedNextSteps`), so
   no plan shown under the banner is routine.
6. **A two-place card, a selection and the all-sites view never follow the pressure itself** (`resolveNext`). The Together card
   names its disease, and a selection is the clinician's choice.
7. **`causesFor` adds `pressure: true` to its result only when the pressure acted, and `nextStepsFor` adds nothing without
   papilloedema.** So every output without papilloedema is byte-identical (asserted).

## File map

| File | Change | Task |
|---|---|---|
| `test/pressure-follows.test.js` | **new** suite pinning rows 1–18 and the guards | 1, 2, 3, 5 |
| `package.json` | append `node test/pressure-follows.test.js` to `test` | 1 |
| `src/data/causes.js` | `CAN_RAISE_PRESSURE`, `canRaisePressure`, `pressureDemotesAt`; the `causesFor` second axis; `combinedCauses` | 1 |
| `src/data/nextSteps.js` | `pressureFollows`, `pressureFloor`; `nextStepsFor`, `pathologyNextStepsFor`, `combinedNextSteps` | 2 |
| `app/answer.js` | `resolveNext` (the pressure; the pressure leads), `pressureLeads`; `answerFor`; `PRESSURE_BAND`, `PRESSURE_LEADS_NOTE`, `followNote`, `demotionReason` | 3 |
| `app/app.js` | the What card's papilloedema band (one site and all sites), the What card when the pressure leads, the Next card's notes | 4 |
| `src/model/compartments.js` | `PRESSURE_REACHES` gains the IV | 5 |
| `test/raised-pressure.test.js` | the three re-pins (row 19) | 5 |
| `test/clinical-audit.test.js`, `docs/superpowers/specs/2026-10-18-clinical-audit-suite.md` | the `lead` check, four probes, and their record | 6 |
| `CLAUDE.md`, the spec, this plan, `Code/.claude/launch.json` | docs, status, a preview entry | 7 |

---

### Task 1: Which causes can raise the pressure, and the second demotion axis (rows 1–7) + the new suite

**Files:**
- Create: `test/pressure-follows.test.js`
- Modify: `src/data/causes.js` (an import, the table, `causesFor`, `combinedCauses`), `package.json` (the `test` script)

**Interfaces:**
- Produces: `CAN_RAISE_PRESSURE` (`{ categories: Set, can: RegExp, cannot: RegExp }`), `canRaisePressure(cause) → boolean`
  (reads `cause.name`, `cause.cat`), `pressureDemotesAt(site) → boolean`, all exported from `src/data/causes.js`.
- Produces: `causesFor(site, { onset, pressure })`. With `pressure` true at a place where `pressureDemotesAt`, a cause that
  cannot raise the pressure moves to `demoted` with `demotion: { axis: "pressure", entered: "papilloedema", expected: [] }`.
  A cause both axes demote keeps `{ axis: "tempo", … }` and gains `pressure: true`. The result gains `pressure: true` only
  then. `combinedCauses(sites, { onset, pressure })` passes it on.
- Produces: `test/pressure-follows.test.js` with helpers `ok`, `same`, `T`, `SITE`, `P`, `ONSETS`, `canRaise`, `demotesAt`,
  `pressureFollows`, `pressureLeads`, `followNote`, `demotionReason`, `leadOf`, `keyOf`, `INPLAY`, `KINDS` and `card`. Later
  tasks append sections ABOVE the `// ---- report ----` block.

- [ ] **Step 1: Write the suite (header, sections A and B, report)**

Create `test/pressure-follows.test.js`:

```js
// pressure-follows.test.js — pressure follows the cause (owner-ruled 2026-11-10; spec
// docs/superpowers/specs/2026-11-09-pressure-follows-cause-design.md). Papilloedema demotes the causes that cannot raise the
// intracranial pressure, the plan follows the cause the What line names, and where nothing at the place can raise it the card
// follows the pressure itself. Pins rows 1–18 of round 1. Run: node test/pressure-follows.test.js
import { solve, candidateSites, isNormalToken, INTRACRANIAL_LEVELS } from "../src/engine/inverse.js";
import { expectedFindings } from "../src/engine/forward.js";
import { CAUSES, causesFor, leadingCause, combinedCauses } from "../src/data/causes.js";
import * as CZ from "../src/data/causes.js";
import { sitePlan, nextStepsFor, onsetFollows, pathologyNextStepsFor, resolveUrgency } from "../src/data/nextSteps.js";
import * as NX from "../src/data/nextSteps.js";
import { pathologyPlanFor } from "../src/data/pathologyNextSteps.js";
import { PRESSURE_REACHES } from "../src/model/compartments.js";
import * as ANS from "../app/answer.js";

let pass = 0, fail = 0;
const ok = (label, cond, detail = "") => { cond ? pass++ : fail++; console.log((cond ? "PASS  " : "FAIL  ") + label + (cond ? "" : `  ${detail}`)); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const T = s => new Set(s.split(/\s+/).filter(Boolean));
const SITE = Object.fromEntries(candidateSites().map(s => [s.id, s]));
const P = "papilloedema@none";
const ONSETS = [undefined, "hyperacute", "acute", "subacute", "chronic"];
// Read from the module namespaces, so a missing export fails its assertions instead of the whole suite.
const canRaise = CZ.canRaisePressure || (() => null);
const demotesAt = CZ.pressureDemotesAt || (() => null);
const pressureFollows = NX.pressureFollows || (() => null);
const pressureLeads = ANS.pressureLeads || (() => null);
const followNote = ANS.followNote || (() => "");
const demotionReason = ANS.demotionReason || (() => "");
const leadOf = (site, opts = {}) => (leadingCause(causesFor(site, opts).all) || {}).name || null;
const keyOf = s => CAUSES[s.id] ? s.id : `${s.level}_${s.part}`;
// The places papilloedema keeps in play — the compartment filter's own test — one per kind (left and right merged).
const INPLAY = candidateSites().filter(s => INTRACRANIAL_LEVELS.has(s.level) || PRESSURE_REACHES.has(`${s.level}|${s.part}`));
const KINDS = []; { const seen = new Set(); for (const s of INPLAY) { const k = s.id.replace(/^(left|right)_/, ""); if (!seen.has(k)) { seen.add(k); KINDS.push(s); } } }
// The answer card for a picture, as app.js builds it: the count leaves out the papilloedema and any explicit normal.
const card = (toks, onset = "") => {
  const tokens = T(toks), r = solve(tokens);
  const sel = r.display.find(x => x.site.id === r.defaultSite) || r.display[0];
  const total = [...tokens].filter(t => !t.startsWith("papilloedema@") && !isNormalToken(t)).length;
  return sel ? ANS.answerFor({ r, sel, total, tokens, onset, course: "", dominant: "left", sensoryLevel: "",
    pinned: new Set(), scope: "site", selectedPathology: undefined, selectedEntity: undefined }) : null;
};

// ---- A. Which causes can raise the pressure (rows 2–7) ----
ok("row 2: CAN_RAISE_PRESSURE is one table: the category defaults and two name patterns",
   !!CZ.CAN_RAISE_PRESSURE && [...CZ.CAN_RAISE_PRESSURE.categories].sort().join() === "infective,neoplastic,traumatic"
   && CZ.CAN_RAISE_PRESSURE.can instanceof RegExp && CZ.CAN_RAISE_PRESSURE.cannot instanceof RegExp);
for (const [name, cat, want, why] of [
  ["Small-vessel lacunar infarct", "vascular", false, "row 3: a lacune cannot"],
  ["Intracerebral haemorrhage", "vascular", true, "row 4: bleeding can"],
  ["Superior sagittal sinus thrombosis", "vascular", true, "row 4: the venous outflow can"],
  ["Dural arteriovenous fistula", "vascular", true, "row 4: a dural fistula can"],
  ["Small pontine haemorrhage", "vascular", false, "row 4: a small pontine bleed cannot"],
  ["Malignant MCA infarction (space-occupying oedema)", "vascular", true, "row 5: a named space-occupying infarct can"],
  ["Large MCA territory (or ICA) infarct", "vascular", false, "row 5: a large territory infarct cannot until named as swelling"],
  ["Proximal MCA (M1) / carotid-T occlusion", "vascular", false, "row 5: a carotid-T occlusion cannot"],
  ["PICA / vertebral artery occlusion", "vascular", true, "row 5: a PICA infarct (the cerebellum swells) can"],
  ["Cerebellar infarct (SCA / PICA)", "vascular", true, "row 5: a cerebellar infarct can"],
  ["AICA territory infarct", "vascular", false, "row 5: AICA cannot"],
  ["Hypoxic-ischaemic brain injury", "metabolic", false, "row 6: hypoxic-ischaemic injury cannot"],
  ["Cardiac arrest / profound global hypoperfusion", "vascular", false, "row 6: global hypoperfusion cannot"],
  ["Metabolic or toxic encephalopathy", "metabolic", false, "row 3: a metabolic encephalopathy cannot"],
  ["Posterior reversible encephalopathy syndrome (PRES)", "metabolic", true, "row 4: PRES can"],
  ["Wernicke's encephalopathy", "metabolic", false, "row 4: Wernicke's cannot"],
  ["Demyelination", "inflammatory", false, "row 3: a demyelinating plaque cannot"],
  ["Neurosarcoidosis", "inflammatory", true, "row 4: neurosarcoidosis can"],
  ["Glioma / metastasis", "neoplastic", true, "row 3: a tumour can"],
  ["Small metastasis / glioma", "neoplastic", true, "row 4: a 'small' tumour can"],
  ["Skull base tumour or nasopharyngeal carcinoma", "neoplastic", false, "row 4: a corridor tumour cannot"],
  ["Paraneoplastic cerebellar degeneration", "neoplastic", false, "row 4: a paraneoplastic syndrome cannot"],
  ["Herpes simplex encephalitis", "infective", true, "row 3: an encephalitis can"],
  ["Sepsis or systemic infection", "infective", false, "row 4: sepsis cannot"],
  ["Traumatic brain injury", "traumatic", true, "row 3: a brain injury can"],
  ["Head trauma", "traumatic", false, "row 4: head trauma at a nerve cannot"],
  ["Obstructive hydrocephalus / shunt failure", "congenital", true, "row 4: obstructive hydrocephalus can"],
  ["Normal pressure hydrocephalus", "congenital", false, "row 4: normal pressure cannot"],
  ["Hypoglycaemia", "mimic", false, "row 3: a mimic cannot"],
  ["Parkinson's disease", "degenerative", false, "row 3: a degeneration cannot"],
]) ok(`${why}: ${name}`, canRaise({ name, cat }) === want);
ok("row 7: the pressure demotes inside the skull and on the nerve courses it reaches, never at the retina or the cord",
   demotesAt(SITE.left_subcortex_corona_radiata) === true && demotesAt(SITE.left_skull_base_vi_cisternal) === true
   && demotesAt(SITE.left_visual_pathway_retina) === false && demotesAt(SITE.bilateral_cord_transverse) === false);
{ // THE SNAPSHOT (row 21): every cause at a place papilloedema keeps in play, and the names that can raise the pressure. A new,
  // renamed or reclassified cause there fails here until someone looks at it — the review is Appendix A of the spec.
  const keys = new Set(INPLAY.map(keyOf)), names = new Set(), canNames = new Set(); let rows = 0, can = 0;
  for (const k of keys) for (const c of CAUSES[k] || []) { rows++; names.add(c.name); if (canRaise(c)) { can++; canNames.add(c.name); } }
  ok("row 21: the in-play cause lists hold 641 rows (435 names); 264 rows can raise the pressure",
     keys.size === 98 && rows === 641 && names.size === 435 && can === 264, `${keys.size} lists, ${rows} rows, ${names.size} names, ${can} can`);
  const CAN = ["ACA vasospasm after subarachnoid haemorrhage","Acute disseminated encephalomyelitis (ADEM)","Aneurysm or deep haemorrhage","Anterior communicating artery aneurysm (rupture ± vasospasm)","Anterior communicating artery aneurysm rupture","Arteriovenous malformation","Basal meningitis (tuberculous, carcinomatous or fungal)","Bilateral thalamic glioma","Bilateral traumatic or hypoxic injury","Bilateral tumour or metastases","Brainstem abscess","Brainstem abscess or tuberculoma","Brainstem encephalitis (Listeria, enterovirus)","Brainstem encephalitis / meningoencephalitis","Brainstem encephalitis or tuberculoma","Brainstem glioma","Brainstem haemorrhage","Brainstem haemorrhage or cavernoma","Brainstem or cerebellar haemorrhage / cavernoma","Brainstem tumour or trauma","Butterfly glioma or lymphoma","Cavernous sinus thrombosis","Cerebellar / brainstem stroke (PICA / AICA)","Cerebellar abscess","Cerebellar abscess or tuberculoma","Cerebellar haemorrhage","Cerebellar infarct (PICA)","Cerebellar infarct (SCA / PICA)","Cerebellar infarct (vermian)","Cerebellar malformation (Dandy-Walker, vermian hypoplasia)","Cerebellar or brainstem infarct","Cerebellopontine angle tumour","Cerebellopontine angle tumour (vestibular schwannoma, meningioma)","Cerebral abscess","Cerebral abscess or empyema","Chiari I malformation","Cortical vein thrombosis","Craniocervical junction compression (foramen-magnum meningioma, basilar invagination)","Craniopharyngioma","Craniopharyngioma (and its surgical treatment)","Craniopharyngioma or germinoma","Deep cerebral venous thrombosis","Deep haemorrhage","Deep haemorrhage or aneurysm","Deep hypertensive haemorrhage","Deep tumour or metastasis","Diffuse axonal injury","Dorsal midbrain (pretectal) lesion","Dural arteriovenous fistula","Duret haemorrhage / brainstem injury from herniation","Falx / parasagittal meningioma","Falx metastasis or lymphoma","Foramen-magnum meningioma","Fourth ventricular ependymoma","Frontal glioma or metastasis","Frontal tumour (glioma, meningioma, metastasis)","Frontal tumour / metastasis","Glioma / metastasis","Glioma / metastasis presenting with a large hemispheric deficit","Glioma of the medial frontal lobe","Haemorrhage","Haemorrhage / cavernous malformation","Haemorrhage into the subthalamic region","Herpes simplex encephalitis","Herpes simplex or limbic encephalitis","Hypertensive deep haemorrhage","Hypertensive haemorrhage","Hypertensive pontine haemorrhage","Hypothalamic glioma","Hypothalamic glioma or germinoma","Hypothalamic stroke or haemorrhage","Hypothalamic tumour or infiltration","Interhemispheric (falx) subdural haematoma or parasagittal contusion","Internal carotid aneurysm","Intracerebral haemorrhage","Japanese encephalitis / flavivirus encephalitis","Langerhans cell histiocytosis","Langerhans cell histiocytosis or neurosarcoidosis","Large intracerebral haemorrhage","Large tumour or metastasis with oedema","Lateral medullary tumour / metastasis","Listeria rhombencephalitis","Low-grade glioma","Malignant MCA infarction (space-occupying oedema)","Mass effect with transtentorial herniation","Medullary haemorrhage","Medullary tumour / metastasis","Medulloblastoma","Meningioma (tuberculum sellae)","Meningitis or meningeal disease","Metastasis / haemangioblastoma","Midbrain haemorrhage","Midbrain tumour / metastasis","Neuro-Behçet's disease","Neurosarcoidosis","Neurosarcoidosis or infiltrative disease","Obstructive hydrocephalus / shunt failure","Obstructive hydrocephalus compressing the pretectum","Occipital haemorrhage","Olfactory groove meningioma","PICA / vertebral artery occlusion","PRES (posterior reversible encephalopathy)","Paraneoplastic or posterior-fossa tumour","Parasagittal / falx meningioma","Parasagittal meningioma","Parasagittal metastasis","Partially or late-presenting compressive lesion","Petrous apicitis (Gradenigo's syndrome)","Pineal region tumour (germinoma)","Pineal region tumour with hydrocephalus","Pituitary apoplexy","Pituitary macroadenoma","Pituitary macroadenoma with stalk compression","Pituitary macroadenoma with suprasellar extension","Pontine contusion with diffuse axonal injury","Pontine glioma","Pontine glioma (esp. children)","Pontine glioma / metastasis","Pontine haemorrhage","Pontine haemorrhage or cavernoma","Pontine trauma or tumour","Post-infectious acute cerebellitis","Posterior communicating artery aneurysm","Posterior fossa tumour","Posterior reversible encephalopathy syndrome (PRES)","Raised intracranial pressure","Raised intracranial pressure (false localising sign)","Ruptured anterior communicating artery aneurysm","Small metastasis / glioma","Small metastasis or demyelinating plaque","Small metastasis or glioma","Small tumour or metastasis","Striatal infarct or haemorrhage","Subfrontal / olfactory groove meningioma","Superior sagittal sinus thrombosis","Suprasellar tumour (craniopharyngioma, germinoma, glioma)","Tectal contusion after head injury","Temporal pole contusion","Thalamic abscess or cerebral toxoplasmosis","Thalamic haemorrhage","Thalamic infarct or haemorrhage","Thalamic tumour or metastasis","Third ventricular tumour or colloid cyst","Toxoplasmosis or HIV-related lesion","Transverse or sigmoid sinus thrombosis (vein of Labbe)","Traumatic brain injury","Traumatic brain injury (orbitofrontal contusion)","Tumour (glioma / metastasis)","Tumour (glioma, metastasis, craniopharyngioma)","Tumour (pineal or tectal)","Tumour / metastasis","Tumour of the SMA / medial frontal region","Tumour or demyelination","Tumour or meningeal disease at the skull base","Tumour or surgical injury","Uncal herniation","Uncal herniation compressing the third nerve","Vertex extradural haematoma","Vertex extradural haematoma / parasagittal contusion"];
  const got = [...canNames].sort(), want = [...CAN].sort();
  ok("row 21: the in-play names that can raise the pressure are exactly Appendix A's (159)",
     same(got, want), `added: ${got.filter(n => !want.includes(n)).join("; ")} | missing: ${want.filter(n => !got.includes(n)).join("; ")}`);
}

// ---- B. Papilloedema demotes, never drops (row 1) ----
{ const moved = [];
  for (const s of candidateSites()) for (const onset of ONSETS) {
    const r = causesFor(s, { onset });
    if ("pressure" in r || r.demoted.some(x => x.demotion.axis !== "tempo" || "pressure" in x.demotion)
        || !same(r, causesFor(s, { onset, pressure: false }))) moved.push(`${s.id}@${onset || "none"}`); }
  ok("row 1 guard: without papilloedema causesFor is unchanged at every place and onset", moved.length === 0, moved.slice(0, 5).join(", ")); }
{ const cr = SITE.left_subcortex_corona_radiata, r = causesFor(cr, { pressure: true });
  ok("row 1: papilloedema at the corona radiata keeps the causes that can raise the pressure, in the place's own order",
     r.all.map(c => c.name).join(" | ") === "Hypertensive deep haemorrhage | Diffuse axonal injury | Small metastasis / glioma", r.all.map(c => c.name).join(" | "));
  const lac = r.demoted.find(c => c.name === "Small-vessel lacunar infarct");
  ok("row 1: …the lacune is demoted for the pressure, never dropped", !!lac && lac.demotion.axis === "pressure" && lac.demotion.entered === "papilloedema");
  ok("row 1: …and the result says the pressure acted", r.pressure === true);
  const both = causesFor(cr, { onset: "chronic", pressure: true }).demoted.find(c => c.name === "Small-vessel lacunar infarct");
  ok("row 1: a cause both axes demote keeps its tempo reason and carries the pressure", !!both && both.demotion.axis === "tempo" && both.demotion.pressure === true); }
ok("row 7: the retina keeps its own causes with papilloedema (giant cell arteritis leads)",
   same(causesFor(SITE.left_visual_pathway_retina, { pressure: true }), causesFor(SITE.left_visual_pathway_retina))
   && leadOf(SITE.left_visual_pathway_retina, { pressure: true }) === "Giant cell arteritis");
ok("row 1: a place outside the skull (the cord) keeps its own causes — the cover can reach it, the pressure does not",
   same(causesFor(SITE.bilateral_cord_transverse, { pressure: true }), causesFor(SITE.bilateral_cord_transverse)));
{ const cc = combinedCauses([SITE.left_subcortex_corona_radiata, SITE.right_cortex_occipital], { pressure: true });
  const lac = cc.perSite[0].causes.find(c => c.name === "Small-vessel lacunar infarct");
  ok("row 1: combinedCauses passes the pressure on to each place", !!lac && lac.demotion && lac.demotion.axis === "pressure"); }
{ // The ratchet: per in-play place kind, how often papilloedema changes the leading cause, and where nothing is left.
  const count = onset => { let changed = 0, empty = 0;
    for (const s of KINDS) { const left = causesFor(s, { onset, pressure: true }).all;
      if (demotesAt(s) && !left.length) empty++; else if (left.length && leadOf(s, { onset }) !== (leadingCause(left) || {}).name) changed++; }
    return `${changed}/${empty}`; };
  const got = ONSETS.map(count).join(" "), want = "79/7 52/43 66/19 37/15 22/17";
  ok("row 1 ratchet: lead changed / nothing left, by onset (none, hyperacute, acute, subacute, chronic), over 111 place kinds",
     KINDS.length === 111 && got === want, `${KINDS.length} kinds: ${got}`); }

// ---- report ----
console.log(`\nNeuroLocaliser — pressure follows the cause (round 1)\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run it to see it fail**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/pressure-follows.test.js`
Expected: `3 passed, 40 failed`, exit 1. The ones that pass are the guards that hold today: nothing moves without papilloedema, and
the retina and the cord are already unaffected.

- [ ] **Step 3: Import the compartment table (`src/data/causes.js`)**

After the line `import { MULTIFOCAL } from "./multifocal.js";` add:

```js
import { LEVEL_COMPARTMENT, INTRACRANIAL_COMPARTMENTS, PRESSURE_REACHES } from "../model/compartments.js";
```

(`compartments.js` imports nothing, so there is no cycle.)

- [ ] **Step 4: Add the table and its two functions (`src/data/causes.js`)**

Immediately above the line `// ---- public API ----` (the one followed by `// Three sources, in priority:`) insert:

```js
// ---- what papilloedema says about the CAUSE (pressure follows the cause, owner-ruled 2026-11-10; spec
// docs/superpowers/specs/2026-11-09-pressure-follows-cause-design.md) ----
// Papilloedema narrows the PLACES to those inside the skull (raisedPressureAxis in inverse.js). It also says something about
// the CAUSE: the process itself has raised the intracranial pressure enough to swell the discs — a mass (tumour, abscess,
// haematoma) or bleeding; obstruction of the venous outflow or of the CSF (venous sinus thrombosis, hydrocephalus); meningitis
// or encephalitis; or a swelling brain (trauma, a space-occupying infarct, a cerebellar infarct). A lacune, an arterial infarct
// that is not space-occupying, a demyelinating plaque, a degeneration, a toxic or metabolic encephalopathy, a microvascular
// palsy and the mimics cannot (rows 3–6). So with papilloedema entered such a cause is DEMOTED, exactly as a cause whose tempo
// misses the onset is: it stays listed (row 1).
//
// ONE TABLE (row 2): a default by sieve category, then the named exceptions, CANNOT checked first — so a small bleed or a
// corridor tumour departs from its own pattern. test/pressure-follows.test.js pins the class of every cause at a place
// papilloedema keeps in play, so a new or renamed cause there fails the suite until someone looks at it. The spec's
// Appendix A lists every name under this table.
export const CAN_RAISE_PRESSURE = {
  // A mass, an infection or an injury can raise the pressure; every other category cannot, unless named below.
  categories: new Set(["neoplastic", "infective", "traumatic"]),
  // CAN, in a category that cannot: bleeding, the venous outflow, a ruptured aneurysm, a space-occupying infarct and the
  // posterior-fossa infarcts that take the cerebellum (the swollen cerebellum blocks the fourth ventricle; AICA's territory
  // rarely swells, so it is not named — row 5), CSF obstruction, and the inflammatory and hypertensive diseases that swell the
  // brain or block the CSF.
  can: /haemorrhag|haematoma|sinus thrombos|venous thrombos|vein thrombos|aneurysm|subarachnoid|apoplexy|arteriovenous|space-occupying|malignant mca|cerebellar infarct|cerebellar \/ brainstem stroke|cerebellar or brainstem infarct|\bpica\b|hydroceph|dandy-walker|chiari|craniopharyngioma|\badem\b|acute disseminated|sarcoid|beh[cç]et|\bpres\b|posterior reversible/i,
  // CANNOT (checked first): normal pressure; a small bleed; a remote, extracranial or non-mass "neoplastic" cause; a corridor
  // tumour on a nerve (the raised-pressure round's own reason for filtering the corridors); a systemic or ganglionic
  // infection; and an injury to a nerve, a vessel, the orbit, the craniocervical junction or the suprachiasmatic nucleus
  // rather than to the brain.
  cannot: /normal.pressure hydroceph|small pontine haemorrhage|paraneoplastic (cerebellar|autonomic)|perineural|orbital|nasopharyng|sinonasal|esthesio|metastasis to the pituitary stalk|skull base tumour|petrous apex tumour|schwannoma \/ meningioma \/ metastasis|sepsis|post-viral|zoster|ganglionitis|tabes|general paresis|whipple|splenial lesion|craniocervical junction trauma|vertebral artery injury|cribriform|petrous fracture|total blindness|^head trauma$|^trauma \/ surgery$|pituitary or hypothalamic surgery/i,
};
export function canRaisePressure(cause) {
  if (CAN_RAISE_PRESSURE.cannot.test(cause.name)) return false;
  if (CAN_RAISE_PRESSURE.can.test(cause.name)) return true;
  return CAN_RAISE_PRESSURE.categories.has(cause.cat);
}
// Where papilloedema demotes (rows 1, 7): only at the places it keeps in play — the compartment filter's own test, so a place
// reached only through the cover keeps its order — and never at the retina, where a swollen disc beside a retinal stroke is
// the eye's own disease until shown otherwise, and giant cell arteritis must keep the lead.
export function pressureDemotesAt(site) {
  if (site.level === "visual_pathway" && site.part === "retina") return false;
  return INTRACRANIAL_COMPARTMENTS.has(LEVEL_COMPARTMENT[site.level]) || PRESSURE_REACHES.has(`${site.level}|${site.part}`);
}
```

- [ ] **Step 5: The second demotion axis in `causesFor` (`src/data/causes.js`)**

Replace the signature line `export function causesFor(site, { onset } = {}) {` with:

```js
export function causesFor(site, { onset, pressure } = {}) {
```

Replace the four lines

```js
  const concordant = (onset ? list.filter(x => x.tempo.includes(onset)) : list.slice()).sort(byLikelihood);
  const demoted = (onset ? list.filter(x => !x.tempo.includes(onset)) : [])
    .map(x => ({ ...x, demotion: { axis: "tempo", entered: onset, expected: x.tempo } }))
    .sort(byLikelihood);
```

with:

```js
  // PAPILLOEDEMA DEMOTES TOO (pressure follows the cause, row 1): with papilloedema entered, at a place it keeps in play, a
  // cause that cannot raise the pressure moves to `demoted` beside the tempo mismatches — never dropped. A cause both axes
  // demote keeps its tempo reason and carries `pressure: true` as well. Without papilloedema nothing here changes.
  const pressing = !!pressure && pressureDemotesAt(site);
  const fitsTempo = x => !onset || x.tempo.includes(onset);
  const fitsPressure = x => !pressing || canRaisePressure(x);
  const concordant = list.filter(x => fitsTempo(x) && fitsPressure(x)).sort(byLikelihood);
  const demoted = list.filter(x => !(fitsTempo(x) && fitsPressure(x)))
    .map(x => ({ ...x, demotion: fitsTempo(x)
      ? { axis: "pressure", entered: "papilloedema", expected: [] }
      : { axis: "tempo", entered: onset, expected: x.tempo, ...(fitsPressure(x) ? {} : { pressure: true }) } }))
    .sort(byLikelihood);
```

Replace the return line `  return { byCategory, demoted, all: concordant, onset: onset || null, derived, source };` with:

```js
  return { byCategory, demoted, all: concordant, onset: onset || null, ...(pressing ? { pressure: true } : {}), derived, source };
```

- [ ] **Step 6: `combinedCauses` passes the pressure on (`src/data/causes.js`)**

Replace

```js
export function combinedCauses(sites, { onset } = {}) {
  const perSite = sites.map(site => {
    const r = causesFor(site, { onset });
```

with:

```js
export function combinedCauses(sites, { onset, pressure } = {}) {
  const perSite = sites.map(site => {
    const r = causesFor(site, { onset, pressure });
```

- [ ] **Step 7: Add the suite to `package.json`**

In the `test` script, replace the tail `&& node test/raised-pressure.test.js"` with
`&& node test/raised-pressure.test.js && node test/pressure-follows.test.js"`.

- [ ] **Step 8: Run the suite, then everything**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/pressure-follows.test.js`
Expected: `43 passed, 0 failed`, exit 0.
Then `npm test`: green, 88 suites / 7456. Then `npm run test:audit`: **1050 passed, 9 failed**, unchanged (the
audit reads places, not causes).

- [ ] **Step 9: Commit**

```bash
git add test/pressure-follows.test.js package.json src/data/causes.js
git commit -m "feat(causes): papilloedema demotes the causes that cannot raise the pressure (rows 1-7)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: The plan follows the cause the What line names; the floor; the escalation untouched (rows 9, 11–13)

**Files:**
- Modify: `src/data/nextSteps.js` (`pressureFollows` and `pressureFloor` before `nextStepsFor`; `nextStepsFor`,
  `pathologyNextStepsFor`, `combinedNextSteps`), `test/pressure-follows.test.js` (section C)

**Interfaces:**
- Consumes: `causesFor(site, { onset, pressure })`, `leadingCause`, `onsetFollows`, `pathologyPlanFor` (all existing).
- Produces: `pressureFollows(site, { onset, pressure }) → { cause, setAside, onset, pressure: true, by: { onset, pressure } } | null`,
  exported. `nextStepsFor`, `pathologyNextStepsFor` and `combinedNextSteps` read `opts.pressure`: the plan follows with it,
  and the badge is never routine. `followed.by` says which axis set the usual cause aside (Task 3's `followNote` reads it).

- [ ] **Step 1: Add section C to the suite**

In `test/pressure-follows.test.js`, immediately above `// ---- report ----`, insert:

```js
// ---- C. The plan follows the cause the What line names (rows 9, 11–13) ----
{ const cr = SITE.left_subcortex_corona_radiata, nx = nextStepsFor(cr, { pressure: true }), sp = sitePlan(cr);
  const plan = pathologyPlanFor("Hypertensive deep haemorrhage", cr);
  ok("row 9: papilloedema at the corona radiata follows the haemorrhage, set aside the lacune",
     same(nx.followed, { cause: "Hypertensive deep haemorrhage", setAside: "Small-vessel lacunar infarct", onset: null, pressure: true, by: { onset: false, pressure: true } }),
     JSON.stringify(nx.followed));
  ok("row 9: the tier split holds — immediate and first-line stay the site's",
     same(nx.immediate, sp.immediate) && same(nx.investigations, sp.investigations));
  ok("row 9: confirmatory, monitoring and referral become the followed cause's",
     same(nx.confirmatory, plan.confirmatory) && same(nx.monitoring, plan.monitoring) && nx.referral === plan.referral);
  ok("row 9: the urgency is resolved as a selection of it would be",
     nx.urgency === resolveUrgency(cr, "Hypertensive deep haemorrhage", { pressure: true }) && nx.urgency === "emergency");
  ok("row 9: pressureFollows returns nothing without papilloedema, and exactly what nextStepsFor follows with it",
     pressureFollows(cr, {}) === null && same(pressureFollows(cr, { pressure: true }), nx.followed)); }
{ const nx = nextStepsFor(SITE.left_subcortex_corona_radiata, { onset: "chronic", pressure: true });
  ok("row 9: at chronic onset with papilloedema the corona radiata follows the glioma, both axes named",
     nx.followed && nx.followed.cause === "Small metastasis / glioma" && same(nx.followed.by, { onset: true, pressure: true }) && nx.urgency === "urgent"); }
ok("row 9: where the pressure keeps the usual cause and the onset rule does not fire, nothing is followed (the pretectum, acute)",
   !("followed" in nextStepsFor(SITE.pupil_pretectum, { onset: "acute", pressure: true })));
{ const nx = nextStepsFor(SITE.left_medulla_lateral, { onset: "chronic", pressure: true });
  ok("row 9: where the approved onset rule fires and the pressure keeps the cause, the plan still follows the What line (the lateral medulla, chronic)",
     !!nx.followed && same(nx.followed.by, { onset: true, pressure: false }) && nx.followed.cause === leadOf(SITE.left_medulla_lateral, { onset: "chronic", pressure: true })
     && !!onsetFollows(SITE.left_medulla_lateral, "chronic")); }
{ const bad = [], mismatch = [];
  for (const s of KINDS) for (const onset of ONSETS) {
    const f = nextStepsFor(s, { onset, pressure: true }).followed;
    if (!f) continue;
    if (!(f.by && f.by.pressure) && !onsetFollows(s, onset)) bad.push(`${s.id}@${onset || "none"}`);
    if (f.cause !== leadOf(s, { onset, pressure: true })) mismatch.push(`${s.id}@${onset || "none"}`); }
  ok("row 9: the plan follows only where the pressure sets the cause aside or the approved onset rule fires", bad.length === 0, bad.slice(0, 5).join(", "));
  ok("row 9: the followed cause is always the What line's leading cause", mismatch.length === 0, mismatch.slice(0, 5).join(", ")); }
{ const moved = [];
  for (const s of candidateSites()) for (const onset of ONSETS) {
    const nx = nextStepsFor(s, { onset });
    if ((nx.followed && "pressure" in nx.followed) || !same(nx, nextStepsFor(s, { onset, pressure: false }))) moved.push(`${s.id}@${onset || "none"}`); }
  ok("row 9 guard: without papilloedema the plan is unchanged at every place and onset", moved.length === 0, moved.slice(0, 5).join(", ")); }
{ const og = SITE.left_olfactory_olfactory_groove, routine = [];
  for (const s of KINDS) for (const onset of ONSETS) if (nextStepsFor(s, { onset, pressure: true }).urgency === "routine") routine.push(`${s.id}@${onset || "none"}`);
  ok("row 11: with papilloedema no in-play place's plan badges routine", routine.length === 0, routine.slice(0, 5).join(", "));
  ok("row 11: the olfactory groove (routine today) badges urgent with papilloedema",
     sitePlan(og).urgency === "routine" && nextStepsFor(og, { pressure: true }).urgency === "urgent");
  ok("row 11: …and so does a selection of its meningioma",
     pathologyNextStepsFor(og, "Olfactory groove meningioma", {}).urgency === "routine"
     && pathologyNextStepsFor(og, "Olfactory groove meningioma", { pressure: true }).urgency === "urgent"); }
ok("row 12: with no onset the badge follows the cause — the leg area's stroke plan (emergency) becomes the meningioma's (urgent)",
   sitePlan(SITE.right_cortex_motor_leg).urgency === "emergency" && nextStepsFor(SITE.right_cortex_motor_leg, { pressure: true }).urgency === "urgent"
   && (nextStepsFor(SITE.right_cortex_motor_leg, { pressure: true }).followed || {}).cause === "Parasagittal meningioma");
{ const moved = [];
  for (const s of KINDS) if (!same(sitePlan(s, { onset: "hyperacute", pressure: true }), sitePlan(s, { onset: "hyperacute" }))) moved.push(s.id);
  ok("row 13: the hyperacute escalation is untouched by papilloedema", moved.length === 0, moved.slice(0, 5).join(", "));
  ok("row 13: …so the corona radiata at hyperacute onset with papilloedema stays an emergency",
     nextStepsFor(SITE.left_subcortex_corona_radiata, { onset: "hyperacute", pressure: true }).urgency === "emergency"); }
```

- [ ] **Step 2: Run it to see it fail**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/pressure-follows.test.js`
Expected: `50 passed, 10 failed`, exit 1. The ten are the follows (five), the What-line agreement, the floor (three) and the leg
area's badge. The seven that pass hold today too: the tier split and the emergency badge at the corona radiata (its own plan
has both), no follow at the pretectum, a follow only where the onset rule fires, the guard without papilloedema, and the
untouched escalation (twice).

- [ ] **Step 3: Add the rule and the floor (`src/data/nextSteps.js`)**

Replace the whole `nextStepsFor` block, from its comment line `// The plan the Next card shows with nothing selected. THE TIER
SPLIT holds: immediate and first-line stay the` through its closing `}`:

```js
// The plan the Next card shows with nothing selected. THE TIER SPLIT holds: immediate and first-line stay the
// site's — done before the cause is known, and what identifies it. Confirmatory, monitoring, referral and urgency
// become the followed cause's, resolved exactly as a selection of it would be. Where the rule does not fire this
// is sitePlan() with no added key, so with no onset, or at acute onset, nothing changes.
export function nextStepsFor(site, opts = {}) {
  const base = sitePlan(site, opts);
  const followed = onsetFollows(site, opts.onset);
  if (!followed) return base;
  const plan = pathologyPlanFor(followed.cause, site);
  return {
    ...base,
    confirmatory: plan.confirmatory,
    monitoring: plan.monitoring,
    urgency: resolveUrgency(site, followed.cause, opts),
    referral: plan.referral || base.referral,
    followed,
  };
}
```

with:

```js
// ---- the pressure follows the cause (owner-ruled 2026-11-10; spec 2026-11-09-pressure-follows-cause-design.md) ----
// onsetFollows()'s mirror for papilloedema (row 9). With papilloedema entered, causesFor demotes the causes that cannot raise
// the intracranial pressure, so the What line names one that can. The site's usual plan is written for its leading cause (the
// first non-mimic, as onsetFollows reads it), and the plan follows the cause the What line names (both axes read) when:
//   - the pressure sets that usual cause aside; or
//   - the approved onset rule fires — papilloedema never widens the onset rule to the places its own design left alone.
// Otherwise the site's own plan stands. Like onsetFollows it only chooses between signed-off plans, and it requires the
// followed cause to have an authored plan. Where NO cause at the place can raise the pressure nothing is followed here: the
// card follows the pressure itself (app/answer.js resolveNext, row 10).
export function pressureFollows(site, { onset, pressure } = {}) {
  if (!pressure) return null;
  try {
    const lead = causesFor(site).all.find(c => c.cat !== "mimic");
    const kept = !!lead && causesFor(site, { pressure: true }).all.some(c => c.name === lead.name);
    if (kept && !onsetFollows(site, onset)) return null;
    const at = causesFor(site, { onset, pressure: true }).all;
    if (lead && at.some(c => c.name === lead.name)) return null;
    const cause = leadingCause(at);
    if (!cause || !pathologyPlanFor(cause.name, site)) return null;
    return { cause: cause.name, setAside: lead ? lead.name : null, onset: onset || null, pressure: true,
      by: { onset: !!(lead && onset && !lead.tempo.includes(onset)), pressure: !kept } };
  } catch { return null; }
}

// THE PAPILLOEDEMA FLOOR (row 11): with papilloedema entered the plan the card shows never badges routine. It mirrors the
// pressure-only card's own badge ("papilloedema with a normal conscious level is a same-day problem") and the red floor
// ("a must-not-miss never renders as routine"). Applied to the plan shown, never to the site's own plan.
const pressureFloor = (plan, opts = {}) => (opts.pressure && plan.urgency === "routine") ? { ...plan, urgency: "urgent" } : plan;

// The plan the Next card shows with nothing selected. THE TIER SPLIT holds: immediate and first-line stay the
// site's — done before the cause is known, and what identifies it. Confirmatory, monitoring, referral and urgency
// become the followed cause's, resolved exactly as a selection of it would be. Where the rule does not fire this
// is sitePlan() with no added key, so with no onset, or at acute onset, nothing changes. With papilloedema the
// pressure rule decides instead (it contains the onset rule) and the floor applies.
export function nextStepsFor(site, opts = {}) {
  const base = sitePlan(site, opts);
  const followed = opts.pressure ? pressureFollows(site, opts) : onsetFollows(site, opts.onset);
  if (!followed) return pressureFloor(base, opts);
  const plan = pathologyPlanFor(followed.cause, site);
  return pressureFloor({
    ...base,
    confirmatory: plan.confirmatory,
    monitoring: plan.monitoring,
    urgency: resolveUrgency(site, followed.cause, opts),
    referral: plan.referral || base.referral,
    followed,
  }, opts);
}
```

- [ ] **Step 4: The floor on a selection (`src/data/nextSteps.js`)**

In `pathologyNextStepsFor`, replace

```js
  const base = sitePlan(site, opts);
  const plan = pathologyPlanFor(causeName, site);
  return {
    ...base,
    confirmatory: plan ? plan.confirmatory : base.confirmatory,
    monitoring:   plan ? plan.monitoring   : base.monitoring,
    urgency:      resolveUrgency(site, causeName, opts),
    referral:     (plan && plan.referral) || base.referral,
    pathology: causeName,
    pathologyCurated: !!plan,
  };
}
```

with:

```js
  const base = sitePlan(site, opts);
  const plan = pathologyPlanFor(causeName, site);
  return pressureFloor({
    ...base,
    confirmatory: plan ? plan.confirmatory : base.confirmatory,
    monitoring:   plan ? plan.monitoring   : base.monitoring,
    urgency:      resolveUrgency(site, causeName, opts),
    referral:     (plan && plan.referral) || base.referral,
    pathology: causeName,
    pathologyCurated: !!plan,
  }, opts);
}
```

- [ ] **Step 5: The floor on a selected cross-site disease (`src/data/nextSteps.js`)**

At the end of `combinedNextSteps`, replace the entity plan's `  return {` (the one followed by `    ...base,` and
`    entityFirstLine: plan.firstLine,`) with `  return pressureFloor({`, and its closing

```js
    entityBecause: plan.because || "",
    entity: entityName,
  };
}
```

with:

```js
    entityBecause: plan.because || "",
    entity: entityName,
  }, opts);
}
```

(The site union above it needs nothing: each site's plan comes from `nextStepsFor`, which already floors it.)

- [ ] **Step 6: Run the suite and the touched suites, then everything**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/pressure-follows.test.js && node test/onset-follows.test.js && node test/next-steps.test.js && node test/pathology-next-steps.test.js`
Expected: `60 passed, 0 failed`, and every other suite PASS, exit 0.
Then `npm test`: green, 7473.

- [ ] **Step 7: Commit**

```bash
git add src/data/nextSteps.js test/pressure-follows.test.js
git commit -m "feat(next-steps): with papilloedema the plan follows the cause the What line names; never routine (rows 9, 11-13)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: The answer card follows; the wording (rows 9, 10, 14, 16–18)

**Files:**
- Modify: `app/answer.js` (the import, `resolveNext` + `pressureLeads`, the wording block, `answerFor`),
  `test/pressure-follows.test.js` (sections D and E)

**Interfaces:**
- Consumes: `pressureDemotesAt`, `causesFor(site, { onset, pressure })` (Task 1); `nextStepsFor` / `pathologyNextStepsFor` /
  `combinedNextSteps` with `opts.pressure` (Task 2).
- Produces, from `app/answer.js`:
  - `resolveNext(...)` passes `pressure` and, where the pressure leads, returns `nx` with the pressure-only Next line as its
    `referral`, a badge of at least urgent, and `pressureLeads: true`;
  - `pressureLeads(site, onset) → boolean`;
  - `PRESSURE_BAND` (`{ title, note, tag }`), `PRESSURE_LEADS_NOTE`, `followNote(followed) → string` and
    `demotionReason(demotion) → string`, all plain text, which Task 4's `app.js` escapes.

- [ ] **Step 1: Add sections D and E to the suite**

In `test/pressure-follows.test.js`, immediately above `// ---- report ----`, insert:

```js
// ---- D. The answer card (rows 9, 10, 14) ----
ok("row 10: nothing at the diffuse cerebrum can raise the pressure; the corona radiata has its haemorrhage; the retina never qualifies",
   pressureLeads(SITE.cerebrum_diffuse) === true && pressureLeads(SITE.left_subcortex_corona_radiata) === false
   && pressureLeads(SITE.left_visual_pathway_retina, "chronic") === false);
{ const a = card(`${P} weak_arm@right weak_leg@right`);
  ok("row 9: papilloedema + right hemiparesis names the haemorrhage, and the Next line is its plan",
     a?.lines.what === "Most likely Hypertensive deep haemorrhage (must not miss). Must not miss: Diffuse axonal injury."
     && a?.lines.next === "Acute stroke pathway with neurosurgery; critical care if conscious level is falling" && a?.nx.urgency === "emergency",
     `${a?.lines.what} | ${a?.lines.next} [${a?.nx.urgency}]`); }
{ const a = card(`${P} weak_arm@right weak_leg@right`, "chronic");
  ok("rows 9, 14: …at chronic onset, the glioma, with no old-stroke clause",
     a?.lines.what === "Most likely Small metastasis / glioma." && a?.nx.urgency === "urgent", `${a?.lines.what} [${a?.nx.urgency}]`);
  ok("row 14 guard: without papilloedema the chronic card keeps its old-stroke clause",
     /Could represent an old stroke\./.test(card("weak_arm@right weak_leg@right", "chronic")?.lines.what || "")); }
{ const a = card(`reduced_consciousness@none ${P}`);
  ok("row 10: coma + papilloedema follows the pressure itself — the pressure-only lines, emergency, and the banner as the red line",
     a?.lines.what === ANS.PRESSURE_ONLY.what && a?.lines.next === ANS.PRESSURE_ONLY.next && a?.nx.urgency === "emergency"
     && a?.lines.red === null && a?.nx.pressureLeads === true, `${a?.lines.what} [${a?.nx.urgency}] red=${a?.lines.red}`); }
{ const a = card(`${P} fixed_dilated_pupil@left`);
  ok("row 10: an awake dilated pupil with papilloedema follows the pressure, urgent (it was Adie's pupil, routine)",
     a?.lines.what === ANS.PRESSURE_ONLY.what && a?.nx.urgency === "urgent" && a?.lines.red === null, `${a?.lines.what} [${a?.nx.urgency}]`); }
for (const [toks, what, why] of [
  [`${P} homonymous_hemianopia@right`, "Most likely Occipital haemorrhage (must not miss). Must not miss: PRES (posterior reversible encephalopathy).", "papilloedema + hemianopia: not a PCA infarct"],
  [`${P} truncal_ataxia@none`, "Most likely Medulloblastoma (must not miss). Must not miss: Cerebellar infarct (vermian).", "papilloedema + truncal ataxia: medulloblastoma"],
  [`${P} weak_leg@left`, "Most likely Parasagittal meningioma. Must not miss: Superior sagittal sinus thrombosis.", "papilloedema + leg weakness: the parasagittal meningioma"],
  [`${P} neglect@left weak_arm@left weak_leg@left`, "Most likely Large intracerebral haemorrhage (must not miss). Must not miss: Malignant MCA infarction (space-occupying oedema).", "papilloedema + a right hemisphere syndrome: not a carotid-T occlusion"],
]) { const a = card(toks); ok(`§6: ${why}`, a?.lines.what === what, a?.lines.what); }
ok("§6: papilloedema + a chronic hemianopia drops the old-stroke clause",
   card(`${P} homonymous_hemianopia@right`, "chronic")?.lines.what === "Most likely Glioma / metastasis. Must not miss: Dural arteriovenous fistula.");
{ const retina = [...expectedFindings(SITE.left_visual_pathway_retina)].join(" ");
  ok("row 7: a retinal stroke with papilloedema keeps its own What line", card(`${retina} ${P}`)?.lines.what === card(retina)?.lines.what); }
{ const bad = [];
  for (const s of KINDS) { const exp = [...expectedFindings(s)]; if (!exp.length) continue;
    const a = card(`${exp.join(" ")} ${P}`); if (!a || a.twoLesions || a.pressureOnly) continue;
    if (a.nx.followed && !a.lines.what.startsWith(`Most likely ${a.nx.followed.cause}`)) bad.push(s.id);
    if (a.nx.pressureLeads && a.lines.what !== ANS.PRESSURE_ONLY.what) bad.push(s.id); }
  ok("rows 9–10: on every in-play place's own picture with papilloedema, the What line names the cause the plan follows", bad.length === 0, bad.slice(0, 5).join(", ")); }

// ---- E. The wording (rows 16–18) ----
ok("row 16: the What card's papilloedema band",
   same(ANS.PRESSURE_BAND, { title: "less likely with papilloedema",
     note: "Papilloedema means the intracranial pressure is raised. These causes do not raise it: they can explain the deficit, but not the papilloedema.",
     tag: "does not raise the pressure" }));
ok("row 16: a demoted cause's reason — the tempo, the pressure, or both",
   demotionReason({ axis: "tempo", expected: ["hyperacute", "acute"] }) === "usually hyperacute / acute"
   && demotionReason({ axis: "pressure", expected: [] }) === "does not raise the pressure"
   && demotionReason({ axis: "tempo", expected: ["chronic"], pressure: true }) === "usually chronic · does not raise the pressure");
ok("row 17: the Next card's note when papilloedema sets the cause aside",
   followNote({ cause: "X", setAside: "Y", onset: null, pressure: true, by: { onset: false, pressure: true } })
   === "Following the most likely cause, X. Papilloedema sets aside Y, which cannot raise the intracranial pressure and is what this site's usual plan is written for.");
ok("row 17: …when the onset and papilloedema both do",
   followNote({ cause: "X", setAside: "Y", onset: "chronic", pressure: true, by: { onset: true, pressure: true } })
   === "Following the most likely cause, X. A chronic onset and papilloedema set aside Y, which this site's usual plan is written for.");
ok("row 17: …and the approved onset sentence where only the onset does",
   followNote({ cause: "X", setAside: "Y", onset: "chronic", pressure: true, by: { onset: true, pressure: false } })
   === "Following the most likely cause, X. A chronic onset rules out Y, which this site's usual plan is written for."
   && followNote({ cause: "X", setAside: "Y", onset: "subacute" }) === "Following the most likely cause, X. A subacute onset rules out Y, which this site's usual plan is written for.");
ok("row 18: the Next card's note when the pressure leads",
   ANS.PRESSURE_LEADS_NOTE === "No cause usually found here raises the intracranial pressure, so the plan follows the papilloedema itself.");
```

- [ ] **Step 2: Run it to see it fail**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/pressure-follows.test.js`
Expected: `63 passed, 16 failed`, exit 1. The card still follows the site, and the wording exports do not exist yet.

- [ ] **Step 3: Import `pressureDemotesAt` (`app/answer.js`)**

Replace `import { causesFor, rankCauses, leadingCause } from "../src/data/causes.js";` with:

```js
import { causesFor, rankCauses, leadingCause, pressureDemotesAt } from "../src/data/causes.js";
```

- [ ] **Step 4: `resolveNext` carries the pressure; the pressure leads where nothing can raise it (`app/answer.js`)**

Replace the whole block from `// ---- which workup is on screen ----` through the end of `resolveNext` (its `return { nx, combined };`
and closing `}`) with:

```js
// ---- which workup is on screen ----
// ONE resolution, shared by the Next card and the answer card, so the badge and the Next line can never describe
// a different plan from the card below them. It follows the selection, as the Next card always has. Papilloedema steers it as
// the onset does (pressure follows the cause, rows 9 and 11); and where no cause at the place can raise the pressure, the plan
// follows the pressure itself: the pressure-only card's Next line, badged at least urgent (row 10). A selection, the
// all-sites view and a two-place card are left as they are.
export function resolveNext({ site, r, pinned, scope, selectedPathology, selectedEntity, onset }) {
  const { sites } = combinedSites(r, r.display, pinned);
  const combined = sites.length >= 2 && scope === "all";
  const pressure = !!(r.pressure && r.pressure.present);
  const o = { onset: onset || undefined, pressure };
  const nx = combined
    ? combinedNextSteps(sites, selectedEntity || null, o)
    : pathologyNextStepsFor(site, selectedPathology || null, o);
  const twoLesions = !r.explainAll.length && sites.length >= 2;
  if (pressure && !combined && !selectedPathology && !twoLesions && pressureLeads(site, onset))
    return { nx: { ...nx, referral: PRESSURE_ONLY.next, urgency: nx.urgency === "emergency" ? "emergency" : "urgent", pressureLeads: true }, combined };
  return { nx, combined };
}

// Papilloedema is entered and no cause at this place can raise the pressure, at this onset (row 10). One test, read by
// resolveNext and by the What card. The retina, and a place outside the skull, never demote for the pressure, so never qualify.
export const pressureLeads = (site, onset) =>
  pressureDemotesAt(site) && !causesFor(site, { onset: onset || undefined, pressure: true }).all.length;
```

- [ ] **Step 5: The approved wording (`app/answer.js`)**

Immediately above the line `const pressureOnlyFalseLocalising = n => !n ? "" : n > 1` insert:

```js
// ---- the pressure follow's wording (pressure follows the cause, rows 16–18, owner-approved 2026-11-10) ----
// The What card's band for the causes papilloedema demotes, and the Next card's notes. Plain text: app.js escapes it.
export const PRESSURE_BAND = {
  title: "less likely with papilloedema",
  note: "Papilloedema means the intracranial pressure is raised. These causes do not raise it: they can explain the deficit, but not the papilloedema.",
  tag: "does not raise the pressure",
};
export const PRESSURE_LEADS_NOTE = "No cause usually found here raises the intracranial pressure, so the plan follows the papilloedema itself.";
// Why the plan follows a cause nobody selected: the pressure's sentence, or the approved onset sentence (2026-09-29).
export function followNote(f) {
  if (!f) return "";
  if (f.pressure && f.by && f.by.pressure) return f.by.onset
    ? `Following the most likely cause, ${f.cause}. A ${f.onset} onset and papilloedema set aside ${f.setAside}, which this site's usual plan is written for.`
    : `Following the most likely cause, ${f.cause}. Papilloedema sets aside ${f.setAside}, which cannot raise the intracranial pressure and is what this site's usual plan is written for.`;
  return `Following the most likely cause, ${f.cause}. A ${f.onset} onset rules out ${f.setAside}, which this site's usual plan is written for.`;
}
// A demoted cause's reason as its row shows it: the tempo it usually has, that it does not raise the pressure, or both.
export function demotionReason(d) {
  return [d.axis === "tempo" ? `usually ${d.expected.join(" / ")}` : "", d.axis === "pressure" || d.pressure ? PRESSURE_BAND.tag : ""]
    .filter(Boolean).join(" · ");
}
```

- [ ] **Step 6: The card reads the pressure (`app/answer.js`, in `answerFor`)**

Replace `  const res = causesFor(st.sel.site, { onset: st.onset || undefined });` with:

```js
  const pressed = !!(st.r.pressure && st.r.pressure.present);
  const res = causesFor(st.sel.site, { onset: st.onset || undefined, pressure: pressed });
```

Replace `      oldStroke: !!(nx.followed && nx.followed.onset === "chronic"),` with:

```js
      // With papilloedema the line names a cause that can raise the pressure; an old stroke cannot (row 14).
      oldStroke: !pressed && !!(nx.followed && nx.followed.onset === "chronic"),
```

Replace the last two lines of `answerFor`, `  return { lines, nx, combined, twoLesions };` and `}`, with:

```js
  // The card follows the pressure itself (row 10): the pressure-only card's What line, and the banner as the red line — the
  // site's red flag was written for causes now set aside. resolveNext has already given the Next line and the badge.
  if (nx.pressureLeads) { lines.what = PRESSURE_ONLY.what; lines.red = null; }
  return { lines, nx, combined, twoLesions };
}
```

- [ ] **Step 7: Run the suite and the touched suites, then everything**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/pressure-follows.test.js && node test/answer.test.js && node test/raised-pressure.test.js && node test/onset-follows.test.js`
Expected: `79 passed, 0 failed`, and every other suite PASS, exit 0.
Then `npm test`: green, 7492.

- [ ] **Step 8: Commit**

```bash
git add app/answer.js test/pressure-follows.test.js
git commit -m "feat(card): the answer card follows the pressure; the approved wording (rows 9, 10, 14, 16-18)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: The What and Next cards (rows 1, 10, 16–18 on screen; decisions 2–4)

**Files:**
- Modify: `app/app.js` (the import from `./answer.js`, `sharedCauseRow`, `perSiteRemainderHTML`, `whatCard`, `whatBlock`, `nextBlock`)

**Interfaces:**
- Consumes: `PRESSURE_BAND`, `PRESSURE_LEADS_NOTE`, `followNote`, `demotionReason`, `pressureLeads` (Task 3); `combinedCauses` and
  `causesFor` with `pressure` (Task 1); `raisedPressureAxis` (already imported in `app.js`).
- Produces: nothing new for other tasks. `app.js` is DOM-bound, so the suites only parse-check it (`test/app-smoke.test.js`);
  Task 7 drives it in the browser.

- [ ] **Step 1: Import the wording (`app/app.js`)**

Replace `import { answerFor, resolveNext, backgroundSentence, falseLocalisingSentence, PRESSURE_ONLY } from "./answer.js";` with:

```js
import { answerFor, resolveNext, backgroundSentence, falseLocalisingSentence, PRESSURE_ONLY, PRESSURE_BAND, PRESSURE_LEADS_NOTE,
  followNote, demotionReason, pressureLeads } from "./answer.js";
```

- [ ] **Step 2: A shared cause's demoted reason reads its axis (`sharedCauseRow`)**

Replace

```js
function sharedCauseRow(s, nSites, dem) {
  const loc = dem
    ? `at ${s.count} of ${nSites} sites · usually ${s.demotion.expected.map(esc).join(" / ")} onset`
    : `at ${s.count} of ${nSites} sites`;
```

with:

```js
function sharedCauseRow(s, nSites, dem) {
  const d = s.demotion;
  const why = dem ? [d.axis === "tempo" ? `usually ${d.expected.map(esc).join(" / ")} onset` : "",
    d.axis === "pressure" || d.pressure ? esc(PRESSURE_BAND.tag) : ""].filter(Boolean).join(" · ") : "";
  const loc = dem
    ? `at ${s.count} of ${nSites} sites · ${why}`
    : `at ${s.count} of ${nSites} sites`;
```

- [ ] **Step 3: The remainder rows (`perSiteRemainderHTML`)**

Replace

```js
      renderCause(c) + (c.demotion
        ? `<div class="annot" style="margin:-4px 0 6px">Less likely given <b>${esc(c.demotion.entered)}</b> onset — usually ${c.demotion.expected.map(esc).join(" / ")}.</div>`
        : "")
```

with:

```js
      renderCause(c) + (c.demotion
        ? `<div class="annot" style="margin:-4px 0 6px">${c.demotion.axis === "tempo" ? `Less likely given <b>${esc(c.demotion.entered)}</b> onset` : "Less likely with papilloedema"} — ${esc(demotionReason(c.demotion))}.</div>`
        : "")
```

- [ ] **Step 4: The all-sites What view (`whatCard`)**

Replace `    const cc = combinedCauses(sites, { onset: S.onset || undefined });` with:

```js
    const cc = combinedCauses(sites, { onset: S.onset || undefined, pressure: raisedPressureAxis(S.tokens).present });
```

Replace

```js
    const concordantShared = cc.shared.filter(s => !s.demoted);
    const demotedShared = cc.shared.filter(s => s.demoted);
    const shared = concordantShared.length
      ? concordantShared.map(s => sharedCauseRow(s, sites.length, false)).join("")
      : demotedShared.length
      ? `<div class="empty">Every shared cause is demoted given <b>${esc(S.onset)}</b> onset — see "Less likely given the tempo" below.</div>`
      : `<div class="empty">No cause is plausible at more than one of these sites — which argues for two unrelated processes.</div>`;
    const dem = demotedShared.length
      ? setAside(`less likely given <b>${esc(S.onset)}</b> onset`, demotedShared.length,
          `<div class="annot">A cause shared here does not typically present with <b>${esc(S.onset)}</b> onset — the mismatch between tempo and site is itself informative.</div>
           ${demotedShared.map(s => sharedCauseRow(s, sites.length, true)).join("")}`)
      : "";
```

with:

```js
    const concordantShared = cc.shared.filter(s => !s.demoted);
    // Papilloedema demotes beside the tempo, in its own band (pressure follows the cause, row 16).
    const demotedShared = cc.shared.filter(s => s.demoted && s.demotion.axis === "tempo");
    const pressureShared = cc.shared.filter(s => s.demoted && s.demotion.axis === "pressure");
    const shared = concordantShared.length
      ? concordantShared.map(s => sharedCauseRow(s, sites.length, false)).join("")
      : demotedShared.length
      ? `<div class="empty">Every shared cause is demoted given <b>${esc(S.onset)}</b> onset — see "Less likely given the tempo" below.</div>`
      : pressureShared.length
      ? `<div class="empty">Every shared cause is set aside with papilloedema — see "${esc(PRESSURE_BAND.title)}" below.</div>`
      : `<div class="empty">No cause is plausible at more than one of these sites — which argues for two unrelated processes.</div>`;
    const dem = (demotedShared.length
      ? setAside(`less likely given <b>${esc(S.onset)}</b> onset`, demotedShared.length,
          `<div class="annot">A cause shared here does not typically present with <b>${esc(S.onset)}</b> onset — the mismatch between tempo and site is itself informative.</div>
           ${demotedShared.map(s => sharedCauseRow(s, sites.length, true)).join("")}`)
      : "") + (pressureShared.length
      ? setAside(esc(PRESSURE_BAND.title), pressureShared.length,
          `<div class="annot">${esc(PRESSURE_BAND.note)}</div>${pressureShared.map(s => sharedCauseRow(s, sites.length, true)).join("")}`)
      : "");
```

- [ ] **Step 5: The single-site What card (`whatBlock`)**

Replace its first three lines

```js
function whatBlock(site) {
  const res = causesFor(site, { onset: S.onset || undefined });
  const ph = nameForSite(site, { dominantSide: domView() });
  const redText = site.red || ph.red; // a reading's own red flag (the uncal reading, raised-pressure round, row 11)
```

with:

```js
function whatBlock(site) {
  const pressed = raisedPressureAxis(S.tokens).present;
  const res = causesFor(site, { onset: S.onset || undefined, pressure: pressed });
  // Nothing here can raise the pressure (pressure follows the cause, row 10): the card follows the pressure itself, and the
  // banner is the red line, as on the answer card.
  const leads = pressed && pressureLeads(site, S.onset);
  const ph = nameForSite(site, { dominantSide: domView() });
  const redText = leads ? null : (site.red || ph.red); // a reading's own red flag (the uncal reading, raised-pressure round, row 11)
```

Replace

```js
  const lead = leadCauses.length
    ? `<p class="what-lead">${S.onset ? `Given <b>${esc(S.onset)}</b> onset, think first of` : "Most likely"}: ${leadCauses.map(esc).join("; ")}.</p>` : "";
```

with:

```js
  const lead = leads
    ? `<p class="what-lead">${esc(PRESSURE_ONLY.what)}</p>`
    : leadCauses.length
    ? `<p class="what-lead">${S.onset ? `Given <b>${esc(S.onset)}</b> onset, think first of` : "Most likely"}: ${leadCauses.map(esc).join("; ")}.</p>` : "";
```

Replace

```js
  // Tempo mismatches are demoted, never deleted — the teaching line that used to REPLACE the content now
  // heads the disclosure. Spec 2026-08-14 §7.
  const dem = res.demoted && res.demoted.length
    ? setAside(`less likely given <b>${esc(S.onset)}</b> onset`, res.demoted.length,
        `<div class="annot">A lesion here does not typically present with <b>${esc(S.onset)}</b> onset — the mismatch between tempo and site is itself informative.</div>
         ${res.demoted.map(x => `<div class="cause"><b>${esc(x.name)}</b> <span class="dloc">usually ${x.demotion.expected.map(esc).join(" / ")}</span>${x.feature ? ` — ${esc(x.feature)}` : ""}</div>`).join("")}`)
    : "";
```

with:

```js
  // Tempo mismatches are demoted, never deleted — the teaching line that used to REPLACE the content now
  // heads the disclosure. Spec 2026-08-14 §7. Papilloedema demotes beside them in its own band (pressure follows the cause,
  // row 16); a cause both demote stays in the tempo band with both reasons. The papilloedema band's causes stay selectable
  // (row 1), so it is held open while the selection lives inside it.
  const tempoDem = res.demoted.filter(x => x.demotion.axis === "tempo");
  const pressDem = res.demoted.filter(x => x.demotion.axis === "pressure");
  const dem = (tempoDem.length
    ? setAside(`less likely given <b>${esc(S.onset)}</b> onset`, tempoDem.length,
        `<div class="annot">A lesion here does not typically present with <b>${esc(S.onset)}</b> onset — the mismatch between tempo and site is itself informative.</div>
         ${tempoDem.map(x => `<div class="cause"><b>${esc(x.name)}</b> <span class="dloc">${esc(demotionReason(x.demotion))}</span>${x.feature ? ` — ${esc(x.feature)}` : ""}</div>`).join("")}`)
    : "") + (pressDem.length
    ? setAside(esc(PRESSURE_BAND.title), pressDem.length,
        `<div class="annot">${esc(PRESSURE_BAND.note)}</div>${pressDem.map(x => renderCause(x) + `<div class="annot" style="margin:-4px 0 6px">${esc(PRESSURE_BAND.tag)}.</div>`).join("")}`,
        pressDem.some(x => x.name === S.selectedPathology))
    : "");
```

- [ ] **Step 6: The Next card's notes (`nextBlock`)**

Replace

```js
  const fxHead = fx
    ? `<p class="derived">Following the most likely cause, ${esc(fx.cause)}. A ${esc(fx.onset)} onset rules out ${esc(fx.setAside)}, which this site's usual plan is written for.</p>` : "";
```

with:

```js
  // Papilloedema has its own sentences (pressure follows the cause, rows 17–18); the onset's stays as approved.
  const fxHead = fx
    ? `<p class="derived">${esc(followNote(fx))}</p>`
    : !combined && !px && nx.pressureLeads ? `<p class="derived">${esc(PRESSURE_LEADS_NOTE)}</p>` : "";
```

(The onset follow's sentence is unchanged: `followNote` returns exactly the approved 2026-09-29 sentence for it.)

- [ ] **Step 7: Run the parse check, then everything**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node --check app/app.js && node test/app-smoke.test.js`
Expected: no output from `--check`; app-smoke all PASS, exit 0.
Then `npm test`: green, 7492 (unchanged: no suite renders the DOM).

- [ ] **Step 8: Commit**

```bash
git add app/app.js
git commit -m "feat(app): the What card's papilloedema band and the Next card's notes (rows 1, 10, 16-18)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: The IV joins the pressure's reach (rows 15, 19)

**Files:**
- Modify: `src/model/compartments.js` (`PRESSURE_REACHES` and its comment), `test/raised-pressure.test.js` (the three
  re-pins), `test/pressure-follows.test.js` (the snapshot, the ratchet, section F)

**Interfaces:**
- Produces: `PRESSURE_REACHES` = `skull_base|vi_cisternal`, `skull_base|vi_petrous_apex`, `skull_base|trochlear_cisternal`.

- [ ] **Step 1: The suite expects the IV (section F, and the in-play counts it changes)**

In `test/pressure-follows.test.js`:
- replace `ok("row 21: the in-play cause lists hold 641 rows (435 names); 264 rows can raise the pressure",` and the line after
  it, `     keys.size === 98 && rows === 641 && names.size === 435 && can === 264, ...`, with:

```js
  ok("row 21: the in-play cause lists hold 647 rows (438 names); 266 rows can raise the pressure",
     keys.size === 99 && rows === 647 && names.size === 438 && can === 266, `${keys.size} lists, ${rows} rows, ${names.size} names, ${can} can`);
```

- in the `CAN` list, replace `"Tumour or meningeal disease at the skull base","Tumour or surgical injury"` with `"Tumour or meningeal disease at the skull base","Tumour or raised intracranial pressure","Tumour or surgical injury"`;
- replace `are exactly Appendix A's (159)` with `are exactly Appendix A's (160)`;
- replace `want = "79/7 52/43 66/19 37/15 22/17";` with `want = "80/7 52/44 66/20 37/15 23/17";`;
- replace `over 111 place kinds",` and, on the next line, `KINDS.length === 111` with `over 112 place kinds",` and
  `KINDS.length === 112`;
- immediately above `// ---- report ----`, insert:

```js
// ---- F. The IV (row 15) ----
ok("row 15: the IV's cisternal course is in PRESSURE_REACHES, and the pressure demotes there",
   PRESSURE_REACHES.has("skull_base|trochlear_cisternal") && demotesAt(SITE.left_skull_base_trochlear_cisternal) === true);
{ const a = card(`weak_depression@left vertical_diplopia@left ${P}`);
  ok("row 15: a IV palsy with papilloedema reads the IV nerve and leads with the pressure, an emergency",
     /^Left IV — cisternal segment\./.test(a?.lines.where || "")
     && a?.lines.what === "Most likely Tumour or raised intracranial pressure (must not miss). Must not miss: Basal meningitis (tuberculous, carcinomatous or fungal)."
     && a?.nx.urgency === "emergency", `${a?.lines.where} | ${a?.lines.what} [${a?.nx.urgency}]`); }
ok("row 15 guard: without papilloedema the IV palsy's card is unchanged (the IV nerve, head trauma first)",
   card("weak_depression@left vertical_diplopia@left")?.lines.what.startsWith("Most likely Head trauma"));
```

- [ ] **Step 2: Run it to see it fail**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/pressure-follows.test.js`
Expected: `77 passed, 5 failed`, exit 1: the counts, the names list, the ratchet, and two of section F's three (its guard without
papilloedema holds already).

- [ ] **Step 3: The IV joins `PRESSURE_REACHES` (`src/model/compartments.js`)**

Replace the block from `// THE NERVE COURSES RAISED PRESSURE ITSELF INJURES (raised-pressure round, row 2, owner-approved 2026-11-05), keyed`
through `export const PRESSURE_REACHES = new Set(["skull_base|vi_cisternal", "skull_base|vi_petrous_apex"]);` with:

```js
// THE NERVE COURSES RAISED PRESSURE ITSELF INJURES (raised-pressure round, row 2, owner-approved 2026-11-05; the IV added by
// the pressure-follows-the-cause round, row 15, owner-approved 2026-11-10), keyed `level|part`. Papilloedema keeps only the
// places inside the skull — and these, because the pressure produces their palsy itself: the VI's long cisternal course, the
// VI tethered at the petrous apex (the false-localising sign), and the IV's cisternal course (the thinnest nerve, and the only
// one to leave dorsally). They are exactly the parts outside the skull's levels whose own causes name raised pressure, and
// test/raised-pressure.test.js checks the set against the causes. The IV waited until its card could follow the pressure: with
// papilloedema it now leads with "Tumour or raised intracranial pressure", not head trauma (spec 2026-11-09, row 15).
export const PRESSURE_REACHES = new Set(["skull_base|vi_cisternal", "skull_base|vi_petrous_apex", "skull_base|trochlear_cisternal"]);
```

- [ ] **Step 4: See exactly the three re-pins fail**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/raised-pressure.test.js`
Expected: `55 passed, 3 failed`. The three are row 19's: the set, the cross-check's "the deferred IV", and the IV guard.

- [ ] **Step 5: Re-pin them (`test/raised-pressure.test.js`)**

Replace

```js
ok("row 2: PRESSURE_REACHES is the VI's cisternal course and the VI at the petrous apex",
   [...PRESSURE_REACHES].sort().join() === "skull_base|vi_cisternal,skull_base|vi_petrous_apex", [...PRESSURE_REACHES].join());
```

with:

```js
ok("row 2: PRESSURE_REACHES is the VI's cisternal course, the VI at the petrous apex and (pressure-follows round, row 15) the IV's cisternal course",
   [...PRESSURE_REACHES].sort().join() === "skull_base|trochlear_cisternal,skull_base|vi_cisternal,skull_base|vi_petrous_apex", [...PRESSURE_REACHES].join());
```

Replace

```js
{ // The cross-check (row 2): the parts outside the skull's levels whose own causes name raised pressure are PRESSURE_REACHES,
  // and the IV's cisternal course, deferred.
```

with:

```js
{ // The cross-check (row 2): the parts outside the skull's levels whose own causes name raised pressure are exactly
  // PRESSURE_REACHES — the IV's cisternal course joined it in the pressure-follows round (row 15).
```

Replace

```js
  ok("row 2: every other part that names it is the deferred IV",
     [...named].filter(k => !PRESSURE_REACHES.has(k)).join() === "skull_base|trochlear_cisternal", [...named].join(", ")); }
```

with:

```js
  ok("row 2: no other part names it (the IV joined, pressure-follows round, row 15)",
     [...named].filter(k => !PRESSURE_REACHES.has(k)).length === 0, [...named].join(", ")); }
```

Replace

```js
ok("row 2 guard: a IV palsy + papilloedema still leads with the contralateral trochlear nucleus (the IV is deferred)",
   ids(solve(T(`weak_depression@left vertical_diplopia@left ${P}`)))[0] === "right_midbrain_trochlear");
```

with:

```js
{ const r = solve(T(`weak_depression@left vertical_diplopia@left ${P}`));
  ok("row 2 (pressure-follows round, row 15): a IV palsy + papilloedema leads with the IV nerve; the contralateral nucleus also fits",
     ids(r)[0] === "left_skull_base_trochlear_cisternal" && ids(r).includes("right_midbrain_trochlear"), ids(r).slice(0, 3).join(", ")); }
```

- [ ] **Step 6: Run the two suites, then everything**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/pressure-follows.test.js && node test/raised-pressure.test.js && node test/fundus.test.js && node test/compartments.test.js`
Expected: `82 passed, 0 failed`; raised-pressure `58 passed, 0 failed`; every other suite PASS, exit 0.
Then `npm test`: green, 88 suites / 7495. Then `npm run test:audit`: **1050 passed, 9 failed**.

- [ ] **Step 7: Commit**

```bash
git add src/model/compartments.js test/raised-pressure.test.js test/pressure-follows.test.js
git commit -m "feat(engine): the IV's cisternal course joins the pressure's reach; its card follows the pressure (rows 15, 19)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Four audit probes of a new kind, and their record (row 20)

**Files:**
- Modify: `test/clinical-audit.test.js` (the header's list of assertion kinds, two imports, the `lead` check, four probes),
  `docs/superpowers/specs/2026-10-18-clinical-audit-suite.md`

- [ ] **Step 1: Document the new assertion kind (`test/clinical-audit.test.js`)**

In the header comment, after the line `//   functional — the functional flag fired`, add:

```js
//   lead / leadNot — the answer card's LEADING cause (its "Most likely" clause only, never the must-not-miss; "(the
//              pressure)" when the card follows the pressure itself) matches / does not match — pressure-follows-the-cause
//              round, row 20 (2026-11-10): the one kind that reads a cause rather than a place
```

- [ ] **Step 2: The imports**

After `import { offersFor } from "../app/sides.js";` add:

```js
import { answerFor } from "../app/answer.js";
import { isNormalToken } from "../src/engine/inverse.js";
```

- [ ] **Step 3: The `lead` check**

Immediately after the line `    if (w.functional) A("functional flag raised", functionalFlag(set).functional === true, "");` insert:

```js
    if (w.lead || w.leadNot) {
      const sel = r.display.find(x => x.site.id === r.defaultSite) || r.display[0];
      const total = [...set].filter(t => !t.startsWith("papilloedema@") && !isNormalToken(t)).length;
      const what = sel ? answerFor({ r, sel, total, tokens: set, onset: "", course: "", dominant: "left", sensoryLevel: "",
        pinned: new Set(), scope: "site", selectedPathology: undefined, selectedEntity: undefined }).lines.what : "";
      const m = what.match(/^Most likely (.*?)(?: \(must not miss\))?\.(?= Must not miss| After a previous| Could represent|$)/);
      const lead = m ? m[1] : what.startsWith("Find what is raising the pressure") ? "(the pressure)" : what;
      if (w.lead) A(`the What line leads with ${w.lead}`, w.lead.test(lead), `What: ${what}`);
      if (w.leadNot) A(`the What line does not lead with ${w.leadNot}`, !w.leadNot.test(lead), `What: ${what}`);
    }
```

- [ ] **Step 4: The four probes**

Immediately after the raised-pressure round's last probe (the line beginning
`T("Consciousness & raised pressure", "bilateral VI + papilloedema + R hemiparesis → a left hemisphere site, one lesion (the VIs false-localising)"`),
insert:

```js
// owner-approved 2026-11-10 (pressure-follows-the-cause round, round 1, row 20): the answer card's leading cause with
// papilloedema — a new kind of check, the yardstick change the row approved. Each fails on e31d5c9.
T("Consciousness & raised pressure", "papilloedema + R hemiparesis → the What line leads with a cause that can raise the pressure, not a lacune", "papilloedema@none weak_arm@right weak_leg@right", { lead: /haemorrhage|haematoma|glioma|metastasis|tumour|abscess|meningioma|lymphoma|\(the pressure\)/i, pressure: true });
T("Consciousness & raised pressure", "coma + papilloedema → the What line leads with the pressure, not a metabolic encephalopathy", "reduced_consciousness@none papilloedema@none", { lead: /\(the pressure\)|mass|hydroceph|venous|haemorrhage|abscess|encephalitis|meningitis|herniation/i, pressure: true });
T("Hemispheres, thalamus & vision", "papilloedema + R hemianopia → the What line does not lead with an infarct", "papilloedema@none homonymous_hemianopia@right", { leadNot: /infarct/i, pressure: true });
T("Cranial nerves & skull base", "IV palsy + papilloedema → the IV nerve first, led by the pressure or a tumour", "weak_depression@left vertical_diplopia@left papilloedema@none", { first: /^left_skull_base_trochlear_cisternal$/, lead: /raised intracranial pressure|tumour|\(the pressure\)/i, pressure: true });
```

- [ ] **Step 5: Run the audit**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm run test:audit`
Expected: harness PASS; probes **112 / 119**; counted checks **1063 passed, 9 failed**; mirror **281 / 281** (each probe is mirrored);
swaps 272 / 272; background 292 / 292. The 9 failing are the composite-sites round. (Measured in the dry run: with these probes
added to `e31d5c9` the audit reads 1058 / 14 — each probe fails there, the IV probe on both its place and its cause.)

- [ ] **Step 6: Record them in the audit spec**

Append to `docs/superpowers/specs/2026-10-18-clinical-audit-suite.md`:

```markdown

## Pressure-follows-the-cause round, round 1, row 20: four probes and a new check (2026-11-10)

The round's round 1 (`2026-11-09-pressure-follows-cause-design.md`, row 20, approved as written) added one assertion kind and
four counted probes. **`lead` / `leadNot`** read the answer card's leading cause, from its "Most likely" clause only (never the
must-not-miss), or "(the pressure)" when the card follows the pressure itself. It is the first check that reads a cause rather
than a place: a yardstick change, approved with the row. Each probe fails on `e31d5c9` (the raised-pressure round):

| Probe | Expected answer (approved) | Baseline |
|---|---|---|
| papilloedema + right hemiparesis | leads with a cause that can raise the pressure (a mass or a bleed) | "Small-vessel lacunar infarct" |
| coma + papilloedema | leads with the pressure, not a metabolic encephalopathy | "Metabolic or toxic encephalopathy" |
| papilloedema + right hemianopia | does not lead with an infarct | "PCA infarct" |
| IV palsy + papilloedema | the IV nerve first; leads with the pressure or a tumour | the contralateral trochlear nucleus; "Demyelination" |

Each probe is also mirrored, so the mirror property runs **281** checks.

**After the fix (measured on `fix/pressure-follows-cause`):** probes **112 / 119**; counted checks 1063 passed, 9 failed. The 9
are exactly the composite-sites round. Synonym swaps 272 / 272; background 292 / 292; mirror 281 / 281.
```

- [ ] **Step 7: Commit**

```bash
git add test/clinical-audit.test.js docs/superpowers/specs/2026-10-18-clinical-audit-suite.md
git commit -m "test(audit): a lead check and four probes approved in the pressure-follows round (row 20)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Verify end to end, then document

**Files:**
- Modify: `CLAUDE.md`, `docs/superpowers/specs/2026-11-09-pressure-follows-cause-design.md` (status), this plan (status),
  `/Users/jaydenwearne/Desktop/Personal/Claude Code/Projects/NeuroLocaliser/Code/.claude/launch.json` (a preview entry)

- [ ] **Step 1: The suites and the audit, from clean**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test && npm run test:audit`
Expected: 88 suites / 7495 green; then the audit as in Task 6, Step 5 (the audit exits 1 by design:
9 failing).

- [ ] **Step 2: Re-measure the card sample and the cards against the dry run**

In the prototype folder (`/Users/jaydenwearne/Library/Application Support/Claude/side-session-notes/local_95cb1331-2672-472f-a200-e244e8a2b3a8/pressure-cause-prototype`), whose `run.mjs` and `mk.mjs` point at this worktree and whose `out/base.csample.json`,
`out/base.cpairs.json` and `out/PLAN.*` are the frozen baseline and the dry run, run with that folder as the working directory:

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"
node mk.mjs impl && node csample.mjs impl && node cpairs.mjs impl
node cmp.mjs PLAN impl
node card.mjs impl pcards.json > out/impl.pcards.txt && node carddiff.mjs out/PLAN.pcards.txt out/impl.pcards.txt | tail -1
node card.mjs impl cards.json > out/impl.cards41.txt && node carddiff.mjs out/PLAN.cards41.txt out/impl.cards41.txt | tail -1
node summ.mjs base impl
```

(`impl` names no flag, so `mk.mjs` copies the branch as it is.) Expected:
- `cards: 7530 compared, 0 differ` and `pairs: 1226 compared, 0 differ`;
- `(unchanged: 46)` and `(unchanged: 41)`;
- `summ` as the spec's §5 with no onset: 385 of 436 cards change, the plan follows on 292, the pressure leads on 24, none
  badge routine, and the What and Next lines agree. At chronic onset the pressure leads on 71 (decision 1).

- [ ] **Step 3: Drive the app**

Add to `Code/.claude/launch.json` (beside the pressure entry):

```json
    {
      "name": "NeuroLocaliser pressure-cause worktree",
      "runtimeExecutable": "/usr/bin/env",
      "runtimeArgs": ["PORT=8144", "/Users/jaydenwearne/.local/node-v24.18.0-darwin-arm64/bin/node", "neurolocaliser-pressure-cause/app/serve.mjs"],
      "port": 8144
    }
```

Start it with `preview_start {name: "NeuroLocaliser pressure-cause worktree"}` and unlock with the passphrase. Check each case,
reloading between cases (a hash-only change does not re-run boot):
- **Papilloedema + right hemiparesis:** the answer card reads the haemorrhage and its plan [EMERGENCY]. The What card's *"Set
  aside — less likely with papilloedema"* band holds the lacune, small-vessel disease, hypoglycaemia and the plaque, with the
  row-16 note and tags. Clicking the lacune there selects it: the Next card reads *"Plan for: Small-vessel lacunar infarct"*,
  badged at least URGENT. The Next card's note is row 17's.
- **The same, at chronic onset:** the glioma; no *"Could represent an old stroke."*; the Next card's note reads *"A chronic
  onset and papilloedema set aside …"*.
- **Coma + papilloedema:** the answer card's What and Next lines are the pressure-only lines [EMERGENCY], with no red-flag line
  under the banner. The What card leads with the pressure-only What line and draws no red-flag box. The Next card's note is
  row 18's.
- **Papilloedema + a left IV palsy:** *"Left IV — cisternal segment"*, *"Tumour or raised intracranial pressure"* [EMERGENCY].
- **A two-place picture with papilloedema, all sites:** the What (all sites) card shows any papilloedema-demoted shared causes
  in their own band.
- **No papilloedema:** a right hemiparesis at chronic onset still reads small-vessel disease with *"Could represent an old
  stroke."*, and the onset note.
- No console errors (`read_console_messages`); 375 px and dark mode for the bands.

- [ ] **Step 4: Document**

- `CLAUDE.md`: add a section *"Pressure follows the cause (DONE <date>, round 1) — ✅ owner-approved rulings (every row)"* after
  the raised-pressure section, in its shape:
  - the defect;
  - the mechanics: the second demotion axis and `CAN_RAISE_PRESSURE`; `pressureDemotesAt` (in play, the retina exempt);
    `pressureFollows` and its scope; `pressureFloor`; the pressure leads in `resolveNext`; the IV in `PRESSURE_REACHES`;
  - the traps: the escalation must not read the pressure; following on either axis widens the onset rule; a What-line probe
    must read the "Most likely" clause only; the retina at a chronic onset (decision 1);
  - the measured numbers, and the spec and plan paths.

  Then update:
  - the status counts (88 suites / 7495);
  - the clinical-audit paragraph in *Commands* (+4 probes and the `lead` check by the pressure-follows round, 2026-11-10;
    after it 112 / 119);
  - the *Layers* entries for `causes.js` (the second axis), `nextSteps.js` (`pressureFollows`, the floor) and
    `compartments.js` (`PRESSURE_REACHES` with the IV);
  - the raised-pressure section's sentence on the IV deferral.
- The anatomy sheet (`docs/artifacts/anatomy-model.html`): **no change** (row 21: no structure is added).
- The spec: status line → *IMPLEMENTED (date) on `fix/pressure-follows-cause` (commits)*, with the measured numbers (and
  decision 1's chronic count).
- This plan: status line → *IMPLEMENTED*, with the commit range.

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md docs/superpowers/specs/2026-11-09-pressure-follows-cause-design.md docs/superpowers/plans/2026-11-09-pressure-follows-cause.md
git commit -m "docs: pressure follows the cause — rulings applied, measured, browser-checked

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

(`Code/.claude/launch.json` is outside the repository and is not committed.)

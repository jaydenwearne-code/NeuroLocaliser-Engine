# Cranial-nerve peripheral-course localisation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the *longitudinal* localisation axis to the extra-axial cranial nerves — sites **along one nerve's course** (facial branch points, trigeminal divisions, III divisions, VI petrous apex, recurrent laryngeal, spinal accessory in the neck, IX/X gag afferent-vs-efferent split), differentiated by which **branch is spared**.

**Architecture:** Re-key the skull-base structure catalogue from foramen-bundled parts to **per-nerve (nerve, compartment) primitive parts**. Each primitive part auto-becomes a candidate site via `buildSites`; the multi-nerve **foramen syndromes emerge** from `composeSkullBaseSites` unioning the per-nerve parts (extended, explicit-part-group shape). Localisation of the spared branch falls out of the existing over-prediction penalty — **no new forward-model or solver code**, exactly as the `nerve-segments` limb-nerve increment.

**Tech Stack:** Zero-dependency ES modules, Node v24 (off PATH — see Global Constraints). No test framework: each suite is a standalone script with a local `ok(label, cond)` helper that `process.exit`s non-zero on any failure.

## Global Constraints

- **Runtime:** Node is **off PATH**. Prefix every node/npm command with `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"`. There is nothing to install (no `node_modules`, no build step).
- **Not a git repository.** History lives in `docs/superpowers/`. The "Commit" step of each task is replaced by **"Run the full suite green"** (`npm test`) as the checkpoint. Do **not** run `git` commands.
- **Golden rule:** never write `if (hasX && hasY) return syndrome`. Syndromes emerge from structures sharing a site; `syndromes.js` is a phonebook keyed by emergent `level_part` site id.
- **One structure = one finding.** Every structure has exactly one `produces`. A nerve crossing several compartments is a separate structure in each.
- **All skull-base findings are ipsilateral:** `CROSSES[finding] === false`, none in `NON_LATERALISED`, no per-structure `crosses` override, no `hemisphere`/`bilateralOnly` gate.
- **Design spec:** `docs/superpowers/specs/2026-07-19-cranial-nerve-peripheral-course-design.md` — read it before starting.
- **Keep all 30 prior suites green.** Only `test/cranial-nerves.test.js` references the re-keyed skull-base ids, so only it changes; every other suite must stay green after each task.

---

## File structure

- `src/model/findings.js` — add 13 findings + `CROSSES:false` entries; remove `cn11_weakness`.
- `src/engine/score.js` — add 13 findings to `LOCALISING`; remove `cn11_weakness`.
- `src/model/structures.js` — replace the `SKULL BASE` block (currently ~lines 429–468) with the per-nerve catalogue.
- `src/model/sites.js` — edit `PARTS`, `TERRITORY`, and `composeSkullBaseSites`.
- `src/data/syndromes.js` — re-point/extend the skull-base phonebook entries.
- `test/cranial-nerves.test.js` — **rewrite** for the per-nerve model (this is the driving test suite). The existing suite's assertions reference retired ids (`cn11_weakness`, the bundled `sup_orbital_fissure`/`jugular_foramen` *primitive* parts, `cn_bulbar` at the jugular) — **remove every such stale assertion**; the new Tasks 1–7 sections below supersede the whole existing body. ES `import` statements are hoisted and must appear **exactly once** each — when a task's code block starts with an `import`, do not reintroduce a duplicate already present in the file (delete the old one or the new one, keep one). Keep the tiny `ok(label,cond)` harness and the final `process.exit(fail===0?0:1)` footer.
- `package.json`, `README.md`, `CONTRIBUTING.md` — already list the suite; no new suite file, so **no registration change** unless you split the suite (you won't).
- `docs/artifacts/architecture.html`, `docs/artifacts/anatomy-model.html`, memory `MEMORY.md` + `neurolocaliser-engine-state.md` — sync at the end.

**Naming reference (used across tasks — keep exact):**

Primitive parts (each builds a left/right site via `buildSites`; added to `PARTS`):
`iii_trunk`, `iii_orbit_sup`, `iii_orbit_inf`, `iv_trunk`, `vi_cisternal`, `vi_petrous_apex`, `vi_trunk`, `v_ganglion`, `v1_division`, `v3_ovale`, `v1_petrous`, `vii_geniculate`, `vii_tympanic`, `vii_mastoid`, `vii_stylomastoid`, `vii_parotid`, `iam`, `ix_jugular`, `x_jugular`, `x_recurrent_laryngeal`, `xi_jugular`, `xi_posterior_triangle`, `xii_neck`.

Kept primitive parts (already in `PARTS`): `foramen_rotundum` (V2), `optic_canal`, `hypoglossal_canal` (XII at canal), `carotid_space`, `cpa`, `trochlear_cisternal`.

Composite / composite-only parts (**not** in `PARTS`; built by `composeSkullBaseSites` or referenced only by it): `sup_orbital_fissure`, `cavernous_sinus`, `orbital_apex`, `petrous_apex`, `jugular_foramen`, `collet_sicard`, `villaret`, and `orbital_sympathetic` (the oculosympathetic contributor — no standalone site so isolated Horner still goes to the Horner-axis sites).

Removed parts: `sup_orbital_fissure` and `jugular_foramen` leave `PARTS` (they become composites).

---

## Task 1: Findings vocabulary + LOCALISING

**Files:**
- Modify: `src/model/findings.js` (the `FINDINGS` block ~lines 25–30; the `CROSSES` block ~lines 275–276)
- Modify: `src/engine/score.js` (the `LOCALISING` set, line ~47)
- Test: `test/cranial-nerves.test.js` (Task-1 vocabulary section)

**Interfaces:**
- Produces: findings `lacrimation_loss`, `hyperacusis`, `taste_loss`, `facial_weak_branch`, `v3_sensory`, `gag_afferent_loss`, `taste_posterior`, `palatal_weakness`, `vocal_cord_palsy`, `cn3_superior_div`, `cn3_inferior_div`, `weak_scm`, `weak_trapezius` — all `CROSSES:false`, all in `LOCALISING`. `cn11_weakness` is removed everywhere.

- [ ] **Step 1: Write the failing test** — replace the current Task-1 vocabulary section (lines 13–20) of `test/cranial-nerves.test.js` with:

```js
// --- Task 1: vocabulary (13 new findings; cn11_weakness retired) ---
const NEW_CN = ["lacrimation_loss","hyperacusis","taste_loss","facial_weak_branch","v3_sensory",
  "gag_afferent_loss","taste_posterior","palatal_weakness","vocal_cord_palsy",
  "cn3_superior_div","cn3_inferior_div","weak_scm","weak_trapezius"];
for (const id of NEW_CN) {
  ok(`finding ${id} exists`, isFinding(id));
  ok(`${id} is ipsilateral (CROSSES false)`, CROSSES[id] === false);
  ok(`${id} is NOT non-lateralised`, !NON_LATERALISED.has(id));
}
ok("cn11_weakness finding is retired", !isFinding("cn11_weakness"));
ok("cn4_palsy still exists", isFinding("cn4_palsy"));
```

Also add the `LOCALISING` import + check at the top of the file (after the existing imports):

```js
import { LOCALISING } from "../src/engine/score.js";
for (const id of NEW_CN) ok(`${id} IS localising`, LOCALISING.has(id));
ok("cn11_weakness removed from LOCALISING", !LOCALISING.has("cn11_weakness"));
```

- [ ] **Step 2: Run the suite to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cranial-nerves.test.js`
Expected: FAIL (e.g. `finding lacrimation_loss exists` false; later structure/site sections also fail — that is fine, Task 1 only fixes the vocabulary lines).

- [ ] **Step 3: Add the findings** — in `src/model/findings.js`, replace the "Peripheral cranial-nerve signs at the skull base" block (the five lines 26–30, including `cn11_weakness`) with:

```js
  // Peripheral cranial-nerve signs at the skull base (all ipsilateral)
  optic_neuropathy: { desc: "Monocular visual loss / optic neuropathy (CN II)", group: "Cranial nerve" },
  v1_sensory:     { desc: "Facial sensory loss / reduced corneal reflex — ophthalmic division (V1)", group: "Cranial nerve" },
  v2_sensory:     { desc: "Facial sensory loss — maxillary division (V2, cheek)", group: "Cranial nerve" },
  v3_sensory:     { desc: "Facial sensory loss — mandibular division (V3, jaw/chin; foramen ovale)", group: "Cranial nerve" },
  hearing_loss:   { desc: "Sensorineural hearing loss ± tinnitus (CN VIII)", group: "Cranial nerve" },
  // facial nerve (VII) branch discriminators along its intratemporal course
  lacrimation_loss:   { desc: "Reduced tearing / dry eye — greater petrosal nerve (geniculate)", group: "Cranial nerve" },
  hyperacusis:        { desc: "Loudness intolerance — nerve to stapedius", group: "Cranial nerve" },
  taste_loss:         { desc: "Loss of taste, anterior two-thirds of tongue — chorda tympani (VII)", group: "Cranial nerve" },
  facial_weak_branch: { desc: "Partial facial weakness in a single branch territory (extracranial / parotid)", group: "Cranial nerve" },
  cn3_superior_div:   { desc: "CN III superior division — ptosis + failure of elevation (SR + LPS)", group: "Cranial nerve" },
  cn3_inferior_div:   { desc: "CN III inferior division — failed adduction/depression + pupil (MR/IR/IO + parasympathetic)", group: "Cranial nerve" },
  // lower cranial nerves (IX/X gag afferent vs efferent; X distal; XI split)
  gag_afferent_loss:  { desc: "Absent gag (afferent limb) + pharyngeal sensory loss — glossopharyngeal (IX)", group: "Cranial nerve" },
  taste_posterior:    { desc: "Loss of taste, posterior third of tongue — glossopharyngeal (IX)", group: "Cranial nerve" },
  palatal_weakness:   { desc: "Palatal droop / uvular deviation, nasal regurgitation (gag efferent) — vagal pharyngeal branches (X)", group: "Cranial nerve" },
  vocal_cord_palsy:   { desc: "Hoarseness / vocal-cord paresis — recurrent (or high vagal) laryngeal (X)", group: "Cranial nerve" },
  weak_scm:           { desc: "Sternocleidomastoid weakness (head turn to opposite side) — accessory (XI)", group: "Cranial nerve" },
  weak_trapezius:     { desc: "Trapezius weakness / shoulder droop — accessory (XI)", group: "Cranial nerve" },
```

- [ ] **Step 4: Set CROSSES** — in `src/model/findings.js`, replace the "peripheral skull-base CN signs" line (currently `optic_neuropathy: false, v1_sensory: false, v2_sensory: false, cn11_weakness: false, hearing_loss: false,`) with:

```js
  // peripheral skull-base CN signs — all ipsilateral
  optic_neuropathy: false, v1_sensory: false, v2_sensory: false, v3_sensory: false, hearing_loss: false,
  lacrimation_loss: false, hyperacusis: false, taste_loss: false, facial_weak_branch: false,
  cn3_superior_div: false, cn3_inferior_div: false,
  gag_afferent_loss: false, taste_posterior: false, palatal_weakness: false, vocal_cord_palsy: false,
  weak_scm: false, weak_trapezius: false,
```

- [ ] **Step 5: Update LOCALISING** — in `src/engine/score.js`, replace the line
`  "optic_neuropathy","v1_sensory","v2_sensory","cn11_weakness","hearing_loss",` with:

```js
  // peripheral skull-base cranial-nerve signs — each pins a foramen/compartment or a point on a nerve's course
  "optic_neuropathy","v1_sensory","v2_sensory","v3_sensory","hearing_loss",
  "lacrimation_loss","hyperacusis","taste_loss","facial_weak_branch","cn3_superior_div","cn3_inferior_div",
  "gag_afferent_loss","taste_posterior","palatal_weakness","vocal_cord_palsy","weak_scm","weak_trapezius",
```

- [ ] **Step 6: Run the vocabulary section green**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cranial-nerves.test.js 2>&1 | grep -E "lacrimation_loss|hyperacusis|taste_loss|cn11_weakness|weak_scm|IS localising"`
Expected: every printed line is `PASS`. (The suite as a whole still fails on the later structure/site sections — that is Task 2+.)

---

## Task 2: Per-nerve structure catalogue + sites + composer

**Files:**
- Modify: `src/model/structures.js` — replace the block from the `// ---- SKULL BASE` comment through the `cpa_ataxia` structure (currently ~lines 429–468).
- Modify: `src/model/sites.js` — `PARTS` (lines 26–27), `TERRITORY` (skull-base block lines 98–104), `composeSkullBaseSites` (lines 429–454).
- Test: `test/cranial-nerves.test.js` (Task-2 structure + Task-3 site sections).

**Interfaces:**
- Consumes: the findings from Task 1.
- Produces: skull-base structures whose `part` values are the primitive parts named in the plan header; `composeSkullBaseSites()` returns composite sites with `part` in `{sup_orbital_fissure, cavernous_sinus, orbital_apex, petrous_apex, jugular_foramen, collet_sicard, villaret}`. `SITE_BY_ID` gains `left_/right_skull_base_<primitivePart>` for every primitive part.

- [ ] **Step 1: Write the failing structure/site test** — replace the Task-2 and Task-3 sections of `test/cranial-nerves.test.js` (from `// --- Task 2:` down to the end of the primitive-sites section) with:

```js
// --- Task 2: per-nerve structure catalogue ---
import { STRUCTURES, STRUCTURE_BY_ID } from "../src/model/structures.js";
const baseOf = part => STRUCTURES.filter(s => s.level === "skull_base" && s.part === part).map(s => s.produces).sort();
const eq = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

// facial nerve chain — proximal produces MORE, each distal spares one branch
ok("iam -> VII triad + motor + VIII hearing",
   eq(baseOf("iam"), ["cn7_lmn","lacrimation_loss","hyperacusis","taste_loss","hearing_loss"]));
ok("vii_geniculate -> motor + lacrimation + hyperacusis + taste",
   eq(baseOf("vii_geniculate"), ["cn7_lmn","lacrimation_loss","hyperacusis","taste_loss"]));
ok("vii_tympanic -> motor + hyperacusis + taste (lacrimation SPARED)",
   eq(baseOf("vii_tympanic"), ["cn7_lmn","hyperacusis","taste_loss"]));
ok("vii_mastoid -> motor + taste (hyperacusis SPARED)",
   eq(baseOf("vii_mastoid"), ["cn7_lmn","taste_loss"]));
ok("vii_stylomastoid -> motor only (taste SPARED)", eq(baseOf("vii_stylomastoid"), ["cn7_lmn"]));
ok("vii_parotid -> single branch", eq(baseOf("vii_parotid"), ["facial_weak_branch"]));

// trigeminal divisions
ok("v_ganglion -> V1+V2+V3+jaw", eq(baseOf("v_ganglion"), ["v1_sensory","v2_sensory","v3_sensory","jaw_weakness"]));
ok("v1_division -> V1", eq(baseOf("v1_division"), ["v1_sensory"]));
ok("foramen_rotundum -> V2", eq(baseOf("foramen_rotundum"), ["v2_sensory"]));
ok("v3_ovale -> V3 + jaw", eq(baseOf("v3_ovale"), ["v3_sensory","jaw_weakness"]));
ok("v1_petrous -> V1", eq(baseOf("v1_petrous"), ["v1_sensory"]));

// III divisions + trunk
ok("iii_trunk -> cn3_palsy", eq(baseOf("iii_trunk"), ["cn3_palsy"]));
ok("iii_orbit_sup -> superior division", eq(baseOf("iii_orbit_sup"), ["cn3_superior_div"]));
ok("iii_orbit_inf -> inferior division", eq(baseOf("iii_orbit_inf"), ["cn3_inferior_div"]));

// IV / VI segments
ok("iv_trunk -> cn4", eq(baseOf("iv_trunk"), ["cn4_palsy"]));
ok("trochlear_cisternal -> cn4", eq(baseOf("trochlear_cisternal"), ["cn4_palsy"]));
ok("vi_cisternal -> cn6", eq(baseOf("vi_cisternal"), ["cn6_palsy"]));
ok("vi_petrous_apex -> cn6", eq(baseOf("vi_petrous_apex"), ["cn6_palsy"]));
ok("vi_trunk -> cn6", eq(baseOf("vi_trunk"), ["cn6_palsy"]));

// lower cranial nerves — IX/X split, X distal chain, XI split, XII
ok("ix_jugular -> gag afferent + posterior taste", eq(baseOf("ix_jugular"), ["gag_afferent_loss","taste_posterior"]));
ok("x_jugular -> palate + cords", eq(baseOf("x_jugular"), ["palatal_weakness","vocal_cord_palsy"]));
ok("x_recurrent_laryngeal -> cords only (palate SPARED)", eq(baseOf("x_recurrent_laryngeal"), ["vocal_cord_palsy"]));
ok("xi_jugular -> SCM + trapezius", eq(baseOf("xi_jugular"), ["weak_scm","weak_trapezius"]));
ok("xi_posterior_triangle -> trapezius only (SCM SPARED)", eq(baseOf("xi_posterior_triangle"), ["weak_trapezius"]));
ok("hypoglossal_canal -> XII", eq(baseOf("hypoglossal_canal"), ["cn12_palsy"]));
ok("xii_neck -> XII", eq(baseOf("xii_neck"), ["cn12_palsy"]));
ok("cpa -> VII + hearing + V1 + ataxia", eq(baseOf("cpa"), ["cn7_lmn","hearing_loss","v1_sensory","limb_ataxia"]));
ok("optic_canal -> optic + RAPD", eq(baseOf("optic_canal"), ["optic_neuropathy","rapd"]));
ok("carotid_space -> Horner", eq(baseOf("carotid_space"), ["horner"]));

// hygiene: no crosses override, no gate, all ipsilateral
{
  const base = STRUCTURES.filter(s => s.level === "skull_base");
  ok("no skull_base crosses override", base.every(s => !Object.prototype.hasOwnProperty.call(s, "crosses")));
  ok("no skull_base gate", base.every(s => !s.hemisphere && !s.bilateralOnly));
  ok("cn11_weakness has no producer", !STRUCTURES.some(s => s.produces === "cn11_weakness"));
}

// --- Task 3: primitive sites + composites ---
import { SITE_BY_ID } from "../src/model/sites.js";
for (const p of ["iii_trunk","iii_orbit_sup","iii_orbit_inf","iv_trunk","vi_cisternal","vi_petrous_apex",
  "vi_trunk","v_ganglion","v1_division","v3_ovale","v1_petrous","vii_geniculate","vii_tympanic","vii_mastoid",
  "vii_stylomastoid","vii_parotid","iam","ix_jugular","x_jugular","x_recurrent_laryngeal","xi_jugular",
  "xi_posterior_triangle","xii_neck"])
  ok(`left_skull_base_${p} primitive site exists`, !!SITE_BY_ID[`left_skull_base_${p}`]);
ok("no standalone orbital_sympathetic site", !SITE_BY_ID["left_skull_base_orbital_sympathetic"]);
ok("old bundled left_skull_base_sup_orbital_fissure primitive is gone (now composite via composer)",
   !SITE_BY_ID["left_skull_base_sup_orbital_fissure"]);

import { composeSkullBaseSites } from "../src/model/sites.js";
const comp = composeSkullBaseSites();
const compFindings = (part, side = "left") => {
  const s = comp.find(x => x.part === part && x.side === side);
  return s ? s.structures.map(id => STRUCTURE_BY_ID[id].produces).sort() : null;
};
ok("SOF composite = III+IV+VI+V1+Horner (no V2)",
   eq(compFindings("sup_orbital_fissure"), ["cn3_palsy","cn4_palsy","cn6_palsy","v1_sensory","horner"]));
ok("cavernous composite ADDS V2",
   eq(compFindings("cavernous_sinus"), ["cn3_palsy","cn4_palsy","cn6_palsy","v1_sensory","v2_sensory","horner"]));
ok("orbital apex ADDS optic (+RAPD)",
   eq(compFindings("orbital_apex"), ["cn3_palsy","cn4_palsy","cn6_palsy","v1_sensory","horner","optic_neuropathy","rapd"]));
ok("petrous apex = VI + V1 (Gradenigo)", eq(compFindings("petrous_apex"), ["cn6_palsy","v1_sensory"]));
ok("jugular (Vernet) = IX gag/taste + X palate/cords + XI scm/trap",
   eq(compFindings("jugular_foramen"),
      ["gag_afferent_loss","taste_posterior","palatal_weakness","vocal_cord_palsy","weak_scm","weak_trapezius"]));
ok("collet-sicard ADDS XII",
   eq(compFindings("collet_sicard"),
      ["gag_afferent_loss","taste_posterior","palatal_weakness","vocal_cord_palsy","weak_scm","weak_trapezius","cn12_palsy"]));
ok("villaret ADDS Horner",
   eq(compFindings("villaret"),
      ["gag_afferent_loss","taste_posterior","palatal_weakness","vocal_cord_palsy","weak_scm","weak_trapezius","cn12_palsy","horner"]));
```

- [ ] **Step 2: Run to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cranial-nerves.test.js 2>&1 | tail -20`
Expected: FAIL — many `... site exists` / `... composite` assertions false (structures not re-keyed yet).

- [ ] **Step 3: Replace the skull-base structure block** — in `src/model/structures.js`, replace everything from the `// ---- SKULL BASE (extra-axial cranial nerves; ...` comment through the `cpa_ataxia` structure line (the whole current block, ~lines 429–468) with:

```js
  // ---- SKULL BASE (extra-axial cranial nerves) — the PER-NERVE (nerve, compartment) catalogue ----
  // Two axes from one table: (1) each primitive part is a candidate site, so a spared branch localises
  // distally by the over-prediction penalty (the nerve-segments mechanism, now cranial); (2) the foramen
  // syndromes EMERGE from composeSkullBaseSites unioning the per-nerve parts. Every finding is ipsilateral
  // (CROSSES:false) — no crosses override, no gate, no new forward-model path.

  // III oculomotor — pre-divisional trunk (SOF/cavernous, company localises) then orbital divisions.
  { id: "iii_trunk",     level: "skull_base", part: "iii_trunk",     produces: "cn3_palsy",
    note: "CN III trunk through the cavernous sinus / SOF — company (V2, Horner, other CNs) localises" },
  { id: "iii_orbit_sup", level: "skull_base", part: "iii_orbit_sup", produces: "cn3_superior_div",
    note: "superior division (SR + LPS) — ptosis + failure of elevation" },
  { id: "iii_orbit_inf", level: "skull_base", part: "iii_orbit_inf", produces: "cn3_inferior_div",
    note: "inferior division (MR/IR/IO + parasympathetic) — failed adduction/depression + pupil, ptosis spared" },

  // IV trochlear — nuclear (dorsal midbrain, contralateral) + cisternal already elsewhere; anterior trunk here.
  { id: "iv_trunk",  level: "skull_base", part: "iv_trunk",           produces: "cn4_palsy",
    note: "CN IV anterior trunk (cavernous sinus / SOF)" },
  { id: "cn4_nerve", level: "skull_base", part: "trochlear_cisternal", produces: "cn4_palsy",
    note: "trochlear nerve (IV) — long cisternal course (trauma / microvascular); ipsilateral SO palsy" },

  // VI abducens — cisternal → petrous apex (Dorello, Gradenigo) → anterior trunk (cavernous / SOF).
  { id: "vi_cisternal",    level: "skull_base", part: "vi_cisternal",    produces: "cn6_palsy",
    note: "CN VI subarachnoid / cisternal course" },
  { id: "vi_petrous_apex", level: "skull_base", part: "vi_petrous_apex", produces: "cn6_palsy",
    note: "CN VI at Dorello's canal / petrous apex — with V1 ⇒ Gradenigo via composer" },
  { id: "vi_trunk",        level: "skull_base", part: "vi_trunk",        produces: "cn6_palsy",
    note: "CN VI anterior trunk (cavernous sinus / SOF)" },

  // V trigeminal — root (CPA, below) → ganglion (Meckel: all divisions) → V1 SOF / V2 rotundum / V3 ovale;
  // plus a V1 contribution at the petrous apex for Gradenigo.
  { id: "vg_v1",  level: "skull_base", part: "v_ganglion", produces: "v1_sensory", note: "Gasserian ganglion — V1" },
  { id: "vg_v2",  level: "skull_base", part: "v_ganglion", produces: "v2_sensory", note: "Gasserian ganglion — V2" },
  { id: "vg_v3",  level: "skull_base", part: "v_ganglion", produces: "v3_sensory", note: "Gasserian ganglion — V3" },
  { id: "vg_jaw", level: "skull_base", part: "v_ganglion", produces: "jaw_weakness", note: "Gasserian ganglion — motor V3 (jaw)" },
  { id: "v1_div", level: "skull_base", part: "v1_division", produces: "v1_sensory", note: "ophthalmic division (V1) — SOF contributor" },
  { id: "rot_v2", level: "skull_base", part: "foramen_rotundum", produces: "v2_sensory", note: "maxillary division (V2) — foramen rotundum" },
  { id: "v3_ovale_sens",  level: "skull_base", part: "v3_ovale", produces: "v3_sensory", note: "mandibular (V3) sensory — foramen ovale" },
  { id: "v3_ovale_motor", level: "skull_base", part: "v3_ovale", produces: "jaw_weakness", note: "mandibular (V3) motor — jaw (foramen ovale)" },
  { id: "v1_petrous",     level: "skull_base", part: "v1_petrous", produces: "v1_sensory", note: "V1 at the petrous apex (Meckel) — the Gradenigo trigeminal contribution" },

  // II optic — optic canal (monocular visual loss + RAPD).
  { id: "opt_cn2",  level: "skull_base", part: "optic_canal", produces: "optic_neuropathy",
    note: "optic nerve (II) in the optic canal — monocular visual loss (orbital-apex discriminator)" },
  { id: "opt_rapd", level: "skull_base", part: "optic_canal", produces: "rapd",
    note: "optic nerve (II) — afferent pupillary defect (RAPD), ipsilateral" },

  // Oculosympathetic in the orbital fissure — composite-only (no standalone site; isolated Horner belongs
  // to the Horner-order axis). Contributes Horner to SOF / cavernous / orbital apex.
  { id: "sof_symp", level: "skull_base", part: "orbital_sympathetic", produces: "horner",
    note: "oculosympathetic fibres entering the orbit (SOF / cavernous) — Horner's" },

  // VII facial — meatal (IAM, with VIII) then intratemporal chain; each distal segment spares one branch.
  { id: "iam_vii_motor", level: "skull_base", part: "iam", produces: "cn7_lmn",         note: "IAM — facial motor (VII), before geniculate" },
  { id: "iam_vii_lacr",  level: "skull_base", part: "iam", produces: "lacrimation_loss", note: "IAM — greater petrosal (lacrimation)" },
  { id: "iam_vii_hyper", level: "skull_base", part: "iam", produces: "hyperacusis",      note: "IAM — nerve to stapedius (hyperacusis)" },
  { id: "iam_vii_taste", level: "skull_base", part: "iam", produces: "taste_loss",       note: "IAM — chorda tympani (taste)" },
  { id: "iam_viii",      level: "skull_base", part: "iam", produces: "hearing_loss",     note: "IAM — cochlear nerve (VIII); the meatal-vs-geniculate discriminator" },
  { id: "vii_gen_motor", level: "skull_base", part: "vii_geniculate", produces: "cn7_lmn",         note: "geniculate — motor (Ramsay Hunt)" },
  { id: "vii_gen_lacr",  level: "skull_base", part: "vii_geniculate", produces: "lacrimation_loss", note: "geniculate — greater petrosal (lacrimation)" },
  { id: "vii_gen_hyper", level: "skull_base", part: "vii_geniculate", produces: "hyperacusis",      note: "geniculate — stapedius (hyperacusis)" },
  { id: "vii_gen_taste", level: "skull_base", part: "vii_geniculate", produces: "taste_loss",       note: "geniculate — chorda tympani (taste)" },
  { id: "vii_tym_motor", level: "skull_base", part: "vii_tympanic", produces: "cn7_lmn",     note: "tympanic — motor; greater petrosal already left ⊃ lacrimation SPARED" },
  { id: "vii_tym_hyper", level: "skull_base", part: "vii_tympanic", produces: "hyperacusis", note: "tympanic — stapedius (hyperacusis)" },
  { id: "vii_tym_taste", level: "skull_base", part: "vii_tympanic", produces: "taste_loss",  note: "tympanic — chorda tympani (taste)" },
  { id: "vii_mas_motor", level: "skull_base", part: "vii_mastoid", produces: "cn7_lmn",    note: "mastoid — motor; stapedius already left ⊃ hyperacusis SPARED" },
  { id: "vii_mas_taste", level: "skull_base", part: "vii_mastoid", produces: "taste_loss", note: "mastoid — chorda tympani (taste)" },
  { id: "vii_sty_motor", level: "skull_base", part: "vii_stylomastoid", produces: "cn7_lmn", note: "stylomastoid foramen — pure motor (Bell's palsy site); chorda already left ⊃ taste SPARED" },
  { id: "vii_par_branch", level: "skull_base", part: "vii_parotid", produces: "facial_weak_branch", note: "parotid — single branch, partial hemiface" },

  // CPA — the cerebellopontine angle: VII + VIII + trigeminal root (corneal) + cerebellar compression.
  { id: "cpa_cn7",    level: "skull_base", part: "cpa", produces: "cn7_lmn",     note: "facial nerve (VII) at the CPA" },
  { id: "cpa_cn8",    level: "skull_base", part: "cpa", produces: "hearing_loss", note: "vestibulocochlear (VIII) at the CPA — sensorineural hearing loss (vestibular schwannoma)" },
  { id: "cpa_v1",     level: "skull_base", part: "cpa", produces: "v1_sensory",  note: "trigeminal root (V) at the CPA — reduced corneal reflex" },
  { id: "cpa_ataxia", level: "skull_base", part: "cpa", produces: "limb_ataxia", note: "cerebellar / peduncle compression by a large CPA mass — ipsilateral ataxia" },

  // IX glossopharyngeal — jugular foramen: gag afferent + posterior-third taste.
  { id: "ix_gag",   level: "skull_base", part: "ix_jugular", produces: "gag_afferent_loss", note: "IX — pharyngeal sensation / gag afferent limb" },
  { id: "ix_taste", level: "skull_base", part: "ix_jugular", produces: "taste_posterior",   note: "IX — taste, posterior third of tongue" },

  // X vagus — high (jugular): palate (gag efferent) + cords; distal (recurrent laryngeal): cords only.
  { id: "x_palate", level: "skull_base", part: "x_jugular", produces: "palatal_weakness",  note: "X — palate / uvula (gag efferent), high vagal" },
  { id: "x_vocal",  level: "skull_base", part: "x_jugular", produces: "vocal_cord_palsy",   note: "X — larynx (cords), high vagal" },
  { id: "x_rln",    level: "skull_base", part: "x_recurrent_laryngeal", produces: "vocal_cord_palsy", note: "recurrent laryngeal — hoarseness with palate SPARED (thyroid/aortic/Pancoast)" },

  // XI accessory — jugular (SCM + trapezius, with IX/X) vs posterior triangle (trapezius only).
  { id: "xi_jug_scm",  level: "skull_base", part: "xi_jugular", produces: "weak_scm",       note: "XI at the jugular foramen — sternocleidomastoid" },
  { id: "xi_jug_trap", level: "skull_base", part: "xi_jugular", produces: "weak_trapezius", note: "XI at the jugular foramen — trapezius" },
  { id: "xi_pt_trap",  level: "skull_base", part: "xi_posterior_triangle", produces: "weak_trapezius", note: "XI in the posterior triangle — trapezius; SCM branch already left ⊃ SCM SPARED" },

  // XII hypoglossal — canal (with IX/X/XI ⇒ Collet-Sicard) vs neck (isolated).
  { id: "hyp_cn12",  level: "skull_base", part: "hypoglossal_canal", produces: "cn12_palsy", note: "hypoglossal nerve (XII) in the canal" },
  { id: "xii_neck",  level: "skull_base", part: "xii_neck",          produces: "cn12_palsy", note: "hypoglossal (XII) in the neck (carotid / submandibular) — isolated" },

  // Cervical sympathetic (carotid space) — isolated Horner (carotid dissection); Horner-order axis.
  { id: "car_symp", level: "skull_base", part: "carotid_space", produces: "horner",
    note: "cervical sympathetic chain in the carotid space — isolated Horner's" },
```

- [ ] **Step 4: Update PARTS** — in `src/model/sites.js`, replace the two skull-base lines (26–27):

```js
  "sup_orbital_fissure", "foramen_rotundum", "optic_canal", "jugular_foramen", "hypoglossal_canal",
  "carotid_space", "cpa",
```

with (remove `sup_orbital_fissure` and `jugular_foramen`; add the new primitives):

```js
  "iii_trunk", "iii_orbit_sup", "iii_orbit_inf", "iv_trunk",
  "vi_cisternal", "vi_petrous_apex", "vi_trunk",
  "v_ganglion", "v1_division", "foramen_rotundum", "v3_ovale", "v1_petrous",
  "vii_geniculate", "vii_tympanic", "vii_mastoid", "vii_stylomastoid", "vii_parotid",
  "iam", "cpa", "optic_canal",
  "ix_jugular", "x_jugular", "x_recurrent_laryngeal", "xi_jugular", "xi_posterior_triangle",
  "hypoglossal_canal", "xii_neck", "carotid_space",
```

Note: **do NOT add `trochlear_cisternal`** here — it is already in `PARTS` (line ~37) and `TERRITORY` (line ~156) from the trochlear increment, and its structure `cn4_nerve` (re-declared in Step 3) uses it. Verify with `grep -n 'trochlear_cisternal' src/model/sites.js` before editing.

- [ ] **Step 5: Update TERRITORY** — in `src/model/sites.js`, replace the seven skull-base `TERRITORY` lines (98–104, the `skull_base|sup_orbital_fissure` … `skull_base|cpa` block) with:

```js
  "skull_base|iii_trunk":        "CN III trunk (cavernous sinus / superior orbital fissure)",
  "skull_base|iii_orbit_sup":    "CN III superior division (orbit) — SR + levator",
  "skull_base|iii_orbit_inf":    "CN III inferior division (orbit) — MR/IR/IO + pupil",
  "skull_base|iv_trunk":         "CN IV trunk (cavernous sinus / superior orbital fissure)",
  "skull_base|vi_cisternal":     "CN VI cisternal / subarachnoid course",
  "skull_base|vi_petrous_apex":  "CN VI at Dorello's canal / petrous apex (Gradenigo)",
  "skull_base|vi_trunk":         "CN VI trunk (cavernous sinus / superior orbital fissure)",
  "skull_base|v_ganglion":       "trigeminal (Gasserian) ganglion, Meckel's cave (V1+V2+V3)",
  "skull_base|v1_division":      "ophthalmic division (V1)",
  "skull_base|foramen_rotundum": "foramen rotundum (maxillary division, V2)",
  "skull_base|v3_ovale":         "foramen ovale (mandibular division V3 + motor)",
  "skull_base|v1_petrous":       "V1 at the petrous apex (Meckel) — Gradenigo",
  "skull_base|vii_geniculate":   "facial nerve — geniculate ganglion (Ramsay Hunt)",
  "skull_base|vii_tympanic":     "facial nerve — tympanic segment (lacrimation spared)",
  "skull_base|vii_mastoid":      "facial nerve — mastoid segment (hyperacusis spared)",
  "skull_base|vii_stylomastoid": "facial nerve — stylomastoid foramen (pure motor, Bell's)",
  "skull_base|vii_parotid":      "facial nerve — extracranial / parotid branch",
  "skull_base|iam":              "internal acoustic meatus (VII + VIII) — early acoustic",
  "skull_base|cpa":              "cerebellopontine angle (VII, VIII, V ± cerebellum)",
  "skull_base|optic_canal":      "optic canal (optic nerve, II)",
  "skull_base|ix_jugular":       "glossopharyngeal (IX) at the jugular foramen",
  "skull_base|x_jugular":        "vagus (X) high — palate + larynx",
  "skull_base|x_recurrent_laryngeal": "recurrent laryngeal nerve (X) — isolated hoarseness",
  "skull_base|xi_jugular":       "accessory (XI) at the jugular foramen (SCM + trapezius)",
  "skull_base|xi_posterior_triangle": "accessory (XI) in the posterior triangle of the neck (trapezius)",
  "skull_base|hypoglossal_canal": "hypoglossal canal (XII)",
  "skull_base|xii_neck":         "hypoglossal (XII) in the neck (carotid / submandibular)",
  "skull_base|carotid_space":    "carotid space (cervical sympathetic chain)",
```

- [ ] **Step 6: Update composeSkullBaseSites** — in `src/model/sites.js`, replace the `groups` array inside `composeSkullBaseSites` (lines ~433–442) with:

```js
  const groups = [
    { part: "sup_orbital_fissure", parts: ["iii_trunk", "iv_trunk", "vi_trunk", "v1_division", "orbital_sympathetic"],
      terr: "superior orbital fissure (III, IV, VI, V1, sympathetic)" },
    { part: "cavernous_sinus", parts: ["iii_trunk", "iv_trunk", "vi_trunk", "v1_division", "orbital_sympathetic", "foramen_rotundum"],
      terr: "cavernous sinus (III, IV, V1, V2, VI, sympathetic)" },
    { part: "orbital_apex", parts: ["iii_trunk", "iv_trunk", "vi_trunk", "v1_division", "orbital_sympathetic", "optic_canal"],
      terr: "orbital apex (SOF contents + optic nerve)" },
    { part: "petrous_apex", parts: ["vi_petrous_apex", "v1_petrous"],
      terr: "petrous apex / Dorello's canal (VI + V1) — Gradenigo" },
    { part: "jugular_foramen", parts: ["ix_jugular", "x_jugular", "xi_jugular"],
      terr: "jugular foramen (IX, X, XI)" },
    { part: "collet_sicard", parts: ["ix_jugular", "x_jugular", "xi_jugular", "hypoglossal_canal"],
      terr: "jugular foramen + hypoglossal canal (IX–XII)" },
    { part: "villaret", parts: ["ix_jugular", "x_jugular", "xi_jugular", "hypoglossal_canal", "carotid_space"],
      terr: "retropharyngeal / posterior retroparotid space (IX–XII + sympathetic)" }
  ];
```

Leave the rest of `composeSkullBaseSites` (the `structuresForParts` helper and the loop) unchanged. Update its doc-comment header (lines 421–428) to describe the extended set (SOF/cavernous/orbital-apex/petrous-apex/jugular/collet/villaret; per-nerve primitives now carry the longitudinal axis).

- [ ] **Step 7: Run the structure + site sections green, then the full suite for regression**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cranial-nerves.test.js 2>&1 | grep -E "FAIL" | head`
Expected: no FAIL lines from the Task-2/Task-3 sections. (The localisation sections rewritten in later tasks may still be absent/failing — that is expected until those tasks.)

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/horner-axis.test.js && node test/pupil-efferent.test.js && node test/trochlear.test.js`
Expected: all PASS (these touch pupil/Horner/trochlear parts adjacent to the refactor — verify no regression from the `orbital_sympathetic` / `trochlear_cisternal` changes).

---

## Task 3: VII facial-nerve chain localisation

**Files:**
- Test: `test/cranial-nerves.test.js` (new Task-4 "VII chain" section)

**Interfaces:**
- Consumes: `solve(set)` from `src/engine/inverse.js` — input is a **`Set` of `"finding@side"` string tokens**; returns `{ best: { site: { id, level, part, side }, … }, … }` (winner = `.best.site`). `nameForSite(siteObject)` from `src/data/syndromes.js` takes the **site object** (not a key string) and returns `{ name, note, … }`. This is the exact idiom `nerve-segments.test.js` uses (`solve(new Set([...])).best.site`; `nameForSite(best(set).site).name`) — mirror it.

- [ ] **Step 1: Add the shared solve helpers** — near the top of `test/cranial-nerves.test.js` (after the imports; ensure `solve` and `nameForSite` are each imported exactly once — the file already imports `nameForSite`), add:

```js
import { solve } from "../src/engine/inverse.js";
// examiner records findings on the LEFT body side (tokens are `finding@side`)
const S  = (...ids) => new Set(ids.map(id => id + "@left"));
const SR = (...ids) => new Set(ids.map(id => id + "@right"));
const winId   = set => solve(set).best.site.id;
const winPart = set => solve(set).best.site.part;
const nameOf  = set => { const e = nameForSite(solve(set).best.site); return (e.name || "") + " " + (e.note || ""); };
```

- [ ] **Step 2: Write the failing VII test** — append to `test/cranial-nerves.test.js`:

```js
// --- Task 4: VII facial-nerve chain (branch sparing localises) ---
ok("VII triad + hearing loss -> IAM (early acoustic)",
   winId(S("cn7_lmn","lacrimation_loss","hyperacusis","taste_loss","hearing_loss")) === "left_skull_base_iam");
ok("VII triad + hearing + corneal + ataxia -> CPA (large mass)",
   winId(S("cn7_lmn","lacrimation_loss","hyperacusis","taste_loss","hearing_loss","v1_sensory","limb_ataxia")) === "left_skull_base_cpa");
ok("VII triad, hearing INTACT -> geniculate (Ramsay Hunt)",
   winId(S("cn7_lmn","lacrimation_loss","hyperacusis","taste_loss")) === "left_skull_base_vii_geniculate");
ok("motor + hyperacusis + taste (lacrimation intact) -> tympanic",
   winId(S("cn7_lmn","hyperacusis","taste_loss")) === "left_skull_base_vii_tympanic");
ok("motor + taste (hyperacusis intact) -> mastoid",
   winId(S("cn7_lmn","taste_loss")) === "left_skull_base_vii_mastoid");
ok("motor only -> stylomastoid (Bell's)",
   winId(S("cn7_lmn")) === "left_skull_base_vii_stylomastoid");
ok("single branch -> parotid",
   winId(S("facial_weak_branch")) === "left_skull_base_vii_parotid");
// the phonebook names the teaching eponyms (driven through solve, so geniculate/stylomastoid must WIN)
ok("geniculate names Ramsay Hunt", /ramsay hunt/i.test(nameOf(S("cn7_lmn","lacrimation_loss","hyperacusis","taste_loss"))));
ok("stylomastoid names Bell's", /bell/i.test(nameOf(S("cn7_lmn"))));
```

- [ ] **Step 3: Run to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cranial-nerves.test.js 2>&1 | grep -E "geniculate|tympanic|mastoid|stylomastoid|parotid|IAM|CPA"`
Expected: localisation lines PASS (anatomy from Task 2 already drives them); the two phonebook `names …` lines FAIL (entries added in Task 7). If a localisation line FAILs, debug the anatomy per `superpowers:systematic-debugging` before proceeding (do **not** weaken the assertion).

- [ ] **Step 4: (No implementation here)** The localisation emerges from Task 2 anatomy. Leave the two phonebook assertions failing until Task 7; note them and continue. (If you prefer, move the two `names …` lines into Task 7's step and keep this task fully green now.)

- [ ] **Step 5: Checkpoint** — run the full suite:
Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test 2>&1 | tail -5`
Expected: only the two VII phonebook assertions (deferred to Task 7) fail; all other suites green.

---

## Task 4: Trigeminal divisions, III divisions, VI petrous apex / Gradenigo

**Files:**
- Test: `test/cranial-nerves.test.js` (new Task-5 section)

**Interfaces:**
- Consumes: `solve`, `winId`, `winPart`, `nameOf`, `S` from Task 3.

- [ ] **Step 1: Write the failing test** — append:

```js
// --- Task 5: V divisions, III divisions, VI petrous apex ---
ok("isolated V3 (chin) -> foramen ovale (V3)",
   winId(S("v3_sensory","jaw_weakness")) === "left_skull_base_v3_ovale");
ok("isolated V1 -> V1 division", winId(S("v1_sensory")) === "left_skull_base_v1_division");
ok("isolated V2 -> foramen rotundum", winId(S("v2_sensory")) === "left_skull_base_foramen_rotundum");
ok("all three divisions + jaw -> Gasserian ganglion",
   winId(S("v1_sensory","v2_sensory","v3_sensory","jaw_weakness")) === "left_skull_base_v_ganglion");
ok("III superior division -> iii_orbit_sup",
   winId(S("cn3_superior_div")) === "left_skull_base_iii_orbit_sup");
ok("III inferior division -> iii_orbit_inf",
   winId(S("cn3_inferior_div")) === "left_skull_base_iii_orbit_inf");
ok("VI + V1 (+ intact V2/V3) -> petrous apex (Gradenigo)",
   winPart(S("cn6_palsy","v1_sensory")) === "petrous_apex");
ok("Gradenigo phonebook names it", /gradenigo/i.test(nameOf(S("cn6_palsy","v1_sensory"))));
```

Note: `isolated V1 -> v1_division` assumes the `v1_division` primitive out-scores the SOF/cavernous/orbital-apex composites (which over-predict III/IV/VI) and the CPA (over-predicts VII/VIII/ataxia) on a lone `v1_sensory`. If instead it ties with `v1_petrous` (also pure `v1_sensory`), that is an honest ambiguity — in that case assert `winId(S("v1_sensory"))` is one of `["left_skull_base_v1_division","left_skull_base_v1_petrous"]` rather than forcing one, and note it. Decide by running Step 2.

- [ ] **Step 2: Run to verify current state**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cranial-nerves.test.js 2>&1 | grep -E "division|ganglion|orbit_sup|orbit_inf|petrous|Gradenigo"`
Expected: localisation lines PASS; the Gradenigo `phonebook` line FAILs until Task 7.

- [ ] **Step 3: Debug any red localisation line** — if `VI + V1 -> petrous_apex` does not win (e.g. it ties with a two-site cover of `vi_cisternal` + `v1_petrous`), confirm the `petrous_apex` composite is concatenated in `candidateSites()` (it is, via `composeSkullBaseSites`) and that `v1_petrous` exists. Use `superpowers:systematic-debugging`; do not weaken the test.

- [ ] **Step 4: Checkpoint** — `npm test` tail; only deferred phonebook lines (Tasks 3–4) red.

---

## Task 5: Lower cranial nerves — IX/X gag split, X distal chain, XI split, XII

**Files:**
- Test: `test/cranial-nerves.test.js` (new Task-6 section)

**Interfaces:**
- Consumes: `solve`, `winId`, `winPart`, `S`.

- [ ] **Step 1: Write the failing test** — append:

```js
// --- Task 6: lower cranial nerves (IX/X split, X distal, XI split, XII) ---
ok("hoarseness with palate SPARED -> recurrent laryngeal",
   winId(S("vocal_cord_palsy")) === "left_skull_base_x_recurrent_laryngeal");
ok("hoarseness + palatal droop -> high vagus (x_jugular)",
   winId(S("vocal_cord_palsy","palatal_weakness")) === "left_skull_base_x_jugular");
ok("absent gag + posterior taste, palate INTACT -> IX (glossopharyngeal)",
   winId(S("gag_afferent_loss","taste_posterior")) === "left_skull_base_ix_jugular");
ok("palatal droop + hoarseness, taste/sensation INTACT -> X (not IX)",
   winId(S("palatal_weakness","vocal_cord_palsy")) === "left_skull_base_x_jugular");
ok("trapezius only (SCM spared) -> posterior triangle",
   winId(S("weak_trapezius")) === "left_skull_base_xi_posterior_triangle");
ok("SCM + trapezius (isolated) -> XI at jugular",
   winId(S("weak_scm","weak_trapezius")) === "left_skull_base_xi_jugular");
ok("isolated tongue -> XII neck or canal",
   /xii_neck|hypoglossal_canal/.test(winId(S("cn12_palsy"))));
// full jugular / lower-CN staircase
ok("IX + X + XI together -> jugular foramen (Vernet)",
   winPart(S("gag_afferent_loss","taste_posterior","palatal_weakness","vocal_cord_palsy","weak_scm","weak_trapezius")) === "jugular_foramen");
ok("... adding XII -> Collet-Sicard",
   winPart(S("gag_afferent_loss","taste_posterior","palatal_weakness","vocal_cord_palsy","weak_scm","weak_trapezius","cn12_palsy")) === "collet_sicard");
ok("... adding Horner -> Villaret",
   winPart(S("gag_afferent_loss","taste_posterior","palatal_weakness","vocal_cord_palsy","weak_scm","weak_trapezius","cn12_palsy","horner")) === "villaret");
```

Note: `hoarseness with palate SPARED -> recurrent laryngeal` — both `x_recurrent_laryngeal` and `x_jugular` contain `vocal_cord_palsy`, but `x_jugular` over-predicts `palatal_weakness`, so RLN wins by the over-prediction penalty. Confirm in Step 2. `SCM + trapezius (isolated) -> xi_jugular` — `xi_jugular` matches both while `xi_posterior_triangle` leaves `weak_scm` unexplained; confirm the jugular *primitive* (not the Vernet composite, which over-predicts IX/X) wins.

- [ ] **Step 2: Run to verify**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cranial-nerves.test.js 2>&1 | grep -E "recurrent|vagus|glossopharyngeal|posterior triangle|jugular|Collet|Villaret|tongue"`
Expected: all PASS (anatomy from Task 2 drives them). If the Vernet/Collet/Villaret staircase does not promote correctly, debug the composite `structures` unions in `composeSkullBaseSites` (per systematic-debugging).

- [ ] **Step 3: Checkpoint** — `npm test` tail; only the deferred phonebook lines red.

---

## Task 6: Foramen composites still emerge + laterality mirror

**Files:**
- Test: `test/cranial-nerves.test.js` (new Task-7 section)

**Interfaces:**
- Consumes: `solve`, `winPart`, `S`, `SR` (all from Task 3).

- [ ] **Step 1: Write the test** — append:

```js
// --- Task 7: compartment syndromes still emerge; laterality mirrors ---
ok("SOF picture (no V2) -> superior orbital fissure",
   winPart(S("cn3_palsy","cn4_palsy","cn6_palsy","v1_sensory","horner")) === "sup_orbital_fissure");
ok("adding V2 -> cavernous sinus",
   winPart(S("cn3_palsy","cn4_palsy","cn6_palsy","v1_sensory","v2_sensory","horner")) === "cavernous_sinus");
ok("adding optic -> orbital apex",
   winPart(S("cn3_palsy","cn4_palsy","cn6_palsy","v1_sensory","optic_neuropathy","rapd","horner")) === "orbital_apex");
ok("right-sided VII chain mirrors -> right geniculate",
   solve(SR("cn7_lmn","lacrimation_loss","hyperacusis","taste_loss")).best.site.id === "right_skull_base_vii_geniculate");
ok("right IAM mirrors",
   solve(SR("cn7_lmn","lacrimation_loss","hyperacusis","taste_loss","hearing_loss")).best.site.id === "right_skull_base_iam");
```

- [ ] **Step 2: Run + checkpoint**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cranial-nerves.test.js 2>&1 | grep -E "orbital fissure|cavernous|orbital apex|mirror"`
Expected: all PASS. Then `npm test` tail — only deferred phonebook lines red.

---

## Task 7: Phonebook (syndromes.js) + naming tests

**Files:**
- Modify: `src/data/syndromes.js` — re-point the existing skull-base composite entries (their `level_part` keys are unchanged: `skull_base_sup_orbital_fissure`, `skull_base_cavernous_sinus`, `skull_base_orbital_apex`, `skull_base_jugular_foramen`, `skull_base_collet_sicard`, `skull_base_villaret`, `skull_base_cpa`) and **add** the new primitive-site entries.
- Test: `test/cranial-nerves.test.js` (the phonebook assertions embedded in Tasks 3–6 now go green).

**Interfaces:**
- Produces: `nameForSite("skull_base_<part>")` returns `{ name, note, ddx, red? }` for each new emergent site.

- [ ] **Step 1: Add phonebook entries** — in `src/data/syndromes.js`, add (near the existing skull-base block, ~lines 381–423) new keys. Keep the existing composite entries; add:

```js
  skull_base_iam: {
    name: "Internal acoustic meatus syndrome (early acoustic neuroma)",
    note: "VII lower-motor facial palsy WITH sensorineural hearing loss (VIII) but no corneal loss or ataxia — the meatal segment; hearing loss is what separates it from a purely intratemporal facial palsy (geniculate).",
    ddx: ["Vestibular schwannoma (early, intracanalicular)", "Meningioma", "Epidermoid", "Facial nerve schwannoma"],
    red: "Progressive unilateral sensorineural hearing loss with facial palsy needs an MRI of the IAM/CPA."
  },
  skull_base_vii_geniculate: {
    name: "Geniculate ganglion syndrome (Ramsay Hunt)",
    note: "Facial palsy with reduced lacrimation (greater petrosal), hyperacusis (stapedius) and loss of taste (chorda tympani) — hearing intact, so proximal-intratemporal but distal to the IAM. Herpes zoster oticus adds vesicles.",
    ddx: ["Ramsay Hunt syndrome (herpes zoster oticus)", "Geniculate schwannoma", "Bell's palsy (proximal)"],
    red: "Ramsay Hunt has worse recovery than Bell's — treat zoster early (aciclovir + steroids)."
  },
  skull_base_vii_tympanic: {
    name: "Tympanic-segment facial palsy",
    note: "Facial palsy with hyperacusis and loss of taste but lacrimation SPARED (lesion distal to the greater petrosal) — the middle-ear segment (otitis media, cholesteatoma, iatrogenic).",
    ddx: ["Middle-ear infection / cholesteatoma", "Iatrogenic (mastoid surgery)", "Glomus tympanicum"]
  },
  skull_base_vii_mastoid: {
    name: "Mastoid-segment facial palsy",
    note: "Facial palsy with loss of taste but hyperacusis SPARED (lesion distal to the nerve to stapedius, proximal to where the chorda tympani leaves) — the descending/mastoid segment.",
    ddx: ["Mastoiditis / cholesteatoma", "Temporal-bone fracture", "Facial nerve schwannoma"]
  },
  skull_base_vii_stylomastoid: {
    name: "Stylomastoid (extratemporal) facial palsy — Bell's palsy pattern",
    note: "Pure lower-motor facial weakness of the whole hemiface with taste, hyperacusis and lacrimation all SPARED — the lesion is at/below the stylomastoid foramen (idiopathic Bell's palsy localises here).",
    ddx: ["Bell's palsy (idiopathic)", "Sarcoid / Lyme", "Diabetes"],
    red: "Forehead-SPARING facial weakness is an UPPER-motor (central) lesion, not this — re-examine the forehead."
  },
  skull_base_vii_parotid: {
    name: "Parotid / branch facial palsy",
    note: "Weakness confined to one facial-nerve branch territory (e.g. marginal mandibular — lower lip) rather than the whole hemiface — an extracranial lesion in or beyond the parotid.",
    ddx: ["Parotid tumour", "Facial trauma / laceration", "Iatrogenic (parotidectomy)"]
  },
  skull_base_v_ganglion: {
    name: "Trigeminal (Gasserian) ganglion syndrome",
    note: "Sensory loss across all three divisions (V1+V2+V3) with jaw (motor) weakness — Meckel's cave. Isolated single-division loss localises to that division's foramen instead.",
    ddx: ["Trigeminal schwannoma", "Meningioma", "Perineural tumour spread", "Herpes zoster"]
  },
  skull_base_v3_ovale: {
    name: "Mandibular division (V3) — foramen ovale",
    note: "Chin/jaw sensory loss WITH jaw weakness (V3 is the only division carrying motor) — foramen ovale; the motor component separates it from a V1 or V2 lesion.",
    ddx: ["Perineural spread (e.g. skin SCC)", "Schwannoma", "Numb-chin syndrome (malignancy)"]
  },
  skull_base_iii_orbit_sup: {
    name: "CN III superior-division palsy",
    note: "Ptosis and failure of elevation (levator + superior rectus) with the pupil and adduction/depression spared — a divisional (orbital / anterior) third-nerve lesion, not a complete III palsy."
  },
  skull_base_iii_orbit_inf: {
    name: "CN III inferior-division palsy",
    note: "Failure of adduction/depression with a fixed dilated pupil, ptosis SPARED — the inferior division (MR/IR/IO + parasympathetic) in the orbit."
  },
  skull_base_petrous_apex: {
    name: "Petrous apex syndrome (Gradenigo)",
    note: "Abducens (VI) palsy with ipsilateral trigeminal (V1) pain — Dorello's canal at the petrous apex; classically with otorrhoea/otitis media.",
    ddx: ["Petrous apicitis (complicated otitis media)", "Chondrosarcoma", "Metastasis", "Cholesterol granuloma"],
    red: "Gradenigo's triad after otitis media is a surgical emergency — image the petrous apex."
  },
  skull_base_x_recurrent_laryngeal: {
    name: "Recurrent laryngeal nerve palsy",
    note: "Isolated hoarseness / vocal-cord paresis with an intact palate and preserved gag — a distal vagal lesion below the pharyngeal branches (thyroid surgery, aortic/mediastinal, Pancoast).",
    ddx: ["Thyroid surgery / goitre", "Aortic arch / mediastinal mass", "Pancoast tumour", "Idiopathic"]
  },
  skull_base_ix_jugular: {
    name: "Glossopharyngeal (IX) lesion",
    note: "Absent gag (afferent limb) and loss of taste over the posterior third of the tongue with an INTACT palate — the vagal (efferent) limb is spared, so a pure IX lesion.",
    ddx: ["Glossopharyngeal schwannoma", "Jugular foramen tumour (early)", "Glossopharyngeal neuralgia"]
  },
  skull_base_x_jugular: {
    name: "High vagal (X) lesion",
    note: "Palatal droop / uvular deviation (gag efferent) with hoarseness — a proximal vagal lesion affecting palate AND larynx; taste and pharyngeal sensation (IX) intact.",
    ddx: ["Jugular foramen tumour", "Skull-base metastasis", "Vagal schwannoma"]
  },
  skull_base_xi_posterior_triangle: {
    name: "Spinal accessory (XI) — posterior triangle",
    note: "Trapezius weakness / shoulder droop with the sternocleidomastoid SPARED — a lesion in the posterior triangle of the neck distal to the SCM branch (e.g. lymph-node biopsy).",
    ddx: ["Iatrogenic (cervical lymph-node biopsy / dissection)", "Trauma", "Schwannoma"]
  },
  skull_base_xi_jugular: {
    name: "Spinal accessory (XI) — proximal",
    note: "Sternocleidomastoid AND trapezius weakness; when accompanied by IX/X it localises to the jugular foramen (Vernet)."
  },
  skull_base_xii_neck: {
    name: "Hypoglossal (XII) — neck",
    note: "Isolated tongue deviation/wasting toward the weak side from an extracranial lesion (carotid, submandibular)."
  },
```

If any existing composite entry's `note` still says "IX/X … reduced gag (bulbar)" using `cn_bulbar`, update the wording to the granular IX/X picture (gag afferent + posterior taste + palate + cords) so the phonebook prose matches the model — but the **keys stay the same**.

- [ ] **Step 2: Verify the naming assertions pass** — the phonebook assertions embedded in Tasks 3–4 (`names Ramsay Hunt`, `names Bell's`, `Gradenigo`) now go green.

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cranial-nerves.test.js 2>&1 | grep -E "Ramsay|Bell|Gradenigo"`
Expected: PASS.

- [ ] **Step 3: Full suite green**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test 2>&1 | tail -5`
Expected: `... passed, 0 failed` for every suite; the aggregate exits 0.

---

## Task 8: Regression sweep, docs, artifacts, memory

**Files:**
- Modify: `CONTRIBUTING.md` (mark the increment done in the roadmap / "Next" section), `README.md` (assertion count if it quotes one).
- Modify: `docs/artifacts/architecture.html`, `docs/artifacts/anatomy-model.html` (add the per-nerve course region).
- Modify: memory `MEMORY.md` pointer + `neurolocaliser-engine-state.md` (record the new region, updated assertion/suite totals).

- [ ] **Step 1: Full aggregate green**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test 2>&1 | grep -E "passed, [0-9]+ failed" | awk '{p+=$1; f+=$3} END {print "SUITES:", NR, "PASSED:", p, "FAILED:", f}'`
Expected: `FAILED: 0`, SUITES = 30, PASSED = the new higher total.

- [ ] **Step 2: Update CONTRIBUTING roadmap** — move the cranial-nerve peripheral-course item from "Next"/deferred to done, referencing this spec/plan. Note remaining deferrals (peripheral vestibular apparatus; IX/X autonomic detail; proptosis/chemosis; cause weighting) from the spec's "Out of scope".

- [ ] **Step 3: Sync the two Artifacts** — add a "cranial-nerve peripheral course" region to `docs/artifacts/anatomy-model.html` (the per-nerve segment chains) and, if the flow diagram enumerates regions, to `docs/artifacts/architecture.html`. Verify statically (the in-app browser cannot render file://). Ask the user to view and re-publish to the same URLs per `docs/artifacts` workflow.

- [ ] **Step 4: Update memory** — edit `neurolocaliser-engine-state.md` to add the cranial-nerve peripheral-course region (VII 6-level chain; V divisions incl. V3/ovale; III divisions; VI petrous apex/Gradenigo; IX/X gag afferent-vs-efferent split + X distal RLN chain; XI SCM-vs-trapezius; XII canal-vs-neck; IAM-vs-CPA), the new assertion/suite totals, and that `cn11_weakness` was replaced by `weak_scm`/`weak_trapezius`. Update the `MEMORY.md` one-line pointer.

---

## Self-review notes (already reconciled)

- **Meatal vs geniculate** modelled by the shared `iam` primitive part (VII+VIII), a nested subset of `cpa` — no redundant VII-only meatal site, so no tie. IAM wins only when hearing loss is present.
- **Isolated IV / VI / trunk** findings tie across their compartments by design (isolated palsy is non-localising); the compartment company localises. Tests avoid asserting a single winner for a bare `cn4_palsy`/`cn6_palsy`.
- **`cn_bulbar` retained** for the motor-unit (diffuse bulbar palsy) contexts only; the jugular skull-base sites use the granular IX/X findings. No motor-unit structure changes.
- **`orbital_sympathetic`** is composite-only (not in `PARTS`) so isolated Horner still resolves on the existing Horner-order axis — Task 2 Step 7 explicitly re-runs `horner-axis.test.js`.

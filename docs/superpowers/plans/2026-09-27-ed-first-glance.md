# ED first glance — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status: IMPLEMENTED (2026-09-29)** — see the execution log at the end. Spec: `docs/superpowers/specs/2026-09-27-ed-first-glance-design.md` (owner-approved 2026-09-27).

**Goal:** make the first glance usable for ED testers — one answer card (Where / Why / What / Next + red flag) with the detail closed below, and an examination tree that leads with plain words, shows common findings first, and opens follow-ups under a ticked finding.

**Architecture:** four new pure/content modules (`app/plain-labels.js`, `app/follow-ups.js`, `app/synonyms.js`, `app/answer.js`), one engine function (`whyClues()` in `src/engine/why.js`), one helper in `app/sides.js`, one field on `plainSiteName()`, then two DOM tasks in `app/app.js` + `app/index.html`. Nothing in the engine's localisation, ranking or clinical tables changes.

**Tech Stack:** zero-dependency Node ES modules, no build step; tests are standalone scripts (`ok(label, cond)`, `process.exit`); the app is static HTML served by `app/serve.mjs`.

**THIS PLAN WAS PROTOTYPED BEFORE IT WAS WRITTEN (2026-09-27).** Every code block below was run in a scratch copy of the repo: the full suite passed (exit 0, 7003 assertions), and Tasks 7–8 were driven in the browser at desktop and 375px, light and dark. The prototype caught five defects that are already fixed in the code here — see "Prototype findings" at the end. Transcribe the code as given; if something does not match the repo, stop and report rather than improvise.

## Global Constraints

- **Node is not on PATH on this Mac.** Prefix every command: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test` / `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/<name>.test.js`.
- **Zero dependencies, no build step, ES modules** (`"type": "module"`). Do not add packages.
- **Tests first.** Each new suite is a standalone script with the local `ok()` helper; add it to `package.json`'s `test` script (the command is given in each task).
- **Content files import no UI**; pure modules are DOM-free; only `app/app.js` touches the DOM.
- **The case URL is the case.** Nothing in `VIEW` (open sections, "Symptoms on") may enter `S` or `encodeCase()`. Jump links must never let the browser rewrite the hash.
- **`--terra` allowlist** (`test/brand.test.js`): add NO new terracotta rule. The answer card reuses `.out-head`, which is already allowlisted.
- **Contrast** (`test/contrast.test.js`): any rule setting both `background` and `color` must use palette tokens that clear 4.5:1 — the CSS here uses only pairs that already pass.
- **Every `combinedSites()` call in `app/app.js` passes 3 arguments** (`test/combined-sites.test.js` scans the source).
- **Clinical content is the owner's.** Tasks 2, 3 and 4 each end at a REVIEW GATE: stop, show the owner the file, apply their changes, and do not start the next task until they approve. One round at a time.
- **Copy rules from the spec:** plain labels are comma-free and at most 40 characters; the Next line is the referral **verbatim, never truncated**; nothing is authored per site.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Work on branch `feat/ed-first-glance`.

## File map

| File | Task | Responsibility |
|---|---|---|
| `src/engine/why.js` | 1 | `whyClues(chain, observedSet, opts)` — the fewest entered findings that pin the place |
| `test/why.test.js` | 1 | clue cases + invariants over 85 vignettes and 365 site pictures |
| `app/plain-labels.js` | 2 | `PLAIN` (label, note, less) for all 234 findings; `plainLabel()` — **owner review round 1** |
| `app/follow-ups.js` | 3 | `FOLLOW_UPS`, `GROUP_OF`, `followUpLayout()` — **owner review round 2** |
| `app/synonyms.js` | 4 | `SYNONYMS`, `synonymHits()` — **owner review round 3** |
| `app/sides.js` | 5 | `tokensForRow(finding, defaultSide)` |
| `app/labels.js` | 6 | `plainSiteName()` gains `place` |
| `app/answer.js` | 6 | `whereLine`, `whySentence`, `whatLine`, `resolveNext`, `answerFor` |
| `app/app.js`, `app/index.html` | 7, 8 | the answer card, closed detail, phone strip; the exam rows, follow-ups, onset/side row, search |
| `package.json`, `app/brand.js`, `CLAUDE.md` | 9 | v0.10.0, docs |

---

### Task 1: `whyClues()` — the Why line's key clues

**Files:**
- Modify: `src/engine/why.js` (append at end of file)
- Test: `test/why.test.js`

**Interfaces:**
- Consumes: `whyChain(observedSet, site, opts)` → `{ steps, meet: { stations, sides }, verdict, station }` (exists); `differential()`, `stationOf()`, `renderWhere()` (already imported/defined in `why.js`).
- Produces: `whyClues(chain, observedSet, opts)` → `{ verdict: "one"|"several"|"none", reached: boolean, more: number, clues: [{ finding, side: "left"|"right"|"bilateral"|null, relation, tokens }], meet, where: string }`. Task 6 renders it.

- [ ] **Step 1: Write the failing test**

In `test/why.test.js`, change the import line

```js
import { whyChain, renderWhere } from "../src/engine/why.js";
```

to

```js
import { whyChain, renderWhere, whyClues } from "../src/engine/why.js";
import { readFileSync } from "node:fs";
```

and insert this block immediately BEFORE the final line `console.log(`\nintegrated why: ${pass} passed, ${fail} failed`);`:

```js
// ---- 4: the Why line's key clues (spec 2026-09-27 §4) ----
// The vignettes are the owner-reviewed bedside cases; they are read from their own suite rather than copied.
const VIGNETTES = [...readFileSync(new URL("./clinical-vignettes.test.js", import.meta.url), "utf8")
  .matchAll(/^\s*\["([^"]+)",\s*"([^"]+)"/gm)].map(m => ({ label: m[1], tokens: m[2].split(/\s+/) }));
const cluesOf = toks => {
  const obs = new Set(toks), opts = { dominantSide: "left" };
  const site = solve(obs, opts).display[0].site;
  return whyClues(whyChain(obs, site, opts), obs, opts);
};
const said = w => w.clues.map(c => (c.side ? c.side + " " : "") + c.finding).join(" + ");
const vig = label => VIGNETTES.find(v => v.label === label).tokens;
{
  ok(`the vignettes were read (${VIGNETTES.length})`, VIGNETTES.length >= 80, String(VIGNETTES.length));
  const expect = {
    "Weber": "left weak_adduction + right weak_arm",
    "Wallenberg (with dysphagia)": "left face_pain_loss + left dysphagia + right spinothalamic",
    "Medial medullary (Dejerine)": "left cn12_palsy + right weak_arm",
    "Brown-Sequard": "left weak_leg + right spinothalamic",
    "Complete dominant MCA": "speech_nonfluent + right homonymous_hemianopia",
    "CN III compressive (pupil involved)": "left fixed_dilated_pupil + left ptosis",
    "Guillain-Barré (symmetric LMN + areflexia)": "bilateral lmn_weakness + bilateral reflex_knee_loss",
    "L5 radiculopathy": "left sensory_l5",
  };
  for (const [label, want] of Object.entries(expect)) ok(`clues — ${label}: ${want}`, said(cluesOf(vig(label))) === want, said(cluesOf(vig(label))));
  const gbs = cluesOf(vig("Guillain-Barré (symmetric LMN + areflexia)"));
  ok("a finding entered on both sides is one clue, with no side relation", gbs.clues.every(c => c.side === "bilateral" && c.relation === "both"));
  ok("L5 alone: several places, and the clue says so", cluesOf(vig("L5 radiculopathy")).verdict === "several");
  const none = whyClues({ verdict: "none", steps: [], meet: { stations: [], sides: [] } }, new Set());
  ok("no single place: no clues", none.verdict === "none" && none.clues.length === 0);
}
{
  const bad = [], tooMany = [], notEntered = [];
  for (const v of VIGNETTES) {
    const w = cluesOf(v.tokens);
    if (!w.reached) bad.push(v.label);
    if (w.clues.length > 3) tooMany.push(v.label);
    if (w.clues.some(c => c.tokens.some(t => !v.tokens.includes(t)))) notEntered.push(v.label);
  }
  ok("every vignette's clues narrow to the answer's place", bad.length === 0, bad.join(", "));
  ok("never more than 3 clues shown", tooMany.length === 0, tooMany.join(", "));
  ok("every clue is a finding the clinician entered", notEntered.length === 0, notEntered.join(", "));
}
{
  // Every site's own complete picture: the clues reach that place, and a one-sided clue set never hides the
  // crossed half. 365 pictures; about three seconds.
  const bad = [], halfCrossed = [];
  for (const s of cs) {
    let E; try { E = new Set(expectedFindings(s, { dominantSide: "left" })); } catch { continue; }
    if (!E.size) continue;
    const chain = whyChain(E, s, { dominantSide: "left" });
    const w = whyClues(chain, E, { dominantSide: "left" });
    if (!w.reached) bad.push(s.id);
    const oneSided = chain.steps.filter(x => !(E.has(`${x.finding}@left`) && E.has(`${x.finding}@right`)));
    const crossed = oneSided.some(x => x.relation === "same") && oneSided.some(x => x.relation === "opposite");
    const kinds = ["same", "opposite"].filter(k => w.clues.some(c => c.relation === k)).length;
    if (crossed && kinds === 1 && w.clues.length < 3) halfCrossed.push(s.id);
  }
  ok("every site's own picture: the clues reach its place", bad.length === 0, bad.slice(0, 8).join(", "));
  ok("a crossed picture never shows only one side in its clues", halfCrossed.length === 0, halfCrossed.slice(0, 8).join(", "));
}
```

- [ ] **Step 2: Run it to verify it fails**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/why.test.js
```
Expected: FAIL — `whyClues` is not exported (SyntaxError: The requested module does not provide an export named 'whyClues').

- [ ] **Step 3: Implement**

Append to the END of `src/engine/why.js`:

```js
// ---- the Why line's key clues (spec 2026-09-27 §4) ----
// The fewest entered findings that, ON THEIR OWN, narrow the differential to the place the whole picture meets
// at. Chosen against the SAME explain-all differential the Where card uses — not against each finding's "could
// arise at" stations, which stalled on 12 of 249 single-place answers (a brachial-plexus cord: each finding
// could be plexus or nerve, but no single nerve carries both, and only the differential sees that).
// Returns data, not prose: app/answer.js words it with the plain labels.
export function whyClues(chain, observedSet, opts = {}) {
  if (chain.verdict === "none") return { verdict: "none", clues: [], more: 0, reached: true, meet: chain.meet, where: "" };
  // One unit per FINDING. Entered on both sides it is ONE "bilateral" clue with no side relation — split, the
  // known-negative rule would read one side alone as the other side confirmed normal.
  const units = [];
  for (const s of chain.steps) {
    const u = units.find(x => x.finding === s.finding);
    if (u) {
      u.tokens.push(s.token);
      if (u.tokens.some(t => t.endsWith("@left")) && u.tokens.some(t => t.endsWith("@right"))) { u.side = "bilateral"; u.relation = "both"; }
      continue;
    }
    units.push({ finding: s.finding, tokens: [s.token], order: s.order, relation: s.relation,
      side: s.bodySide === "left" || s.bodySide === "right" ? s.bodySide : null });
  }
  const memo = new Map();
  const placesOf = toks => {
    const key = [...toks].sort().join(" ");
    if (!memo.has(key)) {
      const fit = differential(new Set(toks), opts).filter(c => c.n === toks.length);
      memo.set(key, [...new Set(fit.map(c => `${stationOf(c.site)}|${c.site.side}`))]);
    }
    return memo.get(key);
  };
  const target = placesOf(units.flatMap(u => u.tokens));
  const within = p => p.length > 0 && p.every(x => target.includes(x));
  // Ties go first to a side relation the chosen clues do not show yet (so a crossed picture shows both halves),
  // then to the finding the clinician entered first — measured against station count, entry order gave the more
  // natural clue (Weber: arm weakness, not forehead sparing; compressive CN III: ptosis, not weak elevation).
  const fresh = (u, chosen) => chosen.length > 0 && !chosen.some(c => c.relation === u.relation);
  const better = (u, p, b, bp, chosen) => {
    if (p.length !== bp.length) return p.length < bp.length;
    if (fresh(u, chosen) !== fresh(b, chosen)) return fresh(u, chosen);
    return u.order < b.order;
  };
  const chosen = [], pool = [...units];
  let cur = [];
  while (pool.length) {
    let best = null, bp = null;
    for (const u of pool) {
      const p = placesOf([...chosen, u].flatMap(x => x.tokens));
      if (p.length && (!best || better(u, p, best, bp, chosen))) { best = u; bp = p; }
    }
    if (!best) break;
    chosen.push(best); cur = bp; pool.splice(pool.indexOf(best), 1);
    if (within(cur)) break;
  }
  const reached = within(cur);
  // Crossed completion: clues that show ONE side get the other side's first finding, so Wallenberg reads
  // "… + right body pain loss". Clues that show no side at all are left alone — a whole-MCA picture is pinned by
  // "impaired repetition" by itself, and adding sides to it would be noise.
  const kinds = ["same", "opposite"].filter(k => chosen.some(c => c.relation === k));
  if (kinds.length === 1 && chosen.length < 3) {
    const other = units.find(u => u.relation === (kinds[0] === "same" ? "opposite" : "same"));
    if (other) chosen.push(other);
  }
  const shown = chosen.slice(0, 3);
  return {
    verdict: chain.verdict, reached, more: chosen.length - shown.length,
    clues: shown.map(u => ({ finding: u.finding, side: u.side, relation: u.relation, tokens: u.tokens })),
    meet: chain.meet, where: renderWhere(chain.meet.stations),
  };
}
```

- [ ] **Step 4: Run it to verify it passes**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/why.test.js
```
Expected: `integrated why: 49 passed, 0 failed` (the sweep over 365 site pictures takes about 3 s).

- [ ] **Step 5: Commit**

```bash
git add src/engine/why.js test/why.test.js
git commit -m "feat: whyClues — the fewest findings that pin the place

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Plain labels for all 234 findings — REVIEW ROUND 1

**Files:**
- Create: `app/plain-labels.js`
- Create: `test/plain-labels.test.js`
- Modify: `package.json` (test script)

**Interfaces:**
- Produces: `PLAIN[findingId] = { label, note?, less? }`; `plainLabel(findingId)` → string (the label, or the id with underscores as spaces). Consumed by Tasks 3 (indirectly), 6, 7, 8.

- [ ] **Step 1: Write the failing test** — create `test/plain-labels.test.js`:

```js
// plain-labels.test.js — every finding in plain words (spec 2026-09-27 §5.1). The labels are clinical content
// for the owner's review; this suite holds the mechanical floor under them.
import { PLAIN, plainLabel } from "../app/plain-labels.js";
import { FINDINGS } from "../src/model/findings.js";
import { EXAM_TREE } from "../app/exam-map.js";

let pass = 0, fail = 0;
const ok = (l, c, d = "") => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l + (c ? "" : `  ${d}`)); };

const ids = Object.keys(FINDINGS);
const missing = ids.filter(f => !PLAIN[f]);
const extra = Object.keys(PLAIN).filter(f => !FINDINGS[f]);
ok(`every finding has a plain label (${ids.length})`, missing.length === 0, missing.join(", "));
ok("no label names a finding that does not exist", extra.length === 0, extra.join(", "));

// It reads mid-sentence after a side word ("right body pain loss"), so: no ids, no full stops, and short.
const CAP = 40;
const bad = Object.entries(PLAIN).filter(([, p]) =>
  typeof p.label !== "string" || !p.label.trim() || p.label.includes("_") || p.label.includes(",") || p.label.endsWith(".") || p.label.length > CAP);
// No commas: the "Less common" summary lists labels comma-separated, and "taste loss, front of tongue" read as two.
ok(`every label is plain, comma-free, unpunctuated and at most ${CAP} characters`, bad.length === 0, bad.map(([f, p]) => `${f}: "${p.label}"`).join(" | "));
const badNote = Object.entries(PLAIN).filter(([, p]) => p.note !== undefined && (typeof p.note !== "string" || !p.note.trim() || p.note.includes("_") || p.note.length > CAP));
ok("every note is plain and short", badNote.length === 0, badNote.map(([f]) => f).join(", "));
ok("less is a boolean where present", Object.values(PLAIN).every(p => p.less === undefined || p.less === true));

// Two findings sharing a label would make two chips read the same.
const seen = new Map(), dups = [];
for (const [f, p] of Object.entries(PLAIN)) {
  const k = p.label.toLowerCase();
  if (seen.has(k)) dups.push(`${seen.get(k)} / ${f}: "${p.label}"`); else seen.set(k, f);
}
ok("no two findings share a label", dups.length === 0, dups.join(" | "));

// "Less common" must never empty a group: every leaf group keeps at least one row on show.
const leaves = [];
const walk = (n, path) => { if (n.findings) leaves.push({ path: path + n.label, findings: n.findings }); (n.groups || []).forEach(g => walk(g, path + n.label + " › ")); };
EXAM_TREE.forEach(n => walk(n, ""));
const empty = leaves.filter(g => g.findings.every(f => PLAIN[f] && PLAIN[f].less)).map(g => g.path);
ok(`every exam group keeps a common finding on show (${leaves.length} groups)`, empty.length === 0, empty.join(", "));

// The strict vocabulary (owner, 2026-09-25) is carried by the row note, not the label.
ok("arm and leg weakness are marked upper motor neuron on the row",
   PLAIN.weak_arm.note === "upper motor neuron pattern" && PLAIN.weak_leg.note === "upper motor neuron pattern");
ok("floppy weakness is marked lower motor neuron on the row", PLAIN.lmn_weakness.note === "lower motor neuron pattern");
ok("the Why line's labels stay short (arm weakness, face pain loss, swallowing difficulty)",
   plainLabel("weak_arm") === "arm weakness" && plainLabel("face_pain_loss") === "face pain loss" && plainLabel("dysphagia") === "swallowing difficulty");
ok("an unlabelled id degrades to readable words", plainLabel("zz_not_a_finding") === "zz not a finding");

console.log(`\nplain labels: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run it to verify it fails**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/plain-labels.test.js
```
Expected: FAIL — `Cannot find module '.../app/plain-labels.js'`.

- [ ] **Step 3: Create `app/plain-labels.js`** (the draft labels, for the owner's review):

```js
// plain-labels.js — every finding in plain words (spec 2026-09-27 §5.1). CONTENT ONLY: imports nothing, so a
// clinician reviews one file.
//
// `label` — a short noun phrase that reads mid-sentence after a side word ("right body pain loss"). Used by the
//   exam rows, the entered-finding chips, the answer card's Why line and the search.
// `note`  — a qualifier shown on the exam ROW only. It carries the strict vocabulary where a finding is chosen
//   (owner ruling 2026-09-25: arm/leg weakness mean PYRAMIDAL weakness) without lengthening the Why line.
// `less`  — less common in ED: the row sits behind its group's "Less common (n)" disclosure. Search still finds
//   it, and an entered one is always shown.
//
// REVIEW STATUS: ⚠ AWAITING CLINICAL REVIEW (round 1 of 3, spec 2026-09-27 §8).
export const PLAIN = {
  // ---- Higher function › Frontal ----
  executive_dysfunction: { label: "poor planning and sequencing" },
  abulia: { label: "apathy and reduced drive" },
  disinhibition: { label: "disinhibition" },
  limb_apraxia: { label: "limb apraxia", less: true },
  alien_limb: { label: "alien limb", less: true },
  gait_apraxia: { label: "magnetic frontal gait", less: true },
  callosal_apraxia: { label: "left-hand apraxia to command", less: true },
  // ---- Higher function › Parietal ----
  neglect: { label: "neglect of one side" },
  anosognosia: { label: "unaware of the deficit" },
  constructional_apraxia: { label: "can't copy a drawing", less: true },
  dressing_apraxia: { label: "dressing apraxia", less: true },
  ideomotor_apraxia: { label: "can't mime tool use", less: true },
  agraphia: { label: "can't write", less: true },
  acalculia: { label: "can't calculate", less: true },
  finger_agnosia: { label: "can't name fingers", less: true },
  left_right_disorientation: { label: "left-right confusion", less: true },
  optic_ataxia: { label: "misreaching under vision", less: true },
  oculomotor_apraxia: { label: "can't direct gaze to targets", less: true },
  simultanagnosia: { label: "sees one object at a time", less: true },
  tactile_anomia: { label: "left-hand tactile anomia", less: true },
  // ---- Higher function › Temporal ----
  verbal_memory_impairment: { label: "poor verbal memory" },
  nonverbal_memory_impairment: { label: "poor non-verbal memory", less: true },
  amnesia: { label: "can't form new memories" },
  hallucinations: { label: "hallucinations" },
  mood_change: { label: "episodic mood change", less: true },
  cortical_deafness: { label: "cortical deafness", less: true },
  kluver_bucy: { label: "Klüver-Bucy syndrome", less: true },
  // ---- Higher function › Occipital ----
  visual_agnosia: { label: "can't recognise objects seen", less: true },
  achromatopsia: { label: "cerebral colour blindness", less: true },
  prosopagnosia: { label: "can't recognise faces", less: true },
  alexia_without_agraphia: { label: "can't read but can write", less: true },
  cortical_blindness: { label: "cortical blindness" },
  // ---- Speech & language ----
  speech_nonfluent: { label: "non-fluent speech" },
  comprehension_impaired: { label: "poor comprehension" },
  repetition_impaired: { label: "impaired repetition" },
  naming_impaired: { label: "word-finding difficulty" },
  motor_dysprosody: { label: "flat monotone speech", less: true },
  sensory_dysprosody: { label: "can't read emotional tone", less: true },
  dysarthria: { label: "slurred speech" },
  ataxic_dysarthria: { label: "scanning (ataxic) speech", less: true },
  emotional_lability: { label: "uncontrolled laughing or crying", less: true },
  // ---- Consciousness & arousal ----
  reduced_consciousness: { label: "reduced consciousness" },
  preserved_vertical_gaze: { label: "only vertical eye movements left", less: true },
  extensor_posturing: { label: "extensor posturing" },
  // ---- Cranial nerves › I ----
  anosmia: { label: "loss of smell" },
  // ---- Cranial nerves › II ----
  optic_neuropathy: { label: "loss of vision in one eye" },
  central_scotoma: { label: "central blind spot", less: true },
  altitudinal_defect: { label: "altitudinal field loss", less: true },
  rapd: { label: "RAPD" },
  homonymous_hemianopia: { label: "half-field loss" },
  superior_quadrantanopia: { label: "upper quadrant field loss", less: true },
  inferior_quadrantanopia: { label: "lower quadrant field loss", less: true },
  bitemporal_hemianopia: { label: "bitemporal field loss" },
  macular_sparing: { label: "central vision spared", less: true },
  // ---- Cranial nerves › Acuity & fundoscopy ----
  va_reduced_no_pinhole: { label: "poor acuity not helped by pinhole" },
  va_reduced_pinhole_corrects: { label: "poor acuity corrected by pinhole" },
  papilloedema: { label: "papilloedema" },
  optic_atrophy: { label: "pale optic disc", less: true },
  retinal_pallor: { label: "pale retina with cherry-red spot", less: true },
  // ---- Cranial nerves › III / IV / VI ----
  ptosis: { label: "droopy eyelid" },
  weak_adduction: { label: "eye won't turn in" },
  weak_abduction: { label: "eye won't turn out" },
  weak_elevation: { label: "eye won't look up" },
  weak_depression: { label: "eye won't look down" },
  vertical_diplopia: { label: "vertical double vision" },
  gaze_deviation: { label: "eyes deviated to one side" },
  nystagmus_gaze_evoked: { label: "gaze-evoked nystagmus" },
  nystagmus_downbeat: { label: "downbeat nystagmus", less: true },
  nystagmus_upbeat: { label: "upbeat nystagmus", less: true },
  nystagmus_pendular: { label: "pendular nystagmus", less: true },
  // ---- Cranial nerves › V ----
  v1_sensory: { label: "numb forehead or eye (V1)", less: true },
  v2_sensory: { label: "numb cheek (V2)", less: true },
  v3_sensory: { label: "numb jaw or chin (V3)", less: true },
  face_pain_loss: { label: "face pain loss" },
  face_touch_loss: { label: "face touch loss" },
  face_sensory_loss: { label: "face numbness", note: "thalamic pattern" },
  jaw_weakness: { label: "weak jaw", less: true },
  // ---- Cranial nerves › VII ----
  facial_weakness: { label: "face droop" },
  forehead_spared: { label: "forehead spared", note: "upper motor neuron pattern" },
  forehead_involved: { label: "forehead weak too", note: "lower motor neuron pattern" },
  facial_weak_branch: { label: "one facial branch weak", less: true },
  lacrimation_loss: { label: "dry eye", less: true },
  hyperacusis: { label: "loud sounds uncomfortable", less: true },
  taste_loss: { label: "front-of-tongue taste loss", less: true },
  gustatory_loss: { label: "central taste loss", less: true },
  // ---- Cranial nerves › VIII ----
  hearing_loss: { label: "hearing loss" },
  cn8_vertigo: { label: "vertigo" },
  nystagmus_peripheral: { label: "peripheral-type nystagmus" },
  head_impulse_abnormal: { label: "abnormal head impulse" },
  nystagmus_positional_posterior: { label: "posterior-canal positional nystagmus" },
  nystagmus_positional_horizontal: { label: "horizontal-canal positional nystagmus", less: true },
  nystagmus_positional_anterior: { label: "anterior-canal positional nystagmus", less: true },
  // ---- Cranial nerves › IX–XII ----
  dysphagia: { label: "swallowing difficulty" },
  gag_afferent_loss: { label: "absent gag with numb throat", less: true },
  taste_posterior: { label: "back-of-tongue taste loss", less: true },
  palatal_weakness: { label: "weak palate", less: true },
  vocal_cord_palsy: { label: "hoarse voice" },
  weak_scm: { label: "weak head turn", less: true },
  weak_trapezius: { label: "weak shoulder shrug", less: true },
  cn12_palsy: { label: "tongue weakness" },
  // ---- Brainstem & pupils › Gaze ----
  gaze_palsy: { label: "horizontal gaze palsy" },
  ino: { label: "INO" },
  vertical_gaze_palsy: { label: "up-gaze palsy", less: true },
  skew_deviation: { label: "skew deviation" },
  lid_retraction: { label: "lid retraction", less: true },
  nystagmus_convergence_retraction: { label: "convergence-retraction nystagmus", less: true },
  // ---- Brainstem & pupils › Pupils ----
  fixed_dilated_pupil: { label: "fixed dilated pupil" },
  light_near_dissociation: { label: "light-near dissociation", less: true },
  miosis: { label: "small pupil" },
  anhidrosis_face: { label: "no sweating on the face", less: true },
  anhidrosis_body: { label: "no sweating on one side of the body", less: true },
  // ---- Motor › By limb ----
  weak_arm: { label: "arm weakness", note: "upper motor neuron pattern" },
  weak_leg: { label: "leg weakness", note: "upper motor neuron pattern" },
  weak_hand: { label: "hand weakness", note: "isolated hand or fingers" },
  proximal_weakness: { label: "proximal weakness", note: "both sides, limb-girdle" },
  distal_motor_weakness: { label: "distal weakness", note: "both sides, length-dependent" },
  lmn_weakness: { label: "floppy weakness", note: "lower motor neuron pattern" },
  weak_diaphragm: { label: "weak diaphragm", less: true },
  // ---- Motor › By myotome ----
  weak_shoulder_abduction: { label: "weak shoulder abduction" },
  weak_shoulder_external_rotation: { label: "weak shoulder external rotation", less: true },
  weak_scapular_stabilisation: { label: "scapular winging", less: true },
  weak_elbow_flexion: { label: "weak elbow flexion" },
  weak_elbow_extension: { label: "weak elbow extension" },
  weak_forearm_supination: { label: "weak supination", less: true },
  weak_forearm_pronation: { label: "weak pronation", less: true },
  weak_wrist_extension: { label: "wrist drop" },
  weak_wrist_flexion: { label: "weak wrist flexion", less: true },
  weak_finger_extension: { label: "weak finger extension", less: true },
  weak_finger_flexion: { label: "weak grip", less: true },
  weak_finger_abduction: { label: "weak finger spreading" },
  weak_thumb_abduction: { label: "weak thumb abduction", less: true },
  weak_thumb_adduction: { label: "weak thumb adduction (Froment's)", less: true },
  ulnar_claw: { label: "ulnar claw hand", less: true },
  weak_hip_flexion: { label: "weak hip flexion" },
  weak_hip_adduction: { label: "weak hip adduction", less: true },
  weak_hip_abduction: { label: "weak hip abduction" },
  weak_knee_extension: { label: "weak knee extension" },
  weak_knee_flexion: { label: "weak knee flexion", less: true },
  weak_ankle_dorsiflexion: { label: "foot drop" },
  weak_great_toe_extension: { label: "weak big-toe lift" },
  weak_foot_eversion: { label: "weak foot eversion" },
  weak_foot_inversion: { label: "weak foot inversion" },
  weak_ankle_plantarflexion: { label: "weak push-off (plantarflexion)" },
  weak_toe_flexion: { label: "weak toe curl", less: true },
  // ---- Tone ----
  spasticity: { label: "spasticity" },
  rigidity: { label: "rigidity" },
  hypotonia: { label: "floppy tone" },
  // ---- Reflexes ----
  babinski: { label: "up-going plantar" },
  hoffmann: { label: "Hoffmann's sign" },
  umn_signs: { label: "brisk reflexes and up-going plantars" },
  reflex_biceps_loss: { label: "absent biceps jerk" },
  reflex_brachioradialis_loss: { label: "absent supinator jerk", less: true },
  reflex_triceps_loss: { label: "absent triceps jerk" },
  reflex_knee_loss: { label: "absent knee jerk" },
  reflex_ankle_loss: { label: "absent ankle jerk" },
  grasp_reflex: { label: "grasp reflex", less: true },
  palmomental: { label: "palmomental reflex", less: true },
  anal_wink_loss: { label: "absent anal wink" },
  bulbocavernosus_loss: { label: "absent bulbocavernosus reflex", less: true },
  // ---- Wasting & fasciculations ----
  wasting: { label: "muscle wasting" },
  fasciculations: { label: "fasciculations" },
  // ---- Sensation › Pain & temperature ----
  spinothalamic: { label: "body pain loss", note: "pain and temperature" },
  thalamic_pain: { label: "central post-stroke pain", less: true },
  // ---- Sensation › Vibration & proprioception ----
  dorsal_sensory: { label: "vibration and position loss" },
  sensory_ataxia: { label: "positive Romberg" },
  // ---- Sensation › Cortical ----
  cortical_sensory_arm: { label: "arm cortical sensory loss" },
  cortical_sensory_leg: { label: "leg cortical sensory loss" },
  cortical_sensory_hand: { label: "hand and mouth cortical sensory loss", less: true },
  // ---- Sensation › Dermatomal ----
  sensory_c3: { label: "C3 numbness", less: true },
  sensory_c4: { label: "C4 numbness", less: true },
  sensory_c5: { label: "C5 numbness" },
  sensory_c6: { label: "C6 numbness" },
  sensory_c7: { label: "C7 numbness" },
  sensory_c8: { label: "C8 numbness" },
  sensory_t1: { label: "T1 numbness", less: true },
  sensory_t4: { label: "T4 numbness", less: true },
  sensory_t10: { label: "T10 numbness", less: true },
  sensory_l1: { label: "L1 numbness", less: true },
  sensory_l2: { label: "L2 numbness", less: true },
  sensory_l3: { label: "L3 numbness", less: true },
  sensory_l4: { label: "L4 numbness" },
  sensory_l5: { label: "L5 numbness" },
  sensory_s1: { label: "S1 numbness" },
  sensory_s2: { label: "S2 numbness", less: true },
  sensory_s3: { label: "S3 numbness", less: true },
  radicular_pain: { label: "sciatica-type root pain" },
  // ---- Sensation › Peripheral-nerve territory ----
  axillary_sensory: { label: "badge-area numbness", note: "axillary nerve", less: true },
  musculocutaneous_sensory: { label: "lateral forearm numbness", note: "musculocutaneous nerve", less: true },
  radial_sensory: { label: "snuffbox numbness", note: "radial nerve" },
  median_sensory: { label: "thumb-side finger numbness", note: "median nerve" },
  median_palmar_sensory: { label: "palm numbness", note: "palmar branch of median", less: true },
  ulnar_sensory: { label: "little-finger numbness", note: "ulnar nerve" },
  ulnar_dorsal_sensory: { label: "back-of-hand ulnar numbness", less: true },
  femoral_sensory: { label: "front-of-thigh numbness", note: "femoral nerve", less: true },
  obturator_sensory: { label: "inner-thigh numbness", note: "obturator nerve", less: true },
  lat_fem_cutaneous_sensory: { label: "outer-thigh numbness", note: "meralgia paraesthetica" },
  saphenous_sensory: { label: "inner-shin numbness", note: "saphenous nerve", less: true },
  sciatic_sensory: { label: "below-knee numbness", note: "sciatic nerve", less: true },
  peroneal_sensory: { label: "top-of-foot numbness", note: "common peroneal nerve" },
  deep_peroneal_sensory: { label: "first web-space numbness", note: "deep peroneal nerve", less: true },
  tibial_sensory: { label: "sole numbness", note: "tibial nerve", less: true },
  sural_sensory: { label: "outer-foot numbness", note: "sural nerve", less: true },
  // ---- Sensation › Glove-and-stocking ----
  distal_sensory_loss: { label: "glove-and-stocking numbness" },
  // ---- Sensation › Sensory level / cord ----
  suspended_sensory: { label: "cape-like pain loss", less: true },
  saddle_anaesthesia: { label: "saddle numbness" },
  // ---- Coordination & cerebellar ----
  limb_ataxia: { label: "limb ataxia" },
  dysmetria: { label: "past-pointing" },
  dysdiadochokinesis: { label: "slow alternating movements" },
  intention_tremor: { label: "intention tremor" },
  truncal_ataxia: { label: "truncal ataxia", note: "wide-based, unsteady gait" },
  tremor_rubral: { label: "rubral tremor", less: true },
  palatal_tremor: { label: "palatal tremor", less: true },
  // ---- Movement disorders ----
  bradykinesia: { label: "slowness of movement" },
  rest_tremor: { label: "rest tremor" },
  chorea: { label: "chorea" },
  dystonia: { label: "dystonia" },
  hemiballismus: { label: "hemiballismus" },
  thalamic_tremor: { label: "thalamic tremor", less: true },
  // ---- Fatiguability / augmentation ----
  fatigable_weakness: { label: "weakness that tires with use" },
  fatigable_ocular: { label: "fatigable ptosis and double vision" },
  facilitating_weakness: { label: "weakness that improves with effort", less: true },
  autonomic_features: { label: "dry mouth and constipation", note: "autonomic", less: true },
  // ---- Autonomic, sphincter & hypothalamic ----
  sphincter_dysfunction: { label: "bladder or bowel dysfunction" },
  urinary_incontinence: { label: "urinary incontinence", note: "frontal pattern" },
  diabetes_insipidus: { label: "diabetes insipidus", less: true },
  thermodysregulation: { label: "temperature dysregulation", less: true },
  hyperphagia: { label: "hyperphagia", less: true },
  narcolepsy: { label: "excessive sleepiness", less: true },
  circadian_disruption: { label: "sleep-wake disruption", less: true },
  endocrine_dysfunction: { label: "pituitary hormone dysfunction", less: true },
  // ---- Functional signs (positive) ----
  hoovers_sign: { label: "Hoover's sign" },
  give_way_weakness: { label: "give-way weakness" },
  entrainment: { label: "tremor entrains", less: true },
  exam_inconsistency: { label: "inconsistent examination", less: true },
};

// The plain label, or the id made readable if a finding is ever added without one (the suite fails first).
export const plainLabel = f => (PLAIN[f] && PLAIN[f].label) || String(f).replace(/_/g, " ");
```

- [ ] **Step 4: Run it to verify it passes, and add it to the suite**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/plain-labels.test.js
```
Expected: `plain labels: 11 passed, 0 failed`.

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node -e 'const fs=require("fs");const p=JSON.parse(fs.readFileSync("package.json","utf8"));p.scripts.test+=" && node test/plain-labels.test.js";fs.writeFileSync("package.json",JSON.stringify(p,null,2)+"\n")'
```

- [ ] **Step 5: Commit**

```bash
git add app/plain-labels.js test/plain-labels.test.js package.json
git commit -m "feat: plain labels for every finding (awaiting clinical review)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 6: REVIEW GATE — owner review round 1.** Stop. Ask the owner to read `app/plain-labels.js` (234 labels, their notes and the less-common tags). Apply every change they ask for, re-run `test/plain-labels.test.js`, and commit (`docs:`/`fix:` as appropriate). When they approve, change the file header's `REVIEW STATUS` line to `✅ SIGNED OFF by the owner (a clinician), <date>.` and commit. **If a label used in a later test changes** — `face_pain_loss`, `dysphagia`, `spinothalamic`, `weak_adduction`, `weak_arm`, `sensory_l5`, `dysarthria`, `weak_ankle_dorsiflexion`, `lmn_weakness`, `reflex_knee_loss` — note it: Task 6's expected strings must use the approved wording. Do not start Task 3 until the owner approves.

---

### Task 3: Follow-ups under a ticked finding — REVIEW ROUND 2

**Files:**
- Create: `app/follow-ups.js`
- Create: `test/follow-ups.test.js`
- Modify: `package.json`

**Interfaces:**
- Consumes: `EXAM_TREE` from `app/exam-map.js`; `offersFor()` from `app/sides.js` (test only).
- Produces: `FOLLOW_UPS[parentId] = [findingId]`; `GROUP_OF[findingId] = leafGroupId`; `followUpLayout(enteredFindingIds: Set, groupOf = GROUP_OF)` → `{ under: Map<parentId, followUpId[]>, hideHome: Set<findingId> }`. Consumed by Task 8.

- [ ] **Step 1: Write the failing test** — create `test/follow-ups.test.js`:

```js
// follow-ups.test.js — findings that appear under a ticked finding (spec 2026-09-27 §5.3).
import { FOLLOW_UPS, GROUP_OF, followUpLayout } from "../app/follow-ups.js";
import { FINDINGS } from "../src/model/findings.js";
import { offersFor } from "../app/sides.js";

let pass = 0, fail = 0;
const ok = (l, c, d = "") => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l + (c ? "" : `  ${d}`)); };

const pairs = Object.entries(FOLLOW_UPS).flatMap(([p, kids]) => kids.map(k => [p, k]));
const unreal = [...new Set(pairs.flat())].filter(f => !FINDINGS[f]);
ok(`every parent and follow-up is a real finding (${pairs.length} pairs)`, unreal.length === 0, unreal.join(", "));
const homeless = [...new Set(pairs.flat())].filter(f => !GROUP_OF[f]);
ok("every parent and follow-up has a home row in the exam tree", homeless.length === 0, homeless.join(", "));
ok("no finding follows itself", pairs.every(([p, k]) => p !== k));

// Acyclic: a follow-up that is itself a parent (small pupil -> facial anhidrosis) must never lead back.
const cyclic = [];
const visit = (f, path) => {
  if (path.includes(f)) { cyclic.push([...path, f].join(" > ")); return; }
  (FOLLOW_UPS[f] || []).forEach(k => visit(k, [...path, f]));
};
Object.keys(FOLLOW_UPS).forEach(p => visit(p, []));
ok("the map is acyclic", cyclic.length === 0, cyclic.join(" | "));

// A follow-up takes its parent's side: it must offer every side its parent offers, or have one fixed offer of
// its own (the nystagmus types and skew take no side).
const keys = f => offersFor(f).map(o => o.key);
const clash = pairs.filter(([p, k]) => {
  const pk = keys(p), kk = keys(k);
  return !(pk.every(s => kk.includes(s)) || kk.length === 1);
}).map(([p, k]) => `${p}[${keys(p)}] -> ${k}[${keys(k)}]`);
ok("every follow-up can take its parent's side", clash.length === 0, clash.join(" | "));

// ---- the layout ----
{
  const { under, hideHome } = followUpLayout(new Set(["facial_weakness"]));
  ok("face droop shows its five refinements", JSON.stringify(under.get("facial_weakness")) ===
     JSON.stringify(["forehead_spared", "forehead_involved", "hyperacusis", "taste_loss", "lacrimation_loss"]));
  ok("…and their home rows (same group) are hidden, so nothing shows twice", hideHome.has("forehead_spared") && hideHome.has("lacrimation_loss"));
}
{
  const { under, hideHome } = followUpLayout(new Set(["ptosis"]));
  ok("a drooping eyelid shows the pupil questions", (under.get("ptosis") || []).includes("miosis"));
  ok("…but the small pupil keeps its home row in Pupils (a different group)", !hideHome.has("miosis"));
}
{
  const { under } = followUpLayout(new Set(["speech_nonfluent", "comprehension_impaired"]));
  ok("a follow-up shared by two entered parents shows once, under the first",
     (under.get("speech_nonfluent") || []).includes("repetition_impaired") && !under.has("comprehension_impaired"));
}
{
  const { under, hideHome } = followUpLayout(new Set(["forehead_involved"]));
  ok("an entered follow-up without its parent stays on its home row", under.size === 0 && hideHome.size === 0);
}
{
  const { under, hideHome } = followUpLayout(new Set(["rapd"]));
  ok("RAPD is enterable on its own — no monocular loss needed (optic tract)", under.size === 0 && !hideHome.has("rapd"));
}
{
  const { under } = followUpLayout(new Set(["ptosis", "miosis"]));
  ok("a follow-up that is itself a parent shows its own follow-ups", (under.get("miosis") || []).includes("anhidrosis_face"));
}

console.log(`\nfollow-ups: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run it to verify it fails**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/follow-ups.test.js
```
Expected: FAIL — `Cannot find module '.../app/follow-ups.js'`.

- [ ] **Step 3: Create `app/follow-ups.js`:**

```js
// follow-ups.js — findings that appear under a ticked finding (spec 2026-09-27 §5.3). The map is CONTENT,
// reviewed on its own; the layout rule below it is pure and DOM-free.
//
// A follow-up is only a TRUE REFINEMENT of its parent — the same deficit described more precisely (owner ruling
// 2026-09-27). Ticking the parent ENTERS it, so a different kind of finding must never nest here: myotomes under
// "leg weakness" would hand a peroneal foot drop a pyramidal finding it does not have.
//
// REVIEW STATUS: ⚠ AWAITING CLINICAL REVIEW (round 2 of 3, spec 2026-09-27 §8).
import { EXAM_TREE } from "./exam-map.js";

// Key order is display priority: a follow-up shared by two entered parents shows under the first listed here.
export const FOLLOW_UPS = {
  facial_weakness: ["forehead_spared", "forehead_involved", "hyperacusis", "taste_loss", "lacrimation_loss"],
  cn8_vertigo: ["nystagmus_peripheral", "nystagmus_gaze_evoked", "head_impulse_abnormal", "skew_deviation",
    "nystagmus_positional_posterior", "nystagmus_positional_horizontal"],
  ptosis: ["miosis", "fixed_dilated_pupil", "fatigable_ocular"],
  miosis: ["anhidrosis_face"],
  homonymous_hemianopia: ["macular_sparing"],
  optic_neuropathy: ["central_scotoma", "altitudinal_defect", "rapd"],
  limb_ataxia: ["dysmetria", "dysdiadochokinesis", "intention_tremor"],
  dysarthria: ["ataxic_dysarthria"],
  speech_nonfluent: ["repetition_impaired", "naming_impaired"],
  comprehension_impaired: ["repetition_impaired", "naming_impaired"],
  saddle_anaesthesia: ["anal_wink_loss", "bulbocavernosus_loss"],
  reduced_consciousness: ["extensor_posturing"],
};

// finding -> the id of the exam-tree leaf group it lives in (its "home").
export const GROUP_OF = {};
{
  const walk = n => { if (n.findings) n.findings.forEach(f => { GROUP_OF[f] = n.id; }); (n.groups || []).forEach(walk); };
  EXAM_TREE.forEach(walk);
}

// Given the ENTERED finding ids, where does each follow-up show?
//   under    — Map(parent -> [follow-up ids]) for every entered parent, each follow-up placed once (first parent wins)
//   hideHome — follow-ups shown under a parent in their OWN group, so their home row is hidden (never shown twice
//              in one view). A follow-up whose home is another group keeps its home row: RAPD must stay enterable
//              on its own, because an optic TRACT lesion gives an RAPD with no monocular visual loss.
// An entered follow-up whose parent is removed is simply back on its home row — nothing to do.
export function followUpLayout(entered, groupOf = GROUP_OF) {
  const under = new Map(), placed = new Set();
  for (const [parent, kids] of Object.entries(FOLLOW_UPS)) {
    if (!entered.has(parent)) continue;
    const mine = kids.filter(f => !placed.has(f));
    mine.forEach(f => placed.add(f));
    if (mine.length) under.set(parent, mine);
  }
  const hideHome = new Set();
  for (const [parent, kids] of under) for (const f of kids) if (groupOf[f] === groupOf[parent]) hideHome.add(f);
  return { under, hideHome };
}
```

- [ ] **Step 4: Run it to verify it passes, and add it to the suite**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/follow-ups.test.js
```
Expected: `follow-ups: 13 passed, 0 failed`.

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node -e 'const fs=require("fs");const p=JSON.parse(fs.readFileSync("package.json","utf8"));p.scripts.test+=" && node test/follow-ups.test.js";fs.writeFileSync("package.json",JSON.stringify(p,null,2)+"\n")'
```

- [ ] **Step 5: Commit**

```bash
git add app/follow-ups.js test/follow-ups.test.js package.json
git commit -m "feat: follow-ups under a ticked finding (awaiting clinical review)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 6: REVIEW GATE — owner review round 2.** Stop. Ask the owner to read the `FOLLOW_UPS` map (12 parents, 30 pairs). The rule they set: a follow-up is only a TRUE REFINEMENT of the same deficit. Apply their changes, re-run the suite (it checks every id, acyclicity and side compatibility), commit, and mark the header `✅ SIGNED OFF`. Do not start Task 4 until they approve.

---

### Task 4: Bedside search phrases — REVIEW ROUND 3

**Files:**
- Create: `app/synonyms.js`
- Create: `test/synonyms.test.js`
- Modify: `package.json`

**Interfaces:**
- Produces: `SYNONYMS[phrase] = [findingId]`; `synonymHits(query)` → `Set<findingId>` (empty below 3 characters). Consumed by Task 8.

- [ ] **Step 1: Write the failing test** — create `test/synonyms.test.js`:

```js
// synonyms.test.js — bedside phrases the search box understands (spec 2026-09-27 §5.5).
import { SYNONYMS, synonymHits } from "../app/synonyms.js";
import { FINDINGS } from "../src/model/findings.js";

let pass = 0, fail = 0;
const ok = (l, c, d = "") => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l + (c ? "" : `  ${d}`)); };

const entries = Object.entries(SYNONYMS);
const unreal = entries.flatMap(([p, ids]) => ids.filter(f => !FINDINGS[f]).map(f => `${p} -> ${f}`));
ok(`every phrase resolves to real findings (${entries.length} phrases)`, unreal.length === 0, unreal.join(", "));
ok("every phrase names at least one finding", entries.every(([, ids]) => ids.length > 0));
ok("phrases are lower case and trimmed", entries.every(([p]) => p === p.trim().toLowerCase()));

// The table exists for what today's search misses; a phrase the long description already contains is dead weight.
const redundant = entries.filter(([p, ids]) => ids.length === 1 && FINDINGS[ids[0]].desc.toLowerCase().includes(p)).map(([p]) => p);
ok("no phrase only repeats a finding's own description", redundant.length === 0, redundant.join(", "));

ok("'slurred speech' finds dysarthria", synonymHits("slurred speech").has("dysarthria"));
ok("'droopy eyelid' finds ptosis, whatever the case", synonymHits("Droopy Eyelid").has("ptosis"));
ok("a partial word matches as it is typed ('dizz')", synonymHits("dizz").has("cn8_vertigo"));
ok("a longer query containing a phrase matches ('left face droop')", synonymHits("left face droop").has("facial_weakness"));
ok("Horner finds the eyelid, the pupil and the sweating", ["ptosis", "miosis", "anhidrosis_face"].every(f => synonymHits("horner").has(f)));
ok("fewer than three characters match nothing", synonymHits("di").size === 0 && synonymHits("").size === 0);

console.log(`\nsynonyms: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run it to verify it fails**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/synonyms.test.js
```
Expected: FAIL — `Cannot find module '.../app/synonyms.js'`.

- [ ] **Step 3: Create `app/synonyms.js`:**

```js
// synonyms.js — bedside phrases the search box understands (spec 2026-09-27 §5.5). CONTENT plus one pure
// matcher. The search already matches a finding's id, long description and plain label; this table covers what
// none of those contain. Measured 2026-09-27: "foot drop" and "wrist drop" already worked (their descriptions
// contain them); "slurred speech", "droopy eyelid", "dizzy", "Horner", "face droop" and "hemiparesis" found
// nothing.
//
// REVIEW STATUS: ⚠ AWAITING CLINICAL REVIEW (round 3 of 3, spec 2026-09-27 §8).
export const SYNONYMS = {
  "slurred speech": ["dysarthria"],
  "droopy eyelid": ["ptosis"],
  "drooping eyelid": ["ptosis"],
  "can't find words": ["naming_impaired"],
  "word finding": ["naming_impaired"],
  "can't understand": ["comprehension_impaired"],
  "dizzy": ["cn8_vertigo"],
  "dizziness": ["cn8_vertigo"],
  "spinning": ["cn8_vertigo"],
  "numb face": ["face_pain_loss", "face_touch_loss", "face_sensory_loss"],
  "facial numbness": ["face_pain_loss", "face_touch_loss", "face_sensory_loss"],
  "face droop": ["facial_weakness"],
  "facial droop": ["facial_weakness"],
  "facial palsy": ["facial_weakness"],
  "bell's palsy": ["facial_weakness", "forehead_involved"],
  "horner": ["ptosis", "miosis", "anhidrosis_face"],
  "double vision": ["weak_abduction", "weak_adduction", "vertical_diplopia", "ino", "fatigable_ocular"],
  "diplopia": ["weak_abduction", "weak_adduction", "vertical_diplopia", "ino", "fatigable_ocular"],
  "field cut": ["homonymous_hemianopia", "bitemporal_hemianopia"],
  "vision loss": ["optic_neuropathy", "homonymous_hemianopia", "cortical_blindness"],
  "clumsy": ["limb_ataxia", "dysmetria"],
  "unsteady": ["truncal_ataxia", "sensory_ataxia", "limb_ataxia"],
  "can't walk": ["truncal_ataxia", "weak_leg", "gait_apraxia"],
  "hemiparesis": ["weak_arm", "weak_leg"],
  "one-sided weakness": ["weak_arm", "weak_leg"],
  "can't lift the foot": ["weak_ankle_dorsiflexion"],
  "weak grip": ["weak_finger_flexion", "weak_hand"],
  "pins and needles": ["spinothalamic", "dorsal_sensory", "distal_sensory_loss"],
  "tingling": ["spinothalamic", "dorsal_sensory", "distal_sensory_loss"],
  "carpal tunnel": ["median_sensory", "weak_thumb_abduction"],
  "numb saddle": ["saddle_anaesthesia"],
  "confused": ["reduced_consciousness"],
  "drowsy": ["reduced_consciousness"],
  "unresponsive": ["reduced_consciousness"],
  "shaking": ["rest_tremor", "intention_tremor"],
  "stiff": ["spasticity", "rigidity"],
  "fatigue": ["fatigable_weakness", "fatigable_ocular"],
  "can't hear": ["hearing_loss"],
  "brisk reflexes": ["umn_signs"],
  "upgoing": ["babinski"],
  "floppy": ["hypotonia", "lmn_weakness"],
  "twitching": ["fasciculations"],
  "slow movements": ["bradykinesia"],
};

// Finding ids whose bedside phrase matches the query: the phrase contains what was typed ("dizz" -> dizzy), or
// what was typed contains the phrase ("left face droop"). Three characters minimum, so one keystroke does not
// light up half the table.
export function synonymHits(query) {
  const q = String(query || "").trim().toLowerCase();
  const out = new Set();
  if (q.length < 3) return out;
  for (const [phrase, ids] of Object.entries(SYNONYMS)) {
    if (phrase.includes(q) || q.includes(phrase)) ids.forEach(f => out.add(f));
  }
  return out;
}
```

- [ ] **Step 4: Run it to verify it passes, and add it to the suite**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/synonyms.test.js
```
Expected: `synonyms: 10 passed, 0 failed`. (The "no phrase only repeats a description" check is real: in the prototype it rejected `hyperreflexia`, which the finding's own description already contains.)

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node -e 'const fs=require("fs");const p=JSON.parse(fs.readFileSync("package.json","utf8"));p.scripts.test+=" && node test/synonyms.test.js";fs.writeFileSync("package.json",JSON.stringify(p,null,2)+"\n")'
```

- [ ] **Step 5: Commit**

```bash
git add app/synonyms.js test/synonyms.test.js package.json
git commit -m "feat: bedside search phrases (awaiting clinical review)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 6: REVIEW GATE — owner review round 3.** Stop. Ask the owner to read `SYNONYMS` (43 phrases). Apply their changes, re-run, commit, mark the header `✅ SIGNED OFF`. Do not start Task 5 until they approve.

---

### Task 5: `tokensForRow()` — a row tap on the default side

**Files:**
- Modify: `app/sides.js` (append at end)
- Test: `test/side-offers.test.js`

**Interfaces:**
- Consumes: `offersFor(f)` (same file).
- Produces: `tokensForRow(findingId, defaultSide = "")` → `string[] | null`, where `defaultSide` ∈ `"" | "left" | "right" | "both" | "midline"`. Consumed by Task 8.

- [ ] **Step 1: Write the failing test**

In `test/side-offers.test.js`, change the import

```js
import { offersFor, buildSideOffers } from "../app/sides.js";
```

to

```js
import { offersFor, buildSideOffers, tokensForRow } from "../app/sides.js";
```

and insert this block immediately BEFORE the final line `console.log(`\nside offers: ${pass} passed, ${fail} failed`);`:

```js
// ---- a row tap on the default side (spec 2026-09-27 §5.4) ----
{
  const offered = f => new Set(offersFor(f).flatMap(o => o.tokens));
  const stray = [], dead = [];
  for (const f of Object.keys(FINDINGS)) for (const d of ["", "left", "right", "both", "midline"]) {
    const toks = tokensForRow(f, d);
    if (!toks) continue;
    if (toks.some(t => !offered(f).has(t))) stray.push(`${f}:${d}`);
    // The axis/flag findings (pinned above as unproduced) localise nothing by design and carry their own banners.
    else if (map[f] && !solve(new Set(toks), { dominantSide: "left" }).differential.length) dead.push(`${f}:${d}`);
  }
  ok("a row tap never enters a side the panel does not offer", stray.length === 0, stray.slice(0, 8).join(", "));
  ok("…and never enters a picture that returns nothing", dead.length === 0, dead.slice(0, 8).join(", "));
  ok("no default: a two-sided finding waits for its buttons", tokensForRow("weak_arm", "") === null);
  ok("default left enters the left side", JSON.stringify(tokensForRow("weak_arm", "left")) === '["weak_arm@left"]');
  ok("default both enters left and right", JSON.stringify(tokensForRow("weak_arm", "both")) === '["weak_arm@left","weak_arm@right"]');
  ok("a symmetric-only finding takes 'Both' whatever the default", JSON.stringify(tokensForRow("distal_sensory_loss", "left")) === JSON.stringify(offersFor("distal_sensory_loss")[0].tokens));
  ok("a finding with no side takes its single offer", JSON.stringify(tokensForRow("naming_impaired", "right")) === '["naming_impaired@none"]');
  ok("a midline parent passes midline to its follow-up (saddle -> anal wink)", tokensForRow("anal_wink_loss", "midline")?.every(t => t.endsWith("@midline")));
}
```

- [ ] **Step 2: Run it to verify it fails**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/side-offers.test.js
```
Expected: FAIL — no export named `tokensForRow`.

- [ ] **Step 3: Implement** — append to the END of `app/sides.js`:

```js
// A row TAP enters the finding on the reader's default side (spec 2026-09-27 §5.4): "Symptoms on" above the tree,
// or a follow-up's parent side. It maps that default through the SAME offers the buttons show, so a tap can never
// enter a token the panel does not offer. A finding with one fixed offer (none / both / midline) takes it whatever
// the default. Returns null when the default does not decide it — the row's side buttons are then the only way in.
export function tokensForRow(f, defaultSide = "") {
  const offers = offersFor(f);
  if (offers.length === 1 && offers[0].key !== "left" && offers[0].key !== "right") return offers[0].tokens;
  if (!defaultSide) return null;
  const exact = offers.find(o => o.key === defaultSide);
  if (exact) return exact.tokens;
  if (defaultSide === "both") {
    const lr = offers.filter(o => o.key === "left" || o.key === "right");
    if (lr.length === 2) return lr.flatMap(o => o.tokens);
  }
  return null;
}
```

- [ ] **Step 4: Run it to verify it passes**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/side-offers.test.js
```
Expected: `side offers: 17 passed, 0 failed`. The axis/flag findings (Hoover's sign, the pinhole test, papilloedema…) are excluded from the "returns nothing" check by design — the existing suite pins them as unproduced, and they carry their own banners.

- [ ] **Step 5: Commit**

```bash
git add app/sides.js test/side-offers.test.js
git commit -m "feat: tokensForRow — a row tap enters the default side

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: `app/answer.js` — the answer card's lines (and `place`)

**Files:**
- Modify: `app/labels.js` (`plainSiteName` return value)
- Modify: `test/app-naming.test.js`
- Create: `app/answer.js`
- Create: `test/answer.test.js`
- Modify: `package.json`

**Interfaces:**
- Consumes: `whyChain`, `whyClues` (Task 1); `plainLabel` (Task 2); `causesFor`, `pathologyNextStepsFor`, `combinedNextSteps`, `nameForSite`, `unifyingDiagnoses`, `MULTIFOCAL`, `combinedSites`, `plainSiteName` (exist).
- Produces:
  - `plainSiteName(site, opts)` → `{ name, sub, raw, place }` (`place` is new: the plain location, e.g. `"Left lateral medulla"`).
  - `whereLine({ place, others, cover, fit })`, `whySentence(clues)`, `whatLine({ causes, demotedCount, selected, entity, twoLesions })` → string.
  - `resolveNext({ site, r, pinned, scope, selectedPathology, selectedEntity, onset })` → `{ nx, combined }` — the ONE workup resolution; Task 7's `nextCard` uses it.
  - `answerFor({ r, sel, total, tokens, onset, course, dominant, sensoryLevel, pinned, scope, selectedPathology, selectedEntity })` → `{ lines: { where, why, what, next, red }, nx, combined, twoLesions }` — Task 7 renders it.

- [ ] **Step 1: Write the failing tests**

In `test/app-naming.test.js`, insert this block immediately BEFORE the line `// ---- shortFindingLabel: chip-sized, never empty, for every finding ----`:

```js
// ---- place: the plain anatomical phrase, whatever the headline (spec 2026-09-27 §3.1) ----
{
  const cs2 = candidateSites();
  const pl = id => plainSiteName(cs2.find(s => s.id === id), { dominantSide: "left" }).place;
  ok("an eponymous site's place is its plain location (Wallenberg -> Left lateral medulla)", pl("left_medulla_lateral") === "Left lateral medulla", pl("left_medulla_lateral"));
  ok("a plain-named site's place equals its name", pl("left_cortex_motor_facearm") === plainSiteName(cs2.find(s => s.id === "left_cortex_motor_facearm"), { dominantSide: "left" }).name);
  const noPlace = cs2.filter(s => !plainSiteName(s, { dominantSide: "left" }).place).map(s => s.id);
  ok("every candidate site has a place", noPlace.length === 0, noPlace.slice(0, 5).join(", "));
}
```

Create `test/answer.test.js`:

```js
// answer.test.js — the answer card's lines (spec 2026-09-27 §3.1): each line derived, each edge state covered.
import { whereLine, whySentence, whatLine, resolveNext, answerFor } from "../app/answer.js";
import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";
import { pathologyNextStepsFor } from "../src/data/nextSteps.js";
import { EXAMPLES } from "../app/examples.js";

let pass = 0, fail = 0;
const ok = (l, c, d = "") => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l + (c ? "" : `  ${d}`)); };
const eq = (l, got, want) => ok(l, got === want, `got ${JSON.stringify(got)}`);

// ---- Where ----
eq("one place", whereLine({ place: "Left L5 root" }), "Left L5 root.");
eq("one other place fits", whereLine({ place: "A", others: ["B"] }), "A. 1 other place also fits: B.");
eq("three others: two named, the rest counted", whereLine({ place: "A", others: ["B", "C", "D"] }), "A. 3 other places also fit: B, C, and 1 more.");
eq("no single place: the cover is named", whereLine({ place: "A", cover: ["A", "B"] }), "No single place explains every finding — likely A and B.");
eq("a partial fit says how partial", whereLine({ place: "A", fit: { n: 3, total: 4 } }), "A explains 3 of 4 findings.");

// ---- Why ----
const w = (verdict, clues, where, sides, more = 0) => ({ verdict, clues, where, meet: { stations: [], sides }, more });
eq("one place, crossed", whySentence(w("one", [{ finding: "weak_adduction", side: "left" }, { finding: "weak_arm", side: "right" }], "midbrain", ["left"])),
   "Left eye won't turn in + right arm weakness → only the left midbrain.");
eq("several places, listed", whySentence(w("several", [{ finding: "sensory_l5", side: "left" }], "nerve root, plexus", ["left"])),
   "Left L5 numbness → the left nerve root or plexus; see Where for what separates them.");
eq("several places, a range", whySentence(w("several", [{ finding: "weak_arm", side: "right" }], "cerebral cortex → spinal cord", ["left", "right"])),
   "Right arm weakness → anywhere from the cerebral cortex to the spinal cord; see Where for what separates them.");
eq("more clues than shown are counted", whySentence(w("one", [{ finding: "dysarthria", side: null }], "pons", ["left"], 2)),
   "Slurred speech + 2 more findings → only the left pons.");
eq("no single place", whySentence(w("none", [], "", [])), "These findings need more than one lesion — see Together.");

// ---- What ----
const c = (name, likelihood, red = false) => ({ name, likelihood, red });
eq("most likely, then the must-not-miss", whatLine({ causes: [c("A", "uncommon", true), c("B", "common")] }), "Most likely B. Must not miss: A.");
eq("a red most-likely says so, and the next red follows", whatLine({ causes: [c("A", "common", true), c("B", "uncommon", true)] }),
   "Most likely A (must not miss). Must not miss: B.");
eq("no red: just the most likely", whatLine({ causes: [c("A", "common")] }), "Most likely A.");
eq("nothing fits the onset", whatLine({ causes: [], demotedCount: 4 }), "No cause here typically starts this way — 4 set aside.");
eq("a selected cause", whatLine({ causes: [c("A", "common")], selected: "Vertebral artery dissection" }), "Selected: Vertebral artery dissection.");
eq("two lesions: the spanning disease", whatLine({ twoLesions: true, entity: "Multiple sclerosis" }), "Together: Multiple sclerosis.");
eq("two lesions, nothing catalogued", whatLine({ twoLesions: true }), "No catalogued disease spans these places — see Together.");

// ---- the whole card, on the four worked examples ----
const stateFor = ex => {
  const tokens = new Set(ex.tokens);
  const r = solve(tokens, { dominantSide: "left" });
  const sel = r.display.find(x => x.site.id === r.defaultSite) || r.display[0];
  return { r, sel, total: tokens.size, tokens, onset: ex.onset || "", course: ex.course || "", dominant: "left",
    sensoryLevel: "", pinned: new Set(ex.pinned || []), scope: "site", selectedPathology: undefined, selectedEntity: undefined };
};
const ex = id => EXAMPLES.find(e => e.id === id);
{
  const a = answerFor(stateFor(ex("wallenberg"))).lines;
  eq("Wallenberg — Where", a.where, "Left lateral medulla. 1 other place also fits: Left hemimedulla.");
  eq("Wallenberg — Why", a.why, "Left face pain loss + left swallowing difficulty + right body pain loss → only the left medulla.");
  eq("Wallenberg — What", a.what, "Most likely PICA / vertebral artery occlusion. Must not miss: Vertebral artery dissection.");
  eq("Wallenberg — Next", a.next, "Acute stroke team — hyperacute pathway; keep nil by mouth until swallow assessed.");
  eq("Wallenberg — red flag", a.red, "Swallowing can fail early — keep nil by mouth until assessed.");
}
{
  const a = answerFor(stateFor(ex("footdrop"))).lines;
  eq("Foot drop — Where names the other two", a.where, "Left common peroneal nerve. 2 other places also fit: Left L5 root, Left sacral plexus.");
  eq("Foot drop — Why says several", a.why, "Left foot drop → the left nerve root, plexus or peripheral nerve; see Where for what separates them.");
}
{
  const a = answerFor(stateFor(ex("cauda"))).lines;
  eq("Cauda — a red most-likely", a.what, "Most likely Central lumbar disc prolapse (must not miss). Must not miss: Spinal epidural abscess.");
}
{
  const out = answerFor(stateFor(ex("twolesions")));
  ok("Two lesions — Where names the cover", out.twoLesions && out.lines.where.startsWith("No single place explains every finding — likely "), out.lines.where);
  eq("Two lesions — What names the spanning disease", out.lines.what, "Together: Multiple sclerosis.");
}
{
  // Invariants over all four: the Next line IS the referral, word for word; the red line appears exactly when the
  // site has a red-flag sentence; and the resolved plan is the one the Next card would show.
  const bad = [];
  for (const e of EXAMPLES) {
    const st = stateFor(e), out = answerFor(st);
    const ref = pathologyNextStepsFor(st.sel.site, null, { onset: st.onset || undefined });
    if (out.lines.next !== ref.referral) bad.push(`${e.id}: next`);
    if ((out.lines.red || null) !== (nameForSite(st.sel.site).red || null)) bad.push(`${e.id}: red`);
    if (resolveNext({ ...st, site: st.sel.site }).nx.referral !== ref.referral) bad.push(`${e.id}: resolve`);
  }
  ok("Next is the referral verbatim, red matches the site, one resolution", bad.length === 0, bad.join(", "));
}
{
  // A selected cause narrows the lines to it, exactly as the Next card does.
  const st = { ...stateFor(ex("wallenberg")), selectedPathology: "Vertebral artery dissection" };
  const out = answerFor(st);
  eq("a selected cause — What", out.lines.what, "Selected: Vertebral artery dissection.");
  eq("a selected cause — Next follows its plan",
     out.lines.next, pathologyNextStepsFor(st.sel.site, "Vertebral artery dissection", { onset: st.onset }).referral);
}

console.log(`\nanswer card: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

If the owner changed any label in round 1 that appears in an expected string here (see the list in Task 2 Step 6), update that string to the approved wording now.

- [ ] **Step 2: Run them to verify they fail**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/app-naming.test.js | grep -i place
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/answer.test.js
```
Expected: the three `place` assertions FAIL (`place` is undefined), and `answer.test.js` fails with `Cannot find module '.../app/answer.js'`.

- [ ] **Step 3: Add `place` to `plainSiteName()`**

In `app/labels.js`, find

```js
  return { name, sub, raw };
}
```

and replace it with

```js
  // `place` is the plain anatomical phrase on its own ("Left lateral medulla") — the answer card's Where line
  // names the place, while `name` may be the eponym already in the card's title (spec 2026-09-27 §3.1).
  return { name, sub, raw, place: plain };
}
```

- [ ] **Step 4: Create `app/answer.js`:**

```js
// answer.js — the answer card's lines (spec 2026-09-27 §3.1). Pure and DOM-free, so every line and every edge
// state is asserted in node (test/answer.test.js). Nothing here is authored per site: each line is DERIVED from
// what the detail cards below already compute.
import { whyChain, whyClues } from "../src/engine/why.js";
import { causesFor } from "../src/data/causes.js";
import { pathologyNextStepsFor, combinedNextSteps } from "../src/data/nextSteps.js";
import { nameForSite } from "../src/data/syndromes.js";
import { unifyingDiagnoses } from "../src/engine/multifocal.js";
import { MULTIFOCAL } from "../src/data/multifocal.js";
import { combinedSites } from "./combined-sites.js";
import { plainSiteName } from "./labels.js";
import { plainLabel } from "./plain-labels.js";

const cap = s => (s ? s[0].toUpperCase() + s.slice(1) : s);
const andList = xs => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const orList = xs => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} or ${xs[xs.length - 1]}`);
const RANK = { common: 0, uncommon: 1, rare: 2 };

// ---- Where ----
export function whereLine({ place, others = [], cover = null, fit = null }) {
  if (cover && cover.length >= 2) return `No single place explains every finding — likely ${andList(cover)}.`;
  if (fit && fit.n < fit.total) return `${place} explains ${fit.n} of ${fit.total} findings.`;
  if (!others.length) return `${place}.`;
  const n = others.length, shown = others.slice(0, 2);
  const tail = n > 2 ? `, and ${n - 2} more` : "";
  return `${place}. ${n} other place${n > 1 ? "s" : ""} also fit${n > 1 ? "" : "s"}: ${shown.join(", ")}${tail}.`;
}

// ---- Why ----
// renderWhere() writes a run of three or more long-tract stations as "A → B"; the sentence reads it as a range.
function placePhrase(where, side) {
  const parts = where.split(", ");
  const ranges = parts.filter(p => p.includes(" → ")).map(p => { const [a, b] = p.split(" → "); return `anywhere from the ${a} to the ${b}`; });
  const points = parts.filter(p => !p.includes(" → "));
  return [...ranges, points.length ? `the ${side}${orList(points)}` : ""].filter(Boolean).join(", or ");
}
export function whySentence(w) {
  if (!w || w.verdict === "none" || !w.clues.length) return "These findings need more than one lesion — see Together.";
  const lhs = cap(w.clues.map(c => `${c.side ? c.side + " " : ""}${plainLabel(c.finding)}`).join(" + "))
    + (w.more ? ` + ${w.more} more finding${w.more > 1 ? "s" : ""}` : "");
  const s = w.meet.sides.length === 1 && (w.meet.sides[0] === "left" || w.meet.sides[0] === "right") ? `${w.meet.sides[0]} ` : "";
  if (w.verdict === "one") return `${lhs} → only the ${s}${w.where}.`;
  return `${lhs} → ${placePhrase(w.where, s)}; see Where for what separates them.`;
}

// ---- What ----
// `causes` are the concordant causes (causesFor().all); a cause set aside by the onset is only counted.
export function whatLine({ causes = [], demotedCount = 0, selected = null, entity = null, twoLesions = false }) {
  if (selected) return `Selected: ${selected}.`;
  if (twoLesions) return entity ? `Together: ${entity}.` : "No catalogued disease spans these places — see Together.";
  // Stable sort: within a likelihood the curated list order stands.
  const ranked = [...causes].sort((a, b) => (RANK[a.likelihood] ?? 3) - (RANK[b.likelihood] ?? 3));
  if (!ranked.length) return demotedCount ? `No cause here typically starts this way — ${demotedCount} set aside.` : "";
  const top = ranked[0], mustNot = ranked.find(c => c.red && c !== top);
  return `Most likely ${top.name}${top.red ? " (must not miss)" : ""}.${mustNot ? ` Must not miss: ${mustNot.name}.` : ""}`;
}

// ---- which workup is on screen ----
// ONE resolution, shared by the Next card and the answer card, so the badge and the Next line can never describe
// a different plan from the card below them. It follows the selection, as the Next card always has.
export function resolveNext({ site, r, pinned, scope, selectedPathology, selectedEntity, onset }) {
  const { sites } = combinedSites(r, r.display, pinned);
  const combined = sites.length >= 2 && scope === "all";
  const o = { onset: onset || undefined };
  const nx = combined
    ? combinedNextSteps(sites, selectedEntity || null, o)
    : pathologyNextStepsFor(site, selectedPathology || null, o);
  return { nx, combined };
}

// ---- the whole card ----
// `st` carries exactly what app.js holds: the solve() result, the selected candidate, the finding count, and the
// case state (tokens, onset, course, dominant, sensoryLevel, pinned, scope, selectedPathology, selectedEntity).
export function answerFor(st) {
  const opts = { dominantSide: st.dominant, sensoryLevel: st.sensoryLevel || undefined };
  const list = st.r.display;
  const place = s => plainSiteName(s, { dominantSide: st.dominant }).place;
  const { sites } = combinedSites(st.r, list, st.pinned);
  const twoLesions = !st.r.explainAll.length && sites.length >= 2;
  const { nx, combined } = resolveNext({ ...st, site: st.sel.site });
  let entity = st.selectedEntity || null;
  if (twoLesions && !entity) {
    const u = unifyingDiagnoses(sites, st.tokens, { onset: st.onset || undefined, course: st.course || undefined });
    entity = u.concordant.length ? u.concordant[0].name : null;
  }
  const res = causesFor(st.sel.site, { onset: st.onset || undefined });
  const entityRed = st.selectedEntity ? ((MULTIFOCAL.find(e => e.name === st.selectedEntity) || {}).red || null) : null;
  const lines = {
    where: whereLine({
      place: place(st.sel.site),
      others: list.filter(c => c.n === st.total && c.site.id !== st.sel.site.id).map(c => place(c.site)),
      cover: twoLesions ? sites.map(place) : null,
      fit: { n: st.sel.n, total: st.total },
    }),
    why: whySentence(whyClues(whyChain(st.tokens, st.sel.site, opts), st.tokens, opts)),
    what: whatLine({
      causes: res.all, demotedCount: (res.demoted || []).length,
      selected: (twoLesions ? st.selectedEntity : st.selectedPathology) || null, entity, twoLesions,
    }),
    next: nx.referral || "",
    red: entityRed || nameForSite(st.sel.site).red || null,
  };
  return { lines, nx, combined, twoLesions };
}
```

- [ ] **Step 5: Run them to verify they pass, and add the new suite**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/app-naming.test.js | tail -1
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/answer.test.js | tail -1
```
Expected: `app-naming` all passed (43 in the prototype); `answer card: 30 passed, 0 failed`.

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node -e 'const fs=require("fs");const p=JSON.parse(fs.readFileSync("package.json","utf8"));p.scripts.test+=" && node test/answer.test.js";fs.writeFileSync("package.json",JSON.stringify(p,null,2)+"\n")'
```

- [ ] **Step 6: Commit**

```bash
git add app/labels.js test/app-naming.test.js app/answer.js test/answer.test.js package.json
git commit -m "feat: answer.js — the answer card's five lines, derived

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: The results panel — the answer card, closed detail, the phone strip

**Files:**
- Modify: `app/app.js`
- Modify: `app/index.html` (CSS)

**Interfaces:**
- Consumes: `answerFor`, `resolveNext` (Task 6).
- Produces (inside `app.js`): `VIEW = { open: Set, defaultSide: "" }` (Task 8 uses `defaultSide`); `card(capHTML, body, anchor, hint)` now returns a `<details class="out-card">`; `answerCard(sel, list, r, ans)`, `answerStrip(sel, list, total, nx)`, `wireAnswerStrip()`, `wireSectionToggles(root)`.

`app.js` is DOM-bound, so no suite can import it: the tests for this task are the source-scanning suites plus the browser. **Every edit below is an exact find-and-replace; each "find" string occurs exactly once.** `resultHeader` is removed (its functional flag, urgency pill, scope toggle and report button move into `answerCard`).

- [ ] **Step 1: Import the answer module**

In `app/app.js`, find exactly:

```js
import { offersFor } from "./sides.js";
```

Replace with:

```js
import { offersFor } from "./sides.js";
import { answerFor, resolveNext } from "./answer.js";
```

- [ ] **Step 2: Add the view state**

In `app/app.js`, find exactly:

```js
const app = document.getElementById("app");
```

Replace with:

```js
const app = document.getElementById("app");
// VIEW STATE — how the reader is looking, never a fact about the case. It is deliberately NOT in S, so
// encodeCase() cannot serialise it: the same rule that keeps the theme out of the case URL.
//   open        — the detail sections the reader opened (they are closed by default, spec 2026-09-27 §3.2)
//   defaultSide — "Symptoms on", the side a row tap enters (spec 2026-09-27 §5.4)
const VIEW = { open: new Set(), defaultSide: "" };
```

- [ ] **Step 3: Jump links open the section they reach**

In `app/app.js`, find exactly:

```js
      if (target) target.scrollIntoView({ behavior: "auto", block: "start" });
```

Replace with:

```js
      if (!target) return;
      // A section is closed by default now, so a jump must open it as well as reach it.
      if (target.tagName === "DETAILS" && target.dataset.secCard) { target.open = true; VIEW.open.add(target.dataset.secCard); }
      target.scrollIntoView({ behavior: "auto", block: "start" });
```

- [ ] **Step 4: The empty-findings branch unbinds the strip**

In `app/app.js`, find exactly:

```js
    el.innerHTML = `<h3>Possible lesions</h3><div class="empty">Add a finding — every lesion that could produce it appears, and the list narrows as you add more.</div>`;
    return;
```

Replace with:

```js
    el.innerHTML = `<h3>Possible lesions</h3><div class="empty">Add a finding — every lesion that could produce it appears, and the list narrows as you add more.</div>`;
    wireAnswerStrip();   // no card now — this unbinds the last case's scroll listener
    return;
```

- [ ] **Step 5: renderResults builds the answer once**

In `app/app.js`, find exactly:

```js
  el.innerHTML = resultHeader(sel, list, total, r)
    + sectionNav(has)
```

Replace with:

```js
  const ans = answerFor({ r, sel, total, tokens: S.tokens, onset: S.onset, course: S.course, dominant: S.dominant,
    sensoryLevel: S.sensoryLevel, pinned: S.pinned, scope: S.scope, selectedPathology: S.selectedPathology, selectedEntity: S.selectedEntity });
  el.innerHTML = answerCard(sel, list, r, ans)
    + sectionNav(has)
```

- [ ] **Step 6: Mount the strip and bind the section toggles**

In `app/app.js`, find exactly:

```js
    + nextCard(sel.site, r, list);
  wireCardControls();
  wireJumpLinks(el);
```

Replace with:

```js
    + nextCard(sel.site, r, list)
    + answerStrip(sel, list, total, ans.nx);
  wireCardControls();
  wireJumpLinks(el);
  wireSectionToggles(el);
  wireAnswerStrip();
```

- [ ] **Step 7: card() becomes a closed <details>**

In `app/app.js`, find exactly:

```js
function card(capHTML, body, anchor) {
  return `<section class="out-card"${anchor ? ` id="sec-${anchor}"` : ""}><div class="out-cap">${capHTML}</div>${body}</section>`;
}
```

Replace with:

```js
// The detail sections are CLOSED by default (spec 2026-09-27 §3.2): the answer card above carries the short
// version of each, and a section opens on a tap or from the section nav. The order is unchanged and nothing is
// tabbed, so the 2026-08-16 ruling (a trainee must not be able to skip Why) still holds — Why's gist is on the
// answer card. A section the reader opened stays open across re-renders until they close it. `hint` is trusted
// literal copy.
function card(capHTML, body, anchor, hint = "") {
  const open = anchor && VIEW.open.has(anchor) ? " open" : "";
  return `<details class="out-card"${anchor ? ` id="sec-${anchor}" data-sec-card="${anchor}"` : ""}${open}><summary class="out-cap">${capHTML}${hint ? `<span class="out-hint">${hint}</span>` : ""}</summary>${body}</details>`;
}
// The toggle event does not bubble, so each section is bound after every render.
function wireSectionToggles(root) {
  root.querySelectorAll("details[data-sec-card]").forEach(d => {
    d.ontoggle = () => { d.open ? VIEW.open.add(d.dataset.secCard) : VIEW.open.delete(d.dataset.secCard); };
  });
}
```

- [ ] **Step 8: Replace resultHeader with answerCard, answerStrip and wireAnswerStrip**

In `app/app.js`, replace everything from the line starting
`// compact header: the leading/selected lesion + status + functional flag (safety — kept prominent)`
up to (not including) the line starting `// Five places tell the reader` with:

```js
// The answer card (spec 2026-09-27 §3.1): the site, the urgency, then one line each for Where / Why / What / Next
// and the site's red-flag sentence. The lines come from app/answer.js — derived, never authored per site. It keeps
// .out-head, the allowlisted terracotta rule: this card IS the answer. The functional flag stays here (safety).
function answerCard(sel, list, r, ans) {
  const fnd = functionalFlag(S.tokens);
  const funcFlag = fnd.functional
    ? `<div class="multi" style="border-color:var(--gold);background:var(--gold-bg,transparent)"><b>⚠ Consider functional.</b> ${esc(fnd.note)}</div>`
    : fnd.suppressed
    ? `<div class="annot"><b>Functional sign noted:</b> ${esc(fnd.note)}</div>`
    : "";
  // The badge follows the RESOLVED plan — the same one the Next line and the Next card show — so a selected cause
  // moves all three together (urgency follows the selection: owner rulings 2026-08-18 and 2026-08-21).
  const u = ans.nx.urgency;
  const tint = u === "emergency" ? "--red" : u === "urgent" ? "--gold" : "--faint";
  const lab = u === "emergency" ? "EMERGENCY" : u === "urgent" ? "URGENT" : "routine";
  const emerg = u === "emergency" ? " urg-emergency" : "";
  const urg = `<a class="urg-pill${emerg}" href="#sec-next"${emerg ? "" : ` style="color:var(${tint});border-color:var(${tint})"`}>${lab}</a>`;
  // ONE scope control, here, governing both the What and the Next cards.
  const { sites: scopeSites } = combinedSites(r, list, S.pinned);
  const scope = scopeSites.length >= 2 ? scopeToggle(scopeSites.length) : "";
  const L = ans.lines;
  const row = (k, v) => v ? `<div class="ans-row"><span class="ans-k">${k}</span><span class="ans-v">${esc(v)}</span></div>` : "";
  const red = L.red ? `<div class="ans-row ans-red"><span class="ans-k">⚑</span><span class="ans-v">${esc(L.red)}</span></div>` : "";
  return `<div class="out-head" id="answer">
    <div class="oh-lead"><div class="oh-lead-txt"><b>${esc(siteName(sel.site))}</b>
      <details class="oh-raw"><summary>site id</summary><code>${esc(siteRaw(sel.site))} · ${esc(sel.site.id)}</code></details>
    </div>${urg}${feedbackButton(list)}</div>
    <div class="ans">${row("Where", L.where)}${row("Why", L.why)}${row("What", L.what)}${row("Next", L.next)}${red}</div>
    ${scope}${funcFlag}</div>`;
}

// The phone strip (spec 2026-09-27 §3.3). Below the single-column breakpoint the answer card sits under the whole
// exam, so a slim bar pins the answer to the bottom of the screen while the card is out of view. A <button>, not
// a link: THE HASH IS THE CASE, and an href would rewrite it.
function answerStrip(sel, list, total, nx) {
  const n = list.filter(c => c.n === total).length;
  const u = nx.urgency === "emergency" ? "Emergency" : nx.urgency === "urgent" ? "Urgent" : "Routine";
  // Urgency FIRST: on a narrow screen the line truncates, and the name is what may be cut, never the urgency.
  return `<button class="ans-strip" id="ans-strip" type="button" hidden><span class="ans-strip-t">${u}${n > 1 ? ` · ${n} fit` : ""} · ${esc(siteName(sel.site))}</span><span class="ans-strip-go">View</span></button>`;
}
// Visibility is measured on scroll and resize, not with an IntersectionObserver: its callbacks were measured NOT
// to arrive in a throttled tab (the strip never appeared), and a strip that silently never shows is the failure
// this exists to prevent. getBoundingClientRect is synchronous, and one rect per scroll event is cheap.
let _stripUpdate = null;
function wireAnswerStrip() {
  if (_stripUpdate) { removeEventListener("scroll", _stripUpdate); removeEventListener("resize", _stripUpdate); _stripUpdate = null; }
  const strip = document.getElementById("ans-strip"), card = document.getElementById("answer");
  if (!strip || !card) return;
  strip.onclick = () => card.scrollIntoView({ behavior: "auto", block: "start" });
  _stripUpdate = () => { const r = card.getBoundingClientRect(); strip.hidden = r.top < innerHeight && r.bottom > 0; };
  addEventListener("scroll", _stripUpdate, { passive: true });
  addEventListener("resize", _stripUpdate);
  _stripUpdate();
}
```

- [ ] **Step 9: Where card hint**

In `app/app.js`, find exactly:

```js
  return card(cap, `<div class="difflist" id="difflist">${rows}</div>${near}${multi}${annot}${ruled}`, "where");
```

Replace with:

```js
  return card(cap, `<div class="difflist" id="difflist">${rows}</div>${near}${multi}${annot}${ruled}`, "where", "— every place that fits");
```

- [ ] **Step 10: Together card hint**

In `app/app.js`, find exactly:

```js
  return card(`Together <span class="oc-n">(${sites.length} sites)</span>`, courseCtrl + guard + srcLine + fits + disc, "together");
```

Replace with:

```js
  return card(`Together <span class="oc-n">(${sites.length} sites)</span>`, courseCtrl + guard + srcLine + fits + disc, "together", "— one disease, several places");
```

- [ ] **Step 11: Why card hint**

In `app/app.js`, find exactly:

```js
  return card("Why", `${umnlmn}${chain}${compare}${expected}${anatomy}`, "why");
```

Replace with:

```js
  return card("Why", `${umnlmn}${chain}${compare}${expected}${anatomy}`, "why", "— finding by finding, and what separates the places");
```

- [ ] **Step 12: What card hint (all sites)**

In `app/app.js`, find exactly:

```js
    return card(`What <span class="oc-n">(all sites)</span>`, shared + dem + remainder, "what");
```

Replace with:

```js
    return card(`What <span class="oc-n">(all sites)</span>`, shared + dem + remainder, "what", "— every cause, by onset");
```

- [ ] **Step 13: What card hint (one site)**

In `app/app.js`, find exactly:

```js
  return card("What", whatBlock(site), "what");
```

Replace with:

```js
  return card("What", whatBlock(site), "what", "— every cause, by onset");
```

- [ ] **Step 14: nextCard uses the shared resolution**

In `app/app.js`, replace everything from the line starting
`function nextCard(site, r, list) {`
up to (not including) the line starting `// `combined` distinguishes the two shapes nextBlock is fed` with:

```js
function nextCard(site, r, list) {
  // The SAME resolution the answer card uses (app/answer.js), so the badge, the Next line and this card can never
  // describe different plans. S.pinned is passed through — see the note in whatCard().
  const { nx, combined } = resolveNext({ site, r, pinned: S.pinned, scope: S.scope,
    selectedPathology: S.selectedPathology, selectedEntity: S.selectedEntity, onset: S.onset });
  const cap = combined ? `Next steps <span class="oc-n">(all sites)</span>` : "Next steps";
  return card(cap, nextBlock(nx, combined), "next", "— the full workup");
}
```

- [ ] **Step 15: The results CSS**

In `app/index.html`, insert immediately BEFORE the line `</style>`:

```css
  /* ===== ED first glance (spec 2026-09-27) ===== */
  /* the answer card: one line each, a key column keeps the lines scannable */
  .ans{margin-top:10px;}
  .ans-row{display:grid;grid-template-columns:52px minmax(0,1fr);gap:10px;padding:6px 0;border-top:1px solid var(--line);font-size:var(--fs-body);line-height:1.45;}
  .ans-k{font-size:var(--fs-cap);font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--faint);padding-top:2px;}
  .ans-v{color:var(--ink);min-width:0;}
  .ans-red{background:var(--red-bg);color:var(--ink);border-top-color:transparent;border-radius:8px;padding:7px 9px;margin-top:4px;}
  .ans-red .ans-k{color:var(--contra);font-size:var(--fs-body);letter-spacing:0;padding-top:0;}
  /* the detail sections are <details>, closed by default — undo the exam accordion's global details/summary rules */
  details.out-card{border:1px solid var(--line);}
  details.out-card:not([open]){padding-top:10px;padding-bottom:10px;}
  details.out-card>summary.out-cap{display:flex;align-items:baseline;gap:8px;padding:0;margin:0;cursor:pointer;list-style:none;}
  details.out-card[open]>summary.out-cap{margin-bottom:8px;}
  details.out-card>summary.out-cap::-webkit-details-marker{display:none;}
  details.out-card>summary.out-cap::after{content:"\203A";margin-left:auto;font-size:var(--fs-body);color:var(--faint);transition:transform .15s ease;}
  details.out-card[open]>summary.out-cap::after{transform:rotate(90deg);}
  .out-hint{font-size:var(--fs-meta);letter-spacing:0;text-transform:none;font-weight:400;color:var(--muted);}
  /* the phone strip: only below the single-column breakpoint, only while the answer card is out of view */
  .ans-strip{display:none;}
  @media (max-width:860px){
    .ans-strip:not([hidden]){display:flex;align-items:center;justify-content:space-between;gap:10px;position:fixed;left:12px;right:12px;
      bottom:calc(44px + env(safe-area-inset-bottom));z-index:20;font:inherit;font-size:var(--fs-body);font-weight:700;
      background:var(--navy);color:var(--paper);border:0;border-radius:12px;padding:10px 14px;box-shadow:var(--shadow-lift);cursor:pointer;text-align:left;}
    .ans-strip-t{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
    .ans-strip-go{flex:none;font-size:var(--fs-meta);text-decoration:underline;}
  }
```

- [ ] **Step 16: Run the source-scanning suites**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/app-smoke.test.js | tail -1
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/contrast.test.js | tail -1
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/brand.test.js | tail -1
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/combined-sites.test.js | tail -1
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/case-url.test.js | tail -1
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/answer.test.js | tail -1
```
Expected: all passed (prototype: 45 / 57 / 21 / 10 / 42 / 30). `app-smoke` parse-checks `app.js` — a syntax slip fails here, not silently in the browser.

- [ ] **Step 17: Verify in the browser** (`preview_start` with the `NeuroLocaliser app` config; pass the gate on localhost). Load each worked example from the empty state and check:
  1. **Wallenberg** — the card reads, in order: *Left lateral medulla. 1 other place also fits: Left hemimedulla.* / *Left face pain loss + left swallowing difficulty + right body pain loss → only the left medulla.* / *Most likely PICA / vertebral artery occlusion. Must not miss: Vertebral artery dissection.* / *Acute stroke team — hyperacute pathway; keep nil by mouth until swallow assessed.* / ⚑ *Swallowing can fail early — keep nil by mouth until assessed.* Badge EMERGENCY.
  2. The detail sections are closed, each with its hint; the section nav's **Why** opens Why and scrolls to it, and `location.hash` is unchanged (still `#f=…`).
  3. Open Why, then remove a finding chip: Why stays open.
  4. Select a cause in What: the What line reads *Selected: …*, and the badge, Next line and Next card all follow that cause's plan.
  5. **Two lesions** — Where: *No single place explains every finding — likely …*; What: *Together: Multiple sclerosis.*
  6. At 375px (`resize_window` mobile): with the page at the top the strip shows *Emergency · 2 fit · Lateral medullary syndrome…* above the safety bar; tapping it scrolls to the card and the hash is intact; with the card on screen the strip is hidden; at desktop width it never shows. **A hidden browser pane throttles scroll events** — take a screenshot to force a frame before reading the strip's state.
  7. Light and dark (`resize_window` colorScheme): the red-flag row and the closed cards are legible in both.
  8. `read_console_messages` shows no errors.

- [ ] **Step 18: Commit**

```bash
git add app/app.js app/index.html
git commit -m "feat: the answer card — one line each, detail closed below, and a phone strip

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: The input panel — plain rows, common first, follow-ups, onset and side, search

**Files:**
- Modify: `app/app.js`
- Modify: `app/index.html` (CSS)

**Interfaces:**
- Consumes: `PLAIN`, `plainLabel` (Task 2); `followUpLayout` (Task 3); `synonymHits` (Task 4); `tokensForRow` (Task 5); `VIEW` (Task 7).
- Produces (inside `app.js`): `setupRow()`, `syncTree()`, `frow(f, def = null)`, `sidesOf(f)`, `groupHead(node, cnt)`.

- [ ] **Step 1: Import the input modules**

In `app/app.js`, find exactly:

```js
import { offersFor } from "./sides.js";
import { answerFor, resolveNext } from "./answer.js";
```

Replace with:

```js
import { offersFor, tokensForRow } from "./sides.js";
import { answerFor, resolveNext } from "./answer.js";
import { PLAIN, plainLabel } from "./plain-labels.js";
import { followUpLayout } from "./follow-ups.js";
import { synonymHits } from "./synonyms.js";
```

- [ ] **Step 2: Chips, then the onset/side row, then search**

In `app/app.js`, find exactly:

```js
      <h3>Examination findings</h3>
      <input class="search" id="search" placeholder="Search findings… (e.g. Horner, ataxia, gaze)">
      <div class="chips" id="chips"></div>
```

Replace with:

```js
      <h3>Examination findings</h3>
      <div class="chips" id="chips"></div>
      <div class="setup" id="setup">${setupRow()}</div>
      <input class="search" id="search" placeholder="Search findings… (e.g. droopy eyelid, dizzy, foot drop)">
```

- [ ] **Step 3: setupRow, and sync the tree after the first render**

In `app/app.js`, find exactly:

```js
  wireLocalise();
  renderChips(); renderResults();
}
```

Replace with:

```js
  wireLocalise();
  renderChips(); renderResults(); syncTree();
}

// Onset and the symptoms' side, asked up front (spec 2026-09-27 §5.4). Onset writes the SAME S.onset the What
// card's select does. The side is a DEFAULT for row taps and lives in VIEW — it is how the reader enters findings,
// not a fact about the patient, so it never reaches the case URL. Worded as the BODY side, so nobody enters the
// side of the brain.
const ONSET_CHOICES = [["hyperacute", "Seconds–minutes"], ["acute", "Hours–days"], ["subacute", "Days–weeks"], ["chronic", "Weeks–years"]];
const SIDE_CHOICES = [["left", "Left"], ["right", "Right"], ["both", "Both"]];
function setupRow() {
  const btn = (attr, val, label, on) => `<button class="set${on ? " on" : ""}" ${attr}="${val}" aria-pressed="${on}">${label}</button>`;
  return `<div class="setup-row"><span class="setup-k">Started</span>${ONSET_CHOICES.map(([v, l]) => btn("data-onset", v, l, S.onset === v)).join("")}</div>
    <div class="setup-row"><span class="setup-k">Symptoms on</span>${SIDE_CHOICES.map(([v, l]) => btn("data-dside", v, l, VIEW.defaultSide === v)).join("")}</div>`;
}
```

- [ ] **Step 4: Groups: common rows, a less-common block, an entered count, follow-up slots**

In `app/app.js`, find exactly:

```js
function renderNode(node, depth) {
  const cnt = countFindings(node);
  if (node.findings) {
    const rows = node.findings.filter(f => FINDINGS[f]).map(f => frow(f)).join("");
    return `<details data-step="${esc(node.id)}" class="nx-lvl nx-lvl${depth}"><summary>${esc(node.label)}<span class="c">${cnt}</span></summary>${rows}</details>`;
  }
  const kids = (node.groups || []).map(g => renderNode(g, depth + 1)).join("");
  return `<details data-gid="${esc(node.id)}" class="nx-lvl nx-lvl${depth}"><summary>${esc(node.label)}<span class="c">${cnt}</span></summary><div class="nx-children">${kids}</div></details>`;
}
```

Replace with:

```js
// A group header says how many of its findings are ENTERED, so a closed group still shows it holds part of the
// case (spec 2026-09-27 §5.2); syncTree() fills the count in.
const groupHead = (node, cnt) => `<summary>${esc(node.label)}<span class="c-in" data-in></span><span class="c">${cnt}</span></summary>`;
function renderNode(node, depth) {
  const cnt = countFindings(node);
  if (node.findings) {
    // Common findings show; the rest sit behind "Less common (n)", named in its summary so nothing is hidden
    // without a trace. Each home row carries a slot its follow-ups render into (spec 2026-09-27 §5.3).
    const all = node.findings.filter(f => FINDINGS[f]);
    const less = all.filter(f => PLAIN[f] && PLAIN[f].less);
    const home = f => frow(f) + `<div class="fu-slot" data-slot="${f}"></div>`;
    const more = less.length
      ? `<details class="less"><summary><span class="less-k">Less common</span> <span class="c">${less.length}</span><span class="less-names">${less.map(f => esc(plainLabel(f))).join(", ")}</span></summary>${less.map(home).join("")}</details>`
      : "";
    return `<details data-step="${esc(node.id)}" class="nx-lvl nx-lvl${depth}">${groupHead(node, cnt)}${all.filter(f => !less.includes(f)).map(home).join("")}${more}</details>`;
  }
  const kids = (node.groups || []).map(g => renderNode(g, depth + 1)).join("");
  return `<details data-gid="${esc(node.id)}" class="nx-lvl nx-lvl${depth}">${groupHead(node, cnt)}<div class="nx-children">${kids}</div></details>`;
}
```

- [ ] **Step 5: Rows lead with plain words; syncTree**

In `app/app.js`, find exactly:

```js
function frow(f) {
  // data-t carries the token(s) a button toggles: "Both" enters two at once (app/sides.js explains why).
  const label = o => o.key === "none" ? "add" : o.key === "both" ? "Both" : sideTag(o.key);
  const btns = offersFor(f).map(o => `<button data-f="${f}" data-s="${o.key}" data-t="${o.tokens.join(" ")}">${label(o)}</button>`).join("");
  // The id stays in the title attribute — reachable for a bug report, off the screen for a clinician.
  return `<div class="frow" data-fid="${f}" title="${esc(f)} — ${esc(desc(f))}"><div class="nm"><span class="fd-primary">${esc(desc(f))}</span></div><div class="sides">${btns}</div></div>`;
}
```

Replace with:

```js
// A row leads with plain words and keeps the textbook description beneath it, so the tree still teaches the name
// (spec 2026-09-27 §5.2). The label is a button: a tap enters the finding on the default side — "Symptoms on", or
// for a follow-up its parent's side (`def`). The side buttons still override.
function frow(f, def = null) {
  // data-t carries the token(s) a button toggles: "Both" enters two at once (app/sides.js explains why).
  const label = o => o.key === "none" ? "add" : o.key === "both" ? "Both" : sideTag(o.key);
  const btns = offersFor(f).map(o => `<button data-f="${f}" data-s="${o.key}" data-t="${o.tokens.join(" ")}">${label(o)}</button>`).join("");
  const p = PLAIN[f] || {};
  const note = p.note ? ` <span class="fnote">— ${esc(p.note)}</span>` : "";
  // The id stays in the title attribute — reachable for a bug report, off the screen for a clinician.
  return `<div class="frow${def !== null ? " fu" : ""}" data-fid="${f}" title="${esc(f)} — ${esc(desc(f))}"><button type="button" class="nm" data-row="${f}"${def !== null ? ` data-def="${def}"` : ""}><span class="fd-primary">${esc(capFirst(plainLabel(f)))}${note}</span><span class="fd-tech">${esc(desc(f))}</span></button><div class="sides">${btns}</div></div>`;
}

// Follow-ups render into the slot under an ENTERED parent's row (spec 2026-09-27 §5.3). The tree is rendered once
// — its open groups and scroll survive a toggle — so this refills the slots, hides home rows the layout shows
// under a parent in the same group, keeps each "Less common" block honest about what is still in it, and writes
// each group's entered count.
const sidesOf = f => {
  const s = [...S.tokens].filter(t => fid(t) === f).map(t => t.split("@")[1]);
  return s.includes("left") && s.includes("right") ? "both" : s.includes("left") ? "left" : s.includes("right") ? "right" : s.includes("midline") ? "midline" : "";
};
function syncTree() {
  const acc = document.getElementById("acc"); if (!acc) return;
  const entered = new Set([...S.tokens].map(fid));
  const { under, hideHome } = followUpLayout(entered);
  // Recursive, because a follow-up can be a parent too (small pupil -> facial anhidrosis); the map is acyclic.
  const nested = parent => (under.get(parent) || []).map(k => frow(k, sidesOf(parent)) + nested(k)).join("");
  acc.querySelectorAll(".fu-slot").forEach(slot => { slot.innerHTML = nested(slot.dataset.slot); });
  acc.querySelectorAll(".frow:not(.fu)").forEach(r => { r.hidden = hideHome.has(r.dataset.fid); });
  acc.querySelectorAll("details.less").forEach(d => {
    const rows = [...d.querySelectorAll(":scope > .frow")];
    if (rows.some(r => entered.has(r.dataset.fid))) d.open = true;
    // A less-common finding shown under its parent is not in this block any more — its summary must not name it.
    const shown = rows.filter(r => !r.hidden);
    d.hidden = !shown.length;
    d.querySelector(":scope > summary .c").textContent = shown.length;
    d.querySelector(":scope > summary .less-names").textContent = shown.map(r => plainLabel(r.dataset.fid)).join(", ");
  });
  acc.querySelectorAll("details[data-step], details[data-gid]").forEach(d => {
    const ids = new Set([...d.querySelectorAll(".frow")].map(r => r.dataset.fid));
    const n = [...ids].filter(f => entered.has(f)).length;
    const el = d.querySelector(":scope > summary [data-in]");
    if (el) el.textContent = n ? `${n} entered` : "";
  });
  markSides();
}
```

- [ ] **Step 6: Wire the onset/side row and row taps**

In `app/app.js`, find exactly:

```js
  on("acc", "onclick", e => { const b = e.target.closest("button[data-t]"); if (!b) return;
    toggleTokens(b.dataset.t.split(" ")); });
  markSides();
```

Replace with:

```js
  on("setup", "onclick", e => {
    const o = e.target.closest("[data-onset]"), d = e.target.closest("[data-dside]");
    if (o) { S.onset = S.onset === o.dataset.onset ? "" : o.dataset.onset; renderResults(); }
    else if (d) { VIEW.defaultSide = VIEW.defaultSide === d.dataset.dside ? "" : d.dataset.dside; document.getElementById("setup").innerHTML = setupRow(); }
  });
  on("acc", "onclick", e => {
    const b = e.target.closest("button[data-t]");
    if (b) { toggleTokens(b.dataset.t.split(" ")); return; }
    const row = e.target.closest("button[data-row]");
    if (!row) return;
    // A follow-up takes its parent's side; any other row takes "Symptoms on".
    const toks = tokensForRow(row.dataset.row, row.dataset.def || VIEW.defaultSide);
    if (toks) { toggleTokens(toks); return; }
    // No default decides it: point at the side buttons rather than guess a side.
    const fr = row.closest(".frow");
    fr.classList.add("need-side");
    setTimeout(() => fr.classList.remove("need-side"), 900);
  });
  markSides();
```

- [ ] **Step 7: Search matches plain labels, notes and bedside phrases**

In `app/app.js`, find exactly:

```js
function filterFindings(q) {
  const acc = document.getElementById("acc");
  acc.querySelectorAll(".frow").forEach(r => {
    const f = r.dataset.fid; const hit = !q || f.includes(q) || desc(f).toLowerCase().includes(q);
```

Replace with:

```js
function filterFindings(q) {
  const acc = document.getElementById("acc");
  const syn = synonymHits(q);   // bedside phrases (app/synonyms.js), spec 2026-09-27 §5.5
  acc.querySelectorAll(".frow").forEach(r => {
    const f = r.dataset.fid, p = PLAIN[f] || {};
    const hit = !q || f.includes(q) || desc(f).toLowerCase().includes(q) || plainLabel(f).toLowerCase().includes(q)
      || (p.note || "").toLowerCase().includes(q) || syn.has(f);
```

- [ ] **Step 8: Clearing the search re-syncs the tree**

In `app/app.js`, find exactly:

```js
  if (!q) acc.querySelectorAll("details").forEach(d => { d.open = false; });
}
```

Replace with:

```js
  if (!q) { acc.querySelectorAll("details").forEach(d => { d.open = false; }); syncTree(); }
}
```

- [ ] **Step 9: A chip removal re-syncs the tree**

In `app/app.js`, find exactly:

```js
function toggleToken(tok) { S.tokens.has(tok) ? S.tokens.delete(tok) : S.tokens.add(tok); renderChips(); renderResults(); markSides(); syncLevelCtrls(); }
```

Replace with:

```js
function toggleToken(tok) { S.tokens.has(tok) ? S.tokens.delete(tok) : S.tokens.add(tok); renderChips(); renderResults(); syncTree(); syncLevelCtrls(); }
```

- [ ] **Step 10: A panel toggle re-syncs the tree**

In `app/app.js`, find exactly:

```js
  for (const t of toks) allOn ? S.tokens.delete(t) : S.tokens.add(t);
  renderChips(); renderResults(); markSides(); syncLevelCtrls();
```

Replace with:

```js
  for (const t of toks) allOn ? S.tokens.delete(t) : S.tokens.add(t);
  renderChips(); renderResults(); syncTree(); syncLevelCtrls();
```

- [ ] **Step 11: Chips in plain words**

In `app/app.js`, find exactly:

```js
<span class="sd">${sideTag(s)}</span>${esc(shortFindingLabel(f))}<span class="x" data-t="${t}">×</span></span>`; }).join("");
```

Replace with:

```js
<span class="sd">${sideTag(s)}</span>${esc(capFirst(plainLabel(f)))}<span class="x" data-t="${t}">×</span></span>`; }).join("");
```

- [ ] **Step 12: The onset row mirrors S.onset on every render**

In `app/app.js`, find exactly:

```js
function renderResults() {
  const el = document.getElementById("results");
```

Replace with:

```js
function renderResults() {
  const el = document.getElementById("results");
  const su = document.getElementById("setup"); if (su) su.innerHTML = setupRow();
```

- [ ] **Step 13: The input CSS**

In `app/index.html`, insert immediately BEFORE the line `/* the phone strip: only below the single-column breakpoint, only while the answer card is out of view */`:

```css
  /* exam rows: plain words first, the textbook name beneath; the label is a button (a tap enters the default side) */
  .frow .nm{flex:1;min-width:0;display:block;text-align:left;font:inherit;background:none;border:0;padding:0;color:inherit;cursor:pointer;}
  .frow .nm .fd-primary{display:block;}
  .frow .nm .fnote{font-weight:400;color:var(--muted);}
  /* one line: the full description stays in the row's title; three lines of it per row made the list dense again */
  .frow .nm .fd-tech{display:block;font-size:var(--fs-cap);color:var(--faint);line-height:1.35;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  /* .frow sets display:flex, which beats the UA's [hidden]{display:none} — without this a follow-up showed twice */
  .frow[hidden]{display:none;}
  .frow.fu{margin-left:14px;padding-left:10px;border-left:2px solid var(--line);}
  .frow.need-side .sides{outline:2px solid var(--gold);outline-offset:2px;border-radius:6px;}
  details.less{border-bottom:0;margin:2px 0 4px 10px;}
  details.less>summary{font-size:var(--fs-meta);font-weight:600;color:var(--muted);padding:5px 2px;justify-content:flex-start;gap:6px;}
  details.less .less-k{white-space:nowrap;}
  details.less[hidden]{display:none;}
  details.less .less-names{font-weight:400;color:var(--faint);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;}
  .c-in{margin-left:auto;margin-right:8px;font-size:var(--fs-cap);font-weight:700;color:var(--ipsi);}
  .c-in:empty{display:none;}
  /* onset + symptoms side, above the tree */
  .setup{display:flex;flex-direction:column;gap:6px;margin:0 0 10px;}
  .setup-row{display:flex;flex-wrap:wrap;align-items:center;gap:5px;font-size:var(--fs-meta);color:var(--muted);}
  .setup-k{min-width:84px;font-weight:700;}
  .set{font:inherit;font-size:var(--fs-meta);border:1px solid var(--line);background:var(--paper);color:var(--muted);border-radius:999px;padding:3px 10px;cursor:pointer;}
  .set.on{background:var(--sel-bg);color:var(--ink);border-color:var(--navy-2);}
```

- [ ] **Step 14: Run the full suite**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test > /tmp/nl-test.log 2>&1; echo exit=$?; grep -c '^PASS' /tmp/nl-test.log; grep '^FAIL' /tmp/nl-test.log
```
Expected: `exit=0`, no FAIL lines (prototype: 7003 PASS).

- [ ] **Step 15: Verify in the browser** (reload after each code change — a hash-only navigation does not re-run boot):
  1. The empty state shows chips/examples, then **Started** (Seconds–minutes · Hours–days · Days–weeks · Weeks–years) and **Symptoms on** (Left · Right · Both), then the search box, then the tree.
  2. Open *Cranial nerves › VIII*: rows read *Hearing loss* / *Vertigo* with a one-line grey description beneath; *Less common* names what it holds.
  3. Set **Symptoms on: Left**, tap the *Face droop* label (not a button): `facial_weakness@left` is entered; five follow-ups appear indented beneath it (*Forehead spared — upper motor neuron pattern*, *Forehead weak too*, …); none of them also shows on its own row in the same group.
  4. Tap the *Forehead weak too* label: `forehead_involved@left` is entered (the parent's side). Remove the face-droop chip: the follow-ups leave, and *Forehead weak too* is back on its home row, still entered.
  5. With no Symptoms-on set, tapping a two-sided row's label outlines its side buttons briefly and enters nothing.
  6. Load **Wallenberg**: *Cranial nerves* shows "5 entered"; under *Vertigo* the HINTS follow-ups appear; *Less common* under VIII counts 1 (anterior canal) — the horizontal-canal row is shown under Vertigo, not in the block.
  7. Search `dizzy`, `slurred speech`, `horner`, `droopy`, `foot drop`: each shows its finding(s); clearing the search closes the tree and restores follow-ups.
  8. Tap **Hours–days**: the What card's onset select changes too; change the select: the Started row follows.
  9. Chips read in plain words (*L Face pain loss*).
  10. 375px: the rows' side buttons are thumb-sized and the plain label wraps rather than overflowing.

- [ ] **Step 16: Commit**

```bash
git add app/app.js app/index.html
git commit -m "feat: the exam tree in plain words — common first, follow-ups, onset and side up front

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Release — v0.10.0 and the record

**Files:**
- Modify: `package.json` (`version`), `app/brand.js` (`VERSION`)
- Modify: `CLAUDE.md`
- Modify: `docs/superpowers/specs/2026-09-27-ed-first-glance-design.md` (status line)

- [ ] **Step 1: Bump the version** — `package.json` `"version": "0.9.0"` → `"0.10.0"`, and in `app/brand.js` `export const VERSION = "0.9.0";` → `export const VERSION = "0.10.0";` (`test/brand.test.js` asserts they match, so a feedback email names the new build).

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/brand.test.js
```
Expected: all passed.

- [ ] **Step 2: Record it in `CLAUDE.md`** — add a section after "## Integrated Why (DONE 2026-09-26)":

```markdown
## ED first glance (DONE <date>) — sub-project 3 of the 2026-09-25 request

**Testers said the app was "too advanced and going over their heads"** (owner, 2026-09-25); the owner named the
AMOUNT OF OUTPUT. The results now open on ONE ANSWER CARD — Where / Why / What / Next + the site's red-flag
sentence, every line DERIVED (`app/answer.js`) — with the four detail cards CLOSED below in the same order (the
2026-08-16 no-tabs ruling holds: Why's gist is on the card). The input stays the examination tree (owner reversed
a complaint-first design the same day) but leads with plain words (`app/plain-labels.js`, all 234 findings,
owner-reviewed), shows common findings first, opens FOLLOW-UPS under a ticked finding (`app/follow-ups.js` — TRUE
REFINEMENTS ONLY, owner ruling), asks onset and "Symptoms on" up front, and searches bedside phrases
(`app/synonyms.js`). `whyClues()` picks the fewest entered findings that pin the place, against the DIFFERENTIAL
(station overlap stalled on 12/249 sites). Phones get a strip pinned to the bottom while the card is off screen —
scroll-measured, because an IntersectionObserver never fired in a throttled tab. `VIEW` (open sections, default
side) never enters the case URL. Version 0.10.0. Spec/plan: `docs/superpowers/specs/2026-09-27-ed-first-glance-design.md`,
`docs/superpowers/plans/2026-09-27-ed-first-glance.md`.
```

Also update the suite count in the "Status (current)" line near the top of `CLAUDE.md` to the figure `npm test` now reports (count the PASS lines).

- [ ] **Step 3: Mark the spec and this plan implemented** — spec status line → `**Status: IMPLEMENTED (<date>) on feat/ed-first-glance.**`; this plan's status line → `**Status: IMPLEMENTED (<date>).**`

- [ ] **Step 4: Full suite, then commit**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test > /tmp/nl-test.log 2>&1; echo exit=$?; grep -c '^PASS' /tmp/nl-test.log
```
Expected: `exit=0`.

```bash
git add package.json app/brand.js CLAUDE.md docs/superpowers/specs/2026-09-27-ed-first-glance-design.md docs/superpowers/plans/2026-09-27-ed-first-glance.md
git commit -m "docs: ED first glance recorded; v0.10.0

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 5: Hand back for merge.** Do not push or open a PR without the owner's go-ahead (a push to `main` auto-deploys to the testers). Use superpowers:finishing-a-development-branch.

---

## Prototype findings (2026-09-27) — already fixed in the code above

1. **Clue selection by station overlap stalled on 12/249 sites** (brachial-plexus cords, compressive CN III): each finding could arise in the plexus or a nerve, but no single nerve carries both. `whyClues()` chooses against the explain-all differential instead — 365/365 site pictures and 85/85 vignettes reach their place.
2. **A both-sides finding must be ONE clue with no side relation**, or the known-negative rule reads one side as the other side confirmed normal, and the crossed-completion rule mis-fires.
3. **`.frow{display:flex}` beats the UA's `[hidden]{display:none}`** — a follow-up showed twice until `.frow[hidden]{display:none}` was added. The same trap is handled for the strip (`:not([hidden])`) and the less-common block.
4. **`IntersectionObserver` callbacks never arrived in a throttled tab**, so the strip never appeared; it is now measured on scroll/resize with `getBoundingClientRect()`, and set once at wire time.
5. **The strip truncated away the urgency** ("Lateral medullary syndrome (Wallenberg) …"); the urgency now leads.
Also caught: `hyperreflexia` was redundant with its own description (the synonyms suite rejects that class); labels with commas read as two findings in the "Less common" summary (labels are now comma-free, asserted).

**One output for the owner to judge in review:** the cauda equina worked example's Why line is *"Sciatica-type root pain → only the cauda equina."* It is derived — in the model only the cauda produces MIDLINE (bilateral) root pain — but a reader may expect saddle anaesthesia or sphincter dysfunction as the clue. If the owner wants that changed, it is a question about the model's midline radicular pain, not about this plan.

---

## Execution log — deviations from the plan above

**Review round 1 (2026-09-29) changed the model, not just the labels** — recorded here because Tasks 5–8 below were
written before it. Commits `8952bd9`, `bf91b3e`; suite `test/vocab-rulings.test.js` pins every ruling.

1. **`app/plain-labels.js` gained `term`** (the proper name) and **`displayLabel(f)`** = `"plain (proper)"`. The owner
   ruled every label carries its proper name in brackets. **Wherever Tasks 6–8 use `plainLabel()` for something SHOWN
   (rows, chips, the "Less common" names, the Why line), use `displayLabel()`**; keep `plainLabel()` only inside search
   matching (search also matches `term`). Task 6's expected Why strings change accordingly — recompute them from the
   real output rather than hand-editing.
2. **Brisk reflexes (`hyperreflexia`) replace `umn_signs`** and are produced along the corticospinal tract (not the
   combined degenerations); the conus and the basis pontis predict brisk reflexes and an up-going plantar.
3. **`plantar_flexor` (down-going plantar) is the engine's first EXPLICIT NORMAL** (`EXPLICIT_NORMAL` in
   `findings.js`). It DEMOTES — `normalNegatives()` + the `against` key in `differential()` — and never excludes. It is
   stripped before matching; `isNormalToken()` is exported from `inverse.js`; `app.js` already excludes it from
   `total` and shows a message when only normals are entered; the Where rows show "less likely — would give …".
   **Task 5:** in the new `tokensForRow` block of `test/side-offers.test.js`, skip `EXPLICIT_NORMAL` findings in the
   "returns nothing" check (a normal alone localises nothing by design) — `EXPLICIT_NORMAL` is already imported there.
4. **`thalamic_pain` is removed; `autonomic_features` is five findings** (dry mouth, constipation, erectile
   dysfunction, labile blood pressure, arrhythmia), each predicted by Lambert-Eaton and acute GBS, in the Autonomic group.
5. **`app.js` already imports `displayLabel`** (for the Where rows). Task 8 Step 1 adds `PLAIN` and the rest — import
   `displayLabel` there once, not twice.
6. The anatomy sheet is at 594/594 rows (hand-edited, id-verified).

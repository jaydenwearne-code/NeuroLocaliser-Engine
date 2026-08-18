# Worked Examples Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the Localise mode four one-click worked examples that each demonstrate a different output card, and delete the stale empty-state copy that promises examples the app does not have.

**Architecture:** `app/examples.js` holds the four cases as pure data. `app/app.js` renders them as a row in the findings pane, visible only while no findings are entered, and clicking one sets `S` and re-renders. `test/examples.test.js` asserts each example still produces the behaviour it claims.

**Tech Stack:** Zero-dependency ES modules, no build step, no test framework. Each test file is a standalone script asserting with a local `ok(label, cond)` helper and exiting non-zero on failure.

## Global Constraints

- **Runtime:** prefix every command `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"`.
- **Baseline:** 65 suites / 3680 assertions green on `main`. Any failure is a real regression.
- **No `src/` changes.** No case-URL schema change — examples reuse it as-is.
- **Register the new suite** in the `test` script in `package.json`.
- **Terracotta allowlist still applies** (`test/brand.test.js`): new CSS may not use `var(--terra)`.
- **Commit messages** end with: `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`
- **Spec:** `docs/superpowers/specs/2026-08-16-worked-examples-design.md`.

## Verified token sets

Derived from each site's `expectedFindings`, then trimmed to a realistic bedside subset, and **measured**:

| Example | Tokens | Measured |
|---|---|---|
| Wallenberg | `cn8_vertigo@left`, `face_pain_loss@left`, `spinothalamic@right`, `ptosis@left`, `miosis@left`, `limb_ataxia@left` | 6/6 → Lateral medullary syndrome, 2 candidates, emergency |
| Foot drop | `weak_ankle_dorsiflexion@left`, `weak_great_toe_extension@left`, `weak_foot_eversion@left` | 3 candidates: common peroneal, L5 radiculopathy, sacral plexopathy |
| Cauda equina | `saddle_anaesthesia@midline`, `sphincter_dysfunction@midline`, `radicular_pain@midline`, `anal_wink_loss@midline` | 4/4 → Cauda equina syndrome, 1 candidate, emergency |
| Two lesions | `weak_arm@right`, `weak_leg@left` (+ `course: "relapsing"`) | 4 candidates, minimal cover = 2 sites |

## File Structure

| File | Responsibility |
|---|---|
| `app/examples.js` **(create)** | `EXAMPLES` — the four cases as pure data. No DOM. |
| `test/examples.test.js` **(create)** | Behaviour invariants: each example still teaches its point. |
| `app/app.js` **(modify)** | Render the row in the empty state; wire clicks; delete the stale copy. |
| `app/index.html` **(modify)** | Styles for the row. |
| `package.json` **(modify)** | Register the suite. |
| `CLAUDE.md`, spec **(modify)** | Record the increment. |

---

### Task 1: `app/examples.js` and its behaviour invariants

**Files:**
- Create: `app/examples.js`, `test/examples.test.js`
- Modify: `package.json`

**Interfaces:**
- Consumes: nothing.
- Produces: `EXAMPLES: Array<{id: string, label: string, teaches: string, tokens: string[], onset?: string, course?: string}>`. Task 2 renders it.

- [ ] **Step 1: Write the failing test**

Create `test/examples.test.js`:

```js
// examples.test.js — the worked examples must keep TEACHING WHAT THEY CLAIM. This is not ceremony: the
// first hand-typed token sets were wrong (Wallenberg resolved to Marie-Foix explaining 2 of 5), and the
// anatomy/causes tables are actively edited. A worked example that silently teaches the wrong thing is
// worse than none, so every assertion here is about BEHAVIOUR — candidate counts, urgency, cover size —
// not merely that the tokens parse.
import { EXAMPLES } from "../app/examples.js";
import { FINDINGS } from "../src/model/findings.js";
import { solve } from "../src/engine/inverse.js";
import { nextStepsFor } from "../src/data/nextSteps.js";
import { combinedSites } from "../app/combined-sites.js";

let pass = 0, fail = 0;
const log = [];
const ok = (label, cond, detail) => { log.push({ label, ok: !!cond, detail }); cond ? pass++ : fail++; };
const byId = id => EXAMPLES.find(e => e.id === id);
const run = ex => solve(new Set(ex.tokens), { dominantSide: "left" });

// ---- shape ----
ok("there are four examples", EXAMPLES.length === 4, String(EXAMPLES.length));
ok("every example has an id, a label and a teaches line",
   EXAMPLES.every(e => e.id && e.label && e.teaches));
ok("example ids are unique", new Set(EXAMPLES.map(e => e.id)).size === EXAMPLES.length);
{
  const bad = [];
  for (const e of EXAMPLES) for (const t of e.tokens) {
    const [f, side] = t.split("@");
    if (!f || !side) { bad.push(`${e.id}: malformed ${t}`); continue; }
    if (!Object.prototype.hasOwnProperty.call(FINDINGS, f)) bad.push(`${e.id}: unknown finding ${f}`);
  }
  ok("every token is a real finding, correctly formed as finding@side", !bad.length, bad.slice(0, 5).join(" | "));
}

// ---- WHERE: an eponym emerges from anatomy ----
{
  const ex = byId("wallenberg"); const r = run(ex); const top = r.display[0];
  ok("wallenberg resolves to the lateral medulla", /medulla/.test(top.site.level) && top.site.part === "lateral",
     `${top.site.level}|${top.site.part}`);
  ok("wallenberg explains every finding entered", top.n === ex.tokens.length, `${top.n}/${ex.tokens.length}`);
}

// ---- THE NARROWING: it must stay genuinely ambiguous, or it stops teaching ----
{
  const ex = byId("footdrop"); const r = run(ex);
  ok("foot drop leaves at least 3 candidates", r.display.length >= 3, String(r.display.length));
  const ids = r.display.map(c => c.site.id);
  ok("foot drop offers BOTH an L5 root and a peroneal nerve — the discrimination it teaches",
     ids.some(i => /root_l5/.test(i)) && ids.some(i => /peroneal/.test(i)), ids.slice(0, 4).join(", "));
  // and adding one discriminator must actually narrow it
  const narrowed = solve(new Set([...ex.tokens, "deep_peroneal_sensory@left"]), { dominantSide: "left" });
  ok("adding a discriminator narrows foot drop to fewer candidates",
     narrowed.display.length < r.display.length, `${r.display.length} -> ${narrowed.display.length}`);
}

// ---- NEXT STEPS: the emergency ----
{
  const ex = byId("cauda"); const r = run(ex); const top = r.display[0];
  ok("cauda equina is an emergency", nextStepsFor(top.site).urgency === "emergency",
     nextStepsFor(top.site).urgency);
  ok("cauda equina explains every finding entered", top.n === ex.tokens.length, `${top.n}/${ex.tokens.length}`);
}

// ---- TOGETHER: the cross-site card must actually render ----
{
  const ex = byId("twolesions"); const r = run(ex);
  const cover = combinedSites(r, r.display, new Set());
  ok("two-lesion example yields a cover of at least 2 sites — so the Together card renders",
     cover.sites.length >= 2, String(cover.sites.length));
}

console.log("\nNeuroLocaliser — WORKED EXAMPLES\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}${r.detail ? "  → " + r.detail : ""}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run test to verify it fails**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/examples.test.js
```

Expected: FAIL — `Cannot find module .../app/examples.js`.

- [ ] **Step 3: Write the implementation**

Create `app/examples.js`:

```js
// examples.js — four worked cases, as pure data. Content lives here rather than in app.js so it can be
// unit-tested and clinically reviewed without reading UI code (same split as exam-map.js).
//
// CHOSEN SO EACH DEMONSTRATES A DIFFERENT OUTPUT CARD, not to be the four commonest presentations:
// where / the narrowing / next steps / together.
//
// The tokens are DERIVED from each site's own expectedFindings and then trimmed to a realistic bedside
// subset — hand-typing them produced a Wallenberg that resolved to Marie-Foix explaining 2 of 5 findings.
// test/examples.test.js asserts each one still teaches its point; do not edit tokens without running it.
export const EXAMPLES = [
  {
    id: "wallenberg",
    label: "Wallenberg",
    teaches: "one lesion, an eponym",
    // The full syndrome is 13 findings, which nobody records at the bedside. This is the clinically
    // representative six and still resolves 6/6.
    tokens: ["cn8_vertigo@left", "face_pain_loss@left", "spinothalamic@right",
             "ptosis@left", "miosis@left", "limb_ataxia@left"],
    onset: "hyperacute",
  },
  {
    id: "footdrop",
    label: "Foot drop",
    teaches: "narrow it down",
    // DELIBERATELY only the findings L5 and peroneal SHARE, so three candidates appear and none wins.
    // Adding weak hip abduction pins the root; adding deep peroneal sensory loss pins the nerve.
    tokens: ["weak_ankle_dorsiflexion@left", "weak_great_toe_extension@left", "weak_foot_eversion@left"],
  },
  {
    id: "cauda",
    label: "Cauda equina",
    teaches: "an emergency",
    tokens: ["saddle_anaesthesia@midline", "sphincter_dysfunction@midline",
             "radicular_pain@midline", "anal_wink_loss@midline"],
    onset: "acute",
  },
  {
    id: "twolesions",
    label: "Two lesions",
    teaches: "one disease, two places",
    tokens: ["weak_arm@right", "weak_leg@left"],
    onset: "subacute",
    course: "relapsing",
  },
];
```

- [ ] **Step 4: Run the test, then register the suite and run everything**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/examples.test.js
```

Expected: PASS, 11 assertions.

Then in `package.json` append to the end of the `test` script chain:

```
 && node test/examples.test.js
```

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test
```

Expected: exit 0, now 66 suites.

- [ ] **Step 5: Commit**

```bash
git add app/examples.js test/examples.test.js package.json
git commit -m "feat(app): four worked examples, each teaching a different card

Tokens derived from each site's expectedFindings then trimmed to a
realistic bedside subset. Every example asserts the BEHAVIOUR it claims
- candidate counts, urgency, cover size - because hand-typed tokens were
wrong first time and the anatomy tables are actively edited.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Render the row and delete the stale copy

**Files:**
- Modify: `app/app.js:194` (`renderChips` empty branch), plus a click handler
- Modify: `app/index.html` (styles)

**Interfaces:**
- Consumes: `EXAMPLES` from Task 1.
- Produces: no exports.

- [ ] **Step 1: Import the examples**

In `app/app.js`, after the `./brand.js` import:

```js
import { EXAMPLES } from "./examples.js";
```

- [ ] **Step 2: Replace the stale empty state**

`app/app.js` currently reads:

```js
  if (!S.tokens.size) { el.innerHTML = `<span class="fd" style="color:var(--faint);font-size:11.5px">No findings yet — tick from the exam steps, or try a worked example above.</span>`; return; }
```

That copy promises examples that have not existed since presets were removed. Replace with:

```js
  if (!S.tokens.size) {
    // The on-ramp, not furniture: it is only ever shown while the pane is empty, and disappears the moment
    // the user enters anything. The old copy promised "a worked example above" that did not exist.
    el.innerHTML = `<div class="egs"><span class="egs-lead">No findings yet — tick from the exam steps, or start from a case:</span>
      <div class="egs-row">${EXAMPLES.map(e =>
        `<button class="eg" data-eg="${esc(e.id)}"><b>${esc(e.label)}</b><span>${esc(e.teaches)}</span></button>`
      ).join("")}</div></div>`;
    el.onclick = e => { const b = e.target.closest("[data-eg]"); if (b) loadExample(b.dataset.eg); };
    return;
  }
```

- [ ] **Step 3: Add the loader**

Add above `renderChips()` in `app/app.js`:

```js
// Loading an example is just setting state — it round-trips through the case URL like any hand-entered
// case, so a tester can share the exact example they were looking at.
function loadExample(id) {
  const ex = EXAMPLES.find(e => e.id === id); if (!ex) return;
  S.tokens = new Set(ex.tokens);
  S.onset = ex.onset || "";
  S.course = ex.course || "";
  S.selected = undefined;
  S.pinned = new Set();
  S.scope = "site";
  renderLocalise();
}
```

`renderLocalise()` rather than a narrower re-render, because an example may introduce a cord finding and
therefore need the sensory-level inputs mounted.

- [ ] **Step 4: Style the row**

Append to `app/index.html`, before `/* code-stroke worksheet */`. **No `var(--terra)`** — the allowlist
test forbids it.

```css
  /* worked examples: the empty-state on-ramp */
  .egs{margin-bottom:4px;}
  .egs-lead{display:block;font-size:var(--fs-meta);color:var(--faint);margin-bottom:7px;}
  .egs-row{display:flex;flex-wrap:wrap;gap:6px;}
  .eg{display:flex;flex-direction:column;align-items:flex-start;gap:1px;font:inherit;text-align:left;
    border:1px solid var(--line);background:var(--paper);border-radius:9px;padding:6px 10px;cursor:pointer;
    transition:border-color .12s,background .12s;}
  .eg b{font-size:var(--fs-meta);font-weight:700;color:var(--ink);}
  .eg span{font-size:var(--fs-cap);color:var(--faint);}
  .eg:hover{border-color:var(--navy-2);background:var(--band);}
  @media (max-width:560px){ .eg{flex:1 1 45%;} }
```

- [ ] **Step 5: Verify in the browser**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node app/serve.mjs
```

At `http://localhost:8137/app/` with no findings: the four buttons appear. Click **Foot drop** → three
candidates, none winning. Add *weak hip abduction* from the Motor section → it narrows. Click **Cauda
equina** → EMERGENCY. Click **Two lesions** → the Together card renders. Confirm the row **disappears**
once findings are present, and that the URL hash updates so the example is shareable.

- [ ] **Step 6: Run the full suite and commit**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test
git add app/app.js app/index.html
git commit -m "feat(app): worked-example row replaces the stale empty state

The copy promised 'a worked example above' that has not existed since
presets were removed. Four buttons now sit in the empty findings pane
and disappear once the user starts. Loading one is just setting state,
so it round-trips through the case URL and is shareable.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Documentation

**Files:**
- Modify: `CLAUDE.md`, `docs/superpowers/specs/2026-08-16-worked-examples-design.md`

- [ ] **Step 1: Mark the spec implemented**

Change `**Status:**` to `**Status:** implemented 2026-08-16`.

- [ ] **Step 2: Add to CLAUDE.md**

Insert before `## Commands`:

```markdown
## Worked examples (DONE 2026-08-16)

Four one-click cases in the Localise empty state, in `app/examples.js` (pure data). They **replace stale
copy** that had promised "a worked example above" ever since presets were removed in the 2026-07-25 UI
restructure.

Chosen so **each demonstrates a different output card**, not to be the four commonest presentations:
Wallenberg → *Where*; **Foot drop → the narrowing**; Cauda equina → *Next steps*; Two lesions → *Together*.

**Foot drop is the important one:** it loads ONLY the findings L5 and peroneal share, so three candidates
appear and none wins — adding weak hip abduction pins the root, adding deep peroneal sensory pins the
nerve. The interaction model demonstrated rather than described.

**`test/examples.test.js` asserts BEHAVIOUR, not just that tokens parse** — candidate counts, urgency,
cover size. Hand-typed tokens were wrong first time (Wallenberg resolved to Marie-Foix explaining 2 of 5),
and the anatomy tables are actively edited, so a worked example could silently start teaching the wrong
thing. Tokens are derived from each site's `expectedFindings`, then trimmed to a realistic bedside subset.

Spec/plan: `docs/superpowers/specs/2026-08-16-worked-examples-design.md`,
`docs/superpowers/plans/2026-08-16-worked-examples.md`.
```

- [ ] **Step 3: Final verification and commit**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test
git add CLAUDE.md docs/
git commit -m "docs: record the worked examples

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Verification checklist

- [ ] `npm test` exits 0 with **66 suites**.
- [ ] `grep -c "worked example above" app/app.js` returns **0**.
- [ ] The row is absent once any finding is entered.
- [ ] Clicking an example updates the URL hash, and reloading that URL restores the same case.
- [ ] Both colour schemes and the ≤560px breakpoint.
- [ ] `test/brand.test.js` still passes — no new `var(--terra)`.

# App UI Clarity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-rank the NeuroLocaliser UI so a trainee can follow the reasoning and a time-poor ED clinician can jump to what they need — by speaking clinical English instead of schema, moving controls to the cards they act on, and giving the page a type hierarchy — without removing any information.

**Architecture:** Everything is `app/`-layer. A new pure, DOM-free module `app/labels.js` owns display naming (sites and findings) and is unit-tested directly, following the pattern already set by `app/combined-sites.js`, `app/together-guard.js` and `app/case-url.js`. `app/app.js` and `app/index.html` consume it. No file under `src/` is touched, so no localisation result can change.

**Tech Stack:** Zero-dependency ES modules, no build step, no test framework. Each test file is a standalone script asserting with a local `ok(label, cond)` helper and exiting non-zero on failure.

## Global Constraints

- **Runtime:** this machine has no system Node. Prefix every command:
  `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"`
- **Baseline to preserve:** 63 suites / 3611 assertions, all green. Verified 2026-08-16 before this plan. Any failure is a real regression.
- **No `src/` changes.** The engine, anatomy tables and clinical content are out of scope. If a task appears to need one, stop and raise it.
- **No case-URL schema changes.** `encodeCase`/`decodeCase` in `app/case-url.js` keep their exact field set (`f o c m s dom sl dr p`), so previously shared case URLs keep resolving.
- **`S` stays the single source of truth.** A control may be unmounted while its state is set; the value must still serialise into the URL.
- **Both colour schemes must keep working** — `@media (prefers-color-scheme:dark)` plus the `:root[data-theme=…]` overrides in `app/index.html`.
- **Every new test file must be registered** in the `test` script in `package.json` and appended to the chain in order.
- **`PART_LABEL` and any clinical wording is content** — flag it for the owner's review, never assume.
- **Commit messages** end with:
  `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`
- **Spec:** `docs/superpowers/specs/2026-08-16-app-ui-clarity-design.md`.

## File Structure

| File | Responsibility |
|---|---|
| `app/labels.js` **(create)** | Pure display naming: `ABBREV`, `PART_LABEL`, `humanisePart()`, `siteLabel()`, `plainSiteName()`, `shortFindingLabel()`. No DOM, no engine mutation. |
| `test/app-naming.test.js` **(create)** | Invariants over `app/labels.js` across every site from `candidateSites()` and every id in `FINDINGS`. |
| `app/app.js` **(modify)** | Consume `labels.js`; relocate controls; section nav; single scope control; unified demotion component; What-card density. |
| `app/index.html` **(modify)** | CSS only: four-step type ramp, calmer surfaces, section-nav and urgency-pill styles. |
| `test/app-smoke.test.js` **(modify)** | Add the control-relocation round-trip regression guard. |
| `package.json` **(modify)** | Register `test/app-naming.test.js`. |
| `CLAUDE.md` **(modify)** | Record the increment. |

## Key facts the implementer needs

**Part names are reused across levels.** Measured: 202 distinct `${level}|${part}` keys but only 192 distinct parts — `lateral` spans midbrain/pons/medulla/cord/hypothalamus, `hemi` spans midbrain/pons/medulla/cord, `medial` spans midbrain/pons/medulla, `anterior` spans cord/corpus_callosum. **`PART_LABEL` MUST be keyed `${level}|${part}`, never by part alone** — the same rule `src/model/vascular.js` and `src/model/topography.js` already follow, for the same reason.

**`nameForSite()` already returns an eponym for most sites.** Only 52 of 377 candidate sites (14%, but 18% of *common* sites) hit its fallback at `src/data/syndromes.js:982`. Eponyms must keep winning the headline; the new labels supply the plain-anatomy subtitle everywhere and the headline only for those 52.

**Finding descriptions are teaching sentences, not labels.** All 233 findings have a `desc`, but they run to full sentences (`papilloedema` is 130 characters). The chip needs a short label with the full `desc` in a `title` attribute.

---

### Task 1: Mechanical part humanisation

**Files:**
- Create: `app/labels.js`
- Create: `test/app-naming.test.js`
- Modify: `package.json:7`

**Interfaces:**
- Consumes: nothing.
- Produces: `ABBREV: Record<string,string>` and `humanisePart(part: string) -> string`. Task 2 builds `siteLabel()` on top of both.

- [ ] **Step 1: Write the failing test**

Create `test/app-naming.test.js`:

```js
// app-naming.test.js — display-naming invariants (app/labels.js). The app must speak clinical English:
// no raw ids, no un-expanded abbreviations, no underscores on screen.
import { ABBREV, humanisePart } from "../app/labels.js";

let pass = 0, fail = 0;
const log = [];
const ok = (label, cond, detail) => { log.push({ label, ok: !!cond, detail }); cond ? pass++ : fail++; };

// ---- humanisePart: underscores become spaces, known abbreviations expand ----
ok("splits underscores into words", humanisePart("frontal_eye_field") === "frontal eye field");
ok("leaves a single plain word alone", humanisePart("insula") === "insula");
ok("expands a lowercase vascular abbreviation to uppercase", humanisePart("aca") === "ACA");
ok("expands an abbreviation inside a compound", humanisePart("iii_orbit_sup").includes("superior"));
ok("expands dlpfc to words", humanisePart("dlpfc") === "dorsolateral prefrontal");
ok("never returns an underscore", !humanisePart("anterior_choroidal").includes("_"));
ok("ABBREV keys are all lowercase, no underscores",
   Object.keys(ABBREV).every(k => k === k.toLowerCase() && !k.includes("_")));

console.log("\nNeuroLocaliser — DISPLAY NAMING\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}${r.detail ? "  → " + r.detail : ""}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run test to verify it fails**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/app-naming.test.js
```

Expected: FAIL — `Cannot find module .../app/labels.js`.

- [ ] **Step 3: Write minimal implementation**

Create `app/labels.js`:

```js
// labels.js — DISPLAY naming only. Pure and DOM-free so it can be unit-tested directly (same pattern as
// combined-sites.js / together-guard.js). The engine speaks ids; this module is the one place that turns
// them into words a clinician reads. Ids still travel in the case URL and the feedback payload untouched.

// Word-level expansions applied to every underscore-separated token of a part id. Keys are lowercase and
// contain no underscore (asserted in test/app-naming.test.js) — they are matched per WORD, not per id.
export const ABBREV = {
  aca: "ACA", mca: "MCA", pca: "PCA", pica: "PICA", aica: "AICA", sca: "SCA",
  cpa: "cerebellopontine angle", iam: "internal acoustic meatus",
  dlpfc: "dorsolateral prefrontal", pfc: "prefrontal", mlf: "MLF", aras: "ARAS",
  vpm: "VPM", vpl: "VPL", scm: "sternocleidomastoid",
  sup: "superior", inf: "inferior", lat: "lateral", med: "medial", fem: "femoral",
  iii: "III", iv: "IV", vi: "VI", ix: "IX", xi: "XI", xii: "XII",
  cn3: "CN III", cn4: "CN IV", cn6: "CN VI", cn7: "CN VII",
};

// A dermatome/root token like "c5" / "t10" / "l4" / "s2" — uppercase the letter, keep the number.
const ROOT_RE = /^([clts])(\d{1,2})$/;

export function humanisePart(part) {
  return String(part).split("_").map(w => {
    if (ABBREV[w]) return ABBREV[w];
    const m = ROOT_RE.exec(w);
    if (m) return m[1].toUpperCase() + m[2];
    return w;
  }).join(" ");
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/app-naming.test.js
```

Expected: PASS — `7 passed, 0 failed`.

- [ ] **Step 5: Register the suite**

In `package.json:7`, append to the end of the `test` script chain:

```
 && node test/app-naming.test.js
```

- [ ] **Step 6: Run the full suite**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test
```

Expected: exit 0. Suite count rises 63 → 64.

- [ ] **Step 7: Commit**

```bash
git add app/labels.js test/app-naming.test.js package.json
git commit -m "feat(app): mechanical part-id humanisation

Word-level abbreviation expansion + root-token casing, as the base for
clinical site labels. Pure and DOM-free, unit-tested directly.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: The `PART_LABEL` table and the clean-label invariant

**⚠ This is the review-gated task.** The table is ~202 anatomical labels and a wrong entry mislabels a lesion on the result headline. Author it to the same bar as the causes content, and flag anything uncertain for the owner rather than guessing.

**Files:**
- Modify: `app/labels.js`
- Modify: `test/app-naming.test.js`

**Interfaces:**
- Consumes: `ABBREV`, `humanisePart()` from Task 1.
- Produces: `PART_LABEL: Record<string, string>` keyed `` `${level}|${part}` `` and `siteLabel(site) -> string`, returning a complete plain-anatomy phrase with no side word (e.g. `"leg motor cortex"`, `"lateral medulla"`). Task 3 composes `plainSiteName()` from it.

- [ ] **Step 1: Write the failing test**

Append to `test/app-naming.test.js`, above the `console.log` block:

```js
import { PART_LABEL, siteLabel } from "../app/labels.js";
import { candidateSites } from "../src/engine/inverse.js";

const SITES = candidateSites();

// ---- PART_LABEL keying: level|part, NEVER part alone ----
// 4 part names are reused across levels (lateral spans 5, hemi spans 4, medial 3, anterior 2), exactly the
// trap src/model/vascular.js and topography.js document. A bare-part key would give lateral medulla and
// lateral midbrain one shared label.
ok("every PART_LABEL key is `level|part`",
   Object.keys(PART_LABEL).every(k => k.includes("|") && k.split("|").length === 2));
{
  const known = new Set(SITES.map(s => `${s.level}|${s.part}`));
  const orphan = Object.keys(PART_LABEL).find(k => !known.has(k));
  ok("no PART_LABEL key is dead (every key names a real site)", !orphan, orphan);
}

// ---- the clean-label invariant, over every reachable site ----
{
  const seen = new Set(); const bad = [];
  for (const s of SITES) {
    const k = `${s.level}|${s.part}`;
    if (seen.has(k)) continue; seen.add(k);
    const label = siteLabel(s);
    if (!label || !label.trim()) { bad.push(`${k}: empty`); continue; }
    if (label.includes("_")) bad.push(`${k}: underscore in "${label}"`);
    // an un-expanded abbreviation: a whole word that is a key of ABBREV
    const stray = label.split(/\s+/).find(w => ABBREV[w.toLowerCase()] && w !== ABBREV[w.toLowerCase()]);
    if (stray) bad.push(`${k}: un-expanded "${stray}" in "${label}"`);
    // the level word must not appear twice ("motor leg cortex cortex")
    const words = label.toLowerCase().split(/\s+/);
    if (words.length !== new Set(words).size) bad.push(`${k}: repeated word in "${label}"`);
  }
  ok(`every site key yields a clean label (${seen.size} keys)`, !bad.length, bad.slice(0, 12).join(" | "));
}

// ---- reused part names stay distinguishable ----
{
  const lat = SITES.filter(s => s.part === "lateral");
  const labels = new Set(lat.map(siteLabel));
  ok("the 5 levels sharing part `lateral` get distinct labels", labels.size === new Set(lat.map(s => s.level)).size,
     [...labels].join(" / "));
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/app-naming.test.js
```

Expected: FAIL — `siteLabel` is not exported, then (once stubbed) a long `bad` list.

- [ ] **Step 3: List every key that needs a decision**

Run this to print the mechanical label for all 202 keys — the authoring worklist:

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node -e '
Promise.all([import("./src/engine/inverse.js"),import("./app/labels.js")]).then(([IN,L])=>{
  const seen=new Set(), out=[];
  for (const s of IN.candidateSites()){ const k=`${s.level}|${s.part}`; if(seen.has(k))continue; seen.add(k);
    out.push(`${L.siteLabel(s).padEnd(46)} ${k}`); }
  console.log(out.sort().join("\n"));
});'
```

- [ ] **Step 4: Write the implementation**

Append to `app/labels.js`:

```js
// Overrides for the keys the mechanical transform gets wrong. Keyed `${level}|${part}` — NEVER by part
// alone: `lateral` alone spans midbrain, pons, medulla, cord and hypothalamus, so a bare-part key would
// label five different lesions identically. Same rule as vascular.js / topography.js.
//
// An entry is a COMPLETE anatomical phrase with no side word and no trailing level — siteLabel() appends
// the level only when the phrase does not already imply it (see LEVEL_IMPLIED below).
export const PART_LABEL = {
  "cortex|motor_leg": "leg motor cortex",
  "cortex|motor_facearm": "face/arm motor cortex",
  "cortex|sensory_leg": "leg sensory cortex",
  "cortex|sensory_facearm": "face/arm sensory cortex",
  "cortex|hand_knob": "hand-knob motor cortex",
  "motor_unit|anterior_horn": "anterior horn cell",
  "subcortex|internal_capsule": "internal capsule",
  "subcortex|corona_radiata": "corona radiata",
  // … author the remainder from the Step 3 worklist …
};

// Levels whose name is redundant once the part phrase is read ("internal capsule", not "internal capsule
// subcortex"). Everything else gets the level appended, which is what disambiguates the reused part names.
const LEVEL_IMPLIED = new Set(["subcortex", "cerebrum", "motor_unit", "polyneuropathy"]);

const humaniseLevel = level => humanisePart(level);

export function siteLabel(site) {
  const key = `${site.level}|${site.part}`;
  if (PART_LABEL[key]) return PART_LABEL[key];
  const part = humanisePart(site.part);
  if (LEVEL_IMPLIED.has(site.level)) return part;
  const level = humaniseLevel(site.level);
  return part.toLowerCase().includes(level.toLowerCase()) ? part : `${part} ${level}`;
}
```

Then work the Step 3 worklist: for each key whose mechanical label reads badly, add a `PART_LABEL` entry. Re-run Step 3 after each batch — the list shrinks as you go. Known offender classes to expect:

| Class | Mechanical | Should be |
|---|---|---|
| Level-first word order | `motor leg cortex` | `leg motor cortex` |
| Redundant level | `internal capsule subcortex` | `internal capsule` |
| Bare eponym part | `friedreich combined degeneration` | `Friedreich's ataxia` |
| Compound abbreviations | `iii orbit sup skull base` | `CN III superior division, orbit` |
| Anatomical shorthand | `cpa skull base` | `cerebellopontine angle` |

- [ ] **Step 5: Run test to verify it passes**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/app-naming.test.js
```

Expected: PASS, with the `every site key yields a clean label (202 keys)` assertion green.

- [ ] **Step 6: Run the full suite**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test
```

Expected: exit 0.

- [ ] **Step 7: Commit and RAISE FOR REVIEW**

```bash
git add app/labels.js test/app-naming.test.js
git commit -m "feat(app): clinical site labels, keyed level|part

202 site keys now yield a plain anatomical phrase. Keyed level|part
because 4 part names are reused across levels. Invariant test asserts no
underscores, no un-expanded abbreviations, no repeated words.

NEEDS CLINICAL REVIEW: PART_LABEL is anatomical content.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

**Stop here and show the owner the full `PART_LABEL` table** (the Step 3 command prints it rendered). Do not proceed to Task 4's headline wiring until they have signed it off — a wrong label on the result headline mislabels a lesion.

---

### Task 3: `plainSiteName()` and `shortFindingLabel()`

**Files:**
- Modify: `app/labels.js`
- Modify: `test/app-naming.test.js`

**Interfaces:**
- Consumes: `siteLabel()` from Task 2.
- Produces:
  - `plainSiteName(site, opts?: {dominantSide?: string}) -> { name: string, sub: string, raw: string }` — `name` is the eponym when one exists, else the plain phrase; `sub` is the plain-anatomy + territory line; `raw` is the `side · level · part` triple for the disclosure.
  - `shortFindingLabel(id: string) -> string` — ≤32 characters, never empty.

- [ ] **Step 1: Write the failing test**

Append to `test/app-naming.test.js`, above the `console.log` block:

```js
import { plainSiteName, shortFindingLabel } from "../app/labels.js";
import { FINDINGS } from "../src/model/findings.js";

const byId = id => SITES.find(s => s.id === id);

// ---- plainSiteName: eponym wins the headline; plain anatomy fills the subtitle ----
{
  const aca = byId("right_cortex_aca");           // HAS an eponym
  const leg = byId("right_cortex_motor_leg");     // has NO eponym (one of the 52)
  ok("an eponym site keeps its eponym as the name", !!aca && /anterior cerebral/i.test(plainSiteName(aca).name));
  ok("an eponym site gets plain anatomy in the subtitle", !!aca && plainSiteName(aca).sub.length > 0);
  ok("a no-eponym site is named in plain English, not schema",
     !!leg && !plainSiteName(leg).name.includes("_") && !/\(motor_leg\)/.test(plainSiteName(leg).name));
  ok("a no-eponym site names its side", !!leg && /^right/i.test(plainSiteName(leg).name));
  ok("raw keeps the id triple for the disclosure",
     !!leg && plainSiteName(leg).raw === "right · cortex · motor_leg");
}
// ---- no site anywhere renders an underscore or an empty name ----
{
  const bad = SITES.filter(s => { const p = plainSiteName(s);
    return !p.name || !p.name.trim() || p.name.includes("_"); });
  ok(`no site yields an empty or schema name (${SITES.length} sites)`, !bad.length,
     bad.slice(0, 5).map(s => s.id).join(" | "));
}
// ---- shortFindingLabel: chip-sized, never empty, for every finding ----
{
  const ids = Object.keys(FINDINGS);
  const tooLong = ids.filter(f => shortFindingLabel(f).length > 32);
  const empty = ids.filter(f => !shortFindingLabel(f).trim());
  ok(`every finding label fits 32 chars (${ids.length} findings)`, !tooLong.length, tooLong.slice(0, 5).join(" | "));
  ok("no finding label is empty", !empty.length, empty.slice(0, 5).join(" | "));
  ok("a short desc passes through unchanged", shortFindingLabel("weak_arm") === "Arm weakness");
  ok("a parenthetical is trimmed", shortFindingLabel("weak_adduction") === "Weak adduction");
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/app-naming.test.js
```

Expected: FAIL — `plainSiteName is not a function`.

- [ ] **Step 3: Write the implementation**

Append to `app/labels.js`:

```js
import { BY_SITE, nameForSite } from "../src/data/syndromes.js";
import { FINDINGS } from "../src/model/findings.js";

const SIDE_WORD = { left: "Left", right: "Right", bilateral: "Bilateral", midline: "Midline" };
const sideWord = s => SIDE_WORD[s] || "";

// Does the phonebook actually name this site? Checked against BY_SITE directly rather than by comparing
// nameForSite()'s output to its own fallback string, which would break the moment that string is reworded.
const hasEponym = site => !!(BY_SITE[site.id] || BY_SITE[`${site.level}_${site.part}`]);

export function plainSiteName(site, opts = {}) {
  const plain = [sideWord(site.side), siteLabel(site)].filter(Boolean).join(" ");
  const raw = `${site.side} · ${site.level} · ${site.part}`;
  if (hasEponym(site)) {
    const name = nameForSite(site, opts).name;
    return { name, sub: [plain, site.territory].filter(Boolean).join(" — "), raw };
  }
  return { name: plain, sub: site.territory || "", raw };
}

// A finding `desc` is a teaching sentence (papilloedema's runs to 130 characters), so the chip takes its
// leading clause and the full desc goes in a title attribute at the call site.
const CLAUSE_SEPARATORS = [" — ", " (", ", ", " / ", " + ", " ± "];

export function shortFindingLabel(id) {
  const d = (FINDINGS[id] && FINDINGS[id].desc) || "";
  let s = d.trim();
  for (const sep of CLAUSE_SEPARATORS) s = s.split(sep)[0].trim();
  if (!s) s = humanisePart(id).replace(/^./, c => c.toUpperCase());
  if (s.length > 32) s = s.slice(0, 31).trimEnd() + "…";
  return s;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/app-naming.test.js
```

Expected: PASS.

- [ ] **Step 5: Run the full suite and commit**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test
git add app/labels.js test/app-naming.test.js
git commit -m "feat(app): plainSiteName + shortFindingLabel

Eponyms keep the headline; plain anatomy fills the subtitle; the id
triple survives behind a disclosure. Chip labels are capped at 32 chars.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Wire clinical naming into the UI

**Files:**
- Modify: `app/app.js:221-222` (`siteName`, `siteLoc`), `app/app.js:262` (header), `app/app.js:282` (differential rows), `app/app.js:118-124` (`frow`), `app/app.js:151-157` (`renderChips`)

**Interfaces:**
- Consumes: `plainSiteName()`, `shortFindingLabel()` from Task 3.
- Produces: no new exports. `siteName(site)` keeps its existing signature and return type (`string`) so all 20+ existing call sites keep working unchanged.

- [ ] **Step 1: Add the import**

In `app/app.js`, after line 20:

```js
import { plainSiteName, shortFindingLabel } from "./labels.js";
```

- [ ] **Step 2: Rewrite the two naming helpers**

Replace `app/app.js:221-222`:

```js
function siteName(site){ const e = nameForSite(site); return e.name; }
function siteLoc(site){ return `${site.side} · ${site.level} · ${site.part}`; }
```

with:

```js
// siteName keeps returning a plain string — every existing call site (diagram labels, feedback payload,
// why-blocks, together rows) depends on that. Only the composition changed.
function siteName(site){ return plainSiteName(site, { dominantSide: S.dominant }).name; }
function siteSub(site){ return plainSiteName(site, { dominantSide: S.dominant }).sub; }
function siteRaw(site){ return plainSiteName(site, { dominantSide: S.dominant }).raw; }
```

- [ ] **Step 3: Update the result header**

Replace the `.oh-lead-txt` line in `resultHeader()` (`app/app.js:262`):

```js
    <div class="oh-lead"><div class="oh-lead-txt"><b>${esc(siteName(sel.site))}</b><span class="oh-loc">${esc(siteLoc(sel.site))}${sel.site.territory?` · ${esc(sel.site.territory)}`:""}</span></div>${feedbackButton(list)}</div>
```

with:

```js
    <div class="oh-lead"><div class="oh-lead-txt"><b>${esc(siteName(sel.site))}</b><span class="oh-loc">${esc(siteSub(sel.site))}</span>
      <details class="oh-raw"><summary>site id</summary><code>${esc(siteRaw(sel.site))} · ${esc(sel.site.id)}</code></details>
    </div>${feedbackButton(list)}</div>
```

- [ ] **Step 4: Update the differential rows**

In `whereCard()` (`app/app.js:282`), replace the `.dloc` span:

```js
<span class="dloc">${esc(siteLoc(c.site))}${c.site.territory?` · ${esc(c.site.territory)}`:""}</span>
```

with:

```js
<span class="dloc">${esc(siteSub(c.site))}</span>
```

- [ ] **Step 5: Drop the raw id from exam rows**

In `frow()` (`app/app.js:123`), replace:

```js
  return `<div class="frow" data-fid="${f}" title="${esc(f)}"><div class="nm"><span class="fd-primary">${esc(desc(f))}</span> <span class="fid-mini">${esc(f)}</span></div><div class="sides">${btns}</div></div>`;
```

with:

```js
  // The id stays in the title attribute — reachable for a bug report, off the screen for a clinician.
  return `<div class="frow" data-fid="${f}" title="${esc(f)} — ${esc(desc(f))}"><div class="nm"><span class="fd-primary">${esc(desc(f))}</span></div><div class="sides">${btns}</div></div>`;
```

- [ ] **Step 6: Give chips clinical labels**

In `renderChips()` (`app/app.js:154-155`), replace:

```js
  el.innerHTML = [...S.tokens].map(t => { const [f,s]=t.split("@");
    return `<span class="chip"><span class="sd">${sideTag(s)}</span>${esc(f)}<span class="x" data-t="${t}">×</span></span>`; }).join("");
```

with:

```js
  el.innerHTML = [...S.tokens].map(t => { const [f,s]=t.split("@");
    return `<span class="chip" title="${esc(f)} — ${esc(desc(f))}"><span class="sd">${sideTag(s)}</span>${esc(shortFindingLabel(f))}<span class="x" data-t="${t}">×</span></span>`; }).join("");
```

- [ ] **Step 7: Add the disclosure style**

In `app/index.html`, before the `/* mobile ergonomics */` comment:

```css
  .oh-raw{margin-top:4px;} .oh-raw>summary{font-size:10px;color:var(--faint);cursor:pointer;list-style:none;}
  .oh-raw>summary::-webkit-details-marker{display:none;}
  .oh-raw code{font-family:var(--mono);font-size:10px;color:var(--faint);}
```

- [ ] **Step 8: Verify in the browser**

Start the server and load the reference case:

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node app/serve.mjs
```

Open `http://localhost:8137/app/#f=weak_arm@right,weak_leg@left&o=subacute&c=relapsing` (passphrase `NeuroLocaliser`).

Confirm: the headline reads a plain phrase (not `right cortex (motor_leg)`); the subtitle is prose plus territory; chips read "Arm weakness" / "Leg weakness"; exam rows show no grey id; the "site id" disclosure still reveals the triple. Check the browser console is clean.

- [ ] **Step 9: Run the full suite and commit**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test
git add app/app.js app/index.html
git commit -m "feat(app): speak clinical English on screen

Headline, differential rows, chips and exam rows now render plain
anatomy and finding names. Ids move to title attributes and a disclosure,
and are unchanged in the case URL and feedback payload.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Four-step type ramp and calmer surfaces

**Files:**
- Modify: `app/index.html:8-16` (token block), and every `font-size` declaration in the stylesheet

**Interfaces:**
- Consumes: nothing.
- Produces: CSS custom properties `--fs-answer`, `--fs-body`, `--fs-meta`, `--fs-cap`. Task 7 uses `--fs-meta` for the section nav.

- [ ] **Step 1: Record the baseline**

```bash
grep -o "font-size:[0-9.]*px" app/index.html | sort -u | wc -l
```

Expected: `16`.

- [ ] **Step 2: Add the ramp tokens**

In `app/index.html`, append to the `:root{…}` block at line 8-11:

```css
    --fs-answer:17px;--fs-body:13px;--fs-meta:11px;--fs-cap:10px;
```

- [ ] **Step 3: Apply the mapping**

Replace every `font-size:<n>px` in the stylesheet per this table. It is mechanical — work top to bottom.

| Existing | Becomes |
|---|---|
| `8px`, `9px`, `9.5px`, `10px`, `10.5px` | `var(--fs-cap)` |
| `11px`, `11.5px` | `var(--fs-meta)` |
| `12px`, `12.5px`, `13px` | `var(--fs-body)` |
| `14px`, `15px`, `16px`, `17px` | `var(--fs-answer)` |

**Three deliberate exceptions — leave these alone:** the `.wordmark` `clamp(18px,2.6vw,26px)` and the gate `.wordmark` `22px` (brand), and the code-stroke `.cs-clock` `18px` (a glanceable clock at arm's length is doing a different job).

- [ ] **Step 4: Drop one level of nesting**

A cause currently sits inside a category group, inside a card, inside a pane, inside the page. The caption already separates the group, so remove its box. In `app/index.html`, in the refined-aesthetic layer near line 170, append:

```css
  /* one box, not four: the card keeps its border, the groups inside it do not */
  .out-card .catgrp{border:0;box-shadow:none;background:none;padding-left:0;}
  .out-card .annot{background:none;border-left:2px solid var(--line);border-radius:0;padding:4px 0 4px 9px;}
```

- [ ] **Step 5: Verify the count dropped**

```bash
grep -o "font-size:[0-9.]*px" app/index.html | sort -u
```

Expected: only the three exceptions remain (`18px`, `22px`, and the `clamp` is not matched by this grep).

- [ ] **Step 6: Verify both themes in the browser**

With the server running, load the reference case from Task 4 Step 8. Check the light and dark schemes both read correctly, then narrow the window below 560px and confirm the mobile breakpoint still works.

- [ ] **Step 7: Run the full suite and commit**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test
git add app/index.html
git commit -m "style(app): four-step type ramp, fewer nested boxes

16 ad-hoc font sizes collapse to answer/body/meta/caption tokens, so the
page has a hierarchy to read. Category groups inside a card lose their
own border and background.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: Move controls to the cards they act on

**Files:**
- Modify: `app/app.js:74-97` (`renderLocalise`), `app/app.js:126-136` (`wireLocalise`), `app/app.js:561-586` (`whatBlock`), `app/app.js:366-406` (`togetherCard`)
- Modify: `test/app-smoke.test.js`

**Interfaces:**
- Consumes: nothing new.
- Produces: no new exports. `S` keeps all five fields; `encodeCase`/`decodeCase` are untouched.

- [ ] **Step 1: Write the failing regression test**

Append to `test/app-smoke.test.js`, above the `console.log` block:

```js
// ---- control relocation must not change the case URL contract (2026-08-16) ----
// The controls move into the cards they act on, which means a control can be UNMOUNTED while its state is
// set (onset is "subacute" but no finding is entered, so the What card never rendered). S stays the single
// source of truth and the value must still round-trip, or a shared case silently loses its tempo.
import { encodeCase, decodeCase } from "../app/case-url.js";
{
  const state = { tokens: new Set(["weak_arm@right"]), onset: "subacute", course: "relapsing",
    dominant: "right", sensoryLevel: "T10", distalReach: "knees", pinned: new Set(), mode: "localise" };
  const round = decodeCase("#" + encodeCase(state), { validFindings: new Set(["weak_arm"]) });
  ok("onset survives the round trip", round.onset === "subacute");
  ok("course survives the round trip", round.course === "relapsing");
  ok("dominant hemisphere survives the round trip", round.dominant === "right");
  ok("sensory level survives the round trip", round.sensoryLevel === "T10");
  ok("distal reach survives the round trip", round.distalReach === "knees");
  // the unmounted case: state set, no findings at all
  const bare = decodeCase("#" + encodeCase({ tokens: new Set(), onset: "chronic", course: "progressive" }), {});
  ok("onset serialises with no findings entered", bare.onset === "chronic");
  ok("course serialises with no findings entered", bare.course === "progressive");
}
```

- [ ] **Step 2: Run test to verify it passes already**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/app-smoke.test.js
```

Expected: PASS. This guard is written **before** the refactor deliberately — it pins the behaviour the refactor must not break. Commit it now so a later failure is unambiguous.

```bash
git add test/app-smoke.test.js
git commit -m "test(app): pin the case-URL contract before relocating controls

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

- [ ] **Step 3: Strip the control strip and add the header setting**

In `renderLocalise()` (`app/app.js:75-91`), replace the whole `<div class="ctrls">…</div>` block with a single dominant-hemisphere setting, and add the conditional level inputs to the findings pane:

```js
function renderLocalise() {
  const hasCord = [...S.tokens].some(t => CORD_AXIS_FINDINGS.has(fid(t)));
  app.innerHTML = `
  <div class="grid">
    <div class="pane">
      <h3>Examination findings</h3>
      <input class="search" id="search" placeholder="Search findings… (e.g. Horner, ataxia, gaze)">
      <div class="chips" id="chips"></div>
      ${hasCord ? `<div class="ctrls ctrls-inline">
        <label>Sensory level <input type="text" id="slevel" placeholder="e.g. T10" size="6"></label>
        <label>Distal reach <input type="text" id="reach" placeholder="e.g. knees" size="7"></label>
      </div>` : ""}
      <div class="accordion" id="acc">${examAccordion()}</div>
    </div>
    <div class="pane" id="results"></div>
  </div>`;
  const sl = document.getElementById("slevel"); if (sl) sl.value = S.sensoryLevel;
  const dr = document.getElementById("reach"); if (dr) dr.value = S.distalReach;
  wireLocalise();
  renderChips(); renderResults();
}
```

Add the trigger set above `renderLocalise()`:

```js
// The sensory-level and distal-reach inputs annotate a cord / length-dependent picture and mean nothing
// otherwise, so they only mount once such a finding is present.
const CORD_AXIS_FINDINGS = new Set(["spinothalamic","dorsal_column","sensory_level","weak_leg","weak_arm",
  "sphincter_dysfunction","saddle_anaesthesia","glove_stocking","distal_sensory_loss","sensory_ataxia"]);
```

Add the dominant-hemisphere setting to the header in `app/index.html`, inside the existing `<header>` after the `.modes` div:

```html
      <label class="hemi-set">Dominant <select id="dom"><option value="left">left</option><option value="right">right</option></select></label>
```

- [ ] **Step 4: Rewire the handlers**

Replace `wireLocalise()` (`app/app.js:126-136`) with a version that tolerates absent controls:

```js
function wireLocalise() {
  // Controls now live in the cards they act on, so each may be absent on any given render. Every handler
  // is bound defensively; S remains the single source of truth either way.
  const on = (id, ev, fn) => { const el = document.getElementById(id); if (el) el[ev] = fn; };
  on("dom", "onchange", e => { S.dominant = e.target.value; renderResults(); markSides(); });
  on("onset", "onchange", e => { S.onset = e.target.value; renderResults(); });
  on("course", "onchange", e => { S.course = e.target.value; renderResults(); });
  on("slevel", "oninput", e => { S.sensoryLevel = e.target.value.trim(); renderResults(); });
  on("reach", "oninput", e => { S.distalReach = e.target.value.trim(); renderResults(); });
  on("search", "oninput", e => filterFindings(e.target.value.toLowerCase()));
  on("acc", "onclick", e => { const b = e.target.closest("button[data-f]"); if (!b) return;
    toggleToken(`${b.dataset.f}@${b.dataset.s}`); });
  markSides();
}
```

The dominant-hemisphere `<select>` is in the static header, so bind it once in `boot()` instead of on every render — add to `boot()` after the mode wiring:

```js
  const domSel = document.getElementById("dom");
  if (domSel) { domSel.value = S.dominant;
    domSel.onchange = e => { S.dominant = e.target.value; if (S.mode === "localise") { renderResults(); markSides(); } syncURL(); }; }
```

- [ ] **Step 5: Put onset inside the What card**

In `whatBlock()` (`app/app.js:576`), replace the `cap` line with an inline control:

```js
  const cap = `<div class="card-ctrl"><label>Onset
      <select id="onset">
        <option value="">all</option>
        ${TEMPO.map(t=>`<option value="${t.id}"${S.onset===t.id?" selected":""}>${esc(t.label)}</option>`).join("")}
      </select></label>${res.derived ? ` <span class="derived">(derived from site type — not individually curated)</span>` : ""}</div>`;
```

Because `renderResults()` re-renders the whole pane, the `<select>` is recreated on each change; `wireLocalise()` is not re-run, so bind it at the end of `renderResults()` instead. Add to `renderResults()` after `el.innerHTML = …`:

```js
  wireCardControls();
```

and add the function beside it:

```js
// The onset / course selects live inside cards that re-render on every state change, so they are rebound
// after each render rather than once at boot.
function wireCardControls() {
  const o = document.getElementById("onset");
  if (o) o.onchange = e => { S.onset = e.target.value; renderResults(); };
  const c = document.getElementById("course");
  if (c) c.onchange = e => { S.course = e.target.value; renderResults(); };
}
```

- [ ] **Step 6: Put course inside the Together card**

In `togetherCard()` (`app/app.js:405`), replace the final `return` with:

```js
  const courseCtrl = `<div class="card-ctrl"><label>Course
      <select id="course">
        <option value="">all</option>
        ${COURSES.map(c=>`<option value="${c.id}"${S.course===c.id?" selected":""}>${esc(c.label)}</option>`).join("")}
      </select></label></div>`;
  return card(`Together <span class="oc-n">(${sites.length} sites)</span>`, courseCtrl + guard + srcLine + fits + disc);
```

- [ ] **Step 7: Style the inline controls**

In `app/index.html`, append near the other card styles:

```css
  .card-ctrl{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center;font-size:var(--fs-meta);color:var(--muted);margin-bottom:8px;}
  .card-ctrl label{display:inline-flex;gap:6px;align-items:center;}
  .card-ctrl select{font:inherit;font-size:var(--fs-meta);padding:3px 7px;border:1px solid var(--line);border-radius:7px;background:var(--paper);color:var(--ink);}
  .ctrls-inline{margin:0 0 8px;}
  .hemi-set{font-size:var(--fs-meta);color:var(--muted);display:inline-flex;gap:6px;align-items:center;}
  .hemi-set select{font:inherit;font-size:var(--fs-meta);padding:3px 7px;border:1px solid var(--line);border-radius:7px;background:var(--paper);color:var(--ink);}
```

- [ ] **Step 8: Verify in the browser**

Reload the reference case. Confirm: nothing sits above the two panes but the wordmark, modes and the Dominant setting; changing Onset inside the What card re-filters causes and the select keeps its value; changing Course inside the Together card re-ranks the roster; the sensory-level inputs appear only once a cord finding is ticked; the URL hash still carries `o=` and `c=`.

- [ ] **Step 9: Run the full suite and commit**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test
git add app/app.js app/index.html
git commit -m "refactor(app): move controls to the cards they act on

Onset lives in What, course in Together, the level inputs in the findings
pane behind a cord finding, dominant hemisphere in the header. The app
now opens as findings -> lesions with nothing above the fold.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: Section nav, urgency pill, one scope control

**Files:**
- Modify: `app/app.js:159-220` (`renderResults`), `app/app.js:250-264` (`resultHeader`), `app/app.js:477-479` (`scopeToggle`), `app/app.js:525-553` (`whatCard`), `app/app.js:592-600` (`nextCard`)
- Modify: `app/index.html`

**Interfaces:**
- Consumes: `nextStepsFor` (already imported at `app/app.js:8`), `combinedSites` (already imported).
- Produces: no new exports.

- [ ] **Step 1: Give each card an anchor id**

Change `card()` (`app/app.js:225-227`) to accept an id:

```js
// cap is trusted HTML (literal labels we control) — not user input. `anchor` gives the section nav a target.
function card(capHTML, body, anchor) {
  return `<section class="out-card"${anchor ? ` id="sec-${anchor}"` : ""}><div class="out-cap">${capHTML}</div>${body}</section>`;
}
```

Then pass an anchor at each of the five call sites:
- `whereCard` (`app/app.js:292`): `card(cap, …, "where")`
- `togetherCard` (`app/app.js:405`): `card(…, …, "together")`
- `whyCard` (both returns, `app/app.js:454` and `:472`): `card("Why", …, "why")`
- `whatCard` (both returns, `app/app.js:550` and `:552`): `card(…, …, "what")`
- `nextCard` (`app/app.js:599`): `card(cap, …, "next")`

- [ ] **Step 2: Build the nav**

Add above `renderResults()`:

```js
// The reasoning chain stays in one scroll (the trainee must not be able to skip Why), so the nav is a jump
// list, not a tab strip — nothing is hidden. Sections absent for this case are omitted, never disabled.
function sectionNav(has) {
  const items = [["where","Where"],["together","Together"],["why","Why"],["what","What"],["next","Next"]]
    .filter(([k]) => has.has(k));
  if (items.length < 2) return "";
  return `<nav class="secnav">${items.map(([k,l]) =>
    `<a href="#sec-${k}" data-sec="${k}">${l}</a>`).join("")}</nav>`;
}
```

- [ ] **Step 3: Render the nav and the urgency pill**

In `renderResults()`, replace the `el.innerHTML = resultHeader(…) …` assignment (`app/app.js:191-197`) with:

```js
  const together = togetherCard(r, list);
  const has = new Set(["where","why","what","next"]);
  if (together) has.add("together");
  el.innerHTML = resultHeader(sel, list, total, r)
    + sectionNav(has)
    + pmsg + rmsg
    + whereCard(list, cands, total, r)
    + together
    + whyCard(tf, sel, total)
    + whatCard(sel.site, r, list)
    + nextCard(sel.site, r, list);
```

In `resultHeader()`, add the urgency pill. Insert before the `return`:

```js
  // Urgency already exists in the workup layer but was only visible four screens down — the one signal a
  // time-poor reader needs before anything else.
  let urg = "";
  try {
    const u = nextStepsFor(sel.site).urgency;
    const tint = u === "emergency" ? "--red" : u === "urgent" ? "--gold" : "--faint";
    const lab = u === "emergency" ? "EMERGENCY" : u === "urgent" ? "URGENT" : "routine";
    urg = `<a class="urg-pill" href="#sec-next" style="color:var(${tint});border-color:var(${tint})">${lab}</a>`;
  } catch { urg = ""; }
```

and put `${urg}` immediately before `${feedbackButton(list)}` in the returned `.oh-lead` div.

- [ ] **Step 4: Hoist the scope control to the header**

Remove the `toggle` variable and its use from `whatCard()` (`app/app.js:529`, `:550`, `:552`) and from `nextCard()` (`app/app.js:597`, `:599`) — the cards render `whatBlock(site)` / `nextBlock(nx, combined)` directly with no toggle prefix.

Then in `resultHeader()`, add the single control. Insert after the `urg` block:

```js
  const { sites: scopeSites } = combinedSites(r, list, S.pinned);
  const scope = scopeSites.length >= 2 ? scopeToggle(scopeSites.length) : "";
```

and put `${scope}` after the `.oh-status` paragraph in the returned HTML.

`resultHeader` needs `list` and `r`, which it already receives. Leave `scopeToggle()` itself unchanged — the click handler at `app/app.js:216-218` already delegates from the results element and keeps working.

- [ ] **Step 5: Style the nav and pill**

In `app/index.html`, append:

```css
  .secnav{position:sticky;top:0;z-index:4;display:flex;gap:2px;padding:6px 0;margin:6px 0 2px;
    background:color-mix(in srgb,var(--paper) 92%,transparent);backdrop-filter:saturate(1.1) blur(3px);}
  .secnav a{font-size:var(--fs-meta);font-weight:700;color:var(--muted);text-decoration:none;
    padding:4px 10px;border-radius:999px;}
  .secnav a:hover{color:var(--terra);background:var(--band);}
  .urg-pill{flex:none;font-size:var(--fs-cap);font-weight:800;letter-spacing:.04em;text-decoration:none;
    border:1px solid;border-radius:999px;padding:3px 9px;white-space:nowrap;}
  /* the sticky nav would collide with the sticky safety bar on a phone, where the single column already
     puts the sections next to each other */
  @media (max-width:560px){ .secnav{display:none;} }
```

- [ ] **Step 6: Verify in the browser**

Reload the reference case. Confirm: the nav sticks to the top of the results pane while scrolling; each link jumps to its card; "Together" is absent on a single-site case (try `#f=weak_arm@left,weak_leg@left,spinothalamic@right`); the urgency pill shows and links to Next Steps; exactly one scope toggle exists and switching it changes **both** the What and Next cards; the nav is hidden below 560px.

- [ ] **Step 7: Run the full suite and commit**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test
git add app/app.js app/index.html
git commit -m "feat(app): section nav, urgency pill, single scope control

Orientation without omission: a sticky jump list keeps the whole
reasoning chain in one scroll while letting a time-poor reader reach Next
Steps in one click. Urgency surfaces in the header. The duplicate scope
toggles collapse to one beside the headline.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8: One demotion treatment

**Files:**
- Modify: `app/app.js:284-290` (ruled-out), `app/app.js:400-403` (discordant), `app/app.js:544-548` (demoted shared), `app/app.js:580-584` (demoted single-site), `app/app.js:519` (per-site remainder)

**Interfaces:**
- Consumes: nothing new.
- Produces: `setAside(reason: string, n: number, body: string) -> string` — one collapsed disclosure, used by all five call sites.

- [ ] **Step 1: Add the shared component**

Add above `whereCard()`:

```js
// Five places tell the reader "the engine considered this and set it aside" — in five phrasings and five
// styles. They are one concept and get one component. The REASON text still distinguishes them, because
// the mechanisms genuinely differ: a known-negative EXCLUDES, a tempo/course mismatch only DEMOTES.
function setAside(reason, n, body) {
  return `<details class="setaside"><summary>Set aside — ${reason} <span class="c">${n}</span></summary>
    <div class="setaside-body">${body}</div></details>`;
}
```

- [ ] **Step 2: Convert the five call sites**

`whereCard()` ruled-out (`app/app.js:284-290`) becomes:

```js
  const ruled = (r.ruledOut && r.ruledOut.length)
    ? setAside("contradicted by a normal finding", r.ruledOut.length,
        `<div class="why-list">${r.ruledOut.map(x => {
          const side = x.contradictedBy.split("@")[1];
          return `<div class="why-item"><span class="k no">✗</span><span class="t">${esc(siteName(x.site))}</span><span class="d">would also cause ${esc(desc(fid(x.contradictedBy)))} on the ${esc(side)} — which is normal here</span></div>`;
        }).join("")}</div>`)
    : "";
```

`togetherCard()` discordant (`app/app.js:400-403`) becomes:

```js
  const disc = u.discordant.length
    ? setAside(`less likely given ${esc(axisLabel(u.discordant))}`, u.discordant.length,
        u.discordant.map(e => `${unifyingRow(e, sites)}<div class="annot">${e.demotions.map(d => `You entered <b>${esc(d.entered)}</b>; this is typically ${d.expected.map(esc).join(" / ")}.`).join(" ")}</div>`).join(""))
    : "";
```

`whatCard()` demoted-shared (`app/app.js:544-548`) becomes:

```js
    const dem = demotedShared.length
      ? setAside(`less likely given <b>${esc(S.onset)}</b> onset`, demotedShared.length,
          `<div class="annot">A cause shared here does not typically present with <b>${esc(S.onset)}</b> onset — the mismatch between tempo and site is itself informative.</div>
           ${demotedShared.map(s => sharedCauseRow(s, sites.length, true)).join("")}`)
      : "";
```

`perSiteRemainderHTML()` (`app/app.js:519`) becomes:

```js
  return setAside("only plausible at one site", n, body);
```

`whatBlock()` demoted (`app/app.js:580-584`) becomes:

```js
  const dem = res.demoted && res.demoted.length
    ? setAside(`less likely given <b>${esc(S.onset)}</b> onset`, res.demoted.length,
        `<div class="annot">A lesion here does not typically present with <b>${esc(S.onset)}</b> onset — the mismatch between tempo and site is itself informative.</div>
         ${res.demoted.map(x => `<div class="cause"><b>${esc(x.name)}</b> <span class="dloc">usually ${x.demotion.expected.map(esc).join(" / ")}</span>${x.feature ? ` — ${esc(x.feature)}` : ""}</div>`).join("")}`)
    : "";
```

- [ ] **Step 3: Add the one style**

In `app/index.html`, append:

```css
  .setaside{margin-top:8px;border-top:1px dashed var(--line);padding-top:6px;}
  .setaside>summary{cursor:pointer;font-size:var(--fs-meta);color:var(--faint);list-style:none;}
  .setaside>summary::-webkit-details-marker{display:none;}
  .setaside>summary:hover{color:var(--muted);}
  .setaside>summary .c{font-family:var(--mono);font-size:var(--fs-cap);}
  .setaside-body{margin-top:6px;}
```

Then delete the now-unused inline `style=` attributes on the old `.ruledout` / `.demoted` disclosures — grep for `class="ruledout"` and `class="demoted"` to confirm none remain.

- [ ] **Step 4: Verify in the browser**

Reload the reference case. All five disclosures now read `Set aside — <reason> · N` in one visual style. Confirm each still opens and its content is unchanged, and that the reason text still distinguishes exclusion from demotion.

- [ ] **Step 5: Run the full suite and commit**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test
git add app/app.js app/index.html
git commit -m "refactor(app): one treatment for every set-aside disclosure

Five phrasings and five styles for one concept collapse into a shared
component. The reason text still distinguishes exclusion (a known
negative) from demotion (a tempo or course mismatch).

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 9 (SEVERABLE): What-card density

**This task changes what a reader sees by default rather than how it is presented.** It is the only one that does. Confirm with the owner before starting; the plan is complete without it.

**Files:**
- Modify: `app/app.js:561-586` (`whatBlock`)

**Interfaces:**
- Consumes: `renderCause()` and the `bySpec` / `CATEGORIES` locals already inside `whatBlock()`. Does **not**
  use `setAside()` — a "+N more" line keeps the collapsed names on screen, which a set-aside disclosure does
  not, and these causes are not set aside: they are ranked below the leaders.
- Produces: no new exports.

- [ ] **Step 1: Split each category group**

In `whatBlock()`, replace the `groups` block (`app/app.js:567-571`) with:

```js
  // Per category: the leading causes stay open, and EVERY red-flagged must-not-miss stays open regardless
  // of its rank — the must-not-miss list is never what gets collapsed. The rest keep their names on screen
  // behind a one-line disclosure, so nothing is deleted.
  const OPEN_PER_CAT = 2;
  const groups = CATEGORIES.map(cat => {
    const causes = bySpec[cat.id]?.causes || [];
    if (!causes.length) return "";
    const open = causes.filter((c, i) => i < OPEN_PER_CAT || c.red);
    const rest = causes.filter(c => !open.includes(c));
    const more = rest.length
      ? `<details class="more-causes"><summary>+${rest.length} more — ${rest.map(c => esc(c.name)).join(", ")}</summary>${rest.map(renderCause).join("")}</details>`
      : "";
    return `<div class="catgrp"><div class="cathead"><span class="catdot" style="background:var(${cat.tint})"></span>${esc(cat.label)}</div>${open.map(renderCause).join("")}${more}</div>`;
  }).join("");
```

- [ ] **Step 2: Style the disclosure**

In `app/index.html`, append:

```css
  .more-causes{margin:2px 0 0 16px;}
  .more-causes>summary{cursor:pointer;font-size:var(--fs-meta);color:var(--faint);list-style:none;
    overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .more-causes>summary::-webkit-details-marker{display:none;}
  .more-causes>summary:hover{color:var(--terra);}
```

- [ ] **Step 3: Verify the must-not-miss rule holds**

Load a site with many red-flagged causes and confirm every `RED` badge is visible without opening a disclosure:

```
http://localhost:8137/app/#f=saddle_anaesthesia@midline,sphincter_dysfunction@left,radicular_pain@left
```

Count the `RED` badges on screen against the total, then open every `+N more` and confirm no additional `RED` badge appears inside.

- [ ] **Step 4: Run the full suite and commit**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test
git add app/app.js app/index.html
git commit -m "feat(app): rank the What card by category

Top causes per category plus every red-flagged must-not-miss stay open;
the remainder keeps its names on screen behind a one-line disclosure.
Nothing is deleted and no must-not-miss is ever collapsed.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 10: Documentation

**Files:**
- Modify: `CLAUDE.md`
- Modify: `docs/superpowers/specs/2026-08-16-app-ui-clarity-design.md`

- [ ] **Step 1: Mark the spec implemented**

Change the spec's `**Status:**` line to:

```
**Status:** implemented 2026-08-16; `PART_LABEL` clinical content SIGNED OFF by the owner <date>
```

If workstream 6 was severed, add a line under it saying so and why.

- [ ] **Step 2: Add the increment to CLAUDE.md**

Add a section after the "Multifocal SUBSTRATE axis" section:

```markdown
## App UI clarity pass (DONE 2026-08-16)

**What it fixes.** Seven increments had landed content into the same three surfaces without re-ranking what
the reader sees. Measured before: a two-finding case rendered a **3051px** results column, five cards all
expanded with no navigation, **16** distinct font sizes (10 of them between 8px and 13px), five global
controls above the fold of which **three** were inert until a finding existed, and **three** separate
affordances answering "which site am I reasoning about".

**`app/labels.js` is the new display-naming layer** — pure, DOM-free, unit-tested by
`test/app-naming.test.js`. `plainSiteName()` gives the eponym when the phonebook has one and a plain
anatomical phrase otherwise (`nameForSite()` falls back to `` `${side} ${level} (${part})` `` for 52 of 377
sites — 18% of COMMON sites, including the cortical motor strip). **`PART_LABEL` is keyed
`${level}|${part}`, never by part alone** — `lateral` spans five levels, `hemi` four; the same trap
`vascular.js` and `topography.js` document. Ids are unchanged in the case URL and the feedback payload;
only the screen speaks English.

**Controls now live in the card they act on** (onset → What, course → Together, level inputs → findings
pane behind a cord finding, dominant hemisphere → header), so a control can be unmounted while its state is
set. `S` stays the single source of truth and `test/app-smoke.test.js` pins the case-URL round trip.

**Trainee-primary, ED-usable** (owner's ruling): the reasoning chain stays in ONE scroll in a fixed order —
a tabbed UI would let a trainee skip Why, which is the teaching payload. ED speed comes from a sticky
section nav plus an urgency pill in the header, not from reordering the cards. **Reordering Next Steps to
the top was considered and rejected** on those grounds.

Spec/plan: `docs/superpowers/specs/2026-08-16-app-ui-clarity-design.md`,
`docs/superpowers/plans/2026-08-16-app-ui-clarity.md`.
```

- [ ] **Step 3: Final verification**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test
```

Expected: exit 0, 64 suites.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md docs/superpowers/specs/2026-08-16-app-ui-clarity-design.md
git commit -m "docs: record the app UI clarity pass

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Verification checklist

Before claiming this plan complete, confirm each by running it — not by inspection:

- [ ] `npm test` exits 0 with **64 suites** and no fewer than 3611 assertions.
- [ ] The reference case renders with no console error in both colour schemes:
      `#f=weak_arm@right,weak_leg@left&o=subacute&c=relapsing`
- [ ] A single-site case omits the Together section from the nav:
      `#f=weak_arm@left,weak_leg@left,spinothalamic@right`
- [ ] A case URL shared from **before** this work still resolves with its onset and course intact.
- [ ] No screen text contains an underscore-joined id outside a `title` attribute or the "site id" disclosure.
- [ ] Below 560px: the section nav is hidden, the layout is single-column, the safety bar still sticks.
- [ ] Atlas and Code-stroke modes still render (they share `siteName()` and the type ramp).

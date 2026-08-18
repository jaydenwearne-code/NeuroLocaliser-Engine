# Wearne's NeuroLocaliser — Brand & Beta Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the app to Wearne's NeuroLocaliser, mark it as a Beta with a real version, give it a decussation mark and favicon, and fix the colour problem by making terracotta scarce and the must-not-miss a filled chip.

**Architecture:** A new pure module `app/brand.js` owns the version and the mark geometry, so the header, the gate and the favicon all draw from one source. Everything else is CSS tokens and markup in `app/index.html`, plus small copy changes. No `src/` file is touched, so no localisation result can change.

**Tech Stack:** Zero-dependency ES modules, no build step, no test framework. Each test file is a standalone script asserting with a local `ok(label, cond)` helper and exiting non-zero on failure.

## Global Constraints

- **Runtime:** prefix every command `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"`.
- **Baseline:** 64 suites / 3658 assertions green on `main`. Any failure is a real regression.
- **No `src/` changes.** Engine, anatomy tables, clinical content are out of scope.
- **The safety bar wording does not change**, verbatim: `Teaching prototype. Not a medical device; not for clinical decisions. No patient identifiers. Findings stay in your browser.` Nor does the gate acknowledgment copy.
- **Terracotta rule:** `--terra` means *the product's identity* or *THE answer* — nothing else. Allowlist is exactly: `.wordmark .l`, `.lockup-mark`, `.out-head`, `.neuraxis .nx-node.sel .nx-dot`, `.neuraxis .nx-node.sel .nx-label`.
- **`--terra` value is unchanged** in both themes (`#d36d52` light, `#e79075` dark) — the owner chose it.
- **Both colour schemes must work** — `@media (prefers-color-scheme:dark)` plus the `:root[data-theme=…]` overrides.
- **Register every new test file** in the `test` script in `package.json`.
- **Commit messages** end with: `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`
- **Spec:** `docs/superpowers/specs/2026-08-16-brand-and-beta-design.md`.

## Spec amendment made while planning

The spec says dark-mode `--contra` "stays at `#e79075`, so all three separate". **That is wrong** — `--terra` is also `#e79075`, so terra and contra would still be identical. Measured values today:

| Theme | `--terra` | `--contra` | `--red` |
|---|---|---|---|
| light | `#d36d52` | `#c85a3d` | `#c0392b` |
| dark | `#e79075` | `#e79075` | `#e79075` |

**All three dark values are the same colour.** This plan separates all three in both themes, with `--terra` untouched.

## File Structure

| File | Responsibility |
|---|---|
| `app/brand.js` **(create)** | `VERSION`, `markSVG()`, `faviconDataURI()`. Pure, no DOM writes. |
| `test/brand.test.js` **(create)** | Version/package agreement, the terracotta allowlist, the three-token separation, mark integrity. |
| `app/index.html` **(modify)** | Palette tokens, terracotta discipline, filled danger chips, the lockup markup, dead-CSS deletion. |
| `app/app.js` **(modify)** | Inject the mark and favicon at boot; version on the gate. |
| `app/feedback.js` **(modify)** | Subject + body carry the new name and the build version. |
| `app/serve.mjs` **(modify)** | Console line. |
| `package.json` **(modify)** | Version `0.1.0` → `0.9.0`; register the new suite. |
| `CLAUDE.md`, spec **(modify)** | Record the increment. |

## Dead CSS found while planning

`.presets`, `.bar`, `.narrow`, `.disc`, `.alt` have **zero** uses in `app/*.js` — leftovers from earlier passes, three of which carry terracotta. Task 3 deletes them, which cleans up and reduces the terracotta count for free.

---

### Task 1: `app/brand.js` — version and mark

**Files:**
- Create: `app/brand.js`
- Create: `test/brand.test.js`
- Modify: `package.json`

**Interfaces:**
- Consumes: nothing.
- Produces: `VERSION: string`, `markSVG(opts?: {size?: number, cls?: string}) -> string`, `faviconDataURI() -> string`. Tasks 4 and 5 consume all three.

- [ ] **Step 1: Write the failing test**

Create `test/brand.test.js`:

```js
// brand.test.js — identity invariants. The version a tester reports must be a real build, the mark must
// survive being drawn twice from one geometry, and terracotta must stay scarce (see the allowlist below).
import { readFileSync } from "node:fs";
import { VERSION, markSVG, faviconDataURI } from "../app/brand.js";

let pass = 0, fail = 0;
const log = [];
const ok = (label, cond, detail) => { log.push({ label, ok: !!cond, detail }); cond ? pass++ : fail++; };

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

// ---- the version a bug report carries must name a real build ----
ok("VERSION matches package.json", VERSION === pkg.version, `${VERSION} vs ${pkg.version}`);
ok("VERSION looks like a semver", /^\d+\.\d+\.\d+$/.test(VERSION), VERSION);

// ---- the mark ----
{
  const svg = markSVG();
  ok("markSVG returns an <svg>", svg.startsWith("<svg") && svg.trim().endsWith("</svg>"));
  ok("the mark takes its colour from a token, never a hard-coded hex", !/#[0-9a-f]{3,6}/i.test(svg), svg.slice(0, 80));
  ok("the mark carries both decussating tracts", (svg.match(/<path/g) || []).length === 2);
  ok("the mark has one filled and one hollow node — the ipsi/contra asymmetry",
     /fill="currentColor"/.test(svg) && /fill="none"/.test(svg));
  ok("markSVG honours a size", markSVG({ size: 40 }).includes('width="40"'));
  const fav = faviconDataURI();
  ok("faviconDataURI is an inline SVG data URI", fav.startsWith("data:image/svg+xml,"));
  ok("the favicon carries an explicit colour (a data URI cannot inherit currentColor)",
     /%23[0-9a-fA-F]{6}/.test(fav) || /#[0-9a-fA-F]{6}/.test(decodeURIComponent(fav)));
}

console.log("\nNeuroLocaliser — BRAND\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}${r.detail ? "  → " + r.detail : ""}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run test to verify it fails**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/brand.test.js
```

Expected: FAIL — `Cannot find module .../app/brand.js`.

- [ ] **Step 3: Write the implementation**

Create `app/brand.js`:

```js
// brand.js — identity, in one place. The mark is a PYRAMIDAL DECUSSATION: two tracts descend, cross once,
// and continue on the opposite side, one node filled and one hollow. That asymmetry is the engine's whole
// premise ("laterality is the crux — most localisation bugs are crossing bugs"), so the mark states it.
//
// A bare X was rejected: at small size it reads as close/delete, which collides with the red ✗ already
// meaning "contradicted by a normal finding". The vertical runs above and below the crossing prevent that.
//
// Pure — returns strings, never touches the DOM. app.js injects.

// Kept in step with package.json by test/brand.test.js, so a bug report always names a real build.
export const VERSION = "0.9.0";

export const PRODUCT_NAME = "Wearne's NeuroLocaliser";

// The full mark. Colour comes from `currentColor` so it inherits whatever token the call site sets —
// asserted by the suite, because a hard-coded hex here would silently break dark mode.
export function markSVG({ size = 26, cls = "brand-mark" } = {}) {
  const h = Math.round(size * 1.18);
  return `<svg class="${cls}" width="${size}" height="${h}" viewBox="0 0 24 26" aria-hidden="true" focusable="false">`
    + `<path d="M8.3 7.6 V12 L15.7 17 V22.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<path d="M15.7 7.6 V12 L8.3 17 V22.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<circle cx="8.3" cy="4.6" r="2.8" fill="currentColor"/>`
    + `<circle cx="15.7" cy="4.6" r="2.8" fill="none" stroke="currentColor" stroke-width="1.8"/>`
    + `</svg>`;
}

// The favicon is the SAME geometry with thicker strokes and no mid-detail, because 16px cannot hold it.
// A data URI cannot inherit currentColor, so this one takes an explicit colour.
export function faviconDataURI(color = "#d36d52") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 26">`
    + `<path d="M8 7.5 V12 L16 17 V23" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<path d="M16 7.5 V12 L8 17 V23" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<circle cx="8" cy="4.3" r="3.2" fill="${color}"/>`
    + `<circle cx="16" cy="4.3" r="3.2" fill="none" stroke="${color}" stroke-width="2.4"/>`
    + `</svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}
```

- [ ] **Step 4: Bump the version and register the suite**

In `package.json`, change `"version": "0.1.0"` to `"version": "0.9.0"`, and append to the end of the `test` script chain:

```
 && node test/brand.test.js
```

- [ ] **Step 5: Run the test, then the full suite**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/brand.test.js
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test
```

Expected: brand suite `8 passed, 0 failed`; full suite exit 0, now 65 suites.

- [ ] **Step 6: Commit**

```bash
git add app/brand.js test/brand.test.js package.json
git commit -m "feat(app): brand module — version and the decussation mark

The mark is the pyramidal decussation: two tracts cross, one node filled
and one hollow. That asymmetry is the engine's premise. One geometry,
two drawings, so the favicon survives 16px.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Palette — warm paper, deeper navy, three separated danger tokens

**Files:**
- Modify: `app/index.html:8-21` (the four token blocks)
- Modify: `test/brand.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: the token values Tasks 3 and 4 style against. No new exports.

- [ ] **Step 1: Write the failing test**

Append to `test/brand.test.js`, above the `console.log` block:

```js
// ---- brand, contralateral and danger must be three DIFFERENT colours, in BOTH themes ----
// Measured before this pass: in dark, --terra, --contra and --red were all #e79075. The brand accent,
// "contralateral" and "must-not-miss" were one colour with three meanings.
const CSS = readFileSync(new URL("../app/index.html", import.meta.url), "utf8");
const tokenIn = (block, name) => {
  const m = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})`).exec(block);
  return m && m[1].toLowerCase();
};
// the four blocks that define the palette: :root, prefers-dark, [data-theme=light], [data-theme=dark]
const blocks = CSS.split(/(?=:root|@media \(prefers-color-scheme:dark\))/).filter(b => /--terra:/.test(b));
ok("all four palette blocks are found", blocks.length === 4, String(blocks.length));
for (const [i, b] of blocks.entries()) {
  const terra = tokenIn(b, "terra"), contra = tokenIn(b, "contra"), red = tokenIn(b, "red");
  const three = new Set([terra, contra, red].filter(Boolean));
  ok(`palette block ${i + 1}: terra / contra / red are three distinct colours`,
     three.size === 3, `${terra} · ${contra} · ${red}`);
}
ok("--terra is unchanged in light", /--terra:#d36d52/.test(CSS));
ok("--terra is unchanged in dark", /--terra:#e79075/.test(CSS));
```

- [ ] **Step 2: Run test to verify it fails**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/brand.test.js
```

Expected: FAIL on the dark blocks — `#e79075 · #e79075 · #e79075`.

- [ ] **Step 3: Apply the light tokens**

In `app/index.html`, in **both** the bare `:root{…}` block (line 8) and `:root[data-theme="light"]` (line 20), set these values (leave every other token alone):

```
--cream:#faf7f2;  --paper:#fffdfb;  --navy:#16283f;  --ink:#16283f;
--navy-2:#274063; --muted:#5d6c7e;  --faint:#8d8b84;
--line:#e5ded3;   --band:#f2ece2;
--terra:#d36d52;  --contra:#c85a3d; --red:#b32b1c;
```

- [ ] **Step 4: Apply the dark tokens**

In **both** `@media (prefers-color-scheme:dark){:root{…}}` (line 17) and `:root[data-theme="dark"]` (line 21):

```
--cream:#0f1824;  --paper:#16223a;  --navy:#dbe4f1;  --ink:#e9edf3;
--navy-2:#b7c6dd; --muted:#96a3b5;  --faint:#6f819c;
--line:#26364d;   --band:#1b2942;
--terra:#e79075;  --contra:#e8a184; --red:#d24a33;
```

`--terra` is untouched. `--contra` lightens to stay warm but distinct from the brand, and `--red` deepens and saturates so a filled chip reads as an alarm.

- [ ] **Step 5: Run the test, then the full suite**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/brand.test.js
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test
```

Expected: both pass.

- [ ] **Step 6: Look at both themes**

Start the server, open the reference case, and check light and dark:

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node app/serve.mjs
```

`http://localhost:8137/app/#f=weak_arm@right,weak_leg@left&o=subacute&c=relapsing`

A token that reads well on parchment can look muddy on near-black — check them independently.

- [ ] **Step 7: Commit**

```bash
git add app/index.html test/brand.test.js
git commit -m "fix(app): separate brand, contralateral and danger colours

In dark mode --terra, --contra and --red were all #e79075 - the brand
accent, 'contralateral' and 'must-not-miss' were one colour with three
meanings. Now distinct in both themes, with --terra untouched.

Paper warms to parchment and navy deepens, so the page reads as a
printed clinical text.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Terracotta discipline

**Files:**
- Modify: `app/index.html` (28 lines carrying `var(--terra)`, plus 5 dead rule sets)
- Modify: `test/brand.test.js`

**Interfaces:**
- Consumes: the tokens from Task 2.
- Produces: no exports. Establishes the allowlist that Task 4 must not violate.

- [ ] **Step 1: Write the failing allowlist test**

Append to `test/brand.test.js`, above the `console.log` block:

```js
// ---- terracotta is IDENTITY or THE ANSWER — nothing else ----
// It was on 32 declarations (nav pills, subtitles, mono tokens, selected rows, hovers, headings), which
// left it meaning nothing while sitting next to the red-flag colour it resembles. This is the guard that
// stops it creeping back: adding a new one fails here until it is justified and allowlisted.
const TERRA_ALLOWED = [
  ".wordmark .l",                      // the wordmark — identity
  ".lockup-mark",                      // the mark's colour holder — identity (markSVG uses currentColor)
  ".out-head",                         // the focal answer card's rule — THE answer
  ".neuraxis .nx-node.sel .nx-dot",    // the selected lesion on the diagram — THE answer
  ".neuraxis .nx-node.sel .nx-label",
];
{
  const style = CSS.slice(CSS.indexOf("<style>"), CSS.indexOf("</style>"));
  // Rules are separated by "}". For each chunk that uses --terra, the selector is the text before "{",
  // with any @media / :root wrapper fragment stripped off the front.
  // Rules split on "}"; the selector is the text before "{", and its LAST line (earlier lines belong to
  // the previous rule's tail or a comment). A chunk inside @media reports the media query, which is fine —
  // it still surfaces for a human to look at.
  const offenders = style.split("}")
    .filter(chunk => chunk.includes("var(--terra)"))
    .map(chunk => chunk.split("{")[0].split("\n").pop().trim())
    .filter(sel => sel && !TERRA_ALLOWED.some(a => sel.includes(a)));
  ok(`every var(--terra) rule is on the allowlist (${TERRA_ALLOWED.length} allowed)`,
     offenders.length === 0, offenders.slice(0, 8).join(" | "));
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/brand.test.js
```

Expected: FAIL listing offenders such as `.modes button.on`, `.oh-loc`, `.secnav a:hover`.

- [ ] **Step 3: Delete the dead CSS**

These five have **zero** uses in `app/*.js` — verify, then delete their whole rule sets from `app/index.html`:

```bash
for c in presets bar narrow disc alt; do echo "$c: $(grep -o "class=\"[^\"]*\b$c\b" app/*.js | wc -l)"; done
```

Expected: all `0`. Delete the rules for `.presets`, `.presets button`, `.presets button:hover`, `.bar`, `.narrow`, `.narrow b`, `.disc`, `.alt`, `.alt .an`, `.alt .an b`, `.alt .as`.

- [ ] **Step 4: Recolour the rest**

Apply each of these in `app/index.html`. The rule: *active / hover / selected / emphasis → navy or band.*

| Selector | Change |
|---|---|
| `body` background radial-gradient | `var(--terra) 6%` → `var(--navy) 4%` |
| `.modes button.on` | `color:var(--terra)` → `color:var(--navy)` |
| `.sides button.on` | `background:var(--terra)` → `background:var(--navy)` |
| `.where-best` | `border:1px solid var(--terra)` → `var(--line)`; `color-mix(… var(--terra) 6% …)` → `var(--band)` |
| `.where-best .loc` | `color:var(--terra)` → `color:var(--muted)` |
| `.drow.on` (line ~57) | `color-mix(in srgb,var(--terra) 12%,transparent)` → `var(--band)` |
| `.drow .dbar` | `background:var(--terra)` → `background:var(--navy-2)` |
| `.what-lead b` | `color:var(--terra)` → `color:var(--navy)` |
| `.site-btn.on` | `background:var(--terra)` → `background:var(--navy)` |
| `.synth.converge` | `border-left:2px solid var(--terra)` → `var(--navy-2)` |
| `.neuraxis .nx-tract` | `stroke:var(--terra)` → `stroke:var(--muted)` |
| `.neuraxis .nx-node:hover .nx-label` | `fill:var(--terra)` → `fill:var(--navy)` |
| `.oh-lead b` | `color:var(--terra)` → `color:var(--ink)` |
| `.oh-loc` | `color:var(--terra)` → `color:var(--muted)` |
| `.gate` background radial-gradient | `var(--terra) 8%` → `var(--navy) 5%` |
| `.gate-go` | `background:var(--terra)` → `background:var(--navy)` |
| `.report-btn:hover` | `border-color:var(--terra);color:var(--terra)` → both `var(--navy)` |
| `.drow.on` (line ~184) | `inset 3px 0 0 var(--terra)` → `inset 3px 0 0 var(--navy-2)` |
| `.secnav a:hover` | `color:var(--terra)` → `color:var(--navy)` |
| `.more-causes>summary:hover` | `color:var(--terra)` → `color:var(--navy)` |

Then **keep** `.wordmark .l` and both `.neuraxis .nx-node.sel` rules as they are.

- [ ] **Step 5: Give the focal card its terracotta rule**

Replace the `.out-head` background (line ~170) so the card is neutral and terracotta appears as a single left rule — the one place it says *this is the answer*:

```css
  .out-head{border:1px solid var(--line);border-left:3px solid var(--terra);border-radius:var(--radius);
    background:var(--paper);box-shadow:var(--shadow-lift);padding:16px 16px 14px;margin-bottom:4px;}
```

- [ ] **Step 6: Run the test, then the full suite**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/brand.test.js
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test
```

Expected: the allowlist assertion passes; full suite exit 0.

- [ ] **Step 7: Count what is left**

```bash
grep -c "var(--terra)" app/index.html
```

Expected: 5 or fewer.

- [ ] **Step 8: Commit**

```bash
git add app/index.html test/brand.test.js
git commit -m "refactor(app): terracotta means identity or the answer, nothing else

32 declarations used --terra - nav pills, subtitles, mono tokens,
selected rows, hovers, headings - which left it meaning nothing while
sitting beside the red-flag colour it resembles. Now 5, on an allowlist
a test enforces. Active/hover/selected states are navy.

Also deletes .presets, .bar, .narrow, .disc and .alt, which had zero
uses in app/*.js - leftovers from earlier passes.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: The must-not-miss becomes a filled chip

**Files:**
- Modify: `app/index.html` (`.rf`, `.urg-pill`)
- Modify: `app/app.js` (the `RED` badge markup, 3 sites)

**Interfaces:**
- Consumes: `--red` from Task 2.
- Produces: no exports.

- [ ] **Step 1: Restyle the red-flag badge**

In `app/index.html`, replace the `.cause .rf` declaration:

```css
  .cause .rf{font-size:var(--fs-cap);font-weight:800;color:var(--red);background:var(--red-bg);border-radius:4px;padding:0 5px;}
```

with a filled chip — fill and weight now do the work, so hue proximity stops mattering:

```css
  /* The must-not-miss is distinguished by FORM, not hue: a tired reader should never have to tell
     #d36d52 from #b32b1c at 10px. Filled chip + glyph, everywhere a red flag appears. */
  .rf{display:inline-flex;align-items:center;gap:3px;font-size:var(--fs-cap);font-weight:800;
    letter-spacing:.04em;color:var(--paper);background:var(--red);border-radius:4px;padding:1px 6px;}
```

- [ ] **Step 2: Make the urgency pill match when it is an emergency**

Append to the section-nav block in `app/index.html`:

```css
  /* EMERGENCY is the same class of signal as a red flag, so it gets the same treatment. URGENT and
     routine stay outlined — only the top of the scale is filled, or the fill stops meaning anything. */
  .urg-pill.urg-emergency{color:var(--paper);background:var(--red);border-color:var(--red);}
```

- [ ] **Step 3: Add the glyph and the emergency class**

In `app/app.js`, add the class in `resultHeader()` — find:

```js
    urg = `<a class="urg-pill" href="#sec-next" style="color:var(${tint});border-color:var(${tint})">${lab}</a>`;
```

replace with:

```js
    const emerg = u === "emergency" ? " urg-emergency" : "";
    urg = `<a class="urg-pill${emerg}" href="#sec-next"${emerg ? "" : ` style="color:var(${tint});border-color:var(${tint})"`}>${lab}</a>`;
```

Then give every `RED` badge its flag glyph. There are three occurrences of `` `<span class="rf">RED</span>` `` — in `unifyingRow()`, `renderCause()` and `sharedCauseRow()`. Replace all three:

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node -e '
const fs=require("fs"); const p="app/app.js"; let s=fs.readFileSync(p,"utf8");
const before=(s.match(/<span class="rf">RED<\/span>/g)||[]).length;
s=s.split(`<span class="rf">RED</span>`).join(`<span class="rf">⚑ RED</span>`);
fs.writeFileSync(p,s); console.log("replaced",before,"RED badges");'
```

Expected: `replaced 3 RED badges`.

- [ ] **Step 4: Verify in the browser**

Load a case whose site has red-flagged causes and confirm the chip is solid with white text in **both** themes:

```
http://localhost:8137/app/#f=facial_weakness@right,forehead_spared@right,weak_arm@right,speech_nonfluent@none&s=left_cortex_mca
```

Check the EMERGENCY pill is filled and that `--red` changing has not broken the contra badge or the red-flag callout blocks — both use red and neither was restyled.

- [ ] **Step 5: Run the full suite and commit**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test
git add app/index.html app/app.js
git commit -m "feat(app): the must-not-miss is a filled chip, not tinted text

Distinguished by form rather than hue, so a tired reader never has to
tell #d36d52 from #b32b1c at 10px. EMERGENCY gets the same treatment;
URGENT and routine stay outlined, or the fill stops meaning anything.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: The name, the lockup, the beta badge and the favicon

**Files:**
- Modify: `app/index.html` (title, header markup, gate markup, lockup CSS)
- Modify: `app/app.js` (inject mark + favicon, version on the gate)
- Modify: `app/feedback.js`, `app/serve.mjs`

**Interfaces:**
- Consumes: `VERSION`, `PRODUCT_NAME`, `markSVG()`, `faviconDataURI()` from Task 1.
- Produces: no exports.

- [ ] **Step 1: Retitle the page**

In `app/index.html`: `<title>NeuroLocaliser</title>` → `<title>Wearne's NeuroLocaliser</title>`

- [ ] **Step 2: Rebuild the header lockup**

Replace the header's `<h1 class="wordmark">…</h1>` with:

```html
      <div class="lockup">
        <span class="lockup-mark" data-brand-mark></span>
        <div class="lockup-txt">
          <span class="byline">Wearne's</span>
          <h1 class="wordmark"><span class="n">NEURO</span><span class="l">LOCALISER</span></h1>
        </div>
        <span class="beta-badge">BETA</span>
      </div>
```

Do the same in the gate card, replacing its `<h1 class="wordmark">…</h1>`, and change the gate sub-line to carry the build:

```html
      <p class="gate-sub">Teaching prototype — access for invited testers<br><span class="gate-ver" data-brand-version></span></p>
```

- [ ] **Step 3: Style the lockup**

Append to `app/index.html`:

```css
  /* "Wearne's" sits ABOVE the wordmark: it reads as authorship, keeps NEUROLOCALISER as the product name,
     and avoids a long single line on mobile. The BETA badge is navy, NOT terracotta — it is a status, and
     terracotta is reserved for identity and the answer. */
  .lockup{display:flex;align-items:center;gap:10px;}
  .lockup-mark{flex:none;display:inline-flex;color:var(--terra);} /* allowlisted — identity */
  .lockup-txt{min-width:0;}
  .byline{display:block;font-size:var(--fs-cap);font-weight:600;letter-spacing:.16em;
    text-transform:uppercase;color:var(--muted);margin-bottom:1px;}
  .beta-badge{flex:none;align-self:flex-start;margin-top:3px;font-size:var(--fs-cap);font-weight:800;
    letter-spacing:.11em;color:var(--muted);border:1px solid var(--line);background:var(--band);
    border-radius:999px;padding:2px 7px;}
  .gate-ver{font-family:var(--mono);font-size:var(--fs-cap);color:var(--faint);}
  @media (max-width:560px){ .lockup{gap:8px;} }
```

- [ ] **Step 4: Inject the mark, the favicon and the version**

In `app/app.js`, add the import after the other `./` imports:

```js
import { VERSION, markSVG, faviconDataURI } from "./brand.js";
```

and add this function, calling it as the first line of `startGate()`:

```js
// One geometry, three call sites — the header mark, the gate mark and the favicon all come from brand.js,
// so there is no second copy of the logo to drift. Runs before the gate is shown.
function paintBrand() {
  document.querySelectorAll("[data-brand-mark]").forEach(el => { el.innerHTML = markSVG({ size: 26 }); });
  document.querySelectorAll("[data-brand-version]").forEach(el => { el.textContent = `v${VERSION} · Beta`; });
  let link = document.querySelector('link[rel="icon"]');
  if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
  link.type = "image/svg+xml";
  link.href = faviconDataURI(getComputedStyle(document.documentElement).getPropertyValue("--terra").trim() || "#d36d52");
}
```

- [ ] **Step 5: Carry the name and build into feedback**

In `app/feedback.js`, add the import at the top:

```js
import { VERSION, PRODUCT_NAME } from "./brand.js";
```

Change line 51:

```js
    `Thanks for testing ${PRODUCT_NAME} (v${VERSION}) — this takes about a minute.`,
```

and line 64's subject:

```js
  return `mailto:${email}?subject=${encodeURIComponent(`${PRODUCT_NAME} feedback (v${VERSION})`)}&body=${encodeURIComponent(body)}`;
```

- [ ] **Step 6: Update the server console line**

In `app/serve.mjs` line 27, change `NeuroLocaliser app` to `Wearne's NeuroLocaliser`.

- [ ] **Step 7: Verify in the browser**

Reload. Confirm: the tab shows a terracotta decussation favicon and the title `Wearne's NeuroLocaliser`; the header shows mark · byline · wordmark · BETA; the gate shows the same lockup plus `v0.9.0 · Beta`; and **the safety bar wording is unchanged**. Click "Report a problem" and check the mailto subject carries the name and version.

- [ ] **Step 8: Run the full suite and commit**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test
git add app/index.html app/app.js app/feedback.js app/serve.mjs
git commit -m "feat(app): Wearne's NeuroLocaliser, with a beta badge and a favicon

Byline above the wordmark, so it reads as authorship and NEUROLOCALISER
stays the product name. BETA is navy, not terracotta - it is a status,
and terracotta is reserved.

The gate and every feedback email now carry the build version, so a
report always names a real build. Safety-bar wording unchanged: beta
describes the build, not the risk.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: Documentation

**Files:**
- Modify: `CLAUDE.md`, `docs/superpowers/specs/2026-08-16-brand-and-beta-design.md`

- [ ] **Step 1: Mark the spec implemented and correct its one error**

Change `**Status:**` to `**Status:** implemented 2026-08-16`. Then fix §3: the spec claims dark `--contra` "stays at `#e79075`, so all three separate", which is wrong because `--terra` is also `#e79075`. Record that `--contra` moved to `#e8a184` and `--red` to `#d24a33`.

- [ ] **Step 2: Add the increment to CLAUDE.md**

Insert before `## Commands`:

```markdown
## Brand + Beta pass (DONE 2026-08-16)

**Wearne's NeuroLocaliser, v0.9.0 Beta.** `app/brand.js` owns `VERSION`, `PRODUCT_NAME`, `markSVG()` and
`faviconDataURI()` — one geometry drawn twice (full mark + a thicker 16px favicon), so there is no second
copy of the logo to drift. `test/brand.test.js` asserts `VERSION` equals `package.json`, so a bug report
always names a real build.

**The mark is a pyramidal decussation** — two tracts cross, one node filled and one hollow. That asymmetry
is the engine's premise. A bare X was rejected: at small size it reads as close/delete, colliding with the
red ✗ already meaning "contradicted by a normal finding".

**THE COLOUR RULE: `--terra` means the product's identity, or THE answer. Nothing else.** It was on **32
declarations** — nav pills, subtitles, mono tokens, selected rows, hovers, headings — which left it meaning
nothing while sitting next to the red-flag colour it resembles. Now **5**, on an allowlist
`test/brand.test.js` enforces, so it cannot creep back without someone justifying the addition.

**A defect this found, which was live:** in dark mode `--terra`, `--contra` and `--red` were all
`#e79075` — the brand accent, "contralateral" and "must-not-miss" were one colour with three meanings. All
three are now distinct in both themes, with `--terra` untouched (the owner chose it).

**The must-not-miss is distinguished by FORM, not hue** — `RED` and an `EMERGENCY` urgency are filled chips
with a ⚑ glyph, so a tired reader never has to tell `#d36d52` from `#b32b1c` at 10px. URGENT and routine
stay outlined, or the fill stops meaning anything.

**Palette otherwise:** paper warms to parchment, navy deepens — a printed clinical text rather than a web
app. Five dead rule sets deleted (`.presets`, `.bar`, `.narrow`, `.disc`, `.alt`, all zero uses).

**The safety bar wording did NOT change** — "Beta" describes the build, not the risk.

Spec/plan: `docs/superpowers/specs/2026-08-16-brand-and-beta-design.md`,
`docs/superpowers/plans/2026-08-16-brand-and-beta.md`.
```

- [ ] **Step 3: Final verification and commit**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test
git add CLAUDE.md docs/
git commit -m "docs: record the brand + beta pass

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Verification checklist

Run each; do not infer.

- [ ] `npm test` exits 0 with **65 suites**.
- [ ] `grep -c "var(--terra)" app/index.html` returns **5 or fewer**.
- [ ] The safety bar reads exactly: *Teaching prototype. Not a medical device; not for clinical decisions. No patient identifiers. Findings stay in your browser.*
- [ ] Favicon renders in the tab; title reads `Wearne's NeuroLocaliser`.
- [ ] Gate shows `v0.9.0 · Beta`; a feedback mailto carries name and version.
- [ ] Red-flag chips and an EMERGENCY pill are filled and legible in **both** themes.
- [ ] Both themes and the ≤560px breakpoint render with no console error.
- [ ] Atlas and Code-stroke modes still render (they share the tokens).

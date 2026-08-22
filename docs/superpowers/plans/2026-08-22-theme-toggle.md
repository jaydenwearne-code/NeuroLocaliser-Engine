# Theme toggle — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status: IMPLEMENTED 2026-08-22** — all four tasks complete, 6527 assertions green (6467 baseline + 60).
Branch `feat/theme-toggle`, off `main`, **not merged**.
Spec: `docs/superpowers/specs/2026-08-22-theme-toggle-design.md`.

**Goal:** Give the reader a header control that switches the app between light, dark and follow-the-OS, and
remembers the choice — the CSS side already exists and has never had a way to be set.

**Architecture:** A new pure module `app/theme.js` owns the storage key, the cycle, the resolve rule and the
attribute write; `app/app.js` wires one header button to it; `app/index.html` gains a four-line blocking
script in `<head>` so the stored choice is applied before first paint. No engine files are touched, no
palette is edited, and the theme is deliberately kept out of `S` and the case URL.

**Tech Stack:** Zero-dependency ES modules, no build step, no test framework. Each test file is a standalone
node script with a local `ok(label, cond)` helper that prints PASS/FAIL and exits non-zero on any failure.

## Global Constraints

- **Runtime.** There is no system node. Prefix every command:
  `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"`
- **Zero dependencies.** No packages, no `node_modules`, no build step. Nothing to install.
- **Exactly FOUR palette blocks** in `app/index.html`. `test/brand.test.js` counts them and asserts
  `--terra`/`--contra`/`--red` are three distinct colours in each and that the danger chip clears 4.5:1 in
  all four. **Add no fifth block. Edit no colour value.**
- **The `--terra` allowlist.** Terracotta means the product's identity or THE answer. A theme toggle is
  neither — style it from `--band` / `--line` / `--muted` / `--paper` / `--navy-2` / `--ink`.
- **`test/brand.test.js` scans the stylesheet as TEXT, comments included.** Never write `var(--terra)` inside
  a CSS comment. Name the colour in prose instead.
- **`app/theme.js` must never throw.** Safari private browsing throws on `localStorage` access and this runs
  on the path that reveals the app.
- **The theme never enters `S`, `encodeCase`, `decodeCase` or `syncURL()`.** A case URL is shared between
  people and carries the case; the theme is a property of the reader's eyes.
- **The storage key is exactly `nl_theme_v1`** — the `nl_*_v1` convention set by `GATE_STORAGE_KEY` and
  `app/usage.js`.
- Commit after each task. Do not merge to `main` — the owner confirms that separately (it auto-deploys).

## File structure

| File | Responsibility |
|---|---|
| `app/theme.js` | **Create.** The whole preference: key, `THEMES`, read/write, cycle, resolve, attribute write, button strings. Pure apart from the one `root` it is handed. |
| `test/theme.test.js` | **Create.** Every pure part, plus the guard on the string duplicated into `index.html`. |
| `app/index.html` | **Modify.** Blocking `<head>` script (above `<style>`); `.theme-btn` CSS rule; the button in `.head-right`. |
| `app/app.js` | **Modify.** Import; apply on boot before `paintBrand()`; split out `paintFavicon()`; bind the click in `boot()`; `matchMedia` listener. |
| `package.json` | **Modify.** Register `test/theme.test.js` in the `test` script. |
| `CLAUDE.md` | **Modify.** Record the feature in the project-state section. |

---

### Task 1: `app/theme.js` and its pure tests

**Files:**
- Create: `app/theme.js`
- Create: `test/theme.test.js`
- Modify: `package.json` (the `test` script)

**Interfaces:**
- Consumes: nothing.
- Produces, for Tasks 2-3:
  - `THEME_STORAGE_KEY: string` — `"nl_theme_v1"`
  - `THEMES: string[]` — `["system","light","dark"]`, in cycle order
  - `readTheme(store?: {getItem}) -> "system"|"light"|"dark"`
  - `writeTheme(value: string, store?: {setItem}) -> "system"|"light"|"dark"` (returns what it stored)
  - `nextTheme(current: string) -> "system"|"light"|"dark"`
  - `resolveTheme(choice: string, prefersDark?: boolean) -> "light"|"dark"`
  - `applyTheme(choice: string, root?: {dataset}) -> "system"|"light"|"dark"`
  - `themeGlyph(choice: string) -> string`
  - `themeLabel(choice: string) -> string`

- [ ] **Step 1: Write the failing test**

Create `test/theme.test.js`:

```js
// theme.test.js — the reader's light/dark preference. Everything here is pure: the storage round trip, the
// three-step cycle, the resolve matrix and the attribute write, plus one guard on the storage key, which is
// the single string that has to agree between app/theme.js and the inline script in app/index.html.
import { readFileSync } from "node:fs";
import {
  THEME_STORAGE_KEY, THEMES, readTheme, writeTheme, nextTheme, resolveTheme, applyTheme,
  themeGlyph, themeLabel,
} from "../app/theme.js";

let pass = 0, fail = 0;
const log = [];
const ok = (label, cond, detail) => { log.push({ label, ok: !!cond, detail }); cond ? pass++ : fail++; };

// A localStorage stand-in. `memStore()` behaves; `deadStore()` throws on both sides, which is what Safari
// private browsing does — the app must survive it, because this runs on the path that reveals the app.
const memStore = (seed = {}) => ({
  data: { ...seed },
  getItem(k) { return Object.prototype.hasOwnProperty.call(this.data, k) ? this.data[k] : null; },
  setItem(k, v) { this.data[k] = String(v); },
});
const deadStore = () => ({
  getItem() { throw new Error("storage disabled"); },
  setItem() { throw new Error("storage disabled"); },
});

// --- 1: the key and the vocabulary ----------------------------------------------------------------
ok("the key follows the nl_*_v1 convention", /^nl_[a-z_]+_v\d+$/.test(THEME_STORAGE_KEY), THEME_STORAGE_KEY);
ok("the key is exactly nl_theme_v1", THEME_STORAGE_KEY === "nl_theme_v1", THEME_STORAGE_KEY);
ok("there are three states", THEMES.length === 3, THEMES.join(","));
ok("system is first — it is the default and the state the cycle returns to", THEMES[0] === "system");
ok("the three states are system/light/dark", THEMES.join(",") === "system,light,dark");

// --- 2: the storage round trip --------------------------------------------------------------------
for (const v of THEMES) {
  const store = memStore();
  writeTheme(v, store);
  ok(`"${v}" survives a write/read round trip`, readTheme(store) === v, readTheme(store));
}
ok("a store with no key at all reads system", readTheme(memStore()) === "system");
{
  const s = memStore();
  writeTheme("system", s);
  ok("writeTheme stores the literal choice, system included", s.data[THEME_STORAGE_KEY] === "system",
     String(s.data[THEME_STORAGE_KEY]));
}
for (const junk of ["blue", "", "SYSTEM", "0", "null"]) {
  ok(`garbage (${JSON.stringify(junk)}) reads as system`,
     readTheme(memStore({ [THEME_STORAGE_KEY]: junk })) === "system");
}
{
  const s = memStore();
  writeTheme("chartreuse", s);
  ok("writeTheme refuses to store a value outside THEMES", s.data[THEME_STORAGE_KEY] === "system",
     String(s.data[THEME_STORAGE_KEY]));
}
ok("writeTheme reports what it actually stored", writeTheme("chartreuse", memStore()) === "system");

// --- 3: a hostile store must never throw ----------------------------------------------------------
// Not politeness: a cosmetic preference must never be able to stop a clinician getting into the tool.
{
  let threw = null;
  let got;
  try { got = readTheme(deadStore()); } catch (e) { threw = e; }
  ok("readTheme survives a throwing store", !threw, threw && threw.message);
  ok("...and falls back to system", got === "system", got);
  threw = null;
  try { writeTheme("dark", deadStore()); } catch (e) { threw = e; }
  ok("writeTheme survives a throwing store", !threw, threw && threw.message);
  threw = null;
  try { readTheme(); writeTheme("dark"); } catch (e) { threw = e; }
  ok("neither throws when called with no store at all", !threw, threw && threw.message);
  ok("...and the no-store read still yields a usable state", readTheme() === "system");
}

// --- 4: the cycle closes on itself ----------------------------------------------------------------
ok("system -> light", nextTheme("system") === "light");
ok("light -> dark", nextTheme("light") === "dark");
ok("dark -> system", nextTheme("dark") === "system");
for (const v of THEMES) {
  ok(`three clicks from "${v}" return to "${v}"`, nextTheme(nextTheme(nextTheme(v))) === v);
}
ok("an unrecognised current value enters the cycle at light", nextTheme("chartreuse") === "light");
ok("every cycle output is a real state", THEMES.every(v => THEMES.includes(nextTheme(v))));

// --- 5: the resolve matrix ------------------------------------------------------------------------
// The point of an explicit override is that it IGNORES the OS. If these four lines ever pass while the
// explicit states track prefersDark, the toggle has silently become a no-op.
ok("system + OS dark  -> dark", resolveTheme("system", true) === "dark");
ok("system + OS light -> light", resolveTheme("system", false) === "light");
ok("light ignores an OS that wants dark", resolveTheme("light", true) === "light");
ok("light stays light on a light OS", resolveTheme("light", false) === "light");
ok("dark ignores an OS that wants light", resolveTheme("dark", false) === "dark");
ok("dark stays dark on a dark OS", resolveTheme("dark", true) === "dark");
ok("an unrecognised choice behaves as system", resolveTheme("chartreuse", true) === "dark");
ok("prefersDark defaults to false rather than undefined-ing", resolveTheme("system") === "light");

// --- 6: applyTheme writes the attribute the CSS actually reads -------------------------------------
// There is no :root[data-theme="system"] block and there must not be one — following the OS IS the absence
// of an override, so system must DELETE the attribute and let the media query resume.
{
  const root = { dataset: {} };
  applyTheme("dark", root);
  ok("dark sets data-theme=dark", root.dataset.theme === "dark", String(root.dataset.theme));
  applyTheme("light", root);
  ok("light sets data-theme=light", root.dataset.theme === "light", String(root.dataset.theme));
  applyTheme("system", root);
  ok("system REMOVES the attribute entirely",
     !("theme" in root.dataset), JSON.stringify(root.dataset));
  applyTheme("chartreuse", root);
  ok("an unrecognised choice also removes it (falls back to system)", !("theme" in root.dataset));
  ok("applyTheme reports the state it applied", applyTheme("dark", { dataset: {} }) === "dark");
  let threw = null;
  try { applyTheme("dark", null); } catch (e) { threw = e; }
  ok("applyTheme survives having no root (node)", !threw, threw && threw.message);
}

// --- 7: the button's strings ----------------------------------------------------------------------
// The glyph shows the state you are IN, not the one you would move to. That is ambiguous on its own —
// "light" on a light OS and "system" on a light OS look identical — so the label carries both in words.
{
  const glyphs = THEMES.map(themeGlyph);
  ok("every state has a glyph", glyphs.every(g => typeof g === "string" && g.length > 0));
  ok("the three glyphs are distinct", new Set(glyphs).size === 3, glyphs.join(" "));
  ok("an unrecognised choice still yields a glyph", themeGlyph("chartreuse") === themeGlyph("system"));
  for (const v of THEMES) {
    const label = themeLabel(v);
    ok(`the "${v}" label names the state it is in`, /theme/i.test(label) && label.length > 8, label);
    ok(`the "${v}" label says what the next click does`, /click/i.test(label), label);
  }
  ok("the three labels are distinct", new Set(THEMES.map(themeLabel)).size === 3);
}

// --- 8: the one duplicated string -----------------------------------------------------------------
// The stored choice is applied by a blocking script in index.html's <head>, because app.js is a deferred
// module that imports the whole engine graph — applying it there would repaint after first paint, a visible
// flash on a cold Pages load. The cost is that the key literal lives in two files. This is the guard.
{
  const HTML = readFileSync(new URL("../app/index.html", import.meta.url), "utf8");
  // Scoped to the SCRIPT's own source, not the whole head — the explanatory comment beside it discusses
  // the "system" state in prose, which would defeat the "never writes system" assertion below.
  const head = HTML.slice(0, HTML.indexOf("<style>"));
  const script = (head.match(/<script>([\s\S]*?)<\/script>/) || [])[1] || "";
  ok("an inline boot script sits in <head> ABOVE <style>", script.length > 0, head.slice(-160));
  ok("it names the storage key", script.includes(THEME_STORAGE_KEY), THEME_STORAGE_KEY);
  ok("it writes data-theme", /dataset\.theme|setAttribute\(\s*["']data-theme/.test(script), script);
  ok("it only ever applies an explicit override, never the literal system",
     /['"]light['"]/.test(script) && /['"]dark['"]/.test(script) && !/['"]system['"]/.test(script), script);
  ok("it is wrapped in try/catch — a throwing localStorage must not break the page",
     /try\s*{/.test(script), script);
  ok("the header carries the toggle button", /id="theme-toggle"/.test(HTML));
}

console.log("\nNeuroLocaliser — THEME\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}${r.detail ? "  → " + r.detail : ""}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run it to make sure it fails**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/theme.test.js
```

Expected: a module-resolution error — `Cannot find module .../app/theme.js`. That is the correct red:
`app/theme.js` does not exist yet.

- [ ] **Step 3: Write `app/theme.js`**

```js
// theme.js — the reader's light/dark preference, and the only thing in the app that ever SETS it.
//
// THE CSS SIDE HAS EXISTED SINCE THE 2026-08-16 BRAND PASS and never had a way to be set: index.html
// defines :root (light), @media (prefers-color-scheme:dark), and the two :root[data-theme] override
// blocks, which outrank both by specificity. This module writes that one attribute.
//
// THREE STATES, NOT TWO. Following the OS is the current behaviour and the default. A two-state toggle
// would have to pick a starting side and would make "let the OS decide" UNREACHABLE — a regression for
// every user currently well served by doing nothing. So "system" is a first-class state, it is the
// initial state, and the cycle always returns to it.
//
// "system" REMOVES the attribute rather than writing data-theme="system". There is no palette block for
// that value and there must not be one (test/brand.test.js counts exactly four) — following the OS IS the
// absence of an override, so deleting the attribute is what lets the media query resume.
//
// NEVER THROWS. Safari private browsing throws on localStorage access, and this runs on the path that
// reveals the app. A cosmetic preference must never be able to stop a clinician getting into the tool —
// the same requirement usage.js carries for the beacon.
//
// NOT PART OF THE CASE. The case URL is shared between people and carries claims about the patient; the
// theme is a property of the reader's eyes. It is deliberately absent from S, encodeCase and syncURL, so
// a sender on dark mode does not impose dark mode on the recipient. Do not "fix" that asymmetry.
//
// Pure apart from the one `root` it is handed, which is why the whole resolve matrix is testable in node.

export const THEME_STORAGE_KEY = "nl_theme_v1"; // the nl_*_v1 convention: GATE_STORAGE_KEY, usage.js

// Cycle order. "system" is first because it is the default and the state the cycle returns to.
export const THEMES = ["system", "light", "dark"];

const isTheme = v => THEMES.includes(v);

// NOT a default parameter. `store = globalThis.localStorage` would be evaluated BEFORE the function body,
// so it would sit outside the try/catch — and Safari throws a SecurityError on the *property access* when
// cookies are blocked, not merely on setItem. That is precisely the case these functions promise to
// survive, so the lookup has to happen inside a guard.
function defaultStore() {
  try { return globalThis.localStorage || null; } catch { return null; }
}

/** The stored choice, or "system" for missing, unrecognised or unusable storage. */
export function readTheme(store) {
  try {
    const s = store === undefined ? defaultStore() : store;
    const v = s && s.getItem(THEME_STORAGE_KEY);
    return isTheme(v) ? v : "system";
  } catch { return "system"; }
}

/** Persist the literal choice, "system" included. Returns what it stored. */
export function writeTheme(value, store) {
  const v = isTheme(value) ? value : "system";
  try {
    const s = store === undefined ? defaultStore() : store;
    if (s) s.setItem(THEME_STORAGE_KEY, v);
  } catch {}
  return v;
}

/** system -> light -> dark -> system. An unrecognised current value enters the cycle at "light". */
export function nextTheme(current) {
  const i = Math.max(0, THEMES.indexOf(current));
  return THEMES[(i + 1) % THEMES.length];
}

/**
 * What the page will ACTUALLY look like. `prefersDark` is passed in rather than read from matchMedia so
 * the whole matrix is testable in node with no DOM. An explicit choice ignores the OS — that is the
 * entire point of an override.
 */
export function resolveTheme(choice, prefersDark = false) {
  if (choice === "light" || choice === "dark") return choice;
  return prefersDark ? "dark" : "light";
}

/** Write the attribute the CSS reads. "system" deletes it, handing control back to the media query. */
export function applyTheme(choice, root = globalThis.document?.documentElement) {
  const v = isTheme(choice) ? choice : "system";
  if (root && root.dataset) {
    if (v === "system") delete root.dataset.theme;
    else root.dataset.theme = v;
  }
  return v;
}

const GLYPH = { system: "\u{1F5A5}", light: "☀", dark: "\u{1F319}" };
const NOUN  = { system: "follow system", light: "light", dark: "dark" };

/** The glyph shows the state you are IN, never the one the next click gives you. */
export function themeGlyph(choice) { return GLYPH[isTheme(choice) ? choice : "system"]; }

/**
 * title + aria-label. The glyph alone is ambiguous — "light" on a light OS and "system" on a light OS look
 * identical on screen — so the words carry both the current state and what the next click does.
 */
export function themeLabel(choice) {
  const v = isTheme(choice) ? choice : "system";
  return `Theme: ${NOUN[v]} — click for ${NOUN[nextTheme(v)]}`;
}
```

- [ ] **Step 4: Run the test — section 8 should still fail**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/theme.test.js
```

Expected: sections 1-7 all PASS; the six assertions in **section 8 FAIL**, because `app/index.html` has no
inline script and no `#theme-toggle` yet. Task 2 turns those green. Do not weaken section 8 to get a clean
run here — those failures are the plan working.

- [ ] **Step 5: Register the suite**

In `package.json`, add ` && node test/theme.test.js` to the `test` script, immediately after
`node test/gate.test.js` (it belongs with the other app-layer suites — gate, usage, case-url):

A TEXT replace, deliberately — `JSON.parse` + `JSON.stringify` would reformat the whole file and bury the
one-line change in a whole-file diff.

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node -e '
const fs=require("fs"), p="package.json", src=fs.readFileSync(p,"utf8");
if (src.includes("test/theme.test.js")) { console.log("already registered"); process.exit(0); }
const out = src.replace("node test/gate.test.js", "node test/gate.test.js && node test/theme.test.js");
if (out === src) { console.log("FAILED — anchor not found"); process.exit(1); }
fs.writeFileSync(p, out); console.log("registered");'
```

Expected output: `registered`. Then confirm the diff is exactly one line:

```bash
git diff --stat package.json
```

- [ ] **Step 6: Commit**

```bash
git add app/theme.js test/theme.test.js package.json
git commit -m "feat(app): the theme preference module — light, dark, follow-system

The CSS has been three-state theme-aware since the 2026-08-16 brand pass and
has never had anything able to set it. This is the pure half: the key, the
cycle, the resolve rule and the attribute write, all testable in node.

Three states rather than two — a two-state toggle would make following the OS
unreachable, which is a regression for anyone currently well served by the
default. \"system\" DELETES the attribute rather than writing a third value the
CSS cannot see.

Section 8 of the suite fails until the next commit, by design: it guards the
storage key literal that has to be duplicated into index.html's boot script."
```

---

### Task 2: Apply the stored theme before first paint

**Files:**
- Modify: `app/index.html` — inline `<head>` script above `<style>`; the `.theme-btn` rule; the button in `.head-right`
- Test: `test/theme.test.js` (section 8, already written — it goes green here)

**Interfaces:**
- Consumes: `THEME_STORAGE_KEY` (`"nl_theme_v1"`) from Task 1 — as a **literal**, since the inline script
  runs before any module loads and cannot import.
- Produces, for Task 3: a `<button id="theme-toggle" class="theme-btn">` in the header, present but inert.

- [ ] **Step 1: Run the test to see the red you are fixing**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/theme.test.js 2>&1 | grep FAIL
```

Expected: the six section-8 lines — inline boot script missing, key missing, `data-theme` missing, and
`id="theme-toggle"` missing.

- [ ] **Step 2: Add the blocking script to `<head>`, above `<style>`**

In `app/index.html`, between the `<title>` line and `<style>`, insert:

```html
<!-- Applied BEFORE first paint, on purpose. app.js is a deferred ES module that imports the whole engine
     graph, so anything it does happens after the body has already painted — on a cold GitHub Pages load
     that is a visible flash of the wrong theme for anyone who has overridden the OS. Users on "system"
     never flash: they have no attribute to set and the media query is already correct.
     The key is duplicated from app/theme.js (an inline script cannot import); test/theme.test.js §8
     asserts the two agree. Only light/dark are ever written — "system" is the ABSENCE of the attribute. -->
<script>try{var t=localStorage.getItem('nl_theme_v1');
if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;}catch(e){}</script>
```

- [ ] **Step 3: Add the `.theme-btn` rule**

In the stylesheet, immediately after the `.hemi-set` / `.card-ctrl select` rules (around line 223-226),
insert:

```css
  /* The theme toggle. Neutral by construction: a viewing preference is neither the product's identity nor
     the answer, so it takes the same band/line/muted treatment as every other header control. The brand
     accent is deliberately absent, and is not named here even in prose-as-code — the allowlist guard in
     test/brand.test.js scans this stylesheet as TEXT, comments included. */
  .theme-btn{flex:none;font:inherit;font-size:var(--fs-body);line-height:1;cursor:pointer;
    border:1px solid var(--line);background:var(--paper);color:var(--muted);
    border-radius:999px;padding:5px 10px;
    transition:border-color .12s,background .12s,color .12s;}
  .theme-btn:hover{border-color:var(--navy-2);background:var(--band);color:var(--ink);}
```

- [ ] **Step 4: Add the button to the header**

In `app/index.html`, inside `<div class="head-right">`, immediately after the `<label class="hemi-set">…</label>`
line, insert:

```html
        <button type="button" id="theme-toggle" class="theme-btn"></button>
```

The button is deliberately empty here — Task 3 fills the glyph and the labels from `themeGlyph()` /
`themeLabel()`, so the strings live in one place rather than being duplicated into the markup.

- [ ] **Step 5: Run the theme suite — it should now be fully green**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/theme.test.js
```

Expected: `0 failed`.

- [ ] **Step 6: Run the brand suite — the guard that this task could plausibly trip**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/brand.test.js
```

Expected: `0 failed`, including `all four palette blocks are found` and
`every var(--terra) rule is on the allowlist (7 allowed)`. If the allowlist line fails, the new CSS or its
comment named the brand token — remove it, do not add it to the allowlist.

- [ ] **Step 7: Verify by hand that the theme actually applies and does not flash**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node app/serve.mjs
```

Open http://localhost:8137/app/ (passphrase `NeuroLocaliser`). In the console run
`localStorage.setItem('nl_theme_v1','dark')`, then **reload**. Expected: the page arrives dark with no
parchment flash, and `document.documentElement.dataset.theme === 'dark'`. Repeat with `'light'`, then
`localStorage.removeItem('nl_theme_v1')` + reload and confirm it follows the OS again.

- [ ] **Step 8: Commit**

```bash
git add app/index.html
git commit -m "feat(app): apply the stored theme before first paint

Four lines of blocking script in <head>, above <style>. app.js is a deferred
module that imports the whole engine graph, so applying the theme there would
repaint after the body had already painted — a visible flash on a cold Pages
load for anyone who has overridden the OS.

The button ships inert; the next commit wires it. The storage key is now
duplicated into the markup, which is exactly what test/theme.test.js §8 guards."
```

---

### Task 3: Wire the toggle

**Files:**
- Modify: `app/app.js` — import; `paintFavicon()` split out of `paintBrand()`; `applyTheme` in `startGate()`;
  click binding in `boot()`; the `matchMedia` listener

**Interfaces:**
- Consumes: everything Task 1 produced, and the `#theme-toggle` button Task 2 added.
- Produces: nothing further consumes this.

- [ ] **Step 1: Import the module**

In `app/app.js`, immediately after the `import { checkPassphrase, GATE_STORAGE_KEY } from "./gate.js";`
line (currently line 14), add:

```js
import { readTheme, writeTheme, nextTheme, applyTheme, themeGlyph, themeLabel } from "./theme.js";
```

- [ ] **Step 2: Split `paintFavicon()` out of `paintBrand()`**

Replace the body of `paintBrand()` (currently around line 951-959) with:

```js
// One geometry, three call sites — the header mark, the gate mark and the favicon all come from brand.js,
// so there is no second copy of the logo to drift. Runs before the gate is shown.
function paintBrand() {
  // 32px balances the two-line lockup (byline + 26px wordmark ≈ 53px tall); 26px read small beside it.
  document.querySelectorAll("[data-brand-mark]").forEach(el => { el.innerHTML = markSVG({ size: 32 }); });
  document.querySelectorAll("[data-brand-version]").forEach(el => { el.textContent = `v${VERSION} \u00b7 Beta`; });
  paintFavicon();
}

// Split out because it is the ONLY part of the brand that has to be repainted when the theme changes: a
// data URI cannot inherit currentColor, so the accent is baked in at paint time and would otherwise go
// stale on toggle. The marks in the DOM use currentColor and need no help.
function paintFavicon() {
  let link = document.querySelector('link[rel="icon"]');
  if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
  link.type = "image/svg+xml";
  link.href = faviconDataURI(getComputedStyle(document.documentElement).getPropertyValue("--terra").trim() || "#d36d52");
}
```

- [ ] **Step 3: Apply the theme at the top of `startGate()`**

Change the first line of `startGate()` (currently line 962) from `paintBrand();` to:

```js
  // The inline script in index.html already set the attribute before first paint; this is what makes
  // theme.js the single source of truth for the button's state and for the favicon's colour read. It must
  // run BEFORE paintBrand(), which bakes the computed accent into the favicon data URI.
  applyTheme(readTheme());
  paintBrand();
```

- [ ] **Step 4: Bind the button in `boot()`**

In `boot()`, immediately after the `domSel` block (currently ending line 932), add:

```js
  // The theme is a per-USER preference like the dominant hemisphere, so it binds once here rather than on
  // every render. It is deliberately NOT in S and never reaches syncURL(): a case URL is shared between
  // people and carries the case, while the theme belongs to the reader's eyes.
  const themeBtn = document.getElementById("theme-toggle");
  if (themeBtn) {
    let choice = readTheme();
    const paintToggle = () => {
      themeBtn.textContent = themeGlyph(choice);
      themeBtn.title = themeLabel(choice);
      themeBtn.setAttribute("aria-label", themeLabel(choice));
    };
    paintToggle();
    themeBtn.onclick = () => {
      choice = writeTheme(nextTheme(choice));
      applyTheme(choice);
      paintFavicon();   // the accent is baked into the data URI, so it does not follow the CSS on its own
      paintToggle();
    };
    // While on "system" the CSS follows the OS by itself, but the favicon would not — it would be exactly
    // as stale as the toggle case above. Optional chaining because older Safari has no addEventListener here.
    globalThis.matchMedia?.("(prefers-color-scheme:dark)")
      ?.addEventListener?.("change", () => { if (choice === "system") paintFavicon(); });
  }
```

- [ ] **Step 5: Run the full suite**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test 2>&1 | tail -20
```

Expected: every suite passes and the run exits 0. The baseline before this branch was **6467 assertions**
across 69 suites; this branch adds `test/theme.test.js`, so both totals rise and nothing else moves. Record
the new totals — they go into the CLAUDE.md note in Task 4 and into the report to the owner.

- [ ] **Step 6: Verify in the browser, both themes and system**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node app/serve.mjs
```

At http://localhost:8137/app/ confirm each of these:
1. The button appears in the header beside `Dominant`, showing the glyph for the current state.
2. Clicking cycles system → light → dark → system, and the page actually changes on the two explicit steps.
3. `title` reads e.g. `Theme: dark — click for follow system`.
4. The favicon in the tab changes colour between light and dark.
5. Reloading keeps the choice; on `system`, `document.documentElement.dataset.theme` is `undefined`.
6. The header, output cards, safety bar, exam tree and the Code-stroke worksheet are all legible in dark —
   this is the first time anything has been able to force dark on a light-OS machine, so it is the first
   real look at those surfaces.
7. Load a case (a worked example), copy the case URL, and confirm the hash contains **no** theme parameter.

- [ ] **Step 7: Commit**

```bash
git add app/app.js
git commit -m "feat(app): wire the theme toggle

One header button cycling system -> light -> dark -> system, bound once in
boot() alongside the dominant-hemisphere select because it is the same kind of
thing: a per-user preference, not a per-case knob.

paintFavicon() splits out of paintBrand() because it is the only brand surface
that has to be repainted on toggle — a data URI cannot inherit currentColor, so
the accent is baked in and would otherwise go stale. A matchMedia listener does
the same job while on system, where the CSS needs no help but the icon does.

The theme is deliberately absent from S and syncURL(): a case URL is shared
between people and carries the case, not the reader's eyes."
```

---

### Task 4: Record it, and hand back for review

**Files:**
- Modify: `CLAUDE.md`
- Modify: `docs/superpowers/specs/2026-08-22-theme-toggle-design.md` (status line)
- Modify: `docs/superpowers/plans/2026-08-22-theme-toggle.md` (status line)

- [ ] **Step 1: Update the spec and plan status lines**

In both documents, change `**Status: specified 2026-08-22, not yet implemented.**` /
`**Status: not yet implemented.**` to `**Status: implemented 2026-08-22.** Branch `feat/theme-toggle`,
not merged — merging auto-deploys to the live Pages app, so the owner confirms first.`

- [ ] **Step 2: Add a section to `CLAUDE.md`**

Insert after the "Usage counter" section:

```markdown
## Theme toggle (DONE 2026-08-22)

**Branch `feat/theme-toggle`, not merged.** The CSS had been three-state theme-aware since the 2026-08-16
brand pass — `:root`, `@media (prefers-color-scheme:dark)`, and the two `:root[data-theme]` override blocks
— and **nothing had ever been able to set it**. `app/theme.js` is that missing half: key, cycle, resolve
rule, attribute write, button strings, all pure and testable in node.

**THREE STATES, NOT TWO.** Following the OS is the default, so a two-state toggle would make it
UNREACHABLE. `system` is first-class, is the initial state, and the cycle returns to it. **`system` DELETES
`data-theme`** rather than writing a third value — there is no palette block for it and there must not be
one (`test/brand.test.js` counts exactly four).

**APPLIED BY A BLOCKING `<script>` IN `<head>`, above `<style>`.** `app.js` is a deferred module importing
the whole engine graph, so applying the theme there repaints after first paint — a visible flash on a cold
Pages load for anyone who has overridden the OS. The cost is the storage key living in two files;
`test/theme.test.js` §8 asserts they agree, the same shape as `brand.test.js` scanning the stylesheet as
text.

**`paintFavicon()` split out of `paintBrand()`** — the favicon is the only brand surface that must be
repainted on toggle, because a data URI cannot inherit `currentColor` so the accent is baked in. A
`matchMedia` listener does the same while on `system`. Known and accepted: the tab strip is browser chrome
and follows the OS, so a light-page-on-dark-OS user gets the darker terracotta on a dark tab bar.

**THE THEME IS NOT PART OF THE CASE.** It never enters `S`, `encodeCase` or `syncURL()`. A case URL is
shared between people and carries claims about the patient; the theme belongs to the reader's eyes. Do not
"fix" that asymmetry — `sc=all` exists precisely because a link that showed the recipient something
different from the sender was a real bug.

**The toggle is NOT terracotta**, and that is the guard working as designed: a viewing preference is
neither the product's identity nor the answer, so it takes the neutral header treatment — the same
judgement that saw a terracotta focus ring deleted rather than allowlisted.

Spec/plan: `docs/superpowers/specs/2026-08-22-theme-toggle-design.md`,
`docs/superpowers/plans/2026-08-22-theme-toggle.md`.
```

- [ ] **Step 3: Final full run**

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test 2>&1 | tail -5
```

Expected: exit 0.

- [ ] **Step 4: Commit and stop**

```bash
git add CLAUDE.md docs/superpowers/
git commit -m "docs: record the theme toggle"
```

**Do NOT merge to `main`.** `origin/main` auto-redeploys to the live Pages app that ED clinicians use. Report
the branch, the assertion count and the browser verification to the owner, and let them decide.

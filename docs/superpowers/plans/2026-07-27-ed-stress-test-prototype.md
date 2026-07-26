# ED stress-test prototype — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the localhost-only teaching app a deployable, password-gated, safety-framed, robust, feedback-capturing prototype with an elevated "refined clinical" aesthetic — ready for ED doctors to stress-test.

**Architecture:** Pure `app/`-layer work plus a CSS refresh. Three new DOM-free logic modules (`case-url.js`, `feedback.js`, `gate.js`) are unit-tested the project's way; the DOM wiring (gate, URL sync, feedback button, error boundary) and the visual work are verified in the browser preview. Zero engine/model changes; zero new dependencies; no build step.

**Tech Stack:** Vanilla ES modules, native `URLSearchParams` / `crypto.subtle` / `localStorage` / `history.replaceState` — all available in the browser and in Node v24 (for tests). No framework, no bundler.

## Global Constraints

- **Runtime for every command:** `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"` prefix (no system Node). Example: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`.
- **Zero dependencies, zero build step.** No `npm install`, no bundler. New files are plain ES modules.
- **No engine/model changes.** Only `app/` and docs. The 48 existing suites (1664 assertions) must stay green.
- **Test convention:** each suite is a standalone script — `let pass=0,fail=0; const ok=(l,c)=>{c?pass++:fail++;console.log((c?"PASS  ":"FAIL  ")+l);}` … then `console.log(\`\n${pass} passed, ${fail} failed\`); process.exit(fail===0?0:1);`. Add each new suite to the `test` script in `package.json`.
- **No data leaves the browser** except the teaching-vocabulary findings a tester explicitly submits via the feedback form. The URL carries state in the **hash** (never a query string).
- **Passphrase honesty:** the client-side gate is a documented speed-bump, not real security. There is no patient data behind it.
- **Dev server:** `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node app/serve.mjs` → http://localhost:8137/app/ (use the harness Browser pane / `preview_start` to verify, not curl).

---

### Task 1: Case-URL serialize/deserialize module

Pure functions mapping app state ↔ URL-hash string. No DOM. Unknown/edited tokens are dropped, never thrown on.

**Files:**
- Create: `app/case-url.js`
- Test: `test/case-url.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `encodeCase(state) -> string` — state is `{tokens:Set<string>, onset?:string, mode?:string, selected?:string, dominant?:string, sensoryLevel?:string, distalReach?:string}`; returns a query-style string with **no** leading `#`.
  - `decodeCase(hash, opts?) -> partialState` — `hash` may include a leading `#`; `opts = {validFindings?:Set<string>, validSites?:Set<string>}`; returns a partial state object (only the keys present/valid). `tokens` comes back as a `Set`.

- [ ] **Step 1: Write the failing test**

Create `test/case-url.test.js`:

```js
// case-url.test.js — the case ⇄ URL-hash serializer is a pure, DOM-free string function (testable in node).
import { encodeCase, decodeCase } from "../app/case-url.js";

let pass = 0, fail = 0;
const ok = (l, c) => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l); };

const validFindings = new Set(["weak_arm", "weak_leg", "spinothalamic"]);
const validSites = new Set(["right_pons_basis_pontis", "left_mca_deep"]);

// round-trip
const state = { tokens: new Set(["weak_arm@left", "weak_leg@left"]), onset: "acute", mode: "localise",
  selected: "right_pons_basis_pontis", dominant: "right", sensoryLevel: "T10", distalReach: "knees" };
const round = decodeCase("#" + encodeCase(state), { validFindings, validSites });
ok("round-trips the finding tokens", [...round.tokens].sort().join("|") === "weak_arm@left|weak_leg@left");
ok("round-trips onset", round.onset === "acute");
ok("round-trips the selected site", round.selected === "right_pons_basis_pontis");
ok("round-trips dominant hemisphere", round.dominant === "right");
ok("round-trips sensory level + distal reach", round.sensoryLevel === "T10" && round.distalReach === "knees");

// laterality preserved exactly
const lat = decodeCase("#" + encodeCase({ tokens: new Set(["weak_arm@right"]) }), { validFindings });
ok("preserves side (right, not left)", [...lat.tokens][0] === "weak_arm@right");

// malformed / unknown input degrades safely
ok("empty hash yields no tokens", decodeCase("", { validFindings }).tokens === undefined);
ok("garbage hash does not throw", (() => { try { decodeCase("#@@@&&&=%%%", { validFindings }); return true; } catch { return false; } })());
const dropped = decodeCase("#f=weak_arm@left,made_up_finding@left,noside", { validFindings });
ok("drops unknown finding ids", [...dropped.tokens].join("|") === "weak_arm@left");
ok("drops tokens with no side", ![...dropped.tokens].some(t => t === "noside"));
const badSite = decodeCase("#f=weak_arm@left&s=not_a_site", { validFindings, validSites });
ok("drops an unknown selected site", badSite.selected === undefined);
ok("rejects an unknown mode", decodeCase("#m=wat", {}).mode === undefined);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/case-url.test.js`
Expected: FAIL — `Cannot find module '../app/case-url.js'` (or import error).

- [ ] **Step 3: Write minimal implementation**

Create `app/case-url.js`:

```js
// case-url.js — serialize/deserialize the shareable "case": the subset of app state that defines what a
// tester sees. Pure (no DOM), so unit-testable. The URL *hash* carries it (never a query string), so it
// never reaches a server log. Unknown / hand-edited tokens are dropped, never thrown on. See
// docs/superpowers/specs/2026-07-27-ed-stress-test-prototype-design.md.

export function encodeCase(state) {
  const p = new URLSearchParams();
  const toks = [...(state.tokens || [])];
  if (toks.length) p.set("f", toks.join(","));
  if (state.onset) p.set("o", state.onset);
  if (state.mode && state.mode !== "localise") p.set("m", state.mode);
  if (state.selected) p.set("s", state.selected);
  if (state.dominant && state.dominant !== "left") p.set("dom", state.dominant);
  if (state.sensoryLevel) p.set("sl", state.sensoryLevel);
  if (state.distalReach) p.set("dr", state.distalReach);
  return p.toString();
}

export function decodeCase(hash, opts = {}) {
  const validFindings = opts.validFindings || null; // null = accept any finding id
  const validSites = opts.validSites || null;       // null = accept any site id
  const out = {};
  let p;
  try { p = new URLSearchParams(String(hash || "").replace(/^#/, "")); } catch { return out; }
  const f = p.get("f");
  if (f) {
    const toks = f.split(",").map(t => t.trim()).filter(Boolean).filter(tok => {
      const [id, side] = tok.split("@");
      if (!id || !side) return false;
      if (validFindings && !validFindings.has(id)) return false;
      return true;
    });
    if (toks.length) out.tokens = new Set(toks);
  }
  const o = p.get("o"); if (o) out.onset = o;
  const m = p.get("m"); if (m === "localise" || m === "atlas") out.mode = m;
  const s = p.get("s"); if (s && (!validSites || validSites.has(s))) out.selected = s;
  const dom = p.get("dom"); if (dom === "left" || dom === "right") out.dominant = dom;
  const sl = p.get("sl"); if (sl) out.sensoryLevel = sl;
  const dr = p.get("dr"); if (dr) out.distalReach = dr;
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/case-url.test.js`
Expected: PASS — `12 passed, 0 failed`.

- [ ] **Step 5: Add the suite to the test chain**

In `package.json`, append to the end of the `test` script string (after `node test/neuraxis-diagram.test.js`):

```
 && node test/case-url.test.js
```

- [ ] **Step 6: Commit**

```bash
git add app/case-url.js test/case-url.test.js package.json
git commit -m "feat(app): shareable case ⇄ URL-hash serializer (pure, validated)"
```

---

### Task 2: Feedback URL builder

Pure builder that turns a case into a pre-filled external-form URL. The form URL + field ids are one config block the owner swaps for the real form later.

**Files:**
- Create: `app/feedback.js`
- Test: `test/feedback-url.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `FEEDBACK_CONFIG` — `{ base:string, usePrefillFlag:boolean, fields:{caseUrl:string, topResult:string, findings:string} }` (placeholder Google-Form values).
  - `buildFeedbackURL(data, config?) -> string` — `data = {caseUrl?, topResult?, findings?}`; returns `base` with encoded prefill params for the present fields.

- [ ] **Step 1: Write the failing test**

Create `test/feedback-url.test.js`:

```js
// feedback-url.test.js — the feedback prefill-URL builder is a pure function (DOM-free, testable in node).
import { buildFeedbackURL } from "../app/feedback.js";

let pass = 0, fail = 0;
const ok = (l, c) => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l); };

const cfg = { base: "https://example.test/form", usePrefillFlag: true,
  fields: { caseUrl: "entry.1", topResult: "entry.2", findings: "entry.3" } };

const url = buildFeedbackURL({ caseUrl: "https://app/#f=weak_arm@left", topResult: "basis pontis (right_pons_basis_pontis)", findings: "weak_arm@left" }, cfg);
ok("starts from the configured base", url.startsWith("https://example.test/form?"));
ok("adds the Google-Forms prefill flag", url.includes("usp=pp_url"));
ok("encodes the case url under its field id", url.includes("entry.1=") && url.includes("weak_arm%40left"));
ok("includes the top result field", url.includes("entry.2=basis+pontis") || url.includes("entry.2=basis%20pontis"));
ok("includes the findings field", url.includes("entry.3=weak_arm%40left"));

const partial = buildFeedbackURL({ findings: "weak_leg@left" }, cfg);
ok("omits absent fields", !partial.includes("entry.1") && !partial.includes("entry.2") && partial.includes("entry.3="));

const empty = buildFeedbackURL({}, { base: "https://example.test/form", usePrefillFlag: false, fields: {} });
ok("empty data + no flag returns the bare base", empty === "https://example.test/form");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/feedback-url.test.js`
Expected: FAIL — `Cannot find module '../app/feedback.js'`.

- [ ] **Step 3: Write minimal implementation**

Create `app/feedback.js`:

```js
// feedback.js — a "Report a problem" button opens an external form (Google Form / Tally) pre-filled with
// the exact case link + top result + findings, so a tester's report is reproducible. Pure URL builder
// (unit-testable); the form URL + field ids are ONE config block the owner swaps for the real form.
//
// PLACEHOLDER config below. For a Google Form: `base` is the "…/viewform" URL; each `fields.*` is that
// question's entry id (open the form's prefill view, fill dummy text, "Get pre-filled link", read the
// entry.<n> ids from the generated URL). `usePrefillFlag` adds `?usp=pp_url` as Google Forms expects.

export const FEEDBACK_CONFIG = {
  base: "https://docs.google.com/forms/d/e/PLACEHOLDER_FORM_ID/viewform",
  usePrefillFlag: true,
  fields: {
    caseUrl:   "entry.100000001",
    topResult: "entry.100000002",
    findings:  "entry.100000003",
  },
};

export function buildFeedbackURL(data = {}, config = FEEDBACK_CONFIG) {
  const p = new URLSearchParams();
  if (config.usePrefillFlag) p.set("usp", "pp_url");
  const map = config.fields || {};
  if (map.caseUrl && data.caseUrl) p.set(map.caseUrl, data.caseUrl);
  if (map.topResult && data.topResult) p.set(map.topResult, data.topResult);
  if (map.findings && data.findings) p.set(map.findings, data.findings);
  const qs = p.toString();
  return qs ? `${config.base}?${qs}` : config.base;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/feedback-url.test.js`
Expected: PASS — `7 passed, 0 failed`.

- [ ] **Step 5: Add the suite to the test chain**

In `package.json`, append to the end of the `test` script string:

```
 && node test/feedback-url.test.js
```

- [ ] **Step 6: Commit**

```bash
git add app/feedback.js test/feedback-url.test.js package.json
git commit -m "feat(app): feedback prefill-URL builder + placeholder form config"
```

---

### Task 3: Gate logic (passphrase hashing)

Pure hash-and-compare for the client-side passphrase gate. DOM/overlay wiring is Task 4.

**Files:**
- Create: `app/gate.js`
- Test: `test/gate.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `GATE_STORAGE_KEY` — string `"nl_gate_v1"`.
  - `PASSPHRASE_DIGEST` — SHA-256 hex of the shipped passphrase (default = hash of `"neuro"`, to be replaced pre-deploy).
  - `async sha256hex(text) -> string` — lowercase hex digest.
  - `async checkPassphrase(input, digest?) -> boolean` — hashes `input`, compares to `digest` (defaults to `PASSPHRASE_DIGEST`).

- [ ] **Step 1: Write the failing test**

Create `test/gate.test.js` (async — wrap in an IIFE, exit inside):

```js
// gate.test.js — the passphrase gate's hash-and-compare is pure (uses WebCrypto, present in node v24).
// HONEST: the gate is a speed-bump, not real security. This just proves the compare works.
import { sha256hex, checkPassphrase } from "../app/gate.js";

let pass = 0, fail = 0;
const ok = (l, c) => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l); };

// Fixed known digest (SHA-256 of "test-pass"), independent of the app's real PASSPHRASE_DIGEST.
const TEST_DIGEST = "661ea2edce1d4894ab62edb966f83c890f6c90399109e3826193461ce333b5e1";

(async () => {
  ok("sha256hex('test-pass') matches the known digest", (await sha256hex("test-pass")) === TEST_DIGEST);
  ok("sha256hex returns 64 hex chars", /^[0-9a-f]{64}$/.test(await sha256hex("anything")));
  ok("checkPassphrase accepts the right passphrase", (await checkPassphrase("test-pass", TEST_DIGEST)) === true);
  ok("checkPassphrase rejects a wrong passphrase", (await checkPassphrase("wrong", TEST_DIGEST)) === false);

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
})();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/gate.test.js`
Expected: FAIL — `Cannot find module '../app/gate.js'`.

- [ ] **Step 3: Write minimal implementation**

Create `app/gate.js`:

```js
// gate.js — client-side shared-passphrase check + safety acknowledgment. HONEST FRAMING: a speed-bump,
// NOT real security — the app files ship to the browser regardless. There is NO patient data behind it;
// it only keeps an unvalidated neuro tool off the open web casually. The DOM overlay lives in app.js.
//
// To change the passphrase, replace PASSPHRASE_DIGEST with the SHA-256 hex of the new phrase:
//   node -e "crypto.subtle.digest('SHA-256', new TextEncoder().encode('NEWPHRASE')).then(b=>console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')))"
// Choose a STRONG phrase: once the repo is public the digest is visible and a weak phrase is brute-forceable.

export const GATE_STORAGE_KEY = "nl_gate_v1"; // bump the suffix to force re-acknowledgment if copy changes

// Default = SHA-256 of "neuro". REPLACE before handing the URL to testers.
export const PASSPHRASE_DIGEST = "93643857b87ceed65536214b0565ba3eaee22cf6be2b28e618e93847b4024f19";

export async function sha256hex(text) {
  const data = new TextEncoder().encode(String(text));
  const buf = await globalThis.crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function checkPassphrase(input, digest = PASSPHRASE_DIGEST) {
  return (await sha256hex(input)) === digest;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/gate.test.js`
Expected: PASS — `4 passed, 0 failed`.

- [ ] **Step 5: Add the suite to the test chain**

In `package.json`, append to the end of the `test` script string:

```
 && node test/gate.test.js
```

- [ ] **Step 6: Commit**

```bash
git add app/gate.js test/gate.test.js package.json
git commit -m "feat(app): client-side passphrase gate logic (hash-and-compare)"
```

---

### Task 4: Wire the entry gate + persistent safety bar into the bootstrap

Add the gate overlay and safety bar to `index.html`; make `app.js` show the gate before the app and boot only after passphrase + acknowledgment. Browser-verified (DOM, not unit-tested).

**Files:**
- Modify: `app/index.html:111-129` (body structure + gate/safebar markup) and its `<style>` block (gate/safebar CSS)
- Modify: `app/app.js:341-346` (bootstrap) and `app/app.js:1-12` (imports)

**Interfaces:**
- Consumes: `checkPassphrase`, `GATE_STORAGE_KEY` from Task 3; `renderLocalise`/`renderAtlas` (existing in app.js).
- Produces: `boot()` — wires `#modes` + does the first render; called only after the gate passes. (Task 5 will add `restoreFromURL()` inside it.)

- [ ] **Step 1: Restructure the body in `app/index.html`**

Replace the body (lines 111–129, from `<body>` to `</html>`) with:

```html
<body>
<div id="gate" class="gate">
  <div class="gate-card">
    <h1 class="wordmark"><span class="n">NEURO</span><span class="l">LOCALISER</span></h1>
    <p class="gate-sub">Teaching prototype — access for invited testers</p>
    <form id="gate-form" autocomplete="off">
      <label class="gate-lbl">Access passphrase
        <input type="password" id="gate-pass" autocomplete="off" autofocus>
      </label>
      <label class="gate-ack"><input type="checkbox" id="gate-ack">
        <span>I understand this is a <b>teaching prototype</b> — not a medical device and not for clinical decisions — I will <b>not enter patient identifiers</b>, and I understand my findings stay in this browser.</span>
      </label>
      <button type="submit" class="gate-go">Enter</button>
      <p class="gate-err" id="gate-err" role="alert"></p>
    </form>
  </div>
</div>
<div id="app-shell">
  <div class="wrap">
    <header>
      <div>
        <h1 class="wordmark"><span class="n">NEURO</span><span class="l">LOCALISER</span></h1>
        <p class="subtitle">Findings in → <b>where</b> · <b>why</b> · <b>what</b> — localisation derived from anatomy, not a stored list</p>
      </div>
      <div class="modes" id="modes">
        <button data-mode="localise" class="on">Localise</button>
        <button data-mode="atlas">Atlas</button>
      </div>
    </header>
    <div id="app"></div>
    <footer>Built directly on the engine (<code>solve()</code> + <code>causesFor()</code>) — zero dependencies, no build step.</footer>
  </div>
  <div class="safebar" role="note"><b>Teaching prototype.</b> Not a medical device; not for clinical decisions. No patient identifiers. Findings stay in your browser.</div>
</div>
<script type="module" src="./app.js"></script>
</body>
</html>
```

(The old faint `.disc` line is removed — the safety bar replaces it.)

- [ ] **Step 2: Add gate + safebar CSS**

In `app/index.html`, immediately before `</style>` (line 109), add:

```css
  /* entry gate + safety bar (ED stress-test build) */
  #gate,#app-shell{display:none;}
  .gate{position:fixed;inset:0;z-index:100;display:none;align-items:center;justify-content:center;padding:24px;
    background:radial-gradient(1100px 560px at 100% -10%,color-mix(in srgb,var(--terra) 8%,transparent),transparent 60%),var(--cream);}
  .gate.show{display:flex;}
  .gate-card{width:min(420px,100%);background:var(--paper);border:1px solid var(--line);border-radius:16px;
    box-shadow:var(--shadow);padding:26px 24px;}
  .gate-card .wordmark{font-size:22px;margin:0 0 2px;}
  .gate-sub{font-size:12.5px;color:var(--muted);margin:0 0 18px;}
  .gate-lbl{display:block;font-size:12px;font-weight:700;color:var(--navy);margin-bottom:14px;}
  .gate-lbl input{display:block;width:100%;margin-top:5px;font:inherit;font-size:14px;padding:9px 11px;
    border:1px solid var(--line);border-radius:9px;background:var(--band);color:var(--ink);}
  .gate-ack{display:flex;gap:9px;align-items:flex-start;font-size:11.5px;color:var(--muted);line-height:1.45;margin-bottom:16px;cursor:pointer;}
  .gate-ack input{margin-top:2px;flex:none;}
  .gate-go{width:100%;font:inherit;font-weight:800;font-size:14px;border:0;border-radius:10px;padding:11px;
    background:var(--terra);color:#fff;cursor:pointer;box-shadow:var(--shadow);transition:filter .15s ease;}
  .gate-go:hover{filter:brightness(1.05);}
  .gate-err{min-height:16px;font-size:12px;color:var(--red);margin:10px 0 0;}
  #app-shell.show{display:block;}
  .safebar{position:sticky;bottom:0;font-size:11px;color:var(--muted);text-align:center;
    padding:7px 12px;background:color-mix(in srgb,var(--band) 92%,transparent);border-top:1px solid var(--line);
    backdrop-filter:saturate(1.1) blur(3px);}
  .safebar b{color:var(--ink);}
```

- [ ] **Step 3: Add the gate import + rewrite the bootstrap in `app/app.js`**

Add to the import block (after line 12, `import { EXAM_TREE, flattenFindings } from "./exam-map.js";`):

```js
import { checkPassphrase, GATE_STORAGE_KEY } from "./gate.js";
```

Replace the bottom of the file (lines 341–345, the `// ================= modes =================` block through `renderLocalise();`) with:

```js
// ================= modes + bootstrap =================
function boot() {
  document.getElementById("modes").onclick = e => { const m = e.target.dataset.mode; if (!m || m===S.mode) return;
    S.mode = m; document.querySelectorAll("#modes button").forEach(b=>b.classList.toggle("on", b.dataset.mode===m));
    S.mode==="localise" ? renderLocalise() : renderAtlas(); };
  // Reflect the (possibly URL-restored — Task 5) mode in the toggle before the first render.
  document.querySelectorAll("#modes button").forEach(b => b.classList.toggle("on", b.dataset.mode === S.mode));
  S.mode === "atlas" ? renderAtlas() : renderLocalise();
}

function reveal() {
  document.getElementById("gate").classList.remove("show");
  document.getElementById("app-shell").classList.add("show");
}

async function startGate() {
  const gateEl = document.getElementById("gate");
  if (localStorage.getItem(GATE_STORAGE_KEY) === "ok") { reveal(); boot(); return; }
  gateEl.classList.add("show");
  document.getElementById("gate-form").onsubmit = async ev => {
    ev.preventDefault();
    const errEl = document.getElementById("gate-err");
    if (!document.getElementById("gate-ack").checked) { errEl.textContent = "Please tick the acknowledgment to continue."; return; }
    const okPass = await checkPassphrase(document.getElementById("gate-pass").value);
    if (!okPass) { errEl.textContent = "Incorrect passphrase."; return; }
    try { localStorage.setItem(GATE_STORAGE_KEY, "ok"); } catch {}
    reveal(); boot();
  };
}
startGate();
```

- [ ] **Step 4: Verify in the browser**

Start the dev server and open the app:

Run (harness): `preview_start {name: "neurolocaliser"}` — if `.claude/launch.json` has no such entry, create it with `runtimeExecutable: "node"`, `runtimeArgs: ["app/serve.mjs"]`, `port: 8137`, then open `http://localhost:8137/app/`.

Then verify:
- On first load only the gate card shows (app chrome hidden).
- Ticking the box + a wrong passphrase → "Incorrect passphrase."; leaving the box unticked → the acknowledgment message.
- Entering `neuro` (the default) + ticked box → app reveals, the exam tree + modes render.
- Reload → app shows immediately (localStorage remembered); the safety bar is visible pinned at the bottom.
- `read_console_messages` shows no errors.

To re-test the gate: in the browser, `localStorage.removeItem("nl_gate_v1")` then reload.

- [ ] **Step 5: Commit**

```bash
git add app/index.html app/app.js
git commit -m "feat(app): entry gate (passphrase + safety acknowledgment) and persistent safety bar"
```

---

### Task 5: Sync app state ↔ URL hash (shareable/restorable cases)

Restore state from the hash on boot; keep the hash live as state changes. Browser-verified.

**Files:**
- Modify: `app/app.js:1-12` (imports), the `boot()` function (from Task 4), `renderResults()` (~line 143), the mode-switch handler in `boot()`.

**Interfaces:**
- Consumes: `encodeCase`, `decodeCase` from Task 1; `FINDINGS` (already imported), `CANDIDATES` (already defined at app.js:15).
- Produces: `restoreFromURL()` and `syncURL()` (module-internal).

- [ ] **Step 1: Add imports + the two helpers**

Add to the import block:

```js
import { encodeCase, decodeCase } from "./case-url.js";
```

Add, just after the `const S = {...}` line (app.js:39) and `const app = ...` (line 40):

```js
const VALID_FINDINGS = new Set(Object.keys(FINDINGS));
const VALID_SITES = new Set(CANDIDATES.map(s => s.id));

function restoreFromURL() {
  const st = decodeCase(location.hash, { validFindings: VALID_FINDINGS, validSites: VALID_SITES });
  if (st.tokens) S.tokens = st.tokens;
  if (st.onset) S.onset = st.onset;
  if (st.mode) S.mode = st.mode;
  if (st.selected) S.selected = st.selected;
  if (st.dominant) S.dominant = st.dominant;
  if (st.sensoryLevel) S.sensoryLevel = st.sensoryLevel;
  if (st.distalReach) S.distalReach = st.distalReach;
}

function syncURL() {
  const hash = encodeCase(S);
  history.replaceState(null, "", hash ? "#" + hash : location.pathname + location.search);
}
```

- [ ] **Step 2: Call `restoreFromURL()` at boot**

In `boot()` (added in Task 4), add `restoreFromURL();` as the **first** line (before the modes toggle reflection), so the restored `S.mode`/tokens drive the first render:

```js
function boot() {
  restoreFromURL();
  document.getElementById("modes").onclick = e => { const m = e.target.dataset.mode; if (!m || m===S.mode) return;
    S.mode = m; document.querySelectorAll("#modes button").forEach(b=>b.classList.toggle("on", b.dataset.mode===m));
    S.mode==="localise" ? renderLocalise() : renderAtlas(); syncURL(); };
  document.querySelectorAll("#modes button").forEach(b => b.classList.toggle("on", b.dataset.mode === S.mode));
  S.mode === "atlas" ? renderAtlas() : renderLocalise();
}
```

(Note the added `syncURL();` at the end of the modes `onclick`.)

- [ ] **Step 3: Call `syncURL()` when the localise result state settles**

In `renderResults()`, immediately after `S.selected = sel.site.id;` (app.js:143), add:

```js
  syncURL();
```

This runs on every findings/onset/side/selection change (they all re-enter `renderResults`), keeping the hash current *before* the header (and its feedback link, Task 6) is built.

- [ ] **Step 4: Verify in the browser**

- Add a couple of findings (e.g. weak arm L, weak leg L); confirm the address bar hash updates to something like `#f=weak_arm@left,weak_leg@left`.
- Click a different candidate in the Where list → hash gains `&s=<siteid>`.
- Copy the URL, open it in a **new tab** (via `navigate`) → the same findings + selection are restored and the same result renders.
- Hand-edit the hash to include a junk token (e.g. `,zzz@left`) and reload → app loads without error, junk dropped (`read_console_messages` clean).
- Remove all findings → hash clears back to no `#…`.

- [ ] **Step 5: Commit**

```bash
git add app/app.js
git commit -m "feat(app): sync case state to the URL hash (shareable, restorable, junk-safe)"
```

---

### Task 6: "Report a problem" feedback button

Add a feedback link to the result header (and reuse it in the error panel, Task 7), pre-filled with the live case URL + top result + findings.

**Files:**
- Modify: `app/app.js:1-12` (import), `resultHeader()` (app.js:165-179), plus a small `feedbackButton()` helper.

**Interfaces:**
- Consumes: `buildFeedbackURL` from Task 2; `syncURL()` from Task 5 (ensures `location.href` is current before the header is built); `siteName`, `esc` (existing).
- Produces: `feedbackButton(list) -> string` (module-internal).

- [ ] **Step 1: Add the import + helper**

Add to the import block:

```js
import { buildFeedbackURL } from "./feedback.js";
```

Add above `resultHeader` (before app.js:165):

```js
// A "Report a problem" link → the external form, pre-filled with the LIVE case URL (syncURL ran first),
// the top candidate, and the findings. Only teaching-vocabulary findings leave, only on click.
function feedbackButton(list) {
  const top = (list && list[0]) ? `${siteName(list[0].site)} (${list[0].site.id})` : "";
  const url = buildFeedbackURL({ caseUrl: location.href, topResult: top, findings: [...S.tokens].join(", ") });
  return `<a class="report-btn" href="${esc(url)}" target="_blank" rel="noopener" title="Opens a feedback form — do not include patient identifiers">⚑ Report a problem</a>`;
}
```

- [ ] **Step 2: Put the button in the header**

In `resultHeader()`, change the returned template's `.oh-lead` line to include the button on the right:

Replace:

```js
    <div class="oh-lead"><b>${esc(siteName(sel.site))}</b><span class="oh-loc">${esc(siteLoc(sel.site))}${sel.site.territory?` · ${esc(sel.site.territory)}`:""}</span></div>
```

with:

```js
    <div class="oh-lead"><div class="oh-lead-txt"><b>${esc(siteName(sel.site))}</b><span class="oh-loc">${esc(siteLoc(sel.site))}${sel.site.territory?` · ${esc(sel.site.territory)}`:""}</span></div>${feedbackButton(list)}</div>
```

- [ ] **Step 3: Style the button**

In `app/index.html`, before `</style>`, add:

```css
  .oh-lead{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;}
  .oh-lead-txt{min-width:0;}
  .report-btn{flex:none;font-size:11px;font-weight:700;color:var(--muted);text-decoration:none;
    border:1px solid var(--line);border-radius:999px;padding:4px 10px;white-space:nowrap;transition:border-color .15s,color .15s;}
  .report-btn:hover{border-color:var(--terra);color:var(--terra);}
```

- [ ] **Step 4: Verify in the browser**

- With findings entered, a "⚑ Report a problem" pill appears top-right of the result header.
- Hovering shows the "do not include patient identifiers" title.
- Clicking opens a new tab to the placeholder form URL with the case link, top result, and findings in the query — inspect via `read_page`/the address bar that `entry.…=` params are present and URL-encoded. (The form 404s until the owner swaps in the real form — expected.)

- [ ] **Step 5: Commit**

```bash
git add app/app.js app/index.html
git commit -m "feat(app): 'Report a problem' feedback button, pre-filled with the live case"
```

---

### Task 7: Friendly top-level error boundary

Replace the current developer-style render-error message with a friendly panel carrying the case link + report button; guard the boot render too.

**Files:**
- Modify: `app/app.js` — the `catch` in `renderResults()` (app.js:151), a new `errorPanel()` helper, and the render dispatch in `boot()`.

**Interfaces:**
- Consumes: `buildFeedbackURL` (Task 6), `esc` (existing).
- Produces: `errorPanel(err) -> string` (module-internal).

- [ ] **Step 1: Add the `errorPanel` helper**

Add near `feedbackButton` (before `resultHeader`):

```js
// A friendly failure panel — never a blank/broken page. Carries the case link + a report button so a
// tester can send exactly what broke. Technical detail is tucked behind a disclosure.
function errorPanel(err) {
  const url = buildFeedbackURL({ caseUrl: location.href, topResult: "(render error)", findings: [...S.tokens].join(", ") });
  return `<div class="err-panel">
    <b>Something went wrong showing this case.</b>
    <p>This is a prototype and your input is safe. Please help us by reporting it — the exact case is attached automatically.</p>
    <a class="report-btn" href="${esc(url)}" target="_blank" rel="noopener">⚑ Report this problem</a>
    <details style="margin-top:8px"><summary style="font-size:11px;color:var(--muted)">Technical detail</summary><small style="color:var(--muted)">${esc(String(err))}</small></details>
  </div>`;
}
```

- [ ] **Step 2: Use it in `renderResults`'s catch**

Replace the catch block (app.js:151):

```js
  } catch (err) { el.innerHTML = `<h3>Possible lesions</h3><div class="empty" style="text-align:left;color:var(--contra)">render error: ${esc(String(err))}<br><small>${esc((err.stack||"").split("\n").slice(0,4).join(" | "))}</small></div>`; return; }
```

with:

```js
  } catch (err) { el.innerHTML = `<h3>Possible lesions</h3>` + errorPanel(err); return; }
```

- [ ] **Step 3: Guard the boot render**

In `boot()`, wrap the final render dispatch in try/catch so a first-render failure still shows the panel in `#app`:

Replace:

```js
  S.mode === "atlas" ? renderAtlas() : renderLocalise();
```

with:

```js
  try { S.mode === "atlas" ? renderAtlas() : renderLocalise(); }
  catch (err) { app.innerHTML = errorPanel(err); }
```

- [ ] **Step 4: Style the panel**

In `app/index.html`, before `</style>`, add:

```css
  .err-panel{border:1px solid var(--red);background:var(--red-bg);border-radius:10px;padding:14px 15px;}
  .err-panel b{color:var(--ink);} .err-panel p{font-size:12.5px;color:var(--muted);margin:6px 0 10px;}
```

- [ ] **Step 5: Verify in the browser**

- Temporarily force a throw to see the panel: in the browser console run `neuroForceError = true` — *(no such hook exists; instead)* temporarily hand-edit `renderResults` to `throw new Error("test")` at its top, reload, confirm the friendly panel (not a blank pane) with a working report link, then revert the throw.
- Confirm normal cases still render (no regression).
- `read_console_messages` clean.

- [ ] **Step 6: Commit**

```bash
git add app/app.js app/index.html
git commit -m "feat(app): friendly error boundary with case link + report button"
```

---

### Task 8: Aesthetic refresh — "refined clinical"

Elevate the existing navy/terracotta system toward a premium medical-instrument feel. Presentation-only CSS in `index.html`; tuned by eye in the browser (light + dark). No markup changes beyond earlier tasks.

**Files:**
- Modify: `app/index.html` `<style>` block (add a "refined clinical" layer near the end, before `</style>`, so it overrides earlier rules).

**Interfaces:** none (pure CSS).

- [ ] **Step 1: Add the refinement CSS layer**

In `app/index.html`, before `</style>`, add:

```css
  /* ===== refined-clinical aesthetic layer (overrides earlier rules) ===== */
  :root{--radius:14px;--shadow:0 1px 2px rgba(29,49,77,.04),0 8px 30px rgba(29,49,77,.07);
    --shadow-lift:0 2px 6px rgba(29,49,77,.06),0 16px 44px rgba(29,49,77,.10);}
  @media (prefers-color-scheme:dark){:root{--shadow:0 1px 2px rgba(0,0,0,.35),0 10px 34px rgba(0,0,0,.42);
    --shadow-lift:0 2px 8px rgba(0,0,0,.4),0 20px 52px rgba(0,0,0,.5);}}
  body{line-height:1.55;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;}
  .wrap{max-width:1180px;padding:clamp(16px,3.2vw,40px);}
  header{padding-bottom:16px;border-bottom:1px solid var(--line);margin-bottom:6px;}
  .wordmark{letter-spacing:.16em;}
  .subtitle{font-size:12.5px;letter-spacing:.01em;}
  .pane{border-radius:var(--radius);padding:18px 18px;transition:box-shadow .2s ease;}
  .pane h3{font-size:10.5px;letter-spacing:.09em;color:var(--faint);}
  /* the result focal moment */
  .out-head{border:1px solid var(--line);border-radius:var(--radius);background:
    linear-gradient(180deg,color-mix(in srgb,var(--terra) 7%,var(--paper)),var(--paper));
    box-shadow:var(--shadow-lift);padding:16px 16px 14px;margin-bottom:4px;}
  .oh-lead-txt b{font-size:17px;letter-spacing:-.01em;}
  .oh-loc{display:block;font-family:var(--mono);font-size:11px;color:var(--terra);margin-top:3px;}
  .oh-status{font-size:12.5px;color:var(--muted);margin:8px 0 0;}
  .out-card{border-radius:var(--radius);padding:14px 15px;box-shadow:var(--shadow);}
  .out-card>.out-cap{font-size:10px;letter-spacing:.1em;}
  /* differential rows: calmer, with a smooth active state */
  .difflist{border-radius:11px;}
  .drow{padding:8px 11px;transition:background .12s ease;}
  .drow.on{box-shadow:inset 3px 0 0 var(--terra);}
  .drow .dn b{letter-spacing:-.005em;}
  /* restrained motion: results/cards ease in; disclosures feel intentional */
  @media (prefers-reduced-motion:no-preference){
    .out-head,.out-card{animation:nlrise .28s ease both;}
    .out-card:nth-child(2){animation-delay:.03s;} .out-card:nth-child(3){animation-delay:.06s;}
    @keyframes nlrise{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;}}
  }
  /* mono for technical/anatomical tokens, sans for prose (consistency) */
  .why-item .t,.dloc,.oh-loc,.chip .sd{font-family:var(--mono);}
```

- [ ] **Step 2: Verify + tune in the browser (light and dark)**

- Reload with a worked case (weak arm L + weak leg L + a sensory finding).
- Check: the result header reads as the clear focal point; cards feel layered not boxy; rows have a calm hover + a clear active bar; the subtle rise animation is tasteful (not slow). `resize_window {colorScheme:"dark"}` and repeat — confirm shadows/gradients read well in dark.
- `resize_window {preset:"desktop"}` then screenshot for the record.
- Tune values inline if anything feels heavy (this step is expected to iterate 2–4 times); keep changes within this CSS layer.

- [ ] **Step 3: Commit**

```bash
git add app/index.html
git commit -m "style(app): refined-clinical aesthetic — focal result, layered cards, restrained motion"
```

---

### Task 9: Mobile ergonomics pass

Verify usability at phone width; apply targeted fixes only where genuinely bad. No new input mode.

**Files:**
- Modify: `app/index.html` `<style>` block (a `@media (max-width:560px)` refinement, before `</style>`).

**Interfaces:** none (CSS).

- [ ] **Step 1: Verify current phone-width behavior**

- `resize_window {preset:"mobile"}` (375×812). Load a case.
- Check: the grid collapses to one column; the L/R/M side buttons are tappable; chips are removable; the exam-tree summaries are tappable; the result cards are readable; nothing overflows horizontally.
- Note concrete problems (likely: side buttons/chip-close too small for a thumb; card padding tight).

- [ ] **Step 2: Apply the targeted fixes**

In `app/index.html`, before `</style>`, add:

```css
  @media (max-width:560px){
    .wrap{padding:12px;}
    .grid{gap:12px;}
    .pane{padding:14px 13px;}
    .sides button{min-width:36px;min-height:34px;font-size:12px;} /* thumb-sized side toggles */
    .frow{padding:7px 2px 7px 8px;}
    .chip{padding:4px 8px 4px 11px;font-size:12px;} .chip .x{font-size:15px;padding:0 2px;} /* easier remove */
    .difflist{max-height:none;} /* no nested scroll trap on a phone */
    .out-head{position:relative;} .oh-lead{flex-direction:column;} .report-btn{align-self:flex-start;}
    .ctrls{gap:8px 12px;}
  }
```

- [ ] **Step 3: Re-verify on mobile**

- Repeat Step 1's checks; confirm tap targets are comfortable, the report button sits below the site name, the differential doesn't create a scroll-within-scroll trap, and there's no horizontal overflow (`read_page`/screenshot).

- [ ] **Step 4: Commit**

```bash
git add app/index.html
git commit -m "style(app): mobile ergonomics — thumb-sized targets, no scroll traps at phone width"
```

---

### Task 10: Docs, README chain, and full-suite regression

Update the README test list + the two authoritative docs; confirm the whole suite is green.

**Files:**
- Modify: `README.md` (test chain / suite list, if present), `CLAUDE.md` (status), `CONTRIBUTING.md` (status/roadmap).

**Interfaces:** none.

- [ ] **Step 1: Run the full suite**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: every suite PASSes, process exits 0. Confirm the three new suites (`case-url`, `feedback-url`, `gate`) run at the end. New total ≈ **51 suites / ~1687 assertions** (1664 + 12 + 7 + 4).

- [ ] **Step 2: Update the README test list (if it enumerates suites)**

Run: `grep -n "neuraxis-diagram" README.md` — if the README lists the suites/`npm test` chain, add `case-url`, `feedback-url`, and `gate` alongside the others in the same style. If the README does not enumerate suites, skip this step.

- [ ] **Step 3: Update `CLAUDE.md` status**

In the "Status (current)" / milestones area of `CLAUDE.md`, add a milestone line:

```markdown
- **ED stress-test prototype (done)** — the app is now deployable for clinician stress-testing: a client-side
  passphrase gate + safety acknowledgment (`app/gate.js`), a persistent safety bar, shareable/restorable
  **case URLs** (`app/case-url.js`, state ↔ URL hash), a "Report a problem" button pre-filling an external
  form with the exact case (`app/feedback.js`), a friendly error boundary, a refined-clinical aesthetic pass,
  and a mobile ergonomics pass. Pure `app/`-layer + CSS; zero engine changes. Spec/plan:
  `docs/superpowers/{specs,plans}/2026-07-27-ed-stress-test-prototype*.md`. **Deploy is intentionally NOT done**
  — GitHub Pages needs the repo public + the local commits pushed (owner go-ahead required); swap the
  placeholder passphrase digest (`app/gate.js`) and feedback form config (`app/feedback.js`) before handing out the URL.
```

Also update the assertion/suite count in the status sentence to the new total from Step 1.

- [ ] **Step 4: Update `CONTRIBUTING.md`**

In the "Next"/roadmap area, mark the deploy-readiness work done and note the two remaining pre-deploy handoffs (real passphrase digest, real feedback form) + the deploy steps (below). Keep it to a few lines in the existing style.

- [ ] **Step 5: Commit**

```bash
git add README.md CLAUDE.md CONTRIBUTING.md
git commit -m "docs: mark ED stress-test prototype done; note pre-deploy handoffs"
```

---

## Deployment — DO NOT run without explicit owner go-ahead

Not checkbox tasks. These are outward-facing / hard-to-reverse and gated on a separate, explicit yes (the owner has been holding `main` local; `main` is ~26 commits ahead of `origin`).

1. **Swap the placeholders** (owner provides): replace `PASSPHRASE_DIGEST` in `app/gate.js` with the SHA-256 hex of the real passphrase; replace `FEEDBACK_CONFIG` in `app/feedback.js` with the real Google Form/Tally URL + entry ids. Commit.
2. **Confirm the public-repo tradeoff.** Free GitHub Pages requires a **public** repo — source, tests, `docs/superpowers/`, and the passphrase digest all become world-readable. If not acceptable, deploy via Cloudflare Pages / Netlify drag-deploy instead (keeps the repo private; same static files, same gate).
3. **Push** `main` to `origin` (explicit go-ahead required).
4. **Enable GitHub Pages** on the repo root (branch `main`, `/`). Verify the app loads at `https://<user>.github.io/<repo>/app/` and that `app/`'s `../src/` module imports resolve under the `/<repo>/` path prefix.
5. **Hand testers** the Pages URL + the passphrase; confirm the feedback form receives a test submission with the case link attached.

## Self-review notes (for the executor)

- All spec sections map to a task: gate → T3/T4; shareable URLs → T1/T5; feedback → T2/T6; safety bar → T4; error boundary → T7; aesthetic → T8; mobile → T9; tests + docs + regression → T1–T3 (tests) + T10; deploy → gated section.
- Types are consistent across tasks: `encodeCase`/`decodeCase` (T1) consumed in T5; `buildFeedbackURL`/`FEEDBACK_CONFIG` (T2) in T6/T7; `checkPassphrase`/`GATE_STORAGE_KEY` (T3) in T4; `boot()`/`syncURL()`/`errorPanel()`/`feedbackButton()` defined once and reused.
- No placeholders in the plan. (The *app* ships intentional, documented placeholders — the passphrase digest and the feedback form config — swapped at deploy, per the Deployment section.)
```
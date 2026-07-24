# Causes Breadth — Sieve Completion (Sub-project C) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every site the full plausible surgical sieve — keep the specific curated causes as the headline, and add a derived, region-tuned "sieve completion" for the plausible-but-missing categories, shown behind a toggle.

**Architecture:** `src/data/causes.js` gains `regionOf(site)` + `SIEVE_GENERICS` + a `completion` field on `causesFor`'s return (gap-fill: region generics minus categories already present, tempo-filtered). `app/app.js` `whatBlock` renders a "Complete the surgical sieve" collapsible from `res.completion`.

**Tech Stack:** Zero-dependency ES modules, Node v24 (off PATH — see Global Constraints). Standalone test scripts with a local `ok(label, cond)` helper.

## Global Constraints

- **Node is off PATH.** Prefix every `node`/`npm` command with `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"`.
- **Zero dependencies, no build step, `"type": "module"`.** No new packages.
- **Additive only.** Do not change the specific curated causes, the phonebook categoriser, `derive()`, the localisation engine, or ranking. `causesFor`'s existing return fields (`byCategory`, `all`, `onset`, `derived`, `source`) stay exactly as they are; only a new `completion` field is added.
- **Derive-don't-store.** The completion is a region template minus what's already present — not hand-authored per site.
- **Branch off `main`:**
  ```bash
  cd "/Users/jaydenwearne/Desktop/Personal/Claude Code/Projects/NeuroLocaliser/Code/neurolocaliser-engine"
  git checkout -b causes-breadth
  ```

---

### Task 1: `completion` field + `regionOf` / `sieveGenerics` in `causes.js`

**Files:**
- Modify: `src/data/causes.js` (add `regionOf`, `SIEVE_GENERICS`, `sieveGenerics`; extend `causesFor` return)
- Modify: `test/causes.test.js` (import `regionOf`; add completion assertions)

**Interfaces:**
- Produces: `export function regionOf(site): "parenchyma"|"peripheral"|"skull_base"|"motor_unit"|"optic"`; `export function sieveGenerics(site): Cause[]`; `causesFor(...)` return gains `completion: { cat, label, tint, causes }[]` (non-empty groups only; each cause flagged `generic: true`).

- [ ] **Step 1: Write the failing test**

In `test/causes.test.js`, change the import line:
```js
import { CATEGORIES, TEMPO, LIKELIHOOD, CAUSES, causesFor } from "../src/data/causes.js";
```
to:
```js
import { CATEGORIES, TEMPO, LIKELIHOOD, CAUSES, causesFor, regionOf } from "../src/data/causes.js";
```

Then insert this block immediately before the `// ---- report ----` line:

```js
// --- sieve completion (Sub-project C) ---
const icSite = SITES.find(s => s.id === "right_subcortex_internal_capsule");
const icRes = causesFor(icSite, {});
const icSpecificCats = new Set(icRes.byCategory.map(g => g.cat));
const icCompCats = new Set(icRes.completion.map(g => g.cat));
ok("internal capsule specifics are vascular-only", icSpecificCats.size === 1 && icSpecificCats.has("vascular"));
ok("internal capsule completion adds inflammatory", icCompCats.has("inflammatory"));
ok("internal capsule completion adds neoplastic", icCompCats.has("neoplastic"));
ok("internal capsule completion adds infective", icCompCats.has("infective"));
ok("internal capsule completion does NOT repeat vascular", !icCompCats.has("vascular"));
ok("every completion cause is flagged generic", icRes.completion.every(g => g.causes.every(x => x.generic === true)));

// regionOf classification (constructed sites avoid part-specific gotchas like optic_aion)
ok("regionOf: nerve → peripheral", regionOf({ level: "nerve", part: "median" }) === "peripheral");
ok("regionOf: skull_base → skull_base", regionOf({ level: "skull_base", part: "iam" }) === "skull_base");
ok("regionOf: cortex → parenchyma", regionOf({ level: "cortex", part: "mca" }) === "parenchyma");
ok("regionOf: visual_pathway → optic", regionOf({ level: "visual_pathway", part: "chiasm" }) === "optic");
ok("regionOf: an optic-named part overrides to optic", regionOf({ level: "skull_base", part: "optic_aion" }) === "optic");

// gap-fill invariant: completion categories are disjoint from specific categories, for every candidate site
const allSites = [...SITES];
for (const k of Object.keys(sitesMod)) if (k.startsWith("compose") && typeof sitesMod[k] === "function") { try { allSites.push(...sitesMod[k]()); } catch {} }
let disjointHolds = true, offender = null;
for (const s of allSites) {
  const r = causesFor(s, {});
  const spec = new Set(r.byCategory.map(g => g.cat));
  if (r.completion.some(g => spec.has(g.cat))) { disjointHolds = false; offender = s.id; break; }
}
ok("gap-fill invariant: completion never repeats a present category (all sites)", disjointHolds, offender);

// tempo filter applies to the completion
const icHyper = causesFor(icSite, { onset: "hyperacute" }).completion.flatMap(g => g.causes);
ok("completion is tempo-filtered by onset", icHyper.every(x => x.tempo.includes("hyperacute")));
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/causes.test.js 2>&1 | grep -E "FAIL|SyntaxError|is not|passed" | head
```
Expected: FAIL — `regionOf` is not exported (import error) and/or `icRes.completion` is `undefined`.

- [ ] **Step 3: Add `regionOf`, `SIEVE_GENERICS`, `sieveGenerics` to `causes.js`**

In `src/data/causes.js`, immediately after the `derive(site)` function (before the `// ---- public API ----` comment), insert:

```js
// ---- sieve completion: region-tuned generic causes for the plausible-but-missing categories ----
export function regionOf(site) {
  const L = site.level, part = site.part || "";
  if (L === "visual_pathway" || /optic/.test(part)) return "optic";
  if (["nerve", "plexus", "root", "polyneuropathy"].includes(L)) return "peripheral";
  if (L === "skull_base") return "skull_base";
  if (L === "motor_unit") return "motor_unit";
  return "parenchyma";
}
const SIEVE_GENERICS = {
  parenchyma: [
    c("Demyelination (e.g. MS plaque)", "inflammatory", ["subacute"], "uncommon"),
    c("Tumour / metastasis", "neoplastic", ["chronic"], "uncommon"),
    c("Abscess / focal infection", "infective", ["acute", "subacute"], "rare"),
    c("Ischaemic or haemorrhagic stroke", "vascular", ["hyperacute", "acute"], "uncommon"),
  ],
  peripheral: [
    c("Compression / entrapment", "traumatic", ["subacute", "chronic"], "uncommon"),
    c("Vasculitic / inflammatory neuropathy", "inflammatory", ["subacute"], "uncommon"),
    c("Diabetic / metabolic", "metabolic", ["subacute", "chronic"], "uncommon"),
    c("Nerve-sheath tumour", "neoplastic", ["chronic"], "rare"),
  ],
  skull_base: [
    c("Compressive mass (schwannoma / meningioma / metastasis)", "neoplastic", ["chronic"], "uncommon"),
    c("Skull-base infection (osteomyelitis / fungal)", "infective", ["subacute"], "rare", true),
    c("Granulomatous / inflammatory (sarcoid / Tolosa-Hunt)", "inflammatory", ["subacute"], "rare"),
  ],
  motor_unit: [
    c("Autoimmune (myasthenia / myositis)", "inflammatory", ["subacute", "chronic"], "uncommon"),
    c("Toxic / drug-induced", "metabolic", ["subacute"], "uncommon"),
    c("Degenerative / hereditary", "degenerative", ["chronic"], "uncommon"),
  ],
  optic: [
    c("Optic neuritis / demyelination", "inflammatory", ["subacute"], "uncommon"),
    c("Compressive (pituitary / meningioma)", "neoplastic", ["chronic"], "uncommon"),
    c("Ischaemic (AION)", "vascular", ["acute"], "uncommon"),
  ],
};
export function sieveGenerics(site) { return SIEVE_GENERICS[regionOf(site)] || SIEVE_GENERICS.parenchyma; }
```

- [ ] **Step 4: Extend `causesFor` to return `completion`**

In `src/data/causes.js`, in `causesFor`, replace the final return:
```js
  const byCategory = CATEGORIES
    .map(cat => ({ cat: cat.id, label: cat.label, tint: cat.tint, causes: filtered.filter(x => x.cat === cat.id) }))
    .filter(g => g.causes.length);
  return { byCategory, all: filtered, onset: onset || null, derived, source };
```
with:
```js
  const byCategory = CATEGORIES
    .map(cat => ({ cat: cat.id, label: cat.label, tint: cat.tint, causes: filtered.filter(x => x.cat === cat.id) }))
    .filter(g => g.causes.length);
  // sieve completion — region generics for the plausible categories not already present, tempo-filtered.
  // presentCats uses the UNfiltered list so a tempo-hidden specific category is not re-added generically.
  const presentCats = new Set(list.map(x => x.cat));
  const compAll = sieveGenerics(site)
    .filter(g => !presentCats.has(g.cat))
    .filter(g => !onset || g.tempo.includes(onset))
    .map(x => ({ ...x, generic: true }));
  const completion = CATEGORIES
    .map(cat => ({ cat: cat.id, label: cat.label, tint: cat.tint, causes: compAll.filter(x => x.cat === cat.id) }))
    .filter(g => g.causes.length);
  return { byCategory, all: filtered, onset: onset || null, derived, source, completion };
```

- [ ] **Step 5: Run the test to verify it passes**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/causes.test.js 2>&1 | tail -2
```
Expected: PASS — `N passed, 0 failed` (N = the prior 39 + the new assertions). No FAIL lines.

- [ ] **Step 6: Run the full suite**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test 2>&1 | grep -E "failed" | grep -v "0 failed" || echo "ALL SUITES GREEN"
```
Expected: `ALL SUITES GREEN`.

- [ ] **Step 7: Commit**

```bash
git add src/data/causes.js test/causes.test.js
git commit -m "feat(causes): sieve-completion (region generics for missing categories) on causesFor"
```

---

### Task 2: "Complete the surgical sieve" toggle in the app

**Files:**
- Modify: `app/app.js` (`whatBlock` — render `res.completion` behind a collapsible)
- Modify: `app/index.html` (small CSS for `.sieve` / generic tag)

**Interfaces:**
- Consumes: `res.completion` (Task 1). Reuses the existing `.catgrp` / `.cathead` / `.cause` markup.

- [ ] **Step 1: Render the completion toggle in `whatBlock`**

In `app/app.js` `whatBlock`, add a `sieve` block after `groups` is built. Insert, immediately after the `const groups = …).join("");` statement (the one ending at the `</div>\`).join("");` line):

```js
  const compN = (res.completion || []).reduce((n, g) => n + g.causes.length, 0);
  const sieve = compN ? `
    <details class="sieve" style="margin-top:8px"><summary>Complete the surgical sieve <span class="c">+${compN}</span></summary>
      <p class="derived" style="margin:4px 0 6px">Derived from site type — the other sieve categories a lesion here could fall into (not vetted per site).</p>
      ${res.completion.map(g => `
        <div class="catgrp"><div class="cathead"><span class="catdot" style="background:var(${g.tint})"></span>${esc(g.label)}</div>
          ${g.causes.map(c=>`<div class="cause generic"><span class="cn">${esc(c.name)}</span><span class="tp">${c.tempo.map(x=>x[0].toUpperCase()).join("")}</span><span class="lk">${c.likelihood}</span>${c.red?`<span class="rf">RED</span>`:""}</div>`).join("")}
        </div>`).join("")}
    </details>` : "";
```

- [ ] **Step 2: Insert `${sieve}` into the returned template**

In the same `whatBlock`, change the return template from:
```js
  return `<h3 style="margin-top:14px">What — causes${S.onset?` · <span style="color:var(--terra)">${esc(S.onset)}</span> onset`:""}${res.derived?` <span class="derived">(derived from site type — not yet individually curated)</span>`:""}</h3>
    ${red}
    ${groups || `<div class="empty">No causes for this onset — try a different tempo.</div>`}
    ${next}`;
```
to (adds `${sieve}` after the specific groups, before next steps):
```js
  return `<h3 style="margin-top:14px">What — causes${S.onset?` · <span style="color:var(--terra)">${esc(S.onset)}</span> onset`:""}${res.derived?` <span class="derived">(derived from site type — not yet individually curated)</span>`:""}</h3>
    ${red}
    ${groups || `<div class="empty">No causes for this onset — try a different tempo.</div>`}
    ${sieve}
    ${next}`;
```

- [ ] **Step 3: Add CSS to `app/index.html`**

In `app/index.html`, just before `</style>`, append:
```css
  .sieve>summary{cursor:pointer;font-size:12px;color:var(--muted);margin-top:4px;}
  .sieve .c{font-family:var(--mono);font-size:10px;color:var(--faint);}
  .cause.generic{opacity:.72;}
  .cause.generic .cn::after{content:" · generic";color:var(--faint);font-size:10px;}
```

- [ ] **Step 4: Run app-smoke + full suite**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/app-smoke.test.js 2>&1 | tail -1 && \
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test 2>&1 | grep -E "failed" | grep -v "0 failed" || echo "ALL SUITES GREEN"
```
Expected: app-smoke `0 failed`; then `ALL SUITES GREEN`.

- [ ] **Step 5: Verify in the browser**

Start the server if needed: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node app/serve.mjs`.
At `http://localhost:8137/app/`, drive via JS:
- Add `weak_arm@left` + `weak_leg@left`; select the **Pure motor lacune (internal capsule)** row.
- Confirm the "What — causes" shows **Vascular** as the specific headline, and a **"Complete the surgical sieve (+3)"** toggle expands to **Inflammatory (demyelination) · Neoplastic (tumour/metastasis) · Infective (abscess)**, each tagged *generic*.
- Set onset = **chronic**: the completion narrows (e.g. Neoplastic → tumour/metastasis) and vascular is not re-added generically.
- Confirm no console errors. Capture a screenshot of the expanded sieve.

- [ ] **Step 6: Commit**

```bash
git add app/app.js app/index.html
git commit -m "feat(app): 'complete the surgical sieve' toggle in the causes panel"
```

---

## Notes for the implementer

- `presentCats` must be built from the **unfiltered** `list`, not `filtered` — otherwise a tempo-hidden specific category (e.g. an acute-only vascular set under a chronic onset) would be wrongly re-added as a generic. The gap-fill invariant test guards this only for the no-onset case; keep the unfiltered `list`.
- The completion is intentionally low-confidence: generics are `uncommon`/`rare` and visually de-emphasised. Do not promote them into the specific `byCategory`.
- Keep the Atlas (`renderAtlasDetail`) as-is for now — the sieve toggle is a Localise-mode affordance (scope note in the spec).

# Output UX — Where/Why/What Cards + Disclosure — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-organise the Localise results pane into a compact result header + three labelled cards (Where / Why / What), with the neuraxis diagram, ruled-out, sieve, and per-site "why" collapsed by default. Same information, far less clutter.

**Architecture:** Presentation-only refactor of `app/app.js`: replace `diffBlock` with `resultHeader` + `whereCard`, add `whyCard`/`whatCard`/`card()`, drop the top-level `<h3>`s the card labels now replace, and re-assemble in `renderResults`. CSS in `app/index.html`. No engine/logic change.

**Tech Stack:** Zero-dependency ES modules, zero-build static app. Node v24 off PATH (Global Constraints).

## Global Constraints

- **Node is off PATH.** Prefix `node`/`npm` with `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"`.
- **Presentation only.** Do not change the engine, `solve`, `tractsFor`, `causesFor`, `neuraxisSVG`, or any computed content — only how it is grouped/labelled/disclosed. The differential rows, cause rows, synthesis text, and diagram markup are reused verbatim.
- **No behaviour regressions.** Differential-row click and diagram-node click must still re-select; functional flag must still surface; onset/sensory-level/length/near-fit/multifocal/ruled-out all still shown (some collapsed).
- **No node test for the results pane** (it uses `document`); the full suite must stay green (it doesn't import `app.js`). Verification is in-browser.
- **Branch off `main`:**
  ```bash
  cd "/Users/jaydenwearne/Desktop/Personal/Claude Code/Projects/NeuroLocaliser/Code/neurolocaliser-engine"
  git checkout -b output-cards
  ```

---

### Task 1: Header + three cards in the results pane

**Files:**
- Modify: `app/app.js` (replace `diffBlock`; add `card`/`resultHeader`/`whereCard`/`whyCard`/`whatCard`; edit `renderResults` assembly; drop leading `<h3>`s in `synthesisHTML` and `whatBlock`)
- Modify: `app/index.html` (card + header CSS)

**Interfaces:**
- New: `card(cap, body): string`; `resultHeader(sel, list, total, r): string`; `whereCard(list, cands, total, r): string`; `whyCard(tf, sel, total): string`; `whatCard(site): string`.
- Consumes existing: `siteName`, `siteLoc`, `functionalFlag`, `umnLmnPattern`, `synthesisHTML`, `neuraxisBlock`, `whyBlock`, `whatBlock`, `esc`, `desc`, `fid`.

- [ ] **Step 1: Add the `card` helper + `resultHeader` + `whereCard`**

In `app/app.js`, replace the entire `diffBlock` function (from `function diffBlock(list, cands, total, nAll, r) {` through its closing `}`) with:

```js
// cap is trusted HTML (literal labels we control, e.g. "Why" or `Where <span…>(N)</span>`) — not user input.
function card(capHTML, body) {
  return `<section class="out-card"><div class="out-cap">${capHTML}</div>${body}</section>`;
}

// compact header: the leading/selected lesion + status + functional flag (safety — kept prominent)
function resultHeader(sel, list, total, r) {
  const nAll = r.explainAll.length;
  const status = nAll
    ? `<b>${nAll}</b> lesion${nAll>1?"s":""} explain${nAll>1?"":"s"} all ${total} finding${total>1?"s":""}${nAll>1?" — click one to narrow":""}.`
    : `<b>No single lesion</b> explains all ${total} findings — best explains ${list[0].n}/${total}.`;
  const fnd = functionalFlag(S.tokens);
  const funcFlag = fnd.functional
    ? `<div class="multi" style="border-color:var(--gold);background:var(--gold-bg,transparent)"><b>⚠ Consider functional.</b> ${esc(fnd.note)}</div>`
    : fnd.suppressed
    ? `<div class="annot"><b>Functional sign noted:</b> ${esc(fnd.note)}</div>`
    : "";
  return `<div class="out-head">
    <div class="oh-lead"><b>${esc(siteName(sel.site))}</b><span class="oh-loc">${esc(siteLoc(sel.site))}${sel.site.territory?` · ${esc(sel.site.territory)}`:""}</span></div>
    <p class="oh-status">${status}</p>${funcFlag}</div>`;
}

// ① Where — the differential list + localisation annotations + (collapsed) ruled-out
function whereCard(list, cands, total, r) {
  const nAll = r.explainAll.length;
  const near = (!nAll && r.nearFit)
    ? `<div class="annot"><b>Near-fit:</b> ${esc(siteName(r.nearFit.site))} explains all but <code>${esc(r.nearFit.missing)}</code> — re-check that finding, or consider a second lesion.</div>` : "";
  const multi = (!nAll && r.multi)
    ? `<div class="multi"><b>⚠ Likely multifocal.</b> Minimal cover — ${r.multi.sites.length} sites: ${r.multi.sites.map(s=>esc(siteName(s.site))).join(" + ")}${r.multi.uncovered.length?`; still unexplained: ${r.multi.uncovered.map(esc).join(", ")}`:""}.</div>` : "";
  let annot = "";
  if (r.level && r.level.applies) annot += `<div class="annot"><b>Sensory level:</b> ${esc(r.level.note || (r.level.landmark||r.level.segment||""))}</div>`;
  if (r.length && r.length.applies) annot += `<div class="annot"><b>Length:</b> ${esc(r.length.note||"")}${r.length.glove?" · stocking-glove":""}</div>`;
  const rows = list.map(c => {
    const on = c.site.id === S.selected ? " on" : "";
    const w = Math.round((c.n/total)*54);
    const fit = c.n===total ? `<span class="dall">✓ all</span>` : `<span class="dfrac">${c.n}/${total}</span>`;
    return `<div class="drow${on}" data-k="${esc(c.site.id)}"><div class="dn"><b>${esc(siteName(c.site))}</b><span class="dloc">${esc(siteLoc(c.site))}${c.site.territory?` · ${esc(c.site.territory)}`:""}</span></div><div class="dfit">${fit}<div class="dbar" style="width:${w}px"></div></div></div>`;
  }).join("");
  const ruled = (r.ruledOut && r.ruledOut.length)
    ? `<details class="ruledout" style="margin-top:6px"><summary style="font-size:11.5px;color:var(--muted)">Ruled out by a normal finding <span class="c">${r.ruledOut.length}</span></summary>
        <div class="why-list" style="margin-top:4px">${r.ruledOut.map(x => {
          const side = x.contradictedBy.split("@")[1];
          return `<div class="why-item"><span class="k no">✗</span><span class="t">${esc(siteName(x.site))}</span><span class="d">would also cause ${esc(desc(fid(x.contradictedBy)))} on the ${esc(side)} — which is normal here</span></div>`;
        }).join("")}</div></details>`
    : "";
  const cap = `Where <span class="oc-n">(${list.length})</span>`;
  return card(cap, `<div class="difflist" id="difflist">${rows}</div>${near}${multi}${annot}${ruled}`);
}
```

- [ ] **Step 2: Add `whyCard` and `whatCard`**

In `app/app.js`, add these just above `function whatBlock(` (or anywhere among the render helpers):

```js
// ② Why — synthesis + UMN/LMN + (collapsed) diagram + (collapsed) per-site why
function whyCard(tf, sel, total) {
  const pat = umnLmnPattern(S.tokens);
  const umnlmn = pat.verdict
    ? `<div class="annot"><b>${pat.verdict === "mixed" ? "UMN + LMN (mixed)" : pat.verdict + " pattern"}:</b> ${esc(pat.note)}</div>`
    : "";
  if (!tf.length) {
    // non-tract findings: no tract synthesis/diagram — lead with the per-site explanation, expanded.
    return card("Why", `${umnlmn}${whyBlock(sel, total, false)}`);
  }
  const diagram = `<details class="nx-toggle" style="margin-top:6px"><summary>Show neuraxis diagram</summary>${neuraxisBlock(tf, sel.site.id)}</details>`;
  return card("Why", `${synthesisHTML(tf)}${umnlmn}${diagram}${whyBlock(sel, total, true)}`);
}

// ③ What — causes + sieve + next steps (whatBlock body, wrapped in the card shell)
function whatCard(site) {
  return card("What", whatBlock(site));
}
```

- [ ] **Step 3: Drop the leading `<h3>`s that the card labels replace**

In `synthesisHTML`, remove the `<h3 style="margin-top:14px">Why — synthesis</h3>` from its return so the card cap "WHY" is the only label. Change:
```js
  return `<h3 style="margin-top:14px">Why — synthesis</h3>${clauses}${converge}`;
```
to:
```js
  return `${clauses}${converge}`;
```

In `whatBlock`, change the leading heading so it reads as a caption under the WHAT card (keeps the onset/derived info, drops the redundant "What — causes" wording). Change:
```js
  return `<h3 style="margin-top:14px">What — causes${S.onset?` · <span style="color:var(--terra)">${esc(S.onset)}</span> onset`:""}${res.derived?` <span class="derived">(derived from site type — not yet individually curated)</span>`:""}</h3>
    ${red}
```
to:
```js
  return `${S.onset || res.derived ? `<p class="what-cap">${S.onset?`<span style="color:var(--terra)">${esc(S.onset)}</span> onset`:""}${res.derived?` <span class="derived">(derived from site type — not yet individually curated)</span>`:""}</p>` : ""}
    ${red}
```

- [ ] **Step 4: Re-assemble `renderResults`**

In `app/app.js` `renderResults`, replace the assembly block:
```js
  const tf = tractsFor(S.tokens, { dominantSide: S.dominant, sensoryLevel: S.sensoryLevel || undefined });
  el.innerHTML = diffBlock(list, cands, total, r.explainAll.length, r)
    + synthesisHTML(tf) + neuraxisBlock(tf, sel.site.id)
    + whyBlock(sel, total, tf.length > 0) + whatBlock(sel.site);
  const nx = el.querySelector(".neuraxis");
  if (nx) nx.onclick = e => { const g = e.target.closest("[data-k]"); if (!g) return; S.selected = g.dataset.k; renderResults(); };
```
with:
```js
  const tf = tractsFor(S.tokens, { dominantSide: S.dominant, sensoryLevel: S.sensoryLevel || undefined });
  el.innerHTML = resultHeader(sel, list, total, r)
    + whereCard(list, cands, total, r)
    + whyCard(tf, sel, total)
    + whatCard(sel.site);
  const nx = el.querySelector(".neuraxis");
  if (nx) nx.onclick = e => { const g = e.target.closest("[data-k]"); if (!g) return; S.selected = g.dataset.k; renderResults(); };
```

(The `difflist` click handler at the end of `renderResults` and the `.neuraxis` handler above are unchanged — `#difflist` still exists inside the Where card, and `.neuraxis` is found even inside the collapsed `<details>`.)

- [ ] **Step 5: Add CSS to `app/index.html`**

In `app/index.html`, just before `</style>`, append:

```css
  /* output cards (where/why/what) */
  .out-head{margin-top:6px;}
  .oh-lead b{font-size:15px;color:var(--terra);}
  .oh-lead .oh-loc{display:block;font-family:var(--mono);font-size:10.5px;color:var(--faint);margin-top:1px;}
  .oh-status{font-size:12px;color:var(--muted);margin:4px 0 0;}
  .out-card{border:1px solid var(--line);border-radius:10px;background:var(--paper);padding:10px 12px;margin-top:10px;}
  .out-card>.out-cap{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--faint);font-weight:700;margin-bottom:6px;}
  .out-cap .oc-n{color:var(--muted);letter-spacing:0;}
  .nx-toggle>summary{cursor:pointer;font-size:12px;color:var(--muted);}
  .what-cap{font-size:11.5px;color:var(--muted);margin:0 0 6px;}
```

- [ ] **Step 6: Run the full suite (must stay green — app.js not imported by tests)**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test 2>&1 | grep -E "failed" | grep -v "0 failed" || echo "ALL SUITES GREEN"
```
Expected: `ALL SUITES GREEN`.

- [ ] **Step 7: Verify in the browser**

Start the server if needed: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node app/serve.mjs`.
At `http://localhost:8137/app/`, tick `weak_arm@left` + `weak_leg@left` + `facial_weakness@left` + `forehead_spared@left` and check via JS + screenshot:
- Exactly **three `.out-card`s** labelled WHERE / WHY / WHAT, plus a header with the leading lesion + status.
- The **neuraxis diagram is collapsed** (a "Show neuraxis diagram" `<details>` closed by default); the sieve, ruled-out, and per-site "why" are also collapsed.
- **Total results-pane height is materially lower** than before (measure `#results` height; baseline was ~1759px — expect well under ~900px with the diagram collapsed).
- Clicking a **differential row** re-selects (header lesion + What update); expanding the diagram and clicking a **node** re-selects.
- A **functional-sign** case (e.g. tick `hoovers_sign`) still shows the functional flag in the header.
- A **non-tract** case (e.g. a Bell's-palsy-style `facial_weakness@left` alone) shows the Why card with the per-site explanation and **no diagram toggle** (fallback).
- No console errors. Capture a screenshot of the three-card layout.

- [ ] **Step 8: Commit**

```bash
git add app/app.js app/index.html
git commit -m "feat(app): where/why/what output cards + progressive disclosure"
```

---

## Notes for the implementer

- `diffBlock` is fully removed; its content is split between `resultHeader` (status + functional) and `whereCard` (list + annotations + ruled-out). `umnLmnPattern` moves to `whyCard`.
- Keep the exact differential-row markup (`.drow`/`data-k`/`.dfit`/`.dbar`) so the click handler and styling are unchanged.
- The diagram lives inside a `<details>` but is still in the DOM when collapsed, so `el.querySelector(".neuraxis")` finds it and the node-click handler attaches on every render (a no-op until the user expands it) — do not move the wiring.
- If `synthesisHTML` is referenced anywhere else, it is only in `whyCard` now; the removed `<h3>` is safe to drop.
- This is one visual change; iterate spacing/typography by eye in Step 7 (adjust the CSS, not the structure).

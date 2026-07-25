# Output UX — Where/Why/What cards + progressive disclosure

**Status:** design approved 2026-07-26; not yet implemented.

**Depends on:** nothing new; a presentation refactor of the Localise results pane. Branch off `main`.

## Problem

The results pane renders ~18 blocks in one flat scrolling column (~1759px for a 4-finding case),
including an always-expanded ~610px neuraxis diagram and two full tract paragraphs. Everything is the
same visual weight, with no grouping — even though the app's model is **where · why · what**. It
reads as cluttered and hard to scan.

## Goal

Re-organise the same information into three labelled cards (Where / Why / What) led by a compact
result header, with the four heaviest/secondary sub-blocks collapsed by default. No information is
removed; no engine/logic changes. Presentation-only refactor of `app/app.js` render functions + CSS.

## Design

### Target render structure (`renderResults` assembles):

```
resultHeader(...)          // compact: leading/selected lesion + status + functional ⚠ flag
whereCard(...)             // ① Where — the lesion
whyCard(...)               // ② Why — the reasoning
whatCard(...)              // ③ What — causes & next steps
```

Each card is `<section class="out-card"><div class="out-cap">WHERE</div> … </section>` with a small
uppercase pillar label. The three cards are always visible; only the noted sub-blocks collapse.

### resultHeader(sel, list, cands, total, r)
- Leading line: **selected lesion name** + its location (`side · level · part · territory`), emphasised.
- Status line (from the current `narrow` logic): "N lesions explain all M findings — click one to
  narrow" or "No single lesion explains all M — best explains K/M".
- **Functional flag** (`functionalFlag`): the alarming `⚠ Consider functional` banner (or the muted
  "functional sign noted" note) stays here — safety signal, never buried.

### ① whereCard(list, cands, total, r)
- The clickable differential list (the existing `.difflist` rows, unchanged).
- Compact inline annotations, in order when present: **near-fit**, **multifocal**, **sensory level**,
  **length** (the existing `near` / `multi` / `annot` fragments).
- Collapsed `<details>`: **"Ruled out by a normal finding (N)"** (the existing `ruled` fragment).

### ② whyCard(tf, sel, total)
- The tract **synthesis** (existing `synthesisHTML(tf)` body — visible).
- The **UMN/LMN pattern** line (existing `umnlmn` fragment) — moved here from the differential block.
- Collapsed `<details>`: **"Show neuraxis diagram"** wrapping the existing `neuraxisSVG` (the whole
  `neuraxis-wrap`). Collapsed by default; the node-click wiring still applies once expanded.
- Collapsed `<details>`: **"Why this specific site"** (the existing `whyBlock(sel, total, true)`).
- If `tf` is empty (non-tract findings): show the fallback per-site "why" **expanded** in place of the
  synthesis (so a tract-less case still leads with its explanation), and omit the diagram toggle.

### ③ whatCard(site)
- Unchanged content: red flag · causes by category · collapsed "Complete the surgical sieve" · next
  steps. Just wrapped in the `out-card` shell with the WHAT label.

### Node-click + list-click wiring
Unchanged behaviour. After `el.innerHTML = …`, re-attach: the `.difflist` click handler and the
`.neuraxis` click handler (the latter now inside a `<details>`; wiring by `el.querySelector(".neuraxis")`
still finds it when expanded — attach on render regardless, it is a no-op while collapsed).

### Empty / no-candidate states
- No findings: unchanged empty prompt.
- Candidates empty (nothing explains any finding): unchanged message + functional flag, rendered as a
  single card (no Why/What).

### CSS (`app/index.html`)
- `.out-card`: bordered, rounded, padded section with `margin-top`; `.out-cap`: small uppercase,
  letter-spaced, muted pillar label. Reuse existing tokens (`--line`, `--muted`, `--paper`).
- Remove the now-redundant "Click a lesion to see its reasoning & causes below" hint (the header +
  card labels make it obvious).

## Non-goals

- No change to the engine, causes, synthesis text, diagram builder, or the exam-tree input.
- No tabs (direction B) — cards with disclosure only.
- Atlas mode unchanged.
- Not restyling the differential rows / cause rows themselves beyond wrapping them in cards.

## Tests

This is presentation-only; the suites don't render `app.js`. Verification is in-browser
(the plan's browser step): three cards present and labelled; diagram/ruled-out/sieve/per-site-why
collapsed by default; leading lesion + status in the header; clicking a differential row and a diagram
node still re-selects; functional flag still surfaces; fold height materially reduced. No new node test
(app-smoke already guards the input tree; there is no DOM harness for the results pane).

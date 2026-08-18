# Wearne's NeuroLocaliser: identity, beta status, and colour discipline

**Date:** 2026-08-16
**Status:** design approved 2026-08-16; not yet implemented
**Scope:** `app/` + `package.json` only — no `src/` changes, no engine or clinical-content changes
**Follows:** `2026-08-16-app-ui-clarity-design.md` (same day; this builds on its type ramp and tokens)

## The ask

Rename the app to **Wearne's NeuroLocaliser**, reflect that it is a **Beta**, and redesign the UI, logo,
styles and colours around that.

## What the colour investigation found

Three palette directions were designed and reviewed (slate/teal, oxblood, surgical green), then four more
(achromatic, steel blue, petrol, indigo). The owner's verdict was that **the existing terracotta/navy was
better overall** — so the palette stays. That verdict is right, and it reframes the problem usefully.

**The problem was never the hue. It is scarcity and form.** Measured: **32 CSS declarations use
`var(--terra)`** — nav pills, subtitles, mono tokens, selected rows, fit bars, hover states, headings.
Terracotta is the app's most-used colour, which leaves it meaning nothing in particular.

That matters because in this app **colour is data**:

| Colour | Means |
|---|---|
| green | ipsilateral |
| red | contralateral, **and the red-flag must-not-miss** |
| purple | bilateral |
| gold | warning / demoted |
| terracotta | *(nothing — it is chrome)* |

Terracotta `#d36d52` is a near-neighbour of red-flag `#c0392b`. When a tired reader scans a cause list, a
`RED` badge in tinted text sits beside a terracotta cause name and the two do not separate. **The most
safety-critical signal in the product is competing with decoration.**

Three fixes were considered. Shifting the hue toward clay (further from red) reduces the collision but does
not remove it. Making chrome terracotta dusty and reserving full chroma for danger works, but drains the
warmth that is the reason to keep terracotta at all. **The chosen fix is scarcity plus form.**

## Design

### 1 — The rule that governs terracotta

> **Terracotta means exactly one of two things: this is the product's identity, or this is THE answer.**
> Anything that is merely active, hovered, selected-in-the-UI, or emphasised is **navy**.

Concretely it survives in three places — the mark, `LOCALISER` in the wordmark, and the left rule on the
focal result card — plus one data use: the currently selected lesion on the neuraxis diagram, which *is*
the answer. Every other one of the 32 declarations becomes navy, muted or band.

**This is enforced, not just intended.** `test/brand.test.js` parses `app/index.html`, finds every rule
using `var(--terra)`, and asserts each selector is on a named allowlist. Terracotta cannot creep back
without a test failing and someone having to justify the addition.

### 2 — The must-not-miss changes form, not hue

The `RED` badge and the `EMERGENCY` urgency pill become **filled chips** — solid `--red`, white text (dark
ink on dark theme), with a `⚑` glyph — instead of tinted text on a tinted background.

The reader is no longer asked to discriminate `#d36d52` from `#c0392b` at 10px. Fill, weight and glyph do
the work, so hue proximity stops mattering at all. Larger red-flag callout blocks keep their tinted
background — a full-bleed solid red panel would overwhelm rather than alert.

### 3 — Palette: same hues, warmer paper, deeper navy

Terracotta is **unchanged** (`#d36d52` / `#e79075`). The paper warms from cool white to parchment and the
navy deepens, so the page reads as a printed clinical text rather than a web app — which suits an authored
tool with a clinician's name on it.

| Token | Light: from → to | Dark: from → to |
|---|---|---|
| `--cream` (page) | `#fdfdfc` → `#faf7f2` | `#10192a` → `#0f1824` |
| `--paper` (cards) | `#ffffff` → `#fffdfb` | `#17233a` → `#16223a` |
| `--ink` / `--navy` | `#1d314d` → `#16283f` | `#e7edf6` → `#e9edf3` |
| `--muted` | `#5a6b82` → `#5d6c7e` | `#9aabc4` → `#96a3b5` |
| `--line` | `#e2e6ee` → `#e5ded3` | `#2a3b57` → `#26364d` |
| `--band` | `#f4f6fa` → `#f2ece2` | `#17233a` → `#1b2942` |
| `--terra` | **unchanged** | **unchanged** |
| `--red` | `#c0392b` → `#b32b1c` | `#e79075` → `#e0674f` |

`--red` deepens in light mode so white text on the filled chip clears contrast.

**In dark mode it fixes a defect found while writing this spec: `--terra`, `--contra` and `--red` are all
currently the identical value `#e79075`.** The brand accent, "contralateral", and "must-not-miss" are one
colour — three different meanings, no way to tell them apart. Dark-mode `--red` moves to `#e0674f` and
`--contra` stays at `#e79075`, so all three separate. This is the collision argument at its most literal,
and it is shipping today.

The ipsi/bilateral/gold semantic colours are untouched.

### 4 — The mark

A **pyramidal decussation**: two tracts descend, cross once, and continue on the opposite side, with a
filled node on one side and a hollow node on the other.

It is not decoration. Laterality is what this engine is built on — CLAUDE.md: *"Laterality is the crux —
most localisation bugs are crossing bugs"* — and the filled/hollow asymmetry is that idea. A plain X was
rejected because at small size it reads as **close/delete**, which collides with the red ✗ already used for
"contradicted by a normal finding"; the vertical runs above and below the crossing are what prevent that.

The mark ships as **two drawings from one geometry**: the full mark, and a favicon variant that drops the
mid-waypoint and thickens strokes so it survives 16px. Both live in `app/brand.js` as functions, so the
header, the gate and the favicon all draw from one source.

The app currently has **no favicon at all** — this adds one.

### 5 — The lockup

```
        Wearne's                     ← byline, uppercase, letterspaced, muted
◄╳►     NEUROLOCALISER   [BETA]      ← mark · wordmark · badge
```

"Wearne's" sits **above** the wordmark rather than inline: it reads as authorship, keeps `NEUROLOCALISER`
as the product name, and avoids a long single line on mobile. The `BETA` badge is **navy-outlined, not
terracotta** — it is a status, not the identity, and terracotta is reserved.

### 6 — Beta and versioning

`app/brand.js` exports a single `VERSION` constant. `package.json` bumps `0.1.0` → **`0.9.0`**, and
`test/brand.test.js` asserts the two agree — otherwise a shared case URL and a bug report could disagree
about which build a tester saw.

The version appears on the **gate card** (`v0.9.0 · Beta`), where a tester sees it before entering, and in
the **feedback email body**, so a report always carries its build.

> **The safety bar wording does not change.** It stays exactly:
> *"Teaching prototype. Not a medical device; not for clinical decisions. No patient identifiers. Findings
> stay in your browser."*
> "Beta" describes the build; it must not soften what the disclaimer says about the risk. Nor does the gate
> acknowledgment copy change.

### 7 — Where the name propagates

| Where | To |
|---|---|
| `app/index.html` `<title>` | `Wearne's NeuroLocaliser` |
| Header + gate wordmark | the lockup above |
| `app/feedback.js` subject | `Wearne's NeuroLocaliser feedback` |
| `app/feedback.js` body intro | `Thanks for testing Wearne's NeuroLocaliser…` + version line |
| `app/serve.mjs` console line | `Wearne's NeuroLocaliser app → …` |
| Favicon | new, from the mark |

## Out of scope

- Any `src/` change — the engine, anatomy tables and clinical content.
- The case-URL schema, so shared cases keep resolving.
- The safety-bar and gate-acknowledgment wording (see §6).
- The semantic colour meanings (ipsi/contra/bilateral/gold). Only `--red` moves, and only to separate it
  from `--terra` and to clear contrast on a filled chip.
- Layout and information architecture — the 2026-08-16 UI-clarity pass just settled those.

## Testing

`test/brand.test.js` (new):
- `VERSION` in `app/brand.js` equals `version` in `package.json`.
- Every CSS rule using `var(--terra)` has a selector on the allowlist — the discipline invariant.
- `--terra`, `--red` and `--contra` are three distinct values in **both** themes (all three are currently identical in dark).
- The mark and favicon functions return non-empty SVG with no hard-coded hex — colour comes from tokens.

Manual browser verification of both colour schemes and the ≤560px breakpoint, since the rest is visual.
All 64 existing suites must stay green; this work touches no code any of them cover.

## Risks

**The discipline pass touches 32 declarations across the stylesheet.** A missed one leaves terracotta
somewhere it no longer belongs — which is exactly what the allowlist test catches, so it should be written
first and allowed to fail.

**`--red` changing value affects every existing red usage**, including the contra badge and red-flag
callouts. Both themes need a visual pass, not just the two chips being restyled.

**Warm paper against the existing dark theme.** The light theme warms; the dark theme deepens. They must be
checked independently — a token that reads well on parchment can look muddy on near-black.

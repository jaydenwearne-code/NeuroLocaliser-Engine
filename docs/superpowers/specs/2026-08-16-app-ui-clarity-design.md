# App UI clarity: speak clinician, rank the page, put controls where they act

**Date:** 2026-08-16
**Status:** workstreams 2-6 implemented 2026-08-16 on `feat/app-ui-clarity`; **workstream 1 (clinical
naming) is BUILT BUT NOT WIRED** — it is held at a review gate until the owner signs off `PART_LABEL`
**Scope:** `app/` only — no `src/model/`, `src/engine/` or `src/data/` changes

## The problem

The owner, on the live app:

> "the UI is becoming quite messy with all the changes we have been working on. Do you have any suggestions
> on how to make it more appealing and approachable without sacrificing too much information?"

Seven increments have landed content into the same three surfaces (the control strip, the exam accordion,
the results column) without anyone re-ranking what the reader sees first. The result is not too much
information — the information is the product — it is **information without a hierarchy**.

### Measured baseline

Driving the live app with `#f=weak_arm@right,weak_leg@left&o=subacute&c=relapsing` (a two-site case, four
differential rows, one unifying diagnosis):

| Fact | Value |
|---|---|
| Results column height | **3051px** — about four screens at 720px |
| Result cards rendered, all expanded, no navigation | 5 (Where · Together · Why · What · Next) |
| Distinct `font-size` values in the stylesheet | **16**, from 8px to 22px — **10 of them between 8px and 13px** |
| Global controls above the fold, before any finding is entered | 5 |
| …of those, inert until a finding exists | **3** (onset, course, sensory level) |
| UI affordances answering "which site(s) am I reasoning about" | **3** (pins, scope toggle on What, scope toggle on Next) |
| Collapsed "this is less relevant" counters, each phrased and styled differently | **3** |
| Candidate sites with no eponym, rendering as `right cortex (motor_leg)` | 52 / 377 (**14%**) |
| …as a share of *common* sites | **18%** |
| Sites whose location subtitle is the raw `side · level · part` triple | **100%** |
| Exam rows displaying their raw finding id | **100%** |

The naming numbers are the ones worth reading twice. `nameForSite()`
([`src/data/syndromes.js:982`](../../../src/data/syndromes.js)) falls back to
`` `${side} ${level} (${part})` `` when a site has no eponym, so 18% of *common* sites — including the
cortical motor strip, which the engine returns constantly — headline as `right cortex (motor_leg)`. The
subtitle (`right · cortex · motor_leg`) and the exam-row ids (`weak_adduction`) are machine-facing on
**every** site and **every** row regardless. This is the loudest "internal tool" signal in the product and
it is entirely a display-layer accident.

## Who this is for

Settled with the owner: **the trainee learning to reason is primary; the time-poor ED clinician must still
be able to use it.** Two principles follow, and they resolve every layout question below.

**Nothing gets hidden behind tabs.** The reasoning chain Where → Together → Why → What → Next stays in one
readable scroll, in that order. Why keeps its full visual weight — it is the teaching payload, and a tabbed
UI would let a trainee skip the very thing the app exists to teach.

**Speed comes from orientation, not omission.** The ED reader gets a sticky section nav to jump straight to
Next Steps, and an urgency signal in the result header so the emergency/not-emergency question is answered
in one second. They lose no content; they stop having to scroll to find out what they have.

**Rejected on these grounds:** reordering the cards to put Next Steps first. It buys ED speed at the
trainee's direct expense, and the nav delivers the same speed without the trade.

## Design

Six workstreams. All six are `app/`-layer; the engine, the case-URL schema and the state model `S` are
untouched, so every change is reversible and none of it can alter a localisation result.

### 1 — Clinical language

A display-layer `plainSiteName(site)` in `app/`, used for the result headline, the differential rows and the
Atlas list. It composes **side + humanised part + territory**:

```
Right leg motor cortex
ACA territory — paracentral
```

replacing

```
right cortex (motor_leg)
right · cortex · motor_leg · ACA (paracentral — leg motor)
```

The raw `side · level · part` triple moves behind a small disclosure on the result header — it stays
reachable (it is what a bug report needs) but stops being the first thing read.

Where an eponym exists it still wins, unchanged: "Anterior cerebral artery (ACA) syndrome" is already the
right headline. `plainSiteName()` only replaces the 14% fallback and the 100% subtitle.

**Mechanism, in two layers, because 92 of the 192 part ids contain an underscore:**

1. `humanisePart(part)` — mechanical: split on `_`, expand a small abbreviation table (`pfc` → prefrontal
   cortex, `dlpfc` → dorsolateral prefrontal, `aca`/`mca`/`pca` → uppercase, `iam` → internal acoustic
   meatus, `scm` → sternocleidomastoid, …), title-case nothing else.
2. `PART_LABEL` — an override map for the parts that read badly mechanically (`motor_facearm` →
   "face/arm motor cortex", not "motor facearm").

**`PART_LABEL` is keyed `` `${level}|${part}` ``, never by part alone** (amended 2026-08-16 during planning,
after measuring). There are 202 distinct `level|part` keys but only 192 distinct parts: `lateral` spans
midbrain, pons, medulla, cord and hypothalamus; `hemi` spans four levels; `medial` three; `anterior` two. A
bare-part key would give lateral medulla and lateral midbrain one shared label. This is the same rule
`src/model/vascular.js` and `src/model/topography.js` already follow, for the same reason — and the mistake
they document having made.

**Invariant test** (`test/app-naming.test.js`): every part id reachable from `candidateSites()` produces a
label containing no underscore and no un-expanded abbreviation from the table. A new site cannot land with
a machine-looking name without failing a suite.

Finding names follow the same rule: chips render `desc(f)` ("Right arm weak") instead of the token
`weak_arm`, and exam rows drop the `.fid-mini` id span — the id stays in the existing `title=` tooltip.

**Ids are untouched in the case URL and the feedback payload.** The shareable case, the bug report and the
engine all keep speaking ids; only the screen speaks English.

> ⚠ **The `PART_LABEL` override map is clinical content and needs the owner's review before it ships** —
> it is ~100 anatomical labels, and a wrong one mislabels a lesion on the headline. Held to the same bar as
> the causes/workup content: authored, reviewed entity by entity, flagged where uncertain.

### 2 — Controls move to where they act

The five-control strip is deleted as a strip. Each control relocates to the card whose output it changes:

| Control | Moves to | Why |
|---|---|---|
| Dominant hemisphere | Header, as a setting | A per-user constant, not a per-case knob |
| Onset | Inside the What card | It filters/demotes causes and nothing else |
| Course | Inside the Together card | It exists only for the cross-site roster |
| Sensory level | Findings pane, revealed on a cord finding | Meaningless until there is a cord picture |
| Distal reach | Findings pane, revealed on a length-dependent finding | Same |

Two consequences worth stating. The app now **opens as findings → lesions** with nothing above the fold but
the wordmark and the two panes — which is the entire story of the product. And the labels can shed their
self-documenting parentheses: "Course (for cross-site diagnoses)" becomes "Course", because it now sits
under the heading that says what it is for.

`S` keeps all five fields and `encodeCase`/`decodeCase` are unchanged, so existing shared case URLs keep
working.

### 3 — Orientation

- **Sticky section nav** inside the results pane: Where · Together · Why · What · Next, current section
  marked, each a jump link. Sections that do not render for the current case (Together on a single-site
  picture) are omitted rather than shown disabled.
- **Urgency pill in the result header**, lifted from `nextStepsFor(site).urgency` — the value already
  exists and is currently visible only after four screens of scrolling.
- **One scope control**, beside the result headline, replacing the two duplicate "This site / All N sites"
  toggles on What and Next. One `S.scope`, one control, one place to answer "which lesion am I reasoning
  about" — the pins in Where continue to feed it.

### 4 — Type ramp and calmer surfaces

Sixteen font sizes collapse to a four-step ramp: **17px** (the answer), **13px** (body prose), **11px**
(meta/labels), **10px** (uppercase captions). The mono family is retained but only for genuine tokens —
ids, dermatome levels, the clock — never for prose.

Inner cards lose their border and shadow where a caption already separates them. Currently a cause sits
inside a category group, inside a card, inside a pane, inside a page: four nested boxes for one sentence.
The card keeps its border; the group inside it does not.

### 5 — One demotion treatment

"Ruled out by a normal finding · 31", "Less likely given tempo and course · 5" and "Less likely given
subacute onset · 4" are one concept — *the engine considered this and set it aside* — in three phrasings
and three styles. They become one component with one phrasing (`Set aside — <reason> · N`) and one visual
treatment, wherever they appear.

This is deliberately **not** a behaviour change: the two demotion mechanisms stay distinct in the engine
(a known-negative *excludes*; a tempo/course mismatch only *demotes*), and the reason text continues to say
which is which. Only the presentation is unified.

### 6 — What-card density

Per category: the top 1–2 causes stay expanded with their discriminating feature, **plus every red-flagged
must-not-miss regardless of rank**; the remainder collapses to a single "+N more" line carrying the names.
Nothing is deleted, and the must-not-miss list is never what gets collapsed.

**Measured after implementation, this claim was wrong and is corrected here.** After the 2026-08-11 depth
sweep the mean site carries 6.4 causes spread across the sieve categories, so ≤2 per category is already the
norm: only **73 of 377 sites (19%)** collapse anything, and the mean first read falls just **6.4 → 6.1**
entries. It was kept because it earns its place on the dense sites (length-dependent polyneuropathy 8 → 5)
and costs nothing elsewhere — but the real on-screen density was the **all-sites view and the demoted
bands**, not a single site's category lists.

**This workstream is severable** — it is the most judgement-heavy and the only one that changes what a
reader sees by default rather than how it is presented. If the first five land well, it can be decided
separately.

## Out of scope

- Any change to `src/` — the engine, the anatomy tables, the causes/workup content.
- The case-URL schema (`encodeCase`/`decodeCase`), so shared cases keep resolving.
- Code-stroke mode's worksheet layout. It is a separate surface with its own design, already reviewed, and
  its density is deliberate. It inherits the type ramp (§4) and nothing else.
- Reordering the reasoning cards (see "Who this is for").
- A light/dark theme switcher. Both themes already exist and are honoured; this work must not break either.

## Testing

The app layer has one existing suite (`test/app-smoke.test.js`, guards `EXAM_TREE`) plus
`test/combined-sites.test.js`. This work adds:

- `test/app-naming.test.js` — the §1 invariant: no part id reachable from `candidateSites()` yields a label
  with an underscore or an un-expanded abbreviation. Also asserts eponym sites still headline with their
  eponym, and that `plainSiteName()` never returns an empty or side-less string.
- An extension to `test/app-smoke.test.js` asserting the relocated controls (§2) still round-trip through
  `encodeCase`/`decodeCase` unchanged — the regression this refactor is most likely to cause.
- Manual browser verification of both colour schemes and the ≤560px mobile breakpoint, since §3 and §4 are
  visual and no suite can assert them.

All existing suites must stay green; this work touches no code any of them cover, so any failure is a real
regression.

## Risks

**The `PART_LABEL` map is clinical content.** Mitigated by the review gate above — it does not ship without
the owner's sign-off.

**The sticky nav plus the sticky safety bar plus the code-stroke sticky header could collide** on a short
viewport. The nav must be suppressed below the mobile breakpoint, where the single-column layout already
makes the sections adjacent.

**Relocating controls into cards means a control can be unmounted while its state is set** — e.g. onset is
`subacute` but the What card is not rendered because no finding is entered. `S` must remain the single
source of truth and the case URL must keep serialising the value even when its control is not on screen.

# Worked examples: four cases that each teach a different card

**Date:** 2026-08-16
**Status:** design approved 2026-08-16; not yet implemented
**Scope:** `app/` only — no `src/` changes
**Closes:** the stale empty-state copy introduced when presets were removed

## The problem

The findings pane's empty state reads:

> *"No findings yet — tick from the exam steps, or try a worked example above."*

**There is no worked example above.** Presets were removed in the 2026-07-25 UI restructure and the copy was
never updated, so the app promises something it does not have. Flagged in the 2026-08-16 UI review and not
picked up by either plan since.

It also costs the app its first impression. A new tester lands on 15 collapsed categories and 233 findings
with no way in, and the features that took the most work — the narrowing differential, the Together card —
are invisible until someone happens to enter the right combination.

## Design

Four examples, chosen so that **each demonstrates a different output card** rather than being the four
commonest presentations:

| Example | Teaches | Verified behaviour |
|---|---|---|
| **Wallenberg** | **Where** — an eponym emerges from anatomy | 6/6, resolves to Lateral medullary syndrome, 2 candidates |
| **Foot drop** | **the narrowing** — the interaction model, by doing | 3 candidates: common peroneal, L5 radiculopathy, sacral plexopathy |
| **Cauda equina** | **Next steps** — emergency, red flags, tiered workup | 4/4, single candidate, urgency `emergency` |
| **Right arm + left leg** | **Together** — the cross-site roster | 4 candidates, minimal cover = 2 sites |

**Foot drop is the important one.** It deliberately loads only the findings L5 and peroneal *share*, so
three candidates appear and none wins. The copy invites the reader to add one more sign, and the app does
what it is for: **+ weak hip abduction → 2 candidates; + deep peroneal sensory → 1.** That is the whole
model demonstrated in two clicks, rather than described.

### Placement and behaviour

A row of buttons in the findings pane, rendered **only when no findings are entered** — it is an on-ramp,
not furniture, and disappears the moment the user starts. It replaces the stale copy in the same place.

Clicking an example sets `S.tokens` (plus `onset`/`course` where the example needs them) and re-renders.
It round-trips through the case URL exactly like any hand-entered case, so **an example is shareable and a
tester can send one back in a bug report**.

### Where the content lives

`app/examples.js` exports `EXAMPLES` — pure data, no DOM:

```js
{ id, label, teaches, tokens: [...], onset?, course? }
```

Same pattern as `exam-map.js` and `combined-sites.js`: content in its own module so it can be unit-tested
and clinically reviewed without reading UI code.

## The test is the point

`test/examples.test.js` asserts, for **every** example, that the engine still produces the outcome it
claims:

- every token is a real finding id (`FINDINGS`), correctly formed as `finding@side`
- **Wallenberg** resolves to the lateral medulla and explains every finding entered
- **Foot drop** returns at least 3 candidates and includes **both** an L5 root and a peroneal nerve site —
  if it ever collapses to one, it has stopped teaching narrowing
- **Cauda equina** has urgency `emergency`
- **Right arm + left leg** yields a minimal cover of ≥2 sites, so the Together card actually renders

**This is not ceremony.** The first token sets I wrote by hand were wrong: Wallenberg landed on
Marie-Foix explaining 2 of 5 findings, and the cauda case landed on conus medullaris. A worked example that
silently teaches the wrong thing is worse than no worked example, and the anatomy tables are actively
edited. The final tokens are derived from each site's own `expectedFindings` and then trimmed to a
realistic bedside subset.

**Wallenberg's full syndrome is 13 findings**, which nobody records at the bedside. It ships as the
clinically representative six — vertigo, ipsilateral facial sensory loss, contralateral body spinothalamic
loss, ptosis + miosis, limb ataxia — which still resolves 6/6.

## Out of scope

- Any `src/` change.
- The case-URL schema — examples reuse it unchanged.
- The safety-bar and gate copy.
- Adding examples to Atlas or Code-stroke mode; this is the Localise on-ramp only.

## Risks

**Content drift.** The anatomy and causes tables change often. Mitigated by the test above, which fails the
moment an example stops demonstrating its point — which is precisely why the assertions check *behaviour*
(candidate counts, urgency, cover size) and not just that the tokens parse.

**Clinical wording.** The labels and the one-line "teaches" text are user-facing clinical copy and should be
read by the owner before shipping, like any other content in this app.

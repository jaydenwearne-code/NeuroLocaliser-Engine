# The Card Follows Its Cause — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status: NOT STARTED.** Spec: `docs/superpowers/specs/2026-11-11-card-follows-cause-design.md`. Round 1 was RULED
2026-11-11, "approve as proposed" (`582311b`).

**AMENDED 2026-11-12** (the duplicate-keys round, row D8, ruled "approve as proposed"; spec
`docs/superpowers/specs/2026-11-12-duplicate-keys-design.md`). This plan now builds on `3d195f0`, where the operculum and the
temporoparietal cortex name each hemisphere. So:
- C11 and C25 move dominant-only;
- the two non-dominant flags join the reviewed snapshot (130 → 132);
- the guard's sweep reads both sides wherever the phonebook names each hemisphere;
- the dry run reads every site id.

Every number below was re-measured on the amended prototype.

**Goal:** Every sentence on the answer card has one owner, the place or the cause. So the red flag always belongs to the cause
the card names, on every axis that moves that cause (onset, papilloedema, the reader's selection, and any future one).

**Architecture:**
- **Data.** A warning about one cause moves word for word from the place's phonebook entry (`syndromes.js` `red`) onto that
  cause's entry at that place (`causes.js`, via a new `flagged` builder), optionally restricted (`only`) to one place reading a
  shared cause list or to one hemisphere. Seven titles that name a pathology are renamed.
- **The rule.** One rule in `app/answer.js` picks the red line: the card's cause (the selection, else the What line's most
  likely cause; none when the pressure leads or on a two-place card), its applicable flags, then the place's own flag. Both the
  answer card and the What card read it.
- **The gate.** A new suite holds the guards: a structural sweep, a reviewed snapshot of the place flags, a floor for
  dangerous phrasings, titles, and real restrictions.

**Tech Stack:** a zero-dependency Node ES-module project. Each test is a standalone script (`ok(label, cond)`, PASS/FAIL lines,
exit code). Node lives off PATH, so prefix every command with `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"`.

## Global Constraints

- **Where:** branch `fix/card-follows-cause`, worktree `Code/neurolocaliser-card-cause/`. Nothing is pushed, no PR is opened, and
  no other branch is touched. It merges into `integrate/all-open-fixes` only on the owner's word.
- **The audit is never loosened.** `npm run test:audit` must stay at probes 127/127, counted checks 1097 passed, 0 failed.
- **Moved flags are word for word.** Every moved sentence is READ from the source by the move script (Appendix B), never
  retyped.
- **Only three wording changes.** They are exactly:
  - the C33 split (the diffuse cerebrum): cause half *"Coma with no focal signs and intact brainstem reflexes is metabolic /
    diffuse until proven otherwise."*; place half *"Coma with no focal signs: check glucose, sodium and a blood gas
    immediately."*;
  - P22: *"Acute Klüver-Bucy features with fever / confusion — treat empirically for HSV encephalitis; image, then do an
    LP."*;
  - the 7 titles of spec Appendix B.
- **Re-pins.** Only the six named in Task 3, each a direct consequence of the ruling. Any other failure is a bug in the change,
  not a pin to move.
- **Commits** end with: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- `<scratchpad>` in a command means the executing session's own scratch directory, outside the repo. Tooling is saved and run
  there, never committed.

## Measured on a prototype before this plan was written

A scratch copy of `582311b` had this exact change set applied. **Re-measured 2026-11-12:** a scratch copy of `b173e7e` with the
amended change set (Appendices A–C as they now stand), task by task:
- **Task by task:** the guard went 7/30 → 14/23 (the other 92 suites green, 7,756) → 37/37.
- **Tests:** at the end, `npm test` gave 93 suites, 7793 passed, 0 failed. The audit stayed at 127/127, 1097/0.
- **The guard** takes about 86s (as before): its sweep adds both sides only where the phonebook names each hemisphere.
- **Cards:** of 5,317 (every site id, both sides), Where, Why, What, Next and the badge changed on **0**.
- **Red-line changes, 680 in all**, each of an expected kind:
  - a moved flag no longer beside another cause: 549;
  - the place flag where the pressure leads: 77;
  - P22: 16;
  - the split: 16;
  - the uncal card now also shows the compressive III's own place flag: 20;
  - selecting "Uncal herniation" shows its own flag: 2.
- **Titles:** 208 card titles changed, across the 7 renamed places.
- **The non-dominant cards** of the operculum and the temporoparietal cortex keep their own flag only. C11 and C25 stay off them,
  though the infarct leads.
- **For reference**, the original one-side-per-place figures were 3,180 cards, red 472, titles 112, and the uncal 10 and 1.

The build must equal this (Task 4).

The uncal card is the one effect the spec's simulation did not count, because it modelled no reading cards. The reading's flag
used to *replace* the compressive III's place flag. Under the rule, the red line shows the herniation flag, then the place
flag: *"A fixed dilated pupil with a third-nerve palsy is a SURGICAL EMERGENCY — image the vessels (CTA/MRA) for an aneurysm
now."* That flag is ruled place-level (P-rows). Report it to the owner with the build.

## File structure

| File | Change | Task |
|---|---|---|
| `test/card-follows-cause.test.js` | **Create** — the guards (Appendix A) | 1 |
| `package.json` | the new suite joins the `test` chain | 1 |
| `src/data/syndromes.js` | `phonebookVariant()`; `nameForSite` reads it (2). The content move: 36 flags out, the split, P22, 7 titles (3) | 2, 3 |
| `src/data/causes.js` | the `flagged` builder (2); 38 flags onto 35 cause entries (3) | 2, 3 |
| `app/answer.js` | `cardCause`, `flagApplies`, `redLine` (2); `answerFor` reads them, row 10's blank goes (3) | 2, 3 |
| `app/app.js` | the What card reads the same rule | 3 |
| `src/model/sites.js` | the uncal reading's `red` moves onto its cause | 3 |
| `src/engine/inverse.js` | `variantOf` no longer carries `red` | 3 |
| `test/content-gaps.test.js`, `test/raised-pressure.test.js`, `test/pressure-follows.test.js` | six re-pins | 3 |
| `CLAUDE.md`, the spec | the round recorded | 4 |

The move script (Appendix B) and the dry-run scripts (Appendix C) are tooling: run from outside the repo, never committed.
Copies live in `side-session-notes/local_3d719466…/card-cause-prototype/`.

---

### Task 1: The guards, failing

**Files:**
- Create: `test/card-follows-cause.test.js` (the full file is Appendix A)
- Modify: `package.json` (the `test` script)

**Interfaces:**
- Consumes: nothing. It reads the helpers of Task 2 through module namespaces (`SYN.phonebookVariant`, `CZ.flagged`,
  `ANS.cardCause`, `ANS.flagApplies`, `ANS.redLine`), so a missing export fails its assertions, not the whole suite.
- Produces: the suite every later task must turn green.

- [ ] **Step 1: Create the suite.** Write `test/card-follows-cause.test.js` with exactly the content of Appendix A (including the
  132-row `PLACE_FLAGS` snapshot).

- [ ] **Step 2: Add it to the chain.** In `package.json`, in the `test` script, replace

```
node test/hemisphere-names.test.js"
```

with

```
node test/hemisphere-names.test.js && node test/card-follows-cause.test.js"
```

- [ ] **Step 3: Run it and watch it fail for the right reasons.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/card-follows-cause.test.js`

Expected: exit 1, last line `7 passed, 30 failed`. The 7 that pass are the pins that hold before and after the change:
- both "sweep: no card…" checks (vacuous on the base: the non-vacuity check fails instead);
- "floor: every allowlist entry still names…";
- "top of the basilar: its own card keeps the basilar-tip flag";
- "Broca's area: its own card keeps the MCA flag, word for word";
- "a hemisphere's flag…";
- "a shared list…".

Every other check fails: the helpers are missing, there are no cause flags, the snapshot reads 168 flags not 132, cause claims
sit on places, the titles name a lacune, and the pinned cards show stale flags.

- [ ] **Step 4: Commit.**

```bash
git add test/card-follows-cause.test.js package.json
git commit -m "test(card): the card follows its cause — the guards (red)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: The helpers (no behaviour change)

**Files:**
- Modify: `src/data/syndromes.js` (`nameForSite`, and a new `phonebookVariant` above it)
- Modify: `src/data/causes.js` (a new `flagged` builder after `c`)
- Modify: `app/answer.js` (an import; a new section at the end)

**Interfaces:**
- Consumes: `BY_SITE` and `nameForSite` (`syndromes.js`); `leadingCause` (already imported by `answer.js`).
- Produces (Task 3 relies on these exact names):
  - `phonebookVariant(site, { dominantSide }) → "dominant" | "nondominant" | "bilateral" | null`;
  - `flagged(cause, ...flags) → { ...cause, flags: [{ text, only? }] }`;
  - `cardCause({ res, selected, twoLesions, pressureLeads }) → cause | null`;
  - `flagApplies(flag, site, dominantSide) → boolean`;
  - `redLine(site, cause, dominantSide) → string | null`.

- [ ] **Step 1: `phonebookVariant`, read by `nameForSite`.** In `src/data/syndromes.js`, replace

```js
export function nameForSite(site, opts = {}) {
  // Prefer an exact site-id entry (e.g. the bilateral cortex sites, whose level+part collides with a
  // unilateral subregion); otherwise key by level_part as usual.
  const key = BY_SITE[site.id] ? site.id : `${site.level}_${site.part}`;
  const entry = BY_SITE[key];
  const anatomical = `${site.side} ${site.level}, ${site.part}`;
  if (entry) {
    const variant = (entry.dominant || entry.nondominant || entry.bilateral)
      ? (site.side === "bilateral"
          ? (entry.bilateral || entry.dominant)
          : (site.side === (opts.dominantSide || "left") ? entry.dominant : entry.nondominant))
      : entry;
    return { ...variant, anatomical };
  }
```

with

```js
// Which of a phonebook entry's variants a site reads: "dominant" | "nondominant" | "bilateral", or null when the entry has
// none. A bilateral site with no bilateral variant reads the dominant one. One rule, read by nameForSite and by a cause flag
// restricted to a hemisphere (causes.js `flagged`, `only`) — the card follows its cause, 2026-11-11.
export function phonebookVariant(site, opts = {}) {
  const entry = BY_SITE[BY_SITE[site.id] ? site.id : `${site.level}_${site.part}`];
  if (!entry || !(entry.dominant || entry.nondominant || entry.bilateral)) return null;
  if (site.side === "bilateral") return entry.bilateral ? "bilateral" : "dominant";
  return site.side === (opts.dominantSide || "left") ? "dominant" : "nondominant";
}

export function nameForSite(site, opts = {}) {
  // Prefer an exact site-id entry (e.g. the bilateral cortex sites, whose level+part collides with a
  // unilateral subregion); otherwise key by level_part as usual.
  const key = BY_SITE[site.id] ? site.id : `${site.level}_${site.part}`;
  const entry = BY_SITE[key];
  const anatomical = `${site.side} ${site.level}, ${site.part}`;
  if (entry) {
    const v = phonebookVariant(site, opts);
    const variant = v ? entry[v] : entry;
    return { ...variant, anatomical };
  }
```

- [ ] **Step 2: The `flagged` builder.** In `src/data/causes.js`, directly after these two lines

```js
const c = (name, cat, tempo, likelihood, red = false, feature = "", pathognomonic = "") =>
  ({ name, cat, tempo, likelihood, red, feature, pathognomonic });
```

insert

```js
// A WARNING ABOUT ONE CAUSE lives on that cause, at that place (the card follows its cause, owner-ruled 2026-11-11). The card
// shows a cause's flags only when it names that cause: the reader's selection, else the What line's most likely cause (which
// the plan follows). A warning true WHATEVER the cause stays the place's own (syndromes.js `red`) — so when you author a red
// flag, ask "is it true whatever the cause?": if not, it goes here. `only` restricts a flag to one place reading this list
// (its site kind, e.g. "bilateral_occipital") or to one hemisphere ("dominant" / "nondominant", as the phonebook resolves it).
export const flagged = (cause, ...flags) => ({ ...cause, flags: flags.map(f => typeof f === "string" ? { text: f } : f) });
```

- [ ] **Step 3: The rule's three functions.** In `app/answer.js`, replace the import

```js
import { nameForSite } from "../src/data/syndromes.js";
```

with

```js
import { nameForSite, phonebookVariant } from "../src/data/syndromes.js";
```

and append at the end of the file:

```js
// ---- the red line: the card follows its cause (owner-ruled 2026-11-11; spec 2026-11-11-card-follows-cause-design.md) ----
// The cause the card names: the reader's selection, else the What line's most likely cause (which the plan follows). None on a
// two-place card (the Together card's disease speaks there) or when the pressure itself leads. One rule for the answer card and
// the What card, so a future axis that moves the What line's cause moves the flag with it.
export function cardCause({ res, selected = null, twoLesions = false, pressureLeads = false }) {
  if (twoLesions || pressureLeads) return null;
  if (selected) return [...res.all, ...(res.demoted || [])].find(c => c.name === selected) || null;
  return leadingCause(res.all) || null;
}
// A cause's flag shows at this place unless it is restricted to another place reading the same list, or to the other
// hemisphere (as the phonebook resolves it).
export function flagApplies(flag, site, dominantSide) {
  if (!flag.only) return true;
  if (flag.only === "dominant" || flag.only === "nondominant") return phonebookVariant(site, { dominantSide }) === flag.only;
  return site.id.replace(/^(left|right)_/, "") === flag.only;
}
// The red line: the cause's flags at this place, then the place's own flag (true whatever the cause). Null when neither.
export function redLine(site, cause, dominantSide) {
  const own = ((cause && cause.flags) || []).filter(f => flagApplies(f, site, dominantSide)).map(f => f.text);
  const all = [...own, nameForSite(site, { dominantSide }).red].filter(Boolean);
  return all.length ? all.join(" ") : null;
}
```

- [ ] **Step 4: The helper checks pass, nothing else moves.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/card-follows-cause.test.js`

Expected: exit 1, `14 passed, 23 failed`. All seven "helper:" checks now PASS.

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`

Expected: exit 1, failing only in the last suite (card-follows-cause, 23 FAIL lines). Every one of the 92 suites before it passes:
7,756 PASS lines from them.

- [ ] **Step 5: Commit.**

```bash
git add src/data/syndromes.js src/data/causes.js app/answer.js
git commit -m "feat(card): the rule's helpers — phonebookVariant, flagged, cardCause, flagApplies, redLine (no behaviour change)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: The content move and the rule (they ship together)

The move alone would blank every moved flag, because the cards still read only the place. The rule alone would change no card,
because no cause has a flag yet. Like the composite round's rows 1–2, they land as one commit.

**Files:**
- Modify (by the move script, Appendix B): `src/data/causes.js`, `src/data/syndromes.js`, `src/model/sites.js`
- Modify: `app/answer.js` (`answerFor`), `app/app.js` (`whatBlock` and its import), `src/engine/inverse.js` (`variantOf`)
- Modify (re-pins): `test/content-gaps.test.js`, `test/raised-pressure.test.js`, `test/pressure-follows.test.js`

**Interfaces:**
- Consumes: `flagged`, `cardCause`, `redLine`, `phonebookVariant` (Task 2).
- Produces: 38 flags on 35 cause entries (13 restricted), 132 place flags, 7 renamed titles. `answerFor().lines.red` and the
  What card's "Red flag" both come from `redLine`.

- [ ] **Step 1: Move the content.** Save Appendix B as `move-flags.mjs` OUTSIDE the repo (the session's scratchpad), then
  run it from the worktree root:

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node <scratchpad>/move-flags.mjs .`

Expected (exactly): `moved 38 flags onto 35 cause entries; removed 31 phonebook lines; split 1; reworded P22; renamed 7 titles; uncal flag moved`

The script refuses to run twice. Each anchor must match exactly once, so a second run stops with
`Error: bilateral_pons_mlf: 0 matches …`. It edits the LAST definition of a duplicated phonebook key: three keys are defined
twice, and the later definition is the live one (see "Found, not fixed" below).

- [ ] **Step 2: The answer card reads the rule.** In `app/answer.js` `answerFor`, replace

```js
    next: nx.referral || "",
    red: entityRed || st.sel.site.red || nameForSite(st.sel.site, { dominantSide: dom }).red || null, // a reading's own flag first
  };
  // The card follows the pressure itself (row 10): the pressure-only card's What line, and the banner as the red line — the
  // site's red flag was written for causes now set aside. resolveNext has already given the Next line and the badge.
  if (nx.pressureLeads) { lines.what = PRESSURE_ONLY.what; lines.red = null; }
  return { lines, nx, combined, twoLesions };
}
```

with

```js
    next: nx.referral || "",
    // The card's cause's own flags here, then the place's (the card follows its cause): a two-place card's selected disease
    // speaks for itself.
    red: entityRed || redLine(st.sel.site, cardCause({ res, selected: twoLesions ? null : st.selectedPathology,
      twoLesions, pressureLeads: !!nx.pressureLeads }), dom),
  };
  // The card follows the pressure itself (row 10): the pressure-only card's What line. No cause is named, so the red line is the
  // place's own flag, true whatever the cause (row 10's blank reversed, 2026-11-11). resolveNext gave the Next line and badge.
  if (nx.pressureLeads) lines.what = PRESSURE_ONLY.what;
  return { lines, nx, combined, twoLesions };
}
```

- [ ] **Step 3: The What card reads the same rule.** In `app/app.js`, replace the import line

```js
  followNote, demotionReason, pressureLeads, strokeWindowHolds } from "./answer.js";
```

with

```js
  followNote, demotionReason, pressureLeads, strokeWindowHolds, cardCause, redLine } from "./answer.js";
```

and in `whatBlock` replace

```js
  // Nothing here can raise the pressure (pressure follows the cause, row 10): the card follows the pressure itself, and the
  // banner is the red line, as on the answer card.
  const leads = pressed && pressureLeads(site, S.onset);
  const ph = nameForSite(site, { dominantSide: domView() });
  const redText = leads ? null : (site.red || ph.red); // a reading's own red flag (the uncal reading, raised-pressure round, row 11)
```

with

```js
  // Nothing here can raise the pressure (pressure follows the cause, row 10): the card follows the pressure itself.
  const leads = pressed && pressureLeads(site, S.onset);
  // The red flag follows the cause this card names, as on the answer card (the card follows its cause, 2026-11-11).
  const redText = redLine(site, cardCause({ res, selected: S.selectedPathology, pressureLeads: leads }), domView());
```

- [ ] **Step 4: A reading no longer carries a flag.** In `src/engine/inverse.js`, replace

```js
// station on the Why line (that reading sits in the pons) — composite-sites round, row 2 — and its own lead cause and red
// flag (the uncal reading — raised-pressure round, rows 6 and 11).
const variantOf = (site, v) => ({ ...site, ...(v.side ? { side: v.side } : {}), ...(v.station ? { station: v.station } : {}),
  variant: v.key, structures: v.structures, atLevel: v.atLevel, segments: v.segments, variants: undefined,
  leads: v.leads, red: v.red });
```

with

```js
// station on the Why line (that reading sits in the pons) — composite-sites round, row 2 — and its own lead cause (the uncal
// reading — raised-pressure round, row 6; its red flag now lives on that cause, the card follows its cause, 2026-11-11).
const variantOf = (site, v) => ({ ...site, ...(v.side ? { side: v.side } : {}), ...(v.station ? { station: v.station } : {}),
  variant: v.key, structures: v.structures, atLevel: v.atLevel, segments: v.segments, variants: undefined,
  leads: v.leads });
```

- [ ] **Step 5: The six re-pins.** Each test read a flag through its old owner, or pinned row 10's blank.

**5a. `test/content-gaps.test.js`.** Replace

```js
import { answerFor } from "../app/answer.js";
```

with

```js
import { answerFor, redLine } from "../app/answer.js";
import { causesFor, leadingCause } from "../src/data/causes.js";
// The dominant MCA's red flag (row 15), on the M1 occlusion since the card follows its cause (2026-11-11).
const MCA_DOMINANT_FLAG = "Malignant MCA infarction risks fatal oedema — monitor conscious level; consider decompressive hemicraniectomy early.";
```

replace

```js
  ok("row 15: the red flag follows the assumed dominance", lines.red === nameForSite(r.display[0].site, { dominantSide: "left" }).red); }
```

with

```js
  // The flag now lives on the M1 occlusion, restricted to the dominant hemisphere (the card follows its cause, 2026-11-11).
  ok("row 15: the red flag follows the assumed dominance", lines.red === MCA_DOMINANT_FLAG, lines.red); }
```

replace

```js
     r.dominance === null && lines.red === nameForSite(r.display[0].site, { dominantSide: "right" }).red, lines.red); }
```

with

```js
     r.dominance === null && lines.red === MCA_DOMINANT_FLAG, lines.red); }
```

and replace

```js
ok("row 17: the carotid space's red flag names the XII palsy", /alone or with a XII palsy/.test(nameForSite(SITE["left_skull_base_carotid_space"]).red));
ok("row 17: the dominant PCA's red flag is the pure-alexia flag", /pure alexia/.test(nameForSite(SITE["left_cortex_pca"], { dominantSide: "left" }).red));
```

with

```js
// Both flags now live on the place's usual cause (the card follows its cause, 2026-11-11): read them as the card shows them.
const usualRed = (id, dominantSide = "left") => redLine(SITE[id], leadingCause(causesFor(SITE[id]).all), dominantSide) || "";
ok("row 17: the carotid space's red flag names the XII palsy", /alone or with a XII palsy/.test(usualRed("left_skull_base_carotid_space")));
ok("row 17: the dominant PCA's red flag is the pure-alexia flag", /pure alexia/.test(usualRed("left_cortex_pca")));
```

**5b. `test/raised-pressure.test.js`.** After the line `const RED = "A new dilated pupil … while you wait.";` add

```js
const CN3_FLAG = "A fixed dilated pupil with a third-nerve palsy is a SURGICAL EMERGENCY — image the vessels (CTA/MRA) for an aneurysm now.";
```

and replace

```js
  ok("rows 7, 11: the reading's red flag", ans?.lines.red === RED, ans?.lines.red); }
```

with

```js
  // Since the card follows its cause (2026-11-11) the reading's flag lives on its cause, "Uncal herniation", and the red line
  // shows the card's cause's flag and then the place's own, which no longer gives way to the reading's.
  ok("rows 7, 11: the reading's red flag, then the compressive III's own", ans?.lines.red === `${RED} ${CN3_FLAG}`, ans?.lines.red); }
```

**5c. `test/pressure-follows.test.js`.** Replace

```js
  ok("row 10: coma + papilloedema follows the pressure itself — the pressure-only lines, emergency, and the banner as the red line",
     a?.lines.what === ANS.PRESSURE_ONLY.what && a?.lines.next === ANS.PRESSURE_ONLY.next && a?.nx.urgency === "emergency"
     && a?.lines.red === null && a?.nx.pressureLeads === true, `${a?.lines.what} [${a?.nx.urgency}] red=${a?.lines.red}`); }
```

with

```js
  // Row 10's blank red line reversed by the card follows its cause (2026-11-11): the place's own flag, true whatever the cause.
  ok("row 10: coma + papilloedema follows the pressure itself — the pressure-only lines, emergency, and the place's own flag as the red line",
     a?.lines.what === ANS.PRESSURE_ONLY.what && a?.lines.next === ANS.PRESSURE_ONLY.next && a?.nx.urgency === "emergency"
     && a?.lines.red === "Coma with no focal signs: check glucose, sodium and a blood gas immediately." && a?.nx.pressureLeads === true,
     `${a?.lines.what} [${a?.nx.urgency}] red=${a?.lines.red}`); }
```

- [ ] **Step 6: The guards pass.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/card-follows-cause.test.js`

Expected: exit 0, `37 passed, 0 failed`.

- [ ] **Step 7: Everything passes.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`

Expected: exit 0; 93 suites; 7,793 PASS lines and 0 FAIL lines.

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm run test:audit`

Expected: exit 0; `all probes 127/127`; `clinical audit: 1097 passed, 0 failed (counted); 0 pending the owner's ruling`.

If anything else fails, it is a bug in Steps 1–5, not a pin to move (Global Constraints).

- [ ] **Step 8: Commit.**

```bash
git add src/data/causes.js src/data/syndromes.js src/model/sites.js src/engine/inverse.js app/answer.js app/app.js \
  test/content-gaps.test.js test/raised-pressure.test.js test/pressure-follows.test.js
git commit -m "feat(card): the card follows its cause — 38 flags onto their causes, one rule for the red line

Round 1 (RULED 2026-11-11, approve as proposed):
- 36 flags move word for word to their place's usual cause (13 restricted to a place or a
  hemisphere), the diffuse cerebrum splits, P22 is reworded, 7 titles are renamed, and the
  uncal reading's flag moves onto its cause;
- the red line is the card's cause's flags, then the place's own;
- row 10's blank is reversed: the place flag shows when the pressure leads.

Re-pins (each a direct consequence): content-gaps rows 15 and 17 read the flag through its
new owner; raised-pressure rows 7 and 11 show the reading's flag, then the III's own;
pressure-follows row 10 shows the place's half.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Measure, browser-check, document

**Files:**
- Modify: `CLAUDE.md`, `docs/superpowers/specs/2026-11-11-card-follows-cause-design.md`, this plan (status line)

**Interfaces:**
- Consumes: the built branch (Task 3).
- Produces: the measurement, the browser check, and the docs.

- [ ] **Step 1: The dry run equals the prototype's.** Save Appendix C's two scripts outside the repo. Export the base and run
  both trees:

```bash
mkdir -p <scratchpad>/base && git archive b173e7e | tar -x -C <scratchpad>/base
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node <scratchpad>/dry-run-cards.mjs <scratchpad>/base > <scratchpad>/before.jsonl
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node <scratchpad>/dry-run-cards.mjs . > <scratchpad>/after.jsonl
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node <scratchpad>/dry-run-compare.mjs <scratchpad>/before.jsonl <scratchpad>/after.jsonl
```

`b173e7e` is the code this round builds on; the commits after it, before Task 1, change only docs. The dry run reads every
site id, both sides (amended 2026-11-12), so the counts are not the original plan's one-side-per-place 3,180 / 472 / 112.

Expected (exactly):

```
cards: 5317 (before 5317)
fields that differ: {"red":680,"title":208}
red-line changes by kind: {
 "a moved flag no longer beside another cause": 549,
 "gained: the place flag where the pressure leads": 77,
 "selecting Uncal herniation shows its own flag": 2,
 "uncal card: + the compressive III place flag": 20,
 "P22 reworded": 16,
 "the split (C33)": 16
}
unexplained: 0
```

`unexplained: 0` also proves the hemisphere restrictions. If C11 or C25 showed on a non-dominant card, that card's red line would
change from its own flag to the moved flag plus its own flag, which is none of the kinds above.

- [ ] **Step 2: Browser check.**
  - The launch entry `"NeuroLocaliser card-cause worktree"` (port 8146) already exists in `Code/.claude/launch.json` (added
    2026-11-12 for the duplicate-keys round).
  - Start it with `preview_start`, open `/app/`, and reload after every hash change (a hash-only navigation does not re-run
    boot).
  - Check each of these, reading `.ans-row` and the opened What card:
    - top of the basilar (`reduced_consciousness@none vertical_gaze_palsy@none homonymous_hemianopia@left
      homonymous_hemianopia@right`): the basilar-tip flag. With `papilloedema@none` added: deep cerebral venous thrombosis, and
      no basilar-tip flag.
    - Broca's area: its MCA flag, word for word. With "Tumour (glioma / metastasis)" selected in the What card: no red line,
      and the What card's "Red flag" agrees.
    - the uncal reading (`reduced_consciousness@none fixed_dilated_pupil@left weak_arm@right weak_leg@right`): herniation's
      flag, then the III's own.
    - the lateral medulla's picture + papilloedema at subacute onset: "Swallowing can fail early — keep nil by mouth until
      assessed."
    - a renamed title: "Pure motor hemiparesis (internal capsule)".
    - the non-dominant operculum (`motor_dysprosody@none`; amended 2026-11-12): its own flag only, "New flat, unmodulated
      speech is easily mistaken for depression — it is a focal sign that needs imaging." The infarct leads, but its flag
      (C25) is dominant-only.
    - the non-dominant temporoparietal cortex (`sensory_dysprosody@none`): "Subtle; the deficit is in emotional communication
      rather than words." only, and not C11's jargon-aphasia flag.
  - Expect no console errors.

- [ ] **Step 3: Document.**
  - In `CLAUDE.md`, change the status line's count to **93 test suites / 7793 assertions green**. Then add a section
    `## The card follows its cause (DONE 2026-11-11, round 1) — ✅ owner-approved rulings (every row)` after "Duplicate keys
    and the non-dominant names", recording:
    - **the defect:** the place's flag stayed beside a different cause on 100% of moved cards: onset 103, selection 868,
      papilloedema 281;
    - **the root cause:** cause claims were written on the place;
    - **the mechanics:** `flagged` / `only`, `phonebookVariant`, `cardCause` / `redLine`, the What card, row 10 reversed;
    - **the authoring rule:** "is it true whatever the cause?";
    - **the guards:** the snapshot is the gate; no wording test can tell a place fact from a cause claim (19/37, 92/129);
    - **the measurements** of Task 3 Steps 6–7 and Task 4 Step 1, the uncal card's added place flag, and the browser check.
  - In the Architecture "Layers" block, add to `syndromes.js`: "a place's `red` is true whatever the cause; `phonebookVariant`".
    Add to `causes.js`: "`flagged(cause, …flags)`: a warning about one cause, at that place, `only` for a shared list or a
    hemisphere".
  - In the spec, change the status line to
    `**Status: IMPLEMENTED (2026-11-11) on fix/card-follows-cause** — RULED 2026-11-11 "approve as proposed".`
  - In this plan, change the status line to `**Status: IMPLEMENTED (2026-11-11).**`

- [ ] **Step 4: Commit.**

```bash
git add CLAUDE.md docs/superpowers/specs/2026-11-11-card-follows-cause-design.md docs/superpowers/plans/2026-11-11-card-follows-cause.md
git commit -m "docs: the card follows its cause — implemented, measured, browser-checked

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Found, not fixed (report to the owner)

- **The duplicated phonebook keys are FIXED** (2026-11-12, `56aff33`, before this round). The scan found a fourth: the
  internal capsule's workup. The duplicate-keys round also named both hemispheres at the operculum and the temporoparietal
  cortex (`3d195f0`), which is why C11 and C25 are now dominant-only.
- **Still open** (`docs/superpowers/specs/2026-11-12-duplicate-keys-design.md` §6):
  - the cause features and workups at those two places are keyed by place, so the non-dominant card's What and Next cards
    still describe the aphasia;
  - the thalamic and striatocapsular aphasia composites' non-dominant copies need a ruling, either to name them or to stop
    offering them.

## Appendix A — `test/card-follows-cause.test.js`

```js
// card-follows-cause.test.js — the card follows its cause (owner-ruled 2026-11-11; spec
// docs/superpowers/specs/2026-11-11-card-follows-cause-design.md). Every sentence on the card has ONE owner: the PLACE (a red
// flag true whatever the cause — syndromes.js `red`) or the CAUSE (a warning about one cause — causes.js `flagged`). The red
// line shows the card's cause's flags at this place, then the place's own flag. Run: node test/card-follows-cause.test.js
import { solve, candidateSites, isNormalToken } from "../src/engine/inverse.js";
import { expectedFindings } from "../src/engine/forward.js";
import { CAUSES, causesFor, leadingCause } from "../src/data/causes.js";
import * as CZ from "../src/data/causes.js";
import { BY_SITE, nameForSite } from "../src/data/syndromes.js";
import * as SYN from "../src/data/syndromes.js";
import * as ANS from "../app/answer.js";

let pass = 0, fail = 0;
const ok = (label, cond, detail = "") => { cond ? pass++ : fail++; console.log((cond ? "PASS  " : "FAIL  ") + label + (cond ? "" : `  ${detail}`)); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const T = s => new Set(s.split(/\s+/).filter(Boolean));
const SITE = Object.fromEntries(candidateSites().map(s => [s.id, s]));
const P = "papilloedema@none";
const ONSETS = ["", "hyperacute", "acute", "subacute", "chronic"];
// Read from the module namespaces, so a missing export fails its assertions instead of the whole suite.
const redLine = ANS.redLine || (() => undefined);
const cardCause = ANS.cardCause || (() => undefined);
const flagApplies = ANS.flagApplies || (() => undefined);
const phonebookVariant = SYN.phonebookVariant || (() => undefined);
const flagged = CZ.flagged || (() => undefined);
// The answer card for a picture, as app.js builds it; `pick` selects a place, else the card's own first answer.
const card = (toks, { onset = "", selectedPathology, pick } = {}) => {
  const tokens = typeof toks === "string" ? T(toks) : toks, r = solve(tokens);
  const sel = pick ? r.display.find(x => x.site.id === pick) : (r.display.find(x => x.site.id === r.defaultSite) || r.display[0]);
  if (!sel) return null;
  const total = [...tokens].filter(t => !t.startsWith("papilloedema@") && !isNormalToken(t)).length;
  return ANS.answerFor({ r, sel, total, tokens, onset, course: "", dominant: "left", sensoryLevel: "", pinned: new Set(),
    scope: "site", selectedPathology, selectedEntity: undefined });
};
const own = id => [...expectedFindings(SITE[id])].join(" ");
const listOf = s => CAUSES[s.id] ? s.id : `${s.level}_${s.part}`;
const kindOf = s => s.id.replace(/^(left|right)_/, "");
const placeFlags = () => { const rows = [];
  for (const [k, v] of Object.entries(BY_SITE)) { if (v.red) rows.push([k, v.red]);
    for (const sub of ["dominant", "nondominant", "bilateral"]) if (v[sub] && v[sub].red) rows.push([`${k}.${sub}`, v[sub].red]); }
  return rows.sort((a, b) => (a[0] < b[0] ? -1 : 1)); };
const causeFlags = () => { const rows = [];
  for (const [list, causes] of Object.entries(CAUSES)) for (const c of causes) for (const f of c.flags || []) rows.push({ list, cause: c.name, ...f });
  return rows; };

// ---- A. The helpers ----
{ const bad = [];
  for (const s of candidateSites()) for (const d of ["left", "right"]) {
    const e = BY_SITE[BY_SITE[s.id] ? s.id : `${s.level}_${s.part}`]; if (!e) continue;
    const v = phonebookVariant(s, { dominantSide: d }), read = v ? e[v] : e, n = nameForSite(s, { dominantSide: d });
    if (!read || n.name !== read.name || n.red !== read.red) bad.push(`${s.id}/${d}`); }
  ok("helper: phonebookVariant names the variant nameForSite reads, at every place and dominance", bad.length === 0, bad.slice(0, 5).join(", ")); }
ok("helper: phonebookVariant — the dominant and non-dominant PCA, and a place with no variants",
   phonebookVariant(SITE.left_cortex_pca, { dominantSide: "left" }) === "dominant"
   && phonebookVariant(SITE.right_cortex_pca, { dominantSide: "left" }) === "nondominant"
   && phonebookVariant(SITE.left_cortex_pca, { dominantSide: "right" }) === "nondominant"
   && phonebookVariant(SITE.left_medulla_lateral, { dominantSide: "left" }) === null);
{ const x = flagged({ name: "X", cat: "vascular", red: true }, "always", { text: "dominant only", only: "dominant" });
  ok("helper: flagged keeps the cause and carries its flags, a string as { text }",
     !!x && x.name === "X" && x.red === true && same(x.flags, [{ text: "always" }, { text: "dominant only", only: "dominant" }])); }
ok("helper: flagApplies — unrestricted; a hemisphere; a place reading the list",
   flagApplies({ text: "t" }, SITE.left_cortex_pca, "left") === true
   && flagApplies({ text: "t", only: "dominant" }, SITE.left_cortex_pca, "left") === true
   && flagApplies({ text: "t", only: "dominant" }, SITE.right_cortex_pca, "left") === false
   && flagApplies({ text: "t", only: "bilateral_occipital" }, SITE.bilateral_occipital, "left") === true
   && flagApplies({ text: "t", only: "bilateral_occipital" }, SITE.left_cortex_occipital, "left") === false);
{ const cause = { name: "X", flags: [{ text: "Always." }, { text: "Dominant." , only: "dominant" }, { text: "Non-dominant.", only: "nondominant" }] };
  ok("helper: redLine — the cause's flags for this place and hemisphere, then the place's own flag",
     redLine(SITE.right_cortex_pca, cause, "left") === "Always. Non-dominant. An isolated hemianopia is easily missed — confrontation-test fields; consider a posterior-circulation cause.",
     redLine(SITE.right_cortex_pca, cause, "left"));
  ok("helper: redLine — no cause: the place's own flag; neither: null",
     redLine(SITE.left_medulla_lateral, null, "left") === "Swallowing can fail early — keep nil by mouth until assessed."
     && redLine(SITE.left_medulla_lateral, { name: "Y" }, "left") === "Swallowing can fail early — keep nil by mouth until assessed."); }
{ const res = causesFor(SITE.left_cortex_operculum), chronic = causesFor(SITE.left_cortex_operculum, { onset: "chronic" });
  ok("helper: cardCause — the What line's most likely cause, a selection (even from the set-aside band), none when the pressure leads or two places",
     cardCause({ res }) === leadingCause(res.all)
     && (cardCause({ res, selected: "Tumour (glioma / metastasis)" }) || {}).name === "Tumour (glioma / metastasis)"
     && (cardCause({ res: chronic, selected: "MCA (superior division) infarct" }) || {}).name === "MCA (superior division) infarct"
     && cardCause({ res, pressureLeads: true }) === null && cardCause({ res, twoLesions: true }) === null); }

// ---- B. A card never shows another cause's flag (the structural sweep) ----
// Over every place's own picture and every reading's, at every onset, with and without papilloedema, and every selectable cause.
// The card's cause is read from the What line itself (not from cardCause), so the sweep checks the card, not the helper.
{ const bad = [], missing = []; let cards = 0, shown = 0; const seen = new Set();
  const causeOfWhat = (what, names) => names.filter(n => what.startsWith(`Most likely ${n}`) || what === `Selected: ${n}.`)
    .sort((a, b) => b.length - a.length)[0] || null;
  for (const s of candidateSites()) {
    // One side per place: the other side reads the same flags. Except where the phonebook names each hemisphere — there a
    // hemisphere restriction only shows on the non-dominant side, so both sides are swept (amended 2026-11-12).
    const kind = kindOf(s); if (seen.has(kind) && !phonebookVariant(s, { dominantSide: "left" })) continue; seen.add(kind);
    const all = [...causesFor(s).all, ...(causesFor(s).demoted || [])], names = all.map(c => c.name);
    const applicable = all.flatMap(c => (c.flags || []).filter(f => flagApplies(f, s, "left")).map(f => ({ text: f.text, cause: c.name })));
    const pictures = [[...expectedFindings(s)], ...(s.variants || []).map(v => [...expectedFindings({ ...s, structures: v.structures, variants: undefined })])];
    const check = a => { if (!a) return; cards++;
      const cause = causeOfWhat(a.lines.what, names), red = a.lines.red || "";
      for (const f of applicable) {
        if (red.includes(f.text)) { shown++; if (!applicable.some(g => g.text === f.text && g.cause === cause)) bad.push(`${s.id}: "${f.text.slice(0, 40)}" beside ${cause}`); }
        else if (f.cause === cause) missing.push(`${s.id}: ${cause}'s flag missing`); } };
    for (const exp of pictures) { if (!exp.length) continue;
      for (const onset of ONSETS) { check(card(new Set(exp), { onset, pick: s.id })); check(card(new Set([...exp, P]), { onset, pick: s.id })); } }
    for (const c of all) { const exp = pictures[0]; if (exp.length) check(card(new Set(exp), { selectedPathology: c.name, pick: s.id })); }
  }
  ok("sweep: no card shows a cause's flag beside another cause", bad.length === 0, `${bad.length}: ${bad.slice(0, 3).join(" | ")}`);
  ok("sweep: every card whose cause has a flag at this place shows it", missing.length === 0, `${missing.length}: ${missing.slice(0, 3).join(" | ")}`);
  ok("sweep: it is not vacuous — over 3,000 cards, cause flags shown on over 100", cards > 3000 && shown > 100, `${cards} cards, ${shown} cause flags shown`); }

// ---- C. The place flags are a reviewed snapshot ----
// A NEW OR REWORDED PLACE FLAG FAILS HERE until someone has asked "is it true whatever the cause?" — if not, it belongs on a cause
// (causes.js `flagged`). No wording test can tell a place fact from a cause claim (spec §3.4), so this is the real gate.
const PLACE_FLAGS = [
  ["aphasia_subcortical_striatocapsular", "Aphasia with a dense contralateral hemiparesis and no cortical signs points to a deep dominant (striatocapsular) lesion."],
  ["aphasia_subcortical_thalamic", "Aphasia with contralateral sensory loss and no cortical signs points to the dominant thalamus."],
  ["basal_ganglia_globus_pallidus", "Young-onset dystonia needs Wilson's disease excluded (copper studies, slit-lamp) — it is treatable."],
  ["basal_ganglia_striatum.bilateral", "New chorea warrants a treatable-cause screen (glucose, thyroid, autoimmune, pregnancy/drug history) before attributing it to Huntington's."],
  ["basal_ganglia_striatum.dominant", "Check glucose — non-ketotic hyperglycaemia is a treatable cause of acute hemichorea/hemiballismus."],
  ["basal_ganglia_striatum.nondominant", "Check glucose — non-ketotic hyperglycaemia is a treatable cause of acute hemichorea/hemiballismus."],
  ["basal_ganglia_substantia_nigra.bilateral", "A symmetric, tremor-poor, rapidly progressive or early-falls parkinsonism suggests a Parkinson-plus syndrome — not idiopathic PD."],
  ["basal_ganglia_substantia_nigra.dominant", "Acute or rapidly progressive hemiparkinsonism is structural until proven otherwise — image the midbrain."],
  ["basal_ganglia_substantia_nigra.nondominant", "Acute or rapidly progressive hemiparkinsonism is structural until proven otherwise — image the midbrain."],
  ["basal_ganglia_subthalamic", "Check glucose — non-ketotic hyperglycaemia is a treatable, striatal cause of acute hemiballismus/hemichorea."],
  ["bilateral_anterior_temporal", "Acute Klüver-Bucy features with fever / confusion — treat empirically for HSV encephalitis; image, then do an LP."],
  ["bilateral_auditory", "Deafness with a normal audiogram and intact brainstem responses points to bilateral cortical lesions — image both temporal lobes."],
  ["bilateral_paracentral", "Bilateral leg weakness with urinary incontinence and a normal spine MRI is a parasagittal lesion until proven otherwise — image the brain."],
  ["cauda_equina", "A surgical emergency — new saddle anaesthesia, bladder dysfunction or bilateral sciatica needs urgent MRI and decompression."],
  ["cerebellum_flocculonodular", "New central (gaze-evoked, direction-changing) nystagmus with imbalance warrants posterior-fossa imaging."],
  ["cerebellum_hemisphere", "A space-occupying posterior-fossa lesion can cause brainstem compression and obstructive hydrocephalus — a neurosurgical emergency; image urgently."],
  ["cerebellum_pancerebellar", "A subacute pancerebellar syndrome can be paraneoplastic — screen for an occult malignancy (anti-Yo/Hu/Tr) alongside imaging."],
  ["cerebellum_vermis", "Truncal ataxia with headache and vomiting in a child suggests a midline posterior-fossa tumour — image and refer."],
  ["cerebrum_diffuse", "Coma with no focal signs: check glucose, sodium and a blood gas immediately."],
  ["combined_degeneration_scd", "Check B12 (and methylmalonic acid) early — SCD is treatable but irreversible if missed."],
  ["conus_medullaris", "Early symmetric sphincter involvement with UMN signs — urgent MRI of the conus; distinguish from cauda equina as it changes the level imaged."],
  ["cord_anterior", "A new bilateral cord picture is compression until whole-spine MRI says otherwise; only then does preserved vibration with a dissociated sensory loss point to ASA territory and an aortic or vascular cause."],
  ["cord_central", "Sacral sparing + a suspended dissociated loss points intramedullary — MRI the cord; exclude a tumour or Chiari malformation."],
  ["cord_hemi", "A structural cord lesion until proven otherwise — urgent MRI; a compressive cause is a surgical emergency."],
  ["cord_lateral", "A Horner with suspended sensory loss or long-tract signs → image the cervical cord."],
  ["cord_posterior", "Check B12/copper before it becomes irreversible — a treatable cause of a progressive myelopathy."],
  ["cord_transverse", "A new bilateral myelopathy with a sensory level is a neurological emergency — MRI the whole cord to exclude compression before anything else."],
  ["corpus_callosum_anterior", "A one-handed (left) apraxia with alien-hand behaviour is a callosal / medial-frontal lesion — image the interhemispheric region."],
  ["cortex_angular", "Isolated anomia localises poorly — correlate with the rest of the exam and imaging."],
  ["cortex_arcuate", "Repetition out of proportion to fluency and comprehension points to the arcuate fasciculus."],
  ["cortex_dlpfc", "A dysexecutive syndrome warrants frontal imaging and cognitive assessment."],
  ["cortex_fusiform.nondominant", "Acquired prosopagnosia points to the right (or bilateral) fusiform — image the medial occipitotemporal region."],
  ["cortex_mca_inferior.nondominant", "Dense neglect with anosognosia underestimates the deficit — the patient denies it; corroborate and image."],
  ["cortex_medial_pfc", "Profound apathy / akinetic mutism after SAH or ACA stroke — image the medial frontal lobes."],
  ["cortex_operculum.nondominant", "New flat, unmodulated speech is easily mistaken for depression — it is a focal sign that needs imaging."],
  ["cortex_occipital", "Confrontation-test the fields — an isolated hemianopia is easily overlooked; posterior circulation imaging is warranted."],
  ["cortex_orbitofrontal", "New disinhibition / personality change is a frontal sign — image the orbitofrontal region (and consider subfrontal masses)."],
  ["cortex_paracentral", "Bilateral leg weakness with urinary incontinence is a parasagittal lesion until proven otherwise — image the interhemispheric fissure."],
  ["cortex_parietal.dominant", "A focal cortical syndrome without weakness still needs imaging — tumour and stroke present identically here."],
  ["cortex_parietal.nondominant", "Neglect with anosognosia leads patients to deny deficits — corroborate history and examine formally."],
  ["cortex_pca.nondominant", "An isolated hemianopia is easily missed — confrontation-test fields; consider a posterior-circulation cause."],
  ["cortex_premotor", "Apraxia with normal power is a cortical (premotor / parietal) sign — image the frontoparietal cortex."],
  ["cortex_sma", "A medial frontal / parasagittal lesion — image the interhemispheric frontal region and the ACA territory."],
  ["cortex_temporoparietal.nondominant", "Subtle; the deficit is in emotional communication rather than words."],
  ["cortex_temporal", "New olfactory/gustatory hallucinations or episodic fear may be focal seizures — consider EEG and imaging."],
  ["craniocervical_junction_foramen_magnum", "New downbeat nystagmus warrants craniocervical-junction imaging — a Chiari or foramen-magnum lesion is surgically treatable."],
  ["dorsal_midbrain_tectum", "A supranuclear vertical gaze palsy warrants dorsal-midbrain imaging — look for a tectal lesion or early hydrocephalus."],
  ["guillain_mollaret_dentate", "Palatal tremor with cerebellar signs points to the dentate / superior cerebellar peduncle — image the cerebellum and its peduncles."],
  ["guillain_mollaret_rubral", "Palatal tremor plus rubral (Holmes) tremor localises to the midbrain — image the dorsal midbrain."],
  ["guillain_mollaret_triangle", "New palatal tremor warrants MRI looking for hypertrophic olivary degeneration and the causative brainstem/cerebellar lesion."],
  ["hypothalamus_mammillary", "Give parenteral thiamine BEFORE glucose in any at-risk patient with confusion / amnesia — Wernicke is a treatable emergency."],
  ["hypothalamus_suprachiasmatic", "Persistent circadian disruption with other hypothalamic features warrants imaging."],
  ["hypothalamus_supraoptic", "Polyuria with rising sodium after pituitary surgery or head injury is central DI — measure paired serum/urine osmolality."],
  ["hypothalamus_thermoregulatory", "Unexplained persistent hyper/hypothermia with other hypothalamic signs — image the hypothalamus."],
  ["hypothalamus_tuberal", "Combined endocrine dysfunction with visual-field loss points to a suprasellar mass — image and check the pituitary axis."],
  ["hypothalamus_ventromedial", "New-onset hyperphagic obesity with visual or endocrine signs — image the suprasellar / hypothalamic region."],
  ["locked_in", "Do not mistake locked-in for coma or a vegetative state — the patient is fully aware; establish a vertical-eye-movement / blink communication channel."],
  ["medulla_lateral", "Swallowing can fail early — keep nil by mouth until assessed."],
  ["medulla_medial", "Bilateral involvement threatens respiration — monitor and image urgently."],
  ["midbrain_lateral", "Posterior circulation imaging is warranted for any crossed midbrain picture."],
  ["midbrain_medial", "Crossed midbrain signs can be haemorrhage, not just infarct — image before assuming stroke."],
  ["midbrain_trochlear", "A CONTRALATERAL (crossed) superior oblique palsy localises into the dorsal midbrain, not the nerve — image the brainstem."],
  ["motor_unit_anterior_horn", "New progressive painless weakness with fasciculations and no sensory loss needs urgent neurology — if upper motor neurone signs are also present, think ALS."],
  ["motor_unit_muscle", "Proximal weakness with a rash or dysphagia may be dermatomyositis — check CK and screen for an underlying malignancy."],
  ["motor_unit_nmj_postsynaptic", "A myasthenic crisis with bulbar/respiratory failure is an emergency — watch the forced vital capacity, not just the oxygen saturation."],
  ["nerve_axillary", "Check axillary function after every shoulder dislocation/reduction — it is easily missed."],
  ["nerve_femoral", "Femoral palsy with anticoagulation is a retroperitoneal haematoma until proven otherwise — image urgently."],
  ["nerve_long_thoracic", "Painful winging after a viral illness is often neuralgic amyotrophy — usually recovers, but confirm the pattern."],
  ["nerve_median_ain", "An inability to make the 'OK' sign with no sensory loss is the anterior interosseous nerve."],
  ["nerve_median_carpal_tunnel", "Nocturnal hand paraesthesiae with thenar wasting and palmar sparing is carpal tunnel — treat before permanent wasting."],
  ["nerve_median_proximal", "Median weakness that includes pronation and forearm flexors (not just thenar) localises proximal to the carpal tunnel."],
  ["nerve_musculocutaneous", "Isolated musculocutaneous palsy is rare — look for a wider plexus lesion."],
  ["nerve_obturator", "Medial-thigh pain with adductor weakness — consider an obturator hernia or pelvic mass."],
  ["nerve_peroneal_common", "Foot drop with SPARED inversion and hip abduction is peroneal, not L5 — the spared movements are the whole discriminator."],
  ["nerve_peroneal_deep", "Foot drop with spared eversion localises below the peroneal bifurcation to the deep branch."],
  ["nerve_peroneal_superficial", "Weak eversion with preserved dorsiflexion is the superficial peroneal branch."],
  ["nerve_radial_axilla", "Triceps weakness + lost triceps jerk marks a lesion above the spiral groove — separate from a C7 root by the intact dermatome/other C7 muscles."],
  ["nerve_radial_pin", "Finger drop with a preserved wrist extension and no sensory loss is the PIN, not a spiral-groove radial palsy."],
  ["nerve_radial_spiral_groove", "Wrist drop with a preserved triceps jerk localises to the spiral groove, not the axilla."],
  ["nerve_sciatic", "A dense sciatic palsy after hip surgery needs early recognition — the peroneal division is the most vulnerable and may look like an isolated foot drop."],
  ["nerve_superior_gluteal", "A Trendelenburg gait localises to gluteus medius (superior gluteal) or an L5 root — the sensory exam separates them."],
  ["nerve_suprascapular", "Deep shoulder pain with external-rotation weakness — image the notch for a ganglion."],
  ["nerve_tibial", "Sole numbness with weak toe flexion localises to the tibial nerve — tarsal-tunnel entrapment is treatable."],
  ["nerve_ulnar_elbow", "Dorsal-hand sensory loss and FDP/FCU weakness localise the ulnar lesion to the elbow, not the wrist."],
  ["nerve_ulnar_wrist", "A worse claw with spared FDP and dorsal-hand sensation localises the ulnar lesion to the wrist — the paradox that the distal lesion looks worse."],
  ["parinaud_dorsal_midbrain", "Vertical gaze palsy + light-near dissociation, especially in a young patient — image the pineal region and ventricles; obstructive hydrocephalus is a neurosurgical emergency."],
  ["peripheral_vestibular_labyrinth", "An acute vestibular syndrome with CENTRAL features (direction-changing/gaze-evoked or vertical nystagmus, NORMAL head-impulse, skew) is a posterior-circulation stroke until proven otherwise — image, do not reassure."],
  ["plexus_lower_trunk", "A lower-trunk plexopathy with a Horner's is a Pancoast tumour until proven otherwise — image the lung apex."],
  ["plexus_lumbar_plexus", "Painful proximal leg weakness with weight loss needs imaging of the retroperitoneum and a diabetes screen."],
  ["plexus_lumbosacral_plexus", "A painful whole-leg plexopathy with weight loss is diabetic amyotrophy or malignant infiltration until imaging and a diabetes screen say otherwise — and on anticoagulation, image urgently for a haematoma."],
  ["plexus_sacral_plexus", "A progressive painful sacral plexopathy suggests pelvic malignancy — image the pelvis."],
  ["plexus_upper_trunk", "Acute painful upper-limb weakness with patchy wasting may be neuralgic amyotrophy — but exclude traction injury and malignant infiltration."],
  ["polyneuropathy_length_dependent", "A rapidly ascending or NON-length-dependent pattern (hands before feet, asymmetric, or areflexia out of proportion) points away from a stocking-glove axonopathy — think Guillain-Barré, vasculitis or a demyelinating neuropathy, and act urgently."],
  ["polyradiculoneuropathy_acute", "Measure the forced vital capacity, not the oxygen saturation — respiratory failure shows late on the monitor and early in the patient. A sensory level or early sphincter failure means cord compression until an MRI says otherwise."],
  ["pons_medial", "Basilar territory disease can progress to locked-in syndrome — watch closely."],
  ["pons_trigeminal", "A trigeminal motor + main-sensory deficit points into the pons — image the brainstem."],
  ["pontomesencephalic_tegmentum", "Upbeat nystagmus with other brainstem signs needs urgent imaging; consider thiamine (Wernicke's) empirically if any nutritional risk."],
  ["pupil_cn3_compressive", "A fixed dilated pupil with a third-nerve palsy is a SURGICAL EMERGENCY — image the vessels (CTA/MRA) for an aneurysm now."],
  ["pupil_pretectum", "Bilateral light-near dissociation warrants syphilis serology and a look at the dorsal midbrain."],
  ["root_c5", "Progressive or bilateral cervical radiculopathy — image and exclude a myelopathy (long-tract signs change everything)."],
  ["root_c6", "C6 and C7 overlap clinically — the reflex (brachioradialis vs triceps) and the affected digit help separate them."],
  ["root_c7", "New bilateral or progressive signs, or any long-tract sign, means image to exclude cord compression."],
  ["root_c8", "C8/T1 signs with a Horner's suggest a Pancoast tumour — image the lung apex."],
  ["root_l2", "Proximal leg weakness with weight loss may be diabetic amyotrophy or a retroperitoneal lesion — image and check glucose."],
  ["root_l3", "Knee buckling from quadriceps weakness — assess falls risk; image the high lumbar spine."],
  ["root_l4", "Foot drop can be L4/L5 or a peroneal palsy — the knee jerk and dorsiflexion pattern separate them."],
  ["root_l5", "Distinguish an L5 root from a common peroneal palsy: L5 also weakens foot inversion and hip abduction, the peroneal nerve does not."],
  ["root_s1", "Bilateral S1/S2 signs with saddle anaesthesia or sphincter change is cauda equina — a surgical emergency."],
  ["root_t1", "Wasting of the hand intrinsics with a Horner's — exclude an apical lung lesion."],
  ["skull_base_cavernous_sinus", "A septic cavernous sinus thrombosis is an emergency — fever, proptosis and rapidly progressive multi-nerve palsy need urgent imaging and antibiotics."],
  ["skull_base_cpa", "Unilateral sensorineural hearing loss deserves an MRI of the internal auditory meatus — a schwannoma is eminently treatable when small."],
  ["skull_base_hypoglossal_canal", "An isolated XII palsy is a skull-base lesion until proven otherwise — image the clivus and occipital condyle."],
  ["skull_base_iam", "Progressive unilateral sensorineural hearing loss with facial palsy needs an MRI of the IAM/CPA."],
  ["skull_base_jugular_foramen", "A pulsatile tinnitus with lower-cranial-nerve palsies suggests a glomus tumour — image the skull base with contrast."],
  ["skull_base_optic_aion", "Altitudinal visual loss with jaw claudication, scalp tenderness or raised ESR/CRP is giant-cell arteritis — start high-dose steroids immediately to save the other eye."],
  ["skull_base_orbital_apex", "In a diabetic or immunocompromised patient, apex syndrome with a black nasal eschar is invasive mucormycosis — a surgical emergency."],
  ["skull_base_petrous_apex", "Gradenigo's triad after otitis media is a surgical emergency — image the petrous apex."],
  ["skull_base_sup_orbital_fissure", "Painful ophthalmoplegia can be Tolosa-Hunt, but exclude a mass or aneurysm first — image before steroids."],
  ["skull_base_trochlear_cisternal", "Bilateral trochlear palsy after head trauma suggests a dorsal-midbrain (tectal plate) injury — image it."],
  ["skull_base_vii_stylomastoid", "Forehead-SPARING facial weakness is an UPPER-motor (central) lesion, not this — re-examine the forehead."],
  ["skull_base_villaret", "The added Horner's places the lesion in the retroparotid/retropharyngeal space — image the deep neck as well as the skull base."],
  ["subcortex_anterior_choroidal", "The full triad from one small perforator can look like a large cortical stroke — the absence of cortical signs points deep; image to confirm."],
  ["subcortex_thalamus", "Central post-stroke pain is often refractory and misattributed — it is a thalamic sign, not functional."],
  ["sympathetic_preganglionic", "A preganglionic Horner with C8/T1 wasting or arm pain → image the lung apex for a Pancoast tumour."],
  ["thalamus_bilateral_percheron", "Sudden coma with vertical gaze palsy and a near-normal early CT → suspect a Percheron infarct or deep venous thrombosis; get vascular imaging."],
  ["thalamus_limbic", "Acute amnesia with a diencephalic lesion — give thiamine before glucose if any nutritional risk (Wernicke)."],
  ["thalamus_pulvinar", "Neglect can arise from a deep thalamic lesion as well as the cortex — image both."],
  ["thalamus_vl", "A new movement disorder with a deep contralateral lesion — image the thalamus."],
  ["thalamus_vpm", "Crossed facial sensory loss (contralateral, no ipsilateral brainstem signs) points above the pons — image the thalamus."],
  ["visual_pathway_chiasm", "Bitemporal field loss with headache or endocrine change — image the sella; acuity/colour loss or apoplexy are emergencies."],
  ["visual_pathway_lgn", "A wedge/sectoranopia with thalamic sensory signs points to the lateral geniculate."],
  ["visual_pathway_optic_tract", "A homonymous hemianopia WITH an RAPD localises to the optic tract (pre-geniculate), not the occipital cortex."],
];
{ const now = placeFlags(), want = PLACE_FLAGS.slice().sort((a, b) => (a[0] < b[0] ? -1 : 1));
  const keyed = rows => new Map(rows.map(([k, t]) => [k, t]));
  const N = keyed(now), W = keyed(want);
  const added = [...N.keys()].filter(k => !W.has(k)), removed = [...W.keys()].filter(k => !N.has(k)), reworded = [...N.keys()].filter(k => W.has(k) && W.get(k) !== N.get(k));
  ok("snapshot: the 132 place flags are exactly the reviewed ones (131 kept + the diffuse cerebrum's place half)",
     now.length === 132 && !added.length && !removed.length && !reworded.length,
     `${now.length} flags; added: ${added.join(", ") || "—"}; removed: ${removed.join(", ") || "—"}; reworded: ${reworded.join(", ") || "—"}`); }

// ---- D. A floor for the dangerous phrasings ----
// A place flag may not use these forms without a reasoned entry. The floor alone misses cause claims written without them, which
// is why the snapshot above is the gate.
const CLAIM_FORMS = [
  [/until (?:proven|imaging (?:and [^,.]+ )?says?|an MRI says|whole-spine MRI says|imaging and a diabetes screen say) otherwise/i, "until proven otherwise"],
  [/\b(?:is|it is) an? (?:[\w-]+ ){0,4}(?:stroke|infarct|occlusion|haemorrhage|tumour|metastasis|dissection|encephalitis|lacune)\b/i, "is a <pathology>"],
  [/time-critical/i, "time-critical"],
  [/thromboly|thrombectom|reperfusion/i, "thrombolysis / thrombectomy / reperfusion"],
  [/\breassuring\b|\bbenign\b/i, "reassuring / benign"],
  [/treat (?:\w+ )?empirically|empirically for/i, "treat empirically"],
];
const ALLOW = {
  cord_hemi: "a cause-neutral class (a structural lesion), true whatever the cause",
  cord_anterior: "the place's compression rule (spinal cord fix, content round A4): true until whole-spine MRI says otherwise",
  bilateral_anterior_temporal: "conditional on fever and confusion, the findings it names itself",
  peripheral_vestibular_labyrinth: "conditional on CENTRAL features, the findings it names itself: they point away from this place",
  "basal_ganglia_substantia_nigra.dominant": "a cause-neutral class (structural)",
  "basal_ganglia_substantia_nigra.nondominant": "a cause-neutral class (structural)",
  skull_base_hypoglossal_canal: "a place claim: an isolated XII palsy is a skull-base lesion",
  polyradiculoneuropathy_acute: "conditional on a sensory level or early sphincter failure",
  plexus_lower_trunk: "conditional on a Horner's",
  plexus_lumbosacral_plexus: "conditional on weight loss and anticoagulation",
  nerve_femoral: "conditional on anticoagulation",
  cortex_paracentral: "a place claim: a parasagittal lesion",
  bilateral_paracentral: "a place claim: a parasagittal lesion",
};
{ const bad = [], stale = [];
  const flags = placeFlags(), byId = new Map(flags);
  for (const [id, t] of flags) if (CLAIM_FORMS.some(([re]) => re.test(t)) && !ALLOW[id]) bad.push(id);
  for (const id of Object.keys(ALLOW)) if (!byId.has(id) || !CLAIM_FORMS.some(([re]) => re.test(byId.get(id)))) stale.push(id);
  ok("floor: no place flag uses a dangerous phrasing without a reasoned allowlist entry", bad.length === 0, bad.join(", "));
  ok("floor: every allowlist entry still names a place flag that uses one", stale.length === 0, stale.join(", ")); }

// ---- E. No title names a pathology ----
const TITLE_PATHOLOGY = /\b(lacun\w*|infarct\w*|stroke|haemorrhag\w*|tumou?r|glioma|metasta\w*|wernicke-korsakoff|embol\w*|dissection|aneurysm)\b/i;
{ const bad = [];
  for (const [k, v] of Object.entries(BY_SITE)) { if (v.name && TITLE_PATHOLOGY.test(v.name)) bad.push(`${k}: ${v.name}`);
    for (const sub of ["dominant", "nondominant", "bilateral"]) if (v[sub] && v[sub].name && TITLE_PATHOLOGY.test(v[sub].name)) bad.push(`${k}.${sub}: ${v[sub].name}`); }
  ok("titles: no card title names a pathology", bad.length === 0, bad.join(" | ")); }
for (const [k, n] of [
  ["subcortex_internal_capsule", "Pure motor hemiparesis (internal capsule)"], ["subcortex_corona_radiata", "Pure motor hemiparesis (corona radiata)"],
  ["subcortex_thalamus", "Pure sensory syndrome / Déjerine–Roussy (thalamic VPL)"], ["subcortex_sensorimotor", "Sensorimotor syndrome (thalamocapsular)"],
  ["pons_basis_pontis", "Ventral pontine (basis pontis) syndrome"], ["hypothalamus_mammillary", "Mammillary body syndrome (diencephalic amnesia)"],
  ["sympathetic_pancoast", "Pancoast syndrome (superior sulcus)"],
]) ok(`titles: ${k} reads "${n}"`, (BY_SITE[k] || {}).name === n, (BY_SITE[k] || {}).name);

// ---- F. Every restriction is real ----
{ const flags = causeFlags(), bad = [];
  for (const f of flags.filter(x => x.only)) {
    const readers = candidateSites().filter(s => listOf(s) === f.list);
    const real = f.only === "dominant" || f.only === "nondominant"
      ? readers.some(s => ["left", "right"].some(d => phonebookVariant(s, { dominantSide: d }) === f.only))
      : readers.some(s => kindOf(s) === f.only);
    if (!real) bad.push(`${f.list} / ${f.cause}: only ${f.only}`); }
  ok("restrictions: 38 cause flags, 13 restricted, every restriction names a place or hemisphere reading that list",
     flags.length === 38 && flags.filter(x => x.only).length === 13 && bad.length === 0, `${flags.length} flags; ${bad.join(" | ")}`); }

// ---- G. The cards that showed the defect ----
const BASILAR_TIP = "Drowsiness with vertical gaze palsy and visual loss is a basilar-tip occlusion until proven otherwise — CTA now; it is a thrombectomy target, and it is regularly called delirium.";
const TOB = "reduced_consciousness@none vertical_gaze_palsy@none homonymous_hemianopia@left homonymous_hemianopia@right";
{ const a = card(TOB), b = card(`${TOB} ${P}`);
  ok("top of the basilar: its own card keeps the basilar-tip flag", a?.lines.red === BASILAR_TIP, a?.lines.red);
  ok("top of the basilar + papilloedema: the card names deep cerebral venous thrombosis and drops the basilar-tip flag",
     /^Most likely Deep cerebral venous thrombosis/.test(b?.lines.what || "") && !(b?.lines.red || "").includes("basilar-tip"), `${b?.lines.what} | ${b?.lines.red}`); }
{ const a = card(`${own("left_cortex_temporoparietal")} ${P}`, { pick: "left_cortex_temporoparietal" });
  ok("Wernicke's area + papilloedema: a haemorrhage leads, and no flag says to consider thrombolysis",
     /^Most likely Intracerebral haemorrhage/.test(a?.lines.what || "") && !(a?.lines.red || "").includes("thrombolysis"), `${a?.lines.what} | ${a?.lines.red}`); }
{ const BROCA = "Acute non-fluent aphasia + right hemiparesis is a dominant MCA stroke — time-critical.", op = own("left_cortex_operculum");
  const d = card(op, { pick: "left_cortex_operculum" }), sel = card(op, { pick: "left_cortex_operculum", selectedPathology: "Tumour (glioma / metastasis)" });
  const chr = card(op, { pick: "left_cortex_operculum", onset: "chronic" });
  ok("Broca's area: its own card keeps the MCA flag, word for word", d?.lines.red === BROCA, d?.lines.red);
  ok("Broca's area: selecting the tumour drops it", sel?.lines.what === "Selected: Tumour (glioma / metastasis)." && sel?.lines.red === null, `${sel?.lines.what} | ${sel?.lines.red}`);
  ok("Broca's area: at chronic onset, following the tumour, it is dropped", !(chr?.lines.red || "").includes("time-critical"), chr?.lines.red); }
{ const a = card(`${own("left_pupil_cn3_ischaemic")} ${P}`, { pick: "left_pupil_cn3_ischaemic" });
  ok("the ischaemic III + papilloedema: no flag calls it reassuring", !/reassuring/i.test(a?.lines.red || ""), a?.lines.red); }
{ const a = card(`${own("left_medulla_lateral")} ${P}`, { pick: "left_medulla_lateral", onset: "subacute" });
  ok("where the pressure leads, the place's own flag shows (row 10's blank reversed): the lateral medulla",
     a?.nx.pressureLeads === true && a?.lines.red === "Swallowing can fail early — keep nil by mouth until assessed.", `${a?.nx.pressureLeads} | ${a?.lines.red}`); }
{ const UNCAL = "A new dilated pupil with a falling conscious level is uncal herniation until proven otherwise — CT head now and call neurosurgery; start lowering the pressure while you wait.";
  const CN3 = "A fixed dilated pupil with a third-nerve palsy is a SURGICAL EMERGENCY — image the vessels (CTA/MRA) for an aneurysm now.";
  const toks = "reduced_consciousness@none fixed_dilated_pupil@left weak_arm@right weak_leg@right";
  const a = card(toks), b = card(toks, { selectedPathology: "Posterior communicating artery aneurysm" });
  ok("the uncal reading: herniation's flag, then the compressive III's own flag", a?.lines.red === `${UNCAL} ${CN3}`, a?.lines.red);
  ok("the uncal reading: selecting the aneurysm shows the III's own flag, not herniation's", b?.lines.red === CN3, b?.lines.red); }
{ const ALEXIA = "New pure alexia with a right hemianopia is a left PCA stroke until proven otherwise.";
  const l = card(own("left_cortex_pca"), { pick: "left_cortex_pca" }), r = card(own("right_cortex_pca"), { pick: "right_cortex_pca" });
  ok("a hemisphere's flag: the dominant PCA shows pure alexia; the non-dominant shows its own place flag",
     l?.lines.red === ALEXIA && r?.lines.red === "An isolated hemianopia is easily missed — confrontation-test fields; consider a posterior-circulation cause.", `${l?.lines.red} | ${r?.lines.red}`); }
{ const o = card(own("left_cortex_occipital"), { pick: "left_cortex_occipital" }), b = card(own("bilateral_occipital"), { pick: "bilateral_occipital" });
  ok("a shared list: the occipital lobe keeps its own flag; both occipital lobes show theirs",
     o?.lines.red === "Confrontation-test the fields — an isolated hemianopia is easily overlooked; posterior circulation imaging is warranted."
     && b?.lines.red === "Top-of-the-basilar embolism is a treatable cause of bilateral occipital stroke — image the posterior circulation urgently.", `${o?.lines.red} | ${b?.lines.red}`); }
{ const CAUSE_HALF = "Coma with no focal signs and intact brainstem reflexes is metabolic / diffuse until proven otherwise.";
  const PLACE_HALF = "Coma with no focal signs: check glucose, sodium and a blood gas immediately.";
  const a = card("reduced_consciousness@none"), b = card(`reduced_consciousness@none ${P}`);
  ok("the split: coma reads the metabolic cause's half, then the place's half", a?.lines.red === `${CAUSE_HALF} ${PLACE_HALF}`, a?.lines.red);
  ok("the split: coma + papilloedema (the pressure leads) keeps only the place's half", b?.lines.red === PLACE_HALF, b?.lines.red); }
ok("P22 reworded: image, then LP",
   (BY_SITE.bilateral_anterior_temporal || {}).red === "Acute Klüver-Bucy features with fever / confusion — treat empirically for HSV encephalitis; image, then do an LP.");

// ---- report ----
console.log(`\nNeuroLocaliser — the card follows its cause (round 1)\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

## Appendix B — `move-flags.mjs` (run once, outside the repo; Task 3 Step 1)

```js
// move-flags.mjs — the content move of "the card follows its cause" (round 1, RULED 2026-11-11 "approve as proposed";
// spec docs/superpowers/specs/2026-11-11-card-follows-cause-design.md, Appendix A). Every moved sentence is READ from the
// source and written back unchanged, so the move is word for word; only the C33 split, P22 and the 7 titles change wording.
// Run once from the repo root: node <path>/move-flags.mjs .   It refuses to run twice (each anchor must match exactly once).
import { readFileSync, writeFileSync } from "node:fs"; import { join } from "node:path";
const tree = process.argv[2];
// [phonebook flag id ("key" or "key.variant"), the cause list it moves to, the cause, the restriction if any] — Appendix A C-rows.
const MOVES = Object.fromEntries([
  ["bilateral_pons_mlf", "pons_medial", "Basilar perforator infarct", "bilateral_pons_mlf"],
  ["pons_lateral", "pons_lateral", "AICA territory infarct"],
  ["medulla_hemi", "medulla_hemi", "Vertebral artery occlusion or dissection"],
  ["cortex_aca", "cortex_aca", "ACA infarct"],
  ["cortex_temporoparietal.dominant", "cortex_temporoparietal", "MCA inferior division infarct", "dominant"],
  ["bilateral_occipital", "cortex_occipital", "PCA infarct", "bilateral_occipital"],
  ["bilateral_fusiform", "cortex_fusiform", "PCA territory infarct", "bilateral_fusiform"],
  ["bilateral_parietal", "cortex_parietal", "MCA inferior division infarct", "bilateral_parietal"],
  ["subcortex_internal_capsule", "subcortex_internal_capsule", "Small-vessel lacunar infarct"],
  ["central_vestibular_nucleus", "central_vestibular_nucleus", "Cerebellar / brainstem stroke (PICA / AICA)"],
  ["subcortex_sensorimotor", "subcortex_sensorimotor", "Thalamocapsular lacunar infarct"],
  ["skull_base_vii_geniculate", "skull_base_vii_geniculate", "Herpes zoster oticus (Ramsay Hunt)"],
  ["skull_base_collet_sicard", "skull_base_collet_sicard", "Skull base metastasis"],
  ["motor_unit_nmj_presynaptic", "motor_unit_nmj_presynaptic", "Small cell lung carcinoma (paraneoplastic LEMS)"],
  ["nerve_lat_fem_cutaneous", "nerve_lat_fem_cutaneous", "Meralgia paraesthetica (inguinal ligament entrapment)"],
  ["pupil_cn3_ischaemic", "pupil_cn3_ischaemic", "Microvascular (diabetic / hypertensive) third-nerve palsy"],
  ["pupil_ciliary_ganglion", "pupil_ciliary_ganglion", "Holmes-Adie (tonic) pupil"],
  ["cortex_operculum.dominant", "cortex_operculum", "MCA (superior division) infarct", "dominant"],
  ["cortex_watershed_anterior", "cortex_watershed_anterior", "Border-zone (watershed) infarct from hypoperfusion"],
  ["cortex_watershed_posterior", "cortex_watershed_posterior", "Border-zone (watershed) infarct from hypoperfusion"],
  ["cortex_aphasia_global", "cortex_aphasia_global", "Large MCA territory (or ICA) infarct"],
  ["cortex_aphasia_mixed_transcortical", "cortex_aphasia_mixed_transcortical", "Global cerebral hypoperfusion (watershed 'isolation of the speech area')"],
  ["hypothalamus_lateral", "hypothalamus_lateral", "Narcolepsy with cataplexy (orexin/hypocretin loss)"],
  ["brainstem_aras", "brainstem_aras_paramedian_tegmentum", "Top-of-the-basilar / brainstem infarct"],
  ["top_of_basilar", "top_of_basilar", "Top-of-the-basilar embolism"],
  ["sympathetic_pancoast", "sympathetic_pancoast", "Apical lung (superior sulcus) carcinoma"],
  ["skull_base_carotid_space", "skull_base_carotid_space", "Carotid artery dissection"],
  ["corpus_callosum_splenium", "corpus_callosum_splenium", "PCA territory infarct with splenial involvement"],
  ["pons_lateral_trigeminal", "pons_lateral_trigeminal", "AICA territory infarct involving the trigeminal complex"],
  ["cortex_mca_superior.dominant", "cortex_mca_superior", "MCA superior division infarct", "dominant"],
  ["cortex_mca_superior.nondominant", "cortex_mca_superior", "MCA superior division infarct", "nondominant"],
  ["cortex_mca_inferior.dominant", "cortex_mca_inferior", "MCA inferior division infarct", "dominant"],
  ["cortex_mca.dominant", "cortex_mca", "Proximal MCA (M1) / carotid-T occlusion", "dominant"],
  ["cortex_mca.nondominant", "cortex_mca", "Proximal MCA (M1) / carotid-T occlusion", "nondominant"],
  ["cortex_pca.dominant", "cortex_pca", "PCA infarct", "dominant"],
  ["cortex_fusiform.dominant", "cortex_fusiform", "PCA territory infarct", "dominant"],
].map(([id, list, to, only]) => [id, { list, to, ...(only ? { only } : {}) }]));
const SPLITS = {
  "cerebrum_diffuse": { list: "cerebrum_diffuse", to: "Metabolic or toxic encephalopathy",
    cause: "Coma with no focal signs and intact brainstem reflexes is metabolic / diffuse until proven otherwise.",
    place: "Coma with no focal signs: check glucose, sodium and a blood gas immediately." },
};
const TITLES = {
  subcortex_internal_capsule: "Pure motor hemiparesis (internal capsule)",
  subcortex_corona_radiata: "Pure motor hemiparesis (corona radiata)",
  subcortex_thalamus: "Pure sensory syndrome / Déjerine–Roussy (thalamic VPL)",
  subcortex_sensorimotor: "Sensorimotor syndrome (thalamocapsular)",
  pons_basis_pontis: "Ventral pontine (basis pontis) syndrome",
  hypothalamus_mammillary: "Mammillary body syndrome (diencephalic amnesia)",
  sympathetic_pancoast: "Pancoast syndrome (superior sulcus)",
};
const P22_OLD = "Acute Klüver-Bucy features with fever / confusion — treat empirically for HSV encephalitis while imaging and doing an LP.";
const P22_NEW = "Acute Klüver-Bucy features with fever / confusion — treat empirically for HSV encephalitis; image, then do an LP.";
const fail = m => { throw new Error(m); };
const lit = s => JSON.stringify(s);

// ---- syndromes.js: take the moved sentences out (reading them first), split, reword P22, rename the titles ----
const synFile = join(tree, "src/data/syndromes.js"); const syn = readFileSync(synFile, "utf8").split("\n");
const topKey = l => (l.match(/^  ([a-z0-9_]+): \{/) || [])[1];
const blockOf = key => { const a = syn.findLastIndex(l => topKey(l) === key); if (a < 0) fail(`no phonebook key ${key}`);   // the LAST definition is live: a duplicated object key silently wins
  let b = a + 1; while (b < syn.length && !topKey(syn[b]) && !/^};/.test(syn[b])) b++; return [a, b]; };
const findIn = (key, variant, re) => { let [a, b] = blockOf(key);
  if (variant) { const v = syn.findIndex((l, i) => i > a && i < b && new RegExp(`^    ${variant}: \\{`).test(l)); if (v < 0) fail(`no ${key}.${variant}`);
    let e = v + 1; while (e < b && !/^    \}/.test(syn[e])) e++; a = v; b = e; }
  const hits = []; for (let i = a; i < b; i++) if (re.test(syn[i])) hits.push(i);
  if (hits.length !== 1) fail(`${key}${variant ? "." + variant : ""}: ${hits.length} matches for ${re}`); return hits[0]; };
// A property may sit on its own line (`    red: "…"`) or inside a one-line entry (`  key: { name: "…", …, red: "…" },`).
const RED = /(^|[\s,{])red: ("(?:[^"\\]|\\.)*")/, NAME = /(^|[\s,{])name: ("(?:[^"\\]|\\.)*")/;
const redText = i => { const m = syn[i].match(RED); if (!m) fail(`unparsed red line ${i + 1}: ${syn[i]}`); return JSON.parse(m[2]); };
const moved = [];     // { id, list, to, only?, text }
const del = new Set();
for (const [id, m] of Object.entries(MOVES)) {
  const [key, variant] = id.split(".");
  const i = findIn(key, variant, RED); moved.push({ id, list: m.list, to: m.to, only: m.only, text: redText(i) });
  if (/^\s*red: "/.test(syn[i])) del.add(i);                                        // its own line: drop the line
  else { const before = syn[i]; syn[i] = syn[i].replace(/,\s*red: "(?:[^"\\]|\\.)*"/, ""); if (syn[i] === before) fail(`${id}: inline red not removed`); }
}
for (const [id, s] of Object.entries(SPLITS)) {
  const i = findIn(id, null, RED);
  syn[i] = syn[i].replace(/red: "(?:[^"\\]|\\.)*"/, `red: ${lit(s.place)}`);
  moved.push({ id, list: s.list, to: s.to, text: s.cause });
}
{ const i = findIn("bilateral_anterior_temporal", null, RED); if (redText(i) !== P22_OLD) fail("P22 text changed");
  syn[i] = syn[i].replace(lit(P22_OLD), lit(P22_NEW)); }
for (const [key, name] of Object.entries(TITLES)) {
  const i = findIn(key, null, NAME); syn[i] = syn[i].replace(/name: "(?:[^"\\]|\\.)*"/, `name: ${lit(name)}`); }
writeFileSync(synFile, syn.filter((_, i) => !del.has(i)).join("\n"));

// ---- sites.js: the uncal reading's flag leaves the reading ----
const sitesFile = join(tree, "src/model/sites.js"); let sites = readFileSync(sitesFile, "utf8");
const um = sites.match(/\n    red: ("(?:[^"\\]|\\.)*"),\n  \}\],\n\};/); if (!um) fail("uncal red not found");
const uncalText = JSON.parse(um[1]);
sites = sites.replace(um[0], "\n  }],\n};");
sites = sites.replace("`leads`: the cause its What line leads with (row 6); `red`: its red flag (row 11).",
  "`leads`: the cause its What line leads with (row 6). Its red flag (row 11) lives on that cause, \"Uncal herniation\" in the\n// compressive III's list (the card follows its cause, 2026-11-11).");
writeFileSync(sitesFile, sites);
moved.push({ id: "uncal-reading", list: "pupil_cn3_compressive", to: "Uncal herniation", text: uncalText });

// ---- causes.js: the `flagged` builder, and each flag onto its cause entry ----
const cFile = join(tree, "src/data/causes.js"); let cs = readFileSync(cFile, "utf8");
if (!cs.includes("export const flagged = (cause, ...flags) =>")) fail("the flagged builder (plan Task 2) is missing from causes.js");
const byCause = new Map();   // "list|cause" -> [flags]
for (const mv of moved) { const k = `${mv.list}|${mv.to}`; (byCause.get(k) || byCause.set(k, []).get(k)).push(mv.only ? { text: mv.text, only: mv.only } : mv.text); }
const lines = () => cs.split("\n");
for (const [k, flags] of byCause) {
  const [list, name] = k.split("|");
  const L = lines(); const keyIdx = L.findIndex(l => new RegExp(`^  (["']?)${list}\\1: \\[`).test(l)); if (keyIdx < 0) fail(`no CAUSES list ${list}`);
  let endIdx = keyIdx + 1; while (endIdx < L.length && !/^  \],?\s*(\/\/.*)?$/.test(L[endIdx])) endIdx++;
  const startOff = L.slice(0, keyIdx).join("\n").length + 1, endOff = L.slice(0, endIdx).join("\n").length;
  const block = cs.slice(startOff, endOff);
  const needle = `c(${lit(name)},`; const at = block.indexOf(needle); if (at < 0 || block.indexOf(needle, at + 1) >= 0) fail(`${k}: ${at < 0 ? "not found" : "twice"}`);
  // the call's closing paren, string-aware
  let i = at + 1, depth = 0, inStr = false;
  for (; i < block.length; i++) { const ch = block[i];
    if (inStr) { if (ch === "\\") { i++; continue; } if (ch === '"') inStr = false; continue; }
    if (ch === '"') { inStr = true; continue; }
    if (ch === "(") depth++; else if (ch === ")") { depth--; if (depth === 0) break; } }
  const indent = (block.slice(0, at).split("\n").pop().match(/^\s*/) || [""])[0];
  const flagSrc = flags.map(f => typeof f === "string" ? lit(f) : `{ text: ${lit(f.text)}, only: ${lit(f.only)} }`).join(`,\n${indent}  `);
  const wrapped = `flagged(${block.slice(at, i + 1)},\n${indent}  ${flagSrc})`;
  cs = cs.slice(0, startOff) + block.slice(0, at) + wrapped + block.slice(i + 1) + cs.slice(endOff);
}
writeFileSync(cFile, cs);
console.log(`moved ${moved.length} flags onto ${byCause.size} cause entries; removed ${del.size} phonebook lines; split 1; reworded P22; renamed ${Object.keys(TITLES).length} titles; uncal flag moved`);
```

## Appendix C — the dry run (outside the repo; Task 4 Step 1)

`dry-run-cards.mjs`:

```js
// Every answer card, field by field, as JSON lines — for diffing two trees (the card follows its cause, dry run).
// Contexts: each place's own picture (and each reading's own picture) × {no onset, 4 onsets} × {without, with papilloedema},
// plus every selectable cause with no onset and no papilloedema. Usage: node dry-run-cards.mjs <tree>
import { pathToFileURL } from "node:url"; import { join } from "node:path";
const tree = process.argv[2]; const imp = p => import(pathToFileURL(join(tree, p)).href);
const { solve, candidateSites, isNormalToken } = await imp("src/engine/inverse.js");
const { expectedFindings } = await imp("src/engine/forward.js");
const { causesFor } = await imp("src/data/causes.js");
const { plainSiteName } = await imp("app/labels.js");
const ANS = await imp("app/answer.js");
const out = [];
const card = (ctx, tokens, id, onset, selectedPathology) => {
  const r = solve(tokens); const sel = r.display.find(x => x.site.id === id); if (!sel) return;
  const total = [...tokens].filter(t => !t.startsWith("papilloedema@") && !isNormalToken(t)).length;
  const a = ANS.answerFor({ r, sel, total, tokens, onset, course: "", dominant: "left", sensoryLevel: "", pinned: new Set(),
    scope: "site", selectedPathology, selectedEntity: undefined });
  out.push(JSON.stringify({ ctx, title: a.pressureOnly ? "(pressure only)" : plainSiteName(sel.site, { dominantSide: "left" }).name,
    where: a.lines.where, why: a.lines.why, what: a.lines.what, next: a.lines.next, urgency: a.nx.urgency, red: a.lines.red || null }));
};
for (const s of candidateSites()) {
  const kind = s.id; // EVERY site id, both sides (amended 2026-11-12), so the non-dominant hemisphere's cards are counted
  const pictures = [["own", [...expectedFindings(s)]]];
  for (const v of s.variants || []) pictures.push([`reading:${v.key}`, [...expectedFindings({ ...s, structures: v.structures, variants: undefined })]]);
  for (const [pic, exp] of pictures) {
    if (!exp.length) continue;
    for (const o of ["", "hyperacute", "acute", "subacute", "chronic"]) {
      card(`${kind}|${pic}|${o || "none"}`, new Set(exp), s.id, o);
      card(`${kind}|${pic}|${o || "none"}|P`, new Set([...exp, "papilloedema@none"]), s.id, o);
    }
    if (pic === "own") for (const c of [...causesFor(s).all, ...(causesFor(s).demoted || [])]) card(`${kind}|${pic}|sel:${c.name}`, new Set(exp), s.id, "", c.name);
  }
}
console.log(out.join("\n"));
```

`dry-run-compare.mjs`:

```js
// Compares two dry-run-cards.mjs outputs (before, after) field by field, and sorts every changed red line by kind.
// Usage: node dry-run-compare.mjs <before.jsonl> <after.jsonl>
import { readFileSync } from "node:fs";
const rd = f => readFileSync(f, "utf8").trim().split("\n").map(JSON.parse);
const [beforeFile, afterFile] = process.argv.slice(2);
const A = new Map(rd(beforeFile).map(x => [x.ctx, x])), B = rd(afterFile);
const axis = c => c.includes("|sel:") ? "selection" : c.includes("|reading:") ? "reading" : c.endsWith("|P") ? "papilloedema" : c.split("|")[2] === "none" ? "default" : "onset";
const fields = {}, kinds = {}, odd = [];
for (const b of B) {
  const a = A.get(b.ctx); if (!a) { odd.push(`missing before: ${b.ctx}`); continue; }
  for (const f of ["title", "where", "why", "what", "next", "urgency", "red"]) if (a[f] !== b[f]) fields[`${f}`] = (fields[f] || 0) + 1;
  if (a.red === b.red) continue;
  const [id, pic] = b.ctx.split("|"), place = id.replace(/^(left|right)_/, ""); // a card is keyed by its site id
  let k;
  if (place === "bilateral_anterior_temporal") k = "P22 reworded";
  else if (place === "cerebrum_diffuse") k = "the split (C33)";
  else if (pic === "reading:uncal") k = "uncal card: + the compressive III place flag";
  else if (place === "pupil_cn3_compressive" && b.ctx.endsWith("|own|sel:Uncal herniation")) k = "selecting Uncal herniation shows its own flag";
  else if (a.red && !b.red) k = "a moved flag no longer beside another cause";
  else if (!a.red && b.red) k = "gained: the place flag where the pressure leads";
  else { k = "UNEXPLAINED"; odd.push(`${b.ctx} :: ${a.red} → ${b.red}`); }
  kinds[k] = (kinds[k] || 0) + 1;
}
console.log(`cards: ${B.length} (before ${A.size})`);
console.log("fields that differ:", JSON.stringify(fields));
console.log("red-line changes by kind:", JSON.stringify(kinds, null, 1));
console.log(`unexplained: ${odd.length}`); odd.slice(0, 10).forEach(x => console.log("  " + x.slice(0, 300)));
```

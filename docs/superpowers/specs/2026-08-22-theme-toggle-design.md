# Theme toggle — light / dark / follow-system

**Status: specified 2026-08-22, not yet implemented.** Branch `feat/theme-toggle`. New files
`app/theme.js` + `test/theme.test.js`; edits to `app/index.html` and `app/app.js` only. **No engine
changes, no palette changes.**

## The problem

**The CSS has been fully three-state theme-aware since the 2026-08-16 brand pass, and nothing has ever
been able to set it.** `app/index.html` already defines four palette blocks:

```
:root{…}                                              the complete light palette
@media (prefers-color-scheme:dark){:root{…}}          dark via the OS setting
:root[data-theme="light"]{…}                          explicit light override
:root[data-theme="dark"]{…}                           explicit dark override
```

`data-theme` on the root element is therefore already wired end to end — the two explicit blocks outrank
both the bare `:root` and the media query by specificity. What is missing is **only the UI to set it**, so
a tester on a dark-mode laptop who wants the parchment reading view, or a tester on a light-mode phone
reading at night in an ED, has no way to ask for it. This is an app-layer job in the strict sense the
project already uses that phrase: it consumes what exists and adds no model.

## What it is

**One compact cycle button in the header**, beside the Dominant select, stepping
**`system → light → dark → system`**.

**Three states, not two.** Following the OS is the current behaviour and the default; a two-state toggle
would have to pick a starting side and would make "let the OS decide" **unreachable**, which is a
regression for every user who is currently well served by doing nothing. So `system` is a first-class
state, it is the initial state, and the cycle always returns to it.

## Decisions, and what was rejected

### 1. A cycle button, not a segmented pill or a select

The 2026-08-16 UI clarity pass measured the header's problem precisely: **five global controls above the
fold, three of them inert until a finding existed.** Adding a second `.modes`-width pill `[System | Light |
Dark]` would put back the exact crowding that pass removed, and a `Theme [System ▾]` select would put a
second labelled dropdown next to the first.

The cycle button costs one glyph. **The glyph shows the state you are IN, not the state you would move
to** — a control that displays its own next action is a well-known ambiguity, and here it would be worse
than usual because two of the three states (`light` on a light OS, `system` on a light OS) look identical
on screen. `title` and `aria-label` carry the state and the next step in words, so the cycle order is
never something the user has to have learned.

### 2. The theme is applied by a blocking inline script in `<head>`

`app.js` is a **deferred ES module that imports the whole engine graph**. Everything it does happens after
first paint, so applying the theme at the top of `startGate()` would mean the body paints `--cream` and
then repaints navy — on a cold GitHub Pages load, over the network, a visible flash for anyone who has
overridden the OS.

So the read happens in four lines of blocking script placed in `<head>` **above `<style>`** — before the
stylesheet is even parsed, and, incidentally, outside the slice `test/brand.test.js` scans for `--terra`
offenders (it slices from `<style>` to `</style>`):

```html
<script>try{var t=localStorage.getItem('nl_theme_v1');
  if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;}catch(e){}</script>
```

Users on `system` never flash either way — they have no attribute to set, and the media query is already
correct at first paint.

**The cost is the one thing to keep an eye on: the storage key literal now exists in two files.**
`test/theme.test.js` asserts the literal appears in `index.html`'s inline script and that the script writes
`data-theme`, so the duplication cannot drift silently. That is the same shape as `test/brand.test.js`
scanning the stylesheet as text — a mechanical guard on a string that two files must agree about.

`startGate()` still calls `applyTheme(readTheme())` before `paintBrand()`. That is **not** redundant: the
inline script handles first paint, and this call is what makes `app/theme.js` the single source of truth
for the button's initial state and for the favicon's colour read.

### 3. `"system"` REMOVES the attribute — it never writes `data-theme="system"`

There is no `:root[data-theme="system"]` palette block and there must not be one (see the constraints
below). Following the OS **is** the absence of an override, so `applyTheme("system", root)` deletes the
attribute and lets `@media (prefers-color-scheme:dark)` resume. Writing a third attribute value would be a
state the CSS cannot see.

The stored value, by contrast, **is** the literal `"system"`. Storing what the user chose keeps the round
trip obvious, and the inline script's `t==='light'||t==='dark'` guard already ignores it correctly.

### 4. The favicon repaints on toggle

`paintBrand()` bakes the **computed** `--terra` into the favicon data URI (`#d36d52` light, `#e79075`
dark), because a data URI cannot inherit `currentColor`. Toggling changes that computed value, so without a
repaint the tab icon silently goes stale until the next reload.

Repainting keeps one identity showing one hue at a time. **The known caveat, accepted:** the tab strip is
browser chrome and follows the OS, not the page — so a light-page-on-dark-OS user gets the darker
terracotta on a dark tab bar. Both hues are mid-tone and legible on both backgrounds, so the cost is
cosmetic. The alternative — pinning the favicon to `matchMedia` instead of the page theme — was rejected
because it computes one brand surface from a different signal than every other one, which is a second rule
to remember in `brand.js`'s deliberate one-geometry story.

**While on `system`, a `matchMedia` change listener repaints the favicon** when the OS flips. The CSS needs
no help there — the media query handles it — but the favicon would otherwise be exactly as stale as the
case this decision exists to avoid.

### 5. The theme stays OUT of `S` and out of the case URL

**A case URL is shared between people.** It carries the case — findings, level, pinned sites, course,
selected pathology, selected entity, scope — because those are claims about the patient that the recipient
must see to read the same reasoning. **The theme is a property of the reader's eyes, not of the case.**
Round-tripping it through `#` would mean a sender on dark mode imposes dark mode on the recipient, and
`sc=all` exists precisely because the opposite — a link that shows the recipient a *different card* than
the sender was reading — was a real bug worth closing.

So the theme lives in `localStorage` only, is never read or written by `encodeCase`/`decodeCase`, and never
touches `S` or `syncURL()`. Recorded here so it is not "fixed" later by someone who notices the asymmetry
and assumes it was an oversight.

## Architecture

**`app/theme.js`** — pure, DOM-free apart from the one `root` it is handed. The same split
`gate.js` and `usage.js` use: logic in a module, wiring in `app.js`.

| export | contract |
|---|---|
| `THEME_STORAGE_KEY` | `"nl_theme_v1"` — the `nl_*_v1` convention set by `GATE_STORAGE_KEY` and `usage.js` |
| `THEMES` | `["system","light","dark"]` — cycle order |
| `readTheme(store?)` | the stored value if it is in `THEMES`; **missing, unrecognised, or a throwing store → `"system"`**. Never throws. |
| `writeTheme(v, store?)` | persists the literal choice, `"system"` included. Never throws. |
| `nextTheme(cur)` | `system → light → dark → system`; an unrecognised current value enters at `light` |
| `resolveTheme(choice, prefersDark)` | → `"light"` \| `"dark"`. **Takes the media-query result as an argument**, so the whole resolve matrix is testable in node with no DOM and no stubbed `matchMedia`. |
| `applyTheme(choice, root)` | sets `root.dataset.theme` for light/dark, **deletes it for `system`** |
| `themeGlyph(choice)` / `themeLabel(choice)` | ☀ / 🌙 / 🖥 and the words for `title` + `aria-label` |

**Never throwing is a requirement, not politeness** — the same one `usage.js` carries. This code runs on the
path that reveals the app, and Safari private browsing throws on `localStorage` access. A cosmetic
preference must never be able to stop a clinician getting into the tool.

**`app/index.html`** — three additions: the inline `<head>` script; a `<button id="theme-toggle"
class="theme-btn" type="button">` in `.head-right` after the Dominant select; and a `.theme-btn` rule built
from `--band` / `--line` / `--muted` / `--paper`, sized to sit level with `.hemi-set select`.

**`app/app.js`** — import `theme.js`; `applyTheme(readTheme())` at the top of `startGate()`, **before**
`paintBrand()`; a click handler doing `next → write → apply → paintBrand() → relabel`; and the `matchMedia`
listener.

## Constraints that will fail the build if ignored

These are existing guards, listed so the implementation does not walk into them.

- **`test/brand.test.js` asserts there are exactly FOUR palette blocks**, that `--terra` / `--contra` /
  `--red` are three distinct colours in each, and that the danger chip clears 4.5:1 in all four. **Add no
  fifth block and edit no colour.** The toggle needs neither — the CSS side is already complete.
- **The `--terra` allowlist.** Terracotta means the product's identity, or THE answer. **A theme toggle is
  neither**, so it is styled from `--band`/`--line`/`--muted` like every other neutral control. The same
  guard already rejected a terracotta `:focus-visible` ring, which was **deleted rather than allowlisted**;
  this control is in that category, not in `.cause.sel`'s.
- **The guard scans the stylesheet as TEXT, comments included.** The `.theme-btn` comment must not write
  the token in `var()` form — name the colour in prose, exactly as the worked-examples CSS comment does.

## Testing

`test/theme.test.js` — standalone node script with a local `ok(label, cond)` helper, no framework,
registered in the `test` script in `package.json`.

1. **Storage round trip** — each of the three values survives write→read; a missing key reads `system`;
   garbage (`"blue"`, `""`, `null`) reads `system`; a store whose getter *and* setter throw neither throws
   nor yields anything but `system`.
2. **The cycle closes** — three `nextTheme` steps from each of the three states return to that state;
   every output is in `THEMES`, including from an unrecognised input.
3. **The resolve matrix** — `system` follows `prefersDark` in both directions; `light` resolves light and
   `dark` resolves dark **regardless of `prefersDark`**, which is the whole point of an explicit override.
4. **`applyTheme` removes the attribute for `system`** and sets it for the other two, asserted against a
   fake root object.
5. **The duplicated-string guard** — `THEME_STORAGE_KEY`'s literal appears in `index.html`, and the inline
   script assigns `data-theme` / `dataset.theme`.
6. **Naming** — the key matches `/^nl_[a-z_]+_v\d+$/`, so it stays in the family.

Browser verification before merge: both explicit themes and `system` in each OS setting, the favicon
changing on toggle, the choice surviving a reload, and no flash on a cold load with an override stored.

## Out of scope

- **Any change to the palettes.** This spec adds a way to choose between palettes that already exist.
- **A theme choice inside the case URL** — see decision 5.
- **Per-mode themes** (a dark Code-stroke worksheet for a night shift, say). One app, one preference.

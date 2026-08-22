# Contrast: re-space the neutral ramp, fix two inverted tokens

**Status: specified 2026-08-22.** Branch `fix/contrast-audit`, off `main`. Touches `app/index.html`
(palette values + two rules), one line of `app/app.js`, and adds `test/contrast.test.js`.

## How this was found

Measuring dark mode during the theme-toggle work (`2026-08-22-theme-toggle-design.md`). The failures are
**pre-existing** — dark has been reachable via `prefers-color-scheme` since the 2026-08-16 brand pass, and
light is the worse of the two. Nothing here is caused by the toggle.

**The first two audit passes produced wrong numbers and the corrections matter more than the originals:**

1. A `color(srgb 0.949 0.925 0.886 / 0.92)` backdrop was parsed with a `[\d.]+` match that read 0–1 floats
   as 0–255, inventing a near-black background and a fake 1.23:1 failure on the safety bar.
2. Reading `getComputedStyle` right after flipping `data-theme` returns **mid-transition** values
   (`.drow{transition:background .12s}`). Worse, the automation pane was throttled, so the transition
   **froze** and never advanced — three "failures" were the previous theme's colours, stable for over a
   second. Disabling transitions resolved them correctly.
3. Colour emoji (📌, ⚑) report a computed `color` that says nothing about what is painted.

**The lesson, and it is the reusable one: a contrast audit driven through a live browser measures the
renderer's transient state, not the design.** The invariant below therefore reads the **stylesheet tokens**,
not the DOM — the same choice `test/brand.test.js` already made for the danger chip.

## What is actually wrong

Corrected audit, transitions disabled, emoji excluded, on a loaded Wallenberg case:

| theme | failing text nodes | distinct root causes |
|---|---|---|
| dark | 76 | 2 |
| light | 82 | 3 |

### 1. `--navy` used as a BACKGROUND (severe, dark only)

```css
.sides button.on{background:var(--navy);color:#fff;border-color:transparent;}
```

`--navy` is a **foreground** token: `#16283f` in light, but `#dbe4f1` in dark. White on `#dbe4f1` is
**1.28:1** — the selected L/R side chip is effectively invisible in dark mode, on the control that sets
**laterality**, which this project calls "the crux".

**This is the exact inverse of a bug CLAUDE.md already records** from the brand pass: *"the filled danger
chip took its text from `--paper` — near-white in light but dark navy in dark"*. That one was fixed by
inventing `--on-danger`. The same class of error survived in the other direction because no test looked.

**Fix: `background:var(--sel-bg); color:var(--ink)`, keeping a `--navy-2` border so it still reads as a
deliberate state.** `--sel-bg` already exists as "the selected surface, in both themes" (it is what
`.cause.sel` uses), so this is reuse, not a new token: 12.87:1 light, 11.03:1 dark. **No new token is
added** — inventing a "strong fill" pair would be a fourth thing meaning *selected*.

### 2. The neutral ramp is too tight (both themes, ~90% of all failures)

`--faint` fails everywhere it is used: **3.36:1 light, 4.00:1 dark** against `--paper`, and worse against
`--band`. It carries the section counts, the micro-captions, the set-aside summaries — 10px text, which is
where a tired reader suffers most.

**Raising `--faint` alone was rejected**: at 4.5:1 it lands within 0.03 of `--muted` in light (5.26 vs
5.29), erasing a tier of the ink → muted → faint hierarchy the 2026-08-16 clarity pass deliberately built.
So **both** neutrals move, and the ramp keeps three visibly separate steps.

Every value below clears 4.5:1 against the **worst** of its four surfaces (`--paper`, `--cream`, `--band`,
`--sel-bg`), not merely against `--paper`:

| | token | from | to | worst-surface ratio |
|---|---|---|---|---|
| light | `--muted` | `#5d6c7e` | `#455263` | 4.57 → **6.77** |
| light | `--faint` | `#8d8b84` | `#6d6b64` | 2.90 → **4.54** |
| light | `--ipsi` | `#3f8f6f` | `#287858` | 3.33 → **4.56** |
| dark | `--muted` | `#96a3b5` | `#a3afc0` | 5.06 → **5.83** |
| dark | `--faint` | `#6f819c` | `#8b9cb5` | 3.27 → **4.64** |
| dark | `--ipsi` | `#63b892` | unchanged | 5.43 ✓ |

Resulting separation on `--paper` — three distinct tiers in both themes:

```
light   ink 14.68  ·  muted 7.84  ·  faint 5.26
dark    ink 13.50  ·  muted 7.14  ·  faint 5.68
```

### 3. An inline `--terra` that bypasses the allowlist (light)

`app/app.js:656` emits `<span style="color:var(--terra)">…</span>`. **`test/brand.test.js` scans only the
stylesheet**, slicing `<style>`→`</style>`, so an inline style in a JS template walks straight past the
allowlist whose entire purpose is that terracotta cannot creep back unjustified. It is also the one
remaining light failure: terracotta on paper at 13px bold is **3.40:1**.

`--terra` **cannot** be changed — `brand.test.js` pins both hexes by exact match, and the owner chose them.
So the span drops the colour and takes `--ink`; the row already names the site, and the `.out-head` rule
still carries terracotta as the answer's marker. **Terracotta is not usable as small text at AA in light**,
which is worth stating once: it is a 3:1 large-text colour, correct on the wordmark (18–22px) and as a
border, wrong at 13px.

## The invariant

`test/contrast.test.js` — standalone node script, local `ok()`, registered in `package.json`.

It parses the four palette blocks out of `app/index.html` **as text** and asserts a declared table of
(foreground, background, minimum) triples in **every** block. It never opens a browser, so it cannot be
fooled by transitions, throttling or emoji.

- Every neutral (`--ink`, `--muted`, `--faint`) clears **4.5:1** on every surface (`--paper`, `--cream`,
  `--band`, `--sel-bg`).
- Every semantic text colour (`--ipsi`, `--contra`, `--bilat`, `--none`, `--gold`, `--red`, `--mimic`,
  `--iatro`) clears 4.5:1 on `--paper` and `--band`.
- The ramp keeps **visible separation**: `ink > muted > faint` by a stated margin, so a future "fix" cannot
  satisfy contrast by collapsing the hierarchy — the failure mode this spec exists to avoid.
- **Known exceptions are declared in a table with a reason, never silent.** `--terra` is listed as
  large-text-only (3:1, wordmark and borders), which is what makes the app.js change permanent rather than
  a thing someone re-adds.

A second, cheap guard closes the hole found above: **no `app/*.js` file may emit `color:var(--terra)` in an
inline style.** One regex, and it fails today.

## Out of scope

- **Any change to `--terra`, `--red`, `--contra`, or the four-block structure.** `brand.test.js` pins them
  and the owner approved them.
- The `*-bg` pair tokens (`--ipsi-bg` etc.) — they are backgrounds behind their own foregrounds and were
  not implicated.
- Non-text contrast (borders, the 4px `.dbar`). WCAG 1.4.11 is a separate pass.

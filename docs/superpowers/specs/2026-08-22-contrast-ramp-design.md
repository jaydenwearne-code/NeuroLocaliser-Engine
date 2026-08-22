# Contrast: re-space the neutral ramp, fix two inverted tokens

**Status: IMPLEMENTED 2026-08-22.** Branch `fix/contrast-audit`, off `main`, **not merged**.
Measured result: **76 dark / 82 light failing text nodes -> 0 / 0**, across all three modes with
every disclosure expanded. 6519 assertions green. Touches `app/index.html`
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


## What implementation changed from this spec

The spec planned two root causes. Building it found **five**, four of them by the new invariant rather
than by looking:

1. **The inverted-fill bug was in THREE places, not one.** `.sides button.on`, `.site-btn.on` (Atlas) and
   `.sc.on` all painted a foreground token as a background under a literal `color:#fff`. Only the first was
   known. All three now use `--sel-bg` + `--ink`.
2. **`.cs-lvo.pos` — the LVO-positive badge in Code-stroke — was white on `--contra`, 2.13:1 in dark.**
   `--contra` inverts (`#c85a3d` -> `#e8a184`), so it cannot carry a filled chip. It now uses
   `--red`/`--on-danger`, the palette's one pairing that stays readable filled in both themes, which also
   keeps the FORM rule CLAUDE.md sets out (filled = time-critical). **This changes the appearance of a
   code-stroke element and is flagged for the owner** — it is presentation, not clinical content.
3. **`.gate-err` used `--red` as TEXT** (3.28:1 in dark). `--red` must stay saturated for the filled danger
   chip that `test/brand.test.js` guards against white, so the two demands are irreconcilable on one token.
   The rule moved to `--contra`; `--red` is now declared NOT-TEXT.
4. **`.report-btn` declared no `background`.** Used on an `<a>` in the results header (fine) and on a
   `<button>` in code-stroke, where it inherited Chrome's UA `buttonface` — light even in dark mode, giving
   **1.84:1** on the Copy button. **A token-level test structurally cannot see a UA default**, which is the
   honest limit of this invariant and is written at the rule.

### The blunt rule that was wrong

Section 5 first asserted *"no foreground token may be used as a background"*. It flagged `.gate-go`, which
pairs `background:var(--navy)` with `color:var(--paper)` — **both invert together**, so the button simply
reverses and stays at ~11:1. The invariant is the **pair**, not the token: for every rule setting both a
background and a colour, that pair must clear 4.5:1 in all four blocks. Stated as a token rule it would
have forced a pointless change to a button nobody could not read.

### Scope narrowed on evidence

Asserting every colour against every surface demanded contrast for pairs the app never paints, and the way
to satisfy such a test is to repaint a palette nobody was struggling with. The semantic colours are held to
the surfaces their own rules put them on (`paper`/`cream`/`band`), and **`--mimic` and `--iatro` were found
to be DEAD** — defined in all four blocks, referenced nowhere in CSS or JS. CLAUDE.md's claim that the
mimic category has "its own `--mimic` CSS token" is stale. Wiring them up or deleting them is separate work.

### Final values

| theme | token | from | to |
|---|---|---|---|
| light | `--muted` | `#5d6c7e` | `#4a5768` |
| light | `--faint` | `#8d8b84` | `#6b6a64` |
| light | `--ipsi` | `#3f8f6f` | `#34755b` |
| light | `--contra` | `#c85a3d` | `#ac4d34` |
| light | `--bilat` | `#6b5bd0` | `#6959cc` |
| light | `--none` | `#6a7890` | `#5e6b80` |
| light | `--gold` | `#8a6a2f` | `#84662d` |
| dark | `--muted` | `#96a3b5` | `#a8b3c4` |
| dark | `--faint` | `#6f819c` | `#8d9bb1` |

`--ink`, `--navy`, `--navy-2`, `--terra`, `--red` and every `*-bg` are **unchanged**. The ramp keeps three
separate tiers: light 14.68 / 7.25 / 5.35, dark 13.50 / 7.48 / 5.63.

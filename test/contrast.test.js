// contrast.test.js — the palette must be READABLE, in all four blocks.
//
// WHY THIS READS TEXT AND NEVER A BROWSER. This suite exists because a live-DOM contrast audit was run
// first and produced wrong answers three separate ways: a `color(srgb 0.94 0.92 0.88 / .92)` backdrop
// parsed as 0..255 invented a near-black background; `getComputedStyle` immediately after flipping
// data-theme returns MID-TRANSITION values, and in a throttled tab the transition FREEZES, so stale
// colours read as stable truth for over a second; and colour emoji report a `color` that says nothing
// about what is painted. A browser measures the renderer's transient state. The DESIGN is in the tokens,
// so that is what gets asserted — the same choice test/brand.test.js already made for the danger chip.
//
// WHAT IT PROTECTS. Before this, 76 text nodes failed AA in dark and 82 in light, and the palette had
// already been through a dedicated brand pass — because that pass only ever checked ONE pair (the danger
// chip). A ramp-wide invariant is what stops the next palette edit quietly undoing this one.
import { readFileSync } from "node:fs";

let pass = 0, fail = 0;
const log = [];
const ok = (label, cond, detail) => { log.push({ label, ok: !!cond, detail }); cond ? pass++ : fail++; };

const CSS = readFileSync(new URL("../app/index.html", import.meta.url), "utf8");

// The same four-block split brand.test.js uses, so the two suites cannot disagree about what a block is.
const blocks = CSS.split(/(?=:root|@media \(prefers-color-scheme:dark\))/).filter(b => /--terra:/.test(b));
const BLOCK_NAMES = [":root (light)", "@media prefers-dark", '[data-theme="light"]', '[data-theme="dark"]'];
ok("all four palette blocks are found", blocks.length === 4, String(blocks.length));

// A block may omit a token and inherit it from :root — resolve against the first block as the base.
const rawToken = (block, name) => {
  const m = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})`).exec(block);
  return m && m[1].toLowerCase();
};
const tokenIn = (i, name) => rawToken(blocks[i], name) || rawToken(blocks[0], name);

const lum = hex => {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    .map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// Every surface a foreground can land on. --sel-bg belongs here: it is a real surface (the selected
// pathology row, and now the selected side toggle), and leaving it out understates the worst case.
const SURFACES = ["paper", "cream", "band", "sel-bg"];

// --- 1: the neutral ramp clears AA on every surface -----------------------------------------------
// These carry ordinary reading text down to 10px, so 4.5:1 is the bar, not 3:1.
for (const [i, name] of BLOCK_NAMES.entries()) {
  for (const fg of ["ink", "muted", "faint"]) {
    const c = tokenIn(i, fg);
    if (!c) { ok(`${name}: defines --${fg}`, false); continue; }
    let worst = Infinity, worstOn = "";
    for (const s of SURFACES) {
      const bg = tokenIn(i, s);
      if (!bg) continue;
      const r = ratio(c, bg);
      if (r < worst) { worst = r; worstOn = s; }
    }
    ok(`${name}: --${fg} clears 4.5:1 on every surface (worst ${worst.toFixed(2)} on --${worstOn})`,
       worst >= 4.5, c);
  }
}

// --- 2: the ramp keeps three VISIBLY separate tiers ------------------------------------------------
// The failure mode this guards is subtle and was nearly shipped: raising --faint to 4.5:1 on its own puts
// it within 0.03 of --muted in light, which satisfies contrast by DELETING a tier of the hierarchy the
// 2026-08-16 clarity pass built. Contrast and hierarchy have to hold together or neither is real.
const SEPARATION = 1.15; // each tier at least 15% more contrast than the next-fainter one
for (const [i, name] of BLOCK_NAMES.entries()) {
  const paper = tokenIn(i, "paper");
  const [ink, muted, faint] = ["ink", "muted", "faint"].map(t => tokenIn(i, t));
  if (!paper || !ink || !muted || !faint) { ok(`${name}: ramp tokens present`, false); continue; }
  const [ri, rm, rf] = [ink, muted, faint].map(c => ratio(c, paper));
  ok(`${name}: ink is clearly stronger than muted (${ri.toFixed(2)} vs ${rm.toFixed(2)})`,
     ri >= rm * SEPARATION, `${ink} / ${muted}`);
  ok(`${name}: muted is clearly stronger than faint (${rm.toFixed(2)} vs ${rf.toFixed(2)})`,
     rm >= rf * SEPARATION, `${muted} / ${faint}`);
}

// --- 3: the semantic text colours clear AA ---------------------------------------------------------
// These name laterality and urgency, so they are read, not decorative.
// SCOPED TO WHAT THE APP ACTUALLY PAINTS, not the full cross-product. Asserting every colour against
// every surface would demand contrast for pairs that never render, and the way you satisfy a test like
// that is by repainting a palette nobody was struggling to read. These five are the laterality/urgency
// badges (.bi/.bc/.bb/.bnone/.warn), which sit on cards and on the banded differential rows.
for (const [i, name] of BLOCK_NAMES.entries()) {
  for (const fg of ["ipsi", "contra", "bilat", "none", "gold"]) {
    const c = tokenIn(i, fg);
    if (!c) continue;
    let worst = Infinity, worstOn = "";
    for (const s of ["paper", "cream", "band"]) {
      const bg = tokenIn(i, s);
      if (!bg) continue;
      const r = ratio(c, bg);
      if (r < worst) { worst = r; worstOn = s; }
    }
    ok(`${name}: --${fg} clears 4.5:1 as text (worst ${worst.toFixed(2)} on --${worstOn})`, worst >= 4.5, c);
  }
}

// --- 4: DECLARED exceptions, never silent ----------------------------------------------------------
// An exception with a written reason is a decision; an unchecked colour is an accident. --terra is the
// only one, and stating it here is what keeps app.js from re-adding terracotta as small text.
// NOT_TEXT: defined in the palette but never used as a text colour, so a text-contrast bar does not
// apply. Stating them is the point — an unlisted token is an oversight, a listed one is a decision.
const NOT_TEXT = {
  red:   "filled chips only (.urg-emergency, .flag) — its readability is the --red/--on-danger pairing, "
       + "which test/brand.test.js already guards at 4.5:1. It must stay SATURATED for that, so it can "
       + "never also clear 4.5:1 as text on a dark card. .gate-err used to do exactly that (3.28:1 in "
       + "dark) and now uses --contra.",
  mimic: "DEAD TOKEN: defined in all four palette blocks and referenced nowhere in app/*.css or app/*.js. "
       + "CLAUDE.md claims the mimic category has 'its own --mimic CSS token'; the token exists, nothing "
       + "uses it. Wiring it up or deleting it is separate work.",
  iatro: "DEAD TOKEN: same as --mimic — defined four times, never referenced.",
};
for (const [tok, why] of Object.entries(NOT_TEXT)) {
  ok(`--${tok} is declared NOT-TEXT with a stated reason`, why.length > 40, why.slice(0, 56));
}

const EXCEPTIONS = [
  { token: "terra", min: 3.0,
    why: "large text only (18-22px wordmark) and borders. At 13px bold on paper it is 3.40:1 — under AA — "
       + "which is why app.js no longer colours the site-name span with it. --terra is PINNED by "
       + "test/brand.test.js, so this can never be fixed by moving the token." },
];
for (const ex of EXCEPTIONS) {
  ok(`--${ex.token} is a DECLARED exception with a stated reason`, ex.why.length > 40, ex.why.slice(0, 60));
  for (const [i, name] of BLOCK_NAMES.entries()) {
    const c = tokenIn(i, ex.token), bg = tokenIn(i, "paper");
    if (!c || !bg) continue;
    const r = ratio(c, bg);
    ok(`${name}: --${ex.token} still clears its reduced ${ex.min}:1 bar (${r.toFixed(2)})`, r >= ex.min, c);
  }
}

// --- 5: every FILLED element must be readable in all four blocks -------------------------------
// The bug this catches was live, severe, and in THREE places: `.sides button.on`, `.site-btn.on` and
// `.sc.on` all painted `background:var(--navy)` (or --navy-2) with a literal `color:#fff`. --navy is a
// FOREGROUND token that inverts between themes (#16283f -> #dbe4f1), so in dark those chips were white on
// pale blue — 1.28:1, invisible — on the control that sets LATERALITY, which this project calls the crux.
// It is the exact inverse of the danger-chip bug the 2026-08-16 brand pass fixed by inventing
// --on-danger, and it survived because nothing checked the pair.
//
// The test is the PAIR, not the token. A blunt "never use a foreground token as a background" rule was
// tried first and wrongly flagged `.gate-go`, which pairs background:var(--navy) with color:var(--paper)
// — BOTH invert, so the button simply reverses and stays at ~11:1. What matters is whether the fill and
// its own text are readable together in every block.
{
  const style = CSS.slice(CSS.indexOf("<style>"), CSS.indexOf("</style>"));
  const colourOf = (i, raw) => {
    const v = raw.trim();
    const m = /^var\(--([a-z0-9-]+)\)$/i.exec(v);
    if (m) return tokenIn(i, m[1]);
    if (/^#[0-9a-fA-F]{6}$/.test(v)) return v.toLowerCase();
    if (/^#[0-9a-fA-F]{3}$/.test(v)) return "#" + v.slice(1).split("").map(c => c + c).join("").toLowerCase();
    return null;                       // rgba()/transparent/currentColor — not a flat fill, skip
  };
  const fills = [];
  for (const chunk of style.split("}")) {
    const bi = chunk.indexOf("{");
    if (bi < 0) continue;
    const sel = chunk.slice(0, bi).split("\n").pop().trim();
    const decls = chunk.slice(bi + 1);
    const bg = /background(?:-color)?:\s*([^;]+)/.exec(decls);
    const fg = /(?:^|[;{\s])color:\s*([^;]+)/.exec(decls);
    if (bg && fg) fills.push({ sel, bg: bg[1], fg: fg[1] });
  }
  ok("found filled elements to check", fills.length > 0, `${fills.length} rules set both background and color`);
  const bad = [];
  for (const [i, name] of BLOCK_NAMES.entries()) {
    for (const f of fills) {
      const bg = colourOf(i, f.bg), fg = colourOf(i, f.fg);
      if (!bg || !fg) continue;
      const r = ratio(fg, bg);
      if (r < 4.5) bad.push(`${name}: ${f.sel} ${fg} on ${bg} = ${r.toFixed(2)}`);
    }
  }
  ok("every filled element's own text clears 4.5:1 in all four blocks", bad.length === 0,
     bad.slice(0, 5).join(" | "));
}

// --- 6: the allowlist cannot be bypassed from JS ---------------------------------------------------
// test/brand.test.js scans the STYLESHEET only, slicing <style> to </style>. An inline style in a JS
// template walks straight past the allowlist whose whole purpose is that terracotta cannot creep back
// unjustified. app/app.js:656 did exactly that, and it was also a contrast failure.
{
  const jsFiles = ["app.js", "code-stroke.js", "neuraxis-diagram.js", "labels.js", "examples.js"];
  const bad = [];
  for (const f of jsFiles) {
    let src; try { src = readFileSync(new URL(`../app/${f}`, import.meta.url), "utf8"); } catch { continue; }
    // A style="" attribute (or a style.color assignment) that paints text terracotta.
    if (/style\s*=\s*["'][^"']*color\s*:\s*var\(--terra\)/.test(src)) bad.push(f);
    if (/style\.color\s*=\s*["'`][^"'`]*--terra/.test(src)) bad.push(f);
  }
  ok("no app/*.js paints text with the brand accent inline (it would bypass the allowlist)",
     bad.length === 0, bad.join(", "));
}

console.log("\nNeuroLocaliser — CONTRAST\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}${r.detail ? "  → " + r.detail : ""}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);

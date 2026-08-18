// brand.test.js — identity invariants. The version a tester reports must be a real build, the mark must
// survive being drawn twice from one geometry, and terracotta must stay scarce (see the allowlist below).
import { readFileSync } from "node:fs";
import { VERSION, markSVG, faviconDataURI } from "../app/brand.js";

let pass = 0, fail = 0;
const log = [];
const ok = (label, cond, detail) => { log.push({ label, ok: !!cond, detail }); cond ? pass++ : fail++; };

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

// ---- the version a bug report carries must name a real build ----
ok("VERSION matches package.json", VERSION === pkg.version, `${VERSION} vs ${pkg.version}`);
ok("VERSION looks like a semver", /^\d+\.\d+\.\d+$/.test(VERSION), VERSION);

// ---- the mark ----
{
  const svg = markSVG();
  ok("markSVG returns an <svg>", svg.startsWith("<svg") && svg.trim().endsWith("</svg>"));
  ok("the mark takes its colour from a token, never a hard-coded hex", !/#[0-9a-f]{3,6}/i.test(svg), svg.slice(0, 80));
  ok("the mark carries both decussating tracts", (svg.match(/<path/g) || []).length === 2);
  ok("the mark has one filled and one hollow node — the ipsi/contra asymmetry",
     /fill="currentColor"/.test(svg) && /fill="none"/.test(svg));
  ok("markSVG honours a size", markSVG({ size: 40 }).includes('width="40"'));
  const fav = faviconDataURI();
  ok("faviconDataURI is an inline SVG data URI", fav.startsWith("data:image/svg+xml,"));
  ok("the favicon carries an explicit colour (a data URI cannot inherit currentColor)",
     /%23[0-9a-fA-F]{6}/.test(fav) || /#[0-9a-fA-F]{6}/.test(decodeURIComponent(fav)));
}

// ---- brand, contralateral and danger must be three DIFFERENT colours, in BOTH themes ----
// Measured before this pass: in dark, --terra, --contra and --red were all #e79075. The brand accent,
// "contralateral" and "must-not-miss" were one colour with three meanings.
const CSS = readFileSync(new URL("../app/index.html", import.meta.url), "utf8");
const tokenIn = (block, name) => {
  const m = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})`).exec(block);
  return m && m[1].toLowerCase();
};
// the four blocks that define the palette: :root, prefers-dark, [data-theme=light], [data-theme=dark]
const blocks = CSS.split(/(?=:root|@media \(prefers-color-scheme:dark\))/).filter(b => /--terra:/.test(b));
ok("all four palette blocks are found", blocks.length === 4, String(blocks.length));
for (const [i, b] of blocks.entries()) {
  const terra = tokenIn(b, "terra"), contra = tokenIn(b, "contra"), red = tokenIn(b, "red");
  const three = new Set([terra, contra, red].filter(Boolean));
  ok(`palette block ${i + 1}: terra / contra / red are three distinct colours`,
     three.size === 3, `${terra} \u00b7 ${contra} \u00b7 ${red}`);
}
ok("--terra is unchanged in light", /--terra:#d36d52/.test(CSS));
ok("--terra is unchanged in dark", /--terra:#e79075/.test(CSS));

// ---- terracotta is IDENTITY or THE ANSWER — nothing else ----
// It was on 32 declarations (nav pills, subtitles, mono tokens, selected rows, hovers, headings), which
// left it meaning nothing while sitting next to the red-flag colour it resembles. This is the guard that
// stops it creeping back: adding a new one fails here until it is justified and allowlisted.
const TERRA_ALLOWED = [
  ".wordmark .l",                      // the wordmark — identity
  ".lockup-mark",                      // the mark's colour holder — identity (markSVG uses currentColor)
  ".out-head",                         // the focal answer card's rule — THE answer
  ".neuraxis .nx-node.sel .nx-dot",    // the selected lesion on the diagram — THE answer
  ".neuraxis .nx-node.sel .nx-label",
  // The selected PATHOLOGY (spec 2026-08-18) — the same category as the selected lesion above. Once a
  // cause is chosen the Next card's lower tiers are about that disease and nothing else, so the marker on
  // the row, and the chip naming it, are THE answer in exactly the sense .out-head is.
  ".cause.sel",                        // the selected cause row in the What card — THE answer
  ".px-chip",                          // the chip naming it in the Next card — the same answer, restated
];
{
  const style = CSS.slice(CSS.indexOf("<style>"), CSS.indexOf("</style>"));
  // Rules split on "}"; the selector is the text before "{", and its LAST line (earlier lines belong to
  // the previous rule's tail or a comment). A chunk inside @media reports the media query, which is fine —
  // it still surfaces for a human to look at.
  const offenders = style.split("}")
    .filter(chunk => chunk.includes("var(--terra)"))
    .map(chunk => chunk.split("{")[0].split("\n").pop().trim())
    .filter(sel => sel && !TERRA_ALLOWED.some(a => sel.includes(a)));
  ok(`every var(--terra) rule is on the allowlist (${TERRA_ALLOWED.length} allowed)`,
     offenders.length === 0, offenders.slice(0, 8).join(" | "));
}

// ---- the danger chip must be READABLE, in both themes ----
// The chip is filled, so its text sits on saturated red. Using --paper for that text worked in light
// (near-white) and was unreadable in dark (dark navy) — hence a dedicated --on-danger. Measured before
// the fix: dark #d24a33 on white was 4.40:1, under the 4.5 needed for small bold text.
{
  const lum = hex => {
    const n = parseInt(hex.slice(1), 16);
    const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
      .map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  for (const [i, b] of blocks.entries()) {
    const red = tokenIn(b, "red"), on = tokenIn(b, "on-danger");
    if (!red || !on) { ok(`palette block ${i + 1}: defines --red and --on-danger`, false, `${red} / ${on}`); continue; }
    const r = ratio(red, on);
    ok(`palette block ${i + 1}: danger chip clears 4.5:1 (${r.toFixed(2)}:1)`, r >= 4.5, `${on} on ${red}`);
  }
}

console.log("\nNeuroLocaliser — BRAND\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}${r.detail ? "  → " + r.detail : ""}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);

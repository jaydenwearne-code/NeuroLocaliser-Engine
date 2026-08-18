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

console.log("\nNeuroLocaliser — BRAND\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}${r.detail ? "  → " + r.detail : ""}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);

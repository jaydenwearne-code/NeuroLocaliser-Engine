// combined-sites.test.js — combinedSites() is a pure, DOM-free resolver (testable in node): the user's
// pinned pair when there is one still live, else the engine's own minimal cover. The one behaviour that
// matters most: a pin that has fallen out of the current candidate list must NOT be reported as "pinned".
import { combinedSites } from "../app/combined-sites.js";
import { readFileSync } from "node:fs";

let pass = 0, fail = 0;
const ok = (l, c) => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l); };

const siteA = { id: "site_a" };
const siteB = { id: "site_b" };
const siteC = { id: "site_c" };
const list = [{ site: siteA, n: 3 }, { site: siteB, n: 2 }, { site: siteC, n: 1 }];

// ---- nothing pinned: falls back to the engine's minimal cover ----
{
  const r = { multi: { sites: [siteA, siteB], uncovered: [] } };
  const res = combinedSites(r, list, new Set());
  ok("no pins -> source is the engine's cover", res.source === "cover");
  ok("no pins -> sites are the engine's minimal-cover sites", res.sites === r.multi.sites);
}

// ---- a pinned pair still present in the candidate list wins over the cover ----
{
  const r = { multi: { sites: [siteA, siteC], uncovered: [] } };
  const res = combinedSites(r, list, new Set(["site_a", "site_b"]));
  ok("two valid pins -> source is pinned", res.source === "pinned");
  ok("two valid pins -> sites are the pinned pair (from list, not r.multi)",
     res.sites.length === 2 && res.sites.includes(siteA) && res.sites.includes(siteB));
}

// ---- a pinned pair that is NO LONGER in the candidate list must not come back labelled "pinned" ----
{
  const r = { multi: { sites: [siteA, siteB], uncovered: [] } };
  const staleList = [{ site: siteA, n: 3 }]; // site_c has dropped out of the current differential
  const res = combinedSites(r, staleList, new Set(["site_a", "site_c"]));
  ok("a pin no longer in the candidate list does not resolve to source:pinned", res.source !== "pinned");
  ok("it falls back to the engine's cover instead", res.source === "cover" && res.sites === r.multi.sites);
}

// ---- only one valid pin present: not enough for a pair, falls back to cover ----
{
  const r = { multi: { sites: [siteA, siteB], uncovered: [] } };
  const res = combinedSites(r, list, new Set(["site_a"]));
  ok("a single pin is not a pair -> falls back to cover", res.source === "cover");
}

// ---- neither pins nor a cover: nothing to show ----
{
  const res = combinedSites({ multi: null }, list, new Set());
  ok("no pins and no cover -> source is null", res.source === null);
  ok("no pins and no cover -> sites is empty", res.sites.length === 0);
}

// Strip `//` line comments and `/* */` block comments from a source string before the call-site regex below
// scans it, so a comment that happens to contain something call-shaped (e.g. an old two-argument example, or
// a literal ")") can't be mistaken for a real call site. Tracks string literals (', ", `) char-by-char —
// including escaped quotes — so a `//` or `/*` inside a string is left alone rather than treated as a comment
// start.
// REMAINING LIMITATION: this is not a real JS parser. A `)` inside a call's own THIRD argument (e.g. a
// function-expression argument containing an unbalanced paren, or a regex literal containing `/*`) can still
// confuse the arity count below, because the call-site match itself is a non-nesting regex, not a parser. Keep
// this test's job narrow (arity of textually-simple calls) rather than reaching for a real parser here.
function stripComments(src) {
  let out = "";
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i], c2 = src[i + 1];
    if (c === "'" || c === '"' || c === "`") {
      const quote = c;
      out += c; i++;
      while (i < n && src[i] !== quote) {
        if (src[i] === "\\") { out += src[i] + (src[i + 1] ?? ""); i += 2; continue; }
        out += src[i]; i++;
      }
      out += src[i] ?? ""; i++;
      continue;
    }
    if (c === "/" && c2 === "/") {
      while (i < n && src[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && c2 === "*") {
      i += 2;
      while (i < n && !(src[i] === "*" && src[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    out += c; i++;
  }
  return out;
}

// ---- EVERY call site must pass the pinned Set ----
// combinedSites(r, list, pinned) silently falls back to the engine's cover when `pinned` is omitted. That is
// correct behaviour for the argument, but a CALLER that forgets it makes the Together card show the user's
// pinned pair while the What / Next cards show the engine's — two cards describing DIFFERENT sites on the
// same screen, with nothing to signal it. That shipped once (whatCard and nextCard both omitted it) and is
// invisible to any test that calls the function directly, so the guard has to be over the call sites.
{
  const raw = readFileSync(new URL("../app/app.js", import.meta.url), "utf8");
  const src = stripComments(raw);
  const calls = [...src.matchAll(/combinedSites\(([^)]*)\)/g)].map(m => m[1]);
  const arity = calls.map(a => a.split(",").length);
  ok(`every combinedSites() call site passes 3 args (found ${arity.join("/")})`,
     calls.length >= 3 && arity.every(n => n === 3),
     calls.map((c, i) => `${arity[i]}: ${c}`).join(" | "));
}

console.log("\nNeuroLocaliser — combinedSites() (Task 12 support)\n" + "=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);

// combined-sites.test.js — combinedSites() is a pure, DOM-free resolver (testable in node): the user's
// pinned pair when there is one still live, else the engine's own minimal cover. The one behaviour that
// matters most: a pin that has fallen out of the current candidate list must NOT be reported as "pinned".
import { combinedSites } from "../app/combined-sites.js";

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

console.log("\nNeuroLocaliser — combinedSites() (Task 12 support)\n" + "=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);

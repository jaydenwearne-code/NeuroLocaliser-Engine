// examples.test.js — the worked examples must keep TEACHING WHAT THEY CLAIM. This is not ceremony: the
// first hand-typed token sets were wrong (Wallenberg resolved to Marie-Foix explaining 2 of 5), and the
// anatomy/causes tables are actively edited. A worked example that silently teaches the wrong thing is
// worse than none, so every assertion here is about BEHAVIOUR — candidate counts, urgency, cover size —
// not merely that the tokens parse.
import { EXAMPLES } from "../app/examples.js";
import { FINDINGS } from "../src/model/findings.js";
import { solve } from "../src/engine/inverse.js";
import { nextStepsFor } from "../src/data/nextSteps.js";
import { combinedSites } from "../app/combined-sites.js";

let pass = 0, fail = 0;
const log = [];
const ok = (label, cond, detail) => { log.push({ label, ok: !!cond, detail }); cond ? pass++ : fail++; };
const byId = id => EXAMPLES.find(e => e.id === id);
const run = ex => solve(new Set(ex.tokens), { dominantSide: "left" });

// ---- shape ----
ok("there are four examples", EXAMPLES.length === 4, String(EXAMPLES.length));
ok("every example has an id, a label and a teaches line",
   EXAMPLES.every(e => e.id && e.label && e.teaches));
ok("example ids are unique", new Set(EXAMPLES.map(e => e.id)).size === EXAMPLES.length);
{
  const bad = [];
  for (const e of EXAMPLES) for (const t of e.tokens) {
    const [f, side] = t.split("@");
    if (!f || !side) { bad.push(`${e.id}: malformed ${t}`); continue; }
    if (!Object.prototype.hasOwnProperty.call(FINDINGS, f)) bad.push(`${e.id}: unknown finding ${f}`);
  }
  ok("every token is a real finding, correctly formed as finding@side", !bad.length, bad.slice(0, 5).join(" | "));
}

// ---- WHERE: an eponym emerges from anatomy ----
{
  const ex = byId("wallenberg"); const r = run(ex); const top = r.display[0];
  ok("wallenberg resolves to the lateral medulla", /medulla/.test(top.site.level) && top.site.part === "lateral",
     `${top.site.level}|${top.site.part}`);
  ok("wallenberg explains every finding entered", top.n === ex.tokens.length, `${top.n}/${ex.tokens.length}`);
}

// ---- THE NARROWING: it must stay genuinely ambiguous, or it stops teaching ----
{
  const ex = byId("footdrop"); const r = run(ex);
  ok("foot drop leaves at least 3 candidates", r.display.length >= 3, String(r.display.length));
  const ids = r.display.map(c => c.site.id);
  ok("foot drop offers BOTH an L5 root and a peroneal nerve — the discrimination it teaches",
     ids.some(i => /root_l5/.test(i)) && ids.some(i => /peroneal/.test(i)), ids.slice(0, 4).join(", "));
  // and adding one discriminator must actually narrow it
  const narrowed = solve(new Set([...ex.tokens, "deep_peroneal_sensory@left"]), { dominantSide: "left" });
  ok("adding a discriminator narrows foot drop to fewer candidates",
     narrowed.display.length < r.display.length, `${r.display.length} -> ${narrowed.display.length}`);
}

// ---- NEXT STEPS: the emergency ----
{
  const ex = byId("cauda"); const r = run(ex); const top = r.display[0];
  ok("cauda equina is an emergency", nextStepsFor(top.site).urgency === "emergency",
     nextStepsFor(top.site).urgency);
  ok("cauda equina explains every finding entered", top.n === ex.tokens.length, `${top.n}/${ex.tokens.length}`);
}

// ---- TOGETHER: the cross-site card must actually render ----
{
  const ex = byId("twolesions"); const r = run(ex);
  const cover = combinedSites(r, r.display, new Set());
  ok("two-lesion example yields a cover of at least 2 sites — so the Together card renders",
     cover.sites.length >= 2, String(cover.sites.length));
}

console.log("\nNeuroLocaliser — WORKED EXAMPLES\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}${r.detail ? "  → " + r.detail : ""}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);

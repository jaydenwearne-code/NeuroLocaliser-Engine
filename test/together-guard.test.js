// together-guard.test.js — togetherGuardState() must never let the Together card claim a multifocal
// picture that does not exist. Regression for final-review Fix A: a clean single-lesion case (one site
// explains every finding) where the user pins two rows anyway used to fall into the "else" branch and
// print "Several findings independently require a second site — no single observation is carrying the
// multifocal claim", which is false — a single lesion IS carrying it.
import { togetherGuardState } from "../app/together-guard.js";

let pass = 0, fail = 0;
const ok = (l, c, d) => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l + (!c && d ? ` (${d})` : "")); };

const collapseSite = { id: "left_medulla_lateral" };

// ---- single lesion explains everything, no forcing findings (forcingFindings()'s own early return) ----
{
  const r = { singleExplainsAll: true };
  const ff = { findings: [] };
  const s = togetherGuardState(r, ff);
  ok("singleExplainsAll -> kind is 'single'", s.kind === "single", s.kind);
}

// ---- genuinely multifocal, one finding is the forcing finding ----
{
  const r = { singleExplainsAll: false };
  const ff = { findings: [{ token: "vertigo@left", collapsesTo: collapseSite }] };
  const s = togetherGuardState(r, ff);
  ok("a forcing finding present -> kind is 'forcing'", s.kind === "forcing", s.kind);
  ok("'forcing' carries the same findings array", s.findings === ff.findings);
}

// ---- genuinely multifocal, no single finding alone forces it ----
{
  const r = { singleExplainsAll: false };
  const ff = { findings: [] };
  const s = togetherGuardState(r, ff);
  ok("multifocal with no forcing finding -> kind is 'several'", s.kind === "several", s.kind);
}

// ---- defensive: singleExplainsAll wins even if ff somehow carries findings (should never happen, since
// forcingFindings() itself returns early with an empty array when singleExplainsAll is true — but the
// guard's own precedence must not depend on that invariant holding elsewhere) ----
{
  const r = { singleExplainsAll: true };
  const ff = { findings: [{ token: "x@left", collapsesTo: null }] };
  const s = togetherGuardState(r, ff);
  ok("singleExplainsAll takes precedence over a stray forcing finding", s.kind === "single", s.kind);
}

console.log("\nNeuroLocaliser — togetherGuardState() (review Fix A)\n" + "=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);

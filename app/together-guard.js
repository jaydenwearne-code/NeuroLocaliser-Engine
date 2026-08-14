// together-guard.js — pure decision logic for the Together card's parsimony guard (which message it shows,
// before anything else on the card). Extracted out of app.js so it is directly testable in plain node:
// app.js touches `document` at module load and calls startGate() as a side effect on import, so it cannot
// be imported under a test runner without a DOM. This module has neither.
//
// Order of preference, and why:
//   1. "single"  — a single lesion already explains every finding (`r.singleExplainsAll`). The Together
//      card can still be showing (source: "pinned" — the user pinned a second site anyway, which the
//      card's own copy invites, "Pin two sites in the list above to test a different pair"), but the
//      picture is NOT actually multifocal. Saying so plainly is required — the alternative ("several
//      findings independently require a second site") would be a false parsimony claim.
//   2. "forcing" — the picture IS multifocal (`!r.singleExplainsAll`), and at least one specific LOCALISING
//      finding is what forces it: dropping that finding collapses everything onto one site. Each forcing
//      finding is named with its own collapse target (see forcingFindings() in src/engine/multifocal.js —
//      different findings can collapse to different sites, so this can never be a single shared field).
//   3. "several" — the picture is multifocal and no single finding alone forces it (the combination does).
//      This is the only state where "no single observation is carrying the multifocal claim" is true.
//
// `r` is a solve() result (must carry `singleExplainsAll`); `ff` is a forcingFindings() result (must carry
// `findings`, an array — empty when singleExplainsAll is true, by forcingFindings()'s own early return).
export function togetherGuardState(r, ff) {
  if (r.singleExplainsAll) return { kind: "single" };
  if (ff.findings && ff.findings.length) return { kind: "forcing", findings: ff.findings };
  return { kind: "several" };
}

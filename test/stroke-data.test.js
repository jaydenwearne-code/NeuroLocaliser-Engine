// stroke-data.test.js — the code-stroke clinical content is pure, cited data (guards integrity, not medicine).
import { NIHSS_ITEMS, THROMBOLYSIS_CRITERIA, THROMBECTOMY_CRITERIA, THROMBECTOMY_CONSIDERATIONS, ACUTE_MGMT, MIMICS, GUIDELINE_CITE } from "../app/stroke-data.js";

let pass = 0, fail = 0;
const ok = (l, c) => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l); };

// NIHSS: 13 array rows (1a/1b/1c split; arm & leg carry side:true → scored L+R = 15 components); max total 42.
ok("NIHSS models the 13 standard rows", NIHSS_ITEMS.length === 13);
ok("every NIHSS item has options with numeric scores", NIHSS_ITEMS.every(i => i.options.length && i.options.every(o => Number.isInteger(o.score))));
const maxTotal = NIHSS_ITEMS.reduce((s, i) => s + Math.max(...i.options.map(o => o.score)) * (i.side ? 2 : 1), 0);
ok(`NIHSS max total is 42, counting arm/leg per side (got ${maxTotal})`, maxTotal === 42);

// every eligibility criterion + reference card carries a citation (the accuracy gate)
const allCited = [...THROMBOLYSIS_CRITERIA, ...THROMBECTOMY_CRITERIA, ...ACUTE_MGMT];
ok("every criterion / reference card has a non-empty cite", allCited.every(x => typeof x.cite === "string" && x.cite.length > 0));
ok("thrombolysis criteria include both inclusion and contraindication kinds", THROMBOLYSIS_CRITERIA.some(c => c.kind === "inclusion") && THROMBOLYSIS_CRITERIA.some(c => c.kind === "contra"));
ok("thrombectomy criteria reference NIHSS / mRS / ASPECTS / window", /nihss|mrs|aspects|window|hour/i.test(THROMBECTOMY_CRITERIA.map(c => c.label + c.id).join(" ")));
// thrombectomy considerations (2026 expansions/cautions) — each cited; covers large core / mRS 2 / disabling / MeVO
ok("thrombectomy considerations each carry a cite", Array.isArray(THROMBECTOMY_CONSIDERATIONS) && THROMBECTOMY_CONSIDERATIONS.length >= 4 && THROMBECTOMY_CONSIDERATIONS.every(x => x.cite && x.label));
{ const blob = THROMBECTOMY_CONSIDERATIONS.map(x => x.label).join(" | ");
  ok("considerations cover large core (ASPECTS 0–2)", /aspects 0.?2|large.*core/i.test(blob));
  ok("considerations cover pre-stroke mRS 2", /mrs 2/i.test(blob));
  ok("considerations cover disabling deficit / low NIHSS", /disabling/i.test(blob));
  ok("considerations cover MeVO and note it is not established", /medium.vessel|mevo|m2\/m3/i.test(blob) && /not established/i.test(blob)); }
ok("mimics prompt includes glucose-first", MIMICS.some(m => /glucose|hypoglyc/i.test(m)));
ok("guideline citation names the 2026 AHA/ASA source", /2026/.test(GUIDELINE_CITE) && /AHA|ASA|Stroke/i.test(GUIDELINE_CITE));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

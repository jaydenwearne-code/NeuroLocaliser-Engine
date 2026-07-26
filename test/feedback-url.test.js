// feedback-url.test.js — the feedback prefill-URL builder is a pure function (DOM-free, testable in node).
import { buildFeedbackURL } from "../app/feedback.js";

let pass = 0, fail = 0;
const ok = (l, c) => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l); };

const cfg = { base: "https://example.test/form", usePrefillFlag: true,
  fields: { caseUrl: "entry.1", topResult: "entry.2", findings: "entry.3" } };

const url = buildFeedbackURL({ caseUrl: "https://app/#f=weak_arm@left", topResult: "basis pontis (right_pons_basis_pontis)", findings: "weak_arm@left" }, cfg);
ok("starts from the configured base", url.startsWith("https://example.test/form?"));
ok("adds the Google-Forms prefill flag", url.includes("usp=pp_url"));
ok("encodes the case url under its field id", url.includes("entry.1=") && url.includes("weak_arm%40left"));
ok("includes the top result field", url.includes("entry.2=basis+pontis") || url.includes("entry.2=basis%20pontis"));
ok("includes the findings field", url.includes("entry.3=weak_arm%40left"));

const partial = buildFeedbackURL({ findings: "weak_leg@left" }, cfg);
ok("omits absent fields", !partial.includes("entry.1") && !partial.includes("entry.2") && partial.includes("entry.3="));

const empty = buildFeedbackURL({}, { base: "https://example.test/form", usePrefillFlag: false, fields: {} });
ok("empty data + no flag returns the bare base", empty === "https://example.test/form");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

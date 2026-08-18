// feedback-url.test.js — the feedback link builders are pure functions (DOM-free, testable in node).
import { buildFeedbackURL, buildFeedbackMailto, feedbackHref, FEEDBACK_QUESTIONS } from "../app/feedback.js";

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

// ---- mailto builder ----
const mail = buildFeedbackMailto({ caseUrl: "https://app/#f=weak_arm@left", topResult: "Wallenberg", findings: "weak_arm@left" }, "tester@example.test");
ok("mailto starts with the address", mail.startsWith("mailto:tester@example.test?"));
// The subject carries the product name AND the build, so a report always names the version it came from
// (2026-08-16 brand pass). Matching loosely on the name so a future rename does not fail on punctuation.
ok("mailto subject names the product", /subject=[^&]*NeuroLocaliser/i.test(mail));
ok("mailto subject carries the build version", /subject=[^&]*v\d+\.\d+\.\d+/i.test(mail));
ok("mailto body embeds the case link (encoded)", /weak_arm%40left/.test(mail));
ok("mailto body includes the top result", /Wallenberg/.test(mail));
ok("mailto body includes the curated questions", FEEDBACK_QUESTIONS.every(q => mail.includes(encodeURIComponent(q).replace(/%20/g, "+")) || mail.includes(encodeURIComponent(q))));
ok("mailto warns against identifiers", /identifier/i.test(decodeURIComponent(mail)));

// ---- feedbackHref switches on config.mode ----
const asForm = feedbackHref({ caseUrl: "x" }, { mode: "form", base: "https://f/", usePrefillFlag: false, fields: { caseUrl: "entry.1" } });
ok("feedbackHref(form) returns the form URL", asForm.startsWith("https://f/?entry.1="));
const asMail = feedbackHref({ caseUrl: "x" }, { mode: "mailto" });
ok("feedbackHref(mailto) returns a mailto link", asMail.startsWith("mailto:"));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

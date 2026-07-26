// feedback.js — a "Report a problem" button opens an external form (Google Form / Tally) pre-filled with
// the exact case link + top result + findings, so a tester's report is reproducible. Pure URL builder
// (unit-testable); the form URL + field ids are ONE config block the owner swaps for the real form.
//
// PLACEHOLDER config below. For a Google Form: `base` is the "…/viewform" URL; each `fields.*` is that
// question's entry id (open the form's prefill view, fill dummy text, "Get pre-filled link", read the
// entry.<n> ids from the generated URL). `usePrefillFlag` adds `?usp=pp_url` as Google Forms expects.

export const FEEDBACK_CONFIG = {
  base: "https://docs.google.com/forms/d/e/PLACEHOLDER_FORM_ID/viewform",
  usePrefillFlag: true,
  fields: {
    caseUrl:   "entry.100000001",
    topResult: "entry.100000002",
    findings:  "entry.100000003",
  },
};

export function buildFeedbackURL(data = {}, config = FEEDBACK_CONFIG) {
  const p = new URLSearchParams();
  if (config.usePrefillFlag) p.set("usp", "pp_url");
  const map = config.fields || {};
  if (map.caseUrl && data.caseUrl) p.set(map.caseUrl, data.caseUrl);
  if (map.topResult && data.topResult) p.set(map.topResult, data.topResult);
  if (map.findings && data.findings) p.set(map.findings, data.findings);
  const qs = p.toString();
  return qs ? `${config.base}?${qs}` : config.base;
}

// feedback.js — the "Report a problem" flow. A tester's report is reproducible: it carries the exact case
// link + the top localisation result + the findings entered. Two delivery modes (config.mode):
//   "mailto" — opens the tester's mail client, pre-filled with the case context + the curated question
//              template. Zero backend, works today; set FEEDBACK_EMAIL below.
//   "form"   — opens an external Google Form / Tally, pre-filled via entry-id params (usp=pp_url). Swap the
//              placeholder base + field ids for the real form, then set config.mode = "form".
// Pure builders (DOM-free, unit-tested); the app calls feedbackHref(). Only teaching-vocabulary findings
// ever leave, and only when the tester chooses to submit.

// ── delivery config ──────────────────────────────────────────────────────────────────────────────────
// Address feedback is emailed to. Filterable Gmail alias — delivers to the main inbox, but +neurolocaliser
// lets you filter/label these. NB: this repo is public, so this address is world-readable (scrapeable).
export const FEEDBACK_EMAIL = "jayden.wearne+neurolocaliser@gmail.com";

export const FEEDBACK_CONFIG = {
  mode: "mailto", // "mailto" (live now) | "form" (once the Google Form exists)
  // Google Form path (unused until mode = "form"): base is the "…/viewform" URL; each field is that
  // question's entry id (from the form's "Get pre-filled link").
  base: "https://docs.google.com/forms/d/e/PLACEHOLDER_FORM_ID/viewform",
  usePrefillFlag: true,
  fields: { caseUrl: "entry.100000001", topResult: "entry.100000002", findings: "entry.100000003" },
};

// The curated tester question set (shown as a fill-in template in the mailto body; mirror it in the Google
// Form if/when you build one). Tuned to the four stress-test goals: accuracy, usability, reception, robustness.
export const FEEDBACK_QUESTIONS = [
  "1. Which part is this about? (Where / Why / What / Next steps / Overall)",
  "2. For this case, was the localisation correct? (Yes / Partly / No / Not sure)",
  "3. How clinically useful was the reasoning & output? (1–5)",
  "4. If something was wrong or misleading, what was it?",
  "5. In a real ED, was it fast enough to use? (Yes / Borderline / Too slow)",
  "6. What one change would make it more useful to you?",
  "7. Would you use it (training or bedside)? (Yes / Maybe / No)",
  "8. Your role / grade (optional):",
];

// ── builders ─────────────────────────────────────────────────────────────────────────────────────────
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

export function buildFeedbackMailto(data = {}, email = FEEDBACK_EMAIL) {
  const body = [
    "Thanks for testing NeuroLocaliser — this takes about a minute.",
    "Please do NOT include any patient identifiers.",
    "",
    "— Case context (auto-filled, please keep) —",
    `Case link: ${data.caseUrl || ""}`,
    `Top result: ${data.topResult || ""}`,
    `Findings: ${data.findings || ""}`,
    "",
    "— Your feedback —",
    ...FEEDBACK_QUESTIONS,
    "",
    "9. Happy to be contacted for follow-up? Reply from your own address if so.",
  ].join("\n");
  return `mailto:${email}?subject=${encodeURIComponent("NeuroLocaliser feedback")}&body=${encodeURIComponent(body)}`;
}

// The href the app actually uses — mailto or form per config.mode.
export function feedbackHref(data = {}, config = FEEDBACK_CONFIG) {
  return config.mode === "mailto" ? buildFeedbackMailto(data) : buildFeedbackURL(data, config);
}

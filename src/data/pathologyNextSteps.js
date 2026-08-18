// pathologyNextSteps.js — the PER-PATHOLOGY workup layer (spec 2026-08-18).
//
//   pathologyPlanFor(name, site) -> { confirmatory, monitoring, urgency, referral } | null
//
// The Next steps card was keyed by SITE, so it unioned every pathology that could produce a lesion there:
// clinically useful while the cause is unknown, wrong the moment it is known — which is usually straight
// after the immediate steps. A card that speaks for ten diseases at once must either say everything
// (noise) or say only what they share (blandness).
//
// Keyed by pathology NAME with per-site interpolation — the sbSpine / nvSpine / rtSpine / rootNS idiom,
// applied to diseases instead of corridors. One `dz()` spine carries what is true of the disease
// everywhere; `bySite` fills the slots that differ, so no two sites emit the same text for a shared name.
//
// DELIBERATELY NOT keyed by canonicalKey(): that collapses 93 names onto 10 very coarse entities — the
// `Metastases` entity alone swallows 40 names, from "Orbital tumour or metastasis" to "Metastasis to the
// pituitary stalk" to "Vertebral metastasis or myeloma", which share almost no workup. Keying by it would
// recreate exactly the blandness this layer exists to remove. Exact synonyms are handled narrowly by
// PATHOLOGY_ALIAS instead.
//
// This file is the CLINICAL CONTENT. It imports nothing from the UI and nothing from nextSteps.js, so a
// reviewer reads only this file. Teaching prompts, not directives — no doses, no definitive management.

// Slot defaults used when a site has no `bySite` entry. Neutral, never invented specifics.
const DEFAULTS = { level: "the affected region", flavour: "the appearance expected for this lesion" };

const fill = (str, slots) => str.replace(/\{([a-z]+)\}/g, (_, k) => slots[k] ?? DEFAULTS[k] ?? "");

const dz = (name, { confirmatory = [], monitoring = [], urgency = null, referral = null, bySite = {} }) =>
  ({ name, confirmatory, monitoring, urgency, referral, bySite });

// Exact synonyms only — two spellings of ONE disease that must share one plan. NOT a place to merge
// related-but-different entities; the no-two-identical-plans invariant is what keeps that honest.
export const PATHOLOGY_ALIAS = {};

export const PATHOLOGY_NEXT = {
  "Spinal epidural abscess": dz("Spinal epidural abscess", {
    confirmatory: [
      "Blood cultures (at least two sets) BEFORE antibiotics wherever the delay is acceptable — the organism guides everything that follows",
      "MRI {level} WITH gadolinium — skip lesions at a non-contiguous level are common, which is why the imaged field matters here",
      "CRP and ESR serially — they track the response better than the white cell count does",
    ],
    monitoring: [
      "Hourly neurological observations while the deficit is evolving — {flavour}",
      "SAFETY NET: new or worsening weakness, or bladder or bowel dysfunction, is a surgical emergency, not a reason to wait for the next scan",
    ],
    urgency: "emergency",
    referral: "Emergency neurosurgery / spinal surgery, with infectious diseases alongside",
    bySite: {
      cord_transverse: {
        level: "the WHOLE spine",
        flavour: "a RISING sensory level is the sign that the collection is expanding",
      },
      root_l5: {
        level: "the whole spine, not the symptomatic level alone",
        flavour: "watch for a radicular deficit becoming a cord or cauda equina syndrome",
      },
    },
  }),
};

export function pathologyPlanFor(name, site) {
  const key = PATHOLOGY_ALIAS[name] || name;
  const p = PATHOLOGY_NEXT[key];
  if (!p) return null;
  const slots = { ...DEFAULTS, ...(p.bySite[site?.id] || p.bySite[`${site?.level}_${site?.part}`] || {}) };
  return {
    confirmatory: p.confirmatory.map(s => fill(s, slots)),
    monitoring: p.monitoring.map(s => fill(s, slots)),
    urgency: p.urgency,
    referral: p.referral,
  };
}

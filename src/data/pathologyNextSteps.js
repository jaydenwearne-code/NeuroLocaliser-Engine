// pathologyNextSteps.js — the PER-PATHOLOGY workup layer (spec 2026-08-18; content split 2026-08-18).
//
//   pathologyPlanFor(name, site) -> { confirmatory, monitoring, urgency, referral } | null
//
// The Next steps card was keyed by SITE, so it unioned every pathology that could produce a lesion there:
// clinically useful while the cause is unknown, wrong the moment it is known — which is usually straight
// after the immediate steps. A card that speaks for ten diseases at once must either say everything
// (noise) or say only what they share (blandness).
//
// CONTENT LIVES IN ./pathology/, one file per sieve category. At ~37 lines per plan a single file would
// reach ~13,000 lines by the end of tranche 2 and stop being reviewable, which defeats the point of
// isolating content from the UI in the first place. A clinical review round now opens exactly one file.
// The BUILDERS live in ./pathology/builders.js — its own module, so content files and this one can both
// import them without an import cycle.
//
// Keyed by pathology NAME with per-site interpolation — the sbSpine / nvSpine / rtSpine / rootNS idiom,
// applied to diseases instead of corridors.
//
// DELIBERATELY NOT keyed by canonicalKey(): that collapses 93 names onto 10 very coarse entities — the
// `Metastases` entity alone swallows 40 names, from "Orbital tumour or metastasis" to "Metastasis to the
// pituitary stalk" to "Vertebral metastasis or myeloma", which share almost no workup. Keying by it would
// recreate exactly the blandness this layer exists to remove. Exact synonyms are handled narrowly by
// PATHOLOGY_ALIAS instead.
import { DEFAULTS, fill } from "./pathology/builders.js";
import vascular from "./pathology/vascular.js";
import neoplastic from "./pathology/neoplastic.js";
import infective from "./pathology/infective.js";
import inflammatory from "./pathology/inflammatory.js";
import metabolic from "./pathology/metabolic.js";
import iatrogenic from "./pathology/iatrogenic.js";
import mimic from "./pathology/mimic.js";
import congenital from "./pathology/congenital.js";
import traumatic from "./pathology/traumatic.js";

export { dz, family, FAMILIES } from "./pathology/builders.js";

// Exact synonyms only — two spellings of ONE disease that must share one plan. NOT a place to merge
// related-but-different entities; the no-two-identical-plans invariant is what keeps that honest.
export const PATHOLOGY_ALIAS = {
  // Two spellings of ONE disease, at DISJOINT sets of sites (31 keys vs 6), which is exactly how the
  // duplicate survived the causes sweep unnoticed. The plan is authored under "Demyelination" and the MS
  // spelling resolves onto it, so the two can never drift apart into two half-maintained workups.
  "Demyelination (MS)": "Demyelination",
  // Round 6: two more exact synonyms — the same disease with the parenthetical swapped, which is exactly
  // the pattern that produced the MS duplicate.
  "Central pontine myelinolysis (osmotic demyelination)": "Osmotic demyelination syndrome (central pontine myelinolysis)",
  "PRES (posterior reversible encephalopathy)": "Posterior reversible encephalopathy syndrome (PRES)",
};

export const PATHOLOGY_NEXT = {
  ...vascular, ...neoplastic, ...infective, ...inflammatory, ...metabolic, ...iatrogenic, ...mimic,
  ...congenital, ...traumatic,
};

export function pathologyPlanFor(name, site) {
  const key = PATHOLOGY_ALIAS[name] || name;
  const p = PATHOLOGY_NEXT[key];
  if (!p) return null;
  // DEFAULTS < the plan's own slots < the per-site override. A family member carries its slots on the
  // plan rather than baked into the text, so bySite still has placeholders to fill.
  const slots = { ...DEFAULTS, ...(p.slots || {}),
                  ...(p.bySite[site?.id] || p.bySite[`${site?.level}_${site?.part}`] || {}) };
  return {
    confirmatory: p.confirmatory.map(s => fill(s, slots)),
    monitoring: p.monitoring.map(s => fill(s, slots)),
    urgency: p.urgency,
    referral: p.referral,
  };
}

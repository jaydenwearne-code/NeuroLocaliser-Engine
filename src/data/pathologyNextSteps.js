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
import degenerative from "./pathology/degenerative.js";

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
  // Round 5 (tranche 3): two more of the same pattern — ONE disease, two spellings, at DISJOINT sites,
  // which is exactly how the MS duplicate survived. Neither is a separate entity: tabes dorsalis is
  // tabes dorsalis whether the site is the pupil or the dorsal columns, and sacral zoster is sacral
  // zoster whether or not the name mentions Elsberg.
  "Tabes dorsalis (neurosyphilis)": "Neurosyphilis (tabes dorsalis)",
  "Sacral zoster (Elsberg syndrome)": "Herpes zoster (sacral)",

  // ---- Round 6 (tranche 3): the DEMYELINATION spellings ----
  // The inflammatory bucket turned out to contain NINE more spellings of one disease, each flavoured by
  // the site it sits at — a plaque in the capsule, a juxtacortical plaque, a callosal plaque, chiasmal
  // neuritis. They are not related-but-different entities; they are demyelination, named after where it
  // landed. Authoring them separately is exactly how the original MS duplicate arose, so they resolve onto
  // the tranche-1 "Demyelination" plan and can never drift apart from it.
  //
  // DELIBERATELY NOT ALIASED: "Demyelination / neurodegeneration" hedges between two different processes,
  // and "Transverse myelitis (MS / NMOSD / MOG / para-infectious)" names four diseases whose work-ups
  // genuinely diverge (AQP4 vs MOG vs para-infectious). Both get their own plans below.
  "Demyelinating plaque": "Demyelination",
  "Multiple sclerosis": "Demyelination",
  "Focal cortical demyelination": "Demyelination",
  "Juxtacortical demyelinating plaque": "Demyelination",
  "Demyelination (multiple sclerosis)": "Demyelination",
  "Severe brainstem demyelination": "Demyelination",
  "Multiple sclerosis (callosal plaques)": "Demyelination",
  "Demyelination (chiasmal neuritis)": "Demyelination",
  "Demyelination (large juxtacortical plaque)": "Demyelination",

  // Sarcoidosis at the facial nerve is neurosarcoidosis under a shorter name.
  "Sarcoidosis": "Neurosarcoidosis",

  // Two more spellings of the transverse-myelitis plan, and one of Tolosa-Hunt. Same disease, same first
  // move — exclude compression before calling it inflammation — so they must not drift apart.
  "Transverse myelitis (demyelinating)": "Transverse myelitis (MS / NMOSD / MOG / para-infectious)",
  "Demyelination / transverse myelitis": "Transverse myelitis (MS / NMOSD / MOG / para-infectious)",
  "Tolosa-Hunt (granulomatous)": "Tolosa-Hunt syndrome (granulomatous inflammation)",

  // ---- Found by a GLOBAL near-duplicate scan, not by working a bucket ----
  // Only four of the eight exact-core matches survived inspection. The scan strips parentheticals to
  // compare, and for tumours and vascular territories that is precisely where the discriminating content
  // lives — "MCA (superior division) infarct" and "MCA infarct (postcentral / parietal branch)" share a
  // core and are DIFFERENT TERRITORIES, so they are not aliased. Bulk-aliasing on the scan would have been
  // wrong; it is useful for what it rules out.
  "Myasthenia gravis": "Myasthenia gravis (autoimmune)",
  "Craniopharyngioma": "Craniopharyngioma (and its surgical treatment)",
  "Wilson's disease (young-onset)": "Wilson's disease",
  // Differs from its sibling ONLY IN CAPITALISATION — a data slip rather than a second disease.
  "RADIATION plexopathy": "Radiation plexopathy",

  // Round 7: one disease, two spellings, at disjoint sites — the trochlear nucleus and the nerve's
  // cisternal course. Whichever way it is written, the work-up is old photographs and a fusion range.
  "Congenital fourth-nerve palsy (decompensating)": "Decompensated congenital fourth nerve palsy",

  // Round 10: the same disease as the congenital-bucket plan, differing ONLY BY A HYPHEN — which is how it
  // came to sit in two categories with two spellings and no plan. Aliased rather than re-authored.
  "Normal-pressure hydrocephalus": "Normal pressure hydrocephalus",
  "Normal-pressure hydrocephalus (the mimic)": "Normal pressure hydrocephalus",

  // ---- Round 11 (tranche 3): the metabolic bucket's spelling clusters ----
  // The worst duplication found so far. FOUR spellings of diabetic amyotrophy and THREE of the
  // entrapment-prone note, none of which is a distinct disease. They resolve onto one plan each.
  "Diabetic lumbosacral radiculoplexus neuropathy (diabetic amyotrophy)": "Diabetic lumbosacral radiculoplexus neuropathy (amyotrophy)",
  "Diabetic radiculoplexus neuropathy": "Diabetic lumbosacral radiculoplexus neuropathy (amyotrophy)",
  "Diabetic amyotrophy (proximal diabetic neuropathy)": "Diabetic lumbosacral radiculoplexus neuropathy (amyotrophy)",
  "Diabetic or entrapment-prone neuropathy": "Diabetes or entrapment-prone neuropathy",
  "Diabetes or other entrapment-prone neuropathy": "Diabetes or entrapment-prone neuropathy",

  // Round 13 (vascular): the arterial map is written several ways in causes.js. Each of these is the SAME
  // DISEASE under a second spelling — an expansion of an abbreviation, or the territory word added — which
  // is exactly what an alias is for. Where a name adds a genuine clinical claim rather than a synonym (a
  // splenial extension, a superior-division infarct at a different gyrus) it gets its own plan instead.
  "ACA territory infarct": "ACA infarct",
  "Anterior cerebral artery infarct": "ACA infarct",
  "PCA territory infarct": "PCA infarct",
  "MCA (superior division) infarct": "MCA superior division infarct",
  "Anterior spinal artery infarct": "Spinal cord infarct (anterior spinal artery)",
  "Non-arteritic AION (vasculopathic)": "Non-arteritic AION (the mimic)",
  "Déjerine-Roussy (central post-stroke pain)": "Central post-stroke pain (Déjerine-Roussy)",

  // Round 12: two more pairs that are the same name written back to front.
  "Post-DBS or post-surgical injury": "Post-surgical or post-DBS change",
  "Post-surgical injury (anterior temporal lobectomy)": "Anterior temporal lobectomy (post-surgical)",
};

export const PATHOLOGY_NEXT = {
  ...vascular, ...neoplastic, ...infective, ...inflammatory, ...metabolic, ...iatrogenic, ...mimic,
  ...congenital, ...traumatic, ...degenerative,
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

// prevalence.js — how COMMON is a lesion at this site? A coarse prior used ONLY to break ties in the
// displayed differential (never to override coverage). The tier reflects the prevalence of the PATHOLOGIES
// that affect the site: cortical/subcortical strokes and peripheral (root / nerve / polyneuropathy)
// pathologies are common; thalamic and brainstem strokes and cord / cerebellar / plexus lesions are less
// common; bilateral / composite and eponymous-rarity localisations are rare. Clinician-tunable — edit the
// sets below. Precedence: rare wins → explicit (level,part) → level default → global default (uncommon).

export const COMMON = 2, UNCOMMON = 1, RARE = 0; // higher sorts first

// Rare by level — bilateral / composite / eponymous-rarity localisations.
const RARE_LEVELS = new Set([
  "locked_in", "combined_degeneration", "guillain_mollaret", "pseudobulbar", "brainstem_aras",
  "thalamus_arousal", "corpus_callosum", "hypothalamus", "pontomesencephalic", "dorsal_midbrain",
  "craniocervical_junction", "central_vestibular",
]);
// Common by level — default for the whole level unless a rare rule fires.
const COMMON_LEVELS = new Set(["cortex", "basal_ganglia", "root", "nerve", "polyneuropathy"]);
// Common by (level, part) — the lacunar subcortical parts.
const COMMON_PARTS = new Set([
  "subcortex/internal_capsule", "subcortex/corona_radiata",
  "subcortex/anterior_choroidal", "subcortex/sensorimotor",
]);
// Rare by (level, part).
const RARE_PARTS = new Set(["cerebellum/pancerebellar", "cord/transverse"]);

export function prevalenceOf(site) {
  const lp = `${site.level}/${site.part}`;
  if (site.side === "bilateral") return RARE;   // rare wins
  if (RARE_LEVELS.has(site.level)) return RARE;
  if (RARE_PARTS.has(lp)) return RARE;
  if (COMMON_PARTS.has(lp)) return COMMON;      // explicit (level,part) before level default
  if (COMMON_LEVELS.has(site.level)) return COMMON;
  return UNCOMMON;                              // global default
}

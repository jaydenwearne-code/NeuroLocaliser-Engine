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
// Bilateral sites that are nonetheless COMMON — see the bilateral rule in prevalenceOf().
const COMMON_BILATERAL_LEVELS = new Set(["polyneuropathy"]);
// Common by (level, part) — the lacunar subcortical parts.
const COMMON_PARTS = new Set([
  "subcortex/internal_capsule", "subcortex/corona_radiata",
  "subcortex/anterior_choroidal", "subcortex/sensorimotor",
  // posterior-canal BPPV — the commonest cause of vertigo (owner ruling 2026-09-26)
  "peripheral_vestibular/posterior_canal",
]);
// Rare by (level, part).
// anterior-canal BPPV is the rarest canal (owner ruling 2026-09-26: once the canals predict vertigo, an
// alphabetical tie-break put it first for isolated vertigo). The isolated lateral-midbrain sensory syndrome
// is rare (owner ruling 7, 2026-09-26): it predicts the same pure hemisensory picture as the VPL thalamus,
// which is the common lacune.
const RARE_PARTS = new Set(["cerebellum/pancerebellar", "cord/transverse", "peripheral_vestibular/anterior_canal", "midbrain/lateral"]);

export function prevalenceOf(site) {
  const lp = `${site.level}/${site.part}`;
  // Bilateral sites are rare EXCEPT where the bilateral picture IS the common disease. A length-dependent
  // polyneuropathy is bilateral by definition and the commonest neurological condition there is; listing it
  // in COMMON_LEVELS did nothing while this rule ran first (accuracy round 1, A6).
  if (site.side === "bilateral") return COMMON_BILATERAL_LEVELS.has(site.level) ? COMMON : RARE;
  if (RARE_LEVELS.has(site.level)) return RARE;
  if (RARE_PARTS.has(lp)) return RARE;
  if (COMMON_PARTS.has(lp)) return COMMON;      // explicit (level,part) before level default
  if (COMMON_LEVELS.has(site.level)) return COMMON;
  return UNCOMMON;                              // global default
}

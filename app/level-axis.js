// level-axis.js — the sensory level in the app (spinal cord fix, round 1, rows 9–10, 2026-10-22). Pure and DOM-free so
// it can be tested: WHEN the Sensory level field shows, and WHAT the level line says.

// The findings that put the level (and distal-reach) inputs on screen. Deliberately NOT weak_arm / weak_leg: limb
// weakness is the commonest finding in the app and usually cortical (2026-08-16 UI-clarity rule). Three ids here were
// not findings (dorsal_column, sensory_level, glove_stocking), so a pure dorsal-column picture never showed the field.
export const CORD_AXIS_FINDINGS = new Set(["spinothalamic", "dorsal_sensory", "sensory_ataxia",
  "sphincter_dysfunction", "saddle_anaesthesia", "distal_sensory_loss"]);

// Also whenever the displayed FIRST answer is a cord lesion (owner, 2026-10-22: not "anywhere in the list", which put
// the field on screen for a single weak limb): a spastic paraparesis has no sensory finding to trigger it, and it is
// the picture where the level matters most.
export function showLevelField(tokens, display) {
  return [...tokens].some(t => CORD_AXIS_FINDINGS.has(t.split("@")[0])) || display?.[0]?.site.level === "cord";
}

// The level line under the Where card, or null. Shown whenever a level is typed — a dismissed level used to be
// invisible — and when none is typed but the chosen reading of the cord names its segment. `place` is the displayed
// answer's plain name.
export function levelLine(level, place) {
  if (!level || !(level.given || level.fromVariant)) return null;
  if (level.contradicts) return `a sensory level at ${level.segment} needs a cord lesion at or above ${level.segment}; ${place} cannot produce one — re-check the level, or consider a second lesion`;
  return level.note || null;
}

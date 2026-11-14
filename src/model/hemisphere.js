// hemisphere.js — content written per hemisphere (non-dominant content round, K1, owner-ruled 2026-11-12; spec
// docs/superpowers/specs/2026-11-12-nondominant-content-design.md). The cause lists, site workups and plans' per-place wording
// are keyed by PLACE, so both hemispheres share them. Where the two sides differ, a cause may carry `hemisphere` (it exists on
// that side only) and a text may be `{ dominant, nondominant }` — the phonebook's own variant shape. These read them for a
// card's hemisphere by nameForSite()'s rule. No imports, so every data layer can use it without a cycle.

// The hemisphere a one-sided site sits in, for a dominance (default left, as nameForSite): "dominant" | "nondominant", or null
// for a bilateral or midline site, which sits in neither.
export const hemisphereOf = (site, dominantSide = "left") =>
  site && (site.side === "left" || site.side === "right") ? (site.side === (dominantSide || "left") ? "dominant" : "nondominant") : null;

export const isHemiText = v => !!v && typeof v === "object" && !Array.isArray(v) && "dominant" in v && "nondominant" in v;

// A two-version text read for a hemisphere. With no hemisphere (a bilateral site) it reads the dominant text, as the
// phonebook's bilateral fallback does. Anything else passes through unchanged.
export const sideText = (v, hemi) => isHemiText(v) ? v[hemi === "nondominant" ? "nondominant" : "dominant"] : v;

// A hemisphere-tagged cause is listed on its own side only; a site in neither hemisphere (bilateral) keeps it.
export const onItsSide = (cause, hemi) => !cause.hemisphere || !hemi || cause.hemisphere === hemi;

// EVERY version of a text, joined — for a scan that must see all the words written (a keyword search), not one card's.
export const allText = v => isHemiText(v) ? `${v.dominant} ${v.nondominant}` : (v || "");

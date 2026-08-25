// plates.js — turn a public-domain anatomical VECTOR plate into a theme-aware app asset.
//
// WHY THIS EXISTS. Last's Anatomy cannot ship: it is in copyright and this app is publicly deployed. It is
// read for anatomy, never copied. Public-domain plates can ship — and a plate that is genuinely VECTOR can
// be de-labelled and recoloured, so it themes, crops and highlights exactly like authored SVG while
// carrying real anatomical geometry instead of an estimate. That combination is why option D was chosen
// over a raster base (spec 2026-08-24, amendment).
//
// THE REGISTRY IS THE GATE. Adoption is not a clever heuristic that decides whether a plate is safe — it
// is a list of plates a human has looked at. auditPlate() supplies the evidence for that judgement.

export const PLATES = {
  cortex_lateral: {
    file: "Brain_diagram_without_text.svg",
    licence: "Public domain",
    source: "https://commons.wikimedia.org/wiki/File:Brain_diagram_without_text.svg",
    serves: "cortex — lobes, sulci, cerebellum (~71 sites)",
    verified: true,
  },
  cortex_lobes: {
    file: "Gray728.svg",
    licence: "Public domain",
    source: "https://commons.wikimedia.org/wiki/File:Gray728.svg",
    serves: "cerebral hemisphere with lobe boundaries (~71 sites)",
    verified: true,
  },
  visual_pathway: {
    file: "Gray722.svg",
    licence: "Public domain",
    source: "https://commons.wikimedia.org/wiki/File:Gray722.svg",
    serves: "visual pathway — retina, chiasm, tract, radiation, calcarine (~20 sites)",
    verified: true,
  },
  brachial_plexus: {
    file: "Brachial_plexus_2.svg",
    licence: "Public domain",
    source: "https://commons.wikimedia.org/wiki/File:Brachial_plexus_2.svg",
    serves: "plexus roots/trunks/divisions/cords + upper-limb nerves (~16 sites)",
    verified: true,
  },
};

// ---- colour ----
// Map every hard-coded colour onto a palette token by LUMINANCE: near-black is ink, near-white is paper,
// everything between is the band tint. That is what lets an 1918 plate work in dark mode — the geometry is
// the plate's, the colours are ours.
const lum = hex => {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map(c => c + c).join("");
  const n = parseInt(h, 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
};
const fillToken = hex => { const L = lum(hex); return L < 0.28 ? "var(--ink)" : L > 0.86 ? "var(--paper)" : "var(--band)"; };

// ---- audit ----
// REPORTS EVIDENCE. IT DOES NOT DECIDE — and that is a measured conclusion, not caution.
//
// Two real plates were rejected in the 2026-08-25 survey: Medulla_section_uk.svg (labels flattened into
// bare outlined paths) and Gray669-ja.svg (nested Inkscape label groups). Every signal that might separate
// them from the four good plates was measured, and NONE does:
//
//   plate                             verdict            paths  short%  glyphLike%  fontMarkers
//   Brain_diagram_without_text.svg    clean                 75      65           1            0
//   Gray728.svg                       clean                 75      67           1           17
//   Gray722.svg                       clean                111      31           0           66
//   Brachial_plexus_2.svg             clean                 83      88           0          177
//   Medulla_section_uk.svg            BAD (flattened)      431      49           3            0
//   Gray669-ja.svg                    BAD (inkscape)       149      17           0           42
//
// The short-path ratio runs 31-88% on GOOD plates and 17-49% on BAD ones — the highest of all is a good
// plate. Font markers are 0 for one good plate and one bad. There is no threshold here, only overlap.
//
// So the gate is the REGISTRY: a person looks at the plate and marks it verified. This function gives them
// the numbers. A heuristic verdict would have rejected Brain_diagram_without_text.svg, the best plate in
// the set.
export function auditPlate(svg) {
  const paths = svg.match(/<path[^>]*\sd="([^"]*)"/g) || [];
  const ds = paths.map(p => (/\sd="([^"]*)"/.exec(p) || [, ""])[1]);
  const short = ds.filter(d => d.length < 120).length;
  const glyphLike = ds.filter(d => d.length < 90 && /z/i.test(d)).length;
  return {
    paths: ds.length,
    shortPathRatio: ds.length ? short / ds.length : 0,
    glyphLikeRatio: ds.length ? glyphLike / ds.length : 0,
    fontMarkers: (svg.match(/font-size|font-family|<text[\s>]|flowRoot/g) || []).length,
    // THIS one is decisive and is asserted after adoption: a plate still rendering CJK, Cyrillic or Greek
    // has labels we failed to strip. It is what would have caught Gray669-ja, which passed a naive
    // <text> check while still rendering Japanese.
    nonLatin: /[\u3000-\u9fff\u0400-\u04ff\u0370-\u03ff]/.test(svg),
  };
}

// ---- adoption ----
export function adoptPlate(svg, { key = null, unsafeSkipRegistry = false } = {}) {
  if (!unsafeSkipRegistry && key !== null && !(PLATES[key] && PLATES[key].verified)) return null;

  let s = String(svg).replace(/<\?xml[^>]*\?>/g, "").replace(/<!DOCTYPE[^>]*>/g, "");

  // 1. labels. Both shapes: real <text>, and Inkscape groups whose glyphs are paths but which still carry
  //    an id="text…"/"flowRoot…" or a font-size. Anything else is anatomy and is kept.
  s = s.replace(/<text[\s\S]*?<\/text>/g, "").replace(/<tspan[\s\S]*?<\/tspan>/g, "");
  s = stripGroups(s, g => /\bid="(?:text|flowRoot)\d+"/.test(g) || /font-size/.test(g));

  // 2. leader lines. A leader without its label points at nothing. Only straight two-point paths and bare
  //    <line>s go; curves and multi-segment paths are anatomy.
  s = s.replace(/<path[^>]*\sd="[Mm]\s*[-\d.]+[,\s]+[-\d.]+\s*[Ll]?\s*[-\d.]+[,\s]+[-\d.]+\s*"[^>]*\/>/g, "");
  s = s.replace(/<line\b[^>]*\/>/g, "");

  // 3. colour
  s = s.replace(/(fill|stroke)\s*:\s*(#[0-9a-fA-F]{3,6})/g, (_, p, c) => `${p}:${p === "stroke" ? "var(--ink)" : fillToken(c)}`);
  s = s.replace(/(fill|stroke)="(#[0-9a-fA-F]{3,6})"/g, (_, p, c) => `${p}="${p === "stroke" ? "var(--ink)" : fillToken(c)}"`);
  s = s.replace(/(fill|stroke)="(black|#000000|#000)"/gi, (_, p) => `${p}="var(--ink)"`);
  s = s.replace(/(fill|stroke)="(white|#ffffff|#fff)"/gi, (_, p) => `${p}="var(--paper)"`);

  // 4. it must scale: a fixed width/height defeats the viewBox and the crop
  s = s.replace(/<svg([^>]*)>/, (m, attrs) => `<svg${attrs.replace(/\s(width|height)="[^"]*"/g, "")} class="plate">`);
  return s.trim();
}

// Remove whole <g> elements matching `test`, counting nesting so a label group cannot swallow the
// anatomy that follows it. A naive /<g …>[\s\S]*?<\/g>/ closes at the FIRST </g>, which on a nested
// Inkscape file deleted 64% of the paths while still leaving the labels behind.
function stripGroups(s, test) {
  let out = "", i = 0;
  while (i < s.length) {
    const open = s.indexOf("<g", i);
    if (open < 0) { out += s.slice(i); break; }
    const gt = s.indexOf(">", open);
    if (gt < 0) { out += s.slice(i); break; }
    const tag = s.slice(open, gt + 1);
    if (!/^<g[\s>]/.test(tag) || !test(tag)) { out += s.slice(i, gt + 1); i = gt + 1; continue; }
    out += s.slice(i, open);
    i = skipGroup(s, gt + 1);          // drop the whole balanced group
  }
  return out;
}
function skipGroup(s, from) {
  let depth = 1, i = from;
  while (i < s.length && depth > 0) {
    const nextOpen = s.indexOf("<g", i), nextClose = s.indexOf("</g>", i);
    if (nextClose < 0) return s.length;
    if (nextOpen >= 0 && nextOpen < nextClose && /^<g[\s>]/.test(s.slice(nextOpen, nextOpen + 3))) { depth++; i = nextOpen + 2; }
    else { depth--; i = nextClose + 4; }
  }
  return i;
}

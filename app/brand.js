// brand.js — identity, in one place. The mark is a PYRAMIDAL DECUSSATION: two tracts descend, cross once,
// and continue on the opposite side, one node filled and one hollow. That asymmetry is the engine's whole
// premise ("laterality is the crux — most localisation bugs are crossing bugs"), so the mark states it.
//
// A bare X was rejected: at small size it reads as close/delete, which collides with the red ✗ already
// meaning "contradicted by a normal finding". The vertical runs above and below the crossing prevent that.
//
// Pure — returns strings, never touches the DOM. app.js injects.

// Kept in step with package.json by test/brand.test.js, so a bug report always names a real build.
export const VERSION = "0.9.0";

export const PRODUCT_NAME = "Wearne's NeuroLocaliser";

// The full mark. Colour comes from `currentColor` so it inherits whatever token the call site sets —
// asserted by the suite, because a hard-coded hex here would silently break dark mode.
export function markSVG({ size = 26, cls = "brand-mark" } = {}) {
  const h = Math.round(size * 1.18);
  return `<svg class="${cls}" width="${size}" height="${h}" viewBox="0 0 24 26" aria-hidden="true" focusable="false">`
    + `<path d="M8.3 7.6 V12 L15.7 17 V22.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<path d="M15.7 7.6 V12 L8.3 17 V22.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<circle cx="8.3" cy="4.6" r="2.8" fill="currentColor"/>`
    + `<circle cx="15.7" cy="4.6" r="2.8" fill="none" stroke="currentColor" stroke-width="1.8"/>`
    + `</svg>`;
}

// The favicon is the SAME geometry with thicker strokes and no mid-detail, because 16px cannot hold it.
// A data URI cannot inherit currentColor, so this one takes an explicit colour.
export function faviconDataURI(color = "#d36d52") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 26">`
    + `<path d="M8 7.5 V12 L16 17 V23" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<path d="M16 7.5 V12 L8 17 V23" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<circle cx="8" cy="4.3" r="3.2" fill="${color}"/>`
    + `<circle cx="16" cy="4.3" r="3.2" fill="none" stroke="${color}" stroke-width="2.4"/>`
    + `</svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

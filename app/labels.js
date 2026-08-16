// labels.js — DISPLAY naming only. Pure and DOM-free so it can be unit-tested directly (same pattern as
// combined-sites.js / together-guard.js). The engine speaks ids; this module is the one place that turns
// them into words a clinician reads. Ids still travel in the case URL and the feedback payload untouched.

// Word-level expansions applied to every underscore-separated token of a part id. Keys are lowercase and
// contain no underscore (asserted in test/app-naming.test.js) — they are matched per WORD, not per id.
export const ABBREV = {
  aca: "ACA", mca: "MCA", pca: "PCA", pica: "PICA", aica: "AICA", sca: "SCA",
  cpa: "cerebellopontine angle", iam: "internal acoustic meatus",
  dlpfc: "dorsolateral prefrontal", pfc: "prefrontal", mlf: "MLF", aras: "ARAS",
  vpm: "VPM", vpl: "VPL", scm: "sternocleidomastoid",
  sup: "superior", inf: "inferior", lat: "lateral", med: "medial", fem: "femoral",
  iii: "III", iv: "IV", vi: "VI", ix: "IX", xi: "XI", xii: "XII",
  cn3: "CN III", cn4: "CN IV", cn6: "CN VI", cn7: "CN VII",
};

// A dermatome/root token like "c5" / "t10" / "l4" / "s2" — uppercase the letter, keep the number.
const ROOT_RE = /^([clts])(\d{1,2})$/;

export function humanisePart(part) {
  return String(part).split("_").map(w => {
    if (ABBREV[w]) return ABBREV[w];
    const m = ROOT_RE.exec(w);
    if (m) return m[1].toUpperCase() + m[2];
    return w;
  }).join(" ");
}

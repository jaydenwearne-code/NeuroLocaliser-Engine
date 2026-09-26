// sides.js — which side buttons the finding panel offers for each finding. Pure and DOM-free, so the
// invariant can be tested directly (test/side-offers.test.js): NO OFFERED OPTION MAY RETURN NOTHING.
//
// The panel used to offer every side any site emitted. A finding produced only by a SYMMETRIC bilateral
// site (a length-dependent neuropathy, a syrinx) was then offered as "L" and "R", and one side on its own
// excluded the only producer — zero candidates, and the empty state suggested the picture was non-organic.
// Such a finding now gets a single "Both" button that enters the two sides together (accuracy round 1, A5).
import { candidateSites } from "../src/engine/inverse.js";
import { expectedFindings } from "../src/engine/forward.js";
import { NON_LATERALISED } from "../src/model/findings.js";

export function buildSideOffers(sites) {
  const sides = {};        // finding -> Set of body sides some site emits it on
  const oneSided = {};     // finding -> true if a ONE-SIDED or ASYMMETRIC site emits it @left/@right
  for (const site of sites) {
    let exp; try { exp = expectedFindings(site); } catch { continue; }
    for (const tok of exp) {
      const [f, s] = tok.split("@");
      (sides[f] ??= new Set()).add(s);
      if ((s === "left" || s === "right") && (site.side === "left" || site.side === "right" || site.asymmetric)) oneSided[f] = true;
    }
  }
  const out = {};
  for (const [f, set] of Object.entries(sides)) {
    if (NON_LATERALISED.has(f) || (set.size === 1 && set.has("none"))) { out[f] = [{ key: "none", tokens: [`${f}@none`] }]; continue; }
    const offers = [];
    const lr = ["left", "right"].filter(s => set.has(s));
    if (lr.length && !oneSided[f]) offers.push({ key: "both", tokens: lr.map(s => `${f}@${s}`) });
    else for (const s of lr) offers.push({ key: s, tokens: [`${f}@${s}`] });
    if (set.has("midline")) offers.push({ key: "midline", tokens: [`${f}@midline`] });
    out[f] = offers;
  }
  return out;
}

const OFFERS = buildSideOffers(candidateSites());
export const offersFor = f => OFFERS[f] || [{ key: "none", tokens: [`${f}@none`] }];

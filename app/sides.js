// sides.js — which side buttons the finding panel offers for each finding. Pure and DOM-free, so the
// invariant can be tested directly (test/side-offers.test.js): NO OFFERED OPTION MAY RETURN NOTHING.
//
// The panel used to offer every side any site emitted. A finding produced only by a SYMMETRIC bilateral
// site (a length-dependent neuropathy, a syrinx) was then offered as "L" and "R", and one side on its own
// excluded the only producer — zero candidates, and the empty state suggested the picture was non-organic.
// Such a finding now gets a single "Both" button that enters the two sides together (accuracy round 1, A5).
import { candidateSites } from "../src/engine/inverse.js";
import { expectedFindings } from "../src/engine/forward.js";
import { NON_LATERALISED, EXPLICIT_NORMAL } from "../src/model/findings.js";

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
  // An explicit normal (a down-going plantar) is produced by no site, so it borrows the SIDES its abnormal
  // counterpart is offered on — left and right only: a normal has no midline form (owner ruling 2026-09-29).
  for (const [normal, abn] of Object.entries(EXPLICIT_NORMAL)) {
    out[normal] = ["left", "right"].filter(s => (out[abn] || []).some(o => o.tokens.includes(`${abn}@${s}`)))
      .map(s => ({ key: s, tokens: [`${normal}@${s}`] }));
  }
  return out;
}

const OFFERS = buildSideOffers(candidateSites());
export const offersFor = f => OFFERS[f] || [{ key: "none", tokens: [`${f}@none`] }];

// A SAVED LINK can carry a token on a side its finding is no longer offered on — the conus and cauda limb signs moved
// from midline to both sides, and sphincter dysfunction from a side to midline (spec 2026-09-29-conus-cauda-
// bilateral). A stale token would match nothing and load a false two-lesion answer. Midline becomes left + right where
// both are offered; a side becomes midline where only midline is offered; anything else unoffered is dropped.
// Offered tokens pass through untouched, in order.
export function currentTokens(tokens) {
  const out = [];
  for (const tok of tokens) {
    const [f, side] = tok.split("@");
    const offered = offersFor(f).flatMap(o => o.tokens);
    if (offered.includes(tok)) out.push(tok);
    else if (side === "midline" && offered.includes(`${f}@left`) && offered.includes(`${f}@right`)) out.push(`${f}@left`, `${f}@right`);
    else if ((side === "left" || side === "right") && offered.length === 1 && offered[0] === `${f}@midline`) out.push(`${f}@midline`);
  }
  return [...new Set(out)];
}

// A row TAP enters the finding on the reader's default side (spec 2026-09-27 §5.4): "Symptoms on" above the tree,
// or a follow-up's parent side. It maps that default through the SAME offers the buttons show, so a tap can never
// enter a token the panel does not offer. A finding with one fixed offer (none / both / midline) takes it whatever
// the default. Returns null when the default does not decide it — the row's side buttons are then the only way in.
export function tokensForRow(f, defaultSide = "") {
  const offers = offersFor(f);
  if (offers.length === 1 && offers[0].key !== "left" && offers[0].key !== "right") return offers[0].tokens;
  if (!defaultSide) return null;
  const exact = offers.find(o => o.key === defaultSide);
  if (exact) return exact.tokens;
  if (defaultSide === "both") {
    const lr = offers.filter(o => o.key === "left" || o.key === "right");
    if (lr.length === 2) return lr.flatMap(o => o.tokens);
  }
  return null;
}

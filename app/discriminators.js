// discriminators.js — "what should I examine next, and what would it prove?"
//
// PURE and DOM-free, so it is testable in node, like the rest of the app layer.
//
// WHY THIS EXISTS, and it is worth stating plainly because three rewrites of the neuraxis diagram did not:
// a picture of the neuraxis is in every textbook; the REASONING is not. The engine's distinctive asset is
// that it derives which findings force which site and what would separate the survivors — and no version
// of the drawing ever showed that.
//
// THE MEASUREMENT THAT SHAPED IT. Every surviving candidate explains every entered finding — that is what
// makes it a candidate. Wallenberg's two both explain 6 of 6; foot drop's three all explain 3 of 3. So a
// grid of "what does each candidate explain" is almost always solid ticks and carries no information. The
// information sits entirely in what a candidate PREDICTS THAT HAS NOT BEEN LOOKED FOR, which is exactly
// the next examination.

// Which of the entered findings does this candidate account for?
export function explainedBy(cand, observed) {
  return [...observed].filter(t => cand.exp.has(t));
}

// The findings that would SPLIT the field, most informative first.
//
// A finding predicted by every candidate proves nothing, and one predicted by none is not on offer; both
// are excluded by construction rather than by a filter, because `confirms` and `excludes` must each be
// non-empty for a token to appear at all.
export function discriminators(candidates, observed) {
  if (!candidates || candidates.length < 2) return [];

  const tokens = new Set();
  for (const c of candidates) for (const t of c.exp) if (!observed.has(t)) tokens.add(t);

  const out = [];
  for (const token of tokens) {
    const confirms = [], excludes = [];
    candidates.forEach((c, i) => (c.exp.has(token) ? confirms : excludes).push(i));
    if (!confirms.length || !excludes.length) continue;     // proves nothing either way
    out.push({ token, confirms, excludes, spread: Math.abs(confirms.length - excludes.length) });
  }

  // An even split is the most informative examination: it halves the field whichever way it goes. Ties
  // break on the token so the order is stable between renders.
  out.sort((a, b) => a.spread - b.spread || a.token.localeCompare(b.token));
  return out;
}

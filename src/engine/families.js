// families.js (engine) — matching through the word families (src/model/families.js). LOGIC ONLY.
//
// The engine MATCHES through a family and never rewrites the word: the card, the Why line and the case link keep what
// was entered (false-multifocal fix, row 1). Three readings of a token:
//   matchToken(t)             a PREDICTED token, context-free: a "same" family's member reads as its head.
//   enteredToken(t, entered)  an ENTERED token, in the context of everything entered: a "same" member reads as its
//                             head; a "hemiparesis" member reads as its head when an `inside` finding is on that side.
//   predictedToken(t, read)   a PREDICTED token against what was entered (already read): a specific member of a
//                             "generic" family reads as the generic word when only the generic word was entered.
import { FINDING_FAMILIES } from "../model/families.js";

const split = t => { const i = t.lastIndexOf("@"); return [t.slice(0, i), t.slice(i + 1)]; };
const FAMILY_OF = new Map();
for (const fam of FINDING_FAMILIES) for (const m of fam.members) FAMILY_OF.set(m, fam);

export function matchToken(t) {
  const [f, s] = split(t);
  const fam = FAMILY_OF.get(f);
  return fam && fam.relation === "same" && f !== fam.head ? `${fam.head}@${s}` : t;
}

export function enteredToken(t, entered) {
  const m = matchToken(t);
  if (m !== t) return m;
  const [f, s] = split(t);
  const fam = FAMILY_OF.get(f);
  if (fam && fam.relation === "hemiparesis" && f !== fam.head && fam.inside.some(g => entered.has(`${g}@${s}`))) return `${fam.head}@${s}`;
  return t;
}
export const enteredSet = entered => new Set([...entered].map(t => enteredToken(t, entered)));

export function predictedToken(t, read) {
  const m = matchToken(t);
  const [f, s] = split(m);
  const fam = FAMILY_OF.get(f);
  if (fam && fam.relation === "generic" && f !== fam.generic) {
    const g = `${fam.generic}@${s}`;
    if (read.has(g) && !read.has(m)) return g;
  }
  return m;
}
export const predictedSet = (exp, read) => new Set([...exp].map(t => predictedToken(t, read)));

// Every token a predicted word can be matched as, whatever was entered — for an index built once (why.js locusIndex).
export function indexTokens(t) {
  const m = matchToken(t);
  const [f, s] = split(m);
  const fam = FAMILY_OF.get(f);
  return fam && fam.relation === "generic" && f !== fam.generic ? [m, `${fam.generic}@${s}`] : [m];
}

// The SAME-FAMILY NEAR-FIT's word (rows 5–7): for a word that was entered, a member of its family that the place
// predicts on the same side and that was NOT entered. Only families with `nearFit`. Null when there is none.
export function sameFamilyInstead(token, predicted, read) {
  const [f, s] = split(token);
  const fam = FAMILY_OF.get(f);
  if (!fam || !fam.nearFit) return null;
  for (const g of fam.members) {
    if (g === f) continue;
    const t = `${g}@${s}`;
    if (predicted.has(t) && !read.has(t)) return t;
  }
  return null;
}

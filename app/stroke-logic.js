// stroke-logic.js — pure, DOM-free logic for code-stroke mode. See the design spec
// docs/superpowers/specs/2026-07-28-code-stroke-mode-design.md.

const n = v => Number(v) || 0;
const other = s => s === "left" ? "right" : "left";

// Sum every NIHSS component (arms/legs counted per limb). Missing components are 0.
export function nihssTotal(nihss = {}) {
  const k = ["loc","locQ","locC","gaze","visual","facial","armL","armR","legL","legR","ataxia","sensory","language","dysarthria","extinction"];
  return k.reduce((s, key) => s + n(nihss[key]), 0);
}

// Map a scored NIHSS to localiser finding tokens. Lateralised deficits are emitted on the BODY side
// (contralateral to the lesion — the localiser's crossing model resolves lesion side); gaze deviates
// toward the lesion (opposite the body-deficit side). Aphasia/dysarthria/extinction are non-lateralised.
export function nihssToFindings(nihss = {}, dominant = "left") {
  const out = new Set();
  const rightMotor = n(nihss.armR) + n(nihss.legR), leftMotor = n(nihss.armL) + n(nihss.legL);
  const deficitSide = rightMotor === 0 && leftMotor === 0 ? null : (rightMotor >= leftMotor ? "right" : "left");
  if (n(nihss.armL)) out.add("weak_arm@left");
  if (n(nihss.armR)) out.add("weak_arm@right");
  if (n(nihss.legL)) out.add("weak_leg@left");
  if (n(nihss.legR)) out.add("weak_leg@right");
  if (deficitSide) {
    if (n(nihss.facial)) out.add(`facial_weakness@${deficitSide}`);
    if (n(nihss.visual)) out.add(`homonymous_hemianopia@${deficitSide}`);
    if (n(nihss.sensory)) out.add(`cortical_sensory_arm@${deficitSide}`);
    if (n(nihss.ataxia)) out.add(`limb_ataxia@${deficitSide}`);
    if (n(nihss.gaze)) out.add(`gaze_deviation@${other(deficitSide)}`); // eyes look toward the lesion
  }
  if (n(nihss.language)) { out.add("speech_nonfluent@none"); out.add("comprehension_impaired@none"); }
  if (n(nihss.dysarthria)) out.add("dysarthria@none");
  if (n(nihss.extinction)) out.add("neglect@none");
  if (n(nihss.loc) >= 2) out.add("reduced_consciousness@none");
  return out;
}

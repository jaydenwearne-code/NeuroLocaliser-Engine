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

// Thrombolytic time windows (in minutes from last-known-well)
const WINDOWS = { ivtStandard: 270, ivtExtended: 540, evtEarly: 360, evtExtended: 1440 };

// Compute window status given elapsed time and limit
function windowStatus(elapsed, limit) {
  if (elapsed >= limit) return { status: "closed", minsLeft: 0 };
  const minsLeft = limit - elapsed;
  return { status: minsLeft <= 30 ? "closing" : "open", minsLeft };
}

// Compute thrombolytic window statuses based on time since LKW (last-known-well).
// Returns { elapsedMin, ivtStandard, ivtExtended, evtEarly, evtExtended }, where each window
// is { status: "open"|"closing"|"closed"|"unknown", minsLeft: number|null }.
// "closing" means ≤30 min remaining. Missing/invalid lkwISO yields all "unknown".
export function timeWindows(lkwISO, nowMs = Date.now()) {
  const lkw = lkwISO ? Date.parse(lkwISO) : NaN;
  if (!Number.isFinite(lkw)) {
    const u = { status: "unknown", minsLeft: null };
    return { elapsedMin: null, ivtStandard: u, ivtExtended: u, evtEarly: u, evtExtended: u };
  }
  const elapsedMin = Math.max(0, Math.round((nowMs - lkw) / 60000));
  return {
    elapsedMin,
    ivtStandard: windowStatus(elapsedMin, WINDOWS.ivtStandard),
    ivtExtended: windowStatus(elapsedMin, WINDOWS.ivtExtended),
    evtEarly:    windowStatus(elapsedMin, WINDOWS.evtEarly),
    evtExtended: windowStatus(elapsedMin, WINDOWS.evtExtended),
  };
}

// Rapid LVO (large-vessel occlusion) screen: identify patients likely to benefit from thrombectomy.
// Returns { likely: boolean, reasons: string[] }.
// LVO likely when a cortical sign (gaze/language/extinction > 0) is present AND nihssTotal ≥ 6.
export function lvoScreen(nihss = {}) {
  const reasons = [];
  if (n(nihss.gaze)) reasons.push("gaze deviation");
  if (n(nihss.language)) reasons.push("aphasia");
  if (n(nihss.extinction)) reasons.push("neglect/extinction");
  const total = nihssTotal(nihss);
  const likely = reasons.length > 0 && total >= 6;
  if (likely) reasons.push(`NIHSS ${total} (≥6)`);
  return { likely, reasons };
}

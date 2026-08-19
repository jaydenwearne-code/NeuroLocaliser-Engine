// builders.js — the SHAPE of a pathology plan. NO CONTENT.
//
// This module is imported by every content file in this directory AND by the parent
// ../pathologyNextSteps.js. Keeping it free of content is what stops an import cycle.
//
//   dz(name, opts)               ONE named plan, optionally varying by site
//   family(label, spine, members) ONE authored spine -> SEVERAL named plans

// Slot defaults used when a site has no `bySite` entry. Neutral, never invented specifics.
export const DEFAULTS = { level: "the affected region", flavour: "the appearance expected for this lesion" };

export const fill = (str, slots) => str.replace(/\{([a-z]+)\}/g, (_, k) => slots[k] ?? DEFAULTS[k] ?? "");

export const dz = (name, { confirmatory = [], monitoring = [], urgency = null, referral = null, bySite = {} }) =>
  ({ name, confirmatory, monitoring, urgency, referral, bySite });

// Every family() call registers its members here, so the invariants in test/pathology-next-steps.test.js
// can check membership without each content file declaring it a second time (which could drift from the
// call it is meant to describe).
export const FAMILIES = {};

// family() — ONE authored spine, SEVERAL named plans. The tranche-1 `dz()` spine handles one NAME across
// many sites; this handles several NAMES sharing a workup, which is what the must-not-miss set is full of
// (28 infarcts, 24 haemorrhages, 20 metastases). Writing the stroke pathway out 28 times is exactly the
// drift rootNS() was built to prevent.
//
// A member diverges at one of THREE levels, so the builder never forces a false shared answer:
//   slots              — same workup, different anatomy (interpolates the spine's {level} / {flavour})
//   confirmatoryExtra  — same workup PLUS something
//   confirmatory       — a genuinely DIFFERENT workup, REPLACING the spine's outright
// The third exists because meningioma and metastasis share a head noun and diverge on the investigations
// themselves (owner ruling, 2026-08-18). `monitoring` / `monitoringExtra` work the same way, and
// `urgency` / `referral` fall back to the spine unless the member overrides them.
//
// A FAMILY IS A CLINICAL CLAIM, NOT A STRING MATCH. Two invariants keep it honest: no two members may
// emit an identical plan, and a family must have at least three members. Where members do not genuinely
// share a workup the fix is to author them as singletons — never to loosen the invariant.
export const family = (label, spine, members) => {
  FAMILIES[label] = Object.keys(members);
  return Object.fromEntries(
    Object.entries(members).map(([name, m]) => [name, dz(name, {
      confirmatory: m.confirmatory
        ?? [...(spine.confirmatory || []).map(s => fill(s, m.slots || {})), ...(m.confirmatoryExtra || [])],
      monitoring: m.monitoring
        ?? [...(spine.monitoring || []).map(s => fill(s, m.slots || {})), ...(m.monitoringExtra || [])],
      urgency:  m.urgency  ?? spine.urgency,
      referral: m.referral ?? spine.referral,
      bySite:   m.bySite   ?? {},
    })]));
};

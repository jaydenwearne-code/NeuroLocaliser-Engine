// builders.js — the SHAPE of a pathology plan. NO CONTENT.
//
// This module is imported by every content file in this directory AND by the parent
// ../pathologyNextSteps.js. Keeping it free of content is what stops an import cycle.
//
//   dz(name, opts)               ONE named plan, optionally varying by site
//   family(label, spine, members) ONE authored spine -> SEVERAL named plans

// Slot defaults used when a site has no `bySite` entry. Neutral, never invented specifics.
export const DEFAULTS = { level: "the affected region", flavour: "the appearance expected for this lesion",
  // `aetiology` carries the LOCATION-DERIVED cause. Its default never asserts a mechanism, because
  // guessing one from an unknown location is precisely the error the slot exists to prevent.
  aetiology: "read the location against the rule above before assuming a mechanism" };

export const fill = (str, slots) => str.replace(/\{([a-z]+)\}/g, (_, k) => slots[k] ?? DEFAULTS[k] ?? "");

// `slots` are the plan's DEFAULT interpolation values, applied at RENDER time and overridden per site by
// `bySite`. They must NOT be applied when the plan is built: pre-filling consumes the {level} / {flavour}
// placeholders, leaving bySite nothing to interpolate into, so every site renders identically. That bug
// shipped in the first draft of family() and was caught by the per-site differentiation invariant.
export const dz = (name, { confirmatory = [], monitoring = [], urgency = null, referral = null, bySite = {}, slots = {} }) =>
  ({ name, confirmatory, monitoring, urgency, referral, bySite, slots });

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
      // NOT pre-filled — the member's slots ride along on the plan and are applied at render time, so a
      // bySite entry can still override {level} / {flavour} for a particular site.
      slots: m.slots || {},
      confirmatory: m.confirmatory
        ?? [...(spine.confirmatory || []), ...(m.confirmatoryExtra || [])],
      monitoring: m.monitoring
        ?? [...(spine.monitoring || []), ...(m.monitoringExtra || [])],
      urgency:  m.urgency  ?? spine.urgency,
      referral: m.referral ?? spine.referral,
      bySite:   m.bySite   ?? {},
    })]));
};

// pathology-next-steps.test.js — the PER-PATHOLOGY workup layer (spec 2026-08-18).
//
// The Next steps card was keyed by SITE, so it unioned every pathology that could produce a lesion there.
// This layer keys the confirmatory / monitoring / urgency / referral tiers by the pathology the user
// selected, while immediate + first-line stay site-level (they are what GET you the cause).
import { PATHOLOGY_NEXT, PATHOLOGY_ALIAS, pathologyPlanFor, family, FAMILIES } from "../src/data/pathologyNextSteps.js";
import { CAUSES } from "../src/data/causes.js";
import { resolveUrgency, nextStepsFor, pathologyNextStepsFor } from "../src/data/nextSteps.js";
import { candidateSites } from "../src/engine/inverse.js";

let pass = 0, fail = 0;
const ok = (l, c, d = "") => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l + (!c && d ? `  [${d}]` : "")); };

const site = id => ({ id, level: id.split("_")[0], part: id.split("_").slice(1).join("_") });

// --- 1: the spine resolves, with and without a bySite entry ---
{
  const p = pathologyPlanFor("Spinal epidural abscess", site("cord_transverse"));
  ok("a known pathology returns a plan", !!p);
  ok("the plan carries confirmatory steps", Array.isArray(p.confirmatory) && p.confirmatory.length > 0);
  ok("the plan carries monitoring steps", Array.isArray(p.monitoring) && p.monitoring.length > 0);
  ok("the plan carries an urgency", typeof p.urgency === "string");
  ok("an unknown pathology returns null", pathologyPlanFor("Not A Real Disease", site("cord_transverse")) === null);
}

// --- 2: interpolation — no unreplaced slots ever reach the UI ---
{
  for (const name of Object.keys(PATHOLOGY_NEXT)) {
    const p = pathologyPlanFor(name, site("cord_transverse"));
    const leaked = [...p.confirmatory, ...p.monitoring].filter(s => /\{[a-z]+\}/.test(s));
    ok(`\`${name}\` leaves no unreplaced {slot}`, leaked.length === 0, leaked.join(" | "));
  }
}

// --- 3: no orphan plans — every key names a cause that actually exists ---
// A plan keyed to a misspelled pathology never fires and never errors. This is the only thing that catches it.
{
  const realNames = new Set(Object.keys(CAUSES).flatMap(k => CAUSES[k].map(c => c.name)));
  for (const name of Object.keys(PATHOLOGY_NEXT))
    ok(`plan key \`${name}\` matches a real cause in CAUSES`, realNames.has(name));
  for (const [from, to] of Object.entries(PATHOLOGY_ALIAS)) {
    ok(`alias source \`${from}\` matches a real cause`, realNames.has(from));
    ok(`alias target \`${to}\` has a plan`, !!PATHOLOGY_NEXT[to]);
  }
}

// --- 3b: no unreachable bySite entries ---
// A bySite key naming a real SITE is not enough — the pathology must actually be a cause AT that site, or
// the entry can never be reached through the UI (you can only select a pathology the What card lists).
// Caught one on the day it was written: Radiation plexopathy carried a plexus_upper_trunk entry, and that
// site does not list it as a cause. Same silent-no-op as a misspelled plan key, one level down.
{
  const aliasPairs = Object.entries(PATHOLOGY_ALIAS);
  for (const [name, p] of Object.entries(PATHOLOGY_NEXT)) {
    const spellings = [name, ...aliasPairs.filter(([, to]) => to === name).map(([from]) => from)];
    for (const k of Object.keys(p.bySite || {})) {
      const listed = (CAUSES[k] || []).some(c => spellings.includes(c.name));
      ok(`\`${name}\` bySite["${k}"] is reachable — the pathology is a cause there`, listed);
    }
  }
}

// --- 4: urgency — curated value wins, red is a FLOOR beneath it, site is the fallback ---
{
  const sites = candidateSites();
  const causesAt = s => CAUSES[s.id] || CAUSES[`${s.level}_${s.part}`] || [];

  // The red floor: no red must-not-miss may render as routine, curated or not.
  // 377 sites carry a red cause and 76 of them badge routine today — this is the invariant that fixes them.
  let violations = [];
  for (const s of sites) for (const c of causesAt(s))
    if (c.red && resolveUrgency(s, c.name) === "routine") violations.push(`${s.id} / ${c.name}`);
  ok("no red cause resolves to routine anywhere", violations.length === 0, violations.slice(0, 3).join(" ; "));

  // The sharpest real case: BPPV badges routine, but posterior circulation stroke is its must-not-miss.
  const bppv = sites.find(s => s.id === "left_peripheral_vestibular_posterior_canal");
  ok("the BPPV site exists", !!bppv);
  ok("BPPV site itself still badges routine", nextStepsFor(bppv).urgency === "routine");
  const stroke = causesAt(bppv).find(c => /posterior circulation stroke/i.test(c.name));
  ok("its posterior-circulation-stroke cause exists", !!stroke);
  ok("selecting that cause escalates off routine", resolveUrgency(bppv, stroke.name) !== "routine");

  // No selection = unchanged.
  ok("null pathology returns the site's own urgency", resolveUrgency(bppv, null) === nextStepsFor(bppv).urgency);

  // Authored descent is permitted (owner ruling 2026-08-18): a curated NON-red pathology may resolve
  // BELOW the site's urgency. Tested with a stub plan rather than by waiting for content to exist, so the
  // rule is pinned from day one and cannot be silently reversed by a later refactor.
  {
    // SAVE AND RESTORE, never delete. These blocks install a stub plan to test a rule; deleting it
    // afterwards DESTROYS a real plan whenever the chosen cause already has one. That went unnoticed for
    // eight rounds because the chosen causes happened to be unauthored — and surfaced the moment tranche 2
    // reached near-complete coverage, as a phantom "1 red cause without a plan" that no direct
    // measurement could reproduce.
    const withStub = (name, fn) => {
      const had = Object.prototype.hasOwnProperty.call(PATHOLOGY_NEXT, name);
      const saved = PATHOLOGY_NEXT[name];
      PATHOLOGY_NEXT[name] = { name, confirmatory: ["stub"], monitoring: ["stub"],
                               urgency: "routine", referral: "stub", bySite: {}, slots: {} };
      try { fn(); } finally { if (had) PATHOLOGY_NEXT[name] = saved; else delete PATHOLOGY_NEXT[name]; }
    };

    const host = sites.find(s => nextStepsFor(s).urgency === "emergency" && causesAt(s).some(c => !c.red));
    ok("an emergency-badged site with a non-red cause exists", !!host);
    if (host) {
      const benign = causesAt(host).find(c => !c.red);
      withStub(benign.name, () =>
        ok("an authored routine urgency descends below an emergency site badge",
           resolveUrgency(host, benign.name) === "routine"));
    }

    // ...but a RED cause may never be descended below the floor, even by an authored plan.
    const redHost = sites.find(s => causesAt(s).some(c => c.red));
    const redCause = causesAt(redHost).find(c => c.red);
    withStub(redCause.name, () =>
      ok("the red floor overrides an authored routine urgency",
         resolveUrgency(redHost, redCause.name) !== "routine"));
  }
}

// --- 5: the public API — tier split, fallback flag, and no regression when nothing is selected ---
{
  const sites = candidateSites();
  const causesAt = s => CAUSES[s.id] || CAUSES[`${s.level}_${s.part}`] || [];
  const host = sites.find(s => causesAt(s).some(c => c.name === "Spinal epidural abscess"));
  ok("a site carrying the exemplar pathology exists", !!host);

  // Nothing selected => byte-identical to today's card.
  const plain = pathologyNextStepsFor(host, null), today = nextStepsFor(host);
  for (const k of ["immediate", "investigations", "confirmatory", "monitoring", "urgency", "referral"])
    ok(`null pathology leaves \`${k}\` identical to nextStepsFor`,
       JSON.stringify(plain[k]) === JSON.stringify(today[k]));
  ok("null pathology reports no pathology", plain.pathology === null);

  // Selected + curated => lower tiers swap, upper tiers do not.
  const sel = pathologyNextStepsFor(host, "Spinal epidural abscess");
  ok("immediate stays site-level", JSON.stringify(sel.immediate) === JSON.stringify(today.immediate));
  ok("first-line stays site-level", JSON.stringify(sel.investigations) === JSON.stringify(today.investigations));
  ok("confirmatory swaps to the pathology", JSON.stringify(sel.confirmatory) !== JSON.stringify(today.confirmatory));
  ok("monitoring swaps to the pathology", JSON.stringify(sel.monitoring) !== JSON.stringify(today.monitoring));
  ok("pathologyCurated is true for an authored plan", sel.pathologyCurated === true);
  ok("the pathology name is carried", sel.pathology === "Spinal epidural abscess");

  // Selected + uncurated => site tiers, flagged so the UI can label them.
  const uncurated = causesAt(host).map(c => c.name).find(n => !PATHOLOGY_NEXT[n] && !PATHOLOGY_ALIAS[n]);
  ok("an uncurated cause exists at that site to test the fallback", !!uncurated);
  const fb = pathologyNextStepsFor(host, uncurated);
  ok("uncurated falls back to the site confirmatory",
     JSON.stringify(fb.confirmatory) === JSON.stringify(today.confirmatory));
  ok("uncurated is flagged so the UI can label it", fb.pathologyCurated === false);
  ok("uncurated still carries the name for the label", fb.pathology === uncurated);
}

// --- 6: a shared pathology must not read identically at every site it appears at ---
// The sbSpine no-two-identical-lists rule, applied to diseases. A pathology present at ONE site is exempt
// (there is nothing to differentiate it from); one present at several must differentiate at least once,
// or the layer says no more than the site card it replaced.
{
  const sites = candidateSites();
  // Compare across distinct PLACES (level_part), not across sided site objects. left_X and right_X are
  // the same place for workup purposes — laterality never changes the investigation — so counting them as
  // two sites demands a differentiation that would be clinically meaningless. Corrected 2026-08-18 when
  // tranche 2 added the first plans sitting at exactly ONE CAUSES key; every tranche-1 plan happened to
  // span two or more, so the flaw never bit.
  const placesWith = name => {
    const seen = new Map();
    for (const s of sites) {
      const key = CAUSES[s.id] ? s.id : `${s.level}_${s.part}`;
      if (seen.has(key)) continue;
      if ((CAUSES[key] || []).some(c => c.name === name)) seen.set(key, s);
    }
    return [...seen.values()];
  };

  for (const name of Object.keys(PATHOLOGY_NEXT)) {
    const hosts = placesWith(name);
    if (hosts.length < 2) continue;
    const rendered = new Set(hosts.map(s => JSON.stringify(pathologyPlanFor(name, s))));
    ok(`\`${name}\` differentiates across its ${hosts.length} places`, rendered.size > 1,
       `identical text at all ${hosts.length} places — add bySite entries`);
  }
}

// --- 7: family() — one authored spine, several NAMED plans (spec 2026-08-18) ---
// dz() handles ONE name across many sites. family() handles SEVERAL names sharing a workup, which is what
// the must-not-miss set is full of (28 infarcts, 24 haemorrhages). A member diverges at one of three
// levels: slots (same workup, different anatomy), *Extra (same plus something), or a full override.
{
  const spine = {
    confirmatory: ["Image {level} urgently", "Establish the time of onset"],
    monitoring:   ["Watch {flavour}"],
    urgency: "emergency",
    referral: "Acute stroke pathway",
  };
  const fam = family("test-infarct", spine, {
    "A infarct": { slots: { level: "the brain", flavour: "conscious level" } },
    "B infarct": { slots: { level: "the cord", flavour: "the sensory level" },
                   confirmatoryExtra: ["Check the aorta"] },
    "C infarct": { slots: { level: "the brain", flavour: "conscious level" },
                   confirmatory: ["A completely different workup"], urgency: "urgent" },
  });

  ok("family emits one plan per member", Object.keys(fam).length === 3);
  ok("family records itself in the registry", FAMILIES["test-infarct"].length === 3);
  // Slots are applied at RENDER time, never at build time — pre-filling would consume the placeholders and
  // leave bySite nothing to override, which is the bug this asserts against.
  ok("the built plan keeps its placeholders for bySite to override",
     fam["A infarct"].confirmatory[0] === "Image {level} urgently");
  ok("the member's slots ride along on the plan", fam["A infarct"].slots.level === "the brain");
  const rendered = n => ({ ...fam[n], bySite: fam[n].bySite });
  const renderOf = (n) => {
    const p = rendered(n);
    const sl = { level: p.slots.level, flavour: p.slots.flavour };
    return p.confirmatory.map(x => x.replace(/\{([a-z]+)\}/g, (_, k) => sl[k]));
  };
  ok("a member interpolates its own slots when rendered",
     renderOf("A infarct")[0] === "Image the brain urgently");
  ok("members interpolate DIFFERENTLY",
     renderOf("B infarct")[0] === "Image the cord urgently");
  ok("confirmatoryExtra APPENDS to the spine",
     fam["B infarct"].confirmatory.length === 3 && fam["B infarct"].confirmatory[2] === "Check the aorta");
  ok("confirmatory REPLACES the spine outright",
     JSON.stringify(fam["C infarct"].confirmatory) === JSON.stringify(["A completely different workup"]));
  ok("a member inherits the spine's urgency", fam["A infarct"].urgency === "emergency");
  ok("a member may override urgency", fam["C infarct"].urgency === "urgent");
  ok("a member inherits the spine's referral", fam["A infarct"].referral === "Acute stroke pathway");
  ok("each plan carries its own name", fam["B infarct"].name === "B infarct");
  ok("monitoring carries its placeholder too", fam["A infarct"].monitoring[0] === "Watch {flavour}");

  // The fixture registered itself in the module-level FAMILIES. Remove it, so the real-content
  // invariants below see only real families — rather than exempting it by a name prefix, which would
  // silently excuse any future family that happened to be named the same way.
  delete FAMILIES["test-infarct"];
}

// --- 8: family invariants — a family is a CLINICAL CLAIM, not a string match ---
{
  for (const [label, names] of Object.entries(FAMILIES)) {
    ok(`family \`${label}\` has at least 3 members (${names.length})`, names.length >= 3,
       "two plans sharing a spine is two plans with extra indirection");
    // Compare what the READER SEES — the plan rendered at that member's own first host site. Comparing the
    // built objects would see the un-interpolated spine text and report every member as identical.
    const allSites = candidateSites();
    const firstHost = n => allSites.find(s =>
      (CAUSES[s.id] || CAUSES[`${s.level}_${s.part}`] || []).some(c => c.name === n));
    const rendered = names.map(n => {
      const h = firstHost(n);
      return JSON.stringify(h ? pathologyPlanFor(n, h) : PATHOLOGY_NEXT[n]);
    });
    ok(`family \`${label}\` has no two members emitting an identical plan`,
       new Set(rendered).size === rendered.length,
       "identical members mean the family is duplication wearing a hat");
  }
}

// --- 9: THE RED GATE — every must-not-miss has a workup ---
// THE RATCHET HAS RETIRED. It ran from 337 down to 0 across tranche 2, as a ceiling that could fall and
// never rise, because a plain end-state assertion would have failed for every authoring round. At 0 it
// becomes what it was always climbing towards: a HARD GATE.
//
// Its durable value starts now. A future red cause added to CAUSES with no workup behind it fails here
// immediately, which is exactly the hole tranche 1 left open and tranche 2 closed.
{
  const planned = new Set([...Object.keys(PATHOLOGY_NEXT), ...Object.keys(PATHOLOGY_ALIAS)]);
  const redNames = new Set();
  for (const list of Object.values(CAUSES)) for (const c of list) if (c.red) redNames.add(c.name);
  const unplanned = [...redNames].filter(n => !planned.has(n));

  ok(`RED GATE: every one of the ${redNames.size} must-not-miss causes has an authored workup`,
     unplanned.length === 0,
     `${unplanned.length} without a plan: ${unplanned.slice(0, 5).join(" ; ")}`);
}

// ---- TRANCHE 3: THE COVERAGE RATCHET ----
// Tranche 2 authored by DANGER and stopped when the red set closed. Tranche 3 goes for full coverage, one
// sieve category at a time (owner ruling, 2026-08-21), so it needs its own ratchet — same shape as the red
// one: a CEILING that falls with every round and may NEVER rise. It is a ceiling rather than
// "every cause has a plan" because that assertion would fail on every round until the last.
//
// REUSE IS EXHAUSTED, and that is what makes this tranche different in kind: 88% of the remaining names
// appear at exactly ONE site, and the best reuse left in the set is six. Tranche 1 bought 11 rows per
// plan, tranche 2 bought 2, and tranche 3 buys 1.18 — so the ceiling falls roughly one per plan authored,
// with no families to accelerate it.
const UNPLANNED_CEILING = 393;
{
  const planned = new Set([...Object.keys(PATHOLOGY_NEXT), ...Object.keys(PATHOLOGY_ALIAS)]);
  const names = new Set();
  for (const list of Object.values(CAUSES)) for (const c of list) names.add(c.name);
  const unplanned = [...names].filter(n => !planned.has(n));
  ok(`TRANCHE-3 RATCHET: unplanned causes (${unplanned.length}) is at or below the ceiling (${UNPLANNED_CEILING})`,
     unplanned.length <= UNPLANNED_CEILING,
     `${unplanned.length} unplanned — the ceiling may only ever fall`);

  const byCat = {};
  for (const list of Object.values(CAUSES)) for (const c of list)
    if (!planned.has(c.name)) (byCat[c.cat] ??= new Set()).add(c.name);
  const line = Object.entries(byCat).sort((a, b) => b[1].size - a[1].size)
    .map(([k, v]) => `${k} ${v.size}`).join(" · ");
  console.log(`\nREPORT  tranche 3 — ${unplanned.length} names unplanned: ${line}`);
}

// ---- REPORT (not an assertion): the red / non-red authoring split ----
// Tranche 2 targets the RED must-not-miss set, but a family is authored WHOLE (spec amendment
// 2026-08-18), so non-red members arrive as the seams of a family rather than as new scope. This line
// keeps that visible: if the non-red share ever looks like a second unplanned tranche rather than the
// edges of the first, that is the signal to stop and re-scope rather than to keep going quietly.
{
  const redNames = new Set(), otherNames = new Set();
  for (const l of Object.values(CAUSES)) for (const c of l) (c.red ? redNames : otherNames).add(c.name);
  for (const n of redNames) otherNames.delete(n);          // red anywhere counts as red
  const planned = new Set([...Object.keys(PATHOLOGY_NEXT), ...Object.keys(PATHOLOGY_ALIAS)]);
  const pr = [...planned].filter(n => redNames.has(n)).length;
  const pn = [...planned].filter(n => otherNames.has(n)).length;
  console.log(`\nREPORT  plans ${planned.size} = ${pr} red (of ${redNames.size}, ${redNames.size - pr} left) ` +
              `+ ${pn} non-red for family coherence`);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

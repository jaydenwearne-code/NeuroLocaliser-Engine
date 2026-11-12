// hemisphere-names.test.js — a dominant-hemisphere name never labels the non-dominant hemisphere (owner, 2026-11-12: "fix
// the nondominant labelling error for wernickes and brocas"). Broca's and Wernicke's areas are the DOMINANT hemisphere's
// language areas. The phonebook, PART_LABEL and the territory strings are keyed by PLACE, so a name written for one
// hemisphere shows on both unless the entry names each one. Found 2026-11-12: the non-dominant operculum (motor aprosodia
// alone) was titled "Broca's aphasia" with "…a dominant MCA stroke — time-critical.", and the non-dominant
// temporoparietal cortex read "(Wernicke's area)" on its Where line (its title was the duplicate-keys round's row D1).
import { candidateSites } from "../src/engine/inverse.js";
import { expectedFindings } from "../src/engine/forward.js";
import { BY_SITE, nameForSite } from "../src/data/syndromes.js";
import { PART_LABEL, NONDOMINANT_PART_LABEL, siteLabel, plainSiteName } from "../app/labels.js";

let pass = 0, fail = 0;
const log = [];
const ok = (label, cond, detail) => { log.push({ label, ok: !!cond, detail }); cond ? pass++ : fail++; };

const cs = candidateSites(), byId = id => cs.find(s => s.id === id);
const other = side => side === "left" ? "right" : "left";
const keyOf = s => BY_SITE[s.id] ? s.id : `${s.level}_${s.part}`;
// "Wernicke" alone is also Wernicke's encephalopathy (the thiamine warning), which is right on either side.
const DOMINANT_EPONYM = /Broca's|Wernicke's (area|aphasia)/;

// ---- 1. a place whose picture depends on dominance names each hemisphere ----
// A reviewed exception is a name that is true of both hemispheres.
const HEMISPHERE_NEUTRAL = {
  cortex_temporal: "names the lobe; its note gives verbal memory for the dominant side and non-verbal for the other",
};
// Open, not fixed: each needs a ruling, so it is listed here (and printed) rather than silently allowed.
const OPEN = {
  aphasia_subcortical_thalamic: "the non-dominant copy is the thalamus without its aphasia — name it, or stop offering it",
  aphasia_subcortical_striatocapsular: "the non-dominant copy is the striatum/capsule without its aphasia — name it, or stop offering it",
};
{
  const dependent = new Map(); // phonebook key -> a one-sided site whose picture changes with dominance (both non-empty)
  for (const s of cs) {
    if (s.side !== "left" && s.side !== "right") continue;
    const asDom = [...expectedFindings(s, { dominantSide: s.side })].sort().join(" ");
    const asNon = [...expectedFindings(s, { dominantSide: other(s.side) })].sort().join(" ");
    if (asDom && asNon && asDom !== asNon && !dependent.has(keyOf(s))) dependent.set(keyOf(s), s);
  }
  const named = k => { const e = BY_SITE[k]; return !!(e && e.dominant && e.nondominant); };
  const bad = [...dependent.keys()].filter(k => !named(k) && !HEMISPHERE_NEUTRAL[k] && !OPEN[k]);
  ok("every place whose picture depends on dominance names each hemisphere (or has a reviewed neutral name)", !bad.length, bad.join(", "));
  ok("the rule is not vacuous: it reaches the language, parietal and fusiform places and the MCA divisions",
     ["cortex_operculum", "cortex_temporoparietal", "cortex_parietal", "cortex_fusiform", "cortex_mca_superior", "cortex_mca_inferior"].every(k => dependent.has(k)),
     [...dependent.keys()].join(", "));
  const staleNeutral = Object.keys(HEMISPHERE_NEUTRAL).filter(k => !dependent.has(k) || named(k));
  ok("every neutral exception is still a dominance-dependent place with one name", !staleNeutral.length, staleNeutral.join(", "));
  const staleOpen = Object.keys(OPEN).filter(k => !dependent.has(k) || named(k));
  ok("every open item is still open (delete it once it is fixed)", !staleOpen.length, staleOpen.join(", "));
  for (const [k, why] of Object.entries(OPEN)) console.log(`OPEN  ${k}: ${why}`);
}

// ---- 2. no non-dominant card names Broca's or Wernicke's; the dominant side keeps both ----
{
  const bad = [];
  let read = 0;
  for (const dominantSide of ["left", "right"]) for (const s of cs) {
    if (s.side !== other(dominantSide) || ![...expectedFindings(s, { dominantSide })].length) continue; // reachable, non-dominant
    read++;
    const p = plainSiteName(s, { dominantSide }), n = nameForSite(s, { dominantSide });
    for (const [field, text] of Object.entries({ title: p.name, place: p.place, subtitle: p.sub, red: n.red || "" }))
      if (DOMINANT_EPONYM.test(text)) bad.push(`${s.id} (${dominantSide} dominant) ${field}: ${text}`);
  }
  ok("no non-dominant site's title, place, subtitle or red flag names Broca's or Wernicke's area or aphasia — with either hemisphere dominant",
     !bad.length && read > 100, bad.length ? bad.slice(0, 4).join(" | ") : `${read} non-dominant sites read`);
  const dom = { dominantSide: "left" }, rightDom = { dominantSide: "right" };
  const op = plainSiteName(byId("left_cortex_operculum"), dom), tp = plainSiteName(byId("left_cortex_temporoparietal"), dom);
  ok("the dominant operculum keeps Broca's name and area", op.name === "Broca's aphasia (non-fluent; repetition impaired)" && op.place === "Left frontal operculum (Broca's area)", `${op.name} | ${op.place}`);
  ok("the dominant temporoparietal cortex keeps Wernicke's name and area",
     tp.name === "Wernicke's aphasia (fluent; comprehension + repetition impaired)" && tp.place === "Left posterior superior temporal gyrus (Wernicke's area)", `${tp.name} | ${tp.place}`);
  ok("with the right hemisphere dominant, the right operculum is Broca's and the left is not",
     plainSiteName(byId("right_cortex_operculum"), rightDom).place === "Right frontal operculum (Broca's area)"
     && plainSiteName(byId("left_cortex_operculum"), rightDom).place === "Left frontal operculum"
     && nameForSite(byId("left_cortex_operculum"), rightDom).name === "Motor aprosodia (non-dominant frontal operculum)");
}

// ---- 3. the non-dominant operculum and temporoparietal cortex, as they read ----
{
  const dom = { dominantSide: "left" };
  const r = byId("right_cortex_operculum"), n = nameForSite(r, dom), p = plainSiteName(r, dom);
  ok("the non-dominant operculum is named motor aprosodia, not Broca's aphasia", n.name === "Motor aprosodia (non-dominant frontal operculum)" && p.name === n.name, p.name);
  ok("…its Where line names the gyrus without Broca's area", p.place === "Right frontal operculum", p.place);
  ok("…its red flag is not the dominant MCA stroke flag",
     n.red === "New flat, unmodulated speech is easily mistaken for depression — it is a focal sign that needs imaging.", n.red);
  ok("…and its note describes motor aprosodia", /^Non-dominant frontal operculum/.test(n.note) && /flat, unmodulated speech/i.test(n.note) && !/aphasia/i.test(n.note), n.note);
  const t = plainSiteName(byId("right_cortex_temporoparietal"), dom);
  ok("the non-dominant temporoparietal Where line names the gyrus without Wernicke's area", t.place === "Right posterior superior temporal gyrus", t.place);
}

// ---- 4. the tables keyed by place carry no dominant eponym the other side would inherit ----
{
  const terr = cs.filter(s => DOMINANT_EPONYM.test(s.territory || "")).map(s => `${s.id}: ${s.territory}`);
  ok("no territory string names Broca's or Wernicke's area (a territory is the same on both sides)", !terr.length, terr.slice(0, 3).join(" | "));
  const keys = Object.keys(NONDOMINANT_PART_LABEL);
  ok("every non-dominant label overrides a real PART_LABEL entry that names the dominant eponym",
     keys.length === 2 && keys.every(k => PART_LABEL[k] && DOMINANT_EPONYM.test(PART_LABEL[k])), keys.join(", "));
  ok("…and is that entry without the eponym, nothing else", keys.every(k => !DOMINANT_EPONYM.test(NONDOMINANT_PART_LABEL[k]) && PART_LABEL[k].startsWith(`${NONDOMINANT_PART_LABEL[k]} (`)));
  const leftover = Object.entries(PART_LABEL).filter(([k, v]) => DOMINANT_EPONYM.test(v) && !NONDOMINANT_PART_LABEL[k]).map(([k]) => k);
  ok("every PART_LABEL entry naming Broca's or Wernicke's has its non-dominant label", !leftover.length, leftover.join(", "));
  ok("a label asked for with no side still reads PART_LABEL", siteLabel({ level: "cortex", part: "operculum" }) === "frontal operculum (Broca's area)");
}

console.log("\nNeuroLocaliser — HEMISPHERE NAMES\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}${r.detail ? "  → " + r.detail : ""}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);

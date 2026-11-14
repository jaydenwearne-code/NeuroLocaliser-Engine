// nondominant-content.test.js — the non-dominant hemisphere's What and Next cards describe ITS syndrome, not the dominant
// one's (owner-ruled 2026-11-12: rows K1–K5, and content round 1, rows O1–O13, T1–T11, M1–M3, F1–F2; spec
// docs/superpowers/specs/2026-11-12-nondominant-content-design.md). The cause lists (CAUSES), the site workups (NEXT) and the
// plans' per-place wording (bySite) are keyed by PLACE, so both hemispheres shared them: a non-dominant operculum's card said
// "Characterise the aphasia…" and "…especially common in Broca's aphasia". A cause may now carry `hemisphere` (it exists on that
// side only) and any text may be `{ dominant, nondominant }` (the phonebook's own variant shape), read for the card's
// hemisphere by nameForSite's rule.
import { candidateSites } from "../src/engine/inverse.js";
import { expectedFindings } from "../src/engine/forward.js";
import { CAUSES, causesFor } from "../src/data/causes.js";
import { NEXT, nextStepsFor, pathologyNextStepsFor } from "../src/data/nextSteps.js";
import { PATHOLOGY_NEXT } from "../src/data/pathologyNextSteps.js";
import { hemisphereOf, sideText } from "../src/model/hemisphere.js";

let pass = 0, fail = 0;
const log = [];
const ok = (label, cond, detail) => { log.push({ label, ok: !!cond, detail }); cond ? pass++ : fail++; };

const cs = candidateSites(), byId = id => cs.find(s => s.id === id);
const other = side => side === "left" ? "right" : "left";
const isVariant = v => !!v && typeof v === "object" && !Array.isArray(v) && "dominant" in v && "nondominant" in v;

// ---- 1. the mechanism ----
ok("hemisphereOf: the dominant side's site is dominant, the other's non-dominant, and it follows the dominance",
   hemisphereOf(byId("left_cortex_operculum"), "left") === "dominant" && hemisphereOf(byId("right_cortex_operculum"), "left") === "nondominant"
   && hemisphereOf(byId("right_cortex_operculum"), "right") === "dominant" && hemisphereOf(byId("left_cortex_operculum")) === "dominant");
ok("hemisphereOf: a bilateral site sits in no one hemisphere", hemisphereOf(cs.find(s => s.side === "bilateral"), "left") === null);
ok("sideText: a two-version text reads its hemisphere; no hemisphere reads the dominant one; plain text passes through",
   sideText({ dominant: "D", nondominant: "N" }, "dominant") === "D" && sideText({ dominant: "D", nondominant: "N" }, "nondominant") === "N"
   && sideText({ dominant: "D", nondominant: "N" }, null) === "D" && sideText("plain", "nondominant") === "plain");

// ---- 2. the reviewed snapshot (the gate): every hemisphere-tagged cause and every two-version line, word for word ----
// No wording test can tell a claim from a contrast, so the ruled content is pinned here: a change to any of it is a change to
// what the owner ruled, and must come back for a ruling.
const TAGS = [
  ["CAUSES.cortex_fusiform · Developmental dyslexia", "dominant"],
  ["CAUSES.cortex_fusiform · Developmental prosopagnosia", "nondominant"],
  ["CAUSES.cortex_mca_inferior · Focal seizure", "nondominant"],
  ["CAUSES.cortex_mca_inferior · Focal temporal seizure with postictal aphasia", "dominant"],
  ["CAUSES.cortex_operculum · Focal seizure with speech arrest", "dominant"],
  ["CAUSES.cortex_temporoparietal · Postictal aphasia after a focal temporal seizure", "dominant"],
];
const LINES = [
  // the operculum (O1–O3, O7–O13)
  ["CAUSES.cortex_operculum · MCA (superior division) infarct · feature",
   "Abrupt non-fluent aphasia with face/arm weakness and gaze deviation toward the lesion",
   "Abrupt flat, unmodulated speech (motor aprosodia) with face/arm weakness and gaze deviation toward the lesion"],
  ["CAUSES.cortex_operculum · Cerebral abscess · feature",
   "Fever and headache with a rapidly progressive non-fluent aphasia and raised inflammatory markers; a ring-enhancing frontal lesion — hunt for the source in the sinuses, teeth, heart or a right-to-left shunt",
   "Fever and headache with rapidly progressive face/arm weakness and raised inflammatory markers; a ring-enhancing frontal lesion — hunt for the source in the sinuses, teeth, heart or a right-to-left shunt"],
  ["CAUSES.cortex_operculum · Demyelination · feature",
   "A younger patient whose non-fluent speech difficulty evolves over days, with prior demyelinating episodes and lesions disseminated in time and space",
   "A younger patient whose weakness or flat, unmodulated speech evolves over days, with prior demyelinating episodes and lesions disseminated in time and space"],
  ["NEXT.cortex_operculum · investigations[0]",
   "Urgent CT head then MRI (DWI) — an acute non-fluent aphasia is a stroke until proven otherwise",
   "Urgent CT head then MRI (DWI) — acute flat speech with face/arm weakness is a stroke until proven otherwise"],
  ["NEXT.cortex_operculum · immediate[1]",
   "Characterise the aphasia: effortful, non-fluent speech with relatively preserved comprehension, and the patient is usually FRUSTRATED AND AWARE — which is distressing and needs acknowledging",
   "Characterise the speech: words, grammar and comprehension are intact but the tone is flat and unmodulated (motor aprosodia) — easily mistaken for low mood, so ask how the patient feels rather than reading it from their voice"],
  ["NEXT.cortex_operculum · monitoring[0]",
   "SPEECH AND LANGUAGE THERAPY early, for communication and swallow safety",
   "SPEECH AND LANGUAGE THERAPY early, for swallow safety and any dysarthria"],
  ["NEXT.cortex_operculum · monitoring[1]",
   "Give the patient TIME and use yes/no questions and writing — insight is preserved, so rushing them causes real distress",
   "Tell staff and family that the flat tone is the deficit, not the patient's mood or attitude"],
  ["NEXT.cortex_operculum · monitoring[2]",
   "Screen for post-stroke depression, which is especially common in Broca's aphasia",
   "Screen for post-stroke depression by asking directly — flat speech can both hide it and imitate it"],
  ["PLAN Tumour (glioma / metastasis) · bySite.cortex_operculum.level",
   "language in full — fluency, comprehension, repetition and naming — plus face and arm power",
   "face and arm power and the tone of speech"],
  ["PLAN Tumour (glioma / metastasis) · bySite.cortex_operculum.flavour",
   "this is dominant-hemisphere language cortex, so awake mapping and functional imaging bear directly on what can be removed; the language assessment before surgery is a baseline as well as a description",
   "this is non-dominant frontal cortex beside the face-arm motor strip, so motor mapping bears directly on what can be removed; the pre-operative examination of power is a baseline as well as a description"],
  // the temporoparietal cortex (T1–T4, T6–T11)
  ["CAUSES.cortex_temporoparietal · MCA inferior division infarct · feature",
   "Sudden FLUENT but empty speech with impaired comprehension and repetition, and no weakness — the absence of weakness is why it is so often mistaken for confusion or a psychiatric presentation, and the time window is lost",
   "Sudden confusion or agitation with neglect and a field cut, and no weakness — the absence of weakness is why it is so often mistaken for delirium or a psychiatric presentation, and the time window is lost"],
  ["CAUSES.cortex_temporoparietal · Delirium · feature",
   "Fluctuating attention with a systemic trigger — unlike Wernicke's aphasia, comprehension and naming are not SELECTIVELY lost in an otherwise fully alert patient",
   "Fluctuating attention with a systemic trigger — a non-dominant temporoparietal stroke imitates it, so look for a CONSISTENT one-sided neglect and a field cut before accepting delirium"],
  ["CAUSES.cortex_temporoparietal · Glioma / metastasis · feature",
   "Language failure progressing over weeks, often with seizures and headache",
   "Neglect, a field cut or a change in behaviour progressing over weeks, often with seizures and headache"],
  ["CAUSES.cortex_temporoparietal · Transverse or sigmoid sinus thrombosis (vein of Labbe) · feature",
   "Fluent aphasia with headache and seizures, with temporal oedema or haemorrhage that does NOT respect the MCA territory — image the VENOUS sinuses, because the arterial study will be normal and the diagnosis is treatable",
   "Headache and seizures with confusion or neglect, and temporal oedema or haemorrhage that does NOT respect the MCA territory — image the VENOUS sinuses, because the arterial study will be normal and the diagnosis is treatable"],
  ["NEXT.cortex_temporoparietal · investigations[0]",
   "Urgent CT head then MRI (DWI) — fluent aphasia WITHOUT weakness is a stroke that is repeatedly missed as confusion",
   "Urgent CT head then MRI (DWI) — acute confusion with neglect and NO weakness is a stroke that is repeatedly missed as delirium"],
  ["NEXT.cortex_temporoparietal · immediate[1]",
   "Test comprehension, repetition and naming separately to characterise the aphasia",
   "Test for neglect and extinction, and whether the patient can tell the emotion in a spoken sentence — the words are understood but the tone is not (sensory aprosodia)"],
  ["NEXT.cortex_temporoparietal · monitoring[0]",
   "SPEECH AND LANGUAGE THERAPY assessment early, for both communication and swallow safety",
   "Swallow screen and SPEECH AND LANGUAGE THERAPY for swallow safety; occupational therapy for neglect before mobilising"],
  ["NEXT.cortex_temporoparietal · monitoring[1]",
   "Communication strategies for staff and family — the patient may not understand explanations or consent discussions",
   "The patient may deny the deficit (anosognosia) and miss the tone of what is said — check understanding and capacity directly"],
  ["PLAN MCA inferior division infarct · bySite.cortex_temporoparietal.level",
   "comprehension and repetition — fluent but empty speech",
   "neglect and the visual field"],
  ["PLAN Delirium · bySite.cortex_temporoparietal.flavour",
   "delirium imitates a fluent aphasia — but the language is INCOHERENT rather than paraphasic, and the giveaway is that ATTENTION fails first: test it before concluding aphasia",
   "an acute confusional state imitates a non-dominant temporoparietal stroke, and both produce neglect-like inattention — the fluctuation over hours is what separates them"],
  // the MCA inferior division (M3)
  ["CAUSES.cortex_mca_inferior · Delirium · feature",
   "Fluctuating attention with a systemic trigger (infection, drugs, metabolic upset) — alertness waxes and wanes, whereas Wernicke's aphasia selectively destroys comprehension and naming in a fully alert patient",
   "Fluctuating attention with a systemic trigger (infection, drugs, metabolic upset) — alertness waxes and wanes, whereas a non-dominant inferior-division stroke gives a CONSISTENT one-sided neglect in a fully alert patient"],
];
const scanned = () => {
  const tags = [], lines = [];
  for (const [place, list] of Object.entries(CAUSES)) for (const c of list) {
    if (c.hemisphere) tags.push([`CAUSES.${place} · ${c.name}`, c.hemisphere]);
    if (isVariant(c.feature)) lines.push([`CAUSES.${place} · ${c.name} · feature`, c.feature.dominant, c.feature.nondominant]);
  }
  for (const [place, plan] of Object.entries(NEXT)) {
    for (const tier of ["immediate", "investigations", "confirmatory", "monitoring"])
      (plan[tier] || []).forEach((l, i) => { if (isVariant(l)) lines.push([`NEXT.${place} · ${tier}[${i}]`, l.dominant, l.nondominant]); });
    if (isVariant(plan.referral)) lines.push([`NEXT.${place} · referral`, plan.referral.dominant, plan.referral.nondominant]);
  }
  for (const [name, plan] of Object.entries(PATHOLOGY_NEXT)) {
    for (const [slot, v] of Object.entries(plan.slots || {})) if (isVariant(v)) lines.push([`PLAN ${name} · slots.${slot}`, v.dominant, v.nondominant]);
    for (const [place, slots] of Object.entries(plan.bySite || {})) for (const [slot, v] of Object.entries(slots || {}))
      if (isVariant(v)) lines.push([`PLAN ${name} · bySite.${place}.${slot}`, v.dominant, v.nondominant]);
  }
  return { tags, lines };
};
{
  const now = scanned(), key = r => JSON.stringify(r), sorted = rows => rows.map(key).sort();
  const diff = (a, b) => ({ added: a.filter(x => !b.includes(x)), removed: b.filter(x => !a.includes(x)) });
  const t = diff(sorted(now.tags), sorted(TAGS)), l = diff(sorted(now.lines), sorted(LINES));
  ok("snapshot: the 6 hemisphere-tagged causes are exactly the ruled ones (O5, T5, M1, M2, F1, F2)", !t.added.length && !t.removed.length,
     `added ${t.added.join(" | ") || "—"}; removed ${t.removed.join(" | ") || "—"}`);
  ok("snapshot: the 21 two-version lines are exactly the ruled ones, word for word", now.lines.length === 21 && !l.added.length && !l.removed.length,
     `${now.lines.length} lines; added ${l.added.slice(0, 2).join(" | ").slice(0, 300) || "—"}; removed ${l.removed.slice(0, 2).join(" | ").slice(0, 300) || "—"}`);
}

// ---- 3. structure ----
const dependent = new Set(); // places whose picture depends on dominance
for (const s of cs) {
  if (s.side !== "left" && s.side !== "right") continue;
  const a = [...expectedFindings(s, { dominantSide: s.side })].sort().join(" "), b = [...expectedFindings(s, { dominantSide: other(s.side) })].sort().join(" ");
  if (a && b && a !== b) dependent.add(`${s.level}_${s.part}`);
}
{
  const now = scanned(), placeOf = loc => loc.split(" · ")[0].replace(/^CAUSES\.|^NEXT\./, "").replace(/^PLAN .*/, "");
  const planPlaces = now.lines.filter(([loc]) => loc.startsWith("PLAN")).map(([loc]) => loc.match(/bySite\.([^.]+)\./)?.[1]);
  const places = [...now.tags.map(([loc]) => placeOf(loc)), ...now.lines.filter(([loc]) => !loc.startsWith("PLAN")).map(([loc]) => placeOf(loc)), ...planPlaces];
  const stray = [...new Set(places)].filter(p => !dependent.has(p));
  ok("a hemisphere tag or two-version text sits only at a place whose picture depends on dominance", !stray.length && places.length > 20, stray.join(", ") || `${places.length} entries`);
  const thin = [];
  for (const p of ["cortex_operculum", "cortex_temporoparietal", "cortex_mca_inferior", "cortex_fusiform"]) for (const side of ["left", "right"]) {
    const s = byId(`${side}_${p}`), r = causesFor(s, { dominantSide: "left" }), n = r.all.length + (r.demoted || []).length;
    if (n < 6) thin.push(`${s.id} (${n})`);
  }
  ok("each side of every place with hemisphere content keeps at least 6 causes (the depth bar, per side)", !thin.length, thin.join(", "));
  const unplanned = [];
  for (const p of ["cortex_operculum", "cortex_temporoparietal", "cortex_mca_inferior", "cortex_fusiform"]) for (const side of ["left", "right"]) {
    const s = byId(`${side}_${p}`);
    for (const c of causesFor(s, { dominantSide: "left" }).all) if (!pathologyNextStepsFor(s, c.name, { dominantSide: "left" }).pathologyCurated) unplanned.push(`${s.id}: ${c.name}`);
  }
  ok("every cause on each side has an authored plan", !unplanned.length, unplanned.join(" | "));
}

// ---- 4. what each card shows ----
const L = { dominantSide: "left" }, R = { dominantSide: "right" };
// the text a unit shows for a site and dominance
const shown = (loc, site, opts) => {
  let m;
  if ((m = loc.match(/^CAUSES\.(\S+) · (.+) · feature$/))) {
    const r = causesFor(site, opts); return ([...r.all, ...(r.demoted || [])].find(c => c.name === m[2]) || {}).feature;
  }
  if ((m = loc.match(/^NEXT\.(\S+) · (\w+)\[(\d+)\]$/))) return (nextStepsFor(site, opts)[m[2]] || [])[+m[3]];
  if ((m = loc.match(/^PLAN (.+) · bySite\.(\S+)\.(\w+)$/))) return JSON.stringify(pathologyNextStepsFor(site, m[1], opts));
  return undefined;
};
{
  const bad = [];
  for (const [loc, dom, non] of LINES) {
    const place = loc.match(/(?:CAUSES|NEXT)\.(\S+) ·/)?.[1] || loc.match(/bySite\.([^.]+)\./)?.[1];
    for (const [opts, domSite, nonSite] of [[L, `left_${place}`, `right_${place}`], [R, `right_${place}`, `left_${place}`]]) {
      const d = shown(loc, byId(domSite), opts), n = shown(loc, byId(nonSite), opts);
      if (loc.startsWith("PLAN")) {
        if (!(String(d).includes(dom) && !String(d).includes(non))) bad.push(`${loc} on ${domSite} (${opts.dominantSide} dominant)`);
        if (!(String(n).includes(non) && !String(n).includes(dom))) bad.push(`${loc} on ${nonSite} (${opts.dominantSide} dominant)`);
      } else {
        if (d !== dom) bad.push(`${loc} on ${domSite} (${opts.dominantSide} dominant): ${String(d).slice(0, 60)}`);
        if (n !== non) bad.push(`${loc} on ${nonSite} (${opts.dominantSide} dominant): ${String(n).slice(0, 60)}`);
      }
    }
  }
  ok("every two-version line shows its own hemisphere's text on each side, with either hemisphere dominant", !bad.length, `${bad.length}: ${bad.slice(0, 3).join(" | ")}`);
}
{
  const bad = [];
  for (const [loc, hemi] of TAGS) {
    const [, place, name] = loc.match(/^CAUSES\.(\S+) · (.+)$/);
    for (const [opts, side] of [[L, "left"], [L, "right"], [R, "left"], [R, "right"]]) {
      const s = byId(`${side}_${place}`), r = causesFor(s, opts), has = [...r.all, ...(r.demoted || [])].some(c => c.name === name);
      if (has !== (hemisphereOf(s, opts.dominantSide) === hemi)) bad.push(`${name} ${has ? "on" : "missing from"} ${s.id} (${opts.dominantSide} dominant)`);
    }
  }
  ok("a hemisphere-tagged cause is listed on its own side only, with either hemisphere dominant", !bad.length, bad.join(" | "));
}
{ // Anything on a non-dominant card at these places that names the aphasia must also name the other side (a both-sides line).
  const bad = [], STRONG = /aphasi|\bBroca|Wernicke's/i, BOTH = /neglect|non-?dominant|aprosod/i;
  for (const p of ["cortex_operculum", "cortex_temporoparietal", "cortex_mca_inferior"]) for (const [opts, side] of [[L, "right"], [R, "left"]]) {
    const s = byId(`${side}_${p}`), r = causesFor(s, opts), causes = [...r.all, ...(r.demoted || [])];
    const texts = [...causes.flatMap(c => [c.name, c.feature]), ...["immediate", "investigations", "confirmatory", "monitoring"].flatMap(t => nextStepsFor(s, opts)[t] || [])];
    for (const c of causes) { const pl = pathologyNextStepsFor(s, c.name, opts); texts.push(...(pl.confirmatory || []), ...(pl.monitoring || [])); }
    for (const t of texts) if (typeof t === "string" && STRONG.test(t) && !BOTH.test(t)) bad.push(`${s.id}: ${t.slice(0, 90)}`);
  }
  ok("no non-dominant card at the language places names the aphasia unless the line names both sides", !bad.length, `${bad.length}: ${bad.slice(0, 3).join(" | ")}`);
}
{ // the new content (O6, M2, F2): present where ruled, with a plan of its own at that place
  const op = byId("right_cortex_operculum"), mi = byId("right_cortex_mca_inferior"), fu = byId("left_cortex_fusiform");
  const has = (s, name) => [...causesFor(s, L).all, ...(causesFor(s, L).demoted || [])].some(c => c.name === name);
  ok("O6: Todd's paresis is a cause at the operculum on both sides", has(op, "Focal motor seizure with Todd's paresis") && has(byId("left_cortex_operculum"), "Focal motor seizure with Todd's paresis"));
  const plan = (s, n) => JSON.stringify(pathologyNextStepsFor(s, n, L));
  ok("O6: its plan has an operculum entry of its own",
     plan(op, "Focal motor seizure with Todd's paresis").includes("an opercular focus jerks the face and mouth")
     && plan(op, "Focal motor seizure with Todd's paresis") !== plan(byId("right_cortex_mca_superior"), "Focal motor seizure with Todd's paresis"));
  ok("M2: the non-dominant MCA inferior division lists a focal seizure, with a plan entry of its own",
     has(mi, "Focal seizure") && plan(mi, "Focal seizure").includes("confusion with neglect after a seizure imitates a non-dominant inferior-division stroke"));
  ok("F2: the dominant fusiform lists developmental dyslexia, with an authored routine plan",
     has(fu, "Developmental dyslexia") && pathologyNextStepsFor(fu, "Developmental dyslexia", L).pathologyCurated
     && pathologyNextStepsFor(fu, "Developmental dyslexia", L).urgency === "routine"
     && plan(fu, "Developmental dyslexia").includes("in pure alexia they can write but not read it"));
}

console.log("\nNeuroLocaliser — NON-DOMINANT CONTENT\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}${r.detail ? "  → " + r.detail : ""}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);

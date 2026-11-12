// pressure-follows.test.js — pressure follows the cause (owner-ruled 2026-11-10; spec
// docs/superpowers/specs/2026-11-09-pressure-follows-cause-design.md). Papilloedema demotes the causes that cannot raise the
// intracranial pressure, the plan follows the cause the What line names, and where nothing at the place can raise it the card
// follows the pressure itself. Pins rows 1–18 of round 1. Run: node test/pressure-follows.test.js
import { solve, candidateSites, isNormalToken, INTRACRANIAL_LEVELS } from "../src/engine/inverse.js";
import { expectedFindings } from "../src/engine/forward.js";
import { CAUSES, causesFor, leadingCause, combinedCauses } from "../src/data/causes.js";
import * as CZ from "../src/data/causes.js";
import { sitePlan, nextStepsFor, onsetFollows, pathologyNextStepsFor, resolveUrgency } from "../src/data/nextSteps.js";
import * as NX from "../src/data/nextSteps.js";
import { pathologyPlanFor } from "../src/data/pathologyNextSteps.js";
import { PRESSURE_REACHES } from "../src/model/compartments.js";
import * as ANS from "../app/answer.js";

let pass = 0, fail = 0;
const ok = (label, cond, detail = "") => { cond ? pass++ : fail++; console.log((cond ? "PASS  " : "FAIL  ") + label + (cond ? "" : `  ${detail}`)); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const T = s => new Set(s.split(/\s+/).filter(Boolean));
const SITE = Object.fromEntries(candidateSites().map(s => [s.id, s]));
const P = "papilloedema@none";
const ONSETS = [undefined, "hyperacute", "acute", "subacute", "chronic"];
// Read from the module namespaces, so a missing export fails its assertions instead of the whole suite.
const canRaise = CZ.canRaisePressure || (() => null);
const demotesAt = CZ.pressureDemotesAt || (() => null);
const pressureFollows = NX.pressureFollows || (() => null);
const pressureLeads = ANS.pressureLeads || (() => null);
const followNote = ANS.followNote || (() => "");
const demotionReason = ANS.demotionReason || (() => "");
const leadOf = (site, opts = {}) => (leadingCause(causesFor(site, opts).all) || {}).name || null;
const keyOf = s => CAUSES[s.id] ? s.id : `${s.level}_${s.part}`;
// The places papilloedema keeps in play — the compartment filter's own test — one per kind (left and right merged).
const INPLAY = candidateSites().filter(s => INTRACRANIAL_LEVELS.has(s.level) || PRESSURE_REACHES.has(`${s.level}|${s.part}`));
const KINDS = []; { const seen = new Set(); for (const s of INPLAY) { const k = s.id.replace(/^(left|right)_/, ""); if (!seen.has(k)) { seen.add(k); KINDS.push(s); } } }
// The answer card for a picture, as app.js builds it: the count leaves out the papilloedema and any explicit normal.
const card = (toks, onset = "") => {
  const tokens = T(toks), r = solve(tokens);
  const sel = r.display.find(x => x.site.id === r.defaultSite) || r.display[0];
  const total = [...tokens].filter(t => !t.startsWith("papilloedema@") && !isNormalToken(t)).length;
  return sel ? ANS.answerFor({ r, sel, total, tokens, onset, course: "", dominant: "left", sensoryLevel: "",
    pinned: new Set(), scope: "site", selectedPathology: undefined, selectedEntity: undefined }) : null;
};

// ---- A. Which causes can raise the pressure (rows 2–7) ----
ok("row 2: CAN_RAISE_PRESSURE is one table: the category defaults and two name patterns",
   !!CZ.CAN_RAISE_PRESSURE && [...CZ.CAN_RAISE_PRESSURE.categories].sort().join() === "infective,neoplastic,traumatic"
   && CZ.CAN_RAISE_PRESSURE.can instanceof RegExp && CZ.CAN_RAISE_PRESSURE.cannot instanceof RegExp);
for (const [name, cat, want, why] of [
  ["Small-vessel lacunar infarct", "vascular", false, "row 3: a lacune cannot"],
  ["Intracerebral haemorrhage", "vascular", true, "row 4: bleeding can"],
  ["Superior sagittal sinus thrombosis", "vascular", true, "row 4: the venous outflow can"],
  ["Dural arteriovenous fistula", "vascular", true, "row 4: a dural fistula can"],
  ["Small pontine haemorrhage", "vascular", false, "row 4: a small pontine bleed cannot"],
  ["Malignant MCA infarction (space-occupying oedema)", "vascular", true, "row 5: a named space-occupying infarct can"],
  ["Large MCA territory (or ICA) infarct", "vascular", false, "row 5: a large territory infarct cannot until named as swelling"],
  ["Proximal MCA (M1) / carotid-T occlusion", "vascular", false, "row 5: a carotid-T occlusion cannot"],
  ["PICA / vertebral artery occlusion", "vascular", true, "row 5: a PICA infarct (the cerebellum swells) can"],
  ["Cerebellar infarct (SCA / PICA)", "vascular", true, "row 5: a cerebellar infarct can"],
  ["AICA territory infarct", "vascular", false, "row 5: AICA cannot"],
  ["Hypoxic-ischaemic brain injury", "metabolic", false, "row 6: hypoxic-ischaemic injury cannot"],
  ["Cardiac arrest / profound global hypoperfusion", "vascular", false, "row 6: global hypoperfusion cannot"],
  ["Metabolic or toxic encephalopathy", "metabolic", false, "row 3: a metabolic encephalopathy cannot"],
  // re-ruled by the owner 2026-11-11: PRES cannot (its pressure is usually normal; the discs beside it are hypertensive)
  ["Posterior reversible encephalopathy syndrome (PRES)", "metabolic", false, "row 4, re-ruled 2026-11-11: PRES cannot"],
  ["PRES (posterior reversible encephalopathy)", "metabolic", false, "row 4, re-ruled 2026-11-11: …in either spelling"],
  ["Wernicke's encephalopathy", "metabolic", false, "row 4: Wernicke's cannot"],
  ["Demyelination", "inflammatory", false, "row 3: a demyelinating plaque cannot"],
  ["Neurosarcoidosis", "inflammatory", true, "row 4: neurosarcoidosis can"],
  ["Glioma / metastasis", "neoplastic", true, "row 3: a tumour can"],
  ["Small metastasis / glioma", "neoplastic", true, "row 4: a 'small' tumour can"],
  ["Skull base tumour or nasopharyngeal carcinoma", "neoplastic", false, "row 4: a corridor tumour cannot"],
  ["Paraneoplastic cerebellar degeneration", "neoplastic", false, "row 4: a paraneoplastic syndrome cannot"],
  ["Herpes simplex encephalitis", "infective", true, "row 3: an encephalitis can"],
  ["Sepsis or systemic infection", "infective", false, "row 4: sepsis cannot"],
  ["Traumatic brain injury", "traumatic", true, "row 3: a brain injury can"],
  ["Head trauma", "traumatic", false, "row 4: head trauma at a nerve cannot"],
  ["Obstructive hydrocephalus / shunt failure", "congenital", true, "row 4: obstructive hydrocephalus can"],
  ["Normal pressure hydrocephalus", "congenital", false, "row 4: normal pressure cannot"],
  ["Hypoglycaemia", "mimic", false, "row 3: a mimic cannot"],
  ["Parkinson's disease", "degenerative", false, "row 3: a degeneration cannot"],
]) ok(`${why}: ${name}`, canRaise({ name, cat }) === want);
ok("row 7: the pressure demotes inside the skull and on the nerve courses it reaches, never at the retina or the cord",
   demotesAt(SITE.left_subcortex_corona_radiata) === true && demotesAt(SITE.left_skull_base_vi_cisternal) === true
   && demotesAt(SITE.left_visual_pathway_retina) === false && demotesAt(SITE.bilateral_cord_transverse) === false);
{ // THE SNAPSHOT (row 21): every cause at a place papilloedema keeps in play, and the names that can raise the pressure. A new,
  // renamed or reclassified cause there fails here until someone looks at it — the review is Appendix A of the spec.
  const keys = new Set(INPLAY.map(keyOf)), names = new Set(), canNames = new Set(); let rows = 0, can = 0;
  for (const k of keys) for (const c of CAUSES[k] || []) { rows++; names.add(c.name); if (canRaise(c)) { can++; canNames.add(c.name); } }
  // Re-pinned 2026-11-11 on the owner's rulings in the integration: the top of the basilar's causes join the in-play lists (deep
  // cerebral venous thrombosis can; the embolism, basilar occlusion, dissection, arrest, CJD and NCSE cannot), and PRES cannot
  // (row 4 re-ruled).
  ok("row 21: the in-play cause lists hold 655 rows (438 names); 262 rows can raise the pressure",
     keys.size === 100 && rows === 655 && names.size === 438 && can === 262, `${keys.size} lists, ${rows} rows, ${names.size} names, ${can} can`);
  const CAN = ["ACA vasospasm after subarachnoid haemorrhage","Acute disseminated encephalomyelitis (ADEM)","Aneurysm or deep haemorrhage","Anterior communicating artery aneurysm (rupture ± vasospasm)","Anterior communicating artery aneurysm rupture","Arteriovenous malformation","Basal meningitis (tuberculous, carcinomatous or fungal)","Bilateral thalamic glioma","Bilateral traumatic or hypoxic injury","Bilateral tumour or metastases","Brainstem abscess","Brainstem abscess or tuberculoma","Brainstem encephalitis (Listeria, enterovirus)","Brainstem encephalitis / meningoencephalitis","Brainstem encephalitis or tuberculoma","Brainstem glioma","Brainstem haemorrhage","Brainstem haemorrhage or cavernoma","Brainstem or cerebellar haemorrhage / cavernoma","Brainstem tumour or trauma","Butterfly glioma or lymphoma","Cavernous sinus thrombosis","Cerebellar / brainstem stroke (PICA / AICA)","Cerebellar abscess","Cerebellar abscess or tuberculoma","Cerebellar haemorrhage","Cerebellar infarct (PICA)","Cerebellar infarct (SCA / PICA)","Cerebellar infarct (vermian)","Cerebellar malformation (Dandy-Walker, vermian hypoplasia)","Cerebellar or brainstem infarct","Cerebellopontine angle tumour","Cerebellopontine angle tumour (vestibular schwannoma, meningioma)","Cerebral abscess","Cerebral abscess or empyema","Chiari I malformation","Cortical vein thrombosis","Craniocervical junction compression (foramen-magnum meningioma, basilar invagination)","Craniopharyngioma","Craniopharyngioma (and its surgical treatment)","Craniopharyngioma or germinoma","Deep cerebral venous thrombosis","Deep haemorrhage","Deep haemorrhage or aneurysm","Deep hypertensive haemorrhage","Deep tumour or metastasis","Diffuse axonal injury","Dorsal midbrain (pretectal) lesion","Dural arteriovenous fistula","Duret haemorrhage / brainstem injury from herniation","Falx / parasagittal meningioma","Falx metastasis or lymphoma","Foramen-magnum meningioma","Fourth ventricular ependymoma","Frontal glioma or metastasis","Frontal tumour (glioma, meningioma, metastasis)","Frontal tumour / metastasis","Glioma / metastasis","Glioma / metastasis presenting with a large hemispheric deficit","Glioma of the medial frontal lobe","Haemorrhage","Haemorrhage / cavernous malformation","Haemorrhage into the subthalamic region","Herpes simplex encephalitis","Herpes simplex or limbic encephalitis","Hypertensive deep haemorrhage","Hypertensive haemorrhage","Hypertensive pontine haemorrhage","Hypothalamic glioma","Hypothalamic glioma or germinoma","Hypothalamic stroke or haemorrhage","Hypothalamic tumour or infiltration","Interhemispheric (falx) subdural haematoma or parasagittal contusion","Internal carotid aneurysm","Intracerebral haemorrhage","Japanese encephalitis / flavivirus encephalitis","Langerhans cell histiocytosis","Langerhans cell histiocytosis or neurosarcoidosis","Large intracerebral haemorrhage","Large tumour or metastasis with oedema","Lateral medullary tumour / metastasis","Listeria rhombencephalitis","Low-grade glioma","Malignant MCA infarction (space-occupying oedema)","Mass effect with transtentorial herniation","Medullary haemorrhage","Medullary tumour / metastasis","Medulloblastoma","Meningioma (tuberculum sellae)","Meningitis or meningeal disease","Metastasis / haemangioblastoma","Midbrain haemorrhage","Midbrain tumour / metastasis","Neuro-Behçet's disease","Neurosarcoidosis","Neurosarcoidosis or infiltrative disease","Obstructive hydrocephalus / shunt failure","Obstructive hydrocephalus compressing the pretectum","Occipital haemorrhage","Olfactory groove meningioma","PICA / vertebral artery occlusion","Paraneoplastic or posterior-fossa tumour","Parasagittal / falx meningioma","Parasagittal meningioma","Parasagittal metastasis","Partially or late-presenting compressive lesion","Petrous apicitis (Gradenigo's syndrome)","Pineal region tumour (germinoma)","Pineal region tumour with hydrocephalus","Pituitary apoplexy","Pituitary macroadenoma","Pituitary macroadenoma with stalk compression","Pituitary macroadenoma with suprasellar extension","Pontine contusion with diffuse axonal injury","Pontine glioma","Pontine glioma (esp. children)","Pontine glioma / metastasis","Pontine haemorrhage","Pontine haemorrhage or cavernoma","Pontine trauma or tumour","Post-infectious acute cerebellitis","Posterior communicating artery aneurysm","Posterior fossa tumour","Raised intracranial pressure","Raised intracranial pressure (false localising sign)","Ruptured anterior communicating artery aneurysm","Small metastasis / glioma","Small metastasis or demyelinating plaque","Small metastasis or glioma","Small tumour or metastasis","Striatal infarct or haemorrhage","Subfrontal / olfactory groove meningioma","Superior sagittal sinus thrombosis","Suprasellar tumour (craniopharyngioma, germinoma, glioma)","Tectal contusion after head injury","Temporal pole contusion","Thalamic abscess or cerebral toxoplasmosis","Thalamic haemorrhage","Thalamic infarct or haemorrhage","Thalamic tumour or metastasis","Third ventricular tumour or colloid cyst","Toxoplasmosis or HIV-related lesion","Transverse or sigmoid sinus thrombosis (vein of Labbe)","Traumatic brain injury","Traumatic brain injury (orbitofrontal contusion)","Tumour (glioma / metastasis)","Tumour (glioma, metastasis, craniopharyngioma)","Tumour (pineal or tectal)","Tumour / metastasis","Tumour of the SMA / medial frontal region","Tumour or demyelination","Tumour or meningeal disease at the skull base","Tumour or raised intracranial pressure","Tumour or surgical injury","Uncal herniation","Uncal herniation compressing the third nerve","Vertex extradural haematoma","Vertex extradural haematoma / parasagittal contusion"];
  const got = [...canNames].sort(), want = [...CAN].sort();
  ok("row 21: the in-play names that can raise the pressure are exactly Appendix A's, less PRES (158)",
     same(got, want), `added: ${got.filter(n => !want.includes(n)).join("; ")} | missing: ${want.filter(n => !got.includes(n)).join("; ")}`);
}

// ---- B. Papilloedema demotes, never drops (row 1) ----
{ const moved = [];
  for (const s of candidateSites()) for (const onset of ONSETS) {
    const r = causesFor(s, { onset });
    if ("pressure" in r || r.demoted.some(x => x.demotion.axis !== "tempo" || "pressure" in x.demotion)
        || !same(r, causesFor(s, { onset, pressure: false }))) moved.push(`${s.id}@${onset || "none"}`); }
  ok("row 1 guard: without papilloedema causesFor is unchanged at every place and onset", moved.length === 0, moved.slice(0, 5).join(", ")); }
{ const cr = SITE.left_subcortex_corona_radiata, r = causesFor(cr, { pressure: true });
  ok("row 1: papilloedema at the corona radiata keeps the causes that can raise the pressure, in the place's own order",
     r.all.map(c => c.name).join(" | ") === "Hypertensive deep haemorrhage | Diffuse axonal injury | Small metastasis / glioma", r.all.map(c => c.name).join(" | "));
  const lac = r.demoted.find(c => c.name === "Small-vessel lacunar infarct");
  ok("row 1: …the lacune is demoted for the pressure, never dropped", !!lac && lac.demotion.axis === "pressure" && lac.demotion.entered === "papilloedema");
  ok("row 1: …and the result says the pressure acted", r.pressure === true);
  const both = causesFor(cr, { onset: "chronic", pressure: true }).demoted.find(c => c.name === "Small-vessel lacunar infarct");
  ok("row 1: a cause both axes demote keeps its tempo reason and carries the pressure", !!both && both.demotion.axis === "tempo" && both.demotion.pressure === true); }
ok("row 7: the retina keeps its own causes with papilloedema (giant cell arteritis leads)",
   same(causesFor(SITE.left_visual_pathway_retina, { pressure: true }), causesFor(SITE.left_visual_pathway_retina))
   && leadOf(SITE.left_visual_pathway_retina, { pressure: true }) === "Giant cell arteritis");
ok("row 1: a place outside the skull (the cord) keeps its own causes — the cover can reach it, the pressure does not",
   same(causesFor(SITE.bilateral_cord_transverse, { pressure: true }), causesFor(SITE.bilateral_cord_transverse)));
{ const cc = combinedCauses([SITE.left_subcortex_corona_radiata, SITE.right_cortex_occipital], { pressure: true });
  const lac = cc.perSite[0].causes.find(c => c.name === "Small-vessel lacunar infarct");
  ok("row 1: combinedCauses passes the pressure on to each place", !!lac && lac.demotion && lac.demotion.axis === "pressure"); }
{ // The ratchet: per in-play place kind, how often papilloedema changes the leading cause, and where nothing is left.
  const count = onset => { let changed = 0, empty = 0;
    for (const s of KINDS) { const left = causesFor(s, { onset, pressure: true }).all;
      if (demotesAt(s) && !left.length) empty++; else if (left.length && leadOf(s, { onset }) !== (leadingCause(left) || {}).name) changed++; }
    return `${changed}/${empty}`; };
  // Re-pinned 2026-11-11 on the owner's rulings in the integration: the composite sites' three places, and PRES re-ruled.
  const got = ONSETS.map(count).join(" "), want = "82/7 54/45 68/21 42/15 23/18";
  ok("row 1 ratchet: lead changed / nothing left, by onset (none, hyperacute, acute, subacute, chronic), over 115 place kinds",
     KINDS.length === 115 && got === want, `${KINDS.length} kinds: ${got}`); }

// ---- C. The plan follows the cause the What line names (rows 9, 11–13) ----
{ const cr = SITE.left_subcortex_corona_radiata, nx = nextStepsFor(cr, { pressure: true }), sp = sitePlan(cr);
  const plan = pathologyPlanFor("Hypertensive deep haemorrhage", cr);
  ok("row 9: papilloedema at the corona radiata follows the haemorrhage, set aside the lacune",
     same(nx.followed, { cause: "Hypertensive deep haemorrhage", setAside: "Small-vessel lacunar infarct", onset: null, pressure: true, by: { onset: false, pressure: true } }),
     JSON.stringify(nx.followed));
  ok("row 9: the tier split holds — immediate and first-line stay the site's",
     same(nx.immediate, sp.immediate) && same(nx.investigations, sp.investigations));
  ok("row 9: confirmatory, monitoring and referral become the followed cause's",
     same(nx.confirmatory, plan.confirmatory) && same(nx.monitoring, plan.monitoring) && nx.referral === plan.referral);
  ok("row 9: the urgency is resolved as a selection of it would be",
     nx.urgency === resolveUrgency(cr, "Hypertensive deep haemorrhage", { pressure: true }) && nx.urgency === "emergency");
  ok("row 9: pressureFollows returns nothing without papilloedema, and exactly what nextStepsFor follows with it",
     pressureFollows(cr, {}) === null && same(pressureFollows(cr, { pressure: true }), nx.followed)); }
{ const nx = nextStepsFor(SITE.left_subcortex_corona_radiata, { onset: "chronic", pressure: true });
  ok("row 9: at chronic onset with papilloedema the corona radiata follows the glioma, both axes named",
     nx.followed && nx.followed.cause === "Small metastasis / glioma" && same(nx.followed.by, { onset: true, pressure: true }) && nx.urgency === "urgent"); }
ok("row 9: where the pressure keeps the usual cause and the onset rule does not fire, nothing is followed (the pretectum, acute)",
   !("followed" in nextStepsFor(SITE.pupil_pretectum, { onset: "acute", pressure: true })));
{ const nx = nextStepsFor(SITE.left_medulla_lateral, { onset: "chronic", pressure: true });
  ok("row 9: where the approved onset rule fires and the pressure keeps the cause, the plan still follows the What line (the lateral medulla, chronic)",
     !!nx.followed && same(nx.followed.by, { onset: true, pressure: false }) && nx.followed.cause === leadOf(SITE.left_medulla_lateral, { onset: "chronic", pressure: true })
     && !!onsetFollows(SITE.left_medulla_lateral, "chronic")); }
{ const bad = [], mismatch = [];
  for (const s of KINDS) for (const onset of ONSETS) {
    const f = nextStepsFor(s, { onset, pressure: true }).followed;
    if (!f) continue;
    if (!(f.by && f.by.pressure) && !onsetFollows(s, onset)) bad.push(`${s.id}@${onset || "none"}`);
    if (f.cause !== leadOf(s, { onset, pressure: true })) mismatch.push(`${s.id}@${onset || "none"}`); }
  ok("row 9: the plan follows only where the pressure sets the cause aside or the approved onset rule fires", bad.length === 0, bad.slice(0, 5).join(", "));
  ok("row 9: the followed cause is always the What line's leading cause", mismatch.length === 0, mismatch.slice(0, 5).join(", ")); }
{ const moved = [];
  for (const s of candidateSites()) for (const onset of ONSETS) {
    const nx = nextStepsFor(s, { onset });
    if ((nx.followed && "pressure" in nx.followed) || !same(nx, nextStepsFor(s, { onset, pressure: false }))) moved.push(`${s.id}@${onset || "none"}`); }
  ok("row 9 guard: without papilloedema the plan is unchanged at every place and onset", moved.length === 0, moved.slice(0, 5).join(", ")); }
{ const og = SITE.left_olfactory_olfactory_groove, routine = [];
  for (const s of KINDS) for (const onset of ONSETS) if (nextStepsFor(s, { onset, pressure: true }).urgency === "routine") routine.push(`${s.id}@${onset || "none"}`);
  ok("row 11: with papilloedema no in-play place's plan badges routine", routine.length === 0, routine.slice(0, 5).join(", "));
  ok("row 11: the olfactory groove (routine today) badges urgent with papilloedema",
     sitePlan(og).urgency === "routine" && nextStepsFor(og, { pressure: true }).urgency === "urgent");
  ok("row 11: …and so does a selection of its meningioma",
     pathologyNextStepsFor(og, "Olfactory groove meningioma", {}).urgency === "routine"
     && pathologyNextStepsFor(og, "Olfactory groove meningioma", { pressure: true }).urgency === "urgent"); }
ok("row 12: with no onset the badge follows the cause — the leg area's stroke plan (emergency) becomes the meningioma's (urgent)",
   sitePlan(SITE.right_cortex_motor_leg).urgency === "emergency" && nextStepsFor(SITE.right_cortex_motor_leg, { pressure: true }).urgency === "urgent"
   && (nextStepsFor(SITE.right_cortex_motor_leg, { pressure: true }).followed || {}).cause === "Parasagittal meningioma");
{ const moved = [];
  for (const s of KINDS) if (!same(sitePlan(s, { onset: "hyperacute", pressure: true }), sitePlan(s, { onset: "hyperacute" }))) moved.push(s.id);
  ok("row 13: the hyperacute escalation is untouched by papilloedema", moved.length === 0, moved.slice(0, 5).join(", "));
  ok("row 13: …so the corona radiata at hyperacute onset with papilloedema stays an emergency",
     nextStepsFor(SITE.left_subcortex_corona_radiata, { onset: "hyperacute", pressure: true }).urgency === "emergency"); }

// ---- D. The answer card (rows 9, 10, 14) ----
ok("row 10: nothing at the diffuse cerebrum can raise the pressure; the corona radiata has its haemorrhage; the retina never qualifies",
   pressureLeads(SITE.cerebrum_diffuse) === true && pressureLeads(SITE.left_subcortex_corona_radiata) === false
   && pressureLeads(SITE.left_visual_pathway_retina, "chronic") === false);
{ const a = card(`${P} weak_arm@right weak_leg@right`);
  ok("row 9: papilloedema + right hemiparesis names the haemorrhage, and the Next line is its plan",
     a?.lines.what === "Most likely Hypertensive deep haemorrhage (must not miss). Must not miss: Diffuse axonal injury."
     && a?.lines.next === "Acute stroke pathway with neurosurgery; critical care if conscious level is falling" && a?.nx.urgency === "emergency",
     `${a?.lines.what} | ${a?.lines.next} [${a?.nx.urgency}]`); }
{ const a = card(`${P} weak_arm@right weak_leg@right`, "chronic");
  ok("rows 9, 14: …at chronic onset, the glioma, with no old-stroke clause",
     a?.lines.what === "Most likely Small metastasis / glioma." && a?.nx.urgency === "urgent", `${a?.lines.what} [${a?.nx.urgency}]`);
  ok("row 14 guard: without papilloedema the chronic card keeps its old-stroke clause",
     /Could represent an old stroke\./.test(card("weak_arm@right weak_leg@right", "chronic")?.lines.what || "")); }
{ const a = card(`reduced_consciousness@none ${P}`);
  // Row 10's blank red line reversed by the card follows its cause (2026-11-11): the place's own flag, true whatever the cause.
  ok("row 10: coma + papilloedema follows the pressure itself — the pressure-only lines, emergency, and the place's own flag as the red line",
     a?.lines.what === ANS.PRESSURE_ONLY.what && a?.lines.next === ANS.PRESSURE_ONLY.next && a?.nx.urgency === "emergency"
     && a?.lines.red === "Coma with no focal signs: check glucose, sodium and a blood gas immediately." && a?.nx.pressureLeads === true,
     `${a?.lines.what} [${a?.nx.urgency}] red=${a?.lines.red}`); }
{ const a = card(`${P} fixed_dilated_pupil@left`);
  ok("row 10: an awake dilated pupil with papilloedema follows the pressure, urgent (it was Adie's pupil, routine)",
     a?.lines.what === ANS.PRESSURE_ONLY.what && a?.nx.urgency === "urgent" && a?.lines.red === null, `${a?.lines.what} [${a?.nx.urgency}]`); }
for (const [toks, what, why] of [
  [`${P} homonymous_hemianopia@right`, "Most likely Occipital haemorrhage (must not miss). Must not miss: Arteriovenous malformation.", "papilloedema + hemianopia: not a PCA infarct (PRES re-ruled 2026-11-11)"],
  [`${P} truncal_ataxia@none`, "Most likely Medulloblastoma (must not miss). Must not miss: Cerebellar infarct (vermian).", "papilloedema + truncal ataxia: medulloblastoma"],
  [`${P} weak_leg@left`, "Most likely Parasagittal meningioma. Must not miss: Superior sagittal sinus thrombosis.", "papilloedema + leg weakness: the parasagittal meningioma"],
  [`${P} neglect@left weak_arm@left weak_leg@left`, "Most likely Large intracerebral haemorrhage (must not miss). Must not miss: Malignant MCA infarction (space-occupying oedema).", "papilloedema + a right hemisphere syndrome: not a carotid-T occlusion"],
]) { const a = card(toks); ok(`§6: ${why}`, a?.lines.what === what, a?.lines.what); }
ok("§6: papilloedema + a chronic hemianopia drops the old-stroke clause",
   card(`${P} homonymous_hemianopia@right`, "chronic")?.lines.what === "Most likely Glioma / metastasis. Must not miss: Dural arteriovenous fistula.");
{ const retina = [...expectedFindings(SITE.left_visual_pathway_retina)].join(" ");
  ok("row 7: a retinal stroke with papilloedema keeps its own What line", card(`${retina} ${P}`)?.lines.what === card(retina)?.lines.what); }
{ const bad = [];
  for (const s of KINDS) { const exp = [...expectedFindings(s)]; if (!exp.length) continue;
    const a = card(`${exp.join(" ")} ${P}`); if (!a || a.twoLesions || a.pressureOnly) continue;
    if (a.nx.followed && !a.lines.what.startsWith(`Most likely ${a.nx.followed.cause}`)) bad.push(s.id);
    if (a.nx.pressureLeads && a.lines.what !== ANS.PRESSURE_ONLY.what) bad.push(s.id); }
  ok("rows 9–10: on every in-play place's own picture with papilloedema, the What line names the cause the plan follows", bad.length === 0, bad.slice(0, 5).join(", ")); }

// ---- E. The wording (rows 16–18) ----
ok("row 16: the What card's papilloedema band",
   same(ANS.PRESSURE_BAND, { title: "less likely with papilloedema",
     note: "Papilloedema means the intracranial pressure is raised. These causes do not raise it: they can explain the deficit, but not the papilloedema.",
     tag: "does not raise the pressure" }));
ok("row 16: a demoted cause's reason — the tempo, the pressure, or both",
   demotionReason({ axis: "tempo", expected: ["hyperacute", "acute"] }) === "usually hyperacute / acute"
   && demotionReason({ axis: "pressure", expected: [] }) === "does not raise the pressure"
   && demotionReason({ axis: "tempo", expected: ["chronic"], pressure: true }) === "usually chronic · does not raise the pressure");
ok("row 17: the Next card's note when papilloedema sets the cause aside",
   followNote({ cause: "X", setAside: "Y", onset: null, pressure: true, by: { onset: false, pressure: true } })
   === "Following the most likely cause, X. Papilloedema sets aside Y, which cannot raise the intracranial pressure and is what this site's usual plan is written for.");
ok("row 17: …when the onset and papilloedema both do",
   followNote({ cause: "X", setAside: "Y", onset: "chronic", pressure: true, by: { onset: true, pressure: true } })
   === "Following the most likely cause, X. A chronic onset and papilloedema set aside Y, which this site's usual plan is written for.");
ok("row 17: …and the approved onset sentence where only the onset does",
   followNote({ cause: "X", setAside: "Y", onset: "chronic", pressure: true, by: { onset: true, pressure: false } })
   === "Following the most likely cause, X. A chronic onset rules out Y, which this site's usual plan is written for."
   && followNote({ cause: "X", setAside: "Y", onset: "subacute" }) === "Following the most likely cause, X. A subacute onset rules out Y, which this site's usual plan is written for.");
ok("row 18: the Next card's note when the pressure leads",
   ANS.PRESSURE_LEADS_NOTE === "No cause usually found here raises the intracranial pressure, so the plan follows the papilloedema itself.");

// ---- F. The IV (row 15) ----
ok("row 15: the IV's cisternal course is in PRESSURE_REACHES, and the pressure demotes there",
   PRESSURE_REACHES.has("skull_base|trochlear_cisternal") && demotesAt(SITE.left_skull_base_trochlear_cisternal) === true);
{ const a = card(`weak_depression@left vertical_diplopia@left ${P}`);
  ok("row 15: a IV palsy with papilloedema reads the IV nerve and leads with the pressure, an emergency",
     /^Left IV — cisternal segment\./.test(a?.lines.where || "")
     && a?.lines.what === "Most likely Tumour or raised intracranial pressure (must not miss). Must not miss: Basal meningitis (tuberculous, carcinomatous or fungal)."
     && a?.nx.urgency === "emergency", `${a?.lines.where} | ${a?.lines.what} [${a?.nx.urgency}]`); }
ok("row 15 guard: without papilloedema the IV palsy's card is unchanged (the IV nerve, head trauma first)",
   card("weak_depression@left vertical_diplopia@left")?.lines.what.startsWith("Most likely Head trauma"));

// ---- G. The owner's rulings in the integration of the open fixes (2026-11-11) ----
// PRES cannot raise the pressure (row 4 re-ruled): its intracranial pressure is usually normal, and the swollen discs beside it
// are hypertensive retinopathy. Inside the stroke window the pressure never leads (row 10 narrowed): at hyperacute onset the
// papilloedema predates the event, so a place whose lead is vascular keeps its stroke card and names the pressure on a second line.
const strokeWindowHolds = ANS.strokeWindowHolds || (() => null);
const hyperacuteVascular = NX.hyperacuteVascular || (() => null);
const TOB = "reduced_consciousness@none vertical_gaze_palsy@none homonymous_hemianopia@left homonymous_hemianopia@right";
{ const a = card(`${TOB} ${P}`);
  ok("ruling 2026-11-11: with papilloedema the top of the basilar leads with deep cerebral venous thrombosis and follows its plan",
     /^Most likely Deep cerebral venous thrombosis/.test(a?.lines.what || "")
     && a?.lines.next === "Acute stroke or neurology service, with haematology; neurosurgery if there is mass effect or hydrocephalus"
     && a?.nx.urgency === "emergency", `${a?.lines.what} | ${a?.lines.next} [${a?.nx.urgency}]`); }
{ const a = card(`${TOB} ${P}`, "hyperacute"), b = card(TOB, "hyperacute");
  ok("ruling 2026-11-11: at hyperacute onset the top of the basilar keeps its stroke card, and names the pressure on a second line",
     a?.lines.what === `${b?.lines.what} ${ANS.PRESSURE_ONLY.what}` && a?.lines.next === b?.lines.next && a?.lines.red === b?.lines.red
     && a?.nx.urgency === "emergency" && !a?.nx.pressureLeads, `${a?.lines.what} | ${a?.lines.next} [${a?.nx.urgency}] red=${a?.lines.red}`); }
{ // Every place the rule reaches, on its own picture with that place selected: its hyperacute card, plus the pressure line.
  const at = (toks, id, onset) => { const tokens = T(toks), r = solve(tokens), sel = r.display.find(x => x.site.id === id);
    const total = [...tokens].filter(t => !t.startsWith("papilloedema@") && !isNormalToken(t)).length;
    return sel ? ANS.answerFor({ r, sel, total, tokens, onset, course: "", dominant: "left", sensoryLevel: "",
      pinned: new Set(), scope: "site", selectedPathology: undefined, selectedEntity: undefined }) : null; };
  // Two of them emit nothing on their own at the default dominance (one auditory cortex; the right-hemisphere aphasia), so there
  // is no picture to enter: papilloedema alone is the pressure-only card, as the rows 9–10 sweep also skips an empty picture.
  const held = KINDS.filter(s => strokeWindowHolds(s, "hyperacute")), bad = [];
  const pictured = held.filter(s => expectedFindings(s).size);
  for (const s of pictured) {
    const exp = [...expectedFindings(s)].join(" "), a = at(`${exp} ${P}`, s.id, "hyperacute"), b = at(exp, s.id, "hyperacute");
    if (!a || !b || a.lines.what !== `${b.lines.what} ${ANS.PRESSURE_ONLY.what}` || a.lines.next !== b.lines.next
        || a.lines.red !== b.lines.red || a.nx.urgency !== b.nx.urgency || a.nx.pressureLeads) bad.push(s.id); }
  ok("ruling 2026-11-11: inside the stroke window each of the 21 place kinds the pressure would have led (19 with a picture of their own) keeps its hyperacute card, plus the pressure line",
     held.length === 21 && pictured.length === 19 && bad.length === 0, `${held.length} kinds, ${pictured.length} pictured; differ: ${bad.slice(0, 5).join(", ")}`); }
{ const leads = KINDS.filter(s => hyperacuteVascular(s, "hyperacute") && pressureLeads(s, "hyperacute")).map(s => s.id);
  ok("ruling 2026-11-11: at hyperacute onset no place whose lead is vascular follows the pressure itself", leads.length === 0, leads.slice(0, 5).join(", ")); }
{ const a = card(`${TOB} ${P}`, "chronic");
  ok("ruling 2026-11-11 guard: outside the stroke window the pressure still leads (the top of the basilar, chronic)",
     a?.nx.pressureLeads === true && a?.lines.what === ANS.PRESSURE_ONLY.what && a?.lines.red === null, `${a?.lines.what}`); }
{ const a = card(`${P} weak_arm@right weak_leg@right`, "hyperacute");
  ok("ruling 2026-11-11 guard: where a cause can raise the pressure, the hyperacute plan still follows it (the corona radiata's haemorrhage)",
     a?.lines.what === "Most likely Hypertensive deep haemorrhage (must not miss). Must not miss: Diffuse axonal injury."
     && a?.lines.next === "Acute stroke pathway with neurosurgery; critical care if conscious level is falling", `${a?.lines.what} | ${a?.lines.next}`); }

// ---- report ----
console.log(`\nNeuroLocaliser — pressure follows the cause (round 1)\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

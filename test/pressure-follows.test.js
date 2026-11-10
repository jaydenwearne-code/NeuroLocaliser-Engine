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
  ["Posterior reversible encephalopathy syndrome (PRES)", "metabolic", true, "row 4: PRES can"],
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
  ok("row 21: the in-play cause lists hold 641 rows (435 names); 264 rows can raise the pressure",
     keys.size === 98 && rows === 641 && names.size === 435 && can === 264, `${keys.size} lists, ${rows} rows, ${names.size} names, ${can} can`);
  const CAN = ["ACA vasospasm after subarachnoid haemorrhage","Acute disseminated encephalomyelitis (ADEM)","Aneurysm or deep haemorrhage","Anterior communicating artery aneurysm (rupture ± vasospasm)","Anterior communicating artery aneurysm rupture","Arteriovenous malformation","Basal meningitis (tuberculous, carcinomatous or fungal)","Bilateral thalamic glioma","Bilateral traumatic or hypoxic injury","Bilateral tumour or metastases","Brainstem abscess","Brainstem abscess or tuberculoma","Brainstem encephalitis (Listeria, enterovirus)","Brainstem encephalitis / meningoencephalitis","Brainstem encephalitis or tuberculoma","Brainstem glioma","Brainstem haemorrhage","Brainstem haemorrhage or cavernoma","Brainstem or cerebellar haemorrhage / cavernoma","Brainstem tumour or trauma","Butterfly glioma or lymphoma","Cavernous sinus thrombosis","Cerebellar / brainstem stroke (PICA / AICA)","Cerebellar abscess","Cerebellar abscess or tuberculoma","Cerebellar haemorrhage","Cerebellar infarct (PICA)","Cerebellar infarct (SCA / PICA)","Cerebellar infarct (vermian)","Cerebellar malformation (Dandy-Walker, vermian hypoplasia)","Cerebellar or brainstem infarct","Cerebellopontine angle tumour","Cerebellopontine angle tumour (vestibular schwannoma, meningioma)","Cerebral abscess","Cerebral abscess or empyema","Chiari I malformation","Cortical vein thrombosis","Craniocervical junction compression (foramen-magnum meningioma, basilar invagination)","Craniopharyngioma","Craniopharyngioma (and its surgical treatment)","Craniopharyngioma or germinoma","Deep cerebral venous thrombosis","Deep haemorrhage","Deep haemorrhage or aneurysm","Deep hypertensive haemorrhage","Deep tumour or metastasis","Diffuse axonal injury","Dorsal midbrain (pretectal) lesion","Dural arteriovenous fistula","Duret haemorrhage / brainstem injury from herniation","Falx / parasagittal meningioma","Falx metastasis or lymphoma","Foramen-magnum meningioma","Fourth ventricular ependymoma","Frontal glioma or metastasis","Frontal tumour (glioma, meningioma, metastasis)","Frontal tumour / metastasis","Glioma / metastasis","Glioma / metastasis presenting with a large hemispheric deficit","Glioma of the medial frontal lobe","Haemorrhage","Haemorrhage / cavernous malformation","Haemorrhage into the subthalamic region","Herpes simplex encephalitis","Herpes simplex or limbic encephalitis","Hypertensive deep haemorrhage","Hypertensive haemorrhage","Hypertensive pontine haemorrhage","Hypothalamic glioma","Hypothalamic glioma or germinoma","Hypothalamic stroke or haemorrhage","Hypothalamic tumour or infiltration","Interhemispheric (falx) subdural haematoma or parasagittal contusion","Internal carotid aneurysm","Intracerebral haemorrhage","Japanese encephalitis / flavivirus encephalitis","Langerhans cell histiocytosis","Langerhans cell histiocytosis or neurosarcoidosis","Large intracerebral haemorrhage","Large tumour or metastasis with oedema","Lateral medullary tumour / metastasis","Listeria rhombencephalitis","Low-grade glioma","Malignant MCA infarction (space-occupying oedema)","Mass effect with transtentorial herniation","Medullary haemorrhage","Medullary tumour / metastasis","Medulloblastoma","Meningioma (tuberculum sellae)","Meningitis or meningeal disease","Metastasis / haemangioblastoma","Midbrain haemorrhage","Midbrain tumour / metastasis","Neuro-Behçet's disease","Neurosarcoidosis","Neurosarcoidosis or infiltrative disease","Obstructive hydrocephalus / shunt failure","Obstructive hydrocephalus compressing the pretectum","Occipital haemorrhage","Olfactory groove meningioma","PICA / vertebral artery occlusion","PRES (posterior reversible encephalopathy)","Paraneoplastic or posterior-fossa tumour","Parasagittal / falx meningioma","Parasagittal meningioma","Parasagittal metastasis","Partially or late-presenting compressive lesion","Petrous apicitis (Gradenigo's syndrome)","Pineal region tumour (germinoma)","Pineal region tumour with hydrocephalus","Pituitary apoplexy","Pituitary macroadenoma","Pituitary macroadenoma with stalk compression","Pituitary macroadenoma with suprasellar extension","Pontine contusion with diffuse axonal injury","Pontine glioma","Pontine glioma (esp. children)","Pontine glioma / metastasis","Pontine haemorrhage","Pontine haemorrhage or cavernoma","Pontine trauma or tumour","Post-infectious acute cerebellitis","Posterior communicating artery aneurysm","Posterior fossa tumour","Posterior reversible encephalopathy syndrome (PRES)","Raised intracranial pressure","Raised intracranial pressure (false localising sign)","Ruptured anterior communicating artery aneurysm","Small metastasis / glioma","Small metastasis or demyelinating plaque","Small metastasis or glioma","Small tumour or metastasis","Striatal infarct or haemorrhage","Subfrontal / olfactory groove meningioma","Superior sagittal sinus thrombosis","Suprasellar tumour (craniopharyngioma, germinoma, glioma)","Tectal contusion after head injury","Temporal pole contusion","Thalamic abscess or cerebral toxoplasmosis","Thalamic haemorrhage","Thalamic infarct or haemorrhage","Thalamic tumour or metastasis","Third ventricular tumour or colloid cyst","Toxoplasmosis or HIV-related lesion","Transverse or sigmoid sinus thrombosis (vein of Labbe)","Traumatic brain injury","Traumatic brain injury (orbitofrontal contusion)","Tumour (glioma / metastasis)","Tumour (glioma, metastasis, craniopharyngioma)","Tumour (pineal or tectal)","Tumour / metastasis","Tumour of the SMA / medial frontal region","Tumour or demyelination","Tumour or meningeal disease at the skull base","Tumour or surgical injury","Uncal herniation","Uncal herniation compressing the third nerve","Vertex extradural haematoma","Vertex extradural haematoma / parasagittal contusion"];
  const got = [...canNames].sort(), want = [...CAN].sort();
  ok("row 21: the in-play names that can raise the pressure are exactly Appendix A's (159)",
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
  const got = ONSETS.map(count).join(" "), want = "79/7 52/43 66/19 37/15 22/17";
  ok("row 1 ratchet: lead changed / nothing left, by onset (none, hyperacute, acute, subacute, chronic), over 111 place kinds",
     KINDS.length === 111 && got === want, `${KINDS.length} kinds: ${got}`); }

// ---- report ----
console.log(`\nNeuroLocaliser — pressure follows the cause (round 1)\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

// next-steps.test.js — the EDUCATIONAL "what next" layer: first-line investigations, urgency, referral.
// Teaching prompts, NOT clinical directives (no doses / definitive management). Keyed like causes.js:
// curated by site id or level_part, else a derive fallback so EVERY site returns something.
import { nextStepsFor } from "../src/data/nextSteps.js";
import { causesFor } from "../src/data/causes.js";
import { candidateSites } from "../src/engine/inverse.js";
import { expectedFindings } from "../src/engine/forward.js";

let pass = 0, fail = 0;
const ok = (l, c) => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l); };

// curated: Wallenberg (lateral medulla) — a stroke; urgent, MRI/MRA, swallow safety
{ const ns = nextStepsFor({ id: "medulla_lateral", level: "medulla", part: "lateral", territory: "PICA / vertebral" });
  ok("Wallenberg urgency is emergency/urgent", ["emergency","urgent"].includes(ns.urgency));
  ok("Wallenberg investigations mention MRI / MRA / angiography", ns.investigations.some(i => /mri|mra|angiogra|ct/i.test(i)));
  ok("Wallenberg has a referral pathway", typeof ns.referral === "string" && ns.referral.length > 0);
  ok("Wallenberg is curated", ns.curated === true);
  // tiered structure: immediate (bedside swallow), confirmatory, monitoring all present
  ok("Wallenberg immediate tier includes a bedside swallow screen", ns.immediate.some(i => /swallow/i.test(i)));
  ok("Wallenberg has a confirmatory tier", Array.isArray(ns.confirmatory) && ns.confirmatory.length > 0);
  ok("Wallenberg has a monitoring tier", Array.isArray(ns.monitoring) && ns.monitoring.length > 0); }

// derived tiers: an uncurated cord lesion still gets bedside + monitoring specific to the cord
{ const ns = nextStepsFor({ id: "z_cord", level: "cord", part: "hemicord", territory: "" });
  ok("derived cord immediate tier mentions bladder / sensory level", ns.immediate.some(i => /bladder|sensory level|anal tone/i.test(i)));
  ok("derived cord monitoring tier mentions bladder / progression", ns.monitoring.some(i => /bladder|progress/i.test(i)));
  ok("every tier is an array", ["immediate","investigations","confirmatory","monitoring"].every(k => Array.isArray(ns[k]))); }

// derived tiers: NMJ/motor-unit site gets a respiratory-function bedside prompt.
// NB: uses a SYNTHETIC part. The derive fallback keys off LEVEL, so a made-up part exercises the same code
// while staying immune to future curation — this test previously used part "muscle" and broke the moment
// motor_unit_muscle was curated (Region E).
{ const ns = nextStepsFor({ id: "z_nmu", level: "motor_unit", part: "zz_never_curated", territory: "" });
  ok("motor-unit immediate tier prompts respiratory function", ns.immediate.some(i => /respiratory|fvc/i.test(i)));
  ok("synthetic motor-unit site is genuinely on the derive path", ns.curated === false); }

// curated: AION (giant-cell arteritis) — sight/life-threatening, ESR/CRP
{ const ns = nextStepsFor({ id: "skull_base_optic_aion", level: "skull_base", part: "optic_aion", territory: "" });
  ok("AION urgency is emergency", ns.urgency === "emergency");
  ok("AION investigations mention ESR / CRP", ns.investigations.some(i => /esr|crp|inflammatory/i.test(i))); }

// derive fallback: an uncurated peripheral nerve site still returns something.
// Synthetic part again — this used "ulnar_elbow", which stopped being uncurated in Region E.
{ const ns = nextStepsFor({ id: "z_uncurated", level: "nerve", part: "zz_never_curated", territory: "" });
  ok("uncurated nerve site returns investigations (derive)", ns.investigations.length > 0);
  ok("uncurated site is flagged not-curated", ns.curated === false);
  ok("derived urgency is a valid value", ["emergency","urgent","routine"].includes(ns.urgency)); }

// derive fallback: cord lesion is a time-critical emergency (cord compression)
{ const ns = nextStepsFor({ id: "z", level: "cord", part: "anterior", territory: "" });
  ok("cord lesion derive -> emergency + whole-spine MRI", ns.urgency === "emergency" && ns.investigations.some(i => /spine|cord|mri/i.test(i))); }

// --- Region A: anterior/posterior circulation cortex workup ---
const cortexSite = (key, part, territory) => ({ id: `left_${key}`, level: "cortex", part, side: "left", territory });

// complete MCA — hyperacute pathway PLUS the malignant-oedema watch that is unique to this site
{ const ns = nextStepsFor(cortexSite("cortex_mca", "mca", "MCA (complete territory)"));
  ok("complete MCA is curated + emergency", ns.curated === true && ns.urgency === "emergency");
  ok("complete MCA monitoring warns about malignant oedema / conscious level", ns.monitoring.some(i => /malignant|oedema|edema|conscious|hemicraniectomy/i.test(i)));
  ok("complete MCA immediate tier drives the clock (last-known-well / NIHSS)", ns.immediate.some(i => /last.known.well|onset|nihss/i.test(i))); }

// MCA superior division — LVO / thrombectomy assessment
{ const ns = nextStepsFor(cortexSite("cortex_mca_superior", "mca_superior", "MCA superior division"));
  ok("MCA superior division is curated + emergency", ns.curated === true && ns.urgency === "emergency");
  ok("MCA superior division investigations include CT then angiography", ns.investigations.some(i => /angiogra|\bcta\b|\bmra\b/i.test(i))); }

// MCA inferior division — the Wernicke/neglect presentation mistaken for delirium; HSV is the can't-miss
{ const ns = nextStepsFor(cortexSite("cortex_mca_inferior", "mca_inferior", "MCA inferior division"));
  ok("MCA inferior division is curated + emergency", ns.curated === true && ns.urgency === "emergency");
  ok("MCA inferior division prompts considering encephalitis (LP / HSV PCR) if febrile", ns.confirmatory.some(i => /hsv|encephalitis|lumbar puncture|\blp\b/i.test(i)));
  ok("MCA inferior division warns it is mistaken for delirium/psychiatric", ns.immediate.some(i => /delirium|psychiatr|confus/i.test(i))); }

// ACA — the parasagittal / sinus-thrombosis alternatives change the imaging
{ const ns = nextStepsFor(cortexSite("cortex_aca", "aca", "ACA"));
  ok("ACA is curated + emergency", ns.curated === true && ns.urgency === "emergency");
  ok("ACA investigations include venous imaging (sinus thrombosis)", ns.investigations.some(i => /venogra|\bmrv\b|\bctv\b|venous/i.test(i))); }

// PCA / occipital — the isolated hemianopia that gets missed
{ const ns = nextStepsFor(cortexSite("cortex_pca", "pca", "PCA"));
  ok("PCA is curated + emergency", ns.curated === true && ns.urgency === "emergency");
  ok("PCA immediate tier prompts formal field testing", ns.immediate.some(i => /field|confrontation/i.test(i))); }

// watershed — the mechanism is haemodynamic, so the workup is the carotids + the BP/cardiac cause
{ const ns = nextStepsFor(cortexSite("cortex_watershed_anterior", "watershed_anterior", "ACA-MCA border zone"));
  ok("watershed is curated", ns.curated === true);
  ok("watershed investigations image the carotids", ns.investigations.some(i => /carotid/i.test(i)));
  ok("watershed looks for the hypoperfusion trigger (BP / cardiac / sepsis)", ns.immediate.some(i => /blood pressure|\bbp\b|hypotens|cardiac|sepsis/i.test(i))); }

// every Region A cortical site curated in causes.js must also carry a curated workup — a curated
// pathology list beside a generic derived workup reads as half-finished in the app.
for (const [key, part] of [["cortex_mca","mca"], ["cortex_mca_superior","mca_superior"],
                           ["cortex_mca_inferior","mca_inferior"], ["cortex_aca","aca"], ["cortex_pca","pca"],
                           ["cortex_occipital","occipital"], ["cortex_watershed_anterior","watershed_anterior"],
                           ["cortex_watershed_posterior","watershed_posterior"], ["cortex_motor_facearm","motor_facearm"],
                           ["cortex_motor_leg","motor_leg"], ["cortex_sensory_facearm","sensory_facearm"],
                           ["cortex_sensory_leg","sensory_leg"], ["cortex_parietal","parietal"]]) {
  const ns = nextStepsFor(cortexSite(key, part, ""));
  ok(`Region A workup curated: ${key}`, ns.curated === true);
  ok(`Region A workup has all four tiers: ${key}`,
     ns.immediate.length > 0 && ns.investigations.length > 0 && ns.confirmatory.length > 0 && ns.monitoring.length > 0);
  ok(`Region A workup urgency valid: ${key}`, ["emergency","urgent","routine"].includes(ns.urgency));
}
// parietal: a cortical syndrome without weakness still needs imaging, and PCA-type degenerative mimics need a different path
{ const ns = nextStepsFor(cortexSite("cortex_parietal", "parietal", ""));
  ok("parietal workup notes a cortical syndrome without weakness still needs imaging", ns.immediate.concat(ns.investigations).some(i => /without weakness|still needs imaging|neglect/i.test(i))); }

// --- Region B: lacunar / deep + cord emergencies ---
const bSite = (key, level, part) => ({ id: `left_${key}`, level, part, side: "left", territory: "" });
const REGION_B = [
  ["subcortex_corona_radiata","subcortex","corona_radiata"], ["subcortex_thalamus","subcortex","thalamus"],
  ["subcortex_anterior_choroidal","subcortex","anterior_choroidal"], ["subcortex_sensorimotor","subcortex","sensorimotor"],
  ["subcortex_optic_radiation","subcortex","optic_radiation"], ["pons_basis_pontis","pons","basis_pontis"],
  ["cord_transverse","cord","transverse"], ["cord_hemi","cord","hemi"], ["cord_lateral","cord","lateral"],
  ["cauda_equina","cauda","equina"], ["conus_medullaris","conus","medullaris"],
  ["craniocervical_junction_foramen_magnum","craniocervical_junction","foramen_magnum"],
];
for (const [key, level, part] of REGION_B) {
  const ns = nextStepsFor(bSite(key, level, part));
  ok(`Region B workup curated: ${key}`, ns.curated === true);
  ok(`Region B workup has all four tiers: ${key}`,
     ns.immediate.length > 0 && ns.investigations.length > 0 && ns.confirmatory.length > 0 && ns.monitoring.length > 0);
}

// cauda equina — the most time-critical workup in the app
{ const ns = nextStepsFor(bSite("cauda_equina", "cauda", "equina"));
  ok("cauda equina is an emergency", ns.urgency === "emergency");
  ok("cauda equina bedside: post-void residual, saddle sensation, anal tone",
     ns.immediate.some(i => /bladder scan|post.void/i.test(i)) &&
     ns.immediate.some(i => /saddle/i.test(i)) &&
     ns.immediate.some(i => /anal tone|per rectum|\bpr\b/i.test(i)));
  ok("cauda equina images the whole lumbosacral spine urgently", ns.investigations.some(i => /mri/i.test(i)));
  ok("cauda equina referral names emergency spinal surgery / decompression",
     /spinal|neurosurg|decompress/i.test(ns.referral) && /emergenc|immediat|urgent/i.test(ns.referral));
  ok("cauda equina monitoring warns that delay costs function permanently",
     ns.monitoring.some(i => /permanent|irreversib|time|delay|deteriorat/i.test(i))); }

// conus — the point is that it changes which level you image
{ const ns = nextStepsFor(bSite("conus_medullaris", "conus", "medullaris"));
  ok("conus is an emergency", ns.urgency === "emergency");
  ok("conus workup names the T12-L1 / conus level explicitly", ns.investigations.concat(ns.immediate).some(i => /t12|l1|conus/i.test(i))); }

// transverse cord — exclude compression BEFORE labelling it inflammatory
{ const ns = nextStepsFor(bSite("cord_transverse", "cord", "transverse"));
  ok("transverse cord is an emergency", ns.urgency === "emergency");
  ok("transverse cord images the whole spine to exclude compression first",
     ns.investigations.some(i => /whole.spine|entire spine|exclude compress/i.test(i)));
  ok("transverse cord confirmatory covers the inflammatory work-up (LP, AQP4/MOG)",
     ns.confirmatory.some(i => /aquaporin|aqp4|\bmog\b|oligoclonal|lumbar puncture/i.test(i))); }

// thalamic — central post-stroke pain needs a different follow-up than a motor lacune
{ const ns = nextStepsFor(bSite("subcortex_thalamus", "subcortex", "thalamus"));
  ok("thalamic workup mentions central post-stroke pain follow-up",
     ns.monitoring.concat(ns.confirmatory).some(i => /post.stroke pain|central pain|neuropathic/i.test(i))); }

// optic radiation — a field defect has driving/functional consequences
{ const ns = nextStepsFor(bSite("subcortex_optic_radiation", "subcortex", "optic_radiation"));
  ok("optic radiation prompts formal field testing", ns.immediate.concat(ns.investigations).some(i => /field|perimetr|confrontation/i.test(i))); }

// --- Region C: remaining brainstem + cerebellum ---
const cSite = (id, level, part, side = "midline") => ({ id, level, part, side, territory: "" });
const REGION_C_SITES = [
  ["left_midbrain_lateral","midbrain","lateral","left"], ["left_midbrain_trochlear","midbrain","trochlear","left"],
  ["left_midbrain_hemi","midbrain","hemi","left"], ["dorsal_midbrain_tectum","dorsal_midbrain","tectum"],
  ["left_pons_lateral","pons","lateral","left"], ["left_pons_lateral_trigeminal","pons","lateral_trigeminal","left"],
  ["left_pons_trigeminal","pons","trigeminal","left"], ["left_pons_hemi","pons","hemi","left"],
  ["left_medulla_hemi","medulla","hemi","left"], ["pontomesencephalic_tegmentum","pontomesencephalic","tegmentum"],
  ["brainstem_aras","brainstem_aras","paramedian_tegmentum"], ["locked_in","locked_in","ventral_pons"],
  ["thalamus_bilateral_percheron","thalamus_arousal","paramedian"], ["pseudobulbar_corticobulbar","pseudobulbar","corticobulbar"],
  ["cerebellum_vermis","cerebellum","vermis"], ["cerebellum_flocculonodular","cerebellum","flocculonodular"],
  ["cerebellum_pancerebellar","cerebellum","pancerebellar"],
  ["gm_rubral_left","guillain_mollaret","rubral"], ["gm_dentate_left","guillain_mollaret","dentate"],
];
for (const [id, level, part, side] of REGION_C_SITES) {
  const ns = nextStepsFor(cSite(id, level, part, side));
  ok(`Region C workup curated: ${id}`, ns.curated === true);
  ok(`Region C workup has all four tiers: ${id}`,
     ns.immediate.length > 0 && ns.investigations.length > 0 && ns.confirmatory.length > 0 && ns.monitoring.length > 0);
}

// locked-in / basilar occlusion — the reversible catastrophe
{ const ns = nextStepsFor(cSite("locked_in", "locked_in", "ventral_pons"));
  ok("locked-in is an emergency", ns.urgency === "emergency");
  ok("locked-in workup names basilar imaging (CTA/MRA)", ns.investigations.some(i => /cta|mra|angiog|basilar/i.test(i)));
  ok("locked-in referral names thrombectomy / neurointervention",
     /thrombectom|neurointerven|endovascular|stroke/i.test(ns.referral));
  ok("locked-in bedside establishes vertical-eye-movement communication with an AWAKE patient",
     ns.immediate.some(i => /vertical|blink|eye movement|awake|aware/i.test(i))); }

// cerebellar mass effect — posterior fossa swelling kills by obstructive hydrocephalus.
// Scoped to the sites that can actually mass (focal infarct/haemorrhage/tumour); pancerebellar is a
// diffuse degenerative/toxic syndrome, where a swelling warning would be clinically wrong, not merely absent.
{ for (const id of ["cerebellum_vermis","cerebellum_flocculonodular"]) {
    const ns = nextStepsFor(cSite(id, "cerebellum", id.split("_")[1]));
    ok(`${id} monitoring warns about posterior-fossa swelling / hydrocephalus`,
       ns.monitoring.some(i => /swell|hydrocephalus|conscious|deteriorat|herniat/i.test(i)));
  } }

// bilateral thalamic — image the veins, not just the arteries
{ const ns = nextStepsFor(cSite("thalamus_bilateral_percheron", "thalamus_arousal", "paramedian"));
  ok("Percheron workup includes venous imaging for deep cerebral venous thrombosis",
     ns.investigations.concat(ns.confirmatory).some(i => /venogra|venous|\bctv\b|\bmrv\b/i.test(i))); }

// pancerebellar — the treatable/reversible screen
{ const ns = nextStepsFor(cSite("cerebellum_pancerebellar", "cerebellum", "pancerebellar"));
  ok("pancerebellar workup screens reversible causes (drug levels, B12/thyroid, paraneoplastic)",
     ns.confirmatory.concat(ns.investigations).some(i => /drug level|phenytoin|b12|thyroid|paraneoplas/i.test(i))); }

// upbeat nystagmus — treat thiamine empirically, do not wait
{ const ns = nextStepsFor(cSite("pontomesencephalic_tegmentum", "pontomesencephalic", "tegmentum"));
  ok("upbeat-nystagmus workup gives empirical thiamine before confirmation",
     ns.immediate.concat(ns.investigations).some(i => /thiamine|pabrinex/i.test(i))); }

// --- Region D: skull base / cranial-nerve course, visual pathway, pupil, olfactory ---
const dSite = (lvl, part) => ({ id: `left_${lvl}_${part}`, level: lvl, part, side: "left", territory: "" });
const REGION_D_SITES = [
  ["visual_pathway","chiasm"], ["visual_pathway","optic_tract"], ["visual_pathway","lgn"],
  ["skull_base","optic_canal"], ["olfactory","olfactory_groove"],
  ["pupil","cn3_compressive"], ["pupil","cn3_ischaemic"], ["pupil","ciliary_ganglion"],
  ["skull_base","iii_orbit_sup"], ["skull_base","iii_orbit_inf"], ["skull_base","vi_cisternal"],
  ["skull_base","vi_petrous_apex"], ["skull_base","trochlear_cisternal"], ["skull_base","sup_orbital_fissure"],
  ["skull_base","v_ganglion"], ["skull_base","v1_division"], ["skull_base","v1_petrous"],
  ["skull_base","foramen_rotundum"], ["skull_base","v3_ovale"],
  ["skull_base","vii_tympanic"], ["skull_base","vii_mastoid"], ["skull_base","vii_parotid"],
  ["skull_base","ix_jugular"], ["skull_base","x_jugular"], ["skull_base","x_recurrent_laryngeal"],
  ["skull_base","xi_jugular"], ["skull_base","xi_posterior_triangle"],
  ["skull_base","hypoglossal_canal"], ["skull_base","xii_neck"], ["skull_base","carotid_space"],
  ["skull_base","collet_sicard"], ["skull_base","villaret"],
];
for (const [lvl, part] of REGION_D_SITES) {
  const ns = nextStepsFor(dSite(lvl, part));
  ok(`Region D workup curated: ${lvl}_${part}`, ns.curated === true);
  ok(`Region D workup has all four tiers: ${lvl}_${part}`,
     ns.immediate.length > 0 && ns.investigations.length > 0 && ns.confirmatory.length > 0 && ns.monitoring.length > 0);
}

// pupil-involving CN III — the aneurysm rule
{ const ns = nextStepsFor(dSite("pupil", "cn3_compressive"));
  ok("compressive CN III is an emergency", ns.urgency === "emergency");
  ok("compressive CN III gets emergency vessel imaging (CTA/MRA/angiography)",
     ns.investigations.some(i => /cta|mra|angiog/i.test(i)));
  ok("compressive CN III bedside checks the PUPIL first", ns.immediate.some(i => /pupil/i.test(i))); }

// chiasm — visual fields plus the endocrine emergency
{ const ns = nextStepsFor(dSite("visual_pathway", "chiasm"));
  ok("chiasm workup orders formal visual fields", ns.immediate.concat(ns.investigations).some(i => /field|perimetr/i.test(i)));
  ok("chiasm workup includes pituitary hormone profile", ns.investigations.concat(ns.confirmatory).some(i => /pituitary|hormone|endocrin|cortisol|prolactin/i.test(i)));
  ok("chiasm workup covers apoplexy: steroids without waiting",
     ns.immediate.concat(ns.monitoring).some(i => /steroid|hydrocortisone|apoplexy/i.test(i))); }

// carotid space — dissection is a stroke waiting to happen
{ const ns = nextStepsFor(dSite("skull_base", "carotid_space"));
  ok("carotid space workup images the vessels urgently", ns.investigations.some(i => /cta|mra|doppler|angiog|vessel|fat.sat/i.test(i)));
  ok("carotid space monitoring warns about impending stroke", ns.monitoring.some(i => /stroke|tia|antiplatelet|anticoagul/i.test(i))); }

// parotid facial palsy — not Bell's, so not steroids-and-go-home
{ const ns = nextStepsFor(dSite("skull_base", "vii_parotid"));
  ok("parotid facial palsy workup examines/images the parotid and neck",
     ns.immediate.concat(ns.investigations).some(i => /parotid|neck|mass|lump/i.test(i)));
  ok("parotid facial palsy refers to ENT / maxillofacial rather than treating as Bell's",
     /ent|maxillofacial|head and neck|surg/i.test(ns.referral)); }

// recurrent laryngeal — image the WHOLE course, into the chest
{ const ns = nextStepsFor(dSite("skull_base", "x_recurrent_laryngeal"));
  ok("recurrent laryngeal workup includes laryngoscopy", ns.immediate.concat(ns.investigations).some(i => /laryngoscop|cord|ent/i.test(i)));
  ok("recurrent laryngeal workup images the neck AND chest", ns.investigations.some(i => /chest|thora|mediastin/i.test(i))); }

// facial palsy segments — eye protection whenever closure fails
{ for (const part of ["vii_tympanic","vii_mastoid"]) {
    const ns = nextStepsFor(dSite("skull_base", part));
    ok(`${part} workup involves ENT urgently`, /ent|otolaryng/i.test(ns.referral));
  } }
// trigeminal — an anaesthetic cornea needs protecting
{ const ns = nextStepsFor(dSite("skull_base", "v_ganglion"));
  ok("trigeminal ganglion monitoring protects the anaesthetic cornea", ns.monitoring.concat(ns.immediate).some(i => /cornea|eye protect|lubric/i.test(i))); }

// numb chin — treat as malignancy until proven otherwise
{ const ns = nextStepsFor(dSite("skull_base", "v3_ovale"));
  ok("V3 workup pursues malignancy (imaging skull base ± systemic screen)",
     ns.investigations.concat(ns.confirmatory).some(i => /mri|ct|malignan|primary|screen|biopsy/i.test(i))); }

// olfactory — test smell formally, and examine the nose
{ const ns = nextStepsFor(dSite("olfactory", "olfactory_groove"));
  ok("olfactory workup tests smell formally", ns.immediate.concat(ns.investigations).some(i => /smell|olfact|sniff|upsit/i.test(i))); }

// --- Region E: named peripheral nerves + polyneuropathy + motor unit ---
const eSite = (lvl, part) => ({ id: `left_${lvl}_${part}`, level: lvl, part, side: "left", territory: "" });
const REGION_E_SITES = [
  ["nerve","phrenic"],["nerve","pudendal"],["nerve","saphenous"],["nerve","sural"],["nerve","axillary"],
  ["nerve","musculocutaneous"],["nerve","suprascapular"],["nerve","long_thoracic"],["nerve","radial_axilla"],
  ["nerve","radial_spiral_groove"],["nerve","radial_pin"],["nerve","median_proximal"],["nerve","median_ain"],
  ["nerve","median_carpal_tunnel"],["nerve","ulnar_elbow"],["nerve","ulnar_wrist"],["nerve","femoral"],
  ["nerve","obturator"],["nerve","lat_fem_cutaneous"],["nerve","superior_gluteal"],["nerve","sciatic"],
  ["nerve","peroneal_common"],["nerve","peroneal_deep"],["nerve","peroneal_superficial"],["nerve","tibial"],
  ["polyneuropathy","length_dependent"],["motor_unit","nmj_presynaptic"],["motor_unit","muscle"],
];
for (const [lvl, part] of REGION_E_SITES) {
  const ns = nextStepsFor(eSite(lvl, part));
  ok(`Region E workup curated: ${lvl}_${part}`, ns.curated === true);
  ok(`Region E workup has all four tiers: ${lvl}_${part}`,
     ns.immediate.length > 0 && ns.investigations.length > 0 && ns.confirmatory.length > 0 && ns.monitoring.length > 0);
}

// nerve conduction studies are the shared backbone of the entrapment workups
{ let missing = null;
  for (const [lvl, part] of REGION_E_SITES) {
    if (lvl !== "nerve") continue;
    const ns = nextStepsFor(eSite(lvl, part));
    if (!ns.investigations.concat(ns.confirmatory).some(i => /nerve conduction|\bncs\b|\bemg\b|electrophysiolog/i.test(i))) { missing = `${lvl}_${part}`; break; }
  }
  ok(`every named-nerve workup includes nerve conduction studies / EMG (missing: ${missing})`, missing === null); }

// femoral — the anticoagulated bleed is the emergency
{ const ns = nextStepsFor(eSite("nerve", "femoral"));
  ok("femoral workup images the retroperitoneum urgently", ns.investigations.some(i => /ct|retroperiton|imaging/i.test(i)));
  ok("femoral workup checks clotting / reverses anticoagulation", ns.immediate.concat(ns.investigations).some(i => /clotting|inr|anticoagul|revers/i.test(i))); }

// phrenic — image the chest, don't just reassure
{ const ns = nextStepsFor(eSite("nerve", "phrenic"));
  ok("phrenic workup includes chest imaging for malignancy", ns.investigations.some(i => /chest|\bct\b|x.ray|fluorosc/i.test(i)));
  ok("phrenic workup assesses respiratory function", ns.investigations.concat(ns.immediate).some(i => /spiromet|vital capacity|lung function|erect and supine/i.test(i))); }

// peroneal — the foot-drop discriminator must be at the bedside
{ const ns = nextStepsFor(eSite("nerve", "peroneal_common"));
  ok("peroneal workup tests INVERSION at the bedside to exclude L5", ns.immediate.some(i => /inversion|\bl5\b/i.test(i)));
  ok("peroneal monitoring covers foot-drop splinting and falls", ns.monitoring.some(i => /splint|orthosis|afo|falls|trip/i.test(i))); }

// carpal tunnel — conservative first, and the systemic screen
{ const ns = nextStepsFor(eSite("nerve", "median_carpal_tunnel"));
  ok("carpal tunnel workup screens reversible systemic causes", ns.investigations.some(i => /thyroid|tsh|glucose|hba1c|pregnan/i.test(i)));
  ok("carpal tunnel management mentions splinting before surgery", ns.immediate.concat(ns.monitoring).some(i => /splint|conservat/i.test(i))); }

// polyneuropathy — the treatable screen, and the red-flag escalation
{ const ns = nextStepsFor(eSite("polyneuropathy", "length_dependent"));
  ok("polyneuropathy workup screens the treatable causes (glucose, B12, TFT, electrophoresis)",
     ns.investigations.some(i => /b12/i.test(i)) && ns.investigations.some(i => /glucose|hba1c/i.test(i)) &&
     ns.investigations.some(i => /electrophoresis|paraprotein|light chain/i.test(i)));
  ok("polyneuropathy monitoring includes foot care", ns.monitoring.some(i => /foot care|footwear|ulcer|podiatr/i.test(i)));
  ok("polyneuropathy escalates rapid/asymmetric progression (GBS vital capacity)",
     ns.monitoring.concat(ns.immediate).some(i => /vital capacity|rapid|ascend|urgent|escalat/i.test(i))); }

// LEMS — find the tumour
{ const ns = nextStepsFor(eSite("motor_unit", "nmj_presynaptic"));
  ok("LEMS workup mandates CT chest for small cell lung cancer", ns.investigations.some(i => /ct chest|chest|lung/i.test(i)));
  ok("LEMS workup sends voltage-gated calcium channel antibodies", ns.investigations.concat(ns.confirmatory).some(i => /calcium channel|vgcc|antibod/i.test(i)));
  ok("LEMS monitoring repeats cancer screening if initially negative", ns.monitoring.some(i => /repeat|surveill|re.screen|interval/i.test(i))); }

// myopathy — CK, and the rhabdo emergency
{ const ns = nextStepsFor(eSite("motor_unit", "muscle"));
  ok("myopathy workup checks creatine kinase", ns.investigations.some(i => /creatine kinase|\bck\b/i.test(i)));
  ok("myopathy workup covers rhabdomyolysis (renal function, urine myoglobin, potassium)",
     ns.immediate.concat(ns.investigations).some(i => /renal|potassium|myoglobin|urine|kidney/i.test(i))); }

// --- Region F: nerve roots + plexus ---
const fSite = (lvl, part) => ({ id: `left_${lvl}_${part}`, level: lvl, part, side: "left", territory: "" });
const REGION_F_ROOTS = ["c3","c4","c5","c6","c7","c8","t1","t4","t10","l1","l2","l3","l4","l5","s1","s2","s3"];
const REGION_F_PLEXUS = ["upper_trunk","middle_trunk","lower_trunk","lateral_cord","medial_cord","posterior_cord","lumbar_plexus","sacral_plexus"];
for (const p of REGION_F_ROOTS) {
  const ns = nextStepsFor(fSite("root", p));
  ok(`Region F workup curated: root_${p}`, ns.curated === true);
  ok(`Region F workup has all four tiers: root_${p}`,
     ns.immediate.length > 0 && ns.investigations.length > 0 && ns.confirmatory.length > 0 && ns.monitoring.length > 0);
}
for (const p of REGION_F_PLEXUS) {
  const ns = nextStepsFor(fSite("plexus", p));
  ok(`Region F workup curated: plexus_${p}`, ns.curated === true);
  ok(`Region F workup has all four tiers: plexus_${p}`,
     ns.immediate.length > 0 && ns.investigations.length > 0 && ns.confirmatory.length > 0 && ns.monitoring.length > 0);
}

// every root workup must image the right part of the spine
{ let bad = null;
  for (const p of REGION_F_ROOTS) {
    const ns = nextStepsFor(fSite("root", p));
    if (!ns.investigations.some(i => /mri/i.test(i))) { bad = `root_${p}`; break; }
  }
  ok(`every root workup includes MRI of the relevant spine (offender: ${bad})`, bad === null); }

// cervical roots — check for myelopathy, which changes the urgency entirely
{ let bad = null;
  for (const p of ["c5","c6","c7"]) {
    const ns = nextStepsFor(fSite("root", p));
    if (!ns.immediate.concat(ns.monitoring).some(i => /myelopath|cord|hoffmann|upgoing|brisk|gait/i.test(i))) { bad = `root_${p}`; break; }
  }
  ok(`cervical root workups screen for myelopathy (offender: ${bad})`, bad === null); }

// C8/T1 — image the lung apex
{ for (const p of ["c8","t1"]) {
    const ns = nextStepsFor(fSite("root", p));
    ok(`root_${p} workup images the lung apex (Pancoast)`, ns.investigations.some(i => /apex|apical|chest|pancoast|\bct\b/i.test(i)));
  } }

// thoracic roots — exclude visceral disease before calling it radicular
{ const ns = nextStepsFor(fSite("root", "t4"));
  ok("T4 workup excludes cardiac/visceral causes first",
     ns.immediate.concat(ns.investigations).some(i => /ecg|cardiac|troponin|visceral|aort/i.test(i))); }

// S2/S3 — cauda equina safety net
{ for (const p of ["s2","s3"]) {
    const ns = nextStepsFor(fSite("root", p));
    ok(`root_${p} is an emergency (cauda equina risk)`, ns.urgency === "emergency");
    ok(`root_${p} bedside checks saddle sensation / sphincter`, ns.immediate.some(i => /saddle|anal tone|bladder|post.void/i.test(i)));
  } }

// lumbosacral roots — safety-net for cauda equina even when the root lesion looks routine
{ let bad = null;
  for (const p of ["l4","l5","s1"]) {
    const ns = nextStepsFor(fSite("root", p));
    if (!ns.monitoring.some(i => /cauda equina|saddle|bladder|sphincter/i.test(i))) { bad = `root_${p}`; break; }
  }
  ok(`lumbosacral root workups safety-net cauda equina (offender: ${bad})`, bad === null); }

// plexus — EMG is what separates radiation from tumour
{ let bad = null;
  for (const p of REGION_F_PLEXUS) {
    const ns = nextStepsFor(fSite("plexus", p));
    if (!ns.investigations.concat(ns.confirmatory).some(i => /emg|nerve conduction|electrophysiolog/i.test(i))) { bad = `plexus_${p}`; break; }
  }
  ok(`every plexus workup includes EMG/NCS (offender: ${bad})`, bad === null); }
{ const ns = nextStepsFor(fSite("plexus", "lower_trunk"));
  ok("lower trunk workup images the lung apex for Pancoast", ns.investigations.some(i => /apex|apical|chest|pancoast/i.test(i)));
  ok("lower trunk workup looks for myokymia to separate radiation from tumour",
     ns.investigations.concat(ns.confirmatory).some(i => /myokymia/i.test(i))); }
{ const ns = nextStepsFor(fSite("plexus", "upper_trunk"));
  ok("upper trunk workup flags the early surgical window for avulsion",
     ns.monitoring.concat(ns.referral ? [ns.referral] : []).some(i => /month|early|window|transfer|graft|refer/i.test(i)));
  ok("upper trunk workup looks for pseudomeningocele on imaging",
     ns.investigations.concat(ns.confirmatory).some(i => /pseudomeningocele|avuls|myelogra|mri.*plexus|plexus.*mri/i.test(i))); }
{ const ns = nextStepsFor(fSite("plexus", "lumbar_plexus"));
  ok("lumbar plexus workup checks clotting / images the retroperitoneum",
     ns.immediate.concat(ns.investigations).some(i => /clotting|inr|anticoagul|retroperiton|\bct\b/i.test(i))); }

// --- Region G: remaining cortex (higher function, aphasias, frontal syndromes) ---
const gSite = (part) => ({ id: `left_cortex_${part}`, level: "cortex", part, side: "left", territory: "" });
const REGION_G_PARTS = ["frontal_eye_field","dlpfc","medial_pfc","orbitofrontal","temporoparietal","temporal",
  "insula","sensory_hand","arcuate","angular","premotor","sma","paracentral","auditory","anterior_temporal",
  "fusiform","aphasia_global","aphasia_mixed_transcortical"];
for (const p of REGION_G_PARTS) {
  const ns = nextStepsFor(gSite(p));
  ok(`Region G workup curated: cortex_${p}`, ns.curated === true);
  ok(`Region G workup has all four tiers: cortex_${p}`,
     ns.immediate.length > 0 && ns.investigations.length > 0 && ns.confirmatory.length > 0 && ns.monitoring.length > 0);
}

// HSV — aciclovir before the PCR, every time it is on the differential
{ for (const p of ["temporal","anterior_temporal"]) {
    const ns = nextStepsFor(gSite(p));
    ok(`cortex_${p} starts empirical aciclovir without waiting`,
       ns.immediate.some(i => /aciclovir|acyclovir/i.test(i)));
    ok(`cortex_${p} sends CSF / viral PCR`, ns.investigations.concat(ns.confirmatory).some(i => /lumbar puncture|csf|pcr/i.test(i)));
  } }
{ const ns = nextStepsFor(gSite("temporal"));
  ok("temporal workup covers autoimmune/limbic antibodies", ns.confirmatory.some(i => /antibod|lgi1|nmda|paraneoplas/i.test(i)));
  ok("temporal workup includes EEG", ns.investigations.concat(ns.confirmatory).some(i => /eeg/i.test(i))); }

// paracentral — image the BRAIN when the cord scan is normal
{ const ns = nextStepsFor(gSite("paracentral"));
  ok("paracentral workup images the BRAIN for the cord mimic",
     ns.investigations.some(i => /brain|mri head|intracranial/i.test(i)));
  ok("paracentral workup includes venography for sagittal sinus thrombosis",
     ns.investigations.concat(ns.confirmatory).some(i => /venogra|\bmrv\b|\bctv\b|venous/i.test(i))); }

// global aphasia — malignant MCA monitoring
{ const ns = nextStepsFor(gSite("aphasia_global"));
  ok("global aphasia is an emergency", ns.urgency === "emergency");
  ok("global aphasia monitors for malignant oedema and decompression",
     ns.monitoring.some(i => /oedema|edema|craniectomy|conscious|swell|decompress/i.test(i))); }

// mixed transcortical — find the haemodynamic cause
{ const ns = nextStepsFor(gSite("aphasia_mixed_transcortical"));
  ok("mixed transcortical workup images the carotids", ns.investigations.some(i => /carotid|cta|mra|doppler/i.test(i)));
  ok("mixed transcortical bedside tests REPETITION specifically", ns.immediate.some(i => /repetition|repeat|echolal/i.test(i))); }

// dementia-leaning frontal sites need the reversible screen
{ for (const p of ["dlpfc","medial_pfc","orbitofrontal"]) {
    const ns = nextStepsFor(gSite(p));
    ok(`cortex_${p} screens reversible causes (B12/thyroid/imaging)`,
       ns.investigations.some(i => /b12|thyroid|tsh|reversible|bloods/i.test(i)));
    ok(`cortex_${p} images to exclude a frontal mass`, ns.investigations.some(i => /mri|\bct\b/i.test(i)));
  } }
{ const ns = nextStepsFor(gSite("orbitofrontal"));
  ok("orbitofrontal workup tests SMELL (subfrontal meningioma)", ns.immediate.some(i => /smell|olfact|anosmia/i.test(i))); }
{ const ns = nextStepsFor(gSite("dlpfc"));
  ok("DLPFC workup considers NPH as reversible", ns.investigations.concat(ns.confirmatory).some(i => /hydrocephalus|\bnph\b|ventric|tap test/i.test(i))); }

// insula — cardiac monitoring
{ const ns = nextStepsFor(gSite("insula"));
  ok("insular workup includes cardiac monitoring / ECG", ns.immediate.concat(ns.investigations).some(i => /ecg|cardiac|telemetry|troponin/i.test(i))); }

// bedside tests that are otherwise missed
{ const ns = nextStepsFor(gSite("angular"));
  ok("angular workup tests the Gerstmann elements at the bedside",
     ns.immediate.some(i => /calculat|writ|finger|left.right|gerstmann/i.test(i))); }
{ const ns = nextStepsFor(gSite("premotor"));
  ok("premotor workup tests apraxia by miming tool use",
     ns.immediate.some(i => /mime|pretend|apraxia|tool|gesture/i.test(i))); }
{ const ns = nextStepsFor(gSite("sma"));
  ok("SMA monitoring reassures about the transient post-resection deficit",
     ns.monitoring.some(i => /recover|transient|weeks|reassur/i.test(i))); }
{ const ns = nextStepsFor(gSite("sensory_hand"));
  ok("cortical sensory hand tests discriminative sensation (stereognosis / graphaesthesia)",
     ns.immediate.some(i => /stereognos|graphaesth|graphesth|two.point|discriminat/i.test(i)));
  ok("cortical sensory hand treats a transient episode as a TIA", ns.investigations.concat(ns.monitoring).some(i => /tia|secondary prevention|antiplatelet|carotid/i.test(i))); }

// aphasia sites all need speech and language therapy follow-up
{ let bad = null;
  for (const p of ["temporoparietal","arcuate","angular","aphasia_global","aphasia_mixed_transcortical"]) {
    const ns = nextStepsFor(gSite(p));
    if (!ns.monitoring.some(i => /speech and language|\bsalt\b|speech therap/i.test(i))) { bad = `cortex_${p}`; break; }
  }
  ok(`every aphasia site refers to speech and language therapy (offender: ${bad})`, bad === null); }

// --- Region H: the closing sweep ---
const hSite = (lvl, part) => ({ id: `left_${lvl}_${part}`, level: lvl, part, side: "left", territory: "" });
const REGION_H_SITES = [
  ["hypothalamus","supraoptic"],["hypothalamus","thermoregulatory"],["hypothalamus","ventromedial"],
  ["hypothalamus","lateral"],["hypothalamus","suprachiasmatic"],["hypothalamus","mammillary"],["hypothalamus","tuberal"],
  ["thalamus","vpm"],["thalamus","vl"],["thalamus","pulvinar"],["thalamus","limbic"],
  ["peripheral_vestibular","posterior_canal"],["peripheral_vestibular","horizontal_canal"],["peripheral_vestibular","anterior_canal"],
  ["basal_ganglia","subthalamic"],["basal_ganglia","striatum"],
  ["corpus_callosum","anterior"],["corpus_callosum","splenium"],
  ["aphasia_subcortical","thalamic"],["aphasia_subcortical","striatocapsular"],
  ["sympathetic","preganglionic"],["sympathetic","pancoast"],["cerebrum","diffuse"],
];
for (const [lvl, part] of REGION_H_SITES) {
  const ns = nextStepsFor(hSite(lvl, part));
  ok(`Region H workup curated: ${lvl}_${part}`, ns.curated === true);
  ok(`Region H workup has all four tiers: ${lvl}_${part}`,
     ns.immediate.length > 0 && ns.investigations.length > 0 && ns.confirmatory.length > 0 && ns.monitoring.length > 0);
}

// hypothalamic sites need pituitary/endocrine assessment, not just imaging.
// EXCEPT the mammillary bodies: they are a limbic/memory structure, and their syndrome is nutritional
// (Wernicke-Korsakoff), so demanding a pituitary hormone profile there would be padding, not medicine.
{ let bad = null;
  for (const [lvl, part] of REGION_H_SITES.filter(([l, p]) => l === "hypothalamus" && p !== "mammillary")) {
    const ns = nextStepsFor(hSite(lvl, part));
    if (!ns.investigations.concat(ns.confirmatory).some(i => /pituitary|hormone|endocrin|cortisol|thyroid/i.test(i))) { bad = part; break; }
  }
  ok(`every hypothalamic workup includes endocrine assessment (offender: ${bad})`, bad === null); }
{ const ns = nextStepsFor(hSite("hypothalamus", "supraoptic"));
  ok("DI workup pairs serum and urine osmolality", ns.investigations.some(i => /osmolal/i.test(i)));
  ok("DI workup monitors sodium and fluid balance", ns.monitoring.some(i => /sodium|fluid balance/i.test(i))); }
{ const ns = nextStepsFor(hSite("hypothalamus", "mammillary"));
  ok("mammillary is an emergency", ns.urgency === "emergency");
  ok("mammillary gives thiamine before glucose", ns.immediate.some(i => /thiamine/i.test(i) && /glucose|before/i.test(i))); }
{ const ns = nextStepsFor(hSite("hypothalamus", "tuberal"));
  ok("tuberal workup images for a hamartoma with dedicated sequences", ns.investigations.some(i => /hamartoma|thin|dedicated|hypothalam/i.test(i))); }
{ const ns = nextStepsFor(hSite("hypothalamus", "lateral"));
  ok("narcolepsy workup includes sleep studies / orexin", ns.investigations.concat(ns.confirmatory).some(i => /polysomnog|mslt|orexin|hypocretin|sleep study/i.test(i))); }

// BPPV — the treatment IS the bedside manoeuvre
{ const ns = nextStepsFor(hSite("peripheral_vestibular", "posterior_canal"));
  ok("posterior-canal workup performs Dix-Hallpike at the bedside", ns.immediate.some(i => /dix.hallpike/i.test(i)));
  ok("posterior-canal treatment is the Epley manoeuvre", ns.immediate.concat(ns.monitoring).some(i => /epley|repositioning/i.test(i)));
  ok("posterior-canal workup applies HINTS to exclude stroke", ns.immediate.some(i => /hints|head impulse/i.test(i)));
  ok("uncomplicated BPPV does not need routine imaging", ns.investigations.some(i => /not.*routin|no.*imaging|imaging is not|unnecessary|only if/i.test(i))); }
{ const ns = nextStepsFor(hSite("peripheral_vestibular", "horizontal_canal"));
  ok("horizontal-canal workup uses the supine roll test", ns.immediate.some(i => /supine roll|roll test/i.test(i))); }
{ const ns = nextStepsFor(hSite("peripheral_vestibular", "anterior_canal"));
  ok("anterior-canal workup images for a central cause of downbeat nystagmus",
     ns.investigations.some(i => /mri|craniocervical|imaging/i.test(i))); }

// deep grey
{ const ns = nextStepsFor(hSite("basal_ganglia", "subthalamic"));
  ok("hemiballismus workup checks GLUCOSE (non-ketotic hyperglycaemia)", ns.immediate.concat(ns.investigations).some(i => /glucose|hba1c|hyperglyc/i.test(i))); }
{ const ns = nextStepsFor(hSite("basal_ganglia", "striatum"));
  ok("chorea workup checks copper/caeruloplasmin (Wilson's)", ns.investigations.some(i => /copper|caeruloplasmin|ceruloplasmin/i.test(i)));
  ok("chorea workup reviews drugs first", ns.immediate.some(i => /drug|medication/i.test(i)));
  ok("chorea workup includes genetic testing with counselling", ns.confirmatory.some(i => /genetic|huntington|counsel/i.test(i))); }

// callosum
{ const ns = nextStepsFor(hSite("corpus_callosum", "splenium"));
  ok("splenium workup tests reading vs writing", ns.immediate.some(i => /read|writ/i.test(i))); }
{ const ns = nextStepsFor(hSite("corpus_callosum", "anterior"));
  ok("anterior callosum workup gives thiamine if alcohol-related", ns.immediate.concat(ns.investigations).some(i => /thiamine|alcohol/i.test(i))); }

// striatocapsular — the vessel imaging point
{ const ns = nextStepsFor(hSite("aphasia_subcortical", "striatocapsular"));
  ok("striatocapsular is an emergency", ns.urgency === "emergency");
  ok("striatocapsular workup mandates vessel imaging", ns.investigations.some(i => /cta|mra|vessel|angiog/i.test(i))); }

// sympathetic chain
{ for (const part of ["preganglionic","pancoast"]) {
    const ns = nextStepsFor(hSite("sympathetic", part));
    ok(`sympathetic_${part} workup images the lung apex`, ns.investigations.some(i => /apex|apical|chest|\bct\b/i.test(i)));
  } }

// diffuse encephalopathy — look outside the brain, and get an EEG
{ const ns = nextStepsFor(hSite("cerebrum", "diffuse"));
  ok("diffuse encephalopathy screens metabolic causes first",
     ns.investigations.some(i => /glucose|sodium|ammonia|calcium|blood gas|bloods/i.test(i)));
  ok("diffuse encephalopathy includes EEG for non-convulsive status", ns.investigations.concat(ns.confirmatory).some(i => /eeg/i.test(i)));
  ok("diffuse encephalopathy reviews drugs and withdrawal", ns.immediate.some(i => /drug|medication|withdrawal|alcohol/i.test(i))); }

// --- GLOBAL INVARIANT: a curated cause list must never sit beside a generic derived workup ---
// Established in Region A after finding cortex_parietal with rich causes and a fallback workup — it reads
// as half-finished in the app. Now asserted across EVERY candidate site rather than per region.
{
  const gaps = [];
  const seen = new Set();
  for (const s of candidateSites()) {
    const lp = `${s.level}_${s.part}`;
    if (seen.has(lp)) continue;
    seen.add(lp);
    if (causesFor(s, {}).source === "curated" && nextStepsFor(s).curated !== true) gaps.push(lp);
  }
  ok(`INVARIANT: every curated-causes site has a curated workup (${gaps.length} gap(s): ${gaps.slice(0, 5).join(", ")})`, gaps.length === 0);
  // and the four tiers are populated everywhere they are curated
  const thin = [];
  const seen2 = new Set();
  for (const s of candidateSites()) {
    const lp = `${s.level}_${s.part}`;
    if (seen2.has(lp)) continue;
    seen2.add(lp);
    const n = nextStepsFor(s);
    if (n.curated && !(n.immediate.length && n.investigations.length && n.confirmatory.length && n.monitoring.length)) thin.push(lp);
  }
  ok(`INVARIANT: every curated workup fills all four tiers (${thin.length} thin: ${thin.slice(0, 5).join(", ")})`, thin.length === 0);
}

// --- fundal photography + OCT, derived (2026-08-11) ---
// Owner request: fundal photos and OCT must come up as a "what next" prompt wherever the picture involves
// PAPILLOEDEMA or a VISUAL FIELD DEFECT. Both triggers are DERIVED, not hand-listed per site:
//   * field defect  — the site's expectedFindings contain a visual field / optic-nerve finding
//   * papilloedema  — the site's curated causes raise papilloedema, raised ICP or obstructive hydrocephalus
// NB normal-pressure hydrocephalus must NOT trigger it: the pressure is normal, so there is no disc swelling.
{
  const OPHTH = /fundal photograph|optical coherence|OCT/i;
  // Use REAL sites from candidateSites(): expectedFindings() needs site.structures, so a hand-built
  // {id, level, part} literal silently throws and the derived trigger can never fire.
  const all = candidateSites();
  const pick = re => all.find(s => re.test(s.id));
  const prompts = s => {
    const n = nextStepsFor(s);
    return [...n.investigations, ...n.confirmatory, ...n.monitoring, ...n.immediate].some(x => OPHTH.test(x));
  };

  ok("chiasm (bitemporal hemianopia) prompts fundal photography / OCT", prompts(pick(/^visual_pathway_chiasm$/)));
  ok("AION (altitudinal defect) prompts fundal photography / OCT", prompts(pick(/skull_base_optic_aion$/)));
  // raised-ICP / papilloedema sites with no field defect of their own
  ok("paracentral (sagittal sinus thrombosis, papilloedema) prompts fundal photography / OCT", prompts(pick(/cortex_paracentral$/)));
  ok("VI palsy (raised ICP, false localising) prompts fundal photography / OCT", prompts(pick(/skull_base_vi_cisternal$/)));
  // and it must NOT appear where there is no visual or pressure issue — the prompt has to stay signal
  ok("ulnar neuropathy does NOT prompt fundal photography / OCT", !prompts(pick(/nerve_ulnar_elbow$/)));
  ok("cauda equina does NOT prompt fundal photography / OCT", !prompts(pick(/cauda_equina$/)));
  // normal-pressure hydrocephalus must NOT trigger it — the pressure is normal, so there is no papilloedema
  {
    const npOnly = all.find(s => {
      const l = causesFor(s, {}).all;
      return l.some(c => /normal.pressure hydrocephalus/i.test(c.name))
        && !l.some(c => /papilloedema|raised intracranial|sinus thrombosis|hydrocephalus/i.test(`${c.name} ${c.feature || ""}`) && !/normal.pressure/i.test(c.name));
    });
    ok("a normal-pressure-hydrocephalus site is not treated as raised pressure", !npOnly || !prompts(npOnly));
  }

  // global: EVERY site expecting a visual field / optic finding gets the prompt
  const missing = [];
  for (const s of candidateSites()) {
    let exp; try { exp = [...expectedFindings(s)]; } catch { continue; }
    const visual = exp.some(t => /^(homonymous_hemianopia|bitemporal_hemianopia|superior_quadrantanopia|inferior_quadrantanopia|optic_neuropathy|altitudinal_defect|central_scotoma|cortical_blindness)@/.test(t));
    if (!visual) continue;
    const n = nextStepsFor(s);
    const all = [...n.investigations, ...n.confirmatory, ...n.monitoring, ...n.immediate];
    if (!all.some(x => OPHTH.test(x))) missing.push(s.id);
  }
  ok(`INVARIANT: every site with a visual field/optic finding prompts fundal photography + OCT (${missing.length} missing: ${missing.slice(0, 5).join(", ")})`, missing.length === 0);
}

// --- combinedNextSteps: one plan for a multifocal picture (spec 2026-08-14 §6) ---
{
  const { combinedNextSteps } = await import("../src/data/nextSteps.js");
  const cord = candidateSites().find(s => s.id === "left_cord_hemi");
  const nerve = candidateSites().find(s => s.level === "nerve");
  const r = combinedNextSteps([cord, nerve]);
  const cordN = nextStepsFor(cord), nerveN = nextStepsFor(nerve);

  ok("all four tiers are present", ["immediate","investigations","confirmatory","monitoring"].every(k => Array.isArray(r[k])));
  ok("tiers are de-duplicated", r.investigations.length === new Set(r.investigations).size);
  ok("the MOST urgent urgency wins, never an average",
     r.urgency === (["emergency","urgent","routine"].find(u => u === cordN.urgency || u === nerveN.urgency)));
  ok("every investigation from each site survives the union",
     [...cordN.investigations, ...nerveN.investigations].every(i => r.investigations.includes(i)));
  ok("referrals from both sites are unioned",
     r.referral.includes(cordN.referral) && r.referral.includes(nerveN.referral));
  ok("the site list is carried", r.sites.length === 2);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

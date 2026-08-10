// next-steps.test.js — the EDUCATIONAL "what next" layer: first-line investigations, urgency, referral.
// Teaching prompts, NOT clinical directives (no doses / definitive management). Keyed like causes.js:
// curated by site id or level_part, else a derive fallback so EVERY site returns something.
import { nextStepsFor } from "../src/data/nextSteps.js";

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

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

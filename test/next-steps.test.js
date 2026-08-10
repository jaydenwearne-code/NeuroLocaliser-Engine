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

// derived tiers: NMJ/motor-unit site gets a respiratory-function bedside prompt
{ const ns = nextStepsFor({ id: "z_nmu", level: "motor_unit", part: "muscle", territory: "" });
  ok("motor-unit immediate tier prompts respiratory function", ns.immediate.some(i => /respiratory|fvc/i.test(i))); }

// curated: AION (giant-cell arteritis) — sight/life-threatening, ESR/CRP
{ const ns = nextStepsFor({ id: "skull_base_optic_aion", level: "skull_base", part: "optic_aion", territory: "" });
  ok("AION urgency is emergency", ns.urgency === "emergency");
  ok("AION investigations mention ESR / CRP", ns.investigations.some(i => /esr|crp|inflammatory/i.test(i))); }

// derive fallback: an uncurated peripheral nerve site still returns something
{ const ns = nextStepsFor({ id: "z_uncurated", level: "nerve", part: "ulnar_elbow", territory: "" });
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

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

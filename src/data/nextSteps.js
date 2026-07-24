// nextSteps.js — the EDUCATIONAL "what next" layer: first-line investigations, urgency, and referral
// pathway for a lesion at a site. These are TEACHING PROMPTS, not clinical directives — no drug doses, no
// definitive management. The app pairs them with an explicit "not clinical advice" disclaimer.
//
//   nextStepsFor(site) -> { investigations: [str], urgency: "emergency"|"urgent"|"routine", referral, curated }
//
// Keyed like causes.js / the phonebook: curated by site.id (else level_part); a derive fallback keyed off
// site.level / territory so EVERY site returns something (derive-don't-store spirit).

const ns = (investigations, urgency, referral) => ({ investigations, urgency, referral });

// ---- curated, high-value sites (seeded from the phonebook red flags + ddx) ----
export const NEXT = {
  // brainstem / posterior circulation strokes
  medulla_lateral: ns( // Wallenberg
    ["Urgent MRI brain (DWI) + MRA/CTA head & neck — assess vertebral/PICA territory and dissection",
     "Bedside swallow screen before any oral intake (aspiration risk)"],
    "emergency", "Acute stroke team — hyperacute pathway; keep nil by mouth until swallow assessed."),
  medulla_medial: ns( // Dejerine
    ["Urgent MRI brain (DWI) + MRA/CTA — anterior spinal / vertebral territory and dissection"],
    "emergency", "Acute stroke team — hyperacute pathway."),
  midbrain_medial: ns( // Weber
    ["Urgent MRI brain + vascular imaging; crossed brainstem signs may be haemorrhage, so include CT/GRE"],
    "emergency", "Acute stroke team; image before assuming infarct."),
  pons_medial: ns( // Millard-Gubler / Foville
    ["Urgent MRI brain + MRA (basilar territory)", "Consider CT if haemorrhage suspected"],
    "emergency", "Acute stroke team — basilar disease can progress to locked-in; monitor closely."),
  central_vestibular_nucleus: ns( // central AVS / HINTS-central
    ["Urgent MRI brain (DWI, posterior fossa) — a normal head-impulse with skew/direction-changing nystagmus suggests stroke, not neuritis"],
    "emergency", "Acute stroke team — do not discharge as peripheral vertigo."),
  // skull base
  skull_base_cavernous_sinus: ns(
    ["MRI brain + orbits with contrast + MRV (cavernous sinus)", "Inflammatory markers; blood cultures if septic thrombosis suspected"],
    "urgent", "Neurosurgery / ophthalmology; septic cavernous sinus thrombosis needs urgent antimicrobials + neurosurgical input."),
  skull_base_optic_aion: ns( // AION — exclude GCA
    ["Immediate ESR + CRP (± platelets) to exclude giant-cell arteritis", "Temporal artery ultrasound / biopsy if GCA suspected"],
    "emergency", "Same-day ophthalmology + rheumatology if GCA suspected — sight- and life-threatening."),
  skull_base_optic_neuritis: ns(
    ["MRI brain + orbits with contrast (demyelination)", "Aquaporin-4 (NMO) and MOG antibodies"],
    "urgent", "Neurology / neuro-ophthalmology."),
  skull_base_cpa: ns(
    ["MRI internal auditory meatus with contrast", "Pure-tone audiogram"],
    "routine", "ENT / skull-base neurosurgery."),
  // cord
  cord_anterior: ns(
    ["Urgent whole-spine MRI to exclude cord compression", "If non-compressive: consider vascular / inflammatory (MRI cord signal, LP, aquaporin-4/MOG)"],
    "emergency", "Spinal surgery / neurology — cord compression is time-critical."),
  // cortex / deep vascular
  cortex_mca: ns(
    ["Immediate non-contrast CT head, then CT/MR angiography + perfusion", "Bloods incl. glucose; ECG"],
    "emergency", "Hyperacute stroke pathway — assess for thrombolysis / thrombectomy within the window."),
  subcortex_internal_capsule: ns( // lacune
    ["MRI brain (DWI) — small-vessel lacune", "Vascular risk-factor screen (BP, glucose, lipids); consider hypertensive haemorrhage on CT"],
    "urgent", "Stroke team / TIA clinic."),
  // motor unit
  motor_unit_anterior_horn: ns( // MND / SMA
    ["EMG / nerve conduction studies", "MRI brain + cord to exclude a structural mimic"],
    "routine", "Neuromuscular / MND clinic."),
  motor_unit_nmj_postsynaptic: ns( // myasthenia
    ["Acetylcholine-receptor (± MuSK) antibodies", "Repetitive nerve stimulation / single-fibre EMG", "CT chest for thymoma"],
    "urgent", "Neurology — watch for bulbar/respiratory involvement (myasthenic crisis)."),
  // peripheral vestibular
  peripheral_vestibular_labyrinth: ns(
    ["Clinical HINTS exam (peripheral pattern); audiometry if hearing involved"],
    "routine", "Usually self-limiting; ENT / neurology if atypical or central features."),
};

// ---- derive fallback (derive-don't-store) — keyed off site.level / territory ----
function derive(site) {
  const terr = (site.territory || "").toLowerCase();
  const vasc = /aca|mca|pca|pica|aica|\bsca\b|basilar|vertebral|perforator|lenticulostriate|spinal artery|choroidal/.test(terr);
  if (vasc) return ns(["Immediate non-contrast CT head, then CT/MR angiography"], "emergency", "Acute stroke pathway.");
  switch (site.level) {
    case "cord":
      return ns(["Urgent whole-spine MRI to exclude cord compression"], "emergency", "Spinal surgery / neurology — cord compression is time-critical.");
    case "cauda": case "conus":
      return ns(["Urgent lumbosacral MRI (cauda equina / conus)", "Post-void bladder scan"], "emergency", "Emergency spinal surgery — cauda equina is time-critical.");
    case "skull_base":
      return ns(["MRI skull base with contrast", "Targeted bloods per the differential"], "urgent", "Neurosurgery / ENT / ophthalmology as appropriate.");
    case "nerve": case "root": case "plexus":
      return ns(["Nerve conduction studies / EMG", "Imaging if a compressive cause is suspected"], "routine", "Neurology / neurophysiology.");
    case "motor_unit": case "polyneuropathy":
      return ns(["Nerve conduction studies / EMG", "Screening bloods (glucose, B12, TFTs, immunoglobulins)"], "routine", "Neuromuscular clinic.");
    case "cerebellum": case "midbrain": case "pons": case "medulla":
      return ns(["MRI brain (posterior fossa) + vascular imaging"], "urgent", "Neurology / stroke team.");
    default:
      return ns(["MRI of the relevant region", "Targeted bloods per the differential"], "routine", "Neurology outpatient referral.");
  }
}

// ---- public API ----
export function nextStepsFor(site) {
  const key = NEXT[site.id] ? site.id : `${site.level}_${site.part}`;
  if (NEXT[key]) return { ...NEXT[key], curated: true };
  return { ...derive(site), curated: false };
}

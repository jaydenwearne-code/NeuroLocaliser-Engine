// pathologyNextSteps.js — the PER-PATHOLOGY workup layer (spec 2026-08-18).
//
//   pathologyPlanFor(name, site) -> { confirmatory, monitoring, urgency, referral } | null
//
// The Next steps card was keyed by SITE, so it unioned every pathology that could produce a lesion there:
// clinically useful while the cause is unknown, wrong the moment it is known — which is usually straight
// after the immediate steps. A card that speaks for ten diseases at once must either say everything
// (noise) or say only what they share (blandness).
//
// Keyed by pathology NAME with per-site interpolation — the sbSpine / nvSpine / rtSpine / rootNS idiom,
// applied to diseases instead of corridors. One `dz()` spine carries what is true of the disease
// everywhere; `bySite` fills the slots that differ, so no two sites emit the same text for a shared name.
//
// DELIBERATELY NOT keyed by canonicalKey(): that collapses 93 names onto 10 very coarse entities — the
// `Metastases` entity alone swallows 40 names, from "Orbital tumour or metastasis" to "Metastasis to the
// pituitary stalk" to "Vertebral metastasis or myeloma", which share almost no workup. Keying by it would
// recreate exactly the blandness this layer exists to remove. Exact synonyms are handled narrowly by
// PATHOLOGY_ALIAS instead.
//
// This file is the CLINICAL CONTENT. It imports nothing from the UI and nothing from nextSteps.js, so a
// reviewer reads only this file. Teaching prompts, not directives — no doses, no definitive management.

// Slot defaults used when a site has no `bySite` entry. Neutral, never invented specifics.
const DEFAULTS = { level: "the affected region", flavour: "the appearance expected for this lesion" };

const fill = (str, slots) => str.replace(/\{([a-z]+)\}/g, (_, k) => slots[k] ?? DEFAULTS[k] ?? "");

const dz = (name, { confirmatory = [], monitoring = [], urgency = null, referral = null, bySite = {} }) =>
  ({ name, confirmatory, monitoring, urgency, referral, bySite });

// Exact synonyms only — two spellings of ONE disease that must share one plan. NOT a place to merge
// related-but-different entities; the no-two-identical-plans invariant is what keeps that honest.
export const PATHOLOGY_ALIAS = {};

export const PATHOLOGY_NEXT = {
  // ---- PROMOTED INTO TRANCHE 1 ON CLINICAL GROUNDS (owner ruling, 2026-08-18) ----
  // Only 2 host sites, so reuse count would have left it until tranche 3. It is nonetheless the app's
  // sharpest must-not-miss: both hosts are BPPV sites that badge "routine", and the whole clinical point
  // of the vestibular axis is that a peripheral-looking acute vestibular syndrome can be a stroke.
  "Posterior circulation stroke": dz("Posterior circulation stroke", {
    confirmatory: [
      "MRI with DWI — but a NEGATIVE early DWI does NOT exclude it: small posterior-fossa infarcts are missed in a substantial minority within the first 24-48 hours, so a convincing central examination outweighs a normal early scan",
      "CT angiography or MR angiography of the vertebrobasilar circulation, looking for vertebral dissection or basilar disease",
      "The bedside examination is the more sensitive test here: {flavour}",
      "Once the diagnosis is made, the usual ischaemic-stroke aetiology work-up — cardiac rhythm monitoring, echocardiography and vascular risk profiling",
    ],
    monitoring: [
      "SAFETY NET: a fluctuating or stuttering course in the posterior circulation can herald basilar occlusion — deterioration in conscious level, new cranial nerve signs or bilateral long-tract signs need immediate reimaging, not observation",
      "Swallow screen before anything by mouth, and monitor for the posterior-fossa oedema that peaks at 2-4 days and can obstruct CSF flow",
      "Track {level} on serial examination — that is where deterioration will show first",
    ],
    urgency: "emergency",
    referral: "Acute stroke pathway — time-critical, and reperfusion may be on the table",
    bySite: {
      peripheral_vestibular_posterior_canal: {
        level: "gaze holding, skew and limb coordination",
        flavour: "HINTS — a NORMAL head impulse in a patient with ongoing vertigo and nystagmus points CENTRAL, and direction-changing or downbeat positional nystagmus is not posterior-canal BPPV, whatever the Dix-Hallpike looks like",
      },
      peripheral_vestibular_horizontal_canal: {
        level: "gaze holding, skew and truncal stability",
        flavour: "HINTS — horizontal-canal BPPV also gives direction-changing nystagmus on the supine roll test, so the discriminators here are a normal head impulse, skew deviation, and truncal ataxia too severe to sit unsupported",
      },
    },
  }),

  // ---- INFECTIVE TRANCHE (2026-08-18) ----
  "Basal meningitis (tuberculous, carcinomatous or fungal)": dz("Basal meningitis (tuberculous, carcinomatous or fungal)", {
    confirmatory: [
      "CSF is the test, and VOLUME matters — tuberculous and malignant cells are both sparse, so send as much as is safe and be prepared to repeat; a single normal-looking sample does not settle it",
      "Send CSF for cell count and differential, protein, PAIRED serum and CSF glucose, mycobacterial culture and PCR, fungal stain, cryptococcal antigen, and CYTOLOGY — cytology should be repeated up to three times, since a first sample misses a substantial share of carcinomatous meningitis",
      "MRI {level} WITH contrast, looking for the basal meningeal enhancement that links these nerve palsies to one process",
      "Look for the systemic source the meninges are reflecting: chest imaging, HIV testing, and a search for a primary malignancy",
    ],
    monitoring: [
      "Track the cranial nerves SERIALLY and by name — {flavour} — because progression from one nerve to the next is the clearest sign the process is uncontrolled",
      "SAFETY NET: hydrocephalus is the complication that kills in tuberculous meningitis — a falling conscious level, headache or vomiting means urgent reimaging, not reassurance",
      "Watch sodium: inappropriate ADH secretion and cerebral salt wasting are both common here and are managed in opposite directions",
    ],
    urgency: "urgent",
    referral: "Neurology with infectious diseases; neuro-oncology where the picture is malignant",
    bySite: {
      skull_base_cpa: {
        level: "brain and the internal auditory meati",
        flavour: "hearing, facial sensation and facial movement, since the cerebellopontine angle nerves fail in a recognised order",
      },
      skull_base_jugular_foramen: {
        level: "brain and the skull base",
        flavour: "swallow, palatal elevation, voice and shoulder shrug, which is where a jugular foramen process declares itself",
      },
      skull_base_orbital_apex: {
        level: "brain and the orbits",
        flavour: "acuity, colour vision and each eye movement separately — the optic nerve is what is lost first and least recoverably here",
      },
      visual_pathway_optic_tract: {
        level: "brain, with dedicated views of the chiasm and suprasellar cistern",
        flavour: "formal visual fields, which map the tract lesion far better than confrontation does",
      },
    },
  }),

  "Herpes zoster": dz("Herpes zoster", {
    confirmatory: [
      "The diagnosis is usually clinical, from a painful eruption in one dermatome — {flavour}",
      "Where the rash is atypical or absent, PCR of a vesicle swab (or of CSF in zoster sine herpete) confirms it",
      "Ask about immunosuppression, and consider HIV testing in a younger patient or where more than one dermatome is involved",
    ],
    monitoring: [
      "Segmental motor weakness accompanies the rash in a minority and is easily missed — examine {level} specifically rather than assuming the deficit is sensory",
      "SAFETY NET: involvement of the ophthalmic division threatens the eye and needs same-day ophthalmology; a rash in the ear with facial weakness is Ramsay Hunt and is treated as an urgency",
      "Post-herpetic neuralgia is the common legacy — flag it early, since pain persisting beyond the rash is the outcome that most affects the patient",
    ],
    urgency: "urgent",
    referral: "Primary care for most; ophthalmology same-day for the ophthalmic division, and neurology if there is motor involvement or dissemination",
    bySite: {
      root_c5: {
        level: "shoulder abduction and elbow flexion",
        flavour: "the C5 dermatome over the shoulder cap and lateral upper arm, where segmental zoster paresis mimics a brachial plexus lesion",
      },
      root_t4: {
        level: "nothing motor — a thoracic root has no limb myotome to test",
        flavour: "a band of pain at the nipple line, which is regularly mistaken for cardiac or pleuritic pain before the rash appears",
      },
      root_l5: {
        level: "ankle dorsiflexion, great-toe extension and hip abduction",
        flavour: "the L5 dermatome over the dorsum of the foot, where the pain precedes the rash and imitates a disc",
      },
    },
  }),

  "Lyme radiculitis (Bannwarth syndrome)": dz("Lyme radiculitis (Bannwarth syndrome)", {
    confirmatory: [
      "Two-tier serology (ELISA then immunoblot) on SERUM, interpreted against the exposure history — a positive test without plausible exposure is more likely a false positive than a diagnosis",
      "CSF showing a lymphocytic pleocytosis with raised protein, and — the discriminating test — an intrathecal antibody index demonstrating antibody made inside the CSF rather than leaked from blood",
      "Ask directly about tick exposure, travel to an endemic area, and a preceding erythema migrans rash, which the patient often has not connected to the pain — {flavour}",
    ],
    monitoring: [
      "Examine for the other neuroborreliosis manifestations that travel with it: facial palsy (which can be bilateral) and a painful radiculitis in more than one root",
      "Track {level}, since motor involvement follows the pain by days to weeks and changes the prognosis",
      "SAFETY NET: severe radicular pain that is worse at night and unresponsive to simple analgesia is the classic presentation, but the same description fits malignant infiltration — if serology is negative, image rather than treating empirically",
    ],
    urgency: "urgent",
    referral: "Neurology with infectious diseases",
    bySite: {
      root_t4: {
        level: "nothing motor at this level — follow the pain and the sensory band",
        flavour: "Bannwarth syndrome is characteristically THORACIC and characteristically painful, and is repeatedly worked up as a cardiac or abdominal problem first",
      },
      root_l5: {
        level: "ankle dorsiflexion and great-toe extension",
        flavour: "a painful lumbar radiculitis with no disc on imaging should prompt the exposure history rather than a repeat scan",
      },
      root_c6: {
        level: "elbow flexion and wrist extension",
        flavour: "a cervical radiculitis with severe nocturnal pain and a normal MRI is the presentation that most often goes unrecognised",
      },
    },
  }),

  "Cerebral abscess": dz("Cerebral abscess", {
    confirmatory: [
      "MRI with DIFFUSION-WEIGHTED imaging — a pyogenic abscess cavity RESTRICTS diffusion, which is what separates it from the necrotic centre of a tumour on an otherwise identical ring-enhancing lesion",
      "Blood cultures before antibiotics, and hunt the source: dental, sinus, middle ear, and echocardiography for endocarditis or a right-to-left shunt",
      "Aspiration gives both the organism and decompression, and is usually the step that settles the diagnosis — discuss with neurosurgery early rather than treating blind",
      "Image {level} to define the lesion in relation to {flavour}",
    ],
    monitoring: [
      "SAFETY NET: do NOT perform a lumbar puncture where there is a mass lesion with oedema — it risks herniation and rarely yields the organism anyway",
      "Watch conscious level and for seizures; monitor for the mass effect that peaks as the capsule matures",
      "Track {level} on serial examination, and reimage on any deterioration rather than waiting for a scheduled scan",
    ],
    urgency: "emergency",
    referral: "Neurosurgery and infectious diseases together, with acute neurology",
    bySite: {
      cortex_operculum: {
        level: "speech output and face and arm power",
        flavour: "the sylvian fissure and the frontal operculum, where a dental or sinus source spreads most readily",
      },
      cortex_parietal: {
        level: "cortical sensation, neglect and visual fields",
        flavour: "the parietal convexity, where a subtle field cut is the earliest sign of expansion",
      },
      cortex_mca_superior: {
        level: "face and arm power and speech output",
        flavour: "the superior MCA division territory, which an embolic source from endocarditis reaches first",
      },
    },
  }),

  "Herpes simplex encephalitis": dz("Herpes simplex encephalitis", {
    confirmatory: [
      "CSF HSV PCR — it can be NEGATIVE in the first 48 hours, so an early negative neither excludes the diagnosis nor justifies stopping treatment; repeat it rather than abandoning it",
      "MRI {level} — {flavour}",
      "EEG, looking for lateralised periodic discharges over the affected region, which are often abnormal before the MRI is",
      "CSF cell count, protein and glucose alongside the PCR: a lymphocytic pleocytosis with red cells and raised protein supports it",
    ],
    monitoring: [
      "SAFETY NET: treatment is started on SUSPICION and continued while the PCR is awaited — waiting for confirmation before treating is the error this diagnosis is known for, and the delay is what determines the outcome",
      "Watch conscious level and for seizures, which are frequent and often subtle; consider continuous EEG if the patient is not waking as expected",
      "Track {level}, and reimage if new focal signs appear — haemorrhagic transformation and swelling of the affected lobe are the complications to anticipate",
    ],
    urgency: "emergency",
    referral: "Acute neurology with infectious diseases; critical care if conscious level is falling",
    bySite: {
      cortex_temporal: {
        level: "memory, language comprehension and behaviour",
        flavour: "ASYMMETRIC medial temporal and insular signal change on FLAIR and diffusion, often with a haemorrhagic component — the asymmetry is the clue",
      },
      cortex_anterior_temporal: {
        level: "memory and behaviour",
        flavour: "anterior temporal involvement extending into the insula and cingulate, characteristically sparing the basal ganglia — a lesion that crosses into the basal ganglia argues for something else",
      },
      cortex_insula: {
        level: "speech, and autonomic stability",
        flavour: "insular signal change continuous with the temporal lobe, which is the earliest MRI finding in many cases",
      },
    },
  }),

  "Skull-base osteomyelitis (malignant otitis externa)": dz("Skull-base osteomyelitis (malignant otitis externa)", {
    confirmatory: [
      "Examine the EAR CANAL and look for granulation tissue at the bony-cartilaginous junction — that finding in a diabetic or elderly patient with deep otalgia and a cranial neuropathy is the diagnosis until proven otherwise",
      "Culture the canal — Pseudomonas aeruginosa is the usual organism — and biopsy the granulation tissue, which is also how a squamous carcinoma masquerading as this is excluded",
      "CT of the skull base for BONE erosion, plus MRI for the soft-tissue and intracranial extent; they answer different questions and are not alternatives",
      "Nuclear imaging tracks disease ACTIVITY and response over time, which anatomical imaging cannot — bone changes persist long after the infection is controlled",
      "Inflammatory markers serially, since ESR is a practical marker of response through a long treatment course",
    ],
    monitoring: [
      "Track {level} by name at every review — {flavour} — because progressive cranial neuropathy is how uncontrolled disease announces itself",
      "SAFETY NET: this is a months-long treatment, and relapse after stopping is well recognised; a returning headache or a new nerve palsy after apparent recovery needs reassessment, not reassurance",
      "Optimise glycaemic control alongside the antimicrobial course — it materially affects the outcome",
    ],
    urgency: "urgent",
    referral: "ENT and infectious diseases jointly, with neurology for the cranial neuropathies",
    bySite: {
      skull_base_vii_mastoid: {
        level: "facial movement, including the forehead",
        flavour: "a facial palsy here is the commonest first nerve to go and marks disease that has left the canal",
      },
      skull_base_jugular_foramen: {
        level: "swallow, palatal elevation, voice and shoulder shrug",
        flavour: "spread to the jugular foramen means the disease has crossed the skull base, and carries a materially worse prognosis",
      },
      skull_base_hypoglossal_canal: {
        level: "tongue protrusion, looking for deviation and wasting",
        flavour: "hypoglossal involvement indicates spread medially along the skull base — among the latest and most ominous signs",
      },
      skull_base_petrous_apex: {
        level: "eye abduction and facial sensation",
        flavour: "petrous apex involvement reproduces Gradenigo's triad, and here it is infective rather than neoplastic",
      },
    },
  }),

  "Spinal epidural abscess": dz("Spinal epidural abscess", {
    confirmatory: [
      "Blood cultures (at least two sets) BEFORE antibiotics wherever the delay is acceptable — the organism guides everything that follows",
      "MRI {level} WITH gadolinium — skip lesions at a non-contiguous level are common, which is why the imaged field matters here",
      "CRP and ESR serially — they track the response better than the white cell count does",
    ],
    monitoring: [
      "Hourly neurological observations while the deficit is evolving — {flavour}",
      "SAFETY NET: new or worsening weakness, or bladder or bowel dysfunction, is a surgical emergency, not a reason to wait for the next scan",
    ],
    urgency: "emergency",
    referral: "Emergency neurosurgery / spinal surgery, with infectious diseases alongside",
    bySite: {
      cord_transverse: {
        level: "the WHOLE spine",
        flavour: "a RISING sensory level is the sign that the collection is expanding",
      },
      root_l5: {
        level: "the whole spine, not the symptomatic level alone",
        flavour: "watch for a radicular deficit becoming a cord or cauda equina syndrome",
      },
    },
  }),
};

export function pathologyPlanFor(name, site) {
  const key = PATHOLOGY_ALIAS[name] || name;
  const p = PATHOLOGY_NEXT[key];
  if (!p) return null;
  const slots = { ...DEFAULTS, ...(p.bySite[site?.id] || p.bySite[`${site?.level}_${site?.part}`] || {}) };
  return {
    confirmatory: p.confirmatory.map(s => fill(s, slots)),
    monitoring: p.monitoring.map(s => fill(s, slots)),
    urgency: p.urgency,
    referral: p.referral,
  };
}

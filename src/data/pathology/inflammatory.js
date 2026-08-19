// inflammatory.js — pathology workups for the INFLAMMATORY / DEMYELINATING / AUTOIMMUNE category.
//
// Content only — the builders live in ./builders.js and the public API in ../pathologyNextSteps.js.
// Teaching prompts, not directives: no doses, no definitive management.
//
// REVIEW STATUS: ✅ all 3 plans here SIGNED OFF 2026-08-18 (tranche 1, round 3).
import { dz } from "./builders.js";

export default {
  // ---- INFLAMMATORY / VASCULAR / METABOLIC TRANCHE (2026-08-18) ----
  "Demyelination": dz("Demyelination", {
    confirmatory: [
      "MRI BRAIN AND WHOLE SPINE with contrast — dissemination in SPACE needs both, and an enhancing lesion alongside a non-enhancing one gives dissemination in TIME on a single scan",
      "MRI {level} — {flavour}",
      "CSF for oligoclonal bands, compared against a PAIRED serum sample: bands present in CSF and not in serum are what count, and they supply dissemination in time where imaging alone falls short",
      "Serum AQP4 and MOG antibodies to exclude the mimics BEFORE committing to a diagnosis of multiple sclerosis — they are different diseases with different treatments, and some MS therapies make NMOSD worse",
      "Visual evoked potentials where a second, clinically silent lesion would change the diagnosis",
    ],
    monitoring: [
      "Distinguish a true RELAPSE from a pseudo-relapse: a deficit re-emerging with heat, infection or fatigue (Uhthoff's phenomenon) is old damage unmasked, not new inflammation, and treating it as a relapse is a common error",
      "Track {level} against the documented baseline — a relapse is defined by new or worsening symptoms lasting more than 24 hours in the absence of fever",
      "SAFETY NET: a FIRST presentation already disseminated in space needs early specialist review — the window in which disease-modifying treatment most changes the long-term course is early, and it is easily lost to a routine referral",
      "Ask about the symptoms patients do not volunteer: bladder function, fatigue and mood, which affect quality of life more than the motor deficit does",
    ],
    urgency: "urgent",
    referral: "Neurology / multiple sclerosis service",
    bySite: {
      cord_lateral: {
        level: "the whole cord and brain",
        flavour: "a SHORT-segment, dorsolateral plaque spanning fewer than two vertebral bodies — a LONGITUDINALLY EXTENSIVE lesion is not typical MS and should redirect you to NMOSD or MOG antibody disease",
      },
      cord_posterior: {
        level: "the whole cord and brain",
        flavour: "a dorsal-column plaque, often with Lhermitte's phenomenon — check B12 too, since subacute combined degeneration occupies the same columns",
      },
      subcortex_optic_radiation: {
        level: "brain, with FLAIR and diffusion",
        flavour: "periventricular ovoid lesions lying perpendicular to the callosum (Dawson's fingers)",
      },
      visual_pathway_optic_tract: {
        level: "brain and orbits with fat-saturated contrast views",
        flavour: "an enhancing short segment of anterior visual pathway — and OCT of the retinal nerve fibre layer, which quantifies axonal loss the fundus cannot show",
      },
      corpus_callosum_splenium: {
        level: "brain, with sagittal FLAIR",
        flavour: "callosal-septal interface lesions, which are close to specific for demyelination and are missed on axial images alone",
      },
      pons_lateral: {
        level: "brain, with thin brainstem slices",
        flavour: "a brainstem plaque, which is where an internuclear ophthalmoplegia in a young patient comes from",
      },
      // ---- keys reached through the "Demyelination (MS)" alias ----
      medulla_lateral: {
        level: "brain and whole spine",
        flavour: "a medullary plaque — and if it sits at the area postrema with intractable hiccup or vomiting, that is an NMOSD archetype rather than MS",
      },
      cord_hemi: {
        level: "the whole cord and brain",
        flavour: "a hemicord plaque producing a partial Brown-Séquard picture, which in a young patient is demyelinating far more often than compressive",
      },
    },
  }),

  "Vasculitic mononeuritis multiplex": dz("Vasculitic mononeuritis multiplex", {
    confirmatory: [
      "Nerve conduction studies and EMG across MULTIPLE limbs — the diagnosis is a MULTIFOCAL, ASYMMETRIC, AXONAL process picking off named nerves one at a time, and studying only the symptomatic limb cannot show that",
      "NERVE BIOPSY (usually sural, ideally with adjacent muscle) is the definitive test where the diagnosis is not already secure from a systemic biopsy — take it from a nerve that is affected but not yet end-stage",
      "Bloods for the systemic disease behind it: ANCA, ANA, ENA, complement, cryoglobulins, rheumatoid factor, ESR and CRP, plus hepatitis B and C and HIV serology",
      "Look for the ORGAN involvement that outranks the nerve — urinalysis and renal function for glomerulonephritis, chest imaging for pulmonary haemorrhage; {flavour}",
    ],
    monitoring: [
      "SAFETY NET: this is a systemic disease presenting through a nerve. Renal or pulmonary involvement is what threatens life, and it can advance while attention is on the limb — check urinalysis at every review, not just at diagnosis",
      "Map the deficits by NAMED NERVE at each visit, including {level}, so that a new nerve is recognised as disease activity rather than attributed to the old lesion",
      "Painful, stepwise accumulation over days to weeks is the expected course; a symmetric length-dependent pattern emerging later means confluence, not resolution",
    ],
    urgency: "urgent",
    referral: "Neurology with rheumatology; nephrology urgently if there is any renal involvement",
    bySite: {
      nerve_peroneal_common: {
        level: "ankle dorsiflexion and eversion",
        flavour: "a painful foot drop that is NOT at the fibular head on imaging, and with no history of compression, is the classic first presentation",
      },
      nerve_ulnar_elbow: {
        level: "the intrinsic hand muscles and the ulnar sensory territory",
        flavour: "an ulnar palsy that appeared abruptly and painfully, rather than gradually, argues against a compressive lesion at the elbow",
      },
      nerve_sural: {
        level: "sensation over the lateral foot",
        flavour: "the sural nerve is also the usual biopsy target, so document its function before biopsy is considered",
      },
      nerve_radial_spiral_groove: {
        level: "wrist and finger extension, with brachioradialis",
        flavour: "a wrist drop without the classic Saturday-night history, especially if painful, should raise vasculitis rather than compression",
      },
      nerve_femoral: {
        level: "knee extension and the knee jerk",
        flavour: "a painful femoral neuropathy raises diabetic radiculoplexus neuropathy as the main competing diagnosis — the systemic screen is what separates them",
      },
    },
  }),

  "Neuralgic amyotrophy": dz("Neuralgic amyotrophy", {
    confirmatory: [
      "The HISTORY is the diagnosis: abrupt, severe shoulder-girdle pain lasting days to weeks, with weakness appearing AS THE PAIN SUBSIDES. That sequence is what separates it from a compressive lesion, in which pain and weakness arrive together",
      "EMG and nerve conduction studies, but timed — changes take about three weeks to appear, so a study done immediately can be falsely reassuring",
      "MRI of the plexus and cervical spine to exclude a structural lesion, particularly where the picture is atypical or does not begin to recover",
      "High-resolution ULTRASOUND or MRI of the affected nerve may show the hourglass-like constrictions now recognised in this condition, which can change the surgical conversation — {flavour}",
    ],
    monitoring: [
      "Examine {level} specifically, including scapular winging with the arms pushed against a wall — the pattern is patchy and involves individual nerves rather than a whole trunk, and winging is missed unless it is looked for",
      "Recovery is usual but SLOW, over months to years, and is often incomplete; set that expectation early rather than at the first disappointing review",
      "Refer to physiotherapy early to protect shoulder range — a frozen shoulder on top of the weakness is a preventable second problem",
      "SAFETY NET: recurrent attacks, or a family history of them, raises HEREDITARY neuralgic amyotrophy and warrants genetic referral; progressive rather than recovering weakness should send you back to imaging",
    ],
    urgency: "routine",
    referral: "Neurology, with physiotherapy; peripheral nerve surgery where constrictions are demonstrated",
    bySite: {
      nerve_suprascapular: {
        level: "external rotation and the supraspinatus and infraspinatus for wasting",
        flavour: "the suprascapular nerve is the most commonly affected, and isolated external-rotation weakness is a characteristic presentation",
      },
      nerve_musculocutaneous: {
        level: "elbow flexion and the biceps jerk",
        flavour: "isolated biceps weakness after severe shoulder pain fits this far better than any single root lesion",
      },
      plexus_posterior_cord: {
        level: "shoulder abduction, elbow extension and wrist extension together",
        flavour: "involvement spanning a cord rather than one nerve is still compatible, but makes excluding a structural lesion more important",
      },
      root_c7: {
        level: "elbow extension and the triceps jerk",
        flavour: "a root-like distribution should prompt cervical imaging before the diagnosis is accepted",
      },
    },
  }),
};

// degenerative.js — pathology workups for the DEGENERATIVE category.
//
// Content only — the builders live in ./builders.js and the public API in ../pathologyNextSteps.js.
// Teaching prompts, not directives: no doses, no definitive management.
//
// REVIEW STATUS: ✅ ALL SIGNED OFF by the owner (a clinician), 2026-08-18.
//   Tranche 2 (round 9) — four singletons. The degenerative red set is complete.
//
// These are singletons rather than a family, deliberately: a degenerative label is the END of a
// diagnostic process, and what they share is not a workup but an obligation — to EXCLUDE THE TREATABLE
// MIMIC before accepting it. That obligation is different in each case, which is why one spine could not
// carry them.
import { dz } from "./builders.js";

export default {
  // The treatable one. Missing it is the costly error in every young movement disorder.
  "Wilson's disease": dz("Wilson's disease", {
    confirmatory: [
      "SERUM CAERULOPLASMIN AND 24-HOUR URINARY COPPER — and interpret them together, because caeruloplasmin alone is neither sensitive nor specific and a normal value does not exclude it",
      "SLIT-LAMP EXAMINATION FOR KAYSER-FLEISCHER RINGS by an ophthalmologist — they are present in essentially all patients with NEUROLOGICAL Wilson's, which makes this a high-yield test and one that can be done the same day",
      "MRI brain: the 'face of the giant panda' in the midbrain is characteristic, with basal ganglia and thalamic signal change — and liver function, clotting and an ultrasound, since the liver is involved even when it is silent",
      "Examine {level}, and consider genetic testing and liver biopsy where the picture is suggestive but the biochemistry is equivocal",
    ],
    monitoring: [
      "SAFETY NET: THIS IS TREATABLE AND THE ALTERNATIVE IS DEATH OR SEVERE DISABILITY. Any young person with an unexplained movement disorder, dysarthria, tremor or a psychiatric presentation with neurological signs should be screened — the cost of the test is trivial and the cost of missing it is not",
      "Track {level}; and warn that neurological function can WORSEN transiently when chelation begins, which is expected rather than a reason to stop",
      "SCREEN SIBLINGS AND FIRST-DEGREE RELATIVES — presymptomatic treatment prevents the disease entirely, which makes this one of the highest-value family screens in neurology",
      "Lifelong treatment and adherence monitoring: relapse after stopping is common and can be catastrophic, and adherence in adolescence is where it usually fails",
    ],
    urgency: "urgent",
    referral: "Hepatology and neurology together, with genetics for family screening",
    bySite: {
      basal_ganglia_striatum: { level: "tremor, dystonia and dysarthria",
        flavour: "the striatum is where the movement disorder comes from — the classic WING-BEATING tremor, oromandibular dystonia and the risus sardonicus that gives the fixed smile" },
      cerebellum_pancerebellar: { level: "gait, limb coordination and speech",
        flavour: "an ataxic presentation is less well known than the dystonic one and is therefore missed more often — a young person with unexplained ataxia deserves the same copper screen" },
    },
  }),

  "Motor neurone disease (ALS)": dz("Motor neurone disease (ALS)", {
    confirmatory: [
      "EMG AND NERVE CONDUCTION STUDIES looking for widespread denervation across multiple regions with NORMAL sensory studies — the combination of upper and lower motor neurone signs in the same territories is the clinical core",
      "EXCLUDE THE TREATABLE MIMICS BEFORE ACCEPTING THIS, because the diagnosis is irreversible in its consequences: MRI of the whole neuraxis for cervical myeloradiculopathy, anti-GM1 antibodies for MULTIFOCAL MOTOR NEUROPATHY, and B12, copper, thyroid and parathyroid function",
      "MRI brain and cervical spine specifically to exclude a structural cause of combined upper and lower motor neurone signs, which is the single commonest mimic",
      "Examine {level}, and test for the pseudobulbar features — emotional lability, a brisk jaw jerk — which localise to the corticobulbar tracts rather than to the bulbar nuclei",
    ],
    monitoring: [
      "SAFETY NET: MEASURE RESPIRATORY FUNCTION FROM DIAGNOSIS, including erect and supine vital capacity and sniff nasal pressure — respiratory failure is what kills, ventilatory support materially extends and improves life, and the assessment is repeatedly deferred until it is an emergency",
      "Track {level}, and assess SWALLOW and nutrition early; gastrostomy is placed while respiratory function still permits it safely, which means discussing it before it is needed",
      "MULTIDISCIPLINARY care demonstrably improves survival and quality of life, so referral to a specialist service is a treatment rather than a courtesy",
      "Communication, advance care planning and honest prognostic conversation belong early — the window in which the patient can express their own wishes closes, and it closes silently",
    ],
    urgency: "urgent",
    referral: "A specialist motor neurone disease service — neurology, respiratory, dietetics, speech therapy and palliative care together",
  }),

  "Variant Creutzfeldt-Jakob disease": dz("Variant Creutzfeldt-Jakob disease", {
    confirmatory: [
      "MRI WITH FLAIR AND DIFFUSION LOOKING FOR THE PULVINAR SIGN — symmetrical hyperintensity of the posterior thalami, more marked than the striatum. It is the imaging finding that distinguishes the variant form and it must be asked for specifically",
      "CSF for RT-QuIC and 14-3-3, and EEG — noting that the periodic complexes of sporadic CJD are usually ABSENT in the variant form, so a normal EEG does not help",
      "Take the history that fits: a YOUNGER patient with a PSYCHIATRIC or sensory prodrome for months before the neurological decline, which is the opposite of sporadic CJD's rapid dementia in an older patient",
      "Examine {level}, and involve the national prion surveillance service early — they guide investigation, including tonsil biopsy where appropriate",
    ],
    monitoring: [
      "SAFETY NET: INFECTION CONTROL AND INSTRUMENT HANDLING have specific requirements for suspected prion disease, and they must be flagged BEFORE any procedure or surgery rather than after",
      "Track {level}; the course is relentless and the care is supportive, so the emphasis shifts early to symptom control and family support",
      "This is a notifiable and nationally monitored condition — the surveillance referral is part of the diagnosis, not an administrative extra",
      "Families need consistent, senior and repeated communication: the diagnosis carries public and personal weight far beyond most neurological illness",
    ],
    urgency: "urgent",
    referral: "Neurology with the national prion surveillance service; palliative care early",
  }),

  "Cervical spondylotic amyotrophy / structural cord lesion": dz("Cervical spondylotic amyotrophy / structural cord lesion", {
    confirmatory: [
      "MRI CERVICAL SPINE — this is the STRUCTURAL MIMIC of motor neurone disease, and it is the reason every patient with combined upper and lower motor neurone signs is imaged before the degenerative label is applied",
      "EMG to define the distribution: denervation confined to a few contiguous myotomes points to a root or cord level, while widespread denervation across regions points away from a structural cause",
      "The features that favour a structural lesion: a SENSORY level or sensory symptoms, a clear anatomical boundary to the wasting, neck pain, and sphincter involvement — none of which belong to early motor neurone disease",
      "Examine {level}, and look for the wasting confined to a segmental distribution rather than spreading across regions",
    ],
    monitoring: [
      "SAFETY NET: THIS IS THE ONE THAT IS OPERABLE. Distinguishing it from motor neurone disease changes the outcome completely, so the threshold for imaging is essentially zero and the scan is repeated if the picture evolves atypically",
      "Track {level}; a progressive myelopathy with cord signal change is a decompression question with a clock, and delay costs function that does not return",
      "Where both coexist — spondylosis is common in the age group that develops motor neurone disease — the surgical decision becomes genuinely difficult and belongs to a specialist discussion rather than a default",
      "If a decompression is performed and the deficit continues to progress in a non-segmental pattern, revisit the diagnosis rather than the surgery",
    ],
    urgency: "urgent",
    referral: "Spinal surgery with neurology — and a motor neurone disease service if the structural cause is excluded",
  }),
};

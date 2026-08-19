// congenital.js — pathology workups for the CONGENITAL / HEREDITARY category.
//
// Content only — the builders live in ./builders.js and the public API in ../pathologyNextSteps.js.
// Teaching prompts, not directives: no doses, no definitive management.
//
// REVIEW STATUS:
//   ⚠  the HINDBRAIN / CRANIOCERVICAL MALFORMATION family (7) — tranche 2, AWAITING REVIEW.
//
// NOTE ON SCOPE: tranche 2 targets the 337 RED must-not-miss causes, and only 2 of the 7 here are red.
// The other 5 were added at the owner's request (2026-08-18) because the group is only coherent whole —
// authoring Chiari without the syrinx it causes would teach half a mechanism.
import { family } from "./builders.js";

// ---- HINDBRAIN AND CRANIOCERVICAL DEVELOPMENTAL MALFORMATIONS ----
// These are NOT vascular malformations and are deliberately kept out of that family: they share only the
// word. What unites THESE is a developmental anomaly at the hindbrain, craniocervical junction or neural
// tube, and a common mechanism — obstructed CSF flow. That mechanism is why the imaging question is the
// same for all of them, and why a syrinx is a CONSEQUENCE to be hunted rather than a separate diagnosis.
//
// Deliberately excluded: craniocervical TRAUMA (odontoid and condyle fractures) and craniocervical
// COMPRESSION by a foramen-magnum meningioma. Both sit at the same place and neither is developmental.
const HINDBRAIN_SPINE = {
  confirmatory: [
    "MRI of the CRANIOCERVICAL JUNCTION on thin sagittal slices — the anatomy here is missed on a standard brain study, which is framed for the hemispheres and often stops above the problem",
    "MRI of the WHOLE NEURAXIS, brain and entire cord: {flavour}",
    "CSF FLOW STUDY (cine phase-contrast) where surgery is being considered — the question is not what the anatomy looks like but whether flow is actually obstructed, and the two do not always agree",
    "Assess for the associated anomalies rather than stopping at the first: hydrocephalus, a syrinx, scoliosis, and a tethered cord at the other end of the neuraxis",
  ],
  monitoring: [
    "Track {level} at defined intervals — these are chronic and often stable for years, so the decision to operate rests on PROGRESSION rather than on the appearance of the scan",
    "Ask specifically about COUGH or Valsalva-provoked occipital headache: it is the symptom most characteristic of obstructed flow at the foramen magnum, and patients rarely volunteer it because it seems unremarkable to them",
    "SAFETY NET: progressive weakness, new sphincter symptoms, sleep-disordered breathing, or bulbar symptoms such as swallow difficulty or stridor are the features that convert observation into a surgical referral",
    "An INCIDENTAL finding is common and does not itself need treating — matching the symptoms to the anatomy honestly is the harder and more important part of this diagnosis",
  ],
  urgency: "routine",
  referral: "Neurosurgery, with neurology; spinal surgery where a syrinx or tethering is the dominant problem",
};

export default {
  ...family("hindbrain-craniocervical-malformation", HINDBRAIN_SPINE, {
    "Chiari I malformation": {
      slots: { level: "gait, the lower cranial nerves, and any dissociated sensory loss in the arms",
               flavour: "measure the TONSILLAR DESCENT below the foramen magnum, and look for the syrinx that follows from it — the syrinx is often what actually causes the deficit, and the tonsils are only why it formed" },
      bySite: {
        cerebellum_flocculonodular: { level: "gait, and DOWNBEAT nystagmus specifically",
                                      flavour: "downbeat nystagmus in a young adult is a craniocervical junction sign until the scan says otherwise, and Chiari is the commonest structural cause" },
        craniocervical_junction_foramen_magnum: { level: "all four limbs, the lower cranial nerves, and respiratory pattern in sleep" },
      },
    },
    "Chiari malformation or cerebellar degeneration": {
      slots: { level: "gait, nystagmus and limb coordination",
               flavour: "the name holds two very different answers — a STRUCTURAL malformation that may be operable, or a DEGENERATIVE process that is not. The scan separates them, and the distinction changes everything that follows" },
      confirmatoryExtra: ["If the picture is degenerative rather than structural, the work-up diverges entirely: alcohol history, thyroid and B12, coeliac and paraneoplastic antibodies, and a family history for the hereditary ataxias"],
      urgency: "urgent",
    },
    "Cerebellar malformation (Dandy-Walker, vermian hypoplasia)": {
      slots: { level: "truncal stability and developmental milestones where the patient is a child",
               flavour: "cystic dilatation of the fourth ventricle with an absent or hypoplastic VERMIS and an enlarged posterior fossa — and look at the ventricles, because hydrocephalus is present in most and is the treatable part" },
      confirmatoryExtra: ["Look for the associated anomalies beyond the posterior fossa — callosal agenesis, cardiac and renal malformations — since Dandy-Walker is frequently part of a wider syndrome rather than an isolated finding"],
      monitoringExtra: ["Head circumference and developmental progress in a child; in an adult found incidentally, the question is whether the hydrocephalus is compensated or slowly decompensating"],
    },
    "Syringomyelia (± Chiari)": {
      slots: { level: "the dissociated sensory loss, and its upper and lower borders",
               flavour: "a fluid cavity within the cord — the classic picture is a CAPE-LIKE loss of pain and temperature with PRESERVED light touch and vibration, because the syrinx interrupts the crossing fibres at the centre and spares the columns" },
      confirmatoryExtra: [
        "ALWAYS image the craniocervical junction as well as the syrinx: most are secondary to Chiari, and treating the syrinx without addressing the obstruction above it does not work",
        "Where there is no Chiari, look for the other causes — previous trauma, arachnoiditis after meningitis or surgery, and an intramedullary tumour, which needs contrast to exclude",
      ],
      monitoringExtra: ["Warn about PAINLESS INJURY: burns and cuts to insensate hands are common and preventable, and the patient will not report an injury they did not feel"],
      bySite: {
        cord_lateral:  { level: "the dissociated loss, plus the long tracts as the cavity expands outward" },
        cord_central:  { level: "the cape distribution and the arm reflexes, which are lost early" },
      },
    },
    "Syringobulbia": {
      slots: { level: "facial sensation in an ONION-SKIN pattern, plus palate, tongue and swallow",
               flavour: "the cavity has extended up into the brainstem — facial sensory loss follows the onion-skin distribution of the spinal trigeminal nucleus rather than the divisions of the nerve, which is the finding that localises it" },
      monitoringExtra: ["Bulbar function and sleep-disordered breathing are the features that make this more urgent than a cord syrinx alone — ask about swallow, voice and nocturnal stridor at every review"],
      urgency: "urgent",
    },
    "Craniocervical instability / basilar invagination": {
      slots: { level: "all four limbs, the lower cranial nerves, and any positional worsening",
               flavour: "the odontoid peg sits ABOVE its normal line and indents the brainstem — and look for the underlying reason: rheumatoid disease, Down syndrome, a connective tissue disorder, or skeletal dysplasia" },
      confirmatoryExtra: [
        "DYNAMIC (flexion-extension) imaging is what demonstrates instability — a static scan can look acceptable in a neck that is dangerous when it moves",
        "CT defines the BONE and MRI the cord: they answer different questions here and are not alternatives",
      ],
      monitoringExtra: ["SAFETY NET: symptoms brought on by NECK POSITION, or a history of transient weakness after a minor injury, indicate a cord at risk — that patient needs a surgical opinion before the next fall, not after it"],
      urgency: "urgent",
    },
    "Tethered cord / spinal dysraphism": {
      slots: { level: "sphincter function, saddle sensation and the ankle jerks",
               flavour: "a conus lying BELOW L2 with a thickened filum — and examine the back for the cutaneous marker: a dimple, tuft of hair, lipoma or naevus that has been there since birth and was never connected to the symptoms" },
      confirmatoryExtra: [
        "URODYNAMIC assessment is often the most sensitive measure of progression here, and bladder function is what is most likely to be lost irreversibly",
        "Look for the associated anomalies — a lipoma, dermal sinus tract, diastematomyelia, and anorectal or renal malformations",
      ],
      monitoringExtra: ["Deterioration is classically triggered by a GROWTH SPURT in a child, or by a specific stretch such as pregnancy or an unusual exertion in an adult — so a stable patient can change quickly at a predictable time"],
    },
  }),
};

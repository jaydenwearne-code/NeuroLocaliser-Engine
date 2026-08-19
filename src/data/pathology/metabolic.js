// metabolic.js — pathology workups for the METABOLIC / TOXIC / NUTRITIONAL category.
//
// Several of these are reversible if treated early and irreversible if not, which is why treatment
// precedes confirmation more often here than anywhere else.
//
// Content only — the builders live in ./builders.js and the public API in ../pathologyNextSteps.js.
// Teaching prompts, not directives: no doses, no definitive management.
//
// REVIEW STATUS: ✅ all 1 plans here SIGNED OFF 2026-08-18 (tranche 1, round 3).
import { dz } from "./builders.js";

export default {
  "Wernicke's encephalopathy": dz("Wernicke's encephalopathy", {
    confirmatory: [
      "THIS IS A CLINICAL DIAGNOSIS AND TREATMENT COMES FIRST — parenteral thiamine is given on suspicion, BEFORE any glucose-containing fluid, because a glucose load in a thiamine-deplete patient can precipitate the encephalopathy",
      "MRI shows symmetrical signal change in the mammillary bodies, the periaqueductal grey and the medial thalami — but a NORMAL MRI DOES NOT EXCLUDE IT, and waiting for the scan is the error that causes the harm",
      "Do not wait for thiamine levels or red cell transketolase: the results arrive far too late to guide the decision",
      "Look for the deficiency's context beyond alcohol — hyperemesis, bariatric surgery, prolonged vomiting, malignancy and malnutrition all produce it, and the non-alcoholic cases are the ones that get missed",
    ],
    monitoring: [
      "The classic triad is present in a MINORITY — do not require confusion, ophthalmoplegia and ataxia together before treating; any one of them with a plausible history is enough",
      "Track {level} — {flavour} — and reassess after treatment begins, since the eye signs improve first and fastest and their improvement supports the diagnosis",
      "SAFETY NET: untreated or undertreated, this becomes KORSAKOFF SYNDROME, which is largely irreversible. Under-dosing and stopping early are as damaging as not treating",
      "Replace magnesium as well: thiamine-dependent enzymes need it, and thiamine may not work while magnesium is low",
    ],
    urgency: "emergency",
    referral: "Acute medicine and neurology; alcohol liaison where relevant",
    bySite: {
      thalamus_arousal_paramedian: {
        level: "conscious level and orientation",
        flavour: "paramedian thalamic involvement is what produces the confusion and drowsiness, and it is the component that recovers least",
      },
      skull_base_vi_cisternal: {
        level: "eye abduction, and the eyes for nystagmus",
        flavour: "a bilateral sixth-nerve palsy with nystagmus in this context is Wernicke's until treated otherwise",
      },
      pontomesencephalic_tegmentum: {
        level: "eye movements in all directions, and gait",
        flavour: "periaqueductal involvement gives the ophthalmoplegia — the sign that responds most visibly to treatment",
      },
      hypothalamus_thermoregulatory: {
        level: "temperature, and autonomic stability",
        flavour: "hypothalamic involvement can give hypothermia and hypotension, which are easily attributed to something else in an unwell patient",
      },
    },
  }),
};

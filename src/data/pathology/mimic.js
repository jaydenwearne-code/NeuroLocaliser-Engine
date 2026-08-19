// mimic.js — pathology workups for the MIMIC category.
//
// A mimic is NOT a lesion at this site at all, so the workup's job is to exclude it fast, before the
// structural pathway is embarked on.
//
// Content only — the builders live in ./builders.js and the public API in ../pathologyNextSteps.js.
// Teaching prompts, not directives: no doses, no definitive management.
//
// REVIEW STATUS: ✅ all 1 plans here SIGNED OFF 2026-08-18 (tranche 1, round 3).
import { dz } from "./builders.js";

export default {
  // Listed in CAUSES as a MIMIC — not a lesion at this site at all. The workup reflects that: the job is to
  // exclude it at the bedside in seconds, before any of the structural pathway is embarked on.
  "Hypoglycaemia": dz("Hypoglycaemia", {
    confirmatory: [
      "CAPILLARY BLOOD GLUCOSE, IMMEDIATELY — before imaging, before bloods, before anything else. It takes seconds, it is the one fully reversible cause of a focal deficit, and it is missed by starting with the CT",
      "A LABORATORY glucose to confirm the capillary reading, drawn before treatment wherever that does not delay it",
      "Where hypoglycaemia is confirmed and unexplained, take the diagnostic samples AT THE TIME OF the low glucose — insulin, C-peptide, and a sulfonylurea screen — because after treatment the opportunity is gone",
      "Establish the cause: diabetes treatment, alcohol, liver disease, adrenal insufficiency, sepsis, or exogenous insulin",
    ],
    monitoring: [
      "SAFETY NET: hypoglycaemia can produce a DENSE FOCAL DEFICIT that mimics a stroke exactly, including hemiplegia and aphasia — and it is an explicit exclusion before thrombolysis. Treat it and re-examine before committing to the stroke pathway",
      "Recheck the glucose after treatment and again later: sulfonylurea and long-acting insulin hypoglycaemia RECURS after an initial correction, and patients are discharged into that relapse",
      "If {level} does not recover once the glucose is corrected, the deficit is structural and the stroke pathway resumes — a corrected glucose does not close the case",
      "{flavour}",
    ],
    urgency: "emergency",
    referral: "Acute medicine; diabetes team where the cause is treatment-related",
    bySite: {
      cortex_mca: {
        level: "the full hemispheric deficit",
        flavour: "profound hypoglycaemia has a recognised predilection for producing hemispheric and cortical deficits, so the resemblance to a large-vessel stroke is close",
      },
      subcortex_internal_capsule: {
        level: "the pure motor deficit",
        flavour: "a dense pure hemiparesis with a normal conscious level is an entirely plausible presentation of hypoglycaemia",
      },
      cortex_aphasia_global: {
        level: "language, once the patient is able to cooperate",
        flavour: "isolated aphasia from hypoglycaemia is well described and is regularly thrombolysed before the glucose is checked",
      },
    },
  }),
};

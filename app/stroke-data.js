// stroke-data.js — clinical content for code-stroke mode, as pure cited data. NIHSS is the standard scale.
// Eligibility + reference content is drafted from the 2026 AHA/ASA guideline (see GUIDELINE_CITE) and is
// OWNER-REVIEWED against the primary source before final commit (see the plan's Task 8). Educational only.

export const GUIDELINE_CITE = "2026 AHA/ASA Guideline for the Early Management of Patients With Acute Ischemic Stroke, Stroke (DOI 10.1161/STR.0000000000000513)";

export const NIHSS_ITEMS = [
  { id: "loc",       label: "1a. Level of consciousness",      options: [{score:0,label:"Alert"},{score:1,label:"Drowsy"},{score:2,label:"Obtunded"},{score:3,label:"Coma/unresponsive"}] },
  { id: "locQ",      label: "1b. LOC questions (month, age)",  options: [{score:0,label:"Both correct"},{score:1,label:"One correct"},{score:2,label:"Neither"}] },
  { id: "locC",      label: "1c. LOC commands (eyes, grip)",   options: [{score:0,label:"Both"},{score:1,label:"One"},{score:2,label:"Neither"}] },
  { id: "gaze",      label: "2. Best gaze",                    options: [{score:0,label:"Normal"},{score:1,label:"Partial palsy"},{score:2,label:"Forced deviation"}] },
  { id: "visual",    label: "3. Visual fields",                options: [{score:0,label:"No loss"},{score:1,label:"Partial hemianopia"},{score:2,label:"Complete hemianopia"},{score:3,label:"Bilateral"}] },
  { id: "facial",    label: "4. Facial palsy",                 options: [{score:0,label:"Normal"},{score:1,label:"Minor"},{score:2,label:"Partial"},{score:3,label:"Complete"}] },
  { id: "arm",       label: "5. Motor arm (worse side)",       options: [{score:0,label:"No drift"},{score:1,label:"Drift"},{score:2,label:"Some effort vs gravity"},{score:3,label:"No effort vs gravity"},{score:4,label:"No movement"}], side: true },
  { id: "leg",       label: "6. Motor leg (worse side)",       options: [{score:0,label:"No drift"},{score:1,label:"Drift"},{score:2,label:"Some effort vs gravity"},{score:3,label:"No effort vs gravity"},{score:4,label:"No movement"}], side: true },
  { id: "ataxia",    label: "7. Limb ataxia",                  options: [{score:0,label:"Absent"},{score:1,label:"One limb"},{score:2,label:"Two limbs"}] },
  { id: "sensory",   label: "8. Sensory",                      options: [{score:0,label:"Normal"},{score:1,label:"Mild-moderate loss"},{score:2,label:"Severe/total loss"}] },
  { id: "language",  label: "9. Best language",                options: [{score:0,label:"Normal"},{score:1,label:"Mild-moderate aphasia"},{score:2,label:"Severe aphasia"},{score:3,label:"Mute/global"}] },
  { id: "dysarthria",label: "10. Dysarthria",                  options: [{score:0,label:"Normal"},{score:1,label:"Mild-moderate"},{score:2,label:"Severe"}] },
  { id: "extinction",label: "11. Extinction/inattention",     options: [{score:0,label:"Normal"},{score:1,label:"One modality"},{score:2,label:"Profound/≥2"}] },
];
// NB: items 5 & 6 (`side:true`) are scored per limb (L+R) in the UI — the max-total-42 invariant counts both.

export const THROMBOLYSIS_CRITERIA = [
  { id:"dx",       kind:"inclusion", label:"Disabling acute ischaemic stroke, deficit not clearing", cite:GUIDELINE_CITE },
  { id:"windowIVT",kind:"inclusion", auto:"windowIVT", label:"Within 4.5 h of last-known-well (or extended 4.5–9 h / wake-up with perfusion or DWI-FLAIR mismatch)", cite:GUIDELINE_CITE },
  { id:"bp185",    kind:"inclusion", auto:"bp185",     label:"BP controllable to <185/110 before treatment", cite:GUIDELINE_CITE },
  { id:"glucose",  kind:"inclusion", auto:"glucoseOk", label:"Glucose is not the cause of the deficit (treat hypo/hyperglycaemia)", cite:GUIDELINE_CITE },
  { id:"recentICH",kind:"contra",    label:"Prior intracranial haemorrhage", cite:GUIDELINE_CITE },
  { id:"recentSurg",kind:"contra",   label:"Recent major surgery / serious trauma (per guideline window)", cite:GUIDELINE_CITE },
  { id:"activeBleed",kind:"contra",  label:"Active internal bleeding / bleeding diathesis", cite:GUIDELINE_CITE },
  { id:"anticoag", kind:"contra",    label:"Therapeutic anticoagulation / relevant coagulopathy", cite:GUIDELINE_CITE },
  // NB (Task 8): the 2026 guideline MODIFIED the contraindication list — reconcile this set against the
  // primary source and the owner's local protocol before final commit; add/remove items as verified.
];

export const THROMBECTOMY_CRITERIA = [
  { id:"lvo",       kind:"inclusion", label:"Anterior LVO (ICA or M1) on CTA/MRA (or basilar for posterior)", cite:GUIDELINE_CITE },
  { id:"nihss6",    kind:"inclusion", auto:"nihss6", label:"NIHSS ≥ 6 (≥ 10 for basilar)", cite:GUIDELINE_CITE },
  { id:"mrs01",     kind:"inclusion", auto:"mrs01",  label:"Pre-stroke mRS 0–1", cite:GUIDELINE_CITE },
  { id:"aspects",   kind:"inclusion", label:"ASPECTS 3–10 (<6 h) / 3–5 (6–24 h) / PC-ASPECTS ≥6 (basilar)", cite:GUIDELINE_CITE },
  { id:"windowEVT", kind:"inclusion", auto:"windowEVT", label:"Within 6 h (or 6–24 h selected, age <80, with imaging)", cite:GUIDELINE_CITE },
];

export const ACUTE_MGMT = [
  { id:"bp", title:"Blood pressure", body:"Pre-lysis: control to <185/110 to be eligible. After IVT/EVT: do NOT intensively lower SBP to <140 (no benefit; harmful after EVT) — disciplined, not reflexive lowering. First-24 h upper ceiling: per your local protocol (confirm against the primary source).", cite:GUIDELINE_CITE },
  { id:"glucose", title:"Glucose", body:"Maintain ~140–180 mg/dL; avoid hypoglycaemia (<70). Intensive control (80–130) not recommended.", cite:GUIDELINE_CITE },
  { id:"reversal", title:"Anticoagulation", body:"Establish agent + last dose; reverse per local protocol before/at decision. Baseline ECG/troponin recommended but must not delay IVT/EVT.", cite:GUIDELINE_CITE },
];

export const MIMICS = [
  "Check glucose FIRST — treat hypoglycaemia before calling it a stroke",
  "Seizure with Todd's paresis",
  "Migraine with aura",
  "Functional / conversion",
  "Sepsis or metabolic derangement unmasking an old deficit",
];

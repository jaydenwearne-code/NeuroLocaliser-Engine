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
  { id:"windowIVT",kind:"inclusion", auto:"windowIVT", label:"Within a thrombolysis time window (✓ = ≤4.5 h; the 4.5–9 h / wake-up window applies ONLY with advanced-imaging mismatch — confirm imaging manually)", cite:GUIDELINE_CITE },
  { id:"bp185",    kind:"inclusion", auto:"bp185",     label:"BP controllable to <185/110 before treatment", cite:GUIDELINE_CITE },
  { id:"glucose",  kind:"inclusion", auto:"glucoseOk", label:"Glucose is not the cause of the deficit (treat hypo/hyperglycaemia)", cite:GUIDELINE_CITE },
  // --- Contraindications (owner-approved 2026-08-07). Absolute first, then RELATIVE (weigh risk/benefit). ---
  { id:"currentICH",     kind:"contra", label:"Haemorrhage on the baseline CT/MRI", cite:GUIDELINE_CITE },
  { id:"recentICH",      kind:"contra", label:"Any prior intracranial haemorrhage", cite:GUIDELINE_CITE },
  { id:"recentStroke",   kind:"contra", label:"Ischaemic stroke or serious head trauma in the last 3 months", cite:GUIDELINE_CITE },
  { id:"intracranialSurg",kind:"contra",label:"Intracranial or spinal surgery in the last 3 months", cite:GUIDELINE_CITE },
  { id:"structuralLesion",kind:"contra",label:"Intracranial neoplasm (intra-axial), arteriovenous malformation, or aneurysm", cite:GUIDELINE_CITE },
  { id:"activeBleed",    kind:"contra", label:"Active internal bleeding", cite:GUIDELINE_CITE },
  { id:"endocarditisDissection", kind:"contra", label:"Infective endocarditis or suspected aortic dissection", cite:GUIDELINE_CITE },
  { id:"coag",           kind:"contra", label:"Platelets <100 ×10⁹/L, INR >1.7, or therapeutic anticoagulation (DOAC <48 h / treatment-dose LMWH <24 h) — RELATIVE (weigh risk/benefit)", cite:GUIDELINE_CITE },
  { id:"recentSurg",     kind:"contra", label:"Recent major surgery or serious trauma (~14 days) — RELATIVE (weigh risk/benefit)", cite:GUIDELINE_CITE },
  { id:"giGuBleed",      kind:"contra", label:"Recent gastrointestinal or urinary-tract haemorrhage (~21 days) — RELATIVE (weigh risk/benefit)", cite:GUIDELINE_CITE },
  { id:"recentMI",       kind:"contra", label:"Recent myocardial infarction (last 3 months) — RELATIVE (weigh risk/benefit)", cite:GUIDELINE_CITE },
  { id:"arterialPuncture",kind:"contra",label:"Arterial puncture at a non-compressible site (~7 days) — RELATIVE (weigh risk/benefit)", cite:GUIDELINE_CITE },
  { id:"minorSymptoms",  kind:"contra", label:"Rapidly improving or minor, non-disabling deficit — RELATIVE (weigh risk/benefit)", cite:GUIDELINE_CITE },
  { id:"pregnancy",      kind:"contra", label:"Pregnancy or early postpartum — RELATIVE (weigh risk/benefit)", cite:GUIDELINE_CITE },
  // Owner-approved contraindication table (2026-08-07): absolute items first, then RELATIVE items (weighed
  // risk/benefit per the 2026 modification). BP >185/110 and glucose are handled as the inclusion criteria
  // above. Always verify against your local thrombolysis protocol, which governs at the bedside.
];

export const THROMBECTOMY_CRITERIA = [
  { id:"lvo",       kind:"inclusion", label:"Anterior LVO (ICA or M1) on CTA/MRA (or basilar for posterior)", cite:GUIDELINE_CITE },
  { id:"nihss6",    kind:"inclusion", auto:"nihss6", label:"NIHSS ≥ 6 (✓ uses ≥ 6; for a basilar occlusion judge against ≥ 10)", cite:GUIDELINE_CITE },
  { id:"mrs01",     kind:"inclusion", auto:"mrs01",  label:"Pre-stroke mRS 0–1", cite:GUIDELINE_CITE },
  { id:"aspects",   kind:"inclusion", label:"ASPECTS 3–10 (<6 h) / 3–5 (6–24 h) / PC-ASPECTS ≥6 (basilar)", cite:GUIDELINE_CITE },
  { id:"windowEVT", kind:"inclusion", auto:"windowEVT", label:"Within a thrombectomy time window (✓ = a window is open; the 6–24 h window is for SELECTED patients — confirm age <80 + imaging manually; basilar up to 24 h)", cite:GUIDELINE_CITE },
];

// Beyond the core Class I criteria above — 2026 expansions and cautions to weigh (owner-approved 2026-08-07,
// cross-checked vs the guideline). Informational: shown as "considerations", not tick-box inclusions.
export const THROMBECTOMY_CONSIDERATIONS = [
  { label:"Large ischaemic core (ASPECTS 0–2): EVT is REASONABLE in selected patients within 6 h — age <80, NIHSS ≥6, pre-stroke mRS 0–1, no significant mass effect (recent large-core trials).", cite:GUIDELINE_CITE },
  { label:"Pre-stroke mRS 2 (worse baseline): EVT is REASONABLE in selected early-window anterior LVO with ASPECTS ≥6 — weigh the higher baseline disability and potentially worse achievable outcome.", cite:GUIDELINE_CITE },
  { label:"Disabling deficit with NIHSS <6: the trial threshold is NIHSS ≥6, but a genuinely disabling deficit (e.g. aphasia, hemianopia) warrants individualised discussion with the neurointerventional team.", cite:GUIDELINE_CITE },
  { label:"Medium-vessel occlusion (M2/M3, A2, P1/P2): EVT benefit is NOT established — recent MeVO trials were neutral; not a standard indication, individualise.", cite:GUIDELINE_CITE },
];

export const ACUTE_MGMT = [
  { id:"bp", title:"Blood pressure", body:"Pre-lysis: control to <185/110 to be eligible. After IVT/EVT: permissive — allow SBP up to ~180–185, reduce only modestly (10–15%) if truly needed, and do NOT intensively lower to <140 (no benefit after IVT; harmful after EVT).", cite:GUIDELINE_CITE },
  { id:"glucose", title:"Glucose", body:"Maintain ~7.8–10 mmol/L; avoid hypoglycaemia (<3.9). Intensive control (4.4–7.2) not recommended.", cite:GUIDELINE_CITE },
  { id:"reversal", title:"Anticoagulation", body:"Establish agent + last dose; reverse per local protocol before/at decision. Baseline ECG/troponin recommended but must not delay IVT/EVT.", cite:GUIDELINE_CITE },
];

export const MIMICS = [
  "Check glucose FIRST — treat hypoglycaemia before calling it a stroke",
  "Seizure with Todd's paresis",
  "Migraine with aura",
  "Functional / conversion",
  "Sepsis or metabolic derangement unmasking an old deficit",
];

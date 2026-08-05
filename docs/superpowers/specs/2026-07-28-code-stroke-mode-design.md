# Code-stroke mode — a clinician's cognitive aid (design)

**Status:** design approved 2026-07-28; not yet implemented.

**Depends on:** the existing localiser (`solve()`) is reused for syndrome/territory. A new third mode alongside
`localise` / `atlas`. Pure `app/`-layer + new data/logic modules; zero engine/model changes. Client-only,
zero-build, no backend — consistent with the rest of the app. Branch off `main`.

## Problem & positioning

Clinicians asked for a third mode that runs **in parallel at a live code stroke** — age, pre-stroke mRS,
stroke-relevant comorbidities, last-known-well, NIHSS, likely stroke syndrome/location, and acute-management
guidance (thrombolysis / thrombectomy eligibility and contraindications) per the **2026 AHA/ASA guideline**.

**Positioning (decided):** this is an **educational cognitive aid / checklist**, not a medical device. It
*organises and prompts* — it never issues a "give / don't give thrombolysis" verdict. It always defers to the
clinician's judgement and the local stroke protocol, and shows the guideline citation for every criterion.
This keeps it defensible and is consistent with the app's existing "teaching prototype, not for clinical use"
framing (which the mode restates prominently).

**Accuracy constraint (hard):** no clinical number is encoded unless it is attributable to the published
2026 AHA/ASA guideline. Content is drafted from the fetched guideline (primary source + reputable summaries),
**owner-reviewed before commit**, and every criterion carries an in-app citation.

## Source

Primary: **"2026 Guideline for the Early Management of Patients With Acute Ischemic Stroke," AHA/ASA,
*Stroke*** — DOI [10.1161/STR.0000000000000513](https://www.ahajournals.org/doi/10.1161/STR.0000000000000513),
PubMed 41582814. Secondary cross-checks used while drafting: emDocs and the Satti MD quick-reference (see
Appendix A). The primary source is fetched and the encoded criteria owner-reviewed at implementation.

## Scope

**In v1:** intake · live clock vs decision windows · structured NIHSS · likely syndrome/location + LVO screen
(reusing `solve()`) · thrombolysis eligibility checklist · thrombectomy eligibility checklist · acute-management
reference cards · stroke-mimic prompt · handover summary.

**Deferred (fast-follow):** paediatric AIS, mobile-stroke-unit / EMS triage, post-EVT ICU management,
dysphagia/glucose protocols beyond the reference card.

**Non-goals:** any treat/don't-treat verdict; storing patient data (nothing leaves the browser); a backend.

## Architecture

```
app/stroke-data.js    verified clinical content as pure data, each item with a `cite` field:
                      NIHSS_ITEMS, THROMBOLYSIS_CRITERIA (inclusion + contraindications),
                      THROMBECTOMY_CRITERIA, TIME_WINDOWS, ACUTE_MGMT (BP/glucose/reversal), MIMICS
app/stroke-logic.js   pure, DOM-free, unit-tested:
                      nihssTotal(state) -> number
                      nihssToFindings(state) -> Set<finding@side>   (bridge to the localiser)
                      timeWindows(lkwISO, nowISO) -> per-window {open|closing|closed, minsLeft}
                      lvoScreen(state) -> {likely:boolean, reasons:[...]}
                      eligibilitySummary(criteria, state) -> {met, notMet, needInfo, items:[...]}
                      buildHandover(state, derived) -> string
app/code-stroke.js    the worksheet DOM + wiring; consumes the above + reuses solve()/siteName();
                      owns the live-clock setInterval (cleared on mode switch)
```

- **State:** a `S.stroke` sub-object `{ age, lkw, mrs, weight, sbp, dbp, glucose, anticoag:{agent,lastDose},
  comorbidities:Set, nihss:{item:score}, thrombolysisTicks:Set, thrombectomyTicks:Set }`; `S.mode:"stroke"`.
- **Mode wiring:** a third `#modes` button ("Code stroke"); `boot()`'s handler routes `stroke` → `renderCodeStroke()`;
  the clock interval is started on render and cleared when leaving the mode.
- **Reuse:** NIHSS is entered once; `nihssToFindings()` maps scored items to the finding vocabulary
  (LOC/gaze/fields/facial/arm/leg/ataxia/sensory/language/dysarthria/extinction → `gaze_deviation`,
  `homonymous_hemianopia`, `facial_weakness`, `weak_arm`, `weak_leg`, `limb_ataxia`, `aphasia`/`neglect`,
  `dysarthria`, sensory) with side; `solve()` then yields the likely territory/syndrome. No double entry.

## Worksheet layout (single scrolling page)

**Sticky header:** live elapsed clock (from LKW) · NIHSS total · LVO flag · a one-line safety/citation banner.

1. **Intake** — age · last-known-well (date-time) · pre-stroke mRS (0–5) · weight (for dosing) · BP · glucose ·
   anticoagulation (agent + last dose) · comorbidity/risk toggles (AF, prior ICH, recent surgery/trauma,
   recent stroke, active bleeding, pregnancy, …).
2. **Stroke-mimic prompt** — a short "before you commit" checklist: **check glucose first** (treat hypoglycaemia),
   seizure/Todd's paresis, migraine with aura, functional. A reminder, not a rule-out.
3. **NIHSS** — the 15 items with their scoring options → running total in the header.
4. **Likely syndrome / location + LVO screen** — `nihssToFindings()` → `solve()` territory (e.g. "left MCA");
   an LVO flag from `lvoScreen()` (cortical signs — gaze deviation / aphasia / neglect — with NIHSS ≥6) →
   prompt "consider stroke-team / thrombectomy-centre activation." **Posterior-circulation caveat** shown: a
   low NIHSS does not exclude a basilar LVO.
5. **Time windows** — elapsed vs IVT (≤4.5h; extended 4.5–9h / wake-up ≤9h from sleep midpoint with perfusion or
   DWI-FLAIR mismatch) and EVT (≤6h; 6–24h selected; basilar ≤24h), each open/closing/closed with minutes left.
   **Door-to-needle ≤60 min / door-to-groin** target prompts.
6. **Thrombolysis eligibility** — tick-through inclusion + contraindications (auto-filling age, window, BP,
   glucose, INR where known); tenecteplase 0.25 mg/kg (max 25 mg) vs alteplase 0.9 mg/kg (max 90 mg) noted.
   Output: **met / not-met / need-info** counts + the outstanding items. Never a verdict.
7. **Thrombectomy eligibility** — LVO location, NIHSS ≥6, pre-stroke mRS, ASPECTS, window (with the extended-
   window sub-criteria). Same summary style.
8. **Acute-management reference cards** — BP targets (pre-lysis <185/110; the 2026 "avoid intensive lowering
   post-reperfusion" nuance; permissive HTN if not treated), glucose (140–180; avoid <70), anticoagulation
   reversal. Reference only.
9. **Handover summary** — `buildHandover()` → copy-able structured text (LKW + elapsed, NIHSS, exam,
   localisation, checklist status, BP/glucose, decisions/times) for the notes / stroke-team handover.

## Data flow & error handling

Inputs (intake + NIHSS + ticks) → `S.stroke` → logic functions → rendered outputs; the localisation is derived
live via `nihssToFindings()` → `solve()`. Missing LKW → clock shows "enter last-known-well" rather than a bogus
time. Partial input never crashes: the render is wrapped in the existing error-boundary pattern, and each logic
function tolerates an incomplete state (returns `need-info` rather than throwing). The clock interval is cleared
on mode switch to avoid leaks.

## Safety framing

A persistent in-mode banner: *"Educational cognitive aid — not a medical device, and not a substitute for
clinical judgement or your local stroke protocol. Criteria from the 2026 AHA/ASA guideline (cited); verify
before acting."* Every eligibility item shows its citation. The tool presents **met / not-met / need-info** and
the guideline text; it never concludes "treat" or "do not treat."

## Testing

Pure-logic suites (`test/stroke-logic.test.js`): `nihssTotal` (scoring + partial), `nihssToFindings`
(item→finding/side mapping, incl. bilateral/aphasia/neglect), `timeWindows` (open/closing/closed boundaries,
missing LKW), `lvoScreen` (cortical-sign + NIHSS rule), `eligibilitySummary` (met/not-met/need-info counts),
`buildHandover` (contains the key fields). A small `test/stroke-data.test.js` guards data integrity: every
criterion has a non-empty `cite`; NIHSS items sum to the correct max (42). The worksheet DOM, the live clock,
and the **encoded clinical criteria** are verified in-browser and **owner-reviewed** before commit. All 51
existing suites stay green.

## Files

- New: `app/stroke-data.js`, `app/stroke-logic.js`, `app/code-stroke.js`, `test/stroke-logic.test.js`,
  `test/stroke-data.test.js`.
- Changed: `app/app.js` (third mode + routing + clock lifecycle), `app/index.html` (mode button + worksheet
  CSS + safety banner), `package.json` + `README.md` (test chain), `CLAUDE.md` + `CONTRIBUTING.md` (status).

## Appendix A — provisional criteria drafted from the source (OWNER TO REVIEW before commit)

Cross-checked from the 2026 AHA/ASA guideline via emDocs and the Satti MD quick-reference; the primary source
is fetched and each item re-verified at build. Discrepancies flagged for review.

**IV thrombolysis**
- Standard window **≤4.5h** from LKW (COR 1). Tenecteplase **0.25 mg/kg, max 25 mg** single bolus; alteplase
  **0.9 mg/kg, max 90 mg** (10% bolus, remainder over 60 min).
- Extended: **4.5–9h from LKW, or wake-up within 9h of sleep midpoint**, with salvageable penumbra on perfusion
  **or DWI-FLAIR mismatch** (COR 2a).
- Pre-lysis BP must be **<185/110** (control first).
- Contraindications: 2026 uses a **modified approach** — the full current list must be taken from the primary
  source and reviewed (do not carry over an older list unverified).

**Endovascular thrombectomy**
- Anterior ICA/M1, **≤6h**, NIHSS **≥6**, pre-stroke mRS **0–1**, ASPECTS **3–10** (COR 1).
- **6–24h** selected: age **<80**, NIHSS ≥6, mRS 0–1, ASPECTS **3–5**, no significant mass effect (COR 1).
- Low ASPECTS **0–2**, ≤6h: age <80, NIHSS ≥6, mRS 0–1, no mass effect (COR 2a).
- Pre-stroke mRS **2** with ASPECTS ≥6, ≤6h (COR 2a).
- Basilar: mRS 0–1, NIHSS **≥10**, PC-ASPECTS **≥6**, **≤24h** (COR 1). Target reperfusion **mTICI 2b–3**.

**Acute management**
- BP: pre-lysis <185/110; **avoid intensive SBP lowering (<140) after reperfusion** (no benefit / harmful);
  permissive hypertension otherwise (treat if SBP >220 or DBP >120 — *classic post-lysis target <180/105 to be
  reconciled with the 2026 wording at review*).
- Glucose: maintain **140–180 mg/dL**; avoid hypoglycaemia (<70); intensive 80–130 not recommended.
- Baseline ECG/troponin recommended but must not delay IVT/EVT.

Sources: [AHA/ASA 2026 guideline (Stroke)](https://www.ahajournals.org/doi/10.1161/STR.0000000000000513) ·
[emDocs summary](https://www.emdocs.net/2026-guideline-update-early-management-of-acute-ischemic-stroke/) ·
[Satti MD quick-reference](https://sattimd.com/guidelines/aha-stroke-2026.html)

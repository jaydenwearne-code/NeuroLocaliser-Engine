// card-follows-cause.test.js — the card follows its cause (owner-ruled 2026-11-11; spec
// docs/superpowers/specs/2026-11-11-card-follows-cause-design.md). Every sentence on the card has ONE owner: the PLACE (a red
// flag true whatever the cause — syndromes.js `red`) or the CAUSE (a warning about one cause — causes.js `flagged`). The red
// line shows the card's cause's flags at this place, then the place's own flag. Run: node test/card-follows-cause.test.js
import { solve, candidateSites, isNormalToken } from "../src/engine/inverse.js";
import { expectedFindings } from "../src/engine/forward.js";
import { CAUSES, causesFor, leadingCause } from "../src/data/causes.js";
import * as CZ from "../src/data/causes.js";
import { BY_SITE, nameForSite } from "../src/data/syndromes.js";
import * as SYN from "../src/data/syndromes.js";
import * as ANS from "../app/answer.js";

let pass = 0, fail = 0;
const ok = (label, cond, detail = "") => { cond ? pass++ : fail++; console.log((cond ? "PASS  " : "FAIL  ") + label + (cond ? "" : `  ${detail}`)); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const T = s => new Set(s.split(/\s+/).filter(Boolean));
const SITE = Object.fromEntries(candidateSites().map(s => [s.id, s]));
const P = "papilloedema@none";
const ONSETS = ["", "hyperacute", "acute", "subacute", "chronic"];
// Read from the module namespaces, so a missing export fails its assertions instead of the whole suite.
const redLine = ANS.redLine || (() => undefined);
const cardCause = ANS.cardCause || (() => undefined);
const flagApplies = ANS.flagApplies || (() => undefined);
const phonebookVariant = SYN.phonebookVariant || (() => undefined);
const flagged = CZ.flagged || (() => undefined);
// The answer card for a picture, as app.js builds it; `pick` selects a place, else the card's own first answer.
const card = (toks, { onset = "", selectedPathology, pick } = {}) => {
  const tokens = typeof toks === "string" ? T(toks) : toks, r = solve(tokens);
  const sel = pick ? r.display.find(x => x.site.id === pick) : (r.display.find(x => x.site.id === r.defaultSite) || r.display[0]);
  if (!sel) return null;
  const total = [...tokens].filter(t => !t.startsWith("papilloedema@") && !isNormalToken(t)).length;
  return ANS.answerFor({ r, sel, total, tokens, onset, course: "", dominant: "left", sensoryLevel: "", pinned: new Set(),
    scope: "site", selectedPathology, selectedEntity: undefined });
};
const own = id => [...expectedFindings(SITE[id])].join(" ");
const listOf = s => CAUSES[s.id] ? s.id : `${s.level}_${s.part}`;
const kindOf = s => s.id.replace(/^(left|right)_/, "");
const placeFlags = () => { const rows = [];
  for (const [k, v] of Object.entries(BY_SITE)) { if (v.red) rows.push([k, v.red]);
    for (const sub of ["dominant", "nondominant", "bilateral"]) if (v[sub] && v[sub].red) rows.push([`${k}.${sub}`, v[sub].red]); }
  return rows.sort((a, b) => (a[0] < b[0] ? -1 : 1)); };
const causeFlags = () => { const rows = [];
  for (const [list, causes] of Object.entries(CAUSES)) for (const c of causes) for (const f of c.flags || []) rows.push({ list, cause: c.name, ...f });
  return rows; };

// ---- A. The helpers ----
{ const bad = [];
  for (const s of candidateSites()) for (const d of ["left", "right"]) {
    const e = BY_SITE[BY_SITE[s.id] ? s.id : `${s.level}_${s.part}`]; if (!e) continue;
    const v = phonebookVariant(s, { dominantSide: d }), read = v ? e[v] : e, n = nameForSite(s, { dominantSide: d });
    if (!read || n.name !== read.name || n.red !== read.red) bad.push(`${s.id}/${d}`); }
  ok("helper: phonebookVariant names the variant nameForSite reads, at every place and dominance", bad.length === 0, bad.slice(0, 5).join(", ")); }
ok("helper: phonebookVariant — the dominant and non-dominant PCA, and a place with no variants",
   phonebookVariant(SITE.left_cortex_pca, { dominantSide: "left" }) === "dominant"
   && phonebookVariant(SITE.right_cortex_pca, { dominantSide: "left" }) === "nondominant"
   && phonebookVariant(SITE.left_cortex_pca, { dominantSide: "right" }) === "nondominant"
   && phonebookVariant(SITE.left_medulla_lateral, { dominantSide: "left" }) === null);
{ const x = flagged({ name: "X", cat: "vascular", red: true }, "always", { text: "dominant only", only: "dominant" });
  ok("helper: flagged keeps the cause and carries its flags, a string as { text }",
     !!x && x.name === "X" && x.red === true && same(x.flags, [{ text: "always" }, { text: "dominant only", only: "dominant" }])); }
ok("helper: flagApplies — unrestricted; a hemisphere; a place reading the list",
   flagApplies({ text: "t" }, SITE.left_cortex_pca, "left") === true
   && flagApplies({ text: "t", only: "dominant" }, SITE.left_cortex_pca, "left") === true
   && flagApplies({ text: "t", only: "dominant" }, SITE.right_cortex_pca, "left") === false
   && flagApplies({ text: "t", only: "bilateral_occipital" }, SITE.bilateral_occipital, "left") === true
   && flagApplies({ text: "t", only: "bilateral_occipital" }, SITE.left_cortex_occipital, "left") === false);
{ const cause = { name: "X", flags: [{ text: "Always." }, { text: "Dominant." , only: "dominant" }, { text: "Non-dominant.", only: "nondominant" }] };
  ok("helper: redLine — the cause's flags for this place and hemisphere, then the place's own flag",
     redLine(SITE.right_cortex_pca, cause, "left") === "Always. Non-dominant. An isolated hemianopia is easily missed — confrontation-test fields; consider a posterior-circulation cause.",
     redLine(SITE.right_cortex_pca, cause, "left"));
  ok("helper: redLine — no cause: the place's own flag; neither: null",
     redLine(SITE.left_medulla_lateral, null, "left") === "Swallowing can fail early — keep nil by mouth until assessed."
     && redLine(SITE.left_medulla_lateral, { name: "Y" }, "left") === "Swallowing can fail early — keep nil by mouth until assessed."); }
{ const res = causesFor(SITE.left_cortex_operculum), chronic = causesFor(SITE.left_cortex_operculum, { onset: "chronic" });
  ok("helper: cardCause — the What line's most likely cause, a selection (even from the set-aside band), none when the pressure leads or two places",
     cardCause({ res }) === leadingCause(res.all)
     && (cardCause({ res, selected: "Tumour (glioma / metastasis)" }) || {}).name === "Tumour (glioma / metastasis)"
     && (cardCause({ res: chronic, selected: "MCA (superior division) infarct" }) || {}).name === "MCA (superior division) infarct"
     && cardCause({ res, pressureLeads: true }) === null && cardCause({ res, twoLesions: true }) === null); }

// ---- B. A card never shows another cause's flag (the structural sweep) ----
// Over every place's own picture and every reading's, at every onset, with and without papilloedema, and every selectable cause.
// The card's cause is read from the What line itself (not from cardCause), so the sweep checks the card, not the helper.
{ const bad = [], missing = []; let cards = 0, shown = 0; const seen = new Set();
  const causeOfWhat = (what, names) => names.filter(n => what.startsWith(`Most likely ${n}`) || what === `Selected: ${n}.`)
    .sort((a, b) => b.length - a.length)[0] || null;
  for (const s of candidateSites()) {
    // One side per place: the other side reads the same flags. Except where the phonebook names each hemisphere — there a
    // hemisphere restriction only shows on the non-dominant side, so both sides are swept (amended 2026-11-12).
    const kind = kindOf(s); if (seen.has(kind) && !phonebookVariant(s, { dominantSide: "left" })) continue; seen.add(kind);
    const all = [...causesFor(s).all, ...(causesFor(s).demoted || [])], names = all.map(c => c.name);
    const applicable = all.flatMap(c => (c.flags || []).filter(f => flagApplies(f, s, "left")).map(f => ({ text: f.text, cause: c.name })));
    const pictures = [[...expectedFindings(s)], ...(s.variants || []).map(v => [...expectedFindings({ ...s, structures: v.structures, variants: undefined })])];
    const check = a => { if (!a) return; cards++;
      const cause = causeOfWhat(a.lines.what, names), red = a.lines.red || "";
      for (const f of applicable) {
        if (red.includes(f.text)) { shown++; if (!applicable.some(g => g.text === f.text && g.cause === cause)) bad.push(`${s.id}: "${f.text.slice(0, 40)}" beside ${cause}`); }
        else if (f.cause === cause) missing.push(`${s.id}: ${cause}'s flag missing`); } };
    for (const exp of pictures) { if (!exp.length) continue;
      for (const onset of ONSETS) { check(card(new Set(exp), { onset, pick: s.id })); check(card(new Set([...exp, P]), { onset, pick: s.id })); } }
    for (const c of all) { const exp = pictures[0]; if (exp.length) check(card(new Set(exp), { selectedPathology: c.name, pick: s.id })); }
  }
  ok("sweep: no card shows a cause's flag beside another cause", bad.length === 0, `${bad.length}: ${bad.slice(0, 3).join(" | ")}`);
  ok("sweep: every card whose cause has a flag at this place shows it", missing.length === 0, `${missing.length}: ${missing.slice(0, 3).join(" | ")}`);
  ok("sweep: it is not vacuous — over 3,000 cards, cause flags shown on over 100", cards > 3000 && shown > 100, `${cards} cards, ${shown} cause flags shown`); }

// ---- C. The place flags are a reviewed snapshot ----
// A NEW OR REWORDED PLACE FLAG FAILS HERE until someone has asked "is it true whatever the cause?" — if not, it belongs on a cause
// (causes.js `flagged`). No wording test can tell a place fact from a cause claim (spec §3.4), so this is the real gate.
const PLACE_FLAGS = [
  ["aphasia_subcortical_striatocapsular", "Aphasia with a dense contralateral hemiparesis and no cortical signs points to a deep dominant (striatocapsular) lesion."],
  ["aphasia_subcortical_thalamic", "Aphasia with contralateral sensory loss and no cortical signs points to the dominant thalamus."],
  ["basal_ganglia_globus_pallidus", "Young-onset dystonia needs Wilson's disease excluded (copper studies, slit-lamp) — it is treatable."],
  ["basal_ganglia_striatum.bilateral", "New chorea warrants a treatable-cause screen (glucose, thyroid, autoimmune, pregnancy/drug history) before attributing it to Huntington's."],
  ["basal_ganglia_striatum.dominant", "Check glucose — non-ketotic hyperglycaemia is a treatable cause of acute hemichorea/hemiballismus."],
  ["basal_ganglia_striatum.nondominant", "Check glucose — non-ketotic hyperglycaemia is a treatable cause of acute hemichorea/hemiballismus."],
  ["basal_ganglia_substantia_nigra.bilateral", "A symmetric, tremor-poor, rapidly progressive or early-falls parkinsonism suggests a Parkinson-plus syndrome — not idiopathic PD."],
  ["basal_ganglia_substantia_nigra.dominant", "Acute or rapidly progressive hemiparkinsonism is structural until proven otherwise — image the midbrain."],
  ["basal_ganglia_substantia_nigra.nondominant", "Acute or rapidly progressive hemiparkinsonism is structural until proven otherwise — image the midbrain."],
  ["basal_ganglia_subthalamic", "Check glucose — non-ketotic hyperglycaemia is a treatable, striatal cause of acute hemiballismus/hemichorea."],
  ["bilateral_anterior_temporal", "Acute Klüver-Bucy features with fever / confusion — treat empirically for HSV encephalitis; image, then do an LP."],
  ["bilateral_auditory", "Deafness with a normal audiogram and intact brainstem responses points to bilateral cortical lesions — image both temporal lobes."],
  ["bilateral_paracentral", "Bilateral leg weakness with urinary incontinence and a normal spine MRI is a parasagittal lesion until proven otherwise — image the brain."],
  ["cauda_equina", "A surgical emergency — new saddle anaesthesia, bladder dysfunction or bilateral sciatica needs urgent MRI and decompression."],
  ["cerebellum_flocculonodular", "New central (gaze-evoked, direction-changing) nystagmus with imbalance warrants posterior-fossa imaging."],
  ["cerebellum_hemisphere", "A space-occupying posterior-fossa lesion can cause brainstem compression and obstructive hydrocephalus — a neurosurgical emergency; image urgently."],
  ["cerebellum_pancerebellar", "A subacute pancerebellar syndrome can be paraneoplastic — screen for an occult malignancy (anti-Yo/Hu/Tr) alongside imaging."],
  ["cerebellum_vermis", "Truncal ataxia with headache and vomiting in a child suggests a midline posterior-fossa tumour — image and refer."],
  ["cerebrum_diffuse", "Coma with no focal signs: check glucose, sodium and a blood gas immediately."],
  ["combined_degeneration_scd", "Check B12 (and methylmalonic acid) early — SCD is treatable but irreversible if missed."],
  ["conus_medullaris", "Early symmetric sphincter involvement with UMN signs — urgent MRI of the conus; distinguish from cauda equina as it changes the level imaged."],
  ["cord_anterior", "A new bilateral cord picture is compression until whole-spine MRI says otherwise; only then does preserved vibration with a dissociated sensory loss point to ASA territory and an aortic or vascular cause."],
  ["cord_central", "Sacral sparing + a suspended dissociated loss points intramedullary — MRI the cord; exclude a tumour or Chiari malformation."],
  ["cord_hemi", "A structural cord lesion until proven otherwise — urgent MRI; a compressive cause is a surgical emergency."],
  ["cord_lateral", "A Horner with suspended sensory loss or long-tract signs → image the cervical cord."],
  ["cord_posterior", "Check B12/copper before it becomes irreversible — a treatable cause of a progressive myelopathy."],
  ["cord_transverse", "A new bilateral myelopathy with a sensory level is a neurological emergency — MRI the whole cord to exclude compression before anything else."],
  ["corpus_callosum_anterior", "A one-handed (left) apraxia with alien-hand behaviour is a callosal / medial-frontal lesion — image the interhemispheric region."],
  ["cortex_angular", "Isolated anomia localises poorly — correlate with the rest of the exam and imaging."],
  ["cortex_arcuate", "Repetition out of proportion to fluency and comprehension points to the arcuate fasciculus."],
  ["cortex_dlpfc", "A dysexecutive syndrome warrants frontal imaging and cognitive assessment."],
  ["cortex_fusiform.nondominant", "Acquired prosopagnosia points to the right (or bilateral) fusiform — image the medial occipitotemporal region."],
  ["cortex_mca_inferior.nondominant", "Dense neglect with anosognosia underestimates the deficit — the patient denies it; corroborate and image."],
  ["cortex_medial_pfc", "Profound apathy / akinetic mutism after SAH or ACA stroke — image the medial frontal lobes."],
  ["cortex_operculum.nondominant", "New flat, unmodulated speech is easily mistaken for depression — it is a focal sign that needs imaging."],
  ["cortex_occipital", "Confrontation-test the fields — an isolated hemianopia is easily overlooked; posterior circulation imaging is warranted."],
  ["cortex_orbitofrontal", "New disinhibition / personality change is a frontal sign — image the orbitofrontal region (and consider subfrontal masses)."],
  ["cortex_paracentral", "Bilateral leg weakness with urinary incontinence is a parasagittal lesion until proven otherwise — image the interhemispheric fissure."],
  ["cortex_parietal.dominant", "A focal cortical syndrome without weakness still needs imaging — tumour and stroke present identically here."],
  ["cortex_parietal.nondominant", "Neglect with anosognosia leads patients to deny deficits — corroborate history and examine formally."],
  ["cortex_pca.nondominant", "An isolated hemianopia is easily missed — confrontation-test fields; consider a posterior-circulation cause."],
  ["cortex_premotor", "Apraxia with normal power is a cortical (premotor / parietal) sign — image the frontoparietal cortex."],
  ["cortex_sma", "A medial frontal / parasagittal lesion — image the interhemispheric frontal region and the ACA territory."],
  ["cortex_temporoparietal.nondominant", "Subtle; the deficit is in emotional communication rather than words."],
  ["cortex_temporal", "New olfactory/gustatory hallucinations or episodic fear may be focal seizures — consider EEG and imaging."],
  ["craniocervical_junction_foramen_magnum", "New downbeat nystagmus warrants craniocervical-junction imaging — a Chiari or foramen-magnum lesion is surgically treatable."],
  ["dorsal_midbrain_tectum", "A supranuclear vertical gaze palsy warrants dorsal-midbrain imaging — look for a tectal lesion or early hydrocephalus."],
  ["guillain_mollaret_dentate", "Palatal tremor with cerebellar signs points to the dentate / superior cerebellar peduncle — image the cerebellum and its peduncles."],
  ["guillain_mollaret_rubral", "Palatal tremor plus rubral (Holmes) tremor localises to the midbrain — image the dorsal midbrain."],
  ["guillain_mollaret_triangle", "New palatal tremor warrants MRI looking for hypertrophic olivary degeneration and the causative brainstem/cerebellar lesion."],
  ["hypothalamus_mammillary", "Give parenteral thiamine BEFORE glucose in any at-risk patient with confusion / amnesia — Wernicke is a treatable emergency."],
  ["hypothalamus_suprachiasmatic", "Persistent circadian disruption with other hypothalamic features warrants imaging."],
  ["hypothalamus_supraoptic", "Polyuria with rising sodium after pituitary surgery or head injury is central DI — measure paired serum/urine osmolality."],
  ["hypothalamus_thermoregulatory", "Unexplained persistent hyper/hypothermia with other hypothalamic signs — image the hypothalamus."],
  ["hypothalamus_tuberal", "Combined endocrine dysfunction with visual-field loss points to a suprasellar mass — image and check the pituitary axis."],
  ["hypothalamus_ventromedial", "New-onset hyperphagic obesity with visual or endocrine signs — image the suprasellar / hypothalamic region."],
  ["locked_in", "Do not mistake locked-in for coma or a vegetative state — the patient is fully aware; establish a vertical-eye-movement / blink communication channel."],
  ["medulla_lateral", "Swallowing can fail early — keep nil by mouth until assessed."],
  ["medulla_medial", "Bilateral involvement threatens respiration — monitor and image urgently."],
  ["midbrain_lateral", "Posterior circulation imaging is warranted for any crossed midbrain picture."],
  ["midbrain_medial", "Crossed midbrain signs can be haemorrhage, not just infarct — image before assuming stroke."],
  ["midbrain_trochlear", "A CONTRALATERAL (crossed) superior oblique palsy localises into the dorsal midbrain, not the nerve — image the brainstem."],
  ["motor_unit_anterior_horn", "New progressive painless weakness with fasciculations and no sensory loss needs urgent neurology — if upper motor neurone signs are also present, think ALS."],
  ["motor_unit_muscle", "Proximal weakness with a rash or dysphagia may be dermatomyositis — check CK and screen for an underlying malignancy."],
  ["motor_unit_nmj_postsynaptic", "A myasthenic crisis with bulbar/respiratory failure is an emergency — watch the forced vital capacity, not just the oxygen saturation."],
  ["nerve_axillary", "Check axillary function after every shoulder dislocation/reduction — it is easily missed."],
  ["nerve_femoral", "Femoral palsy with anticoagulation is a retroperitoneal haematoma until proven otherwise — image urgently."],
  ["nerve_long_thoracic", "Painful winging after a viral illness is often neuralgic amyotrophy — usually recovers, but confirm the pattern."],
  ["nerve_median_ain", "An inability to make the 'OK' sign with no sensory loss is the anterior interosseous nerve."],
  ["nerve_median_carpal_tunnel", "Nocturnal hand paraesthesiae with thenar wasting and palmar sparing is carpal tunnel — treat before permanent wasting."],
  ["nerve_median_proximal", "Median weakness that includes pronation and forearm flexors (not just thenar) localises proximal to the carpal tunnel."],
  ["nerve_musculocutaneous", "Isolated musculocutaneous palsy is rare — look for a wider plexus lesion."],
  ["nerve_obturator", "Medial-thigh pain with adductor weakness — consider an obturator hernia or pelvic mass."],
  ["nerve_peroneal_common", "Foot drop with SPARED inversion and hip abduction is peroneal, not L5 — the spared movements are the whole discriminator."],
  ["nerve_peroneal_deep", "Foot drop with spared eversion localises below the peroneal bifurcation to the deep branch."],
  ["nerve_peroneal_superficial", "Weak eversion with preserved dorsiflexion is the superficial peroneal branch."],
  ["nerve_radial_axilla", "Triceps weakness + lost triceps jerk marks a lesion above the spiral groove — separate from a C7 root by the intact dermatome/other C7 muscles."],
  ["nerve_radial_pin", "Finger drop with a preserved wrist extension and no sensory loss is the PIN, not a spiral-groove radial palsy."],
  ["nerve_radial_spiral_groove", "Wrist drop with a preserved triceps jerk localises to the spiral groove, not the axilla."],
  ["nerve_sciatic", "A dense sciatic palsy after hip surgery needs early recognition — the peroneal division is the most vulnerable and may look like an isolated foot drop."],
  ["nerve_superior_gluteal", "A Trendelenburg gait localises to gluteus medius (superior gluteal) or an L5 root — the sensory exam separates them."],
  ["nerve_suprascapular", "Deep shoulder pain with external-rotation weakness — image the notch for a ganglion."],
  ["nerve_tibial", "Sole numbness with weak toe flexion localises to the tibial nerve — tarsal-tunnel entrapment is treatable."],
  ["nerve_ulnar_elbow", "Dorsal-hand sensory loss and FDP/FCU weakness localise the ulnar lesion to the elbow, not the wrist."],
  ["nerve_ulnar_wrist", "A worse claw with spared FDP and dorsal-hand sensation localises the ulnar lesion to the wrist — the paradox that the distal lesion looks worse."],
  ["parinaud_dorsal_midbrain", "Vertical gaze palsy + light-near dissociation, especially in a young patient — image the pineal region and ventricles; obstructive hydrocephalus is a neurosurgical emergency."],
  ["peripheral_vestibular_labyrinth", "An acute vestibular syndrome with CENTRAL features (direction-changing/gaze-evoked or vertical nystagmus, NORMAL head-impulse, skew) is a posterior-circulation stroke until proven otherwise — image, do not reassure."],
  ["plexus_lower_trunk", "A lower-trunk plexopathy with a Horner's is a Pancoast tumour until proven otherwise — image the lung apex."],
  ["plexus_lumbar_plexus", "Painful proximal leg weakness with weight loss needs imaging of the retroperitoneum and a diabetes screen."],
  ["plexus_lumbosacral_plexus", "A painful whole-leg plexopathy with weight loss is diabetic amyotrophy or malignant infiltration until imaging and a diabetes screen say otherwise — and on anticoagulation, image urgently for a haematoma."],
  ["plexus_sacral_plexus", "A progressive painful sacral plexopathy suggests pelvic malignancy — image the pelvis."],
  ["plexus_upper_trunk", "Acute painful upper-limb weakness with patchy wasting may be neuralgic amyotrophy — but exclude traction injury and malignant infiltration."],
  ["polyneuropathy_length_dependent", "A rapidly ascending or NON-length-dependent pattern (hands before feet, asymmetric, or areflexia out of proportion) points away from a stocking-glove axonopathy — think Guillain-Barré, vasculitis or a demyelinating neuropathy, and act urgently."],
  ["polyradiculoneuropathy_acute", "Measure the forced vital capacity, not the oxygen saturation — respiratory failure shows late on the monitor and early in the patient. A sensory level or early sphincter failure means cord compression until an MRI says otherwise."],
  ["pons_medial", "Basilar territory disease can progress to locked-in syndrome — watch closely."],
  ["pons_trigeminal", "A trigeminal motor + main-sensory deficit points into the pons — image the brainstem."],
  ["pontomesencephalic_tegmentum", "Upbeat nystagmus with other brainstem signs needs urgent imaging; consider thiamine (Wernicke's) empirically if any nutritional risk."],
  ["pupil_cn3_compressive", "A fixed dilated pupil with a third-nerve palsy is a SURGICAL EMERGENCY — image the vessels (CTA/MRA) for an aneurysm now."],
  ["pupil_pretectum", "Bilateral light-near dissociation warrants syphilis serology and a look at the dorsal midbrain."],
  ["root_c5", "Progressive or bilateral cervical radiculopathy — image and exclude a myelopathy (long-tract signs change everything)."],
  ["root_c6", "C6 and C7 overlap clinically — the reflex (brachioradialis vs triceps) and the affected digit help separate them."],
  ["root_c7", "New bilateral or progressive signs, or any long-tract sign, means image to exclude cord compression."],
  ["root_c8", "C8/T1 signs with a Horner's suggest a Pancoast tumour — image the lung apex."],
  ["root_l2", "Proximal leg weakness with weight loss may be diabetic amyotrophy or a retroperitoneal lesion — image and check glucose."],
  ["root_l3", "Knee buckling from quadriceps weakness — assess falls risk; image the high lumbar spine."],
  ["root_l4", "Foot drop can be L4/L5 or a peroneal palsy — the knee jerk and dorsiflexion pattern separate them."],
  ["root_l5", "Distinguish an L5 root from a common peroneal palsy: L5 also weakens foot inversion and hip abduction, the peroneal nerve does not."],
  ["root_s1", "Bilateral S1/S2 signs with saddle anaesthesia or sphincter change is cauda equina — a surgical emergency."],
  ["root_t1", "Wasting of the hand intrinsics with a Horner's — exclude an apical lung lesion."],
  ["skull_base_cavernous_sinus", "A septic cavernous sinus thrombosis is an emergency — fever, proptosis and rapidly progressive multi-nerve palsy need urgent imaging and antibiotics."],
  ["skull_base_cpa", "Unilateral sensorineural hearing loss deserves an MRI of the internal auditory meatus — a schwannoma is eminently treatable when small."],
  ["skull_base_hypoglossal_canal", "An isolated XII palsy is a skull-base lesion until proven otherwise — image the clivus and occipital condyle."],
  ["skull_base_iam", "Progressive unilateral sensorineural hearing loss with facial palsy needs an MRI of the IAM/CPA."],
  ["skull_base_jugular_foramen", "A pulsatile tinnitus with lower-cranial-nerve palsies suggests a glomus tumour — image the skull base with contrast."],
  ["skull_base_optic_aion", "Altitudinal visual loss with jaw claudication, scalp tenderness or raised ESR/CRP is giant-cell arteritis — start high-dose steroids immediately to save the other eye."],
  ["skull_base_orbital_apex", "In a diabetic or immunocompromised patient, apex syndrome with a black nasal eschar is invasive mucormycosis — a surgical emergency."],
  ["skull_base_petrous_apex", "Gradenigo's triad after otitis media is a surgical emergency — image the petrous apex."],
  ["skull_base_sup_orbital_fissure", "Painful ophthalmoplegia can be Tolosa-Hunt, but exclude a mass or aneurysm first — image before steroids."],
  ["skull_base_trochlear_cisternal", "Bilateral trochlear palsy after head trauma suggests a dorsal-midbrain (tectal plate) injury — image it."],
  ["skull_base_vii_stylomastoid", "Forehead-SPARING facial weakness is an UPPER-motor (central) lesion, not this — re-examine the forehead."],
  ["skull_base_villaret", "The added Horner's places the lesion in the retroparotid/retropharyngeal space — image the deep neck as well as the skull base."],
  ["subcortex_anterior_choroidal", "The full triad from one small perforator can look like a large cortical stroke — the absence of cortical signs points deep; image to confirm."],
  ["subcortex_thalamus", "Central post-stroke pain is often refractory and misattributed — it is a thalamic sign, not functional."],
  ["sympathetic_preganglionic", "A preganglionic Horner with C8/T1 wasting or arm pain → image the lung apex for a Pancoast tumour."],
  ["thalamus_bilateral_percheron", "Sudden coma with vertical gaze palsy and a near-normal early CT → suspect a Percheron infarct or deep venous thrombosis; get vascular imaging."],
  ["thalamus_limbic", "Acute amnesia with a diencephalic lesion — give thiamine before glucose if any nutritional risk (Wernicke)."],
  ["thalamus_pulvinar", "Neglect can arise from a deep thalamic lesion as well as the cortex — image both."],
  ["thalamus_vl", "A new movement disorder with a deep contralateral lesion — image the thalamus."],
  ["thalamus_vpm", "Crossed facial sensory loss (contralateral, no ipsilateral brainstem signs) points above the pons — image the thalamus."],
  ["visual_pathway_chiasm", "Bitemporal field loss with headache or endocrine change — image the sella; acuity/colour loss or apoplexy are emergencies."],
  ["visual_pathway_lgn", "A wedge/sectoranopia with thalamic sensory signs points to the lateral geniculate."],
  ["visual_pathway_optic_tract", "A homonymous hemianopia WITH an RAPD localises to the optic tract (pre-geniculate), not the occipital cortex."],
];
{ const now = placeFlags(), want = PLACE_FLAGS.slice().sort((a, b) => (a[0] < b[0] ? -1 : 1));
  const keyed = rows => new Map(rows.map(([k, t]) => [k, t]));
  const N = keyed(now), W = keyed(want);
  const added = [...N.keys()].filter(k => !W.has(k)), removed = [...W.keys()].filter(k => !N.has(k)), reworded = [...N.keys()].filter(k => W.has(k) && W.get(k) !== N.get(k));
  ok("snapshot: the 132 place flags are exactly the reviewed ones (131 kept + the diffuse cerebrum's place half)",
     now.length === 132 && !added.length && !removed.length && !reworded.length,
     `${now.length} flags; added: ${added.join(", ") || "—"}; removed: ${removed.join(", ") || "—"}; reworded: ${reworded.join(", ") || "—"}`); }

// ---- D. A floor for the dangerous phrasings ----
// A place flag may not use these forms without a reasoned entry. The floor alone misses cause claims written without them, which
// is why the snapshot above is the gate.
const CLAIM_FORMS = [
  [/until (?:proven|imaging (?:and [^,.]+ )?says?|an MRI says|whole-spine MRI says|imaging and a diabetes screen say) otherwise/i, "until proven otherwise"],
  [/\b(?:is|it is) an? (?:[\w-]+ ){0,4}(?:stroke|infarct|occlusion|haemorrhage|tumour|metastasis|dissection|encephalitis|lacune)\b/i, "is a <pathology>"],
  [/time-critical/i, "time-critical"],
  [/thromboly|thrombectom|reperfusion/i, "thrombolysis / thrombectomy / reperfusion"],
  [/\breassuring\b|\bbenign\b/i, "reassuring / benign"],
  [/treat (?:\w+ )?empirically|empirically for/i, "treat empirically"],
];
const ALLOW = {
  cord_hemi: "a cause-neutral class (a structural lesion), true whatever the cause",
  cord_anterior: "the place's compression rule (spinal cord fix, content round A4): true until whole-spine MRI says otherwise",
  bilateral_anterior_temporal: "conditional on fever and confusion, the findings it names itself",
  peripheral_vestibular_labyrinth: "conditional on CENTRAL features, the findings it names itself: they point away from this place",
  "basal_ganglia_substantia_nigra.dominant": "a cause-neutral class (structural)",
  "basal_ganglia_substantia_nigra.nondominant": "a cause-neutral class (structural)",
  skull_base_hypoglossal_canal: "a place claim: an isolated XII palsy is a skull-base lesion",
  polyradiculoneuropathy_acute: "conditional on a sensory level or early sphincter failure",
  plexus_lower_trunk: "conditional on a Horner's",
  plexus_lumbosacral_plexus: "conditional on weight loss and anticoagulation",
  nerve_femoral: "conditional on anticoagulation",
  cortex_paracentral: "a place claim: a parasagittal lesion",
  bilateral_paracentral: "a place claim: a parasagittal lesion",
};
{ const bad = [], stale = [];
  const flags = placeFlags(), byId = new Map(flags);
  for (const [id, t] of flags) if (CLAIM_FORMS.some(([re]) => re.test(t)) && !ALLOW[id]) bad.push(id);
  for (const id of Object.keys(ALLOW)) if (!byId.has(id) || !CLAIM_FORMS.some(([re]) => re.test(byId.get(id)))) stale.push(id);
  ok("floor: no place flag uses a dangerous phrasing without a reasoned allowlist entry", bad.length === 0, bad.join(", "));
  ok("floor: every allowlist entry still names a place flag that uses one", stale.length === 0, stale.join(", ")); }

// ---- E. No title names a pathology ----
const TITLE_PATHOLOGY = /\b(lacun\w*|infarct\w*|stroke|haemorrhag\w*|tumou?r|glioma|metasta\w*|wernicke-korsakoff|embol\w*|dissection|aneurysm)\b/i;
{ const bad = [];
  for (const [k, v] of Object.entries(BY_SITE)) { if (v.name && TITLE_PATHOLOGY.test(v.name)) bad.push(`${k}: ${v.name}`);
    for (const sub of ["dominant", "nondominant", "bilateral"]) if (v[sub] && v[sub].name && TITLE_PATHOLOGY.test(v[sub].name)) bad.push(`${k}.${sub}: ${v[sub].name}`); }
  ok("titles: no card title names a pathology", bad.length === 0, bad.join(" | ")); }
for (const [k, n] of [
  ["subcortex_internal_capsule", "Pure motor hemiparesis (internal capsule)"], ["subcortex_corona_radiata", "Pure motor hemiparesis (corona radiata)"],
  ["subcortex_thalamus", "Pure sensory syndrome / Déjerine–Roussy (thalamic VPL)"], ["subcortex_sensorimotor", "Sensorimotor syndrome (thalamocapsular)"],
  ["pons_basis_pontis", "Ventral pontine (basis pontis) syndrome"], ["hypothalamus_mammillary", "Mammillary body syndrome (diencephalic amnesia)"],
  ["sympathetic_pancoast", "Pancoast syndrome (superior sulcus)"],
]) ok(`titles: ${k} reads "${n}"`, (BY_SITE[k] || {}).name === n, (BY_SITE[k] || {}).name);

// ---- F. Every restriction is real ----
{ const flags = causeFlags(), bad = [];
  for (const f of flags.filter(x => x.only)) {
    const readers = candidateSites().filter(s => listOf(s) === f.list);
    const real = f.only === "dominant" || f.only === "nondominant"
      ? readers.some(s => ["left", "right"].some(d => phonebookVariant(s, { dominantSide: d }) === f.only))
      : readers.some(s => kindOf(s) === f.only);
    if (!real) bad.push(`${f.list} / ${f.cause}: only ${f.only}`); }
  ok("restrictions: 38 cause flags, 13 restricted, every restriction names a place or hemisphere reading that list",
     flags.length === 38 && flags.filter(x => x.only).length === 13 && bad.length === 0, `${flags.length} flags; ${bad.join(" | ")}`); }

// ---- G. The cards that showed the defect ----
const BASILAR_TIP = "Drowsiness with vertical gaze palsy and visual loss is a basilar-tip occlusion until proven otherwise — CTA now; it is a thrombectomy target, and it is regularly called delirium.";
const TOB = "reduced_consciousness@none vertical_gaze_palsy@none homonymous_hemianopia@left homonymous_hemianopia@right";
{ const a = card(TOB), b = card(`${TOB} ${P}`);
  ok("top of the basilar: its own card keeps the basilar-tip flag", a?.lines.red === BASILAR_TIP, a?.lines.red);
  ok("top of the basilar + papilloedema: the card names deep cerebral venous thrombosis and drops the basilar-tip flag",
     /^Most likely Deep cerebral venous thrombosis/.test(b?.lines.what || "") && !(b?.lines.red || "").includes("basilar-tip"), `${b?.lines.what} | ${b?.lines.red}`); }
{ const a = card(`${own("left_cortex_temporoparietal")} ${P}`, { pick: "left_cortex_temporoparietal" });
  ok("Wernicke's area + papilloedema: a haemorrhage leads, and no flag says to consider thrombolysis",
     /^Most likely Intracerebral haemorrhage/.test(a?.lines.what || "") && !(a?.lines.red || "").includes("thrombolysis"), `${a?.lines.what} | ${a?.lines.red}`); }
{ const BROCA = "Acute non-fluent aphasia + right hemiparesis is a dominant MCA stroke — time-critical.", op = own("left_cortex_operculum");
  const d = card(op, { pick: "left_cortex_operculum" }), sel = card(op, { pick: "left_cortex_operculum", selectedPathology: "Tumour (glioma / metastasis)" });
  const chr = card(op, { pick: "left_cortex_operculum", onset: "chronic" });
  ok("Broca's area: its own card keeps the MCA flag, word for word", d?.lines.red === BROCA, d?.lines.red);
  ok("Broca's area: selecting the tumour drops it", sel?.lines.what === "Selected: Tumour (glioma / metastasis)." && sel?.lines.red === null, `${sel?.lines.what} | ${sel?.lines.red}`);
  ok("Broca's area: at chronic onset, following the tumour, it is dropped", !(chr?.lines.red || "").includes("time-critical"), chr?.lines.red); }
{ const a = card(`${own("left_pupil_cn3_ischaemic")} ${P}`, { pick: "left_pupil_cn3_ischaemic" });
  ok("the ischaemic III + papilloedema: no flag calls it reassuring", !/reassuring/i.test(a?.lines.red || ""), a?.lines.red); }
{ const a = card(`${own("left_medulla_lateral")} ${P}`, { pick: "left_medulla_lateral", onset: "subacute" });
  ok("where the pressure leads, the place's own flag shows (row 10's blank reversed): the lateral medulla",
     a?.nx.pressureLeads === true && a?.lines.red === "Swallowing can fail early — keep nil by mouth until assessed.", `${a?.nx.pressureLeads} | ${a?.lines.red}`); }
{ const UNCAL = "A new dilated pupil with a falling conscious level is uncal herniation until proven otherwise — CT head now and call neurosurgery; start lowering the pressure while you wait.";
  const CN3 = "A fixed dilated pupil with a third-nerve palsy is a SURGICAL EMERGENCY — image the vessels (CTA/MRA) for an aneurysm now.";
  const toks = "reduced_consciousness@none fixed_dilated_pupil@left weak_arm@right weak_leg@right";
  const a = card(toks), b = card(toks, { selectedPathology: "Posterior communicating artery aneurysm" });
  ok("the uncal reading: herniation's flag, then the compressive III's own flag", a?.lines.red === `${UNCAL} ${CN3}`, a?.lines.red);
  ok("the uncal reading: selecting the aneurysm shows the III's own flag, not herniation's", b?.lines.red === CN3, b?.lines.red); }
{ const ALEXIA = "New pure alexia with a right hemianopia is a left PCA stroke until proven otherwise.";
  const l = card(own("left_cortex_pca"), { pick: "left_cortex_pca" }), r = card(own("right_cortex_pca"), { pick: "right_cortex_pca" });
  ok("a hemisphere's flag: the dominant PCA shows pure alexia; the non-dominant shows its own place flag",
     l?.lines.red === ALEXIA && r?.lines.red === "An isolated hemianopia is easily missed — confrontation-test fields; consider a posterior-circulation cause.", `${l?.lines.red} | ${r?.lines.red}`); }
{ const o = card(own("left_cortex_occipital"), { pick: "left_cortex_occipital" }), b = card(own("bilateral_occipital"), { pick: "bilateral_occipital" });
  ok("a shared list: the occipital lobe keeps its own flag; both occipital lobes show theirs",
     o?.lines.red === "Confrontation-test the fields — an isolated hemianopia is easily overlooked; posterior circulation imaging is warranted."
     && b?.lines.red === "Top-of-the-basilar embolism is a treatable cause of bilateral occipital stroke — image the posterior circulation urgently.", `${o?.lines.red} | ${b?.lines.red}`); }
{ const CAUSE_HALF = "Coma with no focal signs and intact brainstem reflexes is metabolic / diffuse until proven otherwise.";
  const PLACE_HALF = "Coma with no focal signs: check glucose, sodium and a blood gas immediately.";
  const a = card("reduced_consciousness@none"), b = card(`reduced_consciousness@none ${P}`);
  ok("the split: coma reads the metabolic cause's half, then the place's half", a?.lines.red === `${CAUSE_HALF} ${PLACE_HALF}`, a?.lines.red);
  ok("the split: coma + papilloedema (the pressure leads) keeps only the place's half", b?.lines.red === PLACE_HALF, b?.lines.red); }
ok("P22 reworded: image, then LP",
   (BY_SITE.bilateral_anterior_temporal || {}).red === "Acute Klüver-Bucy features with fever / confusion — treat empirically for HSV encephalitis; image, then do an LP.");

// ---- report ----
console.log(`\nNeuroLocaliser — the card follows its cause (round 1)\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

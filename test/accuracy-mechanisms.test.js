// accuracy-mechanisms.test.js — the engine mechanisms added by accuracy round 1 (spec 2026-09-25 §4A).
// Content (which structures sit where) is asserted in the regional suites; this suite pins the machinery.
import { STRUCTURE_BY_ID } from "../src/model/structures.js";
import { expectedFindings, explain } from "../src/engine/forward.js";
import { candidateSites, differential, ruledOutSites, solve, PREVALENCE_ALLOWANCE, rankKey } from "../src/engine/inverse.js";
import { prevalenceOf, COMMON, UNCOMMON, RARE } from "../src/model/prevalence.js";
import { SITE_BY_ID } from "../src/model/sites.js";
import { FINDINGS, CROSSES } from "../src/model/findings.js";
import { LOCALISING } from "../src/engine/score.js";
import { EXAM_TREE, flattenFindings } from "../app/exam-map.js";
import { CAUSES, causesFor } from "../src/data/causes.js";
import { nextStepsFor, pathologyNextStepsFor, hyperacuteVascular, combinedNextSteps } from "../src/data/nextSteps.js";
import { compartmentOf } from "../src/model/compartments.js";
import { BY_SITE } from "../src/data/syndromes.js";

let pass = 0, fail = 0;
const ok = (l, c, d = "") => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l + (c ? "" : `  ${d}`)); };

// ---- A2: structure emission override ----
// Synthetic structures, injected and removed again, so the mechanism is tested independently of content.
{
  STRUCTURE_BY_ID.zz_emit_mid = { id: "zz_emit_mid", level: "cord", part: "zz", produces: "sphincter_dysfunction", emit: "midline" };
  STRUCTURE_BY_ID.zz_emit_bi = { id: "zz_emit_bi", level: "cauda", part: "zz", produces: "reflex_ankle_loss", emit: "bilateral" };
  STRUCTURE_BY_ID.zz_plain = { id: "zz_plain", level: "cauda", part: "zz", produces: "saddle_anaesthesia" };
  const bilat = { id: "zz_bilat", side: "bilateral", level: "cord", part: "zz", structures: ["zz_emit_mid"] };
  const mid = { id: "zz_mid", side: "midline", level: "cauda", part: "zz", structures: ["zz_emit_bi", "zz_plain"] };
  const left = { id: "zz_left", side: "left", level: "cauda", part: "zz", structures: ["zz_emit_bi"] };
  const eb = expectedFindings(bilat), em = expectedFindings(mid), el = expectedFindings(left);
  ok("emit:'midline' at a BILATERAL site emits @midline only",
     eb.has("sphincter_dysfunction@midline") && !eb.has("sphincter_dysfunction@left") && !eb.has("sphincter_dysfunction@right"));
  ok("emit:'bilateral' at a MIDLINE site emits @left and @right, not @midline",
     em.has("reflex_ankle_loss@left") && em.has("reflex_ankle_loss@right") && !em.has("reflex_ankle_loss@midline"));
  ok("a structure without `emit` keeps the site's own rule (midline site → @midline)", em.has("saddle_anaesthesia@midline"));
  ok("emit:'bilateral' at a one-sided site still emits both sides",
     el.has("reflex_ankle_loss@left") && el.has("reflex_ankle_loss@right"));
  const xm = explain(mid).filter(e => e.structure === "zz_emit_bi").map(e => e.bodySide).sort();
  ok("explain() agrees with expectedFindings() for emit:'bilateral'", JSON.stringify(xm) === JSON.stringify(["left", "right"]));
  const xb = explain(bilat).map(e => e.bodySide);
  ok("explain() agrees with expectedFindings() for emit:'midline'", JSON.stringify(xb) === JSON.stringify(["midline"]));
  delete STRUCTURE_BY_ID.zz_emit_mid; delete STRUCTURE_BY_ID.zz_emit_bi; delete STRUCTURE_BY_ID.zz_plain;
}

// ---- A1: asymmetry-tolerant sites (owner rulings 2026-09-25) ----
{
  const cs = candidateSites();
  const byId = id => cs.find(s => s.id === id);
  const asym = ["motor_unit_anterior_horn", "motor_unit_nmj_postsynaptic", "motor_unit_nmj_presynaptic", "motor_unit_muscle", "cauda_equina"];
  ok("the four motor-unit sites and the cauda equina are asymmetric", asym.every(id => byId(id)?.asymmetric === true),
     asym.filter(id => byId(id)?.asymmetric !== true).join(", "));
  const sym = ["conus_medullaris", "polyneuropathy_length_dependent", "combined_degeneration_scd", "combined_degeneration_friedreich", "locked_in", "bilateral_cord_transverse"];
  ok("symmetric-by-definition sites are NOT asymmetric", sym.every(id => byId(id) && !byId(id).asymmetric),
     sym.filter(id => byId(id)?.asymmetric).join(", "));
  const ids = toks => differential(new Set(toks), { dominantSide: "left" }).map(c => c.site.id);
  ok("one-sided fatigable ptosis keeps myasthenia as a candidate", ids(["fatigable_ocular@left"]).includes("motor_unit_nmj_postsynaptic"));
  ok("one-sided fasciculations keep the anterior horn as a candidate", ids(["fasciculations@left"]).includes("motor_unit_anterior_horn"));
  ok("one-sided LMN weakness is no longer a dead end", ids(["lmn_weakness@left"]).length > 0);
  ok("a symmetric site is still excluded by a one-sided entry (distal sensory loss, left only)",
     !ids(["distal_sensory_loss@left"]).includes("polyneuropathy_length_dependent"));
  const ruled = ruledOutSites(new Set(["fatigable_ocular@left", "fasciculations@left"]), { dominantSide: "left" });
  ok("ruledOutSites never lists an asymmetric site", !ruled.some(x => x.site.asymmetric), ruled.map(x => x.site.id).join(", "));
}

// ---- A3: tighter-fit ranking ----
{
  ok("each prevalence tier is worth 3 unreported predictions", PREVALENCE_ALLOWANCE === 3);
  ok("rankKey = over − 3 × prevalence", rankKey({ over: 7, prevalence: 2 }) === 1 && rankKey({ over: 0, prevalence: 0 }) === 0);
  // Transitivity: the order must be a total preorder, or Array.sort is undefined. Check every pair of a
  // large real differential against the documented key.
  const d = differential(new Set(["weak_arm@left"]), { dominantSide: "left" });
  let consistent = true;
  for (let i = 0; i < d.length; i++) for (let j = i + 1; j < d.length; j++) {
    const a = d[i], b = d[j];
    const before = a.n > b.n || (a.n === b.n && (rankKey(a) < rankKey(b) || (rankKey(a) === rankKey(b)
      && (a.prevalence > b.prevalence || (a.prevalence === b.prevalence && (a.over < b.over
      || (a.over === b.over && a.site.id.localeCompare(b.site.id) <= 0)))))));
    if (!before) consistent = false;
  }
  ok(`the differential is a total order under the documented key (${d.length} candidates)`, consistent);
  const first = toks => solve(new Set(toks), { dominantSide: "left" }).display[0]?.site.id;
  ok("thalamic pain → the thalamus, not the sensorimotor stroke that predicts 7 unreported signs",
     first(["thalamic_pain@left"]) === "right_subcortex_thalamus", first(["thalamic_pain@left"]));
}

// ---- A6: prevalence ordering ----
{
  const cs = candidateSites(); const byId = id => cs.find(s => s.id === id);
  ok("length-dependent polyneuropathy is COMMON (the bilateral rule no longer shadows it)",
     prevalenceOf(byId("polyneuropathy_length_dependent")) === COMMON);
  ok("other bilateral sites stay RARE", ["locked_in", "motor_unit_muscle", "bilateral_cord_transverse"].every(id => prevalenceOf(byId(id)) === RARE));
}

// ---- B13: forehead also weak — the LMN facial discriminator ----
{
  ok("forehead_involved is a finding, ipsilateral, LOCALISING, and in the exam tree",
     !!FINDINGS.forehead_involved && CROSSES.forehead_involved === false && LOCALISING.has("forehead_involved")
     && flattenFindings(EXAM_TREE).includes("forehead_involved"));
  const lmnVII = ["left_skull_base_iam", "left_skull_base_cpa", "left_skull_base_vii_geniculate", "left_skull_base_vii_tympanic",
                  "left_skull_base_vii_mastoid", "left_skull_base_vii_stylomastoid", "left_pons_medial", "left_pons_lateral"];
  const cs = candidateSites(); const byId = id => cs.find(s => s.id === id);
  ok("every LMN facial site predicts the forehead weak on the SAME side",
     lmnVII.every(id => expectedFindings(byId(id), { dominantSide: "left" }).has("forehead_involved@left")),
     lmnVII.filter(id => !expectedFindings(byId(id), { dominantSide: "left" }).has("forehead_involved@left")).join(", "));
  ok("the parotid (a single branch) does not predict the forehead", !expectedFindings(byId("left_skull_base_vii_parotid")).has("forehead_involved@left"));
  ok("no UMN facial site predicts it", !expectedFindings(byId("right_cortex_motor_facearm")).has("forehead_involved@left"));
}

// ---- B12: the AICA / lateral inferior pontine syndrome ----
{
  const e = expectedFindings(SITE_BY_ID.left_pons_lateral, { dominantSide: "left" });
  const want = ["facial_weakness@left", "forehead_involved@left", "hearing_loss@left", "face_pain_loss@left", "miosis@left", "ptosis@left"];
  ok("the lateral pons predicts the AICA features, all ipsilateral", want.every(t => e.has(t)), want.filter(t => !e.has(t)).join(", "));
}

// ---- B3 / B4 / ruling 8: the vestibular periphery ----
{
  const cs = candidateSites(); const byId = id => cs.find(s => s.id === id);
  for (const c of ["posterior_canal", "horizontal_canal", "anterior_canal"])
    ok(`BPPV ${c} predicts vertigo on its own side`, expectedFindings(byId(`left_peripheral_vestibular_${c}`)).has("cn8_vertigo@left"));
  ok("the labyrinth predicts hearing loss (labyrinthitis / Ménière)", expectedFindings(byId("left_peripheral_vestibular_labyrinth")).has("hearing_loss@left"));
  ok("posterior-canal BPPV is COMMON", prevalenceOf(byId("left_peripheral_vestibular_posterior_canal")) === COMMON);
  ok("anterior-canal BPPV is RARE", prevalenceOf(byId("left_peripheral_vestibular_anterior_canal")) === RARE);
  ok("horizontal-canal BPPV stays UNCOMMON", prevalenceOf(byId("left_peripheral_vestibular_horizontal_canal")) === UNCOMMON);
}

// ---- B1 / B5 / B6 / B7: sphincter and ankle jerks ----
{
  const cs = candidateSites(); const e = id => expectedFindings(cs.find(s => s.id === id), { dominantSide: "left" });
  ok("the bilateral ANTERIOR cord predicts sphincter dysfunction @midline", e("bilateral_cord_anterior").has("sphincter_dysfunction@midline"));
  ok("the TRANSVERSE cord predicts sphincter dysfunction @midline", e("bilateral_cord_transverse").has("sphincter_dysfunction@midline"));
  ok("the central cord does NOT (owner: late and inconsistent)", !e("bilateral_cord_central").has("sphincter_dysfunction@midline"));
  ok("the hemicord does NOT", ![...e("left_cord_hemi")].some(t => t.startsWith("sphincter_dysfunction")));
  ok("the cauda predicts an absent ankle jerk on EACH side", e("cauda_equina").has("reflex_ankle_loss@left") && e("cauda_equina").has("reflex_ankle_loss@right"));
  ok("the cauda does NOT predict knee jerks (owner: ankle only)", ![...e("cauda_equina")].some(t => t.startsWith("reflex_knee_loss")));
  ok("the polyneuropathy predicts absent ankle jerks", e("polyneuropathy_length_dependent").has("reflex_ankle_loss@left"));
  ok("SCD predicts absent ankle jerks", e("combined_degeneration_scd").has("reflex_ankle_loss@right"));
  ok("no cord structure is a standalone site at the composite-only `autonomic` part",
     !cs.some(s => s.level === "cord" && s.part === "autonomic"));
}

// ---- B2 / B8 / B9 / B10 / B11 / ruling 7: supratentorial ----
{
  const cs = candidateSites(); const byId = id => cs.find(s => s.id === id);
  const e = id => expectedFindings(byId(id), { dominantSide: "left" });
  ok("the complete MCA predicts homonymous hemianopia", e("left_cortex_mca").has("homonymous_hemianopia@right"));
  ok("the MCA inferior division predicts homonymous hemianopia", e("left_cortex_mca_inferior").has("homonymous_hemianopia@right"));
  ok("the MCA superior division does not", !e("left_cortex_mca_superior").has("homonymous_hemianopia@right"));
  ok("Percheron predicts amnesia", e("thalamus_bilateral_percheron").has("amnesia@none"));
  const aph = ["left_cortex_operculum", "left_cortex_temporoparietal", "left_cortex_arcuate", "left_cortex_watershed_anterior",
               "left_cortex_watershed_posterior", "aphasia_global_left", "aphasia_mixed_transcortical_left", "striatocapsular_aphasia_left",
               "left_cortex_mca_superior", "left_cortex_mca_inferior", "left_cortex_mca"];
  ok("every dominant aphasia site predicts anomia", aph.every(id => e(id).has("naming_impaired@none")), aph.filter(id => !e(id).has("naming_impaired@none")).join(", "));
  ok("the non-dominant operculum does not", !expectedFindings(byId("right_cortex_operculum"), { dominantSide: "left" }).has("naming_impaired@none"));
  ok("the ACA predicts incontinence, gait apraxia and alien limb",
     ["urinary_incontinence@none", "gait_apraxia@none", "alien_limb@none"].every(t => e("left_cortex_aca").has(t)));
  ok("the VPL thalamus predicts contralateral facial sensory loss", e("left_subcortex_thalamus").has("face_sensory_loss@right"));
  ok("so does the thalamic-aphasia composite, which hand-lists the VPL rows", e("thalamic_aphasia_left").has("face_sensory_loss@right"));
  ok("the lateral midbrain is RARE (owner ruling 7)", prevalenceOf(byId("left_midbrain_lateral")) === RARE);
}

// ---- B14: the acute polyradiculoneuropathy (Guillain-Barré) site ----
{
  const gbs = candidateSites().find(s => s.id === "polyradiculoneuropathy_acute");
  ok("the GBS site exists, bilateral and SYMMETRIC", !!gbs && gbs.side === "bilateral" && !gbs.asymmetric);
  const e = gbs ? expectedFindings(gbs) : new Set();
  const want = ["lmn_weakness@left", "proximal_weakness@right", "distal_motor_weakness@left", "hypotonia@left",
                "reflex_biceps_loss@left", "reflex_brachioradialis_loss@left", "reflex_triceps_loss@left", "reflex_knee_loss@right",
                "reflex_ankle_loss@left", "facial_weakness@left", "forehead_involved@right", "dysphagia@left", "weak_diaphragm@right",
                "autonomic_features@left"];
  ok("it predicts motor, areflexia, LMN face, bulbar, respiratory and autonomic failure", want.every(t => e.has(t)), want.filter(t => !e.has(t)).join(", "));
  ok("it predicts NO sensory loss (owner: motor-predominant)", ![...e].some(t => /sensory/.test(t)));
  ok("compartment root, RARE", !!gbs && compartmentOf(gbs) === "root" && prevalenceOf(gbs) === RARE);
  ok("it has a phonebook entry", !!BY_SITE.polyradiculoneuropathy_acute);
  const causes = CAUSES.polyradiculoneuropathy_acute || [];
  ok(`it has a curated cause list (${causes.length} ≥ 6, each with a feature, ≥1 red)`,
     causes.length >= 6 && causes.every(c => c.feature) && causes.some(c => c.red));
  const nx = gbs ? nextStepsFor(gbs) : {};
  ok("its workup is curated, EMERGENCY, and fills all four tiers",
     nx.curated === true && nx.urgency === "emergency" && ["immediate", "investigations", "confirmatory", "monitoring"].every(k => (nx[k] || []).length > 0));
  ok("every cause at the site has an authored pathology plan",
     !!gbs && causes.every(c => pathologyNextStepsFor(gbs, c.name).pathologyCurated),
     gbs ? causes.filter(c => !pathologyNextStepsFor(gbs, c.name).pathologyCurated).map(c => c.name).join(", ") : "no site");
}

// ---- B15 / A4 / B16: stroke at hyperacute onset ----
{
  const cs = candidateSites(); const byId = id => cs.find(s => s.id === id);
  const ic = byId("left_subcortex_internal_capsule");
  const lac = causesFor(ic, { onset: "hyperacute" }).all.map(c => c.name);
  ok("a lacunar infarct is CONCORDANT with hyperacute onset at the capsule (B15)", lac.includes("Small-vessel lacunar infarct"));
  ok("the capsule badges emergency at hyperacute onset", nextStepsFor(ic, { onset: "hyperacute" }).urgency === "emergency");
  ok("…and keeps its curated badge with no onset", nextStepsFor(ic).urgency === "urgent");
  ok("a peripheral vestibular site does NOT escalate (peripheral compartment)", nextStepsFor(byId("left_peripheral_vestibular_labyrinth"), { onset: "hyperacute" }).urgency !== "emergency");
  ok("a microvascular CN III does NOT escalate", nextStepsFor(byId("left_pupil_cn3_ischaemic"), { onset: "hyperacute" }).urgency !== "emergency");
  ok("hyperacuteVascular is false without hyperacute onset", !hyperacuteVascular(ic, "acute") && !hyperacuteVascular(ic, undefined));
  // The no-onset call is byte-identical to the pre-change call, at every site kind.
  const seen = new Set(); let identical = true;
  for (const s of cs) { const k = `${s.level}_${s.part}`; if (seen.has(k)) continue; seen.add(k);
    if (JSON.stringify(nextStepsFor(s)) !== JSON.stringify(nextStepsFor(s, {}))) identical = false; }
  ok(`nextStepsFor(site) === nextStepsFor(site, {}) at all ${seen.size} site kinds`, identical);
  // B16: a VASCULAR cause selected at hyperacute onset keeps the emergency badge. Tested on a cause whose
  // AUTHORED plan urgency is routine, so the assertion can only pass because of B16.
  const vl = byId("left_thalamus_vl");
  ok("precondition: the thalamic infarct plan is authored below emergency",
     pathologyNextStepsFor(vl, "Thalamic infarct or haemorrhage").urgency !== "emergency");
  ok("a selected vascular cause at hyperacute onset is EMERGENCY (B16)",
     pathologyNextStepsFor(vl, "Thalamic infarct or haemorrhage", { onset: "hyperacute" }).urgency === "emergency");
  // …but only a vascular cause that can BE hyperacute: post-stroke pain is vascular and chronic.
  const vpl = byId("left_subcortex_thalamus");
  ok("a chronic vascular cause (post-stroke pain) is NOT escalated by a hyperacute onset",
     pathologyNextStepsFor(vpl, "Déjerine-Roussy (central post-stroke pain)", { onset: "hyperacute" }).urgency
       === pathologyNextStepsFor(vpl, "Déjerine-Roussy (central post-stroke pain)").urgency);
  ok("a selected NON-vascular cause keeps its authored urgency",
     pathologyNextStepsFor(ic, "Demyelinating plaque", { onset: "hyperacute" }).urgency === pathologyNextStepsFor(ic, "Demyelinating plaque").urgency);
  ok("combinedNextSteps threads the onset", combinedNextSteps([ic, byId("left_root_l5")], null, { onset: "hyperacute" }).urgency === "emergency");
}

// ---- follow-ups (2026-09-26, the round's open items) ----
{
  const cs = candidateSites(); const byId = id => cs.find(s => s.id === id);
  const e = id => expectedFindings(byId(id), { dominantSide: "left" });
  // Ptosis is the commonest presenting sign of myasthenia; without it, plain ptosis never listed MG.
  ok("myasthenia predicts ptosis on either side", e("motor_unit_nmj_postsynaptic").has("ptosis@left") && e("motor_unit_nmj_postsynaptic").has("ptosis@right"));
  const ids = toks => differential(new Set(toks), { dominantSide: "left" }).map(c => c.site.id);
  ok("one-sided ptosis alone lists myasthenia", ids(["ptosis@left"]).includes("motor_unit_nmj_postsynaptic"));
  ok("fatigable ptosis + ptosis on one side → myasthenia first, one lesion",
     (() => { const r = solve(new Set(["fatigable_ocular@left", "ptosis@left"]), { dominantSide: "left" });
              return r.display[0]?.site.id === "motor_unit_nmj_postsynaptic" && r.multi === null; })());
}

// ---- every site's own complete picture localises back to it (true on 2026-09-25; now pinned) ----
{
  const missing = [];
  for (const s of candidateSites()) {
    let E; try { E = expectedFindings(s, { dominantSide: "left" }); } catch { continue; }
    if (!E.size) continue; // non-dominant mirrors of dominant-only cortex predict nothing, by design
    if (!solve(E, { dominantSide: "left" }).explainAll.some(c => c.site.id === s.id)) missing.push(s.id);
  }
  ok("every non-empty site's complete picture is explained by that site", missing.length === 0, missing.join(", "));
}

console.log(`\naccuracy mechanisms: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

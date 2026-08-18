// fundus.test.js — the FUNDOSCOPY + ACUITY findings (2026-08-11).
//
// Five findings a clinician actually records at the bedside, each modelled to behave the way the sign
// behaves clinically rather than the way a localiser would find convenient:
//
//   papilloedema                 raised INTRACRANIAL pressure. Not a location — anything intracranial that
//                                blocks CSF, swells or exerts mass causes it. So it is emitted at EVERY
//                                intra-axial intracranial site: it narrows to "intracranial" and rules out
//                                cord / root / plexus / nerve / motor unit, which is exactly its bedside value.
//   optic_atrophy                a PALE DISC — established optic nerve damage. Ipsilateral, at the optic nerve.
//   retinal_pallor               the whitened retina of a RETINAL ARTERY OCCLUSION. Ipsilateral, at the retina.
//   va_reduced_no_pinhole        acuity that does NOT correct with a pinhole — organic (media/retina/nerve).
//   va_reduced_pinhole_corrects  acuity that DOES correct — REFRACTIVE. Produced by no structure at all, so it
//                                localises nowhere and instead raises a flag, exactly like the functional signs.
//
// Run: node test/fundus.test.js
import { FINDINGS, CROSSES, NON_LATERALISED } from "../src/model/findings.js";
import { STRUCTURES } from "../src/model/structures.js";
import { expectedFindings } from "../src/engine/forward.js";
import { candidateSites, differential, raisedPressureAxis, INTRACRANIAL_LEVELS } from "../src/engine/inverse.js";
import { refractiveFlag } from "../src/engine/patterns.js";
import { causesFor } from "../src/data/causes.js";
import { nextStepsFor } from "../src/data/nextSteps.js";

let pass = 0, fail = 0;
const ok = (l, c, d = "") => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l + (!c && d ? `  [${d}]` : "")); };

const NEW = ["papilloedema", "optic_atrophy", "retinal_pallor", "va_reduced_no_pinhole", "va_reduced_pinhole_corrects"];
const producedBy = f => STRUCTURES.filter(s => s.produces === f);
const sites = candidateSites();
const siteById = id => sites.find(s => s.id === id);
const expects = (site, f) => site && [...expectedFindings(site)].some(t => t.startsWith(f + "@"));

// --- 1: vocabulary ---
for (const f of NEW) ok(`finding \`${f}\` exists with a description`, !!(FINDINGS[f] && FINDINGS[f].desc));
ok("papilloedema is NON_LATERALISED (raised ICP is not a side)", NON_LATERALISED.has("papilloedema"));
ok("pinhole-corrects acuity is NON_LATERALISED", NON_LATERALISED.has("va_reduced_pinhole_corrects"));
ok("optic atrophy is ipsilateral", CROSSES.optic_atrophy === false);
ok("retinal pallor is ipsilateral", CROSSES.retinal_pallor === false);
ok("non-correcting acuity loss is ipsilateral", CROSSES.va_reduced_no_pinhole === false);

// --- 2: papilloedema is an ORTHOGONAL COMPARTMENT AXIS, not a site's finding ---
// It says INSIDE THE SKULL, not where. Modelling it per-site would claim it as part of every cortical
// syndrome and would penalise every intracranial site for over-prediction whenever it is absent.
{
  ok("papilloedema is produced by NO structure — it is not part of any site's syndrome",
     producedBy("papilloedema").length === 0);
  ok("papilloedema is not in any site's expected findings", !expects(siteById("left_cortex_mca"), "papilloedema"));

  const axis = raisedPressureAxis(new Set(["papilloedema@none"]));
  ok("raisedPressureAxis fires on papilloedema", axis.present === true);
  ok("the axis explains that it means raised pressure, not a place", /raised intracranial pressure/i.test(axis.note));
  ok("the axis warns about lumbar puncture", /lumbar puncture/i.test(axis.note));
  ok("the axis is silent without papilloedema", raisedPressureAxis(new Set(["weak_arm@left"])).present === false);

  // it NARROWS to the intracranial compartment
  const withOut = differential(new Set(["weak_arm@left", "weak_leg@left"]));
  const withPap = differential(new Set(["weak_arm@left", "weak_leg@left", "papilloedema@none"]));
  ok("adding papilloedema narrows the differential", withPap.length < withOut.length,
     `${withOut.length} -> ${withPap.length}`);
  ok("every remaining candidate is intracranial", withPap.every(c => INTRACRANIAL_LEVELS.has(c.site.level)));
  ok("the cord is excluded once papilloedema is present", !withPap.some(c => c.site.level === "cord"));
  ok("intracranial candidates survive", withPap.length > 0);
  // …and it does NOT reorder the sites that remain — an orthogonal axis annotates, it does not re-rank
  const orderWithout = withOut.filter(c => INTRACRANIAL_LEVELS.has(c.site.level)).map(c => c.site.id);
  ok("the surviving order is unchanged (the axis annotates, it does not re-rank)",
     JSON.stringify(withPap.map(c => c.site.id)) === JSON.stringify(orderWithout));

  // papilloedema ALONE still returns the whole intracranial compartment rather than collapsing to nothing
  const alone = differential(new Set(["papilloedema@none"]));
  ok("papilloedema alone returns the intracranial compartment", alone.length > 20);
  ok("papilloedema alone excludes the periphery", alone.every(c => INTRACRANIAL_LEVELS.has(c.site.level)));
}

// --- 3: the optic disc and the retina are different places ---
{
  const optic = ["left_skull_base_optic_canal", "left_skull_base_optic_neuritis", "left_skull_base_optic_aion"];
  for (const id of optic) {
    const s = siteById(id);
    ok(`optic atrophy is expected at the optic nerve (${id})`, expects(s, "optic_atrophy"), s ? "" : "site not found");
  }
  const retina = siteById("left_visual_pathway_retina");
  ok("a retinal site exists", !!retina);
  ok("retinal pallor is expected at the retina", expects(retina, "retinal_pallor"));
  ok("retinal pallor is NOT expected at the optic nerve", !expects(siteById("left_skull_base_optic_canal"), "retinal_pallor"));
  ok("optic atrophy is NOT expected at the retina", !expects(retina, "optic_atrophy"));
}

// --- 4: the pinhole is the discriminator ---
{
  ok("non-correcting acuity loss is produced at the optic nerve and retina", producedBy("va_reduced_no_pinhole").length >= 3);
  ok("PINHOLE-CORRECTING acuity loss is produced by NO structure — it localises nowhere",
     producedBy("va_reduced_pinhole_corrects").length === 0);

  const flag = refractiveFlag(new Set(["va_reduced_pinhole_corrects@left"]));
  ok("refractiveFlag fires on pinhole-correcting acuity loss", flag.refractive === true);
  ok("refractiveFlag explains itself", typeof flag.note === "string" && /pinhole|refractive/i.test(flag.note));

  // safety: if the acuity ALSO fails to correct, or any organic visual sign is present, do not call it refractive
  const both = refractiveFlag(new Set(["va_reduced_pinhole_corrects@left", "rapd@left"]));
  ok("refractiveFlag is SUPPRESSED by an organic visual sign (RAPD)", both.refractive === false && both.suppressed === true);
  ok("refractiveFlag is silent when there is no pinhole finding", refractiveFlag(new Set(["weak_arm@left"])).refractive === false);
}

// --- 5: the new retinal site carries curated causes and a workup, like every other site ---
{
  const retina = siteById("left_visual_pathway_retina");
  if (retina) {
    const c = causesFor(retina, {});
    ok("the retina has curated causes", c.source === "curated");
    ok("the retina clears the >=6 depth bar", c.all.length >= 6, `${c.all.length}`);
    ok("every retinal cause has a discriminating feature", c.all.every(x => x.feature && x.feature.length));
    ok("the retina names a must-not-miss", c.all.some(x => x.red));
    ok("giant cell arteritis is on the retinal differential", c.all.some(x => /giant.cell|arteriti/i.test(x.name)));
    const n = nextStepsFor(retina);
    ok("the retina has a curated workup", n.curated === true);
    ok("the retinal workup names the time-critical nature of a retinal artery occlusion",
       [...n.immediate, ...n.investigations].some(x => /minutes|hours|emergency|time-critical|stroke/i.test(x)));
    ok("the retina prompts fundal photography / OCT",
       [...n.investigations, ...n.confirmatory, ...n.monitoring, ...n.immediate].some(x => /fundal photograph|OCT/i.test(x)));
  }
}

// --- 6: the acuity findings pull the fundal-imaging prompt through ---
{
  const optic = nextStepsFor(siteById("left_skull_base_optic_neuritis"));
  const all = [...optic.immediate, ...optic.investigations, ...optic.confirmatory, ...optic.monitoring];
  ok("an optic-nerve site prompts fundal photography / OCT", all.some(x => /fundal photograph|OCT/i.test(x)));
}

// --- the ophthalmic prompt must respect the CHIASM (fix 2026-08-18) ---
//
// `ophthalmicImaging()` fired on ANY field-defect token in a site's expectedFindings, which lumped
// retro-chiasmal defects in with anterior ones. Fundal photography and OCT of the retinal nerve fibre
// layer are ANTERIOR-pathway tests: they measure the disc and the retinal ganglion cell axons.
//
//   * ANTERIOR to / AT the geniculate — retina, optic nerve, chiasm, optic TRACT, LGN — the retinal
//     ganglion cell axon is itself damaged, so disc pallor and RNFL thinning are real and gradeable
//     (band atrophy after a tract lesion is the classic example). The prompt belongs here.
//   * POST-geniculate — optic radiation, occipital, parietal, temporal, and the MCA/PCA territories —
//     the axons measured by OCT are not in the lesion at all. The discs are normal. Retrograde
//     trans-synaptic degeneration exists but is a research finding, not a work-up step.
//
// Reported symptom: entering LEG WEAKNESS surfaced fundal photography, because MCA and anterior
// choroidal are candidate sites for weak_leg and both PREDICT a field defect the patient was never
// reported to have.
{
  const nsFor = id => {
    const s = sites.find(x => x.id === id);
    if (!s) return null;
    const n = nextStepsFor(s);
    return [...n.immediate, ...n.investigations, ...n.confirmatory, ...n.monitoring];
  };
  const prompts = id => { const a = nsFor(id); return a === null ? null : a.some(x => /fundal photograph|OCT/i.test(x)); };

  // POST-geniculate: must NOT prompt
  for (const id of ["left_subcortex_optic_radiation", "left_cortex_occipital", "left_cortex_parietal",
                    "left_cortex_temporal", "left_cortex_mca", "left_cortex_pca", "left_cortex_mca_inferior",
                    "left_subcortex_anterior_choroidal"]) {
    const p = prompts(id);
    ok(`post-geniculate \`${id}\` does NOT prompt fundal photography / OCT`, p === false,
       p === null ? "site not found" : "still prompting");
  }

  // AT or ANTERIOR to the geniculate: must STILL prompt
  for (const id of ["left_visual_pathway_optic_tract", "left_visual_pathway_lgn"]) {
    const p = prompts(id);
    ok(`pre-/at-geniculate \`${id}\` still prompts (band atrophy is real here)`, p === true,
       p === null ? "site not found" : "no longer prompting");
  }

  // The raised-PRESSURE route is untouched by this fix — a parasagittal site whose causes include
  // superior sagittal sinus thrombosis must keep prompting, because papilloedema IS a disc finding.
  {
    const p = prompts("left_cortex_motor_leg");
    ok("the raised-pressure route is unaffected (parasagittal site still prompts)", p === true,
       p === null ? "site not found" : "pressure route broken");
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

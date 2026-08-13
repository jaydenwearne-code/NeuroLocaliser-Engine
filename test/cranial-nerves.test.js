// cranial-nerves.test.js — the extra-axial cranial nerves at the skull base, on TWO axes.
// (1) FORAMINA-AS-SITES: nerves threading the same canal fail together, so the multi-nerve syndromes
//     (cavernous, Vernet, Gradenigo, acoustic) EMERGE from composeSkullBaseSites unioning per-nerve parts.
// (2) LONGITUDINAL COURSE: each nerve is a chain of (nerve, compartment) primitive parts; a proximal
//     segment produces MORE findings, so a spared branch localises distally by the over-prediction penalty
//     (the nerve-segments mechanism, now cranial). Every finding is ipsilateral — NO new solver mechanism.
// Run: node test/cranial-nerves.test.js
import { FINDINGS, CROSSES, NON_LATERALISED, isFinding } from "../src/model/findings.js";
import { LOCALISING } from "../src/engine/score.js";
import { STRUCTURES, STRUCTURE_BY_ID } from "../src/model/structures.js";
import { SITE_BY_ID, composeSkullBaseSites } from "../src/model/sites.js";
import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }

// shared solve helpers: examiner records findings on a body side; tokens are `finding@side`.
const S  = (...ids) => new Set(ids.map(id => id + "@left"));
const SR = (...ids) => new Set(ids.map(id => id + "@right"));
// raw ductions the retired ocular clusters decompose into (a full nerve palsy = its ductions)
const III = ["ptosis","weak_adduction","weak_elevation","weak_depression"]; // CN III trunk
const IV  = ["weak_depression","vertical_diplopia"];                        // CN IV
const VI  = ["weak_abduction"];                                            // CN VI
const winId   = set => solve(set).best?.site?.id ?? null;
const winPart = set => solve(set).best?.site?.part ?? null;
const winLevel = set => solve(set).best?.site?.level ?? null;
const nameOf  = set => { const b = solve(set).best; if (!b) return ""; const e = nameForSite(b.site); return (e.name || "") + " " + (e.note || ""); };

// --- Task 1: vocabulary (13 new findings; cn11_weakness retired) ---
const NEW_CN = ["lacrimation_loss","hyperacusis","taste_loss","facial_weak_branch","v3_sensory",
  "gag_afferent_loss","taste_posterior","palatal_weakness","vocal_cord_palsy",
  "weak_scm","weak_trapezius"];
for (const id of NEW_CN) {
  ok(`finding ${id} exists`, isFinding(id));
  ok(`${id} is ipsilateral (CROSSES false)`, CROSSES[id] === false);
  ok(`${id} is NOT non-lateralised`, !NON_LATERALISED.has(id));
  ok(`${id} IS localising`, LOCALISING.has(id));
}
ok("cn11_weakness finding is retired", !isFinding("cn11_weakness"));
ok("cn11_weakness removed from LOCALISING", !LOCALISING.has("cn11_weakness"));
ok("ocular ductions exist (CN III/IV/VI decomposed)",
   ["ptosis","weak_adduction","weak_abduction","weak_elevation","weak_depression","vertical_diplopia"].every(isFinding));

// --- Task 2: per-nerve structure catalogue ---
const baseOf = part => STRUCTURES.filter(s => s.level === "skull_base" && s.part === part).map(s => s.produces).sort();
const eq = (a, b) => JSON.stringify([...(a || [])].sort()) === JSON.stringify([...(b || [])].sort());

// facial nerve chain — proximal produces MORE, each distal spares one branch
ok("iam -> VII triad + motor + VIII hearing",
   eq(baseOf("iam"), ["facial_weakness","lacrimation_loss","hyperacusis","taste_loss","hearing_loss"]));
ok("vii_geniculate -> motor + lacrimation + hyperacusis + taste",
   eq(baseOf("vii_geniculate"), ["facial_weakness","lacrimation_loss","hyperacusis","taste_loss"]));
ok("vii_tympanic -> motor + hyperacusis + taste (lacrimation SPARED)",
   eq(baseOf("vii_tympanic"), ["facial_weakness","hyperacusis","taste_loss"]));
ok("vii_mastoid -> motor + taste (hyperacusis SPARED)",
   eq(baseOf("vii_mastoid"), ["facial_weakness","taste_loss"]));
ok("vii_stylomastoid -> motor only (taste SPARED)", eq(baseOf("vii_stylomastoid"), ["facial_weakness"]));
ok("vii_parotid -> single branch", eq(baseOf("vii_parotid"), ["facial_weak_branch"]));

// trigeminal divisions
ok("v_ganglion -> V1+V2+V3+jaw", eq(baseOf("v_ganglion"), ["v1_sensory","v2_sensory","v3_sensory","jaw_weakness"]));
ok("v1_division -> V1", eq(baseOf("v1_division"), ["v1_sensory"]));
ok("foramen_rotundum -> V2", eq(baseOf("foramen_rotundum"), ["v2_sensory"]));
ok("v3_ovale -> V3 + jaw", eq(baseOf("v3_ovale"), ["v3_sensory","jaw_weakness"]));
ok("v1_petrous -> V1", eq(baseOf("v1_petrous"), ["v1_sensory"]));

// III divisions + trunk (CN III palsy EMERGES from the four ductions + lid)
ok("iii_trunk -> four ductions + ptosis", eq(baseOf("iii_trunk"), ["ptosis","weak_adduction","weak_elevation","weak_depression"]));
ok("iii_orbit_sup -> superior division (ptosis + elevation)", eq(baseOf("iii_orbit_sup"), ["ptosis","weak_elevation"]));
ok("iii_orbit_inf -> inferior division (adduction + depression + pupil)", eq(baseOf("iii_orbit_inf"), ["weak_adduction","weak_depression","fixed_dilated_pupil"]));

// IV / VI segments
ok("iv_trunk -> CN IV (depression + vertical diplopia)", eq(baseOf("iv_trunk"), ["weak_depression","vertical_diplopia"]));
ok("trochlear_cisternal -> CN IV (depression + vertical diplopia)", eq(baseOf("trochlear_cisternal"), ["weak_depression","vertical_diplopia"]));
ok("vi_cisternal -> abduction", eq(baseOf("vi_cisternal"), ["weak_abduction"]));
ok("vi_petrous_apex -> abduction", eq(baseOf("vi_petrous_apex"), ["weak_abduction"]));
ok("vi_trunk -> abduction", eq(baseOf("vi_trunk"), ["weak_abduction"]));

// lower cranial nerves — IX/X split, X distal chain, XI split, XII
ok("ix_jugular -> gag afferent + posterior taste", eq(baseOf("ix_jugular"), ["gag_afferent_loss","taste_posterior"]));
ok("x_jugular -> palate + cords", eq(baseOf("x_jugular"), ["palatal_weakness","vocal_cord_palsy"]));
ok("x_recurrent_laryngeal -> cords only (palate SPARED)", eq(baseOf("x_recurrent_laryngeal"), ["vocal_cord_palsy"]));
ok("xi_jugular -> SCM + trapezius", eq(baseOf("xi_jugular"), ["weak_scm","weak_trapezius"]));
ok("xi_posterior_triangle -> trapezius only (SCM SPARED)", eq(baseOf("xi_posterior_triangle"), ["weak_trapezius"]));
ok("hypoglossal_canal -> XII", eq(baseOf("hypoglossal_canal"), ["cn12_palsy"]));
ok("xii_neck -> XII", eq(baseOf("xii_neck"), ["cn12_palsy"]));
ok("cpa -> VII + hearing + V1 + ataxia", eq(baseOf("cpa"), ["facial_weakness","hearing_loss","v1_sensory","limb_ataxia"]));
// the optic canal now also carries the FUNDOSCOPY + ACUITY companions (2026-08-11): a pale disc once the
// damage is established, and acuity loss that does NOT correct with a pinhole (i.e. organic)
ok("optic_canal -> optic + RAPD + disc pallor + non-correcting acuity",
   eq(baseOf("optic_canal"), ["optic_neuropathy","rapd","optic_atrophy","va_reduced_no_pinhole"]));
ok("carotid_space -> Horner", eq(baseOf("carotid_space"), ["miosis","ptosis"]));

// hygiene: no crosses override, no gate, all ipsilateral, cn11_weakness has no producer
{
  const base = STRUCTURES.filter(s => s.level === "skull_base");
  // facial_weakness defaults to contralateral (UMN corticobulbar); the peripheral VII structures are LMN,
  // so they legitimately override crosses:false (ipsilateral). Every OTHER skull-base finding is ipsilateral
  // by its finding-level default, so needs no override.
  ok("no skull_base crosses override (except LMN facial_weakness → ipsilateral)",
     base.every(s => !Object.prototype.hasOwnProperty.call(s, "crosses") || s.produces === "facial_weakness"));
  ok("no skull_base gate", base.every(s => !s.hemisphere && !s.bilateralOnly));
  ok("cn11_weakness has no producer", !STRUCTURES.some(s => s.produces === "cn11_weakness"));
}

// --- Task 3: primitive sites + composites ---
for (const p of ["iii_orbit_sup","iii_orbit_inf","vi_cisternal","vi_petrous_apex",
  "v_ganglion","v1_division","v3_ovale","v1_petrous","vii_geniculate","vii_tympanic","vii_mastoid",
  "vii_stylomastoid","vii_parotid","iam","ix_jugular","x_jugular","x_recurrent_laryngeal","xi_jugular",
  "xi_posterior_triangle","xii_neck"])
  ok(`left_skull_base_${p} primitive site exists`, !!SITE_BY_ID[`left_skull_base_${p}`]);
// the pre-divisional trunks are COMPOSITE-ONLY (no standalone site) so they don't steal isolated palsies
for (const p of ["iii_trunk","iv_trunk","vi_trunk","orbital_sympathetic"])
  ok(`no standalone ${p} site (composite-only)`, !SITE_BY_ID[`left_skull_base_${p}`]);

const comp = composeSkullBaseSites();
const compFindings = (part, side = "left") => {
  const s = comp.find(x => x.part === part && x.side === side);
  // dedupe: III and IV both emit weak_depression, so compare the SET of findings a compartment produces
  return s ? [...new Set(s.structures.map(id => STRUCTURE_BY_ID[id].produces))] : null;
};
const OCULAR = [...new Set([...III, ...IV, ...VI])]; // ptosis,add,elev,depr,vertical_diplopia,abduction
ok("SOF composite = III+IV+VI+V1+Horner (no V2)",
   eq(compFindings("sup_orbital_fissure"), [...OCULAR,"v1_sensory","miosis"]));
ok("cavernous composite ADDS V2",
   eq(compFindings("cavernous_sinus"), [...OCULAR,"v1_sensory","v2_sensory","miosis"]));
ok("orbital apex ADDS optic (+RAPD, disc pallor, non-correcting acuity)",
   eq(compFindings("orbital_apex"), [...OCULAR,"v1_sensory","miosis","optic_neuropathy","rapd","optic_atrophy","va_reduced_no_pinhole"]));
ok("petrous apex = VI + V1 (Gradenigo)", eq(compFindings("petrous_apex"), ["weak_abduction","v1_sensory"]));
ok("jugular (Vernet) = IX gag/taste + X palate/cords + XI scm/trap",
   eq(compFindings("jugular_foramen"),
      ["gag_afferent_loss","taste_posterior","palatal_weakness","vocal_cord_palsy","weak_scm","weak_trapezius"]));
ok("collet-sicard ADDS XII",
   eq(compFindings("collet_sicard"),
      ["gag_afferent_loss","taste_posterior","palatal_weakness","vocal_cord_palsy","weak_scm","weak_trapezius","cn12_palsy"]));
ok("villaret ADDS Horner",
   eq(compFindings("villaret"),
      ["gag_afferent_loss","taste_posterior","palatal_weakness","vocal_cord_palsy","weak_scm","weak_trapezius","cn12_palsy","miosis","ptosis"]));

// --- Task 4: VII facial-nerve chain (branch sparing localises) ---
ok("VII triad + hearing loss -> IAM (early acoustic)",
   winId(S("facial_weakness","lacrimation_loss","hyperacusis","taste_loss","hearing_loss")) === "left_skull_base_iam");
// the IAM->CPA discriminator is the ADDED trigeminal (corneal) + cerebellar ataxia, not the VII branch
// triad; the classic large-CPA-mass picture is motor facial palsy + hearing + corneal + ataxia.
ok("facial palsy + hearing + corneal + ataxia -> CPA (large mass)",
   winId(S("facial_weakness","hearing_loss","v1_sensory","limb_ataxia")) === "left_skull_base_cpa");
ok("VII triad, hearing INTACT -> geniculate (Ramsay Hunt)",
   winId(S("facial_weakness","lacrimation_loss","hyperacusis","taste_loss")) === "left_skull_base_vii_geniculate");
ok("motor + hyperacusis + taste (lacrimation intact) -> tympanic",
   winId(S("facial_weakness","hyperacusis","taste_loss")) === "left_skull_base_vii_tympanic");
ok("motor + taste (hyperacusis intact) -> mastoid",
   winId(S("facial_weakness","taste_loss")) === "left_skull_base_vii_mastoid");
ok("motor only -> stylomastoid (Bell's)",
   winId(S("facial_weakness")) === "left_skull_base_vii_stylomastoid");
ok("single branch -> parotid",
   winId(S("facial_weak_branch")) === "left_skull_base_vii_parotid");
ok("geniculate names Ramsay Hunt", /ramsay hunt/i.test(nameOf(S("facial_weakness","lacrimation_loss","hyperacusis","taste_loss"))));
ok("stylomastoid names Bell's", /bell/i.test(nameOf(S("facial_weakness"))));

// --- Task 5: V divisions, III divisions, VI petrous apex ---
ok("isolated V3 (chin) -> foramen ovale (V3)",
   winId(S("v3_sensory","jaw_weakness")) === "left_skull_base_v3_ovale");
ok("isolated V1 -> a V1 site (division or petrous)",
   ["left_skull_base_v1_division","left_skull_base_v1_petrous"].includes(winId(S("v1_sensory"))));
ok("isolated V2 -> foramen rotundum", winId(S("v2_sensory")) === "left_skull_base_foramen_rotundum");
ok("all three divisions + jaw -> Gasserian ganglion",
   winId(S("v1_sensory","v2_sensory","v3_sensory","jaw_weakness")) === "left_skull_base_v_ganglion");
ok("III superior division (ptosis + elevation) -> iii_orbit_sup",
   winId(S("ptosis","weak_elevation")) === "left_skull_base_iii_orbit_sup");
ok("III inferior division (adduction + depression + pupil) -> iii_orbit_inf",
   winId(S("weak_adduction","weak_depression","fixed_dilated_pupil")) === "left_skull_base_iii_orbit_inf");
ok("VI + V1 (+ intact V2/V3) -> petrous apex (Gradenigo)",
   winPart(S("weak_abduction","v1_sensory")) === "petrous_apex");
ok("Gradenigo phonebook names it", /gradenigo/i.test(nameOf(S("weak_abduction","v1_sensory"))));

// --- Task 6: lower cranial nerves (IX/X split, X distal, XI split, XII) ---
ok("hoarseness with palate SPARED -> recurrent laryngeal",
   winId(S("vocal_cord_palsy")) === "left_skull_base_x_recurrent_laryngeal");
ok("hoarseness + palatal droop -> high vagus (x_jugular)",
   winId(S("vocal_cord_palsy","palatal_weakness")) === "left_skull_base_x_jugular");
ok("absent gag + posterior taste, palate INTACT -> IX (glossopharyngeal)",
   winId(S("gag_afferent_loss","taste_posterior")) === "left_skull_base_ix_jugular");
ok("palatal droop + hoarseness, taste/sensation INTACT -> X (not IX)",
   winId(S("palatal_weakness","vocal_cord_palsy")) === "left_skull_base_x_jugular");
ok("trapezius only (SCM spared) -> posterior triangle",
   winId(S("weak_trapezius")) === "left_skull_base_xi_posterior_triangle");
ok("SCM + trapezius (isolated) -> XI at jugular",
   winId(S("weak_scm","weak_trapezius")) === "left_skull_base_xi_jugular");
ok("isolated tongue -> XII neck or canal",
   /xii_neck|hypoglossal_canal/.test(winId(S("cn12_palsy"))));
ok("IX + X + XI together -> jugular foramen (Vernet)",
   winPart(S("gag_afferent_loss","taste_posterior","palatal_weakness","vocal_cord_palsy","weak_scm","weak_trapezius")) === "jugular_foramen");
ok("... adding XII -> Collet-Sicard",
   winPart(S("gag_afferent_loss","taste_posterior","palatal_weakness","vocal_cord_palsy","weak_scm","weak_trapezius","cn12_palsy")) === "collet_sicard");
ok("... adding Horner -> Villaret",
   winPart(S("gag_afferent_loss","taste_posterior","palatal_weakness","vocal_cord_palsy","weak_scm","weak_trapezius","cn12_palsy","miosis","ptosis")) === "villaret");

// --- Task 7: compartment syndromes still emerge; laterality mirrors; nuclear vs peripheral ---
ok("SOF picture (no V2) -> superior orbital fissure",
   winPart(S(...OCULAR,"v1_sensory","miosis")) === "sup_orbital_fissure");
ok("adding V2 -> cavernous sinus",
   winPart(S(...OCULAR,"v1_sensory","v2_sensory","miosis")) === "cavernous_sinus");
ok("adding optic -> orbital apex",
   winPart(S(...OCULAR,"v1_sensory","optic_neuropathy","rapd","miosis")) === "orbital_apex");
ok("right-sided VII chain mirrors -> right geniculate",
   winId(SR("facial_weakness","lacrimation_loss","hyperacusis","taste_loss")) === "right_skull_base_vii_geniculate");
ok("right IAM mirrors",
   winId(SR("facial_weakness","lacrimation_loss","hyperacusis","taste_loss","hearing_loss")) === "right_skull_base_iam");
// nuclear vs peripheral: the crossed Weber triad pins the midbrain; the full ipsilateral orbito-cavernous
// picture pins the skull base — the same cn3 sign localises by the company it keeps.
ok("crossed Weber (cn3 + contra hemiparesis + contra facial UMN) -> a midbrain (nuclear) site",
   winLevel(new Set(["ptosis@left","weak_adduction@left","weak_elevation@left","weak_depression@left","weak_arm@right","weak_leg@right","facial_weakness@right","forehead_spared@right"])) === "midbrain");
ok("full ipsilateral orbito-cavernous picture -> a skull_base site",
   winLevel(S(...OCULAR,"v1_sensory","v2_sensory","miosis")) === "skull_base");

// --- Task 8: phonebook (keyed by emergent site) ---
ok("cavernous names the cavernous sinus", /cavernous/i.test(nameOf(S(...OCULAR,"v1_sensory","v2_sensory","miosis"))));
ok("orbital apex names the apex", /apex/i.test(nameOf(S(...OCULAR,"v1_sensory","optic_neuropathy","rapd","miosis"))));
ok("jugular foramen names Vernet", /vernet|jugular/i.test(nameOf(S("gag_afferent_loss","taste_posterior","palatal_weakness","vocal_cord_palsy","weak_scm","weak_trapezius"))));
ok("recurrent laryngeal is named", /recurrent laryngeal|hoarse/i.test(nameOf(S("vocal_cord_palsy"))));

// ---- report ----
console.log("\nNeuroLocaliser — CRANIAL NERVES / SKULL BASE (peripheral course) tests\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);

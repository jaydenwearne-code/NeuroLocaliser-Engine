// raw-observations.test.js — acceptance tests for the raw-observations refactor.
// The clusters (CN III/IV/VI, bulbar, facial UMN/LMN, Horner, parkinsonism, Gerstmann, Balint)
// are RETIRED as findings; each must now EMERGE from raw primitives co-occurring at a site.
import { solve } from "../src/engine/inverse.js";
import { isFinding } from "../src/model/findings.js";
import { expectedFindings } from "../src/engine/forward.js";
import { composeVascularCortexSites } from "../src/model/sites.js";

let pass = 0, fail = 0;
const ok = (label, cond) => { if (cond) { pass++; console.log("PASS  " + label); }
  else { fail++; console.log("FAIL  " + label); } };
const S = (...toks) => new Set(toks);
const win = set => solve(set).best?.site ?? null;

// ---------------------------------------------------------------------------
// B1 — ocular motility (CN III / IV / VI, divisions; ino kept as a compound sign)
// ---------------------------------------------------------------------------
{ const s = win(S("ptosis@left","weak_adduction@left","weak_elevation@left","weak_depression@left"));
  ok("ptosis+add+elev+depr -> CN III (oculomotor) site",
     !!s && (String(s.part).startsWith("iii_") || s.part === "cn3_fascicle" || String(s.part).startsWith("cn3_"))); }

{ const s = win(S("weak_abduction@left"));
  ok("isolated abduction weakness -> CN VI site",
     !!s && (String(s.part).startsWith("vi_") || s.part === "cn6_nucleus")); }

{ const s = win(S("weak_depression@left","vertical_diplopia@left"));
  ok("depression + vertical diplopia -> CN IV site",
     !!s && (String(s.part).startsWith("iv_") || s.part === "trochlear_cisternal" || s.part === "trochlear")); }

{ const s = win(S("ptosis@left","weak_elevation@left"));
  ok("ptosis + elevation only -> III superior division", s?.part === "iii_orbit_sup"); }

{ const s = win(S("weak_adduction@left","weak_depression@left","fixed_dilated_pupil@left"));
  ok("adduction+depression+pupil -> III inferior division", s?.part === "iii_orbit_inf"); }

// ---------------------------------------------------------------------------
// B2 — bulbar (cn_bulbar retired → dysphagia + reused palatal/vocal signs)
// ---------------------------------------------------------------------------
{ const s = win(S("palatal_weakness@left","vocal_cord_palsy@left","dysphagia@left"));
  ok("palatal+vocal+dysphagia -> nucleus ambiguus (lateral medulla)",
     s?.level === "medulla" && s?.part === "lateral"); }

// ---------------------------------------------------------------------------
// B3 — facial weakness (cn7_lmn / facial_weak_umn retired → facial_weakness + forehead_spared)
// ---------------------------------------------------------------------------
{ const s = win(S("facial_weakness@left")); // LMN, whole hemiface, forehead NOT spared
  ok("facial weakness alone -> peripheral CN VII (LMN) site",
     !!s && (s.level === "skull_base" || String(s.part).startsWith("vii"))); }
{ const r = solve(S("facial_weakness@right","forehead_spared@right","weak_arm@right"));
  ok("facial weakness + forehead spared + arm -> UMN (cortical/capsular), forehead_spared explained",
     !!r.best && r.best.matched?.some(m => m.startsWith("forehead_spared"))); }

// ---------------------------------------------------------------------------
// B4a — Horner (horner retired → miosis + shared ptosis, + existing anhidrosis)
// ---------------------------------------------------------------------------
{ const s = win(S("miosis@left","ptosis@left","anhidrosis_face@left","anhidrosis_body@left"));
  ok("miosis+ptosis+anhidrosis(face+body) -> central (1st-order) Horner, lateral medulla",
     s?.level === "medulla" && s?.part === "lateral"); }

// ---------------------------------------------------------------------------
// B4b — parkinsonism (retired → bradykinesia + rest_tremor + reused rigidity)
// ---------------------------------------------------------------------------
{ const s = win(S("bradykinesia@left","rest_tremor@left","rigidity@left"));
  ok("bradykinesia+rest_tremor+rigidity -> substantia nigra (contralateral hemiparkinsonism)",
     s?.level === "basal_ganglia" && s?.part === "substantia_nigra"); }

// ---------------------------------------------------------------------------
// B4c — Gerstmann (retired → agraphia + acalculia + finger_agnosia + left_right_disorientation)
// ---------------------------------------------------------------------------
{ const s = win(S("agraphia@none","acalculia@none","finger_agnosia@none","left_right_disorientation@none"));
  ok("Gerstmann tetrad -> dominant angular/supramarginal (parietal)",
     s?.level === "cortex" && s?.part === "parietal"); }

// ---------------------------------------------------------------------------
// B4d — Balint (retired → optic_ataxia + oculomotor_apraxia + simultanagnosia; bilateral)
// ---------------------------------------------------------------------------
{ const b = solve(S("optic_ataxia@none","oculomotor_apraxia@none","simultanagnosia@none")).best;
  ok("Balint triad -> bilateral parieto-occipital site",
     !!b && /balint|parietal|occipital/i.test(b.site.id + b.site.part)); }

// ---------------------------------------------------------------------------
// B5 — hemiparesis decomposed into raw weak_arm + weak_leg; total-MCA gains the deep (capsular) territory
// so a classic total-MCA infarct explains a full hemiparesis + hemisensory loss + neglect (one lesion).
// ---------------------------------------------------------------------------
ok("hemiparesis is retired (decomposed into weak_arm + weak_leg)", !isFinding("hemiparesis"));
ok("weak_arm + weak_leg exist", isFinding("weak_arm") && isFinding("weak_leg"));

{ // the user's scenario: right-hemisphere total-MCA stroke -> LEFT hemiparesis + neglect + hemisensory loss
  const mca = composeVascularCortexSites().find(s => s.id === "right_cortex_mca");
  const exp = expectedFindings(mca, { dominantSide: "left" });
  const need = ["weak_arm@left","weak_leg@left","facial_weakness@left","neglect@left","cortical_sensory_arm@left"];
  ok("total right MCA explains hemiparesis(arm+leg) + neglect + hemisensory loss (one lesion)",
     need.every(t => exp.has(t)));
}

{ // Weber still localises with the decomposed weakness (brainstem-medial emits weak_arm + weak_leg together)
  const s = win(S("ptosis@left","weak_adduction@left","weak_elevation@left","weak_depression@left",
                  "weak_arm@right","weak_leg@right","facial_weakness@right"));
  ok("Weber (CN III ductions + contra weak_arm+weak_leg+facial) -> midbrain medial",
     s?.level === "midbrain" && s?.part === "medial"); }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

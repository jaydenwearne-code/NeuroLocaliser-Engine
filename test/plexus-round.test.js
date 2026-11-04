// plexus-round.test.js — the plexus round, rows 3–7 (owner-ruled 2026-11-05; spec
// docs/superpowers/specs/2026-11-04-plexus-round-design.md). Each plexus element carries the cutaneous row of every MIXED
// nerve that arises wholly from it; branch and pure-sensory nerves keep pinning their own territory. Pins each approved
// row on both sides, and the spec's §6 "unchanged by design" list. Run: node test/plexus-round.test.js
import { solve, candidateSites } from "../src/engine/inverse.js";
import { expectedFindings } from "../src/engine/forward.js";
import { composePlexusSites } from "../src/model/sites.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0;
const ok = (label, cond, detail = "") => { cond ? pass++ : fail++; console.log((cond ? "PASS  " : "FAIL  ") + label + (cond ? "" : `  ${detail}`)); };
const T = s => new Set(s.split(/\s+/).filter(Boolean));
const SITE = Object.fromEntries(candidateSites().map(s => [s.id, s]));
const predicts = (id, tok) => expectedFindings(SITE[id]).has(tok);
const ids = r => r.display.map(c => c.site.id);
const first = toks => ids(solve(T(toks)))[0];
const mirror = s => s.replace(/@left/g, "@L").replace(/@right/g, "@left").replace(/@L/g, "@right");
// a one-lesion picture, asserted on the left and mirrored to the right
const oneLesion = (toks, id, label) => {
  for (const [side, t, want] of [["left", toks, id], ["right", mirror(toks), id.replace(/^left_/, "right_")]]) {
    const r = solve(T(t));
    ok(`${label} (${side})`, ids(r)[0] === want && r.multi === null, `${ids(r)[0]} multi=${!!r.multi}`);
  }
};

// ---- The composition: the nerve rows each element reuses (content-gap row 4; rows 3–7) ----
const NERVE_ROWS = {
  upper_trunk: ["axil_sens", "mcut_sens"],
  middle_trunk: [],
  lower_trunk: ["uln_el_sens"],
  lumbar_plexus: ["fem_sens", "obt_sens"],
  sacral_plexus: ["sci_sens"],
};
for (const s of composePlexusSites().filter(s => s.side === "left")) {
  const nerveRows = s.structures.filter(id => !id.startsWith("root_")).sort();
  ok(`the ${s.part.replace(/_/g, " ")} reuses exactly: ${NERVE_ROWS[s.part].join(", ") || "no nerve row"}`,
     JSON.stringify(nerveRows) === JSON.stringify([...NERVE_ROWS[s.part]].sort()), nerveRows.join(", "));
}

// ---- Row 3: the upper trunk + the musculocutaneous row ----
ok("row 3: the upper trunk carries lateral forearm numbness (musculocutaneous)", predicts("left_plexus_upper_trunk", "musculocutaneous_sensory@left"));
oneLesion("weak_shoulder_abduction@left weak_elbow_flexion@left weak_shoulder_external_rotation@left reflex_biceps_loss@left axillary_sensory@left musculocutaneous_sensory@left",
  "left_plexus_upper_trunk", "row 3: Erb with deltoid-patch and lateral-forearm numbness → the upper trunk, one lesion");
{ const r = solve(T("musculocutaneous_sensory@left weak_elbow_flexion@left reflex_biceps_loss@left weak_forearm_supination@left"));
  ok("row 3 guard: a musculocutaneous neuropathy still leads with the nerve, the upper trunk also fitting",
     ids(r)[0] === "left_nerve_musculocutaneous" && ids(r).includes("left_plexus_upper_trunk"), ids(r).join(", ")); }

// ---- Row 4: the lumbar plexus + the femoral and obturator rows ----
ok("row 4: the lumbar plexus carries front- and inner-thigh numbness (femoral, obturator)",
   predicts("left_plexus_lumbar_plexus", "femoral_sensory@left") && predicts("left_plexus_lumbar_plexus", "obturator_sensory@left"));
oneLesion("weak_hip_flexion@left weak_knee_extension@left weak_hip_adduction@left reflex_knee_loss@left femoral_sensory@left obturator_sensory@left",
  "left_plexus_lumbar_plexus", "row 4: a lumbar plexopathy in nerve words → the lumbar plexus, one lesion");
ok("row 4 guard: a femoral neuropathy still leads with the femoral nerve (audit probe)",
   first("weak_knee_extension@left reflex_knee_loss@left femoral_sensory@left") === "left_nerve_femoral");
ok("row 4 guard: an obturator neuropathy still leads with the obturator nerve", first("obturator_sensory@left weak_hip_adduction@left") === "left_nerve_obturator");

// ---- Row 5: the sacral plexus + the sciatic row ----
ok("row 5: the sacral plexus carries below-knee numbness (sciatic)", predicts("left_plexus_sacral_plexus", "sciatic_sensory@left"));
oneLesion("sciatic_sensory@left weak_knee_flexion@left weak_ankle_dorsiflexion@left weak_ankle_plantarflexion@left reflex_ankle_loss@left weak_hip_abduction@left",
  "left_plexus_sacral_plexus", "row 5: sciatic numbness + weak gluteus medius → the sacral plexus, one lesion");
ok("row 5 guard: a sciatic neuropathy still leads with the sciatic nerve",
   first("sciatic_sensory@left weak_knee_flexion@left weak_ankle_dorsiflexion@left weak_ankle_plantarflexion@left weak_foot_eversion@left reflex_ankle_loss@left") === "left_nerve_sciatic");

// ---- Row 6: the lower trunk + the ulnar palmar row ----
ok("row 6: the lower trunk carries little-finger numbness (ulnar, palmar)", predicts("left_plexus_lower_trunk", "ulnar_sensory@left"));
oneLesion("ulnar_sensory@left sensory_t1@left weak_thumb_abduction@left weak_finger_abduction@left",
  "left_plexus_lower_trunk", "row 6: little-finger + T1 numbness + weak thumb and finger abduction → the lower trunk, one lesion");
ok("row 6 guard: the ulnar nerve at the elbow still leads with the elbow (audit probe)",
   first("ulnar_sensory@left ulnar_dorsal_sensory@left weak_finger_abduction@left ulnar_claw@left") === "left_nerve_ulnar_elbow");
ok("row 6 guard: Guyon still leads with the wrist", first("ulnar_sensory@left weak_finger_abduction@left ulnar_claw@left") === "left_nerve_ulnar_wrist");

// ---- Row 7: branch and pure-sensory nerves stay out ----
const BRANCH = ["deep_peroneal_sensory", "peroneal_sensory", "tibial_sensory", "sural_sensory", "saphenous_sensory",
  "lat_fem_cutaneous_sensory", "ulnar_dorsal_sensory", "median_palmar_sensory"];
for (const s of composePlexusSites().filter(s => s.side === "left")) {
  const got = BRANCH.filter(f => expectedFindings(s).has(`${f}@left`));
  ok(`row 7: the ${s.part.replace(/_/g, " ")} predicts no branch or pure-sensory territory`, got.length === 0, got.join(", "));
}
ok("row 7 guard: first web-space numbness still pins the peroneal nerve (the foot-drop worked example)",
   ids(solve(T("weak_ankle_dorsiflexion@left weak_great_toe_extension@left weak_foot_eversion@left deep_peroneal_sensory@left"))).join() === "left_nerve_peroneal_common");
ok("row 7 guard: meralgia still reads the lateral femoral cutaneous nerve alone", ids(solve(T("lat_fem_cutaneous_sensory@left"))).join() === "left_nerve_lat_fem_cutaneous");
ok("row 7 guard: sural numbness still reads the sural nerve alone", ids(solve(T("sural_sensory@left"))).join() === "left_nerve_sural");

// ---- Unchanged by design (spec §6); rows 2 and 8–9 ----
ok("row 2: root pain stays shared — the upper trunk still predicts root pain", predicts("left_plexus_upper_trunk", "radicular_pain@left"));
{ const r = solve(T("sensory_c6@left reflex_biceps_loss@left reflex_brachioradialis_loss@left weak_elbow_flexion@left radicular_pain@left"));
  ok("guard: C6 radiculopathy → the C6 root first, the upper trunk also fitting", ids(r)[0] === "left_root_c6" && ids(r).includes("left_plexus_upper_trunk"), ids(r).join(", ")); }
{ const r = solve(T("weak_shoulder_abduction@left weak_elbow_flexion@left weak_shoulder_external_rotation@left reflex_biceps_loss@left axillary_sensory@left radicular_pain@left"));
  ok("guard: Erb + root pain is still one upper-trunk lesion", ids(r)[0] === "left_plexus_upper_trunk" && r.multi === null, `${ids(r)[0]} multi=${!!r.multi}`); }
{ const r = solve(T("weak_hip_flexion@left weak_knee_extension@left weak_hip_adduction@left reflex_knee_loss@left radicular_pain@left"));
  ok("guard: diabetic amyotrophy with root pain is still one lumbar-plexus lesion", ids(r)[0] === "left_plexus_lumbar_plexus" && r.multi === null, `${ids(r)[0]} multi=${!!r.multi}`); }
ok("guard: the foot-drop worked example still has its three places",
   ids(solve(T("weak_ankle_dorsiflexion@left weak_great_toe_extension@left weak_foot_eversion@left"))).join() === "left_nerve_peroneal_common,left_root_l5,left_plexus_sacral_plexus");
ok("guard: + weak hip abduction → the L5 root", first("weak_ankle_dorsiflexion@left weak_great_toe_extension@left weak_foot_eversion@left weak_hip_abduction@left") === "left_root_l5");
ok("guard: Klumpke → the lower trunk", first("weak_thumb_abduction@left weak_finger_abduction@left weak_finger_flexion@left sensory_c8@left sensory_t1@left") === "left_plexus_lower_trunk");
ok("guard: C8 + thumb and finger abduction → the C8 root or the lower trunk (audit probe)",
   /^left_(root_c8|plexus_lower_trunk)$/.test(first("weak_thumb_abduction@left weak_finger_abduction@left sensory_c8@left") || ""));
ok("guard: Pancoast → the lung apex",
   first("miosis@left ptosis@left anhidrosis_face@left sensory_c8@left sensory_t1@left weak_finger_abduction@left radicular_pain@left") === "left_sympathetic_pancoast");
ok("rows 8–9 not built: the sacral plexus still carries L4's knee jerk (until the lumbosacral place exists)",
   predicts("left_plexus_sacral_plexus", "reflex_knee_loss@left"));

// ---- Wording (rows 11, 12) ----
ok("row 11: the upper trunk's note names the deltoid patch and the lateral forearm",
   /numbness over the deltoid patch and the lateral forearm/.test(nameForSite(SITE["left_plexus_upper_trunk"]).note));
ok("row 12: the lumbar plexus's note names front- and inner-thigh numbness",
   /^Front- and inner-thigh numbness \(femoral and obturator territories\)/.test(nameForSite(SITE["left_plexus_lumbar_plexus"]).note));
ok("row 12: the lower trunk's note names the little finger and the medial forearm",
   /sensory loss over the little finger and the medial forearm/.test(nameForSite(SITE["left_plexus_lower_trunk"]).note));

// ---- report ----
console.log(`\nNeuroLocaliser — plexus round (round 1, rows 3–7)\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

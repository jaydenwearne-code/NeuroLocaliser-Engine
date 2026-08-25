// discriminators.test.js — "what should I examine next, and what would it prove?"
//
// WHY THIS EXISTS. The neuraxis diagram was rebuilt three times trying to make anatomy carry the argument,
// and it never did: a picture of the neuraxis is in every textbook, whereas the reasoning is not. Measured
// while designing this: EVERY SURVIVING CANDIDATE EXPLAINS EVERY ENTERED FINDING — that is what makes it a
// candidate — so a grid of "what is explained" is all ticks and says almost nothing. The information sits
// entirely in what a candidate PREDICTS THAT YOU HAVE NOT LOOKED FOR.
import { discriminators, explainedBy } from "../app/discriminators.js";
import { solve } from "../src/engine/inverse.js";

let pass = 0, fail = 0;
const ok = (l, c, extra = "") => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l + (c ? "" : "  " + extra)); };

const build = toks => { const obs = new Set(toks); return { obs, r: solve(obs, {}) }; };

// ---- FOOT DROP: the case the worked examples exist to teach ----
// Three candidates, all explaining all three findings, separated only by what else each would produce.
{
  const { obs, r } = build(["weak_ankle_dorsiflexion@left", "weak_great_toe_extension@left", "weak_foot_eversion@left"]);
  const cands = r.display;
  ok(`foot drop has three candidates (${cands.length})`, cands.length === 3);
  ok("every candidate explains every entered finding — which is why the grid of explanations is useless",
     cands.every(c => explainedBy(c, obs).length === 3));

  const d = discriminators(cands, obs);
  ok("there are discriminators to offer", d.length > 0);
  ok("each names what it would confirm and what it would exclude",
     d.every(x => x.confirms.length > 0 && x.excludes.length > 0 && x.confirms.length + x.excludes.length === cands.length));

  // the two the example was built around
  const byToken = Object.fromEntries(d.map(x => [x.token, x]));
  const peroneal = byToken["deep_peroneal_sensory@left"] || byToken["peroneal_sensory@left"];
  ok("a peroneal sensory finding is offered", !!peroneal);
  ok("...and it confirms the NERVE, not the root",
     peroneal && peroneal.confirms.every(i => /peroneal|fibular/i.test(cands[i].site.id + cands[i].site.part)),
     peroneal && peroneal.confirms.map(i => cands[i].site.id).join(", "));

  const hip = byToken["weak_hip_abduction@left"];
  ok("weak hip abduction is offered", !!hip);
  ok("...and it EXCLUDES the peroneal nerve (it is above the nerve's territory)",
     hip && hip.excludes.some(i => /peroneal/i.test(cands[i].site.id)),
     hip && "excludes " + hip.excludes.map(i => cands[i].site.id).join(", "));
}

// ---- SORTED BY HOW WELL THEY SPLIT ----
// A finding predicted by every candidate proves nothing and must never be offered; one that splits the
// field evenly is the most informative examination.
{
  const { obs, r } = build(["weak_ankle_dorsiflexion@left", "weak_great_toe_extension@left", "weak_foot_eversion@left"]);
  const d = discriminators(r.display, obs);
  ok("nothing predicted by ALL candidates is offered", d.every(x => x.excludes.length > 0));
  ok("nothing predicted by NO candidate is offered", d.every(x => x.confirms.length > 0));
  ok("nothing already entered is offered", d.every(x => !obs.has(x.token)));
  const spreads = d.map(x => Math.abs(x.confirms.length - x.excludes.length));
  ok("the most balanced split is offered first", spreads.every((v, i) => i === 0 || v >= spreads[i - 1]),
     spreads.join(","));
}

// ---- WALLENBERG: two candidates, and the discriminators all point one way ----
{
  const { obs, r } = build(["cn8_vertigo@left", "face_pain_loss@left", "spinothalamic@right",
                            "ptosis@left", "miosis@left", "limb_ataxia@left"]);
  const cands = r.display, d = discriminators(cands, obs);
  ok(`Wallenberg narrows to two (${cands.length})`, cands.length === 2);
  ok("discriminators are offered for the pair", d.length > 0);
  // hemimedullary adds the pyramid and hypoglossal; Wallenberg does not
  const names = d.map(x => x.token);
  ok("a corticospinal or hypoglossal sign is offered, which is what separates them",
     names.some(t => /weak_arm|weak_leg|cn12|babinski|dorsal_sensory/.test(t)), names.slice(0, 6).join(", "));
}

// ---- A SINGLE CANDIDATE HAS NOTHING TO DISCRIMINATE ----
{
  const { obs, r } = build(["saddle_anaesthesia@midline", "sphincter_dysfunction@midline",
                            "radicular_pain@midline", "anal_wink_loss@midline"]);
  ok(`cauda equina resolves to one (${r.display.length})`, r.display.length === 1);
  ok("a single candidate offers no discriminators", discriminators(r.display, obs).length === 0);
}

// ---- MULTIFOCAL: here the EXPLAINED grid does carry information ----
// Two lesions is the case where no single site explains everything, so what each explains differs.
{
  const { obs, r } = build(["weak_arm@right", "weak_leg@left"]);
  const cands = r.display;
  ok("no single candidate explains both findings", cands.every(c => explainedBy(c, obs).length < 2));
  ok("...so the explained sets differ between candidates",
     new Set(cands.map(c => explainedBy(c, obs).join("|"))).size > 1);
}

// ---- COMPARING A CHOSEN SUBSET (owner's request) ----
// "The user should be able to select which locations they want to compare." This is the clinical act —
// you are rarely torn between all candidates at once, you are torn between two of them — and the right
// examination DEPENDS ON WHICH TWO. Comparing the whole list buries the pairwise test.
{
  const { obs, r } = build(["weak_ankle_dorsiflexion@left", "weak_great_toe_extension@left", "weak_foot_eversion@left"]);
  const all = r.display;
  const byId = id => all.find(c => c.site.id === id);
  const nerve = byId("left_nerve_peroneal_common"), l5 = byId("left_root_l5"), plexus = byId("left_plexus_sacral_plexus");
  ok("the three candidates are the ones expected", !!nerve && !!l5 && !!plexus);

  const dAll = discriminators(all, obs);
  const dPair = discriminators([nerve, l5], obs);
  const dOther = discriminators([l5, plexus], obs);

  // A subset can only narrow the set of splitting findings, never widen it — anything that fails to split
  // the whole list also fails to split any part of it.
  const tokens = d => new Set(d.map(x => x.token));
  ok("a subset's discriminators are a subset of the whole list's",
     [...tokens(dPair)].every(t => tokens(dAll).has(t)));

  // ...but the ORDER changes, and that is the point: the best test for a chosen pair rises to the top.
  ok("nerve-vs-root and root-vs-plexus lead with DIFFERENT examinations",
     dPair[0].token !== dOther[0].token, `${dPair[0].token} vs ${dOther[0].token}`);
  ok("root vs plexus leads with a reflex or a neighbouring dermatome, not a peroneal sensory finding",
     /reflex|sensory_l4|sensory_s1|plantarflexion|knee/.test(dOther[0].token), dOther[0].token);
  ok("nerve vs root leads with a peroneal sensory finding or a root sign",
     /peroneal|sensory_l5|inversion|hip_abduction|radicular/.test(dPair[0].token), dPair[0].token);

  // every discriminator over a pair is a clean either/or — one candidate each side
  ok("over a chosen pair, each discriminator confirms exactly one and excludes the other",
     dPair.every(x => x.confirms.length === 1 && x.excludes.length === 1));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

// answer.test.js — the answer card's lines (spec 2026-09-27 §3.1): each line derived, each edge state covered.
// Findings read as the app shows them: plain words, proper name in brackets (owner ruling 2026-09-29).
import { whereLine, whySentence, whatLine, resolveNext, answerFor } from "../app/answer.js";
import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";
import { pathologyNextStepsFor } from "../src/data/nextSteps.js";
import { EXAMPLES } from "../app/examples.js";

let pass = 0, fail = 0;
const ok = (l, c, d = "") => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l + (c ? "" : `  ${d}`)); };
const eq = (l, got, want) => ok(l, got === want, `got ${JSON.stringify(got)}`);

// ---- Where ----
eq("one place", whereLine({ place: "Left L5 root" }), "Left L5 root.");
eq("one other place fits", whereLine({ place: "A", others: ["B"] }), "A. 1 other place also fits: B.");
eq("three others: two named, the rest counted", whereLine({ place: "A", others: ["B", "C", "D"] }), "A. 3 other places also fit: B, C, and 1 more.");
eq("no single place: the cover is named", whereLine({ place: "A", cover: ["A", "B"] }), "No single place explains every finding — likely A and B.");
eq("a partial fit says how partial", whereLine({ place: "A", fit: { n: 3, total: 4 } }), "A explains 3 of 4 findings.");

// ---- Why ----
const w = (verdict, clues, where, sides, more = 0) => ({ verdict, clues, where, meet: { stations: [], sides }, more });
eq("one place, crossed", whySentence(w("one", [{ finding: "weak_adduction", side: "left" }, { finding: "weak_arm", side: "right" }], "midbrain", ["left"])),
   "Left eye won't turn in (adduction deficit) + right arm weakness → only the left midbrain.");
eq("several places, listed", whySentence(w("several", [{ finding: "sensory_l5", side: "left" }], "nerve root, plexus", ["left"])),
   "Left L5 numbness → the left nerve root or plexus; see Where for what separates them.");
eq("several places, a range", whySentence(w("several", [{ finding: "weak_arm", side: "right" }], "cerebral cortex → spinal cord", ["left", "right"])),
   "Right arm weakness → anywhere from the cerebral cortex to the spinal cord; see Where for what separates them.");
eq("more clues than shown are counted", whySentence(w("one", [{ finding: "dysarthria", side: null }], "pons", ["left"], 2)),
   "Slurred speech (dysarthria) + 2 more findings → only the left pons.");
eq("no single place", whySentence(w("none", [], "", [])), "These findings need more than one lesion — see Together.");

// ---- What ----
const c = (name, likelihood, red = false) => ({ name, likelihood, red });
eq("most likely, then the must-not-miss", whatLine({ causes: [c("A", "uncommon", true), c("B", "common")] }), "Most likely B. Must not miss: A.");
eq("a red most-likely says so, and the next red follows", whatLine({ causes: [c("A", "common", true), c("B", "uncommon", true)] }),
   "Most likely A (must not miss). Must not miss: B.");
eq("no red: just the most likely", whatLine({ causes: [c("A", "common")] }), "Most likely A.");
eq("nothing fits the onset", whatLine({ causes: [], demotedCount: 4 }), "No cause here typically starts this way — 4 set aside.");
eq("a selected cause", whatLine({ causes: [c("A", "common")], selected: "Vertebral artery dissection" }), "Selected: Vertebral artery dissection.");
eq("two lesions: the spanning disease", whatLine({ twoLesions: true, entity: "Multiple sclerosis" }), "Together: Multiple sclerosis.");
eq("two lesions, nothing catalogued", whatLine({ twoLesions: true }), "No catalogued disease spans these places — see Together.");
// A SEQUEL (`after`) names what may follow an earlier event — never the most likely cause of a new presentation
// (owner ruling 2026-09-29): it gets its own clause instead.
const seq = { name: "S", likelihood: "common", red: false, after: "stroke" };
eq("a sequel never leads; it gets its own clause", whatLine({ causes: [seq, c("A", "uncommon")] }), "Most likely A. After a previous stroke here: S.");
eq("…after the must-not-miss", whatLine({ causes: [seq, c("A", "common"), c("B", "rare", true)] }), "Most likely A. Must not miss: B. After a previous stroke here: S.");
eq("only a sequel fits", whatLine({ causes: [seq] }), "After a previous stroke here: S.");

// ---- the whole card, on the four worked examples ----
const stateFor = ex => {
  const tokens = new Set(ex.tokens);
  const r = solve(tokens, { dominantSide: "left" });
  const sel = r.display.find(x => x.site.id === r.defaultSite) || r.display[0];
  return { r, sel, total: tokens.size, tokens, onset: ex.onset || "", course: ex.course || "", dominant: "left",
    sensoryLevel: "", pinned: new Set(ex.pinned || []), scope: "site", selectedPathology: undefined, selectedEntity: undefined };
};
const ex = id => EXAMPLES.find(e => e.id === id);
{
  const a = answerFor(stateFor(ex("wallenberg"))).lines;
  eq("Wallenberg — Where", a.where, "Left lateral medulla. 1 other place also fits: Left hemimedulla.");
  eq("Wallenberg — Why", a.why, "Left face pain loss + left swallowing difficulty (dysphagia) + right body pain loss (spinothalamic loss) → only the left medulla.");
  eq("Wallenberg — What", a.what, "Most likely PICA / vertebral artery occlusion. Must not miss: Vertebral artery dissection.");
  eq("Wallenberg — Next", a.next, "Acute stroke team — hyperacute pathway; keep nil by mouth until swallow assessed.");
  eq("Wallenberg — red flag", a.red, "Swallowing can fail early — keep nil by mouth until assessed.");
}
{
  const a = answerFor(stateFor(ex("footdrop"))).lines;
  eq("Foot drop — Where names the other two", a.where, "Left common peroneal nerve. 2 other places also fit: Left L5 root, Left sacral plexus.");
  eq("Foot drop — Why says several", a.why, "Left foot drop (weak ankle dorsiflexion) → the left nerve root, plexus or peripheral nerve; see Where for what separates them.");
}
{
  const a = answerFor(stateFor(ex("cauda"))).lines;
  eq("Cauda — a red most-likely", a.what, "Most likely Central lumbar disc prolapse (must not miss). Must not miss: Spinal epidural abscess.");
}
{
  const out = answerFor(stateFor(ex("twolesions")));
  ok("Two lesions — Where names the cover", out.twoLesions && out.lines.where.startsWith("No single place explains every finding — likely "), out.lines.where);
  eq("Two lesions — What names the spanning disease", out.lines.what, "Together: Multiple sclerosis.");
}
{
  // Invariants over all four: the Next line IS the referral, word for word; the red line appears exactly when the
  // site has a red-flag sentence; and the resolved plan is the one the Next card would show.
  const bad = [];
  for (const e of EXAMPLES) {
    const st = stateFor(e), out = answerFor(st);
    const ref = pathologyNextStepsFor(st.sel.site, null, { onset: st.onset || undefined });
    if (out.lines.next !== ref.referral) bad.push(`${e.id}: next`);
    if ((out.lines.red || null) !== (nameForSite(st.sel.site).red || null)) bad.push(`${e.id}: red`);
    if (resolveNext({ ...st, site: st.sel.site }).nx.referral !== ref.referral) bad.push(`${e.id}: resolve`);
  }
  ok("Next is the referral verbatim, red matches the site, one resolution", bad.length === 0, bad.join(", "));
}
{
  // A selected cause narrows the lines to it, exactly as the Next card does.
  const st = { ...stateFor(ex("wallenberg")), selectedPathology: "Vertebral artery dissection" };
  const out = answerFor(st);
  eq("a selected cause — What", out.lines.what, "Selected: Vertebral artery dissection.");
  eq("a selected cause — Next follows its plan",
     out.lines.next, pathologyNextStepsFor(st.sel.site, "Vertebral artery dissection", { onset: st.onset }).referral);
}

{
  // A slow onset no longer reads the stroke plan beside a tumour (spec 2026-09-29): the Next line and the badge
  // follow the cause the What line names.
  const st = stateFor({ tokens: ["weak_arm@right", "hyperreflexia@right"], onset: "chronic" });
  const out = answerFor(st);
  eq("chronic — the answer is the motor cortex", st.sel.site.id, "left_cortex_motor_facearm");
  eq("chronic — What names the tumour", out.lines.what, "Most likely Glioma / metastasis.");
  eq("chronic — Next follows it", out.lines.next, "Neuro-oncology multidisciplinary team, with neurosurgery");
  eq("chronic — the badge follows it", out.nx.urgency, "urgent");
  const hyper = answerFor(stateFor({ tokens: ["weak_arm@right", "hyperreflexia@right"], onset: "hyperacute" }));
  eq("hyperacute — still the stroke plan", hyper.lines.next, "Hyperacute stroke pathway — assess for thrombolysis / thrombectomy within the window.");
}

console.log(`\nanswer card: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

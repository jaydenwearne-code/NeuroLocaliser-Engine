// follow-ups.test.js — findings that appear under a ticked finding (spec 2026-09-27 §5.3).
import { FOLLOW_UPS, GROUP_OF, followUpLayout } from "../app/follow-ups.js";
import { FINDINGS } from "../src/model/findings.js";
import { offersFor } from "../app/sides.js";

let pass = 0, fail = 0;
const ok = (l, c, d = "") => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l + (c ? "" : `  ${d}`)); };

const pairs = Object.entries(FOLLOW_UPS).flatMap(([p, kids]) => kids.map(k => [p, k]));
const unreal = [...new Set(pairs.flat())].filter(f => !FINDINGS[f]);
ok(`every parent and follow-up is a real finding (${pairs.length} pairs)`, unreal.length === 0, unreal.join(", "));
const homeless = [...new Set(pairs.flat())].filter(f => !GROUP_OF[f]);
ok("every parent and follow-up has a home row in the exam tree", homeless.length === 0, homeless.join(", "));
ok("no finding follows itself", pairs.every(([p, k]) => p !== k));

// Acyclic: a follow-up that is itself a parent (small pupil -> facial anhidrosis) must never lead back.
const cyclic = [];
const visit = (f, path) => {
  if (path.includes(f)) { cyclic.push([...path, f].join(" > ")); return; }
  (FOLLOW_UPS[f] || []).forEach(k => visit(k, [...path, f]));
};
Object.keys(FOLLOW_UPS).forEach(p => visit(p, []));
ok("the map is acyclic", cyclic.length === 0, cyclic.join(" | "));

// A follow-up takes its parent's side: it must offer every side its parent offers, or have one fixed offer of
// its own (the nystagmus types and skew take no side).
const keys = f => offersFor(f).map(o => o.key);
const clash = pairs.filter(([p, k]) => {
  const pk = keys(p), kk = keys(k);
  return !(pk.every(s => kk.includes(s)) || kk.length === 1);
}).map(([p, k]) => `${p}[${keys(p)}] -> ${k}[${keys(k)}]`);
ok("every follow-up can take its parent's side", clash.length === 0, clash.join(" | "));

// ---- the layout ----
{
  const { under, hideHome } = followUpLayout(new Set(["facial_weakness"]));
  ok("face droop shows its five refinements", JSON.stringify(under.get("facial_weakness")) ===
     JSON.stringify(["forehead_spared", "forehead_involved", "hyperacusis", "taste_loss", "lacrimation_loss"]));
  ok("…and their home rows (same group) are hidden, so nothing shows twice", hideHome.has("forehead_spared") && hideHome.has("lacrimation_loss"));
}
{
  const { under, hideHome } = followUpLayout(new Set(["ptosis"]));
  ok("a drooping eyelid shows the pupil questions", (under.get("ptosis") || []).includes("miosis"));
  ok("…but the small pupil keeps its home row in Pupils (a different group)", !hideHome.has("miosis"));
}
{
  const { under } = followUpLayout(new Set(["speech_nonfluent", "comprehension_impaired"]));
  ok("a follow-up shared by two entered parents shows once, under the first",
     (under.get("speech_nonfluent") || []).includes("repetition_impaired") && !under.has("comprehension_impaired"));
}
{
  const { under, hideHome } = followUpLayout(new Set(["forehead_involved"]));
  ok("an entered follow-up without its parent stays on its home row", under.size === 0 && hideHome.size === 0);
}
{
  const { under, hideHome } = followUpLayout(new Set(["rapd"]));
  ok("RAPD is enterable on its own — no monocular loss needed (optic tract)", under.size === 0 && !hideHome.has("rapd"));
}
{
  const { under } = followUpLayout(new Set(["ptosis", "miosis"]));
  ok("a follow-up that is itself a parent shows its own follow-ups", (under.get("miosis") || []).includes("anhidrosis_face"));
}

console.log(`\nfollow-ups: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

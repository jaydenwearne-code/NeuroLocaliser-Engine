// case-url.test.js — the case ⇄ URL-hash serializer is a pure, DOM-free string function (testable in node).
import { encodeCase, decodeCase } from "../app/case-url.js";

let pass = 0, fail = 0;
const ok = (l, c) => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l); };

const validFindings = new Set(["weak_arm", "weak_leg", "spinothalamic"]);
const validSites = new Set(["right_pons_basis_pontis", "left_mca_deep"]);

// round-trip
const state = { tokens: new Set(["weak_arm@left", "weak_leg@left"]), onset: "acute", mode: "localise",
  selected: "right_pons_basis_pontis", dominant: "right", sensoryLevel: "T10", distalReach: "knees" };
const round = decodeCase("#" + encodeCase(state), { validFindings, validSites });
ok("round-trips the finding tokens", [...round.tokens].sort().join("|") === "weak_arm@left|weak_leg@left");
ok("round-trips onset", round.onset === "acute");
ok("round-trips the selected site", round.selected === "right_pons_basis_pontis");
ok("round-trips dominant hemisphere", round.dominant === "right");
ok("round-trips sensory level + distal reach", round.sensoryLevel === "T10" && round.distalReach === "knees");

// laterality preserved exactly
const lat = decodeCase("#" + encodeCase({ tokens: new Set(["weak_arm@right"]) }), { validFindings });
ok("preserves side (right, not left)", [...lat.tokens][0] === "weak_arm@right");

// malformed / unknown input degrades safely
ok("empty hash yields no tokens", decodeCase("", { validFindings }).tokens === undefined);
ok("garbage hash does not throw", (() => { try { decodeCase("#@@@&&&=%%%", { validFindings }); return true; } catch { return false; } })());
const dropped = decodeCase("#f=weak_arm@left,made_up_finding@left,noside", { validFindings });
ok("drops unknown finding ids", [...dropped.tokens].join("|") === "weak_arm@left");
ok("drops tokens with no side", ![...dropped.tokens].some(t => t === "noside"));
const badSite = decodeCase("#f=weak_arm@left&s=not_a_site", { validFindings, validSites });
ok("drops an unknown selected site", badSite.selected === undefined);
ok("rejects an unknown mode", decodeCase("#m=wat", {}).mode === undefined);
ok("accepts the stroke mode", decodeCase("#m=stroke", {}).mode === "stroke");

// --- course axis in the shareable case (spec 2026-08-14 §8) ---
{
  const enc = encodeCase({ tokens: new Set(["weak_arm@left"]), course: "stepwise" });
  ok("course is serialised as c=", enc.includes("c=stepwise"));
  ok("course round-trips", decodeCase("#" + enc).course === "stepwise");
  ok("an invalid hand-edited course is DROPPED, never thrown on",
     decodeCase("#c=notacourse").course === undefined);
  ok("no course means no key", !encodeCase({ tokens: new Set(["weak_arm@left"]) }).includes("c="));
}

// --- pinned sites in the shareable case (spec 2026-08-14 §8) ---
{
  const enc = encodeCase({ tokens: new Set(["weak_arm@left"]), pinned: new Set(["left_cord_hemi", "right_root_l5"]) });
  ok("pins are serialised as p=", /p=left_cord_hemi%2Cright_root_l5|p=left_cord_hemi,right_root_l5/.test(enc));
  const back = decodeCase("#" + enc, { validSites: new Set(["left_cord_hemi", "right_root_l5"]) });
  ok("pins round-trip as a Set", back.pinned instanceof Set && back.pinned.size === 2);
  const filtered = decodeCase("#p=left_cord_hemi,not_a_site", { validSites: new Set(["left_cord_hemi"]) });
  ok("unknown pinned site ids are dropped, never thrown on",
     filtered.pinned instanceof Set && filtered.pinned.size === 1);
}

// --- selected pathology (spec 2026-08-18) ---
// A shared case must reproduce the pathology view, not just the lesion — otherwise a tester sending a
// bug report about the Next card sends a link that does not show what they were looking at.
{
  const enc = encodeCase({ tokens: new Set(["weak_leg@left"]), selected: "cord_transverse",
                           selectedPathology: "Spinal epidural abscess" });
  ok("the selected pathology is encoded", /(^|&)px=/.test(enc));

  const dec = decodeCase("#" + enc, { validPathologies: new Set(["Spinal epidural abscess"]) });
  ok("it round-trips", dec.selectedPathology === "Spinal epidural abscess");

  const bad = decodeCase("#px=Not%20A%20Real%20Disease",
                         { validPathologies: new Set(["Spinal epidural abscess"]) });
  ok("an unknown pathology is dropped, not thrown on", bad.selectedPathology === undefined);

  ok("with no validPathologies set, any value is accepted",
     decodeCase("#px=Anything").selectedPathology === "Anything");

  ok("no pathology means no px key", !/px=/.test(encodeCase({ tokens: new Set(["weak_leg@left"]) })));
}

// ---- ux= : the cross-site entity (spec 2026-08-21) ----
{
  const validEntities = new Set(["Multiple sclerosis", "Vasculitis (CNS or systemic)"]);
  const enc = encodeCase({ tokens: new Set(["weak_leg@left"]), selectedEntity: "Multiple sclerosis" });
  ok("encodes the entity as ux=", /ux=/.test(enc));
  const back = decodeCase("#" + enc, { validFindings, validEntities });
  ok("round-trips the entity", back.selectedEntity === "Multiple sclerosis");
  // ux has no meaning outside the all-sites view, so its presence IS the scope.
  ok("ux implies the all-sites scope", back.scope === "all");

  const bogus = decodeCase("#ux=" + encodeURIComponent("Not A Real Disease"), { validFindings, validEntities });
  ok("an unknown entity token is dropped", bogus.selectedEntity === undefined);
  ok("a dropped entity implies no scope", bogus.scope === undefined);

  ok("no entity means no ux key", !/ux=/.test(encodeCase({ tokens: new Set(["weak_leg@left"]) })));

  // px and ux describe DIFFERENT scopes and must both survive one URL.
  const both = decodeCase("#" + encodeCase({ selectedPathology: "Cardioembolism", selectedEntity: "Multiple sclerosis" }),
                          { validEntities });
  ok("px and ux coexist in one URL", both.selectedPathology === "Cardioembolism" && both.selectedEntity === "Multiple sclerosis");
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

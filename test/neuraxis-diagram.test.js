// neuraxis-diagram.test.js — the derived SVG builder is a pure string function (DOM-free, testable in node).
import { neuraxisSVG } from "../app/neuraxis-diagram.js";
import { tractsFor } from "../src/engine/tracts.js";

let pass = 0, fail = 0;
const ok = (l, c) => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l); };

const tf = tractsFor(new Set(["weak_arm@left", "weak_leg@left"]), { dominantSide: "left" });
const svg = neuraxisSVG(tf, { selectedId: "right_pons_basis_pontis", labelFor: s => s.id });

ok("returns an <svg>", typeof svg === "string" && svg.trim().startsWith("<svg") && svg.includes("</svg>"));
ok("has a node for each candidate site on the tract",
   tf[0].sites.every(s => svg.includes(`data-k="${s.site.id}"`)));
ok("marks the decussation", svg.includes('class="decussation"'));
ok("emphasises the selected node", svg.includes('data-k="right_pons_basis_pontis"') && /data-sel="1"[^>]*data-k="right_pons_basis_pontis"|data-k="right_pons_basis_pontis"[^>]*data-sel="1"/.test(svg));
ok("empty input yields empty string", neuraxisSVG([], {}) === "");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

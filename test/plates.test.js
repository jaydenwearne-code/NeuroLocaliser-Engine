// plates.test.js — the plate-adoption pipeline. A public-domain vector plate becomes an app asset by
// having its burned-in labels stripped and its hard-coded 1918 colours mapped onto the palette.
//
// THE FIXTURES ARE SYNTHETIC, DELIBERATELY. Two real plates were rejected during the 2026-08-25 survey
// (Medulla_section_uk.svg, Gray669-ja.svg) and the obvious move is to keep them as fixtures — but that
// means shipping 275KB of unusable art, and CLAUDE.md already records the trap of using an incidental
// content gap as a test fixture. The failure MODES are reproduced below instead.
import { PLATES, adoptPlate, auditPlate } from "../app/plates.js";
import { readFileSync } from "node:fs";

let pass = 0, fail = 0;
const ok = (l, c, extra = "") => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l + (c ? "" : "  " + extra)); };
const count = (s, re) => (s.match(re) || []).length;

// ---- 1. the registry ----
const keys = Object.keys(PLATES);
ok(`the registry holds the validated plates (${keys.length})`, keys.length >= 4);
for (const [k, p] of Object.entries(PLATES)) {
  ok(`plate "${k}" records its licence`, /public domain|CC0/i.test(p.licence), p.licence);
  ok(`plate "${k}" records where it came from`, typeof p.source === "string" && p.source.includes("commons"));
  ok(`plate "${k}" says what it serves`, typeof p.serves === "string" && p.serves.length > 2);
  ok(`plate "${k}" is explicitly verified`, p.verified === true);
}

// ---- 2. adoption: de-label and recolour, without eating the anatomy ----
for (const [k, p] of Object.entries(PLATES)) {
  const raw = readFileSync(new URL(`../app/plates/${p.file}`, import.meta.url), "utf8");
  const out = adoptPlate(raw);
  const before = count(raw, /<path/g), after = count(out, /<path/g);

  ok(`"${k}" keeps its anatomy (${after}/${before} paths)`, after >= before * 0.85, `kept ${Math.round(100*after/before)}%`);
  ok(`"${k}" has no <text> left`, !/<text[\s>]/.test(out));
  // Gray669-ja passed a naive <text> check while still rendering Japanese, because its labels were
  // Inkscape glyph GROUPS. Assert on the rendered glyphs, not on the tag.
  ok(`"${k}" leaves no non-Latin glyphs`, !/[　-鿿Ѐ-ӿͰ-Ͽ]/.test(out));
  ok(`"${k}" has no hard-coded colour left`, !/(fill|stroke)\s*[:=]\s*"?#[0-9a-fA-F]{3,6}/.test(out),
     (out.match(/(fill|stroke)\s*[:=]\s*"?#[0-9a-fA-F]{3,6}/g) || []).slice(0, 3).join(", "));
  ok(`"${k}" paints through palette tokens`, /var\(--/.test(out));
  ok(`"${k}" carries no fixed width/height (it must scale)`, !/<svg[^>]*\s(width|height)="\d/.test(out));
}

// ---- 3. THE GATE IS THE REGISTRY, BECAUSE NO SIGNAL SEPARATES GOOD PLATES FROM BAD ----
// Measured over the four validated plates and the two rejected ones: the short-path ratio runs 31-88% on
// GOOD plates and 17-49% on BAD ones, and font markers are 0 for one of each. A threshold would have
// rejected Brain_diagram_without_text.svg, the best plate in the set. auditPlate therefore reports
// evidence and returns NO verdict.
const a = auditPlate(readFileSync(new URL(`../app/plates/${PLATES[keys[0]].file}`, import.meta.url), "utf8"));
for (const f of ["paths", "shortPathRatio", "glyphLikeRatio", "fontMarkers"]) {
  ok(`auditPlate reports "${f}" as evidence`, typeof a[f] === "number");
}
ok("auditPlate returns NO automatic verdict", !("suspectFlattenedText" in a) && !("verdict" in a));
ok("auditPlate flags non-Latin glyphs, which IS decisive",
   auditPlate('<svg><text>後外側路</text></svg>').nonLatin === true);
ok("...and does not flag a clean plate", a.nonLatin === false);

// ---- 4. adoption is GATED on the registry ----
ok("an unregistered plate cannot be adopted",
   adoptPlate("<svg><path d='M0 0 L1 1'/></svg>", { key: "not_a_registered_plate" }) === null);

// ---- 5. label stripping, both shapes ----
const withText = `<svg><text x="1" y="2">Thalamus</text><path d="M0 0 C 1 1 2 2 3 3"/></svg>`;
ok("plain <text> labels are stripped", !/Thalamus/.test(adoptPlate(withText, { unsafeSkipRegistry: true })));
const inkscape = `<svg><g id="text4586" style="font-size:32px"><path d="M1 1 l1 1"/></g><path d="M0 0 C 1 1 2 2 3 3"/></svg>`;
const inkOut = adoptPlate(inkscape, { unsafeSkipRegistry: true });
ok("Inkscape label groups are stripped", !/text4586/.test(inkOut));
ok("...without taking the anatomy with them", /C 1 1 2 2 3 3/.test(inkOut), inkOut);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

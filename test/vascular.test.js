// vascular.test.js — the authored vascular axis.
//
// `site.territory` is human-readable prose ("MCA superior division (precentral — face/arm motor)") and
// none of the 211 distinct strings carries a vessel segment, so branch-level resolution cannot be parsed
// out of it — it has to be authored. This table is that authoring.
//
// Keyed by `${level}|${part}`, NOT by part alone: four part names (`lateral`, `hemi`, `medial`,
// `anterior`) are reused across levels, so a bare-name key would give lateral medulla (PICA) and lateral
// midbrain one shared row.
//
// Spec: docs/superpowers/specs/2026-08-15-multifocal-pattern-axis-design.md §1
// Run: node test/vascular.test.js
import { VESSELS, SEGMENTS, ZONES, VASCULAR, SEGMENT_NULL_REASON, vascularOf } from "../src/model/vascular.js";
import { candidateSites } from "../src/engine/inverse.js";
import { compartmentOf } from "../src/model/compartments.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond, detail = "") { log.push({ label, ok: !!cond, detail }); cond ? pass++ : fail++; }

const CNS = new Set(["brain", "brainstem", "cerebellum", "cord", "optic"]);
const cnsKeys = [...new Set(candidateSites().filter(s => CNS.has(compartmentOf(s))).map(s => `${s.level}|${s.part}`))];

// --- 1: vocabularies are closed ---
{
  const badVessel = Object.entries(VASCULAR).filter(([, v]) => !VESSELS.includes(v.vessel));
  ok(`every vessel is in the declared vocabulary (${badVessel.length} bad)`, badVessel.length === 0,
     badVessel.map(([k, v]) => `${k}:${v.vessel}`).slice(0, 5).join(" · "));
  const badSeg = Object.entries(VASCULAR).filter(([, v]) => v.segment !== null && !SEGMENTS.includes(v.segment));
  ok(`every segment is in the declared vocabulary or null (${badSeg.length} bad)`, badSeg.length === 0,
     badSeg.map(([k, v]) => `${k}:${v.segment}`).slice(0, 5).join(" · "));
  const badZone = Object.entries(VASCULAR).filter(([, v]) => !ZONES.includes(v.zone));
  ok(`every zone is in the declared vocabulary (${badZone.length} bad)`, badZone.length === 0,
     badZone.map(([k, v]) => `${k}:${v.zone}`).slice(0, 5).join(" · "));
}

// --- 2: every `segment: null` is DELIBERATE, with a reason ---
// A null must never be an unfilled cell. Same shape as NOT_LOCALISING_BY_DESIGN in score.js.
{
  const nulls = Object.entries(VASCULAR).filter(([, v]) => v.segment === null).map(([k]) => k);
  const unexplained = nulls.filter(k => !SEGMENT_NULL_REASON[k] || !String(SEGMENT_NULL_REASON[k]).trim());
  ok(`every null segment states a reason (${unexplained.length} unexplained of ${nulls.length})`,
     unexplained.length === 0, unexplained.slice(0, 6).join(" · "));
  const stale = Object.keys(SEGMENT_NULL_REASON).filter(k => VASCULAR[k] && VASCULAR[k].segment !== null);
  ok(`no reason is recorded for a key that HAS a segment (${stale.length} stale)`, stale.length === 0,
     stale.slice(0, 5).join(" · "));
  const orphanReason = Object.keys(SEGMENT_NULL_REASON).filter(k => !VASCULAR[k]);
  ok(`no reason is recorded for a key with no row at all (${orphanReason.length} orphaned)`,
     orphanReason.length === 0, orphanReason.slice(0, 5).join(" · "));
}

// --- 3: the collision the key format exists to prevent ---
// `lateral` is used at midbrain, pons, medulla, cord AND hypothalamus. Keying by part alone would give
// them one shared row and claim the lateral medulla is supplied by whatever the last writer put there.
{
  ok("lateral medulla and lateral midbrain have DIFFERENT rows",
     !!VASCULAR["medulla|lateral"] && !!VASCULAR["midbrain|lateral"] &&
     VASCULAR["medulla|lateral"].vessel !== VASCULAR["midbrain|lateral"].vessel);
  ok("lateral medulla is PICA (Wallenberg)", VASCULAR["medulla|lateral"]?.vessel === "PICA");
  ok("lateral cord is a cord-zone row, not a brainstem one", VASCULAR["cord|lateral"]?.zone === "cord");
  ok("lateral hypothalamus is a perforator row", VASCULAR["hypothalamus|lateral"]?.zone === "perforator");
}

// --- 4: vascularOf() resolves a site through the level|part key ---
{
  const site = candidateSites().find(s => s.id === "left_cortex_motor_facearm");
  const v = vascularOf(site);
  ok("vascularOf resolves a real site", !!v && v.vessel === "MCA" && v.segment === "M4");
  ok("vascularOf returns null for a site with no row", vascularOf({ level: "zz", part: "zz" }) === null);
}

// --- 5: TOTAL COVERAGE — every CNS level|part key has a row, and no row is orphaned ---
// This is the invariant that stops a newly added site from silently falling through.
{
  const missing = cnsKeys.filter(k => !VASCULAR[k]);
  ok(`every CNS level|part key has a vascular row (${missing.length} missing of ${cnsKeys.length})`,
     missing.length === 0, missing.slice(0, 10).join(" · "));
  const orphan = Object.keys(VASCULAR).filter(k => !cnsKeys.includes(k));
  ok(`no vascular row exists for a key the model does not produce (${orphan.length} orphans)`,
     orphan.length === 0, orphan.slice(0, 10).join(" · "));
}

// --- 6: the branch-level resolution this table exists to provide ---
// The owner's reported case turns on ACA-A4 vs MCA-M4 being different segments.
{
  ok("motor leg is ACA A4", VASCULAR["cortex|motor_leg"]?.segment === "A4");
  ok("motor face/arm is MCA M4", VASCULAR["cortex|motor_facearm"]?.segment === "M4");
  ok("they are different segments", VASCULAR["cortex|motor_leg"].segment !== VASCULAR["cortex|motor_facearm"].segment);
  const withSeg = Object.values(VASCULAR).filter(v => v.segment !== null).length;
  ok(`a substantial share of keys carry a real segment (${withSeg} of ${Object.keys(VASCULAR).length})`, withSeg >= 30);
}

for (const l of log) console.log(`${l.ok ? "PASS" : "FAIL"}  ${l.label}${l.detail && !l.ok ? `  [${l.detail}]` : ""}`);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

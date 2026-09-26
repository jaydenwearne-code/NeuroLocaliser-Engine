// why.test.js — the integrated Why (spec 2026-09-26): stations, side reasons, and the reasoning chain.
import { candidateSites } from "../src/engine/inverse.js";
import { STATIONS, STATION_ORDER, STATION_GROUP, AXIS, stationOf } from "../src/model/stations.js";

let pass = 0, fail = 0;
const ok = (l, c, d = "") => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l + (c ? "" : `  ${d}`)); };
const cs = candidateSites();
const byId = id => cs.find(s => s.id === id);

// ---- 1: stations ----
{
  const unmapped = [...new Set(cs.filter(s => !stationOf(s)).map(s => `${s.level}|${s.part}`))];
  ok(`every candidate site maps to a station (${cs.length} sites)`, unmapped.length === 0, unmapped.join(", "));
  const known = new Set(STATION_ORDER);
  ok("every mapped station is a declared station", cs.every(s => known.has(stationOf(s))));
  ok("every station has a group", STATIONS.every(s => ["hemisphere", "brainstem", "cerebellum", "cord", "peripheral"].includes(s.group)));
  ok("the axis is an ordered subset of the stations", AXIS.every((a, i) => i === 0 || STATION_ORDER.indexOf(a) > STATION_ORDER.indexOf(AXIS[i - 1])));
  ok("the brainstem stays split by level (Weber midbrain, Wallenberg medulla)",
     stationOf(byId("left_midbrain_medial")) === "midbrain" && stationOf(byId("left_medulla_lateral")) === "medulla");
  ok("a part override beats its level (the VPL thalamus is thalamus, not deep white matter)",
     stationOf(byId("left_subcortex_thalamus")) === "thalamus" && stationOf(byId("left_subcortex_internal_capsule")) === "deep white matter");
  ok("the optic-nerve sites are visual pathway, not cranial nerve", stationOf(byId("left_skull_base_optic_neuritis")) === "visual pathway");
  ok("a group per station, keyed by id", STATION_GROUP["medulla"] === "brainstem" && STATION_GROUP["nerve root"] === "peripheral");
}

console.log(`\nintegrated why: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

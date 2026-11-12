// duplicate-keys.test.js — no authored table may define a key twice. A JS object literal keeps the LAST definition of a
// repeated key without a word, so the earlier one is dead content that still reads as reviewed. Four had shipped
// (found 2026-11-12):
//   - the phonebook's temporoparietal entry, whose dead copy held the NON-DOMINANT name — so a non-dominant lesion (sensory
//     aprosodia alone) was titled "Wernicke's aphasia" and carried the jargon-aphasia stroke flag;
//   - two more phonebook entries (medial prefrontal, orbitofrontal) whose dead copies held nothing the cause lists lack;
//   - the internal capsule's curated region-B workup (2026-08-10), overridden ever since by a terse entry further down
//     (urgent, "Stroke team / TIA clinic.").
// A duplicate is invisible at runtime, so this reads the SOURCE with a small tokenizer (strings, template literals,
// comments, regex literals and nesting, so several keys on one line are counted), and checks the scan against every
// exported table's runtime keys, so a scan that stops seeing keys fails here instead of passing silently.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { BY_SITE, nameForSite } from "../src/data/syndromes.js";
import { NEXT, nextStepsFor } from "../src/data/nextSteps.js";
import { PATHOLOGY_NEXT } from "../src/data/pathologyNextSteps.js";
import { candidateSites } from "../src/engine/inverse.js";
import { plainSiteName } from "../app/labels.js";

let pass = 0, fail = 0;
const log = [];
const ok = (label, cond, detail) => { log.push({ label, ok: !!cond, detail }); cond ? pass++ : fail++; };
const ROOT = fileURLToPath(new URL("..", import.meta.url));

// The depth-1 keys of the object literal whose "{" is src[open] ([{ name, line }]), and how many spreads and computed keys
// it has. A quoted key and a bare key with the same text are the same property, so both read as `name`.
function literalKeys(src, open) {
  const keys = [], lineOf = idx => src.slice(0, idx).split("\n").length;
  let i = open + 1, depth = 1, prev = "{", expectKey = true, spreads = 0, computed = 0;
  const tplClose = []; // the depth at which each open ${ … } returns to its template literal
  const skipTemplate = j => { // from inside a template literal: its end, or the next ${
    while (j < src.length) {
      if (src[j] === "\\") { j += 2; continue; }
      if (src[j] === "`") return { end: j + 1 };
      if (src[j] === "$" && src[j + 1] === "{") return { expr: j + 2 };
      j++;
    }
    return { end: j };
  };
  const skipBlank = j => {
    for (;;) {
      while (j < src.length && /\s/.test(src[j])) j++;
      if (src[j] === "/" && src[j + 1] === "/") { j = src.indexOf("\n", j); if (j < 0) return src.length; continue; }
      if (src[j] === "/" && src[j + 1] === "*") { j = src.indexOf("*/", j + 2) + 2; continue; }
      return j;
    }
  };
  const enterTemplate = r => { if (r.expr !== undefined) { tplClose.push(depth); depth++; i = r.expr; prev = "{"; } else { i = r.end; prev = "s"; } };
  while (i < src.length && depth > 0) {
    i = skipBlank(i); if (i >= src.length) break;
    const ch = src[i];
    if (ch === '"' || ch === "'") {
      let j = i + 1; while (j < src.length && src[j] !== ch) { if (src[j] === "\\") j++; j++; }
      if (depth === 1 && expectKey) { if (src[skipBlank(j + 1)] === ":") keys.push({ name: src.slice(i + 1, j).replace(/\\(.)/g, "$1"), line: lineOf(i) }); expectKey = false; }
      i = j + 1; prev = "s"; continue;
    }
    if (ch === "`") { if (depth === 1) expectKey = false; enterTemplate(skipTemplate(i + 1)); continue; }
    if (ch === "/") { // a regex literal, unless it follows a value (then it is a division)
      if (/[\w$)\]]/.test(prev) || prev === "s") { i++; prev = "/"; continue; }
      let j = i + 1, inClass = false;
      while (j < src.length) { const c = src[j]; if (c === "\\") { j += 2; continue; } if (c === "[") inClass = true; else if (c === "]") inClass = false; else if (c === "/" && !inClass) break; j++; }
      j++; while (/[a-z]/.test(src[j])) j++;
      i = j; prev = "s"; if (depth === 1) expectKey = false; continue;
    }
    if (/[\w$]/.test(ch)) {
      let j = i; while (j < src.length && /[\w$.]/.test(src[j])) j++;
      if (depth === 1 && expectKey) { if (/[:,}(]/.test(src[skipBlank(j)] || "")) keys.push({ name: src.slice(i, j), line: lineOf(i) }); expectKey = false; }
      i = j; prev = "w"; continue;
    }
    if (src.startsWith("...", i)) { if (depth === 1 && expectKey) { spreads++; expectKey = false; } i += 3; prev = "."; continue; }
    if (ch === "{" || ch === "(" || ch === "[") { if (depth === 1 && expectKey && ch === "[") { computed++; expectKey = false; } depth++; i++; prev = ch; continue; }
    if (ch === "}" || ch === ")" || ch === "]") {
      depth--; i++; prev = ch;
      if (ch === "}" && tplClose.length && tplClose[tplClose.length - 1] === depth) { tplClose.pop(); enterTemplate(skipTemplate(i)); }
      continue;
    }
    if (ch === "," && depth === 1) { expectKey = true; i++; prev = ","; continue; }
    i++; prev = ch;
  }
  return { keys, spreads, computed };
}
// Every top-level table: `const NAME = {` (exported or not) and `export default {`.
const tablesIn = src => [...src.matchAll(/^(export\s+)?(?:const\s+([A-Za-z_$][\w$]*)\s*=|default)\s*\{/gm)].map(m => {
  const open = m.index + m[0].length - 1;
  return { name: m[2] || "default", exported: !!m[1], empty: /^\{\s*\}/.test(src.slice(open)), ...literalKeys(src, open) };
});
const dupsOf = keys => { const at = new Map(); for (const k of keys) at.set(k.name, [...(at.get(k.name) || []), k.line]); return [...at].filter(([, ls]) => ls.length > 1); };

// ---- 1. the scanner sees exactly what the engine sees (synthetic sources) ----
{
  const keysOf = src => JSON.stringify(tablesIn(src)[0].keys.map(k => k.name));
  ok("scanner: one key per line", keysOf("const T = {\n  a: 1,\n  b: 2,\n};") === '["a","b"]');
  ok("scanner: several keys on one line", keysOf("const T = {\n  a: 1, b: 2, c: 3,\n};") === '["a","b","c"]');
  ok("scanner: nested keys are not the table's keys", keysOf("const T = {\n  a: { b: 1, c: { d: 2 } },\n  e: [{ f: 1 }], g: fn({ h: 1 }),\n};") === '["a","e","g"]');
  ok("scanner: strings, comments, template literals and regexes neither hide a key nor fake one",
     keysOf('const T = {\n  a: "x: 1, y: 2", // b: 3\n  /* c: 4, */ d: `e: ${ { f: 1 }.f }`,\n  g: /h: [}{]/i, i: 1 / 2, j: 3,\n};') === '["a","d","g","i","j"]',
     keysOf('const T = {\n  a: "x: 1, y: 2", // b: 3\n  /* c: 4, */ d: `e: ${ { f: 1 }.f }`,\n  g: /h: [}{]/i, i: 1 / 2, j: 3,\n};'));
  ok("scanner: a quoted key is the same key as a bare one", dupsOf(tablesIn('const T = {\n  a: 1,\n  "a": 2,\n};')[0].keys).length === 1);
  ok("scanner: a key repeated far below its first definition is found (the shape of all four)",
     JSON.stringify(dupsOf(tablesIn(`const T = {\n  a: {\n    name: "x",\n  },\n  b: 0,\n${Array.from({ length: 50 }, (_, n) => `  k${n}: ${n},\n`).join("")}  a: { name: "y" },\n};`)[0].keys)) === '[["a",[2,56]]]');
  const t = tablesIn("const T = {\n  ...A, [k]: 1, b: 2,\n};\nexport default {\n  c: 1,\n};\nexport const E = {};")[0];
  ok("scanner: spreads and computed keys are counted apart from keys", t.spreads === 1 && t.computed === 1 && keysOf("const T = {\n  ...A, [k]: 1, b: 2,\n};") === '["b"]');
  ok("scanner: finds `export default {` tables and marks an empty registry", JSON.stringify(tablesIn("const T = {\n  b: 2,\n};\nexport default {\n  c: 1,\n};\nexport const E = {};").map(x => [x.name, x.exported, x.empty])) === '[["T",false,false],["default",true,false],["E",true,true]]');
}

// ---- 2. no table in src/ or app/ defines a key twice — and the scan equals the runtime keys ----
const files = [];
const walk = d => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (p.endsWith(".js")) files.push(p); } };
walk(join(ROOT, "src")); walk(join(ROOT, "app"));
let tables = 0, exact = 0; const mismatch = [], exactNames = new Set();
const pathologyDefs = new Map(); // plan name -> where it is written
for (const f of files.sort()) {
  const rel = relative(ROOT, f), src = readFileSync(f, "utf8"), found = tablesIn(src);
  if (!found.length) continue;
  tables += found.length;
  const dups = found.flatMap(t => dupsOf(t.keys).map(([k, ls]) => `${t.name}: "${k}" at lines ${ls.join(", ")}`));
  ok(`${rel}: no table defines a key twice`, !dups.length, dups.join("; "));
  let mod = null; try { mod = await import(pathToFileURL(f).href); } catch { /* DOM-bound (app.js) */ }
  for (const t of found) {
    if (!t.exported || t.empty || t.spreads || t.computed || !mod) continue;
    const obj = mod[t.name]; if (!obj || typeof obj !== "object" || Array.isArray(obj)) continue;
    const rt = new Set(Object.keys(obj)), sc = new Set(t.keys.map(k => k.name));
    const missing = [...rt].filter(k => !sc.has(k)), extra = [...sc].filter(k => !rt.has(k));
    if (missing.length || extra.length) mismatch.push(`${rel} ${t.name}: missing ${missing.slice(0, 3).join(", ")}${missing.length > 3 ? "…" : ""} extra ${extra.slice(0, 3).join(", ")}`);
    else { exact++; exactNames.add(`${rel}:${t.name}`); }
  }
  if (rel.startsWith(join("src", "data", "pathology"))) { // a plan is a default-export key or a family() member
    for (const t of found.filter(x => x.name === "default")) for (const k of t.keys) pathologyDefs.set(k.name, [...(pathologyDefs.get(k.name) || []), `${rel}:${k.line}`]);
    for (const m of src.matchAll(/family\(\s*"([^"]+)"\s*,\s*[\w$]+\s*,\s*\{/g))
      for (const k of literalKeys(src, m.index + m[0].length - 1).keys) pathologyDefs.set(k.name, [...(pathologyDefs.get(k.name) || []), `${rel}:${k.line} (${m[1]})`]);
  }
}
ok("every exported table the scan reads equals its runtime keys (a scanner miss would hide a duplicate)", !mismatch.length, mismatch.join("; "));
ok("the scan is not vacuous: 30+ exported tables read exactly, the phonebook and the workup among them",
   exact >= 30 && exactNames.has(join("src", "data", "syndromes.js") + ":BY_SITE") && exactNames.has(join("src", "data", "nextSteps.js") + ":NEXT"),
   `${exact} exact of ${tables} tables`);
{
  const twice = [...pathologyDefs].filter(([, w]) => w.length > 1).map(([k, w]) => `"${k}": ${w.join("; ")}`);
  ok("no pathology plan is written twice — across the ten category files and inside their families", !twice.length, twice.join(" | "));
  const read = [...pathologyDefs.keys()], runtime = Object.keys(PATHOLOGY_NEXT);
  ok("the pathology plans read from source are exactly PATHOLOGY_NEXT's (so a merged duplicate cannot hide)",
     read.length === runtime.length && read.every(k => k in PATHOLOGY_NEXT), `${read.length} read, ${runtime.length} at runtime`);
}

// ---- 3. what the duplicates hid ----
const site = id => candidateSites().find(s => s.id === id);
{ // the temporoparietal entry names each hemisphere (D1); the dominant side is the aphasia round's entry, unchanged (D2)
  const dom = site("left_cortex_temporoparietal"), non = site("right_cortex_temporoparietal"), opts = { dominantSide: "left" };
  ok("D1: a non-dominant temporoparietal lesion is named sensory aprosodia, not Wernicke's aphasia",
     nameForSite(non, opts).name === "Non-dominant temporoparietal syndrome (sensory aprosodia)" && plainSiteName(non, opts).name === nameForSite(non, opts).name, plainSiteName(non, opts).name);
  ok("D1: …and its red flag is not the jargon-aphasia stroke flag", nameForSite(non, opts).red === "Subtle; the deficit is in emotional communication rather than words.", nameForSite(non, opts).red);
  ok("D1: with right dominance set, the left side is the non-dominant one", nameForSite(dom, { dominantSide: "right" }).name === "Non-dominant temporoparietal syndrome (sensory aprosodia)");
  ok("D2: the dominant side keeps the aphasia round's name and flag",
     nameForSite(dom, opts).name === "Wernicke's aphasia (fluent; comprehension + repetition impaired)"
     && nameForSite(dom, opts).red === "Fluent jargon aphasia without weakness is easily missed as an acute stroke — image and consider thrombolysis.");
}
ok("D3: the medial prefrontal entry is the abulic-syndrome entry", BY_SITE.cortex_medial_pfc.name === "Medial prefrontal / anterior cingulate (abulic) syndrome");
ok("D4: the orbitofrontal entry is the disinhibition-syndrome entry", BY_SITE.cortex_orbitofrontal.name === "Orbitofrontal disinhibition syndrome");
{ // the internal capsule reads its region-B workup (D5)
  const p = nextStepsFor(site("left_subcortex_internal_capsule"));
  ok("D5: the internal capsule badges emergency, not urgent", NEXT.subcortex_internal_capsule.urgency === "emergency" && p.urgency === "emergency", p.urgency);
  ok("D5: …its referral is the hyperacute stroke pathway, not the TIA clinic",
     p.referral === "Acute stroke team — hyperacute pathway; a stuttering or crescendo deficit (capsular warning syndrome) needs admission, not reassurance.", p.referral);
  ok("D5: …glucose first and the time last known well are on its immediate steps",
     p.immediate.includes("Establish the exact time last known well for thrombolysis eligibility") && p.investigations.some(x => /^Bedside glucose FIRST/.test(x)), JSON.stringify(p.immediate));
}

console.log("\nNeuroLocaliser — DUPLICATE KEYS\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}${r.detail ? "  → " + r.detail : ""}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);

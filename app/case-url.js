// case-url.js — serialize/deserialize the shareable "case": the subset of app state that defines what a
// tester sees. Pure (no DOM), so unit-testable. The URL *hash* carries it (never a query string), so it
// never reaches a server log. Unknown / hand-edited tokens are dropped, never thrown on. See
// docs/superpowers/specs/2026-07-27-ed-stress-test-prototype-design.md.

import { COURSE_IDS } from "../src/model/course.js";

export function encodeCase(state) {
  const p = new URLSearchParams();
  const toks = [...(state.tokens || [])];
  if (toks.length) p.set("f", toks.join(","));
  if (state.onset) p.set("o", state.onset);
  if (state.course) p.set("c", state.course);
  if (state.mode && state.mode !== "localise") p.set("m", state.mode);
  if (state.selected) p.set("s", state.selected);
  if (state.selectedPathology) p.set("px", state.selectedPathology);
  if (state.selectedEntity) p.set("ux", state.selectedEntity);
  if (state.dominant && state.dominant !== "left") p.set("dom", state.dominant);
  if (state.sensoryLevel) p.set("sl", state.sensoryLevel);
  if (state.distalReach) p.set("dr", state.distalReach);
  const pins = [...(state.pinned || [])];
  if (pins.length) p.set("p", pins.join(","));
  return p.toString();
}

export function decodeCase(hash, opts = {}) {
  const validFindings = opts.validFindings || null; // null = accept any finding id
  const validSites = opts.validSites || null;       // null = accept any site id
  const validPathologies = opts.validPathologies || null; // null = accept any pathology name
  const validEntities = opts.validEntities || null;       // null = accept any entity name
  const out = {};
  let p;
  try { p = new URLSearchParams(String(hash || "").replace(/^#/, "")); } catch { return out; }
  const f = p.get("f");
  if (f) {
    const toks = f.split(",").map(t => t.trim()).filter(Boolean).filter(tok => {
      const [id, side] = tok.split("@");
      if (!id || !side) return false;
      if (validFindings && !validFindings.has(id)) return false;
      return true;
    });
    if (toks.length) out.tokens = new Set(toks);
  }
  const o = p.get("o"); if (o) out.onset = o;
  const cr = p.get("c"); if (cr && COURSE_IDS.has(cr)) out.course = cr;
  const m = p.get("m"); if (m === "localise" || m === "atlas" || m === "stroke") out.mode = m;
  const s = p.get("s"); if (s && (!validSites || validSites.has(s))) out.selected = s;
  const px = p.get("px");
  if (px && (!validPathologies || validPathologies.has(px))) out.selectedPathology = px;
  // `ux` is the CROSS-SITE entity named by the Together card — a different claim from `px`, which names a
  // pathology at ONE site, so the two are separate parameters and may both appear. `ux` has no meaning
  // outside the all-sites view, so its presence IS the scope; that is the parameter's definition, not an
  // inference. It degrades safely — a restored case with fewer than two sites never renders the combined
  // view at all, so the scope is simply unused.
  const ux = p.get("ux");
  if (ux && (!validEntities || validEntities.has(ux))) { out.selectedEntity = ux; out.scope = "all"; }
  const dom = p.get("dom"); if (dom === "left" || dom === "right") out.dominant = dom;
  const sl = p.get("sl"); if (sl) out.sensoryLevel = sl;
  const dr = p.get("dr"); if (dr) out.distalReach = dr;
  const pn = p.get("p");
  if (pn) {
    const ids = pn.split(",").map(t => t.trim()).filter(Boolean).filter(id => !validSites || validSites.has(id));
    if (ids.length) out.pinned = new Set(ids);
  }
  return out;
}

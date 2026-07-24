// neuraxis-diagram.js — build a schematic, DERIVED neuraxis SVG for the implicated tract(s). Pure string
// in → string out (no DOM), so it is unit-testable in node. Rostral (cortex) at top → caudal (cord) at
// bottom; each tract is a line down its course that visibly crosses sides at its decussation; each candidate
// lesion is a node (data-k=<site.id>) placed in its level's band; the selected node is emphasised
// (data-sel="1"). The app wires node clicks to selection. Theme-aware via currentColor + CSS vars.
import { NEURAXIS } from "../src/model/tracts.js";

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const ROW_H = 46, TOP = 24, LEFT_LANE = 46, RIGHT_LANE = 104, NODE_X = 150, W = 430;

export function neuraxisSVG(tracts, opts = {}) {
  if (!tracts || !tracts.length) return "";
  const { selectedId = null, labelFor = s => s.id } = opts;

  // rows = the union of course levels + candidate-site levels across implicated tracts, in NEURAXIS order
  const levelsUsed = new Set();
  for (const t of tracts) for (const wp of t.tract.course) levelsUsed.add(wp.level);
  for (const t of tracts) for (const s of t.sites) levelsUsed.add(s.level);
  const rows = NEURAXIS.filter(l => levelsUsed.has(l));
  const rowY = level => TOP + rows.indexOf(level) * ROW_H + ROW_H / 2;
  const H = TOP * 2 + rows.length * ROW_H;

  // level band labels
  const bands = rows.map(l =>
    `<text x="6" y="${rowY(l) + 4}" class="nx-band">${esc(l.replace(/_/g, " "))}</text>`).join("");

  // decussation markers (dashed line between the two levels, or within a level)
  const decu = tracts.map(t => {
    const d = t.decussation;
    let y;
    if (d.between) {
      const a = rows.indexOf(d.between[0]), b = rows.indexOf(d.between[1]);
      if (a < 0 || b < 0) return "";
      y = TOP + Math.max(a, b) * ROW_H + 2; // just above the caudal band
    } else if (d.inLevel) {
      const i = rows.indexOf(d.inLevel); if (i < 0) return "";
      y = rowY(d.inLevel);
    } else return "";
    return `<g class="decussation"><line x1="${LEFT_LANE}" y1="${y}" x2="${RIGHT_LANE}" y2="${y}" class="nx-decus"/>`
      + `<text x="${(LEFT_LANE + RIGHT_LANE) / 2}" y="${y - 3}" class="nx-decus-t">${esc(d.label || "decussation")}</text></g>`;
  }).join("");

  // one poly-line per tract, crossing lanes at the decussation
  const lines = tracts.map((t, ti) => {
    const crossLevel = t.decussation.between ? t.decussation.between[1] : t.decussation.inLevel;
    const crossIdx = rows.indexOf(crossLevel);
    const pts = t.tract.course.filter(wp => rows.includes(wp.level)).map(wp => {
      const i = rows.indexOf(wp.level);
      const lane = (crossIdx >= 0 && i >= crossIdx) ? RIGHT_LANE : LEFT_LANE; // below/at decussation → other lane
      return `${lane},${rowY(wp.level)}`;
    });
    return pts.length > 1 ? `<polyline points="${pts.join(" ")}" class="nx-tract nx-tract-${ti}"/>` : "";
  }).join("");

  // candidate site nodes (dedup by id across tracts), stacked within their level band so they do not overlap
  const seen = new Set(), nodes = [], stack = {};
  for (const t of tracts) for (const s of t.sites) {
    if (seen.has(s.site.id)) continue; seen.add(s.site.id);
    const k = s.level; stack[k] = (stack[k] || 0);
    const y = rowY(s.level) + stack[k] * 15 - 6; stack[k]++;
    const sel = s.site.id === selectedId ? ` data-sel="1"` : "";
    nodes.push(
      `<g class="nx-node${sel ? " sel" : ""}"${sel} data-k="${esc(s.site.id)}">`
      + `<circle cx="${NODE_X}" cy="${y}" r="4" class="nx-dot"/>`
      + `<text x="${NODE_X + 9}" y="${y + 4}" class="nx-label">${esc(labelFor(s.site))}</text></g>`);
  }

  return `<svg viewBox="0 0 ${W} ${H}" class="neuraxis" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="neuraxis tract diagram">`
    + bands + decu + lines + nodes.join("") + `</svg>`;
}

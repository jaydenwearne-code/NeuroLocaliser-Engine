// neuraxis-diagram.js — build a schematic, DERIVED neuraxis SVG for the implicated tract(s). Pure string
// in → string out (no DOM), so it is unit-testable in node. Rostral (cortex) at top → caudal (cord) at
// bottom; each tract is a line down its course that visibly crosses sides at its decussation; each candidate
// lesion is a node (data-k=<site.id>) placed in its level's band; the selected node is emphasised
// (data-sel="1"). Row heights grow with the number of candidate nodes at a level so labels never overlap.
// The app wires node clicks to selection. Theme-aware via CSS vars.
import { NEURAXIS } from "../src/model/tracts.js";

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const MIN_ROW_H = 40, TOP = 24, LEFT_LANE = 46, RIGHT_LANE = 104, NODE_X = 150, NODE_LH = 16, PAD = 16, W = 520;

export function neuraxisSVG(tracts, opts = {}) {
  if (!tracts || !tracts.length) return "";
  const { selectedId = null, labelFor = s => s.id } = opts;

  // rows = union of course levels + candidate-site levels, in NEURAXIS order
  const levelsUsed = new Set();
  for (const t of tracts) for (const wp of t.tract.course) levelsUsed.add(wp.level);
  for (const t of tracts) for (const s of t.sites) levelsUsed.add(s.level);
  const rows = NEURAXIS.filter(l => levelsUsed.has(l));
  const idxOf = l => rows.indexOf(l);

  // dedup candidate sites by id, grouped by level (tract order → stable stacking)
  const byLevel = {}, seen = new Set();
  for (const t of tracts) for (const s of t.sites) {
    if (seen.has(s.site.id)) continue; seen.add(s.site.id);
    (byLevel[s.level] ??= []).push(s);
  }

  // dynamic row heights: tall enough for each level's nodes
  const rowH = rows.map(l => Math.max(MIN_ROW_H, (byLevel[l]?.length || 0) * NODE_LH + PAD));
  const rowTop = []; let acc = TOP;
  for (let i = 0; i < rows.length; i++) { rowTop[i] = acc; acc += rowH[i]; }
  const H = acc + TOP;
  const rowCenter = l => { const i = idxOf(l); return rowTop[i] + rowH[i] / 2; };

  const bands = rows.map(l =>
    `<text x="6" y="${rowCenter(l) + 4}" class="nx-band">${esc(l.replace(/_/g, " "))}</text>`).join("");

  // decussation markers (between two bands, or within one)
  const decu = tracts.map(t => {
    const d = t.decussation; let y;
    if (d.between) {
      const a = idxOf(d.between[0]), b = idxOf(d.between[1]); if (a < 0 || b < 0) return "";
      y = rowTop[Math.max(a, b)]; // top edge of the caudal band
    } else if (d.inLevel) {
      const i = idxOf(d.inLevel); if (i < 0) return ""; y = rowCenter(d.inLevel);
    } else return "";
    return `<g class="decussation"><line x1="${LEFT_LANE}" y1="${y}" x2="${RIGHT_LANE}" y2="${y}" class="nx-decus"/>`
      + `<text x="${(LEFT_LANE + RIGHT_LANE) / 2}" y="${y - 3}" class="nx-decus-t">${esc(d.label || "decussation")}</text></g>`;
  }).join("");

  // one poly-line per tract, crossing lanes at the decussation
  const lines = tracts.map((t, ti) => {
    const crossLevel = t.decussation.between ? t.decussation.between[1] : t.decussation.inLevel;
    const crossIdx = idxOf(crossLevel);
    const pts = t.tract.course.filter(wp => rows.includes(wp.level)).map(wp => {
      const i = idxOf(wp.level);
      const lane = (crossIdx >= 0 && i >= crossIdx) ? RIGHT_LANE : LEFT_LANE; // below/at decussation → other lane
      return `${lane},${rowCenter(wp.level)}`;
    });
    return pts.length > 1 ? `<polyline points="${pts.join(" ")}" class="nx-tract nx-tract-${ti}"/>` : "";
  }).join("");

  // candidate site nodes, stacked within their (now tall-enough) level band
  const nodes = [];
  for (const l of rows) {
    (byLevel[l] || []).forEach((s, j) => {
      const y = rowTop[idxOf(l)] + PAD / 2 + j * NODE_LH + 6;
      const sel = s.site.id === selectedId ? ` data-sel="1"` : "";
      nodes.push(
        `<g class="nx-node${sel ? " sel" : ""}"${sel} data-k="${esc(s.site.id)}">`
        + `<circle cx="${NODE_X}" cy="${y}" r="4" class="nx-dot"/>`
        + `<text x="${NODE_X + 9}" y="${y + 4}" class="nx-label">${esc(labelFor(s.site))}</text></g>`);
    });
  }

  return `<svg viewBox="0 0 ${W} ${H}" class="neuraxis" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="neuraxis tract diagram">`
    + bands + decu + lines + nodes.join("") + `</svg>`;
}

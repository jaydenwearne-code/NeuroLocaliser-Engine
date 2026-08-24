// neuraxis-diagram.js — LOGIC ONLY. Turns engine output into a coronal anatomical figure. Pure string in →
// string out (no DOM), so it is unit-testable in node; interaction lives in app.js.
//
// DRIVEN BY CANDIDATE SITES, NOT BY TRACTS. The previous version harvested its sites from tractsFor(), so a
// picture with no implicated long tract had no sites and rendered "" — eight of the seventeen shipped
// examples, including Foot drop and Cauda equina. Tracts are now an OVERLAY.
import { MX, FIG_W, FIG_H, anchorFor, baseFigure, regionCaptions, SIDE_CAPTIONS, cropFor } from "./neuraxis-figure.js";
import { compartmentOf } from "../src/model/compartments.js";

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const FAN_MAX = 3;      // above this, a slot collapses to one counted pin
const FAN_STEP = 15;

// One candidate is always exactly ONE pin, so the numbering it shares with the index stays unambiguous.
// A bilateral candidate is told from a midline one by FORM (an elongated capsule), never by hue — the
// rule the danger chip already follows.
function pin(c, x, y, n, sel) {
  const wide = c.site.side === "bilateral";
  const shape = wide
    ? `<rect class="nx-dot" x="${x - 11}" y="${y - 6.5}" width="22" height="13" rx="6.5"/>`
    : `<circle class="nx-dot" cx="${x}" cy="${y}" r="7.5"/>`;
  // data-x records the pin's centre. The two shapes carry different geometry attributes (`cx` vs a left
  // edge `x`), so anything reading position off the shape would mis-handle bilateral pins.
  return `<g class="nx-pin${sel ? " sel" : ""}"${sel ? ' data-sel="1"' : ""} data-k="${esc(c.site.id)}" data-x="${x}">`
    + shape + `<text class="nx-n" x="${x}" y="${y + 3}">${n}</text></g>`;
}

const TRACT_DASH = ["none", "6 3", "2 3", "10 3 2 3", "1 4"];   // FORM, not hue alone

// Each implicated pathway drawn along its modelled course, on the correct side, crossing where the model
// records a decussation.
//
// INCREMENT 1 DRAWS THE COURSE AS MODELLED. Refining it to Last's — the medial lemniscus hugging the
// midline in the medulla then drifting laterally, the corticospinal tract breaking into bundles through
// the basis pontis — is increment 2, together with the three MISSING decussation entries. With today's
// data `cerebellar`, `mlf` and `trigeminothalamic` draw no crossing. That is the state today too, so it
// is not a regression; it is fixed with citations in increment 2.
function tractOverlay(tracts) {
  if (!tracts || !tracts.length) return "";

  const one = (t, i) => {
    const d = t.decussation || {};
    const crossAt = d.between ? d.between[1] : d.inLevel || null;
    // the side the pathway is drawn on before its crossing: whichever side this tract's findings came from
    const side = (t.sides || []).includes("left") ? "left" : "right";
    const other = side === "left" ? "right" : "left";
    const levels = t.tract.course.map(w => w.level);
    const crossIdx = crossAt ? levels.indexOf(crossAt) : -1;
    const pts = levels.map((lvl, k) => {
      const a = anchorFor(lvl, "-", crossIdx >= 0 && k >= crossIdx ? other : side);
      return `${a.x},${a.y}`;
    });
    if (pts.length < 2) return { path: "", mark: "" };
    const dash = TRACT_DASH[i % TRACT_DASH.length];
    const path = `<polyline class="nx-tract nx-tract-${i % 5}" points="${pts.join(" ")}"`
      + (dash === "none" ? "" : ` stroke-dasharray="${dash}"`)
      + ` marker-end="url(#nx-arrow)"/>`;
    // No modelled crossing → draw none. See the note above; oculosympathetic is CORRECTLY empty.
    if (crossIdx < 0) return { path, mark: "" };
    const a = anchorFor(crossAt, "-", side), b = anchorFor(crossAt, "-", other);
    const mark = `<g class="nx-decus"><line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/></g>`;
    return { path, mark };
  };

  const drawn = tracts.map(one);
  const legend = tracts.map((t, i) => {
    const dash = TRACT_DASH[i % TRACT_DASH.length];
    return `<g class="nx-legend-item"><line class="nx-tract nx-tract-${i % 5}" x1="0" y1="${i * 14}" x2="18" y2="${i * 14}"`
      + (dash === "none" ? "" : ` stroke-dasharray="${dash}"`)
      + `/><text class="nx-legend-t" x="24" y="${i * 14 + 3.5}">${esc(t.tract.id.replace(/_/g, " "))}</text></g>`;
  }).join("");

  return `<defs><marker id="nx-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5"`
    + ` orient="auto-start-reverse"><path d="M0 0 L8 4 L0 8 z" class="nx-arrowhead"/></marker></defs>`
    + drawn.map(d => d.mark).join("") + drawn.map(d => d.path).join("")
    + `<g class="nx-legend" transform="translate(14,${FIG_H - 20 - tracts.length * 14})">${legend}</g>`;
}

export function neuraxisSVG(candidates, tracts, opts = {}) {
  if (!candidates || !candidates.length) return "";
  const { selectedId = null } = opts;

  // number in solve()'s own order, so pin 1 is the leading candidate and the figure and the Where card
  // agree on which candidate is which. The index shares this numbering — there is no second ordering.
  const items = candidates.map((c, i) => ({ c, n: i + 1, comp: compartmentOf(c.site) }));

  // slot = level | side | zone. Up to FAN_MAX fan in place; above that the slot collapses.
  const slots = new Map();
  for (const it of items) {
    const a = anchorFor(it.c.site.level, it.c.site.part, it.c.site.side);
    it.a = a;
    const key = `${it.c.site.level}|${it.c.site.side}|${a.zone || "-"}`;
    if (!slots.has(key)) slots.set(key, []);
    slots.get(key).push(it);
  }

  let pins = "";
  for (const list of slots.values()) {
    const a = list[0].a;
    const sel = list.find(it => it.c.site.id === selectedId);
    if (list.length <= FAN_MAX) {
      list.forEach((it, j) => {
        const x = a.x + (j - (list.length - 1) / 2) * FAN_STEP * (it.c.site.side === "right" ? 1 : -1);
        pins += pin(it.c, x, a.y, it.n, it.c.site.id === selectedId);
      });
    } else {
      // THE FANNED PINS ARE STILL EMITTED, hidden by a class — app.js toggles `.open` on click, so no
      // interaction logic crosses into this pure builder. The index lists every candidate regardless:
      // a cluster is a drawing decision, never a filter on the differential.
      pins += `<g class="nx-cluster${sel ? " has-sel" : ""}" data-cluster="1">`
        + `<circle class="nx-dot nx-clusterdot" cx="${a.x}" cy="${a.y}" r="10"/>`
        + `<text class="nx-n" x="${a.x}" y="${a.y + 3.5}">${list.length}</text>`
        + `<g class="nx-fan">`
        + list.map((it, j) => {
            const col = j % 3, row = Math.floor(j / 3);
            const x = a.x + (col - 1) * FAN_STEP * (it.c.site.side === "right" ? 1 : -1);
            return pin(it.c, x, a.y + 18 + row * FAN_STEP, it.n, it.c.site.id === selectedId);
          }).join("")
        + `</g></g>`;
    }
  }

  const [vx, vy, vw, vh] = cropFor([...new Set(items.map(it => it.comp))]);
  const zoomed = vw < FIG_W * 0.95 || vh < FIG_H * 0.95;

  return `<svg viewBox="${vx} ${vy} ${vw} ${vh}" class="neuraxis" xmlns="http://www.w3.org/2000/svg"`
    + ` role="img" aria-label="neuraxis figure with candidate lesion sites">`
    + SIDE_CAPTIONS + baseFigure() + regionCaptions() + tractOverlay(tracts) + pins
    + (zoomed ? locator(vx, vy, vw, vh) : "")
    + `</svg>`;
}

// The crop buys detail at the cost of a stable frame. The locator buys the frame back: a whole-neuraxis
// thumbnail with the crop marked, so a peripheral case still says where it sits in the whole thing.
function locator(vx, vy, vw, vh) {
  const S = 0.13, w = FIG_W * S, h = FIG_H * S;
  const x = vx + vw - w - 8, y = vy + 8;
  return `<g class="nx-locator" aria-hidden="true">`
    + `<rect class="nx-loc-bg" x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/>`
    + `<rect class="nx-loc-box" x="${x + vx * S}" y="${y + vy * S}" width="${vw * S}" height="${vh * S}"/>`
    + `</g>`;
}

// The index carries EVERY candidate, whatever the figure collapses into a cluster — nothing is ever
// only-hidden. It is a separate export rather than appended to the SVG string: a function named …SVG must
// return an SVG, and the two are independently testable.
export function neuraxisIndex(candidates, opts = {}) {
  if (!candidates || !candidates.length) return "";
  const { selectedId = null, labelFor = s => s.id } = opts;

  const raw = candidates.map(c => labelFor(c.site));
  const seen = new Map();
  for (const r of raw) seen.set(r, (seen.get(r) || 0) + 1);

  const rows = candidates.map((c, i) => {
    // Two rows the reader cannot tell apart are a defect. plainSiteName() drops the side for some sites,
    // so a left/right pair collapses to one string — append the side where that happens, and ONLY there:
    // disambiguating every row would be noise.
    const label = seen.get(raw[i]) > 1 && (c.site.side === "left" || c.site.side === "right")
      ? `${raw[i]} — ${c.site.side}` : raw[i];
    const sel = c.site.id === selectedId;
    return `<li class="nx-row${sel ? " sel" : ""}" data-k="${esc(c.site.id)}"><b>${i + 1}</b>${esc(label)}</li>`;
  }).join("");

  return `<ol class="nx-idx">${rows}</ol>`;
}

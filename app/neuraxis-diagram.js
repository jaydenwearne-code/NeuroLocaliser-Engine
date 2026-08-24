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
    + SIDE_CAPTIONS + baseFigure() + regionCaptions() + pins
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

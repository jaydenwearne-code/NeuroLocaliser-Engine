// neuraxis-diagram.js — LOGIC ONLY. Turns engine output into a coronal anatomical figure. Pure string in →
// string out (no DOM), so it is unit-testable in node; interaction lives in app.js.
//
// DRIVEN BY CANDIDATE SITES, NOT BY TRACTS. The previous version harvested its sites from tractsFor(), so a
// picture with no implicated long tract had no sites and rendered "" — eight of the seventeen shipped
// examples, including Foot drop and Cauda equina. Tracts are now an OVERLAY.
import { MX, FIG_W, FIG_H, ANCHOR, anchorFor, tractPoint, viaAfter, breaksAfter, routeIsAuthored, baseFigure, regionCaptions, sideCaptions, cropFor } from "./neuraxis-figure.js";
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

// CENTRIPETAL Catmull-Rom (alpha = 0.5), sampled.
//
// Uniform parameterisation LOOPS where a course doubles back on itself, and two of these pathways
// genuinely do: the oculosympathetic descends to T1 and then ascends the carotid, and the cerebellar
// outflow climbs to the midbrain after entering at the medulla. A uniform spline puts a cusp at that
// reversal, and the overshoot crossed every neighbouring tract. Centripetal parameterisation is the
// standard cure — it cannot produce cusps or self-intersections.
function spline(k, per) {
  if (k.length === 2) return k;
  const P = [k[0], ...k, k[k.length - 1]], out = [];
  const dist = (a, b) => Math.pow(Math.hypot(b[0] - a[0], b[1] - a[1]) || 1e-6, 0.5);
  for (let i = 1; i < P.length - 2; i++) {
    const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
    const t0 = 0, t1 = t0 + dist(p0, p1), t2 = t1 + dist(p1, p2), t3 = t2 + dist(p2, p3);
    for (let sN = 0; sN < per; sN++) {
      const t = t1 + (t2 - t1) * (sN / per);
      const A1 = lerp(p0, p1, (t1 - t) / (t1 - t0 || 1), (t - t0) / (t1 - t0 || 1));
      const A2 = lerp(p1, p2, (t2 - t) / (t2 - t1 || 1), (t - t1) / (t2 - t1 || 1));
      const A3 = lerp(p2, p3, (t3 - t) / (t3 - t2 || 1), (t - t2) / (t3 - t2 || 1));
      const B1 = lerp(A1, A2, (t2 - t) / (t2 - t0 || 1), (t - t0) / (t2 - t0 || 1));
      const B2 = lerp(A2, A3, (t3 - t) / (t3 - t1 || 1), (t - t1) / (t3 - t1 || 1));
      const q = lerp(B1, B2, (t2 - t) / (t2 - t1 || 1), (t - t1) / (t2 - t1 || 1));
      // CLAMP THE CURVE TO ITS OWN KNOTS. Even centripetal parameterisation leaves the segment it is
      // interpolating, and lines that were correctly ordered at every knot still wove into each other
      // across a six-unit gap. Clamping makes the drawn geometry match what the lane-order check predicts
      // from linear interpolation, so that check becomes genuinely predictive instead of merely
      // suggestive.
      out.push([
        Math.min(Math.max(q[0], Math.min(p1[0], p2[0])), Math.max(p1[0], p2[0])),
        Math.min(Math.max(q[1], Math.min(p1[1], p2[1])), Math.max(p1[1], p2[1])),
      ]);
    }
  }
  out.push(k[k.length - 1]);
  return out;
}
const lerp = (a, b, wa, wb) => [a[0] * wa + b[0] * wb, a[1] * wa + b[1] * wb];

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
    const side = (t.sides || []).includes("left") ? "left" : "right";
    const other = side === "left" ? "right" : "left";
    const levels = t.tract.course.map(w => w.level).filter(l => ANCHOR[l]);
    const crossIdx = crossAt ? levels.indexOf(crossAt) : -1;
    // THE DECUSSATION SPLITS THE COURSE, and the half holding the tract's ORIGIN is the side its findings
    // came from. Which half that is depends on DIRECTION: `course` is written rostral-to-caudal for every
    // pathway, so a DESCENDING tract originates at the start of the array and an ASCENDING one at the end.
    // Ignoring direction drew the trigeminal nuclei contralateral and the thalamus ipsilateral — backwards,
    // and precisely the relationship the app teaches (ipsilateral face, contralateral body).
    const ascending = t.tract.direction === "ascending";
    const onOriginSide = k => (ascending ? k >= crossIdx : k < crossIdx);

    // EACH TRACT HAS ITS OWN LANE at each level (see TRACT_LANE). Sharing one anchor per level is what
    // made paths converge and cross where no decussation exists.
    // Order along the neuraxis unless the pathway authors its own route (see routeIsAuthored).
    const ordered = routeIsAuthored(t.tract.id) ? levels
      : [...levels].sort((a, b) => ANCHOR[a][1] - ANCHOR[b][1]);
    // A DECUSSATING TRACT IS DRAWN AS TWO STROKES MEETING AT THE MIDLINE, not one line weaving across it.
    // Threading a single path from a lateral lane on one side to the other made it sweep through every
    // lane in between — spinothalamic runs at dx 50 in the subcortex and crosses at the cord, so as one
    // stroke it cut across the whole left side on the way down. Two strokes meeting at the decussation say
    // the same thing and confine the traverse to the band where crossings are expected.
    const strokes = [[]];
    let prevSide = null;
    ordered.forEach((lvl, k) => {
      const sd = crossIdx < 0 ? side : (onOriginSide(levels.indexOf(lvl)) ? side : other);
      if (prevSide !== null && sd !== prevSide) {
        const yMid = ANCHOR[lvl][1];
        strokes[strokes.length - 1].push([MX, yMid]);
        strokes.push([[MX, yMid]]);
      }
      prevSide = sd;
      const pt = tractPoint(t.tract.id, lvl, sd);
      if (pt) strokes[strokes.length - 1].push(pt);
      for (const v of viaAfter(t.tract.id, lvl)) {
        const sign = sd === "right" ? 1 : -1;
        strokes[strokes.length - 1].push([MX + sign * v[0], ANCHOR[lvl][1] + v[1]]);
      }
      if (breaksAfter(t.tract.id, lvl) && k < ordered.length - 1) { strokes.push([]); prevSide = null; }
    });
    const usable = strokes.filter(st => st.length >= 2);
    if (!usable.length) return { path: "", mark: "" };

    // Sample a Catmull-Rom spline so the path FOLLOWS the neuraxis instead of chording between distant
    // levels — the owner's "your lines cut corners". Emitted as a dense polyline rather than a <path> so
    // the non-crossing invariant can read the actual geometry it draws.
    const dash = TRACT_DASH[i % TRACT_DASH.length];
    const path = usable.map((st, si) => {
      const pts = spline(st, 14);
      return `<polyline class="nx-tract nx-tract-${i % 5}" points="${pts.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ")}"`
        + (dash === "none" ? "" : ` stroke-dasharray="${dash}"`)
        + (si === usable.length - 1 ? ` marker-end="url(#nx-arrow)"` : "") + `/>`;
    }).join("");
    if (crossIdx < 0) return { path, mark: "" };
    const a = tractPoint(t.tract.id, crossAt, side), b = tractPoint(t.tract.id, crossAt, other);
    return { path, mark: `<g class="nx-decus"><line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/></g>` };
  };

  const drawn = tracts.map(one);
  return `<defs><marker id="nx-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5"`
    + ` orient="auto-start-reverse"><path d="M0 0 L8 4 L0 8 z" class="nx-arrowhead"/></marker></defs>`
    + drawn.map(d => d.mark).join("") + drawn.map(d => d.path).join("");
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
  const zoomed = vw < FIG_W * 0.95 || vh < FIG_H * 0.95;   // only worth a locator when really cropped

  return `<svg viewBox="${vx} ${vy} ${vw} ${vh}" class="neuraxis" xmlns="http://www.w3.org/2000/svg"`
    + ` role="img" aria-label="neuraxis figure with candidate lesion sites">`
    + sideCaptions([vx, vy, vw, vh]) + baseFigure() + regionCaptions([vx, vy, vw, vh]) + tractOverlay(tracts) + pins
    + (zoomed ? locator(vx, vy, vw, vh) : "")
    + `</svg>`;
}

// The crop buys detail at the cost of a stable frame. The locator buys the frame back: a real
// whole-neuraxis THUMBNAIL with the crop marked, so a peripheral case still says where it sits in the
// whole thing.
//
// TWO THINGS THIS GOT WRONG FIRST TIME, both found by looking at the rendered figure rather than by a
// test: (1) it drew its frame and the crop rectangle but NO mini-figure, so it was a meaningless empty
// box; (2) it was sized in FIGURE units while sitting in a CROPPED viewBox, so on a tight crop — cauda
// equina, 232 units wide — a 99-unit box swallowed 40% of the picture. It is now sized as a fraction of
// the CROP and redraws the same authored half, so there is still only one drawing.
function locator(vx, vy, vw, vh) {
  const w = vw * 0.2, k = w / FIG_W, h = FIG_H * k;
  const pad = vw * 0.02;
  // BELOW the side-caption band: at vy + pad the inset covered "patient's right".
  const x = vx + vw - w - pad, y = vy + pad + 22;
  return `<g class="nx-locator" aria-hidden="true">`
    + `<rect class="nx-loc-bg" x="${x}" y="${y}" width="${w}" height="${h}" rx="2"/>`
    + `<g class="nx-loc-fig" transform="translate(${x},${y}) scale(${k})">${baseFigure()}</g>`
    + `<rect class="nx-loc-box" x="${x + vx * k}" y="${y + vy * k}" width="${vw * k}" height="${vh * k}"/>`
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

// THE LEGEND IS TEXT, SO IT LIVES OUTSIDE THE DRAWING. Inside the SVG it had to be positioned against the
// crop, went out of view when that was computed from figure coordinates, and then sat on top of the pins
// once it did not. As HTML beside the figure it cannot cover anything, wraps on a narrow screen, and is
// selectable. Same reasoning as neuraxisIndex.
export function neuraxisLegend(tracts) {
  if (!tracts || !tracts.length) return "";
  const items = tracts.map((t, i) => {
    const dash = TRACT_DASH[i % TRACT_DASH.length];
    return `<li class="nx-leg"><svg class="nx-leg-swatch" viewBox="0 0 22 8" aria-hidden="true">`
      + `<line class="nx-tract nx-tract-${i % 5}" x1="1" y1="4" x2="21" y2="4"`
      + (dash === "none" ? "" : ` stroke-dasharray="${dash}"`) + `/></svg>`
      + esc(t.tract.label || t.tract.id.replace(/_/g, " ")) + `</li>`;
  }).join("");
  return `<ul class="nx-legend-list">${items}</ul>`;
}

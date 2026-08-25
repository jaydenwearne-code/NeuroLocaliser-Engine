"""trace.py — raster -> SVG contours, stdlib only.
Moore-neighbourhood border following on a 1-bit bitmap, then Ramer-Douglas-Peucker simplification.
Written because this machine has no PIL, no numpy and no potrace."""
import sys, math

def load(p):
    t = open(p).read().split("\n")
    w, h = map(int, t[0].split())
    return [t[1 + y] for y in range(h)], w, h

def derule(grid, w, h, min_run=22, max_width=3):
    """Erase leader RULES from the bitmap, before tracing.
    Filtering them afterwards does not work: a rule that touches the brain outline is traced as part of
    the SAME contour as the anatomy, so there is nothing to drop without dropping structure too. In the
    bitmap they are still separable — a rule is a long vertical run only a few pixels wide."""
    g = [list(r) for r in grid]
    killed = 0
    for x in range(w):
        y = 0
        while y < h:
            if g[y][x] != "1": y += 1; continue
            y2 = y
            while y2 < h and g[y2][x] == "1": y2 += 1
            run = y2 - y
            if run >= min_run:
                # how wide is the ink here? measure at a few sample heights
                wide = False
                for sy in range(y, y2, max(1, run // 5)):
                    span = 1
                    xx = x - 1
                    while xx >= 0 and g[sy][xx] == "1": span += 1; xx -= 1
                    xx = x + 1
                    while xx < w and g[sy][xx] == "1": span += 1; xx += 1
                    if span > max_width: wide = True; break
                if not wide:
                    for yy in range(y, y2): g[yy][x] = "0"
                    killed += 1
            y = y2
    print(f"de-ruled {killed} vertical runs")
    return ["".join(r) for r in g]

def trace(grid, w, h, min_pts=14):
    get = lambda x, y: 0 <= x < w and 0 <= y < h and grid[y][x] == "1"
    seen = [[False]*w for _ in range(h)]
    N = [(1,0),(1,1),(0,1),(-1,1),(-1,0),(-1,-1),(0,-1),(1,-1)]
    out = []
    for sy in range(h):
        for sx in range(w):
            if not get(sx, sy) or seen[sy][sx]: continue
            if get(sx-1, sy): continue                     # only start on a left edge
            contour, cx, cy, d = [], sx, sy, 6
            while True:
                seen[cy][cx] = True
                contour.append((cx, cy))
                found = False
                for k in range(8):
                    nd = (d + 6 + k) % 8
                    nx, ny = cx + N[nd][0], cy + N[nd][1]
                    if get(nx, ny):
                        cx, cy, d, found = nx, ny, nd, True
                        break
                if not found or (cx == sx and cy == sy) or len(contour) > 24000: break
            if len(contour) >= min_pts: out.append(contour)
    return out

def rdp(pts, eps):
    if len(pts) < 3: return pts
    a, b = pts[0], pts[-1]
    dx, dy = b[0]-a[0], b[1]-a[1]
    n = math.hypot(dx, dy) or 1e-9
    worst, wi = 0.0, 0
    for i in range(1, len(pts)-1):
        p = pts[i]
        d = abs(dy*p[0] - dx*p[1] + b[0]*a[1] - b[1]*a[0]) / n
        if d > worst: worst, wi = d, i
    if worst > eps:
        return rdp(pts[:wi+1], eps)[:-1] + rdp(pts[wi:], eps)
    return [a, b]

def to_path(pts, sx, sy):
    d = "M" + " L".join(f"{p[0]*sx:.1f},{p[1]*sy:.1f}" for p in pts)
    return d + " Z"

if __name__ == "__main__":
    src, dst = sys.argv[1], sys.argv[2]
    eps = float(sys.argv[3]) if len(sys.argv) > 3 else 1.1
    minpts = int(sys.argv[4]) if len(sys.argv) > 4 else 22
    grid, w, h = load(src)
    grid = derule(grid, w, h)
    cs = trace(grid, w, h, minpts)
    # THE LABEL-FREE PLATE STILL HAS ITS LEADER LINES. Gray717_without_text.png dropped the captions but
    # kept the rules that pointed at them, so the trace picks up long thin vertical strokes that are not
    # anatomy. A contour whose bounding box is very narrow and tall is a rule, never a structure.
    # Thresholding breaks a long rule into a column of DASHES, so a plain height test catches almost none
    # of them (3 of ~40 on the first pass). Filter on SHAPE instead: a thin, strongly vertical sliver is a
    # rule; anatomy is never that. Horizontal slivers are kept — the corpus callosum is one.
    def is_rule(c):
        xs = [p[0] for p in c]; ys = [p[1] for p in c]
        bw, bh = max(xs)-min(xs), max(ys)-min(ys)
        return bw <= 5 and bh >= 10 and bh >= bw * 3
    ruled = [c for c in cs if is_rule(c)]
    cs = [c for c in cs if not is_rule(c)]
    print(f"dropped {len(ruled)} leader rules")
    cs.sort(key=len, reverse=True)
    simp = [rdp(c, eps) for c in cs]
    simp = [c for c in simp if len(c) >= 4]
    paths = "".join(f'<path d="{to_path(c,1,1)}"/>' for c in simp)
    open(dst, "w").write(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" class="plate">'
        f'<g fill="none" stroke="var(--ink)" stroke-width="1" vector-effect="non-scaling-stroke">{paths}</g></svg>')
    print(f"contours={len(cs)} kept={len(simp)} points={sum(len(c) for c in simp)} -> {dst}")

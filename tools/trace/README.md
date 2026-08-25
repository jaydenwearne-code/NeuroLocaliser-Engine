# Raster → SVG tracer (build-time only)

Turns a **public-domain** anatomical plate into vector paths the app can theme, crop and highlight.
Nothing here ships or runs in the browser; the output SVG does.

**Why it exists.** Last's Anatomy is in copyright and cannot ship — it is read for anatomy, never copied.
Public-domain plates can, and where one exists only as a scan it has to be traced. This machine has no
PIL, no numpy and no potrace, so the two steps are written from scratch: Swift/AppKit reads the pixels,
stdlib Python follows the contours.

## Use

```
swiftc -O -o bitmap bitmap.swift
./bitmap Gray717_without_text.png bm.txt 520 140     # png -> 1-bit text bitmap, width 520, threshold 140
python3 trace.py bm.txt out.svg 1.0 22 0.55          # bitmap -> svg: RDP epsilon, min points, rule cover
```

## Two things learned doing it

**Downsample before thresholding.** A Gray plate is an engraving: at full resolution the hatching
thresholds into thousands of specks. Box-averaging to ~520px turns hatch into grey, and only real lines
survive the cut.

**Erase leader rules in the BITMAP, not after tracing.** The "without text" plates dropped their captions
but kept the rules that pointed at them. Filtering traced contours by shape caught only 3 of ~40, because
a rule that touches the brain outline is traced as part of the SAME contour as the anatomy — there is
nothing to drop without dropping structure. In the bitmap they are still separable.

**And decide per COLUMN, not per fragment.** A rule crossing a thick gyrus is interrupted for 20-60px
while it runs through dark anatomy. Grouping its hairline pixels with a small gap tolerance split one rule
into fragments that each looked too short to be a rule — column x=321 held 201 hairline pixels and not one
fragment survived the span test, so the rule stayed. What identifies a rule is that its hairline ink spans
most of the IMAGE (`cover`, default 0.55), however often anatomy interrupts it. That change took the
count from 15 rules removed to 35, and the vertical lines finally left the figure.

## Provenance

Every plate traced here must be public domain, and the licence must be verified through the Wikimedia
Commons API (`prop=imageinfo&iiprop=extmetadata`) rather than assumed. Record the source URL in the
`PLATES` registry in `app/plates.js`.

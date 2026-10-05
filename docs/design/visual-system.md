# Visual system

**Not yet established.** No page is built until this document holds the decided system. Two tickets
fill it, in order:

1. **E1-A1** (`1n1-studio` #2) decides the mark, wordmark and colourway. Its ADR in `1n1-studio`
   records the colour tokens for light and dark and the typeface.
2. **E2-F1** (`1n1-studio` #7) decides how the site uses them, from an options artifact the owner
   signs, and writes this document.

When written, it holds, as custom properties every stylesheet reads:

| Group | Tokens |
| --- | --- |
| colour | ground, surface, ink, muted ink, line, accent, and the accent's contrasting ink — each for light and dark |
| type | the display and body faces, a type scale of at most six sizes, line heights, measure |
| spacing | a scale of at most eight steps, the side gutter, the content max-width |
| shape | radii, border widths |
| motion | durations and easings, and the reduced-motion behaviour |
| layout | header, footer and page grids per template |

Rules that already hold, from the brief: the name is written `1n1`; the mark reads at 16 px; both
colour schemes are first-class; nothing loads from a third party.

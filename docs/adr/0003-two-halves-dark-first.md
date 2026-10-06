---
status: accepted
date: 2026-10-06
ticket: E2-F1
deciders: [owner]
supersedes: []
supersededBy: null
---

# 0003 — Lay the site out as two halves, dark first, with a theme toggle

> **Summary.** Every page is the 1n1 domino: one half holds the name, the line and the navigation,
> the other the content, with the domino's divider between them. Dark is the default; a toggle in the
> corner switches to light with an animated sun and moon, and remembers the choice. Pages animate
> in and between each other, and every app page has the same shape.

## Context

The owner chose direction A ("Two halves") on 2026-10-06 from five on the website board
(<https://claude.ai/artifact/2tyFd9NVcUTFQAjAfXTD56>, committed as `docs/design/7-website.html`),
and asked for dark by default and "a dark/light toggle in the corner with an animated switch/icon".
The identity itself, the domino mark, the 1·n·1 wordmark in Archivo and the fuchsia-teal colours, is
1n1-studio's ADR 0002.

## Decision drivers

- The page should be recognisably 1n1 with the content removed.
- Readability first on the privacy pages, which most visitors arrive at from a store listing.
- Both themes first-class, at phone and desktop widths.

## Decision

1. **Two halves.** From 760 px wide, the page is a grid of 5 : 8 px : 7. The left half holds the
   mark and wordmark, the line "Pocket-sized software made for humans." (the home page's `h1`, a
   paragraph elsewhere), the navigation and the contact address; it stays in view while the right
   half scrolls. The 8 px column between them is the domino's divider, in the page ground. Below
   760 px the half becomes a top block and inner pages show only the mark and navigation there.
2. **The halves trade colours with the theme.** Dark: the page is ink (`#06302E`) and the half paper
   (`#F2FAF8`). Light: the page is paper and the half ink. Fuchsia (`#EC3A86`) marks links, focus and
   the wordmark's dots; it never colours running text, which keeps every text pair above 4.5:1.
3. **Dark is the default**, set in the HTML. A one-line script in the head applies a saved choice
   before the first paint, so a light choice never flashes dark.
4. **The toggle** sits in the top-right corner, fixed, 44 px round. Its icon is a disc that a sliding
   cut-out turns into a crescent while eight rays fold away (moon, dark) or unfold (sun, light), over
   420 ms; with reduced motion it switches without moving. Its label names the action ("Switch to the
   light theme"). It is hidden without scripting.
5. **Archivo is self-hosted**, trimmed to weight 400–800, width 100–125 and the Latin the site uses
   (48 KB; `src/assets/fonts/README.md`).
6. **The site moves, and only as decoration** (owner, browser review, 2026-10-06: "nice animations
   … how everything loads in, navigation, hover effects, and something on the logo"). Blocks rise in
   on arrival; a page change is a cross-document view transition that holds the half still; cards
   rise as they scroll in; the domino spins in and turns over on hover; the new theme opens as a
   circle from the toggle. The domino is a toy: each flick of the pointer across it adds spin,
   friction slows it and a spring settles it upright, and a click squashes it and pops it spinning;
   the spin carries across a page change (`domino.js`). CSS does the rest, except the theme circle,
   which `theme.js` starts. With
   `prefers-reduced-motion` nothing moves, and a browser without view transitions changes pages and
   themes at once. `docs/design/visual-system.md` § Motion lists each moment.
7. **An app page has a fixed shape for every app:** heading with the store button (or the status until
   the listing is live), screenshots once released, the app's real features as cards, a panel for the
   paid tier when there is one, then details. The content file decides which parts appear; the
   template never changes for an app (`docs/runbooks/adding-an-app.md`). In a list, an app's whole
   row is its link; under the pointer its name underlines and its icon tilts.
8. **Every page but home starts with a back arrow** and, below the top level, the breadcrumb. The
   arrow's link goes one level up; with scripting, a visitor who came from another page of the site
   goes back to it instead (`back.js`).

## Alternatives considered

- **B. Tile run**: apps as domino tiles; strongest with several apps, a short run with one.
- **C. Data label**: the privacy summary as a food-style label; the heaviest look, kept as a later
  option for the summary table.
- **D. Big type**: the wordmark across the page; the name does the work but pushes the answer down
  on inner pages.
- **E. The usual**: a standard studio site; could belong to any studio.
- **Following the system theme by default**: the owner chose dark as the default instead.

## Consequences

- `src/assets/site.css` holds the tokens `docs/design/visual-system.md` documents; every colour
  there comes from three brand values.
- **Residual risk / what we accept** — the left half is mostly empty on short desktop pages; it is
  the design's signature and stays.

## Enforcement / verification

- `check:a11y` runs every page in both themes; contrast failures fail CI.
- `tests/theme.test.mjs` covers the toggle's reading, labelling and switching, and the theme circle's
  fallbacks.
- `check:a11y` audits every page at rest, with motion reduced.

## Related ADRs

- [ADR 0002](0002-build-with-eleventy-and-deploy-from-actions.md) — the build and the scripts rule.

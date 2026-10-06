# Visual system

Direction A, "Two halves", dark first (ADR 0003). The identity, the domino mark, the 1·n·1 wordmark
and the fuchsia-teal colours, is `1n1-studio`'s ADR 0002. `src/assets/site.css` defines every token
below as a custom property; stylesheets read them and never a literal.

## Colour

Three brand values; every token is one of them or a tint of one.

| Token | Dark (default) | Light | Use |
| --- | --- | --- | --- |
| `--ground` | `#06302E` ink | `#F2FAF8` paper | the page |
| `--text` | `#F2FAF8` | `#06302E` | running text, headings |
| `--muted` | `#A9C6C1` | `#3D5D59` | secondary text, captions |
| `--line` | `#1E4E4A` | `#C4DAD5` | rules, table lines |
| `--half-ground` | `#F2FAF8` | `#06302E` | the half (it trades with the page) |
| `--half-text` | `#06302E` | `#F2FAF8` | text on the half |
| `--accent` | `#EC3A86` fuchsia | same | link underlines, focus, the wordmark's dots, selection |

Fuchsia never colours running text: it reaches 3.6:1 on paper and 3.8:1 on ink, enough for
underlines, focus rings and large marks, not for body copy. Every text pair above passes 4.5:1, and
`check:a11y` holds that in both themes.

## Type

- **Face:** Archivo, self-hosted (`src/assets/fonts/`), weight 400–800, width 100–125. Headings and
  the wordmark at width 125 and weight 800; running text at width 100.
- **Scale:** `--step--1` 0.875rem, `--step-0` 1rem, `--step-1` 1.25rem, `--step-2` 1.75rem,
  `--step-3` clamp(2rem … 3.5rem), `--step-4` clamp(2.25rem … 4.25rem).
- **Line height:** 1.55 running text, 1.12 headings, 1.04 the line in the half.
- **Measure:** `--measure` 66ch.

## Spacing and shape

- **Space:** `--space-1` to `--space-8`: 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4rem.
- **Gutter:** `--gutter` clamp(1rem … 3.5rem); never under 16 px.
- **Radius:** app icons 22 percent; buttons and the toggle fully round.
- **The cut:** `--cut` 8 px, the divider between the halves.

## Motion

`--duration` 420 ms, `--ease` cubic-bezier(0.2, 0.7, 0.1, 1) for movement that settles, `--spring`
cubic-bezier(0.34, 1.56, 0.64, 1) for the playful moments that overshoot. ADR 0003 decision 6 sets what
moves:

| Moment | Motion |
| --- | --- |
| Arriving | each block in the content, and on a fresh visit the half, rises 16 px into place in turn, 70 ms apart |
| Changing page | a cross-document view transition: the half holds still, the content cross-fades |
| Scrolling | cards and Plus items rise as they enter the window (scroll-driven, where supported) |
| The domino | spins in on arrival; each pointer flick adds spin, friction slows it and it settles upright; a click squashes it and pops it spinning; hover grows it, and the growth fades slowly (`domino.js`) |
| Pointer | cards take the accent border and their pip grows; an app row (all of it a link) lifts and tints and its icon tilts; the button lifts onto an accent shadow; the back arrow nudges left; link underlines settle lower |
| Theme | the new theme opens as a circle from the toggle (view transition), and the icon morphs |

All of it sits in `@media (prefers-reduced-motion: no-preference)`: with reduced motion nothing moves,
and the page is identical at rest. `check:a11y` audits the page at rest for that reason.

## Cards and panels

- **Card:** `--card` 18 px radius, 2 px `--line` border, a 10 px accent pip at the top (the domino's).
  Features are cards.
- **The paid-tier panel:** the half's colours (`--half-ground`, `--half-text`), so it reads as the
  other side of the domino. Its items carry the same pip.
- **Screenshots:** a row that scrolls sideways and snaps to each phone, 160–220 px wide.

## Layout

| Width | Layout |
| --- | --- |
| under 760 px | the half is a top block (inner pages: mark and navigation only), then the cut, then the content |
| 760 px and up | `5fr 8px 7fr`: the half stays in view, the content scrolls beside it |

Page kinds, one template each (`src/_includes/`): home, apps list, app page (`app.njk`), contact,
privacy index and policy (`policy.njk`), and the 404 page. The theme toggle is fixed in the top-right
corner of every page.

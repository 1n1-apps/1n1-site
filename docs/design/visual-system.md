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

`--duration` 420 ms, `--ease` cubic-bezier(0.2, 0.7, 0.1, 1). The only motion is the theme toggle's
icon; with `prefers-reduced-motion` it switches without moving.

## Layout

| Width | Layout |
| --- | --- |
| under 760 px | the half is a top block (inner pages: mark and navigation only), then the cut, then the content |
| 760 px and up | `5fr 8px 7fr`: the half stays in view, the content scrolls beside it |

Page kinds, one template each (`src/_includes/`): home, apps list, app page (`app.njk`), contact,
privacy index and policy (`policy.njk`), and the 404 page. The theme toggle is fixed in the top-right
corner of every page.

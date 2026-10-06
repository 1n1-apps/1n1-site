# Web conventions

How pages in this repository are built, with Eleventy (ADR 0002). `visual-system.md` owns the
tokens these rules apply; `docs/runbooks/deploy.md` owns the build and hosting.

## Structure

- Keep content, structure and presentation apart: content in the content files the tooling defines,
  structure in templates, presentation in stylesheets. A page's content lives in its content file or
  `src/_data/site.json`. Templates and scripts hold only interface labels (navigation, section
  headings, table headers, the toggle's name), and each one is listed in `1n1-studio/copy/website.md`
  like any other string.
- One template per page kind (home, apps index, app page, contact, privacy policy). A new app is a
  content entry, not a new template.
- URLs are lowercase, hyphenated, without a file extension, and stable: `/`, `/apps`, `/apps/<app>`,
  `/contact`, `/privacy/<app>`. Changing a published URL needs an ADR and a redirect.

## HTML

- Semantic elements and landmarks: one `<main>`, a `<nav>` with an accessible name, `<header>` and
  `<footer>`, `<article>` or `<section>` with a heading.
- One `<h1>` per page; headings descend without skipping a level.
- Every image has an `alt` that says what it shows, or `alt=""` when decorative. The brand mark in
  the header is a link to `/` with the studio name as its text.
- Link text says where the link goes. Never "click here" or a bare URL as text.
- `<html lang>` is set; the viewport meta is `width=device-width, initial-scale=1`.
- Each page declares its `<title>` (page name, then `1n1`), a description, canonical URL and the
  share-card image from `docs/runbooks/brand-exports.md`.

## CSS

- Every colour, size, radius and font comes from `visual-system.md`'s tokens as custom properties.
  No literal colour in a stylesheet outside the token definitions.
- Both colour schemes are first-class: tokens are defined for dark (the default) and light, and the
  theme toggle switches between them (ADR 0003). Nothing is readable in one scheme only.
- Layout is fluid: a readable measure for text, a side gutter of at least 16 px at every width, no
  horizontal scrolling at 360 px, no fixed pixel widths on containers.
- No inline `style` attributes, no `!important`, no utility-class framework without an ADR. One
  exception: the brand mark is inlined from `1n1-studio`'s source SVG unchanged, and its `style`
  attributes carry the colour tokens that let it follow the theme.
- Fonts are self-hosted or system fonts. Nothing loads from a third-party host.

## Scripting

- Scripts are allowed where a page needs one (owner, 2026-10-06): static means no server, not no
  scripts. Use one only for behaviour HTML and CSS cannot give, and keep the page usable without it.
- Each script is unit-tested, type-checked by `bun run typecheck`, and named in an ADR when it changes
  how the site behaves. The first is the theme toggle (ADR 0003).
- No analytics, trackers, embeds, or requests to any host but the site's own.

## Accessibility

The bar is WCAG 2.2 AA. `bun run check:a11y` runs the automated part over the built output and fails
on any serious or critical finding; the plan names what it cannot check (reading order, meaning of
images, link context), and the browser review covers it.

- Text contrast at least 4.5:1, large text and UI parts 3:1, in both schemes.
- Focus is visible on every interactive element; keyboard reaches everything in a sensible order.
- Motion respects `prefers-reduced-motion`. No autoplay.
- Touch targets are at least 44 × 44 px.

## Performance

- A page transfers at most 100 KB excluding images, and at most 300 KB in all, on first load.
- Images are sized for their slot, served in a modern format with a fallback, and lazy-loaded below
  the fold. Share cards and favicons come from the brand generator at the sizes it defines.
- Nothing render-blocking from another origin, because nothing loads from another origin.

## Dependencies

- A new direct dependency, or a major upgrade, needs the owner's approval in the ticket, with the
  reason and the alternatives. Record the decision in the PR.
- Pin exact versions; commit `bun.lock`; install with `--frozen-lockfile` in CI. Build tooling is a
  dev dependency; the published site depends on nothing at runtime.
- Never trust a blocked lifecycle script to get a green install. `bun run deps:trust-check` reports
  one; a package that needs it is reviewed with the owner first.

## Testing

- Scripts and page logic have unit tests under `node --test` (`tests/`), written
  first, at 100 percent function coverage.
- The built output is checked, not the source: `check:links` for every internal link, asset and
  anchor; `check:a11y` for the rules above.
- Screenshots are evidence, not tests: captured from the built output at a phone width and a desktop
  width, light and dark, under `docs/evidence/issue-<n>-<slug>/`.

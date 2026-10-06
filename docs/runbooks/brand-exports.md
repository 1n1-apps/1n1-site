# Runbook: brand exports on the site

Every image of the studio's identity the site serves is generated in `1n1-studio/brand/` and copied
here. Nothing is drawn or edited in this repository.

## What the site uses

| Use | From `1n1-studio` | Where it goes |
| --- | --- | --- |
| favicon | `brand/exports/favicon/favicon.ico` | `src/favicon.ico` |
| favicon PNGs | `brand/exports/favicon/favicon-16.png`, `-32.png`, `-48.png` | `src/assets/brand/` |
| touch icon | `brand/exports/favicon/apple-touch-icon-180.png` | `src/apple-touch-icon.png` |
| share card | `brand/exports/site/share-card-1200x630.png` | `src/assets/brand/share-card.png` |
| header mark | `brand/mark.svg`, the source (its colour tokens follow the theme) | `src/_includes/mark.svg`, inlined by the `mark` shortcode |

The names on the left are set by the generator manifest in `1n1-studio` (its ADR 0002).

## Copying an export in

1. In `1n1-studio`, on `main`, run `bun run brand:check` so the exports are known to match their
   source. Note the commit SHA.
2. Copy the files listed above into their places here. Do not rename, resize or re-encode them.
3. Commit with a subject naming the studio commit, for example
   `chore: take brand exports from 1n1-studio 3f2a1c9`.
4. In the PR, cite that SHA on the `Changes` line.

A changed mark reaches the site this way and no other.

# Runbook: brand exports on the site

Every image of the studio's identity the site serves is generated in `1n1-studio/brand/` and copied
here. Nothing is drawn or edited in this repository.

## What the site uses

| Use | Export | Where it goes |
| --- | --- | --- |
| favicon | `favicon.ico`, `favicon-16.png`, `favicon-32.png`, `favicon.svg` | the site root |
| touch icon | `apple-touch-icon.png` (180 px) | the site root |
| header mark | `mark.svg` (the one-colour mark, inheriting `currentColor`) | the assets folder |
| share card | `share-card.png` (1200 × 630) | the assets folder, referenced by every page's meta |

The exact file names are set by E1-A1's generator manifest in `1n1-studio`; this table follows it.

## Copying an export in

1. In `1n1-studio`, on `main`, run `bun run brand:check` so the exports are known to match their
   source. Note the commit SHA.
2. Copy the files listed above into their places here. Do not rename, resize or re-encode them.
3. Commit with a subject naming the studio commit, for example
   `chore: take brand exports from 1n1-studio 3f2a1c9`.
4. In the PR, cite that SHA on the `Changes` line.

A changed mark reaches the site this way and no other.

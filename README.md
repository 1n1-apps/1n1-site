# 1n1 site

Source for the 1n1 website, served by GitHub Pages. **Everything in this repository is public.**

The site is the public half of the 1n1 studio. The private half, [`1n1-apps/1n1-studio`](https://github.com/1n1-apps/1n1-studio),
holds the product brief and amendments, the Issues, the brand source and the approved copy. Images
this site serves are generated there and copied in; copy comes from there approved.

Agents working here follow [`AGENTS.md`](AGENTS.md), the coding and delivery contract. The delivery
pipeline is the factory's `deliver-app-issue`; this repository carries no skills.

## Layout

| Path | Holds |
| --- | --- |
| `docs/product/` | A pointer to the brief and amendments in `1n1-studio`. |
| `docs/adr/` | The site's architecture decisions: tooling, hosting, URL scheme, conventions. |
| `docs/plans/` | One plan per ticket, reconciled against what shipped. |
| `docs/design/` | `web-conventions.md` (how pages are built) and `visual-system.md` (the tokens). |
| `docs/runbooks/` | Build and deploy, privacy policies, adding an app, taking brand exports. |
| `docs/audits/` | Periodic whole-site delivery audits. |
| `docs/evidence/` | Screenshots a ticket's plan names, per Issue. |
| `scripts/` | Commit, ADR and PR-body checks, the GitHub wrapper, the Project status helper. |
| `.github/` | Issue forms, the PR template, CI. |

## Commands

```sh
bun install
bun run format:check
bun run test
bun scripts/check-adr-format.mjs
```

`build`, `preview`, `lint`, `typecheck`, `check:links` and `check:a11y` arrive with the site tooling
([E2-A1](https://github.com/1n1-apps/1n1-studio/issues/6)); the site itself is
[E2-F1](https://github.com/1n1-apps/1n1-studio/issues/7). Work is tracked on the
[1n1 Studio Project](https://github.com/orgs/1n1-apps/projects/2).

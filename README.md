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
| `src/` | The site: layouts in `_includes/`, site data in `_data/`, one Markdown file per app (`apps/`) and per policy (`privacy/`), styles, scripts, fonts and images in `assets/`. |
| `tests/` | Unit tests for the checks, the theme toggle and the build config. |
| `scripts/` | `check-links` and `check-a11y`, the commit, ADR and PR-body checks, the GitHub wrapper, the Project status helper. |
| `.github/` | Issue forms, the PR template, `ci.yml` (checks) and `deploy.yml` (publishes `main`). |

## Commands

```sh
bun install
bun run build        # the site, into _site/
bun run preview      # http://localhost:8080
bun run test
bun run lint && bun run typecheck && bun run check:links && bun run check:a11y
```

## Adding an app

Add its icon, `src/apps/<app>.md` and its privacy policy (`src/privacy/<app>/v1.md` and the two pages
beside it), then build and check. No template changes. The steps are in [`docs/runbooks/adding-an-app.md`](docs/runbooks/adding-an-app.md).

## Updating a privacy policy

Whenever an app changes what it does with data, and before every store release, check the policy
against the app's code. A change is a new version, `src/privacy/<app>/v<n+1>.md`, in the same
delivery, never an edit to a live one. The steps are in [`docs/runbooks/privacy-policies.md`](docs/runbooks/privacy-policies.md).

## Deploying

The site is built with Eleventy and deployed to GitHub Pages on every push to `main`
(`docs/runbooks/deploy.md`); it was delivered by
[E2-F1](https://github.com/1n1-apps/1n1-studio/issues/7). Work is tracked on the
[1n1 Studio Project](https://github.com/orgs/1n1-apps/projects/2).

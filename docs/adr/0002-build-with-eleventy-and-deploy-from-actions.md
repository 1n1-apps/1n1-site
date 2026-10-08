---
status: accepted
date: 2026-10-06
ticket: E2-F1
deciders: [owner]
supersedes: []
supersededBy: null
---

# 0002 — Build the site with Eleventy and deploy it to GitHub Pages from Actions

> **Summary.** The site is plain HTML and CSS built by Eleventy from templates and one content file
> per app and policy, deployed to GitHub Pages by a workflow on every push to `main`. Scripts are
> allowed where a page needs one. Five development tools, all owner-approved, check what is built.

## Context

GitHub Pages serves static files only. The site has five kinds of page (home, apps, an app, contact,
a privacy policy) and grows by one app at a time; `docs/design/web-conventions.md` asks for content
apart from templates and "a new app is a content entry, not a new template". The owner chose static
over React on 2026-10-06, approved Eleventy, and approved axe-core, puppeteer-core, html-validate and
TypeScript as development tools for the checks the contract names.

## Decision drivers

- Plain HTML output, readable by any browser with or without scripting.
- Adding an app is one file, not edits to every page.
- As few dependencies as do the job, none of them shipped to visitors.

## Decision

1. **Eleventy 3.1.6 builds the site** from `src/` into `_site/`: Nunjucks layouts in
   `src/_includes/` (one per page kind), site data in `src/_data/site.json`, and one Markdown file per
   app (`src/apps/<app>.md`) and per policy (`src/privacy/<app>.md`) whose front matter the layouts
   render.
2. **Deploy is a workflow**, `.github/workflows/deploy.yml`: on every push to `main` it builds and
   publishes `_site` with GitHub's Pages actions, pinned by SHA. The repository's Pages source is
   "GitHub Actions"; the custom domain is set in the repository's Pages settings.
3. **Scripts are allowed where a page needs one** (owner, 2026-10-06: "static doesn't mean no
   scripts"). The site works without scripting; a script adds behaviour that HTML and CSS cannot,
   and is unit-tested. The first is the theme toggle (ADR 0003).
4. **The checks**: `lint` runs html-validate's recommended rules over the built HTML; `typecheck` runs
   TypeScript 7.0.2 in `checkJs` mode over the browser scripts; `check:links` (written here, no
   dependency) resolves every internal link, asset and anchor; `check:a11y` serves the build locally,
   opens every page in both themes in the installed Chrome through puppeteer-core 25.12.0, and fails
   on any serious or critical axe-core 4.14.0 finding against WCAG 2.2 A and AA. `coverage` holds the
   site's own code to 100 percent of functions. All are pinned exactly.

## Alternatives considered

- **Plain hand-written HTML**: no build at all, but every shared part (header, footer, head tags)
  copied into every page, and a new app means editing several files.
- **Astro**: also outputs plain HTML, with components, but pulls in a much larger tool chain for five
  page kinds.
- **A React app**: needs a client-side bundle to show text that HTML already shows; the owner chose
  static.
- **Deploying from a branch** (`gh-pages`): GitHub's older mode; the workflow keeps the built output
  out of the repository and runs the same build as CI.
- **pa11y or Lighthouse for accessibility**: each brings its own browser download or a larger
  dependency tree; axe-core is the engine both use, driven here by the Chrome already installed.

## Consequences

- `bun run build` produces the whole site; `bun run preview` serves it with live reload.
- A merge to `main` is a deploy; a revert of the merge is the rollback (`docs/runbooks/deploy.md`).
- **Residual risk / what we accept** — `check:a11y` needs a Chrome on the machine (CI's runner has
  one; `CHROME_PATH` points it elsewhere). The theme toggle is the one behaviour a visitor without
  scripting does not get; the site is dark for them.

## Enforcement / verification

- CI runs `typecheck`, `test`, `coverage`, `build`, `lint`, `check:links` and `check:a11y` on every
  pull request.
- `tests/` covers the checks and the page logic; `bun run coverage` fails under 100 percent of
  functions.

## Related ADRs

- [ADR 0003](0003-two-halves-dark-first.md) — the design this build renders.

## Amendment (2026-10-08, Meantime E16-T2): privacy policies are versioned files

A policy is no longer one file, `src/privacy/<app>.md`, edited in place. Each version is its own
frozen file, `src/privacy/<app>/v<n>.md`, published at `/privacy/<app>/v<n>/`; the policy's address
renders the latest through `src/privacy/<app>.njk`; and `/privacy/<app>/policy.json` publishes that
version's number, date and permissions table, which the app's release workflow compares with its
build. `src/privacy/frozen.json` and `tests/policy-versions.test.mjs` keep a live version from being
edited. Decided in Meantime's ADR 0306 decision 7 (the app repository); the procedure is
`docs/runbooks/privacy-policies.md` § Versions.

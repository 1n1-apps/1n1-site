# Runbook: build and deploy

The site is served by GitHub Pages from this repository, on the studio's domain over HTTPS. **The
tooling, build and deploy mechanism are decided by E2-A1** (`1n1-studio` #6) and recorded in its ADR;
until that merges, nothing deploys and this runbook names only what is fixed.

## Fixed by the brief

- Host: GitHub Pages, from `1n1-apps/1n1-site`, which is public for that reason.
- Domain: the custom domain E2-T1 registers, verified for Pages on the organization so no other
  repository can claim it, with HTTPS enforced.
- Source: `main`. A merge to `main` is a deploy; nothing deploys from a branch.
- Build: `bun run build` produces the whole site into the output folder `.gitignore` names; the
  output is never committed.

## To be filled by E2-A1

- The static tooling (plain HTML and CSS, or a generator) and why.
- The exact `build`, `preview`, `lint`, `typecheck`, `check:links` and `check:a11y` scripts, which
  `AGENTS.md` already names as the contract.
- The Pages workflow (`.github/workflows/deploy.yml`): build on push to `main`, upload the output,
  deploy with the Pages action, pinned by SHA like `ci.yml`.
- How to run a local preview for `review-site-in-browser`.
- How to roll back: revert the merge on `main`; the next deploy serves the previous output.

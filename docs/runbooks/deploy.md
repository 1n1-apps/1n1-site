# Runbook: build and deploy

The site is plain HTML and CSS built by Eleventy and served by GitHub Pages from this repository, on
`1n1.uk` over HTTPS (ADR 0002).

## Building and previewing

```sh
bun install
bun run build        # writes the whole site to _site/ (never committed)
bun run preview      # serves it at http://localhost:8080 with live reload, for a browser review
```

Before a pull request, run the checks CI runs: `bun run typecheck`, `test`, `coverage`, `lint`,
`check:links` and `check:a11y`. `check:a11y` needs Chrome; set `CHROME_PATH` if it is not in the usual
place.

## Deploying

- `.github/workflows/deploy.yml` builds and publishes `_site` on every push to `main`. A merge to
  `main` is a deploy; nothing deploys from a branch. Its actions are pinned by SHA like `ci.yml`.
- The repository's Settings → Pages: source **GitHub Actions**, custom domain `1n1.uk`, **Enforce
  HTTPS** on. `1n1.uk` is verified for Pages on the organization, so no other repository can claim
  it. `1n1-studio/records/github-pages.md` records each setting and the DNS records.
- A deploy shows in the repository's Actions tab and as the `github-pages` environment.

## Rolling back

Revert the merge on `main`. The revert's push deploys the previous output.

# AGENTS.md - 1n1 site contract

The always-loaded contract for working in this repository: what it holds, where the requirements and
decisions live, how to structure the code, and how a ticket becomes a reviewable pull request. The
delivery pipeline itself is `factory-control/skills/deliver-app-issue`; this file governs the code.

This is the public half of the 1n1 studio: the website, served by GitHub Pages. **Everything in this
repository is public**, including its history and pull requests. The studio's product truth (the
brief and amendments), its Issues, its brand source and its copy drafts live in the private
`1n1-apps/1n1-studio` repository, cloned beside this one. A website ticket is an Issue there; its
code lands here.

## Finish the whole ticket

One Issue produces one branch and one pull request that satisfies **every** acceptance criterion in it.

- Do not split a ticket across pull requests, and do not open a PR that knowingly leaves criteria unmet.
- Do not defer in-scope work to a "follow-up" Issue. If the Issue asks for it, build it now.
- Work that is genuinely out of scope, or blocked, is raised **before** the PR as a question to the
  owner — not recorded inside the PR as a deferral and not silently dropped.

The implementation plan at `docs/plans/<issue>-<slug>.md` is the checklist this is measured against.

## Read before editing

1. The assigned Issue in `1n1-studio` and its acceptance criteria.
2. `docs/plans/<issue>-<slug>.md` — the approved plan for this Issue.
3. `1n1-studio/docs/product/brief.md`, including its product revision, and every approved amendment
   under `1n1-studio/docs/product/amendments/` that touches the website — **read the most recent
   ones even when the Issue does not link them**.
4. The accepted ADRs in `docs/adr/` that govern this area.
5. `docs/design/web-conventions.md` for structure, HTML, CSS, scripting, accessibility and
   performance; `docs/design/visual-system.md` for the tokens, type and layout every page uses.
6. Only the runbooks under `docs/runbooks/` that apply: `deploy.md` before touching the build or
   hosting, `privacy-policies.md` before touching a policy, `adding-an-app.md` when an app joins the
   site.

If these sources conflict, or the work expands approved product scope, stop and surface the conflict.
Do not silently choose a new direction.

## Skill routing

Skills live in `factory-control/skills/` in the workspace; this repository carries none. Read the
matching `SKILL.md` in full before the corresponding action:

| Skill | Before |
| --- | --- |
| `design-a-surface` | **any** change a person sees — a page, a component, a layout or copy change |
| `review-site-in-browser` | the owner seeing a branch in their browser, and fixing what they find |
| `create-adr` | recording a load-bearing decision |
| `write-a-doc` | a substantive documentation change |
| `manage-environment` | configuration or credential changes |
| `commit` | committing |
| `code-review` | the pre-PR review |
| `resolve-review-comments` | acting on review feedback |

This contract selects the procedure; it does not replace the skill.

## Non-negotiable workflow rules

- Do not merge a pull request. A human reviews and merges.
- Work only on an Issue whose Project status is `Ready`, identified by an explicit owner handoff.
- Never set an Issue to `Ready`, `Done`, or `Dropped` from implementation work. Move only the
  handed-off Issue with `bun scripts/project-status.mjs <issue-number> <in-progress|in-review|blocked>`.
- Do not change product scope or the studio brief from an implementation task. Set the work
  `Blocked` and route the change through `steer-app`.
- Do not bypass hooks or checks with `--no-verify`.
- Obtain owner approval before adding a direct dependency or making a major upgrade. Follow
  `docs/design/web-conventions.md` § Dependencies.
- **Commit only what the site publishes.** No drafts, notes, records, credentials, owner source
  material, or anything the owner has not approved for public view. A privacy policy's facts come
  from the app's code, not from a private document.
- Never put a secret in this repository, in any form. It has no `.env`; the site needs none.
- Use `bun scripts/github.mjs git <args>` or `bun scripts/github.mjs gh <args>` for all GitHub work in
  this repository. The wrapper reads only the factory-issued, ignored, expiring `.env.agent.local`
  token. If it is absent or expired, reissue it from `factory-control`
  (`bun scripts/issue-app-agent-token.mjs 1n1-site <issue-number>`) and replace only the ignored
  worktree copy; never configure GitHub credentials directly.

## Content rules

- Images (favicons, share cards, logos) are generated in `1n1-studio/brand/` and copied in by
  `docs/runbooks/brand-exports.md`'s procedure. Never hand-edit one here.
- Copy comes from the approved strings in `1n1-studio/copy/`. Do not write new user-facing copy here
  without the owner's approval of the exact string.
- Use an app's store name (`Meantime`) on the site, never its codename.
- A privacy policy states what its app actually does, checked against the app's code and
  dependencies at the time of writing, and stays at its stable URL (`/privacy/<app>`) once it has
  been given to a store. `docs/runbooks/privacy-policies.md` owns the procedure.
- No analytics, trackers, third-party embeds, fonts loaded from a third party, or contact forms
  without an owner decision recorded in an ADR. Contact details appear as text.

## Decisions and ADRs

Record a load-bearing technical decision as an ADR **in the same PR as the code**: the site tooling,
the deploy mechanism, a URL scheme, a content-structure convention. Default to writing one; the bar
for skipping is high, and skipping requires naming the existing ADR this change extends.

**An ADR opened in a pull request is `accepted`, not `proposed`.** Draft it as `proposed` in its first
commit, reconcile it against what you actually built, then flip it to `accepted` before the PR opens.
`create-adr` has the full procedure and the skip test.

## Tests and evidence

Follow strict TDD in small slices for every script and every piece of logic (a build step, a
generated page, a data transform): write and run the failing test before the implementation, then
make it pass. Commits stay green.

Before review, audit the tests as a separate pass: enumerate every added or changed function, branch,
boundary case and error path, and map each to an assertion that would fail if the behaviour broke.
**Tests are thorough, not merely present.** 100 percent function coverage of code under `scripts/`
and the site's own logic is the floor.

### What proves a site ticket

| Check | Proves |
| --- | --- |
| `bun run build` | every page builds from source with no warnings |
| `bun run test` | the scripts and any page logic behave, with coverage |
| `bun run check:links` | no internal link, asset reference or anchor is broken in the built output |
| `bun run check:a11y` | the built pages pass the accessibility rules `docs/design/web-conventions.md` names, with no serious or critical finding |
| screenshots | each changed page at a phone width and a desktop width, in light and dark, captured from the built output and saved under `docs/evidence/issue-<n>-<slug>/` |
| browser review | what no automated check can see: the owner opens the branch through `review-site-in-browser`, where the plan calls for one |

There is no device, no emulator and no E2E tier. A defect the owner finds in a browser that a test
or a check could have caught is a test-suite defect: fix the suite alongside the bug.

### Required collateral

| When you change... | Include... |
| --- | --- |
| a script, a build step or page logic | a focused unit test |
| a page or component | the screenshots above, and a browser review where the plan names one |
| a privacy policy | the check against the app's current code and dependencies, recorded in the plan; the stable URL unchanged |
| an image | nothing by hand: regenerate in `1n1-studio` and copy in |
| a dependency or lockfile | the owner's approval and the reason, in the PR |
| a load-bearing technical decision | an accepted ADR in the same PR |
| a path under `docs/` | updates to every citation of that path |

## Commands

Verify the exact scripts in `package.json`.

```sh
bun install
bun run format:check
bun run lint
bun run typecheck
bun run test
bun run build
bun run preview          # serves the built site locally for a browser review
bun run check:links
bun run check:a11y
bun scripts/check-adr-format.mjs
bun scripts/check-pr-body.mjs .pr-body.md
```

`bun run coverage` holds the site's own code (`scripts/check-*.mjs`, `src/assets/*.js`,
`eleventy.config.js`) to 100 percent of functions. CI runs every command above; `check:a11y` needs a
Chrome (`CHROME_PATH` if it is not in the usual place). ADR 0002 records the tooling.

Run every long command with a log and a time-box, so a hung process is visible and recoverable. At
the time-box, inspect the log and the process rather than waiting longer.

## Coding conventions

- Follow `docs/design/web-conventions.md`: semantic HTML, CSS from the visual system's tokens, script
  only where a page cannot do without it, and the accessibility and performance rules there.
- Keep content, structure and presentation apart: content in the content files the tooling defines,
  structure in templates, presentation in stylesheets.
- Comment intent, invariants and non-obvious trade-offs. Cite a governing decision at load-bearing
  code with `// per ADR NNNN: <short reason>`.
- Keep changes focused on the assigned Issue; do not fold unrelated cleanup into the same PR.
- Use Mermaid for documentation diagrams. Never use ASCII art as a diagram.

## Branches, commits, and pull requests

- Implementation runs only in the provisioned worktree at `C:\tmp\1n1-worktrees\1n1-site-<issue>`,
  never in the primary checkout. A junction may exist at `1n1-apps\.worktrees\1n1-site-<issue>` so
  the owner can open mid-ticket documents; it is for reading, never for running commands.
- Branch `feature/<issue>-<slug>` from current `origin/main`. Pull requests target `main`.
- Commit subjects are exactly `type: summary` — one of `feat`, `fix`, `docs`, `style`, `refactor`,
  `perf`, `test`, `build`, `ci`, `chore`, `revert`. Never add a scope. `commit` has the full rules.
- Make many small commits: each one logical change, independently reviewable, green.
- **One thermonuclear review per ticket, before the PR opens, by a fresh reviewer — never by the
  author.** The PR opens only after that review resolves; never open one, including a draft, ahead
  of it.
- Draft the PR body at `.pr-body.md` from `.github/pull_request_template.md` — every section, the
  cross-repository close `Closes 1n1-apps/1n1-studio#<issue>`, and the evidence from the plan — and
  leave the review section for the review record. Submit it with `--body-file`, never `--body` with
  escapes. Validate it with `bun scripts/check-pr-body.mjs .pr-body.md` before submitting.
- Link evidence images by commit SHA or upload, never by branch ref.

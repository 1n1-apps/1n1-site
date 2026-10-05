# AGENTS.md - 1n1 site

This repository is the source of the 1n1 website, served by GitHub Pages. **Everything in it is
public**, including its history, Issues and pull requests. Brand source, copy drafts and setup records
live in the private `1n1-apps/1n1-studio` repository, cloned beside this one, and its `AGENTS.md`
governs studio work as a whole.

This is studio work, not app delivery. Do not use `deliver-app-issue` or any app workflow here.

## Where work comes from

Website tickets are Issues in `1n1-apps/1n1-studio`, not here, because a ticket can carry private
detail. They are tracked on the `1n1 Studio` Project (org Project #2). A pull request here closes its
ticket with `Closes 1n1-apps/1n1-studio#<n>`.

## Rules

- Commit only what the site publishes. No drafts, notes, records, credentials, or anything the owner has
  not approved for public view.
- Images (favicons, share cards, logos) are generated in `1n1-studio/brand/` and copied in. Never
  hand-edit one here.
- Copy comes from the approved copy in `1n1-studio/copy/`. Do not write new user-facing copy here
  without the owner.
- A privacy policy states what its app actually does. Check every claim against the app's code and
  dependencies at the time of writing, and keep each policy at a stable URL (`/privacy/<app>`) once it
  has been given to a store.
- Use the app's store name (such as Meantime) on the site, never its codename.
- No analytics, trackers, third-party embeds or contact forms without the owner's decision. Contact
  details appear as text.

## Git and GitHub

Work on a branch and open a pull request unless the owner asks for a direct commit to `main`. Follow
`factory-control/skills/commit` for commit messages. GitHub operations use the factory credential
through `factory-control/scripts/factory-gh.mjs`; never store a token in this repository.

## Not decided yet

The site's tooling, local preview and deploy steps are chosen by E2-A1
([1n1-studio #6](https://github.com/1n1-apps/1n1-studio/issues/6)), and documented here by E4-T1
([1n1-studio #12](https://github.com/1n1-apps/1n1-studio/issues/12)). Until then, the repository holds
only this file, `CLAUDE.md` and the README.

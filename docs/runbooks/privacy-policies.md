# Runbook: privacy policies

One policy per app, at `/privacy/<app>/`, where `<app>` is the store name lowercased
(`/privacy/meantime/`, as the brief fixes it). A store is given this URL once and it never changes.

## Versions

Each version of a policy is its own file and its own page, and is never edited once it is published
(Meantime's ADR 0306 decision 7, in the app repository).

**Published is not in force (owner, 2026-10-10).** An app's code merges weeks before its release, and
the policy has to match what people have installed, not what is on `main`. So a version is
**published** — its own page at `/privacy/<app>/v<n>/`, saying "published, not yet in force" — as
soon as its PR merges, and it is **promoted** to the version in force only when the release that
needs it ships. Promotion is one line in `src/_data/policiesInForce.json`, in its own PR.

| What | Where |
| --- | --- |
| Version `n`'s text, summary and permissions table | `src/privacy/<app>/v<n>.md`, published at `/privacy/<app>/v<n>/` |
| Which version is in force, and since when | `src/_data/policiesInForce.json`: per app, the versions promoted in order, each `{ "version": n, "from": "<release day>" }` |
| The policy's address, showing the version in force | `src/privacy/<app>.njk` (renders the last version promoted) |
| The version in force as data, for the app's release check | `/privacy/<app>/policy.json`, built by `src/privacy/<app>-policy.njk`; its `effective` is the day that version came into force |
| The digest of every published version | `src/privacy/frozen.json`; `tests/policy-versions.test.mjs` fails if a version file changes |

The build refuses a record that names a version with no file, promotes versions out of order, or
dates one before the last. Every page lists every version with when it was in force, or that it is
not yet.

A version's front matter carries `version`, the `summary` table, and `permissions`: every
Android permission the app's **release** build's merged manifest uses, each with `name`, `for` and
`refused`. The app's release workflow compares that list with its build and refuses a release when
they differ in either direction, so the table is complete, not a selection. The app's own
permissions (`<applicationId>.…`) are left out. Every page lists every version.

The digest freezes a version's **words and data**, its `.md` file. Its presentation comes from
templates every version shares (`src/_includes/policy.njk`, `policy-article.njk`,
`permissions-table.njk`); a change there restyles every version at once, which is allowed, but it
must never add, drop or reword what a version says.

## What a policy states

In this order, in plain words, specific to the app:

1. **Who.** The studio (`1n1`) and the contact address. The page states the version and when it
   came into force from the record; a version file carries no date of its own.
2. **What stays on the device.** The data the app creates and stores locally, and that it never
   leaves the device unless a later section says so.
3. **What leaves the device, and to whom.** Each destination by name: an ads SDK, a billing service,
   a weather provider, a crash reporter. For each: what is sent, why, and a link to that party's own
   policy. If nothing leaves the device, say so in one sentence.
4. **Permissions.** Each permission the app can ask for, why, and what happens when it is refused.
5. **Purchases and ads.** Whether the app shows ads, what the ads SDK receives, whether purchases
   exist and who processes them.
6. **Children.** Whether the app is directed at children (it is not, unless the brief says so).
7. **Deleting data.** How a person removes everything: uninstall, an in-app reset, or an export first.
8. **Changes.** That the policy may change, that the date at the top shows when, and that the history
   is in this repository.

Nothing in the policy is a promise the app does not keep. No boilerplate legalese, no "may collect"
hedging about things the app does not do.

## Where the facts come from

The app's code, never a document about it. Before writing or changing a policy, in the app's
repository:

- the permissions in the **merged** Android manifest of a build (under
  `android/app/build/intermediates/merged_manifest/`), which adds every dependency's permissions to
  the app's own; and the generated main manifest, to tell what a release build keeps from what only a
  debug build adds;
- `allowBackup` in that manifest: it decides whether Android's backup holds the app's data;
- every dependency that can make a network request, and what it sends (ads, billing, analytics,
  weather, crash reporting, fonts);
- the app's own data runbooks (storage, export, notifications, ads) and accepted ADRs;
- the app's in-app guide, which already answers "Which permissions does it ask for?".

Record the check in the plan: each statement in the policy, and the file or dependency it was
checked against. The site PR's description cites that record. The plan is public: name the app by its
store name and its repository as "the app repository", never by codename.

## Writing rules

- Store name in the text and the URL (`Meantime`, `/privacy/meantime/`); the codename never appears.
- Second person for the reader, the studio by name, contractions by default.
- Short sections with the headings above, so a person can find the one they came for.
- The date a version comes into force is the day its release ships, in ISO form, and it lives in
  `src/_data/policiesInForce.json`, not in the version file.

## Changing a policy

**The rule (owner, 2026-10-06):** an app and its policy never disagree.

- **In the app's ticket: publish.** Any change to what the app does with data, a new SDK that can
  make a request, a new permission, a new network endpoint, a change to what is stored or sent,
  carries a new policy version in the same delivery: a `1n1-site` PR, linked from the app's PR,
  written by this runbook. The two PRs link each other; the app PR's description names the policy PR,
  or says why the policy needs no change. The site PR has no studio Issue, so it's opened as a direct
  fix with the owner's own `gh` login. Its own `Privacy policy check` line cites the check. It
  **publishes the version and does not promote it**: `policiesInForce.json` is untouched, so it can
  merge as soon as it is ready, before or with the app's PR, and the live policy does not move.
- **At every release of an app: promote.** Before the build goes to a store, check the policy against
  the release (its permissions, its dependencies, its data runbooks). If the version the release
  needs is not the one in force, a promotion PR appends `{ "version": n, "from": "<release day>" }`
  to the app's list in `src/_data/policiesInForce.json`, and merges and deploys **before** the build
  is uploaded, so the policy people read never runs ahead of, or behind, the app they install. The
  app's release check then compares its build with `policy.json`, which is now that version. The
  release record names the version in force.
- **A change is a new version, never an edit.** Copy the latest `src/privacy/<app>/v<n>.md` to
  `v<n+1>.md`; set its `permalink` to `/privacy/<app>/v<n+1>/`, its `title` and `version: <n+1>`;
  make the change; add its digest to `src/privacy/frozen.json` (the test's failure message shows the
  value). Versions 1 and 2 of Meantime's carry an `effective` field from before this rule; it is
  frozen with them and not read.
- A version's file is fixed once it is published. Before that — in its own PR — it may still change;
  then recompute its digest.
- **Several versions may wait.** If two app changes each publish a version before either ships, the
  release promotes the newest one its build matches; a version that was never promoted stays
  published and says so.
- Before Meantime's first store submission the policy must be live at its final URL; after
  submission, a changed policy may also need re-declaring in the store's data-safety form. Tell the
  owner which, in the PR.

## What this runbook is not

Legal advice. The agent writes the facts; whether a jurisdiction needs more is the owner's call, and
they say so in the ticket.

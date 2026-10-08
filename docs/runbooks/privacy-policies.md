# Runbook: privacy policies

One policy per app, at `/privacy/<app>/`, where `<app>` is the store name lowercased
(`/privacy/meantime/`, as the brief fixes it). A store is given this URL once and it never changes.

## Versions

Each version of a policy is its own file and its own page, and is never edited once it is live
(Meantime's ADR 0306 decision 7, in the app repository):

| What | Where |
| --- | --- |
| Version `n`'s text, summary and permissions table | `src/privacy/<app>/v<n>.md`, published at `/privacy/<app>/v<n>/` |
| The policy's address, showing the latest version | `src/privacy/<app>.njk` (renders the highest `v<n>`) |
| The latest version as data, for the app's release check | `/privacy/<app>/policy.json`, built by `src/privacy/<app>-policy.njk` |
| The digest of every live version | `src/privacy/frozen.json`; `tests/policy-versions.test.mjs` fails if a version file changes |

A version's front matter carries `version`, `effective`, the `summary` table, and `permissions`: every
Android permission the app's **release** build's merged manifest uses, each with `name`, `for` and
`refused`. The app's release workflow compares that list with its build and refuses a release when
they differ in either direction, so the table is complete, not a selection. The app's own
permissions (`<applicationId>.…`) are left out. Every page lists every version.

## What a policy states

In this order, in plain words, specific to the app:

1. **Who.** The studio (`1n1`), the contact address, and the effective date.
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
8. **Changes.** That the policy may change, that the effective date shows when, and that the history
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
- The effective date is the date the change is deployed, in ISO form.

## Changing a policy

**The rule (owner, 2026-10-06):** an app and its policy never disagree.

- **In the app's ticket:** any change to what the app does with data, a new SDK that can make a
  request, a new permission, a new network endpoint, a change to what is stored or sent, carries a
  policy change in the same delivery: a `1n1-site` PR, linked from the app's PR, written by this
  runbook. The two PRs link each other; the app PR's description names the policy PR, or says why
  the policy needs no change. The site PR has no studio Issue, so it's opened as a direct fix with
  the owner's own `gh` login. Its own `Privacy policy check` line cites the check.
- **At every release of an app:** before the build goes to a store, check the policy against the
  release (its permissions, its dependencies, its data runbooks). If anything differs, the policy PR
  merges first, so the live policy is never behind the app people install.
- **A change is a new version, never an edit.** Copy the latest `src/privacy/<app>/v<n>.md` to
  `v<n+1>.md`; set its `permalink` to `/privacy/<app>/v<n+1>/`, its `title`, `version: <n+1>` and
  `effective` (the day it deploys); make the change; add its digest to `src/privacy/frozen.json`
  (the test's failure message shows the value). The policy's address and `policy.json` follow on
  their own. Tell the app's release which version is now in force: its release record names it.
- A version's file is fixed once it deploys. Before that — in its own PR — it may still change; then
  recompute its digest.
- Before Meantime's first store submission the policy must be live at its final URL; after
  submission, a changed policy may also need re-declaring in the store's data-safety form. Tell the
  owner which, in the PR.

## What this runbook is not

Legal advice. The agent writes the facts; whether a jurisdiction needs more is the owner's call, and
they say so in the ticket.

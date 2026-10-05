# Runbook: privacy policies

One policy per app, at `/privacy/<app>` using the app's codename slug in the path and its store name
in the text. A store is given this URL once and it never changes.

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

- the permissions in its app config and native manifests;
- every dependency that can make a network request, and what it sends (ads, billing, analytics,
  weather, crash reporting, fonts);
- the app's own data runbooks (storage, export, notifications, ads) and accepted ADRs;
- the app's in-app guide, which already answers "Which permissions does it ask for?".

Record the check in the plan: each statement in the policy, and the file or dependency it was
checked against. The PR's `Privacy policy check` line cites that record.

## Writing rules

- Store name in the text (`Meantime`), codename only in the URL.
- Second person for the reader, the studio by name, contractions by default.
- Short sections with the headings above, so a person can find the one they came for.
- The effective date is the date the change is deployed, in ISO form.

## Changing a policy

- A change to what the app does with data changes the policy in the same release, with a new
  effective date. Keep the URL. Git history is the record of previous versions.
- Before Meantime's first store submission the policy must be live at its final URL; after
  submission, a changed policy may also need re-declaring in the store's data-safety form. Tell the
  owner which, in the PR.

## What this runbook is not

Legal advice. The agent writes the facts; whether a jurisdiction needs more is the owner's call, and
they say so in the ticket.

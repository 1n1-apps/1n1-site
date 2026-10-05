<!--
  Every section is required. Write "N/A — <reason>" where one genuinely does not apply; a bare "N/A"
  is not a reason. GitHub does NOT apply this template to API- or CLI-created pull requests — build the
  body yourself, check it with `bun scripts/check-pr-body.mjs <file>`, and submit it with --body-file.
  This repository is public: the body is public too. Cite the Issue; never paste private detail from it.
-->

## Intent & approach

<What this change does and why, in a few sentences. What a reviewer should read first.>

## Traceability

- Closes: 1n1-apps/1n1-studio#<issue>
- Parent epic: 1n1-apps/1n1-studio#<epic>
- Delivery-map ID: <E2-F1>
- Plan: `docs/plans/<issue>-<slug>.md`
- Approved visuals: <the options artifact's link, its committed path under `docs/design/`, and the
  owner's pick IDs; `none — <no rendered output | the owner waived it on <date>>` otherwise>
- Product revision: <n>
- Amendments applied: <path(s) in `1n1-studio`, or `none — 1n1-studio/docs/product/amendments checked`>
- ADRs: <`ADR NNNN` (accepted in this PR), or one sentence naming the existing ADR this change extends
  and why nothing new was decided. A bare `N/A` is not acceptable.>

## Acceptance criteria

Every criterion from the Issue, from the plan's inventory. This PR closes the Issue, so every row is
met — if one is not, this PR is not ready to open.

| # | Criterion | Met | Evidence |
| --- | --- | --- | --- |
| 1 |  | ✅ | <test / check / screenshot / commit> |

## Changes

<The slices / commits, in order.>

## Evidence & risk

- **Tests:** <what ran, coverage result>
- **Build and checks:** <`build`, `check:links`, `check:a11y` results on the final head>
- **Browser review:** <none | the findings from a `review-site-in-browser` session and the commits
  that resolved them>
- **Screenshots:** <each changed page at a phone width and a desktop width, light and dark; link by
  commit SHA or upload, never `blob/<branch>/`>
- **Privacy policy check:** <for a policy change: what in the app's code and dependencies each
  statement was checked against; otherwise `none — no policy changed`>
- **Risk:** <what could break and its blast radius>

## Pre-PR thermonuclear review

- Reviewed diff: `<base>...<final head>`
- Final re-review: <no unresolved approval blockers>

| Severity | Finding | Resolution and verification |
| --- | --- | --- |
| <severity, or N/A> | <finding with file:line, or `No actionable findings`> | <fix commit and checks> |

## Checklist

- [ ] Every acceptance criterion in the Issue is met by this PR. Nothing in scope was deferred to a
      follow-up Issue.
- [ ] The change matches the plan, the product revision, the applicable amendments, and the Issue's
      non-goals; plan deviations are recorded in the plan's `Delivered` section.
- [ ] The load-bearing decision is an ADR in this PR with status `accepted` — or the `ADRs` line above
      names the existing ADR this extends.
- [ ] Strict TDD was followed: each behaviour test failed for the expected reason before implementation.
- [ ] The test audit covers every added or changed function, branch, error path and page; function
      coverage is 100% or a narrow exception is explained and owner-approved.
- [ ] The built pages pass the link and accessibility checks; screenshots match the final code.
- [ ] The built UI matches the artifact the owner approved — or the artifact was corrected,
      republished, and the difference named.  <!-- omit where the ticket owed no artifact -->
- [ ] Nothing private is in this PR: no draft, record, owner source material or credential. Images
      were generated in `1n1-studio` and copied, never hand-edited.
- [ ] Docs updated where this change invalidated them; dependency changes have the owner's approval.
- [ ] Many small commits, each `type: summary` with no scope, each green.

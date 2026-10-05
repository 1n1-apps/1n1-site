# Delivery audits

Periodic whole-project reconciliations, at `docs/audits/YYYY-MM-DD-delivery-audit.md`.

The factory coordinator produces these through `audit-app-delivery` in `factory-control`. An audit is
not run per ticket — it is run when the owner asks, typically after a run of merges, before a release,
or when the app and the roadmap have visibly drifted apart.

## What it is for

The per-ticket gates — the plan, reconciliation, review, and PR template — check one ticket against its
own contract. They cannot see what falls *between* tickets:

- an acceptance criterion a merged PR never actually met;
- work deferred "to a follow-up" that no follow-up ever covered;
- a bug that was flagged in a review or an Issue comment and never actioned;
- a screen, service, or decision that exists in code with no ADR recording it;
- documentation that contradicts what was built;
- an ADR merged while still `proposed`;
- planned tickets whose premise has quietly expired;
- the gap between what the app does and what the product direction says it should do.

An audit reads the whole delivery record at once and finds those.

## Shape of the record

Each audit is a point-in-time document. It is **never rewritten** — a later audit supersedes an earlier
one and links back to it. The findings stay true as of their date, which is what makes the series
useful: it shows whether the same gap keeps recurring.

The corrective tickets an audit proposes are its output. The audit document records what was found and
what was proposed; the Project records what was done about it.

## Reading order

| Question | Look at |
| --- | --- |
| What is broken or missing right now? | the newest audit's Findings |
| Was this gap known before? | earlier audits, by date |
| What was decided about it? | the tickets the audit created, linked from its Actions table |

| Audit | Date | Scope |
| --- | --- | --- |
| _none yet_ |  |  |

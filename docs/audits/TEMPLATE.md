# Delivery audit — <app> — <YYYY-MM-DD>

- **Scope:** Issues #<a>–#<b>, PRs #<a>–#<b>, product revision <n>, amendments <list>
- **Supersedes:** <previous audit path, or `none — first audit`>
- **Sources read:** <every ticket open and closed, their PRs, committed evidence, ADRs, design docs,
  runbooks, brief, amendments>

## Verdict

<Three or four sentences. Is the app where the product direction says it should be? What is the single
most important gap? Is the roadmap still describing reality?>

## Findings

Each finding is numbered and gets a corrective action in the table at the end. Severity is about
product and user impact, not effort.

### F1 — <short title>

- **Type:** missed feature / missed logic / missed persistence / deferred-never-done / unactioned bug /
  undocumented decision / documentation contradiction / unaccepted ADR / product drift
- **Severity:** high / medium / low
- **Evidence:** <the ticket, PR, file, screenshot, or doc that shows it — cite paths and #numbers>
- **What was supposed to happen:** <the acceptance criterion, ADR clause, or product statement>
- **What actually happened:** <the state of the code or docs now>
- **Impact:** <what a user or a future ticket hits because of this>
- **Proposed action:** <new ticket / amend ticket / close ticket / ADR / doc fix>

## Product review

Separate from defects: this is where the audit argues about the product itself.

### Direction check

| Product statement | Built state | Aligned? |
| --- | --- | --- |
| <from the brief or an amendment> | <what the app actually does> | ✅ / ⚠ / ❌ |

### Proposals

Opportunities and changes the owner has **not** asked for. Each is a proposal, not a decision — the
owner's product direction stands unless they change it.

- **<Proposal>** — <what it is, why it is worth doing now, what it would cost, what it would replace.>

### Questions for the owner

<Things the audit could not resolve without a product decision. Keep this short and answerable.>

## Ticket reconciliation

Open and planned tickets checked against the app as it exists now.

| Ticket | Current state | Proposed | Why |
| --- | --- | --- | --- |
| #<n> | Planned | amend | <its premise changed when #<m> shipped> |
| #<n> | Planned | close | <already delivered by #<m>> |

## Actions

Every finding and proposal resolves to exactly one row. Titles follow the ticket contract:
`E<n>-<S\|T\|B\|A><n>: <description>`, parented to an epic, next unused identifier.

| # | Action | Type | Title | Epic | From |
| --- | --- | --- | --- | --- | --- |
| 1 | create | Bug | `E3-B2: ...` | #10 | F1 |
| 2 | amend | Story | #<n> | #<n> | F3 |
| 3 | close | — | #<n> | — | reconciliation |

**Validation:** `bun scripts/check-tickets.mjs <slug>` passes against the proposed set.

## Not actioned

<Findings deliberately left alone, and why. An empty section is a valid answer; a missing one is not.>

---
status: proposed
date: YYYY-MM-DD
ticket: ABC-000
deciders: []
supersedes: []
supersededBy: null
---

# NNNN — Short imperative title

> **Summary.** One to three plain-language sentences: what we decided and why it
> mattered — the thing a human should take away without reading further. This is
> the human counterpart to the frontmatter above (which is for the linter and the
> generated index).

## Context

Why this decision was forced: the problem, the constraints, the forces in play.
State the situation, not the answer.

## Decision drivers

<!-- Optional. Omit the whole section if genuinely N/A. -->

- The forces that most shaped the choice (cost, risk, a boundary we must hold, …).

## Decision

What we decided, in the active voice ("We do X"). This is the load-bearing prose —
code comments cite this by ADR number, so keep it precise.

## Alternatives considered

<!-- Optional but recommended. Omit if genuinely N/A. -->

- **<Alternative>.** Why it was rejected.

## Consequences

- Positive outcomes this unlocks.
- **Residual risk / what we accept** — the cost we are knowingly taking on.

## Enforcement / verification

How this decision is kept true over time: a boundary-linter rule, a `scripts/*`
tripwire, a pattern-scanner rule, a named test — or explicitly **"None
(narrative/posture ADR)."** This section is the hook the ADR conformance linter,
and any policy scanner, reads.

## Related ADRs

<!-- Optional. Narrative cross-links; structural supersede/supersededBy live in frontmatter. -->

- [ADR NNNN](NNNN-title.md) — how it relates (builds on / amends / relates to).

<!--
Append-only history. Never edit a decision above; record changes as a new dated
section here (supersede-don't-rewrite). One `## Amendment` per change:

## Amendment (YYYY-MM-DD, ABC-XXX): short description

What changed and why.
-->

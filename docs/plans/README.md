# Implementation plans

One plan per delivery Issue, at `docs/plans/<issue>-<slug>.md`.

The plan is written by the factory coordinator **before** any code, committed as the first commit on
the branch, and reviewed by the owner before implementation starts. At reconciliation — after
implementation, before the PR opens — it gains a `## Delivered` section recording what actually
shipped against what was planned.

## What a plan is for

| Question | Artifact |
| --- | --- |
| Why did we decide this? | an ADR (`docs/adr/`) — durable, append-only |
| What are we building? | the product brief and amendments (`docs/product/`) |
| What will *this ticket* do, and did it? | **this plan** |
| What shipped? | the pull request |

A plan is point-in-time. It cites the Issue, ADRs, and amendments; it never restates them. If you find
yourself copying acceptance criteria verbatim, link them instead — the numbered inventory exists so
every criterion can be ticked off, not so the Issue can be duplicated.

## Why it is a committed file

Two failure modes it exists to prevent:

- **Silent scope loss.** A ticket with six acceptance criteria ships two, and nobody notices until the
  owner asks. The numbered inventory makes the gap visible at review time.
- **Forgotten evidence.** Naming the states to capture up front is what makes one pass sufficient,
  whether they are component-level or from a device review session.

## Be exhaustive

**There is no length limit.** A large ticket warrants a large plan. The owner reviews this before any
code is written, and can only critique what is actually written down — a plan that gestures at "the
habit editor gets nested rows" cannot be argued with, while one that spells out the row states, the
depth cap, what happens on an invalid drop, and why the alternative was rejected can.

Write out, in the depth the ticket deserves:

- **UI**, per screen and per state: layout, controls, empty/loading/error states, interaction on tap,
  long-press, and keyboard, and what changes for each variant.
- **Data flow**: what crosses which boundary, in which direction, in what shape.
- **Logic and edge cases**: the rules, the boundaries, what happens when inputs are invalid, absent,
  duplicated, or out of order.
- **Product design choices**: the decision, the alternatives considered, and why this one. These are the
  cheapest thing in the world to change at plan time and the most expensive to change after merge.

Length is not the smell. **Duplication is.** Cite the Issue, ADR, and amendment rather than restating
them — that is what keeps a long plan worth reading.

## Rules

- Every acceptance criterion from the Issue appears in the inventory, numbered, including the ones that
  look trivial. This is the list reconciliation walks.
- Use Mermaid wherever structure, flow, or state is easier seen than read — a screen-flow graph, a state
  machine, a data-flow diagram across layers, a migration sequence. A substantial ticket usually earns
  several, not one. Never ASCII art.
- "Out of scope" requires a reason and a destination. `Deferred to a later ticket` is not a reason; if
  the Issue asks for it, it is in scope.
- The plan is amended, not rewritten, when implementation diverges. The divergence is the useful record.

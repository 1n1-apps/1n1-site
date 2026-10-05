---
status: accepted
date: 2026-01-01
ticket: ABC-000
deciders: [Founding team]
supersedes: []
supersededBy: null
---

# 0001 — Record architecture decisions with ADRs

> **Summary.** We record every load-bearing architecture and governance decision as a numbered,
> append-only Architecture Decision Record under `docs/adr/`, so the reasoning behind the system is
> addressable, citable from code, and durable as the codebase and its contributors (human and agent)
> change. This ADR is itself the first record and the proof of the format.

## Context

An agentic codebase is worked by many contributors — people and automated agents — often in parallel,
often months apart. Decisions made once ("external SDKs go through one module", "sessions are stateless")
become invisible constraints: the next contributor either rediscovers the reason the hard way or
violates it unknowingly. Design notes scattered across chats, commit messages, and memory rot into
folklore that no one can cite and no check can enforce. We need a single, stable, addressable place
where a load-bearing decision and its reasoning live, so that a code comment can point to it and a
reviewer can trust it.

## Decision drivers

- Decisions must be **citable from code** by a stable identifier that never changes meaning.
- The record must survive parallel branches and multiple agents without collisions or silent edits.
- The format must be uniform enough to **scaffold, index, and lint mechanically**.

## Decision

We keep an append-only log of Architecture Decision Records under `docs/adr/`, one decision per file,
following the MADR-shaped [`TEMPLATE.md`](TEMPLATE.md):

- Each ADR has a unique 4-digit number and is cited as `ADR NNNN`.
- ADRs are **append-only**: an accepted decision is never rewritten. To change one, we supersede it
  (a new ADR pointing back) or amend it (a dated section appended).
- Every ADR carries machine-readable frontmatter (`status`, `date`, `ticket`, `deciders`,
  `supersedes`, `supersededBy`) and the required sections in order (Context, Decision, Consequences,
  Enforcement / verification).
- The [index](README.md) lists every ADR; a load-bearing code path cites the ADR that governs it.
- **Proposing is not accepting** — new ADRs start `proposed`; a human accepts them.

We write an ADR only for **load-bearing** decisions (a boundary, a convention, a seam, a posture), not
for routine implementation detail.

## Alternatives considered

- **No formal record (decisions in commits / chat / memory).** Rejected: not addressable, not citable,
  rots into folklore, unenforceable.
- **A single living design doc, edited in place.** Rejected: loses history, invites edit wars, and a
  code comment can't cite a stable point in a mutating document.

## Consequences

- The reasoning behind the system is durable and addressable; a new contributor or agent can find _why_
  before changing _what_.
- Code comments cite decisions by number, and the citation stays valid forever because ADRs are
  append-only.
- **Residual risk / what we accept** — the log has upkeep cost (numbering, indexing, superseding
  discipline), and an ADR written for a non-load-bearing detail is noise. We accept this and lean on
  the "load-bearing only" rule and the conformance linter to keep quality up.

## Enforcement / verification

`scripts/check-adr-format.sh` (pre-commit + CI) validates filename, frontmatter, status vocabulary,
section presence and order, and that each ADR has an index row. `scripts/new-adr.sh` scaffolds
conformant files. A separate citation check fails the build on a reference to a `docs/**` document
that doesn't exist.

## Amendment (2026-07-24, template portability)

Use `bun scripts/check-adr-format.mjs` as the ADR conformance check in hooks and CI. It replaces the
former Bash-only checker while preserving the same filename, frontmatter, section, and index checks.
The ADR generator remains `scripts/new-adr.sh` and requires a POSIX shell.

## Amendment (2026-09-07, ticket-numbered ADRs)

An ADR's number is now its ticket's Issue number, zero-padded to four digits (Issue #320 →
`0320-<slug>.md`, cited `ADR 0320`), rather than the next free number in the log. Parallel
branches each took the same "next" number, and whichever merged second had to renumber its file,
frontmatter, index row and every citation; taking the number from the ticket removes the collision
at its source instead of resolving it afterwards. A second ADR from the same ticket, or one whose
number an earlier sequential ADR already holds, takes a letter suffix (`0320b`, `0320c`). Numbers
stay unique and stay citable; what is lost is the log's ordering by creation time. ADRs numbered
before this amendment keep their numbers.

## Related ADRs

- None yet — this is the first record.

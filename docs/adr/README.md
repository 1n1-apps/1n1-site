# Architecture Decision Records

## The standard

Every ADR follows one MADR-shaped template — see [`TEMPLATE.md`](TEMPLATE.md), and
[ADR 0001](0001-record-architecture-decisions-with-adrs.md) for the decision to use ADRs at all.
`bun scripts/check-adr-format.mjs` enforces the format in the pre-commit hook and CI.

- **Filename** `NNNN-kebab-title.md`. `NNNN` is the ticket's Issue number, zero-padded to four digits
  (Issue #320 → `0320-…`), so parallel branches never claim the same number. A second ADR from the same
  ticket — or one whose number an older ADR already holds — adds a letter suffix: `0320b`, `0320c`.
  Numbers are unique; gaps are fine. ADRs written before this rule keep their sequential numbers and
  are not renumbered, so the log is no longer ordered by creation time.
- **Frontmatter**, fixed key order: `status`, `date`, `ticket`, `deciders`, `supersedes`,
  `supersededBy`. `date` is ISO `YYYY-MM-DD`.
- **Status** — exactly one of `proposed`, `accepted`, `rejected`, `superseded`, `deprecated`.
- **Body sections in order:** `# NNNN — Title`; `> **Summary.**`; `## Context`; optional
  `## Decision drivers`; `## Decision`; optional `## Alternatives considered`; `## Consequences`;
  `## Enforcement / verification` (required); optional `## Related ADRs`.
- **Append-only.** Never rewrite an accepted decision — supersede it (new ADR, set `supersedes` +
  the old one's `supersededBy`) or amend it (a dated `## Amendment` section).
- **Cite as `ADR NNNN`** (`ADR 0320b` for a suffixed one); cross-link as `[ADR NNNN](NNNN-title.md)`.
- **Diagrams are Mermaid, never ASCII art** — use a ` ```mermaid ` block so it renders, diffs, and
  stays legible after edits.

Scaffold a new one with `bash scripts/new-adr.sh <slug> --issue 320 --ticket ABC-123 --title "…"`,
where `--issue` is the Issue number the ADR belongs to. Fill it, add its index row below at its numeric
position, and run `bun scripts/check-adr-format.mjs` before committing. Draft as `proposed`
at the start of the ticket; reconcile it against what you actually built and set it `accepted` before
the PR opens. **Every ADR in a pull request must already be `accepted`** — commit that status yourself,
without asking; the merge is not what accepts it. Never create a follow-up acceptance-only PR. The
generator needs a POSIX shell; the validator does not.

**Each ADR's live status is the `status:` field in its own frontmatter.** Keep the narrative preface
below grouped so the log reads as a map, not a flat list.

<!-- Narrative preface: as the log grows, group related ADRs here, e.g.
"ADRs 0002–0006 cover the persistence layer; 0007 the auth boundary; …". -->

| ADR                                                     | Title                                   |
| ------------------------------------------------------- | --------------------------------------- |
| [0001](0001-record-architecture-decisions-with-adrs.md) | Record architecture decisions with ADRs |
| [0002](0002-build-with-eleventy-and-deploy-from-actions.md) | Build the site with Eleventy and deploy it to GitHub Pages from Actions |
| [0003](0003-two-halves-dark-first.md) | Lay the site out as two halves, dark first, with a theme toggle |

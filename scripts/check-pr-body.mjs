// Validates a pull-request body against .github/pull_request_template.md before it is
// submitted. GitHub does not apply the template to API- or CLI-created pull requests, so
// nothing else catches a body that silently drops the traceability, acceptance-criteria,
// or review sections.
//
//   bun scripts/check-pr-body.mjs <body-file>
//   bun scripts/check-pr-body.mjs --body-file <file>
//
// In CI, pass the body on stdin: gh pr view --json body --jq .body | bun scripts/check-pr-body.mjs -

import { readFileSync } from 'node:fs';
import { argv } from 'node:process';
import { pathToFileURL } from 'node:url';

const REQUIRED_HEADINGS = [
  '## Intent & approach',
  '## Traceability',
  '## Acceptance criteria',
  '## Evidence & risk',
  '## Pre-PR thermonuclear review',
  '## Checklist',
];

// A section that survived as an unfilled placeholder is worse than a missing one: it looks
// complete to a skimming reviewer. Match only a line that is *entirely* a placeholder —
// scanning for bare tokens like <issue> anywhere would flag any PR that legitimately
// discusses the path conventions, which process PRs do constantly.
const PLACEHOLDER_PATTERNS = [
  /^\s*<[A-Z][^>]*>\s*$/u,
  /^\s*-?\s*\**[A-Za-z /-]+\**:\s*<[^>]+>\s*$/u,
];

function readBody(argv) {
  const args = argv.filter((value) => value !== '--body-file');
  const source = args[0];

  if (source === undefined) {
    throw new Error('Usage: bun scripts/check-pr-body.mjs <body-file>');
  }

  return source === '-' ? readFileSync(0, 'utf8') : readFileSync(source, 'utf8');
}

// A reasoned absence has to be distinguishable from the bare token it exists to prevent, and people
// write that absence several ways. Accepting only a literal "N/A" prefix forced a PR that genuinely
// closes no Issue — every factory-steering PR — to put an unrelated `#<n>` on the Closes line instead.
// GitHub then read the adjacent closing keyword and linked it, so merging a docs-only amendment PR
// would have auto-closed live in-progress work. Recognise the natural phrasings; the length check
// below is what still rejects a bare token.
const EXPLAINED_ABSENCE = /^(?:n\/?a|none|no)\b[\s—:,-]*/iu;

export function check(body) {
  const problems = [];

  if (body.startsWith('﻿')) {
    problems.push(
      'body starts with a UTF-8 BOM (PowerShell Out-File); write it with -Encoding utf8NoBOM',
    );
  }

  if (body.includes('\\n')) {
    problems.push(
      'body contains literal \\n escapes; compose it with real newlines in a body file',
    );
  }

  for (const heading of REQUIRED_HEADINGS) {
    if (!body.includes(heading)) {
      problems.push(`missing required section: ${heading}`);
    }
  }

  // Each of these must be present and either satisfied or explained. A bare "N/A" is the
  // shortcut these rules exist to prevent: it passes a skimming check while recording no
  // reasoning. A reasoned N/A is legitimate — factory management work carries no Issue and
  // therefore no plan, which is exactly the case a bare N/A would hide.
  const REASONED_FIELDS = [
    {
      label: 'Closes',
      pattern: /(?:^|\n)-\s*Closes:\s*(.*)/u,
      satisfied: /#\d+/u,
      hint: "reference the Issue as '#<n>', or state why this PR closes none",
    },
    {
      label: 'Plan',
      pattern: /(?:^|\n)-\s*Plan:\s*(.*)/u,
      satisfied: /`?docs\/plans\/\S+\.md`?/u,
      hint: 'link docs/plans/<issue>-<slug>.md, or state why this PR has no plan',
    },
    {
      label: 'ADRs',
      pattern: /(?:^|\n)-\s*ADRs?:\s*(.*)/u,
      satisfied: /ADR\s*\d+/iu,
      hint: 'name the ADR this PR accepts, or the existing ADR it extends',
    },
    {
      // Required so an unwritten line cannot mean either "owed no drawing" or "diverged from one".
      label: 'Approved visuals',
      pattern: /(?:^|\n)-\s*Approved visuals:\s*(.*)/u,
      satisfied: /https?:\/\/\S+|`?docs\/\S+\.html`?/u,
      hint: 'link the approved artifact and its committed path, or say why this ticket owed none',
    },
  ];

  for (const { label, pattern, satisfied, hint } of REASONED_FIELDS) {
    const line = body.match(pattern);
    if (line === null) {
      problems.push(`missing the ${label} line in Traceability`);
      continue;
    }

    const value = line[1].trim();
    if (satisfied.test(value)) continue;

    // Anything else has to be a stated absence carrying a real reason, not the bare token.
    if (!EXPLAINED_ABSENCE.test(value)) {
      problems.push(`${label} line is not recognisable: ${hint}`);
    } else if (value.replace(EXPLAINED_ABSENCE, '').length < 15) {
      problems.push(`${label} line is a bare N/A; ${hint}`);
    }
  }

  // Only a real URL counts. Prose describing the rule writes `blob/<branch>/`, with the
  // angle brackets, and must not trip the check it is explaining.
  const branchRefLink = /https?:\/\/\S*?\/blob\/(?!<)([^/\s]+)\//u.exec(body);
  if (branchRefLink !== null && !/^[0-9a-f]{40}$/iu.test(branchRefLink[1])) {
    problems.push(
      `evidence link uses a branch ref (blob/${branchRefLink[1]}/); link by commit SHA or upload, since branch URLs break at merge`,
    );
  }

  for (const line of body.split(/\r?\n/u)) {
    if (PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(line))) {
      problems.push(`unfilled template placeholder: ${line.trim()}`);
    }
  }

  // The in-app guide and tour state how the app works, and a change can quietly make one of those
  // sentences false: a new permission the permissions answer does not name, a control a guide still
  // tells people to press. The section is where a changed sentence reaches the owner at review, so it
  // lists every one, or says Unchanged and what was checked. A bare Unchanged records no checking.
  const help = sectionBody(body, '## Help and onboarding');
  if (help !== null) {
    const said = help.trim();
    if (said.length === 0) {
      problems.push(
        'Help and onboarding is empty; list each guide or tour sentence this change added, changed or removed, or say Unchanged and what was checked',
      );
    } else if (
      /^unchanged\b/iu.test(said) &&
      said.replace(/^unchanged\b[\s—:,.-]*/iu, '').length < 15
    ) {
      problems.push(
        'Help and onboarding says Unchanged without what was checked; name what the change touched and why no guide or tour sentence describes it',
      );
    }
  }

  return problems;
}

/** The text between a section's heading and the next section, or `null` where there is no such heading. */
function sectionBody(body, heading) {
  const start = body.indexOf(heading);
  if (start === -1) return null;
  const rest = body.slice(start + heading.length);
  const next = rest.search(/\n## /u);
  return next === -1 ? rest : rest.slice(0, next);
}

// Run the CLI only when invoked directly, so importing `check` from a test does not read argv,
// print, or call process.exit.
if (argv[1] !== undefined && import.meta.url === pathToFileURL(argv[1]).href) {
  try {
    const problems = check(readBody(argv.slice(2)));

    if (problems.length > 0) {
      console.error('PR body does not satisfy .github/pull_request_template.md:');
      for (const problem of problems) console.error(`  - ${problem}`);
      process.exit(1);
    }

    console.log('PR body OK');
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

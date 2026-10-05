import assert from 'node:assert/strict';
import test from 'node:test';

import { check } from './check-pr-body.mjs';

const SECTIONS = [
  '## Intent & approach',
  'Body text.',
  '',
  '## Traceability',
  '',
  '- Closes: #42',
  '- Plan: `docs/plans/42-thing.md`',
  '- ADRs: ADR 0012',
  '- Approved visuals: https://example.invalid/artifact — `docs/design/42-thing.html`',
  '',
  '## Acceptance criteria',
  'All met.',
  '',
  '## Evidence & risk',
  'Tests pass.',
  '',
  '## Pre-PR thermonuclear review',
  'No findings.',
  '',
  '## Checklist',
  '- [x] Done.',
].join('\n');

/** Builds a valid body with one Traceability line replaced, so each case varies exactly one field. */
function bodyWith(line, replacement) {
  return SECTIONS.replace(line, replacement);
}

test('a Closes line naming an Issue is accepted', () => {
  assert.deepEqual(check(SECTIONS), []);
});

test('a reasoned no-close is accepted without naming an Issue', () => {
  // Factory-managed product steering deliberately creates no Issue, so its PR has no Issue to
  // reference. Requiring one forced steering PRs to cite an unrelated Issue next to the word
  // "closed", which GitHub then linked as a closing reference and would have auto-closed live work
  // on merge.
  const body = bodyWith(
    '- Closes: #42',
    '- Closes: none — factory steering creates no Issue; the amendment is the trace.',
  );

  assert.deepEqual(check(body), []);
});

test('a reasoned no-close phrased as "no Issue" is accepted', () => {
  const body = bodyWith(
    '- Closes: #42',
    '- Closes: no Issue — this PR only reconciles the product brief.',
  );

  assert.deepEqual(check(body), []);
});

test('a bare none on the Closes line is still rejected', () => {
  const body = bodyWith('- Closes: #42', '- Closes: none');

  assert.deepEqual(check(body), [
    "Closes line is a bare N/A; reference the Issue as '#<n>', or state why this PR closes none",
  ]);
});

test('a bare N/A on the Closes line is still rejected', () => {
  const body = bodyWith('- Closes: #42', '- Closes: N/A');

  assert.deepEqual(check(body), [
    "Closes line is a bare N/A; reference the Issue as '#<n>', or state why this PR closes none",
  ]);
});

test('an unexplained Closes line is still rejected', () => {
  const body = bodyWith('- Closes: #42', '- Closes: later');

  assert.deepEqual(check(body), [
    "Closes line is not recognisable: reference the Issue as '#<n>', or state why this PR closes none",
  ]);
});

test('a reasoned no-plan is accepted, as it was before', () => {
  const body = bodyWith(
    '- Plan: `docs/plans/42-thing.md`',
    '- Plan: n/a — steering produces an amendment, not an implementation plan.',
  );

  assert.deepEqual(check(body), []);
});

test('a missing required section is reported', () => {
  const body = SECTIONS.replace('## Evidence & risk', '## Evidence');

  assert.deepEqual(check(body), ['missing required section: ## Evidence & risk']);
});

test('an unfilled template placeholder is reported', () => {
  const body = bodyWith('Body text.', '<What this change does and why>');

  assert.deepEqual(check(body), ['unfilled template placeholder: <What this change does and why>']);
});

test('an evidence link pinned to a branch ref is reported', () => {
  const body = bodyWith('Tests pass.', 'Screenshot: https://github.com/o/r/blob/product/shot.png');

  assert.deepEqual(check(body), [
    'evidence link uses a branch ref (blob/product/); link by commit SHA or upload, since branch URLs break at merge',
  ]);
});

test('a reasoned absence of approved visuals is accepted', () => {
  // The normal answer for a ticket with no rendered output — still said, never left blank.
  const body = bodyWith(
    '- Approved visuals: https://example.invalid/artifact — `docs/design/42-thing.html`',
    '- Approved visuals: none — this ticket renders nothing; it is a persistence migration.',
  );

  assert.deepEqual(check(body), []);
});

test('a bare none on the approved-visuals line is rejected', () => {
  const body = bodyWith(
    '- Approved visuals: https://example.invalid/artifact — `docs/design/42-thing.html`',
    '- Approved visuals: n/a',
  );

  assert.deepEqual(check(body), [
    'Approved visuals line is a bare N/A; link the approved artifact and its committed path, or say why this ticket owed none',
  ]);
});

test('a committed artifact path alone satisfies the line', () => {
  const body = bodyWith(
    '- Approved visuals: https://example.invalid/artifact — `docs/design/42-thing.html`',
    '- Approved visuals: `docs/design/42-thing.html`',
  );

  assert.deepEqual(check(body), []);
});

import assert from 'node:assert/strict';
import test from 'node:test';

import { isLocalOnlyGitCommand } from './github.mjs';

// The allowlist is the whole safety boundary of the no-credential path, so it is asserted directly
// rather than inferred from a spawned process. A subcommand wrongly allowed here would run without
// a credential; one wrongly denied would keep the bug this change fixes — an expired token blocking
// an agent from committing finished work.

test('lets a local-only subcommand run without a credential', () => {
  for (const subcommand of ['commit', 'add', 'status', 'log', 'diff', 'stash', 'rebase']) {
    assert.equal(
      isLocalOnlyGitCommand('git', [subcommand]),
      true,
      `${subcommand} reaches no remote and must not require a token`,
    );
  }
});

test('still requires a credential for every subcommand that reaches a remote', () => {
  for (const subcommand of ['push', 'fetch', 'pull', 'clone', 'ls-remote', 'submodule']) {
    assert.equal(
      isLocalOnlyGitCommand('git', [subcommand]),
      false,
      `${subcommand} reaches a remote and must fail closed without a token`,
    );
  }
});

test('fails closed for an unrecognised subcommand', () => {
  // The allowlist is deliberately strict: a future git verb that does reach a remote must take the
  // credential path by default rather than silently running uncredentialled.
  assert.equal(isLocalOnlyGitCommand('git', ['some-future-verb']), false);
});

test('never applies to gh, whose every command is an API call', () => {
  assert.equal(isLocalOnlyGitCommand('gh', ['pr', 'create']), false);
  assert.equal(isLocalOnlyGitCommand('gh', ['status']), false);
});

test('requires a subcommand', () => {
  assert.equal(isLocalOnlyGitCommand('git', []), false);
});

test('matches on the subcommand only, not on a flag that happens to precede it', () => {
  // `git -c foo=bar push` would arrive with `-c` first; it must not be mistaken for a local verb.
  assert.equal(isLocalOnlyGitCommand('git', ['-c', 'foo=bar', 'push']), false);
});

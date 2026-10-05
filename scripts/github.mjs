import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(scriptDirectory, '..').replaceAll('\\', '/');
const tokenFile = resolve(scriptDirectory, '..', '.env.agent.local');

function parseTokenFile(contents) {
  const values = Object.fromEntries(
    contents
      .split(/\r?\n/u)
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const separator = line.indexOf('=');
        return [line.slice(0, separator), line.slice(separator + 1)];
      }),
  );

  if (!values.GH_TOKEN || !values.GH_TOKEN_EXPIRES_AT) {
    throw new Error(
      'The app GitHub token file is incomplete. Ask factory control to issue a fresh token.',
    );
  }

  if (Date.parse(values.GH_TOKEN_EXPIRES_AT) <= Date.now()) {
    throw new Error(
      'The app GitHub token has expired. Ask factory control to issue a fresh token.',
    );
  }

  return values.GH_TOKEN;
}

// Git subcommands that touch no remote. Deliberately a strict allowlist rather than a denylist of
// networked ones: an unrecognised subcommand falls through to the credential path, so a future git
// verb that does reach a remote fails closed rather than running uncredentialled by accident.
// `push`, `fetch`, `pull`, `clone`, and `ls-remote` are all absent on purpose.
const LOCAL_ONLY_GIT_SUBCOMMANDS = new Set([
  'add',
  'branch',
  'checkout',
  'cherry-pick',
  'commit',
  'diff',
  'log',
  'merge',
  'mv',
  'rebase',
  'reset',
  'restore',
  'rev-parse',
  'rm',
  'show',
  'stash',
  'status',
  'switch',
  'tag',
  'worktree',
]);

/**
 * Whether this invocation reaches no remote and therefore needs no credential. Exported for its
 * own test: the allowlist is the whole safety boundary, so it is asserted directly rather than
 * inferred from the spawn.
 */
export function isLocalOnlyGitCommand(tool, args) {
  return tool === 'git' && args.length > 0 && LOCAL_ONLY_GIT_SUBCOMMANDS.has(args[0]);
}

// Flags whose value is Markdown a shell may have mangled. `-F`/`-f` are gh api field
// flags, whose value is `key=value` — only the value half is normalised.
const MARKDOWN_VALUE_FLAGS = new Set(['--body', '-b', '--title', '-t']);
const FIELD_FLAGS = new Set(['-f', '-F', '--field', '--raw-field']);
const MARKDOWN_INLINE_PREFIXES = ['--body=', '--title='];

// PowerShell here-strings and Out-File are the two recurring sources of broken GitHub
// Markdown: the first can deliver literal `\n` escapes instead of newlines, the second
// prepends a UTF-8 BOM that GitHub renders as a stray glyph before the first heading.
function normaliseMarkdown(value) {
  return value.replace(/^﻿/u, '').replaceAll('\\r\\n', '\n').replaceAll('\\n', '\n');
}

function normaliseMarkdownBodyArguments(args) {
  return args.map((argument, index) => {
    const previous = args[index - 1];

    if (MARKDOWN_VALUE_FLAGS.has(previous)) return normaliseMarkdown(argument);

    if (FIELD_FLAGS.has(previous)) {
      const separator = argument.indexOf('=');
      if (separator === -1) return argument;
      const key = argument.slice(0, separator);
      if (key !== 'body' && key !== 'title') return argument;
      return `${key}=${normaliseMarkdown(argument.slice(separator + 1))}`;
    }

    const prefix = MARKDOWN_INLINE_PREFIXES.find((candidate) => argument.startsWith(candidate));
    if (prefix) {
      return `${prefix}${normaliseMarkdown(argument.slice(prefix.length))}`;
    }

    return argument;
  });
}

async function main() {
  const [tool, ...args] = process.argv.slice(2);
  if (tool !== 'git' && tool !== 'gh') {
    throw new Error('Usage: bun scripts/github.mjs <git|gh> <arguments>');
  }

  // A local-only git subcommand reaches no remote and needs no credential, so it must not be
  // gated on one. Requiring a live token to `commit` meant an expiry — the token lives one hour,
  // an agent's working session longer — blocked an agent from saving finished work, leaving it
  // uncommitted and at risk until a coordinator noticed. Push, fetch, and every `gh` command
  // still require a valid token; only the offline half is let through.
  if (isLocalOnlyGitCommand(tool, args)) {
    await runTool('git', args, undefined);
    return;
  }

  let contents;
  try {
    contents = await readFile(tokenFile, 'utf8');
  } catch {
    throw new Error('No app GitHub token is available. Ask factory control to issue one.');
  }

  await runTool(tool, args, parseTokenFile(contents));
}

/** Spawns `git`/`gh`, injecting the credential only when one was required and resolved. */
async function runTool(tool, args, token) {
  const toolArgs =
    tool === 'git'
      ? ['-c', 'credential.helper=!gh auth git-credential', ...args]
      : normaliseMarkdownBodyArguments(args);

  await new Promise((resolvePromise, reject) => {
    const child = spawn(tool, toolArgs, {
      env: {
        ...process.env,
        ...(token === undefined ? {} : { GH_TOKEN: token }),
        GIT_CONFIG_COUNT: '1',
        GIT_CONFIG_KEY_0: 'safe.directory',
        GIT_CONFIG_VALUE_0: appRoot,
      },
      stdio: 'inherit',
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolvePromise();
      } else {
        reject(new Error(`${tool} exited with status ${code}.`));
      }
    });
  });
}

// Only run the CLI when this file is the entry point. Importing it — which its own test does, to
// assert the local-only allowlist directly — must not spawn git or gh as a side effect.
if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

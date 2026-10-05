import { existsSync, readFileSync } from 'node:fs';

const [firstArgument, subjectArgument] = process.argv.slice(2);
const argument = firstArgument === '--subject' ? subjectArgument : firstArgument;
const subject =
  argument !== undefined && existsSync(argument)
    ? readFileSync(argument, 'utf8').split(/\r?\n/, 1)[0]
    : argument;
const allowed = '(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)';

if (subject === undefined || !new RegExp(`^${allowed}:\\s[a-z0-9]`).test(subject)) {
  console.error("invalid commit subject: use 'type: summary' with no scope or brackets");
  process.exit(1);
}

if (subject.length > 72) {
  console.error('invalid commit subject: keep it to 72 characters or fewer');
  process.exit(1);
}

if (new RegExp(`^${allowed}:\\s${allowed}:`).test(subject)) {
  console.error('invalid commit subject: choose one type; do not combine categories');
  process.exit(1);
}

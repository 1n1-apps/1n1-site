import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const directory = process.argv[2] === '--dir' ? process.argv[3] : 'docs/adr';

if (directory === undefined || !existsSync(directory)) {
  console.error('check-adr-format: ADR directory not found');
  process.exit(1);
}

const indexPath = join(directory, 'README.md');
if (!existsSync(indexPath)) {
  console.error('check-adr-format: missing index README.md');
  process.exit(1);
}

// An ADR's number is its ticket's Issue number, zero-padded to at least four digits, plus an
// optional letter suffix for a second ADR on the same ticket or for a number an older sequential
// ADR already held: 0320, 0320b. Capture group 1 is that number.
const numberedAdr = /^(\d{4,}[a-z]?)-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;

const index = readFileSync(indexPath, 'utf8');
const files = readdirSync(directory)
  .filter((file) => numberedAdr.test(file))
  .sort();
const seenNumbers = new Set();
let failed = false;

for (const file of files) {
  const content = readFileSync(join(directory, file), 'utf8');
  const number = file.match(numberedAdr)?.[1] ?? '';
  const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  const keys =
    frontmatter?.[1]
      .split(/\r?\n/)
      .map((line) => line.match(/^([a-zA-Z]+):/)?.[1])
      .filter((key) => key !== undefined) ?? [];
  const sections = [
    ...content.matchAll(/^## (Context|Decision|Consequences|Enforcement \/ verification)$/gm),
  ]
    .map((match) => match[1])
    .join('|');
  const errors = [
    seenNumbers.has(number) ? 'duplicate number' : undefined,
    keys.join(' ') !== 'status date ticket deciders supersedes supersededBy'
      ? 'invalid frontmatter keys'
      : undefined,
    !/^status: (proposed|accepted|rejected|superseded|deprecated)\b/m.test(content)
      ? 'invalid status'
      : undefined,
    !/^date: \d{4}-\d{2}-\d{2}\b/m.test(content) ? 'invalid date' : undefined,
    !new RegExp(`^# ${number} \\u2014 `, 'm').test(content) ? 'invalid H1' : undefined,
    !/^> \*\*Summary\.\*\*/m.test(content) ? 'missing summary' : undefined,
    sections !== 'Context|Decision|Consequences|Enforcement / verification'
      ? 'invalid required section order'
      : undefined,
    !index.includes(`[${number}](${file})`) ? 'missing index row' : undefined,
  ].filter((error) => error !== undefined);

  seenNumbers.add(number);
  if (errors.length > 0) {
    failed = true;
    console.error(`${file}: ${errors.join('; ')}`);
  }
}

if (failed) {
  process.exit(1);
}

console.log(`check-adr-format: ${files.length} ADRs OK`);

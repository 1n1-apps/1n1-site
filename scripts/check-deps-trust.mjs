import { readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync('package.json', 'utf8'));

if ('trustedDependencies' in manifest) {
  console.error('deps:trust-check: explicit trustedDependencies require an approved policy update');
  process.exit(1);
}

// Report blocked lifecycle scripts without executing them. A package that needs one must be reviewed,
// not silently trusted to turn this check green.
const result = Bun.spawnSync(['bun', 'pm', 'untrusted'], {
  stderr: 'inherit',
  stdout: 'inherit',
});

process.exit(result.exitCode);

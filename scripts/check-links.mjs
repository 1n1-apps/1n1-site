// check:links — every internal link, asset and anchor in the built site resolves.
// `bun run check:links` checks `_site`; docs/design/web-conventions.md names the rule.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Every href and src value in a page, with `&amp;` unescaped. */
export function extractRefs(html) {
  return [...html.matchAll(/\s(?:href|src)="([^"]*)"/g)].map((m) => m[1].replace(/&amp;/g, '&'));
}

/** Every id in a page. */
export function extractIds(html) {
  return new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
}

/**
 * The file a reference points at, and its anchor, or null for anything off the site
 * (mail, telephone, another host). A folder means its index.html, as GitHub Pages serves it.
 */
export function resolveTarget(root, fromFile, ref) {
  if (/^(mailto:|tel:|https?:|\/\/)/.test(ref)) return null;
  const [beforeHash, hash = ''] = ref.split('#');
  const path = beforeHash.split('?')[0];
  if (path === '') return { file: fromFile, hash };
  let target = path.startsWith('/') ? join(root, path) : resolve(dirname(fromFile), path);
  if (path.endsWith('/') || (existsSync(target) && statSync(target).isDirectory())) {
    target = join(target, 'index.html');
  }
  return { file: target, hash };
}

/** Every .html file under the root, sorted. */
export function listHtml(root) {
  return readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.html'))
    .map((e) => join(e.parentPath, e.name))
    .sort();
}

/** Every broken link in the site: the page it is on, the reference, and what is wrong. */
export function checkSite(root) {
  const problems = [];
  const idsOf = new Map();
  const ids = (file) => {
    if (!idsOf.has(file)) idsOf.set(file, extractIds(readFileSync(file, 'utf8')));
    return idsOf.get(file);
  };
  for (const page of listHtml(root)) {
    const name = relative(root, page).split(sep).join('/');
    for (const ref of extractRefs(readFileSync(page, 'utf8'))) {
      const target = resolveTarget(root, page, ref);
      if (!target) continue;
      if (!existsSync(target.file)) problems.push({ page: name, ref, problem: 'no such file' });
      else if (target.hash && target.file.endsWith('.html') && !ids(target.file).has(target.hash)) {
        problems.push({ page: name, ref, problem: `no element with id "${target.hash}"` });
      }
    }
  }
  return problems;
}

/** The command line; returns the exit code. */
export function main(argv, log = console.log) {
  const root = resolve(argv[0] ?? '_site');
  if (!existsSync(root)) {
    log(`check:links: no built site at ${root}; run bun run build first.`);
    return 1;
  }
  const pages = listHtml(root).length;
  const problems = checkSite(root);
  if (problems.length === 0) {
    log(`check:links: ${pages} page${pages === 1 ? '' : 's'}, every link resolves.`);
    return 0;
  }
  for (const p of problems) log(`check:links: ${p.page}: ${p.ref} (${p.problem})`);
  return 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}

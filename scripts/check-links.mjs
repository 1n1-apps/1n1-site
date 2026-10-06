// check:links — every internal link, asset and anchor in the built site resolves.
// `bun run check:links` checks `_site`; docs/design/web-conventions.md names the rule.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// The meta tags whose content is a URL on the site: the share image and the page's own address.
const URL_META = /^(?:og:image|og:url|twitter:image)$/;

/**
 * Every reference in a page, in order, with `&amp;` unescaped: href and src (double- or
 * single-quoted), each srcset candidate, and the content of the share-image and page-URL meta tags.
 */
export function extractRefs(html) {
  const refs = [];
  for (const m of html.matchAll(/<[^>]+>/g)) {
    const tag = m[0];
    const attrs = new Map(
      [...tag.matchAll(/\s([\w:-]+)=(?:"([^"]*)"|'([^']*)')/g)].map((a) => [
        a[1].toLowerCase(),
        (a[2] ?? a[3]).replace(/&amp;/g, '&'),
      ]),
    );
    for (const name of ['href', 'src']) if (attrs.has(name)) refs.push(attrs.get(name));
    if (attrs.has('srcset')) {
      for (const candidate of attrs.get('srcset').split(',')) {
        const url = candidate.trim().split(/\s+/)[0];
        if (url) refs.push(url);
      }
    }
    if (/^<meta\b/i.test(tag) && URL_META.test(attrs.get('property') ?? attrs.get('name') ?? '')) {
      refs.push(attrs.get('content') ?? '');
    }
  }
  return refs;
}

/** Every id in a page. */
export function extractIds(html) {
  return new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
}

/**
 * The file a reference points at, and its anchor, or null for anything off the site (mail,
 * telephone, data, script, another host). An absolute URL on the site's own address counts as
 * internal. A folder means its index.html, as GitHub Pages serves it.
 */
export function resolveTarget(root, fromFile, ref, siteUrl) {
  if (siteUrl && (ref === siteUrl || ref.startsWith(`${siteUrl}/`))) {
    ref = ref.slice(siteUrl.length) || '/';
  }
  if (/^(mailto:|tel:|data:|javascript:|https?:|\/\/)/i.test(ref)) return null;
  const [beforeHash, hash = ''] = ref.split('#');
  const path = decodeURIComponent(beforeHash.split('?')[0]);
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
export function checkSite(root, siteUrl) {
  const problems = [];
  const idsOf = new Map();
  const ids = (file) => {
    if (!idsOf.has(file)) idsOf.set(file, extractIds(readFileSync(file, 'utf8')));
    return idsOf.get(file);
  };
  for (const page of listHtml(root)) {
    const name = relative(root, page).split(sep).join('/');
    for (const ref of extractRefs(readFileSync(page, 'utf8'))) {
      let target;
      try {
        target = resolveTarget(root, page, ref, siteUrl);
      } catch {
        // decodeURIComponent refuses a bad escape such as `%zz`; that link is broken, not the run.
        problems.push({ page: name, ref, problem: 'malformed URL' });
        continue;
      }
      if (!target) continue;
      if (!existsSync(target.file)) problems.push({ page: name, ref, problem: 'no such file' });
      else if (target.hash && target.file.endsWith('.html') && !ids(target.file).has(target.hash)) {
        problems.push({ page: name, ref, problem: `no element with id "${target.hash}"` });
      }
    }
  }
  return problems;
}

/** The command line: the built site, then the site's own address; returns the exit code. */
export function main(argv, log = console.log) {
  const root = resolve(argv[0] ?? '_site');
  if (!existsSync(root)) {
    log(`check:links: no built site at ${root}; run bun run build first.`);
    return 1;
  }
  const pages = listHtml(root).length;
  const problems = checkSite(root, argv[1]);
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

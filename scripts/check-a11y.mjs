// check:a11y — every built page, in both themes, has no serious or critical accessibility finding.
// It serves `_site` locally, opens each page in the installed Chrome through puppeteer-core, and runs
// axe-core's WCAG 2.2 A and AA rules (docs/design/web-conventions.md § Accessibility).

import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import http from 'node:http';
import { createRequire } from 'node:module';
import { extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { listHtml } from './check-links.mjs';

const CANDIDATES = {
  win32: [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  ],
  linux: [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ],
  darwin: ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'],
};

/** The Chrome to drive: CHROME_PATH if it exists, else the platform's usual install, else null. */
export function findChrome(env, exists, platform) {
  if (env.CHROME_PATH) return exists(env.CHROME_PATH) ? env.CHROME_PATH : null;
  return (CANDIDATES[platform] ?? []).find((p) => exists(p)) ?? null;
}

/** Each built page as the path a visitor requests: a folder index as `/folder/`. */
export function pagePaths(root) {
  return listHtml(root).map((file) => {
    const rel = relative(root, file).split(sep).join('/');
    if (rel === 'index.html') return '/';
    return rel.endsWith('/index.html') ? `/${rel.slice(0, -'index.html'.length)}` : `/${rel}`;
  });
}

/** Only the violations that fail the check. */
export function serious(violations) {
  return violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain',
};

/** Serve the built site on a free local port, as GitHub Pages would: a folder answers with its index. */
export function serve(root) {
  const server = http.createServer((req, res) => {
    let file = join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('not found');
      return;
    }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(res);
  });
  return new Promise((done) => {
    server.listen(0, '127.0.0.1', () => {
      done({
        url: `http://127.0.0.1:${server.address().port}`,
        close: () => new Promise((closed) => server.close(closed)),
      });
    });
  });
}

/** Run axe on every path in each theme; return the serious and critical findings. */
export async function audit({ baseUrl, paths, browser, axeSource, themes = ['dark', 'light'] }) {
  const findings = [];
  for (const path of paths) {
    for (const theme of themes) {
      const page = await browser.newPage();
      await page.goto(baseUrl + path);
      await page.evaluate((t) => localStorage.setItem('theme', t), theme);
      await page.reload();
      await page.addScriptTag({ content: axeSource });
      const results = await page.evaluate(() =>
        // eslint-disable-next-line no-undef
        axe.run(document, {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
          },
        }),
      );
      for (const v of serious(results.violations)) {
        findings.push({
          path,
          theme,
          id: v.id,
          impact: v.impact,
          help: v.help,
          count: v.nodes.length,
        });
      }
      await page.close();
    }
  }
  return findings;
}

async function launchChrome(executablePath) {
  const { default: puppeteer } = await import('puppeteer-core');
  return puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox'] });
}

function readAxe() {
  return readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
}

/** The command line; resolves to the exit code. */
export async function main(
  argv,
  {
    launch = launchChrome,
    log = console.log,
    env = process.env,
    exists = existsSync,
    platform = process.platform,
    axeSource,
  } = {},
) {
  const root = resolve(argv[0] ?? '_site');
  if (!exists(root)) {
    log(`check:a11y: no built site at ${root}; run bun run build first.`);
    return 1;
  }
  const chrome = findChrome(env, exists, platform);
  if (!chrome) {
    log('check:a11y: no Chrome found; set CHROME_PATH to a Chrome or Chromium executable.');
    return 1;
  }
  const paths = pagePaths(root);
  const server = await serve(root);
  const browser = await launch(chrome);
  try {
    const findings = await audit({
      baseUrl: server.url,
      paths,
      browser,
      axeSource: axeSource ?? readAxe(),
    });
    if (findings.length === 0) {
      log(
        `check:a11y: ${paths.length} page${paths.length === 1 ? '' : 's'} in 2 themes, no serious or critical findings.`,
      );
      return 0;
    }
    for (const f of findings) {
      log(
        `check:a11y: ${f.path} (${f.theme}): ${f.id}, ${f.impact}, ${f.count} element${f.count === 1 ? '' : 's'}: ${f.help}`,
      );
    }
    return 1;
  } finally {
    await browser.close();
    await server.close();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2));
}

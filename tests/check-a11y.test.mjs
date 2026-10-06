import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { audit, findChrome, main, pagePaths, serious, serve } from '../scripts/check-a11y.mjs';

let root;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'a11y-'));
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

function put(path, text) {
  mkdirSync(join(root, path, '..'), { recursive: true });
  writeFileSync(join(root, path), text);
}

describe('findChrome', () => {
  it('prefers CHROME_PATH when it exists', () => {
    assert.equal(
      findChrome({ CHROME_PATH: '/x/chrome' }, (p) => p === '/x/chrome', 'linux'),
      '/x/chrome',
    );
  });

  it('falls back to the platform install, or null when there is none', () => {
    assert.equal(
      findChrome({}, (p) => p === '/usr/bin/google-chrome', 'linux'),
      '/usr/bin/google-chrome',
    );
    assert.match(
      findChrome({}, (p) => p.endsWith('chrome.exe'), 'win32'),
      /chrome\.exe$/,
    );
    assert.match(
      findChrome({}, (p) => p.includes('Google Chrome.app'), 'darwin'),
      /Google Chrome$/,
    );
    assert.equal(
      findChrome({ CHROME_PATH: '/gone' }, () => false, 'linux'),
      null,
    );
    assert.equal(
      findChrome({}, () => true, 'plan9'),
      null,
    );
  });
});

describe('pagePaths', () => {
  it('turns each built page into the path a visitor uses', () => {
    put('index.html', '');
    put('apps/index.html', '');
    put('apps/meantime/index.html', '');
    put('404.html', '');
    assert.deepEqual(pagePaths(root), ['/404.html', '/apps/', '/apps/meantime/', '/']);
  });
});

describe('serious', () => {
  it('keeps only serious and critical violations', () => {
    const v = [
      { impact: 'minor' },
      { impact: 'serious' },
      { impact: 'critical' },
      { impact: 'moderate' },
    ];
    assert.deepEqual(
      serious(v).map((x) => x.impact),
      ['serious', 'critical'],
    );
  });
});

describe('serve', () => {
  it('serves the site: a folder as its index, a file as itself, anything else as 404', async () => {
    put('index.html', '<p>home</p>');
    put('apps/index.html', '<p>apps</p>');
    put('a.css', 'x{}');
    const server = await serve(root);
    try {
      assert.equal(await (await fetch(server.url + '/')).text(), '<p>home</p>');
      assert.equal(await (await fetch(server.url + '/apps/')).text(), '<p>apps</p>');
      const css = await fetch(server.url + '/a.css');
      assert.equal(css.headers.get('content-type'), 'text/css');
      assert.equal((await fetch(server.url + '/none')).status, 404);
    } finally {
      await server.close();
    }
  });
});

// A browser double: each page records what it was asked and answers with canned axe results. The
// page applies the stored theme to <html data-theme> unless `ignoresTheme` says it doesn't.
function fakeBrowser(resultsFor, { ignoresTheme = false } = {}) {
  const log = [];
  return {
    log,
    closed: false,
    async newPage() {
      let url = '';
      return {
        async goto(u) {
          url = u;
          log.push(['goto', u]);
        },
        // Runs the page-side function for real, against stand-ins for the page's globals.
        async evaluate(fn, arg) {
          const theme = () => log.filter((l) => l[0] === 'theme').at(-1)?.[1];
          globalThis.localStorage = { setItem: (k, v) => log.push([k, v]) };
          globalThis.document = {
            documentElement: { dataset: { theme: ignoresTheme ? 'dark' : theme() } },
          };
          globalThis.axe = { run: async () => resultsFor(url, theme()) };
          try {
            return await fn(arg);
          } finally {
            delete globalThis.localStorage;
            delete globalThis.document;
            delete globalThis.axe;
          }
        },
        async reload() {
          log.push(['reload']);
        },
        async setViewport({ width }) {
          log.push(['viewport', width]);
        },
        async emulateMediaFeatures(features) {
          log.push(['media', features.map((f) => `${f.name}=${f.value}`).join(',')]);
        },
        async addScriptTag({ content }) {
          log.push(['axe', content.length]);
        },
        async close() {},
      };
    },
    async close() {
      this.closed = true;
    },
  };
}

describe('audit', () => {
  it('runs axe on every page in both themes and keeps the serious findings', async () => {
    const browser = fakeBrowser((url, theme) => ({
      violations:
        url.endsWith('/apps/') && theme === 'light'
          ? [
              { id: 'color-contrast', impact: 'serious', help: 'Contrast', nodes: [{}, {}] },
              { id: 'x', impact: 'minor', help: 'x', nodes: [] },
            ]
          : [],
    }));
    const findings = await audit({
      baseUrl: 'http://h',
      paths: ['/', '/apps/'],
      browser,
      axeSource: 'axe!',
      viewports: [{ name: 'desktop', width: 1280, height: 800 }],
    });
    assert.deepEqual(findings, [
      {
        path: '/apps/',
        theme: 'light',
        viewport: 'desktop',
        id: 'color-contrast',
        impact: 'serious',
        help: 'Contrast',
        count: 2,
      },
    ]);
    assert.equal(browser.log.filter((l) => l[0] === 'goto').length, 4);
    assert.deepEqual(
      browser.log.filter((l) => l[0] === 'theme').map((l) => l[1]),
      ['dark', 'light', 'dark', 'light'],
    );
  });

  it('audits every page at a phone and a desktop width by default', async () => {
    const browser = fakeBrowser(() => ({ violations: [] }));
    await audit({ baseUrl: 'http://h', paths: ['/'], browser, axeSource: 'axe' });
    assert.deepEqual(
      browser.log.filter((l) => l[0] === 'viewport').map((l) => l[1]),
      [390, 390, 1280, 1280],
    );
  });

  it('audits each page at rest, with motion reduced, so no block is caught mid-animation', async () => {
    const browser = fakeBrowser(() => ({ violations: [] }));
    await audit({
      baseUrl: 'http://h',
      paths: ['/'],
      browser,
      axeSource: 'axe',
      viewports: [{ name: 'phone', width: 390, height: 844 }],
    });
    const order = browser.log.map((l) => l[0]);
    assert.deepEqual(
      browser.log.filter((l) => l[0] === 'media').map((l) => l[1]),
      ['prefers-reduced-motion=reduce', 'prefers-reduced-motion=reduce'],
    );
    assert.ok(order.indexOf('media') < order.indexOf('goto'), 'set before the page loads');
  });

  it('reports a page that did not take the theme it was asked for', async () => {
    const browser = fakeBrowser(() => ({ violations: [] }), { ignoresTheme: true });
    const findings = await audit({
      baseUrl: 'http://h',
      paths: ['/'],
      browser,
      axeSource: 'axe',
      viewports: [{ name: 'phone', width: 390, height: 844 }],
    });
    assert.deepEqual(findings, [
      {
        path: '/',
        theme: 'light',
        viewport: 'phone',
        id: 'theme-not-applied',
        impact: 'critical',
        help: 'The page shows dark, not light, so this theme was never checked',
        count: 1,
      },
    ]);
  });
});

describe('main', () => {
  it('passes a clean site, closing the browser and the server', async () => {
    put('index.html', '<p>ok</p>');
    const browser = fakeBrowser(() => ({ violations: [] }));
    const lines = [];
    const code = await main([root], {
      launch: async () => browser,
      log: (l) => lines.push(l),
      env: { CHROME_PATH: '/c' },
      exists: (p) => p === '/c' || p === root,
      axeSource: 'axe',
    });
    assert.equal(code, 0);
    assert.ok(browser.closed);
    assert.match(
      lines.join('\n'),
      /check:a11y: 1 page in 2 themes at phone and desktop widths, no serious or critical findings/,
    );
  });

  it('fails and lists each finding', async () => {
    put('index.html', '<p>ok</p>');
    const browser = fakeBrowser(() => ({
      violations: [{ id: 'image-alt', impact: 'critical', help: 'Images need alt', nodes: [{}] }],
    }));
    const lines = [];
    const code = await main([root], {
      launch: async () => browser,
      log: (l) => lines.push(l),
      env: { CHROME_PATH: '/c' },
      exists: () => true,
      axeSource: 'axe',
    });
    assert.equal(code, 1);
    assert.match(
      lines.join('\n'),
      /\/ \(dark, phone\): image-alt, critical, 1 element: Images need alt/,
    );
  });

  it('fails without a built site or without Chrome', async () => {
    const lines = [];
    const log = (l) => lines.push(l);
    assert.equal(
      await main([join(root, 'none')], {
        launch: async () => null,
        log,
        env: {},
        exists: () => false,
      }),
      1,
    );
    assert.match(lines.join('\n'), /no built site/);
    assert.equal(
      await main([root], {
        launch: async () => null,
        log,
        env: {},
        exists: (p) => p === root,
        platform: 'linux',
      }),
      1,
    );
    assert.match(lines.join('\n'), /no Chrome found; set CHROME_PATH/);
  });
});

// A page shaped like the site: dark unless the stored theme says light, applied by a head script.
function themedPage(lightStyle) {
  return `<!DOCTYPE html><html lang="en" data-theme="dark"><head><title>t</title>
<script>try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}</script>
<style>body{background:#06302e;color:#f2faf8}[data-theme=light] body{${lightStyle}}</style>
</head><body><main><h1>Fine</h1><p>Some text.</p></main></body></html>`;
}

describe('main, against the real Chrome', () => {
  it('finds a contrast failure that exists only in the light theme', async () => {
    put('index.html', themedPage('background:#fff;color:#ccc'));
    const lines = [];
    const code = await main([root], { log: (l) => lines.push(l) });
    assert.equal(code, 1, lines.join('\n'));
    assert.match(lines.join('\n'), /\/ \(light, phone\): color-contrast/);
    assert.doesNotMatch(lines.join('\n'), /\(dark/);
  });

  it('launches the installed Chrome and runs axe on a page', async () => {
    put('index.html', themedPage('background:#f2faf8;color:#06302e'));
    const lines = [];
    const code = await main([root], { log: (l) => lines.push(l) });
    assert.equal(code, 0, lines.join('\n'));
  });
});

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

// A browser double: each page records what it was asked and answers with canned axe results.
function fakeBrowser(resultsFor) {
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
        async evaluate(fn, arg) {
          if (arg !== undefined) {
            log.push(['theme', arg]);
            return undefined;
          }
          return resultsFor(url, log.filter((l) => l[0] === 'theme').at(-1)?.[1]);
        },
        async reload() {
          log.push(['reload']);
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
    });
    assert.deepEqual(findings, [
      {
        path: '/apps/',
        theme: 'light',
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
      /check:a11y: 1 page in 2 themes, no serious or critical findings/,
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
    assert.match(lines.join('\n'), /\/ \(dark\): image-alt, critical, 1 element: Images need alt/);
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

import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';

import {
  checkSite,
  extractIds,
  extractRefs,
  listHtml,
  main,
  resolveTarget,
} from '../scripts/check-links.mjs';

let root;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'site-'));
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

function put(path, text) {
  mkdirSync(join(root, path, '..'), { recursive: true });
  writeFileSync(join(root, path), text);
}

describe('extractRefs', () => {
  it('finds href and src on any element, unescaping &amp;', () => {
    assert.deepEqual(
      extractRefs(
        '<a href="/apps/">x</a><img src="/i.png" alt=""><link rel="x" href="/s.css?a=1&amp;b=2">',
      ),
      ['/apps/', '/i.png', '/s.css?a=1&b=2'],
    );
  });

  it('reads single-quoted values, each srcset candidate, and share-image and page-URL meta', () => {
    assert.deepEqual(
      extractRefs(
        "<a href='/q/'>q</a>" +
          '<img src="/a.png" srcset="/a-1x.png 1x, /a-2x.png 2x" alt="">' +
          '<meta property="og:image" content="https://1n1.uk/s.png">' +
          '<meta property="og:url" content="https://1n1.uk/">' +
          '<meta name="twitter:image" content="/t.png">' +
          '<meta name="description" content="Not a link.">',
      ),
      [
        '/q/',
        '/a.png',
        '/a-1x.png',
        '/a-2x.png',
        'https://1n1.uk/s.png',
        'https://1n1.uk/',
        '/t.png',
      ],
    );
  });
});

describe('extractIds', () => {
  it('collects every id', () => {
    assert.deepEqual([...extractIds('<h2 id="a">x</h2><p id="b-c">y</p>')], ['a', 'b-c']);
  });
});

describe('resolveTarget', () => {
  it('ignores mail, telephone and external links', () => {
    for (const ref of ['mailto:a@b.c', 'tel:1', 'https://x.y/', 'http://x.y/', '//x.y/']) {
      assert.equal(resolveTarget(root, join(root, 'index.html'), ref), null);
    }
  });

  it('ignores data: and javascript: references, which name no file', () => {
    for (const ref of ['data:image/png;base64,AAAA', 'javascript:void(0)']) {
      assert.equal(resolveTarget(root, join(root, 'index.html'), ref), null);
    }
  });

  it("treats the site's own absolute URLs as internal", () => {
    const from = join(root, 'index.html');
    assert.deepEqual(resolveTarget(root, from, 'https://1n1.uk/s.png', 'https://1n1.uk'), {
      file: join(root, 's.png'),
      hash: '',
    });
    assert.deepEqual(resolveTarget(root, from, 'https://1n1.uk', 'https://1n1.uk'), {
      file: join(root, 'index.html'),
      hash: '',
    });
    assert.equal(resolveTarget(root, from, 'https://1n1.ukx/a', 'https://1n1.uk'), null);
  });

  it('decodes an encoded path before looking for its file', () => {
    assert.deepEqual(resolveTarget(root, join(root, 'index.html'), '/a%20b.png'), {
      file: join(root, 'a b.png'),
      hash: '',
    });
  });

  it('maps a site path to its file: a folder to its index, a bare path to a folder or a file', () => {
    put('apps/index.html', '');
    put('assets/s.css', '');
    const from = join(root, 'index.html');
    assert.deepEqual(resolveTarget(root, from, '/apps/'), {
      file: join(root, 'apps/index.html'),
      hash: '',
    });
    assert.deepEqual(resolveTarget(root, from, '/apps'), {
      file: join(root, 'apps/index.html'),
      hash: '',
    });
    assert.deepEqual(resolveTarget(root, from, '/assets/s.css?v=1'), {
      file: join(root, 'assets/s.css'),
      hash: '',
    });
    assert.deepEqual(resolveTarget(root, from, '/missing'), {
      file: join(root, 'missing'),
      hash: '',
    });
  });

  it('resolves relative paths and same-page anchors', () => {
    put('privacy/index.html', '');
    const from = join(root, 'privacy/meantime/index.html');
    assert.deepEqual(resolveTarget(root, from, '../'), {
      file: join(root, 'privacy/index.html'),
      hash: '',
    });
    assert.deepEqual(resolveTarget(root, from, '#who'), { file: from, hash: 'who' });
    assert.deepEqual(resolveTarget(root, from, '/privacy/#x'), {
      file: join(root, 'privacy/index.html'),
      hash: 'x',
    });
  });
});

describe('listHtml', () => {
  it('lists every html file under the root, sorted', () => {
    put('index.html', '');
    put('a/index.html', '');
    put('a/x.css', '');
    assert.deepEqual(listHtml(root), [join(root, 'a/index.html'), join(root, 'index.html')]);
  });
});

describe('checkSite', () => {
  it('passes a site whose links, assets and anchors all exist', () => {
    put(
      'index.html',
      '<a href="/apps/">a</a><a href="/apps/#m">m</a><img src="/i.png" alt=""><a href="mailto:x@y.z">e</a>',
    );
    put('apps/index.html', '<h2 id="m">M</h2><a href="/">home</a>');
    put('i.png', 'x');
    assert.deepEqual(checkSite(root), []);
  });

  it('reports a missing page, a missing asset and a missing anchor, with where each was found', () => {
    put('index.html', '<a href="/gone/">a</a><img src="/x.png" alt=""><a href="#nope">n</a>');
    assert.deepEqual(checkSite(root), [
      { page: 'index.html', ref: '/gone/', problem: 'no such file' },
      { page: 'index.html', ref: '/x.png', problem: 'no such file' },
      { page: 'index.html', ref: '#nope', problem: 'no element with id "nope"' },
    ]);
  });

  it("checks the site's own absolute URLs, such as the share image", () => {
    put(
      'index.html',
      '<link rel="canonical" href="https://1n1.uk/"><meta property="og:image" content="https://1n1.uk/gone.png">',
    );
    assert.deepEqual(checkSite(root, 'https://1n1.uk'), [
      { page: 'index.html', ref: 'https://1n1.uk/gone.png', problem: 'no such file' },
    ]);
  });
});

describe('main', () => {
  it('passes, and says how many pages it checked', () => {
    put('index.html', '<a href="/">home</a>');
    const lines = [];
    assert.equal(
      main([root], (l) => lines.push(l)),
      0,
    );
    assert.match(lines.join('\n'), /check:links: 1 page, every link resolves/);
  });

  it("takes the site's address as its second argument", () => {
    put('index.html', '<meta property="og:image" content="https://1n1.uk/gone.png">');
    const lines = [];
    assert.equal(
      main([root, 'https://1n1.uk'], (l) => lines.push(l)),
      1,
    );
    assert.match(lines.join('\n'), /https:\/\/1n1\.uk\/gone\.png \(no such file\)/);
  });

  it('fails, listing each broken link', () => {
    put('index.html', '<a href="/gone/">a</a>');
    const lines = [];
    assert.equal(
      main([root], (l) => lines.push(l)),
      1,
    );
    assert.match(lines.join('\n'), /index\.html: \/gone\/ \(no such file\)/);
  });

  it('fails when there is no built site to check', () => {
    const lines = [];
    assert.equal(
      main([join(root, 'none')], (l) => lines.push(l)),
      1,
    );
    assert.match(lines.join('\n'), /no built site/);
  });
});

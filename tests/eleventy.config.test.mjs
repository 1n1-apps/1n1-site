import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import configure, { isoDate, longDate, markSvg } from '../eleventy.config.js';

describe('markSvg', () => {
  it('inlines the mark source without its prolog or comment, trimmed to the domino', () => {
    const source =
      '<?xml version="1.0" encoding="UTF-8"?>\n<!-- a note -->\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">\n  <rect width="1"/>\n  <circle r="2"/>\n</svg>\n';
    assert.equal(
      markSvg(source),
      '<svg class="mk" viewBox="20 4 60 92" aria-hidden="true" focusable="false"><rect width="1"/><circle r="2"/></svg>',
    );
  });
});

describe('isoDate', () => {
  it('takes a YAML Date or an ISO string, in UTC', () => {
    assert.equal(isoDate(new Date(Date.UTC(2026, 9, 6))), '2026-10-06');
    assert.equal(isoDate('2026-10-06'), '2026-10-06');
  });

  it('refuses anything else', () => {
    assert.throws(() => isoDate('6 October'), /not an ISO date: 6 October/);
  });
});

describe('longDate', () => {
  it('writes the day, the month name and the year', () => {
    assert.equal(longDate('2026-10-06'), '6 October 2026');
    assert.equal(longDate(new Date(Date.UTC(2027, 0, 31))), '31 January 2027');
  });
});

describe('the Eleventy configuration', () => {
  function fakeEleventy() {
    const calls = { passthrough: [], collections: {}, filters: {}, shortcodes: {}, ignores: [] };
    return {
      calls,
      ignores: { add: (g) => calls.ignores.push(g) },
      addPassthroughCopy: (p) => calls.passthrough.push(p),
      addCollection: (name, fn) => {
        calls.collections[name] = fn;
      },
      addFilter: (name, fn) => {
        calls.filters[name] = fn;
      },
      addShortcode: (name, fn) => {
        calls.shortcodes[name] = fn;
      },
    };
  }

  it('reads src into _site and registers the mark, the filters and the copies', () => {
    const e = fakeEleventy();
    const result = configure(e);
    assert.deepEqual(result.dir, {
      input: 'src',
      output: '_site',
      includes: '_includes',
      data: '_data',
    });
    assert.match(e.calls.shortcodes.mark(), /^<svg class="mk"/);
    assert.equal(e.calls.filters.longDate('2026-10-06'), '6 October 2026');
    assert.equal(e.calls.filters.isoDate('2026-10-06'), '2026-10-06');
    assert.deepEqual(e.calls.ignores, ['src/assets/**/*.md']);
    assert.equal(e.calls.passthrough.length, 3);
  });

  it('orders the apps and the policies by their front matter', () => {
    const e = fakeEleventy();
    configure(e);
    const items = [{ data: { order: 2 } }, { data: { order: 1 } }];
    const api = { getFilteredByTag: () => [...items] };
    assert.deepEqual(
      e.calls.collections.apps(api).map((i) => i.data.order),
      [1, 2],
    );
    assert.deepEqual(
      e.calls.collections.policies(api).map((i) => i.data.order),
      [1, 2],
    );
  });
});

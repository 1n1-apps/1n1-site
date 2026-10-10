import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { inForce, policyHistory, policyJson, versionsOf } from '../eleventy.config.js';

const item = (app, version, extra = {}) => ({
  url: `/privacy/${app.toLowerCase()}/v${version}/`,
  data: { app, version, effective: '2026-10-09', ...extra },
});

describe('versionsOf', () => {
  it("keeps one app's versions, oldest first", () => {
    const items = [item('Meantime', 2), item('Other', 1), item('Meantime', 1)];
    assert.deepEqual(
      versionsOf(items, 'Meantime').map((i) => i.data.version),
      [1, 2],
    );
  });

  it('refuses an app with a gap or a repeat in its versions', () => {
    assert.throws(() => versionsOf([item('Meantime', 1), item('Meantime', 3)], 'Meantime'), /v2/);
    assert.throws(() => versionsOf([item('Meantime', 1), item('Meantime', 1)], 'Meantime'), /v2/);
  });

  it('refuses an app with no versions', () => {
    assert.throws(() => versionsOf([], 'Meantime'), /no policy versions for Meantime/);
  });
});

/**
 * per the owner (2026-10-10): a version is published when it merges and comes into force only when
 * a release promotes it, which is weeks later. `src/_data/policiesInForce.json` is that record.
 */
describe('policyHistory', () => {
  const three = [item('Meantime', 1), item('Meantime', 2), item('Meantime', 3)];
  const record = {
    Meantime: [
      { version: 1, from: '2026-10-08' },
      { version: 2, from: '2026-11-02' },
    ],
  };

  it('says when each version was in force, and that a newer one is not yet', () => {
    assert.deepEqual(
      policyHistory(three, 'Meantime', record).map(({ item: i, from, until }) => [
        i.data.version,
        from,
        until,
      ]),
      [
        [1, '2026-10-08', '2026-11-02'],
        [2, '2026-11-02', null],
        [3, null, null],
      ],
    );
  });

  it('refuses an app with nothing in force', () => {
    assert.throws(() => policyHistory(three, 'Meantime', {}), /no version of Meantime/);
    assert.throws(() => policyHistory(three, 'Meantime', { Meantime: [] }), /no version/);
  });

  it('refuses a record naming a version that has no file', () => {
    const record4 = { Meantime: [{ version: 4, from: '2026-10-08' }] };
    assert.throws(
      () => policyHistory(three, 'Meantime', record4),
      /v4 is in force but has no file/,
    );
  });

  it('refuses versions promoted out of order, or back in time', () => {
    const backwards = {
      Meantime: [
        { version: 2, from: '2026-10-08' },
        { version: 1, from: '2026-11-02' },
      ],
    };
    assert.throws(() => policyHistory(three, 'Meantime', backwards), /out of order/);
    const early = {
      Meantime: [
        { version: 1, from: '2026-10-08' },
        { version: 2, from: '2026-10-01' },
      ],
    };
    assert.throws(() => policyHistory(three, 'Meantime', early), /before v1/);
  });
});

describe('inForce', () => {
  it('is the last version promoted, not the newest published', () => {
    const current = inForce([item('Meantime', 1), item('Meantime', 2)], 'Meantime', {
      Meantime: [{ version: 1, from: '2026-10-08' }],
    });
    assert.equal(current.item.data.version, 1);
    assert.equal(current.from, '2026-10-08');
  });
});

describe('policyJson', () => {
  it('publishes the version, the day it came into force and the permissions table, and nothing else', () => {
    const json = policyJson({
      item: item('Meantime', 1, {
        effective: '2026-10-01',
        summary: [{ what: 'x' }],
        permissions: [
          { name: 'android.permission.INTERNET', for: 'The forecast', refused: 'Not asked' },
        ],
      }),
      from: '2026-10-09',
    });
    assert.deepEqual(JSON.parse(json), {
      app: 'Meantime',
      version: 1,
      effective: '2026-10-09',
      url: '/privacy/meantime/v1/',
      permissions: [
        { name: 'android.permission.INTERNET', for: 'The forecast', refused: 'Not asked' },
      ],
    });
  });

  it('refuses a version with no permissions table', () => {
    assert.throws(
      () => policyJson({ item: item('Meantime', 1), from: '2026-10-09' }),
      /permissions/,
    );
  });
});

/**
 * per Meantime's ADR 0306 decision 7 (in the app repository): a published policy version is frozen.
 * `src/privacy/frozen.json` holds the digest of every version file; a change to one fails here, and
 * the fix is a new version, never an edit (docs/runbooks/privacy-policies.md).
 */
describe('frozen policy versions', () => {
  const frozen = JSON.parse(readFileSync('src/privacy/frozen.json', 'utf8'));
  const files = readdirSync('src/privacy')
    .filter((name) => statSync(join('src/privacy', name)).isDirectory())
    .flatMap((app) =>
      readdirSync(join('src/privacy', app))
        .filter((name) => /^v\d+\.md$/.test(name))
        .map((name) => `${app}/${name}`),
    )
    .sort();
  const digest = (path) =>
    createHash('sha256')
      .update(readFileSync(join('src/privacy', path), 'utf8').replace(/\r\n/g, '\n'))
      .digest('hex');

  it('lists every version file, and nothing else', () => {
    assert.deepEqual(Object.keys(frozen).sort(), files);
  });

  for (const path of files) {
    it(`has not changed ${path} since it was published`, () => {
      assert.equal(digest(path), frozen[path]);
    });
  }
});

/**
 * The rendered site: the policy's address shows the version in force whole, and `policy.json` is that
 * version's data; a version published and not yet promoted says so on its own page. Rendered in
 * memory, so it needs no build first.
 */
describe('the rendered policy pages', async () => {
  const { default: Eleventy } = await import('@11ty/eleventy');
  const pages = await new Eleventy('src', '_site', {
    quietMode: true,
    configPath: 'eleventy.config.js',
  }).toJSON();
  const page = (url) => pages.find((p) => p.url === url)?.content ?? '';
  const record = JSON.parse(readFileSync('src/_data/policiesInForce.json', 'utf8'));
  const versions = versionsOf(
    pages
      .filter((p) => /^\/privacy\/meantime\/v\d+\/$/.test(p.url))
      .map((p) => ({
        url: p.url,
        data: { app: 'Meantime', version: Number(p.url.match(/v(\d+)/)[1]) },
      })),
    'Meantime',
  );
  const latest = inForce(versions, 'Meantime', record).item;
  const json = JSON.parse(page('/privacy/meantime/policy.json'));

  it("shows the version in force, its text and its whole permissions table at the policy's address", () => {
    const current = page('/privacy/meantime/');
    assert.match(current, new RegExp(`Version ${json.version}, in force since`));
    assert.equal(json.url, latest.url);
    assert.equal(json.effective, record.Meantime.at(-1).from);
    for (const { name } of json.permissions)
      assert.ok(current.includes(`<code>${name}</code>`), name);
    assert.match(current, /<h2 id="what-leaves-your-phone"|What leaves your phone/);
  });

  it('publishes a version not yet promoted, and says it is not in force', () => {
    for (const { item: v, from } of policyHistory(versions, 'Meantime', record)) {
      if (from !== null) continue;
      assert.match(
        page(v.url),
        new RegExp(`Version ${v.data.version}, published, not yet in force`),
      );
    }
  });

  it('renders the frozen version page with the same text', () => {
    const frozen = page(latest.url);
    for (const { name } of json.permissions)
      assert.ok(frozen.includes(`<code>${name}</code>`), name);
  });
});

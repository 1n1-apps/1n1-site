import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { latestVersion, policyJson, versionsOf } from '../eleventy.config.js';

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

describe('latestVersion', () => {
  it('is the highest version', () => {
    assert.equal(
      latestVersion([item('Meantime', 1), item('Meantime', 2)], 'Meantime').data.version,
      2,
    );
  });
});

describe('policyJson', () => {
  it('publishes the version, the effective date and the permissions table, and nothing else', () => {
    const json = policyJson(
      item('Meantime', 1, {
        effective: new Date(Date.UTC(2026, 9, 9)),
        summary: [{ what: 'x' }],
        permissions: [
          { name: 'android.permission.INTERNET', for: 'The forecast', refused: 'Not asked' },
        ],
      }),
    );
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
    assert.throws(() => policyJson(item('Meantime', 1)), /permissions/);
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

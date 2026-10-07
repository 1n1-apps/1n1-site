import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

// The display name goes wherever the site names itself: the browser tab, the share title and the
// copyright line. Running text, descriptions and URLs keep the shorthand 1n1
// (1n1-studio docs/design/copy-conventions.md § Names, owner 2026-10-07).
describe('the display name', () => {
  const site = JSON.parse(readFileSync('src/_data/site.json', 'utf8'));
  const base = readFileSync('src/_includes/base.njk', 'utf8');

  it('is 1·n·1, with middle dots', () => {
    assert.equal(site.name, '1·n·1');
  });

  it('names the tab, the share title and the copyright line, with no literal shorthand left there', () => {
    const title = base.match(/<title>(.*)<\/title>/)[1];
    const ogTitle = base.match(/<meta property="og:title" content="([^"]*)">/)[1];
    const copyright = base.match(/<p>© (.*)<\/p>/)[1];
    for (const slot of [title, ogTitle, copyright]) {
      assert.match(slot, /\{\{ site\.name \}\}/);
      assert.doesNotMatch(slot, /1n1/);
    }
  });
});

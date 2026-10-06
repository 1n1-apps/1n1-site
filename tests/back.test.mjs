import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { cameFromHere } from '../src/assets/back.js';

describe('cameFromHere', () => {
  it('goes back through history when the visitor arrived from another page of this site', () => {
    assert.equal(cameFromHere('https://1n1.uk/apps/', 'https://1n1.uk', 3), true);
  });

  it('follows the link up instead when they arrived from elsewhere, or have nowhere to go back to', () => {
    assert.equal(cameFromHere('https://play.google.com/store', 'https://1n1.uk', 3), false);
    assert.equal(cameFromHere('', 'https://1n1.uk', 3), false);
    assert.equal(cameFromHere('https://1n1.uk/', 'https://1n1.uk', 1), false);
    assert.equal(cameFromHere('https://1n1.uk.evil.example/', 'https://1n1.uk', 3), false);
  });
});

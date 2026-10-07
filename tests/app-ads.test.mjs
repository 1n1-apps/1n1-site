import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

// AdMob reads https://1n1.uk/app-ads.txt to confirm 1n1 is Meantime's authorised seller. The line
// is AdMob's own, for publisher pub-3031935896058968 (1n1-studio E2-T2, #16). A changed or moved
// file stops buyers bidding, so this fails the build first.
describe('app-ads.txt', () => {
  it("holds exactly AdMob's line for 1n1's publisher ID", () => {
    assert.equal(
      readFileSync('src/app-ads.txt', 'utf8').replace(/\r\n/g, '\n'),
      'google.com, pub-3031935896058968, DIRECT, f08c47fec0942fa0\n',
    );
  });
});

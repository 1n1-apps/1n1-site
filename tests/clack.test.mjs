import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { MAX_VOICES, clack, hits } from '../src/assets/clack.js';

// A repeatable stand-in for Math.random.
function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

describe('clack', () => {
  it('is a click, not a note: very short, bright, and barely pitched', () => {
    const random = seeded(7);
    for (let i = 0; i < 500; i++) {
      const c = clack(random);
      assert.ok(c.filter >= 2500 && c.filter <= 6000, `filter ${c.filter}`);
      assert.ok(c.q >= 1.5 && c.q <= 4, `q ${c.q}`);
      assert.ok(c.tone >= 1400 && c.tone <= 2600, `tone ${c.tone}`);
      assert.ok(c.gain >= 0.25 && c.gain <= 0.45, `gain ${c.gain}`);
      assert.ok(c.decay >= 0.004 && c.decay <= 0.014, `decay ${c.decay}`);
    }
  });

  it('never sounds exactly the same twice in a row', () => {
    const random = seeded(11);
    let previous = clack(random);
    for (let i = 0; i < 200; i++) {
      const next = clack(random);
      assert.notDeepEqual(next, previous);
      previous = next;
    }
  });
});

describe('hits', () => {
  it('is one clack, sometimes followed by a quieter second tap a moment later', () => {
    const random = seeded(3);
    let doubles = 0;
    for (let i = 0; i < 400; i++) {
      const h = hits(random);
      assert.ok(h.length === 1 || h.length === 2);
      assert.equal(h[0].at, 0);
      if (h.length === 2) {
        doubles++;
        assert.ok(h[1].at >= 0.025 && h[1].at <= 0.06, `second tap at ${h[1].at}`);
        assert.ok(h[1].gain < h[0].gain);
      }
    }
    assert.ok(doubles > 60 && doubles < 220, `${doubles} doubles in 400`);
  });

  it('caps how many can sound at once, so spam clicking stays a clatter, not a roar', () => {
    assert.ok(MAX_VOICES >= 4 && MAX_VOICES <= 10);
  });
});

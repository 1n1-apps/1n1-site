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
  it('is a struck plastic tile: a few inharmonic partials, damped fast, dulled, a little rough', () => {
    const random = seeded(7);
    for (let i = 0; i < 500; i++) {
      const c = clack(random);
      assert.equal(c.modes.length, 5);
      assert.ok(c.modes[0].freq >= 950 && c.modes[0].freq <= 1650, `base ${c.modes[0].freq}`);
      for (let m = 1; m < c.modes.length; m++) {
        const ratio = c.modes[m].freq / c.modes[0].freq;
        assert.ok(Math.abs(ratio - Math.round(ratio)) > 0.04, `harmonic ratio ${ratio}`);
        assert.ok(c.modes[m].freq > c.modes[m - 1].freq);
        assert.ok(c.modes[m].decay < c.modes[m - 1].decay, 'higher modes die first');
      }
      for (const mode of c.modes) {
        assert.ok(mode.decay >= 0.0015 && mode.decay <= 0.016, `decay ${mode.decay}`);
        assert.ok(mode.level > 0 && mode.level <= 1);
      }
      assert.ok(c.gain >= 0.12 && c.gain <= 0.24, `gain ${c.gain}`);
      assert.ok(c.tick >= 0.5 && c.tick <= 1, `tick ${c.tick}`);
      assert.ok(c.rough >= 0.15 && c.rough <= 0.35, `rough ${c.rough}`);
      assert.ok(c.dull >= 4500 && c.dull <= 6500, `dull ${c.dull}`);
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

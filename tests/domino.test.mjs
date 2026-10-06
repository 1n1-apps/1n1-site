import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  FLICK,
  MAX_SPEED,
  POP,
  flick,
  load,
  pop,
  save,
  settled,
  step,
} from '../src/assets/domino.js';

const still = () => ({ angle: 0, speed: 0 });

describe('flick', () => {
  it('adds speed in the direction the pointer crossed, and each flick adds more', () => {
    const s = still();
    flick(s, 1);
    assert.equal(s.speed, FLICK);
    flick(s, 1);
    assert.equal(s.speed, 2 * FLICK);
    flick(s, -1);
    assert.equal(s.speed, FLICK);
  });

  it('never spins faster than the cap', () => {
    const s = { angle: 0, speed: MAX_SPEED - 1 };
    flick(s, 1);
    assert.equal(s.speed, MAX_SPEED);
    const back = { angle: 0, speed: -MAX_SPEED };
    flick(back, -1);
    assert.equal(back.speed, -MAX_SPEED);
  });
});

describe('pop', () => {
  it('sends it spinning hard the way it was already going, forwards when still', () => {
    const s = still();
    pop(s);
    assert.equal(s.speed, POP);
    const back = { angle: 0, speed: -100 };
    pop(back);
    assert.equal(back.speed, -100 - POP);
  });
});

describe('step', () => {
  it('turns by its speed and slows down', () => {
    const s = { angle: 0, speed: 720 };
    step(s, 0.1);
    assert.ok(s.angle > 60 && s.angle < 72, `turned ${s.angle}`);
    assert.ok(s.speed < 720 && s.speed > 0, `slowed to ${s.speed}`);
  });

  it('comes to rest upright, on a multiple of 180 degrees', () => {
    const s = { angle: 0, speed: 1500 };
    for (let i = 0; i < 600; i++) step(s, 1 / 60);
    assert.ok(settled(s), `still moving: ${JSON.stringify(s)}`);
    assert.equal(s.angle % 180, 0);
  });

  it('settles a slow turn back to the nearest upright side', () => {
    const s = { angle: 100, speed: 0 };
    for (let i = 0; i < 600; i++) step(s, 1 / 60);
    assert.equal(s.angle, 180);
  });
});

describe('settled', () => {
  it('is true only when still and upright', () => {
    assert.equal(settled({ angle: 180, speed: 0 }), true);
    assert.equal(settled({ angle: 170, speed: 0 }), false);
    assert.equal(settled({ angle: 180, speed: 50 }), false);
  });
});

function memory(initial = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = String(v);
    },
  };
}

describe('save and load', () => {
  it('carries a spin from one page to the next', () => {
    const store = memory();
    save(store, { angle: 90.5, speed: 400 });
    assert.deepEqual(load(store), { angle: 90.5, speed: 400 });
  });

  it('starts still when nothing was saved, the record is damaged, or storage refuses', () => {
    assert.deepEqual(load(memory()), still());
    assert.deepEqual(load(memory({ domino: '{nope' })), still());
    assert.deepEqual(load(memory({ domino: '{"angle":"x","speed":1}' })), still());
    assert.deepEqual(load(null), still());
    const refusing = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
    };
    assert.deepEqual(load(refusing), still());
    save(refusing, { angle: 1, speed: 1 });
  });
});

// @ts-check
// The domino in the logo spins (ADR 0003 decision 6). Each flick of the pointer across it adds speed,
// friction slows it, and as it comes to rest a spring settles it upright, on a multiple of 180 degrees.
// A click presses it down and pops it up spinning hard. The spin is saved as the page is left, so it
// carries on across a page change. With reduced motion none of this runs.

/** Degrees per second a flick adds: one flick is enough for a full turn. */
export const FLICK = 420;
/** Degrees per second a click adds. */
export const POP = 900;
/** The fastest it ever turns, in degrees per second. */
export const MAX_SPEED = 1800;
/** How quickly friction slows it: the share of speed kept each second is e^-FRICTION. */
const FRICTION = 1.4;
/** Below this speed the spring takes over and carries it on to the next upright side. */
const SETTLE = 160;
const STIFFNESS = 40;
/** Critical damping: it arrives without swinging past and back. */
const DAMPING = 2 * Math.sqrt(STIFFNESS);

/** @typedef {{ angle: number, speed: number }} Spin */

/** @param {number} speed */
const cap = (speed) => Math.max(-MAX_SPEED, Math.min(MAX_SPEED, speed));

/**
 * @param {Spin} spin
 * @param {number} direction 1 for a flick to the right, -1 to the left
 */
export function flick(spin, direction) {
  spin.speed = cap(spin.speed + FLICK * direction);
}

/** @param {Spin} spin */
export function pop(spin) {
  spin.speed = cap(spin.speed + POP * (spin.speed < 0 ? -1 : 1));
}

/** @param {Spin} spin */
export function settled(spin) {
  return spin.speed === 0 && spin.angle % 180 === 0;
}

/**
 * How large the domino draws at a speed: up to a third larger at the cap, either way round.
 * @param {number} speed
 */
export function sizeFor(speed) {
  return 1 + Math.min(1, Math.abs(speed) / MAX_SPEED) / 3;
}

/** @param {number} angle */
const upright = (angle) => ((angle % 360) + 360) % 360;

/**
 * Move the spin on by `seconds`. Once slow, it settles on the next upright side in the direction it
 * is turning (the nearest, when still), and never turns back.
 * @param {Spin} spin
 * @param {number} seconds
 */
export function step(spin, seconds) {
  spin.speed *= Math.exp(-FRICTION * seconds);
  if (Math.abs(spin.speed) >= SETTLE) {
    spin.angle += spin.speed * seconds;
    return;
  }
  const half = spin.angle / 180;
  const target =
    180 * (spin.speed > 0 ? Math.ceil(half) : spin.speed < 0 ? Math.floor(half) : Math.round(half));
  spin.speed += ((target - spin.angle) * STIFFNESS - spin.speed * DAMPING) * seconds;
  const next = spin.angle + spin.speed * seconds;
  const arrived = (next - target) * (spin.angle - target) <= 0 || Math.abs(target - next) < 0.5;
  if (arrived && Math.abs(spin.speed) < SETTLE) {
    spin.angle = upright(target);
    spin.speed = 0;
    return;
  }
  spin.angle = next;
}

/**
 * @param {Storage | null} storage
 * @param {Spin} spin
 */
export function save(storage, spin) {
  try {
    storage && storage.setItem('domino', JSON.stringify(spin));
  } catch {
    // Storage refused: the next page starts still.
  }
}

/**
 * @param {Storage | null} storage
 * @returns {Spin}
 */
export function load(storage) {
  try {
    const saved = JSON.parse((storage && storage.getItem('domino')) || 'null');
    if (saved && Number.isFinite(saved.angle) && Number.isFinite(saved.speed)) {
      return { angle: saved.angle, speed: saved.speed };
    }
  } catch {
    // A damaged record or refused storage: start still.
  }
  return { angle: 0, speed: 0 };
}

/* node:coverage disable */
// The browser wiring: events and the animation frame. The physics above is what the tests cover.
if (typeof document !== 'undefined') {
  const brand = /** @type {HTMLAnchorElement | null} */ (document.querySelector('.brand'));
  const mark = /** @type {SVGElement | null} */ (brand && brand.querySelector('.mk'));
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (brand && mark && !still) {
    let storage = null;
    try {
      storage = window.sessionStorage;
    } catch {
      storage = null;
    }
    const spin = load(storage);
    let last = 0;
    let running = false;
    const draw = () => {
      mark.style.rotate = `${spin.angle}deg`;
      mark.style.scale = String(sizeFor(spin.speed));
    };
    /** @param {number} now */
    const frame = (now) => {
      step(spin, Math.min(0.05, (now - last) / 1000));
      last = now;
      draw();
      if (settled(spin)) {
        running = false;
        brand.classList.remove('spinning');
      } else requestAnimationFrame(frame);
    };
    const run = () => {
      brand.classList.add('spinning');
      if (running) return;
      running = true;
      last = performance.now();
      requestAnimationFrame(frame);
    };
    draw();
    if (!settled(spin)) run();

    brand.addEventListener('pointerenter', (event) => {
      flick(spin, event.movementX < 0 ? -1 : 1);
      run();
    });
    brand.addEventListener('pointerdown', () => brand.classList.add('pressed'));
    const release = () => brand.classList.remove('pressed');
    brand.addEventListener('pointerleave', release);
    brand.addEventListener('pointercancel', release);
    brand.addEventListener('pointerup', () => {
      release();
      pop(spin);
      run();
    });
    // On the home page the logo already points here: spin instead of reloading.
    brand.addEventListener('click', (event) => {
      if (new URL(brand.href).pathname === location.pathname) event.preventDefault();
    });
    window.addEventListener('pagehide', () => save(storage, spin));
  }
}
/* node:coverage enable */

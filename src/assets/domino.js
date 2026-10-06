// @ts-check
// The domino in the logo spins (ADR 0003 decision 6). Each flick of the pointer across it adds speed,
// friction slows it, and as it comes to rest a spring settles it upright, on a multiple of 180 degrees.
// A click presses it down and pops it up spinning hard. The spin is saved as the page is left, so it
// carries on across a page change. With reduced motion none of this runs.

/** Degrees per second a flick adds. */
export const FLICK = 540;
/** Degrees per second a click adds. */
export const POP = 1800;
/** The fastest it ever turns, in degrees per second. */
export const MAX_SPEED = 3600;
/** How quickly friction slows it: the share of speed kept each second is e^-FRICTION. */
const FRICTION = 1.4;
/** Below this speed the spring takes over and brings it upright. */
const SETTLE = 160;
const STIFFNESS = 70;
const DAMPING = 11;

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
 * Move the spin on by `seconds`.
 * @param {Spin} spin
 * @param {number} seconds
 */
export function step(spin, seconds) {
  spin.speed *= Math.exp(-FRICTION * seconds);
  if (Math.abs(spin.speed) < SETTLE) {
    const upright = Math.round(spin.angle / 180) * 180;
    spin.speed += ((upright - spin.angle) * STIFFNESS - spin.speed * DAMPING) * seconds;
    if (Math.abs(upright - spin.angle) < 0.5 && Math.abs(spin.speed) < 5) {
      spin.angle = ((upright % 360) + 360) % 360;
      spin.speed = 0;
      return;
    }
  }
  spin.angle += spin.speed * seconds;
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
    };
    /** @param {number} now */
    const frame = (now) => {
      step(spin, Math.min(0.05, (now - last) / 1000));
      last = now;
      draw();
      if (settled(spin)) running = false;
      else requestAnimationFrame(frame);
    };
    const run = () => {
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

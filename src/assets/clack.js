// @ts-check
// The domino's clack (ADR 0003 decision 6), by modal synthesis: a struck plastic tile rings at a few
// high, inharmonic frequencies that die away within tens of milliseconds, the higher ones first. A
// sub-millisecond tick of bright noise is the strike itself; the ringing partials are what make it a
// clack. Filtered noise alone sounds like a hand clap, and a low or sliding tone like a bloop. Every
// clack draws its own pitch, ring and loudness, and sometimes a quieter second tap, so no two sound
// the same. A cap on voices keeps rapid clicking a clatter rather than a roar. Synthesised in the
// browser: there is no sound file.

/** How many clacks may sound at once; any more are skipped. */
export const MAX_VOICES = 6;

/** @param {() => number} random @param {number} low @param {number} high */
const between = (random, low, high) => low + random() * (high - low);

/** A small plastic block's mode ratios: inharmonic, which is what makes it a clack and not a note. */
const RATIOS = [1, 1.47, 2.23, 2.71, 3.38];

/**
 * One clack: its partials (frequency, level, decay time constant in seconds), its loudness and its
 * strike.
 * @param {() => number} random
 */
export function clack(random) {
  const base = between(random, 1700, 2500);
  const ring = between(random, 0.028, 0.045);
  return {
    modes: RATIOS.map((ratio, i) => ({
      freq: base * ratio * between(random, 0.985, 1.015),
      level: between(random, 0.75, 1) / (1 + i * 0.6),
      decay: ring / (1 + i * 0.55),
    })),
    gain: between(random, 0.12, 0.24),
    tick: between(random, 0.5, 1),
  };
}

/**
 * The taps one click makes: a clack, and about a third of the time a quieter one just after, like
 * a tile settling.
 * @param {() => number} random
 */
export function hits(random) {
  const first = { at: 0, ...clack(random) };
  if (random() >= 0.33) return [first];
  const second = clack(random);
  return [
    first,
    { ...second, at: between(random, 0.025, 0.06), gain: first.gain * between(random, 0.35, 0.6) },
  ];
}

/* node:coverage disable */
/** @type {AudioContext | null} */
let context = null;
/** @type {AudioBuffer | null} */
let noise = null;
let voices = 0;

/** Play one click's clack. Safe to call as fast as the visitor can click. */
export function play() {
  const Context = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
  if (!Context) return;
  if (!context) {
    context = new Context();
    noise = context.createBuffer(1, Math.ceil(context.sampleRate * 0.12), context.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const audio = /** @type {AudioContext} */ (context);
  if (audio.state === 'suspended') audio.resume();
  for (const hit of hits(Math.random)) {
    if (voices >= MAX_VOICES) return;
    voices++;
    const start = audio.currentTime + hit.at;
    const out = audio.createGain();
    out.gain.value = hit.gain;
    out.connect(audio.destination);

    // The strike: under a millisecond of noise, high-passed so it ticks rather than thumps.
    const strike = audio.createBufferSource();
    strike.buffer = noise;
    const bright = audio.createBiquadFilter();
    bright.type = 'highpass';
    bright.frequency.value = 3000;
    const strikeGain = audio.createGain();
    strikeGain.gain.setValueAtTime(hit.tick, start);
    strikeGain.gain.setTargetAtTime(0, start, 0.0004);
    strike.connect(bright).connect(strikeGain).connect(out);
    strike.start(start);
    strike.stop(start + 0.004);

    // The tile ringing: each partial starts at once and dies exponentially.
    let longest = 0;
    for (const mode of hit.modes) {
      const partial = audio.createOscillator();
      partial.frequency.value = mode.freq;
      const level = audio.createGain();
      level.gain.setValueAtTime(mode.level, start);
      level.gain.setTargetAtTime(0, start, mode.decay);
      partial.connect(level).connect(out);
      partial.start(start);
      partial.stop(start + mode.decay * 7);
      longest = Math.max(longest, mode.decay * 7);
    }
    // Freed on a timer, not on `ended`: a suspended context may never report it, and a voice that
    // never frees would silence the domino for the rest of the visit.
    setTimeout(
      () => {
        voices--;
      },
      (hit.at + longest) * 1000 + 50,
    );
  }
}
/* node:coverage enable */

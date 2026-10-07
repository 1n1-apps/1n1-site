// @ts-check
// The domino's clack (ADR 0003 decision 6): a short burst of noise through a narrow band-pass, for
// the tile's edge, over a small wooden tock. Every clack draws its own pitch, brightness, loudness and
// length, and sometimes a quieter second tap, so no two sound the same. A cap on voices keeps rapid
// clicking a clatter rather than a roar. Synthesised in the browser: there is no sound file.

/** How many clacks may sound at once; any more are skipped. */
export const MAX_VOICES = 6;

/** @param {() => number} random @param {number} low @param {number} high */
const between = (random, low, high) => low + random() * (high - low);

/**
 * One clack's sound.
 * @param {() => number} random
 */
export function clack(random) {
  return {
    filter: between(random, 1800, 3400),
    q: between(random, 4, 9),
    tone: between(random, 300, 520),
    gain: between(random, 0.18, 0.32),
    decay: between(random, 0.03, 0.07),
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
    const end = start + hit.decay * 3;

    const edge = audio.createBufferSource();
    edge.buffer = noise;
    const band = audio.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = hit.filter;
    band.Q.value = hit.q;
    const edgeGain = audio.createGain();
    edgeGain.gain.setValueAtTime(0.0001, start);
    edgeGain.gain.exponentialRampToValueAtTime(hit.gain, start + 0.002);
    edgeGain.gain.exponentialRampToValueAtTime(0.0001, start + hit.decay);
    edge.connect(band).connect(edgeGain).connect(audio.destination);

    const body = audio.createOscillator();
    body.type = 'triangle';
    body.frequency.setValueAtTime(hit.tone, start);
    body.frequency.exponentialRampToValueAtTime(hit.tone * 0.7, start + hit.decay);
    const bodyGain = audio.createGain();
    bodyGain.gain.setValueAtTime(0.0001, start);
    bodyGain.gain.exponentialRampToValueAtTime(hit.gain * 0.6, start + 0.003);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, start + hit.decay * 1.4);
    body.connect(bodyGain).connect(audio.destination);

    edge.start(start);
    edge.stop(end);
    body.start(start);
    body.stop(end);
    // Freed on a timer, not on `ended`: a suspended context may never report it, and a voice that
    // never frees would silence the domino for the rest of the visit.
    setTimeout(
      () => {
        voices--;
      },
      (hit.at + hit.decay * 3) * 1000 + 50,
    );
  }
}
/* node:coverage enable */

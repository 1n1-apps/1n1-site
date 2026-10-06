// @ts-check
// The theme toggle (ADR 0003 in this repository). Dark is the default; a choice of light or dark is
// remembered in localStorage. The head sets the saved theme before first paint; this script only
// reveals the button and handles it. Without scripting the site is dark and the button stays hidden.

/** @param {Storage | null} storage */
export function readTheme(storage) {
  try {
    const value = storage && storage.getItem('theme');
    return value === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

/** @param {'light' | 'dark'} theme */
export function labelFor(theme) {
  return theme === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme';
}

/**
 * Swap the theme. Where the browser can draw a view transition and motion is welcome, the new theme
 * opens as a circle from the button (`--tx`, `--ty`); `theming` on the root folds the page's named
 * transition parts into one, so the circle covers everything. Otherwise the theme changes at once.
 *
 * @param {Document} doc
 * @param {() => void} apply
 * @param {{ x: number, y: number }} origin
 * @param {boolean} reduced
 */
export function transition(doc, apply, origin, reduced) {
  const start = /** @type {any} */ (doc).startViewTransition;
  if (reduced || typeof start !== 'function') {
    apply();
    return;
  }
  const root = doc.documentElement;
  root.style.setProperty('--tx', `${origin.x}px`);
  root.style.setProperty('--ty', `${origin.y}px`);
  root.classList.add('theming');
  start.call(doc, apply).finished.finally(() => root.classList.remove('theming'));
}

/**
 * @param {Document} doc
 * @param {Storage | null} storage
 */
export function setUp(doc, storage) {
  const button = /** @type {HTMLButtonElement | null} */ (doc.querySelector('.theme'));
  if (!button) return;
  const label = /** @type {HTMLElement} */ (button.querySelector('[data-label]'));
  /** @param {'light' | 'dark'} theme */
  const show = (theme) => {
    doc.documentElement.setAttribute('data-theme', theme);
    label.textContent = labelFor(theme);
  };
  show(readTheme(storage));
  button.hidden = false;
  button.addEventListener('click', () => {
    const next = doc.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    const box = button.getBoundingClientRect?.();
    const origin = box
      ? { x: box.left + box.width / 2, y: box.top + box.height / 2 }
      : { x: 0, y: 0 };
    const reduced = !!doc.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    transition(doc, () => show(next), origin, reduced);
    try {
      storage && storage.setItem('theme', next);
    } catch {
      // Storage refused (private mode): the choice lasts for this page only.
    }
  });
}

if (typeof document !== 'undefined') {
  let storage = null;
  try {
    storage = window.localStorage;
  } catch {
    storage = null;
  }
  setUp(document, storage);
}

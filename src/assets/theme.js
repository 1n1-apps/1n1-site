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
    show(next);
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

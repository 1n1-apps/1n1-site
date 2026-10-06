// @ts-check
// The back arrow on every page but home (ADR 0003 decision 8). Its link goes one level up, which is
// where it leads without scripting. With scripting, a visitor who came from another page of this site
// goes back to that page instead, wherever it was.

/**
 * @param {string} referrer document.referrer
 * @param {string} origin location.origin
 * @param {number} depth history.length
 */
export function cameFromHere(referrer, origin, depth) {
  return depth > 1 && (referrer === origin || referrer.startsWith(`${origin}/`));
}

/* node:coverage disable */
if (typeof document !== 'undefined') {
  const back = document.querySelector('[data-back]');
  back?.addEventListener('click', (event) => {
    if (cameFromHere(document.referrer, location.origin, history.length)) {
      event.preventDefault();
      history.back();
    }
  });
}
/* node:coverage enable */

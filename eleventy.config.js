// Eleventy builds the 1n1 site from `src/` into `_site/` (ADR 0002 in this repository).
// Content lives in Markdown and data files, structure in `src/_includes/`, presentation in
// `src/assets/site.css`; a new app is one file under `src/apps/` and one under `src/privacy/`.

import { readFileSync } from 'node:fs';

// The studio's mark source (copied verbatim from 1n1-studio/brand/mark.svg), inlined so it takes
// the page's colours: the tile is currentColor, the pips the accent, the divider the ground.
// The XML prolog and comment are dropped, and the viewBox trimmed to the domino's own box.
export function markSvg(source) {
  const inner = source
    .replace(/<\?xml[^>]*\?>/, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .trim()
    .replace(/\s*\n\s*/g, '');
  return `<svg class="mk" viewBox="20 4 60 92" aria-hidden="true" focusable="false">${inner}</svg>`;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

// Front matter's `2026-10-06` arrives as a Date (YAML) or a string; both become YYYY-MM-DD, in UTC so
// the build machine's time zone never shifts the day.
export function isoDate(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = String(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new Error(`not an ISO date: ${text}`);
  return text;
}

// "6 October 2026", independent of the build machine's locale.
export function longDate(value) {
  const [y, m, d] = isoDate(value).split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export default function (eleventyConfig) {
  const mark = markSvg(readFileSync('src/_includes/mark.svg', 'utf8'));
  eleventyConfig.addShortcode('mark', () => mark);

  // Notes beside assets (the font's provenance) are for maintainers, not pages.
  eleventyConfig.ignores.add('src/assets/**/*.md');
  eleventyConfig.addPassthroughCopy({ 'src/assets': 'assets' });
  eleventyConfig.addPassthroughCopy('src/favicon.ico');
  eleventyConfig.addPassthroughCopy('src/apple-touch-icon.png');

  // The apps, in the order their front matter gives.
  eleventyConfig.addCollection('apps', (api) =>
    api.getFilteredByTag('app').sort((a, b) => a.data.order - b.data.order),
  );
  eleventyConfig.addCollection('policies', (api) =>
    api.getFilteredByTag('policy').sort((a, b) => a.data.order - b.data.order),
  );

  eleventyConfig.addFilter('isoDate', isoDate);
  eleventyConfig.addFilter('longDate', longDate);

  return {
    dir: { input: 'src', output: '_site', includes: '_includes', data: '_data' },
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
  };
}

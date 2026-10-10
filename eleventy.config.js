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

// Privacy-policy versions (Meantime's ADR 0306 decision 7, in the app repository). Each version is
// its own frozen file, `src/privacy/<app>/v<n>.md`, published at `/privacy/<app>/v<n>/` as soon as
// it merges. Which version is **in force** is a separate record, `src/_data/policiesInForce.json`
// (owner, 2026-10-10): an app's code merges weeks before its release, so a new version is published
// with the code and promoted only when the release that needs it ships. The policy's own address and
// `policy.json` beside it show the version in force, and a release checks its build against that.

// One app's versions, oldest first. They must run v1, v2, … with no gap or repeat: a release record
// names a version by number, and it has to be the page it meant.
export function versionsOf(items, app) {
  const versions = items
    .filter((item) => item.data.app === app)
    .sort((a, b) => a.data.version - b.data.version);
  if (versions.length === 0) throw new Error(`no policy versions for ${app}`);
  versions.forEach((item, index) => {
    if (item.data.version !== index + 1) {
      throw new Error(`${app}'s policy versions skip or repeat v${index + 1}`);
    }
  });
  return versions;
}

// Every version of one app's policy, oldest first, with when it was in force: `from` and `until`
// (exclusive), or `from: null` for a version published and not yet in force. The record lists the
// versions an app has promoted, in order, each with the day it came into force; a version is never
// promoted twice, and the record never names a version that has no file.
export function policyHistory(items, app, record) {
  const versions = versionsOf(items, app);
  const entries = record?.[app];
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error(`no version of ${app}'s policy is in force`);
  }
  entries.forEach((entry, index) => {
    const previous = entries[index - 1];
    if (!versions.some((item) => item.data.version === entry.version)) {
      throw new Error(`${app}'s policy v${entry.version} is in force but has no file`);
    }
    if (previous && entry.version <= previous.version) {
      throw new Error(`${app}'s policy versions come into force out of order at v${entry.version}`);
    }
    if (previous && isoDate(entry.from) < isoDate(previous.from)) {
      throw new Error(
        `${app}'s policy v${entry.version} comes into force before v${previous.version}`,
      );
    }
  });
  return versions.map((item) => {
    const index = entries.findIndex((entry) => entry.version === item.data.version);
    if (index < 0) return { item, from: null, until: null };
    return {
      item,
      from: isoDate(entries[index].from),
      until: index + 1 < entries.length ? isoDate(entries[index + 1].from) : null,
    };
  });
}

// The version in force: the last one the record promoted.
export function inForce(items, app, record) {
  return policyHistory(items, app, record)
    .filter((entry) => entry.from !== null)
    .at(-1);
}

// The machine-readable policy in force: its number, the day it came into force, and the
// permissions table.
export function policyJson({ item, from }) {
  const { app, version, permissions } = item.data;
  if (!Array.isArray(permissions)) throw new Error(`${app} v${version} has no permissions table`);
  return JSON.stringify(
    {
      app,
      version,
      effective: from,
      url: item.url,
      permissions: permissions.map((row) => ({
        name: row.name,
        for: row.for,
        refused: row.refused,
      })),
    },
    null,
    2,
  );
}

export default function (eleventyConfig) {
  const mark = markSvg(readFileSync('src/_includes/mark.svg', 'utf8'));
  eleventyConfig.addShortcode('mark', () => mark);

  // Notes beside assets (the font's provenance) are for maintainers, not pages.
  eleventyConfig.ignores.add('src/assets/**/*.md');
  eleventyConfig.addPassthroughCopy({ 'src/assets': 'assets' });
  eleventyConfig.addPassthroughCopy('src/favicon.ico');
  eleventyConfig.addPassthroughCopy('src/apple-touch-icon.png');
  // AdMob reads the authorised-seller file from the domain root (1n1-studio E2-T2, #16).
  eleventyConfig.addPassthroughCopy('src/app-ads.txt');

  // The apps, in the order their front matter gives.
  eleventyConfig.addCollection('apps', (api) =>
    api.getFilteredByTag('app').sort((a, b) => a.data.order - b.data.order),
  );
  eleventyConfig.addCollection('policies', (api) =>
    api.getFilteredByTag('policy').sort((a, b) => a.data.order - b.data.order),
  );

  eleventyConfig.addCollection('policyVersions', (api) => api.getFilteredByTag('policy-version'));

  eleventyConfig.addFilter('isoDate', isoDate);
  eleventyConfig.addFilter('versionsOf', versionsOf);
  eleventyConfig.addFilter('policyHistory', policyHistory);
  eleventyConfig.addFilter('inForce', inForce);
  eleventyConfig.addFilter('policyJson', policyJson);
  eleventyConfig.addFilter('longDate', longDate);

  return {
    dir: { input: 'src', output: '_site', includes: '_includes', data: '_data' },
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
  };
}

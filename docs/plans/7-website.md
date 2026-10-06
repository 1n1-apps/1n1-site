# Plan: 7 — The 1n1 website

- **Issue:** 1n1-apps/1n1-studio#7 (`E2-F1`, parent epic 1n1-apps/1n1-studio#4)
- **Product revision:** 2 (`1n1-studio/docs/product/brief.md`)
- **Amendments in force:** `1n1-studio/docs/product/amendments/0001` (the consolidation into E1 and E2)
- **ADRs:** this ticket adds ADR 0002 (Eleventy, deploy from Actions) and ADR 0003 (two halves, dark
  first); the identity is `1n1-studio` ADR 0002.
- **Browser review:** the owner's `review-site-in-browser` session, for how the halves, the toggle
  animation and the type feel in a real browser at real widths. The automated checks prove structure,
  links and contrast, not taste.
- **Approved visuals:** <https://claude.ai/artifact/2tyFd9NVcUTFQAjAfXTD56>, committed as
  `docs/design/7-website.html`; the owner picked direction **A, "Two halves"** on 2026-10-06, dark by
  default, with an animated light/dark toggle in the corner.

## What this ticket delivers

1n1.uk: a small static site that says who makes the apps, how to reach them and what each app does
with data. Google Play gets its privacy-policy URL, `/privacy/meantime/`. Adding an app or updating a
policy is a content file and a PR.

## Acceptance-criteria inventory

| # | Criterion | Approach | Slice |
| --- | --- | --- | --- |
| 1 | A recorded decision on static tooling and the deploy mechanism | ADR 0002: Eleventy, deploy from an Actions workflow | S1 |
| 2 | Pages serves the site on the custom domain, HTTPS enforced, domain verified on the org | `deploy.yml`; the owner sets Pages, DNS and the org verification; `1n1-studio/records/github-pages.md` | S6 (owner) |
| 3 | Branch protection on `main` in both repositories, matching the factory's others | The owner applies the factory's rule set; recorded in `records/github-pages.md` | S6 (owner) |
| 4 | Pages: home, apps list, one per app, contact, a privacy policy per app at `/privacy/meantime` | `src/index.njk`, `src/apps/`, `src/contact.njk`, `src/privacy/` | S3 |
| 5 | Built from the signed board, with E1-A1's exports and voice | Direction A in `site.css` and `base.njk`; exports copied from studio `2494778` | S2, S3 |
| 6 | Phone width, light and dark, automated accessibility check with no serious issues | Responsive grid; `check:a11y` runs every page in both themes | S2, S4 |
| 7 | Favicons and share cards from the E1-A1 generator | `brand/exports/` copied unchanged (`docs/runbooks/brand-exports.md`) | S1 |
| 8 | The Meantime policy matches the app, checked against code and dependencies | § Privacy-policy check below | S3 |
| 9 | A short README on adding an app and updating a policy | `README.md` pointing at the two runbooks | S5 |
| 10 | Owner-approved copy for home, apps list, app page, contact and policy intro, under `1n1-studio/copy/` | `copy/website.md`, string by string, in the studio PR | S5 (owner) |
| 11 | `AGENTS.md` § Commands, `deploy.md` and README cover setup, preview, checks, deploy; `ci.yml` calls `build`, `lint`, `typecheck`, `check:links`, `check:a11y` | Docs and `ci.yml` | S4, S5 |
| 12 | `adding-an-app.md` completed; the owner decides which procedures become skills | Runbook written; the question goes to the owner at the PR | S5 (owner) |
| 13 | Local clone folders renamed `1n1-studio/` and `1n1-site/`, router paths updated | After the branches merge, once nothing holds the folders open | S7 |
| 14 | `github-org-and-tokens.md` names the two 1n1 repositories | factory-control PR #70 | S5 |

## Investigation

- **Existing code:** the repository held the factory overlay only: `AGENTS.md`, `docs/design/web-conventions.md`,
  the runbook stubs, `ci.yml` with `format:check` and `test`. There were no templates or styles.
- **Prior art:** none in this repository. The board's direction A prototype is the reference for
  every page.
- **Constraints found:** GitHub Pages is static-only. `web-conventions.md` asks for content apart
  from templates, and a new app must be a content entry. Fuchsia reaches only 3.6–3.8:1 against both
  grounds, so it can't colour running text. Archivo's full variable font is 700 KB, so it is trimmed.
- **Open questions:** none blocking. "Whether each app page carries a support FAQ" is answered "no
  for now": no FAQ copy exists, and the contact address covers support.

## Product design choices

### Two halves, trading colours with the theme

- **Chosen:** the owner's pick A. On desktop the left half stays in view while the content scrolls.
  The half is paper on the dark page and ink on the light one.
- **Alternatives:** B tile run, C data label, D big type, E the usual (ADR 0003).
- **Why this one:** the owner's pick; it's recognisably the domino with the content removed.
- **Reversible?** Cheap. It's one layout and one stylesheet.

### Dark by default, a toggle that remembers

- **Chosen:** dark is set in the HTML. A head script applies a saved choice before first paint. The
  toggle is a 44 px button, top right, with a sun and moon that morph over 420 ms.
- **Alternatives:** following the system theme; a sliding switch instead of an icon.
- **Why this one:** the owner asked for dark first and an animated icon in the corner.
- **Reversible?** Cheap.

### URLs by store name

- **Chosen:** `/apps/meantime/` and `/privacy/meantime/`.
- **Alternatives:** the app's internal codename in the URL.
- **Why this one:** the Issue fixes `/privacy/meantime`, and a codename would leak an internal name.
- **Reversible?** No, once the URL is given to Play. It is fixed here on purpose.

## Pages

| Page | Path | Notes |
| --- | --- | --- |
| Home | `/` | The line is the `h1`; the apps follow |
| Apps | `/apps/` | One row per app from the `apps` collection |
| Meantime | `/apps/meantime/` | Icon, line, summary, features, details, status ("Coming to Google Play") |
| Contact | `/contact/` | The address as text and a `mailto:` link; no form (a non-goal) |
| Privacy | `/privacy/` | Index of policies from the `policies` collection |
| Meantime privacy | `/privacy/meantime/` | Summary table, then the full policy |
| Not found | `/404.html` | Served by Pages for any unknown path |

- **Viewports:** under 760 px the half is a top block; on inner pages it holds only the mark and the
  navigation. From 760 px the layout is `5fr 8px 7fr`, with the half sticky.
- **Colour schemes:** dark and light swap the page and half grounds. Fuchsia is used for accents only.
- **Interactions:** links, the theme toggle (hidden without scripting), and a skip link to `main`.
- **Accessibility:** one `h1` per page, plus header, nav, main and footer landmarks. The logo link is
  named by its visible wordmark. `check:a11y` runs WCAG 2.2 A and AA in both themes.

## Content and data flow

`src/apps/<app>.md` and `src/privacy/<app>.md` are front matter plus Markdown. Layouts in
`src/_includes/` render them, and the collections sort by `order`. Site-wide values live in
`src/_data/site.json`. Eleventy writes `_site/`, which is never committed.

- **Rules and invariants:** a policy URL never changes. Every page links home and to contact. No
  colour literal appears outside the token block.
- **Edge cases:** an app with no store link shows its status text, not a dead button.
  `effective` may be parsed as a date or kept as a string; `isoDate` handles both.
- **Failure behaviour:** `check:links` names the page and the broken reference. `check:a11y` names
  the page, the theme and the rule.

## Slices

| Slice | Change | Tests and checks | Criteria |
| --- | --- | --- | --- |
| S1 | Dependencies, brand exports, trimmed font, ADR 0002 | build | 1, 7 |
| S2 | Layouts, tokens, toggle | `theme.test.mjs`, build | 5, 6 |
| S3 | Pages and content, Meantime policy | build, html-validate, the policy check | 4, 5, 8 |
| S4 | `check:links`, `check:a11y`, typecheck, coverage, `ci.yml`, `deploy.yml` | unit tests at 100 % functions; every check over `_site` | 6, 11 |
| S5 | ADR 0003, visual system, runbooks, README, AGENTS; studio copy and records; factory rule | docs | 9–12, 14 |
| S6 | Owner: Pages, DNS, org verification, branch protection | live `https://1n1.uk` | 2, 3 |
| S7 | Folder rename and router paths | `git worktree repair`; the router resolves | 13 |

## Privacy-policy check

Checked on 2026-10-06 against the Meantime app repository's `main` at `48803933`, and against its
open ads PR (#417) for the ads statements. The permissions come from the merged Android manifest of a
build of that PR, which is what an installed app actually declares, plus the generated main manifest
for the release-only view. Paths below are inside the app repository.

| Policy statement | Source |
| --- | --- |
| Plans, alarms, logs, places and settings stay on the phone; no server, no account | Local SQLite only. No backend client or account code; no analytics or crash SDK in `package.json` |
| Android's backup includes the data and can restore it | The generated main manifest sets `allowBackup="true"` (Expo's default; `app.json` leaves it unset) |
| Export data writes a file the person saves or shares | `src/adapters/files/ExpoTransferFilesAdapter.ts` (`expo-file-system`, `expo-sharing`); the label is in `src/screens/Settings/dataManagementCopy.ts:93` |
| Coordinates to four decimal places go to MET Norway | `src/adapters/weather/MetNoForecastAdapter.ts:26,86`; `src/domain/weather/place.ts:50` rounds to four decimals |
| The forecast refreshes in the background about once an hour | `src/adapters/weather/backgroundForecastRefresh.ts:12` (`REFRESH_INTERVAL_MINUTES = 60`) |
| No account, name or other personal detail goes with the request | The request carries the coordinates and the app's `User-Agent` (`MetNoForecastAdapter.ts:29,89`) only |
| Location is approximate only | `app.json:22` blocks `ACCESS_FINE_LOCATION`; `app.json:50-52` asks for when-in-use only; the merged manifest has `ACCESS_COARSE_LOCATION` only |
| Place search and naming use Android's geocoder (Google on most phones) | `src/adapters/location/ExpoLocationAdapter.ts:102,116` (`reverseGeocodeAsync` names the current place; `geocodeAsync` searches) |
| You can type a place instead | `src/screens/Settings/settingsCopy.ts:360` ("Search for a place") |
| Plus is bought through Google Play; Meantime learns only whether Plus is active | `src/adapters/billing/PlayBillingAdapter.ts` over the app's billing module; merged manifest: `com.android.vending.BILLING` |
| Ads from AdMob; where the law requires it, consent asked first and changeable under Privacy choices; Plus removes ads | Ads PR: `package.json:26` (`react-native-google-mobile-ads` 17.2.0); `src/adapters/ads/createGoogleMobileAds.tsx:54-59` (UMP `requestInfoUpdate`, `showPrivacyOptionsForm`); `src/state/ads/AdsProvider.tsx:102` (no ad until `canRequestAds`); `src/screens/Settings/settingsCopy.ts:53` ("Privacy choices"), a row shown only where UMP requires privacy options (`SettingsScreen.tsx:678`). No non-personalised flag, so outside consent regions ads may be personalised; the policy says consent applies "where the law requires it" |
| Declining location: the app works, but no weather | Owner, 2026-10-06 |
| Notifications, exact alarms and full-screen alerts; declining means no alarms reach the phone | `POST_NOTIFICATIONS` (merged, from `expo-notifications`; asked at `ExpoNotificationSchedulerAdapter.ts:78`); `SCHEDULE_EXACT_ALARM`, `USE_EXACT_ALARM`, `USE_FULL_SCREEN_INTENT` (the app's modules); owner, 2026-10-06 |
| Restarting alarms after reboot, staying awake, vibrating, playing sound ask for nothing | `RECEIVE_BOOT_COMPLETED`, `WAKE_LOCK`, `VIBRATE`, `FOREGROUND_SERVICE(_MEDIA_PLAYBACK)`, `DISABLE_KEYGUARD`, `MODIFY_AUDIO_SETTINGS`: install-time, no prompt |
| Uninstalling deletes what's on the phone; a backup or an exported file can remain | All storage is app-private; the backup and export rows above |

The merged manifest's other permissions, none of which prompts or sends anything the policy omits:

| Permission | From | Prompts? | Covered by |
| --- | --- | --- | --- |
| `INTERNET`, `ACCESS_NETWORK_STATE`, `ACCESS_WIFI_STATE` | React Native, the ads SDK | No | The forecast, place search, purchases and ads rows |
| `AD_ID`, `ACCESS_ADSERVICES_AD_ID`, `_ATTRIBUTION`, `_TOPICS` | The ads SDK | No | The ads row: the advertising ID, ad measurement, and interest topics Android infers on the phone (the policy's "such as" list) |
| `BIND_GET_INSTALL_REFERRER_SERVICE` | The ads SDK | No | The ads row |
| `c2dm.permission.RECEIVE` | `expo-notifications` (push) | No | Inert: the app has no push service configured |
| `READ_APP_BADGE` and the launcher badge permissions | `expo-notifications` | No | Badge counts on the launcher; nothing leaves the phone |
| `SYSTEM_ALERT_WINDOW` | Expo's default main manifest | No: a special access only the person can turn on in Android's settings | Unused by the app; alarms use the full-screen intent. Blocked in `app.json` by the app repository's #419 (owner, 2026-10-06) |
| `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE` | Expo's default main manifest | Only on Android 12 and older, and the app never asks | Unused (Export data uses the system file picker). Blocked with `SYSTEM_ALERT_WINDOW` in #419 |

**Ads and the release:** the policy describes Meantime as it will be at its first store release, which
includes ads (#417). No build of Meantime is on any store yet, so publishing this policy before #417
merges describes no installed app wrongly. The release check in `docs/runbooks/privacy-policies.md`
runs again before the first submission.

## Evidence plan

- **Tests:** `tests/*.test.mjs` (theme, config, check-links, check-a11y), 100 % of functions.
- **Checks:** `build`, `lint`, `typecheck`, `check:links`, and `check:a11y` (7 pages in 2 themes).
- **Browser review:** the owner's session, as above.
- **Screenshots** of every page at 390 px and 1440 px, light and dark, in
  `docs/evidence/issue-7-website/`, named `<page>-<phone|desktop>-<light|dark>.png`.
- **Not captured:** the toggle's animation (motion; seen in the browser review) and the live domain
  (it exists only after S6).

## Risks

| Risk | Blast radius | Mitigation |
| --- | --- | --- |
| The policy drifts from the app | A store rejection or a false statement | The factory rule in `deliver-app-issue` (PR #70) and the release check |
| The policy goes live before the ads PR merges | Resolved: #417 merged on 2026-10-06 | The first-release check in `privacy-policies.md` still runs before submission |
| `check:a11y` needs Chrome | CI fails on a runner without it | `ubuntu-latest` ships Chrome; `CHROME_PATH` overrides |

## Out of scope

- A support FAQ per app: there's no copy for it and contact covers support → no work needed.
- Blog, analytics, contact form: non-goals of the Issue → no work needed.

---

## Delivered

| # | Criterion | Status | Where |
| --- | --- | --- | --- |
| 1 | Recorded decision on tooling and deploy | ✅ | ADR 0002 (accepted) |
| 2 | Pages on the custom domain, HTTPS enforced, domain verified on the org | ✅ | Owner set 2026-10-06; read back through the API and DNS; `1n1-studio/records/github-pages.md`, `records/domain.md` (1n1-studio #18) |
| 3 | Branch protection in both repositories, matching the factory's | ✅ | A `main` ruleset on every repository, 2026-10-06; factory-control #71 records them |
| 4 | Home, apps list, app page, contact, a policy per app at `/privacy/meantime` | ✅ | `src/`; 7 pages built |
| 5 | Built from the signed board, with E1-A1's exports and voice | ✅ | Direction A; exports from studio `2494778` |
| 6 | Phone width, light and dark, automated accessibility check | ✅ | `check:a11y`: 7 pages × 2 themes × 2 widths, at rest, no serious findings |
| 7 | Favicons and share cards from the generator | ✅ | `docs/runbooks/brand-exports.md` |
| 8 | The Meantime policy matches the app | ✅ | § Privacy-policy check; ads PR (#417) merged since, so the ads paragraph describes `main` |
| 9 | README on adding an app and updating a policy | ✅ | `README.md` |
| 10 | Owner-approved page copy in `1n1-studio/copy/` | ✅ | `copy/website.md`: approved 2026-10-06 (1n1-studio #18); the browser-review round's strings in the studio PR that accompanies this one |
| 11 | Commands documented; `ci.yml` calls build, lint, typecheck, check:links, check:a11y | ✅ | `AGENTS.md`, `docs/runbooks/deploy.md`, `ci.yml` |
| 12 | `adding-an-app.md` completed; the owner decides on skills | ✅ | Runbook complete, with § At release; owner, 2026-10-06: the procedures stay runbooks (factory-control #70, `skills/README.md`) |
| 13 | Clones renamed `1n1-studio/`, `1n1-site/`; router updated | ✅ | Owner renamed the folders 2026-10-06; worktrees repaired; router line 13 updated |
| 14 | `github-org-and-tokens.md` names the 1n1 repositories | ✅ | factory-control #70 (merged) |

- **Plan deviations:**
  - The browser review (2026-10-06) added these, all recorded in ADR 0003 decisions 6–8 and `docs/design/visual-system.md`:
    - motion: arrivals, page transitions, hovers, the domino toy, the theme circle;
    - the app page's fixed shape: screenshots at release, selling-point features, the paid-tier panel;
    - clickable app rows and a back arrow.
  - The review also found that the first features undersold the app and misnamed Plans (a Plus feature); they were rewritten from the app's guide.
  - Two scripts joined `theme.js`: `domino.js` and `back.js`, each unit-tested at 100 % of functions.
  - `check:a11y` audits at rest with motion reduced.
- **ADR reconciled:** ADR 0002 and ADR 0003 (decisions 1–8) match what was built; both `accepted`.
- **Evidence captured:** 28 screenshots in `docs/evidence/issue-7-website/`, every page at 390 px and 1440 px in both themes, from the final build at rest.
- **Release follow-up:** E16-T4 (#308 in the Meantime app repository) carries a note sending the release to `adding-an-app.md` § At release; the store checklist gains the same step (in the template and the Meantime app repository).
- **Nothing deferred:** every criterion is met.

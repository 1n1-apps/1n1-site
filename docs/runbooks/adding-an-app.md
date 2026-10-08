# Runbook: adding an app to the site

An app arrives as two files and its icon. No template changes.

1. **The icon:** copy the app's store icon (512 px, as the app repository's generator exports it) to
   `src/assets/apps/<app>/icon-512.png`. Note the app repository's commit in the commit subject.
2. **The app page:** `src/apps/<app>.md`, front matter only, copied from `src/apps/meantime.md`:
   - `name`, `slug`, `icon`, `line`, `summary`, and `order` for its place in the list;
   - `status` (`Coming to Google Play` until the listing is live) and `store` (the listing URL, empty
     until then);
   - `features`: the app's real features, each a title and a sentence, taken from its in-app guide
     and checked against its code. Not the bare minimum any app of its kind does;
   - `plus`, for an app with a paid tier: `name`, `terms`, `trial`, `unlocks` (each a title and a
     sentence, from the app's own Plus copy) and an optional `thanks`. Leave it out for a free app
     and the section isn't drawn;
   - `screenshots`: `[]` until release (below);
   - `details`.

   Words come from the approved copy in `1n1-studio/copy/`.
3. **The privacy policy:** version 1 at `src/privacy/<app>/v1.md`, the policy's address
   `src/privacy/<app>.njk` and its `src/privacy/<app>-policy.njk` (`policy.json`), each copied from
   Meantime's and renamed, and v1's digest in `src/privacy/frozen.json`, all written by
   `privacy-policies.md` § Versions. It must be live before the app is submitted to a store.
4. **Build and check:** `bun run build`, `lint`, `check:links`, `check:a11y`. The home page and the
   apps list pick the app up from its file.
5. **Evidence:** screenshots of the new pages at a phone and a desktop width in both themes, and the
   browser review the plan names.
6. **At release** (the app's `store-listing.md` checklist sends you here), in one small PR, before
   or on the day the listing goes live:
   - `store`: the listing URL. The page then shows "Get <app> on Google Play" in place of `status`;
   - `screenshots`: the phone screenshots from the store listing, in `src/assets/apps/<app>/`, each
     `{ src, alt, width, height }` with an alt text that says what the screen shows. They appear as
     a gallery under the app's heading;
   - `features` and `plus`: checked against the released build, so a feature the release added or
     changed is on the page and nothing on the page is missing from the app;
   - the privacy policy: checked against the same build (`privacy-policies.md`).

   Any new or changed words go through `1n1-studio/copy/` for approval first. Repeat at every release
   that changes features, Plus, screenshots or the store listing.

URLs use the app's store name, lowercased: `/apps/meantime/`, `/privacy/meantime/`.

# Runbook: adding an app to the site

An app arrives as two files and its icon. No template changes.

1. **The icon:** copy the app's store icon (512 px, as the app repository's generator exports it) to
   `src/assets/apps/<app>/icon-512.png`. Note the app repository's commit in the commit subject.
2. **The app page:** `src/apps/<app>.md`, front matter only, copied from `src/apps/meantime.md`:
   `name`, `slug`, `icon`, `line`, `summary`, `status` (`Coming to Google Play` until the listing is
   live), `store` (the listing URL, empty until then), `features` and `details`, and `order` for its
   place in the list. Words come from the approved copy in `1n1-studio/copy/`.
3. **The privacy policy:** `src/privacy/<app>.md`, written by `privacy-policies.md`. It must be live
   before the app is submitted to a store.
4. **Build and check:** `bun run build`, `lint`, `check:links`, `check:a11y`. The home page and the
   apps list pick the app up from its file.
5. **Evidence:** screenshots of the new pages at a phone and a desktop width in both themes, and the
   browser review the plan names.
6. **After the store listing is live:** set `store` and change `status`, in its own small PR.

URLs use the app's store name, lowercased: `/apps/meantime/`, `/privacy/meantime/`.

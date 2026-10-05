# Runbook: adding an app to the site

The steps an app's arrival needs, in order. The exact mechanics of the first four depend on the
tooling E2-A1 chooses; E4-T1 (`1n1-studio` #12) completes this runbook once the site exists and
decides whether it becomes a skill.

1. **The app's content entry:** store name, one-line description, the longer description from the
   approved copy in `1n1-studio/copy/`, the store link (or `coming soon` until the listing is live),
   and the app's icon as the app repository exports it.
2. **The app page** at `/apps/<codename>`, rendered from the entry by the app template.
3. **The apps index** gains the app.
4. **The privacy policy** at `/privacy/<codename>`, written by `privacy-policies.md`'s procedure.
   It must be live before the app is submitted to a store.
5. **Evidence:** screenshots of the new pages at both viewports in both schemes, and the browser
   review the plan names.
6. **After the store listing is live:** replace `coming soon` with the store link, in its own small PR.

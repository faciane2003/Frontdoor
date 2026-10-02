# Development and browser checks

From the project root:

```powershell
npm ci
npx playwright install chromium
npm run build
npm start
```

The development site runs at `http://127.0.0.1:8000/`. Set `PORT` to use another port. If a server is already serving the project on port 8000, use that server.

`npm test` rebuilds published assets and starts its own temporary server on an available port. It checks syntax, dashboard/navigation, Features, saved-data migration, optional loading, Mail, Tools/Links, conference maps, and On-Call. Browser edits stay inside isolated test profiles. No manual server or system Chrome path is required.

Individual checks use `http://127.0.0.1:8000/` by default; set `FRONTDOOR_BASE_URL` to use another server:

- `npm run test:portal`: dashboard, navigation, Features, storage compatibility, failures, and lazy loading.
- `npm run test:mail`: Mail previews, edits, imports, and generated Outlook contents.
- `npm run test:tools`: Intune comparisons and Links rendering.
- `npm run test:cons`: monthly map pins, summaries, and vacancy messages.
- `npm run test:oncall`: current-day visibility and weekday headers while scrolling.
- `npm run test:syntax`: published JavaScript and HTML script syntax.

Both Puppeteer and Playwright use Playwright's downloaded Chromium through `browser.cjs`. The spreadsheet loader test uses a small test reader to verify retries and request reuse without depending on the external CDN; it does not validate real workbook parsing.

# Building published assets

Edit `js/src/` and `css/src/`, then run `npm run build`. The build writes `js/main.js`, `css/styles.css`, and the Outlook bundle. Include these generated files and the Outlook license notice when publishing to GitHub Pages. The published site remains static and requires no npm installation or backend.

The SOC documents have their own maintained files under `SOC/css/` and `SOC/js/`. Their HTML contains the reference material rather than large inline scripts and styles.

`node scripts/build-mail-templates.mjs` separately regenerates sample `.oft` files from `data/mail.json`. Normal builds leave those samples alone. Mail imports extract recipients, subject, and readable body text; attachments and rich formatting are not imported. Native Outlook opening still needs verification in the target Outlook version.

# Frontdoor

A static operations portal built with HTML, CSS, and JavaScript. Shared catalogs live in `data/`; browser edits remain in that browser's local storage.

```powershell
npm ci
npx playwright install chromium
npm run build
npm start
```

Open `http://127.0.0.1:8000/`. Run `npm test` for the complete automated checks; the test runner supplies its own temporary server.

| Location | Purpose |
|---|---|
| `index.html` | Navigation, view containers, and shared dialogs |
| `js/src/core/` | State, routing, data loading, persistence, and shared events |
| `js/src/shared/` | Reusable table controls and add-row forms |
| `js/src/views/` | Individual dashboard and section renderers |
| `css/src/` | Ordered source styles for layout, components, tables, schedule, map, and responsive rules |
| `SOC/` | Reference content with separate scripts and styles |
| `scripts/` | Builds, local server, data imports, and isolated browser checks |

`js/main.js`, `css/styles.css`, and `js/oft-browser.js` are generated. Edit their source files and rebuild rather than editing bundles directly. Comments in the source explain the behavior and compatibility choices.

Existing storage keys remain compatible. Permanent row identities are independent of editable IDs, titles, or URLs; new edits record deliberately cleared fields so they remain blank after refresh. Typing batches table saves, while blur and page exit flush pending changes.

Outlook tools, spreadsheet tools, and the SOC reference load when needed. Publishing still uses generated static files and relative paths, including under a GitHub Pages project URL.

See [development and test instructions](scripts/README.md) for individual commands and tool limitations.

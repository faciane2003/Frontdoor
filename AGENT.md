# GitHub Pages Project Notes

## Project

This project is for building a GitHub Pages website using plain HTML, CSS, and JavaScript.

Project folder:

`C:\Users\Ames\Desktop\Projects\GithubPages`

GitHub repository:

`https://github.com/faciane2003/GithubPages`

Repository visibility is private. Treat the repository as private source control, but remember that GitHub Pages publishing may still expose the published site publicly depending on GitHub plan/settings.

## Goal

Create a static website that can be published with GitHub Pages.

## Stack

- HTML for page structure
- CSS for layout and visual design
- JavaScript for client-side behavior
- No backend server
- No database
- No private secrets in frontend files

## GitHub Pages Notes

- The default entry page should be `index.html`.
- For a simple static site, publish from the repository's `main` branch and `/` root folder.
- Static assets should use relative paths so the site works under a project URL like:

`https://USERNAME.github.io/REPOSITORY/`

- Avoid absolute root paths like `/assets/style.css` unless the site will be published at a user or organization root domain.
- Add a `.nojekyll` file if GitHub's Jekyll processing interferes with static files or folders.

## Planned File Structure

```text
GithubPages/
  AGENT.md
  index.html
  css/
    styles.css
  js/
    main.js
  data/
    knowledge.json
    training.json
    sops.json
    certs.json
    on-call.json
    links.json
  assets/
```

## Current Site Concept

The site is a static SOC-style operations portal with app navigation for:

- Dashboard
- Knowledge Base
- Training
- SOPs
- Certs
- On-Call Schedule
- Links
- Terminal

The dashboard and tabs are powered by local JSON files under `data/`.

The Terminal tab is a simulated browser console only. GitHub Pages cannot run real shell commands or backend actions.

## Current Checkpoint

Current stopping point:

- The original starter landing page has been replaced with a static SOC-style operations portal.
- The site now uses a left/sidebar app navigation layout on desktop and a collapsible nav on smaller screens.
- The top bar includes a global search field.
- The following tabs/views exist in `index.html` and are controlled by `js/main.js`:
  - Dashboard
  - Knowledge Base
  - Training
  - SOPs
  - Certs
  - On-Call Schedule
  - Links
  - Terminal
- `css/styles.css` now contains the dark dashboard/admin UI styling.
- `js/main.js` loads local JSON data with `fetch()`, renders dashboard metrics/cards/tables, handles tab routing via hash links, filters data with the global search box, and supports the simulated terminal.
- The `data/` folder has starter/sample content:
  - `knowledge.json`
  - `training.json`
  - `sops.json`
  - `certs.json`
  - `on-call.json`
  - `links.json`
- The terminal supports these simulated commands:
  - `help`
  - `status`
  - `sections`
  - `search <term>`
  - `clear`

Verification completed before this checkpoint:

- JSON syntax was checked with `python -m json.tool`.
- JavaScript syntax was checked with `node --check js\main.js`.
- A local static server was started with `python -m http.server 8000`.
- HTTP checks returned `200` for:
  - `/`
  - `/css/styles.css`
  - `/js/main.js`
  - `/data/knowledge.json`

Important local testing note:

- Because the site uses `fetch()` to load files from `data/`, test with a local HTTP server instead of opening `index.html` directly from disk.
- Use:

```powershell
python -m http.server 8000
```

- Then open:

`http://localhost:8000/`

## Next Pickup Plan

When work resumes, start here:

1. Run the local server and visually inspect the portal in a browser.
2. Check the desktop layout and mobile/collapsed navigation.
3. Test every nav tab.
4. Test global search against terms like `triage`, `incident`, `training`, and `MITRE`.
5. Test Terminal commands: `help`, `status`, `sections`, `search triage`, and `clear`.
6. Replace starter/sample JSON entries with real sanitized content.
7. Decide whether the Knowledge Base should stay as JSON cards or move to Markdown-like article files later.
8. Decide whether the dashboard should add richer widgets such as:
   - training completion counts by tier
   - SOP review status
   - expiring cert count
   - current/next on-call shift
9. Decide whether the Terminal tab should remain simulated or become a command-reference/search interface.
10. Only publish with GitHub Pages after confirming the content is safe for public exposure or confirming private Pages support.

## Collaboration Rule

The user requested local-only work by default:

- Do not commit or push unless the user explicitly asks.
- Exception: on 2026-09-16, the user explicitly requested updating this `AGENT.md`, committing, and pushing the current checkpoint to GitHub.

## Working Rules

- Keep the site static and GitHub Pages compatible.
- Do not include passwords, API keys, private documents, or sensitive data.
- Prefer simple, readable HTML/CSS/JS over build tooling unless the project needs it.
- Test locally in a browser before publishing.
- Keep filenames lowercase and URL-friendly where practical.

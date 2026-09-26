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
    dashboard.json
    on-call.json
    links.json
  scripts/
    extract_workbook_data.py
  assets/
```

## Current Site Concept

The site is a static SOC-style operations portal with app navigation for:

- SOPs
- Links
- Certs
- JQS
- On-Call

The dashboard and tabs are powered by local JSON files under `data/`.

Global layout state:

- the top header/search bar is sticky at the top of the viewport while scrolling
- left mini nav panels stick below the header/search bar so they are not covered while scrolling
- JQS, SOPs, Certs, and Links table headers stick to the top of their table while scrolling
- JQS, SOPs, Certs, and Links rows can be added, edited, and deleted in-browser; row edits autosave to browser `localStorage`
- editable table cells are styled to look like regular compact table text rather than boxed form fields
- saved editable-table rows merge with source JSON on load so blank saved fields do not erase original source values such as SOP titles

## Workbook Import

The web project can import static data from:

`C:\Users\Ames\Desktop\Projects\GithubPages\assets\JQS_SOC_CSIRT2.xlsx`

This workbook is the updated version of the Tier 3 workbook:

`C:\Users\Ames\Desktop\Projects\Tier 3\JQS_SOC_CSIRT2.xlsx`

The related workbook project and generator live at:

`C:\Users\Ames\Desktop\Projects\Tier 3`

Import script:

`scripts\extract_workbook_data.py`

Run from the web project root:

```powershell
python scripts\extract_workbook_data.py
```

Current import mapping:

- `Tier I`, `Tier II`, `Tier III`, and `Advanced` task tables -> `data/training.json`
- `SOPs` table -> `data/sops.json`
- `Links` sheet and `Forensics` sheet -> `data/links.json`
- workbook task/category summaries -> `data/knowledge.json`
- no workbook schedule source exists yet -> `data/on-call.json` is generated with mock on-call assignments

`data/certs.json` is not imported from the JQS workbook. It is maintained separately as a cybersecurity certification catalog with provider, level, focus, estimated cost, notes, and official links.

The importer intentionally treats internal-looking URLs as blank. Public forensics URLs are preserved.

Latest workbook import baseline:

- 171 JQS training tasks
- 1 SOP entry from the workbook, later replaced locally with 20 example SOP entries
- 61 link/resource entries with public URLs after filtering out rows without links
- 13 knowledge summaries
- 365 mock on-call schedule records

Current `Certs` tab state:

- populated with popular cybersecurity certifications instead of JQS workbook qualification rows
- includes Security+, CySA+, PenTest+, SecurityX, ISC2 CC, CISSP, CCSP, CISA, CISM, GSEC, GCIH, GCIA, GCFA, CEH, OSCP, Microsoft Security Operations Analyst Associate, and AWS Certified Security - Specialty
- the Certs table does not show price; pricing should be verified on linked official pages before purchase
- certification names link directly to official pages; there is no separate Link column and the name is not duplicated below the link
- renders with a SOP-style left mini nav for certification categories
- clicking an active cert category clears the filter
- Red Team is its own certification category; PenTest+, CEH, and OSCP are grouped there
- Cert rows can be added, edited, and deleted; edits autosave, and new rows inherit the active cert category or use `Foundations`

Current `Dashboard` tab state:

- the visible top header uses `SOC HUD`
- the Dashboard body is populated from `data/dashboard.json`
- dashboard panels are compact and editable in-browser
- each dashboard panel header has a blue plus button that adds an empty editable entry
- each dashboard entry autosaves field changes and has a red trash button; dashboard edits are saved to browser `localStorage`
- dashboard sections are:
  - Tasks
  - Project Status
  - Personnel
  - Alerts
  - Webpage Updates
- old summary widgets for Knowledge Articles, Training Items, SOPs, Links, Priority Training, Quick Knowledge, and On-Call Today were removed

Current `Knowledge Base` tab state:

- renders as a compact hierarchical list without a left mini nav
- each row combines hierarchy and title on one line, such as `01 Overview / Workbook Import - Imported JQS Workbook`
- each row places the generated summary text on the right side; old tag pills such as `workbook`, `jqs`, and `overview` are not rendered
- current hierarchy groups are:
  - `01 Overview / Workbook Import`
  - `02 Qualification Scope / Tier Path`
  - `03 Skill Areas / Tools and Workflows`
- `competency` is not used as a visible tag/category; skill rows use the actual area name

Current `JQS` tab state:

- renders with a left-side area nav and dense table, matching the SOP navigation/table pattern
- clicking an area filters the JQS table and highlights the active area; clicking the active area again clears the filter
- table omits Area and Status columns and shortens tier labels to `I`, `II`, `III`, or `Advanced`
- table column order is ID, Tier, Task, Performance Standard
- JQS rows can be added, edited, and deleted; edits autosave, and new rows inherit the active area filter or use `Uncategorized`

Current `SOPs` tab state:

- renders as a categorized table-of-contents style table
- includes a left-side category nav that filters the SOP table, highlights the active category, and clears the filter when the active category is clicked again
- the table itself stays as regular SOP rows; the left category nav is the only category/filter control
- SOP titles are clickable links that open the matching SOP body below the table
- expanded SOP bodies show a single-line `ID - Category - Title` header, Updated metadata, and an editable Notes field only; no status/example pill is rendered
- SOP notes auto-fill with up to five editable numbered to-do style steps from the SOP data, without section heading prefixes, unless the user has saved custom notes
- SOP notes autosave in browser `localStorage`; this is local to the user's browser and not synced to GitHub Pages
- SOP table rows can be added, edited, and deleted; edits autosave, and new rows inherit the active SOP category or use `General`
- `data/sops.json` currently has 20 example SOP entries with `id`, `title`, `category`, `purpose`, `status`, and `sections`
- current example categories include Triage, Email Security, Endpoint Response, Identity and Access, Network Security, Vulnerability Management, Threat Intelligence, Response Management, Operations, Detection Engineering, Cloud Security, Data Protection, and Case Management
- the workbook importer maps imported SOP rows into this newer structure

Current `Links` tab state:

- renders as a compact table: Resource, Description, and URL
- includes a SOP-style left mini nav for practical resource categories
- clicking an active link category clears the filter
- rows without a public URL are excluded
- category labels such as Forensics and Documentation are not shown in the Links UI
- current link categories include Apple Artifacts, Artifact Extraction, Browser Artifacts, File Analysis, File Recovery, Forensic Imaging, Forensic Suites, Hashing, Lab Platforms, Learning Resources, Linux References, Malware Analysis, Memory Forensics, Network Analysis, Reverse Engineering, Threat Intelligence, Utilities, Windows Artifacts, and Windows Tools
- descriptions were researched from linked page titles/meta descriptions where available, with concise fallback descriptions for dead or blocked links
- Links rows can be added, edited, and deleted; edits autosave, and leaving a link row with a blank URL removes it from the table

Current `On-Call` tab state:

- navigation label and page title use `On-Call`
- On-Call is the last item in the main sidebar nav
- renders a mock calendar using `data/on-call.json`
- mock assignments include date, primary, backup, and OOO names
- mock calendar currently covers one year from September 17, 2026 through September 16, 2027
- On-Call header includes a month selector and displays one month at a time
- clicking a calendar day turns that calendar cell into an inline editor for primary, backup, OOO, and notes; edits autosave in browser `localStorage`

## Current Checkpoint

Current stopping point:

- The original starter landing page has been replaced with a static SOC-style operations portal.
- The site now uses a left/sidebar app navigation layout on desktop and a collapsible nav on smaller screens.
- The top bar includes a global search field.
- The following tabs/views exist in `index.html` and are controlled by `js/main.js`:
  - Dashboard
  - Knowledge Base
  - JQS
  - SOPs
  - Certs
  - Links
  - On-Call
- The main sidebar nav intentionally omits Dashboard and Knowledge Base.
- `css/styles.css` now contains the dark dashboard/admin UI styling.
- `js/main.js` loads local JSON data with `fetch()`, renders HUD panels/cards/tables, handles tab routing via hash links, and filters data with the global search box.
- The `data/` folder has starter/sample content:
  - `knowledge.json`
  - `training.json`
  - `sops.json`
  - `certs.json`
  - `dashboard.json`
  - `on-call.json`
  - `links.json`
Verification completed before this checkpoint:

- JSON syntax was checked with `python -m json.tool`.
- JavaScript syntax was checked with `node --check js\main.js`.
- A local static server was started with `python -m http.server 8000`.
- HTTP checks returned `200` for:
  - `/`
  - `/css/styles.css`
  - `/js/main.js`
  - `/data/knowledge.json`
  - `/#knowledge`
  - `/#training`
  - `/#sops`
  - `/#certs`
  - `/#schedule`
  - `/#links`

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
5. Replace starter/sample JSON entries with real sanitized content.
6. Review the imported workbook data in the web UI and decide whether the workbook field names should be renamed for the site audience.
7. Decide whether the Knowledge Base should stay as a generated hierarchical list or move to Markdown-like article files later.
8. Decide whether the dashboard should add richer widgets such as:
   - training completion counts by tier
   - SOP review status
   - expiring cert count
   - current/next on-call assignment
9. Replace the mock on-call calendar data with a real schedule source if needed.
10. Only publish with GitHub Pages after confirming the content is safe for public exposure or confirming private Pages support.

## Collaboration Rule

The user requested local-only work by default:

- Do not commit or push unless the user explicitly asks.
- Exception: on 2026-09-16, the user explicitly requested updating this `AGENT.md`, committing, and pushing the current checkpoint to GitHub.

## Hosting Note

### 2026-09-19

- GitHub Pages for `faciane2003/GithubPages` was temporarily pointed at a `gh-pages` branch containing the Kevin repo map demo.
- User then requested the live site return to the main `GithubPages` project.
- GitHub Pages source was switched back to `main` at `/` using GitHub CLI.
- A Pages rebuild was requested after the switch.
- The Kevin map work remains on pushed branches `kevinExample` and `gh-pages`, but live hosting should now use `main`.

## Working Rules

- Keep the site static and GitHub Pages compatible.
- Do not include passwords, API keys, private documents, or sensitive data.
- Prefer simple, readable HTML/CSS/JS over build tooling unless the project needs it.
- Test locally in a browser before publishing.
- Keep filenames lowercase and URL-friendly where practical.

## 2026-09-26 Navigation and Shared Editing UI Update

- Added Dashboard and GitHub to the primary navigation.
- GitHub includes Overview, Repo, Projects, Teams, People, and Security sections.
- Replaced pinned subsection navigation with dropdown filters above the JQS, SOPs, Certs, Links, and GitHub content.
- Table headers remain visible inside vertically scrolling tables.
- `+ Add Row` opens a form with Save and Cancel actions; saved rows are placed at the top and persist in browser `localStorage`.
- On-Call uses a scrollable month calendar with editable day details and locally persistent notes.
- Opening a primary navigation view resets the page and that view's internal table or calendar to the top.
- Shared cross-user persistence is not implemented; browser edits remain local to each user's browser.

## 2026-09-26 SOC Migration

- Added SOC as a primary navigation tab backed by `SOC/index.html` in an embedded workspace.
- Migrated the current SOC cybersecurity page, its previous interview prep page, and all local page assets from the sibling Kevin project.
- Converted SOC asset and document links to relative paths so they work under the GitHub Pages project subpath.

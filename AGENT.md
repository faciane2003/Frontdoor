# Frontdoor Project Notes

## Project

This project is for building a GitHub Pages website using plain HTML, CSS, and JavaScript.

Project folder:

`C:\Users\Ames\Desktop\Projects\Frontdoor`

GitHub repository:

`https://github.com/faciane2003/Frontdoor`

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
Frontdoor/
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

`C:\Users\Ames\Desktop\Projects\Frontdoor\assets\JQS_SOC_CSIRT2.xlsx`

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

`data/certs.json` is not imported from the JQS workbook. It is maintained separately as a cybersecurity certification catalog with provider, level, Beginner/Average/Expert rating, focus, estimated cost, notes, and official links.

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

- GitHub Pages for `faciane2003/Frontdoor` was temporarily pointed at a `gh-pages` branch containing the Kevin repo map demo.
- User then requested the live site return to the main `Frontdoor` project.
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

## 2026-09-26 SOC Portal Theme Integration

- Restyled the complete SOC workspace to use the portal color system, compact spacing, panels, cards, tables, controls, and typography.
- Replaced the SOC page's separate nested sidebar with a Category dropdown while preserving every SOC topic and content section.
- Connected the portal Search field to the embedded SOC search so matches open the appropriate SOC topic and section.
- Kept SOC tables sticky, cards responsive, and the category control usable without horizontal overflow on mobile.
- Converted the SOC Table of Contents from multicolor cards into compact blue gray chapter and topic rows with aligned descriptions.
- Added a collapsible hierarchy to the SOC Table of Contents: category rows reveal topic rows, topic rows reveal section rows, and clicking an open row collapses it.
- Reduced the shared top header and Search field to a single compact row across every primary navigation view.
- Replaced the editable Dashboard panels with a GitHub Overview style landing page containing navigation cards for SOPs, Links, Certs, JQS, On Call, GitHub, and SOC.
- Updated the Links Add Row form to use Title instead of Resource, provide an existing category dropdown, place URL before Description, and render URL and Description at equal full width.
- Removed the repeated view title from the shared header, aligned the compact Search field to the top left, removed the Dashboard instruction sentence, and changed the active primary navigation label to gold.
- Made the SOC Table of Contents the single compact SOC workspace: removed the extra SOC category toolbar, removed hierarchy arrows, and changed section rows to expand their full content inline instead of switching panels.
- Flattened colored pill and circle styling inside inline SOC content so expanded material remains visually consistent with the surrounding table rows.
- Explicitly removed all remaining arrow and caret indicators from SOC Table of Contents category, topic, and section rows.
- Replaced plus style add controls with a consistent solid blue `Add Item` button on JQS, SOPs, Certs, and Links; each button opens the section specific form.
- Compacted expanded SOC Table of Contents content into normal-height table rows, including the OSI layer hierarchy, without changing the standalone SOC layouts.
- Converted expanded SOC rail-card groups, such as Windows Registry Navigation, into compact label-and-description table rows.
- Standardized all common expanded SOC Table of Contents grids, cards, steps, comparisons, and lists as dense table-style rows.
- Flattened nested SOC accordion headers into the same compact title-and-description row height and removed their plus/close indicators.
- Normalized SOC code-example cards into single-line language, title, and code-preview rows and removed partial inherited title backgrounds from compact content.
- Removed visual arrow connectors, carets, and arrow-based process notation throughout the portal and embedded SOC content at every viewport size.
- Widened word-based label columns in compact SOC rows to prevent labels such as Registry and Services from overlapping adjacent titles.
- Rendered Links-table URLs as validated HTTP or HTTPS anchors that reliably open in a new browser tab; new URLs continue to be entered through the Add Item form and persist locally.
- Rebalanced JQS columns to narrow ID, Tier, and Task while expanding Performance Standard to the majority of the table width.
- Grouped JQS records into ordered, independently expandable Tier I, Tier II, Tier III, Advanced, and fallback tier hierarchy rows; search expands matching groups automatically.
- Normalized abbreviated JQS tier values (`I`, `II`, and `III`) into their corresponding Tier I, Tier II, and Tier III hierarchy parents.
- Prevented JQS child-row ID and Tier values from wrapping, replacing space-consuming indentation with a slim inset hierarchy marker.
- Replaced clipped inline On-Call day expansion with a centered, viewport-bounded modal containing the full date, editable IRM/BIRM/Out of Office fields, notes, and a visible Close button.
- Removed the redundant explanatory subtitle beneath every GitHub section heading while retaining Overview card descriptions and repository table descriptions.
- Reduced the shared Search control to a 300px maximum width and 28px minimum height with tighter topbar spacing across all views.
- Removed the repeated selected-section heading from every GitHub body because the Section dropdown already communicates the active context.
- Reset the GitHub Section dropdown and body to Overview whenever the primary GitHub navigation tab is opened.
- Guarded the GitHub Section state against invalid or browser-restored values so anything outside the six supported sections is normalized to Overview.
- Grouped the SOP table into alphabetized, independently expandable Category hierarchy rows with task counts; search and a selected category expand matching groups automatically.
- SOP category groups are expanded by default on initial load and can still be collapsed individually.
- SOP child rows indent their ID cells beneath category headers to make the table hierarchy clearer.
- Shortened the Security+ certification note and limited Certs Notes cells to two lines when not being edited so long notes do not create oversized rows.
- Kept the JQS tier hierarchy collapsed by default with independent click-to-expand behavior.
- Replaced the GitHub Section dropdown with a compact mini-navigation for Overview, Repo, Projects, Teams, People, and Security, including an active-state highlight.
- Changed the GitHub mini-navigation to a vertical left-side menu with subsection content displayed in the adjacent right column.
- Grouped Links into independently expandable Category hierarchy rows with counts and SOP-style inset indentation; search and category filtering expand matching groups automatically.
- Consolidated 19 narrow Links categories into six broader operational groups while normalizing legacy and locally saved category values at render time.
- Grouped Certs into independently expandable Category hierarchy rows with certification counts and Links-style indented children; search and category filtering expand matches automatically.
- Converted the SOC interactive packet trace board from large cards and circular controls into compact table-style controls, evidence rows, and a single-line readout.
- Added Whitepages as a primary navigation view with a dedicated body and a matching Dashboard overview card.
- Positioned Whitepages as the final item at the bottom of the primary navigation.
- Added a searchable two-column Whitepages table with Ticket and Domain fields and two example rows.
- Made Whitepages a locally persistent editable table with click-to-edit cells, red row deletion, and a blue Add Row form using Save and Cancel actions.
- Added Whitepages spreadsheet import for CSV, Excel, and Google Sheets exports; imports de-duplicate Ticket/Domain pairs, prepend new rows, and use a compact fixed-width table layout.
- Extended Whitepages import to TXT files containing Ticket, optional Reason, and Domain values separated by tabs, commas, pipes, or whitespace, with an optional header row.
- Added an editable Reason column between Ticket and Domain across the Whitepages table, Add Row form, sample data, and spreadsheet/text imports.
- Improved expanded On-Call note readability with normal font weight, larger text, increased line spacing and padding, and stronger foreground/background contrast.
- Tightened Whitepages import de-duplication so a row is skipped when either its normalized Ticket or normalized Domain already exists, including duplicates within the uploaded file.
- Made the On-Call navigation default to the user's current local date by selecting the current month, generating the month if needed, and opening today's day details.
- Added a persistent gold calendar highlight and `aria-current="date"` marker for the user's current local day, distinct from the selected-day state.
- Centered the preset/current On-Call day within the scrollable calendar viewport on initial navigation so it remains immediately visible after the day-details dialog closes.
- Changed the optional spreadsheet parser to load asynchronously so a slow or unavailable CDN cannot block initialization of navigation, On-Call, or the rest of the application.
- Fixed On-Call navigation after Puppeteer reproduction: selecting the nav now rerenders the current-day state, and the generic navigation reset no longer forces the calendar viewport back to scroll position zero.
- Changed the On-Call default to show the calendar centered on highlighted today without automatically opening the day-details dialog; the dialog remains click-initiated.
- Made each On-Call weekday row sticky at the top of the scrolling calendar window and added Puppeteer coverage for the sticky position.
- Changed the On-Call calendar to a Monday-first week with Saturday and Sunday in the final columns, including corrected date-grid offsets and Puppeteer coverage for header order.
- Removed the numeric “SOP/SOPs” item counts from SOP category hierarchy rows while preserving their expand/collapse controls.
- Increased the SOC Table of Contents top and left inset, with additional separation below its label, while retaining compact row heights.
- Removed bold styling from expanded SOC comparison descriptions while retaining emphasis on their short protocol or comparison labels.
- Consolidated 13 narrow SOP categories into five broader operational groups at render time while retaining compatibility with original and locally saved category values.
- Moved the SOP Updated metadata card from its own full-width row into the right side of the expanded SOP header, with a stacked responsive fallback.
- Changed SOP category groups to initialize collapsed by default while retaining manual expansion and automatic expansion during search or category filtering.
- Added a Tools navigation view with an Intune Checker containing standing and new comparison lists, multi-format file imports, normalized de-duplication, match/missing results, search filtering, and local persistence.
- Reordered Links columns to Resource, URL, Description, and Actions, and removed numeric link counts from category hierarchy rows.
- Restyled static SOC flowchart rows, including Kali Types, as non-interactive text with title case and normal font weight instead of link-like bold uppercase labels.
- Restyled Links category hierarchy labels in normal title case and regular font weight while preserving their expand/collapse behavior.
- Standardized SOP, Certs, and JQS hierarchy labels to match Links with normal casing and regular font weight, while retaining distinct table column headers.
- Constrained the Whitepages table wrapper to the compact table width so its border and background no longer extend across unused horizontal space.
- Removed Whitepages horizontal scrolling by allowing its table to shrink to the compact wrapper and converting column widths to proportional sizing.

## Current implementation snapshot

- Primary navigation currently includes Dashboard, SOPs, Links, Certs, JQS, On-Call, GitHub, Tools, Whitepages, CONs, and SOC Reference; SOC Reference is the final navigation item.
- Editable portal tables use local browser storage for persistence, shared Save/Cancel add-row forms, and red row-delete actions where enabled. Static GitHub Pages hosting does not synchronize these browser-local edits between users.
- SOPs use five consolidated, collapsed-by-default hierarchy categories; Links use six consolidated categories; Certs and JQS retain their category/tier hierarchies. Their hierarchy labels use regular-weight title case.
- Links columns are ordered Resource, URL, Description, and Actions. URL values open externally, and category count labels have been removed.
- On-Call opens the calendar without a popup, centers and highlights the current local day, uses a sticky Monday-through-Sunday weekday row, supports adjacent-month scrolling, and opens editable day details only after a click.
- Whitepages provides editable Ticket, Reason, and Domain columns, compact no-horizontal-scroll layout, add/delete controls, and TXT/CSV/XLS/XLSX/ODS/Google Sheets export imports. Imports prepend new rows and reject any entry whose normalized Ticket or Domain already exists.
- Tools contains the Intune Checker with Standing Comparison List and New List panels. Both accept the same supported file formats, normalize and de-duplicate entries, persist locally, and label New List values as matching or missing from the standing list.
- SOC uses the portal color theme and compact expandable table hierarchy. Static detail rows use readable regular-weight title case, while functional hierarchy rows remain interactive.
- Puppeteer regression coverage verifies current-day On-Call positioning, popup behavior, sticky Monday-first headers, Intune TXT parsing and comparison, Links column order, and removal of Links category counts.
- Changed SOC Table of Contents labels, chapter headings, and section metadata from forced uppercase to their natural title casing.
- Renamed the primary navigation item and Dashboard card from SOC to SOC Reference, updated accessible labels, and positioned it as the final navigation entry after Whitepages.
- Expanded the Certs dataset through official vendor research from 17 to 55 credentials, adding broader IT foundations, networking, Linux, cloud, identity, SOC, SIEM, governance, privacy, offensive security, forensics, malware analysis, and security architecture coverage without adding new top-level categories.
- Added an editable Beginner, Average, or Expert rating to every certification and to the add-item form, removed certification-count labels from hierarchy rows, and versioned the expanded catalog so existing browser data receives the new official entries once without defeating later user deletions.
- Converted SOC Reference's Safe Malware Practice Sources content from oversized cards and pills into compact, regular-weight table rows consistent with the rest of the reference hierarchy.
- Added a CONs navigation view with a searchable, date-sorted vertical timeline of upcoming U.S. cybersecurity conferences, official external event links, locations, and concise focus descriptions; expired events are hidden automatically.
- Added a responsive contiguous-U.S. map above the CONs timeline using simplified 2025 U.S. Census Bureau state boundaries, exact latitude/longitude projection for each city, keyboard-focusable pins, and combined labels for cities hosting multiple upcoming events.
- Added immediate themed CONs map tooltips on pin hover and keyboard focus, showing the city plus every upcoming conference and date represented by that pin.
- Removed the pins' native SVG title tooltips so only the themed CONs context popup appears.
- Removed the root SVG title that browsers exposed as a second map tooltip, retaining the map description through an ARIA label instead.
- Changed CONs map pins from the question-mark help cursor to the standard pointer cursor.
- Made CONs map pins open a themed details dialog containing every upcoming event in that city, including dates, focus descriptions, and official external links.
- Anchored the CONs event-details popup beside the selected map pin with viewport edge detection, replacing the centered modal presentation.
- Added a single monthly scrubber below the CONs map; each position represents one calendar month and immediately filters map pins, hover context, and clicked event details to conferences overlapping that month.
- Removed the explanatory Census and pin-interaction sentence beneath the CONs map.
- Refactored portal rendering for performance: views now render lazily, global search redraws only the active view, static U.S. SVG paths are cached, conference date formatters are reused, scrubber movement updates existing pins instead of rebuilding the map, duplicate Certs CSS was removed, and the invalid external-link fallback was corrected.
- Added plain-English maintenance comments throughout the portal shell, persistence, forms, calendar, GitHub, imports, conference map, event delegation, and SOC Reference hierarchy/search logic.
- Removed numeric item-count labels from the SOC Reference table of contents while preserving its expandable hierarchy.
- Added Whitepages exports for TXT, CSV, XLS, XLSX, and ODS with reusable import-compatible headers and a compact format selector beside the Export button.
- Made an open CONs pin retract its anchored details popup when the same pin is clicked again.
- Made SOP ID values clickable external example links that open Google in a new tab.
- Constrained the global search header panel to 320px so its border and background no longer stretch across unused body space.
- Made Intune Checker an explicit Tools subcategory and added persistent Add Item and per-row delete controls to both its Standing Comparison and New lists while retaining file uploads and comparison status.
- Fixed the CONs monthly scrubber to toggle the actual `hidden` attribute on SVG pins, allowing visible cities to update correctly for every month; `scripts/verify-cons-map.mjs` provides a browser-level regression check.
- Moved Whitepages from the primary sidebar into the Tools sub-navigation while preserving its editable table, add/delete controls, imports, exports, and local persistence.
- Empty months on the CONs map scrubber display a compact `Vacant` badge, which is covered by the browser-level monthly pin regression check.

## 2026-09-29 Frontdoor Rename

- Renamed the project identity from GithubPages to Frontdoor in browser metadata, repository documentation, local paths, and GitHub references.
- Preserved generic GitHub Pages platform terminology and the existing relative asset routing.
- Repaired stale On-Call and Tools Puppeteer selectors and made the CONs monthly map test launch its own browser.
- Verified all JSON data, JavaScript syntax, inline scripts, On-Call behavior, Intune comparison behavior, Links layout, CONs monthly pin filtering, and SOC asset requests.
- Preserved the untracked `ExampleGithub Download - Kevin` folder and `kevin-file-map.txt` without modification.
- No commit or push was performed. The Pages deployment remains pending an explicit commit and push request.

## 2026-09-29 Left Navigation Layout

- Kept the primary navigation on the left at every viewport size.
- Replaced the tablet and mobile top bar with a compact 56px left rail and a left-anchored flyout menu.
- Verified sidebar and workspace positions at 1400px, 900px, and 390px widths.
- Re-ran the On-Call and Tools Puppeteer regression checks successfully.
- No commit or push was performed.

## 2026-09-29 Deployment Cache Versioning

- A live screenshot showed the new Frontdoor HTML paired with the browser-cached pre-rename stylesheet, leaving the hamburger on the right near the 1060px breakpoint.
- Added matching deployment version parameters to the main CSS and JavaScript URLs so browsers fetch coordinated assets after a release.
- GitHub Pages serves these files with a ten-minute cache lifetime, so versioned URLs prevent mixed deployment layouts without requiring users to clear browser data.

## 2026-09-29 Persistent Expanded Navigation

- Removed the responsive hamburger and flyout behavior.
- The complete primary navigation now remains expanded in a fixed left sidebar at every viewport size.
- The sidebar stays 170px wide on desktop and tablet and narrows to 140px below 700px so phone content retains usable space.
- Advanced the main asset version to `20260929-3` so the persistent sidebar CSS is fetched immediately after deployment.
- Verified all ten navigation items remain visible with no hamburger at 1400px, 1034px, 700px, and 390px widths; On-Call and Tools browser tests still pass.

## 2026-09-29 Conference Timeline Spacing

- Removed large empty timeline regions near the 1034px browser width by moving month labels into full-width headers below 1200px.
- Rebalanced event detail columns so conference descriptions receive enough width instead of wrapping into tall narrow stacks.
- Advanced the main asset version to `20260929-4` so the corrected timeline CSS is fetched immediately after deployment.

## 2026-09-29 SOP and JQS Horizontal Overflow

- Removed the forced 1180px SOP table width and 1080px JQS table width.
- SOP and JQS tables now fit the available workspace and wrap cell content instead of displaying horizontal scrollbars.
- Advanced the main asset version to `20260929-5` so browsers fetch the corrected table layout immediately after deployment.

## 2026-09-29 JQS Column Headers

- Rebalanced JQS column widths after removing the table minimum width.
- Kept the short ID, Area, and Actions headers on one line while retaining most table width for Task and Performance Standard.
- Advanced the main asset version to `20260929-6` for immediate delivery after deployment.

## 2026-09-29 Generic GitHub Repositories

- Replaced the identifiable placeholder names in the GitHub Repo table with ten neutral names from Project Alpha through Project Kappa.
- Replaced the repository-specific descriptions with concise generic project descriptions.
- Advanced the main asset version to `20260929-8` so browsers fetch the updated repository data immediately after deployment.

## 2026-09-29 Generic GitHub Organization Data

- Added ten neutral Team names with generic responsibilities.
- Added ten neutral People names with generic organization roles.
- Added ten neutral Security entries covering example reviews, alerts, and remediation work.
- Generalized the shared GitHub item-description map so Repo, Teams, People, and Security use the same table renderer and search behavior.
- Advanced the main asset version to `20260929-9` so browsers fetch the new dummy data immediately after deployment.

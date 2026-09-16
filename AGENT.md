# GitHub Pages Project Notes

## Project

This project is for building a GitHub Pages website using plain HTML, CSS, and JavaScript.

Project folder:

`C:\Users\Ames\Desktop\Projects\GithubPages`

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
  assets/
```

## Working Rules

- Keep the site static and GitHub Pages compatible.
- Do not include passwords, API keys, private documents, or sensitive data.
- Prefer simple, readable HTML/CSS/JS over build tooling unless the project needs it.
- Test locally in a browser before publishing.
- Keep filenames lowercase and URL-friendly where practical.

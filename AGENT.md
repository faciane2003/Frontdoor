# Kevin Example Repo Map

This branch contains a static GitHub Pages site generated from the downloaded Kevin repository file and folder structure.

Source structure input:

`C:\Users\Ames\Desktop\Projects\GithubPages\ExampleGithub Download - Kevin\kevin-main\kevin-main`

Rules:

- The site uses only folder names, file names, extensions, paths, and counts.
- Do not copy Kevin source file contents into this site.
- Keep the site static and GitHub Pages compatible.
- Use relative paths only.
- Main files are `index.html`, `css/styles.css`, `js/main.js`, and `data/repo-map.json`.

Validation:

- Run a local static server from this folder with `python -m http.server 8010`.
- Open `http://localhost:8010/`.
- Because the app loads `data/repo-map.json` with `fetch`, do not test by opening `index.html` directly from disk.

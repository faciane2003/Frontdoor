// Bundle the Outlook parser and generator for on-demand use in the browser.
import { build } from "esbuild";
await build({
  entryPoints: ["scripts/oft-browser-entry.mjs"],
  outfile: "js/oft-browser.js",
  bundle: true,
  format: "esm",
  platform: "browser",
  minify: true,
  external: ["fs", "crypto", "stream"],
  legalComments: "linked",
  banner: { js: "// Generated Outlook tools. Edit scripts/oft-browser-entry.mjs and run npm run build:mail." },
});

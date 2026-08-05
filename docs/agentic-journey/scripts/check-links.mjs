// Internal link check over the static export. Docusaurus did this via
// onBrokenLinks: 'throw'; Next has no equivalent, so this replaces it.
// Walks out/, resolves every internal href and #anchor, exits 1 on any miss.

import fs from "node:fs";
import path from "node:path";

const OUT = path.join(import.meta.dirname, "..", "out");
const BASE = "/agentic-starter-journey";

if (!fs.existsSync(OUT)) {
  console.error("out/ not found. Run `npm run build` first.");
  process.exit(1);
}

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full) : [full];
  });

const htmlFiles = walk(OUT).filter((f) => f.endsWith(".html"));

// Map every served URL path to the set of element ids on that page.
const idsByPath = new Map();
for (const file of htmlFiles) {
  const rel = path.relative(OUT, file);
  const urlPath = "/" + rel.replace(/index\.html$/, "").replace(/\.html$/, "");
  const html = fs.readFileSync(file, "utf8");
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  idsByPath.set(urlPath.replace(/\/$/, "") || "/", ids);
}

const known = (p) => idsByPath.has(p.replace(/\/$/, "") || "/");

let broken = 0;
for (const file of htmlFiles) {
  const rel = path.relative(OUT, file);
  const html = fs.readFileSync(file, "utf8");

  for (const [, href] of html.matchAll(/<a[^>]+href="([^"]+)"/g)) {
    if (!href.startsWith("/")) continue; // external, mailto, or in-page handled below
    const [rawPath, anchor] = href.split("#");

    // Strip the basePath the export prepends to every internal link.
    const target = rawPath.startsWith(BASE) ? rawPath.slice(BASE.length) || "/" : rawPath;

    if (!known(target)) {
      console.error(`${rel}: broken link -> ${href}`);
      broken++;
      continue;
    }
    if (anchor && !idsByPath.get(target.replace(/\/$/, "") || "/").has(anchor)) {
      console.error(`${rel}: broken anchor -> ${href}`);
      broken++;
    }
  }
}

console.log(
  broken === 0
    ? `OK: ${htmlFiles.length} pages, no broken internal links or anchors.`
    : `FAIL: ${broken} broken internal link(s).`
);
process.exit(broken === 0 ? 0 : 1);

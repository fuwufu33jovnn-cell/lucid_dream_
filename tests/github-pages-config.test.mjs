import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("GitHub Pages build exports under the repository base path", async () => {
  const config = await readFile(new URL("next.config.ts", root), "utf8");
  const layout = await readFile(new URL("app/layout.tsx", root), "utf8");

  assert.match(config, /output:\s*["']export["']/);
  assert.match(config, /GITHUB_ACTIONS/);
  assert.match(config, /["']\/lucid_dream_["']/);
  assert.match(config, /basePath/);
  assert.match(config, /images:\s*{\s*unoptimized:\s*true\s*}/s);
  assert.match(layout, /GITHUB_ACTIONS/);
  assert.match(layout, /["']\/lucid_dream_\/favicon\.svg["']/);
});

test("all app routes are statically exportable", async () => {
  const routeFiles = [
    "app/page.tsx",
    "app/career/page.tsx",
    "app/ielts/page.tsx",
    "app/language-lab/page.tsx",
    "app/life-abroad/page.tsx",
    "app/progress/page.tsx",
    "app/route-map/page.tsx",
  ];

  for (const routeFile of routeFiles) {
    const source = await readFile(new URL(routeFile, root), "utf8");
    assert.doesNotMatch(source, /force-dynamic/, routeFile);
  }
});

test("GitHub Pages workflow publishes the static out directory", async () => {
  const workflow = await readFile(
    new URL(".github/workflows/deploy-pages.yml", root),
    "utf8",
  );

  assert.match(workflow, /npx next build/);
  assert.match(workflow, /path:\s*\.\/out/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
});

test("Next.js type checking ignores the separate Vite preview config", async () => {
  const tsconfig = await readFile(new URL("tsconfig.json", root), "utf8");
  const parsed = JSON.parse(tsconfig);

  assert.ok(parsed.exclude.includes("vite.config.ts"));
});

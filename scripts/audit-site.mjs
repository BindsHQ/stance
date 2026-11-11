// Real-browser audit of the built docs site: axe (WCAG 2.2 A/AA incl. contrast), console errors and
// horizontal overflow, for every page in light, dark and high contrast.
// Usage: node scripts/audit-site.mjs [baseUrl]   (serve apps/docs/out first: node scripts/serve-static.mjs)
import { chromium } from '@playwright/test';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createRequire } from 'node:module';

const base = process.argv[2] ?? 'http://localhost:4319';
const out = join(import.meta.dirname, '..', 'apps', 'docs', 'out');
const axeSource = readFileSync(
  createRequire(import.meta.url).resolve('axe-core/axe.min.js'),
  'utf8',
);

const walk = (d) =>
  readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(d, e.name)) : e.name.endsWith('.html') ? [join(d, e.name)] : [],
  );
const routes = walk(out)
  .map(
    (f) =>
      '/' +
      relative(out, f)
        .replace(/index\.html$/, '')
        .replace(/\.html$/, ''),
  )
  .filter((r) => !r.startsWith('/_') && r !== '/404')
  .sort();

const themes = ['light', 'dark', 'high-contrast'];
// Console errors that are the documented behaviour of a demo, not defects.
const expectedConsole = {
  '/components/error-boundary': /Template HTML could not be parsed/, // ErrorBoundary demo throws on purpose
  '/components/image': /404/, // Image demo shows the fallback for a missing source
};
const browser = await chromium.launch();
const results = [];
for (const theme of themes) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript((t) => localStorage.setItem('stance-theme', t), theme);
  const page = await ctx.newPage();
  let errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  for (const route of routes) {
    errors = [];
    await page.goto(base + route, { waitUntil: 'networkidle' });
    await page.addScriptTag({ content: axeSource });
    const violations = await page.evaluate(async () => {
      const r = await window.axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
      });
      return r.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.length,
        sample: v.nodes.slice(0, 3).map((n) => n.target.join(' ')),
      }));
    });
    const allowed = expectedConsole[route];
    results.push({
      theme,
      route,
      violations,
      errors: errors.filter((e) => !(allowed && allowed.test(e))),
    });
  }
  await ctx.close();
}
// Mobile overflow (light theme is sufficient for layout)
const mctx = await browser.newContext({ viewport: { width: 360, height: 780 } });
const mp = await mctx.newPage();
const overflow = [];
for (const route of routes) {
  await mp.goto(base + route, { waitUntil: 'networkidle' });
  const w = await mp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (w > 1) overflow.push({ route, px: w });
}
await browser.close();

const bad = results.filter((r) => r.violations.length || r.errors.length);
const byRule = {};
for (const r of results)
  for (const v of r.violations)
    (byRule[`${v.id} (${v.impact})`] ??= []).push(
      `${r.theme} ${r.route} ×${v.nodes} ${v.sample.join(', ')}`,
    );
const summary = {
  pages: routes.length,
  checks: results.length,
  pagesWithIssues: bad.length,
  overflow,
  byRule,
  consoleErrors: results
    .filter((r) => r.errors.length)
    .map((r) => ({ theme: r.theme, route: r.route, errors: r.errors.slice(0, 3) })),
};
writeFileSync(
  join(import.meta.dirname, '..', 'audit-report.json'),
  JSON.stringify(summary, null, 2),
);
console.log(
  `pages ${routes.length} × themes ${themes.length} = ${results.length} checks; with issues: ${bad.length}; mobile overflow: ${overflow.length}`,
);
for (const [rule, hits] of Object.entries(byRule))
  console.log(`- ${rule}: ${hits.length} page/theme hits\n    ${hits.slice(0, 4).join('\n    ')}`);
for (const c of summary.consoleErrors.slice(0, 10))
  console.log(`! console ${c.theme} ${c.route}: ${c.errors.join(' | ').slice(0, 300)}`);
for (const o of overflow) console.log(`↔ overflow ${o.route}: ${o.px}px`);
process.exit(bad.length || overflow.length ? 1 : 0);

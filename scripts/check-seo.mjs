// Static SEO/AEO audit of the exported docs site (apps/docs/out).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const out = join(import.meta.dirname, '..', 'apps', 'docs', 'out');
const walk = (d) =>
  readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(d, e.name)) : e.name.endsWith('.html') ? [join(d, e.name)] : [],
  );
const pages = walk(out).filter(
  (f) => !/\/(_|404)/.test('/' + relative(out, f)) && !relative(out, f).startsWith('_'),
);
const problems = [];
const titles = new Map();
const descs = new Map();
const decode = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
for (const file of pages) {
  const route =
    '/' +
    relative(out, file)
      .replace(/index\.html$/, '')
      .replace(/\.html$/, '');
  const html = readFileSync(file, 'utf8');
  const get = (re) => (html.match(re)?.[1] ? decode(html.match(re)[1]) : undefined);
  const title = get(/<title>([^<]*)<\/title>/);
  const desc = get(/<meta name="description" content="([^"]*)"/);
  const canonical = get(/<link rel="canonical" href="([^"]*)"/);
  const ogImage = get(/<meta property="og:image" content="([^"]*)"/);
  const lang = get(/<html[^>]* lang="([^"]+)"/);
  const h1 = (html.match(/<h1[\s>]/g) ?? []).length;
  const robots = get(/<meta name="robots" content="([^"]*)"/);
  const p = (m) => problems.push(`${route}: ${m}`);
  if (!title) p('missing <title>');
  else {
    if (title.length > 65) p(`title ${title.length} chars (> 65): ${title}`);
    titles.set(title, [...(titles.get(title) ?? []), route]);
  }
  if (!desc) p('missing meta description');
  else {
    if (desc.length < 50 || desc.length > 170) p(`description ${desc.length} chars (50 to 170)`);
    descs.set(desc, [...(descs.get(desc) ?? []), route]);
  }
  if (!canonical) p('missing canonical');
  else if (!canonical.startsWith('https://stanceui.com')) p(`canonical not absolute: ${canonical}`);
  if (!ogImage) p('missing og:image');
  else if (!existsSync(join(out, new URL(ogImage).pathname)))
    p(`og:image file missing: ${ogImage}`);
  if (lang !== 'en-GB') p(`lang is ${lang}`);
  if (h1 !== 1) p(`${h1} <h1> elements`);
  if (robots && /noindex/.test(robots)) p('page is noindex');
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const data = JSON.parse(m[1]);
      if (data['@context'] !== 'https://schema.org') p('JSON-LD missing schema.org context');
    } catch (e) {
      p(`invalid JSON-LD: ${e.message}`);
    }
  }
  if (!html.includes('application/ld+json')) p('no JSON-LD');
}
for (const [t, r] of titles)
  if (r.length > 1) problems.push(`duplicate title "${t}": ${r.join(', ')}`);
for (const [, r] of descs)
  if (r.length > 1) problems.push(`duplicate description on ${r.join(', ')}`);
for (const f of [
  'robots.txt',
  'sitemap.xml',
  'manifest.webmanifest',
  'llms.txt',
  'llms-full.txt',
  'favicon.ico',
  'icon.svg',
  'apple-touch-icon.png',
])
  if (!existsSync(join(out, f))) problems.push(`missing /${f}`);
const sitemap = readFileSync(join(out, 'sitemap.xml'), 'utf8');
const listed = new Set(
  [...sitemap.matchAll(/<loc>https:\/\/stanceui\.com([^<]*)<\/loc>/g)].map((m) => m[1] || '/'),
);
for (const file of pages) {
  const route =
    '/' +
    relative(out, file)
      .replace(/index\.html$/, '')
      .replace(/\.html$/, '');
  if (!listed.has(route === '/' ? '/' : route)) problems.push(`not in sitemap: ${route}`);
}
console.log(
  `SEO check: ${pages.length} pages, ${listed.size} sitemap URLs, ${problems.length} problems`,
);
for (const x of problems.slice(0, 40)) console.log('  ✗ ' + x);
process.exit(problems.length ? 1 : 0);

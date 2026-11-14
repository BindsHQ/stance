// Builds the docs registry from content/components/*.tsx:
//  - generated/registry.ts   lazy loaders keyed by slug (client-side code splitting)
//  - generated/meta.json      name/category/summary per component (nav, search, metadata)
//  - generated/examples.json  exact source of every exported example function
//  - generated/native.json    iOS and Android inventories from platforms/*/components.json
//  - generated/native-idioms.json  platform idioms from specs/native-parity.json
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { join, basename } from 'node:path';

const root = join(import.meta.dirname, '..');
const dir = join(root, 'content', 'components');
const out = join(root, 'generated');
mkdirSync(out, { recursive: true });

const files = readdirSync(dir)
  .filter((f) => f.endsWith('.tsx'))
  .sort();
const meta = [];
const examples = {};
const problems = [];

const str = (src, key) => {
  const m = src.match(new RegExp(`\\n\\s+${key}:\\s*\\n?\\s*(['"\`])([\\s\\S]*?)\\1,`));
  return m ? m[2].replace(/\\'/g, "'") : undefined;
};

for (const file of files) {
  const slug = basename(file, '.tsx');
  const src = readFileSync(join(dir, file), 'utf8');
  const name = str(src, 'name');
  const category = str(src, 'category');
  const summary = str(src, 'summary');
  const status = str(src, 'status') ?? 'stable';
  const docSlug = str(src, 'slug');
  if (!name || !category || !summary) problems.push(`${file}: missing name/category/summary`);
  if (docSlug && docSlug !== slug)
    problems.push(`${file}: slug "${docSlug}" does not match file name`);

  // Imports from Stance in this file, to rebuild a minimal import line per example.
  const stanceImports = new Set();
  for (const m of src.matchAll(/import\s*\{([^}]+)\}\s*from\s*'@bindshq\/stance-react'/g)) {
    m[1]
      .split(',')
      .map((s) => s.trim().replace(/^type\s+/, ''))
      .filter(Boolean)
      .forEach((s) => stanceImports.add(s));
  }
  for (const m of src.matchAll(/import\s+type\s*\{([^}]+)\}\s*from\s*'@bindshq\/stance-react'/g)) {
    m[1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((s) => stanceImports.add(s));
  }
  const reactTypes = new Set();
  for (const m of src.matchAll(/import\s+type\s*\{([^}]+)\}\s*from\s*'react'/g)) {
    m[1]
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
      .forEach((x) => reactTypes.add(x));
  }
  const reactHooks = new Set();
  for (const m of src.matchAll(/import\s*(?:\*\s*as\s*React|\{([^}]+)\})\s*from\s*'react'/g)) {
    if (m[1])
      m[1]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((s) => reactHooks.add(s));
  }

  examples[slug] = {};
  const lines = src.split('\n');
  // Mark lines that begin inside a multi-line template literal so they are never parsed as code.
  const inTemplate = [];
  let open = false;
  for (const line of lines) {
    inTemplate.push(open);
    const ticks = (line.replace(/\\`/g, '').match(/`/g) ?? []).length;
    if (ticks % 2 === 1) open = !open;
  }
  const templateEnd = (from) => {
    let j = from;
    while (j + 1 < lines.length && inTemplate[j + 1]) j++;
    return j;
  };

  // Top-level, non-exported declarations (helpers, data, types) that examples may reference.
  const decls = [];
  for (let i = 0; i < lines.length; i++) {
    if (inTemplate[i]) continue;
    const d = lines[i].match(/^(?:const|let|function|type|interface|class)\s+(\w+)/);
    if (!d) continue;
    let end;
    if (i + 1 < lines.length && inTemplate[i + 1]) {
      end = templateEnd(i);
    } else if (
      /[;}]\s*$/.test(lines[i]) &&
      !/[{([]\s*$/.test(lines[i]) &&
      !/=\s*$/.test(lines[i])
    ) {
      end = i;
    } else {
      end = i + 1;
      while (end < lines.length && !/^(\}|\]|\))/.test(lines[end])) end++;
    }
    decls.push({ name: d[1], text: lines.slice(i, end + 1).join('\n') });
    i = end;
  }
  const typeImports = new Set();
  for (const m of src.matchAll(/import\s+type\s*\{([^}]+)\}\s*from\s*'@bindshq\/stance-react'/g)) {
    m[1]
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
      .forEach((x) => typeImports.add(x));
  }
  for (const m of src.matchAll(/import\s*\{([^}]+)\}\s*from\s*'@bindshq\/stance-react'/g)) {
    m[1]
      .split(',')
      .map((x) => x.trim())
      .filter((x) => x.startsWith('type '))
      .forEach((x) => typeImports.add(x.slice(5).trim()));
  }
  for (let i = 0; i < lines.length; i++) {
    if (inTemplate[i]) continue;
    const m = lines[i].match(/^export function (\w+)\s*\(/);
    if (!m) continue;
    let end = i;
    while (end < lines.length && lines[end] !== '}') end++;
    const fn = lines.slice(i, end + 1).join('\n');
    // Pull in referenced helpers transitively, in source order.
    const needed = new Set();
    let frontier = fn;
    for (let pass = 0; pass < 5; pass++) {
      let added = false;
      for (const d of decls) {
        if (!needed.has(d.name) && new RegExp(`\\b${d.name}\\b`).test(frontier)) {
          needed.add(d.name);
          frontier += '\n' + d.text;
          added = true;
        }
      }
      if (!added) break;
    }
    const helpers = decls.filter((d) => needed.has(d.name)).map((d) => d.text);
    const body = [...helpers, fn].join('\n\n');
    const used = [...stanceImports].filter(
      (n) => !typeImports.has(n) && new RegExp(`\\b${n}\\b`).test(body),
    );
    const usedTypes = [...typeImports].filter((n) => new RegExp(`\\b${n}\\b`).test(body));
    const usedHooks = [...reactHooks].filter((n) => new RegExp(`\\b${n}\\b`).test(body));
    const usesReactNs = /\bReact\./.test(body);
    const usedReactTypes = [...reactTypes].filter((n) => new RegExp(`\\b${n}\\b`).test(body));
    const header = [
      usesReactNs
        ? "import * as React from 'react';"
        : usedHooks.length
          ? `import { ${usedHooks.join(', ')} } from 'react';`
          : null,
      usedReactTypes.length ? `import type { ${usedReactTypes.join(', ')} } from 'react';` : null,
      used.length ? `import { ${used.join(', ')} } from '@bindshq/stance-react';` : null,
      usedTypes.length
        ? `import type { ${usedTypes.join(', ')} } from '@bindshq/stance-react';`
        : null,
    ].filter(Boolean);
    examples[slug][m[1]] = `${header.join('\n')}${header.length ? '\n\n' : ''}${body}`;
  }
  meta.push({ slug, name, category, summary, status });
}

const loaders = meta
  .map((m) => `  '${m.slug}': () => import('../content/components/${m.slug}'),`)
  .join('\n');
writeFileSync(
  join(out, 'registry.ts'),
  `// Generated by scripts/generate-registry.mjs, do not edit.\nimport type { ComponentModule } from '../lib/registry-types';\n\nexport const loaders: Record<string, () => Promise<ComponentModule>> = {\n${loaders}\n};\n`,
);
writeFileSync(join(out, 'meta.json'), JSON.stringify(meta, null, 2));
writeFileSync(join(out, 'examples.json'), JSON.stringify(examples, null, 2));
// Serialisable doc data (no React) for server-only routes: llms.txt, Markdown, OG images.
// Each content file is compiled with the TypeScript compiler and evaluated in Node.
const ts = createRequire(import.meta.url)('typescript');
const evalDir = join(root, '.cache', 'docs-eval');
rmSync(evalDir, { recursive: true, force: true });
mkdirSync(evalDir, { recursive: true });
const docsData = {};
for (const m of meta) {
  const src = readFileSync(join(dir, `${m.slug}.tsx`), 'utf8');
  const { outputText } = ts.transpileModule(src, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      verbatimModuleSyntax: false,
    },
  });
  const file = join(evalDir, `${m.slug}.mjs`);
  writeFileSync(file, outputText);
  const mod = await import(pathToFileURL(file).href);
  docsData[m.slug] = JSON.parse(
    JSON.stringify(mod.doc, (k, v) => (typeof v === 'function' ? undefined : v)),
  );
}
writeFileSync(join(out, 'docs-data.json'), JSON.stringify(docsData));

// The site's own webEquivalent reader (lib/native-links.ts), compiled so both agree.
const linksFile = join(evalDir, 'native-links.mjs');
writeFileSync(
  linksFile,
  ts.transpileModule(readFileSync(join(root, 'lib', 'native-links.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText,
);
const { webSlugs, coversWeb, sharesWeb } = await import(pathToFileURL(linksFile).href);

// Fixture: `webEquivalent` is a slug, a list of slugs, or null. Arrays are exercised even
// while every inventory still uses strings.
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
for (const [ok, label] of [
  [same(webSlugs('button'), ['button']), 'string'],
  [same(webSlugs(['table', 'data-grid']), ['table', 'data-grid']), 'array'],
  [same(webSlugs(null), []) && same(webSlugs(undefined), []) && same(webSlugs([]), []), 'empty'],
  [coversWeb(['table', 'data-grid'], 'data-grid') && !coversWeb('table', 'data-grid'), 'covers'],
  [sharesWeb(['table', 'data-grid'], 'data-grid') && !sharesWeb('table', null), 'shares'],
])
  if (!ok) problems.push(`lib/native-links.ts: ${label} webEquivalent fixture failed`);

// Native component inventories (written by each platform package).
const webSlugSet = new Set(meta.map((m) => m.slug));
const native = {};
for (const platform of ['ios', 'android']) {
  const file = join(root, '..', '..', 'platforms', platform, 'components.json');
  native[platform] = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : [];
  for (const c of native[platform]) {
    if (!c.name || !c.category || !c.summary || !c.example)
      problems.push(`${platform}/components.json: ${c.name ?? '?'} is missing required fields`);
    const w = c.webEquivalent;
    if (w != null && typeof w !== 'string' && !(Array.isArray(w) && w.length > 0))
      problems.push(
        `${platform}/components.json: ${c.name} webEquivalent must be a slug, a list of slugs or null`,
      );
    for (const slug of webSlugs(w))
      if (!webSlugSet.has(slug))
        problems.push(
          `${platform}/components.json: ${c.name} webEquivalent "${slug}" is not a web component`,
        );
  }
}
writeFileSync(join(out, 'native.json'), JSON.stringify(native, null, 2));

// Legal texts: the site shows the repository's own LICENSE, NOTICE and TRADEMARK.md, never a copy.
{
  const repo = join(root, '..', '..');
  const legal = Object.fromEntries(
    [
      ['license', 'LICENSE'],
      ['notice', 'NOTICE'],
      ['trademark', 'TRADEMARK.md'],
    ].map(([key, file]) => [key, readFileSync(join(repo, file), 'utf8')]),
  );
  if (
    !legal.license.includes('Apache License') ||
    !legal.license.includes('Version 2.0, January 2004')
  )
    throw new Error('LICENSE is not the Apache License, Version 2.0');
  writeFileSync(join(out, 'legal.json'), JSON.stringify(legal, null, 2));
}

// Platform idioms: web components whose native answer is the platform's own API.
const parityFile = join(root, '..', '..', 'specs', 'native-parity.json');
const parity = existsSync(parityFile) ? JSON.parse(readFileSync(parityFile, 'utf8')) : {};
const idioms = {};
for (const platform of ['ios', 'android']) {
  idioms[platform] = {};
  for (const [slug, text] of Object.entries(parity[platform]?.idiom ?? {})) {
    if (!webSlugSet.has(slug))
      problems.push(`specs/native-parity.json: ${platform} idiom "${slug}" is not a web component`);
    else if (typeof text !== 'string' || !text.trim())
      problems.push(`specs/native-parity.json: ${platform} idiom "${slug}" needs a sentence`);
    else idioms[platform][slug] = text.trim();
  }
}
writeFileSync(join(out, 'native-idioms.json'), JSON.stringify(idioms, null, 2));

// Guide pages may only name native components that exist in an inventory.
const nativeNames = new Set([...native.ios, ...native.android].map((c) => c.name));
if (nativeNames.size > 0) {
  const pagesRoot = join(root, 'content', 'pages');
  for (const section of readdirSync(pagesRoot, { withFileTypes: true }).filter((d) =>
    d.isDirectory(),
  )) {
    for (const file of readdirSync(join(pagesRoot, section.name)).filter((f) =>
      f.endsWith('.tsx'),
    )) {
      const text = readFileSync(join(pagesRoot, section.name, file), 'utf8');
      for (const name of new Set(text.match(/\bStance[A-Z]\w+/g) ?? [])) {
        if (
          !nativeNames.has(name) &&
          ![
            'StanceUI',
            'StanceTokens',
            'StanceShowcase',
            'StanceRGBA',
            'StanceSpacing',
            'StanceTone',
          ].includes(name)
        )
          problems.push(
            `${section.name}/${file}: "${name}" is not in the iOS or Android inventory`,
          );
      }
    }
  }
}

// Guide pages: content/pages/pages.json is the catalogue; index.ts is generated from it.
const pagesDir = join(root, 'content', 'pages');
const guidePages = JSON.parse(readFileSync(join(pagesDir, 'pages.json'), 'utf8'));
const pageIdent = (p) => `${p.section}_${p.slug}`.replace(/-/g, '_');
for (const p of guidePages) {
  if (!existsSync(join(pagesDir, p.section, `${p.slug}.tsx`)))
    problems.push(`pages.json: missing content file ${p.section}/${p.slug}.tsx`);
  if (p.description.length < 50 || p.description.length > 170)
    problems.push(`pages.json: ${p.section}/${p.slug} description must be 50 to 170 characters`);
}
writeFileSync(
  join(pagesDir, 'index.ts'),
  `// Generated by scripts/generate-registry.mjs from pages.json, do not edit.\nimport type { GuidePage } from '../../lib/pages-types';\n` +
    guidePages.map((p) => `import ${pageIdent(p)} from './${p.section}/${p.slug}';`).join('\n') +
    `\n\nexport const pages: GuidePage[] = [\n` +
    guidePages
      .map(
        (p) =>
          `  { section: ${JSON.stringify(p.section)}, slug: ${JSON.stringify(p.slug)}, title: ${JSON.stringify(p.title)}, description: ${JSON.stringify(p.description)}, Component: ${pageIdent(p)} },`,
      )
      .join('\n') +
    `\n];\n`,
);

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`docs registry: ${meta.length} components`);

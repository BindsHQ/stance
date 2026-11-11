// Records the rendered previews in components.json. Entries without images get "preview": null.
// Run from anywhere: node platforms/ios/Scripts/update-preview-manifest.mjs
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(import.meta.dirname, '..');
const file = join(dir, 'components.json');
const components = JSON.parse(readFileSync(file, 'utf8'));
const themes = ['light', 'dark', 'high-contrast'];

/** Kebab-case of the inventory name without its parentheses. */
const baseSlug = (name) =>
  name
    .replace(/\(.*\)/, '')
    .replace(/UIKit/, 'Uikit')
    .replace(/(?<!^)([A-Z])/g, '-$1')
    .toLowerCase();

// A modifier that shares its base slug with a view (stanceCard() and StanceCard) gets a suffix.
const seen = new Set();
const slugs = components.map((c) => {
  const base = baseSlug(c.name);
  const slug = seen.has(base) ? `${base}-${c.kind}` : base;
  seen.add(base);
  return slug;
});

/** PNG width and height from the IHDR chunk. */
const size = (path) => {
  const bytes = readFileSync(path);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
};

let withPreview = 0;
components.forEach((component, index) => {
  const slug = slugs[index];
  const paths = themes.map((theme) => join(dir, 'previews', `${slug}.${theme}.png`));
  component.slug = slug;
  if (paths.every(existsSync)) {
    const { width, height } = size(paths[0]);
    component.preview = {
      ...Object.fromEntries(themes.map((theme) => [theme, `previews/${slug}.${theme}.png`])),
      width: Math.round(width / 2),
      height: Math.round(height / 2),
    };
    withPreview++;
  } else {
    component.preview = null;
  }
});
writeFileSync(file, JSON.stringify(components, null, 2) + '\n');
console.log(`components.json: ${withPreview} with previews, ${components.length - withPreview} without`);

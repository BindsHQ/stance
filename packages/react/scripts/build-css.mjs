// Collects component CSS into dist/styles.css plus one file per component in dist/css/.
// Also writes dist/styles.layered.css: the same rules inside cascade layers, as an opt-in entry.
import {
  copyFileSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const pkg = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(pkg, 'src');
const dist = join(pkg, 'dist');
mkdirSync(join(dist, 'css'), { recursive: true });

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.css') ? [p] : [];
  });

const base = readFileSync(join(src, 'styles', 'base.css'), 'utf8');
const components = walk(join(src, 'components')).sort();
const banner =
  '/* @bindshq/stance-react, component styles. Requires @bindshq/stance-tokens/css. */\n';
const parts = [banner, base];
const componentParts = [];
for (const file of components) {
  const css = readFileSync(file, 'utf8');
  const part = `/* ${basename(file)} */\n${css}`;
  parts.push(part);
  componentParts.push(part);
  copyFileSync(file, join(dist, 'css', basename(file)));
}
writeFileSync(join(dist, 'styles.css'), parts.join('\n'));

// Layered variant. Unlayered consumer CSS always wins over layered rules, and consumers can
// slot their own layers around `stance.base` and `stance.components`. styles.css stays unlayered.
const layeredBanner =
  '/* @bindshq/stance-react, component styles in cascade layers. Requires @bindshq/stance-tokens/css.\n' +
  ' * Use instead of styles.css, never together with it. */\n';
const layered = [
  layeredBanner,
  '@layer stance.base, stance.components;\n',
  `@layer stance.base {\n${base}}\n`,
  `@layer stance.components {\n${componentParts.join('\n')}}\n`,
];
writeFileSync(join(dist, 'styles.layered.css'), layered.join('\n'));
copyFileSync(join(src, 'styles', 'base.css'), join(dist, 'css', 'base.css'));
copyFileSync(join(src, 'styles', 'global.css'), join(dist, 'global.css'));
console.log(`styles.css: base + ${components.length} component stylesheets`);
console.log('styles.layered.css: same rules in @layer stance.base, stance.components');

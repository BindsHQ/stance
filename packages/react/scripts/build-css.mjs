// Collects component CSS into dist/styles.css plus one file per component in dist/css/.
import { copyFileSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
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
const banner = '/* @bindshq/stance-react — component styles. Requires @bindshq/stance-tokens/css. */\n';
const parts = [banner, base];
for (const file of components) {
  const css = readFileSync(file, 'utf8');
  parts.push(`/* ${basename(file)} */\n${css}`);
  copyFileSync(file, join(dist, 'css', basename(file)));
}
writeFileSync(join(dist, 'styles.css'), parts.join('\n'));
copyFileSync(join(src, 'styles', 'base.css'), join(dist, 'css', 'base.css'));
copyFileSync(join(src, 'styles', 'global.css'), join(dist, 'global.css'));
console.log(`styles.css: base + ${components.length} component stylesheets`);

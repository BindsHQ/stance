// Converts the native preview PNGs (rendered by the iOS and Android libraries) into
// lossless WebP for the site, and writes a manifest with their dimensions.
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const root = join(import.meta.dirname, '..');
const repo = join(root, '..', '..');
const manifest = { ios: {}, android: {} };

for (const platform of ['ios', 'android']) {
  const src = join(repo, 'platforms', platform, 'previews');
  const out = join(root, 'public', 'native', platform);
  mkdirSync(out, { recursive: true });
  if (!existsSync(src)) continue;
  for (const file of readdirSync(src)
    .filter((f) => f.endsWith('.png'))
    .sort()) {
    const name = file.replace(/\.png$/, '');
    const target = join(out, `${name}.webp`);
    const input = sharp(join(src, file));
    const meta = await input.metadata();
    // Full-screen captures are shown small inside a device frame; component previews keep full resolution.
    const maxWidth = name.startsWith('showcase-')
      ? name.includes('ipad') || name.includes('tablet')
        ? 1600
        : 720
      : 1080;
    const width = Math.min(meta.width, maxWidth);
    const height = Math.round((meta.height * width) / meta.width);
    if (!existsSync(target) || statSync(target).mtimeMs < statSync(join(src, file)).mtimeMs) {
      await input
        .resize({ width, withoutEnlargement: true })
        .webp({ lossless: true, effort: 6 })
        .toFile(target);
    }
    manifest[platform][name] = { src: `/native/${platform}/${name}.webp`, width, height };
  }
}
writeFileSync(join(root, 'generated', 'native-media.json'), JSON.stringify(manifest, null, 2));
console.log(
  `native media: ${Object.keys(manifest.ios).length} iOS, ${Object.keys(manifest.android).length} Android images`,
);

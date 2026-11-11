// Verifies every path in each package's exports map exists after build, and that the packed tarball contains it.
import { existsSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

let failed = false;
for (const pkg of ['packages/tokens', 'packages/react']) {
  const dir = join(import.meta.dirname, '..', pkg);
  const json = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  const targets = [];
  const walk = (v) =>
    typeof v === 'string' ? targets.push(v) : v && Object.values(v).forEach(walk);
  walk(json.exports);
  for (const t of targets) {
    if (t.includes('*')) continue;
    if (!existsSync(join(dir, t))) {
      console.error(`✗ ${json.name}: export target missing: ${t}`);
      failed = true;
    }
  }
  const packed = JSON.parse(
    execSync('npm pack --dry-run --json', { cwd: dir, encoding: 'utf8' }),
  )[0];
  const files = new Set(packed.files.map((f) => f.path));
  for (const t of targets.filter((x) => !x.includes('*'))) {
    if (!files.has(t.replace(/^\.\//, ''))) {
      console.error(`✗ ${json.name}: ${t} not in packed tarball`);
      failed = true;
    }
  }
  if (packed.files.some((f) => /\.env|\.test\./.test(f.path))) {
    console.error(`✗ ${json.name}: tarball contains test or env files`);
    failed = true;
  }
  console.log(
    `✓ ${json.name}@${json.version}: ${targets.length} exports, ${packed.files.length} files, ${(packed.unpackedSize / 1024).toFixed(0)} kB unpacked`,
  );
}
process.exit(failed ? 1 : 0);

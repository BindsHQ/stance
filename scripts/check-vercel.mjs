// The site can be deployed with Vercel's Root Directory set to the repository root or to apps/docs.
// Both configs must stay identical apart from the commands and output path.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const a = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));
const b = JSON.parse(readFileSync(join(root, 'apps', 'docs', 'vercel.json'), 'utf8'));
const strip = ({ installCommand: _i, buildCommand: _b, outputDirectory: _o, ...rest }) =>
  JSON.stringify(rest);
if (strip(a) !== strip(b)) {
  console.error('vercel.json and apps/docs/vercel.json differ in redirects, headers or settings.');
  process.exit(1);
}
if (!a.installCommand.includes('--include=dev') || !b.installCommand.includes('--include=dev')) {
  console.error(
    'Vercel install commands must include dev dependencies (the build needs TypeScript).',
  );
  process.exit(1);
}
console.log('✓ Vercel configs agree');

// Regenerates everything the native platforms derive from shared sources:
// tokens (Swift, Kotlin), icons (from the web icon geometry), Android XML resources,
// the native component inventories and the compiled iOS example tests.
// CI runs this and fails if the working tree changes, so native output can never drift.
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const steps = [
  ['tokens', 'packages/tokens/scripts/build-tokens.mjs'],
  ['iOS icons', 'platforms/ios/Scripts/generate-icons.mjs'],
  ['iOS example tests', 'platforms/ios/Scripts/generate-example-tests.mjs'],
  ['Android icons', 'platforms/android/scripts/generate-icons.mjs'],
  ['Android resources', 'platforms/android/scripts/generate-resources.mjs'],
  ['Android inventory', 'platforms/android/scripts/generate-components-json.mjs'],
];
for (const [name, script] of steps) {
  const out = execFileSync(process.execPath, [join(root, script)], { cwd: root, encoding: 'utf8' });
  console.log(`${name}: ${out.trim().split('\n').pop()}`);
}

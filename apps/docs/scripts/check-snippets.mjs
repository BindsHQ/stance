// Type-checks every documentation snippet as a standalone module against the built packages.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import examples from '../generated/examples.json' with { type: 'json' };

const dir = join(import.meta.dirname, '..', '.snippets');
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
let count = 0;
for (const [slug, exs] of Object.entries(examples)) {
  for (const [name, code] of Object.entries(exs)) {
    const needsReact = /\bReact\./.test(code) && !/import \* as React/.test(code);
    writeFileSync(
      join(dir, `${slug}__${name}.tsx`),
      `${needsReact ? "import * as React from 'react';\n" : ''}${code}\n`,
    );
    count++;
  }
}
writeFileSync(
  join(dir, 'tsconfig.json'),
  JSON.stringify({
    extends: '../../../tsconfig.base.json',
    compilerOptions: { noEmit: true, noUnusedLocals: false, types: [] },
    include: ['./*.tsx'],
  }),
);
try {
  execSync(`npx tsc -p ${join(dir, 'tsconfig.json')}`, { stdio: 'pipe', encoding: 'utf8' });
  console.log(`✓ ${count} documentation snippets type-check as standalone modules`);
  rmSync(dir, { recursive: true, force: true });
} catch (e) {
  console.error(e.stdout || e.message);
  console.error(`✗ snippet type errors (sources kept in ${dir})`);
  process.exit(1);
}

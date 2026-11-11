// React 18 compatibility check, the way a real application meets Stance:
// pack both packages, install them into a clean project with React 18,
// server-render a set of components and type-check a consumer file against @types/react 18.
import { execSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const dir = mkdtempSync(join(tmpdir(), 'stance-react18-'));
const run = (cmd, cwd = dir) => execSync(cmd, { cwd, stdio: 'pipe', encoding: 'utf8' });
try {
  const pack = (pkg) =>
    run(`npm pack --pack-destination "${dir}"`, join(root, 'packages', pkg))
      .trim()
      .split('\n')
      .pop();
  const tokens = pack('tokens');
  const react = pack('react');
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify({ name: 'stance-react18-check', private: true, type: 'module' }),
  );
  run(
    `npm install --no-audit --no-fund react@18.3.1 react-dom@18.3.1 typescript@5.9.3 @types/react@18 @types/react-dom@18 ./${tokens} ./${react}`,
  );

  writeFileSync(
    join(dir, 'ssr.mjs'),
    `import * as React from 'react';
import { renderToString } from 'react-dom/server';
import * as S from '@bindshq/stance-react';
const h = React.createElement;
if (!React.version.startsWith('18.')) throw new Error('expected React 18, got ' + React.version);
const html = renderToString(
  h(S.ThemeProvider, null,
    h(S.FormField, { label: 'Template name', required: true }, h(S.Input, { defaultValue: 'Sales' })),
    h(S.Button, { leadingIcon: h(S.Icon, { name: 'send' }) }, 'Deploy'),
    h(S.Tabs, { defaultValue: 'a' }, h(S.TabsList, { 'aria-label': 'Sections' }, h(S.TabsTrigger, { value: 'a' }, 'A')), h(S.TabsContent, { value: 'a' }, 'Panel')),
    h(S.Select, { 'aria-label': 'Role', options: [{ value: 'admin', label: 'Admin' }] }),
    h(S.Calendar, { 'aria-label': 'Date' }),
    h(S.DataTable, { columns: [{ id: 'n', header: 'Name', accessor: 'n' }], data: [{ id: '1', n: 'Priya' }], getRowId: (r) => r.id, caption: 'Users' }),
    h(S.Accordion, { type: 'single' }, h(S.AccordionItem, { value: 'x' }, h(S.AccordionTrigger, null, 'Q'), h(S.AccordionContent, null, 'A'))),
    h(S.PinInput, { 'aria-label': 'Code' }),
    h(S.Badge, { tone: 'success' }, 'Live'),
  ),
);
for (const needle of ['st-button', 'st-input', 'Priya', 'st-badge']) if (!html.includes(needle)) throw new Error('missing ' + needle);
console.log('server-rendered ' + html.length + ' characters with React ' + React.version);
`,
  );
  console.log(run('node ssr.mjs').trim());

  cpSync(join(root, 'tests', 'consumer', 'index.tsx'), join(dir, 'index.tsx'));
  run(
    'npx tsc --noEmit --jsx react-jsx --target es2022 --lib es2022,dom,dom.iterable --moduleResolution bundler --module esnext --strict index.tsx',
  );
  console.log('built declarations type-check against @types/react 18 with full lib checking');
  console.log('✓ React 18 compatibility');
} catch (e) {
  console.error(e.stdout || e.stderr || e.message);
  process.exitCode = 1;
} finally {
  rmSync(dir, { recursive: true, force: true });
}

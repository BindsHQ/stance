import examples from '../generated/examples.json';
import type { ComponentDoc } from './docs-types';
import { categoryLabels, site } from './site';

const sources = examples as Record<string, Record<string, string>>;
const cell = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');

/** A self-contained Markdown reference for one component, for LLMs and answer engines. */
export function componentMarkdown(doc: ComponentDoc): string {
  const url = `${site.url}/components/${doc.slug}`;
  const out: string[] = [
    `# ${doc.name}`,
    '',
    `> ${doc.summary}`,
    '',
    `Category: ${categoryLabels[doc.category] ?? doc.category} · Status: ${doc.status} · Package: @bindshq/stance-react@${site.version} · Docs: ${url}`,
    '',
    doc.description,
    '',
    '## Import',
    '',
    '```tsx',
    `import { ${doc.imports.join(', ')} } from '@bindshq/stance-react';`,
    '```',
    '',
    'Styles are imported once per app: `@bindshq/stance-tokens/css` and `@bindshq/stance-react/styles.css`.',
    '',
  ];
  const ex = sources[doc.slug] ?? {};
  if (doc.examples.length) {
    out.push('## Examples', '');
    for (const e of doc.examples) {
      if (!ex[e.name]) continue;
      out.push(`### ${e.title}`, '');
      if (e.description) out.push(e.description, '');
      out.push('```tsx', ex[e.name]!, '```', '');
    }
  }
  if (doc.props.length) {
    out.push(
      '## API reference',
      '',
      '| Component | Prop | Type | Default | Description |',
      '| --- | --- | --- | --- | --- |',
    );
    for (const p of doc.props)
      out.push(
        `| ${p.component} | \`${cell(p.name)}\`${p.required ? ' (required)' : ''} | \`${cell(p.type)}\` | ${p.default ? `\`${cell(p.default)}\`` : '—'} | ${cell(p.description)} |`,
      );
    out.push('');
  }
  out.push('## Accessibility', '', ...doc.accessibility.map((a) => `- ${a}`), '');
  if (doc.keyboard?.length) {
    out.push(
      '## Keyboard',
      '',
      '| Keys | Action |',
      '| --- | --- |',
      ...doc.keyboard.map(
        (k) => `| ${k.keys.map((x) => `\`${x}\``).join(' ')} | ${cell(k.description)} |`,
      ),
      '',
    );
  }
  if (doc.guidelines) {
    out.push(
      '## Guidelines',
      '',
      '**Do**',
      '',
      ...doc.guidelines.do.map((g) => `- ${g}`),
      '',
      '**Don’t**',
      '',
      ...doc.guidelines.dont.map((g) => `- ${g}`),
      '',
    );
  }
  if (doc.related?.length)
    out.push('## Related', '', ...doc.related.map((r) => `- ${site.url}/components/${r}`), '');
  return out.join('\n');
}

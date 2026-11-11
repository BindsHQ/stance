import { faq } from '../../content/faq';
import docsData from '../../generated/docs-data.json';
import type { ComponentDoc } from '../../lib/docs-types';
import { componentMarkdown } from '../../lib/markdown';
import { components } from '../../lib/routes';
import { site } from '../../lib/site';

export const dynamic = 'force-static';

/** Every component reference in one Markdown file, for retrieval by AI assistants. */
export function GET() {
  const data = docsData as unknown as Record<string, ComponentDoc>;
  const docs = components.map((c) => componentMarkdown(data[c.slug]!));
  const body = [
    `# Stance v${site.version} — complete component reference`,
    '',
    `Source: ${site.url} · Licence: MIT · Packages: @bindshq/stance-tokens, @bindshq/stance-react`,
    '',
    '## Frequently asked questions',
    '',
    ...faq.flatMap((f) => [`### ${f.q}`, '', f.a, '']),
    // Demote each component document by one heading level so the file has a single H1.
    ...docs.map((d) => d.replace(/^(#{1,5}) /gm, '#$1 ')),
  ].join('\n');
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}

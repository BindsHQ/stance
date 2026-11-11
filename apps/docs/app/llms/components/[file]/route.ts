import docsData from '../../../../generated/docs-data.json';
import type { ComponentDoc } from '../../../../lib/docs-types';
import { componentMarkdown } from '../../../../lib/markdown';
import { components } from '../../../../lib/routes';

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return components.map((c) => ({ file: `${c.slug}.md` }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const slug = file.replace(/\.md$/, '');
  const doc = (docsData as unknown as Record<string, ComponentDoc>)[slug];
  if (!doc) return new Response('Not found', { status: 404 });
  return new Response(componentMarkdown(doc), {
    headers: { 'content-type': 'text/markdown; charset=utf-8' },
  });
}

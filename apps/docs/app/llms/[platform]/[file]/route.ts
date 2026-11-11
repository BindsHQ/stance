import {
  counterparts,
  findNative,
  native,
  nativePath,
  nativePlatforms,
  nativeSlug,
  platformLabels,
  type NativePlatform,
} from '../../../../lib/native';
import { categoryLabels, site } from '../../../../lib/site';

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return nativePlatforms.flatMap((platform) =>
    native[platform].map((c) => ({ platform, file: `${nativeSlug(c)}.md` })),
  );
}

/** Markdown reference of one native component, for AI assistants and answer engines. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ platform: string; file: string }> },
) {
  const { platform, file } = await params;
  const p = platform as NativePlatform;
  const c = findNative(p, file.replace(/\.md$/, ''));
  if (!c) return new Response('Not found', { status: 404 });
  const label = platformLabels[p];
  const { web, other, otherMatches } = counterparts(p, c);
  const lines = [
    `# ${c.name}`,
    '',
    `> ${c.summary}`,
    '',
    `Platform: ${label.name} (${label.ui}) · Category: ${categoryLabels[c.category] ?? c.category} · Status: ${c.status} · Docs: ${site.url}${nativePath(p, c)}`,
    '',
    c.wrapsNative ? `Builds on \`${c.wrapsNative}\`.` : 'A custom Stance component.',
    '',
    '## Usage',
    '',
    '```' + label.language,
    c.example,
    '```',
    '',
    ...(c.accessibility.length
      ? ['## Accessibility', '', ...c.accessibility.map((a) => `- ${a}`), '']
      : []),
    ...(web || otherMatches.length
      ? [
          '## On other platforms',
          '',
          ...(web ? [`- Web: ${site.url}/components/${web}`] : []),
          ...otherMatches.map(
            (o) => `- ${platformLabels[other].name}: ${site.url}${nativePath(other, o)}`,
          ),
          '',
        ]
      : []),
  ];
  return new Response(lines.join('\n'), {
    headers: { 'content-type': 'text/markdown; charset=utf-8' },
  });
}

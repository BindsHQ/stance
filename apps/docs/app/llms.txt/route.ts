import { faq } from '../../content/faq';
import { pages } from '../../content/pages';
import { components } from '../../lib/routes';
import { categoryLabels, categoryOrder, site } from '../../lib/site';
import { native, nativePlatforms, nativeSlug, platformLabels } from '../../lib/native';

export const dynamic = 'force-static';

/** llms.txt (https://llmstxt.org): a curated map of Stance for language models and AI assistants. */
export function GET() {
  const section = (s: string) =>
    pages
      .filter((p) => p.section === s)
      .map((p) => `- [${p.title}](${site.url}/${p.section}/${p.slug}): ${p.description}`);
  const lines = [
    '# Stance',
    '',
    `> Stance is the official open-source (Apache-2.0) design system by Binds: design tokens built from the brand colours ivory #FCF6EB and indigo #140C2E, light/dark/high-contrast themes, and ${components.length} accessible, dependency-free React components for React 18 and 19. Packages: @bindshq/stance-tokens and @bindshq/stance-react (v${site.version}).`,
    '',
    'Install with `npm install @bindshq/stance-tokens @bindshq/stance-react`, import `@bindshq/stance-tokens/css` and `@bindshq/stance-react/styles.css` once, and wrap the app in `<ThemeProvider>`. Components target WCAG 2.2 AA and follow WAI-ARIA keyboard patterns.',
    '',
    '## Getting started',
    ...section('docs'),
    '',
    '## Foundations',
    ...section('foundations'),
    '',
    '## Components',
    ...categoryOrder.flatMap((cat) =>
      components
        .filter((c) => c.category === cat)
        .map(
          (c) =>
            `- [${c.name}](${site.url}/llms/components/${c.slug}.md): ${c.summary} (${categoryLabels[cat]})`,
        ),
    ),
    '',
    ...nativePlatforms.flatMap((p) => [
      `## ${platformLabels[p].name} components (${platformLabels[p].ui})`,
      ...native[p].map(
        (c) => `- [${c.name}](${site.url}/llms/${p}/${nativeSlug(c)}.md): ${c.summary}`,
      ),
      '',
    ]),
    '## Guidelines',
    ...section('guidelines'),
    '',
    '## FAQ',
    ...faq.map((f) => `- ${f.q} ${f.a}`),
    '',
    '## Optional',
    ...section('resources'),
    `- [Full documentation in one file](${site.url}/llms-full.txt): every component reference concatenated.`,
    `- [Source code](${site.github}): Apache-2.0 licensed. The Binds and Stance names and logos are trademarks of Binds and are not licensed. Components, tokens and default themes are free to use as they are; products built with Stance use their own name and must not imply endorsement by Binds.`,
    '',
  ];
  return new Response(lines.join('\n'), {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}

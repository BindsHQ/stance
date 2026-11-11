import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ComponentDocPage } from '../../../../components/component-doc-page';
import { JsonLd } from '../../../../components/json-ld';
import { components } from '../../../../lib/routes';
import { absolute, articleLd, breadcrumbLd, pageMetadata } from '../../../../lib/seo';
import { categoryLabels } from '../../../../lib/site';

export const dynamicParams = false;

export function generateStaticParams() {
  return components.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = components.find((x) => x.slug === slug);
  return c ? pageMetadata(`/components/${slug}`) : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = components.find((x) => x.slug === slug);
  if (!c) notFound();
  const path = `/components/${slug}`;
  return (
    <>
      <JsonLd
        graph={[
          breadcrumbLd(path),
          articleLd(path, {
            articleSection: categoryLabels[c.category] ?? c.category,
            keywords: [c.name, 'React', 'component', 'accessible', 'Stance', 'Binds'],
            encoding: {
              '@type': 'MediaObject',
              encodingFormat: 'text/markdown',
              contentUrl: absolute(`/llms${path}.md`),
            },
          }),
        ]}
      />
      <Suspense fallback={<div className="docs-article" aria-busy="true" />}>
        <ComponentDocPage slug={slug} />
      </Suspense>
    </>
  );
}

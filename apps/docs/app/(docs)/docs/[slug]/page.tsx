import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { pages } from '../../../../content/pages';
import { JsonLd } from '../../../../components/json-ld';
import { articleLd, breadcrumbLd, pageMetadata } from '../../../../lib/seo';
import type { GuidePage } from '../../../../lib/pages-types';

const eyebrows: Record<GuidePage['section'], string> = {
  docs: 'Getting started',
  foundations: 'Foundations',
  guidelines: 'Guidelines',
  resources: 'Resources',
};

const section: GuidePage['section'] = 'docs';
export const dynamicParams = false;

export function generateStaticParams() {
  return pages.filter((p) => p.section === section).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = pages.find((p) => p.section === section && p.slug === slug);
  return page ? pageMetadata(`/${section}/${slug}`) : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = pages.find((p) => p.section === section && p.slug === slug);
  if (!page) notFound();
  const { Component } = page;
  return (
    <article className="docs-article">
      <JsonLd graph={[breadcrumbLd(`/${section}/${slug}`), articleLd(`/${section}/${slug}`)]} />
      <header className="docs-article__header">
        <p className="docs-eyebrow">{eyebrows[section]}</p>
        <h1>{page.title}</h1>
        <p className="docs-lede">{page.description}</p>
      </header>
      <div className="prose">
        <Component />
      </div>
    </article>
  );
}

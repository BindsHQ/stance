import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import meta from '../../../../generated/meta.json';
import type { ComponentMeta } from '../../../../lib/registry-types';
import { ComponentDocPage } from '../../../../components/component-doc-page';

const components = meta as ComponentMeta[];

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
  return c ? { title: c.name, description: c.summary } : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!components.some((c) => c.slug === slug)) notFound();
  return (
    <Suspense fallback={<div className="docs-article" aria-busy="true" />}>
      <ComponentDocPage slug={slug} />
    </Suspense>
  );
}

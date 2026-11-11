import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NativeComponentPage } from '../../../../../components/native-component-page';
import { findNative, native, nativeSlug } from '../../../../../lib/native';
import { pageMetadata } from '../../../../../lib/seo';

export const dynamicParams = false;

export function generateStaticParams() {
  return native.ios.map((c) => ({ slug: nativeSlug(c) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return findNative('ios', slug) ? pageMetadata(`/ios/components/${slug}`) : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const component = findNative('ios', slug);
  if (!component) notFound();
  return <NativeComponentPage platform="ios" component={component} />;
}

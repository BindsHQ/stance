import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NativeComponentPage } from '../../../../../components/native-component-page';
import { findNative, native, nativeSlug } from '../../../../../lib/native';
import { pageMetadata } from '../../../../../lib/seo';

export const dynamicParams = false;

export function generateStaticParams() {
  return native.android.map((c) => ({ slug: nativeSlug(c) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return findNative('android', slug) ? pageMetadata(`/android/components/${slug}`) : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const component = findNative('android', slug);
  if (!component) notFound();
  return <NativeComponentPage platform="android" component={component} />;
}

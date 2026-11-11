import type { Metadata } from 'next';
import { NativeIndexPage } from '../../../../components/native-index-page';
import { pageMetadata } from '../../../../lib/seo';

export const metadata: Metadata = pageMetadata('/android/components');

export default function Page() {
  return <NativeIndexPage platform="android" />;
}

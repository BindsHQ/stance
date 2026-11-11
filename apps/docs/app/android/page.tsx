import type { Metadata } from 'next';
import { PlatformLandingPage } from '../../components/platform-landing';
import { platformLandings } from '../../content/platforms';
import { pageMetadata } from '../../lib/seo';

const data = platformLandings.android;

export const metadata: Metadata = {
  ...pageMetadata(data.path),
  keywords: data.keywords,
};

export default function Page() {
  return <PlatformLandingPage data={data} />;
}

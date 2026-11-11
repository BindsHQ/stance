import type { MetadataRoute } from 'next';
import { site } from '../lib/site';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Stance — The Binds Design System',
    short_name: 'Stance',
    description: site.description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#FCF6EB',
    theme_color: '#140C2E',
    lang: 'en-GB',
    categories: ['developer', 'design', 'productivity'],
    icons: [
      { src: '/icon.svg', type: 'image/svg+xml', sizes: 'any' },
      { src: '/icon-192.png', type: 'image/png', sizes: '192x192', purpose: 'any' },
      { src: '/icon-512.png', type: 'image/png', sizes: '512x512', purpose: 'any' },
      { src: '/icon-maskable-512.png', type: 'image/png', sizes: '512x512', purpose: 'maskable' },
    ],
  };
}

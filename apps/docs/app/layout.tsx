import type { Metadata, Viewport } from 'next';
import { DM_Sans } from 'next/font/google';
import { ThemeScript } from '@bindshq/stance-react';
import '@bindshq/stance-tokens/css';
import '@bindshq/stance-react/styles.css';
import '@bindshq/stance-react/global.css';
import './site.css';
import { Providers } from '../components/providers';
import { SiteHeader } from '../components/site-header';
import { SiteFooter } from '../components/site-footer';
import { site } from '../lib/site';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.tagline}`, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: 'Binds', url: site.binds }],
  creator: 'Binds',
  publisher: 'Binds',
  category: 'technology',
  keywords: [
    'Stance',
    'Binds',
    'design system',
    'React components',
    'design tokens',
    'accessible components',
    'WCAG 2.2',
    'dark mode',
    'high contrast',
    'Tailwind preset',
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  formatDetection: { telephone: false, email: false, address: false },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '48x48' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: { title: site.name, statusBarStyle: 'default' },
  other: { 'msapplication-TileColor': '#140C2E' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FCF6EB' },
    { media: '(prefers-color-scheme: dark)', color: '#140C2E' },
  ],
  colorScheme: 'light dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-GB"
      className={dmSans.variable}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <head>
        <ThemeScript />
      </head>
      <body>
        <Providers>
          <a className="site-skip" href="#main">
            Skip to content
          </a>
          <SiteHeader />
          {children}
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}

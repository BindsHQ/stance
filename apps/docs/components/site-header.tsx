'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeSwitcher } from '@bindshq/stance-react';
import { site } from '../lib/site';
import { StanceWordmark } from './logo';
import { SiteSearch } from './site-search';
import { MobileNav } from './mobile-nav';

const links = [
  { href: '/docs/introduction', label: 'Docs', match: '/docs' },
  { href: '/components', label: 'Components', match: '/components' },
  { href: '/foundations/colors', label: 'Foundations', match: '/foundations' },
  { href: '/guidelines/principles', label: 'Guidelines', match: '/guidelines' },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <MobileNav />
        <Link href="/" className="site-header__brand" aria-label="Stance home">
          <StanceWordmark />
        </Link>
        <nav aria-label="Primary" className="site-header__nav">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={pathname.startsWith(l.match) ? 'page' : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="site-header__actions">
          <SiteSearch />
          <span className="site-header__version">v{site.version}</span>
          <a className="site-header__icon-link" href={site.github} aria-label="Stance on GitHub">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              aria-hidden="true"
              focusable="false"
              fill="currentColor"
            >
              <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z" />
            </svg>
          </a>
          <ThemeSwitcher size="sm" className="site-header__theme" />
        </div>
      </div>
    </header>
  );
}

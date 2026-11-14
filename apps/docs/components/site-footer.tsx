import Link from 'next/link';
import { site } from '../lib/site';
import { StanceLogo } from './logo';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <StanceLogo height={24} title="Stance" />
          <p>
            Stance. {site.tagline}. Open source under the Apache License 2.0. ©{' '}
            {new Date().getFullYear()} Binds.
          </p>
        </div>
        <nav aria-label="Footer" className="site-footer__nav">
          <div>
            <h2>Documentation</h2>
            <Link href="/docs/introduction">Introduction</Link>
            <Link href="/docs/installation">Installation</Link>
            <Link href="/components">Components</Link>
            <Link href="/foundations/colors">Foundations</Link>
          </div>
          <div>
            <h2>Project</h2>
            <a href={site.github}>GitHub</a>
            <Link href="/resources/releases">Releases</Link>
            <Link href="/resources/changelog">Changelog</Link>
            <Link href="/resources/contributing">Contributing</Link>
          </div>
          <div>
            <h2>Binds</h2>
            <a href={site.binds}>binds.si</a>
            <Link href="/resources/license">License</Link>
            <Link href="/resources/trademarks">Trademarks</Link>
          </div>
        </nav>
      </div>
    </footer>
  );
}

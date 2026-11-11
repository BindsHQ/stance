import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main id="main" className="landing" tabIndex={-1}>
      <section className="hero" style={{ gridTemplateColumns: '1fr' }}>
        <div>
          <p className="hero__eyebrow">404</p>
          <h1 className="hero__title">This page has no stance.</h1>
          <p className="hero__lede">The page you are looking for does not exist or has moved.</p>
          <div className="hero__actions">
            <Link href="/" className="st-button" data-variant="primary" data-size="lg">
              Home
            </Link>
            <Link href="/components" className="st-button" data-variant="outline" data-size="lg">
              Components
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

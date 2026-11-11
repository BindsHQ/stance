import type { Metadata } from 'next';
import Link from 'next/link';
import { brand, ink } from '@bindshq/stance-tokens';
import { faq } from '../content/faq';
import { InstallSnippet } from '../components/install-snippet';
import { JsonLd } from '../components/json-ld';
import { LandingBento } from '../components/landing-bento';
import { LandingFaq } from '../components/landing-faq';
import { LandingShowcase } from '../components/landing-showcase';
import { PlatformShowcase } from '../components/platform-showcase';
import { StanceMark } from '../components/logo';
import { ThemeTriptych } from '../components/preview';
import { components } from '../lib/routes';
import { faqLd, organizationLd, pageMetadata, softwareLd, websiteLd } from '../lib/seo';
import { categoryLabels, categoryOrder, site } from '../lib/site';

export const metadata: Metadata = pageMetadata('/');

export default function Home() {
  const categories = categoryOrder
    .map((c) => ({
      id: c,
      label: categoryLabels[c]!,
      count: components.filter((x) => x.category === c).length,
    }))
    .filter((c) => c.count > 0);
  return (
    <main id="main" className="landing" tabIndex={-1}>
      <JsonLd graph={[organizationLd, websiteLd(), softwareLd(components.length), faqLd(faq)]} />

      <section className="hero hero--full" aria-labelledby="hero-title">
        <span className="hero__mark" aria-hidden="true">
          <StanceMark size={44} />
        </span>
        <h1 id="hero-title" className="hero__title">
          Less to decide.
          <br />
          <span className="hero__muted">More to make.</span>
        </h1>
        <p className="hero__lede">
          Everything your product needs to look right and work for everyone. On the web, iPhone and
          Android.
        </p>
        <div className="hero__actions">
          <Link
            href="/docs/introduction"
            className="st-button"
            data-variant="primary"
            data-size="lg"
            data-shape="pill"
          >
            Get started
          </Link>
          <Link
            href="/components"
            className="st-button"
            data-variant="outline"
            data-size="lg"
            data-shape="pill"
          >
            Browse components
          </Link>
        </div>
        <InstallSnippet />
        <ul className="hero__facts" aria-label="At a glance">
          <li>Free and open source</li>
          <li>WCAG 2.2 AA</li>
          <li>{components.length} components</li>
          <li>Light, dark, high contrast</li>
        </ul>
      </section>

      <section className="band" aria-labelledby="live-title">
        <header className="band__head">
          <h2 id="live-title" className="section-title">
            Go ahead, try it.
          </h2>
          <p className="section-lede">Every tile is live. Type, drag, sign, sort.</p>
        </header>
        <LandingBento />
      </section>

      <section className="band" aria-labelledby="modes-title">
        <header className="band__head">
          <h2 id="modes-title" className="section-title">
            Light. Dark. High contrast.
          </h2>
          <p className="section-lede">Your users choose. Every screen follows.</p>
        </header>
        <ThemeTriptych minHeight={340}>
          <div className="triptych-showcase">
            <LandingShowcase compact />
          </div>
        </ThemeTriptych>
      </section>

      <section className="band band--split" aria-labelledby="tokens-title">
        <header className="band__head">
          <h2 id="tokens-title" className="section-title">
            Calm by design.
          </h2>
          <p className="section-lede">Two colours, ivory and indigo, and every shade between.</p>
          <Link href="/foundations/colors" className="text-link">
            Explore colour
          </Link>
        </header>
        <div className="tokens-visual">
          <div className="tokens-visual__pair">
            <div style={{ background: brand.ivory, color: brand.indigo }}>
              <strong>Ivory</strong>
              <code>{brand.ivory}</code>
            </div>
            <div style={{ background: brand.indigo, color: brand.ivory }}>
              <strong>Indigo</strong>
              <code>{brand.indigo}</code>
            </div>
          </div>
          <div
            className="tokens-visual__ramp"
            role="img"
            aria-label="The ink scale: fifteen steps from ivory to indigo"
          >
            {Object.entries(ink).map(([k, v]) => (
              <span key={k} style={{ background: v }} />
            ))}
          </div>
        </div>
      </section>

      <section className="band" aria-labelledby="platforms-title">
        <header className="band__head">
          <h2 id="platforms-title" className="section-title">
            Native everywhere.
          </h2>
          <p className="section-lede">Web, iOS and Android, each in its own language.</p>
        </header>
        <PlatformShowcase />
      </section>

      <section className="band" aria-labelledby="components-title">
        <header className="band__head band__head--row">
          <h2 id="components-title" className="section-title">
            Everything you reach for.
          </h2>
          <Link
            href="/components"
            className="st-button"
            data-variant="outline"
            data-size="md"
            data-shape="pill"
          >
            Browse all
          </Link>
        </header>
        <ul className="category-chips">
          {categories.map((c) => (
            <li key={c.id}>
              <Link href={`/components#cat-${c.id}`}>
                {c.label} <span>{c.count}</span>
              </Link>
            </li>
          ))}
        </ul>
        <dl className="stats">
          <div>
            <dt>Runtime dependencies</dt>
            <dd>0</dd>
          </div>
          <div>
            <dt>Themes tested per component</dt>
            <dd>3</dd>
          </div>
          <div>
            <dt>Accessibility target</dt>
            <dd>AA</dd>
          </div>
          <div>
            <dt>Licence</dt>
            <dd>MIT</dd>
          </div>
        </dl>
      </section>

      <section className="band band--split band--faq" aria-labelledby="faq-title">
        <header className="band__head">
          <h2 id="faq-title" className="section-title">
            Questions.
          </h2>
        </header>
        <LandingFaq items={faq} />
      </section>

      <section className="band band--cta" aria-labelledby="release-title">
        <h2 id="release-title" className="section-title">
          Free to use.
          <br />
          <span className="hero__muted">Yours to shape.</span>
        </h2>
        <div className="hero__actions">
          <a
            href={site.github}
            className="st-button"
            data-variant="primary"
            data-size="lg"
            data-shape="pill"
          >
            View on GitHub
          </a>
          <Link
            href="/resources/releases"
            className="st-button"
            data-variant="outline"
            data-size="lg"
            data-shape="pill"
          >
            Release {site.version}
          </Link>
        </div>
      </section>
    </main>
  );
}

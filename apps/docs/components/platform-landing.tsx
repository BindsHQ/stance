import Link from 'next/link';
import { Icon } from '@bindshq/stance-react';
import type { PlatformLanding } from '../content/platforms';
import { native, platformLabels } from '../lib/native';
import { categoryLabels, categoryOrder } from '../lib/site';
import { Code } from './code';
import { JsonLd } from './json-ld';
import { LandingFaq } from './landing-faq';
import { NativeImage, hasNativeImage } from './native-image';
import { absolute, breadcrumbLd, faqLd, organizationLd } from '../lib/seo';
import { site } from '../lib/site';

/** A dedicated landing page for one native platform. */
export function PlatformLandingPage({ data }: { data: PlatformLanding }) {
  const items = native[data.platform];
  const label = platformLabels[data.platform];
  const groups = categoryOrder
    .map((c) => ({
      id: c,
      label: categoryLabels[c] ?? c,
      count: items.filter((x) => x.category === c).length,
    }))
    .filter((g) => g.count > 0);
  const wrapsNative = items.filter((c) => c.wrapsNative).length;
  const hasTablet = hasNativeImage(data.platform, data.tablet);

  return (
    <main id="main" className="landing platform-landing" tabIndex={-1}>
      <JsonLd
        graph={[
          organizationLd,
          breadcrumbLd(data.path),
          {
            '@type': 'SoftwareSourceCode',
            '@id': `${absolute(data.path)}#software`,
            name: data.eyebrow,
            description: data.seoDescription,
            url: absolute(data.path),
            codeRepository: `${site.github}/tree/main/platforms/${data.platform}`,
            programmingLanguage: data.platform === 'ios' ? 'Swift' : 'Kotlin',
            runtimePlatform: data.platform === 'ios' ? 'iOS, iPadOS' : 'Android',
            license: 'https://opensource.org/licenses/MIT',
            isPartOf: { '@id': `${site.url}/#software` },
            author: { '@id': organizationLd['@id'] },
            isAccessibleForFree: true,
          },
          faqLd(data.faq),
        ]}
      />

      <section className="hero phero" aria-labelledby="platform-title">
        <p className="hero__eyebrow">{data.eyebrow}</p>
        <h1 id="platform-title" className="hero__title">
          {data.title[0]}
          <br />
          <span className="hero__muted">{data.title[1]}</span>
        </h1>
        <p className="hero__lede">{data.lede}</p>
        <div className="hero__actions">
          <Link
            href={data.docs.installation}
            className="st-button"
            data-variant="primary"
            data-size="lg"
            data-shape="pill"
          >
            Get started
          </Link>
          <Link
            href={`/${data.platform}/components`}
            className="st-button"
            data-variant="outline"
            data-size="lg"
            data-shape="pill"
          >
            Browse components
          </Link>
        </div>
        <div className="phero__stage">
          {data.floats.map((name, i) => (
            <span key={name} className={`phero__float phero__float--${i + 1}`}>
              <NativeImage platform={data.platform} name={name} alt="" />
            </span>
          ))}
          <span
            className={`device device--phone device--${data.device === 'android' ? 'android' : 'ios'} phero__device`}
          >
            {data.device === 'android' && <span className="device__camera" aria-hidden="true" />}
            <NativeImage
              platform={data.platform}
              name="showcase-sample"
              alt={`The Stance showcase app running on ${label.name}`}
              className="device__screen"
              priority
            />
          </span>
        </div>
      </section>

      <section className="band" aria-labelledby="features-title">
        <header className="band__head">
          <h2 id="features-title" className="section-title">
            Made for the platform.
          </h2>
        </header>
        <ul className="feature-grid">
          {data.features.map((f) => (
            <li key={f.title}>
              <span className="feature-grid__icon" aria-hidden="true">
                <Icon name={f.icon} size={20} />
              </span>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {hasTablet && (
        <section className="band" aria-labelledby="devices-title">
          <header className="band__head band__head--center">
            <h2 id="devices-title" className="section-title">
              {data.platform === 'ios'
                ? 'iPhone. iPad. Light and dark.'
                : 'Phone. Tablet. Light and dark.'}
            </h2>
          </header>
          <div className="platform-stage">
            <span className="device device--tablet">
              <NativeImage
                platform={data.platform}
                name={data.tablet}
                alt={`The Stance showcase app on a ${data.platform === 'ios' ? 'iPad' : 'tablet'}`}
                className="device__screen"
                theme="light"
              />
            </span>
            <span
              className={`device device--phone device--${data.device === 'android' ? 'android' : 'ios'}`}
            >
              {data.device === 'android' && <span className="device__camera" aria-hidden="true" />}
              <NativeImage
                platform={data.platform}
                name="showcase-sample"
                alt={`The Stance showcase app on ${label.name} in dark appearance`}
                className="device__screen"
                theme="dark"
              />
            </span>
          </div>
        </section>
      )}

      <section className="band band--split" aria-labelledby="start-title">
        <header className="band__head">
          <h2 id="start-title" className="section-title">
            Up and running in a minute.
          </h2>
          <p className="section-lede">{data.requirements}</p>
          <Link href={data.docs.installation} className="text-link">
            Installation guide
          </Link>
        </header>
        <Code
          code={data.install.code}
          language={data.install.language}
          title={data.install.title}
        />
      </section>

      <section className="band band--split" aria-labelledby="code-title">
        <header className="band__head">
          <h2 id="code-title" className="section-title">
            Reads like {label.ui}.
          </h2>
          <p className="section-lede">
            Small, composable APIs that follow the conventions you already use.
          </p>
          <Link href={data.docs.theming} className="text-link">
            Theming
          </Link>
          {'  '}
          <Link href={data.docs.extra.href} className="text-link platform-link-gap">
            {data.docs.extra.label}
          </Link>
        </header>
        <Code code={data.example.code} language={data.example.language} />
      </section>

      <section className="band" aria-labelledby="catalogue-title">
        <header className="band__head band__head--row">
          <div>
            <h2 id="catalogue-title" className="section-title">
              {items.length} components.
            </h2>
            <p className="section-lede">
              {wrapsNative} build on system controls. The rest fill the gaps the platform leaves.
            </p>
          </div>
          <Link
            href={`/${data.platform}/components`}
            className="st-button"
            data-variant="outline"
            data-size="md"
            data-shape="pill"
          >
            See all
          </Link>
        </header>
        <ul className="category-chips">
          {groups.map((g) => (
            <li key={g.id}>
              <Link href={`/${data.platform}/components#native-${g.id}`}>
                {g.label} <span>{g.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="band band--split band--faq" aria-labelledby="platform-faq-title">
        <header className="band__head">
          <h2 id="platform-faq-title" className="section-title">
            Questions.
          </h2>
        </header>
        <LandingFaq items={data.faq} />
      </section>

      <section className="band band--cta" aria-labelledby="platform-cta-title">
        <h2 id="platform-cta-title" className="section-title">
          Start with one screen.
          <br />
          <span className="hero__muted">Grow from there.</span>
        </h2>
        <div className="hero__actions">
          <Link
            href={data.docs.installation}
            className="st-button"
            data-variant="primary"
            data-size="lg"
            data-shape="pill"
          >
            Get started
          </Link>
          <a
            href={`${site.github}/tree/main/platforms/${data.platform}`}
            className="st-button"
            data-variant="outline"
            data-size="lg"
            data-shape="pill"
          >
            View source
          </a>
        </div>
      </section>
    </main>
  );
}

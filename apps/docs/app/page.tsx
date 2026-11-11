import Link from 'next/link';
import { brand, contrastRatio, ink } from '@bindshq/stance-tokens';
import contrast from '@bindshq/stance-tokens/contrast-report.json';
import meta from '../generated/meta.json';
import { InstallSnippet } from '../components/install-snippet';
import { LandingShowcase } from '../components/landing-showcase';
import { ThemeTriptych } from '../components/preview';
import { Code } from '../components/code';
import { categoryLabels, categoryOrder, site } from '../lib/site';

const components = meta as { slug: string; name: string; category: string }[];
const pairs = contrast as { pass: boolean }[];
const passing = pairs.filter((p) => p.pass).length;

export default function Home() {
  const byCategory = categoryOrder
    .map((c) => ({
      id: c,
      label: categoryLabels[c]!,
      items: components.filter((x) => x.category === c),
    }))
    .filter((g) => g.items.length);
  return (
    <main id="main" className="landing" tabIndex={-1}>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__copy">
          <p className="hero__eyebrow">Stance — The Binds Design System</p>
          <h1 id="hero-title" className="hero__title">
            One system.
            <br />
            Consistent foundations.
            <br />
            <span className="hero__muted">Distinct products.</span>
          </h1>
          <p className="hero__lede">
            Design tokens, three appearance modes and {components.length} accessible React
            components, built from the two colours that define Binds. Open source, dependency-free
            and ready for production.
          </p>
          <div className="hero__actions">
            <Link
              href="/docs/introduction"
              className="st-button"
              data-variant="primary"
              data-size="lg"
            >
              Get started
            </Link>
            <Link href="/components" className="st-button" data-variant="outline" data-size="lg">
              Browse components
            </Link>
          </div>
          <InstallSnippet />
        </div>
        <div
          className="hero__stage"
          aria-label="Live example built with Stance components"
          role="region"
        >
          <LandingShowcase />
        </div>
      </section>

      <section className="band" aria-labelledby="modes-title">
        <div className="band__intro">
          <p className="section-eyebrow">01 — Appearance</p>
          <h2 id="modes-title" className="section-title">
            Three modes. Every component.
          </h2>
          <p className="section-lede">
            Light, dark and high contrast are complete themes, not an inverted palette. Stance
            follows the operating system, remembers each person’s choice and paints the right theme
            before the first frame.
          </p>
        </div>
        <ThemeTriptych minHeight={360}>
          <div className="triptych-showcase">
            <LandingShowcase compact />
          </div>
        </ThemeTriptych>
      </section>

      <section className="band band--split" aria-labelledby="tokens-title">
        <div className="band__intro">
          <p className="section-eyebrow">02 — Foundations</p>
          <h2 id="tokens-title" className="section-title">
            Two colours. Nothing borrowed.
          </h2>
          <p className="section-lede">
            Binds Ivory and Binds Indigo are the only brand colours. Every neutral in Stance is
            interpolated between them in OKLab, so even the greys belong to Binds.
          </p>
          <Link href="/foundations/colors" className="text-link">
            Explore colour tokens →
          </Link>
        </div>
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
              <span key={k} style={{ background: v }} title={`ink-${k} ${v}`} />
            ))}
          </div>
          <p className="docs-muted tokens-visual__caption">
            {contrastRatio(brand.ivory, brand.indigo).toFixed(1)}:1 contrast between the two brand
            colours
          </p>
        </div>
      </section>

      <section className="band" aria-labelledby="components-title">
        <div className="band__intro">
          <p className="section-eyebrow">03 — Components</p>
          <h2 id="components-title" className="section-title">
            {components.length} components. Each one complete.
          </h2>
          <p className="section-lede">
            A deliberately curated library. Every component has a clear purpose, typed props,
            keyboard support, tests in all three themes and documentation with live examples.
          </p>
        </div>
        <div className="category-grid">
          {byCategory.map((g) => (
            <div key={g.id} className="category-grid__item">
              <h3>
                {g.label} <span className="category-grid__count">{g.items.length}</span>
              </h3>
              <ul>
                {g.items.slice(0, 8).map((c) => (
                  <li key={c.slug}>
                    <Link href={`/components/${c.slug}`}>{c.name}</Link>
                  </li>
                ))}
                {g.items.length > 8 && (
                  <li>
                    <Link href="/components" className="docs-muted">
                      +{g.items.length - 8} more
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="band band--split" aria-labelledby="dx-title">
        <div className="band__intro">
          <p className="section-eyebrow">04 — Developer experience</p>
          <h2 id="dx-title" className="section-title">
            Own the stack.
          </h2>
          <ul className="feature-list">
            <li>
              <strong>Zero runtime dependencies.</strong> Focus management, positioning, dates and
              virtualisation are built into Stance.
            </li>
            <li>
              <strong>Plain CSS on tokens.</strong> Works with or without Tailwind, with presets for
              v3 and v4.
            </li>
            <li>
              <strong>Typed, tree-shakeable ESM.</strong> React 18 and 19, server-component
              friendly.
            </li>
            <li>
              <strong>Composable APIs.</strong> Compound parts, <code>asChild</code>, controlled or
              uncontrolled state.
            </li>
          </ul>
        </div>
        <Code
          title="signature-settings.tsx"
          code={`import { FormField, Input, Switch, Button } from '@bindshq/stance-react';

export function SignatureSettings() {
  return (
    <form>
      <FormField label="Template name" required>
        <Input name="name" defaultValue="Sales team" />
      </FormField>
      <Switch name="autoApply" label="Apply to new members" />
      <Button type="submit">Save template</Button>
    </form>
  );
}`}
        />
      </section>

      <section className="band" aria-labelledby="a11y-title">
        <div className="band__intro">
          <p className="section-eyebrow">05 — Accessibility</p>
          <h2 id="a11y-title" className="section-title">
            WCAG 2.2 AA is the floor.
          </h2>
        </div>
        <dl className="stats">
          <div>
            <dt>Contrast pairs verified</dt>
            <dd>
              {passing}/{pairs.length}
            </dd>
          </div>
          <div>
            <dt>Themes tested with axe-core</dt>
            <dd>3</dd>
          </div>
          <div>
            <dt>Minimum target size</dt>
            <dd>24px</dd>
          </div>
          <div>
            <dt>Runtime dependencies</dt>
            <dd>0</dd>
          </div>
        </dl>
        <p className="section-lede">
          Keyboard models follow the WAI-ARIA Authoring Practices. Focus is always visible,
          forced-colours mode is supported, and motion respects reduced-motion preferences.{' '}
          <Link href="/docs/accessibility" className="text-link">
            How we test →
          </Link>
        </p>
      </section>

      <section className="band band--cta" aria-labelledby="release-title">
        <div>
          <p className="section-eyebrow">Release {site.version}</p>
          <h2 id="release-title" className="section-title">
            Open source, MIT licensed, built by Binds.
          </h2>
          <p className="section-lede">
            Stance powers binds.si and eSignify. The source, issues and roadmap are on GitHub.
          </p>
        </div>
        <div className="hero__actions">
          <a href={site.github} className="st-button" data-variant="primary" data-size="lg">
            View on GitHub
          </a>
          <Link
            href="/resources/releases"
            className="st-button"
            data-variant="outline"
            data-size="lg"
          >
            Release notes
          </Link>
        </div>
      </section>
    </main>
  );
}

import Link from 'next/link';
import {
  counterparts,
  native,
  nativePath,
  platformLabels,
  previewName,
  type NativeComponent,
  type NativePlatform,
} from '../lib/native';
import { articleLd, breadcrumbLd } from '../lib/seo';
import { categoryLabels, site } from '../lib/site';
import { Code } from './code';
import { JsonLd } from './json-ld';
import { NativeImage, hasNativeImage, hasNativeTheme } from './native-image';

const themeLabels = { light: 'Light', dark: 'Dark', 'high-contrast': 'High contrast' } as const;

/** One native component on its own page. */
export function NativeComponentPage({
  platform,
  component: c,
}: {
  platform: NativePlatform;
  component: NativeComponent;
}) {
  const label = platformLabels[platform];
  const path = nativePath(platform, c);
  const preview = previewName(c);
  const hasPreview = !!preview && hasNativeImage(platform, preview);
  const { web, other, otherMatches } = counterparts(platform, c);
  const related = native[platform]
    .filter((x) => x.category === c.category && x.name !== c.name)
    .slice(0, 8);
  return (
    <article className="docs-article native-page">
      <JsonLd
        graph={[
          breadcrumbLd(path),
          articleLd(path, {
            articleSection: `${label.name} ${categoryLabels[c.category] ?? c.category}`,
            keywords: [c.name, label.ui, label.name, 'component', 'Stance', 'Binds'],
            programmingLanguage: platform === 'ios' ? 'Swift' : 'Kotlin',
          }),
        ]}
      />
      <header className="docs-article__header">
        <p className="docs-eyebrow">
          <Link href={`/${platform}/components`}>
            {platform === 'ios' ? 'iOS components' : 'Android components'}
          </Link>{' '}
          <span aria-hidden="true">/</span> {categoryLabels[c.category] ?? c.category}
        </p>
        <div className="component-doc__title-row">
          <h1>{c.name}</h1>
          <span className="component-doc__status" data-status={c.status}>
            {c.status === 'stable' ? 'Stable' : 'Beta'}
          </span>
        </div>
        <p className="docs-lede">{c.summary}</p>
        <ul className="native-facts">
          <li>
            <span>Platform</span>
            {label.name}, {label.ui}
          </li>
          <li>
            <span>Builds on</span>
            {c.wrapsNative ? <code>{c.wrapsNative}</code> : 'A custom Stance component'}
          </li>
          <li>
            <span>Kind</span>
            {c.kind}
          </li>
        </ul>
      </header>

      {hasPreview && (
        <section aria-labelledby="preview">
          <h2 id="preview" className="docs-h2">
            Preview
          </h2>
          <p className="docs-muted">Rendered by the {label.ui} library, not drawn by hand.</p>
          <figure className="native-hero">
            <NativeImage
              platform={platform}
              name={preview!}
              alt={`${c.name} on ${label.name}`}
              priority
            />
          </figure>
          <div className="native-themes" role="group" aria-label="Appearances">
            {(['light', 'dark', 'high-contrast'] as const)
              .filter((t) => hasNativeTheme(platform, preview!, t))
              .map((t) => (
                <figure key={t} className="native-themes__item">
                  <NativeImage
                    platform={platform}
                    name={preview!}
                    theme={t}
                    alt={`${c.name}, ${themeLabels[t]} appearance`}
                  />
                  <figcaption>{themeLabels[t]}</figcaption>
                </figure>
              ))}
          </div>
        </section>
      )}

      <section aria-labelledby="usage">
        <h2 id="usage" className="docs-h2">
          Usage
        </h2>
        <Code code={c.example} language={label.language} />
      </section>

      {c.accessibility.length > 0 && (
        <section aria-labelledby="accessibility">
          <h2 id="accessibility" className="docs-h2">
            Accessibility
          </h2>
          <ul className="docs-list">
            {c.accessibility.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </section>
      )}

      {(web || otherMatches.length > 0) && (
        <section aria-labelledby="elsewhere">
          <h2 id="elsewhere" className="docs-h2">
            On other platforms
          </h2>
          <ul className="related-list">
            {web && (
              <li>
                <Link href={`/components/${web}`}>Web: {web.replace(/-/g, ' ')}</Link>
              </li>
            )}
            {otherMatches.map((o) => (
              <li key={o.name}>
                <Link href={nativePath(other, o)}>
                  {other === 'ios' ? 'iOS' : 'Android'}: {o.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {related.length > 0 && (
        <section aria-labelledby="related">
          <h2 id="related" className="docs-h2">
            More {(categoryLabels[c.category] ?? c.category).toLowerCase()}
          </h2>
          <ul className="related-list related-list--plain">
            {related.map((r) => (
              <li key={r.name}>
                <Link href={nativePath(platform, r)}>{r.name}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="component-doc__links">
        <a href={`${site.github}/tree/main/platforms/${platform}`}>Source</a>
        <a
          href={`${site.github}/issues/new?title=${encodeURIComponent(`[${label.name}] ${c.name}: `)}`}
        >
          Report an issue
        </a>
      </p>
    </article>
  );
}

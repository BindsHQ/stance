import Link from 'next/link';
import {
  native,
  nativePath,
  platformLabels,
  previewName,
  type NativePlatform,
} from '../lib/native';
import { categoryLabels, categoryOrder } from '../lib/site';
import { JsonLd } from './json-ld';
import { NativeImage, hasNativeImage } from './native-image';
import { absolute, breadcrumbLd } from '../lib/seo';

/** Index of a native platform's components: grouped by category, each card links to its own page. */
export function NativeIndexPage({ platform }: { platform: NativePlatform }) {
  const items = native[platform];
  const label = platformLabels[platform];
  const path = `/${platform}/components`;
  const groups = categoryOrder
    .map((cat) => ({
      cat,
      title: categoryLabels[cat] ?? cat,
      items: items.filter((c) => c.category === cat),
    }))
    .filter((g) => g.items.length > 0);
  return (
    <article className="docs-article docs-article--wide">
      <JsonLd
        graph={[
          breadcrumbLd(path),
          {
            '@type': 'CollectionPage',
            '@id': `${absolute(path)}#page`,
            name: `${label.name} components`,
            url: absolute(path),
            mainEntity: {
              '@type': 'ItemList',
              numberOfItems: items.length,
              itemListElement: items.map((c, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                name: c.name,
                url: absolute(nativePath(platform, c)),
              })),
            },
          },
        ]}
      />
      <header className="docs-article__header">
        <p className="docs-eyebrow">
          <Link href={`/${platform}`}>{label.name}</Link>
        </p>
        <h1>{platform === 'ios' ? 'iOS components' : 'Android components'}</h1>
        <p className="docs-lede">
          {items.length} {label.ui} components, styles and helpers, each shown as it really renders.
        </p>
      </header>
      <nav aria-label="Categories" className="category-chips category-chips--compact">
        {groups.map((g) => (
          <a key={g.cat} href={`#cat-${g.cat}`}>
            {g.title} <span>{g.items.length}</span>
          </a>
        ))}
      </nav>
      {groups.map((g) => (
        <section key={g.cat} aria-labelledby={`cat-${g.cat}`} className="component-index__group">
          <h2 id={`cat-${g.cat}`} className="docs-h2">
            {g.title}
          </h2>
          <ul className="native-grid">
            {g.items.map((c) => {
              const preview = previewName(c);
              return (
                <li key={c.name}>
                  <Link href={nativePath(platform, c)} className="native-card">
                    <span className="native-card__media" aria-hidden="true">
                      {preview && hasNativeImage(platform, preview) ? (
                        <NativeImage platform={platform} name={preview} alt="" />
                      ) : (
                        <span className="native-card__kind">{c.kind}</span>
                      )}
                    </span>
                    <span className="native-card__body">
                      <span className="native-card__name">{c.name}</span>
                      <span className="native-card__summary">{c.summary}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </article>
  );
}

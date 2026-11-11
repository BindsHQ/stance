import { native, platformLabels, type NativePlatform } from '../lib/native';
import { categoryLabels, categoryOrder } from '../lib/site';
import { Code } from './code';

/** The component catalogue of a native platform, rendered from that platform's inventory. */
export function NativeCatalogue({ platform }: { platform: NativePlatform }) {
  const items = native[platform];
  const label = platformLabels[platform];
  if (items.length === 0) {
    return (
      <p className="docs-muted">The {label.name} component inventory has not been generated yet.</p>
    );
  }
  const groups = categoryOrder
    .map((cat) => ({ cat, items: items.filter((c) => c.category === cat) }))
    .filter((g) => g.items.length > 0);
  return (
    <>
      <p>
        {items.length} {label.ui} components and helpers. Each one reads the same Stance tokens as
        the web library and follows{' '}
        {platform === 'ios'
          ? 'Apple’s Human Interface Guidelines'
          : 'Android and Material 3 guidance'}
        .
      </p>
      {groups.map((g) => (
        <section key={g.cat} aria-labelledby={`native-${g.cat}`}>
          <h2 id={`native-${g.cat}`}>{categoryLabels[g.cat] ?? g.cat}</h2>
          {g.items.map((c) => (
            <article key={c.name} className="native-item" id={c.name.toLowerCase()}>
              <h3>
                <code>{c.name}</code>
                {c.status === 'beta' && <span className="native-item__badge">Beta</span>}
              </h3>
              <p>{c.summary}</p>
              <p className="docs-muted">
                {c.wrapsNative ? (
                  <>
                    Builds on <code>{c.wrapsNative}</code>.{' '}
                  </>
                ) : (
                  'Custom Stance component. '
                )}
                {c.webEquivalent && (
                  <>
                    Web counterpart:{' '}
                    <a href={`/components/${c.webEquivalent}`}>{c.webEquivalent}</a>.
                  </>
                )}
              </p>
              <Code code={c.example} language={label.language} />
              {c.accessibility.length > 0 && (
                <ul className="native-item__a11y">
                  {c.accessibility.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </section>
      ))}
    </>
  );
}

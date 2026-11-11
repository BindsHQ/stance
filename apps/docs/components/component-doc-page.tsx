'use client';
import * as React from 'react';
import Link from 'next/link';
import examplesSource from '../generated/examples.json';
import { loaders } from '../generated/registry';
import type { ComponentDoc, PropDoc } from '../lib/docs-types';
import type { ComponentModule } from '../lib/registry-types';
import { categoryLabels, site } from '../lib/site';
import { Code } from './code';
import { PlatformAvailability } from './platform-availability';
import { Playground } from './playground';
import { Preview, ThemeTriptych } from './preview';

const sources = examplesSource as Record<string, Record<string, string>>;
const cache = new Map<string, Promise<ComponentModule>>();

function load(slug: string) {
  let p = cache.get(slug);
  if (!p) {
    p = loaders[slug]!();
    cache.set(slug, p);
  }
  return p;
}

export function ComponentDocPage({ slug }: { slug: string }) {
  const mod = React.use(load(slug));
  const doc = mod.doc;
  const examples = doc.examples.filter((e) => typeof mod[e.name] === 'function');
  const hero = examples[0];
  const Hero = hero ? (mod[hero.name] as React.ComponentType) : null;
  const propGroups = groupProps(doc.props);
  const exampleCode = sources[slug] ?? {};

  return (
    <article className="docs-article component-doc">
      <header className="docs-article__header">
        <p className="docs-eyebrow">
          <Link href="/components">Components</Link> <span aria-hidden="true">/</span>{' '}
          {categoryLabels[doc.category] ?? doc.category}
        </p>
        <div className="component-doc__title-row">
          <h1>{doc.name}</h1>
          <span className="component-doc__status" data-status={doc.status}>
            {doc.status === 'stable' ? 'Stable' : 'Beta'}
          </span>
        </div>
        <p className="docs-lede">{doc.summary}</p>
        <p>{doc.description}</p>
        <div className="component-doc__links">
          <a href={`${site.github}/tree/main/packages/react/src/components/${slug}`}>Source</a>
          <a href={`${site.github}/blob/main/apps/docs/content/components/${slug}.tsx`}>
            Edit docs
          </a>
          <a href={`${site.github}/issues/new?title=${encodeURIComponent(`[${doc.name}] `)}`}>
            Report an issue
          </a>
        </div>
      </header>

      {Hero && hero && (
        <section aria-labelledby="overview">
          <h2 id="overview" className="docs-h2">
            Overview
          </h2>
          <Preview
            code={exampleCode[hero.name]}
            layout={hero.layout}
            minHeight={hero.minHeight ?? 220}
          >
            <Hero />
          </Preview>
          <h3 className="docs-h3" id="appearance">
            Light, dark and high contrast
          </h3>
          <p className="docs-muted">
            Every Stance component is designed and tested in all three appearance modes.
          </p>
          <ThemeTriptych minHeight={hero.minHeight ? Math.min(hero.minHeight, 260) : 160}>
            <Hero />
          </ThemeTriptych>
        </section>
      )}

      <section aria-labelledby="import">
        <h2 id="import" className="docs-h2">
          Import
        </h2>
        <Code code={`import { ${doc.imports.join(', ')} } from '@bindshq/stance-react';`} />
      </section>

      <PlatformAvailability
        slug={slug}
        name={doc.name}
        importLine={`import { ${doc.imports.join(', ')} } from '@bindshq/stance-react';`}
      />

      {doc.playground && (
        <section aria-labelledby="playground">
          <h2 id="playground" className="docs-h2">
            Playground
          </h2>
          <Playground doc={doc} />
        </section>
      )}

      {examples.length > 1 && (
        <section aria-labelledby="examples">
          <h2 id="examples" className="docs-h2">
            Examples
          </h2>
          {examples.slice(1).map((ex) => {
            const Example = mod[ex.name] as React.ComponentType;
            return (
              <Preview
                key={ex.name}
                id={`example-${ex.name.toLowerCase()}`}
                title={ex.title}
                description={ex.description}
                code={exampleCode[ex.name]}
                layout={ex.layout}
                minHeight={ex.minHeight}
              >
                <Example />
              </Preview>
            );
          })}
        </section>
      )}

      <section aria-labelledby="api">
        <h2 id="api" className="docs-h2">
          API reference
        </h2>
        {propGroups.map(([component, props]) => (
          <div key={component} className="props-table">
            {propGroups.length > 1 && (
              <h3 className="docs-h3">
                <code>{component}</code>
              </h3>
            )}
            <div
              className="props-table__scroll"
              role="region"
              aria-label={`${component} properties`}
              tabIndex={0}
            >
              <table>
                <thead>
                  <tr>
                    <th scope="col">Prop</th>
                    <th scope="col">Type</th>
                    <th scope="col">Default</th>
                    <th scope="col">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {props.map((p) => (
                    <tr key={p.name}>
                      <th scope="row">
                        <code>{p.name}</code>
                        {p.required && (
                          <span className="props-table__required" title="Required">
                            *<span className="st-sr-only"> required</span>
                          </span>
                        )}
                      </th>
                      <td>
                        <code className="props-table__type">{p.type}</code>
                      </td>
                      <td>
                        {p.default ? <code>{p.default}</code> : <span aria-label="none">—</span>}
                      </td>
                      <td>{p.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>

      <section aria-labelledby="accessibility">
        <h2 id="accessibility" className="docs-h2">
          Accessibility
        </h2>
        <ul className="docs-list">
          {doc.accessibility.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
        {doc.keyboard && doc.keyboard.length > 0 && (
          <>
            <h3 className="docs-h3" id="keyboard">
              Keyboard
            </h3>
            <div
              className="props-table__scroll"
              role="region"
              aria-label="Keyboard interactions"
              tabIndex={0}
            >
              <table className="keyboard-table">
                <thead>
                  <tr>
                    <th scope="col">Keys</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {doc.keyboard.map((k) => (
                    <tr key={k.keys.join('+') + k.description}>
                      <th scope="row">
                        {k.keys.map((key, i) => (
                          <React.Fragment key={key}>
                            {i > 0 && ' '}
                            <kbd>{key}</kbd>
                          </React.Fragment>
                        ))}
                      </th>
                      <td>{k.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {doc.guidelines && (
        <section aria-labelledby="guidelines">
          <h2 id="guidelines" className="docs-h2">
            Usage guidelines
          </h2>
          <div className="dodont">
            <div className="dodont__col" data-kind="do">
              <h3>Do</h3>
              <ul>
                {doc.guidelines.do.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            </div>
            <div className="dodont__col" data-kind="dont">
              <h3>Don’t</h3>
              <ul>
                {doc.guidelines.dont.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {doc.related && doc.related.length > 0 && (
        <section aria-labelledby="related">
          <h2 id="related" className="docs-h2">
            Related
          </h2>
          <ul className="related-list">
            {doc.related
              .filter((r) => r in loaders)
              .map((r) => (
                <li key={r}>
                  <Link href={`/components/${r}`}>{r.replace(/-/g, ' ')}</Link>
                </li>
              ))}
          </ul>
        </section>
      )}
    </article>
  );
}

function groupProps(props: PropDoc[]): [string, PropDoc[]][] {
  const map = new Map<string, PropDoc[]>();
  for (const p of props) {
    const list = map.get(p.component) ?? [];
    list.push(p);
    map.set(p.component, list);
  }
  return [...map.entries()];
}

export type { ComponentDoc };

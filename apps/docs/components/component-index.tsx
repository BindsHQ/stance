'use client';
import * as React from 'react';
import Link from 'next/link';
import { groupedComponents } from './docs-sidebar';

export function ComponentIndex() {
  const [query, setQuery] = React.useState('');
  const q = query.trim().toLowerCase();
  const groups = groupedComponents()
    .map((g) => ({
      ...g,
      items: g.items.filter(
        (c) => !q || c.name.toLowerCase().includes(q) || c.summary.toLowerCase().includes(q),
      ),
    }))
    .filter((g) => g.items.length > 0);
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  return (
    <article className="docs-article docs-article--wide">
      <header className="docs-article__header">
        <p className="docs-eyebrow">Library</p>
        <h1>Components</h1>
        <p className="docs-lede">
          A curated set of accessible, dependency-free React components. Each one is documented with
          live previews in all three appearance modes, a full API reference and keyboard behaviour.
        </p>
      </header>
      <div className="component-index__search">
        <label htmlFor="component-filter" className="st-sr-only">
          Filter components
        </label>
        <input
          id="component-filter"
          className="component-index__input"
          type="search"
          placeholder="Filter components…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <p className="docs-muted" aria-live="polite">
          {total} components
        </p>
      </div>
      {groups.map((g) => (
        <section
          key={g.category}
          aria-labelledby={`cat-${g.category}`}
          className="component-index__group"
        >
          <h2 id={`cat-${g.category}`} className="docs-h2">
            {g.title}
          </h2>
          <ul className="component-grid">
            {g.items.map((c) => (
              <li key={c.slug}>
                <Link href={`/components/${c.slug}`} className="component-card">
                  <span className="component-card__name">{c.name}</span>
                  <span className="component-card__summary">{c.summary}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </article>
  );
}

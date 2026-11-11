'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import meta from '../generated/meta.json';
import type { ComponentMeta } from '../lib/registry-types';
import { categoryLabels, categoryOrder, guideNav } from '../lib/site';

const components = meta as ComponentMeta[];

export function groupedComponents() {
  return categoryOrder
    .map((cat) => ({
      category: cat,
      title: categoryLabels[cat] ?? cat,
      items: components
        .filter((c) => c.category === cat)
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .filter((g) => g.items.length > 0);
}

export function DocsNavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;
  return (
    <div className="docs-nav">
      {guideNav.map((section) => (
        <div key={section.title} className="docs-nav__section">
          <h2 className="docs-nav__heading">{section.title}</h2>
          <ul>
            {section.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  onClick={onNavigate}
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className="docs-nav__section">
        <h2 className="docs-nav__heading">
          <Link
            href="/components"
            onClick={onNavigate}
            aria-current={isActive('/components') ? 'page' : undefined}
          >
            Components <span className="docs-nav__count">{components.length}</span>
          </Link>
        </h2>
        {groupedComponents().map((group) => (
          <div key={group.category} className="docs-nav__group">
            <h3 className="docs-nav__subheading">{group.title}</h3>
            <ul>
              {group.items.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/components/${c.slug}`}
                    aria-current={isActive(`/components/${c.slug}`) ? 'page' : undefined}
                    onClick={onNavigate}
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DocsSidebar() {
  return (
    <aside className="docs-sidebar" aria-label="Documentation">
      <nav aria-label="Documentation">
        <DocsNavList />
      </nav>
    </aside>
  );
}

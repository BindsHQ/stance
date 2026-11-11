import meta from '../generated/meta.json';
import { pages } from '../content/pages';
import type { ComponentMeta } from './registry-types';
import { categoryLabels } from './site';

export interface SiteRoute {
  path: string;
  title: string;
  description: string;
  section:
    | 'home'
    | 'components'
    | 'docs'
    | 'foundations'
    | 'ios'
    | 'android'
    | 'patterns'
    | 'guidelines'
    | 'resources';
  /** Breadcrumb trail (excluding home). */
  trail: { name: string; path: string }[];
  priority: number;
}

export const components = meta as ComponentMeta[];

const sectionTitle: Record<string, string> = {
  docs: 'Getting started',
  foundations: 'Foundations',
  ios: 'iOS and iPadOS',
  android: 'Android',
  patterns: 'Patterns',
  guidelines: 'Guidelines',
  resources: 'Resources',
};
const sectionLanding: Record<string, string> = {
  docs: '/docs/introduction',
  foundations: '/foundations/colors',
  ios: '/ios/installation',
  android: '/android/installation',
  patterns: '/patterns/forms',
  guidelines: '/guidelines/principles',
  resources: '/resources/releases',
};

/** Every indexable page on stanceui.com, the single source for sitemap, llms.txt and metadata. */
export const routes: SiteRoute[] = [
  {
    path: '/',
    title: 'Stance — The Binds Design System',
    description: `Stance is the open-source design system by Binds: design tokens, light, dark and high-contrast themes, and ${components.length} accessible, dependency-free React components.`,
    section: 'home',
    trail: [],
    priority: 1,
  },
  {
    path: '/components',
    title: 'Components',
    description: `All ${components.length} Stance React components, grouped by purpose, with live previews, API reference and accessibility guidance.`,
    section: 'components',
    trail: [{ name: 'Components', path: '/components' }],
    priority: 0.9,
  },
  ...pages.map((p) => ({
    path: `/${p.section}/${p.slug}`,
    title: p.title,
    description: p.description,
    section: p.section,
    trail: [
      { name: sectionTitle[p.section]!, path: sectionLanding[p.section]! },
      { name: p.title, path: `/${p.section}/${p.slug}` },
    ],
    priority: p.section === 'docs' ? 0.9 : 0.7,
  })),
  ...components.map((c) => ({
    path: `/components/${c.slug}`,
    title: `${c.name} — React component`,
    description: c.summary,
    section: 'components' as const,
    trail: [
      { name: 'Components', path: '/components' },
      { name: categoryLabels[c.category] ?? c.category, path: '/components' },
      { name: c.name, path: `/components/${c.slug}` },
    ],
    priority: 0.8,
  })),
];

export const routeByPath = new Map(routes.map((r) => [r.path, r]));

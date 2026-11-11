import type { Metadata } from 'next';
import { routeByPath, type SiteRoute } from './routes';
import { site } from './site';

export const absolute = (path: string) => new URL(path, site.url).toString();

/** OG image path for a page: /og/<key>.png, generated statically at build. */
export const ogKey = (path: string) => (path === '/' ? 'home' : path.slice(1).replace(/\//g, '--'));
export const ogImagePath = (path: string) => `/og/${ogKey(path)}.png`;

/** Complete, consistent metadata for any page: canonical, Open Graph, Twitter and robots. */
export function pageMetadata(
  path: string,
  overrides: Partial<Pick<SiteRoute, 'title' | 'description'>> = {},
): Metadata {
  const route = routeByPath.get(path);
  const title = overrides.title ?? route?.title ?? site.name;
  const description = overrides.description ?? route?.description ?? site.description;
  const image = { url: ogImagePath(path), width: 1200, height: 630, alt: `${title} — Stance` };
  const isHome = path === '/';
  return {
    title: isHome ? { absolute: title } : title,
    description,
    alternates: {
      canonical: path,
      ...(path.startsWith('/components/') && {
        types: { 'text/markdown': `/llms${path}.md` },
      }),
    },
    openGraph: {
      type: isHome ? 'website' : 'article',
      url: path,
      siteName: 'Stance',
      locale: 'en_GB',
      title,
      description,
      images: [image],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image.url] },
  };
}

// ---------------- JSON-LD (schema.org) ----------------

export const organizationLd = {
  '@type': 'Organization',
  '@id': `${site.binds}/#organization`,
  name: 'Binds',
  url: site.binds,
  sameAs: ['https://github.com/BindsHQ', 'https://www.npmjs.com/org/bindshq'],
};

export function websiteLd() {
  return {
    '@type': 'WebSite',
    '@id': `${site.url}/#website`,
    url: site.url,
    name: 'Stance',
    alternateName: 'Stance — The Binds Design System',
    description: site.description,
    inLanguage: 'en-GB',
    publisher: { '@id': organizationLd['@id'] },
  };
}

export function softwareLd(componentCount: number) {
  return {
    '@type': 'SoftwareSourceCode',
    '@id': `${site.url}/#software`,
    name: 'Stance',
    description: site.description,
    url: site.url,
    codeRepository: site.github,
    programmingLanguage: ['TypeScript', 'CSS'],
    runtimePlatform: 'React 18, React 19',
    license: 'https://opensource.org/licenses/MIT',
    version: site.version,
    keywords: [
      'design system',
      'React components',
      'design tokens',
      'accessibility',
      'WCAG 2.2',
      'dark mode',
      'high contrast',
    ],
    author: { '@id': organizationLd['@id'] },
    publisher: { '@id': organizationLd['@id'] },
    isAccessibleForFree: true,
    about: `${componentCount} accessible React components and design tokens`,
  };
}

export function breadcrumbLd(path: string) {
  const route = routeByPath.get(path);
  const trail = [{ name: 'Stance', path: '/' }, ...(route?.trail ?? [])];
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      item: absolute(t.path),
    })),
  };
}

export function articleLd(path: string, extra: Record<string, unknown> = {}) {
  const route = routeByPath.get(path);
  return {
    '@type': 'TechArticle',
    '@id': `${absolute(path)}#article`,
    headline: route?.title,
    description: route?.description,
    url: absolute(path),
    inLanguage: 'en-GB',
    image: absolute(ogImagePath(path)),
    isPartOf: { '@id': `${site.url}/#website` },
    about: { '@id': `${site.url}/#software` },
    publisher: { '@id': organizationLd['@id'] },
    dateModified: BUILD_DATE,
    proficiencyLevel: 'Beginner',
    ...extra,
  };
}

export function faqLd(items: { q: string; a: string }[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.q,
      acceptedAnswer: { '@type': 'Answer', text: i.a },
    })),
  };
}

export const BUILD_DATE = new Date().toISOString().slice(0, 10);

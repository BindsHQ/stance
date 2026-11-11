import type { MetadataRoute } from 'next';
import { routes } from '../lib/routes';
import { absolute } from '../lib/seo';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return routes.map((r) => ({
    url: absolute(r.path),
    lastModified,
    changeFrequency: r.section === 'resources' ? 'weekly' : 'monthly',
    priority: r.priority,
  }));
}

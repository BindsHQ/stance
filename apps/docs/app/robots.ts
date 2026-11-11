import type { MetadataRoute } from 'next';
import { site } from '../lib/site';

export const dynamic = 'force-static';

/**
 * Documentation is meant to be found and cited: search engines and AI assistants are
 * explicitly welcome. Only build internals are excluded.
 */
export default function robots(): MetadataRoute.Robots {
  const aiAgents = [
    'GPTBot',
    'OAI-SearchBot',
    'ChatGPT-User',
    'ClaudeBot',
    'Claude-User',
    'Claude-SearchBot',
    'PerplexityBot',
    'Perplexity-User',
    'Google-Extended',
    'Applebot-Extended',
    'CCBot',
    'Bingbot',
    'DuckAssistBot',
  ];
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/_next/'] },
      { userAgent: aiAgents, allow: '/' },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}

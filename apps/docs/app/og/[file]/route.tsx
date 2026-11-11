import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { LOGO } from '../../../components/brand-paths';
import { routes } from '../../../lib/routes';
import { ogKey } from '../../../lib/seo';
import { categoryLabels, site } from '../../../lib/site';
import { components } from '../../../lib/routes';

export const dynamic = 'force-static';
export const dynamicParams = false;

/** Cut at a word boundary so previews never end mid-word. */
const truncate = (t: string, max: number) =>
  t.length <= max ? t : `${t.slice(0, t.lastIndexOf(' ', max - 1)).replace(/[,;:]$/, '')}…`;

export function generateStaticParams() {
  return routes.map((r) => ({ file: `${ogKey(r.path)}.png` }));
}

// DM Sans (SIL Open Font License 1.1, see assets/fonts/OFL.txt), read at build time.
const fontDir = join(process.cwd(), 'assets', 'fonts');
const font = (file: string) => readFile(join(fontDir, file));

const IVORY = '#FCF6EB';
const INDIGO = '#140C2E';
const MUTED = '#555169';

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const key = file.replace(/\.png$/, '');
  const route = routes.find((r) => ogKey(r.path) === key) ?? routes[0]!;
  const component = components.find((c) => `/components/${c.slug}` === route.path);
  const isHome = route.path === '/';
  const eyebrow = isHome
    ? 'The Binds Design System'
    : component
      ? `Component · ${categoryLabels[component.category] ?? component.category}`
      : (route.trail[0]?.name ?? 'Documentation');
  const title = isHome
    ? 'One system. Consistent foundations. Distinct products.'
    : component
      ? component.name
      : route.title;
  // Only glyphs in the bundled font are used, so the build never fetches fonts from the network.
  const clean = (t: string) =>
    t
      .replace(/⌘/g, 'Cmd ')
      .replace(/[^\x20-\x7E\u00A0-\u017F\u2013\u2014\u2018\u2019\u201C\u201D\u2026\u00B7]/g, '');
  const [regular, semibold] = await Promise.all([
    font('dm-sans-latin-400-normal.woff'),
    font('dm-sans-latin-600-normal.woff'),
  ]);

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: IVORY,
        color: INDIGO,
        padding: '64px 72px',
        fontFamily: 'DM Sans',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <svg width={(44 * 1682) / 376} height={44} viewBox={LOGO.viewBox} fill={INDIGO}>
          <path d={LOGO.d} />
        </svg>
        <div
          style={{
            display: 'flex',
            fontSize: 22,
            color: MUTED,
            border: `2px solid ${INDIGO}22`,
            borderRadius: 999,
            padding: '8px 20px',
          }}
        >
          v{site.version} · MIT
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: MUTED,
            marginBottom: 20,
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: isHome ? 64 : title.length > 22 ? 72 : 96,
            fontWeight: 600,
            lineHeight: 1.04,
            letterSpacing: '-0.04em',
            maxWidth: 1000,
          }}
        >
          {clean(title)}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 28,
            lineHeight: 1.4,
            color: MUTED,
            marginTop: 24,
            maxWidth: 960,
          }}
        >
          {clean(truncate(route.description, 150))}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 24,
          color: MUTED,
          borderTop: `2px solid ${INDIGO}1a`,
          paddingTop: 24,
        }}
      >
        <span>stanceui.com</span>
        <span>Design tokens · Themes · Accessible React components</span>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'DM Sans', data: regular, weight: 400, style: 'normal' },
        { name: 'DM Sans', data: semibold, weight: 600, style: 'normal' },
      ],
    },
  );
}

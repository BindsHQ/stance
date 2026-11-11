import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { LOGO, MARK } from '../../../components/brand-paths';
import { platformLandings } from '../../../content/platforms';
import { routes } from '../../../lib/routes';
import { ogKey } from '../../../lib/seo';
import { categoryLabels } from '../../../lib/site';
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
const INK_150 = '#CFC9C9';
const INK_800 = '#2F2A48';
const INK_50 = '#ECE6DF';

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const key = file.replace(/\.png$/, '');
  const route = routes.find((r) => ogKey(r.path) === key) ?? routes[0]!;
  const component = components.find((c) => `/components/${c.slug}` === route.path);
  const isHome = route.path === '/';
  const landing = Object.values(platformLandings).find((l) => l.path === route.path);
  const eyebrow = isHome
    ? 'The Binds Design System'
    : landing
      ? landing.eyebrow
      : component
        ? `Web component · ${categoryLabels[component.category] ?? component.category}`
        : route.trail.length > 1
          ? route.trail
              .slice(0, -1)
              .map((t) => t.name)
              .join(' · ')
          : (route.trail[0]?.name ?? 'Documentation');
  const title = isHome
    ? 'Crafted with care.|Built to last.'
    : landing
      ? landing.title.join('|')
      : component
        ? component.name
        : route.title;
  const subtitle = isHome
    ? 'Colour, type and components that work together.'
    : landing
      ? landing.lede
      : truncate(route.description, 96);
  // Only glyphs in the bundled font are used, so the build never fetches fonts from the network.
  const clean = (t: string) =>
    t
      .replace(/⌘/g, 'Cmd ')
      .replace(/[^\x20-\x7E\u00A0-\u017F\u2018\u2019\u201C\u201D\u2026\u00B7]/g, '');
  const [regular, semibold] = await Promise.all([
    font('dm-sans-latin-400-normal.woff'),
    font('dm-sans-latin-600-normal.woff'),
  ]);

  // Home is indigo with ivory type; every other page is ivory with indigo type.
  const bg = isHome ? INDIGO : IVORY;
  const fg = isHome ? IVORY : INDIGO;
  const muted = isHome ? INK_150 : MUTED;
  const watermark = isHome ? INK_800 : INK_50;
  const lines = clean(title).split('|');
  const longest = Math.max(...lines.map((l) => l.length));
  const size = longest > 30 ? 60 : longest > 22 ? 72 : longest > 16 ? 88 : 100;

  return new ImageResponse(
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: bg,
        color: fg,
        padding: '68px 76px',
        fontFamily: 'DM Sans',
      }}
    >
      {/* The Stance mark, large and quiet, set into the right edge. */}
      <svg
        width={560}
        height={(560 * 376) / 382}
        viewBox={MARK.viewBox}
        fill={watermark}
        style={{ position: 'absolute', right: -120, top: 35 }}
      >
        <path d={MARK.d} />
      </svg>
      <svg width={(40 * 1682) / 376} height={40} viewBox={LOGO.viewBox} fill={fg}>
        <path d={LOGO.d} />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 860 }}>
        <div
          style={{
            display: 'flex',
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: muted,
            marginBottom: 22,
          }}
        >
          {clean(eyebrow)}
        </div>
        {lines.map((line, i) => (
          <div
            key={line}
            style={{
              display: 'flex',
              fontSize: size,
              fontWeight: 600,
              lineHeight: 1.04,
              letterSpacing: '-0.045em',
              color: i === 1 ? muted : fg,
            }}
          >
            {line}
          </div>
        ))}
        <div
          style={{
            display: 'flex',
            fontSize: 30,
            lineHeight: 1.35,
            color: muted,
            marginTop: 26,
            maxWidth: 820,
          }}
        >
          {clean(subtitle)}
        </div>
      </div>
      <div style={{ display: 'flex', fontSize: 24, color: muted }}>
        <span>stanceui.com</span>
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

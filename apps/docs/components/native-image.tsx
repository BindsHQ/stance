import media from '../generated/native-media.json';
import type { NativePlatform } from '../lib/native';

type Media = Record<NativePlatform, Record<string, { src: string; width: number; height: number }>>;
const all = media as Media;

export function hasNativeImage(platform: NativePlatform, name: string) {
  return Boolean(all[platform][`${name}.light`]);
}

/**
 * A real capture from the native library, in the theme the site is showing.
 * One image per theme is in the page; CSS shows the matching one and lazy loading
 * means hidden themes are never downloaded.
 */
export function NativeImage({
  platform,
  name,
  alt,
  className,
  priority,
  theme,
}: {
  platform: NativePlatform;
  name: string;
  alt: string;
  className?: string;
  priority?: boolean;
  /** Pin one appearance instead of following the site theme. */
  theme?: 'light' | 'dark' | 'high-contrast';
}) {
  const themes = (theme ? [theme] : (['light', 'dark', 'high-contrast'] as const)).filter(
    (t) => all[platform][`${name}.${t}`],
  );
  if (themes.length === 0) return null;
  return (
    <>
      {themes.map((t) => {
        const img = all[platform][`${name}.${t}`]!;
        return (
          <img
            key={t}
            className={['native-image', className].filter(Boolean).join(' ')}
            data-for-theme={t}
            data-only={themes.length === 1 ? '' : undefined}
            data-has-hc={themes.includes('high-contrast') ? '' : undefined}
            src={img.src}
            width={img.width}
            height={img.height}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
          />
        );
      })}
    </>
  );
}

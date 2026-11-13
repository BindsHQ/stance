import nativeData from '../generated/native.json';
import idiomData from '../generated/native-idioms.json';
import { coversWeb, sharesWeb, webSlugs, type WebEquivalent } from './native-links';

export { webSlugs } from './native-links';

export type NativePlatform = 'ios' | 'android';

export interface NativeComponent {
  name: string;
  /** URL slug; generated from the name when the inventory does not provide one. */
  slug?: string;
  category: string;
  summary: string;
  kind: string;
  wrapsNative: string | null;
  status: 'stable' | 'beta';
  example: string;
  accessibility: string[];
  /** Web components this covers: one slug, several, or null. Read it through `webSlugs`. */
  webEquivalent: WebEquivalent;
  /** Paths of real rendered previews, relative to the platform folder, or null for non-visual entries. */
  preview?: {
    light: string;
    dark?: string;
    'high-contrast'?: string;
    width?: number;
    height?: number;
  } | null;
}

/** Media key of a component preview: `previews/stance-button.light.png` gives `stance-button`. */
export function previewName(c: NativeComponent): string | null {
  const path = c.preview?.light;
  return path
    ? path
        .split('/')
        .pop()!
        .replace(/\.light\.png$/, '')
    : null;
}

export const native = nativeData as unknown as Record<NativePlatform, NativeComponent[]>;

export const platformLabels: Record<
  NativePlatform,
  { name: string; language: string; ui: string }
> = {
  ios: { name: 'iOS and iPadOS', language: 'swift', ui: 'SwiftUI' },
  android: { name: 'Android', language: 'kotlin', ui: 'Jetpack Compose' },
};

/** Native counterparts of a web component, by platform. */
export function nativeEquivalents(slug: string): Record<NativePlatform, NativeComponent[]> {
  return {
    ios: native.ios.filter((c) => coversWeb(c.webEquivalent, slug)),
    android: native.android.filter((c) => coversWeb(c.webEquivalent, slug)),
  };
}

/** Platform guidance for web components that need no Stance component, from specs/native-parity.json. */
export const nativeIdioms = idiomData as Record<NativePlatform, Record<string, string>>;

/** Short platform names for one line notes. */
export const platformShortNames: Record<NativePlatform, string> = {
  ios: 'iOS',
  android: 'Android',
};

/** How each platform covers a web component: native counterparts, or else an idiom sentence. */
export function nativeCoverage(
  slug: string,
): Record<NativePlatform, { components: NativeComponent[]; idiom: string | null }> {
  const eq = nativeEquivalents(slug);
  const cover = (p: NativePlatform) => ({
    components: eq[p],
    idiom: eq[p].length ? null : (nativeIdioms[p][slug] ?? null),
  });
  return { ios: cover('ios'), android: cover('android') };
}

const kebab = (name: string) =>
  name
    .replace(/[()_:]/g, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();

/** Stable URL slug for a native component. */
export const nativeSlug = (c: NativeComponent): string => c.slug ?? kebab(c.name);

/** Canonical page of a native component. */
export const nativePath = (platform: NativePlatform, c: NativeComponent): string =>
  `/${platform}/components/${nativeSlug(c)}`;

export const nativePlatforms: NativePlatform[] = ['ios', 'android'];

export function findNative(platform: NativePlatform, slug: string): NativeComponent | undefined {
  return native[platform].find((c) => nativeSlug(c) === slug);
}

/** The same component elsewhere: the web page and matching components on the other native platform. */
export function counterparts(platform: NativePlatform, c: NativeComponent) {
  const other: NativePlatform = platform === 'ios' ? 'android' : 'ios';
  const base = c.name.replace(/[()]/g, '').toLowerCase();
  const matches = native[other].filter(
    (o) =>
      sharesWeb(c.webEquivalent, o.webEquivalent) ||
      o.name.replace(/[()]/g, '').toLowerCase() === base,
  );
  return { web: webSlugs(c.webEquivalent), other, otherMatches: matches };
}

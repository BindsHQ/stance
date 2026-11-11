import nativeData from '../generated/native.json';

export type NativePlatform = 'ios' | 'android';

export interface NativeComponent {
  name: string;
  category: string;
  summary: string;
  kind: string;
  wrapsNative: string | null;
  status: 'stable' | 'beta';
  example: string;
  accessibility: string[];
  webEquivalent: string | null;
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
    ios: native.ios.filter((c) => c.webEquivalent === slug),
    android: native.android.filter((c) => c.webEquivalent === slug),
  };
}

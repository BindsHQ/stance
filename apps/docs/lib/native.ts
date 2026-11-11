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

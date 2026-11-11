import { Image } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

const svg = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><rect width="320" height="180" fill="#ECE6DF"/><rect x="24" y="24" width="120" height="14" rx="7" fill="#140C2E"/><rect x="24" y="48" width="200" height="8" rx="4" fill="#817D8C"/><rect x="24" y="64" width="160" height="8" rx="4" fill="#9E9AA3"/><circle cx="270" cy="130" r="34" fill="#140C2E"/></svg>`,
);
const preview = `data:image/svg+xml,${svg}`;

export const doc: ComponentDoc = {
  slug: 'image',
  name: 'Image',
  category: 'media',
  summary: 'An image with lazy loading, a reserved ratio and a graceful fallback.',
  description:
    'Image wraps <img> with lazy loading, asynchronous decoding, rounded corners from tokens and an optional ratio that stops layout shift. When the source fails to load it shows a neutral placeholder that keeps the alt text available to assistive technology.',
  imports: ['Image'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic' },
    { name: 'Fallback', title: 'Fallback', description: 'A broken source shows a placeholder.' },
    { name: 'Shapes', title: 'Radius and border' },
  ],
  props: [
    {
      component: 'Image',
      name: 'alt',
      type: 'string',
      required: true,
      description: 'Text alternative; empty for decorative images.',
    },
    {
      component: 'Image',
      name: 'ratio',
      type: 'number',
      description: 'Width ÷ height to reserve space.',
    },
    {
      component: 'Image',
      name: 'fit',
      type: "'cover' | 'contain' | 'fill' | 'none'",
      default: "'cover'",
      description: 'object-fit.',
    },
    {
      component: 'Image',
      name: 'radius',
      type: "'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'",
      default: "'md'",
      description: 'Corner radius.',
    },
    {
      component: 'Image',
      name: 'bordered',
      type: 'boolean',
      description: 'Subtle border for screenshots.',
    },
    {
      component: 'Image',
      name: 'fallback',
      type: 'ReactNode',
      description: 'Content when loading fails.',
    },
  ],
  accessibility: [
    'alt is required by the type. Pass alt="" for decorative images.',
    'Fallbacks keep the alt text via role="img".',
  ],
  guidelines: {
    do: ['Describe what the image conveys, not what it looks like.'],
    dont: ['Embed text in images.'],
  },
  related: ['aspect-ratio', 'avatar'],
};

export function Basic() {
  return (
    <Image
      src={preview}
      alt="Email signature preview for Acme Ltd"
      ratio={16 / 9}
      radius="lg"
      bordered
      style={{ width: 320 }}
    />
  );
}

export function Fallback() {
  return (
    <Image
      src="/missing-signature.png"
      alt="Signature preview unavailable"
      ratio={16 / 9}
      style={{ width: 320 }}
    />
  );
}

export function Shapes() {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <Image src={preview} alt="Square crop" ratio={1} radius="none" style={{ width: 96 }} />
      <Image src={preview} alt="Rounded crop" ratio={1} radius="xl" style={{ width: 96 }} />
      <Image src={preview} alt="Circular crop" ratio={1} radius="full" style={{ width: 96 }} />
    </div>
  );
}

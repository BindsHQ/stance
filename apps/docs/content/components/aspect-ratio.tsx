import { AspectRatio } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

const art = (label: string) => (
  <svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" role="img" aria-label={label}>
    <rect width="160" height="90" fill="var(--st-color-bg-muted)" />
    <circle cx="120" cy="30" r="40" fill="var(--st-color-bg-emphasis)" />
    <rect x="16" y="56" width="64" height="8" rx="4" fill="var(--st-color-fg-subtle)" />
    <rect x="16" y="70" width="40" height="6" rx="3" fill="var(--st-color-border-strong)" />
  </svg>
);

export const doc: ComponentDoc = {
  slug: 'aspect-ratio',
  name: 'AspectRatio',
  category: 'foundations',
  summary: 'Holds media to a fixed width-to-height ratio.',
  description:
    'AspectRatio reserves space for images, video and embeds before they load, so the layout does not shift. Its single child fills the box; images and video default to object-fit: cover.',
  imports: ['AspectRatio'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: '16:9', layout: 'fill' },
    { name: 'Square', title: 'Square' },
    { name: 'Portrait', title: 'Portrait 3:4' },
  ],
  props: [
    {
      component: 'AspectRatio',
      name: 'ratio',
      type: 'number',
      default: '16 / 9',
      description: 'Width divided by height.',
    },
  ],
  accessibility: ['AspectRatio adds no semantics. Give the media inside it a text alternative.'],
  guidelines: {
    do: ['Use for any media whose size is known in advance.'],
    dont: ['Put text content inside; it may be clipped.'],
  },
  related: ['image'],
};

export function Basic() {
  return (
    <div style={{ width: '100%', maxWidth: 480 }}>
      <AspectRatio ratio={16 / 9}>{art('Product walkthrough poster')}</AspectRatio>
    </div>
  );
}

export function Square() {
  return (
    <div style={{ width: 180 }}>
      <AspectRatio ratio={1}>{art('Team avatar')}</AspectRatio>
    </div>
  );
}

export function Portrait() {
  return (
    <div style={{ width: 180 }}>
      <AspectRatio ratio={3 / 4}>{art('Contract cover page')}</AspectRatio>
    </div>
  );
}

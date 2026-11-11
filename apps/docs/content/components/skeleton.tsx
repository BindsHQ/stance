import { Skeleton } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'skeleton',
  name: 'Skeleton',
  category: 'feedback',
  summary: 'Placeholder shapes that hold the layout while content loads.',
  description:
    'Skeletons reduce layout shift and make loading feel shorter by previewing the shape of what is coming. Match their shapes to the real content. Skeletons are invisible to screen readers, so mark the loading container aria-busy and add a short status message.',
  imports: ['Skeleton'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', layout: 'fill' },
    { name: 'ListRow', title: 'List row', layout: 'fill' },
    { name: 'CardPlaceholder', title: 'Card placeholder' },
  ],
  props: [
    {
      component: 'Skeleton',
      name: 'variant',
      type: "'text' | 'circle' | 'rect'",
      default: "'text'",
      description: 'Shape.',
    },
    {
      component: 'Skeleton',
      name: 'width',
      type: 'number | string',
      description: 'Width (number = px).',
    },
    {
      component: 'Skeleton',
      name: 'height',
      type: 'number | string',
      description: 'Height (number = px).',
    },
    {
      component: 'Skeleton',
      name: 'lines',
      type: 'number',
      default: '1',
      description: 'Number of text lines; the last is shorter.',
    },
    {
      component: 'Skeleton',
      name: 'static',
      type: 'boolean',
      default: 'false',
      description: 'Disable the shimmer.',
    },
  ],
  accessibility: [
    'Skeletons are always aria-hidden.',
    'Set aria-busy="true" on the region being loaded and include a visually hidden status, e.g. "Loading templates…".',
    'The shimmer is disabled for people who prefer reduced motion.',
  ],
  guidelines: {
    do: ['Mirror the real layout closely.'],
    dont: ['Show skeletons for operations shorter than about 300ms.'],
  },
  related: ['spinner', 'progress', 'loading-overlay'],
};

export function Basic() {
  return (
    <div aria-busy="true" style={{ display: 'grid', gap: 8, maxWidth: 420 }}>
      <span className="st-sr-only" role="status">
        Loading contract details…
      </span>
      <Skeleton width="40%" height={20} />
      <Skeleton lines={3} />
    </div>
  );
}

export function ListRow() {
  return (
    <div aria-busy="true" style={{ display: 'grid', gap: 16, maxWidth: 420 }}>
      <span className="st-sr-only" role="status">
        Loading members…
      </span>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Skeleton variant="circle" width={36} />
          <div style={{ flex: 1 }}>
            <Skeleton width="50%" />
            <Skeleton width="30%" height={10} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CardPlaceholder() {
  return (
    <div aria-busy="true" style={{ width: 300, display: 'grid', gap: 12 }}>
      <span className="st-sr-only" role="status">
        Loading template preview…
      </span>
      <Skeleton variant="rect" height={140} />
      <Skeleton width="60%" height={18} />
      <Skeleton lines={2} />
    </div>
  );
}

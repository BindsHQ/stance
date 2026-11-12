import { StreamingSkeleton } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'streaming-skeleton',
  name: 'StreamingSkeleton',
  category: 'ai',
  summary:
    'Placeholder lines for a response that has been requested and has not started to arrive.',
  description:
    'Show StreamingSkeleton in the place where the response will appear, between sending a message and the first content. Pick the variant that matches what is coming so the layout does not jump. When you want to say what the assistant is doing, use ThinkingIndicator instead.',
  imports: ['StreamingSkeleton'],
  status: 'beta',
  examples: [
    { name: 'Basic', title: 'Text', layout: 'fill' },
    { name: 'Card', title: 'Card', layout: 'fill' },
    { name: 'Image', title: 'Image', layout: 'fill' },
  ],
  props: [
    {
      component: 'StreamingSkeleton',
      name: 'lines',
      type: 'number',
      default: '3',
      description: 'Number of placeholder lines.',
    },
    {
      component: 'StreamingSkeleton',
      name: 'variant',
      type: "'text' | 'card' | 'image'",
      default: "'text'",
      description: 'The shape of the response to come.',
    },
    {
      component: 'StreamingSkeleton',
      name: 'label',
      type: 'string',
      default: "'Loading response'",
      description: 'Read by assistive technology in place of the placeholder.',
    },
    {
      component: 'StreamingSkeleton',
      name: 'static',
      type: 'boolean',
      default: 'false',
      description: 'Turns the shimmer off. Reduced motion does this on its own.',
    },
  ],
  accessibility: [
    'A polite status that reads the label once. The placeholder shapes are hidden from assistive technology.',
    'With reduced motion the shapes are static.',
    'In forced colours the shapes use a system colour so they stay visible.',
  ],
  guidelines: {
    do: [
      'Match the variant and line count to the response you expect.',
      'Replace it with the response in the same place.',
    ],
    dont: ['Keep it on screen once the first content has arrived.'],
  },
  related: ['skeleton', 'thinking-indicator', 'streaming-text', 'generation-progress'],
};

export function Basic() {
  return <StreamingSkeleton />;
}

export function Card() {
  return <StreamingSkeleton variant="card" lines={2} label="Loading summary" />;
}

export function Image() {
  return <StreamingSkeleton variant="image" label="Creating image" />;
}

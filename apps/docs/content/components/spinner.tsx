import { Button, Spinner, Text } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'spinner',
  name: 'Spinner',
  category: 'feedback',
  summary: 'An indeterminate loading indicator with an accessible status label.',
  description:
    'Use Spinner for short waits of unknown length, such as loading a list or saving. For longer operations with known progress use Progress, and for loading page structure use Skeleton. Buttons have a built-in `loading` state, so don’t put a Spinner inside a Button.',
  imports: ['Spinner'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic' },
    { name: 'Sizes', title: 'Sizes' },
    {
      name: 'WithText',
      title: 'With text',
      description: 'When visible text explains the wait, silence the spinner’s own label.',
    },
    { name: 'InButton', title: 'Loading buttons' },
  ],
  props: [
    {
      component: 'Spinner',
      name: 'size',
      type: "'xs' | 'sm' | 'md' | 'lg'",
      default: "'md'",
      description: '12, 16, 20 or 32px.',
    },
    {
      component: 'Spinner',
      name: 'label',
      type: 'string | null',
      default: "'Loading'",
      description: 'Status text announced; null when a parent announces state.',
    },
  ],
  accessibility: [
    'Exposes role="status" with an accessible label by default.',
    'Pass label={null} to hide it when nearby text already describes the wait.',
    'Rotation slows down, rather than stopping, under prefers-reduced-motion, so it still reads as loading.',
  ],
  guidelines: {
    do: ['Explain what is loading if it takes more than a second.'],
    dont: ['Show several spinners at once.'],
  },
  related: ['progress', 'skeleton', 'loading-overlay'],
};

export function Basic() {
  return <Spinner />;
}

export function Sizes() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <Spinner size="xs" />
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
    </div>
  );
}

export function WithText() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} role="status">
      <Spinner size="sm" label={null} />
      <Text size="sm" as="span" tone="muted">
        Syncing users from Microsoft 365…
      </Text>
    </div>
  );
}

export function InButton() {
  return (
    <Button loading loadingText="Deploying…">
      Deploy
    </Button>
  );
}

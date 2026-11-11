import { Button, Spacer, Text } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'spacer',
  name: 'Spacer',
  category: 'foundations',
  summary: 'Adds a fixed gap from the scale, or flexes to push siblings apart.',
  description:
    'Spacer is an escape hatch for the rare case where a gap belongs to one spot rather than to a whole group. In a flex row it grows to fill the remaining space, which pushes later items to the far edge. Prefer the `gap` prop of Stack and Inline wherever you can.',
  imports: ['Spacer'],
  status: 'stable',
  examples: [
    { name: 'Flexible', title: 'Flexible', layout: 'fill' },
    { name: 'Fixed', title: 'Fixed size', layout: 'start' },
    { name: 'Horizontal', title: 'Horizontal', layout: 'start' },
  ],
  props: [
    {
      component: 'Spacer',
      name: 'size',
      type: 'SpaceKey',
      description: 'Fixed size. Omit to flex.',
    },
    {
      component: 'Spacer',
      name: 'axis',
      type: "'vertical' | 'horizontal'",
      default: "'vertical'",
      description: 'Axis of a fixed spacer.',
    },
  ],
  accessibility: ['Spacer is aria-hidden and never focusable.'],
  guidelines: {
    do: ['Use a flexible spacer to push a trailing action to the end of a toolbar.'],
    dont: ['Chain spacers to build layouts; use Stack gap.'],
  },
  related: ['stack', 'inline'],
};

export function Flexible() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      <Text size="sm" weight="semibold">
        Signature templates
      </Text>
      <Spacer />
      <Button size="sm">New template</Button>
    </div>
  );
}

export function Fixed() {
  return (
    <div>
      <Text size="sm">Contract sent to legal@acme.com</Text>
      <Spacer size={6} />
      <Text size="sm" tone="muted">
        You’ll be notified when all parties have signed.
      </Text>
    </div>
  );
}

export function Horizontal() {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <Button variant="outline" size="sm">
        Back
      </Button>
      <Spacer size={4} axis="horizontal" />
      <Button size="sm">Next</Button>
    </div>
  );
}

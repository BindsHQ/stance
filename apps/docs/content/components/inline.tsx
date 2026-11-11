import type { ReactNode } from 'react';
import { Button, Inline, Kbd, Text } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

const Pill = ({ children }: { children: ReactNode }) => (
  <span
    style={{
      padding: '4px 10px',
      border: '1px solid var(--st-color-border-default)',
      borderRadius: 999,
      fontSize: 13,
    }}
  >
    {children}
  </span>
);

export const doc: ComponentDoc = {
  slug: 'inline',
  name: 'Inline',
  category: 'foundations',
  summary: 'Lays children out horizontally and wraps them, for tags, actions and metadata.',
  description:
    'Inline is a horizontal Stack that wraps by default and centres its items. Use it for groups that should reflow onto new lines on small screens: filters, tag lists, toolbars of buttons and metadata rows.',
  imports: ['Inline'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Wrapping group', layout: 'fill' },
    { name: 'Actions', title: 'Action group' },
    { name: 'Metadata', title: 'Metadata row' },
  ],
  props: [
    {
      component: 'Inline',
      name: 'as',
      type: 'keyof JSX.IntrinsicElements',
      default: "'div'",
      description: 'Element to render.',
    },
    {
      component: 'Inline',
      name: 'gap',
      type: 'SpaceKey',
      default: '2',
      description: 'Gap between children.',
    },
    {
      component: 'Inline',
      name: 'align',
      type: "'start' | 'center' | 'end' | 'stretch' | 'baseline'",
      default: "'center'",
      description: 'Cross-axis alignment.',
    },
    {
      component: 'Inline',
      name: 'justify',
      type: "'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'",
      description: 'Main-axis distribution.',
    },
    {
      component: 'Inline',
      name: 'wrap',
      type: 'boolean',
      default: 'true',
      description: 'Wrap onto new lines.',
    },
  ],
  accessibility: [
    'Visual wrapping does not change reading order.',
    'Use `as="ul"` for lists of tags so their count is announced.',
  ],
  guidelines: {
    do: ['Use for content that may wrap on small screens.'],
    dont: ['Use for vertical rhythm; use Stack.'],
  },
  related: ['stack', 'tag', 'toolbar'],
};

export function Basic() {
  return (
    <Inline gap={2}>
      {['Legal', 'Finance', 'Sales', 'Customer success', 'Engineering', 'People operations'].map(
        (d) => (
          <Pill key={d}>{d}</Pill>
        ),
      )}
    </Inline>
  );
}

export function Actions() {
  return (
    <Inline gap={2}>
      <Button variant="ghost">Cancel</Button>
      <Button variant="outline">Save draft</Button>
      <Button>Send for signature</Button>
    </Inline>
  );
}

export function Metadata() {
  return (
    <Inline gap={3}>
      <Text size="sm" tone="muted">
        Updated 4 Nov 2026
      </Text>
      <Text size="sm" tone="subtle" aria-hidden="true">
        ·
      </Text>
      <Text size="sm" tone="muted">
        Owner: Priya Raman
      </Text>
      <Text size="sm" tone="subtle" aria-hidden="true">
        ·
      </Text>
      <Text size="sm" tone="muted">
        Press <Kbd keys={['mod', 'k']} size="sm" /> to search
      </Text>
    </Inline>
  );
}

import type { ReactNode } from 'react';
import { Button, Stack, Text } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

const Tile = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      padding: '12px 16px',
      border: '1px dashed var(--st-color-border-strong)',
      borderRadius: 8,
      fontSize: 14,
    }}
  >
    {children}
  </div>
);

export const doc: ComponentDoc = {
  slug: 'stack',
  name: 'Stack',
  category: 'foundations',
  summary:
    'Arranges children in a vertical or horizontal flow with consistent, token-based spacing.',
  description:
    'Stack is the default way to space things apart. It owns the gap between children, so the children never need margins. Use `direction="row"` for horizontal groups, or `rowFrom` to switch from a column to a row at a breakpoint. For wrapping horizontal groups such as tags, use Inline.',
  imports: ['Stack'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', layout: 'fill' },
    {
      name: 'Responsive',
      title: 'Column to row',
      description: 'Stacks on phones and becomes a row from 768px.',
      layout: 'fill',
    },
    { name: 'Alignment', title: 'Alignment', layout: 'fill' },
  ],
  props: [
    {
      component: 'Stack',
      name: 'as',
      type: 'keyof JSX.IntrinsicElements',
      default: "'div'",
      description: 'Element to render, e.g. ul or form.',
    },
    {
      component: 'Stack',
      name: 'gap',
      type: 'SpaceKey',
      default: '4',
      description: 'Gap between children.',
    },
    {
      component: 'Stack',
      name: 'direction',
      type: "'column' | 'row'",
      default: "'column'",
      description: 'Flow direction.',
    },
    {
      component: 'Stack',
      name: 'align',
      type: "'start' | 'center' | 'end' | 'stretch' | 'baseline'",
      default: "'stretch'",
      description: 'Cross-axis alignment.',
    },
    {
      component: 'Stack',
      name: 'justify',
      type: "'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'",
      default: "'start'",
      description: 'Main-axis distribution.',
    },
    {
      component: 'Stack',
      name: 'wrap',
      type: 'boolean',
      default: 'false',
      description: 'Allow wrapping in row direction.',
    },
    {
      component: 'Stack',
      name: 'rowFrom',
      type: "'sm' | 'md' | 'lg'",
      description: 'Switch to a row from this breakpoint upwards.',
    },
  ],
  accessibility: [
    'Stack only changes visual layout. DOM order, and therefore reading and focus order, is unchanged.',
    'Render lists as lists: use `as="ul"` with `li` children when the items form a list.',
  ],
  guidelines: {
    do: [
      'Let Stack own spacing; remove margins from children.',
      'Nest stacks with smaller gaps for grouped content.',
    ],
    dont: ['Reorder content visually with CSS order; keep DOM order meaningful.'],
  },
  playground: {
    render: (p) => (
      <Stack
        gap={Number(p.gap) as 4}
        direction={p.direction as 'column'}
        align={p.align as 'stretch'}
      >
        <Tile>Draft</Tile>
        <Tile>In review</Tile>
        <Tile>Signed</Tile>
      </Stack>
    ),
    controls: {
      gap: { type: 'select', options: ['1', '2', '3', '4', '6', '8'], default: '4' },
      direction: { type: 'select', options: ['column', 'row'], default: 'column' },
      align: { type: 'select', options: ['stretch', 'start', 'center', 'end'], default: 'stretch' },
    },
  },
  related: ['inline', 'grid', 'spacer'],
};

export function Basic() {
  return (
    <Stack gap={3} style={{ width: '100%', maxWidth: 360 }}>
      <Tile>Choose a template</Tile>
      <Tile>Customise details</Tile>
      <Tile>Assign to users</Tile>
    </Stack>
  );
}

export function Responsive() {
  return (
    <Stack gap={4} rowFrom="md" style={{ width: '100%' }}>
      <Tile>Templates: 24</Tile>
      <Tile>Active users: 318</Tile>
      <Tile>Pending deployments: 3</Tile>
    </Stack>
  );
}

export function Alignment() {
  return (
    <Stack direction="row" justify="between" align="center" style={{ width: '100%' }}>
      <Text size="sm" weight="semibold">
        Organisation users
      </Text>
      <Button size="sm">Invite user</Button>
    </Stack>
  );
}

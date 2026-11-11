import { Box, Grid, Text } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

const Cell = ({ title, value }: { title: string; value: string }) => (
  <Box padding={4} background="surface" border radius="lg">
    <Text size="xs" tone="muted">
      {title}
    </Text>
    <Text size="xl" weight="semibold" tabular>
      {value}
    </Text>
  </Box>
);

export const doc: ComponentDoc = {
  slug: 'grid',
  name: 'Grid',
  category: 'foundations',
  summary:
    'Two-dimensional layout with fixed columns that collapse responsively, or fluid auto-fit tracks.',
  description:
    'Use Grid for dashboards, galleries and card collections. Fixed `columns` collapse to two columns on tablets and one on phones. `minChildWidth` instead fits as many columns as there is room for, which suits galleries of unknown size.',
  imports: ['Grid'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Fixed columns', layout: 'fill' },
    {
      name: 'Fluid',
      title: 'Fluid columns',
      description: 'Each cell is at least 160px wide; the number of columns follows the container.',
      layout: 'fill',
    },
    { name: 'TwoColumn', title: 'Two columns', layout: 'fill' },
  ],
  props: [
    {
      component: 'Grid',
      name: 'as',
      type: 'keyof JSX.IntrinsicElements',
      default: "'div'",
      description: 'Element to render.',
    },
    {
      component: 'Grid',
      name: 'columns',
      type: '1 | 2 | 3 | 4 | 5 | 6 | 12',
      description: 'Equal columns; collapses responsively.',
    },
    {
      component: 'Grid',
      name: 'minChildWidth',
      type: 'string',
      description: 'CSS length; enables fluid auto-fill tracks.',
    },
    {
      component: 'Grid',
      name: 'gap',
      type: 'SpaceKey',
      default: '4',
      description: 'Gap between cells.',
    },
    {
      component: 'Grid',
      name: 'rowGap',
      type: 'SpaceKey',
      description: 'Row gap; defaults to gap.',
    },
    {
      component: 'Grid',
      name: 'align',
      type: "'start' | 'center' | 'end' | 'stretch'",
      description: 'Vertical alignment of cells.',
    },
  ],
  accessibility: [
    'Grid is presentational; source order is the reading order on every screen size.',
    'For tabular data, use Table, not Grid.',
  ],
  guidelines: {
    do: ['Use fluid columns for galleries.', 'Keep related cells adjacent in source order.'],
    dont: ['Use Grid to lay out data that has row/column relationships; use Table.'],
  },
  playground: {
    render: (p) => (
      <Grid columns={Number(p.columns) as 3} gap={Number(p.gap) as 4} style={{ width: '100%' }}>
        {['Templates', 'Users', 'Deployments', 'Integrations', 'Signatures', 'Errors'].map(
          (t, i) => (
            <Cell key={t} title={t} value={String((i + 1) * 17)} />
          ),
        )}
      </Grid>
    ),
    controls: {
      columns: { type: 'select', options: ['1', '2', '3', '4', '6'], default: '3' },
      gap: { type: 'select', options: ['2', '3', '4', '6'], default: '4' },
    },
  },
  related: ['stack', 'stat-card', 'container'],
};

export function Basic() {
  return (
    <Grid columns={3} gap={4} style={{ width: '100%' }}>
      <Cell title="Active signatures" value="318" />
      <Cell title="Templates" value="24" />
      <Cell title="Pending deployments" value="3" />
    </Grid>
  );
}

export function Fluid() {
  return (
    <Grid minChildWidth="160px" gap={3} style={{ width: '100%' }}>
      {['Legal', 'Finance', 'Sales', 'Support', 'People', 'Marketing', 'Engineering'].map((d) => (
        <Cell key={d} title="Department" value={d} />
      ))}
    </Grid>
  );
}

export function TwoColumn() {
  return (
    <Grid columns={2} gap={6} style={{ width: '100%' }}>
      <Box padding={5} background="subtle" radius="lg">
        <Text size="sm">Contract details</Text>
      </Box>
      <Box padding={5} background="subtle" radius="lg">
        <Text size="sm">Signing parties</Text>
      </Box>
    </Grid>
  );
}

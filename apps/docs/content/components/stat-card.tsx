import { Icon, StatCard } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'stat-card',
  name: 'StatCard',
  category: 'data-display',
  summary: 'A single key metric with its change, period and an optional chart.',
  description:
    'Use StatCard at the top of dashboards for the few numbers that matter. The change is shown as a coloured badge and also announced in words, such as "up 12% from last month", so it never depends on colour. Use invert for metrics where a decrease is good.',
  imports: ['StatCard'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic' },
    { name: 'Dashboard', title: 'Dashboard row', layout: 'fill' },
    {
      name: 'Inverted',
      title: 'Down is good',
      description: 'invert flips the sentiment for metrics like failures or churn.',
    },
    { name: 'WithChart', title: 'With a sparkline' },
    { name: 'Loading', title: 'Loading' },
  ],
  props: [
    {
      component: 'StatCard',
      name: 'label',
      type: 'ReactNode',
      required: true,
      description: 'What is measured.',
    },
    {
      component: 'StatCard',
      name: 'value',
      type: 'ReactNode',
      required: true,
      description: 'The headline figure, pre-formatted.',
    },
    {
      component: 'StatCard',
      name: 'delta',
      type: 'ReactNode',
      description: 'Change since the comparison period.',
    },
    {
      component: 'StatCard',
      name: 'trend',
      type: "'up' | 'down' | 'neutral'",
      default: "'neutral'",
      description: 'Direction of change.',
    },
    {
      component: 'StatCard',
      name: 'invert',
      type: 'boolean',
      default: 'false',
      description: 'Treat down as positive.',
    },
    {
      component: 'StatCard',
      name: 'comparison',
      type: 'string',
      description: 'Period text, included in the announcement.',
    },
    {
      component: 'StatCard',
      name: 'icon',
      type: 'ReactNode',
      description: 'Icon beside the label.',
    },
    {
      component: 'StatCard',
      name: 'chart',
      type: 'ReactNode',
      description: 'Chart slot, e.g. a decorative sparkline.',
    },
    {
      component: 'StatCard',
      name: 'footer',
      type: 'ReactNode',
      description: 'Footer content such as a details link.',
    },
    {
      component: 'StatCard',
      name: 'loading',
      type: 'boolean',
      default: 'false',
      description: 'Show a placeholder and aria-busy.',
    },
  ],
  accessibility: [
    'The visible delta badge is hidden from screen readers and replaced with a sentence such as "up 12% from last month".',
    'Positive and negative sentiment are shown with colour and an arrow icon, never colour alone.',
    'Mark decorative charts aria-hidden. If the chart carries information not in the value, provide a text alternative.',
    'loading sets aria-busy on the card.',
  ],
  guidelines: {
    do: [
      'Format values with units and locale separators before passing them.',
      'Limit a row to four cards.',
    ],
    dont: ['Use StatCard for long text or lists.'],
  },
  playground: {
    render: (p) => (
      <StatCard
        label="Active signatures"
        value="1,284"
        delta={p.delta as string}
        trend={p.trend as 'up'}
        invert={p.invert as boolean}
        comparison="from last month"
        loading={p.loading as boolean}
        style={{ width: 280 }}
      />
    ),
    controls: {
      trend: { type: 'select', options: ['up', 'down', 'neutral'], default: 'up' },
      delta: { type: 'text', default: '12%' },
      invert: { type: 'boolean', default: false },
      loading: { type: 'boolean', default: false },
    },
  },
  related: ['card', 'chart-container', 'progress'],
};

export function Basic() {
  return (
    <StatCard
      label="Active signatures"
      value="1,284"
      delta="12%"
      trend="up"
      comparison="from last month"
      icon={<Icon name="pen-nib" />}
      style={{ width: 280 }}
    />
  );
}

export function Dashboard() {
  return (
    <div
      style={{
        display: 'grid',
        gap: 16,
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        width: '100%',
      }}
    >
      <StatCard label="Mailboxes" value="312" delta="4%" trend="up" comparison="this week" />
      <StatCard label="Templates" value="24" delta="0" comparison="this week" />
      <StatCard
        label="Contracts signed"
        value="58"
        delta="9%"
        trend="down"
        comparison="vs. October"
      />
    </div>
  );
}

export function Inverted() {
  return (
    <StatCard
      label="Failed deployments"
      value="3"
      delta="40%"
      trend="down"
      invert
      comparison="from last week"
      icon={<Icon name="alert-triangle" />}
      style={{ width: 280 }}
    />
  );
}

export function WithChart() {
  const points = [12, 18, 15, 22, 26, 24, 31, 35];
  const max = Math.max(...points);
  const d = points
    .map(
      (p, i) => `${i === 0 ? 'M' : 'L'}${(i / (points.length - 1)) * 100},${40 - (p / max) * 36}`,
    )
    .join(' ');
  return (
    <StatCard
      label="New users"
      value="35"
      delta="18%"
      trend="up"
      comparison="this week"
      chart={
        <svg viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
          <path
            d={d}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      }
      footer={<a href="#users">View all users</a>}
      style={{ width: 300 }}
    />
  );
}

export function Loading() {
  return <StatCard label="Contracts signed" value="58" loading style={{ width: 280 }} />;
}

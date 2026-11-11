import * as React from 'react';
import { Button, Progress } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'progress',
  name: 'Progress',
  category: 'feedback',
  summary: 'A linear progress bar for uploads, deployments and multi-step tasks.',
  description:
    'Use Progress when an operation takes more than a couple of seconds and you can measure it. Omit value for indeterminate work. Prefer formatted value text people understand, such as "12 of 48 users", over bare percentages.',
  imports: ['Progress'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', layout: 'fill' },
    { name: 'ValueText', title: 'Custom value text', layout: 'fill' },
    { name: 'Tones', title: 'Tones and sizes', layout: 'fill' },
    { name: 'Indeterminate', title: 'Indeterminate', layout: 'fill' },
    { name: 'Live', title: 'Live update', layout: 'fill' },
  ],
  props: [
    {
      component: 'Progress',
      name: 'value',
      type: 'number | null',
      description: 'Current value; null or omitted is indeterminate.',
    },
    {
      component: 'Progress',
      name: 'max',
      type: 'number',
      default: '100',
      description: 'Maximum value.',
    },
    {
      component: 'Progress',
      name: 'label',
      type: 'ReactNode',
      description: 'Visible label and accessible name.',
    },
    {
      component: 'Progress',
      name: 'showValue',
      type: 'boolean',
      default: 'false',
      description: 'Show the formatted value.',
    },
    {
      component: 'Progress',
      name: 'formatValue',
      type: '(value: number, max: number) => string',
      default: 'percentage',
      description: 'Display text and aria-valuetext.',
    },
    {
      component: 'Progress',
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
      default: "'md'",
      description: 'Track height 4, 8 or 12px.',
    },
    {
      component: 'Progress',
      name: 'tone',
      type: "'default' | 'success' | 'warning' | 'danger'",
      default: "'default'",
      description: 'Indicator colour.',
    },
  ],
  accessibility: [
    'Uses role="progressbar" with aria-valuemin, aria-valuemax, aria-valuenow and aria-valuetext.',
    'Indeterminate bars omit aria-valuenow, as the ARIA spec requires.',
    'Named by its visible label; pass aria-label when there is none.',
    'Indeterminate motion stops for people who prefer reduced motion.',
  ],
  guidelines: {
    do: ['Announce completion separately, e.g. with a Toast.'],
    dont: ['Use progress bars for scores or capacity; use a meter-style StatCard instead.'],
  },
  playground: {
    render: (p) => (
      <div style={{ width: 320 }}>
        <Progress
          label="Deploying signatures"
          value={p.value as number}
          showValue={p.showValue as boolean}
          size={p.size as 'md'}
          tone={p.tone as 'default'}
        />
      </div>
    ),
    controls: {
      value: { type: 'number', default: 64, min: 0, max: 100 },
      showValue: { type: 'boolean', default: true },
      size: { type: 'select', options: ['sm', 'md', 'lg'], default: 'md' },
      tone: {
        type: 'select',
        options: ['default', 'success', 'warning', 'danger'],
        default: 'default',
      },
    },
  },
  related: ['progress-circle', 'skeleton', 'loading-overlay'],
};

export function Basic() {
  return <Progress label="Uploading contract.pdf" value={64} showValue />;
}

export function ValueText() {
  return (
    <Progress
      label="Syncing users from Azure AD"
      value={12}
      max={48}
      showValue
      formatValue={(v, m) => `${v} of ${m} users`}
    />
  );
}

export function Tones() {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Progress label="Storage" value={42} size="sm" showValue />
      <Progress label="Mailboxes updated" value={100} tone="success" showValue />
      <Progress
        label="Seat usage"
        value={46}
        max={50}
        tone="warning"
        size="lg"
        showValue
        formatValue={(v, m) => `${v}/${m} seats`}
      />
      <Progress label="Deliveries failed" value={8} tone="danger" showValue />
    </div>
  );
}

export function Indeterminate() {
  return <Progress label="Connecting to Exchange relay" />;
}

export function Live() {
  const [value, setValue] = React.useState(0);
  React.useEffect(() => {
    if (value >= 100) return;
    const t = setTimeout(() => setValue((v) => Math.min(100, v + 7)), 300);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Progress
        label="Deploying Sales 2026"
        value={value}
        showValue
        tone={value >= 100 ? 'success' : 'default'}
      />
      <div>
        <Button size="sm" variant="outline" onClick={() => setValue(0)}>
          Restart
        </Button>
      </div>
    </div>
  );
}

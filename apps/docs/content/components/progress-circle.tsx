import { ProgressCircle } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'progress-circle',
  name: 'ProgressCircle',
  category: 'feedback',
  summary: 'A circular progress indicator, determinate or indeterminate.',
  description:
    'Use ProgressCircle where a bar does not fit: inside cards, next to file names or for compact completion scores. It needs an accessible name from aria-label or aria-labelledby.',
  imports: ['ProgressCircle'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic' },
    { name: 'Sizes', title: 'Sizes' },
    { name: 'Custom', title: 'Custom centre content and tone' },
    { name: 'Indeterminate', title: 'Indeterminate' },
  ],
  props: [
    {
      component: 'ProgressCircle',
      name: 'value',
      type: 'number | null',
      description: 'Current value; null or omitted is indeterminate.',
    },
    {
      component: 'ProgressCircle',
      name: 'max',
      type: 'number',
      default: '100',
      description: 'Maximum value.',
    },
    {
      component: 'ProgressCircle',
      name: 'size',
      type: "'sm' | 'md' | 'lg' | number",
      default: "'md'",
      description: '32, 48, 72px or a custom pixel size.',
    },
    {
      component: 'ProgressCircle',
      name: 'thickness',
      type: 'number',
      description: 'Ring thickness in px.',
    },
    {
      component: 'ProgressCircle',
      name: 'tone',
      type: "'default' | 'success' | 'warning' | 'danger'",
      default: "'default'",
      description: 'Indicator colour.',
    },
    {
      component: 'ProgressCircle',
      name: 'showValue',
      type: 'boolean',
      default: 'false',
      description: 'Show the value in the centre.',
    },
    {
      component: 'ProgressCircle',
      name: 'formatValue',
      type: '(value: number, max: number) => string',
      default: 'percentage',
      description: 'Value text.',
    },
    {
      component: 'ProgressCircle',
      name: 'children',
      type: 'ReactNode',
      description: 'Custom centre content (visual only).',
    },
  ],
  accessibility: [
    'role="progressbar" with value attributes and aria-valuetext.',
    'Centre content is aria-hidden, since the value is already announced through aria-valuetext.',
    'Always provide aria-label or aria-labelledby.',
  ],
  guidelines: {
    do: ['Use md or larger when showing the value inside.'],
    dont: ['Use as a decorative spinner; use Spinner.'],
  },
  playground: {
    render: (p) => (
      <ProgressCircle
        aria-label="Completion"
        value={p.value as number}
        size={p.size as 'md'}
        showValue={p.showValue as boolean}
        tone={p.tone as 'default'}
      />
    ),
    controls: {
      value: { type: 'number', default: 72, min: 0, max: 100 },
      size: { type: 'select', options: ['sm', 'md', 'lg'], default: 'lg' },
      showValue: { type: 'boolean', default: true },
      tone: {
        type: 'select',
        options: ['default', 'success', 'warning', 'danger'],
        default: 'default',
      },
    },
  },
  related: ['progress', 'spinner'],
};

export function Basic() {
  return <ProgressCircle aria-label="Profile completeness" value={75} showValue />;
}

export function Sizes() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <ProgressCircle aria-label="Small" value={40} size="sm" />
      <ProgressCircle aria-label="Medium" value={60} size="md" showValue />
      <ProgressCircle aria-label="Large" value={80} size="lg" showValue />
    </div>
  );
}

export function Custom() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <ProgressCircle
        aria-label="Seats used"
        value={46}
        max={50}
        size={96}
        tone="warning"
        formatValue={(v, m) => `${v} of ${m} seats`}
      >
        46/50
      </ProgressCircle>
      <ProgressCircle
        aria-label="Deployment complete"
        value={100}
        size="lg"
        tone="success"
        showValue
      />
    </div>
  );
}

export function Indeterminate() {
  return <ProgressCircle aria-label="Verifying domain" />;
}

import { Badge } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'badge',
  name: 'Badge',
  category: 'data-display',
  summary: 'A short, non-interactive status or count label in six tones and three variants.',
  description:
    'Use Badge to label status ("Deployed", "Pending") or counts. Tones are functional: success, warning, danger and info carry meaning, while neutral and inverse are for categorisation. Use Tag for removable keywords and Chip for selectable filters.',
  imports: ['Badge'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic' },
    { name: 'Tones', title: 'Tones and variants' },
    { name: 'Counts', title: 'Counts' },
    { name: 'Sizes', title: 'Sizes and dots' },
  ],
  props: [
    {
      component: 'Badge',
      name: 'tone',
      type: "'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'inverse'",
      default: "'neutral'",
      description: 'Meaning conveyed by colour; always pair with text.',
    },
    {
      component: 'Badge',
      name: 'variant',
      type: "'soft' | 'solid' | 'outline'",
      default: "'soft'",
      description: 'Fill style.',
    },
    {
      component: 'Badge',
      name: 'size',
      type: "'sm' | 'md'",
      default: "'md'",
      description: 'Height 18 or 22px.',
    },
    {
      component: 'Badge',
      name: 'dot',
      type: 'boolean',
      default: 'false',
      description: 'Leading status dot.',
    },
    {
      component: 'Badge',
      name: 'count',
      type: 'number',
      description: 'Numeric count when there are no children.',
    },
    {
      component: 'Badge',
      name: 'max',
      type: 'number',
      default: '99',
      description: 'Counts above max show as "max+".',
    },
  ],
  accessibility: [
    'Badges are static text. The tone is never the only signal; the label text carries the meaning.',
    'Give count-only badges context with aria-label, e.g. aria-label="12 unread notifications".',
    'Every tone and variant meets 4.5:1 text contrast in light, dark and high-contrast themes.',
  ],
  guidelines: {
    do: ['Keep labels to one or two words.', 'Use the same tone for the same status everywhere.'],
    dont: ['Make badges clickable; use Chip or Button.', 'Rely on tone without text.'],
  },
  playground: {
    render: (p) => (
      <Badge
        tone={p.tone as 'neutral'}
        variant={p.variant as 'soft'}
        size={p.size as 'md'}
        dot={p.dot as boolean}
      >
        {p.children as string}
      </Badge>
    ),
    controls: {
      tone: {
        type: 'select',
        options: ['neutral', 'info', 'success', 'warning', 'danger', 'inverse'],
        default: 'success',
      },
      variant: { type: 'select', options: ['soft', 'solid', 'outline'], default: 'soft' },
      size: { type: 'select', options: ['sm', 'md'], default: 'md' },
      dot: { type: 'boolean', default: true },
      children: { type: 'text', default: 'Deployed' },
    },
  },
  related: ['tag', 'chip'],
};

export function Basic() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <Badge tone="success" dot>
        Deployed
      </Badge>
      <Badge tone="warning" dot>
        Pending
      </Badge>
      <Badge tone="danger" dot>
        Failed
      </Badge>
      <Badge>Draft</Badge>
    </div>
  );
}

export function Tones() {
  const tones = ['neutral', 'info', 'success', 'warning', 'danger', 'inverse'] as const;
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {(['soft', 'solid', 'outline'] as const).map((v) => (
        <div key={v} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {tones.map((t) => (
            <Badge key={t} tone={t} variant={v}>
              {t}
            </Badge>
          ))}
        </div>
      ))}
    </div>
  );
}

export function Counts() {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <Badge count={3} tone="inverse" variant="solid" aria-label="3 unread notifications" />
      <Badge count={48} aria-label="48 users" />
      <Badge
        count={240}
        tone="danger"
        variant="solid"
        aria-label="More than 99 failed deliveries"
      />
    </div>
  );
}

export function Sizes() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Badge size="sm" tone="info" dot>
        Beta
      </Badge>
      <Badge size="md" tone="info" dot>
        Beta
      </Badge>
    </div>
  );
}

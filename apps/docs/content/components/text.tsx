import { Stack, Text } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'text',
  name: 'Text',
  category: 'typography',
  summary: 'Body copy with size, weight and semantic tone from the type scale.',
  description:
    'Text sets every piece of non-heading copy. Tones are semantic. Muted is for secondary information and subtle is for tertiary detail, and both meet AA contrast. The status tones are only for messages about state. It renders a paragraph by default; use `as="span"` inline.',
  imports: ['Text'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', layout: 'start' },
    { name: 'Tones', title: 'Tones', layout: 'start' },
    { name: 'Sizes', title: 'Sizes', layout: 'start' },
    { name: 'Truncation', title: 'Truncation and clamping', layout: 'start' },
  ],
  props: [
    {
      component: 'Text',
      name: 'as',
      type: 'keyof JSX.IntrinsicElements',
      default: "'p'",
      description: 'Element to render.',
    },
    {
      component: 'Text',
      name: 'size',
      type: "'2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'",
      default: "'md'",
      description: 'Font size token.',
    },
    {
      component: 'Text',
      name: 'weight',
      type: "'regular' | 'medium' | 'semibold' | 'bold'",
      description: 'Font weight token.',
    },
    {
      component: 'Text',
      name: 'tone',
      type: "'default' | 'muted' | 'subtle' | 'danger' | 'success' | 'warning' | 'inverse' | 'inherit'",
      default: "'default'",
      description: 'Semantic colour.',
    },
    {
      component: 'Text',
      name: 'align',
      type: "'start' | 'center' | 'end'",
      description: 'Alignment.',
    },
    {
      component: 'Text',
      name: 'truncate',
      type: 'boolean | number',
      description: 'true truncates one line; a number clamps lines.',
    },
    {
      component: 'Text',
      name: 'eyebrow',
      type: 'boolean',
      description: 'Uppercase label with wide tracking.',
    },
    {
      component: 'Text',
      name: 'tabular',
      type: 'boolean',
      description: 'Tabular figures for aligned numbers.',
    },
    {
      component: 'Text',
      name: 'leading',
      type: "'tight' | 'snug' | 'normal' | 'relaxed'",
      default: "'normal'",
      description: 'Line height.',
    },
  ],
  accessibility: [
    'Every tone meets WCAG AA (4.5:1) on canvas and surface backgrounds in all three themes.',
    'Never rely on colour alone. Pair status tones with an icon or words.',
    'Truncated text should be available in full elsewhere, such as a tooltip or detail view.',
  ],
  guidelines: {
    do: ['Use muted for secondary metadata.'],
    dont: [
      'Use subtle for essential information.',
      'Use danger tone for anything other than errors.',
    ],
  },
  playground: {
    render: (p) => (
      <Text size={p.size as 'md'} weight={p.weight as 'regular'} tone={p.tone as 'default'}>
        {p.children as string}
      </Text>
    ),
    controls: {
      size: { type: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'], default: 'md' },
      weight: {
        type: 'select',
        options: ['regular', 'medium', 'semibold', 'bold'],
        default: 'regular',
      },
      tone: {
        type: 'select',
        options: ['default', 'muted', 'subtle', 'danger', 'success', 'warning'],
        default: 'default',
      },
      children: { type: 'text', default: 'Signatures deploy to Outlook within five minutes.' },
    },
  },
  related: ['heading', 'caption'],
};

export function Basic() {
  return <Text>Signatures are deployed to every mailbox in your organisation automatically.</Text>;
}

export function Tones() {
  return (
    <Stack gap={2}>
      <Text tone="default">Default: primary content</Text>
      <Text tone="muted">Muted: secondary information</Text>
      <Text tone="subtle">Subtle: tertiary detail</Text>
      <Text tone="success">Success: deployment completed</Text>
      <Text tone="warning">Warning: 3 users missing a job title</Text>
      <Text tone="danger">Danger: Exchange connection failed</Text>
    </Stack>
  );
}

export function Sizes() {
  return (
    <Stack gap={2}>
      {(['xl', 'lg', 'md', 'sm', 'xs', '2xs'] as const).map((s) => (
        <Text key={s} size={s}>
          {s} — Consistent foundations
        </Text>
      ))}
    </Stack>
  );
}

export function Truncation() {
  return (
    <Stack gap={3} style={{ maxWidth: 280 }}>
      <Text size="sm" truncate>
        Master services agreement — Acme Holdings International Ltd (revised)
      </Text>
      <Text size="sm" truncate={2} tone="muted">
        This agreement governs the provision of design, engineering and support services between the
        parties listed in schedule one.
      </Text>
    </Stack>
  );
}

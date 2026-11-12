import { ConfidenceBadge } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'confidence-badge',
  name: 'ConfidenceBadge',
  category: 'ai',
  summary:
    'States how sure the system is about an answer in plain words, with a distinct icon for each level.',
  description:
    'Use ConfidenceBadge when your product has a real signal for how reliable an answer is, such as source agreement or a verification step. It says the level in words and gives each level its own icon shape, so the meaning never depends on colour. Leave it out when there is no signal behind it.',
  imports: ['ConfidenceBadge'],
  status: 'beta',
  examples: [
    { name: 'Levels', title: 'Levels' },
    {
      name: 'WithDescription',
      title: 'With an explanation',
      description:
        'description appears on hover and keyboard focus, and is read to screen readers.',
      minHeight: 140,
    },
    {
      name: 'CustomLabel',
      title: 'Your own words',
      description: 'label replaces the default words while keeping the level icon.',
    },
    { name: 'Sizes', title: 'Sizes and no icon' },
  ],
  props: [
    {
      component: 'ConfidenceBadge',
      name: 'level',
      type: "'high' | 'medium' | 'low' | 'unknown'",
      required: true,
      description: 'How sure the system is.',
    },
    {
      component: 'ConfidenceBadge',
      name: 'label',
      type: 'ReactNode',
      description: 'Overrides the words for this level.',
    },
    {
      component: 'ConfidenceBadge',
      name: 'description',
      type: 'string',
      description: 'A short explanation, shown in a tooltip. Makes the badge focusable.',
    },
    {
      component: 'ConfidenceBadge',
      name: 'showIcon',
      type: 'boolean',
      default: 'true',
      description: 'Show the level icon.',
    },
    {
      component: 'ConfidenceBadge',
      name: 'size',
      type: "'sm' | 'md'",
      default: "'md'",
      description: 'Badge size.',
    },
    {
      component: 'ConfidenceBadge',
      name: 'labels',
      type: 'Partial<ConfidenceBadgeLabels>',
      description: 'Translations for the four level names.',
    },
  ],
  accessibility: [
    'The level is always written out. Icons are decorative and differ by shape, so the badge reads the same without colour.',
    'It uses the neutral ink scale only; no red, amber or green.',
    'With a description the badge can be focused, and the explanation is linked to it as its accessible description.',
    'Without a description it is plain text and adds no tab stop.',
  ],
  keyboard: [
    {
      keys: ['Tab'],
      description: 'With a description: focuses the badge and shows the explanation.',
    },
    { keys: ['Esc'], description: 'Hides the explanation.' },
  ],
  guidelines: {
    do: [
      'Explain what the level is based on in the description.',
      'Use unknown when there is no signal, instead of guessing.',
    ],
    dont: ['Show a level your product cannot justify.', 'Use it as decoration on every message.'],
  },
  related: ['badge', 'ai-generated-label', 'source-list'],
};

export function Levels() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <ConfidenceBadge level="high" />
      <ConfidenceBadge level="medium" />
      <ConfidenceBadge level="low" />
      <ConfidenceBadge level="unknown" />
    </div>
  );
}

export function WithDescription() {
  return (
    <ConfidenceBadge
      level="low"
      description="Only one source mentions this figure, and it is two years old."
    />
  );
}

export function CustomLabel() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <ConfidenceBadge level="high" label="Matches 3 sources" />
      <ConfidenceBadge level="unknown" label="Not checked" />
    </div>
  );
}

export function Sizes() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
      <ConfidenceBadge level="high" size="sm" />
      <ConfidenceBadge level="high" size="md" />
      <ConfidenceBadge level="medium" showIcon={false} />
    </div>
  );
}

import { AIGeneratedLabel } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'ai-generated-label',
  name: 'AIGeneratedLabel',
  category: 'ai',
  summary:
    'A small label that marks content as generated, assisted or edited by AI, with an optional model name.',
  description:
    'Use AIGeneratedLabel wherever AI content sits beside content written by people: a drafted reply, a summary on a record, an edited paragraph. It says what happened in words, next to the sparkle icon, so readers always know what they are looking at.',
  imports: ['AIGeneratedLabel'],
  status: 'beta',
  examples: [
    { name: 'Variants', title: 'Variants' },
    {
      name: 'WithModel',
      title: 'With the model name',
      description: 'model is added in words after the label.',
    },
    { name: 'OnContent', title: 'On a summary', layout: 'fill' },
    { name: 'Sizes', title: 'Sizes and your own words' },
  ],
  props: [
    {
      component: 'AIGeneratedLabel',
      name: 'variant',
      type: "'generated' | 'assisted' | 'edited'",
      default: "'generated'",
      description: 'How AI took part in the content.',
    },
    {
      component: 'AIGeneratedLabel',
      name: 'label',
      type: 'ReactNode',
      description: 'Overrides the words for this variant.',
    },
    {
      component: 'AIGeneratedLabel',
      name: 'model',
      type: 'string',
      description: 'The name of the model, added after the label.',
    },
    {
      component: 'AIGeneratedLabel',
      name: 'size',
      type: "'sm' | 'md'",
      default: "'md'",
      description: 'Text size.',
    },
    {
      component: 'AIGeneratedLabel',
      name: 'showIcon',
      type: 'boolean',
      default: 'true',
      description: 'Show the sparkle icon.',
    },
    {
      component: 'AIGeneratedLabel',
      name: 'labels',
      type: 'Partial<AIGeneratedLabelLabels>',
      description:
        'Translations for the three variants and the template that joins label and model.',
    },
  ],
  accessibility: [
    'The label is plain text, so screen readers read it in place with the content it marks.',
    'The sparkle icon is decorative; the words carry the meaning.',
    'It uses muted ink that meets contrast in every theme, and system colours in forced colours mode.',
  ],
  guidelines: {
    do: [
      'Place it close to the content it describes, in the same position every time.',
      'Choose the variant that is true: generated, assisted or edited.',
    ],
    dont: [
      'Rely on the sparkle icon alone to mark AI content.',
      'Label content a person has fully rewritten as generated.',
    ],
  },
  related: ['disclaimer-note', 'confidence-badge', 'badge'],
};

export function Variants() {
  return (
    <div style={{ display: 'grid', gap: 10, justifyItems: 'start' }}>
      <AIGeneratedLabel variant="generated" />
      <AIGeneratedLabel variant="assisted" />
      <AIGeneratedLabel variant="edited" />
    </div>
  );
}

export function WithModel() {
  return <AIGeneratedLabel model="Atlas 2" />;
}

export function OnContent() {
  return (
    <div style={{ display: 'grid', gap: 8, width: '100%', maxWidth: 420 }}>
      <AIGeneratedLabel label="Summary by AI" size="sm" />
      <p style={{ margin: 0, lineHeight: 1.6 }}>
        The customer asked to move the renewal to March and add two seats. Finance approved the
        change on Tuesday.
      </p>
    </div>
  );
}

export function Sizes() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
      <AIGeneratedLabel size="sm" />
      <AIGeneratedLabel size="md" />
      <AIGeneratedLabel label="Drafted for you" showIcon={false} />
    </div>
  );
}

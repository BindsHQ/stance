import * as React from 'react';
import { Button, Icon, SuggestionChips } from '@bindshq/stance-react';
import type { SuggestionChipsItem } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'suggestion-chips',
  name: 'SuggestionChips',
  category: 'ai',
  summary:
    'A row of short follow up prompts or next actions that people can choose with one press, after an answer or beside content.',
  description:
    'Use SuggestionChips to offer the next step: a follow up question after an answer, or a few actions beside a record. Keep each chip to a few words and offer three or four at most. Choosing a chip reports it to your code and nothing else, so you decide whether it fills the composer or sends straight away.',
  imports: ['SuggestionChips'],
  status: 'beta',
  examples: [
    {
      name: 'Basic',
      title: 'Follow up prompts',
      description: 'Choose a chip to see what was selected.',
      layout: 'fill',
    },
    {
      name: 'WithIcons',
      title: 'With icons',
      layout: 'fill',
    },
    {
      name: 'Loading',
      title: 'Loading',
      description: 'Placeholders hold the space while suggestions are prepared.',
      layout: 'fill',
    },
    {
      name: 'SingleRow',
      title: 'Single row',
      description: 'With wrap off the row scrolls sideways, which suits narrow panels.',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'SuggestionChips',
      name: 'items',
      type: 'SuggestionChipsItem[]',
      required: true,
      description: 'The prompts or actions to offer. Each has an id, a label and an optional icon.',
    },
    {
      component: 'SuggestionChips',
      name: 'onSelect',
      type: '(item: SuggestionChipsItem) => void',
      description: 'Called with the chip the person chose.',
    },
    {
      component: 'SuggestionChips',
      name: 'loading',
      type: 'boolean',
      default: 'false',
      description: 'Shows placeholders while suggestions are being prepared.',
    },
    {
      component: 'SuggestionChips',
      name: 'wrap',
      type: 'boolean',
      default: 'true',
      description: 'Wrap onto more lines. When false the row scrolls sideways.',
    },
    {
      component: 'SuggestionChips',
      name: 'label',
      type: 'string',
      default: "'Suggestions'",
      description: 'Accessible name of the group.',
    },
    {
      component: 'SuggestionChips',
      name: 'loadingLabel',
      type: 'string',
      default: "'Loading suggestions'",
      description: 'Read by screen readers while loading.',
    },
    {
      component: 'SuggestionChips',
      name: 'size',
      type: "'sm' | 'md'",
      default: "'md'",
      description: 'Chip height: sm 28, md 32.',
    },
    {
      component: 'SuggestionChips',
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Disables every chip, for example while an answer is streaming.',
    },
    {
      component: 'SuggestionChips',
      name: 'loadingCount',
      type: 'number',
      default: '3',
      description: 'How many placeholders to show while loading.',
    },
  ],
  accessibility: [
    'The chips are a named group with a list of real buttons.',
    'While loading the group is busy and a status says so in words.',
    'Choosing a chip never moves focus on its own.',
    'Chips are at least 44px tall on touch screens.',
    'With reduced motion the placeholders do not pulse.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Moves from chip to chip.' },
    { keys: ['Enter', 'Space'], description: 'Chooses the focused chip.' },
  ],
  guidelines: {
    do: [
      'Write each chip as something the person would say or do.',
      'Offer three or four chips that are clearly different.',
    ],
    dont: [
      'Use chips for navigation or filters; use Tabs or FilterChip.',
      'Change the chips while the person is reaching for one.',
    ],
  },
  related: ['prompt-composer', 'thread-empty-state', 'ask-bar', 'chip'],
};

const followUps: SuggestionChipsItem[] = [
  { id: 'shorter', label: 'Make it shorter' },
  { id: 'table', label: 'Show it as a table' },
  { id: 'next', label: 'What should I do next?' },
];

export function Basic() {
  const [chosen, setChosen] = React.useState<string | null>(null);
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 520 }}>
      <SuggestionChips items={followUps} onSelect={(item) => setChosen(item.label)} />
      <p style={{ margin: 0, fontSize: 14 }}>
        {chosen ? `You chose: ${chosen}` : 'Nothing chosen yet.'}
      </p>
    </div>
  );
}

export function WithIcons() {
  return (
    <div style={{ width: '100%', maxWidth: 520 }}>
      <SuggestionChips
        label="Next actions"
        items={[
          { id: 'email', label: 'Draft a reply', icon: <Icon name="mail" size={14} /> },
          { id: 'remind', label: 'Set a reminder', icon: <Icon name="clock" size={14} /> },
          { id: 'file', label: 'Attach the contract', icon: <Icon name="paperclip" size={14} /> },
        ]}
      />
    </div>
  );
}

export function Loading() {
  const [loading, setLoading] = React.useState(true);
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 520 }}>
      <SuggestionChips items={followUps} loading={loading} />
      <div>
        <Button size="sm" variant="outline" onClick={() => setLoading((v) => !v)}>
          {loading ? 'Show suggestions' : 'Load again'}
        </Button>
      </div>
    </div>
  );
}

export function SingleRow() {
  return (
    <div style={{ width: '100%', maxWidth: 320 }}>
      <SuggestionChips items={followUps} wrap={false} size="sm" />
    </div>
  );
}

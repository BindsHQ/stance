import * as React from 'react';
import { TokenBudgetMeter } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'token-budget-meter',
  name: 'TokenBudgetMeter',
  category: 'ai',
  summary:
    'A compact meter of how much of the context or message limit is used, with a warning in words as the limit gets close.',
  description:
    'Use TokenBudgetMeter in the footer of PromptComposer when a limit can stop people from sending, or when a long conversation is about to lose its earliest messages. Most people do not think in tokens: use format to speak in words, messages or a percentage where that is clearer.',
  imports: ['TokenBudgetMeter'],
  status: 'beta',
  examples: [
    {
      name: 'Basic',
      title: 'Ring',
      description:
        'Move the slider past 80 percent to see the warning, and past the limit to see the over state.',
    },
    {
      name: 'Variants',
      title: 'Ring, bar and text',
      layout: 'fill',
    },
    {
      name: 'CustomFormat',
      title: 'Custom format and threshold',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'TokenBudgetMeter',
      name: 'used',
      type: 'number',
      required: true,
      description: 'How much of the budget is used.',
    },
    {
      component: 'TokenBudgetMeter',
      name: 'limit',
      type: 'number',
      required: true,
      description: 'The size of the budget, in the same unit.',
    },
    {
      component: 'TokenBudgetMeter',
      name: 'warnAt',
      type: 'number',
      default: '0.8',
      description: 'Share of the limit, from 0 to 1, at which the warning starts.',
    },
    {
      component: 'TokenBudgetMeter',
      name: 'format',
      type: '(used: number, limit: number) => string',
      description:
        'Formats the value for display and for assistive technology. The default reads “1,200 of 8,000 tokens”.',
    },
    {
      component: 'TokenBudgetMeter',
      name: 'label',
      type: 'string',
      default: "'Context used'",
      description: 'Accessible name of the meter.',
    },
    {
      component: 'TokenBudgetMeter',
      name: 'variant',
      type: "'ring' | 'bar' | 'text'",
      default: "'ring'",
      description: 'A small ring, a bar with the value, or the value as text.',
    },
    {
      component: 'TokenBudgetMeter',
      name: 'showValue',
      type: 'boolean',
      default: 'false',
      description:
        'Show the formatted value beside the ring. The bar and text variants always show it.',
    },
    {
      component: 'TokenBudgetMeter',
      name: 'labels',
      type: 'Partial<TokenBudgetMeterLabels>',
      description: 'Translations: warning and over.',
    },
  ],
  accessibility: [
    'A meter with a name, a range and a value text that states the usage in words, including the warning.',
    'The warning is an icon and text as well as a colour change, so it never depends on colour alone.',
    'Reaching the warning threshold is announced politely once. It is announced again only after usage drops below the threshold and reaches it again.',
    'Going over the limit is announced once as its own message.',
    'With reduced motion the ring and bar change without animation. In forced colours they use system colours.',
  ],
  guidelines: {
    do: [
      'Say what happens at the limit, near the meter or in the warning label.',
      'Use the text variant when space is tight and the number matters.',
    ],
    dont: [
      'Show a meter when there is no limit people can reach.',
      'Rely on the ring alone to say a message is too long; block sending and explain why.',
    ],
  },
  related: ['prompt-composer', 'progress', 'progress-circle'],
};

export function Basic() {
  const [used, setUsed] = React.useState(5200);
  return (
    <div style={{ display: 'grid', gap: 16, justifyItems: 'start' }}>
      <TokenBudgetMeter used={used} limit={8000} showValue />
      <label style={{ display: 'grid', gap: 4 }}>
        Tokens used
        <input
          type="range"
          min={0}
          max={9000}
          step={100}
          value={used}
          onChange={(event) => setUsed(Number(event.target.value))}
        />
      </label>
    </div>
  );
}

export function Variants() {
  return (
    <div style={{ display: 'grid', gap: 20, width: '100%', maxWidth: 360 }}>
      <TokenBudgetMeter used={2400} limit={8000} label="Context used, ring" />
      <TokenBudgetMeter used={6900} limit={8000} variant="bar" label="Context used, bar" />
      <TokenBudgetMeter used={8400} limit={8000} variant="text" label="Context used, text" />
    </div>
  );
}

export function CustomFormat() {
  return (
    <div style={{ display: 'grid', gap: 20, width: '100%', maxWidth: 360 }}>
      <TokenBudgetMeter
        used={18}
        limit={20}
        warnAt={0.75}
        variant="bar"
        label="Messages today"
        format={(used, limit) => `${used} of ${limit} messages today`}
        labels={{ warning: 'Two messages left', over: 'Daily limit reached' }}
      />
      <TokenBudgetMeter
        used={3100}
        limit={4000}
        variant="text"
        label="Message length"
        format={(used, limit) => `${Math.round((used / limit) * 100)}% of the message limit`}
      />
    </div>
  );
}

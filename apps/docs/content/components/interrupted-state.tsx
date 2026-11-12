import * as React from 'react';
import { InterruptedState } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'interrupted-state',
  name: 'InterruptedState',
  category: 'ai',
  summary:
    'Marks a response that was stopped or failed part way, and offers to try again or continue.',
  description:
    'Place InterruptedState directly under a response that did not finish, so it is clear the text above is incomplete and what can be done about it. Keep what was already written. Use the reason to tell a stop the reader chose apart from a failure.',
  imports: ['InterruptedState'],
  status: 'beta',
  examples: [
    {
      name: 'Basic',
      title: 'Stopped by the reader',
      layout: 'fill',
    },
    {
      name: 'Reasons',
      title: 'Reasons',
      description: 'Errors and lost connections are alerts. A stop or a limit is a quiet status.',
      layout: 'fill',
    },
    {
      name: 'Custom',
      title: 'Custom text and actions',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'InterruptedState',
      name: 'reason',
      type: "'stopped' | 'error' | 'network' | 'limit'",
      default: "'stopped'",
      description: 'Why the response ended early.',
    },
    {
      component: 'InterruptedState',
      name: 'title',
      type: 'React.ReactNode',
      description: 'Overrides the default title for the reason.',
    },
    {
      component: 'InterruptedState',
      name: 'description',
      type: 'React.ReactNode',
      description: 'A short explanation or next step.',
    },
    {
      component: 'InterruptedState',
      name: 'onRetry',
      type: '() => void',
      description: 'Shows a retry button and is called when it is pressed.',
    },
    {
      component: 'InterruptedState',
      name: 'onContinue',
      type: '() => void',
      description: 'Shows a continue button and is called when it is pressed.',
    },
    {
      component: 'InterruptedState',
      name: 'children',
      type: 'React.ReactNode',
      description: 'Extra actions, shown after the buttons.',
    },
    {
      component: 'InterruptedState',
      name: 'labels',
      type: 'Partial<InterruptedStateLabels>',
      description:
        'Translations: the default titles stopped, error, network and limit, and the buttons retry and continue.',
    },
  ],
  accessibility: [
    'Errors and lost connections are an alert and are announced at once. A stop or a limit is a polite status.',
    'Only the message is live. The buttons are not read out with it.',
    'The reason is given in words and with an icon, never by colour alone.',
    'Retry and Continue are real buttons with visible labels.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Moves between Continue, Try again and any extra actions.' },
    { keys: ['Enter', 'Space'], description: 'Activates the focused button.' },
  ],
  guidelines: {
    do: [
      'Keep the partial response on screen above it.',
      'Say what happened and what to do next in plain words.',
    ],
    dont: [
      'Use the error reason when the reader pressed stop.',
      'Offer Continue when the response cannot be picked up where it ended.',
    ],
  },
  related: ['message', 'stop-button', 'alert', 'generation-progress'],
};

export function Basic() {
  const [count, setCount] = React.useState(0);
  return (
    <div style={{ display: 'grid', gap: 8, width: '100%', maxWidth: 520 }}>
      <InterruptedState onContinue={() => setCount((c) => c + 1)} onRetry={() => setCount(0)} />
      <span style={{ fontSize: 13 }}>Continued {count} times</span>
    </div>
  );
}

export function Reasons() {
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 520 }}>
      <InterruptedState reason="error" description="Nothing was lost." onRetry={() => {}} />
      <InterruptedState
        reason="network"
        description="Check your connection, then try again."
        onRetry={() => {}}
      />
      <InterruptedState
        reason="limit"
        description="This answer reached the longest length allowed."
        onContinue={() => {}}
      />
    </div>
  );
}

export function Custom() {
  return (
    <div style={{ width: '100%', maxWidth: 520 }}>
      <InterruptedState
        reason="limit"
        title="You have used all messages for today"
        description="Your limit resets at midnight."
      >
        <a href="#plans">See plans</a>
      </InterruptedState>
    </div>
  );
}

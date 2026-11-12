import * as React from 'react';
import { ThinkingIndicator } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'thinking-indicator',
  name: 'ThinkingIndicator',
  category: 'ai',
  summary:
    'Shows that the assistant is working before any text arrives, with a label and optional elapsed time.',
  description:
    'Show ThinkingIndicator from the moment a message is sent until the first text arrives, then replace it with the response. Change the label to say what is happening when you know. For a block of expected text use StreamingSkeleton, and for a measured task use GenerationProgress.',
  imports: ['ThinkingIndicator'],
  status: 'beta',
  examples: [
    { name: 'Basic', title: 'Thinking' },
    {
      name: 'Variants',
      title: 'Variants',
      description: 'Dots, a breathing sparkle, or a light sweep over the label.',
    },
    {
      name: 'Elapsed',
      title: 'Elapsed time',
      description: 'The time is shown and is not read out as it changes.',
    },
    { name: 'Sizes', title: 'Sizes and a hidden label' },
  ],
  props: [
    {
      component: 'ThinkingIndicator',
      name: 'label',
      type: 'React.ReactNode',
      default: "'Thinking'",
      description: 'What the assistant is doing.',
    },
    {
      component: 'ThinkingIndicator',
      name: 'variant',
      type: "'dots' | 'pulse' | 'shimmer'",
      default: "'dots'",
      description: 'The motion: three dots, a breathing sparkle, or a light sweep over the label.',
    },
    {
      component: 'ThinkingIndicator',
      name: 'elapsed',
      type: 'number',
      description: 'Seconds since the work began, shown after the label.',
    },
    {
      component: 'ThinkingIndicator',
      name: 'size',
      type: "'sm' | 'md'",
      default: "'md'",
      description: 'Text and mark size.',
    },
    {
      component: 'ThinkingIndicator',
      name: 'hideLabel',
      type: 'boolean',
      default: 'false',
      description: 'Hides the label visually. It stays available to assistive technology.',
    },
    {
      component: 'ThinkingIndicator',
      name: 'formatElapsed',
      type: '(seconds: number) => string',
      description: 'Formats the elapsed time. Default "8s", then "1m 05s".',
    },
  ],
  accessibility: [
    'It is a polite status, so the label is announced once when it appears and again only when the label changes.',
    'The elapsed time is hidden from assistive technology, so a ticking clock is never read out.',
    'With reduced motion the mark is static and the label carries the meaning.',
    'The label is always present for assistive technology, also when hidden visually.',
  ],
  guidelines: {
    do: [
      'Say what is happening when you know: Searching the web, Reading the file.',
      'Remove it as soon as the first text arrives.',
    ],
    dont: [
      'Show it next to text that is already streaming.',
      'Change the label many times a second; each change is announced.',
    ],
  },
  related: ['streaming-skeleton', 'shimmer-text', 'reasoning-disclosure', 'generation-progress'],
};

export function Basic() {
  return <ThinkingIndicator />;
}

export function Variants() {
  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
      <ThinkingIndicator variant="dots" />
      <ThinkingIndicator variant="pulse" label="Reading the agreement" />
      <ThinkingIndicator variant="shimmer" label="Searching the web" />
    </div>
  );
}

export function Elapsed() {
  const [seconds, setSeconds] = React.useState(0);
  React.useEffect(() => {
    const timer = window.setInterval(() => setSeconds((s) => (s + 1) % 90), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return <ThinkingIndicator variant="pulse" elapsed={seconds} />;
}

export function Sizes() {
  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
      <ThinkingIndicator size="sm" />
      <ThinkingIndicator size="md" />
      <ThinkingIndicator hideLabel />
    </div>
  );
}

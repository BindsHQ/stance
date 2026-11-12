import * as React from 'react';
import { StopButton } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'stop-button',
  name: 'StopButton',
  category: 'ai',
  summary:
    'A button that stops a response while it is being generated, as text with a stop mark or as the mark alone.',
  description:
    'Show StopButton for as long as a response is being generated, where people can reach it without scrolling. PromptComposer already turns its send button into a stop button, so use StopButton on its own for other places: under a streaming message, or beside a long running task.',
  imports: ['StopButton'],
  status: 'beta',
  examples: [
    {
      name: 'Basic',
      title: 'Stop a response',
    },
    {
      name: 'IconOnly',
      title: 'Icon only',
      description: 'The label stays as the accessible name and the tooltip.',
    },
    {
      name: 'Variants',
      title: 'Sizes and variants',
    },
    {
      name: 'WhileGenerating',
      title: 'Shown only while generating',
      description:
        'Keep the button in the same place for the whole response so it is easy to find.',
    },
  ],
  props: [
    {
      component: 'StopButton',
      name: 'onStop',
      type: '() => void',
      description: 'Called when the reader asks to stop the response.',
    },
    {
      component: 'StopButton',
      name: 'label',
      type: 'string',
      default: "'Stop'",
      description: 'The visible text, or the accessible name when iconOnly.',
    },
    {
      component: 'StopButton',
      name: 'size',
      type: "'xs' | 'sm' | 'md' | 'lg'",
      default: "'sm'",
      description: 'Control height: 24, 32, 40 or 48 pixels.',
    },
    {
      component: 'StopButton',
      name: 'variant',
      type: "'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'",
      default: "'secondary'",
      description: 'Visual weight.',
    },
    {
      component: 'StopButton',
      name: 'iconOnly',
      type: 'boolean',
      default: 'false',
      description: 'Show only the stop mark.',
    },
    {
      component: 'StopButton',
      name: 'pill',
      type: 'boolean',
      default: 'false',
      description: 'Round the button fully.',
    },
    {
      component: 'StopButton',
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Turns the button off, for example once stopping has been requested.',
    },
  ],
  accessibility: [
    'A native button, so it works with Enter and Space and is announced as a button named Stop.',
    'With iconOnly the label is still the accessible name, so the action is never conveyed by the mark alone.',
    'The stop mark is solid and inherits the text colour, so it stays visible in high contrast and forced colours.',
    'On touch screens the target grows to 44 pixels.',
  ],
  keyboard: [
    {
      keys: ['Enter', 'Space'],
      description: 'Stops the response.',
    },
  ],
  guidelines: {
    do: [
      'Show it for the whole time a response is being generated.',
      'Say what stops when it is not obvious: “Stop search”, “Stop export”.',
    ],
    dont: [
      'Move it as text streams in; keep it where it first appeared.',
      'Use it to cancel a form or close a dialog; use a plain Button.',
    ],
  },
  related: ['prompt-composer', 'button', 'icon-button'],
};

export function Basic() {
  return <StopButton onStop={() => {}} />;
}

export function IconOnly() {
  return <StopButton iconOnly pill label="Stop response" onStop={() => {}} />;
}

export function Variants() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
      <StopButton size="xs" variant="ghost" />
      <StopButton size="sm" />
      <StopButton size="md" variant="outline" label="Stop generating" />
      <StopButton size="lg" variant="primary" pill />
    </div>
  );
}

export function WhileGenerating() {
  const [generating, setGenerating] = React.useState(true);
  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
      <p style={{ margin: 0 }}>{generating ? 'Writing a summary of the contract' : 'Stopped.'}</p>
      {generating ? (
        <StopButton onStop={() => setGenerating(false)} />
      ) : (
        <button type="button" onClick={() => setGenerating(true)}>
          Start again
        </button>
      )}
    </div>
  );
}

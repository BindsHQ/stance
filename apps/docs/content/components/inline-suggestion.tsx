import * as React from 'react';
import { InlineSuggestion, Input, Switch } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'inline-suggestion',
  name: 'InlineSuggestion',
  category: 'ai',
  summary:
    'Ghost text that completes what you are typing in a field. Tab accepts it, Escape dismisses it and typing carries on undisturbed.',
  description:
    'Use InlineSuggestion to offer a completion inside an input or a text area. The suggestion is drawn after the typed text and is never part of the value until the person accepts it. It never moves focus and never blocks typing. Your code decides what to suggest and what accepting does.',
  imports: ['InlineSuggestion'],
  status: 'beta',
  examples: [
    {
      name: 'Basic',
      title: 'Complete a sentence',
      description: 'Click into the field. Tab accepts, Escape dismisses.',
      layout: 'fill',
    },
    {
      name: 'WordByWord',
      title: 'Accept word by word',
      description: 'Ctrl or Cmd plus Right takes one word at a time.',
      layout: 'fill',
    },
    {
      name: 'WrappedField',
      title: 'Around your own field',
      description: 'Wrap an Input or Textarea you already have.',
      layout: 'fill',
    },
    {
      name: 'Loading',
      title: 'Loading',
      description: 'A quiet mark shows that a suggestion is on its way.',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'InlineSuggestion',
      name: 'value',
      type: 'string',
      required: true,
      description:
        'The text in the field. The suggestion is drawn after it and is never part of it.',
    },
    {
      component: 'InlineSuggestion',
      name: 'suggestion',
      type: 'string',
      description: 'The completion that would follow the value. Empty shows nothing.',
    },
    {
      component: 'InlineSuggestion',
      name: 'onAccept',
      type: '(suggestion: string) => void',
      description: 'Called with the whole suggestion on Tab. Append it to the value.',
    },
    {
      component: 'InlineSuggestion',
      name: 'onAcceptWord',
      type: '(word: string, rest: string) => void',
      description: 'Called with the next word and what is left, on Ctrl or Cmd plus Right.',
    },
    {
      component: 'InlineSuggestion',
      name: 'onDismiss',
      type: '() => void',
      description: 'Called on Escape. The ghost text hides until the suggestion changes.',
    },
    {
      component: 'InlineSuggestion',
      name: 'loading',
      type: 'boolean',
      default: 'false',
      description: 'A suggestion is on its way. Shows a quiet mark after the text.',
    },
    {
      component: 'InlineSuggestion',
      name: 'children',
      type: 'React.ReactElement',
      description:
        'The field: an input or textarea, or a Stance Input or Textarea. Omit it to render one.',
    },
    {
      component: 'InlineSuggestion',
      name: 'onValueChange',
      type: '(value: string) => void',
      description: 'Called with the new text when the built in field changes.',
    },
    {
      component: 'InlineSuggestion',
      name: 'multiline',
      type: 'boolean',
      default: 'false',
      description: 'Render the built in field as a text area.',
    },
    {
      component: 'InlineSuggestion',
      name: 'placeholder',
      type: 'string',
      description: 'Placeholder of the built in field.',
    },
    {
      component: 'InlineSuggestion',
      name: 'disabled',
      type: 'boolean',
      description: 'Disables the built in field.',
    },
    {
      component: 'InlineSuggestion',
      name: 'fieldProps',
      type: 'React.InputHTMLAttributes & React.TextareaHTMLAttributes',
      description: 'Extra props for the built in field, such as aria-label, name or rows.',
    },
    {
      component: 'InlineSuggestion',
      name: 'fieldRef',
      type: 'React.Ref<HTMLInputElement | HTMLTextAreaElement>',
      description: 'Ref to the input or textarea element.',
    },
    {
      component: 'InlineSuggestion',
      name: 'showHint',
      type: 'boolean',
      default: 'true',
      description: 'Show the accept key after the ghost text. Tapping it accepts on touch screens.',
    },
    {
      component: 'InlineSuggestion',
      name: 'labels',
      type: 'Partial<InlineSuggestionLabels>',
      description: 'Translations: announce(suggestion) and acceptKey.',
    },
  ],
  accessibility: [
    'The ghost text is hidden from assistive technology and is never part of the field value.',
    'A new suggestion is announced politely with how to accept it, and only while the field has focus.',
    'Typing through a suggestion does not announce it again.',
    'The suggestion hides while an input method is composing, and its keys are left alone.',
    'Tab only accepts while a suggestion shows; otherwise it moves focus as usual. Shift Tab always moves focus.',
    'The ghost text mirrors the field in both text directions. In high contrast it is underlined as well as dimmed.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Accepts the whole suggestion.' },
    {
      keys: ['Ctrl', 'Right'],
      description: 'Accepts the next word. Cmd on a Mac, and Left in right to left text.',
    },
    { keys: ['Escape'], description: 'Dismisses the suggestion.' },
  ],
  guidelines: {
    do: [
      'Suggest only when you are fairly sure; a wrong guess is worse than none.',
      'Keep suggestions short enough to read at a glance.',
    ],
    dont: [
      'Change the value before the person accepts.',
      'Show a suggestion when the caret is in the middle of the text.',
    ],
  },
  related: ['smart-field', 'prompt-composer', 'input', 'textarea'],
};

const sentence = 'Thanks for your patience while we looked into this.';

function completion(value: string): string {
  if (value.length < 3 || !sentence.toLowerCase().startsWith(value.toLowerCase())) return '';
  return sentence.slice(value.length);
}

export function Basic() {
  const [value, setValue] = React.useState('Thanks for');
  return (
    <div style={{ width: '100%', maxWidth: 480 }}>
      <InlineSuggestion
        value={value}
        suggestion={completion(value)}
        onValueChange={setValue}
        onAccept={(text) => setValue(value + text)}
        fieldProps={{ 'aria-label': 'Reply' }}
      />
    </div>
  );
}

export function WordByWord() {
  const [value, setValue] = React.useState('Thanks');
  return (
    <div style={{ width: '100%', maxWidth: 480 }}>
      <InlineSuggestion
        multiline
        value={value}
        suggestion={completion(value)}
        onValueChange={setValue}
        onAccept={(text) => setValue(value + text)}
        onAcceptWord={(word) => setValue(value + word)}
        fieldProps={{ 'aria-label': 'Message', rows: 3 }}
      />
    </div>
  );
}

export function WrappedField() {
  const [value, setValue] = React.useState('Tha');
  return (
    <div style={{ width: '100%', maxWidth: 480 }}>
      <InlineSuggestion
        value={value}
        suggestion={completion(value)}
        onAccept={(text) => setValue(value + text)}
      >
        <Input
          aria-label="Subject"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </InlineSuggestion>
    </div>
  );
}

export function Loading() {
  const [loading, setLoading] = React.useState(true);
  const [value, setValue] = React.useState('Thanks for');
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 480 }}>
      <InlineSuggestion
        value={value}
        loading={loading}
        suggestion={loading ? '' : completion(value)}
        onValueChange={setValue}
        onAccept={(text) => setValue(value + text)}
        fieldProps={{ 'aria-label': 'Reply' }}
      />
      <Switch label="Loading" checked={loading} onCheckedChange={setLoading} />
    </div>
  );
}

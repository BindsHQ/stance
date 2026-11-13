import * as React from 'react';
import { AskBar } from '@bindshq/stance-react';
import type { AskBarSuggestion, GenerationStatus } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'ask-bar',
  name: 'AskBar',
  category: 'ai',
  summary:
    'A one line bar for asking a question about a page or a product, with suggested questions under it and the answer shown in place.',
  description:
    'Use AskBar where a single question is enough: on top of a help centre, a report or a record. It suggests questions as you type, and the answer appears under the bar without leaving the page. For a conversation with history, use Thread and PromptComposer.',
  imports: ['AskBar'],
  status: 'beta',
  examples: [
    {
      name: 'Basic',
      title: 'Ask and answer',
      description: 'Ask a question or choose a suggestion. The answer streams in under the bar.',
      layout: 'fill',
      minHeight: 320,
    },
    {
      name: 'Shortcut',
      title: 'With a shortcut',
      description: 'The shortcut moves focus to the field from anywhere on the page.',
      layout: 'fill',
    },
    {
      name: 'States',
      title: 'Stopped and failed',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'AskBar',
      name: 'value',
      type: 'string',
      description: 'The question in the field. Controlled.',
    },
    {
      component: 'AskBar',
      name: 'defaultValue',
      type: 'string',
      default: "''",
      description: 'The question on first render when uncontrolled.',
    },
    {
      component: 'AskBar',
      name: 'onValueChange',
      type: '(value: string) => void',
      description: 'Called when the question changes.',
    },
    {
      component: 'AskBar',
      name: 'onSubmit',
      type: '(value: string) => void',
      description: 'Called with the trimmed question on Enter or the submit button.',
    },
    {
      component: 'AskBar',
      name: 'placeholder',
      type: 'string',
      description: 'Placeholder of the field. Overrides labels.placeholder.',
    },
    {
      component: 'AskBar',
      name: 'suggestions',
      type: 'AskBarSuggestion[]',
      description: 'Questions to offer under the field. Each has an id and a label.',
    },
    {
      component: 'AskBar',
      name: 'onSuggestionSelect',
      type: '(suggestion: AskBarSuggestion) => void',
      description:
        'Called when the person chooses a suggestion. Without it, choosing one submits its label.',
    },
    {
      component: 'AskBar',
      name: 'filterSuggestions',
      type: 'boolean',
      default: 'true',
      description:
        'Hide suggestions that do not contain the typed text. Set false when the server filters.',
    },
    {
      component: 'AskBar',
      name: 'status',
      type: 'GenerationStatus',
      default: "'idle'",
      description: 'Where the answer is in its life cycle.',
    },
    {
      component: 'AskBar',
      name: 'answer',
      type: 'React.ReactNode',
      description: 'The answer, shown under the field.',
    },
    {
      component: 'AskBar',
      name: 'onClear',
      type: '() => void',
      description: 'Called when the person clears the field and the answer.',
    },
    {
      component: 'AskBar',
      name: 'onStop',
      type: '() => void',
      description:
        'Called when the person stops an answer in progress. Turns the submit button into stop.',
    },
    {
      component: 'AskBar',
      name: 'shortcut',
      type: 'string',
      description: 'A hotkey that moves focus to the field, for example mod+/. Shown as a hint.',
    },
    {
      component: 'AskBar',
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Disables the field and its buttons.',
    },
    {
      component: 'AskBar',
      name: 'inputRef',
      type: 'React.Ref<HTMLInputElement>',
      description: 'Ref to the input element.',
    },
    {
      component: 'AskBar',
      name: 'labels',
      type: 'Partial<AskBarLabels>',
      description:
        'Translations: label, placeholder, submit, stop, clear, suggestions, answer, thinking, stopped and error.',
    },
  ],
  accessibility: [
    'The bar is a search landmark with an accessible name.',
    'The field is a combobox. Focus stays in it while the suggestions are browsed with aria-activedescendant.',
    'The answer is a labelled, polite live region. It is held back while it streams and read once when complete.',
    'Submit is disabled while the field is empty. While an answer streams the same button is named Stop.',
    'Keys pressed while an input method is composing are left alone.',
  ],
  keyboard: [
    { keys: ['Enter'], description: 'Asks the typed question, or chooses the active suggestion.' },
    {
      keys: ['ArrowDown', 'ArrowUp'],
      description: 'Opens the suggestions and moves through them.',
    },
    {
      keys: ['Home', 'End'],
      description: 'Moves to the first or last suggestion once one is active.',
    },
    { keys: ['Escape'], description: 'Closes the suggestions, then clears the field.' },
  ],
  guidelines: {
    do: [
      'Say what can be asked in the placeholder, for example Ask about this report.',
      'Offer a few real questions as suggestions.',
    ],
    dont: [
      'Use it for multi turn conversation; use Thread and PromptComposer.',
      'Replace the page with the answer; show it in place.',
    ],
  },
  related: ['prompt-composer', 'semantic-search-results', 'suggestion-chips', 'search-input'],
};

const suggestions: AskBarSuggestion[] = [
  { id: 'renew', label: 'When does this contract renew?' },
  { id: 'notice', label: 'How much notice do we need to give?' },
  { id: 'price', label: 'Can the price change during the term?' },
];

const reply = 'The contract renews on 30 June each year unless notice is given 90 days before.';

export function Basic() {
  const [status, setStatus] = React.useState<GenerationStatus>('idle');
  const [shown, setShown] = React.useState(0);
  const count = React.useRef(0);
  const timer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearInterval(timer.current), []);
  const ask = () => {
    window.clearInterval(timer.current);
    count.current = 0;
    setShown(0);
    setStatus('submitted');
    timer.current = window.setInterval(() => {
      count.current = Math.min(reply.length, count.current + 6);
      setShown(count.current);
      if (count.current < reply.length) {
        setStatus('streaming');
      } else {
        window.clearInterval(timer.current);
        setStatus('complete');
      }
    }, 120);
  };
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <AskBar
        placeholder="Ask about this contract"
        suggestions={suggestions}
        status={status}
        answer={shown > 0 ? <p>{reply.slice(0, shown)}</p> : undefined}
        onSubmit={ask}
        onStop={() => {
          window.clearInterval(timer.current);
          setStatus('stopped');
        }}
        onClear={() => {
          window.clearInterval(timer.current);
          setShown(0);
          setStatus('idle');
        }}
      />
    </div>
  );
}

export function Shortcut() {
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <AskBar
        shortcut="mod+/"
        labels={{ label: 'Ask the help centre' }}
        placeholder="Ask the help centre"
      />
    </div>
  );
}

export function States() {
  return (
    <div style={{ display: 'grid', gap: 16, width: '100%', maxWidth: 560 }}>
      <AskBar
        labels={{ label: 'Stopped question' }}
        defaultValue="When does this contract renew?"
        status="stopped"
        answer={<p>The contract renews on 30 June each</p>}
      />
      <AskBar
        labels={{ label: 'Failed question' }}
        defaultValue="Can the price change?"
        status="error"
      />
    </div>
  );
}

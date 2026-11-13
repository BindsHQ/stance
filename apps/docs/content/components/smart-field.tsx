import * as React from 'react';
import { Button, SmartField, Textarea } from '@bindshq/stance-react';
import type { SmartFieldStatus } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'smart-field',
  name: 'SmartField',
  category: 'ai',
  summary:
    'A form field that AI can fill in. It marks the value as suggested, says where it came from and lets people accept, undo or edit it.',
  description:
    'Use SmartField when the product can propose a value, for example a supplier read from an uploaded invoice. The suggestion appears in the control with a mark and its source. People accept it, undo it, ask for another or simply type over it, and typing makes the value their own.',
  imports: ['SmartField'],
  status: 'beta',
  examples: [
    {
      name: 'Basic',
      title: 'A suggested value',
      description: 'Accept it, undo it, or type over it to clear the mark.',
      layout: 'fill',
    },
    {
      name: 'Flow',
      title: 'From empty to accepted',
      description: 'A controlled field that moves through every status.',
      layout: 'fill',
    },
    {
      name: 'CustomControl',
      title: 'With your own control',
      description: 'A render function wires any control to the field.',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'SmartField',
      name: 'label',
      type: 'React.ReactNode',
      required: true,
      description: 'The visible label of the field.',
    },
    {
      component: 'SmartField',
      name: 'value',
      type: 'string',
      description: 'The value of the field. Controlled.',
    },
    {
      component: 'SmartField',
      name: 'defaultValue',
      type: 'string',
      default: "''",
      description: 'The value on first render when uncontrolled.',
    },
    {
      component: 'SmartField',
      name: 'onValueChange',
      type: '(value: string) => void',
      description: 'Called when the value changes: on edit, on accept and on undo.',
    },
    {
      component: 'SmartField',
      name: 'suggestedValue',
      type: 'string',
      description: 'The value AI suggests. Shown in the control while the status is suggested.',
    },
    {
      component: 'SmartField',
      name: 'suggestionSource',
      type: 'React.ReactNode',
      description: 'Where the suggestion came from, for example a file name.',
    },
    {
      component: 'SmartField',
      name: 'status',
      type: "'idle' | 'suggesting' | 'suggested' | 'accepted'",
      description: 'Where the field is in the suggestion flow. Controlled.',
    },
    {
      component: 'SmartField',
      name: 'defaultStatus',
      type: "'idle' | 'suggesting' | 'suggested' | 'accepted'",
      default: "'idle'",
      description: 'The status on first render when uncontrolled.',
    },
    {
      component: 'SmartField',
      name: 'onStatusChange',
      type: '(status: SmartFieldStatus) => void',
      description: 'Called when accepting, undoing or editing changes the status.',
    },
    {
      component: 'SmartField',
      name: 'onAccept',
      type: '(value: string) => void',
      description: 'Called with the suggestion when the person accepts it.',
    },
    {
      component: 'SmartField',
      name: 'onUndo',
      type: '() => void',
      description: 'Called when the person removes the suggestion.',
    },
    {
      component: 'SmartField',
      name: 'onRegenerate',
      type: '() => void',
      description: 'Called when the person asks for another suggestion. Shows a button.',
    },
    {
      component: 'SmartField',
      name: 'children',
      type: 'React.ReactNode | ((control: SmartFieldControlProps) => React.ReactNode)',
      description:
        'The control. Omit it for a text input, pass a function to wire your own control, or an element you wire yourself.',
    },
    {
      component: 'SmartField',
      name: 'description',
      type: 'React.ReactNode',
      description: 'Helper text under the control.',
    },
    {
      component: 'SmartField',
      name: 'error',
      type: 'React.ReactNode',
      description: 'Error message. Marks the field invalid.',
    },
    {
      component: 'SmartField',
      name: 'required',
      type: 'boolean',
      description: 'Marks the field required.',
    },
    {
      component: 'SmartField',
      name: 'disabled',
      type: 'boolean',
      description: 'Disables the control and the actions.',
    },
    {
      component: 'SmartField',
      name: 'placeholder',
      type: 'string',
      description: 'Placeholder of the built in text input.',
    },
    {
      component: 'SmartField',
      name: 'labels',
      type: 'Partial<SmartFieldLabels>',
      description:
        'Translations: suggesting, suggested, accepted, source(source), accept, undo, regenerate, ready, acceptedAnnouncement and undone.',
    },
  ],
  accessibility: [
    'The mark and its source are text, linked to the control with aria-describedby.',
    'While a value is being suggested the control is busy and a status says so.',
    'A suggestion that arrives is announced politely, once. Accept and undo are announced too.',
    'Editing the value clears the AI mark, so the mark always tells the truth.',
    'Undo after accepting brings back the value the person had before.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Moves from the control to Accept, Undo and Suggest again.' },
    { keys: ['Enter', 'Space'], description: 'Activates the focused button.' },
  ],
  guidelines: {
    do: [
      'Say where the suggestion came from when you know.',
      'Let people submit the form without accepting; the value is still theirs to check.',
    ],
    dont: [
      'Replace a value the person typed without asking.',
      'Keep the AI mark after the person has edited the value.',
    ],
  },
  related: ['form-field', 'inline-suggestion', 'ai-generated-label', 'input'],
};

export function Basic() {
  return (
    <div style={{ width: '100%', maxWidth: 420 }}>
      <SmartField
        label="Supplier"
        defaultStatus="suggested"
        suggestedValue="Northwind Trading Ltd"
        suggestionSource="invoice-204.pdf"
      />
    </div>
  );
}

export function Flow() {
  const [value, setValue] = React.useState('');
  const [status, setStatus] = React.useState<SmartFieldStatus>('idle');
  const timer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);
  const suggest = () => {
    setStatus('suggesting');
    timer.current = window.setTimeout(() => setStatus('suggested'), 1500);
  };
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 420 }}>
      <SmartField
        label="Payment terms"
        value={value}
        onValueChange={setValue}
        status={status}
        onStatusChange={setStatus}
        suggestedValue="Net 30 days"
        suggestionSource="the last three invoices"
        onRegenerate={suggest}
      />
      <div>
        <Button size="sm" variant="outline" disabled={status === 'suggesting'} onClick={suggest}>
          Suggest a value
        </Button>
      </div>
    </div>
  );
}

export function CustomControl() {
  return (
    <div style={{ width: '100%', maxWidth: 420 }}>
      <SmartField
        label="Reply"
        defaultStatus="suggested"
        suggestedValue="Thanks for the reminder. The signed copy will be with you on Friday."
        suggestionSource="the thread so far"
      >
        {(control) => (
          <Textarea
            rows={3}
            value={control.value}
            aria-describedby={control['aria-describedby']}
            aria-busy={control['aria-busy']}
            onChange={(event) => control.onValueChange(event.target.value)}
          />
        )}
      </SmartField>
    </div>
  );
}

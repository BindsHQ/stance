import * as React from 'react';
import { Button, FormField, PinInput } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'pin-input',
  name: 'PinInput',
  category: 'forms',
  summary:
    'A one-time code or PIN field split into cells, with paste, SMS autofill and full keyboard support.',
  description:
    'Use PinInput for short codes of a known length: email and SMS verification codes, two-factor codes and PINs. It behaves as one field, so typing advances, Backspace steps back and a pasted or autofilled code fills every cell. For longer or variable-length values use Input.',
  imports: ['PinInput'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Verification code' },
    { name: 'Sizes', title: 'Sizes' },
    {
      name: 'Masked',
      title: 'Masked PIN',
      description: 'mask hides the characters, for PINs entered in view of others.',
    },
    { name: 'Alphanumeric', title: 'Letters and numbers' },
    {
      name: 'Validation',
      title: 'Validation',
      description:
        'onComplete fires once every cell is filled, so the code can be checked straight away.',
    },
  ],
  props: [
    {
      component: 'PinInput',
      name: 'length',
      type: 'number',
      default: '6',
      description: 'Number of cells.',
    },
    { component: 'PinInput', name: 'value', type: 'string', description: 'Controlled value.' },
    {
      component: 'PinInput',
      name: 'defaultValue',
      type: 'string',
      description: 'Initial value when uncontrolled.',
    },
    {
      component: 'PinInput',
      name: 'onChange',
      type: '(value: string) => void',
      description: 'Called with the joined value on every change.',
    },
    {
      component: 'PinInput',
      name: 'onComplete',
      type: '(value: string) => void',
      description: 'Called once all cells are filled.',
    },
    {
      component: 'PinInput',
      name: 'type',
      type: "'numeric' | 'alphanumeric'",
      default: "'numeric'",
      description: 'Accepted characters. Numeric shows the number keypad on phones.',
    },
    {
      component: 'PinInput',
      name: 'mask',
      type: 'boolean',
      default: 'false',
      description: 'Hide the characters.',
    },
    {
      component: 'PinInput',
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
      default: "'md'",
      description: 'Cell size: 32, 40 or 48px.',
    },
    {
      component: 'PinInput',
      name: 'name',
      type: 'string',
      description: 'Adds a hidden input carrying the joined value for form submission.',
    },
    {
      component: 'PinInput',
      name: 'oneTimeCode',
      type: 'boolean',
      default: 'true',
      description:
        'Sets autocomplete="one-time-code" on the first cell for SMS and email code autofill.',
    },
    {
      component: 'PinInput',
      name: 'invalid',
      type: 'boolean',
      description: 'Marks the field invalid. Set automatically inside an erroring FormField.',
    },
    {
      component: 'PinInput',
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Disables every cell.',
    },
    {
      component: 'PinInput',
      name: 'readOnly',
      type: 'boolean',
      default: 'false',
      description: 'Shows the value without allowing changes.',
    },
    {
      component: 'PinInput',
      name: 'autoFocus',
      type: 'boolean',
      default: 'false',
      description: 'Focus the first cell on mount.',
    },
    {
      component: 'PinInput',
      name: 'getCellLabel',
      type: '(index: number, length: number) => string',
      description: 'Custom accessible name for each cell.',
    },
  ],
  accessibility: [
    'The cells form a group named by the FormField label (or aria-label), with the description and error linked to it.',
    'Each cell has its own name, such as “Digit 1 of 6”, so screen-reader users always know their position.',
    'The first cell uses autocomplete="one-time-code" and accepts a whole code, so SMS and password-manager autofill work.',
    'Pasting a code fills every cell and ignores spaces and dashes. Never block paste on a verification code (WCAG 3.3.8).',
    'Numeric codes use inputmode="numeric" to show the number keypad without the drawbacks of type="number".',
    'Clicking the FormField label focuses the first cell.',
  ],
  keyboard: [
    { keys: ['0–9', 'A–Z'], description: 'Enters a character and moves to the next cell.' },
    {
      keys: ['Backspace'],
      description: 'Clears the current cell, or steps back and clears the previous one.',
    },
    { keys: ['Delete'], description: 'Clears the current cell.' },
    { keys: ['←', '→'], description: 'Moves between cells.' },
    { keys: ['Home', 'End'], description: 'Moves to the first cell or the next empty one.' },
    { keys: ['Ctrl/⌘', 'V'], description: 'Pastes a whole code.' },
  ],
  guidelines: {
    do: [
      'Say where the code was sent and offer a way to resend it.',
      'Verify on completion, and keep the code in place if it is wrong so it can be corrected.',
    ],
    dont: [
      'Use it for values of unknown length such as passwords or phone numbers.',
      'Clear all cells on an error; a single mistyped digit should be quick to fix.',
    ],
  },
  playground: {
    render: (p) => (
      <PinInput
        aria-label="Verification code"
        length={p.length as number}
        type={p.type as 'numeric'}
        size={p.size as 'md'}
        mask={p.mask as boolean}
        disabled={p.disabled as boolean}
        invalid={p.invalid as boolean}
      />
    ),
    controls: {
      length: { type: 'number', default: 6, min: 4, max: 8, step: 1 },
      type: { type: 'select', options: ['numeric', 'alphanumeric'], default: 'numeric' },
      size: { type: 'select', options: ['sm', 'md', 'lg'], default: 'md' },
      mask: { type: 'boolean', default: false },
      invalid: { type: 'boolean', default: false },
      disabled: { type: 'boolean', default: false },
    },
  },
  related: ['input', 'password-input', 'form-field'],
};

export function Basic() {
  return (
    <FormField
      label="Verification code"
      description="Enter the 6-digit code we sent to priya.nair@binds.si."
    >
      <PinInput name="code" />
    </FormField>
  );
}

export function Sizes() {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <PinInput aria-label="Small code" size="sm" length={4} defaultValue="12" />
      <PinInput aria-label="Medium code" size="md" length={4} defaultValue="12" />
      <PinInput aria-label="Large code" size="lg" length={4} defaultValue="12" />
    </div>
  );
}

export function Masked() {
  return (
    <FormField label="Signing PIN" description="Your 4-digit PIN confirms each signature.">
      <PinInput length={4} mask oneTimeCode={false} />
    </FormField>
  );
}

export function Alphanumeric() {
  return (
    <FormField label="Recovery code" description="Letters and numbers, 8 characters.">
      <PinInput length={8} type="alphanumeric" size="sm" oneTimeCode={false} />
    </FormField>
  );
}

export function Validation() {
  const [code, setCode] = React.useState('');
  const [status, setStatus] = React.useState<'idle' | 'wrong' | 'ok'>('idle');
  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
      <FormField
        label="Verification code"
        description="Try 246810."
        error={status === 'wrong' ? 'That code is not correct. Check it and try again.' : undefined}
      >
        <PinInput
          value={code}
          onChange={(v) => {
            setCode(v);
            setStatus('idle');
          }}
          onComplete={(v) => setStatus(v === '246810' ? 'ok' : 'wrong')}
        />
      </FormField>
      <p role="status" style={{ margin: 0 }}>
        {status === 'ok' ? 'Email address verified.' : ''}
      </p>
      <Button variant="link" onClick={() => setCode('')}>
        Send a new code
      </Button>
    </div>
  );
}

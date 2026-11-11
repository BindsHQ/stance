import { Checkbox, FormField } from '@bindshq/stance-react';
import * as React from 'react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'checkbox',
  name: 'Checkbox',
  category: 'forms',
  summary: 'A native checkbox with label, description and an indeterminate state.',
  description:
    'Use Checkbox for independent yes/no choices that are applied on submit, such as accepting terms or opting into notifications. Use Switch for settings that take effect immediately, and CheckboxGroup for several related options under one label.',
  imports: ['Checkbox'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', layout: 'start' },
    { name: 'WithDescription', title: 'With description', layout: 'start' },
    {
      name: 'Indeterminate',
      title: 'Indeterminate (select all)',
      description: 'The parent reflects a partial selection of its children.',
      layout: 'start',
    },
    { name: 'States', title: 'Sizes and states', layout: 'start' },
  ],
  props: [
    {
      component: 'Checkbox',
      name: 'checked',
      type: "boolean | 'indeterminate'",
      description: 'Controlled state.',
    },
    {
      component: 'Checkbox',
      name: 'defaultChecked',
      type: 'boolean',
      default: 'false',
      description: 'Initial state when uncontrolled.',
    },
    {
      component: 'Checkbox',
      name: 'onCheckedChange',
      type: '(checked: boolean) => void',
      description: 'Called with the new state.',
    },
    {
      component: 'Checkbox',
      name: 'label',
      type: 'ReactNode',
      description: 'Visible label. Without it, provide aria-label.',
    },
    {
      component: 'Checkbox',
      name: 'description',
      type: 'ReactNode',
      description: 'Help text under the label, linked via aria-describedby.',
    },
    {
      component: 'Checkbox',
      name: 'size',
      type: "'sm' | 'md'",
      default: "'md'",
      description: 'Box size.',
    },
    {
      component: 'Checkbox',
      name: 'invalid',
      type: 'boolean',
      description: 'Marks the checkbox invalid.',
    },
    {
      component: 'Checkbox',
      name: 'value',
      type: 'string',
      description: 'Form value; identifies the item inside a CheckboxGroup.',
    },
    {
      component: 'Checkbox',
      name: '...props',
      type: 'InputHTMLAttributes',
      description: 'Native input attributes; the ref targets the <input>.',
    },
  ],
  accessibility: [
    'A real <input type="checkbox"> is styled, so native semantics, form submission and keyboard behaviour are preserved.',
    'The indeterminate state is set on the element and exposed as "mixed".',
    'The whole label is clickable, and an enlarged invisible hit area keeps small boxes above the 24px target size.',
    'The checkmark is drawn in the accent foreground colour and remains visible in Windows forced colours.',
  ],
  keyboard: [{ keys: ['Space'], description: 'Toggles the checkbox.' }],
  guidelines: {
    do: ['Phrase labels positively: “Email me when a document is signed”.'],
    dont: ['Use a checkbox for an action that happens immediately; use Switch.'],
  },
  playground: {
    render: (p) => (
      <Checkbox
        label={p.label as string}
        description={(p.description as string) || undefined}
        size={p.size as 'md'}
        disabled={p.disabled as boolean}
        invalid={p.invalid as boolean}
      />
    ),
    controls: {
      label: { type: 'text', default: 'Email me when a document is signed' },
      description: { type: 'text', default: '' },
      size: { type: 'select', options: ['sm', 'md'], default: 'md' },
      disabled: { type: 'boolean', default: false },
      invalid: { type: 'boolean', default: false },
    },
  },
  related: ['checkbox-group', 'switch', 'radio-group'],
};

export function Basic() {
  return <Checkbox label="Send a copy of the signed document to all parties" defaultChecked />;
}

export function WithDescription() {
  return (
    <Checkbox
      label="Require signer authentication"
      description="Signers confirm a one-time code sent to their email before signing."
    />
  );
}

const documents = ['Mutual NDA', 'Master services agreement', 'Data processing addendum'];

export function Indeterminate() {
  const [selected, setSelected] = React.useState<string[]>(['Mutual NDA']);
  const all = selected.length === documents.length;
  const some = selected.length > 0 && !all;
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <Checkbox
        label="Select all documents"
        checked={all ? true : some ? 'indeterminate' : false}
        onCheckedChange={(c) => setSelected(c ? documents : [])}
      />
      <div style={{ display: 'grid', gap: 10, paddingLeft: 28 }}>
        {documents.map((d) => (
          <Checkbox
            key={d}
            label={d}
            checked={selected.includes(d)}
            onCheckedChange={(c) => setSelected((s) => (c ? [...s, d] : s.filter((x) => x !== d)))}
          />
        ))}
      </div>
    </div>
  );
}

export function States() {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Checkbox size="sm" label="Small" defaultChecked />
      <Checkbox label="Disabled" disabled />
      <Checkbox label="Disabled and checked" disabled defaultChecked />
      <FormField label="Accept the terms of service" error="You must accept the terms to continue">
        <Checkbox />
      </FormField>
    </div>
  );
}

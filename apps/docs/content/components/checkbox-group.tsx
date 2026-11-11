import { Checkbox, CheckboxGroup } from '@bindshq/stance-react';
import * as React from 'react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'checkbox-group',
  name: 'CheckboxGroup',
  category: 'forms',
  summary: 'A labelled set of checkboxes that share one array value.',
  description:
    'Use CheckboxGroup when users can choose any number of options from a short list. It renders a fieldset and legend, so the group label is announced with each option, and manages the selected values as a string array. For more than about eight options, consider MultiSelect.',
  imports: ['CheckboxGroup', 'Checkbox'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', layout: 'start' },
    { name: 'Horizontal', title: 'Horizontal', layout: 'start' },
    { name: 'Validation', title: 'Validation', layout: 'start' },
    { name: 'Controlled', title: 'Controlled', layout: 'start' },
  ],
  props: [
    {
      component: 'CheckboxGroup',
      name: 'label',
      type: 'ReactNode',
      required: true,
      description: 'Group label, rendered as the legend.',
    },
    {
      component: 'CheckboxGroup',
      name: 'value',
      type: 'string[]',
      description: 'Controlled selected values.',
    },
    {
      component: 'CheckboxGroup',
      name: 'defaultValue',
      type: 'string[]',
      default: '[]',
      description: 'Initial selected values.',
    },
    {
      component: 'CheckboxGroup',
      name: 'onValueChange',
      type: '(value: string[]) => void',
      description: 'Called with the new selection.',
    },
    {
      component: 'CheckboxGroup',
      name: 'name',
      type: 'string',
      description: 'Form field name applied to every checkbox.',
    },
    {
      component: 'CheckboxGroup',
      name: 'description',
      type: 'ReactNode',
      description: 'Help text under the legend.',
    },
    {
      component: 'CheckboxGroup',
      name: 'error',
      type: 'ReactNode',
      description: 'Error message; marks every checkbox invalid.',
    },
    {
      component: 'CheckboxGroup',
      name: 'required',
      type: 'boolean',
      default: 'false',
      description: 'Shows a required indicator on the legend.',
    },
    {
      component: 'CheckboxGroup',
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Disables all checkboxes.',
    },
    {
      component: 'CheckboxGroup',
      name: 'orientation',
      type: "'vertical' | 'horizontal'",
      default: "'vertical'",
      description: 'Layout of the options.',
    },
    {
      component: 'CheckboxGroup',
      name: 'hideLabel',
      type: 'boolean',
      default: 'false',
      description: 'Visually hide the legend.',
    },
    {
      component: 'CheckboxGroup',
      name: 'size',
      type: "'sm' | 'md'",
      default: "'md'",
      description: 'Size of every checkbox.',
    },
  ],
  accessibility: [
    'Uses <fieldset> and <legend>, so the group name is announced when focus enters the group.',
    'Description and error are linked to the fieldset; the error uses role="alert".',
    'Each checkbox remains a separate tab stop, matching native behaviour.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Moves between checkboxes.' },
    { keys: ['Space'], description: 'Toggles the focused checkbox.' },
  ],
  related: ['checkbox', 'radio-group', 'multi-select'],
};

export function Basic() {
  return (
    <CheckboxGroup
      label="Notify me when"
      description="Notifications are sent to your work email."
      defaultValue={['signed']}
    >
      <Checkbox value="viewed" label="A signer opens the document" />
      <Checkbox value="signed" label="A signer completes signing" />
      <Checkbox value="declined" label="A signer declines" />
      <Checkbox value="expired" label="A request expires" />
    </CheckboxGroup>
  );
}

export function Horizontal() {
  return (
    <CheckboxGroup
      label="Show in signature"
      orientation="horizontal"
      defaultValue={['phone', 'logo']}
    >
      <Checkbox value="phone" label="Phone" />
      <Checkbox value="address" label="Address" />
      <Checkbox value="logo" label="Logo" />
      <Checkbox value="social" label="Social links" />
    </CheckboxGroup>
  );
}

export function Validation() {
  return (
    <CheckboxGroup label="Deploy to" required error="Choose at least one destination">
      <Checkbox value="m365" label="Microsoft 365" />
      <Checkbox value="google" label="Google Workspace" />
    </CheckboxGroup>
  );
}

export function Controlled() {
  const [value, setValue] = React.useState<string[]>(['pdf']);
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <CheckboxGroup label="Export formats" value={value} onValueChange={setValue}>
        <Checkbox value="pdf" label="PDF" />
        <Checkbox value="docx" label="Word (DOCX)" />
        <Checkbox value="html" label="HTML" />
      </CheckboxGroup>
      <span style={{ fontSize: 14 }}>Selected: {value.join(', ') || 'none'}</span>
    </div>
  );
}

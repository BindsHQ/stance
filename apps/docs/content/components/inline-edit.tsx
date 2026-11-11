import * as React from 'react';
import { InlineEdit } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'inline-edit',
  name: 'InlineEdit',
  category: 'forms',
  summary:
    'Text that can be edited in place: activate it to type, press Enter to save or Escape to cancel.',
  description:
    'Use InlineEdit for a single value people change now and then where they read it: a template name, a document title, a short note. For several related fields, or values that need explanation, use a form with FormField instead.',
  imports: ['InlineEdit'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Template name' },
    {
      name: 'WithValidation',
      title: 'Validation',
      description:
        'validate returns an error message to reject a value. The editor stays open so it can be fixed.',
    },
    {
      name: 'WithActions',
      title: 'Confirm and cancel buttons',
      description: 'With showActions, leaving the field no longer saves; people choose explicitly.',
    },
    {
      name: 'Multiline',
      title: 'Multiline',
      description: 'Enter adds a line and Ctrl/⌘+Enter saves.',
      layout: 'fill',
    },
    { name: 'Sizes', title: 'Sizes and empty state' },
  ],
  props: [
    {
      component: 'InlineEdit',
      name: 'label',
      type: 'string',
      required: true,
      description:
        'What is being edited, e.g. "template name". Names the read view “Edit <label>” and the input.',
    },
    {
      component: 'InlineEdit',
      name: 'value',
      type: 'string',
      description: 'Controlled committed value.',
    },
    {
      component: 'InlineEdit',
      name: 'defaultValue',
      type: 'string',
      default: "''",
      description: 'Initial value when uncontrolled.',
    },
    {
      component: 'InlineEdit',
      name: 'onCommit',
      type: '(value: string) => void',
      description: 'Called with the new value when it changes and is saved.',
    },
    {
      component: 'InlineEdit',
      name: 'onCancel',
      type: '() => void',
      description: 'Called when editing is cancelled.',
    },
    {
      component: 'InlineEdit',
      name: 'validate',
      type: '(value: string) => string | undefined',
      description: 'Return an error message to reject the value and keep editing.',
    },
    {
      component: 'InlineEdit',
      name: 'placeholder',
      type: 'string',
      default: "'Add a value'",
      description: 'Shown in the read view when the value is empty.',
    },
    {
      component: 'InlineEdit',
      name: 'multiline',
      type: 'boolean',
      default: 'false',
      description: 'Edit in a textarea.',
    },
    {
      component: 'InlineEdit',
      name: 'showActions',
      type: 'boolean',
      default: 'false',
      description: 'Show Save and Cancel buttons while editing.',
    },
    {
      component: 'InlineEdit',
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
      default: "'md'",
      description: 'Text size, to match the surrounding content.',
    },
    {
      component: 'InlineEdit',
      name: 'trim',
      type: 'boolean',
      default: 'true',
      description: 'Trim whitespace before saving.',
    },
    {
      component: 'InlineEdit',
      name: 'defaultEditing',
      type: 'boolean',
      default: 'false',
      description: 'Start in edit mode.',
    },
    {
      component: 'InlineEdit',
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Shows the value as a disabled button.',
    },
    {
      component: 'InlineEdit',
      name: 'readOnly',
      type: 'boolean',
      default: 'false',
      description: 'Shows the value as plain text with no edit affordance.',
    },
    {
      component: 'InlineEdit',
      name: 'labels',
      type: 'Partial<InlineEditLabels>',
      description: 'Translations for the Save and Cancel buttons.',
    },
  ],
  accessibility: [
    'The read view is a real button named “Edit <label>: <value>”, so it is reachable by keyboard and announces what activating it does.',
    'Entering edit mode moves focus to the input and selects the text; saving or cancelling returns focus to the read view.',
    'Validation errors are linked to the input and announced immediately, and the editor stays open.',
    'The pencil icon appears on hover and focus, and is always visible on touch screens where there is no hover.',
    'With showActions, Save and Cancel are labelled buttons that stay inside the editor’s focus area.',
  ],
  keyboard: [
    { keys: ['Enter', 'Space'], description: 'On the read view: starts editing.' },
    { keys: ['Enter'], description: 'While editing: saves. In multiline mode it adds a line.' },
    { keys: ['Ctrl/⌘', 'Enter'], description: 'In multiline mode: saves.' },
    { keys: ['Esc'], description: 'Cancels and restores the previous value.' },
    {
      keys: ['Tab'],
      description: 'Leaves the field, saving the value (unless showActions is on).',
    },
  ],
  guidelines: {
    do: [
      'Use a specific label: “template name”, not “value”.',
      'Use showActions when a change has consequences people should confirm.',
    ],
    dont: [
      'Use it for several fields that are saved together; use a form.',
      'Rely on it for required information that has no value yet; ask for it in a form.',
    ],
  },
  related: ['input', 'textarea', 'form-field'],
};

export function Basic() {
  const [name, setName] = React.useState('Sales team signature');
  return <InlineEdit label="template name" value={name} onCommit={setName} size="lg" />;
}

export function WithValidation() {
  const [name, setName] = React.useState('Master services agreement');
  return (
    <InlineEdit
      label="document title"
      value={name}
      onCommit={setName}
      validate={(v) =>
        v.length < 3
          ? 'Enter at least 3 characters.'
          : v.length > 60
            ? 'Keep the title under 60 characters.'
            : undefined
      }
    />
  );
}

export function WithActions() {
  const [domain, setDomain] = React.useState('binds.si');
  return <InlineEdit label="reply-to domain" value={domain} onCommit={setDomain} showActions />;
}

export function Multiline() {
  const [note, setNote] = React.useState('Countersign by Friday.\nSend a copy to legal@binds.si.');
  return (
    <div style={{ width: '100%', maxWidth: 420 }}>
      <InlineEdit label="note" value={note} onCommit={setNote} multiline placeholder="Add a note" />
    </div>
  );
}

export function Sizes() {
  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
      <InlineEdit label="team" defaultValue="Legal" size="sm" />
      <InlineEdit label="owner" defaultValue="Priya Nair" size="md" />
      <InlineEdit label="job title" placeholder="Add a job title" size="md" />
      <InlineEdit label="reference" defaultValue="MSA-2026-014" readOnly />
    </div>
  );
}

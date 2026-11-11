import * as React from 'react';
import { FormField, Icon, Select, type SelectOptions } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

const roles: SelectOptions = [
  { value: 'owner', label: 'Owner', description: 'Full access, including billing' },
  { value: 'admin', label: 'Admin', description: 'Manage users, templates and integrations' },
  { value: 'editor', label: 'Editor', description: 'Create and edit templates' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access' },
];

export const doc: ComponentDoc = {
  slug: 'select',
  name: 'Select',
  category: 'forms',
  summary:
    'Choose one value from a list, with typeahead, groups, disabled options and form submission.',
  description:
    'Use Select when the user picks exactly one value from a known list of roughly 5–30 options. For long or searchable lists use Combobox; for several values use MultiSelect; for 2–4 visible choices consider RadioGroup. Select is a select-only combobox (WAI-ARIA APG): focus stays on the trigger and the active option is announced through aria-activedescendant. It integrates with FormField and submits through a hidden input.',
  imports: ['Select', 'type SelectOptions'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'In a form field', minHeight: 320, layout: 'start' },
    { name: 'Groups', title: 'Grouped options', minHeight: 360, layout: 'start' },
    { name: 'WithIcons', title: 'Icons and disabled options', minHeight: 300, layout: 'start' },
    { name: 'Sizes', title: 'Sizes', minHeight: 200, layout: 'start' },
    { name: 'Controlled', title: 'Controlled', minHeight: 300, layout: 'start' },
    { name: 'States', title: 'Error and disabled', minHeight: 220, layout: 'start' },
  ],
  props: [
    {
      component: 'Select',
      name: 'options',
      type: 'SelectOptions',
      required: true,
      description:
        'Options `{ value, label, description?, icon?, disabled? }`, or groups `{ label, options }`.',
    },
    {
      component: 'Select',
      name: 'value',
      type: 'string | null',
      description: 'Selected value (controlled).',
    },
    {
      component: 'Select',
      name: 'defaultValue',
      type: 'string | null',
      default: 'null',
      description: 'Initial value when uncontrolled.',
    },
    {
      component: 'Select',
      name: 'onValueChange',
      type: '(value: string) => void',
      description: 'Called when the user picks an option.',
    },
    {
      component: 'Select',
      name: 'placeholder',
      type: 'string',
      default: "'Select…'",
      description: 'Shown when nothing is selected.',
    },
    {
      component: 'Select',
      name: 'name',
      type: 'string',
      description: 'Form field name; a hidden input carries the value.',
    },
    {
      component: 'Select',
      name: 'form',
      type: 'string',
      description: 'Associate with a form by id.',
    },
    {
      component: 'Select',
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
      default: "'md'",
      description: 'Control height: 32, 40 or 48px.',
    },
    {
      component: 'Select',
      name: 'required / disabled / invalid',
      type: 'boolean',
      description: 'Also inherited from FormField.',
    },
    {
      component: 'Select',
      name: 'open / defaultOpen / onOpenChange',
      type: 'boolean / function',
      description: 'Popup open state.',
    },
    {
      component: 'Select',
      name: 'renderOption',
      type: '(option, { selected, active }) => ReactNode',
      description: 'Custom option content.',
    },
    {
      component: 'Select',
      name: 'emptyText',
      type: 'ReactNode',
      default: "'No options'",
      description: 'Shown when options is empty.',
    },
    {
      component: 'Select',
      name: 'contentClassName',
      type: 'string',
      description: 'Class for the popup.',
    },
    {
      component: 'Select',
      name: '...props',
      type: 'ButtonHTMLAttributes',
      description:
        'Native attributes for the trigger, e.g. aria-label when used without FormField.',
    },
  ],
  accessibility: [
    'The trigger is a button with role="combobox", aria-haspopup="listbox", aria-expanded and aria-controls.',
    'Inside FormField it is labelled by the visible label and described by the description and error.',
    'Options use role="option" with aria-selected; groups use role="group" labelled by their heading.',
    'Focus never leaves the trigger; the active option is conveyed through aria-activedescendant.',
    'Disabled options expose aria-disabled and are skipped by arrow keys and typeahead.',
  ],
  keyboard: [
    {
      keys: ['Enter', 'Space', 'ArrowDown', 'ArrowUp'],
      description: 'Open the list at the selected option.',
    },
    { keys: ['Home', 'End'], description: 'Open at, or move to, the first or last option.' },
    { keys: ['ArrowDown', 'ArrowUp'], description: 'Move the active option.' },
    { keys: ['PageDown', 'PageUp'], description: 'Move by ten options.' },
    { keys: ['A–Z'], description: 'Typeahead by label, whether open or closed.' },
    { keys: ['Enter', 'Space'], description: 'Select the active option and close.' },
    { keys: ['Tab'], description: 'Select the active option and move on.' },
    { keys: ['Escape'], description: 'Close without changing the value.' },
  ],
  guidelines: {
    do: [
      'Order options logically: alphabetically, by frequency, or by magnitude.',
      'Use a placeholder that tells people what to choose.',
    ],
    dont: [
      'Use Select for fewer than three options; use RadioGroup or a Switch.',
      'Use Select for long lists people need to search; use Combobox.',
    ],
  },
  related: ['combobox', 'multi-select', 'native-select', 'radio-group', 'form-field'],
};

export function Basic() {
  return (
    <div style={{ width: 320 }}>
      <FormField label="Role" description="Controls what this member can change.">
        <Select options={roles} placeholder="Choose a role" name="role" />
      </FormField>
    </div>
  );
}

export function Groups() {
  return (
    <div style={{ width: 320 }}>
      <FormField label="Default timezone">
        <Select
          defaultValue="europe-london"
          options={[
            {
              label: 'Europe',
              options: [
                { value: 'europe-london', label: 'London (GMT)' },
                { value: 'europe-paris', label: 'Paris (CET)' },
                { value: 'europe-berlin', label: 'Berlin (CET)' },
              ],
            },
            {
              label: 'Asia',
              options: [
                { value: 'asia-kolkata', label: 'Kolkata (IST)' },
                { value: 'asia-singapore', label: 'Singapore (SGT)' },
                { value: 'asia-dubai', label: 'Dubai (GST)' },
              ],
            },
          ]}
        />
      </FormField>
    </div>
  );
}

export function WithIcons() {
  return (
    <div style={{ width: 320 }}>
      <FormField label="Deploy through">
        <Select
          defaultValue="exchange"
          options={[
            { value: 'exchange', label: 'Exchange Online', icon: <Icon name="mail" /> },
            { value: 'relay', label: 'Outlook relay', icon: <Icon name="send" /> },
            {
              value: 'gmail',
              label: 'Google Workspace (coming soon)',
              icon: <Icon name="globe" />,
              disabled: true,
            },
          ]}
        />
      </FormField>
    </div>
  );
}

export function Sizes() {
  return (
    <div style={{ display: 'grid', gap: 12, width: 280 }}>
      <Select aria-label="Small" size="sm" options={roles} defaultValue="editor" />
      <Select aria-label="Medium" size="md" options={roles} defaultValue="editor" />
      <Select aria-label="Large" size="lg" options={roles} defaultValue="editor" />
    </div>
  );
}

export function Controlled() {
  const [role, setRole] = React.useState<string | null>('viewer');
  return (
    <div style={{ display: 'grid', gap: 8, width: 320 }}>
      <FormField label="Role">
        <Select options={roles} value={role} onValueChange={setRole} />
      </FormField>
      <span style={{ color: 'var(--st-color-fg-muted)', fontSize: 'var(--st-font-size-sm)' }}>
        Selected: {role ?? 'none'}
      </span>
    </div>
  );
}

export function States() {
  return (
    <div style={{ display: 'grid', gap: 16, width: 320 }}>
      <FormField label="Department" error="Choose a department to continue" required>
        <Select
          options={[
            { value: 'legal', label: 'Legal' },
            { value: 'sales', label: 'Sales' },
          ]}
          placeholder="Choose a department"
        />
      </FormField>
      <FormField label="Plan" disabled>
        <Select options={[{ value: 'business', label: 'Business' }]} defaultValue="business" />
      </FormField>
    </div>
  );
}

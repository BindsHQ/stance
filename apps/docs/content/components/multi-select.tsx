import * as React from 'react';
import { FormField, MultiSelect, type SelectOptions } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

const departments: SelectOptions = [
  { value: 'sales', label: 'Sales' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'legal', label: 'Legal' },
  { value: 'finance', label: 'Finance' },
  { value: 'support', label: 'Customer support' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'people', label: 'People & culture', disabled: true },
];

export const doc: ComponentDoc = {
  slug: 'multi-select',
  name: 'MultiSelect',
  category: 'forms',
  summary:
    'Choose several values; selections appear as removable tags and the list stays open while you pick.',
  description:
    'Use MultiSelect to choose any number of values from a list, such as the departments a signature template applies to. Selected values show as removable tags in the field. Turn on searchable for long lists. For fewer than six options consider a CheckboxGroup, which shows every choice at once.',
  imports: ['MultiSelect', 'type SelectOptions'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', minHeight: 380, layout: 'start' },
    {
      name: 'Searchable',
      title: 'Searchable',
      description: 'Type to filter; Backspace in an empty search removes the last tag.',
      minHeight: 380,
      layout: 'start',
    },
    { name: 'Controlled', title: 'Controlled with a tag limit', minHeight: 380, layout: 'start' },
    { name: 'Invalid', title: 'Validation', minHeight: 200, layout: 'start' },
  ],
  props: [
    {
      component: 'MultiSelect',
      name: 'options',
      type: 'SelectOptions',
      required: true,
      description: 'Options or groups, as in Select.',
    },
    {
      component: 'MultiSelect',
      name: 'value / defaultValue',
      type: 'string[]',
      default: '[]',
      description: 'Selected values (controlled or initial).',
    },
    {
      component: 'MultiSelect',
      name: 'onValueChange',
      type: '(value: string[]) => void',
      description: 'Called on every change.',
    },
    {
      component: 'MultiSelect',
      name: 'placeholder',
      type: 'string',
      default: "'Select…'",
      description: 'Shown when nothing is selected.',
    },
    {
      component: 'MultiSelect',
      name: 'searchable',
      type: 'boolean',
      default: 'false',
      description: 'Replace the button with a filter input.',
    },
    {
      component: 'MultiSelect',
      name: 'searchPlaceholder',
      type: 'string',
      default: "'Search…'",
      description: 'Placeholder of the search input once values are selected.',
    },
    {
      component: 'MultiSelect',
      name: 'showActions',
      type: 'boolean',
      default: 'true',
      description: 'Show “Select all” and a live count above the list.',
    },
    {
      component: 'MultiSelect',
      name: 'maxTags',
      type: 'number',
      default: '3',
      description: 'Collapse further tags into “+N”.',
    },
    {
      component: 'MultiSelect',
      name: 'name / form',
      type: 'string',
      description: 'Submits one hidden input per selected value.',
    },
    {
      component: 'MultiSelect',
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
      default: "'md'",
      description: 'Minimum control height.',
    },
    {
      component: 'MultiSelect',
      name: 'disabled / required / invalid',
      type: 'boolean',
      description: 'Also inherited from FormField.',
    },
    {
      component: 'MultiSelect',
      name: 'open / defaultOpen / onOpenChange',
      type: 'boolean / function',
      description: 'Popup open state.',
    },
    {
      component: 'MultiSelect',
      name: 'removeLabel',
      type: '(label: string) => string',
      default: '`Remove ${label}`',
      description: 'Accessible label for tag remove buttons (localisation).',
    },
    {
      component: 'MultiSelect',
      name: 'emptyText',
      type: 'ReactNode',
      default: "'No matches'",
      description: 'Shown when the search matches nothing.',
    },
  ],
  accessibility: [
    'The control is a combobox controlling a listbox with aria-multiselectable="true"; options expose aria-selected.',
    'Selected tags are a labelled list; each has a remove button with a descriptive label.',
    'The “N selected” count is announced politely as selections change.',
    'Choosing an option keeps the list open so several values can be picked in one pass.',
  ],
  keyboard: [
    { keys: ['ArrowDown', 'ArrowUp', 'Enter'], description: 'Open the list.' },
    { keys: ['ArrowDown', 'ArrowUp'], description: 'Move the active option.' },
    {
      keys: ['Enter', 'Space'],
      description: 'Toggle the active option (Space only without search).',
    },
    { keys: ['Ctrl+A', '⌘A'], description: 'Select or deselect all visible options.' },
    { keys: ['Backspace'], description: 'With an empty search, remove the last selected value.' },
    { keys: ['Escape', 'Tab'], description: 'Close the list.' },
  ],
  guidelines: {
    do: [
      'Use searchable when there are more than about 15 options.',
      'Show a count or summary when many values are selected.',
    ],
    dont: [
      'Use MultiSelect when only one value is allowed.',
      'Hide important constraints, such as a maximum, until after submission.',
    ],
  },
  related: ['select', 'combobox', 'checkbox-group', 'tag'],
};

export function Basic() {
  return (
    <div style={{ width: 360 }}>
      <FormField
        label="Apply template to"
        description="Members of these departments receive the signature."
      >
        <MultiSelect
          options={departments}
          defaultValue={['sales', 'marketing']}
          placeholder="Choose departments"
        />
      </FormField>
    </div>
  );
}

export function Searchable() {
  return (
    <div style={{ width: 360 }}>
      <FormField label="Departments">
        <MultiSelect options={departments} searchable placeholder="Search departments" />
      </FormField>
    </div>
  );
}

export function Controlled() {
  const [value, setValue] = React.useState<string[]>([
    'sales',
    'legal',
    'finance',
    'support',
    'engineering',
  ]);
  return (
    <div style={{ display: 'grid', gap: 8, width: 360 }}>
      <FormField label="Departments">
        <MultiSelect options={departments} value={value} onValueChange={setValue} maxTags={2} />
      </FormField>
      <span style={{ color: 'var(--st-color-fg-muted)', fontSize: 'var(--st-font-size-sm)' }}>
        {value.length} departments selected
      </span>
    </div>
  );
}

export function Invalid() {
  return (
    <div style={{ width: 360 }}>
      <FormField label="Departments" error="Select at least one department" required>
        <MultiSelect options={departments} />
      </FormField>
    </div>
  );
}

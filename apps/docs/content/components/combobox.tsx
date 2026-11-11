import * as React from 'react';
import { Combobox, FormField, Icon, type SelectOptions } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

const members: SelectOptions = [
  { value: 'u1', label: 'Amara Okafor', description: 'Legal · amara@binds.si' },
  { value: 'u2', label: 'Ben Hughes', description: 'Sales · ben@binds.si' },
  { value: 'u3', label: 'Chen Wei', description: 'Finance · chen@binds.si' },
  { value: 'u4', label: 'Dana Ruiz', description: 'Marketing · dana@binds.si' },
  { value: 'u5', label: 'Elif Demir', description: 'Support · elif@binds.si' },
  { value: 'u6', label: 'Farah Khan', description: 'Suspended', disabled: true },
];

export const doc: ComponentDoc = {
  slug: 'combobox',
  name: 'Combobox',
  category: 'forms',
  summary:
    'An editable input with a filtered list of suggestions, supporting async search and custom values.',
  description:
    'Use Combobox when the list is long enough that people need to type to find an option, such as assigning a template to one of hundreds of organisation users. It filters as you type, can search a server (filter={false} with a controlled input), and can accept free text with allowCustomValue. For short fixed lists use Select.',
  imports: ['Combobox', 'type SelectOptions'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', minHeight: 360, layout: 'start' },
    {
      name: 'AsyncSearch',
      title: 'Async search',
      description: 'Disable local filtering and drive options and loading from your API.',
      minHeight: 360,
      layout: 'start',
    },
    {
      name: 'CustomValue',
      title: 'Custom values',
      description: 'Accept text that matches no option.',
      minHeight: 320,
      layout: 'start',
    },
    { name: 'States', title: 'Error and disabled', minHeight: 220, layout: 'start' },
  ],
  props: [
    {
      component: 'Combobox',
      name: 'options',
      type: 'SelectOptions',
      required: true,
      description: 'Options or groups, as in Select.',
    },
    {
      component: 'Combobox',
      name: 'value / defaultValue',
      type: 'string | null',
      default: 'null',
      description: 'Selected value (controlled or initial).',
    },
    {
      component: 'Combobox',
      name: 'onValueChange',
      type: '(value: string | null) => void',
      description: 'Called when a value is chosen or cleared.',
    },
    {
      component: 'Combobox',
      name: 'inputValue / defaultInputValue',
      type: 'string',
      description: 'Text in the input (controlled or initial).',
    },
    {
      component: 'Combobox',
      name: 'onInputChange',
      type: '(text: string) => void',
      description: 'Called as the user types. Trigger async searches here.',
    },
    {
      component: 'Combobox',
      name: 'filter',
      type: 'boolean | (option, query) => boolean',
      default: 'true',
      description: 'Local filtering; false for server-side search.',
    },
    {
      component: 'Combobox',
      name: 'allowCustomValue',
      type: 'boolean',
      default: 'false',
      description: 'Accept unmatched text as the value.',
    },
    {
      component: 'Combobox',
      name: 'loading / loadingText',
      type: 'boolean / ReactNode',
      default: "false / 'Loading…'",
      description: 'Shows a loading row and aria-busy.',
    },
    {
      component: 'Combobox',
      name: 'emptyText',
      type: 'ReactNode',
      default: "'No results'",
      description: 'Shown when nothing matches.',
    },
    {
      component: 'Combobox',
      name: 'openOnFocus',
      type: 'boolean',
      default: 'false',
      description: 'Open the list when focused.',
    },
    {
      component: 'Combobox',
      name: 'clearable',
      type: 'boolean',
      default: 'true',
      description: 'Show a clear button when there is text.',
    },
    {
      component: 'Combobox',
      name: 'prefix',
      type: 'ReactNode',
      description: 'Leading content inside the field.',
    },
    {
      component: 'Combobox',
      name: 'name / form',
      type: 'string',
      description: 'Submits the selected value through a hidden input.',
    },
    {
      component: 'Combobox',
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
      default: "'md'",
      description: 'Control height.',
    },
    {
      component: 'Combobox',
      name: 'open / defaultOpen / onOpenChange',
      type: 'boolean / function',
      description: 'Popup open state.',
    },
    {
      component: 'Combobox',
      name: 'renderOption',
      type: '(option, state) => ReactNode',
      description: 'Custom option content.',
    },
  ],
  accessibility: [
    'The input has role="combobox", aria-autocomplete="list", aria-expanded and aria-controls (WAI-ARIA APG).',
    'The active suggestion is announced through aria-activedescendant while focus stays in the input.',
    'Loading and empty states are announced through role="status"; the list sets aria-busy while loading.',
    'Without allowCustomValue, unmatched text reverts to the selected option on blur, so the value is never ambiguous.',
  ],
  keyboard: [
    { keys: ['ArrowDown'], description: 'Open the list, or move to the next suggestion (wraps).' },
    {
      keys: ['ArrowUp'],
      description: 'Open at the last suggestion, or move to the previous one (wraps).',
    },
    { keys: ['Alt+ArrowDown'], description: 'Open the list without moving the active suggestion.' },
    { keys: ['Enter'], description: 'Choose the active suggestion, or commit typed text.' },
    { keys: ['Escape'], description: 'Close the list; when closed, clear the input.' },
    { keys: ['Tab'], description: 'Choose the active suggestion after typing, and move on.' },
  ],
  guidelines: {
    do: [
      'Debounce async searches by around 200ms.',
      'Use descriptions to tell similar options apart, such as email addresses.',
    ],
    dont: [
      'Use Combobox for short lists where Select is faster.',
      'Allow custom values when only listed values are valid.',
    ],
  },
  related: ['select', 'multi-select', 'search-input', 'command-menu'],
};

export function Basic() {
  return (
    <div style={{ width: 360 }}>
      <FormField label="Assign signature to" description="Search your organisation’s users.">
        <Combobox options={members} placeholder="Type a name" prefix={<Icon name="search" />} />
      </FormField>
    </div>
  );
}

export function AsyncSearch() {
  const [text, setText] = React.useState('');
  const [results, setResults] = React.useState<SelectOptions>([]);
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    if (!text) {
      setResults([]);
      return;
    }
    setLoading(true);
    // Stand-in for a debounced API call.
    const timer = setTimeout(() => {
      const q = text.toLowerCase();
      setResults(
        members.filter(
          (m) => 'label' in m && !('options' in m) && m.label.toLowerCase().includes(q),
        ),
      );
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [text]);
  return (
    <div style={{ width: 360 }}>
      <FormField label="Find a user">
        <Combobox
          options={results}
          filter={false}
          inputValue={text}
          onInputChange={setText}
          loading={loading}
          emptyText={text ? 'No users found' : 'Start typing to search'}
        />
      </FormField>
    </div>
  );
}

export function CustomValue() {
  const [value, setValue] = React.useState<string | null>(null);
  return (
    <div style={{ display: 'grid', gap: 8, width: 360 }}>
      <FormField label="Contract category">
        <Combobox
          allowCustomValue
          value={value}
          onValueChange={setValue}
          options={[
            { value: 'nda', label: 'Non-disclosure agreement' },
            { value: 'msa', label: 'Master services agreement' },
            { value: 'sow', label: 'Statement of work' },
          ]}
        />
      </FormField>
      <span style={{ color: 'var(--st-color-fg-muted)', fontSize: 'var(--st-font-size-sm)' }}>
        Value: {value ?? 'none'}
      </span>
    </div>
  );
}

export function States() {
  return (
    <div style={{ display: 'grid', gap: 16, width: 360 }}>
      <FormField label="Owner" error="Choose an owner for this template" required>
        <Combobox options={members} />
      </FormField>
      <FormField label="Created by" disabled>
        <Combobox options={members} defaultValue="u1" />
      </FormField>
    </div>
  );
}

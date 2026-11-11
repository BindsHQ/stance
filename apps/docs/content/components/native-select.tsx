import { FormField, NativeSelect } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'native-select',
  name: 'NativeSelect',
  category: 'forms',
  summary: 'A styled native <select> for simple choices and long lists.',
  description:
    'NativeSelect keeps the operating system picker, which is the most usable option on phones and works without JavaScript. Use it for straightforward single choices such as country, role or time zone. Use Select when options need icons, descriptions or custom rendering, and Combobox when users need to type to filter.',
  imports: ['NativeSelect', 'FormField'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', layout: 'start' },
    { name: 'Groups', title: 'Option groups', layout: 'start' },
    { name: 'States', title: 'Sizes and states', layout: 'start' },
  ],
  props: [
    {
      component: 'NativeSelect',
      name: 'options',
      type: 'NativeSelectOption[]',
      description: 'Options as data: { value, label, disabled? }. Or pass <option> children.',
    },
    {
      component: 'NativeSelect',
      name: 'placeholder',
      type: 'string',
      description: 'Adds a disabled empty first option, selected by default.',
    },
    {
      component: 'NativeSelect',
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
      default: "'md'",
      description: 'Control height.',
    },
    {
      component: 'NativeSelect',
      name: 'invalid',
      type: 'boolean',
      description: 'Marks the field invalid.',
    },
    {
      component: 'NativeSelect',
      name: 'wrapperClassName',
      type: 'string',
      description: 'Class for the outer field box.',
    },
    {
      component: 'NativeSelect',
      name: '...props',
      type: 'SelectHTMLAttributes',
      description: 'Native select attributes.',
    },
  ],
  accessibility: [
    'Uses the native element, so screen reader and keyboard support come from the platform.',
    'Integrates with FormField for label, description and error.',
    'Avoid an empty placeholder as the only label; always provide a visible label.',
  ],
  keyboard: [
    {
      keys: ['Space', 'Enter', 'Alt+ArrowDown'],
      description: 'Opens the picker (platform dependent).',
    },
    { keys: ['ArrowUp', 'ArrowDown'], description: 'Changes the selection.' },
    { keys: ['Type a character'], description: 'Jumps to matching options.' },
  ],
  related: ['select', 'combobox'],
};

export function Basic() {
  return (
    <div style={{ width: '100%', maxWidth: 320 }}>
      <FormField label="Role">
        <NativeSelect
          placeholder="Choose a role"
          options={[
            { value: 'owner', label: 'Owner' },
            { value: 'admin', label: 'Admin' },
            { value: 'member', label: 'Member' },
            { value: 'viewer', label: 'Viewer (read only)' },
          ]}
        />
      </FormField>
    </div>
  );
}

export function Groups() {
  return (
    <div style={{ width: '100%', maxWidth: 320 }}>
      <FormField label="Time zone">
        <NativeSelect defaultValue="Europe/London">
          <optgroup label="Europe">
            <option value="Europe/London">London (GMT)</option>
            <option value="Europe/Berlin">Berlin (CET)</option>
          </optgroup>
          <optgroup label="Asia">
            <option value="Asia/Kolkata">Kolkata (IST)</option>
            <option value="Asia/Singapore">Singapore (SGT)</option>
          </optgroup>
        </NativeSelect>
      </FormField>
    </div>
  );
}

export function States() {
  const options = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'annual', label: 'Annual' },
  ];
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 320 }}>
      <NativeSelect size="sm" aria-label="Billing (small)" options={options} />
      <FormField label="Billing cycle" error="Choose a billing cycle">
        <NativeSelect placeholder="Select…" options={options} />
      </FormField>
      <FormField label="Plan" disabled>
        <NativeSelect options={[{ value: 'team', label: 'Team' }]} />
      </FormField>
    </div>
  );
}

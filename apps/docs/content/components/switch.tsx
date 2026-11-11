import { FormField, Switch } from '@bindshq/stance-react';
import * as React from 'react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'switch',
  name: 'Switch',
  category: 'forms',
  summary: 'An on/off toggle for settings that take effect immediately.',
  description:
    'Use Switch for binary settings that apply as soon as they change, like enabling automatic deployment or two-factor authentication. If the change only applies when a form is submitted, use Checkbox instead.',
  imports: ['Switch'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', layout: 'start' },
    { name: 'WithDescription', title: 'With description', layout: 'start' },
    {
      name: 'SettingsList',
      title: 'Settings list',
      description: 'Label at the start aligns switches in a column.',
      layout: 'fill',
    },
    { name: 'States', title: 'Sizes and states', layout: 'start' },
  ],
  props: [
    { component: 'Switch', name: 'checked', type: 'boolean', description: 'Controlled state.' },
    {
      component: 'Switch',
      name: 'defaultChecked',
      type: 'boolean',
      default: 'false',
      description: 'Initial state.',
    },
    {
      component: 'Switch',
      name: 'onCheckedChange',
      type: '(checked: boolean) => void',
      description: 'Called with the new state.',
    },
    {
      component: 'Switch',
      name: 'label',
      type: 'ReactNode',
      description: 'Visible label. Without it use aria-label or FormField.',
    },
    {
      component: 'Switch',
      name: 'description',
      type: 'ReactNode',
      description: 'Help text, linked via aria-describedby.',
    },
    {
      component: 'Switch',
      name: 'size',
      type: "'sm' | 'md'",
      default: "'md'",
      description: 'Track size.',
    },
    {
      component: 'Switch',
      name: 'labelPosition',
      type: "'start' | 'end'",
      default: "'end'",
      description: 'Label before or after the track.',
    },
    {
      component: 'Switch',
      name: 'name / value',
      type: 'string',
      default: "value 'on'",
      description: 'Submit with forms via a hidden input.',
    },
    {
      component: 'Switch',
      name: 'readOnly',
      type: 'boolean',
      default: 'false',
      description: 'Prevents changes but stays focusable.',
    },
    {
      component: 'Switch',
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Disables the switch.',
    },
  ],
  accessibility: [
    'Renders a button with role="switch" and aria-checked, announced as "on" or "off".',
    'The label is linked with aria-labelledby and clicking it toggles the switch.',
    'State is shown by thumb position and fill, not colour alone, and remains clear in forced colours.',
  ],
  keyboard: [
    { keys: ['Space'], description: 'Toggles the switch.' },
    { keys: ['Enter'], description: 'Toggles the switch.' },
  ],
  guidelines: {
    do: [
      'Describe the setting, not the action: “Automatic deployment”.',
      'Apply the change immediately and confirm it.',
    ],
    dont: ['Use a switch inside a form that needs a Save button.'],
  },
  playground: {
    render: (p) => (
      <Switch
        label={p.label as string}
        size={p.size as 'md'}
        labelPosition={p.labelPosition as 'end'}
        disabled={p.disabled as boolean}
      />
    ),
    controls: {
      label: { type: 'text', default: 'Automatic deployment' },
      size: { type: 'select', options: ['sm', 'md'], default: 'md' },
      labelPosition: { type: 'select', options: ['end', 'start'], default: 'end' },
      disabled: { type: 'boolean', default: false },
    },
  },
  related: ['checkbox', 'toggle-button'],
};

export function Basic() {
  return <Switch label="Automatic deployment" defaultChecked />;
}

export function WithDescription() {
  return (
    <Switch
      label="Require two-factor authentication"
      description="All administrators must confirm sign-in with a second factor."
    />
  );
}

export function SettingsList() {
  const [settings, setSettings] = React.useState({
    banner: true,
    tracking: false,
    reminders: true,
  });
  const rows: { key: keyof typeof settings; label: string; description: string }[] = [
    {
      key: 'banner',
      label: 'Campaign banner',
      description: 'Show the current campaign below every signature.',
    },
    { key: 'tracking', label: 'Link tracking', description: 'Count clicks on signature links.' },
    {
      key: 'reminders',
      label: 'Signing reminders',
      description: 'Remind signers every three days.',
    },
  ];
  return (
    <div style={{ display: 'grid', gap: 20, width: '100%', maxWidth: 520 }}>
      {rows.map((r) => (
        <Switch
          key={r.key}
          label={r.label}
          description={r.description}
          labelPosition="start"
          style={{ justifyContent: 'space-between', width: '100%' }}
          checked={settings[r.key]}
          onCheckedChange={(v) => setSettings((s) => ({ ...s, [r.key]: v }))}
        />
      ))}
    </div>
  );
}

export function States() {
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <Switch size="sm" label="Small" defaultChecked />
      <Switch label="Disabled" disabled />
      <Switch label="Disabled on" disabled defaultChecked />
      <FormField label="Single sign-on" description="Managed by your identity provider" readOnly>
        <Switch defaultChecked />
      </FormField>
    </div>
  );
}

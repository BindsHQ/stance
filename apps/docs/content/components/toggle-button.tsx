import { Icon, ToggleButton, ToggleButtonGroup } from '@bindshq/stance-react';
import * as React from 'react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'toggle-button',
  name: 'ToggleButton',
  category: 'actions',
  summary: 'A button that stays pressed, alone or in a group with single or multiple selection.',
  description:
    'Use ToggleButton for a setting that switches on and off in place, like bold text or showing gridlines. ToggleButtonGroup arranges several toggles with one tab stop and arrow-key navigation: type="single" works like a segmented control (alignment, view mode) and type="multiple" allows any combination (text formatting). For settings that take effect as preferences, prefer Switch.',
  imports: ['ToggleButton', 'ToggleButtonGroup'],
  status: 'stable',
  examples: [
    {
      name: 'Single',
      title: 'Single selection',
      description: 'Pass required to prevent deselecting the active option.',
    },
    { name: 'Standalone', title: 'Standalone' },
    { name: 'Multiple', title: 'Multiple selection' },
    { name: 'Controlled', title: 'Controlled' },
  ],
  props: [
    {
      component: 'ToggleButton',
      name: 'pressed',
      type: 'boolean',
      description: 'Controlled pressed state (standalone).',
    },
    {
      component: 'ToggleButton',
      name: 'defaultPressed',
      type: 'boolean',
      default: 'false',
      description: 'Initial pressed state (standalone).',
    },
    {
      component: 'ToggleButton',
      name: 'onPressedChange',
      type: '(pressed: boolean) => void',
      description: 'Called when toggled.',
    },
    {
      component: 'ToggleButton',
      name: 'value',
      type: 'string',
      description: 'Identifies the button inside a group.',
    },
    {
      component: 'ToggleButton',
      name: 'icon',
      type: 'ReactNode',
      description: 'Icon before the label.',
    },
    {
      component: 'ToggleButton',
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
      default: "'md'",
      description: 'Inherited from the group.',
    },
    {
      component: 'ToggleButtonGroup',
      name: 'type',
      type: "'single' | 'multiple'",
      default: "'single'",
      description: 'Selection mode.',
    },
    {
      component: 'ToggleButtonGroup',
      name: 'value',
      type: 'string | null | string[]',
      description: 'Controlled value: a string (single) or array (multiple).',
    },
    {
      component: 'ToggleButtonGroup',
      name: 'defaultValue',
      type: 'string | null | string[]',
      description: 'Initial value.',
    },
    {
      component: 'ToggleButtonGroup',
      name: 'onValueChange',
      type: '(value) => void',
      description: 'Called with the new value.',
    },
    {
      component: 'ToggleButtonGroup',
      name: 'required',
      type: 'boolean',
      default: 'false',
      description: 'Single mode: prevent clearing the selection.',
    },
    {
      component: 'ToggleButtonGroup',
      name: 'label',
      type: 'string',
      description: 'Accessible name for the group.',
    },
    {
      component: 'ToggleButtonGroup',
      name: 'attached',
      type: 'boolean',
      default: 'true',
      description: 'Join buttons into a segmented bar.',
    },
    {
      component: 'ToggleButtonGroup',
      name: 'orientation',
      type: "'horizontal' | 'vertical'",
      default: "'horizontal'",
      description: 'Layout and arrow-key axis.',
    },
  ],
  accessibility: [
    'Each toggle exposes aria-pressed, so assistive technology announces "pressed" or "not pressed".',
    'The group has one tab stop: Tab enters on the selected item and arrow keys move between items (roving tabindex).',
    'Keep the label constant while toggling; the pressed state communicates the change, not a new label.',
  ],
  keyboard: [
    { keys: ['Space', 'Enter'], description: 'Toggles the focused button.' },
    { keys: ['ArrowRight', 'ArrowLeft'], description: 'Moves focus within a horizontal group.' },
    { keys: ['ArrowDown', 'ArrowUp'], description: 'Moves focus within a vertical group.' },
    { keys: ['Home', 'End'], description: 'Moves to the first or last button.' },
  ],
  guidelines: {
    do: ['Use icons with text, or provide aria-label on icon-only toggles.'],
    dont: ['Change the button label when its state changes.'],
  },
  related: ['button-group', 'switch', 'toolbar'],
};

export function Single() {
  return (
    <ToggleButtonGroup label="Template view" defaultValue="grid" required>
      <ToggleButton value="grid" icon={<Icon name="layout-grid" />}>
        Grid
      </ToggleButton>
      <ToggleButton value="list" icon={<Icon name="list" />}>
        List
      </ToggleButton>
    </ToggleButtonGroup>
  );
}

export function Standalone() {
  return (
    <ToggleButton defaultPressed icon={<Icon name="eye" />}>
      Show placeholders
    </ToggleButton>
  );
}

export function Multiple() {
  return (
    <ToggleButtonGroup
      type="multiple"
      label="Show in signature"
      defaultValue={['phone', 'logo']}
      attached={false}
    >
      <ToggleButton value="phone">Phone</ToggleButton>
      <ToggleButton value="address">Address</ToggleButton>
      <ToggleButton value="logo">Logo</ToggleButton>
      <ToggleButton value="social">Social links</ToggleButton>
    </ToggleButtonGroup>
  );
}

export function Controlled() {
  const [value, setValue] = React.useState<string | null>('desktop');
  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
      <ToggleButtonGroup
        label="Preview device"
        value={value}
        onValueChange={setValue}
        required
        size="sm"
      >
        <ToggleButton value="desktop" icon={<Icon name="monitor" />}>
          Desktop
        </ToggleButton>
        <ToggleButton value="mobile">Mobile</ToggleButton>
      </ToggleButtonGroup>
      <span style={{ fontSize: 14 }}>Previewing on: {value}</span>
    </div>
  );
}

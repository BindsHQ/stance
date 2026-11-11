import { FormField, TimePicker } from '@bindshq/stance-react';
import { useState } from 'react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'time-picker',
  name: 'TimePicker',
  category: 'forms',
  summary: 'Enter a time of day with keyboard-friendly hour and minute segments.',
  description:
    'TimePicker uses separate spinbutton segments, the same model as the native time input: type digits (focus advances automatically) or use the arrow keys. The value is always 24-hour HH:MM (or HH:MM:SS) regardless of display, so it is easy to store and submit. The hour cycle follows the locale unless set.',
  imports: ['TimePicker'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic' },
    { name: 'TwelveHour', title: '12-hour with AM/PM' },
    {
      name: 'Step',
      title: 'Quarter-hour steps',
      description: 'Arrow keys move minutes in 15-minute increments.',
    },
    { name: 'WithSeconds', title: 'Seconds, clearable and disabled' },
  ],
  props: [
    {
      component: 'TimePicker',
      name: 'value / defaultValue',
      type: 'string | null',
      description: '24-hour `HH:MM` or `HH:MM:SS`; null while incomplete.',
    },
    {
      component: 'TimePicker',
      name: 'onValueChange',
      type: '(value: string | null) => void',
      description: 'Called when the time changes.',
    },
    {
      component: 'TimePicker',
      name: 'hourCycle',
      type: '12 | 24',
      default: 'locale',
      description: 'Display cycle.',
    },
    {
      component: 'TimePicker',
      name: 'locale',
      type: 'string',
      description: 'Used to pick the default hour cycle.',
    },
    {
      component: 'TimePicker',
      name: 'step',
      type: 'number',
      default: '1',
      description: 'Minute increment for arrow keys.',
    },
    {
      component: 'TimePicker',
      name: 'showSeconds',
      type: 'boolean',
      default: 'false',
      description: 'Adds a seconds segment.',
    },
    {
      component: 'TimePicker',
      name: 'name',
      type: 'string',
      description: 'Hidden input name for form submission.',
    },
    {
      component: 'TimePicker',
      name: 'clearable',
      type: 'boolean',
      default: 'false',
      description: 'Show a clear button.',
    },
    {
      component: 'TimePicker',
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
      default: "'md'",
      description: 'Field height.',
    },
    {
      component: 'TimePicker',
      name: 'disabled / required / invalid',
      type: 'boolean',
      description: 'States, also inherited from FormField.',
    },
    {
      component: 'TimePicker',
      name: 'labels',
      type: 'Partial<TimePickerLabels>',
      description: 'Segment names and AM/PM text.',
    },
  ],
  accessibility: [
    'A group named by its FormField label, containing spinbuttons named Hours, Minutes (Seconds) and AM/PM.',
    'Each spinbutton exposes aria-valuenow, min, max and a text value; empty segments announce “Empty”.',
    'Each segment is a tab stop, matching native time inputs.',
  ],
  keyboard: [
    { keys: ['↑', '↓'], description: 'Increment / decrement the segment (wraps).' },
    { keys: ['0–9'], description: 'Type a value; focus advances when the segment is complete.' },
    { keys: ['←', '→'], description: 'Move between segments.' },
    { keys: ['Home', 'End'], description: 'Minimum / maximum value.' },
    { keys: ['Backspace'], description: 'Clear the segment.' },
    { keys: ['A', 'P'], description: 'Set AM / PM.' },
  ],
  guidelines: {
    do: ['State the time zone in the description.', 'Use step for scheduling in fixed slots.'],
    dont: ['Use for durations; use NumberInput.'],
  },
  related: ['date-picker', 'number-input'],
};

export function Basic() {
  return (
    <FormField label="Send daily digest at" description="Europe/London" style={{ width: 220 }}>
      <TimePicker hourCycle={24} defaultValue="09:00" name="digestTime" />
    </FormField>
  );
}

export function TwelveHour() {
  const [time, setTime] = useState<string | null>('16:30');
  return (
    <div style={{ display: 'grid', gap: 8, width: 220 }}>
      <FormField label="Meeting starts">
        <TimePicker hourCycle={12} value={time} onValueChange={setTime} />
      </FormField>
      <p style={{ margin: 0, fontSize: 13 }}>Stored value: {time ?? '—'}</p>
    </div>
  );
}

export function Step() {
  return (
    <FormField label="Deployment slot" style={{ width: 220 }}>
      <TimePicker hourCycle={24} step={15} defaultValue="14:00" />
    </FormField>
  );
}

export function WithSeconds() {
  return (
    <div style={{ display: 'grid', gap: 12, width: 240 }}>
      <TimePicker
        aria-label="Sync time"
        hourCycle={24}
        showSeconds
        clearable
        defaultValue="06:00:30"
      />
      <TimePicker aria-label="Locked" hourCycle={24} disabled defaultValue="12:00" />
    </div>
  );
}

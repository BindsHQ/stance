import { DateRangePicker, FormField, type DateRange } from '@bindshq/stance-react';
import { useState } from 'react';
import type { ComponentDoc } from '../../lib/docs-types';

const TODAY = new Date(2026, 10, 11);
const day = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const presets = [
  { label: 'Today', range: (t: Date) => ({ start: t, end: t }) },
  { label: 'Last 7 days', range: (t: Date) => ({ start: day(t, -6), end: t }) },
  { label: 'Last 30 days', range: (t: Date) => ({ start: day(t, -29), end: t }) },
  {
    label: 'This month',
    range: (t: Date) => ({
      start: new Date(t.getFullYear(), t.getMonth(), 1),
      end: new Date(t.getFullYear(), t.getMonth() + 1, 0),
    }),
  },
];

export const doc: ComponentDoc = {
  slug: 'date-range-picker',
  name: 'DateRangePicker',
  category: 'forms',
  summary: 'Picks a start and end date from a two-month calendar, with optional preset ranges.',
  description:
    'Use DateRangePicker for reporting periods, campaign windows and filters. The popover closes once both dates are chosen. Presets cover common ranges in one click. With startName and endName, the dates are submitted as ISO values.',
  imports: ['DateRangePicker'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', minHeight: 460 },
    { name: 'WithPresets', title: 'With presets', minHeight: 460 },
    { name: 'Controlled', title: 'Controlled', minHeight: 460 },
  ],
  props: [
    {
      component: 'DateRangePicker',
      name: 'value / defaultValue',
      type: '{ start: Date | null; end: Date | null }',
      description: 'Selected range.',
    },
    {
      component: 'DateRangePicker',
      name: 'onValueChange',
      type: '(value: DateRange) => void',
      description: 'Called as the range changes.',
    },
    {
      component: 'DateRangePicker',
      name: 'presets',
      type: '{ label: string; range: (today: Date) => DateRange }[]',
      description: 'Shortcut ranges beside the calendar.',
    },
    {
      component: 'DateRangePicker',
      name: 'startName / endName',
      type: 'string',
      description: 'Hidden input names for form submission.',
    },
    {
      component: 'DateRangePicker',
      name: 'min / max / isDateDisabled',
      type: 'Date | null / (date) => boolean',
      description: 'Availability rules, as in Calendar.',
    },
    {
      component: 'DateRangePicker',
      name: 'numberOfMonths',
      type: '1 | 2',
      default: '2',
      description: 'Months shown.',
    },
    {
      component: 'DateRangePicker',
      name: 'locale / weekStartsOn',
      type: 'string / 0 to 6',
      description: 'Localisation.',
    },
    {
      component: 'DateRangePicker',
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
      default: "'md'",
      description: 'Trigger height.',
    },
    {
      component: 'DateRangePicker',
      name: 'invalid',
      type: 'boolean',
      description: 'Invalid styling and aria-invalid.',
    },
    {
      component: 'DateRangePicker',
      name: 'labels',
      type: 'Partial<DateRangePickerLabels>',
      description: 'placeholder, calendar, presets, clear.',
    },
  ],
  accessibility: [
    'The trigger is a button named by its FormField label, showing the current range or placeholder.',
    'The popover is a labelled dialog; presets are a named group of toggle buttons with aria-pressed.',
    'Range start and end days are announced as such, and in-range days are marked selected.',
    'Focus returns to the trigger when the popover closes.',
  ],
  keyboard: [
    { keys: ['Enter', 'Space'], description: 'Open the picker / choose a day or preset.' },
    { keys: ['Arrows', 'Page Up/Down'], description: 'Navigate days (see Calendar).' },
    { keys: ['Esc'], description: 'Close without changing the range.' },
  ],
  guidelines: {
    do: [
      'Offer presets for analytics views.',
      'Show the chosen range in the page heading or summary.',
    ],
    dont: ['Use two separate DatePickers for one range.'],
  },
  related: ['calendar', 'date-picker', 'filter-bar'],
};

export function Basic() {
  return (
    <FormField label="Campaign window" style={{ width: 300 }}>
      <DateRangePicker locale="en-GB" today={TODAY} startName="from" endName="to" />
    </FormField>
  );
}

export function WithPresets() {
  return (
    <FormField label="Reporting period" style={{ width: 300 }}>
      <DateRangePicker
        locale="en-GB"
        today={TODAY}
        presets={presets}
        defaultValue={presets[1]!.range(TODAY)}
      />
    </FormField>
  );
}

export function Controlled() {
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  return (
    <div style={{ display: 'grid', gap: 8, width: 300 }}>
      <DateRangePicker
        aria-label="Deployment window"
        locale="en-GB"
        today={TODAY}
        min={TODAY}
        value={range}
        onValueChange={setRange}
      />
      <p style={{ margin: 0, fontSize: 13 }}>
        {range.start && range.end
          ? `${range.start.toDateString()} → ${range.end.toDateString()}`
          : 'No range chosen'}
      </p>
    </div>
  );
}

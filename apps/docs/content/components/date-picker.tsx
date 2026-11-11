import { DatePicker, FormField } from '@bindshq/stance-react';
import { useState } from 'react';
import type { ComponentDoc } from '../../lib/docs-types';

const TODAY = new Date(2026, 10, 11);

export const doc: ComponentDoc = {
  slug: 'date-picker',
  name: 'DatePicker',
  category: 'forms',
  summary: 'A date field people can type into or fill from a calendar popover.',
  description:
    'Use DatePicker for a single date in a form. People can type the date in their locale’s order (for example 31/01/2026 in the UK), or open the calendar with the button or Alt+↓. Typed input is validated on blur and Enter. Inside a form, name submits the value as ISO yyyy-mm-dd.',
  imports: ['DatePicker'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', minHeight: 420 },
    {
      name: 'WithConstraints',
      title: 'With constraints',
      description: 'Weekdays from today onwards.',
      minHeight: 420,
    },
    { name: 'Controlled', title: 'Controlled', minHeight: 420 },
    { name: 'Sizes', title: 'Sizes and states', minHeight: 200 },
  ],
  props: [
    {
      component: 'DatePicker',
      name: 'value / defaultValue',
      type: 'Date | null',
      description: 'Selected date.',
    },
    {
      component: 'DatePicker',
      name: 'onValueChange',
      type: '(value: Date | null) => void',
      description: 'Called with the new date, or null when cleared.',
    },
    {
      component: 'DatePicker',
      name: 'name',
      type: 'string',
      description: 'Submits the ISO date in a hidden input.',
    },
    {
      component: 'DatePicker',
      name: 'min / max',
      type: 'Date | null',
      description: 'Selectable window; typed dates outside it are invalid.',
    },
    {
      component: 'DatePicker',
      name: 'isDateDisabled',
      type: '(date: Date) => boolean',
      description: 'Unavailable dates.',
    },
    {
      component: 'DatePicker',
      name: 'locale',
      type: 'string',
      description: 'Controls parsing order, display and calendar names.',
    },
    {
      component: 'DatePicker',
      name: 'weekStartsOn',
      type: '0–6',
      default: '1',
      description: 'First day of the week in the calendar.',
    },
    {
      component: 'DatePicker',
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
      default: "'md'",
      description: 'Field height.',
    },
    {
      component: 'DatePicker',
      name: 'clearable',
      type: 'boolean',
      default: 'true',
      description: 'Show a clear button when a date is set.',
    },
    {
      component: 'DatePicker',
      name: 'invalid',
      type: 'boolean',
      description: 'Marks the field invalid (set automatically inside an erroring FormField).',
    },
    {
      component: 'DatePicker',
      name: 'placeholder',
      type: 'string',
      default: 'locale pattern, e.g. dd/mm/yyyy',
      description: 'Placeholder text.',
    },
    {
      component: 'DatePicker',
      name: 'labels',
      type: 'Partial<DatePickerLabels>',
      description: 'openCalendar, clear, calendar.',
    },
    {
      component: 'DatePicker',
      name: 'disabled / readOnly / required',
      type: 'boolean',
      description: 'Native field states, also inherited from FormField.',
    },
  ],
  accessibility: [
    'The text input gets its label, description and error from FormField.',
    'The calendar button is labelled “Choose date” and reports aria-expanded; the popover is a labelled dialog.',
    'Opening moves focus to the selected (or today’s) day; choosing a date closes the popover and returns focus to the button.',
    'Unparseable or out-of-range typed input sets aria-invalid instead of silently discarding what was typed.',
  ],
  keyboard: [
    { keys: ['Alt + ↓'], description: 'Open the calendar from the text field.' },
    { keys: ['Enter'], description: 'Commit typed text.' },
    { keys: ['Esc'], description: 'Close the calendar.' },
    {
      keys: ['Arrows', 'Page Up/Down'],
      description: 'Navigate days in the calendar (see Calendar).',
    },
  ],
  guidelines: {
    do: [
      'Show the expected format in the description when typing is likely.',
      'Use min/max rather than validating after submit.',
    ],
    dont: ['Use for date ranges; use DateRangePicker.'],
  },
  related: ['calendar', 'date-range-picker', 'time-picker', 'form-field'],
};

export function Basic() {
  return (
    <FormField
      label="Go-live date"
      description="Signatures update at 00:00 on this day."
      style={{ width: 280 }}
    >
      <DatePicker locale="en-GB" today={TODAY} name="goLive" />
    </FormField>
  );
}

export function WithConstraints() {
  return (
    <FormField label="Roll-out date" style={{ width: 280 }}>
      <DatePicker
        locale="en-GB"
        today={TODAY}
        min={TODAY}
        isDateDisabled={(d) => d.getDay() === 0 || d.getDay() === 6}
      />
    </FormField>
  );
}

export function Controlled() {
  const [date, setDate] = useState<Date | null>(new Date(2026, 11, 1));
  return (
    <div style={{ display: 'grid', gap: 8, width: 280 }}>
      <FormField label="Contract renewal">
        <DatePicker locale="en-GB" today={TODAY} value={date} onValueChange={setDate} />
      </FormField>
      <p style={{ margin: 0, fontSize: 13 }}>{date ? date.toDateString() : 'No date chosen'}</p>
    </div>
  );
}

export function Sizes() {
  return (
    <div style={{ display: 'grid', gap: 12, width: 280 }}>
      <DatePicker aria-label="Small" size="sm" locale="en-GB" today={TODAY} />
      <DatePicker aria-label="Large" size="lg" locale="en-GB" today={TODAY} defaultValue={TODAY} />
      <FormField label="Invalid" error="Choose a date after today">
        <DatePicker locale="en-GB" today={TODAY} defaultValue={new Date(2026, 9, 1)} />
      </FormField>
      <DatePicker aria-label="Disabled" disabled locale="en-GB" today={TODAY} />
    </div>
  );
}

import { Calendar, type DateRange } from '@bindshq/stance-react';
import { useState } from 'react';
import type { ComponentDoc } from '../../lib/docs-types';

// Fixed dates keep the documentation deterministic.
const TODAY = new Date(2026, 10, 11);

export const doc: ComponentDoc = {
  slug: 'calendar',
  name: 'Calendar',
  category: 'forms',
  summary: 'A keyboard-accessible month grid for choosing a date or a date range.',
  description:
    'Calendar is the always-visible date grid used inside DatePicker and DateRangePicker. Use it directly when a date choice is the main task of the view, such as scheduling a signature roll-out. Dates outside min/max or rejected by isDateDisabled cannot be selected. Month and weekday names come from Intl, so it follows the chosen locale with no date library.',
  imports: ['Calendar'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic' },
    {
      name: 'Range',
      title: 'Range, two months',
      description: 'Click a start and end date; hovering previews the range.',
    },
    {
      name: 'Constraints',
      title: 'Min, max and disabled dates',
      description: 'Only weekdays in the next three weeks are available.',
    },
    {
      name: 'Localised',
      title: 'Locale and week start',
      description: 'US English with weeks starting on Sunday.',
    },
  ],
  props: [
    {
      component: 'Calendar',
      name: 'mode',
      type: "'single' | 'range'",
      default: "'single'",
      description: 'Select one date or a range.',
    },
    {
      component: 'Calendar',
      name: 'value',
      type: 'Date | null  |  { start, end }',
      description: 'Controlled value (shape depends on mode).',
    },
    {
      component: 'Calendar',
      name: 'defaultValue',
      type: 'Date | null  |  { start, end }',
      description: 'Initial value when uncontrolled.',
    },
    {
      component: 'Calendar',
      name: 'onValueChange',
      type: '(value) => void',
      description: 'Called with the new date or range.',
    },
    {
      component: 'Calendar',
      name: 'month / defaultMonth / onMonthChange',
      type: 'Date / Date / (month: Date) => void',
      description: 'The first displayed month.',
    },
    {
      component: 'Calendar',
      name: 'min',
      type: 'Date | null',
      description: 'Earliest selectable date.',
    },
    {
      component: 'Calendar',
      name: 'max',
      type: 'Date | null',
      description: 'Latest selectable date.',
    },
    {
      component: 'Calendar',
      name: 'isDateDisabled',
      type: '(date: Date) => boolean',
      description: 'Marks individual dates unavailable.',
    },
    {
      component: 'Calendar',
      name: 'weekStartsOn',
      type: '0 | 1 | 2 | 3 | 4 | 5 | 6',
      default: '1',
      description: '0 = Sunday, 1 = Monday.',
    },
    {
      component: 'Calendar',
      name: 'locale',
      type: 'string',
      description: 'BCP 47 locale for names and labels.',
    },
    {
      component: 'Calendar',
      name: 'captionLayout',
      type: "'dropdown' | 'label'",
      default: "'dropdown' for one month",
      description:
        'Dropdown shows month and year menus so people can jump to a distant date. Label shows a plain title.',
    },
    {
      component: 'Calendar',
      name: 'fromYear / toYear',
      type: 'number',
      description:
        'First and last year in the year menu. Default to the min and max years, or 100 years back and 10 ahead.',
    },
    {
      component: 'Calendar',
      name: 'numberOfMonths',
      type: '1 | 2',
      default: '1',
      description: 'Months shown side by side.',
    },
    {
      component: 'Calendar',
      name: 'showOutsideDays',
      type: 'boolean',
      default: 'true',
      description: 'Show adjacent-month days (single month only).',
    },
    {
      component: 'Calendar',
      name: 'today',
      type: 'Date',
      description: 'Override today, e.g. for a time zone or tests.',
    },
    {
      component: 'Calendar',
      name: 'autoFocus',
      type: 'boolean',
      default: 'false',
      description: 'Focus the active day on mount.',
    },
    {
      component: 'Calendar',
      name: 'labels',
      type: 'Partial<CalendarLabels>',
      description: 'Translatable strings for navigation and day states.',
    },
  ],
  accessibility: [
    'Month and year menus are native selects with accessible names, so they work with every keyboard, screen reader and touch device.',
    'Each month is a grid labelled by its month and year; weekday headers carry full names via abbr.',
    'Each day is a button with a full spoken label, e.g. “Wednesday, 11 November 2026, Today, Selected”; today has aria-current="date".',
    'Unavailable days stay discoverable but are announced as unavailable and cannot be chosen.',
    'The month title is a polite live region, so changing months by keyboard is announced.',
    'One day is in the Tab order; arrow keys, Page Up/Down and Home/End follow the APG date grid model.',
  ],
  keyboard: [
    { keys: ['←', '→'], description: 'Previous / next day.' },
    { keys: ['↑', '↓'], description: 'Same day previous / next week.' },
    { keys: ['Home', 'End'], description: 'First / last day of the week.' },
    { keys: ['Page Up', 'Page Down'], description: 'Same day previous / next month.' },
    {
      keys: ['Shift + Page Up', 'Shift + Page Down'],
      description: 'Same day previous / next year.',
    },
    {
      keys: ['Enter', 'Space'],
      description: 'Select the focused day (start, then end in range mode).',
    },
  ],
  guidelines: {
    do: ['Set min and max whenever dates outside a window are invalid.', 'Use the user’s locale.'],
    dont: [
      'Use a calendar for dates far in the past, like birth dates; let people type instead (DatePicker).',
    ],
  },
  related: ['date-picker', 'date-range-picker', 'time-picker'],
};

export function Basic() {
  const [date, setDate] = useState<Date | null>(new Date(2026, 10, 18));
  return <Calendar today={TODAY} locale="en-GB" value={date} onValueChange={setDate} />;
}

export function Range() {
  const [range, setRange] = useState<DateRange>({
    start: new Date(2026, 10, 16),
    end: new Date(2026, 10, 27),
  });
  return (
    <Calendar
      mode="range"
      numberOfMonths={2}
      today={TODAY}
      locale="en-GB"
      value={range}
      onValueChange={setRange}
    />
  );
}

export function Constraints() {
  return (
    <Calendar
      today={TODAY}
      locale="en-GB"
      min={TODAY}
      max={new Date(2026, 11, 2)}
      isDateDisabled={(d) => d.getDay() === 0 || d.getDay() === 6}
    />
  );
}

export function Localised() {
  return (
    <Calendar today={TODAY} locale="en-US" weekStartsOn={0} defaultValue={new Date(2026, 10, 26)} />
  );
}

import * as React from 'react';
import { Button, FilterChip } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'filter-chip',
  name: 'FilterChip',
  category: 'forms',
  summary: 'A filter control showing its name and current value, editable in a popover.',
  description:
    'FilterChip packs a filter into one compact control. When inactive it reads "+ Status". When active it shows the selected value and a clear button. Put any editor you like inside the popover, such as checkboxes, a date range or a search list. Combine several in a FilterBar.',
  imports: ['FilterChip'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', minHeight: 260 },
    { name: 'States', title: 'Inactive and active' },
    { name: 'Sizes', title: 'Sizes' },
  ],
  props: [
    {
      component: 'FilterChip',
      name: 'label',
      type: 'string',
      required: true,
      description: 'Filter name, e.g. "Status".',
    },
    {
      component: 'FilterChip',
      name: 'value',
      type: 'ReactNode',
      description: 'Summary of the selection; empty means inactive.',
    },
    {
      component: 'FilterChip',
      name: 'children',
      type: 'ReactNode',
      description: 'Editor rendered in the popover.',
    },
    {
      component: 'FilterChip',
      name: 'onClear',
      type: '() => void',
      description: 'Shows a clear button while active.',
    },
    {
      component: 'FilterChip',
      name: 'open',
      type: 'boolean',
      description: 'Controlled popover state.',
    },
    {
      component: 'FilterChip',
      name: 'defaultOpen',
      type: 'boolean',
      description: 'Initial popover state.',
    },
    {
      component: 'FilterChip',
      name: 'onOpenChange',
      type: '(open: boolean) => void',
      description: 'Called when the popover opens or closes.',
    },
    {
      component: 'FilterChip',
      name: 'contentProps',
      type: 'PopoverContentProps',
      description: 'Props for the popover surface.',
    },
    {
      component: 'FilterChip',
      name: 'size',
      type: "'sm' | 'md'",
      default: "'md'",
      description: 'Control height.',
    },
    {
      component: 'FilterChip',
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Disables the trigger and clear button.',
    },
  ],
  accessibility: [
    'The trigger is a button with aria-expanded. Its name includes the filter and value, e.g. "Status: Signed, Pending".',
    'The popover is a labelled dialog ("Status filter") that returns focus to the trigger on close.',
    'The clear button is a separate button labelled "Clear Status filter", never nested inside the trigger.',
    'Inactive filters use a dashed border plus a plus icon, so state is not shown by colour alone.',
  ],
  keyboard: [
    { keys: ['Enter', 'Space'], description: 'Opens the filter editor.' },
    { keys: ['Escape'], description: 'Closes the editor and returns focus.' },
    { keys: ['Tab'], description: 'Moves from the trigger to the clear button.' },
  ],
  guidelines: {
    do: ['Summarise long selections, e.g. "Signed +2".'],
    dont: ['Apply changes on every keystroke when results are slow; add an Apply button.'],
  },
  related: ['filter-bar', 'chip', 'popover'],
};

const statuses = ['Signed', 'Awaiting signature', 'Expired', 'Draft'];

export function Basic() {
  const [selected, setSelected] = React.useState<string[]>(['Signed']);
  const summary =
    selected.length > 2 ? `${selected[0]} +${selected.length - 1}` : selected.join(', ');
  return (
    <FilterChip label="Status" value={summary} onClear={() => setSelected([])}>
      <fieldset style={{ border: 0, margin: 0, padding: 0, display: 'grid', gap: 8 }}>
        <legend style={{ fontWeight: 600, marginBottom: 8 }}>Contract status</legend>
        {statuses.map((s) => (
          <label key={s} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={selected.includes(s)}
              onChange={(e) =>
                setSelected((all) => (e.target.checked ? [...all, s] : all.filter((x) => x !== s)))
              }
            />
            {s}
          </label>
        ))}
      </fieldset>
    </FilterChip>
  );
}

export function States() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <FilterChip label="Owner" />
      <FilterChip label="Department" value="Sales" onClear={() => {}} />
      <FilterChip label="Created" value="Last 30 days" onClear={() => {}} disabled />
    </div>
  );
}

export function Sizes() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <FilterChip size="sm" label="Template" value="Executive" onClear={() => {}}>
        <Button size="sm" variant="outline">
          Choose template
        </Button>
      </FilterChip>
      <FilterChip label="Template" value="Executive" onClear={() => {}}>
        <Button size="sm" variant="outline">
          Choose template
        </Button>
      </FilterChip>
    </div>
  );
}

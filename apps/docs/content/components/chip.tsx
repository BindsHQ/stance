import * as React from 'react';
import { Chip, Icon } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'chip',
  name: 'Chip',
  category: 'actions',
  summary: 'A selectable toggle chip for quick filters and choices.',
  description:
    'Use Chip for lightweight on/off choices, such as quick filters above a list. Each chip is a toggle button that reports its state with aria-pressed. For filters with a value to edit, use FilterChip; for removable labels, use Tag.',
  imports: ['Chip'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic' },
    {
      name: 'QuickFilters',
      title: 'Quick filters',
      description: 'A controlled set of chips filtering a list.',
    },
    { name: 'Sizes', title: 'Sizes, icons and disabled' },
  ],
  props: [
    {
      component: 'Chip',
      name: 'selected',
      type: 'boolean',
      description: 'Controlled selected state.',
    },
    {
      component: 'Chip',
      name: 'defaultSelected',
      type: 'boolean',
      default: 'false',
      description: 'Initial state when uncontrolled.',
    },
    {
      component: 'Chip',
      name: 'onSelectedChange',
      type: '(selected: boolean) => void',
      description: 'Called when toggled.',
    },
    {
      component: 'Chip',
      name: 'icon',
      type: 'ReactNode',
      description: 'Leading icon; replaced by a check mark while selected.',
    },
    {
      component: 'Chip',
      name: 'size',
      type: "'sm' | 'md'",
      default: "'md'",
      description: 'Height 26 or 32px.',
    },
    {
      component: 'Chip',
      name: '...props',
      type: 'ButtonHTMLAttributes',
      description: 'Native button attributes.',
    },
  ],
  accessibility: [
    'Renders a native button with aria-pressed, announced as a toggle button.',
    'Selection is shown by fill, a check mark and aria-pressed, not by colour alone.',
    'Group related chips with role="group" and an aria-label.',
  ],
  keyboard: [{ keys: ['Enter', 'Space'], description: 'Toggles the chip.' }],
  guidelines: {
    do: ['Use short, parallel labels.', 'Label the group, e.g. "Status filters".'],
    dont: ['Use chips for mutually exclusive choices; use RadioGroup or ToggleButton.'],
  },
  playground: {
    render: (p) => (
      <Chip size={p.size as 'md'} disabled={p.disabled as boolean} defaultSelected>
        {p.children as string}
      </Chip>
    ),
    controls: {
      size: { type: 'select', options: ['sm', 'md'], default: 'md' },
      disabled: { type: 'boolean', default: false },
      children: { type: 'text', default: 'Signed' },
    },
  },
  related: ['filter-chip', 'tag', 'toggle-button'],
};

export function Basic() {
  return (
    <div role="group" aria-label="Contract status" style={{ display: 'flex', gap: 8 }}>
      <Chip defaultSelected>Signed</Chip>
      <Chip>Awaiting signature</Chip>
      <Chip>Expired</Chip>
    </div>
  );
}

export function QuickFilters() {
  const all = ['Sales', 'Legal', 'Support', 'Engineering'];
  const [active, setActive] = React.useState<string[]>(['Sales']);
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div
        role="group"
        aria-label="Departments"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
      >
        {all.map((d) => (
          <Chip
            key={d}
            selected={active.includes(d)}
            onSelectedChange={(on) => setActive((a) => (on ? [...a, d] : a.filter((x) => x !== d)))}
          >
            {d}
          </Chip>
        ))}
      </div>
      <p style={{ margin: 0, fontSize: 14 }}>
        Showing: {active.length ? active.join(', ') : 'all departments'}
      </p>
    </div>
  );
}

export function Sizes() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
      <Chip size="sm" icon={<Icon name="clock" size={12} />}>
        Recent
      </Chip>
      <Chip icon={<Icon name="star" size={14} />}>Favourites</Chip>
      <Chip disabled>Archived</Chip>
    </div>
  );
}

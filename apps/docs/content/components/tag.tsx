import * as React from 'react';
import { Icon, Tag } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'tag',
  name: 'Tag',
  category: 'data-display',
  summary:
    'A compact keyword label for categories and filters, with an optional accessible remove button.',
  description:
    'Use Tag to show assigned groups, departments or labels, and let people remove them. Every remove button has its own label, such as "Remove Marketing", so screen-reader users know which tag it affects.',
  imports: ['Tag'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic' },
    { name: 'Removable', title: 'Removable' },
    { name: 'WithIcons', title: 'With icons and sizes' },
  ],
  props: [
    {
      component: 'Tag',
      name: 'size',
      type: "'sm' | 'md'",
      default: "'md'",
      description: 'Height 22 or 28px.',
    },
    { component: 'Tag', name: 'icon', type: 'ReactNode', description: 'Leading icon.' },
    {
      component: 'Tag',
      name: 'onRemove',
      type: '() => void',
      description: 'Shows a remove button when provided.',
    },
    {
      component: 'Tag',
      name: 'removeLabel',
      type: 'string',
      description: 'Remove button label; defaults to "Remove <text>".',
    },
    {
      component: 'Tag',
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Disables removal.',
    },
  ],
  accessibility: [
    'The remove control is a real button named after the tag, e.g. "Remove Marketing".',
    'When children are not plain text, pass removeLabel.',
    'After removing a tag, move focus to a sensible place, such as the next tag or the input that adds tags.',
  ],
  keyboard: [
    { keys: ['Enter', 'Space'], description: 'Removes the tag when its remove button is focused.' },
  ],
  guidelines: {
    do: ['Keep tag text short.'],
    dont: ['Use Tag for status; use Badge.'],
  },
  related: ['badge', 'chip', 'multi-select'],
};

export function Basic() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <Tag>Sales</Tag>
      <Tag>London office</Tag>
      <Tag>Q4 campaign</Tag>
    </div>
  );
}

export function Removable() {
  const [tags, setTags] = React.useState(['Marketing', 'Legal', 'EMEA', 'Contractors']);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {tags.map((t) => (
        <Tag key={t} onRemove={() => setTags((all) => all.filter((x) => x !== t))}>
          {t}
        </Tag>
      ))}
      {tags.length === 0 && <span>All departments removed.</span>}
    </div>
  );
}

export function WithIcons() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
      <Tag size="sm" icon={<Icon name="users" size={12} />}>
        Group
      </Tag>
      <Tag icon={<Icon name="building" />}>Northwind Ltd</Tag>
      <Tag icon={<Icon name="globe" />} onRemove={() => {}} disabled>
        Global
      </Tag>
    </div>
  );
}

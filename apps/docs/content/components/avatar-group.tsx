import { Avatar, AvatarGroup } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

const people = [
  'Amara Okafor',
  'Lukas Novak',
  'Priya Raman',
  'Tomás Ferreira',
  'Hana Sato',
  'Oliver Grant',
];

export const doc: ComponentDoc = {
  slug: 'avatar-group',
  name: 'AvatarGroup',
  category: 'data-display',
  summary: 'A stack of overlapping avatars with a "+N" overflow, announced as a list.',
  description:
    'Use AvatarGroup to show who is involved, such as template editors, contract signers or team members, in limited space. Set max to collapse extra people into a counter, and total when the full list is not loaded.',
  imports: ['AvatarGroup', 'Avatar'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic' },
    { name: 'Overflow', title: 'Overflow' },
    { name: 'Sizes', title: 'Sizes' },
  ],
  props: [
    {
      component: 'AvatarGroup',
      name: 'children',
      type: 'ReactNode',
      required: true,
      description: 'Avatar elements.',
    },
    {
      component: 'AvatarGroup',
      name: 'max',
      type: 'number',
      description: 'Maximum avatars before the "+N" counter.',
    },
    {
      component: 'AvatarGroup',
      name: 'total',
      type: 'number',
      description: 'Total count when it exceeds the children provided.',
    },
    {
      component: 'AvatarGroup',
      name: 'size',
      type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
      default: "'md'",
      description: 'Overflow counter and overlap size; match your avatars.',
    },
    {
      component: 'AvatarGroup',
      name: 'overflowLabel',
      type: '(hidden: number) => string',
      default: '"N more"',
      description: 'Accessible text for the counter.',
    },
  ],
  accessibility: [
    'Rendered as a <ul>, so screen readers announce the number of people. Name it with aria-label.',
    'The overflow counter is announced as "3 more" (customisable) rather than "+3".',
    'Each avatar keeps its own accessible name.',
  ],
  guidelines: {
    do: ['Pair the group with a link to the full list when people need details.'],
    dont: ['Show more than about five avatars before collapsing.'],
  },
  playground: {
    render: (p) => (
      <AvatarGroup aria-label="Editors" max={p.max as number} size={p.size as 'md'}>
        {people.map((n) => (
          <Avatar key={n} name={n} size={p.size as 'md'} />
        ))}
      </AvatarGroup>
    ),
    controls: {
      max: { type: 'number', default: 4, min: 1, max: 6 },
      size: { type: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'], default: 'md' },
    },
  },
  related: ['avatar'],
};

export function Basic() {
  return (
    <AvatarGroup aria-label="Template editors">
      {people.slice(0, 4).map((n) => (
        <Avatar key={n} name={n} />
      ))}
    </AvatarGroup>
  );
}

export function Overflow() {
  return (
    <AvatarGroup
      aria-label="Sales team"
      max={3}
      total={48}
      overflowLabel={(n) => `${n} more team members`}
    >
      {people.map((n) => (
        <Avatar key={n} name={n} />
      ))}
    </AvatarGroup>
  );
}

export function Sizes() {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {(['sm', 'md', 'lg'] as const).map((s) => (
        <AvatarGroup key={s} aria-label={`Signers ${s}`} size={s} max={4}>
          {people.map((n) => (
            <Avatar key={n} name={n} size={s} />
          ))}
        </AvatarGroup>
      ))}
    </div>
  );
}

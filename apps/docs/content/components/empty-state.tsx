import { Button, EmptyState, Icon } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'empty-state',
  name: 'EmptyState',
  category: 'feedback',
  summary: 'Explains why an area is empty and offers the next step.',
  description:
    'Use EmptyState for first-run screens, empty search results and cleared filters. Say what would normally be here, why it is empty, and give one clear action. Keep the tone helpful and brief.',
  imports: ['EmptyState'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'First run', layout: 'fill' },
    { name: 'NoResults', title: 'No results', layout: 'fill' },
    { name: 'Sizes', title: 'Compact and bordered', layout: 'fill' },
  ],
  props: [
    {
      component: 'EmptyState',
      name: 'title',
      type: 'ReactNode',
      required: true,
      description: 'Short headline.',
    },
    {
      component: 'EmptyState',
      name: 'description',
      type: 'ReactNode',
      description: 'One or two sentences of explanation.',
    },
    {
      component: 'EmptyState',
      name: 'icon',
      type: 'ReactNode',
      description: 'Decorative icon or illustration.',
    },
    { component: 'EmptyState', name: 'action', type: 'ReactNode', description: 'Primary action.' },
    {
      component: 'EmptyState',
      name: 'secondaryAction',
      type: 'ReactNode',
      description: 'Secondary action.',
    },
    {
      component: 'EmptyState',
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
      default: "'md'",
      description: 'Spacing and type scale.',
    },
    {
      component: 'EmptyState',
      name: 'headingLevel',
      type: '2 | 3 | 4 | 5 | 6',
      default: '3',
      description: 'Heading level of the title.',
    },
    {
      component: 'EmptyState',
      name: 'bordered',
      type: 'boolean',
      default: 'false',
      description: 'Dashed border around the area.',
    },
  ],
  accessibility: [
    'The title is a real heading; set headingLevel to fit the surrounding outline.',
    'The icon is decorative and hidden from assistive technology.',
    'When results empty out after filtering, pair this with a live results count (see FilterBar) so the change is announced.',
  ],
  guidelines: {
    do: ['Offer the action that fills the space.', 'For no results, suggest clearing filters.'],
    dont: ['Blame the user or use jokes in error-adjacent states.'],
  },
  related: ['filter-bar', 'skeleton', 'alert'],
};

export function Basic() {
  return (
    <EmptyState
      icon={<Icon name="pen-nib" />}
      title="No signature templates yet"
      description="Create a template to give everyone in your organisation a consistent, on-brand signature."
      action={<Button leadingIcon={<Icon name="plus" />}>Create template</Button>}
      secondaryAction={<Button variant="ghost">Browse gallery</Button>}
    />
  );
}

export function NoResults() {
  return (
    <EmptyState
      icon={<Icon name="search" />}
      title="No contracts match these filters"
      description="Try removing a filter or searching for a different counterparty."
      action={<Button variant="outline">Clear filters</Button>}
    />
  );
}

export function Sizes() {
  return (
    <div
      style={{
        display: 'grid',
        gap: 16,
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      }}
    >
      <EmptyState
        size="sm"
        bordered
        icon={<Icon name="inbox" />}
        title="No notifications"
        description="You’re all caught up."
      />
      <EmptyState
        size="sm"
        bordered
        icon={<Icon name="upload" />}
        title="No users imported"
        description="Upload a CSV to add people in bulk."
        action={<Button size="sm">Upload CSV</Button>}
      />
    </div>
  );
}

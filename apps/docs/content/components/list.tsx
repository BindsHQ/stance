import { Avatar, Badge, Button, Icon, List, ListItem } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'list',
  name: 'List',
  category: 'data-display',
  summary:
    'A semantic list of related items with dividers, density and an optional bordered surface.',
  description:
    'Use List for collections people scan top to bottom, such as members, templates or recent activity. Each row is a ListItem. Use Table instead when people need to compare values across columns.',
  imports: ['List', 'ListItem'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', layout: 'fill' },
    { name: 'Bordered', title: 'Bordered with actions', layout: 'fill' },
    { name: 'Ordered', title: 'Ordered steps', layout: 'fill' },
    { name: 'Density', title: 'Density', layout: 'fill' },
  ],
  props: [
    {
      component: 'List',
      name: 'ordered',
      type: 'boolean',
      default: 'false',
      description: 'Render <ol> instead of <ul>.',
    },
    {
      component: 'List',
      name: 'dividers',
      type: 'boolean',
      default: 'true',
      description: 'Lines between items.',
    },
    {
      component: 'List',
      name: 'density',
      type: "'sm' | 'md' | 'lg'",
      default: "'md'",
      description: 'Vertical padding of items.',
    },
    {
      component: 'List',
      name: 'bordered',
      type: 'boolean',
      default: 'false',
      description: 'Wrap the list in a bordered surface.',
    },
    {
      component: 'List',
      name: '...props',
      type: 'HTMLAttributes<HTMLUListElement>',
      description: 'Native list attributes; use aria-label to name the list.',
    },
  ],
  accessibility: [
    'Renders native <ul> or <ol>, so screen readers announce the number of items.',
    'Name lists that stand alone with aria-label or aria-labelledby.',
    'Keep interactive items to one primary target per row (see ListItem asChild) so tab order stays predictable.',
  ],
  guidelines: {
    do: [
      'Keep titles short and put secondary detail in the description.',
      'Use ordered lists when sequence matters.',
    ],
    dont: [
      'Nest interactive elements inside an interactive row.',
      'Use List for tabular comparisons.',
    ],
  },
  playground: {
    render: (p) => (
      <List
        density={p.density as 'md'}
        dividers={p.dividers as boolean}
        bordered={p.bordered as boolean}
        aria-label="Members"
      >
        <ListItem
          leading={<Avatar name="Amara Okafor" size="sm" decorative />}
          title="Amara Okafor"
          description="amara@binds.si"
        />
        <ListItem
          leading={<Avatar name="Lukas Novak" size="sm" decorative />}
          title="Lukas Novak"
          description="lukas@binds.si"
        />
      </List>
    ),
    controls: {
      density: { type: 'select', options: ['sm', 'md', 'lg'], default: 'md' },
      dividers: { type: 'boolean', default: true },
      bordered: { type: 'boolean', default: false },
    },
  },
  related: ['list-item', 'searchable-list', 'virtualized-list', 'table'],
};

export function Basic() {
  return (
    <List aria-label="Organisation members">
      {[
        ['Amara Okafor', 'Sales · amara@binds.si', 'Owner'],
        ['Lukas Novak', 'Engineering · lukas@binds.si', 'Admin'],
        ['Priya Raman', 'Legal · priya@binds.si', 'Member'],
      ].map(([name, description, role]) => (
        <ListItem
          key={name}
          leading={<Avatar name={name!} size="sm" decorative />}
          title={name}
          description={description}
          meta={<Badge size="sm">{role}</Badge>}
        />
      ))}
    </List>
  );
}

export function Bordered() {
  return (
    <List bordered aria-label="Signature templates">
      {['Sales 2026', 'Executive', 'Support'].map((t) => (
        <ListItem
          key={t}
          leading={<Icon name="pen-nib" />}
          title={t}
          description="Updated 2 days ago"
          actions={
            <Button size="sm" variant="ghost">
              Edit
            </Button>
          }
        />
      ))}
    </List>
  );
}

export function Ordered() {
  return (
    <List ordered dividers={false} density="sm" aria-label="Deployment steps">
      <ListItem
        leading={
          <Badge variant="solid" tone="inverse" size="sm">
            1
          </Badge>
        }
        title="Connect your Exchange relay"
      />
      <ListItem
        leading={
          <Badge variant="solid" tone="inverse" size="sm">
            2
          </Badge>
        }
        title="Assign templates to departments"
      />
      <ListItem
        leading={
          <Badge variant="solid" tone="inverse" size="sm">
            3
          </Badge>
        }
        title="Deploy and verify signatures"
      />
    </List>
  );
}

export function Density() {
  return (
    <div
      style={{
        display: 'grid',
        gap: 24,
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      }}
    >
      {(['sm', 'lg'] as const).map((d) => (
        <List key={d} density={d} bordered aria-label={`Density ${d}`}>
          <ListItem title="Billing contact" description="finance@binds.si" />
          <ListItem title="Security contact" description="security@binds.si" />
        </List>
      ))}
    </div>
  );
}

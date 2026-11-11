import { Avatar, Badge, Button, Icon, List, ListItem } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'list-item',
  name: 'ListItem',
  category: 'data-display',
  summary: 'A list row with leading media, title, description, metadata and actions.',
  description:
    'ListItem lays out one row of a List. Pass structured props for the common layout, or children for custom content. With asChild, the main area becomes your link or button while actions stay separate, so each row has one clear primary target.',
  imports: ['List', 'ListItem'],
  status: 'stable',
  examples: [
    { name: 'Structured', title: 'Structured content', layout: 'fill' },
    {
      name: 'Interactive',
      title: 'Interactive rows',
      description: 'asChild makes the main area a real link or button. Actions sit outside it.',
      layout: 'fill',
    },
    { name: 'States', title: 'Selected and disabled', layout: 'fill' },
  ],
  props: [
    {
      component: 'ListItem',
      name: 'leading',
      type: 'ReactNode',
      description: 'Avatar, icon or thumbnail.',
    },
    { component: 'ListItem', name: 'title', type: 'ReactNode', description: 'Primary text.' },
    {
      component: 'ListItem',
      name: 'description',
      type: 'ReactNode',
      description: 'Secondary text.',
    },
    {
      component: 'ListItem',
      name: 'meta',
      type: 'ReactNode',
      description: 'Trailing metadata such as a date or badge.',
    },
    {
      component: 'ListItem',
      name: 'actions',
      type: 'ReactNode',
      description: 'Trailing actions, outside the interactive area.',
    },
    {
      component: 'ListItem',
      name: 'asChild',
      type: 'boolean',
      default: 'false',
      description: 'Render the main area as your single link or button child.',
    },
    {
      component: 'ListItem',
      name: 'selected',
      type: 'boolean',
      default: 'false',
      description: 'Highlight and set aria-current.',
    },
    {
      component: 'ListItem',
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Dim the row and disable pointer interaction.',
    },
  ],
  accessibility: [
    'Renders an <li>, so it must be inside a List (or another <ul>/<ol>).',
    'With asChild, the whole main area is one link or button whose accessible name combines the title and description.',
    'Actions render after the main area, so tab order is: row, then its actions.',
    'selected sets aria-current="true" for navigation-style lists.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Moves to the row’s link or button, then to its actions.' },
    { keys: ['Enter'], description: 'Follows the row link or activates the row button.' },
  ],
  guidelines: {
    do: ['Give interactive rows a single primary destination.'],
    dont: ['Put buttons inside an asChild link; use actions instead.'],
  },
  related: ['list', 'avatar', 'badge'],
};

export function Structured() {
  return (
    <List bordered aria-label="Recent deployments">
      <ListItem
        leading={<Icon name="check-circle" size="md" />}
        title="Sales 2026 deployed"
        description="48 mailboxes updated through the Exchange relay"
        meta="09:20"
      />
      <ListItem
        leading={<Icon name="alert-triangle" size="md" />}
        title="2 mailboxes failed"
        description="Mailbox not found for tomas@binds.si"
        meta={
          <Badge tone="danger" size="sm">
            Failed
          </Badge>
        }
      />
    </List>
  );
}

export function Interactive() {
  return (
    <List bordered aria-label="Templates">
      {['Sales 2026', 'Executive'].map((t) => (
        <ListItem
          key={t}
          asChild
          leading={<Icon name="file-text" />}
          title={t}
          description="Assigned to 12 people"
          actions={
            <Button size="sm" variant="ghost">
              Duplicate
            </Button>
          }
        >
          <a href={`#${t}`} />
        </ListItem>
      ))}
    </List>
  );
}

export function States() {
  return (
    <List aria-label="Workspaces" dividers={false}>
      <ListItem
        asChild
        selected
        leading={<Avatar name="Binds" shape="square" size="sm" decorative />}
        title="Binds"
      >
        <button type="button" />
      </ListItem>
      <ListItem
        asChild
        leading={<Avatar name="eSignify" shape="square" size="sm" decorative />}
        title="eSignify"
      >
        <button type="button" />
      </ListItem>
      <ListItem
        disabled
        leading={<Avatar name="Archive" shape="square" size="sm" decorative />}
        title="Archive"
        description="Read only"
      />
    </List>
  );
}

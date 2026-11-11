import {
  Button,
  Icon,
  Notification,
  NotificationCenter,
  NotificationList,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@bindshq/stance-react';
import * as React from 'react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'notification',
  name: 'Notification',
  category: 'feedback',
  summary:
    'Notification items and a ready-made notification center with unread state and mark-as-read.',
  description:
    'Notification renders one event: who did what and when, with an optional avatar or icon, actions and unread state. NotificationList groups them, and NotificationCenter adds a header with an unread count, “Mark all as read”, an empty state and a footer. Place the center in a Popover behind a bell button or in a Drawer on phones.',
  imports: ['Notification', 'NotificationList', 'NotificationCenter'],
  status: 'stable',
  examples: [
    { name: 'BellPopover', title: 'In a bell popover', minHeight: 420 },
    { name: 'List', title: 'List', layout: 'fill' },
    { name: 'Empty', title: 'Empty state' },
  ],
  props: [
    {
      component: 'Notification',
      name: 'title',
      type: 'ReactNode',
      required: true,
      description: 'What happened.',
    },
    {
      component: 'Notification',
      name: 'description',
      type: 'ReactNode',
      description: 'Supporting detail.',
    },
    {
      component: 'Notification',
      name: 'time',
      type: 'Date | string',
      description: 'Dates render as relative time in a <time> element.',
    },
    {
      component: 'Notification',
      name: 'media',
      type: 'ReactNode',
      description: 'Avatar, icon or logo.',
    },
    {
      component: 'Notification',
      name: 'unread',
      type: 'boolean',
      default: 'false',
      description: 'Shows a dot and announces “Unread”.',
    },
    {
      component: 'Notification',
      name: 'href',
      type: 'string',
      description: 'Makes the whole item a link to the related page.',
    },
    {
      component: 'Notification',
      name: 'onMarkRead',
      type: '() => void',
      description: 'Shows a mark-as-read button while unread.',
    },
    {
      component: 'Notification',
      name: 'actions',
      type: 'ReactNode',
      description: 'Inline actions such as Approve / Decline.',
    },
    {
      component: 'Notification',
      name: 'markReadLabel',
      type: 'string',
      default: "'Mark as read'",
      description: 'Button label.',
    },
    {
      component: 'NotificationList',
      name: 'label',
      type: 'string',
      default: "'Notifications'",
      description: 'List name (ignored when aria-labelledby is set).',
    },
    {
      component: 'NotificationCenter',
      name: 'title',
      type: 'ReactNode',
      default: "'Notifications'",
      description: 'Heading.',
    },
    {
      component: 'NotificationCenter',
      name: 'unreadCount',
      type: 'number',
      default: '0',
      description: 'Shown beside the heading.',
    },
    {
      component: 'NotificationCenter',
      name: 'onMarkAllRead',
      type: '() => void',
      description: 'Shows “Mark all as read” when there are unread items.',
    },
    {
      component: 'NotificationCenter',
      name: 'emptyState',
      type: 'ReactNode',
      default: "'You’re all caught up.'",
      description: 'Shown with no children.',
    },
    {
      component: 'NotificationCenter',
      name: 'footer',
      type: 'ReactNode',
      description: 'E.g. a “View all” link.',
    },
  ],
  accessibility: [
    'Items are list items; unread ones start with visually hidden “Unread:” text so the state is not conveyed by colour or weight alone.',
    'NotificationCenter is a labelled region whose heading announces the unread count.',
    'With href the whole row is clickable while inner buttons stay independently focusable.',
    'Announce new arrivals separately (e.g. update the bell button’s label); the list is not a live region.',
  ],
  guidelines: {
    do: [
      'Lead with the actor and action: “Ada approved Sales, EMEA”.',
      'Link each notification to where the user can act.',
    ],
    dont: ['Use notifications for confirmations of the user’s own actions; use Toast.'],
  },
  related: ['popover', 'toast', 'badge'],
};

import type { IconName } from '@bindshq/stance-react';

interface Item {
  id: number;
  title: string;
  description?: string;
  minutes: number;
  unread: boolean;
  icon: IconName;
}

const initial: Item[] = [
  {
    id: 1,
    title: 'Ada Lovelace approved “Sales, EMEA”',
    description: 'It will deploy on the next sync.',
    minutes: 4,
    unread: true,
    icon: 'check-circle',
  },
  {
    id: 2,
    title: '12 new users synced from Azure AD',
    description: 'They received the default signature.',
    minutes: 95,
    unread: true,
    icon: 'users',
  },
  {
    id: 3,
    title: 'Exchange relay certificate renewed',
    minutes: 60 * 26,
    unread: false,
    icon: 'shield',
  },
];

function useItems() {
  const [items, setItems] = React.useState(initial.map((n) => ({ ...n })));
  const markRead = (id: number) =>
    setItems((all) => all.map((n) => (n.id === id ? { ...n, unread: false } : n)));
  const markAll = () => setItems((all) => all.map((n) => ({ ...n, unread: false })));
  return { items, markRead, markAll, unread: items.filter((n) => n.unread).length };
}

export function BellPopover() {
  const { items, markRead, markAll, unread } = useItems();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-label={`Notifications, ${unread} unread`}
          leadingIcon={<Icon name="bell" />}
        >
          {unread}
        </Button>
      </PopoverTrigger>
      <PopoverContent aria-label="Notifications" align="end" style={{ padding: 0, width: 380 }}>
        <NotificationCenter
          unreadCount={unread}
          onMarkAllRead={markAll}
          footer={<a href="#all">View all notifications</a>}
        >
          {items.map((n) => (
            <Notification
              key={n.id}
              title={n.title}
              description={n.description}
              time={new Date(Date.now() - n.minutes * 60_000)}
              unread={n.unread}
              onMarkRead={() => markRead(n.id)}
              media={<Icon name={n.icon} size={20} />}
            />
          ))}
        </NotificationCenter>
      </PopoverContent>
    </Popover>
  );
}

export function List() {
  return (
    <NotificationList label="Recent activity" style={{ maxWidth: 480 }}>
      <Notification
        unread
        title="Grace Hopper requested access to “Brand 2026”"
        time="2 minutes ago"
        media={<Icon name="user" size={20} />}
        actions={
          <>
            <Button size="xs">Approve</Button>
            <Button size="xs" variant="outline">
              Decline
            </Button>
          </>
        }
      />
      <Notification
        title="Weekly deployment report is ready"
        href="#report"
        time="Yesterday"
        media={<Icon name="file-text" size={20} />}
      />
    </NotificationList>
  );
}

export function Empty() {
  return (
    <div
      style={{ width: 360, border: '1px solid var(--st-color-border-default)', borderRadius: 12 }}
    >
      <NotificationCenter />
    </div>
  );
}

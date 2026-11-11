import { Icon, TabBar, TabBarItem } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'tab-bar',
  name: 'TabBar',
  category: 'navigation',
  summary: 'A mobile navigation bar for three to five top-level destinations.',
  description:
    'Use TabBar for app-level navigation on small screens, usually pinned to the bottom with position="bottom" and hidden on larger screens with hideFrom. Each item is a link that changes the page, so TabBar uses navigation semantics and aria-current rather than the tabs pattern.',
  imports: ['TabBar', 'TabBarItem'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', layout: 'fill' },
    {
      name: 'WithBadge',
      title: 'With a badge',
      description: 'Describe what the badge means with badgeLabel so it is announced.',
      layout: 'fill',
    },
    {
      name: 'IconsOnly',
      title: 'Icons only',
      description: 'Labels remain available to screen readers.',
      layout: 'fill',
    },
    { name: 'TopPosition', title: 'Top position', layout: 'fill' },
  ],
  props: [
    {
      component: 'TabBar',
      name: 'label',
      type: 'string',
      default: "'Primary'",
      description: 'Accessible name of the navigation landmark.',
    },
    {
      component: 'TabBar',
      name: 'position',
      type: "'static' | 'top' | 'bottom'",
      default: "'static'",
      description:
        'bottom fixes the bar to the viewport (respecting the safe area); top makes it sticky.',
    },
    {
      component: 'TabBar',
      name: 'hideFrom',
      type: "'md' | 'lg' | 'never'",
      default: "'never'",
      description: 'Hide at and above this breakpoint.',
    },
    {
      component: 'TabBar',
      name: 'labels',
      type: "'visible' | 'hidden'",
      default: "'visible'",
      description: 'Visually hide labels while keeping them accessible.',
    },
    {
      component: 'TabBarItem',
      name: 'icon',
      type: 'ReactNode',
      required: true,
      description: 'Icon above the label.',
    },
    {
      component: 'TabBarItem',
      name: 'active',
      type: 'boolean',
      default: 'false',
      description: 'Marks the current destination with aria-current="page".',
    },
    {
      component: 'TabBarItem',
      name: 'badge',
      type: 'ReactNode',
      description: 'Count or dot on the icon.',
    },
    {
      component: 'TabBarItem',
      name: 'badgeLabel',
      type: 'string',
      description: 'Announced description of the badge, e.g. “3 unread”.',
    },
    {
      component: 'TabBarItem',
      name: 'asChild',
      type: 'boolean',
      default: 'false',
      description: 'Render your router link; its children become the label.',
    },
    {
      component: 'TabBarItem',
      name: 'href',
      type: 'string',
      description: 'Destination when not using asChild.',
    },
  ],
  accessibility: [
    'A <nav> landmark containing a list of links; the current destination has aria-current="page".',
    'Touch targets are at least 56px tall, above the WCAG 2.2 minimum target size.',
    'When labels are hidden visually they still name each link for screen readers.',
    'Badges are decorative on the icon; badgeLabel provides the spoken equivalent.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Moves between destinations.' },
    { keys: ['Enter'], description: 'Follows the link.' },
  ],
  guidelines: {
    do: ['Limit to three to five destinations.', 'Pair with a Sidebar on larger screens.'],
    dont: [
      'Use for actions such as “New”; use a FloatingActionButton.',
      'Switch content within a page; use Tabs.',
    ],
  },
  related: ['sidebar', 'tabs'],
};

export function Basic() {
  return (
    <TabBar label="Main" style={{ maxWidth: 420 }}>
      <TabBarItem href="#home" icon={<Icon name="home" />} active>
        Home
      </TabBarItem>
      <TabBarItem href="#templates" icon={<Icon name="file-text" />}>
        Templates
      </TabBarItem>
      <TabBarItem href="#users" icon={<Icon name="users" />}>
        Users
      </TabBarItem>
      <TabBarItem href="#settings" icon={<Icon name="settings" />}>
        Settings
      </TabBarItem>
    </TabBar>
  );
}

export function WithBadge() {
  return (
    <TabBar label="Main" style={{ maxWidth: 420 }}>
      <TabBarItem href="#home" icon={<Icon name="home" />}>
        Home
      </TabBarItem>
      <TabBarItem href="#inbox" icon={<Icon name="bell" />} badge={3} badgeLabel="3 unread" active>
        Activity
      </TabBarItem>
      <TabBarItem href="#account" icon={<Icon name="user" />}>
        Account
      </TabBarItem>
    </TabBar>
  );
}

export function IconsOnly() {
  return (
    <TabBar label="Main" labels="hidden" style={{ maxWidth: 320 }}>
      <TabBarItem href="#home" icon={<Icon name="home" />} active>
        Home
      </TabBarItem>
      <TabBarItem href="#search" icon={<Icon name="search" />}>
        Search
      </TabBarItem>
      <TabBarItem href="#account" icon={<Icon name="user" />}>
        Account
      </TabBarItem>
    </TabBar>
  );
}

export function TopPosition() {
  return (
    <TabBar label="Sections" position="top" style={{ maxWidth: 420 }}>
      <TabBarItem href="#overview" icon={<Icon name="layout-grid" />} active>
        Overview
      </TabBarItem>
      <TabBarItem href="#reports" icon={<Icon name="bar-chart" />}>
        Reports
      </TabBarItem>
      <TabBarItem href="#activity" icon={<Icon name="activity" />}>
        Activity
      </TabBarItem>
    </TabBar>
  );
}

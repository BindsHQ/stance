import {
  Icon,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
  SidebarToggle,
} from '@bindshq/stance-react';
import { useState } from 'react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'sidebar',
  name: 'Sidebar',
  category: 'navigation',
  summary:
    'Composable primitives for application sidebar navigation, with an icon-only collapsed mode.',
  description:
    'Sidebar provides the parts of a navigation sidebar (header, groups, items, footer and a collapse toggle) without positioning itself. Place it in your existing layout, fixed, sticky or in a grid, so product shells such as eSignify’s 18rem ↔ 5rem collapsing sidebar keep their structure. Use activeStyle="inverted" for a filled active item.',
  imports: [
    'Sidebar',
    'SidebarHeader',
    'SidebarContent',
    'SidebarGroup',
    'SidebarItem',
    'SidebarFooter',
    'SidebarToggle',
    'useSidebar',
  ],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', layout: 'start', minHeight: 460 },
    {
      name: 'Collapsible',
      title: 'Collapsible (eSignify style)',
      description:
        'Inverted active item; the toggle switches between 18rem and 5rem, showing icons with titles.',
      layout: 'start',
      minHeight: 460,
    },
    { name: 'Groups', title: 'Collapsible groups and badges', layout: 'start', minHeight: 420 },
  ],
  props: [
    {
      component: 'Sidebar',
      name: 'collapsed',
      type: 'boolean',
      description: 'Controlled icon-only state.',
    },
    {
      component: 'Sidebar',
      name: 'defaultCollapsed',
      type: 'boolean',
      default: 'false',
      description: 'Initial collapsed state.',
    },
    {
      component: 'Sidebar',
      name: 'onCollapsedChange',
      type: '(collapsed: boolean) => void',
      description: 'Called when the toggle is used.',
    },
    {
      component: 'Sidebar',
      name: 'as',
      type: "'nav' | 'aside' | 'div'",
      default: "'nav'",
      description: 'Root element; nav creates a navigation landmark.',
    },
    {
      component: 'Sidebar',
      name: 'aria-label',
      type: 'string',
      default: "'Main'",
      description: 'Landmark name.',
    },
    {
      component: 'Sidebar',
      name: 'activeStyle',
      type: "'subtle' | 'inverted'",
      default: "'subtle'",
      description: 'Tinted or filled active item.',
    },
    {
      component: 'Sidebar',
      name: 'width',
      type: 'string',
      default: "'18rem'",
      description: 'Expanded width (sets --st-sidebar-width).',
    },
    {
      component: 'Sidebar',
      name: 'collapsedWidth',
      type: 'string',
      default: "'5rem'",
      description: 'Collapsed width.',
    },
    {
      component: 'SidebarGroup',
      name: 'label',
      type: 'ReactNode',
      description: 'Group heading; names the list.',
    },
    {
      component: 'SidebarGroup',
      name: 'collapsible',
      type: 'boolean',
      default: 'false',
      description: 'Heading becomes a disclosure button.',
    },
    {
      component: 'SidebarGroup',
      name: 'open / defaultOpen / onOpenChange',
      type: 'boolean / boolean / (open) => void',
      default: 'true',
      description: 'Group open state.',
    },
    {
      component: 'SidebarItem',
      name: 'icon',
      type: 'ReactNode',
      description: 'Shown in both states; required for a useful collapsed sidebar.',
    },
    {
      component: 'SidebarItem',
      name: 'active',
      type: 'boolean',
      default: 'false',
      description: 'Current page: aria-current="page" on links.',
    },
    {
      component: 'SidebarItem',
      name: 'badge',
      type: 'ReactNode',
      description: 'Trailing count; becomes a dot when collapsed.',
    },
    {
      component: 'SidebarItem',
      name: 'href',
      type: 'string',
      description: 'Renders a link. Without href it renders a button.',
    },
    {
      component: 'SidebarItem',
      name: 'asChild',
      type: 'boolean',
      default: 'false',
      description: 'Render your router link.',
    },
    {
      component: 'SidebarItem',
      name: 'disabled',
      type: 'boolean',
      description: 'Disables a button item.',
    },
    {
      component: 'SidebarToggle',
      name: 'expandLabel / collapseLabel',
      type: 'string',
      default: "'Expand sidebar' / 'Collapse sidebar'",
      description: 'Accessible labels for each state.',
    },
  ],
  accessibility: [
    'The root is a named navigation landmark; each group is a list named by its heading.',
    'Collapsed mode hides labels visually only, so every item keeps its accessible name; a title shows the label on hover.',
    'The toggle reports aria-expanded and controls the sidebar; collapsible groups are disclosure buttons with aria-expanded.',
    'The active item is not conveyed by colour alone: it has aria-current and, in high contrast, an outline.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Moves through items, group headings and the toggle.' },
    { keys: ['Enter', 'Space'], description: 'Follows an item or toggles a group / the sidebar.' },
  ],
  guidelines: {
    do: [
      'Give every item an icon if the sidebar can collapse.',
      'Persist the collapsed state per user.',
    ],
    dont: [
      'Put more than about ten items in one group.',
      'Hide primary destinations inside collapsed groups by default.',
    ],
  },
  related: ['tab-bar', 'breadcrumbs', 'navigation-menu'],
};

export function Basic() {
  return (
    <div style={{ height: 440, display: 'flex' }}>
      <Sidebar aria-label="Dashboard">
        <SidebarHeader>
          <strong>Binds</strong>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup label="Workspace">
            <SidebarItem href="#dashboard" icon={<Icon name="home" />} active>
              Dashboard
            </SidebarItem>
            <SidebarItem href="#templates" icon={<Icon name="file-text" />}>
              My Templates
            </SidebarItem>
            <SidebarItem href="#users" icon={<Icon name="users" />}>
              Org Users
            </SidebarItem>
            <SidebarItem href="#integrations" icon={<Icon name="link" />}>
              Integrations
            </SidebarItem>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarGroup>
            <SidebarItem href="#settings" icon={<Icon name="settings" />}>
              Settings
            </SidebarItem>
          </SidebarGroup>
        </SidebarFooter>
      </Sidebar>
    </div>
  );
}

export function Collapsible() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div style={{ height: 440, display: 'flex' }}>
      <Sidebar
        aria-label="Dashboard"
        activeStyle="inverted"
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
      >
        <SidebarHeader style={{ justifyContent: collapsed ? 'center' : 'space-between' }}>
          {!collapsed && <strong>eSignify</strong>}
          <SidebarToggle />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarItem href="#dashboard" icon={<Icon name="home" />} active>
              Dashboard
            </SidebarItem>
            <SidebarItem href="#templates" icon={<Icon name="file-text" />}>
              My Templates
            </SidebarItem>
            <SidebarItem href="#users" icon={<Icon name="users" />}>
              Org Users
            </SidebarItem>
            <SidebarItem href="#integrations" icon={<Icon name="link" />}>
              Integrations
            </SidebarItem>
            <SidebarItem href="#settings" icon={<Icon name="settings" />}>
              Settings
            </SidebarItem>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarGroup>
            <SidebarItem icon={<Icon name="log-out" />} onClick={() => {}}>
              Log out
            </SidebarItem>
          </SidebarGroup>
        </SidebarFooter>
      </Sidebar>
    </div>
  );
}

export function Groups() {
  return (
    <div style={{ height: 400, display: 'flex' }}>
      <Sidebar aria-label="Admin">
        <SidebarContent>
          <SidebarGroup label="Overview">
            <SidebarItem href="#dashboard" icon={<Icon name="bar-chart" />} active>
              Dashboard
            </SidebarItem>
            <SidebarItem href="#companies" icon={<Icon name="building" />} badge={12}>
              Companies
            </SidebarItem>
          </SidebarGroup>
          <SidebarGroup label="Library" collapsible>
            <SidebarItem href="#gallery" icon={<Icon name="image" />}>
              Image gallery
            </SidebarItem>
            <SidebarItem href="#templates" icon={<Icon name="layout-grid" />}>
              Global templates
            </SidebarItem>
          </SidebarGroup>
          <SidebarGroup label="Configuration" collapsible defaultOpen={false}>
            <SidebarItem href="#azure" icon={<Icon name="shield" />}>
              Azure setup
            </SidebarItem>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </div>
  );
}

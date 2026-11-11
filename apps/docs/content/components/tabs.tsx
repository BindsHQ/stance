import { Icon, Tabs, TabsContent, TabsList, TabsTrigger } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'tabs',
  name: 'Tabs',
  category: 'navigation',
  summary: 'Switches between related panels of content within the same page.',
  description:
    'Use Tabs to divide one page’s content into peer sections, such as a template’s overview, assignees and history. Panels should not depend on each other. For moving between pages use TabBar, Sidebar or links; for a sequence of steps use Stepper.',
  imports: ['Tabs', 'TabsList', 'TabsTrigger', 'TabsContent'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', layout: 'fill' },
    {
      name: 'Pill',
      title: 'Pill variant',
      description: 'A segmented look for switching views of the same data.',
      layout: 'fill',
    },
    { name: 'WithIconsAndCounts', title: 'Icons and counts', layout: 'fill' },
    {
      name: 'Vertical',
      title: 'Vertical',
      description: 'Settings-style navigation; becomes horizontal below 640px.',
      layout: 'fill',
    },
    {
      name: 'Manual',
      title: 'Manual activation',
      description:
        'Arrow keys move focus only; Enter or Space selects. Use when panels fetch data.',
      layout: 'fill',
    },
  ],
  props: [
    { component: 'Tabs', name: 'value', type: 'string', description: 'Controlled selected tab.' },
    {
      component: 'Tabs',
      name: 'defaultValue',
      type: 'string',
      description: 'Initially selected tab when uncontrolled.',
    },
    {
      component: 'Tabs',
      name: 'onValueChange',
      type: '(value: string) => void',
      description: 'Called when the selected tab changes.',
    },
    {
      component: 'Tabs',
      name: 'orientation',
      type: "'horizontal' | 'vertical'",
      default: "'horizontal'",
      description: 'Layout and arrow-key axis.',
    },
    {
      component: 'Tabs',
      name: 'activationMode',
      type: "'automatic' | 'manual'",
      default: "'automatic'",
      description: 'Whether focusing a tab selects it.',
    },
    {
      component: 'Tabs',
      name: 'variant',
      type: "'line' | 'pill'",
      default: "'line'",
      description: 'Underline or filled indicator.',
    },
    {
      component: 'Tabs',
      name: 'size',
      type: "'sm' | 'md'",
      default: "'md'",
      description: 'Trigger height.',
    },
    {
      component: 'TabsList',
      name: 'loop',
      type: 'boolean',
      default: 'true',
      description: 'Wrap focus from last to first.',
    },
    {
      component: 'TabsList',
      name: 'fullWidth',
      type: 'boolean',
      default: 'false',
      description: 'Stretch triggers to fill the width.',
    },
    {
      component: 'TabsList',
      name: 'aria-label',
      type: 'string',
      description: 'Name for the tab set; required when a page has several.',
    },
    {
      component: 'TabsTrigger',
      name: 'value',
      type: 'string',
      required: true,
      description: 'Identifies the tab and its panel.',
    },
    {
      component: 'TabsTrigger',
      name: 'icon',
      type: 'ReactNode',
      description: 'Icon before the label.',
    },
    { component: 'TabsTrigger', name: 'badge', type: 'ReactNode', description: 'Trailing count.' },
    {
      component: 'TabsTrigger',
      name: 'disabled',
      type: 'boolean',
      description: 'Skips the tab in keyboard navigation.',
    },
    {
      component: 'TabsContent',
      name: 'value',
      type: 'string',
      required: true,
      description: 'Matches a trigger value.',
    },
    {
      component: 'TabsContent',
      name: 'forceMount',
      type: 'boolean',
      default: 'false',
      description: 'Keep the panel mounted while hidden to preserve its state.',
    },
  ],
  accessibility: [
    'Implements the WAI-ARIA tabs pattern: tablist, tab and tabpanel roles with aria-selected, aria-controls and aria-labelledby.',
    'Only the selected tab is in the Tab order; arrow keys move between tabs and disabled tabs are skipped.',
    'Panels are focusable (tabindex 0) so keyboard users can reach content that has no interactive elements.',
    'High-contrast mode thickens the indicator and fills pill tabs so the selection never relies on subtle tints.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Moves focus into the tab list, then to the active panel.' },
    { keys: ['←', '→'], description: 'Moves between tabs (horizontal).' },
    { keys: ['↑', '↓'], description: 'Moves between tabs (vertical).' },
    { keys: ['Home', 'End'], description: 'First / last tab.' },
    { keys: ['Enter', 'Space'], description: 'Selects the focused tab (manual mode).' },
  ],
  guidelines: {
    do: ['Use short, parallel labels.', 'Keep the most used panel first.'],
    dont: ['Nest tabs inside tabs.', 'Use tabs for steps that must be completed in order.'],
  },
  playground: {
    render: (p) => (
      <Tabs
        defaultValue="overview"
        variant={p.variant as 'line'}
        size={p.size as 'md'}
        orientation={p.orientation as 'horizontal'}
        style={{ width: '100%' }}
      >
        <TabsList aria-label="Template">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assignees">Assignees</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">Template details and preview.</TabsContent>
        <TabsContent value="assignees">Who uses this signature.</TabsContent>
        <TabsContent value="history">Every published version.</TabsContent>
      </Tabs>
    ),
    controls: {
      variant: { type: 'select', options: ['line', 'pill'], default: 'line' },
      size: { type: 'select', options: ['sm', 'md'], default: 'md' },
      orientation: { type: 'select', options: ['horizontal', 'vertical'], default: 'horizontal' },
    },
  },
  related: ['tab-bar', 'stepper', 'accordion'],
};

export function Basic() {
  return (
    <Tabs defaultValue="overview" style={{ width: '100%' }}>
      <TabsList aria-label="Template sections">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="assignees">Assignees</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        The Sales signature is live for 48 people across 3 teams.
      </TabsContent>
      <TabsContent value="assignees">Assign the template to users or whole teams.</TabsContent>
      <TabsContent value="history">Version 7 was published on 4 November 2026.</TabsContent>
    </Tabs>
  );
}

export function Pill() {
  return (
    <Tabs defaultValue="month" variant="pill">
      <TabsList aria-label="Reporting period">
        <TabsTrigger value="week">Week</TabsTrigger>
        <TabsTrigger value="month">Month</TabsTrigger>
        <TabsTrigger value="quarter">Quarter</TabsTrigger>
      </TabsList>
      <TabsContent value="week">1,204 signatures deployed this week.</TabsContent>
      <TabsContent value="month">4,918 signatures deployed this month.</TabsContent>
      <TabsContent value="quarter">13,560 signatures deployed this quarter.</TabsContent>
    </Tabs>
  );
}

export function WithIconsAndCounts() {
  return (
    <Tabs defaultValue="active" style={{ width: '100%' }}>
      <TabsList aria-label="Users">
        <TabsTrigger value="active" icon={<Icon name="users" />} badge={48}>
          Active
        </TabsTrigger>
        <TabsTrigger value="invited" icon={<Icon name="mail" />} badge={5}>
          Invited
        </TabsTrigger>
        <TabsTrigger value="suspended" icon={<Icon name="lock" />} disabled>
          Suspended
        </TabsTrigger>
      </TabsList>
      <TabsContent value="active">48 people have an active signature.</TabsContent>
      <TabsContent value="invited">5 invitations are waiting to be accepted.</TabsContent>
      <TabsContent value="suspended">No suspended users.</TabsContent>
    </Tabs>
  );
}

export function Vertical() {
  return (
    <Tabs defaultValue="profile" orientation="vertical" style={{ width: '100%' }}>
      <TabsList aria-label="Settings">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="organisation">Organisation</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
      </TabsList>
      <TabsContent value="profile">Your name, photo and contact details.</TabsContent>
      <TabsContent value="organisation">Company name, domains and branding.</TabsContent>
      <TabsContent value="security">Two-factor authentication and sessions.</TabsContent>
      <TabsContent value="billing">Plan, invoices and payment method.</TabsContent>
    </Tabs>
  );
}

export function Manual() {
  return (
    <Tabs defaultValue="exchange" activationMode="manual" style={{ width: '100%' }}>
      <TabsList aria-label="Integrations">
        <TabsTrigger value="exchange">Exchange</TabsTrigger>
        <TabsTrigger value="google">Google Workspace</TabsTrigger>
        <TabsTrigger value="azure">Azure AD</TabsTrigger>
      </TabsList>
      <TabsContent value="exchange">Exchange relay is connected.</TabsContent>
      <TabsContent value="google">Connect Google Workspace to sync users.</TabsContent>
      <TabsContent value="azure">Azure AD sync runs every 6 hours.</TabsContent>
    </Tabs>
  );
}

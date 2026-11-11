import * as React from 'react';
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Icon,
} from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'collapsible',
  name: 'Collapsible',
  category: 'advanced',
  summary: 'A single disclosure: one trigger shows and hides one region.',
  description:
    'Collapsible is the primitive behind progressive disclosure, such as "Advanced settings", "Show details" or long log output. It is unstyled apart from focus, so you compose the trigger, often with Button asChild. Use Accordion for a group of related disclosures.',
  imports: ['Collapsible', 'CollapsibleTrigger', 'CollapsibleContent'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', layout: 'fill' },
    { name: 'Controlled', title: 'Controlled', layout: 'fill' },
    {
      name: 'ForceMount',
      title: 'Preserve form state',
      description: 'forceMount keeps inputs mounted while hidden.',
      layout: 'fill',
    },
  ],
  props: [
    { component: 'Collapsible', name: 'open', type: 'boolean', description: 'Controlled state.' },
    {
      component: 'Collapsible',
      name: 'defaultOpen',
      type: 'boolean',
      default: 'false',
      description: 'Initial state.',
    },
    {
      component: 'Collapsible',
      name: 'onOpenChange',
      type: '(open: boolean) => void',
      description: 'Called on toggle.',
    },
    {
      component: 'Collapsible',
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Prevent toggling.',
    },
    {
      component: 'Collapsible',
      name: 'asChild',
      type: 'boolean',
      default: 'false',
      description: 'Render as the child element.',
    },
    {
      component: 'CollapsibleTrigger',
      name: 'asChild',
      type: 'boolean',
      default: 'false',
      description: 'Use your own button element.',
    },
    {
      component: 'CollapsibleContent',
      name: 'forceMount',
      type: 'boolean',
      default: 'false',
      description: 'Keep mounted (hidden) while closed.',
    },
  ],
  accessibility: [
    'The trigger is a button with aria-expanded and aria-controls pointing to the content.',
    'Closed content is removed, or hidden with the hidden attribute when forceMount is set.',
    'Make the trigger text describe what it reveals, e.g. "Show 3 failed mailboxes".',
  ],
  keyboard: [{ keys: ['Enter', 'Space'], description: 'Toggles the content.' }],
  guidelines: {
    do: ['Keep the trigger next to the content it controls.'],
    dont: ['Use for navigation menus; use NavigationMenu.'],
  },
  related: ['accordion'],
};

export function Basic() {
  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" trailingIcon={<Icon name="chevron-down" />}>
          Advanced settings
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <p style={{ margin: '12px 0 0' }}>
          Relay host, port and TLS options are managed by your IT administrator.
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function Controlled() {
  const [open, setOpen] = React.useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <strong>3 mailboxes failed</strong>
        <CollapsibleTrigger asChild>
          <Button variant="link" size="sm">
            {open ? 'Hide' : 'Show'} details
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
          <li>tomas@binds.si: mailbox not found</li>
          <li>oliver@binds.si: licence missing</li>
          <li>hana@binds.si: relay timeout</li>
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ForceMount() {
  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm">
          Toggle optional fields
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent forceMount>
        <label style={{ display: 'grid', gap: 4, marginTop: 12, maxWidth: 280 }}>
          Mobile number
          <input placeholder="+44 7700 900123" />
        </label>
      </CollapsibleContent>
    </Collapsible>
  );
}

import { Alert, Button } from '@bindshq/stance-react';
import * as React from 'react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'alert',
  name: 'Alert',
  category: 'feedback',
  summary: 'An inline message about the state of a page or section, in four tones.',
  description:
    'Alert sits in the content flow, near what it describes, and stays until the situation changes or the user dismisses it. Use it for form-level errors, expiring connections or plan limits. For page-wide announcements use Banner; for transient confirmations use Toast.',
  imports: ['Alert'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', layout: 'fill' },
    { name: 'Tones', title: 'Tones', layout: 'fill' },
    { name: 'WithActions', title: 'With actions', layout: 'fill' },
    { name: 'Dismissible', title: 'Dismissible', layout: 'fill' },
  ],
  props: [
    {
      component: 'Alert',
      name: 'tone',
      type: "'info' | 'success' | 'warning' | 'danger'",
      default: "'info'",
      description: 'Meaning of the message.',
    },
    { component: 'Alert', name: 'title', type: 'ReactNode', description: 'Short heading.' },
    { component: 'Alert', name: 'children', type: 'ReactNode', description: 'Description.' },
    {
      component: 'Alert',
      name: 'icon',
      type: 'ReactNode | false',
      description: 'Replace the tone icon or hide it.',
    },
    {
      component: 'Alert',
      name: 'actions',
      type: 'ReactNode',
      description: 'Buttons or links under the message.',
    },
    {
      component: 'Alert',
      name: 'onDismiss',
      type: '() => void',
      description: 'Shows a dismiss button.',
    },
    {
      component: 'Alert',
      name: 'dismissLabel',
      type: 'string',
      default: "'Dismiss'",
      description: 'Dismiss button label.',
    },
    {
      component: 'Alert',
      name: 'role',
      type: 'AriaRole',
      description: 'Override the automatic role (alert for warning/danger, status otherwise).',
    },
  ],
  accessibility: [
    'Warning and danger alerts use role="alert" and are announced immediately; info and success use role="status".',
    'Tone is conveyed by icon and title text, never colour alone.',
    'Status colours meet 4.5:1 contrast in all three themes; high contrast adds heavier borders.',
  ],
  guidelines: {
    do: [
      'Say what happened and what to do next.',
      'Place the alert next to the content it concerns.',
    ],
    dont: [
      'Render role="alert" messages on page load for non-urgent information.',
      'Stack several alerts; combine them.',
    ],
  },
  related: ['banner', 'toast', 'form-field'],
};

export function Basic() {
  return (
    <Alert title="Signatures update overnight">
      Changes you publish today reach every mailbox after the 02:00 sync.
    </Alert>
  );
}

export function Tones() {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Alert tone="info" title="Directory sync is on">
        New starters receive the default signature automatically.
      </Alert>
      <Alert tone="success" title="Exchange connected">
        Signatures will deploy through your relay.
      </Alert>
      <Alert tone="warning" title="48 of 50 seats used">
        Add seats before inviting more people.
      </Alert>
      <Alert tone="danger" title="Deployment failed">
        Exchange rejected the connection. Check your relay credentials.
      </Alert>
    </div>
  );
}

export function WithActions() {
  return (
    <Alert
      tone="warning"
      title="Azure connection expires in 3 days"
      actions={
        <>
          <Button size="sm">Reconnect</Button>
          <Button size="sm" variant="ghost">
            Remind me later
          </Button>
        </>
      }
    >
      Signatures stop deploying when the token expires.
    </Alert>
  );
}

export function Dismissible() {
  const [open, setOpen] = React.useState(true);
  return open ? (
    <Alert tone="success" title="Import complete" onDismiss={() => setOpen(false)}>
      120 users were added to your organisation.
    </Alert>
  ) : (
    <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
      Show again
    </Button>
  );
}

import { Banner, Button } from '@bindshq/stance-react';
import * as React from 'react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'banner',
  name: 'Banner',
  category: 'feedback',
  summary: 'A full-width, page-level announcement such as maintenance windows or plan limits.',
  description:
    'Banner spans the top of the page or app shell and applies to the whole product, not one section. The default brand tone uses inverse ivory and indigo; status tones communicate urgency. Show at most one banner at a time and let people dismiss non-critical ones.',
  imports: ['Banner'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Brand announcement', layout: 'fill' },
    { name: 'Tones', title: 'Tones', layout: 'fill' },
    {
      name: 'Controlled',
      title: 'Controlled dismissal',
      description: 'Persist dismissal yourself, e.g. in user settings.',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'Banner',
      name: 'tone',
      type: "'brand' | 'info' | 'success' | 'warning' | 'danger'",
      default: "'brand'",
      description: 'Visual tone.',
    },
    { component: 'Banner', name: 'children', type: 'ReactNode', description: 'The message.' },
    {
      component: 'Banner',
      name: 'action',
      type: 'ReactNode',
      description: 'A link or button after the message.',
    },
    {
      component: 'Banner',
      name: 'icon',
      type: 'ReactNode | false',
      description: 'Custom or hidden icon (status tones show one by default).',
    },
    {
      component: 'Banner',
      name: 'dismissible',
      type: 'boolean',
      default: 'false',
      description: 'Show a dismiss button.',
    },
    {
      component: 'Banner',
      name: 'open / defaultOpen / onOpenChange',
      type: 'boolean / boolean / (open: boolean) => void',
      default: 'defaultOpen: true',
      description: 'Visibility state.',
    },
    {
      component: 'Banner',
      name: 'label',
      type: 'string',
      default: "'Announcement'",
      description: 'Accessible region name.',
    },
    {
      component: 'Banner',
      name: 'dismissLabel',
      type: 'string',
      default: "'Dismiss announcement'",
      description: 'Dismiss button label.',
    },
  ],
  accessibility: [
    'Rendered as a labelled <section> region so it can be found from the landmarks list.',
    'It is not a live region: content present on load is read in order. For urgent changes after load, use Alert or Toast.',
    'The dismiss button has an explicit accessible name.',
  ],
  guidelines: {
    do: [
      'Keep the message to one sentence with one action.',
      'Remember dismissal across sessions.',
    ],
    dont: ['Use banners for marketing on every page.', 'Show several banners at once.'],
  },
  related: ['alert', 'toast'],
};

export function Basic() {
  return (
    <Banner dismissible action={<a href="#outlook">See what’s new</a>}>
      The eSignify Outlook add-in is now available for every plan.
    </Banner>
  );
}

export function Tones() {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <Banner tone="info" label="Information">
        Directory sync now runs every hour.
      </Banner>
      <Banner tone="success" label="Success">
        Your organisation is verified.
      </Banner>
      <Banner tone="warning" label="Plan limit" action={<a href="#billing">Add seats</a>}>
        You have used 48 of 50 seats.
      </Banner>
      <Banner tone="danger" label="Service status">
        Deployments are paused while Exchange Online is degraded.
      </Banner>
    </div>
  );
}

export function Controlled() {
  const [open, setOpen] = React.useState(true);
  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
      <Banner tone="warning" dismissible open={open} onOpenChange={setOpen} label="Maintenance">
        Scheduled maintenance on Sunday, 02:00–03:00 GMT.
      </Banner>
      {!open && (
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          Restore banner
        </Button>
      )}
    </div>
  );
}

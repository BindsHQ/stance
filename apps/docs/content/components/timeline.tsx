import { Icon, Timeline, TimelineItem } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'timeline',
  name: 'Timeline',
  category: 'data-display',
  summary: 'A chronological list of events, such as an audit trail or deployment history.',
  description:
    'Use Timeline for event histories where order matters: contract audit trails, deployment logs and account activity. Each item has a time, title, optional description and a marker whose tone reflects status. Status is also given in text for screen readers.',
  imports: ['Timeline', 'TimelineItem'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Audit trail', layout: 'fill' },
    { name: 'WithIcons', title: 'Icons and tones', layout: 'fill' },
    {
      name: 'Alternate',
      title: 'Alternating',
      description: 'On screens 768px and wider, items alternate sides.',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'Timeline',
      name: 'alternate',
      type: 'boolean',
      default: 'false',
      description: 'Alternate items left/right on wide screens.',
    },
    {
      component: 'Timeline',
      name: 'density',
      type: "'sm' | 'md'",
      default: "'md'",
      description: 'Marker size and spacing.',
    },
    {
      component: 'TimelineItem',
      name: 'title',
      type: 'ReactNode',
      required: true,
      description: 'What happened.',
    },
    {
      component: 'TimelineItem',
      name: 'time',
      type: 'ReactNode',
      description: 'Human-readable time.',
    },
    {
      component: 'TimelineItem',
      name: 'dateTime',
      type: 'string',
      description: 'Machine-readable time for <time>.',
    },
    {
      component: 'TimelineItem',
      name: 'description',
      type: 'ReactNode',
      description: 'Supporting detail.',
    },
    {
      component: 'TimelineItem',
      name: 'icon',
      type: 'ReactNode',
      description: 'Icon inside the marker; a dot otherwise.',
    },
    {
      component: 'TimelineItem',
      name: 'tone',
      type: "'neutral' | 'accent' | 'success' | 'warning' | 'danger'",
      default: "'neutral'",
      description: 'Marker colour.',
    },
    {
      component: 'TimelineItem',
      name: 'statusLabel',
      type: 'string',
      description: 'Status announced to screen readers, e.g. "Failed".',
    },
  ],
  accessibility: [
    'Renders an ordered list, so position and count are announced.',
    'Times use <time datetime> for machine readability.',
    'Markers are decorative. Pass statusLabel so status is never conveyed by colour alone.',
  ],
  guidelines: {
    do: ['Order newest first for activity feeds and oldest first for processes.'],
    dont: ['Use Timeline for steps the user must complete; use Stepper.'],
  },
  related: ['stepper', 'list'],
};

export function Basic() {
  return (
    <Timeline aria-label="Contract MSA-2026-014 history">
      <TimelineItem
        title="Contract created"
        time="3 Nov, 10:02"
        dateTime="2026-11-03T10:02"
        description="Drafted by Priya Raman from the MSA template."
      />
      <TimelineItem
        title="Sent for signature"
        time="4 Nov, 14:30"
        dateTime="2026-11-04T14:30"
        tone="accent"
      />
      <TimelineItem
        title="Signed by Northwind Ltd"
        time="6 Nov, 09:12"
        dateTime="2026-11-06T09:12"
        tone="success"
        statusLabel="Completed"
      />
    </Timeline>
  );
}

export function WithIcons() {
  return (
    <Timeline aria-label="Deployment log">
      <TimelineItem
        icon={<Icon name="upload" />}
        tone="accent"
        title="Sales 2026 published"
        time="09:12"
      />
      <TimelineItem
        icon={<Icon name="check" />}
        tone="success"
        statusLabel="Succeeded"
        title="Deployed to 48 mailboxes"
        time="09:20"
        description="Exchange relay accepted every user."
      />
      <TimelineItem
        icon={<Icon name="alert-triangle" />}
        tone="warning"
        statusLabel="Warning"
        title="2 users missing job titles"
        time="09:20"
      />
      <TimelineItem
        icon={<Icon name="x" />}
        tone="danger"
        statusLabel="Failed"
        title="tomas@binds.si failed"
        time="09:21"
        description="Mailbox not found."
      />
    </Timeline>
  );
}

export function Alternate() {
  return (
    <Timeline alternate aria-label="Onboarding">
      <TimelineItem title="Organisation created" time="Mon" tone="accent" />
      <TimelineItem title="Exchange connected" time="Tue" tone="success" statusLabel="Done" />
      <TimelineItem title="Templates assigned" time="Wed" />
      <TimelineItem title="First deployment" time="Thu" />
    </Timeline>
  );
}

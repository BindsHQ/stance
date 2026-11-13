import * as React from 'react';
import { Button, InsightCallout } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'insight-callout',
  name: 'InsightCallout',
  category: 'ai',
  summary:
    'A callout for something the system noticed in your data, with the evidence behind it, a confidence level and one suggested action.',
  description:
    'Use InsightCallout when the product has found something worth a look: a trend, a risk or an opportunity. State the finding in one line, keep the evidence one press away, and offer a single next step. People can dismiss it, and the tone is always said in words as well as shown.',
  imports: ['InsightCallout'],
  status: 'beta',
  examples: [
    {
      name: 'Basic',
      title: 'A finding with evidence and an action',
      layout: 'fill',
    },
    {
      name: 'Tones',
      title: 'Tones',
      description: 'Each tone has its own word and icon, so it never depends on colour.',
      layout: 'fill',
    },
    {
      name: 'Dismissible',
      title: 'Dismissible',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'InsightCallout',
      name: 'title',
      type: 'React.ReactNode',
      required: true,
      description: 'The finding in one line.',
    },
    {
      component: 'InsightCallout',
      name: 'children',
      type: 'React.ReactNode',
      description: 'A sentence or two that explains the finding.',
    },
    {
      component: 'InsightCallout',
      name: 'evidence',
      type: 'React.ReactNode',
      description: 'What the finding is based on. Shown behind a disclosure.',
    },
    {
      component: 'InsightCallout',
      name: 'defaultEvidenceOpen',
      type: 'boolean',
      default: 'false',
      description: 'Show the evidence on first render.',
    },
    {
      component: 'InsightCallout',
      name: 'evidenceOpen',
      type: 'boolean',
      description: 'Controlled open state of the evidence.',
    },
    {
      component: 'InsightCallout',
      name: 'onEvidenceOpenChange',
      type: '(open: boolean) => void',
      description: 'Called when the reader opens or closes the evidence.',
    },
    {
      component: 'InsightCallout',
      name: 'confidence',
      type: "'high' | 'medium' | 'low' | 'unknown'",
      description: 'How sure the system is. Shown in words with ConfidenceBadge.',
    },
    {
      component: 'InsightCallout',
      name: 'action',
      type: 'React.ReactNode',
      description: 'One suggested action, usually a Button.',
    },
    {
      component: 'InsightCallout',
      name: 'onDismiss',
      type: '() => void',
      description: 'Called when the reader dismisses the callout. Shows a dismiss button.',
    },
    {
      component: 'InsightCallout',
      name: 'tone',
      type: "'neutral' | 'positive' | 'attention'",
      default: "'neutral'",
      description: 'The kind of finding. Each tone has its own word and icon.',
    },
    {
      component: 'InsightCallout',
      name: 'icon',
      type: 'React.ReactNode',
      description: 'Replaces the tone icon.',
    },
    {
      component: 'InsightCallout',
      name: 'headingLevel',
      type: '2 | 3 | 4 | 5 | 6',
      default: '3',
      description: 'Heading level of the title.',
    },
    {
      component: 'InsightCallout',
      name: 'labels',
      type: 'Partial<InsightCalloutLabels>',
      description: 'Translations: tone words, showEvidence, hideEvidence and dismiss.',
    },
  ],
  accessibility: [
    'The callout is a group named by its tone and title, for example Needs attention: three invoices are overdue.',
    'The title is a real heading at a level you choose.',
    'The tone is stated in words and by icon shape, never by colour alone.',
    'The evidence control is a button with aria-expanded and aria-controls.',
    'The dismiss button has its own accessible name.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Moves through the evidence control, the action and dismiss.' },
    {
      keys: ['Enter', 'Space'],
      description: 'Opens the evidence or activates the focused button.',
    },
  ],
  guidelines: {
    do: [
      'Lead with the finding, not with how it was found.',
      'Show the figures behind it so people can check.',
    ],
    dont: [
      'Offer more than one action; pick the most useful one.',
      'Use it for errors or system status; use Alert or Banner.',
    ],
  },
  related: ['confidence-badge', 'summary-card', 'alert', 'stat-card'],
};

const figures = (
  <ul style={{ margin: 0, paddingInlineStart: 18 }}>
    <li>14 of 22 contracts renewed before their end date.</li>
    <li>Last quarter it was 9 of 21.</li>
  </ul>
);

export function Basic() {
  return (
    <div style={{ width: '100%', maxWidth: 520 }}>
      <InsightCallout
        title="Early renewals are up this quarter"
        confidence="high"
        evidence={figures}
        action={<Button size="sm">Review renewals</Button>}
      >
        Most of the increase comes from two teams that started sending reminders 60 days ahead.
      </InsightCallout>
    </div>
  );
}

export function Tones() {
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 520 }}>
      <InsightCallout title="Signing time is steady at two days" />
      <InsightCallout tone="positive" title="Reminders cut signing time by a third" />
      <InsightCallout tone="attention" title="Three invoices are more than 30 days overdue" />
    </div>
  );
}

export function Dismissible() {
  const [shown, setShown] = React.useState(true);
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 520 }}>
      {shown ? (
        <InsightCallout
          tone="attention"
          title="Two templates have not been used for a year"
          confidence="medium"
          onDismiss={() => setShown(false)}
        >
          Archiving them keeps the template list short.
        </InsightCallout>
      ) : (
        <div>
          <Button size="sm" variant="outline" onClick={() => setShown(true)}>
            Show the insight again
          </Button>
        </div>
      )}
    </div>
  );
}

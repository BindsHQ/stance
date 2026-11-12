import * as React from 'react';
import { FeedbackBar } from '@bindshq/stance-react';
import type { FeedbackSubmission, FeedbackValue } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'feedback-bar',
  name: 'FeedbackBar',
  category: 'ai',
  summary:
    'Thumbs up or down on a response, followed by optional reasons and a comment, then a thank you.',
  description:
    'Use FeedbackBar when you want more than a rating: the reason a response was good or bad. A rating opens a short, optional detail step. For a rating alone inside a row of message actions, use MessageActions. FeedbackBar holds no data itself; you receive the result in onSubmit.',
  imports: ['FeedbackBar'],
  status: 'beta',
  examples: [
    { name: 'Basic', title: 'Rating with reasons', layout: 'fill', minHeight: 320 },
    {
      name: 'RatingOnly',
      title: 'Rating only',
      description: 'With no reasons and allowComment off, a rating is sent straight away.',
    },
    {
      name: 'DetailForDown',
      title: 'Details for bad responses only',
      description: 'detailFor limits the follow up to one rating.',
      layout: 'fill',
      minHeight: 320,
    },
    {
      name: 'Controlled',
      title: 'Controlled, with a prompt',
      layout: 'fill',
      minHeight: 320,
    },
  ],
  props: [
    {
      component: 'FeedbackBar',
      name: 'value',
      type: "'up' | 'down' | null",
      description: 'Controlled rating.',
    },
    {
      component: 'FeedbackBar',
      name: 'defaultValue',
      type: "'up' | 'down' | null",
      default: 'null',
      description: 'Initial rating when uncontrolled.',
    },
    {
      component: 'FeedbackBar',
      name: 'onValueChange',
      type: "(value: 'up' | 'down' | null) => void",
      description: 'Called when the rating changes. Choosing the pressed rating again clears it.',
    },
    {
      component: 'FeedbackBar',
      name: 'reasons',
      type: '{ id: string; label: string }[]',
      description: 'Reasons offered after a rating.',
    },
    {
      component: 'FeedbackBar',
      name: 'onSubmit',
      type: '(feedback: FeedbackSubmission) => void',
      description: 'Called with { value, reasons, comment }. Skipping sends empty details.',
    },
    {
      component: 'FeedbackBar',
      name: 'allowComment',
      type: 'boolean',
      default: 'true',
      description: 'Offer a comment field after a rating.',
    },
    {
      component: 'FeedbackBar',
      name: 'detailFor',
      type: "'both' | 'up' | 'down'",
      default: "'both'",
      description: 'Which ratings ask for details.',
    },
    {
      component: 'FeedbackBar',
      name: 'prompt',
      type: 'ReactNode',
      description: 'A short visible question before the buttons.',
    },
    {
      component: 'FeedbackBar',
      name: 'size',
      type: "'xs' | 'sm' | 'md'",
      default: "'sm'",
      description: 'Size of the rating buttons.',
    },
    {
      component: 'FeedbackBar',
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Disable rating.',
    },
    {
      component: 'FeedbackBar',
      name: 'labels',
      type: 'Partial<FeedbackBarLabels>',
      description: 'Translations for every button, heading, field label and the thank you text.',
    },
  ],
  accessibility: [
    'The two ratings are toggle buttons with aria-pressed, inside a named group.',
    'Reasons are toggle chips in a group labelled by its visible question; the comment field has a visible label.',
    'The thank you is announced politely, once, and focus returns to the rating instead of being lost.',
    'Every step works with the keyboard, and rating buttons and chips grow to 44px on touch screens.',
    'The current step is exposed as data-state: idle, rated, detail or submitted.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Moves through ratings, reasons, the comment and the buttons.' },
    { keys: ['Enter', 'Space'], description: 'Toggles a rating or a reason.' },
    { keys: ['Enter'], description: 'On Send feedback: submits.' },
  ],
  guidelines: {
    do: [
      'Offer three to five reasons that you will act on.',
      'Keep the detail step optional; Skip still records the rating.',
    ],
    dont: [
      'Require a comment before a rating counts.',
      'Show both FeedbackBar and rating buttons in MessageActions on the same message.',
    ],
  },
  related: ['report-dialog', 'chip', 'textarea'],
};

const reasons = [
  { id: 'inaccurate', label: 'Not accurate' },
  { id: 'incomplete', label: 'Missing information' },
  { id: 'long', label: 'Too long' },
  { id: 'tone', label: 'Wrong tone' },
];

export function Basic() {
  return (
    <div style={{ width: '100%', maxWidth: 460 }}>
      <FeedbackBar reasons={reasons} onSubmit={() => {}} />
    </div>
  );
}

export function RatingOnly() {
  return <FeedbackBar allowComment={false} onSubmit={() => {}} />;
}

export function DetailForDown() {
  return (
    <div style={{ width: '100%', maxWidth: 460 }}>
      <FeedbackBar reasons={reasons} detailFor="down" onSubmit={() => {}} />
    </div>
  );
}

export function Controlled() {
  const [value, setValue] = React.useState<FeedbackValue>(null);
  const [sent, setSent] = React.useState<FeedbackSubmission | null>(null);
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 460 }}>
      <FeedbackBar
        prompt="Was this helpful?"
        value={value}
        onValueChange={setValue}
        reasons={reasons}
        onSubmit={setSent}
      />
      <span style={{ fontSize: 13 }}>
        {sent
          ? `Sent: ${sent.value}, ${sent.reasons.length} reasons, comment "${sent.comment}"`
          : `Rating: ${value ?? 'none'}`}
      </span>
    </div>
  );
}

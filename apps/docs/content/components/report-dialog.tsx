import * as React from 'react';
import { Button, ReportDialog } from '@bindshq/stance-react';
import type { ReportCategory, ReportSubmission } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'report-dialog',
  name: 'ReportDialog',
  category: 'ai',
  summary: 'A dialog to report an AI response, with a category to choose and room for details.',
  description:
    'Use ReportDialog for the serious cases a thumbs down does not cover: a response that is harmful, unsafe or breaks a rule. It asks for one category and optional details, then hands both to onSubmit. Sending the report is up to your app.',
  imports: ['ReportDialog'],
  status: 'beta',
  examples: [
    { name: 'Basic', title: 'With a trigger', minHeight: 520 },
    {
      name: 'Async',
      title: 'Waiting for the report to send',
      description:
        'Return a promise from onSubmit. The dialog stays open with a busy button until it resolves, and stays open with the form intact if it fails.',
      minHeight: 520,
    },
    {
      name: 'Controlled',
      title: 'Controlled, with required details',
      minHeight: 520,
    },
  ],
  props: [
    {
      component: 'ReportDialog',
      name: 'categories',
      type: '{ id: string; label: string; description?: string }[]',
      required: true,
      description: 'The reasons a response can be reported for.',
    },
    {
      component: 'ReportDialog',
      name: 'onSubmit',
      type: '(report: { category: string; details: string }) => void | Promise<void>',
      description:
        'Called with the report. Return a promise to keep the dialog open until it is sent.',
    },
    {
      component: 'ReportDialog',
      name: 'open',
      type: 'boolean',
      description: 'Controlled open state.',
    },
    {
      component: 'ReportDialog',
      name: 'defaultOpen',
      type: 'boolean',
      default: 'false',
      description: 'Open on first render when uncontrolled.',
    },
    {
      component: 'ReportDialog',
      name: 'onOpenChange',
      type: '(open: boolean) => void',
      description: 'Called when the dialog opens or closes.',
    },
    {
      component: 'ReportDialog',
      name: 'trigger',
      type: 'ReactElement',
      description: 'A button that opens the dialog. Focus returns to it on close.',
    },
    {
      component: 'ReportDialog',
      name: 'submitting',
      type: 'boolean',
      default: 'false',
      description: 'Shows the submit button as busy and blocks a second submit.',
    },
    {
      component: 'ReportDialog',
      name: 'closeOnSubmit',
      type: 'boolean',
      default: 'true',
      description: 'Close the dialog after a successful submit.',
    },
    {
      component: 'ReportDialog',
      name: 'detailsRequired',
      type: 'boolean',
      default: 'false',
      description: 'Require details before the report can be sent.',
    },
    {
      component: 'ReportDialog',
      name: 'size',
      type: "'sm' | 'md' | 'lg' | 'xl' | 'full'",
      default: "'md'",
      description: 'Dialog width.',
    },
    {
      component: 'ReportDialog',
      name: 'labels',
      type: 'Partial<ReportDialogLabels>',
      description: 'Translations for the title, description, field labels and buttons.',
    },
  ],
  accessibility: [
    'Built on Dialog: focus is trapped while open, Escape closes it and focus returns to the trigger.',
    'The dialog is named by its title and described by its supporting text.',
    'Categories are one radio group with a legend, and each description is linked to its option.',
    'The details field has a visible label. Send report stays disabled until a category is chosen.',
    'While sending, the submit button is marked busy and cannot be activated twice.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Moves through the categories, details and buttons.' },
    { keys: ['↑', '↓'], description: 'Chooses a category.' },
    { keys: ['Enter'], description: 'On Send report: submits.' },
    { keys: ['Esc'], description: 'Closes without sending.' },
  ],
  guidelines: {
    do: [
      'Keep categories few and distinct, with “Something else” last.',
      'Tell people what happens to a report in the description.',
    ],
    dont: [
      'Use it for everyday quality feedback; use FeedbackBar.',
      'Ask for personal information in the details.',
    ],
  },
  related: ['feedback-bar', 'dialog', 'radio-group'],
};

const categories: ReportCategory[] = [
  {
    id: 'harmful',
    label: 'Harmful or unsafe',
    description: 'It could cause harm if someone followed it.',
  },
  {
    id: 'inaccurate',
    label: 'Inaccurate',
    description: 'It states something that is not true.',
  },
  { id: 'private', label: 'Shares private information' },
  { id: 'other', label: 'Something else' },
];

export function Basic() {
  return (
    <ReportDialog
      categories={categories}
      trigger={<Button variant="outline">Report response</Button>}
      onSubmit={() => {}}
    />
  );
}

export function Async() {
  return (
    <ReportDialog
      categories={categories}
      trigger={<Button variant="outline">Report response</Button>}
      onSubmit={() => new Promise<void>((resolve) => setTimeout(resolve, 1200))}
    />
  );
}

export function Controlled() {
  const [open, setOpen] = React.useState(false);
  const [report, setReport] = React.useState<ReportSubmission | null>(null);
  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Report response
      </Button>
      <span style={{ fontSize: 13 }}>
        {report ? `Reported as ${report.category}: ${report.details}` : 'No report sent'}
      </span>
      <ReportDialog
        open={open}
        onOpenChange={setOpen}
        categories={categories}
        detailsRequired
        labels={{ details: 'Details' }}
        onSubmit={setReport}
      />
    </div>
  );
}

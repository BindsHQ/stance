import { Button, ConfirmationDialog, ConfirmProvider, useConfirm } from '@bindshq/stance-react';
import * as React from 'react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'confirmation-dialog',
  name: 'ConfirmationDialog',
  category: 'overlays',
  summary:
    'A ready-made confirm/cancel dialog with async loading and error handling, plus an imperative useConfirm() hook.',
  description:
    'ConfirmationDialog wraps AlertDialog with the props most confirmations need. When onConfirm returns a Promise, the confirm button shows a spinner, Cancel and Escape are blocked, the dialog closes on success and shows the error message on failure. ConfirmProvider and useConfirm() give you `await confirm({...})` from any event handler, which replaces window.confirm and hand-rolled confirm contexts.',
  imports: ['ConfirmationDialog', 'ConfirmProvider', 'useConfirm'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', minHeight: 300 },
    {
      name: 'Async',
      title: 'Async confirm',
      description: 'Return a Promise from onConfirm. This example fails once, then succeeds.',
      minHeight: 320,
    },
    {
      name: 'Imperative',
      title: 'useConfirm()',
      description: 'Await the user’s decision inside any handler.',
      minHeight: 300,
    },
  ],
  props: [
    {
      component: 'ConfirmationDialog',
      name: 'title',
      type: 'ReactNode',
      required: true,
      description: 'Question naming the action and object.',
    },
    {
      component: 'ConfirmationDialog',
      name: 'description',
      type: 'ReactNode',
      description: 'Consequences of confirming.',
    },
    {
      component: 'ConfirmationDialog',
      name: 'confirmLabel',
      type: 'ReactNode',
      default: "'Confirm'",
      description: 'Confirm button text. Prefer a verb.',
    },
    {
      component: 'ConfirmationDialog',
      name: 'cancelLabel',
      type: 'ReactNode',
      default: "'Cancel'",
      description: 'Cancel button text.',
    },
    {
      component: 'ConfirmationDialog',
      name: 'tone',
      type: "'default' | 'danger'",
      default: "'default'",
      description: 'Danger styles the confirm button as destructive.',
    },
    {
      component: 'ConfirmationDialog',
      name: 'onConfirm',
      type: '() => void | Promise<unknown>',
      description:
        'Return a Promise for loading state; rejecting keeps the dialog open and shows the error message.',
    },
    {
      component: 'ConfirmationDialog',
      name: 'onCancel',
      type: '() => void',
      description: 'Called on Cancel or Escape.',
    },
    {
      component: 'ConfirmationDialog',
      name: 'loadingText',
      type: 'ReactNode',
      description: 'Confirm label while pending.',
    },
    {
      component: 'ConfirmationDialog',
      name: 'trigger',
      type: 'ReactElement',
      description: 'Optional trigger, rendered with asChild.',
    },
    {
      component: 'ConfirmationDialog',
      name: 'open / defaultOpen / onOpenChange',
      type: 'boolean / boolean / (open: boolean) => void',
      description: 'Controlled or uncontrolled state.',
    },
    {
      component: 'ConfirmationDialog',
      name: 'children',
      type: 'ReactNode',
      description: 'Extra content above the buttons.',
    },
    {
      component: 'ConfirmProvider',
      name: 'children',
      type: 'ReactNode',
      description: 'Mount once near the root.',
    },
    {
      component: 'useConfirm',
      name: 'returns',
      type: '(options: ConfirmOptions) => Promise<boolean>',
      description:
        'Resolves true on confirm, false on cancel. Options: title, description, confirmLabel, cancelLabel, tone.',
    },
  ],
  accessibility: [
    'Built on AlertDialog: role="alertdialog", focus starts on Cancel, outside clicks never dismiss.',
    'While pending the confirm button has aria-busy and Cancel is disabled, so the request cannot be abandoned half-way.',
    'Errors from a rejected promise are shown in a role="alert" message inside the dialog.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Moves between Cancel and Confirm.' },
    { keys: ['Enter', 'Space'], description: 'Activates the focused button.' },
    { keys: ['Esc'], description: 'Cancels (ignored while a confirm is pending).' },
  ],
  guidelines: {
    do: [
      'Use tone="danger" and a specific verb (“Remove user”) for destructive actions.',
      'Throw an Error with a human message from onConfirm on failure.',
    ],
    dont: ['Ask for confirmation of easily undone actions; offer Undo in a toast instead.'],
  },
  related: ['alert-dialog', 'toast'],
};

export function Basic() {
  return (
    <ConfirmationDialog
      trigger={<Button variant="danger">Remove user</Button>}
      title="Remove Ada Lovelace?"
      description="Ada loses access to Binds immediately. Their signatures stay in place."
      confirmLabel="Remove user"
      tone="danger"
      onConfirm={() => {}}
    />
  );
}

export function Async() {
  const attempts = React.useRef(0);
  return (
    <ConfirmationDialog
      trigger={<Button>Deploy signatures</Button>}
      title="Deploy to 128 mailboxes?"
      description="Signatures are pushed through your Exchange relay."
      confirmLabel="Deploy"
      loadingText="Deploying…"
      onConfirm={() =>
        new Promise<void>((resolve, reject) => {
          attempts.current += 1;
          setTimeout(() => {
            if (attempts.current % 2 === 1)
              reject(new Error('Exchange did not respond. Try again.'));
            else resolve();
          }, 1200);
        })
      }
    />
  );
}

function DeleteButton() {
  const confirm = useConfirm();
  const [status, setStatus] = React.useState('');
  return (
    <div style={{ display: 'grid', gap: 8, justifyItems: 'center' }}>
      <Button
        variant="outline"
        onClick={async () => {
          const ok = await confirm({
            title: 'Archive “Q3 campaign”?',
            description: 'Archived templates can be restored for 30 days.',
            confirmLabel: 'Archive',
          });
          setStatus(ok ? 'Archived.' : 'Kept.');
        }}
      >
        Archive template
      </Button>
      <span aria-live="polite">{status}</span>
    </div>
  );
}

export function Imperative() {
  return (
    <ConfirmProvider>
      <DeleteButton />
    </ConfirmProvider>
  );
}

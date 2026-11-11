import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogBody,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'alert-dialog',
  name: 'AlertDialog',
  category: 'overlays',
  summary: 'An interruptive dialog that asks the user to confirm or cancel an important action.',
  description:
    'AlertDialog is for decisions with consequences, such as deleting a template or revoking access. Unlike Dialog it cannot be dismissed by clicking outside, it has no close icon, and focus starts on the least destructive option. For the common confirm/cancel case with async handling, use ConfirmationDialog.',
  imports: [
    'AlertDialog',
    'AlertDialogTrigger',
    'AlertDialogContent',
    'AlertDialogHeader',
    'AlertDialogTitle',
    'AlertDialogDescription',
    'AlertDialogBody',
    'AlertDialogFooter',
    'AlertDialogAction',
    'AlertDialogCancel',
  ],
  status: 'stable',
  examples: [
    { name: 'Destructive', title: 'Destructive action', minHeight: 300 },
    { name: 'NonDestructive', title: 'Non-destructive decision', minHeight: 300 },
    {
      name: 'WithDetails',
      title: 'With details',
      description: 'Use the body for consequences the user should weigh.',
      minHeight: 360,
    },
  ],
  props: [
    {
      component: 'AlertDialog',
      name: 'open / defaultOpen / onOpenChange',
      type: 'boolean / boolean / (open: boolean) => void',
      description: 'Same as Dialog.',
    },
    {
      component: 'AlertDialogTrigger',
      name: 'asChild',
      type: 'boolean',
      default: 'false',
      description: 'Render your own Button as the trigger.',
    },
    {
      component: 'AlertDialogContent',
      name: 'size',
      type: "'sm' | 'md' | 'lg' | 'xl' | 'full'",
      default: "'sm'",
      description: 'Maximum width.',
    },
    {
      component: 'AlertDialogContent',
      name: 'initialFocus',
      type: 'RefObject<HTMLElement>',
      description: 'Override the default focus on AlertDialogCancel.',
    },
    {
      component: 'AlertDialogContent',
      name: 'onEscapeKeyDown',
      type: '(event: KeyboardEvent) => void',
      description: 'Call preventDefault() to block Escape (e.g. while saving).',
    },
    {
      component: 'AlertDialogTitle',
      name: 'level',
      type: '1 | 2 | 3 | 4',
      default: '2',
      description: 'Heading level; the accessible name.',
    },
    {
      component: 'AlertDialogDescription',
      name: '...props',
      type: 'HTMLAttributes<HTMLParagraphElement>',
      description: 'Linked via aria-describedby.',
    },
    {
      component: 'AlertDialogAction',
      name: 'asChild',
      type: 'boolean',
      default: 'false',
      description: 'Confirms and closes. Call event.preventDefault() in onClick to keep it open.',
    },
    {
      component: 'AlertDialogCancel',
      name: 'asChild',
      type: 'boolean',
      default: 'false',
      description: 'Cancels and closes; receives initial focus.',
    },
  ],
  accessibility: [
    'Uses role="alertdialog" with aria-modal, named by the title and described by the description.',
    'Initial focus is on Cancel so an accidental Enter never triggers the destructive action.',
    'Outside clicks do not dismiss; Escape cancels.',
    'Focus is trapped and returns to the trigger on close.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Moves between Cancel and the action.' },
    { keys: ['Enter', 'Space'], description: 'Activates the focused button.' },
    { keys: ['Esc'], description: 'Cancels and closes.' },
  ],
  guidelines: {
    do: [
      'Phrase the title as a question naming the object: “Delete ‘Sales signature’?”',
      'Label the action with the verb, not “OK”.',
    ],
    dont: ['Use for information-only messages.', 'Stack alert dialogs or show them on page load.'],
  },
  related: ['confirmation-dialog', 'dialog'],
};

export function Destructive() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="danger">Delete template</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “Sales, EMEA”?</AlertDialogTitle>
          <AlertDialogDescription>
            32 people use this signature. They will fall back to your organisation default.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline">Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="danger">Delete template</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function NonDestructive() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button>Publish changes</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Publish to all mailboxes?</AlertDialogTitle>
          <AlertDialogDescription>
            Your updated signature will reach 128 people on the next sync.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline">Not yet</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button>Publish</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function WithDetails() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Disconnect Azure</Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="md">
        <AlertDialogHeader>
          <AlertDialogTitle>Disconnect Azure AD?</AlertDialogTitle>
          <AlertDialogDescription>Directory sync stops immediately.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogBody>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>New starters will no longer receive signatures automatically.</li>
            <li>Existing signatures stay in place until changed.</li>
            <li>You can reconnect at any time from Integrations.</li>
          </ul>
        </AlertDialogBody>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline">Keep connected</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="danger">Disconnect</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

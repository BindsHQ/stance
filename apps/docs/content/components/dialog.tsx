import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  FormField,
  Input,
} from '@bindshq/stance-react';
import * as React from 'react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'dialog',
  name: 'Dialog',
  category: 'overlays',
  summary:
    'A modal window for focused tasks that must be finished or dismissed before returning to the page.',
  description:
    'Use Dialog for short, self-contained tasks such as renaming a template or inviting a colleague. It traps focus, locks page scroll and returns focus to the trigger when closed. For confirming destructive actions use AlertDialog; for long or secondary content use Drawer; for non-blocking content use Popover. On phones the dialog becomes a bottom sheet automatically.',
  imports: [
    'Dialog',
    'DialogTrigger',
    'DialogContent',
    'DialogHeader',
    'DialogTitle',
    'DialogDescription',
    'DialogBody',
    'DialogFooter',
    'DialogClose',
  ],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', minHeight: 320 },
    {
      name: 'WithForm',
      title: 'With a form',
      description: 'Focus moves to the first field. Submitting closes the dialog.',
      minHeight: 360,
    },
    {
      name: 'Sizes',
      title: 'Sizes',
      description: 'sm 400px, md 520px, lg 720px, xl 960px, or full screen.',
      minHeight: 320,
    },
    {
      name: 'Controlled',
      title: 'Controlled',
      description: 'Drive open state yourself, e.g. after an async check.',
      minHeight: 320,
    },
  ],
  props: [
    { component: 'Dialog', name: 'open', type: 'boolean', description: 'Controlled open state.' },
    {
      component: 'Dialog',
      name: 'defaultOpen',
      type: 'boolean',
      default: 'false',
      description: 'Initial state when uncontrolled.',
    },
    {
      component: 'Dialog',
      name: 'onOpenChange',
      type: '(open: boolean) => void',
      description: 'Called when the dialog opens or closes.',
    },
    {
      component: 'DialogTrigger',
      name: 'asChild',
      type: 'boolean',
      default: 'false',
      description: 'Render your own element (e.g. a Button) as the trigger.',
    },
    {
      component: 'DialogContent',
      name: 'size',
      type: "'sm' | 'md' | 'lg' | 'xl' | 'full'",
      default: "'md'",
      description: 'Maximum width.',
    },
    {
      component: 'DialogContent',
      name: 'initialFocus',
      type: 'RefObject<HTMLElement>',
      description: 'Element focused on open. Defaults to the first focusable element.',
    },
    {
      component: 'DialogContent',
      name: 'showClose',
      type: 'boolean',
      default: 'true',
      description: 'Show the top-right close button.',
    },
    {
      component: 'DialogContent',
      name: 'closeLabel',
      type: 'string',
      default: "'Close'",
      description: 'Accessible label for the close button.',
    },
    {
      component: 'DialogContent',
      name: 'dismissOnOutsideClick',
      type: 'boolean',
      default: 'true',
      description: 'Close when the backdrop is clicked.',
    },
    {
      component: 'DialogContent',
      name: 'restoreFocus',
      type: 'boolean',
      default: 'true',
      description: 'Return focus to the trigger on close.',
    },
    {
      component: 'DialogContent',
      name: 'onEscapeKeyDown',
      type: '(event: KeyboardEvent) => void',
      description: 'Call event.preventDefault() to keep the dialog open.',
    },
    {
      component: 'DialogContent',
      name: 'onPointerDownOutside',
      type: '(event: PointerEvent) => void',
      description: 'Call event.preventDefault() to keep the dialog open.',
    },
    {
      component: 'DialogContent',
      name: 'disablePortal',
      type: 'boolean',
      default: 'false',
      description: 'Render inline instead of into document.body.',
    },
    {
      component: 'DialogTitle',
      name: 'level',
      type: '1 | 2 | 3 | 4',
      default: '2',
      description: 'Heading level. The title is the dialog’s accessible name and is required.',
    },
    {
      component: 'DialogDescription',
      name: '...props',
      type: 'HTMLAttributes<HTMLParagraphElement>',
      description: 'Linked to the dialog via aria-describedby.',
    },
    {
      component: 'DialogHeader / DialogBody / DialogFooter',
      name: '...props',
      type: 'HTMLAttributes<HTMLDivElement>',
      description: 'Layout regions. The body scrolls when content is tall.',
    },
    {
      component: 'DialogClose',
      name: 'asChild',
      type: 'boolean',
      default: 'false',
      description: 'Wrap your own Button to close the dialog.',
    },
  ],
  accessibility: [
    'The surface has role="dialog" and aria-modal="true", named by DialogTitle and described by DialogDescription.',
    'Focus moves into the dialog on open, is trapped while open, and returns to the trigger on close.',
    'Page scroll is locked while open; nested overlays (menus, popovers) keep working inside the dialog.',
    'The trigger exposes aria-haspopup="dialog", aria-expanded and aria-controls.',
    'Escape always closes the top-most layer only.',
  ],
  keyboard: [
    {
      keys: ['Tab'],
      description: 'Moves to the next focusable element inside the dialog, wrapping at the end.',
    },
    {
      keys: ['Shift', 'Tab'],
      description: 'Moves to the previous focusable element, wrapping at the start.',
    },
    { keys: ['Esc'], description: 'Closes the dialog and returns focus to the trigger.' },
  ],
  guidelines: {
    do: [
      'Give every dialog a clear title that states the task.',
      'Keep dialogs short; move long flows to a page or Drawer.',
      'Put the primary action last in the footer.',
    ],
    dont: [
      'Open a dialog from another dialog.',
      'Use a dialog for messages that need no decision; use Toast or Alert.',
    ],
  },
  related: ['alert-dialog', 'confirmation-dialog', 'drawer', 'sheet', 'popover'],
};

export function Basic() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">View deployment details</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deployment details</DialogTitle>
          <DialogDescription>
            Signatures were pushed to 128 mailboxes through Exchange Online.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <p style={{ margin: 0 }}>
            The next automatic sync runs tonight at 02:00. Mailboxes added after that will receive
            the template on the following run.
          </p>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button>Done</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function WithForm() {
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Rename template</Button>
      </DialogTrigger>
      <DialogContent size="sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setOpen(false);
          }}
        >
          <DialogHeader>
            <DialogTitle>Rename template</DialogTitle>
            <DialogDescription>
              Names are visible to everyone in your organisation.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <FormField label="Template name" required>
              <Input defaultValue="Sales, EMEA" />
            </FormField>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function Sizes() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <Dialog key={size}>
          <DialogTrigger asChild>
            <Button variant="outline">Open {size}</Button>
          </DialogTrigger>
          <DialogContent size={size}>
            <DialogHeader>
              <DialogTitle>Size “{size}”</DialogTitle>
            </DialogHeader>
            <DialogBody>Content wraps to the dialog width and scrolls when tall.</DialogBody>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
}

export function Controlled() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open programmatically
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Session expiring</DialogTitle>
            <DialogDescription>
              You will be signed out in two minutes for security.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Sign out
            </Button>
            <Button onClick={() => setOpen(false)}>Stay signed in</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

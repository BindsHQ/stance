import { Button, toast } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'toast',
  name: 'Toast',
  category: 'feedback',
  summary: 'Brief, non-blocking messages about the result of an action, with optional Undo.',
  description:
    'Call toast() from anywhere after mounting a single <Toaster /> near your app root (these docs mount one for you). Toasts confirm outcomes such as “Template published” and offer quick follow-ups like Undo. They pause while hovered or focused, and toast.promise() tracks async work from loading to success or error. Use Alert for messages that must stay on the page, and ConfirmationDialog for decisions.',
  imports: ['Toaster', 'toast'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic' },
    {
      name: 'Tones',
      title: 'Tones',
      description: 'Errors and warnings are announced assertively; others politely.',
    },
    {
      name: 'WithAction',
      title: 'With an action',
      description: 'Offer Undo instead of asking for confirmation.',
    },
    { name: 'PromiseToast', title: 'Tracking a promise' },
  ],
  props: [
    {
      component: 'Toaster',
      name: 'position',
      type: "'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'",
      default: "'bottom-right'",
      description: 'Screen corner. Phones always use full width.',
    },
    {
      component: 'Toaster',
      name: 'visibleToasts',
      type: 'number',
      default: '3',
      description: 'Maximum shown at once; the rest queue.',
    },
    {
      component: 'Toaster',
      name: 'hotkey',
      type: 'string',
      default: "'F8'",
      description: 'Moves focus to the toasts.',
    },
    {
      component: 'Toaster',
      name: 'label',
      type: 'string',
      default: "'Notifications'",
      description: 'Region label.',
    },
    {
      component: 'Toaster',
      name: 'closeLabel',
      type: 'string',
      default: "'Dismiss notification'",
      description: 'Close button label.',
    },
    {
      component: 'toast',
      name: 'toast(title | options)',
      type: '(ReactNode | ToastOptions) => string',
      description: 'Shows a toast and returns its id.',
    },
    {
      component: 'toast',
      name: 'success / error / warning / info / loading',
      type: '(title, options?) => string',
      description: 'Tone shortcuts.',
    },
    {
      component: 'toast',
      name: 'promise',
      type: '(promise, { loading, success, error }, options?) => Promise',
      description:
        'Loading toast that updates when the promise settles. success/error may be functions of the result.',
    },
    {
      component: 'toast',
      name: 'update / dismiss',
      type: '(id, options) / (id?) => void',
      description: 'Change or remove a toast; dismiss() with no id clears all.',
    },
    {
      component: 'ToastOptions',
      name: 'title / description',
      type: 'ReactNode',
      description: 'Content.',
    },
    {
      component: 'ToastOptions',
      name: 'tone',
      type: "'default' | 'success' | 'error' | 'warning' | 'info' | 'loading'",
      default: "'default'",
      description: 'Meaning and icon.',
    },
    {
      component: 'ToastOptions',
      name: 'duration',
      type: 'number',
      default: '5000',
      description: 'Auto-dismiss time in ms; Infinity keeps it open. Loading toasts persist.',
    },
    {
      component: 'ToastOptions',
      name: 'action',
      type: '{ label, onClick, keepOpen? }',
      description: 'One follow-up action.',
    },
    {
      component: 'ToastOptions',
      name: 'id / dismissible / onDismiss',
      type: 'string / boolean / () => void',
      description: 'Dedupe by id, hide the close button, react to dismissal.',
    },
  ],
  accessibility: [
    'Messages are announced through persistent live regions: polite for most tones, assertive for errors and warnings.',
    'Timers pause while the pointer is over the toasts, while they contain focus, and while the tab is hidden (WCAG 2.2.1 Timing Adjustable).',
    'Press F8 to move focus to the toasts to reach actions with the keyboard.',
    'Actions must also be available elsewhere; toasts disappear.',
  ],
  keyboard: [
    { keys: ['F8'], description: 'Focus the toast list.' },
    { keys: ['Tab'], description: 'Move between toast actions and close buttons.' },
  ],
  guidelines: {
    do: [
      'Confirm completed actions in a few words: “Template published”.',
      'Offer Undo for reversible destructive actions.',
    ],
    dont: [
      'Use toasts for errors the user must fix in a form; show them inline.',
      'Show more than one toast for one action.',
    ],
  },
  related: ['alert', 'banner', 'notification'],
};

export function Basic() {
  return <Button onClick={() => toast('Signature copied to clipboard')}>Show toast</Button>;
}

export function Tones() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <Button
        variant="outline"
        onClick={() => toast.success('Template published', { description: 'Live for 32 people.' })}
      >
        Success
      </Button>
      <Button variant="outline" onClick={() => toast.info('Sync scheduled for 02:00')}>
        Info
      </Button>
      <Button variant="outline" onClick={() => toast.warning('Azure token expires in 3 days')}>
        Warning
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.error('Could not reach Exchange', { description: 'Check your relay settings.' })
        }
      >
        Error
      </Button>
    </div>
  );
}

export function WithAction() {
  return (
    <Button
      variant="danger"
      onClick={() =>
        toast('Ada Lovelace removed', {
          description: 'Their signature will be unassigned.',
          action: { label: 'Undo', onClick: () => toast.success('Ada Lovelace restored') },
        })
      }
    >
      Remove user
    </Button>
  );
}

export function PromiseToast() {
  return (
    <Button
      onClick={() =>
        toast.promise(new Promise<number>((resolve) => setTimeout(() => resolve(120), 1500)), {
          loading: 'Importing users from CSV…',
          success: (count) => `${count} users imported`,
          error: 'Import failed',
        })
      }
    >
      Import users
    </Button>
  );
}

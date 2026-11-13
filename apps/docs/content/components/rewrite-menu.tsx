import * as React from 'react';
import { Button, Icon, RewriteMenu, Textarea } from '@bindshq/stance-react';
import type { GenerationStatus, RewriteMenuAction } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'rewrite-menu',
  name: 'RewriteMenu',
  category: 'ai',
  summary:
    'A menu for changing selected text: improve, shorten, lengthen, change tone, translate or your own instruction, with a preview first.',
  description:
    'Use RewriteMenu beside a text field or over a selection. People choose how the text should change, see the rewrite as a preview, then replace the original or discard the rewrite. Nothing changes until they choose Replace. Your code runs the rewrite and passes the status and the preview in.',
  imports: ['RewriteMenu'],
  status: 'beta',
  examples: [
    {
      name: 'Basic',
      title: 'Rewrite a draft',
      description: 'Choose an action, read the preview, then replace or discard.',
      layout: 'fill',
      minHeight: 420,
    },
    {
      name: 'OnSelection',
      title: 'On selected text',
      description: 'Select some words in the paragraph. The menu opens at the selection.',
      layout: 'fill',
      minHeight: 380,
    },
    {
      name: 'OwnActions',
      title: 'Your own actions',
      description: 'Pass actions to translate the menu or change what it offers.',
      layout: 'fill',
      minHeight: 320,
    },
  ],
  props: [
    {
      component: 'RewriteMenu',
      name: 'open',
      type: 'boolean',
      description: 'Controlled open state.',
    },
    {
      component: 'RewriteMenu',
      name: 'defaultOpen',
      type: 'boolean',
      default: 'false',
      description: 'Open on first render when uncontrolled.',
    },
    {
      component: 'RewriteMenu',
      name: 'onOpenChange',
      type: '(open: boolean) => void',
      description: 'Called when the menu opens or closes.',
    },
    {
      component: 'RewriteMenu',
      name: 'anchor',
      type: 'RewriteMenuAnchor | null',
      description:
        'What to place the menu against: an element, a ref to one, or anything with a rectangle such as a selection Range.',
    },
    {
      component: 'RewriteMenu',
      name: 'actions',
      type: 'RewriteMenuAction[]',
      default: 'rewriteMenuDefaultActions',
      description:
        'The ways to change the text. Each has an id, a label, an optional icon and optional children for a submenu.',
    },
    {
      component: 'RewriteMenu',
      name: 'onAction',
      type: '(action: RewriteMenuAction, parent?: RewriteMenuAction) => void',
      description: 'Called with the chosen action, and its parent when it came from a submenu.',
    },
    {
      component: 'RewriteMenu',
      name: 'allowCustom',
      type: 'boolean',
      default: 'true',
      description: 'Offer a free text instruction.',
    },
    {
      component: 'RewriteMenu',
      name: 'onCustomSubmit',
      type: '(instruction: string) => void',
      description: 'Called with the instruction the person typed.',
    },
    {
      component: 'RewriteMenu',
      name: 'status',
      type: 'GenerationStatus',
      default: "'idle'",
      description:
        'Where the rewrite is in its life cycle. Anything but idle shows the preview panel.',
    },
    {
      component: 'RewriteMenu',
      name: 'preview',
      type: 'React.ReactNode',
      description: 'The rewritten text, shown in the preview panel.',
    },
    {
      component: 'RewriteMenu',
      name: 'onAcceptPreview',
      type: '() => void',
      description: 'Called when the person chooses Replace.',
    },
    {
      component: 'RewriteMenu',
      name: 'onDiscardPreview',
      type: '() => void',
      description:
        'Called when the person discards the rewrite, by button, Escape or a press outside.',
    },
    {
      component: 'RewriteMenu',
      name: 'side',
      type: "'top' | 'right' | 'bottom' | 'left'",
      default: "'bottom'",
      description: 'Side of the anchor to open on.',
    },
    {
      component: 'RewriteMenu',
      name: 'align',
      type: "'start' | 'center' | 'end'",
      default: "'start'",
      description: 'Alignment along the anchor.',
    },
    {
      component: 'RewriteMenu',
      name: 'labels',
      type: 'Partial<RewriteMenuLabels>',
      description:
        'Translations: label, custom, customPlaceholder, customSubmit, back, preview, working, error, stopped, replace and discard.',
    },
  ],
  accessibility: [
    'The actions are a real menu with menu items and submenus, and a name.',
    'The custom instruction and the preview open in a small dialog that keeps Tab inside.',
    'The preview is a labelled region. It is busy while the rewrite arrives, and Replace stays disabled until it is ready.',
    'Errors are announced, and an early stop is stated in words.',
    'When the menu closes, focus returns to where it was, usually the text field.',
    'After a choice the menu stays open for the preview. It closes by itself when no status or preview follows.',
  ],
  keyboard: [
    { keys: ['ArrowDown', 'ArrowUp'], description: 'Moves through the actions.' },
    {
      keys: ['ArrowRight'],
      description: 'Opens a submenu. ArrowLeft closes it. The two swap in right to left.',
    },
    { keys: ['Enter', 'Space'], description: 'Chooses the action.' },
    { keys: ['Escape'], description: 'Closes the menu, or discards the preview.' },
    { keys: ['Tab'], description: 'In the preview, moves between Discard and Replace.' },
  ],
  guidelines: {
    do: [
      'Show the rewrite before it replaces anything.',
      'Reset the status and preview when the person replaces or discards.',
    ],
    dont: [
      'Apply a rewrite straight away; people need to read it first.',
      'Fill the menu with more than a handful of actions.',
    ],
  },
  related: ['dropdown-menu', 'inline-suggestion', 'smart-field', 'prompt-composer'],
};

const shorter = 'Sorry for the delay. The signed copy will reach you on Friday.';

export function Basic() {
  const [text, setText] = React.useState(
    'We sincerely apologise for the delay that has occurred and can confirm that the signed copy will be with you by Friday.',
  );
  const [open, setOpen] = React.useState(false);
  const [status, setStatus] = React.useState<GenerationStatus>('idle');
  const button = React.useRef<HTMLButtonElement>(null);
  const timer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);
  const run = () => {
    setStatus('submitted');
    timer.current = window.setTimeout(() => setStatus('complete'), 1200);
  };
  const reset = () => {
    window.clearTimeout(timer.current);
    setStatus('idle');
  };
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 520 }}>
      <Textarea
        aria-label="Draft"
        rows={4}
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <div>
        <Button
          ref={button}
          size="sm"
          variant="outline"
          leadingIcon={<Icon name="sparkle" />}
          onClick={() => setOpen(true)}
        >
          Rewrite
        </Button>
      </div>
      <RewriteMenu
        open={open}
        onOpenChange={setOpen}
        anchor={button}
        status={status}
        preview={status === 'complete' ? <p>{shorter}</p> : undefined}
        onAction={run}
        onCustomSubmit={run}
        onAcceptPreview={() => {
          setText(shorter);
          reset();
        }}
        onDiscardPreview={reset}
      />
    </div>
  );
}

export function OnSelection() {
  const [range, setRange] = React.useState<Range | null>(null);
  const [status, setStatus] = React.useState<GenerationStatus>('idle');
  return (
    <div style={{ width: '100%', maxWidth: 520 }}>
      <p
        style={{ margin: 0, lineHeight: 1.6 }}
        onMouseUp={() => {
          const selection = window.getSelection();
          if (selection && !selection.isCollapsed) setRange(selection.getRangeAt(0).cloneRange());
        }}
      >
        Thank you for getting in touch about the renewal. We have looked at the terms again and can
        offer the same price for another twelve months.
      </p>
      <RewriteMenu
        open={range !== null}
        onOpenChange={(next) => {
          if (!next) setRange(null);
        }}
        anchor={range}
        allowCustom={false}
        status={status}
        preview={status === 'complete' ? <p>Thanks for asking about the renewal.</p> : undefined}
        onAction={() => setStatus('complete')}
        onAcceptPreview={() => setStatus('idle')}
        onDiscardPreview={() => setStatus('idle')}
      />
    </div>
  );
}

const ownActions: RewriteMenuAction[] = [
  { id: 'plain', label: 'Use plain language', icon: <Icon name="type" /> },
  { id: 'bullets', label: 'Turn into a list', icon: <Icon name="list" /> },
  {
    id: 'audience',
    label: 'Write for',
    icon: <Icon name="users" />,
    children: [
      { id: 'customers', label: 'Customers' },
      { id: 'colleagues', label: 'Colleagues' },
      { id: 'legal', label: 'Legal review' },
    ],
  },
];

export function OwnActions() {
  const [chosen, setChosen] = React.useState('Nothing chosen yet.');
  const button = React.useRef<HTMLButtonElement>(null);
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 520 }}>
      <div>
        <Button ref={button} size="sm" variant="outline" onClick={() => setOpen(true)}>
          Change the text
        </Button>
      </div>
      <p style={{ margin: 0, fontSize: 14 }}>{chosen}</p>
      <RewriteMenu
        open={open}
        onOpenChange={setOpen}
        anchor={button}
        actions={ownActions}
        allowCustom={false}
        labels={{ label: 'Change the text' }}
        onAction={(action, parent) =>
          setChosen(parent ? `${parent.label}: ${action.label}` : action.label)
        }
      />
    </div>
  );
}

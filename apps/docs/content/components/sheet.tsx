import {
  Button,
  Icon,
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'sheet',
  name: 'Sheet',
  category: 'overlays',
  summary: 'A bottom sheet for mobile-first flows, with a drag handle to dismiss.',
  description:
    'Sheet rises from the bottom of the screen and can be dragged down to close, matching how people expect overlays to behave on phones. On tablets and desktops it centres at up to 640px wide. It is a modal dialog with the same focus and Escape handling as Dialog; dragging is an addition, never the only way to close.',
  imports: [
    'Sheet',
    'SheetTrigger',
    'SheetContent',
    'SheetHeader',
    'SheetTitle',
    'SheetDescription',
    'SheetBody',
    'SheetFooter',
    'SheetClose',
  ],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', minHeight: 320 },
    {
      name: 'Heights',
      title: 'Heights',
      description: 'auto fits content (up to 90%), half and full are fixed.',
      minHeight: 320,
    },
    {
      name: 'ActionList',
      title: 'Action list',
      description: 'A common mobile pattern for share or more-actions menus.',
      minHeight: 320,
    },
  ],
  props: [
    {
      component: 'Sheet',
      name: 'open / defaultOpen / onOpenChange',
      type: 'boolean / boolean / (open: boolean) => void',
      description: 'Same as Dialog.',
    },
    {
      component: 'SheetTrigger',
      name: 'asChild',
      type: 'boolean',
      default: 'false',
      description: 'Render your own Button as the trigger.',
    },
    {
      component: 'SheetContent',
      name: 'height',
      type: "'auto' | 'half' | 'full'",
      default: "'auto'",
      description: 'Sheet height.',
    },
    {
      component: 'SheetContent',
      name: 'showHandle',
      type: 'boolean',
      default: 'true',
      description: 'Show the drag handle.',
    },
    {
      component: 'SheetContent',
      name: 'dismissThreshold',
      type: 'number',
      default: '0.3',
      description:
        'Drag distance that dismisses: px, or a fraction of the height when below 1. A quick flick also dismisses.',
    },
    {
      component: 'SheetContent',
      name: 'showClose / closeLabel',
      type: 'boolean / string',
      default: "true / 'Close'",
      description: 'Close button; keep it so keyboard and switch users can close.',
    },
    {
      component: 'SheetTitle',
      name: 'level',
      type: '1 | 2 | 3 | 4',
      default: '2',
      description: 'Heading level; the accessible name.',
    },
    {
      component: 'SheetHeader / SheetBody / SheetFooter / SheetDescription / SheetClose',
      name: '...props',
      type: 'HTMLAttributes',
      description: 'Layout parts shared with Dialog.',
    },
  ],
  accessibility: [
    'A modal dialog named by SheetTitle; the drag handle is decorative (aria-hidden).',
    'Dragging is an enhancement. Escape, the close button and the backdrop all close the sheet too (WCAG 2.5.7 Dragging Movements).',
    'Focus is trapped while open and restored on close.',
  ],
  keyboard: [
    { keys: ['Tab', 'Shift+Tab'], description: 'Cycle focus inside the sheet.' },
    { keys: ['Esc'], description: 'Closes the sheet.' },
  ],
  guidelines: {
    do: [
      'Use for short, mobile-first tasks: sharing, quick actions, pickers.',
      'Keep the close button visible.',
    ],
    dont: ['Put long forms in a sheet; use a page or Drawer.'],
  },
  related: ['drawer', 'dialog', 'action-menu'],
};

export function Basic() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Share signature</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Share signature</SheetTitle>
          <SheetDescription>
            Anyone with the link can copy this signature into their mail client.
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          <code style={{ wordBreak: 'break-all' }}>https://esignify.app/s/7f3k2-sales-emea</code>
        </SheetBody>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
          <Button leadingIcon={<Icon name="copy" />}>Copy link</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function Heights() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      {(['auto', 'half', 'full'] as const).map((height) => (
        <Sheet key={height}>
          <SheetTrigger asChild>
            <Button variant="outline">{height}</Button>
          </SheetTrigger>
          <SheetContent height={height}>
            <SheetHeader>
              <SheetTitle>Height “{height}”</SheetTitle>
            </SheetHeader>
            <SheetBody>Drag the handle down, press Escape, or tap outside to close.</SheetBody>
          </SheetContent>
        </Sheet>
      ))}
    </div>
  );
}

export function ActionList() {
  const actions = [
    { icon: 'pencil', label: 'Edit template' },
    { icon: 'copy', label: 'Duplicate' },
    { icon: 'download', label: 'Download HTML' },
    { icon: 'trash', label: 'Delete' },
  ] as const;
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="secondary" leadingIcon={<Icon name="more-horizontal" />}>
          More actions
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Sales, EMEA</SheetTitle>
        </SheetHeader>
        <SheetBody>
          <div style={{ display: 'grid', gap: 4 }}>
            {actions.map((a) => (
              <SheetClose key={a.label} asChild>
                <Button
                  variant="ghost"
                  leadingIcon={<Icon name={a.icon} />}
                  style={{ justifyContent: 'flex-start' }}
                >
                  {a.label}
                </Button>
              </SheetClose>
            ))}
          </div>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}

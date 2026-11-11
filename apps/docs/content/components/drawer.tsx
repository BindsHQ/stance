import {
  Button,
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  FormField,
  Input,
} from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'drawer',
  name: 'Drawer',
  category: 'overlays',
  summary:
    'A modal panel that slides in from a screen edge for details, filters and secondary tasks.',
  description:
    'Drawer keeps the page in context while showing longer content than a Dialog comfortably holds, such as a user’s profile or a filter panel. It shares Dialog’s behaviour: focus trap, scroll lock, Escape to close and focus return. Side panels never exceed the viewport width on phones.',
  imports: [
    'Drawer',
    'DrawerTrigger',
    'DrawerContent',
    'DrawerHeader',
    'DrawerTitle',
    'DrawerDescription',
    'DrawerBody',
    'DrawerFooter',
    'DrawerClose',
  ],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', minHeight: 320 },
    {
      name: 'Sides',
      title: 'Sides',
      description: 'Slide from any edge. Use left for navigation, right for details.',
      minHeight: 320,
    },
    { name: 'Sizes', title: 'Sizes', minHeight: 320 },
  ],
  props: [
    {
      component: 'Drawer',
      name: 'open / defaultOpen / onOpenChange',
      type: 'boolean / boolean / (open: boolean) => void',
      description: 'Same as Dialog.',
    },
    {
      component: 'DrawerTrigger',
      name: 'asChild',
      type: 'boolean',
      default: 'false',
      description: 'Render your own Button as the trigger.',
    },
    {
      component: 'DrawerContent',
      name: 'side',
      type: "'left' | 'right' | 'top' | 'bottom'",
      default: "'right'",
      description: 'Edge the drawer slides from.',
    },
    {
      component: 'DrawerContent',
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
      default: "'md'",
      description: 'Width (left/right: 320, 416, 640px) or height (top/bottom: 33%, 50%, 85%).',
    },
    {
      component: 'DrawerContent',
      name: 'showClose / closeLabel',
      type: 'boolean / string',
      default: "true / 'Close'",
      description: 'Close button.',
    },
    {
      component: 'DrawerContent',
      name: 'dismissOnOutsideClick',
      type: 'boolean',
      default: 'true',
      description: 'Close on backdrop click.',
    },
    {
      component: 'DrawerContent',
      name: 'initialFocus',
      type: 'RefObject<HTMLElement>',
      description: 'Element focused on open.',
    },
    {
      component: 'DrawerTitle',
      name: 'level',
      type: '1 | 2 | 3 | 4',
      default: '2',
      description: 'Heading level; the accessible name.',
    },
    {
      component: 'DrawerHeader / DrawerBody / DrawerFooter / DrawerDescription',
      name: '...props',
      type: 'HTMLAttributes',
      description: 'Layout parts shared with Dialog. The body scrolls.',
    },
    {
      component: 'DrawerClose',
      name: 'asChild',
      type: 'boolean',
      default: 'false',
      description: 'Closes the drawer.',
    },
  ],
  accessibility: [
    'A modal dialog (role="dialog", aria-modal) named by DrawerTitle.',
    'Focus is trapped inside and returned to the trigger on close.',
    'Respects prefers-reduced-motion: the slide animation is removed.',
  ],
  keyboard: [
    { keys: ['Tab', 'Shift+Tab'], description: 'Cycle focus inside the drawer.' },
    { keys: ['Esc'], description: 'Closes the drawer.' },
  ],
  guidelines: {
    do: [
      'Use for detail views that benefit from keeping the list visible behind.',
      'Put persistent actions in DrawerFooter.',
    ],
    dont: ['Use as primary app navigation on desktop; use Sidebar.'],
  },
  related: ['dialog', 'sheet', 'sidebar'],
};

export function Basic() {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Edit user</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Ada Lovelace</DrawerTitle>
          <DrawerDescription>Head of Operations · London</DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <div style={{ display: 'grid', gap: 16 }}>
            <FormField label="Job title">
              <Input defaultValue="Head of Operations" />
            </FormField>
            <FormField label="Direct phone" description="Shown in the signature.">
              <Input type="tel" defaultValue="+44 20 7946 0958" />
            </FormField>
          </div>
        </DrawerBody>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
          <DrawerClose asChild>
            <Button>Save</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export function Sides() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      {(['left', 'right', 'top', 'bottom'] as const).map((side) => (
        <Drawer key={side}>
          <DrawerTrigger asChild>
            <Button variant="outline">From {side}</Button>
          </DrawerTrigger>
          <DrawerContent side={side}>
            <DrawerHeader>
              <DrawerTitle>Drawer from the {side}</DrawerTitle>
            </DrawerHeader>
            <DrawerBody>Press Escape or click outside to close.</DrawerBody>
          </DrawerContent>
        </Drawer>
      ))}
    </div>
  );
}

export function Sizes() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Drawer key={size}>
          <DrawerTrigger asChild>
            <Button variant="secondary">Size {size}</Button>
          </DrawerTrigger>
          <DrawerContent size={size}>
            <DrawerHeader>
              <DrawerTitle>Size “{size}”</DrawerTitle>
            </DrawerHeader>
            <DrawerBody>Side drawers never exceed the viewport width.</DrawerBody>
          </DrawerContent>
        </Drawer>
      ))}
    </div>
  );
}

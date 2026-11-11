import {
  Button,
  FormField,
  Icon,
  Input,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'popover',
  name: 'Popover',
  category: 'overlays',
  summary:
    'Non-modal floating content anchored to a trigger, for small forms, filters and details.',
  description:
    'Popover shows interactive content next to the element that opened it without blocking the rest of the page. It positions itself, flips when there is no room, and closes on Escape or an outside click. Use Tooltip for short text labels, DropdownMenu for lists of actions, and Dialog when the task needs the user’s full attention.',
  imports: ['Popover', 'PopoverTrigger', 'PopoverContent', 'PopoverClose', 'PopoverAnchor'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', minHeight: 260 },
    {
      name: 'WithForm',
      title: 'With a form',
      description: 'Use trapFocus when the popover contains a form.',
      minHeight: 320,
    },
    {
      name: 'Placement',
      title: 'Placement',
      description: 'Choose a side and alignment; it flips automatically near viewport edges.',
      minHeight: 260,
    },
  ],
  props: [
    { component: 'Popover', name: 'open', type: 'boolean', description: 'Controlled open state.' },
    {
      component: 'Popover',
      name: 'defaultOpen',
      type: 'boolean',
      default: 'false',
      description: 'Initial state when uncontrolled.',
    },
    {
      component: 'Popover',
      name: 'onOpenChange',
      type: '(open: boolean) => void',
      description: 'Called when open state changes.',
    },
    {
      component: 'PopoverTrigger',
      name: 'asChild',
      type: 'boolean',
      default: 'false',
      description: 'Render your own element as the trigger.',
    },
    {
      component: 'PopoverAnchor',
      name: 'asChild',
      type: 'boolean',
      default: 'false',
      description: 'Position against this element instead of the trigger.',
    },
    {
      component: 'PopoverContent',
      name: 'side',
      type: "'top' | 'right' | 'bottom' | 'left'",
      default: "'bottom'",
      description: 'Preferred side.',
    },
    {
      component: 'PopoverContent',
      name: 'align',
      type: "'start' | 'center' | 'end'",
      default: "'center'",
      description: 'Alignment along the side.',
    },
    {
      component: 'PopoverContent',
      name: 'sideOffset',
      type: 'number',
      default: '8',
      description: 'Gap from the anchor in px.',
    },
    {
      component: 'PopoverContent',
      name: 'alignOffset',
      type: 'number',
      default: '0',
      description: 'Shift along the alignment axis in px.',
    },
    {
      component: 'PopoverContent',
      name: 'collisionPadding',
      type: 'number',
      default: '8',
      description: 'Minimum distance from the viewport edge.',
    },
    {
      component: 'PopoverContent',
      name: 'avoidCollisions',
      type: 'boolean',
      default: 'true',
      description: 'Flip and shift to stay in view.',
    },
    {
      component: 'PopoverContent',
      name: 'trapFocus',
      type: 'boolean',
      default: 'false',
      description: 'Keep Tab inside the popover.',
    },
    {
      component: 'PopoverContent',
      name: 'autoFocus',
      type: 'boolean',
      default: 'true',
      description: 'Move focus into the popover on open.',
    },
    {
      component: 'PopoverContent',
      name: 'aria-label',
      type: 'string',
      description: 'Accessible name when there is no visible heading.',
    },
    {
      component: 'PopoverContent',
      name: 'onEscapeKeyDown / onPointerDownOutside',
      type: '(event) => void',
      description: 'Call preventDefault() to keep it open.',
    },
    {
      component: 'PopoverClose',
      name: 'asChild',
      type: 'boolean',
      default: 'false',
      description: 'Wrap your own Button to close.',
    },
  ],
  accessibility: [
    'Content has role="dialog" (non-modal); give it an aria-label or a visible heading.',
    'The trigger exposes aria-haspopup="dialog", aria-expanded and aria-controls.',
    'Focus moves into the popover on open and returns to the trigger on Escape.',
    'Clicking the trigger again closes it; clicks inside nested overlays do not dismiss it.',
  ],
  keyboard: [
    { keys: ['Enter', 'Space'], description: 'On the trigger: toggles the popover.' },
    { keys: ['Tab'], description: 'Moves through the content (wraps when trapFocus is on).' },
    { keys: ['Esc'], description: 'Closes the popover and returns focus to the trigger.' },
  ],
  guidelines: {
    do: [
      'Keep content small and directly related to the trigger.',
      'Provide an explicit close or apply button for forms.',
    ],
    dont: [
      'Put critical, page-blocking decisions in a popover.',
      'Open popovers on hover; use HoverCard for previews.',
    ],
  },
  related: ['tooltip', 'hover-card', 'dropdown-menu', 'dialog'],
};

export function Basic() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" leadingIcon={<Icon name="info" />}>
          Seat usage
        </Button>
      </PopoverTrigger>
      <PopoverContent aria-label="Seat usage">
        <p style={{ margin: 0, fontWeight: 600 }}>48 of 50 seats used</p>
        <p style={{ margin: '4px 0 0' }}>
          Seats free up when a user is removed from your organisation.
        </p>
      </PopoverContent>
    </Popover>
  );
}

export function WithForm() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary">Set reminder</Button>
      </PopoverTrigger>
      <PopoverContent aria-label="Set reminder" trapFocus align="start">
        <div style={{ display: 'grid', gap: 12, width: 260 }}>
          <FormField label="Remind me in (days)">
            <Input type="number" defaultValue={3} min={1} />
          </FormField>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <PopoverClose asChild>
              <Button size="sm" variant="ghost">
                Cancel
              </Button>
            </PopoverClose>
            <PopoverClose asChild>
              <Button size="sm">Save</Button>
            </PopoverClose>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function Placement() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
        <Popover key={side}>
          <PopoverTrigger asChild>
            <Button variant="outline">{side}</Button>
          </PopoverTrigger>
          <PopoverContent side={side} aria-label={`Placed ${side}`}>
            Placed on the {side}.
          </PopoverContent>
        </Popover>
      ))}
    </div>
  );
}

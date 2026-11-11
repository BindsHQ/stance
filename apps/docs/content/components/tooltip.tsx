import { Button, Icon, Tooltip, TooltipProvider } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'tooltip',
  name: 'Tooltip',
  category: 'overlays',
  summary: 'A short text label that appears on hover and keyboard focus.',
  description:
    'Tooltips name icon-only controls and add brief, non-essential hints. They appear after a short delay on hover and immediately on keyboard focus, stay open while hovered, and close on Escape. Tooltip text must not be the only place important information lives, and it cannot contain links or buttons; use Popover or HoverCard for interactive content.',
  imports: ['Tooltip', 'TooltipProvider'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', minHeight: 140 },
    { name: 'Placement', title: 'Placement', minHeight: 180 },
    {
      name: 'SharedDelay',
      title: 'Shared delay',
      description: 'Inside a TooltipProvider, moving between tooltips skips the delay.',
      minHeight: 140,
    },
  ],
  props: [
    {
      component: 'Tooltip',
      name: 'content',
      type: 'ReactNode',
      required: true,
      description: 'Tooltip text. Keep it under ~80 characters.',
    },
    {
      component: 'Tooltip',
      name: 'children',
      type: 'ReactElement',
      required: true,
      description:
        'A single focusable element. Wrap disabled buttons in a focusable span if they need a tooltip.',
    },
    {
      component: 'Tooltip',
      name: 'side',
      type: "'top' | 'right' | 'bottom' | 'left'",
      default: "'top'",
      description: 'Preferred side; flips near edges.',
    },
    {
      component: 'Tooltip',
      name: 'align',
      type: "'start' | 'center' | 'end'",
      default: "'center'",
      description: 'Alignment along the side.',
    },
    {
      component: 'Tooltip',
      name: 'sideOffset',
      type: 'number',
      default: '6',
      description: 'Gap from the trigger in px.',
    },
    {
      component: 'Tooltip',
      name: 'delay',
      type: 'number',
      default: '500',
      description: 'Hover delay in ms (falls back to the provider).',
    },
    {
      component: 'Tooltip',
      name: 'closeDelay',
      type: 'number',
      default: '100',
      description: 'Grace period so the pointer can move onto the tooltip.',
    },
    {
      component: 'Tooltip',
      name: 'open / defaultOpen / onOpenChange',
      type: 'boolean / boolean / (open: boolean) => void',
      description: 'Controlled or uncontrolled state.',
    },
    {
      component: 'Tooltip',
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Never show the tooltip.',
    },
    {
      component: 'Tooltip',
      name: 'className',
      type: 'string',
      description: 'Class for the tooltip bubble.',
    },
    {
      component: 'TooltipProvider',
      name: 'delay',
      type: 'number',
      default: '500',
      description: 'Default hover delay for descendants.',
    },
    {
      component: 'TooltipProvider',
      name: 'skipDelay',
      type: 'number',
      default: '300',
      description: 'Window after a tooltip closes in which the next opens instantly.',
    },
  ],
  accessibility: [
    'The bubble has role="tooltip" and is referenced from the trigger with aria-describedby while visible (existing descriptions are preserved).',
    'Opens on keyboard focus without a delay; opening by click focus is suppressed to avoid flicker.',
    'Hoverable and dismissible without moving the pointer, meeting WCAG 1.4.13 Content on Hover or Focus.',
    'Touch input never opens tooltips; do not rely on them for essential information.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Focusing the trigger shows the tooltip.' },
    { keys: ['Esc'], description: 'Hides the tooltip.' },
  ],
  guidelines: {
    do: [
      'Use to name icon-only buttons (in addition to their aria-label).',
      'Keep text short and sentence-case.',
    ],
    dont: [
      'Put links, buttons or form fields in a tooltip.',
      'Repeat the visible label of the trigger.',
    ],
  },
  related: ['hover-card', 'popover', 'icon-button'],
};

export function Basic() {
  return (
    <Tooltip content="Copy signature HTML">
      <Button variant="outline" size="sm" aria-label="Copy signature HTML">
        <Icon name="copy" />
      </Button>
    </Tooltip>
  );
}

export function Placement() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
        <Tooltip key={side} content={`Shown on the ${side}`} side={side}>
          <Button variant="secondary" size="sm">
            {side}
          </Button>
        </Tooltip>
      ))}
    </div>
  );
}

export function SharedDelay() {
  const tools = [
    { icon: 'pencil', label: 'Edit' },
    { icon: 'copy', label: 'Duplicate' },
    { icon: 'download', label: 'Download' },
    { icon: 'trash', label: 'Delete' },
  ] as const;
  return (
    <TooltipProvider delay={400}>
      <div style={{ display: 'flex', gap: 4 }}>
        {tools.map((t) => (
          <Tooltip key={t.label} content={t.label}>
            <Button variant="ghost" size="sm" aria-label={t.label}>
              <Icon name={t.icon} />
            </Button>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}

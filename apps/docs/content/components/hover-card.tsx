import { HoverCard, HoverCardContent, HoverCardTrigger } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'hover-card',
  name: 'HoverCard',
  category: 'overlays',
  summary: 'A rich preview that appears when hovering or focusing a link.',
  description:
    'HoverCard lets sighted users peek at a person, template or document without leaving the page. It is purely supplementary: the link must lead somewhere that shows the same information, because touch and screen reader users will not see the card. For content users must interact with, use Popover.',
  imports: ['HoverCard', 'HoverCardTrigger', 'HoverCardContent'],
  status: 'stable',
  examples: [
    { name: 'Person', title: 'Person preview', minHeight: 220 },
    { name: 'Template', title: 'Template preview', minHeight: 240 },
    {
      name: 'Delays',
      title: 'Custom delays',
      description: 'Shorter delays suit dense lists; longer ones avoid accidental opens.',
      minHeight: 200,
    },
  ],
  props: [
    {
      component: 'HoverCard',
      name: 'openDelay',
      type: 'number',
      default: '600',
      description: 'Delay before opening on hover, in ms.',
    },
    {
      component: 'HoverCard',
      name: 'closeDelay',
      type: 'number',
      default: '300',
      description: 'Delay before closing after the pointer leaves.',
    },
    {
      component: 'HoverCard',
      name: 'open / defaultOpen / onOpenChange',
      type: 'boolean / boolean / (open: boolean) => void',
      description: 'Controlled or uncontrolled state.',
    },
    {
      component: 'HoverCardTrigger',
      name: 'asChild',
      type: 'boolean',
      default: 'false',
      description: 'Render your own link (e.g. a router Link). Defaults to <a>.',
    },
    {
      component: 'HoverCardTrigger',
      name: '...props',
      type: 'AnchorHTMLAttributes',
      description: 'href and other link attributes.',
    },
    {
      component: 'HoverCardContent',
      name: 'side / align / sideOffset',
      type: 'Side / Align / number',
      default: "'bottom' / 'center' / 8",
      description: 'Placement relative to the trigger.',
    },
    {
      component: 'HoverCardContent',
      name: 'collisionPadding / avoidCollisions',
      type: 'number / boolean',
      default: '8 / true',
      description: 'Viewport collision handling.',
    },
  ],
  accessibility: [
    'Opens on keyboard focus as well as hover; Escape closes it.',
    'Not focus-trapped and not announced: the link itself remains the accessible path to the information.',
    'Touch input does not open the card.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Focusing the trigger opens the card after the delay.' },
    { keys: ['Esc'], description: 'Closes the card.' },
  ],
  guidelines: {
    do: [
      'Use on links to people, templates and documents.',
      'Keep the card to a summary: name, role, a few facts.',
    ],
    dont: ['Put actions in the card that exist nowhere else.'],
  },
  related: ['tooltip', 'popover'],
};

export function Person() {
  return (
    <p style={{ margin: 0 }}>
      Approved by{' '}
      <HoverCard>
        <HoverCardTrigger href="#ada">Ada Lovelace</HoverCardTrigger>
        <HoverCardContent>
          <div style={{ display: 'grid', gap: 4 }}>
            <strong>Ada Lovelace</strong>
            <span>Head of Operations · London</span>
            <span>Owns 14 templates · Admin</span>
          </div>
        </HoverCardContent>
      </HoverCard>{' '}
      on 3 November.
    </p>
  );
}

export function Template() {
  return (
    <HoverCard>
      <HoverCardTrigger href="#template">Sales — EMEA</HoverCardTrigger>
      <HoverCardContent side="right" align="start">
        <div style={{ display: 'grid', gap: 6, width: 240 }}>
          <strong>Sales — EMEA</strong>
          <span>Assigned to 32 people</span>
          <span>Last deployed 2 days ago</span>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

export function Delays() {
  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger href="#fast">Quick preview</HoverCardTrigger>
      <HoverCardContent>Opens after 200ms and closes after 100ms.</HoverCardContent>
    </HoverCard>
  );
}

import { FloatingActionButton, Icon } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'floating-action-button',
  name: 'FloatingActionButton',
  category: 'actions',
  summary: 'The primary action of a screen, floating above content in a corner.',
  description:
    'Use FloatingActionButton on touch-first or content-heavy screens where the main action must stay reachable while scrolling, such as creating a new signature from a long list. Use at most one per view. On desktop dashboards a regular primary Button in the page header is usually clearer.',
  imports: ['FloatingActionButton', 'Icon'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Icon only' },
    { name: 'Extended', title: 'Extended with label' },
    { name: 'Sizes', title: 'Sizes' },
  ],
  props: [
    {
      component: 'FloatingActionButton',
      name: 'icon',
      type: 'ReactNode',
      required: true,
      description: 'The icon.',
    },
    {
      component: 'FloatingActionButton',
      name: 'label',
      type: 'string',
      required: true,
      description: 'Accessible name; visible when extended.',
    },
    {
      component: 'FloatingActionButton',
      name: 'extended',
      type: 'boolean',
      default: 'false',
      description: 'Show the label beside the icon.',
    },
    {
      component: 'FloatingActionButton',
      name: 'position',
      type: "'bottom-right' | 'bottom-left' | 'bottom-center' | 'static'",
      default: "'bottom-right'",
      description: 'Fixed viewport corner, or static to place it yourself.',
    },
    {
      component: 'FloatingActionButton',
      name: 'size',
      type: "'md' | 'lg'",
      default: "'lg'",
      description: '44 or 56px.',
    },
  ],
  accessibility: [
    'Icon-only FABs use the label as aria-label and title.',
    'Fixed positioning respects device safe areas so the button is never hidden by the home indicator.',
    'Place the FAB late in the DOM so its tab position matches its visual prominence without jumping ahead of content.',
  ],
  keyboard: [{ keys: ['Enter', 'Space'], description: 'Activates the action.' }],
  guidelines: {
    do: ['Use for a single, positive, frequent action (create, compose).'],
    dont: ['Use for destructive or secondary actions.', 'Show more than one FAB on a screen.'],
  },
  related: ['button', 'icon-button'],
};

export function Basic() {
  return (
    <FloatingActionButton position="static" icon={<Icon name="plus" />} label="New signature" />
  );
}

export function Extended() {
  return (
    <FloatingActionButton
      position="static"
      extended
      icon={<Icon name="pen-nib" />}
      label="Create template"
    />
  );
}

export function Sizes() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <FloatingActionButton
        position="static"
        size="md"
        icon={<Icon name="plus" />}
        label="Add user"
      />
      <FloatingActionButton
        position="static"
        size="lg"
        icon={<Icon name="plus" />}
        label="Add user"
      />
    </div>
  );
}

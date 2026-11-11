import { IconGallery } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'icon-gallery',
  name: 'IconGallery',
  category: 'media',
  summary: 'A searchable grid of every Stance icon; choose one to copy its name.',
  description:
    'IconGallery lists the Stance icon set with live search. By default choosing an icon copies its name for use with <Icon name="…" />. Pass onSelect to build an icon picker, for example when choosing an icon for a navigation item.',
  imports: ['IconGallery'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'All icons', layout: 'fill' },
    { name: 'Filtered', title: 'Pre-filtered', layout: 'fill' },
  ],
  props: [
    {
      component: 'IconGallery',
      name: 'icons',
      type: 'IconName[]',
      description: 'Icons to show. Default: all.',
    },
    {
      component: 'IconGallery',
      name: 'defaultQuery',
      type: 'string',
      description: 'Initial search.',
    },
    {
      component: 'IconGallery',
      name: 'iconSize',
      type: 'number',
      default: '24',
      description: 'Rendered icon size.',
    },
    {
      component: 'IconGallery',
      name: 'onSelect',
      type: '(name: IconName) => void',
      description: 'Replace copy with a custom action.',
    },
    {
      component: 'IconGallery',
      name: 'searchLabel',
      type: 'string',
      default: "'Search icons'",
      description: 'Search field label.',
    },
  ],
  accessibility: [
    'The search field is labelled, and the result count is announced as you type.',
    'Each icon is a button named after its action, e.g. “Copy icon name check”.',
    'Copy confirmation is announced in a live region.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Moves through the search field and icons.' },
    { keys: ['Enter', 'Space'], description: 'Copies or selects the focused icon.' },
  ],
  related: ['icon'],
};

export function Basic() {
  return <IconGallery />;
}

export function Filtered() {
  return <IconGallery defaultQuery="arrow" iconSize={20} />;
}

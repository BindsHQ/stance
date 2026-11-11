import { Icon, IconButton } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'icon-button',
  name: 'IconButton',
  category: 'actions',
  summary: 'A compact button that shows only an icon and always carries an accessible label.',
  description:
    'Use IconButton for frequent, well-understood actions where space is tight: close, copy, more options, row actions in tables. The label prop is required and becomes both the accessible name and the native tooltip. If the meaning of the icon is not obvious, use a Button with text instead.',
  imports: ['IconButton', 'Icon'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic' },
    { name: 'Variants', title: 'Variants' },
    { name: 'Sizes', title: 'Sizes' },
    { name: 'Shapes', title: 'Circle shape' },
  ],
  props: [
    {
      component: 'IconButton',
      name: 'label',
      type: 'string',
      required: true,
      description: 'Accessible name; also used as the title tooltip.',
    },
    {
      component: 'IconButton',
      name: 'icon',
      type: 'ReactNode',
      required: true,
      description: 'The icon to show, usually <Icon name="…" />.',
    },
    {
      component: 'IconButton',
      name: 'variant',
      type: "'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'",
      default: "'ghost'",
      description: 'Visual emphasis.',
    },
    {
      component: 'IconButton',
      name: 'size',
      type: "'xs' | 'sm' | 'md' | 'lg'",
      default: "'md'",
      description: 'Square size: 24, 32, 40 or 48px.',
    },
    {
      component: 'IconButton',
      name: 'shape',
      type: "'default' | 'circle'",
      default: "'default'",
      description: 'Rounded square or circle.',
    },
    {
      component: 'IconButton',
      name: 'loading',
      type: 'boolean',
      default: 'false',
      description: 'Shows a spinner and blocks clicks.',
    },
    {
      component: 'IconButton',
      name: 'hideTitle',
      type: 'boolean',
      default: 'false',
      description: 'Drop the native title when wrapped in a Tooltip.',
    },
    {
      component: 'IconButton',
      name: '...props',
      type: 'ButtonHTMLAttributes',
      description: 'Native button attributes.',
    },
  ],
  accessibility: [
    'label is required by the type system, so icon-only buttons can never ship without an accessible name.',
    'The icon is aria-hidden; the label is announced instead.',
    'Use the xs size only inside dense layouts with enough spacing to meet the 24px minimum target (WCAG 2.5.8).',
  ],
  keyboard: [
    { keys: ['Enter'], description: 'Activates the button.' },
    { keys: ['Space'], description: 'Activates the button.' },
  ],
  guidelines: {
    do: [
      'Use universally understood icons: close, search, copy, more.',
      'Pair with a Tooltip for richer hints.',
    ],
    dont: ['Use an icon-only button for a primary, uncommon action.'],
  },
  playground: {
    render: (p) => (
      <IconButton
        label="Delete template"
        icon={<Icon name="trash" />}
        variant={p.variant as 'ghost'}
        size={p.size as 'md'}
        shape={p.shape as 'default'}
        loading={p.loading as boolean}
      />
    ),
    controls: {
      variant: {
        type: 'select',
        options: ['primary', 'secondary', 'outline', 'ghost', 'danger'],
        default: 'outline',
      },
      size: { type: 'select', options: ['xs', 'sm', 'md', 'lg'], default: 'md' },
      shape: { type: 'select', options: ['default', 'circle'], default: 'default' },
      loading: { type: 'boolean', default: false },
    },
  },
  related: ['button', 'tooltip', 'icon'],
};

export function Basic() {
  return <IconButton label="Copy signature HTML" icon={<Icon name="copy" />} variant="outline" />;
}

export function Variants() {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <IconButton variant="primary" label="Add user" icon={<Icon name="plus" />} />
      <IconButton variant="secondary" label="Filter" icon={<Icon name="filter" />} />
      <IconButton variant="outline" label="Download" icon={<Icon name="download" />} />
      <IconButton variant="ghost" label="More options" icon={<Icon name="more-horizontal" />} />
      <IconButton variant="danger" label="Delete" icon={<Icon name="trash" />} />
    </div>
  );
}

export function Sizes() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <IconButton size="xs" variant="outline" label="Edit" icon={<Icon name="pencil" />} />
      <IconButton size="sm" variant="outline" label="Edit" icon={<Icon name="pencil" />} />
      <IconButton size="md" variant="outline" label="Edit" icon={<Icon name="pencil" />} />
      <IconButton size="lg" variant="outline" label="Edit" icon={<Icon name="pencil" />} />
    </div>
  );
}

export function Shapes() {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <IconButton
        shape="circle"
        variant="secondary"
        label="Previous"
        icon={<Icon name="chevron-left" />}
      />
      <IconButton
        shape="circle"
        variant="secondary"
        label="Next"
        icon={<Icon name="chevron-right" />}
      />
    </div>
  );
}

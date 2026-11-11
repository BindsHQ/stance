import { Button, Icon } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'button',
  name: 'Button',
  category: 'actions',
  summary: 'Triggers an action, with six variants, four sizes and a loading state.',
  description:
    'Use Button for actions that change something: saving, submitting, opening a dialog. Use Link for navigation that only moves the user elsewhere. Keep one primary button per view so the main action is unambiguous.',
  imports: ['Button'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic' },
    {
      name: 'Variants',
      title: 'Variants',
      description:
        'Emphasis from strongest to weakest. Danger is reserved for destructive actions.',
    },
    {
      name: 'Sizes',
      title: 'Sizes',
      description: 'Control heights of 24, 32, 40 and 48px align with inputs of the same size.',
    },
    { name: 'WithIcons', title: 'With icons' },
    {
      name: 'Loading',
      title: 'Loading',
      description:
        'Loading keeps the button focusable and announces aria-busy while blocking repeat clicks.',
    },
    {
      name: 'Pill',
      title: 'Pill shape',
      description: 'Fully rounded ends for marketing calls to action.',
    },
    {
      name: 'AsLink',
      title: 'As a link',
      description: 'Use asChild to give a router link button styling while keeping link semantics.',
    },
  ],
  props: [
    {
      component: 'Button',
      name: 'variant',
      type: "'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link'",
      default: "'primary'",
      description: 'Visual emphasis.',
    },
    {
      component: 'Button',
      name: 'size',
      type: "'xs' | 'sm' | 'md' | 'lg'",
      default: "'md'",
      description: 'Control height: 24, 32, 40 or 48px.',
    },
    {
      component: 'Button',
      name: 'shape',
      type: "'default' | 'pill'",
      default: "'default'",
      description: 'Pill gives fully rounded ends.',
    },
    {
      component: 'Button',
      name: 'loading',
      type: 'boolean',
      default: 'false',
      description: 'Shows a spinner, sets aria-busy and blocks clicks.',
    },
    {
      component: 'Button',
      name: 'loadingText',
      type: 'ReactNode',
      description: 'Replaces the label while loading.',
    },
    {
      component: 'Button',
      name: 'leadingIcon',
      type: 'ReactNode',
      description: 'Rendered before the label.',
    },
    {
      component: 'Button',
      name: 'trailingIcon',
      type: 'ReactNode',
      description: 'Rendered after the label.',
    },
    {
      component: 'Button',
      name: 'fullWidth',
      type: 'boolean',
      default: 'false',
      description: 'Fill the container width.',
    },
    {
      component: 'Button',
      name: 'asChild',
      type: 'boolean',
      default: 'false',
      description: 'Render the child element with button styles.',
    },
    {
      component: 'Button',
      name: '...props',
      type: 'ButtonHTMLAttributes',
      description: 'All native button attributes. type defaults to "button".',
    },
  ],
  accessibility: [
    'Renders a native <button>, so it is focusable and activates with Enter and Space without extra code.',
    'type defaults to "button" to prevent accidental form submission; pass type="submit" explicitly.',
    'Icon-only actions should use IconButton, which requires an accessible label.',
    'Loading sets aria-busy and aria-disabled but keeps focus, so keyboard users do not lose their place.',
    'Focus is shown with a 2px ring (3px in high contrast) offset from the button edge.',
  ],
  keyboard: [
    { keys: ['Enter'], description: 'Activates the button.' },
    { keys: ['Space'], description: 'Activates the button.' },
  ],
  guidelines: {
    do: [
      'Start labels with a verb: “Save changes”, “Invite member”.',
      'Use one primary button per view.',
    ],
    dont: [
      'Use a button to navigate between pages; use Link.',
      'Disable a submit button to signal errors; show the errors instead.',
    ],
  },
  playground: {
    render: (p) => (
      <Button
        variant={p.variant as 'primary'}
        size={p.size as 'md'}
        shape={p.shape as 'default'}
        loading={p.loading as boolean}
        disabled={p.disabled as boolean}
      >
        {p.children as string}
      </Button>
    ),
    controls: {
      variant: {
        type: 'select',
        options: ['primary', 'secondary', 'outline', 'ghost', 'danger', 'link'],
        default: 'primary',
      },
      size: { type: 'select', options: ['xs', 'sm', 'md', 'lg'], default: 'md' },
      shape: { type: 'select', options: ['default', 'pill'], default: 'default' },
      loading: { type: 'boolean', default: false },
      disabled: { type: 'boolean', default: false },
      children: { type: 'text', default: 'Save changes' },
    },
  },
  related: ['icon-button', 'button-group', 'split-button', 'link'],
};

export function Basic() {
  return <Button>Save changes</Button>;
}

export function Variants() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Delete</Button>
      <Button variant="link">Link</Button>
    </div>
  );
}

export function Sizes() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
      <Button size="xs">Extra small</Button>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  );
}

export function WithIcons() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      <Button leadingIcon={<Icon name="plus" />}>New template</Button>
      <Button variant="outline" trailingIcon={<Icon name="arrow-right" />}>
        Continue
      </Button>
    </div>
  );
}

export function Loading() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      <Button loading>Save</Button>
      <Button loading loadingText="Publishing…" variant="outline">
        Publish
      </Button>
    </div>
  );
}

export function Pill() {
  return (
    <Button shape="pill" size="lg" trailingIcon={<Icon name="arrow-right" />}>
      Let’s talk
    </Button>
  );
}

export function AsLink() {
  return (
    <Button asChild variant="outline">
      <a href="#docs">Read the docs</a>
    </Button>
  );
}

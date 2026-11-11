import { Link, Stack, Text } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'link',
  name: 'Link',
  category: 'typography',
  summary: 'Navigates to another page or resource, inline in text or on its own.',
  description:
    'Use Link for navigation and Button for actions. Inline links are underlined so they can be told apart without colour. External links open in a new tab, carry rel="noopener noreferrer", and tell screen-reader users that a new tab will open. Use `asChild` to style your router’s link component.',
  imports: ['Link'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Inline', layout: 'start' },
    { name: 'Variants', title: 'Variants', layout: 'start' },
    { name: 'External', title: 'External', layout: 'start' },
    {
      name: 'RouterLink',
      title: 'With a router',
      description: 'Pass your framework’s link as the child, e.g. Next.js <Link>.',
      layout: 'start',
    },
  ],
  props: [
    {
      component: 'Link',
      name: 'variant',
      type: "'inline' | 'standalone' | 'subtle'",
      default: "'inline'",
      description: 'Visual style.',
    },
    {
      component: 'Link',
      name: 'external',
      type: 'boolean',
      description:
        'Open in a new tab with icon and announcement. Defaults to true when target="_blank".',
    },
    {
      component: 'Link',
      name: 'asChild',
      type: 'boolean',
      default: 'false',
      description: 'Style a router link component.',
    },
    {
      component: 'Link',
      name: '...props',
      type: 'AnchorHTMLAttributes',
      description: 'All native anchor attributes.',
    },
  ],
  accessibility: [
    'Inline links are underlined, so they are distinguishable without colour (WCAG 1.4.1).',
    'External links announce ", opens in a new tab" and include rel="noopener noreferrer".',
    'Focus shows a 2px outline offset from the text.',
  ],
  keyboard: [{ keys: ['Enter'], description: 'Follows the link.' }],
  guidelines: {
    do: ['Write link text that makes sense out of context.'],
    dont: ['Use “click here”.', 'Use a link to perform an action; use Button.'],
  },
  related: ['button'],
};

export function Basic() {
  return (
    <Text size="sm">
      By continuing you agree to the <Link href="#terms">Terms of service</Link> and{' '}
      <Link href="#privacy">Privacy policy</Link>.
    </Text>
  );
}

export function Variants() {
  return (
    <Stack gap={3}>
      <Text size="sm">
        Inline: read the <Link href="#guide">deployment guide</Link>.
      </Text>
      <Link href="#templates" variant="standalone">
        View all templates →
      </Link>
      <Text size="sm" tone="muted">
        Subtle: owned by{' '}
        <Link href="#user" variant="subtle">
          Priya Raman
        </Link>
      </Text>
    </Stack>
  );
}

export function External() {
  return (
    <Link href="https://binds.si" external variant="standalone">
      Visit binds.si
    </Link>
  );
}

export function RouterLink() {
  return (
    <Link asChild variant="standalone">
      <a href="#dashboard">Go to dashboard</a>
    </Link>
  );
}

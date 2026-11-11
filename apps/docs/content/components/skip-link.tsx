import { SkipLink, Text } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'skip-link',
  name: 'SkipLink',
  category: 'navigation',
  summary: 'Lets keyboard users jump past navigation to the main content.',
  description:
    'Place SkipLink as the first element in <body>. It stays hidden until it receives focus, then appears at the top-left corner. Activating it moves focus to the target, #main by default, so the next Tab continues inside the content.',
  imports: ['SkipLink'],
  status: 'stable',
  examples: [
    {
      name: 'Basic',
      title: 'Basic',
      description: 'Click into the preview and press Tab to reveal the link.',
      layout: 'start',
      minHeight: 120,
    },
    { name: 'CustomTarget', title: 'Custom target and label', layout: 'start', minHeight: 120 },
  ],
  props: [
    {
      component: 'SkipLink',
      name: 'target',
      type: 'string',
      default: "'main'",
      description: 'Id of the element to jump to, with or without #.',
    },
    {
      component: 'SkipLink',
      name: 'children',
      type: 'ReactNode',
      default: "'Skip to main content'",
      description: 'Link text.',
    },
  ],
  accessibility: [
    'Satisfies WCAG 2.4.1 Bypass Blocks.',
    'Moves focus, not just scroll position, by giving the target tabindex="-1" when needed.',
    'Becomes visible on focus with the standard focus ring.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'From the top of the page, reveals the link.' },
    { keys: ['Enter'], description: 'Moves focus to the main content.' },
  ],
  guidelines: {
    do: ['Render it first in the document.', 'Give the target a stable id.'],
    dont: ['Hide it with display: none; it must stay focusable.'],
  },
  related: ['link', 'container'],
};

export function Basic() {
  return (
    <div
      style={{ position: 'relative', transform: 'translateZ(0)', width: '100%', minHeight: 100 }}
    >
      <SkipLink target="docs-skip-demo" />
      <Text size="sm" tone="muted">
        Navigation would be here.
      </Text>
      <div id="docs-skip-demo">
        <Text size="sm">Main content</Text>
      </div>
    </div>
  );
}

export function CustomTarget() {
  return (
    <div
      style={{ position: 'relative', transform: 'translateZ(0)', width: '100%', minHeight: 100 }}
    >
      <SkipLink target="#docs-skip-templates">Skip to templates</SkipLink>
      <div id="docs-skip-templates">
        <Text size="sm">Templates list</Text>
      </div>
    </div>
  );
}

import { Kbd, Stack, Text } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'kbd',
  name: 'Kbd',
  category: 'typography',
  summary: 'Displays a keyboard key or shortcut with spoken labels for symbols.',
  description:
    'Kbd shows a single key, or a shortcut given as `keys`. Modifier names such as mod, shift and alt render as symbols, and each symbol also carries a text label, so screen readers say “Command plus K” rather than reading the glyph.',
  imports: ['Kbd'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Shortcut' },
    { name: 'Single', title: 'Single keys' },
    { name: 'InText', title: 'In running text', layout: 'start' },
  ],
  props: [
    {
      component: 'Kbd',
      name: 'keys',
      type: 'string[]',
      description: 'Keys of a combination, e.g. ["mod", "k"].',
    },
    {
      component: 'Kbd',
      name: 'size',
      type: "'sm' | 'md'",
      default: "'md'",
      description: 'Key size.',
    },
    {
      component: 'Kbd',
      name: 'children',
      type: 'ReactNode',
      description: 'A single key when keys is omitted.',
    },
  ],
  accessibility: [
    'Uses nested <kbd> elements, the HTML idiom for key combinations.',
    'Symbols are aria-hidden and paired with visually hidden names.',
  ],
  guidelines: {
    do: ['Show the platform-appropriate modifier.'],
    dont: ['Use Kbd for non-keyboard input.'],
  },
  related: ['code', 'command-palette'],
};

export function Basic() {
  return <Kbd keys={['mod', 'k']} />;
}

export function Single() {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <Kbd>Esc</Kbd>
      <Kbd keys={['enter']} />
      <Kbd keys={['shift', 'tab']} />
      <Kbd keys={['up']} size="sm" />
      <Kbd keys={['down']} size="sm" />
    </div>
  );
}

export function InText() {
  return (
    <Stack gap={2}>
      <Text size="sm">
        Press <Kbd keys={['mod', 'k']} size="sm" /> to search templates.
      </Text>
      <Text size="sm">
        Press <Kbd size="sm">Esc</Kbd> to close the dialog.
      </Text>
    </Stack>
  );
}

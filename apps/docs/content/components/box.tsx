import { Box, Text } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'box',
  name: 'Box',
  category: 'foundations',
  summary:
    'The lowest-level layout primitive: padding, surface, border, radius and shadow from tokens.',
  description:
    'Box renders any element with spacing and surface styles taken directly from Stance tokens. Use it to build one-off containers without writing CSS. When a pattern repeats, such as a card or a panel, prefer the dedicated component, which carries semantics and states.',
  imports: ['Box'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic' },
    {
      name: 'Surfaces',
      title: 'Surfaces',
      description:
        'Each background sets a matching foreground, so text stays legible in every theme.',
    },
    {
      name: 'Semantic',
      title: 'Semantic element',
      description: 'Use `as` to render a landmark or list item while keeping the styling.',
    },
  ],
  props: [
    {
      component: 'Box',
      name: 'as',
      type: 'keyof JSX.IntrinsicElements',
      default: "'div'",
      description: 'Element to render.',
    },
    {
      component: 'Box',
      name: 'padding',
      type: 'SpaceKey',
      description: 'Padding on all sides from the space scale.',
    },
    {
      component: 'Box',
      name: 'paddingX',
      type: 'SpaceKey',
      description: 'Horizontal padding; overrides padding on the x axis.',
    },
    {
      component: 'Box',
      name: 'paddingY',
      type: 'SpaceKey',
      description: 'Vertical padding; overrides padding on the y axis.',
    },
    {
      component: 'Box',
      name: 'background',
      type: "'canvas' | 'subtle' | 'muted' | 'emphasis' | 'surface' | 'surface-raised' | 'inverse'",
      description: 'Semantic surface with a matching foreground.',
    },
    {
      component: 'Box',
      name: 'border',
      type: "boolean | 'subtle' | 'default' | 'strong'",
      description: 'Border strength. true means default.',
    },
    {
      component: 'Box',
      name: 'radius',
      type: "'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'",
      description: 'Corner radius token.',
    },
    {
      component: 'Box',
      name: 'shadow',
      type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
      description: 'Elevation token. Becomes an outline in high contrast.',
    },
  ],
  accessibility: [
    'Box has no role of its own. Choose a semantic element with `as` (section, aside, li) when the content has structure.',
    'The inverse background flips foreground colour automatically, so contrast is preserved without extra props.',
  ],
  guidelines: {
    do: [
      'Use Box for one-off spacing and surfaces.',
      'Pick backgrounds by meaning (surface, subtle), not by colour.',
    ],
    dont: [
      'Rebuild Card, Alert or Banner with Box; use the component.',
      'Override token colours with inline styles.',
    ],
  },
  playground: {
    render: (p) => (
      <Box
        padding={p.padding as 4}
        background={p.background as 'surface'}
        border={p.border as boolean}
        radius={p.radius as 'lg'}
        shadow={p.shadow === 'none' ? undefined : (p.shadow as 'sm')}
      >
        <Text size="sm">Organisation signature template</Text>
      </Box>
    ),
    controls: {
      padding: { type: 'select', options: ['2', '4', '6', '8'], default: '4' },
      background: {
        type: 'select',
        options: ['canvas', 'subtle', 'muted', 'surface', 'inverse'],
        default: 'surface',
      },
      border: { type: 'boolean', default: true },
      radius: { type: 'select', options: ['none', 'sm', 'md', 'lg', 'xl'], default: 'lg' },
      shadow: { type: 'select', options: ['none', 'xs', 'sm', 'md', 'lg'], default: 'sm' },
    },
  },
  related: ['stack', 'card', 'container'],
};

export function Basic() {
  return (
    <Box padding={6} background="surface" border radius="lg" shadow="sm">
      <Text size="sm">Your organisation has 12 active email signatures.</Text>
    </Box>
  );
}

export function Surfaces() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: 12,
        width: '100%',
      }}
    >
      {(['canvas', 'subtle', 'muted', 'surface', 'inverse'] as const).map((bg) => (
        <Box key={bg} padding={4} background={bg} border radius="md">
          <Text size="sm" tone="inherit">
            {bg}
          </Text>
        </Box>
      ))}
    </div>
  );
}

export function Semantic() {
  return (
    <Box
      as="aside"
      aria-label="Contract summary"
      paddingX={5}
      paddingY={4}
      background="subtle"
      radius="lg"
      border="subtle"
    >
      <Text size="sm" weight="semibold">
        Master services agreement
      </Text>
      <Text size="sm" tone="muted">
        Renews on 1 March 2027
      </Text>
    </Box>
  );
}

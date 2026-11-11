import { Heading, Stack, Text } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'heading',
  name: 'Heading',
  category: 'typography',
  summary: 'Section headings with a semantic level and an independent visual size.',
  description:
    'Choose `level` to match the document outline and `size` to match the visual hierarchy. Keeping them separate lets a card title be an h3 that looks small, or a hero be an h1 at display size, without breaking the outline screen-reader users navigate by.',
  imports: ['Heading'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', layout: 'start' },
    { name: 'Scale', title: 'Size scale', layout: 'start' },
    { name: 'Decoupled', title: 'Level vs size', layout: 'start' },
  ],
  props: [
    {
      component: 'Heading',
      name: 'level',
      type: '1 | 2 | 3 | 4 | 5 | 6',
      default: '2',
      description: 'Semantic level (h1–h6).',
    },
    {
      component: 'Heading',
      name: 'size',
      type: "'display' | '3xl' | '2xl' | 'xl' | 'lg' | 'md' | 'sm'",
      description: 'Visual size. Defaults by level.',
    },
    {
      component: 'Heading',
      name: 'as',
      type: "'h1'…'h6' | 'p' | 'span' | 'div' | 'legend'",
      description: 'Override the rendered element.',
    },
    {
      component: 'Heading',
      name: 'weight',
      type: "'medium' | 'semibold' | 'bold'",
      default: "'semibold'",
      description: 'Font weight.',
    },
    {
      component: 'Heading',
      name: 'align',
      type: "'start' | 'center' | 'end'",
      description: 'Text alignment.',
    },
    {
      component: 'Heading',
      name: 'tone',
      type: "'default' | 'muted'",
      default: "'default'",
      description: 'Colour.',
    },
    {
      component: 'Heading',
      name: 'balance',
      type: 'boolean',
      default: 'true',
      description: 'Balance multi-line headings.',
    },
  ],
  accessibility: [
    'Keep one h1 per page and do not skip levels. Screen-reader users navigate by heading.',
    'Display and 3xl sizes scale fluidly with clamp() and respect browser zoom.',
  ],
  guidelines: {
    do: ['Write headings that describe the content below.', 'Use sentence case.'],
    dont: ['Pick a level for its size; use size.'],
  },
  playground: {
    render: (p) => (
      <Heading level={Number(p.level) as 2} size={p.size === 'auto' ? undefined : (p.size as 'xl')}>
        {p.children as string}
      </Heading>
    ),
    controls: {
      level: { type: 'select', options: ['1', '2', '3', '4', '5', '6'], default: '2' },
      size: {
        type: 'select',
        options: ['auto', 'display', '3xl', '2xl', 'xl', 'lg', 'md', 'sm'],
        default: 'auto',
      },
      children: { type: 'text', default: 'Email signatures for every team' },
    },
  },
  related: ['text', 'rich-text'],
};

export function Basic() {
  return <Heading level={2}>Organisation templates</Heading>;
}

export function Scale() {
  return (
    <Stack gap={3}>
      {(['display', '3xl', '2xl', 'xl', 'lg', 'md', 'sm'] as const).map((s) => (
        <Heading key={s} level={3} size={s}>
          {s} · One system
        </Heading>
      ))}
    </Stack>
  );
}

export function Decoupled() {
  return (
    <Stack gap={1}>
      <Text eyebrow>Contracts</Text>
      <Heading level={1} size="2xl">
        Master services agreement
      </Heading>
      <Heading level={2} size="md" tone="muted" weight="medium">
        Acme Ltd · Draft v3
      </Heading>
    </Stack>
  );
}

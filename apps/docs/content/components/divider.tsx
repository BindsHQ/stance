import { Button, Divider, Stack, Text } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'divider',
  name: 'Divider',
  category: 'foundations',
  summary: 'Separates sections of content, optionally with a short label such as “or”.',
  description:
    'Divider marks a change of topic between sections. It renders a native thematic break (<hr>), or a labelled separator when it carries text. Inside menus and toolbars, use the lighter Separator.',
  imports: ['Divider'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', layout: 'fill' },
    { name: 'Labelled', title: 'With label', layout: 'fill' },
    { name: 'Variants', title: 'Tone and style', layout: 'fill' },
  ],
  props: [
    {
      component: 'Divider',
      name: 'label',
      type: 'ReactNode',
      description: 'Text shown in the line.',
    },
    {
      component: 'Divider',
      name: 'labelPosition',
      type: "'start' | 'center' | 'end'",
      default: "'center'",
      description: 'Label alignment.',
    },
    {
      component: 'Divider',
      name: 'spacing',
      type: 'SpaceKey',
      default: '6',
      description: 'Vertical margin.',
    },
    {
      component: 'Divider',
      name: 'tone',
      type: "'subtle' | 'default' | 'strong'",
      default: "'default'",
      description: 'Line strength.',
    },
    {
      component: 'Divider',
      name: 'variant',
      type: "'solid' | 'dashed'",
      default: "'solid'",
      description: 'Line style.',
    },
  ],
  accessibility: [
    'Unlabelled dividers are <hr> elements, announced as separators.',
    'Labelled dividers use role="separator" and expose their text.',
    'Lines become CanvasText in Windows forced-colours mode.',
  ],
  guidelines: {
    do: ['Use between distinct sections.'],
    dont: ['Use a divider under every heading; whitespace usually suffices.'],
  },
  related: ['separator'],
};

export function Basic() {
  return (
    <div style={{ width: '100%' }}>
      <Text size="sm">Signature details</Text>
      <Divider />
      <Text size="sm">Deployment settings</Text>
    </div>
  );
}

export function Labelled() {
  return (
    <Stack gap={0} style={{ width: '100%', maxWidth: 360 }}>
      <Button variant="outline" fullWidth>
        Continue with Microsoft
      </Button>
      <Divider label="or" spacing={4} />
      <Button fullWidth>Continue with email</Button>
    </Stack>
  );
}

export function Variants() {
  return (
    <div style={{ width: '100%' }}>
      <Divider tone="subtle" label="Subtle" labelPosition="start" />
      <Divider tone="strong" label="Strong" />
      <Divider variant="dashed" label="Dashed" labelPosition="end" />
    </div>
  );
}

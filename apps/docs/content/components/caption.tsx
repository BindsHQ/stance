import { Caption, Stack, Text } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'caption',
  name: 'Caption',
  category: 'typography',
  summary: 'Small supporting text for figures, timestamps and footnotes.',
  description:
    'Caption is 12px secondary text. Use it with `as="figcaption"` under figures, and for timestamps, footnotes and legal small print. For text that helps someone fill in a form field, use the description of FormField, which is linked to the control.',
  imports: ['Caption'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', layout: 'start' },
    { name: 'Figure', title: 'Figure caption' },
    { name: 'Tones', title: 'Tones', layout: 'start' },
  ],
  props: [
    {
      component: 'Caption',
      name: 'as',
      type: 'keyof JSX.IntrinsicElements',
      default: "'p'",
      description: 'Element; use figcaption inside figures.',
    },
    {
      component: 'Caption',
      name: 'tone',
      type: "'muted' | 'subtle' | 'default' | 'danger'",
      default: "'muted'",
      description: 'Colour.',
    },
    {
      component: 'Caption',
      name: 'align',
      type: "'start' | 'center' | 'end'",
      description: 'Alignment.',
    },
  ],
  accessibility: [
    'Muted captions meet 4.5:1 contrast in every theme.',
    'Use figcaption so the caption is associated with its figure.',
  ],
  guidelines: {
    do: ['Keep captions to one or two lines.'],
    dont: ['Put essential instructions in captions.'],
  },
  related: ['text', 'image'],
};

export function Basic() {
  return (
    <Stack gap={1}>
      <Text size="sm" weight="medium">
        Deployment completed
      </Text>
      <Caption>11 November 2026 at 09:42 · by Priya Raman</Caption>
    </Stack>
  );
}

export function Figure() {
  return (
    <figure style={{ margin: 0, width: 280 }}>
      <div
        style={{ height: 120, borderRadius: 8, background: 'var(--st-color-bg-muted)' }}
        aria-hidden="true"
      />
      <Caption as="figcaption" align="center" style={{ marginTop: 8 }}>
        Signature preview in Outlook for Mac
      </Caption>
    </figure>
  );
}

export function Tones() {
  return (
    <Stack gap={1}>
      <Caption tone="default">Default</Caption>
      <Caption>Muted</Caption>
      <Caption tone="subtle">Subtle</Caption>
      <Caption tone="danger">Danger</Caption>
    </Stack>
  );
}

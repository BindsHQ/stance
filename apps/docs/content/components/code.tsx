import { Code, Text } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'code',
  name: 'Code',
  category: 'typography',
  summary: 'Inline code for identifiers, values and file names in running text.',
  description:
    'Use Code for short fragments inside a sentence. For multi-line samples use CodeBlock, and for one line the reader should copy use CopyableCode.',
  imports: ['Code'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', layout: 'start' },
    { name: 'Plain', title: 'Plain', layout: 'start' },
    { name: 'Small', title: 'Small', layout: 'start' },
  ],
  props: [
    {
      component: 'Code',
      name: 'variant',
      type: "'muted' | 'plain'",
      default: "'muted'",
      description: 'With or without a background chip.',
    },
    {
      component: 'Code',
      name: 'size',
      type: "'sm' | 'md'",
      default: "'md'",
      description: 'Relative size.',
    },
  ],
  accessibility: [
    'Renders <code>, which assistive technology can announce as code.',
    'Long values wrap anywhere instead of overflowing.',
  ],
  guidelines: {
    do: ['Use for literal values the reader might type.'],
    dont: ['Use for emphasis.'],
  },
  related: ['code-block', 'copyable-code', 'kbd'],
};

export function Basic() {
  return (
    <Text size="sm">
      Set <Code>STANCE_THEME</Code> to <Code>high-contrast</Code> to preview the accessible theme.
    </Text>
  );
}

export function Plain() {
  return (
    <Text size="sm">
      Templates live in <Code variant="plain">/dashboard/templates</Code>.
    </Text>
  );
}

export function Small() {
  return (
    <Text size="sm">
      Organisation ID: <Code size="sm">org_8f2c91</Code>
    </Text>
  );
}

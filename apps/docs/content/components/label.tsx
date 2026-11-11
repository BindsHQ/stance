import { Input, Label, Stack } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'label',
  name: 'Label',
  category: 'forms',
  summary: 'A form label with required and optional indicators.',
  description:
    'Label names a form control. In most forms, use FormField, which renders the label and wires up ids, descriptions and errors for you. Use Label directly for custom controls or layouts that FormField does not cover.',
  imports: ['Label'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', layout: 'start' },
    { name: 'RequiredOptional', title: 'Required and optional', layout: 'start' },
    { name: 'Sizes', title: 'Sizes and disabled', layout: 'start' },
  ],
  props: [
    {
      component: 'Label',
      name: 'htmlFor',
      type: 'string',
      description: 'Id of the labelled control.',
    },
    {
      component: 'Label',
      name: 'required',
      type: 'boolean',
      description: 'Shows * and announces “required”.',
    },
    {
      component: 'Label',
      name: 'optionalText',
      type: 'ReactNode',
      description: 'Marker for optional fields.',
    },
    { component: 'Label', name: 'disabled', type: 'boolean', description: 'Disabled styling.' },
    {
      component: 'Label',
      name: 'size',
      type: "'sm' | 'md'",
      default: "'md'",
      description: 'Text size.',
    },
  ],
  accessibility: [
    'Always connect the label with htmlFor, or let FormField do it.',
    'The asterisk is aria-hidden; screen readers hear “(required)” instead.',
  ],
  guidelines: {
    do: ['Mark whichever is rarer, required or optional.'],
    dont: ['Use placeholder text instead of a label.'],
  },
  related: ['form-field', 'input'],
};

export function Basic() {
  return (
    <Stack gap={2} style={{ width: 280 }}>
      <Label htmlFor="docs-label-basic">Job title</Label>
      <Input id="docs-label-basic" defaultValue="Head of Legal" />
    </Stack>
  );
}

export function RequiredOptional() {
  return (
    <Stack gap={3}>
      <Label required>Work email</Label>
      <Label optionalText="Optional">Mobile number</Label>
    </Stack>
  );
}

export function Sizes() {
  return (
    <Stack gap={3}>
      <Label>Medium label</Label>
      <Label size="sm">Small label</Label>
      <Label disabled>Disabled label</Label>
    </Stack>
  );
}

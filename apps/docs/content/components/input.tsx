import { FormField, Icon, Input } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'input',
  name: 'Input',
  category: 'forms',
  summary: 'A single-line text field with sizes, affixes and validation states.',
  description:
    'Use Input for short free-text values: names, emails, URLs, reference numbers. Wrap it in FormField to get a label, help text and error message wired up automatically. For multi-line text use Textarea; for numbers with steppers use NumberInput.',
  imports: ['Input', 'FormField'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', layout: 'start' },
    {
      name: 'Sizes',
      title: 'Sizes',
      description: 'Heights match Button sizes so controls line up in toolbars.',
      layout: 'start',
    },
    {
      name: 'Affixes',
      title: 'Prefix and suffix',
      description: 'Static text or icons inside the field box.',
      layout: 'start',
    },
    { name: 'States', title: 'States', layout: 'start' },
  ],
  props: [
    {
      component: 'Input',
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
      default: "'md'",
      description: 'Control height: 32, 40 or 48px.',
    },
    {
      component: 'Input',
      name: 'invalid',
      type: 'boolean',
      description: 'Marks the field invalid. Set automatically inside a FormField with an error.',
    },
    {
      component: 'Input',
      name: 'prefix',
      type: 'ReactNode',
      description: 'Content before the text, inside the field box.',
    },
    {
      component: 'Input',
      name: 'suffix',
      type: 'ReactNode',
      description: 'Content after the text, inside the field box.',
    },
    {
      component: 'Input',
      name: 'wrapperClassName',
      type: 'string',
      description: 'Class for the outer box; className goes to the <input>.',
    },
    {
      component: 'Input',
      name: 'type',
      type: 'string',
      default: "'text'",
      description: 'Native input type.',
    },
    {
      component: 'Input',
      name: '...props',
      type: 'InputHTMLAttributes',
      description: 'All native input attributes; the ref targets the <input>.',
    },
  ],
  accessibility: [
    'Always give the input a visible label via FormField, or aria-label when a visible label is genuinely redundant.',
    'Inside FormField the input receives id, aria-describedby (description and error), aria-invalid, required and disabled automatically.',
    'Placeholders are hints, not labels: they disappear on input and have lower contrast.',
    'Focus is shown by a solid ring on the whole field box, including in high contrast mode.',
    'Use the correct type and autoComplete (email, tel, url) to get the right mobile keyboard and autofill.',
  ],
  keyboard: [{ keys: ['Tab'], description: 'Moves focus to and from the input.' }],
  guidelines: {
    do: [
      'Size the field to the expected length of the value.',
      'Explain format requirements in the description, before the user makes a mistake.',
    ],
    dont: ['Use placeholder text as the only label.', 'Disable paste on email or password fields.'],
  },
  playground: {
    render: (p) => (
      <FormField
        label={p.label as string}
        description={p.description as string}
        error={(p.error as string) || undefined}
        required={p.required as boolean}
        disabled={p.disabled as boolean}
      >
        <Input size={p.size as 'md'} placeholder={p.placeholder as string} />
      </FormField>
    ),
    controls: {
      label: { type: 'text', default: 'Organisation name' },
      description: { type: 'text', default: 'Shown on every email signature.' },
      placeholder: { type: 'text', default: 'Binds Ltd' },
      error: { type: 'text', default: '' },
      size: { type: 'select', options: ['sm', 'md', 'lg'], default: 'md' },
      required: { type: 'boolean', default: false },
      disabled: { type: 'boolean', default: false },
    },
  },
  related: ['form-field', 'textarea', 'search-input', 'password-input', 'number-input'],
};

export function Basic() {
  return (
    <div style={{ width: '100%', maxWidth: 360 }}>
      <FormField label="Work email" description="We send signing requests to this address.">
        <Input type="email" autoComplete="email" placeholder="name@company.com" />
      </FormField>
    </div>
  );
}

export function Sizes() {
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 360 }}>
      <Input size="sm" aria-label="Small" placeholder="Small" />
      <Input size="md" aria-label="Medium" placeholder="Medium" />
      <Input size="lg" aria-label="Large" placeholder="Large" />
    </div>
  );
}

export function Affixes() {
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 360 }}>
      <FormField label="Company website">
        <Input prefix="https://" placeholder="binds.si" />
      </FormField>
      <FormField label="Signature link">
        <Input prefix={<Icon name="link" />} suffix=".esignify.com" defaultValue="acme" />
      </FormField>
    </div>
  );
}

export function States() {
  return (
    <div style={{ display: 'grid', gap: 16, width: '100%', maxWidth: 360 }}>
      <FormField label="Contract reference" error="Reference must start with CT-">
        <Input defaultValue="2026-114" />
      </FormField>
      <FormField label="Account ID" disabled>
        <Input defaultValue="acc_81f2" />
      </FormField>
      <FormField label="Created by" readOnly>
        <Input defaultValue="Priya Raman" />
      </FormField>
    </div>
  );
}
